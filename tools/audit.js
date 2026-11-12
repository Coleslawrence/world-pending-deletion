// Numbers audit: plays bot careers and reports how gold, HP, Hearts, fights, events and Echoes actually flow.
//   node tools/audit.js [careers] [runsPerCareer] [--seed S] [--json FILE] [--main A]
// A career is one fresh meta played for runsPerCareer runs. After each run the career buys Echo unlocks (cheapest
// first), files Unfiled designs, buys a story page when nothing else is left, and takes a run goal when one
// is offered, so Echo income and spending can be read off. The bot's own play is tools/bot.js, unchanged.
'use strict';
const G = require('../js/core.js'), B = require('./bot.js');
const pos = [], opt = {};
for (let i = 2; i < process.argv.length; i++) { const a = process.argv[i]; if (a.startsWith('--')) opt[a.slice(2)] = process.argv[++i]; else pos.push(a); }
const CAREERS = +pos[0] || 10, RUNS = +pos[1] || 40;
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
if (opt.seed != null) Math.random = seeded(+opt.seed);

// ---- instrumentation: wrap the exported functions the bot calls ----
let R = null; // the current run's record
const spend = (k, n) => { if (R && n > 0) R.spent[k] = (R.spent[k] || 0) + n; };
function wrapGold(name, cat) { const f = G[name]; G[name] = function (run, ...a) { const g = run.gold; const r = f.call(this, run, ...a); spend(cat, g - run.gold); return r; }; }
wrapGold('buy', 'pieces'); wrapGold('trainStat', 'points'); wrapGold('reroll', 'rerolls'); wrapGold('buyVoucher', 'licences');
{ const f = G.resolveEvent; G.resolveEvent = function (run, key, idx, meta, rng, msgs) {
  const g = run.gold, hp = run.hp, h = run.hearts, st = G.STATS.reduce((a, k) => a + run.stats[k], 0) + run.statPts; const r = f.apply(this, arguments);
  if (r && R) { const e = R.events[key] = R.events[key] || { n: 0, gold: 0, hp: 0, hearts: 0, stats: 0 }; e.n++; e.gold += run.gold - g; e.hp += run.hp - hp; e.hearts += run.hearts - h; e.stats += G.STATS.reduce((a, k) => a + run.stats[k], 0) + run.statPts - st; R.evGold += run.gold - g; }
  return r; }; }
{ const f = G.resolveFight; G.resolveFight = function (run, fi, meta) {
  const g = run.gold, hearts = run.hearts, rd = run.elite ? 'E' + run.eliteIdx : run.round, lv = run.level; const res = f.apply(this, arguments);
  if (R && !res.rewind) R.fights.push({ round: rd, kind: fi.spec.kind, hard: !!fi.spec.hard, gate: !!fi.spec.gate, won: res.won, turns: fi.turn,
    hpLeft: Math.max(0, fi.A.hp) / fi.A.maxHp, foeLeft: Math.max(0, fi.B.hp) / fi.B.maxHp, foeHp: fi.B.maxHp, myHp: fi.A.maxHp, dealt: res.dealt ? Object.values(res.dealt).reduce((a, b) => a + b, 0) : 0,
    gold: run.gold - g, heartsLost: Math.max(0, hearts - run.hearts), level: lv });
  return res; }; }
{ const f = G.endRun; G.endRun = function (run, meta, outcome) { const e0 = meta.echoes; const r = f.apply(this, arguments); if (R) { R.echoBase = G.echoesFor(run, outcome); R.echoLadder = r.ladder.echoes; R.echoTotal = meta.echoes - e0; R.mastery = r.mastery; } return r; }; }

