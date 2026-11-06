// ===== [World Pending Deletion] — rules (no DOM) =====
'use strict';
// Content (archetypes, skills, gear, gods, worlds, enemies, Gifts, Titles, quests, Hidden Paths) lives in js/content/.
// The page loads those files before this one. In Node (sims and tools) this loads them the same way, in index.html's order.
if (typeof module !== 'undefined' && typeof ARCH === 'undefined') {
  const fs = require('fs'), path = require('path'), vm = require('vm'), root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const [, f] of html.matchAll(/<script src="(js\/content\/[^"]+)"><\/script>/g)) vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: path.join(root, f) });
}
const VERSION = 5;
const PRICE = { E: 1, D: 2, C: 3, B: 4, A: 5 };

// ---------- Archetypes ----------
function alliesOf(k) { return themeAllies(k); }
function archTier(n) { return n >= 6 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0; }

// ---------- Gear: stats + one passive, no active skill ----------
const STAR_MULT = [0, 1, 1.5, 1.6];
const GEAR_STAR = [0, 1, 1.5, 2], GEAR_STAR_PCT = [0, 1, 1.4, 1.8];
function gearPas(id, star) { const g = GEAR[id], o = {}; Object.entries(g.pas || {}).forEach(([k, v]) => o[k] = Number.isInteger(v) ? Math.round(v * GEAR_STAR[star]) : Math.round(v * GEAR_STAR_PCT[star] * 100) / 100); Object.assign(o, g.fix || {}); if (star >= 3 && g.top) Object.assign(o, g.top); return o; }
// At ★3 a piece gains its top line, worded by effects.js
function gearTop(id) { const t = GEAR[id].top; return t ? Object.entries(t).map(([k, v]) => EFFECTS[k].say(v)).join(' ') : ''; }
function gearText(id, star) { star = star || 1; const t = GEAR[id].text(gearPas(id, star)); return star >= 3 && GEAR[id].top ? `${t} ★3: ${gearTop(id)}` : t; }
function gearStats(id, star) { const o = {}; Object.entries(GEAR[id].stats).forEach(([k, v]) => o[k] = v * (star || 1)); return o; }
function isGear(id) { return !!GEAR[id]; }
function pieceDef(id) { return GEAR[id] || SKILLS[id]; }
function baseId(id) { return (SKILLS[id] && SKILLS[id].base) || id; }

// ---------- Prefixes (skills only; PREFIXES and MAX_MODS live in js/content/prefixes.js) ----------
// A prefix's real key: a [REDACTED] stand-in (r_<glitch>) counts as the glitch it hides
const bareMod = m => (PREFIXES[m] && PREFIXES[m].hide) || m;
const GLITCH_PREFIXES = Object.keys(PREFIXES).filter(k => PREFIXES[k].glitch && !PREFIXES[k].hide && k !== 'redacted');
function prefixOk(id, m, mods) {
  const d = SKILLS[id]; if (!d || d.basic) return false;
  const have = (mods || []).map(bareMod);
  if (m === 'redacted') return GLITCH_PREFIXES.some(k => !have.includes(k) && prefixOk(id, k, mods));
  if (have.includes(bareMod(m))) return false; const P = PREFIXES[m]; return !P.ok || P.ok(d);
}
// Glitches (glitched prefixes, gear and the like) are on everywhere but Pending World, which gets them only on Glitch Day
function glitchesOn(run) { return !!run && (!run.daily || glitchDay(run.daily)); }
// Glitch Day: one game day a week (GLITCH_DAY.weekday, 0 = Sunday) Pending World runs on a Corrupted Save, with glitches
// on. Days before GLITCH_DAY.from never are, so shipping it never changes a day already played.
// SHIP STEP: set from to the first glitch weekday after the release that ships Glitch Day.
const GLITCH_DAY = { weekday: 5, from: '2026-11-06' };
function glitchDay(date) { return !!date && date >= GLITCH_DAY.from && new Date(date + 'T00:00:00Z').getUTCDay() === GLITCH_DAY.weekday; }
// A Corrupted Save world doubles every glitch chance
function glitchMul(run) { return run && run.world && run.world.mod === 'corrupted' ? 2 : 1; }
// With run, only prefixes at least one of its skills can take, so every offered rune is pickable. Glitched prefixes need
// a run where glitches are on; [REDACTED] stand-ins and Corrupt results are never offered.
function rollPrefixes(n, rng, forId, run) { const keys = Object.keys(PREFIXES).filter(k => PREFIXES[k].w > 0 && (!PREFIXES[k].glitch || glitchesOn(run)) && (!forId || prefixOk(forId, k, [])) && (!run || prefixTargets(run, k).length)); if (!keys.length) return []; const out = [], m = glitchMul(run); let g = 0; while (out.length < n && g++ < 100) { const k = wpick(keys, keys.map(x => PREFIXES[x].w * (PREFIXES[x].glitch ? m : 1)), rng); if (!out.includes(k)) out.push(k); } return out; }
function moddedDef(id, mods) {
  const base = SKILLS[id];
  const d = Object.assign({}, base, { fx: Object.assign({}, base.fx), mods: (mods || []).slice(), powerMult: 1 });
  d.mods.forEach(m => PREFIXES[m].apply(d));
  return d;
}
function effRank(id, mods) { const d = pieceDef(id); return RANKS[Math.min(6, RANKS.indexOf(d.rank) + (mods ? mods.length : 0))]; }
function modName(id, mods) { return (mods && mods.length ? mods.map(m => PREFIXES[m].name).join(' ') + ' ' : '') + pieceDef(id).name; }

// ---------- World ranks ----------
const WORLD_RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
const RANK_W = [20, 25, 25, 15, 10, 5];

const REC_SIZE = 10, REC_MAX = 20, TIER_ORDER = { far: 0, city: 1, home: 2 };
const loreName = e => e.name.replace(/^(The|Your) /, m => m.toLowerCase()); // mid-sentence: "the Drowned Lighthouse", "your sister Ilsa"
const loreWho = e => e.name.replace(/^Your \S+ /, ''); // a person in the Halls: "Ilsa"
// Pick 10 entries: at least 3 places, 2 people and 2 customs, always including the bio's home place and person.
// ids is in deletion order (far, city, home, with the bio's person last); lost and partial are bitmasks over ids.
// A world's lore is its type's pool plus its layers' pools (js/content/layers.js). Records store numbers, and each source
// keeps its own range, so a record made before layers existed still points at the same words: the type's own entries,
// roles and promises are 0 to 99, the Fate's from 100, the People's from 200, a Confluence type's from 300.
const LAYER_BASE = { f: 100, p: 200, c: 300 }, LAYER_TAKE = { f: 2, p: 2, c: CONFLUENCE.take };
const layerSrc = (k, id) => id == null ? null : k === 'f' ? FATES[id] : k === 'p' ? PEOPLES[id] : LORE[id];
// The layers a record carries, from a world ({ fate, people, mix }) or a record ({ f, p, c })
function layersOf(x) { const o = {}; if (!x) return o; const f = x.fate || x.f, p = x.people || x.p, c = x.mix || x.c; if (FATES[f]) o.f = f; if (PEOPLES[p]) o.p = p; if (LORE[c]) o.c = c; return o; }
// A snapshot's layers (worldFate, worldPeople, worldMix), or else the ones its record carries
function snapLayers(x) { return x ? Object.assign(layersOf(x.rec), layersOf({ fate: x.worldFate, people: x.worldPeople, mix: x.worldMix })) : {}; }
// The words for a world's layers: "Merchant League · The Long Night · with the Iron Hold"
function layerNames(Ls) { return [Ls.p && PEOPLES[Ls.p].name, Ls.f && FATES[Ls.f].name, Ls.c && 'with the ' + WORLD_TYPES[Ls.c].name].filter(Boolean).join(' · '); }
const loreCache = {};
// { entries, roles, promises }: objects from number to entry or text. Keys come back in number order.
function recLore(rec, type) {
  const Ls = layersOf(rec), key = [type, Ls.f, Ls.p, Ls.c].join('|');
  if (loreCache[key]) return loreCache[key];
  const out = { entries: {}, roles: {}, promises: {} };
  const add = (src, base, only) => src && (only || ['entries', 'roles', 'promises']).forEach(a => (src[a] || []).forEach((x, i) => { out[a][base + i] = x; }));
  add(LORE[type], 0);
  Object.keys(LAYER_BASE).forEach(k => add(layerSrc(k, Ls[k]), LAYER_BASE[k], k === 'c' ? ['entries'] : null));
  return loreCache[key] = out;
}
const loreIds = o => Object.keys(o).map(Number);
// Settings: a world type has one (fantasy unless it says otherwise); a layer or a layer entry may list the settings it
// suits, and without a list it suits them all. A world only draws layers and entries that suit its type.
const settingOf = type => (WORLD_TYPES[type] && WORLD_TYPES[type].setting) || 'fantasy';
const suits = (x, type) => !x || !x.settings || x.settings.includes(settingOf(type));
// layers: the world's layers, if any. Each layer present files LAYER_TAKE entries (a Confluence type's never its home
// ones, which belong to someone else's home); the type files the rest.
function buildRecord(type, rng, layers) {
  const Ls = layersOf(layers), W = recLore(Ls, type), E = W.entries, all = loreIds(E), own = all.filter(i => i < 100);
  const of = (k, tier) => own.filter(i => E[i].k === k && E[i].tier === tier);
  const home = pick(of('place', 'home'), rng), person = pick(of('person', 'home'), rng);
  const ids = [home, person], need = { place: 3, person: 2, custom: 2 };
  Object.keys(LAYER_BASE).forEach(k => { if (Ls[k]) shuffle(all.filter(i => i >= LAYER_BASE[k] && i < LAYER_BASE[k] + 100 && (k === 'c' ? E[i].tier !== 'home' : suits(E[i], type))), rng).slice(0, LAYER_TAKE[k]).forEach(i => ids.push(i)); });
  shuffle(own, rng).forEach(i => { if (!ids.includes(i) && ids.filter(j => E[j].k === E[i].k).length < need[E[i].k]) ids.push(i); });
  shuffle(own, rng).forEach(i => { if (ids.length < REC_SIZE && !ids.includes(i)) ids.push(i); });
  const key = i => i === person ? 9 : TIER_ORDER[E[i].tier];
  const bio = { role: pick(loreIds(W.roles), rng), home, person, promise: pick(loreIds(W.promises), rng) };
  return Object.assign({ ids: shuffle(ids, rng).sort((a, b) => key(a) - key(b)), lost: 0, partial: 0, bio }, Ls);
}
// Saves from before the record get one that matches the Hearts they have left
function ensureRecord(run, rng) {
  if (!run || run.record || run.practice || !LORE[run.world.type]) return;
  run.record = buildRecord(run.world.type, rng, run.world);
  run.record.lost = (1 << Math.max(0, Math.min(REC_SIZE, run.maxHearts - run.hearts))) - 1;
}
// Erase the next n entries that are still standing. Returns their positions in ids.
function eraseRecord(run, n, msgs) {
  const R = run.record, out = []; if (!R) return out;
  const E = recLore(R, run.world.type).entries;
  for (let i = 0; i < R.ids.length && out.length < n; i++) if (!(R.lost & 1 << i)) {
    R.lost |= 1 << i; R.partial &= ~(1 << i); out.push(i);
    msgs && msgs.push({ t: 'loss', text: `[Erasing: ${loreName(E[R.ids[i]])}… done.]` });
  }
  return out;
}
// Restored Hearts bring back the most recently erased entries, not cleanly: each comes back partial
function restoreRecord(run, n, msgs) {
  const R = run.record; let k = 0; if (!R) return 0;
  for (let i = R.ids.length - 1; i >= 0 && k < n; i--) if (R.lost & 1 << i) { R.lost &= ~(1 << i); R.partial |= 1 << i; k++; }
  if (k && msgs) msgs.push({ t: 'sys', text: `[Restoring from backup… ${k} record${k > 1 ? 's' : ''} recovered. Partial.]` });
  return k;
}
// An extra max Heart adds an unused entry at the front of the queue, so it is the next to go. Once every entry the world has is filed (up to REC_MAX), extra Hearts go unrecorded.
function amendRecord(run, msgs, rng) {
  const R = run.record; if (!R || R.ids.length >= REC_MAX) return false;
  const E = recLore(R, run.world.type).entries, unused = loreIds(E).filter(i => !R.ids.includes(i));
  if (!unused.length) return false;
  const low = Math.min(...unused.map(i => TIER_ORDER[E[i].tier]));
  const id = pick(unused.filter(i => TIER_ORDER[E[i].tier] === low), rng);
  let at = 0; while (at < R.ids.length && R.lost & 1 << at) at++;
  const ins = m => (m & ((1 << at) - 1)) | ((m >> at) << (at + 1));
  R.ids.splice(at, 0, id); R.lost = ins(R.lost); R.partial = ins(R.partial);
  msgs && msgs.push({ t: 'sys', text: '[Record amended: 1 entry added.]' });
  return true;
}
// Reading a record. halls: third person for the Halls, which name people without "your".
function recLeft(rec) { let n = 0; rec.ids.forEach((_, p) => { if (!(rec.lost & 1 << p)) n++; }); return n; }
function recWorldGone(rec) { return recLeft(rec) === 0; }
// A partial entry has one or two words of its line barred, picked from the entry index so every device shows the same ones
function partialWords(i, n) { const a = (i * 7 + 3) % n; return n > 6 ? [a, (a + 3) % n] : [a]; }
function recEntries(rec, type, halls) {
  const E = recLore(rec, type).entries;
  return rec.ids.map((i, p) => {
    const e = E[i], lost = !!(rec.lost & 1 << p), partial = !lost && !!(rec.partial & 1 << p);
    const words = e.text.split(' '), bar = partial ? partialWords(i, words.length) : [];
    return { pos: p, i, k: e.k, lost, partial, name: halls && e.k === 'person' ? loreWho(e) : e.name, line: words.map((w, j) => ({ t: w, gone: bar.includes(j) })) };
  });
}
// The bio as text pieces; erased pieces have gone set. champ gives the third-person Halls voice.
function bioParts(rec, type, worldName, champ) {
  const L = recLore(rec, type), E = L.entries, b = rec.bio;
  const gone = i => !!(rec.lost & 1 << rec.ids.indexOf(i));
  const home = E[b.home], who = E[b.person], wgone = recWorldGone(rec);
  const key = home.name.replace(/^The /, '').toLowerCase(), at = home.near.toLowerCase().indexOf(key);
  const cut = at > 0 ? at : home.near.indexOf(' ') + 1; // bar the landmark, keep "in the shadow of"
  const near = [{ t: home.near.slice(0, cut) }, { t: home.near.slice(cut), gone: gone(b.home) }];
  const person = { t: champ ? loreWho(who) : /^Your /.test(who.name) ? loreName(who) : who.name, gone: gone(b.person) };
  const world = { t: worldName, gone: wgone }, role = L.roles[b.role], promise = L.promises[b.promise];
  return champ
    ? [{ t: `${champ} was a ${role} of ` }, world, { t: ', raised ' }, ...near, { t: `. ${champ} swore to ` }, person, { t: ` to ${promise}.` }]
    : [{ t: `You were a ${role} of ` }, world, { t: '. You grew up ' }, ...near, { t: '. You promised ' }, person, { t: ` you would ${promise}.` }];
}
// What a returning Erased champion remembers: the last entry still standing, or else the last one to go
function recFragment(rec, type) {
  const E = recLore(rec, type).entries; let p = -1;
  rec.ids.forEach((_, j) => { if (!(rec.lost & 1 << j)) p = j; });
  if (p < 0) p = rec.ids.length - 1;
  const e = E[rec.ids[p]]; return e.k === 'person' ? loreWho(e) : loreName(e);
}
// Shared records are untrusted: indexes must exist in the pool, masks must fit, and the bio must point into ids
// Layers must name real ones (and a Confluence another type); an unknown layer fails the record rather than dropping words.
function sanitizeRec(r, type) {
  if (!LORE[type] || !r || typeof r !== 'object' || r.w !== type || !Array.isArray(r.ids)) return null;
  const Ls = layersOf(r); if (['f', 'p', 'c'].some(k => r[k] != null && !Ls[k]) || Ls.c === type) return null;
  const L = recLore(Ls, type), ids = r.ids.slice(0, REC_MAX), b = r.bio || {};
  const has = (o, v) => Number.isInteger(v) && o[v] !== undefined;
  const mask = v => Number.isInteger(v) && v >= 0 && v < 1 << ids.length;
  if (!ids.length || !ids.every(i => has(L.entries, i)) || new Set(ids).size !== ids.length || !mask(r.lost) || !mask(r.partial)) return null;
  if (!has(L.roles, b.role) || !has(L.promises, b.promise) || !ids.includes(b.home) || !ids.includes(b.person)) return null;
  return Object.assign({ w: type, ids, lost: r.lost, partial: r.partial, bio: { role: b.role, home: b.home, person: b.person, promise: b.promise } }, Ls);
}

// ---------- Gifts ----------
const SIGILS = ['✦', '☾', '♜', '⚔', '❖', '✠'];
const SIGIL_COLS = ['#d6a04f', '#72d0ff', '#e15b52', '#9fd86a', '#c27ce6', '#efe6d8'];
function giftBudget(world) { return 10 + [4, 3, 2, 1, 0, 0][world.rank]; }
function giftUnlocked(k, meta) { const g = GIFTS[k]; if (!g.lock) return true; if (!meta) return false; if (g.lock === 'echo') return !!meta.unlocks['gift_' + k]; if (g.lock === 'chain') return !!(meta.found && meta.found[k]); return !!meta.titles[g.lock]; }
function giftLockText(k) { const g = GIFTS[k]; if (g.lock === 'echo') return 'Unlock with Echoes'; if (g.lock === 'chain') return 'Found at the end of an event chain'; return 'Earn the Title: ' + TITLES[g.lock].name; }
function giftsAllowed(world) { const wg = WORLD_TYPES[world.type].gift; return Object.keys(GIFTS).filter(k => GIFTS[k].cat !== 'extra' && (GIFTS[k].cat !== 'world' || k === wg)); }
// System Offer: 3 random Gifts cost 1 less, one random cheat costs 2 less.
function makeOffer(world, meta, rng) {
  const pool = giftsAllowed(world).filter(k => giftUnlocked(k, meta) && GIFTS[k].cost >= 2 && !['cheat', 'flaw', 'world'].includes(GIFTS[k].cat));
  const cheats = giftsAllowed(world).filter(k => giftUnlocked(k, meta) && GIFTS[k].cat === 'cheat');
  const o = {}; shuffle(pool, rng).slice(0, 3).forEach(k => o[k] = 1); if (cheats.length) o[pick(cheats, rng)] = 2;
  return o;
}
function giftCost(k, offer) { return GIFTS[k].cost - ((offer && offer[k]) || 0); }
// bonus: Gift Points the System adds while you keep its picks
function giftCheck(world, sel, patron, offer, bonus) {
  const spent = sel.reduce((a, k) => a + giftCost(k, offer), 0);
  const budget = giftBudget(world) + (patron === 'none' ? 2 : 0) + (bonus || 0);
  const cheats = sel.filter(k => GIFTS[k].cat === 'cheat').length, flaws = sel.filter(k => GIFTS[k].cat === 'flaw').length;
  return { spent, budget, left: budget - spent, ok: spent <= budget && cheats <= 1 && flaws <= 2, cheats, flaws };
}
function randomGifts(world, meta, patron, offer, rng, bonus) {
  // "Let the System decide": the world's Gift, maybe a cheat, then fill the budget
  let sel = [WORLD_TYPES[world.type].gift];
  const pool = giftsAllowed(world).filter(k => giftUnlocked(k, meta) && !['world', 'flaw'].includes(GIFTS[k].cat));
  for (const k of shuffle(pool, rng)) { const t = sel.concat(k); if (giftCheck(world, t, patron, offer, bonus).ok) sel = t; }
  return sel;
}
// Letting the System decide pays: SYS_BONUS extra Gift Points while you keep its picks
const SYS_BONUS = 2;
// The stat roll: ROLL_PTS points instead of the usual 4, one stat favoured with 3 of them. Once per Awakening.
const ROLL_PTS = 6;
function rollStats(rng) {
  const s = { STR: 2, AGI: 2, INT: 2, VIT: 2, LUK: 2 };
  s[pick(STATS, rng)] += 3;
  for (let i = 3; i < ROLL_PTS; i++) s[pick(STATS, rng)]++;
  return s;
}

// ---------- Hidden Paths ----------
function pathKey(a, b) { return [a, b].sort().join('+'); }
function hiddenPathOf(counts) {
  const ks = Object.keys(counts).filter(k => counts[k] >= 4);
  let best = null;
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const key = pathKey(ks[i], ks[j]); if (HIDDEN_PATHS[key] && (!best || counts[ks[i]] + counts[ks[j]] > best.n)) best = { key, n: counts[ks[i]] + counts[ks[j]] }; }
  return best ? best.key : null;
}

// ---------- Rounds and Echo unlocks ----------
const ROUNDS = 8;

const UNLOCKS = {
  arch_arcanist: { name: 'Archetype: Arcanist', desc: 'Quick skills and cooldown tricks join the pool.', cost: 20 },
  arch_storm: { name: 'Archetype: Stormcaller', desc: 'Stuns and Interrupts join the pool.', cost: 20 },
  arch_dicer: { name: 'Archetype: Gambler', desc: 'Dice, rerolls and Jackpots join the pool.', cost: 20 },
  arch_jinx: { name: 'Archetype: Jinx', desc: 'Omens, jinxed moves and Curse join the pool.', cost: 20 },
  reroll: { name: 'Extra draft reroll', desc: 'One more reroll at the opening draft.', cost: 15 },
  fourth: { name: 'Fourth world', desc: 'The System offers 4 worlds instead of 3.', cost: 25 },
  purse: { name: 'Heavier purse', desc: 'Start every run with 3 more gold.', cost: 15 },
  gift_gacha: { name: 'Gift: Gacha Luck', desc: 'Cheat skill: a free reroll each round and better shop odds.', cost: 25 },
  gift_latebloomer: { name: 'Gift: Late Bloomer', desc: 'Growth: weaker start, a free stat point each level.', cost: 15 },
  gift_affinity: { name: 'Gift: Skill Affinity', desc: "Growth: your world's home archetype costs 1 less.", cost: 15 },
  gift_haggler: { name: 'Gift: Haggler', desc: 'Fortune: your first purchase each round costs 1 less.', cost: 15 },
};

