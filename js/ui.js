// ===== [World Pending Deletion] — UI =====
'use strict';
const app = document.getElementById('app');
const toastsEl = document.getElementById('toasts');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n0 = v => String(Math.max(0, Math.round(v)));
function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } if (k === 'le-run-1' && typeof schedulePush === 'function') schedulePush(); }
const RUN_KEY = 'le-run-1', META_KEY = 'le-meta-1';

// ---------- Screen fit ----------
// Some iOS versions size a home screen app shorter than the screen by the status bar while still drawing it under
// the status bar: the top is hidden and a dead band is left at the bottom. Stretch to the real screen in that case.
function screenInfo() {
  const pr = document.createElement('div'); pr.className = 'sa-probe'; document.body.appendChild(pr); const cs = getComputedStyle(pr), top = parseFloat(cs.paddingTop) || 0, bottom = parseFloat(cs.paddingBottom) || 0; pr.remove();
  const portrait = innerHeight >= innerWidth, sh = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
  const vh = Math.min(innerHeight, document.documentElement.clientHeight);
  return { top, bottom, sh, vh, standalone: !!navigator.standalone || matchMedia('(display-mode: standalone)').matches };
}
function fitScreen() {
  const root = document.documentElement; root.style.removeProperty('--app-h');
  const s = screenInfo(), short = s.sh - s.vh;
  if (navigator.standalone && s.top > 0 && short > 0 && Math.abs(short - s.top) <= 2) root.style.setProperty('--app-h', s.sh + 'px');
  // On a computer the game scales up with the window instead of staying phone-sized
  const pc = matchMedia('(hover: hover) and (pointer: fine)').matches && innerWidth >= 1000 && innerHeight >= 640;
  const z = pc ? Math.max(1, Math.min(1.8, innerHeight / 720, innerWidth / 1100)) : 1;
  root.style.setProperty('--z', z.toFixed(3)); root.style.removeProperty('--app-zh');
  // Engines that scale percentage heights with zoom would push the bottom off screen: undo that
  if (z > 1 && app.getBoundingClientRect().height > innerHeight + 1) root.style.setProperty('--app-zh', (100 / z).toFixed(3) + '%');
}
fitScreen();
addEventListener('resize', () => setTimeout(fitScreen, 60));

const hot = window.claude && window.claude.hot;
let meta = migrateMeta(lsGet(META_KEY));
bindMeta(meta);
let run = (hot && hot.data && hot.data.run) || lsGet(RUN_KEY);
if (run && run.v !== VERSION) run = null;
if (run && Array.isArray(run.shop)) { run.shop = null; run.locks = null; refreshShop(run); }
if (run && !run.quests) Object.assign(run, { quests: [], chains: {}, milestones: {}, title: null, hiddenPath: null, wagersWon: 0, freeRerolls: 0, haggle: false, entrant: 100 + (meta.runs || 0), extraGiven: run.round >= 5, earned: [] });
ensureRecord(run);
const ui = { screen: 'title', worlds: null, seed: '', world: null, aw: null, draftSel: [], sheet: null, fight: null, busy: false, info: false, speed: [1, 2, 3].includes(lsGet('wpd-speed')) ? lsGet('wpd-speed') : 1, end: null, result: null, enchantSel: null, enchantMods: null, confirmAbandon: false, pick: null, distDone: null };
if (run) ui.screen = stageScreen();
if (hot && hot.snapshot) hot.snapshot(() => ({ run }));
function saveRun() { if (run && !run.ended && !run.practice) { run.savedAt = Date.now(); lsSet(RUN_KEY, run); if (typeof schedulePush === 'function') schedulePush(); } }
function saveMeta() { if (typeof realMeta !== 'undefined' && realMeta) return; meta.savedAt = Date.now(); lsSet(META_KEY, meta); if (typeof schedulePush === 'function') schedulePush(); }
function stageScreen() { return { draft: 'draft', choose: 'choose', district: 'district', shop: 'shop', ready: 'shop' }[run.stage] || 'choose'; }

// ---------- Toasts ----------
// Notices wait their turn instead of pushing each other off screen: a few show at once, each stays long enough to
// read (longer lines stay longer), and a tap clears one early so the next comes in. Missed ones are in the System log.
const toastQ = [];
const toastMs = (text, t) => Math.min(9000, 2400 + text.length * 45) + (t === 'broadcast' ? 1200 : 0);
function toast(text, t = 'sys', onTap) { toastQ.push({ text, t, onTap }); pumpToasts(); }
function pumpToasts() {
  if (!toastQ.length || pumpToasts.gap || toastsEl.querySelectorAll('.toast:not(.out)').length >= (ui.screen === 'fight' ? 2 : 3)) return;
  const { text, t, onTap } = toastQ.shift();
  const el = document.createElement('div'); el.className = 'toast t-' + t; el.textContent = text; el.onTap = onTap;
  placeToasts(); toastsEl.appendChild(el);
  el.timer = setTimeout(() => dropToast(el), toastMs(text, t));
  pumpToasts.gap = setTimeout(() => { pumpToasts.gap = null; pumpToasts(); }, 280);
}
function dropToast(el) { if (el.classList.contains('out')) return; clearTimeout(el.timer); el.classList.add('out'); setTimeout(() => el.remove(), 350); pumpToasts(); }
function clearToasts() { toastQ.length = 0; toastsEl.querySelectorAll('.toast').forEach(el => clearTimeout(el.timer)); toastsEl.replaceChildren(); }
toastsEl.addEventListener('click', e => { const el = e.target.closest('.toast'); if (!el) return; dropToast(el); if (el.onTap) el.onTap(); });
// In a fight, toasts sit below the foe panel so they never cover the enemy's name or HP
function placeToasts() { const foe = ui.screen === 'fight' && document.getElementById('foe'); toastsEl.style.top = foe ? `${foe.getBoundingClientRect().bottom + 6}px` : ''; }
function logRun(text, t) { if (!run) return; run.log.push({ text, t: t || 'sys' }); if (run.log.length > 40) run.log.shift(); }
const TOAST_RANK = { win: -1, broadcast: 0, merge: 1, class: 1, level: 2, favour: 3, skill: 4, loot: 5, loss: 6, sys: 7 };
const TOAST_MAX = 5;
function pushMsgs(msgs, logged) {
  if (!logged) msgs.forEach(m => logRun(m.text, m.t));
  const show = msgs.filter(m => !/^\[(Erasing|World): /.test(m.text)).sort((a, b) => (TOAST_RANK[a.t] ?? 9) - (TOAST_RANK[b.t] ?? 9));
  show.slice(0, TOAST_MAX).forEach(m => toast(m.text, m.t));
  const more = show.length - TOAST_MAX;
  if (more > 0 && run) toast(`[${more} more in the System log. Tap to read.]`, 'sys', openLog);
}
function openLog() { if (!run || ui.screen === 'fight' || (ui.sheet && ui.sheet.type === 'result')) return; ui.sheet = { type: 'syslog' }; render(); }

// ---------- Small helpers ----------
const KIND_LABEL = { monster: 'Qualifier', rival: 'Rival', final: 'Final Champion', erased: 'Erased champion', legend: 'Legend', champion: 'Past champion', trial: 'Rank Trial' };
function initials(name) { const w = name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(x => x && !['the', 'of'].includes(x.toLowerCase())); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase(); }
function crest(name, kind, big, sig, rank) {
  const inner = sig ? `<span class="sig" style="color:${SIGIL_COLS[sig.color] || '#fff'}">${SIGILS[sig.sigil] || '✦'}</span>` : `<span>${esc(initials(name))}</span>`;
  return `<div class="crest k-${kind}${big ? ' big' : ''}" aria-hidden="true">${inner}${rank ? `<b class="crest-rk">${esc(rank)}</b>` : ''}</div>`;
}
function styleOf(spec) {
  if (spec.kind === 'trial') return spec.cond ? 'Condition: ' + COND_TEXT[spec.cond] : 'No condition. Win to be promoted.';
  if (spec.snap && spec.snap.owner) return spec.kind === 'champion' ? `Saved ${spec.snap.worldName} in ${ownerName(spec.snap.owner)}'s tournament` : `Fell in ${ownerName(spec.snap.owner)}'s tournament, round ${spec.snap.round}`;
  return specStyle(spec);
}
function traitsHTML(spec) { return spec.traits && spec.traits.length ? `<div class="nx-traits">${spec.traits.filter(k => TRAIT_POOL[k]).map(k => `<span><b>${esc(TRAIT_POOL[k].name)}:</b> ${esc(TRAIT_POOL[k].desc)}</span>`).join('')}</div>` : ''; }
function rankTag(spec) { const r = specRank(spec, meta); return r ? ` · <span class="nw">${r}-rank</span>` : ''; }
function specCrest(spec) { return crest(specName(spec), spec.hard && spec.kind !== 'erased' ? spec.kind + ' hard' : spec.kind, false, spec.snap ? { sigil: spec.snap.sigil, color: spec.snap.color } : null, spec.snap && spec.snap.rank); }
function rankChip(r) { return `<span class="rank r${r}">${WORLD_RANKS[r]}</span>`; }
function rk(r) { return `<span class="srank rk-${r}">${r}</span>`; }
function stars(n) { return n > 1 ? `<span class="stars">${'★'.repeat(n)}</span>` : ''; }
function hearts(n, max) { return `<span class="hearts" aria-label="${n} of ${max} Hearts">${'<i class="h on"></i>'.repeat(Math.max(0, n))}${'<i class="h"></i>'.repeat(Math.max(0, max - n))}</span>`; }
function hpBar(cur, max, cls) { return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, cur / max * 100))}%"></i></div>`; }
function tagDots(id) { return `<span class="dots2">${pieceDef(baseId(id)).tags.map(t => `<i class="a-${t}" title="${ARCH[t].name}"></i>`).join('')}</span>`; }
function tagNames(id) { return pieceDef(baseId(id)).tags.map(t => `<span class="tagn a-${t}">${ARCH[t].name}</span>`).join(''); }
function mainTag(id) { const t = pieceDef(baseId(id)).tags; return t.length ? 'a-' + t[0] : ''; }
function roundLabel() { if (!run) return ''; if (run.elite) return `Elite ${run.eliteIdx + 1} of ${run.eliteBracket.length}`; return run.round >= ROUNDS ? 'Final' : `Round ${run.round} of ${ROUNDS}`; }
function bracketDots() {
  let h = '<div class="dots" aria-label="Bracket progress">';
  for (let i = 1; i <= ROUNDS; i++) { const st = run.elite || i < run.round ? 'done' : i === run.round ? 'now' : ''; h += `<span class="dot ${st} ${i === ROUNDS ? 'fin' : ''}"></span>`; }
  if (run.elite) run.eliteBracket.forEach((_, i) => { h += `<span class="dot elite ${i < run.eliteIdx ? 'done' : i === run.eliteIdx ? 'now' : ''}"></span>`; });
  return h + '</div>';
}
// The fight screen leaves out gold (nothing to spend it on mid-fight) to make room for its speed and ? buttons
function topBar(title, extra, fight) {
  return `<header class="bar"><div class="bar-l"><div class="bar-w"><span class="wname">${esc(run.world.name)}</span>${rankChip(run.world.rank)}</div><span class="rl">${esc(title || roundLabel())}</span></div><div class="bar-r">${extra || ''}${run.record ? `<button class="hcount" data-act="sheet" data-s="record" aria-label="${run.hearts} Hearts. Open the world record">♥${run.hearts}</button>` : `<span class="hcount" title="Hearts">♥${run.hearts}</span>`}${fight ? '' : `<span class="gold" title="Gold">${run.gold}g</span><button class="icon-btn logb" data-act="sheet" data-s="syslog" aria-label="System log: every message this run">Log</button>`}<button class="icon-btn" data-act="menu" aria-label="Menu">≡</button></div></header>`;
}
function archChips(counts, small) {
  return `<div class="achips${small ? ' small' : ''}">${run.arch.map(k => { const n = counts[k] || 0, t = archTier(n), next = n >= 6 ? 6 : n >= 4 ? 6 : n >= 2 ? 4 : 2; return `<button class="achip a-${k} t${t}" data-act="sheet" data-s="archetypes" aria-label="${ARCH[k].name}: ${n} pieces"><b>${n}</b><span>${ARCH[k].name}</span><small>/${next}</small></button>`; }).join('')}</div>`;
}
function playerPower(p) { const def = moddedDef(p.id, p.mods); return skillPower(def, effStats(run), p.star) * def.powerMult; }
function champLine() {
  const mh = maxHp(run);
  return `<section class="cline"><div class="cl-l">${crest(run.name, 'me', false, { sigil: run.sigil, color: run.color })}<div><div class="ch-name">${esc(run.name)}</div><div class="ch-sub">${run.path ? esc(ARCH[run.path].path) + ' · ' : ''}Lv ${run.level} <span class="xp"><i style="width:${run.level >= 9 ? 100 : run.xp / xpNeed(run.level) * 100}%"></i></span></div></div></div><div class="cl-r"><div class="ch-hp">${n0(run.hp)} / ${mh} HP</div>${hpBar(run.hp, mh, 'hp')}${run.record ? `<button class="ch-hearts" data-act="sheet" data-s="record" aria-label="Open the world record">${hearts(run.hearts, run.maxHearts)}</button>` : `<div class="ch-hearts">${hearts(run.hearts, run.maxHearts)}</div>`}</div></section>`;
}

// ---------- World Record ----------
// A lost entry is a black bar the width of the words it hides
function redact(text) { return `<span class="redact" role="img" aria-label="erased entry"><span aria-hidden="true">${esc(text)}</span></span>`; }
function bioHTML(rec, type, worldName, champ) { return bioParts(rec, type, worldName, champ).map(p => p.gone ? redact(p.t) : esc(p.t)).join(''); }
function recLine(e) { return e.line.map(w => w.gone ? redact(w.t) : esc(w.t)).join(' '); }
// The record sheet: from the current run, or from a Halls card (third person)
function recordSheet() {
  const S = ui.sheet, snap = S.at != null ? findSnap(S.at) : null;
  const rec = snap ? snap.rec : run && run.record;
  if (!rec) { ui.sheet = null; return ''; }
  const type = snap ? snap.worldType : run.world.type, wname = snap ? snap.worldName : run.world.name;
  const list = recEntries(rec, type, !!snap), left = recLeft(rec), grid = list.length > 11;
  const row = e => e.lost ? `<li class="lost"><b>${redact(e.name)}</b></li>` : `<li class="${e.partial ? 'partial' : ''}"><b>${esc(e.name)}</b> <span>${recLine(e)}</span></li>`;
  const cell = e => `<button class="rg ${e.lost ? 'lost' : ''} ${ui.recOpen === e.pos ? 'on' : ''}" data-act="rec-open" data-p="${e.pos}" ${e.lost ? 'disabled' : ''}>${e.lost ? redact(e.name) : esc(e.name)}</button>`;
  const open = grid && list[ui.recOpen] && !list[ui.recOpen].lost ? `<p class="rec-open">${recLine(list[ui.recOpen])}</p>` : '';
  const body = `<p class="sh-p bio">${bioHTML(rec, type, wname, snap ? snap.name || snap.champ : null)}</p>
    ${grid ? `<div class="recgrid">${list.map(cell).join('')}</div>${open || '<p class="sh-p fine">Tap an entry to read it.</p>'}` : `<ul class="rec">${list.map(row).join('')}</ul>`}
    <p class="sh-p fine">[${left} of ${list.length} entr${list.length === 1 ? 'y' : 'ies'} survive.]</p>`;
  return sheetWrap(recWorldGone(rec) ? 'World record: erased' : `World record: ${wname}`, body, `<button class="btn primary" data-act="rec-close">Close</button>`, 'sys rec-sheet');
}
function findSnap(at) { at = String(at); return meta.erased.concat(meta.champions, cloud.shared.map(x => x.snap)).find(s => String(s.at) === at) || (ui.end && ui.end.snap && String(ui.end.snap.at) === at ? ui.end.snap : null); }
// The deletion moment: one row per erased entry. One tap erases them all, one after another; each glitches, then becomes a bar.
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function eraseSteps(r) {
  const R = run && run.record; if (!R || !r.erased || !r.erased.length) return [];
  const E = LORE[run.world.type].entries;
  const out = r.erased.map(p => ({ name: E[R.ids[p]].name, line: `[Erasing: ${loreName(E[R.ids[p]])}… done.]` }));
  if (r.death) out.push({ name: run.world.name, line: `[World: ${'█'.repeat(run.world.name.length)}. Status: erased.]`, world: true });
  return out;
}
function eraseRows(steps) {
  if (!steps.length) return '';
  const d = ui.erDone || 0;
  return `<div class="erase" aria-live="polite">${steps.map((s, k) => `<div class="er ${k < d ? 'gone' : k === d && ui.erBusy ? 'glitch' : k === d ? 'next' : ''} ${s.world ? 'world' : ''}"><b>${k < d ? redact(s.name) : esc(s.name)}</b>${k < d ? `<small>${esc(s.line)}</small>` : ''}</div>`).join('')}</div>`;
}
// Until every row is erased, the footer button erases them; then it becomes the usual button
function eraseFoot(steps, done) {
  const d = ui.erDone || 0; ui.erFinal = done;
  if (d >= steps.length) return done;
  const n = steps.filter(s => !s.world).length, w = steps.some(s => s.world) ? esc(run.world.name) : '';
  const label = ui.erBusy ? 'Erasing…' : `Erase ${n ? (n === 1 ? '1 entry' : `${n} entries`) + (w ? ` and ${w}` : '') : w}`;
  return `<button class="btn primary danger-b" data-act="erase-next" ${ui.erBusy ? 'disabled' : ''}>${label}</button>`;
}
// Redraw only the rows and the button, so the sheet doesn't slide in again on every tap
function eraseRefresh() {
  const steps = eraseSteps(ui.result), box = app.querySelector('.erase'), foot = app.querySelector('.sh-f');
  if (!box || !foot) return render();
  box.outerHTML = eraseRows(steps); foot.innerHTML = eraseFoot(steps, ui.erFinal);
}
// Each row glitches for a moment before it goes, so the eye follows the deletion down the list
function eraseNext() {
  if (ui.erBusy) return;
  const res = ui.result, n = eraseSteps(res).length;
  ui.erBusy = true; eraseRefresh();
  const tick = () => setTimeout(() => {
    if (ui.result !== res) return;
    ui.erDone = (ui.erDone || 0) + 1;
    if (ui.erDone >= n) ui.erBusy = false; else tick();
    eraseRefresh();
  }, REDUCED ? 300 : 600);
  tick();
}
// The skyline: one silhouette per place in the record, drawn behind the fight log. A lost place leaves a dotted gap.
const SKY_W = 40;
const SKYLINE = {
  drowned: ['M16 48L18 16H22L24 48ZM15 16H25V12H15ZM17 12L20 6L23 12Z', 'M13 48V18L20 10L27 18V48Z', 'M10 30L20 22L30 30ZM12 30H28V38H12ZM13 38H14.5V48H13ZM25.5 38H27V48H25.5ZM19 38H20.5V48H19Z', 'M6 40H34L30 48H10ZM19 22V40H20.5V22ZM20.5 24L28.5 36H20.5Z', 'M8 48V30Q20 18 32 30V48H27V32Q20 26 13 32V48Z', 'M19 48V34L13 26V18H15V25L19 30V14H21V30L25 25V18H27V26L21 34V48Z'],
  burning: ['M6 48V20H34V48H25V32Q20 25 15 32V48ZM6 16H10V20H6ZM14 16H18V20H14ZM22 16H26V20H22ZM30 16H34V20H30Z', 'M15 48V18H25V48ZM14 18H26V15H14ZM20 15V4H21V15ZM21 4L29 7L21 10Z', 'M16 48L17 14L20 8L23 14L24 48Z', 'M4 48V32L20 24L36 32V48Z', 'M8 48V34H26V48ZM26 48V14H32V48ZM26 9A3 3 0 1 0 32 9A3 3 0 1 0 26 9Z', 'M6 48L11 30L15 48ZM14 48L20 22L26 48ZM25 48L30 34L34 48Z'],
  hollow: ['M10 48V30L18 24L26 30V48ZM24 48V14L27 8L30 14V48Z', 'M19 48V36H21V48ZM20 8C8 14 6 32 12 38H28C34 32 32 14 20 8Z', 'M2 48Q20 26 38 48Z', 'M10 14H30V16H10ZM11 16H13V48H11ZM27 16H29V48H27ZM15 34Q15 22 20 20Q25 22 25 34L27 36H13Z', 'M18 48V20H12V16H18V10H22V16H28V20H22V48Z', 'M10 48V30H30V48ZM10 30Q20 16 30 30Z'],
  verdant: ['M18 48V32H22V48ZM20 10C6 10 4 30 14 32H26C36 30 34 10 20 10Z', 'M12 48V26L20 20L28 26V48ZM24 30A6 6 0 1 0 36 30A6 6 0 1 0 24 30Z', 'M8 48L9 28L14 26L15 48ZM18 48V22L23 20L24 48ZM28 48V30L32 29L33 48Z', 'M2 48C8 30 32 30 38 48Z', 'M19 48V16H21V48ZM16 16H24V24H16ZM17 14L20 10L23 14Z', 'M10 48V40H4L10 28H6L12 16L18 28H14L20 40H14V48ZM28 48V42H23L28 32H25L30 22L35 32H32L37 42H32V48Z'],
  sky: ['M8 30H32L20 44ZM16 30V14H24V30ZM15 14L20 8L25 14Z', 'M17 48L18 16L20 4L22 16L23 48Z', 'M2 20Q20 34 38 20V22Q20 36 2 22Z', 'M4 36H36V39H4ZM8 39H10V48H8ZM30 39H32V48H30ZM14 24H26L24 30H16Z', 'M8 40A6 6 0 0 1 14 32A8 8 0 0 1 28 34A5 5 0 0 1 32 40Z', 'M6 20A14 6 0 1 0 34 20A14 6 0 1 0 6 20ZM16 28H24V32H16Z'],
  iron: ['M6 48V18H34V48ZM6 14H11V18H6ZM17 14H23V18H17ZM29 14H34V18H29Z', 'M8 30H32L28 35H24V41H30V48H10V41H16V35H12Z', 'M0 48L14 18L20 26L26 14L40 48Z', 'M8 48V20H14V48ZM17 48V12H23V48ZM26 48V24H32V48Z', 'M4 48L12 28H28L36 48Z', 'M14 48V14H26V48ZM12 10H28V14H12Z'],
};
function skylineSVG() {
  const R = run && run.record; if (!R || !SKYLINE[run.world.type]) return '';
  const E = LORE[run.world.type].entries, places = E.map((e, i) => i).filter(i => E[i].k === 'place');
  const slots = recEntries(R, run.world.type).filter(e => e.k === 'place');
  if (!slots.length) return '';
  const paths = slots.map((e, k) => { const d = SKYLINE[run.world.type][places.indexOf(e.i) % 6]; return `<path transform="translate(${k * SKY_W} 0)" d="${d}" class="${e.lost ? 'gone' : ''}"/>`; }).join('');
  return `<svg class="skyline" viewBox="0 0 ${slots.length * SKY_W} 48" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${paths}</svg>`;
}

