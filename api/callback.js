import crypto from 'crypto';
import { MongoClient } from 'mongodb';

const DISCORD_API = 'https://discord.com/api/v10';
const REQUIRED_SCOPES = ['identify', 'guilds.join'];
const STATE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let mongoClientPromise = null;

function getConfig() {
  let mongoUri = (process.env.MONGODB_URI || '').trim();
  if (!mongoUri || mongoUri.includes('mongodbraid')) {
    mongoUri = 'mongodb+srv://gabrieldev07s:IHB1K6fpgBUeAOmu@nyxwaree.lc22vul.mongodb.net/nyxware?retryWrites=true&w=majority';
  }

  let redirectUri = (process.env.OAUTH_REDIRECT_URI || 'https://404callback.netlify.app/oauth/callback').trim();
  redirectUri = redirectUri.replace(/\/+$/, '');
  if (!redirectUri.includes('/oauth/callback')) {
    redirectUri = `${redirectUri}/oauth/callback`;
  }

  return {
    clientId: (process.env.OAUTH_CLIENT_ID || process.env.DISCORD_CLIENT_ID || '1446199362194636800').trim(),
    clientSecret: (process.env.OAUTH_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET || 't4iOmvKK97XEI3ph0X1fVI8Ds1Huzo4f').trim(),
    redirectUri,
    encryptionSecret: (process.env.OAUTH_TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY || 'e661d4dbe361e3218d21464117efc8b882e1c521e77ff6d9db4833f33a2ac5a9').trim(),
    mongoUri,
    botToken: (process.env.DISCORD_TOKEN || '').trim(),
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
  const [payload, signature] = String(state || '').split('.');

  if (!payload || !signature) {
    throw new Error('Parâmetro de segurança (state) inválido ou malformado.');
  }

  const expected = signState(payload);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    throw new Error('Assinatura de segurança OAuth2 incompatível. Gere um novo link no servidor.');
  }

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

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
  params.append('code', code);
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
    let msg = data?.error_description || data?.message || text || `HTTP ${res.status}`;
    if (data?.error === 'invalid_grant') {
      msg = 'O código de autorização expirou ou já foi utilizado. Solicite um novo link no Discord.';
    }
    const err = new Error(msg);
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
  if (!res.ok) throw new Error('Falha ao consultar usuário no Discord.');
  return res.json();
}

async function saveAuthorization(guildId, tokenData, user) {
  const db = await getDb();
  const now = new Date();

  await db.collection('oauthmembertokens').updateOne(
    { guildId, userId: user.id },
    {
      $set: {
        guildId,
        userId: user.id,
        username: user.username || null,
        globalName: user.global_name || null,
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
    const guildConfig = await db.collection('guilds').findOne({ guildId });
    const verification = guildConfig?.verification || {};

    if (!verification.enabled || verification.mode !== 'oauth' || !verification.roleId) {
      return { applied: false };
    }

    await fetch(`${DISCORD_API}/guilds/${guildId}/members/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${config.botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    }).catch(() => null);

    await fetch(`${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${verification.roleId}`, {
      method: 'PUT',
      headers: { Authorization: `Bot ${config.botToken}` },
    }).catch(() => null);

    if (verification.preVerificationRoleId) {
      await fetch(`${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${verification.preVerificationRoleId}`, {
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
        headers: { 'Content-Type': 'application/json' },
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
    console.error('[Nyxware API Error]:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Falha interna no processamento.',
      }),
    };
  }
};

export default handler;
