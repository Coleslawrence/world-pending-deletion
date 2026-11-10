// Rival grudges test (Phase 7): rivals keep a record against you; one who beat you last comes back with one more trait
// and a taunt; three wins retire a rival, who leaves the pool and files a trophy; Pending World and practice stay level.
//   node tools/grudges-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function newRun(meta, setup, seed) {
  G.bindMeta(meta);
  const rng = G.seedRng(seed || 'g'), w = G.offerWorlds(meta, rng)[0];
  return G.newRun(w, Object.assign({ name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: Object.keys(G.GODS)[0], startPts: 4, rollSeed: 'r' }, setup), meta, rng);
}
// --- every rival has its lines
G.RIVALS.forEach(id => { const L = G.GRUDGES[id]; ok(L && L.taunt && L.second && L.retire && L.trophy, `${id} has a taunt, a second, a retire line and a trophy`); });
// --- the record
{ const m = G.newMeta(), r = newRun(m, {}, 'a'), msgs = [];
  G.noteGrudge(r, m, 'grukk', false, msgs); ok(G.grudgeOf(m, 'grukk').l === 1 && G.grudgeOf(m, 'grukk').last === 'l', 'a loss to a rival is recorded');
  G.noteGrudge(r, m, 'grukk', true, msgs); G.noteGrudge(r, m, 'grukk', true, msgs); ok(G.grudgeOf(m, 'grukk').w === 2 && !G.grudgeOf(m, 'grukk').retired, 'two wins do not retire them');
  G.noteGrudge(r, m, 'grukk', true, msgs); ok(G.grudgeOf(m, 'grukk').retired && (r.retired || []).includes('grukk'), 'the third win retires them');
  ok(msgs.some(x => /Rival retired: Grukk/.test(x.text) && /splintered club/.test(x.text)), 'the System files the trophy');
  G.noteGrudge(r, m, 'grukk', true, msgs); ok(r.retired.length === 1, 'a rival retires once');
  const back = G.migrateMeta(JSON.parse(JSON.stringify(m))); ok(back.grudges.grukk.w === 4 && back.grudges.grukk.retired, 'the record survives a save and load');
  ok(!G.migrateMeta({ v: G.VERSION, grudges: { grukk: { w: 1, retired: 1 }, nobody: { w: 9 } } }).grudges.nobody, 'unknown rivals are dropped');
  ok(!G.migrateMeta({ v: G.VERSION, grudges: { grukk: { w: 1, retired: 1 } } }).grudges.grukk.retired, 'a rival needs three wins to stay retired');
  const p = newRun(m, {}, 'p'); p.practice = true; G.noteGrudge(p, m, 'lyss', false, []); ok(!G.grudgeOf(m, 'lyss').l, 'practice keeps no record'); }
// --- what it changes in the bracket
function choicesAt(meta, setup, round, seed) {
  const r = newRun(meta, setup, seed); r.round = round; r.met = []; return { r, c: G.makeChoices(r, meta, G.seedRng(seed + ':c' + round)) };
}
{ const m = G.newMeta(); G.RIVALS.forEach(id => m.grudges[id] = { w: 0, l: 1, last: 'l', retired: 0 });
  let seen = 0, more = true;
  for (let i = 0; i < 20; i++) { const { c } = choicesAt(m, {}, 5, 'g' + i); c.filter(x => x.kind === 'rival').forEach(x => { seen++; if (!x.grudge) more = false; }); }
  ok(seen > 0 && more, `a rival who beat you last time is a grudge match (${seen} seen)`);
  const plain = G.newMeta(); let same = true;
  for (let i = 0; i < 20; i++) { const a = choicesAt(m, {}, 5, 'g' + i).c, b = choicesAt(plain, {}, 5, 'g' + i).c;
    a.forEach((x, j) => { if (x.kind === 'rival' && b[j].kind === 'rival' && x.id === b[j].id && !x.gate && (x.traits || []).length !== (b[j].traits || []).length + 1) same = false; }); }
  ok(same, 'and brings exactly one more trait');
  let pw = true; for (let i = 0; i < 5; i++) { const { c } = choicesAt(m, { seed: 'wpd:2026-12-0' + (i + 1), daily: '2026-12-0' + (i + 1) }, 5, 'd' + i); if (c.some(x => x.grudge)) pw = false; }
  ok(pw, 'Pending World never has a grudge match'); }
{ const m = G.newMeta(), keep = ['grukk', 'lyss', 'mott'];
  G.RIVALS.filter(id => !keep.includes(id)).forEach(id => m.grudges[id] = { w: 3, l: 0, last: 'w', retired: 1 });
  let bad = 0; for (let i = 0; i < 20; i++) { const { c } = choicesAt(m, {}, 5, 'r' + i); c.filter(x => x.kind === 'rival').forEach(x => { if (!keep.includes(x.id)) bad++; }); }
  ok(!bad, `retired rivals stop entering normal worlds (${bad} drawn)`);
  G.RIVALS.forEach(id => m.grudges[id] = { w: 3, l: 0, last: 'w', retired: 1 });
  let drawn = true; for (let i = 0; i < 10; i++) { const { c } = choicesAt(m, {}, 5, 's' + i); if (c.length < 2) drawn = false; }
  ok(drawn, 'with every rival retired, the bracket still fills');
  let any = false; for (let i = 0; i < 10; i++) { const { c } = choicesAt(m, { seed: 'wpd:2026-12-1' + i, daily: '2026-12-1' + i }, 5, 'e' + i); if (c.some(x => x.kind === 'rival')) any = true; }
  ok(any, 'Pending World still draws retired rivals'); }
// --- the intro lines
{ const m = G.newMeta(); m.grudges.lyss = { w: 0, l: 1, last: 'l', retired: 0 }; m.grudges.kaito = { w: 2, l: 0, last: 'w', retired: 0 };
  const r = newRun(m, {}, 'i'); r.round = 5;
  const a = G.rankIntro(r, m, { kind: 'rival', id: 'lyss', grudge: true }, 'Lyss'), b = G.rankIntro(r, m, { kind: 'rival', id: 'kaito' }, 'Kaito');
  ok(a.some(x => x.text.includes(G.GRUDGES.lyss.taunt)) && a.some(x => /Grudge match/.test(x.text)), 'a grudge match opens with the taunt');
  ok(b.some(x => x.text.includes(G.GRUDGES.kaito.second)), 'two wins in, they say so'); }
console.log(fails ? `${fails} failed` : 'grudges: all passed');
process.exit(fails ? 1 : 0);
