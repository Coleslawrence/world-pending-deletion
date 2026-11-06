// Prefix test: every prefix that can be offered applies, describes itself, and plays in a fight without breaking,
// on a sample of the skills that can take it; class prefixes only fit their class; a few check their numbers.
//   node tools/prefix-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function fightWith(id, mods) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 4 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['bastion', 'reaper'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  run.bar = [{ id, star: 1, mods, u: 't0' }]; while (run.bar.length < run.slots) run.bar.push(null);
  G.chooseOpponent(run, 0, false);
  return G.newFight(run);
}
const P = G.PREFIXES, S = G.SKILLS;
const offered = Object.keys(P).filter(k => P[k].w > 0 && !P[k].glitch);
const CLASS = { kindled: 'pyre', virulent: 'venom', keen: 'blade', stalwart: 'bastion', blessed: 'zealot', focused: 'arcanist', reaping: 'reaper', jolting: 'storm', loaded: 'dicer', ominous: 'jinx' };
offered.forEach(k => {
  const ids = Object.keys(S).filter(id => G.prefixOk(id, k, []));
  ok(ids.length > 0, `${k}: some skill can take it`);
  if (CLASS[k]) ok(ids.every(id => (S[id].tags || []).includes(CLASS[k])), `${k}: only ${CLASS[k]} skills take it`);
  ids.filter((_, i) => i % Math.max(1, Math.floor(ids.length / 6)) === 0).forEach(id => {
    let d; try { d = G.moddedDef(id, [k]); } catch (e) { ok(false, `${k} on ${id}: apply threw ${e.message}`); return; }
    ok(!/undefined|NaN/.test(G.describe(d)), `${k} on ${id}: its words are whole`);
    try {
      const f = fightWith(id, [k]), A = f.A, i = A.skills.findIndex(s => (s.baseDef || s.def).id === id);
      for (let t = 0; t < 4 && !f.over; t++) { if (A.skills[i].cd === 0) G.playerAct(f, i); else G.playerAct(f, A.skills.findIndex(s => s.cd === 0)); }
      ok(!isNaN(f.A.hp) && !isNaN(f.B.hp), `${k} on ${id}: HP stays a number`);
    } catch (e) { ok(false, `${k} on ${id}: fight threw ${e.message}`); }
  });
});
// Numbers
{ const d = G.moddedDef('scorch', ['kindled']); ok(d.fx.burn === Math.round(S.scorch.fx.burn * 1.5), 'Kindled: 50% more Burn'); }
{ const d = G.moddedDef('iron_guard', ['stalwart']); ok(d.fx.block === Math.round(S.iron_guard.fx.block * 1.5), 'Stalwart: 50% more Block'); }
{ const d = G.moddedDef('scorch', ['reckless']); ok(d.powerMult === 1.5 && d.fx.selfDmg === 4, 'Reckless: +50% power, costs 4 HP'); }
{ const d = G.moddedDef('inferno', ['hasty']); ok(d.cd === S.inferno.cd - 2 && Math.abs(d.powerMult - 0.7) < 1e-9, 'Hasty: 2 shorter, 30% less'); }
{ const d = G.moddedDef('scorch', ['hollow']); ok(d.quick && Math.abs(d.powerMult - 0.6) < 1e-9, 'Hollow: Quick, 40% less'); }
ok(!G.prefixOk('iron_guard', 'crippling', []) === !!S.iron_guard.fx.weaken, 'Crippling fits a non-damage skill without Weaken');
ok(!G.prefixOk('scorch', 'crippling', []), 'Crippling never fits a damage skill (so it cannot stack with Jolting)');
console.log(fails ? `prefix-test: ${fails} failed` : `prefix-test: ok (${offered.length} prefixes)`);
process.exit(fails ? 1 : 0);
