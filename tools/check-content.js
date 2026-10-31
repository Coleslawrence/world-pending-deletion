// Content checker: catches content mistakes before they reach players. CI runs it on every pull request.
//   node tools/check-content.js           # exits 1 on any error; warnings are printed but pass
//   node tools/check-content.js --write   # after adding content: records the new ids and rewrites the effect lists in docs/CONTENT.md
// Checks that content files are all loaded and never call core.js; ids are well formed and never removed, and World Record
// pools only grow at the end; every field is known and every reference points at something real; every effect key is one
// the engine reads; every event keeps an option anyone can take, and its costs are in its words; player text follows the style guide (British spelling,
// no em-dashes, length limits); and no two player-facing things share a name.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const G = require('../js/core.js');
// Content names are globals under Node (core.js loads js/content/ into the global scope); WHEEL isn't exported.
const C = vm.runInThisContext('({ EFFECTS, STATS, RANKS, ARCH, START_ARCH, WHEEL, SKILLS, GEAR, GEAR_SLOTS, GODS, WORLD_TYPES, MODIFIERS, LORE, FINAL_GREET, GIFTS, GIFT_CATS, TITLES, FINAL_TITLE, QUESTS, QUEST_REWARD, HIDDEN_PATHS, ENEMIES, MONSTERS, RIVALS, RIVAL_LINES, EVENTS, CHAINS, TRAIT_POOL, TRAIT_COUNT })');
const WRITE = process.argv.includes('--write');
const IDS_FILE = 'tools/content-ids.json', DOC_FILE = 'docs/CONTENT.md';
const errors = [], warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`), warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const core = read('js/core.js'), bot = read('tools/bot.js');

// ---------- Files: every content file is loaded, in time, cached for offline play, and stands alone ----------
const html = read('index.html'), sw = read('sw.js');
const walk = d => fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(d + '/' + e.name) : e.name.endsWith('.js') ? [d + '/' + e.name] : []);
const onDisk = walk('js/content'), tags = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const listed = tags.filter(f => f.startsWith('js/content/')), cached = [...sw.match(/const CORE = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
onDisk.filter(f => !listed.includes(f)).forEach(f => err(f, 'not loaded: add a <script> tag for it to index.html, before js/core.js'));
listed.filter(f => tags.indexOf(f) > tags.indexOf('js/core.js')).forEach(f => err(f, 'loaded after js/core.js in index.html; content must load first'));
listed.filter(f => !cached.includes(f)).forEach(f => err(f, "missing from the CORE list in sw.js, so it won't work offline"));
listed.filter(f => !onDisk.includes(f)).forEach(f => err(f, 'listed in index.html but the file does not exist'));
// Content may use only other content: run it all in an empty context, without core.js, and call its text functions
const box = vm.createContext({});
listed.filter(f => onDisk.includes(f)).forEach(f => { try { vm.runInContext(read(f), box, { filename: f }); } catch (e) { err(f, 'fails without core.js (content may use only js/content/): ' + e.message); } });
try { const any = new Proxy({}, { get: () => 2 }); Object.entries(vm.runInContext('GEAR', box)).forEach(([k, g]) => { try { g.text(any); } catch (e) { err('gear ' + k, 'text uses something outside js/content/: ' + e.message); } }); } catch (e) { /* reported above */ }
// Event and reply functions run against a stand-in run and helpers; only a name content can't see is reported
const stub = () => new Proxy(function () { }, { get: (_, k) => k === Symbol.toPrimitive ? () => 2 : k === 'filter' ? () => [] : stub(), set: () => true, apply: () => stub() });
// Run twice with helpers that answer differently, so both sides of a simple if are tried
const kits = [false, true].map(yes => ({ say() { }, favour() { }, lose() { }, piece() { }, eraseRecord() { }, maxHp: () => 100, hasGift: () => yes, pick: l => l[yes ? l.length - 1 : 0], shuffle: l => l, meta: yes ? {} : null }));
const outside = (where, f) => { try { f(); } catch (e) { if (e && e.name === 'ReferenceError') err(where, 'uses something outside js/content/ (use the h helpers): ' + e.message); } };
try {
  Object.entries(vm.runInContext('EVENTS', box)).forEach(([k, E]) => {
    if (typeof E.text === 'function') outside(`event ${k} text`, () => E.text(stub()));
    E.opts.forEach((o, i) => ['go', 'reveal', 'can'].filter(f => typeof o[f] === 'function').forEach(f => kits.forEach(kit => outside(`event ${k} option ${i + 1} ${f}`, () => o[f](stub(), kit)))));
  });
  Object.entries(vm.runInContext('GODS', box)).forEach(([k, g]) => g.reply && outside(`gods ${k} reply`, () => g.reply.go(stub())));
} catch (e) { /* reported above */ }

// ---------- Ids: well formed, never removed; World Record pools only grow at the end ----------
const ID = /^[a-z][a-z0-9_]*$/;
const lists = { skills: C.SKILLS, gear: C.GEAR, archetypes: C.ARCH, gods: C.GODS, worlds: C.WORLD_TYPES, modifiers: C.MODIFIERS, enemies: C.ENEMIES, gifts: C.GIFTS, titles: C.TITLES, quests: C.QUESTS, paths: C.HIDDEN_PATHS, events: C.EVENTS, chains: C.CHAINS, traitPool: C.TRAIT_POOL };
const nowIds = {};
Object.entries(lists).forEach(([kind, o]) => { nowIds[kind] = Object.keys(o); if (kind !== 'paths') nowIds[kind].filter(k => !ID.test(k)).forEach(k => err(kind + ' ' + k, 'ids are lower case letters, digits and _')); });
nowIds.eventOptions = {}; Object.entries(C.EVENTS).forEach(([k, E]) => nowIds.eventOptions[k] = E.opts.length);
nowIds.lore = {}; Object.entries(C.LORE).forEach(([w, L]) => nowIds.lore[w] = { roles: L.roles, promises: L.promises, entries: L.entries.map(e => e.name) });
const saved = fs.existsSync(path.join(ROOT, IDS_FILE)) ? JSON.parse(read(IDS_FILE)) : null;
if (saved) {
  Object.keys(lists).forEach(kind => (saved[kind] || []).filter(k => !nowIds[kind].includes(k)).forEach(k => err(kind + ' ' + k, 'was removed or renamed. Ids are permanent: saves, shared champions and the Halls store them. Change the name, keep the id')));
  Object.entries(saved.lore || {}).forEach(([w, L]) => ['roles', 'promises', 'entries'].forEach(a => {
    const cur = (nowIds.lore[w] || {})[a] || [];
    if (L[a].some((x, i) => cur[i] !== x)) err(`World Record ${w} ${a}`, 'an existing line was reordered, changed or removed. Runs store pool positions, so pools only grow at the end');
  }));
  Object.entries(saved.eventOptions || {}).forEach(([k, n]) => { if ((nowIds.eventOptions[k] || 0) < n) err('event ' + k, `had ${n} options, now ${nowIds.eventOptions[k] || 0}. Run summaries store the option picked by its place, so options are never removed: add new ones at the end`); });
  const added = Object.keys(lists).flatMap(kind => nowIds[kind].filter(k => !(saved[kind] || []).includes(k)).map(k => kind + ' ' + k))
    .concat(Object.entries(nowIds.lore).flatMap(([w, L]) => ['roles', 'promises', 'entries'].filter(a => L[a].length > ((saved.lore[w] || {})[a] || []).length).map(a => `World Record ${w} ${a}`)));
  if (added.length && !WRITE) err(IDS_FILE, `new content isn't recorded yet (${added.slice(0, 5).join(', ')}${added.length > 5 ? ', …' : ''}). Run node tools/check-content.js --write and commit the result`);
} else if (!WRITE) err(IDS_FILE, 'missing. Run node tools/check-content.js --write');

