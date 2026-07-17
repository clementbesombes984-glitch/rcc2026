import '../../../notification-categories.js';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Cache-Control': 'no-store'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function subscriptionId(subscription) {
  const endpoint = subscription && subscription.endpoint ? subscription.endpoint : '';
  return endpoint ? btoa(endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(0, 96) : '';
}

export async function onRequestPost({ request, env }) {
  if (!env.RCC_PUSH_SUBSCRIPTIONS) {
    return json({ ok: false, error: 'KV binding RCC_PUSH_SUBSCRIPTIONS manquant.' }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json({ ok: false, error: 'JSON invalide.' }, 400);
  }

  const subscription = payload.subscription;
  const preferences = globalThis.RCCNotificationCategories.migratePreferences(payload.preferences || {});
  const id = subscriptionId(subscription);

  if (!id || !subscription || !subscription.endpoint) {
    return json({ ok: false, error: 'Abonnement push absent.' }, 400);
  }

  await env.RCC_PUSH_SUBSCRIPTIONS.put(id, JSON.stringify({
    id,
    subscription,
    preferences,
    updatedAt: new Date().toISOString()
  }));

  return json({ ok: true, id });
}
