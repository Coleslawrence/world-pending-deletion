// Layout check: plays bot runs, restores saved states in a real browser at phone sizes and reports anything
// that spills off the screen sideways, is cut off at the bottom, or overlaps the piece after it.
//   node tools/layout-check.js                 # all sizes, all screens; exits 1 if anything fails
//   node tools/layout-check.js --shots out/    # also save a screenshot per size and screen
//   node tools/layout-check.js --size 320x693,1280x800  # some sizes only
//   node tools/layout-check.js --seed 3                 # another bot run (default 1)
// Needs Playwright with Chromium (npx playwright install chromium). Serves the repo itself on a free port.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const G = require('../js/core.js');
const { playRun } = require('./bot.js');

// Width x height in CSS px with the top/bottom safe-area insets of a home screen app.
// 320 wide is an iPhone 12/13 mini (and SE) with Display Zoom set to Larger Text.
const SIZES = [
  { name: '320x693', w: 320, h: 693, top: 47, bottom: 34 },
  { name: '360x640', w: 360, h: 640, top: 24, bottom: 0 },
  { name: '375x667', w: 375, h: 667, top: 20, bottom: 0 },
  { name: '375x812', w: 375, h: 812, top: 50, bottom: 34 },
  { name: '430x932', w: 430, h: 932, top: 59, bottom: 34 },
  { name: '844x390', w: 844, h: 390, top: 0, bottom: 21 }, // phone on its side
  { name: '820x1180', w: 820, h: 1180, top: 24, bottom: 20 }, // tablet
  { name: '1280x800', w: 1280, h: 800, top: 0, bottom: 0, desktop: true }, // Steam Deck, small laptop
  { name: '1920x1080', w: 1920, h: 1080, top: 0, bottom: 0, desktop: true },
];
const args = process.argv.slice(2), arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const shotDir = arg('--shots'), only = arg('--size') && arg('--size').split(',');

// States: one bot run that reaches the Elite bracket, snapshotted at every stage, with long names swapped in
function states() {
  // Seeded, so the same states come up on every check
  let seed = +(arg('--seed') || 1); Math.random = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const meta = G.newMeta();
  for (let seed = 0; seed < 60; seed++) {
    const snaps = [];
    const r = playRun(meta, false, { snap: (stage, run) => snaps.push({ stage, run: JSON.parse(JSON.stringify(run)) }) });
    if (r.result !== 'elite-clear' && r.result !== 'spared') continue;
    const pick = [], seen = {};
    snaps.forEach(s => { const k = s.stage + (s.run.elite ? 'E' : s.run.round); if (!seen[k]) { seen[k] = 1; pick.push(s); } });
    const out = [];
    pick.forEach(s => {
      const label = (s.run.elite ? 'elite' + (s.run.eliteIdx + 1) : 'r' + s.run.round) + '-' + s.stage;
      if (s.stage === 'choose' && s.run.stage !== 'choose') return;
      out.push({ label, stage: s.stage, run: s.run });
      if (s.stage === 'shop') out.push({ label: label.replace('shop', 'fight'), stage: 'fight', run: s.run });
    });
    // Worst case names: long champion and world names
    out.forEach(s => { s.run.name = 'Oringe waan the Unbowed'; s.run.world.name = 'Morgravel-under-Ash'; s.run.champ = s.run.name + ' of ' + s.run.world.name; });
    const mid = out.find(s => s.label === 'r5-shop') || out[0];
    out.unshift({ label: 'title', stage: 'title', run: mid.run }, { label: 'worlds', stage: 'worlds', run: mid.run });
    ['stats', 'archetypes', 'menu'].forEach(sh => out.push({ label: 'sheet-' + sh, stage: 'shop', sheet: sh, run: mid.run }));
    meta.tutorialDone = true;
    return { meta, list: out };
  }
  throw new Error('no bot run reached the end');
}

function serve() {
  const root = path.join(__dirname, '..'), types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
  const srv = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!p.startsWith(root) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  });
  return new Promise(r => srv.listen(0, () => r(srv)));
}

