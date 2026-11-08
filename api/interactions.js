const crypto = require("crypto");

function verifySignature(body, signature, timestamp, clientPublicKey) {
  if (!signature || !timestamp || !clientPublicKey) return false;
  try {
    const publicKeyDer = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      Buffer.from(clientPublicKey, "hex"),
    ]);

    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyDer.toString("base64")}\n-----END PUBLIC KEY-----`;

    return crypto.verify(
      null,
      Buffer.from(timestamp + body),
      publicKeyPem,
      Buffer.from(signature, "hex")
    );
  } catch (_) {
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const signature = event.headers["x-signature-ed25519"] || event.headers["X-Signature-Ed25519"];
  const timestamp = event.headers["x-signature-timestamp"] || event.headers["X-Signature-Timestamp"];
  const rawBody = event.body || "";

  const publicKey = (process.env.DISCORD_PUBLIC_KEY || "").trim();

  if (publicKey) {
    const isValid = verifySignature(rawBody, signature, timestamp, publicKey);
    if (!isValid) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Invalid request signature" }),
      };
    }
  }

  let message = {};
  try {
    message = JSON.parse(rawBody);
  } catch (_) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Bad Request" }),
    };
  }

  // Type 1 = PING (Discord checa isso ao salvar o URL no Developer Portal)
  if (message.type === 1) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 1 }),
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: "Nyxware Gateway HTTP Endpoint ativo.",
        flags: 64, // EPHEMERAL
      },
    }),
  };
};