// ---------- Helpers ----------
function rnd(rng) { return (rng || Math.random)(); }
function pick(arr, rng) { return arr[Math.floor(rnd(rng) * arr.length)]; }
function shuffle(a, rng) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(rng) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function wpick(items, weights, rng) { let t = 0; weights.forEach(w => t += w); let x = rnd(rng) * t; for (let i = 0; i < items.length; i++) { x -= weights[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ---------- Seeded runs (Pending World) ----------
// A run with run.seed draws from named streams instead of Math.random, so everyone playing the same seed gets the same world,
// record, draft, shops, opponents and events. Each call gets a fresh generator keyed by purpose, round and how many times that
// purpose has drawn this round, so a shop reroll never shifts the opponents, and a reloaded save carries on where it left off.
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function seedRng(str) { return mulberry32(hashStr(str)); }
function runRng(run, purpose) {
  run.rngN = run.rngN || {};
  const r = curRound(run), k = purpose + ':' + r, n = run.rngN[k] = (run.rngN[k] || 0) + 1;
  return seedRng(run.seed + ':' + purpose + ':' + r + ':' + n);
}
// The rng to use: the one passed in, else the run's stream for this purpose, else Math.random for a normal run
function stream(run, purpose, rng) { return rng || (run && run.seed ? runRng(run, purpose) : undefined); }
// The game day: the date at UTC+9:30 (a fixed offset, no daylight saving), so each day starts at 14:30 UTC
const DAY_OFFSET = 9.5 * 3600 * 1000;
function dailyDate(now) { return new Date((now == null ? Date.now() : now) + DAY_OFFSET).toISOString().slice(0, 10); }
function dailySeed(date) { return 'wpd:' + date; }
// Pending World days before WORLD_GEN.from keep the world the old generator made, so shipping layered worlds never
// changes a day already under way. SHIP STEP: set from to the game day after the release that ships layered worlds.
const WORLD_GEN = { from: '2026-11-02' };
function dailyWorld(date) { const rng = seedRng(dailySeed(date) + ':world'), w = date >= WORLD_GEN.from ? genWorld(rng) : genWorldV1(rng); if (glitchDay(date)) w.mod = 'corrupted'; return w; }
// w: the day's world (or just its type, for a world without layers)
function dailyRecord(date, w) { return buildRecord(typeof w === 'string' ? w : w.type, seedRng(dailySeed(date) + ':record'), typeof w === 'string' ? null : w); }
// Pending World is a level field: no Echo unlocks (purse, reroll, fourth world, archetypes, Echo Gifts)
function levelMeta(meta) { return Object.assign({}, meta, { unlocks: {} }); }
// Leaderboard score: round reached, then Hearts left, then fewest turns, in one sortable number
function dailyScore(run) {
  const turns = (run.history || []).reduce((a, h) => a + (h.turns || 0), 0);
  const wins = Math.min(12, run.wins || 0), hearts = Math.min(20, Math.max(0, run.hearts)), t = Math.min(999, turns);
  return { wins, hearts, turns: t, score: 100000 * wins + 1000 * hearts + (999 - t) };
}

function newMeta() { return { v: VERSION, echoes: 0, unlocks: {}, archive: { rivals: {}, beat: {}, finals: {}, evos: {}, reactions: {}, paths: {}, hidden: {}, quests: {}, issues: {} }, titles: {}, firsts: {}, found: {}, presets: [], erased: [], champions: [], runs: 0, wins: 0, rank: newRank() }; }
function migrateMeta(m) {
  if (!m) return newMeta();
  if (m.v === VERSION) { const n = Object.assign(newMeta(), m); n.archive = Object.assign(newMeta().archive, m.archive || {}); n.rank = sanitizeRank(m.rank, n); return n; }
  const n = newMeta(); n.echoes = m.echoes || 0; n.runs = m.runs || 0; n.wins = m.wins || 0; return n;
}
function unlockedArch(meta) { return ARCH_KEYS.filter(k => START_ARCH.includes(k) || meta.unlocks['arch_' + k]); }

// ---------- Worlds ----------
// cap: the highest world rank on offer (Entrant Rank gating). Without one, every rank can come up.
const MOD_W = [30, 15, 15, 15, 15];
// The modifiers in the normal draw (MOD_W is theirs, in order). A glitch modifier (Corrupted Save) comes another way
const modKeys = () => Object.keys(MODIFIERS).filter(k => !MODIFIERS[k].glitch);
// A world offer is sometimes a Corrupted Save (never in Pending World, which gets it on Glitch Day)
const CORRUPT_WORLD = 0.05;
const worldRank = (rng, cap) => cap == null ? wpick([0, 1, 2, 3, 4, 5], RANK_W, rng) : wpick([0, 1, 2, 3, 4, 5].slice(0, cap + 1), RANK_W.slice(0, cap + 1), rng);
const pickKey = (o, rng, type) => { const k = Object.keys(o).filter(x => suits(o[x], type)); return k.length ? pick(k, rng) : null; };
// Syllables join cleanly: two vowels meeting lose the second, and no letter appears three times running
function joinName(parts) {
  const n = parts.reduce((a, b) => /[aeiouy]$/i.test(a) && /^[aeiou]/i.test(b) ? a + b.slice(1) : a + b, '').replace(/(.)\1\1/g, '$1$1');
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}
// A start and an end from the type's lists (a Confluence type lends the start), with a middle syllable 1 time in 4
function worldName(T, C, rng) {
  const a = pick((C || T).names[0], rng), mid = T.mids && rnd(rng) < 0.25 ? pick(T.mids, rng) : '', b = pick(T.names[1], rng);
  return joinName([a, mid, b]);
}
// A world (v 2): type, name, rank, its layers, the modifier its Fate brings, and a champion name for the Awakening.
// cap: the highest world rank on offer (Entrant Rank gating). Without one, every rank can come up.
// types: the world types it may pick from (default: all)
function genWorld(rng, cap, only) {
  const types = Object.keys(WORLD_TYPES), type = pick(only || types, rng), T = WORLD_TYPES[type];
  const mix = CONFLUENCE.chance && rnd(rng) < CONFLUENCE.chance ? pick(types.filter(k => k !== type && settingOf(k) === settingOf(type)), rng) || null : null;
  const name = worldName(T, mix && WORLD_TYPES[mix], rng), rank = worldRank(rng, cap);
  const fate = pickKey(FATES, rng, type), people = pickKey(PEOPLES, rng, type), M = fate && FATES[fate].mods;
  const mod = M ? wpick(Object.keys(M), Object.values(M), rng) : wpick(modKeys(), MOD_W, rng);
  const w = { v: 2, type, name, rank, mod, champ: pick(T.champs, rng) };
  if (fate) w.fate = fate; if (people) w.people = people; if (mix) w.mix = mix;
  return w;
}
// The generator before layers, kept for Pending World days before WORLD_GEN.from: the first 6 syllables and names only
function genWorldV1(rng, cap) {
  const type = pick(Object.keys(WORLD_TYPES), rng), T = WORLD_TYPES[type];
  const name = pick(T.names[0].slice(0, 6), rng) + pick(T.names[1].slice(0, 6), rng);
  const rank = worldRank(rng, cap), mod = wpick(modKeys(), MOD_W, rng);
  return { type, name: name.charAt(0).toUpperCase() + name.slice(1), rank, mod, champ: pick(T.champs.slice(0, 6), rng) };
}
// A world's class pool: its home, the home's first two allies on the grid (with the type's guest2 standing in when the
// home has only one) and the type's fixed guest. A Confluence world takes both homes and both guests instead. The home
// always comes; any other class not unlocked yet (or already in) gives way to its nearest free unlocked class: one of
// its allies first, then any. Worlds from before v 2 kept a random fourth class (newRun).
function worldArch(world, U) {
  const T = WORLD_TYPES[world.type], C = world.mix && WORLD_TYPES[world.mix];
  const near = alliesOf(T.home).slice(0, 2), want = C ? [C.home, T.guest, C.guest] : near.concat(near.length < 2 && T.guest2 ? [T.guest2] : [], T.guest);
  const open = unlockedArch({ unlocks: U }), out = [T.home];
  want.forEach(k => {
    const c = [k].concat(alliesOf(k), ARCH_KEYS).find(x => open.includes(x) && !out.includes(x)); if (c) out.push(c);
  });
  return out;
}
// No-repeat memory: meta.recent holds the last RECENT_MAX worlds you fought for (newest first). Offers never repeat one of
// their names or Fate + People pairs, and skip the types of the last RECENT_TYPES where they can. Pending World ignores it.
const RECENT_MAX = 10, RECENT_TYPES = 2;
function staleWorld(meta, w) {
  const R = meta.recent || [];
  if (R.some(r => r.n === w.name || (w.fate && r.f === w.fate && r.p === w.people))) return 2;
  return R.slice(0, RECENT_TYPES).some(r => r.t === w.type) ? 1 : 0;
}
function offerWorlds(meta, rng) {
  const n = meta.unlocks.fourth ? 4 : 3, cap = worldCap(meta), out = [], seen = new Set(); let guard = 0;
  const open = unlockedArch(meta), types = Object.keys(WORLD_TYPES).filter(k => open.includes(WORLD_TYPES[k].home)); // a world whose home class is still locked isn't offered
  while (out.length < n && guard++ < 80) {
    const w = genWorld(rng, cap, types), st = staleWorld(meta, w);
    if (rnd(rng) < CORRUPT_WORLD) w.mod = 'corrupted';
    if ((seen.has(w.type) && guard < 50) || (st === 2 && guard < 70) || (st === 1 && guard < 40)) continue;
    seen.add(w.type); out.push(w);
  }
  return out;
}
// Steer the next world (an Echo sink): pay STEER_COST Echoes to ask the System for one more world on the offer, built
// around the layer you name: a world type, a Fate or a People. Everything else about it is drawn as usual. Only layers
// that can come up for you are listed (a type whose home class is still locked can't). Pending World ignores it.
const STEER_COST = 5;
const STEER_KINDS = { type: 'A kind of world', fate: 'What is going wrong there', people: 'Who lives there' };
function steerTypes(meta) { const open = unlockedArch(meta); return Object.keys(WORLD_TYPES).filter(k => open.includes(WORLD_TYPES[k].home)); }
function steerOptions(meta) {
  const types = steerTypes(meta), fits = L => types.some(t => suits(L, t));
  return { type: types, fate: Object.keys(FATES).filter(k => fits(FATES[k])), people: Object.keys(PEOPLES).filter(k => fits(PEOPLES[k])) };
}
function steerWorld(meta, kind, key, rng) {
  const L = kind === 'fate' ? FATES[key] : kind === 'people' ? PEOPLES[key] : null;
  const types = kind === 'type' ? [key] : steerTypes(meta).filter(t => suits(L, t));
  if (!types.length) return null;
  let w = null;
  for (let i = 0; i < 40 && !(w && w[kind] === key); i++) w = genWorld(rng, worldCap(meta), types);
  if (w[kind] !== key) { // force the asked-for layer onto the last draw; a new Fate brings its own modifier
    w[kind] = key;
    if (kind === 'fate') { const M = FATES[key].mods; w.mod = M ? wpick(Object.keys(M), Object.values(M), rng) : wpick(modKeys(), MOD_W, rng); }
  }
  w.steered = kind;
  return w;
}
// World Pulse: one System line about your world at the start of each round from round 2. In rounds 3 and 5 the Fate's
// trouble grows (its stages); otherwise it is about an entry still standing, and how your last fight went. Words only.
function worldPulse(run, rng) {
  if (!run || run.practice || run.elite || run.round < 2 || !run.record) return null;
  const w = run.world.name, F = FATES[run.world.fate], at = PULSE.stageAt.indexOf(run.round);
  if (F && F.stages && at >= 0 && F.stages[at]) return `[${w}: ${F.stages[at]}]`;
  const last = (run.history || []).slice(-1)[0], left = recEntries(run.record, run.world.type).filter(e => !e.lost);
  if (!last || !left.length) return null;
  const e = pick(left, rng), E = recLore(run.record, run.world.type).entries[e.i];
  return '[' + pick(PULSE[last.won ? 'win' : 'loss'][e.k], rng).replace('{w}', w).replace('{e}', loreName(E)) + ']';
}
// The paired final: the System judges worlds in pairs. Each run's world is paired with another pending world of a
// different type (same setting). In the final you fight for yours against that world's finalist: a player's round-8
// build from a world of that type, carrying its Final Champion's mechanic, or that Final Champion itself when no
// finalist is on file (and always in Pending World and practice). Win, and your world is spared; theirs is not.
function genPair(world, rng) {
  const types = Object.keys(WORLD_TYPES).filter(k => k !== world.type && settingOf(k) === settingOf(world.type));
  if (!types.length) return { type: world.type, name: world.name };
  const type = pick(types, rng); return { type, name: worldName(WORLD_TYPES[type], null, rng) };
}
// Saves from before the paired final have no pair: their final stays their own world's
function pairOf(run) { return run.pair && WORLD_TYPES[run.pair.type] ? run.pair : { type: run.world.type, name: run.world.name }; }
function finalId(run) { return WORLD_TYPES[pairOf(run).type].final; }
function rememberWorld(meta, w) { meta.recent = [{ t: w.type, n: w.name, f: w.fate || null, p: w.people || null }].concat(meta.recent || []).slice(0, RECENT_MAX); }

// ---------- Run ----------
// setup: { name, sigil, color, stats, gifts:[], patron: a GODS id or 'none' }
function newRun(world, setup, meta, rng) {
  bindMeta(meta);
  const U = setup.seed ? {} : meta.unlocks, rs = rng || (setup.seed ? seedRng(setup.seed + ':setup') : undefined);
  const home = WORLD_TYPES[world.type].home;
  const pool = unlockedArch({ unlocks: U }).filter(k => k !== home), allies = pool.filter(k => alliesOf(home).includes(k));
  const others = setup.arch ? setup.arch.filter(k => k !== home).slice(0, 3) : world.v >= 2 ? worldArch(world, U).slice(1) : shuffle(allies, rs).concat(shuffle(pool.filter(k => !allies.includes(k)), rs)).slice(0, 3);
  const chk = giftCheck(world, setup.gifts, setup.patron, setup.offer, setup.sysBonus);
  const G = setup.gifts;
  const run = {
    v: VERSION, world, name: setup.name, sigil: setup.sigil || 0, color: setup.color || 0, champ: setup.name + ' of ' + world.name,
    stats: Object.assign({}, setup.stats), statPts: 0, level: 1, bought: 0, notice: 0,
    gold: Math.max(0, chk.left) * 3 + (U.purse ? 3 : 0) + (G.includes('veteran') ? 6 : 0),
    gifts: setup.gifts.slice(), patron: setup.patron, arch: [home].concat(others),
    favour: godZeros(), gifted: godZeros(),
    slots: setup.gifts.includes('prodigy') ? 5 : 4, bar: [], gear: { weapon: null, armour: null, accessory: null }, bench: [], uid: 0,
    shop: null, locks: null, bonusSlot: null, merges: setup.gifts.includes('merger') ? 3 : 0,
    round: 1, losses: 0, elite: false, eliteIdx: 0, wins: 0, eliteWins: 0, hearts: 10, maxHearts: 10,
    pending: [], log: [], hp: 0, ended: false, stage: 'draft', rerolls: 1 + (U.reroll ? 1 : 0) + (G.includes('veteran') ? 1 : 0), draft: [],
    met: [], choices: null, chosen: null, wager: null, wagerOn: false, districts: [], scouted: false, nextFlags: {}, usedRewind: false, usedBreath: false, path: null, history: [],
    title: setup.title && meta.titles[setup.title] ? setup.title : null, hiddenPath: null, milestones: {}, chains: {}, quests: [], wagersWon: 0, freeRerolls: 0, haggle: false,
    entrant: 100 + (meta.runs || 0) * 7 + Math.floor(rnd(rs) * 7), extraGiven: false, earned: [], picks: [], t0: Date.now(),
  };
  // Its own stream, so pairing never shifts the draft, shops or opponents (a sim's rng keys it by the world)
  run.pair = genPair(world, setup.seed ? seedRng(setup.seed + ':pair') : rng ? seedRng('pair:' + world.type + ':' + world.name) : undefined);
  if (setup.seed) Object.assign(run, { seed: setup.seed, daily: setup.daily || null, ranked: !!setup.ranked, rngN: {} });
  if (G.includes('bornlucky')) run.stats.LUK += 2;
  if (G.includes('latebloomer')) STATS.forEach(k => run.stats[k] = Math.max(1, run.stats[k] - 1));
  // Opening stat points: placed after the opening draft, once the skills and gear are known (placeStartStats).
  // floor: the stats before any are placed, Gifts included; rollSeed: where the once-only roll comes from.
  if (setup.startPts) Object.assign(run, { startPts: setup.startPts, statFloor: Object.assign({}, run.stats), rollSeed: setup.seed ? setup.seed + ':roll' : setup.rollSeed || 'roll:' + world.name, rolled: false, rollUsed: false });
  // System quests: two visible, every hidden one quietly active. In a world with a Fate or People that has a quest
  // (quests.js, fate: / people:), those quests are shown too, on top of one general quest
  const fair = k => [].concat(QUESTS[k].feat).every(f => featFair(run, f));
  const local = Object.keys(QUESTS).filter(k => (QUESTS[k].fate && QUESTS[k].fate === world.fate) || (QUESTS[k].people && QUESTS[k].people === world.people)).filter(fair);
  const taken = local.map(k => [].concat(QUESTS[k].feat).join('+'));
  const vis = shuffle(Object.keys(QUESTS).filter(k => !QUESTS[k].hidden && !QUESTS[k].fate && !QUESTS[k].people && fair(k) && !taken.includes([].concat(QUESTS[k].feat).join('+'))), rs).slice(0, local.length ? 1 : 2).concat(local);
  run.quests = vis.concat(Object.keys(QUESTS).filter(k => QUESTS[k].hidden)).map(id => ({ id, prog: 0, done: false, failed: false }));
  run.bar = new Array(run.slots).fill(null);
  if (setup.script) { run.quests = []; run.script = setup.script; run.practice = true; run.practiceRounds = setup.script.rounds || 3; run.gold += setup.script.gold || 0; }
  else { run.record = setup.record ? JSON.parse(JSON.stringify(setup.record)) : buildRecord(world.type, rng, world); run.log.push({ t: 'sys', text: `[Filing world record: ${world.name}. ${run.record.ids.length} entries.]` }); }
  if (setup.patron && setup.patron !== 'none') run.favour[setup.patron] = 2;
  // Entrant Rank: promotion perks and a waiting Rank Trial. Pending World and practice runs use neither.
  run.perks = [];
  if (!setup.seed && !run.practice) rememberWorld(meta, world);
  if (!setup.seed && !run.practice && meta.rank) {
    run.perks = meta.rank.perks.filter(k => PERKS[k]);
    if (run.perks.includes('stipend')) run.gold += 1;
    if (run.perks.includes('redraft')) run.rerolls += 1;
    if (run.perks.includes('patron') && run.patron && run.patron !== 'none') run.favour[run.patron] += 1;
    if (meta.rank.trial) run.trial = { to: meta.rank.trial, round: TRIAL_ROUND[meta.rank.trial], done: false };
  }
  run.draft = rollDraft(run, stream(run, 'draft', rng));
  run.gearDraft = rollGearDraft(run, stream(run, 'gearDraft', rng));
  // Divine Gifts were marked before the Silence, so they arrive even in a Silence world
  run.chosenNow = true;
  Object.keys(GODS).forEach(g => { if (G.includes('chosen_' + g)) addFavour(run, g, Math.max(0, 4 - run.favour[g]), meta, run.log, stream(run, 'loot', rng)); });
  delete run.chosenNow;
  run.hp = maxHp(run);
  return run;
}
function hasGift(run, k) { return run.gifts && run.gifts.includes(k); }
function effStats(run) {
  const s = Object.assign({}, run.stats);
  GEAR_SLOTS.forEach(sl => { const g = run.gear[sl]; if (g) Object.entries(gearStats(g.id, g.star)).forEach(([k, v]) => s[k] += v); });
  STATS.forEach(k => s[k] = Math.max(0, s[k]));
  return s;
}
function hpMult(gifts) { let m = 1; if (gifts.includes('dragon')) m *= 1.15; if (gifts.includes('prodigy')) m *= 0.9; if (gifts.includes('glass')) m *= 0.8; if (gifts.includes('f_glass')) m *= 0.8; return m; }
function maxHp(run) { const s = effStats(run); return Math.round((40 + s.VIT * 8 + s.STR * 5 + run.level * 4 + (hasPerk(run, 'frame') ? 8 : 0)) * hpMult(run.gifts) * (1 - (run.hpCut || 0))); }
// Levels come from fighting: after every battle (win or lose) the System offers a level, which is +1 level (Max HP +4,
// better shop odds) and +1 stat point, or a Gift drawn at random in its place. Level stops at LEVEL_MAX.
// Stat points can also be bought with gold, one at a time, at a rising price (Train). Bought points never raise the level.
const POINT_PRICE = [1, 1, 2, 2, 3, 3, 5, 5, 7, 7, 10, 10, 13, 13, 16];
const LEVEL_MAX = 9;
function pointPrice(run) { const p = POINT_PRICE[Math.min(run.bought || 0, POINT_PRICE.length - 1)]; return hasGift(run, 'fastlearner') ? Math.max(1, Math.ceil(p * 0.67)) : p; }
function trainStat(run, k, msgs) {
  if (!STATS.includes(k)) return false;
  const pr = pointPrice(run); if (run.gold < pr) return false;
  const before = maxHp(run);
  run.gold -= pr; run.stats[k]++; run.bought = (run.bought || 0) + 1;
  run.hp += maxHp(run) - before;
  if (run.milestones) checkMilestones(run, msgs);
  return true;
}
function midGiftPool(run) {
  const M = run.seed && META ? levelMeta(META) : META;
  return Object.keys(GIFTS).filter(k => ['growth', 'combat', 'fortune', 'bloodline'].includes(GIFTS[k].cat) && !hasGift(run, k) && giftUnlocked(k, M) && !['latebloomer', 'veteran'].includes(k));
}
// The perk offered in place of a level (LEVEL_PERKS in levels.js): one at random from those that would do something now,
// never one already offered this run while a fresh one fits
function levelPerk(run, rng) { const t = run.fateTrack || 0, x = { maxHp: maxHp(run), fateOpen: !!FATES[run.world.fate] && t > FATE_TRACK.min && t < FATE_TRACK.max, noticeRoom: !run.noticeOff && (run.notice || 0) < TUNE.noticeMax }, pool = Object.keys(LEVEL_PERKS).filter(k => { const L = LEVEL_PERKS[k]; return (!L.when || L.when(run, x)) && !(L.then && L.then.piece && !poolIds(run).some(id => pieceDef(id).rank === L.then.piece)); }); const fresh = pool.filter(k => !(run.perksShown || []).includes(k)), k = pick(fresh.length ? fresh : pool, rng); if (k) run.perksShown = (run.perksShown || []).concat(k); return k || null; }
function levelPerkOutcomes(run, k) {
  const L = LEVEL_PERKS[k], T = Object.assign({}, L.then);
  if (L.main) { const st = ARCH[run.arch[0]].stat; T.stats = Object.assign({}, T.stats, { [st]: L.main }); }
  if (L.patron && GODS[run.patron]) T.favour = { [run.patron]: L.patron };
  return T;
}
function levelPerkText(run, k) { if (LEVEL_PERKS[k].say) return LEVEL_PERKS[k].say; const t = outcomeText(levelPerkOutcomes(run, k)); return t.charAt(0).toUpperCase() + t.slice(1) + '.'; }
function offerLevel(run, rng) {
  if (run.elite || run.level >= LEVEL_MAX || run.pending.some(p => p.type === 'levelup')) return;
  run.pending.push({ type: 'levelup', perk: levelPerk(run, rng) });
}
// Take the level (choice 'level') or the Gift shown in its place (choice 'perk')
function takeLevel(run, choice, msgs) {
  const i = run.pending.findIndex(p => p.type === 'levelup'); if (i < 0) return false;
  const p = run.pending[i];
  if (choice === 'perk' && LEVEL_PERKS[p.perk]) {
    run.pending.splice(i, 1);
    msgs = msgs || [];
    msgs.push({ t: 'class', text: `[Level declined. Perk issued: ${LEVEL_PERKS[p.perk].name}.]` });
    const before = maxHp(run), T = levelPerkOutcomes(run, p.perk), ctx = { run, h: eventKit(run, META, stream(run, 'loot'), msgs), msgs, label: LEVEL_PERKS[p.perk].name };
    applyOutcomes(T, ctx, false); applyOutcomes(T, ctx, true);
    if (T.stats) { run.hp += maxHp(run) - before; checkMilestones(run, msgs); }
    return true;
  }
  run.pending.splice(i, 1);
  const before = maxHp(run);
  run.level = Math.min(LEVEL_MAX, run.level + 1); run.statPts++;
  if (hasGift(run, 'latebloomer')) run.statPts++;
  run.hp += maxHp(run) - before;
  msgs && msgs.push({ t: 'level', text: `[Level ${run.level}. +1 stat point${hasGift(run, 'latebloomer') ? ', +1 from Late Bloomer' : ''}. Shop odds improved.]` });
  return true;
}

// ---------- Pool and shop ----------
const ODDS = [[70, 25, 5, 0, 0], [45, 35, 17, 3, 0], [25, 35, 28, 10, 2], [15, 25, 32, 20, 8]];
function oddsFor(run) { const l = run.level + (hasGift(run, 'lucky') ? 1 : 0) + (hasGift(run, 'gacha') ? 1 : 0); return ODDS[l >= 7 ? 3 : l >= 5 ? 2 : l >= 3 ? 1 : 0]; }
function poolIds(run) {
  const maxed = new Set(allPieces(run).filter(p => p.star >= 3).map(p => baseId(p.id)));
  const ids = SHOP_SKILLS.concat(Object.keys(GEAR).filter(k => !GEAR[k].glitch));
  return ids.filter(id => pieceDef(id).tags.some(t => run.arch.includes(t)) && !maxed.has(id));
}
function rollPiece(run, rng, opts = {}) {
  let pool = poolIds(run);
  if (opts.kind === 'skill') pool = pool.filter(id => !isGear(id));
  if (opts.kind === 'gear') pool = pool.filter(id => isGear(id));
  if (!pool.length) return null;
  const odds = opts.odds || oddsFor(run);
  let r = wpick([0, 1, 2, 3, 4], odds, rng);
  const ranks = ['E', 'D', 'C', 'B', 'A'];
  for (let k = 0; k < 5; k++) {
    const want = ranks[clamp(r - k, 0, 4)];
    const c = pool.filter(id => pieceDef(id).rank === want);
    if (c.length) { const id = wpick(c, c.map(x => isGear(x) ? 0.75 : 1), rng); return { id: !glitchesOn(run) ? id : isGear(id) ? glitchGear(id, pool, rng, glitchMul(run)) : glitchSkill(id, rng, glitchMul(run)), mods: !isGear(id) && rnd(rng) < 0.12 ? rollPrefixes(1, rng, id) : [] }; }
  }
  return null;
}
// Now and then a gear offer comes up glitched (where glitches are on): Spliced with another gear piece from the pool, or
// MissingNo. GLITCH_GEAR is the chance per gear offer.
const GLITCH_GEAR = 0.06;
function glitchGear(id, pool, rng, mul) {
  if (rnd(rng) >= GLITCH_GEAR * (mul || 1)) return id;
  if (rnd(rng) < 0.3) return 'missingno';
  const other = pick(pool.filter(x => isGear(x) && x !== id && !GEAR[x].glitch), rng);
  return other && spliceGear(spliceId(id, other)) ? spliceId(id, other) : id;
}
// A skill offer comes up glitched with GLITCH_SKILL chance: an Unstable copy of it when it has two evolutions, else Error
// or Stack Overflow (js/content/skills/glitched.js)
const GLITCH_SKILL = 0.04;
// Traits from the pool for an opponent: n normal ones (not in have). Where glitches are on, the last one is sometimes a
// glitched trait instead. Glitched traits never enter the normal draw, so Pending World draws exactly as before
const GLITCH_TRAIT = 0.15;
const WORLD_TRAIT = 0.35;
function rollTraits(run, n, rng, have) {
  have = have || [];
  const out = shuffle(Object.keys(TRAIT_POOL).filter(k => !TRAIT_POOL[k].glitch && !TRAIT_POOL[k].world && !have.includes(k)), rng).slice(0, n);
  // The world's own trait (traits.js, world:) sometimes takes the first slot
  const wt = Object.keys(TRAIT_POOL).find(k => TRAIT_POOL[k].world === run.world.type && !have.includes(k));
  if (out.length && wt && rnd(rng) < WORLD_TRAIT) out[0] = wt;
  if (out.length && glitchesOn(run) && rnd(rng) < GLITCH_TRAIT * glitchMul(run)) {
    const g = Object.keys(TRAIT_POOL).filter(k => TRAIT_POOL[k].glitch && !have.includes(k));
    if (g.length) out[out.length - 1] = pick(g, rng);
  }
  return out;
}
function glitchSkill(id, rng, mul) {
  if (rnd(rng) >= GLITCH_SKILL * (mul || 1)) return id;
  if (SKILLS[id].evo && rnd(rng) < 0.6 && unstableSkill('u_' + id)) return 'u_' + id;
  return rnd(rng) < 0.5 ? 'error_skill' : 'stack_overflow';
}
// Register the Spliced gear and Unstable skills a saved run holds (Spliced pieces are made on demand, so a reload has to make them again)
function registerGlitchGear(run) {
  if (!run) return;
  const ids = allPieces(run).map(p => p.id).concat(run.shop ? SHOP_KINDS.flatMap(k => (run.shop[k] || []).filter(Boolean).map(x => x.id)) : [], run.bonusSlot ? [run.bonusSlot.id] : []);
  if (run.phantom) ids.push(run.phantom.id);
  ids.forEach(id => { if (typeof id === 'string' && id.startsWith('x_')) spliceGear(id); if (typeof id === 'string' && id.startsWith('u_')) unstableSkill(id); });
}
// MissingNo.: its passive is another (unglitched) gear piece's, rolled when it arrives and after every fight
function rollMissing(p, rng) { p.roll = pick(Object.keys(GEAR).filter(k => !GEAR[k].glitch), rng); }
function price(run, item) {
  let v = PRICE[pieceDef(item.id).rank] + (item.mods ? item.mods.length : 0) + (hasGift(run, 'f_cursed') ? 1 : 0);
  if (hasGift(run, 'affinity') && pieceDef(item.id).tags.includes(run.arch[0])) v = Math.max(1, v - 1);
  if (run.haggle) v = Math.max(0, v - 1);
  return v;
}
function sellValue(p) { return (PRICE[pieceDef(baseId(p.id)).rank] || 1) * [0, 1, 3, 9][p.star] + (p.mods ? p.mods.length : 0); }
// Two shops: skills and gear, 5 slots each, each with its own reroll and locks.
const SHOP_KINDS = ['skill', 'gear'];
function ensureShop(run) {
  if (!run.shop || Array.isArray(run.shop)) run.shop = { skill: [null, null, null, null, null], gear: [null, null, null, null, null] };
  if (!run.locks || Array.isArray(run.locks)) run.locks = { skill: [false, false, false, false, false], gear: [false, false, false, false, false] };
}
function refreshShop(run, rng, kind) {
  ensureShop(run);
  const script = run.script && run.script.shops && run.script.shops[(run.visit || 1) - 1];
  (kind ? [kind] : SHOP_KINDS).forEach(k => {
    for (let i = 0; i < 5; i++) if (!run.locks[k][i] || !run.shop[k][i]) {
      const sid = script && !kind && script[k] && script[k][i];
      run.shop[k][i] = sid ? { id: sid, mods: [] } : rollPiece(run, rng, { kind: k }); run.locks[k][i] = false;
    }
  });
}
function rerollCost(run) { return run.freeRerolls > 0 ? 0 : (hasGift(run, 'f_unlucky') ? 3 : 2) - (customOf(run, 'league') ? 1 : 0); }
function reroll(run, rng, kind) { const c = rerollCost(run); if (run.gold < c) return false; if (c === 0) run.freeRerolls--; else run.gold -= c; refreshShop(run, stream(run, 'shop', rng), kind || 'skill'); return true; }
function shopItem(run, kind, i) { ensureShop(run); return kind === 'bonus' ? run.bonusSlot : run.shop[kind][i]; }
function ownedCopies(run, id) { return allPieces(run).filter(p => p.id === id && p.star === 1).length; }
// Income: INCOME.base a round, plus interest of 1 for every INCOME.per gold held, up to the cap. Saving is a real choice:
// a full bank (20 gold) earns as much as the base income again.
const INCOME = { base: 5, per: 4, cap: 5, golden: 8 };
function interestCap(run) { return (hasGift(run, 'golden') ? INCOME.golden : INCOME.cap) + (hasPerk(run, 'ledger') ? 1 : 0); }
function interestOf(run) { return Math.min(interestCap(run), Math.floor(run.gold / INCOME.per)); }
function income(run) { return INCOME.base + interestOf(run) + (run.world.mod === 'golden' ? 2 : 0); }
function allPieces(run) { return run.bar.filter(Boolean).concat(GEAR_SLOTS.map(s => run.gear[s]).filter(Boolean), run.bench); }
function findPiece(run, u) {
  let i = run.bar.findIndex(p => p && p.u === u); if (i >= 0) return { p: run.bar[i], at: 'bar', i };
  for (const s of GEAR_SLOTS) if (run.gear[s] && run.gear[s].u === u) return { p: run.gear[s], at: 'gear', slot: s };
  i = run.bench.findIndex(p => p.u === u); if (i >= 0) return { p: run.bench[i], at: 'bench', i };
  return null;
}
function mergeNeed(run, id) { if (run.merges > 0) return 2; if (isGear(id) && hasGift(run, 'runesmith')) return 2; return 3; }
function wouldMerge(run, id) { const have = allPieces(run).filter(p => p.id === id && p.star === 1).length; return have + 1 >= mergeNeed(run, id); }
function canBuy(run, item) { return item && run.gold >= price(run, item) && (run.bench.length < 8 || wouldMerge(run, item.id) || hasFreeSlot(run, item.id)); }
function hasFreeSlot(run, id) { return isGear(id) ? !run.gear[GEAR[id].slot] : run.bar.includes(null); }
function addPiece(run, id, mods, msgs, star) {
  const p = { u: ++run.uid, id, star: star || 1, mods: (mods || []).slice() };
  if (GEAR[id] && GEAR[id].rolling) rollMissing(p, stream(run, 'loot'));
  if (isGear(id) && !GEAR[id].consumable && !run.gear[GEAR[id].slot]) run.gear[GEAR[id].slot] = p;
  else if (!isGear(id) && run.bar.includes(null)) run.bar[run.bar.indexOf(null)] = p;
  else run.bench.push(p);
  checkMerges(run, msgs);
  checkPath(run, msgs);
  return p;
}
function buy(run, kind, i, msgs) {
  const item = shopItem(run, kind, i);
  if (!canBuy(run, item)) return false;
  run.gold -= price(run, item); run.haggle = false;
  if (kind === 'bonus') run.bonusSlot = null; else { run.shop[kind][i] = null; run.locks[kind][i] = false; }
  addPiece(run, item.id, item.mods, msgs);
  if (pieceDef(item.id).glitch) { msgs && msgs.push({ t: 'skill', text: `[Glitched item acquired: ${pieceDef(item.id).name}. ${pieceDef(item.id).flavour}]` }); OUTCOME_APPLY.notice(1, { run, msgs: msgs || [] }); }
  return true;
}
function removePiece(run, u) {
  const f = findPiece(run, u); if (!f) return null;
  if (f.at === 'bar') run.bar[f.i] = null; else if (f.at === 'gear') run.gear[f.slot] = null; else run.bench.splice(f.i, 1);
  return f.p;
}
function sell(run, u) { const p = removePiece(run, u); if (!p) return 0; const v = sellValue(p) + (customOf(run, 'league') ? 1 : 0); if (customOf(run, 'league')) customPaid(run); run.gold += v; run.hp = Math.max(1, Math.min(run.hp, maxHp(run))); return v; }
function checkMerges(run, msgs) {
  let guard = 0;
  while (guard++ < 10) {
    const groups = {};
    allPieces(run).forEach(p => { if (p.star < 3 && !(SKILLS[p.id] && SKILLS[p.id].base)) { const k = p.id + '|' + p.star; (groups[k] = groups[k] || []).push(p); } });
    const hit = Object.values(groups).find(g => g.length >= mergeNeed(run, g[0].id));
    if (!hit) return;
    const need = mergeNeed(run, hit[0].id);
    const parts = hit.slice().sort((a, b) => rankLoc(run, a) - rankLoc(run, b)).slice(0, need);
    const keep = parts[0];
    const mods = [], corrupt = parts.some(p => p.corrupt), cap = corrupt ? MAX_MODS_CORRUPT : MAX_MODS;
    parts.forEach(p => p.mods.forEach(m => { if (!mods.some(o => bareMod(o) === bareMod(m)) && mods.length < cap) mods.push(m); }));
    parts.slice(1).forEach(p => removePiece(run, p.u));
    keep.star++; keep.mods = mods; if (corrupt) keep.corrupt = true;
    if (run.merges > 0) run.merges--;
    msgs && msgs.push({ t: 'merge', text: `[Merge! ${pieceDef(keep.id).name} is now ★${keep.star}.]` });
    questEvent(run, 'merge', {}, msgs);
    if (keep.star === 3) worldFirst(run, 'star3', `has forged a ★3 piece: ${pieceDef(keep.id).name}.`, 'ascendant', msgs);
    if (keep.star === 3 && SKILLS[keep.id] && SKILLS[keep.id].evo) { run.pending.push({ type: 'evo', u: keep.u }); msgs && msgs.push({ t: 'skill', text: `[${SKILLS[keep.id].name} has reached ★3. Evolution available.]` }); }
  }
}
function rankLoc(run, p) { const f = findPiece(run, p.u); return f.at === 'bar' || f.at === 'gear' ? 0 : 1; }
function evolve(run, u, evoId, meta) {
  const f = findPiece(run, u); if (!f) return false;
  const from = f.p.id; f.p.id = evoId; f.p.mods = f.p.mods.filter(m => prefixOk(evoId, m, []));
  if (meta) meta.archive.evos[from + '>' + evoId] = true;
  run.pending = run.pending.filter(p => !(p.type === 'evo' && p.u === u));
  return true;
}
// Choose a Path evolution (i: 0 keeps tier 3 as written, 1 the alternative)
function advance(run, k, i) {
  if (!ADVANCE[k] || !ADVANCE[k][i]) return false;
  run.adv = run.adv || {}; run.adv[k] = i;
  run.pending = run.pending.filter(p => !(p.type === 'adv' && p.arch === k));
  return true;
}
// Move a piece to a destination: { bar: i } | { gear: slot } | 'bench'
function movePiece(run, u, dest, msgs) {
  const src = findPiece(run, u); if (!src) return false;
  if (src.at === 'gear' && dest !== 'bench') return false;
  if (dest !== 'bench' && GEAR[src.p.id] && GEAR[src.p.id].consumable) return false; // used, never equipped
  const p = src.p, hpFrac = run.hp / maxHp(run);
  if (dest === 'bench') { if (src.at === 'bench') return false; if (run.bench.length >= 8) return false; removePiece(run, u); run.bench.push(p); }
  else if (dest.bar != null) {
    if (isGear(p.id)) return false;
    const occ = run.bar[dest.bar];
    if (src.at === 'bar') { run.bar[src.i] = occ; run.bar[dest.bar] = p; }
    else { removePiece(run, u); run.bar[dest.bar] = p; if (occ) run.bench.splice(src.i, 0, occ); }
  } else if (dest.gear) {
    if (!isGear(p.id) || GEAR[p.id].slot !== dest.gear) return false;
    const occ = run.gear[dest.gear];
    removePiece(run, u); run.gear[dest.gear] = p; if (occ) run.bench.splice(src.at === 'bench' ? src.i : run.bench.length, 0, occ);
  }
  run.hp = Math.max(1, Math.min(maxHp(run), Math.round(maxHp(run) * hpFrac)));
  checkPath(run, msgs);
  return true;
}
function equipBest(run, u) {
  const f = findPiece(run, u); if (!f || f.at !== 'bench') return false;
  if (isGear(f.p.id)) return movePiece(run, u, { gear: GEAR[f.p.id].slot });
  const e = run.bar.indexOf(null); return movePiece(run, u, { bar: e >= 0 ? e : 0 });
}

// ---------- Archetype counts, passives ----------
function archCounts(barPieces, gearPieces, gifts) {
  const seen = new Set(), c = {};
  barPieces.concat(gearPieces).filter(Boolean).forEach(p => {
    const b = baseId(p.id); if (seen.has(b)) return; seen.add(b);
    const tags = pieceDef(b).tags.slice();
    // Misfiled: the skill also counts as its class's allies on the grid
    if ((p.mods || []).some(m => bareMod(m) === 'misfiled') && tags.length) themeNear(tags[0]).forEach(t => { if (!tags.includes(t)) tags.push(t); });
    tags.forEach(t => c[t] = (c[t] || 0) + 1);
  });
  if (gifts && gifts.includes('monarch')) Object.keys(c).forEach(k => c[k]++);
  (gifts || []).forEach(g => { if (GIFTS[g] && GIFTS[g].arch && c[GIFTS[g].arch]) c[GIFTS[g].arch]++; });
  return c;
}
// The gear that counts: the three slots, plus a Phantom piece (a glitch event's copy that takes no slot)
function runGear(run) { return GEAR_SLOTS.map(s => run.gear[s]).concat(run.phantom && GEAR[run.phantom.id] ? [run.phantom] : []); }
function runCounts(run) { return archCounts(run.bar, runGear(run), run.gifts); }
let META = null;
function bindMeta(m) { META = m; }
// Other players' champions (set by the page from the shared store). Each snap carries .owner.
const SHARED = { erased: [], spared: [] };
function setShared(erased, spared) { SHARED.erased = erased || []; SHARED.spared = spared || []; }
// Shared records are untrusted: keep only known pieces and clamp everything to what a real run can reach.
function sanitizeSnap(x, owner) {
  if (!x || typeof x !== 'object') return null;
  const str = (v, n) => String(v == null ? '' : v).slice(0, n);
  const num = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? clamp(Math.round(v), a, b) : d; };
  const bar = (Array.isArray(x.bar) ? x.bar : []).slice(0, 5).filter(p => p && typeof p.id === 'string' && (SKILLS[p.id] || unstableSkill(p.id)) && !SKILLS[p.id].basic).map(p => ({ id: p.id, star: num(p.star, 1, 3, 1), mods: (Array.isArray(p.mods) ? p.mods : []).filter(m => typeof m === 'string' && PREFIXES[m] && !PREFIXES[m].player).map(bareMod).filter(m => !PREFIXES[m].player).slice(0, MAX_MODS_CORRUPT) }));
  const gear = (Array.isArray(x.gear) ? x.gear : []).slice(0, 3).filter(p => p && typeof p.id === 'string' && (GEAR[p.id] || spliceGear(p.id))).map(p => ({ id: p.id, star: num(p.star, 1, 3, 1), roll: p.roll && GEAR[p.roll] && !GEAR[p.roll].glitch ? p.roll : undefined }));
  const stats = {}; STATS.forEach(k => stats[k] = num(x.stats && x.stats[k], 0, 30, 2));
  const gifts = (Array.isArray(x.gifts) ? x.gifts : []).filter(k => GIFTS[k] && GIFTS[k].cat !== 'flaw').slice(0, 10);
  const ms = {}; STATS.forEach(k => { if (x.milestones && x.milestones[k] && stats[k] >= 10) ms[k] = true; });
  const history = (Array.isArray(x.history) ? x.history : []).slice(0, 12).map(h => ({ round: num(h.round, 1, 12, 1), name: str(h.name, 40), won: !!h.won, turns: num(h.turns, 1, 99, 1), hl: num(h.hl, 0, 9, 0), kind: str(h.kind, 10), dealt: num(h.dealt, 0, 99999, 0) }));
  return {
    champ: str(x.champ, 60) || 'Nameless', name: str(x.name, 20), sigil: num(x.sigil, 0, 5, 0), color: num(x.color, 0, 5, 0), worldName: str(x.worldName, 30), worldType: WORLD_TYPES[x.worldType] ? x.worldType : 'drowned',
    worldFate: FATES[x.worldFate] ? x.worldFate : null, worldPeople: PEOPLES[x.worldPeople] ? x.worldPeople : null, worldMix: LORE[x.worldMix] && x.worldMix !== x.worldType ? x.worldMix : null,
    path: ARCH[x.path] ? x.path : null, stats, level: num(x.level, 1, 9, 1), maxHp: num(x.maxHp, 20, 700, 80), round: num(x.round, 1, 8, 1), gifts, title: TITLES[x.title] ? x.title : null, milestones: ms,
    bar, gear, history, cause: str(x.cause, 60) || null, hearts: num(x.hearts, 0, 20, 0), maxHearts: num(x.maxHearts, 1, 20, 10), wins: num(x.wins, 0, 20, 0), elite: num(x.elite, 0, 4, 0), entrant: num(x.entrant, 0, 99999, 0),
    hiddenPath: HIDDEN_PATHS[x.hiddenPath] ? x.hiddenPath : null, at: num(x.at, 0, 1e15, 0), owner: owner || null, shared: !!owner,
    rec: sanitizeRec(x.rec, x.worldType),
    rank: rankIdx(x.rank) >= 0 ? x.rank : null, rp: num(x.rp, 0, 1e6, 0), kills: num(x.kills, 0, 9999, 0),
  };
}
function earnTitle(run, id, msgs) {
  if (!META || META.titles[id] || (run && run.practice)) return false;
  META.titles[id] = true;
  msgs && msgs.push({ t: 'class', text: `[Title acquired: ${TITLES[id].name}. ${TITLES[id].desc}]` });
  const g = Object.keys(GIFTS).find(k => GIFTS[k].lock === id);
  if (g) msgs && msgs.push({ t: 'class', text: `[New Gift unlocked in the library: ${GIFTS[g].name}.]` });
  if (run && !run.title) { run.title = id; msgs && msgs.push({ t: 'class', text: `[Title equipped: ${TITLES[id].name}.]` }); }
  return true;
}
function worldFirst(run, key, text, titleId, msgs) {
  if (!META || META.firsts[key] || (run && run.practice)) return false;
  META.firsts[key] = true;
  msgs && msgs.push({ t: 'broadcast', text: `[World First! Entrant ${run ? run.entrant : '?'} ${text}]` });
  if (titleId) earnTitle(run, titleId, msgs);
  return true;
}
function checkPath(run, msgs) {
  const c = runCounts(run);
  // Path evolution: the first time an archetype reaches 6, choose its advanced class (kept for the run)
  ARCH_KEYS.forEach(k => {
    if ((c[k] || 0) < 6 || !ADVANCE[k] || (run.adv && run.adv[k] != null) || run.pending.some(p => p.type === 'adv' && p.arch === k)) return;
    run.pending.push({ type: 'adv', arch: k }); msgs && msgs.push({ t: 'class', text: `[${ARCH[k].path}: 6 pieces. The Path can evolve. Choose what it becomes.]` });
  });
  const top = Object.keys(c).filter(k => c[k] >= 4).sort((a, b) => c[b] - c[a])[0];
  if (top && run.path !== top) { run.path = top; msgs && msgs.push({ t: 'class', text: `[Path recognised: ${ARCH[top].path}.]` }); questEvent(run, 'path', {}, msgs); }
  if (!top) run.path = null;
  const hp = hiddenPathOf(c);
  if (hp && run.hiddenPath !== hp) {
    run.hiddenPath = hp; const H = HIDDEN_PATHS[hp];
    msgs && msgs.push({ t: 'class', text: `[Hidden Path unlocked: ${H.name}. ${H.desc}]` });
    if (META) META.archive.hidden[hp] = true;
    worldFirst(run, 'hidden', `has walked a Hidden Path: ${H.name}.`, 'pathfinder', msgs);
  }
  if (!hp) run.hiddenPath = null;
  if (run.milestones) checkMilestones(run, msgs);
}
// Stat milestones at 10
const MILESTONES = {
  STR: { name: 'Mighty Frame', desc: 'Reaper and Stormcaller skills deal 10% more.', p: { mighty: 0.1 } },
  AGI: { name: 'Afterimage', desc: 'Evade the first attack each fight.', p: { firstEvade: 1 } },
  INT: { name: 'Arcane Mind', desc: 'Your first damaging skill each fight deals 30% more.', p: { firstHit: 0.3 } },
  VIT: { name: 'Iron Constitution', desc: '+1 max Heart.' },
  LUK: { name: "Fortune's Favourite", desc: 'One free reroll every round.' },
};
function checkMilestones(run, msgs) {
  const s = effStats(run);
  STATS.forEach(k => {
    if (s[k] >= 10 && !run.milestones[k]) {
      run.milestones[k] = true;
      msgs && msgs.push({ t: 'level', text: `[Stat milestone: ${k} 10. ${MILESTONES[k].name}: ${MILESTONES[k].desc}]` });
      if (k === 'VIT') { run.maxHearts++; run.hearts++; amendRecord(run, msgs, stream(run, 'record')); }
      if (k === 'LUK') run.freeRerolls++;
    }
  });
}
// P: every passive modifier the combat engine reads.
// x: { title, stats (effective), milestones }
function buildP(barPieces, gearPieces, gifts, favourTiers, lvl, x) {
  const P = {};
  x = x || {};
  const c = archCounts(barPieces, gearPieces, gifts), lm = 1 + 0.08 * ((lvl || 1) - 1);
  // Archetype bonuses, then gear (both grow with level), then everything else. Effects and how they combine: effects.js
  ARCH_KEYS.forEach(k => ARCH[k].p.slice(0, archTier(c[k] || 0)).forEach((p, i) => addEffects(P, i === 2 ? advOf(x.adv, k).p : p, lm)));
  gearPieces.filter(Boolean).forEach(g => addEffects(P, gearPas(GEAR[g.id] && GEAR[g.id].rolling && GEAR[g.roll] ? g.roll : g.id, g.star), lm));
  if (P.goldDmg) addEffects(P, { dmgPct: Math.min(0.25, P.goldDmg * Math.floor((x.gold || 0) / 10)) }); // per 10 gold held when the fight starts, up to +25%
  const hp = hiddenPathOf(c);
  if (hp) addEffects(P, HIDDEN_PATHS[hp].fx);
  const G = gifts || [];
  Object.keys(GIFTS).filter(k => G.includes(k)).forEach(k => addEffects(P, GIFTS[k].p));
  if (TITLES[x.title]) addEffects(P, TITLES[x.title].p);
  Object.keys(PERKS).filter(k => (x.perks || []).includes(k)).forEach(k => addEffects(P, PERKS[k].p));
  Object.keys(MILESTONES).filter(k => (x.milestones || {})[k]).forEach(k => addEffects(P, MILESTONES[k].p));
  const F = favourTiers || {};
  Object.keys(GODS).forEach(g => { if (F[g] >= 2) addEffects(P, GODS[g].bless); });
  return P;
}
function favourTiers(run) { const o = {}; Object.keys(GODS).forEach(g => o[g] = run.favour[g] >= 8 ? 2 : run.favour[g] >= 4 ? 1 : 0); return o; }
function runP(run) { return buildP(run.bar, runGear(run), run.gifts, favourTiers(run), run.level, { title: run.title, milestones: run.milestones, perks: run.perks, gold: run.gold, adv: run.adv }); }

// ---------- Opponents: choice of two each round ----------
// late: extra enemy damage per round past round 4 (rounds 5 to 8 and the final; not the Elite bracket)
// The break bar (enemies only): damage that gets past Block fills it, big hits (BREAK.big of its max HP, all hits
// together) count BREAK.heavy times, a skill's brk adds to it directly, and STR's Finesse (STAT_FACES) adds to all of it. Full, the
// enemy is Broken: it loses its next turn, its shown move goes on cooldown, and it takes 50% more damage for 2 turns.
// The bar drains BREAK.drain of its size at the start of each of the enemy's turns.
const BREAK = { share: 0.4, heavy: 2, big: 0.2, drain: 0.15 };
// The curve: every round's opponents hit dmgSlope harder and last hpSlope longer than round 1's, plus late a round after round 4.
// notice: the System takes notice of a win streak (+notice enemy power per straight win, up to noticeMax; losing a Heart resets it).
// gate: Gatekeepers (the hard pick at a GATES round) are this much tougher again, with an extra trait and a second phase.
const TUNE = { late: 0.05, hp0: 1.6, hpSlope: 0.65, dmgSlope: 0.5, hard: 1.25, hardHp: 1.3, finalHp: 0.85, finalDmg: 0.95, alpha: 1.1, monsterRamp: 0.08, notice: 0.06, noticeMax: 5, gate: 0.9, poolDmg: 1, poolHp: 1, poolFragment: 1 };
// poolDmg, poolHp: multipliers on Entrant pool builds, which otherwise fight at their own strength; poolFragment: Hearts a
// win over a filed record takes back (all left at 1 until the balance pass)
const GATES = [4, 7];
function roundPower(round) { return 1 + TUNE.dmgSlope * (round - 1); }
function roundHp(round) { return TUNE.hp0 * (1 + TUNE.hpSlope * (round - 1)); }
// The smoothing curve: a per-round multiplier on opponents' damage (CURVE.dmg) and HP (CURVE.hp), rounds 1 to 8 (8 is
// the final). It lifts the monster rounds and eases the rival rounds and the Gatekeepers so each round is a little harder
// than the last instead of a wall at round 4. Not used in the Elite bracket.
const CURVE = { dmg: [1.9, 1.8, 1.15, 0.85, 0.78, 0.88, 0.76, 0.84], hp: [1.5, 1.5, 1.1, 0.85, 0.78, 0.88, 0.76, 0.84] };
function curveOf(run, k) { return run.elite ? 1 : CURVE[k][Math.min(ROUNDS, run.round) - 1] || 1; }
function curRound(run) { return run.elite ? ROUNDS + Math.min(1, run.eliteIdx) : run.round; }
function rankMul(run) { return (0.92 + 0.05 * run.world.rank) * (hasGift(run, 'f_marked') ? 1.1 : 1); }
const HEART_COST = [1, 1, 2, 3, 3, 4, 5, 6];
function heartCost(run, spec) { if (run.elite) return 0; const c = HEART_COST[Math.min(ROUNDS, run.round) - 1] + (spec && spec.hard && spec.kind !== 'trial' ? 1 : 0); return hasGift(run, 'ironwill') ? Math.max(1, c - 1) : c; }
function makeChoices(run, meta, rng) {
  if (run.script && run.script.choices && run.script.choices[run.round - 1]) return run.script.choices[run.round - 1].map(c => Object.assign({}, c));
  if (run.round >= ROUNDS) return [Object.assign({ kind: 'final', id: finalId(run), round: ROUNDS }, poolOn(run) ? { pool: true } : {}, run.finalTraits ? { traits: run.finalTraits.slice() } : {})];
  const early = run.round <= 3;
  let pool = shuffle((early ? (MONSTER_ROUNDS[run.round - 1] || MONSTERS) : RIVALS).filter(id => !run.met.includes(id)), rng);
  // Rivals come in rank order: D-rank around round 4 up to A-rank around round 7. The Masked Entrant fits any round.
  if (!early) { const want = RANKS.indexOf('D') + run.round - 4, gap = id => ENEMIES[id].rank ? Math.abs(RANKS.indexOf(ENEMIES[id].rank) - want) : 0.5; pool = pool.map(id => ({ id, k: gap(id) + rnd(rng) * 1.5 })).sort((x, y) => x.k - y.k).map(x => x.id); }
  const easy = { kind: early ? 'monster' : 'rival', id: pool[0] };
  if (!early && run.sabotage && !run.met.includes(run.sabotage)) { easy.id = run.sabotage; easy.sabotaged = true; if (pool[1] === run.sabotage) pool[1] = pool[0]; }
  let hard = { kind: early ? 'monster' : 'rival', id: pool[1] || pool[0], hard: true };
  const chance = run.world.mod === 'restless' ? 0.6 : 0.3;
  // Pending World never draws other champions, so every player faces the same fights
  const erased = run.seed ? [] : meta.erased.concat(SHARED.erased).filter(s => !run.met.includes('snap:' + s.at));
  if (run.round >= 4 && erased.length && rnd(rng) < chance) hard = { kind: 'erased', snap: pick(erased, rng), hard: true };
  // The Entrant pool: the hard monster or rival becomes another Entrant's build for this round (Gatekeeper rounds keep theirs)
  if (poolOn(run) && (hard.kind === 'monster' || hard.kind === 'rival') && !GATES.includes(run.round)) hard = poolSpec(run.round, poolSlot(rng));
  if (run.trial && !run.trial.done && run.round === run.trial.round) hard = trialSpec(run, rng);
  // Someone an event sent for (a copy of you, an Erased champion, an auditor) takes the hard slot on the round they are due
  const due = (run.summons || []).findIndex(x => x.round <= run.round);
  if (due >= 0 && !(run.trial && !run.trial.done && run.round === run.trial.round)) { hard = run.summons[due].spec; run.summons.splice(due, 1); }
  // A Gatekeeper: at a GATES round the hard rival guards the way on, with an extra trait, a second phase and a better reward
  if (GATES.includes(run.round) && hard.kind === 'rival' && !run.practice) hard.gate = true;
  // Monsters and rivals bring traits from the pool, shown on the choice screen (js/content/traits.js)
  [easy, hard].forEach(c => { const n = run.practice || c.summoned || (c.kind !== 'monster' && c.kind !== 'rival') ? 0 : (TRAIT_COUNT[run.round - 1] || 0) + (c.gate ? 1 : 0); if (n) c.traits = rollTraits(run, n, rng); });
  return [easy, hard];
}
function specKey(spec) { return spec.snap ? 'snap:' + spec.snap.at : spec.id; }
function specName(spec) {
  if (spec.kind === 'trial') return `${spec.to}-rank Proctor`;
  if (spec.kind === 'erased' || spec.kind === 'champion' || spec.kind === 'entrant' || (spec.kind === 'final' && spec.snap)) return spec.snap.champ;
  const n = ENEMIES[spec.id].name;
  if (spec.gate) return n + ', Gatekeeper';
  if (spec.hard) return spec.kind === 'monster' ? 'Alpha ' + n : n + ', Veteran';
  return n;
}
// The rank letter an opponent fights at: Alphas are a rank above other monsters, and the Masked Entrant copies yours
function specRank(spec, meta) {
  if (spec.kind === 'trial') return spec.to;
  if (spec.snap) return spec.snap.rank || null;
  const t = ENEMIES[spec.id]; if (!t) return null;
  if (spec.id === 'masked') return meta && meta.rank ? meta.rank.letter : null;
  return spec.hard && spec.kind === 'monster' ? 'D' : t.rank || null;
}
function specStyle(spec) {
  if (spec.kind === 'trial') return "The System's examiner. Pass the condition to be promoted";
  if (spec.kind === 'erased') return `Erased. Fell in round ${spec.snap.round} as a ${spec.snap.path ? ARCH[spec.snap.path].path : 'champion'}`;
  if (spec.kind === 'champion') return `Saved ${spec.snap.worldName} as a ${spec.snap.path ? ARCH[spec.snap.path].path : 'champion'}`;
  if (spec.kind === 'entrant') return poolStyle(spec);
  if (spec.kind === 'final' && spec.snap) return `Finalist for ${spec.snap.worldName || 'another world'}, fighting with ${ENEMIES[spec.id].name}'s power. ${spec.snap.path ? 'Builds as a ' + ARCH[spec.snap.path].path : 'No Path yet'}`;
  return ENEMIES[spec.id].style;
}
function specReward(spec) {
  if (spec.kind === 'trial') return `Promotion to ${spec.to}-rank` + (spec.hard ? ', 3 gold, a rune and a rare shop slot' : ' and 3 gold');
  if (spec.kind === 'final') return 'Spares your world. Theirs is not';
  if (spec.kind === 'erased') return '3 gold, a rune, a rare shop slot and one of their pieces';
  if (spec.gate) return '3 gold, a stat point, a rune and a rare shop slot';
  if (spec.hard) return '3 gold, a rune and a rare shop slot';
  return '3 gold';
}
function chooseOpponent(run, i, wagerOn) {
  run.chosen = run.choices[i]; run.wagerOn = !!(wagerOn && run.wager && run.gold >= 5);
  if (run.wagerOn) { run.gold -= 5; notePick(run, 'w:' + run.wager.god); }
  toDistrict(run);
}
function currentSpec(run) { return run.elite ? run.eliteBracket[run.eliteIdx] : run.chosen; }

// ---------- Feats ----------
// A feat (feats.js) is one measured deed. Wagers, Rank Trial conditions, Titles and quests all ask for feats by key.
function featCtx(run, f, won, spec) { return { run, f, T: f && f.tally, A: f && f.A, B: f && f.B, won: !!won, spec, pieces: () => allPieces(run) }; }
// Did feat k happen in context c, needing n of it (the feat's usual n when not given)? A feat measured at 'win' needs a won fight.
function featOk(k, c, n) { const F = FEATS[k]; if (F.at === 'win' && !c.won) return false; return !!F.hit(c, n != null ? n : F.n); }
function canStop(run) { const P = runP(run); return P.firstStun || P.every3Stun || run.bar.some(p => p && SKILLS[p.id] && (SKILLS[p.id].fx.stun || SKILLS[p.id].fx.interrupt || SKILLS[p.id].fx.stunIfWeak)); }
const FEAT_TOOLS = { stop: canStop }; // what a feat's needs asks the run to have
function featPossible(run, k) { const F = FEATS[k]; return !F.needs || FEAT_TOOLS[F.needs](run); }
// A feat is fair unless the run leans on an archetype it is unfair for: the recognised path, or the home archetype before one
function featFair(run, k) { const F = FEATS[k], lead = run.path || run.arch[0]; return !(F.unfairFor || []).includes(lead); }
// ---------- Wagers ----------
// The feats a god will bet on. Trials never ask one that is unfair for any archetype; wagers and quests skip it for the run that leans on one.
const WAGER_FEATS = ['fast', 'noheal', 'react', 'stop', 'healthy'];
const WAGERS = {};
const GOD_WAGERS = Object.values(GODS).map(g => g.wager).filter(Boolean);
WAGER_FEATS.concat(GOD_WAGERS).forEach(k => WAGERS[k] = { text: FEATS[k].say(FEATS[k].n), check: f => featOk(k, featCtx(null, f, true)) });
// The Silence (lore audit, 2 Nov): no Favour and no wagers in a Silence world until its Fate is lifted
function silent(run) { return !!run && !run.practice && !run.chosenNow && run.world.fate === 'silence' && (run.fateTrack || 0) < FATE_TRACK.max; }
function makeWager(run, rng) {
  const god = run.patron !== 'none' && rnd(rng) < 0.6 ? run.patron : pick(Object.keys(GODS), rng);
  const keys = WAGER_FEATS.filter(k => featPossible(run, k) && featFair(run, k));
  // About half the time a god bets on its own favourite (GODS[x].wager)
  const own = GODS[god].wager, mine = own && featPossible(run, own) && featFair(run, own) && rnd(rng) < 0.5;
  return { god, key: mine ? own : pick(keys, rng) };
}
// A god added after a run started has no Favour entry in that save yet, hence the || 0
function godZeros() { const o = {}; Object.keys(GODS).forEach(g => o[g] = 0); return o; }
function addFavour(run, god, n, meta, msgs, rng) {
  if (n < 0) { const b = run.favour[god] || 0; run.favour[god] = Math.max(0, b + n); if (b > run.favour[god]) msgs && msgs.push({ t: 'loss', text: `[${GODS[god].name} is displeased. Favour −${b - run.favour[god]}.]` }); return; }
  if (customOf(run, 'temple')) { n++; customPaid(run, msgs); } // Temple State: omens, every Favour gain +1
  // The Silence: the gods don't answer in this world until its Fate is lifted. Favour earned meanwhile is held, not lost
  if (silent(run)) { run.heldFavour = run.heldFavour || {}; run.heldFavour[god] = (run.heldFavour[god] || 0) + n; msgs && msgs.push({ t: 'sys', text: `[${run.world.name} is silent. ${GODS[god].name} did not hear. Favour held: +${n}.]` }); return; }
  run.favour[god] = (run.favour[god] || 0) + n;
  msgs && msgs.push({ t: 'favour', text: `[${GODS[god].name} is pleased. Favour +${n}.]` });
  if (run.favour[god] >= 4 && !(run.gifted[god] >= 1)) {
    run.gifted[god] = 1;
    const pool = poolIds(run).filter(id => pieceDef(id).rank === 'B' && pieceDef(id).tags.some(t => GODS[god].arch.includes(t)));
    const id = pick(pool.length ? pool : poolIds(run).filter(x => pieceDef(x).rank === 'B'), rng);
    if (id) { msgs && msgs.push({ t: 'favour', text: `[Gift from ${GODS[god].name}: ${pieceDef(id).name}.]` }); addPiece(run, id, [], msgs); }
  }
  if (run.favour[god] >= 8 && !(run.gifted[god] >= 2)) { run.gifted[god] = 2; msgs && msgs.push({ t: 'favour', text: `[Blessing of ${GODS[god].name}: ${GODS[god].blessing}]` }); }
}

// ---------- Between rounds ----------
const DISTRICTS = {
  infirmary: { name: 'Infirmary', desc: 'Restore 50% of your max HP.' },
  sanctum: { name: 'Sanctum', desc: 'Restore 2 Hearts.' },
  undercity: { name: 'Undercity', desc: 'Something is happening in the tunnels.' },
  scout: { name: "Scout's Post", desc: "See your opponent's full kit and their next 2 moves." },
  enchanter: { name: 'Enchanter', desc: 'Carve a prefix into one of your skills.' },
};
// People customs: each People changes one thing about the between-round loop (PEOPLES[x].custom in layers.js says what).
// The first time a custom pays out, the champion earns the People's epithet ("Maren the Devout"), kept for the run.
const customOf = (run, k) => !!run && !run.practice && run.world.people === k && !run.customOff;
// A power struggle (clashing People and world type): the People backed (customUp, their custom pays more) or the old ruler
// (customOff, the custom is suspended and the ruler's bonus applies instead). events/peoples.js power_struggle
function clashOf(run) { const P = PEOPLES[run.world.people], R = WORLD_TYPES[run.world.type].ruler; return P && P.clash && P.clash.includes(run.world.type) && R ? { P, R } : null; }
function clashDue(run) { return run.round === 1 && !run.practice && !run.elite && clashOf(run) && EVENTS.power_struggle && !(run.seen || []).includes('power_struggle') ? 'power_struggle' : null; }
function customPaid(run, msgs) {
  if (run.epithet || run.practice) return; const P = PEOPLES[run.world.people]; if (!P || !P.epithets) return;
  run.epithet = P.epithets[0]; const c = `${run.name} ${run.epithet} of ${run.world.name}`; if (c.length <= 60) run.champ = c; // the champion's name carries it, in the Halls and filed records too
  msgs && msgs.push({ t: 'class', text: `[${P.custom ? P.custom.name + '. ' : ''}${run.world.name} has a name for you now: ${run.name} ${run.epithet}.]` });
}
function champTitle(run) { return run.epithet ? `${run.name} ${run.epithet}` : run.name; }
// Archive: footnotes. The Enchanter and rune picks show one more prefix
function enchantCount(run) { return (districtUp(run, 'enchanter') ? 4 : 3) + (customOf(run, 'archive') ? 1 : 0); }
function runeCount(run) { return 3 + (customOf(run, 'archive') ? 1 : 0); }
function rollDistricts(run, rng) {
  if (run.script && run.script.districts && run.script.districts[run.round - 1]) return run.script.districts[run.round - 1].slice();
  let keys = Object.keys(DISTRICTS).filter(k => !(k === 'sanctum' && run.hearts >= run.maxHearts) && !(k === 'infirmary' && run.hp >= maxHp(run)) && !(k === 'scout' && hasGift(run, 'appraisal')));
  const w = { infirmary: 3, sanctum: 2, undercity: 3, scout: 2, enchanter: 3 };
  const want = customOf(run, 'pilgrims') ? 4 : 3; // Pilgrims: the road, one more district to pick from
  const out = []; let g = 0; while (out.length < want && g++ < 50) { const k = wpick(keys, keys.map(x => w[x]), rng); if (!out.includes(k)) out.push(k); }
  if (run.hp < maxHp(run) * 0.45 && !out.includes('infirmary')) out[2] = 'infirmary';
  return out;
}
function infirmary(run) { const f = (run.world.mod === 'famine' ? 0.25 : 0.5) + (districtUp(run, 'infirmary') ? 0.15 : 0); const m = maxHp(run), b = run.hp; run.hp = Math.min(m, run.hp + Math.round(m * f)); return run.hp - b; }
function sanctum(run, msgs) { const b = run.hearts; run.hearts = Math.min(run.maxHearts, run.hearts + 2); restoreRecord(run, run.hearts - b, msgs); return run.hearts - b; }
// Events live in js/content/events/ (the format is described in js/content/events.js). Chains set run.chains[chain],
// and a { step, due } there brings back the chain's next event on that round.
// A consequence revealed after the choice: lose a share of max HP and say how much
function lose(run, f, msgs, text) { const b = run.hp; run.hp = Math.max(1, run.hp - Math.round(maxHp(run) * f)); msgs.push({ t: 'loss', text: `[${text} −${b - run.hp} HP.]` }); }
function merchantPiece(run, rng, msgs, tries, got) {
  const pool = poolIds(run).filter(x => ['C', 'B'].includes(pieceDef(x).rank)); if (!pool.length) return;
  let id = pick(pool, rng); for (let k = 1; k < tries; k++) { const o = pick(pool, rng); if (pieceDef(o).rank === 'B') id = o; }
  givePiece(run, id, msgs, got || '[Acquired: {item}]');
}
// Unsigned Patch: the three rules offered (kept on the run, so leaving and coming back can't reroll them), and removing one
function patchOffer(run, rng) { if (!run.patchOffer) run.patchOffer = shuffle(Object.keys(PATCH_RULES).filter(k => !PATCH_RULES[k].can || PATCH_RULES[k].can(run)), stream(run, 'patch', rng)).slice(0, 3); return run.patchOffer; }
function usePatch(run, u, key, meta, msgs, rng) {
  const f = findPiece(run, u), R = PATCH_RULES[key];
  if (!f || !GEAR[f.p.id] || !GEAR[f.p.id].consumable || !R || !(run.patchOffer || []).includes(key)) return false;
  removePiece(run, u); run.patchOffer = null; (run.patched = run.patched || []).push(key);
  const h = eventKit(run, meta, stream(run, 'patch', rng), msgs); h.from = 'Unsigned Patch';
  msgs.push({ t: 'class', text: R.say });
  if (R.then) h.apply(R.then);
  if (R.go) R.go(run, h);
  return true;
}
// A piece given as a reward: the line says how you got it ({item} is its name), the message carries the piece so the result
// can show its card, and the piece keeps the line (p.got) so its details say where it came from for the rest of the run
function givePiece(run, id, msgs, got) {
  const text = got.replace('{item}', pieceDef(id).name), m = { t: 'loot', text, item: id };
  if (msgs) msgs.push(m);
  const p = addPiece(run, id, [], msgs); p.got = text; m.u = p.u;
  return p;
}
// What an option's go(run, h) can use, since content cannot call the rules directly
function eventKit(run, meta, rng, msgs) {
  const kit = {
    meta, say: (text, t) => msgs.push({ t: t || 'sys', text }), favour: (god, n) => addFavour(run, god, n, meta, msgs, rng),
    lose: (f, text) => lose(run, f, msgs, text), piece: (tries, got) => merchantPiece(run, rng, msgs, tries, got), eraseRecord: n => eraseRecord(run, n, msgs),
    maxHp: () => maxHp(run), hasGift: k => hasGift(run, k), pick: list => pick(list, rng), shuffle: list => shuffle(list, rng),
    apply: T => { const ctx = { run, h: kit, msgs, from: kit.from }; applyOutcomes(T, ctx, false); applyOutcomes(T, ctx, true); },
    custom: () => customPaid(run, msgs),
    // chance(p): true that share of the time; give(id, got): a set piece, with its line (as h.piece)
    chance: p => rnd(rng) < p, give: (id, got) => pieceDef(id) && givePiece(run, id, msgs, got),
    heal: (f, text) => { const b = run.hp; run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * f)); msgs.push({ t: 'loot', text: `[${text ? text + ' ' : ''}+${run.hp - b} HP.]` }); },
    // Glitch events (events/glitch.js)
    phantom: n => { const g = pick(GEAR_SLOTS.map(k => run.gear[k]).filter(Boolean), rng); if (!g) return; run.phantom = { id: g.id, star: g.star, roll: g.roll, left: n }; msgs.push({ t: 'skill', text: `[Phantom ${pieceDef(g.id).name} acquired. It takes no slot. A hotfix is scheduled in ${n} fights.]` }); },
    anyOption: () => {
      const outs = []; Object.entries(EVENTS).forEach(([k, E]) => { if (!E.glitch && !E.chain && !E.crisis) E.opts.forEach(o => { if (o.then && !o.roll && !o.pay && !o.payHeart && !o.then.chain && !o.then.summon) outs.push({ title: E.title, then: o.then }); }); });
      const x = pick(outs, rng); msgs.push({ t: 'sys', text: `[Executing an option from another event: ${x.title}.]` }); kit.apply(x.then);
    },
    replay: () => { const ks = (run.seen || []).filter(k => EVENTS[k] && !EVENTS[k].chain && !EVENTS[k].crisis && !EVENTS[k].visit && !EVENTS[k].glitch); const k = pick(ks, rng); if (k) { pushEvent(run, k, rng); msgs.push({ t: 'sys', text: `[Replaying: ${EVENTS[k].title}.]` }); } },
    patch: () => {
      const ps = allPieces(run), held = [];
      ps.forEach(p => { if (pieceDef(p.id).glitch) held.push({ p }); (p.mods || []).forEach(m => { if (PREFIXES[m] && PREFIXES[m].glitch) held.push({ p, m }); }); });
      if (run.phantom) held.push({ phantom: true });
      const x = pick(held, rng); if (!x) return;
      if (x.phantom) { msgs.push({ t: 'loss', text: `[Patched: Phantom ${pieceDef(run.phantom.id).name} removed.]` }); run.phantom = null; }
      else if (x.m) { x.p.mods = x.p.mods.filter(m => m !== x.m); msgs.push({ t: 'loss', text: `[Patched: ${PREFIXES[x.m].name} removed from ${pieceDef(x.p.id).name}.]` }); }
      else { removePiece(run, x.p.u); msgs.push({ t: 'loss', text: `[Patched: ${pieceDef(x.p.id).name} removed.]` }); }
    },
    sellLowest: mult => { const p = run.bench.slice().sort((a, b) => sellValue(a) - sellValue(b))[0]; if (!p) return 0; const v = sellValue(p) * (mult || 1); removePiece(run, p.u); run.gold += v; msgs.push({ t: 'loot', text: `[Sold: ${pieceDef(baseId(p.id)).name}. +${v} gold.]` }); return v; },
  };
  return kit;
}
function eventText(run, key) { const t = EVENTS[key].text; return typeof t === 'function' ? t(run) : t; }
const CHAIN_STARTERS = {}; Object.entries(CHAINS).forEach(([c, C]) => CHAIN_STARTERS[c] = C.start);
function undercityEvent(run, rng) {
  // Stand-alone events don't repeat in a run until every one has been seen
  const open = k => !EVENTS[k].chain && !EVENTS[k].crisis && !EVENTS[k].visit && (!EVENTS[k].glitch || glitchesOn(run)) && (!EVENTS[k].can || EVENTS[k].can(run));
  const fresh = Object.keys(EVENTS).filter(k => open(k) && !(run.seen || []).includes(k));
  const keys = (fresh.length ? fresh : Object.keys(EVENTS).filter(open)).concat(Object.keys(CHAIN_STARTERS).filter(c => !run.chains[c]).map(c => CHAIN_STARTERS[c]));
  const w = keys.map(k => (EVENTS[k].weight != null ? EVENTS[k].weight : EVENTS[k].chain ? 3 : 1) * (worldTagged(run, EVENTS[k]) ? WORLD_LEAN : 1) * (EVENTS[k].glitch ? glitchMul(run) : 1));
  return wpick(keys, w, rng);
}
// An event tagged with a Fate or People (fate: id, people: id, or lists of them) turns up WORLD_LEAN times as often in a world that has it
const WORLD_LEAN = 3;
function worldTagged(run, E) { const has = (x, v) => x != null && [].concat(x).includes(v); return has(E.fate, run.world.fate) || has(E.people, run.world.people); }
function dueChainEvents(run) {
  const out = [];
  Object.entries(run.chains || {}).forEach(([c, st]) => { if (st && typeof st === 'object' && st.due <= run.round) out.push(c + '_' + st.step); });
  return out.filter(k => EVENTS[k]);
}
// Stat lines, Fallout style: an option with a check shows only when you qualify, and then always works.
// { stat, hard } needs STAT_EASY or STAT_HARD effective points (gear counts); { favour: god } needs FAVOUR_LINE Favour;
// { luck: true } turns up by chance, LUCK_LINE per point of LUK, rolled once when the event appears
const STAT_EASY = 6, STAT_HARD = 10, FAVOUR_LINE = 4, LUCK_LINE = 0.08, MAX_STAT_LINES = 2;
function checkNeed(c) { return c.hard ? STAT_HARD : STAT_EASY; }
function checkMet(run, key, c) {
  if (c.stat) return effStats(run)[c.stat] >= checkNeed(c);
  if (c.favour) return run.favour[c.favour] >= FAVOUR_LINE - (customOf(run, 'temple') ? 1 : 0);
  if (c.fate) return run.world.fate === c.fate;
  if (c.people) return run.world.people === c.people;
  return !!(c.luck && run.luck && run.luck[key]);
}
function checkTag(c) { return c.stat ? `[${c.stat} ${checkNeed(c)}]` : c.favour ? `[${GODS[c.favour].short}]` : c.fate ? `[${FATES[c.fate].name}]` : c.people ? `[${PEOPLES[c.people].name}]` : '[LUK]'; }
// Chance options ({ roll: { stat, hard? } }): always shown, with the odds on the button. ROLL_BASE (ROLL_HARD if hard) + ROLL_PER per
// point of the stat + ROLL_LUK per point of LUK, kept between ROLL_MIN and ROLL_MAX. The roll is made when the event appears and kept
// with the run, so reloading never changes it; a failed roll takes the option's fail branch, which always does something.
const ROLL_BASE = 30, ROLL_HARD = 10, ROLL_PER = 7, ROLL_LUK = 1, ROLL_MIN = 5, ROLL_MAX = 95;
function rollChance(run, r) {
  const s = effStats(run), ch = Math.max(ROLL_MIN, Math.min(ROLL_MAX, (r.hard ? ROLL_HARD : ROLL_BASE) + ROLL_PER * (s[r.stat] || 0) + (r.stat === 'LUK' ? 0 : ROLL_LUK * (s.LUK || 0))));
  const P = runP(run), floor = P.chanceFloor; // Born Lucky: the first chance option each round
  const c2 = Math.min(ROLL_MAX, ch + (P.chanceBonus || 0)); // The House, Loaded Dice
  return floor && run.chanceFloorAt !== run.round ? Math.max(c2, floor) : c2;
}
// A won chance roll counts toward Lucky Seven and, at 3 in one run, unlocks the Gambler
const CHANCE_UNLOCK = 3;
function chanceWon(run, msgs) {
  run.chanceWins = (run.chanceWins || 0) + 1;
  Object.entries(TITLES).forEach(([k, t]) => { if (t.feat && FEATS[t.feat].at === 'chance' && featOk(t.feat, { run }, t.n)) earnTitle(run, k, msgs); });
  if (run.chanceWins >= CHANCE_UNLOCK && META && !META.unlocks.arch_dicer && !run.practice) { META.unlocks.arch_dicer = true; msgs.push({ t: 'class', text: '[Archetype unlocked: Gambler. The House has opened a line of credit.]' }); }
}
function rollTag(run, r) { return `[${r.stat} ${rollChance(run, r)}%]`; }
function pushEvent(run, key, rng) {
  run.pending.push({ type: 'event', key });
  run.seen = run.seen || []; if (!run.seen.includes(key)) run.seen.push(key);
  if (EVENTS[key] && EVENTS[key].opts.some(o => o.roll)) { run.rolls = run.rolls || {}; run.rolls[key] = rnd(stream(run, 'event', rng)) * 100; }
  if (EVENTS[key] && EVENTS[key].opts.some(o => o.check && o.check.luck)) { run.luck = run.luck || {}; run.luck[key] = rnd(stream(run, 'event', rng)) < LUCK_LINE * effStats(run).LUK; }
}
// The options the player sees, by index: those they can take, with at most MAX_STAT_LINES stat lines and chance options together
// (chance options first, then hard and god lines), so the sheet fits one screen
function eventOpts(run, key) {
  const E = EVENTS[key]; if (!E) return [];
  const ok = E.opts.map((o, i) => i).filter(i => { const o = E.opts[i]; return (!o.can || o.can(run)) && !(o.pay > run.gold) && !(o.payHeart >= run.hearts) && (!o.check || checkMet(run, key, o.check)); });
  const w = o => o.roll ? 3 : o.check.hard || o.check.favour || o.check.fate || o.check.people ? 2 : o.check.luck ? 1 : 0; // a chance option is always shown, so it is never the one cut
  const lines = ok.filter(i => E.opts[i].check || E.opts[i].roll).sort((a, b) => w(E.opts[b]) - w(E.opts[a]));
  const cut = lines.slice(MAX_STAT_LINES);
  return ok.filter(i => !cut.includes(i));
}
// The option if the player can see and take it, else null, so every choice shown is pickable
function eventOpt(run, key, idx) { return eventOpts(run, key).includes(idx) ? EVENTS[key].opts[idx] : null; }
function resolveEvent(run, key, idx, meta, rng, msgs) {
  const o = eventOpt(run, key, idx);
  if (!o) return false;
  msgs = msgs || []; const r = stream(run, 'event', rng), h = eventKit(run, meta, r, msgs); h.from = EVENTS[key].title;
  if (o.pay) run.gold -= o.pay;
  if (o.payHeart) { run.hearts -= o.payHeart; msgs.push({ t: 'loss', text: `[Paid: ${o.payHeart} Heart${o.payHeart > 1 ? 's' : ''}, ${run.hearts} left.]` }); eraseRecord(run, o.payHeart, msgs); }
  // A chance option: the roll made when the event appeared decides which branch happens
  let B = o;
  if (o.roll) {
    const ch = rollChance(run, o.roll), got = run.rolls && run.rolls[key] != null ? run.rolls[key] : rnd(r) * 100, won = got < ch;
    msgs.push({ t: won ? 'class' : 'loss', text: `[${o.roll.stat} check: ${ch}%. ${won ? 'Success' : 'Failed'}.]` });
    run.chanceFloorAt = run.round;
    if (won) chanceWon(run, msgs);
    if (!won) B = o.fail;
    if (run.rolls) delete run.rolls[key];
  }
  const before = msgs.length, T = B.then || {};
  if (EVENTS[key].crisis && FATES[run.world.fate] && FATES[run.world.fate].crises[0] === key) run.crisisUsed = (T.fate || 0) < 0;
  const ctx = { run, h, msgs, chain: EVENTS[key].chain, from: EVENTS[key].title };
  applyOutcomes(T, ctx, false);
  if (B.go) B.go(run, h);
  notePick(run, 'e:' + key + '.' + idx);
  if (run.luck) delete run.luck[key];
  if (B.reveal && msgs.length === before) msgs.push({ t: 'sys', text: typeof B.reveal === 'function' ? B.reveal(run) : B.reveal });
  applyOutcomes(T, ctx, true);
  return true;
}
// ---------- Outcomes ----------
// What each outcome in outcomes.js does. ctx: { run, h (an eventKit), msgs, chain (the event's chain), label (for a piece's line) }
const OUTCOME_APPLY = {
  gold: (v, c) => { c.run.gold += v; },
  stats: (v, c) => Object.entries(v).forEach(([k, n]) => c.run.stats[k] += n),
  heart: (v, c) => { for (let i = 0; i < v; i++) { c.run.maxHearts++; c.run.hearts++; amendRecord(c.run, c.msgs, stream(c.run, 'record')); } },
  rune: (v, c) => { for (let i = 0; i < v; i++) c.run.pending.push({ type: 'rune', mods: rollPrefixes(runeCount(c.run), stream(c.run, 'loot'), null, c.run), got: c.gotRune || (c.label ? `[${c.label}: a rune.]` : null) }); },
  piece: (v, c) => { const pool = poolIds(c.run).filter(x => pieceDef(x).rank === v); const id = pick(pool, stream(c.run, 'loot')); if (id) givePiece(c.run, id, c.msgs, c.got || `[${c.label || 'Reward'}: {item}]`); },
  experimental: (v, c) => { for (let i = 0; i < v; i++) { const have = allPieces(c.run).map(p => p.id), ids = Object.keys(GEAR).filter(k => GEAR[k].experimental && !have.includes(k)); const id = pick(ids, stream(c.run, 'loot')); if (id) givePiece(c.run, id, c.msgs, c.got || '[Experimental equipment issued: {item}.]'); } },
  next: (v, c) => { Object.assign(c.run.nextFlags, v); addMark(c, 'next', markNext(v)); },
  foe: (v, c) => {
    const F = c.run.nextFlags;
    if (v.weaken) F.foeWeaken = (F.foeWeaken || 0) + v.weaken;
    if (v.poison) F.foePoison = (F.foePoison || 0) + v.poison;
    if (v.burn) F.foeBurn = (F.foeBurn || 0) + v.burn;
    if (v.hp) F.foeHp = (F.foeHp || 1) * (1 + v.hp);
    if (v.trait) { const have = F.foeTraits || [], add = rollTraits(c.run, v.trait, stream(c.run, 'opps'), have); F.foeTraits = have.concat(add); }
    addMark(c, 'foe', markFoe(v));
  },
  heal: (v, c) => { const m = maxHp(c.run), b = c.run.hp; c.run.hp = Math.min(m, c.run.hp + Math.round(m * v)); if (c.run.hp > b) c.msgs.push({ t: 'loot', text: `[+${Math.round(c.run.hp - b)} HP.]` }); },
  max_hp: (v, c) => { const b = maxHp(c.run); c.run.hpCut = Math.min(0.5, Math.max(0, (c.run.hpCut || 0) - v)); c.run.hp = Math.min(c.run.hp, maxHp(c.run)); c.msgs.push({ t: v < 0 ? 'loss' : 'loot', text: `[Max HP ${v < 0 ? '−' : '+'}${Math.abs(maxHp(c.run) - b)} for the rest of the run.]` }); },
  erase: (v, c) => { const b = c.run.hearts; c.run.hearts = Math.max(1, c.run.hearts - v); const k = b - c.run.hearts; if (k) { c.msgs.push({ t: 'loss', text: `[−${k} Heart${k > 1 ? 's' : ''}, ${c.run.hearts} left.]` }); eraseRecord(c.run, k, c.msgs); } },
  stakes: (v, c) => { addMark(c, 'stakes', ['win', 'lose'].filter(w => v[w]).map(w => `${w === 'win' ? 'Win' : 'Lose'}: ${outcomeText(v[w])}`));  const S = c.run.nextFlags.stakes = c.run.nextFlags.stakes || {}; ['win', 'lose'].forEach(w => { if (v[w]) S[w] = Object.assign({}, S[w], v[w]); }); },
  respec: (v, c) => { const pts = STATS.reduce((n, k) => n + Math.max(0, c.run.stats[k] - 1), 0); STATS.forEach(k => c.run.stats[k] = Math.min(c.run.stats[k], 1)); c.run.statPts += pts; c.run.hp = Math.min(c.run.hp, maxHp(c.run)); c.msgs.push({ t: 'level', text: `[Stats reset. ${pts} stat points to place again.]` }); },
  summon: (v, c) => { const s = summonSpec(c.run, v, stream(c.run, 'opps')); if (!s) return; (c.run.summons = c.run.summons || []).push({ round: c.run.round + 1, spec: s }); },
  amend: (v, c) => { c.run.amend = v; c.msgs.push({ t: 'class', text: `[Amendment passed: ${AMENDMENTS[v].name}. ${AMENDMENTS[v].say}]` }); },
  restore: (v, c) => { const b = c.run.hearts; c.run.hearts = Math.min(c.run.maxHearts, c.run.hearts + v); const k = c.run.hearts - b; if (k) { c.msgs.push({ t: 'loot', text: `[+${k} Heart${k > 1 ? 's' : ''}, ${c.run.hearts} left.]` }); restoreRecord(c.run, k, c.msgs); } },
  notice: (v, c) => {
    if (c.run.noticeOff) return; // an Unsigned Patch removed the System's monitoring
    const was = noticeOf(c.run); c.run.notice = Math.max(0, Math.min(TUNE.noticeMax, (c.run.notice || 0) + v)); const now = noticeOf(c.run);
    if (now > was) c.msgs.push({ t: 'class', text: `[The System takes notice. Opponents +${noticePct(c.run)}%.]` });
    else if (now < was) c.msgs.push({ t: 'sys', text: now ? `[The System looks elsewhere. Opponents +${noticePct(c.run)}%.]` : '[The System looks elsewhere. Notice cleared.]' });
  },
  fate: (v, c) => moveFate(c.run, v, c.msgs),
  ward: (v, c) => { addMark(c, 'ward', ['A lost fight costs no Heart']);  c.run.ward = (c.run.ward || 0) + v; c.msgs.push({ t: 'loot', text: `[Warded: your next ${c.run.ward === 1 ? 'loss costs' : c.run.ward + ' losses cost'} no Heart.]` }); },
  mod: (v, c) => { if (!MODIFIERS[v] || c.run.world.mod === v) return; c.run.world.mod = v; c.msgs.push({ t: 'class', text: `[World modifier changed: ${MODIFIERS[v].name}. ${MODIFIERS[v].desc}]` }); },
  always: (v, c) => { addMark(c, 'always', [].concat(v.next ? markNext(v.next) : [], v.foe ? markFoe(v.foe) : [])); c = Object.assign({}, c, { from: null }); const A = c.run.always = c.run.always || {}; ['next', 'foe'].forEach(k => { if (!v[k]) return; A[k] = Object.assign({}, A[k]); Object.entries(v[k]).forEach(([f, n]) => A[k][f] = typeof n === 'number' && typeof A[k][f] === 'number' ? A[k][f] + n : n); OUTCOME_APPLY[k](v[k], c); }); },
  chain: (v, c) => { c.run.chains[c.chain] = typeof v === 'string' ? v : { step: v.step, due: c.run.round + v.after }; },
  favour: (v, c) => Object.entries(v).forEach(([g, n]) => c.h.favour(g, n)),
};
// Marks: what an event set up for later fights, in words, with the event that set it (c.from), so the run can show them
// until they happen (run.marks; next, foe and stakes go after the next fight, ward when used up, always never)
function addMark(c, kind, lines) { if (!c.from || !lines.length) return; (c.run.marks = c.run.marks || []).push({ kind, from: c.from, text: lines.join(', ') }); }
function markNext(v) {
  const w = { weaken: n => `you start Weakened ${n} turns`, empower: n => `you start Empowered ${n} turns`, poison: n => `you start with ${n} Poison`, burn: n => `you start with ${n} Burn`, bleed: n => `you start with ${n} Bleed`,
    bribe: () => 'your opponent starts with less HP', jinxFirst: () => "your opponent's first move goes wrong", heartCut: n => `a loss costs ${n} more Heart${n > 1 ? 's' : ''}`, noWinGold: () => 'a win pays no gold', foePoison: n => `your opponent starts with ${n} Poison` };
  return Object.entries(v).filter(([k]) => w[k]).map(([k, n]) => w[k](n));
}
function markFoe(v) {
  const w = { weaken: n => `opponent starts Weakened ${n} turns`, poison: n => `opponent starts with ${n} Poison`, burn: n => `opponent starts with ${n} Burn`, hp: n => `opponent ${n > 0 ? '+' : '−'}${Math.round(Math.abs(n) * 100)}% HP`, trait: n => `opponent +${n} trait${n > 1 ? 's' : ''}` };
  return Object.entries(v).filter(([k]) => w[k]).map(([k, n]) => w[k](n));
}
// A summoned opponent: { who: 'copy' | 'erased' | a rival id, bounty?: outcomes for beating them, traits?: n }. An Erased champion
// when there is none to send falls back to an unmet rival; summoned rivals are Veterans
function summonSpec(run, v, rng) {
  let spec = v.spec ? Object.assign({}, v.spec, { hard: true, traits: (v.spec.traits || []).concat(rollTraits(run, v.traits || 0, rng, v.spec.traits)) }) : null;
  if (spec && spec.kind !== 'rival' && spec.kind !== 'monster' && spec.kind !== 'erased' && spec.kind !== 'champion') spec = null;
  if (!spec && v.who === 'copy') { const snap = snapshot(run); snap.champ = `${run.champ} (copy)`; spec = { kind: 'erased', snap, hard: true }; }
  if (!spec && v.who === 'erased') { const pool = run.seed ? [] : (META ? META.erased : []).concat(SHARED.erased).filter(s => !run.met.includes('snap:' + s.at)); if (pool.length) spec = { kind: 'erased', snap: pick(pool, rng), hard: true }; }
  if (!spec) { const id = ENEMIES[v.who] ? v.who : pick(RIVALS.filter(r => !run.met.includes(r)), rng) || pick(RIVALS, rng); spec = { kind: 'rival', id, hard: true, traits: rollTraits(run, v.traits || 1, rng) }; }
  spec.summoned = true; if (v.bounty) spec.bounty = v.bounty; if (v.say) spec.say = v.say;
  return spec;
}
// The Fate track: how your world's Fate is going, from FATE_TRACK.min (worsened) to FATE_TRACK.max (eased). Fate Crises and
// events move it (the outcome fate); at the end of the run the Fate is lifted at max, sealed at min (fateEnd)
const FATE_TRACK = { min: -2, max: 2 };
function moveFate(run, v, msgs) {
  const F = FATES[run.world.fate]; if (!F) return;
  const was = run.fateTrack || 0; run.fateTrack = Math.max(FATE_TRACK.min, Math.min(FATE_TRACK.max, was + v));
  if (run.fateTrack !== was && msgs) msgs.push({ t: run.fateTrack > was ? 'loot' : 'loss', text: `[${run.world.name}: ${F.name} ${run.fateTrack > was ? 'eases' : 'worsens'}. Fate: ${fateState(run)}.]` });
  // The Silence lifted: the gods answer, and the Favour held for them arrives at once
  if (run.world.fate === 'silence' && was < FATE_TRACK.max && run.fateTrack >= FATE_TRACK.max && run.heldFavour) {
    const H = run.heldFavour; run.heldFavour = null; msgs && msgs.push({ t: 'favour', text: '[The gods answer. Held Favour delivered.]' });
    Object.keys(H).forEach(g => GODS[g] && H[g] > 0 && addFavour(run, g, H[g], META, msgs));
  }
}
function fateState(run) { const t = run.fateTrack || 0; return t >= FATE_TRACK.max ? 'Lifted' : t <= FATE_TRACK.min ? 'Sealed' : t > 0 ? 'Easing' : t < 0 ? 'Worsening' : 'Holding'; }
// How the Fate ended: 'lifted', 'sealed' or null, and the Fate's closing line for it (FATES[x].ends), if it has one
function fateEnd(run) {
  const F = FATES[run.world.fate], t = run.fateTrack || 0; if (!F) return null;
  const end = t >= FATE_TRACK.max ? 'lifted' : t <= FATE_TRACK.min ? 'sealed' : null;
  return end && { end, text: F.ends && F.ends[end] ? `[${run.world.name}: ${F.ends[end]}]` : null };
}
// Fate Crises: in the rounds where the Fate's trouble grows (PULSE.stageAt), the Fate's crisis event for that stage (FATES[x].crises)
// comes to everyone before the shop. Not in practice or the Elite bracket
function crisisDue(run) {
  const F = FATES[run.world.fate], at = PULSE.stageAt.indexOf(run.round);
  if (!F || !F.crises || at < 0 || run.practice || run.elite) return null;
  // Round 5 branches on round 3: a crisis that was used brings crisisIfUsed instead (run.crisisUsed, set in resolveEvent)
  const k = at > 0 && F.crisisIfUsed && run.crisisUsed ? F.crisisIfUsed : F.crises[at]; return EVENTS[k] && !(run.seen || []).includes(k) ? k : null;
}
// The run is decided: say how the Fate ended. A lifted Fate in a spared world gives a Heart back, and its entry comes back partial
function closeFate(run, msgs, spared) {
  const E = fateEnd(run); if (!E) return; run.fateEnd = E.end;
  if (E.text) msgs.push({ t: E.end === 'lifted' ? 'loot' : 'loss', text: E.text });
  if (spared && E.end === 'lifted') OUTCOME_APPLY.restore(1, { run, msgs });
}
// People visits: a People's own event (PEOPLES[x].visit = { at: round, event }) comes to everyone that round, like a crisis
function visitDue(run) {
  const V = PEOPLES[run.world.people] && PEOPLES[run.world.people].visit;
  if (!V || run.round !== V.at || run.practice || run.elite || run.customOff) return null;
  return EVENTS[V.event] && !(run.seen || []).includes(V.event) ? V.event : null;
}
// Marks that last the run (the outcome always) go on every fight, as next and foe marks do on one
function applyAlways(run) { const A = run.always; if (!A) return; const c = { run, msgs: [] }; ['next', 'foe'].forEach(k => A[k] && OUTCOME_APPLY[k](A[k], c)); }
// Apply a set of outcomes T in the order outcomes.js lists them: the early ones, or (late) the ones announced last
// A set of outcomes may carry got: the line for its piece, saying how you got it ({item} is the piece's name), and gotRune:
// the line for its rune, shown on the rune pick and kept by the prefix carved from it
function applyOutcomes(T, ctx, late) { const c = T.got || T.gotRune ? Object.assign({}, ctx, T.got && { got: T.got }, T.gotRune && { gotRune: T.gotRune }) : ctx; Object.keys(OUTCOMES).forEach(k => { if (T[k] != null && !!OUTCOMES[k].late === !!late) OUTCOME_APPLY[k](T[k], c); }); }
// A corrupted skill takes no more prefixes
function prefixTargets(run, m) { return allPieces(run).filter(p => SKILLS[p.id] && !p.corrupt && prefixOk(p.id, m, p.mods)).map(p => ({ u: p.u, id: p.id, mods: p.mods })); }
// Carve prefix m into piece u. [REDACTED] becomes a hidden glitch that fits the skill; a glitch raises the System's notice.
// got: where the prefix came from, kept on the piece (p.mgot, by prefix) for its details
function applyPrefix(run, u, m, msgs, rng, got) {
  const f = findPiece(run, u); if (!f || f.p.corrupt || !prefixOk(f.p.id, m, f.p.mods)) return false;
  if (m === 'redacted') { const have = f.p.mods.map(bareMod), ks = GLITCH_PREFIXES.filter(k => !have.includes(k) && prefixOk(f.p.id, k, f.p.mods)); m = 'r_' + pick(ks, stream(run, 'loot', rng)); }
  if (f.p.mods.length >= MAX_MODS) f.p.mods.shift();
  f.p.mods.push(m);
  if (got) { f.p.mgot = f.p.mgot || {}; f.p.mgot[m] = got; }
  if (PREFIXES[m].glitch) OUTCOME_APPLY.notice(1, { run, msgs: msgs || [] });
  return true;
}
// ---------- Corrupt (the Enchanter) ----------
// Gamble one skill: two results are rolled and the player keeps one. Either way the skill is corrupted: it holds one more
// prefix and can take no more, and the System takes notice.
function corruptTargets(run) { return allPieces(run).filter(p => SKILLS[p.id] && !SKILLS[p.id].basic && !p.corrupt); }
function corruptOptions(run, u, rng) {
  const f = findPiece(run, u); if (!f || f.p.corrupt || !SKILLS[f.p.id] || SKILLS[f.p.id].basic) return null;
  const p = f.p, r = stream(run, 'loot', rng), have = p.mods.map(bareMod);
  const fits = ks => ks.filter(k => !have.includes(k) && prefixOk(p.id, k, p.mods));
  const glitches = glitchesOn(run) ? fits(GLITCH_PREFIXES) : [];
  const normal = fits(Object.keys(PREFIXES).filter(k => PREFIXES[k].w > 0 && !PREFIXES[k].glitch));
  const all = [];
  if (p.star < 3) all.push({ k: 'star' });
  if (glitches.length) all.push({ k: 'mod', m: pick(glitches, r) });
  if (normal.length) all.push({ k: 'mod', m: pick(normal, r) });
  if (!have.includes('overclocked')) all.push({ k: 'mod', m: 'overclocked' });
  const out = [];
  while (out.length < 2 && all.length) out.push(all.splice(Math.floor(rnd(r) * all.length), 1)[0]);
  return { u, opts: out };
}
function corruptText(o) { return o.k === 'star' ? 'One star higher' : `Gains ${PREFIXES[o.m].name}: ${PREFIXES[o.m].desc}`; }
function corrupt(run, u, o, msgs) {
  const f = findPiece(run, u); if (!f || f.p.corrupt || !o) return false;
  const p = f.p, name = SKILLS[p.id].name;
  if (o.k === 'star' && p.star < 3) {
    p.star++;
    if (p.star === 3 && SKILLS[p.id].evo) { run.pending.push({ type: 'evo', u: p.u }); msgs && msgs.push({ t: 'skill', text: `[${name} has reached ★3. Evolution available.]` }); }
  } else if (o.k === 'mod' && PREFIXES[o.m]) { if (p.mods.length >= MAX_MODS_CORRUPT) p.mods.shift(); p.mods.push(o.m); }
  p.corrupt = true;
  msgs && msgs.push({ t: 'skill', text: `[Corrupted: ${name}. ${corruptText(o)}. It will take no more prefixes.]` });
  OUTCOME_APPLY.notice(1, { run, msgs: msgs || [] });
  return true;
}

