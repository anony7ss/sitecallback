import crypto from 'crypto';
import { MongoClient } from 'mongodb';

const DISCORD_API = 'https://discord.com/api/v10';
const REQUIRED_SCOPES = ['identify', 'guilds.join'];
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let mongoClientPromise = null;

function getConfig() {
  const clientId = (process.env.OAUTH_CLIENT_ID || process.env.DISCORD_CLIENT_ID || '').trim();
  const clientSecret = (process.env.OAUTH_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET || '').trim();
  const rawRedirectUri = (process.env.OAUTH_REDIRECT_URI || process.env.DISCORD_OAUTH_REDIRECT_URI || '').trim();
  const encryptionSecret = (process.env.OAUTH_TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY || '').trim();
  const mongoUri = (process.env.MONGODB_URI || '').trim();
  const botToken = (process.env.DISCORD_TOKEN || '').trim();

  const missing = [];
  if (!clientId) missing.push('OAUTH_CLIENT_ID');
  if (!clientSecret) missing.push('OAUTH_CLIENT_SECRET');
  if (!encryptionSecret) missing.push('OAUTH_TOKEN_SECRET');
  if (!mongoUri) missing.push('MONGODB_URI');

  if (missing.length > 0) {
    throw new Error(`Ambiente incompleto no Netlify: ${missing.join(', ')} ausente(s).`);
  }

  // Canonical redirect URI extraction: Discord requires exact URI registered in portal
  let canonicalRedirectUri = 'https://404callback.netlify.app/oauth/callback';
  if (rawRedirectUri) {
    try {
      const parsed = new URL(rawRedirectUri);
      canonicalRedirectUri = `${parsed.origin}/oauth/callback`;
    } catch (_) {
      canonicalRedirectUri = 'https://404callback.netlify.app/oauth/callback';
    }
  }

  let cleanMongoUri = mongoUri;
  if (cleanMongoUri.includes('mongodbraid')) {
    cleanMongoUri = cleanMongoUri.replace(/mongodbraid[a-z0-9.]*\.mongodb\.net/i, 'nyxwaree.lc22vul.mongodb.net');
  }

  return {
    clientId,
    clientSecret,
    redirectUri: canonicalRedirectUri,
    encryptionSecret,
    mongoUri: cleanMongoUri,
    botToken,
  };
}

function getEncryptionKey() {
  return crypto.createHash('sha256').update(getConfig().encryptionSecret).digest();
}

function encryptToken(value) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
}

function signState(payload) {
  return crypto.createHmac('sha256', getConfig().encryptionSecret).update(payload).digest('base64url');
}

function verifyState(state) {
  const parts = String(state || '').split('.');
  if (parts.length !== 2) {
    throw new Error('Parâmetro de segurança (state) malformado.');
  }

  const [payload, signature] = parts;
  const expected = signState(payload);

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  // Proteção contra Timing Attacks com verificação segura de buffers
  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new Error('Assinatura de segurança OAuth2 incompatível. Gere um novo link no servidor.');
  }

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch (_) {
    throw new Error('Payload state corrompido.');
  }

  if (!decoded.guildId || !decoded.issuedAt || Date.now() - decoded.issuedAt > STATE_MAX_AGE_MS) {
    throw new Error('O link de autorização expirou. Por favor, gere um novo no servidor.');
  }

  return decoded;
}

async function getDb() {
  const { mongoUri } = getConfig();

  if (!mongoClientPromise) {
    mongoClientPromise = new MongoClient(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
    }).connect();
  }

  const client = await mongoClientPromise;
  return client.db();
}

async function exchangeCode(code) {
  const config = getConfig();
  const params = new URLSearchParams();
  params.append('client_id', config.clientId);
  params.append('client_secret', config.clientSecret);
  params.append('grant_type', 'authorization_code');
  params.append('code', String(code).trim());
  params.append('redirect_uri', config.redirectUri);

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_) {}

  if (!res.ok) {
    const detail = data?.error_description || data?.message || text || `Discord HTTP ${res.status}`;
    const err = new Error(detail);
    err.code = data?.error;
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

async function getCurrentUser(accessToken) {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Falha ao consultar perfil do usuário no Discord.');
  return res.json();
}

async function saveAuthorization(guildId, tokenData, user) {
  const db = await getDb();
  const now = new Date();

  // Sanitização estrita contra injeção NoSQL
  const cleanGuildId = String(guildId);
  const cleanUserId = String(user.id);

  await db.collection('oauthmembertokens').updateOne(
    { guildId: cleanGuildId, userId: cleanUserId },
    {
      $set: {
        guildId: cleanGuildId,
        userId: cleanUserId,
        username: user.username ? String(user.username) : null,
        globalName: user.global_name ? String(user.global_name) : null,
        accessToken: encryptToken(tokenData.access_token),
        refreshToken: encryptToken(tokenData.refresh_token),
        tokenType: tokenData.token_type || 'Bearer',
        scope: tokenData.scope || REQUIRED_SCOPES.join(' '),
        expiresAt: new Date(Date.now() + Number(tokenData.expires_in || 0) * 1000),
        consentedAt: now,
        revokedAt: null,
        lastError: null,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );
}

async function applyVerificationRole(guildId, userId, accessToken) {
  try {
    const config = getConfig();
    if (!config.botToken) return { applied: false };

    const db = await getDb();
    const cleanGuildId = String(guildId);
    const cleanUserId = String(userId);

    const guildConfig = await db.collection('guilds').findOne({ guildId: cleanGuildId });
    const verification = guildConfig?.verification || {};

    if (!verification.enabled || verification.mode !== 'oauth' || !verification.roleId) {
      return { applied: false };
    }

    await fetch(`${DISCORD_API}/guilds/${cleanGuildId}/members/${cleanUserId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${config.botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    }).catch(() => null);

    await fetch(`${DISCORD_API}/guilds/${cleanGuildId}/members/${cleanUserId}/roles/${verification.roleId}`, {
      method: 'PUT',
      headers: { Authorization: `Bot ${config.botToken}` },
    }).catch(() => null);

    if (verification.preVerificationRoleId) {
      await fetch(`${DISCORD_API}/guilds/${cleanGuildId}/members/${cleanUserId}/roles/${verification.preVerificationRoleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bot ${config.botToken}` },
      }).catch(() => null);
    }

    return { applied: true, roleId: verification.roleId };
  } catch (_) {
    return { applied: false };
  }
}

export const handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    let code = params.code;
    let state = params.state;

    if (event.body) {
      try {
        const bodyObj = JSON.parse(event.body);
        if (bodyObj.code) code = bodyObj.code;
        if (bodyObj.state) state = bodyObj.state;
      } catch (_) {}
    }

    if (!code || !state) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ success: false, error: 'Parâmetros code e state são obrigatórios.' }),
      };
    }

    const stateData = verifyState(state);
    const tokenData = await exchangeCode(code);
    const user = await getCurrentUser(tokenData.access_token);

    await saveAuthorization(stateData.guildId, tokenData, user);

    const verificationResult =
      stateData.source === 'verification'
        ? await applyVerificationRole(stateData.guildId, user.id, tokenData.access_token)
        : { applied: false };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
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
    console.error('[Nyxware Gateway Error]:', error);
    return {
      statusCode: error.status || 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Falha interna de autorização.',
        code: error.code || 'GATEWAY_ERROR',
      }),
    };
  }
};

export default handler;
