import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLIPS } from '../dist/content.js';
import { STORY_CLUE_CLIPS } from '../dist/story-clue-content.js';
import { WORD_FORM_CLIPS } from '../dist/word-form-audio.js';

export const styleLinks = /<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/g;
export const scriptLinks = /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/g;
const starter = ['welcome', 'meet-friends', 'choose-activity', 'try-again', 'correct-1', 'correct-2', 'correct-3', 'complete', 'complete-all',
  'profile-good-luck-ariel', 'pikachu-greeting', ...Object.keys(STORY_CLUE_CLIPS), ...Object.keys(WORD_FORM_CLIPS)];
const archivedAssets = /^(?:game-guide\.png|game-guide-(?:six|ariel)\.webp|rubik-\d+\.ttf)$/;
export const onDemandPictures = ['./assets/theater-stage.webp'];
const narrationFolder = './assets/audio/';

export async function offlineFiles(root, bundle = []) {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const entryUrls = [...html.matchAll(styleLinks), ...html.matchAll(scriptLinks)].map(match => match[1]);
  const explicitlyLoaded = ['./index.html', './manifest.webmanifest', ...entryUrls];
  const sourceModules = bundle.length ? bundle : await findModules(root, entryUrls.filter(url => url.endsWith('.js') || url.includes('.js?')));
  const pictures = (await readdir(new URL('assets/', root)))
    .filter(file => /\.(?:svg|png|jpe?g|webp|woff2|txt|wav)$/.test(file) && !archivedAssets.test(file))
    .map(file => `./assets/${file}`).filter(url => !onDemandPictures.includes(url));
  const audio = JSON.parse(await readFile(new URL('assets/audio/manifest.json', root), 'utf8')).clips;
  const keys = [...Object.keys(CLIPS), 'pikachu-greeting'];
  const localCall = await readFile(new URL(`${narrationFolder}pikachu-greeting.mp3`, root));
  const localHash = createHash('sha256').update(localCall).digest('hex');
  const recordings = Object.fromEntries(keys.map(key => [
    `${narrationFolder}${key}.mp3`, key === 'pikachu-greeting' ? localHash : audio[key].sha256,
  ]));
  const sizes = await Promise.all(Object.keys(recordings).map(url => stat(new URL(url, root)).then(file => file.size)));
  const core = [...new Set([...explicitlyLoaded, ...sourceModules, ...pictures, ...starter.map(key => `${narrationFolder}${key}.mp3`)])];
  const assets = [...new Set(['./', ...core, ...onDemandPictures, './offline-core.json', './offline-audio.json', ...Object.keys(recordings)])];
  await Promise.all([
    writeFile(new URL('offline.json', root), JSON.stringify(assets, null, 2) + '\n'),
    writeFile(new URL('offline-core.json', root), JSON.stringify(core, null, 2) + '\n'),
    writeFile(new URL('offline-audio.json', root), JSON.stringify({ bytes: sizes.reduce((total, size) => total + size, 0), recordings }) + '\n'),
  ]);
  console.log(`${core.length} files for offline startup, ${keys.length} recordings available to download.`);
  return core;
}

async function findModules(root, scripts) {
  const urls = new Set(scripts);
  for (const url of urls) {
    const input = await readFile(new URL(url, root), 'utf8');
    for (const match of input.matchAll(/\b(?:from\s+|import(?:\s*\(\s*|\s+))['"](\.\/[^'"]+\.js(?:\?[^'"]*)?)['"]/g)) urls.add(match[1]);
  }
  return [...urls];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await offlineFiles(new URL('../dist/', import.meta.url));
}
