// Balance gate: plays the same seeded bot runs on two copies of the game (usually the base branch and a pull request)
// and compares them. CI runs it on every pull request.
//   node tools/balance-gate.js BASE_DIR HEAD_DIR [--runs N] [--report-only]
// Fails when the overall spared rate moves more than 3 points, or any archetype's spared rate as the bot's main moves
// more than 6. When moving the numbers is the point of a pull request, label it "balance-change": the gate then reports
// without failing. Each side runs its own tools/stats.js in its own process, so the two games never share a process.
'use strict';
const { execFile } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const pos = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && !(all[i - 1] === '--runs'));
const [BASE, HEAD] = pos.map(p => path.resolve(p));
if (!BASE || !HEAD) { console.error('usage: node tools/balance-gate.js BASE_DIR HEAD_DIR [--runs N] [--report-only]'); process.exit(2); }
const i = process.argv.indexOf('--runs'), N = i > 0 ? +process.argv[i + 1] : 1000, REPORT_ONLY = process.argv.includes('--report-only');
const OVERALL_MAX = 3, MAIN_MAX = 6, SPREAD = 10;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wpd-gate-'));
const ARCHS = Object.keys(require(path.join(HEAD, 'js/core.js')).ARCH);

// One stats.js run; resolves to its spared % (the JSON's spared.pct)
function sim(dir, tag, args) {
  const out = path.join(tmp, tag + '.json');
  return new Promise((ok, fail) => execFile(process.execPath, [path.join(dir, 'tools/stats.js'), String(N), '--seed', '1', '--json', out].concat(args), { cwd: dir, maxBuffer: 1 << 24 },
    e => e ? fail(new Error(`${tag}: ${e.message}`)) : ok(JSON.parse(fs.readFileSync(out, 'utf8')).spared.pct)));
}
// Run the jobs a few at a time, one per CPU
async function pool(jobs, n) { const res = new Array(jobs.length); let next = 0; await Promise.all(Array.from({ length: n }, async () => { while (next < jobs.length) { const k = next++; res[k] = await jobs[k](); } })); return res; }

(async () => {
  const jobs = [], keys = [];
  for (const [side, dir] of [['base', BASE], ['head', HEAD]]) {
    keys.push([side, 'overall']); jobs.push(() => sim(dir, side + '-overall', ['--batches', '3']));
    ARCHS.forEach(a => { keys.push([side, a]); jobs.push(() => sim(dir, side + '-' + a, ['--main', a])); });
  }
  const res = await pool(jobs, Math.max(1, os.cpus().length)), R = { base: {}, head: {} };
  keys.forEach(([side, k], j) => R[side][k] = res[j]);
  const fails = [], f1 = v => v.toFixed(1), sign = d => (d > 0 ? '+' : d < 0 ? '−' : '±') + f1(Math.abs(d));
  const rows = [['overall', OVERALL_MAX]].concat(ARCHS.map(a => [a, MAIN_MAX])).map(([k, max]) => {
    const b = R.base[k], h = R.head[k], d = h - b;
    if (Math.abs(d) > max) fails.push(`${k} moved ${sign(d)} points (limit ${max})`);
    return `| ${k === 'overall' ? `Overall (${N * 3} runs)` : `${k} as main (${N} runs)`} | ${f1(b)}% | ${f1(h)}% | ${sign(d)}${Math.abs(d) > max ? ' ⚠' : ''} | ±${max} |`;
  });
  const mains = ARCHS.map(a => R.head[a]), median = v => { const s = v.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const outliers = ARCHS.filter(a => Math.abs(R.head[a] - median(mains.filter((_, j) => ARCHS[j] !== a))) > SPREAD);
  const md = [
    '## Balance gate', '', 'Share of bot runs that spare their world, base branch against this branch, on the same seeds.', '',
    '| Runs | Base | This branch | Change | Limit |', '| --- | --- | --- | --- | --- |', ...rows, '',
    outliers.length ? `For information: ${outliers.join(', ')} ${outliers.length === 1 ? 'is' : 'are'} more than ${SPREAD} points from the median of the other archetypes as main.` : `Every archetype as main is within ${SPREAD} points of the median of the others.`, '',
    fails.length ? (REPORT_ONLY ? `**Moved past the limits, reported only** (labelled balance-change): ${fails.join('; ')}.` : `**Failed:** ${fails.join('; ')}. If the change is meant to move the numbers, label the pull request balance-change.`) : '**Passed.**',
  ].join('\n');
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
  fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(fails.length && !REPORT_ONLY ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