// ---- careers ----
const UNL = Object.keys(G.UNLOCKS).sort((a, b) => G.UNLOCKS[a].cost - G.UNLOCKS[b].cost);
function spendEchoes(meta, log) {
  // designs first (they add pieces), then unlocks cheapest first, then story pages
  let any = true;
  while (any) {
    any = false;
    for (const id of Object.keys(meta.designs.found || {})) if (!meta.designs.filed[id] && G.fileDesign(meta, id)) { log.push('design'); any = true; }
    for (const k of UNL) if (!meta.unlocks[k] && meta.echoes >= G.UNLOCKS[k].cost) { meta.echoes -= G.UNLOCKS[k].cost; meta.unlocks[k] = true; log.push(k); any = true; break; }
  }
  if (UNL.every(k => meta.unlocks[k])) { if (G.buyPage(meta)) log.push('page'); }
}
const all = [], careers = [];
for (let c = 0; c < CAREERS; c++) {
  const meta = G.newMeta(); delete meta.rank; if (opt.unlock === 'all') Object.keys(G.UNLOCKS).forEach(u => meta.unlocks[u] = true); let earned = 0; const timeline = [];
  for (let i = 0; i < RUNS; i++) {
    try { const off = G.goalOffer && G.goalOffer(meta); if (off && off.length && G.setGoal) G.setGoal(meta, off[Math.floor(Math.random() * off.length)]); } catch (e) { }
    R = { spent: {}, events: {}, fights: [], evGold: 0, startGold: 0 };
    const e0 = meta.echoes;
    const r = B.playRun(meta, false, { noElite: !opt.elite, main: opt.main, snap: (stage, run) => { if (stage === 'choose' && R.startGold == null) R.startGold = run.gold; if (stage === 'district') { (R.shopIn = R.shopIn || []).push([run.round, run.gold]); } if (stage === 'shop') { (R.shopOut = R.shopOut || []).push([run.round, run.gold]); } } });
    R.result = r.result; R.round = r.run.round; R.wins = r.run.wins; R.level = r.run.level; R.bought = r.run.bought || 0; R.hearts = r.run.hearts; R.maxHearts = r.run.maxHearts; R.endGold = r.run.gold;
    R.metaEchoGain = meta.echoes - e0; earned += Math.max(0, R.metaEchoGain); R.career = c; R.idx = i; R.arch = r.run.arch[0]; R.wrank = r.run.world.rank;
    const log = []; spendEchoes(meta, log); timeline.push({ i, earned, bought: log });
    all.push(R); R = null;
  }
  careers.push({ timeline, unlocks: Object.keys(meta.unlocks).length, mastery: meta.mastery, echoesLeft: meta.echoes, designs: Object.keys(meta.designs.filed || {}).length, found: Object.keys(meta.designs.found || {}).length, pages: Object.keys((meta.story && meta.story.open) || {}).length, priorityMax: meta.priority && meta.priority.max });
}

// ---- report ----
const avg = (a, f) => a.length ? a.reduce((s, x) => s + f(x), 0) / a.length : 0, f1 = v => (Math.round(v * 10) / 10).toFixed(1);
const out = { runs: all.length };
out.spared = 100 * all.filter(r => r.result !== 'erased').length / all.length;
out.echoPerRun = avg(all, r => r.metaEchoGain); out.echoBase = avg(all, r => r.echoBase || 0);
out.echoSpared = avg(all.filter(r => r.result !== 'erased'), r => r.metaEchoGain); out.echoErased = avg(all.filter(r => r.result === 'erased'), r => r.metaEchoGain);
const cats = ['pieces', 'points', 'rerolls', 'licences']; out.spend = {}; cats.forEach(k => out.spend[k] = avg(all, r => r.spent[k] || 0));
out.evGold = avg(all, r => r.evGold); out.endGold = avg(all, r => r.endGold); out.level = avg(all, r => r.level); out.bought = avg(all, r => r.bought);
// fights by round
const fr = {}; all.forEach(r => r.fights.forEach(x => { const k = x.round; (fr[k] = fr[k] || []).push(x); }));
out.byRound = {}; Object.keys(fr).sort().forEach(k => { const L = fr[k]; out.byRound[k] = { n: L.length, win: 100 * avg(L, x => x.won), turns: avg(L, x => x.turns), hpLeftWin: 100 * avg(L.filter(x => x.won), x => x.hpLeft), foeLeftLoss: 100 * avg(L.filter(x => !x.won), x => x.foeLeft), foeHp: avg(L, x => x.foeHp), myHp: avg(L, x => x.myHp), hard: 100 * avg(L, x => x.hard), hardWin: 100 * avg(L.filter(x => x.hard), x => x.won), easyWin: 100 * avg(L.filter(x => !x.hard), x => x.won), heartsLost: avg(L.filter(x => !x.won), x => x.heartsLost), level: avg(L, x => x.level), dpt: avg(L, x => x.dealt / Math.max(1, x.turns)) }; });
// gold by round: at the shop door and after shopping
const gr = {}; all.forEach(r => (r.shopIn || []).forEach(([k, g], j) => { const o = gr[k] = gr[k] || { in: [], out: [] }; o.in.push(g); const so = (r.shopOut || [])[j]; if (so) o.out.push(so[1]); }));
out.goldByRound = {}; Object.keys(gr).forEach(k => out.goldByRound[k] = { in: avg(gr[k].in, x => x), out: avg(gr[k].out, x => x) });
// events
const ev = {}; all.forEach(r => Object.entries(r.events).forEach(([k, e]) => { const o = ev[k] = ev[k] || { n: 0, gold: 0, hp: 0, hearts: 0, stats: 0 }; Object.keys(e).forEach(z => o[z] += e[z]); }));
out.events = ev;
// careers: when unlocks are afforded
const firstAt = {}; careers.forEach(C => C.timeline.forEach(t => t.bought.forEach(b => { (firstAt[b] = firstAt[b] || []).push(t.i + 1); })));
out.unlockRun = {}; Object.keys(firstAt).forEach(k => { const L = firstAt[k].filter((x, i, a) => k === 'design' || k === 'page' || true); out.unlockRun[k] = { n: L.length, firstAvg: avg(L, x => x) }; });
out.allUnlocksBy = avg(careers, C => { const t = C.timeline.find(t => t.bought.length && UNL.every(k => C.timeline.slice(0, t.i + 1).some(x => x.bought.includes(k)))); return t ? t.i + 1 : RUNS + 1; });
out.mastery = {}; G.ARCH_KEYS.forEach(k => out.mastery[k] = avg(careers, C => G.masteryLevel(C.mastery[k] || 0)));
out.careerEnd = { echoesLeft: avg(careers, C => C.echoesLeft), designsFiled: avg(careers, C => C.designs), designsFound: avg(careers, C => C.found), pages: avg(careers, C => C.pages), priorityMax: avg(careers, C => C.priorityMax || 0) };
out.echoByRunIdx = []; for (let i = 0; i < RUNS; i += Math.max(1, Math.floor(RUNS / 8))) out.echoByRunIdx.push([i + 1, f1(avg(careers, C => C.timeline[i].earned))]);

