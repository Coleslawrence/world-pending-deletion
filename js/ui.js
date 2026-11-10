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
registerGlitchGear(run); // Spliced gear is made on demand, so a reload makes the run's again
if (run && run.bought == null) run.bought = Math.max(0, (run.level - 1) * 2);
if (run && Array.isArray(run.shop)) { run.shop = null; run.locks = null; refreshShop(run); }
if (run && !run.quests) Object.assign(run, { quests: [], chains: {}, milestones: {}, title: null, hiddenPath: null, wagersWon: 0, freeRerolls: 0, haggle: false, entrant: 100 + (meta.runs || 0), extraGiven: run.round >= 5, earned: [] });
ensureRecord(run);
const ui = { screen: 'title', worlds: null, seed: '', world: null, aw: null, draftSel: [], sheet: null, fight: null, busy: false, info: false, speed: [1, 2, 3].includes(lsGet('wpd-speed')) ? lsGet('wpd-speed') : 1, end: null, result: null, enchantSel: null, enchantMods: null, confirmAbandon: false, pick: null, distDone: null };
if (run) ui.screen = stageScreen();
if (hot && hot.snapshot) hot.snapshot(() => ({ run }));
function saveRun() { if (run && !run.ended && !run.practice) { run.savedAt = Date.now(); lsSet(RUN_KEY, run); if (typeof schedulePush === 'function') schedulePush(); } }
function saveMeta() { if (typeof realMeta !== 'undefined' && realMeta) return; meta.savedAt = Date.now(); lsSet(META_KEY, meta); if (typeof schedulePush === 'function') schedulePush(); }
function stageScreen() { if (run.startPts != null && run.stage === 'choose') return 'kitstats'; return { draft: 'draft', choose: 'choose', district: 'district', shop: 'shop', ready: 'shop' }[run.stage] || 'choose'; }

// ---------- Toasts ----------
// Notices wait their turn instead of pushing each other off screen: a few show at once, each stays long enough to
// read (longer lines stay longer), and a tap clears one early so the next comes in. Missed ones are in the System log.
// Each can name its cause (what you did that made it happen) above the line. Big ones (Hearts, levels, quests, Notice,
// broadcasts) stay until tapped, outside fights, so nothing that matters goes by unread.
const toastQ = [];
const toastMs = (text, t) => Math.min(9000, 2400 + text.length * 45) + (t === 'broadcast' ? 1200 : 0);
const bigToast = (text, t) => ['level', 'class', 'broadcast', 'merge'].includes(t) || /Heart/.test(text);
// Repeats of the same kind of notice from the same cause merge into one card (training 6 times shows the newest
// level, not 6 cards). Only one tap-to-dismiss card shows at a time, with a count of the ones waiting behind it,
// and none show while a sheet is open, so they never stack over the shop.
const STAY_MAX = 1;
const toastKey = (text, t, cause) => t + '|' + (cause || '') + '|' + text.replace(/\d+/g, '#');
function toast(text, t = 'sys', onTap, cause) {
  const key = toastKey(text, t, cause);
  const q = toastQ.find(x => x.key === key); if (q) { q.text = text; q.onTap = onTap || q.onTap; return; }
  const el = [...toastsEl.querySelectorAll('.toast:not(.out)')].find(x => x.key === key);
  if (el) { el.querySelector('.msg').textContent = text; el.onTap = onTap || el.onTap; if (el.timer) { clearTimeout(el.timer); el.timer = setTimeout(() => dropToast(el), toastMs(text, t)); } return; }
  toastQ.push({ text, t, onTap, cause, key }); pumpToasts();
}
const isStay = x => ui.screen !== 'fight' && bigToast(x.text, x.t);
function pumpToasts() {
  if (!pumpToasts.gap) {
    const under = toastsEl.classList.contains('under'), live = [...toastsEl.querySelectorAll('.toast:not(.out)')];
    const stays = live.filter(x => x.classList.contains('stay')).length, cap = ui.screen === 'fight' ? 2 : 3;
    const i = toastQ.findIndex(x => !isStay(x) || (!under && stays < STAY_MAX));
    if (i >= 0 && live.length < cap) { showToast(toastQ.splice(i, 1)[0]); pumpToasts.gap = setTimeout(() => { pumpToasts.gap = null; pumpToasts(); }, 280); }
  }
  waitCount();
}
function showToast(Q) {
  const { text, t, onTap, cause, key } = Q, stay = isStay(Q);
  const el = document.createElement('div'); el.className = 'toast t-' + t + (stay ? ' stay' : ''); el.onTap = onTap; el.key = key; el.q = Q;
  if (cause) { const c = document.createElement('small'); c.className = 'cause'; c.textContent = cause; el.appendChild(c); }
  const m = document.createElement('span'); m.className = 'msg'; m.textContent = text; el.appendChild(m);
  if (stay) { const x = document.createElement('span'); x.className = 'tx'; x.setAttribute('aria-hidden', 'true'); x.textContent = '×'; el.appendChild(x); const w = document.createElement('small'); w.className = 'wait'; el.appendChild(w); }
  placeToasts(); toastsEl.appendChild(el);
  if (!stay) el.timer = setTimeout(() => dropToast(el), toastMs(text, t));
}
// The tap-to-dismiss card says how many more are waiting behind it
function waitCount() {
  const n = toastQ.filter(isStay).length;
  toastsEl.querySelectorAll('.toast.stay:not(.out) .wait').forEach(w => { w.textContent = n ? `[${n} more notice${n > 1 ? 's' : ''} after this]` : ''; });
}
// A sheet opened: waiting cards go back to the front of the queue (not hidden in place) and come back when it closes
function setUnder(on) {
  if (toastsEl.classList.contains('under') === on) return;
  toastsEl.classList.toggle('under', on);
  if (on) [...toastsEl.querySelectorAll('.toast.stay:not(.out)')].reverse().forEach(el => { toastQ.unshift(el.q); el.remove(); });
  pumpToasts();
}
function dropToast(el) { if (el.classList.contains('out')) return; clearTimeout(el.timer); el.classList.add('out'); setTimeout(() => { el.remove(); pumpToasts(); }, 350); pumpToasts(); }
function clearToasts() { toastQ.length = 0; toastsEl.querySelectorAll('.toast').forEach(el => clearTimeout(el.timer)); toastsEl.replaceChildren(); }
toastsEl.addEventListener('click', e => { const el = e.target.closest('.toast'); if (!el) return; dropToast(el); if (el.onTap) el.onTap(); });
// In a fight, toasts sit below the foe panel so they never cover the enemy's name or HP
// Long world and champion names: drop a size first, then wrap to 2 lines, so nothing is cut at 320 wide
// A champion's short name for tight spots: the name before a title ("Oringe waan the Unbowed" -> "Oringe waan")
function shortName(n) { const t = String(n || '').split(/\s+(?:the|of)\s+/i)[0].trim(); return t || n; }
function fitNames() {
  // World name in the top strip: two smaller steps before it is cut
  app.querySelectorAll('.strip .wname').forEach(el => { for (let k = 0; k < 2 && el.scrollWidth > el.clientWidth + 1; k++) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * 0.88).toFixed(1) + 'px'; });
  // Piece names in tiles: a long word drops a size or two instead of breaking between letters
  app.querySelectorAll('.tl-n').forEach(el => {
    el.classList.add('whole');
    for (let k = 0; k < 3 && el.scrollWidth > el.clientWidth + 1; k++) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * 0.92).toFixed(1) + 'px';
    if (el.scrollWidth > el.clientWidth + 1) { el.classList.remove('whole'); el.style.fontSize = ''; }
  });
  app.querySelectorAll('.fo-name, .me-name').forEach(el => {
    if (el.scrollWidth <= el.clientWidth + 1) return;
    el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * 0.86).toFixed(1) + 'px';
    if (el.scrollWidth > el.clientWidth + 1) el.classList.add('fit2');
  });
}
// Short archetype tags for the shop chips on narrow phones
const ARCH_TAG = { pyre: 'PYR', venom: 'VEN', blade: 'BLD', bastion: 'BAS', arcanist: 'ARC', zealot: 'ZEA', reaper: 'REA', storm: 'STM', dicer: 'GMB', jinx: 'JNX' };
// Fights: under the opponent's panel. Elsewhere: just above the bottom buttons (or an open sheet's), clear of the
// header and the screen's instructions
function placeToasts() {
  const foe = ui.screen === 'fight' && !ui.sheet && document.getElementById('foe');
  if (foe) { toastsEl.style.top = `${foe.getBoundingClientRect().bottom + 6}px`; toastsEl.style.bottom = ''; toastsEl.classList.remove('low'); return; }
  const sh = document.querySelector('.sheet'), foot = document.querySelector('.coach.pos-bottom') ? null : sh ? sh.querySelector('.sh-f') : document.querySelector('main .foot2, main .foot');
  const r = foot && foot.getBoundingClientRect();
  if (!r || !r.height) { toastsEl.style.top = ''; toastsEl.style.bottom = ''; toastsEl.classList.remove('low'); return; }
  toastsEl.style.top = 'auto'; toastsEl.style.bottom = `${Math.max(8, window.innerHeight - r.top + 8)}px`; toastsEl.classList.add('low');
}
// A sheet slides up when it opens: notices placed during the slide sat too low, over its buttons, so place them again
document.addEventListener('animationend', e => { if (e.target.classList && e.target.classList.contains('sheet')) placeToasts(); });
function logRun(text, t) { if (!run) return; run.log.push({ text, t: t || 'sys' }); if (run.log.length > 40) run.log.shift(); }
const TOAST_RANK = { win: -1, broadcast: 0, merge: 1, class: 1, level: 2, favour: 3, skill: 4, loot: 5, loss: 6, sys: 7 };
const TOAST_MAX = 5;
// cause: what the player did, shown above each notice ("Bought Iron Fang", "Infirmary")
function pushMsgs(msgs, logged, cause) {
  if (!logged) msgs.forEach(m => logRun(m.text, m.t));
  const show = msgs.filter(m => !/^\[(Erasing|World): /.test(m.text)).sort((a, b) => (TOAST_RANK[a.t] ?? 9) - (TOAST_RANK[b.t] ?? 9));
  show.slice(0, TOAST_MAX).forEach(m => toast(m.text, m.t, null, cause));
  const more = show.length - TOAST_MAX;
  if (more > 0 && run) toast(`[${more} more in the System log. Tap to read.]`, 'sys', openLog);
}
function openLog() { if (!run || ui.screen === 'fight' || (ui.sheet && ['result', 'note'].includes(ui.sheet.type))) return; ui.sheet = { type: 'syslog' }; render(); }

// A number in the top strip that changed since the last screen pulses (green up, red down), so you see what a result
// touched. Held while a result sheet covers the strip, so the pulse plays when you can see it.
function pulseChanged() {
  if (!run || !document.querySelector('.strip') || (ui.sheet && ['evresult', 'result', 'note'].includes(ui.sheet.type))) return;
  const now = { run, gold: run.gold, hearts: run.hearts, hp: Math.round(run.hp), notice: noticeOf(run) }, was = ui.pv; ui.pv = now;
  if (!was || was.run !== run) return;
  const sel = { gold: '.strip .gold', hearts: '.strip .hcount', hp: '.strip .st-hp', notice: '.ntc' };
  Object.keys(sel).forEach(k => { if (now[k] === was[k]) return; const el = document.querySelector(sel[k]); if (el) el.classList.add('pulse', (k === 'notice' ? now[k] < was[k] : now[k] > was[k]) ? 'up' : 'down'); });
}
// ---------- Small helpers ----------
const KIND_LABEL = { monster: 'Qualifier', rival: 'Rival', final: 'Final Champion', erased: 'Erased champion', legend: 'Legend', champion: 'Past champion', trial: 'Rank Trial', entrant: 'Filed record' };
function initials(name) { const w = name.replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(x => x && !['the', 'of'].includes(x.toLowerCase())); return ((w[0] || '?')[0] + (w[1] ? w[1][0] : '')).toUpperCase(); }
// S3: opponents without a champion's sigil get a face of their own: a mark drawn from their name, always the same
// for the same name, so a rival or a monster is recognisable when it comes back.
const GSIG_COLS = ['#e6ff2e', '#ff2e9a', '#72d0ff', '#ffb257', '#9fd86a', '#c27ce6', '#efe6d8', '#ff6b62'];
function genSigil(name) {
  let h = 2166136261; const str = String(name || '?'); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h >>>= 0;
  const pick = n => { const v = h % n; h = Math.floor(h / n) ^ ((h << 7) >>> 0); h >>>= 0; return v; };
  const sides = 3 + pick(5), star = pick(3) === 0, rot = pick(4) * (Math.PI / (sides * 2)), c1 = GSIG_COLS[pick(GSIG_COLS.length)]; let c2 = GSIG_COLS[pick(GSIG_COLS.length)]; if (c2 === c1) c2 = '#0b0b0d';
  const inner = pick(5), fill = pick(2) === 0;
  const pts = (n, r, r2, a0) => Array.from({ length: r2 ? n * 2 : n }, (_, i) => { const m = r2 ? n * 2 : n, a = a0 + i * 2 * Math.PI / m - Math.PI / 2, rr = r2 && i % 2 ? r2 : r; return (Math.cos(a) * rr).toFixed(1) + ',' + (Math.sin(a) * rr).toFixed(1); }).join(' ');
  const outer = `<polygon points="${pts(sides, 15, star ? 7.5 : 0, rot)}" fill="${fill ? c1 : 'none'}" stroke="${c1}" stroke-width="2.4" stroke-linejoin="round"/>`;
  const ic = fill ? '#0b0b0d' : c2;
  const mark = [
    `<circle r="4" fill="${ic}"/>`,
    `<circle r="5.5" fill="none" stroke="${ic}" stroke-width="2.2"/>`,
    `<path d="M-6 0H6M0 -6V6" stroke="${ic}" stroke-width="2.6" stroke-linecap="square"/>`,
    `<polygon points="${pts(3, 6, 0, rot + Math.PI)}" fill="${ic}"/>`,
    `<path d="M-6 -3H6M-6 3H6" stroke="${ic}" stroke-width="2.4"/>`][inner];
  return `<svg class="gsig" viewBox="-20 -20 40 40" aria-hidden="true">${outer}${mark}</svg>`;
}
function crest(name, kind, big, sig, rank) {
  const inner = sig ? `<span class="sig" style="color:${SIGIL_COLS[sig.color] || '#fff'}">${SIGILS[sig.sigil] || '✦'}</span>` : genSigil(name);
  return `<div class="crest k-${kind}${big ? ' big' : ''}" aria-hidden="true">${inner}${rank ? `<b class="crest-rk">${esc(rank)}</b>` : ''}</div>`;
}
function styleOf(spec) {
  if (spec.kind === 'entrant') return poolStyle(spec, spec.snap.owner ? ownerName(spec.snap.owner) : null);
  if (spec.kind === 'trial') return spec.cond ? 'Condition: ' + COND_TEXT[spec.cond] : 'No condition. Win to be promoted.';
  if (spec.snap && spec.snap.owner) return spec.kind === 'champion' ? `Saved ${spec.snap.worldName} in ${ownerName(spec.snap.owner)}'s tournament` : `Fell in ${ownerName(spec.snap.owner)}'s tournament, round ${spec.snap.round}`;
  return specStyle(spec);
}
// A flavour line (skills, gear, Gifts, Titles): the world's voice under the rules, never instead of them.
function flavHTML(f) { return f ? `<span class="flav">${esc(f)}</span>` : ''; }
// An opponent's Reflex (its one if-then rule, REFLEXES in enemies.js) leads the list, then its rolled traits
function hasReflex(spec) { return !!(spec && !spec.snap && spec.id && REFLEXES[spec.id] && !(run && run.practice)); }
function traitsHTML(spec) {
  const rows = (hasReflex(spec) ? reflexRules(spec.id).map((x, k) => `<span class="reflex"><b>Reflex:</b> ${esc(reflexText(spec.id, k))}</span>`) : []).concat((spec.traits || []).filter(k => TRAIT_POOL[k]).map(k => `<span${TRAIT_POOL[k].glitch ? ' class="glitch"' : ''}><b>${esc(TRAIT_POOL[k].name)}:</b> ${esc(TRAIT_POOL[k].desc)}</span>`));
  return rows.length ? `<div class="nx-traits">${rows.join('')}</div>` : '';
}
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
// The fight's header: the top strip's first row with speed and ? instead of gold and Log (nothing to spend mid-fight)
function fightBar(extra) {
  const hc = run.record ? `<button class="hcount" data-act="sheet" data-s="record" aria-label="${run.hearts} Hearts. Open the world record">♥${run.hearts}</button>` : `<span class="hcount" title="Hearts">♥${run.hearts}</span>`;
  return `<header class="strip fstrip"><div class="st-1"><span class="wname">${esc(run.world.name)}</span>${rankChip(run.world.rank)}<span class="st-sp"></span>${extra}${hc}<button class="icon-btn" data-act="menu" aria-label="Menu">≡</button></div>${stripProg()}</header>`;
}
function archChips(counts, small) {
  return `<div class="achips${small ? ' small' : ''}">${run.arch.map(k => { const n = counts[k] || 0, t = archTier(n), next = n >= 6 ? 6 : n >= 4 ? 6 : n >= 2 ? 4 : 2; return `<button class="achip a-${k} t${t}" style="--fill:${Math.min(100, Math.round(n / next * 100))}%" data-act="sheet" data-s="archetypes" aria-label="${ARCH[k].name}: ${n} pieces"><b>${n}</b><span><span class="dots2" aria-hidden="true"><i class="a-${k}"></i></span> <i class="an-l">${ARCH[k].name}</i><i class="an-s" aria-hidden="true">${ARCH_TAG[k] || ARCH[k].name.slice(0, 3).toUpperCase()}</i></span><small>/${next}</small></button>`; }).join('')}</div>`;
}
function playerPower(p) { const def = moddedDef(p.id, p.mods); return skillPower(def, effStats(run), p.star) * def.powerMult; }
// One top strip for the board screens (choose, district, shop): world and round, Hearts, gold, Log and menu on the
// first row; the champion, level and HP on the second (tap it for Stats); bracket progress as a segmented line.
function stripProg() {
  let h = '';
  for (let i = 1; i <= ROUNDS; i++) h += `<i class="${run.elite || i < run.round ? 'done' : i === run.round ? 'now' : ''}${i === ROUNDS ? ' fin' : ''}"></i>`;
  if (run.elite) run.eliteBracket.forEach((_, i) => { h += `<i class="elite ${i < run.eliteIdx ? 'done' : i === run.eliteIdx ? 'now' : ''}"></i>`; });
  return `<button class="st-prog" data-act="sheet" data-s="bracket" aria-label="${esc(roundLabel())}. Open the tournament bracket"><b>${esc(roundLabel())} ›</b>${h}</button>`;
}
function strip() {
  const mh = maxHp(run);
  const hc = run.record ? `<button class="hcount" data-act="sheet" data-s="record" aria-label="${run.hearts} Hearts. Open the world record">♥${run.hearts}</button>` : `<span class="hcount" title="Hearts">♥${run.hearts}</span>`;
  return `<header class="strip"><div class="st-1"><span class="wname">${esc(run.world.name)}</span>${rankChip(run.world.rank)}<span class="st-sp"></span>${hc}<span class="gold" title="Gold">${run.gold}g</span><button class="icon-btn logb" data-act="sheet" data-s="syslog" aria-label="System log: every message this run">Log</button><button class="icon-btn" data-act="menu" aria-label="Menu">≡</button></div>
    <button class="st-2" data-act="sheet" data-s="stats" aria-label="${esc(run.name)}, level ${run.level}, ${n0(run.hp)} of ${mh} HP. Open Stats">${crest(run.name, 'me', false, { sigil: run.sigil, color: run.color })}<span class="ch-name">${esc(shortName(run.name))}</span><span class="st-lv">Lv ${run.level}<span class="xp" aria-hidden="true"><i style="width:${lvFill()}%"></i></span></span><span class="st-hp">${n0(run.hp)}/${mh} HP</span>${hpBar(run.hp, mh, 'hp')}</button>${stripProg()}</header>`;
}

// ---------- World Record ----------
// A lost entry is a black bar the width of the words it hides
function redact(text) { return `<span class="redact" role="img" aria-label="erased entry"><span aria-hidden="true">${esc(text)}</span></span>`; }
// A world's layers as sentences for the world sheet: " A Merchant League: the guilds own... Guild rates: ... The Long Night: the sun..."
function layerSentences(w) {
  const F = FATES[w.fate], P = PEOPLES[w.people], C = WORLD_TYPES[w.mix], low = t => t.charAt(0).toLowerCase() + t.slice(1);
  return (P ? ` ${esc(P.name)}: ${esc(low(P.line))}` : '') + (P && P.custom ? ` <b>${esc(P.custom.name)}</b>: ${esc(low(P.custom.text))}` : '') + (F ? ` ${esc(F.name)}: ${esc(low(fateLine(F, w.type)))}` : '') + (F && F.crises ? ' Its crisis comes in rounds 3 and 5.' : '') + (C ? ` The ${esc(C.name)} press in.` : '');
}
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
// Reduced motion: the phone's setting, or the game's own in Settings (js/sfx.js)
let REDUCED = reducedMotion();
function eraseSteps(r) {
  const R = run && run.record; if (!R || !r.erased || !r.erased.length) return [];
  const E = recLore(R, run.world.type).entries;
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
  steppes: ['M6 22Q6 12 16 14Q20 6 28 12Q36 12 34 22ZM20 24L15 34H20L17 46L26 30H21L24 24Z', 'M0 48L6 38L10 48ZM12 48L20 34L26 48ZM28 48L34 40L40 48Z', 'M6 48V18H8V48ZM16 48V10H18V48ZM26 48V14H28V48ZM34 48V22H36V48Z', 'M0 48Q10 36 20 44Q30 34 40 48Z', 'M4 48L8 20L10 48ZM12 48L18 14L19 48ZM22 48L24 18L28 48ZM30 48L35 22L36 48Z', 'M6 48L20 16L34 48Z'],
};
function skylineSVG() {
  const R = run && run.record; if (!R || !SKYLINE[run.world.type]) return '';
  const E = LORE[run.world.type].entries, places = E.map((e, i) => i).filter(i => E[i].k === 'place');
  const slots = recEntries(R, run.world.type).filter(e => e.k === 'place');
  if (!slots.length) return '';
  // A place from a layer borrows one of the type's six silhouettes
  const paths = slots.map((e, k) => { const at = places.indexOf(e.i), d = SKYLINE[run.world.type][(at >= 0 ? at : e.i) % 6]; return `<path transform="translate(${k * SKY_W} 0)" d="${d}" class="${e.lost ? 'gone' : ''}"/>`; }).join('');
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
  r.rec = d.rec ? sanitizeRec(Object.assign({}, d.rec, { w: type }, layersOf(dailyWorld(date))), type) : null;
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
  const ver = typeof PATCH_NOTES !== 'undefined' && PATCH_NOTES.length ? PATCH_NOTES[0].release : null;
  const q = lsGet(RUNQ_KEY) || []; q.push(runSummary(run, meta, outcome, null, ver)); lsSet(RUNQ_KEY, q.slice(-20));
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
  const d = feedbackDoc(F.type, F.text, { build, screen: F.from, w: innerWidth, h: s.vh, app: s.standalone, ua: screenLine() + ' ' + navigator.userAgent }, F.attach && run && !run.practice ? run : null);
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
      if (snap.exists) { mine = cleanScore(own, snap.data(), date); mine.pos = col.count ? 1 + await col.count({ where: ['score', '>', mine.score] }) : null; }
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
    if (B.mine) rows += `<div class="br-gap" aria-hidden="true">···</div>` + resultRow(B.mine, B.mine.pos, true, B.rows.length);
    else if (r && !meta.daily.posted && !B.rows.some(x => x.uid === own)) { rows += `<div class="br-gap" aria-hidden="true">···</div>` + resultRow(r, null, true); note = cloud.tester === false ? `${PENDING} Your score stays on this device until you are approved.` : 'Your score posts at the next sync today.'; }
  } else if (cloud.on) {
    rows = B && B.error ? '<p class="sh-p fine">[Observations unavailable. Try again later.]</p>' : '<p class="sh-p fine">[Retrieving observations…]</p>';
  } else {
    ui.boardList = r && r.rec ? [Object.assign({ uid: own }, r)] : [];
    rows = r ? resultRow(r, null, true, 0) : '';
    note = FIREBASE ? 'Sign in to post your score.' : 'Scores stay on this device.';
  }
  if (!r) note = 'Your ranked attempt is still in progress.';
  const body = `<p class="sh-p sysl">[${esc(w.name)}, rank ${WORLD_RANKS[w.rank]}. Next world in ${untilTomorrow()}.]</p>${glitchDay(date) ? `<p class="sh-p sysl glitch">[Glitch Day. Today's world loaded from a Corrupted Save. Glitches are on.]</p>` : ''}
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
  const intro = !ui.titleSeen && !REDUCED; ui.titleSeen = true; // M3: the title assembles itself, once per session
  return `<main class="screen title ${canResume ? 'resume' : ''}${intro ? ' intro' : ''}">${titleChunks()}
    <div class="t-top"><div class="t-eb"><div class="eyebrow">[System notice] · Prototype ${esc(releaseLabel())}</div><button class="icon-btn t-set" data-act="sheet" data-s="settings" aria-label="Settings">⚙</button></div><h1 class="logo"><span class="brk">[</span>World Pending Deletion<span class="brk">]</span></h1>
    <div class="sysbox"><p>${meta.runs && meta.rank ? esc(rankAddress(meta, meta.champions[0] && meta.champions[0].name, meta.runs)) : '[The Grand Tournament has begun.]'}</p><p>${esc(masteryLine(meta) || '[Worlds awaiting judgement: many. Champions remaining: one per world.]')}</p></div>
    <p class="lede">Pick a world and fight for it through an 8-round divine tournament. Choose your opponents, buy and merge skills and gear, and build into archetypes. Every loss erases part of your world.</p></div>
    <div class="t-stats"><div><b>${meta.wins}</b><span>spared</span></div><div><b>${meta.erased.length}</b><span>erased</span></div><div><b>${meta.echoes}</b><span>Echoes</span></div><button data-act="sheet" data-s="halls"><b>${meta.rank ? meta.rank.letter : 'F'}</b><span>Entrant Rank</span></button></div>
    <div class="stack">
      ${canResume ? `<button class="btn primary" data-act="resume">Continue · ${saved.daily ? 'Pending World: ' : ''}${esc(saved.world.name)}, ${saved.stage === 'draft' || saved.startPts != null ? 'opening draft' : 'round ' + saved.round}</button>` : ''}
      ${dailyButton(canResume && saved)}
      <button class="btn ${canResume ? '' : 'primary'}" data-act="new">${canResume ? 'Abandon and start over' : 'Enter the tournament'}</button>
      <button class="btn ${meta.tutorialDone ? 'ghost small' : ''}" data-act="practice">${meta.tutorialDone ? 'Replay the practice run' : 'Practice run (tutorial)'}</button>
      <div class="row3"><button class="btn ghost" data-act="sheet" data-s="archive">Archive</button><button class="btn ghost" data-act="sheet" data-s="halls">Halls</button><button class="btn ghost" data-act="sheet" data-s="echoes">Echoes</button></div>
      <div class="row3"><button class="btn ghost small" data-act="sheet" data-s="howto">How to play</button><button class="btn ghost small" data-act="news">What's new${newsUnseen() ? ' <span class="badge">!</span>' : ''}</button><button class="btn ghost small" data-act="report">Report</button></div>
      ${FIREBASE && !cloud.on ? cloudSignInHTML(true) : FIREBASE && cloud.on ? `<p class="sh-p fine center">Signed in as ${esc(publicName())} · ${window.WPD_PREVIEW ? 'dev preview, not saved to cloud' : 'cloud save on'} · <button class="link" data-act="signout">Sign out</button>${cloud.tester === false ? `<br>${PENDING}` : ''}</p>` : ''}
    </div></main>`;
}
function worldsHTML() {
  const cards = ui.worlds.map((w, i) => {
    const T = WORLD_TYPES[w.type], M = MODIFIERS[w.mod], F = FATES[w.fate], P = PEOPLES[w.people], C = WORLD_TYPES[w.mix];
    const classes = w.v >= 2 ? worldArch(w, meta.unlocks) : [T.home];
    return `<button class="pick ${ui.world === i ? 'on' : ''}" data-act="pick-world" data-i="${i}">
      <div class="pk-h"><span class="pk-name">${esc(w.name)}</span>${w.steered ? '<span class="tag">Requested</span>' : ''}${markChip('world', w.type)}${rankChip(w.rank)}</div>${w.bounty && BOUNTIES[w.bounty] ? `<div class="pk-row"><span class="tag bounty">${esc(BOUNTIES[w.bounty].name)}</span><span class="pk-mut">${esc(BOUNTIES[w.bounty].desc)}</span></div>` : ''}
      <div class="pk-sub">${[T.name, P && P.name, F && F.name].filter(Boolean).map(esc).join(' · ')}</div>
      <div class="pk-row"><span class="pk-mut">${esc(T.flavour)}${C ? ` The ${esc(C.name)} press in.` : ''}${P ? ' ' + esc(P.line) : ''}${F ? ' ' + esc(fateLine(F, w.type)) : ''}</span></div>${P && P.custom ? `<div class="pk-row"><span class="pk-mut"><b>${esc(P.custom.name)}:</b> ${esc(P.custom.text)}</span></div>` : ''}
      <div class="pk-row">${classes.map(k => `<span class="tagn a-${k}">${ARCH[k].name}</span>`).join('')}</div>
      <div class="pk-row"><span class="tag${M.glitch ? ' glitch' : ''}">${esc(M.name)}</span><span class="pk-mut">${esc(M.desc)}</span></div>
      <div class="pk-row"><span class="pk-mut">World Gift: ${esc(GIFTS[T.gift].name)} · Final: a paired world's finalist</span></div>
    </button>`;
  }).join('');
  const w = ui.world != null ? ui.worlds[ui.world] : null;
  return `<main class="screen select"><div class="sel-h"><button class="icon-btn" data-act="back-title" aria-label="Back">‹</button><div><div class="eyebrow">Step 1 of 3</div><h2>Choose a world to fight for</h2></div></div>
    <p class="hint">Lower-rank worlds give more Gift Points at the Awakening. Higher ranks bring tougher opponents.</p>
    <div class="picks">${cards}</div>${ladderRow()}${goalRow()}${worldExtras()}
    <div class="foot"><button class="btn primary" data-act="world-ok" ${w ? '' : 'disabled'}>${w ? 'Fight for ' + esc(w.name) : 'Pick a world'}</button></div></main>`;
}

// ---------- Awakening ----------
// In Pending World the record and the System Offer come from the day's seed, and Echo unlocks don't count
function newAw(w, date) {
  return { record: date ? dailyRecord(date, w) : buildRecord(w.type, awRng('record'), w), tab: 'id', name: w.champ, sigil: Math.floor(Math.random() * 6), color: Math.floor(Math.random() * 6), gifts: [WORLD_TYPES[w.type].gift], patron: null, cat: 'world',
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
  return `<button class="gift ${on ? 'on' : ''} ${unlocked ? '' : 'locked'}" data-act="aw-gift" data-k="${k}" ${can ? '' : 'disabled'}><span class="gf-h"><b>${unlocked ? '' : '🔒 '}${esc(g.name)}${disc ? ' <em class="offer">System Offer</em>' : ''}</b>${c}</span><span class="gf-d">${esc(unlocked ? g.desc : giftLockText(k))}${unlocked ? flavHTML(g.flavour) : ''}</span></button>`;
}
function awakenHTML() {
  const a = ui.aw, w = ui.worlds[ui.world];
  const chk = giftCheck(w, a.gifts, a.patron, a.offer, a.sysPts);
  // In the order they depend on each other: the Patron sets the Gift Points (Faithless adds 2), and stats wait for the
  // opening draft, when the skills they power are known
  const tabs = [['id', 'Name'], ['patron', 'Patron'], ['gifts', `Gifts · ${chk.left}`]];
  const titles = Object.keys(TITLES).filter(k => meta.titles[k]);
  let body = '';
  if (a.tab === 'id') {
    body = `<label class="fld"><span>Champion's name</span><input id="aw-name" maxlength="18" value="${esc(a.name)}" autocomplete="off"></label>
      <div class="fld"><span>Sigil</span><div class="sigrow">${SIGILS.map((g, i) => `<button class="sigb ${a.sigil === i ? 'on' : ''}" data-act="aw-sigil" data-i="${i}" style="color:${SIGIL_COLS[a.color]}" aria-label="Sigil ${i + 1}">${g}</button>`).join('')}</div></div>
      <div class="fld"><span>Colour</span><div class="sigrow">${SIGIL_COLS.map((c, i) => `<button class="colb ${a.color === i ? 'on' : ''}" data-act="aw-color" data-i="${i}" style="background:${c}" aria-label="Colour ${i + 1}"></button>`).join('')}</div></div>
      <div class="aw-preview">${crest(a.name, 'me', true, { sigil: a.sigil, color: a.color })}<div><div class="ch-name">${esc(a.name || '…')} of ${esc(w.name)}</div><div class="ch-sub">Entrant of the Grand Tournament. This is how your champion appears in fights and in the Halls.</div></div></div>
      ${titles.length ? `<div class="fld"><span>Title</span></div>` + titles.map(k => `<button class="gift ${a.title === k ? 'on' : ''}" data-act="aw-title" data-k="${k}"><span class="gf-h"><b>${esc(TITLES[k].name)}</b></span><span class="gf-d">${esc(TITLES[k].desc)}${flavHTML(TITLES[k].flavour)}</span></button>`).join('') : ''}
      ${a.practice ? '' : `<p class="sh-p bio">${bioHTML(a.record, w.type, w.name)}</p><p class="sh-p sysl">[Filing world record: ${esc(w.name)}. ${a.record.ids.length} entries.]</p>`}`;
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
    body = `<p class="sh-p">Pledge to a god for 2 Favour with them; their wagers come up more often. Win wagers to reach 4 Favour (a free B-rank piece) and 8 (a blessing for the run).</p>` +
      Object.entries(GODS).map(([k, G]) => `<button class="gift ${a.patron === k ? 'on' : ''}" data-act="aw-patron" data-k="${k}"><span class="gf-h"><b>${esc(G.name)}</b></span><span class="gf-d">Archetypes: ${G.arch.map(x => ARCH[x].name).join(', ')}. Blessing: ${esc(G.blessing)}</span></button>`).join('') +
      `<button class="gift ${a.patron === 'none' ? 'on' : ''}" data-act="aw-patron" data-k="none"><span class="gf-h"><b>Faithless</b><span class="gcost neg">+2</span></span><span class="gf-d">No Patron. +2 Gift Points.</span></button>`;
  }
  const ready = a.name.trim() && a.patron && chk.ok;
  const why = !a.name.trim() ? 'Name your champion' : !a.patron ? 'Choose a Patron' : !chk.ok ? 'Too many Gift Points' : 'Awaken';
  return `<main class="screen select awaken"><div class="sel-h"><button class="icon-btn" data-act="${ui.daily ? 'back-title' : 'back-worlds'}" aria-label="Back">‹</button><div><div class="eyebrow">${ui.daily ? 'Pending World' : 'Step 2 of 3'} · ${esc(w.name)}</div><h2>[Integration complete. Distributing Gifts.]</h2></div></div>
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="tab ${a.tab === k ? 'on' : ''}" data-act="aw-tab" data-t="${k}" role="tab">${l}</button>`).join('')}</div>
    <section class="aw-body sysw">${body}</section>
    <div class="foot"><button class="btn primary" data-act="aw-ok" ${ready ? '' : 'disabled'}>${why}</button></div></main>`;
}

// ---------- Draft ----------
// The opening draft is three steps: 3 of 6 skills, then 1 of 2 gear, then the opening stat points (kitStatsHTML)
function draftEyebrow(step) { return `${run.daily ? 'Pending World' : 'Step 3 of 3'} · ${step}`; }
function draftHTML() {
  const gd = run.gearDraft || [];
  if (run.draftPicked && gd.length) return gearDraftHTML(gd);
  const cards = run.draft.map(id => {
    const d = SKILLS[id], on = ui.draftSel.includes(id);
    return `<button class="scard ${on ? 'on' : ''} ${mainTag(id)}" data-act="draft-pick" data-id="${id}">
      <div class="sc-h"><span class="sc-name">${esc(d.name)}</span>${rk(d.rank)}</div>
      <div class="sc-meta">${tagNames(id)}${d.quick ? '<span class="tagn q">Quick</span>' : ''}</div>
      <div class="sc-desc">${esc(describe(d))}</div></button>`;
  }).join('');
  const n = ui.draftSel.length, next = gd.length ? 'Next: gear' : 'Confirm';
  return `<main class="screen select"><div class="sel-h"><div><div class="eyebrow">${draftEyebrow('Skills')}</div><h2>[Skill selection: choose 3]</h2></div></div>
    <p class="hint">This run's archetypes: ${run.arch.map(k => `<span class="tagn a-${k}">${ARCH[k].name}</span>`).join(' ')}. Only their pieces appear in the shop.${gd.length ? ' Rerolling also redraws the gear on offer.' : ''}</p>
    <div class="sgrid">${cards}</div>
    <div class="foot row2"><button class="btn" data-act="draft-reroll" ${run.rerolls > 0 ? '' : 'disabled'}>Reroll · ${run.rerolls} left</button><button class="btn primary" data-act="draft-skills" ${n === 3 ? '' : 'disabled'}>${n === 3 ? next : `Pick ${3 - n} more`}</button></div></main>`;
}
// Pick Your Kit: 1 of 2 gear pieces, once the skills are chosen
function gearDraftHTML(gd) {
  const gearOn = gd.includes(ui.draftGear) ? ui.draftGear : null;
  const cards = gd.map(id => { const g = GEAR[id];
    return `<button class="scard ${gearOn === id ? 'on' : ''} ${mainTag(id)}" data-act="draft-gear" data-id="${id}">
      <div class="sc-h"><span class="sc-name">${esc(g.name)}</span>${rk(g.rank)}</div>
      <div class="sc-meta">${tagNames(id)}<span class="tagn">${g.slot[0].toUpperCase() + g.slot.slice(1)}</span></div>
      <div class="sc-desc">${Object.entries(gearStats(id, 1)).map(([k, v]) => `+${v} ${k}`).join(', ')}. ${esc(gearText(id, 1))}</div></button>`; }).join('');
  return `<main class="screen select"><div class="sel-h"><button class="icon-btn" data-act="draft-back" aria-label="Back to skills">‹</button><div><div class="eyebrow">${draftEyebrow('Gear')}</div><h2>[Standard issue: choose 1 piece of gear]</h2></div></div>
    <p class="hint">Your skills: ${run.draftPicked.map(id => esc(SKILLS[id].name)).join(', ')}.</p>
    <div class="sgrid">${cards}</div>
    <div class="foot"><button class="btn primary" data-act="draft-ok" ${gearOn ? '' : 'disabled'}>${gearOn ? 'Next: stats' : 'Pick 1 gear'}</button></div></main>`;
}
// The opening stat points, placed once the skills and gear they work with are known
function kitStatsHTML() {
  const pts = run.startPts, fl = run.statFloor, s = effStats(run);
  // Which stats the chosen skills draw power from
  const uses = {}; allPieces(run).forEach(p => { const d = SKILLS[p.id]; const k = d && skillStat(d); if (k) (uses[k] = uses[k] || []).push(d.name); });
  const gifts = [hasGift(run, 'bornlucky') && `${GIFTS.bornlucky.name} +2 LUK`, hasGift(run, 'latebloomer') && `${GIFTS.latebloomer.name} −1 to each`].filter(Boolean);
  const roll = run.rolled ? `<div class="aw-roll"><span>[Rolled: ${ROLL_PTS} points placed. The System does not do refunds.]</span><button class="btn small ghost" data-act="kit-unroll">Place 4 myself</button></div>`
    : run.rollUsed ? '' : `<div class="aw-roll"><span>Or let the System roll: <b>${ROLL_PTS} points</b> instead of 4, at random, one stat favoured. Once only.</span><button class="btn small" data-act="kit-roll">Roll</button></div>`;
  const rows = STATS.map(k => `<div class="strow kit"><span class="st-k">${k}</span><span class="st-n">${STAT_INFO[k].name}<small>${uses[k] ? 'Powers ' + esc([...new Set(uses[k])].join(', ')) : STAT_INFO[k].short}</small></span>${run.rolled ? '<span></span>' : `<button class="btn small add" data-act="kit-stat" data-k="${k}" data-d="-1" ${run.stats[k] <= fl[k] ? 'disabled' : ''} aria-label="Remove a point">−</button>`}<span class="st-v">${s[k]}${s[k] !== run.stats[k] ? `<small title="From gear">${s[k] > run.stats[k] ? '+' : '−'}${Math.abs(s[k] - run.stats[k])}</small>` : ''}</span>${run.rolled ? '<span></span>' : `<button class="btn small add" data-act="kit-stat" data-k="${k}" data-d="1" ${pts <= 0 ? 'disabled' : ''} aria-label="Add a point">+</button>`}</div>`).join('');
  return `<main class="screen select awaken"><div class="sel-h"><div><div class="eyebrow">${draftEyebrow('Stats')}</div><h2>[Calibrating your champion]</h2></div></div>
    <section class="aw-body sysw"><p class="sh-p">${pts ? `<b class="pts">${pts} point${pts > 1 ? 's' : ''} to place.</b> ` : ''}Skills draw power from the stat of their archetype. Reach 10 in a stat for a milestone perk.${gifts.length ? ` Gifts: ${esc(gifts.join(', '))}.` : ''}</p>${roll}${rows}</section>
    <div class="foot"><button class="btn primary" data-act="kit-ok" ${pts ? 'disabled' : ''}>${pts ? `Place ${pts} stat point${pts > 1 ? 's' : ''}` : 'Enter the tournament'}</button></div></main>`;
}

// ---------- Choose opponent ----------
function chooseHTML() {
  poolLoad();
  // U1: opponents are compact rows; tap one and it opens with the full card and "Face them" while the others step back.
  // A lone opponent (the Final) is open from the start. Tapping the open card again also faces them.
  if (run.choices.length === 1) ui.pick = 0; else if (ui.pick != null && !run.choices[ui.pick]) ui.pick = null;
  const justOpened = ui.pickNew; ui.pickNew = false;
  const cards = run.choices.map((spec, i) => `<div class="opp ${spec.hard ? 'hard' : ''}${ui.pick === i ? ' open' + (justOpened ? ' grow' : '') : ui.pick != null ? ' back' : ''}" role="button" tabindex="0" data-act="opp-open" data-i="${i}" aria-expanded="${ui.pick === i}">
      ${specCrest(spec)}<div class="op-r"><div class="nx-k">${spec.grudge ? 'Grudge · ' : ''}${spec.kind === 'trial' ? KIND_LABEL.trial : spec.gate ? 'Gatekeeper' : spec.hard ? (spec.kind === 'erased' ? 'Erased · Hard' : spec.kind === 'entrant' ? 'Filed record · Hard' : 'Hard') : KIND_LABEL[spec.kind]}${rankTag(spec)}</div><div class="nx-name">${esc(specName(spec))}</div><div class="nx-style">${esc(styleOf(spec))}</div>${traitsHTML(spec)}
      <div class="op-meta"><span class="good">Win: ${esc(specReward(spec))}</span><span class="bad">Loss: −${heartCost(run, spec)} ♥</span></div>${ui.pick === i ? `<button class="btn primary face" data-act="pick-opp" data-i="${i}">Face them ›</button>` : ''}</div></div>`).join('');
  const W = run.wager && WAGERS[run.wager.key], G = run.wager && GODS[run.wager.god];
  const wager = W ? `<section class="wager ${ui.wagerOn ? 'on' : ''}"><div class="wg-t"><span class="eyebrow">${esc(G.name)} offers a wager</span><b>${esc(W.text)}</b><small>${clauseOf(run).freeWager ? `No stake (Gambler's Clause). Win it: 10 gold and +2 Favour. Lose it: −${clauseOf(run).wagerLoss} gold.` : 'Stake 5 gold. Win it: 10 gold back and +2 Favour.'}</small></div><button class="btn small ${ui.wagerOn ? 'primary' : ''}" data-act="wager" ${run.gold < (clauseOf(run).freeWager ? 0 : 5) && !ui.wagerOn ? 'disabled' : ''}>${ui.wagerOn ? 'Accepted' : 'Accept'}</button></section>` : '';
  const fin = run.choices.length === 1;
  const q = run.quests.find(q => !QUESTS[q.id].hidden && !q.done && !q.failed), Q = q && QUESTS[q.id];
  const quest = Q ? `<button class="sr-q" data-act="sheet" data-s="stats"><span class="eyebrow">Quest</span><span class="sr-qt">${esc(Q.text)}</span>${Q.goal > 1 ? `<b>${q.prog}/${Q.goal}</b>` : ''}</button>` : '<span class="sr-q"></span>';
  return `<main class="screen choose">${strip()}<div class="col col-a"><div class="status-row">${quest}${deskBtn()}${noticeOf(run) ? `<button class="link bad ntc" data-act="sheet" data-s="notice" aria-label="Noticed: opponents ${noticePct(run)}% stronger. Tap for details">Noticed +${noticePct(run)}%</button>` : ''}<span class="st-inc">+${run.lastIncome || 0}g</span></div>${marksBtn()}</div><div class="col col-b">
   ${fin ? '<div class="sec-h"><span>[The Final Champion awaits]</span></div>' : ''}
    <div class="opps">${cards}</div>${wager}</div>
    <footer class="foot2"><button class="btn ${run.statPts ? 'glow' : ''}" data-act="sheet" data-s="stats">Stats${run.statPts ? ` <span class="badge">${run.statPts}</span>` : ''}</button><span class="foot-hint">${fin ? 'The Final Champion awaits' : ui.pick != null ? 'Face them, or tap another' : 'Tap an opponent to see them'}</span></footer></main>`;
}

// ---------- Shop ----------
function shopIds() { ensureShop(run); const ids = new Set(); SHOP_KINDS.forEach(k => run.shop[k].forEach(it => it && ids.add(it.id))); if (run.bonusSlot) ids.add(run.bonusSlot.id); return ids; }
function pieceTile(p, act, extra, inShop) {
  const d = pieceDef(p.id), g = isGear(p.id);
  const marker = inShop && inShop.has(p.id) && p.star < 3 ? '<span class="inshop" title="A copy is in the shop">in shop</span>' : '';
  return `<button class="tile ${mainTag(p.id)} ${g ? 'gear' : ''} ${extra || ''} ${marker ? 'hasdup' : ''}" data-act="${act}" data-u="${p.u}">
    <span class="tl-h">${rk(effRank(p.id, p.mods))}${stars(p.star)}</span><span class="tl-n">${esc(d.name)}</span>${pfxLine(p.mods)}<span class="tl-f">${tagDots(p.id)}</span>${marker}</button>`;
}
// Prefixes on a tile: one small line that gives way before the skill's name does
function pfxLine(mods) { return mods && mods.length ? `<em class="pfx tl-p" title="${esc(mods.map(m => PREFIXES[m].name).join(' '))}">${esc(mods.map(m => PREFIXES[m].name).join(' '))}</em>` : '';
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
  // Archetype shapes sit beside the rank, so the tile only needs a footer row for owned pips, a lock or a gear slot
  const foot = `${D.owned || D.merge ? pips(D.have, D.need) : ''}${locked ? '<span class="lk">🔒</span>' : ''}${isGear(it.id) ? `<span class="slt">${GEAR[it.id].slot}</span>` : ''}`;
  return `<div class="tw">${quick}<button class="tile shopt ${mainTag(it.id)} ${isGear(it.id) ? 'gear' : ''} ${kind === 'bonus' ? 'bonus' : ''} ${locked ? 'locked' : ''} ${D.merge ? 'merge' : D.owned ? 'owned' : ''}" data-act="shop-item" data-k="${kind}" data-i="${i}" title="${esc(skillTip(pieceDef(baseId(it.id))))}">
    ${tag}<span class="tl-h"><span class="tl-rk">${rk(effRank(it.id, it.mods))}${tagDots(it.id)}</span><span class="price">${price(run, it)}g</span></span><span class="tl-n">${esc(d.name)}</span>
    <span class="tl-fx">${esc(shortFx(it.id, it.mods))}</span>${pfxLine(it.mods)}${foot ? `<span class="tl-f">${foot}</span>` : ''}</button></div>`;
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
  const xpTile = `<button class="tile xptile" data-act="sheet" data-s="stats"><span class="tl-h"><b>Lv ${run.level}</b><span class="price">${pointPrice(run)}g</span></span><span class="tl-n">Train a stat</span><span class="xp wide"><i style="width:${lvFill()}%"></i></span></button>`;
  const items = run.shop[tab].map((it, i) => shopItemTile(it, tab, i)).join('') + (bonusHere ? shopItemTile(run.bonusSlot, 'bonus', 0) : xpTile);
  const odds = oddsFor(run).map((v, i) => v ? `<span class="nw">${['E', 'D', 'C', 'B', 'A'][i]} ${v}%</span>` : '').filter(Boolean).join(' · ');
  const inShop = shopIds();
  const bar = run.bar.map((p, i) => p ? pieceTile(p, 'own', '', inShop) : `<div class="tile empty">Skill ${i + 1}</div>`).join('');
  const gear = GEAR_SLOTS.map(sl => run.gear[sl] ? pieceTile(run.gear[sl], 'own', '', inShop) : `<div class="tile empty gear">${sl}</div>`).join('');
  const bench = run.bench.map(p => pieceTile(p, 'own', 'sm', inShop)).join('') + '<div class="tile empty sm"></div>'.repeat(Math.max(0, 8 - run.bench.length));
  // Loot can overfill the bench. It then squeezes into two rows so Fight stays on screen, and Fight waits until it's back to 8.
  const over = benchOver(), cols = over ? Math.ceil(run.bench.length / 2) : 4;
  const rc = rerollCost(run);
  return `<main class="screen shop">${strip()}
    <div class="col col-a">${archChips(counts)}
    <div class="shoptabs" role="tablist"><button class="stab ${tab === 'skill' ? 'on' : ''}" data-act="shop-tab" data-k="skill" role="tab">Skills ${tabBadge('skill')}</button><button class="stab ${tab === 'gear' ? 'on' : ''}" data-act="shop-tab" data-k="gear" role="tab">Gear ${tabBadge('gear')}</button><button class="btn small" data-act="reroll" ${run.gold < rc ? 'disabled' : ''}>Reroll ${tab === 'skill' ? 'skills' : 'gear'} · ${rc ? rc + 'g' : 'free'}</button></div>
    <div class="shopgrid">${items}</div>
    <div class="shopctl"><span class="fine">${odds}</span>${bonusHere ? `<button class="btn small" data-act="sheet" data-s="stats">Train · ${pointPrice(run)}g</button>` : ''}${deskBtn()}<span class="interest">Interest +${interestOf(run)}g</span></div>
    </div><div class="col col-b"><div class="sec-h"><span>Skill bar</span><span class="fine">Gear</span></div>
    <div class="build"><div class="barrow c${run.slots}">${bar}</div><div class="gearrow">${gear}</div></div>${run.phantom ? `<div class="sec-h"><span class="bad">Phantom: ${esc(pieceDef(run.phantom.id).name)}${run.phantom.star > 1 ? ' ' + '★'.repeat(run.phantom.star) : ''}</span><span class="fine">Hotfix in ${run.phantom.left} fight${run.phantom.left > 1 ? 's' : ''}</span></div>` : ''}
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
  return tag + ({ infirmary: `Restore ${run.world.mod === 'famine' ? 40 : 65}% of your max HP.`, enchanter: `Carve a prefix into one of your skills, from ${enchantCount(run)}.` }[k] || DISTRICTS[k].desc);
}
function districtHTML() {
  const spec = currentSpec(run), done = run.stage !== 'district';
  const opts = (done ? (ui.distDone ? [ui.distDone] : []) : run.districts.filter(k => !distFull(k))).map(k => `<button class="opt ${done ? 'used' : ''}" data-act="district" data-k="${k}" ${done ? 'disabled' : ''}><span class="og">${DIST_GLYPH[k]}</span><span class="ot"><b>${DISTRICTS[k].name}</b><small>${done ? 'Done' : esc(districtDesc(k))}${k === 'infirmary' && !done ? ` (${n0(run.hp)}/${maxHp(run)} HP)` : ''}${k === 'sanctum' && !done ? ` (${run.hearts}/${run.maxHearts})` : ''}</small></span></button>`).join('');
  return `<main class="screen district">${strip()}<div class="col col-a">
    <section class="next">${specCrest(spec)}<div class="nx-r"><div class="nx-k">${run.elite ? 'Elite bracket' : 'Next match'} · ${KIND_LABEL[spec.kind]}${spec.grudge ? ' · Grudge' : ''}${spec.gate ? ' · Gatekeeper' : spec.hard ? ' · Hard' : ''}${rankTag(spec)}</div><div class="nx-name">${esc(specName(spec))}</div><div class="nx-style">${esc(styleOf(spec))}</div>${run.scouted || hasGift(run, 'appraisal') ? scoutLine(spec) : ''}${run.wagerOn && run.wager ? `<div class="nx-wager">Wager: ${esc(WAGERS[run.wager.key].text)}</div>` : ''}</div></section>
    </div><div class="col col-b"><div class="sec-h"><span>${done ? '[District visited]' : '[Visit one district]'}</span></div>
    <section class="inter">${opts}</section>
    <section class="minibar c${run.slots}">${run.bar.map(p => p ? `<button class="mb ${mainTag(p.id)}" data-act="own" data-u="${p.u}"><span>${esc(SKILLS[p.id].name)}</span><small>${effRank(p.id, p.mods)}${p.star > 1 ? ' ' + '★'.repeat(p.star) : ''}${p.mods.length ? ' · ' + p.mods.map(m => PREFIXES[m].name).join(' ') : ''}</small></button>` : '<div class="mb empty"><span>Empty</span></div>').join('')}</section></div>
    <footer class="foot2"><button class="btn ${run.statPts ? 'glow' : ''}" data-act="sheet" data-s="stats">Stats${run.statPts ? ` <span class="badge">${run.statPts}</span>` : ''}</button><span class="foot-hint">Pick one, then shop</span></footer></main>`;
}
function scoutLine(spec) {
  if (spec.snap) return `<div class="nx-scout">Skills: ${spec.snap.bar.map(s => esc(modName(s.id, s.mods)) + (s.star > 1 ? ' ' + '★'.repeat(s.star) : '')).join(', ') || 'Attack only'}</div>`;
  return `<div class="nx-scout">Skills: ${ENEMIES[spec.id].skills.map(s => esc(s.n)).join(', ')}</div>`;
}

