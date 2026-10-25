// Entrant Rank checks and a career sim.
//   node tools/rank.js [careers] [--seed S]
// Plays bot careers from a fresh save with real Rank Trials, world gating, perks and the RP formula,
// and reports how many runs each rank takes. The bot always takes a trial and ignores its condition.
const G = require('../js/core.js'), B = require('./bot.js');
const args = process.argv.slice(2), N = +args.find(a => /^\d+$/.test(a)) || 30, si = args.indexOf('--seed');
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
Math.random = seeded(si >= 0 ? +args[si + 1] : 1);
let n = 0, bad = 0;
const ok = (c, msg) => { n++; if (!c) { bad++; console.log('FAIL', msg); } };

// RP formula: 10 a win, 1 a Heart, 20 spared, times 1 + 0.2 per world rank
const fake = (wins, hearts, rank) => ({ wins, hearts, world: { rank } });
ok(G.rpFor(fake(8, 6, 0), 'spared') === 106, 'E world spared');
ok(G.rpFor(fake(8, 6, 5), 'spared') === 212, 'S world doubles');
ok(G.rpFor(fake(3, 0, 2), 'erased') === 42, 'C world erased');

// Gating: one rank above yours, F sees E and D
const m = G.newMeta();
const caps = G.RANK_LADDER.map(l => { m.rank.letter = l; return G.worldCap(m); });
ok(caps.join() === '1,1,2,3,4,5,5,5,5', 'world caps ' + caps.join());
m.rank.letter = 'F'; for (let i = 0; i < 300; i++) ok(G.offerWorlds(m).every(w => w.rank <= 1), 'F offers only E and D worlds');
delete m.rank; ok(G.worldCap(m) === null, 'no rank, no gating');

// Old saves get RP from their Halls and an E trial if they've earned it
const old = Object.assign(G.newMeta(), { champions: [{ wins: 8, hearts: 5 }], erased: [{ wins: 4, hearts: 0 }] }); delete old.rank;
const mig = G.migrateMeta(JSON.parse(JSON.stringify(old)));
ok(mig.rank.letter === 'F' && mig.rank.rp === 145 && mig.rank.trial === 'E', 'backfill ' + JSON.stringify(mig.rank));
const junk = G.migrateMeta(Object.assign(G.newMeta(), { rank: { letter: 'Z', rp: -5, trial: 'S', perks: ['nope', 'keen', 'keen'], history: [null, { to: 'C' }] } }));
ok(junk.rank.letter === 'F' && junk.rank.rp === 0 && junk.rank.trial === null && junk.rank.perks.join() === 'keen' && junk.rank.history.length === 1, 'sanitise ' + JSON.stringify(junk.rank));

