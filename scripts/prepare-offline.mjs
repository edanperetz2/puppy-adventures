import { readdir, readFile, writeFile } from 'node:fs/promises';
import { CLIPS } from '../dist/content.js';

const root = new URL('../dist/', import.meta.url);
const files = await readdir(root);
const assets = await readdir(new URL('assets/', root));
const shell = files.filter(file => /\.(html|js|css|webmanifest)$/.test(file) && file !== 'sw.js').map(file => `./${file}`);
const staticAssets = assets.filter(file => /\.(svg|png|jpe?g|webp|ttf|woff2|txt)$/.test(file)).map(file => `./assets/${file}`);
const voiceRuntime = (await readdir(new URL('voice-runtime/', root))).filter(file => /\.(json|mjs)$/.test(file)).map(file => `./voice-runtime/${file}`);
// Versioned scripts and styles bypass older caches online. Cache their exact
// URLs too so an installed copy can use the same assets offline.
const html = await readFile(new URL('index.html', root), 'utf8');
const entries = [
  ...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g),
  ...html.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["']/g),
].map(match => match[1]);
const manifest = [...new Set(['./', ...shell, ...entries, ...voiceRuntime, ...staticAssets, ...Object.keys(CLIPS).map(key => `./assets/audio/${key}.mp3`)])];
for (const url of manifest) {
  if (!url.split('?')[0].endsWith('.js')) continue;
  const module = await readFile(new URL(url, root), 'utf8');
  for (const match of module.matchAll(/\bfrom\s+["'](\.\/[^"']+\?[^"']+)["']|\bnew URL\(\s*["'](\.\/[^"']+)["']\s*,\s*import\.meta\.url\s*\)/g)) {
    const path = match[1] || match[2];
    if (!manifest.includes(path)) manifest.push(path);
  }
}
await writeFile(new URL('offline.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Offline asset list: ${manifest.length} files.`);
