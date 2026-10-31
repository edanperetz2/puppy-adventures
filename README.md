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

- **גינת המילים:** ten freely selectable stages grow from short words to vocabulary, color phrases, written quantities, positions, actions and short sentences. There are 108 illustrated reading targets: 48 single words and 60 phrases/sentences. Stages 5–10 add 72 targets, including rescue vehicles, a playground, adjectives, masculine quantities, spatial relations and action verbs with feminine/masculine agreement. Scene choices use the same objects with different details, so reading only the noun cannot solve the question. Mixed rounds keep single-word choices separate from scenes to avoid ambiguous answers. Six-question rounds prefer unseen targets, then review the oldest items. Completed-round history is bounded, sanitized and stored only on that device; the family album keeps its existing shared rewards and subject totals. A round with at least five independent answers offers the immediately following stage. Repeating and choosing any other stage remain available; no stage is locked, and the suggestion is not a skill assessment. Targets are spoken only after a requested hint or a correct answer.
- **סטודיו האותיות:** keep the Hebrew/English selector, then choose **מזהות אותיות** (recognition) or **כותבות אותיות** (writing). All 26 English letters, 22 Hebrew letters and 5 final forms are included. Recognition rounds introduce the least-practiced three letters, with two questions per letter, a familiar print/capital above three handwriting/lowercase choices, and an optional picture hint. Completing the round records those letters and offers the next group; partial rounds do not advance. Writing has its own demonstrations, stroke steps and finger/pen/mouse tracing, with a saved selected letter, completion marks and a next-letter button. Only finishing a real trace records writing practice; watching a demonstration or revealing strokes does not. Repeating a trace within the same visit does not duplicate progress. Writing practice does not mint adventure rewards; completed recognition rounds retain the existing six-question reward. English uses simple manuscript forms, with book-style a/g shown alongside. Tracing tolerates small deviations, can resume after lifting the finger and does not assess handwriting. Each language and path has independent progress, shared across paired devices. Drawings are never uploaded or saved.
- **מפרץ האנגלית:** listen to animals, colors and numbers, then choose a picture or numeral. The English word appears in CAPITALS after success. Each adventure includes two questions from each category.
- **סדנת המספרים:** alternate counting and addition. Touch each object to count it aloud. Addition is shown with two groups and a left-to-right equation. Parents choose a maximum of 5, 10 or 20; subtraction is not included.
- **גן השעונים:** learn the short purple hour hand and long green minute hand in Hebrew. Tap numbers on an interactive clock, listen to its time, then complete six clock-reading questions. Whole hours are the default; parents can add half-hours and quarter-hours. Spoken answer choices support children who are still learning to read. The hour hand moves between numbers correctly: 3:30 is halfway between 3 and 4, and 12:45 is read as רבע לאחת. Hints highlight the relevant hand. Returning to the lesson during a question counts as assistance.

There are unlimited retries, gentle feedback and no timer. Each completed adventure unlocks one of 1,000 stickers. The original twelve IDs and pictures remain unchanged; 988 new rewards combine fifty familiar illustrations with twenty destinations and scenes. The album renders twenty slots at a time across fifty pages, opens at the latest collected sticker, and offers previous/next controls, a page selector and a latest-sticker shortcut. Earlier adventures that exceeded the old twelve-sticker cap receive their rewards on loading the expanded album. Partial adventures do not count toward saved progress. Replaying continues to record completed adventures after all 1,000 stickers are collected.

## Parent settings

Tap **להורים**, then answer the parent puzzle. This is a child-facing navigation gate, not account security.

Choose Hebrew vowel marks, reading word length, math range, English number range, clock level, sound and animation. Under **קריאת שעון**, choose **שעות עגולות**, **שעות וחצאי שעות** or **גם רבעים**. The parent view distinguishes questions answered independently from questions that used a hint or another attempt. These are play records, not an assessment. The reset flow asks for confirmation.

