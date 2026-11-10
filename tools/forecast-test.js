// Forecast test (and the guard bar): the fight screen's preview plays a skill and the reply out on a copy. The real fight, its log and its
// random stream are untouched; with a fixed fight the preview matches what using the skill then does (no crits, no dodges).
//   node tools/forecast-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function fight(id) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 4 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['bastion', 'reaper'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  G.chooseOpponent(run, 0, false);
  const spec = G.currentSpec(run); Object.keys(spec).forEach(k => delete spec[k]); Object.assign(spec, { kind: 'monster', id: id || 'brute', traits: [] });
  const f = G.newFight(run); f.B.dodge = 0; f.A.dodge = 0; f.A.crit = 0; f.B.crit = 0;
  return f;
}
const json = f => JSON.stringify(f, (k, v) => typeof v === 'function' ? 'fn' : v);
// The real fight is untouched
{
  const f = fight(); let calls = 0; const r = f.rng; f.rng = () => { calls++; return r(); };
  const before = json(f);
  f.A.skills.forEach((s, i) => { if (G.canUse && s.cd <= 0) G.forecast(f, i); });
  ok(json(f) === before, 'previewing every skill leaves the fight as it was');
  ok(calls === 0, 'and never draws from its random stream');
}
// It matches what then happens, for each skill
for (const id of ['brute', 'golem', 'drake', 'ghoul', 'imp', 'hex_toad']) {
  const f0 = fight(id); if (!f0) continue;
  f0.A.skills.forEach((s, i) => {
    if (s.cd > 0) return;
    const f = G.cloneFight(f0); f.rng = () => 0.5;
    const p = G.forecast(f, i); ok(p, `${id}: ${s.def.name} has a forecast`); if (!p) return;
    G.playerAct(f, i); if (f.phase === 'enemy') G.enemyTurn(f);
    ok(p.bHp === Math.max(0, Math.round(f.B.hp)), `${id}: ${s.def.name} their HP ${p.bHp} vs ${Math.round(f.B.hp)}`);
    ok(p.aHp === Math.max(0, Math.round(f.A.hp)), `${id}: ${s.def.name} your HP ${p.aHp} vs ${Math.round(f.A.hp)}`);
  });
}
// A skill on cooldown, or not your turn: nothing
{ const f = fight(); f.A.skills[0].cd = 2; ok(G.forecast(f, 0) === null, 'no forecast on cooldown'); f.A.skills[0].cd = 0; f.phase = 'enemy'; ok(G.forecast(f, 0) === null, 'no forecast off your turn'); }
// A big hit that breaks the wind-up says so
{
  const f = fight(); f.B.fixed = true; f.B.breakMax = 0; f.B.reflexes = []; f.B.reflex = null;
  f.A.maxHp = Math.min(f.A.maxHp, 100); f.B.scriptIdx = 2; f.B.skills.forEach(s => s.cd = 0); G.planIntentForTest(f, f.B);
  const a = f.A.skills.findIndex(s => s.key === 'attack'); f.B.block = 0;
  ok(f.B.windup, 'the swing winds up');
  f.A.skills[a].power = 5; const p = G.forecast(f, a);
  ok(p && p.broke === 'Crushing Swing', `the preview says it breaks the swing (${p && p.broke})`);
  f.A.skills[a].power = 0.01; const q = G.forecast(f, a);
  ok(q && !q.broke, 'a small hit does not');
}
// A move that sets off a Reflex says which move comes next
{
  const f = fight(); f.B.fixed = true; const R = { on: 'hurt', use: 0, say: '[test]' }; f.B.reflexes = [R]; f.B.reflex = R; f.B.hurtDone = false; f.B.reflexAt = null;
  f.B.hp = Math.floor(f.B.maxHp / 2) + 1; f.B.block = 0;
  const a = f.A.skills.findIndex(s => s.key === 'attack'); f.A.skills[a].power = 0.3;
  const p = G.forecast(f, a);
  ok(p && p.reflex === f.B.skills[0].def.name, `a hit that takes it below half sets off its Reflex (${p && p.reflex})`);
}
// The guard starts full and only the player wears it down: it does not recover over the opponent's turns
{
  const f = fight(); ok(f.B.brk === 0 && f.B.breakMax > 0, 'the guard starts full');
  f.B.brk = 10; f.phase = 'enemy'; G.enemyTurn(f); if (f.phase === 'enemy') G.enemyTurn(f);
  ok(f.B.brk === 10, `the guard does not recover on its own (${f.B.brk})`);
}
console.log(fails ? `${fails} failure(s)` : 'forecast-test: all passed');
process.exit(fails ? 1 : 0);
