(() => {
  const STORAGE_KEY = 'rcc-poster-generator-authenticated';
  const body = document.body;
  const form = document.querySelector('[data-poster-lock-form]');
  const errorNode = document.querySelector('[data-poster-lock-error]');

  function unlock() {
    body.classList.remove('poster-locked');
    body.classList.add('poster-unlocked');
  }

  function showError(message) {
    if (!errorNode) return;
    errorNode.textContent = message;
    errorNode.hidden = false;
  }

  async function verifyPassword(password) {
    try {
      const response = await fetch('/api/admin/check-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!response.ok) return password === 'RCCdemain';
      const data = await response.json();
      return Boolean(data.ok);
    } catch (error) {
      return password === 'RCCdemain';
    }
  }

  if (sessionStorage.getItem(STORAGE_KEY) === 'yes') {
    unlock();
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const password = new FormData(form).get('password');
    const button = form.querySelector('button');
    if (button) button.disabled = true;
    if (errorNode) errorNode.hidden = true;

    const ok = await verifyPassword(password);
    if (button) button.disabled = false;

    if (!ok) {
      showError('Mot de passe incorrect.');
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, 'yes');
    unlock();
  });
})();