// ---------- Fields: required ones present, nothing unknown (a typo is an unknown field) ----------
const MECHANICS = G.ENEMY_TRAITS;
const SCHEMA = {
  skills: [C.SKILLS, ['id', 'name', 'tags', 'rank', 'cd', 'fx', 'kind'], ['evo', 'base', 'noShop', 'quick', 'basic']],
  gear: [C.GEAR, ['name', 'slot', 'tags', 'rank', 'stats', 'pas', 'text'], ['fix']],
  archetypes: [C.ARCH, ['name', 'stat', 'theme', 'path', 'b', 'p'], []],
  gods: [C.GODS, ['name', 'short', 'arch', 'blessing', 'bless', 'reply'], []],
  worlds: [C.WORLD_TYPES, ['name', 'flavour', 'home', 'gift', 'final', 'names', 'champs'], []],
  modifiers: [C.MODIFIERS, ['name', 'desc'], []],
  enemies: [C.ENEMIES, ['name', 'style', 'tier', 'hp', 'skills', 'script'], ['rank', 'rival', 'final', 'phase', 'passives'].concat(MECHANICS)],
  gifts: [C.GIFTS, ['name', 'cat', 'cost', 'desc'], ['lock', 'arch', 'p']],
  titles: [C.TITLES, ['name', 'cond', 'desc'], ['first', 'p']],
  effects: [C.EFFECTS, ['say'], ['how', 'lvl', 'enemy', 'theme', 'must']],
  quests: [C.QUESTS, ['text', 'reward', 'goal'], ['hidden', 'by']],
  paths: [C.HIDDEN_PATHS, ['name', 'desc', 'fx'], []],
  events: [C.EVENTS, ['title', 'text', 'opts'], ['chain', 'weight']],
  chains: [C.CHAINS, ['name', 'start'], []],
  traitPool: [C.TRAIT_POOL, ['name', 'desc'], ['passives', 'traits']],
};
const OPTION = [['label', 'desc'], ['check', 'pay', 'can', 'then', 'go', 'reveal']], THEN = ['gold', 'stats', 'next', 'chain', 'favour'];
Object.entries(SCHEMA).forEach(([kind, [o, need, may]]) => Object.entries(o).forEach(([k, d]) => {
  need.filter(f => d[f] == null).forEach(f => err(`${kind} ${k}`, `missing ${f}`));
  Object.keys(d).filter(f => !need.includes(f) && !may.includes(f)).forEach(f => err(`${kind} ${k}`, `unknown field ${f} (a typo, or a new field core.js doesn't read)`));
}));
Object.entries(C.EVENTS).forEach(([k, E]) => (E.opts || []).forEach((o, i) => {
  const w = `event ${k} option ${i + 1}`;
  Object.keys(o).filter(f => !OPTION[0].includes(f) && !OPTION[1].includes(f)).forEach(f => err(w, `unknown field ${f} (a typo, or a new field core.js doesn't read)`));
  Object.keys(o.then || {}).filter(f => !THEN.includes(f)).forEach(f => err(w, `unknown outcome then.${f}; outcomes are ${THEN.join(', ')}, anything else goes in go`));
}));

