# חבורת ההרפתקאות · Puppy Adventures

Ariel’s learning game for phones, tablets and computers. Ava gives instructions in Hebrew. The app uses vowel marks by default and offers separate paths for listening, reading and writing.

[Play Puppy Adventures](https://puppy-adventures.vercel.app/) · [Illustrated Hebrew and English guide](docs/guide/README.md) · [App review and roadmap](docs/review.md)

## What you can play

| Activity | Practice |
| --- | --- |
| **משימה קטנה להיום** | A six-step return to one skill. Work out when a train leaves by moving the minute hand, or listen to an English animal name and move the right animal to the pond. A worked example leads to a fresh try at the same step. |
| **המסע שלי** | Four chapters with three six-step missions each. Read, add, and set the clock at the picnic. Listen to English on Bobi’s delivery route. Shape, load, test, and sail boats with Luli. Visit the theater to direct a scene, serve party guests, and play with shadows. Bobi offers an optional two-word prompt after independent practice with both words on different days. |
| **תיאטרון החברים** | Guided shows under **המסע שלי**. Put actions in order and watch them play out, prepare cups as friends arrive, and move a puppet between a fixed lamp and screen. **ההצגות שלי** saves the shows you make on the current device. |
| **גינת המילים** | Ten Hebrew stages, from short words to little stories. Choose a matching picture or act out the sentence. A mixed adventure draws from the stages across replays. |
| **סדנת המילים** | Build words from parts and letters, fill gaps and finish short sentences across four stages. |
| **סיפור שמשחקים** | Eight playable Hebrew stories with illustrated choices and actions such as moving objects into place. |
| **מפרץ האנגלית** | Start by listening to one word at a time. Optional routes introduce two-word phrases, first sounds and short written words. |
| **סטודיו האותיות** | Recognize Hebrew handwriting and English lowercase in their own games. Trace and write Hebrew print, Hebrew handwriting, English capitals and English lowercase. |
| **סדנת המספרים** | Count, add, find how many remain, and work with tens and ones. Trace numbers from 0 to 100, write them from Hebrew dictation, or cut fruits into halves. |
| **גן השעונים** | Ten lessons begin with minutes and hours. Move either hand, count individual minutes, and try four levels of clock reading. The first lesson includes an optional real-minute timer. |
| **מעבדת המדע** | Four simulations, each with six steps. Compare oil and water with and without soap, see what floats, melt ice, and watch how soap moves pepper across water. |
| **חברים מהמסך** | Read the Hebrew names of Rubble & Crew and PAW Patrol characters. Play picture-to-name, name-to-picture or a mixture, with three levels per collection. |
| **מחפשות עם פיקאצ׳ו** | Match Hebrew words to pictures, make animals hop, and tap Pikachu for his greeting. |

New scored adventures have six steps. Existing ten-step drafts can be finished at their original length. Each scored completion unlocks one sticker until the 1,000-sticker album is full. Stickers unlock decorations for the puppy park. Open-ended activities such as science, tracing and free clock play have their own practice feedback.

In **בונות סירה עם לולי**, every prediction leads to a water test. The simulation holds the clay mass constant and uses the weight of the water displaced to set the boat’s depth until water reaches the rim. Completed missions share the album’s existing number-adventure totals. [Clay-shape experiment](https://www.acs.org/education/resources/k-8/inquiryinaction/fifth-grade/substances-have-characteristic-properties/lesson-2-4--density-and-sinking-and-floating.html) · [Physics of buoyancy](https://openstax.org/books/university-physics-volume-1/pages/14-4-archimedes-principle-and-buoyancy)

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

```sh
npm run prepare-offline
npm run check
npm test
npm run build
npm run preview
```

Vercel uses `vercel.json` to build the content-hashed game and offline worker in `site/`. The game runs in the browser; Supabase handles family sync when a code is paired. The browser uses only a publishable key, and credentials stay out of the repository. [Earlier releases and developer notes](https://github.com/edanperetz2/puppy-adventures/blob/da704b2b9dc33f1004b4dfb53b3392f3ade1faf7/README.md)