// ---------- Known Issues (js/content/glitches.js) ----------
// After each fight, every glitch the run has met (held, carved, fought, visited or loaded) that the Archive has not logged
// yet is logged, and pays a Bug Bounty (not in Pending World, which pays no Echoes).
const BUG_BOUNTY = 3;
const issueKey = K => K.of + ':' + K.id;
function issueName(K) {
  const src = { prefix: PREFIXES, gear: GEAR, skill: SKILLS, trait: TRAIT_POOL, mod: MODIFIERS }[K.of];
  return K.of === 'event' ? (EVENTS[K.id] || {}).title : src ? (src[K.id] || {}).name : K.name;
}
function issuesSeen(run, f) {
  const out = new Set(), add = (of, id) => out.add(of + ':' + id);
  allPieces(run).concat(run.phantom ? [run.phantom] : []).forEach(p => {
    if (/^x_/.test(p.id)) add('other', 'spliced'); else if (/^u_/.test(p.id)) add('other', 'unstable');
    else if (GEAR[p.id] && GEAR[p.id].glitch) add('gear', p.id); else if (SKILLS[p.id] && SKILLS[p.id].glitch) add('skill', p.id);
    if (p.corrupt) add('other', 'corrupt');
    (p.mods || []).forEach(m => { const P = PREFIXES[m]; if (!P) return; if (P.hide) add('prefix', 'redacted'); else if (P.glitch || P.corrupt) add('prefix', m); });
  });
  if (run.phantom) add('other', 'phantom');
  (run.seen || []).forEach(k => EVENTS[k] && EVENTS[k].glitch && add('event', k));
  ((f && f.spec && f.spec.traits) || []).forEach(k => TRAIT_POOL[k] && TRAIT_POOL[k].glitch && add('trait', k));
  if (MODIFIERS[run.world.mod] && MODIFIERS[run.world.mod].glitch) add('mod', run.world.mod);
  return out;
}
function fileIssues(run, f, meta, msgs) {
  if (!meta || !meta.archive || run.practice) return;
  const A = meta.archive, seen = issuesSeen(run, f); A.issues = A.issues || {};
  KNOWN_ISSUES.forEach(K => {
    const k = issueKey(K); if (!seen.has(k) || A.issues[k]) return;
    A.issues[k] = true; const pay = !run.daily; if (pay) meta.echoes += BUG_BOUNTY;
    msgs.push({ t: 'loot', text: `[Known issue logged: ${issueName(K)}.${pay ? ` Bug Bounty: +${BUG_BOUNTY} Echoes.` : ''}]` });
  });
}

