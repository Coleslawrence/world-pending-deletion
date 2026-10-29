// Bug report table for the stats dashboard: turns exported reports (Firestore feedback/, see feedbackDoc in js/core.js)
// into two row tables, one JSON file each, for the dashboard's Reports section.
//   node tools/feedback-report.js feedback.json DIR   feedback.json: an array of report documents, or an object keyed by document id
//   node tools/feedback-report.js --sample DIR        made-up reports, to try the dashboard before real ones exist
// Writes DIR/reports.json (the latest 30, newest first) and DIR/report-types.json (counts by type).
const fs = require('fs');
const G = require('../js/core.js');

const args = process.argv.slice(2);
let list, source = 'playtest';
if (args[0] === '--sample') {
  source = 'sample'; args.shift();
  const B = require('./bot.js'), m = G.newMeta(), run = B.playRun(m, false, { noElite: true }).run, t0 = Date.parse('2026-10-22T03:00:00Z');
  const env = (screen, w, h, app) => ({ build: '2026-10-28/s5', screen, w, h, app, ua: 'sample' });
  list = [
    ['bug', 'Sample: the shop froze after I sold my last skill.', env('shop/shop', 320, 693, true), run],
    ['balance', 'Sample: the round 7 Hard opponent feels impossible with Venom.', env('choose/choose', 375, 812, true), run],
    ['idea', 'Sample: let me see the opponent list before the shop.', env('title', 1280, 800, false), null],
    ['bug', 'Sample: a message covered the Fight button for a second.', env('fight/ready', 360, 640, false), run],
    ['other', 'Sample: love the System voice.', env('end', 430, 932, true), null],
    ['idea', 'Sample: a sound when a world is erased.', env('end', 390, 844, true), null],
  ].map(([type, text, e, r], i) => Object.assign(G.feedbackDoc(type, text, e, r, t0 + i * 9e7), { id: 'sample' + (i % 3) + '_' + (t0 + i * 9e7) }));
} else {
  const raw = JSON.parse(fs.readFileSync(args.shift(), 'utf8'));
  list = Array.isArray(raw) ? raw : Object.entries(raw).map(([id, d]) => Object.assign({ id }, d));
}
const dir = args[0];
if (!dir) { console.error('Give an output folder.'); process.exit(1); }
list = list.filter(r => r && r.type && r.text).sort((a, b) => b.at - a.at);

const LABEL = { bug: 'Bug', idea: 'Idea', balance: 'Balance', other: 'Other' };
const pathName = k => G.ARCH[k] ? G.ARCH[k].path : k;
const worldName = k => (G.WORLD_TYPES && G.WORLD_TYPES[k] && G.WORLD_TYPES[k].name) || k;
const reports = list.slice(0, 30).map((r, i) => {
  const R = r.run;
  return {
    i, day: G.dailyDate(r.at), type: LABEL[r.type] || r.type, text: String(r.text).slice(0, 1000),
    build: r.build || '', screen: r.screen || '', device: r.w ? `${r.w}×${r.h} ${r.app ? 'app' : 'browser'}` : '',
    run: R ? `${worldName(R.world)}, round ${R.round}, ${R.wins} wins, ${R.hearts} Hearts${R.path ? ', ' + pathName(R.path) : ''}` : '',
    log: R && R.log ? R.log.slice(-5).join(' / ') : '', source,
  };
});
const types = G.FEEDBACK_TYPES.map(k => ({ type: LABEL[k], n: list.filter(r => r.type === k).length, source }));
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/reports.json`, JSON.stringify(reports));
fs.writeFileSync(`${dir}/report-types.json`, JSON.stringify(types));
console.log(`${list.length} reports: ${types.map(t => t.n + ' ' + t.type).join(', ')}`);
