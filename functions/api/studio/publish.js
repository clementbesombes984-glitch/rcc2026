import '../../../notification-categories.js';
import {
  ADMIN_CONFIGURATION_MESSAGE,
  adminConfiguration,
  createAdminSessionCookie,
  hasValidAdminSession,
  matchesAdminPassword
} from '../../_lib/admin-auth.js';

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

function decodeFileDataUrl(dataUrl, allowedTypes = []) {
  const match = String(dataUrl || '').match(/^data:([^;,]+);base64,(.+)$/i);
  if (!match || (allowedTypes.length && !allowedTypes.includes(match[1].toLowerCase()))) return null;
  return { mime: match[1].toLowerCase(), content: match[2] };
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
  const date = clean(article.date || new Date().toISOString().slice(0, 10));
  const id = clean(article.id || `${slugify(title)}-${date}-${Date.now().toString(36)}`);
  const summary = clean(article.summary || article.body || 'Nouvelle publication du RC Cubzaguais.');
  const audience = globalThis.RCCNotificationCategories.normalizeAudience(
    Array.isArray(article.audience) && article.audience.length ? article.audience : ['actualites']
  );

  return {
    id,
    title,
    summary,
    body: String(article.body || summary || ''),
    image: imagePath || clean(article.image || ''),
    category: clean(article.category || 'Club'),
    audience,
    important: Boolean(article.important),
    notification: Boolean(article.notification),
    featured: Boolean(article.featured),
    date,
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
    url: `/actualite.html?id=${encodeURIComponent(nextArticle.id)}`
  };
}

function normalizeComposition(composition = {}) {
  const title = clean(composition.title || 'Composition RCC');
  const id = clean(composition.id || `${slugify(title)}-${Date.now().toString(36)}`);
  const players = Array.isArray(composition.players)
    ? composition.players.map((player) => ({
      number: Number(player.number || 0),
      position: clean(player.position || player.role || ''),
      name: clean(player.name || ''),
      firstName: clean(player.firstName || ''),
      lastName: clean(player.lastName || ''),
      role: clean(player.role || player.position || ''),
      photo: clean(player.photo || '')
    }))
    : [];

  return {
    id,
    status: 'Enregistrée côté serveur',
    title,
    team: clean(composition.team || 'Seniors'),
    match: clean(composition.match || ''),
    eventTitle: clean(composition.eventTitle || ''),
    eventDetails: clean(composition.eventDetails || ''),
    date: clean(composition.date || new Date().toISOString().slice(0, 10)),
    players,
    captain: clean(composition.captain || ''),
    viceCaptain: clean(composition.viceCaptain || ''),
    coach: clean(composition.coach || ''),
    comments: String(composition.comments || ''),
    channels: composition.channels && typeof composition.channels === 'object' ? composition.channels : {},
    savedAt: new Date().toISOString()
  };
}

