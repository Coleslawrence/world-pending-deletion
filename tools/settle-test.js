// Settle the Erased test (Phase 7): beating one of your own Erased champions offers to settle them; settling moves them
// to the Hall of the Settled with a closing line, and they stop returning; others' champions and practice can't settle.
//   node tools/settle-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function newRun(meta, setup, seed) {
  G.bindMeta(meta);
  const rng = G.seedRng(seed || 's'), w = G.offerWorlds(meta, rng)[0];
  return G.newRun(w, Object.assign({ name: 'Ada', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: 'war', startPts: 4, rollSeed: 'r' }, setup), meta, rng);
}
ok(G.SETTLE_LINES.length >= 6 && G.SETTLE_LINES.every(l => l.includes('{champ}') && !/^\[/.test(l)), 'closing lines name the champion, in the world\'s voice');
const m = G.newMeta(), old = newRun(m, {}, 'old'); G.endRun(old, m, 'erased');
const snap = m.erased[0];
ok(snap && snap.at, 'an erased run files its champion');
{ const r = newRun(m, {}, 'r'); ok(G.canSettle(r, m, { kind: 'erased', snap }), 'your own Erased champion can be settled');
  ok(!G.canSettle(r, m, { kind: 'erased', snap: Object.assign({}, snap, { at: 12345 }) }), "another player's cannot");
  ok(!G.canSettle(r, m, { kind: 'rival', id: 'grukk' }), 'a rival cannot');
  const p = newRun(m, {}, 'p'); p.practice = true; ok(!G.canSettle(p, m, { kind: 'erased', snap }), 'practice cannot'); }
{ const line = G.settleLine(snap); ok(line.includes(snap.champ) && !line.includes('{'), `the line is filled in: ${line}`); ok(G.settleLine(snap) === line, 'and the same each time'); }
{ const e = G.settleErased(m, snap.at, 1000);
  ok(e && !m.erased.some(s => s.at === snap.at) && m.settled[0].at === snap.at && m.settled[0].line === e.line, 'settling moves them to the Hall of the Settled');
  ok(G.settleErased(m, snap.at) === null, 'a champion settles once');
  const r = newRun(m, {}, 'after'); let back = false; for (let i = 0; i < 40; i++) { r.round = 5; r.met = []; const c = G.makeChoices(r, m, G.seedRng('c' + i)); if (c.some(x => x.snap && x.snap.at === snap.at)) back = true; }
  ok(!back, 'a settled champion never returns');
  const saved = G.migrateMeta(JSON.parse(JSON.stringify(m))); ok(saved.settled.length === 1 && saved.settled[0].line === e.line, 'the Hall of the Settled survives a save and load');
  ok(G.migrateMeta({ v: G.VERSION, settled: [{ nope: 1 }, null] }).settled.length === 0, 'odd saved entries are dropped'); }
console.log(fails ? `${fails} failed` : 'settle: all passed');
process.exit(fails ? 1 : 0);
