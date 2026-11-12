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
// Opening stat points, placed after the draft: the floor holds, Gifts count, the roll is seeded and once only, and the
// Max HP the points add arrives with them
{
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0], base = { STR: 2, AGI: 2, INT: 2, VIT: 2, LUK: 2 };
  const mk = (gifts, seed) => G.newRun(w, { name: 'T', stats: Object.assign({}, base), startPts: 4, rollSeed: 'x', gifts, patron: 'war', seed }, meta);
  const run = mk([]);
  ok(run.startPts === 4 && JSON.stringify(run.statFloor) === JSON.stringify(base), 'starts with 4 points on the floor');
  ok(!G.startStat(run, 'VIT', -1), 'cannot go below the floor');
  G.confirmDraft(run, run.draft.slice(0, 3), meta, undefined, run.gearDraft[0]);
  ok(run.stage === 'choose' && run.startPts === 4, 'the draft leaves the points to place');
  ok(!G.placeStartStats(run), 'cannot finish with points left');
  const hp0 = run.hp; for (let i = 0; i < 4; i++) G.startStat(run, 'VIT', 1);
  ok(!G.startStat(run, 'STR', 1), 'no fifth point');
  ok(G.placeStartStats(run) && run.stats.VIT === 6 && run.startPts === undefined, 'points placed');
  ok(run.hp > hp0, 'VIT points add HP');
  const lucky = mk(['bornlucky']); ok(lucky.statFloor.LUK === 5, 'Born Lucky raises the floor (+3)');
  const a = mk([], 'seed-a'), b = mk([], 'seed-a');
  G.rollStart(a); G.rollStart(b);
  ok(JSON.stringify(a.stats) === JSON.stringify(b.stats) && a.startPts === 0, 'same seed, same roll');
  ok(Object.values(a.stats).reduce((x, y) => x + y, 0) === 10 + G.ROLL_PTS, 'the roll places ROLL_PTS');
  G.unrollStart(a, 4); ok(a.startPts === 4 && !G.rollStart(a), 'undo the roll, but no second roll');
  const bot = G.newRun(w, { name: 'B', stats: Object.assign({}, base), gifts: [], patron: 'war' }, meta);
  ok(bot.startPts === undefined, 'sims without startPts are unchanged');
}
console.log(fails ? `draft: ${fails} failures` : 'draft: all checks passed');
process.exit(fails ? 1 : 0);
