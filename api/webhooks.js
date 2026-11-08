import crypto from 'crypto';

const DEFAULT_PUBLIC_KEY = 'b5ef1a35ea8bfeafe13b6ebd009975dabb3101681796c986b3a390e3a8a04b5e';

function verifySignature(body, signature, timestamp, clientPublicKey) {
  if (!signature || !timestamp || !clientPublicKey) return false;
  try {
    const publicKeyDer = Buffer.concat([
      Buffer.from('302a300506032b6570032100', 'hex'),
      Buffer.from(clientPublicKey, 'hex'),
    ]);

    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyDer.toString('base64')}\n-----END PUBLIC KEY-----`;

    return crypto.verify(
      null,
      Buffer.from(timestamp + body),
      publicKeyPem,
      Buffer.from(signature, 'hex')
    );
  } catch (_) {
    return false;
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const headers = event.headers || {};
  const signature = headers['x-signature-ed25519'];
  const timestamp = headers['x-signature-timestamp'];
  const rawBody = event.body || '';

  if (!signature || !timestamp) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing signature headers' }),
    };
  }

  const publicKey = (process.env.DISCORD_PUBLIC_KEY || DEFAULT_PUBLIC_KEY).trim();

  const isVerified = verifySignature(rawBody, signature, timestamp, publicKey);
  if (!isVerified) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request signature' }),
    };
  }

  let payload = {};
  try {
    payload = JSON.parse(rawBody);
  } catch (_) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  // Type 1 = PING handshake do Discord
  if (payload.type === 1) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 1 }),
    };
  }

  console.log(`[Nyxware Webhook Event]: ${payload.event?.type || payload.type || 'Desconhecido'}`);

  return {
    statusCode: 204,
    headers: { 'Content-Type': 'application/json' },
    body: '',
  };
};

export default handler;
