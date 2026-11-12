// Collection test (Phase 8): Field notes fill in over three fights and never change a fight; Shared milestones open
// System lines and an Archive page.
//   node tools/collection-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function newRun(meta, setup, seed) {
  G.bindMeta(meta);
  const rng = G.seedRng(seed || 'n'), w = G.offerWorlds(meta, rng)[0];
  return G.newRun(w, Object.assign({ name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: 'war', startPts: 4, rollSeed: 'r' }, setup), meta, rng);
}
// --- Field notes
ok(G.noteFoes().length >= 30 && G.noteFoes().every(k => G.ENEMIES[k] && G.ENEMIES[k].hp && G.ENEMIES[k].style && G.ENEMIES[k].skills.length), 'every noted opponent has HP, a style and moves to show');
{ const m = G.newMeta(), r = newRun(m, {}, 'a'), msgs = [];
  G.noteFoe(r, m, { kind: 'rival', id: 'grukk' }, msgs); ok(G.noteLevel(m, 'grukk') === 1 && r.notesUp.length === 1, 'one fight: first notes');
  G.noteFoe(r, m, { kind: 'rival', id: 'grukk' }, msgs); G.noteFoe(r, m, { kind: 'rival', id: 'grukk' }, msgs);
  ok(G.noteLevel(m, 'grukk') === 3 && msgs.some(x => /Field notes complete: Grukk/.test(x.text)), 'three fights: complete, and the System says so');
  G.noteFoe(r, m, { kind: 'rival', id: 'grukk' }, msgs); ok(G.noteLevel(m, 'grukk') === 3 && r.notesUp.length === 3, 'more fights add nothing new');
  ok(!G.noteFoe(r, m, { kind: 'erased', snap: { at: 1 } }) && !G.noteFoe(r, m, { kind: 'entrant', id: 'nope' }), 'champions and filed records have no notes');
  const p = newRun(m, {}, 'p'); p.practice = true; G.noteFoe(p, m, { kind: 'monster', id: 'goblin' }); ok(!G.noteLevel(m, 'goblin'), 'practice notes nothing');
  const back = G.migrateMeta(JSON.parse(JSON.stringify(m))); ok(back.notes.grukk === 4, 'notes survive a save and load');
  ok(!G.migrateMeta({ v: G.VERSION, notes: { nope: 3 } }).notes.nope, 'unknown opponents are dropped'); }
// --- Handler's Quarters, cut before wpd-v17 (Slaw, 12 Nov): decor bought on dev comes back as Echoes
{ const back = G.migrateMeta({ v: G.VERSION, echoes: 2, decor: { chair: 1, banner: 1, nope: 1 } });
  ok(back.echoes === 42 && !('decor' in back) && !('decor' in G.newMeta()), 'old decor is refunded and dropped'); }
// --- Shared milestones
{ const m = G.newMeta(); ok(!G.sharedReached(m).length && G.sharedNext(m).at === G.SHARED_MILESTONES[0].at, 'a new save has reached nothing');
  ok(G.SHARED_MILESTONES.every((M, i) => M.line && /^\[.*\]$/.test(M.line) && (!i || M.at > G.SHARED_MILESTONES[i - 1].at)), 'milestones rise in order, each with a System line');
  const page = G.SHARED_MILESTONES.find(M => M.page);
  m.together = { spared: page.at, runs: 99 }; const r = (() => { G.bindMeta(m); const rng = G.seedRng('sh'), w = G.offerWorlds(m, rng)[0]; return G.newRun(w, { name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: 'war', startPts: 4, rollSeed: 'r' }, m, rng); })();
  G.settleStory(r, m, 'erased'); ok(m.story.open[page.page], 'a milestone\'s Archive page opens at the next run\'s end');
  ok(G.migrateMeta(JSON.parse(JSON.stringify(m))).together.spared === page.at && G.migrateMeta({ v: G.VERSION, together: { spared: -3 } }).together.spared === 0, 'the totals survive a save and load, cleaned'); }
console.log(fails ? `${fails} failed` : 'collection: all passed');
process.exit(fails ? 1 : 0);
