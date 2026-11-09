// End screen progress test: runProgress gives a bar each for Rank, Echoes and Titles, sane numbers and one next goal,
// for a new save, a save with a trial waiting, and a save with every Echo unlock bought.
//   node tools/progress-test.js
'use strict';
const G = require('../js/core.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL ' + m); } };
const check = (P, name) => {
  ok(P.bars.length === 3, `${name}: 3 bars`);
  P.bars.forEach(b => ok(b.max > 0 && b.now >= 0 && b.now <= b.max && typeof b.text === 'string', `${name}: bar ${b.k} in range (${b.now}/${b.max})`));
  ok(typeof P.next === 'string' && P.next.startsWith('Next: '), `${name}: next goal`);
};
const m = G.newMeta();
let P = G.runProgress(m, { rp: 12, echoes: 9, titles: 0 }); check(P, 'new save');
ok(P.bars[0].text === `${G.RANK_RP.E} RP to E`, 'new save: RP to E');
m.rank.rp = 85; m.rank.trial = 'E';
P = G.runProgress(m, {}); check(P, 'trial');
ok(/E-rank Rank Trial/.test(P.next), 'trial: goal names the trial');
m.rank.trial = null; m.rank.letter = 'C'; m.rank.rp = 900;
P = G.runProgress(m, {}); check(P, 'C rank');
ok(P.bars[0].now === 900 - G.RANK_RP.C && P.bars[0].max === G.RANK_RP.B - G.RANK_RP.C, 'C rank: bar measured from C to B');
Object.keys(G.UNLOCKS).forEach(k => m.unlocks[k] = true); m.echoes = 40;
P = G.runProgress(m, {}); check(P, 'all unlocks');
ok(P.bars[1].text === '40 banked', 'all unlocks: Echoes banked');
m.unlocks = {}; m.echoes = 500;
P = G.runProgress(m, {}); ok(/you can buy/.test(P.next), 'affordable unlock is the next goal');
Object.keys(G.TITLES).forEach(k => m.titles[k] = true); m.rank.letter = 'SSS';
P = G.runProgress(m, {}); ok(P.bars.length === 2 && P.bars[1].now === P.bars[1].max, 'SSS, all Titles: no rank bar, Titles full');
console.log(fail ? `${fail} failed` : 'progress test: all passed');
process.exit(fail ? 1 : 0);
