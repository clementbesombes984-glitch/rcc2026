const SESSION_COOKIE = 'rcc_admin_session';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Cache-Control': 'no-store'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function adminPassword(env) {
  return env.PAGES_CMS_PASSWORD
    || env.CMS_PASSWORD
    || env.ADMIN_PASSWORD
    || env.STUDIO_PASSWORD
    || 'RCCdemain';
}

async function signSession(value, env) {
  const secret = env.ADMIN_SESSION_SECRET || adminPassword(env);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64Url(new Uint8Array(signature));
}

function cookieValue(request, name) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : '';
}

async function hasAdminSession(request, env) {
  const raw = cookieValue(request, SESSION_COOKIE);
  const [expires, signature] = raw.split('.');
  if (!expires || !signature) return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  return signature === await signSession(expires, env);
}

async function loadConfig(request) {
  try {
    const response = await fetch(new URL('/data/logo-vote.json', request.url).toString(), { cache: 'no-store' });
    return response.ok ? await response.json() : {};
  } catch (error) {
    return {};
  }
}

async function listVotes(kv) {
  const votes = [];
  let cursor;
  do {
    const listed = await kv.list({ prefix: 'vote:', cursor });
    for (const key of listed.keys) {
      const raw = await kv.get(key.name);
      if (!raw) continue;
      try {
        votes.push(JSON.parse(raw));
      } catch (error) {
        votes.push({ status: 'invalid', key: key.name });
      }
    }
    cursor = listed.list_complete ? undefined : listed.cursor;
  } while (cursor);
  return votes;
}

function buildResults(config, votes) {
  const logos = (Array.isArray(config.logos) ? config.logos : [])
    .filter((logo) => logo && logo.id)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const counts = new Map();
  let lastVote = '';

  votes.forEach((vote) => {
    if (!vote || vote.status !== 'valid') return;
    counts.set(vote.logoId, (counts.get(vote.logoId) || 0) + 1);
    if (vote.createdAt && (!lastVote || vote.createdAt > lastVote)) lastVote = vote.createdAt;
  });

  const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
  const rows = logos.map((logo) => {
    const count = counts.get(logo.id) || 0;
    return {
      id: logo.id,
      title: logo.title || logo.id,
      image: logo.image || '',
      active: logo.active !== false,
      votes: count,
      percent: total ? Math.round((count / total) * 1000) / 10 : 0
    };
  }).sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title));

  return {
    total,
    lastVote,
    rows,
    voteEnabled: Boolean(config.settings && config.settings.voteEnabled)
  };
}

function csv(results) {
  const lines = [['Proposition', 'Votes', 'Pourcentage']];
  results.rows.forEach((row) => lines.push([row.title, String(row.votes), String(row.percent).replace('.', ',') + ' %']));
  return lines.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
}

export async function onRequestGet({ request, env }) {
  if (!await hasAdminSession(request, env || {})) {
    return json({ ok: false, error: 'Accès administration requis.' }, 401);
  }
  if (!env.RCC_LOGO_VOTES) {
    return json({ ok: false, error: 'KV binding RCC_LOGO_VOTES manquant.' }, 500);
  }

  const config = await loadConfig(request);
  const votes = await listVotes(env.RCC_LOGO_VOTES);
  const results = buildResults(config, votes);
  const url = new URL(request.url);

  if (url.searchParams.get('format') === 'csv') {
    return new Response(csv(results), {
      headers: {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': 'attachment; filename="resultats-vote-logo-rcc.csv"',
        'Cache-Control': 'no-store'
      }
    });
  }

  return json({ ok: true, ...results });
}

export async function onRequestPost({ request, env }) {
  if (!await hasAdminSession(request, env || {})) {
    return json({ ok: false, error: 'Accès administration requis.' }, 401);
  }
  if (!env.RCC_LOGO_VOTES) {
    return json({ ok: false, error: 'KV binding RCC_LOGO_VOTES manquant.' }, 500);
  }

  const payload = await request.json().catch(() => ({}));
  if (payload.action !== 'reset' || payload.confirm !== 'REMETTRE A ZERO') {
    return json({ ok: false, error: 'Confirmation explicite requise.' }, 400);
  }

  const votes = await listVotes(env.RCC_LOGO_VOTES);
  await Promise.all(votes.map((vote) => vote.emailHash ? env.RCC_LOGO_VOTES.delete(`vote:${vote.emailHash}`) : Promise.resolve()));
  return json({ ok: true, deleted: votes.length });
}
