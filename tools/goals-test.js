// Goals test (Phase 6): weekly System Contracts are the same for everyone, pay once a week each and mark a full week;
// run goals offer one of each tier, are taken by the next normal run, and pay Echoes and Mastery XP when it ends.
//   node tools/goals-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
const base = () => G.newMeta();
function newRun(meta, setup, seed) {
  G.bindMeta(meta);
  const rng = G.seedRng(seed || 'g'), w = G.offerWorlds(meta, rng)[0];
  return G.newRun(w, Object.assign({ name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: Object.keys(G.GODS)[0], startPts: 4, rollSeed: 'r' }, setup), meta, rng);
}
// --- the list
Object.entries(G.GOALS).forEach(([k, g]) => {
  ok(g.text && [1, 2, 3].includes(g.tier) && ['fight', 'run', 'arch'].includes(g.board), `${k} has text, a tier and a board`);
  ok(!!g.feat !== !!g.end, `${k} is checked one way: a feat or the run's end`);
  if (g.feat) { const F = G.FEATS[g.feat]; ok(F && !F.unfairFor && !F.needs, `${k}: feat ${g.feat} exists and every archetype can do it`); ok(F && ['win', 'fight', 'merge', 'path', 'shop'].includes(F.at), `${k}: its feat is measured in a run`); }
  if (g.end) ok(typeof G.GOAL_ENDS[g.end] === 'function', `${k}: end check ${g.end} exists`);
});
ok(G.goalText('as:pyre') === 'Spare a world as a Pyromancer', `archetype goals name the path (${G.goalText('as:pyre')})`);
ok(G.goalValid('as:pyre') && !G.goalValid('as:nope') && !G.goalValid('fast:pyre') && !G.goalValid('nope'), 'goal ids are checked');
// --- the weekly board
{ let good = true, seen = new Set(); const d0 = Date.parse('2026-11-09T00:00:00Z');
  for (let i = 0; i < 52; i++) {
    const wk = new Date(d0 + i * 7 * 864e5).toISOString().slice(0, 10), b = G.contractBoard(wk);
    if (b.length !== 3 || new Set(b).size !== 3 || !b.every(G.goalValid) || G.GOALS[b[0]].board !== 'fight' || G.GOALS[b[1]].board !== 'run' || !b[2].startsWith('as:')) good = false;
    if (b.join() !== G.contractBoard(wk).join()) good = false;
    seen.add(b.join());
  }
  ok(good, 'every week: three different Contracts, one done in a run, one on how it ends, one archetype, the same each time asked');
  ok(seen.size > 30, `the board changes from week to week (${seen.size} different in 52)`); }
ok(G.contractWeek(Date.parse('2026-11-15T12:00:00Z')) === '2026-11-09' && G.contractWeek(Date.parse('2026-11-16T12:00:00Z')) === '2026-11-16', 'weeks start on Monday');
// --- doing Contracts
{ const m = base(), wk = G.contractsOf(m).week, board = G.contractBoard(wk), arch = board[2].split(':')[1], e0 = m.echoes;
  const r = newRun(m, {}, 'c1'); r.path = arch; r.round = 8;
  G.settleGoals(r, m, 'spared');
  ok(m.contracts.done[board[2]] && m.echoes - e0 >= G.CONTRACT_ECHOES[3], 'sparing a world as the week\'s archetype fulfils that Contract and pays');
  ok((r.contractsDone || []).some(x => x.id === board[2] && x.pay === G.CONTRACT_ECHOES[3]), 'the run remembers what it fulfilled, for the end screen');
  const e1 = m.echoes, r2 = newRun(m, {}, 'c2'); r2.path = arch; G.settleGoals(r2, m, 'spared');
  ok(!(r2.contractsDone || []).some(x => x.id === board[2]), 'a Contract pays only the first time in its week');
  ok(m.echoes === e1 + (r2.contractsDone || []).reduce((a, x) => a + x.pay, 0), 'and nothing more is paid for it');
  const weeks = m.contracts.weeks; board.forEach(id => G.noteContract(r2, m, id, []));
  ok(m.contracts.weeks === weeks + (board.every(id => m.contracts.done[id]) && weeks === 0 ? 1 : 0) && m.contracts.weeks === 1, 'all three in a week adds a week to the Contract Mark');
  board.forEach(id => G.noteContract(r2, m, id, [])); ok(m.contracts.weeks === 1, 'only once a week');
  const next = G.sanitizeContracts(m.contracts, '2099-01-05'); ok(next.week === '2099-01-05' && !Object.keys(next.done).length && next.weeks === 1, 'a new week clears the board but keeps the Mark');
  const back = G.migrateMeta(JSON.parse(JSON.stringify(m))); ok(back.contracts.weeks === 1 && board.every(id => back.contracts.done[id]), 'Contracts survive a save and load'); }
