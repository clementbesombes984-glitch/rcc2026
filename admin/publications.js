(() => {
  const container = document.querySelector('[data-publication-history]');
  const clearButton = document.querySelector('[data-clear-publication-history]');
  const key = 'rcc_publication_history';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function readHistory() {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      return [];
    }
  }

  function render() {
    if (!container) return;
    const history = readHistory();
    if (!history.length) {
      container.innerHTML = '<p class="poster-help">Aucune publication préparée pour le moment.</p>';
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Titre</th>
            <th>Site</th>
            <th>Facebook</th>
            <th>Instagram</th>
            <th>Push</th>
            <th>Statut</th>
            <th>Erreur</th>
          </tr>
        </thead>
        <tbody>
          ${history.map((item) => `
            <tr>
              <td>${escapeHtml(formatDate(item.date))}</td>
              <td>${escapeHtml(item.type || '')}</td>
              <td>${escapeHtml(item.title || '')}</td>
              <td>${item.site ? 'Oui' : 'Non'}</td>
              <td>${item.facebook ? 'Oui' : 'Non'}</td>
              <td>${item.instagram ? 'Oui' : 'Non'}</td>
              <td>${item.push ? 'Oui' : 'Non'}</td>
              <td>${escapeHtml(item.status || '')}</td>
              <td>${escapeHtml(item.error || '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  clearButton?.addEventListener('click', () => {
    localStorage.removeItem(key);
    render();
  });

  render();
})();
