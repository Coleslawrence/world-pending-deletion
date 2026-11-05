// Path evolution test: the first time an archetype reaches 6 pieces, the run is asked once to pick one of two advanced
// classes; the first keeps tier 3, the second swaps in its own effects, and the pick holds for the run.
//   node tools/advance-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function pyreRun() {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 6, VIT: 4, LUK: 2 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['pyre', 'venom'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  run.pending = [];
  return run;
}
const fill = (run, n) => {
  const skills = ['firebolt', 'flame_wave', 'ignite', 'scorch'], gear = [['weapon', 'ember_gauntlets'], ['armour', 'cinder_robe'], ['accessory', 'plague_censer']];
  run.bar = run.bar.map((p, i) => i < Math.min(n, skills.length) ? { id: skills[i], star: 1, mods: [], u: 's' + i } : null);
  gear.slice(0, Math.max(0, n - skills.length)).forEach(([sl, id]) => run.gear[sl] = { id, star: 1, mods: [], u: 'g' + id });
};
// Every archetype has two advanced classes; the first keeps tier 3
G.ARCH_KEYS.forEach(k => { ok(G.ADVANCE[k] && G.ADVANCE[k].length === 2, `${k} has two advanced classes`); ok(G.advOf({}, k).p === G.ARCH[k].p[2], `${k}: the first keeps tier 3`); });
// Below 6 pieces nothing is asked
{ const run = pyreRun(); fill(run, 5); G.checkPath(run, []); ok(!run.pending.some(p => p.type === 'adv'), 'no Path evolution below 6 pieces'); }
// At 6 the run is asked, once
{
  const run = pyreRun(); fill(run, 6); const msgs = [];
  ok(G.runCounts(run).pyre >= 6, `6 Pyre pieces counted (${G.runCounts(run).pyre})`);
  G.checkPath(run, msgs); G.checkPath(run, msgs);
  ok(run.pending.filter(p => p.type === 'adv' && p.arch === 'pyre').length === 1, 'asked once at 6 pieces');
  ok(msgs.some(m => /Path can evolve/.test(m.text)), 'the System says the Path can evolve');
  ok(G.runP(run).burnFade === 0, 'before the pick, tier 3 is as written');
  G.advance(run, 'pyre', 1);
  ok(!run.pending.some(p => p.type === 'adv'), 'the pick clears the pending card');
  const P = G.runP(run);
  ok(P.thornBurn === 4 && P.burnHeal > 0, 'Cinder Warden gives its own effects');
  ok(P.burnFade !== 0, 'Cinder Warden replaces Burn never fading');
  fill(run, 5); G.checkPath(run, []); fill(run, 7); G.checkPath(run, []);
  ok(!run.pending.some(p => p.type === 'adv') && run.adv.pyre === 1, 'the pick holds for the run');
}
// Keeping the first is a pick too
{ const run = pyreRun(); fill(run, 6); G.checkPath(run, []); G.advance(run, 'pyre', 0); ok(G.runP(run).burnFade === 0 && run.adv.pyre === 0, 'Everflame keeps Burn never fading'); }
console.log(fails ? `path evolution: ${fails} failures` : 'path evolution: all checks passed');
process.exit(fails ? 1 : 0);