// ---------- Pending World ----------
// One seeded world a day for everyone. The first attempt is ranked, finished or not; replays are unranked.
function dailyPlayed(date) { return !!(meta.daily && meta.daily.date === date && meta.daily.started); }
function pendingLine(name, count) { return `[Pending World: ${name}.${count != null ? ` Entrants observing: ${count}.` : ''} Outcome: pending.]`; }
function dailyButton(saved) {
  const date = dailyDate(), w = dailyWorld(date), label = `Pending World: ${esc(w.name)} · ${WORLD_RANKS[w.rank]}`;
  if (saved && saved.daily === date) return '';
  if (dailyPlayed(date)) return `<button class="btn" data-act="daily-board">Today's outcomes</button>`;
  if (saved) return `<p class="sh-p fine center daily-wait">Pending World opens when this run ends.</p>`;
  return `<button class="btn daily" data-act="daily">${label}</button>`;
}
// Called when a Pending World run ends. Records the ranked result once, posts it, and returns the System's closing line.
function finishDaily(spared) {
  if (!run || !run.daily) return null;
  const sc = dailyScore(run);
  if (run.ranked && meta.daily && meta.daily.date === run.daily && !meta.daily.result) {
    meta.daily.result = Object.assign(sc, { rank: meta.rank ? meta.rank.letter : null, spared: !!spared, name: run.name, sigil: run.sigil, color: run.color, path: run.path || null, rec: run.record ? { ids: run.record.ids.slice(), lost: run.record.lost, partial: run.record.partial, bio: Object.assign({}, run.record.bio) } : null, w: run.world.type });
    saveMeta(); postDaily();
  }
  return run.ranked ? `[Observation recorded. ${run.world.name} was ${spared ? 'spared' : 'erased'} for you. Other outcomes vary.]` : `[Replay observed. ${run.world.name} was ${spared ? 'spared' : 'erased'}. Unranked.]`;
}
function untilTomorrow() { const now = Date.now(), next = Date.parse(dailyDate(now) + 'T00:00:00Z') + 864e5 - 9.5 * 3600e3, m = Math.max(1, Math.round((next - now) / 6e4)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} m` : `${m} m`; }

// Scores live at daily/{date}/scores/{uid}: one create per player per game day (see firestore.rules)
const dailyCol = date => cloud.db.collection(`daily/${date}/scores`);
function scoreDoc(r) {
  const d = { name: String(r.name || 'Entrant').slice(0, 24), sigil: Number.isInteger(r.sigil) ? r.sigil : 0, color: Number.isInteger(r.color) ? r.color : 0, wins: r.wins, hearts: r.hearts, turns: r.turns, score: r.score, path: r.path || null, at: Date.now() };
  if (r.rank) d.rank = r.rank;
  if (cloud.on) d.player = publicName();
  if (r.rec) d.rec = { ids: r.rec.ids.slice(), lost: r.rec.lost, partial: r.rec.partial, bio: Object.assign({}, r.rec.bio) };
  return d;
}
// Another player's score is untrusted: clamp the numbers and check the record against today's pool
function cleanScore(uid, d, date) {
  if (!d || typeof d !== 'object') return null;
  const int = (v, hi) => Number.isInteger(v) ? Math.max(0, Math.min(hi, v)) : 0, type = dailyWorld(date).type;
  const r = { uid, name: String(d.name || 'Entrant').slice(0, 24), sigil: int(d.sigil, SIGILS.length - 1), color: int(d.color, SIGIL_COLS.length - 1), wins: int(d.wins, 12), hearts: int(d.hearts, 20), turns: int(d.turns, 999) };
  r.score = 100000 * r.wins + 1000 * r.hearts + (999 - r.turns); r.spared = r.wins >= 8; r.rank = rankIdx(d.rank) >= 0 ? d.rank : null;
  r.player = typeof d.player === 'string' ? d.player.slice(0, 24) : '';
  r.rec = d.rec ? sanitizeRec(Object.assign({}, d.rec, { w: type }), type) : null;
  return r;
}
// Posts today's ranked result once. A score made offline posts at the next sync, as long as it's still the same game day.
async function postDaily() {
  const D = meta.daily, r = D && D.result;
  if (!cloud.on || !cloud.db || !cloud.uid || !r || D.posted || D.date !== dailyDate() || ui.posting || cloud.tester === false) return;
  ui.posting = true;
  const ref = cloud.db.doc(`daily/${D.date}/scores/${cloud.uid}`);
  // Older published rules refuse the rank and player fields, so a refused post is retried without them
  const plain = d => { const o = Object.assign({}, d); delete o.rank; delete o.player; return o; };
  try { await ref.set(scoreDoc(r)).catch(e => { if (e && e.code === 'invalid_argument') return ref.set(plain(scoreDoc(r))); throw e; }); D.posted = true; saveMeta(); }
  catch (e) {
    // Already there (posted from another device): the rules refuse a second write, so stop trying
    let there = false; try { there = (await ref.get()).exists; } catch (e2) { }
    if (there) { D.posted = true; saveMeta(); } else cloudFail('board', 'post score', e);
  }
  ui.posting = false;
  if (ui.board) ui.board.t = 0;
  if (ui.sheet && ui.sheet.type === 'daily') loadBoard();
}
// Playtest stats: one anonymous summary per finished run (runSummary in core.js) for the stats dashboard.
// Queued on the device and posted to runs/{uid}_{at} when signed in as a tester; only the console reads them.
const RUNQ_KEY = 'wpd-runq';
function recordRunStats(outcome) {
  if (!run || run.practice || run.statsDone) return; // once per run: a spared world's Elite bracket doesn't add another
  run.statsDone = true;
  const q = lsGet(RUNQ_KEY) || []; q.push(runSummary(run, meta, outcome)); lsSet(RUNQ_KEY, q.slice(-20));
  postRuns();
}
async function postRuns() {
  if (!cloud.on || !cloud.db || !cloud.uid || cloud.tester === false || ui.postingRuns) return;
  ui.postingRuns = true;
  // A refused post stays queued (rules not published yet): it goes at a later sync, and the queue keeps the last 20
  for (const r of lsGet(RUNQ_KEY) || []) {
    try { await cloud.db.doc(`runs/${cloud.uid}_${r.at}`).set(r); lsSet(RUNQ_KEY, (lsGet(RUNQ_KEY) || []).filter(x => x.at !== r.at)); }
    catch (e) { console.warn('[cloud] post run stats failed:', e && e.code, e); break; }
  }
  ui.postingRuns = false;
}
// Bug reports and feedback (Menu → Report). Queued on the device and posted to feedback/{uid}_{at} once signed in,
// approved or not; only the console and the stats dashboard read them. A refused post stays queued for a later sync.
const FBQ_KEY = 'wpd-fbq';
// An unsent draft is kept if the form is closed and opened again
function openReport() { ui.fb = Object.assign({ type: 'bug', text: '', attach: !!run }, ui.fb, { from: ui.screen + (run ? '/' + run.stage : '') }); ui.sheet = { type: 'report' }; render(); }
function sendReport() {
  const F = ui.fb; if (!F) return;
  if (!F.text.trim()) { toast('[The System cannot read an empty report. Type something.]', 'loss'); return; }
  const s = screenInfo(), build = (typeof PATCH_NOTES !== 'undefined' && PATCH_NOTES.length ? PATCH_NOTES[0].id : '?') + '/s' + VERSION;
  const d = feedbackDoc(F.type, F.text, { build, screen: F.from, w: innerWidth, h: s.vh, app: s.standalone, ua: navigator.userAgent }, F.attach && run && !run.practice ? run : null);
  const q = lsGet(FBQ_KEY) || []; q.push(d); lsSet(FBQ_KEY, q.slice(-10));
  ui.fb = null; ui.sheet = null; render();
  toast(cloud.on ? '[Report filed. The System reads every one. Eventually.]' : '[Report filed. It sends once you sign in.]', 'sys');
  postFeedback();
}
async function postFeedback() {
  if (!cloud.on || !cloud.db || !cloud.uid || ui.postingFb) return;
  ui.postingFb = true;
  for (const r of lsGet(FBQ_KEY) || []) {
    try { await cloud.db.doc(`feedback/${cloud.uid}_${r.at}`).set(r); lsSet(FBQ_KEY, (lsGet(FBQ_KEY) || []).filter(x => x.at !== r.at)); }
    catch (e) { console.warn('[cloud] post report failed:', e && e.code, e); break; }
  }
  ui.postingFb = false;
}
// The board: today's top 20, plus your own score pinned with its rank when you're outside them. About 21 reads.
async function loadBoard() {
  const date = dailyDate(), B = ui.board;
  if (!cloud.on || !cloud.db) return;
  if (B && B.date === date && (B.loading || Date.now() - B.t < 60e3)) return;
  ui.board = { date, rows: B && B.date === date ? B.rows : null, mine: B && B.date === date ? B.mine : null, loading: true, t: Date.now() };
  const col = dailyCol(date), own = cloud.uid;
  try {
    const docs = col.query ? (await col.query({ orderBy: ['score', 'desc'], limit: 20 })).docs : (await col.get()).docs;
    const rows = docs.map(x => cleanScore(x.id, x.data(), date)).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 20);
    let mine = null;
    if (!rows.some(x => x.uid === own)) {
      const snap = await cloud.db.doc(`daily/${date}/scores/${own}`).get();
      if (snap.exists) { mine = cleanScore(own, snap.data(), date); mine.rank = col.count ? 1 + await col.count({ where: ['score', '>', mine.score] }) : null; }
    }
    Object.assign(ui.board, { rows, mine, loading: false, t: Date.now(), error: null });
  } catch (e) { Object.assign(ui.board, { loading: false, error: true, t: Date.now() }); cloudFail('board', 'load scores', e); }
  if (ui.sheet && (ui.sheet.type === 'daily' || ui.sheet.type === 'dailycmp')) render();
}
// "Entrants observing: N" on entering: one count() on today's scores, read while the Awakening is open. Offline, the clause is dropped.
function countObservers(D) {
  if (!cloud.on || !cloud.db) return;
  const col = dailyCol(D.date);
  if (col.count) col.count().then(n => { D.count = n; }).catch(e => console.warn('[cloud] count failed:', e && e.code, e));
}
// The name cell: rank letter, name, and a star for the Prime Entrant
function nameCell(r) { const P = ui.prime; return `${r.rank ? `<i class="br-l">${r.rank}</i>` : ''}${esc(r.name || 'Entrant')}${r.player ? `<i class="br-p"> · ${esc(r.player)}</i>` : ''}${P && P.uid && r.uid === P.uid ? ' <i class="br-pe" title="Prime Entrant" aria-label="Prime Entrant">★</i>' : ''}`; }
// Rank, sigil, name, round reached, Hearts left, entries kept
function reached(r) { return r.wins > 8 ? `Elite ${r.wins - 8}` : r.wins === 8 ? 'Spared' : `Round ${r.wins + 1}`; }
function resultRow(r, rank, me, i) {
  const w = r.rec ? `${recLeft(r.rec)}/${r.rec.ids.length}` : '–';
  const inner = `<span class="br-n">${rank || '–'}</span><span class="sig" style="color:${SIGIL_COLS[r.color] || '#fff'}">${SIGILS[r.sigil] || '✦'}</span><span class="br-name">${nameCell(r)}</span><span class="br-r">${reached(r)}</span><span class="br-h">♥${r.hearts}</span><span class="br-k">${w}</span>`;
  return i != null && r.rec ? `<button class="brow ${me ? 'mine' : ''}" data-act="board-row" data-i="${i}">${inner}</button>` : `<div class="brow ${me ? 'mine' : ''}">${inner}</div>`;
}
function dailySheet() {
  const date = dailyDate(), w = dailyWorld(date), r = meta.daily && meta.daily.date === date ? meta.daily.result : null, busy = lsGet(RUN_KEY) && !lsGet(RUN_KEY).ended;
  const B = ui.board && ui.board.date === date ? ui.board : null, own = cloud.uid;
  let rows = '', note = '';
  if (cloud.on && B && B.rows) {
    ui.boardList = B.rows.concat(B.mine ? [B.mine] : []);
    rows = B.rows.map((x, i) => resultRow(x, i + 1, x.uid === own, i)).join('');
    if (!B.rows.length) rows = '<p class="sh-p fine">No outcomes recorded yet today.</p>';
    if (B.mine) rows += `<div class="br-gap" aria-hidden="true">···</div>` + resultRow(B.mine, B.mine.rank, true, B.rows.length);
    else if (r && !meta.daily.posted && !B.rows.some(x => x.uid === own)) { rows += `<div class="br-gap" aria-hidden="true">···</div>` + resultRow(r, null, true); note = cloud.tester === false ? `${PENDING} Your score stays on this device until you are approved.` : 'Your score posts at the next sync today.'; }
  } else if (cloud.on) {
    rows = B && B.error ? '<p class="sh-p fine">[Observations unavailable. Try again later.]</p>' : '<p class="sh-p fine">[Retrieving observations…]</p>';
  } else {
    ui.boardList = r && r.rec ? [Object.assign({ uid: own }, r)] : [];
    rows = r ? resultRow(r, null, true, 0) : '';
    note = FIREBASE ? 'Sign in to post your score.' : 'Scores stay on this device.';
  }
  if (!r) note = 'Your ranked attempt is still in progress.';
  const body = `<p class="sh-p sysl">[${esc(w.name)}, rank ${WORLD_RANKS[w.rank]}. Next world in ${untilTomorrow()}.]</p>
    <div class="board"><div class="brow head"><span class="br-n">#</span><span></span><span class="br-name">Entrant</span><span class="br-r">Reached</span><span class="br-h" aria-label="Hearts">♥</span><span class="br-k">Kept</span></div>${rows}</div>
    ${note ? `<p class="sh-p fine">${note}</p>` : ''}${!cloud.on && FIREBASE ? cloudSignInHTML(true) : ''}
    ${cloud.on && B && B.rows && B.rows.some(x => x.rec) ? '<p class="sh-p fine">Tap a row to compare records.</p>' : ''}`;
  return sheetWrap("Today's outcomes", body, `${cloud.on ? '<button class="btn ghost" data-act="board-week">This week</button>' : '<button class="btn ghost" data-act="close">Close</button>'}<button class="btn" data-act="daily" ${busy ? 'disabled' : ''}>Play again (unranked)</button>`, 'sys board-sheet');
}
// ---------- Seasons ----------
// A day's top 20, trimmed for the season table. Past days are final, so they're kept on the device; today is re-read after an hour.
const DAY_KEY = 'wpd-day-', thin = r => ({ uid: r.uid, name: r.name, player: r.player, sigil: r.sigil, color: r.color, rank: r.rank, score: r.score });
async function dayTop(date) {
  const today = dailyDate(), C = ui.dayCache = ui.dayCache || {};
  if (date < today) { const k = lsGet(DAY_KEY + date); if (Array.isArray(k)) return k; }
  else if (C[date] && Date.now() - C[date].t < 3600e3) return C[date].rows;
  const col = dailyCol(date);
  const docs = col.query ? (await col.query({ orderBy: ['score', 'desc'], limit: 20 })).docs : (await col.get()).docs;
  const rows = docs.map(x => cleanScore(x.id, x.data(), date)).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 20).map(thin);
  if (date < today) { lsSet(DAY_KEY + date, rows); pruneDays(); } else C[date] = { t: Date.now(), rows };
  return rows;
}
function pruneDays() { try { const old = new Date(Date.now() - 21 * 864e5).toISOString().slice(0, 10); Object.keys(localStorage).forEach(k => { if (k.startsWith(DAY_KEY) && k.slice(DAY_KEY.length) < old) localStorage.removeItem(k); }); } catch (e) { } }
// This week's standings (up to 7 reads of 20) and last week's winner, the current Prime Entrant (7 more, read once and kept)
async function loadSeason() {
  if (!cloud.on || !cloud.db || ui.seasonBusy) return;
  ui.seasonBusy = true;
  try {
    const today = dailyDate(), wk = weekOf(today), last = weekOf(new Date(Date.parse(wk + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10));
    const days = await Promise.all(weekDates(wk).filter(d => d <= today).map(dayTop));
    const prev = await Promise.all(weekDates(last).map(dayTop));
    const top = seasonTable(prev)[0] || null;
    ui.season = { week: wk, table: seasonTable(days).slice(0, 20), t: Date.now() };
    ui.prime = top ? { uid: top.uid, name: top.name, week: last } : { week: last };
    announcePrime(top, last);
  } catch (e) { cloudFail('board', 'load season', e); }
  ui.seasonBusy = false;
  if (ui.sheet && (ui.sheet.type === 'daily' || ui.sheet.type === 'dailyweek')) render();
}
// Once per season: the new Prime Entrant hears it, and so does the one it passed from
function announcePrime(top, week) {
  if (meta.primeSeen === week) return;
  const mine = top && top.uid === cloud.uid;
  if (mine) logToast(`[Season closed. ${top.name} is the ${SEASON_TITLE}.]`);
  else if (meta.prime) logToast(`[Season closed. A new ${SEASON_TITLE} has been recorded.]`);
  meta.prime = mine ? week : null; meta.primeSeen = week; saveMeta();
}
function seasonRow(e, i) {
  return `<div class="brow ${e.uid === cloud.uid ? 'mine' : ''}"><span class="br-n">${i + 1}</span><span class="sig" style="color:${SIGIL_COLS[e.color] || '#fff'}">${SIGILS[e.sigil] || '✦'}</span><span class="br-name">${nameCell(e)}</span><span class="br-r">${e.pts} pts</span><span class="br-h"></span><span class="br-k">${e.days}/7</span></div>`;
}
function seasonBody() {
  const S = ui.season, P = ui.prime, today = dailyDate(), wk = weekOf(today);
  const head = `<p class="sh-p sysl">[Season: week of ${wk.slice(5).replace('-', '/')}. Closes in ${Math.ceil((Date.parse(wk + 'T00:00:00Z') + 7 * 864e5 - Date.parse(today + 'T00:00:00Z')) / 864e5)} d.]</p>`;
  const prime = P && P.name ? `${SEASON_TITLE} · ${esc(P.name)}. ` : '';
  if (!S || S.week !== wk) return head + '<p class="sh-p fine">[Retrieving the season…]</p>';
  const rows = S.table.length ? S.table.map(seasonRow).join('') : '<p class="sh-p fine">No outcomes recorded this week.</p>';
  return `${head}<div class="board"><div class="brow head"><span class="br-n">#</span><span></span><span class="br-name">Entrant</span><span class="br-r">Points</span><span class="br-h"></span><span class="br-k">Days</span></div>${rows}</div>
    <p class="sh-p fine">${prime}Daily places 1 to 10 pay 25 down to 1, and every posted score pays 1. The week's winner is the next ${SEASON_TITLE}.</p>`;
}
function weekSheet() {
  const busy = lsGet(RUN_KEY) && !lsGet(RUN_KEY).ended;
  return sheetWrap('This week', seasonBody(), `<button class="btn ghost" data-act="daily-board">Today</button><button class="btn" data-act="daily" ${busy ? 'disabled' : ''}>Play again (unranked)</button>`, 'sys board-sheet');
}
// Another player's record next to yours: the same world, erased differently
function compareSheet() {
  const date = dailyDate(), w = dailyWorld(date), them = (ui.boardList || [])[ui.sheet.i];
  if (!them || !them.rec) { ui.sheet = { type: 'daily' }; return dailySheet(); }
  const r = meta.daily && meta.daily.date === date ? meta.daily.result : null, me = them.uid !== cloud.uid && r && r.rec ? r : null;
  const col = (x, label) => { const list = recEntries(x.rec, w.type, true); return `<div class="cmp-col"><h4>${esc(label)}</h4><ul>${list.map(e => `<li class="${e.lost ? 'lost' : ''}">${e.lost ? redact(e.name) : esc(e.name)}</li>`).join('')}</ul><p class="sh-p fine">${recLeft(x.rec)} of ${list.length} survive.</p></div>`; };
  const body = `<p class="sh-p sysl">[${esc(w.name)}, as ${esc(them.name)} left it.${me ? ' Yours beside it.' : ''}]</p>
    <div class="cmp ${me ? '' : 'one'}">${col(them, them.name)}${me ? col(me, 'You') : ''}</div>`;
  return sheetWrap(recWorldGone(them.rec) ? 'World record: erased' : `World record: ${w.name}`, body, `<button class="btn primary" data-act="daily-board">Back</button>`, 'sys rec-sheet');
}

