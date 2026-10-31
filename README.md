# חבורת ההרפתקאות · Puppy Adventures

A gentle learning game for phones, tablets and computers. Original illustrated puppies guide six-question adventures in Hebrew reading, spoken English, counting and addition. Hebrew uses vowel marks by default. English reading is never required.

**Play:** [puppy-adventures.vercel.app](https://puppy-adventures.vercel.app)

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

Without pairing, progress stays in this browser. To share an album, open **להורים** on the first device, answer **21**, and choose **יצירת אלבום משפחתי**. Use **העתקת קישור למכשיר נוסף** to open a pairing link on the next device. Complete the parent gate there and tap **חיבור לאלבום הקיים**. Alternatively enter the family code manually. Repeat for each device or browser.

Paired devices share completed adventures, skill counts and stickers through the free Supabase project. Sound, motion and difficulty remain independent on each device. Updates happen after completion, on returning to the page and every 15 seconds while visible. Offline completions survive reopening and upload when the connection returns. Repeated uploads do not duplicate adventures. Reset disconnects and clears only that device, preserving the shared album already uploaded.

Keep the family code private and retain a copy: possession grants access to the album. Pairing links carry the code in their URL fragment, removed on arrival; it is never part of a request URL. No child name, email, photos, microphone or child account is required. Browser storage failure does not block local play, but pairing requires working storage. A paused or unavailable free database leaves the game playable and retries pending progress after service resumes.

## Free hosting on Vercel

Import the private personal GitHub repository into a Vercel **Hobby** project. Select **Other** as the framework and `dist` as the output directory. No install command, build command or paid APIs are required. `vercel.json` declares the static output, security headers and allowed Supabase connection. Shared albums use a free Supabase project; the local game needs no backend.

The migration is in `supabase/migrations/20261031_family_albums.sql`. `dist/sync-config.js` contains only the public project URL and a **publishable** key. No database password, secret key or service-role key is shipped. Both tables have row-level security with direct client access denied. The deliberately public RPC checks a random 120-bit family code on every request; only its SHA-256 hash is stored. It serializes updates and merges per-device counters monotonically so retries cannot duplicate rewards. Supabase's [public security-definer advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [no-policy advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) describe these intentional choices: the code-checked RPC is the sole entry point.

The repository is private. A normal Vercel production URL can be visited by anyone who has the address; repository privacy does not itself restrict the website. The game contains no child name, login, photos or personal data. If family-only website access is needed, add an access design before introducing personal information.

## Audio and offline use

All 89 Hebrew and English MP3 recordings are bundled. The game does not call a speech service during play, request a microphone, or require an API key. A same-language browser voice is a fallback if a recording cannot play. The sound button and replay control let the child start or re-enable audio, including on devices that require a tap before playback.

A classic service worker caches the game, local fonts and recordings after a successful online visit on HTTPS or localhost. MP3 byte-range responses support Safari's cached-audio requests. The first visit requires a connection. Browser storage policies can remove cached content; revisit online to restore it. The large English speaker button plays the word directly from a tap. Browser layout tests cannot replace a final sound check on the family's physical devices.

## Device support

Use the same HTTPS address in current Safari on iPhone/iPad, Chrome on Android, or Chrome, Edge and Firefox on a laptop. No installation is needed. The layout supports portrait, landscape, small phones, laptop screens, safe areas around notches and home indicators, touch input and keyboard/mouse input. Apple and Android home-screen icons are bundled for optional installation. Sound starts after a tap, respecting browser audio permissions.

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
npm run prepare-offline
npm run check
```

The curriculum tests exercise 1,800 generated adventures across difficulty settings, unique choices, solvable addition, category coverage, saved data and stickers. Additional tests cover audio byte ranges, browser fetch binding, paired-device merging, retries and offline recovery. The asset check verifies JavaScript syntax, manifests, the offline list and all 89 MP3 files. Browser QA covers widths from 320 through 1920 pixels and two independent browser origins paired to the live database.

Content and speech text live in `dist/content.js`; question generation and progress rules are in `dist/engine.js`. Illustrations are original SVG in `dist/art.js`, animated by `dist/styles.css`. Narration is in `dist/audio.js`; family sync is in `dist/sync.js` and `dist/family-ui.js`. Increase the cache version in `dist/sw.js` for changed assets and regenerate `dist/offline.json` with `npm run prepare-offline`. Workers activate after their complete asset list downloads. Reload a returning tab to use updated code; an in-progress adventure is not forcibly restarted.

Rubik is bundled locally under its SIL Open Font License in `dist/assets/FONT-LICENSE.txt`. No third-party analytics, trackers, advertisements, remote fonts or runtime content services are included.

## Next ideas

Possible next steps after watching a first play session: building words from letters, matching English uppercase and lowercase letters, addition with larger totals, and a longer story map. The initial game deliberately begins with familiar skills and adjustable ranges.
