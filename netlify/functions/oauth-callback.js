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
    throw new Error(`Configurações de ambiente ausentes no Netlify: ${missing.join(", ")}`);
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
    throw new Error("Parâmetro de estado (state) inválido ou malformado.");
  }

  const expected = signState(payload);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new Error("Assinatura de segurança OAuth2 incompatível. O token pode pertencer a outra sessão.");
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
    mongoClientPromise = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 }).connect();
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
    throw new Error("DISCORD_TOKEN ausente para vincular membro ao servidor.");
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
  if (!botToken) return;

  await discordRequest(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });
}

async function removeGuildMemberRole(guildId, userId, roleId) {
  const { botToken } = requireConfig();
  if (!botToken) return;

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderHtmlFallback({ title, message, user = null, isSuccess = true }) {
  const username = user?.global_name || user?.username || "";
  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} • Absolute Security</title>
  <style>
    :root { --bg: #08090d; --card: #0e1017; --border: rgba(255, 255, 255, 0.08); --text: #f4f5f8; --muted: #9aa0ac; --green: #10b981; --red: #ef4444; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; -webkit-font-smoothing: antialiased; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 36px 30px; text-align: center; max-width: 420px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .icon { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
    .icon.success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: var(--green); }
    .icon.error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: var(--red); }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; }
    p { font-size: 14px; color: var(--muted); line-height: 1.5; margin-bottom: 24px; }
    .user { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border); border-radius: 20px; margin-bottom: 20px; }
    .user img { width: 22px; height: 22px; border-radius: 50%; }
    .user span { font-size: 13px; font-weight: 500; }
    .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 12px 20px; background: #232733; border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; border-radius: 10px; font-size: 14px; font-weight: 500; text-decoration: none; transition: background 0.15s; }
    .btn:hover { background: #2b3040; }
    .hint { font-size: 11px; color: #585d6b; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon ${isSuccess ? "success" : "error"}">
      ${isSuccess
        ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
      }
    </div>
    ${user ? `<div class="user"><img src="${escapeHtml(avatarUrl)}"><span>${escapeHtml(username)}</span></div>` : ""}
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a href="discord://" class="btn">Voltar para o Discord</a>
    <div class="hint">Você já pode fechar esta aba com segurança.</div>
  </div>
</body>
</html>`;
}

exports.handler = async (event) => {
  const headers = event.headers || {};
  const acceptsJson = (headers.accept || headers.Accept || "").includes("application/json");

  try {
    const params = event.queryStringParameters || {};
    let code = params.code;
    let state = params.state;

    // Também aceita body JSON se chamado via POST
    if (event.body) {
      try {
        const parsed = JSON.parse(event.body);
        if (parsed.code) code = parsed.code;
        if (parsed.state) state = parsed.state;
      } catch (_) {}
    }

    if (!code || !state) {
      if (acceptsJson) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ success: false, error: "Parâmetros code ou state ausentes." }),
        };
      }
      return {
        statusCode: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: renderHtmlFallback({
          title: "Autorização Inválida",
          message: "O Discord não enviou os parâmetros necessários. Por favor, gere um novo link.",
          isSuccess: false,
        }),
      };
    }

    const stateData = verifyState(state);
    const tokenData = await exchangeCode(code);
    const scopes = String(tokenData.scope || "").split(/\s+/);

    for (const scope of REQUIRED_SCOPES) {
      if (!scopes.includes(scope)) {
        throw new Error(`Permissão obrigatória não concedida pelo usuário: ${scope}`);
      }
    }

    const user = await getCurrentUser(tokenData.access_token);
    await saveAuthorization(stateData.guildId, tokenData, user);

    const verificationResult =
      stateData.source === "verification"
        ? await applyOAuthVerification(stateData.guildId, user.id, tokenData.access_token)
        : { applied: false };

    if (acceptsJson) {
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
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
      body: renderHtmlFallback({
        title: "Verificação Concluída",
        message: verificationResult.applied
          ? "Sua identidade foi verificada e seu cargo foi aplicado com sucesso no servidor."
          : "Sua autorização foi salva com sucesso no sistema de segurança.",
        user,
        isSuccess: true,
      }),
    };
  } catch (error) {
    console.error("Erro no callback OAuth2:", error);

    if (acceptsJson) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({
          success: false,
          error: error.message || "Erro interno durante a autorização.",
        }),
      };
    }

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
      body: renderHtmlFallback({
        title: "Falha na Autorização",
        message: error.message || "Não foi possível concluir a autorização. Gere um novo link no Discord.",
        isSuccess: false,
      }),
    };
  }
};