// ---------- Title / worlds ----------
function titleHTML() {
  const saved = lsGet(RUN_KEY), canResume = saved && saved.v === VERSION && !saved.ended;
  return `<main class="screen title ${canResume ? 'resume' : ''}">
    <div class="t-top"><div class="eyebrow">[System notice] · Prototype v5.2</div><h1 class="logo"><span class="brk">[</span>World Pending Deletion<span class="brk">]</span></h1>
    <div class="sysbox"><p>${meta.runs && meta.rank ? esc(rankAddress(meta, meta.champions[0] && meta.champions[0].name, meta.runs)) : '[The Grand Tournament has begun.]'}</p><p>[Worlds awaiting judgement: many. Champions remaining: one per world.]</p></div>
    <p class="lede">Pick a world and fight for it through an 8-round divine tournament. Choose your opponents, buy and merge skills and gear, and build into archetypes. Every loss erases part of your world.</p></div>
    <div class="t-stats"><div><b>${meta.wins}</b><span>spared</span></div><div><b>${meta.erased.length}</b><span>erased</span></div><div><b>${meta.echoes}</b><span>Echoes</span></div><button data-act="sheet" data-s="halls"><b>${meta.rank ? meta.rank.letter : 'F'}</b><span>Entrant Rank</span></button></div>
    <div class="stack">
      ${canResume ? `<button class="btn primary" data-act="resume">Continue · ${saved.daily ? 'Pending World: ' : ''}${esc(saved.world.name)}, ${saved.stage === 'draft' ? 'opening draft' : 'round ' + saved.round}</button>` : ''}
      ${dailyButton(canResume && saved)}
      <button class="btn ${canResume ? '' : 'primary'}" data-act="new">${canResume ? 'Abandon and start over' : 'Enter the tournament'}</button>
      <button class="btn ${meta.tutorialDone ? 'ghost small' : ''}" data-act="practice">${meta.tutorialDone ? 'Replay the practice run' : 'Practice run (tutorial)'}</button>
      <div class="row3"><button class="btn ghost" data-act="sheet" data-s="archive">Archive</button><button class="btn ghost" data-act="sheet" data-s="halls">Halls</button><button class="btn ghost" data-act="sheet" data-s="echoes">Echoes</button></div>
      <div class="row3"><button class="btn ghost small" data-act="sheet" data-s="howto">How to play</button><button class="btn ghost small" data-act="news">What's new${newsUnseen() ? ' <span class="badge">!</span>' : ''}</button><button class="btn ghost small" data-act="report">Report</button></div>
      ${FIREBASE && !cloud.on ? cloudSignInHTML(true) : FIREBASE && cloud.on ? `<p class="sh-p fine center">Signed in as ${esc(publicName())} · cloud save on · <button class="link" data-act="signout">Sign out</button>${cloud.tester === false ? `<br>${PENDING}` : ''}</p>` : ''}
    </div></main>`;
}
function worldsHTML() {
  const cards = ui.worlds.map((w, i) => {
    const T = WORLD_TYPES[w.type], M = MODIFIERS[w.mod];
    return `<button class="pick ${ui.world === i ? 'on' : ''}" data-act="pick-world" data-i="${i}">
      <div class="pk-h"><span class="pk-name">${esc(w.name)}</span>${rankChip(w.rank)}</div>
      <div class="pk-sub">${esc(T.name)} · ${esc(T.flavour)}</div>
      <div class="pk-row"><span class="tagn a-${T.home}">${ARCH[T.home].name}</span><span class="pk-mut">World Gift: ${esc(GIFTS[T.gift].name)}</span></div>
      <div class="pk-row"><span class="tag">${esc(M.name)}</span><span class="pk-mut">${esc(M.desc)}</span></div>
      <div class="pk-row"><span class="pk-mut">Final: ${esc(ENEMIES[T.final].name)}</span></div>
    </button>`;
  }).join('');
  const w = ui.world != null ? ui.worlds[ui.world] : null;
  return `<main class="screen select"><div class="sel-h"><button class="icon-btn" data-act="back-title" aria-label="Back">‹</button><div><div class="eyebrow">Step 1 of 3</div><h2>Choose a world to fight for</h2></div></div>
    <p class="hint">Lower-rank worlds give more Gift Points at the Awakening. Higher ranks bring tougher opponents.</p>
    <div class="picks">${cards}</div>
    <div class="foot"><button class="btn primary" data-act="world-ok" ${w ? '' : 'disabled'}>${w ? 'Fight for ' + esc(w.name) : 'Pick a world'}</button></div></main>`;
}

