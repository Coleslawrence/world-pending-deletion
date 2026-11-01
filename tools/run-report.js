// Playtest stats report: turns exported run summaries (Firestore runs/, see runSummary in js/core.js) into the
// numbers the stats dashboard shows, with game names filled in from core.js.
//   node tools/run-report.js runs.json [out.json]   runs.json: an array of run documents, or an object keyed by document id
//   node tools/run-report.js --sample N [out.json]  N bot runs instead, to try the dashboard before real data exists
// Output goes to stdout without out.json. --split DIR instead of out.json writes one row table per file (the dashboard's sources).
//   --ver wpd-v10   only runs from that release (several: --ver wpd-v9,wpd-v10). Runs posted before summaries carried
//                   their release (wpd-v10 and older) get one from the time they finished, by the ship times below.
const fs = require('fs');
const G = require('../js/core.js');

const args = process.argv.slice(2);
let runs, source = 'playtest';
if (args[0] === '--sample') {
  const B = require('./bot.js'), N = +args[1] || 60; source = 'sample'; runs = [];
  const metas = ['D', 'C', 'A'].map(l => { const m = G.newMeta(); m.rank.letter = l; return m; }), day0 = Date.parse('2026-10-20T03:00:00Z');
  // The bot never goes to the Undercity on its own; send it there sometimes so events show up in the sample
  const use = G.useDistrict; G.useDistrict = (run, k, rng) => use(run, run.districts.includes('undercity') && Math.random() < 0.45 ? 'undercity' : k, rng);
  for (let i = 0; i < N; i++) {
    const m = metas[i % 3], r = B.playRun(m, false, { noElite: true, hardRate: 0.2 + 0.15 * (i % 3) });
    const at = day0 + Math.floor(i * 7 * 864e5 / N), quit = r.result === 'erased' && Math.random() < 0.1;
    r.run.t0 = at - (15 + Math.floor(Math.random() * 25)) * 6e4;
    runs.push(Object.assign(G.runSummary(r.run, m, quit ? 'abandoned' : r.result === 'spared' ? 'spared' : 'erased', at), { id: 'bot' + (i % 3) + '_' + at }));
  }
  args.splice(0, 2);
} else {
  const raw = JSON.parse(fs.readFileSync(args.shift(), 'utf8'));
  runs = Array.isArray(raw) ? raw : Object.entries(raw).map(([id, d]) => Object.assign({ id }, d));
}
// When each release went live (UTC). A run with no ver is put in the last release shipped before it finished; a phone
// still running a cached older build can land one release late, so newer summaries carry their own ver instead.
const SHIPS = [['wpd-v5', '2026-10-27T16:35Z'], ['wpd-v6', '2026-10-28T13:23Z'], ['wpd-v7', '2026-10-29T12:34Z'], ['wpd-v8', '2026-10-29T15:31Z'],
  ['wpd-v9', '2026-10-29T23:26Z'], ['wpd-v10', '2026-10-31T09:19Z']].map(([v, t]) => [v, Date.parse(t)]);
const verAt = at => { let v = 'wpd-v4'; SHIPS.forEach(([n, t]) => { if (at >= t) v = n; }); return v; };
const verNum = v => +(String(v).match(/(\d+)$/) || [0, 0])[1];
const vi = args.indexOf('--ver'), only = vi >= 0 ? args.splice(vi, 2)[1].split(',') : null;
runs = runs.filter(r => r && r.outcome && r.world).map(r => Object.assign(r, { ver: r.ver || verAt(r.at), verGuessed: !r.ver })).sort((a, b) => a.at - b.at);
const allRuns = runs;
if (only) runs = runs.filter(r => only.includes(r.ver));