// Trials: appear in their round as the second choice, at the target's world rank, and settle correctly
const meta = G.newMeta(); meta.rank.trial = 'C'; meta.rank.letter = 'D';
const w = Object.assign(G.offerWorlds(meta)[0], { rank: 0 });
const run = G.newRun(w, { name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, meta);
ok(run.trial && run.trial.to === 'C' && run.trial.round === 4, 'trial waits for round 4');
run.round = 3; ok(G.makeChoices(run, meta)[1].kind !== 'trial', 'not in round 3');
run.round = 4; const sp = G.makeChoices(run, meta)[1];
ok(sp.kind === 'trial' && sp.hard && sp.cond && sp.cond !== 'noheal' && G.specName(sp) === 'C-rank Proctor' && G.specRank(sp) === 'C', 'trial spec ' + JSON.stringify(sp));
ok(Math.abs(G.trialMul(run, sp) - (0.92 + 0.1) / 0.92) < 1e-9, 'C Proctor fights at C world rank');
ok(G.heartCost(run, sp) === G.HEART_COST[3], 'losing a trial costs the normal Hearts');
const ed = G.trialSpec(Object.assign({}, run, { trial: { to: 'D' } })); ok(!ed.hard && ed.cond === null, 'E and D trials: normal strength, no condition');
const fight = (won, turn) => ({ spec: sp, winner: won ? 'A' : 'B', turn, tally: { reactions: 9, bigStopped: 9, healed: 0 }, A: { hp: 99, maxHp: 100 } });
sp.cond = 'fast';
let msgs = []; let r = G.settleTrial(run, fight(true, 9), true, meta, msgs);
ok(!r.ok && meta.rank.letter === 'D' && meta.rank.trial === 'C' && /Trial failed/.test(msgs[0].text), 'missed condition keeps the trial');
run.pending = []; msgs = []; r = G.settleTrial(run, fight(true, 4), true, meta, msgs);
ok(r.ok && meta.rank.letter === 'C' && meta.rank.trial === null && run.promoted === 'C' && run.pending[0].type === 'perk' && run.pending[0].offers.length === 2, 'pass promotes and offers 2 perks');
const pk = run.pending[0].offers[0]; ok(G.choosePerk(run, meta, pk, msgs) && meta.rank.perks.includes(pk) && !run.pending.length, 'perk chosen');
ok(!G.choosePerk(run, meta, pk, msgs), 'no second pick');
// End of run: RP (an erased world keeps no Hearts), history, and the next trial opens once RP reaches it
meta.rank.rp = 1390; run.wins = 3; run.hearts = 4; const out = G.endRun(run, meta, 'erased');
ok(out.rp === 30 && meta.rank.trial === 'B' && out.trial === 'B' && meta.rank.history.slice(-1)[0].to === 'C', 'endRun pays RP and opens B trial ' + JSON.stringify(out));
// Pending World: no trial, no perks; practice: no RP
const dm = G.newMeta(); dm.rank.trial = 'E'; dm.rank.perks = ['stipend', 'keen'];
const date = '2026-10-25', dw = G.dailyWorld(date);
const dr = G.newRun(dw, { name: 'D', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [G.WORLD_TYPES[dw.type].gift], patron: 'war', seed: G.dailySeed(date), daily: date }, dm);
ok(!dr.trial && dr.perks.length === 0, 'Pending World ignores trials and perks');
// Perks apply
const pm = G.newMeta(); pm.rank.perks = ['stipend', 'redraft', 'frame', 'ledger', 'keen', 'guard'];
const base = G.newRun(w, { name: 'P', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, G.newMeta(), () => 0.5);
const pr = G.newRun(w, { name: 'P', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, pm, () => 0.5);
const P = G.runP(pr);
ok(pr.gold === base.gold + 1 && pr.rerolls === base.rerolls + 1 && G.maxHp(pr) === G.maxHp(base) + 8 && G.interestCap(pr) === G.interestCap(base) + 1 && P.critBonus >= 0.04 && P.startBlock >= 5, 'perk effects');
// Elite: a third fight from A-rank, scaling capped at the second
const em = G.newMeta(); em.rank.letter = 'A'; em.champions = [{ at: 1, champ: 'X', bar: [], gear: [] }, { at: 2, champ: 'Y', bar: [], gear: [] }];
const er = G.newRun(w, { name: 'E', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, em);
G.startElite(er, em); ok(er.eliteBracket.length === 3 && er.eliteBracket[2].id === 'undefeated' && er.eliteBracket[0].snap.at !== er.eliteBracket[1].snap.at, 'A-rank Elite has 3 fights');
er.eliteIdx = 2; const c2 = G.curRound(er); er.eliteIdx = 1; ok(c2 === G.curRound(er), 'Elite scaling capped at fight 2');
em.rank.letter = 'B'; const br = G.newRun(w, { name: 'E', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, em); G.startElite(br, em); ok(br.eliteBracket.length === 2, 'B-rank Elite has 2 fights');
// Champion rank: the filed champion keeps its Entrant's rank and climbs a letter every 3 wins elsewhere
const cm = G.newMeta(); cm.rank.letter = 'C';
const cr = G.newRun(w, { name: 'L', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, cm);
const cs = G.endRun(cr, cm, 'erased').snap;
ok(cs.rank === 'C' && cs.rp === 0 && cs.kills === 0, 'snapshot carries rank');
const l1 = G.champWin(cs, false), l2 = G.champWin(cs, false), l3 = G.champWin(cs, false);
ok(/has erased a world in another/.test(l1) && l2 === null && /now B-rank, has erased 3 worlds/.test(l3) && cs.rank === 'B' && cs.rp === 0, 'champion lines ' + [l1, l2, l3].join(' | '));
const top = { champ: 'Z', rank: 'S', rp: 20 }; G.champWin(top, true); ok(top.rank === 'S' && top.rp === 30, 'champion rank stops at S');
const sp2 = { champ: 'Q', rank: 'A', rp: 20 }; ok(/Your champion Q, now S-rank, has defended the elite bracket 1 time\./.test(G.champWin(sp2, true)), 'spared champion line');
const san = G.sanitizeSnap(Object.assign({}, cs, { rank: 'Q', rp: -4, kills: 'x' }), 'u'); ok(san.rank === null && san.rp === 0 && san.kills === 0, 'shared rank sanitised');
ok(G.sanitizeSnap(cs, 'u').rank === 'B', 'shared rank kept');
// Seasons
ok(G.weekOf('2026-10-25') === '2026-10-19' && G.weekOf('2026-10-26') === '2026-10-26' && G.weekOf('2026-11-01') === '2026-10-26', 'weeks run Monday to Sunday');
ok(G.weekDates('2026-10-26').length === 7 && G.weekDates('2026-10-26')[6] === '2026-11-01', 'week dates');
const day = k => Array.from({ length: k }, (_, i) => ({ uid: 'u' + i, name: 'N' + i, score: 1000 - i }));
const tbl = G.seasonTable([day(12), day(3), [{ uid: 'u11', name: 'Late', score: 5000, rank: 'B' }]]);
ok(tbl[0].uid === 'u0' && tbl[0].pts === 52 && tbl[0].days === 2, 'first place twice: 52 points');
const u11 = tbl.find(e => e.uid === 'u11'); ok(u11.pts === 1 + 26 && u11.name === 'Late' && u11.rank === 'B', 'outside top 10 pays 1, latest name and rank win');
ok(G.seasonTable([]).length === 0, 'empty week');
console.log(`rank: ${n - bad} of ${n} checks passed`);

// Career sim
const reach = {}, trials = {}, cap = 70;
for (let c = 0; c < N; c++) {
  const meta = G.newMeta();
  for (let i = 1; i <= cap && G.rankIdx(meta.rank.letter) < G.rankIdx('S'); i++) {
    const before = meta.rank.letter, t = meta.rank.trial;
    const res = B.playRun(meta, false, { noElite: false });
    if (t) { trials[t] = trials[t] || [0, 0]; const h = res.run.history.find(x => x.kind === 'trial'); if (h) { trials[t][1]++; if (meta.rank.letter !== before) trials[t][0]++; } }
    if (meta.rank.letter !== before) (reach[meta.rank.letter] = reach[meta.rank.letter] || []).push(i);
  }
}
const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
console.log(`career sim, ${N} careers (up to ${cap} runs each):`);
G.RANK_LADDER.slice(1, 7).forEach(l => console.log(`  ${l}: reached by ${(reach[l] || []).length}/${N}, median run ${reach[l] ? med(reach[l]) : '–'}, trial pass ${trials[l] ? Math.round(100 * trials[l][0] / trials[l][1]) + '% of ' + trials[l][1] : '–'}`));
process.exit(bad ? 1 : 0);
