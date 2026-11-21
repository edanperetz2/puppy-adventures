import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../dist/narration-mp3.js';
import { CLIPS } from '../dist/content.js';

const release = process.argv.includes('--release');
const root = fileURLToPath(new URL(release ? '../site/' : '../dist/', import.meta.url));
const { onsets = {} } = JSON.parse(await readFile(path.join(root, 'offline-audio.json'), 'utf8'));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json' };

http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const voice = !release && /^\/assets\/voice\/([a-z0-9-]+)\.mp3$/.exec(pathname);
    if (voice && !Object.hasOwn(CLIPS, voice[1])) throw new Error('Unknown narration');
    const route = voice ? `/assets/audio/${voice[1]}.mp3` : pathname;
    const file = path.resolve(root, `.${route === '/' ? '/index.html' : route}`);
    if (!file.startsWith(root) || !(await stat(file)).isFile()) throw new Error('Not found');
    const source = await readFile(file);
    const data = voice ? globalThis.prepareNarrationMp3(source, onsets[voice[1]]) : source;
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}).listen(port, '0.0.0.0', () => console.log(`Puppy Adventures: http://localhost:${port}`));
