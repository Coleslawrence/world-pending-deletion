// Pending World determinism checks: the same date plays out the same for everyone.
//   node tools/daily.js [date]
// A simple scripted player (no randomness of its own) plays the daily twice and the traces must match exactly:
// world, record, draft, shops, opponents, wagers, districts and events. Math.random is made to throw, so any
// game code that still draws from it during a seeded run fails loudly. Also checks that Echo unlocks don't change
// the run (level field), that a reroll in round 2 doesn't change round 3's opponents, and that a save reloaded
// mid-run carries on identically.
const G = require('../js/core.js');
const { choosePlayer } = require('./bot.js');
const assert = require('assert');
const date = process.argv[2] || G.dailyDate();
let checks = 0; const ok = (c, msg) => { assert(c, msg); checks++; };

function play(o = {}) {
  const meta = G.newMeta(); if (o.unlockAll) Object.keys(G.UNLOCKS).forEach(k => meta.unlocks[k] = true);
  const w = G.dailyWorld(date), rec = G.dailyRecord(date, w.type);
  const offer = G.makeOffer(w, G.levelMeta(meta), G.seedRng(G.dailySeed(date) + ':offer'));
  let run = G.newRun(w, { name: 'Test', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 2 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war', offer, record: rec, seed: G.dailySeed(date), daily: date, ranked: true }, meta);
  const trace = [];
  const T = (k, v) => trace.push(k + ' ' + JSON.stringify(v));
  T('world', w); T('record', run.record); T('offer', offer); T('arch', run.arch); T('gold', run.gold); T('draft', run.draft); T('quests', run.quests.map(q => q.id));
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  for (let guard = 0; guard < 30; guard++) {
    if (o.saveAt && run.round === o.saveAt && !run.reloaded) { run = JSON.parse(JSON.stringify(run)); run.reloaded = true; }
    if (run.stage === 'choose') { T('choices', run.choices.map(G.specKey)); T('wager', run.wager); G.chooseOpponent(run, run.round % 2, run.round % 2 === 1); }
    G.ensureShop(run); T('shop', run.shop);
    for (const k of G.SHOP_KINDS) for (let i = 0; i < 5; i++) if (run.bench.length < 6 && G.canBuy(run, run.shop[k][i])) G.buy(run, k, i, []);
    if (o.rerollAt === run.round) { G.reroll(run, null, 'skill'); G.reroll(run, null, 'gear'); }
    else if (run.round === 3) G.reroll(run, null, 'skill');
    run.bench.slice().forEach(p => G.equipBest(run, p.u));
    G.leaveShop(run, null, []); T('districts', run.districts);
    G.useDistrict(run, run.districts.includes('undercity') ? 'undercity' : run.districts[0]);
    while (run.pending.length) {
      const p = run.pending[0]; T('pending', p);
      if (p.type === 'event') { const E = G.EVENTS[p.key]; for (let i = 0; i < E.opts.length; i++) if (G.resolveEvent(run, p.key, i, meta, null, [])) break; }
      if (p.type === 'rune') { const m = p.mods.find(m => G.prefixTargets(run, m).length); if (m) G.applyPrefix(run, G.prefixTargets(run, m)[0].u, m); }
      if (p.type === 'gift') G.applyGift(run, p.offers[0], []);
      if (p.type === 'evo') { const f = G.findPiece(run, p.u); if (f) G.evolve(run, p.u, G.SKILLS[f.p.id].evo[0], meta); }
      if (run.pending[0] === p) run.pending.shift();
    }
    const f = G.newFight(run);
    for (let g = 0; !f.over && g < 300; g++) { if (f.phase === 'player') G.playerAct(f, choosePlayer(f)); else if (f.phase === 'stunned') G.skipPlayer(f); if (!f.over && f.phase === 'enemy') G.enemyTurn(f); }
    const r = G.resolveFight(run, f, meta);
    T('fight', { round: run.round, won: r.won, turns: f.turn, hp: f.A.hp, enemy: f.B.name, erased: r.erased });
    if (r.rewind) continue;
    if (r.death || r.spared) break;
  }
  T('end', { hearts: run.hearts, record: run.record, score: G.dailyScore(run) });
  return trace;
}
const realRandom = Math.random;
Math.random = () => { throw new Error('Math.random used during a seeded run'); };
const a = play(), b = play();
ok(a.length > 20, 'the run played: ' + a.length + ' trace lines');
a.forEach((l, i) => ok(l === b[i], 'same date, same run: ' + l.slice(0, 120) + '\n vs ' + (b[i] || '').slice(0, 120)));
ok(a.length === b.length, 'same length');
const u = play({ unlockAll: true });
u.forEach((l, i) => ok(l === a[i], 'Echo unlocks change nothing: ' + l.slice(0, 120)));
const reload = play({ saveAt: 4 });
reload.forEach((l, i) => ok(l === a[i], 'a reloaded save carries on the same: ' + l.slice(0, 120)));
// A reroll in round 2 doesn't change round 3's opponents
const rr = play({ rerollAt: 2 });
const round3 = t => t.filter(l => /^(choices|wager)/.test(l))[2];
ok(round3(rr) === round3(a), 'round 3 opponents unaffected by a round 2 reroll');
// Different days are different worlds, and the day turns over at 14:30 UTC
Math.random = realRandom;
const d1 = G.dailyDate(Date.UTC(2026, 9, 25, 14, 29)), d2 = G.dailyDate(Date.UTC(2026, 9, 25, 14, 30));
ok(d1 === '2026-10-25' && d2 === '2026-10-26', `day turns over at 14:30 UTC (${d1}, ${d2})`);
const worlds = new Set(); for (let d = 1; d <= 20; d++) worlds.add(JSON.stringify(G.dailyWorld(`2026-11-${String(d).padStart(2, '0')}`)));
ok(worlds.size === 20, 'twenty days, twenty worlds');
// A normal run still draws from Math.random
let calls = 0; Math.random = () => { calls++; return realRandom(); };
const m = G.newMeta(), nw = G.offerWorlds(m)[0]; G.newRun(nw, { name: 'N', stats: { STR: 2, AGI: 2, INT: 2, VIT: 2, LUK: 2 }, gifts: [], patron: 'war' }, m);
ok(calls > 0, 'normal runs still use Math.random');
Math.random = realRandom;
console.log(`daily ${date}: ${checks} checks passed (${a.length} trace lines, ${a.filter(l => l.startsWith('fight')).length} fights)`);
