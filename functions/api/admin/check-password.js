import {
  ADMIN_CONFIGURATION_MESSAGE,
  adminConfiguration,
  createAdminSessionCookie,
  matchesAdminPassword
} from '../../_lib/admin-auth.js';

export async function onRequestPost({ request, env }) {
  if (!adminConfiguration(env || {}).ok) {
    return Response.json({
      ok: false,
      configurationUnavailable: true,
      error: ADMIN_CONFIGURATION_MESSAGE
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
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

  const ok = matchesAdminPassword(password, env);
  const headers = ok ? { 'Set-Cookie': await createAdminSessionCookie(request, env) } : {};
  return Response.json({ ok }, { headers });
}
