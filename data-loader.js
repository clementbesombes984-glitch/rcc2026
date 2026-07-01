(() => {
  const dataCache = new Map();
  const dataPath = (name) => './data/' + name + '.json';
  const escapeHtml = (value = '') => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
  };
  const fetchData = async (name) => {
    if (dataCache.has(name)) return dataCache.get(name);
    const response = await fetch(dataPath(name), { cache: 'no-store' });
    if (!response.ok) throw new Error('Données introuvables: ' + name);
    const data = await response.json();
    dataCache.set(name, data);
    return data;
  };
  const imageStyle = (url) => url
  ? ` style="background-image:linear-gradient(180deg,rgba(0,0,0,.08),rgba(0,0,0,.5)),url('${escapeHtml(url)}')"`
  : '';

  async function renderMatches() {
    const container = document.querySelector('.matches');
    if (!container) return;
    const { matches = [] } = await fetchData('matches');
    container.innerHTML = matches.map((match, index) => {
      const status = match.status || 'muted';
      const result = match.result || (status === 'upcoming' ? 'À venir' : 'Résultat');
      return '<article class="match ' + (index === 0 ? 'highlighted ' : '') + '">' +
        '<div class="match-date"><span>' + escapeHtml(formatDate(match.date)) + '</span><strong>' + escapeHtml(match.time) + '</strong></div>' +
        '<div class="teams"><strong>' + escapeHtml(match.home) + '</strong><span>vs</span><b>' + escapeHtml(match.away) + '</b></div>' +
        '<div class="venue">' + escapeHtml(match.venue) + '</div>' +
        '<div class="competition">' + escapeHtml(match.competition) + '</div>' +
        '<div class="badge ' + escapeHtml(status) + '">' + escapeHtml(result) + '</div>' +
      '</article>';
    }).join('');
  }

  async function renderNews() {
    const grid = document.querySelector('.news-grid');
    if (!grid) return;
    const { news = [] } = await fetchData('news');
    grid.innerHTML = news.map((item) => '<article>' +
      (item.image ? '<div class="news-image"' + imageStyle(item.image) + '></div>' : '') +
      '<span>' + escapeHtml(item.category) + '</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.summary) + '</p>' +
    '</article>').join('');
  }

  async function renderSettings() {
    const data = await fetchData('settings');
    document.querySelectorAll('[data-cms="join-title"]').forEach((node) => node.textContent = data.joinTitle || node.textContent);
    document.querySelectorAll('[data-cms="join-text"]').forEach((node) => node.textContent = data.joinText || node.textContent);
    document.querySelectorAll('[data-cms="stadium"]').forEach((node) => node.textContent = data.stadium || node.textContent);
    document.querySelectorAll('[data-cms="city"]').forEach((node) => node.textContent = data.city || node.textContent);
    const params = document.querySelector('.parameters-grid');
    if (params) {
      params.innerHTML = (data.parameters || []).map((item) => '<article class="parameter-card"><span>Paramètre</span><h3>' + escapeHtml(item.title) + '</h3><p>' + escapeHtml(item.text) + '</p>' + (item.linkUrl ? '<a class="text-link" href="' + escapeHtml(item.linkUrl) + '">' + escapeHtml(item.linkLabel || 'Voir') + '</a>' : '') + '</article>').join('');
    }
  }

  function playerPhoto(player, index) {
    const photo = player.photo || '';
    return '<div class="player-photo portrait-' + ((index % 6) + 1) + ' cms-photo"' + imageStyle(photo) + ' aria-label="Photo de ' + escapeHtml(player.firstName + ' ' + player.lastName) + '"><span class="shirt-number">' + (index + 1) + '</span></div>';
  }

  async function renderSenior() {
    const page = document.querySelector('.roster-page');
    if (!page) return;
    const { players = [] } = await fetchData('senior');
    const grouped = players.reduce((acc, player) => { (acc[player.group || 'Effectif'] ||= []).push(player); return acc; }, {});
    page.innerHTML = Object.entries(grouped).map(([group, list]) => '<section class="roster-group"><div class="roster-title"><p class="section-kicker">Poste</p><h2>' + escapeHtml(group) + '</h2></div><div class="player-grid">' + list.map((player, index) => '<article class="player-card">' + playerPhoto(player, players.indexOf(player)) + '<div class="player-info"><span>' + escapeHtml(player.position) + '</span><h3><strong>' + escapeHtml(player.firstName) + '</strong> ' + escapeHtml(player.lastName) + '</h3><p>' + escapeHtml([player.weight, player.tag].filter(Boolean).join(' · ')) + '</p></div></article>').join('') + '</div></section>').join('');
  }

  function teamRows() {
    return '<div class="team-line back-row">' + Array.from({ length: 8 }, (_, i) => '<span style="--i:' + i + '"></span>').join('') + '</div><div class="team-line front-row">' + Array.from({ length: 7 }, (_, i) => '<span style="--i:' + i + '"></span>').join('') + '</div>';
  }

  async function renderCategories(dataName, kicker) {
    const page = document.querySelector('[data-category-page="' + dataName + '"]');
    if (!page) return;
    const { categories = [] } = await fetchData(dataName);
    page.innerHTML = categories.map((cat, idx) => '<section class="academy-category" id="' + escapeHtml(String(cat.age).toLowerCase()) + '">' +
      '<div class="team-photo photo-' + ((idx % 4) + 1) + ' cms-team-photo"' + imageStyle(cat.teamPhoto) + ' aria-label="Photo de l'effectif ' + escapeHtml(cat.age) + '">' + teamRows() + '<strong>' + escapeHtml(cat.age) + '</strong></div>' +
      '<div class="academy-content"><p class="section-kicker">' + escapeHtml(kicker) + '</p><h2>' + escapeHtml(cat.age) + ' <span>' + escapeHtml(cat.label) + '</span></h2><p>' + escapeHtml(cat.summary) + '</p><div class="academy-meta"><span>' + escapeHtml(cat.count) + '</span><span>' + escapeHtml(cat.training) + '</span></div><h3>Staff éducateur</h3><div class="staff-grid">' + (cat.staff || []).map((person, i) => '<article class="staff-card"><div class="staff-avatar avatar-' + (((idx + i) % 6) + 1) + ' cms-avatar"' + imageStyle(person.photo) + '></div><div><strong>' + escapeHtml(person.firstName) + '</strong><span>' + escapeHtml(person.lastName) + '</span><small>Éducateur ' + escapeHtml(cat.age) + '</small></div></article>').join('') + '</div></div>' +
    '</section>').join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderMatches().catch(() => {});
    renderNews().catch(() => {});
    renderSettings().catch(() => {});
    renderSenior().catch(() => {});
    renderCategories('academy', 'École de rugby').catch(() => {});
    renderCategories('youth', 'Pôle jeunes').catch(() => {});
  });
})();