const pct = (a, b) => b ? Math.round(100 * a / b) : null;
const avg = xs => xs.length ? Math.round(10 * xs.reduce((a, b) => a + b, 0) / xs.length) / 10 : null;
const median = xs => { if (!xs.length) return null; const s = xs.slice().sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const spared = r => r.outcome === 'spared';
const total = runs.length, baseline = pct(runs.filter(spared).length, total);

// Groups runs by a key and gives each group its spared odds
function group(keyOf, labelOf) {
  const g = {};
  runs.forEach(r => [].concat(keyOf(r)).forEach(k => { if (k == null) return; (g[k] = g[k] || []).push(r); }));
  return Object.entries(g).map(([k, rs]) => ({ key: k, label: labelOf(k), runs: rs.length, spared: rs.filter(spared).length, pct: pct(rs.filter(spared).length, rs.length), avgRound: avg(rs.map(r => r.round)) }))
    .sort((a, b) => b.runs - a.runs || b.pct - a.pct);
}
const archLabel = k => k === 'none' ? 'No path yet' : G.ARCH[k] ? G.ARCH[k].path : k;
const eventLabel = k => { const [key, i] = k.split('.'), E = G.EVENTS[key]; return E && E.opts[+i] ? { title: E.title, opt: E.opts[+i].label } : { title: key, opt: 'Option ' + i }; };
const pickLabel = k => {
  const [t, v] = [k.slice(0, 1), k.slice(2)];
  if (t === 'e') { const l = eventLabel(v); return `${l.title}: ${l.opt}`; }
  if (t === 'd') return G.DISTRICTS[v] ? G.DISTRICTS[v].name : v;
  if (t === 'w') return `Wager with ${G.GODS[v] ? G.GODS[v].name : v}`;
  return k;
};
const nameOf = (T, k) => T[k] ? T[k].name : k;

// Rounds: how often each round's fight was won, and how many runs ended there (the settled slip)
const rounds = [];
for (let n = 1; n <= G.ROUNDS; n++) {
  const fs_ = runs.flatMap(r => (r.fights || []).filter(f => f.r === n));
  rounds.push({ r: n, fights: fs_.length, won: fs_.filter(f => f.w).length, pct: pct(fs_.filter(f => f.w).length, fs_.length), hard: pct(fs_.filter(f => f.h).length, fs_.length), ended: runs.filter(r => !spared(r) && r.round === n).length });
}

// What moved the odds: anything picked in at least MIN runs, by how far its runs' spared odds sit from the baseline
const MIN = Math.max(3, Math.round(total * 0.05));
const uniq = xs => [...new Set(xs || [])];
const moves = [].concat(
  group(r => uniq(r.picks), pickLabel).map(x => Object.assign(x, { kind: x.key[0] === 'e' ? 'Event' : x.key[0] === 'd' ? 'District' : 'Wager' })),
  group(r => uniq(r.gifts), k => nameOf(G.GIFTS, k)).map(x => Object.assign(x, { kind: 'Gift' })),
  group(r => uniq(r.bar), k => nameOf(G.SKILLS, k)).map(x => Object.assign(x, { kind: 'Skill' })),
  group(r => uniq(r.gear), k => nameOf(G.GEAR, k)).map(x => Object.assign(x, { kind: 'Gear' })),
).filter(x => x.runs >= MIN && x.runs < total).map(x => Object.assign(x, { delta: x.pct - baseline })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || b.runs - a.runs);

// Which choices get picked: each event's options by how often they were taken
const evs = {};
runs.forEach(r => (r.picks || []).filter(p => p[0] === 'e').forEach(p => { const [key, i] = p.slice(2).split('.'); evs[key] = evs[key] || {}; evs[key][i] = (evs[key][i] || 0) + 1; }));
const events = Object.entries(evs).map(([key, o]) => {
  const n = Object.values(o).reduce((a, b) => a + b, 0), E = G.EVENTS[key];
  return { title: E ? E.title : key, n, opts: Object.entries(o).map(([i, c]) => ({ label: E && E.opts[+i] ? E.opts[+i].label : 'Option ' + i, n: c, share: pct(c, n) })).sort((a, b) => b.n - a.n) };
}).sort((a, b) => b.n - a.n);
const dcount = {}; runs.forEach(r => (r.picks || []).filter(p => p[0] === 'd').forEach(p => dcount[p.slice(2)] = (dcount[p.slice(2)] || 0) + 1));
const dn = Object.values(dcount).reduce((a, b) => a + b, 0);
const districts = Object.entries(dcount).map(([k, n]) => ({ label: nameOf(G.DISTRICTS, k), n, share: pct(n, dn) })).sort((a, b) => b.n - a.n);

// Who ended runs
const fcount = {}; runs.filter(r => !spared(r) && r.foe).forEach(r => { const f = r.foe.replace(/^\[(\w+)\]$/, (m, k) => k === 'erased' ? 'An erased champion' : k === 'champion' ? "Another entrant's champion" : 'A Legend'); fcount[f] = (fcount[f] || 0) + 1; });
const enders = Object.entries(fcount).map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n).slice(0, 8);

