// Patron bonds test (Phase 7): Favour a run ends holding builds a lasting Bond; Bond levels open a line, a new wager and
// the god's own Gift; Pending World and practice never use a Bond.
//   node tools/bonds-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function newRun(meta, setup, seed) {
  G.bindMeta(meta);
  const rng = G.seedRng(seed || 'b'), w = G.offerWorlds(meta, rng)[0];
  return G.newRun(w, Object.assign({ name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: 'war', startPts: 4, rollSeed: 'r' }, setup), meta, rng);
}
Object.keys(G.GODS).forEach(g => { const B = G.BONDS[g]; ok(B && G.FEATS[B.wager] && B.lines.length === 2 && G.GIFTS[B.gift] && G.GIFTS[B.gift].bond === g, `${g} has a Bond wager, two lines and a Gift`);
  ok(B && B.wager !== G.GODS[g].wager && G.WAGERS[B.wager], `${g}: the Bond wager is new for that god and can be offered`); });
// --- earning
{ const m = G.newMeta(), r = newRun(m, {}, 'e'); r.favour.war = 9; r.favour.ruin = 3;
  const up = G.settleBonds(r, m); ok(m.bonds.war === 9 && m.bonds.ruin === 3 && G.bondLevel(m, 'war') === 1 && !G.bondLevel(m, 'ruin'), 'Favour held at the end adds to the Bond');
  ok(up.length === 1 && up[0].g === 'war' && up[0].level === 1, 'the run notes the level it opened');
  const r2 = newRun(m, {}, 'e2'); r2.favour.war = 100; ok(G.settleBonds(r2, m).filter(x => x.g === 'war').map(x => x.level).join() === '2,3,4', 'several levels at once are each noted');
  ok(G.bondLevel(m, 'war') === 4 && !G.bondNext(m, 'war'), 'Bond 4 is the top');
  const p = newRun(m, {}, 'p'); p.practice = true; p.favour.crow = 50; G.settleBonds(p, m); ok(!m.bonds.crow, 'practice adds nothing');
  const back = G.migrateMeta(JSON.parse(JSON.stringify(m))); ok(back.bonds.war === 109, 'Bonds survive a save and load');
  ok(!G.migrateMeta({ v: G.VERSION, bonds: { war: -5, nobody: 9 } }).bonds.war && !G.migrateMeta({ v: G.VERSION, bonds: { nobody: 9 } }).bonds.nobody, 'odd saved Bonds are cleaned'); }
{ const m = G.newMeta(), r = newRun(m, {}, 'end'); r.favour.house = 25; G.endRun(r, m, 'erased'); ok(G.bondLevel(m, 'house') === 2, 'endRun settles Bonds, win or lose'); }
// --- what a level opens
{ const m = G.newMeta(); m.bonds = { war: 20 }; const r = newRun(m, {}, 'l');
  ok(r.bonds.war === 2 && r.log.some(x => x.text.includes(G.BONDS.war.lines[0])), 'a run starts with its Bond levels and the Patron\'s Bond line');
  m.bonds.war = 45; const r3 = newRun(m, {}, 'l3'); ok(r3.log.some(x => x.text.includes(G.BONDS.war.lines[1])), 'Bond 3 brings the second line');
  let seen = 0; for (let i = 0; i < 300; i++) { const w = G.makeWager(Object.assign({}, r, { patron: 'war' }), G.seedRng('w' + i)); if (w.god === 'war' && w.key === G.BONDS.war.wager) seen++; }
  ok(seen > 10, `Bond 2: War now bets on ${G.BONDS.war.wager} (${seen} of 300)`);
  const r0 = newRun(G.newMeta(), {}, 'l0'); let none = true; for (let i = 0; i < 300; i++) { const w = G.makeWager(r0, G.seedRng('w' + i)); if (w.key === G.BONDS.war.wager && w.god === 'war') none = false; }
  ok(none, 'without the Bond, War never offers that bet'); }
{ const m = G.newMeta(); ok(!G.giftUnlocked('bond_war', m), 'the Bond Gift starts closed'); m.bonds = { war: 70 }; ok(G.giftUnlocked('bond_war', m) && !G.giftUnlocked('bond_ruin', m), 'Bond 4 opens that god\'s Gift only');
  ok(!G.giftUnlocked('bond_war', G.levelMeta(m)), 'Pending World never offers a Bond Gift'); }
// --- Pending World and practice
{ const m = G.newMeta(); m.bonds = { war: 70 }; const d = newRun(m, { seed: 'wpd:2026-12-03', daily: '2026-12-03' }), e = newRun(G.newMeta(), { seed: 'wpd:2026-12-03', daily: '2026-12-03' });
  ok(!d.bonds && !d.log.some(x => /Bond/.test(x.text)), 'Pending World carries no Bond');
  let same = true; for (let i = 0; i < 50; i++) if (JSON.stringify(G.makeWager(d, G.seedRng('d' + i))) !== JSON.stringify(G.makeWager(e, G.seedRng('d' + i)))) same = false; ok(same, 'Pending World wagers are the same with or without a Bond'); }
console.log(fails ? `${fails} failed` : 'bonds: all passed');
process.exit(fails ? 1 : 0);
