import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';

const worker = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
const mp3Helper = await readFile(new URL('../dist/narration-mp3.js', import.meta.url), 'utf8');
function loadWorker(context) {
  context.importScripts = path => {
    assert.equal(path, './narration-mp3.js?v=1');
    vm.runInContext(mp3Helper, context);
  };
  vm.runInContext(worker, context);
}
const context = vm.createContext({ self: { location: { href: 'https://game.example/sw.js' }, addEventListener() {} }, URL, Request, Response, Headers });
loadWorker(context);
const serve = range => context.serveRange(new Request('https://game.example/test.mp3', { headers: { Range: range } }), new Response('0123456789', { headers: { 'Content-Type': 'audio/mpeg' } }));

test('Offline audio handles bounded, open-ended and suffix requests from mobile browsers', async () => {
  for (const [range, expected, header] of [['bytes=2-5', '2345', 'bytes 2-5/10'], ['bytes=7-', '789', 'bytes 7-9/10'], ['bytes=-3', '789', 'bytes 7-9/10'], ['bytes=8-999', '89', 'bytes 8-9/10']]) {
    const result = await serve(range);
    assert.equal(result.status, 206);
    assert.equal(result.headers.get('content-range'), header);
    assert.equal(result.headers.get('content-type'), 'audio/mpeg');
    assert.equal(await result.text(), expected);
  }
});

test('Invalid audio ranges return no misleading audio data', async () => {
  for (const range of ['bytes=50-', 'bytes=9-2', 'bytes=-0']) {
    const result = await serve(range);
    assert.equal(result.status, 416);
    assert.equal(result.headers.get('content-range'), 'bytes */10');
  }
});

test('A navigation can open the saved game when a connection stops responding', async () => {
  let onTimeout, timedOut, signal;
  const scenario = vm.createContext({
    self: { location: { href: 'https://game.example/sw.js' }, addEventListener() {} },
    URL, Request, Response, Headers, AbortController,
    fetch: (_request, options) => { signal = options.signal; return new Promise(() => {}); },
    setTimeout(callback, delay) { assert.ok(delay < 5000); onTimeout = callback; return 7; },
    clearTimeout(id) { timedOut = id; },
    caches: { open: async () => ({ match: async url => new Response(new URL(url).pathname) }) },
  });
  loadWorker(scenario);
  const navigation = scenario.navigationResponse(new Request('https://game.example/'));
  onTimeout();
  assert.equal(await (await navigation).text(), '/index.html');
  assert.equal(signal.aborted, true);
  assert.equal(timedOut, 7);
});

async function offlineFixture(legacyClip, bytes = 'verified Ava MP3', savedMaster) {
  const base = 'https://game.example/';
  const digest = createHash('sha256').update(bytes).digest('hex');
  const remote = {
    'offline-core.json': JSON.stringify(['./index.html']),
    'offline-audio.json': JSON.stringify({ bytes: bytes.length, recordings: { './assets/audio/sample.mp3': digest } }),
    'index.html': 'home',
    'assets/audio/sample.mp3': bytes,
  };
  const calls = [], listeners = {}, stores = new Map();
  let online = true;
  const fetch = async path => {
    assert.ok(online, 'offline');
    const key = String(path).slice(base.length);
    calls.push(key);
    assert.ok(Object.hasOwn(remote, key), key);
    return new Response(remote[key]);
  };
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async key => stores.delete(key),
    open: async key => {
      if (!stores.has(key)) {
        const files = new Map();
        stores.set(key, {
          match: async request => files.get(request.url || request)?.clone(),
          keys: async () => [...files.keys()].map(url => new Request(url)),
          put: async (path, response) => { files.set(path, response.clone()); },
          addAll: async paths => Promise.all([...paths].map(async path => files.set(path, await fetch(path)))),
        });
      }
      return stores.get(key);
    },
  };
  if (legacyClip) {
    const old = await caches.open('puppy-adventures-2.7.1-pepper');
    await old.put(base + 'assets/audio/sample.mp3', new Response(legacyClip));
  }
  if (savedMaster) {
    const voices = await caches.open('puppy-adventures-recordings-v1');
    const oldHash = createHash('sha256').update(savedMaster).digest('hex');
    await voices.put(base + 'assets/audio/sample.mp3?v=' + oldHash, new Response(savedMaster));
  }
  const context = vm.createContext({
    self: { location: { href: base + 'sw.js' }, skipWaiting() {}, clients: { claim() {} }, addEventListener(type, callback) { listeners[type] = callback; } },
    URL, Request, Response, Headers, Uint8Array, caches, fetch, crypto: webcrypto,
  });
  loadWorker(context);
  async function message(type) {
    let ended, response;
    listeners.message({ data: { type }, ports: [{ postMessage(data) { response = data; } }], waitUntil(promise) { ended = promise; } });
    await ended;
    return response;
  }
  const event = { waitUntil: promise => { event.done = promise; } };
  listeners.install(event);
  await event.done;
  listeners.activate(event);
  await event.done;
  const request = (range, folder = 'audio') => {
    const req = new Request(base + `assets/${folder}/sample.mp3`, { headers: { Range: range } });
    return context.gameAsset(req, new URL(req.url));
  };
  return { calls, message, request, disconnect() { online = false; } };
}

