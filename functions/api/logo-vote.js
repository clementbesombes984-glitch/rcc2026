const jsonHeaders = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Cache-Control': 'no-store'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function emailLooksValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function dateAtStart(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateAtEnd(value) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function voteAvailability(settings = {}) {
  const now = new Date();
  if (!settings.voteEnabled) return { open: false, error: 'Le vote n’est pas ouvert actuellement.' };
  const start = dateAtStart(settings.startDate);
  const end = dateAtEnd(settings.endDate);
  if (start && now < start) return { open: false, error: 'Le vote ouvrira prochainement.' };
  if (end && now > end) return { open: false, error: 'Le vote est terminé. Merci pour votre participation.' };
  return { open: true, error: '' };
}

async function loadConfig(request) {
  const url = new URL('/data/logo-vote.json', request.url);
  const response = await fetch(url.toString(), { cache: 'no-store' });
  if (!response.ok) throw new Error('Configuration vote indisponible');
  return response.json();
}

function activeLogo(config, logoId) {
  const logos = Array.isArray(config.logos) ? config.logos : [];
  return logos.find((logo) => logo && logo.id === logoId && logo.active !== false);
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ env }) {
  return json({
    routeActive: true,
    kvConfigured: Boolean(env.RCC_LOGO_VOTES),
    storage: 'RCC_LOGO_VOTES'
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.RCC_LOGO_VOTES) {
    return json({ ok: false, error: 'Le stockage du vote n’est pas encore configuré.' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'Une erreur est survenue. Merci de réessayer ultérieurement.' }, 400);
  }

  const name = String(payload.name || '').trim().slice(0, 120);
  const email = String(payload.email || '').trim().toLowerCase();
  const logoId = String(payload.logoId || '').trim();
  const consent = payload.consent === true;

  if (!emailLooksValid(email)) {
    return json({ ok: false, error: 'Adresse e-mail invalide.' }, 400);
  }
  if (!logoId) {
    return json({ ok: false, error: 'Sélectionnez une proposition.' }, 400);
  }
  if (!consent) {
    return json({ ok: false, error: 'La confirmation est obligatoire pour enregistrer le vote.' }, 400);
  }

  let config;
  try {
    config = await loadConfig(request);
  } catch (error) {
    return json({ ok: false, error: 'Le vote n’est pas ouvert actuellement.' }, 503);
  }

  const availability = voteAvailability(config.settings || {});
  if (!availability.open) return json({ ok: false, error: availability.error }, 403);

  const logo = activeLogo(config, logoId);
  if (!logo) {
    return json({ ok: false, error: 'Cette proposition n’est pas disponible.' }, 400);
  }

  const salt = env.RCC_LOGO_VOTE_SALT || env.ADMIN_SESSION_SECRET || '';
  if (salt.length < 32) {
    return json({ ok: false, error: 'Configuration du vote indisponible. Contactez l’administrateur du site.' }, 503);
  }
  const emailHash = await sha256Hex(`${salt}:${email}`);
  const key = `vote:${emailHash}`;
  const existing = await env.RCC_LOGO_VOTES.get(key);
  const oneVotePerEmail = (config.settings || {}).allowOneVotePerEmail !== false;

  if (existing && oneVotePerEmail) {
    return json({ ok: false, error: 'Cette adresse e-mail a déjà été utilisée pour participer au vote.' }, 409);
  }

  await env.RCC_LOGO_VOTES.put(key, JSON.stringify({
    logoId,
    logoTitle: logo.title || logoId,
    name,
    emailHash,
    status: 'valid',
    createdAt: new Date().toISOString(),
    userAgent: request.headers.get('user-agent') || ''
  }));

  return json({ ok: true });
}
