import test from 'node:test';
import assert from 'node:assert/strict';
import { clearListeningOptions, distinctSpokenWords } from '../dist/english-listening-contrast.js';

test('English listening separates similar openings, rhymes and overlapping spoken labels in either direction', () => {
  for (const [a,b] of [
    ['boat','ball'], ['BOAT','bucket'], ['ball','balloon'], ['bowl','ball'], ['dog','duck'],
    ['goat','boat'], ['parrot','carrot'], ['ship','sheep'], ['bear','pear'], ['tree','three'],
    ['pen','pan'], ['purple','pink'], ['brown','blue'], ['orange-fruit','orange'],
    ['monkey','donkey'], ['melon','lemon'], ['fire truck','firetruck'],
    [3,'three'], ['4','fourteen'], ['fourteen','fifteen'], ['swim','swims'],
  ]) {
    assert.equal(distinctSpokenWords(a,b), false, `${a}/${b}`);
    assert.equal(distinctSpokenWords(b,a), false, `${b}/${a}`);
  }
  for (const [a,b] of [
    ['dog','cat'], ['boat','kite'], ['boat','drum'], ['blue','red'], ['pink','green'],
    ['sleep','swim'], ['circle','square'], ['square','triangle'], ['circle','triangle'],
    ['flower','sun'], ['one','two'], [1,3], ['2','3'],
  ]) {
    assert.ok(distinctSpokenWords(a,b), `${a}/${b}`);
    assert.ok(distinctSpokenWords(b,a), `${b}/${a}`);
  }
});

test('listening preserves safe slots and finds an alternative that sounds and looks different from every choice', () => {
  const [ship,boat,ball,door,cat,dog] = ['ship','boat','ball','door','cat','dog'].map(id => ({id}));
  const options = [cat,boat,door];
  assert.equal(clearListeningOptions(options,boat,()=>assert.fail('safe board needed no repair')),options);
  assert.deepEqual(clearListeningOptions([ball,boat,dog],boat,[boat,ship,door,cat]),[cat,boat,dog]);
});
