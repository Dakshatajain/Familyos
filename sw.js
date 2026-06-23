const CACHE_NAME = 'family-life-os-v3';
const CORE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', event => {
  console.log('✅ Service Worker installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching core files');
      return Promise.all(
        CORE_FILES.map(file => 
          cache.add(file).catch(err => {
            console.warn(`⚠️ Failed to cache ${file}:`, err);
          })
        )
      );
    }).catch(err => {
      console.error('❌ Cache open failed:', err);
    })
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('🗑️ Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request).catch(() => new Response('', { status: 0 }))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(cached => {
            if (cached) {
              console.log('💾 Serving from cache:', request.url);
              return cached;
            }
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          })
          .catch(err => {
            console.error('❌ Cache match failed:', err);
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker loaded and ready');