// ---------- Moments ----------
// Rule-breaking looks the screen switches into at set moments (Slaw, 2026-11-02: moments now, themes later).
// J Erosion: low HP tears holes in the fight's middle. Later: H Broadcast, K Gods' chat, I The System is breaking.
// momentOf() names the active look; render() and updateFight() put it on #app as data-moment, with data-fx="off"
// when motion is reduced (Settings > Motion), which turns every moment effect off.
// Several can be on at once (data-moment="broadcast erosion"). Reduced motion keeps the colours and words of a look
// and drops its movement and damage (holes, splash, scrolling ticker).
function momentOf() {
  const m = [];
  if (broadcastOn()) m.push('broadcast');
  const br = breakingLevel(); if (br) m.push('breaking'); if (br > 1) m.push('breaking-full');
  if (!REDUCED && ui.screen === 'fight' && ui.fight && erosionLevel(ui.fight) > 0) m.push('erosion');
  return m.join(' ');
}
function applyMoment() { if (!app) return; app.dataset.fx = REDUCED ? 'off' : 'on'; const m = momentOf(); if (m) app.dataset.moment = m; else delete app.dataset.moment; }
// H Broadcast at full volume: the System puts the run's headline moments on air.
// Gatekeeper and Final fights, Fate Crisis events, and the end of a world (erased or spared).
function broadcastFight(spec) { return !!spec && (spec.gate || spec.kind === 'final'); }
// M2: named opponents get the versus card too, with both faces on it
function splashFight(spec) { return broadcastFight(spec) || (!!spec && ['rival', 'erased', 'champion', 'legend', 'entrant'].includes(spec.kind)); }
function crisisPending() { const p = run && run.pending && run.pending[0]; return !!(p && p.type === 'event' && EVENTS[p.key] && EVENTS[p.key].crisis); }
function broadcastOn() {
  if (ui.screen === 'fight') return !!(ui.fight && broadcastFight(ui.fight.spec));
  if (ui.screen === 'end') return !!ui.end;
  if (['choose', 'shop', 'district'].includes(ui.screen) && !ui.sheet) return crisisPending();
  return false;
}
// A one-second VS card as the fight opens; any tap skips it. Not at 2x/3x speed or with reduced motion.
function broadcastSplash(f) {
  if (REDUCED || ui.speed > 1 || !splashFight(f.spec) || !app) return;
  const fin = f.spec.kind === 'final', k = f.spec.kind, big = broadcastFight(f.spec);
  const top = fin ? '++ LIVE +++ [FINAL] +++ ONE WORLD IS SPARED +++' : f.spec.gate ? '++ LIVE +++ [GATEKEEPER ASSIGNED] +++ LIVE ++' : k === 'rival' ? '++ LIVE +++ [RIVAL ENTRANT] +++ LIVE ++' : k === 'erased' ? '++ LIVE +++ [RETURNED FROM AN ERASED WORLD] +++' : k === 'entrant' ? '++ LIVE +++ [FILED RECORD] +++ LIVE ++' : '++ LIVE +++ [PAST CHAMPION] +++ LIVE ++';
  const bot = fin ? '[The other is not.]' : f.spec.gate ? '[Passage is a privilege.]' : k === 'erased' ? '[They remember.]' : '[The System is watching this one.]';
  const el = document.createElement('div'); el.className = 'bc-splash'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="bc-tick">${esc(top)}</div><div class="bc-foe">${specCrest(f.spec)}<span>${esc(f.B.name)}</span></div><div class="bc-vs">VS</div><div class="bc-me"><span>${esc(shortName(run.name))}</span>${crest(run.name, 'me', false, { sigil: run.sigil, color: run.color })}</div><div class="bc-tick b">${esc(bot)}</div>`;
  const done = () => el.remove();
  el.addEventListener('pointerdown', done); if (!big) el.classList.add('minor'); app.appendChild(el); setTimeout(done, big ? 1100 : 900);
}
function logLine(l, isNew) {
  return `<p class="t-${l.t} ${isNew ? 'new' : ''}">${esc(l.text)}</p>`;
}

// I The System is breaking: it strains under your streak. Subtle at notice 3 (headers flicker), full at notice 5 and
// on the System's own events (split colour, a ghost correction in the fight log). Options, costs and numbers never scramble.
// An event option with glitch: true shows as an inserted Option 4 (built with the glitched-content work).
function systemPending() { const p = run && run.pending && run.pending[0], E = p && p.type === 'event' && EVENTS[p.key]; return !!(E && E.theme === 'system' && !E.crisis); }
function breakingLevel() {
  if (!run || run.practice || !['choose', 'shop', 'district', 'fight'].includes(ui.screen)) return 0;
  if (ui.screen !== 'fight' && !ui.sheet && systemPending()) return 2;
  const n = noticeOf(run); return n >= TUNE.noticeMax ? 2 : n >= 3 ? 1 : 0;
}
const SYS_CORRECTIONS = ['[Correction: that was correct.]', '[Correction withdrawn. Apologies are not offered.]', '[This line was not approved.]', '[Duplicate entry. Keeping both.]', '[Crowd: 41,200. Crowd: 0. Crowd: 41,200.]', '[The System is fine.]'];
function ghostLine(f) { if (breakingLevel() < 2 || !f.log.length || f.log.length % 2) return ''; return `<p class="t-ghost">${esc(SYS_CORRECTIONS[f.log.length / 2 % SYS_CORRECTIONS.length])}</p>`; }

function broadcastTicker(text) { return `<div class="bc-ticker" aria-hidden="true"><span>${esc(text)}</span><span>${esc(text)}</span></div>`; }
// Erosion: no holes at 50% HP or more, then one per 10% lost, up to 5. A telegraphed hit that would tear one outlines it first.
const EROSION = { start: 0.5, step: 0.1, max: 5, bigHit: 0.2, chunks: 6 };
function erosionLevel(f, hp) {
  const A = f.A; if (!A || !A.maxHp) return 0;
  const fr = Math.max(0, hp == null ? A.hp : hp) / A.maxHp;
  return fr >= EROSION.start ? 0 : Math.min(EROSION.max, Math.ceil((EROSION.start - fr) / EROSION.step - 1e-9));
}
// Torn polygon for hole i of a seed: same shape and place every redraw
function holeSpec(seed, i) {
  const r = seedRng(seed + ':hole:' + i), n = 6 + Math.floor(r() * 3), size = 40 + Math.round(r() * 30);
  const pts = []; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + r() * 0.5, rad = 0.62 + r() * 0.38; pts.push(`${(50 + Math.cos(a) * rad * 48).toFixed(1)},${(50 + Math.sin(a) * rad * 48).toFixed(1)}`); }
  // Five lanes across the middle so holes rarely overlap; the skyline's 48px at the top stays clear
  const lane = [14, 70, 40, 86, 28][i % 5];
  return { x: lane + (r() - 0.5) * 10, y: 38 + r() * 46, size, rot: Math.round(r() * 360), pts: pts.join(' ') };
}
function holeSVG(h, cls) {
  return `<svg class="hole ${cls}" viewBox="0 0 100 100" style="left:${h.x.toFixed(1)}%;top:${h.y.toFixed(1)}%;--s:${h.size}px;transform:translate(-50%,-50%) rotate(${h.rot}deg)" aria-hidden="true"><polygon points="${h.pts}"/></svg>`;
}
function erosionHTML(f) {
  if (REDUCED || !f || !f.A) return '';
  if (!f.erSeed) f.erSeed = String(Math.floor(Math.random() * 1e9));
  const lv = erosionLevel(f), shown = f.erShown || 0;
  let h = '';
  for (let i = 0; i < lv; i++) h += holeSVG(holeSpec(f.erSeed, i), i >= shown ? 'new' : '');
  f.erShown = lv;
  // A telegraphed hit that would tear a new hole if it lands unblocked: its outline shows where
  if (!f.over && lv < EROSION.max && f.A.hp > 0) {
    const it = intentInfo(f), m = (it.kind === 'attack' || it.kind === 'big') && /^(\d+)(?:×(\d+))?/.exec(it.text || '');
    if (m && erosionLevel(f, f.A.hp - +m[1] * (+m[2] || 1)) > lv) h += holeSVG(holeSpec(f.erSeed, lv), 'due');
  }
  return h ? `<div class="erode" aria-hidden="true">${h}</div>` : '';
}
// A hit for 20%+ of max HP cracks the middle for a moment
function tearFx() { if (REDUCED) return; const lg = document.getElementById('log'); if (!lg) return; lg.classList.remove('tear'); void lg.offsetWidth; lg.classList.add('tear'); }
// Title: one chunk cut from the screen's edges per erased world, up to 6, behind the content
const CHUNK_AT = [[100, 4, 64], [0, 34, 52], [100, 52, 44], [6, 70, 40], [96, 88, 56], [30, 100, 46]];
function titleChunks() {
  const n = Math.min(EROSION.chunks, meta.erased.length); if (REDUCED || !n) return '';
  let h = '';
  for (let i = 0; i < n; i++) { const [x, y, size] = CHUNK_AT[i], sp = holeSpec('title', i); h += holeSVG({ x, y, size: size + 24, rot: sp.rot, pts: sp.pts }, ''); }
  return `<div class="erode chunks" aria-hidden="true">${h}</div>`;
}

// ---------- Fight ----------
function fightHTML() {
  const f = ui.fight;
  const sig = f.spec.snap ? { sigil: f.spec.snap.sigil, color: f.spec.snap.color } : null;
  return `<main class="screen fight">${fightBar(`<button class="icon-btn spd ${ui.speed > 1 ? 'on' : ''}" data-act="speed-cycle" aria-label="Fight speed ${ui.speed}×. Tap to change">${ui.speed}×</button><button class="icon-btn rr-btn" id="rrBtn" data-act="reroll-mode" hidden></button><button class="icon-btn ${ui.info ? 'on' : ''}" data-act="info" aria-label="Skill details mode">?</button>`)}
    <div class="col col-a"><section class="foe" id="foe">${crest(f.B.name, f.spec.hard && f.spec.kind !== 'erased' ? f.spec.kind + ' hard' : f.spec.kind, false, sig)}<div class="fo-r"><div class="fo-h"><span class="fo-name">${esc(f.B.name)}</span><span class="fo-hp" id="hpB"></span></div>
      <div class="bar foe-bar"><s id="lgB"></s><i id="hbB"></i><b id="bkB"></b></div><div class="bar brk-bar" title="Break: fill it and the opponent is Broken" aria-label="Break bar"><i id="brB"></i></div><div class="chips" id="stB"></div></div>
      <div class="intent" id="intent"></div><div class="floats" id="flB"></div></section>
    <section class="log" id="log" aria-live="polite"></section></div><div class="col col-b">
    <section class="me" id="me"><div class="me-h"><span class="me-name">${crest(run.name, 'me tiny', false, { sigil: run.sigil, color: run.color })}${esc(shortName(run.name))}${run.path ? ' · ' + esc(ARCH[run.path].path) : ''}</span><span class="me-hp" id="hpA"></span></div>
      <div class="bar hp-bar"><s id="lgA"></s><i id="hbA"></i><b id="bkA"></b></div><div class="chips" id="stA"></div><div class="floats" id="flA"></div></section>
    <section class="skills c${run.slots}" id="skills"></section></div></main>`;
}
function chipsHTML(X, f) {
  const c = [];
  if (!X.isPlayer && X.reflexes) X.reflexes.forEach((R, k) => c.push(`<span class="chip trait reflex" title="${esc(reflexText(X.id, k))}">Reflex: ${esc(REFLEX_ON[R.on].chip)}</span>`));
  if (!X.isPlayer && f.spec && f.spec.traits) f.spec.traits.forEach(k => TRAIT_POOL[k] && c.push(`<span class="chip trait${TRAIT_POOL[k].glitch ? ' glitch' : ''}">${esc(TRAIT_POOL[k].name)}</span>`));
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
  if (X.misfortune > 0) c.push(`<span class="chip misf">Misfortune ${X.misfortune}</span>`);
  (X.omens || []).forEach(o => c.push(`<span class="chip misf" title="Omen: fires if they ${o.on === 'attack' ? 'attack' : 'guard'} next">Omen: ${o.on === 'attack' ? 'attacks' : 'guards'}</span>`));
  if (X.curse > 0) c.push(`<span class="chip curse" title="+${Math.round(CURSE_DMG * 100 * X.curse)}% skill damage, +${Math.round(CURSE_TAKEN * 100 * X.curse)}% damage taken">Curse ${X.curse}</span>`);
  if (X.isPlayer && run.wagerOn && run.wager) c.push(`<span class="chip wagerc">Wager: ${esc(WAGERS[run.wager.key].text)}</span>`);
  return c.join('');
}
function updateFight() {
  const f = ui.fight; if (!f) return;
  applyMoment();
  [['A', f.A], ['B', f.B]].forEach(([k, X]) => {
    const hp = document.getElementById('hp' + k); if (!hp) return;
    hpCount(hp, k, X);
    const w = Math.max(0, X.hp / X.maxHp * 100), lg = document.getElementById('lg' + k);
    document.getElementById('hb' + k).style.width = w + '%';
    // The pale chunk behind the bar drains a beat after a hit; healing moves it at once
    if (lg) { const was = parseFloat(lg.style.width); lg.classList.toggle('now', !(was > w)); lg.style.width = w + '%'; }
    document.getElementById('bk' + k).style.width = Math.min(100, X.block / X.maxHp * 100) + '%';
    document.getElementById('st' + k).innerHTML = chipsHTML(X, f);
  });
  const br = document.getElementById('brB');
  if (br && f.B.breakMax) { br.style.width = Math.min(100, f.B.brk / f.B.breakMax * 100) + '%'; br.parentNode.classList.toggle('near', f.B.brk >= f.B.breakMax * 0.7); }
  const it = document.getElementById('intent');
  if (it) {
    if (f.over) it.innerHTML = '';
    else { const i = intentInfo(f), jz = !ui.busy && canJinx(f), jd = f.B.jinxed; it.className = 'intent k-' + i.kind + (jd ? ' jinxed' : '') + (jz ? ' can-jinx' : ''); it.innerHTML = `<span class="in-l">${jd ? 'Jinxed' : 'Next'}</span><span class="in-t">${esc(i.label || i.name)}${i.reflex ? `<small>Reflex: ${esc(i.reflex)}</small>` : ''}${i.windup ? `<small class="windup">Wind-up: ${i.windup} dmg breaks it</small>` : ''}${i.then ? `<small>then ${esc(i.then)}</small>` : ''}</span><span class="in-v">${esc(i.text)}</span>${jz ? `<button class="jinx-btn" data-act="jinx" aria-label="Jinx this move for ${jinxCost(f)} Misfortune. It goes wrong for them">Jinx (${jinxCost(f)})</button>` : ''}`; }
  }
  const lg = document.getElementById('log');
  const rr = ui.busy ? [] : rivalReplies(run, f);
  if (lg) lg.innerHTML = skylineSVG() + erosionHTML(f) + '<div class="log-t">' + f.log.slice(-4).map((l, i, a) => logLine(l, i === a.length - 1)).join('') + ghostLine(f) + '</div>'
    + (rr.length ? `<div class="replies">${rr.map(i => `<button class="reply" data-act="reply" data-i="${i}"><span class="chk-tag">${esc(checkTag(RIVAL_REPLIES[i].check))}</span> ${esc(RIVAL_REPLIES[i].label)}</button>`).join('')}</div>` : '');
  const sk = document.getElementById('skills');
  if (sk) {
    const can = f.phase === 'player' && !ui.busy && !f.over;
    sk.classList.toggle('wait', !!ui.busy && !f.over); // G2: skills dim while the opponent acts
    const btn = (s, i, wide) => {
      const d = s.def, cd = s.cd > 0, prev = previewSkill(f, s);
      const tag = d.basic ? '' : 'a-' + (d.tags[0] || '');
      const off = ui.reroll ? !(can && s.pip && !cd) : (!can || cd) && !ui.info;
      const die = s.pip ? `<span class="sk-die ${s.jackpot ? 'jp' : ''}" aria-label="Die shows ${s.pip}${s.jackpot ? ', Jackpot' : ''}">${DIE_FACES[s.pip - 1]}</span>` : '';
      return `<button class="sk ${wide ? 'wide' : ''} ${tag} ${cd ? 'cd' : ''} ${d.quick ? 'quick' : ''} ${ui.reroll && s.pip ? 'rr' : ''}" data-act="use" data-i="${i}" data-key="${i || run.slots + 1}" title="${esc(skillTip(d, i || run.slots + 1))}" ${off ? 'disabled' : ''}>
        <span class="sk-h"><span class="sk-name">${esc(d.name)}</span>${die}${d.quick ? '<span class="sk-q">Quick</span>' : ''}${s.star > 1 ? `<span class="sk-lv">${'★'.repeat(s.star)}</span>` : ''}</span>
        ${s.mods && s.mods.length ? `<span class="mods">${s.mods.map(m => esc(PREFIXES[m].name)).join(' · ')}</span>` : ''}<span class="sk-fx">${esc(prev)}</span>${cd ? `<span class="sk-cd">${s.cd}</span>` : ''}</button>`;
    };
    const list = f.A.skills.slice(1).map((s, i) => btn(s, i + 1));
    while (list.length < run.slots) list.push('<div class="sk empty">Empty slot</div>');
    sk.innerHTML = list.join('') + btn(f.A.skills[0], 0, true);
    // The Gambler's rerolls: tap the die in the top bar, then a skill, to reroll its die
    const rb = document.getElementById('rrBtn'), rr = f.A.rerolls > 0 && f.A.skills.some(s => s.pip) && !f.over;
    if (!rr) ui.reroll = false;
    if (rb) { rb.hidden = !rr; rb.disabled = !can; rb.classList.toggle('on', !!ui.reroll); rb.textContent = `${DIE_FACES[4]}${f.A.rerolls || 0}`; rb.setAttribute('aria-label', ui.reroll ? 'Cancel reroll' : `Reroll a die, ${f.A.rerolls || 0} left. Tap this, then a skill`); rb.setAttribute('aria-pressed', ui.reroll ? 'true' : 'false'); }
  }
}
// HP numbers count to their new value instead of jumping (G1). A redraw of the fight shows the value at once.
const hpShown = { A: null, B: null };
function hpCount(el, k, X) {
  const to = +n0(X.hp) || 0, st = hpShown[k], fresh = !st || st.f !== ui.fight || st.el !== el, from = fresh ? to : st.v;
  if (st && st.raf) cancelAnimationFrame(st.raf);
  const S = hpShown[k] = { f: ui.fight, el, v: from, raf: 0 }, put = v => { S.v = v; el.textContent = `${v} / ${X.maxHp}`; };
  if (from === to || REDUCED) return put(to);
  const t0 = performance.now(), dur = 360 / (ui.speed || 1);
  const step = t => { const q = Math.min(1, (t - t0) / dur); put(Math.round(from + (to - from) * (1 - Math.pow(1 - q, 3)))); if (q < 1 && S.el.isConnected) S.raf = requestAnimationFrame(step); };
  S.raf = requestAnimationFrame(step);
}
// A hit's first frame: the target flashes white and is knocked a few pixels (big hits shake instead)
function hitFx(side, big, crit) {
  if (REDUCED) return; const el = document.getElementById(side === 'A' ? 'me' : 'foe'); if (!el) return;
  el.classList.remove('hitflash', 'knock'); void el.offsetWidth; el.classList.add('hitflash'); if (!big) el.classList.add('knock');
  if (crit) { const a = document.getElementById('app'); a.classList.add('hitstop'); setTimeout(() => a.classList.remove('hitstop'), 90); }
}
function floatAt(side, text, cls) {
  const host = document.getElementById('fl' + side); if (!host || host.children.length > 8) return;
  const el = document.createElement('span'); el.className = 'fl ' + cls; el.textContent = text;
  el.style.left = (18 + Math.random() * 60) + '%'; host.appendChild(el); setTimeout(() => el.remove(), 1000);
}
function shake(side) { if (!SET.shake || REDUCED) return; const el = document.getElementById(side === 'A' ? 'me' : 'foe'); if (!el) return; el.classList.remove('shake', 'knock'); void el.offsetWidth; el.classList.add('shake'); }
// Break and reaction impact (#15): a beat of hit-stop, a stamp over the target and the break bar shattering
function stamp(side, text, cls) {
  const host = document.getElementById(side === 'A' ? 'me' : 'foe'); if (!host) return;
  host.querySelectorAll('.stamp.' + cls).forEach(x => x.remove());
  const el = document.createElement('span'); el.className = 'stamp ' + cls; el.textContent = text; el.setAttribute('aria-hidden', 'true');
  host.appendChild(el); setTimeout(() => el.remove(), cls === 'brk' ? 1300 : 900);
}
function breakFx(side) {
  const app0 = document.getElementById('app'), bar = document.querySelector('.brk-bar');
  if (bar) { bar.classList.remove('shatter'); void bar.offsetWidth; bar.classList.add('shatter'); }
  stamp(side, 'BROKEN', 'brk'); shake(side); sfx('break');
  if (!REDUCED && app0) { app0.classList.add('hitstop'); setTimeout(() => app0.classList.remove('hitstop'), 160); }
}
// Hover details on PC (#17): the full effect text, and the key that uses it in a fight
function skillTip(d, key) { if (!d) return ''; let t = d.name; try { if (d.fx) t += ': ' + describe(d); else if (d.desc) t += ': ' + d.desc; } catch (e) { } return key ? t + ` [Key ${key}]` : t; }
function playEvents(f) {
  let d = 0;
  f.events.forEach(e => {
    const at = d;
    if (e.k === 'hit') { setTimeout(() => { if (e.amt > 0 || e.blocked) sfx(e.amt > 0 ? (e.crit ? 'crit' : 'hit') : 'block'); if (e.amt > 0) { floatAt(e.side, (e.crit ? 'Crit ' : '') + e.amt, e.crit ? 'crit' : e.tag === 'flare' ? 'burn' : e.thorns ? 'thorns' : 'dmg'); { const big = e.amt >= f[e.side].maxHp * 0.12; hitFx(e.side, big && SET.shake, e.crit); if (big) shake(e.side); } if (e.side === 'A' && e.amt >= f.A.maxHp * EROSION.bigHit) tearFx(); } else if (e.blocked > 0) floatAt(e.side, 'Blocked ' + e.blocked, 'blk'); }, at); d += 120; }
    else if (e.k === 'dot' && e.amt > 0) { setTimeout(() => floatAt(e.side, e.amt, e.kind), at); d += 90; }
    else if (e.k === 'heal') { setTimeout(() => { floatAt(e.side, '+' + e.amt, 'heal'); sfx('heal'); }, at); d += 90; }
    else if (e.k === 'miss') { setTimeout(() => floatAt(e.side, e.text, 'blk'), at); d += 90; }
    else if (e.k === 'reaction') { setTimeout(() => { floatAt(e.side, e.name + '!', 'react'); stamp(e.side, e.name, 'rx'); sfx('react'); }, at); d += 220; }
    else if (e.k === 'break') { setTimeout(() => breakFx(e.side), at); d += 420; }
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
  if (f.spec.kind === 'entrant') say2(f, poolIntro(f.spec), 'sys');
  // Named opponents' entrance lines (FOE_LINES): rivals only when their rank lines are silent, Final Champions unless greeting at S-rank
  { const L = !f.spec.snap && f.spec.id && FOE_LINES[f.spec.id]; if (L && L.enter && !intro.some(l => l.t === 'foe')) say2(f, foeLine(L.enter, run), /^\[/.test(L.enter) ? 'sys' : 'foe'); }
  if (f.spec.kind === 'champion') say2(f, `[${f.spec.snap.champ} saved their world once. They are here to keep it saved.]`, 'sys');
  if (f.spec.gate && !run.gateSeen) { run.gateSeen = true; say2(f, '[Gatekeeper assigned. Passage is a privilege.]', 'sys'); }
  if (f.spec.kind === 'final') say2(f, run.pair ? `[Final. ${run.world.name} against ${f.spec.snap ? f.spec.snap.worldName || pairOf(run).name : pairOf(run).name}. One world is spared. The other is not.]` : `[The Final Champion of ${run.world.name}'s judgement. Win, and your world is spared.]`, 'sys');
  if (f.spec.id === 'undefeated' && !intro.some(l => l.replaces === 'sealed')) say2(f, '[Entrant record for the Undefeated: ERROR. Record sealed.]', 'loss');
  // The fight slides in (U6), and the opponent's card grows into their panel
  const draw = () => { render(); playEvents(f); updateFight(); broadcastSplash(f); };
  if (!REDUCED && document.startViewTransition && !document.hidden) { try { const vt = document.startViewTransition(draw); vt.finished.catch(() => {}); vt.ready.catch(() => {}); return; } catch (e) { } }
  draw();
}
const wait = ms => new Promise(r => setTimeout(r, ms / ui.speed));
async function onUse(i) {
  const f = ui.fight; if (!f || ui.busy || f.phase !== 'player') return;
  const s = f.A.skills[i];
  if (ui.info) { ui.sheet = { type: 'skillinfo', i }; return render(); }
  if (ui.reroll) { ui.reroll = false; rerollDie(f, i); return updateFight(); }
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
    // G7: the shown move winds up for a beat before it lands
    { const it = document.getElementById('intent'); if (it && !REDUCED && f.phase !== 'stunned') { it.classList.add('windup'); await wait(240); it.classList.remove('windup'); } }
    enemyTurn(f);
    const eng = f.log.splice(b2); summarize(f, 'B'); eng.forEach(l => f.log.push(l)); playEvents(f); updateFight();
    if (f.over) break;
    if (f.phase === 'stunned') { await wait(800); skipPlayer(f); updateFight(); await wait(500); continue; }
    break;
  }
  ui.busy = false; updateFight();
  if (f.over) {
    // G6: the loser's panel drains to grey under a stamp before the summary comes up
    const lost = f.B.hp <= 0 ? 'B' : f.A.hp <= 0 ? 'A' : null, el = lost && document.getElementById(lost === 'A' ? 'me' : 'foe');
    if (el && !REDUCED) { el.classList.add('downed'); stamp(lost, lost === 'B' ? 'Defeated' : 'Down', 'brk'); await wait(450); }
    await wait(700); finishFight();
  }
}
function finishFight() {
  const f = ui.fight, before = evSnap(run);
  const res = resolveFight(run, f, run.practice ? META : meta);
  poolFile(res);
  // Every fight that the run goes on from ends on a summary, then each notification it raised as its own card, tapped
  // away one at a time (ui.notes). Settings > Fast wins sends ordinary wins straight on with notices instead.
  // Run endings (erased, spared, elite, rewind, practice) keep their own sheets and notices.
  const goesOn = !res.rewind && !res.death && !res.spared && !res.eliteOver && !res.practiceDone;
  const plain = res.won && goesOn && SET.fastWins;
  if (plain) res.msgs.unshift({ t: 'win', text: `[Victory. +${res.gold} gold, healed 30%.]` });
  sfx(res.death ? 'erase' : res.won ? 'win' : res.heartsLost ? 'heart' : 'loss');
  if (res.heartsLost && !REDUCED) { app.classList.add('bleed'); setTimeout(() => app.classList.remove('bleed'), 420); }
  if (res.rested) { meta.echoes += 3; res.msgs.push({ t: 'broadcast', text: `[You laid ${res.rested.champ} to rest. +3 Echoes.${canShare() ? ` ${ownerName(res.rested.owner)} will hear of it.` : ''}]` }); recordRest(res.rested); }
  if (goesOn && !plain) { res.msgs.forEach(m => logRun(m.text, m.t)); ui.notes = null; } // U2: what the fight caused is listed on the summary itself, one line after another, with one Continue else { ui.notes = null; pushMsgs(res.msgs); }
  ui.result = res; ui.erDone = 0; ui.erBusy = false; res.changes = evDiff(before, run);
  if (res.practiceDone) { ui.practiceAfter = true; }
  if (res.fell) recordWin(res.fell);
  if (res.death) { const out = endRun(run, meta, 'erased'); recordRunStats('erased'); ui.end = { kind: 'erased', echoes: out.echoes, snap: out.snap, res, rp: out.rp, opened: out.trial, observed: finishDaily(false), filed: !!run.poolFiled }; lsDel(RUN_KEY); }
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
const orList = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1] : a.join('');
function pieceBody(id, star, mods, power) {
  star = star || 1; mods = mods || [];
  if (isGear(id)) {
    const g = GEAR[id];
    return `<div class="srow ${mainTag(id)}"><div class="sr-h"><span class="sr-name">${esc(g.name)}</span>${stars(star)}${rk(g.rank)}</div><div class="sr-meta">${tagNames(id)}<span class="tagn">${g.slot}</span></div>
      <div class="sr-desc"><b>${Object.entries(gearStats(id, star)).map(([k, v]) => `+${v} ${k}`).join(', ')}.</b> ${esc(gearText(id, star))}${flavHTML(g.flavour)}</div>${star < 3 ? `<div class="sr-next">At ★${star + 1}: ${esc(gearText(id, star + 1))}</div>` : ''}</div>`;
  }
  const d = moddedDef(id, mods);
  const p = power || skillPower(d, effStats(run), star) * d.powerMult;
  return `<div class="srow ${mainTag(id)}"><div class="sr-h"><span class="sr-name">${mods.length ? `<em class="pfx">${esc(mods.map(m => PREFIXES[m].name).join(' '))}</em> ` : ''}${esc(d.name)}</span>${stars(star)}${rk(effRank(id, mods))}</div>
    <div class="sr-meta">${tagNames(id)}${d.quick ? '<span class="tagn q">Quick</span>' : ''}<span class="tagn">${d.cd ? d.cd + '-turn cooldown' : 'no cooldown'}</span></div><div class="sr-desc">${esc(describe(d, p))}${flavHTML(SKILLS[id].flavour)}</div>
    ${star === 2 && SKILLS[id].evo ? `<div class="sr-next">At ★3 it evolves into ${orList(SKILLS[id].evo.map(e => esc(SKILLS[e].name)))}.</div>` : star === 1 ? '<div class="sr-next">3 copies merge into ★2: +50% power.</div>' : ''}</div>`;
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
  if (g && GEAR[p.id].consumable) return sheetWrap('On your bench', pieceBody(p.id, p.star, p.mods) + gotHTML(p), `<button class="btn ghost" data-act="close">Not yet</button><button class="btn primary" data-act="patch-open" data-u="${p.u}">Use</button>`);
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
  return sheetWrap(where, pieceBody(p.id, p.star, p.mods) + gotHTML(p) + (acts.length && ui.screen === 'shop' ? `<div class="acts">${acts.join('')}</div>` : ui.screen !== 'shop' ? '<p class="sh-p fine">Equip, swap and sell in the shop.</p>' : ''),
    canSell ? `<button class="btn ghost danger-t" data-act="sell" data-u="${p.u}">Sell · ${sellValue(p)}g</button><button class="btn primary" data-act="close">Done</button>` : `<button class="btn primary" data-act="close">Done</button>`);
}
// Where a piece and its prefixes came from: the lines kept when they were given (p.got, p.mgot)
function gotHTML(p) {
  const mods = (p.mods || []).map(bareMod), rows = [];
  if (p.got) rows.push(`<li><b>${esc(pieceDef(p.id).name)}</b>: ${esc(p.got)}</li>`);
  Object.entries(p.mgot || {}).forEach(([m, t]) => { if (mods.includes(bareMod(m)) && PREFIXES[bareMod(m)]) rows.push(`<li><b>${esc(PREFIXES[bareMod(m)].name)}</b>: ${esc(t)}</li>`); });
  return rows.length ? `<h4 class="got-h">How you got it</h4><ul class="msgs got">${rows.join('')}</ul>` : '';
}
// What your choices have set up for later fights (run.marks, from core.js addMark), and which choice set each
function liveMarks() { return (run.marks || []).filter(m => m.kind !== 'ward' || run.ward > 0); }
function marksBtn() { const n = liveMarks().length; return n ? `<button class="link mk" data-act="sheet" data-s="marks">[${n} pending effect${n > 1 ? 's' : ''} from your choices] ›</button>` : ''; }
function marksSheet() {
  const L = { next: 'Next fight', foe: 'Next fight', stakes: 'Next fight', ward: `Next ${run.ward > 1 ? run.ward + ' losses' : 'loss'}`, always: 'Every fight' };
  const rows = liveMarks().map(m => `<li><b>${L[m.kind]}</b>: ${esc(m.text.charAt(0).toUpperCase() + m.text.slice(1))}.<br><small>From: ${esc(m.from)}</small></li>`).join('');
  return sheetWrap('[Pending effects]', `<p class="sh-p">[Effects of your choices, waiting for the arena.]</p><ul class="msgs marks">${rows}</ul>`, '<button class="btn primary" data-act="close">Done</button>');
}
// Unsigned Patch (experimental, gear.js): three rules offered, one removed for the rest of the run
function patchSheet() {
  const S = ui.sheet, offer = patchOffer(run);
  const opts = offer.map(k => `<button class="choice glitch" data-act="patch-pick" data-k="${k}"><div class="sr-h"><span class="sr-name">Remove: ${esc(PATCH_RULES[k].name)}</span></div><div class="sr-desc">${esc(PATCH_RULES[k].text)}</div></button>`).join('');
  return sheetWrap('[Unsigned Patch]', `<p class="sh-p">[Publisher: unknown. This patch removes one rule for the rest of the run. Select the rule.]</p>${opts}`, '<button class="btn ghost" data-act="close">Not yet</button>', 'sys', true);
}
// The first time a stat line is offered, the System says so once
function statLinesNotice() {
  const p = run.pending[0]; if (meta.statLines || run.practice || !p || p.type !== 'event' || !eventOpts(run, p.key).some(i => EVENTS[p.key].opts[i].check)) return;
  meta.statLines = true; saveMeta(); setTimeout(() => toast('[Attribute dialogue unlocked. Your build has opinions now.]', 'class'), 300);
}
// Event outcomes: what changed between before and after a choice, shown in the event until Continue
function evSnap(run) { return { gold: run.gold, hearts: run.hearts, hp: Math.round(run.hp), max: maxHp(run), notice: run.notice || 0, fav: Object.assign({}, run.favour), ids: allPieces(run).map(x => x.u + ':' + x.id + ':' + (x.star || 1)) }; }
function evDiff(a, run) {
  const b = evSnap(run), out = [], sgn = n => (n > 0 ? '+' : '−') + Math.abs(n), add = (text, good) => out.push({ text, good });
  if (b.gold !== a.gold) add(`${sgn(b.gold - a.gold)} gold`, b.gold > a.gold);
  if (b.hearts !== a.hearts) add(`${sgn(b.hearts - a.hearts)} Heart${Math.abs(b.hearts - a.hearts) > 1 ? 's' : ''}`, b.hearts > a.hearts);
  if (b.max !== a.max) add(`Max HP ${sgn(b.max - a.max)}`, b.max > a.max);
  if (b.hp !== a.hp && b.hp - a.hp !== b.max - a.max) add(`${sgn(b.hp - a.hp)} HP`, b.hp > a.hp);
  if (b.notice !== a.notice) add(`Noticed ${sgn(b.notice - a.notice)}`, b.notice < a.notice);
  Object.keys(GODS).forEach(g => { const v = (b.fav[g] || 0) - (a.fav[g] || 0); if (v) add(`${sgn(v)} Favour · ${GODS[g].name}`, v > 0); });
  const nm = k => { const [, id, st] = k.split(':'), d = pieceDef(id); return d ? d.name + (+st > 1 ? ' ' + '★'.repeat(+st) : '') : id; };
  b.ids.filter(k => !a.ids.includes(k)).forEach(k => add(`Gained: ${nm(k)}`, true));
  a.ids.filter(k => !b.ids.includes(k) && !b.ids.some(x => x.split(':')[0] === k.split(':')[0])).forEach(k => add(`Lost: ${nm(k)}`, false));
  return out;
}
// The messages a fight result shows: erase lines become rows and the defeat lines repeat the summary
function noteList(msgs) { return msgs.filter(m => !/^\[(Erasing|World): |^\[Defeat\. |^\[The Final Champion waits/.test(m.text)); }
// One notification after a fight, tapped away before the next
function noteSheet() {
  const m = ui.notes[0], i = ui.noteN - ui.notes.length + 1, r = ui.result;
  return sheetWrap(`[Notification ${i} of ${ui.noteN}]`, `${r ? `<p class="sh-p fine ev-you">After: ${r.won ? 'victory over' : 'defeat by'} ${esc(r.enemy)}</p>` : ''}<div class="sysbox ev-out"><p class="t-${esc(m.t || 'sys')}">${esc(m.text)}</p>${itemCard(m)}</div>`,
    `<button class="btn primary" data-act="note-ok">${ui.notes.length > 1 ? 'Next' : 'Continue'}</button>`, 'ev-res note', true);
}
// An item reward: its card folded under its line, so you can see what you got without leaving
function itemCard(m) { if (!m.item || !pieceDef(m.item)) return ''; const f = m.u != null && findPiece(run, m.u), q = f ? f.p : { star: 1, mods: [] }; return `<details class="ev-item"><summary>${esc(pieceDef(m.item).name)} <small>tap to view</small></summary>${pieceBody(m.item, q.star, q.mods)}</details>`; }
function evResultSheet() {
  const R = ui.sheet;
  const lines = R.lines.map(m => `<p class="t-${esc(m.t || 'sys')}">${esc(m.text)}</p>${itemCard(m)}`).join('');
  const chips = R.changes.length ? `<div class="ev-ch">${R.changes.map(c => `<span class="${c.good ? 'good' : 'bad'}">${esc(c.text)}</span>`).join('')}</div>` : '';
  let meter = '', wait = '';
  if (R.roll) {
    const fresh = !R.rolled && !REDUCED; if (!R.rolled) setTimeout(() => { R.rolled = true; }, 1500);
    if (fresh) wait = ' rolling';
    meter = `<div class="rollm${fresh ? ' go' : ''} ${R.roll.won ? 'won' : 'lost'}" style="--ch:${R.roll.ch}%;--land:${R.roll.land}%" role="img" aria-label="${R.roll.stat} check, ${R.roll.ch}% chance: ${R.roll.won ? 'success' : 'failed'}"><span class="rm-z"></span><span class="rm-n"></span><span class="rm-l">${R.roll.stat} ${R.roll.ch}%</span><span class="rm-s">${R.roll.won ? 'Success' : 'Failed'}</span></div>`;
  }
  return sheetWrap(R.title, `<p class="sh-p fine ev-you">You chose: ${esc(R.label)}</p>${meter}<div class="sysbox ev-out${wait}">${lines}</div>${chips ? `<div class="${wait.trim()}">${chips}</div>` : ''}`, '<button class="btn primary" data-act="close">Continue</button>', 'ev-res', true);
}
function pendingSheet() {
  const p = run.pending[0]; if (!p) return '';
  if (p.type === 'event') {
    const E = EVENTS[p.key]; if (!E) { run.pending.shift(); return ''; }
    const chainTag = E.crisis && FATES[E.fate] ? `<p class="sh-p fine">[Live from ${esc(run.world.name)}: ${esc(FATES[E.fate].name)}. Fate: ${fateState(run)}. ${esc(run.world.name)} can hear you. Its Hearts are in your hands.]</p>` : E.chain && CHAINS[E.chain].start !== p.key ? `<p class="sh-p fine">[Event chain: ${esc(CHAINS[E.chain].name)}]</p>` : '';
    const evHint = eventHint(E, E.opts.some((_, i) => { const o = eventOpt(run, p.key, i); return o && o.roll; }));
    const lead = `${chainTag}${evHint}<p class="sh-p big">${esc(eventText(run, p.key))}</p>`;
    return sheetWrap(E.title, lead + E.opts.map((_, i) => { const o = eventOpt(run, p.key, i); return o ? `<button class="choice ${o.check || o.roll ? 'chk' : ''} ${E.opts[i].glitch ? 'inserted' : ''}" data-act="event" data-i="${i}">${E.opts[i].glitch ? '<span class="ins-tag">[Option inserted]</span>' : ''}<div class="sr-h"><span class="sr-name">${o.check || o.roll ? `<span class="chk-tag">${esc(o.roll ? rollTag(run, o.roll) : checkTag(o.check))}</span> ` : ''}${esc(o.label)}</span></div><div class="sr-desc">${esc(o.desc)}</div></button>` : ''; }).join(''), false, (E.crisis ? 'sys crisis' : E.chain ? 'sys' : '') + ' k-event');
  }
  if (p.type === 'gift') {
    return sheetWrap('[Additional Gift]', `<p class="sh-p">${p.why ? `[${esc(p.why)}. One more god signs your file. Choose 1 Gift.]` : '[Milestone reached. The System grants one more Gift. Choose 1.]'}</p>` + p.offers.map(k => `<button class="choice" data-act="take-gift" data-k="${k}"><div class="sr-h"><span class="sr-name">${esc(GIFTS[k].name)}</span><span class="tagn">${GIFTS[k].arch ? 'Affinity' : GIFT_CATS[GIFTS[k].cat]}</span></div><div class="sr-desc">${esc(GIFTS[k].desc)}${flavHTML(GIFTS[k].flavour)}</div></button>`).join(''), false, 'sys k-gift');
  }
  if (p.type === 'intake') {
    const body = p.offers.map((k, i) => { const D = INTAKE[k]; return D ? `<button class="choice ${D.cost ? 'chk' : ''}" data-act="take-intake" data-i="${i}"><div class="sr-h"><span class="sr-name">${esc(D.name)}</span><span class="tagn">${D.cost ? 'At a price' : 'Plain'}</span></div><div class="sr-desc">${esc(D.say)}${flavHTML(D.flavour)}</div></button>` : ''; }).join('');
    return sheetWrap('[Intake Interview]', `<p class="sh-p">[Before your first match, the System offers every Entrant one deal. Two are plain. Two give more and take something. Choose 1.]</p>` + body, false, 'sys k-intake', true);
  }
  if (p.type === 'augment') {
    const body = p.offers.map((k, i) => `<button class="choice" data-act="take-augment" data-i="${i}"><div class="sr-h"><span class="sr-name">${esc(AMENDMENTS[k].name)}</span><span class="tagn">Amendment</span></div><div class="sr-desc">${esc(AMENDMENTS[k].say)}</div></button>`).join('');
    return sheetWrap('[Rules review]', `<p class="sh-p">[The tournament's rules are open for review. The System will pass one Amendment of your choosing. It lasts the rest of the run.]</p>` + body, `<button class="btn ghost" data-act="take-augment" data-i="skip">Pass none</button>`, 'sys k-rules', true);
  }
  if (p.type === 'door') {
    const C = CURSES[p.curse] || {};
    return sheetWrap('[Unlisted door]', `<p class="sh-p big">[There is a door here that is on no map of the arena. The System declines to comment.]</p><p class="sh-p">Behind it: <b>${esc(C.name)}</b>, ${esc(C.say)} for your next ${CURSE_FIGHTS} fights. When it lifts, the door pays: <b>${esc(outcomeText(p.pay))}</b>.</p><button class="choice chk" data-act="take-door" data-i="open"><div class="sr-h"><span class="sr-name">Open the door</span><span class="tagn">Cursed</span></div><div class="sr-desc">Take the curse now and the payoff after ${CURSE_FIGHTS} fights, won or lost.</div></button>`, `<button class="btn ghost" data-act="take-door" data-i="pass">Walk past</button>`, 'sys k-door', true);
  }
  if (p.type === 'spoils') {
    const K = SPOILS[p.kind] || SPOILS.supplies;
    const body = p.offers.map((o, i) => o.k === 'piece' && pieceDef(o.id) ? `<button class="choice ${mainTag(o.id)}" data-act="take-spoils" data-i="${i}">${pieceBody(o.id, 1, o.mods)}</button>`
      : `<button class="choice" data-act="take-spoils" data-i="${i}"><div class="sr-h"><span class="sr-name">${esc(spoilsText(o))}</span><span class="tagn">${esc(K.name)}</span></div></button>`).join('');
    return sheetWrap(`[Spoils · ${K.name}]`, `<p class="sh-p">[Victory logged. ${esc(K.say)} Or leave it for ${SPOILS_SKIP} gold.]</p>` + body, `<button class="btn ghost" data-act="take-spoils" data-i="skip">Leave it · +${SPOILS_SKIP} gold</button>`, 'sys k-spoils', true);
  }
  if (p.type === 'levelup') {
    const L = p.perk && LEVEL_PERKS[p.perk], nx = run.level + 1, lb = hasGift(run, 'latebloomer');
    const lvBtn = `<button class="choice" data-act="take-level" data-k="level"><div class="sr-h"><span class="sr-name">Level up</span><span class="tagn">Lv ${nx}</span></div><div class="sr-desc">+4 Max HP, rarer pieces in the shop and ${lb ? '2 stat points' : '1 stat point'} to place.</div></button>`;
    const pBtn = L ? `<button class="choice" data-act="take-level" data-k="perk"><div class="sr-h"><span class="sr-name">Take ${esc(L.name)}</span><span class="tagn">Perk</span></div><div class="sr-desc">${esc(levelPerkText(run, p.perk))}${flavHTML(L.flavour)}</div></button>` : '';
    return sheetWrap('[Level available]', `<p class="sh-p">[Battle logged. Level ${nx} is ready. Take it, or skip it for the perk on offer.]</p>` + lvBtn + pBtn, false, 'sys k-level');
  }
  if (p.type === 'perk') {
    return sheetWrap(`[Class advancement · ${p.to}-rank]`, `<p class="sh-p">[Promotion recorded. Rank letters carry no official meaning. Choose 1 permanent perk. It applies from your next world, but never in the Pending World.]</p>` + p.offers.map(k => `<button class="choice" data-act="take-perk" data-k="${k}"><div class="sr-h"><span class="sr-name">${esc(PERKS[k].name)}</span><span class="tagn">Perk</span></div><div class="sr-desc">${esc(PERKS[k].desc)} <i class="fine">${esc(PERKS[k].flavour)}</i></div></button>`).join(''), false, 'sys');
  }
  if (p.type === 'rune') return enchantSheet(p.mods, 'rune');
  if (p.type === 'adv') {
    const A = ARCH[p.arch];
    return sheetWrap(`[Path evolution · ${A.path}]`, `<p class="sh-p">[${esc(A.name)}: 6 pieces. ${esc(A.path)} can evolve. Choose what it becomes. The choice holds for this run.]</p>` + ADVANCE[p.arch].map((o, i) => { const v = i ? o : advOf({}, p.arch); return `<button class="choice a-${p.arch}" data-act="advance" data-i="${i}"><div class="sr-h"><span class="sr-name">${esc(o.name)}</span></div><div class="sr-desc">${esc(v.b)}</div></button>`; }).join(''), false);
  }
  if (p.type === 'evo') {
    const f = findPiece(run, p.u); if (!f) { run.pending.shift(); return ''; }
    const d = SKILLS[f.p.id];
    return sheetWrap(`[Evolution · ${d.name} ★3]`, `<p class="sh-p">${esc(d.name)} has reached ★3. Choose what it becomes.</p>` + d.evo.map(e => `<button class="choice ${mainTag(e)}" data-act="evolve" data-id="${e}">${pieceBody(e, 3, f.p.mods.filter(m => prefixOk(e, m, [])))}</button>`).join(''), false, 'evo');
  }
  return '';
}
function enchantSheet(mods, from) {
  const sel = ui.enchantSel;
  // Corrupt: the two rolled results, once a skill is picked (kept on the run, so leaving and coming back can't reroll them)
  if (from !== 'rune' && run.corrupting) {
    const c = run.corrupting, f = findPiece(run, c.u);
    if (f) {
      const body = `<p class="sh-p">[Corruption in progress: ${esc(SKILLS[f.p.id].name)}. Two outcomes are available. Select one.]</p>` + c.opts.map((o, i) => `<button class="choice glitch ${mainTag(f.p.id)}" data-act="corrupt-do" data-i="${i}">${pieceBody(f.p.id, o.k === 'star' ? Math.min(3, f.p.star + 1) : f.p.star, o.k === 'mod' ? f.p.mods.concat(o.m).slice(-MAX_MODS_CORRUPT) : f.p.mods)}<div class="sr-next">${esc(corruptText(o))}</div></button>`).join('');
      return sheetWrap('[Corrupt]', body, '', 'sys', true);
    }
  }
  if (sel === 'corrupt') {
    const list = corruptTargets(run).map(p => { const f = findPiece(run, p.u); return `<button class="choice ${mainTag(p.id)}" data-act="corrupt-pick" data-u="${p.u}">${pieceBody(p.id, p.star, p.mods)}<div class="sr-next">${f.at === 'bench' ? 'On your bench' : 'On your bar'}</div></button>`; }).join('');
    return sheetWrap('Corrupt which skill?', list, `<button class="btn ghost" data-act="ench-back">Back</button>`, 'sys', true);
  }
  if (sel == null) {
    const corruptBtn = from !== 'rune' && corruptTargets(run).length ? `<button class="choice glitch" data-act="ench-mod" data-i="corrupt"><div class="sr-h"><span class="sr-name"><em class="pfx">Corr\u0337upt a skill</em></span></div><div class="sr-desc">Two results are rolled and you keep one: a star, a prefix or a glitch. The skill then takes no more prefixes.</div></button>` : '';
    const runeGot = from === 'rune' && run.pending[0] && run.pending[0].got;
    const body = `${runeGot ? `<p class="sh-p sysl">${esc(runeGot)}</p>` : ''}<p class="sh-p">${from === 'rune' ? 'The System offers a rune. ' : ''}Pick a prefix, then the skill to carve it into. A skill holds up to ${MAX_MODS}; a third replaces its oldest. Each prefix raises the skill's rank.</p>` + mods.map((m, i) => prefixTargets(run, m).length ? `<button class="choice${PREFIXES[m].glitch ? ' glitch' : ''}" data-act="ench-mod" data-i="${i}"><div class="sr-h"><span class="sr-name"><em class="pfx">${esc(PREFIXES[m].name)}</em></span></div><div class="sr-desc">${esc(PREFIXES[m].desc)}</div></button>` : '').join('') + corruptBtn;
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
  return `<div class="runcard ${opts.erased ? 'erased' : ''}"><div class="rc-h">${crest(s.champ, opts.erased ? 'erased' : 'champion', !!opts.big, { sigil: s.sigil, color: s.color }, s.rank)}<div><div class="ch-name">${esc(s.champ)}</div><div class="ch-sub">${s.entrant ? 'Entrant ' + s.entrant + ' · ' : ''}${s.path ? esc(ARCH[s.path].path) + ' · ' : ''}Lv ${s.level}${s.title && TITLES[s.title] ? ' · ' + esc(TITLES[s.title].name) : ''}</div>${layerNames(snapLayers(s)) ? `<div class="ch-sub">${esc(layerNames(snapLayers(s)))}</div>` : ''}</div></div>
    ${strip}
    ${s.rec ? `<p class="rc-bio">${bioHTML(s.rec, s.worldType, s.worldName, s.name || s.champ)}</p><button class="rc-l rc-rec" data-act="rec-snap" data-at="${s.at}"><span>Record</span>${recLeft(s.rec)} of ${s.rec.ids.length} entries survive ›</button>` : ''}
    <div class="rc-l"><span>Skills</span>${s.bar.map(x => esc(SKILLS[x.id] ? SKILLS[x.id].name : x.id) + (x.star > 1 ? ' ★' + x.star : '')).join(' · ') || '–'}</div>
    <div class="rc-l"><span>Gear</span>${(s.gear || []).map(x => esc(GEAR[x.id] ? GEAR[x.id].name : x.id) + (x.star > 1 ? ' ★' + x.star : '')).join(' · ') || '–'}</div>
    ${s.hiddenPath && HIDDEN_PATHS[s.hiddenPath] ? `<div class="rc-l"><span>Path</span>${esc(HIDDEN_PATHS[s.hiddenPath].name)} (hidden)</div>` : ''}
    ${best ? `<div class="rc-l"><span>Best fight</span>${esc(best.name)} in ${best.turns} turn${best.turns === 1 ? '' : 's'}</div>` : ''}
    <div class="rc-l"><span>${opts.erased ? 'Erased by' : 'Hearts'}</span>${opts.erased ? esc(s.cause || 'the System') : `${s.hearts != null ? s.hearts : '?'} of ${s.maxHearts || 10} left`}${lost ? ` · ${lost} lost` : ''}</div></div>`;
}
// The opponent's last word on the result sheet (res.foeLine, from FOE_LINES)
function foeHTML(r) { return r && r.foeLine ? `<p class="sh-p ${/^\[/.test(r.foeLine) ? 'sysl' : 'foe-q'}">${esc(r.foeLine)}</p>` : ''; }
function resultSheet() {
  const r = ui.result, e = ui.end;
  if (r.rewind) return sheetWrap('[Return by Death]', `<p class="sh-p big">${esc(r.enemy)} kills you. Then the world blinks.</p><p class="sh-p">The fight begins again. Nobody else remembers. Your cheat skill is spent.</p>`, `<button class="btn primary" data-act="rewind">Try again</button>`, 'sys', true);
  if (e && e.kind === 'spared') return sheetWrap(`[${run.world.name} is spared]`, `<p class="sh-p big">You beat the Final Champion. ${esc(run.world.name)} survives the tournament, and ${esc(run.champ)} joins the Hall of Champions.</p>${foeHTML(r)}${recapHTML(r)}<p class="sh-p">The System offers the <b>elite bracket</b>: ${!run.seed && meta.rank && rankIdx(meta.rank.letter) >= rankIdx('A') ? '3 more matches, as befits your rank,' : '2 more matches'} against past winners and the Undefeated. Your world is safe either way. Each elite win earns extra Echoes.</p><p class="sh-p">[${esc(run.world.name)} will be entered again, eventually. Exhibition wins delay that.]</p><p class="sh-p fine">+${e.echoes} Echoes earned.</p>`, `<button class="btn ghost" data-act="end-run">End as champion</button><button class="btn primary" data-act="enter-elite">Enter the elite bracket</button>`, 'win', true);
  if (e && (e.kind === 'elite-clear' || e.kind === 'elite-fall')) return sheetWrap(e.kind === 'elite-clear' ? '[The Undefeated has fallen]' : '[Elite bracket over]', `<p class="sh-p big">${e.kind === 'elite-clear' ? 'Impossible. The System will need a new record.' : run.endless ? `You fall at Depth ${run.endless}. Your world remains spared.${run.endless > 1 ? ` Deepest cleared this run: ${run.endless - 1}.` : ''}` : 'You fall in the elite bracket. Your world remains spared.'}</p>${foeHTML(r)}<p class="sh-p fine">Elite wins: ${run.eliteWins}. +${8 * run.eliteWins} Echoes.</p>`, e.kind === 'elite-clear' && canClimb(run) ? `<div class="row2 even"><button class="btn" data-act="end-run">Finish</button><button class="btn primary" data-act="climb">Keep climbing</button></div>` : `<button class="btn primary" data-act="end-run">Finish</button>`, e.kind === 'elite-clear' ? 'win' : '', true);
  const steps = eraseSteps(r);
  if (e && e.kind === 'erased') return sheetWrap('[Eliminated]', `<p class="sh-p big">${esc(r.enemy)} wins. ${esc(e.snap.worldName)} has no Hearts left.</p>${foeHTML(r)}${eraseRows(steps)}${steps.length ? '' : lastTurnsHTML() + recapHTML(r)}<p class="sh-p">${esc(e.snap.worldName)} will be erased, and ${esc(e.snap.champ)} will join the Hall of the Erased. They may return to face you.</p>`, eraseFoot(steps, `<button class="btn primary" data-act="result-ok">Accept</button>`), 'lose', true);
  const lines = [];
  if (r.won) lines.push(`+${r.gold} gold · healed 30%`);
  if (!r.won && !run.elite) lines.push(`A piece of ${esc(run.world.name)} is erased: −${r.heartsLost} Heart${r.heartsLost > 1 ? 's' : ''}. ${run.hearts} left. ${ui.fight && ui.fight.spec.kind === 'final' ? 'You must face the Final Champion again.' : 'The tournament moves on.'}`);
  // erase lines become rows, and the defeat lines repeat the summary above. With notification cards to follow, the
  // summary says how many instead of listing them
  const shown = noteList(r.msgs), chips = r.changes && r.changes.length ? `<div class="ev-ch">${r.changes.map(c => `<span class="${c.good ? 'good' : 'bad'}">${esc(c.text)}</span>`).join('')}</div>` : '';
  const msgs = ui.notes ? (ui.noteN ? `<p class="sh-p fine">[${ui.noteN} notification${ui.noteN > 1 ? 's' : ''} to review.]</p>` : '') : shown.length ? `<ul class="msgs reel">${shown.map((m, i) => `<li class="t-${m.t}" style="animation-delay:${Math.min(1200, 350 + i * 180)}ms">${esc(m.text)}${itemCard(m)}</li>`).join('')}</ul>` : '';
  // G4: the lost Hearts drop out of the row, once (later redraws of this sheet show them already gone)
  let hrow = '';
  if (!r.won && !run.elite && r.heartsLost > 0) {
    const fresh = !r.hfx && !REDUCED; if (!r.hfx) setTimeout(() => { r.hfx = true; }, 1200);
    hrow = `<div class="hrow" aria-hidden="true">${'<i>♥</i>'.repeat(Math.max(0, run.hearts))}${fresh ? Array.from({ length: Math.min(r.heartsLost, 6) }, (_, i) => `<i class="lose" style="animation-delay:${200 + i * 140}ms">♥</i>`).join('') : ''}</div>`;
  }
  return sheetWrap(r.won ? 'Victory' : 'Defeat', `<p class="sh-p big">${r.won ? `${esc(r.enemy)} is defeated.` : `${esc(r.enemy)} wins this round.`}</p>${foeHTML(r)}${hrow}<p class="sh-p">${lines.join(' ')}</p>${chips ? `<p class="sh-p fine">Altogether this fight:</p>${chips}` : ''}${eraseRows(steps)}${r.won ? '' : lastTurnsHTML()}${steps.length ? '' : recapHTML(r)}${msgs}`, eraseFoot(steps, `<button class="btn primary" data-act="result-ok">Continue</button>`), r.won ? 'win' : 'lose', true);
}
// A stat's Finesse and Resistance at n points, in short: "Break +12% · resists Weaken 12%"
function faceTag(k, n) { const F = STAT_FACES[k]; return `${F.finesse.tag(n)} · resists ${RESIST_NAME[F.resist]} ${Math.round(Math.min(RESIST.max, RESIST.per * n) * 100)}%`; }
// Progress through the levels: one is offered after every battle, up to LEVEL_MAX
function lvFill() { return Math.round((run.level - 1) / (LEVEL_MAX - 1) * 100); }
// A collapsed section of a sheet: the heading is the tap target
function sec(title, html, open) { return `<details class="ssec"${open ? ' open' : ''}><summary>${title}</summary><div class="ssec-b">${html}</div></details>`; }
function statsSheet() {
  const s = effStats(run), p = buildPlayer(run), train = ui.screen === 'shop', pr = pointPrice(run);
  const rows = STATS.map(k => `<div class="strow s4"><span class="st-k">${k}</span><details class="st-n"><summary>${STAT_INFO[k].name}</summary><small>${STAT_INFO[k].short}</small><small class="face">${faceTag(k, s[k])}</small></details><span class="st-v">${s[k]}${s[k] !== run.stats[k] ? `<small title="From gear">${s[k] > run.stats[k] ? '+' : '−'}${Math.abs(s[k] - run.stats[k])}</small>` : ''}</span>${run.statPts ? `<button class="btn small add" data-act="stat" data-k="${k}" aria-label="Add a point to ${STAT_INFO[k].name}">+</button>` : train ? `<button class="btn small add" data-act="train" data-k="${k}" ${run.gold < pr ? 'disabled' : ''} aria-label="Train ${STAT_INFO[k].name} for ${pr} gold">+${pr}g</button>` : '<span></span>'}</div>`).join('');
  const gods = Object.entries(GODS).map(([g, G]) => `<div class="god"><div class="gd-h"><b>${esc(G.name)}${run.patron === g ? ' · Patron' : ''}</b><span>${run.favour[g] || 0} Favour</span></div><div class="gbar"><i style="width:${Math.min(100, (run.favour[g] || 0) / 8 * 100)}%"></i><em style="left:50%"></em></div><small>Gift at 4, blessing at 8: ${esc(G.blessing)}</small></div>`).join('');
  const body = `${run.statPts ? `<p class="sh-p pts">${run.statPts} stat point${run.statPts > 1 ? 's' : ''} to spend.</p>` : train ? `<p class="sh-p">Train a stat: ${pr} gold a point, you have ${run.gold}. Levels come from battles, not training.</p>` : `<p class="sh-p fine">Train stats with gold in the shop.</p>`}${rows}
    <dl class="dl"><div><dt>Max HP</dt><dd>${maxHp(run)}</dd></div><div><dt>Crit</dt><dd>${Math.round(p.crit * 100)}%</dd></div><div><dt>Dodge</dt><dd>${Math.round(p.dodge * 100)}%</dd></div><div><dt>Level</dt><dd>${run.level}</dd></div></dl>
    ${sec('Stat milestones', `<ul class="msgs">${STATS.map(k => `<li class="${run.milestones[k] ? '' : 'unk'}"><b>${k} 10 · ${esc(MILESTONES[k].name)}</b>: ${esc(MILESTONES[k].desc)}${run.milestones[k] ? '' : ` <small>(${s[k]}/10)</small>`}</li>`).join('')}</ul>`)}${sec('Title', titleList())}${sec('System quests', questList(), true)}
    ${run.hiddenPath ? sec(`Hidden Path · ${esc(HIDDEN_PATHS[run.hiddenPath].name)}`, `<p class="sh-p">${esc(HIDDEN_PATHS[run.hiddenPath].desc)}</p>`) : ''}
    ${sec('Gifts', `<ul class="msgs">${run.gifts.map(k => `<li><b>${esc(GIFTS[k].name)}</b>: ${esc(GIFTS[k].desc)}${flavHTML(GIFTS[k].flavour)}${(k === 'rewind' && run.usedRewind) || (k === 'breath' && run.usedBreath) ? ' <small>(spent)</small>' : ''}</li>`).join('') || '<li class="unk">None</li>'}</ul>`)}
    ${sec(`World · ${esc(run.world.name)}`, `<p class="sh-p">${esc(WORLD_TYPES[run.world.type].name)}, rank ${WORLD_RANKS[run.world.rank]}.${layerSentences(run.world)} ${esc(MODIFIERS[run.world.mod].name)}: ${esc(MODIFIERS[run.world.mod].desc)}${FATES[run.world.fate] && (run.fateTrack || Object.values(FATES).some(F => F.crises)) ? ` Fate: ${fateState(run)}.` : ''}${run.ward ? ` Warded: ${run.ward} loss${run.ward > 1 ? 'es' : ''}.` : ''}</p>`)}
    ${sec('Sponsors', gods)}`;
  return sheetWrap(`${run.name} · Status`, body, `<button class="btn primary" data-act="close">Done</button>`);
}
function titleList() {
  const ts = Object.keys(TITLES).filter(k => meta.titles[k]);
  if (!ts.length) return '<p class="sh-p fine">No Titles yet. Earn them with feats in the arena.</p>';
  return `<div class="tlist">${ts.map(k => `<button class="gift ${run.title === k ? 'on' : ''}" data-act="equip-title" data-k="${k}"><span class="gf-h"><b>${esc(TITLES[k].name)}</b>${run.title === k ? '<span class="tagn q">Equipped</span>' : ''}</span><span class="gf-d">${esc(TITLES[k].desc)}${flavHTML(TITLES[k].flavour)}</span></button>`).join('')}</div><p class="sh-p fine">One Title at a time. Tap to equip or remove.</p>`;
}
function questList() {
  const qs = run.quests.filter(q => !QUESTS[q.id].hidden || q.done);
  const hidden = run.quests.filter(q => QUESTS[q.id].hidden && !q.done).length;
  return `<ul class="msgs">${qs.map(q => { const Q = QUESTS[q.id]; return `<li class="${q.failed ? 'unk' : q.done ? 't-loot' : ''}"><b>${q.done ? '✓ ' : q.failed ? '✗ ' : ''}${esc(Q.text)}</b> <small>${Q.goal > 1 && !q.done ? `${q.prog}/${Q.goal} · ` : ''}Reward: ${esc(outcomeText(Q.reward))}</small></li>`; }).join('')}${hidden ? `<li class="unk">[${hidden} hidden quest${hidden > 1 ? 's' : ''}: ???]</li>` : ''}</ul>`;
}
function archetypesSheet() {
  const c = runCounts(run);
  const body = run.arch.map(k => { const A = ARCH[k], n = c[k] || 0, t = archTier(n); return `<div class="archrow a-${k}"><div class="ar-h"><b><span class="dots2" aria-hidden="true"><i class="a-${k}"></i></span> ${A.name}</b><span class="fine">${esc(A.theme)} · ${A.stat}</span><span class="ar-n">${n}</span></div>${A.b.map((b, i) => `<div class="ar-b ${t > i ? 'on' : ''}"><span>${[2, 4, 6][i]}</span>${i === 2 && run.adv && run.adv[k] != null ? `<b>${esc(advOf(run.adv, k).name)}:</b> ${esc(advOf(run.adv, k).b)}` : i === 2 && ADVANCE[k] ? `${esc(b)} Or, as ${esc(ADVANCE[k][1].name)}: ${esc(ADVANCE[k][1].b)}` : esc(b)}</div>`).join('')}</div>`; }).join('');
  const hp = run.hiddenPath ? `<div class="archrow hidden"><div class="ar-h"><b>Hidden Path · ${esc(HIDDEN_PATHS[run.hiddenPath].name)}</b></div><div class="ar-b on">${esc(HIDDEN_PATHS[run.hiddenPath].desc)}</div></div>` : '<p class="sh-p fine">Reach 4 pieces in two archetypes at once to unlock a Hidden Path.</p>';
  return sheetWrap('Archetypes this run', `<p class="sh-p fine">Equipped pieces (skill bar and gear) count. Each different piece counts once; pieces with two tags count for both. At 4, the System names your path.</p>${body}${hp}<h4>Reactions</h4><ul class="msgs">${Object.values(REACTIONS).map(R => `<li><b>${R.name}</b> (${R.pair}): ${esc(R.text)}</li>`).join('')}</ul>`, `<button class="btn primary" data-act="close">Close</button>`);
}
function scoutSheet() {
  const spec = currentSpec(run);
  let body = '';
  if (spec.snap) body = `<p class="sh-p big">${esc(specName(spec))}</p><p class="sh-p">${esc(specStyle(spec))}. Level ${spec.snap.level}.</p>` + spec.snap.bar.map(s => pieceBody(s.id, s.star, s.mods, 1)).join('') + spec.snap.gear.map(g => pieceBody(g.id, g.star)).join('');
  else { const t = ENEMIES[spec.id]; body = `<p class="sh-p big">${esc(specName(spec))}</p><p class="sh-p">${esc(t.style)}.</p><ul class="msgs">${t.skills.map(s => `<li><b>${esc(s.n)}</b>: ${esc(describe({ fx: s.fx }))}</li>`).join('')}</ul><p class="sh-p fine">${hasReflex(spec) ? `They pick their moves by chance, favouring some, but never the same move three turns running or a big move twice running.${t.rival || t.final ? ' They also read the fight: they go around a big Block, clean off what you put on them, patch up when low and go for the kill when you are.' : ''}` : 'They use their skills in a fixed order, which you can learn.'} In the fight you'll also see their move after next.</p>${hasReflex(spec) ? reflexRules(spec.id).map(R => `<p class="sh-p fine">[Reflex. ${esc(REFLEX_ON[R.on].if)}, their next move is <b>${esc(R.move ? R.move.n : t.skills[R.use].n)}</b>${R.move ? ': ' + esc(describe({ fx: R.move.fx })) : '.'}]</p>`).join('') + '<p class="sh-p fine">[A Reflex never fires two turns running.]</p>' : ''}${t.phase ? `<p class="sh-p fine">[Below ${Math.round(t.phase.at * 100)}% HP, they change how they fight.]</p>` : ''}${traitsHTML(spec)}`; }
  if (districtUp(run, 'scout')) body += `<p class="sh-p sysl">[AGI ${STAT_EASY}] [While you were looking, you loosened a strap on their armour. They start the fight Weakened.]</p>`;
  return sheetWrap('Scout report', body, `<button class="btn primary" data-act="close">Done</button>`);
}
function skillInfoSheet() { const s = ui.fight.A.skills[ui.sheet.i]; if (s.key === 'copycat') return sheetWrap('Copycat', `<p class="sh-p">${esc(GIFTS.copycat.desc)}</p><p class="sh-p fine">${ui.fight.lastEnemySkill ? 'Next copy: ' + esc(ui.fight.lastEnemySkill.def.name) : 'The opponent has not acted yet.'}</p>`, `<button class="btn primary" data-act="close">Close</button>`); return sheetWrap(s.def.name, (s.def.basic ? `<div class="srow"><div class="sr-desc">${esc(describe(s.def, s.power))}</div></div>` : pieceBody(run.bar.find(p => p && p.u === s.u).id, s.star, s.mods, s.power)) + '<p class="sh-p fine">Numbers include your stats and stars. Turn off ? to use skills.</p>', `<button class="btn primary" data-act="close">Close</button>`); }
// Shown in the Menu so a layout report can include what the device told the game
function screenLine() { const s = screenInfo(); return `[Display: ${innerWidth}×${s.vh} of ${s.sh} · insets ${Math.round(s.top)}/${Math.round(s.bottom)}${s.standalone ? ' · app' : ''}${document.documentElement.style.getPropertyValue('--app-h') ? ' · stretched' : ''}]`; }
function menuSheet() {
  const cs = !cloud.on ? (FIREBASE ? '' : 'Progress is saved on this device only.') : cloud.syncOff ? 'Signed in, but your access level cannot save to the account. Progress stays on this device.' : 'Progress syncs to your account across devices.';
  return sheetWrap('Menu', `${cloudSignInHTML(false)}<p class="sh-p fine">${cs}${cloud.on && cloud.shared.length ? ` ${cloud.shared.length} shared champion${cloud.shared.length > 1 ? 's' : ''} from other entrants.` : ''}</p><div class="stack"><button class="btn" data-act="sheet" data-s="settings">Settings</button><button class="btn" data-act="sheet" data-s="howto">How to play</button>${run ? '<button class="btn" data-act="sheet" data-s="archetypes">Archetypes and reactions</button><button class="btn" data-act="sheet" data-s="syslog">System log</button>' : ''}<button class="btn" data-act="sheet" data-s="archive">Archive</button><button class="btn" data-act="sheet" data-s="halls">Halls</button><button class="btn" data-act="report">Report a bug or idea</button>
    ${ui.screen === 'fight' ? `<div class="speed" role="group" aria-label="Animation speed">${[1, 2, 3].map(v => `<button class="btn small ${ui.speed === v ? 'primary' : ''}" data-act="speed" data-v="${v}">${v}×</button>`).join('')}</div>` : ''}
    ${run ? (ui.confirmAbandon ? `<button class="btn danger" data-act="abandon-yes">Confirm: erase ${esc(run.world.name)}</button>` : `<button class="btn ghost danger-t" data-act="abandon">Abandon run</button>`) : ''}</div>`, false);
}
// One-time System hints (#18): the first time a system shows up in a real run, the System explains it once.
// Never in the practice run (the tutorial covers it there). Seen hints are kept in meta.hints.
const HINTS = [
  { k: 'gear', scr: 'shop', when: () => run.round >= 2 && !GEAR_SLOTS.some(g => run.gear[g]), text: '[Skills alone will not carry you. Open the Gear shop: gear adds stats and a passive, and counts toward archetypes.]' },
  { k: 'train', scr: 'shop', when: () => run.round >= 2 && run.gold >= pointPrice(run), text: '[You have gold to spare. Train turns it into extra stat points, on top of the one each level gives.]' },
  { k: 'windup', scr: 'fight', when: () => ui.fight && ui.fight.B.windup && !ui.busy, text: "[A big move takes a turn to wind up. Deal the damage shown under it this turn and it falls apart: they must do something else.]" },
  { k: 'reflex', scr: 'fight', when: () => ui.fight && ui.fight.B.reflex && !ui.busy, text: "[Every opponent has a Reflex: one thing you do that changes their next move. It is on their card, and you always see the move before it lands.]" },
  { k: 'break', scr: 'fight', when: () => ui.fight && ui.fight.B.breakMax && !ui.busy, text: "[The gold bar under their HP is their guard. Damage past Block fills it. Full, they are Broken: a lost turn and 50% more damage.]" },
  { k: 'notice', scr: 'choose', when: () => noticeOf(run) > 0, text: '[You have been Noticed. Every straight win makes opponents stronger. Losing a Heart resets it. Tap Noticed for details.]' },
];
function hintHTML() {
  if (!run || run.practice || ui.coach || ui.sheet || (run.pending && run.pending.length && ui.screen !== 'fight')) return '';
  meta.hints = meta.hints || {};
  const h = HINTS.find(x => x.scr === ui.screen && !meta.hints[x.k] && x.when());
  if (!h) return '';
  ui.hint = h.k;
  // Board screens show it as a strip under the top strip (moved there by render), so it never covers a choice
  // In a fight it sits in the log's place, between the opponent and your champion, so it never covers their next move
  if (ui.screen === 'fight') return `<div class="coach hint pos-strip pos-log" role="status"><button class="hint-read" data-act="hint-read" data-k="${h.k}" aria-label="Read the whole hint"><span class="eyebrow">[System hint]</span> ${esc(h.text)}</button><button class="btn small primary" data-act="hint-ok">OK</button></div>`;
  if (['choose', 'shop', 'district'].includes(ui.screen)) return `<div class="coach hint pos-strip" role="status"><p><span class="eyebrow">[System hint]</span> ${esc(h.text)}</p><button class="btn small primary" data-act="hint-ok">OK</button></div>`;
  return `<div class="coach hint pos-bottom" role="status"><div class="co-h"><span class="eyebrow">[System hint]</span></div><p>${esc(h.text)}</p><div class="co-f"><span></span><button class="btn small primary" data-act="hint-ok">OK</button></div></div>`;
}
// Hints inside events: what a % means, and how a Fate crisis resolves
function eventHint(E, hasRoll) {
  if (run.practice) return '';
  meta.hints = meta.hints || {};
  if (E.crisis && !meta.hints.crisis) return '<p class="sh-p fine sysl">[Hint: answer the Fate twice and it is lifted. Use it twice and it is sealed.]</p>';
  if (hasRoll && !meta.hints.roll) return '<p class="sh-p fine sysl">[Hint: a % is your chance of success. Your stats raised it. Failing still does something.]</p>';
  return '';
}
// Settings (#16): kept on this device in js/sfx.js
function settingsSheet() {
  const seg = (key, opts) => `<div class="seg" role="group">${opts.map(([v, label]) => `<button class="btn small ${SET[key] === v ? 'primary' : 'ghost'}" data-act="set" data-k="${key}" data-v="${v}" aria-pressed="${SET[key] === v}">${label}</button>`).join('')}</div>`;
  const row = (name, hint, ctl) => `<div class="setrow"><div><b>${name}</b>${hint ? `<small>${hint}</small>` : ''}</div>${ctl}</div>`;
  const speed = `<div class="seg" role="group">${[1, 2, 3].map(v => `<button class="btn small ${ui.speed === v ? 'primary' : 'ghost'}" data-act="speed" data-v="${v}" aria-pressed="${ui.speed === v}">${v}×</button>`).join('')}</div>`;
  const body = `<p class="sh-p sysl">[Preferences are noted. On this device only.]</p>`
    + row('Look', 'Broadcast is the new look; Classic is the old bronze one.', seg('look', [['broadcast', 'Broadcast'], ['classic', 'Classic']]))
    + row('Sound', '', seg('vol', [[0, 'Off'], [1, 'Low'], [2, 'Mid'], [3, 'High']]))
    + row('Vibration', navigator.vibrate ? '' : 'Not supported on this device.', seg('vib', [[true, 'On'], [false, 'Off']]))
    + row('Fight speed', 'How fast turns play out.', speed)
    + row('Fast wins', 'Off: every fight ends on a summary, then each notification to tap through. On: ordinary wins go straight on, with notices.', seg('fastWins', [[false, 'Off'], [true, 'On']]))
    + row('Screen shake', '', seg('shake', [[true, 'On'], [false, 'Off']]))
    + row('Motion', OS_REDUCED ? 'Your device asks for reduced motion.' : 'Fewer animations and screen effects, such as erosion.', seg('motion', [['system', 'Device'], ['reduce', 'Reduced']]))
    + row('Text size', 'For reading text: events, sheets, the fight log.', seg('text', [['normal', 'Normal'], ['l', 'Large'], ['xl', 'Larger']]))
    + backupsHTML()
    + '<p class="sh-p fine">On a keyboard: number keys pick choices and skills, Enter presses the main button, Escape closes, S opens Stats and L the System log.</p>';
  return sheetWrap('Settings', body, '<button class="btn primary" data-act="close">Done</button>', 'settings');
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
function releaseLabel() { const r = typeof PATCH_NOTES !== 'undefined' && PATCH_NOTES.length && PATCH_NOTES[0].release; return r ? r.replace(/^wpd-/, '') : ''; }
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
    <li><b>Break:</b> damage past the opponent's Block fills their gold break bar, big hits twice as fast, and some skills add Break. Full, they are Broken: they lose a turn and take 50% more damage for 2 turns. Stunning a Weakened opponent Breaks them too.</li>
    <li><b>Archetypes:</b> every piece has 1 or 2. Equip 2, 4 or 6 pieces of one archetype for its bonuses. Tap the chips at the top of the shop to see them.</li>
    <li><b>Stars:</b> 3 copies of a piece merge into ★2. Three ★2 make ★3, and skills evolve.</li>
    <li><b>Gold:</b> 5 a round, +interest of 1 per 4 gold you hold (up to 5, so a 20-gold bank doubles your income). Reroll for 2.</li>
    <li><b>Levels:</b> after every battle, win or lose, take a level (+4 Max HP, rarer pieces in the shop, +1 stat point) or skip it for the perk on offer (gold, a piece, runes, Hearts and more).</li>
    <li><b>Training:</b> in the shop, buy extra stat points with gold. Each costs a little more than the last. Training never raises your level.</li>
    <li><b>Reactions:</b> Burn + Poison, Burn + Bleed, Bleed + Mark, Stun + Weaken and more trigger bonus effects.</li>
    <li><b>Wagers:</b> a god bets on your next fight. Stake 5 gold for 10 and their Favour.</li>
    <li><b>Titles</b> come from feats and world firsts. Equip one for a small bonus; many unlock new Gifts.</li>
    <li><b>System quests</b> appear each run. Some are hidden until you complete them.</li>
    <li><b>Hidden Paths:</b> reach 4 pieces in two archetypes at once for a hybrid bonus.</li>
    <li><b>Stats</b> have three faces. Power: the archetypes whose skills they strengthen. Finesse: STR fills break bars faster, AGI adds dodge, INT shortens long cooldowns, VIT strengthens healing you receive, LUK adds crit. Resistance: each point shrugs off 4% of one status, up to 60% (STR Weaken, AGI Bleed, INT Burn, VIT Poison, LUK the chance a Stun lands).</li>
    <li><b>Stat milestones:</b> 10 in a stat grants a named perk.</li>
    <li><b>Gatekeepers</b> guard rounds 4 and 7: the hard pick there has an extra trait and a second phase, and pays a stat point too.</li>
    <li><b>The System takes notice</b> of a win streak: each straight win makes opponents 6% stronger, up to 30%. Losing a Heart resets it.</li>
    <li><b>Hearts</b> are your world. Each loss erases part of it, and losses cost more later. At zero your world is erased, and its champion will return to face you.</li>
  </ul>`, `<button class="btn primary" data-act="close">Got it</button>`);
}
function archiveSheet() {
  const A = meta.archive;
  if (run && !run.ended && hasGift(run, 'f_amnesia')) return sheetWrap('Tournament Archive', '<p class="sh-p big">[Access denied. Entrant memory is corrupted.]</p><p class="sh-p fine">Amnesia seals the Archive for this run.</p>', `<button class="btn primary" data-act="close">Close</button>`);
  const titles = Object.entries(TITLES).map(([k, T]) => meta.titles[k] ? `<li><b>${esc(T.name)}</b>: ${esc(T.desc)} <small>${esc(T.cond)}</small>${flavHTML(T.flavour)}</li>` : `<li class="unk">${T.first ? '' : 'Title: '}<small>${esc(T.cond)}</small></li>`).join('');
  const hidden = Object.entries(HIDDEN_PATHS).filter(([k]) => A.hidden && A.hidden[k]).map(([k, H]) => `<li><b>${esc(H.name)}</b> (${k.split('+').map(x => ARCH[x].name).join(' + ')}): ${esc(H.desc)}</li>`).join('');
  const nh = Object.keys(HIDDEN_PATHS).length, fh = Object.keys(A.hidden || {}).length;
  const quests = Object.entries(QUESTS).filter(([k, Q]) => Q.hidden).map(([k, Q]) => A.quests && A.quests[k] ? `<li><b>${esc(Q.text)}</b></li>` : '<li class="unk">Hidden quest: ???</li>').join('');
  const grudgeLine = k => { const g = grudgeOf(meta, k), Gr = GRUDGES[k]; if (!Gr || !(g.w + g.l)) return ''; return `<br><small>Record: you ${g.w}, them ${g.l}.${g.retired ? ` Retired. Trophy: ${esc(Gr.trophy)}. ${esc(/^\[/.test(Gr.retire) ? Gr.retire : '"' + Gr.retire + '"')}` : g.last === 'l' ? ' They beat you last time.' : ''}</small>`; };
  const arch = k => A.beat[k] && FOE_LINES[k] && FOE_LINES[k].archive ? `<br><small>${esc(FOE_LINES[k].archive)}</small>` : '';
  const rivals = RIVALS.map(k => A.rivals[k] ? `<li><b>${esc(ENEMIES[k].name)}</b>: ${esc(ENEMIES[k].style)}. Skills: ${ENEMIES[k].skills.map(s => esc(s.n)).join(', ')}.${arch(k)}${grudgeLine(k)}</li>` : `<li class="unk">Unknown rival</li>`).join('');
  const finals = Object.keys(ENEMIES).filter(k => ENEMIES[k].final).map(k => A.finals[k] ? `<li><b>${esc(ENEMIES[k].name)}</b>: ${esc(ENEMIES[k].style)}.${arch(k)}</li>` : `<li class="unk">Unknown Final Champion</li>`).join('');
  const rx = Object.entries(REACTIONS).map(([k, R]) => A.reactions[k] ? `<li><b>${R.name}</b> (${R.pair}): ${esc(R.text)}</li>` : `<li class="unk">Undiscovered reaction</li>`).join('');
  const paths = ARCH_KEYS.map(k => A.paths[k] ? `<li><b>${ARCH[k].path}</b> (${ARCH[k].name})</li>` : '').join('');
  const evos = Object.keys(A.evos).map(k => { const [a, b] = k.split('>'); return SKILLS[a] && SKILLS[b] ? `<li>${esc(SKILLS[a].name)} → <b>${esc(SKILLS[b].name)}</b></li>` : ''; }).join('');
  const iss = A.issues || {}, ni = KNOWN_ISSUES.filter(K => iss[issueKey(K)]).length;
  const issues = KNOWN_ISSUES.map(K => iss[issueKey(K)] ? `<li class="glitch"><b>${esc(issueName(K))}</b>: [${esc(K.text)}]</li>` : '<li class="unk">[Issue not yet reproduced.]</li>').join('');
  return sheetWrap('Tournament Archive', `<div class="row2 even"><button class="btn ghost small" data-act="sheet" data-s="mastery">Mastery ›</button><button class="btn ghost small" data-act="sheet" data-s="designs">Designs ›</button></div>${marksHTML()}<h4>Rivals</h4><ul class="msgs">${rivals}</ul><h4>Final Champions</h4><ul class="msgs">${finals}</ul><h4>Reactions</h4><ul class="msgs">${rx}</ul><h4>Paths recognised</h4><ul class="msgs">${paths || '<li class="unk">None yet. Equip 4 pieces of one archetype.</li>'}</ul><h4>Evolutions</h4><ul class="msgs">${evos || '<li class="unk">None yet. Merge a skill to ★3.</li>'}</ul><h4>Titles</h4><ul class="msgs">${titles}</ul><h4>Hidden Paths · ${fh} of ${nh}</h4><ul class="msgs">${hidden || '<li class="unk">None found. Reach 4 pieces in two archetypes at once.</li>'}</ul><h4>Hidden quests</h4><ul class="msgs">${quests}</ul><h4>Known Issues · ${ni} of ${KNOWN_ISSUES.length}</h4><ul class="msgs">${issues}</ul>`, `<button class="btn primary" data-act="close">Close</button>`);
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
// Steer the next world: one requested world joins the offer (asking again replaces it). Only shown when you can pay.
// Below the world offer: Back yourself and Steer, side by side when both are open
function worldExtras() {
  const b = backingBtn(), st = canSteer() ? `<button class="btn ghost small" data-act="sheet" data-s="steer">${b ? `${ui.worlds.some(x => x.steered) ? 'New request' : 'Request a world'} · ${STEER_COST}` : `${ui.worlds.some(x => x.steered) ? 'Ask for a different world' : 'Ask the System for a world'} (${STEER_COST} Echoes)`}</button>` : '';
  return b && st ? `<div class="row2 even">${b}${st}</div>` : b + st;
}
// Back yourself: the world screen shows your stake, or a button to place one when you can afford the smallest
function backingBtn() {
  if (ui.daily) return '';
  const B = meta.backing;
  if (B && BACK_GOALS[B.goal]) return `<button class="btn ghost small" data-act="sheet" data-s="backing">Backed · ${B.stake} Echoes</button>`;
  return meta.echoes >= BACK_STAKES[0] ? `<button class="btn ghost small" data-act="sheet" data-s="backing">Back yourself</button>` : '';
}
// The desk: everything changing this run's rules (Licences, Amendments, a door's curse, a token in use), the Licence
// in stock, and the token this shop gives for spending nothing
function deskCount() { return run ? amendIds(run).length + (run.curse && !run.elite ? 1 : 0) + (run.vouchers || []).length + (run.tokenOn ? 1 : 0) + (run.priority && !run.elite ? 1 : 0) + (CHALLENGES[run.challenge] && !run.elite ? 1 : 0) : 0; }
function deskBtn() {
  const n = deskCount(), shop = run.stage === 'shop';
  if (shop && run.voucher) return `<button class="link dk hot" data-act="sheet" data-s="desk">Licence ${VOUCHER_PRICE}g ›</button>`;
  if (shop && tokenReady(run)) return `<button class="link dk" data-act="sheet" data-s="desk">Desk${n ? ' ' + n : ''} ›</button>`;
  return n ? `<button class="link dk" data-act="sheet" data-s="desk">Rules ${n} ›</button>` : '';
}
function deskSheet() {
  const shop = run.stage === 'shop', V = VOUCHERS[run.voucher], row = (name, tag, text) => `<div class="choice flat"><div class="sr-h"><span class="sr-name">${esc(name)}</span><span class="tagn">${tag}</span></div><div class="sr-desc">${esc(text)}</div></div>`;
  let top = '';
  if (V && shop && run.gold >= VOUCHER_PRICE) top += `<button class="choice" data-act="buy-voucher"><div class="sr-h"><span class="sr-name">${esc(V.name)}</span><span class="price">${VOUCHER_PRICE}g</span></div><div class="sr-desc">${esc(V.say)} Lasts the whole run.${flavHTML(V.flavour)}</div></button>`;
  else if (V) top += `<p class="sh-p">[Licence in stock: <b>${esc(V.name)}</b>, ${VOUCHER_PRICE} gold. ${esc(V.say)} It stays here until you buy it${shop ? `; you have ${run.gold} gold` : ', in the shop'}.]</p>`;
  if (shop && tokenReady(run)) top += `<p class="sh-p">[Spend no gold in this shop and you leave with a ${esc(TOKENS[run.tokenOffer].name)}: ${esc(TOKENS[run.tokenOffer].say)}.]</p>`;
  else if (shop && run.tokenOffer) top += `<p class="sh-p fine">[Gold spent this round. No token from this shop.]</p>`;
  const rows = [].concat(
    run.tokenOn ? [row(TOKENS[run.tokenOn].name, 'This round', TOKENS[run.tokenOn].say.replace('your next shop', 'this shop').replace('next round', 'this round') + '.')] : [],
    run.curse && CURSES[run.curse.id] && !run.elite ? [row(CURSES[run.curse.id].name, `Curse · ${run.curse.left} fight${run.curse.left > 1 ? 's' : ''}`, `${CURSES[run.curse.id].say}. When it lifts: ${outcomeText(run.curse.pay)}.`)] : [],
    CHALLENGES[run.challenge] && !run.elite ? [row(CHALLENGES[run.challenge].name, 'Challenge', CHALLENGES[run.challenge].say)] : [],
    run.priority && !run.elite ? [row(`Priority ${run.priority}`, `${run.priority} rule${run.priority > 1 ? 's' : ''}`, priorityRules(run.priority).map(R => R.say).join(' '))] : [],
    amendIds(run).map(k => row(AMENDMENTS[k].name, 'Amendment', AMENDMENTS[k].say)),
    (run.vouchers || []).filter(k => VOUCHERS[k]).map(k => row(VOUCHERS[k].name, 'Licence', VOUCHERS[k].say)));
  const body = top + (rows.length ? `<h4>In force this run</h4>${rows.join('')}` : top ? '' : '<p class="sh-p">[Nothing on the desk. No rules changed.]</p>');
  return sheetWrap('[The desk]', body, `<button class="btn primary" data-act="close">Close</button>`);
}
// The tournament bracket: every round from the qualifiers down to the Final, each row narrower than the last as the
// field halves. Fought rounds show the result, this round its opponents, rounds ahead what the rules have scheduled.
function bracketSheet() {
  const B = bracketMap(run), n = B.rows.length;
  const row = (R, i) => {
    const w = Math.round(100 - i * (40 / (n - 1)));
    const head = `<div class="bk-bar" style="width:${w}%"><b>${R.stage === 'final' ? 'Final' : 'R' + R.round}</b><span>${R.stage === 'final' ? esc(R.foes || 'Final Champion') : R.label}</span><em>${R.field} left</em></div>`;
    const fights = R.fights.map(f => `<div class="bk-l ${f.won ? 'won' : 'lost'}">${f.won ? 'Won' : 'Lost'} · ${esc(f.name)}${f.hearts ? ` · −${f.hearts}♥` : ''}</div>`).join('');
    const opps = R.opponents.map(o => `<div class="bk-l bko${o.chosen ? ' on' : ''}">${o.chosen ? 'Facing' : o.gate ? 'Gatekeeper' : o.hard ? 'Hard' : 'Open'} · ${esc(o.name)}${o.spoils ? ` · Spoils: ${esc(o.spoils)}` : ''}</div>`).join('');
    const ahead = R.state === 'ahead' && R.stage !== 'final' ? `<div class="bk-l dim">${esc(R.foes)} · a loss costs ${R.heart}♥${R.stage === 'main' ? ', the hard one 1 more' : ''}</div>` : '';
    const marks = R.marks.map(m => `<div class="bk-l mk-${m.k}">${esc(m.text)}</div>`).join('');
    return `<div class="bk-row ${R.state} ${R.stage}${R.gate ? ' gate' : ''}">${head}${fights}${opps}${ahead}${marks}</div>`;
  };
  const elite = B.elite.length ? `<h4>Elite bracket</h4>` + B.elite.map((e, i) => `<div class="bk-row elite ${e.state}"><div class="bk-bar" style="width:${60 - i * 6}%"><b>E${i + 1}</b><span>${esc(e.name)}</span></div></div>`).join('') : '';
  const lead = run.elite ? '[Your world is spared. What is left is pride.]' : `[${BRACKET_FIELD[0]} Entrants. One world walks out. You are ${run.round >= ROUNDS ? 'in the Final' : `in round ${run.round}, among the last ${BRACKET_FIELD[run.round - 1]}`}.]`;
  return sheetWrap('[Tournament bracket]', `<p class="sh-p">${lead}</p><div class="bk">${B.rows.map(row).join('')}</div>${elite}<p class="sh-p fine">Each round: choose an opponent, visit a district, shop, fight. Opponents are drawn when the round begins.</p>`, `<button class="btn primary" data-act="close">Close</button>`);
}
// The difficulty ladder on the world screen: Priority once a level is open, Challenge worlds once a world has been spared
function ladderRow() {
  if (ui.daily) return '';
  const P = sanitizePriority(meta.priority), C = CHALLENGES[ui.challenge];
  const p = P.max ? `<button class="btn ghost small" data-act="sheet" data-s="priority">Priority ${P.set} of ${P.max}</button>` : '';
  const c = meta.wins > 0 ? `<button class="btn ghost small" data-act="sheet" data-s="challenge">${C ? esc(C.name) : 'Challenge world'}</button>` : '';
  const K = sanitizeClauses(meta.clauses), cl = Object.keys(K.open).length > 1 ? `<button class="btn ghost small" data-act="sheet" data-s="clauses">Entry: ${esc(CLAUSES[K.set].name)}</button>` : '';
  return (p && c ? `<div class="row2 even">${p}${c}</div>` : p + c) + cl;
}
// Goals (Phase 6): the run goal and this week's System Contracts, side by side on the world screen
function goalRow() {
  if (ui.daily) return '';
  const M = goalOffer(meta), C = contractsOf(meta), n = contractBoard(C.week).filter(id => C.done[id]).length;
  return `<div class="row2 even"><button class="btn ghost small" data-act="sheet" data-s="goal">${M.pick ? 'Run goal ✓' : 'Run goal'}</button><button class="btn ghost small" data-act="sheet" data-s="contracts">Contracts ${n}/3</button></div>`;
}
function goalSheet() {
  const M = goalOffer(meta), pay = id => { const P = GOAL_PAY[goalDef(id).tier]; return `Pays ${P.echoes} Echoes and ${P.xp} Mastery XP.`; };
  const one = (id, name, desc) => `<button class="choice ${M.pick === id ? 'on' : ''}" data-act="set-goal" data-k="${id || ''}"><div class="sr-h"><span class="sr-name">${esc(name)}</span>${M.pick === id ? '<span class="tagn">Chosen</span>' : ''}</div><div class="sr-desc">${esc(desc)}</div></button>`;
  return sheetWrap('[Run goal]', `<p class="sh-p">[State your intentions. The System will hold you to them.] Choose one goal for your next world. Meet it and it pays when the run ends, win or lose.</p>${M.offer.map(id => one(id, goalText(id), pay(id))).join('')}${one(null, 'No goal', 'Play the world as it comes.')}<p class="sh-p fine">A new set of three is drawn after each world. Pending World takes no run goal.</p>`, `<button class="btn primary" data-act="close">Close</button>`);
}
function contractsSheet() {
  const C = contractsOf(meta), board = contractBoard(C.week), n = board.filter(id => C.done[id]).length;
  const row = id => { const a = id.split(':')[1], pay = `Pays ${CONTRACT_ECHOES[goalDef(id).tier]} Echoes.`; return `<div class="choice flat"><div class="sr-h"><span class="sr-name">${esc(goalText(id))}</span>${C.done[id] ? '<span class="tagn">Done</span>' : ''}</div><div class="sr-desc">${C.done[id] ? 'Paid this week.' : esc(a && ARCH[a] ? `${pay} Equip 4 ${ARCH[a].name} pieces and the System names your path.` : pay)}</div></div>`; };
  return sheetWrap('[System Contracts]', `<p class="sh-p">[This week's work orders. Every Entrant receives the same three.] Each pays Echoes the first time you do it this week. Do all three for a week on your Contract Mark.</p>${board.map(row).join('')}<p class="sh-p fine">${n} of 3 done. New Contracts each Monday. Contract Mark: ${C.weeks} week${C.weeks === 1 ? '' : 's'}. Pending World runs count; practice does not.</p>`, `<button class="btn primary" data-act="close">Close</button>`);
}
function goalLines() {
  if (!run) return '';
  const c = (run.contractsDone || []).map(x => `<p class="pg-next good">[Contract fulfilled: ${esc(goalText(x.id))}. +${x.pay} Echoes.]</p>`).join('');
  const w = run.contractWeek ? `<p class="pg-next good">[All three Contracts done this week. Contract Mark: ${run.contractWeek} week${run.contractWeek > 1 ? 's' : ''}.]</p>` : '';
  const g = run.goal && run.goal.paid != null ? (run.goal.met ? `<p class="pg-next good">[Run goal met: ${esc(goalText(run.goal.id))}. +${run.goal.paid} Echoes, +${run.goal.xp} Mastery XP.]</p>` : `<p class="pg-next bad">[Run goal missed: ${esc(goalText(run.goal.id))}.]</p>`) : '';
  return g + c + w;
}
function retiredLines() { return ((run && run.retired) || []).map(id => `<p class="pg-next good">[Rival retired: ${esc(ENEMIES[id].name)}. Trophy filed in the Archive.]</p>`).join(''); }
function goalEchoes() { return run ? (run.goal && run.goal.paid || 0) + (run.contractsDone || []).reduce((a, x) => a + x.pay, 0) : 0; }
// Entry Clauses (Phase 5): the open ones to choose from, and the feats that open the rest
function clausesSheet() {
  const K = sanitizeClauses(meta.clauses), open = Object.keys(CLAUSES).filter(k => K.open[k]), shut = Object.keys(CLAUSES).filter(k => !K.open[k]);
  const one = k => { const C = CLAUSES[k]; return `<button class="choice ${K.set === k ? 'on' : ''}" data-act="set-clause" data-k="${k}"><div class="sr-h"><span class="sr-name">${esc(C.name)}</span>${K.set === k ? '<span class="tagn">Chosen</span>' : markChip('clause', k)}</div><div class="sr-desc">${k === 'standard' ? 'The tournament as filed.' : `<b>Gives:</b> ${esc(C.give)} <b>Takes:</b> ${esc(C.take)}`}${flavHTML(C.flavour)}</div></button>`; };
  const rest = shut.length ? `<h4>Not yet on file · ${shut.length}</h4><ul class="msgs">${shut.map(k => `<li class="unk"><b>${esc(CLAUSES[k].name)}</b>: ${esc(CLAUSES[k].opens)}</li>`).join('')}</ul>` : '';
  return sheetWrap('[Entry Clauses]', `<p class="sh-p">[Choose the paperwork you enter under. Each Clause gives something and takes something. It stays chosen until you change it.]</p>${open.map(one).join('')}${rest}<p class="sh-p fine">Spare a world under a Clause to earn its Mark. Pending World always uses Standard Entry.</p>`, `<button class="btn primary" data-act="close">Close</button>`);
}
function clauseLines() { const L = (run && run.clauseOpened) || []; return L.map(k => `<p class="pg-next good">[Entry Clause on file: ${esc(CLAUSES[k].name)}.]</p>`).join(''); }
function prioritySheet() {
  const P = sanitizePriority(meta.priority);
  const lv = n => `<button class="choice ${n === P.set ? 'on' : ''}" data-act="set-priority" data-n="${n}"><div class="sr-h"><span class="sr-name">${n ? `Priority ${n} · ${esc(PRIORITY[n - 1].name)}` : 'Priority 0 · Standard'}</span><span class="tagn">${n === P.set ? 'Chosen' : n ? `+${Math.round(n * PRIORITY_ECHO * 100)}% Echoes` : 'No change'}</span></div><div class="sr-desc">${n ? esc(PRIORITY[n - 1].say) + (n > 1 ? ` And every rule below it.` : '') : 'The tournament as filed.'}</div></button>`;
  const list = []; for (let n = P.max; n >= 0; n--) list.push(lv(n));
  const next = P.max < PRIORITY.length ? `<p class="sh-p fine">Spare a world at Priority ${P.max} to open Priority ${P.max + 1}.</p>` : '<p class="sh-p fine">Every level is open.</p>';
  return sheetWrap('[Priority]', `<p class="sh-p">[The System can give your world more of its attention. Each level adds one rule and keeps the ones before it. Higher levels pay more Echoes and raise your Marks.]</p>${list.join('')}${next}`, `<button class="btn primary" data-act="close">Close</button>`);
}
function challengeSheet() {
  const done = (meta.marks && meta.marks.challenge) || {};
  const one = (k, C) => `<button class="choice ${ui.challenge === k || (!k && !CHALLENGES[ui.challenge]) ? 'on' : ''}" data-act="set-challenge" data-k="${k || ''}"><div class="sr-h"><span class="sr-name">${esc(C.name)}</span><span class="tagn">${!k ? 'Standard' : done[k] ? `Cleared · ${markTier(done[k]).name}` : `First clear: ${CHALLENGE_ECHOES} Echoes`}</span></div><div class="sr-desc">${esc(C.say)}${flavHTML(C.flavour)}</div></button>`;
  return sheetWrap('[Challenge worlds]', `<p class="sh-p">[The System has filed some worlds under special terms. Choose the terms, then choose the world.]</p>${one(null, { name: 'No challenge', say: 'The tournament as filed.' })}${Object.entries(CHALLENGES).map(([k, C]) => one(k, C)).join('')}`, `<button class="btn primary" data-act="close">Close</button>`);
}
// Marks of mastery: a graded chip, the Archive's section, and the end screen's lines
function markChip(kind, key) { const v = meta.marks && meta.marks[kind] && meta.marks[kind][key], T = v && markTier(v); return T ? `<span class="tag mark mk-${T.k}" title="Mark of mastery: ${T.name}, spared at Priority ${v - 1}">${T.name}</span>` : ''; }
function marksHTML() {
  const M = Object.assign(newMarks(), meta.marks), n = Object.keys(M.arch).length + Object.keys(M.world).length + Object.keys(M.challenge).length + Object.keys(M.clause || {}).length; M.clause = M.clause || {};
  const li = (kind, key, name) => { const v = M[kind][key], T = v && markTier(v); return T ? `<li><b>${esc(name)}</b>: ${markChip(kind, key)} <small>spared at Priority ${v - 1}</small></li>` : `<li class="unk">${esc(name)}: <small>no Mark yet</small></li>`; };
  const P = sanitizePriority(meta.priority);
  return `<h4>Marks of mastery · ${n}</h4><p class="sh-p fine">Spare a world to mark its archetype and its kind. A higher Priority gives a better Mark. Priority open: ${P.max} of ${PRIORITY.length}.${meta.contracts && meta.contracts.weeks ? ` Contract Mark: ${meta.contracts.weeks} week${meta.contracts.weeks > 1 ? 's' : ''} with all three Contracts done.` : ''}${M.depth ? ` Deepest past the Undefeated: Depth ${M.depth}.` : ''}</p><ul class="msgs">${unlockedArch(meta).map(k => li('arch', k, ARCH[k].name)).join('')}${Object.keys(WORLD_TYPES).map(k => li('world', k, WORLD_TYPES[k].name)).join('')}${Object.keys(CHALLENGES).filter(k => M.challenge[k]).map(k => li('challenge', k, CHALLENGES[k].name)).join('')}${Object.keys(CLAUSES).filter(k => M.clause[k]).map(k => li('clause', k, CLAUSES[k].name)).join('')}</ul>`;
}
// Archetype Mastery (Phase 5): a level chip in the crest frame's colour, the sheet with every track, and the end screen's rows
function masteryChip(k) { const M = masteryOf(meta, k), f = masteryFrame(M.level); return `<span class="tag mark mst ${f ? 'mk-' + f : ''}">Lv ${M.level}</span>`; }
function masterySheet() {
  const open = unlockedArch(meta), sel = open.includes(ui.masteryK) ? ui.masteryK : null;
  const row = k => {
    const M = masteryOf(meta, k), pc = M.hi == null ? 100 : Math.round(100 * (M.xp - M.lo) / (M.hi - M.lo));
    const next = M.hi == null ? 'Every level is open.' : `${M.need} XP to level ${M.level + 1}: ${masteryReward(k, M.level + 1)}`;
    const levels = sel === k ? `<ul class="msgs mst-l">${MASTERY_LEVELS.map((L, i) => `<li class="${i < M.level ? '' : 'unk'}"><b>${i + 1}</b> · ${esc(masteryReward(k, i + 1))} <small>${i < M.level ? 'Open' : MASTERY_XP[i] + ' XP'}</small></li>`).join('')}</ul>` : '';
    return `<button class="choice mst-row ${sel === k ? 'on' : ''}" data-act="mastery-open" data-k="${k}" aria-expanded="${sel === k}"><div class="sr-h"><span class="sr-name">${esc(M.level >= MASTERY_MAX ? 'Master ' + ARCH[k].path : ARCH[k].name)}</span>${masteryChip(k)}</div><span class="pg-bar"><i style="width:${pc}%"></i></span><div class="sr-desc">${esc(next)}</div></button>${levels}`;
  };
  return sheetWrap('[Archetype Mastery]', `<p class="sh-p">[The System keeps a file on how you fight. Every run adds to it, win or lose, shared between the archetypes you ended the run holding.]</p>${open.map(row).join('')}<p class="sh-p fine">A win pays ${MASTERY_PAY.win} XP, sparing the world ${MASTERY_PAY.spared} more. Tap an archetype for its ten levels. Pending World uses every Mastery piece for everyone.</p>`, `<button class="btn primary" data-act="close">Close</button>`);
}
function masteryRows() {
  const L = (run && run.masteryGain) || [];
  return L.slice().sort((a, b) => b.gain - a.gain).slice(0, 3).map(m => `<div class="pg-row pg-mastery"><span class="pg-l">${esc(ARCH[m.k].name)} ${m.level}</span><span class="pg-bar" role="progressbar" aria-label="${esc(ARCH[m.k].name)} Mastery level ${m.level}" aria-valuemin="0" aria-valuemax="${m.hi == null ? 1 : m.hi - m.lo}" aria-valuenow="${m.hi == null ? 1 : m.xp - m.lo}"><i style="width:${m.hi == null ? 100 : Math.round(100 * (m.xp - m.lo) / (m.hi - m.lo))}%"></i></span><span class="pg-g">+${m.gain} XP</span></div>`).join('');
}
function masteryRowsFirst(rows) { return rows + masteryRows(); }
function masteryLines() {
  const L = (run && run.masteryGain) || [];
  return L.map(m => m.opened.map(o => `<p class="pg-next good">[${esc(ARCH[m.k].name)} Mastery ${o.level}: ${esc(o.text.replace(/\.$/, ''))}.]</p>`).join('')).join('');
}
// Unfiled designs (Phase 5): the Archive's Designs sheet, where found designs are filed for Echoes
function designText(id) { const d = pieceDef(id); return isGear(id) ? `${d.slot[0].toUpperCase() + d.slot.slice(1)}. ${gearText(id, 1)}` : `Skill. ${describe(d)}`; }
function designsSheet() {
  const D = sanitizeDesigns(meta.designs), ids = designIds(), nf = ids.filter(id => D.found[id]).length, nd = ids.filter(id => D.filed[id]).length;
  const one = id => {
    const d = pieceDef(id), tags = d.tags.map(t => ARCH[t].name).join(' + ');
    if (!D.found[id]) return `<div class="choice static unk"><div class="sr-h"><span class="sr-name">[Unfiled design]</span>${rk(d.rank)}</div><div class="sr-desc">${esc(tags)}. Not yet recovered.</div></div>`;
    const btn = D.filed[id] ? '<span class="tag">Filed</span>' : `<button class="btn small" data-act="file-design" data-id="${id}" ${meta.echoes < designCost(id) ? 'disabled' : ''}>File · ${designCost(id)} Echoes</button>`;
    return `<div class="choice static"><div class="sr-h"><span class="sr-name">${esc(d.name)}</span>${rk(d.rank)}</div><div class="sr-desc"><b>${esc(tags)}.</b> ${esc(designText(id))}</div>${btn}</div>`;
  };
  const dry = D.dry >= DESIGN_DRY ? ' Your next Gatekeeper win is certain to drop one.' : '';
  return sheetWrap('[Unfiled designs]', `<p class="sh-p">[Pieces the System never filed. Recover one by beating a Gatekeeper. File it, and it can turn up in your runs from then on.] You have <b>${meta.echoes}</b> Echoes. Found ${nf} of ${ids.length}, filed ${nd}.</p>${ids.map(one).join('')}<p class="sh-p fine">A Gatekeeper drops a design 1 time in 3.${dry} A design you find is kept even if the run is lost. Pending World never uses them.</p>`, `<button class="btn primary" data-act="close">Close</button>`);
}
function designLines() { const L = (run && run.designFound) || []; return L.map(id => `<p class="pg-next good">[Unfiled design recovered: ${esc(pieceDef(id).name)}. File it in the Archive.]</p>`).join(''); }
function ladderLines() {
  const L = run && run.ladder; if (!L) return '';
  const name = m => m.kind === 'arch' ? ARCH[m.key].name : m.kind === 'world' ? WORLD_TYPES[m.key].name : m.kind === 'clause' ? CLAUSES[m.key].name : CHALLENGES[m.key].name;
  return (L.marks.length ? `<p class="pg-next good">[Mark${L.marks.length > 1 ? 's' : ''} of mastery: ${L.marks.map(m => `${esc(name(m))} · ${m.tier}`).join(', ')}.]</p>` : '') + (L.opened ? `<p class="pg-next good">[Priority ${L.opened} is open: ${esc(PRIORITY[L.opened - 1].name)}.]</p>` : '') + (L.echoes ? `<p class="pg-next good">[Challenge world cleared for the first time. +${L.echoes} Echoes.]</p>` : '');
}
function backingSheet() {
  const B = meta.backing;
  if (B && BACK_GOALS[B.goal]) {
    const G = BACK_GOALS[B.goal];
    return sheetWrap('[Backing placed]', `<p class="sh-p">[You have backed yourself: ${esc(G.name)}. Stake ${B.stake} Echoes. Pays ${B.stake * G.mul} if you make it.]</p><p class="sh-p fine">It rides on your next world. Pending World and practice don't count.</p>`, `<div class="row2 even"><button class="btn" data-act="back-withdraw">Withdraw (${B.stake} back)</button><button class="btn primary" data-act="close">Keep it</button></div>`);
  }
  const stakes = BACK_STAKES.filter(n => n <= meta.echoes), st = stakes.includes(ui.backStake) ? ui.backStake : stakes[stakes.length > 1 ? 1 : 0];
  const head = `<div class="row3">${stakes.map(n => `<button class="btn small ${n === st ? 'primary' : 'ghost'}" data-act="back-stake" data-n="${n}">${n} Echoes</button>`).join('')}</div>`;
  const list = Object.entries(BACK_GOALS).map(([k, G]) => `<button class="choice" data-act="back-place" data-k="${k}" data-n="${st}"><div class="sr-h"><span class="sr-name">${esc(G.name)}</span><span class="price">Pays ${st * G.mul}</span></div><div class="sr-desc">${esc(G.desc)} Odds ×${G.mul}.</div></button>`).join('');
  return sheetWrap('[Back yourself]', `<p class="sh-p">[The House takes bets on Entrants. Including from the Entrant. Stake Echoes on how far your next world gets.] You have <b>${meta.echoes}</b> Echoes.</p>${head}${list}`, `<button class="btn primary" data-act="close">Close</button>`);
}
function canSteer() { return !ui.daily && meta.echoes >= STEER_COST && ui.worlds && ui.worlds.length > 0; }
function steerSheet() {
  const O = steerOptions(meta), name = { type: k => WORLD_TYPES[k].name, fate: k => FATES[k].name, people: k => PEOPLES[k].name }, line = { type: k => WORLD_TYPES[k].flavour, fate: k => FATES[k].line, people: k => PEOPLES[k].line };
  const tabs = Object.keys(STEER_KINDS), tab = ui.steerTab && O[ui.steerTab] ? ui.steerTab : 'type';
  const head = `<div class="row3">${tabs.map(k => `<button class="btn small ${k === tab ? 'primary' : 'ghost'}" data-act="steer-tab" data-k="${k}">${{ type: 'World', fate: 'Fate', people: 'People' }[k]}</button>`).join('')}</div>`;
  const list = O[tab].map(k => `<button class="choice" data-act="steer" data-kind="${tab}" data-k="${k}"><div class="sr-h"><span class="sr-name">${esc(name[tab](k))}</span><span class="price">${STEER_COST} Echoes</span></div><div class="sr-desc">${esc(line[tab](k))}</div></button>`).join('');
  return sheetWrap('[Request a world]', `<p class="sh-p">Name one thing about the world you want to fight for. The System will find one to match and add it to the offer. You have <b>${meta.echoes}</b> Echoes.</p>${head}<p class="sh-p fine">${esc(STEER_KINDS[tab])}</p>${list}`, `<button class="btn primary" data-act="close">Close</button>`);
}
function echoesSheet() {
  const list = Object.entries(UNLOCKS).map(([k, u]) => `<div class="choice static"><div class="sr-h"><span class="sr-name">${esc(u.name)}</span><span class="price">${u.cost} Echoes</span></div><div class="sr-desc">${esc(u.desc)}</div>${meta.unlocks[k] ? '<span class="tag">Unlocked</span>' : `<button class="btn small" data-act="unlock" data-k="${k}" ${meta.echoes < u.cost ? 'disabled' : ''}>Unlock</button>`}</div>`).join('');
  return sheetWrap('Echoes', `<p class="sh-p">Echoes are fragments of the worlds you fought for. You have <b>${meta.echoes}</b>. They buy options, never raw power.</p>${list}<p class="sh-p fine">Echoes also let you ask the System for a world of your choosing, ${STEER_COST} Echoes a time, on the world choice screen, and file Unfiled designs in the Archive.</p><button class="btn ghost small" data-act="sheet" data-s="designs">Unfiled designs ›</button>`, `<button class="btn primary" data-act="close">Close</button>`);
}
function shareBlock(s, erased) {
  if (FIREBASE && !cloud.on && s) return `<p class="sh-p fine center">Sign in from the menu to share champions with other players.</p>`;
  if (cloud.on && cloud.tester === false && s) return `<p class="sh-p fine center">${PENDING}</p>`;
  if (!canShare() || !s) return '';
  if (meta.shared && meta.shared[s.at]) return `<p class="sh-p fine center">[${esc(s.champ)} is shared with other entrants.]</p>`;
  return `<button class="btn" data-act="share" data-k="${erased ? 'erased' : 'spared'}">Share ${esc(s.name || s.champ)} with other entrants</button>`;
}
// End screen: what this run moved. Round and wins, then a bar each for Entrant Rank, Echoes and Titles, and the nearest goal.
function progressHTML(e, s) {
  const titles = run && run.titles0 != null ? Math.max(0, Object.keys(meta.titles).length - run.titles0) : null;
  const P = runProgress(meta, { rp: e.rp || 0, echoes: (e.totalEchoes != null ? e.totalEchoes : e.echoes) + (run && run.backing && run.backing.paid || 0) + (run && run.ladder && e.totalEchoes != null ? run.ladder.echoes : 0) + goalEchoes(), titles });
  const unit = { rank: ' RP', echoes: '', titles: '' };
  const rows = masteryRowsFirst(P.bars.map(b => `<div class="pg-row pg-${b.k}" title="${esc(b.text)}"><span class="pg-l">${esc(b.label)}</span><span class="pg-bar" role="progressbar" aria-label="${esc(b.label + ': ' + b.text)}" aria-valuemin="0" aria-valuemax="${b.max}" aria-valuenow="${b.now}"><i style="width:${Math.round(100 * Math.min(1, b.now / (b.max || 1)))}%"></i></span><span class="pg-g">${b.gain ? `+${b.gain}${unit[b.k]}` : ''}</span></div>`).join(''));
  return `<div class="progress"><p class="pg-head">Round <b>${s.round}</b> · <b>${run ? run.wins : '–'}</b> win${run && run.wins === 1 ? '' : 's'}</p><div class="pg-rows">${rows}</div>${backLine()}${ladderLines()}${masteryLines()}${goalLines()}${retiredLines()}${designLines()}${clauseLines()}${P.next ? `<p class="pg-next">${esc(P.next)}</p>` : ''}</div>`;
}
function backLine() {
  const B = run && run.backing && run.backing.settled && BACK_GOALS[run.backing.goal] ? run.backing : null; if (!B) return '';
  return `<p class="pg-next ${B.met ? 'good' : 'bad'}">${B.met ? `[Backing paid: ${esc(BACK_GOALS[B.goal].name)}. +${B.paid} Echoes.]` : `[Backing lost: ${B.stake} Echoes. The House thanks you.]`}</p>`;
}
// M1: the ending plays the World Record before the end screen: erased, each entry is struck and deleted; spared, each
// is stamped KEPT. Then the word lands and the screen behind it fills its bars. Once per ending; a tap skips it.
function endIntro(e) {
  const s = e.snap, erased = e.kind === 'erased';
  let names = []; try { names = recEntries(Object.assign({}, s.rec, { lost: 0, partial: 0 }), s.worldType, true).map(x => x.name); } catch (err) { }
  const kept = erased ? [] : (() => { try { return recEntries(s.rec, s.worldType, true).map(x => !x.lost); } catch (err) { return []; } })();
  if (!names.length) return;
  document.querySelectorAll('.endfx').forEach(x => x.remove());
  const el = document.createElement('div'); el.className = 'endfx ' + (erased ? 'erased' : 'spared'); el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="ef-box"><span class="ef-k">World Record · ${esc(s.worldName)}</span><div class="ef-list">${names.map((n, i) => `<div class="${!erased && kept[i] === false ? 'gone' : ''}">${esc(n)}</div>`).join('')}</div><div class="ef-word"></div></div>`;
  document.body.appendChild(el);
  const rows = [...el.querySelectorAll('.ef-list div')], gap = Math.max(110, Math.min(300, 1900 / rows.length)), timers = [];
  rows.forEach((r, i) => timers.push(setTimeout(() => {
    if (!erased) { if (!r.classList.contains('gone')) r.classList.add('kept'); return; }
    r.classList.add('struck'); const full = r.textContent; let n = full.length;
    const bs = setInterval(() => { n -= 3; r.textContent = n > 0 ? full.slice(0, n) + '▌' : '[deleted]'; if (n <= 0) clearInterval(bs); }, 20); timers.push(bs);
  }, 350 + i * gap)));
  let closed = false;
  const close = () => { if (closed) return; closed = true; timers.forEach(t => { clearTimeout(t); clearInterval(t); }); el.classList.add('out'); setTimeout(() => el.remove(), 300); const m = app.querySelector('main.end'); if (m) m.classList.add('reveal'); };
  timers.push(setTimeout(() => { if (erased) el.classList.add('glitch'); const w = el.querySelector('.ef-word'); w.textContent = erased ? 'Erased' : 'Spared'; w.classList.add('slam'); sfx(erased ? 'erase' : 'win'); }, 350 + rows.length * gap + 350));
  timers.push(setTimeout(close, 350 + rows.length * gap + 1700));
  el.addEventListener('pointerdown', close);
}
function endHTML() {
  const e = ui.end, s = e.snap;
  const erased = e.kind === 'erased';
  if (!e.introDone) { e.introDone = true; if (!REDUCED && s && s.rec) setTimeout(() => { if (ui.screen === 'end' && ui.end === e) endIntro(e); }, 30); }
  const lines = (e.observed ? [e.observed] : []).concat(erased ? [`[Entrant eliminated. ${s.worldName} is erased.]`, `[${s.champ} has been added to the Hall of the Erased.]`].concat(e.filed ? [`[${s.worldName}'s records remain on file.]`] : []).concat(e.opened ? [] : ['[Next world.]']) : [`[${s.worldName} is spared.]`, `[${s.champ} enters the Hall of Champions.]`], e.opened ? [`[Rank Trial unlocked: ${e.opened}-rank. It waits in your next world.]`] : []);
  return `<main class="screen title end ${erased ? 'erased' : 'spared'}">${broadcastTicker(erased ? `++ BREAKING +++ [Entrant eliminated. ${s.worldName} is erased.] +++` : `++ LIVE +++ [${s.worldName} is spared.] +++`)}<div class="t-top"><div class="eyebrow">${erased ? 'World erased' : 'World spared'}</div><h1>${erased ? 'Erased' : 'Spared'}</h1>
    <div class="sysbox ${erased ? 'bad' : ''}">${lines.map(l => `<p>${esc(l)}</p>`).join('')}</div>
    ${runCard(s, { erased, big: true })}</div>
    ${progressHTML(e, s)}
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
  else if (scr === 'kitstats') h = kitStatsHTML();
  else if (scr === 'choose') h = chooseHTML();
  else if (scr === 'shop') h = shopHTML();
  else if (scr === 'district') h = districtHTML();
  else if (scr === 'fight') h = fightHTML();
  else if (scr === 'end') h = endHTML();
  let sh = '';
  const S = ui.sheet;
  if (S) {
    const t = S.type || S;
    const fn = { news: newsSheet, daily: dailySheet, dailyweek: weekSheet, dailycmp: compareSheet, record: recordSheet, steer: steerSheet, backing: backingSheet, desk: deskSheet, bracket: bracketSheet, priority: prioritySheet, challenge: challengeSheet, mastery: masterySheet, designs: designsSheet, clauses: clausesSheet, goal: goalSheet, contracts: contractsSheet, piece: pieceSheet, stats: statsSheet, archetypes: archetypesSheet, scout: scoutSheet, skillinfo: skillInfoSheet, menu: menuSheet, howto: howtoSheet, archive: archiveSheet, halls: hallsSheet, echoes: echoesSheet, result: resultSheet, syslog: syslogSheet, report: reportSheet, evresult: evResultSheet, marks: marksSheet, note: noteSheet, savepick: savePickSheet, patch: patchSheet, settings: settingsSheet, hint: () => sheetWrap('[System hint]', `<div class="sysbox"><p>${esc(S.text)}</p></div>`, `<button class="btn primary" data-act="hint-done" data-k="${S.k}">OK</button>`), enchanter: () => enchantSheet(ui.enchantMods, 'option') }[t];
    sh = fn ? fn() : '';
  }
  if (!sh && run && ['choose', 'shop', 'district'].includes(scr) && run.pending.length) { sh = pendingSheet(); statLinesNotice(); }
  if (!sh && ui.sheet && ui.sheet.type === 'practicedone') sh = practiceDoneSheet();
  if (!sh && ui.sheet && ui.sheet.type === 'firsttime') sh = firstTimeSheet();
  if (!sh && ui.sheet && ui.sheet.type === 'notice') sh = noticeSheet();
  ui.hint = null;
  app.innerHTML = h + sh + coachHTML() + hintHTML();
  const hs = app.querySelector('.coach.pos-strip'), stp = app.querySelector('.strip'), lg = scr === 'fight' && document.getElementById('log');
  if (hs && lg) lg.before(hs); else if (hs && stp) stp.after(hs);
  // The tutorial's fight steps take the log's place too, so the thing they point at stays in view
  const cm = scr === 'fight' && app.querySelector('.coach.pos-mid'); if (cm && lg) { cm.classList.add('pos-log'); lg.before(cm); }
  applyMoment();
  coachHighlight();
  if (scr === 'fight') updateFight();
  fitNames();
  pulseChanged();
  // G6: a merge lands with a pop on the piece it made
  if (ui.merged && run) { const id = ui.merged; ui.merged = null; const ps = allPieces(run).filter(q => q.id === id).sort((x, y) => y.star - x.star)[0], t = ps && app.querySelector(`.tile[data-u="${ps.u}"]`); if (t && !REDUCED) { t.classList.add('mergepop'); sfx('react'); } }
  setUnder(!!app.querySelector('.sheet')); // notices that wait for a tap step aside while a sheet is open
  placeToasts();
  if (focusName) { const el = document.getElementById('aw-name'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
  if (fbFocus) { const el = document.getElementById('fb-text'); if (el) { el.focus(); el.setSelectionRange(fbFocus[0], fbFocus[1]); } }
}

// ---------- Actions ----------
// U6: a change of screen slides instead of cutting, where the browser can (View Transitions). The redraw itself is
// unchanged; without the feature, or with Reduce motion, it cuts as before.
function go(screen) {
  const from = ui.screen; ui.screen = screen; ui.sheet = null;
  if (from !== screen && !REDUCED && document.startViewTransition && !document.hidden) {
    try { const vt = document.startViewTransition(() => render()); if (vt && vt.finished) vt.finished.catch(() => {}); if (vt && vt.ready) vt.ready.catch(() => {}); return; } catch (e) { }
  }
  render();
}
function onAct(el) {
  const a = el.dataset.act, d = el.dataset;
  switch (a) {
    case 'new': if (run && !run.ended) recordRunStats('abandoned'); lsDel(RUN_KEY); run = null; ui.daily = null; ui.worlds = worldBounty(offerWorlds(meta)); if (meta.steer) ui.worlds.push(meta.steer); ui.seed = Math.random().toString(36).slice(2); ui.world = null; ui.challenge = null; ui.end = null; return go('worlds');
    case 'daily': { const date = dailyDate(), w = dailyWorld(date); if (lsGet(RUN_KEY) && !lsGet(RUN_KEY).ended) return render(); run = null; ui.end = null; ui.sheet = null; ui.daily = { date, ranked: !dailyPlayed(date) }; countObservers(ui.daily); ui.worlds = [w]; ui.world = 0; ui.aw = newAw(w, date); return go('awaken'); }
    case 'daily-board': ui.sheet = { type: 'daily' }; loadBoard(); postDaily(); if (!ui.season || Date.now() - ui.season.t > 3600e3) loadSeason(); return render();
    case 'board-week': ui.sheet = { type: 'dailyweek' }; if (!ui.season || Date.now() - ui.season.t > 3600e3) loadSeason(); return render();
    case 'board-row': ui.sheet = { type: 'dailycmp', i: +d.i }; return render();
    case 'resume': run = lsGet(RUN_KEY); registerGlitchGear(run); ensureRecord(run); ui.pick = null; ui.wagerOn = false; return go(stageScreen());
    case 'back-title': return go('title');
    case 'back-worlds': return go('worlds');
    case 'pick-world': ui.world = +d.i; return render();
    case 'back-stake': ui.backStake = +d.n; return render();
    case 'back-place': { if (placeBacking(meta, d.k, +d.n)) { saveMeta(); ui.sheet = null; toast(`[Backing placed: ${BACK_GOALS[d.k].name}. The House has noted your confidence.]`, 'class'); } return render(); }
    case 'back-withdraw': { if (withdrawBacking(meta)) { saveMeta(); ui.sheet = null; toast('[Backing withdrawn. Stake returned. The House is disappointed.]', 'class'); } return render(); }
    case 'steer-tab': ui.steerTab = d.k; return render();
    case 'steer': {
      if (!canSteer()) return render();
      const w = steerWorld(meta, d.kind, d.k); if (!w) return render();
      meta.echoes -= STEER_COST; meta.steer = w; saveMeta(); // kept until a run starts, so a reload doesn't lose what you paid for
      ui.worlds = ui.worlds.filter(x => !x.steered).concat(w); ui.world = ui.worlds.length - 1; ui.sheet = null;
      toast(`[Request granted: ${w.name}. -${STEER_COST} Echoes.]`, 'level'); return render();
    }
    case 'world-ok': ui.aw = newAw(ui.worlds[ui.world]); return go('awaken');
    case 'aw-tab': ui.aw.tab = d.t; return render();
    case 'aw-sigil': ui.aw.sigil = +d.i; return render();
    case 'aw-color': ui.aw.color = +d.i; return render();
    case 'aw-cat': ui.aw.cat = d.c; return render();
    case 'aw-gift': { const A = ui.aw, k = d.k; sysOverruled(A); if (A.gifts.includes(k)) A.gifts = A.gifts.filter(x => x !== k); else if (giftCheck(ui.worlds[ui.world], A.gifts.concat(k), A.patron, A.offer).ok) A.gifts.push(k); return render(); }
    case 'aw-patron': { ui.aw.patron = d.k; if (!giftCheck(ui.worlds[ui.world], ui.aw.gifts, ui.aw.patron, ui.aw.offer, ui.aw.sysPts).ok) toast('[Too many Gift Points for that choice. Remove a Gift.]', 'loss'); return render(); }
    case 'aw-title': ui.aw.title = ui.aw.title === d.k ? null : d.k; return render();
    case 'aw-random': { const A = ui.aw; A.sysPts = SYS_BONUS; A.gifts = randomGifts(ui.worlds[ui.world], awMeta(), A.patron || 'war', A.offer, awRng('sys'), A.sysPts); toast(`[The System has chosen for you. +${SYS_BONUS} Gift Points for your trust.]`, 'sys'); return render(); }
    case 'aw-save': { const A = ui.aw; meta.presets = (meta.presets || []).concat({ name: 'Preset ' + ((meta.presets || []).length + 1), gifts: A.gifts.filter(k => GIFTS[k].cat !== 'world') }).slice(-3); meta.presets.forEach((p, i) => p.name = 'Preset ' + (i + 1)); saveMeta(); toast('[Preset saved.]', 'sys'); return render(); }
    case 'aw-preset': { const A = ui.aw, w = ui.worlds[ui.world], p = meta.presets[+d.i]; sysOverruled(A); let sel = [WORLD_TYPES[w.type].gift]; p.gifts.forEach(k => { if (GIFTS[k] && giftUnlocked(k, awMeta()) && giftsAllowed(w).includes(k) && giftCheck(w, sel.concat(k), A.patron, A.offer).ok) sel.push(k); }); A.gifts = sel; if (sel.length - 1 < p.gifts.length) toast('[Some Gifts in that preset do not fit this world or budget.]', 'loss'); return render(); }
    case 'aw-ok': {
      const A = ui.aw;
      run = newRun(ui.worlds[ui.world], A.practice ? Object.assign({}, PRACTICE.setup, { name: A.name.trim() || 'Novice', sigil: A.sigil, color: A.color, script: PRACTICE.script }) : Object.assign({ name: A.name.trim(), sigil: A.sigil, color: A.color, stats: { STR: 2, AGI: 2, INT: 2, VIT: 2, LUK: 2 }, startPts: 4, rollSeed: 'aw:' + ui.seed + ':' + ui.world + ':roll', gifts: A.gifts, patron: A.patron, offer: A.offer, sysBonus: A.sysPts || 0, title: A.title, record: A.record, challenge: ui.daily ? null : ui.challenge }, ui.daily ? { seed: dailySeed(ui.daily.date), daily: ui.daily.date, ranked: ui.daily.ranked } : {}), A.practice ? META : meta);
      if (run.daily) { if (run.ranked) { meta.daily = { date: run.daily, started: true }; saveMeta(); } run.log.push({ t: 'sys', text: pendingLine(run.world.name, ui.daily.count) }); }
      if (run.practice) run.gold = 2;
      if (!run.daily && !run.practice && meta.steer) { delete meta.steer; saveMeta(); } // a requested world is spent once a run starts
      if (claimGoal(run, meta)) run.log.push({ t: 'class', text: `[Run goal on file: ${goalText(run.goal.id)}.]` });
      if (!run.daily && !run.practice) saveMeta();
      if (claimBacking(run, meta)) { saveMeta(); run.log.push({ t: 'class', text: `[Backing on file: ${BACK_GOALS[run.backing.goal].name}. ${run.backing.stake} Echoes riding on it.]` }); }
      pushMsgs(run.log.slice(), true);
      ui.draftSel = []; saveRun(); toast(`[Welcome, ${run.name}. Your Gifts have been installed.]`, 'class'); return go('draft');
    }
    case 'news': openNews(); return render();
    case 'news-page': ui.sheet = { type: 'news', p: Math.max(0, +d.p) }; return render();
    case 'save-pick': pickSave(d.k); return;
    case 'restore-save': restoreBackup(+d.i); return render();
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
    case 'set-clause': setClause(meta, d.k); saveMeta(); ui.sheet = null; return render();
    case 'set-goal': setGoal(meta, d.k || null); saveMeta(); ui.sheet = null; return render();
    case 'file-design': if (fileDesign(meta, d.id)) { saveMeta(); toast(`[Filed: ${pieceDef(d.id).name}]`, 'level'); } return render();
    case 'unlock': { const u = UNLOCKS[d.k]; if (meta.echoes >= u.cost && !meta.unlocks[d.k]) { meta.echoes -= u.cost; meta.unlocks[d.k] = true; saveMeta(); toast(`[Unlocked: ${u.name}]`, 'level'); } return render(); }
    case 'hint-read': { const h = HINTS.find(x => x.k === d.k); if (h) ui.sheet = { type: 'hint', k: h.k, text: h.text }; return render(); }
    case 'hint-done': meta.hints = meta.hints || {}; meta.hints[d.k] = true; saveMeta(); ui.sheet = null; return render();
    case 'hint-ok': if (ui.hint) { meta.hints = meta.hints || {}; meta.hints[ui.hint] = true; saveMeta(); } return render();
    case 'set': { const k = d.k, v = d.v === 'true' ? true : d.v === 'false' ? false : /^\d+$/.test(d.v) ? +d.v : d.v; SET[k] = v; saveSettings(); REDUCED = reducedMotion(); if (k === 'vol' && v) sfx('tap'); if (k === 'vib' && v) sfx('hit'); return render(); }
    case 'speed': ui.speed = +d.v; lsSet('wpd-speed', ui.speed); return render();
    case 'speed-cycle': ui.speed = ui.speed >= 3 ? 1 : ui.speed + 1; lsSet('wpd-speed', ui.speed); return render();
    case 'signin': { const C = window.WPD_CLOUD; if (!C) return; C.signIn(d.k).catch(e => toast(`[Sign-in failed: ${(e && e.message) || 'unknown error'}]`, 'loss')); return; }
    case 'signout': { const C = window.WPD_CLOUD; if (C) C.signOut().then(() => toast('[Signed out. Progress stays on this device.]', 'sys')); ui.sheet = null; return render(); }
    case 'share': { const s = ui.end && ui.end.snap; if (!s) return; el.disabled = true; shareChampion(s, d.k).then(ok => { toast(ok ? `[${s.champ} has been shared with other entrants.]` : '[Sharing is not available for your access level.]', ok ? 'class' : 'loss'); render(); }); return; }
    case 'share-hall': { const list = d.k === 'erased' ? meta.erased : meta.champions; const s = list.find(x => String(x.at) === d.at); if (!s) return; el.disabled = true; shareChampion(s, d.k).then(ok => { toast(ok ? `[${s.champ} has been shared.]` : '[Sharing is not available for your access level.]', ok ? 'class' : 'loss'); render(); }); return; }
    case 'abandon': ui.confirmAbandon = true; return render();
    case 'abandon-yes': { if (run.practice) return endPractice(false); const out = endRun(run, meta, 'erased'); recordRunStats('abandoned'); ui.end = { kind: 'erased', echoes: out.echoes, snap: out.snap, rp: out.rp, opened: out.trial, observed: finishDaily(false), filed: !!run.poolFiled }; saveMeta(); lsDel(RUN_KEY); ui.fight = null; ui.confirmAbandon = false; return go('end'); }
  }
  if (!run) return;
  const msgs = [];
  switch (a) {
    case 'draft-pick': { const i = ui.draftSel.indexOf(d.id); if (i >= 0) ui.draftSel.splice(i, 1); else if (ui.draftSel.length < 3) ui.draftSel.push(d.id); return render(); }
    case 'draft-gear': ui.draftGear = ui.draftGear === d.id ? null : d.id; return render();
    case 'draft-reroll': rerollDraft(run); ui.draftSel = []; ui.draftGear = null; saveRun(); return render();
    // Skills first, then the gear pick on its own screen (kept in the run, so Continue comes back to it)
    case 'draft-skills': if (ui.draftSel.length !== 3) return render(); if ((run.gearDraft || []).length) { run.draftPicked = ui.draftSel.slice(); saveRun(); return render(); } // falls through when there is no gear to pick
    case 'draft-ok': { const ids = run.draftPicked || ui.draftSel.slice(); if (ids.length !== 3) return render(); delete run.draftPicked; confirmDraft(run, ids, run.practice ? META : meta, undefined, ui.draftGear); ui.draftGear = null; ui.draftSel = []; ui.pick = null; ui.wagerOn = false; saveRun(); return go(stageScreen()); }
    case 'draft-back': ui.draftSel = run.draftPicked || []; delete run.draftPicked; saveRun(); return render();
    // Opening stats, after the draft: place 4 points or roll once
    case 'kit-stat': if (startStat(run, d.k, +d.d)) saveRun(); return render();
    case 'kit-roll': if (rollStart(run)) { saveRun(); toast(`[Stats rolled. ${ROLL_PTS} points placed.]`, 'sys'); } return render();
    case 'kit-unroll': if (unrollStart(run, 4)) saveRun(); return render();
    case 'kit-ok': if (placeStartStats(run, msgs)) { pushMsgs(msgs, false); saveRun(); } return go(stageScreen());
    case 'opp-open': { if (ui.pick === +d.i) return onAct({ dataset: { act: 'pick-opp', i: d.i } }); ui.pick = +d.i; ui.pickNew = true; return render(); }
    case 'pick-opp': { chooseOpponent(run, +d.i, ui.wagerOn); if (run.wagerOn) toast(`[Wager accepted: ${WAGERS[run.wager.key].text}]`, 'favour'); ui.pick = null; ui.wagerOn = false; ui.distDone = null; saveRun(); return go('district'); }
    case 'wager': ui.wagerOn = !ui.wagerOn; return render();
    case 'shop-item': ui.sheet = { type: 'piece', shop: d.k, i: +d.i }; return render();
    case 'shop-tab': ui.shopTab = d.k; return render();
    case 'own': ui.sheet = { type: 'piece', u: +d.u }; return render();
    case 'quick-buy': case 'buy': { const it = shopItem(run, d.k, +d.i); if (buy(run, d.k, +d.i, msgs)) { sfx('buy'); if (msgs.some(m => m.text.startsWith('[Merge'))) ui.merged = it.id; if (!msgs.some(m => m.text.startsWith('[Merge'))) toast(`[Bought ${pieceDef(it.id).name}]`, 'loot'); pushMsgs(msgs, false, `Bought ${pieceDef(it.id).name}`); ui.sheet = null; saveRun(); } return render(); }
    case 'lock': run.locks[d.k][+d.i] = !run.locks[d.k][+d.i]; ui.sheet = null; saveRun(); return render();
    case 'reroll': if (reroll(run, null, ui.shopTab || 'skill')) saveRun(); return render();
    case 'train': if (ui.screen === 'shop' && trainStat(run, d.k, msgs)) { pushMsgs(msgs, false, `Trained ${d.k}`); saveRun(); } return render();
    case 'sell': { const p = findPiece(run, +d.u); const v = sell(run, +d.u); if (v) toast(`[Sold ${pieceDef(p.p.id).name} for ${v}g]`, 'loot'); ui.sheet = null; saveRun(); return render(); }
    case 'move': {
      const u = +d.u, to = d.to;
      const ok = to === 'bench' ? movePiece(run, u, 'bench', msgs) : to === 'gear' ? movePiece(run, u, { gear: GEAR[findPiece(run, u).p.id].slot }, msgs) : movePiece(run, u, { bar: +d.i }, msgs);
      if (!ok) toast('[Not possible: your bench may be full.]', 'loss');
      ui.sheet = null; pushMsgs(msgs, false, 'Moved a piece'); saveRun(); saveMeta(); return render();
    }
    case 'shop-done': { if (benchOver()) return render(); if (run.stage === 'shop') { leaveShop(run, null, msgs); pushMsgs(msgs, false, 'Left the shop'); saveRun(); } if (run.pending.length || run.stage !== 'ready') return render(); return startFightUI(); }
    case 'district': {
      const k = d.k; if (distFull(k) || !useDistrict(run, k)) return; ui.distDone = k;
      if (k === 'undercity') { const p = run.pending[run.pending.length - 1]; if (p && p.type === 'event') p.from = 'undercity'; }
      if (k === 'infirmary') toast(`[Treated. +${infirmary(run)} HP]`, 'loot', null, 'Infirmary');
      if (k === 'sanctum') { toast(`[The world mends. +${sanctum(run, msgs)} Hearts]`, 'loot', null, 'Sanctum'); pushMsgs(msgs, false, 'Sanctum'); }
      if (k === 'scout') ui.sheet = { type: 'scout' };

      if (k === 'enchanter') { ui.enchantMods = rollPrefixes(enchantCount(run), null, null, run); ui.enchantSel = null; ui.sheet = { type: 'enchanter' }; }
      saveRun(); return render();
    }
    case 'event': {
      const p = run.pending[0]; if (!p || p.type !== 'event') return; const o = eventOpt(run, p.key, +d.i), before = evSnap(run), scr0 = ui.screen;
      if (!resolveEvent(run, p.key, +d.i, meta, null, msgs)) { toast('[Not possible.]', 'loss'); return; }
      if (!run.practice) { const E = EVENTS[p.key] || {}; meta.hints = meta.hints || {}; if (E.crisis) meta.hints.crisis = true; if (o.roll) meta.hints.roll = true; }
      run.pending.shift(); saveRun(); saveMeta();
      const lines = msgs.length ? msgs : [{ t: 'sys', text: `[${o.desc}]` }];
      // The outcome stays in the event until Continue; if the event moved the game on (run over, a new screen), toasts as before
      if (ui.screen !== scr0 || run.ended || run.hearts <= 0) { pushMsgs(lines, false, `${(EVENTS[p.key] || {}).title || 'Event'}: ${o.label}`); return render(); }
      lines.forEach(m => logRun(m.text, m.t));
      // G5: a chance option shows its roll: a needle sweeps the bar and settles before the outcome appears
      let roll = null;
      if (o.roll) { const m = lines.map(l => /^\[(\w+) check: (\d+)%\. (Success|Failed)\.\]$/.exec(l.text)).find(Boolean); if (m) { const ch = +m[2], won = m[3] === 'Success'; roll = { stat: m[1], ch, won, land: Math.round(won ? Math.random() * Math.max(1, ch - 2) : Math.min(99, ch + 1 + Math.random() * (99 - ch))) }; } }
      ui.sheet = { type: 'evresult', title: (EVENTS[p.key] || {}).title || '[Event]', label: o.label, lines, changes: evDiff(before, run), roll };
      return render();
    }
    case 'take-perk': { choosePerk(run, meta, d.k, msgs); saveMeta(); pushMsgs(msgs, false, `Perk: ${PERKS[d.k].name}`); saveRun(); return render(); }
    case 'take-level': { takeLevel(run, d.k, msgs); pushMsgs(msgs, false, d.k === 'perk' ? 'Perk instead of a level' : `Level ${run.level}`); saveRun(); return render(); }
    case 'take-intake': { const P = run.pending.find(x => x.type === 'intake'), D = P && INTAKE[P.offers[+d.i]]; if (!takeIntake(run, d.i, msgs)) return render(); pushMsgs(msgs, false, `Intake: ${D.name}`); saveRun(); return render(); }
    case 'take-augment': { if (!takeAugment(run, d.i, msgs)) return render(); pushMsgs(msgs, false, 'Rules review'); saveRun(); return render(); }
    case 'take-door': { if (!takeDoor(run, d.i === 'open', msgs)) return render(); pushMsgs(msgs, false, d.i === 'open' ? 'Opened the door' : 'Walked past the door'); saveRun(); return render(); }
    case 'buy-voucher': { const k = run.voucher; if (!buyVoucher(run, msgs)) return render(); sfx('buy'); toast(`[Licence issued: ${VOUCHERS[k].name}]`, 'loot'); pushMsgs(msgs, false, `Licence: ${VOUCHERS[k].name}`); ui.sheet = null; saveRun(); return render(); }
    case 'take-spoils': { const P = run.pending.find(x => x.type === 'spoils'), o = P && d.i !== 'skip' && P.offers[+d.i]; if (!takeSpoils(run, d.i, msgs)) return render(); pushMsgs(msgs, false, o ? `Spoils: ${spoilsText(o)}` : 'Spoils left'); saveRun(); return render(); }
    case 'take-gift': { run.pending.shift(); applyGift(run, d.k, msgs); pushMsgs(msgs, false, `Gift: ${GIFTS[d.k].name}`); saveRun(); return render(); }
    case 'ench-mod': ui.enchantSel = d.i === 'corrupt' ? 'corrupt' : +d.i; return render();
    case 'corrupt-pick': { run.corrupting = corruptOptions(run, +d.u); ui.enchantSel = null; saveRun(); return render(); }
    case 'corrupt-do': { const c = run.corrupting; if (c && corrupt(run, c.u, c.opts[+d.i], msgs)) pushMsgs(msgs, false, 'Corrupted a skill'); run.corrupting = null; ui.sheet = null; saveRun(); return render(); }
    case 'ench-back': ui.enchantSel = null; return render();
    case 'ench-skip': { ui.enchantSel = null; if (ui.sheet) ui.sheet = null; else if (run.pending[0] && run.pending[0].type === 'rune') run.pending.shift(); saveRun(); return render(); }
    case 'ench-apply': {
      const fromRune = !ui.sheet && run.pending[0] && run.pending[0].type === 'rune';
      const mods = fromRune ? run.pending[0].mods : ui.enchantMods, m = mods[ui.enchantSel];
      const f = findPiece(run, +d.u);
      if (f && applyPrefix(run, +d.u, m, msgs, null, fromRune ? run.pending[0].got : '[Carved by the Enchanter, for a price.]')) { toast(`[${PREFIXES[m].name} carved into ${SKILLS[f.p.id].name}]`, 'skill', null, fromRune ? 'Rune' : 'Enchanter'); pushMsgs(msgs, false, `Carved ${PREFIXES[m].name}`); }
      ui.enchantSel = null; if (fromRune) run.pending.shift(); else ui.sheet = null; saveRun(); return render();
    }
    case 'advance': { const p = run.pending[0], o = ADVANCE[p.arch][+d.i]; advance(run, p.arch, +d.i); toast(`[Path evolved: ${ARCH[p.arch].path} → ${o.name}]`, 'class'); logRun(`[Path evolved: ${ARCH[p.arch].path} → ${o.name}]`, 'class'); saveRun(); return render(); }
    case 'evolve': { const p = run.pending[0]; const f = findPiece(run, p.u); const from = SKILLS[f.p.id].name; evolve(run, p.u, d.id, meta); toast(`[Skill evolved: ${from} → ${SKILLS[d.id].name}]`, 'skill'); logRun(`[Skill evolved: ${from} → ${SKILLS[d.id].name}]`, 'skill'); saveRun(); saveMeta(); return render(); }
    case 'stat': if (run.statPts > 0) { const before = maxHp(run); run.statPts--; run.stats[d.k]++; run.hp += maxHp(run) - before; checkMilestones(run, msgs); pushMsgs(msgs, false, `+1 ${d.k}`); saveRun(); } return render();
    case 'equip-title': run.title = run.title === d.k ? null : d.k; saveRun(); return render();
    case 'use': return onUse(+d.i);
    case 'reply': { const f = ui.fight, t = f && rivalReply(run, f, +d.i); if (t) say2(f, t, 'me'); return updateFight(); }
    case 'info': ui.info = !ui.info; return render();
    case 'jinx': if (ui.fight && !ui.busy && jinxMove(ui.fight)) { playEvents(ui.fight); updateFight(); } return;
    case 'reroll-mode': ui.reroll = !ui.reroll; return updateFight();
    case 'rewind': ui.sheet = null; ui.result = null; saveRun(); return startFightUI();
    case 'patch-open': ui.sheet = { type: 'patch', u: +d.u }; saveRun(); return render();
    case 'patch-pick': { const S = ui.sheet; if (S && usePatch(run, S.u, d.k, meta, msgs)) { sfx('buy'); ui.sheet = null; pushMsgs(msgs, false, 'Unsigned Patch'); saveRun(); saveMeta(); } return render(); }
    case 'note-ok': if (ui.notes) ui.notes.shift(); // falls through: the next card, or on with the run
    case 'result-ok': {
      if (ui.notes && ui.notes.length) { ui.sheet = { type: 'note' }; return render(); }
      if (ui.practiceAfter) { ui.practiceAfter = false; ui.result = null; ui.sheet = { type: 'practicedone' }; return render(); }
      if (ui.result && ui.result.won) while (coachStep() && coachStep().scr === 'fight') coachAdvance(); // tutorial steps that wait on the fight screen are over once it closes
      const climbed = ui.result && ui.result.won && run && !run.elite && !run.practice && !run.ended && run.round >= 2 && run.round <= ROUNDS;
      ui.notes = null; ui.sheet = null; ui.fight = null; ui.result = null;
      if (ui.end && ui.end.kind === 'erased') return go('end');
      if (climbed) climbFx(256 >> (run.round - 2), 256 >> (run.round - 1));
      saveRun(); return go(stageScreen());
    }
    case 'climb': if (!startEndless(run, meta)) return render(); ui.end = null; ui.sheet = null; ui.fight = null; saveRun(); saveMeta(); toast('[Past the Undefeated. Depth 1.]', 'class'); return go(stageScreen());
    case 'set-priority': setPriority(meta, +d.n); saveMeta(); ui.sheet = null; return render();
    case 'mastery-open': ui.masteryK = ui.masteryK === d.k ? null : d.k; return render();
    case 'set-challenge': ui.challenge = CHALLENGES[d.k] ? d.k : null; ui.sheet = null; return render();
    case 'enter-elite': startElite(run, meta); ui.end = null; ui.sheet = null; ui.fight = null; saveRun(); return go(stageScreen());
    case 'end-run': { const extra = run.eliteWins * 8 * (bountyOf(run, 'echoes') ? BOUNTIES.echoes.mul : 1); meta.echoes += extra; eliteRank(run, meta); saveMeta(); const snap = meta.champions[0]; ui.end = { kind: 'spared', snap, totalEchoes: echoesFor(run, 'spared') + extra, rp: run.rpEarned || 0, opened: run.trialOpened, observed: finishDaily(true) }; run.ended = true; lsDel(RUN_KEY); ui.fight = null; return go('end'); }
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
  { scr: 'awaken', pos: 'bottom', text: "[Welcome to the practice run, Entrant. I am the System, and I will be your guide. Reluctantly.] This is the Awakening, where you make your champion: a name and sigil, a Patron god and Gifts. For practice I've filled it in.", wait: 'next' },
  { scr: 'awaken', pos: 'bottom', hl: '[data-act="aw-tab"][data-t="gifts"]', text: 'Gifts are your perks and cheat skills, bought with Gift Points. Weaker worlds give more points. Open the Gifts tab.', wait: 'aw-tab' },
  { scr: 'awaken', pos: 'bottom', hl: '[data-act="aw-ok"]', text: "Novice has Legion Deserter (15 Block at the start of every fight) and Catalyst (stronger reactions). Tap Awaken.", wait: 'aw-ok' },
  { scr: 'draft', pos: 'bottom', text: 'Choose 3 starting skills; the coloured tags are archetypes. Try Firebolt, Venom Blade and Iron Guard: Burn on a Poisoned target sets off a reaction.', wait: 'draft-skills' },
  { scr: 'choose', pos: 'bottom', hl: '.opps', text: 'Every round you choose your opponent. The Hard one pays more, a rune and a rare shop piece, but losing to it costs an extra Heart. Hearts are your world: run out and it is erased.', wait: 'next' },
  { scr: 'choose', pos: 'top', hl: '.wager', text: 'Gods offer wagers on your fight: stake 5 gold on a condition, win 10 back and their Favour. Leave this one.', wait: 'next' },
  { scr: 'choose', pos: 'top', hl: '.opp[data-i="0"]', text: 'Tap the Goblin to see it, then Face them.', wait: 'pick-opp' },
  { scr: 'district', pos: 'bottom', hl: '.inter', text: "Before the shop, visit one district. Scout's Post shows what your opponent will do two moves ahead. Pick one.", wait: 'district' },
  { scr: 'shop', pos: 'bottom', hl: '.achips', text: 'Archetype counters. Equip 2, 4 or 6 pieces of one archetype for its bonuses. Tap a counter any time to read them.', wait: 'next' },
  { scr: 'shop', pos: 'bottom', hl: '.shoptabs', text: 'There are two shops: Skills and Gear. Each has 5 slots and its own reroll. A badge on the tab tells you when it holds copies of things you own.', wait: 'next' },
  { scr: 'shop', pos: 'bottom', hl: '.tile.merge, .tile.owned', text: 'Glowing tiles are copies of pieces you own; the dots show how many you have. Three copies merge into ★2 with +50% power. Copies get a Buy button of their own. Buy both Firebolts.', until: () => ownsStar('firebolt', 2) },
  { scr: 'shop', pos: 'bottom', hl: '[data-act="shop-tab"][data-k="gear"]', text: 'Merged! Now open the Gear shop. Gear gives stats and one passive, and counts toward archetypes too.', wait: 'shop-tab' },
  { scr: 'shop', pos: 'bottom', hl: '.shopgrid', text: 'Buy the Ember Gauntlets: Burn you apply +2, and another Pyre piece.', until: () => allPieces(run).some(p => p.id === 'ember_gauntlets') },
  { scr: 'shop', pos: 'bottom', hl: '.shoptabs .btn, .xptile', text: 'Rerolling costs 2 gold. Train spends gold on extra stat points. Levels come from battles. Gold you keep earns interest: +1 for every 4, up to 5.', wait: 'next' },
  { scr: 'shop', pos: 'bottom', hl: '.barrow, .gearrow', text: 'Your skill bar and gear. Tap any piece to see it, swap it with your bench, or sell it. When you are ready, tap Fight.', wait: 'shop-done' },
  { scr: 'fight', pos: 'mid', hl: '#intent', text: "The opponent's next move is always shown here. Red means a big hit is coming.", wait: 'next' },
  { scr: 'fight', pos: 'mid', hl: '.brk-bar', text: 'Damage past their Block fills the gold break bar, and big hits fill it twice as fast. Full, they are Broken: they lose a turn and take 50% more damage.', wait: 'next' },
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
  if (cloud.on && !cloud.pulled && !cloud.syncOff) pullProgress(); // the practice run held back the account's save
}
function coachStep() { return ui.coach && COACH[ui.coach.i]; }
function coachAdvance() { if (!ui.coach) return; ui.coach.i++; if (ui.coach.i >= COACH.length) ui.coach.done = true; }
function coachHTML() {
  if (!ui.coach) return '';
  let st = coachStep();
  while (st && st.until && st.until() && ui.screen === st.scr) { coachAdvance(); st = coachStep(); }
  // Left the screen without doing what the step asked (e.g. tapped Awaken before opening Gifts): drop that screen's
  // remaining steps, or the tutorial waits there forever and never shows again
  if (st && st.scr === ui.screen) ui.coach.shown = ui.coach.i;
  else if (st && ui.coach.shown === ui.coach.i) { const left = st.scr; while (st && st.scr === left) { coachAdvance(); st = coachStep(); } }
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
// "Noticed": what the System's attention does, in its own voice
function noticeSheet() {
  const step = Math.round(TUNE.notice * 100), max = Math.round(TUNE.notice * TUNE.noticeMax * 100);
  return sheetWrap('[You have been Noticed]', `<div class="sysbox"><p>[Straight wins attract attention. Each one makes your opponents hit ${step}% harder, up to ${max}%.]</p><p>[Currently: +${noticePct(run)}%.]</p><p>[Lose a Heart and the System loses interest. This is not a suggestion.]</p></div>`, '<button class="btn primary" data-act="close">OK</button>');
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
const CLOUD_FAIL_TEXT = { sync: 'Cloud save failed. Your progress is kept on this device.', share: 'Shared champions could not be reached.', pool: 'Filed records could not be reached.', board: 'Pending World scores could not be reached.' };
function cloudFail(kind, where, e) {
  const code = (e && e.code) || 'unknown';
  console.warn(`[cloud] ${where} failed:`, code, e);
  if (code === 'unavailable') return; // network drop: expected, saves retry and stay on the device
  cloud.failShown = cloud.failShown || {}; if (cloud.failShown[kind]) return;
  cloud.failShown[kind] = true; toast(`[${CLOUD_FAIL_TEXT[kind]} (${code})]`, 'loss');
}
function progressDoc() { return cloud.db.doc('data/users/' + cloud.uid + '/progress'); }
// Which account this device last synced with. A device that has never synced with the signed-in account
// (a new phone, cleared data, another account) never pushes before it has seen that account's save.
const SYNC_KEY = 'wpd-sync', BACKUP_KEY = 'wpd-save-backups';
// Real progress: anything a player would miss. A new device has none, even after it marks the patch notes seen.
function hasProgress(m) { return !!m && ((m.runs || 0) > 0 || (m.echoes || 0) > 0 || (m.champions || []).length > 0 || (m.erased || []).length > 0 || Object.keys(m.unlocks || {}).length > 0); }
// The last 3 saves this device replaced, so a wrong pick (or a sync bug) can be undone from Settings
function backupSave(m, r, why) {
  if (!hasProgress(m)) return;
  const list = (lsGet(BACKUP_KEY) || []).filter(b => b && b.meta && b.meta.savedAt !== m.savedAt);
  list.unshift({ at: Date.now(), why, meta: jsonSafe(m), run: r || null });
  lsSet(BACKUP_KEY, list.slice(0, 3));
}
const markSynced = () => { if (cloud.uid) lsSet(SYNC_KEY, { uid: cloud.uid, at: Date.now() }); };
function useCloudSave(r) {
  backupSave(meta, lsGet(RUN_KEY), 'Replaced by your account save');
  meta = migrateMeta(jsonSafe(r.meta)); bindMeta(meta); lsSet(META_KEY, meta);
  if (ui.screen === 'title') { if (r.run && r.run.v === VERSION && !r.run.ended) lsSet(RUN_KEY, r.run); else lsDel(RUN_KEY); }
}
async function pullProgress() {
  cloud.pulled = false;
  let snap;
  try { snap = await progressDoc().get(); } catch (e) { cloud.syncOff = true; cloud.status = 'local'; cloudFail('sync', 'load progress', e); return; }
  if (realMeta) return; // in the practice run: endPractice pulls again, and nothing pushes meanwhile
  const r = snap.exists ? snap.data() : null;
  const cloudHas = !!(r && r.meta && hasProgress(r.meta)), localHas = hasProgress(meta);
  // Known: this device synced with this account before, or both hold the same progress (a device from before this check)
  const same = (a, b) => ['runs', 'wins', 'echoes'].every(k => (a[k] || 0) === (b[k] || 0)) && (a.champions || []).length === (b.champions || []).length && (a.erased || []).length === (b.erased || []).length;
  const known = (lsGet(SYNC_KEY) || {}).uid === cloud.uid || !!(r && r.meta && same(r.meta, meta));
  // First sync on this device with both saves holding progress: the player picks, nothing pushes until then
  if (!known && cloudHas && localHas) { ui.sheet = { type: 'savepick', r }; render(); return; }
  let changed = false, push = false;
  if (!known && cloudHas && !localHas) { useCloudSave(r); changed = true; } // a new device: take the account's save, however new its own looks
  else if (!known && localHas && !cloudHas) push = true; // the account's save is empty: this device's is the real one
  else {
    if (r && r.meta && (r.meta.savedAt || 0) > (meta.savedAt || 0)) {
      backupSave(meta, null, 'Replaced by a newer account save');
      meta = migrateMeta(jsonSafe(r.meta)); bindMeta(meta); lsSet(META_KEY, meta); changed = true;
    }
    const localRun = lsGet(RUN_KEY);
    if (r && r.run && r.run.v === VERSION && !r.run.ended && (!localRun || (r.run.savedAt || 0) > (localRun.savedAt || 0)) && ui.screen === 'title') {
      lsSet(RUN_KEY, r.run); changed = true;
    }
  }
  cloud.pulled = true; markSynced();
  if (changed) { toast('[Progress synced from your account.]', 'sys'); render(); }
  const localRun = lsGet(RUN_KEY);
  if (push || !r || (meta.savedAt || 0) > ((r.meta && r.meta.savedAt) || 0) || (localRun && (localRun.savedAt || 0) > ((r.run && r.run.savedAt) || 0))) schedulePush();
}
function saveSummary(m) {
  const n = (k, one, many) => `${k} ${k === 1 ? one : many}`, sp = (m.champions || []).length, d = m.savedAt ? new Date(m.savedAt) : null;
  return `${n(m.runs || 0, 'run', 'runs')}, ${n(sp, 'world', 'worlds')} spared, ${m.echoes || 0} Echoes${d ? `. Last played ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`;
}
function savePickSheet() {
  const r = ui.sheet.r;
  return sheetWrap('[Two saves found]', `<p class="sh-p">This device and your account both have progress. Pick the one to keep.</p><p class="sh-p"><b>Account save:</b> ${esc(saveSummary(r.meta))}.</p><p class="sh-p"><b>This device:</b> ${esc(saveSummary(meta))}.</p><p class="sh-p fine">The other one stays on this device as a backup. You can bring it back from Settings.</p>`,
    `<button class="btn ghost" data-act="save-pick" data-k="local">Keep this device's</button><button class="btn primary" data-act="save-pick" data-k="cloud">Use account save</button>`, 'sys', true);
}
function pickSave(k) {
  const S = ui.sheet; if (!S || S.type !== 'savepick') return;
  ui.sheet = null;
  if (k === 'cloud') { useCloudSave(S.r); toast('[Account save loaded. The other one is kept as a backup.]', 'sys'); }
  else {
    backupSave(migrateMeta(jsonSafe(S.r.meta)), S.r.run || null, 'Account save, replaced by this device');
    meta.savedAt = Date.now(); lsSet(META_KEY, meta); toast('[This device\'s save kept. The account save is kept as a backup.]', 'sys');
  }
  cloud.pulled = true; markSynced();
  schedulePush(); render();
}
function restoreBackup(i) {
  const b = (lsGet(BACKUP_KEY) || [])[i]; if (!b || !b.meta) return;
  backupSave(meta, lsGet(RUN_KEY), 'Replaced by a restored backup');
  meta = migrateMeta(b.meta); bindMeta(meta);
  if (b.run && b.run.v === VERSION && !b.run.ended) lsSet(RUN_KEY, b.run);
  saveMeta(); toast('[Backup restored.]', 'sys');
}
function backupsHTML() {
  const list = (lsGet(BACKUP_KEY) || []).filter(b => b && b.meta);
  if (!list.length) return '';
  if (run && !run.ended) return '<h4>Save backups</h4><p class="sh-p fine">This device has a backup save. Finish or leave your run to restore it.</p>';
  return `<h4>Save backups</h4><p class="sh-p fine">Saves this device replaced. Restoring one swaps it with your current save, which becomes a backup.</p>${list.map((b, i) => `<div class="setrow"><div><b>${esc(saveSummary(b.meta))}</b><small>${esc(b.why || '')}</small></div><button class="btn small ghost" data-act="restore-save" data-i="${i}">Restore</button></div>`).join('')}`;
}
function schedulePush() {
  if (!cloud.on || cloud.syncOff || realMeta || !cloud.pulled) return;
  clearTimeout(cloud.timer); cloud.timer = setTimeout(pushProgress, FIREBASE ? 5000 : 2000);
}
async function pushProgress() {
  if (!cloud.on || !cloud.pulled || realMeta) return;
  if (cloud.pushing) { cloud.again = true; return; }
  cloud.pushing = true;
  try {
    const r = lsGet(RUN_KEY);
    await progressDoc().set(jsonSafe({ meta, run: r && !r.ended && !r.practice ? r : null, savedAt: Date.now() }));
    cloud.status = 'synced'; markSynced();
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
// ---------- Entrant pool (core.js "Entrant pool", firestore.rules pool/{round}_{slot}) ----------
// The hard opponent each round is a filed record: the System's reserve until the slot is read, then the player build
// filed there, if there is one. Reading needs any sign-in; filing your own record needs an approved tester.
const poolBusy = {};
const POOL_ECHOES = 2; // Echoes for each time one of your filed records beats another Entrant
function poolLoad() {
  if (!run || !run.choices || !cloud.on || !cloud.db || !cloud.uid || cloud.poolOff) return;
  run.choices.forEach(spec => {
    if (spec.kind === 'final' && spec.pool && !spec.read) return finalLoad(spec);
    if (spec.kind !== 'entrant' || spec.read) return;
    const key = spec.round + '_' + spec.slot; if (poolBusy[key]) return;
    poolBusy[key] = true;
    poolRead(spec, run).finally(() => { delete poolBusy[key]; });
  });
}
// The final's finalist: list the round's filed records once, and take one from a world of the paired type
function finalLoad(spec) {
  const key = 'final_' + spec.round; if (poolBusy[key]) return;
  poolBusy[key] = true; const r = run;
  (async () => {
    let docs = [];
    try { const qs = await cloud.db.collection('pool').query({ where: ['r', '==', spec.round], limit: POOL_SIZE }); docs = qs.docs.map(d => ({ id: d.id, data: d.data() })); }
    catch (e) { if (e && e.code === 'invalid_argument') cloud.poolOff = true; console.warn('[cloud] list final pool failed:', e && e.code, e); return; }
    if (run !== r || r.stage !== 'choose' || !r.choices.includes(spec)) return;
    spec.read = true;
    docs.forEach(d => { if (d.data && d.data.name && d.data.owner) cloud.names[d.data.owner] = String(d.data.name).slice(0, 24); });
    if (finalFill(spec, docs, cloud.uid)) { saveRun(); if (ui.screen === 'choose') render(); } else saveRun();
  })().finally(() => { delete poolBusy[key]; });
}
async function poolRead(spec, r, retry) {
  let data = null;
  try { const d = await cloud.db.doc('pool/' + poolId(spec.round, spec.slot)).get(); data = d.exists ? d.data() : null; }
  catch (e) { if (e && e.code === 'invalid_argument') cloud.poolOff = true; console.warn('[cloud] read pool failed:', e && e.code, e); return; }
  // Only while the player is still choosing: a record never swaps under an opponent already picked
  if (run !== r || r.stage !== 'choose' || !r.choices.includes(spec)) return;
  // Never your own record: look one slot on, once
  if (data && data.owner === cloud.uid && !retry) { spec.slot = spec.slot % POOL_SIZE + 1; spec.snap = poolReserve(spec.round, spec.slot); return poolRead(spec, r, true); }
  spec.read = true;
  if (data && data.name && data.owner) cloud.names[data.owner] = String(data.name).slice(0, 24);
  if (poolFill(spec, data, cloud.uid)) { saveRun(); if (ui.screen === 'choose') render(); } else saveRun();
}
// After a fight in a pool round: settle what the fight did to the record you fought (poolResolve), then file the build that
// walked into the round. It takes a free slot (never filed, or its record erased) when the round has one, else a random one.
function poolFile(res) {
  if (res.rewind || !run) return;
  if (canShare() && cloud.uid && !cloud.poolOff) {
    if (res.poolHit) poolHit(res.poolHit, res.msgs);
    if (res.poolWon) poolNote(res.poolWon, { won: true });
  }
  const up = run.poolUp; if (!up) return;
  delete run.poolUp;
  if (!canShare() || !cloud.uid || cloud.poolOff) return;
  if (!run.poolFiled) { run.poolFiled = true; res.msgs.push({ t: 'sys', text: `[Your round ${up.round} record has been filed. It will fight for ${run.world.name} in other Entrants' tournaments. You will not be compensated.]` }); }
  (async () => {
    let slot = 1 + Math.floor(Math.random() * POOL_SIZE);
    try {
      const qs = await cloud.db.collection('pool').query({ where: ['r', '==', up.round], limit: POOL_SIZE });
      const taken = new Set(qs.docs.filter(d => (d.data() || {}).hearts > 0).map(d => d.id));
      const free = []; for (let i = 1; i <= POOL_SIZE; i++) if (!taken.has(poolId(up.round, i))) free.push(i);
      if (free.length) slot = free[Math.floor(Math.random() * free.length)];
    } catch (e) { console.warn('[cloud] list pool failed:', e && e.code, e); }
    await cloud.db.doc('pool/' + poolId(up.round, slot)).set({ snap: jsonSafe(up.snap), owner: cloud.uid, at: Date.now(), hearts: POOL_HEARTS, r: up.round });
  })().catch(e => { if (e && e.code === 'invalid_argument') cloud.poolOff = true; cloudFail('pool', 'file pool record', e); });
}
// You beat a player's record: it loses a Heart, unless it was filed over or erased since you drew it. At zero it is erased
// and its owner is told.
function poolHit(h, msgs) {
  const left = Math.max(0, h.hearts - 1);
  msgs.push(left ? { t: 'sys', text: `[${h.champ}'s round ${h.round} record loses a Heart. ${left} left.]` } : { t: 'broadcast', text: `[${h.champ}'s round ${h.round} record is erased in this tournament. Outcomes vary.]` });
  const ref = cloud.db.doc('pool/' + poolId(h.round, h.slot));
  (async () => {
    const d = await ref.get(), data = d.exists ? d.data() : null;
    if (!data || data.owner !== h.owner || data.at !== h.at || !(data.hearts > 0)) return;
    await ref.set(Object.assign({}, data, { hearts: data.hearts - 1 }));
    if (data.hearts === 1) poolNote(h, { gone: true });
  })().catch(e => cloudFail('pool', 'hit pool record', e));
}
// A note in the record owner's inbox: their record beat someone (won), or was erased (gone)
function poolNote(h, extra) {
  if (!h.owner || h.owner === cloud.uid) return;
  const t = Date.now();
  cloud.db.doc(`inbox/${h.owner}/notes/${cloud.uid}_${t}`).set(Object.assign({ by: cloud.uid, champ: String(h.champ).slice(0, 60), t, pool: h.round }, extra))
    .catch(e => cloudFail('pool', 'pool note', e));
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
    qs.docs.forEach(d => { const e = d.data() || {}; if (e.by && e.by !== cloud.uid && Number(e.t) > seen) notes.push({ by: e.by, champ: String(e.champ || 'Your champion').slice(0, 60), t: Number(e.t), at: Number(e.at) || 0, won: e.won === true, rank: rankIdx(e.rank) >= 0 ? e.rank : null, pool: Number(e.pool) || 0, gone: e.gone === true }); });
    if (!notes.length) return;
    await resolveNames(notes.filter(n => !n.won || n.pool).map(n => n.by));
    const ranked = [];
    // Filed records: wins are added up into one line, erasures each get their own
    const held = notes.filter(n => n.pool && n.won);
    if (held.length) { meta.echoes += POOL_ECHOES * held.length; logToast(`[Your filed records held their worlds ${held.length === 1 ? 'once' : held.length + ' times'} in other Entrants' tournaments. +${POOL_ECHOES * held.length} Echoes.]`); }
    notes.sort((a, b) => a.t - b.t).forEach(n => {
      if (n.pool) { if (n.gone) logToast(`[${n.champ}'s round ${n.pool} record was erased by ${ownerName(n.by)}.]`); return; }
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
  else { clearTimeout(cloud.timer); Object.assign(cloud, { db: null, user: null, uid: null, on: false, pulled: false, syncOff: false, shareOff: false, tester: null, shared: [], status: 'local' }); ui.board = null; setShared([], []); render(); }
});
function cloudSignInHTML(compact) {
  const provs = (window.FIREBASE_PROVIDERS || ['google', 'github']).filter(k => k === 'google' || k === 'github');
  if (!FIREBASE) return '';
  const C = window.WPD_CLOUD;
  if (C && C.error) return compact ? '' : '<p class="sh-p fine">Cloud saves are unavailable right now (offline?). Progress is saved on this device.</p>';
  if (cloud.on) return compact ? '' : `<div class="cloudbox"><p class="sh-p">Signed in as <b>${esc(publicName())}</b>. Progress syncs across your devices.</p><label class="fld"><span>Name other players see</span><input id="cloud-name" maxlength="18" value="${esc(publicName())}" autocomplete="off"></label><p class="sh-p fine">Your account name and email are never shown to other players.</p>${cloud.tester === false ? `<p class="sh-p sysl">${PENDING}</p><p class="sh-p fine">Your request is filed under this name. Daily scores and shared champions open once you are approved.</p>` : ''}<button class="btn small ghost" data-act="signout">Sign out</button></div>`;
  return `<div class="cloudbox ${compact ? 'compact' : ''}">${compact ? '' : '<p class="sh-p">Sign in to save your progress to the cloud, play on any device, and share champions with other players.</p>'}<div class="${provs.length > 1 ? 'row2 even' : 'stack'}">${provs.map(k => `<button class="btn ${compact ? 'small' : ''}" data-act="signin" data-k="${k}">Sign in with ${k === 'github' ? 'GitHub' : 'Google'}</button>`).join('')}</div></div>`;
}

// U5: after a win the bracket thins on screen for a moment: the count of Entrants left drops and their marks go dark.
// It sits over the next screen without blocking it; a tap anywhere clears it.
function climbFx(from, to) {
  if (REDUCED || !(from > to)) return;
  document.querySelectorAll('.climb').forEach(x => x.remove());
  const el = document.createElement('div'); el.className = 'climb'; el.setAttribute('aria-hidden', 'true');
  const N = Math.min(64, from), keep = Math.max(1, Math.round(N * to / from));
  el.innerHTML = `<div class="cl-box"><span class="cl-k">[Bracket updated]</span><b class="cl-n">${from}</b><span class="cl-l">Entrants left</span><div class="cl-d">${Array.from({ length: N }, (_, i) => `<i class="${i === 0 ? 'me' : ''}"></i>`).join('')}</div></div>`;
  document.body.appendChild(el);
  const dots = [...el.querySelectorAll('.cl-d i')], num = el.querySelector('.cl-n'), t0 = performance.now();
  dots.forEach((d, i) => { if (i >= keep) setTimeout(() => d.classList.add('out'), 250 + Math.random() * 600); });
  const step = t => { const q = Math.min(1, Math.max(0, (t - t0 - 250) / 700)); num.textContent = Math.round(from - (from - to) * q); if (q < 1 && el.isConnected) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  const done = () => { el.classList.add('out'); setTimeout(() => el.remove(), 260); document.removeEventListener('pointerdown', done, true); };
  setTimeout(done, 1900); document.addEventListener('pointerdown', done, true);
}
// G3: a reward you pick grows and flies up to the top bar while the others shrink away, then the choice happens
const FLY_ACTS = ['take-spoils', 'take-level', 'take-intake', 'take-perk', 'take-augment', 'take-door', 'take-gift', 'evolve', 'event'];
let flying = false;
app.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled || flying) return;
  if (!['use', 'buy', 'quick-buy'].includes(el.dataset.act)) sfx('tap');
  if (!REDUCED && el.classList.contains('choice') && FLY_ACTS.includes(el.dataset.act) && el.closest('.sheet')) {
    flying = true; const act = { dataset: Object.assign({}, el.dataset) };
    el.closest('.sheet').querySelectorAll('.choice').forEach(c => c.classList.add(c === el ? 'chosen' : 'unchosen'));
    setTimeout(() => { flying = false; onAct(act); }, 330);
    return;
  }
  onAct(el);
});
app.addEventListener('input', e => { if (e.target.id === 'aw-name' && ui.aw) { ui.aw.name = e.target.value; const b = app.querySelector('[data-act="aw-ok"]'); if (b) { render(); } } });
app.addEventListener('input', e => { if (e.target.id === 'fb-text' && ui.fb) ui.fb.text = e.target.value; });
app.addEventListener('change', e => { if (e.target.id === 'fb-attach' && ui.fb) ui.fb.attach = e.target.checked; if (e.target.id === 'cloud-name') { meta.handle = e.target.value.trim().slice(0, 18); saveMeta(); syncPublicName(); } });
// Keyboard (#17): Escape closes, Enter presses the main button, number keys pick the Nth choice on screen
// (skills in a fight, as before), S opens Stats and L the System log during a run
const KEY_PICKS = { choose: '[data-act="opp-open"]', district: '[data-act="district"]', draft: '[data-act="draft-pick"]', worlds: '[data-act="pick-world"]', shop: '.shopgrid [data-act="shop-item"]' };
function keyClick(el) { if (el && !el.disabled) { el.focus({ preventScroll: true }); el.click(); return true; } return false; }
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tgt = e.target, typing = tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable);
  if (e.key === 'Escape' && ui.sheet && !['result', 'evresult', 'note', 'savepick'].includes(ui.sheet.type)) { ui.sheet = null; render(); return; }
  if (typing) return;
  if ((e.key === 'Enter' || e.key === ' ') && tgt && tgt.matches && tgt.matches('div[role="button"][data-act]')) { e.preventDefault(); tgt.click(); return; }
  const sheet = app.querySelector('.sheet');
  if (ui.screen === 'fight' && !sheet) { if (/^[1-6]$/.test(e.key)) { const n = +e.key; const i = n === run.slots + 1 ? 0 : n; onUse(i); } return; }
  if (e.key === 'Enter') {
    if (tgt && tgt.tagName === 'BUTTON' && app.contains(tgt)) return; // the focused button handles its own Enter
    const main = sheet ? sheet.querySelector('.sh-f .btn.primary') : app.querySelector('main .foot .btn.primary, main .foot2 .btn.primary');
    if (keyClick(main)) e.preventDefault(); return;
  }
  if (/^[1-9]$/.test(e.key)) {
    const list = sheet ? sheet.querySelectorAll('.choice, .reply') : KEY_PICKS[ui.screen] ? app.querySelectorAll(KEY_PICKS[ui.screen]) : [];
    if (keyClick(list[+e.key - 1])) e.preventDefault(); return;
  }
  if (!sheet && run && ['choose', 'district', 'shop'].includes(ui.screen)) {
    if (e.key === 's' || e.key === 'S') { ui.sheet = { type: 'stats' }; render(); }
    else if (e.key === 'l' || e.key === 'L') { ui.sheet = { type: 'syslog' }; render(); }
  }
});
render();
maybeShowNews();
cloudInit();
