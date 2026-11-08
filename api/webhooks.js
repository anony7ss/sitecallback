import crypto from 'crypto';

const DEFAULT_PUBLIC_KEY = 'b5ef1a35ea8bfeafe13b6ebd009975dabb3101681796c986b3a390e3a8a04b5e';

function getHeader(headers, name) {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
}

function verifySignature(bodyBuffer, signature, timestamp, clientPublicKey) {
  if (!signature || !timestamp || !clientPublicKey) return false;
  try {
    const der = Buffer.concat([
      Buffer.from('302a300506032b6570032100', 'hex'),
      Buffer.from(clientPublicKey, 'hex'),
    ]);
    const key = crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });
    const message = Buffer.concat([Buffer.from(timestamp, 'utf8'), bodyBuffer]);
    return crypto.verify(null, message, key, Buffer.from(signature, 'hex'));
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

  const signature = getHeader(event.headers, 'x-signature-ed25519');
  const timestamp = getHeader(event.headers, 'x-signature-timestamp');

  if (!signature || !timestamp) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing signature headers' }),
    };
  }

  const rawBodyBuffer = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64')
    : Buffer.from(event.body || '', 'utf8');

  const publicKey = (process.env.DISCORD_PUBLIC_KEY || DEFAULT_PUBLIC_KEY).trim();

  const isVerified = verifySignature(rawBodyBuffer, signature, timestamp, publicKey);
  if (!isVerified) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid request signature' }),
    };
  }

  let payload = {};
  try {
    payload = JSON.parse(rawBodyBuffer.toString('utf8'));
  } catch (_) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    };
  }

  // Type 1 = PING (Handshake do Discord para validação de endpoint)
  if (payload.type === 1) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 1 }),
    };
  }

  // Event handling (Dispatched Events)
  const eventType = payload.event?.type || payload.type || 'UNKNOWN';
  console.log(`[Nyxware Webhook Event]: ${eventType}`, JSON.stringify(payload));

  // Discord espera 204 No Content ou 200 OK
  return {
    statusCode: 204,
    headers: { 'Content-Type': 'application/json' },
    body: '',
  };
};

export default handler;