// ---------- Quests ----------
// Which feats each moment can measure: a fight settles both 'win' and 'fight' feats
const QUEST_AT = { fight: ['win', 'fight'], merge: ['merge'], path: ['path'], shop: ['shop'], wager: ['wager'] };
function questEvent(run, kind, d, msgs) {
  const c = featCtx(run, d.f, d.won, d.spec);
  (run.quests || []).forEach(q => {
    if (q.done || q.failed) return;
    const Q = QUESTS[q.id], feats = [].concat(Q.feat);
    if (!feats.every(k => QUEST_AT[kind].includes(FEATS[k].at))) return;
    const inc = Q.count ? FEATS[feats[0]].measure(c) : feats.every(k => featOk(k, c, Q.n)) ? 1 : 0;
    if (inc) { q.prog = Math.min(QUESTS[q.id].goal, q.prog + inc); if (q.prog >= QUESTS[q.id].goal) completeQuest(run, q, msgs); }
  });
}
function completeQuest(run, q, msgs) {
  const Q = QUESTS[q.id]; q.done = true;
  if (META) META.archive.quests[q.id] = true;
  msgs && msgs.push({ t: 'class', text: `[${Q.hidden ? 'Hidden quest' : 'Quest'} complete: ${Q.text} Reward: ${outcomeText(Q.reward)}.]` });
  const ctx = { run, h: eventKit(run, META, stream(run, 'quest'), msgs), msgs, label: 'Quest reward' };
  applyOutcomes(Q.reward, ctx, false); applyOutcomes(Q.reward, ctx, true);
}
// ---------- Additional Gift (after round 4) ----------
function extraGiftOffers(run, rng) {
  const c = runCounts(run);
  const top = Object.keys(c).filter(k => run.arch.includes(k)).sort((a, b) => c[b] - c[a])[0] || run.arch[0];
  return ['aff_' + top].concat(shuffle(midGiftPool(run), rng).slice(0, 2));
}
function applyGift(run, k, msgs) {
  if (!GIFTS[k] || hasGift(run, k)) return false;
  run.gifts.push(k);
  if (k === 'merger') run.merges = 3;
  if (k === 'dragon') run.hp = Math.round(run.hp * 1.15);
  msgs && msgs.push({ t: 'class', text: `[Additional Gift granted: ${GIFTS[k].name}.]` });
  checkPath(run, msgs);
  return true;
}

// Stage machine: draft -> (choose -> shop -> district -> fight)*
function rollDraft(run, rng) {
  if (run.script && run.script.draft) return run.script.draft.slice();
  const pool = SHOP_SKILLS.filter(id => SKILLS[id].tags.some(t => run.arch.includes(t)) && ['E', 'D'].includes(SKILLS[id].rank));
  const out = []; let g = 0;
  // at least one from the home archetype
  const home = pool.filter(id => SKILLS[id].tags.includes(run.arch[0]));
  if (home.length) out.push(pick(home, rng));
  while (out.length < 6 && g++ < 200) { const id = pick(pool, rng); if (!out.includes(id)) out.push(id); }
  return shuffle(out, rng);
}
// The opening gear pick (Pick Your Kit): after the 3 skills, 1 of 2 E-rank gear pieces from the run's archetypes, one of
// them the home archetype's when it has any. Its own stream, so the skill draft, shops and opponents never shift.
function rollGearDraft(run, rng) {
  if (run.script && !run.script.gearDraft) return [];
  if (run.script) return run.script.gearDraft.slice();
  const ok = id => { const g = GEAR[id]; return g.rank === 'E' && !g.glitch && !g.experimental && !g.consumable && g.tags.some(t => run.arch.includes(t)); };
  const pool = Object.keys(GEAR).filter(ok), home = pool.filter(id => GEAR[id].tags.includes(run.arch[0]));
  const out = []; if (home.length) out.push(pick(home, rng));
  const rest = shuffle(pool.filter(id => !out.includes(id)), rng);
  // a different slot from the first when one is on offer, so the pick is weapon or armour, not two weapons
  const other = rest.find(id => !out.length || GEAR[id].slot !== GEAR[out[0]].slot) || rest[0];
  if (other) out.push(other);
  return out.slice(0, 2);
}
// The opening stat points, after the draft: place them one at a time, or roll ROLL_PTS once (seeded per Awakening, so
// it can't be fished for). Nothing counts until placeStartStats.
function startStat(run, k, d) {
  if (run.startPts == null || run.rolled || !STATS.includes(k)) return false;
  if (d > 0 && run.startPts > 0) { run.stats[k]++; run.startPts--; return true; }
  if (d < 0 && run.stats[k] > run.statFloor[k]) { run.stats[k]--; run.startPts++; return true; }
  return false;
}
function rollStart(run) {
  if (run.startPts == null || run.rollUsed) return false;
  const r = rollStats(seedRng(run.rollSeed));
  STATS.forEach(k => run.stats[k] = run.statFloor[k] + r[k] - 2);
  run.startPts = 0; run.rolled = run.rollUsed = true; return true;
}
function unrollStart(run, pts) {
  if (run.startPts == null || !run.rolled) return false;
  run.stats = Object.assign({}, run.statFloor); run.startPts = pts; run.rolled = false; return true;
}
function placeStartStats(run, msgs) {
  if (run.startPts == null || run.startPts > 0) return false;
  const floor = run.statFloor, before = Object.assign({}, run.stats);
  // HP was set from the floor stats at the start: give the run the Max HP its placed points add
  run.stats = floor; const hp0 = maxHp(run); run.stats = before;
  run.hp += maxHp(run) - hp0;
  ['startPts', 'statFloor', 'rollSeed', 'rolled', 'rollUsed'].forEach(k => delete run[k]);
  checkMilestones(run, msgs);
  return true;
}
function rerollDraft(run, rng) { if (run.rerolls <= 0) return false; run.rerolls--; run.draft = rollDraft(run, stream(run, 'draft', rng)); run.gearDraft = rollGearDraft(run, stream(run, 'gearDraft', rng)); return true; }
// gear: the gear piece picked (one of run.gearDraft). Left out (the bot, sims), the first offer is taken.
function confirmDraft(run, ids, meta, rng, gear) {
  ids.forEach(id => addPiece(run, id, []));
  const g = (run.gearDraft || []).includes(gear) ? gear : (run.gearDraft || [])[0];
  if (g) addPiece(run, g, []);
  run.gearDraft = [];
  run.draft = [];
  run.shop = null; run.locks = null; refreshShop(run, stream(run, 'shop', rng));
  enterChoose(run, meta, rng);
}
function enterChoose(run, meta, rng, msgs) {
  run.scouted = false; run.wagerOn = false; run.chosen = null;
  run.visit = (run.visit || 0) + 1;
  const inc = income(run); run.gold += inc; run.lastIncome = inc;
  if (run.visit > 1) refreshShop(run, stream(run, 'shop', rng));
  run.freeRerolls = (hasGift(run, 'gacha') ? 1 : 0) + (run.milestones.LUK ? 1 : 0);
  run.haggle = hasGift(run, 'haggler');
  if (hasGift(run, 'f_debt') && !run.elite && (run.round === 3 || run.round === 6) && run.debtPaid !== run.round) { run.debtPaid = run.round; const d = Math.min(10, run.gold); run.gold -= d; msgs && msgs.push({ t: 'loss', text: `[The Trickster collects their debt: −${d} gold.]` }); }
  checkMilestones(run, msgs);
  if (run.pulsed !== run.round) { run.pulsed = run.round; const pulse = worldPulse(run, stream(run, 'pulse', rng)); if (pulse) { run.log.push({ t: 'sys', text: pulse }); msgs && msgs.push({ t: 'sys', text: pulse }); } }
  (run.quests || []).forEach(q => { if (!q.done && !q.failed && QUESTS[q.id].by && run.round > QUESTS[q.id].by) { q.failed = true; msgs && msgs.push({ t: 'loss', text: `[Quest failed: ${QUESTS[q.id].text}]` }); } });
  if (!run.elite && run.round >= 5 && !run.extraGiven) { run.extraGiven = true; run.pending.push({ type: 'gift', offers: extraGiftOffers(run, stream(run, 'loot', rng)) }); msgs && msgs.push({ t: 'class', text: '[Milestone reached. Additional Gift granted.]' }); }
  dueChainEvents(run).forEach(k => { if (!run.pending.some(p => p.type === 'event' && p.key === k)) pushEvent(run, k, rng); });
  [crisisDue(run), visitDue(run), clashDue(run)].forEach(k => { if (k && !run.pending.some(p => p.type === 'event' && p.key === k)) pushEvent(run, k, rng); });
  if (run.elite) { run.wager = null; toDistrict(run, rng); return; }
  run.choices = makeChoices(run, meta, stream(run, 'opps', rng));
  const tr = run.choices.find(c => c.kind === 'trial'); if (tr) msgs && msgs.push({ t: 'class', text: trialLine(tr.to, 0, tr.cond) });
  const sm = run.choices.find(c => c.summoned && c.say); if (sm) msgs && msgs.push({ t: 'class', text: sm.say });
  run.wager = makeWager(run, stream(run, 'opps', rng));
  if (silent(run)) run.wager = null; // drawn anyway, so a Silence world's seeded opponents match everyone else's
  run.stage = 'choose';
}
// Each round: choose an opponent, visit a district, shop, fight. The district comes first, so the shop's exit is the fight.
function toDistrict(run, rng) { run.stage = 'district'; run.districts = rollDistricts(run, stream(run, 'opps', rng)); }
function leaveShop(run, rng, msgs) { questEvent(run, 'shop', {}, msgs); run.stage = 'ready'; }
function useDistrict(run, k, rng) { if (!run.districts.includes(k)) return false; if (run.districts.length > 3 && customOf(run, 'pilgrims')) customPaid(run, run.log); if (k === 'enchanter' && customOf(run, 'archive')) customPaid(run, run.log); run.districts = []; run.stage = 'shop'; notePick(run, 'd:' + k); if (k === 'scout') { run.scouted = true; if (districtUp(run, k)) run.nextFlags.foeWeaken = 1; } if (k === 'undercity') pushEvent(run, undercityEvent(run, stream(run, 'event', rng)), rng); return true; }
// District upgrades from stats: the stat that improves each district, at STAT_EASY
const DISTRICT_STAT = { infirmary: 'VIT', scout: 'AGI', enchanter: 'INT' };
function districtUp(run, k) { return !!DISTRICT_STAT[k] && effStats(run)[DISTRICT_STAT[k]] >= STAT_EASY; }

