import { WORKSHOP_WORDS, STORIES, JOURNEY_HEBREW_CLIPS } from './journey-content.js';
import { WORD_CONTEXTS } from './word-contexts.js';
import { MORE_PHONICS, BLEND_GROUPS } from './english-expansion.js';
// These isolated renders failed phonetic review. Their approved whole-word
// recording supplies the sound model while the visual tile keeps the word part.
export const WHOLE_WORD_CHUNKS = new Set(["dog:0","snail:0","bat:0","bed:1","crocodile:0","dinosaur:0","dinosaur:1","dinosaur:2","dinosaur:3","duck:1","gift:1","leopard:0","notebook:2","pan:2","pants:2","parrot:1","peach:0","pear:0","pineapple:0","scissors:1","socks:1","spider:0","spider:1","spider:2","suitcase:1","telescope:0"]);
export const chunkClip = (id,index) => WHOLE_WORD_CHUNKS.has(`${id}:${index}`)?`he-${id}`:`journey-chunk-${id}-${index}`;
export const GIVING_CLIPS = {
  1: 'journey-give-one-apple',
  2: 'journey-give-two-apples',
  3: 'journey-give-three-apples',
};
export function installJourneyClips(clips) {
  for(const [id,clip] of Object.entries(JOURNEY_HEBREW_CLIPS))clips[id]={lang:'he-IL',...clip};
  const giving = [
    ['נִתֵּן לְלוּלִי תַּפּוּחַ אֶחָד. נִגַּע בּוֹ.', 'nitˈen lelˈuli tapˈuaχ ʔeχˈad. niɡˈa bˈo.'],
    ['נִתֵּן לְלוּלִי שְׁנֵי תַּפּוּחִים. נִגַּע בַּתַּפּוּחִים, אֶחָד אֶחָד.', 'nitˈen lelˈuli ʃnˈej tapuχˈim. niɡˈa batapuχˈim, ʔeχˈad ʔeχˈad.'],
    ['נִתֵּן לְלוּלִי שְׁלוֹשָׁה תַּפּוּחִים. נִגַּע בַּתַּפּוּחִים, אֶחָד אֶחָד.', 'nitˈen lelˈuli ʃloʃˈa tapuχˈim. niɡˈa batapuχˈim, ʔeχˈad ʔeχˈad.'],
  ];
  giving.forEach(([text, speech], index) => {
    clips[GIVING_CLIPS[index + 1]] = { lang: 'he-IL', text, speech };
  });
  clips['journey-apples-left'] = {
    lang: 'he-IL',
    text: 'עַכְשָׁו נִסְפֹּר אֶת הַתַּפּוּחִים שֶׁנִּשְׁאֲרוּ. כַּמָּה נִשְׁאֲרוּ?',
    speech: 'ʔaχʃˈav nispˈoʁ ʔˈet hatapuχˈim ʃeniʃʔaʁˈu. kˈama niʃʔaʁˈu?',
  };
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
  for(const text of [...MORE_PHONICS.map(p=>p.word),...BLEND_GROUPS.flat(),...['yellow','green','pink','purple','orange','white','black','brown'].flatMap(color=>['ball','car'].map(object=>`${color} ${object}`))]) {
    const key=`journey-en-${text.replaceAll(' ','-')}`;
    if(!clips[key])clips[key]={lang:'en-US',text};
  }
}
