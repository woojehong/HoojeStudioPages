const HOOJE_CACHE_PREFIX = 'hooje-studio-';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(name => name.startsWith(HOOJE_CACHE_PREFIX))
        .map(name => caches.delete(name))
    );
    await self.clients.claim();
  })());
});
