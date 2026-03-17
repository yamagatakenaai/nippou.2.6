const CACHE_NAME = 'nippou-pwa-v1';
const urlsToCache = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // GASへのPOSTリクエストはキャッシュしないよう除外
  if (event.request.method === 'POST') {
    return;
  }

  // ネットワーク優先のキャッシュ戦略 (データが古くなるのを防ぐため)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // レスポンスが正常な場合はキャッシュを更新して返す
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});
