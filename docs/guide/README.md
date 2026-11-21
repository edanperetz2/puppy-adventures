# Bilingual game guide

The in-game guide uses [game-guide-current.webp](../../dist/assets/game-guide-current.webp). The image shows the current activity map with English on pale blue at the left and Hebrew on cream at the right. [Guide text](../../dist/guide-content.js) records both editions of the copy. Little Stories and My Journey share their copy with the [game's activity definitions](../../dist/activities.js). The original posters and verification records below are release history.

The Stitch portrait on the home screen and in the guide uses the smiling seated illustration from Disneyclips. The character belongs to Disney. The illustration is credited in the parent settings and bundled locally for offline play. [Stitch illustrations and non-commercial use terms](https://www.disneyclips.com/images/lilostitch.html)

The paused Luli chapter’s [harbor illustration](../../dist/assets/boatyard-harbor.webp) was made with the built-in ImageGen tool.

> Illustrate a peaceful lakeside boat workshop for a five-year-old’s learning game. Wide landscape storybook illustration. A honey-colored wooden jetty and a little workshop sit on the right among reeds and pine trees. Calm blue water fills the center and left, with soft late-afternoon light and a clear horizon. Use warm paper-grain gouache, rounded shapes, and a muted palette of teal, cream, coral, and amber. Leave open water in the middle for the game’s boat animation. Avoid characters, boats, words, logos, and interface elements.

## Theater backdrop

The [theater backdrop](../../dist/assets/theater-stage.webp) was made with the built-in ImageGen tool.

> Use case: illustration-story. A landscape background for a Hebrew children's puppet-theater game. Make a welcoming little wooden theater seen straight-on at stage level, with soft dusty-coral curtains gathered only at the far sides and an amber wood floor occupying the lower third. Leave the middle 70 percent completely open and calm, with a light dusty lilac painted back wall and clear floor, so movable puppets, props, and a small door can be overlaid in the game. Frame the playable area with a rounded honey-colored proscenium, soft warm stage lighting and a few tiny painted stars at the very top corners. Refined contemporary children's picture-book gouache, subdued terracotta, plum, honey and cream, subtle paper grain, soft edges, uncluttered readable forms. Wide 16:9 composition, frame visible, no foreground seats, no characters, no props, no closed curtain across the stage, no lettering, no icons, no logos, no watermark.

## Original edition

The original image is `dist/assets/game-guide.png`, with English on pale blue at the left and Hebrew on warm cream at the right. The source PNGs are `guide-en.png` and `guide-he.png`. English letters, words and arithmetic keep their natural left-to-right order.

The original edition illustrated ten-question scored adventures, ten-page stories and the 1,458 reading targets available at that release.

The original overview was generated with the built-in image tool; the English background was tinted with the prompt in `english-background-prompt.txt`. The final combined image is a **lossless assembly**, rather than the lower-resolution generated composition: `scripts/prepare-game-guide.ps1` copies both original-size posters onto one 2172 × 1448 canvas and compares the decoded pixel hashes of both halves with the sources. `scripts/game-guide-image-review.json` records those checks.

The content and Hebrew review JSON files retain the export filenames of the previously reviewed standalone diagrams. `guide-he.png` is that reviewed Hebrew export; `guide-en.png` is the reviewed English export with the subsequent background tint. The listed counts and features remain the same in app version 2.1.2.

Validation: all 129 existing tests and the curriculum/audio/syntax checks pass. An isolated profile on a protected Vercel preview verified first-visit access, 320/390/820-pixel layouts, Hebrew and English jumps, zoom, full-image view, Escape/focus return and preservation of an in-progress counting question including the counted object. The guide, image and stylesheet are included in the offline manifest. No album or database schema is changed.
