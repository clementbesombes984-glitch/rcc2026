function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
  }[char]));
}

function page(error = "") {
  const errorHtml = error ? `<p class="error">${escapeHtml(error)}</p>` : "";
  const body = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Accès Pages CMS - RC Cubzaguais</title>
    <style>
      :root{--bg:#070707;--panel:#121212;--line:#282828;--text:#f7f4ef;--muted:#9e9992;--red:#b11845}
      *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 75% 25%,rgba(177,24,69,.28),transparent 32%),linear-gradient(115deg,#070707 0 68%,rgba(83,12,31,.7) 68% 100%);color:var(--text);font-family:Arial,Helvetica,sans-serif}.box{width:min(92vw,460px);border:1px solid var(--line);background:rgba(18,18,18,.94);padding:34px;box-shadow:0 30px 90px rgba(0,0,0,.45)}.mark{display:inline-grid;width:48px;height:48px;place-items:center;background:var(--red);font-family:Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif;font-size:24px;transform:skewX(-8deg)}h1{margin:26px 0 12px;font-family:Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif;font-size:48px;line-height:.95;text-transform:uppercase}p{color:var(--muted);line-height:1.6}label{display:grid;gap:10px;margin-top:24px;color:var(--muted);font-size:12px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase}input{width:100%;border:1px solid var(--line);background:#080808;color:#fff;padding:15px 16px;outline:none}input:focus{border-color:var(--red)}button,a{font-weight:900;letter-spacing:1.6px;text-transform:uppercase}button{width:100%;margin-top:18px;border:0;background:var(--red);color:#fff;padding:16px;cursor:pointer}.error{margin-top:16px;color:#ff8aaa}.tool{display:block;margin-top:14px;border:1px solid rgba(177,24,69,.45);background:rgba(177,24,69,.13);color:#fff;padding:14px 16px;text-align:center;text-decoration:none}.tool:hover{background:rgba(177,24,69,.24)}.back{display:inline-block;margin-top:22px;color:var(--muted);text-decoration:none}.back:hover{color:#fff}
    </style>
  </head>
  <body>
    <main class="box">
      <span class="mark">C</span>
      <h1>Accès Pages CMS</h1>
      <p>Entrez le mot de passe du club pour accéder à l’interface de gestion des matchs, actualités et joueurs.</p>
      <form method="post">
        <label>Mot de passe
          <input type="password" name="password" autocomplete="current-password" autofocus required />
        </label>
        <button type="submit">Entrer</button>
      </form>
      ${errorHtml}
      <a class="tool" href="/admin/generateur-affiche.html">Studio RCC</a>
      <a class="back" href="/">Retour au site</a>
    </main>
  </body>
</html>`;
  return new Response(body, { headers: { "content-type": "text/html;charset=UTF-8" } });
}

export async function onRequestGet() {
  return page();
}

export async function onRequestPost(context) {
  const expected = context.env.PAGES_CMS_PASSWORD || "RCCdemain";
  const form = await context.request.formData();
  const password = form.get("password");

  if (password !== expected) return page("Mot de passe incorrect.");

  return Response.redirect("https://app.pagescms.org/", 302);
}