async function saveCompositionOnServer(composition, env) {
  const { sha, json: current } = await readGithubJson('data/compositions.json', env);
  const entries = Array.isArray(current) ? current : (Array.isArray(current.compositions) ? current.compositions : []);
  const normalized = normalizeComposition(composition);
  const nextEntries = [normalized, ...entries.filter((entry) => clean(entry.id) !== normalized.id)];
  const next = Array.isArray(current) ? nextEntries : { ...current, compositions: nextEntries };
  await putGithubFile(
    'data/compositions.json',
    utf8ToBase64(`${JSON.stringify(next, null, 2)}\n`),
    `Studio RCC: enregistre ${normalized.title}`,
    env,
    sha
  );
  return normalized;
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

function normalizeNewsletter(newsletter = {}, pdfPath = '', coverPath = '') {
  const status = ['draft', 'published', 'archived'].includes(newsletter.status) ? newsletter.status : 'draft';
  const sourceHeader = newsletter.header && typeof newsletter.header === 'object' ? newsletter.header : {};
  const header = {
    title: clean(sourceHeader.title || newsletter.title || 'Newsletter RCC'),
    subtitle: clean(sourceHeader.subtitle),
    issueNumber: clean(sourceHeader.issueNumber || newsletter.issueNumber),
    month: clean(sourceHeader.month || newsletter.month),
    year: Number(sourceHeader.year || newsletter.year) || new Date().getFullYear(),
    season: clean(sourceHeader.season || newsletter.season || '2026-2027'),
    tagline: clean(sourceHeader.tagline || newsletter.slogan)
  };
  return {
    id: clean(newsletter.id || slugify(header.title)),
    header,
    title: header.title,
    issueNumber: header.issueNumber,
    month: header.month,
    year: header.year,
    season: header.season,
    slogan: header.tagline,
    description: clean(newsletter.description),
    date: clean(newsletter.date || new Date().toISOString().slice(0, 10)),
    status,
    published: status === 'published' || Boolean(newsletter.published),
    pdf: pdfPath || clean(newsletter.pdf),
    cover: coverPath || clean(newsletter.cover),
    template: clean(newsletter.template || 'monthly'),
    pages: Array.isArray(newsletter.pages) ? newsletter.pages : [],
    updatedAt: new Date().toISOString()
  };
}

async function publishNewsletter(newsletter, env) {
  const pdf = decodeFileDataUrl(newsletter.pdfData, ['application/pdf']);
  const cover = decodeFileDataUrl(newsletter.coverData, ['image/jpeg', 'image/png', 'image/webp']);
  if (!pdf || !cover) {
    const error = new Error('Le PDF ou la couverture de la newsletter est invalide.');
    error.status = 400;
    throw error;
  }

  const baseName = `${slugify(newsletter.title || 'journal-rcc')}-${Date.now()}`;
  const pdfPath = `/assets/newsletters/${baseName}.pdf`;
  const coverExtension = cover.mime === 'image/png' ? 'png' : (cover.mime === 'image/webp' ? 'webp' : 'jpg');
  const coverPath = `/assets/newsletters/${baseName}-cover.${coverExtension}`;

  await putGithubFile(pdfPath.slice(1), pdf.content, `Studio RCC: ajoute la newsletter ${clean(newsletter.title)}`, env);
  await putGithubFile(coverPath.slice(1), cover.content, `Studio RCC: ajoute la couverture ${clean(newsletter.title)}`, env);

  let current;
  try {
    current = await readGithubJson('data/newsletters.json', env);
  } catch (error) {
    if (error.status !== 404) throw error;
    current = { sha: undefined, json: { newsletters: [] } };
  }
  const entries = Array.isArray(current.json) ? current.json : (Array.isArray(current.json.newsletters) ? current.json.newsletters : []);
  const normalized = normalizeNewsletter(newsletter, pdfPath, coverPath);
  const withoutPrevious = entries.filter((entry) => clean(entry.id) !== normalized.id);
  const next = Array.isArray(current.json)
    ? [normalized, ...withoutPrevious]
    : { ...current.json, newsletters: [normalized, ...withoutPrevious] };

  await putGithubFile(
    'data/newsletters.json',
    utf8ToBase64(`${JSON.stringify(next, null, 2)}\n`),
    `Studio RCC: publie la newsletter ${normalized.title}`,
    env,
    current.sha
  );
  return normalized;
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
  if (!adminConfiguration(env || {}).ok) {
    return json({ ok: false, configurationUnavailable: true, error: ADMIN_CONFIGURATION_MESSAGE }, 503);
  }
  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'JSON invalide.' }, 400);
  }

  const passwordOk = Boolean(payload.password && matchesAdminPassword(payload.password, env));
  const sessionOk = await hasValidAdminSession(request, env);
  const authHeaders = passwordOk ? { 'Set-Cookie': await createAdminSessionCookie(request, env) } : {};

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
    if (payload.kind === 'composition') {
      result.composition = await saveCompositionOnServer(payload.composition || {}, env);
      result.url = '/admin/generateur-affiche.html#composition';
    } else if (payload.kind === 'newsletter') {
      const newsletter = await publishNewsletter(payload.newsletter || {}, env);
      result.newsletter = newsletter;
      result.url = '/actualites.html?filtre=newsletters';
      return json(result, 200, authHeaders);
    }

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
