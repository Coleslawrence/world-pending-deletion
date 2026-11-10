// Ladder test (Phase 4): Priority levels stack their rules, open one at a time by sparing a world at your highest, and
// pay more Echoes; Challenge worlds apply their twist and pay once; Marks rise with the Priority a world was spared at;
// Past the Undefeated goes on one Depth at a time and records the best; Pending World and practice have none of it.
//   node tools/ladder-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js'), bot = require('./bot.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
const near = (a, b) => Math.abs(a - b) < 1e-9;
function newRun(meta, setup) {
  G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, Object.assign({ name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta) }, setup), meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta, undefined, run.gearDraft[0]);
  return run;
}
const fresh = max => { const m = G.newMeta(); delete m.rank; m.priority = { max: max || 0, set: 0 }; return m; };
// --- Priority: clamping and stacking
ok(G.PRIORITY.length === 10, '10 Priority levels');
{ const m = fresh(3);
  ok(G.setPriority(m, 2) === 2 && G.setPriority(m, 9) === 3 && G.setPriority(m, -4) === 0, 'Priority is clamped to what is open');
  ok(newRun(m, { priority: 7 }).priority === 3, 'a run cannot start above the open level');
  G.setPriority(m, 2); ok(newRun(m, {}).priority === 2, 'a run starts at the chosen level');
  ok(!newRun(m, { priority: 3, seed: 'wpd:ladder' }).priority, 'Pending World has no Priority');
  ok(JSON.stringify(G.sanitizePriority(undefined)) === '{"max":0,"set":0}' && G.sanitizePriority({ max: 99, set: 99 }).max === 10, 'old saves and odd values are made safe'); }
for (let n = 0; n <= 10; n++) {
  const m = fresh(10), base = newRun(fresh(0), {}), run = newRun(m, { priority: n }), A = G.amendOf(run), R = G.priorityRules(n);
  ok(R.length === n, `Priority ${n}: ${n} rules`);
  const mul = k => R.reduce((x, r) => x * (r[k] || 1), 1), sum = k => R.reduce((x, r) => x + (r[k] || 0), 0);
  ok(near(A.foeHp, mul('foeHp')) && near(A.foeDmg, mul('foeDmg')) && near(A.finalHp, mul('finalHp')) && A.income === sum('income') && A.heartCut === sum('heartCut') && A.traitUp === sum('traitUp') && A.rerollUp === sum('rerollUp'), `Priority ${n}: rules stack`);
  ok(run.hearts === 10 - sum('erase') && run.maxHearts === 10, `Priority ${n}: starts ${sum('erase')} Heart(s) down`);
  run.freeRerolls = 0; base.freeRerolls = 0;
  const plain = Object.assign({}, run, { priority: 0 });
  ok(G.rerollCost(run) === G.rerollCost(plain) + sum('rerollUp'), `Priority ${n}: reroll cost`);
  ok(G.heartCost(run, {}) === Math.max(1, G.heartCost(plain, {}) - sum('heartCut')), `Priority ${n}: Heart cost`);
  if (n >= 5) ok(run.choices.filter(c => c.kind === 'monster' || c.kind === 'rival').every(c => (c.traits || []).length >= 1), `Priority ${n}: every opponent has a trait in round 1`);
  run.wins = 4; ok(G.echoesFor(run, 'spared') === Math.round(G.echoesFor(Object.assign({}, run, { priority: 0 }), 'spared') * (1 + 0.1 * n)) || !!run.world.bounty, `Priority ${n}: Echoes +${n * 10}%`);
  run.elite = true; ok(near(G.amendOf(run).foeHp, 1), `Priority ${n}: not in the Elite bracket`);
}
// --- Opening the next level
{ const m = fresh(0);
  for (let n = 0; n < 12; n++) {
    const run = newRun(m, { priority: n }), was = m.priority.max, r = G.endRun(run, m, 'spared');
    ok(m.priority.max === Math.min(10, was + 1), `sparing at Priority ${was} opens ${Math.min(10, was + 1)}`);
    ok(r.ladder.opened === (was < 10 ? was + 1 : 0), 'the end screen is told');
  }
  const run = newRun(m, { priority: 4 }); G.endRun(run, m, 'spared'); ok(m.priority.max === 10, 'sparing below your highest opens nothing');
  const m2 = fresh(2), lost = newRun(m2, { priority: 2 }); G.endRun(lost, m2, 'erased'); ok(m2.priority.max === 2 && !Object.keys(m2.marks.arch).length, 'an erased world opens nothing and earns no Mark');
  const m3 = fresh(0), seeded = newRun(m3, { seed: 'wpd:ladder-2' }); G.endRun(seeded, m3, 'spared'); ok(m3.priority.max === 0 && !Object.keys(m3.marks.world).length, 'Pending World opens nothing and earns no Mark'); }