// ---------- Fighters ----------
function skillStat(def) { return def.basic ? null : ARCH[def.tags[0]].stat; }
function skillPower(def, s, star) { const stat = def.basic ? Math.max(s.STR, s.AGI) : s[skillStat(def)]; return (1 + 0.07 * stat) * STAR_MULT[star || 1]; }
function fighterSkills(barPieces, s, P) {
  const out = [];
  const atk = P.swordSaint ? Object.assign({}, SKILLS.attack, { name: "Heaven's Edge", rank: 'S', fx: { dmg: 12, pierce: 1 } }) : SKILLS.attack;
  out.push({ key: 'attack', def: atk, power: skillPower(SKILLS.attack, s, 1), cd: 0, star: 1 });
  barPieces.forEach((p, i) => {
    if (!p || !SKILLS[p.id]) return;
    const def = moddedDef(p.id, p.mods);
    if (P.extraHit && (def.fx.hits || 1) >= 2) def.fx.hits = def.fx.hits + 1;
    if (def.quick && P.quickCd) def.cd = Math.max(1, def.cd - P.quickCd);
    const fin = STAT_FACES.INT.finesse; // INT's Finesse: long cooldowns shorten
    if (!def.quick && def.cd >= fin.cdFrom) def.cd = Math.max(fin.cdMin, def.cd - Math.floor((s.INT || 0) / fin.cdEvery));
    if (!def.quick && P.arcCd && def.cd > 1) def.cd = Math.max(1, def.cd - Math.floor(s.INT / P.arcCd)); // Arcanist: INT shortens cooldowns
    const mighty = P.mighty && ['reaper', 'storm'].includes(def.tags[0]) ? 1 + P.mighty : 1;
    out.push({ key: 's' + i, u: p.u, def, mods: p.mods, star: p.star, power: skillPower(def, s, p.star) * def.powerMult * mighty, cd: 0, unstable: def.unstable ? { name: def.name, cd: def.cd } : null });
  });
  if (P.copycat) out.push({ key: 'copycat', def: { id: 'copycat', name: 'Copycat', tags: [], rank: 'S', cd: 99, fx: { copy: 1 }, cheat: true }, power: skillPower(SKILLS.attack, s, 1), cd: 0, star: 1 });
  return out;
}
function blankFighter(o) { return Object.assign({ block: 0, burn: 0, poison: 0, bleed: 0, weaken: 0, empower: 0, stun: 0, evade: 0, thorns: 0, critNext: false, marked: 0, brokenT: 0, P: {}, uses: 0 }, o); }
function buildPlayer(run) {
  const s = effStats(run), P = runP(run), mh = maxHp(run);
  if (P.stormBreak) P.stunDmg += s.STR; // Stormcaller: Stuns and Interrupts scale with STR
  return blankFighter({
    side: 'A', name: run.name || 'You', isPlayer: true, maxHp: mh, hp: Math.min(run.hp, mh), poison: run.nextFlags.poison || 0, burn: run.nextFlags.burn || 0, bleed: run.nextFlags.bleed || 0, P,
    crit: 0.05 + STAT_FACES.LUK.finesse.crit * s.LUK + (P.critBonus || 0), critMult: P.critMult || 1.5, dodge: Math.min(0.25, STAT_FACES.AGI.finesse.dodge * s.AGI + (P.dodge || 0)), skills: fighterSkills(run.bar, s, P),
    breath: hasGift(run, 'breath') && !run.usedBreath, weaken: (P.sluggish ? 1 : 0) + (run.nextFlags.weaken || 0), empower: run.nextFlags.empower || 0, lastWords: P.lastWords || 0, str: s.STR,
    res: resistOf(s), healFin: STAT_FACES.VIT.finesse.heal * s.VIT,
  });
}
function lateRamp(run) { return run.elite ? 1 : 1 + TUNE.late * Math.max(0, run.round - 4); }
// The System's notice: +TUNE.notice per straight win, never in the Elite bracket or practice
function noticeOf(run) { return run.elite || run.practice || run.noticeOff ? 0 : Math.min(TUNE.noticeMax, run.notice || 0); }
function noticeMul(run) { return 1 + TUNE.notice * noticeOf(run); }
function noticePct(run) { return Math.round(TUNE.notice * noticeOf(run) * 100); }
function amendOf(run) { return run.amend && !run.elite && !run.practice ? AMENDMENTS[run.amend] || {} : {}; }
function enemyPower(run) { return roundPower(curRound(run)) * curveOf(run, 'dmg') * rankMul(run) * lateRamp(run) * noticeMul(run) * (amendOf(run).foeDmg || 1); }
function enemyHpMul(run) { return roundHp(curRound(run)) * curveOf(run, 'hp') * rankMul(run) * (amendOf(run).foeHp || 1); }
function buildEnemy(run, spec) {
  const alpha = spec.kind === 'monster' ? (spec.hard ? TUNE.alpha : 1) * (1 + TUNE.monsterRamp * (run.round - 1)) : 1;
  const at = spec.kind === 'trial' ? trialMul(run, spec) : 1;
  const gate = spec.gate ? TUNE.gate : 1;
  const p = enemyPower(run) * at * (spec.hard ? TUNE.hard : 1) * alpha * gate, hm = enemyHpMul(run) * at * (spec.hard ? TUNE.hardHp : 1) * alpha * gate;
  if (spec.kind === 'erased' || spec.kind === 'champion' || spec.kind === 'entrant') { const e = buildSnapEnemy(spec.snap, p, hm, run, spec.kind === 'entrant'); e.weaken += run.nextFlags.foeWeaken || 0; e.poison += run.nextFlags.foePoison || 0; e.burn += run.nextFlags.foeBurn || 0; if (run.nextFlags.foeHp) e.hp = Math.max(1, Math.round(e.hp * run.nextFlags.foeHp)); return e; }
  if (spec.kind === 'final' && spec.snap) return buildFinalist(run, spec, p, hm);
  const t = ENEMIES[spec.id];
  const fin = t.tier === 3, mp = p * (fin ? TUNE.finalDmg : 1);
  const mhp = Math.round(t.hp * hm * (fin ? TUNE.finalHp : 1));
  let hp = mhp; if (run.nextFlags.bribe) hp = Math.round(hp * 0.8); if (spec.sabotaged) hp = Math.round(hp * 0.85); if (spec.kind === 'final' && run.finalCut) hp = Math.round(hp * (1 - run.finalCut)); if (run.nextFlags.foeHp) hp = Math.max(1, Math.round(hp * run.nextFlags.foeHp));
  if (run.nextFlags.foeTraits) spec = Object.assign({}, spec, { traits: (spec.traits || []).concat(run.nextFlags.foeTraits.filter(k => !(spec.traits || []).includes(k))) });
  return blankFighter(Object.assign({
    side: 'B', name: specName(spec), id: spec.id, hard: !!spec.hard, maxHp: mhp, hp, crit: 0.04, critMult: 1.5, dodge: 0, script: t.script, scriptIdx: 0, turns: 0,
    skills: t.skills.map((x, i) => enemyMove(x, i, mp)), movePower: mp, power: p, phase: t.phase || (spec.gate ? gatePhase(t) : null), P: enemyPassives(t.passives, p),
    weaken: (spec.sabotaged ? 3 : 0) + (run.nextFlags.foeWeaken || 0), poison: run.nextFlags.foePoison || 0, burn: run.nextFlags.foeBurn || 0,
  }, enemyTraits(t, p), poolTraits(spec, t, p)));
}
// A finalist: another player's round-8 build at its own strength, with its world's Final Champion's mechanic on top
// (the Storm Herald, whose mechanic is its moves, lends an enrage instead) and the final's own effects (bribes, tampering).
function buildFinalist(run, spec, p, hm) {
  const t = ENEMIES[spec.id], e = buildSnapEnemy(spec.snap, p, hm, run, true), own = enemyTraits(t, p);
  Object.assign(e, Object.keys(own).length ? own : { enrage: 0.5, enrageMult: 1.3 }, poolTraits(spec, t, p));
  e.P = Object.assign({}, e.P); Object.entries(enemyPassives(t.passives, p)).forEach(([q, v]) => e.P[q] = (e.P[q] || 0) + v);
  e.weaken += run.nextFlags.foeWeaken || 0; e.poison += run.nextFlags.foePoison || 0; e.burn += run.nextFlags.foeBurn || 0;
  if (run.nextFlags.bribe) e.hp = Math.round(e.hp * 0.8); if (run.finalCut) e.hp = Math.round(e.hp * (1 - run.finalCut));
  if (run.nextFlags.foeHp) e.hp = Math.max(1, Math.round(e.hp * run.nextFlags.foeHp));
  return e;
}
// A spec's traits from the pool, on top of the enemy's own: passives add up; for a trait it already has, the
// stronger value counts (every how many turns: the more often)
function poolTraits(spec, t, p) {
  if (!spec.traits || !spec.traits.length) return {};
  const o = { P: enemyPassives(t.passives, p) }, own = enemyTraits(t, p);
  spec.traits.forEach(k => {
    const T = TRAIT_POOL[k]; if (!T) return;
    Object.entries(enemyPassives(T.passives, p)).forEach(([q, v]) => o.P[q] = (o.P[q] || 0) + v);
    Object.entries(enemyTraits(T.traits || {}, p)).forEach(([q, v]) => { const was = o[q] != null ? o[q] : own[q]; o[q] = was == null ? v : q === 'flood' || q === 'twincast' ? Math.min(was, v) : Math.max(was, v); });
  });
  return o;
}
// A Gatekeeper without a phase of its own digs in at half HP: from then on it deals 30% more damage (more if it already enrages)
function gatePhase(t) { return { at: 0.5, say: `[${t.name} will not let you pass. The Gatekeeper digs in.]`, set: { enrage: 1, enrageMult: Math.max(1.3, t.enrageMult || 0) } }; }
function enemyMove(x, i, power) { return { key: 'e' + i, def: { id: 'e' + i, name: x.n, fx: x.fx, tags: [], label: x.label }, power, cd: 0 }; }
// The trait library: fields on an enemy (or in its phase's set) that give it a signature. What each does is in
// docs/CONTENT.md, "Enemy traits". Amounts that deal or block damage scale with the enemy's power, like its moves.
const ENEMY_TRAITS = ['enrage', 'enrageMult', 'dodge', 'adapt', 'flood', 'aura', 'revive', 'briar', 'twincast', 'forge', 'jinxTax', 'showNext', 'hexer'];
function enemyTraits(t, p) {
  const o = {};
  ENEMY_TRAITS.forEach(k => { if (t[k] != null) o[k] = t[k]; });
  if (o.enrage && !o.enrageMult) o.enrageMult = 1.5;
  if (o.aura) o.aura *= p; if (o.briar) o.briar *= p; if (o.forge) o.forge = Math.round(o.forge * p);
  return o;
}
// Enemy passives: the effects marked enemy in effects.js, the ones that work on either side. Flat amounts scale
// with the enemy's power; rates and multipliers don't.
const ENEMY_PASSIVES = {}; Object.keys(EFFECTS).filter(k => EFFECTS[k].enemy).forEach(k => ENEMY_PASSIVES[k] = EFFECTS[k].enemy);
function enemyPassives(o, p) { const P = {}; Object.entries(o || {}).forEach(([k, v]) => P[k] = ENEMY_PASSIVES[k] === 'flat' ? Math.round(v * p) : v); return P; }
// Boss phases: once at or below phase.at of max HP, the enemy says phase.say, learns the moves in phase.add, takes the
// traits in phase.set and starts phase.script (if it has one) from its first move. The move already shown as its intent still happens
// as shown: when the line is crossed on your turn, the new traits wait until that move is done.
function checkPhase(f, B, playerTurn) {
  const ph = B.phase; if (!ph || B.phased || B.hp <= 0 || B.hp > B.maxHp * ph.at) return false;
  B.phased = true;
  (ph.add || []).forEach(x => B.skills.push(enemyMove(x, B.skills.length, B.movePower)));
  if (playerTurn) B.phaseFresh = true; else phaseTraits(B);
  if (ph.script) { B.script = ph.script; B.scriptIdx = 0; }
  // A duo's partner tags in: a new name, and (clear) none of the Burn, Poison or Bleed that was on the first
  if (ph.swap) { B.name = ph.swap.name + (B.hard ? ', Veteran' : ''); if (ph.swap.clear) { B.burn = 0; B.poison = 0; B.bleed = 0; } }
  say(f, ph.say, 'loss'); ev(f, { k: 'phase', side: B.side });
  return true;
}
function phaseTraits(B) { Object.assign(B, enemyTraits(B.phase.set || {}, B.power)); }
function snapshot(run) {
  const s = effStats(run), R = run.record;
  const snap = {
    champ: run.champ, name: run.name, sigil: run.sigil, color: run.color, worldName: run.world.name, worldType: run.world.type, worldFate: run.world.fate || null, worldPeople: run.world.people || null, worldMix: run.world.mix || null, path: run.path,
    stats: s, level: run.level, maxHp: maxHp(run), round: run.round, gifts: run.gifts.filter(k => GIFTS[k].cat !== 'flaw' && k !== 'copycat'), title: run.title, milestones: run.milestones,
    history: (run.history || []).slice(), cause: run.cause || null, hearts: run.hearts, maxHearts: run.maxHearts, wins: run.wins, elite: run.eliteWins || 0, entrant: run.entrant, hiddenPath: run.hiddenPath,
    bar: run.bar.filter(Boolean).map(p => ({ id: p.id, star: p.star, mods: p.mods.slice() })), gear: GEAR_SLOTS.map(sl => run.gear[sl]).filter(Boolean).map(p => p.roll ? { id: p.id, star: p.star, roll: p.roll } : { id: p.id, star: p.star }), at: Date.now() + Math.floor(Math.random() * 1000),
  };
  if (R) snap.rec = Object.assign({ w: run.world.type, ids: R.ids.slice(), lost: R.lost, partial: R.partial, bio: Object.assign({}, R.bio) }, layersOf(R));
  return snap;
}

// ---------- Entrant pool ----------
// Async opponents in the style of Oaken Tower. The pool holds POOL_SIZE builds for each of rounds 1 to POOL_ROUNDS. Each
// round the hard opponent is drawn from it: the game rolls a slot from 1 to 30 for your round and you fight the build
// saved there, at its own strength. After the fight, your build as it walked into that round replaces a random slot for
// the round (ui.js poolUpload, firestore.rules pool/{round}_{slot}). A slot no player has filled yet holds the System's
// reserve build (js/content/pool.js), so there is always someone to fight. Pending World (every Entrant faces the same
// fights), practice runs and the elite bracket never use the pool.
const POOL_SIZE = 30, POOL_ROUNDS = 7;
const POOL = { off: false }; // tools/pool-seed.js turns it off to make the reserves
// Rounds 1 to POOL_ROUNDS draw their hard opponent from the pool; the final (round ROUNDS) draws a finalist for the paired world
function poolOn(run) { return !POOL.off && !run.seed && !run.practice && !run.script && !run.elite && run.round >= 1 && (run.round <= POOL_ROUNDS || run.round === ROUNDS); }
function poolSlot(rng) { return 1 + Math.floor(rnd(rng) * POOL_SIZE); }
function poolId(round, slot) { return round + '_' + slot; }
// What the pool keeps of a build: what it fights with, plus its champion's name, crest and rank letter. No fight
// history, World Record or account details.
const POOL_KEYS = ['champ', 'name', 'sigil', 'color', 'worldName', 'worldType', 'worldFate', 'worldPeople', 'worldMix', 'path', 'stats', 'level', 'maxHp', 'round', 'gifts', 'title', 'milestones', 'hiddenPath', 'entrant', 'bar', 'gear', 'at', 'rank'];
function poolSnap(run) {
  const x = snapshot(run), o = {};
  if (META && META.rank) x.rank = META.rank.letter;
  POOL_KEYS.forEach(k => { if (x[k] != null) o[k] = x[k]; });
  return o;
}
// The System's reserve for a slot, from js/content/pool.js. Its at (round × 100 + slot) can't clash with a real build's time.
function poolReserve(round, slot) {
  const b = (POOL_SEED[round - 1] || [])[slot - 1] || (POOL_SEED[round - 1] || [])[0];
  if (!b) return null;
  const stats = {}; STATS.forEach((k, i) => stats[k] = b.s[i]);
  const milestones = {}; (b.m || []).forEach(k => milestones[k] = true);
  const snap = sanitizeSnap({ champ: b.n + ' of ' + b.w, name: b.n, sigil: slot % 6, color: (slot * 5) % 6, worldName: b.w, worldType: b.wt, worldFate: b.wf, worldPeople: b.wp, worldMix: b.wx, path: b.p || null, stats, level: b.l, maxHp: b.hp, round,
    gifts: b.g || [], title: b.t || null, milestones, hiddenPath: b.h || null, entrant: 1000 + round * 100 + slot,
    bar: b.b.map(([id, star, mods]) => ({ id, star, mods: mods || [] })), gear: b.e.map(([id, star]) => ({ id, star })), at: round * 100 + slot });
  snap.reserve = true;
  return snap;
}
// The hard opponent for a round: the reserve stands in until the page reads the slot (poolFill) and finds a player's build
function poolSpec(round, slot) { return { kind: 'entrant', hard: true, round, slot, snap: poolReserve(round, slot) }; }
// A player's build read from the pool. Untrusted, so it goes through sanitizeSnap, and it always fights in its own round.
function poolFill(spec, data, me) {
  if (!data || !data.snap || !data.owner || data.owner === me || data.hearts === 0) return false; // an erased record leaves its slot to a reserve
  const snap = sanitizeSnap(data.snap, String(data.owner).slice(0, 128));
  if (!snap || !snap.bar.length) return false;
  snap.round = spec.round;
  spec.snap = snap; spec.fileAt = Number(data.at) || 0;
  spec.hearts = Math.max(1, Math.min(POOL_HEARTS, Math.round(Number(data.hearts)) || POOL_HEARTS));
  return true;
}
// The final's finalist, from the round's list of filed records: one from a world of the paired type, still standing,
// never your own. docs: [{ id, data }]. False leaves the paired world's Final Champion in place.
function finalFill(spec, docs, me, rng) {
  const ok = (docs || []).filter(d => d && d.data && d.data.snap && d.data.owner && d.data.owner !== me && d.data.hearts > 0 && d.data.snap.worldType === typeOfFinal(spec.id));
  if (!ok.length) return false;
  const d = ok[Math.floor(rnd(rng) * ok.length)], slot = Number(String(d.id).split('_')[1]) || 1;
  const snap = sanitizeSnap(d.data.snap, String(d.data.owner).slice(0, 128));
  if (!snap || !snap.bar.length) return false;
  snap.round = spec.round; spec.snap = snap; spec.slot = slot; spec.fileAt = Number(d.data.at) || 0;
  spec.hearts = Math.max(1, Math.min(POOL_HEARTS, Math.round(Number(d.data.hearts)) || POOL_HEARTS));
  return true;
}
const typeOfFinal = id => Object.keys(WORLD_TYPES).find(k => WORLD_TYPES[k].final === id);
// The other half of the paired final: what your result does to the paired world and its finalist's record
function finalResolve(run, spec, won, res, msgs) {
  const P = pairOf(run), them = spec.snap ? spec.snap.worldName || P.name : P.name, real = spec.snap && !spec.snap.reserve && spec.snap.owner;
  if (!run.pair) return;
  if (won) {
    msgs.push({ t: 'broadcast', text: `[${them} is erased in this tournament. Outcomes vary.]` });
    if (real) res.poolHit = { owner: spec.snap.owner, champ: spec.snap.champ, round: spec.round, slot: spec.slot, at: spec.fileAt || 0, hearts: spec.hearts == null ? POOL_HEARTS : spec.hearts };
  } else if (real) res.poolWon = { owner: spec.snap.owner, champ: spec.snap.champ, round: spec.round };
}
// Worlds trade fragments. Beat a record and you take a fragment of its world: a lost Heart back (with its World Record
// entry), or, at full Hearts, one of its pieces. Lose and its world takes a piece of yours (the Hearts you lose anyway).
// A player's record also loses one of its POOL_HEARTS; at zero it is erased from the pool and its owner is told (ui.js).
// res.poolHit: you beat a player's record. res.poolWon: a player's record beat you, which earns its owner Echoes.
const POOL_HEARTS = 3;
function poolResolve(run, spec, won, res, msgs, lr) {
  const s = spec.snap, world = s.worldName || 'another world', real = !s.reserve && s.owner;
  if (won) {
    if (run.hearts < run.maxHearts && TUNE.poolFragment) {
      const b = run.hearts; run.hearts = Math.min(run.maxHearts, run.hearts + TUNE.poolFragment); restoreRecord(run, run.hearts - b);
      msgs.push({ t: 'loot', text: s.reserve ? `[Traded for a piece of ${world}, erased long ago. Your record recovers an entry: +${run.hearts - b} Heart, ${run.hearts} left.]` : `[Traded for a piece of ${world}. Your record recovers an entry: +${run.hearts - b} Heart, ${run.hearts} left.]` });
    } else {
      const p = pick(s.bar.concat(s.gear), lr), id = p && baseId(p.id);
      if (id && pieceDef(id) && !pieceDef(id).basic) { msgs.push({ t: 'loot', text: `[You took a piece of ${world}: ${pieceDef(id).name}.]` }); addPiece(run, id, p.mods || [], msgs); }
    }
    if (real) res.poolHit = { owner: s.owner, champ: s.champ, round: spec.round, slot: spec.slot, at: spec.fileAt || 0, hearts: spec.hearts == null ? POOL_HEARTS : spec.hearts };
  } else {
    msgs.push({ t: 'loss', text: `[${s.reserve ? 'The record of an erased world' : world + "'s record"} took a piece of ${run.world.name}.]` });
    if (real) res.poolWon = { owner: s.owner, champ: s.champ, round: spec.round };
  }
}
// The choice screen's line for a filed record. by: the name its owner chose to show other players, when the page has it.
// The lore: there are more worlds than the System has time for, so worlds at the same stage are judged by their
// champions' records. A reserve is the record of a champion whose world was already erased.
function poolStyle(spec, by) {
  const s = spec.snap, as = s.path ? `Builds as a ${ARCH[s.path].path}` : 'No Path yet';
  if (s.reserve) return `Record of an erased world's champion, round ${spec.round}. ${as}`;
  const h = spec.hearts == null ? POOL_HEARTS : spec.hearts;
  return `${s.worldName}'s round ${spec.round} record${by ? ` (${by})` : ''}, ${h} Heart${h === 1 ? '' : 's'} left. ${as}`;
}
// What the System says as a filed record enters the arena
function poolIntro(spec) {
  const s = spec.snap;
  if (s.reserve) return `[Judgement by record, round ${spec.round}. No living record on file. Issuing the record of an erased world's champion.]`;
  return `[Judgement by record, round ${spec.round}. ${s.worldName}'s champion cannot attend. Their round ${spec.round} record will fight in their place.]`;
}
// A returning champion is scaled up to the round it meets you in. An Entrant from the pool (asIs) was saved at this very
// round, so it fights at its own strength with its own max HP.
function buildSnapEnemy(snap, p, hm, run, asIs) {
  const scale = asIs ? TUNE.poolDmg : Math.max(1, p / roundPower(snap.round || 1));
  const hscale = asIs ? TUNE.poolHp / 1.15 : Math.max(1, hm / roundHp(snap.round || 1));
  const P = buildP(snap.bar, snap.gear, snap.gifts, {}, snap.level, { title: snap.title, milestones: snap.milestones });
  const skills = fighterSkills(snap.bar, snap.stats, P).map(x => { x.def = Object.assign({}, x.def, { quick: false }); x.power *= scale; return x; });
  const mh = Math.round(snap.maxHp * hscale * 1.15);
  return blankFighter({ side: 'B', name: snap.champ, maxHp: mh, hp: mh, crit: 0.05 + 0.015 * snap.stats.LUK + (P.critBonus || 0), critMult: P.critMult || 1.5, dodge: Math.min(0.2, 0.01 * snap.stats.AGI + (P.dodge || 0)), skills, smart: true, P, turns: 0 });
}

// ---------- Combat ----------
function newFight(run, rng) {
  const spec = currentSpec(run);
  const A = buildPlayer(run), B = buildEnemy(run, spec);
  // The page uploads this to the Entrant pool once the fight is over (ui.js poolUpload)
  if (poolOn(run)) run.poolUp = { round: run.round, snap: poolSnap(run) };
  B.breakMax = Math.round(B.maxHp * BREAK.share); B.brk = 0;
  // How many rank letters the opponent stands above the Entrant (Entrant Rank), for Rank Is Just a Letter
  const foeRank = !run.practice && META && META.rank && specRank(spec, META); B.rankUp = foeRank ? rankIdx(foeRank) - rankIdx(META.rank.letter) : 0;
  const f = {
    rng: stream(run, 'fight', rng) || Math.random, turn: 1, A, B, phase: 'player', over: false, winner: null, events: [], log: [], useCounts: {}, lastPlayerSkill: null, dealt: {},
    tally: { breaks: 0, burn: 0, maxPoison: 0, bigHit: 0, blocked: 0, turns: 0, healed: 0, reactions: 0, bigStopped: 0, mostUsed: null, hurtBy: {}, taken: 0, stuns: 0, quickTurn: 0, maxQuick: 0, overkill: 0 },
    spec, bloodmoon: run.world.mod === 'bloodmoon', startHp: run.hp, rx: [], lastEnemySkill: null,
    foresight: hasGift(run, 'appraisal') || hasGift(run, 'foresight') || run.scouted || (spec.kind === 'final' && (run.finalTip || (run.chains && run.chains.official === 'tip'))),
  };
  [A, B].forEach(X => {
    const P = X.P;
    X.block += (P.startBlock || 0) + Math.round((P.startBlockPct || 0) * X.maxHp);
    if (P.firstCrit) X.critNext = true;
    if (P.firstEvade) X.evade += 1;
    if (P.startPoison) (X === A ? B : A).poison += P.startPoison;
    X.rerolls = P.rerolls || 0; X.firstSix = !!P.firstSix; X.sleeve = !!P.sleeveFix; X.jackpots = 0;
    X.curse = Math.min(CURSE_MAX, P.startCurse || 0); X.misfortune = 0; X.omens = [];
    X.quickFree = P.quickFree || 0; X.firstFree = !!P.firstFree; X.firstStun = !!P.firstStun; X.firstHit = P.firstHit || 0;
  });
  GEAR_SLOTS.forEach(k => { const g = run.gear[k]; if (g && GEAR[g.id] && GEAR[g.id].rolling && GEAR[g.roll]) say(f, `[${GEAR[g.id].name} reads as ${GEAR[g.roll].name}: ${gearText(g.roll, g.star)}]`, 'skill'); });
  // Overflow from your last win: the overkill lands before this fight starts (at most a quarter of their HP)
  if (run.overflow > 0 && !run.practice) { const v = Math.min(run.overflow, Math.round(B.maxHp * 0.25)); B.hp -= v; say(f, `[Overflow: ${v} damage carried over from your last fight.]`, 'skill'); }
  if (A.P.startMisf) B.misfortune += A.P.startMisf; // Black Cat Collar
  if (A.P.firstJinx || run.nextFlags.jinxFirst) B.jinxed = true; // The Crow; feeding the cat
  A.isJinx = A.skills.some(s => s.def.tags && s.def.tags.includes('jinx')) || !!A.P.jinxCheap; // the Jinx button needs a Jinx skill
  planIntent(f, B);
  startTurn(f, A, true);
  return f;
}
function opp(f, X) { return X === f.A ? f.B : f.A; }
function say(f, text, t) { f.log.push({ text, t: t || 'sys' }); if (f.log.length > 40) f.log.shift(); }
function ev(f, e) { f.events.push(e); }
function half(X) { return X.hp < X.maxHp / 2; }

function dmgMult(f, X, Y) {
  const P = X.P;
  let m = 1;
  if (X.weaken > 0) m *= 1 - 0.3 * (1 - resistance(X, 'weaken'));
  if (X.empower > 0) m *= 1.3;
  if (f.bloodmoon) m *= 1.2;
  if (X.enrage && X.hp / X.maxHp <= X.enrage) m *= X.enrageMult;
  if (P.dmgPct) m *= 1 + P.dmgPct;
  if (X.curse) m *= 1 + CURSE_DMG * X.curse; // Curse: your skills hit harder
  if (P.lowHpDmg && half(X)) m *= 1 + P.lowHpDmg;
  if (Y) {
    if (P.vsHalf && half(Y)) m *= 1 + P.vsHalf;
    if (P.execBonus && Y.hp / Y.maxHp <= 0.3) m *= 1 + P.execBonus;
    if (Y.marked > 0) m *= 1.3;
    if (Y.brokenT > 0) m *= 1.5;
    if (P.vsBigger && Y.maxHp > X.maxHp) m *= 1 + P.vsBigger;
    if (P.vsHard && Y.hard) m *= 1 + P.vsHard;
    if (P.vsHigherRank && Y.rankUp > 0) m *= 1 + P.vsHigherRank;
    if (P.vsDisabled && (Y.stun > 0 || Y.weaken > 0)) m *= 1 + P.vsDisabled;
    if (P.burnExec && Y.burn > 0 && half(Y)) m *= 1 + P.burnExec;
  }
  if (P.blockDmgPct) m *= 1 + Math.min(0.4, X.block / 200);
  if (P.countdown) m *= 0.8; // Countdown Collar (experimental)
  return m;
}
function hit(f, X, Y, raw, o = {}) {
  if (Y.hp <= 0) return 0;
  if (!o.noDodge && Y.evade > 0) { Y.evade--; ev(f, { k: 'miss', side: Y.side, text: 'Evaded' }); if (Y.isPlayer) f.tally.missed = (f.tally.missed || 0) + 1; return 0; }
  if (!o.noDodge && rnd(f.rng) < Y.dodge) { ev(f, { k: 'miss', side: Y.side, text: 'Dodged' }); if (Y.isPlayer) f.tally.missed = (f.tally.missed || 0) + 1; return 0; }
  let d = raw, crit = false;
  if (!o.noCrit && (o.alwaysCrit || X.critNext || rnd(f.rng) < X.crit + (o.critBonus || 0))) { crit = true; d *= X.critMult; X.critNext = false; X.lastCrit = true; }
  if (o.resist) d *= o.resist;
  if (Y.P.lowDR && Y.hp < Y.maxHp * 0.25) d *= 1 - Y.P.lowDR;
  if (Y.P.flatDR && !o.isThorns) d -= Y.P.flatDR;
  if (Y.curse) d *= 1 + CURSE_TAKEN * Y.curse; // Curse: and so do theirs
  d = Math.max(0, Math.round(d));
  // Delay Engine (experimental): the hit is stored, to strike all at once later (startTurn)
  if (X.P.suspend && !o.released && !o.isThorns) { X.bank = (X.bank || 0) + d; ev(f, { k: 'miss', side: Y.side, text: 'Stored' }); return 0; }
  let absorbed = 0;
  if (!o.pierce) { absorbed = Math.min(Y.block, d); Y.block -= absorbed; }
  const rest = d - absorbed;
  if (absorbed > 0 && rest === 0 && Y.P.blockMisf && !o.isThorns) addMisfortune(f, X, Y.P.blockMisf); // Bad Landing
  // Pain Link (experimental): every hit is split evenly between both fighters
  if ((X.P.painLink || Y.P.painLink) && rest > 1) { const share = Math.floor(rest / 2); Y.hp -= rest - share; X.hp -= share; ev(f, { k: 'hit', side: X.side, amt: share, blocked: 0, thorns: true }); }
  else Y.hp -= rest;
  // Mirror Cuirass (experimental): once per fight, below the line, the two fighters' HP shares trade places
  if (Y.P.swapHp && !Y.swapped && Y.hp > 0 && X.hp > 0 && Y.hp < Y.maxHp * Y.P.swapHp) { Y.swapped = true; const a = Y.hp / Y.maxHp, b = X.hp / X.maxHp; Y.hp = Math.round(b * Y.maxHp); X.hp = Math.max(1, Math.round(a * X.maxHp)); say(f, `[Mirror Cuirass: HP reflected. ${Y.isPlayer ? 'You' : Y.name} ${Math.round(b * 100)}%, ${X.isPlayer ? 'you' : X.name} ${Math.round(a * 100)}%.]`, 'class'); }
  if (X.P.reapBlood && !Y.bloodied && Y.hp > 0 && half(Y)) { Y.bloodied = true; heal(f, X, X.maxHp * X.P.reapBlood); say(f, '[Reaper: first blood. You feed on it.]', 'class'); } // Reaper: heal on bringing a foe below half
  if (Y.isPlayer) { f.tally.blocked += absorbed; f.tally.taken += rest; if (o.src) f.tally.hurtBy[o.src] = (f.tally.hurtBy[o.src] || 0) + rest; }
  if (X.isPlayer) { f.tally.bigHit = Math.max(f.tally.bigHit, d); if (o.src) f.dealt[o.src] = (f.dealt[o.src] || 0) + rest; if (Y.hp <= 0) f.tally.overkill = Math.max(f.tally.overkill, -Y.hp); }
  if (Y.lastWords && Y.hp > 0 && Y.hp < Y.maxHp * 0.25 && !Y.lwUsed) { Y.lwUsed = true; const b = Math.round(Y.maxHp * Y.lastWords); Y.block += b; say(f, `[Last Words: +${b} Block.]`, 'class'); }
  if (Y.P.blockStun && absorbed > 0 && !o.isThorns && X.hp > 0 && X.stunT !== f.turn && rnd(f.rng) < Y.P.blockStun) { X.stunT = f.turn; say(f, '[Thunder Wall: Stun!]', 'skill'); stunTarget(f, Y, X); }
  if (!o.isThorns && rest > 0) addBreak(f, X, Y, rest * (o.heavy ? BREAK.heavy : 1));
  ev(f, { k: 'hit', side: Y.side, amt: rest, blocked: absorbed, crit, tag: o.tag });
  if (!o.isThorns && X.hp > 0) {
    const th = ((Y.thorns || 0) + (Y.P.thornsAlways ? Y.P.thornsAlways * (half(Y) ? 2 : 1) : 0)) * (Y.P.thornMult || 1);
    if (th > 0) { if (Y.P.thornBurn) addStatus(f, Y, X, 'burn', Y.P.thornBurn); if (Y.P.thornPoison) addStatus(f, Y, X, 'poison', Y.P.thornPoison); }
    if (th > 0) { const t = Math.round(th); X.hp -= t; ev(f, { k: 'hit', side: X.side, amt: t, blocked: 0, thorns: true }); if (Y.isPlayer) f.dealt['Thorns'] = (f.dealt['Thorns'] || 0) + t; }
    if (Y.riposte > 0 && absorbed > 0) { const t = Math.round(absorbed * Y.riposte * (Y.P.thornMult || 1)); X.hp -= t; ev(f, { k: 'hit', side: X.side, amt: t, blocked: 0, thorns: true }); if (Y.isPlayer) f.dealt['Riposte'] = (f.dealt['Riposte'] || 0) + t; }
  }
  checkRevive(f, Y); checkRevive(f, X);
  return rest;
}
function checkRevive(f, X) {
  if (X.hp <= 0 && X.revive) { X.hp = Math.round(X.maxHp * X.revive); X.revive = 0; say(f, `[${X.name} rises again.]`, 'loss'); if (X.id && FOE_LINES[X.id] && FOE_LINES[X.id].rise) say(f, `"${FOE_LINES[X.id].rise}"`, 'foe'); ev(f, { k: 'revive', side: X.side }); }
  if (X.hp <= 0 && X.breath) { X.hp = 1; X.breath = false; f.usedBreath = true; say(f, '[Second Breath! You cling to life with 1 HP.]', 'class'); }
}
function heal(f, X, v) {
  if (v <= 0 || X.hp <= 0) return 0;
  v = Math.round(v * (1 + (X.P.healPct || 0) + (X.healFin || 0)));
  const b = X.hp; X.hp = Math.min(X.maxHp, X.hp + v); const h = X.hp - b;
  if (h > 0) { ev(f, { k: 'heal', side: X.side, amt: h }); if (X.isPlayer) f.tally.healed += h; }
  if (X.P.overhealBlock && v > h) X.block += v - h;
  if (X.P.healBlock && h > 0) X.block += Math.round(h * X.P.healBlock);
  if (X.P.healDmg && h > 0 && !f.inHealDmg) { const Y = opp(f, X); if (Y.hp > 0) { f.inHealDmg = true; hit(f, X, Y, h * X.P.healDmg, { noCrit: 1, noDodge: 1, pierce: 1, isThorns: true, src: 'Last Rites' }); f.inHealDmg = false; } }
  return h;
}
function gainBlock(f, X, v) {
  v = Math.round(v); if (v <= 0) return;
  X.block += v;
  if (X.P.blockThorns) X.thorns += v * X.P.blockThorns;
  if (X.P.blockStrike) { const Y = opp(f, X); if (Y.hp > 0) hit(f, X, Y, v * X.P.blockStrike, { noCrit: 1, noDodge: 1, isThorns: true, src: 'Bastion' }); }
}
// --- statuses and reactions ---
function addStatus(f, X, Y, kind, v) {
  if (v <= 0 || Y.hp <= 0) return;
  const P = X.P;
  if (kind === 'burn') { v += (P.burnPlus || 0) + (P.dotPlus || 0) + (P.burnLowDie ? lowDie(X) : 0); Y.burn += v; Y.burnFade = P.burnFade != null ? P.burnFade : 0.3; if (X.isPlayer) f.tally.burn += v; if (P.burnPoison) { Y.poison += P.burnPoison; } }
  if (kind === 'poison') { v += (P.poisonPlus || 0) + (P.dotPlus || 0); Y.poison += v; }
  if (kind === 'bleed') { v += (P.bleedPlus || 0) + (P.dotPlus || 0) + (P.bleedMisf ? P.bleedMisf * Math.floor((Y.misfortune || 0) / 3) : 0); Y.bleed += v; if (P.healOnBleed) heal(f, X, P.healOnBleed); if (P.bleedPoison) Y.poison += P.bleedPoison; }
  if (X.isPlayer) f.tally.maxPoison = Math.max(f.tally.maxPoison, Y.poison);
  react(f, X, Y, kind);
}
function reactName(f, X, Y, key, name, text) {
  f.tally.reactions += X.isPlayer ? 1 : 0;
  say(f, `[Reaction: ${name}!${text ? ' ' + text : ''}]`, 'react');
  ev(f, { k: 'reaction', side: Y.side, name });
  f.rx.push(key);
}
function react(f, X, Y, kind) {
  const RM = X.P.reactMult || 1;
  if (kind === 'burn' && Y.poison > 0 && Y.flareT !== f.turn) {
    Y.flareT = f.turn;
    const v = Y.poison * (X.P.flareFull ? 1 : 0.5) * RM;
    reactName(f, X, Y, 'flare', 'Toxic Flare', '');
    if (X.P.reactHeal) heal(f, X, X.P.reactHeal);
    hit(f, X, Y, v, { pierce: 1, noCrit: 1, noDodge: 1, isThorns: true, src: 'Toxic Flare', tag: 'flare' });
  }
  if (Y.burn > 0 && Y.bleed > 0) {
    Y.burn = Math.round(Y.burn * 2 * RM); Y.bleed = 0;
    reactName(f, X, Y, 'cauterise', 'Cauterise', 'Bleed is seared away and Burn doubles.');
    if (X.P.reactHeal) heal(f, X, X.P.reactHeal);
  }
  if (Y.bleed > 0 && Y.marked > 0 && !Y.hemo) { Y.hemo = true; reactName(f, X, Y, 'hemorrhage', 'Haemorrhage', 'Bleed deals double while Marked.'); }
  if (Y.stun > 0 && Y.weaken > 0 && Y.brokenT <= 0) { Y.brokenT = 2; reactName(f, X, Y, 'broken', 'Broken', `${Y.isPlayer ? 'You take' : Y.name + ' takes'} 50% more damage.`); }
  if (Y.poison > 0 && Y.leechT > 0 && !Y.blight) { Y.blight = true; reactName(f, X, Y, 'blight', 'Blight', 'Leech drains double. The extra is not healed.'); }
  if (Y.doomT > 1 && !Y.doomHastened && effectCount(Y) >= 2) { Y.doomHastened = true; Y.doomT--; reactName(f, X, Y, 'hastened', 'Hastened Doom', 'Doom lands a turn sooner.'); }
}
function applyStatus(f, X, Y, fx, p) {
  if (fx.burn) addStatus(f, X, Y, 'burn', Math.round(fx.burn * p));
  if (fx.poison) { const had = Y.poison > 0; addStatus(f, X, Y, 'poison', Math.round(fx.poison * p)); if (fx.doublePoison && had) Y.poison = Math.round(Y.poison * 1.5); }
  if (fx.bleed) addStatus(f, X, Y, 'bleed', Math.round(fx.bleed * p));
  if (fx.weaken) { Y.weaken = Math.max(Y.weaken, fx.weaken); if (X.P.weakPoison) addStatus(f, X, Y, 'poison', X.P.weakPoison); react(f, X, Y); }
  if (fx.stun) stunTarget(f, X, Y);
}
// The break bar fills from the player's side only; full, the enemy is Broken (a Stun with the Broken state)
function addBreak(f, X, Y, v) {
  if (!X.isPlayer || !Y.breakMax || Y.hp <= 0 || v <= 0) return;
  Y.brk += v * (1 + STAT_FACES.STR.finesse.brk * (X.str || 0));
  if (Y.brk < Y.breakMax) return;
  Y.brk = 0; f.tally.breaks++;
  say(f, `[${Y.name}'s guard breaks. Broken!]`, 'skill'); ev(f, { k: 'break', side: Y.side });
  stunTarget(f, X, Y); Y.brokenT = Math.max(Y.brokenT, 2);
  if (X.P.breakEmpower) { X.empower = Math.max(X.empower, X.P.breakEmpower + 1); say(f, `[Lightning Rod: Empowered for ${X.P.breakEmpower} turns.]`, 'skill'); }
}
// Resistance (STAT_FACES): how much of a status's effect a fighter shrugs off, 0 for enemies
function resistance(X, k) { return (X.res && X.res[k]) || 0; }
function stunTarget(f, X, Y) {
  if (Y.hp <= 0) return;
  if (resistance(Y, 'stun') && rnd(f.rng) < resistance(Y, 'stun')) { say(f, '[You shrug off the Stun.]', 'class'); return; }
  Y.stun = Math.max(Y.stun, 1);
  if (X.P.stunMisf) addMisfortune(f, Y, X.P.stunMisf); // Ill Wind
  interrupt(f, X, Y, true);
  if (X.P.stunWeaken) Y.weaken = Math.max(Y.weaken, X.P.stunWeaken);
  react(f, X, Y);
}
function isBig(f, Y) {
  const s = Y.intent; if (!s) return false; const fx = s.def.fx;
  const T = opp(f, Y);
  return ((fx.dmg || 0) * (fx.hits || 1) * s.power) >= T.maxHp * 0.15;
}
function interrupt(f, X, Y, stunned) {
  if (Y.isPlayer || !Y.intent || Y.interrupted) return;
  const s = Y.intent;
  if (X.isPlayer && isBig(f, Y)) {
    f.tally.bigStopped++;
    if (X.P.stormBreak) { X.empower = Math.max(X.empower, 3); say(f, '[Stormcaller: big attack broken. Empowered for 2 turns.]', 'skill'); }
  }
  s.cd = Math.max(s.cd, 2); Y.interrupted = s.def.name;
  say(f, `[${s.def.name} interrupted! It goes on cooldown.]`, 'skill'); ev(f, { k: 'interrupt', side: Y.side, name: s.def.name });
  if (X.isPlayer) f.tally.stuns++;
  if (X.P.stunDmg) hit(f, X, Y, X.P.stunDmg, { noCrit: 1, noDodge: 1, isThorns: true, src: 'Static' });
  if (X.P.stunEmpower) X.empower = Math.max(X.empower, X.P.stunEmpower + 1);
  if (X.P.stormBreak && Y.block > 0) { say(f, `[Stormcaller: ${Math.round(Y.block)} Block shattered.]`, 'skill'); Y.block = 0; }
  if (X.P.stunBurn) addStatus(f, X, Y, 'burn', X.P.stunBurn);
  if (X.P.stunHeal) heal(f, X, X.P.stunHeal);
  if (!stunned) planIntent(f, Y);
}
function effectCount(Y) { return (Y.burn > 0) + (Y.poison > 0) + (Y.bleed > 0) + (Y.weaken > 0) + (Y.stun > 0) + (Y.marked > 0); }

