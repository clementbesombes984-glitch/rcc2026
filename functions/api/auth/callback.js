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

  const payload = JSON.stringify({
    token: tokenData.access_token,
    provider: "github",
  });

  const body = "<!doctype html>" +
    "<html lang=\"fr\"><head><meta charset=\"utf-8\"><title>Connexion GitHub réussie</title></head>" +
    "<body><p>Connexion réussie. Vous pouvez fermer cette fenêtre.</p>" +
    "<script>" +
    "const payload = " + payload + ";" +
    "const message = \"authorization:github:success:\" + JSON.stringify(payload);" +
    "if (window.opener) { window.opener.postMessage(message, \"*\"); window.close(); }" +
    "else { document.body.innerHTML = \"<p>Connexion réussie. Retournez sur <a href=\\\"/admin/\\\">l’administration</a>.</p>\"; }" +
    "</script></body></html>";

  return htmlResponse(body);
}
