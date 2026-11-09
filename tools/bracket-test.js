// Bracket map test (Phase 3): 8 rounds from 256 Entrants down to 2, three qualifiers, four main bracket rounds and the
// Final; fought rounds carry their result, this round its opponents, rounds ahead what is scheduled; building the map
// draws nothing and changes nothing; a finished bot run reads back as its own history.
//   node tools/bracket-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js'), bot = require('./bot.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function newRun(seed) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), seed }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta, undefined, run.gearDraft[0]);
  return { meta, run };
}
for (let k = 0; k < 60; k++) {
  const { run } = newRun(k % 2 ? 'wpd:bracket-' + k : undefined);
  const before = JSON.stringify(run), B = G.bracketMap(run);
  ok(JSON.stringify(run) === before, 'the map changes nothing in the run (no draws, no counters)');
  ok(B.rows.length === G.ROUNDS && B.elite.length === 0, '8 rounds, no Elite rows yet');
  ok(B.rows.map(r => r.stage).join() === 'qualifier,qualifier,qualifier,main,main,main,main,final', '3 qualifiers, 4 main bracket rounds, the Final');
  ok(B.rows.every((r, i) => r.field === 256 / Math.pow(2, i)), 'the field halves each round, 256 down to 2');
  ok(B.rows[0].state === 'now' && B.rows.slice(1).every(r => r.state === 'ahead'), 'round 1 is now, the rest ahead');
  ok(B.rows[0].opponents.length === run.choices.length && B.rows[0].opponents.every((o, i) => o.name === G.specName(run.choices[i]) && o.spoils), 'this round lists its opponents and their Spoils');
  ok(B.rows.slice(1).every(r => !r.opponents.length && !r.fights.length), 'rounds ahead name no opponents');
  ok(B.rows[3].gate && B.rows[6].gate && B.rows.filter(r => r.gate).length === 2, 'Gatekeepers at rounds 4 and 7');
  ok(B.rows[3].marks.some(m => m.k === 'gate') && B.rows[6].marks.some(m => m.k === 'gate'), 'Gatekeepers are marked');
  G.AUGMENT_ROUNDS.forEach(r => ok(B.rows[r - 1].marks.some(m => m.k === 'rules'), `rules review marked at round ${r}`));
  ok(B.rows[4].marks.some(m => m.k === 'gift'), 'the extra Gift is marked at round 5');
  ok(B.rows[7].foes && B.rows[7].marks.some(m => m.k === 'final'), 'the Final names its champion');
  ok(!B.rows.some(r => r.marks.some(m => /door/i.test(m.text))), 'unlisted doors are on no map');
  ok(B.rows.slice(1).every((r, i) => r.heart >= 1 && (i === 0 || r.heart >= B.rows[i].heart)), 'Heart costs are shown and never fall');
  const C = (run.world.fate && B.rows.filter(r => r.marks.some(m => m.k === 'crisis')).map(r => r.round)) || [];
  ok(C.every(r => [3, 5].includes(r)), 'crises only at their rounds');
}
// A full run reads back as its own history
for (let k = 0; k < 40; k++) {
  const meta = G.newMeta(), r = bot.playRun(meta, false, { noElite: true }), run = r.run, B = G.bracketMap(run);
  const fought = run.history.filter(h => !['champion', 'legend'].includes(h.kind));
  ok(B.rows.reduce((n, x) => n + x.fights.length, 0) === fought.length, `every fight is on the map (${fought.length})`);
  ok(B.rows.every(x => x.fights.every(f => typeof f.name === 'string' && typeof f.won === 'boolean')), 'fights carry a name and a result');
  ok(B.rows.filter(x => x.fights.length).every(x => x.state === 'done' || x.round === run.round), 'fought rounds are done');
  if (r.result === 'spared') ok(B.rows[7].fights.some(f => f.won), 'a spared run won its Final');
  ok(B.rows.reduce((n, x) => n + x.fights.reduce((a, f) => a + f.hearts, 0), 0) <= 10 + 8, 'Hearts lost add up');
}
// The Elite bracket follows the Final
{ let seen = 0; for (let k = 0; k < 40 && !seen; k++) { const meta = G.newMeta(); bot.playRun(meta, false, { snap: (at, run) => { if (run.elite && !seen) { seen = 1; const B = G.bracketMap(run); ok(B.elite.length === run.eliteBracket.length && B.elite[run.eliteIdx].state === 'now', 'Elite rows listed, the current one marked'); ok(B.rows.every(x => x.state === 'done'), 'all 8 rounds done in the Elite bracket'); } } }); } ok(seen, 'a bot reached the Elite bracket'); }
console.log(fails ? `${fails} failure(s)` : 'bracket: all good');
process.exit(fails ? 1 : 0);
