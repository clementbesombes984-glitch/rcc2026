const CACHE_VERSION = 'rcc-pwa-v1';
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
  '/nous-rejoindre.html',
  '/contact.html',
  '/styles.css',
  '/script.js',
  '/data-loader.js',
  '/matches-view.js',
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
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  if (url.pathname.startsWith('/cms-login') || url.pathname.startsWith('/admin')) return;
  if (DATA_ASSETS.includes(url.pathname) || url.pathname.startsWith('/data/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(cacheFirst(event.request));
});
