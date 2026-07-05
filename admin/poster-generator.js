(() => {
  const FORMATS = {
    square: { label: 'Instagram carre', width: 1080, height: 1080 },
    portrait: { label: 'Instagram portrait', width: 1080, height: 1350 },
    story: { label: 'Story', width: 1080, height: 1920 },
    facebook: { label: 'Facebook', width: 1200, height: 630 }
  };

  const TEMPLATE_LABELS = {
    news: 'Actualite',
    upcoming: 'Match a venir',
    result: 'Resultat',
    tournament: 'Tournoi',
    club: 'Vie du club',
    volunteers: 'Benevoles',
    partner: 'Partenaire',
    shop: 'Boutique',
    join: 'Nous rejoindre'
  };

  const COLORS = {
    black: '#070707',
    panel: '#121212',
    text: '#f7f4ef',
    muted: '#c4bdb5',
    red: '#b11845',
    redBright: '#d31a52',
    navy: '#061b38',
    white: '#ffffff',
    green: '#08a351'
  };

  const canvas = document.getElementById('posterCanvas');
  const ctx = canvas.getContext('2d');
  const form = document.querySelector('[data-poster-form]');
  const sizeNode = document.querySelector('[data-poster-size]');
  const statusNode = document.querySelector('[data-poster-status]');
  const sourceNews = document.querySelector('[data-source-news]');
  const sourceEvent = document.querySelector('[data-source-event]');
  const downloadButton = document.querySelector('[data-download-poster]');
  const copyButton = document.querySelector('[data-copy-caption]');
  const state = {
    image: null,
    logo: null,
    news: [],
    events: [],
    settings: {}
  };

  const defaultLogo = new Image();
  defaultLogo.crossOrigin = 'anonymous';
  defaultLogo.src = '../assets/logo-rcc.png';
  defaultLogo.onload = render;

  function readForm() {
    const data = new FormData(form);
    return Object.fromEntries(data.entries());
  }

  function setStatus(message) {
    if (statusNode) statusNode.textContent = message;
  }

  function escapeLabel(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value + 'T12:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }).format(date).replace('.', '');
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

  async function fetchJson(path, fallback) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) return fallback;
      return response.json();
    } catch (error) {
      return fallback;
    }
  }

  async function loadSources() {
    const [newsData, matchData, settingsData] = await Promise.all([
      fetchJson('../data/news.json', { news: [] }),
      fetchJson('../data/matches.json', { matches: [] }),
      fetchJson('../data/settings.json', {})
    ]);
    state.news = Array.isArray(newsData.news) ? newsData.news : [];
    state.events = Array.isArray(matchData.matches) ? matchData.matches : [];
    state.settings = settingsData || {};
    hydrateSourceSelects();
    render();
  }

  function hydrateSourceSelects() {
    if (sourceNews) {
      sourceNews.innerHTML = '<option value="">Choisir une actualite</option>' + state.news.map((item, index) => {
        const title = escapeLabel(item.title || 'Actualite RCC');
        return `<option value="${index}">${title}</option>`;
      }).join('');
    }
    if (sourceEvent) {
      sourceEvent.innerHTML = '<option value="">Choisir un match ou tournoi</option>' + state.events.map((item, index) => {
        const title = escapeLabel(item.title || item.tournamentName || item.opponent || 'Evenement RCC');
        const date = item.date ? formatDate(item.date) + ' - ' : '';
        return `<option value="${index}">${date}${title}</option>`;
      }).join('');
    }
  }

  function setField(name, value) {
    const field = form.elements[name];
    if (field && value !== undefined && value !== null) field.value = value;
  }

  function applyNews(index) {
    const item = state.news[Number(index)];
    if (!item) return;
    setField('template', item.category && /benevole/i.test(item.category) ? 'volunteers' : 'news');
    setField('title', item.title || '');
    setField('subtitle', item.summary || '');
    setField('category', item.category || 'Club');
    setField('body', item.body || item.summary || '');
    setField('date', item.date ? formatDate(item.date) : '');
    setField('url', item.url || 'https://rcc2026.pages.dev/actualites.html');
    if (item.image) loadRemoteImage(item.image, 'image');
    render();
  }

  function applyEvent(index) {
    const item = state.events[Number(index)];
    if (!item) return;
    const type = String(item.type_evenement || item.type || 'match').toLowerCase();
    const isTournament = type === 'tournoi';
    const isResult = item.status === 'win' || item.status === 'loss' || item.result;
    setField('template', isTournament ? 'tournament' : isResult ? 'result' : 'upcoming');
    setField('title', isTournament ? (item.tournamentName || item.title || 'Tournoi RCC') : (item.title || 'Match RCC'));
    setField('subtitle', item.team || (isTournament ? 'Ecole de rugby' : 'RC Cubzaguais'));
    setField('category', isTournament ? 'Tournoi' : 'Match');
    setField('opponent', item.opponent || item.away || '');
    setField('date', formatDate(item.date));
    setField('time', item.time || '');
    setField('location', item.location || item.venue || '');
    setField('score', item.result || '');
    setField('body', item.description || (isTournament ? 'Rendez-vous tournoi aux couleurs du RCC.' : 'Rendez-vous au stade pour soutenir le RCC.'));
    setField('url', 'https://rcc2026.pages.dev/calendrier.html');
    render();
  }

  function loadRemoteImage(src, key) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      state[key] = img;
      render();
    };
    img.src = src.startsWith('/') ? '..' + src : src;
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

  function fillRounded(x, y, w, h, r, fill, stroke) {
    roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = Math.max(2, canvas.width * 0.002);
      ctx.stroke();
    }
  }

  function drawBackground(width, height, data) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, COLORS.black);
    gradient.addColorStop(0.56, '#090909');
    gradient.addColorStop(1, '#310817');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = COLORS.red;
    ctx.beginPath();
    ctx.moveTo(width * 0.68, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(width * 0.46, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const img = state.image;
    if (img) {
      const photoH = height < width ? height : Math.round(height * 0.46);
      const photoY = height < width ? 0 : Math.round(height * 0.08);
      ctx.save();
      ctx.globalAlpha = 0.34;
      coverImage(img, 0, photoY, width, photoH);
      const fade = ctx.createLinearGradient(0, photoY, 0, photoY + photoH);
      fade.addColorStop(0, 'rgba(7,7,7,0.2)');
      fade.addColorStop(0.64, 'rgba(7,7,7,0.62)');
      fade.addColorStop(1, 'rgba(7,7,7,0.98)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, photoY, width, photoH);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = COLORS.white;
    for (let i = 0; i < width; i += 16) {
      for (let j = (i % 32); j < height; j += 32) ctx.fillRect(i, j, 2, 2);
    }
    ctx.restore();

    const margin = Math.round(width * 0.045);
    roundRect(margin, margin, width - margin * 2, height - margin * 2, Math.round(width * 0.018));
    ctx.strokeStyle = 'rgba(211,26,82,.58)';
    ctx.lineWidth = Math.max(3, width * 0.003);
    ctx.stroke();

    return margin;
  }

  function drawLogo(width, height, margin) {
    const logo = state.logo || defaultLogo;
    const logoW = Math.round(width * (width > height ? 0.13 : 0.18));
    const logoH = Math.round(logoW * 0.92);
    const x = margin + Math.round(width * 0.018);
    const y = margin + Math.round(width * 0.018);
    fillRounded(x, y, logoW, logoH, Math.round(width * 0.014), 'rgba(255,255,255,.045)', 'rgba(255,255,255,.08)');
    if (logo.complete) coverImage(logo, x + logoW * 0.08, y + logoH * 0.08, logoW * 0.84, logoH * 0.84);

    ctx.fillStyle = COLORS.text;
    ctx.font = `900 ${Math.round(width * 0.023)}px Arial, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText('RC CUBZAGUAIS', x + logoW + Math.round(width * 0.018), y + Math.round(logoH * 0.18));
    ctx.fillStyle = COLORS.muted;
    ctx.font = `900 ${Math.round(width * 0.012)}px Arial, sans-serif`;
    ctx.fillText('SAINT-ANDRE-DE-CUBZAC', x + logoW + Math.round(width * 0.018), y + Math.round(logoH * 0.52));
  }

  function drawWrappedText(text, x, y, maxWidth, fontSize, lineHeight, color, weight = 900, maxLines = 6) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${fontSize}px "Arial Narrow", Impact, Arial, sans-serif`;
    ctx.textBaseline = 'top';
    const words = String(text || '').toUpperCase().split(/\s+/).filter(Boolean);
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

  function drawMeta(data, x, y, w, scale) {
    const chips = [data.category, data.date, data.time, data.location].filter(Boolean).slice(0, 4);
    let cx = x;
    chips.forEach((chip) => {
      const text = String(chip).toUpperCase();
      ctx.font = `900 ${Math.round(15 * scale)}px Arial, sans-serif`;
      const chipW = Math.min(w, ctx.measureText(text).width + 34 * scale);
      fillRounded(cx, y, chipW, 34 * scale, 999, 'rgba(177,24,69,.28)', 'rgba(211,26,82,.42)');
      ctx.fillStyle = COLORS.text;
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cx + 17 * scale, y + 17 * scale);
      cx += chipW + 10 * scale;
      if (cx > x + w - 120 * scale) cx = x;
    });
  }

  function drawScoreOrVs(data, x, y, w, scale) {
    if (!data.score && !data.opponent) return y;
    fillRounded(x, y, w, 86 * scale, 18 * scale, 'rgba(18,18,18,.82)', 'rgba(211,26,82,.42)');
    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${Math.round(18 * scale)}px Arial, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(data.score ? 'RESULTAT' : 'ADVERSAIRE', x + 24 * scale, y + 17 * scale);
    ctx.fillStyle = data.score ? (String(data.score).includes('-') ? COLORS.text : COLORS.green) : COLORS.text;
    ctx.font = `900 ${Math.round(42 * scale)}px "Arial Narrow", Impact, Arial, sans-serif`;
    ctx.fillText(String(data.score || data.opponent).toUpperCase(), x + 24 * scale, y + 39 * scale);
    return y + 106 * scale;
  }

  function drawFooter(width, height, margin, data) {
    const footerY = height - margin - Math.round(width * 0.06);
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin + Math.round(width * 0.02), footerY - Math.round(width * 0.025));
    ctx.lineTo(width - margin - Math.round(width * 0.02), footerY - Math.round(width * 0.025));
    ctx.stroke();

    const site = new URL(data.url || 'https://rcc2026.pages.dev/').hostname.replace(/^www\./, '');
    ctx.fillStyle = COLORS.muted;
    ctx.font = `900 ${Math.round(width * 0.014)}px Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText(site || 'rcc2026.pages.dev', margin + Math.round(width * 0.025), footerY);
    const social = '@RCCUBZAGUAIS';
    const socialW = ctx.measureText(social).width;
    ctx.fillText(social, width - margin - Math.round(width * 0.025) - socialW, footerY);
  }

  function render() {
    if (!canvas || !form) return;
    const data = readForm();
    const format = resizeCanvas(data.format);
    const width = format.width;
    const height = format.height;
    const scale = width / 1080;
    const compact = height < width;
    const margin = drawBackground(width, height, data);
    drawLogo(width, height, margin);

    const contentX = margin + Math.round(width * 0.055);
    const contentW = width - contentX - margin - Math.round(width * 0.055);
    const startY = compact ? Math.round(height * 0.27) : Math.round(height * 0.35);
    const label = TEMPLATE_LABELS[data.template] || 'RCC';

    ctx.fillStyle = COLORS.redBright;
    ctx.font = `900 ${Math.round(width * 0.021)}px Arial, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(label.toUpperCase(), contentX, startY);

    const titleSize = compact ? Math.round(width * 0.074) : Math.round(width * 0.09);
    const titleEnd = drawWrappedText(data.title || 'RC CUBZAGUAIS', contentX, startY + Math.round(width * 0.045), contentW, titleSize, titleSize * 0.94, COLORS.text, 900, compact ? 2 : 4);

    let cursor = titleEnd + Math.round(width * 0.02);
    if (data.subtitle) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = `700 ${Math.round(width * 0.029)}px Arial, sans-serif`;
      ctx.textBaseline = 'top';
      wrapSentence(data.subtitle, contentX, cursor, contentW, Math.round(width * 0.038), compact ? 2 : 3);
      cursor += Math.round(width * (compact ? 0.075 : 0.1));
    }

    drawMeta(data, contentX, cursor, contentW, scale);
    cursor += Math.round(width * 0.06);
    cursor = drawScoreOrVs(data, contentX, cursor, Math.min(contentW, width * 0.58), scale);

    if (data.body && !compact) {
      fillRounded(contentX, cursor + Math.round(width * 0.02), contentW, Math.round(width * 0.15), 18 * scale, 'rgba(18,18,18,.74)', 'rgba(255,255,255,.08)');
      ctx.fillStyle = COLORS.muted;
      ctx.font = `600 ${Math.round(width * 0.025)}px Arial, sans-serif`;
      ctx.textBaseline = 'top';
      wrapSentence(data.body, contentX + Math.round(width * 0.025), cursor + Math.round(width * 0.045), contentW - Math.round(width * 0.05), Math.round(width * 0.037), 3);
    }

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = COLORS.white;
    ctx.font = `900 ${Math.round(width * 0.17)}px Impact, Arial, sans-serif`;
    ctx.fillText('RCC', width - margin - Math.round(width * 0.28), height - margin - Math.round(width * 0.2));
    ctx.restore();

    drawFooter(width, height, margin, data);
  }

  function wrapSentence(text, x, y, maxWidth, lineHeight, maxLines) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
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

  function downloadPng() {
    render();
    const data = readForm();
    const name = `affiche-rcc-${data.template || 'publication'}-${data.format || 'format'}.png`;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = name;
    link.click();
    setStatus('PNG telecharge. Le visuel est pret a publier.');
  }

  async function copyCaption() {
    const data = readForm();
    const lines = [
      data.title,
      data.subtitle,
      data.date || data.time || data.location ? `${[data.date, data.time, data.location].filter(Boolean).join(' - ')}` : '',
      data.score ? `Score : ${data.score}` : '',
      data.opponent ? `Adversaire : ${data.opponent}` : '',
      data.body,
      data.url,
      '#RCC #Rugby #SaintAndreDeCubzac'
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n\n'));
      setStatus('Texte de publication copie.');
    } catch (error) {
      setStatus('Copie impossible automatiquement. Vous pouvez recopier le texte depuis les champs.');
    }
  }

  form?.addEventListener('input', render);
  form?.addEventListener('change', render);
  document.querySelector('[data-poster-image]')?.addEventListener('change', (event) => loadImageFromFile(event.target.files?.[0], 'image'));
  document.querySelector('[data-poster-logo]')?.addEventListener('change', (event) => loadImageFromFile(event.target.files?.[0], 'logo'));
  sourceNews?.addEventListener('change', (event) => applyNews(event.target.value));
  sourceEvent?.addEventListener('change', (event) => applyEvent(event.target.value));
  downloadButton?.addEventListener('click', downloadPng);
  copyButton?.addEventListener('click', copyCaption);

  loadSources();
  render();
})();
