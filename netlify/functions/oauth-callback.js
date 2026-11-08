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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderCallbackHtml({ title, message, user = null, isSuccess = true }) {
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
    :root {
      --bg: #090a0d;
      --card: #111317;
      --border: rgba(255, 255, 255, 0.08);
      --text: #f4f5f7;
      --muted: #9aa0ac;
      --subtle: #171920;
      --green: #2ecc71;
      --red: #e74c3c;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }
    .shell { width: 100%; max-width: 440px; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 32px 28px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon-wrap {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      margin: 0 auto 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon-wrap.success {
      background: rgba(46, 204, 113, 0.1);
      border: 1px solid rgba(46, 204, 113, 0.25);
      color: var(--green);
    }
    .icon-wrap.error {
      background: rgba(231, 76, 60, 0.1);
      border: 1px solid rgba(231, 76, 60, 0.25);
      color: var(--red);
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2.5px solid rgba(255, 255, 255, 0.12);
      border-top-color: var(--text);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h1 { font-size: 20px; font-weight: 600; margin-bottom: 8px; letter-spacing: -0.01em; }
    p { font-size: 14px; color: var(--muted); line-height: 1.5; margin-bottom: 20px; }
    .user-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 14px 6px 8px;
      background: var(--subtle);
      border: 1px solid var(--border);
      border-radius: 20px;
      margin-bottom: 20px;
    }
    .avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
    .username { font-size: 13px; font-weight: 500; color: var(--text); }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 20px;
      background: #252830;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn:hover { background: #30343f; border-color: rgba(255, 255, 255, 0.2); }
    .hint { font-size: 12px; color: #585d6b; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="shell">
    <main class="card">
      <div id="loader-state" style="display: ${isSuccess ? "block" : "none"};">
        <div class="icon-wrap" style="background: var(--subtle); border: 1px solid var(--border);">
          <div class="spinner"></div>
        </div>
        <h1>Processando autorização...</h1>
        <p>Validando suas credenciais de forma segura com o Discord.</p>
      </div>

      <div id="result-state" style="display: ${isSuccess ? "none" : "block"};">
        <div class="icon-wrap ${isSuccess ? "success" : "error"}">
          ${
            isSuccess
              ? `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>`
              : `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>`
          }
        </div>

        ${
          user
            ? `<div class="user-pill">
                <img src="${escapeHtml(avatarUrl)}" alt="Avatar" class="avatar">
                <span class="username">${escapeHtml(username)}</span>
              </div>`
            : ""
        }

        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>

        <a href="discord://" class="btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Voltar para o Discord
        </a>

        <div class="hint">Você já pode fechar esta aba com segurança.</div>
      </div>
    </main>
  </div>

  ${
    isSuccess
      ? `<script>
          setTimeout(function() {
            var loader = document.getElementById("loader-state");
            var result = document.getElementById("result-state");
            if (loader && result) {
              loader.style.display = "none";
              result.style.display = "block";
            }
          }, 650);
        </script>`
      : ""
  }
</body>
</html>`;
}

function htmlResponse(statusCode, title, message, user = null, isSuccess = true) {
  return {
    statusCode,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: renderCallbackHtml({ title, message, user, isSuccess }),
  };
}

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const code = params.code;
    const state = params.state;

    if (!code || !state) {
      return htmlResponse(400, "Autorização Inválida", "O Discord não enviou os parâmetros necessários para concluir o processo.", null, false);
    }

    const stateData = verifyState(state);
    const tokenData = await exchangeCode(code);
    const scopes = String(tokenData.scope || "").split(/\s+/);

    for (const scope of REQUIRED_SCOPES) {
      if (!scopes.includes(scope)) {
        throw new Error(`Usuário não autorizou o scope obrigatório: ${scope}`);
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
      "Verificação Concluída",
      verificationResult.applied
        ? "Sua identidade foi verificada e seu cargo foi aplicado com sucesso no servidor."
        : "Sua conta foi vinculada com sucesso ao sistema de restauração e segurança.",
      user,
      true,
    );
  } catch (error) {
    console.error("Erro no callback OAuth2:", error);
    return htmlResponse(500, "Falha na Autorização", "Não foi possível concluir a autorização. Gere um novo link pelo Discord e tente novamente.", null, false);
  }
};
