const CACHE_VERSION = 'rcc-pwa-v4';
const STATIC_CACHE = CACHE_VERSION + '-static';
const DATA_CACHE = CACHE_VERSION + '-data';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/matchs.html',
  '/senior.html',
  '/ecole.html',
  '/jeunes.html',
  '/feminines.html',
  '/actualites.html',
  '/histoire.html',
  '/partenaires.html',
  '/galerie.html',
  '/rcc-demain.html',
  '/notifications.html',
  '/nous-rejoindre.html',
  '/contact.html',
  '/styles.css',
  '/script.js',
  '/data-loader.js',
  '/matches-view.js',
  '/notifications.js',
  '/manifest.webmanifest',
  '/assets/logo-rcc.png',
  '/assets/pwa-icon-192.png',
  '/assets/pwa-icon-512.png',
  '/assets/pwa-maskable-512.png'
];

const DATA_ASSETS = [
  '/data/matches.json',
  '/data/news.json',
  '/data/senior.json',
  '/data/academy.json',
  '/data/youth.json',
  '/data/feminines.json',
  '/data/partners.json',
  '/data/project.json',
  '/data/gallery.json',
  '/data/settings.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(
          STATIC_ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }

    if (request.destination === 'document' || request.mode === 'navigate') {
      const home = await caches.match('/index.html');
      if (home) return home;
      return new Response('', { status: 503, statusText: 'Offline' });
    }

    if ((request.headers.get('accept') || '').includes('application/json')) {
      return new Response('{}', {
        headers: { 'Content-Type': 'application/json; charset=UTF-8' }
      });
    }

    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/cms-login') || url.pathname.startsWith('/admin')) return;

  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(networkFirst(event.request, STATIC_CACHE, '/index.html'));
    return;
  }

  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.webmanifest')) {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }

  if (DATA_ASSETS.includes(url.pathname) || url.pathname.startsWith('/data/')) {
    event.respondWith(networkFirst(event.request, DATA_CACHE));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

function notificationTarget(data) {
  const type = data && data.type ? String(data.type) : '';
  if (data && data.url) return data.url;
  if (type === 'news' || type === 'actualite') return '/actualites.html';
  if (type === 'match' || type === 'resultat') return '/#matches';
  if (type === 'gallery' || type === 'galerie') return '/galerie.html';
  if (type === 'join' || type === 'contact') return '/nous-rejoindre.html';
  return '/';
}

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      payload = { title: 'RC Cubzaguais', body: event.data.text() };
    }
  }

  const title = payload.title || 'RC Cubzaguais';
  const options = {
    body: payload.body || 'Nouvelle information du club.',
    icon: '/assets/pwa-icon-192.png',
    badge: '/assets/pwa-icon-192.png',
    image: payload.image,
    tag: payload.tag || 'rcc-info',
    data: {
      url: notificationTarget(payload),
      audience: payload.audience || [],
      type: payload.type || 'news'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url === targetUrl) return client.focus();
      }
      return clients.openWindow(targetUrl);
    })
  );
});
