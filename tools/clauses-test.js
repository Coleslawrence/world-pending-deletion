// Clauses test (Phase 5): each Entry Clause gives and takes what its words say; Clauses open by their feats; the chosen
// Clause sticks until changed; sparing a world under one earns its Mark; Pending World and practice ignore them.
//   node tools/clauses-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
const base = () => { const m = G.newMeta(); m.unlocks = { arch_arcanist: 1, arch_storm: 1, arch_dicer: 1, arch_jinx: 1 }; return m; };
function newRun(meta, setup, seed) {
  G.bindMeta(meta);
  const rng = G.seedRng(seed || 'c'), w = G.offerWorlds(meta, rng)[0];
  return G.newRun(w, Object.assign({ name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: 'zeal' in G.GODS ? 'zeal' : Object.keys(G.GODS)[0], startPts: 4, rollSeed: 'r' }, setup), meta, rng);
}
const withClause = k => { const m = base(); m.clauses = { open: { standard: 1, [k]: 1 }, set: k }; return m; };
ok(Object.keys(G.CLAUSES).length === 8 && G.CLAUSES.standard, 'eight Clauses, Standard Entry among them');
Object.entries(G.CLAUSES).forEach(([k, C]) => { ok(C.name && C.opens && C.give && C.take && C.flavour, `${k} has its words`); if (k !== 'standard') ok(G.CLAUSE_FEATS[k], `${k} has a feat`); });
// --- what each gives and takes, against the same run under Standard Entry
const plain = newRun(base(), {}, 's');
ok(!plain.clause, 'Standard Entry leaves the run as it is');
{ const r = newRun(withClause('pauper'), {}, 's'); ok(r.clause === 'pauper' && r.gold === plain.gold + 12 && r.draft.length === 5, "Pauper's: 12 gold, 5 draft offers"); }
{ const r = newRun(withClause('collector'), {}, 's'); ok(r.gearDraft.length === plain.gearDraft.length + 1, `Collector's: one more gear offer (${r.gearDraft.length})`);
  const sk = G.SHOP_SKILLS[0], gr = Object.keys(G.GEAR)[0]; ok(G.price(r, { id: sk }) === G.price(plain, { id: sk }) + 2 && G.price(r, { id: gr }) === G.price(plain, { id: gr }), "Collector's: skills 2 gold dearer, gear not"); }
{ const r = newRun(withClause('veteran'), {}, 's'); ok(r.level === 2 && r.maxHearts === plain.maxHearts - 1 && r.hearts === r.maxHearts, "Veteran's: level 2, one fewer Heart"); }
{ const r = newRun(withClause('gambler'), {}, 's'); G.enterChoose && 0; r.choices = plain.choices || [{ kind: 'monster', id: 'x' }]; r.wager = { god: Object.keys(G.GODS)[0], key: 'fast' }; r.gold = 0; r.stage = 'choose';
  const g0 = r.gold; try { G.chooseOpponent(r, 0, true); } catch (e) { } ok(r.wagerOn && r.gold === g0, "Gambler's: a wager costs nothing to place"); }
{ const r = newRun(withClause('patron'), {}, 's'); ok(r.favour[r.patron] === plain.favour[plain.patron] + 2, "Patron's: 2 more Favour with your Patron");
  const other = Object.keys(G.GODS).find(g => g !== r.patron), b = r.favour[other]; G.addFavour(r, other, 4, null, []); ok(r.favour[other] === b + 2, "Patron's: other gods' Favour halved");
  G.addFavour(r, other, 1, null, []); ok(r.favour[other] === b + 2, "Patron's: a single Favour from another god rounds to nothing"); }
{ const r = newRun(withClause('hermit'), {}, 's'); ok(G.income(r) === G.income(Object.assign({}, r, { clause: null })) + 2, "Hermit's: +2 income");
  let fewer = true; for (let i = 0; i < 20; i++) { const a = G.rollDistricts(r, G.seedRng('h' + i)), b2 = G.rollDistricts(Object.assign({}, r, { clause: null }), G.seedRng('h' + i)); if (a.length !== b2.length - 1) fewer = false; } ok(fewer, "Hermit's: one fewer district"); }
{ const r = newRun(withClause('barehands'), {}, 's'); ok(r.gearDraft.length === 0 && r.startPts === plain.startPts + 2, 'Bare Hands: no opening gear, 2 more stat points'); }
// --- the choice sticks, and only open Clauses can be chosen
{ const m = base(); ok(G.setClause(m, 'pauper') === 'standard', 'a Clause not on file cannot be chosen'); m.clauses.open.pauper = 1; ok(G.setClause(m, 'pauper') === 'pauper', 'an open one can');
  const back = G.migrateMeta(JSON.parse(JSON.stringify(m))); ok(back.clauses.set === 'pauper' && back.clauses.open.pauper, 'the choice survives a save and load');
  ok(G.migrateMeta({ v: G.VERSION, clauses: { open: { nope: 1 }, set: 'veteran' } }).clauses.set === 'standard', 'a saved Clause that is not open falls back to Standard'); }
