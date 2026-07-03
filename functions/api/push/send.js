import webpush from 'web-push';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Cache-Control': 'no-store'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function hasMatchingPreference(preferences, audience) {
  const targets = Array.isArray(audience) && audience.length ? audience : ['general'];
  return targets.some((key) => preferences && preferences[key]);
}

function isAuthorized(request, env) {
  const expected = env.PUSH_ADMIN_TOKEN || '';
  if (!expected) return false;
  const header = request.headers.get('authorization') || '';
  return header === `Bearer ${expected}`;
}

async function removeSubscription(env, id) {
  if (id) await env.RCC_PUSH_SUBSCRIPTIONS.delete(id);
}

export async function onRequestPost({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'Non autorise.' }, 401);
  }

  if (!env.RCC_PUSH_SUBSCRIPTIONS) {
    return json({ ok: false, error: 'KV binding RCC_PUSH_SUBSCRIPTIONS manquant.' }, 500);
  }

  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return json({ ok: false, error: 'Cles VAPID manquantes.' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'JSON invalide.' }, 400);
  }

  webpush.setVapidDetails(
    env.VAPID_SUBJECT || 'mailto:contact@rccubzaguais.fr',
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );

  const audience = Array.isArray(payload.audience) ? payload.audience : ['general'];
  const list = await env.RCC_PUSH_SUBSCRIPTIONS.list();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const key of list.keys) {
    const raw = await env.RCC_PUSH_SUBSCRIPTIONS.get(key.name);
    if (!raw) continue;

    let record;
    try {
      record = JSON.parse(raw);
    } catch (error) {
      failed += 1;
      continue;
    }

    if (!hasMatchingPreference(record.preferences, audience)) {
      skipped += 1;
      continue;
    }

    try {
      await webpush.sendNotification(record.subscription, JSON.stringify({
        type: payload.type || 'news',
        title: payload.title || 'RC Cubzaguais',
        body: payload.body || 'Nouvelle information du club.',
        url: payload.url || '/',
        audience,
        tag: payload.tag || `rcc-${Date.now()}`
      }));
      sent += 1;
    } catch (error) {
      failed += 1;
      if (error && (error.statusCode === 404 || error.statusCode === 410)) {
        await removeSubscription(env, key.name);
      }
    }
  }

  return json({ ok: true, sent, skipped, failed, total: list.keys.length });
}
