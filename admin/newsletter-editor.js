(() => {
  'use strict';

  const root = document.querySelector('[data-newsletter-v2]');
  if (!root) return;

  const CURRENT_SEASON = '2026-2027';
  const STORAGE_KEY = 'rcc_newsletter_drafts_v2';
  const AUTOSAVE_KEY = 'rcc_newsletter_autosave_v2';
  const A4 = { width: 794, height: 1123, exportWidth: 1748, exportHeight: 2480 };
  const BLOCK_TYPES = {
    header: 'En-tête du journal', editorial: 'Édito', news: 'Actualité', leadNews: 'Actualité principale',
    interview: 'Interview', portrait: 'Portrait', match: 'Retour sur un match', result: 'Résultat',
    upcoming: 'Prochain rendez-vous', calendar: 'Calendrier', academy: 'École de rugby', youth: 'Pôle jeunes U16 / U19',
    cadettes: 'Cadettes', seniors: 'Seniors', partner: 'Partenaire', number: 'Chiffre du mois',
    important: 'Informations importantes', progress: 'Avancées du club', tomorrow: 'RCC Demain',
    thanks: 'Remerciements', gallery: 'Galerie photos', photo: 'Photo', quote: 'Citation', text: 'Texte libre',
    divider: 'Séparateur', footer: 'Pied de page'
  };
  const TYPE_DEFAULTS = {
    header: { size: 'full', title: 'Le journal du RCC', label: 'Racing Club Cubzaguais' },
    editorial: { size: 'half', title: "L'édito", label: 'Le mot du club' },
    news: { size: 'half', title: 'Actualité', label: 'À retenir' },
    leadNews: { size: 'two-thirds', title: 'À la une', label: 'Actualité' },
    interview: { size: 'half', title: "L'interview", label: 'Rencontre' },
    portrait: { size: 'third', title: 'Portrait', label: 'Vie du club' },
    match: { size: 'half', title: 'Retour sur le match', label: 'Terrain' },
    result: { size: 'third', title: 'Résultat', label: 'Score' },
    upcoming: { size: 'half', title: 'Prochain rendez-vous', label: 'Calendrier' },
    calendar: { size: 'half', title: 'Les dates à venir', label: 'Calendrier' },
    academy: { size: 'half', title: "L'école de rugby", label: 'Formation' },
    youth: { size: 'half', title: 'Pôle jeunes', label: 'U16 / U19' },
    cadettes: { size: 'half', title: 'Cadettes', label: 'Équipe' },
    seniors: { size: 'half', title: 'Seniors', label: 'Équipe' },
    partner: { size: 'half', title: "Partenaire à l'honneur", label: 'Partenaire' },
    number: { size: 'third', title: 'Le chiffre du mois', label: 'En chiffres' },
    important: { size: 'half', title: 'Informations importantes', label: 'À noter' },
    progress: { size: 'half', title: 'Les avancées du club', label: 'Projet club' },
    tomorrow: { size: 'full', title: 'Le RCC de demain', label: 'Notre projet' },
    thanks: { size: 'half', title: 'Merci à…', label: 'Engagement' },
    gallery: { size: 'full', title: 'Le mois en images', label: 'Galerie' },
    photo: { size: 'half', title: 'Photo du mois', label: 'En images' },
    quote: { size: 'half', title: 'La phrase du mois', label: 'Citation' },
    text: { size: 'half', title: 'Titre du bloc', label: 'RCC' },
    divider: { size: 'full', title: '', label: '' },
    footer: { size: 'full', title: 'Racing Club Cubzaguais', label: 'Depuis 1977' }
  };
  const TEMPLATE_BLOCKS = {
    monthly: [
      ['header', 1, 'full'], ['editorial', 1, 'half'], ['leadNews', 1, 'half'], ['news', 1, 'two-thirds'],
      ['number', 1, 'third'], ['progress', 1, 'two-thirds'], ['photo', 1, 'third'], ['footer', 1, 'full'],
      ['academy', 2, 'half'], ['calendar', 2, 'half'], ['portrait', 2, 'third'], ['gallery', 2, 'two-thirds'],
      ['important', 2, 'half'], ['partner', 2, 'half'], ['tomorrow', 2, 'full'], ['footer', 2, 'full']
    ],
    ag: [['header', 1, 'full'], ['editorial', 1, 'full'], ['leadNews', 1, 'two-thirds'], ['number', 1, 'third'], ['progress', 1, 'full'], ['footer', 1, 'full'], ['important', 2, 'half'], ['tomorrow', 2, 'half'], ['gallery', 2, 'full'], ['thanks', 2, 'full'], ['footer', 2, 'full']],
    season: [['header', 1, 'full'], ['leadNews', 1, 'two-thirds'], ['important', 1, 'third'], ['academy', 1, 'half'], ['seniors', 1, 'half'], ['footer', 1, 'full'], ['calendar', 2, 'half'], ['youth', 2, 'half'], ['cadettes', 2, 'half'], ['partner', 2, 'half'], ['tomorrow', 2, 'full'], ['footer', 2, 'full']],
    event: [['header', 1, 'full'], ['leadNews', 1, 'full'], ['upcoming', 1, 'half'], ['important', 1, 'half'], ['gallery', 1, 'full'], ['footer', 1, 'full'], ['news', 2, 'half'], ['portrait', 2, 'half'], ['partner', 2, 'half'], ['thanks', 2, 'half'], ['text', 2, 'full'], ['footer', 2, 'full']]
  };

  const $ = (selector) => root.querySelector(selector);
  const $$ = (selector) => Array.from(root.querySelectorAll(selector));
  const uid = () => `nl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const clean = (value) => String(value ?? '').trim();
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  const parseDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  let state = createDocument('monthly');
  let selectedBlockId = null;
  let pageView = '1';
  let activePage = 1;
  let zoom = 0.7;
  let dirty = false;
  let sources = { news: [], matches: [], partners: [], gallery: [] };
  let serverNewsletters = [];
  let autosaveTimer = null;

  function makeBlock(type, page = activePage, size = '') {
    const defaults = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.text;
    return {
      id: uid(), type, page, size: size || defaults.size || 'half', title: defaults.title || '', subtitle: '',
      text: '', label: defaults.label || '', image: '', hideImage: false, align: 'left', accent: 'burgundy', link: '',
      sourceType: '', sourceId: '', photos: [], photoCount: 4
    };
  }

  function createDocument(template = 'monthly') {
    const now = new Date();
    return {
      id: uid(), title: 'Le journal du RCC', issueNumber: '', month: now.toLocaleDateString('fr-FR', { month: 'long' }),
      year: now.getFullYear(), season: CURRENT_SEASON, slogan: 'Ensemble, plus forts.',
      description: 'La newsletter du Racing Club Cubzaguais.', status: 'draft', template,
      createdAt: now.toISOString(), updatedAt: now.toISOString(), published: false, pdf: '', cover: '',
      pages: [1, 2].map((number) => ({ number, blocks: TEMPLATE_BLOCKS[template].filter((item) => item[1] === number).map((item) => makeBlock(item[0], number, item[2])) }))
    };
  }

  function normalizeDocument(value) {
    if (!value || typeof value !== 'object') return createDocument('monthly');
    const pages = Array.isArray(value.pages) ? value.pages : [
      { number: 1, blocks: Array.isArray(value.blocks) ? value.blocks : [] }, { number: 2, blocks: [] }
    ];
    return {
      ...createDocument(value.template || 'monthly'), ...value, id: value.id || uid(),
      pages: [1, 2].map((number) => {
        const page = pages.find((entry) => Number(entry.number) === number) || { blocks: [] };
        return { number, blocks: (page.blocks || []).map((block) => ({ ...makeBlock(block.type || 'text', number), ...block, id: block.id || uid(), page: number })) };
      })
    };
  }

  function currentPage() { return state.pages.find((page) => page.number === activePage); }
  function allBlocks() { return state.pages.flatMap((page) => page.blocks); }
  function selectedBlock() { return allBlocks().find((block) => block.id === selectedBlockId) || null; }
  function setDirty(message = 'Modifications non enregistrées') {
    dirty = true;
    $('[data-nl-save-state]').textContent = message;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
      $('[data-nl-save-state]').textContent = 'Brouillon sauvegardé automatiquement';
    }, 600);
  }

  function getDrafts() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  }
  function putDrafts(drafts) { localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts)); }
  function saveDraft() {
    state.updatedAt = new Date().toISOString();
    const drafts = getDrafts();
    const index = drafts.findIndex((draft) => draft.id === state.id);
    if (index >= 0) drafts[index] = state; else drafts.unshift(state);
    putDrafts(drafts.slice(0, 30));
    dirty = false;
    $('[data-nl-save-state]').textContent = 'Enregistré';
    hydrateDraftSelect();
  }

  function hydrateDraftSelect() {
    const select = $('[data-nl-draft-select]');
    const selected = state.id;
    const local = getDrafts();
    select.innerHTML = '<option value="">Nouveau document</option>'
      + (local.length ? `<optgroup label="Brouillons locaux">${local.map((draft) => `<option value="local:${escapeHtml(draft.id)}">${escapeHtml(draft.title || 'Newsletter')} — ${escapeHtml(draft.month || '')} ${escapeHtml(draft.year || '')}</option>`).join('')}</optgroup>` : '')
      + (serverNewsletters.length ? `<optgroup label="Archives du site">${serverNewsletters.map((draft) => `<option value="server:${escapeHtml(draft.id)}">${escapeHtml(draft.title || 'Newsletter')} — ${escapeHtml(draft.month || '')} ${escapeHtml(draft.year || '')}</option>`).join('')}</optgroup>` : '');
    if (local.some((draft) => draft.id === selected)) select.value = `local:${selected}`;
  }

  function palette() {
    const query = clean($('[data-nl-block-search]').value).toLocaleLowerCase('fr');
    $('[data-nl-block-palette]').innerHTML = Object.entries(BLOCK_TYPES)
      .filter(([, label]) => label.toLocaleLowerCase('fr').includes(query))
      .map(([type, label]) => `<button type="button" data-add-block="${type}">${escapeHtml(label)}</button>`).join('');
  }

  const blockClass = (block) => `newsletter-content-block block-${block.type} size-${block.size} accent-${block.accent}${block.id === selectedBlockId ? ' is-selected' : ''}`;
  function imageMarkup(block) {
    if (block.hideImage || !block.image) return '';
    return `<figure><img src="${escapeHtml(block.image)}" alt="" crossorigin="anonymous" /></figure>`;
  }
  function renderBlockContent(block) {
    if (block.type === 'divider') return '<div class="newsletter-divider"></div>';
    if (block.type === 'header') return `<div class="newsletter-masthead"><img src="../assets/logo-rcc.png" alt="" /><div><span>${escapeHtml(block.label || 'Racing Club Cubzaguais')}</span><h1>${escapeHtml(state.title)}</h1><p>${escapeHtml(state.slogan)}</p></div><b>N°${escapeHtml(state.issueNumber || '—')}<small>${escapeHtml(state.month)} ${escapeHtml(state.year)}</small></b></div>`;
    if (block.type === 'footer') return `<div class="newsletter-footer"><img src="../assets/logo-rcc.png" alt="" /><strong>Racing Club Cubzaguais</strong><span>rccubzaguais.fr</span></div>`;
    const photos = block.type === 'gallery' && block.photos?.length
      ? `<div class="newsletter-photo-grid">${block.photos.slice(0, Number(block.photoCount) || 4).map((photo) => `<img src="${escapeHtml(photo.image || photo)}" alt="" crossorigin="anonymous" />`).join('')}</div>` : '';
    return `${imageMarkup(block)}<div class="newsletter-block-copy" style="text-align:${block.align}"><span>${escapeHtml(block.label)}</span><h2>${escapeHtml(block.title || BLOCK_TYPES[block.type])}</h2>${block.subtitle ? `<h3>${escapeHtml(block.subtitle)}</h3>` : ''}${block.text ? `<p>${escapeHtml(block.text).replace(/\n/g, '<br>')}</p>` : ''}${block.link ? `<small>${escapeHtml(block.link)}</small>` : ''}</div>${photos}`;
  }

  function renderPage(page) {
    return `<article class="newsletter-sheet" data-page="${page.number}" aria-label="Page ${page.number}">
      <div class="newsletter-sheet-grid">${page.blocks.map((block) => `<section class="${blockClass(block)}" data-block-id="${block.id}" draggable="true">${renderBlockContent(block)}</section>`).join('')}</div>
      <span class="newsletter-page-number">${page.number} / 2</span>
    </article>`;
  }

  function render() {
    const pages = pageView === 'both' ? state.pages : state.pages.filter((page) => String(page.number) === pageView);
    $('[data-nl-spread]').style.setProperty('--newsletter-zoom', zoom);
    $('[data-nl-spread]').classList.toggle('is-double', pageView === 'both');
    $('[data-nl-spread]').innerHTML = pages.map(renderPage).join('');
    $('[data-nl-zoom-label]').textContent = `${Math.round(zoom * 100)} %`;
    $$('[data-nl-page-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.nlPageView === pageView));
    bindPageEvents();
    renderProperties();
    requestAnimationFrame(checkOverflow);
  }

  function bindPageEvents() {
    $$('[data-block-id]').forEach((node) => {
      node.addEventListener('click', () => { selectedBlockId = node.dataset.blockId; activePage = Number(node.closest('[data-page]').dataset.page); render(); });
      node.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', node.dataset.blockId));
      node.addEventListener('dragover', (event) => event.preventDefault());
      node.addEventListener('drop', (event) => {
        event.preventDefault();
        const sourceId = event.dataTransfer.getData('text/plain');
        reorderBlock(sourceId, node.dataset.blockId);
      });
    });
  }

  function checkOverflow() {
    const overflow = $$('.newsletter-sheet').some((sheet) => sheet.querySelector('.newsletter-sheet-grid').scrollHeight > A4.height - 34);
    $('[data-nl-overflow]').hidden = !overflow;
  }

  function renderProperties() {
    const block = selectedBlock();
    $('[data-nl-document-properties]').hidden = Boolean(block);
    $('[data-nl-block-properties]').hidden = !block;
    $('[data-nl-selection-label]').textContent = block ? BLOCK_TYPES[block.type] : 'Document';
    if (!block) {
      $$('[data-nl-meta]').forEach((input) => { input.value = state[input.dataset.nlMeta] ?? ''; });
      return;
    }
    const typeSelect = $('[data-nl-block-field="type"]');
    typeSelect.innerHTML = Object.entries(BLOCK_TYPES).map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join('');
    $$('[data-nl-block-field]').forEach((input) => {
      const key = input.dataset.nlBlockField;
      if (input.type === 'checkbox') input.checked = Boolean(block[key]); else input.value = block[key] ?? '';
    });
  }

  function addBlock(type, source = null) {
    const block = makeBlock(type, activePage);
    if (source) Object.assign(block, source, { id: uid(), page: activePage, type: source.type || type });
    currentPage().blocks.push(block);
    selectedBlockId = block.id;
    setDirty(); render();
  }
  function removeBlock() {
    const block = selectedBlock(); if (!block) return;
    const page = state.pages.find((entry) => entry.number === block.page);
    page.blocks = page.blocks.filter((entry) => entry.id !== block.id);
    selectedBlockId = null; setDirty(); render();
  }
  function moveBlock(direction) {
    const block = selectedBlock(); if (!block) return;
    const blocks = state.pages.find((page) => page.number === block.page).blocks;
    const index = blocks.findIndex((item) => item.id === block.id);
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    setDirty(); render();
  }
  function reorderBlock(sourceId, targetId) {
    if (!sourceId || sourceId === targetId) return;
    const source = allBlocks().find((block) => block.id === sourceId);
    const target = allBlocks().find((block) => block.id === targetId);
    if (!source || !target) return;
    const sourcePage = state.pages.find((page) => page.number === source.page);
    const targetPage = state.pages.find((page) => page.number === target.page);
    sourcePage.blocks = sourcePage.blocks.filter((block) => block.id !== source.id);
    const index = targetPage.blocks.findIndex((block) => block.id === target.id);
    source.page = target.page;
    targetPage.blocks.splice(index, 0, source);
    setDirty(); render();
  }
  function moveBlockPage() {
    const block = selectedBlock(); if (!block) return;
    const oldPage = state.pages.find((page) => page.number === block.page);
    const nextPage = block.page === 1 ? 2 : 1;
    oldPage.blocks = oldPage.blocks.filter((entry) => entry.id !== block.id);
    block.page = nextPage;
    state.pages.find((page) => page.number === nextPage).blocks.push(block);
    activePage = nextPage; pageView = String(nextPage); setDirty(); render();
  }
  function cloneBlock() {
    const block = selectedBlock(); if (!block) return;
    const clone = { ...block, id: uid(), title: `${block.title} (copie)` };
    const blocks = state.pages.find((page) => page.number === block.page).blocks;
    blocks.splice(blocks.findIndex((entry) => entry.id === block.id) + 1, 0, clone);
    selectedBlockId = clone.id; setDirty(); render();
  }

  async function fetchJson(path) {
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error(String(response.status));
      return await response.json();
    } catch { return {}; }
  }
  async function loadSources() {
    const [news, matches, partners, gallery, newsletters] = await Promise.all([
      fetchJson('../data/news.json'), fetchJson('../data/matches.json'), fetchJson('../data/partners.json'), fetchJson('../data/gallery.json'), fetchJson('../data/newsletters.json')
    ]);
    sources = {
      news: Array.isArray(news) ? news : (news.news || []), matches: Array.isArray(matches) ? matches : (matches.matches || []),
      partners: Array.isArray(partners) ? partners : (partners.partners || []), gallery: Array.isArray(gallery) ? gallery : (gallery.albums || [])
    };
    serverNewsletters = Array.isArray(newsletters) ? newsletters : (newsletters.newsletters || []);
    hydrateDraftSelect();
    renderSourceResults();
  }
  function sourceToBlock(kind, item) {
    if (kind === 'news') return { type: item.important ? 'leadNews' : 'news', title: item.title, text: item.summary || item.body, image: item.image || '', label: item.category || 'Actualité', link: '/actualites.html' };
    if (kind === 'matches') return { type: item.type_evenement === 'tournoi' ? 'upcoming' : (item.status === 'played' ? 'result' : 'match'), title: item.title || `${item.team || 'RCC'} ${item.opponent ? `– ${item.opponent}` : ''}`, subtitle: [parseDate(item.date), item.time, item.location].filter(Boolean).join(' • '), text: item.description || item.result || '', label: item.type_evenement || 'Calendrier', link: '/calendrier.html' };
    if (kind === 'partners') return { type: 'partner', title: item.name, text: item.description || '', image: item.logo || '', label: 'Partenaire', link: item.url || '' };
    const photos = (item.photos || []).map((photo) => typeof photo === 'string' ? { image: photo } : photo).filter((photo) => photo.image);
    return { type: 'gallery', title: item.title, text: item.description || '', image: item.cover || photos[0]?.image || '', photos, label: item.category || 'Galerie' };
  }
  function renderSourceResults() {
    const kind = $('[data-nl-source-type]').value;
    const items = sources[kind] || [];
    $('[data-nl-source-results]').innerHTML = items.length ? items.slice(0, 30).map((item, index) => `<button type="button" data-import-source="${index}"><strong>${escapeHtml(item.title || item.name || 'Contenu')}</strong><span>${escapeHtml(item.date || item.category || item.type_evenement || '')}</span></button>`).join('') : '<p>Aucun contenu disponible.</p>';
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
    });
  }

  async function inlineImages(node) {
    const images = Array.from(node.querySelectorAll('img'));
    await Promise.all(images.map(async (image) => {
      try {
        const response = await fetch(image.src); const blob = await response.blob(); image.src = await fileToDataUrl(blob);
      } catch { image.removeAttribute('src'); }
    }));
  }

  const exportCss = `
    *{box-sizing:border-box}body{margin:0}.newsletter-sheet{position:relative;width:794px;height:1123px;padding:22px;background:#f5f3ef;color:#111;font-family:Arial,sans-serif;overflow:hidden}
    .newsletter-sheet:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(177,24,69,.07),transparent 35%),linear-gradient(315deg,rgba(3,23,52,.07),transparent 35%);pointer-events:none}
    .newsletter-sheet-grid{position:relative;display:grid;grid-template-columns:repeat(12,1fr);grid-auto-flow:row dense;gap:9px;align-content:start}.newsletter-content-block{grid-column:span 6;border:1px solid #cbc7c1;background:#fff;min-height:92px;overflow:hidden;position:relative;display:flex}.size-full{grid-column:span 12}.size-two-thirds{grid-column:span 8}.size-half{grid-column:span 6}.size-third,.size-small{grid-column:span 4}.newsletter-content-block figure{width:39%;margin:0;flex:none}.newsletter-content-block figure img{width:100%;height:100%;object-fit:cover}.newsletter-block-copy{padding:12px;flex:1}.newsletter-block-copy>span{font-size:10px;line-height:1.2;text-transform:uppercase;color:#b11845;font-weight:700;letter-spacing:.08em}.newsletter-block-copy h2{font-size:21px;line-height:1.05;margin:4px 0 6px;text-transform:uppercase;color:#071a37}.newsletter-block-copy h3{font-size:13px;margin:0 0 5px;color:#b11845}.newsletter-block-copy p{font-size:11px;line-height:1.42;margin:0}.newsletter-block-copy small{display:block;font-size:8px;margin-top:7px;color:#555}.accent-navy{border-top:3px solid #071a37}.accent-burgundy{border-top:3px solid #b11845}.accent-light{border-top:3px solid #c9c7c3}.block-header,.block-footer{border:0;background:#080b10;color:#fff}.block-header{min-height:118px}.newsletter-masthead{display:flex;align-items:center;width:100%;padding:16px 20px;background:linear-gradient(110deg,#080b10 65%,#3a0716)}.newsletter-masthead img{width:72px;height:72px;object-fit:contain;margin-right:16px}.newsletter-masthead span,.newsletter-masthead p{font-size:10px;text-transform:uppercase;letter-spacing:.12em;margin:0}.newsletter-masthead h1{font-size:38px;line-height:.95;text-transform:uppercase;margin:3px 0;color:#fff}.newsletter-masthead b{margin-left:auto;text-align:center;font-size:18px;color:#fff}.newsletter-masthead small{display:block;font-size:9px;margin-top:4px}.block-footer{min-height:44px}.newsletter-footer{display:flex;align-items:center;width:100%;gap:10px;padding:8px 14px}.newsletter-footer img{width:29px;height:29px;object-fit:contain}.newsletter-footer span{margin-left:auto;color:#d45a7f}.block-number .newsletter-block-copy h2{font-size:36px;color:#b11845}.block-quote{background:#0a172b;color:#fff}.block-quote h2{color:#fff}.block-important{background:#0d1015;color:#fff}.block-important h2{color:#fff}.block-leadNews{min-height:180px}.block-leadNews h2{font-size:27px}.block-gallery{display:block}.newsletter-photo-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;padding:0 10px 10px}.newsletter-photo-grid img{width:100%;height:88px;object-fit:cover}.newsletter-divider{height:2px;width:100%;margin:auto;background:#b11845}.block-divider{min-height:12px;background:transparent;border:0}.newsletter-page-number{position:absolute;bottom:6px;right:12px;font-size:8px;color:#777}
  `;

  async function pageToCanvas(pageNumber) {
    const source = root.querySelector(`.newsletter-sheet[data-page="${pageNumber}"]`) || (() => {
      const holder = document.createElement('div'); holder.innerHTML = renderPage(state.pages.find((page) => page.number === pageNumber)); return holder.firstElementChild;
    })();
    const clone = source.cloneNode(true);
    clone.style.transform = 'none'; clone.style.margin = '0';
    await inlineImages(clone);
    const markup = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${A4.exportWidth}" height="${A4.exportHeight}" viewBox="0 0 ${A4.width} ${A4.height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml"><style>${exportCss}</style>${markup}</div></foreignObject></svg>`;
    const svgBytes = new TextEncoder().encode(svg);
    let binary = '';
    for (let offset = 0; offset < svgBytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...svgBytes.subarray(offset, offset + 0x8000));
    }
    const dataUrl = `data:image/svg+xml;base64,${btoa(binary)}`;
    const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = dataUrl; });
    const canvas = document.createElement('canvas'); canvas.width = A4.exportWidth; canvas.height = A4.exportHeight;
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); return canvas;
  }

  function downloadBlob(blob, filename) {
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  async function exportPng(pageNumber, suffix = '') {
    setAction('Génération du PNG…');
    const canvas = await pageToCanvas(pageNumber);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1));
    downloadBlob(blob, `newsletter-rcc-${slug(state.title)}-${suffix || `page-${pageNumber}`}.png`); setAction('PNG téléchargé.');
  }
  const bytesFromDataUrl = (dataUrl) => Uint8Array.from(atob(dataUrl.split(',')[1]), (char) => char.charCodeAt(0));
  function buildPdf(jpegs) {
    const enc = new TextEncoder(); const chunks = []; const offsets = [0]; let length = 0;
    const add = (value) => { const bytes = typeof value === 'string' ? enc.encode(value) : value; chunks.push(bytes); length += bytes.length; };
    add('%PDF-1.4\n');
    const objects = [];
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = '<< /Type /Pages /Kids [3 0 R 6 0 R] /Count 2 >>';
    jpegs.forEach((jpeg, index) => {
      const pageId = index === 0 ? 3 : 6; const imageId = pageId + 1; const contentId = pageId + 2;
      objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`;
      objects[imageId] = { head: `<< /Type /XObject /Subtype /Image /Width ${A4.exportWidth} /Height ${A4.exportHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, data: jpeg, tail: '\nendstream' };
      const command = `q 595.28 0 0 841.89 0 0 cm /Im${index + 1} Do Q`;
      objects[contentId] = `<< /Length ${command.length} >>\nstream\n${command}\nendstream`;
    });
    for (let id = 1; id <= 8; id += 1) {
      offsets[id] = length; add(`${id} 0 obj\n`); const object = objects[id];
      if (typeof object === 'string') add(object); else { add(object.head); add(object.data); add(object.tail); }
      add('\nendobj\n');
    }
    const xref = length; add('xref\n0 9\n0000000000 65535 f \n');
    for (let id = 1; id <= 8; id += 1) add(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
    add(`trailer\n<< /Size 9 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(chunks, { type: 'application/pdf' });
  }
  async function createPdf() {
    const canvases = await Promise.all([pageToCanvas(1), pageToCanvas(2)]);
    return buildPdf(canvases.map((canvas) => bytesFromDataUrl(canvas.toDataURL('image/jpeg', 0.94))));
  }
  async function exportPdf() { setAction('Génération du PDF deux pages…'); const pdf = await createPdf(); downloadBlob(pdf, `newsletter-rcc-${slug(state.title)}.pdf`); setAction('PDF téléchargé.'); return pdf; }
  const slug = (value) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'journal';
  function setAction(message, error = false) { const node = $('[data-nl-action-status]'); node.textContent = message; node.classList.toggle('is-error', error); }
  async function blobToDataUrl(blob) { return fileToDataUrl(blob); }

  async function publishNewsletter() {
    try {
      state.status = 'published'; state.published = true; saveDraft(); render(); setAction('Préparation des fichiers…');
      const [pdf, coverCanvas] = await Promise.all([createPdf(), pageToCanvas(1)]);
      const coverBlob = await new Promise((resolve) => coverCanvas.toBlob(resolve, 'image/jpeg', 0.92));
      const payload = {
        kind: 'newsletter', publishSite: true,
        newsletter: { ...state, published: state.status === 'published', date: new Date().toISOString().slice(0, 10), pdfData: await blobToDataUrl(pdf), coverData: await blobToDataUrl(coverBlob) }
      };
      const response = await fetch('/api/studio/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Publication impossible.');
      state.pdf = result.newsletter?.pdf || state.pdf; state.cover = result.newsletter?.cover || state.cover;
      setAction('Newsletter publiée et archivée.'); saveDraft();
    } catch (error) { setAction(error.message || 'Publication impossible.', true); }
  }

  function bind() {
    $('[data-nl-block-search]').addEventListener('input', palette);
    $('[data-nl-block-palette]').addEventListener('click', (event) => { const button = event.target.closest('[data-add-block]'); if (button) addBlock(button.dataset.addBlock); });
    $('[data-nl-source-type]').addEventListener('change', renderSourceResults);
    $('[data-nl-source-results]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-import-source]'); if (!button) return;
      const kind = $('[data-nl-source-type]').value; const item = sources[kind][Number(button.dataset.importSource)];
      if (item) addBlock(sourceToBlock(kind, item).type, sourceToBlock(kind, item));
    });
    $$('[data-nl-page-view]').forEach((button) => button.addEventListener('click', () => { pageView = button.dataset.nlPageView; if (pageView !== 'both') activePage = Number(pageView); render(); }));
    $$('[data-nl-zoom]').forEach((button) => button.addEventListener('click', () => { zoom = Math.min(1, Math.max(0.35, zoom + (button.dataset.nlZoom === 'in' ? 0.1 : -0.1))); render(); }));
    $$('[data-nl-meta]').forEach((input) => input.addEventListener('input', () => { state[input.dataset.nlMeta] = input.type === 'number' ? Number(input.value) : input.value; setDirty(); render(); }));
    $$('[data-nl-block-field]').forEach((input) => input.addEventListener('input', () => {
      const block = selectedBlock(); if (!block) return; block[input.dataset.nlBlockField] = input.type === 'checkbox' ? input.checked : input.value; setDirty(); render();
    }));
    $('[data-nl-image-file]').addEventListener('change', async (event) => { const block = selectedBlock(); if (block && event.target.files[0]) { block.image = await fileToDataUrl(event.target.files[0]); setDirty(); render(); } });
    $('[data-nl-move="up"]').addEventListener('click', () => moveBlock(-1)); $('[data-nl-move="down"]').addEventListener('click', () => moveBlock(1));
    $('[data-nl-move-page]').addEventListener('click', moveBlockPage); $('[data-nl-clone-block]').addEventListener('click', cloneBlock); $('[data-nl-remove-block]').addEventListener('click', removeBlock);
    $('[data-nl-template]').addEventListener('change', (event) => { if (!confirm('Appliquer ce modèle et remplacer la mise en page actuelle ?')) { event.target.value = state.template; return; } state = createDocument(event.target.value); selectedBlockId = null; setDirty(); render(); });
    $('[data-nl-save]').addEventListener('click', saveDraft);
    $('[data-nl-new]').addEventListener('click', () => { if (dirty && !confirm('Abandonner les modifications non enregistrées ?')) return; state = createDocument($('[data-nl-template]').value); selectedBlockId = null; render(); });
    $('[data-nl-duplicate]').addEventListener('click', () => { state = normalizeDocument({ ...state, id: uid(), title: `${state.title} (copie)`, createdAt: new Date().toISOString() }); saveDraft(); render(); });
    $('[data-nl-delete]').addEventListener('click', () => { if (!confirm('Supprimer ce brouillon ?')) return; putDrafts(getDrafts().filter((draft) => draft.id !== state.id)); state = createDocument('monthly'); selectedBlockId = null; hydrateDraftSelect(); render(); });
    $('[data-nl-draft-select]').addEventListener('change', (event) => {
      const [origin, id] = event.target.value.split(':');
      const draft = origin === 'server' ? serverNewsletters.find((item) => item.id === id) : getDrafts().find((item) => item.id === id);
      if (draft) { state = normalizeDocument(draft); $('[data-nl-template]').value = state.template; selectedBlockId = null; dirty = false; render(); }
    });
    $('[data-nl-export-page]').addEventListener('click', () => exportPng(activePage)); $('[data-nl-export-cover]').addEventListener('click', () => exportPng(1, 'couverture'));
    $('[data-nl-export-pdf]').addEventListener('click', exportPdf); $('[data-nl-publish]').addEventListener('click', publishNewsletter);
    window.addEventListener('beforeunload', (event) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  }

  function init() {
    const autosave = localStorage.getItem(AUTOSAVE_KEY);
    if (autosave) { try { state = normalizeDocument(JSON.parse(autosave)); } catch { /* ignore invalid local draft */ } }
    palette(); hydrateDraftSelect(); bind(); render(); loadSources();
  }
  init();
})();
