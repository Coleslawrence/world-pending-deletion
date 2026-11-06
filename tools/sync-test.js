// Cloud save sync test: plays two devices against one fake account in a real browser and checks that a new or
// cleared device can never overwrite the account's progress, and that two real saves make the player pick.
//   node tools/sync-test.js      # exits 1 if anything fails
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const NOTES_ID = (fs.readFileSync(path.join(ROOT, 'js/notes.js'), 'utf8').match(/id: '([^']+)'/) || [])[1];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
// Stands in for js/cloud-firebase.js: one signed-in account whose documents live in the test (window.__store)
const FAKE = `(function () {
  const doc = path => ({ id: path.split('/').pop(), path,
    get: async () => { const d = await window.__get(path); return { id: path.split('/').pop(), exists: d != null, data: () => d }; },
    set: async d => { await window.__set(path, JSON.parse(JSON.stringify(d))); } });
  const empty = { docs: [], size: 0, empty: true };
  const me = { uid: 'acct1' };
  window.WPD_CLOUD = { provider: 'firebase', ready: true, error: null, get me() { return me; },
    db: { doc, collection: () => ({ get: async () => empty, query: async () => empty, count: async () => 0 }) },
    user: { id: async () => me.uid, profiles: async () => ({}) }, signIn: async () => {}, signOut: async () => {} };
  setTimeout(() => window.dispatchEvent(new CustomEvent('wpd-auth', { detail: { signedIn: true } })), 300);
})();`;
let fails = 0;
const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails++; };
const richMeta = (at) => ({ v: 5, echoes: 240, unlocks: { arch_storm: true }, archive: {}, titles: {}, firsts: {}, found: {}, presets: [], erased: [], champions: [], runs: 31, wins: 12, rank: null, savedAt: at, notesSeen: NOTES_ID, tutorialDone: true });

(async () => {
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u);
    if (u === '/sw.js') { res.writeHead(404); return res.end(); }
    if (u === '/js/cloud-firebase.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(FAKE); }
    fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b); });
  }).listen(0);
  const url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();
  let store = {};
  const device = async (local) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } });
    await ctx.addInitScript(l => { if (l && !sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', 1); Object.entries(l).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); } }, local || null);
    await ctx.exposeBinding('__get', (_, p) => store[p] == null ? null : JSON.parse(JSON.stringify(store[p])));
    await ctx.exposeBinding('__set', (_, p, d) => { store[p] = d; });
    const page = await ctx.newPage();
    await page.goto(url); await page.waitForTimeout(8000); // pushes wait 5 s after a change
    return { page, ctx, meta: () => page.evaluate(() => JSON.parse(localStorage.getItem('le-meta-1'))), sheet: () => page.evaluate(() => ui.sheet && ui.sheet.type) };
  };
  const P = 'data/users/acct1/progress';

  // 1. The reported bug: the account has a real save, a new device signs in. The account's save must survive.
  store = { [P]: { meta: richMeta(1000), run: null, savedAt: 1000 } };
  let d = await device();
  check(store[P].meta.runs === 31, 'new device leaves the account save alone');
  check((await d.meta()).runs === 31, 'new device loads the account save');
  await d.ctx.close();

  // 2. A device that played a little before signing in: the player picks, and nothing is pushed meanwhile
  store = { [P]: { meta: richMeta(1000), run: null, savedAt: 1000 } };
  d = await device({ 'le-meta-1': Object.assign(richMeta(Date.now()), { runs: 1, echoes: 4, unlocks: {}, wins: 0 }) });
  check(await d.sheet() === 'savepick', 'two real saves: the pick sheet shows');
  check(store[P].meta.runs === 31, 'two real saves: nothing pushed before the pick');
  await d.page.click('[data-act="save-pick"][data-k="cloud"]'); await d.page.waitForTimeout(6000);
  check((await d.meta()).runs === 31 && store[P].meta.runs === 31, 'picking the account save loads it');
  const backups = await d.page.evaluate(() => JSON.parse(localStorage.getItem('wpd-save-backups')));
  check(backups && backups[0].meta.runs === 1, 'the device save it replaced is kept as a backup');
  await d.ctx.close();

  // 3. Keep this device's: it goes to the account
  store = { [P]: { meta: richMeta(1000), run: null, savedAt: 1000 } };
  d = await device({ 'le-meta-1': Object.assign(richMeta(500), { runs: 50 }) });
  await d.page.click('[data-act="save-pick"][data-k="local"]'); await d.page.waitForTimeout(6000);
  check(store[P].meta.runs === 50, 'picking this device pushes it to the account');
  await d.ctx.close();

  // 4. The old phone case: the account holds a newer but empty save, the phone a real one. The phone wins.
  store = { [P]: { meta: Object.assign(richMeta(Date.now()), { runs: 0, echoes: 0, unlocks: {}, wins: 0 }), run: null, savedAt: Date.now() } };
  d = await device({ 'le-meta-1': richMeta(1000) });
  check((await d.meta()).runs === 31 && store[P].meta.runs === 31, 'empty account save never replaces a real one on the device');
  await d.ctx.close();

  // 5. A device already in sync (same save, from before this fix): no pick sheet, even if it saved since
  store = { [P]: { meta: richMeta(1000), run: null, savedAt: 1000 } };
  d = await device({ 'le-meta-1': richMeta(1000) });
  check(!(await d.sheet()), 'same save on both: no pick sheet');
  await d.ctx.close();
  store = { [P]: { meta: richMeta(1000), run: null, savedAt: 1000 } };
  d = await device({ 'le-meta-1': Object.assign(richMeta(2000), { notesSeen: 'older' }) });
  check(await d.sheet() !== 'savepick', 'same progress, a newer timestamp (patch notes seen): no pick sheet');
  await d.ctx.close();

  // 6. A synced device: newer saves still flow both ways
  store = { [P]: { meta: Object.assign(richMeta(5000), { runs: 40 }), run: null, savedAt: 5000 } };
  d = await device({ 'le-meta-1': richMeta(1000), 'wpd-sync': { uid: 'acct1', at: 1 } });
  check((await d.meta()).runs === 40, 'synced device takes a newer account save');
  await d.ctx.close();

  await browser.close(); server.close();
  console.log(fails ? `${fails} failed` : 'all passed');
  process.exit(fails ? 1 : 0);
})();
