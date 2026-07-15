const SESSION_COOKIE = 'rcc_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

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

async function sessionCookie(request, env) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  const payload = String(expires);
  const signature = await signSession(payload, env);
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

export async function onRequestPost({ request, env }) {
  const expected = adminPassword(env || {});
  let password = '';

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      password = body.password || '';
    } else {
      const form = await request.formData();
      password = form.get('password') || '';
    }
  } catch (error) {
    password = '';
  }

  const ok = password === expected;
  const headers = ok ? { 'Set-Cookie': await sessionCookie(request, env) } : {};
  return Response.json({ ok }, { headers });
}
