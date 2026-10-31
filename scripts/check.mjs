import { readFile, stat, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { CLIPS, WORDS, ANIMALS, COLORS, MISSION_IDS } from '../dist/content.js';
import { createSession, DEFAULT_SETTINGS } from '../dist/engine.js';

const root = new URL('../dist/', import.meta.url);
const recordings = JSON.parse(await readFile(new URL('assets/audio/manifest.json', root), 'utf8')).clips;
const voiceStyle = createHash('sha256').update(await readFile(new URL('../scripts/ava-style.json', root))).digest('hex');
const reviewedTakes = JSON.parse(await readFile(new URL('../scripts/hebrew-takes.json', root), 'utf8'));
const phoneticAudit = JSON.parse(await readFile(new URL('../scripts/hebrew-audio-audit.json', root), 'utf8')).clips;
for (const file of (await readdir(root)).filter(file => file.endsWith('.js'))) {
  execFileSync(process.execPath, ['--check', new URL(file, root).pathname.replace(/^\/([A-Za-z]:)/, '$1')], { stdio: 'pipe' });
}
for (const [key, clip] of Object.entries(CLIPS)) {
  const asset = new URL(`assets/audio/${key}.mp3`, root);
  if ((await stat(asset)).size < 1000) throw new Error(`Missing/empty clip: ${key}`);
  const bytes = await readFile(asset);
  if (bytes.subarray(0, 3).toString() !== 'ID3' && !(bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) throw new Error(`Invalid MP3: ${key}`);
  if (!['he-IL', 'en-US'].includes(clip.lang)) throw new Error(`Unexpected language: ${key}`);
  const recording = recordings[key];
  if (!recording || recording.lang !== clip.lang || recording.speech !== (clip.speech || clip.text)) throw new Error(`Recording uses an outdated script: ${key}`);
  if (recording.sha256 !== createHash('sha256').update(bytes).digest('hex')) throw new Error(`Recording does not match its manifest: ${key}`);
  if (clip.lang === 'he-IL' && (recording.engine !== 'BlueTTS phonemes' || recording.style_sha256 !== voiceStyle)) throw new Error(`Hebrew recording needs the reviewed voice pipeline: ${key}`);
  if (clip.lang === 'he-IL' && recording.take !== (reviewedTakes[key] || 0)) throw new Error(`Hebrew recording needs its reviewed take: ${key}`);
  if (clip.lang === 'he-IL' && JSON.stringify(recording.segments) !== JSON.stringify(clip.speech.length > 140 ? clip.speech.split(/(?<=[.!?])\s+/u) : [clip.speech])) throw new Error(`Hebrew recording needs updated sentence breaks: ${key}`);
  if (clip.lang === 'he-IL' && (phoneticAudit[key]?.sha256 !== recording.sha256 || phoneticAudit[key]?.expected_ipa !== clip.speech)) throw new Error(`Hebrew recording needs an updated phonetic audit: ${key}`);
}
for (const word of WORDS) if (!CLIPS[`he-${word.id}`]) throw new Error(`Missing reading audio: ${word.id}`);
for (const word of [...ANIMALS, ...COLORS]) if (!CLIPS[`en-${word.id}`]) throw new Error(`Missing English audio: ${word.id}`);
for (const mission of [...MISSION_IDS, 'characters']) createSession(mission, DEFAULT_SETTINGS);
const characterSource = JSON.parse(await readFile(new URL('../scripts/character-art-source.json', root), 'utf8'));
const characterArt = await readFile(new URL('assets/crew-family.webp', root));
if (characterArt.subarray(0, 4).toString() !== 'RIFF' || characterArt.subarray(8, 12).toString() !== 'WEBP' || createHash('sha256').update(characterArt).digest('hex') !== characterSource.sha256) throw new Error('Character artwork must match its credited source');
const pawSources = JSON.parse(await readFile(new URL('../scripts/paw-character-art-sources.json', root), 'utf8'));
for (const source of pawSources.images) {
  const bytes = await readFile(new URL(source.file.replace('dist/', './'), root));
  if (bytes.length !== source.bytes || createHash('sha256').update(bytes).digest('hex') !== source.sha256 || !source.source.endsWith(`_${source.id}-thumbnail.jpg`)) throw new Error(`PAW Patrol picture must match its official named source: ${source.id}`);
}
JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
for (const asset of JSON.parse(await readFile(new URL('offline.json', root), 'utf8'))) {
  if (asset !== './') await stat(new URL(asset, root));
}
console.log(`Syntax, curriculum, manifest and ${Object.keys(CLIPS).length} MP3 assets verified.`);
