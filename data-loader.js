(function () {
  const dataCache = new Map();

  const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  const dataPath = (name) => `/data/${name}.json?v=${Date.now()}`;

  const fetchData = async (name) => {
    if (dataCache.has(name)) return dataCache.get(name);

    const response = await fetch(dataPath(name), { cache: 'no-store' });

    if (!response.ok) {
      console.error('Données introuvables :', name, response.status);
      return {};
    }

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

    const data = await fetchData('matches');
    const matches = Array.isArray(data) ? data : (data.matches || []);

    if (!matches.length) {
      container.innerHTML = '<p>Aucun match programmé pour le moment.</p>';
      return;
    }

    container.innerHTML = matches.map((match, index) => {
      const status = match.status || 'muted';
      const result = match.result || (status === 'upcoming' ? 'À venir' : 'Résultat');

      return `
        <article class="match ${index === 0 ? 'highlighted' : ''}">
          <div class="match-date">
            <span>${escapeHtml(formatDate(match.date))}</span>
            <strong>${escapeHtml(match.time)}</strong>
          </div>
          <div class="teams">
            <strong>${escapeHtml(match.home)}</strong>
            <span>vs</span>
            <b>${escapeHtml(match.away)}</b>
          </div>
          <div class="venue">${escapeHtml(match.venue)}</div>
          <div class="competition">${escapeHtml(match.competition)}</div>
          <div class="badge ${escapeHtml(status)}">${escapeHtml(result)}</div>
        </article>
      `;
    }).join('');
  }

  async function renderNews() {
    const grid = document.querySelector('.news-grid');
    if (!grid) return;

    const data = await fetchData('news');
    const news = Array.isArray(data) ? data : (data.news || []);

    grid.innerHTML = news.map((item) => `
      <article>
        ${item.image ? `<div class="news-image"${imageStyle(item.image)}></div>` : ''}
        <span>${escapeHtml(item.category)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
      </article>
    `).join('');
  }

  async function renderSettings() {
    const data = await fetchData('settings');

    document.querySelectorAll('[data-cms="join-title"]').forEach((node) => {
      node.textContent = data.joinTitle || node.textContent;
    });

    document.querySelectorAll('[data-cms="join-text"]').forEach((node) => {
      node.textContent = data.joinText || node.textContent;
    });

    document.querySelectorAll('[data-cms="stadium"]').forEach((node) => {
      node.textContent = data.stadium || node.textContent;
    });

    document.querySelectorAll('[data-cms="city"]').forEach((node) => {
      node.textContent = data.city || node.textContent;
    });

    const params = document.querySelector('.parameters-grid');

    if (params) {
      params.innerHTML = (data.parameters || []).map((item) => `
        <article class="parameter-card">
          <span>Paramètre</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.text)}</p>
          ${item.linkUrl ? `<a class="text-link" href="${escapeHtml(item.linkUrl)}">${escapeHtml(item.linkLabel || 'Voir')}</a>` : ''}
        </article>
      `).join('');
    }
  }

  function playerPhoto(player, index) {
    const photo = player.photo || '';
    return `
      <div class="player-photo portrait-${(index % 6) + 1} cms-photo"${imageStyle(photo)} aria-label="Photo de ${escapeHtml(player.firstName + ' ' + player.lastName)}">
        <span class="shirt-number">${index + 1}</span>
      </div>
    `;
  }

  function staffPhoto(person, index) {
    const photo = person.photo || '';
    return `<div class="staff-avatar avatar-${(index % 6) + 1} cms-avatar"${imageStyle(photo)} aria-label="Photo de ${escapeHtml((person.firstName || '') + ' ' + (person.lastName || ''))}"></div>`;
  }

  async function renderSenior() {
    const page = document.querySelector('.roster-page');
    if (!page) return;

    const data = await fetchData('senior');
    const source = Array.isArray(data) ? { players: data, staff: [] } : data;
    const players = source.players || [];
    const staff = source.staff || [];

    const grouped = players.reduce((acc, player) => {
      (acc[player.group || 'Effectif'] ||= []).push(player);
      return acc;
    }, {});

    const staffSection = staff.length ? `
      <section class="roster-group senior-staff-group">
        <div class="roster-title">
          <p class="section-kicker">Encadrement</p>
          <h2>Staff senior</h2>
        </div>
        <div class="staff-grid senior-staff-grid">
          ${staff.map((person, index) => `
            <article class="staff-card senior-staff-card">
              ${staffPhoto(person, index)}
              <div>
                <strong>${escapeHtml(person.firstName)}</strong>
                <span>${escapeHtml(person.lastName)}</span>
                <small>${escapeHtml(person.role || 'Staff senior')}</small>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    ` : '';

    const playerSections = Object.entries(grouped).map(([group, list]) => `
      <section class="roster-group">
        <div class="roster-title">
          <p class="section-kicker">Poste</p>
          <h2>${escapeHtml(group)}</h2>
        </div>
        <div class="player-grid">
          ${list.map((player, index) => `
            <article class="player-card">
              ${playerPhoto(player, index)}
              <div class="player-info">
                <span>${escapeHtml(player.position)}</span>
                <h3><strong>${escapeHtml(player.firstName)}</strong> ${escapeHtml(player.lastName)}</h3>
                <p>${escapeHtml([player.weight, player.tag].filter(Boolean).join(' Â· '))}</p>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    `).join('');

    page.innerHTML = staffSection + playerSections;
  }

  function teamRows() {
    return `
      <div class="team-line back-row">
        ${Array.from({ length: 8 }, (_, i) => `<span style="--i:${i}"></span>`).join('')}
      </div>
      <div class="team-line front-row">
        ${Array.from({ length: 7 }, (_, i) => `<span style="--i:${i}"></span>`).join('')}
      </div>
    `;
  }

  async function renderCategories(dataName, kicker) {
    const page = document.querySelector(`[data-category-page="${dataName}"]`);
    if (!page) return;

    const data = await fetchData(dataName);
    const categories = Array.isArray(data) ? data : (data.categories || []);

    page.innerHTML = categories.map((cat, idx) => `
      <section class="academy-category" id="${escapeHtml(String(cat.age).toLowerCase())}">
        <div class="team-photo photo-${(idx % 4) + 1} cms-team-photo"${imageStyle(cat.teamPhoto)} aria-label="Photo de l'effectif ${escapeHtml(cat.age)}">
          ${teamRows()}
          <strong>${escapeHtml(cat.age)}</strong>
        </div>
        <div class="academy-content">
          <p class="section-kicker">${escapeHtml(kicker)}</p>
          <h2>${escapeHtml(cat.age)} <span>${escapeHtml(cat.label)}</span></h2>
          <p>${escapeHtml(cat.summary)}</p>
          <div class="academy-meta">
            <span>${escapeHtml(cat.count)}</span>
            <span>${escapeHtml(cat.training)}</span>
          </div>
          <h3>Staff éducateur</h3>
          <div class="staff-grid">
            ${(cat.staff || []).map((person, i) => `
              <article class="staff-card">
                <div class="staff-avatar avatar-${((idx + i) % 6) + 1} cms-avatar"${imageStyle(person.photo)}></div>
                <div>
                  <strong>${escapeHtml(person.firstName)}</strong>
                  <span>${escapeHtml(person.lastName)}</span>
                  <small>Éducateur ${escapeHtml(cat.age)}</small>
                </div>
              </article>
            `).join('')}
          </div>
        </div>
      </section>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderMatches().catch(console.error);
    renderNews().catch(console.error);
    renderSettings().catch(console.error);
    renderSenior().catch(console.error);
    renderCategories('academy', 'École de rugby').catch(console.error);
    renderCategories('youth', 'Pôle jeunes').catch(console.error);
  });
})();