console.log(`runs ${out.runs}  spared ${f1(out.spared)}%  level ${f1(out.level)}  points bought ${f1(out.bought)}`);
console.log(`Echoes a run ${f1(out.echoPerRun)} (base ${f1(out.echoBase)}; spared ${f1(out.echoSpared)}, erased ${f1(out.echoErased)})`);
console.log(`gold spent a run: ${cats.map(k => k + ' ' + f1(out.spend[k])).join(', ')}; events net ${f1(out.evGold)}; left at end ${f1(out.endGold)}`);
console.log('round  n     win%  turns  hpLeft(win)  foeLeft(loss)  foeHP  myHP  hard%  hardWin  easyWin  heartsLost  level  dmg/turn  gold in/out');
Object.entries(out.byRound).forEach(([k, o]) => console.log(`${String(k).padEnd(6)} ${String(o.n).padEnd(5)} ${f1(o.win).padStart(5)} ${f1(o.turns).padStart(6)} ${f1(o.hpLeftWin).padStart(11)} ${f1(o.foeLeftLoss).padStart(14)} ${f1(o.foeHp).padStart(6)} ${f1(o.myHp).padStart(5)} ${f1(o.hard).padStart(6)} ${f1(o.hardWin).padStart(8)} ${f1(o.easyWin).padStart(8)} ${f1(o.heartsLost).padStart(11)} ${f1(o.level).padStart(6)} ${f1(o.dpt).padStart(9)}  ${out.goldByRound[k] ? f1(out.goldByRound[k].in) + '/' + f1(out.goldByRound[k].out) : ''}`));
console.log('Echo career: earned by run', out.echoByRunIdx.map(x => x.join(':')).join('  '));
console.log('first afforded at run:', Object.entries(out.unlockRun).map(([k, o]) => `${k} ${f1(o.firstAvg)} (x${o.n})`).join(', '));
console.log('all Echo unlocks owned by run', f1(out.allUnlocksBy), ' career end:', JSON.stringify(Object.fromEntries(Object.entries(out.careerEnd).map(([k, v]) => [k, +f1(v)]))));
console.log('mastery level at career end:', Object.entries(out.mastery).map(([k, v]) => k + ' ' + f1(v)).join(', '));
const evs = Object.entries(ev).sort((a, b) => b[1].n - a[1].n);
console.log('events (n, avg gold, hp, hearts, stats):'); evs.forEach(([k, e]) => console.log(`  ${k.padEnd(22)} ${String(e.n).padStart(5)} ${f1(e.gold / e.n).padStart(6)} ${f1(e.hp / e.n).padStart(6)} ${(e.hearts / e.n).toFixed(2).padStart(6)} ${(e.stats / e.n).toFixed(2).padStart(6)}`));
if (opt.json) require('fs').writeFileSync(opt.json, JSON.stringify(out, null, 1));
