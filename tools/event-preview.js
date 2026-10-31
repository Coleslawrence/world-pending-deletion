// Event previews: screenshots of real events from js/content/events/ in the game at phone size (360×640), so new or
// reworked events can be checked on screen before they merge. For each event: the event with a mid-game build (what
// most players see), the event with every line showing (high stats, Luck and Favour), then the System's lines after each option.
//   node tools/event-preview.js OUT_DIR [event_id ...]     # every event when no ids are given
// Needs Playwright with Chromium. Serves the repo itself on a free port, like tools/card-preview.js.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const G = require('../js/core.js');
const { playRun } = require('./bot.js');
const ROOT = path.join(__dirname, '..');
const [out, ...ids] = process.argv.slice(2);
if (!out) { console.log('usage: node tools/event-preview.js OUT_DIR [event_id ...]'); process.exit(2); }
const SIZE = { w: 360, h: 640 };
const keys = ids.length ? ids : Object.keys(G.EVENTS);
keys.forEach(k => { if (!G.EVENTS[k]) { console.log(`no event ${k}`); process.exit(2); } });
function shopState() {
  let seed = 1; Math.random = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const meta = G.newMeta();
  for (let i = 0; i < 60; i++) {
    let snap = null;
    playRun(meta, false, { snap: (stage, run) => { if (stage === 'shop' && run.round >= 4 && !snap) snap = JSON.parse(JSON.stringify(run)); } });
    if (snap) { meta.tutorialDone = true; return { meta, run: snap }; }
  }
  throw new Error('no bot run reached a round 4 shop');
}
function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  });
  return new Promise(r => srv.listen(0, () => r(srv)));
}
// In the page: open the event. step 0: as the bot's build has it; 1: every line showing; 2+: after option (step - 2), every line showing
function stage([key, step]) {
  clearToasts(); ui.sheet = null; run.pending = []; ui.screen = 'shop'; meta.statLines = true; run.gold = Math.max(run.gold, 30);
  run.chains = run.chains || {}; run.chains.poisoner = run.chains.poisoner && typeof run.chains.poisoner === 'object' ? run.chains.poisoner : { step: 'found', who: 'lyss', due: 1 };
  if (step > 0) { Object.keys(run.stats).forEach(k => run.stats[k] = Math.max(run.stats[k], 12)); Object.keys(GODS).forEach(g => run.favour[g] = 8); }
  pushEvent(run, key); if (step > 0) run.luck = { [key]: true };
  render();
  if (step < 2) return step ? 'every line showing' : 'mid-game build';
  const shown = eventOpts(run, key), i = shown[step - 2]; if (i == null) return null;
  onAct({ dataset: { act: 'event', i: String(i) } });
  return `after "${EVENTS[key].opts[i].label}"`;
}
(async () => {
  const { meta, run } = shopState();
  fs.mkdirSync(out, { recursive: true });
  const srv = await serve(), url = `http://localhost:${srv.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: SIZE.w, height: SIZE.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  for (const key of keys) {
    for (let i = 0; i < 2 + 5; i++) {
      await page.goto(url);
      await page.evaluate(([r, m]) => { localStorage.clear(); localStorage.setItem('le-run-1', JSON.stringify(r)); localStorage.setItem('le-meta-1', JSON.stringify(m)); localStorage.setItem('wpd-news-seen', '99'); }, [run, meta]);
      await page.goto(url);
      const caption = await page.evaluate(stage, [key, i]); if (caption == null) break;
      await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(900);
      const over = await page.evaluate(() => { const s = document.querySelector('.sheet'); return s ? s.scrollHeight > s.clientHeight + 1 : false; });
      const shot = path.join(out, `${key}-${i + 1}.png`); await page.screenshot({ path: shot });
      console.log(`${shot}  ${caption}${over ? '  (SCROLLS: over one screen)' : ''}`);
    }
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