// ---------- References: everything named points at something real ----------
const archs = Object.keys(C.ARCH), isArch = a => archs.includes(a);
const ref = (where, ok, what) => { if (!ok) err(where, what); };
Object.values(C.SKILLS).forEach(s => {
  const w = 'skills ' + s.id;
  s.tags.forEach(t => ref(w, isArch(t), `tag ${t} is not an archetype`));
  ref(w, C.RANKS.includes(s.rank), `rank ${s.rank} is not one of ${C.RANKS.join(' ')}`);
  (s.evo || []).forEach(e => ref(w, C.SKILLS[e] && C.SKILLS[e].base === s.id, `evolution ${e} is missing`));
  if (!s.basic && !s.base) ref(w, (s.evo || []).length === 2, 'needs two ★3 evolutions');
});
Object.entries(C.GEAR).forEach(([k, g]) => {
  const w = 'gear ' + k;
  ref(w, C.GEAR_SLOTS.includes(g.slot), `slot ${g.slot} is not one of ${C.GEAR_SLOTS.join(', ')}`);
  g.tags.forEach(t => ref(w, isArch(t), `tag ${t} is not an archetype`));
  ref(w, C.RANKS.includes(g.rank), `rank ${g.rank} is unknown`);
  Object.keys(g.stats).forEach(s => ref(w, C.STATS.includes(s), `stat ${s} is unknown`));
});
Object.entries(C.ARCH).forEach(([k, a]) => { ref('archetypes ' + k, C.STATS.includes(a.stat), `stat ${a.stat} is unknown`); ref('archetypes ' + k, a.b.length === 3 && a.p.length === 3, 'needs 3 tier bonuses, in b (words) and p (effects)'); });
ref('archetypes WHEEL', C.WHEEL.length === archs.length && archs.every(a => C.WHEEL.includes(a)), 'the wheel must hold every archetype exactly once');
C.START_ARCH.forEach(a => ref('archetypes START_ARCH', isArch(a), `${a} is not an archetype`));
Object.entries(C.GODS).forEach(([k, g]) => {
  g.arch.forEach(a => ref('gods ' + k, isArch(a), `${a} is not an archetype`));
  ref('gods ' + k, C.GIFTS['chosen_' + k] && C.GIFTS['chosen_' + k].cat === 'divine', `needs a divine Gift chosen_${k} in gifts.js`);
  ref('gods ' + k, g.reply && g.reply.label && typeof g.reply.go === 'function', 'reply needs a label and go(f)');
});
const nextRead = new Set([...core.matchAll(/nextFlags\.(\w+)/g)].map(m => m[1]));
const checkOk = c => c && (c.stat ? C.STATS.includes(c.stat) : c.favour ? !!C.GODS[c.favour] : c.luck === true);
Object.entries(C.CHAINS).forEach(([c, ch]) => ref('chains ' + c, C.EVENTS[ch.start] && C.EVENTS[ch.start].chain === c, `start ${ch.start} is not an event in this chain`));
Object.entries(C.EVENTS).forEach(([k, E]) => {
  if (E.chain) ref('event ' + k, C.CHAINS[E.chain], `chain ${E.chain} is not in CHAINS`);
  E.opts.forEach((o, i) => {
    const w = `event ${k} option ${i + 1}`, T = o.then || {};
    if (o.check) ref(w, checkOk(o.check), `check ${JSON.stringify(o.check)} is not { stat }, { favour: god } or { luck: true }`);
    if (o.pay != null) {
      ref(w, Number.isInteger(o.pay) && o.pay > 0, 'pay is a whole number of gold');
      ref(w, new RegExp(`\\b${o.pay} gold\\b`).test(o.label + ' ' + o.desc), `pays ${o.pay} gold, so the label or desc says "${o.pay} gold": paying is the action`);
    }
    Object.keys(T.stats || {}).forEach(s => ref(w, C.STATS.includes(s), `stat ${s} is unknown`));
    Object.keys(T.favour || {}).forEach(g => ref(w, C.GODS[g], `${g} is not a god`));
    Object.keys(T.next || {}).forEach(f => ref(w, nextRead.has(f), `core.js never reads nextFlags.${f}, so it does nothing`));
    if (T.chain) {
      ref(w, E.chain, 'then.chain needs the event to be in a chain');
      if (typeof T.chain === 'object') ref(w, C.EVENTS[E.chain + '_' + T.chain.step] && Number.isInteger(T.chain.after) && T.chain.after > 0, `chain step ${T.chain.step} needs an event ${E.chain}_${T.chain.step} and a whole number of rounds in after`);
    }
  });
});
Object.entries(C.WORLD_TYPES).forEach(([k, t]) => {
  const w = 'worlds ' + k, F = C.ENEMIES[t.final];
  ref(w, isArch(t.home), `home ${t.home} is not an archetype`);
  ref(w, C.GIFTS[t.gift] && C.GIFTS[t.gift].cat === 'world', `gift ${t.gift} is not a World Gift`);
  ref(w, F && F.final, `final ${t.final} is not a Final Champion in enemies.js`);
  ref(w, C.TITLES[C.FINAL_TITLE[t.final]], `no world-first Title for ${t.final} in FINAL_TITLE`);
  ref(w, typeof C.FINAL_GREET[t.final] === 'string', `no FINAL_GREET line for ${t.final}`);
  ref(w, C.LORE[k] && C.LORE[k].entries.length >= 14, 'needs a World Record pool of at least 14 entries in LORE');
  ref(w, t.names.length === 2 && t.names.every(a => a.length >= 4), 'names needs two lists of syllables');
  ref(w, t.champs.length >= 4, 'needs at least 4 champion names');
});
Object.entries(C.ENEMIES).forEach(([k, e]) => e.script.forEach(i => ref('enemies ' + k, Number.isInteger(i) && e.skills[i], `script move ${i} does not exist`)));
// Traits: the numbers make sense; phases point at real moves; passives are ones that work on enemies; the trait pool too
const share = v => typeof v === 'number' && v > 0 && v < 1, every = v => Number.isInteger(v) && v >= 2;
const TRAIT_OK = { enrage: [share, 'a share of max HP between 0 and 1'], enrageMult: [v => v > 1, 'a damage multiplier above 1'], dodge: [share, 'a chance between 0 and 1'], adapt: [share, 'the share of damage taken from your most used skill, between 0 and 1'],
  flood: [every, 'every how many turns, 2 or more'], twincast: [every, 'every how many turns, 2 or more'], revive: [share, 'the share of max HP it rises with, between 0 and 1'], aura: [v => v > 0, 'Burn per turn'], briar: [v => v > 0, 'Bleed per turn'], forge: [v => v > 0, 'Block gained per turn'] };
