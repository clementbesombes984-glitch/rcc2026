(() => {
  const root = document.querySelector('.logo-vote-admin');
  if (!root) return;

  const totalNode = root.querySelector('[data-result-total]');
  const lastNode = root.querySelector('[data-result-last]');
  const openNode = root.querySelector('[data-result-open]');
  const listNode = root.querySelector('[data-results-list]');
  const statusNode = root.querySelector('[data-results-status]');

  function setStatus(message) {
    if (statusNode) statusNode.textContent = message;
  }

  function formatDate(value) {
    if (!value) return 'Aucun vote';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('fr-FR');
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function renderRows(rows = []) {
    if (!rows.length) {
      listNode.innerHTML = '<p>Aucune proposition configurée.</p>';
      return;
    }
    listNode.innerHTML = rows.map((row, index) => `
      <article class="logo-vote-result-row">
        <span class="logo-vote-rank">${index + 1}</span>
        <div class="logo-vote-result-thumb">${row.image ? `<img src="${escapeHtml(row.image)}" alt="">` : '<strong>RCC</strong>'}</div>
        <div>
          <strong>${escapeHtml(row.title)}</strong>
          <small>${row.active ? 'Proposition active' : 'Proposition désactivée'}</small>
        </div>
        <div class="logo-vote-result-bar"><span style="width:${Math.max(0, Math.min(100, row.percent))}%"></span></div>
        <b>${row.votes} vote${row.votes > 1 ? 's' : ''}</b>
        <em>${row.percent} %</em>
      </article>
    `).join('');
  }

  async function loadResults() {
    setStatus('');
    try {
      const response = await fetch('/api/logo-vote/results', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Résultats indisponibles.');
      totalNode.textContent = data.total;
      lastNode.textContent = formatDate(data.lastVote);
      openNode.textContent = data.voteEnabled ? 'Oui' : 'Non';
      renderRows(data.rows || []);
    } catch (error) {
      listNode.innerHTML = '<p>Impossible de charger les résultats. Vérifiez la configuration Cloudflare.</p>';
    }
  }

  root.querySelector('[data-refresh-results]')?.addEventListener('click', loadResults);
  root.querySelector('[data-reset-results]')?.addEventListener('click', async () => {
    const confirmation = window.prompt('Tapez exactement : REMETTRE A ZERO');
    if (confirmation !== 'REMETTRE A ZERO') {
      setStatus('Remise à zéro annulée.');
      return;
    }
    try {
      const response = await fetch('/api/logo-vote/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', confirm: confirmation })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Erreur');
      setStatus(`${data.deleted} vote(s) supprimé(s).`);
      loadResults();
    } catch (error) {
      setStatus('Impossible de remettre les compteurs à zéro.');
    }
  });

  const loadWhenUnlocked = () => {
    if (document.body.classList.contains('poster-unlocked')) loadResults();
  };

  new MutationObserver(loadWhenUnlocked).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('DOMContentLoaded', loadWhenUnlocked);
  if (document.readyState !== 'loading') loadWhenUnlocked();
})();
