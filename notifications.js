(function () {
  const STORAGE_KEY = 'rcc-notification-preferences';
  const SUBSCRIPTION_KEY = 'rcc-push-subscription';
  const publicKey = () =>
    window.RCC_PUSH_PUBLIC_KEY ||
    document.querySelector('meta[name="web-push-public-key"]')?.getAttribute('content') ||
    '';

  const groups = [
    {
      title: 'Club',
      items: [
        ['general', 'Actualites generales'],
        ['important', 'Urgent / Important'],
        ['evenements', 'Evenements'],
        ['benevoles', 'Benevoles'],
        ['partenaires', 'Partenaires']
      ]
    },
    {
      title: 'Equipes',
      items: [
        ['seniors', 'Seniors'],
        ['feminines', 'Feminines'],
        ['jeunes', 'Pole jeunes'],
        ['u14', 'U14'],
        ['u16', 'U16'],
        ['u19', 'U19']
      ]
    },
    {
      title: 'Ecole de rugby',
      items: [
        ['ecole', 'Ecole de rugby'],
        ['u6', 'U6'],
        ['u8', 'U8'],
        ['u10', 'U10'],
        ['u12', 'U12']
      ]
    },
    {
      title: 'Matchs et vie sportive',
      items: [
        ['matchs', 'Matchs'],
        ['resultats', 'Resultats'],
        ['entrainements', 'Entrainements']
      ]
    }
  ];

  const defaultPreferences = groups
    .flatMap((group) => group.items.map(([key]) => key))
    .reduce((acc, key) => ({ ...acc, [key]: key === 'general' || key === 'important' }), {});

  const supportsPush = () =>
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  function loadPreferences() {
    try {
      return { ...defaultPreferences, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch (error) {
      return { ...defaultPreferences };
    }
  }

  function savePreferences(preferences) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }

  function setStatus(message, tone) {
    const node = document.querySelector('[data-notification-status]');
    if (!node) return;
    node.textContent = message;
    node.dataset.tone = tone || 'neutral';
  }

  function renderGroups() {
    const root = document.querySelector('[data-notification-groups]');
    if (!root) return;
    const preferences = loadPreferences();

    root.innerHTML = groups.map((group) => `
      <section class="notification-group">
        <h3>${group.title}</h3>
        <div class="notification-switches">
          ${group.items.map(([key, label]) => `
            <label class="notification-switch">
              <input type="checkbox" value="${key}" ${preferences[key] ? 'checked' : ''} />
              <span></span>
              <strong>${label}</strong>
            </label>
          `).join('')}
        </div>
      </section>
    `).join('');

    root.addEventListener('change', (event) => {
      const input = event.target.closest('input[type="checkbox"]');
      if (!input) return;
      const next = loadPreferences();
      next[input.value] = input.checked;
      savePreferences(next);
      setStatus('Preferences enregistrees sur cet appareil.', 'success');
    });
  }

  async function getRegistration() {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) return existing;
    return navigator.serviceWorker.register('/sw.js');
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  }

  async function getOrCreateSubscription(registration) {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const key = publicKey();
    if (!key) return null;

    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key)
    });
  }

  async function enableNotifications() {
    if (!supportsPush()) {
      setStatus('Ce navigateur ne supporte pas les notifications push.', 'error');
      return;
    }

    if (Notification.permission === 'denied') {
      setStatus('Les notifications sont bloquees dans les reglages du navigateur.', 'error');
      return;
    }

    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

    if (permission !== 'granted') {
      setStatus('Notifications refusees. Vous pouvez les reactiver depuis le navigateur.', 'error');
      return;
    }

    const registration = await getRegistration();
    const subscription = await getOrCreateSubscription(registration);
    const payload = {
      enabled: true,
      subscribedAt: new Date().toISOString(),
      preferences: loadPreferences(),
      subscription: subscription ? subscription.toJSON() : null,
      endpoint: subscription ? subscription.endpoint : null
    };

    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(payload));
    if (subscription) {
      fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);
    }
    setStatus(subscription ? 'Notifications activees pour cet appareil.' : 'Autorisation accordee. Abonnement serveur a brancher.', 'success');
  }

  async function disableNotifications() {
    if (supportsPush()) {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration ? await registration.pushManager.getSubscription() : null;
      if (subscription) await subscription.unsubscribe().catch(() => null);
    }
    localStorage.removeItem(SUBSCRIPTION_KEY);
    setStatus('Notifications desactivees sur cet appareil.', 'neutral');
  }

  function refreshInitialStatus() {
    if (!supportsPush()) {
      setStatus('Notifications non supportees par ce navigateur.', 'error');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('Notifications bloquees dans le navigateur.', 'error');
      return;
    }
    if (Notification.permission === 'granted' && localStorage.getItem(SUBSCRIPTION_KEY)) {
      setStatus('Notifications activees pour cet appareil.', 'success');
      return;
    }
    setStatus('Choisissez vos categories puis activez les notifications.', 'neutral');
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('[data-notifications-page]')) return;
    renderGroups();
    refreshInitialStatus();
    document.querySelector('[data-enable-notifications]')?.addEventListener('click', enableNotifications);
    document.querySelector('[data-disable-notifications]')?.addEventListener('click', disableNotifications);
  });
})();