Without pairing, progress stays in this browser. To share an album, open **להורים** on the first device, answer **21**, and choose **יצירת אלבום משפחתי**. Use **העתקת קישור למכשיר נוסף** to open a pairing link on the next device. Complete the parent gate there and tap **חיבור לאלבום הקיים**. Alternatively enter the family code manually. Repeat for each device or browser.

Paired devices share completed adventures, skill counts, stickers and per-letter practice counters through the free Supabase project. Sound, motion, difficulty and the selected writing letter remain independent on each device. Updates happen after completion, on returning to the page and every 15 seconds while visible. Offline completions survive reopening and upload when the connection returns. Repeated uploads do not duplicate adventures or letter practice. Reset disconnects and clears only that device, preserving the shared album already uploaded.

Expanded sticker IDs are a stable, local catalog in `dist/stickers.js`; rewards derive from the existing shared completion totals, not the legacy twelve-item RPC sticker list. No database migration is required. Older clients can still upload their counters without removing earned rewards from updated devices. Tests exercise the actual legacy response shape, offline reopening, repeated uploads, and the 1,000th reward across two devices.

`dist/letter-progress.js` keeps bounded recognition/writing counters for each alphabet, and the next group prefers unpracticed letters before review. Older versions saved only a combined letter-adventure total. When such a player upgrades, the Hebrew review order begins at ד rather than א, while all historical per-letter counts remain zero; the game does not invent past mastery. New completions record the actual letter IDs. `20261031170249_split_letter_paths.sql` extends the existing code-checked RPC without changing table access or execution grants. Per-device counters merge monotonically, with family totals plus pending offline changes. Recognition updates only on a completed round, writing on a completed trace. Requests send compact counters rather than the 1,000-sticker catalog, staying below the RPC's 4 KB limit. The SQL regression test rolls back all generated test albums, checks old-client uploads and rejects malformed or excessive counters.

Keep the family code private and retain a copy: possession grants access to the album. Pairing links carry the code in their URL fragment, removed on arrival; it is never part of a request URL. No child name, email, photos, microphone or child account is required. Browser storage failure does not block local play, but pairing requires working storage. A paused or unavailable free database leaves the game playable and retries pending progress after service resumes.

## Free hosting on Vercel

Import the private personal GitHub repository into a Vercel **Hobby** project. Select **Other** as the framework and `dist` as the output directory. No install command, build command or paid APIs are required. `vercel.json` declares the static output, security headers and allowed Supabase connection. Shared albums use a free Supabase project; the local game needs no backend.

The migration is in `supabase/migrations/20261031_family_albums.sql`. `dist/sync-config.js` contains only the public project URL and a **publishable** key. No database password, secret key or service-role key is shipped. Both tables have row-level security with direct client access denied. The deliberately public RPC checks a random 120-bit family code on every request; only its SHA-256 hash is stored. It serializes updates and merges per-device counters monotonically so retries cannot duplicate rewards. Supabase's [public security-definer advisory](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [no-policy advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) describe these intentional choices: the code-checked RPC is the sole entry point.

The repository is private. A normal Vercel production URL can be visited by anyone who has the address; repository privacy does not itself restrict the website. The fixed greeting includes Ariel's first name, as requested. No child login, email or photos are collected; shared albums contain only progress counters.

## Audio and offline use

