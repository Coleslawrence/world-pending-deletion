// Side goal test: monster and rival fights get one side goal that fits the opponent; winning while meeting it pays
// its gold and says so; not meeting it pays nothing extra; Final Champions and practice fights get none.
//   node tools/goal-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function setup(id, kind) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 4 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['bastion', 'reaper'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  G.chooseOpponent(run, 0, false);
  const spec = G.currentSpec(run); Object.keys(spec).forEach(k => delete spec[k]); Object.assign(spec, { kind, id, traits: [] });
  return { meta, run };
}
const seen = {};
G.MONSTERS.concat(G.RIVALS).forEach(id => {
  for (let k = 0; k < 6; k++) {
    const { run } = setup(id, G.ENEMIES[id].rival ? 'rival' : 'monster'), f = G.newFight(run);
    ok(f.goal && G.SIDE_GOALS[f.goal.key], `${id}: has a side goal`);
    if (!f.goal) return;
    seen[f.goal.key] = true;
    ok(G.SIDE_GOALS[f.goal.key].can(f, f.B), `${id}: its goal fits`);
    ok(f.log.some(l => /^\[Side goal: /.test(l.text)), `${id}: the goal is announced`);
    ok(f.goal.gold === (G.ENEMIES[id].rival ? 4 : 3), `${id}: pays by tier`);
  }
});
ok(['calm', 'windup', 'guard'].every(k => seen[k]), `every kind of goal comes up (${Object.keys(seen).join(', ')})`);
// Met and won: the gold is paid; not met: it isn't
function settle(key, met) {
  const { meta, run } = setup('goblin', 'monster'), f = G.newFight(run); f.goal = { key, gold: 3 };
  if (key === 'calm' && !met) f.tally.reflexes = 1;
  if (key === 'windup') f.tally.windups = met ? 1 : 0;
  if (key === 'guard') f.tally.breaks = met ? 1 : 0;
  ok(G.goalState(f) === (met ? (key === 'calm' ? 'open' : 'met') : key === 'calm' ? 'lost' : 'open'), `${key}: chip state while ${met ? 'met' : 'not met'}`);
  f.B.hp = 0; f.over = true; f.winner = 'A';
  const gold = run.gold, res = G.resolveFight(run, f, meta);
  return { paid: res.gold, res };
}
['calm', 'windup', 'guard'].forEach(k => {
  const a = settle(k, true), b = settle(k, false);
  ok(a.res.goal === k && a.paid - b.paid === 3, `${k}: meeting it pays 3 more gold (${a.paid} vs ${b.paid})`);
  ok(a.res.msgs.some(m => /^\[Side goal met/.test(m.text)), `${k}: the result says so`);
  ok(!b.res.goal, `${k}: not met, no goal on the result`);
});
// None for Final Champions or practice
{ const { run } = setup('leviathan', 'final'); ok(!G.newFight(run).goal, 'no side goal against a Final Champion'); }
{ const { run } = setup('goblin', 'monster'); run.practice = true; ok(!G.newFight(run).goal, 'no side goal in practice'); }
console.log(fails ? `goal test: ${fails} failed` : 'goal test: all passed');
process.exit(fails ? 1 : 0);