const traitCheck = (w, o) => Object.entries(o).forEach(([t, v]) => { if (!TRAIT_OK[t]) err(w, `${t} is not a trait (${MECHANICS.join(', ')})`); else if (!TRAIT_OK[t][0](v)) err(w, `${t} is ${JSON.stringify(v)}; it should be ${TRAIT_OK[t][1]}`); });
Object.entries(C.TRAIT_POOL).forEach(([k, T]) => {
  const w = 'trait pool ' + k;
  traitCheck(w, T.traits || {});
  Object.keys(T.passives || {}).forEach(p => ref(w, G.ENEMY_PASSIVES[p], `passive ${p} doesn't work on enemies`));
  ref(w, T.passives || T.traits, 'needs passives or traits, or it does nothing');
});
ref('trait pool TRAIT_COUNT', Array.isArray(C.TRAIT_COUNT) && C.TRAIT_COUNT.every(n => Number.isInteger(n) && n >= 0 && n <= Object.keys(C.TRAIT_POOL).length), 'one whole number per round, no more than the pool holds');
Object.entries(C.ENEMIES).forEach(([k, e]) => {
  const w = 'enemies ' + k;
  traitCheck(w, Object.fromEntries(MECHANICS.filter(t => e[t] != null).map(t => [t, e[t]])));
  Object.keys(e.passives || {}).forEach(p => ref(w, G.ENEMY_PASSIVES[p], `passive ${p} doesn't work on enemies (they can use ${Object.keys(G.ENEMY_PASSIVES).join(', ')})`));
  const ph = e.phase; if (!ph) return;
  const moves = e.skills.concat(ph.add || []);
  Object.keys(ph).filter(f => !['at', 'say', 'script', 'add', 'set'].includes(f)).forEach(f => err(w + ' phase', `unknown field ${f} (at, say, script, add, set)`));
  ref(w + ' phase', share(ph.at), 'at is the share of max HP the phase starts at, between 0 and 1');
  ref(w + ' phase', typeof ph.say === 'string' && /^\[.*\]$/.test(ph.say), 'say is the System line announcing it, in [brackets]');
  ref(w + ' phase', Array.isArray(ph.script) && ph.script.length && ph.script.every(i => Number.isInteger(i) && moves[i]), `script must list moves that exist (0 to ${moves.length - 1}; added moves come after the enemy's own)`);
  (ph.add || []).forEach(m => ref(w + ' phase', m.n && m.fx, 'each added move needs n and fx'));
  traitCheck(w + ' phase set', ph.set || {});
  if (e.revive && ph.at <= e.revive) warn(w + ' phase', `starts at ${ph.at} of max HP, at or below where it rises (${e.revive}), so it may start only after it rises`);
});
C.MONSTERS.concat(C.RIVALS).forEach(k => ref('enemies', C.ENEMIES[k], `${k} is listed in MONSTERS or RIVALS but not defined`));
C.RIVALS.forEach(k => ref('enemies ' + k, C.ENEMIES[k] && C.ENEMIES[k].rival, 'is in RIVALS but not marked rival: true'));
Object.entries(C.RIVAL_LINES).forEach(([k, L]) => { ref('enemies ' + k, C.RIVALS.includes(k), 'has rival lines but is not a rival'); ['below', 'level', 'above', 'grudge'].forEach(f => ref('enemies ' + k, L[f], `rival lines need ${f}`)); });
Object.entries(C.GIFTS).forEach(([k, g]) => {
  ref('gifts ' + k, g.cat === 'extra' || C.GIFT_CATS[g.cat], `category ${g.cat} is unknown`);
  if (g.lock) ref('gifts ' + k, ['echo', 'chain'].includes(g.lock) || C.TITLES[g.lock], `lock ${g.lock} is not echo, chain or a Title`);
  if (g.lock === 'echo') ref('gifts ' + k, G.UNLOCKS['gift_' + k], `is bought with Echoes but UNLOCKS has no gift_${k}`);
});
Object.entries(C.QUESTS).forEach(([k, q]) => ref('quests ' + k, C.QUEST_REWARD[q.reward], `reward ${q.reward} is not in QUEST_REWARD`));
Object.keys(C.HIDDEN_PATHS).forEach(k => { const [a, b] = k.split('+'); ref('paths ' + k, isArch(a) && isArch(b) && a < b, 'key must be two archetypes in alphabetical order, joined by +'); });
archs.forEach((a, i) => archs.slice(i + 1).forEach(b => { const k = [a, b].sort().join('+'); if (!C.HIDDEN_PATHS[k]) warn('paths', `no Hidden Path for ${k}`); }));