// ---------- Dice (Gambler) ----------
// A die skill (fx.die) rolls 1 to 6 at the start of its owner's turn, and the roll is shown on the skill before the pick,
// so a roll is never a hidden cost. s.baseDef keeps the skill as written; s.def is that skill with the roll worked into
// plain numbers, so the button, the bot and the fight all read ordinary effects. Smart opponents roll when they plan.
const DIE_FACES = ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];
function hasDice(X) { return X.skills.some(s => { const fx = (s.baseDef || s.def).fx; return fx.die || fx.dmgAll || fx.reroll || fx.setSix; }); }
function lowDie(X) { const p = X.skills.filter(s => s.pip).map(s => s.pip); return p.length ? Math.min(...p) : 0; }
function highDie(X) { const p = X.skills.filter(s => s.pip).map(s => s.pip); return p.length ? Math.max(...p) : 0; }
function rollPip(f, X, s) {
  const min = Math.min(6, Math.max(1, X.P.dieMin || 0, s.baseDef.fx.dieMin || 0)), r = () => min + Math.floor(rnd(f.rng) * (7 - min));
  let v = r(); if (X.rollTwiceT > 0) v = Math.max(v, r());
  if (X.firstSix) { X.firstSix = false; v = 6; }
  if (v === 1 && X.sleeve) { X.sleeve = false; v = 6; if (X.isPlayer) say(f, "[Cardsharp's Sleeve: a 1 becomes a 6.]", 'skill'); }
  if (v === 6) X.rolledSix = true;
  if (v === 1 && X.P.oneMisf) addMisfortune(f, X === f.A ? f.B : f.A, X.P.oneMisf); // Unlucky Number
  return v;
}
function rollDice(f, X, only) {
  if (!hasDice(X)) return;
  X.skills.forEach(s => { if (s.unstable || !s.baseDef) s.baseDef = s.def; if (s.baseDef.fx.die && (!only || only.includes(s))) s.pip = rollPip(f, X, s); });
  if (!only && X.rollTwiceT > 0) X.rollTwiceT--;
  resolveDice(X);
}
function resolveDice(X) {
  const pips = X.skills.filter(s => s.baseDef && s.baseDef.fx.die).map(s => s.pip), sum = pips.reduce((a, b) => a + b, 0);
  X.skills.forEach(s => {
    const b = s.baseDef; if (!b || !(b.fx.die || b.fx.dmgAll)) return;
    const fx = Object.assign({}, b.fx), v = s.pip || 0;
    if (fx.die) {
      if (fx.dmgPip) fx.dmg = (fx.dmg || 0) + fx.dmgPip * v;
      if (fx.blockPip) fx.block = (fx.block || 0) + fx.blockPip * v;
      if (fx.healPip) fx.heal = (fx.heal || 0) + fx.healPip * v;
      if (fx.dbl) fx.dmg *= v >= fx.dbl ? 2 : 0.5;
      if (fx.snake && (v === 1 || (fx.boxcars && v === 6))) { fx.dmg = fx.snake; fx.stun = 1; }
      if (fx.bust && v <= (fx.bustAt || 1)) fx.selfDmg = fx.bust;
      if (X.P.ironOdds && fx.block && v >= 5) fx.block *= 2; // Iron Odds
      if (X.P.savingGrace && fx.heal && v === 6) fx.heal *= 2; // Saving Grace
      if (X.P.sixStun && v === 6) fx.stun = 1; // Thunder Roll
      if (fx.dieStun && v >= fx.dieStun) fx.stun = 1; // Thunder Dice
    }
    if (fx.dmgAll) fx.dmg = (fx.dmg || 0) + (fx.dmgAll + (fx.progressive ? X.jackpots || 0 : 0)) * sum;
    if (fx.cashOut) fx.lifesteal = fx.cashOut;
    const die = !!fx.die;
    ['die', 'dmgPip', 'blockPip', 'healPip', 'dieMin', 'dieStun', 'dbl', 'snake', 'boxcars', 'bust', 'bustAt', 'dmgAll', 'progressive', 'cashOut'].forEach(k => delete fx[k]);
    s.jackpot = die && pips.filter(x => x === v).length >= 2;
    s.def = Object.assign({}, b, { fx, pip: die ? v : null, jackpot: s.jackpot });
  });
}
// Spend a reroll on one of your dice (the Gambler's tier 2). Returns false when there is nothing to reroll.
function rerollDie(f, idx) {
  const A = f.A, s = A.skills[idx];
  if (f.phase !== 'player' || f.over || !(A.rerolls > 0) || !s || !s.baseDef || !s.baseDef.fx.die) return false;
  A.rerolls--; const was = s.pip;
  rollDice(f, A, [s]);
  say(f, `[Reroll: ${s.def.name} ${was} \u2192 ${s.pip}.]`, 'skill');
  return true;
}
// ---------- Jinx ----------
// Misfortune (on the opponent, never fades) pays to jinx the opponent's shown move: when it fires it goes wrong for its
// user, by the move's role (JINX_COST in moves.js). Every jinx gives you 1 Curse (+6% skill damage, +4% damage taken
// a stack, up to 10). Omens are traps keyed to the shown move: if it attacks (or guards) next, the Omen fires.
const CURSE_DMG = 0.06, CURSE_TAKEN = 0.04, CURSE_MAX = 10, OMEN_MAX = 3;
function jinxRole(f, s) {
  const fx = s.def.fx, k = intentText(f, s, f.B).kind;
  if (fx.heal || fx.regen || fx.healMissing) return 'sustain';
  return k === 'big' ? 'big' : k === 'attack' ? 'strike' : fx.block && !fx.dmg ? 'guard' : 'setup';
}
function jinxCost(f) {
  const A = f.A, B = f.B, s = B.intent; if (!s) return null;
  if (A.P.jinxFree && !A.jinxedOnce) return 0;
  return Math.max(0, JINX_COST[jinxRole(f, s)] + (B.jinxTax || 0) - (A.P.jinxCheap || 0) - (A.jinxDisc || 0));
}
// Can the player jinx the shown move now: the button only shows when this is true
function canJinx(f) {
  const A = f.A, B = f.B;
  if (f.phase !== 'player' || f.over || !B.intent || B.jinxed || B.stun > 0 || B.unjinxable || A.jinxTurn === f.turn) return false;
  if (!A.isJinx || B.noJinxT === f.turn) return false; // Augury: its next move can't be jinxed
  return (B.misfortune || 0) >= jinxCost(f);
}
function addCurse(f, X, n) {
  const was = X.curse || 0; X.curse = Math.min(CURSE_MAX, was + n);
  if (X.P.curseBlock && X.curse > was) gainBlock(f, X, X.P.curseBlock * (X.curse - was)); // Mirror-Shard Mail
  if (X.curse >= CURSE_MAX && was < CURSE_MAX && X.isPlayer) say(f, '[Entrant is carrying more bad luck than is advisable.]', 'loss');
}
function addMisfortune(f, Y, n) { if (n > 0 && Y.hp > 0) Y.misfortune = (Y.misfortune || 0) + n; }
// Jinx the shown move (free: Calamity). Returns false when it can't be done.
function jinxMove(f, free) {
  const A = f.A, B = f.B;
  if (!free && !canJinx(f)) return false;
  if (free && (!B.intent || B.jinxed || B.stun > 0)) return false;
  const cost = free ? 0 : jinxCost(f), first = !A.jinxedOnce;
  B.misfortune -= cost; B.jinxed = true; A.jinxedOnce = true; f.tally.jinxes = (f.tally.jinxes || 0) + 1;
  if (!free) { A.jinxTurn = f.turn; A.jinxDisc = 0; }
  say(f, `[${B.intent.def.name} jinxed${cost ? ` for ${cost} Misfortune` : ''}. It will go wrong.]`, 'class');
  if (!(A.P.jinxFree && first)) addCurse(f, A, 1);
  if (A.coinStun) B.coinStun = true; // Cursed Coin
  if (A.P.jinxReroll && A.skills.some(s => s.pip)) { rollDice(f, A, A.skills.filter(s => s.pip)); say(f, '[Rigged Game: your dice roll again.]', 'skill'); }
  if (A.P.jinxHeal) heal(f, A, A.maxHp * A.P.jinxHeal);
  if (A.P.jinxDoom && B.doomT > 0) { B.doomT = 1; say(f, '[Bad End: Doom falls now.]', 'skill'); }
  return true;
}
// A jinxed move fires: it goes wrong for its user, by its role
function fireJinx(f, B, s) {
  const A = opp(f, B), fx = s.def.fx, p = s.power, role = jinxRole(f, s);
  ev(f, { k: 'use', side: B.side, name: s.def.name });
  say(f, '[Jinxed. The odds were posted.]', 'class');
  const self = Math.round(((fx.dmg || 0) * (fx.hits || 1)) * p * dmgMult(f, B, A));
  if (role === 'strike' || role === 'big') { hit(f, A, B, self, { noDodge: true, noCrit: true, pierce: true, src: 'Jinx' }); if (role === 'big' && B.hp > 0) stunTarget(f, A, B); }
  else if (role === 'guard') A.jinxBlock = (A.jinxBlock || 0) + Math.round((fx.block || 0) * p); // lands on your next turn, after Block resets
  else if (role === 'sustain') hit(f, A, B, Math.round(((fx.heal || 0) * p) || (fx.healMissing ? (B.maxHp - B.hp) * fx.healMissing : 0) || (fx.regen || 0) * p * 3), { noDodge: true, noCrit: true, pierce: true, src: 'Jinx' });
  else { if (fx.empower) A.empower = Math.max(A.empower, fx.empower + 1); if (fx.block) A.jinxBlock = (A.jinxBlock || 0) + Math.round(fx.block * p); if (fx.evade) A.evade += fx.evade; if (fx.focus) A.focus = fx.focus; if (!fx.empower && !fx.block && !fx.evade) say(f, `[${s.def.name} fizzles.]`, 'class'); }
  B.jinxed = false;
  if (B.coinStun && B.hp > 0) { B.coinStun = false; B.stun = Math.max(B.stun, 1); say(f, `[Cursed Coin: ${B.name} loses their next turn.]`, 'class'); }
}
// Omens fire after the opponent's move, if it matched
function fireOmens(f, B, s, role) {
  const A = opp(f, B); if (!B.omens || !B.omens.length || B.hp <= 0) return;
  const hit1 = B.omens.filter(o => (o.on === 'attack' && (role === 'strike' || role === 'big')) || (o.on === 'guard' && role === 'guard'));
  if (!hit1.length) return;
  B.omens = B.omens.filter(o => !hit1.includes(o));
  hit1.forEach(o => {
    say(f, '[Omen fulfilled.]', 'class');
    if (o.dmg) hit(f, A, B, o.dmg, { noDodge: true, noCrit: true, pierce: true, src: 'Omen' });
    if (o.on === 'guard' && B.block > 0) B.block = Math.round(B.block / 2);
    addMisfortune(f, B, (o.misf || 0) + (A.P.omenPlus || 0));
    if (A.P.omenWeaken) { B.weaken = Math.max(B.weaken, A.P.omenWeaken); react(f, A, B); }
  });
}
// Read skills (fx.read): stronger when the opponent's shown move is that kind (intentText's kind; a big attack counts as an
// attack). readFx is merged over fx when the read lands; readMult multiplies the skill's power.
const READ_WORD = { attack: 'an attack', defend: 'a defend', debuff: 'a debuff' };
function readHits(f, X, fx) {
  if (!f || !fx.read || !X.isPlayer) return false;
  const Y = opp(f, X); if (!Y.intent || Y.stun > 0) return false;
  const k = intentText(f, Y.intent, Y).kind; return (k === 'big' ? 'attack' : k) === fx.read;
}
function readDef(def) { const fx = Object.assign({}, def.fx, def.fx.readFx); delete fx.read; delete fx.readFx; delete fx.readMult; return Object.assign({}, def, { fx }); }
function useSkill(f, X, s, opt) {
  opt = opt || {};
  const Y = opp(f, X);
  let def = s.def, p = s.power * (opt.mult || 1);
  if (X.P.echoNext && !opt.echo && !def.cheat) X.echoQ = s; // Echo Chamber (experimental): plays again next turn
  if (def.fx.mirror) {
    const last = f.lastPlayerSkill;
    if (last) { def = Object.assign({}, last.def); say(f, `[${X.name} copies ${last.def.name}.]`, 'loss'); }
    else def = { name: 'Mirror Strike', fx: { dmg: 8 }, tags: [] };
  }
  if (def.fx.copy) {
    const last = f.lastEnemySkill;
    if (last) { def = Object.assign({}, last.def, { name: 'Copycat: ' + last.def.name }); p = last.power; say(f, `[Copycat! You copy ${last.def.name}.]`, 'class'); }
    else def = { name: 'Copycat', fx: { dmg: 10 }, tags: [] };
  }
  // Stack Overflow: each cast this fight stronger than the last; the fifth resets the count and Stuns the caster
  let stackStun = false;
  if (def.fx.stack && !opt.echo) { s.stackN = (s.stackN || 0) + 1; if (s.stackN >= 5) { s.stackN = 0; stackStun = true; } }
  if (def.fx.stack && s.stackN > 1) p *= 1 + def.fx.stack * (s.stackN - 1);
  // Error: replays the last skill you used this fight
  if (def.fx.replay && !opt.echo) {
    const last = X.isPlayer && f.lastPlayerSkill;
    if (last && last !== s) { say(f, `[Error: ${last.def.name} repeated.]`, 'skill'); useSkill(f, X, last, { echo: true }); }
    else say(f, '[Error: no previous action to repeat.]', 'skill');
    if (def.fx.selfDmg) { X.hp = Math.max(1, X.hp - Math.round(def.fx.selfDmg)); ev(f, { k: 'dot', side: X.side, amt: def.fx.selfDmg, kind: 'self' }); }
    return;
  }
  if (def.fx.read && readHits(f, X, def.fx)) {
    const rm = def.fx.readFx.readMult || 1; def = readDef(def); p *= rm;
    f.tally.reads = (f.tally.reads || 0) + 1; say(f, `[Read: ${def.name} answers ${READ_WORD[s.def.fx.read]}.]`, 'skill');
  }
  const fx = def.fx;
  // Jackpot: this skill's die matches another shown die
  if (def.jackpot && !opt.echo) {
    X.jackpots = (X.jackpots || 0) + 1; if (X.isPlayer) f.tally.jackpots = (f.tally.jackpots || 0) + 1;
    if (X.P.jackpot) p *= 1 + X.P.jackpot;
    if (X.P.rakeReroll) X.rerolls = (X.rerolls || 0) + X.P.rakeReroll;
    if (X.P.jackpotPoison) addStatus(f, X, Y, 'poison', X.P.jackpotPoison); // Poisoned Chalice
    say(f, X.isPlayer ? '[Jackpot. The House notes it.]' : `[Jackpot for ${X.name}.]`, X.isPlayer ? 'class' : 'loss');
  }
  if (stackStun) say(f, `[Stack overflow. ${X.isPlayer ? 'You are' : X.name + ' is'} stunned.]`, 'loss');
  if (!opt.echo) ev(f, { k: 'use', side: X.side, name: def.name });
  if (X.bleed > 0 && !opt.echo) {
    const bm = (Y.P.bleedMult || 1) * (X.marked > 0 ? 2 : 1);
    const bd = Math.round(X.bleed * bm * (1 - resistance(X, 'bleed'))); X.hp -= bd; X.bleed--; ev(f, { k: 'dot', side: X.side, amt: bd, kind: 'bleed' });
    if (!X.isPlayer) f.dealt['Bleed'] = (f.dealt['Bleed'] || 0) + bd; else f.tally.hurtBy['Bleed'] = (f.tally.hurtBy['Bleed'] || 0) + bd;
    if (Y.P.bleedHeal) heal(f, Y, bd * Y.P.bleedHeal); // Butcher
    if (X.hp <= 0) { checkRevive(f, X); if (X.hp <= 0) return; }
  }
  if (fx.selfDmg) { X.hp = Math.max(1, X.hp - Math.round(fx.selfDmg)); ev(f, { k: 'dot', side: X.side, amt: fx.selfDmg, kind: 'self' }); }
  let m = dmgMult(f, X, Y);
  const resist = Y.adapt && X.isPlayer && f.tally.mostUsed === s.key ? Y.adapt : 0;
  const damaging = !!(fx.dmg || fx.blockDmg || fx.malice || fx.detonate || fx.momentum || fx.perMisf || fx.calamity);
  if (fx.calamity && X.isPlayer) jinxMove(f, true); // Calamity: jinx the shown move for free first
  if (damaging && X.focus) { m *= 1 + X.focus; X.focus = 0; }
  if (damaging && !def.quick && X.aq) { m *= 1 + X.aq; X.aq = 0; }
  if (damaging && X.firstHit && !opt.echo) { m *= 1 + X.firstHit; X.firstHit = 0; }
  const src = def.name;
  let dealt = 0;
  if (fx.dmg || fx.blockDmg || fx.malice || fx.perMisf || fx.calamity) {
    let base = (fx.dmg || 0) * p;
    if (fx.perMisf) base += (fx.perMisf * (Y.misfortune || 0) + (fx.perCurse || 0) * (X.curse || 0)) * p; // Thirteenth Hour
    if (fx.calamity) base += fx.calamity * (Y.misfortune || 0) * p;
    if (fx.blockDmg) base += X.block * fx.blockDmg;
    if (fx.malice) base += fx.malice * p * effectCount(Y);
    if (fx.momentum) base += fx.momentum * p * (X.streak || 0);
    if (fx.cruel && effectCount(Y) >= 2) base *= fx.cruel;
    if (fx.execute && Y.hp / Y.maxHp <= fx.execute + (X.P.execPip || 0) * highDie(X)) base *= fx.execMult; // Dead Man's Hand raises the line
    const hits = fx.hits || 1, heavy = base * m * hits >= Y.maxHp * BREAK.big;
    for (let i = 0; i < hits && Y.hp > 0; i++) {
      X.lastCrit = false;
      dealt += hit(f, X, Y, base * m, { heavy, pierce: fx.pierce || (X.P.reapPierce && half(Y)), critBonus: fx.critBonus, alwaysCrit: fx.alwaysCrit, resist, src });
      if (X.lastCrit && X.P.luckyCut && def.pip === 6 && !s.luckyCut && Y.hp > 0) { s.luckyCut = true; say(f, '[Lucky Cut: a six and a critical. Once more.]', 'skill'); dealt += hit(f, X, Y, base * m, { pierce: fx.pierce, resist, src }); } // Lucky Cut
      if (fx.perHit) applyStatus(f, X, Y, fx, p);
      if (hits >= 2 && X.P.hitBurn) addStatus(f, X, Y, 'burn', X.P.hitBurn);
    }
    if (hits >= 2 && X.P.multiWeaken && Y.hp > 0) { Y.weaken = Math.max(Y.weaken, 1); react(f, X, Y); }
  }
  if (fx.overflow && X.isPlayer && Y.hp < 0) f.overflowOut = Math.max(f.overflowOut || 0, Math.round(-Y.hp)); // Overflow: overkill carries over
  if (fx.brk && Y.hp > 0) addBreak(f, X, Y, fx.brk * p);
  if (!fx.perHit) applyStatus(f, X, Y, fx, p);
  if (fx.detonate) { const v = Math.max(4, Y.burn * fx.detonate) * (1 + (p - 1) * 0.5) * m; if (!fx.keep) Y.burn = 0; dealt += hit(f, X, Y, v, { pierce: 1, noDodge: true, src }); }
  if (damaging && X.P.poisonOnHit && dealt > 0) addStatus(f, X, Y, 'poison', X.P.poisonOnHit);
  if (damaging && X.P.hitMisf && dealt > 0) addMisfortune(f, Y, X.P.hitMisf); // Bent Horseshoe
  if (fx.block) gainBlock(f, X, fx.block * p);
  if (fx.heal) heal(f, X, fx.heal * p);
  if (fx.healMissing) heal(f, X, (X.maxHp - X.hp) * fx.healMissing);
  if ((fx.heal || fx.healMissing || fx.lifesteal || fx.regen) && X.P.healPoison && !opt.echo) addStatus(f, X, Y, 'poison', X.P.healPoison);
  if (fx.drainPoison) heal(f, X, Y.poison);
  if (fx.empower) X.empower = Math.max(X.empower, fx.empower + 1);
  if (fx.evade) X.evade += fx.evade;
  if (fx.nextCrit) X.critNext = true;
  if (fx.thorns) X.thorns = Math.max(X.thorns, fx.thorns * p);
  if (fx.cleanse) { if (fx.reflect) { Y.burn += X.burn; Y.poison += X.poison; Y.bleed += X.bleed; } if (X.burn + X.poison + X.bleed + X.weaken > 0) say(f, `[${X.isPlayer ? 'You are' : X.name + ' is'} cleansed.]`); const keepPoison = Y.P && Y.P.misfNoCleanse && (X.misfortune || 0) >= Y.P.misfNoCleanse; X.burn = 0; if (!keepPoison) X.poison = 0; else say(f, '[Bad Water: the Poison stays.]'); X.bleed = 0; X.weaken = 0; }
  const ls = (fx.lifesteal || 0) + (damaging ? (X.P.lifesteal || 0) + (half(X) ? X.P.lowLifesteal || 0 : 0) : 0);
  if (ls && dealt > 0) heal(f, X, dealt * ls);
  if (damaging && dealt > 0 && X.P.hitHeal) heal(f, X, X.P.hitHeal);
  if (fx.xburn) addStatus(f, X, Y, 'burn', Math.round(fx.xburn * p));
  if (fx.xpoison) addStatus(f, X, Y, 'poison', Math.round(fx.xpoison * p));
  if (fx.xbleed) addStatus(f, X, Y, 'bleed', Math.round(fx.xbleed * p));
  if (fx.mark) { Y.marked = Math.max(Y.marked || 0, fx.mark); react(f, X, Y); }
  if (fx.focus) X.focus = fx.focus;
  if (fx.rollTwice) X.rollTwiceT = fx.rollTwice;
  if (fx.misf) addMisfortune(f, Y, fx.misf);
  if (fx.misfPerBurn) addMisfortune(f, Y, Math.floor((Y.burn || 0) / fx.misfPerBurn)); // Bad Wick
  if (fx.misfT) { Y.misfT = 3; Y.misfTv = fx.misfT; } // Bad Penny
  if (fx.omenAtk || fx.omenGuard) { Y.omens = (Y.omens || []).slice(-(OMEN_MAX - (fx.omenGuard && fx.omenAtk ? 2 : 1))); if (fx.omenAtk) Y.omens.push({ on: 'attack', dmg: Math.round(fx.omenAtk * p), misf: 3 }); if (fx.omenGuard) Y.omens.push({ on: 'guard', misf: 3 }); }
  if (fx.jinxDisc) X.jinxDisc = fx.jinxDisc;
  if (fx.augury) X.noJinxT = f.turn + 1; // the Hanged Augur: its next move can't be jinxed
  if (fx.portent && Y.isPlayer) { const k = f.tally.mostUsed; if (k && k !== 'attack') { Y.hexKey = k; Y.hexT = f.turn + 1; const s2 = Y.skills.find(o => o.key === k); say(f, `[Portent: ${s2 ? s2.def.name : 'your skill'} is hexed next turn.]`, 'loss'); } }
  if (fx.uncurse) X.curse = Math.max(0, (X.curse || 0) - fx.uncurse);
  if (fx.coinStun) X.coinStun = true;
  if (fx.passCurse) { const n = Math.max(0, (X.curse || 0) - (fx.curseKeep || 0)); if (n) { addMisfortune(f, Y, n * fx.passCurse); X.curse -= n; say(f, `[${n} Curse passed on: +${n * fx.passCurse} Misfortune.]`, 'class'); if (fx.curseDmg) dealt += hit(f, X, Y, fx.curseDmg * n * p, { src: def.name }); } }
  if (fx.calamity) { if (fx.keepHalf) Y.misfortune = Math.floor((Y.misfortune || 0) / 2); else Y.misfortune = 0; addCurse(f, X, 3); }
  if (fx.reroll || fx.setSix) {
    const dice = X.skills.filter(o => o !== s && o.baseDef && o.baseDef.fx.die);
    if (fx.reroll) rollDice(f, X, dice);
    if (fx.setSix && dice.length) { const lo = dice.reduce((a, o) => o.pip < a.pip ? o : a); lo.pip = 6; resolveDice(X); }
    if (dice.length && X.isPlayer) say(f, `[${def.name}: ${dice.map(o => o.pip).join(', ')}.]`, 'skill');
  }
  if (fx.haste) X.skills.forEach(o => { if (o !== s) o.cd = Math.max(0, o.cd - fx.haste); });
  if (fx.interrupt) interrupt(f, X, Y, false);
  if (fx.stunIfWeak && Y.weaken > 0 && Y.hp > 0) stunTarget(f, X, Y);
  if (fx.riposte) X.riposte = fx.riposte;
  if (fx.regen) { X.regen = fx.regen * p; X.regenT = 3; }
  if (fx.doom) { Y.doom = Math.round(fx.doom * p * (1 + (X.P.doomLeech || 0))); Y.doomT = Math.max(1, (fx.doomT || 3) - (X.P.doomFaster ? 1 : 0)); Y.doomHastened = false; react(f, X, Y); }
  if (fx.leech) { Y.leech = Math.round(fx.leech * p * (1 + (X.P.doomLeech || 0))); Y.leechT = 4; Y.blight = false; react(f, X, Y); }
  if (fx.siphon) { const b = Y.block; X.block += b; Y.block = 0; Y.empower = 0; if (b) say(f, `[${X.isPlayer ? 'You steal' : X.name + ' steals'} ${Math.round(b)} Block.]`); }
  if (opt.echo) return;
  // passives that trigger on use
  if (damaging && X.firstStun && Y.hp > 0) { X.firstStun = false; say(f, '[Thunder Maul: Stun!]', 'skill'); stunTarget(f, X, Y); }
  if (!def.basic) { X.uses++; if (X.P.every3Stun && X.uses % 3 === 0 && Y.hp > 0) { say(f, '[Stormlord: every third skill Stuns!]', 'skill'); stunTarget(f, X, Y); } }
  if (!def.quick) X.streak = damaging ? (X.streak || 0) + 1 : 0;
  if (def.quick) {
    const P = X.P;
    if (P.afterQuick) X.aq = P.afterQuick;
    if (P.quickBurn) addStatus(f, X, Y, 'burn', P.quickBurn);
    if (P.quickPoison) addStatus(f, X, Y, 'poison', P.quickPoison);
    if (P.quickBlock) X.block += P.quickBlock;
    if (P.quickHeal) heal(f, X, P.quickHeal);
    if (P.quickMisf) addMisfortune(f, Y, P.quickMisf); // Hex Glyph
    if (P.quickReroll) { const lo = X.skills.filter(o => o.pip).sort((a, b) => a.pip - b.pip)[0]; if (lo) { const was = lo.pip; rollDice(f, X, [lo]); if (X.isPlayer) say(f, `[Card Trick: ${lo.def.name} ${was} \u2192 ${lo.pip}.]`, 'skill'); } }
    if (P.quickEvade) X.evade = Math.max(X.evade, 1);
    if (P.quickStun && damaging && Y.hp > 0 && rnd(f.rng) < P.quickStun) { say(f, '[Tempest Mage: Stun!]', 'skill'); stunTarget(f, X, Y); }
  }
  if (stackStun && X.hp > 0) X.stun = Math.max(X.stun, 1);
  if (fx.echo && Y.hp > 0 && rnd(f.rng) < fx.echo) { say(f, `[Echo! ${def.name} casts again.]`, 'skill'); useSkill(f, X, s, { echo: true }); }
  if (def.quick && X.P.quickTwice && Y.hp > 0) useSkill(f, X, s, { echo: true });
}

