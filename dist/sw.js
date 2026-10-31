// Classic workers also support browsers without module service workers.
const CACHE = 'puppy-adventures-1.6.0';
const BASE = new URL('./', self.location.href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(new URL('offline.json', BASE), { cache: 'no-store' });
    if (!response.ok) throw new Error('Offline asset list unavailable');
    const assets = await response.json();
    const cache = await caches.open(CACHE);
    await cache.addAll(['./offline.json', ...assets].map(url => new URL(url, BASE).href));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('puppy-adventures-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
// Safari requests MP3 byte ranges. Cached recordings must return a real partial
// response, including offline, instead of a 200 response containing the file.
async function serveRange(request, response) {
  const header = request.headers.get('range');
  if (!header || response.status !== 200) return response;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return response;
  const buffer = await response.arrayBuffer();
  const size = buffer.byteLength;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  const headers = new Headers(response.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.delete('Content-Encoding');
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
    headers.set('Content-Range', `bytes */${size}`);
    headers.set('Content-Length', '0');
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(buffer.slice(start, end + 1), { status: 206, headers });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(new URL('index.html', BASE).href)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached ? serveRange(event.request, cached) : fetch(event.request)));
});
