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
const C = vm.runInThisContext('({ EFFECTS, FEATS, FEAT_ATS, OUTCOMES, outcomeText, STATS, RANKS, ARCH, START_ARCH, WHEEL, PIE, themeNear, themePairOk, themeFits, MOVE_ROLES, MOVE_NUMBERS, MOVE_NEEDS, BIG_HIT, moveRole, moveDmg, SKILLS, GEAR, GEAR_SLOTS, GODS, WORLD_TYPES, MODIFIERS, LORE, FINAL_GREET, GIFTS, GIFT_CATS, TITLES, FINAL_TITLE, QUESTS, HIDDEN_PATHS, ENEMIES, MONSTERS, RIVALS, RIVAL_LINES, EVENTS, CHAINS, TRAIT_POOL, TRAIT_COUNT })');
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
// The title screen shows the newest What's new entry's release, so it must match the service worker's VERSION
const swVersion = (sw.match(/const VERSION = '([^']+)'/) || [])[1], notesRelease = (read('js/notes.js').match(/release: '([^']+)'/) || [])[1];
if (notesRelease !== swVersion) err('js/notes.js', `newest entry's release is ${notesRelease || 'missing'} but sw.js VERSION is ${swVersion}; bump both at release`);
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
const lists = { skills: C.SKILLS, gear: C.GEAR, archetypes: C.ARCH, gods: C.GODS, worlds: C.WORLD_TYPES, modifiers: C.MODIFIERS, enemies: C.ENEMIES, gifts: C.GIFTS, titles: C.TITLES, quests: C.QUESTS, feats: C.FEATS, outcomes: C.OUTCOMES, paths: C.HIDDEN_PATHS, events: C.EVENTS, chains: C.CHAINS, traitPool: C.TRAIT_POOL };
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
  skills: [C.SKILLS, ['id', 'name', 'tags', 'rank', 'cd', 'fx', 'kind'], ['evo', 'base', 'noShop', 'quick', 'basic', 'breaks']],
  gear: [C.GEAR, ['name', 'slot', 'tags', 'rank', 'stats', 'pas', 'text'], ['fix']],
  archetypes: [C.ARCH, ['name', 'stat', 'theme', 'path', 'b', 'p', 'line', 'owns', 'words'], []],
  gods: [C.GODS, ['name', 'short', 'arch', 'blessing', 'bless', 'reply'], []],
  worlds: [C.WORLD_TYPES, ['name', 'flavour', 'home', 'gift', 'final', 'names', 'champs'], []],
  modifiers: [C.MODIFIERS, ['name', 'desc'], []],
  enemies: [C.ENEMIES, ['name', 'style', 'tier', 'hp', 'skills', 'script'], ['rank', 'rival', 'final', 'phase', 'passives', 'theme', 'breaks'].concat(MECHANICS)],
  gifts: [C.GIFTS, ['name', 'cat', 'cost', 'desc'], ['lock', 'arch', 'p', 'theme']],
  titles: [C.TITLES, ['name', 'cond', 'desc'], ['first', 'p', 'feat', 'n', 'theme']],
  effects: [C.EFFECTS, ['say'], ['how', 'lvl', 'enemy', 'theme', 'must']],
  feats: [C.FEATS, ['at', 'say', 'hit'], ['n', 'measure', 'must', 'unfairFor', 'needs', 'theme']],
  quests: [C.QUESTS, ['text', 'reward', 'goal', 'feat'], ['hidden', 'by', 'count', 'n', 'theme']],
  outcomes: [C.OUTCOMES, ['say'], ['late']],
  paths: [C.HIDDEN_PATHS, ['name', 'desc', 'fx'], []],
  events: [C.EVENTS, ['title', 'text', 'opts'], ['chain', 'weight', 'theme']],
  chains: [C.CHAINS, ['name', 'start'], ['theme']],
  traitPool: [C.TRAIT_POOL, ['name', 'desc'], ['passives', 'traits']],
};
const OPTION = [['label', 'desc'], ['check', 'pay', 'payHeart', 'can', 'then', 'go', 'reveal']], THEN = Object.keys(C.OUTCOMES);
Object.entries(SCHEMA).forEach(([kind, [o, need, may]]) => Object.entries(o).forEach(([k, d]) => {
  need.filter(f => d[f] == null).forEach(f => err(`${kind} ${k}`, `missing ${f}`));
  Object.keys(d).filter(f => !need.includes(f) && !may.includes(f)).forEach(f => err(`${kind} ${k}`, `unknown field ${f} (a typo, or a new field core.js doesn't read)`));
}));
Object.entries(C.EVENTS).forEach(([k, E]) => (E.opts || []).forEach((o, i) => {
  const w = `event ${k} option ${i + 1}`;
  Object.keys(o).filter(f => !OPTION[0].includes(f) && !OPTION[1].includes(f)).forEach(f => err(w, `unknown field ${f} (a typo, or a new field core.js doesn't read)`));
  Object.keys(o.then || {}).filter(f => !THEN.includes(f)).forEach(f => err(w, `unknown outcome then.${f}; outcomes (outcomes.js) are ${THEN.join(', ')}, anything else goes in go`));
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
// Outcomes: every set of them (an event's then, a quest's reward) uses outcomes that exist, with values that make sense
const outcomeUses = {};
const outcomeOk = (where, T, what) => {
  if (!T || typeof T !== 'object') return err(where, 'outcomes are an object like { gold: 8 } (see outcomes.js)');
  Object.entries(T).forEach(([k, v]) => {
    if (!C.OUTCOMES[k]) return err(where, `unknown outcome ${k}; outcomes (outcomes.js) are ${THEN.join(', ')}`);
    (outcomeUses[k] = outcomeUses[k] || []).push(what);
    if (k === 'gold') ref(where, Number.isInteger(v) && v > 0, 'gold is a whole number above 0');
    if (k === 'heart' || k === 'rune') ref(where, Number.isInteger(v) && v > 0, `${k} is a whole number of them`);
    if (k === 'piece') ref(where, C.RANKS.includes(v), `piece is a rank, one of ${C.RANKS.join(' ')}`);
    if (k === 'stats') Object.keys(v).forEach(s => ref(where, C.STATS.includes(s), `stat ${s} is unknown`));
    if (k === 'favour') Object.keys(v).forEach(g => ref(where, C.GODS[g], `${g} is not a god`));
    if (k === 'next') Object.keys(v).forEach(f => ref(where, nextRead.has(f), `core.js never reads nextFlags.${f}, so it does nothing`));
    if (k === 'foe') Object.entries(v).forEach(([f, n]) => ref(where, ['weaken', 'poison', 'burn', 'hp', 'trait'].includes(f) && typeof n === 'number' && n !== 0, `foe takes weaken, poison, burn, hp (a share) or trait (a count), as numbers; ${f} is not one`));
    if (k === 'max_hp') ref(where, typeof v === 'number' && v !== 0 && Math.abs(v) <= 0.5, 'max_hp is a share of max HP, like -0.1');
    if (k === 'restore' || k === 'notice') ref(where, Number.isInteger(v) && v !== 0 && (k === 'notice' || v > 0), `${k} is a whole number${k === 'notice' ? ' (up or down)' : ' above 0'}`);
  });
};
Object.entries(C.QUESTS).forEach(([k, q]) => { outcomeOk('quests ' + k, q.reward, 'quest ' + k); if (q.reward && q.reward.chain != null) err('quests ' + k, 'chain is an event outcome'); });
Object.keys(C.OUTCOMES).forEach(k => { if (typeof C.OUTCOMES[k].say !== 'function') err('outcomes ' + k, 'say(v) gives the words players read for it'); });
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
    if (o.payHeart != null) {
      ref(w, Number.isInteger(o.payHeart) && o.payHeart > 0, 'payHeart is a whole number of Hearts');
      ref(w, new RegExp(`\\b${o.payHeart} Hearts?\\b`).test(o.label + ' ' + o.desc), `pays ${o.payHeart} Heart${o.payHeart > 1 ? 's' : ''}, so the label or desc says so: paying is the action`);
    }
    if (o.then) outcomeOk(w, T, 'event ' + k);
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
// Feats: wagers, Trials, Titles and quests ask for feats that exist, and their words say what counts (must in feats.js)
const featUses = {};
const askFeat = (where, k, n, text, what) => {
  const F = C.FEATS[k]; if (!F) return err(where, `feat ${k} isn't in js/content/feats.js`);
  (featUses[k] = featUses[k] || []).push(what);
  if (F.must && text != null) { const m = F.must(n != null ? n : F.n); if (!m.test(text)) err(where, `asks for the feat ${k}, so its words have to say what counts, like "${F.say(n != null ? n : F.n)}"`); }
};
Object.entries(C.FEATS).forEach(([k, F]) => {
  const w = 'feats ' + k;
  ref(w, C.FEAT_ATS.includes(F.at), `at is one of ${C.FEAT_ATS.join(', ')}, not ${F.at}`);
  ref(w, typeof F.say === 'function' && typeof F.hit === 'function', 'needs say(n) and hit(c, n)');
  (F.unfairFor || []).forEach(a => ref(w, isArch(a), `unfairFor ${a} is not an archetype`));
  if (F.needs) ref(w, G.FEAT_TOOLS[F.needs], `needs ${F.needs}, which core.js has no check for (FEAT_TOOLS)`);
  [].concat(F.theme || []).forEach(t => ref(w, isArch(t), `theme ${t} is not an archetype`));
});
G.WAGER_FEATS.forEach(k => askFeat('wagers', k, null, null, 'wager'));
Object.entries(C.TITLES).forEach(([k, t]) => { if (t.feat) askFeat('titles ' + k, t.feat, t.n, t.cond, 'Title ' + t.name); else ref('titles ' + k, t.first, 'needs a feat from feats.js, unless it is a world first'); });
Object.entries(C.QUESTS).forEach(([k, q]) => {
  const feats = [].concat(q.feat), w = 'quests ' + k;
  feats.forEach(f => askFeat(w, f, q.count ? q.goal : q.n, q.text, 'quest ' + k));
  if (q.count) ref(w, feats.length === 1 && C.FEATS[feats[0]] && C.FEATS[feats[0]].measure, 'count: true needs one feat with a measure');
  if (feats.length > 1 && feats.every(f => C.FEATS[f])) ref(w, new Set(feats.map(f => C.FEATS[f].at)).size === 1, 'feats asked together must be measured at the same moment');
});
Object.keys(C.FEATS).forEach(k => { if (!featUses[k]) warn('feats ' + k, 'nothing asks for it yet'); });
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

// ---------- Themes: the wheel is a colour pie; content carries one archetype or two neighbours, and uses what they own ----------
const themeOk = (where, t) => { const ts = [].concat(t); ts.forEach(a => ref(where, isArch(a), `theme ${a} is not an archetype`)); if (ts.every(isArch)) ref(where, C.themePairOk(ts), `themes ${ts.join(' + ')} are not neighbours on the wheel (a pair has to be)`); };
// breaks: effects a skill or enemy borrows on purpose, so the warning is silenced once Slaw has said yes
const pieBreak = (where, themes, fx, breaks) => { if ((breaks || []).includes(fx)) return; if (!C.themeFits(themes, fx)) warn(where, `uses ${fx}, which ${C.PIE[fx].map(a => C.ARCH[a].name).join(' and ')} own${C.PIE[fx].length === 1 ? 's' : ''}, off its part of the wheel (a pie break: fine if meant, or retag it)`); };
Object.entries(C.ARCH).forEach(([k, a]) => {
  const w = 'archetypes ' + k;
  ref(w, typeof a.line === 'string' && /\.$/.test(a.line), 'line is one sentence, its philosophy, ending with a full stop');
  ref(w, Array.isArray(a.owns) && a.owns.every(fx => fxRead.has(fx)), 'owns lists skill effects core.js reads (fx keys)');
  ref(w, Array.isArray(a.words) && a.words.length >= 4 && a.words.every(x => /^[a-z]+$/.test(x)), 'words is at least four lower-case imagery words');
});
// A ★3 evolution may borrow from anywhere: that is where the game blends on purpose
Object.values(C.SKILLS).filter(s => !s.base).forEach(s => Object.keys(s.fx).forEach(fx => pieBreak('skills ' + s.id, s.tags, fx, s.breaks)));
Object.entries(C.ENEMIES).forEach(([k, e]) => { if (e.theme == null) return; themeOk('enemies ' + k, e.theme); e.skills.concat(e.phase && e.phase.add || []).forEach(m => Object.keys(m.fx || {}).forEach(fx => pieBreak(`enemies ${k} move ${m.n}`, e.theme, fx, e.breaks))); });
// Events and chains may also belong to the System itself (theme: 'system'), outside the wheel
Object.entries(C.CHAINS).forEach(([k, c]) => { if (c.theme != null && c.theme !== 'system') themeOk('chains ' + k, c.theme); });
Object.entries(C.EVENTS).forEach(([k, E]) => { if (E.theme != null) { if (E.theme !== 'system') themeOk('event ' + k, E.theme); if (E.chain) warn('event ' + k, "has its own theme as well as its chain's; the chain's is the one that counts"); } });
['GIFTS', 'TITLES', 'QUESTS'].forEach(L => Object.entries(C[L]).forEach(([k, d]) => { if (d.theme != null) themeOk(`${L.toLowerCase()} ${k}`, d.theme); }));
const effectThemes = p => Object.keys(p || {}).flatMap(k => [].concat(C.EFFECTS[k] && C.EFFECTS[k].theme || []));
const themedFits = (where, themes, p) => Object.keys(p || {}).forEach(k => { const th = [].concat(C.EFFECTS[k] && C.EFFECTS[k].theme || []); if (th.length && !th.some(o => [].concat(themes).some(t => C.themeNear(t).includes(o)))) warn(where, `uses ${k}, a ${th.map(a => C.ARCH[a].name).join('/')} effect, off its part of the wheel (a pie break: fine if meant, or retag it)`); });
Object.entries(C.GEAR).forEach(([k, g]) => themedFits('gear ' + k, g.tags, Object.assign({}, g.pas, g.fix)));
Object.entries(C.HIDDEN_PATHS).forEach(([k, h]) => themedFits('paths ' + k, k.split('+'), h.fx));
Object.entries(C.GIFTS).forEach(([k, g]) => { if (g.theme != null) themedFits('gifts ' + k, g.theme, g.p); });
Object.entries(C.WORLD_TYPES).forEach(([k, t]) => {
  const w = 'worlds ' + k, F = C.ENEMIES[t.final], gift = C.GIFTS[t.gift];
  if (F) { if (F.theme == null) warn(w, `its Final Champion ${t.final} has no theme; it should carry the world's home, ${t.home}`); else ref(w, [].concat(F.theme).includes(t.home), `its Final Champion ${t.final} is themed ${[].concat(F.theme).join(' + ')}, not the world's home ${t.home}`); }
  if (gift) themedFits(w + ' World Gift ' + t.gift, gift.theme != null ? gift.theme : t.home, gift.p);
});
Object.keys(C.PIE).forEach(fx => { if (!fxRead.has(fx)) err('archetypes PIE', `${fx} is owned but core.js never reads fx.${fx}`); });
Object.keys(uses.skill).filter(fx => !C.PIE[fx] && !['dmg', 'block', 'brk'].includes(fx)).forEach(fx => warn('archetypes PIE', `${fx} has no owner on the wheel, so any archetype may use it`));

// ---------- Moves and the power budget: every enemy move plays a role, and its numbers sit in its tier (warn only) ----------
const inRange = (v, [a, b]) => v >= a && v <= b;
const budget = (where, what, v, range) => { if (range && !inRange(v, range)) warn(where, `${what} is ${v}; tier ${range.join(' to ')} (a power budget warning: fine if meant, or tune it)`); };
Object.entries(C.ENEMIES).forEach(([k, e]) => {
  const w = 'enemies ' + k, N = C.MOVE_NUMBERS[e.tier], moves = e.skills.concat(e.phase && e.phase.add || []);
  if (!N) return err(w, `tier ${e.tier} has no numbers in moves.js (tiers ${Object.keys(C.MOVE_NUMBERS).join(', ')})`);
  budget(w, 'hp', e.hp, N.hp);
  const roles = moves.map(m => C.moveRole(m.fx || {}, e.tier));
  moves.forEach((m, i) => { const r = roles[i], d = C.moveDmg(m.fx || {}); if (r === 'strike' || r === 'big') budget(`${w} move ${m.n}`, `${r} damage`, d, N[r]); if (r === 'guard') budget(`${w} move ${m.n}`, 'guard Block', m.fx.block, N.guard); });
  budget(w, 'damage per turn over its script', Math.round(10 * e.script.reduce((a, i) => a + C.moveDmg(e.skills[i].fx || {}), 0) / e.script.length) / 10, N.dpt);
  const has = { damage: moves.some(m => C.moveDmg(m.fx || {}) > 0), trait: MECHANICS.some(t => e[t] != null) || !!e.phase };
  (C.MOVE_NEEDS[e.tier] || []).forEach(need => { if (!need.split('|').some(r => has[r] != null ? has[r] : roles.includes(r))) warn(w, `a tier ${e.tier} enemy needs ${need.replace(/\|/g, ' or ')} (it has ${roles.join(', ')}${has.trait ? ', a trait' : ''})`); });
});
Object.keys(C.MOVE_NUMBERS).forEach(t => ref('moves ' + t, ['hp', 'strike', 'big', 'guard', 'dpt'].every(k => Array.isArray(C.MOVE_NUMBERS[t][k]) && C.MOVE_NUMBERS[t][k].length === 2), 'needs hp, strike, big, guard and dpt as [low, high]'));

// ---------- Events: one option is always there to take ----------
Object.entries(G.EVENTS).forEach(([k, E]) => {
  if (!E.opts.some(o => !o.can && !o.check && !o.pay && !o.payHeart)) err('event ' + k, 'every option has a condition, so the screen could be empty: keep one that anyone can take');
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
    '', '### The wheel, from `js/content/archetypes.js`',
    '', 'Each archetype is a theme. Its neighbours on the wheel are its allies; a piece of content carries one archetype, or two neighbours. Owns: the skill effects it owns, which it and its neighbours may use (`dmg` and `block` are open to all). Passive effects say their own theme in `effects.js`.',
    '', '| Archetype | Stat | Line | Owns | Allies | Words |', '| --- | --- | --- | --- | --- | --- |',
    ...C.WHEEL.map(k => { const a = C.ARCH[k], near = C.themeNear(k).slice(1); return `| ${a.name} | ${a.stat} | ${a.line} | ${(a.owns || []).map(x => '`' + x + '`').join(' ')} | ${near.map(n => C.ARCH[n].name).join(', ')} | ${(a.words || []).join(', ')} |`; }),
    '', '### Enemy move roles and tier numbers, from `js/content/moves.js`',
    '', 'A move\'s role is read from its effects (`moveRole`). A big hit is one of at least the tier\'s BIG_HIT damage before the round\'s scaling. Numbers are ranges the checker warns outside of; the balance gate has the last word.',
    '', '| Tier | Who | HP | Strike | Big hit (from) | Guard Block | Damage per turn | Needs |', '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...Object.entries(C.MOVE_NUMBERS).map(([t, N]) => `| ${t} | ${{ 1: 'arena beasts, rounds 1 to 3', 2: 'rivals and the Proctor, rounds 4 to 7', 3: 'Final Champions', 4: 'the Elite bracket' }[t]} | ${N.hp.join(' to ')} | ${N.strike.join(' to ')} | ${N.big.join(' to ')} (${C.BIG_HIT[t]}) | ${N.guard.join(' to ')} | ${N.dpt.join(' to ')} | ${(C.MOVE_NEEDS[t] || []).map(x => x.replace('|', ' or ')).join(', ')} |`),
    '', '| Role | Meaning | Used by |', '| --- | --- | --- |',
    ...Object.entries(C.MOVE_ROLES).map(([r, m]) => `| ${r} | ${m} | ${Object.values(C.ENEMIES).reduce((n, e) => n + e.skills.concat(e.phase && e.phase.add || []).filter(x => C.moveRole(x.fx || {}, e.tier) === r).length, 0)} moves |`),
    '', '### Outcomes (`then`, `reward`), from `js/content/outcomes.js`',
    '', 'What an event option, a quest or a wager can give. Applied in this order; one marked late is announced after everything else.',
    '', '| Key | Example | Shown to players as | Late | Used by |', '| --- | --- | --- | --- | --- |',
    ...Object.entries(C.OUTCOMES).map(([k, O]) => { const ex = { gold: 8, stats: { VIT: 2 }, heart: 1, rune: 1, piece: 'B', next: { bribe: true }, foe: { weaken: 2 }, max_hp: -0.1, restore: 1, notice: 1, chain: 'done', favour: { war: 2 } }[k]; return `| \`${k}\` | ${JSON.stringify(ex).replace(/\|/g, '\\|')} | ${O.say(ex)} | ${O.late ? 'yes' : ''} | ${(outcomeUses[k] || []).length} (${[...new Set((outcomeUses[k] || []).map(u => u.split(' ')[0] + 's'))].join(', ')}) |`; }),
    '', '### Feats (`feat`), from `js/content/feats.js`',
    '', 'What wagers, Rank Trial conditions, Titles and quests can ask for. Measured: when it is checked (win: a won fight; fight: any fight). Usual: the amount asked for unless the Title or quest says another (`n`). Unfair for: archetypes it is never asked of.',
    '', '| Key | Measured | Shown to players as | Usual | Counts up | Unfair for | Asked by |', '| --- | --- | --- | --- | --- | --- | --- |',
    ...sorted(C.FEATS).map(([k, F]) => `| \`${k}\` | ${F.at} | ${F.say(F.n).replace(/\|/g, '\\|')} | ${F.n != null ? F.n : ''} | ${F.measure ? 'yes' : ''} | ${(F.unfairFor || []).map(a => C.ARCH[a] ? C.ARCH[a].name : a).join(', ')} | ${(featUses[k] || []).join(', ')} |`),
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
