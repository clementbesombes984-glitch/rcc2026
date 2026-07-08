import { assertInstagramReady } from './auth.js';
import { validateMediaPayload } from './media.js';

export async function prepareInstagramPublication(env = {}, payload = {}) {
  const ready = assertInstagramReady(env);
  if (!ready.ok) return ready;

  const validated = validateMediaPayload(payload);
  if (!validated.ok) return validated;

  return {
    ok: false,
    prepared: true,
    provider: 'instagram',
    message: 'Workflow Instagram prêt : créer le media container puis publier le container après validation Meta.',
    publication: {
      igUserId: env.META_IG_USER_ID,
      text: validated.media.text,
      image: Boolean(validated.media.image),
      link: validated.media.link,
      steps: ['create_media_container', 'publish_media_container']
    }
  };
}
