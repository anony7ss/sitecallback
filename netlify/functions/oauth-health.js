const { MongoClient } = require("mongodb");

let mongoClientPromise = null;

async function checkDatabase(mongoUri) {
  if (!mongoUri) return { ok: false, error: "MONGODB_URI ausente" };
  try {
    if (!mongoClientPromise) {
      mongoClientPromise = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 3000 }).connect();
    }
    const client = await mongoClientPromise;
    await client.db().command({ ping: 1 });
    return { ok: true, status: "connected" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

exports.handler = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const dbStatus = await checkDatabase(mongoUri);

  const envCheck = {
    OAUTH_CLIENT_ID: Boolean(process.env.OAUTH_CLIENT_ID || process.env.DISCORD_CLIENT_ID),
    OAUTH_CLIENT_SECRET: Boolean(process.env.OAUTH_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET),
    OAUTH_REDIRECT_URI: Boolean(process.env.OAUTH_REDIRECT_URI || process.env.DISCORD_OAUTH_REDIRECT_URI),
    OAUTH_TOKEN_SECRET: Boolean(process.env.OAUTH_TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY),
    MONGODB_URI: Boolean(mongoUri),
    DISCORD_TOKEN: Boolean(process.env.DISCORD_TOKEN),
  };

  const allConfigured = Object.values(envCheck).every(Boolean);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      ok: allConfigured && dbStatus.ok,
      system: "Absolute Security Gateway",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      env: envCheck,
    }),
  };
};