// ---------- Awakening ----------
// In Pending World the record and the System Offer come from the day's seed, and Echo unlocks don't count
function newAw(w, date) {
  return { record: date ? dailyRecord(date, w.type) : buildRecord(w.type, awRng('record')), tab: 'id', name: w.champ, sigil: Math.floor(Math.random() * 6), color: Math.floor(Math.random() * 6), stats: { STR: 2, AGI: 2, INT: 2, VIT: 2, LUK: 2 }, pts: 4, gifts: [WORLD_TYPES[w.type].gift], patron: null, cat: 'world',
    offer: date ? makeOffer(w, levelMeta(meta), seedRng(dailySeed(date) + ':offer')) : makeOffer(w, meta, awRng('offer')), title: null };
}
// Everything the System draws at an Awakening comes from a seed: the day's in Pending World, otherwise one drawn when
// the worlds are offered. Backing out to the worlds and returning, or asking the System again, gives the same record,
// Offer, Gift picks and stat roll, so they can't be fished for. A fresh set of worlds brings a fresh seed.
function awRng(tag) { return seedRng((ui.daily ? dailySeed(ui.daily.date) : 'aw:' + ui.seed + ':' + ui.world) + ':' + tag); }
// Any change to the System's Gift picks withdraws its bonus points
function sysOverruled(A) { if (!A.sysPts) return; A.sysPts = 0; toast('[You overruled the System. Its bonus Gift Points are withdrawn.]', 'loss'); }
function awMeta() { return ui.daily ? levelMeta(meta) : meta; }
function giftRow(k, a, w) {
  const g = GIFTS[k], on = a.gifts.includes(k), unlocked = giftUnlocked(k, awMeta());
  const cost = giftCost(k, a.offer), disc = cost !== g.cost;
  const t = on ? a.gifts.filter(x => x !== k) : a.gifts.concat(k);
  // Adding a Gift overrules the System, so it has to fit without the System's bonus points
  const can = unlocked && (on || giftCheck(w, t, a.patron, a.offer).ok);
  const c = g.cost < 0 ? `<span class="gcost neg">+${-g.cost}</span>` : `<span class="gcost ${disc ? 'disc' : ''}">${disc ? `<s>${g.cost}</s> ` : ''}${cost}</span>`;
  return `<button class="gift ${on ? 'on' : ''} ${unlocked ? '' : 'locked'}" data-act="aw-gift" data-k="${k}" ${can ? '' : 'disabled'}><span class="gf-h"><b>${unlocked ? '' : '🔒 '}${esc(g.name)}${disc ? ' <em class="offer">System Offer</em>' : ''}</b>${c}</span><span class="gf-d">${esc(unlocked ? g.desc : giftLockText(k))}</span></button>`;
}
function awakenHTML() {
  const a = ui.aw, w = ui.worlds[ui.world];
  const chk = giftCheck(w, a.gifts, a.patron, a.offer, a.sysPts);
  const tabs = [['id', 'Name'], ['stats', 'Stats' + (a.pts ? ` · ${a.pts}` : '')], ['gifts', `Gifts · ${chk.left}`], ['patron', 'Patron']];
  let body = '';
  if (a.tab === 'id') {
    body = `<label class="fld"><span>Champion's name</span><input id="aw-name" maxlength="18" value="${esc(a.name)}" autocomplete="off"></label>
      <div class="fld"><span>Sigil</span><div class="sigrow">${SIGILS.map((g, i) => `<button class="sigb ${a.sigil === i ? 'on' : ''}" data-act="aw-sigil" data-i="${i}" style="color:${SIGIL_COLS[a.color]}" aria-label="Sigil ${i + 1}">${g}</button>`).join('')}</div></div>
      <div class="fld"><span>Colour</span><div class="sigrow">${SIGIL_COLS.map((c, i) => `<button class="colb ${a.color === i ? 'on' : ''}" data-act="aw-color" data-i="${i}" style="background:${c}" aria-label="Colour ${i + 1}"></button>`).join('')}</div></div>
      <div class="aw-preview">${crest(a.name, 'me', true, { sigil: a.sigil, color: a.color })}<div><div class="ch-name">${esc(a.name || '…')} of ${esc(w.name)}</div><div class="ch-sub">Entrant of the Grand Tournament. This is how your champion appears in fights and in the Halls.</div></div></div>
      ${a.practice ? '' : `<p class="sh-p bio">${bioHTML(a.record, w.type, w.name)}</p><p class="sh-p sysl">[Filing world record: ${esc(w.name)}. ${a.record.ids.length} entries.]</p>`}`;
  } else if (a.tab === 'stats') {
    const roll = a.rolled ? `<div class="aw-roll"><span>[Rolled: ${ROLL_PTS} points placed. The System does not do refunds.]</span><button class="btn small ghost" data-act="aw-unroll">Place 4 myself</button></div>`
      : a.rollUsed || a.practice ? '' : `<div class="aw-roll"><span>Or let the System roll: <b>${ROLL_PTS} points</b> instead of 4, at random, one stat favoured. Once only.</span><button class="btn small" data-act="aw-roll">Roll</button></div>`;
    body = `<p class="sh-p">${a.pts ? `<b class="pts">${a.pts} point${a.pts > 1 ? 's' : ''} to place.</b> ` : ''}Skills draw power from the stat of their archetype. Reach 10 in a stat for a milestone perk.</p>${roll}` + STATS.map(k => `<div class="strow"><span class="st-k">${k}</span><span class="st-n">${STAT_INFO[k].name}<small>${STAT_INFO[k].short}</small></span>${a.rolled ? '<span></span>' : `<button class="btn small add" data-act="aw-stat" data-k="${k}" data-d="-1" ${a.stats[k] <= 2 ? 'disabled' : ''} aria-label="Remove a point">−</button>`}<span class="st-v">${a.stats[k]}</span>${a.rolled ? '<span></span>' : `<button class="btn small add" data-act="aw-stat" data-k="${k}" data-d="1" ${a.pts <= 0 ? 'disabled' : ''} aria-label="Add a point">+</button>`}</div>`).join('');
  } else if (a.tab === 'gifts') {
    const allowed = giftsAllowed(w);
    const list = allowed.filter(k => GIFTS[k].cat === a.cat).sort((x, y) => giftUnlocked(y, awMeta()) - giftUnlocked(x, awMeta())).map(k => giftRow(k, a, w)).join('');
    const presets = (meta.presets || []).map((p, i) => `<button class="btn small ghost" data-act="aw-preset" data-i="${i}">${esc(p.name)}</button>`).join('');
    body = `<div class="pts-row"><span><b>${chk.left}</b> of ${chk.budget} Gift Points${a.sysPts ? ` <em class="offer">+${a.sysPts} System</em>` : ''}</span><span class="fine">${chk.cheats}/1 cheat · ${chk.flaws}/2 flaws</span></div>
      <div class="aw-sys"><button class="btn small" data-act="aw-random">Let the System decide</button><span>${a.sysPts ? `[Bonus active: +${a.sysPts} Gift Points. Changing a Gift withdraws it.]` : `The System picks your Gifts and adds <b>${SYS_BONUS} Gift Points</b> while you keep its picks.`}</span></div>
      <div class="cats c8">${Object.keys(GIFT_CATS).map(c => { const n = a.gifts.filter(k => GIFTS[k].cat === c).length; return `<button class="cat ${a.cat === c ? 'on' : ''}" data-act="aw-cat" data-c="${c}">${GIFT_CATS[c]}${n ? ` · ${n}` : ''}</button>`; }).join('')}</div>
      <div class="glist">${list}</div>
      <div class="aw-tools"><button class="btn small ghost" data-act="aw-save">Save as preset</button>${presets}</div>
      <p class="sh-p fine">Unspent points become 3 gold each. Chosen: ${a.gifts.map(k => esc(GIFTS[k].name)).join(', ') || 'none'}.</p>`;
  } else {
    const titles = Object.keys(TITLES).filter(k => meta.titles[k]);
    body = `<p class="sh-p">Pledge to a god for 2 Favour with them; their wagers come up more often. Win wagers to reach 4 Favour (a free B-rank piece) and 8 (a blessing for the run).</p>` +
      Object.entries(GODS).map(([k, G]) => `<button class="gift ${a.patron === k ? 'on' : ''}" data-act="aw-patron" data-k="${k}"><span class="gf-h"><b>${esc(G.name)}</b></span><span class="gf-d">Archetypes: ${G.arch.map(x => ARCH[x].name).join(', ')}. Blessing: ${esc(G.blessing)}</span></button>`).join('') +
      `<button class="gift ${a.patron === 'none' ? 'on' : ''}" data-act="aw-patron" data-k="none"><span class="gf-h"><b>Faithless</b><span class="gcost neg">+2</span></span><span class="gf-d">No Patron. +2 Gift Points.</span></button>` +
      `<div class="fld"><span>Title</span></div>` + (titles.length ? titles.map(k => `<button class="gift ${a.title === k ? 'on' : ''}" data-act="aw-title" data-k="${k}"><span class="gf-h"><b>${esc(TITLES[k].name)}</b></span><span class="gf-d">${esc(TITLES[k].desc)}</span></button>`).join('') : '<p class="sh-p fine">No Titles yet. Earn them with feats in the arena; the System announces each one.</p>');
  }
  const ready = a.name.trim() && a.pts === 0 && a.patron && chk.ok;
  const why = !a.name.trim() ? 'Name your champion' : a.pts ? `Place ${a.pts} stat point${a.pts > 1 ? 's' : ''}` : !a.patron ? 'Choose a Patron' : !chk.ok ? 'Too many Gift Points' : 'Awaken';
  return `<main class="screen select awaken"><div class="sel-h"><button class="icon-btn" data-act="${ui.daily ? 'back-title' : 'back-worlds'}" aria-label="Back">‹</button><div><div class="eyebrow">${ui.daily ? 'Pending World' : 'Step 2 of 3'} · ${esc(w.name)}</div><h2>[Integration complete. Distributing Gifts.]</h2></div></div>
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="tab ${a.tab === k ? 'on' : ''}" data-act="aw-tab" data-t="${k}" role="tab">${l}</button>`).join('')}</div>
    <section class="aw-body sysw">${body}</section>
    <div class="foot"><button class="btn primary" data-act="aw-ok" ${ready ? '' : 'disabled'}>${why}</button></div></main>`;
}

// ---------- Draft ----------
function draftHTML() {
  const cards = run.draft.map(id => {
    const d = SKILLS[id], on = ui.draftSel.includes(id);
    return `<button class="scard ${on ? 'on' : ''} ${mainTag(id)}" data-act="draft-pick" data-id="${id}">
      <div class="sc-h"><span class="sc-name">${esc(d.name)}</span>${rk(d.rank)}</div>
      <div class="sc-meta">${tagNames(id)}${d.quick ? '<span class="tagn q">Quick</span>' : ''}</div>
      <div class="sc-desc">${esc(describe(d))}</div></button>`;
  }).join('');
  return `<main class="screen select"><div class="sel-h"><div><div class="eyebrow">Step 3 of 3 · Opening draft</div><h2>[Skill selection: choose 3]</h2></div></div>
    <p class="hint">This run's archetypes: ${run.arch.map(k => `<span class="tagn a-${k}">${ARCH[k].name}</span>`).join(' ')}. Only their pieces appear in the shop.</p>
    <div class="sgrid">${cards}</div>
    <div class="foot row2"><button class="btn" data-act="draft-reroll" ${run.rerolls > 0 ? '' : 'disabled'}>Reroll · ${run.rerolls} left</button><button class="btn primary" data-act="draft-ok" ${ui.draftSel.length === 3 ? '' : 'disabled'}>Confirm ${ui.draftSel.length}/3</button></div></main>`;
}

// ---------- Choose opponent ----------
function chooseHTML() {
  const cards = run.choices.map((spec, i) => `<button class="opp ${spec.hard ? 'hard' : ''}" data-act="pick-opp" data-i="${i}">
      ${specCrest(spec)}<div class="op-r"><div class="nx-k">${spec.kind === 'trial' ? KIND_LABEL.trial : spec.hard ? (spec.kind === 'erased' ? 'Erased · Hard' : 'Hard') : KIND_LABEL[spec.kind]}${rankTag(spec)}</div><div class="nx-name">${esc(specName(spec))}</div><div class="nx-style">${esc(styleOf(spec))}</div>${traitsHTML(spec)}
      <div class="op-meta"><span class="good">Win: ${esc(specReward(spec))}</span><span class="bad">Loss: −${heartCost(run, spec)} ♥</span></div></div></button>`).join('');
  const W = run.wager && WAGERS[run.wager.key], G = run.wager && GODS[run.wager.god];
  const wager = W ? `<section class="wager ${ui.wagerOn ? 'on' : ''}"><div class="wg-t"><span class="eyebrow">${esc(G.name)} offers a wager</span><b>${esc(W.text)}</b><small>Stake 5 gold. Win it: 10 gold back and +2 Favour.</small></div><button class="btn small ${ui.wagerOn ? 'primary' : ''}" data-act="wager" ${run.gold < 5 && !ui.wagerOn ? 'disabled' : ''}>${ui.wagerOn ? 'Accepted' : 'Accept'}</button></section>` : '';
  const fin = run.choices.length === 1;
  return `<main class="screen choose">${topBar()}<div class="col col-a">${bracketDots()}${champLine()}${questLine()}</div><div class="col col-b">
    <div class="sec-h"><span>${fin ? '[The Final Champion awaits]' : '[Choose your opponent]'}</span><span class="fine">+${run.lastIncome || 0}g income</span></div>
    <div class="opps">${cards}</div>${wager}</div>
    <footer class="foot2"><button class="btn ${run.statPts ? 'glow' : ''}" data-act="sheet" data-s="stats">Stats${run.statPts ? ` <span class="badge">${run.statPts}</span>` : ''}</button><span class="foot-hint">${fin ? 'Tap the Final Champion to face them' : 'Tap an opponent to face them'}</span></footer></main>`;
}

// ---------- Shop ----------
function shopIds() { ensureShop(run); const ids = new Set(); SHOP_KINDS.forEach(k => run.shop[k].forEach(it => it && ids.add(it.id))); if (run.bonusSlot) ids.add(run.bonusSlot.id); return ids; }
function pieceTile(p, act, extra, inShop) {
  const d = pieceDef(p.id), g = isGear(p.id);
  const marker = inShop && inShop.has(p.id) && p.star < 3 ? '<span class="inshop" title="A copy is in the shop">in shop</span>' : '';
  return `<button class="tile ${mainTag(p.id)} ${g ? 'gear' : ''} ${extra || ''} ${marker ? 'hasdup' : ''}" data-act="${act}" data-u="${p.u}">
    <span class="tl-h">${rk(effRank(p.id, p.mods))}${stars(p.star)}</span><span class="tl-n">${esc(d.name)}</span><span class="tl-f">${tagDots(p.id)}${pfxLine(p.mods)}</span>${marker}</button>`;
}
// Prefixes on a tile: one small line that gives way before the skill's name does
function pfxLine(mods) { return mods && mods.length ? `<em class="pfx tl-p">${esc(mods.map(m => PREFIXES[m].name).join(' '))}</em>` : '';
}
// How a shop item relates to what you own: copies at ★1, a ★2 already owned, and whether buying merges
function dupInfo(id) {
  const have = ownedCopies(run, id), need = mergeNeed(run, id);
  const star2 = allPieces(run).some(p => p.id === id && p.star === 2);
  return { have, need, star2, merge: have + 1 >= need, owned: have > 0 || star2 };
}
function pips(have, need) { let h = ''; for (let k = 0; k < need; k++) h += `<i class="${k < have ? 'on' : k === have ? 'nx' : ''}"></i>`; return `<span class="pips" aria-label="You own ${have} of ${need}">${h}</span>`; }
function shopItemTile(it, kind, i) {
  if (!it) return `<div class="tile empty">Sold</div>`;
  const d = pieceDef(it.id), D = dupInfo(it.id);
  const locked = kind !== 'bonus' && run.locks[kind][i];
  const tag = D.merge ? `<span class="mergetag">Merge ★2</span>` : D.have ? `<span class="owntag">Owned ×${D.have}</span>` : D.star2 ? `<span class="owntag">★2 owned</span>` : '';
  // Copies of pieces you own need no reading: they get a one-tap Buy over the price. Everything else opens its details first.
  const quick = D.owned && canBuy(run, it) ? `<button class="qbuy" data-act="quick-buy" data-k="${kind}" data-i="${i}" aria-label="Buy ${esc(d.name)} for ${price(run, it)} gold">Buy ${price(run, it)}g</button>` : '';
  return `<div class="tw">${quick}<button class="tile shopt ${mainTag(it.id)} ${isGear(it.id) ? 'gear' : ''} ${kind === 'bonus' ? 'bonus' : ''} ${locked ? 'locked' : ''} ${D.merge ? 'merge' : D.owned ? 'owned' : ''}" data-act="shop-item" data-k="${kind}" data-i="${i}">
    ${tag}<span class="tl-h">${rk(effRank(it.id, it.mods))}<span class="price">${price(run, it)}g</span></span><span class="tl-n">${esc(d.name)}</span>
    <span class="tl-fx">${esc(shortFx(it.id, it.mods))}</span><span class="tl-f">${tagDots(it.id)}${pfxLine(it.mods)}${D.owned || D.merge ? pips(D.have, D.need) : ''}${locked ? '<span class="lk">🔒</span>' : ''}${isGear(it.id) ? `<span class="slt">${GEAR[it.id].slot}</span>` : ''}</span></button></div>`;
}
function shortFx(id, mods) {
  if (isGear(id)) return gearText(id, 1);
  const def = moddedDef(id, mods); return previewSkill(null, { def, power: skillPower(def, effStats(run), 1) * def.powerMult });
}
function tabBadge(kind) {
  ensureShop(run);
  const items = run.shop[kind].concat(run.bonusSlot && (isGear(run.bonusSlot.id) ? 'gear' : 'skill') === kind ? [run.bonusSlot] : []).filter(Boolean);
  const merges = items.filter(it => dupInfo(it.id).merge).length, owned = items.filter(it => dupInfo(it.id).owned).length;
  return merges ? `<span class="tb merge">${merges} merge</span>` : owned ? `<span class="tb">${owned} owned</span>` : '';
}
function shopHTML() {
  ensureShop(run);
  const counts = runCounts(run), tab = ui.shopTab || 'skill';
  const bonusHere = run.bonusSlot && (isGear(run.bonusSlot.id) ? 'gear' : 'skill') === tab;
  const xpTile = `<button class="tile xptile" data-act="buy-xp" ${run.gold < 4 || run.level >= 9 ? 'disabled' : ''}><span class="tl-h"><b>Lv ${run.level}</b><span class="price">4g</span></span><span class="tl-n">Buy 4 XP</span><span class="xp wide"><i style="width:${run.level >= 9 ? 100 : run.xp / xpNeed(run.level) * 100}%"></i></span></button>`;
  const items = run.shop[tab].map((it, i) => shopItemTile(it, tab, i)).join('') + (bonusHere ? shopItemTile(run.bonusSlot, 'bonus', 0) : xpTile);
  const odds = oddsFor(run).map((v, i) => v ? `${['E', 'D', 'C', 'B', 'A'][i]} ${v}%` : '').filter(Boolean).join(' · ');
  const inShop = shopIds();
  const bar = run.bar.map((p, i) => p ? pieceTile(p, 'own', '', inShop) : `<div class="tile empty">Skill ${i + 1}</div>`).join('');
  const gear = GEAR_SLOTS.map(sl => run.gear[sl] ? pieceTile(run.gear[sl], 'own', '', inShop) : `<div class="tile empty gear">${sl}</div>`).join('');
  const bench = run.bench.map(p => pieceTile(p, 'own', 'sm', inShop)).join('') + '<div class="tile empty sm"></div>'.repeat(Math.max(0, 8 - run.bench.length));
  // Loot can overfill the bench. It then squeezes into two rows so Fight stays on screen, and Fight waits until it's back to 8.
  const over = benchOver(), cols = over ? Math.ceil(run.bench.length / 2) : 4;
  const rc = rerollCost(run);
  return `<main class="screen shop">${topBar(roundLabel() + ' · Shop')}
    <div class="col col-a">${archChips(counts)}
    <div class="shoptabs" role="tablist"><button class="stab ${tab === 'skill' ? 'on' : ''}" data-act="shop-tab" data-k="skill" role="tab">Skills ${tabBadge('skill')}</button><button class="stab ${tab === 'gear' ? 'on' : ''}" data-act="shop-tab" data-k="gear" role="tab">Gear ${tabBadge('gear')}</button><button class="btn small" data-act="reroll" ${run.gold < rc ? 'disabled' : ''}>Reroll ${tab === 'skill' ? 'skills' : 'gear'} · ${rc ? rc + 'g' : 'free'}</button></div>
    <div class="shopgrid">${items}</div>
    <div class="shopctl"><span class="fine">${odds}</span>${bonusHere ? `<button class="btn small" data-act="buy-xp" ${run.gold < 4 || run.level >= 9 ? 'disabled' : ''}>XP +4 · 4g</button>` : ''}<span class="interest">Interest +${Math.min(interestCap(run), Math.floor(run.gold / 10))}g</span></div>
    </div><div class="col col-b"><div class="sec-h"><span>Skill bar</span><span class="fine">Gear</span></div>
    <div class="build"><div class="barrow c${run.slots}">${bar}</div><div class="gearrow">${gear}</div></div>
    <div class="sec-h"><span${over ? ' class="bad"' : ''}>Bench ${run.bench.length}/8</span><span class="fine">Tap to equip, swap or sell</span></div>
    <div class="bench${over ? ' over' : ''}" style="--bench-cols: ${cols}">${bench}</div></div>
    <footer class="foot2"><button class="btn ${run.statPts ? 'glow' : ''}" data-act="sheet" data-s="stats">Stats${run.statPts ? ` <span class="badge">${run.statPts}</span>` : ''}</button>${over ? `<span class="foot-hint bad">Sell ${over} to continue</span>` : '<button class="btn primary fight" data-act="shop-done">Fight ›</button>'}</footer></main>`;
}
// Pieces over the bench's 8, from loot that arrived while it was full
function benchOver() { return Math.max(0, run.bench.length - 8);
}

// ---------- District ----------
const DIST_GLYPH = { infirmary: '+', sanctum: '♥', undercity: '!', scout: '?', enchanter: 'E' };
// Infirmary at full HP would do nothing. Core no longer offers it; this hides it in runs saved before, unless it's the only district left
function distFull(k) { return k === 'infirmary' && run.hp >= maxHp(run) && run.districts.length > 1; }
// A district your stats upgrade says so with the stat's tag; what the upgrade does is told after the visit, except where it is the visit itself
function districtDesc(k) {
  if (!districtUp(run, k)) return DISTRICTS[k].desc;
  const tag = `[${DISTRICT_STAT[k]} ${STAT_EASY}] `;
  return tag + ({ infirmary: `Restore ${run.world.mod === 'famine' ? 40 : 65}% of your max HP.`, enchanter: 'Carve a prefix into one of your skills, from 4.' }[k] || DISTRICTS[k].desc);
}
function districtHTML() {
  const spec = currentSpec(run), done = run.stage !== 'district';
  const opts = (done ? (ui.distDone ? [ui.distDone] : []) : run.districts.filter(k => !distFull(k))).map(k => `<button class="opt ${done ? 'used' : ''}" data-act="district" data-k="${k}" ${done ? 'disabled' : ''}><span class="og">${DIST_GLYPH[k]}</span><span class="ot"><b>${DISTRICTS[k].name}</b><small>${done ? 'Done' : esc(districtDesc(k))}${k === 'infirmary' && !done ? ` (${n0(run.hp)}/${maxHp(run)} HP)` : ''}${k === 'sanctum' && !done ? ` (${run.hearts}/${run.maxHearts})` : ''}</small></span></button>`).join('');
  return `<main class="screen district">${topBar(roundLabel() + ' · District')}<div class="col col-a">${champLine()}
    <section class="next">${specCrest(spec)}<div class="nx-r"><div class="nx-k">${run.elite ? 'Elite bracket' : 'Next match'} · ${KIND_LABEL[spec.kind]}${spec.hard ? ' · Hard' : ''}${rankTag(spec)}</div><div class="nx-name">${esc(specName(spec))}</div><div class="nx-style">${esc(styleOf(spec))}</div>${run.scouted || hasGift(run, 'appraisal') ? scoutLine(spec) : ''}${run.wagerOn && run.wager ? `<div class="nx-wager">Wager: ${esc(WAGERS[run.wager.key].text)}</div>` : ''}</div></section>
    </div><div class="col col-b"><div class="sec-h"><span>${done ? '[District visited]' : '[Visit one district]'}</span></div>
    <section class="inter">${opts}</section>
    <section class="minibar c${run.slots}">${run.bar.map(p => p ? `<button class="mb ${mainTag(p.id)}" data-act="own" data-u="${p.u}"><span>${esc(SKILLS[p.id].name)}</span><small>${effRank(p.id, p.mods)}${p.star > 1 ? ' ' + '★'.repeat(p.star) : ''}${p.mods.length ? ' · ' + p.mods.map(m => PREFIXES[m].name).join(' ') : ''}</small></button>` : '<div class="mb empty"><span>Empty</span></div>').join('')}</section></div>
    <footer class="foot2"><button class="btn ${run.statPts ? 'glow' : ''}" data-act="sheet" data-s="stats">Stats${run.statPts ? ` <span class="badge">${run.statPts}</span>` : ''}</button><span class="foot-hint">Pick one, then shop</span></footer></main>`;
}
function scoutLine(spec) {
  if (spec.snap) return `<div class="nx-scout">Skills: ${spec.snap.bar.map(s => esc(modName(s.id, s.mods)) + (s.star > 1 ? ' ' + '★'.repeat(s.star) : '')).join(', ') || 'Attack only'}</div>`;
  return `<div class="nx-scout">Skills: ${ENEMIES[spec.id].skills.map(s => esc(s.n)).join(', ')}</div>`;
}

// ---------- Fight ----------
function fightHTML() {
  const f = ui.fight;
  const sig = f.spec.snap ? { sigil: f.spec.snap.sigil, color: f.spec.snap.color } : null;
  return `<main class="screen fight">${topBar(roundLabel(), `<button class="icon-btn spd ${ui.speed > 1 ? 'on' : ''}" data-act="speed-cycle" aria-label="Fight speed ${ui.speed}×. Tap to change">${ui.speed}×</button><button class="icon-btn ${ui.info ? 'on' : ''}" data-act="info" aria-label="Skill details mode">?</button>`, true)}
    <div class="col col-a"><section class="foe" id="foe">${crest(f.B.name, f.spec.hard && f.spec.kind !== 'erased' ? f.spec.kind + ' hard' : f.spec.kind, false, sig)}<div class="fo-r"><div class="fo-h"><span class="fo-name">${esc(f.B.name)}</span><span class="fo-hp" id="hpB"></span></div>
      <div class="bar foe-bar"><i id="hbB"></i><b id="bkB"></b></div><div class="chips" id="stB"></div></div>
      <div class="intent" id="intent"></div><div class="floats" id="flB"></div></section>
    <section class="log" id="log" aria-live="polite"></section></div><div class="col col-b">
    <section class="me" id="me"><div class="me-h"><span class="me-name">${crest(run.name, 'me tiny', false, { sigil: run.sigil, color: run.color })}${esc(run.name)}${run.path ? ' · ' + esc(ARCH[run.path].path) : ''}</span><span class="me-hp" id="hpA"></span></div>
      <div class="bar hp-bar"><i id="hbA"></i><b id="bkA"></b></div><div class="chips" id="stA"></div><div class="floats" id="flA"></div></section>
    <section class="skills c${run.slots}" id="skills"></section></div></main>`;
}
function chipsHTML(X, f) {
  const c = [];
  if (!X.isPlayer && f.spec && f.spec.traits) f.spec.traits.forEach(k => TRAIT_POOL[k] && c.push(`<span class="chip trait">${esc(TRAIT_POOL[k].name)}</span>`));
  if (X.block > 0) c.push(`<span class="chip block">Block ${n0(X.block)}</span>`);
  if (X.burn > 0) c.push(`<span class="chip burn">Burn ${n0(X.burn)}</span>`);
  if (X.poison > 0) c.push(`<span class="chip poison">Poison ${n0(X.poison)}</span>`);
  if (X.bleed > 0) c.push(`<span class="chip bleed">Bleed ${n0(X.bleed)}</span>`);
  if (X.weaken > 0) c.push(`<span class="chip weaken">Weak ${X.weaken}</span>`);
  if (X.marked > 0) c.push(`<span class="chip mark">Marked ${X.marked}</span>`);
  if (X.brokenT > 0) c.push(`<span class="chip stun">Broken</span>`);
  if (X.empower > 0) c.push(`<span class="chip power">Power ${X.empower}</span>`);
  if (X.evade > 0) c.push(`<span class="chip evade">Evade ${X.evade}</span>`);
  const th = (X.thorns || 0) + (X.P.thornsAlways ? X.P.thornsAlways * (X.hp < X.maxHp / 2 ? 2 : 1) : 0);
  if (th > 0) c.push(`<span class="chip thorns">Thorns ${n0(th)}</span>`);
  if (X.doomT > 0) c.push(`<span class="chip doom">Doom ${n0(X.doom)} in ${X.doomT}</span>`);
  if (X.leechT > 0) c.push(`<span class="chip poison">Leech ${X.leechT}</span>`);
  if (X.regenT > 0) c.push(`<span class="chip regen">Regen ${X.regenT}</span>`);
  if (X.focus) c.push(`<span class="chip power">Focus</span>`);
  if (X.stun > 0) c.push(`<span class="chip stun">Stunned</span>`);
  if (X.enrage && X.hp / X.maxHp <= X.enrage) c.push(`<span class="chip burn">Enraged</span>`);
  if (X.revive) c.push(`<span class="chip evade">Will rise</span>`);
  if (X.isPlayer && run.wagerOn && run.wager) c.push(`<span class="chip wagerc">Wager: ${esc(WAGERS[run.wager.key].text)}</span>`);
  return c.join('');
}
function updateFight() {
  const f = ui.fight; if (!f) return;
  [['A', f.A], ['B', f.B]].forEach(([k, X]) => {
    const hp = document.getElementById('hp' + k); if (!hp) return;
    hp.textContent = `${n0(X.hp)} / ${X.maxHp}`;
    document.getElementById('hb' + k).style.width = Math.max(0, X.hp / X.maxHp * 100) + '%';
    document.getElementById('bk' + k).style.width = Math.min(100, X.block / X.maxHp * 100) + '%';
    document.getElementById('st' + k).innerHTML = chipsHTML(X, f);
  });
  const it = document.getElementById('intent');
  if (it) {
    if (f.over) it.innerHTML = '';
    else { const i = intentInfo(f); it.className = 'intent k-' + i.kind; it.innerHTML = `<span class="in-l">Next</span><span class="in-t">${esc(i.label || i.name)}${i.then ? `<small>then ${esc(i.then)}</small>` : ''}</span><span class="in-v">${esc(i.text)}</span>`; }
  }
  const lg = document.getElementById('log');
  const rr = ui.busy ? [] : rivalReplies(run, f);
  if (lg) lg.innerHTML = skylineSVG() + '<div class="log-t">' + f.log.slice(-4).map((l, i, a) => `<p class="t-${l.t} ${i === a.length - 1 ? 'new' : ''}">${esc(l.text)}</p>`).join('') + '</div>'
    + (rr.length ? `<div class="replies">${rr.map(i => `<button class="reply" data-act="reply" data-i="${i}"><span class="chk-tag">${esc(checkTag(RIVAL_REPLIES[i].check))}</span> ${esc(RIVAL_REPLIES[i].label)}</button>`).join('')}</div>` : '');
  const sk = document.getElementById('skills');
  if (sk) {
    const can = f.phase === 'player' && !ui.busy && !f.over;
    const btn = (s, i, wide) => {
      const d = s.def, cd = s.cd > 0, prev = previewSkill(f, s);
      const tag = d.basic ? '' : 'a-' + (d.tags[0] || '');
      return `<button class="sk ${wide ? 'wide' : ''} ${tag} ${cd ? 'cd' : ''} ${d.quick ? 'quick' : ''}" data-act="use" data-i="${i}" data-key="${i || run.slots + 1}" ${(!can || cd) && !ui.info ? 'disabled' : ''}>
        <span class="sk-h"><span class="sk-name">${esc(d.name)}</span>${d.quick ? '<span class="sk-q">Quick</span>' : ''}${s.star > 1 ? `<span class="sk-lv">${'★'.repeat(s.star)}</span>` : ''}</span>
        ${s.mods && s.mods.length ? `<span class="mods">${s.mods.map(m => esc(PREFIXES[m].name)).join(' · ')}</span>` : ''}<span class="sk-fx">${esc(prev)}</span>${cd ? `<span class="sk-cd">${s.cd}</span>` : ''}</button>`;
    };
    const list = f.A.skills.slice(1).map((s, i) => btn(s, i + 1));
    while (list.length < run.slots) list.push('<div class="sk empty">Empty slot</div>');
    sk.innerHTML = list.join('') + btn(f.A.skills[0], 0, true);
  }
}
function floatAt(side, text, cls) {
  const host = document.getElementById('fl' + side); if (!host || host.children.length > 8) return;
  const el = document.createElement('span'); el.className = 'fl ' + cls; el.textContent = text;
  el.style.left = (18 + Math.random() * 60) + '%'; host.appendChild(el); setTimeout(() => el.remove(), 1000);
}
function shake(side) { const el = document.getElementById(side === 'A' ? 'me' : 'foe'); if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function playEvents(f) {
  let d = 0;
  f.events.forEach(e => {
    const at = d;
    if (e.k === 'hit') { setTimeout(() => { if (e.amt > 0) { floatAt(e.side, (e.crit ? 'Crit ' : '') + e.amt, e.crit ? 'crit' : e.tag === 'flare' ? 'burn' : e.thorns ? 'thorns' : 'dmg'); if (e.amt >= f[e.side].maxHp * 0.12) shake(e.side); } else if (e.blocked > 0) floatAt(e.side, 'Blocked ' + e.blocked, 'blk'); }, at); d += 120; }
    else if (e.k === 'dot' && e.amt > 0) { setTimeout(() => floatAt(e.side, e.amt, e.kind), at); d += 90; }
    else if (e.k === 'heal') { setTimeout(() => floatAt(e.side, '+' + e.amt, 'heal'), at); d += 90; }
    else if (e.k === 'miss') { setTimeout(() => floatAt(e.side, e.text, 'blk'), at); d += 90; }
    else if (e.k === 'reaction') { setTimeout(() => floatAt(e.side, e.name + '!', 'react'), at); d += 160; }
    else if (e.k === 'phase') { setTimeout(() => { floatAt(e.side, 'Phase 2', 'react'); shake(e.side); }, at); d += 200; }
  });
  f.events = [];
}
function say2(f, text, t) { f.log.push({ text, t }); if (f.log.length > 40) f.log.shift(); }
function summarize(f, side) {
  const evs = f.events; let used = null, dmg = 0, blocked = 0, crit = false, heals = 0, missed = false;
  evs.forEach(e => { if (e.k === 'use' && e.side === side) used = e.name; if (e.k === 'hit' && e.side !== side && !e.thorns) { dmg += e.amt; blocked += e.blocked; crit = crit || e.crit; } if (e.k === 'heal' && e.side === side) heals += e.amt; if (e.k === 'miss' && e.side !== side) missed = true; });
  if (!used) return;
  const who = side === 'A' ? 'You' : f[side].name;
  let t = `${who} ${side === 'A' ? 'use' : 'uses'} ${used}`;
  const bits = [];
  if (dmg) bits.push(`${dmg} damage${crit ? ' (critical)' : ''}`);
  if (blocked) bits.push(`${blocked} blocked`);
  if (missed && !dmg) bits.push('missed');
  if (heals) bits.push(`healed ${heals}`);
  if (bits.length) t += ': ' + bits.join(', ');
  // engine log lines for this action go after the summary
  say2(f, t + '.', side === 'A' ? 'me' : 'foe');
}
function startFightUI() {
  ui.fight = newFight(run);
  ui.busy = false; ui.screen = 'fight'; ui.sheet = null;
  clearToasts(); // shop toasts don't carry into the fight
  const f = ui.fight;
  say2(f, `[${f.B.name} enters the arena.]`, 'sys');
  const intro = rankIntro(run, meta, f.spec, f.B.name);
  intro.forEach(l => say2(f, l.text, l.t));
  if (!run.elite && run.round === 1) say2(f, '[Tutorial] [Please attempt not to die during the tutorial. It is embarrassing for everyone.]', 'sys');
  if (f.spec.kind === 'erased') say2(f, f.spec.snap.rec ? `[The System has returned a champion of an erased world. They remember: "${recFragment(f.spec.snap.rec, f.spec.snap.worldType)}."]` : '[The System has returned a champion of an erased world. They remember you.]', 'loss');
  if (f.spec.kind === 'final') say2(f, `[The Final Champion of ${run.world.name}'s judgement. Win, and your world is spared.]`, 'sys');
  if (f.spec.id === 'undefeated' && !intro.some(l => l.replaces === 'sealed')) say2(f, '[Entrant record for the Undefeated: ERROR. Record sealed.]', 'loss');
  render(); playEvents(f); updateFight();
}
const wait = ms => new Promise(r => setTimeout(r, ms / ui.speed));
async function onUse(i) {
  const f = ui.fight; if (!f || ui.busy || f.phase !== 'player') return;
  const s = f.A.skills[i];
  if (ui.info) { ui.sheet = { type: 'skillinfo', i }; return render(); }
  if (!canUse(s)) return;
  ui.busy = true; f.replied = true;
  const before = f.log.length;
  playerAct(f, i);
  const engine = f.log.splice(before); summarize(f, 'A'); engine.forEach(l => f.log.push(l)); playEvents(f);
  if (s.def.quick && !f.over) { ui.busy = false; updateFight(); return; }
  updateFight();
  await wait(f.over ? 300 : 650);
  while (!f.over) {
    const b2 = f.log.length;
    enemyTurn(f);
    const eng = f.log.splice(b2); summarize(f, 'B'); eng.forEach(l => f.log.push(l)); playEvents(f); updateFight();
    if (f.over) break;
    if (f.phase === 'stunned') { await wait(800); skipPlayer(f); updateFight(); await wait(500); continue; }
    break;
  }
  ui.busy = false; updateFight();
  if (f.over) { await wait(700); finishFight(); }
}
function finishFight() {
  const f = ui.fight;
  const res = resolveFight(run, f, run.practice ? META : meta);
  // An ordinary win goes straight on: the reward shows as a notice instead of a sheet. Losses and run endings keep theirs.
  const plain = res.won && !res.rewind && !res.death && !res.spared && !res.eliteOver && !res.practiceDone;
  if (plain) res.msgs.unshift({ t: 'win', text: `[Victory. +${res.gold} gold, healed 30%.]` });
  pushMsgs(res.msgs);
  ui.result = res; ui.erDone = 0; ui.erBusy = false;
  if (res.practiceDone) { ui.practiceAfter = true; }
  if (res.rested) { meta.echoes += 3; res.msgs.push({ t: 'broadcast', text: `[You laid ${res.rested.champ} to rest. +3 Echoes.${canShare() ? ` ${ownerName(res.rested.owner)} will hear of it.` : ''}]` }); toast(res.msgs[res.msgs.length - 1].text, 'broadcast'); recordRest(res.rested); }
  if (res.fell) recordWin(res.fell);
  if (res.death) { const out = endRun(run, meta, 'erased'); recordRunStats('erased'); ui.end = { kind: 'erased', echoes: out.echoes, snap: out.snap, res, rp: out.rp, opened: out.trial, observed: finishDaily(false) }; lsDel(RUN_KEY); }
  else if (res.spared) { const out = endRun(run, meta, 'spared'); recordRunStats('spared'); run._snapAt = out.snap.at; run.ended = false; ui.end = { kind: 'spared', echoes: out.echoes, snap: out.snap }; }
  else if (res.eliteOver) { ui.end = { kind: res.eliteCleared ? 'elite-clear' : 'elite-fall', echoes: 8 * run.eliteWins }; }
  saveMeta(); if (!res.death) saveRun();
  if (plain) {
    // tutorial steps that wait on the fight screen are over once it closes
    while (coachStep() && coachStep().scr === 'fight') coachAdvance();
    ui.fight = null; ui.result = null; return go(stageScreen());
  }
  ui.sheet = { type: 'result' };
  render();
}

