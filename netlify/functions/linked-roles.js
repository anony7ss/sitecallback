const DISCORD_API = "https://discord.com/api/v10";

function getConfig() {
  return {
    clientId: (process.env.OAUTH_CLIENT_ID || process.env.DISCORD_CLIENT_ID || "1446199362194636800").trim(),
    clientSecret: (process.env.OAUTH_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET || "t4iOmvKK97XEI3ph0X1fVI8Ds1Huzo4f").trim(),
    redirectUri: "https://404callback.netlify.app/api/linked-roles",
  };
}

async function exchangeLinkedRolesCode(code) {
  const config = getConfig();
  const params = new URLSearchParams();
  params.append("client_id", config.clientId);
  params.append("client_secret", config.clientSecret);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", config.redirectUri);

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord OAuth2 Error: ${text}`);
  }

  return res.json();
}

async function updateLinkedRoleMetadata(accessToken) {
  const config = getConfig();
  const url = `${DISCORD_API}/users/@me/applications/${config.clientId}/role-connection`;

  // Dados do cargo vinculado (metadados personalizados da Nyxware)
  const body = {
    platform_name: "Nyxware Identity",
    platform_username: "Membro Verificado",
    metadata: {
      verified: 1,
      secure_member: 1,
    },
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return res.ok;
}

exports.handler = async (event) => {
  const config = getConfig();
  const code = event.queryStringParameters?.code;

  // Se não tem code, redireciona para autorização OAuth2 com role_connections.write
  if (!code) {
    const authUrl = new URL("https://discord.com/oauth2/authorize");
    authUrl.searchParams.set("client_id", config.clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", config.redirectUri);
    authUrl.searchParams.set("scope", "identify role_connections.write");
    authUrl.searchParams.set("prompt", "consent");

    return {
      statusCode: 302,
      headers: {
        Location: authUrl.toString(),
      },
    };
  }

  // Se tem code, troca pelo token e grava os metadados do cargo vinculado
  try {
    const tokenData = await exchangeLinkedRolesCode(code);
    await updateLinkedRoleMetadata(tokenData.access_token);

    // Redireciona para a página de sucesso dos Linked Roles
    return {
      statusCode: 302,
      headers: {
        Location: "/linked-roles?success=true",
      },
    };
  } catch (err) {
    console.error("Erro ao vincular cargo:", err);
    return {
      statusCode: 302,
      headers: {
        Location: `/linked-roles?error=${encodeURIComponent(err.message)}`,
      },
    };
  }
};
