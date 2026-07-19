const SESSION_COOKIE = 'rcc_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const MIN_SESSION_SECRET_LENGTH = 32;

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function secureEqual(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    mismatch |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export function adminPassword(env = {}) {
  return env.PAGES_CMS_PASSWORD
    || env.CMS_PASSWORD
    || env.ADMIN_PASSWORD
    || env.STUDIO_PASSWORD
    || '';
}

export function adminSessionSecret(env = {}) {
  return env.ADMIN_SESSION_SECRET || '';
}

export function adminConfiguration(env = {}) {
  const password = adminPassword(env);
  const sessionSecret = adminSessionSecret(env);
  const validSecret = sessionSecret.length >= MIN_SESSION_SECRET_LENGTH
    && !secureEqual(sessionSecret, password);
  return { ok: Boolean(password && validSecret), password, sessionSecret };
}

async function signSession(value, sessionSecret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(sessionSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64Url(new Uint8Array(signature));
}

export async function createAdminSessionCookie(request, env = {}) {
  const config = adminConfiguration(env);
  if (!config.ok) throw new Error('ADMIN_CONFIGURATION_UNAVAILABLE');
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const signature = await signSession(String(expires), config.sessionSecret);
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${expires}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

function readCookie(request, name) {
  const cookies = request.headers.get('cookie') || '';
  return cookies
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1) || '';
}

export async function hasValidAdminSession(request, env = {}) {
  const config = adminConfiguration(env);
  if (!config.ok) return false;
  const token = readCookie(request, SESSION_COOKIE);
  const [expires, signature] = token.split('.');
  if (!expires || !signature || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = await signSession(expires, config.sessionSecret);
  return secureEqual(signature, expected);
}

export function matchesAdminPassword(candidate, env = {}) {
  const config = adminConfiguration(env);
  return config.ok && secureEqual(candidate, config.password);
}

export const ADMIN_CONFIGURATION_MESSAGE = 'Configuration administrateur indisponible. Contactez l’administrateur du site.';
