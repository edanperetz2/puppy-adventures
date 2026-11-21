// The same foreground objects appear in several stories. Show the action
// with the scenery and the character's position, even on a still screen.
const floor = '<ellipse cx="100" cy="171" rx="87" ry="10" fill="#d9d7ba" opacity=".65"/>';
const sea = '<path d="M5 114q25-8 46-2t51 0t51 0t42-1v32q-32 7-71-1t-71 0t-48-1Z" fill="#90d6d8"/><path d="M15 142q46-9 85 1t85-2q-16 36-83 36t-87-35Z" fill="#efd8a7"/>';
const musicNotes = '<g fill="#9375ae"><path d="M138 29v25q-10-1-11 7q0 8 10 5q6-2 5-9V41l13-4v12q-10-1-11 7q0 8 10 5q6-2 5-9V22Z"/><path d="M67 36v15q-8-1-9 5q0 7 8 5q6-2 5-7V43l7 2v-7Z"/></g>';

export function readingMomentArt({ object, action, prop }, at) {
  const character = (x, y, size) => {
    const figure = at(object, x, y, size);
    return object === 'monkey' || object === 'mouse'
      ? `<g transform="translate(${2 * x + size} 0) scale(-1 1)">${figure}</g>`
      : figure;
  };
  const item = (x, y, size) => at(prop, x, y, size);
  switch (action) {
    case 'draw':
      return floor
        + '<path d="m105 107-17 61m56-60 23 60m-38-57 3 45" fill="none" stroke="#a47c5d" stroke-width="7" stroke-linecap="round"/><rect x="83" y="37" width="103" height="89" rx="4" fill="#fffcf0" stroke="#b88f69" stroke-width="4"/><path d="M79 126h110" stroke="#956f52" stroke-width="6" stroke-linecap="round"/>'
        + item(96, 39, 79) + character(6, 83, 94)
        + '<path d="m68 130 32-27 5 6-32 27-10 4Z" fill="#e7aa56" stroke="#a57344" stroke-width="1.5"/><path d="m101 103 9-3-5 9Z" fill="#555167"/>';
    case 'photo':
      return (prop === 'dolphin' ? sea : floor) + item(107, 36, 81)
        + '<path d="M104 60V35h21m42 0h21v25m0 31v25h-21m-42 0h-21V91" stroke="#7ba99e" stroke-width="3" fill="none" stroke-linecap="round"/>'
        + character(3, 76, 107) + at('camera', 62, 98, 49)
        + '<path d="m88 71-8 15h8l-3 12 16-18h-11l6-10Z" fill="#ebba5d"/>';
    case 'wrap':
      return floor + character(2, 56, 109)
        + '<path d="m72 135 23-32 37 12 37-15 26 28-35 34-50 1Z" fill="#f4ceac" stroke="#c6947b" stroke-width="2.5"/>'
        + item(98, 68, 75)
        + '<path d="m72 135 33 6 24 16 31-16 35-13-24 43-62 3Z" fill="#e8a39d"/><path d="m124 154 8 19h13l-7-23Z" fill="#ae677e"/><path d="M133 154q-22-17-19-1q4 8 19 1q14-20 19-8q2 8-19 8Z" fill="#cb748a"/>';
    case 'pack':
      return floor + character(4, 59, 110)
        + '<path d="M127 98V83q0-12 13-12t13 12v15m-47 35q-13 0-11 24t18 12m56-36q21-7 18 16t-16 21" fill="none" stroke="#598a89" stroke-width="6"/>'
        + '<path d="M102 116q1-20 32-20t40 20v46q0 12-12 12h-48q-13 0-13-13Z" fill="#70b4ad"/><ellipse cx="138" cy="116" rx="35" ry="10" fill="#345e64"/>'
        + item(102, 64, 71)
        + '<path d="M103 117q34 16 70 0v41q0 16-12 16h-49q-11 0-10-17Z" fill="#8ac3b8"/><rect x="113" y="138" width="50" height="25" rx="6" fill="#539b97"/><path d="M115 144h46" stroke="#e9dbab" stroke-width="3"/>';
    case 'music':
      return floor + musicNotes + character(10, 50, 127)
        + (prop === 'flute' ? item(118, 34, 78)
          : prop === 'trumpet' ? item(114, 104, 85)
          : item(78, prop === 'drum' ? 106 : 84, 95));
    case 'kite':
      return (object === 'cat' ? sea : floor)
        + '<path d="M65 134q51-10 82-75" fill="none" stroke="#917b86" stroke-width="2.5"/><path d="M54 38q19-8 35-3m-59 17q24-4 40-1" fill="none" stroke="#b5d6d3" stroke-width="4" stroke-linecap="round"/>'
        + item(108, 9, 82) + character(4, 86, 97);
    case 'carry':
      if (object === 'bird') {
        // Join the stem or quill to the tip of the bird's beak at (141,84).
        const beakful = prop === 'leaf'
          ? '<path d="M148 88q27-10 39 20-27 6-39-20Z" fill="#8ab56c"/><path d="m139 83 40 22m-17-10 4-5m4 10 7-2" fill="none" stroke="#648853" stroke-width="2.8" stroke-linecap="round"/>'
          : '<path d="M148 80q4-22 37-30 3 24-22 30l5-6-8 6Z" fill="#bd896b"/><path d="M139 84q21-8 40-28m-22 17 1-7m7 2 8-1" stroke="#8c6856" stroke-width="2.8" stroke-linecap="round" fill="none"/>';
        return floor + character(8, 28, 138) + beakful + at('nest', 108, 126, 67);
      }
      if (prop === 'flashlight') {
        return '<rect x="8" y="23" width="184" height="152" rx="44" fill="#626882"/><g fill="#f5dea5"><circle cx="32" cy="51" r="2"/><circle cx="142" cy="39" r="3"/><circle cx="166" cy="61" r="2"/></g><path d="m109 110 69-66 10 61-69 13Z" fill="#ffedb3"/>'
          + character(13, 46, 126) + `<g transform="rotate(88 112 119)">${item(81, 91, 63)}</g>`;
      }
      return floor + (prop === 'cake' ? at('balloon', 139, 18, 55) : '')
        + character(10, 44, 133) + item(80, 91, 85)
        + '<path d="m14 137 14-2m-10 16 11-1" fill="none" stroke="#c4aa91" stroke-width="3" stroke-linecap="round"/>';
    case 'hide':
      if (object === 'mouse') return floor + character(76, 33, 103) + item(23, 72, 135);
      return floor + character(22, 48, 108) + item(56, 51, 135);
    case 'peck':
      return floor + item(108, 111, 70)
        + `<g transform="rotate(36 125 127)">${character(2, 71, 134)}</g>`
        + '<path d="m140 106 4-7m3 12 7-3" stroke="#ce966a" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
    case 'rest':
      return floor + item(31, 76, 145) + character(42, 24, 109);
    case 'wash':
      return floor + character(3, 75, 94)
        + '<path d="M175 110V51q0-12-13-12h-12q-12 0-12 15v9" fill="none" stroke="#819da6" stroke-width="10"/><path d="M138 66v29m5-28v25" stroke="#71c5dc" stroke-width="4" stroke-linecap="round"/><ellipse cx="132" cy="132" rx="56" ry="14" fill="#92cbd2"/>'
        + item(99, 83, 68)
        + '<path d="M76 132q53 18 112 0l-9 23q-7 12-19 12h-58q-12-1-17-12Z" fill="#b5e0e0" stroke="#82b7c1" stroke-width="3"/><g fill="#f5ffff" stroke="#7bbcc9" stroke-width="2"><circle cx="92" cy="125" r="5"/><circle cx="171" cy="123" r="5"/><circle cx="163" cy="128" r="3"/></g>';
    case 'dream':
      return '<path d="M22 44q8 13 21 11-7 12-19 8t-2-19Z" fill="#e4bf6d"/><path d="M86 42q-3-18 17-22q12-14 30-3q21-11 33 5q21-1 22 18q14 17-2 30q-8 17-29 12q-17 10-36 1q-28 7-36-12q-18-14 1-29Z" fill="#fbf6ff" stroke="#b4a3c8" stroke-width="3"/>'
        + item(110, 20, 66)
        + '<g fill="#efe6f5" stroke="#b4a3c8" stroke-width="2"><circle cx="80" cy="85" r="6"/><circle cx="70" cy="96" r="3"/></g>'
        + character(14, 91, 88)
        + '<path d="M13 161q17-13 38-8q13-5 38-11q23-2 49 19v14H13Z" fill="#99bac8"/><path d="M16 165q17-8 32-5" fill="none" stroke="#d6e5e9" stroke-width="4"/>';
    case 'find':
      return sea + character(7, 70, 105) + item(111, 109, 59)
        + '<g stroke="#cf9b48" stroke-width="3" stroke-linecap="round"><path d="m119 107-7-7m24 0-1-9m19 14 5-8"/></g>';
  }
}
