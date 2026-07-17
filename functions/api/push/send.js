import '../../../notification-categories.js';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=UTF-8',
  'Cache-Control': 'no-store'
};

const encoder = new TextEncoder();
const notificationCategories = globalThis.RCCNotificationCategories;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function hasMatchingPreference(preferences, audience) {
  const targets = expandAudience(Array.isArray(audience) && audience.length ? audience : ['actualites']);
  const migrated = notificationCategories.migratePreferences(preferences);
  return targets.some((key) => migrated[key]);
}

function expandAudience(values) {
  return notificationCategories.normalizeAudience(values);
}

function shortTitle(value, fallback = 'RC Cubzaguais') {
  const text = String(value || fallback).replace(/\s+/g, ' ').trim();
  return text.length > 40 ? text.slice(0, 37).trimEnd() + '...' : text;
}

function isAuthorized(request, env) {
  const expected = env.PUSH_ADMIN_TOKEN || env.RCC_PUSH_ADMIN_TOKEN || '';
  if (!expected) return false;
  const header = request.headers.get('authorization') || '';
  return header === `Bearer ${expected}`;
}

async function removeSubscription(env, id) {
  if (id) await env.RCC_PUSH_SUBSCRIPTIONS.delete(id);
}

export async function onRequestGet({ env }) {
  const kvConfigured = Boolean(env.RCC_PUSH_SUBSCRIPTIONS);
  let subscriptions = 0;

  if (kvConfigured) {
    const list = await env.RCC_PUSH_SUBSCRIPTIONS.list();
    subscriptions = list.keys.length;
  }

  return json({
    routeActive: true,
    vapidConfigured: Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY),
    kvConfigured,
    subscriptions
  });
}

function concatBytes(...parts) {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(new Uint8Array(part), offset);
    offset += part.byteLength;
  }
  return output;
}

function base64UrlToBytes(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }
  return output;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  const view = new Uint8Array(bytes);
  for (let index = 0; index < view.length; index += 1) {
    binary += String.fromCharCode(view[index]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function hmac(keyBytes, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
}

async function hkdfExtract(salt, ikm) {
  return hmac(salt, ikm);
}

async function hkdfExpand(prk, info, length) {
  const blocks = [];
  let previous = new Uint8Array(0);
  let written = 0;
  let counter = 1;

  while (written < length) {
    const input = concatBytes(previous, info, new Uint8Array([counter]));
    previous = await hmac(prk, input);
    blocks.push(previous);
    written += previous.byteLength;
    counter += 1;
  }

  return concatBytes(...blocks).slice(0, length);
}

function vapidPublicKeyToJwk(publicKeyBytes, privateKeyBytes) {
  if (publicKeyBytes.byteLength !== 65 || publicKeyBytes[0] !== 4) {
    throw new Error('Cle publique VAPID invalide.');
  }

  return {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToBase64Url(publicKeyBytes.slice(1, 33)),
    y: bytesToBase64Url(publicKeyBytes.slice(33, 65)),
    d: bytesToBase64Url(privateKeyBytes),
    ext: true
  };
}

function endpointAudience(endpoint) {
  const url = new URL(endpoint);
  return `${url.protocol}//${url.host}`;
}

async function createVapidToken(subscription, env) {
  const publicKey = base64UrlToBytes(env.VAPID_PUBLIC_KEY);
  const privateKey = base64UrlToBytes(env.VAPID_PRIVATE_KEY);
  const jwtHeader = { typ: 'JWT', alg: 'ES256' };
  const jwtBody = {
    aud: endpointAudience(subscription.endpoint),
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: env.VAPID_SUBJECT || 'mailto:contact@rccubzaguais.fr'
  };

  const signingInput = [
    bytesToBase64Url(encoder.encode(JSON.stringify(jwtHeader))),
    bytesToBase64Url(encoder.encode(JSON.stringify(jwtBody)))
  ].join('.');

  const key = await crypto.subtle.importKey(
    'jwk',
    vapidPublicKeyToJwk(publicKey, privateKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(signingInput)
  );

  return `vapid t=${signingInput}.${bytesToBase64Url(signature)}, k=${env.VAPID_PUBLIC_KEY}`;
}

async function encryptPushPayload(subscription, payload) {
  const userPublicKey = base64UrlToBytes(subscription.keys && subscription.keys.p256dh);
  const authSecret = base64UrlToBytes(subscription.keys && subscription.keys.auth);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const serverKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const userKey = await crypto.subtle.importKey(
    'raw',
    userPublicKey,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  const serverPublicKey = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeys.publicKey));
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: userKey },
    serverKeys.privateKey,
    256
  ));

  const authPrk = await hkdfExtract(authSecret, sharedSecret);
  const keyInfo = concatBytes(
    encoder.encode('WebPush: info\0'),
    userPublicKey,
    serverPublicKey
  );
  const ikm = await hkdfExpand(authPrk, keyInfo, 32);
  const prk = await hkdfExtract(salt, ikm);
  const contentEncryptionKey = await hkdfExpand(prk, encoder.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdfExpand(prk, encoder.encode('Content-Encoding: nonce\0'), 12);
  const aesKey = await crypto.subtle.importKey(
    'raw',
    contentEncryptionKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const plaintext = concatBytes(encoder.encode(payload), new Uint8Array([2]));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, tagLength: 128 },
    aesKey,
    plaintext
  ));
  const recordSize = new Uint8Array([0, 0, 16, 0]);

  return concatBytes(
    salt,
    recordSize,
    new Uint8Array([serverPublicKey.byteLength]),
    serverPublicKey,
    encrypted
  );
}

async function sendWebPush(subscription, notification, env) {
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    throw new Error('Abonnement push incomplet.');
  }

  const body = await encryptPushPayload(subscription, JSON.stringify(notification));
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await createVapidToken(subscription, env),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '2419200',
      Urgency: notification.urgent ? 'high' : 'normal'
    },
    body
  });

  if (!response.ok) {
    const error = new Error(`Push refuse: ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }
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

  const audience = expandAudience(Array.isArray(payload.audience) ? payload.audience : ['actualites']);
  const list = await env.RCC_PUSH_SUBSCRIPTIONS.list();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

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
      await sendWebPush(record.subscription, {
        type: payload.type || 'news',
        title: shortTitle(payload.title, 'RC Cubzaguais'),
        body: payload.body || 'Nouvelle information du club.',
        url: payload.url || '/',
        audience,
        tag: payload.tag || `rcc-${Date.now()}`,
        urgent: Boolean(payload.important)
      }, env);
      sent += 1;
    } catch (error) {
      failed += 1;
      if (errors.length < 5) {
        errors.push({
          id: key.name,
          statusCode: error && error.statusCode ? error.statusCode : null,
          message: error && error.message ? error.message : 'Erreur inconnue'
        });
      }
      if (error && (error.statusCode === 404 || error.statusCode === 410)) {
        await removeSubscription(env, key.name);
      }
    }
  }

  return json({ ok: true, sent, skipped, failed, total: list.keys.length, errors });
}
