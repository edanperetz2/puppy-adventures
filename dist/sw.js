// Classic workers also support browsers without module service workers.
const CACHE = 'puppy-adventures-shell-2.12.0';
const RECORDINGS = 'puppy-adventures-recordings-v1';
const BASE = new URL('./', self.location.href);
const asset = path => new URL(path, BASE).href;
const latestLegacy = async () => (await caches.keys()).filter(key => /^puppy-adventures-\d/.test(key)).at(-1);
let catalogPromise, legacyPromise, downloading;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(asset('offline-core.json'), { cache: 'no-store' });
    if (!response.ok) throw new Error('Offline asset list unavailable');
    const assets = await response.json();
    const cache = await caches.open(CACHE);
    await cache.addAll(['./offline-core.json', './offline-audio.json', ...assets].map(asset));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([CACHE, RECORDINGS, await latestLegacy()]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('puppy-adventures-') && !keep.has(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
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

function audioCatalog(shell) {
  return catalogPromise ??= shell.match(asset('offline-audio.json')).then(response => response.json());
}

function recordingKey(url, sha) {
  const key = new URL(url);
  key.search = `?v=${sha}`;
  return key.href;
}

async function getRecording(url, sha, shell, recordings) {
  const key = recordingKey(url, sha);
  const cached = await shell.match(url) || await recordings.match(key);
  if (cached) return cached;

  // An earlier installed copy already has full audio responses. Reuse only
  // exact recordings so a changed pronunciation cannot be served from it.
  const legacy = await (legacyPromise ??= latestLegacy().then(name => name ? caches.open(name) : null));
  const previous = await legacy?.match(url);
  if (previous && await rememberRecording(previous, recordings, key, sha)) return previous;

  const response = await fetch(url, { cache: 'no-cache' });
  await rememberRecording(response, recordings, key, sha);
  return response;
}

async function rememberRecording(response, cache, key, sha) {
  if (response.status !== 200) return false;
  const bytes = await response.clone().arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  if (Array.from(digest, n => n.toString(16).padStart(2, '0')).join('') !== sha) return false;
  const headers = new Headers(response.headers);
  headers.delete('Content-Encoding');
  await cache.put(key, new Response(bytes, { headers })).catch(() => {});
  return true;
}

async function gameAsset(request, url) {
  const shell = await caches.open(CACHE);
  const cached = await shell.match(request);
  if (cached) return serveRange(request, cached);
  // On iOS, the first audio request can ask for only a few bytes. Store the
  // full recording once, then answer the requested range on or off network.
  if (url.pathname.endsWith('.mp3') && url.href.startsWith(asset('./assets/audio/'))) {
    const { recordings } = await audioCatalog(shell);
    const sha = recordings[`./${url.href.slice(BASE.href.length)}`];
    if (sha) return serveRange(request, await getRecording(url.href, sha, shell, await caches.open(RECORDINGS)));
  }
  return fetch(request);
}

async function navigationResponse(request) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      fetch(request, { signal: controller.signal }),
      new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('Navigation timed out')); }, 3200);
      }),
    ]);
  } catch {
    const shell = await caches.open(CACHE);
    return await shell.match(asset('index.html')) || Response.error();
  } finally { clearTimeout(timer); }
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(navigationResponse(event.request));
    return;
  }
  event.respondWith(gameAsset(event.request, url).catch(() => Response.error()));
});

async function installRecordings(shell, recordings, missing, report) {
  let finished = 0;
  const workers = Array.from({ length: 6 }, async (_, lane) => {
    for (let i = lane; i < missing.length; i += 6) {
      const [path, sha] = missing[i];
      const response = await getRecording(asset(path), sha, shell, recordings).catch(() => null);
      void response?.body?.cancel().catch(() => {});
      finished++;
      if (finished % 25 === 0) report(finished);
    }
  });
  await Promise.all(workers);
}

self.addEventListener('message', event => {
  const { type } = event.data || {};
  const port = event.ports[0];
  if (!port || !['offline-status', 'offline-download'].includes(type)) return;
  event.waitUntil((async () => {
    const shell = await caches.open(CACHE);
    const voiceCache = await caches.open(RECORDINGS);
    const { bytes, recordings } = await audioCatalog(shell);
    const entries = Object.entries(recordings);
    const missingVoices = async () => {
      const stored = new Set((await Promise.all([shell.keys(), voiceCache.keys()])).flat().map(request => request.url));
      return entries.filter(([path, sha]) => !stored.has(asset(path)) && !stored.has(recordingKey(asset(path), sha)));
    };
    let missing = await missingVoices();
    if (type === 'offline-download' && missing.length) {
      const already = entries.length - missing.length;
      if (!downloading) {
        downloading = installRecordings(shell, voiceCache, missing, count => {
          port.postMessage({ bytes, count: already + count, total: entries.length, busy: true });
        }).finally(() => { downloading = null; });
      }
      await downloading;
      missing = await missingVoices();
    }
    port.postMessage({ bytes, count: entries.length - missing.length, total: entries.length, done: true, incomplete: type === 'offline-download' && missing.length > 0 });
  })().catch(() => port.postMessage({ done: true, error: true })));
});
