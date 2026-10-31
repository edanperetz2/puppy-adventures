# חבורת ההרפתקאות · Puppy Adventures

A gentle, tablet-friendly learning game for a young Hebrew-speaking child. Original illustrated puppies guide six-question adventures in Hebrew reading, spoken English, counting and addition. Hebrew uses vowel marks by default. English reading is never required.

## Play locally

Requires Node.js 20 or newer. There are no npm dependencies or build steps.

```sh
npm start
```

Open the printed local address. To use another port, set `PORT` before starting. The complete deployable game is in `dist/`.

## Activities

- **גינת המילים:** read a short Hebrew word and match it to a picture. The instruction is narrated; the target word is spoken only after a requested hint or a correct answer. Start with five short words; parents can enable all twelve.
- **מפרץ האנגלית:** listen to animals, colors and numbers, then choose a picture or numeral. The English word appears in CAPITALS after success. Each adventure includes two questions from each category.
- **סדנת המספרים:** alternate counting and addition. Touch each object to count it aloud. Addition is shown with two groups and a left-to-right equation. Parents choose a maximum of 5, 10 or 20; subtraction is not included.

There are unlimited retries, gentle feedback and no timer. A completed adventure unlocks one of twelve stickers. Partial adventures do not count toward saved progress. Replaying continues to record completed adventures after all stickers are collected.

## Parent settings

Tap **להורים**, then answer the parent puzzle. This is a child-facing navigation gate, not account security.

Choose Hebrew vowel marks, reading word length, math range, English number range, sound and animation. The parent view distinguishes questions answered independently from questions that used a hint or another attempt. These are play records, not an assessment. The reset flow asks for confirmation.

Progress is local to this browser and origin. Clearing site data, switching browsers or changing devices starts a separate album. There is no cloud sync. Browser storage failure does not block play.

## Free hosting on Vercel

Import the private personal GitHub repository into a Vercel **Hobby** project. Select **Other** as the framework and `dist` as the output directory. No install command, build command, environment variables, database or paid APIs are required. `vercel.json` already declares the static output and response headers.

The repository is private. A normal Vercel production URL can be visited by anyone who has the address; repository privacy does not itself restrict the website. The game contains no child name, login, photos or personal data. If family-only website access is needed, add an access design before introducing personal information.

## Audio and offline use

All 89 Hebrew and English MP3 recordings are bundled. The game does not call a speech service during play, request a microphone, or require an API key. A same-language browser voice is a fallback if a recording cannot play. The sound button and replay control let the child start or re-enable audio, including on devices that require a tap before playback.

A service worker caches the game, local font files and recordings after a successful online visit on HTTPS or localhost. The first visit requires a connection. Browser storage policies can remove cached content; revisit online to restore it. A real iPad/Android tablet audio check is recommended because desktop viewport testing cannot verify every device's media policy.

The recordings were generated during development with the open-source [edge-tts](https://github.com/rany2/edge-tts) client and the Hila (Hebrew) and Jenny (English) voices. Existing recordings need no dependency. To regenerate clips optionally:

```sh
python -m pip install edge-tts
node --input-type=module -e "import {CLIPS} from './dist/content.js'; import {writeFileSync} from 'node:fs'; writeFileSync('clips.json', JSON.stringify(CLIPS));"
python scripts/generate-audio.py clips.json dist/assets/audio
```

The script keeps existing recordings; remove only the specific clips you intend to regenerate. The generation service may change; runtime playback does not depend on it. Review new recordings for Hebrew pronunciation.

## Development and validation

```sh
npm test
npm run check
```

The curriculum tests exercise 1,800 generated adventures across difficulty settings, unique answer choices, solvable addition, English category coverage, saved-data validation and sticker progression. The asset check verifies JavaScript syntax, manifests and all 89 MP3 files.

Content and speech text live in `dist/content.js`; question generation and progress rules are in `dist/engine.js`. Illustrations are original SVG in `dist/art.js`, animated by `dist/styles.css`. Narration cancellation, replay and fallback are in `dist/audio.js`. Increase the cache version in `dist/sw.js` whenever publishing changed assets so returning visitors receive the new version after closing old game tabs and reopening.

Rubik is bundled locally under its SIL Open Font License in `dist/assets/FONT-LICENSE.txt`. No third-party analytics, trackers, advertisements, remote fonts or runtime content services are included.

## Next ideas

Possible next steps after watching a first play session: building words from letters, matching English uppercase and lowercase letters, addition with larger totals, and a longer story map. The initial game deliberately begins with familiar skills and adjustable ranges.
