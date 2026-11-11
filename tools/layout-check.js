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
    // A Gambler bar: dice on the skill buttons and the Reroll button beside Attack
    const dice = JSON.parse(JSON.stringify(mid.run)), ids = ['coin_toss', 'hedge', 'double_down', 'snake_eyes', 'jackpot', 'loaded_die'];
    dice.bar = dice.bar.map((p, i) => ({ id: ids[i], star: 2, mods: [], u: 'dice' + i }));
    out.push({ label: 'r5-fight-dice', stage: 'fight', run: dice });
    // A Jinx bar: Misfortune and Curse chips and the Jinx button beside the shown move
    const jx = JSON.parse(JSON.stringify(mid.run)), jids = ['evil_eye', 'ill_omen', 'knock_wood', 'thirteenth', 'calamity', 'pass_curse'];
    jx.bar = jx.bar.map((p, i) => ({ id: jids[i], star: 2, mods: [], u: 'jinx' + i })); jx.gear.accessory = { id: 'black_cat_collar', star: 3, mods: [], u: 'jinxg' };
    out.push({ label: 'r5-fight-jinx', stage: 'fight', run: jx });
    // Move preview: a skill tapped once, with the HP arrows, striped bars and its tag line
    out.push({ label: 'r5-fight-preview', stage: 'fight', run: dice, preview: true });
    // Choose screen with the longest traits on every opponent, glitch ones included (Corrupted widened a card at 320)
    const ch = out.find(s => s.label === 'r5-choose');
    if (ch) { const t = JSON.parse(JSON.stringify(ch.run)); t.choices.forEach(c => c.traits = ['corrupted', 'desynced']); out.push({ label: 'r5-choose-traits', stage: 'choose', run: t }); }
    // Opening draft: 6 skills, then the 2-gear Standard issue pick, longest names
    const dr = JSON.parse(JSON.stringify(mid.run)); dr.stage = 'draft';
    dr.draft = ['snake_eyes', 'double_down', 'thirteenth', 'pass_curse', 'evil_eye', 'loaded_die'];
    dr.gearDraft = G.rollGearDraft(dr, Math.random); if (dr.gearDraft.length < 2) dr.gearDraft = Object.keys(G.GEAR).slice(0, 2);
    out.push({ label: 'draft', stage: 'draft', run: dr });
    const dg = JSON.parse(JSON.stringify(dr)); dg.draftPicked = dr.draft.slice(0, 3);
    out.push({ label: 'draft-gear', stage: 'draft', run: dg });
    // Opening stats after the draft, with a Gift note and points left to place
    const ks = JSON.parse(JSON.stringify(mid.run)); Object.assign(ks, { stage: 'choose', startPts: 2, statFloor: Object.assign({}, ks.stats), rollSeed: 'x', rolled: false, rollUsed: false }); ks.gifts = ks.gifts.concat('bornlucky');
    out.push({ label: 'kit-stats', stage: 'kitstats', run: ks });
    // Path evolution card: the two advanced classes for an archetype at 6 pieces
    out.push({ label: 'path-evolution', stage: 'shop', run: mid.run, pending: [{ type: 'adv', arch: 'reaper' }] });
    out.push({ label: 'level-up', stage: 'choose', run: mid.run, pending: [{ type: 'levelup', perk: 'field_medic' }] });
    // Spoils after a win: three gear cards, and the supplies list
    out.push({ label: 'spoils-gear', stage: 'choose', run: mid.run, pending: [{ type: 'spoils', kind: 'gear', offers: G.spoilsOffers(mid.run, 'gear', Math.random) }] });
    out.push({ label: 'spoils-supplies', stage: 'choose', run: mid.run, pending: [{ type: 'spoils', kind: 'supplies', offers: [{ k: 'gold', n: 6 }, { k: 'heart', n: 1 }, { k: 'heal', n: 0.4 }] }] });
    // Run shape: the Intake Interview, a rules review, a cursed door, and a shop with a Licence, rules in force and 5 districts
    out.push({ label: 'intake', stage: 'choose', run: mid.run, pending: [{ type: 'intake', offers: ['briefing', 'signing', 'second_gift', 'advance'] }] });
    out.push({ label: 'augment', stage: 'choose', run: mid.run, pending: [{ type: 'augment', offers: ['clemency', 'purse', 'extended'] }] });
    out.push({ label: 'door', stage: 'choose', run: mid.run, pending: [{ type: 'door', curse: 'markup', pay: { experimental: 1 } }] });
    { const rs = JSON.parse(JSON.stringify(mid.run)); Object.assign(rs, { voucher: 'interest', vouchers: ['district', 'spoils'], augments: ['clemency', 'levy'], curse: { id: 'garnished', left: 2, pay: { piece: 'A' } }, tokenOn: 'discount', tokenOffer: 'district', shopSpent: false });
      rs.stage = 'shop'; rs.gold = 30; const rc = JSON.parse(JSON.stringify(rs)); rc.stage = 'choose';
      out.push({ label: 'shop-desk', stage: 'shop', run: rs }, { label: 'sheet-desk', stage: 'shop', sheet: 'desk', run: rs }, { label: 'choose-rules', stage: 'choose', run: rc });
      const rd = JSON.parse(JSON.stringify(rs)); rd.districts = ['infirmary', 'sanctum', 'undercity', 'scout', 'enchanter']; rd.stage = 'district'; out.push({ label: 'district-5', stage: 'district', run: rd }); }
    // Tournament bracket: mid-run, at the start, and in the Elite bracket
    out.push({ label: 'sheet-bracket', stage: 'choose', sheet: 'bracket', run: mid.run });
    { const r1 = out.find(s => s.label === 'r1-choose'), el = out.find(s => s.label.startsWith('elite')); if (r1) out.push({ label: 'sheet-bracket-r1', stage: 'choose', sheet: 'bracket', run: r1.run }); if (el) out.push({ label: 'sheet-bracket-elite', stage: 'choose', sheet: 'bracket', run: el.run }); }
    // Difficulty ladder: the world screen with Priority and a Challenge chosen, both sheets, and the Archive's Marks
    out.push({ label: 'worlds-ladder', stage: 'worlds', sheet: 'none', run: mid.run }, { label: 'sheet-priority', stage: 'worlds', sheet: 'priority', run: mid.run }, { label: 'sheet-challenge', stage: 'worlds', sheet: 'challenge', run: mid.run }, { label: 'sheet-archive', stage: 'shop', sheet: 'archive', run: mid.run });
    // End screens: an erased world and a spared one, with the progress bars and next goal
    // Archetype Mastery: the sheet, a 3-piece opening gear pick (level 9), and end screens with three Mastery rows and a level line
    meta.mastery = { pyre: 46, venom: 12, blade: 335, bastion: 180, zealot: 3 };
    out.push({ label: 'sheet-mastery', stage: 'shop', sheet: 'mastery', run: mid.run });
    meta.designs = { found: { miasma: 1, vow_of_iron: 1, smelters_apron: 1, stormglass: 1 }, filed: { miasma: 1 }, dry: 2 }; meta.echoes = Math.max(meta.echoes, 20);
    out.push({ label: 'sheet-designs', stage: 'shop', sheet: 'designs', run: mid.run });
    meta.clauses = { open: { standard: 1, pauper: 1, collector: 1, barehands: 1 }, set: 'collector' }; meta.marks = Object.assign({ arch: {}, world: {}, challenge: {}, clause: {}, depth: 0 }, meta.marks, { clause: { pauper: 3 } });
    out.push({ label: 'sheet-clauses', stage: 'worlds', sheet: 'clauses', run: mid.run }, { label: 'worlds-clause', stage: 'worlds', sheet: 'none', run: mid.run });
    { const d3 = JSON.parse(JSON.stringify(dg)); d3.gearDraft = ['apothecarys_case', 'stormbreak_plate', 'flail_of_penance']; out.push({ label: 'draft-gear-3', stage: 'draft', run: d3 }); }
    const me = JSON.parse(JSON.stringify(mid.run)); me.masteryGain = [{ k: 'stormcaller' in G.ARCH ? 'stormcaller' : 'storm', gain: 5, from: 1, level: 2, xp: 27, lo: 25, hi: 45, need: 18, opened: [{ level: 2, text: G.masteryReward('storm', 2), piece: G.masteryPiece('storm', 2) }] }, { k: 'blade', gain: 3, from: 10, level: 10, xp: 338, lo: 330, hi: null, need: 0, opened: [] }, { k: 'arcanist', gain: 1, from: 0, level: 0, xp: 1, lo: 0, hi: 10, need: 9, opened: [] }]; me.designFound = ['blood_price']; me.clauseOpened = ['hermit'];
    // Goals (Phase 6): the run goal and Contracts sheets, and end screens with a met goal and three Contracts done
    { const wk = G.contractWeek(), b = G.contractBoard(wk); meta.goal = { offer: ['giant', 'overkill', 'nohosp'], pick: 'nohosp' }; meta.contracts = { week: wk, done: { [b[0]]: 1 }, weeks: 2 };
      out.push({ label: 'sheet-goal', stage: 'worlds', sheet: 'goal', run: mid.run }, { label: 'sheet-contracts', stage: 'worlds', sheet: 'contracts', run: mid.run });
      me.goal = { id: 'nohosp', met: true, paid: 10, xp: 15 }; me.contractsDone = b.map(id => ({ id, pay: G.CONTRACT_ECHOES[G.GOALS[id.split(':')[0]].tier] })); me.contractWeek = 3; }
    // Rival grudges (Phase 7): a grudge match on the choice screen, the Archive with records and a retired rival
    { meta.grudges = { grukk: { w: 3, l: 1, last: 'w', retired: 1 }, lyss: { w: 0, l: 2, last: 'l', retired: 0 }, kaito: { w: 2, l: 0, last: 'w', retired: 0 } }; meta.archive = Object.assign({}, meta.archive, { rivals: Object.assign({}, meta.archive && meta.archive.rivals, { grukk: true, lyss: true, kaito: true }) });
      const rc2 = out.find(s => s.stage === 'choose' && s.run && s.run.choices && s.run.choices.length > 1);
      if (rc2) { const rg = JSON.parse(JSON.stringify(rc2.run)); rg.choices = rg.choices.map((c, i) => i ? Object.assign(c, { kind: 'rival', id: 'lyss', grudge: true }) : c); out.push({ label: 'choose-grudge', stage: 'choose', run: rg }); }
      out.push({ label: 'sheet-archive-grudges', stage: 'shop', sheet: 'archive', run: mid.run }); me.retired = ['grukk']; }
    meta.bonds = { war: 72, trick: 23, ruin: 5 }; me.bondUp = [{ g: 'war', level: 4, text: G.bondText('war', 4) }, { g: 'trick', level: 2, text: G.bondText('trick', 2) }];
    out.push({ label: 'sheet-archive-bonds', stage: 'shop', sheet: 'archive', run: mid.run });
    // Settle the Erased (Phase 7): the win result offering to settle, after settling, and the Halls with the Settled
    { const er = Object.assign(JSON.parse(JSON.stringify((meta.erased || [])[0] || meta.champions[0] || G.snapshot(mid.run))), { at: 4242, champ: 'Velka the Unwritten of Morrowmere', name: 'Velka', worldName: 'Morrowmere' }); meta.erased = [er].concat(meta.erased || []);
      const res = { won: true, gold: 5, enemy: er.champ, msgs: [], heartsLost: 0, tally: {}, settle: 4242 };
      meta.settled = [{ at: 1, champ: 'Orrin Vale of Dunmarch', worldName: 'Dunmarch', line: G.settleLine({ at: 1, champ: 'Orrin Vale of Dunmarch', worldName: 'Dunmarch' }), when: 0 }];
      out.push({ label: 'result-settle', stage: 'shop', sheet: 'result', run: mid.run, result: res }, { label: 'result-settled', stage: 'shop', sheet: 'result', run: mid.run, result: Object.assign({}, res, { settled: meta.settled[0] }) }, { label: 'sheet-halls-settled', stage: 'shop', sheet: 'halls', run: mid.run }); }
    // Story drip (Phase 7): the Archive's pages with some open, one for sale and the sealed ones; an end screen line
    meta.story = { open: { m_erased: 1, m_spared: 1, d_handbook1: 1, d_handbook7: 1, d_letter: 1 }, since: 1 }; meta.echoes = Math.max(meta.echoes, 20); me.pagesOpened = ['m_rank_d', 'd_broadcast'];
    out.push({ label: 'sheet-pages', stage: 'shop', sheet: 'pages', run: mid.run }, { label: 'sheet-archive-pages', stage: 'shop', sheet: 'archive', run: mid.run });
    // Phase 8: Field notes at each level, Entrant Quarters with trophies, crowns, shards and decor, the Halls' Shared milestones
    meta.notes = { goblin: 1, golem: 2, drake: 3, grukk: 3, lyss: 1, leviathan: 2 }; meta.decor = { chair: 1, banner: 1 }; meta.together = { spared: 31, runs: 120 };
    meta.archive = Object.assign({}, meta.archive, { beat: Object.assign({}, meta.archive && meta.archive.beat, { leviathan: true, herald: true }) });
    out.push({ label: 'sheet-notes', stage: 'shop', sheet: 'notes', run: mid.run }, { label: 'sheet-quarters', stage: 'shop', sheet: 'quarters', run: mid.run }, { label: 'sheet-halls-shared', stage: 'shop', sheet: 'halls', run: mid.run });
    me.notesUp = [{ id: 'drake', level: 3 }];
    out.push({ label: 'end-erased', stage: 'end-erased', run: me }, { label: 'end-spared', stage: 'end-spared', run: me });
    ['stats', 'archetypes', 'menu', 'report'].forEach(sh => out.push({ label: 'sheet-' + sh, stage: 'shop', sheet: sh, run: mid.run }));
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
    if (el.closest('.floats, .skyline, .coach, .erode, .bc-splash, .bc-ticker')) return;
    // Fight status chips sit on one line that scrolls sideways, so chips past the edge are reachable
    if ((r.right > W + 1 || r.left < -1) && !el.closest('.chips')) bad.push(`off the side: ${name(el)} "${text(el)}" (${Math.round(r.left)} to ${Math.round(r.right)})`);
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
    for (const st of list.filter(x => !arg('--only') || arg('--only').split(',').includes(x.label))) {
      const run = JSON.parse(JSON.stringify(st.run)); if (st.stage === 'fight') run.stage = 'ready';
      await page.goto(url);
      await page.evaluate(([rk, mk, r, m]) => { localStorage.clear(); localStorage.setItem(rk, JSON.stringify(r)); localStorage.setItem(mk, JSON.stringify(m)); localStorage.setItem('wpd-news-seen', '99'); }, ['le-run-1', 'le-meta-1', run, meta]);
      await page.goto(url); await page.addStyleTag({ content: insets });
      await page.evaluate(([stage, sheet, pending, result]) => {
        ui.sheet = null; run.pending = pending || []; registerGlitchGear(run); if (result) ui.result = result;
        if (stage === 'fight') startFightUI();
        else if (stage === 'worlds') { if (sheet) { meta.priority = { max: 10, set: 4 }; meta.marks.challenge = { glass: 3 }; meta.wins = Math.max(1, meta.wins); ui.challenge = 'sudden'; } onAct({ dataset: { act: 'new' } }); if (sheet) { ui.challenge = 'sudden'; ui.sheet = sheet; render(); } }
        else if (stage.startsWith('end-')) { const kind = stage.slice(4), out = endRun(run, meta, kind); ui.end = { kind, echoes: out.echoes, snap: out.snap, rp: out.rp, opened: out.trial }; run.ended = true; ui.screen = 'end'; render(); }
        else { ui.screen = stage; ui.sheet = sheet || null; render(); }
      }, [st.stage, st.sheet, st.pending, st.result]);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(st.stage === 'fight' ? 900 : st.sheet || st.pending ? 450 : 150);
      if (st.preview) { await page.evaluate(() => { const f = ui.fight; let i = 0, best = -1; f.A.skills.forEach((x, k) => { const p = forecast(f, k); if (p && p.dealt > best) { best = p.dealt; i = k; } }); ui.preview = { f, i }; meta.hints = Object.assign(meta.hints || {}, { preview: 1 }); render(); updateFight(); }); await page.waitForTimeout(300); }
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
