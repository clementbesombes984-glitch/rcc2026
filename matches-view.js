(function () {
  const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  const RCC_NAMES = ['rcc', 'rc cubzaguais', 'rugby club cubzaguais'];

  const FILTERS = [
    ['all', 'Tous'],
    ['match', 'Matchs'],
    ['tournoi', 'Tournois'],
    ['entrainement', 'Entrainements'],
    ['seniors', 'Seniors'],
    ['ecole', 'Ecole de rugby'],
    ['jeunes', 'Pole jeunes'],
    ['cadettes', 'Cadettes'],
    ['u6', 'U6'],
    ['u8', 'U8'],
    ['u10', 'U10'],
    ['u12', 'U12'],
    ['u14', 'U14'],
    ['u16', 'U16'],
    ['u19', 'U19']
  ];

  const TYPE_LABELS = {
    match: 'Match',
    tournoi: 'Tournoi',
    entrainement: 'Entrainement',
    reunion: 'Reunion',
    evenement_club: 'Evenement club'
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
  };

  const monthLabel = (date) => date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();

  const normalizeTime = (value) => {
    const raw = String(value || '00:00').trim().replace('H', 'h').replace('h', ':');
    if (!raw) return '00:00';
    if (raw.includes(':')) {
      const [hours = '00', minutes = '00'] = raw.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padEnd(2, '0').slice(0, 2)}`;
    }
    return `${raw.padStart(2, '0')}:00`;
  };

  const parseEventDate = (event) => {
    const date = new Date(`${event.date || ''}T${normalizeTime(event.time)}:00`);
    if (!Number.isNaN(date.getTime())) return date;
    const fallback = new Date(`${event.date || ''}T00:00:00`);
    return Number.isNaN(fallback.getTime()) ? new Date(0) : fallback;
  };

  const isRccName = (value) => RCC_NAMES.includes(String(value || '').trim().toLowerCase());
  const asList = (value) => Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);

  function filterKey(value) {
    const key = String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (key === 'ecole de rugby') return 'ecole';
    if (key === 'pole jeunes') return 'jeunes';
    if (key === 'feminines' || key === 'feminine' || key === 'feminines' || key === 'cadette') return 'cadettes';
    if (key === 'seniors' || key === 'senior') return 'seniors';
    if (key === 'entrainement' || key === 'entrainements' || key === 'training') return 'entrainement';
    if (key === 'reunion') return 'reunion';
    if (key === 'evenement' || key === 'evenement club' || key === 'event') return 'evenement_club';
    return key.replace(/\s+/g, '-');
  }

  function normalizeType(value) {
    const key = filterKey(value || '');
    if (key === 'tournoi') return 'tournoi';
    if (key === 'entrainement') return 'entrainement';
    if (key === 'reunion') return 'reunion';
    if (key === 'evenement_club') return 'evenement_club';
    return 'match';
  }

  function normalizeEvent(item) {
    const rawType = item.type_evenement || item.eventType || item.type || (item.title && !item.away && !item.opponent ? 'tournoi' : 'match');
    const type = normalizeType(rawType);
    const isTournament = type === 'tournoi';
    const selectedTeams = asList(item.teams);
    const fallbackTeam = item.team || item.category || item.categorie || (isTournament ? 'Ecole de rugby' : 'Seniors');
    const teams = selectedTeams.length ? selectedTeams : asList(fallbackTeam);
    const team = teams.join(', ');
    const oldHomeTeam = typeof item.home === 'string' ? item.home : '';
    const oldAwayTeam = item.away || '';
    const isHome = typeof item.home === 'boolean' ? item.home : (oldHomeTeam ? isRccName(oldHomeTeam) : true);
    const opponent = item.opponent || oldAwayTeam || (oldHomeTeam && !isRccName(oldHomeTeam) ? oldHomeTeam : '');
    const title = isTournament
      ? (item.title || item.tournamentName || item.nom_tournoi || `Tournoi ${team}`)
      : type === 'match'
        ? (item.title || `${isHome ? 'RCC' : (opponent || 'Adversaire')} vs ${isHome ? (opponent || 'Adversaire') : 'RCC'}`)
        : (item.title || TYPE_LABELS[type] || 'Rendez-vous RCC');

    return {
      raw: item,
      type,
      title,
      team,
      opponent,
      date: item.date || '',
      time: item.time || '',
      location: item.location || item.venue || item.lieu || '',
      address: item.address || item.adresse || '',
      competition: item.competition || item.statut || '',
      status: item.status || 'upcoming',
      result: item.result || '',
      description: item.description || '',
      isHome,
      teams,
      audience: Array.isArray(item.audience) ? item.audience : [],
      category: filterKey(item.category || teams[0] || team)
    };
  }

  async function loadEvents() {
    try {
      const response = await fetch('./data/matches.json?v=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return [];
      const data = await response.json();
      const events = Array.isArray(data) ? data : (data.matches || []);
      return events.map(normalizeEvent);
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  function resultClass(event) {
    const status = String(event.status || '').toLowerCase();
    const result = String(event.result || '').toLowerCase();
    if (status === 'win' || result.includes('victoire')) return 'win';
    if (status === 'loss' || result.includes('defaite')) return 'loss';
    return 'muted';
  }

  function eventKeys(event) {
    const values = [event.type, event.category, event.team, ...(event.teams || []), ...event.audience].map(filterKey);
    if (values.some((value) => ['u6', 'u8', 'u10', 'u12', 'u14'].includes(value))) values.push('ecole');
    if (values.some((value) => ['u14', 'u16', 'u18', 'u19'].includes(value))) values.push('jeunes');
    if (values.includes('cadettes')) values.push('cadettes');
    return new Set(values);
  }

  function eventMatchesFilter(event, filter) {
    if (filter === 'all') return true;
    return eventKeys(event).has(filter);
  }

  function typeLabel(event) {
    return TYPE_LABELS[event.type] || 'Evenement';
  }

  function eventMainLine(event) {
    if (event.type === 'tournoi') return event.title;
    if (event.type !== 'match') return event.title || typeLabel(event);
    return event.title || `RCC vs ${event.opponent || 'Adversaire'}`;
  }

  function eventMeta(event) {
    return [event.time, event.location, event.address].filter(Boolean).join(' · ');
  }

  function eventCard(event, isNext) {
    const statusClass = resultClass(event);
    const statusBadge = event.result
      ? `<span class="calendar-result ${statusClass}">${escapeHtml(event.result)}</span>`
      : `<span class="calendar-badge ${event.status === 'upcoming' ? 'upcoming' : 'muted'}">${event.status === 'upcoming' ? 'A venir' : 'Info'}</span>`;

    return `
      <article class="calendar-card ${isNext ? 'is-next' : ''}">
        <div class="calendar-date">
          <span>${escapeHtml(formatDate(event.date))}</span>
          <strong>${escapeHtml(event.time || '--')}</strong>
        </div>
        <div class="calendar-main">
          <div class="calendar-badges">
            <span class="calendar-badge ${event.type}">${typeLabel(event)}</span>
            ${event.teams.map((team) => `<span class="calendar-badge">${escapeHtml(team)}</span>`).join('')}
            ${event.type === 'match' ? `<span class="calendar-badge">${event.isHome ? 'Domicile' : 'Exterieur'}</span>` : ''}
          </div>
          <h2>${escapeHtml(eventMainLine(event))}</h2>
          <p>${escapeHtml(eventMeta(event))}</p>
          ${event.description ? `<p class="calendar-description">${escapeHtml(event.description)}</p>` : ''}
        </div>
        <div class="calendar-side">${statusBadge}</div>
      </article>
    `;
  }

  function updateCountdown(date, node) {
    if (!node) return;
    const safeDiff = Math.max(0, date.getTime() - Date.now());
    const days = Math.floor(safeDiff / 86400000);
    const hours = Math.floor((safeDiff % 86400000) / 3600000);
    const minutes = Math.floor((safeDiff % 3600000) / 60000);
    node.innerHTML = '<div class="countdown-unit"><strong>' + days + '</strong><small>jours</small></div><div class="countdown-unit"><strong>' + hours + '</strong><small>heures</small></div><div class="countdown-unit"><strong>' + minutes + '</strong><small>min</small></div>';
  }

  function emptyNextCard(nextCard) {
    nextCard.innerHTML = '<span>Prochain rendez-vous</span><h3>Calendrier a venir</h3><p>Le calendrier de la prochaine saison sera bientot disponible.</p><a class="text-link" href="./nous-rejoindre.html">Contacter le club</a>';
    nextCard.classList.add('is-empty');
  }

  async function renderHomePreview() {
    const nextCard = document.querySelector('[data-next-match]');
    const lastCard = document.querySelector('[data-last-match]');
    if (!nextCard && !lastCard) return;
    const events = await loadEvents();
    const now = new Date();
    const upcoming = events.filter((event) => {
      const status = String(event.status || '').toLowerCase();
      return parseEventDate(event) >= now && status !== 'win' && status !== 'loss';
    }).sort((a, b) => parseEventDate(a) - parseEventDate(b));
    const played = events.filter((event) => event.type === 'match' && (event.status || '') !== 'upcoming' && parseEventDate(event) < now).sort((a, b) => parseEventDate(b) - parseEventDate(a));
    const next = upcoming[0];
    if (next && nextCard) {
      nextCard.classList.remove('is-empty');
      const nextDate = parseEventDate(next);
      const label = next.type === 'tournoi' ? 'Prochain tournoi' : next.type === 'entrainement' ? 'Prochain entrainement' : next.type === 'match' ? 'Prochain match' : 'Prochain rendez-vous';
      nextCard.innerHTML = '<span>' + label + '</span><h3>' + escapeHtml(eventMainLine(next)) + '</h3><p>' + escapeHtml(formatDate(next.date)) + ' · ' + escapeHtml(eventMeta(next)) + '</p><div class="countdown-units" data-countdown></div>';
      const countdown = nextCard.querySelector('[data-countdown]');
      updateCountdown(nextDate, countdown);
      setInterval(() => updateCountdown(nextDate, countdown), 60000);
    } else if (nextCard) {
      emptyNextCard(nextCard);
    }
    const last = played[0];
    if (last && lastCard) {
      const lastStatus = resultClass(last);
      lastCard.innerHTML = '<span>Dernier resultat</span><h3>' + escapeHtml(eventMainLine(last)) + '</h3><div class="last-score-badge ' + lastStatus + '">' + escapeHtml(last.result || 'Resultat a renseigner') + '</div><p>' + escapeHtml(formatDate(last.date)) + ' · ' + escapeHtml(last.location) + '</p>';
    } else if (lastCard) {
      lastCard.innerHTML = '<span>Dernier resultat</span><h3>Saison a lancer</h3><p>Les resultats apparaitront ici des qu ils seront publies.</p>';
    }
  }

  async function renderCalendarPage() {
    const container = document.querySelector('[data-calendar-events]');
    const filters = document.querySelector('[data-calendar-filters]');
    if (!container) return;
    const events = (await loadEvents()).sort((a, b) => parseEventDate(a) - parseEventDate(b));
    const now = new Date();
    const nextEvent = events.find((event) => parseEventDate(event) >= now && !['win', 'loss'].includes(String(event.status || '').toLowerCase()));

    if (filters) {
      filters.innerHTML = FILTERS.map(([value, label], index) => `<button type="button" class="${index === 0 ? 'is-active' : ''}" data-calendar-filter="${value}">${label}</button>`).join('');
      filters.addEventListener('click', (event) => {
        const button = event.target.closest('[data-calendar-filter]');
        if (!button) return;
        filters.querySelectorAll('button').forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
        render(button.dataset.calendarFilter);
      });
    }

    const render = (filter = 'all') => {
      const visible = events.filter((event) => eventMatchesFilter(event, filter));
      if (!visible.length) {
        container.innerHTML = '<p class="empty-state">Aucune date publiee pour ce filtre.</p>';
        return;
      }
      const groups = visible.reduce((acc, event) => {
        const key = monthLabel(parseEventDate(event));
        (acc[key] ||= []).push(event);
        return acc;
      }, {});
      container.innerHTML = Object.entries(groups).map(([month, list]) => `
        <section class="calendar-month">
          <h2>${escapeHtml(month)}</h2>
          <div class="calendar-list">
            ${list.map((event) => eventCard(event, event === nextEvent)).join('')}
          </div>
        </section>
      `).join('');
    };

    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHomePreview().catch(console.error);
    renderCalendarPage().catch(console.error);
  });
})();
