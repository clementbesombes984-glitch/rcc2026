(() => {
  const FORMATS = {
    square: { width: 1080, height: 1080 },
    portrait: { width: 1080, height: 1350 },
    story: { width: 1080, height: 1920 },
    facebook: { width: 1200, height: 630 }
  };

  const TEMPLATE_LABELS = {
    news: 'Actualite',
    upcoming: 'Match a venir',
    result: 'Resultat',
    tournament: 'Tournoi',
    club: 'Vie du club'
  };

  const COLORS = {
    black: '#050505',
    red: '#b11845',
    redBright: '#d31a52',
    text: '#fffaf3',
    muted: '#d4ccc3',
    darkText: '#090909',
    green: '#08a351',
    loss: '#d31a52'
  };

  const TITLE_FONT = '"Anton", "Arial Black", "Arial Narrow", Impact, sans-serif';
  const BODY_FONT = '"Barlow Condensed", "Arial Narrow", Arial, sans-serif';
  const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700;800;900&display=swap';

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

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }).format(date).replace('.', '');
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
        document.fonts.load(`900 80px ${TITLE_FONT}`),
        document.fonts.load(`800 42px ${BODY_FONT}`),
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
        if (response.ok) {
          return { data: await response.json(), error: null };
        }
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
    setStatus('Chargement des actualites et du calendrier...');

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
      if (failures.length) {
        setStatus(`Impossible de charger ${failures.join(' et ')}. Verifie la connexion ou les fichiers JSON.`);
      } else {
        setStatus(`${state.news.length} actualite(s) et ${state.events.length} evenement(s) charges.`);
      }
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
        sourceEvent.innerHTML = '<option value="">Choisir un match ou tournoi</option>' + state.events.map((item, index) => {
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
    setField('template', 'news');
    setField('title', item.title || '');
    setField('subtitle', item.summary || item.body || '');
    setField('category', item.category || 'Club');
    setField('date', item.date ? formatDate(item.date) : '');
    setField('time', '');
    setField('location', '');
    setField('score', '');
    setField('opponent', '');
    if (item.image) loadRemoteImage(item.image);
    render();
  }

  function applyEvent(index) {
    const item = state.events[Number(index)];
    if (!item) return;
    const eventType = String(item.type_evenement || item.type || 'match').toLowerCase();
    const isTournament = eventType === 'tournoi';
    const isResult = Boolean(item.result) || item.status === 'win' || item.status === 'loss';
    setField('template', isTournament ? 'tournament' : isResult ? 'result' : 'upcoming');
    setField('title', isTournament ? (item.tournamentName || item.title || 'Tournoi RCC') : 'RC CUBZAGUAIS');
    setField('subtitle', item.team || item.category || '');
    setField('category', isTournament ? 'Tournoi' : (item.team || 'Match'));
    setField('opponent', item.opponent || item.away || '');
    setField('date', formatDate(item.date));
    setField('time', item.time || '');
    setField('location', item.location || item.venue || '');
    setField('score', item.result || '');
    render();
  }

  function loadRemoteImage(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state.image = img;
      render();
    };
    img.src = src.startsWith('/') ? '..' + src : src;
  }

  function loadImageFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.image = img;
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

  function fillBackground(w, h) {
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, COLORS.black);
    gradient.addColorStop(0.58, '#090909');
    gradient.addColorStop(1, '#1d0610');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(0, h * 0.88, w, h * 0.12);
    ctx.restore();
  }

  function drawPhoto(w, h, mode = 'full') {
    if (!state.image) {
      const gradient = ctx.createRadialGradient(w * 0.68, h * 0.24, 20, w * 0.68, h * 0.24, Math.max(w, h) * 0.72);
      gradient.addColorStop(0, 'rgba(177,24,69,.42)');
      gradient.addColorStop(0.46, 'rgba(18,18,18,.9)');
      gradient.addColorStop(1, COLORS.black);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      return;
    }
    if (mode === 'top') {
      coverImage(state.image, 0, 0, w, h * 0.72);
    } else {
      coverImage(state.image, 0, 0, w, h);
    }
  }

  function overlay(w, h, strength = 0.74, bottom = 0.98) {
    const vertical = ctx.createLinearGradient(0, 0, 0, h);
    vertical.addColorStop(0, `rgba(0,0,0,${strength * 0.35})`);
    vertical.addColorStop(0.48, `rgba(0,0,0,${strength * 0.36})`);
    vertical.addColorStop(1, `rgba(0,0,0,${bottom})`);
    ctx.fillStyle = vertical;
    ctx.fillRect(0, 0, w, h);

    const side = ctx.createLinearGradient(0, 0, w, 0);
    side.addColorStop(0, 'rgba(0,0,0,.86)');
    side.addColorStop(0.46, 'rgba(0,0,0,.16)');
    side.addColorStop(1, 'rgba(0,0,0,.48)');
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, w, h);
  }

  function drawAccent(w, h) {
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(0, h - Math.max(14, h * 0.012), w, Math.max(14, h * 0.012));
  }

  function drawLogo(w, h, align = 'right') {
    const size = Math.round(Math.min(w, h) * 0.105);
    const pad = Math.round(Math.min(w, h) * 0.055);
    const x = align === 'left' ? pad : w - pad - size;
    const y = pad;
    ctx.save();
    ctx.globalAlpha = 0.96;
    fitImage(logo, x, y, size, size);
    ctx.restore();
  }

  function drawBadge(text, x, y, scale) {
    const label = clean(text || 'RCC').toUpperCase();
    ctx.font = `900 ${Math.round(18 * scale)}px ${BODY_FONT}`;
    const width = ctx.measureText(label).width + 42 * scale;
    ctx.fillStyle = COLORS.red;
    roundRect(x, y, width, 42 * scale, 999);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 21 * scale, y + 21 * scale);
    return width;
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

  function wrapText(text, x, y, maxWidth, fontSize, lineHeight, maxLines, color = COLORS.text, family = TITLE_FONT) {
    ctx.fillStyle = color;
    ctx.font = `900 ${fontSize}px ${family}`;
    ctx.textBaseline = 'top';
    const words = clean(text).toUpperCase().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((entry, index) => ctx.fillText(entry, x, y + index * lineHeight));
    return y + Math.min(lines.length, maxLines) * lineHeight;
  }

  function wrapSentence(text, x, y, maxWidth, fontSize, lineHeight, maxLines) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `700 ${fontSize}px ${BODY_FONT}`;
    ctx.textBaseline = 'top';
    const words = clean(text).split(/\s+/).filter(Boolean);
    let line = '';
    let lines = 0;
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

  function drawFooter(w, h) {
    const site = 'rcc2026.pages.dev';
    const pad = Math.round(Math.min(w, h) * 0.055);
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    ctx.font = `900 ${Math.round(Math.min(w, h) * 0.018)}px ${BODY_FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.fillText(site.toUpperCase(), pad, h - pad);
  }

  function drawInfoLine(parts, x, y, scale) {
    const text = parts.filter(Boolean).join('  /  ').toUpperCase();
    if (!text) return;
    ctx.fillStyle = COLORS.text;
    ctx.font = `900 ${Math.round(26 * scale)}px ${BODY_FONT}`;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
  }

  function renderNews(data, w, h, scale) {
    drawPhoto(w, h);
    overlay(w, h, 0.64, 0.94);
    drawAccent(w, h);
    drawLogo(w, h, 'right');
    const pad = Math.round(Math.min(w, h) * 0.07);
    const titleY = h * 0.58;
    drawBadge(data.category || 'Actualite', pad, titleY - 62 * scale, scale);
    const end = wrapText(data.title || 'Actualite RCC', pad, titleY, w - pad * 2, Math.round(w * 0.078), Math.round(w * 0.074), 3);
    wrapSentence(data.subtitle || '', pad, end + 20 * scale, w - pad * 2, Math.round(w * 0.028), Math.round(w * 0.04), 2);
    drawFooter(w, h);
  }

  function renderUpcoming(data, w, h, scale) {
    fillBackground(w, h);
    drawPhoto(w, h, 'top');
    overlay(w, h, 0.68, 0.96);
    drawAccent(w, h);
    drawLogo(w, h, 'right');
    const pad = Math.round(Math.min(w, h) * 0.07);
    drawBadge(data.category || 'Match', pad, pad, scale);
    const midY = h * 0.42;
    wrapText('RC CUBZAGUAIS', pad, midY, w * 0.78, Math.round(w * 0.075), Math.round(w * 0.074), 2);
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${Math.round(w * 0.058)}px ${TITLE_FONT}`;
    ctx.textBaseline = 'top';
    ctx.fillText('VS', pad, midY + Math.round(w * 0.13));
    wrapText(data.opponent || 'ADVERSAIRE', pad + Math.round(w * 0.12), midY + Math.round(w * 0.126), w * 0.72, Math.round(w * 0.058), Math.round(w * 0.06), 2);
    drawInfoLine([data.date, data.time, data.location], pad, h - pad - Math.round(w * 0.12), scale);
    drawFooter(w, h);
  }

  function renderResult(data, w, h, scale) {
    drawPhoto(w, h);
    overlay(w, h, 0.72, 0.98);
    drawAccent(w, h);
    drawLogo(w, h, 'right');
    const pad = Math.round(Math.min(w, h) * 0.07);
    const score = clean(data.score || '0 - 0');
    const isLoss = data.status === 'loss' || /defaite/i.test(data.subtitle || '');
    const resultWord = isLoss ? 'DEFAITE' : 'RESULTAT';
    drawBadge(data.category || resultWord, pad, pad, scale);
    ctx.fillStyle = isLoss ? COLORS.loss : COLORS.green;
    ctx.font = `900 ${Math.round(w * 0.07)}px ${TITLE_FONT}`;
    ctx.textBaseline = 'top';
    ctx.fillText(resultWord, pad, h * 0.31);
    ctx.fillStyle = COLORS.text;
    ctx.font = `900 ${Math.round(w * 0.16)}px ${TITLE_FONT}`;
    ctx.fillText(score, pad, h * 0.4);
    wrapText(data.title || 'RC CUBZAGUAIS', pad, h * 0.62, w - pad * 2, Math.round(w * 0.055), Math.round(w * 0.057), 2);
    wrapSentence(data.subtitle || data.opponent || '', pad, h * 0.75, w - pad * 2, Math.round(w * 0.027), Math.round(w * 0.04), 2);
    drawFooter(w, h);
  }

  function renderTournament(data, w, h, scale) {
    drawPhoto(w, h);
    overlay(w, h, 0.58, 0.96);
    drawAccent(w, h);
    drawLogo(w, h, 'right');
    const pad = Math.round(Math.min(w, h) * 0.07);
    drawBadge(data.category || 'Tournoi', pad, pad, scale);
    const end = wrapText(data.title || 'Tournoi RCC', pad, h * 0.48, w - pad * 2, Math.round(w * 0.084), Math.round(w * 0.08), 3);
    wrapSentence(data.subtitle || 'Rendez-vous aux couleurs du RCC', pad, end + 18 * scale, w - pad * 2, Math.round(w * 0.029), Math.round(w * 0.042), 2);
    drawInfoLine([data.date, data.time, data.location], pad, h - pad - Math.round(w * 0.12), scale);
    drawFooter(w, h);
  }

  function renderClub(data, w, h, scale) {
    drawPhoto(w, h);
    overlay(w, h, 0.5, 0.92);
    drawAccent(w, h);
    drawLogo(w, h, 'right');
    const pad = Math.round(Math.min(w, h) * 0.07);
    drawBadge(data.category || 'Vie du club', pad, pad, scale);
    const end = wrapText(data.title || 'RC CUBZAGUAIS', pad, h * 0.56, w - pad * 2, Math.round(w * 0.082), Math.round(w * 0.078), 3);
    wrapSentence(data.subtitle || 'Une vie de club faite de rugby, de joie et de partage.', pad, end + 18 * scale, w - pad * 2, Math.round(w * 0.029), Math.round(w * 0.042), 2);
    drawFooter(w, h);
  }

  function render() {
    if (!canvas || !form) return;
    const data = readForm();
    const format = resizeCanvas(data.format);
    const w = format.width;
    const h = format.height;
    const scale = w / 1080;
    const template = data.template || 'news';
    if (template === 'upcoming') renderUpcoming(data, w, h, scale);
    else if (template === 'result') renderResult(data, w, h, scale);
    else if (template === 'tournament') renderTournament(data, w, h, scale);
    else if (template === 'club') renderClub(data, w, h, scale);
    else renderNews(data, w, h, scale);
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
  document.querySelector('[data-poster-image]')?.addEventListener('change', (event) => loadImageFromFile(event.target.files?.[0]));
  sourceNews?.addEventListener('change', (event) => applyNews(event.target.value));
  sourceEvent?.addEventListener('change', (event) => applyEvent(event.target.value));
  downloadButton?.addEventListener('click', downloadPng);

  setSelectLoading(sourceNews, 'des actualites');
  setSelectLoading(sourceEvent, 'du calendrier');
  loadFonts();
  loadSources();
  render();
})();
