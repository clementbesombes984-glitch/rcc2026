(() => {
  const FORMATS = {
    square: { width: 1080, height: 1080 },
    portrait: { width: 1080, height: 1350 },
    story: { width: 1080, height: 1920 },
    facebook: { width: 1200, height: 630 },
    linkedin: { width: 1200, height: 627 },
    a4: { width: 1748, height: 2480 }
  };

  const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=League+Spartan:wght@700;800;900&family=Montserrat:wght@800;900&family=Oswald:wght@500;600;700&family=Rajdhani:wght@600;700&display=swap';
  const TITLE_FONT = '"Bebas Neue", "Anton", Impact, sans-serif';
  const IMPACT_FONT = '"Anton", "League Spartan", Impact, sans-serif';
  const BODY_FONT = '"Rajdhani", "Oswald", Arial, sans-serif';
  const CURRENT_SEASON = '2026-2027';

  const COLORS = {
    black: '#020203',
    deep: '#09090b',
    red: '#b11845',
    redBright: '#d31a52',
    navy: '#061b38',
    navyBright: '#0d3467',
    white: '#fff8ef',
    muted: '#d8d0c6'
  };

  const TEMPLATE_TITLES = {
    news: 'ACTUALITE',
    upcoming: 'MATCH',
    result: 'RESULTAT',
    tournament: 'TOURNOI',
    training: 'ENTRAINEMENT',
    club: 'VIE DU CLUB',
    recruitment: 'REJOINS LE RCC',
    partner: 'PARTENAIRE',
    shop: 'BOUTIQUE',
    birthday: 'ANNIVERSAIRE',
    thanks: 'MERCI',
    congrats: 'FELICITATIONS',
    weekend: 'WEEK-END RCC',
    team: 'EQUIPE RCC',
    educator: 'PORTRAIT',
    newsletter: 'NEWSLETTER'
  };

  const STYLE_DEFAULTS = {
    news: 'magazine',
    upcoming: 'match',
    result: 'match',
    tournament: 'tournament',
    training: 'recruitment',
    club: 'club',
    recruitment: 'recruitment',
    partner: 'partner',
    shop: 'partner',
    birthday: 'club',
    thanks: 'club',
    congrats: 'match',
    weekend: 'tournament',
    team: 'club',
    educator: 'club',
    newsletter: 'magazine'
  };

  const STYLE_CLASSES = {
    match: 'studio-style-top14',
    magazine: 'studio-style-magazine',
    club: 'studio-style-vie-club',
    partner: 'studio-style-partenaire',
    recruitment: 'studio-style-recrutement',
    tournament: 'studio-style-tournoi'
  };

  const canvas = document.getElementById('posterCanvas');
  const ctx = canvas?.getContext('2d');
  const form = document.querySelector('[data-poster-form]');
  const sizeNode = document.querySelector('[data-poster-size]');
  const statusNode = document.querySelector('[data-poster-status]');
  const sourceSelect = document.querySelector('[data-source-select]');
  const compactTemplateSelect = document.querySelector('[data-compact-template]');
  const compactSourceSelect = document.querySelector('[data-compact-source]');
  const captionOutput = document.querySelector('[data-caption-output]');
  const downloadButton = document.querySelector('[data-download-poster]');
  const downloadPdfButton = document.querySelector('[data-download-pdf]');
  const copyCaptionButton = document.querySelector('[data-copy-caption]');
  const copyFacebookButton = document.querySelector('[data-copy-facebook]');
  const copyInstagramButton = document.querySelector('[data-copy-instagram]');
  const copyHashtagsButton = document.querySelector('[data-copy-hashtags]');
  const publishStudioButton = document.querySelector('[data-publish-studio]');
  const prepareDistributionButton = document.querySelector('[data-prepare-distribution]');
  const checkMetaButton = document.querySelector('[data-check-meta]');
  const hashtagOutput = document.querySelector('[data-hashtag-output]');
  const previewSite = document.querySelector('[data-preview-site]');
  const previewFacebook = document.querySelector('[data-preview-facebook]');
  const previewInstagram = document.querySelector('[data-preview-instagram]');
  const previewPush = document.querySelector('[data-preview-push]');
  const zoomInButton = document.querySelector('[data-zoom-in]');
  const zoomOutButton = document.querySelector('[data-zoom-out]');
  const toggleGridButton = document.querySelector('[data-toggle-grid]');
  const resetPhotoButton = document.querySelector('[data-reset-photo]');
  const studioTabButtons = document.querySelectorAll('[data-studio-tab]');
  const studioTabPanels = document.querySelectorAll('[data-studio-tab-panel]');
  const publishDialog = document.querySelector('[data-publish-dialog]');
  const publishDialogOpenButtons = document.querySelectorAll('[data-publish-dialog-open]');
  const publishDialogConfirm = document.querySelector('[data-publish-dialog-confirm]');
  const publishDialogCancel = document.querySelector('[data-publish-dialog-cancel]');
  const studioSaveButtons = document.querySelectorAll('[data-studio-save]');
  const pushSettings = document.querySelector('[data-push-settings]');
  const compositionTeam = document.querySelector('[data-composition-team]');
  const compositionMatch = document.querySelector('[data-composition-match]');
  const compositionMatchInfo = document.querySelector('[data-composition-match-info]');
  const compositionList = document.querySelector('[data-composition-list]');
  const compositionPreview = document.querySelector('[data-composition-preview]');
  const compositionCaptain = document.querySelector('[data-composition-captain]');
  const compositionVice = document.querySelector('[data-composition-vice]');
  const compositionCoach = document.querySelector('[data-composition-coach]');
  const compositionComments = document.querySelector('[data-composition-comments]');
  const compositionHistory = document.querySelector('[data-composition-history]');
  const newsletterItems = document.querySelector('[data-newsletter-items]');
  const newsletterPreview = document.querySelector('[data-newsletter-preview]');
  const newsletterTitle = document.querySelector('[data-newsletter-title]');
  const newsletterPeriod = document.querySelector('[data-newsletter-period]');
  const newsletterIntro = document.querySelector('[data-newsletter-intro]');
  const newsletterPartner = document.querySelector('[data-newsletter-partner]');
  const newsletterReminder = document.querySelector('[data-newsletter-reminder]');
  const newsletterTemplate = document.querySelector('[data-newsletter-template]');
  const newsletterBlockType = document.querySelector('[data-newsletter-block-type]');
  const newsletterBlocks = document.querySelector('[data-newsletter-blocks]');
  const mediaLibrary = document.querySelector('[data-media-library]');

  const RUGBY_POSITIONS = [
    'Pilier gauche', 'Talonneur', 'Pilier droit',
    'Deuxième ligne', 'Deuxième ligne',
    'Troisième ligne aile', 'Numéro 8', 'Troisième ligne aile',
    'Demi de mêlée', "Demi d'ouverture",
    'Ailier', 'Premier centre', 'Deuxième centre', 'Ailier',
    'Arrière',
    'Remplaçant 1', 'Remplaçant 2', 'Remplaçant 3', 'Remplaçant 4',
    'Remplaçant 5', 'Remplaçant 6', 'Remplaçant 7', 'Remplaçant 8'
  ];

  const OFFICIAL_RUGBY_POSITIONS = [
    'Pilier gauche',
    'Talonneur',
    'Pilier droit',
    'Deuxième ligne',
    'Troisième ligne aile',
    'Numéro 8',
    'Demi de mêlée',
    "Demi d'ouverture",
    'Ailier',
    'Premier centre',
    'Deuxième centre',
    'Arrière',
    'Pilier',
    'Deuxième / troisième ligne',
    'Centre',
    'Trois-quarts polyvalent',
    'Non renseigné'
  ];

  const state = {
    activeSource: 'blank',
    image: null,
    opponentLogo: null,
    imageOffsetX: 0,
    imageOffsetY: 0,
    showGrid: false,
    fontsReady: false,
    data: {
      news: [],
      events: [],
      partners: [],
      products: [],
      albums: [],
      teams: [],
      media: [],
      compositionEvents: [],
      settings: {}
    },
    composition: {
      slots: Array.from({ length: 23 }, (_, index) => ({
        number: index + 1,
        position: RUGBY_POSITIONS[index] || `Poste ${index + 1}`,
        player: '',
        playerKey: '',
        photo: '',
        role: ''
      })),
      captain: '',
      viceCaptain: '',
      coach: '',
      comments: ''
    },
    newsletterBlocks: []
  };

  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  logo.src = '../assets/logo-rcc.png';
  logo.onload = render;

  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const upper = (value) => clean(value).toUpperCase();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const asList = (value) => Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);
  const slug = (value) => clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

  const POSITION_ALIASES = new Map([
    ['flanker', 'Troisième ligne aile'],
    ['troisieme ligne', 'Troisième ligne aile'],
    ['troisieme ligne aile', 'Troisième ligne aile'],
    ['troisieme ligne centre', 'Numéro 8'],
    ['numero 8', 'Numéro 8'],
    ['n 8', 'Numéro 8'],
    ['demi de melee', 'Demi de mêlée'],
    ['demi melee', 'Demi de mêlée'],
    ['demi d ouverture', "Demi d'ouverture"],
    ['demi douverture', "Demi d'ouverture"],
    ['ouvreur', "Demi d'ouverture"],
    ['arriere', 'Arrière'],
    ['ailier gauche', 'Ailier'],
    ['ailier droit', 'Ailier'],
    ['centre', 'Centre'],
    ['pilier', 'Pilier']
  ]);

  function normalizePlayerPosition(value) {
    const raw = clean(value);
    if (!raw) return 'Non renseigné';
    const direct = OFFICIAL_RUGBY_POSITIONS.find((item) => item.toLowerCase() === raw.toLowerCase());
    if (direct) return direct;
    const key = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['’]/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
    return POSITION_ALIASES.get(key) || raw;
  }

  function secondaryPlayerPosition(player) {
    const normalized = normalizePlayerPosition(player.secondaryPosition || player.positionSecondary || player.posteSecondaire || player.secondaryRole);
    const primary = normalizePlayerPosition(player.primaryPosition || player.position || player.role || player.label);
    return normalized && normalized !== 'Non renseigné' && normalized !== primary ? normalized : '';
  }

  function playerPositionRank(player, targetPosition) {
    const target = normalizePlayerPosition(targetPosition);
    if (!target || target.startsWith('Remplaçant')) return 2;
    if (normalizePlayerPosition(player.role) === target) return 0;
    if (normalizePlayerPosition(player.secondaryRole) === target) return 1;
    return 2;
  }

  function matchesAudience(item, team) {
    const text = clean([
      item.team,
      item.category,
      item.title,
      item.audience,
      item.type_evenement,
      item.competition
    ].flat().join(' ')).toLowerCase();
    const key = clean(team).toLowerCase();
    if (key === 'seniors') return text.includes('senior') || text.includes('rcc') || !text;
    if (key === 'cadettes') return text.includes('cadette') || text.includes('feminine');
    if (key === 'u19') return text.includes('u19') || text.includes('junior');
    if (key === 'u16') return text.includes('u16') || text.includes('cadet');
    return text.includes(key);
  }

  function eventTitle(item) {
    return clean(item.title || item.tournamentName || item.nom_tournoi || item.opponent || item.adversaire || 'Rendez-vous RCC');
  }

  function eventDetails(item) {
    return [
      item.date ? formatDate(item.date) : '',
      item.time || item.heure || '',
      item.location || item.lieu || '',
      item.competition || ''
    ].filter(Boolean).join(' - ');
  }

  function playerName(player) {
    return clean(player.age || `${player.firstName || player.prenom || ''} ${player.lastName || player.nom || ''}` || player.name || player.title);
  }

  function isMatchNews(item) {
    const text = clean([item.template, item.type, item.category, item.title, item.audience].flat().join(' ')).toLowerCase();
    return text.includes('match') || text.includes('tournoi') || text.includes('composition');
  }

  function buildCompositionEvents() {
    const calendarEvents = state.data.events.map((item, index) => ({ ...item, _studioSource: 'calendar', _studioValue: `event-${index}` }));
    const newsEvents = state.data.news
      .filter(isMatchNews)
      .map((item, index) => ({
        ...item,
        opponent: item.opponent || item.adversaire || item.subtitle,
        location: item.location || item.lieu || '',
        competition: item.competition || item.category || 'Actualite match',
        _studioSource: 'news',
        _studioValue: `news-${index}`
      }));
    state.data.compositionEvents = [...calendarEvents, ...newsEvents];
  }

  function compositionEventByValue(value) {
    return state.data.compositionEvents.find((item) => item._studioValue === value)
      || state.data.events[Number(value)]
      || {};
  }

  function defaultCompositionSlots() {
    return Array.from({ length: 23 }, (_, index) => ({
      number: index + 1,
      position: RUGBY_POSITIONS[index] || `Poste ${index + 1}`,
      player: '',
      playerKey: '',
      photo: '',
      role: ''
    }));
  }

  function playerKey(player, index = 0) {
    return slug(`${player.source || ''}-${player.name || player.age || ''}-${player.role || ''}-${index}`);
  }

  function teamPlayersFromCategory(category, source) {
    const team = clean(category.age || category.label || source);
    const players = Array.isArray(category.players) ? category.players : [];
    return players.map((item) => ({
      ...item,
      age: `${item.firstName || item.prenom || item.name || ''} ${item.lastName || item.nom || ''}`,
      label: item.primaryPosition || item.position || item.poste || team,
      source: `${source} ${team}`,
      teamPhoto: item.photo || item.image || category.teamPhoto
    }));
  }

  function playerPool(team = '') {
    const key = clean(team).toLowerCase();
    return state.data.teams
      .filter((item) => {
        const source = clean(`${item.source || ''} ${item.label || ''} ${item.category || ''} ${item.age || ''}`).toLowerCase();
        if (key === 'seniors') return source.includes('senior');
        if (key === 'cadettes') return source.includes('cadette') || source.includes('feminine');
        if (key === 'u19') return source.includes('u19') || source.includes('junior');
        if (key === 'u16') return source.includes('u16') || source.includes('cadet');
        return source.includes(key);
      })
      .map((item) => ({
        name: playerName(item),
        role: normalizePlayerPosition(item.primaryPosition || item.position || item.role || item.label || ''),
        photo: clean(item.photo || item.teamPhoto || item.image || ''),
        secondaryRole: secondaryPlayerPosition(item),
        source: clean(item.source || ''),
        raw: item
      }))
      .filter((item) => item.name)
      .map((item, index) => ({ ...item, key: playerKey(item, index) }));
  }

  function selectedPlayerByKey(key, team) {
    return playerPool(team).find((player) => player.key === key);
  }

  function playersForSlot(slot, players) {
    return [...players].sort((a, b) => (
      playerPositionRank(a, slot.position) - playerPositionRank(b, slot.position)
      || a.name.localeCompare(b.name, 'fr')
    ));
  }

  function compositionSelectedNames() {
    return state.composition.slots.map((slot) => slot.player).filter(Boolean);
  }

  function getStyleKey(style, template) {
    const key = clean(style).toLowerCase();
    if (key === 'top14' || key === 'top-14') return 'match';
    if (key === 'announcement') return template === 'tournament' || template === 'weekend' ? 'tournament' : 'recruitment';
    return STYLE_CLASSES[key] ? key : (STYLE_DEFAULTS[template] || 'match');
  }

  function applyPreviewStyle(style) {
    const className = STYLE_CLASSES[style] || STYLE_CLASSES.match;
    document.querySelectorAll('.studio-preview-panel,.studio-canvas-wrap').forEach((node) => {
      Object.values(STYLE_CLASSES).forEach((item) => node.classList.remove(item));
      node.classList.add(className);
    });
  }

  function readForm() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function setStatus(message) {
    if (statusNode) statusNode.textContent = message;
  }

  function setField(name, value) {
    const field = form?.elements[name];
    if (field && value !== undefined && value !== null) field.value = value;
  }

  function syncTemplateButtons(template) {
    if (compactTemplateSelect && compactTemplateSelect.value !== template) compactTemplateSelect.value = template;
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date);
  }

  function collectionFrom(data, key) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data[key])) return data[key];
    return [];
  }

  function normalizeAssetPath(src) {
    if (!src) return '';
    if (typeof src === 'object') src = src.image || src.url || src.src || '';
    src = String(src || '');
    if (!src) return '';
    if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
    return src.startsWith('/') ? '..' + src : src;
  }

  function loadFontStylesheet() {
    const existing = document.querySelector('[data-rcc-poster-fonts]');
    if (existing?.dataset.loaded === 'true') return Promise.resolve();
    return new Promise((resolve) => {
      const link = existing || document.createElement('link');
      const finish = () => {
        link.dataset.loaded = 'true';
        resolve();
      };
      link.addEventListener('load', finish, { once: true });
      link.addEventListener('error', finish, { once: true });
      setTimeout(finish, 2500);
      if (!existing) {
        link.dataset.rccPosterFonts = 'true';
        link.rel = 'stylesheet';
        link.href = FONT_CSS;
        document.head.appendChild(link);
      }
    });
  }

  async function loadFonts() {
    if (!document.fonts) {
      state.fontsReady = true;
      return;
    }
    await loadFontStylesheet();
    try {
      await Promise.all([
        document.fonts.load(`900 140px ${TITLE_FONT}`),
        document.fonts.load(`900 90px ${IMPACT_FONT}`),
        document.fonts.load(`700 38px ${BODY_FONT}`),
        document.fonts.ready
      ]);
    } finally {
      state.fontsReady = true;
      render();
    }
  }

  async function fetchJson(paths, fallback) {
    const candidates = Array.isArray(paths) ? paths : [paths];
    const errors = [];
    for (const path of candidates) {
      try {
        const response = await fetch(path, { cache: 'no-store' });
        if (response.ok) return { data: await response.json(), error: null };
        errors.push(`${path} (${response.status})`);
      } catch (error) {
        errors.push(path);
      }
    }
    return { data: fallback, error: errors.join(', ') };
  }

  async function loadSources() {
    setStatus('Chargement des donnees du CMS...');
    setSourceSelectLoading('Chargement...');
    const [news, matches, partners, shop, gallery, senior, academy, youth, feminines, settings, media] = await Promise.all([
      fetchJson(['../data/news.json', '/data/news.json'], { news: [] }),
      fetchJson(['../data/matches.json', '/data/matches.json'], { matches: [] }),
      fetchJson(['../data/partners.json', '/data/partners.json'], { partners: [] }),
      fetchJson(['../data/shop.json', '/data/shop.json'], { products: [] }),
      fetchJson(['../data/gallery.json', '/data/gallery.json'], { albums: [] }),
      fetchJson(['../data/senior.json', '/data/senior.json'], { players: [], staff: [] }),
      fetchJson(['../data/academy.json', '/data/academy.json'], { categories: [] }),
      fetchJson(['../data/youth.json', '/data/youth.json'], { categories: [] }),
      fetchJson(['../data/feminines.json', '/data/feminines.json'], { categories: [] }),
      fetchJson(['../data/settings.json', '/data/settings.json'], {}),
      fetchJson(['../data/media-library.json', '/data/media-library.json'], { assets: [] })
    ]);

    state.data.news = collectionFrom(news.data, 'news');
    state.data.events = collectionFrom(matches.data, 'matches');
    state.data.partners = collectionFrom(partners.data, 'partners');
    state.data.products = collectionFrom(shop.data, 'products');
    state.data.albums = collectionFrom(gallery.data, 'albums');
    state.data.media = collectionFrom(media.data, 'assets');
    state.data.teams = [
      ...collectionFrom(academy.data, 'categories').map((item) => ({ ...item, source: 'Ecole de rugby' })),
      ...collectionFrom(youth.data, 'categories').map((item) => ({ ...item, source: 'Pole jeunes' })),
      ...collectionFrom(feminines.data, 'categories').map((item) => ({ ...item, source: 'Cadettes' })),
      ...collectionFrom(youth.data, 'categories').flatMap((item) => teamPlayersFromCategory(item, 'Pole jeunes')),
      ...collectionFrom(feminines.data, 'categories').flatMap((item) => teamPlayersFromCategory(item, 'Cadettes')),
      ...(senior.data?.players || []).map((item) => ({ ...item, age: `${item.firstName || ''} ${item.lastName || ''}`, label: item.primaryPosition || item.position || item.group || 'Senior', source: 'Senior', teamPhoto: item.photo })),
      ...(senior.data?.staff || []).map((item) => ({ ...item, age: `${item.firstName || ''} ${item.lastName || ''}`, label: item.role || 'Staff senior', source: 'Staff', teamPhoto: item.photo }))
    ];
    buildCompositionEvents();
    state.data.settings = settings.data || {};
    hydrateSourceSelect();
    const count = state.data.news.length + state.data.events.length + state.data.partners.length + state.data.products.length + state.data.albums.length + state.data.teams.length;
    setStatus(`${count} element(s) CMS disponibles pour le Studio RCC.`);
    hydrateCompositionMatches();
    hydrateCompositionPlayers();
    hydrateNewsletterSources();
    hydrateMediaLibrary();
    render();
  }

  function setSourceSelectLoading(label) {
    if (!sourceSelect) return;
    sourceSelect.innerHTML = `<option value="">${label}</option>`;
    sourceSelect.disabled = true;
  }

  function currentItems() {
    if (state.activeSource === 'news') return state.data.news;
    if (state.activeSource === 'event') return state.data.events;
    if (state.activeSource === 'partner') return state.data.partners;
    if (state.activeSource === 'shop') return state.data.products;
    if (state.activeSource === 'gallery') return state.data.albums;
    if (state.activeSource === 'team') return state.data.teams;
    return [];
  }

  function labelForItem(item) {
    if (state.activeSource === 'event') return `${item.date ? formatDate(item.date) + ' - ' : ''}${clean(item.title || item.tournamentName || item.opponent || item.team || 'Evenement RCC')}`;
    if (state.activeSource === 'partner') return clean(item.name || 'Partenaire RCC');
    if (state.activeSource === 'shop') return clean(`${item.name || 'Produit RCC'} ${item.price ? '- ' + item.price : ''}`);
    if (state.activeSource === 'gallery') return clean(item.title || item.category || 'Album RCC');
    if (state.activeSource === 'team') return clean(`${item.source || 'RCC'} - ${item.age || item.label || item.role || 'Equipe'}`);
    return clean(item.title || 'Actualite RCC');
  }

  function hydrateSourceSelect() {
    if (!sourceSelect) return;
    const items = currentItems();
    if (!items.length) {
      sourceSelect.disabled = state.activeSource === 'blank';
      sourceSelect.innerHTML = `<option value="">${state.activeSource === 'blank' ? 'Affiche vierge' : 'Aucun contenu disponible'}</option>`;
      return;
    }
    sourceSelect.disabled = false;
    sourceSelect.innerHTML = '<option value="">Choisir dans le CMS</option>' + items.map((item, index) => `<option value="${index}">${labelForItem(item)}</option>`).join('');
  }

  function switchStudioTab(tab) {
    studioTabButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.studioTab === tab));
    studioTabPanels.forEach((panel) => {
      const active = panel.dataset.studioTabPanel === tab;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
    if (tab === 'compositions') renderComposition();
    if (tab === 'newsletters') renderNewsletter();
  }

  function hydrateCompositionMatches() {
    if (!compositionMatch) return;
    const team = compositionTeam?.value || 'Seniors';
    const matches = state.data.compositionEvents.filter((item) => matchesAudience(item, team));
    compositionMatch.innerHTML = '<option value="">Choisir un match</option>' + matches.map((item, index) => {
      return `<option value="${escapeHtml(item._studioValue || String(index))}">${escapeHtml(`${item.date ? formatDate(item.date) + ' - ' : ''}${eventTitle(item)}`)}</option>`;
    }).join('');
    updateCompositionMatchInfo();
  }

  function hydrateCompositionPlayers() {
    if (!compositionList) return;
    const team = compositionTeam?.value || 'Seniors';
    const players = playerPool(team);
    state.composition.slots = normalizeCompositionSlots(state.composition.slots);
    compositionList.innerHTML = state.composition.slots.map((slot, index) => {
      const label = index < 15 ? `Titulaire ${slot.number}` : `Banc ${index - 14}`;
      const photo = normalizeAssetPath(slot.photo);
      const options = playersForSlot(slot, players)
        .map((player) => `<option value="${escapeHtml(player.key)}">${escapeHtml(player.name)}${player.role ? ` - ${escapeHtml(player.role)}` : ''}${player.secondaryRole ? ` / ${escapeHtml(player.secondaryRole)}` : ''}</option>`)
        .join('');
      return `
        <article class="composition-slot" data-slot-editor="${index}">
          <button class="composition-slot-photo" type="button" data-focus-slot="${index}" aria-label="Modifier ${escapeHtml(slot.position)}">${photo ? `<img src="${escapeHtml(photo)}" alt="" loading="lazy" />` : `<b>${slot.number}</b>`}</button>
          <div>
            <span>${escapeHtml(label)} · ${escapeHtml(slot.position)}</span>
            <select data-composition-player="${index}">
              <option value="">A definir</option>
              ${options}
            </select>
            <input data-composition-manual="${index}" type="text" value="${escapeHtml(slot.player || '')}" placeholder="Nom libre si joueur absent du CMS" />
          </div>
          <button class="composition-clear-slot" type="button" data-composition-clear-slot="${index}" aria-label="Retirer le joueur">×</button>
        </article>
      `;
    }).join('');
    compositionList.querySelectorAll('[data-composition-player]').forEach((select) => {
      const slot = state.composition.slots[Number(select.dataset.compositionPlayer)];
      select.value = slot.playerKey || '';
      select.addEventListener('change', () => {
        setCompositionSlot(Number(select.dataset.compositionPlayer), select.value);
      });
    });
    compositionList.querySelectorAll('[data-composition-manual]').forEach((input) => {
      input.addEventListener('input', () => {
        const slot = state.composition.slots[Number(input.dataset.compositionManual)];
        slot.player = input.value;
        slot.playerKey = '';
        slot.photo = '';
        slot.role = '';
        renderComposition();
      });
    });
    compositionList.querySelectorAll('[data-composition-clear-slot]').forEach((button) => {
      button.addEventListener('click', () => {
        clearCompositionSlot(Number(button.dataset.compositionClearSlot));
      });
    });
    hydrateCaptainSelectors();
    renderComposition();
  }

  function normalizeCompositionSlots(slots) {
    const current = Array.isArray(slots) && slots.length ? slots : defaultCompositionSlots();
    return defaultCompositionSlots().map((base, index) => ({ ...base, ...(current[index] || {}) }));
  }

  function setCompositionSlot(index, key) {
    const team = compositionTeam?.value || 'Seniors';
    const slot = state.composition.slots[index];
    const player = selectedPlayerByKey(key, team);
    if (!slot) return;
    if (!player) {
      slot.player = '';
      slot.playerKey = '';
      slot.photo = '';
      slot.role = '';
    } else {
      slot.player = player.name;
      slot.playerKey = player.key;
      slot.photo = player.photo;
      slot.role = [player.role, player.secondaryRole].filter(Boolean).join(' / ');
    }
    hydrateCaptainSelectors();
    renderComposition();
    hydrateCompositionPlayers();
  }

  function clearCompositionSlot(index) {
    const base = defaultCompositionSlots()[index];
    if (!base) return;
    state.composition.slots[index] = base;
    hydrateCompositionPlayers();
  }

  function hydrateCaptainSelectors() {
    const names = compositionSelectedNames();
    const optionHtml = '<option value="">Choisir</option>' + names.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');
    [compositionCaptain, compositionVice].forEach((select) => {
      if (!select) return;
      const previous = select.value;
      select.innerHTML = optionHtml;
      select.value = names.includes(previous) ? previous : '';
    });
  }

  function updateCompositionMatchInfo() {
    if (!compositionMatchInfo) return;
    const item = compositionEventByValue(compositionMatch?.value || '');
    compositionMatchInfo.innerHTML = item
      ? `<strong>${escapeHtml(eventTitle(item))}</strong><span>${escapeHtml(eventDetails(item))}</span>`
      : 'Selectionne une equipe puis un match du calendrier.';
  }

  function renderComposition() {
    updateCompositionMatchInfo();
    if (!compositionPreview) return;
    const team = compositionTeam?.value || 'Seniors';
    const item = compositionEventByValue(compositionMatch?.value || '');
    const filled = state.composition.slots.filter((slot) => clean(slot.player));
    const captain = compositionCaptain?.value || state.composition.captain || '';
    const vice = compositionVice?.value || state.composition.viceCaptain || '';
    state.composition.captain = captain;
    state.composition.viceCaptain = vice;
    state.composition.coach = compositionCoach?.value || '';
    state.composition.comments = compositionComments?.value || '';
    compositionPreview.innerHTML = `
      <div class="composition-card">
        <header>
          <img src="../assets/logo-rcc.png" alt="" />
          <div>
            <span>${escapeHtml(team)}</span>
            <strong>${escapeHtml(eventTitle(item) || 'Composition RCC')}</strong>
            <small>${escapeHtml(eventDetails(item))}</small>
          </div>
        </header>
        <div class="composition-board composition-field">
          ${state.composition.slots.map((slot, index) => `
            <article class="${index < 15 ? 'starter' : 'bench'}" data-composition-preview-slot="${index}">
              <b>${slot.number}</b>
              ${slot.photo ? `<img src="${escapeHtml(normalizeAssetPath(slot.photo))}" alt="" loading="lazy" />` : ''}
              <span>${escapeHtml(slot.player || 'A definir')}</span>
              <small>${escapeHtml(slot.position)}${slot.player === captain ? ' · C' : ''}${slot.player === vice ? ' · VC' : ''}</small>
            </article>
          `).join('')}
        </div>
        <footer>
          <span>${filled.length}/23 joueurs renseignes</span>
          ${state.composition.coach ? `<span>Coach : ${escapeHtml(state.composition.coach)}</span>` : ''}
        </footer>
      </div>
    `;
    compositionPreview.querySelectorAll('[data-composition-preview-slot]').forEach((node) => {
      node.addEventListener('click', () => {
        const editor = compositionList?.querySelector(`[data-slot-editor="${node.dataset.compositionPreviewSlot}"] select`);
        editor?.focus();
        editor?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    });
    renderCompositionHistory();
  }

  function compositionStorageKey() {
    return `rcc_composition_${slug(compositionTeam?.value || 'seniors')}`;
  }

  function compositionHistoryKey() {
    return 'rcc_composition_history_v3';
  }

  function readCompositionHistory() {
    try {
      const items = JSON.parse(localStorage.getItem(compositionHistoryKey()) || '[]');
      return Array.isArray(items) ? items : [];
    } catch (error) {
      return [];
    }
  }

  function currentCompositionRecord(status = 'Brouillon') {
    const item = compositionEventByValue(compositionMatch?.value || '');
    return {
      id: `composition-${Date.now()}`,
      status,
      title: eventTitle(item) || `Composition ${compositionTeam?.value || 'RCC'}`,
      team: compositionTeam?.value || 'Seniors',
      match: compositionMatch?.value || '',
      eventTitle: eventTitle(item),
      eventDetails: eventDetails(item),
      date: item.date || new Date().toISOString().slice(0, 10),
      players: state.composition.slots.map((slot) => ({
        number: slot.number,
        position: slot.position,
        name: slot.player,
        role: slot.role,
        photo: slot.photo
      })),
      captain: compositionCaptain?.value || '',
      viceCaptain: compositionVice?.value || '',
      coach: compositionCoach?.value || '',
      comments: compositionComments?.value || '',
      channels: {
        site: Boolean(document.querySelector('[data-composition-publish-site]')?.checked),
        facebook: Boolean(document.querySelector('[data-composition-publish-facebook]')?.checked),
        instagram: Boolean(document.querySelector('[data-composition-publish-instagram]')?.checked),
        push: Boolean(document.querySelector('[data-composition-publish-push]')?.checked)
      },
      savedAt: new Date().toISOString()
    };
  }

  function saveCompositionHistory(status = 'Brouillon') {
    const history = readCompositionHistory();
    history.unshift(currentCompositionRecord(status));
    localStorage.setItem(compositionHistoryKey(), JSON.stringify(history.slice(0, 20)));
    renderCompositionHistory();
  }

  function renderCompositionHistory() {
    if (!compositionHistory) return;
    const history = readCompositionHistory().slice(0, 5);
    compositionHistory.innerHTML = history.length ? `
      <strong>Historique</strong>
      ${history.map((item) => `
        <button type="button" data-load-composition-history="${escapeHtml(item.id)}">
          <span>${escapeHtml(item.team)} · ${escapeHtml(item.status)}</span>
          <b>${escapeHtml(item.title || 'Composition RCC')}</b>
        </button>
      `).join('')}
    ` : '<p class="poster-help">Aucune composition enregistree.</p>';
    compositionHistory.querySelectorAll('[data-load-composition-history]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = readCompositionHistory().find((entry) => entry.id === button.dataset.loadCompositionHistory);
        if (item) loadCompositionRecord(item);
      });
    });
  }

  function loadCompositionRecord(record) {
    if (compositionTeam) compositionTeam.value = record.team || 'Seniors';
    hydrateCompositionMatches();
    if (compositionMatch) compositionMatch.value = record.match || '';
    state.composition.slots = normalizeCompositionSlots((record.players || []).map((player, index) => ({
      number: player.number || index + 1,
      position: player.position || RUGBY_POSITIONS[index],
      player: player.name || '',
      role: player.role || '',
      photo: player.photo || ''
    })));
    if (compositionCoach) compositionCoach.value = record.coach || '';
    if (compositionComments) compositionComments.value = record.comments || '';
    hydrateCompositionPlayers();
    if (compositionCaptain) compositionCaptain.value = record.captain || '';
    if (compositionVice) compositionVice.value = record.viceCaptain || '';
    setStatus('Composition chargee depuis l historique.');
  }

  function duplicateComposition() {
    saveCompositionHistory('Copie');
    setStatus('Composition dupliquee dans l historique.');
  }

  function publishComposition() {
    saveCompositionHistory('Publiee');
    const record = currentCompositionRecord('Publiee');
    const channels = Object.entries(record.channels).filter(([, active]) => active).map(([key]) => key).join(', ') || 'aucun canal coche';
    setStatus(`Composition prete pour publication : ${channels}.`);
    recordPublication('Composition publiee', `${record.team} - ${record.title} (${channels})`);
  }

  function saveCompositionDraft() {
    localStorage.setItem(compositionStorageKey(), JSON.stringify({
      team: compositionTeam?.value || 'Seniors',
      match: compositionMatch?.value || '',
      slots: state.composition.slots,
      captain: compositionCaptain?.value || '',
      viceCaptain: compositionVice?.value || '',
      coach: compositionCoach?.value || '',
      comments: compositionComments?.value || '',
      savedAt: new Date().toISOString()
    }));
    saveCompositionHistory('Brouillon');
    setStatus('Brouillon de composition enregistre.');
  }

  function loadCompositionDraft() {
    const draft = JSON.parse(localStorage.getItem(compositionStorageKey()) || 'null');
    if (!draft) {
      setStatus('Aucun brouillon trouve pour cette equipe.');
      return;
    }
    if (compositionMatch) compositionMatch.value = draft.match || '';
    state.composition.slots = normalizeCompositionSlots(draft.slots);
    if (compositionCoach) compositionCoach.value = draft.coach || '';
    if (compositionComments) compositionComments.value = draft.comments || '';
    hydrateCompositionPlayers();
    if (compositionCaptain) compositionCaptain.value = draft.captain || '';
    if (compositionVice) compositionVice.value = draft.viceCaptain || '';
    setStatus('Brouillon de composition charge.');
  }

  function clearCompositionDraft() {
    state.composition.slots = defaultCompositionSlots();
    if (compositionCaptain) compositionCaptain.value = '';
    if (compositionVice) compositionVice.value = '';
    if (compositionCoach) compositionCoach.value = '';
    if (compositionComments) compositionComments.value = '';
    hydrateCompositionPlayers();
    setStatus('Composition videe.');
  }

  function compositionText(channel = 'facebook') {
    const team = compositionTeam?.value || 'Seniors';
    const item = compositionEventByValue(compositionMatch?.value || '');
    const players = state.composition.slots.filter((slot) => clean(slot.player)).map((slot) => `${slot.number}. ${slot.player}${slot.role ? ` (${slot.role})` : ''}`);
    return [
      `Composition ${team} - ${eventTitle(item)}`,
      eventDetails(item),
      compositionCoach?.value ? `Coach : ${compositionCoach.value}` : '',
      players.join('\n'),
      compositionComments?.value || '',
      channel === 'instagram' ? '#RCCubzaguais #Rugby' : 'https://rccubzaguais.fr'
    ].filter(Boolean).join('\n\n');
  }

  function hydrateNewsletterSources() {
    if (!newsletterItems) return;
    const items = [
      ...state.data.news.slice(0, 10).map((item, index) => ({ type: 'Actu', title: item.title, detail: item.summary || item.category, value: `news-${index}` })),
      ...state.data.events.slice(0, 10).map((item, index) => ({ type: 'Calendrier', title: eventTitle(item), detail: eventDetails(item), value: `event-${index}` })),
      ...state.data.partners.slice(0, 6).map((item, index) => ({ type: 'Partenaire', title: item.name, detail: item.category || item.description, value: `partner-${index}` })),
      ...state.data.albums.slice(0, 6).map((item, index) => ({ type: 'Galerie', title: item.title, detail: item.category || item.description, value: `gallery-${index}` }))
    ];
    newsletterItems.innerHTML = items.length ? items.map((item, index) => `
      <label class="newsletter-item">
        <input type="checkbox" value="${escapeHtml(item.value)}" ${index < 4 ? 'checked' : ''} data-newsletter-check />
        <span><b>${escapeHtml(item.type)}</b>${escapeHtml(item.title || 'Info RCC')}<small>${escapeHtml(item.detail || '')}</small></span>
      </label>
    `).join('') : '<p class="poster-help">Aucun contenu disponible.</p>';
    if (newsletterPartner) {
      newsletterPartner.innerHTML = '<option value="">Choisir un partenaire</option>' + state.data.partners.map((item, index) => `<option value="${index}">${escapeHtml(item.name || 'Partenaire RCC')}</option>`).join('');
    }
    newsletterItems.querySelectorAll('[data-newsletter-check]').forEach((checkbox) => checkbox.addEventListener('change', renderNewsletter));
    [newsletterTitle, newsletterPeriod, newsletterIntro, newsletterPartner, newsletterReminder, newsletterTemplate].forEach((node) => node?.addEventListener('input', renderNewsletter));
    renderNewsletterBlocks();
    renderNewsletter();
  }

  function selectedNewsletterItems() {
    return [...(newsletterItems?.querySelectorAll('[data-newsletter-check]:checked') || [])].map((checkbox) => {
      const [type, index] = checkbox.value.split('-');
      if (type === 'news') return { type: 'Actualite', item: state.data.news[Number(index)] };
      if (type === 'event') return { type: 'Calendrier', item: state.data.events[Number(index)] };
      if (type === 'partner') return { type: 'Partenaire', item: state.data.partners[Number(index)] };
      if (type === 'gallery') return { type: 'Photo', item: state.data.albums[Number(index)] };
      return null;
    }).filter((entry) => entry.item);
  }

  function newsletterBlockLabel(type) {
    const labels = {
      editorial: 'Editorial',
      news: 'Actualite',
      result: 'Resultat',
      calendar: 'Calendrier',
      interview: 'Interview',
      partner: 'Zoom partenaire',
      photo: 'Photo',
      ranking: 'Classement',
      club: 'Vie du club',
      volunteer: 'Benevole du mois',
      quote: 'Citation',
      sponsors: 'Sponsors'
    };
    return labels[type] || 'Bloc';
  }

  function addNewsletterBlock() {
    const type = newsletterBlockType?.value || 'news';
    const source = selectedNewsletterItems()[0];
    state.newsletterBlocks.push({
      id: `block-${Date.now()}`,
      type,
      title: source?.item?.title || eventTitle(source?.item || {}) || newsletterBlockLabel(type),
      text: source?.item?.summary || eventDetails(source?.item || {}) || 'Texte a completer.',
      image: source?.item?.image || source?.item?.cover || ''
    });
    renderNewsletterBlocks();
    renderNewsletter();
  }

  function renderNewsletterBlocks() {
    if (!newsletterBlocks) return;
    newsletterBlocks.innerHTML = state.newsletterBlocks.length ? state.newsletterBlocks.map((block, index) => `
      <article class="newsletter-block-editor">
        <span>${escapeHtml(newsletterBlockLabel(block.type))}</span>
        <input data-newsletter-block-title="${index}" value="${escapeHtml(block.title)}" />
        <textarea data-newsletter-block-text="${index}" rows="2">${escapeHtml(block.text)}</textarea>
        <button type="button" data-newsletter-remove-block="${index}">Retirer</button>
      </article>
    `).join('') : '<p class="poster-help">Ajoute des blocs pour construire une newsletter type journal.</p>';
    newsletterBlocks.querySelectorAll('[data-newsletter-block-title]').forEach((input) => input.addEventListener('input', () => {
      state.newsletterBlocks[Number(input.dataset.newsletterBlockTitle)].title = input.value;
      renderNewsletter();
    }));
    newsletterBlocks.querySelectorAll('[data-newsletter-block-text]').forEach((input) => input.addEventListener('input', () => {
      state.newsletterBlocks[Number(input.dataset.newsletterBlockText)].text = input.value;
      renderNewsletter();
    }));
    newsletterBlocks.querySelectorAll('[data-newsletter-remove-block]').forEach((button) => button.addEventListener('click', () => {
      state.newsletterBlocks.splice(Number(button.dataset.newsletterRemoveBlock), 1);
      renderNewsletterBlocks();
      renderNewsletter();
    }));
  }

  function hydrateMediaLibrary() {
    if (!mediaLibrary) return;
    const fromAlbums = state.data.albums.flatMap((album) => asList(album.photos).map((photo) => ({
      title: photo.alt || album.title || 'Photo RCC',
      category: album.category || 'Galerie',
      image: typeof photo === 'string' ? photo : (photo.image || photo.url || photo.src || '')
    })));
    const fromMedia = state.data.media.map((item) => ({
      title: item.title || item.alt || 'Image RCC',
      category: item.category || 'Mediatheque',
      image: item.image || item.url
    }));
    const assets = [...fromMedia, ...fromAlbums].filter((item) => item.image).slice(0, 12);
    mediaLibrary.innerHTML = assets.length ? assets.map((item) => `
      <button type="button" data-media-src="${escapeHtml(item.image)}" title="${escapeHtml(item.title)}">
        <img src="${escapeHtml(normalizeAssetPath(item.image))}" alt="" loading="lazy" />
        <span>${escapeHtml(item.category)}</span>
      </button>
    `).join('') : '<p class="poster-help">Ajoute des images dans Pages CMS pour alimenter la mediatheque.</p>';
    mediaLibrary.querySelectorAll('[data-media-src]').forEach((button) => button.addEventListener('click', () => {
      loadRemoteImage(button.dataset.mediaSrc, 'image');
      setStatus('Image chargee depuis la mediatheque.');
    }));
  }

  function renderNewsletter() {
    if (!newsletterPreview) return;
    const selected = selectedNewsletterItems();
    const partner = state.data.partners[Number(newsletterPartner?.value)];
    const blocks = state.newsletterBlocks.length ? state.newsletterBlocks : selected.slice(0, 6).map(({ type, item }) => ({
      type,
      title: item.title || eventTitle(item),
      text: item.summary || eventDetails(item) || item.category || ''
    }));
    newsletterPreview.innerHTML = `
      <article class="newsletter-page newsletter-template-${escapeHtml(newsletterTemplate?.value || 'monthly')}">
        <header>
          <img src="../assets/logo-rcc.png" alt="" />
          <div><strong>${escapeHtml(newsletterTitle?.value || 'Newsletter RCC')}</strong><span>${escapeHtml(newsletterPeriod?.value || CURRENT_SEASON)}</span></div>
        </header>
        <p>${escapeHtml(newsletterIntro?.value || '')}</p>
        <section>
          ${blocks.slice(0, 10).map((block) => `
            <div>
              <b>${escapeHtml(newsletterBlockLabel(block.type) || block.type)}</b>
              <strong>${escapeHtml(block.title || 'Info RCC')}</strong>
              <span>${escapeHtml(block.text || '')}</span>
            </div>
          `).join('')}
        </section>
        <footer>
          <span>${partner ? `Partenaire : ${escapeHtml(partner.name || '')}` : 'RC Cubzaguais'}</span>
          <span>${escapeHtml(newsletterReminder?.value || 'rccubzaguais.fr')}</span>
        </footer>
      </article>
    `;
  }

  function loadRemoteImage(src, key = 'image') {
    const normalized = normalizeAssetPath(src);
    if (!normalized) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state[key] = img;
      if (key === 'image') {
        setField('photoOffsetX', 0);
        setField('photoOffsetY', 0);
      }
      render();
    };
    img.onerror = () => setStatus('Image non chargee dans le Studio. Le visuel reste utilisable avec le fond RCC.');
    img.src = normalized;
  }

  function applySource(index) {
    const item = currentItems()[Number(index)];
    if (!item) return;
    state.image = null;
    state.opponentLogo = null;

    if (state.activeSource === 'news') applyNews(item);
    if (state.activeSource === 'event') applyEvent(item);
    if (state.activeSource === 'partner') applyPartner(item);
    if (state.activeSource === 'shop') applyShop(item);
    if (state.activeSource === 'gallery') applyGallery(item);
    if (state.activeSource === 'team') applyTeam(item);
    updateCaption();
    render();
  }

  function applyNews(item) {
    setTemplate(item.category === 'Partenaires' ? 'partner' : 'news');
    setField('title', item.title || '');
    setField('subtitle', item.category || 'Actualite RCC');
    setField('category', item.category || 'Club');
    setField('date', item.date ? formatDate(item.date) : '');
    setField('time', '');
    setField('location', '');
    setField('score', '');
    setField('opponent', '');
    setField('summary', item.summary || item.body || item.content || '');
    if (item.image) loadRemoteImage(item.image);
  }

  function applyEvent(item) {
    const eventType = clean(item.type_evenement || item.type || 'match').toLowerCase();
    const isTournament = eventType === 'tournoi';
    const isTraining = eventType === 'entrainement' || eventType === 'training';
    const isResult = Boolean(item.result) || item.status === 'win' || item.status === 'loss';
    const template = isTournament ? 'tournament' : isTraining ? 'training' : isResult ? 'result' : 'upcoming';
    const teams = asList(item.teams).length ? asList(item.teams).join(' / ') : item.team || item.category || '';
    setTemplate(template);
    setField('title', isTournament ? (item.tournamentName || item.title || 'Tournoi RCC') : item.title || (template === 'training' ? 'Entrainement RCC' : 'RC CUBZAGUAIS'));
    setField('subtitle', teams || item.competition || '');
    setField('category', item.competition || teams || (isTournament ? 'Tournoi' : 'Match'));
    setField('opponent', item.opponent || item.away || '');
    setField('date', formatDate(item.date));
    setField('time', item.time || '');
    setField('location', item.location || item.venue || '');
    setField('score', item.result || '');
    setField('summary', item.description || item.summary || '');
    if (item.image) loadRemoteImage(item.image);
    if (item.opponentLogo || item.partnerLogo) loadRemoteImage(item.opponentLogo || item.partnerLogo, 'opponentLogo');
  }

  function applyPartner(item) {
    setTemplate('partner');
    setField('title', 'Merci');
    setField('subtitle', item.name || 'Partenaire RCC');
    setField('category', item.category || 'Partenaire');
    setField('opponent', item.name || '');
    setField('summary', item.description || 'Merci pour votre soutien au RC Cubzaguais.');
    if (item.logo) loadRemoteImage(item.logo, 'opponentLogo');
  }

  function applyShop(item) {
    setTemplate('partner');
    setField('title', item.name || 'Boutique RCC');
    setField('subtitle', item.category || 'Boutique officielle');
    setField('category', item.price || 'Boutique');
    setField('summary', item.description || 'Retrouvez cet article dans la boutique officielle du RCC.');
    if (item.image) loadRemoteImage(item.image);
  }

  function applyGallery(item) {
    setTemplate('club');
    setField('title', item.title || 'Vie du club');
    setField('subtitle', item.category || 'Galerie RCC');
    setField('category', item.category || 'Club');
    setField('date', item.date ? formatDate(item.date) : '');
    setField('summary', item.description || '');
    if (item.cover) loadRemoteImage(item.cover);
    else if (item.photos?.[0]?.image) loadRemoteImage(item.photos[0].image);
  }

  function applyTeam(item) {
    setTemplate('club');
    setField('title', item.age || 'Equipe RCC');
    setField('subtitle', item.label || item.role || item.source || '');
    setField('category', item.source || 'Equipe RCC');
    setField('date', '');
    setField('time', item.training || '');
    setField('location', item.location || 'Plaine des Sports Laurent Ricci');
    setField('summary', item.summary || item.position || item.role || 'Presentation officielle du RC Cubzaguais.');
    if (item.teamPhoto) loadRemoteImage(item.teamPhoto);
  }

  function setTemplate(template) {
    setField('template', template);
    setField('style', STYLE_DEFAULTS[template] || 'match');
    syncTemplateButtons(template);
  }

  function loadImageFromFile(file, key) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state[key] = img;
        if (key === 'image') {
          setField('photoOffsetX', 0);
          setField('photoOffsetY', 0);
        }
        render();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function resizeCanvas(formatKey) {
    const format = FORMATS[formatKey] || FORMATS.square;
    canvas.width = format.width;
    canvas.height = format.height;
    if (sizeNode) sizeNode.textContent = `${format.width} x ${format.height}`;
    return format;
  }

  function coverImage(img, x, y, w, h, zoom = 1, offsetX = 0, offsetY = 0) {
    if (!img || !img.width || !img.height) return false;
    const scale = Math.max(w / img.width, h / img.height) * zoom;
    const sw = w / scale;
    const sh = h / scale;
    const sx = clamp((img.width - sw) / 2 - offsetX * img.width, 0, Math.max(0, img.width - sw));
    const sy = clamp((img.height - sh) / 2 - offsetY * img.height, 0, Math.max(0, img.height - sh));
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    return true;
  }

  function fitImage(img, x, y, w, h) {
    if (!img || !img.width || !img.height) return false;
    const scale = Math.min(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
  }

  function roundRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function fillRounded(x, y, w, h, r, fillStyle, strokeStyle, lineWidth = 1) {
    roundRect(x, y, w, h, r);
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  function polygon(points) {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }

  function drawBackground(w, h, data, style) {
    const mode = data.colorMode || 'red';
    const main = mode === 'blue' ? COLORS.navyBright : COLORS.red;
    const secondary = mode === 'dark' ? '#111' : COLORS.navy;
    const styleOverlay = {
      match: 0.72,
      magazine: 0.54,
      club: 0.48,
      partner: 0.62,
      recruitment: 0.68,
      tournament: 0.63
    };
    const requestedOverlay = clamp(Number(data.overlay || 65) / 100, 0.45, 0.82);
    const overlay = clamp((requestedOverlay + (styleOverlay[style] || requestedOverlay)) / 2, 0.42, 0.84);
    const zoom = clamp(Number(data.photoZoom || 112) / 100, 1, 1.7);

    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, COLORS.black);
    base.addColorStop(0.5, COLORS.deep);
    base.addColorStop(1, '#13030a');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    if (state.image) {
      coverImage(state.image, 0, 0, w, h, zoom, Number(data.photoOffsetX || 0) / 100, Number(data.photoOffsetY || 0) / 100);
      ctx.fillStyle = `rgba(0,0,0,${overlay})`;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = style === 'club' ? 'rgba(255,210,160,.08)' : style === 'magazine' ? 'rgba(6,27,56,.12)' : 'rgba(177,24,69,.14)';
      ctx.fillRect(0, 0, w, h);
    } else {
      drawRccGraphicBackground(w, h, main, secondary);
    }

    drawGraphicStripes(w, h, main, secondary, style);
    drawStyleTexture(w, h, main, secondary, style);
    drawNoise(w, h);
    drawVignette(w, h);
  }

  function drawRccGraphicBackground(w, h, main, secondary) {
    const radial = ctx.createRadialGradient(w * 0.78, h * 0.15, 20, w * 0.78, h * 0.15, Math.max(w, h) * 0.7);
    radial.addColorStop(0, `${main}88`);
    radial.addColorStop(0.42, `${secondary}38`);
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.12;
    fitImage(logo, w * 0.62, h * 0.2, w * 0.42, h * 0.42);
    ctx.globalAlpha = 1;
  }

  function drawGraphicStripes(w, h, main, secondary, style) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = style === 'partner' ? 0.08 : style === 'magazine' || style === 'club' ? 0.1 : 0.24;
    ctx.fillStyle = main;
    polygon([[w * 0.64, 0], [w, 0], [w, h * (style === 'match' ? 0.2 : 0.1)], [w * 0.54, h * (style === 'match' ? 0.34 : 0.28)]]);
    ctx.fill();
    ctx.globalAlpha = style === 'partner' ? 0.09 : style === 'club' ? 0.08 : 0.22;
    ctx.fillStyle = secondary;
    polygon([[w * 0.72, h * 0.25], [w, h * 0.16], [w, h * 0.48], [w * 0.6, h * 0.58]]);
    ctx.fill();
    if (style === 'magazine' || style === 'partner') {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = style === 'partner' ? COLORS.white : main;
      ctx.fillRect(w * 0.055, h * 0.13, w * 0.012, h * 0.58);
      ctx.restore();
      return;
    }
    if (style === 'club') {
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = main;
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.2, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.globalAlpha = style === 'tournament' ? 0.22 : 0.18;
    for (let i = 0; i < (style === 'recruitment' ? 13 : 9); i += 1) {
      const y = h * (0.08 + i * 0.038);
      ctx.fillStyle = i % 2 ? secondary : main;
      polygon([[w * (0.04 + i * 0.02), y], [w * (0.42 + i * 0.06), y - h * 0.012], [w * (0.38 + i * 0.06), y + h * 0.01], [w * (0.03 + i * 0.02), y + h * 0.02]]);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStyleTexture(w, h, main, secondary, style) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    if (style === 'match') {
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = main;
      ctx.lineWidth = Math.max(4, w * 0.006);
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.moveTo(w * (0.08 + i * 0.11), h * 0.1);
        ctx.lineTo(w * (0.34 + i * 0.13), h * 0.88);
        ctx.stroke();
      }
    } else if (style === 'magazine') {
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = COLORS.white;
      ctx.fillRect(w * 0.07, h * 0.17, w * 0.86, Math.max(2, h * 0.003));
      ctx.fillRect(w * 0.07, h * 0.84, w * 0.86, Math.max(2, h * 0.003));
      ctx.fillStyle = main;
      ctx.fillRect(w * 0.07, h * 0.2, Math.max(7, w * 0.012), h * 0.48);
    } else if (style === 'club') {
      ctx.globalAlpha = 0.14;
      const glow = ctx.createRadialGradient(w * 0.35, h * 0.28, 0, w * 0.35, h * 0.28, Math.max(w, h) * 0.55);
      glow.addColorStop(0, 'rgba(255,248,239,.35)');
      glow.addColorStop(0.35, `${main}44`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    } else if (style === 'partner') {
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = COLORS.white;
      ctx.lineWidth = Math.max(1, w * 0.002);
      for (let i = 0; i < 4; i += 1) {
        ctx.strokeRect(w * (0.1 + i * 0.018), h * (0.15 + i * 0.018), w * (0.8 - i * 0.036), h * (0.68 - i * 0.036));
      }
    } else if (style === 'recruitment') {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = main;
      polygon([[0, h * 0.72], [w, h * 0.54], [w, h * 0.68], [0, h * 0.88]]);
      ctx.fill();
      ctx.fillStyle = secondary;
      polygon([[0, h * 0.12], [w * 0.7, 0], [w, h * 0.06], [0, h * 0.28]]);
      ctx.fill();
    } else if (style === 'tournament') {
      ctx.globalAlpha = 0.24;
      ctx.strokeStyle = main;
      ctx.lineWidth = Math.max(2, w * 0.004);
      for (let i = 0; i < 9; i += 1) {
        ctx.beginPath();
        ctx.arc(w * 0.74, h * 0.26, Math.min(w, h) * (0.08 + i * 0.035), 0.2, Math.PI * 1.25);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawNoise(w, h) {
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = COLORS.white;
    const count = Math.round((w * h) / 18000);
    for (let i = 0; i < count; i += 1) {
      const size = 1 + (i % 3);
      ctx.fillRect((i * 97) % w, (i * 193) % h, size, size);
    }
    ctx.restore();
  }

  function drawVignette(w, h) {
    const vignette = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.18, w / 2, h / 2, Math.max(w, h) * 0.78);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,.86)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function drawTop(w, h, data, scale) {
    const pad = w * 0.055;
    const logoSize = Math.min(w, h) * 0.095;
    fitImage(logo, pad, pad * 0.68, logoSize, logoSize);
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLORS.white;
    ctx.font = `900 ${40 * scale}px ${BODY_FONT}`;
    ctx.fillText('RC CUBZAGUAIS', pad + logoSize + 22 * scale, pad * 0.88);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${22 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(data.category || data.subtitle || 'RCC'), pad + logoSize + 22 * scale, pad * 0.88 + 48 * scale);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,248,239,.78)';
    ctx.font = `800 ${22 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(`SAISON ${CURRENT_SEASON}`), w - pad, pad);
    ctx.textAlign = 'left';
  }

  function drawMainTitle(w, h, data, scale) {
    const textScale = clamp(Number(data.textScale || 100) / 100, 0.82, 1.22);
    const title = upper(TEMPLATE_TITLES[data.template] || data.title || 'RCC');
    const pad = w * 0.055;
    const maxWidth = w - pad * 2;
    const baseSize = Math.min(w * 0.21, h * 0.16) * textScale;
    const y = data.textPosition === 'center' ? h * 0.2 : h * 0.155;
    ctx.save();
    ctx.shadowColor = 'rgba(211,26,82,.38)';
    ctx.shadowBlur = 24 * scale;
    drawFittedLines(title, pad, y, maxWidth, baseSize, baseSize * 0.86, 2, COLORS.white, TITLE_FONT);
    ctx.restore();

    const accent = upper(data.title || data.subtitle || '');
    if (accent && accent !== title) {
      ctx.save();
      ctx.rotate(-0.02);
      ctx.fillStyle = COLORS.redBright;
      ctx.font = `900 ${Math.min(w * 0.074, h * 0.052) * textScale}px ${IMPACT_FONT}`;
      ctx.fillText(accent.slice(0, 44), pad, y + baseSize * 1.03);
      ctx.restore();
    }
  }

  function drawFittedLines(text, x, y, maxWidth, fontSize, lineHeight, maxLines, color, family) {
    let size = fontSize;
    let lines = [];
    while (size > fontSize * 0.45) {
      ctx.font = `900 ${size}px ${family}`;
      lines = buildLines(text, maxWidth, maxLines);
      if (lines.every((line) => ctx.measureText(line).width <= maxWidth)) break;
      size -= 4;
    }
    ctx.fillStyle = color;
    ctx.font = `900 ${size}px ${family}`;
    ctx.textBaseline = 'top';
    lines.slice(0, maxLines).forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return y + lines.slice(0, maxLines).length * lineHeight;
  }

  function buildLines(text, maxWidth, maxLines) {
    const words = upper(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line && lines.length < maxLines - 1) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawBadges(w, h, data, scale) {
    if (data.showBadges !== 'yes') return;
    const style = getStyleKey(data.style, data.template);
    const badges = [
      ['DATE', data.date],
      ['HEURE', data.time],
      ['LIEU', data.location],
      ['INFO', data.category || data.subtitle]
    ].filter((item) => clean(item[1]));
    if (!badges.length) return;
    const pad = w * 0.055;
    const gap = 14 * scale;
    const columns = Math.min(badges.length, w < h ? 2 : 4);
    const badgeWidth = (w - pad * 2 - gap * (columns - 1)) / columns;
    const yByStyle = {
      match: 0.35,
      magazine: 0.58,
      club: 0.52,
      partner: 0.72,
      recruitment: 0.42,
      tournament: 0.46
    };
    const y = h * (yByStyle[style] || 0.35);
    badges.forEach(([label, value], index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      drawInfoBadge(label, value, pad + col * (badgeWidth + gap), y + row * 82 * scale, badgeWidth, 68 * scale, scale);
    });
  }

  function drawInfoBadge(label, value, x, y, w, h, scale) {
    fillRounded(x, y, w, h, 11 * scale, 'rgba(3,3,3,.66)', 'rgba(211,26,82,.54)', 1.4 * scale);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${16 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(label), x + 15 * scale, y + 9 * scale);
    ctx.fillStyle = COLORS.white;
    drawSingleLine(upper(value), x + 15 * scale, y + 32 * scale, w - 30 * scale, 23 * scale, BODY_FONT);
  }

  function drawSingleLine(text, x, y, maxWidth, fontSize, family) {
    let size = fontSize;
    while (size > fontSize * 0.58) {
      ctx.font = `900 ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    ctx.fillText(text, x, y);
  }

  function drawFeatureZone(w, h, data, scale) {
    if (data.template === 'upcoming' || data.template === 'result') return drawMatchZone(w, h, data, scale);
    if (data.template === 'weekend') return drawWeekendZone(w, h, scale);
    if (data.template === 'partner' || data.template === 'shop') return drawPartnerZone(w, h, data, scale);
    const pad = w * 0.055;
    const y = h * 0.47;
    fillRounded(pad, y, w - pad * 2, h * 0.14, 16 * scale, 'rgba(3,3,3,.5)', 'rgba(255,255,255,.1)', 1 * scale);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(data.template === 'recruitment' ? 'PORTES OUVERTES' : 'RCC'), pad + 28 * scale, y + 22 * scale);
    drawFittedLines(data.subtitle || data.category || 'RC Cubzaguais', pad + 28 * scale, y + 54 * scale, w - pad * 2 - 56 * scale, Math.min(w * 0.058, h * 0.044), Math.min(w * 0.055, h * 0.041), 2, COLORS.white, IMPACT_FONT);
  }

  function drawMatchZone(w, h, data, scale) {
    const y = h * 0.47;
    const shieldW = w * 0.25;
    const shieldH = Math.min(h * 0.18, shieldW * 1.08);
    drawTeamShield(w * 0.08, y, shieldW, shieldH, 'RCC', logo, COLORS.red, scale);
    drawTeamShield(w - w * 0.08 - shieldW, y, shieldW, shieldH, data.opponent || 'ADVERSAIRE', state.opponentLogo, COLORS.navyBright, scale);
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.white;
    ctx.shadowColor = 'rgba(211,26,82,.5)';
    ctx.shadowBlur = 28 * scale;
    ctx.font = `900 ${Math.min(w * 0.095, h * 0.07)}px ${IMPACT_FONT}`;
    ctx.fillText(data.template === 'result' && data.score ? data.score : 'VS', w / 2, y + shieldH * 0.45);
    ctx.shadowBlur = 0;
    ctx.textAlign = 'left';
  }

  function drawTeamShield(x, y, w, h, name, img, color, scale) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 24 * scale;
    polygon([[x + w * 0.5, y], [x + w, y + h * 0.22], [x + w * 0.92, y + h], [x + w * 0.08, y + h], [x, y + h * 0.22]]);
    ctx.fillStyle = 'rgba(3,3,3,.78)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4 * scale;
    ctx.stroke();
    ctx.restore();
    if (img) fitImage(img, x + w * 0.17, y + h * 0.1, w * 0.66, h * 0.44);
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'center';
    drawFittedCentered(upper(name), x + w / 2, y + h * 0.68, w * 0.82, Math.min(w * 0.18, h * 0.16), IMPACT_FONT);
    ctx.textAlign = 'left';
  }

  function drawFittedCentered(text, cx, y, maxWidth, fontSize, family) {
    let size = fontSize;
    while (size > fontSize * 0.45) {
      ctx.font = `900 ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    ctx.fillText(text, cx, y);
  }

  function drawPartnerZone(w, h, data, scale) {
    const pad = w * 0.055;
    const y = h * 0.45;
    fillRounded(pad, y, w - pad * 2, h * 0.18, 16 * scale, 'rgba(3,3,3,.62)', 'rgba(211,26,82,.42)', 1.5 * scale);
    if (state.opponentLogo) fitImage(state.opponentLogo, pad + 24 * scale, y + 22 * scale, h * 0.12, h * 0.12);
    const x = pad + (state.opponentLogo ? h * 0.15 : 0) + 34 * scale;
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(data.template === 'shop' ? data.category || 'BOUTIQUE' : 'MERCI'), x, y + 26 * scale);
    drawFittedLines(data.subtitle || data.title || 'Partenaire RCC', x, y + 60 * scale, w - x - pad, Math.min(w * 0.062, h * 0.045), Math.min(w * 0.058, h * 0.042), 2, COLORS.white, IMPACT_FONT);
  }

  function drawWeekendZone(w, h, scale) {
    const pad = w * 0.055;
    const y = h * 0.43;
    const items = state.data.events.slice(0, 4);
    fillRounded(pad, y, w - pad * 2, h * 0.28, 16 * scale, 'rgba(3,3,3,.66)', 'rgba(211,26,82,.42)', 1.5 * scale);
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    items.forEach((event, index) => {
      const rowY = y + 30 * scale + index * 58 * scale;
      ctx.fillStyle = COLORS.redBright;
      ctx.fillText(formatDate(event.date).slice(0, 16).toUpperCase(), pad + 26 * scale, rowY);
      ctx.fillStyle = COLORS.white;
      drawSingleLine(upper(event.title || event.team || 'RCC'), pad + 270 * scale, rowY, w - pad * 2 - 300 * scale, 24 * scale, BODY_FONT);
    });
  }

  function drawBottomPanel(w, h, data, scale) {
    const pad = w * 0.055;
    const panelH = h * 0.18;
    const y = h - panelH - h * 0.075;
    fillRounded(pad, y, w - pad * 2, panelH, 16 * scale, 'rgba(3,3,3,.78)', 'rgba(177,24,69,.42)', 1.5 * scale);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    ctx.fillText(data.template === 'newsletter' ? 'A LA UNE' : 'INFORMATIONS', pad + 26 * scale, y + 22 * scale);
    ctx.fillStyle = COLORS.white;
    ctx.font = `800 ${Math.min(w * 0.036, h * 0.028)}px ${BODY_FONT}`;
    wrapParagraph(data.summary || data.subtitle || data.title || 'Retrouvez les informations du RC Cubzaguais.', pad + 26 * scale, y + 62 * scale, w - pad * 2 - 52 * scale, Math.min(w * 0.036, h * 0.028), Math.min(w * 0.043, h * 0.033), 3);
  }

  function wrapParagraph(text, x, y, maxWidth, fontSize, lineHeight, maxLines) {
    const words = clean(text).split(/\s+/).filter(Boolean);
    let line = '';
    let lines = 0;
    ctx.textBaseline = 'top';
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        if (lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
        lines += 1;
        line = word;
      } else {
        line = test;
      }
    });
    if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
  }

  function drawFooter(w, h, data, scale) {
    const pad = w * 0.055;
    const y = h - pad * 0.76;
    ctx.fillStyle = 'rgba(255,248,239,.82)';
    ctx.font = `900 ${23 * scale}px ${BODY_FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText('RCCUBZAGUAIS.FR', pad, y);
    ctx.textAlign = 'right';
    ctx.fillText('FACEBOOK  INSTAGRAM', w - pad, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.redBright;
    ctx.fillRect(pad, h - pad * 0.43, w - pad * 2, Math.max(4, 5 * scale));
    if (data.showQr === 'yes') drawQrPlaceholder(w - pad - 86 * scale, h - pad * 1.85, 72 * scale, scale);
  }

  function drawQrPlaceholder(x, y, size, scale) {
    fillRounded(x, y, size, size, 6 * scale, 'rgba(255,255,255,.92)', null);
    ctx.fillStyle = COLORS.black;
    const cell = size / 7;
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        if ((row + col) % 2 === 0 || row < 2 && col < 2 || row > 4 && col > 4) {
          ctx.fillRect(x + col * cell + cell * 0.18, y + row * cell + cell * 0.18, cell * 0.64, cell * 0.64);
        }
      }
    }
  }

  function drawGrid(w, h) {
    if (!state.showGrid) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 1;
    [1 / 3, 2 / 3].forEach((ratio) => {
      ctx.beginPath();
      ctx.moveTo(w * ratio, 0);
      ctx.lineTo(w * ratio, h);
      ctx.moveTo(0, h * ratio);
      ctx.lineTo(w, h * ratio);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawTop14Poster(w, h, data, scale) {
    drawTop(w, h, data, scale);
    drawMainTitle(w, h, data, scale);
    drawBadges(w, h, data, scale);
    drawFeatureZone(w, h, data, scale);
    drawBottomPanel(w, h, data, scale);
    drawFooter(w, h, data, scale);
  }

  function drawMagazinePoster(w, h, data, scale) {
    const pad = w * 0.06;
    drawTop(w, h, data, scale);
    ctx.save();
    ctx.fillStyle = 'rgba(255,248,239,.1)';
    ctx.fillRect(pad, h * 0.19, w - pad * 2, 2 * scale);
    ctx.fillStyle = COLORS.redBright;
    ctx.fillRect(pad, h * 0.23, 9 * scale, h * 0.28);
    drawFittedLines(data.title || TEMPLATE_TITLES[data.template], pad + 28 * scale, h * 0.23, w - pad * 2 - 28 * scale, Math.min(w * 0.12, h * 0.11), Math.min(w * 0.105, h * 0.092), 3, COLORS.white, TITLE_FONT);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(data.category || 'JOURNAL RCC'), pad + 28 * scale, h * 0.19);
    ctx.restore();
    drawBadges(w, h, data, scale);
    drawEditorialPanel(w, h, data, scale, 'A RETENIR');
    drawFooter(w, h, data, scale);
  }

  function drawClubPoster(w, h, data, scale) {
    const pad = w * 0.06;
    drawTop(w, h, data, scale);
    ctx.save();
    ctx.fillStyle = 'rgba(255,248,239,.08)';
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.24, Math.min(w, h) * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${28 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(data.category || 'VIE DU CLUB'), pad, h * 0.23);
    drawFittedLines(data.title || 'Ensemble au RCC', pad, h * 0.28, w - pad * 2, Math.min(w * 0.145, h * 0.118), Math.min(w * 0.12, h * 0.096), 3, COLORS.white, TITLE_FONT);
    fillRounded(pad, h * 0.63, w - pad * 2, h * 0.21, 22 * scale, 'rgba(10,10,10,.68)', 'rgba(255,248,239,.16)', 1 * scale);
    ctx.fillStyle = COLORS.muted;
    ctx.font = `800 ${Math.min(w * 0.04, h * 0.032)}px ${BODY_FONT}`;
    wrapParagraph(data.summary || data.subtitle || 'Un moment de partage aux couleurs du RC Cubzaguais.', pad + 28 * scale, h * 0.67, w - pad * 2 - 56 * scale, Math.min(w * 0.04, h * 0.032), Math.min(w * 0.047, h * 0.038), 4);
    ctx.restore();
    drawBadges(w, h, data, scale);
    drawFooter(w, h, data, scale);
  }

  function drawRecruitmentPoster(w, h, data, scale) {
    const pad = w * 0.055;
    drawTop(w, h, data, scale);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(211,26,82,.28)';
    polygon([[0, h * 0.35], [w, h * 0.18], [w, h * 0.38], [0, h * 0.56]]);
    ctx.fill();
    ctx.restore();
    const title = data.title || 'REJOINS LE RCC';
    drawFittedLines(title, pad, h * 0.2, w - pad * 2, Math.min(w * 0.18, h * 0.14), Math.min(w * 0.145, h * 0.11), 3, COLORS.white, TITLE_FONT);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${Math.min(w * 0.06, h * 0.046)}px ${IMPACT_FONT}`;
    ctx.fillText(upper(data.subtitle || data.category || 'JOUEURS - BENEVOLES - EDUCATEURS'), pad, h * 0.51);
    fillRounded(pad, h * 0.62, w - pad * 2, h * 0.18, 18 * scale, 'rgba(177,24,69,.78)', 'rgba(255,248,239,.22)', 1.2 * scale);
    ctx.fillStyle = COLORS.white;
    ctx.font = `900 ${Math.min(w * 0.042, h * 0.033)}px ${BODY_FONT}`;
    wrapParagraph(data.summary || 'Contacte le club et viens porter les couleurs du RCC.', pad + 26 * scale, h * 0.66, w - pad * 2 - 52 * scale, Math.min(w * 0.042, h * 0.033), Math.min(w * 0.048, h * 0.038), 3);
    drawBadges(w, h, data, scale);
    drawFooter(w, h, data, scale);
  }

  function drawPartnerPoster(w, h, data, scale) {
    const pad = w * 0.07;
    drawTop(w, h, data, scale);
    fillRounded(pad, h * 0.22, w - pad * 2, h * 0.48, 26 * scale, 'rgba(3,3,3,.72)', 'rgba(255,248,239,.18)', 1.2 * scale);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${28 * scale}px ${BODY_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(upper(data.category || 'PARTENAIRE RCC'), w / 2, h * 0.27);
    if (state.opponentLogo) {
      fitImage(state.opponentLogo, w * 0.35, h * 0.32, w * 0.3, h * 0.18);
    } else {
      fitImage(logo, w * 0.39, h * 0.32, w * 0.22, h * 0.18);
    }
    drawFittedCentered(upper(data.title || data.opponent || 'MERCI'), w / 2, h * 0.52, w * 0.72, Math.min(w * 0.1, h * 0.08), TITLE_FONT);
    ctx.textAlign = 'left';
    drawEditorialPanel(w, h, data, scale, 'PRESENTATION');
    drawFooter(w, h, data, scale);
  }

  function drawTournamentPoster(w, h, data, scale) {
    const pad = w * 0.055;
    drawTop(w, h, data, scale);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(13,52,103,.26)';
    polygon([[0, h * 0.18], [w * 0.42, h * 0.09], [w, h * 0.28], [w, h * 0.43], [0, h * 0.35]]);
    ctx.fill();
    ctx.fillStyle = 'rgba(211,26,82,.24)';
    polygon([[0, h * 0.5], [w, h * 0.35], [w, h * 0.51], [0, h * 0.66]]);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${30 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(data.category || 'RENDEZ-VOUS SPORTIF'), pad, h * 0.22);
    drawFittedLines(data.title || 'Tournoi RCC', pad, h * 0.28, w - pad * 2, Math.min(w * 0.15, h * 0.12), Math.min(w * 0.125, h * 0.1), 3, COLORS.white, TITLE_FONT);
    drawBadges(w, h, data, scale);
    fillRounded(pad, h * 0.61, w - pad * 2, h * 0.18, 18 * scale, 'rgba(3,3,3,.72)', 'rgba(211,26,82,.5)', 1.3 * scale);
    ctx.fillStyle = COLORS.white;
    ctx.font = `900 ${Math.min(w * 0.045, h * 0.035)}px ${BODY_FONT}`;
    wrapParagraph(data.summary || data.subtitle || 'Tournoi et rendez-vous du RC Cubzaguais.', pad + 26 * scale, h * 0.65, w - pad * 2 - 52 * scale, Math.min(w * 0.045, h * 0.035), Math.min(w * 0.052, h * 0.04), 3);
    drawFooter(w, h, data, scale);
  }

  function drawEditorialPanel(w, h, data, scale, label) {
    const pad = w * 0.06;
    const panelH = h * 0.18;
    const y = h - panelH - h * 0.09;
    fillRounded(pad, y, w - pad * 2, panelH, 18 * scale, 'rgba(3,3,3,.76)', 'rgba(177,24,69,.34)', 1.1 * scale);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${22 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(label), pad + 24 * scale, y + 20 * scale);
    ctx.fillStyle = COLORS.white;
    ctx.font = `800 ${Math.min(w * 0.036, h * 0.028)}px ${BODY_FONT}`;
    wrapParagraph(data.summary || data.subtitle || data.title || 'Retrouvez les informations du RCC.', pad + 24 * scale, y + 58 * scale, w - pad * 2 - 48 * scale, Math.min(w * 0.036, h * 0.028), Math.min(w * 0.043, h * 0.033), 3);
  }

  function renderPoster(data, w, h, scale) {
    const style = getStyleKey(data.style, data.template);
    applyPreviewStyle(style);
    drawBackground(w, h, data, style);
    if (style === 'magazine') drawMagazinePoster(w, h, data, scale);
    else if (style === 'club') drawClubPoster(w, h, data, scale);
    else if (style === 'partner') drawPartnerPoster(w, h, data, scale);
    else if (style === 'recruitment') drawRecruitmentPoster(w, h, data, scale);
    else if (style === 'tournament') drawTournamentPoster(w, h, data, scale);
    else drawTop14Poster(w, h, data, scale);
    drawGrid(w, h);
  }

  function render() {
    if (!canvas || !ctx || !form) return;
    const data = readForm();
    const format = resizeCanvas(data.format);
    const scale = Math.min(format.width / 1080, format.height / 1080);
    renderPoster(data, format.width, format.height, scale);
    updateCaption(data);
  }

  function templateLabel(template) {
    const labels = {
      news: 'actualite',
      upcoming: 'match',
      result: 'resultat',
      tournament: 'tournoi',
      training: 'entrainement',
      club: 'vie du club',
      recruitment: 'recrutement',
      partner: 'partenaire',
      shop: 'boutique',
      weekend: 'calendrier',
      team: 'equipe',
      educator: 'staff',
      newsletter: 'newsletter'
    };
    return labels[template] || 'publication';
  }

  function channelIntro(data) {
    const type = templateLabel(data.template);
    const title = clean(data.title || TEMPLATE_TITLES[data.template] || 'Info RCC');
    const category = clean(data.category || data.subtitle || 'Club');
    if (data.template === 'upcoming') return `Le Racing Club Cubzaguais vous donne rendez-vous pour ${title}.`;
    if (data.template === 'result') return `${title}${data.score ? ` : ${data.score}` : ''}.`;
    if (data.template === 'tournament') return `Le RCC vous donne rendez-vous pour ${title}.`;
    if (data.template === 'training') return `Entrainement RCC : ${title}.`;
    if (data.template === 'recruitment') return `${title || 'Rejoins le RCC'} !`;
    if (data.template === 'partner') return `Le RCC remercie ${clean(data.opponent || data.subtitle || 'son partenaire')} pour son soutien.`;
    if (data.template === 'club') return `Vie du club : ${title}.`;
    return `${category} : ${title}.`;
  }

  function publicationDetails(data) {
    return [
      data.date,
      data.time,
      data.location,
      data.opponent ? `Adversaire / partenaire : ${data.opponent}` : ''
    ].filter(Boolean).join('\n');
  }

  function hashtagsFor(data) {
    const tags = new Set(['RCCubzaguais', 'RacingClubCubzaguais', 'Rugby', 'NouvelleAquitaine']);
    const category = clean(data.category || data.subtitle).toLowerCase();
    const type = data.template;
    if (['u6', 'u8', 'u10', 'u12', 'u14'].some((key) => category.includes(key)) || category.includes('ecole')) tags.add('EcoleDeRugby');
    if (type === 'upcoming' || type === 'result') tags.add('MatchDeRugby');
    if (type === 'tournament') tags.add('TournoiRugby');
    if (type === 'training') tags.add('EntrainementRugby');
    if (type === 'partner') tags.add('PartenairesRCC');
    if (type === 'recruitment') tags.add('RejoinsLeRCC');
    if (type === 'club') tags.add('VieDuClub');
    if (category.includes('senior')) tags.add('SeniorsRCC');
    if (category.includes('cadette')) tags.add('CadettesRCC');
    if (category.includes('u16') || category.includes('u19')) tags.add('PoleJeunes');
    return Array.from(tags).map((tag) => `#${tag}`);
  }

  function socialText(data, channel = 'facebook') {
    const intro = channelIntro(data);
    const details = publicationDetails(data);
    const summary = clean(data.summary);
    const site = 'https://rccubzaguais.fr';
    const parts = [
      intro,
      details,
      summary,
      channel === 'instagram' ? hashtagsFor(data).join(' ') : `${site}\n\n${hashtagsFor(data).slice(0, 6).join(' ')}`
    ].filter(Boolean);
    return parts.join('\n\n');
  }

  function notificationPreview(data) {
    if (!checkedChannel(data, 'publishPush')) return 'Notification desactivee pour cette publication.';
    const title = clean(data.pushTitle || data.title || TEMPLATE_TITLES[data.template] || 'Info RCC');
    const short = title.length > 40 ? `${title.slice(0, 37).trimEnd()}...` : title;
    const body = clean(data.pushBody || data.summary || data.subtitle || 'Nouvelle information du RCC.');
    const audience = clean(data.pushAudience || data.category || 'general');
    const importance = data.pushImportance === 'important' ? 'Important' : 'Normal';
    const link = clean(data.pushUrl || '/actualites.html');
    return `${short}\n${body}\nPublic : ${audience} | ${importance}\nLien : ${link}`;
  }

  function syncPushSettings(data = readForm()) {
    if (!pushSettings) return;
    const enabled = checkedChannel(data, 'publishPush');
    pushSettings.hidden = !enabled;
    if (!enabled) return;
    if (!clean(form.elements.pushTitle?.value)) setField('pushTitle', data.title || TEMPLATE_TITLES[data.template] || 'Info RCC');
    if (!clean(form.elements.pushBody?.value)) setField('pushBody', data.summary || data.subtitle || 'Nouvelle information du RCC.');
    if (!clean(form.elements.pushUrl?.value)) setField('pushUrl', '/actualites.html');
    if (!clean(form.elements.pushAudience?.value)) setField('pushAudience', audienceFromCategory(data.category || data.template || 'general')[0] || 'general');
  }

  function checkedChannel(data, name) {
    return data[name] === 'yes' || data[name] === 'on';
  }

  function audienceFromCategory(value) {
    const text = clean(value).toLowerCase();
    const audience = new Set(['general']);
    if (text.includes('senior')) audience.add('seniors');
    if (text.includes('cadette') || text.includes('feminine') || text.includes('féminine')) audience.add('cadettes');
    if (text.includes('u6')) audience.add('u6');
    if (text.includes('u8')) audience.add('u8');
    if (text.includes('u10')) audience.add('u10');
    if (text.includes('u12')) audience.add('u12');
    if (text.includes('u14')) audience.add('u14');
    if (text.includes('u16')) audience.add('u16');
    if (text.includes('u19')) audience.add('u19');
    if (text.includes('ecole') || text.includes('école') || text.includes('u6') || text.includes('u8') || text.includes('u10') || text.includes('u12') || text.includes('u14')) audience.add('ecole');
    if (text.includes('jeune') || text.includes('u16') || text.includes('u19')) audience.add('jeunes');
    if (text.includes('tournoi')) audience.add('tournois');
    if (text.includes('match')) audience.add('matchs');
    if (text.includes('entrainement') || text.includes('entraînement')) audience.add('entrainements');
    if (text.includes('benevole') || text.includes('bénévole')) audience.add('benevoles');
    if (text.includes('partenaire')) audience.add('partenaires');
    return [...audience];
  }

  function recordPublication(status = 'préparée', error = '', meta = {}) {
    try {
      const data = readForm();
      const entry = {
        date: new Date().toISOString(),
        type: templateLabel(data.template),
        title: clean(data.title || 'Publication RCC'),
        site: checkedChannel(data, 'publishSite'),
        facebook: checkedChannel(data, 'publishFacebook'),
        instagram: checkedChannel(data, 'publishInstagram'),
        push: checkedChannel(data, 'publishPush'),
        notificationSent: Boolean(meta.notificationSent),
        notificationAudience: clean(meta.notificationAudience || data.pushAudience || ''),
        notificationSentAt: meta.notificationSent ? new Date().toISOString() : '',
        notificationError: clean(meta.notificationError || ''),
        status,
        error
      };
      const key = 'rcc_publication_history';
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      history.unshift(entry);
      localStorage.setItem(key, JSON.stringify(history.slice(0, 80)));
    } catch (error) {
      // Historique local non critique.
    }
  }

  function updateCaption(data = readForm()) {
    if (!captionOutput) return;
    const facebook = socialText(data, 'facebook');
    const instagram = socialText(data, 'instagram');
    const hashtags = hashtagsFor(data).join(' ');
    if (document.activeElement !== captionOutput) captionOutput.value = facebook;
    if (hashtagOutput) hashtagOutput.value = hashtags;
    if (previewSite) previewSite.textContent = clean(`${data.title || 'Publication RCC'} - ${data.summary || data.subtitle || 'Pret pour le site.'}`);
    if (previewFacebook) previewFacebook.textContent = facebook;
    if (previewInstagram) previewInstagram.textContent = instagram;
    if (previewPush) previewPush.textContent = notificationPreview(data);
  }

  async function prepareExport() {
    const data = readForm();
    if (!clean(data.title)) {
      form.elements.title?.focus();
      setStatus('Ajoute un titre avant de telecharger le visuel.');
      return false;
    }
    if (document.fonts && !state.fontsReady) {
      setStatus('Preparation des polices avant export...');
      await loadFonts();
    } else if (document.fonts) {
      await document.fonts.ready;
    }
    render();
    return true;
  }

  async function downloadPng() {
    if (!await prepareExport()) return;
    const data = readForm();
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `studio-rcc-${data.template || 'publication'}-${data.format || 'format'}.png`;
    link.click();
    recordPublication('PNG téléchargé');
    setStatus('PNG HD telecharge. Le visuel est pret a publier.');
  }

  function escapePdfText(value) {
    return String(value).replace(/[\\()]/g, '\\$&');
  }

  async function downloadPdf() {
    if (!await prepareExport()) return;
    const data = readForm();
    const jpeg = canvas.toDataURL('image/jpeg', 0.94);
    const binary = atob(jpeg.split(',')[1]);
    const imgBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) imgBytes[i] = binary.charCodeAt(i);
    const w = canvas.width;
    const h = canvas.height;
    const textEncoder = new TextEncoder();
    const parts = [];
    let length = 0;
    const offsets = [0];
    const pushText = (text) => {
      const bytes = textEncoder.encode(text);
      parts.push(bytes);
      length += bytes.byteLength;
    };
    const pushBytes = (bytes) => {
      parts.push(bytes);
      length += bytes.byteLength;
    };
    const startObject = (id) => {
      offsets[id] = length;
      pushText(`${id} 0 obj\n`);
    };
    pushText('%PDF-1.4\n');
    startObject(1);
    pushText('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    startObject(2);
    pushText('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    startObject(3);
    pushText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
    startObject(4);
    pushText(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.byteLength} >>\nstream\n`);
    pushBytes(imgBytes);
    pushText('\nendstream\nendobj\n');
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    startObject(5);
    pushText(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
    const xref = length;
    pushText('xref\n0 6\n0000000000 65535 f \n');
    for (let i = 1; i <= 5; i += 1) {
      pushText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    }
    pushText(`trailer\n<< /Size 6 /Root 1 0 R /Title (${escapePdfText(data.title || 'Studio RCC')}) >>\nstartxref\n${xref}\n%%EOF`);
    const blob = new Blob(parts, { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `studio-rcc-${data.template || 'publication'}-${data.format || 'format'}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
    recordPublication('PDF téléchargé');
    setStatus('PDF telecharge.');
  }

  async function copyText(text, fallbackNode, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(successMessage);
    } catch (error) {
      fallbackNode?.select?.();
      setStatus('Texte pret a copier.');
    }
  }

  async function copyCaption() {
    await copyText(captionOutput?.value || '', captionOutput, 'Texte de publication copie.');
    recordPublication('Texte copié');
  }

  async function copyFacebook() {
    await copyText(socialText(readForm(), 'facebook'), captionOutput, 'Texte Facebook copie.');
    recordPublication('Facebook manuel prêt');
  }

  async function copyInstagram() {
    await copyText(socialText(readForm(), 'instagram'), captionOutput, 'Texte Instagram copie.');
    recordPublication('Instagram manuel prêt');
  }

  async function copyHashtags() {
    await copyText(hashtagOutput?.value || hashtagsFor(readForm()).join(' '), hashtagOutput, 'Hashtags copies.');
    recordPublication('Hashtags copiés');
  }

  async function checkMetaStatus() {
    try {
      const response = await fetch('/api/meta/status', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Statut Meta indisponible.');
      const missing = Array.isArray(data.missingSecrets) && data.missingSecrets.length ? ` Variables manquantes : ${data.missingSecrets.join(', ')}.` : '';
      setStatus(data.metaConfigured ? 'Meta est configure pour les prochaines etapes.' : `Meta non configure.${missing}`);
      recordPublication(data.metaConfigured ? 'Meta prêt' : 'Meta non configuré', missing);
    } catch (error) {
      setStatus('Statut Meta indisponible pour le moment.');
      recordPublication('Erreur Meta', error.message || 'Statut indisponible');
    }
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  }

  async function checkSitePublishingConfig() {
    try {
      const response = await fetch('/api/studio/publish', { method: 'GET' });
      const data = await response.json().catch(() => ({}));
      return {
        ok: response.ok && Boolean(data.sitePublishingReady),
        message: data.help || 'Pour activer la publication sur le site, ajoute la variable RCC_GITHUB_TOKEN dans Cloudflare Pages > Settings > Environment variables.'
      };
    } catch (error) {
      return {
        ok: false,
        message: 'Configuration publication indisponible. Verifie que les Cloudflare Pages Functions sont deployees.'
      };
    }
  }

  function buildPublicationPayload(data, imageData, adminPassword = '') {
    const summary = clean(data.summary || data.subtitle || 'Nouvelle publication du RC Cubzaguais.');
    const audience = data.pushAudience
      ? [data.pushAudience]
      : audienceFromCategory(`${data.category || ''} ${data.template || ''}`);
    const sendPushNow = checkedChannel(data, 'publishPush') && data.pushMode !== 'draft';
    const pushUrl = clean(data.pushUrl || '/actualites.html');
    const body = [
      data.subtitle,
      data.summary,
      data.date ? `Date : ${data.date}` : '',
      data.time ? `Heure : ${data.time}` : '',
      data.location ? `Lieu : ${data.location}` : '',
      data.opponent ? `Adversaire / partenaire : ${data.opponent}` : '',
      hashtagOutput?.value || hashtagsFor(data).join(' ')
    ].filter(Boolean).join('\n');

    return {
      publishSite: checkedChannel(data, 'publishSite'),
      publishPush: sendPushNow,
      ...(adminPassword ? { password: adminPassword } : {}),
      article: {
        title: clean(data.title || 'Publication RCC'),
        summary,
        body,
        imageData,
        category: clean(data.category || templateLabel(data.template) || 'Club'),
        audience,
        important: false,
        notification: sendPushNow,
        featured: false,
        date: new Date().toISOString().slice(0, 10),
        hashtags: hashtagsFor(data)
      },
      push: {
        type: data.template || 'news',
        title: clean(data.pushTitle || data.title || 'Publication RCC').slice(0, 48),
        body: clean(data.pushBody || summary).slice(0, 140),
        audience,
        url: pushUrl,
        important: data.pushImportance === 'important'
      }
    };
  }

  async function publishStudio() {
    const data = readForm();
    if (checkedChannel(data, 'publishSite')) {
      setStatus('Verification de la configuration GitHub...');
      const config = await checkSitePublishingConfig();
      if (!config.ok) {
        setStatus(config.message);
        recordPublication('Publication site non configuree', config.message);
        return;
      }
    }

    if (!await prepareExport()) return;

    const imageData = canvas.toDataURL('image/png');
    const results = [];
    let articleUrl = '/actualites.html';
    let siteReady = !checkedChannel(data, 'publishSite');
    const shouldSendPush = checkedChannel(data, 'publishPush') && data.pushMode !== 'draft';
    let pushSent = false;
    let pushError = '';

    if (publishStudioButton) publishStudioButton.disabled = true;
    setStatus('Publication RCC en cours...');

    try {
      if (checkedChannel(data, 'publishSite') || shouldSendPush) {
        let siteResult = await postJson('/api/studio/publish', buildPublicationPayload(data, imageData));
        if (siteResult.status === 401 && siteResult.data.authRequired) {
          const adminPassword = window.prompt('Mot de passe admin');
          if (!adminPassword) {
            setStatus('Publication annulée : mot de passe admin requis.');
            recordPublication('Publication annulée', 'Mot de passe admin requis');
            return;
          }
          siteResult = await postJson('/api/studio/publish', buildPublicationPayload(data, imageData, adminPassword));
        }
        if (!siteResult.ok) {
          const message = siteResult.data.error || 'Publication impossible.';
          setStatus(message);
          recordPublication('Publication échouée', message);
          return;
        }

        siteReady = true;
        articleUrl = siteResult.data.url || '/actualites.html';
        if (checkedChannel(data, 'publishSite')) results.push(siteResult.data.articleCreated ? 'Site : article publié' : 'Site : prêt');
        if (shouldSendPush) {
          const push = siteResult.data.push || {};
          pushSent = Boolean(push.ok);
          pushError = push.ok ? '' : (push.error || 'non envoye');
          results.push(push.ok ? `Push : ${push.sent || 0} envoyé(s)` : `Push : ${push.error || 'non envoyé'}`);
        }
      }

      if (checkedChannel(data, 'publishPush') && data.pushMode === 'draft') {
        results.push('Push : prepare seulement');
      }

      if (siteReady && checkedChannel(data, 'publishFacebook')) {
        const result = await postJson('/api/meta/facebook', {
          title: data.title,
          text: socialText(data, 'facebook'),
          link: new URL(articleUrl, window.location.origin).href,
          image: 'studio-rcc-canvas-ready'
        });
        results.push(`Facebook : ${result.data.message || result.data.error || 'préparé'}`);
      }

      if (siteReady && checkedChannel(data, 'publishInstagram')) {
        const result = await postJson('/api/meta/instagram', {
          title: data.title,
          text: socialText(data, 'instagram'),
          link: new URL(articleUrl, window.location.origin).href,
          image: 'studio-rcc-canvas-ready'
        });
        results.push(`Instagram : ${result.data.message || result.data.error || 'préparé'}`);
      }

      const message = results.length ? results.join(' | ') : 'Aucun canal coché.';
      setStatus(message);
      recordPublication('Publication terminée', message, {
        notificationSent: pushSent,
        notificationAudience: data.pushAudience,
        notificationError: pushError
      });
    } catch (error) {
      const message = error.message || 'Erreur pendant la publication.';
      setStatus(message);
      recordPublication('Publication échouée', message);
    } finally {
      if (publishStudioButton) publishStudioButton.disabled = false;
    }
  }

  function downloadCanvasImage(sourceCanvas, filename) {
    const link = document.createElement('a');
    link.href = sourceCanvas.toDataURL('image/png');
    link.download = filename;
    link.click();
  }

  function drawCompositionExport(format = 'portrait') {
    const size = format === 'story'
      ? { width: 1080, height: 1920 }
      : format === 'print'
        ? { width: 1748, height: 2480 }
        : { width: 1080, height: 1350 };
    const scale = size.width / 1080;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = size.width;
    exportCanvas.height = size.height;
    const c = exportCanvas.getContext('2d');
    const team = compositionTeam?.value || 'Seniors';
    const item = compositionEventByValue(compositionMatch?.value || '');
    c.fillStyle = COLORS.black;
    c.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    const gradient = c.createLinearGradient(0, 0, exportCanvas.width, exportCanvas.height);
    gradient.addColorStop(0, 'rgba(177,24,69,.42)');
    gradient.addColorStop(.55, 'rgba(6,27,56,.20)');
    gradient.addColorStop(1, 'rgba(0,0,0,.85)');
    c.fillStyle = gradient;
    c.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    c.strokeStyle = COLORS.red;
    c.lineWidth = 5;
    c.strokeRect(54 * scale, 54 * scale, exportCanvas.width - 108 * scale, exportCanvas.height - 108 * scale);
    c.fillStyle = COLORS.redBright;
    c.font = `${44 * scale}px ${BODY_FONT}`;
    c.fillText(team.toUpperCase(), 80 * scale, 118 * scale);
    c.fillStyle = COLORS.white;
    c.font = `${116 * scale}px ${TITLE_FONT}`;
    c.fillText('COMPOSITION', 80 * scale, 235 * scale);
    c.font = `${42 * scale}px ${BODY_FONT}`;
    c.fillText(eventTitle(item).toUpperCase().slice(0, 34), 80 * scale, 298 * scale);
    c.fillStyle = COLORS.muted;
    c.font = `${30 * scale}px ${BODY_FONT}`;
    c.fillText(eventDetails(item).slice(0, 70), 80 * scale, 342 * scale);
    c.fillStyle = 'rgba(255,255,255,.08)';
    c.fillRect(80 * scale, 390 * scale, 920 * scale, Math.min(1120 * scale, exportCanvas.height - 600 * scale));
    c.fillStyle = COLORS.white;
    c.font = `${30 * scale}px ${BODY_FONT}`;
    state.composition.slots.forEach((slot, index) => {
      const col = index < 12 ? 0 : 1;
      const row = col === 0 ? index : index - 12;
      const x = (col === 0 ? 116 : 590) * scale;
      const y = (442 + row * 56) * scale;
      c.fillStyle = index < 15 ? COLORS.redBright : COLORS.navyBright;
      c.fillRect(x, y - 30 * scale, 46 * scale, 38 * scale);
      c.fillStyle = COLORS.white;
      c.textAlign = 'center';
      c.fillText(String(slot.number), x + 23 * scale, y);
      c.textAlign = 'left';
      c.fillText((slot.player || 'A definir').toUpperCase().slice(0, 22), x + 66 * scale, y);
    });
    c.fillStyle = COLORS.redBright;
    c.font = `${32 * scale}px ${BODY_FONT}`;
    c.fillText('RCCUBZAGUAIS.FR', 80 * scale, exportCanvas.height - 85 * scale);
    return exportCanvas;
  }

  function exportCompositionPng(format = 'portrait') {
    downloadCanvasImage(drawCompositionExport(format), `composition-rcc-${slug(compositionTeam?.value || 'equipe')}-${format}.png`);
    setStatus('Composition exportee en PNG.');
  }

  function newsletterText(channel = 'facebook') {
    const selected = state.newsletterBlocks.length
      ? state.newsletterBlocks.map((block) => `- ${newsletterBlockLabel(block.type)} : ${block.title}`)
      : selectedNewsletterItems().map(({ type, item }) => `- ${type} : ${item.title || eventTitle(item)}`);
    return [
      newsletterTitle?.value || 'Newsletter RCC',
      newsletterIntro?.value || '',
      selected.join('\n'),
      newsletterReminder?.value || '',
      channel === 'instagram' ? '#RCCubzaguais #Rugby' : 'https://rccubzaguais.fr'
    ].filter(Boolean).join('\n\n');
  }

  function wrapCanvasText(target, text, x, y, maxWidth, lineHeight, maxLines = 4) {
    const words = clean(text).split(/\s+/).filter(Boolean);
    let line = '';
    let lineCount = 0;
    words.forEach((word) => {
      if (lineCount >= maxLines) return;
      const test = line ? `${line} ${word}` : word;
      if (target.measureText(test).width > maxWidth && line) {
        target.fillText(line, x, y + lineCount * lineHeight);
        line = word;
        lineCount += 1;
      } else {
        line = test;
      }
    });
    if (line && lineCount < maxLines) target.fillText(line, x, y + lineCount * lineHeight);
  }

  function drawNewsletterCanvas() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1748;
    exportCanvas.height = 2480;
    const c = exportCanvas.getContext('2d');
    c.fillStyle = COLORS.black;
    c.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    c.fillStyle = 'rgba(177,24,69,.18)';
    c.fillRect(0, 0, exportCanvas.width, 360);
    c.fillStyle = COLORS.redBright;
    c.font = `64px ${BODY_FONT}`;
    c.fillText((newsletterPeriod?.value || CURRENT_SEASON).toUpperCase(), 120, 130);
    c.fillStyle = COLORS.white;
    c.font = `142px ${TITLE_FONT}`;
    c.fillText((newsletterTitle?.value || 'NEWSLETTER RCC').toUpperCase().slice(0, 22), 120, 280);
    c.font = `42px ${BODY_FONT}`;
    c.fillStyle = COLORS.muted;
    wrapCanvasText(c, newsletterIntro?.value || '', 120, 430, 1480, 54, 3);
    let y = 650;
    const blocks = state.newsletterBlocks.length ? state.newsletterBlocks : selectedNewsletterItems().map(({ type, item }) => ({
      type,
      title: item.title || eventTitle(item),
      text: item.summary || eventDetails(item) || item.category || ''
    }));
    blocks.slice(0, 8).forEach((block) => {
      c.fillStyle = 'rgba(255,255,255,.075)';
      c.fillRect(120, y - 54, 1500, 170);
      c.fillStyle = COLORS.redBright;
      c.font = `36px ${BODY_FONT}`;
      c.fillText(newsletterBlockLabel(block.type).toUpperCase(), 160, y);
      c.fillStyle = COLORS.white;
      c.font = `56px ${IMPACT_FONT}`;
      c.fillText((block.title || 'Info RCC').toUpperCase().slice(0, 42), 160, y + 58);
      c.fillStyle = COLORS.muted;
      c.font = `34px ${BODY_FONT}`;
      c.fillText(clean(block.text || '').slice(0, 92), 160, y + 110);
      y += 205;
    });
    c.fillStyle = COLORS.redBright;
    c.font = `44px ${BODY_FONT}`;
    c.fillText('RCCUBZAGUAIS.FR', 120, 2320);
    c.fillStyle = COLORS.muted;
    c.fillText((newsletterReminder?.value || '').slice(0, 70), 120, 2384);
    return exportCanvas;
  }

  function exportNewsletterPdf() {
    const sourceCanvas = drawNewsletterCanvas();
    const jpeg = sourceCanvas.toDataURL('image/jpeg', 0.94);
    const binary = atob(jpeg.split(',')[1]);
    const imgBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) imgBytes[i] = binary.charCodeAt(i);
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const textEncoder = new TextEncoder();
    const parts = [];
    let length = 0;
    const offsets = [0];
    const pushText = (text) => {
      const bytes = textEncoder.encode(text);
      parts.push(bytes);
      length += bytes.byteLength;
    };
    const pushBytes = (bytes) => {
      parts.push(bytes);
      length += bytes.byteLength;
    };
    const startObject = (id) => {
      offsets[id] = length;
      pushText(`${id} 0 obj\n`);
    };
    pushText('%PDF-1.4\n');
    startObject(1);
    pushText('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    startObject(2);
    pushText('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    startObject(3);
    pushText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`);
    startObject(4);
    pushText(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.byteLength} >>\nstream\n`);
    pushBytes(imgBytes);
    pushText('\nendstream\nendobj\n');
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    startObject(5);
    pushText(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
    const xref = length;
    pushText('xref\n0 6\n0000000000 65535 f \n');
    for (let i = 1; i <= 5; i += 1) pushText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    pushText(`trailer\n<< /Size 6 /Root 1 0 R /Title (${escapePdfText(newsletterTitle?.value || 'Newsletter RCC')}) >>\nstartxref\n${xref}\n%%EOF`);
    const blob = new Blob(parts, { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `newsletter-rcc-${slug(newsletterTitle?.value || 'newsletter')}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
    setStatus('Newsletter exportee en PDF.');
  }

  function exportNewsletterImage(type = 'png') {
    const sourceCanvas = drawNewsletterCanvas();
    const link = document.createElement('a');
    const mime = type === 'jpeg' ? 'image/jpeg' : 'image/png';
    link.href = sourceCanvas.toDataURL(mime, 0.94);
    link.download = `newsletter-rcc-${slug(newsletterTitle?.value || 'newsletter')}.${type === 'jpeg' ? 'jpg' : 'png'}`;
    link.click();
    setStatus(`Newsletter exportee en ${type.toUpperCase()}.`);
  }

  async function prepareDistribution() {
    if (!await prepareExport()) return;
    const data = readForm();
    const payloadBase = {
      title: data.title,
      text: captionOutput?.value || socialText(data, 'facebook'),
      link: 'https://rccubzaguais.fr/',
      image: 'studio-rcc-canvas-ready'
    };
    const results = [];

    if (checkedChannel(data, 'publishSite')) results.push('Site : prêt pour Pages CMS');
    if (checkedChannel(data, 'publishPush')) results.push('Push : prêt via notification RCC');

    if (checkedChannel(data, 'publishFacebook')) {
      const result = await postJson('/api/meta/facebook', { ...payloadBase, text: socialText(data, 'facebook') });
      results.push(`Facebook : ${result.data.message || result.data.error || 'préparé'}`);
    }

    if (checkedChannel(data, 'publishInstagram')) {
      const result = await postJson('/api/meta/instagram', { ...payloadBase, text: socialText(data, 'instagram') });
      results.push(`Instagram : ${result.data.message || result.data.error || 'préparé'}`);
    }

    const message = results.length ? results.join(' | ') : 'Aucun canal coche.';
    setStatus(message);
    recordPublication('Diffusion préparée', message);
  }

  studioTabButtons.forEach((button) => button.addEventListener('click', () => switchStudioTab(button.dataset.studioTab)));
  compositionTeam?.addEventListener('change', () => {
    hydrateCompositionMatches();
    hydrateCompositionPlayers();
  });
  compositionMatch?.addEventListener('change', renderComposition);
  [compositionCaptain, compositionVice, compositionCoach, compositionComments].forEach((node) => node?.addEventListener('input', renderComposition));
  document.querySelector('[data-composition-load-last]')?.addEventListener('click', loadCompositionDraft);
  document.querySelector('[data-composition-clear]')?.addEventListener('click', clearCompositionDraft);
  document.querySelector('[data-composition-save]')?.addEventListener('click', saveCompositionDraft);
  document.querySelector('[data-composition-duplicate]')?.addEventListener('click', duplicateComposition);
  document.querySelector('[data-composition-export]')?.addEventListener('click', () => exportCompositionPng('portrait'));
  document.querySelector('[data-composition-export-story]')?.addEventListener('click', () => exportCompositionPng('story'));
  document.querySelector('[data-composition-export-print]')?.addEventListener('click', () => exportCompositionPng('print'));
  document.querySelector('[data-composition-publish]')?.addEventListener('click', publishComposition);
  document.querySelector('[data-composition-copy-facebook]')?.addEventListener('click', () => copyText(compositionText('facebook'), captionOutput, 'Texte composition Facebook copie.'));
  document.querySelector('[data-composition-copy-instagram]')?.addEventListener('click', () => copyText(compositionText('instagram'), captionOutput, 'Texte composition Instagram copie.'));
  document.querySelector('[data-newsletter-add-block]')?.addEventListener('click', addNewsletterBlock);
  document.querySelector('[data-newsletter-clear-blocks]')?.addEventListener('click', () => {
    state.newsletterBlocks = [];
    renderNewsletterBlocks();
    renderNewsletter();
  });
  document.querySelector('[data-newsletter-export-pdf]')?.addEventListener('click', exportNewsletterPdf);
  document.querySelector('[data-newsletter-export-png]')?.addEventListener('click', () => exportNewsletterImage('png'));
  document.querySelector('[data-newsletter-export-jpeg]')?.addEventListener('click', () => exportNewsletterImage('jpeg'));
  document.querySelector('[data-newsletter-copy-facebook]')?.addEventListener('click', () => copyText(newsletterText('facebook'), captionOutput, 'Texte newsletter Facebook copie.'));
  document.querySelector('[data-newsletter-copy-instagram]')?.addEventListener('click', () => copyText(newsletterText('instagram'), captionOutput, 'Texte newsletter Instagram copie.'));

  form?.addEventListener('input', () => {
    syncPushSettings(readForm());
    render();
  });
  form?.addEventListener('change', (event) => {
    if (event.target?.name === 'template') {
      setTemplate(event.target.value);
    }
    syncPushSettings(readForm());
    render();
  });
  document.querySelector('[data-poster-image]')?.addEventListener('change', (event) => loadImageFromFile(event.target.files?.[0], 'image'));
  document.querySelector('[data-opponent-logo]')?.addEventListener('change', (event) => loadImageFromFile(event.target.files?.[0], 'opponentLogo'));
  downloadButton?.addEventListener('click', downloadPng);
  downloadPdfButton?.addEventListener('click', downloadPdf);
  copyCaptionButton?.addEventListener('click', copyCaption);
  copyFacebookButton?.addEventListener('click', copyFacebook);
  copyInstagramButton?.addEventListener('click', copyInstagram);
  copyHashtagsButton?.addEventListener('click', copyHashtags);
  publishStudioButton?.addEventListener('click', publishStudio);
  publishDialogOpenButtons.forEach((button) => button.addEventListener('click', () => {
    if (publishDialog && typeof publishDialog.showModal === 'function') {
      publishDialog.showModal();
    } else {
      publishStudio();
    }
  }));
  publishDialogConfirm?.addEventListener('click', () => {
    publishDialog?.close();
    publishStudio();
  });
  publishDialogCancel?.addEventListener('click', () => publishDialog?.close());
  studioSaveButtons.forEach((button) => button.addEventListener('click', () => {
    recordPublication('Brouillon enregistre');
    setStatus('Brouillon enregistre localement.');
  }));
  prepareDistributionButton?.addEventListener('click', prepareDistribution);
  checkMetaButton?.addEventListener('click', checkMetaStatus);
  compactTemplateSelect?.addEventListener('change', (event) => {
    setTemplate(event.target.value);
    render();
  });
  compactSourceSelect?.addEventListener('change', (event) => {
    const value = event.target.value || 'blank';
    state.activeSource = value;
    hydrateSourceSelect();
  });
  sourceSelect?.addEventListener('change', (event) => applySource(event.target.value));
  zoomInButton?.addEventListener('click', () => {
    const field = form.elements.photoZoom;
    field.value = String(clamp(Number(field.value || 112) + 8, 100, 170));
    render();
  });
  zoomOutButton?.addEventListener('click', () => {
    const field = form.elements.photoZoom;
    field.value = String(clamp(Number(field.value || 112) - 8, 100, 170));
    render();
  });
  toggleGridButton?.addEventListener('click', () => {
    state.showGrid = !state.showGrid;
    toggleGridButton.classList.toggle('is-active', state.showGrid);
    render();
  });
  resetPhotoButton?.addEventListener('click', () => {
    setField('photoZoom', 112);
    setField('photoOffsetX', 0);
    setField('photoOffsetY', 0);
    render();
  });

  setSourceSelectLoading('Chargement du CMS...');
  syncTemplateButtons(readForm().template || 'upcoming');
  syncPushSettings(readForm());
  loadFonts();
  loadSources();
  render();
})();
