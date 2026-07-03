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

  function icon(name) {
    const icons = { calendar: '▣', place: '⌖', time: '◷', match: '◆', contact: '✉', social: '◌', address: '⌂', gallery: '▧' };
    return `<span class="ui-icon ui-icon-${name}" aria-hidden="true">${icons[name] || '•'}</span>`;
  }

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
        <span>${escapeHtml(item.category)}${item.important ? ' · Important' : ''}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
      </article>
    `).join('');
  }

  async function renderImportantNews() {
    const shell = document.querySelector('[data-important-news]');
    if (!shell) return;
    const data = await fetchData('news');
    const news = Array.isArray(data) ? data : (data.news || []);
    const item = news.find((entry) => entry.important);
    if (!item) { shell.hidden = true; return; }
    shell.hidden = false;
    shell.innerHTML = `
      <a class="important-news" href="./actualites.html">
        <span>${icon('match')} Info importante</span>
        <strong>${escapeHtml(item.title)}</strong>
        <em>${escapeHtml(item.category || 'Club')}</em>
      </a>
    `;
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

    document.querySelectorAll('[data-cms="address"]').forEach((node) => {
      node.textContent = data.address || node.textContent;
    });

    document.querySelectorAll('[data-cms="phone"]').forEach((node) => {
      node.textContent = data.phone || 'À renseigner';
    });

    document.querySelectorAll('[data-cms="email"]').forEach((node) => {
      const email = data.email || 'lerccdemain@gmail.com';
      node.textContent = email;
      node.setAttribute('href', 'mailto:' + email);
    });

    document.querySelectorAll('[data-cms="facebook"], [data-cms="instagram"]').forEach((node) => {
      const key = node.getAttribute('data-cms');
      const url = data[key] || '';
      if (url) node.setAttribute('href', url);
      else node.setAttribute('aria-disabled', 'true');
    });

    document.querySelectorAll('[data-cms="maps"]').forEach((node) => {
      if (data.mapsUrl) node.setAttribute('src', data.mapsUrl);
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

  async function renderPartners() {
    const grid = document.querySelector('[data-partners]');
    if (!grid) return;
    const data = await fetchData('partners');
    const partners = data.partners || [];
    const grouped = partners.reduce((acc, item) => {
      (acc[item.category || 'Partenaires'] ||= []).push(item);
      return acc;
    }, {});
    grid.innerHTML = Object.entries(grouped).map(([category, list]) => `
      <section class="partner-tier">
        <div class="roster-title"><p class="section-kicker">Partenaires</p><h2>${escapeHtml(category)}</h2></div>
        <div class="partner-cards">
          ${list.map((item) => `
            <article class="partner-card">
              <div class="partner-logo"${imageStyle(item.logo)}><strong>${escapeHtml((item.name || 'RCC').slice(0, 2))}</strong></div>
              <div><span>${escapeHtml(category)}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p>${item.url ? `<a class="text-link" href="${escapeHtml(item.url)}">Voir</a>` : ''}</div>
            </article>
          `).join('')}
        </div>
      </section>
    `).join('') || '<p class="empty-state">Les partenaires seront bientôt publiés.</p>';
  }

  async function renderGallery() {
    const grid = document.querySelector('[data-gallery]');
    const filters = document.querySelector('[data-gallery-filters]');
    if (!grid) return;
    const data = await fetchData('gallery');
    const albums = data.albums || [];
    const categories = ['Tous', ...Array.from(new Set(albums.map((album) => album.category).filter(Boolean)))];
    const render = (category = 'Tous') => {
      const visible = category === 'Tous' ? albums : albums.filter((album) => album.category === category);
      grid.innerHTML = visible.map((album, index) => {
        const photos = album.photos || [];
        const cover = album.cover || photos[0]?.image || '';
        return `
          <article class="gallery-album is-visible" data-reveal>
            <button type="button" class="gallery-cover" data-gallery-open="${index}"${imageStyle(cover)} aria-label="Ouvrir ${escapeHtml(album.title)}">
              <span>${icon('gallery')} ${escapeHtml(album.category || 'Album')}</span>
              <strong>${photos.length} photo${photos.length > 1 ? 's' : ''}</strong>
            </button>
            <div class="gallery-info">
              <span>${escapeHtml(formatDate(album.date))}</span>
              <h3>${escapeHtml(album.title)}</h3>
              <p>${escapeHtml(album.description)}</p>
            </div>
          </article>
        `;
      }).join('') || '<p class="empty-state">Les albums seront bientôt publiés.</p>';
      bindGalleryOpen(visible);
    };
    if (filters) {
      filters.innerHTML = categories.map((cat, idx) => `<button type="button" class="${idx === 0 ? 'is-active' : ''}" data-gallery-filter="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`).join('');
      filters.addEventListener('click', (event) => {
        const button = event.target.closest('[data-gallery-filter]');
        if (!button) return;
        filters.querySelectorAll('button').forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
        render(button.dataset.galleryFilter);
      });
    }
    render();
  }

  function bindGalleryOpen(albums) {
    const lightbox = document.querySelector('[data-lightbox]');
    if (!lightbox) return;
    const img = lightbox.querySelector('img');
    const caption = lightbox.querySelector('p');
    document.querySelectorAll('[data-gallery-open]').forEach((button) => {
      button.addEventListener('click', () => {
        const album = albums[Number(button.dataset.galleryOpen)];
        const photo = (album.photos || []).find((item) => item.image) || { image: album.cover, alt: album.title };
        if (!photo.image) return;
        img.src = photo.image;
        img.alt = photo.alt || album.title || '';
        caption.textContent = photo.alt || album.description || album.title || '';
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
      });
    });
    lightbox.querySelector('[data-lightbox-close]')?.addEventListener('click', () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      img.removeAttribute('src');
    });
  }

  async function renderFooter() {
    const footer = document.querySelector('[data-footer]');
    if (!footer) return;
    const data = await fetchData('settings');
    footer.innerHTML = `
      <div class="page-shell footer-pro">
        <div class="footer-brand"><img src="./assets/logo-rcc.png" alt="RC Cubzaguais" /><div><strong>${escapeHtml(data.clubName || 'Racing Club Cubzaguais')}</strong><span>Respect · Solidarité · Engagement</span></div></div>
        <div class="footer-columns">
          <section><h3>Club</h3><p>${icon('address')} ${escapeHtml(data.address || data.stadium || '')}</p><p>${icon('place')} ${escapeHtml(data.stadium || '')}</p></section>
          <section><h3>Contact</h3><p>${icon('contact')} <a href="mailto:${escapeHtml(data.email || 'lerccdemain@gmail.com')}">${escapeHtml(data.email || 'lerccdemain@gmail.com')}</a></p><p>${icon('time')} ${escapeHtml(data.phone || 'Téléphone à renseigner')}</p></section>
          <section><h3>Liens rapides</h3><a href="./matchs.html">Matchs</a><a href="./galerie.html">Galerie</a><a href="./nous-rejoindre.html">Nous rejoindre</a><a href="/cms-login">Administration</a></section>
          <section><h3>Réseaux</h3><a href="${escapeHtml(data.facebook || '#')}"${data.facebook ? '' : ' aria-disabled="true"'}>Facebook</a><a href="${escapeHtml(data.instagram || '#')}"${data.instagram ? '' : ' aria-disabled="true"'}>Instagram</a><a href="${escapeHtml(data.ffrUrl || 'https://www.ffr.fr/')}" target="_blank" rel="noreferrer">FFR</a></section>
        </div>
        <div class="footer-bottom"><span>Site propulsé par GitHub + Cloudflare Pages</span><a href="./index.html#accueil">Retour en haut</a></div>
      </div>
    `;
  }

  async function renderProject() {
    const sectionGrid = document.querySelector('[data-project-sections]');
    if (!sectionGrid) return;
    const data = await fetchData('project');
    const title = document.querySelector('[data-project-title]');
    const heroIntro = document.querySelector('[data-project-intro]');
    const fullIntro = document.querySelector('[data-project-full-intro]');
    const callout = document.querySelector('[data-project-callout]');
    const email = document.querySelector('[data-project-email]');
    if (title) title.textContent = data.title || title.textContent;
    if (heroIntro) heroIntro.textContent = data.callout || heroIntro.textContent;
    if (fullIntro) fullIntro.textContent = data.intro || '';
    if (callout) callout.textContent = data.callout || '';
    if (email && data.contactEmail) email.setAttribute('href', 'mailto:' + data.contactEmail);
    sectionGrid.innerHTML = (data.sections || []).map((item) => `
      <article class="project-card">
        <span>${escapeHtml(item.icon || 'RCC')}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </article>
    `).join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderMatches().catch(console.error);
    renderNews().catch(console.error);
    renderSettings().catch(console.error);
    renderSenior().catch(console.error);
    renderCategories('academy', 'École de rugby').catch(console.error);
    renderCategories('youth', 'Pôle jeunes').catch(console.error);
    renderCategories('feminines', 'Féminines').catch(console.error);
    renderPartners().catch(console.error);
    renderProject().catch(console.error);
    renderImportantNews().catch(console.error);
    renderGallery().catch(console.error);
    renderFooter().catch(console.error);
  });
})();
