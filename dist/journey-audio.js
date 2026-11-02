import { WORKSHOP_WORDS, STORIES, JOURNEY_HEBREW_CLIPS } from './journey-content.js';
import { WORD_CONTEXTS } from './word-contexts.js';
// These isolated renders failed phonetic review. Their approved whole-word
// recording supplies the sound model while the visual tile keeps the word part.
export const WHOLE_WORD_CHUNKS = new Set(['dog:0','snail:0']);
export const chunkClip = (id,index) => WHOLE_WORD_CHUNKS.has(`${id}:${index}`)?`he-${id}`:`journey-chunk-${id}-${index}`;
export function installJourneyClips(clips) {
  for(const [id,clip] of Object.entries(JOURNEY_HEBREW_CLIPS))clips[id]={lang:'he-IL',...clip};
  clips['journey-build-quantity']={lang:'he-IL',text:'נִבְנֶה כַּמּוּת כְּמוֹ שֶׁמַּרְאֶה הַמִּסְפָּר.',speech:'nivnˈe kamˈut kmˈo ʃemaʁʔˈe hamispˈaʁ.'};
  clips['journey-ten-model']={lang:'he-IL',text:'בְּכָל מוֹט יֵשׁ עֶשֶׂר יְחִידוֹת. נִסְפֹּר אֶת הָעֲשָׂרוֹת וְאֶת הַיְּחִידוֹת.',speech:'beχˈol mˈot jˈeʃ ʔˈeseʁ jeχidˈot. nispˈoʁ ʔˈet haʔasaʁˈot veʔˈet hajeχidˈot.'};
  clips['journey-context-intro']={lang:'he-IL',text:'נִקְרָא מִשְׁפָּט קָטָן. אֵיזוֹ מִלָּה חֲסֵרָה?',speech:'nikʁˈa miʃpˈat katˈan. ʔˈejzo milˈa χaseʁˈa?'};
  for(const word of WORKSHOP_WORDS){
    word.chunks.forEach((chunk,i)=>{if(!WHOLE_WORD_CHUNKS.has(`${word.id}:${i}`))clips[`journey-chunk-${word.id}-${i}`]={lang:'he-IL',text:chunk.text,speech:`${chunk.speech}, ${chunk.speech}. hamilˈa hˈi: ${clips[`he-${word.id}`].speech.replace(/^hamilˈa hˈi /u,'')}`};});
    const context=WORD_CONTEXTS[word.id];clips[`journey-context-${word.id}`]={lang:'he-IL',text:`${context.before} ${clips[`he-${word.id}`].text} ${context.after}`.trim(),speech:context.speech};
  }
  for(const story of STORIES)story.pages.forEach((page,i)=>{
    clips[`journey-story-${story.id}-${i}`]={lang:'he-IL',text:page.text,speech:page.speech};
    clips[`journey-story-${story.id}-${i}-prompt`]={lang:'he-IL',text:page.prompt,speech:page.promptSpeech};
  });
  clips['journey-phonics-intro']={lang:'he-IL',text:'נַקְשִׁיב לַצְּלִיל הָרִאשׁוֹן בְּתוֹךְ הַמִּלָּה. נַתְחִיל לְאַט וּבְיַחַד.',speech:'nakʃˈiv latslˈil haʁiʃˈon betˈoχ hamilˈa. natχˈil leʔˈat uvejˈaχad.'};
  for(const text of ['red ball','blue ball','red car','blue car','ball','car','fan','man','fin','sun','mouse','apple','nose','insect'])clips[`journey-en-${text.replaceAll(' ','-')}`]={lang:'en-US',text};
}
