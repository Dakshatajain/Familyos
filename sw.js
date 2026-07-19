const CACHE_NAME = 'family-life-os-v5';

self.addEventListener('install', event => {
  console.log('Service Worker v5 installing');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker v5 activating');

  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.map(key => {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request, { cache: 'no-store' }).catch(() => {
      if (
        request.mode === 'navigate' ||
        request.headers.get('accept')?.includes('text/html')
      ) {
        return new Response(
          '<h1>You are offline</h1><p>Please reconnect and reload the app.</p>',
          {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          }
        );
      }

      return new Response('Offline', { status: 503 });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker v5 loaded');