const dayMap = {}; runs.forEach(r => { const d = dayMap[r.day] = dayMap[r.day] || { day: r.day, runs: 0, spared: 0 }; d.runs++; if (spared(r)) d.spared++; });
const fights = runs.flatMap(r => r.fights || []);
const out = {
  generated: new Date().toISOString(), source, versions: only,
  range: total ? { from: runs[0].day, to: runs[total - 1].day } : null,
  totals: {
    runs: total, entrants: new Set(runs.map(r => String(r.id || '').split('_')[0]).filter(Boolean)).size || null,
    spared: runs.filter(spared).length, erased: runs.filter(r => r.outcome === 'erased').length, abandoned: runs.filter(r => r.outcome === 'abandoned').length,
    pct: baseline, avgRound: avg(runs.map(r => r.round)), medMins: median(runs.map(r => r.mins).filter(m => m != null && m > 0)), avgTurns: avg(runs.map(r => r.turns)),
    hardPct: pct(fights.filter(f => f.h).length, fights.length), daily: runs.filter(r => r.mode === 'daily' || r.mode === 'replay').length,
  },
  // Every release in the export, whatever --ver picked, so the dashboard can compare them
  releases: Object.values(allRuns.reduce((g, r) => { const x = g[r.ver] = g[r.ver] || { key: r.ver, runs: 0, spared: 0, rounds: [], guessed: 0 };
    x.runs++; if (spared(r)) x.spared++; x.rounds.push(r.round); if (r.verGuessed) x.guessed++; return g; }, {}))
    .map(x => ({ key: x.key, label: x.key.replace(/^wpd-/, '') + (x.guessed === x.runs ? ' (by date)' : x.guessed ? ' (part by date)' : ''), runs: x.runs, spared: x.spared, pct: pct(x.spared, x.runs), avgRound: avg(x.rounds), guessed: x.guessed }))
    .sort((a, b) => verNum(a.key) - verNum(b.key)),
  classes: group(r => r.path || 'none', archLabel),
  worlds: group(r => r.world, k => nameOf(G.WORLD_TYPES, k)),
  wranks: group(r => r.wrank, k => k + '-rank world').sort((a, b) => G.WORLD_RANKS.indexOf(a.key) - G.WORLD_RANKS.indexOf(b.key)),
  patrons: group(r => r.patron || 'none', k => k === 'none' ? 'No patron' : nameOf(G.GODS, k)),
  rounds, enders, moves: moves.slice(0, 16), minRuns: MIN, events, districts,
  days: Object.values(dayMap).sort((a, b) => a.day < b.day ? -1 : 1),
  recent: runs.slice(-12).reverse().map(r => ({ day: r.day, ver: r.ver, world: nameOf(G.WORLD_TYPES, r.world), wrank: r.wrank, path: archLabel(r.path || 'none'), outcome: r.outcome, round: r.round, hearts: r.hearts, maxHearts: r.maxHearts, mins: r.mins })),
};
// --split DIR: the same numbers as flat row tables, one JSON file each, for the dashboard's datasets
if (args[0] === '--split') {
  const dir = args[1]; fs.mkdirSync(dir, { recursive: true });
  const T = out.totals, rows = {
    summary: [Object.assign({ source, generated: out.generated, from: out.range && out.range.from, to: out.range && out.range.to, minRuns: MIN, versions: only ? only.join(',') : 'all' }, T)],
    breakdown: ['releases', 'classes', 'worlds', 'wranks', 'patrons'].flatMap(g => out[g].map(x => ({ group: g, key: x.key, label: x.label, runs: x.runs, spared: x.spared, pct: x.pct, avgRound: x.avgRound }))),
    rounds: out.rounds,
    choices: [].concat(
      out.moves.map(x => ({ section: 'moved', key: x.key, kind: x.kind, label: x.label, n: x.runs, pct: x.pct, delta: x.delta })),
      out.events.flatMap(e => e.opts.map(o => ({ section: 'event', key: e.title + ' / ' + o.label, kind: e.title, label: o.label, n: o.n, share: o.share }))),
      out.districts.map(x => ({ section: 'district', key: x.label, label: x.label, n: x.n, share: x.share })),
      out.enders.map(x => ({ section: 'ender', key: x.label, label: x.label, n: x.n }))),
    days: out.days,
    recent: out.recent.map((r, i) => Object.assign({ i }, r)),
  };
  Object.entries(rows).forEach(([k, v]) => fs.writeFileSync(`${dir}/${k}.json`, JSON.stringify(v)));
} else {
  const json = JSON.stringify(out, null, 1);
  if (args[0]) fs.writeFileSync(args[0], json); else console.log(json);
}