function startTurn(f, X, first) {
  // returns false if X can't act (stunned/dead)
  const P = X.P, Y = opp(f, X);
  // Unstable skills: one evolution on odd turns, the other on even ones (shown on the button before you pick)
  if (X.isPlayer) X.skills.forEach(s => { if (!s.unstable) return; s.unstableId = s.unstableId || s.def.id; const ids = SKILLS[s.unstableId].unstable, e = ids[(f.turn + 1) % 2]; s.def = Object.assign(moddedDef(e, s.mods), { name: `${s.unstable.name}: ${SKILLS[e].name}`, cd: s.unstable.cd, id: s.unstableId }); });
  if (X.isPlayer) rollDice(f, X);
  if (!first) {
    if (X.forge) X.block = X.block; else X.block = P.blockKeep ? Math.round(X.block * Math.min(0.6, P.blockKeep)) : 0;
  }
  if (X.forge) X.block += X.forge;
  if (X.jinxBlock) { gainBlock(f, X, X.jinxBlock); say(f, `[The jinxed guard is yours: +${X.jinxBlock} Block.]`, 'class'); X.jinxBlock = 0; }
  X.thorns = 0; X.riposte = 0;
  if (X.regenT > 0) { heal(f, X, X.regen); X.regenT--; }
  if (P.regen) heal(f, X, P.regen);
  if (X.leechT > 0) { const v = Math.min(X.leech * (X.poison > 0 && X.blight ? 2 : 1), Math.max(0, X.hp)); X.hp -= v; ev(f, { k: 'dot', side: X.side, amt: v, kind: 'poison' }); heal(f, Y, Math.min(v, X.leech)); X.leechT--; if (Y.isPlayer) f.dealt['Leech'] = (f.dealt['Leech'] || 0) + v; }
  if (X.doomT > 0) { X.doomT--; if (X.doomT === 0) { X.hp -= X.doom; ev(f, { k: 'dot', side: X.side, amt: X.doom, kind: 'doom' }); say(f, `[Doom falls on ${X.isPlayer ? 'you' : X.name}: ${X.doom} damage.]`, 'skill'); if (Y.isPlayer) f.dealt['Doom'] = (f.dealt['Doom'] || 0) + X.doom; X.doom = 0; } }
  if (X.misfT > 0) { X.misfT--; addMisfortune(f, X, X.misfTv || 0); }
  if (!X.isPlayer && X.aura) addStatus(f, X, Y, 'burn', Math.round(X.aura));
  if (!X.isPlayer && X.briar) addStatus(f, X, Y, 'bleed', Math.round(X.briar));
  const turns = X.isPlayer ? f.turn : (X.turns || 0);
  if (turns > 24) { const sd = Math.round(X.maxHp * 0.04 * (turns - 24)); X.hp -= sd; ev(f, { k: 'dot', side: X.side, amt: sd, kind: 'sudden' }); if (X.isPlayer && turns === 25) say(f, '[The crowd grows restless. Both fighters are worn down each turn.]', 'loss'); }
  if (X.burn > 0) {
    const v = Math.round(X.burn * (1 - resistance(X, 'burn'))); X.hp -= v; ev(f, { k: 'dot', side: X.side, amt: v, kind: 'burn' });
    if (Y.isPlayer) f.dealt['Burn'] = (f.dealt['Burn'] || 0) + v; else f.tally.hurtBy['Burn'] = (f.tally.hurtBy['Burn'] || 0) + v;
    if (Y.P.burnHeal) heal(f, Y, v * Y.P.burnHeal);
    if (Y.P.burnMisf) addMisfortune(f, X, Y.P.burnMisf); // Black Candle
    const fade = X.burnFade != null ? X.burnFade : 0.3; X.burn = Math.max(0, X.burn - Math.ceil(X.burn * fade));
  }
  if (X.poison > 0) {
    const v = Math.round(X.poison * (Y.P.poisonMult || 1) * (Y.P.poisonMisf && (X.misfortune || 0) >= 5 ? 1 + Y.P.poisonMisf : 1) * (1 - resistance(X, 'poison'))); // Evil Draught
    X.hp -= v; ev(f, { k: 'dot', side: X.side, amt: v, kind: 'poison' });
    if (Y.isPlayer) f.dealt['Poison'] = (f.dealt['Poison'] || 0) + v; else f.tally.hurtBy['Poison'] = (f.tally.hurtBy['Poison'] || 0) + v;
    if (Y.P.poisonHeal) heal(f, Y, v * Math.min(POISON_HEAL_CAP, Y.P.poisonHeal));
  }
  checkRevive(f, X);
  if (X.hp <= 0) return false;
  // Experimental gear (gear.js): the Countdown Collar's deletion, the Delay Engine's release, the Echo Chamber's replay
  if (X.isPlayer && P.countdown && f.turn >= P.countdown && Y.hp > 0) { Y.hp = 0; say(f, `[Countdown complete. ${Y.name} has been deleted.]`, 'class'); ev(f, { k: 'hit', side: Y.side, amt: 0, blocked: 0, tag: 'Deleted' }); return true; }
  if (P.suspend && X.bank > 0 && f.turn % P.suspend === 0 && Y.hp > 0) { const v = X.bank; X.bank = 0; say(f, `[Delay Engine: ${v} stored damage released.]`, 'skill'); hit(f, X, Y, v * 1.5, { released: 1, noDodge: 1, noCrit: 1, src: 'Delay Engine' }); if (Y.hp <= 0) return true; }
  if (X.echoQ && Y.hp > 0) { const q = X.echoQ; X.echoQ = null; say(f, `[Echo Chamber: ${q.def.name} plays again.]`, 'skill'); useSkill(f, X, q, { echo: true, mult: P.echoNext }); if (Y.hp <= 0 || X.hp <= 0) return X.hp > 0; }
  if (X.stun > 0) { X.stun = 0; say(f, `[${X.isPlayer ? 'You are' : X.name + ' is'} stunned and lose${X.isPlayer ? '' : 's'} the turn.]`, X.isPlayer ? 'loss' : 'skill'); ev(f, { k: 'stunned', side: X.side }); return false; }
  return true;
}
function endTurn(f, X, usedKey) {
  if (X.isPlayer) { X.jinxDisc = 0; X.coinStun = false; }
  if (X.weaken > 0) X.weaken--;
  if (X.marked > 0) { X.marked--; if (!X.marked) X.hemo = false; }
  if (X.empower > 0) X.empower--;
  if (X.brokenT > 0) X.brokenT--;
  if (X.breakMax && X.brk > 0) X.brk = Math.max(0, X.brk - X.breakMax * BREAK.drain);
  X.skills.forEach(s => { if (s.key !== usedKey && s.cd > 0) s.cd--; });
}
function checkOver(f) {
  if (f.over) return true;
  if (f.A.hp <= 0 || f.B.hp <= 0) { f.over = true; f.winner = f.A.hp > 0 ? 'A' : f.B.hp > 0 ? 'B' : (f.A.hp >= f.B.hp ? 'A' : 'B'); f.phase = 'over'; return true; }
  return false;
}
function canUse(s) { return s.cd <= 0; }
function playerAct(f, idx) {
  if (f.phase !== 'player' || f.over) return false;
  const A = f.A, s = A.skills[idx]; if (!s || !canUse(s)) return false;
  f.events = [];
  if (A.hexKey === s.key && A.hexT === f.turn) { ev(f, { k: 'use', side: 'A', name: s.def.name }); say(f, `[Hexed. ${s.def.name} goes wrong. +2 Curse.]`, 'loss'); addCurse(f, A, 2); A.hexKey = null; } else
  useSkill(f, A, s);
  checkPhase(f, f.B, true);
  s.cd = s.def.fx.killReset && f.B.hp <= 0 ? 0 : s.def.cd || 0; // Last Hour
  if (s.def.quick) s.cd += 1; // quick skills tick at the end of this same turn
  if (s.def.quick && A.quickFree > 0) { A.quickFree--; s.cd = 1; say(f, `[Hourglass: ${s.def.name} has no cooldown.]`, 'skill'); }
  else if (A.firstFree && !s.def.basic && !s.def.cheat) { A.firstFree = false; s.cd = s.def.quick ? 1 : 0; say(f, `[Archmage: ${s.def.name} has no cooldown.]`, 'skill'); }
  // Unbound: no cooldown of its own, so another ready skill goes on cooldown instead
  if (s.def.fx.unbound) { const o = A.skills.filter(x => x !== s && x.key !== 'attack' && !x.def.cheat && x.cd <= 0 && (x.def.cd || 0) > 0); if (o.length) { const t = o[Math.floor(rnd(f.rng) * o.length)]; t.cd = t.def.cd + 1; say(f, `[Unbound: ${t.def.name} is on cooldown instead.]`, 'skill'); } }
  // [REDACTED]: the prefix is disclosed on the skill's first use (the run's piece is updated when the fight is settled)
  if (s.u && (s.mods || []).some(m => PREFIXES[m] && PREFIXES[m].hide) && !(f.disclosed || {})[s.u]) { f.disclosed = Object.assign(f.disclosed || {}, { [s.u]: true }); say(f, `[Disclosure: the [REDACTED] prefix on ${s.def.name} is ${s.mods.filter(m => PREFIXES[m].hide).map(m => PREFIXES[PREFIXES[m].hide].name).join(', ')}.]`, 'skill'); }
  f.useCounts[s.key] = (f.useCounts[s.key] || 0) + 1;
  if (s.key !== 'attack' && s.key !== 'copycat' && !s.def.quick && !s.def.fx.replay) f.lastPlayerSkill = s;
  if (s.def.quick) { f.tally.quickTurn++; f.tally.maxQuick = Math.max(f.tally.maxQuick, f.tally.quickTurn); } else f.tally.quickTurn = 0;
  const mu = Object.entries(f.useCounts).sort((a, b) => b[1] - a[1])[0]; f.tally.mostUsed = mu ? mu[0] : null;
  if (s.def.quick) { checkOver(f); return true; }
  endTurn(f, A, s.key);
  f.tally.turns = f.turn;
  if (!checkOver(f)) f.phase = 'enemy';
  return true;
}
function skipPlayer(f) { f.events = []; endTurn(f, f.A, null); if (!checkOver(f)) f.phase = 'enemy'; }
function scoreSkill(s, low) { const fx = s.def.fx; return ((fx.dmg || 0) * (fx.hits || 1) + (fx.burn || 0) + (fx.poison || 0) * 1.5 + (fx.bleed || 0) + (fx.detonate ? 10 : 0) + (fx.doom ? fx.doom * 0.5 : 0) + (fx.blockDmg ? 6 : 0)) * s.power + (low ? ((fx.heal || 0) + (fx.healMissing ? 25 : 0) + (fx.block || 0) * 0.8) * s.power * 2 : (fx.block || 0) * 0.5 * s.power) + (fx.stun ? 8 : 0) + (fx.interrupt ? 6 : 0); }
function planIntent(f, B) {
  rollDice(f, B);
  if (B.hexer) { const A = f.A, can = A.skills.filter(s => s.key !== 'attack' && !s.def.cheat); const s = can.length ? can[Math.floor(rnd(f.rng) * can.length)] : null; A.hexKey = s ? s.key : null; A.hexT = f.turn + 1; } // Mott: one of your skills, shown // an opponent with dice (Delphine Coyle, a Gambler Entrant) rolls as it plans, so you see the roll
  if (B.smart) {
    const ready = B.skills.filter(s => s.cd <= 0);
    let best = ready[0];
    const lowHp = B.hp / B.maxHp < 0.35;
    ready.forEach(s => { if (scoreSkill(s, lowHp) > scoreSkill(best, lowHp)) best = s; });
    B.intent = best; B.interrupted = null; return;
  }
  const n = B.script.length;
  for (let k = 0; k < n; k++) { const s = B.skills[B.script[(B.scriptIdx + k) % n]]; if (s.cd <= 0) { B.scriptIdx += k; B.intent = s; B.interrupted = null; return; } }
  B.intent = B.skills[B.script[B.scriptIdx % n]]; B.interrupted = null;
}
function peekNext(f) {
  // the move after the current intent (best guess for scripted foes)
  const B = f.B; if (B.smart || !B.script) return null;
  const n = B.script.length; return B.skills[B.script[(B.scriptIdx + 1) % n]];
}
function enemyTurn(f) {
  if (f.over) return;
  f.events = [];
  const B = f.B; B.turns = (B.turns || 0) + 1;
  const can = startTurn(f, B);
  if (checkOver(f)) return;
  if (can) {
    if (B.flood && B.turns % B.flood === 0) { const T = f.A.block < B.block ? f.A : f.A.block > B.block ? B : f.A; T.weaken = Math.max(T.weaken, 2); say(f, `[The arena floods. ${T === f.A ? 'You are' : B.name + ' is'} Weakened.]`, T === f.A ? 'loss' : 'skill'); ev(f, { k: 'flood' }); react(f, B, T); }
    const s = B.intent || B.skills[0], role = (B.omens && B.omens.length) || B.jinxed ? jinxRole(f, s) : null;
    if (B.jinxed) fireJinx(f, B, s); else useSkill(f, B, s);
    if (role) fireOmens(f, B, s, role);
    if (!s.def.fx.mirror) f.lastEnemySkill = { def: s.def, power: s.power };
    if (B.twincast && B.turns % B.twincast === 0 && f.A.hp > 0) { say(f, `[${B.name} casts twice!]`, 'loss'); useSkill(f, B, s, { echo: true }); }
    s.cd = s.def.cd || 0;
    if (!B.smart && !B.phaseFresh) B.scriptIdx++;
    endTurn(f, B, s.key);
  } else endTurn(f, B, null);
  if (B.phaseFresh) { B.phaseFresh = false; phaseTraits(B); }
  if (checkOver(f)) return;
  checkPhase(f, B);
  planIntent(f, B);
  f.turn++;
  f.phase = 'player';
  f.events.push({ k: 'mark' });
  const ok = startTurn(f, f.A);
  if (checkOver(f)) return;
  if (!ok) { f.phase = 'stunned'; }
}
function intentText(f, s, B) {
  let def = s.def;
  if (def.fx.mirror) { const last = f.lastPlayerSkill; if (last) def = last.def; else def = { fx: { dmg: 8 } }; }
  const fx = def.fx, p = s.power, m = dmgMult(f, B, f.A);
  const parts = []; let kind = 'other';
  if (fx.dmg || fx.blockDmg) { const v = Math.round(((fx.dmg || 0) * p + (fx.blockDmg ? B.block * fx.blockDmg : 0)) * m); parts.push(fx.hits ? `${v}×${fx.hits}` : `${v}`); kind = 'attack'; }
  if (fx.block) { parts.push(`Block ${Math.round(fx.block * p)}`); if (kind === 'other') kind = 'defend'; }
  if (fx.heal) { parts.push(`Heal ${Math.round(fx.heal * p)}`); if (kind === 'other') kind = 'defend'; }
  if (fx.burn) { parts.push(`Burn ${Math.round(fx.burn * p)}`); if (kind === 'other') kind = 'debuff'; }
  if (fx.poison) { parts.push(`Poison ${Math.round(fx.poison * p)}${fx.doublePoison ? ' (×1.5)' : ''}`); if (kind === 'other') kind = 'debuff'; }
  if (fx.bleed) parts.push('Bleed');
  if (fx.weaken) { parts.push('Weaken'); if (kind === 'other') kind = 'debuff'; }
  if (fx.stun) parts.push('Stun');
  if (fx.empower) { parts.push('Power up'); if (kind === 'other') kind = 'buff'; }
  if (fx.evade) { parts.push('Evade'); if (kind === 'other') kind = 'buff'; }
  if (fx.cleanse) { parts.push('Cleanse'); if (kind === 'other') kind = 'defend'; }
  if (fx.lifesteal) parts.push('Drain');
  if (fx.doom) { parts.push('Doom'); if (kind === 'other') kind = 'debuff'; }
  if (fx.leech) parts.push('Leech');
  const big = kind === 'attack' && ((fx.dmg || 0) * p * m * (fx.hits || 1)) >= f.A.maxHp * 0.2;
  return { kind: big ? 'big' : kind, name: s.def.fx.mirror ? 'Mirror Form' : s.def.name, label: s.def.label, text: parts.join(' · ') || s.def.name };
}
function intentInfo(f) {
  const B = f.B, s = B.intent; if (!s) return { kind: 'unknown', text: '?' };
  if (B.stun > 0) return { kind: 'stunned', name: 'Stunned', text: B.interrupted ? B.interrupted + ' interrupted' : 'loses next turn' };
  const r = intentText(f, s, B);
  if (B.twincast && (B.turns + 1) % B.twincast === 0) r.text += ' · twice';
  if (B.flood && (B.turns + 1) % B.flood === 0) r.text += ' · flood';
  if (f.foresight || B.showNext) { const n = peekNext(f); if (n) r.then = n.def.label || n.def.name; } // the Hanged Augur shows two moves
  return r;
}
function previewSkill(f, s) {
  if (s.def.fx.read && f && readHits(f, f.A, s.def.fx)) return 'Read · ' + previewSkill(f, { def: readDef(s.def), power: s.power * (s.def.fx.readFx.readMult || 1) });
  const X = f ? f.A : null, def = s.def, fx = def.fx, p = s.power, m = X ? dmgMult(f, X, f.B) : 1;
  const parts = [];
  if (fx.dmg || fx.blockDmg || fx.malice) { let v = (fx.dmg || 0) * p; if (fx.blockDmg && X) v += X.block * fx.blockDmg; if (fx.malice && f) v += fx.malice * p * effectCount(f.B); v = Math.round(v * m * (X && X.focus ? 1 + X.focus : 1) * (X && X.aq && !def.quick ? 1 + X.aq : 1)); parts.push(fx.hits ? `${v}×${fx.hits}` : `${v} dmg`); }
  if (fx.detonate) parts.push(`Burn ×${fx.detonate}`);
  if (fx.block) parts.push(`Block ${Math.round(fx.block * p)}`);
  if (fx.heal) parts.push(`Heal ${Math.round(fx.heal * p)}`);
  if (fx.healMissing) parts.push(`Heal ${Math.round(fx.healMissing * 100)}% missing`);
  if (fx.burn) parts.push(`Burn ${Math.round(fx.burn * p)}`);
  if (fx.poison) parts.push(`Poison ${Math.round(fx.poison * p)}`);
  if (fx.bleed) parts.push(`Bleed ${Math.round(fx.bleed * p)}`);
  if (fx.weaken) parts.push(`Weaken ${fx.weaken}`);
  if (fx.stun) parts.push('Stun');
  if (fx.stunIfWeak) parts.push('Stun if Weak');
  if (fx.empower) parts.push(`Power ${fx.empower}t`);
  if (fx.evade) parts.push(`Evade ${fx.evade}`);
  if (fx.thorns) parts.push(`Thorns ${Math.round(fx.thorns * p)}`);
  if (fx.cleanse) parts.push('Cleanse');
  if (fx.lifesteal) parts.push(`Drain ${Math.round(fx.lifesteal * 100)}%`);
  if (fx.execute) parts.push(`×${fx.execMult} under ${fx.execute * 100}%`);
  if (fx.momentum) parts.push(`+${Math.round(fx.momentum * p)}/streak`);
  if (fx.cruel) parts.push(`×${fx.cruel} vs 2+ effects`);
  if (fx.riposte) parts.push(`Riposte ×${fx.riposte}`);
  if (fx.mark) parts.push(`Mark ${fx.mark}t`);
  if (fx.focus) parts.push(`Next +${fx.focus * 100}%`);
  if (fx.haste) parts.push(`Cooldowns −${fx.haste}`);
  if (fx.perMisf || fx.calamity) { const Y = f ? f.B : null, mi = Y ? Y.misfortune || 0 : 0, cu = X ? X.curse || 0 : 0; parts.unshift(`${Math.round(((fx.dmg || 0) + (fx.perMisf || 0) * mi + (fx.perCurse || 0) * cu + (fx.calamity || 0) * mi) * p * m)} dmg`); if (fx.calamity) parts.push('Jinx'); }
  if (fx.misf) parts.push(`Misfortune ${fx.misf}`);
  if (fx.misfPerBurn) parts.push(`Misfortune per ${fx.misfPerBurn} Burn`);
  if (fx.omenAtk) parts.push(`Omen ${Math.round(fx.omenAtk * p)}${fx.omenGuard ? ' · guard' : ''}`);
  if (fx.passCurse) parts.push(`Pass ${X ? Math.max(0, (X.curse || 0) - (fx.curseKeep || 0)) : ''} Curse`);
  if (fx.jinxDisc) parts.push(`Jinx −${fx.jinxDisc}`);
  if (fx.rollTwice) parts.push('Roll twice');
  if (fx.reroll) parts.push('Reroll dice');
  if (fx.setSix) parts.push('Lowest die 6');
  if (fx.interrupt) parts.push('Interrupt');
  if (fx.regen) parts.push(`Regen ${Math.round(fx.regen * p)}×3`);
  if (fx.doom) parts.push(`Doom ${Math.round(fx.doom * p)}`);
  if (fx.leech) parts.push(`Leech ${Math.round(fx.leech * p)}×4`);
  if (fx.siphon) parts.push('Steal Block');
  if (fx.xburn) parts.push(`+Burn ${Math.round(fx.xburn * p)}`);
  if (fx.xpoison) parts.push(`+Poison ${Math.round(fx.xpoison * p)}`);
  if (fx.xbleed) parts.push(`+Bleed ${Math.round(fx.xbleed * p)}`);
  if (fx.echo) parts.push(fx.echo >= 1 ? 'Casts twice' : `${Math.round(fx.echo * 100)}% echo`);
  if (fx.unbound) parts.push('Locks another skill');
  if (fx.overflow) parts.push('Overflow');
  return parts.join(' · ');
}
function describe(def, p = 1) {
  const fx = def.fx, r = [], n = v => Math.round(v * p);
  if (fx.dmg) r.push(fx.hits ? `Hit ${fx.hits} times for ${n(fx.dmg)}.` : `Deal ${n(fx.dmg)} damage.`);
  if (fx.blockDmg) r.push(`Plus damage equal to ${fx.blockDmg === 1 ? 'your' : Math.round(fx.blockDmg * 100) + '% of your'} Block.`);
  if (fx.malice) r.push(`+${n(fx.malice)} for each effect on the opponent.`);
  if (fx.pierce) r.push('Ignores Block.');
  if (fx.critBonus) r.push(`+${fx.critBonus * 100}% critical chance.`);
  if (fx.alwaysCrit) r.push('Always a critical hit.');
  if (fx.execute) r.push(`×${fx.execMult} damage if the opponent is below ${fx.execute * 100}% HP.`);
  if (fx.detonate) r.push(`Deal ${fx.detonate}× the opponent's Burn as damage${fx.keep ? '' : ', then remove it'}. Ignores Block.`);
  const per = fx.perHit ? ' with each hit' : '';
  if (fx.burn) r.push(`Apply ${n(fx.burn)} Burn${per}.`);
  if (fx.poison) r.push(`Apply ${n(fx.poison)} Poison${per}${fx.doublePoison ? ', then raise their Poison by half if they already had some' : ''}.`);
  if (fx.bleed) r.push(`Apply ${n(fx.bleed)} Bleed${per}.`);
  if (fx.weaken) r.push(`Weaken the opponent for ${fx.weaken} turn${fx.weaken > 1 ? 's' : ''}.`);
  if (fx.stun) r.push('Stun: the opponent loses their next turn, and the move they were about to use goes on cooldown.');
  if (fx.stunIfWeak) r.push('If the opponent is Weakened, Stun them.');
  if (fx.block) r.push(`Gain ${n(fx.block)} Block.`);
  if (fx.heal) r.push(`Heal ${n(fx.heal)}.`);
  if (fx.healMissing) r.push(`Heal ${fx.healMissing * 100}% of your missing HP.`);
  if (fx.drainPoison) r.push("Heal equal to the opponent's Poison.");
  if (fx.brk) r.push(`Break ${n(fx.brk)}: fills the opponent's break bar.`);
  if (fx.empower) r.push(`Deal 30% more damage for ${fx.empower} turn${fx.empower > 1 ? 's' : ''}.`);
  if (fx.evade) r.push(`Evade the next ${fx.evade > 1 ? fx.evade + ' attacks' : 'attack'}.`);
  if (fx.nextCrit) r.push('Your next hit is a critical.');
  if (fx.thorns) r.push(`Until your next turn, hit back for ${n(fx.thorns)} when struck.`);
  if (fx.cleanse) r.push(fx.reflect ? 'Send your Burn, Poison and Bleed to the opponent.' : 'Remove your Burn, Poison, Bleed and Weaken.');
  if (fx.lifesteal) r.push(`Heal ${fx.lifesteal * 100}% of the damage dealt.`);
  if (fx.momentum) r.push(`+${n(fx.momentum)} damage for each turn in a row you've used a damaging skill.`);
  if (fx.cruel) r.push(`×${fx.cruel} damage if the opponent has 2 or more effects.`);
  if (fx.riposte) r.push(`Until your next turn, damage you block is dealt back ×${fx.riposte}.`);
  if (fx.mark) r.push(`Mark the opponent: they take 30% more damage for ${fx.mark} turns.`);
  if (fx.focus) r.push(`Your next damaging skill deals ${fx.focus * 100}% more.`);
  if (fx.haste) r.push(`Your other cooldowns drop by ${fx.haste}.`);
  if (fx.interrupt) r.push("Interrupt: cancel the opponent's next move and put it on cooldown.");
  if (fx.regen) r.push(`Heal ${n(fx.regen)} at the start of your next 3 turns.`);
  if (fx.doom) r.push(`Doom: after ${fx.doomT || 3} of the opponent's turns, they take ${n(fx.doom)} damage.`);
  if (fx.leech) r.push(`Leech: for 4 turns, drain ${n(fx.leech)} HP from the opponent each turn.`);
  if (fx.siphon) r.push("Steal the opponent's Block and remove their Power.");
  if (fx.xburn) r.push(`Also apply ${n(fx.xburn)} Burn.`);
  if (fx.xpoison) r.push(`Also apply ${n(fx.xpoison)} Poison.`);
  if (fx.xbleed) r.push(`Also apply ${n(fx.xbleed)} Bleed.`);
  if (fx.echo) r.push(fx.echo >= 1 ? 'Always casts twice.' : `${fx.echo * 100}% chance to cast twice.`);
  if (fx.unbound) r.push('No cooldown; using it puts one of your other skills on cooldown.');
  if (fx.overflow) r.push('Damage past 0 HP from its killing blow carries into your next fight.');
  if (fx.selfDmg) r.push(`Costs ${fx.selfDmg} HP.`);
  if (fx.die) {
    const base = fx.dmg && (fx.dmgPip || fx.snake) ? n(fx.dmg) : 0;
    if (fx.snake) r.splice(0, r.length, `On a 1${fx.boxcars ? ' or a 6' : ''}: deal ${n(fx.snake)} and Stun. Otherwise deal ${base}.`);
    else if (fx.dmgPip) { if (fx.dmg) r.shift(); r.unshift(`Deal ${base ? base + ' + ' : ''}${n(fx.dmgPip)} per pip.`); }
    if (fx.blockPip) r.push(`Block ${n(fx.blockPip)} per pip.`);
    if (fx.healPip) r.push(`Heal ${n(fx.healPip)} per pip.`);
    if (fx.dbl) r.push(`On ${fx.dbl}+ deal double, otherwise half.`);
    if (fx.dieMin) r.push(`This die never rolls below ${fx.dieMin}.`);
    if (fx.dieStun) r.push(fx.dieStun >= 6 ? 'On a 6, Stun.' : `On a ${fx.dieStun} or more, Stun.`);
    if (fx.bust) r.push(`On a ${fx.bustAt ? '1 or 2' : '1'}, you take ${fx.bust}.`);
    r.unshift('Rolls a die each turn, shown before you pick.');
  }
  if (fx.dmgAll) r.unshift(`Deal ${n(fx.dmgAll)} per pip across all your shown dice${fx.progressive ? ', +1 per pip for each Jackpot this fight' : ''}.`);
  if (fx.cashOut) r.push(`Heal ${fx.cashOut * 100}% of the damage dealt.`);
  if (fx.misf) r.push(`Misfortune ${fx.misf}.`);
  if (fx.misfPerBurn) r.push(`Then Misfortune 1 for every ${fx.misfPerBurn} Burn on the opponent.`);
  if (fx.misfT) r.push(`Then Misfortune ${fx.misfT} each turn for 3 turns.`);
  if (fx.omenAtk) r.push(`Omen: if the opponent attacks next, it takes ${n(fx.omenAtk)} and gains 3 Misfortune.`);
  if (fx.omenGuard) r.push('Omen: if it guards next, it loses half its Block and gains 3 Misfortune.');
  if (fx.jinxDisc) r.push(`Your next jinx this turn costs ${fx.jinxDisc} less.`);
  if (fx.uncurse) r.push(`Remove ${fx.uncurse} Curse.`);
  if (fx.passCurse) r.push(`Move ${fx.curseKeep ? `all but ${fx.curseKeep} of your` : 'all your'} Curse onto the opponent as ${fx.passCurse === 2 ? 'double' : fx.passCurse + '×'} the Misfortune${fx.curseDmg ? `, and deal ${n(fx.curseDmg)} per Curse moved` : ''}.`);
  if (fx.perMisf) r.push(`Deal ${n(fx.perMisf)} per Misfortune on the opponent plus ${n(fx.perCurse || 0)} per Curse on you.`);
  if (fx.killReset) r.push('No cooldown if it kills.');
  if (fx.coinStun) r.push('A move you jinx this turn also Stuns its user next turn.');
  if (fx.calamity) { if (fx.dmg) r.shift(); r.unshift(`Jinx the shown move for free, then deal ${n(fx.dmg || 0)} + ${n(fx.calamity)} per Misfortune and ${fx.keepHalf ? 'halve' : 'clear'} it. You take 3 Curse.`); }
  if (fx.rollTwice) r.push(`For ${fx.rollTwice} turns, your dice roll twice and keep the higher.`);
  if (fx.reroll) r.push('Reroll your other dice.');
  if (fx.setSix) r.push('Set your lowest die to 6.');
  if (fx.read) {
    const rm = fx.readFx.readMult, rd = readDef(def);
    r.push(rm ? `Read: if the opponent's shown move is ${READ_WORD[fx.read]}, it has ${rm === 2 ? 'double' : rm + '×'} power.`
      : `Read: if the opponent's shown move is ${READ_WORD[fx.read]}, instead: ${describe(Object.assign({}, rd, { quick: false }), p)}`);
  }
  if (def.quick) r.push("Quick: doesn't end your turn.");
  return r.join(' ');
}
const REACTIONS = {
  flare: { name: 'Toxic Flare', pair: 'Burn + Poison', text: 'Applying Burn to a Poisoned target ignites the Poison for half its value as damage. Once per turn.' },
  cauterise: { name: 'Cauterise', pair: 'Burn + Bleed', text: 'Bleed is seared away and Burn doubles.' },
  hemorrhage: { name: 'Haemorrhage', pair: 'Bleed + Mark', text: 'Bleed deals double while Marked.' },
  broken: { name: 'Broken', pair: 'Stun + Weaken', text: 'Breaks the target, the same as a full break bar: 50% more damage for 2 turns.' },
  blight: { name: 'Blight', pair: 'Poison + Leech', text: 'Leech drains double, but heals only the normal amount.' },
  hastened: { name: 'Hastened Doom', pair: 'Doom + 2 other effects', text: 'Doom lands a turn sooner.' },
};

// ---------- After a fight ----------
function resolveFight(run, f, meta, rng) {
  const msgs = [], won = f.winner === 'A', spec = f.spec, lr = stream(run, 'loot', rng);
  bindMeta(meta);
  run.hp = Math.max(0, f.A.hp);
  if (f.usedBreath) run.usedBreath = true;
  // Glitches settled by the fight: Overflow carries into the next one only after a win; [REDACTED] prefixes used are disclosed
  run.overflow = won && f.overflowOut ? f.overflowOut : 0;
  Object.keys(f.disclosed || {}).forEach(u => { const p = findPiece(run, +u); if (p) p.p.mods = p.p.mods.map(bareMod); });
  fileIssues(run, f, meta, msgs);
  allPieces(run).filter(p => GEAR[p.id] && GEAR[p.id].rolling).forEach(p => rollMissing(p, lr));
  if (run.phantom && !run.practice && --run.phantom.left <= 0) { msgs.push({ t: 'loss', text: `[Hotfix applied: Phantom ${pieceDef(run.phantom.id).name} removed.]` }); run.phantom = null; }
  f.rx.forEach(k => meta.archive.reactions[k] = true);
  if (spec.kind === 'rival') meta.archive.rivals[spec.id] = true;
  if ((spec.kind === 'rival' || (spec.kind === 'final' && !spec.snap)) && won) meta.archive.beat[spec.id] = true;
  if (spec.kind === 'final') meta.archive.finals[spec.id] = true;
  if (run.path) meta.archive.paths[run.path] = true;
  const res = { won, gold: 0, msgs, tally: f.tally, dealt: f.dealt, turns: f.turn, enemy: f.B.name, death: false, spared: false, eliteOver: false, wager: null, rewind: false };
  // What they say at the end (FOE_LINES in enemies.js): beaten when you win, wins when they do. Finalists and snapshots never speak these
  { const L = !spec.snap && spec.id && FOE_LINES[spec.id], t = L && (won ? L.beaten : L.wins); if (t) res.foeLine = foeLine(t, run); }
  if (!won && !run.elite && hasGift(run, 'rewind') && !run.usedRewind) {
    run.usedRewind = true; run.hp = f.startHp; res.rewind = true;
    msgs.push({ t: 'class', text: '[Return by Death. The world rewinds to the start of the fight.]' });
    return res;
  }
  // Stakes set on this fight by an event: outcomes for a win or a loss
  const stakes = run.nextFlags.stakes && run.nextFlags.stakes[won ? 'win' : 'lose'], heartCut = run.nextFlags.heartCut || 0, noWinGold = !!run.nextFlags.noWinGold;
  if (stakes) { const ctx = { run, h: eventKit(run, meta, lr, msgs), msgs, label: 'Stakes' }; applyOutcomes(stakes, ctx, false); applyOutcomes(stakes, ctx, true); }
  // Flags for "the next fight" (a bribe, poison, a scouted weakness) last until it is decided, so a rewind or a reload keeps them
  run.nextFlags = {}; run.marks = (run.marks || []).filter(m => m.kind === 'always' || (m.kind === 'ward' && run.ward > 0)); applyAlways(run);
  const c = featCtx(run, f, won, spec);
  // Titles are earned for feats (titles.js); world firsts for a Final Champion come between the won-fight ones and the any-fight ones
  const titleFeats = at => Object.entries(TITLES).forEach(([k, t]) => { if (t.feat && FEATS[t.feat].at === at && featOk(t.feat, c, t.n)) earnTitle(run, k, msgs); });
  // Wager
  if (run.wagerOn && run.wager) {
    const W = WAGERS[run.wager.key], ok = won && featOk(run.wager.key, c);
    res.wager = { ok, text: W.text, god: run.wager.god };
    if (ok) {
      const pay = (hasGift(run, 'gambler') ? 15 : 10) + (run.title === 'high_roller' ? 3 : 0), prize = { gold: pay, favour: { [run.wager.god]: 2 } };
      const ctx = { run, h: eventKit(run, meta, lr, msgs), msgs };
      applyOutcomes(prize, ctx, false); run.wagersWon = (run.wagersWon || 0) + 1;
      msgs.push({ t: 'favour', text: `[Wager won: ${W.text}. +${pay} gold.]` }); applyOutcomes(prize, ctx, true);
      titleFeats('wager');
    }
    else msgs.push({ t: 'loss', text: `[Wager lost: ${W.text}.]` });
    run.wagerOn = false;
  }
  run.met.push(specKey(spec));
  const hist = { round: curRound(run), name: f.B.name, won, turns: f.turn, hard: !!spec.hard, kind: spec.kind, hl: 0, dealt: Object.values(f.dealt).reduce((a, b) => a + b, 0) };
  run.history.push(hist);
  // Titles and world firsts
  if (won) {
    titleFeats('win');
    if (FINAL_TITLE[spec.id]) worldFirst(run, 'final_' + spec.id, `has defeated ${spec.snap ? spec.snap.champ + ', carrying ' + ENEMIES[spec.id].name + "'s power," : ENEMIES[spec.id].name} in ${f.turn} turn${f.turn === 1 ? '' : 's'}.`, FINAL_TITLE[spec.id], msgs);
  }
  titleFeats('fight');
  questEvent(run, 'fight', { f, won, spec }, msgs);
  if (spec.kind === 'trial') res.trial = settleTrial(run, f, won, meta, msgs, lr);
  if (won) {
    run.wins++;
    res.gold = noWinGold ? 0 : 2 + (spec.kind === 'final' ? 0 : 3) + (spec.hard && hasGift(run, 'treasure') ? 5 : 0); run.gold += res.gold;
    const healF = run.world.mod === 'famine' ? 0.15 : 0.3;
    run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * healF) + (hasPerk(run, 'dressing') ? 6 : 0));
    if (runP(run).heartOnWin && run.hearts < run.maxHearts && !run.elite) { run.hearts++; restoreRecord(run, 1); msgs.push({ t: 'loot', text: '[Reaper: the kill restores 1 Heart.]' }); }
    if (spec.hard || spec.kind === 'final' || run.elite) run.pending.push({ type: 'rune', mods: rollPrefixes(runeCount(run), lr, null, run), got: `[Rune recovered from ${f.B.name}. Strong opponents carry them.]` });
    if (spec.hard) { run.bonusSlot = rollPiece(run, lr, { odds: [0, 0, 0, 70, 30] }); msgs.push({ t: 'loot', text: '[A rare piece will wait in your next shop.]' }); }
    if (spec.hard && !run.practice && rnd(stream(run, 'patch')) < RARE_PATCH) givePiece(run, 'unsigned_patch', msgs, `[Something unsigned was left in the arena after ${f.B.name} fell: {item}.]`);
    if (spec.gate) { run.statPts++; msgs.push({ t: 'level', text: '[Gatekeeper defeated. +1 stat point.]' }); if (customOf(run, 'crown')) { customPaid(run, msgs); OUTCOME_APPLY.piece(run.customUp ? 'A' : 'B', { run, msgs, label: 'Royal bounty' }); } }
    if (runP(run).goldPerWin) { run.gold += runP(run).goldPerWin; msgs.push({ t: 'loot', text: `[The House pays out: +${runP(run).goldPerWin} gold.]` }); }
    if (META && !META.unlocks.arch_jinx && !run.practice && (spec.id === 'mott' || (f.tally.missed || 0) >= 3)) { META.unlocks.arch_jinx = true; msgs.push({ t: 'class', text: '[Archetype unlocked: Jinx. Please stand well back.]' }); } // beat Mott, or win a fight where 3 attacks missed you
    if (spec.id === 'delphine' && META && !META.unlocks.arch_dicer && !run.practice) { META.unlocks.arch_dicer = true; msgs.push({ t: 'class', text: '[Archetype unlocked: Gambler. The House has opened a line of credit.]' }); } // the rival route
    if (runP(run).sixGold && f.A.rolledSix) { run.gold += runP(run).sixGold; msgs.push({ t: 'loot', text: `[Gilded Coin: you rolled a 6. +${runP(run).sixGold} gold.]` }); }
    if (amendOf(run).winGold) { run.gold += amendOf(run).winGold; msgs.push({ t: 'loot', text: `[${AMENDMENTS[run.amend].name}: +${amendOf(run).winGold} gold.]` }); }
    if (spec.bounty) { const ctx = { run, h: eventKit(run, meta, lr, msgs), msgs, label: 'Bounty' }; applyOutcomes(spec.bounty, ctx, false); applyOutcomes(spec.bounty, ctx, true); }
    if (!run.elite && !run.practice && spec.kind !== 'final') {
      const was = noticeOf(run); run.notice = (run.notice || 0) + 1;
      if (noticeOf(run) > was) msgs.push({ t: 'class', text: `[The System takes notice. ${run.notice} straight win${run.notice > 1 ? 's' : ''}: opponents +${noticePct(run)}%.]` });
    }
    if ((spec.kind === 'erased' || spec.kind === 'entrant') && customOf(run, 'exiles') && !run.elite && run.hearts < run.maxHearts) { msgs.push({ t: 'loot', text: '[Salvage Rights: the Exiles take a piece of it home.]' }); OUTCOME_APPLY.restore(1, { run, msgs }); customPaid(run, msgs); }
    if ((spec.kind === 'erased' || spec.kind === 'champion') && spec.snap.bar.length) { const p = pick(spec.snap.bar.concat(spec.snap.gear), lr); const id = baseId(p.id); if (pieceDef(id) && !pieceDef(id).basic) { msgs.push({ t: 'loot', text: `[Reclaimed from ${spec.snap.champ}: ${pieceDef(id).name}]` }); addPiece(run, id, p.mods || [], msgs); } }
    if (run.elite) {
      run.eliteWins++;
      if (run.eliteIdx >= run.eliteBracket.length - 1) { res.eliteOver = true; res.eliteCleared = true; }
      else run.eliteIdx++;
    } else if (spec.kind === 'final') { res.spared = true; closeFate(run, msgs, true); }
    else run.round++;
  } else {
    if (run.elite) res.eliteOver = true;
    else {
      let cost = Math.max(0, heartCost(run, spec) - heartCut);
      if (cost && run.ward > 0 && !run.practice) { run.ward--; cost = 0; msgs.push({ t: 'loot', text: `[Ward holds. No Heart lost.${run.ward ? ` ${run.ward} ward${run.ward > 1 ? 's' : ''} left.` : ''}]` }); }
      run.lastLoss = { round: run.round, hearts: cost, spec: Object.assign({}, spec, { traits: (spec.traits || []).slice() }) };
      run.losses++; run.hearts -= cost; res.heartsLost = cost; hist.hl = cost;
      if (run.notice && !run.practice) { run.notice = 0; msgs.push({ t: 'class', text: '[Streak broken. The System looks away.]' }); }
      if (run.hearts <= 0) {
        run.hearts = 0; res.death = true; run.cause = f.B.name;
        // At 0 Hearts every entry left goes, then the world's name
        res.erased = eraseRecord(run, REC_MAX, msgs);
        if (run.record) msgs.push({ t: 'loss', text: `[World: ${'█'.repeat(run.world.name.length)}. Status: erased.]` });
        closeFate(run, msgs, false);
      } else {
        run.hp = Math.max(run.hp, Math.round(maxHp(run) * 0.5));
        msgs.push(cost ? { t: 'loss', text: `[Defeat. A piece of ${run.world.name} is erased. −${cost} Heart${cost > 1 ? 's' : ''}, ${run.hearts} left.]` } : { t: 'loss', text: '[Defeat.]' });
        res.erased = eraseRecord(run, cost, msgs);
        if (spec.kind === 'final') msgs.push({ t: 'loss', text: '[The Final Champion waits. You must win to spare your world.]' });
        else {
          run.round++;
          // The Clans: the Blood Tally. Whoever beat you comes back next round in the hard slot, with a bounty on them
          if (customOf(run, 'clans') && ['rival', 'monster', 'erased', 'champion'].includes(spec.kind) && !spec.summoned) {
            const S = summonSpec(run, { spec: Object.assign({}, spec, { traits: (spec.traits || []).slice(), gate: false }), bounty: run.customUp ? { gold: 14, restore: 2 } : { gold: 8, restore: 1 }, say: `[The Blood Tally: ${specName(spec)} owes you a Heart. They are back in your bracket.]` }, lr);
            if (S) { (run.summons = run.summons || []).push({ round: run.round, spec: S }); customPaid(run, msgs); }
          }
        }
      }
    }
  }
  if (spec.kind === 'entrant') poolResolve(run, spec, won, res, msgs, lr);
  if (spec.kind === 'final') finalResolve(run, spec, won, res, msgs);
  // A pool record's owner hears through poolResolve instead: the build is a copy from one round, not a champion in their Halls
  if (won && spec.snap && spec.snap.owner && spec.kind !== 'entrant') res.rested = { owner: spec.snap.owner, champ: spec.snap.champ, at: spec.snap.at, rank: spec.snap.rank || null };
  // A shared champion that beats you earns its owner's champion RP (see champWin)
  if (!won && spec.snap && spec.snap.owner && spec.kind !== 'entrant') res.fell = { owner: spec.snap.owner, champ: spec.snap.champ, at: spec.snap.at };
  if (run.practice && !res.death && (run.round > (run.practiceRounds || 3))) { res.practiceDone = true; return res; }
  if (!res.death && !res.spared && !res.eliteOver) { offerLevel(run, stream(run, 'level', rng)); enterChoose(run, meta, rng, msgs); }
  return res;
}
function startElite(run, meta, rng) {
  run.elite = true; run.eliteIdx = 0;
  const champs = run.seed ? [] : meta.champions.concat(SHARED.spared).filter(c => c.at !== run._snapAt);
  const first = champs.length ? { kind: 'champion', snap: pick(champs, rng) } : { kind: 'legend', id: 'legend' };
  run.eliteBracket = [first, Object.assign({ kind: 'legend', id: 'undefeated' }, run.undefeatedTraits ? { traits: run.undefeatedTraits.slice() } : {})];
  // From A-rank the bracket gets a middle fight: another spared champion, or Varn when there isn't one
  if (!run.seed && meta.rank && rankIdx(meta.rank.letter) >= rankIdx('A')) {
    const rest = champs.filter(c => !first.snap || c.at !== first.snap.at);
    const mid = rest.length ? { kind: 'champion', snap: pick(rest, rng) } : first.kind === 'legend' ? null : { kind: 'legend', id: 'legend' };
    if (mid) run.eliteBracket.splice(1, 0, mid);
  }
  run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * 0.3));
  enterChoose(run, meta, rng);
}
function echoesFor(run, outcome) {
  let e = 3 * run.wins;
  if (outcome === 'spared' || outcome === 'elite') e += 10 + (5 - run.world.rank) * 3;
  e += 8 * run.eliteWins;
  return e;
}
function endRun(run, meta, outcome) {
  if (outcome === 'erased') { run.hearts = 0; eraseRecord(run, REC_MAX); } // an abandoned world goes all at once
  const snap = snapshot(run);
  if (meta.rank && !run.practice) Object.assign(snap, { rank: meta.rank.letter, rp: 0, kills: 0 });
  if (outcome === 'erased') { meta.erased.unshift(snap); meta.erased = meta.erased.slice(0, 20); }
  else { meta.champions.unshift(snap); meta.champions = meta.champions.slice(0, 10); meta.wins++; }
  meta.runs++;
  const e = echoesFor(run, outcome); meta.echoes += e;
  const rk = awardRank(run, meta, outcome); run.rpEarned = rk.rp; run.trialOpened = rk.trial;
  run.ended = true;
  return { echoes: e, snap, rp: rk.rp, trial: rk.trial };
}

