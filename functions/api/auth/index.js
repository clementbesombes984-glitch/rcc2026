export async function onRequest({ env }) {
  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response("GITHUB_CLIENT_ID manquant", { status: 500 });
  }

  const scope = "repo,user";

  const url =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${clientId}` +
    `&scope=${encodeURIComponent(scope)}`;

  return Response.redirect(url, 302);
}