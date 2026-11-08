const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const DISCORD_API = "https://discord.com/api/v10";
const REQUIRED_SCOPES = ["identify", "guilds.join"];
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let mongoClientPromise = null;

function getConfig() {
  // Garantir fallback automático para o cluster ativo caso o Netlify esteja com a URI legada
  let mongoUri = (process.env.MONGODB_URI || "").trim();
  if (!mongoUri || mongoUri.includes("mongodbraid")) {
    mongoUri = "mongodb+srv://gabrieldev07s:IHB1K6fpgBUeAOmu@nyxwaree.lc22vul.mongodb.net/nyxware?retryWrites=true&w=majority";
  }

  // Normalizar redirectUri para evitar falhas por trailing slash ou espaços
  let redirectUri = (process.env.OAUTH_REDIRECT_URI || "https://404callback.netlify.app/oauth/callback").trim();
  redirectUri = redirectUri.replace(/\/+$/, "");
  if (!redirectUri.includes("/oauth/callback")) {
    redirectUri = `${redirectUri}/oauth/callback`;
  }

  return {
    clientId: (process.env.OAUTH_CLIENT_ID || process.env.DISCORD_CLIENT_ID || "1446199362194636800").trim(),
    clientSecret: (process.env.OAUTH_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET || "t4iOmvKK97XEI3ph0X1fVI8Ds1Huzo4f").trim(),
    redirectUri,
    encryptionSecret: (process.env.OAUTH_TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY || "e661d4dbe361e3218d21464117efc8b882e1c521e77ff6d9db4833f33a2ac5a9").trim(),
    mongoUri,
    botToken: (process.env.DISCORD_TOKEN || "").trim(),
  };
}

function requireConfig() {
  const config = getConfig();
  const missing = [];

  if (!config.clientId) missing.push("OAUTH_CLIENT_ID");
  if (!config.clientSecret) missing.push("OAUTH_CLIENT_SECRET");
  if (!config.redirectUri) missing.push("OAUTH_REDIRECT_URI");
  if (!config.encryptionSecret) missing.push("OAUTH_TOKEN_SECRET");
  if (!config.mongoUri) missing.push("MONGODB_URI");

  if (missing.length > 0) {
    throw new Error(`Configurações de ambiente ausentes: ${missing.join(", ")}`);
  }

  return config;
}

function getEncryptionKey() {
  return crypto.createHash("sha256").update(requireConfig().encryptionSecret).digest();
}

function encryptToken(value) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

function signState(payload) {
  return crypto.createHmac("sha256", requireConfig().encryptionSecret).update(payload).digest("base64url");
}

function verifyState(state) {
  const [payload, signature] = String(state || "").split(".");

  if (!payload || !signature) {
    throw new Error("Parâmetro de segurança (state) inválido ou malformado.");
  }

  const expected = signState(payload);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new Error("Assinatura de segurança OAuth2 incompatível. Gere um novo link no servidor.");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

  if (!decoded.guildId || !decoded.issuedAt || Date.now() - decoded.issuedAt > STATE_MAX_AGE_MS) {
    throw new Error("O link de autorização expirou. Por favor, gere um novo no servidor.");
  }

  return decoded;
}

async function getDb() {
  const { mongoUri } = requireConfig();

  if (!mongoClientPromise) {
    mongoClientPromise = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
    }).connect();
  }

  const client = await mongoClientPromise;
  return client.db();
}

async function discordRequest(path, options = {}) {
  const response = await fetch(`${DISCORD_API}${path}`, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (_) {
    body = null;
  }

  if (!response.ok) {
    let detail = body?.error_description || body?.message || text || `HTTP ${response.status}`;
    // Mensagens amigáveis para erros comuns do Discord
    if (body?.error === "invalid_grant") {
      detail = "O código de autorização expirou ou já foi utilizado. Solicite um novo link no Discord.";
    }
    const error = new Error(detail);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

async function exchangeCode(code) {
  const config = requireConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });

  return discordRequest("/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
}

async function getCurrentUser(accessToken) {
  return discordRequest("/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function expiresAtFromToken(tokenData) {
  return new Date(Date.now() + Number(tokenData.expires_in || 0) * 1000);
}

async function saveAuthorization(guildId, tokenData, user) {
  const db = await getDb();
  const now = new Date();

  await db.collection("oauthmembertokens").updateOne(
    { guildId, userId: user.id },
    {
      $set: {
        guildId,
        userId: user.id,
        username: user.username || null,
        globalName: user.global_name || null,
        accessToken: encryptToken(tokenData.access_token),
        refreshToken: encryptToken(tokenData.refresh_token),
        tokenType: tokenData.token_type || "Bearer",
        scope: tokenData.scope || REQUIRED_SCOPES.join(" "),
        expiresAt: expiresAtFromToken(tokenData),
        consentedAt: now,
        revokedAt: null,
        lastError: null,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

async function addGuildMember(guildId, userId, accessToken) {
  const { botToken } = requireConfig();
  if (!botToken) return;

  await discordRequest(`/guilds/${guildId}/members/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: accessToken }),
  }).catch(() => null);
}

async function addGuildMemberRole(guildId, userId, roleId) {
  const { botToken } = requireConfig();
  if (!botToken || !roleId) return;

  await discordRequest(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  }).catch(() => null);
}

async function removeGuildMemberRole(guildId, userId, roleId) {
  const { botToken } = requireConfig();
  if (!botToken || !roleId) return;

  await discordRequest(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  }).catch(() => null);
}

async function applyOAuthVerification(guildId, userId, accessToken) {
  try {
    const db = await getDb();
    const guildConfig = await db.collection("guilds").findOne({ guildId });
    const verification = guildConfig?.verification || {};

    if (!verification.enabled || verification.mode !== "oauth" || !verification.roleId) {
      return { applied: false };
    }

    await addGuildMember(guildId, userId, accessToken);
    await addGuildMemberRole(guildId, userId, verification.roleId);

    if (verification.preVerificationRoleId) {
      await removeGuildMemberRole(guildId, userId, verification.preVerificationRoleId);
    }

    return { applied: true, roleId: verification.roleId };
  } catch (_) {
    return { applied: false };
  }
}

exports.handler = async (event) => {
  const headers = event.headers || {};
  const acceptsJson = (headers.accept || headers.Accept || "").includes("application/json");

  try {
    const params = event.queryStringParameters || {};
    let code = params.code;
    let state = params.state;

    if (event.body) {
      try {
        const parsed = JSON.parse(event.body);
        if (parsed.code) code = parsed.code;
        if (parsed.state) state = parsed.state;
      } catch (_) {}
    }

    if (!code || !state) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: "Parâmetros code ou state não foram fornecidos pelo Discord.",
        }),
      };
    }

    const stateData = verifyState(state);
    const tokenData = await exchangeCode(code);
    const scopes = String(tokenData.scope || "").split(/\s+/);

    for (const scope of REQUIRED_SCOPES) {
      if (!scopes.includes(scope)) {
        throw new Error(`Permissão de segurança não autorizada: ${scope}`);
      }
    }

    const user = await getCurrentUser(tokenData.access_token);
    await saveAuthorization(stateData.guildId, tokenData, user);

    const verificationResult =
      stateData.source === "verification"
        ? await applyOAuthVerification(stateData.guildId, user.id, tokenData.access_token)
        : { applied: false };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          global_name: user.global_name,
          avatar: user.avatar,
        },
        roleApplied: verificationResult.applied,
        guildId: stateData.guildId,
      }),
    };
  } catch (error) {
    console.error("Erro no gateway Nyxware:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "Falha na comunicação com o gateway.",
      }),
    };
  }
};
