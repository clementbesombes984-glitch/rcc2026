export function normalizeStudioMedia(payload = {}) {
  return {
    text: String(payload.text || payload.caption || '').trim(),
    image: payload.image || payload.imageUrl || '',
    link: payload.link || payload.url || '',
    title: String(payload.title || '').trim(),
    source: payload.source || 'studio-rcc'
  };
}

export function validateMediaPayload(payload = {}) {
  const media = normalizeStudioMedia(payload);
  if (!media.text && !media.image && !media.link) {
    return { ok: false, error: 'Aucun contenu à publier.' };
  }
  return { ok: true, media };
}
