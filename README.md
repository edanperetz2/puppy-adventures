# חבורת ההרפתקאות · Puppy Adventures

Ariel’s learning game for phones, tablets and computers. Ava gives instructions in Hebrew. The app uses vowel marks by default and offers separate paths for listening, reading and writing.

[Play Puppy Adventures](https://puppy-adventures.vercel.app/) · [Illustrated Hebrew and English guide](docs/guide/README.md) · [App review and roadmap](docs/review.md)

## What you can play

| Activity | Practice |
| --- | --- |
| **משימה קטנה להיום** | Listen to English animal names and move the right animals to the pond in six steps. A worked example leads to a fresh try at the same step. |
| **המסע שלי** | Read and add at the friends’ picnic. Listen for an English word and choose a picture on Bobi’s delivery route. Both chapters have six-step missions. Bobi offers an optional two-word prompt after independent practice with both words on different days. |
| **גינת המילים** | Ten Hebrew stages, from short words to little stories. Read a sentence and choose a picture, act it out, or choose **מתמונה למשפט** to find the written sentence for a picture. The two reading directions save separately. |
| **סדנת המילים** | Build words from parts and letters, fill gaps and finish short sentences across four stages. |
| **סיפור שמשחקים** | Eight playable Hebrew stories with illustrated choices and actions such as moving objects into place. |
| **מפרץ האנגלית** | Listen for one word and choose a picture. The listening library has 106 words. Optional routes introduce two-word phrases, first sounds and short written words. In reading practice, illustrated groups end with matching the printed word to a picture. |
| **סטודיו האותיות** | Match Hebrew print and handwriting or English capitals and lowercase in both directions. In each writing form, trace single letters or write an illustrated word one letter at a time. There are 79 Hebrew words and 68 English words. |
| **סדנת המספרים** | Count objects in rows and frames, add groups including zero, find how many remain, and work with tens and ones. Trace 0–100 or take Hebrew dictation. Dictation also offers single digits, 10–19 and whole tens. Slice fruit to practise halves. |
| **חברים מהמסך** | Read the Hebrew names of Rubble & Crew and PAW Patrol characters, or choose **כולם יחד** to include Pikachu and Stitch. The combined cast grows from 3 to 12 to 17. All three collections support picture-to-name, name-to-picture and mixed rounds. |
| **מחפשות עם פיקאצ׳ו** | Match Hebrew words to pictures, make animals hop, and tap Pikachu for his greeting. |
| **מחפשות עם סטיץ׳** | Match six Hebrew clues to pictures, from a familiar object to its color, quantity or position. Tap Stitch to see him dance and hear a ukulele. Reopen his game to continue on the same device. |

New scored adventures have six steps. Existing ten-step drafts can be finished at their original length. Each scored completion unlocks one sticker until the 1,000-sticker album is full. Stickers unlock decorations for the puppy park. Open-ended activities such as tracing and playing with the two characters have their own practice feedback.

Tap the Pikachu or Stitch sticker on any screen to hear “Pika pika” or Stitch’s ukulele. If Ava is speaking, the last sticker you tapped waits for her to finish. These taps work offline and leave the current question and album as they were.

The home screen offers **ממשיכות** when there’s a round in progress. Otherwise **יוצאות להרפתקה** opens the specific game on the card. The suggestions use recent practice in Hebrew reading, single-word English, and basic numbers. The game map is always available.

In **סיפורים קטנים**, the first clue highlights a detail in the sentence and Ava asks a short question about it. A later step can practice that detail with a different sentence. The clue and picture choices stay with the saved round. Number Workshop remembers which choices were tried and lets Ariel replay a used hint after reopening.

## Save and play offline

Open **להורים** to change sound, motion, vowel marks and practice ranges. Progress starts in the current browser, and the welcome says Ariel on every device. To share her album, create or open the existing **אלבום משפחתי** in the browser that already shows her stickers, then enter that same family code in the other browser or installed app. Paired devices share earned stickers, progress and park decorations. Unfinished rounds and writing ink stay in their originating browser. Keep the family code and pairing link private. [Album security and server limits](SECURITY.md)

Open the game online once to install the offline game and starter sounds. Additional recordings cache as they play. For the complete voice library, use **להורים → משחק בלי אינטרנט → הורדת ההקלטות** on each device. The parent panel shows the download size and when the recordings are ready.

## Develop and deploy

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
