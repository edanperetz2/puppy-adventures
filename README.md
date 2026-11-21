# חבורת ההרפתקאות · Puppy Adventures

Ariel’s learning game for phones, tablets and computers. Ava gives instructions in Hebrew. The app uses vowel marks by default and offers separate paths for listening, reading and writing.

[Play Puppy Adventures](https://puppy-adventures.vercel.app/) · [Illustrated Hebrew and English guide](docs/guide/README.md) · [App review and roadmap](docs/review.md)

## What you can play

| Activity | Practice |
| --- | --- |
| **משימה קטנה להיום** | Listen to English animal names and move the right animals to the pond in six steps. A worked example leads to a fresh try at the same step. |
| **המסע שלי** | Read and add at the friends’ picnic. Listen for an English word and choose a picture on Bobi’s delivery route. Both chapters have six-step missions. Bobi offers an optional two-word prompt after independent practice with both words on different days. |
| **גינת המילים** | Ten Hebrew stages, from short words to little stories. The two matching paths share 1,558 illustrated sentences, including a green balloon under a chair, animals playing instruments and scenes outdoors. Read the sentence in **סיפורים קטנים** or start with the picture in **מתמונה למשפט**. The two paths save separately. |
| **סדנת המילים** | Build words from parts and letters, fill gaps and finish short sentences across four stages. |
| **סיפור שמשחקים** | Eleven playable Hebrew stories with six pages per playthrough. Help Luli draw a picture for Grandma, put on a garden concert or follow Tofi’s treasure map. |
| **מפרץ האנגלית** | Choose **מאנגלית לתמונה** to hear and read English and pick a picture, or **מתמונה לאנגלית** to see a picture and choose the matching words. Each written choice has a listen button. Rounds start with single words and build to color phrases and short sentences. The original listening, sounds and reading activities are also available. |
| **סטודיו האותיות** | Match individual letters in both directions. In the whole-word game, read a word in Hebrew print and choose it in handwriting, or match an English word in capitals to its lowercase spelling. Writing practice also offers single-letter tracing and 79 Hebrew and 68 English illustrated words to write one letter at a time. |
| **סדנת המספרים** | Count objects in rows and frames, add groups including zero, find how many remain, and work with tens and ones. Trace 0–100 or take Hebrew dictation. Dictation also offers single digits, 10–19 and whole tens. Slice fruit to practise halves. |
| **חברים מהמסך** | Read the Hebrew names of Rubble & Crew and PAW Patrol characters, or choose **כולם יחד** to include Pikachu and Stitch. The combined cast grows from 3 to 12 to 17. All three collections support picture-to-name, name-to-picture and mixed rounds. |
| **מחפשות עם פיקאצ׳ו** | Match Hebrew words to pictures, make animals hop, and tap Pikachu for his greeting. |
| **מחפשות עם סטיץ׳** | Match six Hebrew clues to pictures, from a familiar object to its color, quantity or position. Tap Stitch to see him dance and hear a ukulele. Reopen his game to continue on the same device. |

New scored adventures have six steps. Existing ten-step drafts can be finished at their original length. Each scored completion unlocks one sticker until the 1,000-sticker album is full. Tap any earned sticker in the album or on a reward screen to play its reaction. Dogs bark, cats meow, birds chirp and suns shine. Sticker play works offline and follows the sound and motion settings. Stickers also unlock decorations for the puppy park. Open-ended activities such as tracing and playing with the two characters have their own practice feedback.

Tap the Pikachu or Stitch sticker on any screen to hear “Pika pika” or Stitch’s ukulele. If Ava is speaking, the last sticker you tapped waits for her to finish. These taps work offline and leave the current question and album as they were.

The home screen offers **ממשיכות** when there’s a round in progress. Otherwise **יוצאות להרפתקה** opens the specific game on the card. The suggestions use recent practice in Hebrew reading, single-word English, and basic numbers. The game map is always available.

In **סיפורים קטנים**, Ariel can tell the difference between a monkey playing a guitar and the same monkey taking its picture. These everyday scenes also appear in **מתמונה למשפט**. The first clue highlights a detail in the sentence and Ava asks a short question about it. A later step can practice that detail with a different sentence. The clue and picture choices stay with the saved round. Number Workshop remembers which choices were tried and lets Ariel replay a used hint after reopening.

## Save and play offline

Open **להורים** to change sound, motion, vowel marks and practice ranges. Progress starts in the current browser, and the welcome says Ariel on every device. To share her album, create or open the existing **אלבום משפחתי** in the browser that already shows her stickers, then enter that same family code in the other browser or installed app. Paired devices share earned stickers, progress and park decorations. Unfinished rounds and writing ink stay in their originating browser. Keep the family code and pairing link private. [Album security and server limits](SECURITY.md)

Open the game online once to install the offline game and starter sounds. Additional recordings cache as they play. For the complete voice library, use **להורים → משחק בלי אינטרנט → הורדת ההקלטות** on each device. The parent panel shows the download size and when the recordings are ready.

## Develop and deploy

Ava’s Hebrew and English recordings play with a short silent lead-in, including on replay. Reward sounds wait for speech to finish. The offline library stores the reviewed voice masters. The service worker adds the same lead-in used by the release build when serving a recording from the library.

New English recordings default to English-only Ava. The generator keeps approved takes and applies the voice and pace choices in `scripts/english-voice-settings.json`, including multilingual Ava for “coat,” “wheel,” and “I see one boat.” The Hebrew generator uses the reviewed phonetic spelling and take for each recording.

Use Node.js 20 or newer.

```sh
npm ci
npm run dev
```

The development server uses `dist/` as source. Set `PORT` to override 4173. Regenerate the checked-in offline inventories after changing the assets. If testing offline from the development server, update the shell version in `dist/sw.js` when changing the startup assets.

Theater, Luli’s Boatyard, Science Lab and clock activities are paused. Their lessons and saved state are retained. To restore a path, update its setting in `dist/availability.js` and regenerate the bilingual guide from `dist/guide-content.js`.

```sh
npm run prepare-offline
npm run check
npm test
npm run build
npm run preview
```

Vercel uses `vercel.json` to build the content-hashed game and offline worker in `site/`. The game runs in the browser; Supabase handles family sync when a code is paired. The browser uses only a publishable key, and credentials stay out of the repository. [Earlier releases and developer notes](https://github.com/edanperetz2/puppy-adventures/blob/da704b2b9dc33f1004b4dfb53b3392f3ade1faf7/README.md)
