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

  const slugify = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'article';

  const newsId = (item, index = 0) =>
    item.id || item.slug || slugify(`${item.date || index}-${item.title || 'actualite-rcc'}`);

  const newsUrl = (item, index = 0) => `./actualite.html?id=${encodeURIComponent(newsId(item, index))}`;

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

  async function renderNewsLegacy() {
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

  async function renderNews() {
    const grid = document.querySelector('.news-grid');
    if (!grid) return;

    const data = await fetchData('news');
    const newsletterData = await fetchData('newsletters');
    const news = (Array.isArray(data) ? data : (data.news || []))
      .map((item, index) => ({ ...item, _index: index }))
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return (dateB || 0) - (dateA || 0) || a._index - b._index;
      });

    const renderSimpleCard = (item) => `
      <article>
        ${item.image ? `<div class="news-image"${imageStyle(item.image)}></div>` : ''}
        <span>${escapeHtml(item.category || 'Club')}${item.important ? ' · Important' : ''}</span>
        <h3>${escapeHtml(item.title || 'Actualite RCC')}</h3>
        <p>${escapeHtml(item.summary || item.body || '')}</p>
      </article>
    `;

    if (!grid.classList.contains('news-list')) {
      grid.innerHTML = news.slice(0, 3).map(renderSimpleCard).join('');
      return;
    }

    if (!news.length) {
      grid.innerHTML = `
        <article class="news-empty-journal">
          <span>Journal RCC</span>
          <h3>Aucune actualite publiee</h3>
          <p>Les prochaines nouvelles du club apparaitront ici des leur publication.</p>
        </article>
      `;
      return;
    }

    const filters = [
      { label: 'Toutes', value: 'all' },
      { label: 'Club', value: 'club' },
      { label: 'Seniors', value: 'seniors' },
      { label: 'Ecole de rugby', value: 'ecole' },
      { label: 'Jeunes', value: 'jeunes' },
      { label: 'Cadettes', value: 'cadettes' },
      { label: 'Benevoles', value: 'benevoles' },
      { label: 'Tournois', value: 'tournois' },
      { label: 'Newsletters', value: 'newsletters' }
    ];
    const newsletters = (Array.isArray(newsletterData) ? newsletterData : (newsletterData.newsletters || []))
      .filter((item) => item.published !== false)
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    const normalize = (value) => String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');

    const itemTags = (item) => {
      const tags = new Set([normalize(item.category)]);
      (Array.isArray(item.audience) ? item.audience : []).forEach((tag) => tags.add(normalize(tag)));
      if (tags.has('ecole') || tags.has('ecole-de-rugby')) ['u6', 'u8', 'u10', 'u12', 'u14'].forEach((tag) => tags.add(tag));
      if (['u6', 'u8', 'u10', 'u12', 'u14', 'ecole-de-rugby'].some((tag) => tags.has(tag))) tags.add('ecole');
      if (['u16', 'u18', 'u19', 'pole-jeunes'].some((tag) => tags.has(tag))) tags.add('jeunes');
      if (tags.has('senior')) tags.add('seniors');
      if (tags.has('feminine') || tags.has('feminines') || tags.has('cadette')) tags.add('cadettes');
      if (tags.has('benevole')) tags.add('benevoles');
      if (['tournoi', 'tournois'].some((tag) => tags.has(tag))) tags.add('tournois');
      return tags;
    };

    const featured = news.find((item) => item.featured) || news.find((item) => item.important) || news[0];
    const secondary = news.filter((item) => item !== featured).slice(0, 3);
    const articleMeta = (item) => `
      <div class="journal-meta">
        <span>${escapeHtml(item.category || 'Club')}</span>
        <time>${escapeHtml(item.date ? formatDate(item.date) : 'Publie recemment')}</time>
      </div>
    `;
    const imageBlock = (item, className = 'journal-image') => item.image
      ? `<div class="${className}"${imageStyle(item.image)}></div>`
      : `<div class="${className} journal-image-fallback"><strong>RCC</strong></div>`;
    const renderJournalCard = (item, className = '') => `
      <a class="journal-card-link" href="${escapeHtml(newsUrl(item, item._index))}" aria-label="Lire ${escapeHtml(item.title || 'actualite RCC')}">
      <article class="journal-card ${className}" data-news-item data-news-tags="${escapeHtml([...itemTags(item)].join(' '))}">
        ${imageBlock(item)}
        <div class="journal-card-body">
          ${articleMeta(item)}
          ${item.important ? '<b class="journal-badge">Important</b>' : ''}
          <h3>${escapeHtml(item.title || 'Actualite RCC')}</h3>
          <p>${escapeHtml(item.summary || item.body || '')}</p>
        </div>
      </article>
      </a>
    `;
    const renderNewsletterCard = (item) => `
      <article class="newsletter-card">
        ${item.cover ? `<div class="newsletter-cover"${imageStyle(item.cover)}></div>` : '<div class="newsletter-cover newsletter-cover-fallback"><strong>RCC</strong></div>'}
        <div>
          <span>${escapeHtml(item.date ? formatDate(item.date) : item.period || 'Newsletter')}</span>
          <h3>${escapeHtml(item.title || 'Newsletter RCC')}</h3>
          <p>${escapeHtml(item.description || 'Les informations et actualites du Racing Club Cubzaguais.')}</p>
          ${item.pdf ? `<a class="button ghost newsletter-download" href="${escapeHtml(item.pdf)}" target="_blank" rel="noopener">Telecharger le PDF</a>` : '<em class="newsletter-missing">PDF bientot disponible</em>'}
        </div>
      </article>
    `;

    grid.innerHTML = `
      <div class="journal-filters" data-news-filters>
        ${filters.map((filter, index) => `<button type="button" class="${index === 0 ? 'is-active' : ''}" data-news-filter="${filter.value}">${escapeHtml(filter.label)}</button>`).join('')}
      </div>
      <div class="journal-layout">
        <a class="journal-feature-link" href="${escapeHtml(newsUrl(featured, featured._index))}" aria-label="Lire ${escapeHtml(featured.title || 'actualite RCC')}">
        <article class="journal-feature" data-news-item data-news-tags="${escapeHtml([...itemTags(featured)].join(' '))}">
          ${imageBlock(featured, 'journal-feature-image')}
          <div class="journal-feature-body">
            ${articleMeta(featured)}
            ${featured.important ? '<b class="journal-badge">Important</b>' : ''}
            <h2>${escapeHtml(featured.title || 'Actualite RCC')}</h2>
            <p>${escapeHtml(featured.summary || featured.body || '')}</p>
          </div>
        </article>
        </a>
        <div class="journal-side">
          ${secondary.length ? secondary.map((item) => renderJournalCard(item, 'journal-card-secondary')).join('') : '<article class="journal-card journal-card-secondary"><div class="journal-card-body"><span class="journal-badge">RCC</span><h3>Les prochaines infos arrivent</h3><p>Les nouvelles publiees via Pages CMS alimenteront automatiquement cette page.</p></div></article>'}
        </div>
      </div>
      <div class="journal-grid">
        ${news.map((item) => renderJournalCard(item)).join('')}
      </div>
      <article class="news-empty-journal" data-news-empty hidden>
        <span>Journal RCC</span>
        <h3>Aucune actualite dans cette rubrique</h3>
        <p>Essayez un autre filtre pour afficher les dernieres nouvelles du club.</p>
      </article>
      <section class="newsletter-archive" data-newsletter-archive ${newsletters.length ? '' : 'hidden'}>
        <div class="history-section-head">
          <p class="section-kicker">Archives</p>
          <h2>Newsletters</h2>
        </div>
        <div class="newsletter-grid">
          ${newsletters.length ? newsletters.map(renderNewsletterCard).join('') : '<article class="newsletter-empty"><span>Archives</span><h3>Aucune newsletter publiee</h3><p>Les prochaines editions seront disponibles ici en telechargement.</p></article>'}
        </div>
      </section>
    `;

    const applyFilter = (filter) => {
      let visibleCount = 0;
      const newsletterArchive = grid.querySelector('[data-newsletter-archive]');
      const showNewsletters = filter === 'all' || filter === 'newsletters';
      if (newsletterArchive) newsletterArchive.hidden = filter === 'newsletters' ? false : (!showNewsletters || !newsletters.length);
      grid.querySelector('.journal-layout')?.toggleAttribute('hidden', filter === 'newsletters');
      grid.querySelector('.journal-grid')?.toggleAttribute('hidden', filter === 'newsletters');
      grid.querySelectorAll('[data-news-item]').forEach((item) => {
        const tags = new Set((item.dataset.newsTags || '').split(' ').filter(Boolean));
        const isVisible = filter !== 'newsletters' && (filter === 'all' || tags.has(filter));
        item.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });
      const empty = grid.querySelector('[data-news-empty]');
      if (empty) empty.hidden = visibleCount > 0 || filter === 'newsletters';
    };

    grid.querySelector('[data-news-filters]')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-news-filter]');
      if (!button) return;
      grid.querySelectorAll('[data-news-filter]').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      applyFilter(button.dataset.newsFilter);
    });
  }

  async function renderArticlePage() {
    const shell = document.querySelector('[data-article-page]');
    if (!shell) return;
    const reader = shell.querySelector('.article-reader') || shell;
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id') || '';
    const data = await fetchData('news');
    const news = (Array.isArray(data) ? data : (data.news || [])).map((item, index) => ({ ...item, _index: index }));
    const item = news.find((entry) => newsId(entry, entry._index) === requestedId);

    if (!item) {
      reader.innerHTML = `
        <a class="article-back" href="./actualites.html">Retour aux actualites</a>
        <div class="article-not-found">
          <span>Journal RCC</span>
          <h1>Article introuvable</h1>
          <p>L'actualite demandee n'existe pas ou n'est plus publiee.</p>
          <a class="button primary" href="./actualites.html">Voir les actualites</a>
        </div>
      `;
      return;
    }

    const photos = [
      ...(item.image ? [{ image: item.image, alt: item.title || 'Actualite RCC' }] : []),
      ...(Array.isArray(item.photos) ? item.photos : []),
      ...(Array.isArray(item.gallery) ? item.gallery : [])
    ].filter((photo) => photo && (photo.image || photo.url || typeof photo === 'string'));
    const galleryPhotos = item.image ? photos.slice(1) : photos;
    const body = String(item.body || item.content || item.summary || '').split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
    const permanent = new URL(newsUrl(item, item._index).replace('./', '/'), window.location.origin).href;

    document.title = `${item.title || 'Actualite'} - Racing Club Cubzaguais`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', item.summary || item.body || 'Actualite du Racing Club Cubzaguais.');
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', permanent);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${item.title || 'Actualite'} - Racing Club Cubzaguais`);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', item.summary || 'Actualite du Racing Club Cubzaguais.');
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', permanent);
    if (item.image) document.querySelector('meta[property="og:image"]')?.setAttribute('content', new URL(item.image, window.location.origin).href);

    reader.innerHTML = `
      <a class="article-back" href="./actualites.html">Retour aux actualites</a>
      <header class="article-header">
        <div class="journal-meta">
          <span>${escapeHtml(item.category || 'Club')}</span>
          <time>${escapeHtml(item.date ? formatDate(item.date) : 'Publie recemment')}</time>
        </div>
        <h1>${escapeHtml(item.title || 'Actualite RCC')}</h1>
        ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ''}
        <div class="article-actions">
          <button class="button ghost" type="button" data-copy-article-link>Copier le lien</button>
          <a class="button ghost" href="${escapeHtml(permanent)}">Lien permanent</a>
        </div>
      </header>
      ${item.image ? `<figure class="article-main-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title || 'Actualite RCC')}" loading="eager" /></figure>` : '<div class="article-main-image article-image-fallback"><strong>RCC</strong></div>'}
      <div class="article-body">
        ${body.length ? body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('') : '<p>Le contenu complet sera prochainement disponible.</p>'}
      </div>
      ${galleryPhotos.length ? `<section class="article-gallery"><h2>Photos</h2><div>${galleryPhotos.map((photo) => {
        const src = typeof photo === 'string' ? photo : (photo.image || photo.url);
        const alt = typeof photo === 'string' ? item.title : (photo.alt || item.title || 'Photo RCC');
        return `<a href="${escapeHtml(src)}" target="_blank" rel="noopener"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" /></a>`;
      }).join('')}</div></section>` : ''}
    `;

    reader.querySelector('[data-copy-article-link]')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(permanent);
        reader.querySelector('[data-copy-article-link]').textContent = 'Lien copie';
      } catch (error) {
        window.prompt('Copier le lien', permanent);
      }
    });
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
                <p>${escapeHtml([player.weight, player.tag].filter(Boolean).join(' · '))}</p>
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

  function photoItemUrl(item) {
    return typeof item === 'string' ? item : (item?.image || item?.photo || item?.url || '');
  }

  function photoItemAlt(item, fallback) {
    return typeof item === 'string' ? fallback : (item?.alt || item?.title || fallback);
  }
  async function renderCategories(dataName, kicker) {
    const page = document.querySelector(`[data-category-page="${dataName}"]`);
    if (!page) return;

    const data = await fetchData(dataName);
    const categories = Array.isArray(data) ? data : (data.categories || []);

    page.innerHTML = categories.map((cat, idx) => {
      const staff = (cat.staff || []).filter((person) => person && (person.firstName || person.lastName || person.role || person.photo));
      const photos = (cat.photos || []).map((photo) => ({
        url: photoItemUrl(photo),
        alt: photoItemAlt(photo, `Photo ${cat.age}`)
      })).filter((photo) => photo.url);
      const meta = [cat.count, cat.training, cat.location].filter(Boolean);
      const photosBlock = photos.length ? `
          <div class="team-gallery">
            ${photos.map((photo) => `<figure class="team-gallery-item"${imageStyle(photo.url)}><span>${escapeHtml(photo.alt)}</span></figure>`).join('')}
          </div>
      ` : '';
      const staffBlock = staff.length ? `
          <h3>Staff educateur</h3>
          <div class="staff-grid">
            ${staff.map((person, i) => `
              <article class="staff-card">
                <div class="staff-avatar avatar-${((idx + i) % 6) + 1} cms-avatar"${imageStyle(person.photo)}></div>
                <div>
                  <strong>${escapeHtml(person.firstName)}</strong>
                  <span>${escapeHtml(person.lastName)}</span>
                  <small>${escapeHtml(person.role || `Educateur ${cat.age}`)}</small>
                  ${person.phone || person.email ? `<p class="staff-contact">${escapeHtml([person.phone, person.email].filter(Boolean).join(' - '))}</p>` : ''}
                </div>
              </article>
            `).join('')}
          </div>
      ` : '';
      return `
      <section class="academy-category" id="${escapeHtml(String(cat.age).toLowerCase())}">
        <div class="team-photo photo-${(idx % 4) + 1} cms-team-photo"${imageStyle(cat.teamPhoto)} aria-label="Photo de l'effectif ${escapeHtml(cat.age)}">
          ${teamRows()}
          <strong>${escapeHtml(cat.age)}</strong>
        </div>
        <div class="academy-content">
          <p class="section-kicker">${escapeHtml(kicker)}</p>
          <h2>${escapeHtml(cat.age)} <span>${escapeHtml(cat.label)}</span></h2>
          <p>${escapeHtml(cat.summary)}</p>
          ${meta.length ? `<div class="academy-meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
          ${photosBlock}
          ${staffBlock}
        </div>
      </section>
    `;
    }).join('');
  }
  async function renderPartners() {
    const grid = document.querySelector('[data-partners]');
    if (!grid) return;
    const data = await fetchData('partners');
    const partners = data.partners || [];
    grid.innerHTML = partners.length ? `
      <div class="partner-cards unified-partner-cards">
        ${partners.map((item) => `
          <article class="partner-card">
            <div class="partner-logo"${imageStyle(item.logo)}><strong>${escapeHtml((item.name || 'RCC').slice(0, 2))}</strong></div>
            <div><span>Partenaire RCC</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p>${item.url ? `<a class="text-link" href="${escapeHtml(item.url)}">Voir</a>` : ''}</div>
          </article>
        `).join('')}
      </div>
    ` : '<p class="empty-state">Les partenaires seront bientôt publiés.</p>';
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

  async function renderShop() {
    const grid = document.querySelector('[data-shop-products]');
    const filters = document.querySelector('[data-shop-filters]');
    if (!grid) return;

    const data = await fetchData('shop');
    const products = Array.isArray(data) ? data : (data.products || []);
    const categories = ['Tous', 'Maillots', 'Sweats', 'Polos', 'Shorts', 'Accessoires'];

    if (filters) {
      filters.innerHTML = categories.map((category, index) => `
        <button type="button" class="${index === 0 ? 'is-active' : ''}" data-shop-filter="${escapeHtml(category)}">${escapeHtml(category)}</button>
      `).join('');
    }

    const render = (category = 'Tous') => {
      const visible = category === 'Tous' ? products : products.filter((product) => product.category === category);
      grid.innerHTML = visible.length ? visible.map((product) => `
        <article class="shop-card">
          <div class="shop-image"${imageStyle(product.image)} aria-label="${escapeHtml(product.name || 'Produit RCC')}">
            ${product.badge ? `<span>${escapeHtml(product.badge)}</span>` : ''}
          </div>
          <div class="shop-content">
            <small>${escapeHtml(product.category || 'Boutique')}</small>
            <h2>${escapeHtml(product.name)}</h2>
            <p>${escapeHtml(product.description)}</p>
            <div class="shop-bottom">
              <strong>${escapeHtml(product.price)}</strong>
              ${product.url ? `<a class="button shop-button" href="${escapeHtml(product.url)}" target="_blank" rel="noopener noreferrer">Commander sur Sponsport</a>` : '<span class="shop-unavailable">Lien a renseigner</span>'}
            </div>
          </div>
        </article>
      `).join('') : '<p class="empty-state">Les produits de la boutique seront bientot disponibles.</p>';
    };

    filters?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-shop-filter]');
      if (!button) return;
      filters.querySelectorAll('button').forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      render(button.dataset.shopFilter);
    });

    render();
  }

  async function renderFooter() {
    const footer = document.querySelector('[data-footer]');
    if (!footer) return;
    const data = await fetchData('settings');
    footer.innerHTML = `
      <div class="page-shell footer-pro">
        <div class="footer-brand"><img src="./assets/logo-rcc.png" alt="RC Cubzaguais" loading="lazy" decoding="async" /><div><strong>${escapeHtml(data.clubName || 'Racing Club Cubzaguais')}</strong><span>Respect · Solidarité · Engagement</span></div></div>
        <div class="footer-columns">
          <section><h3>Club</h3><p>${icon('address')} ${escapeHtml(data.address || data.stadium || '')}</p><p>${icon('place')} ${escapeHtml(data.stadium || '')}</p></section>
          <section><h3>Contact</h3><p>${icon('contact')} <a href="mailto:${escapeHtml(data.email || 'lerccdemain@gmail.com')}">${escapeHtml(data.email || 'lerccdemain@gmail.com')}</a></p><p>${icon('time')} ${escapeHtml(data.phone || 'Téléphone à renseigner')}</p></section>
          <section><h3>Liens rapides</h3><a href="./club.html">Le Club</a><a href="./equipes.html">Les Équipes</a><a href="./calendrier.html">Calendrier</a><a href="./actualites.html">Actualités</a><a href="./nous-rejoindre.html">Contact</a></section>
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

  async function renderBureau() {
    const messageNode = document.querySelector('[data-president-message]');
    const membersNode = document.querySelector('[data-bureau-members]');
    if (!messageNode && !membersNode) return;
    const data = await fetchData('bureau');
    const message = data.presidentMessage || {};
    if (messageNode) {
      messageNode.innerHTML = `
        <div class="history-section-head">
          <p class="section-kicker">Présidence</p>
          <h2>Mot du Président</h2>
        </div>
        <article class="president-card">
          ${message.photo ? `<img src="${escapeHtml(message.photo)}" alt="${escapeHtml(message.name || 'Président du RCC')}" loading="lazy" />` : '<div class="president-avatar">RCC</div>'}
          <div>
            <span>${escapeHtml(message.role || 'Président')}</span>
            <h3>${escapeHtml(message.name || 'Président du Racing Club Cubzaguais')}</h3>
            <p>${escapeHtml(message.text || 'Le message du président sera prochainement publié.')}</p>
          </div>
        </article>
      `;
    }
    if (membersNode) {
      const members = (data.members || []).slice().sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
      membersNode.innerHTML = members.length ? members.map((member) => `
        <article class="bureau-card">
          ${member.photo ? `<img src="${escapeHtml(member.photo)}" alt="${escapeHtml(`${member.firstName || ''} ${member.lastName || ''}`.trim())}" loading="lazy" />` : '<div class="bureau-avatar">RCC</div>'}
          <div>
            <span>${escapeHtml(member.commission || 'Bureau')}</span>
            <h3>${escapeHtml(`${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Membre du bureau')}</h3>
            <p>${escapeHtml(member.role || '')}</p>
          </div>
        </article>
      `).join('') : '<p class="empty-state">La composition du bureau sera prochainement publiée.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderArticlePage().catch(console.error);
    renderMatches().catch(console.error);
    renderNews().catch(console.error);
    renderSettings().catch(console.error);
    renderSenior().catch(console.error);
    renderCategories('academy', 'École de rugby').catch(console.error);
    renderCategories('youth', 'Pôle jeunes').catch(console.error);
    renderCategories('feminines', 'Cadettes').catch(console.error);
    renderPartners().catch(console.error);
    renderProject().catch(console.error);
    renderBureau().catch(console.error);
    renderImportantNews().catch(console.error);
    renderGallery().catch(console.error);
    renderShop().catch(console.error);
    renderFooter().catch(console.error);
  });
})();
