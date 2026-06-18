# OAuth Callback Netlify

Site separado para receber o callback OAuth2 do Discord e salvar tokens de restauracao no mesmo MongoDB do bot.

## URL de callback

Depois de publicar na Netlify, use:

```txt
https://SEU-SITE.netlify.app/oauth/callback
```

Coloque essa URL em dois lugares:

- Discord Developer Portal > OAuth2 > Redirects
- Variavel `OAUTH_REDIRECT_URI` do bot e deste site Netlify

## Variaveis no Netlify

Configure em Site settings > Environment variables:

```env
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
OAUTH_REDIRECT_URI=https://SEU-SITE.netlify.app/oauth/callback
OAUTH_TOKEN_SECRET=
MONGODB_URI=
DISCORD_TOKEN=
```

`OAUTH_TOKEN_SECRET` precisa ser exatamente o mesmo usado no bot, porque ele assina o `state` e criptografa os tokens.

`DISCORD_TOKEN` e necessario para aplicar o cargo automaticamente quando o modo de verificacao OAuth2 estiver ativo.
