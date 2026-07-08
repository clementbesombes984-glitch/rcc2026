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
  const sourceButtons = document.querySelector('[data-source-buttons]');
  const sourceSelect = document.querySelector('[data-source-select]');
  const templateButtons = document.querySelector('[data-template-buttons]');
  const captionOutput = document.querySelector('[data-caption-output]');
  const downloadButton = document.querySelector('[data-download-poster]');
  const downloadPdfButton = document.querySelector('[data-download-pdf]');
  const copyCaptionButton = document.querySelector('[data-copy-caption]');
  const copyFacebookButton = document.querySelector('[data-copy-facebook]');
  const copyInstagramButton = document.querySelector('[data-copy-instagram]');
  const copyHashtagsButton = document.querySelector('[data-copy-hashtags]');
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
      settings: {}
    }
  };

  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  logo.src = '../assets/logo-rcc.png';
  logo.onload = render;

  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const upper = (value) => clean(value).toUpperCase();
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const asList = (value) => Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);

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
    templateButtons?.querySelectorAll('[data-template-preset]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.templatePreset === template);
    });
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
    const [news, matches, partners, shop, gallery, senior, academy, youth, feminines, settings] = await Promise.all([
      fetchJson(['../data/news.json', '/data/news.json'], { news: [] }),
      fetchJson(['../data/matches.json', '/data/matches.json'], { matches: [] }),
      fetchJson(['../data/partners.json', '/data/partners.json'], { partners: [] }),
      fetchJson(['../data/shop.json', '/data/shop.json'], { products: [] }),
      fetchJson(['../data/gallery.json', '/data/gallery.json'], { albums: [] }),
      fetchJson(['../data/senior.json', '/data/senior.json'], { players: [], staff: [] }),
      fetchJson(['../data/academy.json', '/data/academy.json'], { categories: [] }),
      fetchJson(['../data/youth.json', '/data/youth.json'], { categories: [] }),
      fetchJson(['../data/feminines.json', '/data/feminines.json'], { categories: [] }),
      fetchJson(['../data/settings.json', '/data/settings.json'], {})
    ]);

    state.data.news = collectionFrom(news.data, 'news');
    state.data.events = collectionFrom(matches.data, 'matches');
    state.data.partners = collectionFrom(partners.data, 'partners');
    state.data.products = collectionFrom(shop.data, 'products');
    state.data.albums = collectionFrom(gallery.data, 'albums');
    state.data.teams = [
      ...collectionFrom(academy.data, 'categories').map((item) => ({ ...item, source: 'Ecole de rugby' })),
      ...collectionFrom(youth.data, 'categories').map((item) => ({ ...item, source: 'Pole jeunes' })),
      ...collectionFrom(feminines.data, 'categories').map((item) => ({ ...item, source: 'Cadettes' })),
      ...(senior.data?.players || []).map((item) => ({ ...item, age: `${item.firstName || ''} ${item.lastName || ''}`, label: item.position || item.group || 'Senior', source: 'Senior', teamPhoto: item.photo })),
      ...(senior.data?.staff || []).map((item) => ({ ...item, age: `${item.firstName || ''} ${item.lastName || ''}`, label: item.role || 'Staff senior', source: 'Staff', teamPhoto: item.photo }))
    ];
    state.data.settings = settings.data || {};
    hydrateSourceSelect();
    const count = state.data.news.length + state.data.events.length + state.data.partners.length + state.data.products.length + state.data.albums.length + state.data.teams.length;
    setStatus(`${count} element(s) CMS disponibles pour le Studio RCC.`);
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
    ctx.fillText(upper(state.data.settings.season || 'SAISON 2025-2026'), w - pad, pad);
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
    if (category.includes('u16') || category.includes('u18')) tags.add('PoleJeunes');
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
    const title = clean(data.title || TEMPLATE_TITLES[data.template] || 'Info RCC');
    const short = title.length > 40 ? `${title.slice(0, 37).trimEnd()}...` : title;
    const body = [data.date, data.time, data.location].filter(Boolean).join(' - ') || clean(data.summary || 'Nouvelle information du RCC.');
    return `${short}\n${body}`;
  }

  function checkedChannel(data, name) {
    return data[name] === 'yes' || data[name] === 'on';
  }

  function recordPublication(status = 'préparée', error = '') {
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

  form?.addEventListener('input', render);
  form?.addEventListener('change', (event) => {
    if (event.target?.name === 'template') {
      setTemplate(event.target.value);
    }
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
  prepareDistributionButton?.addEventListener('click', prepareDistribution);
  checkMetaButton?.addEventListener('click', checkMetaStatus);
  sourceSelect?.addEventListener('change', (event) => applySource(event.target.value));
  sourceButtons?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-source-kind]');
    if (!button) return;
    sourceButtons.querySelectorAll('button').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    state.activeSource = button.dataset.sourceKind;
    hydrateSourceSelect();
  });
  templateButtons?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-template-preset]');
    if (!button) return;
    setTemplate(button.dataset.templatePreset);
    render();
  });
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
  loadFonts();
  loadSources();
  render();
})();
