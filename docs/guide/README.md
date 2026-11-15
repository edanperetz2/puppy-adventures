# Bilingual game guide

The in-game guide uses [game-guide-current.webp](../../dist/assets/game-guide-current.webp). The image shows the current activity map with English on pale blue at the left and Hebrew on cream at the right. [Guide text](../../dist/guide-content.js) records both editions of the copy. Little Stories and My Journey share their copy with the [game's activity definitions](../../dist/activities.js). The original posters and verification records below are release history.

## Original edition

The original image is `dist/assets/game-guide.png`, with English on pale blue at the left and Hebrew on warm cream at the right. The source PNGs are `guide-en.png` and `guide-he.png`. English letters, words and arithmetic keep their natural left-to-right order.

The original edition illustrated ten-question scored adventures, ten-page stories and the 1,458 reading targets available at that release.

The original overview was generated with the built-in image tool; the English background was tinted with the prompt in `english-background-prompt.txt`. The final combined image is a **lossless assembly**, rather than the lower-resolution generated composition: `scripts/prepare-game-guide.ps1` copies both original-size posters onto one 2172 × 1448 canvas and compares the decoded pixel hashes of both halves with the sources. `scripts/game-guide-image-review.json` records those checks.

The content and Hebrew review JSON files retain the export filenames of the previously reviewed standalone diagrams. `guide-he.png` is that reviewed Hebrew export; `guide-en.png` is the reviewed English export with the subsequent background tint. The listed counts and features remain the same in app version 2.1.2.

Validation: all 129 existing tests and the curriculum/audio/syntax checks pass. An isolated profile on a protected Vercel preview verified first-visit access, 320/390/820-pixel layouts, Hebrew and English jumps, zoom, full-image view, Escape/focus return and preservation of an in-progress counting question including the counted object. The guide, image and stylesheet are included in the offline manifest. No album or database schema is changed.
