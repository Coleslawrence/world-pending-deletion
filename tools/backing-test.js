// Back yourself test: a stake costs Echoes, can be withdrawn for a full refund, rides on the next normal run only
// (never Pending World or practice), and pays stake x odds when the goal is met, nothing otherwise.
//   node tools/backing-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function mk(seed) {
  const meta = G.newMeta(); G.bindMeta(meta); meta.echoes = 100;
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'T', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), seed }, meta);
  return { meta, run };
}
{ const { meta } = mk(); ok(!G.placeBacking(meta, 'final', 7), 'only listed stakes'); ok(G.placeBacking(meta, 'final', 10) && meta.echoes === 90, 'stake paid'); ok(!G.placeBacking(meta, 'main', 5), 'one backing at a time'); ok(G.withdrawBacking(meta) && meta.echoes === 100 && !meta.backing, 'withdraw refunds'); }
{ const { meta } = mk(); meta.echoes = 4; ok(!G.placeBacking(meta, 'main', 5), 'cannot stake more than you have'); }
{ const { meta, run } = mk('wpd:2026-11-08'); G.placeBacking(meta, 'main', 5); ok(!G.claimBacking(run, meta) && meta.backing, 'Pending World leaves the backing for the next normal run'); }
for (const [goal, round, outcome, met] of [['main', 4, 'erased', true], ['main', 3, 'erased', false], ['final', 8, 'erased', true], ['final', 7, 'erased', false], ['spared', 8, 'spared', true], ['spared', 8, 'erased', false]]) {
  const { meta, run } = mk(); G.placeBacking(meta, goal, 10); ok(G.claimBacking(run, meta) && !meta.backing, 'normal run claims it');
  run.round = round; const before = meta.echoes; G.settleBacking(run, meta, outcome);
  ok(run.backing.met === met && meta.echoes - before === (met ? 10 * G.BACK_GOALS[goal].mul : 0), `${goal} at round ${round} ${outcome}: ${met ? 'paid' : 'lost'}`);
  ok(G.settleBacking(run, meta, outcome) === null, 'settles once');
}
console.log(fails ? `${fails} failed` : 'backing test: all passed');
process.exit(fails ? 1 : 0);
