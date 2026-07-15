const SESSION_COOKIE = 'rcc_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function json(body, status = 200, extraHeaders = {}) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...extraHeaders
    }
  });
}

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signSession(value, env) {
  const secret = env.ADMIN_SESSION_SECRET || env.PAGES_CMS_PASSWORD;
  if (!secret) throw new Error('Configuration admin manquante.');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64Url(new Uint8Array(signature));
}

function readCookie(request, name) {
  const cookies = request.headers.get('cookie') || '';
  return cookies
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1) || '';
}

async function validSession(request, env) {
  const token = readCookie(request, SESSION_COOKIE);
  const [expires, signature] = token.split('.');
  if (!expires || !signature || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  return signature === await signSession(expires, env);
}

async function sessionCookie(request, env) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = String(expires);
  const signature = await signSession(payload, env);
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

function slugify(value) {
  return clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'publication-rcc';
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeDataUrl(dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
  if (!match) return null;
  const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  return { extension, content: match[2] };
}

function githubConfig(env) {
  const repository = env.RCC_GITHUB_REPOSITORY || env.GITHUB_REPOSITORY || 'clementbesombes984-glitch/rcc2026';
  return {
    repository,
    branch: env.RCC_GITHUB_BRANCH || 'main',
    token: env.RCC_GITHUB_TOKEN || env.GITHUB_TOKEN || ''
  };
}

function githubTokenConfigured(env) {
  return Boolean(env.RCC_GITHUB_TOKEN || env.GITHUB_TOKEN);
}

async function githubRequest(path, env, options = {}) {
  const { repository, token } = githubConfig(env);
  if (!token) {
    const error = new Error('Token GitHub manquant. Ajoute RCC_GITHUB_TOKEN dans Cloudflare Pages > Settings > Environment variables.');
    error.status = 503;
    throw error;
  }

  const response = await fetch(`https://api.github.com/repos/${repository}/contents/${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'rcc-studio-publisher',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Erreur GitHub ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function readGithubJson(path, env) {
  const { branch } = githubConfig(env);
  const data = await githubRequest(`${path}?ref=${encodeURIComponent(branch)}`, env);
  const text = new TextDecoder().decode(Uint8Array.from(atob(data.content.replace(/\s/g, '')), (char) => char.charCodeAt(0)));
  return { sha: data.sha, json: JSON.parse(text) };
}

async function putGithubFile(path, contentBase64, message, env, sha = undefined) {
  const { branch } = githubConfig(env);
  return githubRequest(path, env, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch,
      ...(sha ? { sha } : {})
    })
  });
}

function normalizeArticle(article = {}, imagePath = '') {
  const title = clean(article.title || 'Publication RCC');
  const summary = clean(article.summary || article.body || 'Nouvelle publication du RC Cubzaguais.');
  const audience = Array.isArray(article.audience) && article.audience.length ? article.audience : ['general'];

  return {
    title,
    summary,
    body: String(article.body || summary || ''),
    image: imagePath || clean(article.image || ''),
    category: clean(article.category || 'Club'),
    audience,
    important: Boolean(article.important),
    notification: Boolean(article.notification),
    featured: Boolean(article.featured),
    date: clean(article.date || new Date().toISOString().slice(0, 10)),
    ...(Array.isArray(article.hashtags) && article.hashtags.length ? { hashtags: article.hashtags } : {})
  };
}

async function publishArticle(article, env) {
  let imagePath = clean(article.image || '');
  const image = decodeDataUrl(article.imageData);
  const now = Date.now();

  if (image) {
    imagePath = `/assets/uploads/studio-${slugify(article.title)}-${now}.${image.extension}`;
    await putGithubFile(
      imagePath.replace(/^\//, ''),
      image.content,
      `Studio RCC: ajoute le visuel ${clean(article.title || 'publication')}`,
      env
    );
  }

  const { sha, json: current } = await readGithubJson('data/news.json', env);
  const news = Array.isArray(current) ? current : (Array.isArray(current.news) ? current.news : []);
  const nextArticle = normalizeArticle(article, imagePath);
  const next = Array.isArray(current)
    ? [nextArticle, ...news]
    : { ...current, news: [nextArticle, ...news] };

  await putGithubFile(
    'data/news.json',
    utf8ToBase64(`${JSON.stringify(next, null, 2)}\n`),
    `Studio RCC: publie ${nextArticle.title}`,
    env,
    sha
  );

  return {
    article: nextArticle,
    url: '/actualites.html'
  };
}

async function sendPush(push, env, request) {
  const token = env.PUSH_ADMIN_TOKEN || env.RCC_PUSH_ADMIN_TOKEN || '';
  if (!push || !token) {
    return { ok: false, error: 'Notification non configuree.' };
  }

  const response = await fetch(new URL('/api/push/send', request.url), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(push)
  });
  return response.json().catch(() => ({ ok: response.ok }));
}

export async function onRequestGet({ env }) {
  const { repository, branch } = githubConfig(env);
  return json({
    ok: true,
    sitePublishingReady: githubTokenConfigured(env),
    expectedVariable: 'RCC_GITHUB_TOKEN',
    repository,
    branch,
    help: 'Pour activer la publication sur le site, ajoute la variable RCC_GITHUB_TOKEN dans Cloudflare Pages > Settings > Environment variables.'
  });
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'JSON invalide.' }, 400);
  }

  const expectedPassword = env.PAGES_CMS_PASSWORD || '';
  const passwordOk = Boolean(expectedPassword && payload.password && payload.password === expectedPassword);
  const sessionOk = await validSession(request, env);
  const authHeaders = passwordOk ? { 'Set-Cookie': await sessionCookie(request, env) } : {};

  if (!sessionOk && !passwordOk) {
    return json({
      ok: false,
      authRequired: true,
      error: 'Session admin expirée. Renseigne le mot de passe admin pour publier.'
    }, 401);
  }

  const result = {
    ok: true,
    articleCreated: false,
    url: '/actualites.html',
    push: null
  };

  try {
    if (payload.publishSite) {
      const published = await publishArticle(payload.article || {}, env);
      result.articleCreated = true;
      result.url = published.url;
      result.article = published.article;
      if (payload.push) payload.push.url = published.url;
    }

    if (payload.publishPush) {
      result.push = await sendPush(payload.push, env, request);
    }

    return json(result, 200, authHeaders);
  } catch (error) {
    return json({ ok: false, error: error.message || 'Publication impossible.' }, error.status || 500, authHeaders);
  }
}
