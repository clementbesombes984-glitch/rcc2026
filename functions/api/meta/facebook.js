import { prepareFacebookPublication } from '../../../integrations/meta/facebook.js';

export async function onRequestPost({ request, env }) {
  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    return Response.json({ ok: false, error: 'JSON invalide.' }, { status: 400 });
  }

  const result = await prepareFacebookPublication(env, payload);
  const status = result.ok ? 200 : result.prepared ? 202 : 503;
  return Response.json(result, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}