test('A first visit fetches the shell without downloading the audio pack', async () => {
  const fixture = await offlineFixture();
  assert.ok(fixture.calls.includes('index.html'));
  assert.ok(!fixture.calls.some(path => path.endsWith('.mp3')));
  assert.equal((await fixture.message('offline-status')).count, 0);
  const result = await fixture.request('bytes=0-3');
  assert.equal(await result.text(), 'veri');
  fixture.disconnect();
  assert.equal(await (await fixture.request('bytes=9-')).text(), 'Ava MP3');
});

test('Existing offline recordings remain usable across the update and a stale clip is replaced', async () => {
  const matching = await offlineFixture('verified Ava MP3');
  matching.disconnect();
  assert.equal(await (await matching.request('bytes=9-')).text(), 'Ava MP3');
  const stale = await offlineFixture('old recording');
  assert.equal(await (await stale.request('bytes=9-')).text(), 'Ava MP3');
  assert.equal(stale.calls.filter(x => x.endsWith('.mp3')).length, 1);
});

test('Downloading the offline pack restores playback before the clip has been played', async () => {
  const fixture = await offlineFixture();
  const outcome = await fixture.message('offline-download');
  assert.equal(outcome.count, outcome.total);
  assert.equal(outcome.incomplete, false);
  fixture.disconnect();
  assert.equal(await (await fixture.request('bytes=9-')).text(), 'Ava MP3');
});

test('A device with a downloaded word gets its corrected take during upgrade', async () => {
  const fixture = await offlineFixture(null, 'corrected recording', 'missed consonant');
  fixture.disconnect();
  assert.equal((await fixture.message('offline-status')).count, 1);
  assert.equal(await (await fixture.request('bytes=0-')).text(), 'corrected recording');
});

test('Installed Hebrew and English voices have a silent lead-in and retain every sound frame offline', async () => {
  for (const [key, frameBytes, firstSoundFrame] of [['en-mouse', 144, 0], ['he-octopus', 192, 45 + 192]]) {
    const master = await readFile(new URL(`../dist/assets/audio/${key}.mp3`, import.meta.url));
    const fixture = await offlineFixture(master, master);
    fixture.disconnect();
    const response = await fixture.request('bytes=0-', 'voice');
    assert.equal(response.status, 206);
    const audio = Buffer.from(await response.arrayBuffer());
    const lead = 8 * frameBytes;
    for (let offset = 0; offset < lead; offset += frameBytes) {
      assert.deepEqual(audio.subarray(offset, offset + 4), master.subarray(firstSoundFrame, firstSoundFrame + 4));
      assert.ok(audio.subarray(offset + 4, offset + frameBytes).every(byte => byte === 0));
    }
    assert.deepEqual(audio.subarray(lead), master.subarray(firstSoundFrame));
    const boundary = await fixture.request(`bytes=${lead - 2}-${lead + 3}`, 'voice');
    assert.equal(boundary.headers.get('content-range'), `bytes ${lead - 2}-${lead + 3}/${audio.length}`);
    assert.deepEqual(Buffer.from(await boundary.arrayBuffer()), audio.subarray(lead - 2, lead + 4));
  }
});
