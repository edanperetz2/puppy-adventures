import { readdir, readFile, writeFile } from 'node:fs/promises';
import { CLIPS } from '../dist/content.js';

const root = new URL('../dist/', import.meta.url);
const files = await readdir(root);
const assets = await readdir(new URL('assets/', root));
const shell = files.filter(file => /\.(html|js|css|webmanifest)$/.test(file) && file !== 'sw.js').map(file => `./${file}`);
const staticAssets = assets.filter(file => /\.(svg|png|jpe?g|webp|ttf|woff2|txt)$/.test(file)).map(file => `./assets/${file}`);
// Versioned entry URLs bypass an older worker's cached app.js on an online visit.
// Cache those exact URLs too, so the same installed entry remains usable offline.
const html = await readFile(new URL('index.html', root), 'utf8');
const entries = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(match => match[1]);
const entryModule = await readFile(new URL('app.js', root), 'utf8');
const versionedModules = [...entryModule.matchAll(/\bfrom\s+["'](\.\/[^"']+\?[^"']+)["']/g)].map(match => match[1]);
const manifest = [...new Set(['./', ...shell, ...entries, ...versionedModules, ...staticAssets, ...Object.keys(CLIPS).map(key => `./assets/audio/${key}.mp3`)])];
await writeFile(new URL('offline.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Offline asset list: ${manifest.length} files.`);
