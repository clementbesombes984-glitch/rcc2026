import { assertFacebookReady } from './auth.js';
import { validateMediaPayload } from './media.js';

export async function prepareFacebookPublication(env = {}, payload = {}) {
  const ready = assertFacebookReady(env);
  if (!ready.ok) return ready;

  const validated = validateMediaPayload(payload);
  if (!validated.ok) return validated;

  return {
    ok: false,
    prepared: true,
    provider: 'facebook',
    message: 'Publication Facebook prête. Activation réelle à brancher après validation des permissions Meta.',
    publication: {
      pageId: env.META_PAGE_ID,
      text: validated.media.text,
      image: Boolean(validated.media.image),
      link: validated.media.link
    }
  };
}
