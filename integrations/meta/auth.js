export const META_SECRET_NAMES = [
  'META_APP_ID',
  'META_APP_SECRET',
  'META_PAGE_ID',
  'META_IG_USER_ID',
  'META_ACCESS_TOKEN'
];

export function metaStatus(env = {}) {
  const missingSecrets = META_SECRET_NAMES.filter((name) => !env[name]);
  const facebookMissing = ['META_PAGE_ID', 'META_ACCESS_TOKEN'].filter((name) => !env[name]);
  const instagramMissing = ['META_IG_USER_ID', 'META_ACCESS_TOKEN'].filter((name) => !env[name]);

  return {
    metaConfigured: missingSecrets.length === 0,
    facebookReady: facebookMissing.length === 0,
    instagramReady: instagramMissing.length === 0,
    missingSecrets
  };
}

export function assertFacebookReady(env = {}) {
  const status = metaStatus(env);
  if (!status.facebookReady) {
    return {
      ok: false,
      error: 'Configuration Meta incomplète',
      missingSecrets: status.missingSecrets
    };
  }
  return { ok: true };
}

export function assertInstagramReady(env = {}) {
  const status = metaStatus(env);
  if (!status.instagramReady) {
    return {
      ok: false,
      error: 'Configuration Instagram incomplète',
      missingSecrets: status.missingSecrets
    };
  }
  return { ok: true };
}
