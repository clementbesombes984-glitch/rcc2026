(() => {
  const page = document.querySelector('[data-logo-vote-page]');
  if (!page) return;

  const closedNode = page.querySelector('[data-vote-closed]');
  const openNode = page.querySelector('[data-vote-open]');
  const optionsNode = page.querySelector('[data-logo-options]');
  const form = page.querySelector('[data-logo-vote-form]');
  const statusNode = page.querySelector('[data-logo-vote-status]');
  const storageKey = 'rcc-logo-vote-submitted';

  function setStatus(message, type = '') {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.dataset.status = type;
  }

  function showClosed(message) {
    if (closedNode) {
      const title = closedNode.querySelector('h2');
      if (title && message) title.textContent = message;
      closedNode.hidden = false;
    }
    if (openNode) openNode.hidden = true;
  }

  function showOpen() {
    if (closedNode) closedNode.hidden = true;
    if (openNode) openNode.hidden = false;
  }

  function dayStart(value) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function dayEnd(value) {
    if (!value) return null;
    const date = new Date(`${value}T23:59:59`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function voteState(settings = {}) {
    const now = new Date();
    if (!settings.voteEnabled) return { open: false, message: 'Le vote pour le nouveau logo n’est pas encore ouvert.' };
    const start = dayStart(settings.startDate);
    const end = dayEnd(settings.endDate);
    if (start && now < start) return { open: false, message: 'Le vote ouvrira prochainement.' };
    if (end && now > end) return { open: false, message: 'Le vote est terminé. Merci pour votre participation.' };
    return { open: true, message: '' };
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

  function renderLogos(logos) {
    const activeLogos = (Array.isArray(logos) ? logos : [])
      .filter((logo) => logo && logo.active !== false && logo.id)
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    if (!activeLogos.length) {
      optionsNode.innerHTML = '<article class="vote-logo-card"><div class="vote-logo-placeholder">RCC</div><h3>Aucune proposition disponible</h3><p>Le club ajoutera les logos depuis l’administration.</p></article>';
      form?.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');
      return;
    }

    optionsNode.innerHTML = activeLogos.map((logo, index) => {
      const image = logo.image
        ? `<img src="${escapeHtml(logo.image)}" alt="${escapeHtml(logo.title || `Proposition ${index + 1}`)}" loading="lazy" decoding="async" />`
        : '<div class="vote-logo-placeholder">RCC</div>';
      return `
        <label class="vote-logo-card">
          <input type="radio" name="logoId" value="${escapeHtml(logo.id)}" required />
          <span class="vote-logo-select">Sélectionner</span>
          <span class="vote-logo-image">${image}</span>
          <strong>${escapeHtml(logo.title || `Proposition ${index + 1}`)}</strong>
          ${logo.description ? `<small>${escapeHtml(logo.description)}</small>` : ''}
        </label>
      `;
    }).join('');
  }

  async function loadConfig() {
    const response = await fetch('./data/logo-vote.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Configuration indisponible');
    return response.json();
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');
    const submitButton = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      logoId: String(data.get('logoId') || '').trim(),
      consent: data.get('consent') === 'on'
    };

    if (!payload.logoId) {
      setStatus('Sélectionnez une proposition avant de valider.', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus('Enregistrement du vote...', 'pending');

    try {
      const response = await fetch('/api/logo-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (response.status === 409) {
        setStatus('Cette adresse e-mail a déjà été utilisée pour participer au vote.', 'error');
        return;
      }

      if (!response.ok || !result.ok) {
        setStatus(result.error || 'Une erreur est survenue. Merci de réessayer ultérieurement.', 'error');
        return;
      }

      localStorage.setItem(storageKey, 'yes');
      form.reset();
      setStatus('Merci, votre vote a bien été pris en compte.', 'success');
    } catch (error) {
      setStatus('Une erreur est survenue. Merci de réessayer ultérieurement.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  loadConfig()
    .then((config) => {
      const state = voteState(config.settings || {});
      if (!state.open) {
        showClosed(state.message);
        return;
      }
      showOpen();
      renderLogos(config.logos || []);
      if (localStorage.getItem(storageKey) === 'yes') {
        setStatus('Un vote a déjà été enregistré depuis cet appareil. Si besoin, le contrôle final se fait aussi par e-mail.', 'pending');
      }
    })
    .catch(() => {
      showClosed('Le vote n’est pas ouvert actuellement.');
    });
})();
