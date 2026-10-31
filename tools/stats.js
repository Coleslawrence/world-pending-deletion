// Balance statistics from bot runs.
//   node tools/stats.js [runs] [elite] [options]
//   --batches B    run B batches of [runs] and report the average and the spread between batches (default 1)
//   --seed S       seed the random numbers so a run can be repeated exactly (default: unseeded)
//   --world T      force a world type (drowned, burning, hollow, verdant, sky, iron, steppes)
//   --main A       make the bot build around archetype A (pyre, venom, blade, bastion, arcanist, zealot, reaper, storm)
//   --unlock U     unlock U in every meta (arch_storm, arch_arcanist, ...; "all" for every unlock)
//   --json FILE    also write the results as JSON, for comparing before and after a change
//   --roll 1       the bot takes the Awakening's stat roll instead of placing its 4 points
//   --sys 1        the bot keeps the System's Gift picks with its bonus points
//   --rounds       add a loss-by-round table for each main archetype
//   --rank L       give every meta Entrant Rank L (F to SSS), with its world gating, Rank Trials and Elite bracket.
//                  Without it there is no rank at all: every world rank can come up and no trials appear.
const fs = require('fs');
const G = require('../js/core.js'); const B = require('./bot.js');

const pos = [], opt = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a === '--rounds') opt.rounds = true;
  else if (a.startsWith('--')) opt[a.slice(2)] = process.argv[++i];
  else pos.push(a);
}
const N = +pos[0] || 400, ELITE = pos[1] === 'elite', BATCHES = +opt.batches || 1;
if (opt.world && !G.WORLD_TYPES[opt.world]) throw new Error('unknown world ' + opt.world + ': ' + Object.keys(G.WORLD_TYPES).join(', '));
if (opt.rank && G.rankIdx(opt.rank) < 0) throw new Error('unknown rank ' + opt.rank + ': ' + G.RANK_LADDER.join(', '));
if (opt.main && !G.ARCH[opt.main]) throw new Error('unknown archetype ' + opt.main + ': ' + G.ARCH_KEYS.join(', '));
const unlocks = !opt.unlock ? [] : opt.unlock === 'all' ? Object.keys(G.UNLOCKS) : opt.unlock.split(',');
unlocks.forEach(u => { if (!G.UNLOCKS[u]) throw new Error('unknown unlock ' + u + ': ' + Object.keys(G.UNLOCKS).join(', ')); });

// mulberry32: the game and the bot both draw from Math.random, so seeding it makes a run repeatable
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function newMeta() { const m = G.newMeta(); unlocks.forEach(u => m.unlocks[u] = true); if (opt.rank) m.rank.letter = opt.rank; else delete m.rank; return m; }
const add = (o, k, won) => { o[k] = o[k] || [0, 0]; o[k][1]++; if (won) o[k][0]++; };

function batch(b) {
  if (opt.seed != null) Math.random = seeded(+opt.seed + b * 7919);
  const s = { res: {}, round: {}, final: {}, arch: {}, gift: {}, archRound: {} };
  let meta;
  for (let i = 0; i < N; i++) {
    if (i % (+process.env.RESET || 40) === 0) meta = newMeta();
    const r = B.playRun(meta, false, { noElite: !ELITE, world: opt.world, main: opt.main, roll: opt.roll, sys: opt.sys });
    const won = r.result !== 'erased';
    s.res[r.result] = (s.res[r.result] || 0) + 1;
    const c = G.runCounts(r.run); const top = Object.keys(c).sort((a, b) => c[b] - c[a])[0] || 'none';
    add(s.arch, top, won);
    r.run.history.forEach(h => { add(s.round, h.round, !h.won); s.archRound[top] = s.archRound[top] || {}; add(s.archRound[top], h.round, !h.won); });
    r.run.gifts.forEach(g => add(s.gift, g, won));
    add(s.final, G.WORLD_TYPES[r.w.type].final, won);
  }
  return s;
}

// Merge batches: each key gets the pooled rate plus the lowest and highest batch rate
function merge(list, get) {
  const out = {};
  list.forEach(s => Object.entries(get(s)).forEach(([k, v]) => { const o = out[k] = out[k] || { hit: 0, n: 0, rates: [] }; o.hit += v[0]; o.n += v[1]; o.rates.push(v[0] / v[1]); }));
  Object.values(out).forEach(o => { o.pct = 100 * o.hit / o.n; o.lo = 100 * Math.min(...o.rates); o.hi = 100 * Math.max(...o.rates); delete o.rates; });
  return out;
}

const batches = []; for (let b = 0; b < BATCHES; b++) batches.push(batch(b));
const total = batches.reduce((t, s) => { Object.entries(s.res).forEach(([k, v]) => t[k] = (t[k] || 0) + v); return t; }, {});
const runs = N * BATCHES, sparedPct = 100 * (runs - (total.erased || 0)) / runs;
const sparedB = batches.map(s => 100 * (N - (s.res.erased || 0)) / N);
const R = {
  args: { runs: N, batches: BATCHES, seed: opt.seed != null ? +opt.seed : null, elite: ELITE, world: opt.world || null, main: opt.main || null, unlocks },
  version: G.VERSION, results: total, spared: { pct: sparedPct, lo: Math.min(...sparedB), hi: Math.max(...sparedB) },
  lossByRound: merge(batches, s => s.round), byFinal: merge(batches, s => s.final), byArch: merge(batches, s => s.arch), byGift: merge(batches, s => s.gift),
  archRound: {},
};
Object.keys(R.byArch).forEach(a => R.archRound[a] = merge(batches, s => s.archRound[a] || {}));

const f = v => `${Math.round(v.pct)}%` + (BATCHES > 1 ? `[${Math.round(v.lo)}-${Math.round(v.hi)}]` : '') + `(${v.n})`;
const line = o => Object.entries(o).sort((a, b) => b[1].pct - a[1].pct).map(([k, v]) => `${k} ${f(v)}`).join(' ');
console.log(total, `spared ${sparedPct.toFixed(1)}%` + (BATCHES > 1 ? ` [${R.spared.lo.toFixed(1)}-${R.spared.hi.toFixed(1)}] over ${BATCHES} batches` : ''));
console.log('loss% by round', Object.entries(R.lossByRound).map(([k, v]) => `${k}:${f(v)}`).join(' '));
console.log('spared by final', line(R.byFinal));
console.log('by top archetype', line(R.byArch));
console.log('by gift', line(R.byGift));
if (opt.rounds) Object.entries(R.archRound).forEach(([a, o]) => console.log(`  ${a.padEnd(9)} loss% by round`, Object.entries(o).map(([k, v]) => `${k}:${Math.round(v.pct)}%`).join(' ')));
if (opt.json) { fs.writeFileSync(opt.json, JSON.stringify(R, null, 1)); console.log('wrote', opt.json); }
