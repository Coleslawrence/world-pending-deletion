// Wind-up test: a big move shown as the intent can be broken by dealing WINDUP.share of the opponent's max HP on your
// turn. Broken, it goes on cooldown, the opponent shows another move, and the System says so. Small moves have no wind-up.
//   node tools/windup-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function fight() {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 4 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['bastion', 'reaper'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  run.bar = [null]; while (run.bar.length < run.slots) run.bar.push(null);
  G.chooseOpponent(run, 0, false);
  const spec = G.currentSpec(run); Object.keys(spec).forEach(k => delete spec[k]); Object.assign(spec, { kind: 'monster', id: 'brute', traits: [] });
  const f = G.newFight(run); f.B.dodge = 0; f.A.dodge = 0; f.A.crit = 0; f.rng = () => 0.99; f.B.reflex = null;
  return f;
}
// Show Crushing Swing (the Pit Brute's big hit) as the intent
const showBig = f => { f.A.maxHp = Math.min(f.A.maxHp, 100); f.B.scriptIdx = 2; f.B.skills.forEach(s => s.cd = 0); f.B.stun = 0; f.B.interrupted = null; G.planIntentForTest(f, f.B); };
const atk = f => f.A.skills.findIndex(s => s.key === 'attack');
{
  const f = fight(); f.B.breakMax = 0; showBig(f);
  ok(f.B.intent.def.name === 'Crushing Swing', 'the big swing is shown');
  ok(f.B.windup && f.B.windup.need === Math.round(f.B.maxHp * G.WINDUP.share), 'it has a wind-up of 15% of max HP');
  ok(G.intentInfo(f).windup === f.B.windup.need, 'the intent shows the damage needed');
  // Not enough damage: still coming
  f.A.skills[atk(f)].power = 0.01; f.B.block = 0; G.playerAct(f, atk(f));
  ok(f.B.intent.def.name === 'Crushing Swing' && f.B.windup, 'a small hit does not break it');
}
{
  const f = fight(); f.B.breakMax = 0; showBig(f); f.B.block = 0; f.A.skills[atk(f)].power = 5;
  const need = f.B.windup.need; ok(need > 0, 'need set');
  G.playerAct(f, atk(f));
  const log = f.log.map(l => l.text).join(' ');
  ok(f.B.intent.def.name !== 'Crushing Swing', `enough damage breaks it (now ${f.B.intent.def.name})`);
  ok(/falls apart/.test(log), 'the System says it fell apart');
  ok(f.B.skills[1].cd >= G.WINDUP.cd, 'the swing goes on cooldown');
  ok(f.tally.windups === 1, 'counted');
  const hp = f.A.hp, used = f.B.intent.def.name; f.A.block = 0; G.enemyTurn(f);
  ok(used !== 'Crushing Swing' && f.A.hp > hp - 15, `the swing did not land (it used ${used}, you lost ${hp - f.A.hp})`);
}
{
  const f = fight(); f.B.scriptIdx = 0; f.B.skills.forEach(s => s.cd = 0); G.planIntentForTest(f, f.B);
  ok(f.B.intent.def.name === 'Shove' && !f.B.windup && !G.intentInfo(f).windup, 'a small move has no wind-up');
}
console.log(fails ? `windup test: ${fails} failed` : 'windup test: all passed');
process.exit(fails ? 1 : 0);
