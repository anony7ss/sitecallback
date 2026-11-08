const { MongoClient } = require("mongodb");

let mongoClientPromise = null;

async function checkDatabase(mongoUri) {
  let targetUri = mongoUri;
  if (!targetUri || targetUri.includes("mongodbraid")) {
    targetUri = "mongodb+srv://gabrieldev07s:IHB1K6fpgBUeAOmu@nyxwaree.lc22vul.mongodb.net/nyxware?retryWrites=true&w=majority";
  }

  try {
    if (!mongoClientPromise) {
      mongoClientPromise = new MongoClient(targetUri, { serverSelectionTimeoutMS: 3000 }).connect();
    }
    const client = await mongoClientPromise;
    await client.db().command({ ping: 1 });
    return { ok: true, status: "connected", cluster: "nyxwaree.lc22vul.mongodb.net" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

exports.handler = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const dbStatus = await checkDatabase(mongoUri);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      ok: dbStatus.ok,
      system: "Nyxware Identity Gateway",
      version: "2.5.0",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      env: {
        OAUTH_CLIENT_ID: Boolean(process.env.OAUTH_CLIENT_ID || process.env.DISCORD_CLIENT_ID),
        OAUTH_CLIENT_SECRET: Boolean(process.env.OAUTH_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET),
        OAUTH_REDIRECT_URI: Boolean(process.env.OAUTH_REDIRECT_URI || process.env.DISCORD_OAUTH_REDIRECT_URI),
        OAUTH_TOKEN_SECRET: Boolean(process.env.OAUTH_TOKEN_SECRET || process.env.TOKEN_ENCRYPTION_KEY),
        MONGODB_URI: Boolean(mongoUri),
        DISCORD_TOKEN: Boolean(process.env.DISCORD_TOKEN),
      },
    }),
  };
};
