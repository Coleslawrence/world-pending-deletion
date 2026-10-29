// Card previews: shows a content card in the real game before anything is built. Reads the card's words, adds them to
// the game in a browser as if they were content, opens the screen the player would see them on, and saves phone-size
// screenshots next to the card. The card's "## Preview" section is rewritten to show them.
//   node tools/card-preview.js CARD.md [CARD.md ...]    # writes <cards folder>/previews/<card>-<n>.png
//   node tools/card-preview.js DIR                      # every Approved, Draft or Proposed card in DIR
// Works for events (the event, then the System's lines after the first option), gear (the shop and the piece's
// sheet), Titles (the toast when earned, and the Title in the Status sheet) and enemies (the scout report, the fight,
// and its second phase). Other kinds are listed and skipped. A card can carry a ```js block of draft data under
// Mechanics (what the data PR would add); it runs in the page first. Enemies need one: their moves don't fit in words.
// The numbers in a preview are stand-ins: a preview shows the words and the screen, the data PR sets the real values.
// Needs Playwright with Chromium. Serves the repo itself on a free port, like tools/layout-check.js.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const G = require('../js/core.js');
const { playRun } = require('./bot.js');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
if (!args.length) { console.log('usage: node tools/card-preview.js CARD.md [...] | DIR'); process.exit(2); }
const SIZE = { w: 360, h: 640 };

// ---------- Reading a card into stand-in content ----------
const ticks = s => [...String(s || '').matchAll(/`([^`]+)`/g)].map(m => m[1]);
function cardContent(file) {
  const md = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const head = md.match(/^# ([^:\n]+):\s*(.+)$/m) || [];
  const section = h => { const m = md.match(new RegExp(`^## ${h}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm')); return m ? m[1] : ''; };
  const field = re => { const m = md.match(re); return m ? m[1].trim() : ''; };
  const words = section('Words'), mech = section('Mechanics');
  const id = (field(/\*\*Ids\*\*[^:]*:(.*)/).match(/`([a-z][a-z0-9_]*)`/) || [])[1] || 'preview';
  const kind = (head[1] || '').trim().toLowerCase(), name = (head[2] || '').trim();
  const line = re => { const m = words.match(re); return m ? m[1].trim() : ''; };
  const ui = [...words.matchAll(/\*\*UI copy\*\*[^:]*:\s*(.+)/g)].flatMap(m => ticks(m[1]).length ? ticks(m[1]) : [m[1].trim()]);
  const system = [...words.matchAll(/\*\*System\*\*[^:]*:\s*(.+)/g)].flatMap(m => ticks(m[1]));
  const status = field(/\*\*Status:\*\*\s*([^·\n]+)/);
  const C = { kind, name, id, status, data: (mech.match(/```js\n([\s\S]*?)```/) || [])[1] || '' };
  if (kind === 'event') {
    const rows = words.split('\n').filter(l => /^\|/.test(l) && !/^\|\s*-/.test(l)).slice(1).map(l => l.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim())).filter(r => r.some(Boolean));
    const check = c => { const s = /\b(STR|AGI|INT|VIT|LUK)\b/.exec(c); if (s) return { stat: s[1], hard: /\b(10|hard)\b/i.test(c) || undefined }; if (/luck/i.test(c)) return { luck: true }; const g = /\b(war|trick\w*|ruin)\b/i.exec(c); return g ? { favour: g[1].toLowerCase().startsWith('trick') ? 'trick' : g[1].toLowerCase() } : null; };
    C.text = line(/\*\*World narration\*\*[^:]*:\s*(.+)/) || name;
    C.opts = rows.map(([label, desc, cond = '', result = '']) => {
      const o = { label, desc, says: ticks(result).filter(s => /^\[/.test(s)) };
      const pay = /pay\D*(\d+)\s*gold/i.exec(cond + ' ' + label); if (pay) o.pay = +pay[1];
      const c = !/^(none|-|)$/i.test(cond) && check(cond); if (c) o.check = c;
      return o;
    });
  } else if (kind === 'gear') {
    const where = field(/\*\*World, god or archetype:\*\*(.*)/), nums = field(/\*\*Rough numbers:\*\*(.*)/);
    C.slot = (/\b(weapon|armour|accessory)\b/.exec(nums + ' ' + mech) || [, 'accessory'])[1];
    C.rank = (/\brank ([EDCBAS])\b/.exec(nums) || [, 'C'])[1];
    C.tags = Object.entries(G.ARCH).filter(([k, a]) => new RegExp(`\\b${a.name}\\b`, 'i').test(where)).map(([k]) => k);
    C.stats = {}; (nums.match(/stats:\s*\{([^}]*)\}/) || [, ''])[1].replace(/(STR|AGI|INT|VIT|LUK):\s*(\d+)/g, (_, k, v) => C.stats[k] = +v);
    C.textLine = ui[0] || name;
  } else if (/^title$/.test(kind)) {
    C.cond = ui[0] || ''; C.desc = ui[1] || ui[0] || ''; C.earned = system[0] || `[Title acquired: ${name}.]`;
  }
  return C;
}

// ---------- A run to show it in: a bot run's shop, mid-world ----------
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

