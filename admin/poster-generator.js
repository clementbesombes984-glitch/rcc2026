(() => {
  const FORMATS = {
    square: { width: 1080, height: 1080 },
    portrait: { width: 1080, height: 1350 },
    story: { width: 1080, height: 1920 },
    facebook: { width: 1200, height: 630 },
    a4: { width: 1748, height: 2480 }
  };

  const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=League+Spartan:wght@700;800;900&family=Oswald:wght@500;600;700&family=Rajdhani:wght@600;700&display=swap';
  const TITLE_FONT = '"Bebas Neue", "Anton", "Arial Black", Impact, sans-serif';
  const IMPACT_FONT = '"Anton", "Bebas Neue", Impact, sans-serif';
  const BODY_FONT = '"Rajdhani", "Oswald", Arial, sans-serif';

  const COLORS = {
    black: '#030303',
    charcoal: '#0b0b0d',
    red: '#b11845',
    redBright: '#d31a52',
    navy: '#061b38',
    navyBright: '#0d3467',
    white: '#fff8ef',
    muted: '#d8d0c6',
    panel: 'rgba(3,3,3,.72)'
  };

  const TEMPLATE_TITLES = {
    news: 'ACTUALITE',
    upcoming: 'MATCH',
    result: 'RESULTAT',
    tournament: 'TOURNOI',
    training: 'ENTRAINEMENT',
    recruitment: 'REJOINS LE RCC',
    partner: 'PARTENAIRE',
    club: 'VIE DU CLUB'
  };

  const STYLE_DEFAULTS = {
    news: 'magazine',
    upcoming: 'match',
    result: 'match',
    tournament: 'announcement',
    training: 'announcement',
    recruitment: 'announcement',
    partner: 'partner',
    club: 'club'
  };

  const canvas = document.getElementById('posterCanvas');
  const ctx = canvas.getContext('2d');
  const form = document.querySelector('[data-poster-form]');
  const sizeNode = document.querySelector('[data-poster-size]');
  const statusNode = document.querySelector('[data-poster-status]');
  const sourceNews = document.querySelector('[data-source-news]');
  const sourceEvent = document.querySelector('[data-source-event]');
  const downloadButton = document.querySelector('[data-download-poster]');
  let fontStylesheetPromise = null;

  const state = {
    image: null,
    opponentLogo: null,
    news: [],
    events: [],
    settings: {},
    fontsReady: false
  };

  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  logo.src = '../assets/logo-rcc.png';
  logo.onload = render;

  function readForm() {
    return Object.fromEntries(new FormData(form).entries());
  }

  function setStatus(message) {
    if (statusNode) statusNode.textContent = message;
  }

  function clean(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

  function setSelectLoading(select, label) {
    if (!select) return;
    select.disabled = true;
    select.innerHTML = `<option value="">Chargement ${label}...</option>`;
  }

  function setSelectEmpty(select, label) {
    if (!select) return;
    select.disabled = false;
    select.innerHTML = `<option value="">Aucun ${label} disponible</option>`;
  }

  function loadFontStylesheet() {
    const existing = document.querySelector('[data-rcc-poster-fonts]');
    if (existing?.dataset.loaded === 'true') return Promise.resolve();
    if (fontStylesheetPromise) return fontStylesheetPromise;

    fontStylesheetPromise = new Promise((resolve) => {
      const link = existing || document.createElement('link');
      const finish = () => {
        link.dataset.loaded = 'true';
        resolve();
      };
      link.addEventListener('load', finish, { once: true });
      link.addEventListener('error', finish, { once: true });
      window.setTimeout(finish, 2500);

      if (!existing) {
        link.dataset.rccPosterFonts = 'true';
        link.rel = 'stylesheet';
        link.href = FONT_CSS;
        document.head.appendChild(link);
      }
    });

    return fontStylesheetPromise;
  }

  async function loadFonts() {
    if (!document.fonts) {
      state.fontsReady = true;
      return;
    }

    await loadFontStylesheet();

    try {
      await Promise.all([
        document.fonts.load(`900 120px ${TITLE_FONT}`),
        document.fonts.load(`900 92px ${IMPACT_FONT}`),
        document.fonts.load(`700 42px ${BODY_FONT}`),
        document.fonts.ready
      ]);
      state.fontsReady = true;
      render();
    } catch (error) {
      state.fontsReady = true;
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
    setSelectLoading(sourceNews, 'des actualites');
    setSelectLoading(sourceEvent, 'du calendrier');
    setStatus('Chargement des donnees du CMS...');

    try {
      const [newsResult, matchResult, settingsResult] = await Promise.all([
        fetchJson(['../data/news.json', '/data/news.json', './data/news.json'], { news: [] }),
        fetchJson(['../data/matches.json', '/data/matches.json', './data/matches.json'], { matches: [] }),
        fetchJson(['../data/settings.json', '/data/settings.json', './data/settings.json'], {})
      ]);

      state.news = collectionFrom(newsResult.data, 'news');
      state.events = collectionFrom(matchResult.data, 'matches');
      state.settings = settingsResult.data || {};
      hydrateSources();

      const failures = [newsResult.error && 'actualites', matchResult.error && 'calendrier'].filter(Boolean);
      setStatus(failures.length
        ? `Impossible de charger ${failures.join(' et ')}. Verifie la connexion ou les fichiers JSON.`
        : `${state.news.length} actualite(s) et ${state.events.length} evenement(s) charges.`);
      render();
    } catch (error) {
      state.news = [];
      state.events = [];
      setSelectEmpty(sourceNews, 'actualite');
      setSelectEmpty(sourceEvent, 'evenement');
      setStatus('Les donnees du site ne se chargent pas. Verifie la connexion puis recharge la page.');
    }
  }

  function hydrateSources() {
    if (sourceNews) {
      if (!state.news.length) {
        setSelectEmpty(sourceNews, 'actualite');
      } else {
        sourceNews.disabled = false;
        sourceNews.innerHTML = '<option value="">Choisir une actualite</option>' + state.news.map((item, index) => (
          `<option value="${index}">${clean(item.title || 'Actualite RCC')}</option>`
        )).join('');
      }
    }

    if (sourceEvent) {
      if (!state.events.length) {
        setSelectEmpty(sourceEvent, 'evenement');
      } else {
        sourceEvent.disabled = false;
        sourceEvent.innerHTML = '<option value="">Choisir un match, tournoi ou evenement</option>' + state.events.map((item, index) => {
          const title = clean(item.title || item.tournamentName || item.opponent || 'Evenement RCC');
          return `<option value="${index}">${item.date ? formatDate(item.date) + ' - ' : ''}${title}</option>`;
        }).join('');
      }
    }
  }

  function setField(name, value) {
    const field = form.elements[name];
    if (field && value !== undefined && value !== null) field.value = value;
  }

  function applyNews(index) {
    const item = state.news[Number(index)];
    if (!item) return;
    setField('template', item.category === 'Partenaires' ? 'partner' : 'news');
    setField('style', item.category === 'Partenaires' ? 'partner' : 'magazine');
    setField('layout', item.image ? 'photo' : 'balanced');
    setField('title', item.title || '');
    setField('subtitle', item.subtitle || item.category || '');
    setField('category', item.category || 'Club');
    setField('date', item.date ? formatDate(item.date) : '');
    setField('time', '');
    setField('location', '');
    setField('score', '');
    setField('opponent', '');
    setField('summary', item.summary || item.body || item.content || '');
    state.opponentLogo = null;
    if (item.image) loadRemoteImage(item.image);
    render();
  }

  function applyEvent(index) {
    const item = state.events[Number(index)];
    if (!item) return;
    const eventType = String(item.type_evenement || item.type || 'match').toLowerCase();
    const isTournament = eventType === 'tournoi';
    const isTraining = eventType === 'entrainement' || eventType === 'training';
    const isResult = Boolean(item.result) || item.status === 'win' || item.status === 'loss';
    const template = isTournament ? 'tournament' : isTraining ? 'training' : isResult ? 'result' : 'upcoming';
    const teams = Array.isArray(item.teams) ? item.teams.join(' / ') : '';

    setField('template', template);
    setField('style', STYLE_DEFAULTS[template] || 'match');
    setField('layout', item.image ? 'photo' : 'balanced');
    setField('title', isTournament ? (item.tournamentName || item.title || 'Tournoi RCC') : item.title || 'RC CUBZAGUAIS');
    setField('subtitle', teams || item.team || item.category || '');
    setField('category', isTournament ? (teams || item.team || 'Tournoi') : (item.team || item.category || 'Match'));
    setField('opponent', item.opponent || item.away || item.partner || '');
    setField('date', formatDate(item.date));
    setField('time', item.time || '');
    setField('location', item.location || item.venue || '');
    setField('score', item.result || '');
    setField('summary', item.description || item.summary || item.body || '');
    state.opponentLogo = null;
    if (item.image) loadRemoteImage(item.image);
    if (item.opponentLogo || item.partnerLogo) loadRemoteOpponentLogo(item.opponentLogo || item.partnerLogo);
    render();
  }

  function normalizeAssetPath(src) {
    if (!src) return '';
    if (/^https?:\/\//i.test(src) || src.startsWith('data:')) return src;
    return src.startsWith('/') ? '..' + src : src;
  }

  function loadRemoteImage(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.image = img;
      render();
    };
    img.src = normalizeAssetPath(src);
  }

  function loadRemoteOpponentLogo(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.opponentLogo = img;
      render();
    };
    img.src = normalizeAssetPath(src);
  }

  function loadImageFromFile(file, key) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state[key] = img;
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

  function coverImage(img, x, y, w, h) {
    if (!img || !img.width || !img.height) return false;
    const scale = Math.max(w / img.width, h / img.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
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

  function drawBackground(w, h, data) {
    const mode = data.colorMode || 'red';
    const main = mode === 'blue' ? COLORS.navyBright : COLORS.red;
    const secondary = mode === 'dark' ? '#111' : COLORS.navy;
    const photoMode = data.layout !== 'graphic' && state.image;

    const base = ctx.createLinearGradient(0, 0, w, h);
    base.addColorStop(0, COLORS.black);
    base.addColorStop(0.55, COLORS.charcoal);
    base.addColorStop(1, '#13030a');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    if (photoMode) {
      coverImage(state.image, 0, 0, w, h);
      ctx.filter = 'contrast(1.14) saturate(.9)';
      coverImage(state.image, 0, 0, w, h);
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(0,0,0,.65)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(177,24,69,.16)';
      ctx.fillRect(0, 0, w, h);
    }

    const radial = ctx.createRadialGradient(w * 0.78, h * 0.16, 20, w * 0.78, h * 0.16, Math.max(w, h) * 0.62);
    radial.addColorStop(0, `${main}70`);
    radial.addColorStop(0.42, `${secondary}24`);
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);

    drawGraphicStripes(w, h, main, secondary, data.style);
    drawNoise(w, h);
    drawVignette(w, h);
  }

  function drawGraphicStripes(w, h, main, secondary, style) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = style === 'partner' ? 0.12 : 0.18;
    ctx.fillStyle = main;
    polygon([[w * 0.62, 0], [w, 0], [w, h * 0.09], [w * 0.56, h * 0.24]]);
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = secondary;
    polygon([[w * 0.72, h * 0.24], [w, h * 0.16], [w, h * 0.42], [w * 0.62, h * 0.52]]);
    ctx.fill();
    ctx.globalAlpha = 0.16;
    for (let i = 0; i < 7; i += 1) {
      const y = h * (0.09 + i * 0.035);
      ctx.fillStyle = i % 2 ? secondary : main;
      polygon([[w * (0.06 + i * 0.03), y], [w * (0.35 + i * 0.08), y - h * 0.012], [w * (0.31 + i * 0.08), y + h * 0.006], [w * (0.04 + i * 0.03), y + h * 0.018]]);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawNoise(w, h) {
    ctx.save();
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = COLORS.white;
    const count = Math.round((w * h) / 23000);
    for (let i = 0; i < count; i += 1) {
      const size = 1 + (i % 3);
      ctx.fillRect((i * 97) % w, (i * 193) % h, size, size);
    }
    ctx.restore();
  }

  function drawVignette(w, h) {
    const vignette = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.74);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,.82)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  function drawTop(w, h, data, scale) {
    const pad = w * 0.058;
    const logoSize = Math.min(w, h) * 0.095;
    fitImage(logo, pad, pad * 0.72, logoSize, logoSize);

    ctx.textBaseline = 'top';
    ctx.fillStyle = COLORS.white;
    ctx.font = `900 ${42 * scale}px ${BODY_FONT}`;
    ctx.fillText('RC CUBZAGUAIS', pad + logoSize + 22 * scale, pad * 0.9);

    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    ctx.letterSpacing = '0px';
    const meta = upper(data.category || data.subtitle || 'RCC');
    ctx.fillText(meta, pad + logoSize + 22 * scale, pad * 0.9 + 48 * scale);

    const season = state.settings?.season || 'SAISON 2025-2026';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,248,239,.78)';
    ctx.font = `800 ${24 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(season), w - pad, pad * 0.96);
    ctx.textAlign = 'left';
  }

  function drawMainTitle(w, h, data, scale) {
    const textScale = clamp(Number(data.textScale || 100) / 100, 0.85, 1.18);
    const title = upper(TEMPLATE_TITLES[data.template] || data.title || 'RCC');
    const pad = w * 0.055;
    const maxWidth = w - pad * 2;
    const baseSize = Math.min(w * 0.19, h * 0.14) * textScale;
    const y = h * 0.15;

    ctx.save();
    ctx.shadowColor = 'rgba(211,26,82,.34)';
    ctx.shadowBlur = 20 * scale;
    drawFittedLines(title, pad, y, maxWidth, baseSize, baseSize * 0.86, 2, COLORS.white, TITLE_FONT);
    ctx.restore();

    const accent = data.template === 'upcoming' ? 'DE RUGBY' : upper(data.title || data.subtitle || 'RCC');
    if (accent && accent !== title) {
      ctx.save();
      ctx.rotate(-0.025);
      ctx.fillStyle = COLORS.redBright;
      ctx.font = `900 ${Math.min(w * 0.075, h * 0.052) * textScale}px ${IMPACT_FONT}`;
      ctx.fillText(accent.slice(0, 38), pad, y + baseSize * 1.03);
      ctx.restore();
    }
  }

  function drawFittedLines(text, x, y, maxWidth, fontSize, lineHeight, maxLines, color, family) {
    let size = fontSize;
    let lines = [];
    while (size > fontSize * 0.48) {
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
    const badges = [
      ['DATE', data.date],
      ['HEURE', data.time],
      ['LIEU', data.location],
      ['COMPETITION', data.category || data.subtitle]
    ].filter((item) => clean(item[1]));
    if (!badges.length) return;

    const pad = w * 0.055;
    const gap = 14 * scale;
    const maxBadgeWidth = (w - pad * 2 - gap * (badges.length - 1)) / badges.length;
    let x = pad;
    const y = h * 0.35;
    badges.forEach(([label, value]) => {
      drawInfoBadge(label, value, x, y, maxBadgeWidth, 72 * scale, scale);
      x += maxBadgeWidth + gap;
    });
  }

  function drawInfoBadge(label, value, x, y, w, h, scale) {
    fillRounded(x, y, w, h, 10 * scale, 'rgba(3,3,3,.62)', 'rgba(211,26,82,.52)', 1.5 * scale);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${17 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(label), x + 16 * scale, y + 10 * scale);
    ctx.fillStyle = COLORS.white;
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    drawSingleLine(upper(value), x + 16 * scale, y + 34 * scale, w - 32 * scale, 24 * scale, BODY_FONT);
  }

  function drawSingleLine(text, x, y, maxWidth, fontSize, family) {
    let size = fontSize;
    while (size > fontSize * 0.62) {
      ctx.font = `900 ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 1;
    }
    ctx.fillText(text, x, y);
  }

  function drawMatchZone(w, h, data, scale) {
    const y = h * 0.45;
    const shieldW = w * 0.25;
    const shieldH = Math.min(h * 0.19, shieldW * 1.08);
    const leftX = w * 0.08;
    const rightX = w - leftX - shieldW;
    drawTeamShield(leftX, y, shieldW, shieldH, 'RCC', logo, COLORS.red, scale);
    drawTeamShield(rightX, y, shieldW, shieldH, data.opponent || 'ADVERSAIRE', state.opponentLogo, COLORS.navyBright, scale);

    ctx.save();
    ctx.shadowColor = 'rgba(211,26,82,.45)';
    ctx.shadowBlur = 26 * scale;
    ctx.fillStyle = COLORS.white;
    ctx.font = `900 ${Math.min(w * 0.09, h * 0.064)}px ${IMPACT_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('VS', w / 2, y + shieldH * 0.34);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function drawTeamShield(x, y, w, h, name, img, color, scale) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 24 * scale;
    polygon([
      [x + w * 0.5, y],
      [x + w, y + h * 0.22],
      [x + w * 0.92, y + h],
      [x + w * 0.08, y + h],
      [x, y + h * 0.22]
    ]);
    ctx.fillStyle = 'rgba(3,3,3,.76)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4 * scale;
    ctx.stroke();
    ctx.restore();

    if (img) fitImage(img, x + w * 0.18, y + h * 0.12, w * 0.64, h * 0.44);
    ctx.fillStyle = COLORS.white;
    ctx.font = `900 ${Math.min(w * 0.18, h * 0.16)}px ${IMPACT_FONT}`;
    ctx.textAlign = 'center';
    drawFittedCentered(upper(name), x + w / 2, y + h * 0.65, w * 0.82, Math.min(w * 0.18, h * 0.16), IMPACT_FONT);
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

  function drawFeatureZone(w, h, data, scale) {
    if (data.template === 'upcoming' || data.template === 'result') {
      drawMatchZone(w, h, data, scale);
      return;
    }

    const pad = w * 0.055;
    const y = h * 0.45;
    const label = data.template === 'tournament'
      ? (data.subtitle || data.category || 'Categories RCC')
      : data.template === 'partner'
        ? (data.opponent || data.title || 'Partenaire RCC')
        : (data.subtitle || data.category || 'RC Cubzaguais');

    ctx.save();
    ctx.globalAlpha = 0.95;
    fillRounded(pad, y, w - pad * 2, h * 0.14, 14 * scale, 'rgba(3,3,3,.48)', 'rgba(255,255,255,.09)', 1 * scale);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    ctx.fillText(upper(data.template === 'partner' ? 'MERCI' : 'RCC'), pad + 28 * scale, y + 22 * scale);
    ctx.fillStyle = COLORS.white;
    drawFittedLines(label, pad + 28 * scale, y + 54 * scale, w - pad * 2 - 56 * scale, Math.min(w * 0.06, h * 0.045), Math.min(w * 0.058, h * 0.042), 2, COLORS.white, IMPACT_FONT);
    if (data.template === 'partner' && state.opponentLogo) fitImage(state.opponentLogo, w - pad - h * 0.11, y + h * 0.02, h * 0.1, h * 0.1);
    ctx.restore();
  }

  function drawBottomPanel(w, h, data, scale) {
    const pad = w * 0.055;
    const panelH = h * 0.18;
    const y = h - panelH - h * 0.075;
    fillRounded(pad, y, w - pad * 2, panelH, 16 * scale, 'rgba(3,3,3,.78)', 'rgba(177,24,69,.42)', 1.5 * scale);

    const heading = data.template === 'news' || data.template === 'club' ? 'PRESENTATION' : 'INFORMATIONS';
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    ctx.fillText(heading, pad + 26 * scale, y + 22 * scale);

    const summary = clean(data.summary || data.subtitle || data.title || 'Retrouvez les informations du RC Cubzaguais.');
    ctx.fillStyle = COLORS.white;
    ctx.font = `800 ${Math.min(w * 0.036, h * 0.028)}px ${BODY_FONT}`;
    wrapParagraph(summary, pad + 26 * scale, y + 62 * scale, w - pad * 2 - 52 * scale, Math.min(w * 0.036, h * 0.028), Math.min(w * 0.043, h * 0.033), 3);
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

  function drawFooter(w, h, scale) {
    const pad = w * 0.055;
    const y = h - pad * 0.78;
    ctx.fillStyle = 'rgba(255,248,239,.82)';
    ctx.font = `900 ${24 * scale}px ${BODY_FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText('RCCUBZAGUAIS.FR', pad, y);
    ctx.textAlign = 'right';
    ctx.fillText('FACEBOOK  INSTAGRAM', w - pad, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.redBright;
    ctx.fillRect(pad, h - pad * 0.45, w - pad * 2, Math.max(4, 5 * scale));
  }

  function renderPoster(data, w, h, scale) {
    drawBackground(w, h, data);
    drawTop(w, h, data, scale);
    drawMainTitle(w, h, data, scale);
    drawBadges(w, h, data, scale);
    drawFeatureZone(w, h, data, scale);
    drawBottomPanel(w, h, data, scale);
    drawFooter(w, h, scale);
  }

  function render() {
    if (!canvas || !form) return;
    const data = readForm();
    const format = resizeCanvas(data.format);
    const w = format.width;
    const h = format.height;
    const scale = Math.min(w / 1080, h / 1080);
    renderPoster(data, w, h, scale);
  }

  async function downloadPng() {
    if (document.fonts && !state.fontsReady) {
      setStatus('Preparation des polices avant export...');
      await loadFonts();
    } else if (document.fonts) {
      await document.fonts.ready;
    }
    render();
    const data = readForm();
    const name = `affiche-rcc-${data.template || 'publication'}-${data.format || 'format'}.png`;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = name;
    link.click();
    setStatus('PNG telecharge. Le visuel est pret a publier.');
  }

  form?.addEventListener('input', render);
  form?.addEventListener('change', render);
  document.querySelector('[data-poster-image]')?.addEventListener('change', (event) => loadImageFromFile(event.target.files?.[0], 'image'));
  document.querySelector('[data-opponent-logo]')?.addEventListener('change', (event) => loadImageFromFile(event.target.files?.[0], 'opponentLogo'));
  sourceNews?.addEventListener('change', (event) => applyNews(event.target.value));
  sourceEvent?.addEventListener('change', (event) => applyEvent(event.target.value));
  downloadButton?.addEventListener('click', downloadPng);

  setSelectLoading(sourceNews, 'des actualites');
  setSelectLoading(sourceEvent, 'du calendrier');
  loadFonts();
  loadSources();
  render();
})();