// --- Marks
{ ok(!G.markTier(0) && G.markTier(1).name === 'Bronze' && G.markTier(2).name === 'Silver' && G.markTier(5).name === 'Gold' && G.markTier(8).name === 'Platinum' && G.markTier(11).name === 'Black', 'Mark grades');
  const m = fresh(10);
  let run = newRun(m, { priority: 0 }), r = G.endRun(run, m, 'spared');
  ok(m.marks.arch[run.arch[0]] === 1 && m.marks.world[run.world.type] === 1 && r.ladder.marks.length === 2 && r.ladder.marks.every(x => x.tier === 'Bronze'), 'a first spared world earns Bronze on its archetype and world type');
  const home = run.arch[0];
  for (let k = 0; k < 400 && !(run.arch[0] === home && run.priority === 6); k++) run = newRun(m, { priority: 6 });
  if (run.arch[0] === home) { r = G.endRun(run, m, 'spared'); ok(m.marks.arch[home] === 7 && r.ladder.marks.some(x => x.kind === 'arch' && x.tier === 'Gold'), 'sparing at Priority 6 raises the Mark to Gold');
    run = newRun(m, { priority: 1 }); for (let k = 0; k < 400 && run.arch[0] !== home; k++) run = newRun(m, { priority: 1 }); if (run.arch[0] === home) { r = G.endRun(run, m, 'spared'); ok(m.marks.arch[home] === 7 && !r.ladder.marks.some(x => x.kind === 'arch'), 'a lower clear never lowers a Mark'); } } }
// --- Challenge worlds
Object.entries(G.CHALLENGES).forEach(([id, C]) => {
  const m = fresh(0), base = newRun(fresh(0), {}), run = newRun(m, { challenge: id }), A = G.amendOf(run);
  ok(run.challenge === id, `${id}: on the run`);
  if (C.erase) ok(run.hearts === 10 - C.erase, `${id}: Hearts`);
  if (C.archs) ok(run.arch.length === C.archs && G.allPieces(run).every(p => G.pieceDef(p.id).tags.some(t => run.arch.includes(t)) || G.pieceDef(p.id).basic), `${id}: the pool keeps ${C.archs} archetypes`);
  if (C.traitUp) ok(A.traitUp === C.traitUp && run.choices.filter(c => c.kind === 'monster' || c.kind === 'rival').every(c => (c.traits || []).length >= C.traitUp), `${id}: more traits`);
  if (C.income) ok(A.income === C.income && A.winGold === (C.winGold || 0), `${id}: income and win gold`);
  if (C.foeHp) ok(near(A.foeHp, C.foeHp) && near(A.foeDmg, C.foeDmg), `${id}: opponents`);
  const g0 = m.echoes, r = G.endRun(run, m, 'spared');
  ok(r.ladder.echoes === G.CHALLENGE_ECHOES && m.marks.challenge[id] === 1, `${id}: the first clear pays ${G.CHALLENGE_ECHOES} Echoes and a Mark`);
  const again = newRun(m, { challenge: id }), r2 = G.endRun(again, m, 'spared');
  ok(r2.ladder.echoes === 0, `${id}: only the first clear pays`);
  ok(!newRun(fresh(0), { challenge: id, seed: 'wpd:ch' }).challenge && !newRun(fresh(0), { challenge: 'nope' }).challenge, `${id}: not in Pending World; unknown ids ignored`);
});
// --- Past the Undefeated
{ let climbed = 0;
  for (let k = 0; k < 60 && climbed < 3; k++) {
    const meta = G.newMeta(), r = bot.playRun(meta, false, {});
    if (r.result !== 'elite-clear') continue;
    const run = r.run, n0 = run.eliteBracket.length, w0 = run.eliteWins;
    ok(G.canClimb(run), 'the climb is offered once the Undefeated has fallen');
    ok(G.startEndless(run, meta), 'the climb starts');
    ok(run.endless === 1 && run.eliteBracket.length === n0 + 1 && run.eliteIdx === n0 && G.currentSpec(run).depth === 1, 'Depth 1 is next');
    ok(/Depth 1/.test(G.specName(G.currentSpec(run))) && near(G.depthMul(run), 1 + G.DEPTH_SCALE), 'Depth 1 is named and 20% stronger');
    ok(G.bracketMap(run).elite.length === n0 + 1, 'the bracket map shows the Depth');
    // win Depth 1 and 2 by decree, then lose Depth 3
    for (const d of [1, 2]) { const f = G.newFight(run); f.winner = 'A'; f.B.hp = 0; const res = G.resolveFight(run, f, meta); ok(res.depth === d && !res.eliteOver && run.endless === d + 1 && meta.marks.depth === d, `Depth ${d} cleared, Depth ${d + 1} is next, best is ${d}`); run.pending = []; if (run.stage === 'district') G.useDistrict(run, run.districts[0]); run.pending = []; G.leaveShop(run, null, []); }
    ok(run.eliteWins === w0 + 2, 'each Depth counts as an Elite win');
    const f = G.newFight(run); f.winner = 'B'; f.A.hp = 0; const res = G.resolveFight(run, f, meta);
    ok(res.eliteOver && !res.eliteCleared && !res.death && meta.marks.depth === 2, 'a loss ends the climb; the world stays spared; best Depth kept');
    climbed++;
  }
  ok(climbed > 0, 'a bot cleared the Elite bracket'); }
{ const m = fresh(0), run = newRun(m, {}); ok(!G.canClimb(run) && !G.startEndless(run, m), 'no climb outside the Elite bracket'); }
console.log(fails ? `${fails} failure(s)` : 'ladder: all good');
process.exit(fails ? 1 : 0);