// ---------- Effects: every key is one the engine reads ----------
const reads = re => new Set([...core.matchAll(re)].map(m => m[1]));
const fxRead = reads(/\bfx\.(\w+)/g), botRead = new Set([...bot.matchAll(/\bfx\.(\w+)/g)].map(m => m[1]));
const uses = {};
const use = (kind, key, who, v) => { const u = (uses[kind] = uses[kind] || {}); (u[key] = u[key] || []).push([who, v]); };
Object.values(C.SKILLS).filter(s => !s.base).forEach(s => Object.entries(s.fx).forEach(([k, v]) => use('skill', k, s.name, v)));
Object.values(C.SKILLS).filter(s => s.base).forEach(s => Object.entries(s.fx).forEach(([k, v]) => use('skill', k, s.name, v)));
Object.values(C.ENEMIES).forEach(e => e.skills.concat(e.phase && e.phase.add || []).forEach(m => Object.entries(m.fx || {}).forEach(([k, v]) => use('skill', k, `${e.name}: ${m.n}`, v))));
Object.entries(C.GEAR).forEach(([id, g]) => Object.entries(Object.assign({}, g.pas, g.fix)).forEach(([k, v]) => use('gear', k, id, v)));
Object.values(C.ARCH).forEach(a => a.p.forEach((p, i) => Object.entries(p).forEach(([k, v]) => use('arch', k, `${a.name} ${[2, 4, 6][i]}`, v))));
Object.values(C.HIDDEN_PATHS).forEach(h => Object.entries(h.fx).forEach(([k, v]) => use('path', k, h.name, v)));
Object.values(C.GIFTS).forEach(g => Object.entries(g.p || {}).forEach(([k, v]) => use('gift', k, g.name, v)));
Object.values(C.TITLES).forEach(t => Object.entries(t.p || {}).forEach(([k, v]) => use('title', k, t.name, v)));
Object.values(G.PERKS).forEach(t => Object.entries(t.p || {}).forEach(([k, v]) => use('perk', k, t.name, v)));
Object.values(G.MILESTONES).forEach(t => Object.entries(t.p || {}).forEach(([k, v]) => use('milestone', k, t.name, v)));
Object.values(C.GODS).forEach(g => Object.entries(g.bless).forEach(([k, v]) => use('god', k, g.name, v)));
Object.values(C.ENEMIES).forEach(e => MECHANICS.filter(k => e[k] != null).forEach(k => use('enemy', k, e.name, e[k])));
Object.values(C.ENEMIES).forEach(e => e.phase && Object.entries(e.phase.set || {}).forEach(([k, v]) => use('enemy', k, e.name + ' (phase)', v)));
Object.values(C.ENEMIES).forEach(e => Object.entries(e.passives || {}).forEach(([k, v]) => use('passive', k, e.name, v)));
Object.values(C.TRAIT_POOL).forEach(T => { Object.entries(T.passives || {}).forEach(([k, v]) => use('passive', k, 'trait ' + T.name, v)); Object.entries(T.traits || {}).forEach(([k, v]) => use('enemy', k, 'trait ' + T.name, v)); });
Object.entries(uses.skill).forEach(([k, who]) => { if (!fxRead.has(k)) err('effect ' + k, `core.js never reads fx.${k}, so it does nothing (used by ${who[0][0]})`); });
// Passive effects all come from the registry in effects.js, and the engine reads every one of them
const PASSIVE_USES = ['arch', 'gear', 'path', 'gift', 'title', 'perk', 'milestone', 'god', 'passive'];
const passiveUses = k => PASSIVE_USES.flatMap(u => (uses[u] || {})[k] || []);
PASSIVE_USES.forEach(u => Object.entries(uses[u] || {}).forEach(([k, who]) => { if (!C.EFFECTS[k]) err('effect ' + k, `isn't in js/content/effects.js (used by ${who[0][0]}). Add it there with its phrase; a brand new effect also needs code in core.js`); }));
Object.entries(C.EFFECTS).forEach(([k, E]) => {
  const w = 'effects ' + k;
  if (!new RegExp('\\.' + k + '\\b').test(core)) err(w, `core.js never reads it, so it does nothing`);
  if (typeof E.say !== 'function') err(w, 'say(v) gives the words players read for it');
  ref(w, !E.how || ['add', 'set', 'mul', 'min'].includes(E.how), `how is add, set, mul or min, not ${E.how}`);
  ref(w, !E.enemy || ['flat', 'rate'].includes(E.enemy), `enemy is flat or rate, not ${E.enemy}`);
  [].concat(E.theme || []).forEach(t => ref(w, isArch(t), `theme ${t} is not an archetype`));
  if (!passiveUses(k).length) warn(w, 'nothing uses it yet');
});
// Words match mechanics: a description has to state any rule its effects carry that players couldn't guess (must in effects.js)
const described = [];
Object.entries(C.ARCH).forEach(([k, a]) => a.b.forEach((b, i) => described.push([`archetypes ${k} tier ${i + 1}`, b, a.p[i]])));
Object.entries(C.GEAR).forEach(([k, g]) => { try { described.push(['gear ' + k, g.text(G.gearPas(k, 1)), Object.assign({}, g.pas, g.fix)]); } catch (e) { /* reported above */ } });
Object.entries(C.HIDDEN_PATHS).forEach(([k, h]) => described.push(['paths ' + k, h.desc, h.fx]));
Object.entries(C.GODS).forEach(([k, g]) => described.push(['gods ' + k, g.blessing, g.bless]));
Object.entries(C.GIFTS).forEach(([k, g]) => described.push(['gifts ' + k, g.desc, g.p]));
Object.entries(C.TITLES).forEach(([k, t]) => described.push(['titles ' + k, t.desc, t.p]));
Object.entries(G.PERKS).forEach(([k, t]) => described.push(['perks ' + k, t.desc, t.p]));
Object.entries(G.MILESTONES).forEach(([k, t]) => described.push(['milestones ' + k, t.desc, t.p]));
Object.entries(C.TRAIT_POOL).forEach(([k, T]) => described.push(['trait pool ' + k, T.desc, T.passives]));
described.forEach(([w, text, p]) => Object.entries(p || {}).forEach(([k, v]) => {
  const E = C.EFFECTS[k];
  if (E && E.must && !E.must.test(text)) err(w, `uses ${k}, so its words have to say what effects.js says about it, like "${E.say(v)}"`);
}));
Object.keys(uses.enemy).forEach(k => { if (!new RegExp('\\.' + k + '\\b').test(core)) err('enemy mechanic ' + k, 'core.js never reads it'); });

