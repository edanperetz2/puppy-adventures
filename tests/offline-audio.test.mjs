import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const context = vm.createContext({ self: { location: { href: 'https://game.example/sw.js' }, addEventListener() {} }, URL, Request, Response, Headers });
vm.runInContext(await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8'), context);
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