// --- a feat Contract or goal is met in the moment
const ctx = (r, turn, won) => ({ run: r, f: { turn }, T: { healed: 0, taken: 5, reactions: 0, overkill: 0, maxQuick: 0, bigHit: 10, stuns: 0 }, A: { hp: 60, maxHp: 100 }, B: { hp: 0, maxHp: 80 }, won, spec: { kind: 'monster' }, pieces: () => [] });
{ const m = base(); G.bindMeta(m); const r = newRun(m, {}, 'f'); r.goal = { id: 'fast', met: false }; const msgs = [];
  G.goalEvent(r, 'fight', ctx(r, 9, true), msgs); ok(!r.goal.met, 'a slow win does not meet "within 6 turns"');
  G.goalEvent(r, 'fight', ctx(r, 5, false), msgs); ok(!r.goal.met, 'a loss does not meet it');
  G.goalEvent(r, 'fight', ctx(r, 5, true), msgs); ok(r.goal.met && msgs.some(x => /Run goal met/.test(x.text)), 'a quick win meets it, and the System says so'); }
// --- the run goal offer
{ const m = base(), M = G.goalOffer(m, G.seedRng('o'));
  ok(M.offer.map(id => G.GOALS[id].tier).join() === '1,2,3' && M.offer.every(id => !G.GOALS[id].arch) && M.pick === null, 'one goal of each tier, none chosen yet');
  ok(G.goalOffer(m).offer.join() === M.offer.join(), 'the offer stays until a run takes it');
  ok(G.setGoal(m, 'nope') === null && G.setGoal(m, M.offer[1]) === M.offer[1], 'only an offered goal can be chosen');
  const back = G.migrateMeta(JSON.parse(JSON.stringify(m))); ok(back.goal && back.goal.pick === M.offer[1], 'the choice survives a save and load');
  const d = newRun(m, { seed: 'wpd:2026-12-03', daily: '2026-12-03' }); ok(!G.claimGoal(d, m) && m.goal && m.goal.pick === M.offer[1], 'Pending World takes no run goal and leaves the choice for the next world');
  const r = newRun(m, {}, 'r'); ok(G.claimGoal(r, m) && r.goal.id === M.offer[1] && !m.goal, 'a normal run takes the goal, and the next world draws a fresh offer');
  const m2 = base(); G.goalOffer(m2); const r2 = newRun(m2, {}, 'r2'); ok(!G.claimGoal(r2, m2) && !r2.goal && !m2.goal, 'no goal chosen: the run has none, and the offer is redrawn'); }
// --- paying the run goal
{ const m = base(), r = newRun(m, {}, 'p'); r.goal = { id: 'spare', met: false }; r.round = 8; r.wins = 8;
  const xp0 = G.masteryXp(r, 'spared'), e0 = m.echoes; G.endRun(r, m, 'spared');
  ok(r.goal.met && r.goal.paid === G.GOAL_PAY[3].echoes && r.goal.xp === G.GOAL_PAY[3].xp, 'a met goal pays its tier');
  ok(G.masteryXp(r, 'spared') === xp0 + G.GOAL_PAY[3].xp, 'its Mastery XP joins the run\'s');
  ok(m.echoes - e0 >= r.goal.paid, 'its Echoes are added');
  const paid = r.goal.paid; G.settleGoals(r, m, 'spared'); ok(r.goal.paid === paid, 'a goal is paid once'); }
{ const m = base(), r = newRun(m, {}, 'q'); r.goal = { id: 'spare', met: false }; G.endRun(r, m, 'erased');
  ok(!r.goal.met && r.goal.paid === 0 && r.goal.xp === 0, 'a missed goal pays nothing'); }
{ const m = base(), r = newRun(m, {}, 'q2'); r.goal = { id: 'rich', met: false }; r.gold = 40; G.endRun(r, m, 'erased');
  ok(r.goal.met && r.goal.paid === G.GOAL_PAY[1].echoes, 'a goal met in a lost run still pays'); }
{ const m = base(), r = newRun(m, {}, 'n'); r.goal = { id: 'nohosp', met: false }; r.infirmaryUsed = true; G.settleGoals(r, m, 'spared'); ok(!r.goal.met, 'the Infirmary breaks "without visiting the Infirmary"'); }
{ const m = base(), r = newRun(m, {}, 'l'); r.goal = { id: 'flawless', met: false }; r.losses = 1; G.settleGoals(r, m, 'spared'); ok(!r.goal.met, 'a lost fight breaks "without losing a fight"'); }
// --- practice checks nothing
{ const m = base(), r = newRun(m, {}, 'pr'); r.practice = true; r.goal = { id: 'spare', met: false }; r.path = G.contractBoard(G.contractsOf(m).week)[2].split(':')[1];
  G.settleGoals(r, m, 'spared'); ok(!r.goal.met && !Object.keys(m.contracts.done).length, 'practice runs meet no goals or Contracts'); }
console.log(fails ? `${fails} failed` : 'goals: all passed');
process.exit(fails ? 1 : 0);