// Runs in the page: what is wrong with the current screen
function inspect() {
  const W = innerWidth, H = innerHeight, bad = [];
  const name = el => el.className && typeof el.className === 'string' ? el.tagName.toLowerCase() + '.' + el.className.trim().split(/\s+/).join('.') : el.tagName.toLowerCase();
  const text = el => (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  if (document.documentElement.scrollWidth > W + 1) bad.push(`page is ${document.documentElement.scrollWidth}px wide in a ${W}px screen (iOS zooms out)`);
  const scrollers = el => { for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowY; if (o === 'auto' || o === 'scroll') return p; } return null; };
  document.querySelectorAll('#app *').forEach(el => {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.position === 'fixed') return;
    if (el.closest('.floats, .skyline, .coach')) return;
    if (r.right > W + 1 || r.left < -1) bad.push(`off the side: ${name(el)} "${text(el)}" (${Math.round(r.left)} to ${Math.round(r.right)})`);
    // Sticks out of the side of its box (on iOS this is what widens the page)
    const par = el.parentElement, pcs = par && getComputedStyle(par);
    if (par && pcs.display !== 'contents' && cs.position !== 'absolute' && !/hidden|clip|auto|scroll/.test(pcs.overflowX)) {
      const pr = par.getBoundingClientRect();
      if (pr.width && (r.right > pr.right + 1 || r.left < pr.left - 1)) bad.push(`sticks out of ${name(par)}: ${name(el)} "${text(el)}" by ${Math.round(Math.max(r.right - pr.right, pr.left - r.left))}px`);
    }
    const sc = scrollers(el);
    if (el.matches('.screen > footer, .screen > footer *') && r.bottom > H + 1) bad.push(`footer below the screen: ${name(el)} (bottom ${Math.round(r.bottom)} of ${H})`);
    if (!sc && !el.closest('.sheet-bg') && r.bottom > H + 1 && el.children.length === 0) bad.push(`below the screen: ${name(el)} "${text(el)}" (bottom ${Math.round(r.bottom)} of ${H})`);
    // Clipped text: a box that hides overflow and cuts its text without an ellipsis or a line clamp
    if (/hidden|clip/.test(cs.overflowX + cs.overflowY) && el.children.length === 0 && el.textContent.trim()) {
      const cutX = el.scrollWidth > el.clientWidth + 1 && cs.textOverflow !== 'ellipsis';
      const cutY = el.scrollHeight > el.clientHeight + 2 && cs.webkitLineClamp === 'none' && !/clip|ellipsis/.test(cs.textOverflow);
      if (cutX || cutY) bad.push(`text cut: ${name(el)} "${text(el)}"`);
    }
  });
  // Pieces of a screen that overlap the one after them
  const scr = document.querySelector('#app > .screen');
  if (scr) {
    const flat = els => els.flatMap(k => getComputedStyle(k).display === 'contents' ? flat([...k.children]) : [k]);
    const kids = flat([...scr.children]).filter(k => getComputedStyle(k).position !== 'absolute' && k.getBoundingClientRect().height > 0);
    for (let i = 0; i + 1 < kids.length; i++) {
      const a = kids[i], b = kids[i + 1];
      const lastA = [...a.querySelectorAll('*')].reduce((m, x) => Math.max(m, x.getBoundingClientRect().bottom), a.getBoundingClientRect().bottom);
      const ov = getComputedStyle(a).overflowY;
      if (getComputedStyle(b).position === 'sticky') continue; // a pinned footer covers content scrolling under it on purpose
      if (ov === 'visible' && b.getBoundingClientRect().top > a.getBoundingClientRect().top && lastA > b.getBoundingClientRect().top + 1) bad.push(`overlap: ${name(a)} runs ${Math.round(lastA - b.getBoundingClientRect().top)}px into ${name(b)}`);
    }
    if (scr.scrollHeight > scr.clientHeight + 1 && !/auto|scroll/.test(getComputedStyle(scr).overflowY)) bad.push(`screen content is ${scr.scrollHeight - scr.clientHeight}px taller than the screen and cannot scroll`);
    // Scrolling is the fallback; a fight that needs it hides skills, so report it
    if (scr.classList.contains('fight') && scr.scrollHeight > scr.clientHeight + 1) bad.push(`fight needs ${scr.scrollHeight - scr.clientHeight}px of scrolling`);
  }
  return [...new Set(bad)];
}

(async () => {
  const { meta, list } = states();
  const srv = await serve(), url = `http://localhost:${srv.address().port}/index.html`;
  const browser = await chromium.launch();
  let fails = 0;
  for (const S of SIZES.filter(s => !only || only.includes(s.name))) {
    const page = await browser.newPage({ viewport: { width: S.w, height: S.h }, deviceScaleFactor: S.desktop ? 1 : 2, isMobile: !S.desktop, hasTouch: !S.desktop });
    // Safe-area insets as a home screen app sees them (Chromium has no env() emulation)
    const insets = `#app { padding-top: ${S.top}px !important; padding-bottom: ${Math.max(0, S.bottom - 24)}px !important; } .sheet { padding-bottom: ${S.bottom}px !important; max-height: calc(100% - 24px - ${S.top}px) !important; } #toasts { display: none !important; }`;
    for (const st of list) {
      const run = JSON.parse(JSON.stringify(st.run)); if (st.stage === 'fight') run.stage = 'ready';
      await page.goto(url);
      await page.evaluate(([rk, mk, r, m]) => { localStorage.clear(); localStorage.setItem(rk, JSON.stringify(r)); localStorage.setItem(mk, JSON.stringify(m)); localStorage.setItem('wpd-news-seen', '99'); }, ['le-run-1', 'le-meta-1', run, meta]);
      await page.goto(url); await page.addStyleTag({ content: insets });
      await page.evaluate(([stage, sheet]) => {
        ui.sheet = null; run.pending = [];
        if (stage === 'fight') startFightUI();
        else if (stage === 'worlds') onAct({ dataset: { act: 'new' } });
        else { ui.screen = stage; ui.sheet = sheet || null; render(); }
      }, [st.stage, st.sheet]);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(st.stage === 'fight' ? 900 : st.sheet ? 450 : 150);
      const bad = await page.evaluate(inspect);
      if (bad.length) fails++;
      console.log(`${bad.length ? 'FAIL' : 'ok  '} ${S.name} ${st.label}${bad.length ? '\n     ' + bad.slice(0, 8).join('\n     ') + (bad.length > 8 ? `\n     ... ${bad.length - 8} more` : '') : ''}`);
      if (shotDir) { fs.mkdirSync(shotDir, { recursive: true }); await page.screenshot({ path: path.join(shotDir, `${S.name}-${st.label}.png`) }); }
    }
    await page.close();
  }
  await browser.close(); srv.close();
  console.log(fails ? `${fails} screens with layout problems` : 'All screens fit');
  process.exit(fails ? 1 : 0);
})();
