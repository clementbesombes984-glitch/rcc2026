import { metaStatus } from '../../../integrations/meta/auth.js';

export async function onRequestGet({ env }) {
  return Response.json(metaStatus(env), {
    headers: { 'Cache-Control': 'no-store' }
  });
}
