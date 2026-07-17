(function registerRccNotificationCategories(global) {
  const categories = Object.freeze([
    ['actualites', 'Actualités'],
    ['seniors', 'Seniors'],
    ['cadettes', 'Cadettes'],
    ['u19', 'U19'],
    ['u16', 'U16'],
    ['u14', 'U14'],
    ['u12', 'U12'],
    ['u10', 'U10'],
    ['u8', 'U8'],
    ['u6', 'U6']
  ]);

  const categoryKeys = Object.freeze(categories.map(([key]) => key));
  const categoryLabels = Object.freeze(Object.fromEntries(categories));
  const teamKeys = Object.freeze(categoryKeys.filter((key) => key !== 'actualites'));
  const academyKeys = Object.freeze(['u6', 'u8', 'u10', 'u12', 'u14']);
  const youthKeys = Object.freeze(['u16', 'u19']);
  const generalAliases = new Set([
    'actualite', 'actualites', 'actualites-generales', 'news', 'general', 'important', 'urgent',
    'club', 'vie-du-club', 'vie-club', 'newsletter', 'newsletters',
    'partenaire', 'partenaires', 'benevole', 'benevoles', 'boutique',
    'evenement', 'evenements', 'evenement-club', 'administration',
    'communication', 'communications', 'communication-officielle', 'officiel',
    'informations', 'informations-administratives', 'evenements-generaux',
    'recrutement', 'bienvenue', 'presentation', 'autres'
  ]);
  const sportAliases = new Set([
    'match', 'matchs', 'tournoi', 'tournois', 'resultat', 'resultats',
    'entrainement', 'entrainements', 'training'
  ]);

  function token(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_\s]+/g, '-')
      .replace(/-+/g, '-');
  }

  function directCategory(value) {
    const key = token(value);
    if (categoryKeys.includes(key)) return key;
    const teamMatch = key.match(/(?:^|-)(u6|u8|u10|u12|u14|u16|u19)(?:-|$)/);
    if (teamMatch) return teamMatch[1];
    if (key === 'senior') return 'seniors';
    if (['feminine', 'feminines', 'cadette'].includes(key)) return 'cadettes';
    return '';
  }

  function normalizeAudience(values) {
    const source = Array.isArray(values) ? values : (values ? [values] : []);
    const result = new Set();
    let academyGroup = false;
    let youthGroup = false;
    let general = false;
    let genericSport = false;

    source.forEach((value) => {
      const direct = directCategory(value);
      if (direct) {
        result.add(direct);
        return;
      }
      const key = token(value);
      if (['ecole', 'ecole-de-rugby', 'edr'].includes(key)) academyGroup = true;
      else if (['jeunes', 'pole-jeunes', 'pole-jeune'].includes(key)) youthGroup = true;
      else if (generalAliases.has(key)) general = true;
      else if (sportAliases.has(key)) genericSport = true;
    });

    if (academyGroup && result.size === 0) academyKeys.forEach((key) => result.add(key));
    if (youthGroup && result.size === 0) youthKeys.forEach((key) => result.add(key));
    if ((general || genericSport) && result.size === 0) result.add('actualites');
    if (result.size === 0) result.add('actualites');
    return [...result];
  }

  function migratePreferences(input) {
    const source = input && typeof input === 'object' ? input : {};
    const migrated = Object.fromEntries(categoryKeys.map((key) => [key, false]));
    let hasKnownChoice = false;

    Object.entries(source).forEach(([rawKey, enabled]) => {
      if (!enabled) return;
      const direct = directCategory(rawKey);
      if (direct) {
        migrated[direct] = true;
        hasKnownChoice = true;
        return;
      }
      const key = token(rawKey);
      if (['ecole', 'ecole-de-rugby', 'edr'].includes(key)) {
        academyKeys.forEach((team) => { migrated[team] = true; });
        hasKnownChoice = true;
      } else if (['jeunes', 'pole-jeunes', 'pole-jeune'].includes(key)) {
        youthKeys.forEach((team) => { migrated[team] = true; });
        hasKnownChoice = true;
      } else if (sportAliases.has(key)) {
        teamKeys.forEach((team) => { migrated[team] = true; });
        hasKnownChoice = true;
      } else if (generalAliases.has(key)) {
        migrated.actualites = true;
        hasKnownChoice = true;
      }
    });

    if (!hasKnownChoice && Object.keys(source).length === 0) migrated.actualites = true;
    return migrated;
  }

  function inferCategory(value) {
    const text = token(Array.isArray(value) ? value.join(' ') : value);
    for (const key of teamKeys) {
      if (new RegExp(`(^|-)${key}($|-)`).test(text)) return key;
    }
    if (text.includes('senior')) return 'seniors';
    if (text.includes('cadette') || text.includes('feminine')) return 'cadettes';
    return 'actualites';
  }

  function labelFor(value) {
    const keys = normalizeAudience(value);
    return keys.map((key) => categoryLabels[key] || categoryLabels.actualites).join(', ');
  }

  global.RCCNotificationCategories = Object.freeze({
    categories,
    categoryKeys,
    categoryLabels,
    teamKeys,
    academyKeys,
    youthKeys,
    normalizeAudience,
    migratePreferences,
    inferCategory,
    labelFor
  });
})(globalThis);
