/* Proofsheet service worker. Everything the app needs is cached on install, so it opens and works with no network. */
const VERSION = '__VERSION__';
const CORE = 'proofsheet-core-' + VERSION;
const RUNTIME = 'proofsheet-fonts';
const ASSETS = __ASSETS__;

self.addEventListener('install', e => { e.waitUntil(caches.open(CORE).then(c => c.addAll(ASSETS))); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('proofsheet-core-') && k !== CORE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    /* app files: cache first, network as the fallback; page loads always get the cached shell */
    e.respondWith(caches.open(CORE).then(async c =>
      (await c.match(req, { ignoreSearch: true })) ||
      (req.mode === 'navigate' ? await c.match('./index.html') : undefined) ||
      fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => new Response('Offline', { status: 503 }))));
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    /* fonts: cached after the first online visit, refreshed quietly */
    e.respondWith(caches.open(RUNTIME).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
