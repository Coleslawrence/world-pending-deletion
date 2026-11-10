// Story drip test (Phase 7): milestone pages open at their moment, drip pages open in order every few runs and with each
// new Priority level, the next one can be bought early, and practice opens nothing.
//   node tools/story-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function newRun(meta, setup, seed) {
  G.bindMeta(meta);
  const rng = G.seedRng(seed || 's'), w = G.offerWorlds(meta, rng)[0];
  return G.newRun(w, Object.assign({ name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: 'war', startPts: 4, rollSeed: 'r' }, setup), meta, rng);
}
Object.entries(G.STORY_PAGES).forEach(([k, P]) => { ok(P.title && P.text && P.by, `${k} has a title, text and author`); if (P.at) ok(P.opens && /^(erased|spared|settled|shared|rank:[A-Z]+)$/.test(P.at), `${k} has a moment and says what opens it`); });
ok(G.storyDrips().length >= 8, 'at least eight drip pages');
// --- milestones
{ const m = G.newMeta(), r = newRun(m, {}, 'a'); G.endRun(r, m, 'erased');
  ok(m.story.open.m_erased && r.pagesOpened.includes('m_erased') && !m.story.open.m_spared, 'losing a world opens the Notice of Erasure, nothing else');
  const r2 = newRun(m, {}, 'b'); G.endRun(r2, m, 'spared'); ok(m.story.open.m_spared, 'sparing a world opens the Certificate');
  m.rank.letter = 'C'; const r3 = newRun(m, {}, 'c'); G.endRun(r3, m, 'erased'); ok(m.story.open.m_rank_d && !m.story.open.m_rank_b, 'reaching D-rank (or past it) opens its page');
  m.settled = [{ at: 1, champ: 'X', worldName: 'Y', line: 'z', when: 0 }]; const r4 = newRun(m, {}, 'd'); G.endRun(r4, m, 'erased'); ok(m.story.open.m_settled, 'settling a champion opens the Ledger'); }
// --- drip
{ const m = G.newMeta(), drips = G.storyDrips(), opened = () => drips.filter(k => m.story.open[k]);
  for (let i = 0; i < G.STORY_EVERY - 1; i++) G.endRun(newRun(m, {}, 'x' + i), m, 'erased');
  ok(opened().length === 0, `nothing drips before ${G.STORY_EVERY} runs`);
  G.endRun(newRun(m, {}, 'x9'), m, 'erased'); ok(opened().join() === drips[0], 'the first drip page opens on schedule');
  const r = newRun(m, {}, 'pr'); r.ladder = { opened: 1 }; G.settleStory(r, m, 'spared'); ok(opened().join() === drips.slice(0, 2).join(), 'a new Priority level opens the next page, in order');
  m.echoes = 100; const k = G.buyPage(m); ok(k === drips[2] && m.echoes === 100 - G.STORY_PRICE, 'the next page can be bought early');
  m.echoes = G.STORY_PRICE - 1; ok(!G.buyPage(m), 'not without the Echoes');
  const p = newRun(m, {}, 'pp'); p.practice = true; const before = opened().length; for (let i = 0; i < 5; i++) G.settleStory(p, m, 'spared'); ok(opened().length === before, 'practice opens no pages');
  m.echoes = 9999; while (G.buyPage(m)); ok(!G.nextDrip(m) && opened().length === drips.length, 'every page can be read in the end');
  const back = G.migrateMeta(JSON.parse(JSON.stringify(m))); ok(Object.keys(back.story.open).length === Object.keys(m.story.open).length, 'pages survive a save and load');
  ok(!G.migrateMeta({ v: G.VERSION, story: { open: { nope: 1 } } }).story.open.nope, 'unknown pages are dropped'); }
console.log(fails ? `${fails} failed` : 'story: all passed');
process.exit(fails ? 1 : 0);