All 322 MP3 recordings are bundled. The 260 Hebrew recordings use the parent-selected Ava sample as a voice reference for the free, local [BlueTTS](https://github.com/maxmelichov/BlueTTS) synthesizer. These are Ava-reference recordings, rather than output from Microsoft's Ava engine. The 62 English recordings use Microsoft's Ava multilingual voice directly. The game does not call a speech service during play, request a microphone, or require an API key. Hebrew always uses the reviewed recordings; an English browser voice can serve as an English-only fallback. The sound button and replay control let the child start or re-enable audio, including on devices that require a tap before playback.

Each opening attempts the short welcome **שלום אריאל, ברוכה הבאה למשחק שלך!**, respecting the saved sound setting. If autoplay is blocked, the first spoken interaction plays the welcome before that action's instructions. A completed welcome is remembered only for that opening, so ordinary navigation and question changes do not repeat it. The home speaker button can replay the welcome and introduce the puppies. Activity choices, hints, counting, correct answers and retries have spoken feedback; returning to the map invites another adventure. Praise includes **כל הכבוד! הצלחת!**, and retries say **נסי שוב, אריאל. אני כאן איתך.** in feminine Hebrew.

Hebrew narration has a separate, fully pointed source in `dist/speech.js`: instructions address a girl, and counting and clock numbers have explicit feminine readings. `dist/hebrew-pronunciation.js` contains a reviewed dictionary of 412 Hebrew word forms covering the curriculum. It specifies consonants, vowels, stress and feminine endings as IPA phonemes, which BlueTTS uses directly. For example, לִחְצִי is /liχtsˈi/, הַתְּמוּנָה is /hatmunˈa/ and הִצְלַחְתְּ ends in /t/. Silent and audible shva are resolved explicitly across the vocabulary. These phonemes never appear in the child's reading words. A new Hebrew word fails content checks until its pronunciation is reviewed. Device-generated Hebrew speech is disabled so a device cannot reintroduce guessed readings. Slow Hebrew hints make only a small pace change.

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

`scripts/audit-hebrew-audio.py` checks actual recordings using the local [Hebrew IPA recognizer](https://huggingface.co/notmax123/whisper-heb-ipa/tree/6f7c493615d163a99ed6ea09b2cb7241760d868b). It requires PyTorch, Transformers, NumPy and PyAV, and a separately downloaded model directory. Reports resume only when the audio, expected phonemes, model fingerprint and precision match. No audio is uploaded. The checked-in `scripts/hebrew-audio-audit.json` covers all 260 Hebrew recordings; `npm run check` verifies that its expected phonemes and audio hashes still match. Regenerated recordings require an updated report.

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

The curriculum tests exercise 2,400 generated adventures, including 600 clock adventures. Reading tests add 1,320 staged/mixed adventures plus dedicated scene-choice, recurrence and advancement checks. They verify all 108 targets have distinct valid pictures and recorded pronunciation, distractors share the intended scene family, and completed rounds rotate through unseen targets before review. They cover safe loading of older settings/history and offer only the next stage after five independent answers. Other checks cover hand angles, Hebrew quarter-to phrasing, addition, saved data, stickers, both alphabets, tracing, byte-range audio, shared progress and offline recovery. Asset checks verify JavaScript syntax, manifests and all 325 MP3s. Browser QA includes two successive stage-eight rounds with no repeated targets, hints/rewards and the stage-nine offer, a complete stage-ten round on a 320-pixel phone viewport, and tablet layouts.

`supabase/migrations/20261031111908_add_clock_progress.sql` extends the existing sync function's activity list. It preserves albums, prior subject counts and access grants. A transaction-based live test verifies that clock completions merge across devices and remain intact when an older client uploads a three-subject snapshot.

`supabase/migrations/20261031140937_add_letter_progress.sql` adds the letter workshop to the existing album function. The transaction test in `supabase/tests/letter_progress.sql` verifies cross-device merging, duplicate uploads, old-client uploads and existing execution grants, then rolls back all test data.

Letter paths and question groups are in `dist/letters.js`, the pointer writing pad is in `dist/letter-pad.js`, and workshop styling is in `dist/letters.css` and `dist/letter-paths.css`. All displayed handwriting models, guides, animated ink and tracing now share the exact same centerline paths and pen width. No font-outline clipping is used: it previously allowed a wide ink brush to reveal future branches at crossings. All 27 Hebrew forms were visually reviewed against the classroom direction sheets in [this school workbook, pages 31–35](https://hilleltorah.org/wp-content/uploads/2020/06/Summer-2020-1st-Grade-Judiac-Studies-Workbook.pdf#page=31). Shin, final pe and final tsadi enter from below and follow their loops continuously. Additional fixes cover stroke direction, lift order and shape continuity in gimel, het, tet, lamed, mem, samekh, ayin, tsadi, tav and final mem. A direction arrow shows the first movement; longer loops have more drawing time, with a 650 ms visible pen lift between separate strokes. Tracing limits forward progress by actual pointer travel so a crossing cannot skip a loop. Hebrew layouts remain RTL and English samples remain isolated LTR. The older [Gveret Levin outlines](https://github.com/AlefAlefAlef/gveret-levin) and SIL OFL license remain bundled for compatibility with older cached clients; updated models use the reviewed pen paths.

Content lives in `dist/content.js`; reading stages and vocabulary are in `dist/reading.js`. New word illustrations are original SVG in `dist/reading-art.js`, with stage styling in `dist/reading.css`. Pointed vocabulary checks include the Academy's [air transport terms](https://terms.hebrew-academy.org.il/Millonim/ShowMillon?KodMillon=225) and [snail entry](https://terms.hebrew-academy.org.il/Ktaim/ShowKtaim?kodErekhIvrit=27724). Hebrew speech and pronunciation review live in `dist/speech.js` and `dist/hebrew-pronunciation.js`. Question generation and progress rules are in `dist/engine.js`. Other illustrations are original SVG in `dist/art.js`, animated by `dist/styles.css`. Narration is in `dist/audio.js`; family sync is in `dist/sync.js` and `dist/family-ui.js`. Increase the cache version in `dist/sw.js` for changed assets and regenerate `dist/offline.json` with `npm run prepare-offline`. Workers activate after their complete asset list downloads. Reload a returning tab to use updated code; an in-progress adventure is not forcibly restarted.

The added reading data is in `dist/reading-advanced.js`, its scene renderer in `dist/reading-scenes.js`, and the twelve explorer illustrations in `dist/reading-more-art.js`. Scene facts (object, color, quantity, position and action) share one data source with the reading text. Related choices always stay within one three-picture family. Per-device `readingPractice` history contains only known content IDs, is capped to each stage's vocabulary and updates only when a round is completed. It is separate from shared album progress; it does not send word-level activity to Supabase. The next-stage suggestion uses the completed round's existing assistance count and never forces a move or locks an earlier stage. Additional language checks include the Academy's [ambulance entry](https://terms.hebrew-academy.org.il/munnah/31596_2/ambulance) and [definite article before חתול](https://terms.hebrew-academy.org.il/munnah/119071_1/%D7%A2%D6%B5%D7%99%D7%9F%20%D7%94%D6%B6%D7%97%D6%B8%D7%AA%D7%95%D6%BC%D7%9C).

Rubik is bundled locally under its SIL Open Font License in `dist/assets/FONT-LICENSE.txt`. Gveret Levin's copyright notice and SIL Open Font License are in `dist/assets/GveretLevin-OFL.txt`. No third-party analytics, trackers, advertisements, remote fonts or runtime content services are included.

## Next ideas

Possible future extensions: building Hebrew words from letter tiles, reading simple English words, larger addition totals, and longer illustrated stories.

On iPad/iPhone, Safari and an installed Home Screen app have separate local storage. Start in Safari where existing stickers are visible: open the parent settings, create a family album (or use its existing code), then copy that code into the Home Screen app's parent settings and join the existing album. This imports the real local progress; never reset it to fix pairing. The parent panel includes a copy-code button and this installation guidance. See WebKit's [storage and cookie explanation](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/). A regression test pairs a 26-sticker Safari save to an empty app, reopens both and checks that a further completion yields 27 on both. Browser QA checks two successive Hebrew recognition rounds (ד–ו then ז–ט), saved continuation to י–ל after reload, an independent English A–C round advancing to D–F, and an actual lowercase-l trace that records writing once and resumes at M after reopening.

Handwriting regression checks cover identical model/guide geometry, continuous entry for the reported loops, no font masks, loop-safe pointer movement and sufficient animation time. Browser SVG geometry checks replayed all 27 Hebrew paths and verified their bounds. Visual QA inspected the full alphabet and 0/25/50/75/100 percent frames for ש, ף and ץ; the live demonstrations completed without awarding practice. A real pointer trace followed the entire ש path across repeated lifts and ended in the normal success feedback. Existing progress IDs and recorded audio are unchanged.