// ---------- In the page: add the card as content and open its screens ----------
// Each step returns a caption; the tool screenshots after it. Runs in the browser, where content names are globals.
function stage([C, step]) {
  clearToasts(); ui.sheet = null; run.pending = []; ui.screen = 'shop'; meta.statLines = true;
  if (C.data) (0, eval)(C.data); // the card's draft data, in the global scope like a content file
  Object.keys(run.stats).forEach(k => run.stats[k] = Math.max(run.stats[k], 12)); run.gold = Math.max(run.gold, 30);
  if (C.kind === 'event') {
    EVENTS[C.id] = { title: C.name, text: C.text, opts: C.opts.map(o => Object.assign({ label: o.label, desc: o.desc, go: (r, h) => o.says.forEach(s => h.say(s, /−|lose|lost/i.test(s) ? 'loss' : 'sys')) }, o.pay ? { pay: o.pay } : {}, o.check ? { check: o.check } : {})) };
    run.luck = { [C.id]: true }; Object.keys(GODS).forEach(g => run.favour[g] = 8);
    run.pending = [{ type: 'event', key: C.id }]; render();
    if (step === 0) return 'The event, with every option showing (high stats, luck and Favour)';
    onAct({ dataset: { act: 'event', i: String(step - 1) } });
    return `After "${C.opts[step - 1].label}"${C.opts[step - 1].says.length > 1 ? ' (every line it can show, in one go)' : ''}`;
  }
  if (C.kind === 'gear') {
    GEAR[C.id] = { name: C.name, slot: C.slot, tags: C.tags.length ? C.tags : [run.main || Object.keys(ARCH)[0]], rank: C.rank, stats: C.stats, pas: {}, text: () => C.textLine };
    ensureShop(run); run.shop.gear[0] = { id: C.id, mods: [] }; ui.shopTab = 'gear'; render();
    if (step === 0) return 'In the shop (first gear slot)';
    onAct({ dataset: { act: 'shop-item', k: 'gear', i: '0' } }); return 'Tapped in the shop';
  }
  if (C.kind === 'title') {
    TITLES[C.id] = { name: C.name, cond: C.cond, desc: C.desc }; meta.titles = { [C.id]: true }; run.title = C.id; render();
    if (step === 0) { toast(C.earned, 'class'); return 'When it is earned'; }
    ui.sheet = 'stats'; render();
    return 'Equipped, in the Status sheet';
  }
  if (/^enemy/.test(C.kind) && ENEMIES[C.id]) {
    const E = ENEMIES[C.id]; run.chosen = { kind: E.final ? 'final' : E.rival ? 'rival' : 'monster', id: C.id };
    if (step === 0) { ui.sheet = { type: 'scout' }; render(); return 'The scout report'; }
    startFightUI(); if (step === 1) return 'The fight starts';
    const f = ui.fight; f.B.hp = Math.floor(f.B.maxHp * E.phase.at); checkPhase(f, f.B, false); planIntent(f, f.B); render();
    return 'Below half HP: the second phase';
  }
  return null;
}
const steps = C => C.kind === 'event' ? 1 + Math.min(C.opts.length, 3) : ['gear', 'title'].includes(C.kind) ? 2 : /^enemy/.test(C.kind) && C.data ? (/phase\s*:/.test(C.data) ? 3 : 2) : 0;

(async () => {
  const files = args.flatMap(a => fs.statSync(a).isDirectory() ? fs.readdirSync(a).filter(f => f.endsWith('.md') && !/^(README|TEMPLATE|INDEX|IMPORT)\.md$/.test(f)).map(f => path.join(a, f)) : [a]);
  const cards = files.map(f => Object.assign(cardContent(f), { file: f })).filter(C => args.some(a => a.endsWith('.md')) || /^(Draft|Proposed|Approved)/.test(C.status));
  const { meta, run } = shopState();
  const srv = await serve(), url = `http://localhost:${srv.address().port}/index.html`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: SIZE.w, height: SIZE.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  for (const C of cards) {
    const n = steps(C); if (!n) { console.log(`skip  ${path.basename(C.file)}: no preview for ${C.kind || 'this kind'} yet (events, gear, Titles, and enemies with draft data)`); continue; }
    const dir = path.join(path.dirname(C.file), 'previews'), base = path.basename(C.file, '.md'); fs.mkdirSync(dir, { recursive: true });
    fs.readdirSync(dir).filter(f => f.startsWith(base + '-')).forEach(f => fs.unlinkSync(path.join(dir, f)));
    const shots = [];
    for (let i = 0; i < n; i++) {
      await page.goto(url);
      await page.evaluate(([r, m]) => { localStorage.clear(); localStorage.setItem('le-run-1', JSON.stringify(r)); localStorage.setItem('le-meta-1', JSON.stringify(m)); localStorage.setItem('wpd-news-seen', '99'); }, [run, meta]);
      await page.goto(url);
      const caption = await page.evaluate(stage, [C, i]);
      await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200);
      // A sheet opens scrolled to the top: bring the card's part into view once it has settled
      if (C.kind === 'title' && i === 1) { await page.evaluate(() => { const t = [...document.querySelectorAll('.sheet h4')].find(h => h.textContent === 'Title'); if (t) t.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300); }
      const shot = `${base}-${i + 1}.png`; await page.screenshot({ path: path.join(dir, shot) });
      shots.push({ shot, caption });
    }
    // The card's Preview section, rewritten each time
    const md = fs.readFileSync(C.file, 'utf8');
    const block = `## Preview\n\nIn the game at 360×640, made by \`node tools/card-preview.js\` from this card's words. Numbers are stand-ins until the data PR.\n\n${shots.map(s => `**${s.caption}**\n\n![${s.caption}](previews/${s.shot})`).join('\n\n')}\n\n`;
    const out = /^## Preview\b/m.test(md) ? md.replace(/^## Preview\b[\s\S]*?(?=^## )/m, block) : md.replace(/^## Mechanics/m, block + '## Mechanics');
    fs.writeFileSync(C.file, out);
    console.log(`ok    ${path.basename(C.file)}: ${shots.length} previews in ${dir}`);
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
