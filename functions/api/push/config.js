export async function onRequestGet({ env }) {
  return Response.json({
    publicKey: env.VAPID_PUBLIC_KEY || '',
    enabled: Boolean(env.VAPID_PUBLIC_KEY)
  });
}
