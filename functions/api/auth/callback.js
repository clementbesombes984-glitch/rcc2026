function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(name + "="))
    ?.split("=")[1];
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html;charset=UTF-8" },
  });
}

export async function onRequestGet(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;
  const clientSecret = context.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return htmlResponse("Variables GitHub OAuth manquantes.", 500);
  }

  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = getCookie(context.request, "decap_oauth_state");

  if (!code || !state || !savedState || state !== savedState) {
    return htmlResponse("Erreur OAuth : state invalide ou code manquant.", 400);
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "RCC2026-Decap-CMS",
  function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1];
}

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html;charset=UTF-8" },
  });
}

export async function onRequestGet(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;
  const clientSecret = context.env.GITHUB_CLIENT_SECRET;

  const url = new URL(context.request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = getCookie(context.request, "decap_oauth_state");

  if (!clientId || !clientSecret) {
    return htmlResponse("Variables OAuth GitHub manquantes.", 500);
  }

  if (!code || !state || !savedState || state !== savedState) {
    return htmlResponse("Erreur OAuth : state invalide ou code manquant.", 400);
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "RCC2026-Decap-CMS",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenData.access_token) {
    return htmlResponse("Erreur OAuth GitHub : " + JSON.stringify(tokenData), 500);
  }

  const token = tokenData.access_token;
 export async function onRequest({ request, env }) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response("Code GitHub manquant", { status: 400 });
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    return new Response("Erreur GitHub OAuth : " + JSON.stringify(data), {
      status: 500,
    });
  }

  const message =
    "authorization:github:success:" +
    JSON.stringify({
      token: data.access_token,
      provider: "github",
    });

  return new Response(
    `<!doctype html>
<html>
  <body>
    <p>Connexion réussie. Retour à l'administration...</p>
    <script>
      window.opener.postMessage(${JSON.stringify(message)}, "*");
      window.close();
    </script>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
      },
    }
  );
}
