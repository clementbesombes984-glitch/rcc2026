export async function onRequestPost({ request, env }) {
  const expected = env.PAGES_CMS_PASSWORD || 'RCCdemain';
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

  return Response.json({ ok: password === expected });
}