// ---------- Events: one option is always there to take ----------
Object.entries(G.EVENTS).forEach(([k, E]) => {
  if (!E.opts.some(o => !o.can && !o.check && !o.pay)) err('event ' + k, 'every option has a condition, so the screen could be empty: keep one that anyone can take');
  E.opts.forEach((o, i) => { if (!o.label || !o.desc) err(`event ${k} option ${i + 1}`, 'needs a label (an action) and a desc (a hint)'); });
});

// ---------- Player text: the style guide's checks that a script can make ----------
const words = s => s.trim().split(/\s+/).length;
const US = /\b(armor\w*|colors?|colored|honors?|honored|favors?|favored|favorite|centers?|centered|defense|offense|gray|traveler\w*|\w+iz(?:e|es|ed|ing|ation)|theaters?|meters?)\b/gi;
const NOT_US = /^(size\w*|prize\w*|seize\w*|capsize\w*|baize)$/i;
const texts = [];
const say = (where, s, limit) => { if (typeof s === 'string') texts.push([where, s, limit]); };
const sampleRun = new Proxy({}, { get: (_, k) => k === 'chains' ? new Proxy({}, { get: () => ({ who: 'lyss' }) }) : k === 'sabotage' ? 'lyss' : undefined });
Object.values(C.SKILLS).forEach(s => say('skills ' + s.id, s.name));
Object.entries(C.GEAR).forEach(([k, g]) => { say('gear ' + k, g.name); try { say('gear ' + k, g.text(G.gearPas(k, 1))); } catch (e) { /* reported above */ } });
Object.entries(C.ARCH).forEach(([k, a]) => [a.name, a.theme, a.path, ...a.b].forEach(s => say('archetypes ' + k, s)));
Object.entries(C.GODS).forEach(([k, g]) => [g.name, g.blessing, g.reply && g.reply.label].forEach(s => say('gods ' + k, s)));
Object.entries(C.CHAINS).forEach(([k, c]) => say('chains ' + k, c.name));
Object.entries(C.TRAIT_POOL).forEach(([k, T]) => { say('trait pool ' + k, T.name, 1); say('trait pool ' + k, T.desc, 8); });
Object.entries(C.WORLD_TYPES).forEach(([k, t]) => { say('worlds ' + k, t.name); say('worlds ' + k + ' flavour', t.flavour, 10); });
Object.entries(C.MODIFIERS).forEach(([k, m]) => [m.name, m.desc].forEach(s => say('modifiers ' + k, s)));
Object.entries(C.LORE).forEach(([w, L]) => L.entries.forEach(e => [e.name, e.text, e.near].forEach(s => say(`World Record ${w} ${e.name}`, s))));
Object.entries(C.FINAL_GREET).forEach(([k, s]) => say('greeting ' + k, s));
Object.entries(C.ENEMIES).forEach(([k, e]) => { say('enemies ' + k, e.name); say('enemies ' + k + ' style', e.style, 14); e.skills.concat(e.phase && e.phase.add || []).forEach(m => say('enemies ' + k, m.n)); if (e.phase) say('enemies ' + k + ' phase', e.phase.say, 20); });
Object.entries(C.RIVAL_LINES).forEach(([k, L]) => Object.values(L).forEach(s => say('rival lines ' + k, s)));
Object.entries(C.GIFTS).forEach(([k, g]) => [g.name, g.desc].forEach(s => say('gifts ' + k, s)));
Object.entries(C.TITLES).forEach(([k, t]) => [t.name, t.cond, t.desc].forEach(s => say('titles ' + k, s)));
Object.entries(C.QUESTS).forEach(([k, q]) => say('quests ' + k, q.text));
Object.entries(C.HIDDEN_PATHS).forEach(([k, h]) => [h.name, h.desc].forEach(s => say('paths ' + k, s)));
Object.entries(G.EVENTS).forEach(([k, E]) => {
  say(`event ${k} title`, E.title, 4);
  try { say(`event ${k} text`, G.eventText(sampleRun, k), 35); } catch (e) { /* text that needs a real run is checked in play */ }
  E.opts.forEach((o, i) => {
    say(`event ${k} option ${i + 1} label`, o.label, 5); say(`event ${k} option ${i + 1} desc`, o.desc, 15);
    if (typeof o.reveal === 'string') { say(`event ${k} option ${i + 1} reveal`, o.reveal); if (!/^\[.*\]$/.test(o.reveal)) err(`event ${k} option ${i + 1}`, 'reveal is a System line, so it goes in [brackets]'); }
  });
});
texts.forEach(([where, s, limit]) => {
  if (/[—–]/.test(s)) err(where, `no em-dashes or en-dashes in player text: "${s}"`);
  const us = (s.match(US) || []).filter(x => !NOT_US.test(x));
  if (us.length) err(where, `American spelling (${us.join(', ')}); the game uses British spelling`);
  if (/\s{2,}|^\s|\s$/.test(s)) err(where, `stray spaces in "${s}"`);
  if ((s.match(/\[/g) || []).length !== (s.match(/\]/g) || []).length) err(where, `unbalanced [brackets] in "${s}"`);
  if (limit && words(s) > limit) warn(where, `${words(s)} words, over the style guide's limit of ${limit}: "${s}"`);
});