// ---------- Playtest stats ----------
// Each finished run leaves one anonymous summary for the stats dashboard (runs/{uid}_{at} in Firestore, see firestore.rules).
// Game keys and numbers only: no names, no account details. Picks are event options (e:key.idx), districts (d:key) and wagers (w:god).
const PICKS_MAX = 60;
function notePick(run, k) { if (!run.picks) run.picks = []; if (run.picks.length < PICKS_MAX) run.picks.push(k); }
// Foes that are another player's champion keep only their kind, since their names are player-chosen
const SNAP_KINDS = ['erased', 'champion', 'legend', 'entrant'];
// Every number is a whole number inside the bounds firestore.rules checks, and every key a short string or null,
// so an odd save (a missing field, a NaN) still posts instead of sitting refused in the queue.
// ver: the release the run was played on (the newest What's new entry's release, e.g. 'wpd-v10'), so stats can be split by version.
function runSummary(run, meta, outcome, now, ver) {
  now = Math.round(now == null ? Date.now() : now);
  const H = run.history || [], last = H[H.length - 1], gear = GEAR_SLOTS.map(sl => run.gear[sl]).filter(Boolean);
  const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+v) || 0)), key = (v, n) => v ? String(v).slice(0, n) : null;
  return {
    day: dailyDate(now), at: now, ver: ver ? String(ver).slice(0, 16) : null, outcome, mode: run.daily ? (run.ranked ? 'daily' : 'replay') : 'world',
    world: String(run.world.type).slice(0, 16), wrank: WORLD_RANKS[run.world.rank] || null, rank: meta && meta.rank ? key(meta.rank.letter, 3) : null, path: key(run.path, 16), hidden: key(run.hiddenPath, 24),
    patron: Object.keys(GODS).includes(run.patron) ? run.patron : 'none', gifts: (run.gifts || []).slice(0, 12).map(k => String(k).slice(0, 24)), title: key(run.title, 24),
    round: int(curRound(run), 0, 20), wins: int(run.wins, 0, 20), hearts: int(run.hearts, 0, 20), maxHearts: int(run.maxHearts || 10, 0, 20),
    level: int(run.level, 1, 9), turns: int(H.reduce((a, h) => a + (h.turns || 0), 0), 0, 9999),
    mins: run.t0 ? int((now - run.t0) / 6e4, 0, 1440) : null,
    fights: H.slice(0, 30).map(h => ({ r: int(h.round, 0, 20), w: !!h.won, h: !!h.hard, k: key(h.kind, 16) || 'monster', t: int(h.turns, 0, 999) })),
    picks: (run.picks || []).slice(0, PICKS_MAX).map(k => String(k).slice(0, 40)),
    bar: run.bar.filter(Boolean).slice(0, 8).map(p => baseId(p.id)), gear: gear.slice(0, 3).map(p => baseId(p.id)),
    foe: last && !last.won ? (SNAP_KINDS.includes(last.kind) ? '[' + last.kind + ']' : String(last.name).slice(0, 40)) : null,
  };
}

// ---------- Bug reports and feedback ----------
// The Report form in the Menu files one document per report (feedback/{uid}_{at}, see firestore.rules). Only the console
// and the stats dashboard read them. What the player typed, plus where they were: never a name or account detail.
const FEEDBACK_TYPES = ['bug', 'idea', 'balance', 'other'];
const FEEDBACK_MAX = 1000;
// env: { build, screen, w, h, app, ua } from the device. With a run, a short snapshot and the last few System messages.
function feedbackDoc(type, text, env, run, now) {
  now = Math.round(now == null ? Date.now() : now);
  const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+v) || 0)), str = (v, n) => String(v == null ? '' : v).slice(0, n);
  const d = {
    type: FEEDBACK_TYPES.includes(type) ? type : 'other', text: str(text, FEEDBACK_MAX).trim() || '(empty)', at: now,
    build: str(env.build, 24), screen: str(env.screen, 24), w: int(env.w, 0, 9999), h: int(env.h, 0, 9999), app: !!env.app, ua: str(env.ua, 200),
  };
  if (run) d.run = {
    world: str(run.world.type, 16), mode: run.practice ? 'practice' : run.daily ? (run.ranked ? 'daily' : 'replay') : 'world', stage: str(run.stage, 16),
    round: int(curRound(run), 0, 20), wins: int(run.wins, 0, 20), hearts: int(run.hearts, 0, 20), gold: int(run.gold, 0, 999), level: int(run.level, 1, 9),
    path: run.path ? str(run.path, 16) : null, bar: run.bar.filter(Boolean).slice(0, 8).map(p => baseId(p.id)),
    log: (run.log || []).slice(-10).map(l => str(l.text, 160)),
  };
  return d;
}

// ---------- Entrant Rank ----------
// A permanent grade from F to S, with SS and SSS hidden above. RP opens a Rank Trial; only passing it promotes. Rank never goes down.
const RANK_LADDER = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
const RANK_RP = { E: 80, D: 300, C: 700, B: 1400, A: 2600, S: 4500, SS: 7000, SSS: 10000 }; // SS and SSS are placeholders
const TRIAL_ROUND = { E: 3, D: 3, C: 4, B: 4, A: 5, S: 6, SS: 6, SSS: 6 };
const TRIAL_CONDS = WAGER_FEATS.filter(k => !FEATS[k].unfairFor); // never "without healing": Zealot and Leech builds can't meet it
const PERKS = {
  stipend: { name: "Sponsor's Stipend", desc: '+1 starting gold.', flavour: 'A god has started sending pocket money.' },
  kindling: { name: 'Kindling', desc: 'Burn you apply +1.', flavour: "You've learned how fires like to start.", p: { burnPlus: 1 } },
  steeped: { name: 'Steeped Blades', desc: 'Poison you apply +1.', flavour: 'Your edges never quite dry.', p: { poisonPlus: 1 } },
  whetted: { name: 'Whetted Edge', desc: 'Bleed you apply +1.', flavour: 'Sharper than it needs to be.', p: { bleedPlus: 1 } },
  guard: { name: 'Drilled Guard', desc: 'Start each fight with 5 Block.', flavour: 'Your shield is up before the bell.', p: { startBlock: 5 } },
  frame: { name: 'Seasoned Frame', desc: '+8 max HP.', flavour: 'Scar tissue counts.' },
  keen: { name: 'Keen Eye', desc: '+4% critical chance.', flavour: 'You see the gap a moment sooner.', p: { critBonus: 0.04 } },
  light: { name: 'Light Feet', desc: '+3% dodge.', flavour: 'Harder to pin down than you used to be.', p: { dodge: 0.03 } },
  dressing: { name: 'Field Dressing', desc: 'Heal 6 more after each won fight.', flavour: 'You patch yourself up between bouts.' },
  redraft: { name: 'Second Draft', desc: 'One extra opening draft reroll.', flavour: 'The System lets you look twice.' },
  patron: { name: "Patron's Ear", desc: 'Start with +1 Favour with your Patron.', flavour: 'Your god remembers your name.' },
  ledger: { name: 'Ledger Sense', desc: 'Interest cap +1.', flavour: 'You count your gold the way the Official does.' },
};
const TRIAL_TEXT = {
  E: ['[Promotion match: prove you are not an accident.{c}]', '[Promoted to E-rank. The System is mildly surprised.]', '[Trial failed. F-rank retained. Try again next world.]'],
  D: ['[Promotion match: defeat a D-rank Proctor.{c}]', '[Promoted to D-rank. Your file has been upgraded to paper.]', '[Trial failed. The Proctor will wait.]'],
  C: ['[Promotion match: defeat a C-rank Proctor.{c}]', '[Promoted to C-rank. Rivals have been informed.]', '[Trial failed. D-rank retained.]'],
  B: ['[Promotion match: defeat a B-rank Proctor.{c} The gods are watching.]', '[Promoted to B-rank. The gods have adjusted their odds.]', '[Trial failed. The gods have collected their bets.]'],
  A: ['[Promotion match: defeat an A-rank Proctor.{c} Few pass.]', '[Promoted to A-rank. Final Champions have been notified.]', '[Trial failed. Few pass. You remain few-adjacent.]'],
  S: ['[Final promotion match: defeat an S-rank Proctor.{c} There is no rank above S.]', '[Promoted to S-rank. There is no rank above S.]', '[Trial failed. A-rank retained. S-rank remains theoretical.]'],
  SS: ['[Promotion match: ███-rank Proctor. Rank not found.{c}]', '[Promoted to SS-rank. Record updated. Record should not exist.]', '[Trial failed. Record not created.]'],
  SSS: ["[Promotion match. The Proctor has no rank. The Proctor has never lost.{c}]", '[Promoted to SSS-rank. The System has run out of letters.]', "[Trial failed. The Proctor's record remains unbroken.]"],
};
const COND_TEXT = {}; TRIAL_CONDS.forEach(k => COND_TEXT[k] = FEATS[k].say(FEATS[k].n).replace("the opponent's", "the Proctor's") + '.');
function newRank() { return { letter: 'F', rp: 0, trial: null, history: [], perks: [] }; }
function rankIdx(l) { return RANK_LADDER.indexOf(l); }
function nextRank(l) { return RANK_LADDER[rankIdx(l) + 1] || null; }
function hasPerk(run, k) { return !!(run.perks && run.perks.includes(k)); }
// World offers go up to one rank above yours: F and E see E and D worlds, C opens B worlds, A opens S worlds
// A meta without a rank (the balance tools) is not gated.
function worldCap(meta) { const r = meta && meta.rank; return r ? Math.min(5, Math.max(1, rankIdx(r.letter))) : null; }
// Saves from before Entrant Rank start at F with RP from their Halls, so a returning player's first trials come quickly
function sanitizeRank(r, m) {
  const out = newRank();
  if (r && typeof r === 'object') {
    if (rankIdx(r.letter) >= 0) out.letter = r.letter;
    out.rp = Math.max(0, Math.floor(+r.rp || 0));
    out.trial = r.trial && rankIdx(r.trial) === rankIdx(out.letter) + 1 ? r.trial : null;
    out.history = Array.isArray(r.history) ? r.history.filter(h => h && rankIdx(h.to) > 0).slice(-12) : [];
    out.perks = Array.isArray(r.perks) ? r.perks.filter(k => PERKS[k]).filter((k, i, a) => a.indexOf(k) === i) : [];
    return out;
  }
  const pay = (x, spared) => 10 * (x.wins || 0) + Math.max(0, x.hearts || 0) + (spared ? 20 : 0);
  out.rp = (m.erased || []).reduce((a, x) => a + pay(x, false), 0) + (m.champions || []).reduce((a, x) => a + pay(x, true), 0);
  if (out.rp >= RANK_RP.E) out.trial = 'E';
  return out;
}
// RP for a finished run: 10 a win, 1 a Heart left, 20 for a spared world, times the world's rank (E ×1 up to S ×2)
function rpFor(run, outcome) {
  const spared = outcome !== 'erased';
  return Math.round((10 * (run.wins || 0) + Math.max(0, run.hearts) + (spared ? 20 : 0)) * (1 + 0.2 * run.world.rank));
}
function awardRank(run, meta, outcome) {
  if (run.practice || !meta.rank) return { rp: 0, trial: null };
  const R = meta.rank, rp = rpFor(run, outcome); R.rp += rp;
  const left = run.pending.find(p => p.type === 'perk'); if (left) choosePerk(run, meta, left.offers[0]); // a run that ends before the choice keeps the first perk
  if (run.promoted) R.history.push({ to: run.promoted, world: run.world.name, outcome, lost: run.record ? run.record.ids.length - recLeft(run.record) : 0, at: Date.now() });
  R.history = R.history.slice(-12);
  return { rp, trial: openTrial(R) };
}
function openTrial(R) { const nx = nextRank(R.letter); if (R.trial || !nx || R.rp < RANK_RP[nx]) return null; R.trial = nx; return nx; }
// Elite wins come after the spared world is filed, so they pay their RP when the run closes
function eliteRank(run, meta) {
  if (run.practice || !meta.rank || !run.eliteWins) return { rp: 0, trial: null };
  const rp = Math.round(10 * run.eliteWins * (1 + 0.2 * run.world.rank)); meta.rank.rp += rp;
  run.rpEarned = (run.rpEarned || 0) + rp; run.trialOpened = run.trialOpened || openTrial(meta.rank);
  return { rp, trial: run.trialOpened };
}
function trialSpec(run, rng) {
  const to = run.trial.to, early = rankIdx(to) <= rankIdx('D');
  const conds = TRIAL_CONDS.filter(k => featPossible(run, k));
  return { kind: 'trial', id: 'proctor', to, hard: !early, cond: early ? null : pick(conds, rng) };
}
// The Proctor fights at the world rank of the grade it examines: E-rank at E worlds up to S-rank (and beyond) at S
function trialMul(run, spec) { const w = Math.min(5, rankIdx(spec.to) - 1); return (0.92 + 0.05 * w) / (0.92 + 0.05 * run.world.rank); }
function trialLine(to, i, cond) { return TRIAL_TEXT[to][i].replace('{c}', cond ? ' ' + COND_TEXT[cond] : ''); }
function perkOffers(meta, rng) { return shuffle(Object.keys(PERKS).filter(k => !meta.rank.perks.includes(k)), rng).slice(0, 2); }
// A lost fight costs the round's normal Hearts as usual. A won fight that misses the condition costs nothing. Either way the trial waits for the next run.
function settleTrial(run, f, won, meta, msgs, rng) {
  const spec = f.spec, ok = won && (!spec.cond || featOk(spec.cond, featCtx(run, f, won, spec)));
  run.trial.done = true;
  if (!ok) { msgs.push({ t: 'loss', text: trialLine(spec.to, 2) }); return { ok, to: spec.to }; }
  const R = meta.rank; R.letter = spec.to; R.trial = null; run.promoted = spec.to;
  msgs.push({ t: 'class', text: trialLine(spec.to, 1) });
  const offers = perkOffers(meta, rng);
  if (offers.length) run.pending.push({ type: 'perk', offers, to: spec.to });
  return { ok, to: spec.to };
}
// Lines from the lore thread (entrant-rank.md). {champ} is the champion's name.
const RANK_ADDRESS = {
  F: ['[F-rank Entrant. Your world has been noted.]', '[F-rank. Expectations have been set accordingly.]'],
  E: ['[E-rank Entrant. You are now slightly harder to forget.]', '[E-rank. The System has learned your number.]'],
  D: ['[D-rank Entrant. The crowd has started betting on you. Small amounts.]', '[D-rank. Your file has been moved to a thicker folder.]'],
  C: ['[C-rank Entrant. Rivals have begun to read your record.]', '[C-rank. Competent. The System does not say this often.]'],
  B: ['[B-rank Entrant. The gods have stopped laughing during your fights.]', '[B-rank. Your worlds are judged with some reluctance.]'],
  A: ['[A-rank Entrant. Final Champions have been informed.]', '[A-rank. The System is watching more closely. For your benefit.]'],
  S: ['[S-rank Entrant {champ}. The tournament knows your name.]', '[S-rank. There is no higher rank. Records indicate otherwise.]'],
  SS: ['[SS-rank. This rank was not supposed to be reachable.]', '[SS-rank Entrant. Several records have been unsealed for you.]'],
  SSS: ['[SSS-rank. The Undefeated has been notified.]', '[SSS-rank Entrant {champ}. The System has no further grades. It is making one up.]'],
};
// Rival replies, Mass Effect style: before your first move against a named rival, up to 2 lines you qualify for (same checks
// as event stat lines). Optional: using a skill moves on without one. The result is told after the tap.
const RIVAL_REPLIES = [
  { check: { stat: 'STR', hard: true }, label: 'Stare them down', go: f => { f.B.weaken += 1; return `[${f.B.name} blinks first. Weakened.]`; } },
  { check: { stat: 'INT', hard: true }, label: 'Read their stance', go: f => { f.foresight = true; return `[You can read ${f.B.name} now. Their next 2 moves are shown.]`; } },
  { check: { stat: 'AGI', hard: true }, label: 'Feint', go: f => { f.A.evade += 1; return `[${f.B.name} bites on the feint. You will evade their next attack.]`; } },
  { check: { stat: 'VIT', hard: true }, label: '"Hit me, then."', go: f => { const b = Math.round(f.A.maxHp * 0.1); f.A.block += b; return `[You plant your feet. +${b} Block.]`; } },
  // then one line per god, from GODS (js/content/gods.js)
].concat(Object.entries(GODS).map(([g, G]) => ({ check: { favour: g }, label: G.reply.label, go: G.reply.go })));
function rivalReplies(run, f) {
  if (!f || f.spec.kind !== 'rival' || f.replied || f.turn > 1 || f.phase !== 'player' || run.practice) return [];
  return RIVAL_REPLIES.map((r, i) => i).filter(i => checkMet(run, null, RIVAL_REPLIES[i].check)).slice(0, 2);
}
function rivalReply(run, f, i) { if (!rivalReplies(run, f).includes(i)) return null; f.replied = true; return RIVAL_REPLIES[i].go(f); }
function rankAddress(meta, champ, n) { const L = RANK_ADDRESS[meta.rank.letter]; return L[(n || 0) % L.length].replace('{champ}', champ || 'Entrant'); }
// The fight intro, rank against rank. Returns the lines to show after "[X enters the arena.]"; the System's own lines are bracketed.
// A FOE_LINES line, filled in: a [System line] as it is, anything else in quotes
function foeLine(t, run) { t = t.replace('{world}', run.world.name).replace('{champ}', run.champ); return /^\[/.test(t) ? t : `"${t}"`; }
function rankIntro(run, meta, spec, foeName) {
  if (!meta.rank || run.practice) return [];
  const me = meta.rank.letter, champ = run.name, out = [];
  if (spec.id === 'undefeated') return rankIdx(me) >= rankIdx('SS') ? [{ t: 'loss', text: `[Entrant record for the Undefeated: ERROR. Entrant record for ${champ}: ERROR.]`, replaces: 'sealed' }] : [];
  const foe = specRank(spec, meta);
  if (foe) {
    const gap = rankIdx(me) - rankIdx(foe);
    const tail = gap <= -2 ? 'Mismatch logged. The System accepts no complaints.' : gap >= 2 ? 'Mismatch logged. Please try not to embarrass them.' : gap < 0 ? 'The odds have been adjusted against you.' : gap > 0 ? 'The crowd expects a short fight.' : 'An even match, on paper.';
    out.push({ t: 'sys', text: `[${me}-rank Entrant vs ${foe}-rank ${spec.kind === 'trial' ? 'Proctor' : foeName}. ${tail}]` });
    const R = spec.kind === 'rival' && RIVAL_LINES[spec.id];
    if (R) out.push({ t: 'foe', text: `"${meta.archive.beat[spec.id] ? R.grudge : gap < 0 ? R.below : gap > 0 ? R.above : R.level}"` });
    if (spec.id === 'masked') out.push(meta.archive.beat.masked ? { t: 'loss', text: '[The Masked Entrant has copied your record. Including the loss.]' } : { t: 'sys', text: `[Entrant rank: ${me}. Entrant rank: ${me}.]` });
  }
  if (spec.kind === 'final' && !spec.snap && rankIdx(me) >= rankIdx('S') && FINAL_GREET[spec.id]) out.push({ t: 'foe', text: `"${FINAL_GREET[spec.id].replace('{champ}', champ)}"` });
  if (spec.kind === 'trial') out.unshift({ t: 'class', text: trialLine(spec.to, 0, spec.cond) });
  return out;
}
// The Halls' rank history, one line per promotion
function historyLine(h) {
  if (h.daily) return `[Promoted to ${h.to}-rank in the Pending World.]`;
  if (h.outcome === 'erased') return `[Promoted to ${h.to}-rank. ${h.world} was erased on the way.]`;
  return h.lost ? `[Promoted to ${h.to}-rank. ${h.world} was spared, missing ${h.lost} entr${h.lost === 1 ? 'y' : 'ies'}.]` : `[Promoted to ${h.to}-rank. ${h.world} was spared without a scratch.]`;
}
// Champion rank: a filed champion keeps its Entrant's rank, earns 10 RP for each win in another Entrant's tournament,
// and climbs a letter every 30 RP, up to S. Returns the System's line for the owner, or null.
const CHAMP_STEP = 30;
function champWin(snap, spared) {
  snap.kills = (snap.kills || 0) + 1; snap.rp = (snap.rp || 0) + 10;
  let up = false;
  while (snap.rp >= CHAMP_STEP && rankIdx(snap.rank || 'F') < rankIdx('S')) { snap.rp -= CHAMP_STEP; snap.rank = nextRank(snap.rank || 'F'); up = true; }
  const who = snap.champ, n = snap.kills;
  if (spared) return up ? `[Your champion ${who}, now ${snap.rank}-rank, has defended the elite bracket ${n} time${n === 1 ? '' : 's'}.]` : null;
  if (up) return `[Your erased champion ${who}, now ${snap.rank}-rank, has erased ${n} world${n === 1 ? '' : 's'}.]`;
  return n === 1 ? `[Your erased champion ${who} has erased a world in another Entrant's tournament.]` : null;
}
// Pending World seasons: one week, Monday to Monday on the game-day clock. Each daily top-10 place pays points,
// and every posted score pays 1. The week's top Entrant is the Prime Entrant until the next season closes.
const SEASON_PTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SEASON_TITLE = 'Prime Entrant';
function weekOf(date) { const d = Date.parse(date + 'T00:00:00Z'), back = (new Date(d).getUTCDay() + 6) % 7; return new Date(d - back * 864e5).toISOString().slice(0, 10); }
function weekDates(start) { const d = Date.parse(start + 'T00:00:00Z'); return Array.from({ length: 7 }, (_, i) => new Date(d + i * 864e5).toISOString().slice(0, 10)); }
// days: one list per game day, each sorted best first (the day's top 20). Later days set the name, sigil and rank shown.
function seasonTable(days) {
  const by = {};
  days.forEach(rows => (rows || []).forEach((r, i) => {
    const e = by[r.uid] = by[r.uid] || { uid: r.uid, pts: 0, days: 0, best: 0 };
    e.pts += (SEASON_PTS[i] || 0) + 1; e.days++; e.best = Math.max(e.best, r.score || 0);
    Object.assign(e, { name: r.name, sigil: r.sigil, color: r.color, rank: r.rank || null });
  }));
  return Object.values(by).sort((a, b) => b.pts - a.pts || b.best - a.best || (a.uid < b.uid ? -1 : 1));
}
function choosePerk(run, meta, k, msgs) {
  const i = run.pending.findIndex(p => p.type === 'perk'); if (i < 0) return false;
  const p = run.pending[i]; if (!p.offers.includes(k) || meta.rank.perks.includes(k)) return false;
  run.pending.splice(i, 1); meta.rank.perks.push(k);
  msgs && msgs.push({ t: 'class', text: `[Class advancement: ${PERKS[k].name}. Active from your next world.]` });
  return true;
}

if (typeof module !== 'undefined') module.exports = {
  VERSION, STATS, STAT_INFO, RANKS, RESIST, STAT_FACES, resistOf, resistance, PRICE, ARCH, ARCH_KEYS, START_ARCH, archTier, SKILLS, SHOP_SKILLS, GEAR, GEAR_SLOTS, STAR_MULT, gearPas, gearText, gearTop, readHits, readDef, ADVANCE, advOf, advance, gearStats, isGear, pieceDef, baseId,
  PREFIXES, MAX_MODS, MAX_MODS_CORRUPT, GLITCH_GEAR, GLITCH_SKILL, GLITCH_TRAIT, KNOWN_ISSUES, BUG_BOUNTY, issueKey, issueName, issuesSeen, fileIssues, GLITCH_DAY, glitchDay, glitchMul, CORRUPT_WORLD, rollTraits, unstableSkill, registerGlitchGear, spliceGear, spliceId, GLITCH_PREFIXES, bareMod, glitchesOn, corruptTargets, corruptOptions, corruptText, corrupt, prefixOk, rollPrefixes, moddedDef, effRank, modName, GODS, WORLD_TYPES, WORLD_RANKS, MODIFIERS, GIFTS, GIFT_CATS, SIGILS, SIGIL_COLS, giftBudget, giftsAllowed, giftCheck, SYS_BONUS, ROLL_PTS, rollStats,
  ENEMIES, MONSTERS, MONSTER_ROUNDS, RIVALS, ROUNDS, summonSpec, amendOf, rollChance, rollTag, pushEvent, ROLL_BASE, ROLL_HARD, ROLL_PER, UNLOCKS, TUNE, GATES, CURVE, noticeOf, noticeMul, BREAK, addBreak, HEART_COST, REACTIONS, FEATS, FEAT_ATS, FEAT_TOOLS, WAGER_FEATS, featCtx, featOk, featPossible, featFair, WAGERS, DISTRICTS, EVENTS, CHAINS, eventText, ENEMY_TRAITS, ENEMY_PASSIVES, TRAIT_POOL, TRAIT_COUNT,
  RANK_LADDER, RANK_RP, TRIAL_ROUND, TRIAL_CONDS, PERKS, TRIAL_TEXT, COND_TEXT, newRank, rankIdx, nextRank, hasPerk, worldCap, sanitizeRank, rpFor, awardRank, openTrial, eliteRank, RANK_ADDRESS, RIVAL_LINES, FINAL_GREET, rankAddress, rankIntro, historyLine, CHAMP_STEP, champWin, SEASON_PTS, SEASON_TITLE, weekOf, weekDates, seasonTable, trialSpec, trialMul, trialLine, perkOffers, settleTrial, choosePerk,
  mulberry32, hashStr, seedRng, runRng, stream, dailyDate, dailySeed, dailyWorld, dailyRecord, levelMeta, dailyScore,
  LORE, REC_SIZE, REC_MAX, loreName, loreWho, LAYER_BASE, FATES, PEOPLES, CONFLUENCE, layersOf, snapLayers, layerNames, recLore, settingOf, suits, WORLD_GEN, genWorld, genWorldV1, worldName, joinName, worldArch, buildRecord, ensureRecord, eraseRecord, restoreRecord, amendRecord, sanitizeRec, recLeft, recWorldGone, partialWords, recEntries, bioParts, recFragment,
  pick, shuffle, newMeta, migrateMeta, unlockedArch, offerWorlds, STEER_COST, STEER_KINDS, steerOptions, steerWorld, RECENT_MAX, RECENT_TYPES, staleWorld, rememberWorld, worldPulse, FATE_TRACK, moveFate, fateState, fateEnd, closeFate, crisisDue, visitDue, checkMet, customOf, customPaid, clashOf, clashDue, silent, champTitle, foeLine, enchantCount, runeCount, applyAlways, WORLD_LEAN, worldTagged, newRun, hasGift, effStats, maxHp, POINT_PRICE, pointPrice, INCOME, interestOf, interestCap, LEVEL_MAX, LEVEL_PERKS, levelPerk, levelPerkOutcomes, levelPerkText, offerLevel, takeLevel, trainStat, oddsFor, poolIds, rollPiece, price, sellValue, refreshShop, reroll, income, interestCap, SHOP_KINDS, ensureShop, shopItem, ownedCopies,
  allPieces, findPiece, canBuy, buy, sell, addPiece, movePiece, equipBest, evolve, checkMerges, mergeNeed, wouldMerge, archCounts, runCounts, buildP, runP, favourTiers,
  makeChoices, specName, specRank, specStyle, specReward, specKey, chooseOpponent, currentSpec, heartCost, makeWager, addFavour, rollDistricts, infirmary, sanctum, eventOpt, eventOpts, checkTag, RIVAL_REPLIES, rivalReplies, rivalReply, districtUp, DISTRICT_STAT, STAT_EASY, resolveEvent, prefixTargets, applyPrefix,
  rollDraft, rollGearDraft, rerollDraft, confirmDraft, startStat, rollStart, unrollStart, placeStartStats, SHARED, setShared, sanitizeSnap, enterChoose, leaveShop, useDistrict, curRound,
  TITLES, FINAL_TITLE, QUESTS, OUTCOMES, outcomeText, applyOutcomes, HIDDEN_PATHS, MILESTONES, CHAIN_STARTERS, giftUnlocked, giftLockText, makeOffer, giftCost, randomGifts, bindMeta, earnTitle, worldFirst, questEvent, extraGiftOffers, applyGift, checkMilestones, hiddenPathOf, undercityEvent, dueChainEvents, rerollCost, checkPath,
  buildPlayer, buildEnemy, snapshot, usePatch, patchOffer, givePiece, RARE_PATCH, POOL, POOL_SIZE, POOL_ROUNDS, POOL_HEARTS, poolResolve, finalFill, finalResolve, genPair, pairOf, finalId, POOL_KEYS, POOL_SEED, poolOn, poolSlot, poolId, poolSnap, poolReserve, poolSpec, poolFill, poolStyle, poolIntro, newFight, playerAct, rerollDie, resolveDice, DIE_FACES, dmgMult, jinxMove, canJinx, jinxCost, jinxRole, JINX_COST, skipPlayer, enemyTurn, intentInfo, previewSkill, describe, canUse, resolveFight, startElite, endRun, echoesFor, skillPower, notePick, runSummary, PICKS_MAX, feedbackDoc, FEEDBACK_TYPES, FEEDBACK_MAX,
};
