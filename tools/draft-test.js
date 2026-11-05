// Opening draft test: Pick Your Kit offers 2 E-rank gear pieces from the run's archetypes (one the home archetype's
// when it has any, in different slots when it can), the picked one is equipped, and seeded runs repeat exactly.
//   node tools/draft-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
const GEAR = G.GEAR;
function newRun(seed, world) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = world || G.offerWorlds(meta)[0];
  return { meta, run: G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), seed }, meta) };
}
for (let k = 0; k < 200; k++) {
  const { meta, run } = newRun();
  const gd = run.gearDraft;
  ok(gd.length === 2, 'two gear offers');
  ok(new Set(gd).size === gd.length, 'the offers differ');
  gd.forEach(id => { ok(GEAR[id] && GEAR[id].rank === 'E', `${id} is E-rank gear`); ok(GEAR[id].tags.some(t => run.arch.includes(t)), `${id} is one of the run's archetypes`); });
  const homeHas = Object.keys(GEAR).some(id => GEAR[id].rank === 'E' && !GEAR[id].glitch && !GEAR[id].experimental && GEAR[id].tags.includes(run.arch[0]));
  if (homeHas) ok(GEAR[gd[0]].tags.includes(run.arch[0]), 'the first offer is the home archetype\'s');
  const pickIt = gd[k % 2];
  G.confirmDraft(run, run.draft.slice(0, 3), meta, undefined, pickIt);
  ok(run.gear[GEAR[pickIt].slot] && run.gear[GEAR[pickIt].slot].id === pickIt, 'the picked gear is equipped');
  ok(!G.allPieces(run).some(p => p.id === gd[1 - (k % 2)] && p.id !== pickIt), 'the other offer is not given');
  ok(run.bar.filter(Boolean).length === 3, 'three skills on the bar');
}
// Seeded runs: same seed, same gear offers; rerolling the draft rerolls the gear too
{
  const a = newRun('kit-seed').run, b = newRun('kit-seed', a.world).run;
  ok(JSON.stringify(a.gearDraft) === JSON.stringify(b.gearDraft) && JSON.stringify(a.draft) === JSON.stringify(b.draft), 'same seed, same draft and gear offers');
}
console.log(fails ? `draft: ${fails} failures` : 'draft: all checks passed');
process.exit(fails ? 1 : 0);