// ---------- Sheets ----------
function sheetWrap(title, body, foot, cls, noClose) {
  return `<div class="sheet-bg"><section class="sheet ${cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="sh-h"><h3>${esc(title)}</h3>${foot === false || noClose ? '' : '<button class="icon-btn" data-act="close" aria-label="Close">×</button>'}</header><div class="sh-b">${body}</div>${foot && foot !== false ? `<footer class="sh-f">${foot}</footer>` : ''}</section></div>`;
}
function pieceBody(id, star, mods, power) {
  star = star || 1; mods = mods || [];
  if (isGear(id)) {
    const g = GEAR[id];
    return `<div class="srow ${mainTag(id)}"><div class="sr-h"><span class="sr-name">${esc(g.name)}</span>${stars(star)}${rk(g.rank)}</div><div class="sr-meta">${tagNames(id)}<span class="tagn">${g.slot}</span></div>
      <div class="sr-desc"><b>${Object.entries(gearStats(id, star)).map(([k, v]) => `+${v} ${k}`).join(', ')}.</b> ${esc(gearText(id, star))}</div>${star < 3 ? `<div class="sr-next">At ★${star + 1}: ${esc(gearText(id, star + 1))}</div>` : ''}</div>`;
  }
  const d = moddedDef(id, mods);
  const p = power || skillPower(d, effStats(run), star) * d.powerMult;
  return `<div class="srow ${mainTag(id)}"><div class="sr-h"><span class="sr-name">${mods.length ? `<em class="pfx">${esc(mods.map(m => PREFIXES[m].name).join(' '))}</em> ` : ''}${esc(d.name)}</span>${stars(star)}${rk(effRank(id, mods))}</div>
    <div class="sr-meta">${tagNames(id)}${d.quick ? '<span class="tagn q">Quick</span>' : ''}<span class="tagn">${d.cd ? d.cd + '-turn cooldown' : 'no cooldown'}</span></div><div class="sr-desc">${esc(describe(d, p))}</div>
    ${star === 2 && SKILLS[id].evo ? `<div class="sr-next">At ★3 it evolves into ${SKILLS[id].evo.map(e => esc(SKILLS[e].name)).join(' or ')}.</div>` : star === 1 ? '<div class="sr-next">3 copies merge into ★2: +50% power.</div>' : ''}</div>`;
}
function pieceSheet() {
  const S = ui.sheet;
  if (S.shop != null) {
    const it = shopItem(run, S.shop, S.i); if (!it) { ui.sheet = null; return ''; }
    const D = dupInfo(it.id), have = D.have, need = D.need;
    const where = allPieces(run).filter(p => p.id === it.id).map(p => { const f = findPiece(run, p.u); return (f.at === 'bench' ? 'bench' : f.at === 'bar' ? 'skill bar' : 'equipped') + (p.star > 1 ? ' ★' + p.star : ''); });
    const note = D.owned ? `<div class="dupbox ${D.merge ? 'merge' : ''}">${pips(have, need)}<p>${D.merge ? `<b>Buying this merges your copies into ★2</b> (+50% power${isGear(it.id) ? ', stronger passive' : ''}).` : have ? `You own ${have} of ${need}. ${need - have - 1} more after this one for ★2.` : 'You already own this at ★2. Three more ★1 copies make another ★2, and three ★2 make ★3.'}</p><p class="fine">Yours: ${where.join(', ')}</p></div>` : '';
    const full = run.bench.length >= 8 && !wouldMerge(run, it.id) && !(isGear(it.id) ? !run.gear[GEAR[it.id].slot] : run.bar.includes(null));
    const pr = price(run, it);
    return sheetWrap(S.shop === 'bonus' ? 'System reward slot' : S.shop === 'gear' ? 'Gear shop' : 'Skill shop', pieceBody(it.id, 1, it.mods) + note + (full ? '<p class="sh-p bad">Your bench is full. Sell something first.</p>' : ''),
      `${S.shop !== 'bonus' ? `<button class="btn ghost" data-act="lock" data-k="${S.shop}" data-i="${S.i}">${run.locks[S.shop][S.i] ? 'Unlock' : 'Lock'}</button>` : ''}<button class="btn primary" data-act="buy" data-k="${S.shop}" data-i="${S.i}" ${canBuy(run, it) ? '' : 'disabled'}>${D.merge ? 'Buy and merge' : 'Buy'} · ${pr}g</button>`);
  }
  const f = findPiece(run, S.u); if (!f) { ui.sheet = null; return ''; }
  const p = f.p, g = isGear(p.id);
  const acts = [];
  if (f.at === 'bench') {
    if (g) { const cur = run.gear[GEAR[p.id].slot]; acts.push(`<button class="btn" data-act="move" data-u="${p.u}" data-to="gear">${cur ? 'Swap with ' + esc(GEAR[cur.id].name) : 'Equip'}</button>`); }
    else {
      const e = run.bar.indexOf(null);
      if (e >= 0) acts.push(`<button class="btn" data-act="move" data-u="${p.u}" data-to="bar" data-i="${e}">Equip</button>`);
      else run.bar.forEach((b, i) => acts.push(`<button class="btn small" data-act="move" data-u="${p.u}" data-to="bar" data-i="${i}">Replace ${esc(SKILLS[b.id].name)}</button>`));
    }
  } else if (run.bench.length < 8) acts.push(`<button class="btn" data-act="move" data-u="${p.u}" data-to="bench">Move to bench</button>`);
  if (f.at === 'bar') run.bar.forEach((b, i) => { if (i !== f.i) acts.push(`<button class="btn small ghost" data-act="move" data-u="${p.u}" data-to="bar" data-i="${i}">To slot ${i + 1}</button>`); });
  const where = f.at === 'bench' ? 'On your bench' : f.at === 'bar' ? `Skill slot ${f.i + 1}` : 'Equipped';
  const canSell = ui.screen === 'shop';
  return sheetWrap(where, pieceBody(p.id, p.star, p.mods) + (acts.length && ui.screen === 'shop' ? `<div class="acts">${acts.join('')}</div>` : ui.screen !== 'shop' ? '<p class="sh-p fine">Equip, swap and sell in the shop.</p>' : ''),
    canSell ? `<button class="btn ghost danger-t" data-act="sell" data-u="${p.u}">Sell · ${sellValue(p)}g</button><button class="btn primary" data-act="close">Done</button>` : `<button class="btn primary" data-act="close">Done</button>`);
}
// The first time a stat line is offered, the System says so once
function statLinesNotice() {
  const p = run.pending[0]; if (meta.statLines || run.practice || !p || p.type !== 'event' || !eventOpts(run, p.key).some(i => EVENTS[p.key].opts[i].check)) return;
  meta.statLines = true; saveMeta(); setTimeout(() => toast('[Attribute dialogue unlocked. Your build has opinions now.]', 'class'), 300);
}
function pendingSheet() {
  const p = run.pending[0]; if (!p) return '';
  if (p.type === 'event') {
    const E = EVENTS[p.key]; if (!E) { run.pending.shift(); return ''; }
    const chainTag = E.chain && CHAINS[E.chain].start !== p.key ? `<p class="sh-p fine">[Event chain: ${esc(CHAINS[E.chain].name)}]</p>` : '';
    return sheetWrap(E.title, `${chainTag}<p class="sh-p big">${esc(eventText(run, p.key))}</p>` + E.opts.map((_, i) => { const o = eventOpt(run, p.key, i); return o ? `<button class="choice ${o.check ? 'chk' : ''}" data-act="event" data-i="${i}"><div class="sr-h"><span class="sr-name">${o.check ? `<span class="chk-tag">${esc(checkTag(o.check))}</span> ` : ''}${esc(o.label)}</span></div><div class="sr-desc">${esc(o.desc)}</div></button>` : ''; }).join(''), false, E.chain ? 'sys' : '');
  }
  if (p.type === 'gift') {
    return sheetWrap('[Additional Gift]', `<p class="sh-p">[Milestone reached. The System grants one more Gift. Choose 1.]</p>` + p.offers.map(k => `<button class="choice" data-act="take-gift" data-k="${k}"><div class="sr-h"><span class="sr-name">${esc(GIFTS[k].name)}</span><span class="tagn">${GIFTS[k].arch ? 'Affinity' : GIFT_CATS[GIFTS[k].cat]}</span></div><div class="sr-desc">${esc(GIFTS[k].desc)}</div></button>`).join(''), false, 'sys');
  }
  if (p.type === 'perk') {
    return sheetWrap(`[Class advancement · ${p.to}-rank]`, `<p class="sh-p">[Promotion recorded. Choose 1 permanent perk. It applies from your next world, but never in the Pending World.]</p>` + p.offers.map(k => `<button class="choice" data-act="take-perk" data-k="${k}"><div class="sr-h"><span class="sr-name">${esc(PERKS[k].name)}</span><span class="tagn">Perk</span></div><div class="sr-desc">${esc(PERKS[k].desc)} <i class="fine">${esc(PERKS[k].flavour)}</i></div></button>`).join(''), false, 'sys');
  }
  if (p.type === 'rune') return enchantSheet(p.mods, 'rune');
  if (p.type === 'evo') {
    const f = findPiece(run, p.u); if (!f) { run.pending.shift(); return ''; }
    const d = SKILLS[f.p.id];
    return sheetWrap(`[Evolution · ${d.name} ★3]`, `<p class="sh-p">${esc(d.name)} has reached ★3. Choose what it becomes.</p>` + d.evo.map(e => `<button class="choice ${mainTag(e)}" data-act="evolve" data-id="${e}">${pieceBody(e, 3, f.p.mods.filter(m => prefixOk(e, m, [])))}</button>`).join(''), false, 'evo');
  }
  return '';
}
function enchantSheet(mods, from) {
  const sel = ui.enchantSel;
  if (sel == null) {
    const body = `<p class="sh-p">${from === 'rune' ? 'The System offers a rune. ' : ''}Pick a prefix, then the skill to carve it into. A skill holds up to ${MAX_MODS}; a third replaces its oldest. Each prefix raises the skill's rank.</p>` + mods.map((m, i) => prefixTargets(run, m).length ? `<button class="choice" data-act="ench-mod" data-i="${i}"><div class="sr-h"><span class="sr-name"><em class="pfx">${esc(PREFIXES[m].name)}</em></span></div><div class="sr-desc">${esc(PREFIXES[m].desc)}</div></button>` : '').join('');
    return sheetWrap(from === 'rune' ? '[Rune · Choose a prefix]' : 'Enchanter', body, `<button class="btn ghost" data-act="ench-skip">${from === 'rune' ? 'Discard the rune' : 'Leave'}</button>`, 'sys', true);
  }
  const m = mods[sel];
  const list = prefixTargets(run, m).map(t => { const f = findPiece(run, t.u); return `<button class="choice ${mainTag(t.id)}" data-act="ench-apply" data-u="${t.u}">${pieceBody(t.id, f.p.star, t.mods.concat(m).slice(-MAX_MODS))}<div class="sr-next">${f.at === 'bench' ? 'On your bench' : 'On your bar'}${t.mods.length >= MAX_MODS ? ' · replaces ' + PREFIXES[t.mods[0]].name : ''}</div></button>`; }).join('');
  return sheetWrap(`Carve ${PREFIXES[m].name} into…`, list, `<button class="btn ghost" data-act="ench-back">Back</button>`, 'sys', true);
}
function recapHTML(r) {
  const rows = Object.entries(r.dealt || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = rows.length ? rows[0][1] : 1;
  const hurt = Object.entries(r.tally.hurtBy || {}).sort((a, b) => b[1] - a[1])[0];
  return rows.length ? `<div class="recap">${rows.map(([k, v]) => `<div class="rc"><span>${esc(k)}</span><i style="width:${Math.max(4, v / max * 100)}%"></i><b>${v}</b></div>`).join('')}</div>` + `<p class="sh-p fine">${r.turns} turns · ${r.tally.reactions} reaction${r.tally.reactions === 1 ? '' : 's'}${hurt ? ` · hurt most by ${esc(hurt[0])} (${hurt[1]})` : ''}</p>` : '';
}
function lastTurnsHTML() {
  const f = ui.fight; if (!f) return '';
  const lines = f.log.filter(l => ['me', 'foe', 'react', 'loss'].includes(l.t)).slice(-5);
  if (!lines.length) return '';
  return `<h4>The last turns</h4><ol class="lastturns">${lines.map((l, i) => `<li class="t-${l.t} ${i === lines.length - 1 ? 'kb' : ''}">${esc(l.text)}${i === lines.length - 1 ? ' <b>(killing blow)</b>' : ''}</li>`).join('')}</ol>`;
}
function runCard(s, opts) {
  opts = opts || {};
  const H = s.history || [];
  const label = h => h.round > ROUNDS ? 'E' + (h.round - ROUNDS + 1) : h.kind === 'final' ? 'F' : 'R' + h.round;
  const strip = H.length ? `<div class="hstrip">${H.map(h => `<span class="hc ${h.won ? 'w' : 'l'}" title="${esc(h.name)}">${label(h)}${h.won ? '' : h.hl ? ` −${h.hl}♥` : ''}</span>`).join('')}</div>` : '';
  const best = H.filter(h => h.won).sort((a, b) => a.turns - b.turns || b.dealt - a.dealt)[0];
  const lost = H.reduce((a, h) => a + (h.hl || 0), 0);
  return `<div class="runcard ${opts.erased ? 'erased' : ''}"><div class="rc-h">${crest(s.champ, opts.erased ? 'erased' : 'champion', !!opts.big, { sigil: s.sigil, color: s.color }, s.rank)}<div><div class="ch-name">${esc(s.champ)}</div><div class="ch-sub">${s.entrant ? 'Entrant ' + s.entrant + ' · ' : ''}${s.path ? esc(ARCH[s.path].path) + ' · ' : ''}Lv ${s.level}${s.title && TITLES[s.title] ? ' · ' + esc(TITLES[s.title].name) : ''}</div></div></div>
    ${strip}
    ${s.rec ? `<p class="rc-bio">${bioHTML(s.rec, s.worldType, s.worldName, s.name || s.champ)}</p><button class="rc-l rc-rec" data-act="rec-snap" data-at="${s.at}"><span>Record</span>${recLeft(s.rec)} of ${s.rec.ids.length} entries survive ›</button>` : ''}
    <div class="rc-l"><span>Skills</span>${s.bar.map(x => esc(SKILLS[x.id] ? SKILLS[x.id].name : x.id) + (x.star > 1 ? ' ★' + x.star : '')).join(' · ') || '–'}</div>
    <div class="rc-l"><span>Gear</span>${(s.gear || []).map(x => esc(GEAR[x.id] ? GEAR[x.id].name : x.id) + (x.star > 1 ? ' ★' + x.star : '')).join(' · ') || '–'}</div>
    ${s.hiddenPath && HIDDEN_PATHS[s.hiddenPath] ? `<div class="rc-l"><span>Path</span>${esc(HIDDEN_PATHS[s.hiddenPath].name)} (hidden)</div>` : ''}
    ${best ? `<div class="rc-l"><span>Best fight</span>${esc(best.name)} in ${best.turns} turn${best.turns === 1 ? '' : 's'}</div>` : ''}
    <div class="rc-l"><span>${opts.erased ? 'Erased by' : 'Hearts'}</span>${opts.erased ? esc(s.cause || 'the System') : `${s.hearts != null ? s.hearts : '?'} of ${s.maxHearts || 10} left`}${lost ? ` · ${lost} lost` : ''}</div></div>`;
}
function resultSheet() {
  const r = ui.result, e = ui.end;
  if (r.rewind) return sheetWrap('[Return by Death]', `<p class="sh-p big">${esc(r.enemy)} kills you. Then the world blinks.</p><p class="sh-p">The fight begins again. Nobody else remembers. Your cheat skill is spent.</p>`, `<button class="btn primary" data-act="rewind">Try again</button>`, 'sys', true);
  if (e && e.kind === 'spared') return sheetWrap(`[${run.world.name} is spared]`, `<p class="sh-p big">You beat the Final Champion. ${esc(run.world.name)} survives the tournament, and ${esc(run.champ)} joins the Hall of Champions.</p>${recapHTML(r)}<p class="sh-p">The System offers the <b>elite bracket</b>: ${!run.seed && meta.rank && rankIdx(meta.rank.letter) >= rankIdx('A') ? '3 more matches, as befits your rank,' : '2 more matches'} against past winners and the Undefeated. Your world is safe either way. Each elite win earns extra Echoes.</p><p class="sh-p fine">+${e.echoes} Echoes earned.</p>`, `<button class="btn ghost" data-act="end-run">End as champion</button><button class="btn primary" data-act="enter-elite">Enter the elite bracket</button>`, 'win', true);
  if (e && (e.kind === 'elite-clear' || e.kind === 'elite-fall')) return sheetWrap(e.kind === 'elite-clear' ? '[The Undefeated has fallen]' : '[Elite bracket over]', `<p class="sh-p big">${e.kind === 'elite-clear' ? 'Impossible. The System will need a new record.' : 'You fall in the elite bracket. Your world remains spared.'}</p><p class="sh-p fine">Elite wins: ${run.eliteWins}. +${8 * run.eliteWins} Echoes.</p>`, `<button class="btn primary" data-act="end-run">Finish</button>`, e.kind === 'elite-clear' ? 'win' : '', true);
  const steps = eraseSteps(r);
  if (e && e.kind === 'erased') return sheetWrap('[Eliminated]', `<p class="sh-p big">${esc(r.enemy)} wins. ${esc(e.snap.worldName)} has no Hearts left.</p>${eraseRows(steps)}${steps.length ? '' : lastTurnsHTML() + recapHTML(r)}<p class="sh-p">${esc(e.snap.worldName)} will be erased, and ${esc(e.snap.champ)} will join the Hall of the Erased. They may return to face you.</p>`, eraseFoot(steps, `<button class="btn primary" data-act="result-ok">Accept</button>`), 'lose', true);
  const lines = [];
  if (r.won) lines.push(`+${r.gold} gold · healed 30%`);
  if (!r.won && !run.elite) lines.push(`A piece of ${esc(run.world.name)} is erased: −${r.heartsLost} Heart${r.heartsLost > 1 ? 's' : ''}. ${run.hearts} left. ${ui.fight && ui.fight.spec.kind === 'final' ? 'You must face the Final Champion again.' : 'The tournament moves on.'}`);
  // erase lines become rows, and the defeat lines repeat the summary above
  const shown = r.msgs.filter(m => !/^\[(Erasing|World): |^\[Defeat\. |^\[The Final Champion waits/.test(m.text));
  const msgs = shown.length ? `<ul class="msgs">${shown.map(m => `<li class="t-${m.t}">${esc(m.text)}</li>`).join('')}</ul>` : '';
  return sheetWrap(r.won ? 'Victory' : 'Defeat', `<p class="sh-p big">${r.won ? `${esc(r.enemy)} is defeated.` : `${esc(r.enemy)} wins this round.`}</p><p class="sh-p">${lines.join(' ')}</p>${eraseRows(steps)}${r.won ? '' : lastTurnsHTML()}${steps.length ? '' : recapHTML(r)}${msgs}`, eraseFoot(steps, `<button class="btn primary" data-act="result-ok">Continue</button>`), r.won ? 'win' : 'lose', true);
}
function statsSheet() {
  const s = effStats(run), p = buildPlayer(run);
  const rows = STATS.map(k => `<div class="strow s4"><span class="st-k">${k}</span><span class="st-n">${STAT_INFO[k].name}<small>${STAT_INFO[k].short}</small></span><span class="st-v">${s[k]}${s[k] !== run.stats[k] ? `<small> (${run.stats[k]})</small>` : ''}</span>${run.statPts ? `<button class="btn small add" data-act="stat" data-k="${k}" aria-label="Add a point to ${STAT_INFO[k].name}">+</button>` : '<span></span>'}</div>`).join('');
  const gods = Object.entries(GODS).map(([g, G]) => `<div class="god"><div class="gd-h"><b>${esc(G.name)}${run.patron === g ? ' · Patron' : ''}</b><span>${run.favour[g] || 0} Favour</span></div><div class="gbar"><i style="width:${Math.min(100, (run.favour[g] || 0) / 8 * 100)}%"></i><em style="left:50%"></em></div><small>Gift at 4, blessing at 8: ${esc(G.blessing)}</small></div>`).join('');
  const body = `${run.statPts ? `<p class="sh-p pts">${run.statPts} stat point${run.statPts > 1 ? 's' : ''} to spend.</p>` : ''}${rows}
    <dl class="dl"><div><dt>Max HP</dt><dd>${maxHp(run)}</dd></div><div><dt>Crit</dt><dd>${Math.round(p.crit * 100)}%</dd></div><div><dt>Dodge</dt><dd>${Math.round(p.dodge * 100)}%</dd></div><div><dt>Level</dt><dd>${run.level}</dd></div></dl>
    <h4>Stat milestones</h4><ul class="msgs">${STATS.map(k => `<li class="${run.milestones[k] ? '' : 'unk'}"><b>${k} 10 · ${esc(MILESTONES[k].name)}</b>: ${esc(MILESTONES[k].desc)}${run.milestones[k] ? '' : ` <small>(${s[k]}/10)</small>`}</li>`).join('')}</ul>
    <h4>Title</h4>${titleList()}
    <h4>System quests</h4>${questList()}
    ${run.hiddenPath ? `<h4>Hidden Path · ${esc(HIDDEN_PATHS[run.hiddenPath].name)}</h4><p class="sh-p">${esc(HIDDEN_PATHS[run.hiddenPath].desc)}</p>` : ''}
    <h4>Gifts</h4><ul class="msgs">${run.gifts.map(k => `<li><b>${esc(GIFTS[k].name)}</b>: ${esc(GIFTS[k].desc)}${(k === 'rewind' && run.usedRewind) || (k === 'breath' && run.usedBreath) ? ' <small>(spent)</small>' : ''}</li>`).join('') || '<li class="unk">None</li>'}</ul>
    <h4>World · ${esc(run.world.name)}</h4><p class="sh-p">${esc(WORLD_TYPES[run.world.type].name)}, rank ${WORLD_RANKS[run.world.rank]}. ${esc(MODIFIERS[run.world.mod].name)}: ${esc(MODIFIERS[run.world.mod].desc)}</p>
    <h4>Sponsors</h4>${gods}`;
  return sheetWrap(`${run.name} · Status`, body, `<button class="btn primary" data-act="close">Done</button>`);
}
function titleList() {
  const ts = Object.keys(TITLES).filter(k => meta.titles[k]);
  if (!ts.length) return '<p class="sh-p fine">No Titles yet. Earn them with feats in the arena.</p>';
  return `<div class="tlist">${ts.map(k => `<button class="gift ${run.title === k ? 'on' : ''}" data-act="equip-title" data-k="${k}"><span class="gf-h"><b>${esc(TITLES[k].name)}</b>${run.title === k ? '<span class="tagn q">Equipped</span>' : ''}</span><span class="gf-d">${esc(TITLES[k].desc)}</span></button>`).join('')}</div><p class="sh-p fine">One Title at a time. Tap to equip or remove.</p>`;
}
function questList() {
  const qs = run.quests.filter(q => !QUESTS[q.id].hidden || q.done);
  const hidden = run.quests.filter(q => QUESTS[q.id].hidden && !q.done).length;
  return `<ul class="msgs">${qs.map(q => { const Q = QUESTS[q.id]; return `<li class="${q.failed ? 'unk' : q.done ? 't-loot' : ''}"><b>${q.done ? '✓ ' : q.failed ? '✗ ' : ''}${esc(Q.text)}</b> <small>${Q.goal > 1 && !q.done ? `${q.prog}/${Q.goal} · ` : ''}Reward: ${esc(outcomeText(Q.reward))}</small></li>`; }).join('')}${hidden ? `<li class="unk">[${hidden} hidden quest${hidden > 1 ? 's' : ''}: ???]</li>` : ''}</ul>`;
}
function questLine() {
  const q = run.quests.find(q => !QUESTS[q.id].hidden && !q.done && !q.failed);
  if (!q) return '';
  const Q = QUESTS[q.id];
  return `<button class="qline" data-act="sheet" data-s="stats"><span class="eyebrow">Quest</span><span>${esc(Q.text)}</span><b>${Q.goal > 1 ? `${q.prog}/${Q.goal}` : ''}</b></button>`;
}
function archetypesSheet() {
  const c = runCounts(run);
  const body = run.arch.map(k => { const A = ARCH[k], n = c[k] || 0, t = archTier(n); return `<div class="archrow a-${k}"><div class="ar-h"><b>${A.name}</b><span class="fine">${esc(A.theme)} · ${A.stat}</span><span class="ar-n">${n}</span></div>${A.b.map((b, i) => `<div class="ar-b ${t > i ? 'on' : ''}"><span>${[2, 4, 6][i]}</span>${esc(b)}</div>`).join('')}</div>`; }).join('');
  const hp = run.hiddenPath ? `<div class="archrow hidden"><div class="ar-h"><b>Hidden Path · ${esc(HIDDEN_PATHS[run.hiddenPath].name)}</b></div><div class="ar-b on">${esc(HIDDEN_PATHS[run.hiddenPath].desc)}</div></div>` : '<p class="sh-p fine">Reach 4 pieces in two archetypes at once to unlock a Hidden Path.</p>';
  return sheetWrap('Archetypes this run', `<p class="sh-p fine">Equipped pieces (skill bar and gear) count. Each different piece counts once; pieces with two tags count for both. At 4, the System names your path.</p>${body}${hp}<h4>Reactions</h4><ul class="msgs">${Object.values(REACTIONS).map(R => `<li><b>${R.name}</b> (${R.pair}): ${esc(R.text)}</li>`).join('')}</ul>`, `<button class="btn primary" data-act="close">Close</button>`);
}
function scoutSheet() {
  const spec = currentSpec(run);
  let body = '';
  if (spec.snap) body = `<p class="sh-p big">${esc(specName(spec))}</p><p class="sh-p">${esc(specStyle(spec))}. Level ${spec.snap.level}.</p>` + spec.snap.bar.map(s => pieceBody(s.id, s.star, s.mods, 1)).join('') + spec.snap.gear.map(g => pieceBody(g.id, g.star)).join('');
  else { const t = ENEMIES[spec.id]; body = `<p class="sh-p big">${esc(specName(spec))}</p><p class="sh-p">${esc(t.style)}.</p><ul class="msgs">${t.skills.map(s => `<li><b>${esc(s.n)}</b>: ${esc(describe({ fx: s.fx }))}</li>`).join('')}</ul><p class="sh-p fine">They use their skills in a fixed order, which you can learn. In the fight you'll also see their move after next.</p>${t.phase ? `<p class="sh-p fine">[Below ${Math.round(t.phase.at * 100)}% HP, they change how they fight.]</p>` : ''}${traitsHTML(spec)}`; }
  if (districtUp(run, 'scout')) body += `<p class="sh-p sysl">[AGI ${STAT_EASY}] [While you were looking, you loosened a strap on their armour. They start the fight Weakened.]</p>`;
  return sheetWrap('Scout report', body, `<button class="btn primary" data-act="close">Done</button>`);
}
function skillInfoSheet() { const s = ui.fight.A.skills[ui.sheet.i]; if (s.key === 'copycat') return sheetWrap('Copycat', `<p class="sh-p">${esc(GIFTS.copycat.desc)}</p><p class="sh-p fine">${ui.fight.lastEnemySkill ? 'Next copy: ' + esc(ui.fight.lastEnemySkill.def.name) : 'The opponent has not acted yet.'}</p>`, `<button class="btn primary" data-act="close">Close</button>`); return sheetWrap(s.def.name, (s.def.basic ? `<div class="srow"><div class="sr-desc">${esc(describe(s.def, s.power))}</div></div>` : pieceBody(run.bar.find(p => p && p.u === s.u).id, s.star, s.mods, s.power)) + '<p class="sh-p fine">Numbers include your stats and stars. Turn off ? to use skills.</p>', `<button class="btn primary" data-act="close">Close</button>`); }
// Shown in the Menu so a layout report can include what the device told the game
function screenLine() { const s = screenInfo(); return `[Display: ${innerWidth}×${s.vh} of ${s.sh} · insets ${Math.round(s.top)}/${Math.round(s.bottom)}${s.standalone ? ' · app' : ''}${document.documentElement.style.getPropertyValue('--app-h') ? ' · stretched' : ''}]`; }
function menuSheet() {
  const cs = !cloud.on ? (FIREBASE ? '' : 'Progress is saved on this device only.') : cloud.syncOff ? 'Signed in, but your access level cannot save to the account. Progress stays on this device.' : 'Progress syncs to your account across devices.';
  return sheetWrap('Menu', `${cloudSignInHTML(false)}<p class="sh-p fine">${cs}${cloud.on && cloud.shared.length ? ` ${cloud.shared.length} shared champion${cloud.shared.length > 1 ? 's' : ''} from other entrants.` : ''}<br><span class="scr-info">${screenLine()}</span></p><div class="stack"><button class="btn" data-act="sheet" data-s="howto">How to play</button>${run ? '<button class="btn" data-act="sheet" data-s="archetypes">Archetypes and reactions</button><button class="btn" data-act="sheet" data-s="syslog">System log</button>' : ''}<button class="btn" data-act="sheet" data-s="archive">Archive</button><button class="btn" data-act="sheet" data-s="halls">Halls</button><button class="btn" data-act="report">Report a bug or idea</button>
    ${ui.screen === 'fight' ? `<div class="speed" role="group" aria-label="Animation speed">${[1, 2, 3].map(v => `<button class="btn small ${ui.speed === v ? 'primary' : ''}" data-act="speed" data-v="${v}">${v}×</button>`).join('')}</div>` : ''}
    ${run ? (ui.confirmAbandon ? `<button class="btn danger" data-act="abandon-yes">Confirm: erase ${esc(run.world.name)}</button>` : `<button class="btn ghost danger-t" data-act="abandon">Abandon run</button>`) : ''}</div>`, false);
}
const FB_LABEL = { bug: 'Bug', idea: 'Idea', balance: 'Balance', other: 'Other' };
function reportSheet() {
  const F = ui.fb || (ui.fb = { type: 'bug', text: '', attach: !!run, from: ui.screen });
  const hint = { bug: 'What happened, and what did you expect?', idea: 'What would you add or change?', balance: 'What felt too strong, too weak or unfair?', other: 'Anything else the System should know.' }[F.type];
  const body = `<p class="sh-p sysl">[Complaints are now accepted. The System reads every one.]</p>
    <div class="fb-types" role="group" aria-label="Report type">${FEEDBACK_TYPES.map(k => `<button class="btn small ${F.type === k ? 'primary' : 'ghost'}" data-act="fb-type" data-k="${k}" aria-pressed="${F.type === k}">${FB_LABEL[k]}</button>`).join('')}</div>
    <label class="fld"><span>${esc(FB_LABEL[F.type])} report</span><textarea id="fb-text" rows="5" maxlength="${FEEDBACK_MAX}" placeholder="${esc(hint)}">${esc(F.text)}</textarea></label>
    ${run && !run.practice ? `<label class="fb-chk"><input type="checkbox" id="fb-attach" ${F.attach ? 'checked' : ''}> Attach this run (round, skills, last System messages)</label>` : ''}
    <p class="sh-p fine">Sent with the game version, the screen you were on and your screen size. Never your name or email.${FIREBASE && !cloud.on ? ' You are signed out: it waits on this device until you sign in.' : ''}</p>`;
  return sheetWrap('Report a bug or idea', body, `<button class="btn ghost" data-act="close">Cancel</button><button class="btn primary" data-act="fb-send">Send</button>`, 'report-sheet');
}
function syslogSheet() { return sheetWrap('System log', `<ul class="msgs">${run.log.slice().reverse().map(l => `<li class="t-${l.t}">${esc(l.text)}</li>`).join('') || '<li class="unk">Nothing yet.</li>'}</ul>`, `<button class="btn primary" data-act="close">Close</button>`); }
// ---------- What's new ----------
// Update notes from js/notes.js, one page per screen. Opening them marks the latest notes as seen.
function newsUnseen() { return typeof PATCH_NOTES !== 'undefined' && PATCH_NOTES.length && meta.notesSeen !== PATCH_NOTES[0].id; }
function openNews() { ui.sheet = { type: 'news', p: 0 }; if (newsUnseen()) { meta.notesSeen = PATCH_NOTES[0].id; saveMeta(); } }
function newsSheet() {
  const N = PATCH_NOTES[0], n = N.pages.length, i = Math.min(ui.sheet.p || 0, n - 1), pg = N.pages[i];
  const body = `<p class="sh-p fine">${esc(N.title)} · ${i + 1} of ${n}</p><p class="sh-p sysline">${esc(pg.sys)}</p><h4>${esc(pg.h)}</h4><ul class="msgs plain news">${pg.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  const foot = `<button class="btn ghost" data-act="news-page" data-p="${i - 1}" ${i ? '' : 'disabled'}>‹ Back</button>` + (i < n - 1 ? `<button class="btn primary" data-act="news-page" data-p="${i + 1}">Next ›</button>` : `<button class="btn primary" data-act="close">Done</button>`);
  return sheetWrap("What's new", body, foot, 'sys news-sheet');
}
// Returning players see new notes once on the title screen; new players start with them marked seen
function maybeShowNews() {
  if (!newsUnseen() || ui.screen !== 'title' || ui.sheet) return;
  if (meta.runs || meta.tutorialDone) { openNews(); render(); } else { meta.notesSeen = PATCH_NOTES[0].id; saveMeta(); }
}
function howtoSheet() {
  return sheetWrap('How to play', `<ul class="msgs plain">
    <li><b>Each round:</b> choose your opponent, shop, visit one district, then fight.</li>
    <li><b>Fights:</b> pick one skill a turn. The opponent's next move is always shown. Quick skills don't end your turn.</li>
    <li><b>Stun and Interrupt</b> cancel the opponent's telegraphed move and put it on cooldown.</li>
    <li><b>Archetypes:</b> every piece has 1 or 2. Equip 2, 4 or 6 pieces of one archetype for its bonuses. Tap the chips at the top of the shop to see them.</li>
    <li><b>Stars:</b> 3 copies of a piece merge into ★2. Three ★2 make ★3, and skills evolve.</li>
    <li><b>Gold:</b> 5 a round, +interest of 1 per 10 gold you hold (up to 3). Reroll for 2, buy XP for 4. Higher levels see rarer pieces.</li>
    <li><b>Reactions:</b> Burn + Poison, Burn + Bleed, Bleed + Mark, Stun + Weaken and more trigger bonus effects.</li>
    <li><b>Wagers:</b> a god bets on your next fight. Stake 5 gold for 10 and their Favour.</li>
    <li><b>Titles</b> come from feats and world firsts. Equip one for a small bonus; many unlock new Gifts.</li>
    <li><b>System quests</b> appear each run. Some are hidden until you complete them.</li>
    <li><b>Hidden Paths:</b> reach 4 pieces in two archetypes at once for a hybrid bonus.</li>
    <li><b>Stat milestones:</b> 10 in a stat grants a named perk.</li>
    <li><b>Hearts</b> are your world. Each loss erases part of it, and losses cost more later. At zero your world is erased, and its champion will return to face you.</li>
  </ul>`, `<button class="btn primary" data-act="close">Got it</button>`);
}
function archiveSheet() {
  const A = meta.archive;
  if (run && !run.ended && hasGift(run, 'f_amnesia')) return sheetWrap('Tournament Archive', '<p class="sh-p big">[Access denied. Entrant memory is corrupted.]</p><p class="sh-p fine">Amnesia seals the Archive for this run.</p>', `<button class="btn primary" data-act="close">Close</button>`);
  const titles = Object.entries(TITLES).map(([k, T]) => meta.titles[k] ? `<li><b>${esc(T.name)}</b>: ${esc(T.desc)} <small>${esc(T.cond)}</small></li>` : `<li class="unk">${T.first ? '' : 'Title: '}<small>${esc(T.cond)}</small></li>`).join('');
  const hidden = Object.entries(HIDDEN_PATHS).filter(([k]) => A.hidden && A.hidden[k]).map(([k, H]) => `<li><b>${esc(H.name)}</b> (${k.split('+').map(x => ARCH[x].name).join(' + ')}): ${esc(H.desc)}</li>`).join('');
  const nh = Object.keys(HIDDEN_PATHS).length, fh = Object.keys(A.hidden || {}).length;
  const quests = Object.entries(QUESTS).filter(([k, Q]) => Q.hidden).map(([k, Q]) => A.quests && A.quests[k] ? `<li><b>${esc(Q.text)}</b></li>` : '<li class="unk">Hidden quest: ???</li>').join('');
  const rivals = RIVALS.map(k => A.rivals[k] ? `<li><b>${esc(ENEMIES[k].name)}</b>: ${esc(ENEMIES[k].style)}. Skills: ${ENEMIES[k].skills.map(s => esc(s.n)).join(', ')}.</li>` : `<li class="unk">Unknown rival</li>`).join('');
  const finals = Object.keys(ENEMIES).filter(k => ENEMIES[k].final).map(k => A.finals[k] ? `<li><b>${esc(ENEMIES[k].name)}</b>: ${esc(ENEMIES[k].style)}.</li>` : `<li class="unk">Unknown Final Champion</li>`).join('');
  const rx = Object.entries(REACTIONS).map(([k, R]) => A.reactions[k] ? `<li><b>${R.name}</b> (${R.pair}): ${esc(R.text)}</li>` : `<li class="unk">Undiscovered reaction</li>`).join('');
  const paths = ARCH_KEYS.map(k => A.paths[k] ? `<li><b>${ARCH[k].path}</b> (${ARCH[k].name})</li>` : '').join('');
  const evos = Object.keys(A.evos).map(k => { const [a, b] = k.split('>'); return SKILLS[a] && SKILLS[b] ? `<li>${esc(SKILLS[a].name)} → <b>${esc(SKILLS[b].name)}</b></li>` : ''; }).join('');
  return sheetWrap('Tournament Archive', `<h4>Rivals</h4><ul class="msgs">${rivals}</ul><h4>Final Champions</h4><ul class="msgs">${finals}</ul><h4>Reactions</h4><ul class="msgs">${rx}</ul><h4>Paths recognised</h4><ul class="msgs">${paths || '<li class="unk">None yet. Equip 4 pieces of one archetype.</li>'}</ul><h4>Evolutions</h4><ul class="msgs">${evos || '<li class="unk">None yet. Merge a skill to ★3.</li>'}</ul><h4>Titles</h4><ul class="msgs">${titles}</ul><h4>Hidden Paths · ${fh} of ${nh}</h4><ul class="msgs">${hidden || '<li class="unk">None found. Reach 4 pieces in two archetypes at once.</li>'}</ul><h4>Hidden quests</h4><ul class="msgs">${quests}</ul>`, `<button class="btn primary" data-act="close">Close</button>`);
}
// Entrant Rank in the Halls: grade, RP to the next trial, perks and one line per promotion
function rankHTML() {
  const R = meta.rank; if (!R) return '';
  const nx = nextRank(R.letter), champ = meta.champions[0] && meta.champions[0].name;
  const next = !nx ? 'No higher rank. Records indicate otherwise.' : R.trial ? `A ${R.trial}-rank Rank Trial waits in your next world.` : `${RANK_RP[nx] - R.rp} RP to the ${nx}-rank trial.`;
  const perks = R.perks.length ? `<p class="sh-p fine">Perks: ${R.perks.map(k => `<b>${esc(PERKS[k].name)}</b> (${esc(PERKS[k].desc.replace(/\.$/, ''))})`).join(', ')}.</p>` : '';
  return `<h4>Entrant Rank: ${R.letter}</h4><p class="sh-p sysl">${esc(rankAddress(meta, champ, meta.runs))}</p><p class="sh-p fine">${R.rp} Rank Points. ${next}</p>${perks}
    <ul class="rank-hist"><li>[Entrant registered. F-rank.]</li>${R.history.map(h => `<li>${esc(historyLine(h))}</li>`).join('')}</ul>`;
}
function hallsSheet() {
  const row = (s, erased) => runCard(s, { erased }) + (canShare() ? (meta.shared && meta.shared[s.at] ? '<p class="sh-p fine">Shared with other entrants.</p>' : `<button class="btn small ghost" data-act="share-hall" data-k="${erased ? 'erased' : 'spared'}" data-at="${s.at}">Share with other entrants</button>`) : '');
  const others = cloud.shared.length ? `<h4>Other entrants' champions</h4><p class="sh-p fine">Shared by people who play this game with you. They can appear in your tournaments.</p><div class="cards">${cloud.shared.map(x => `<p class="sh-p fine">${x.kind === 'spared' ? 'Champion of' : 'Erased in'} ${esc(ownerName(x.snap.owner))}'s tournament</p>` + runCard(x.snap, { erased: x.kind === 'erased' })).join('')}</div>` : (cloud.on ? '<h4>Other entrants\' champions</h4><p class="sh-p fine">None shared yet. When people you share this game with share their champions, they appear here and in your brackets.</p>' : '');
  return sheetWrap('The Halls', `${rankHTML()}${cloud.on && cloud.tester === false ? `<p class="sh-p fine">${PENDING} Sharing champions opens once you are approved.</p>` : ''}<h4>Hall of the Erased</h4><p class="sh-p fine">Champions of worlds you lost. The System may enter them against you.</p><div class="cards">${meta.erased.map(x => row(x, true)).join('') || '<p class="sh-p fine">Empty. For now.</p>'}</div><h4>Hall of Champions</h4><p class="sh-p fine">Champions of worlds you saved. They appear in future elite brackets.</p><div class="cards">${meta.champions.map(x => row(x, false)).join('') || '<p class="sh-p fine">No world spared yet.</p>'}</div>${others}`, `<button class="btn primary" data-act="close">Close</button>`);
}
function echoesSheet() {
  const list = Object.entries(UNLOCKS).map(([k, u]) => `<div class="choice static"><div class="sr-h"><span class="sr-name">${esc(u.name)}</span><span class="price">${u.cost} Echoes</span></div><div class="sr-desc">${esc(u.desc)}</div>${meta.unlocks[k] ? '<span class="tag">Unlocked</span>' : `<button class="btn small" data-act="unlock" data-k="${k}" ${meta.echoes < u.cost ? 'disabled' : ''}>Unlock</button>`}</div>`).join('');
  return sheetWrap('Echoes', `<p class="sh-p">Echoes are fragments of the worlds you fought for. You have <b>${meta.echoes}</b>. They buy options, never raw power.</p>${list}`, `<button class="btn primary" data-act="close">Close</button>`);
}
function shareBlock(s, erased) {
  if (FIREBASE && !cloud.on && s) return `<p class="sh-p fine center">Sign in from the menu to share champions with other players.</p>`;
  if (cloud.on && cloud.tester === false && s) return `<p class="sh-p fine center">${PENDING}</p>`;
  if (!canShare() || !s) return '';
  if (meta.shared && meta.shared[s.at]) return `<p class="sh-p fine center">[${esc(s.champ)} is shared with other entrants.]</p>`;
  return `<button class="btn" data-act="share" data-k="${erased ? 'erased' : 'spared'}">Share ${esc(s.name || s.champ)} with other entrants</button>`;
}
function endHTML() {
  const e = ui.end, s = e.snap;
  const erased = e.kind === 'erased';
  const lines = (e.observed ? [e.observed] : []).concat(erased ? [`[Entrant eliminated. ${s.worldName} is erased.]`, `[${s.champ} has been added to the Hall of the Erased.]`].concat(e.opened ? [] : ['[Next world.]']) : [`[${s.worldName} is spared.]`, `[${s.champ} enters the Hall of Champions.]`], e.opened ? [`[Rank Trial unlocked: ${e.opened}-rank. It waits in your next world.]`] : []);
  return `<main class="screen title end"><div class="t-top"><div class="eyebrow">${erased ? 'World erased' : 'World spared'}</div><h1>${erased ? 'Erased' : 'Spared'}</h1>
    <div class="sysbox ${erased ? 'bad' : ''}">${lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>
    ${runCard(s, { erased, big: true })}</div>
    <div class="t-stats"><div><b>${s.round}</b><span>round</span></div><div><b>${run ? run.wins : '–'}</b><span>wins</span></div><div><b>+${e.totalEchoes != null ? e.totalEchoes : e.echoes}</b><span>Echoes</span></div><div><b>+${e.rp || 0}</b><span>RP</span></div></div>
    ${shareBlock(s, erased)}
    <div class="stack">${e.observed ? `<div class="row2 even"><button class="btn" data-act="daily-board">Today's outcomes</button><button class="btn primary" data-act="new">New world</button></div>` : '<button class="btn primary" data-act="new">Choose a new world</button>'}<div class="row3"><button class="btn ghost" data-act="sheet" data-s="archive">Archive</button><button class="btn ghost" data-act="sheet" data-s="halls">Halls</button><button class="btn ghost" data-act="sheet" data-s="echoes">Echoes</button></div></div></main>`;
}

// ---------- Render ----------
function render() {
  if (ui.screen === 'district' && run && run.stage === 'shop' && !ui.sheet && !run.pending.length) ui.screen = 'shop';
  const focusName = document.activeElement && document.activeElement.id === 'aw-name';
  // A sync can redraw while a report is being typed: put the cursor back where it was
  const fbFocus = document.activeElement && document.activeElement.id === 'fb-text' ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  let h = '';
  const scr = ui.screen;
  if (scr === 'title') h = titleHTML();
  else if (scr === 'worlds') h = worldsHTML();
  else if (scr === 'awaken') h = awakenHTML();
  else if (scr === 'draft') h = draftHTML();
  else if (scr === 'choose') h = chooseHTML();
  else if (scr === 'shop') h = shopHTML();
  else if (scr === 'district') h = districtHTML();
  else if (scr === 'fight') h = fightHTML();
  else if (scr === 'end') h = endHTML();
  let sh = '';
  const S = ui.sheet;
  if (S) {
    const t = S.type || S;
    const fn = { news: newsSheet, daily: dailySheet, dailyweek: weekSheet, dailycmp: compareSheet, record: recordSheet, piece: pieceSheet, stats: statsSheet, archetypes: archetypesSheet, scout: scoutSheet, skillinfo: skillInfoSheet, menu: menuSheet, howto: howtoSheet, archive: archiveSheet, halls: hallsSheet, echoes: echoesSheet, result: resultSheet, syslog: syslogSheet, report: reportSheet, enchanter: () => enchantSheet(ui.enchantMods, 'option') }[t];
    sh = fn ? fn() : '';
  }
  if (!sh && run && ['choose', 'shop', 'district'].includes(scr) && run.pending.length) { sh = pendingSheet(); statLinesNotice(); }
  if (!sh && ui.sheet && ui.sheet.type === 'practicedone') sh = practiceDoneSheet();
  if (!sh && ui.sheet && ui.sheet.type === 'firsttime') sh = firstTimeSheet();
  app.innerHTML = h + sh + coachHTML();
  coachHighlight();
  if (scr === 'fight') updateFight();
  placeToasts();
  if (focusName) { const el = document.getElementById('aw-name'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
  if (fbFocus) { const el = document.getElementById('fb-text'); if (el) { el.focus(); el.setSelectionRange(fbFocus[0], fbFocus[1]); } }
}

// ---------- Actions ----------
function go(screen) { ui.screen = screen; ui.sheet = null; render(); }
function onAct(el) {
  const a = el.dataset.act, d = el.dataset;
  switch (a) {
    case 'new': if (run && !run.ended) recordRunStats('abandoned'); lsDel(RUN_KEY); run = null; ui.daily = null; ui.worlds = offerWorlds(meta); ui.seed = Math.random().toString(36).slice(2); ui.world = null; ui.end = null; return go('worlds');
    case 'daily': { const date = dailyDate(), w = dailyWorld(date); if (lsGet(RUN_KEY) && !lsGet(RUN_KEY).ended) return render(); run = null; ui.end = null; ui.sheet = null; ui.daily = { date, ranked: !dailyPlayed(date) }; countObservers(ui.daily); ui.worlds = [w]; ui.world = 0; ui.aw = newAw(w, date); return go('awaken'); }
    case 'daily-board': ui.sheet = { type: 'daily' }; loadBoard(); postDaily(); if (!ui.season || Date.now() - ui.season.t > 3600e3) loadSeason(); return render();
    case 'board-week': ui.sheet = { type: 'dailyweek' }; if (!ui.season || Date.now() - ui.season.t > 3600e3) loadSeason(); return render();
    case 'board-row': ui.sheet = { type: 'dailycmp', i: +d.i }; return render();
    case 'resume': run = lsGet(RUN_KEY); ensureRecord(run); ui.pick = null; ui.wagerOn = false; return go(stageScreen());
    case 'back-title': return go('title');
    case 'back-worlds': return go('worlds');
    case 'pick-world': ui.world = +d.i; return render();
    case 'world-ok': ui.aw = newAw(ui.worlds[ui.world]); return go('awaken');
    case 'aw-tab': ui.aw.tab = d.t; return render();
    case 'aw-sigil': ui.aw.sigil = +d.i; return render();
    case 'aw-color': ui.aw.color = +d.i; return render();
    case 'aw-roll': { const A = ui.aw; if (A.rollUsed) return render(); A.stats = rollStats(awRng('roll')); A.pts = 0; A.rolled = A.rollUsed = true; toast(`[Stats rolled. ${ROLL_PTS} points placed.]`, 'sys'); return render(); }
    case 'aw-unroll': { const A = ui.aw; A.stats = { STR: 2, AGI: 2, INT: 2, VIT: 2, LUK: 2 }; A.pts = 4; A.rolled = false; return render(); }
    case 'aw-stat': { const k = d.k, dv = +d.d, A = ui.aw; if (A.rolled) return; if (dv > 0 && A.pts > 0) { A.stats[k]++; A.pts--; } if (dv < 0 && A.stats[k] > 2) { A.stats[k]--; A.pts++; } return render(); }
    case 'aw-cat': ui.aw.cat = d.c; return render();
    case 'aw-gift': { const A = ui.aw, k = d.k; sysOverruled(A); if (A.gifts.includes(k)) A.gifts = A.gifts.filter(x => x !== k); else if (giftCheck(ui.worlds[ui.world], A.gifts.concat(k), A.patron, A.offer).ok) A.gifts.push(k); return render(); }
    case 'aw-patron': { ui.aw.patron = d.k; if (!giftCheck(ui.worlds[ui.world], ui.aw.gifts, ui.aw.patron, ui.aw.offer, ui.aw.sysPts).ok) toast('[Too many Gift Points for that choice. Remove a Gift.]', 'loss'); return render(); }
    case 'aw-title': ui.aw.title = ui.aw.title === d.k ? null : d.k; return render();
    case 'aw-random': { const A = ui.aw; A.sysPts = SYS_BONUS; A.gifts = randomGifts(ui.worlds[ui.world], awMeta(), A.patron || 'war', A.offer, awRng('sys'), A.sysPts); toast(`[The System has chosen for you. +${SYS_BONUS} Gift Points for your trust.]`, 'sys'); return render(); }
    case 'aw-save': { const A = ui.aw; meta.presets = (meta.presets || []).concat({ name: 'Preset ' + ((meta.presets || []).length + 1), gifts: A.gifts.filter(k => GIFTS[k].cat !== 'world') }).slice(-3); meta.presets.forEach((p, i) => p.name = 'Preset ' + (i + 1)); saveMeta(); toast('[Preset saved.]', 'sys'); return render(); }
    case 'aw-preset': { const A = ui.aw, w = ui.worlds[ui.world], p = meta.presets[+d.i]; sysOverruled(A); let sel = [WORLD_TYPES[w.type].gift]; p.gifts.forEach(k => { if (GIFTS[k] && giftUnlocked(k, awMeta()) && giftsAllowed(w).includes(k) && giftCheck(w, sel.concat(k), A.patron, A.offer).ok) sel.push(k); }); A.gifts = sel; if (sel.length - 1 < p.gifts.length) toast('[Some Gifts in that preset do not fit this world or budget.]', 'loss'); return render(); }
    case 'aw-ok': {
      const A = ui.aw;
      run = newRun(ui.worlds[ui.world], A.practice ? Object.assign({}, PRACTICE.setup, { name: A.name.trim() || 'Novice', sigil: A.sigil, color: A.color, script: PRACTICE.script }) : Object.assign({ name: A.name.trim(), sigil: A.sigil, color: A.color, stats: A.stats, gifts: A.gifts, patron: A.patron, offer: A.offer, sysBonus: A.sysPts || 0, title: A.title, record: A.record }, ui.daily ? { seed: dailySeed(ui.daily.date), daily: ui.daily.date, ranked: ui.daily.ranked } : {}), A.practice ? META : meta);
      if (run.daily) { if (run.ranked) { meta.daily = { date: run.daily, started: true }; saveMeta(); } run.log.push({ t: 'sys', text: pendingLine(run.world.name, ui.daily.count) }); }
      if (run.practice) run.gold = 2;
      pushMsgs(run.log.slice(), true);
      ui.draftSel = []; saveRun(); toast(`[Welcome, ${run.name}. Your Gifts have been installed.]`, 'class'); return go('draft');
    }
    case 'news': openNews(); return render();
    case 'news-page': ui.sheet = { type: 'news', p: Math.max(0, +d.p) }; return render();
    case 'close': ui.sheet = null; ui.confirmAbandon = false; ui.enchantSel = null; return render();
    case 'rec-snap': ui.recOpen = null; ui.sheet = { type: 'record', at: d.at, back: ui.sheet && ui.sheet.type }; return render();
    case 'rec-open': ui.recOpen = +d.p; return render();
    case 'rec-close': ui.recOpen = null; ui.sheet = ui.sheet && ui.sheet.back ? { type: ui.sheet.back } : null; return render();
    case 'erase-next': return eraseNext();
    case 'sheet': ui.sheet = { type: d.s }; return render();
    case 'menu': ui.sheet = { type: 'menu' }; return render();
    case 'report': return openReport();
    case 'fb-type': ui.fb.type = d.k; return render();
    case 'fb-send': return sendReport();
    case 'unlock': { const u = UNLOCKS[d.k]; if (meta.echoes >= u.cost && !meta.unlocks[d.k]) { meta.echoes -= u.cost; meta.unlocks[d.k] = true; saveMeta(); toast(`[Unlocked: ${u.name}]`, 'level'); } return render(); }
    case 'speed': ui.speed = +d.v; lsSet('wpd-speed', ui.speed); return render();
    case 'speed-cycle': ui.speed = ui.speed >= 3 ? 1 : ui.speed + 1; lsSet('wpd-speed', ui.speed); return render();
    case 'signin': { const C = window.WPD_CLOUD; if (!C) return; C.signIn(d.k).catch(e => toast(`[Sign-in failed: ${(e && e.message) || 'unknown error'}]`, 'loss')); return; }
    case 'signout': { const C = window.WPD_CLOUD; if (C) C.signOut().then(() => toast('[Signed out. Progress stays on this device.]', 'sys')); ui.sheet = null; return render(); }
    case 'share': { const s = ui.end && ui.end.snap; if (!s) return; el.disabled = true; shareChampion(s, d.k).then(ok => { toast(ok ? `[${s.champ} has been shared with other entrants.]` : '[Sharing is not available for your access level.]', ok ? 'class' : 'loss'); render(); }); return; }
    case 'share-hall': { const list = d.k === 'erased' ? meta.erased : meta.champions; const s = list.find(x => String(x.at) === d.at); if (!s) return; el.disabled = true; shareChampion(s, d.k).then(ok => { toast(ok ? `[${s.champ} has been shared.]` : '[Sharing is not available for your access level.]', ok ? 'class' : 'loss'); render(); }); return; }
    case 'abandon': ui.confirmAbandon = true; return render();
    case 'abandon-yes': { if (run.practice) return endPractice(false); const out = endRun(run, meta, 'erased'); recordRunStats('abandoned'); ui.end = { kind: 'erased', echoes: out.echoes, snap: out.snap, rp: out.rp, opened: out.trial, observed: finishDaily(false) }; saveMeta(); lsDel(RUN_KEY); ui.fight = null; ui.confirmAbandon = false; return go('end'); }
  }
  if (!run) return;
  const msgs = [];
  switch (a) {
    case 'draft-pick': { const i = ui.draftSel.indexOf(d.id); if (i >= 0) ui.draftSel.splice(i, 1); else if (ui.draftSel.length < 3) ui.draftSel.push(d.id); return render(); }
    case 'draft-reroll': rerollDraft(run); ui.draftSel = []; saveRun(); return render();
    case 'draft-ok': confirmDraft(run, ui.draftSel.slice(), run.practice ? META : meta); ui.pick = null; ui.wagerOn = false; saveRun(); return go('choose');
    case 'pick-opp': { chooseOpponent(run, +d.i, ui.wagerOn); if (run.wagerOn) toast(`[Wager accepted: ${WAGERS[run.wager.key].text}]`, 'favour'); ui.pick = null; ui.wagerOn = false; ui.distDone = null; saveRun(); return go('district'); }
    case 'wager': ui.wagerOn = !ui.wagerOn; return render();
    case 'shop-item': ui.sheet = { type: 'piece', shop: d.k, i: +d.i }; return render();
    case 'shop-tab': ui.shopTab = d.k; return render();
    case 'own': ui.sheet = { type: 'piece', u: +d.u }; return render();
    case 'quick-buy': case 'buy': { const it = shopItem(run, d.k, +d.i); if (buy(run, d.k, +d.i, msgs)) { if (!msgs.some(m => m.text.startsWith('[Merge'))) toast(`[Bought ${pieceDef(it.id).name}]`, 'loot'); pushMsgs(msgs); ui.sheet = null; saveRun(); } return render(); }
    case 'lock': run.locks[d.k][+d.i] = !run.locks[d.k][+d.i]; ui.sheet = null; saveRun(); return render();
    case 'reroll': if (reroll(run, null, ui.shopTab || 'skill')) saveRun(); return render();
    case 'buy-xp': if (buyXp(run, msgs)) { pushMsgs(msgs); saveRun(); } return render();
    case 'sell': { const p = findPiece(run, +d.u); const v = sell(run, +d.u); if (v) toast(`[Sold ${pieceDef(p.p.id).name} for ${v}g]`, 'loot'); ui.sheet = null; saveRun(); return render(); }
    case 'move': {
      const u = +d.u, to = d.to;
      const ok = to === 'bench' ? movePiece(run, u, 'bench', msgs) : to === 'gear' ? movePiece(run, u, { gear: GEAR[findPiece(run, u).p.id].slot }, msgs) : movePiece(run, u, { bar: +d.i }, msgs);
      if (!ok) toast('[Not possible: your bench may be full.]', 'loss');
      ui.sheet = null; pushMsgs(msgs); saveRun(); saveMeta(); return render();
    }
    case 'shop-done': { if (benchOver()) return render(); if (run.stage === 'shop') { leaveShop(run, null, msgs); pushMsgs(msgs); saveRun(); } if (run.pending.length || run.stage !== 'ready') return render(); return startFightUI(); }
    case 'district': {
      const k = d.k; if (distFull(k) || !useDistrict(run, k)) return; ui.distDone = k;
      if (k === 'infirmary') toast(`[Treated. +${infirmary(run)} HP]`, 'loot');
      if (k === 'sanctum') { toast(`[The world mends. +${sanctum(run, msgs)} Hearts]`, 'loot'); pushMsgs(msgs); }
      if (k === 'scout') ui.sheet = { type: 'scout' };

      if (k === 'enchanter') { ui.enchantMods = rollPrefixes(districtUp(run, 'enchanter') ? 4 : 3, null, null, run); ui.enchantSel = null; ui.sheet = { type: 'enchanter' }; }
      saveRun(); return render();
    }
    case 'event': { const p = run.pending[0]; if (!p || p.type !== 'event') return; const o = eventOpt(run, p.key, +d.i); if (!resolveEvent(run, p.key, +d.i, meta, null, msgs)) { toast('[Not possible.]', 'loss'); return; } run.pending.shift(); pushMsgs(msgs.length ? msgs : [{ t: 'sys', text: `[${o.desc}]` }]); saveRun(); saveMeta(); return render(); }
    case 'take-perk': { choosePerk(run, meta, d.k, msgs); saveMeta(); pushMsgs(msgs); saveRun(); return render(); }
    case 'take-gift': { run.pending.shift(); applyGift(run, d.k, msgs); pushMsgs(msgs); saveRun(); return render(); }
    case 'ench-mod': ui.enchantSel = +d.i; return render();
    case 'ench-back': ui.enchantSel = null; return render();
    case 'ench-skip': { ui.enchantSel = null; if (ui.sheet) ui.sheet = null; else if (run.pending[0] && run.pending[0].type === 'rune') run.pending.shift(); saveRun(); return render(); }
    case 'ench-apply': {
      const fromRune = !ui.sheet && run.pending[0] && run.pending[0].type === 'rune';
      const mods = fromRune ? run.pending[0].mods : ui.enchantMods, m = mods[ui.enchantSel];
      const f = findPiece(run, +d.u);
      if (f && applyPrefix(run, +d.u, m)) toast(`[${PREFIXES[m].name} carved into ${SKILLS[f.p.id].name}]`, 'skill');
      ui.enchantSel = null; if (fromRune) run.pending.shift(); else ui.sheet = null; saveRun(); return render();
    }
    case 'evolve': { const p = run.pending[0]; const f = findPiece(run, p.u); const from = SKILLS[f.p.id].name; evolve(run, p.u, d.id, meta); toast(`[Skill evolved: ${from} → ${SKILLS[d.id].name}]`, 'skill'); logRun(`[Skill evolved: ${from} → ${SKILLS[d.id].name}]`, 'skill'); saveRun(); saveMeta(); return render(); }
    case 'stat': if (run.statPts > 0) { const before = maxHp(run); run.statPts--; run.stats[d.k]++; run.hp += maxHp(run) - before; checkMilestones(run, msgs); pushMsgs(msgs); saveRun(); } return render();
    case 'equip-title': run.title = run.title === d.k ? null : d.k; saveRun(); return render();
    case 'use': return onUse(+d.i);
    case 'reply': { const f = ui.fight, t = f && rivalReply(run, f, +d.i); if (t) say2(f, t, 'me'); return updateFight(); }
    case 'info': ui.info = !ui.info; return render();
    case 'rewind': ui.sheet = null; ui.result = null; saveRun(); return startFightUI();
    case 'result-ok': {
      if (ui.practiceAfter) { ui.practiceAfter = false; ui.result = null; ui.sheet = { type: 'practicedone' }; return render(); }
      ui.sheet = null; ui.fight = null; ui.result = null;
      if (ui.end && ui.end.kind === 'erased') return go('end');
      saveRun(); return go(stageScreen());
    }
    case 'enter-elite': startElite(run, meta); ui.end = null; ui.sheet = null; ui.fight = null; saveRun(); return go(stageScreen());
    case 'end-run': { const extra = run.eliteWins * 8; meta.echoes += extra; eliteRank(run, meta); saveMeta(); const snap = meta.champions[0]; ui.end = { kind: 'spared', snap, totalEchoes: echoesFor(run, 'spared') + extra, rp: run.rpEarned || 0, opened: run.trialOpened, observed: finishDaily(true) }; run.ended = true; lsDel(RUN_KEY); ui.fight = null; return go('end'); }
  }
}
// ---------- Practice run (tutorial) ----------
const PRACTICE = {
  world: { type: 'burning', name: 'the Proving Grounds', rank: 1, mod: 'none', champ: 'Novice' },
  setup: { name: 'Novice', sigil: 3, color: 0, stats: { STR: 2, AGI: 2, INT: 4, VIT: 4, LUK: 2 }, gifts: ['deserter', 'catalyst'], patron: 'war', arch: ['pyre', 'venom', 'bastion', 'blade'] },
  script: {
    rounds: 3,
    draft: ['firebolt', 'venom_blade', 'iron_guard', 'quick_slash', 'hex', 'ember_ward'],
    shops: [
      { skill: ['firebolt', 'firebolt', 'plague_cloud', 'lacerate', 'shield_bash'], gear: ['ember_gauntlets', 'chain_mail', 'serpent_dagger', 'prayer_beads', 'cinder_robe'] },
      { skill: ['venom_blade', 'venom_blade', 'scorch', 'retribution', 'flame_wave'], gear: ['tower_shield', 'ember_gauntlets', 'duelist_rapier', 'grave_shroud', 'chain_mail'] },
      { skill: ['scorch', 'ignite', 'plague_cloud', 'iron_guard', 'fan_of_knives'], gear: ['plague_censer', 'templar_plate', 'shadow_leathers', 'serpent_dagger', 'chain_mail'] },
    ],
    choices: [
      [{ kind: 'monster', id: 'goblin' }, { kind: 'monster', id: 'golem', hard: true }],
      [{ kind: 'monster', id: 'brute' }, { kind: 'monster', id: 'imp', hard: true }],
      [{ kind: 'rival', id: 'seraphine' }, { kind: 'rival', id: 'grukk', hard: true }],
    ],
    districts: [['scout', 'infirmary', 'enchanter'], ['enchanter', 'undercity', 'infirmary'], ['infirmary', 'scout', 'enchanter']],
  },
};
const ownsStar = (id, st) => run && allPieces(run).some(p => p.id === id && p.star >= st);
const COACH = [
  { scr: 'awaken', pos: 'bottom', text: "[Welcome to the practice run, Entrant. I am the System, and I will be your guide. Reluctantly.] This is the Awakening, where you make your champion: a name and sigil, stats, Gifts and a Patron god. For practice I've filled it in.", wait: 'next' },
  { scr: 'awaken', pos: 'bottom', hl: '[data-act="aw-tab"][data-t="gifts"]', text: 'Gifts are your perks and cheat skills, bought with Gift Points. Weaker worlds give more points. Open the Gifts tab.', wait: 'aw-tab' },
  { scr: 'awaken', pos: 'bottom', hl: '[data-act="aw-ok"]', text: "Novice has Legion Deserter (15 Block at the start of every fight) and Catalyst (stronger reactions). Tap Awaken.", wait: 'aw-ok' },
  { scr: 'draft', pos: 'bottom', text: 'Choose 3 starting skills; the coloured tags are archetypes. Try Firebolt, Venom Blade and Iron Guard: Burn on a Poisoned target sets off a reaction.', wait: 'draft-ok' },
  { scr: 'choose', pos: 'bottom', hl: '.opps', text: 'Every round you choose your opponent. The Hard one pays more, a rune and a rare shop piece, but losing to it costs an extra Heart. Hearts are your world: run out and it is erased.', wait: 'next' },
  { scr: 'choose', pos: 'top', hl: '.wager', text: 'Gods offer wagers on your fight: stake 5 gold on a condition, win 10 back and their Favour. Leave this one.', wait: 'next' },
  { scr: 'choose', pos: 'top', hl: '[data-act="pick-opp"][data-i="0"]', text: 'Tap the Goblin to face it.', wait: 'pick-opp' },
  { scr: 'district', pos: 'bottom', hl: '.inter', text: "Before the shop, visit one district. Scout's Post shows what your opponent will do two moves ahead. Pick one.", wait: 'district' },
  { scr: 'shop', pos: 'bottom', hl: '.achips', text: 'Archetype counters. Equip 2, 4 or 6 pieces of one archetype for its bonuses. Tap a counter any time to read them.', wait: 'next' },
  { scr: 'shop', pos: 'bottom', hl: '.shoptabs', text: 'There are two shops: Skills and Gear. Each has 5 slots and its own reroll. A badge on the tab tells you when it holds copies of things you own.', wait: 'next' },
  { scr: 'shop', pos: 'bottom', hl: '.tile.merge, .tile.owned', text: 'Glowing tiles are copies of pieces you own; the dots show how many you have. Three copies merge into ★2 with +50% power. Copies get a Buy button of their own. Buy both Firebolts.', until: () => ownsStar('firebolt', 2) },
  { scr: 'shop', pos: 'bottom', hl: '[data-act="shop-tab"][data-k="gear"]', text: 'Merged! Now open the Gear shop. Gear gives stats and one passive, and counts toward archetypes too.', wait: 'shop-tab' },
  { scr: 'shop', pos: 'bottom', hl: '.shopgrid', text: 'Buy the Ember Gauntlets: Burn you apply +2, and another Pyre piece.', until: () => allPieces(run).some(p => p.id === 'ember_gauntlets') },
  { scr: 'shop', pos: 'bottom', hl: '.shoptabs .btn, .xptile', text: 'Rerolling costs 2 gold. Buying XP levels you up, and higher levels find rarer pieces. Gold you keep earns interest: +1 for every 10, up to 3.', wait: 'next' },
  { scr: 'shop', pos: 'bottom', hl: '.barrow, .gearrow', text: 'Your skill bar and gear. Tap any piece to see it, swap it with your bench, or sell it. When you are ready, tap Fight.', wait: 'shop-done' },
  { scr: 'fight', pos: 'mid', hl: '#intent', text: "The opponent's next move is always shown here. Red means a big hit is coming.", wait: 'next' },
  { scr: 'fight', pos: 'mid', hl: '#skills', text: 'Tap a skill to use it. Numbers include your stats and stars. Used skills go on cooldown for a few turns; Attack never does.', wait: 'next' },
  { scr: 'fight', pos: 'mid', hl: '#skills', text: 'Use Venom Blade first, then Firebolt: Burn landing on a Poisoned target triggers the reaction Toxic Flare.', until: () => ui.fight && (ui.fight.tally.reactions > 0 || ui.fight.over), skippable: true },
  { scr: 'fight', pos: 'mid', text: 'Reaction! There are six to discover. Now finish the fight, and use Iron Guard when a big hit is coming.', until: () => ui.fight && ui.fight.over, skippable: true },
  { scr: 'choose', pos: 'top', hl: '.opps', text: 'Round 2. Take the Hard option for a rune if you are healthy, or play it safe.', wait: 'pick-opp' },
  { scr: 'district', pos: 'bottom', text: 'Pick a district, then shop.', wait: 'district' },
  { scr: 'shop', pos: 'bottom', hl: '.shopgrid', text: 'Two Venom Blades this time. Build however you like, then tap Fight. Watch for big hits: Block soaks them, and Stun or Interrupt cancel them.', wait: 'shop-done' },
  { scr: 'choose', pos: 'top', hl: '.opps', text: 'Last practice round: a rival. Rivals are named champions with their own tricks. Everything else is yours to try.', wait: 'pick-opp' },
];
let realMeta = null;
function startPractice() {
  ui.daily = null;
  realMeta = meta;
  const pm = newMeta(); pm.unlocks = Object.assign({}, realMeta.unlocks);
  bindMeta(pm);
  const w = Object.assign({}, PRACTICE.world);
  ui.worlds = [w]; ui.world = 0;
  ui.aw = Object.assign(newAw(w), { name: PRACTICE.setup.name, sigil: PRACTICE.setup.sigil, color: PRACTICE.setup.color, stats: Object.assign({}, PRACTICE.setup.stats), pts: 0, gifts: PRACTICE.setup.gifts.slice(), patron: PRACTICE.setup.patron, offer: {}, practice: true });
  ui.coach = { i: 0 }; run = null; ui.end = null;
  go('awaken');
}
function practiceMeta() { return META || meta; }
function endPractice(done) {
  ui.coach = null; ui.fight = null; ui.sheet = null;
  bindMeta(realMeta || meta); realMeta = null;
  const first = !meta.tutorialDone;
  meta.tutorialDone = true;
  if (done && first) { meta.echoes += 5; toast('[Practice complete. +5 Echoes.]', 'level'); }
  saveMeta(); run = null;
  go('title');
}
function coachStep() { return ui.coach && COACH[ui.coach.i]; }
function coachAdvance() { if (!ui.coach) return; ui.coach.i++; if (ui.coach.i >= COACH.length) ui.coach.done = true; }
function coachHTML() {
  if (!ui.coach) return '';
  let st = coachStep();
  while (st && st.until && st.until() && ui.screen === st.scr) { coachAdvance(); st = coachStep(); }
  const skipBtn = ui.coach.confirmSkip ? `<button class="link danger-t" data-act="coach-skip-yes">Yes, end the practice run</button>` : `<button class="link" data-act="coach-skip">Skip tutorial</button>`;
  if (!st || st.scr !== ui.screen || (ui.sheet && ui.sheet.type !== 'menu') || (run && run.pending.length && ['choose', 'shop', 'district'].includes(ui.screen))) return ui.coach.confirmSkip ? `<div class="coach pos-bottom"><p>End the practice run?</p><div class="co-f">${skipBtn}<button class="link" data-act="coach-skip-no">Keep going</button></div></div>` : '';
  if (ui.coach.min) return `<button class="coach-pill" data-act="coach-max">[Tutorial] ▴</button>`;
  return `<div class="coach pos-${st.pos || 'bottom'}" role="status"><div class="co-h"><span class="eyebrow">[Tutorial]</span><button class="link" data-act="coach-min" aria-label="Minimise the tutorial">Hide ▾</button></div><p>${esc(st.text)}</p><div class="co-f">${skipBtn}${st.wait === 'next' || st.skippable ? `<button class="btn small primary" data-act="coach-next">${st.wait === 'next' ? 'Next' : 'Got it'}</button>` : ''}</div></div>`;
}
function coachHighlight() {
  document.querySelectorAll('.coach-hl').forEach(e => e.classList.remove('coach-hl'));
  const st = coachStep(); if (!st || !st.hl || st.scr !== ui.screen || ui.sheet) return;
  const els = document.querySelectorAll(st.hl); for (let k = 0; k < Math.min(els.length, 6); k++) els[k].classList.add('coach-hl');
}
function practiceDoneSheet() {
  return sheetWrap('[Practice complete]', `<p class="sh-p big">That is the loop: choose an opponent, shop, visit a district, fight.</p>
    <ul class="msgs plain"><li>A real tournament has 8 rounds and a Final Champion for each world.</li><li>You'll also meet Titles, System quests, Hidden Paths, event chains and the Additional Gift after round 4.</li><li>Lose all your Hearts and your world is erased; its champion will come back to face you.</li></ul>
    <p class="sh-p fine">${meta.tutorialDone ? 'You can replay the practice run from the title screen.' : '+5 Echoes for finishing.'}</p>`, `<button class="btn ghost" data-act="practice-end">Title screen</button><button class="btn primary" data-act="practice-tournament">Enter the tournament</button>`, 'win', true);
}
function firstTimeSheet() {
  return sheetWrap('[New entrant detected]', `<p class="sh-p big">First time in the tournament?</p><p class="sh-p">The practice run teaches the basics in 3 short rounds with the System guiding you. It takes about 5 minutes and you can skip it at any point.</p>`, `<button class="btn ghost" data-act="skip-practice">Skip, enter the tournament</button><button class="btn primary" data-act="practice">Practice run</button>`, 'sys');
}
const _onAct = onAct;
onAct = function (el) {
  const a = el.dataset.act;
  if (a === 'coach-next') { coachAdvance(); return render(); }
  if (a === 'coach-skip') { ui.coach.confirmSkip = true; return render(); }
  if (a === 'coach-min') { ui.coach.min = true; return render(); }
  if (a === 'coach-max') { ui.coach.min = false; return render(); }
  if (a === 'coach-skip-no') { ui.coach.confirmSkip = false; return render(); }
  if (a === 'coach-skip-yes') return endPractice(false);
  if (a === 'practice') { ui.sheet = null; return startPractice(); }
  if (a === 'skip-practice') { meta.tutorialDone = true; saveMeta(); ui.sheet = null; return _onAct({ dataset: { act: 'new' } }); }
  if (a === 'practice-end') return endPractice(true);
  if (a === 'practice-tournament') { endPractice(true); return _onAct({ dataset: { act: 'new' } }); }
  if (a === 'new' && !meta.tutorialDone && !ui.practiceAsked) { ui.practiceAsked = true; ui.sheet = { type: 'firsttime' }; return render(); }
  const st = coachStep();
  _onAct(el);
  if (st && coachStep() === st && st.wait === a) { coachAdvance(); render(); }
};

// ---------- Cloud: synced progress and shared champions ----------
// Everything here is optional: without a signed-in viewer the game runs on local storage alone.
const cloud = { db: null, user: null, uid: null, on: false, syncOff: false, shareOff: false, tester: null, names: {}, timer: null, pushing: false, again: false, shared: [], status: 'local' };
const jsonSafe = x => JSON.parse(JSON.stringify(x));
const FIREBASE = !!window.FIREBASE_CONFIG;
// The name other players see on shared champions and laid-to-rest notes. It is chosen in game (by default the
// latest champion's name), never taken from the sign-in account, so no real name or email reaches other players.
function publicName() {
  const last = meta.champions.concat(meta.erased).sort((a, b) => b.at - a.at)[0];
  return String(meta.handle || (last && last.name) || 'Entrant').trim().slice(0, 18) || 'Entrant';
}
// Keeps the shared documents on the current public name. Also replaces names written by older versions,
// which used the first word of the Google account name. Reads only when the name has changed.
async function syncPublicName() {
  if (!meta.handle && (meta.champions.length || meta.erased.length)) { meta.handle = publicName(); saveMeta(); }
  const name = publicName(); if (window.WPD_CLOUD) window.WPD_CLOUD.handle = name;
  if (!FIREBASE || !cloud.on || meta.pubName === name) return;
  if (cloud.tester === false) return requestAccess();
  try {
    for (const path of ['champions/' + cloud.uid, 'rests/' + cloud.uid]) {
      const ref = cloud.db.doc(path), cur = await ref.get();
      if (cur.exists) { const d = Object.assign({}, cur.data()); delete d.name; await ref.set(d); }
    }
    meta.pubName = name; saveMeta();
  } catch (e) { cloudFail('share', 'update public name', e); }
}
// Approved playtesters write to shared data (scores, shared champions, laid-to-rest notes); everyone else still plays
// and keeps their own cloud save. tester is null when it can't be checked (rules from before the list), and then
// writes go ahead and the rules decide. A tester is a testers/{uid} document added in the Firebase console.
const PENDING = '[Entry pending approval.]';
const canShare = () => cloud.on && !cloud.shareOff && cloud.tester !== false;
async function checkTester() {
  if (!FIREBASE) return;
  try { cloud.tester = (await cloud.db.doc('testers/' + cloud.uid).get()).exists; } catch (e) { cloud.tester = null; return; }
  if (cloud.tester) return;
  await requestAccess();
  if (!meta.pendingTold) { meta.pendingTold = true; saveMeta(); toast('[Entry pending approval. Your progress still saves to your account.]', 'sys'); }
}
// The request carries the UID (its document name) and the in-game name only. Only the player and the console read it.
async function requestAccess() {
  if (!cloud.on || cloud.tester !== false) return;
  const ref = cloud.db.doc('requests/' + cloud.uid), name = publicName();
  try { const cur = await ref.get(); if (!cur.exists || cur.data().name !== name) await ref.set({ name, at: Date.now() }); }
  catch (e) { console.warn('[cloud] access request failed:', e && e.code, e); }
}
async function cloudInit() {
  try {
    let db, user;
    if (FIREBASE) {
      const C = window.WPD_CLOUD; if (!C || !C.me) return;
      db = C.db; user = C.user;
    } else {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    }
    if (!db || !user) return;
    const uid = await user.id(); if (!uid) return;
    Object.assign(cloud, { db, user, uid, on: true, status: 'syncing' });
    await pullProgress();
    await checkTester();
    await syncPublicName();
    await loadShared();
    await checkRests();
    postDaily();
    postRuns();
    postFeedback();
    if (cloud.status === 'syncing') cloud.status = 'synced';
    render();
  } catch (e) { cloud.status = 'local'; cloudFail('sync', 'connect', e); }
}
// Cloud errors: always logged; the player sees one notice per kind per session, so friends can report it
const CLOUD_FAIL_TEXT = { sync: 'Cloud save failed. Your progress is kept on this device.', share: 'Shared champions could not be reached.', board: 'Pending World scores could not be reached.' };
function cloudFail(kind, where, e) {
  const code = (e && e.code) || 'unknown';
  console.warn(`[cloud] ${where} failed:`, code, e);
  if (code === 'unavailable') return; // network drop: expected, saves retry and stay on the device
  cloud.failShown = cloud.failShown || {}; if (cloud.failShown[kind]) return;
  cloud.failShown[kind] = true; toast(`[${CLOUD_FAIL_TEXT[kind]} (${code})]`, 'loss');
}
function progressDoc() { return cloud.db.doc('data/users/' + cloud.uid + '/progress'); }
async function pullProgress() {
  let snap;
  try { snap = await progressDoc().get(); } catch (e) { cloud.syncOff = true; cloud.status = 'local'; cloudFail('sync', 'load progress', e); return; }
  const r = snap.exists ? snap.data() : null;
  let changed = false;
  if (r && r.meta && (r.meta.savedAt || 0) > (meta.savedAt || 0) && !realMeta) {
    meta = migrateMeta(jsonSafe(r.meta)); bindMeta(meta); lsSet(META_KEY, meta); changed = true;
  }
  const localRun = lsGet(RUN_KEY);
  if (r && r.run && r.run.v === VERSION && !r.run.ended && (!localRun || (r.run.savedAt || 0) > (localRun.savedAt || 0)) && ui.screen === 'title') {
    lsSet(RUN_KEY, r.run); changed = true;
  }
  if (changed) toast('[Progress synced from your account.]', 'sys');
  if (!r || (meta.savedAt || 0) > ((r.meta && r.meta.savedAt) || 0) || (localRun && (localRun.savedAt || 0) > ((r.run && r.run.savedAt) || 0))) schedulePush();
}
function schedulePush() {
  if (!cloud.on || cloud.syncOff || realMeta) return;
  clearTimeout(cloud.timer); cloud.timer = setTimeout(pushProgress, FIREBASE ? 5000 : 2000);
}
async function pushProgress() {
  if (cloud.pushing) { cloud.again = true; return; }
  cloud.pushing = true;
  try {
    const r = lsGet(RUN_KEY);
    await progressDoc().set(jsonSafe({ meta, run: r && !r.ended && !r.practice ? r : null, savedAt: Date.now() }));
    cloud.status = 'synced';
  } catch (e) {
    if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) { cloud.syncOff = true; cloud.status = 'local'; }
    else if (e && e.code === 'unavailable') setTimeout(schedulePush, 4000 + Math.random() * 3000);
    cloudFail('sync', 'save progress', e);
  }
  cloud.pushing = false;
  if (cloud.again) { cloud.again = false; schedulePush(); }
}
async function resolveNames(ids) {
  ids = ids.filter(id => id && !(id in cloud.names)); if (!ids.length || !cloud.user) return;
  try { const ps = await cloud.user.profiles(ids); ids.forEach(id => cloud.names[id] = (ps[id] && ps[id].name) || ''); } catch (e) { console.warn('[cloud] names failed:', e && e.code, e); }
}
function ownerName(id) { return cloud.names[id] || 'another entrant'; }
// Shared champions: read a random handful of players' documents, not the whole collection.
// Each champions document carries a random key r in [0, 1); we start at a random point and wrap around.
const SHARED_SAMPLE = 8;
async function sampleChampions() {
  const col = cloud.db.collection('champions');
  if (!col.query) return (await col.get()).docs;
  const x = Math.random(), n = SHARED_SAMPLE + 1; // +1: our own document may be among them
  const a = (await col.query({ where: ['r', '>=', x], orderBy: 'r', limit: n })).docs;
  const b = a.length < n ? (await col.query({ where: ['r', '<', x], orderBy: 'r', limit: n - a.length })).docs : [];
  return a.concat(b);
}
// Documents written before the random key existed are invisible to the sample until they get one
async function ensureChampionKey() {
  if (meta.champKey === cloud.uid) return;
  const ref = cloud.db.doc('champions/' + cloud.uid), cur = await ref.get();
  if (cur.exists && typeof cur.data().r !== 'number') await ref.set({ list: cur.data().list || [], r: Math.random() });
  meta.champKey = cloud.uid; saveMeta();
}
async function loadShared() {
  if (!cloud.on) return;
  try {
    if (cloud.db.collection('champions').query && canShare()) await ensureChampionKey();
    const docs = await sampleChampions();
    const erased = [], spared = [], all = [];
    docs.forEach(d => {
      if (d.id === cloud.uid) return;
      const body = d.data() || {}; (Array.isArray(body.list) ? body.list : []).slice(0, 12).forEach(e => {
        const s = sanitizeSnap(e && e.snap, d.id); if (!s) return;
        (e.kind === 'spared' ? spared : erased).push(s); all.push({ kind: e.kind === 'spared' ? 'spared' : 'erased', snap: s });
      });
    });
    setShared(erased, spared); cloud.shared = all;
    await resolveNames(all.map(x => x.snap.owner));
  } catch (e) { cloudFail('share', 'load shared champions', e); }
}
async function shareChampion(snap, kind) {
  if (!canShare()) return false;
  const ref = cloud.db.doc('champions/' + cloud.uid);
  try {
    const cur = await ref.get();
    const list = cur.exists && Array.isArray(cur.data().list) ? cur.data().list.slice() : [];
    if (!list.some(e => e.snap && e.snap.at === snap.at)) list.unshift({ kind, snap: jsonSafe(snap), t: Date.now() });
    const r = cur.exists && typeof cur.data().r === 'number' ? cur.data().r : Math.random();
    await ref.set({ list: list.slice(0, 12), r });
    meta.shared = meta.shared || {}; meta.shared[snap.at] = true; saveMeta();
    return true;
  } catch (e) { if (e && e.code === 'invalid_argument') cloud.shareOff = true; cloudFail('share', 'share champion', e); return false; }
}
// "Laid to rest" notes go straight into the champion owner's inbox, so each player reads only notes addressed to them
async function recordRest(r) {
  if (!canShare() || !r.owner || r.owner === cloud.uid) return;
  const t = Date.now();
  const note = { by: cloud.uid, champ: String(r.champ).slice(0, 60), t };
  if (r.at) note.at = r.at; if (r.rank) note.rank = r.rank;
  const ref = cloud.db.doc(`inbox/${r.owner}/notes/${cloud.uid}_${t}`);
  try { await ref.set(note).catch(e => { if (note.at && e && e.code === 'invalid_argument') return ref.set({ by: note.by, champ: note.champ, t }); throw e; }); }
  catch (e) { cloudFail('share', 'record rest', e); }
}
// The other half of champion rank: tell the owner their shared champion beat you
async function recordWin(r) {
  if (!canShare() || !r.owner || r.owner === cloud.uid || !r.at) return;
  const t = Date.now();
  try { await cloud.db.doc(`inbox/${r.owner}/notes/${cloud.uid}_${t}`).set({ by: cloud.uid, champ: String(r.champ).slice(0, 60), t, at: r.at, won: true }); }
  catch (e) { cloudFail('share', 'record win', e); }
}
// After a champion ranks up, its shared copy is updated so other Entrants see the new letter
async function reshare(snaps) {
  if (!canShare() || !snaps.length) return;
  const ref = cloud.db.doc('champions/' + cloud.uid);
  try {
    const cur = await ref.get(); if (!cur.exists || !Array.isArray(cur.data().list)) return;
    const list = cur.data().list.map(e => { const s = e.snap && snaps.find(x => x.at === e.snap.at); return s ? Object.assign({}, e, { snap: jsonSafe(s) }) : e; });
    await ref.set({ list, r: typeof cur.data().r === 'number' ? cur.data().r : Math.random() });
  } catch (e) { cloudFail('share', 'update shared champion', e); }
}
async function checkRests() {
  if (!cloud.on) return;
  try {
    const seen = meta.restSeen || 0, col = cloud.db.collection(`inbox/${cloud.uid}/notes`);
    const qs = col.query ? await col.query({ where: ['t', '>', seen], orderBy: 't', limit: 30 }) : await col.get();
    const notes = [];
    qs.docs.forEach(d => { const e = d.data() || {}; if (e.by && e.by !== cloud.uid && Number(e.t) > seen) notes.push({ by: e.by, champ: String(e.champ || 'Your champion').slice(0, 60), t: Number(e.t), at: Number(e.at) || 0, won: e.won === true, rank: rankIdx(e.rank) >= 0 ? e.rank : null }); });
    if (!notes.length) return;
    await resolveNames(notes.filter(n => !n.won).map(n => n.by));
    const ranked = [];
    notes.sort((a, b) => a.t - b.t).forEach(n => {
      if (n.won) {
        const sp = meta.champions.find(s => s.at === n.at), s = sp || meta.erased.find(x => x.at === n.at); if (!s) return;
        const before = s.rank, line = champWin(s, !!sp); if (line) logToast(line);
        if (s.rank !== before && meta.shared && meta.shared[s.at] && !ranked.includes(s)) ranked.push(s);
        return;
      }
      meta.echoes += 3; logToast(`[${n.champ} was laid to rest by ${ownerName(n.by)}.${n.rank ? ` Final rank: ${n.rank}.` : ''} +3 Echoes.]`);
    });
    reshare(ranked);
    meta.restSeen = Math.max(...notes.map(n => n.t)); saveMeta();
  } catch (e) { cloudFail('share', 'check rests', e); }
}
function logToast(text) { toast(text, 'broadcast'); }
// Web version: Firebase sign-in state
window.addEventListener('wpd-auth', e => {
  if (e.detail && e.detail.signedIn) { if (!cloud.on) cloudInit(); }
  else { clearTimeout(cloud.timer); Object.assign(cloud, { db: null, user: null, uid: null, on: false, syncOff: false, shareOff: false, tester: null, shared: [], status: 'local' }); ui.board = null; setShared([], []); render(); }
});
function cloudSignInHTML(compact) {
  const provs = (window.FIREBASE_PROVIDERS || ['google', 'github']).filter(k => k === 'google' || k === 'github');
  if (!FIREBASE) return '';
  const C = window.WPD_CLOUD;
  if (C && C.error) return compact ? '' : '<p class="sh-p fine">Cloud saves are unavailable right now (offline?). Progress is saved on this device.</p>';
  if (cloud.on) return compact ? '' : `<div class="cloudbox"><p class="sh-p">Signed in as <b>${esc(publicName())}</b>. Progress syncs across your devices.</p><label class="fld"><span>Name other players see</span><input id="cloud-name" maxlength="18" value="${esc(publicName())}" autocomplete="off"></label><p class="sh-p fine">Your account name and email are never shown to other players.</p>${cloud.tester === false ? `<p class="sh-p sysl">${PENDING}</p><p class="sh-p fine">Your request is filed under this name. Daily scores and shared champions open once you are approved.</p>` : ''}<button class="btn small ghost" data-act="signout">Sign out</button></div>`;
  return `<div class="cloudbox ${compact ? 'compact' : ''}">${compact ? '' : '<p class="sh-p">Sign in to save your progress to the cloud, play on any device, and share champions with other players.</p>'}<div class="${provs.length > 1 ? 'row2 even' : 'stack'}">${provs.map(k => `<button class="btn ${compact ? 'small' : ''}" data-act="signin" data-k="${k}">Sign in with ${k === 'github' ? 'GitHub' : 'Google'}</button>`).join('')}</div></div>`;
}

app.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled) onAct(el); });
app.addEventListener('input', e => { if (e.target.id === 'aw-name' && ui.aw) { ui.aw.name = e.target.value; const b = app.querySelector('[data-act="aw-ok"]'); if (b) { render(); } } });
app.addEventListener('input', e => { if (e.target.id === 'fb-text' && ui.fb) ui.fb.text = e.target.value; });
app.addEventListener('change', e => { if (e.target.id === 'fb-attach' && ui.fb) ui.fb.attach = e.target.checked; if (e.target.id === 'cloud-name') { meta.handle = e.target.value.trim().slice(0, 18); saveMeta(); syncPublicName(); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ui.sheet && !['result'].includes(ui.sheet.type)) { ui.sheet = null; render(); }
  if (ui.screen === 'fight' && !ui.sheet && /^[1-6]$/.test(e.key)) { const n = +e.key; const i = n === run.slots + 1 ? 0 : n; onUse(i); }
});
render();
maybeShowNews();
cloudInit();
