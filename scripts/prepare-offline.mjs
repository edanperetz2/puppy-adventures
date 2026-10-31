import { readdir, writeFile } from 'node:fs/promises';
import { CLIPS } from '../dist/content.js';

const root = new URL('../dist/', import.meta.url);
const files = await readdir(root);
const assets = await readdir(new URL('assets/', root));
const shell = files.filter(file => /\.(html|js|css|webmanifest)$/.test(file) && file !== 'sw.js').map(file => `./${file}`);
const staticAssets = assets.filter(file => /\.(svg|png|ttf|woff2)$/.test(file)).map(file => `./assets/${file}`);
const manifest = ['./', ...shell, ...staticAssets, ...Object.keys(CLIPS).map(key => `./assets/audio/${key}.mp3`)];
await writeFile(new URL('offline.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Offline asset list: ${manifest.length} files.`);
