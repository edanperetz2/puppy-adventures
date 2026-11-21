// Within each family the same animal does the same thing beside a different landmark.
const animals = [
  ['rabbit', 'הארנב קופץ', 'הָאַרְנָב קוֹפֵץ', 'haʔaʁnˈav kofˈets', 'jump'],
  ['turtle', 'זוחל צב', 'זוֹחֵל צָב', 'zoχˈel tsˈav', 'crawl'],
  ['snail', 'זוחל שבלול', 'זוֹחֵל שַׁבְּלוּל', 'zoχˈel ʃablˈul', 'crawl'],
  ['dog', 'הכלב הולך', 'הַכֶּלֶב הוֹלֵךְ', 'hakˈelev holˈeχ', 'walk'],
  ['bird', 'הציפור עפה', 'הַצִּפּוֹר עָפָה', 'hatsipˈoʁ ʔafˈa', 'fly'],
  ['butterfly', 'הפרפר עף', 'הַפַּרְפַּר עָף', 'hapaʁpˈaʁ ʔˈaf', 'fly'],
];
const landmarks = [
  ['tree', 'העץ', 'הָעֵץ', 'haʔˈets'],
  ['flower', 'הפרח', 'הַפֶּרַח', 'hapˈeʁaχ'],
  ['mushroom', 'הפטרייה', 'הַפִּטְרִיָּה', 'hapitʁijˈa'],
  ['rock', 'הסלע', 'הַסֶּלַע', 'hasˈela'],
];
export const NATURE_STORIES = animals.flatMap(([object, subject, pointed, ipa, action]) =>
  landmarks.map(([anchor, name, pointedName, spokenName]) => {
    const sentence = (actor, place) => action === 'crawl' ? `${place} ${actor}.` : `${actor} ${place}.`;
    return {
      id: `nature-${object}-${anchor}`, level: 10, family: `nature-${object}`,
      he: sentence(subject, `ליד ${name}`), pointed: sentence(pointed, `לְיַד ${pointedName}`),
      spoken: sentence(ipa, `lejˈad ${spokenName}`), scene: { kind: 'nature', object, action, anchor },
    };
  }));

export const CAPTION_PROMPT = 'reading-caption-prompt';
export const CAPTION_HINT = 'reading-caption-hint';
export const CAPTION_CLIPS = {
  [CAPTION_PROMPT]: { lang: 'he-IL', text: 'אֵיזֶה מִשְׁפָּט מַתְאִים לַתְּמוּנָה?', speech: 'ʔˈejze miʃpˈat matʔˈim latmunˈa?' },
  [CAPTION_HINT]: { lang: 'he-IL', text: 'בּוֹאִי נִשְׁמַע מָה רוֹאִים בַּתְּמוּנָה.', speech: 'boˈi niʃmˈa mˈa ʁoʔˈim batmunˈa.' },
};
