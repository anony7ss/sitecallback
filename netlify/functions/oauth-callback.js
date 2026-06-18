const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const DISCORD_API = "https://discord.com/api/v10";
const REQUIRED_SCOPES = ["identify", "guilds.join"];
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let mongoClientPromise = null;

function getConfig() {
  return {
    clientId: process.env.OAUTH_CLIENT_ID || process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET || process.env.CLIENT_SECRET,
    redirectUri: process.env.OAUTH_REDIRECT_URI || process.env.DISCORD_OAUTH_REDIRECT_URI,
    encryptionSecret: process.env.OAUTH_TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY,
    mongoUri: process.env.MONGODB_URI,
    botToken: process.env.DISCORD_TOKEN,
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
    throw new Error(`Variaveis faltando: ${missing.join(", ")}`);
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
    throw new Error("State OAuth2 invalido");
  }

  const expected = signState(payload);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new Error("State OAuth2 adulterado");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

  if (!decoded.guildId || !decoded.issuedAt || Date.now() - decoded.issuedAt > STATE_MAX_AGE_MS) {
    throw new Error("State OAuth2 expirado");
  }

  return decoded;
}

async function getDb() {
  const { mongoUri } = requireConfig();

  if (!mongoClientPromise) {
    mongoClientPromise = new MongoClient(mongoUri).connect();
  }

  const client = await mongoClientPromise;
  return client.db();
}

async function discordRequest(path, options = {}) {
  const response = await fetch(`${DISCORD_API}${path}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = body?.message || text || `HTTP ${response.status}`;
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

  if (!botToken) {
    throw new Error("DISCORD_TOKEN faltando para aplicar verificacao");
  }

  return discordRequest(`/guilds/${guildId}/members/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: accessToken }),
  });
}

async function addGuildMemberRole(guildId, userId, roleId) {
  const { botToken } = requireConfig();

  if (!botToken) {
    throw new Error("DISCORD_TOKEN faltando para aplicar cargo");
  }

  await discordRequest(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });
}

async function removeGuildMemberRole(guildId, userId, roleId) {
  const { botToken } = requireConfig();

  if (!botToken) {
    return;
  }

  await discordRequest(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });
}

async function applyOAuthVerification(guildId, userId, accessToken) {
  const db = await getDb();
  const guildConfig = await db.collection("guilds").findOne({ guildId });
  const verification = guildConfig?.verification || {};

  if (!verification.enabled || verification.mode !== "oauth" || !verification.roleId) {
    return { applied: false };
  }

  await addGuildMember(guildId, userId, accessToken);
  await addGuildMemberRole(guildId, userId, verification.roleId);

  if (verification.preVerificationRoleId) {
    await removeGuildMemberRole(guildId, userId, verification.preVerificationRoleId).catch(() => null);
  }

  return { applied: true, roleId: verification.roleId };
}

function htmlPage(title, message) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #111318; color: #f4f4f5; display: grid; min-height: 100vh; place-items: center; margin: 0; }
    main { max-width: 560px; padding: 32px; }
    h1 { font-size: 28px; margin: 0 0 12px; }
    p { color: #c7c9d1; line-height: 1.5; }
  </style>
</head>
<body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p></main></body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function htmlResponse(statusCode, title, message) {
  return {
    statusCode,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: htmlPage(title, message),
  };
}

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const code = params.code;
    const state = params.state;

    if (!code || !state) {
      return htmlResponse(400, "Autorizacao invalida", "O Discord nao enviou code/state para concluir o processo.");
    }

    const stateData = verifyState(state);
    const tokenData = await exchangeCode(code);
    const scopes = String(tokenData.scope || "").split(/\s+/);

    for (const scope of REQUIRED_SCOPES) {
      if (!scopes.includes(scope)) {
        throw new Error(`Usuario nao autorizou o scope obrigatorio: ${scope}`);
      }
    }

    const user = await getCurrentUser(tokenData.access_token);
    await saveAuthorization(stateData.guildId, tokenData, user);

    const verificationResult =
      stateData.source === "verification"
        ? await applyOAuthVerification(stateData.guildId, user.id, tokenData.access_token)
        : { applied: false };

    return htmlResponse(
      200,
      "Autorizacao concluida",
      verificationResult.applied
        ? `Sua autorizacao foi salva e sua verificacao foi concluida no servidor ${stateData.guildId}. Voce ja pode fechar esta pagina.`
        : `Sua autorizacao foi salva para restauracao no servidor ${stateData.guildId}. Voce ja pode fechar esta pagina.`,
    );
  } catch (error) {
    console.error("Erro no callback OAuth2:", error);
    return htmlResponse(500, "Erro ao autorizar", "Nao foi possivel concluir a autorizacao. Gere um novo link e tente novamente.");
  }
};
