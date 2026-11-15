# Puppy Adventures review · 2.8.0

## Curriculum and play

| Area | What the review covered |
| --- | --- |
| Hebrew reading | All ten stages and mixed review, including picture choices and acting out a sentence. Inventory and test checks cover 1,477 targets, including 666 short sentences, as well as their picture facts, distractors and narration IDs. |
| Hebrew words and stories | All four Word Workshop stages and all eight playable stories. The workshop has 64 words. Browser rounds included building a word, filling a missing letter and moving an object in a scene. |
| English | Single-word listening, the classic vocabulary game, two-word combinations, initial sounds and blending. The first screen now groups these in teaching order. |
| Letters | Hebrew and English recognition, all four writing forms, and the tracing, copying, memory and paper activities. Automated checks cover the 26 English letters, 22 Hebrew letters and five Hebrew final forms. |
| Numbers | Counting, adding, taking away and tens/ones. Checked the number-writing and hidden-answer dictation flows and all six fruit-cutting challenges. Both writing paths cover 0–100. |
| Clocks | All ten lesson entries, the 60-minute model, changes of one minute on the free clock, and full rounds at each of the four quiz levels. Automated checks cover hand angles, exact minutes, guided practice and saved lessons. |
| Science | All six steps in each of the four simulations, including predictions and observed results. The pepper activity compares a water drop with a drop of soap. [American Chemical Society explanation of surface tension](https://www.acs.org/middleschoolchemistry/lessonplans/chapter5/lesson2.html) |
| Characters and Pikachu | Both character collections, their six levels and all directions of name matching. Image checks use the credited source files. Played Pikachu matching and the hop interaction. |
| Album and park | Earned stickers and reopened a park decoration in a browser fixture that began with 26 stickers. Family pairing, older clients, retries and the album limit are covered by automated tests. Production family data was outside the test fixture. |

New scored rounds use six steps. The compatibility tests also cover saved ten-step rounds. Automated checks verify answer shuffling, distinct questions, and valid saved choices. The browser runs exercise representative content within the paths above. The release has 176 passing automated tests. The asset check verifies the scripts and hashes of 2,627 narrated MP3s. The existing phonetic diagnostics give a listening shortlist, including short Hebrew letter names and the nine-minute clip. The review covered supported layouts with browser emulation. Listening to the flagged clips and testing physical iPad and Android devices are still open.

## First release

- Replaced the old bilingual guide with a current overview that includes Science Lab, Pikachu and the number-writing activities. Clarified which activities earn stickers and when the alphabet games introduce reading.
- Fixed placement targets in Little Stories with reduced motion. Closing settings now preserves an open clock, writing pad or Pikachu session. Enlarged the text used for instructions and progress.
- Replaced continuous home motion and screen-wide confetti with brief feedback around the selected answer or earned sticker. Science and story motion ends with the outcome visible. The app respects both the browser’s reduced-motion preference and the in-game motion setting. [Web.dev animation guidance](https://web.dev/articles/animations-guide)
- Bundled startup JavaScript and CSS, compressed the local fonts, and made the complete audio pack an explicit offline download. New recordings cache on demand. An older installed copy can reuse the recordings it already has when their bytes still match. [Web.dev service worker caching guidance](https://web.dev/articles/service-worker-caching-and-http-caching)

| Cold start in Chrome | Previous release | 2.8.0 |
| --- | ---: | ---: |
| Median time until the home heading rendered | 3.1 s | 1.7 s |
| Median Largest Contentful Paint | 3.6 s | 2.2 s |
| Startup JavaScript and stylesheet requests | 87 JS and 20 CSS | 1 JS and 1 CSS |
| Transfer through first offline setup | 61 MB | About 3.6 MB |
| Recordings fetched on first visit | 2,628 | 11 |

Timing compares three fresh visits per version on the same 390-pixel phone emulation with 80 ms latency, 360 KB/s throughput and CPU throttled 4×. Transfer through offline setup was measured separately with registration enabled. The test also downloaded the entire library on request and upgraded an installed copy, then played recordings offline and reopened the existing 26-sticker fixture.

## Recommended order for the next changes

1. **Define the activity catalog once.** Give each activity a stable ID and a short description of what it teaches, its entry route, narration, and whether it awards a sticker. Drive the home, guide, recommended activity and browser tests from that catalog. Today those surfaces describe the same games independently, which is how old guide claims survived changes to the app. Use the catalog to give Browser Back and direct links a consistent destination.
2. **Share the round lifecycle, then split by subject.** The main entry currently owns routing, rendering, settings, draft management and reward decisions. Scored games need one contract for starting, checkpointing, resuming and awarding exactly once. Clock lessons and open-ended play can keep their own completion rules. Keep the existing save keys and identifiers while moving one game at a time, beginning with a scored path. Test old rounds, reload, a second tab, and delayed sync before migrating the next path.
3. **Make the child’s next step clear.** Keep the map open for choice. Put the best next activity beside any resume choice and explain it in one short line or voice prompt. Use recent independent answers to decide when to suggest an easier example, a different review item or a harder stage. Continue offering optional English reading after listening. [What Works Clearinghouse guide to early math progression](https://ies.ed.gov/ncee/WWC/PracticeGuide/18)
4. **Load each subject when chosen and sharpen its feedback.** Once catalog and save contracts are in place, split the larger story and reading banks behind their activity entry points. Measure first screen and first round separately. Use an animation to explain a change, such as a hand moving one tick or soap moving the pepper. Give movable objects large targets and a tap-select/tap-place option. [W3C guidance on alternatives to dragging](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements)
