(function () {
  const escapeHtml = (value = '') => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
  };

  const parseMatchDate = (match) => {
    const rawDate = match.date || '';
    const rawTime = String(match.time || '00h00').replace('h', ':');
    const safeTime = rawTime.includes(':') ? rawTime : rawTime + ':00';
    const date = new Date(rawDate + 'T' + safeTime.padEnd(5, '0') + ':00');
    return Number.isNaN(date.getTime()) ? new Date(rawDate + 'T00:00:00') : date;
  };

  async function loadMatches() {
    const response = await fetch('./data/matches.json?v=' + Date.now(), { cache: 'no-store' });
    const data = await response.json();
    return Array.isArray(data) ? data : (data.matches || []);
  }

  function matchArticle(match, index) {
    const status = match.status || 'muted';
    const result = match.result || (status === 'upcoming' ? 'À venir' : 'Résultat');
    return '<article class="match ' + (index === 0 ? 'highlighted' : '') + '">' +
      '<div class="match-date"><span>' + escapeHtml(formatDate(match.date)) + '</span><strong>' + escapeHtml(match.time) + '</strong></div>' +
      '<div class="teams"><strong>' + escapeHtml(match.home) + '</strong><span>vs</span><b>' + escapeHtml(match.away) + '</b></div>' +
      '<div class="venue">' + escapeHtml(match.venue) + '</div>' +
      '<div class="competition">' + escapeHtml(match.competition) + '</div>' +
      '<div class="badge ' + escapeHtml(status) + '">' + escapeHtml(result) + '</div>' +
    '</article>';
  }

  function resultClass(match) {
    const status = String(match.status || '').toLowerCase();
    const result = String(match.result || '').toLowerCase();
    if (status === 'win' || result.includes('victoire')) return 'win';
    if (status === 'loss' || result.includes('défaite') || result.includes('defaite')) return 'loss';
    return 'muted';
  }

  function updateCountdown(date, node) {
    if (!node) return;
    const diff = Math.max(0, date.getTime() - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    node.innerHTML = '<strong>' + days + '</strong><small>jours</small><strong>' + hours + '</strong><small>heures</small><strong>' + minutes + '</strong><small>min</small>';
  }

  async function renderHomePreview() {
    const nextCard = document.querySelector('[data-next-match]');
    const lastCard = document.querySelector('[data-last-match]');
    if (!nextCard && !lastCard) return;
    const matches = await loadMatches();
    const now = new Date();
    const upcoming = matches.filter((match) => parseMatchDate(match) >= now || (match.status || '') === 'upcoming').sort((a, b) => parseMatchDate(a) - parseMatchDate(b));
    const played = matches.filter((match) => parseMatchDate(match) < now && (match.status || '') !== 'upcoming').sort((a, b) => parseMatchDate(b) - parseMatchDate(a));
    const next = upcoming[0];
    if (next && nextCard) {
      const nextDate = parseMatchDate(next);
      nextCard.innerHTML = '<span>Prochain match</span><h3>' + escapeHtml(next.home) + ' <em>vs</em> ' + escapeHtml(next.away) + '</h3><p>' + escapeHtml(formatDate(next.date)) + ' · ' + escapeHtml(next.time) + ' · ' + escapeHtml(next.venue) + '</p><div class="countdown-units" data-countdown></div>';
      const countdown = nextCard.querySelector('[data-countdown]');
      updateCountdown(nextDate, countdown);
      setInterval(() => updateCountdown(nextDate, countdown), 60000);
    } else if (nextCard) {
      nextCard.innerHTML = '<span>Prochain match</span><h3>Aucun match prévu</h3><p>Ajoutez un match à venir depuis Pages CMS.</p>';
    }
    const last = played[0];
    if (last && lastCard) {
      const lastStatus = resultClass(last);
      lastCard.innerHTML = '<span>Dernier résultat</span><h3>' + escapeHtml(last.home) + ' <em>vs</em> ' + escapeHtml(last.away) + '</h3><div class="last-score-badge ' + lastStatus + '">' + escapeHtml(last.result || 'Résultat à renseigner') + '</div><p>' + escapeHtml(formatDate(last.date)) + ' · ' + escapeHtml(last.venue) + '</p>';
    } else if (lastCard) {
      lastCard.innerHTML = '<span>Dernier résultat</span><h3>Aucun résultat</h3><p>Ajoutez un résultat depuis Pages CMS.</p>';
    }
  }

  async function renderAllMatches() {
    const container = document.querySelector('[data-all-matches]');
    if (!container) return;
    const matches = await loadMatches();
    const sorted = matches.sort((a, b) => parseMatchDate(b) - parseMatchDate(a));
    container.innerHTML = sorted.length ? sorted.map((match, index) => matchArticle(match, index)).join('') : '<p>Aucun match publié pour le moment.</p>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHomePreview().catch(console.error);
    renderAllMatches().catch(console.error);
  });
})();
