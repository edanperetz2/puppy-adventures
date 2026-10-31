import { readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { CLIPS, WORDS, ANIMALS, COLORS } from '../dist/content.js';
import { createSession, DEFAULT_SETTINGS } from '../dist/engine.js';

const root = new URL('../dist/', import.meta.url);
for (const file of ['app.js', 'art.js', 'audio.js', 'content.js', 'engine.js', 'sw.js']) {
  execFileSync(process.execPath, ['--check', new URL(file, root).pathname.replace(/^\/([A-Za-z]:)/, '$1')], { stdio: 'pipe' });
}
for (const [key, clip] of Object.entries(CLIPS)) {
  const asset = new URL(`assets/audio/${key}.mp3`, root);
  if ((await stat(asset)).size < 1000) throw new Error(`Missing/empty clip: ${key}`);
  const bytes = await readFile(asset);
  if (bytes.subarray(0, 3).toString() !== 'ID3' && !(bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) throw new Error(`Invalid MP3: ${key}`);
  if (!['he-IL', 'en-US'].includes(clip.lang)) throw new Error(`Unexpected language: ${key}`);
}
for (const word of WORDS) if (!CLIPS[`he-${word.id}`]) throw new Error(`Missing reading audio: ${word.id}`);
for (const word of [...ANIMALS, ...COLORS]) if (!CLIPS[`en-${word.id}`]) throw new Error(`Missing English audio: ${word.id}`);
for (const mission of ['hebrew', 'english', 'math']) createSession(mission, DEFAULT_SETTINGS);
JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
console.log(`Syntax, curriculum, manifest and ${Object.keys(CLIPS).length} MP3 assets verified.`);
