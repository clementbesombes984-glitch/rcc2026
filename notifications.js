(function () {
  const STORAGE_KEY = 'rcc-notification-preferences';
  const SUBSCRIPTION_KEY = 'rcc-push-subscription';
  const SEEN_KEY = 'rcc-notification-seen-items';
  const CHECK_INTERVAL = 60000;
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

  const supportsNotifications = () =>
    'Notification' in window &&
    'serviceWorker' in navigator;

  const supportsPush = () =>
    supportsNotifications() &&
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

  function setDiagnostics(lines) {
    const node = document.querySelector('[data-notification-diagnostics]');
    if (!node) return;
    node.innerHTML = lines.map((line) => `<li>${line}</li>`).join('');
  }

  async function refreshDiagnostics() {
    if (!document.querySelector('[data-notifications-page]')) return;
    const lines = [];
    lines.push('Notifications navigateur : ' + ('Notification' in window ? 'oui' : 'non'));
    lines.push('Service worker : ' + ('serviceWorker' in navigator ? 'oui' : 'non'));
    lines.push('Vrai push serveur : ' + ('PushManager' in window ? 'possible' : 'non supporte ici'));
    lines.push('Autorisation : ' + (('Notification' in window) ? Notification.permission : 'indisponible'));
    lines.push('Notifications RCC : ' + (isEnabled() ? 'activees' : 'desactivees'));
    try {
      const items = await collectNotificationItems();
      const matching = items.filter((item) => matchesPreferences(item.audience));
      lines.push('Contenus notifiables trouves : ' + items.length);
      lines.push('Contenus correspondant a vos choix : ' + matching.length);
    } catch (error) {
      lines.push('Lecture des contenus : erreur');
    }
    setDiagnostics(lines);
  }

  function loadSeenItems() {
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
    } catch (error) {
      return [];
    }
  }

  function saveSeenItems(items) {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(new Set(items)).slice(-250)));
  }

  function isEnabled() {
    try {
      return Boolean(JSON.parse(localStorage.getItem(SUBSCRIPTION_KEY) || '{}').enabled);
    } catch (error) {
      return false;
    }
  }

  function itemAudiences(item, fallback) {
    const audience = Array.isArray(item.audience) ? item.audience : [];
    const extra = [];
    if (item.important) extra.push('important');
    if (fallback) extra.push(fallback);
    return Array.from(new Set([...audience, ...extra, 'general']));
  }

  function matchesPreferences(audiences) {
    const preferences = loadPreferences();
    return audiences.some((key) => preferences[key]);
  }

  function itemId(type, item) {
    return [
      type,
      item.date || '',
      item.time || '',
      item.title || '',
      item.home || '',
      item.away || '',
      item.result || ''
    ].join('|').toLowerCase();
  }

  async function fetchJson(path) {
    const response = await fetch(path + '?v=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) return {};
    return response.json();
  }

  async function showLocalNotification(payload) {
    if (!supportsNotifications() || Notification.permission !== 'granted') return false;
    const options = {
      body: payload.body || 'Nouvelle information du club.',
      icon: '/assets/pwa-icon-192.png',
      badge: '/assets/pwa-icon-192.png',
      tag: payload.tag || 'rcc-local-info',
      data: { url: payload.url || '/', type: payload.type || 'news', audience: payload.audience || [] }
    };

    try {
      const registration = await getRegistration();
      await registration.showNotification(payload.title || 'RC Cubzaguais', options);
      return true;
    } catch (error) {
      try {
        new Notification(payload.title || 'RC Cubzaguais', options);
        return true;
      } catch (fallbackError) {
        return false;
      }
    }
  }

  async function collectNotificationItems() {
    const [newsData, matchesData] = await Promise.all([
      fetchJson('/data/news.json'),
      fetchJson('/data/matches.json')
    ]);
    const news = Array.isArray(newsData) ? newsData : (newsData.news || []);
    const matches = Array.isArray(matchesData) ? matchesData : (matchesData.matches || []);

    return [
      ...news.filter((item) => item.notification).map((item) => {
        const audience = itemAudiences(item, 'general');
        return {
          id: itemId('news', item),
          type: 'news',
          title: item.title || 'Actualite RCC',
          body: item.summary || item.category || 'Nouvelle actualite du club.',
          url: '/actualites.html',
          audience
        };
      }),
      ...matches.filter((item) => item.notification).map((item) => {
        const status = String(item.status || '').toLowerCase();
        const isResult = status === 'win' || status === 'loss' || Boolean(item.result);
        const audience = itemAudiences(item, isResult ? 'resultats' : 'matchs');
        return {
          id: itemId('match', item),
          type: isResult ? 'resultat' : 'match',
          title: (item.home || 'RCC') + ' vs ' + (item.away || 'Adversaire'),
          body: [item.date, item.time, item.venue, item.result].filter(Boolean).join(' - '),
          url: isResult ? '/matchs.html' : '/#matches',
          audience
        };
      })
    ];
  }

  async function markCurrentItemsAsSeen() {
    const items = await collectNotificationItems().catch(() => []);
    saveSeenItems([...loadSeenItems(), ...items.map((item) => item.id)]);
  }

  async function checkForLocalNotifications() {
    if (!isEnabled() || Notification.permission !== 'granted') return;
    const seen = new Set(loadSeenItems());
    const items = await collectNotificationItems().catch(() => []);
    if (!items.length) return;

    if (!seen.size) {
      saveSeenItems(items.map((item) => item.id));
      return;
    }

    const nextSeen = new Set(seen);
    for (const item of items) {
      nextSeen.add(item.id);
      if (seen.has(item.id) || !matchesPreferences(item.audience)) continue;
      await showLocalNotification(item);
    }
    saveSeenItems([...nextSeen]);
  }

  function startLocalWatcher() {
    if (!supportsNotifications()) return;
    checkForLocalNotifications();
    setInterval(checkForLocalNotifications, CHECK_INTERVAL);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) checkForLocalNotifications();
    });
    window.addEventListener('focus', checkForLocalNotifications);
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
    if (!existing) await navigator.serviceWorker.register('/sw.js');
    return navigator.serviceWorker.ready;
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
    if (!supportsNotifications()) {
      setStatus('Ce navigateur ne supporte pas les notifications.', 'error');
      refreshDiagnostics();
      return;
    }

    if (Notification.permission === 'denied') {
      setStatus('Les notifications sont bloquees dans les reglages du navigateur.', 'error');
      refreshDiagnostics();
      return;
    }

    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

    if (permission !== 'granted') {
      setStatus('Notifications refusees. Vous pouvez les reactiver depuis le navigateur.', 'error');
      refreshDiagnostics();
      return;
    }

    const registration = await getRegistration();
    const subscription = supportsPush() ? await getOrCreateSubscription(registration) : null;
    const payload = {
      enabled: true,
      subscribedAt: new Date().toISOString(),
      preferences: loadPreferences(),
      subscription: subscription ? subscription.toJSON() : null,
      endpoint: subscription ? subscription.endpoint : null
    };

    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(payload));
    await markCurrentItemsAsSeen();
    if (subscription) {
      fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);
    }
    setStatus(subscription ? 'Notifications activees pour cet appareil.' : 'Notifications locales activees. Le push en arriere-plan demandera un backend.', 'success');
    checkForLocalNotifications();
    refreshDiagnostics();
  }

  async function disableNotifications() {
    if (supportsPush()) {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration ? await registration.pushManager.getSubscription() : null;
      if (subscription) await subscription.unsubscribe().catch(() => null);
    }
    localStorage.removeItem(SUBSCRIPTION_KEY);
    setStatus('Notifications desactivees sur cet appareil.', 'neutral');
    refreshDiagnostics();
  }

  async function testNotification() {
    if (!isEnabled() || Notification.permission !== 'granted') {
      await enableNotifications();
    }
    if (Notification.permission !== 'granted') return;
    const sent = await showLocalNotification({
      title: 'Notification RCC active',
      body: 'Vous recevrez les alertes correspondant a vos preferences quand l application les detecte.',
      url: '/notifications.html',
      type: 'test',
      audience: ['general']
    });
    setStatus(sent ? 'Notification test envoyee.' : 'Impossible d afficher la notification test sur ce navigateur.', sent ? 'success' : 'error');
    refreshDiagnostics();
  }

  async function notifyMatchingNow() {
    if (!isEnabled() || Notification.permission !== 'granted') {
      await enableNotifications();
    }
    if (Notification.permission !== 'granted') return;
    const items = await collectNotificationItems().catch(() => []);
    const item = items.find((entry) => matchesPreferences(entry.audience));
    if (!item) {
      setStatus('Aucun contenu avec notification active ne correspond a vos preferences.', 'neutral');
      refreshDiagnostics();
      return;
    }
    const sent = await showLocalNotification({ ...item, tag: 'rcc-manual-check-' + Date.now() });
    saveSeenItems([...loadSeenItems(), item.id]);
    setStatus(sent ? 'Verification envoyee depuis le dernier contenu notifiable.' : 'Contenu trouve, mais notification impossible a afficher.', sent ? 'success' : 'error');
    refreshDiagnostics();
  }

  function refreshInitialStatus() {
    if (!supportsNotifications()) {
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
    startLocalWatcher();
    if (document.querySelector('[data-notifications-page]')) {
      renderGroups();
      refreshInitialStatus();
      refreshDiagnostics();
      document.querySelector('[data-enable-notifications]')?.addEventListener('click', enableNotifications);
      document.querySelector('[data-disable-notifications]')?.addEventListener('click', disableNotifications);
      document.querySelector('[data-test-notification]')?.addEventListener('click', testNotification);
      document.querySelector('[data-check-notifications]')?.addEventListener('click', notifyMatchingNow);
    }
  });
})();
