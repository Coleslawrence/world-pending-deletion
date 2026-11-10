// Reflex test: every monster, rival and Final Champion has one Reflex; it fires on its trigger, shows its move as the
// intent with the reason, says its line, never fires two turns running or off a lost turn, and the script carries on.
//   node tools/reflex-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
// A skill that sets off each trigger, and one that does not
const TRIG = { block: 'guard', flurry: 'flurry', status: 'ignite', heal: 'mend', passive: 'guard' };
const QUIET = { block: 'attack', flurry: 'attack', status: 'attack', heal: 'attack', passive: 'attack' };
const pick = on => Object.values(G.SKILLS).find(s => !s.base && !s.quick && !s.fx.die && !s.fx.read && !s.fx.stun && !s.fx.interrupt && !s.fx.stunIfWeak && (
  on === 'block' || on === 'passive' ? s.fx.block && !s.fx.dmg && !s.fx.heal && !s.fx.burn && !s.fx.poison && !s.fx.bleed :
  on === 'flurry' ? s.fx.dmg && s.fx.hits >= 2 && !s.fx.burn && !s.fx.poison && !s.fx.bleed :
  on === 'status' ? s.fx.poison && !s.fx.dmg && !s.fx.block && !s.fx.heal :
  s.fx.heal && !s.fx.dmg && !s.fx.block));
function fightWith(id, skill) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 4 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['bastion', 'reaper'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  run.bar = [{ id: skill, star: 1, mods: [], u: 't0' }]; while (run.bar.length < run.slots) run.bar.push(null);
  run.gear = []; run.hp = 9999;
  G.chooseOpponent(run, 0, false);
  const spec = G.currentSpec(run); Object.keys(spec).forEach(k => delete spec[k]); Object.assign(spec, { kind: G.ENEMIES[id].final ? 'final' : G.ENEMIES[id].rival ? 'rival' : 'monster', id, traits: [] });
  const f = G.newFight(run); f.B.fixed = true; f.A.hp = f.A.maxHp = 9999; f.B.hp = f.B.maxHp = 99999; f.B.dodge = 0; f.A.dodge = 0; f.rng = () => 0.99;
  return f;
}
const use = (f, id) => { f.A.stun = 0; if (f.phase === 'stunned') f.phase = 'player'; const i = f.A.skills.findIndex(s => (s.baseDef || s.def).id === id); f.A.skills[i].cd = 0; ok(G.playerAct(f, i), `can use ${id}`); f.B.stun = 0; G.enemyTurn(f); };
const expected = G.MONSTERS.concat(G.RIVALS, Object.keys(G.ENEMIES).filter(k => G.ENEMIES[k].final));
ok(expected.every(k => G.REFLEXES[k]), 'every monster, rival and Final Champion has a Reflex');
ok(Object.keys(G.REFLEXES).length === expected.length, 'nobody else has one');
Object.entries(G.REFLEXES).forEach(([id, R]) => {
  const skill = pick(R.on); if (!skill) return ok(false, `${id}: no test skill for ${R.on}`);
  const name = R.move ? R.move.n : G.ENEMIES[id].skills[R.use].n;
  ok(G.reflexText(id) === `${G.REFLEX_ON[R.on].if}: ${name}.`, `${id}: its card text names the move`);
  // Fires on the trigger: the intent is the Reflex move, with the reason and the line
  const f = fightWith(id, skill.id); ok(f.B.reflex, `${id}: carries its Reflex into the fight`);
  const idx = f.B.scriptIdx;
  use(f, skill.id);
  const it = G.intentInfo(f), log = f.log.map(l => l.text).join(' ');
  ok(f.B.reflexNow && f.B.intent.def.name === name, `${id}: ${R.on} sets off ${name} (intent ${f.B.intent.def.name})`);
  ok(it.reflex === G.REFLEX_ON[R.on].why, `${id}: the intent says why`);
  ok(log.includes(R.say), `${id}: says its line`);
  ok(f.tally.reflexes === 1, `${id}: counted once`);
  // Never two turns running, and the script picks up where it left off
  const at = f.B.scriptIdx;
  use(f, skill.id);
  ok(!f.B.reflexNow, `${id}: does not fire two turns running`);
  ok(f.B.scriptIdx === at || f.B.phased, `${id}: the script did not skip a move for the Reflex`);
  use(f, skill.id);
  ok(f.B.reflexNow, `${id}: fires again after a turn's rest`);
  void idx;
  // Does not fire on a plain attack (or, for the ones that punish holding back, fires only when you hold back)
  const g = fightWith(id, skill.id); use(g, QUIET[R.on]);
  ok(!g.B.reflexNow, `${id}: a plain attack does not set it off`);
  // A turn you lost is not held against you
  const h = fightWith(id, skill.id); G.skipPlayer(h); G.enemyTurn(h);
  ok(!h.B.reflexNow, `${id}: a lost turn does not set it off`);
});
// Practice fights and other players' builds have none
{
  const meta = G.newMeta(); G.bindMeta(meta);
  ok(Object.values(G.ENEMIES).filter(e => !e.final && !e.rival && e.tier !== 1).every(e => !G.REFLEXES[Object.keys(G.ENEMIES).find(k => G.ENEMIES[k] === e)]), 'examiners, legends and the Undefeated have no Reflex');
}
console.log(fails ? `reflex test: ${fails} failed` : `reflex test: all passed (${Object.keys(G.REFLEXES).length} Reflexes)`);
process.exit(fails ? 1 : 0);