// --- Pending World and practice ignore the Clause
{ const d = newRun(withClause('veteran'), { seed: 'wpd:2026-12-03', daily: '2026-12-03' }), e = newRun(base(), { seed: 'wpd:2026-12-03', daily: '2026-12-03' });
  ok(!d.clause && d.level === e.level && d.maxHearts === e.maxHearts && d.gold === e.gold && d.draft.join() === e.draft.join(), 'Pending World always uses Standard Entry'); }
// --- feats
{ const m = base(), r = newRun(m, {}, 'f'); r.gold = 31; r.wagersWon = 3; Object.assign(r.favour, { [r.patron]: 8 }); m.wins = 4; r.infirmaryUsed = true;
  const got = G.openClauses(r, m, 'end', 'erased', []); ok(['pauper', 'gambler', 'patron'].every(k => got.includes(k)) && !got.includes('veteran') && !got.includes('hermit'), `end-of-run feats (${got})`);
  m.wins = 5; r.infirmaryUsed = false; const got2 = G.openClauses(r, m, 'end', 'spared', []); ok(got2.includes('veteran') && got2.includes('hermit'), `veteran and hermit (${got2})`);
  ok(G.openClauses(r, m, 'end', 'spared', []).length === 0, 'a Clause opens once');
  const m3 = base(), r3 = newRun(m3, {}, 'g'); r3.gear = { weapon: null, armour: null, accessory: null }; ok(G.openClauses(r3, m3, 'fight', null, []).includes('barehands'), 'a win with no gear opens Bare Hands');
  r3.gear = { weapon: { id: 'ember_gauntlets', star: 2 }, armour: { id: 'chain_mail', star: 2 }, accessory: { id: 'prayer_beads', star: 3 } }; ok(G.openClauses(r3, m3, 'fight', null, []).includes('collector'), "three slots at ★2 opens Collector's");
  const pr = newRun(base(), { script: { draft: ['firebolt', 'ember_ward', 'scorch'], gearDraft: [] } }); pr.gold = 99; ok(G.openClauses(pr, base(), 'end', 'spared', []).length === 0, 'practice opens nothing'); }
// --- Mark per Clause
{ const m = withClause('pauper'), r = newRun(m, {}, 'k'); const L = G.settleLadder(r, m, 'spared'); ok(m.marks.clause.pauper === 1 && L.marks.some(x => x.kind === 'clause'), 'sparing under a Clause marks it');
  const m2 = base(), r2 = newRun(m2, {}, 'k'); G.settleLadder(r2, m2, 'spared'); ok(!Object.keys(m2.marks.clause || {}).length, 'Standard Entry earns no Clause Mark'); }
console.log(fails ? `clauses test: ${fails} failed` : 'clauses test: all passed');
process.exit(fails ? 1 : 0);
