import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../dist/engine.js';
import { READING_LEVELS, finishReadingPractice, sanitizeReadingPractice } from '../dist/reading.js';
import { clockConceptRank } from '../dist/clock.js';

function seeded(seed) {
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}
const phases = ['warmup', 'warmup', 'practice', 'practice', 'challenge', 'challenge'];

test('Every scored adventure has two warm-up, two practice and two challenge steps', () => {
  for (const mission of ['hebrew', 'english', 'math', 'clock', 'letters', 'characters']) {
    assert.deepEqual(createSession(mission, {}, seeded(17)).map(q => q.phase), phases);
  }
});

test('Mixed reading keeps six steps ascending while covering all ten stages across replays', () => {
  let practice = sanitizeReadingPractice(null);
  const seen = new Set();
  for (let round = 0; round < 20; round++) {
    const questions = createSession('hebrew', { reading: 'all', readingRecent: practice.recent.all }, seeded(round));
    assert.deepEqual(questions.map(q => q.word.level), round % 2 === 0 ? [1, 3, 5, 6, 8, 10] : [2, 4, 5, 7, 9, 10]);
    for (const q of questions) {
      assert.ok(!seen.has(q.answer), 'Each stage has at least twenty targets before review is needed');
      seen.add(q.answer);
    }
    practice = sanitizeReadingPractice(JSON.parse(JSON.stringify(finishReadingPractice(practice, 'all', questions.map(q => q.word)))));
  }
});

test('Selected reading stages order smaller quantities and shorter text before harder targets', () => {
  const length = word => word.pointed.replace(/[^א-ת]/gu, '').length;
  for (const key of Object.keys(READING_LEVELS).filter(key => key !== 'all')) {
    for (let seed = 0; seed < 30; seed++) {
      const questions = createSession('hebrew', { reading: key }, seeded(seed));
      for (let i = 1; i < questions.length; i++) {
        const before = questions[i - 1].word, after = questions[i].word;
        if (before.scene?.count !== after.scene?.count) assert.ok((before.scene?.count || 0) <= (after.scene?.count || 0));
        else if (before.he.split(' ').length !== after.he.split(' ').length) assert.ok(before.he.split(' ').length <= after.he.split(' ').length);
        else assert.ok(length(before) <= length(after));
      }
    }
  }
});

test('English progresses from familiar animals, basic colors and small numbers within the selected cap', () => {
  const nextAnimals = new Set();
  for (const max of [10, 20]) for (let seed = 0; seed < 80; seed++) {
    const questions = createSession('english', { englishMax: max }, seeded(seed));
    const animals = questions.filter(q => q.kind === 'animal').map(q => q.answer);
    assert.ok(['dog', 'cat', 'fish'].includes(animals[0]));
    assert.ok(['bird', 'duck', 'bear', 'horse', 'rabbit', 'lion'].includes(animals[1]));
    nextAnimals.add(animals[1]);
    assert.equal(new Set(animals).size, 2);
    const colors = questions.filter(q => q.kind === 'color').map(q => q.answer);
    assert.ok(['red', 'blue', 'yellow'].includes(colors[0]));
    assert.ok(colors.slice(1).every(id=>['green','pink','purple','orange'].includes(id)));
    assert.equal(new Set(colors).size, 2);
    const numbers = questions.filter(q => q.kind === 'number').map(q => q.target.number);
    assert.ok(numbers[0] >= 1 && numbers[0] <= 3);
    assert.ok(numbers[1] >= 4 && numbers[1] <= max);
  }
  assert.equal(nextAnimals.size, 6, 'Both familiar animals and the next new animal appear across replays');
});

test('Arithmetic never drops back to easier sums, reaches the chosen cap and avoids duplicate additions', () => {
  for (const max of [5, 10, 20]) for (let seed = 0; seed < 80; seed++) {
    const questions = createSession('math', { mathMax: max }, seeded(seed));
    assert.ok(questions.slice(0,2).every(q=>q.type==='count'&&q.total>=1&&q.total<=4));
    assert.equal(new Set(questions.slice(0,2).map(q=>q.total)).size,2);
    const additions = questions.slice(2);
    assert.equal(new Set(additions.map(q => `${Math.min(q.a, q.b)}+${Math.max(q.a, q.b)}`)).size, 4);
    assert.ok(additions.every(q => q.type === 'add' && q.a + q.b === q.total && q.total <= max));
    assert.equal(additions.at(-1).total, max);
    for (let i = 1; i < questions.length; i++) assert.ok(questions[i].total >= questions[i - 1].total);
    for (let i = 1; i < additions.length; i++) if (additions[i].total === additions[i - 1].total) {
      assert.ok(Math.min(additions[i].a, additions[i].b) >= Math.min(additions[i - 1].a, additions[i - 1].b));
    }
  }
});

test('Clocks introduce whole hours, halves, quarter past and quarter to without showing future concepts early', () => {
  const conceptOrder = [0, 30, 15, 45];
  for (const level of ['hours', 'halves', 'quarters']) for (let seed = 0; seed < 80; seed++) {
    const questions = createSession('clock', { clockLevel: level }, seeded(seed));
    const expected = level === 'hours' ? [0] : level === 'halves' ? [0, 30] : conceptOrder;
    assert.deepEqual([...new Set(questions.map(q => q.time.minute))], expected);
    assert.equal(new Set(questions.map(q => q.time.hour)).size, 6);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i], rank = conceptOrder.indexOf(q.time.minute);
      if (i) assert.ok(rank >= conceptOrder.indexOf(questions[i - 1].time.minute));
      assert.ok(q.options.every(option => conceptOrder.indexOf(option.minute) <= rank));
    }
  }
});

test('The minute-reading adventure increases difficulty and reaches every individual minute',()=>{
  const seen=new Set();
  for(let seed=0;seed<400;seed++){
    const questions=createSession('clock',{clockLevel:'minutes'},seeded(seed));
    assert.equal(questions.length,6);
    for(let i=0;i<questions.length;i++){
      const q=questions[i],rank=clockConceptRank(q.time.minute);seen.add(q.time.minute);
      if(i)assert.ok(rank>=clockConceptRank(questions[i-1].time.minute));
      assert.ok(q.options.every(option=>clockConceptRank(option.minute)<=rank));
    }
  }
  assert.equal(seen.size,60);
});