// ---------- Names: one name, one thing, across everything the player owns or earns ----------
const owners = {};
const own = (name, what) => { (owners[name] = owners[name] || []).push(what); };
Object.values(C.SKILLS).forEach(s => own(s.name, 'skill ' + s.id));
Object.entries(C.GEAR).forEach(([k, g]) => own(g.name, 'gear ' + k));
Object.entries(C.ARCH).forEach(([k, a]) => { own(a.name, 'archetype ' + k); own(a.path, 'path name of ' + k); });
Object.entries(C.GIFTS).forEach(([k, g]) => own(g.name, 'Gift ' + k));
Object.entries(C.TITLES).forEach(([k, t]) => own(t.name, 'Title ' + k));
Object.entries(C.HIDDEN_PATHS).forEach(([k, h]) => own(h.name, 'Hidden Path ' + k));
Object.entries(C.TRAIT_POOL).forEach(([k, T]) => own(T.name, 'enemy trait ' + k));
Object.entries(G.REACTIONS).forEach(([k, r]) => own(r.name, 'reaction ' + k));
Object.entries(G.MILESTONES).forEach(([k, m]) => own(m.name, 'milestone ' + k));
Object.entries(G.PREFIXES).forEach(([k, p]) => own(p.name, 'rune ' + k));
Object.entries(owners).filter(([, w]) => w.length > 1).forEach(([n, w]) => err(`name "${n}"`, `used by ${w.join(' and ')}. One name, one thing`));

