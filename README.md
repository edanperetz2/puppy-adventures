# חבורת ההרפתקאות · Puppy Adventures

A gentle learning game for phones, tablets and computers. Original illustrated puppies guide six-question adventures in Hebrew reading, spoken English, counting, addition, reading an analog clock, and learning English lowercase and Hebrew handwritten letters. Hebrew uses vowel marks by default. English reading is never required.

**Play:** [puppy-adventures.vercel.app](https://puppy-adventures.vercel.app)

## Play locally

Requires Node.js 20 or newer. There are no npm dependencies or build steps.

```sh
npm start
```

Open the printed local address. To use another port, set `PORT` before starting. The complete deployable game is in `dist/`.

## Activities

- **גינת המילים:** read a short Hebrew word and match it to a picture. The instruction is narrated; the target word is spoken only after a requested hint or a correct answer. Start with five short words; parents can enable all twelve.
- **סטודיו האותיות:** compare a familiar English capital with its lowercase form, or a familiar Hebrew print letter with Israeli cursive handwriting. All 26 English letters, 22 Hebrew letters and 5 final forms are included. English uses simple manuscript forms, with book-style a/g shown alongside. Choose a letter, watch a numbered pencil demonstration, reveal strokes one at a time, or trace with a finger, pen or mouse. Tracing tolerates small deviations and can resume after lifting the finger; it does not assess handwriting. Matching games focus on the selected letter and the next two, with two questions per letter. The familiar form remains above three choices. A writing lesson opened during a question counts as help, and returning preserves attempted answers. A completed six-question round earns normal album progress and a sticker. Language choice stays on that device. Drawing paths are never uploaded or saved.
- **מפרץ האנגלית:** listen to animals, colors and numbers, then choose a picture or numeral. The English word appears in CAPITALS after success. Each adventure includes two questions from each category.
- **סדנת המספרים:** alternate counting and addition. Touch each object to count it aloud. Addition is shown with two groups and a left-to-right equation. Parents choose a maximum of 5, 10 or 20; subtraction is not included.
- **גן השעונים:** learn the short purple hour hand and long green minute hand in Hebrew. Tap numbers on an interactive clock, listen to its time, then complete six clock-reading questions. Whole hours are the default; parents can add half-hours and quarter-hours. Spoken answer choices support children who are still learning to read. The hour hand moves between numbers correctly: 3:30 is halfway between 3 and 4, and 12:45 is read as רבע לאחת. Hints highlight the relevant hand. Returning to the lesson during a question counts as assistance.

There are unlimited retries, gentle feedback and no timer. A completed adventure unlocks one of twelve stickers. Partial adventures do not count toward saved progress. Replaying continues to record completed adventures after all stickers are collected.

## Parent settings

Tap **להורים**, then answer the parent puzzle. This is a child-facing navigation gate, not account security.

Choose Hebrew vowel marks, reading word length, math range, English number range, clock level, sound and animation. Under **קריאת שעון**, choose **שעות עגולות**, **שעות וחצאי שעות** or **גם רבעים**. The parent view distinguishes questions answered independently from questions that used a hint or another attempt. These are play records, not an assessment. The reset flow asks for confirmation.

Without pairing, progress stays in this browser. To share an album, open **להורים** on the first device, answer **21**, and choose **יצירת אלבום משפחתי**. Use **העתקת קישור למכשיר נוסף** to open a pairing link on the next device. Complete the parent gate there and tap **חיבור לאלבום הקיים**. Alternatively enter the family code manually. Repeat for each device or browser.

Paired devices share completed adventures, skill counts and stickers through the free Supabase project. Sound, motion and difficulty remain independent on each device. Updates happen after completion, on returning to the page and every 15 seconds while visible. Offline completions survive reopening and upload when the connection returns. Repeated uploads do not duplicate adventures. Reset disconnects and clears only that device, preserving the shared album already uploaded.

Keep the family code private and retain a copy: possession grants access to the album. Pairing links carry the code in their URL fragment, removed on arrival; it is never part of a request URL. No child name, email, photos, microphone or child account is required. Browser storage failure does not block local play, but pairing requires working storage. A paused or unavailable free database leaves the game playable and retries pending progress after service resumes.

## Free hosting on Vercel

Import the private personal GitHub repository into a Vercel **Hobby** project. Select **Other** as the framework and `dist` as the output directory. No install command, build command or paid APIs are required. `vercel.json` declares the static output, security headers and allowed Supabase connection. Shared albums use a free Supabase project; the local game needs no backend.

The migration is in `supabase/migrations/20261031_family_albums.sql`. `dist/sync-config.js` contains only the public project URL and a **publishable** key. No database password, secret key or service-role key is shipped. Both tables have row-level security with direct client access denied. The deliberately public RPC checks a random 120-bit family code on every request; only its SHA-256 hash is stored. It serializes updates and merges per-device counters monotonically so retries cannot duplicate rewards. Supabase's [public security-definer advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [no-policy advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) describe these intentional choices: the code-checked RPC is the sole entry point.

The repository is private. A normal Vercel production URL can be visited by anyone who has the address; repository privacy does not itself restrict the website. The fixed greeting includes Ariel's first name, as requested. No child login, email or photos are collected; shared albums contain only progress counters.

## Audio and offline use

All 210 MP3 recordings are bundled. The 148 Hebrew recordings use the parent-selected Ava sample as a voice reference for the free, local [BlueTTS](https://github.com/maxmelichov/BlueTTS) synthesizer. These are Ava-reference recordings, rather than output from Microsoft's Ava engine. The 62 English recordings use Microsoft's Ava multilingual voice directly. The game does not call a speech service during play, request a microphone, or require an API key. Hebrew always uses the reviewed recordings; an English browser voice can serve as an English-only fallback. The sound button and replay control let the child start or re-enable audio, including on devices that require a tap before playback.

Each opening attempts the short welcome **שלום אריאל, ברוכה הבאה למשחק שלך!**, respecting the saved sound setting. If autoplay is blocked, the first spoken interaction plays the welcome before that action's instructions. A completed welcome is remembered only for that opening, so ordinary navigation and question changes do not repeat it. The home speaker button can replay the welcome and introduce the puppies. Activity choices, hints, counting, correct answers and retries have spoken feedback; returning to the map invites another adventure. Praise includes **כל הכבוד! הצלחת!**, and retries say **נסי שוב, אריאל. אני כאן איתך.** in feminine Hebrew.

Hebrew narration has a separate, fully pointed source in `dist/speech.js`: instructions address a girl, and counting and clock numbers have explicit feminine readings. `dist/hebrew-pronunciation.js` contains a reviewed dictionary of 292 Hebrew word forms covering the curriculum. It specifies consonants, vowels, stress and feminine endings as IPA phonemes, which BlueTTS uses directly. For example, לִחְצִי is /liχtsˈi/, הַתְּמוּנָה is /hatmunˈa/ and הִצְלַחְתְּ ends in /t/. Silent and audible shva are resolved explicitly across the vocabulary. These phonemes never appear in the child's reading words. A new Hebrew word fails content checks until its pronunciation is reviewed. Device-generated Hebrew speech is disabled so a device cannot reintroduce guessed readings. Slow Hebrew hints make only a small pace change.

A classic service worker caches the game, local fonts and recordings after a successful online visit on HTTPS or localhost. MP3 byte-range responses support Safari's cached-audio requests. The first visit requires a connection. Browser storage policies can remove cached content; revisit online to restore it. The large English speaker button plays the word directly from a tap. Browser layout tests cannot replace a final sound check on the family's physical devices.

## Device support

Use the same HTTPS address in current Safari on iPhone/iPad, Chrome on Android, or Chrome, Edge and Firefox on a laptop. No installation is needed. The layout supports portrait, landscape, small phones, laptop screens, safe areas around notches and home indicators, touch input and keyboard/mouse input. Apple and Android home-screen icons are bundled for optional installation. Sound starts after a tap, respecting browser audio permissions.

Audio generation is a development-only step. Existing recordings need no dependencies. Export the reviewed content first:

```sh
node --input-type=module -e "import {CLIPS} from './dist/content.js'; import {writeFileSync} from 'node:fs'; writeFileSync('clips.json', JSON.stringify(CLIPS));"
```

For English, install the open-source [edge-tts](https://github.com/rany2/edge-tts) client and generate the original Ava recordings:

```sh
python -m pip install edge-tts
python scripts/generate-audio.py clips.json dist/assets/audio
```

For Hebrew, use BlueTTS (tested source revision `712f7c9491ad7875fc985e24e166afe43ae649b0`) and PyAV. Download the [matching v2 ONNX model bundle](https://huggingface.co/notmax123/blue-onnx-v2/tree/cd1093eaa920136e7a727dfb92d5f7879039e587) outside this repository. Pass that directory explicitly; the generator never downloads models. The bundled `scripts/ava-style.json` is the extracted profile of the chosen synthetic Ava sample; no child's voice is involved.

```sh
python scripts/generate-hebrew-audio.py clips.json dist/assets/audio --model-dir /path/to/blue-model --style scripts/ava-style.json
```

The generation environment used NumPy 2.2.6, ONNX Runtime 1.23.2 and PyAV 17.1.0 on CPU. Heavy model files, development packages and source voice previews are excluded from the game and repository. Playback works on ordinary phones and computers without these dependencies.

`dist/assets/audio/manifest.json` records each clip's actual pronunciation input, voice, pace and audio checksum. Hebrew entries also fingerprint the voice profile and model bundle, and record sentence breaks and deterministic takes. Long instructions are synthesized in short sentences. `scripts/hebrew-takes.json` preserves the selected takes so regeneration does not replace a reviewed result with a random variation. A generator retains a recording only when its inputs and checksum match, so changing a shared pronunciation updates every affected recording. Temporary files are replaced only after a valid MP3 is produced. Both generators accept `--keys` for selected clips. `npm run check` rejects missing, stale or mismatched recordings and verifies the Hebrew profile.

`scripts/audit-hebrew-audio.py` checks actual recordings using the local [Hebrew IPA recognizer](https://huggingface.co/notmax123/whisper-heb-ipa/tree/6f7c493615d163a99ed6ea09b2cb7241760d868b). It requires PyTorch, Transformers, NumPy and PyAV, and a separately downloaded model directory. Reports resume only when the audio, expected phonemes, model fingerprint and precision match. No audio is uploaded. The checked-in `scripts/hebrew-audio-audit.json` covers all 148 Hebrew recordings; `npm run check` verifies that its expected phonemes and audio hashes still match. Regenerated recordings require an updated report.

```sh
python scripts/audit-hebrew-audio.py clips.json dist/assets/audio --model-dir /path/to/ipa-model --output scripts/hebrew-audio-audit.json
```

This recognizer is diagnostic: it can confuse sounds, omit glottal stops or misreport stress. Inspect discrepancies and listen to regenerated speech; neither integrity checks nor automated transcription prove perfect pronunciation. Short alphabet names can also confuse this recognizer with written-letter abbreviations or homographs; interpret those outputs with care. The generation services and models may change, but runtime playback uses only the fixed recordings. Run the two audio generators sequentially because they share a manifest.

## Development and validation

```sh
npm test
npm run prepare-offline
npm run check
```

The curriculum tests exercise 2,400 generated adventures, including 600 clock adventures across all three levels. Checks cover hand angles, Hebrew quarter-to phrasing, distinct choices, addition, saved data, stickers and preserving older albums. Letter tests cover all 53 starting forms across both languages, focused question balance, forgiving tracing, and older progress snapshots. Additional tests cover audio byte ranges, browser fetch binding, paired-device merging, retries and offline recovery. The asset check verifies JavaScript syntax, manifests, the offline list and all 210 MP3 files. Browser QA covers widths from 320 through 1920 pixels; clock lessons and questions were also checked in phone landscape and tablet layouts.

`supabase/migrations/20261031111908_add_clock_progress.sql` extends the existing sync function's activity list. It preserves albums, prior subject counts and access grants. A transaction-based live test verifies that clock completions merge across devices and remain intact when an older client uploads a three-subject snapshot.

`supabase/migrations/20261031140937_add_letter_progress.sql` adds the letter workshop to the existing album function. The transaction test in `supabase/tests/letter_progress.sql` verifies cross-device merging, duplicate uploads, old-client uploads and existing execution grants, then rolls back all test data.

Letter paths and question groups are in `dist/letters.js`, the pointer writing pad is in `dist/letter-pad.js`, and workshop styling is in `dist/letters.css`. The single-line drawings use common manuscript and Israeli cursive forms, checked against [Dan Pelleg’s public-domain handwriting diagrams](https://commons.wikimedia.org/wiki/Category:Hebrew_letters_with_font_lines) and [Gveret Levin’s Hebrew handwriting reference](https://github.com/AlefAlefAlef/gveret-levin). These are one guided writing style; real handwriting varies. The game ships original SVG paths rather than a remote font or image service.

Content lives in `dist/content.js`; Hebrew speech and pronunciation review live in `dist/speech.js` and `dist/hebrew-pronunciation.js`. Question generation and progress rules are in `dist/engine.js`. Illustrations are original SVG in `dist/art.js`, animated by `dist/styles.css`. Narration is in `dist/audio.js`; family sync is in `dist/sync.js` and `dist/family-ui.js`. Increase the cache version in `dist/sw.js` for changed assets and regenerate `dist/offline.json` with `npm run prepare-offline`. Workers activate after their complete asset list downloads. Reload a returning tab to use updated code; an in-progress adventure is not forcibly restarted.

Rubik is bundled locally under its SIL Open Font License in `dist/assets/FONT-LICENSE.txt`. No third-party analytics, trackers, advertisements, remote fonts or runtime content services are included.

## Next ideas

Possible next steps after watching a first play session: building words from letters, matching English uppercase and lowercase letters, addition with larger totals, and a longer story map. The initial game deliberately begins with familiar skills and adjustable ranges.