// ---------- The effect lists in docs/CONTENT.md, written from the content itself ----------
function effectDoc() {
  const show = v => typeof v === 'number' ? String(v) : JSON.stringify(v);
  const row = (k, who, extra) => `| \`${k}\` | ${who.length} | ${who.slice(0, 3).map(([n, v]) => `${n} (${show(v)})`).join(', ')}${who.length > 3 ? ', …' : ''} |${extra}`;
  const sorted = o => Object.entries(o).sort(([a], [b]) => a.localeCompare(b));
  const line = k => { const d = { fx: {} }; d.fx[k] = uses.skill[k][0][1]; let t = ''; try { t = G.describe(d); } catch (e) { /* needs other keys */ } return t && !t.includes('undefined') ? t.replace(/\|/g, '\\|') : '(works with other keys on the same skill)'; };
  return [
    '### Skill effects (`fx`), used by skills and enemy moves',
    '', '| Key | Used | Examples (value) | Shown to players as | Bot scores it |', '| --- | --- | --- | --- | --- |',
    ...sorted(uses.skill).map(([k, who]) => row(k, who, ` ${line(k)} | ${botRead.has(k) ? 'yes' : 'no'} |`)),
    '', '### Passive effects (`p`), from `js/content/effects.js`',
    '', 'Used by archetype bonuses (`p`), gear (`pas` scales with stars, `fix` does not), Hidden Paths (`fx`), Gifts and Titles (`p`), Rank perks and stat milestones (`p`), god blessings (`bless`, at 8 Favour) and enemies (`passives`, only the ones marked for enemies). Combines: how values from several sources add up. Grows: grows with your level when it comes from gear or an archetype bonus.',
    '', '| Key | Used | Examples (value) | Shown to players as | Combines | Grows | Enemies | Theme |', '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...sorted(C.EFFECTS).map(([k, E]) => { const who = passiveUses(k); let t = ''; try { t = E.say(who.length && typeof who[0][1] === 'number' ? who[0][1] : 1); } catch (e) { /* reported above */ } return row(k, who, ` ${t.replace(/\|/g, '\\|')} | ${E.how || 'add'} | ${E.lvl ? 'yes' : ''} | ${E.enemy ? E.enemy + (E.enemy === 'flat' ? ', scales with power' : '') : ''} | ${[].concat(E.theme || []).map(a => C.ARCH[a] ? C.ARCH[a].name : a).join(', ')} |`); }),
    '', '### Enemy traits (fields on the enemy, or in its phase\'s set)',
    '', '| Key | Used | Examples (value) |', '| --- | --- | --- |', ...sorted(uses.enemy).map(([k, who]) => row(k, who, '')),
  ].join('\n');
}
const START = '<!-- effects:start (written by node tools/check-content.js --write) -->', END = '<!-- effects:end -->';
const doc = read(DOC_FILE), a = doc.indexOf(START), b = doc.indexOf(END);
const fresh = a >= 0 && b > a ? doc.slice(0, a + START.length) + '\n' + effectDoc() + '\n' + doc.slice(b) : null;
if (!fresh) err(DOC_FILE, 'the effect list markers are missing');
else if (fresh !== doc && !WRITE) err(DOC_FILE, 'the effect lists are out of date. Run node tools/check-content.js --write and commit the result');
// Effects the bot doesn't score make the balance sims undervalue whatever uses them
Object.keys(uses.skill).filter(k => !botRead.has(k) && saved && !(saved.botIgnores || []).includes(k)).forEach(k => warn('effect ' + k, "the bot doesn't score it, so balance sims undervalue skills that use it (tools/bot.js choosePlayer)"));

if (WRITE) {
  const botIgnores = Object.keys(uses.skill).filter(k => !botRead.has(k)).sort();
  fs.writeFileSync(path.join(ROOT, IDS_FILE), JSON.stringify(Object.assign({}, nowIds, { botIgnores }), null, 1) + '\n');
  if (fresh) fs.writeFileSync(path.join(ROOT, DOC_FILE), fresh);
  console.log(`wrote ${IDS_FILE} and ${DOC_FILE}`);
}
warnings.forEach(w => console.log('warning  ' + w));
[...new Set(errors)].forEach(e => console.log('ERROR    ' + e));
console.log(`content: ${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'} (${listed.length} files, ${Object.keys(C.SKILLS).length} skills, ${Object.keys(C.GEAR).length} gear, ${Object.keys(C.ENEMIES).length} enemies, ${Object.keys(G.EVENTS).length} events)`);
process.exit(errors.length ? 1 : 0);
