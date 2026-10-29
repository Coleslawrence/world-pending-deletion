// Content cards: checks draft and proposed cards against the game before Slaw reviews them, starts new cards, and
// writes the review list. Cards live in the project files (content/cards/), not in the repo; see docs/CONTENT.md.
//   node tools/card-check.js DIR                              # checks every card in DIR; exits 1 on any error
//   node tools/card-check.js DIR/event-the-large-chest.md     # checks one card
//   node tools/card-check.js DIR --new event "The Large Chest" --source "content/import/2026-10-29-inspiration-list.md"
//                                                             # starts a Draft card from DIR/TEMPLATE.md with a free id
//   node tools/card-check.js DIR --index                      # also writes DIR/INDEX.md, every card by status
// Checks that a card waiting for a decision uses ids and names nobody has (in the game or on another card), only effects
// on the effect menu unless it says it needs a new one, keeps one event option anyone can take, follows the style guide
// (British spelling, no em-dashes, brackets only for the System, length limits), and, if it was imported, says where from.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const G = require('../js/core.js');
const C = vm.runInThisContext('({ ARCH, SKILLS, GEAR, GODS, WORLD_TYPES, MODIFIERS, LORE, GIFTS, TITLES, QUESTS, HIDDEN_PATHS, ENEMIES, EVENTS, CHAINS })');
const args = process.argv.slice(2), opt = k => args.includes(k) ? args[args.indexOf(k) + 1] : null;
const target = args[0];
if (!target || target.startsWith('--')) { console.log('usage: node tools/card-check.js DIR|CARD.md [--new KIND "Name" [--source TEXT]] [--index]'); process.exit(2); }
const DIR = fs.statSync(target).isDirectory() ? target : path.dirname(target);

// ---------- What the game already has ----------
const saved = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/content-ids.json'), 'utf8'));
const gameIds = {};   // id -> what it is, from the ids file (never shrinks) and the game as it is now
const kinds = { skills: C.SKILLS, gear: C.GEAR, archetypes: C.ARCH, gods: C.GODS, worlds: C.WORLD_TYPES, modifiers: C.MODIFIERS, enemies: C.ENEMIES, gifts: C.GIFTS, titles: C.TITLES, quests: C.QUESTS, events: C.EVENTS, chains: C.CHAINS };
Object.entries(kinds).forEach(([kind, o]) => (saved[kind] || []).concat(Object.keys(o)).forEach(k => gameIds[k] = gameIds[k] || kind));
const gameNames = {}; // lower-cased name -> what it is
const own = (name, what) => { if (typeof name === 'string') gameNames[name.toLowerCase()] = gameNames[name.toLowerCase()] || what; };
Object.values(C.SKILLS).forEach(s => own(s.name, 'skill ' + s.id));
Object.entries(C.GEAR).forEach(([k, g]) => own(g.name, 'gear ' + k));
Object.entries(C.ARCH).forEach(([k, a]) => { own(a.name, 'archetype ' + k); own(a.path, 'path name of ' + k); });
Object.entries(C.GODS).forEach(([k, g]) => own(g.name, 'god ' + k));
Object.entries(C.WORLD_TYPES).forEach(([k, t]) => own(t.name, 'world type ' + k));
Object.entries(C.MODIFIERS).forEach(([k, m]) => own(m.name, 'world modifier ' + k));
Object.entries(C.LORE).forEach(([w, L]) => L.entries.forEach(e => own(e.name, 'World Record entry in ' + w)));
Object.entries(C.ENEMIES).forEach(([k, e]) => { own(e.name, 'enemy ' + k); e.skills.forEach(m => own(m.n, 'move of enemy ' + k)); });
Object.entries(C.GIFTS).forEach(([k, g]) => own(g.name, 'Gift ' + k));
Object.entries(C.TITLES).forEach(([k, t]) => own(t.name, 'Title ' + k));
Object.entries(C.HIDDEN_PATHS).forEach(([k, h]) => own(h.name, 'Hidden Path ' + k));
Object.entries(C.EVENTS).forEach(([k, E]) => own(E.title, 'event ' + k));
Object.entries(C.CHAINS).forEach(([k, c]) => own(c.name, 'event chain ' + k));
Object.entries(G.REACTIONS).forEach(([k, r]) => own(r.name, 'reaction ' + k));
Object.entries(G.MILESTONES).forEach(([k, m]) => own(m.name, 'milestone ' + k));
Object.entries(G.PREFIXES).forEach(([k, p]) => own(p.name, 'rune ' + k));
// The effect menu, read from docs/CONTENT.md (the checker keeps it current), plus what an event option can do as data
const menuDoc = fs.readFileSync(path.join(ROOT, 'docs/CONTENT.md'), 'utf8');
const MENU = new Set([...menuDoc.slice(menuDoc.indexOf('<!-- effects:start')).matchAll(/^\| `(\w+)` \|/gm)].map(m => m[1])
  .concat(['pay', 'check', 'can', 'go', 'reveal', 'then', 'gold', 'stats', 'next', 'chain', 'favour', 'bribe', 'poison', 'foePoison', 'foeWeaken', 'piece', 'lose', 'say', 'eraseRecord', 'pick', 'shuffle', 'maxHp', 'hasGift', 'meta', 'phase', 'passives']));

// ---------- Starting a card ----------
const STATUSES = ['Draft', 'Proposed', 'Approved', 'Declined', 'In a PR', 'On dev', 'Shipped'];
const WAITING = ['Draft', 'Proposed', 'Approved'];  // not built yet, so its ids and names must still be free
const slug = s => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cardFiles = () => fs.readdirSync(DIR).filter(f => f.endsWith('.md') && !['README.md', 'TEMPLATE.md', 'INDEX.md', 'IMPORT.md'].includes(f)).sort();
if (args.includes('--new')) {
  const kind = opt('--new'), name = args[args.indexOf('--new') + 2];
  if (!kind || !name) { console.log('--new needs a kind and a name: --new event "The Large Chest"'); process.exit(2); }
  const file = path.join(DIR, `${slug(kind)}-${slug(name)}.md`);
  if (fs.existsSync(file)) { console.log(`${file} already exists`); process.exit(1); }
  const taken = new Set(Object.keys(gameIds).concat(cardFiles().flatMap(f => parse(f).ids)));
  let id = slug(name.replace(/^the\s+/i, '')).replace(/-/g, '_'), n = 2; const base = id; while (taken.has(id)) id = `${base}_${n++}`;
  const K = kind[0].toUpperCase() + kind.slice(1);
  const today = new Date().toISOString().slice(0, 10), src = opt('--source');
  const card = fs.readFileSync(path.join(DIR, 'TEMPLATE.md'), 'utf8')
    .replace('# <Kind>: <Name>', `# ${K}: ${name}`).replace('**Status:** Proposed', '**Status:** Draft').replace('<YYYY-MM-DD>', today)
    .replace(/(\*\*Card for:\*\*) <[^>\n]*>/, `$1 ${kind}`).replace(/(\*\*Source:\*\*) <[^\n]*>/, src ? `$1 ${src}` : '$&')
    .replace('`<id>`', '`' + id + '`').replace('<Name, and any other new name>', name);
  fs.writeFileSync(file, card);
  console.log(`wrote ${file} (id ${id}). Fill it in, then run node tools/card-check.js ${DIR}`);
  process.exit(0);
}

// ---------- Reading a card ----------
function parse(f) {
  const md = fs.readFileSync(path.join(DIR, f), 'utf8');
  const field = re => { const m = md.match(re); return m ? m[1].trim() : ''; };
  const section = h => { const m = md.match(new RegExp(`^## ${h}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm')); return m ? m[1] : ''; };
  const head = md.match(/^# ([^:\n]+):\s*(.+)$/m);
  const statusText = field(/\*\*Status:\*\*\s*([^·\n]+)/);
  const ids = [...field(/\*\*Ids\*\*[^:]*:(.*)/).matchAll(/`([^`]+)`/g)].map(m => m[1]).filter(s => !s.startsWith('<'));
  const names = field(/\*\*Names\*\*[^:]*:(.*)/).replace(/<!--.*?-->/g, '').split(',').map(s => s.trim()).filter(s => s && !s.startsWith('<') && !/^none$/i.test(s));
  if (head && !names.includes(head[2].trim())) names.unshift(head[2].trim());
  const words = section('Words'), rows = words.split('\n').filter(l => /^\|/.test(l) && !/^\|\s*-/.test(l)).slice(1)
    .map(l => l.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim())).filter(r => r.some(Boolean));
  return {
    f, md, kind: head ? head[1].trim() : '', name: head ? head[2].trim() : '', statusText,
    status: STATUSES.find(s => statusText.startsWith(s)) || '', source: field(/\*\*Source:\*\*(.*)/).replace(/^<.*>$/, ''),
    by: field(/\*\*Proposed by:\*\*\s*([^·\n]+)/), date: field(/\*\*Date:\*\*\s*([^·\n]+)/),
    ids, names, words, rows, adapted: section('Adapted from'),
    effects: [...field(/\*\*Effects used\*\*[^:]*:(.*)/).matchAll(/`([A-Za-z]\w*)`/g)].map(m => m[1]),
    newEffect: field(/\*\*New effect needed\?\*\*\s*(.*)/),
  };
}

// ---------- Checking cards ----------
const US = /\b(armor\w*|colors?|colored|honors?|honored|favors?|favored|favorite|centers?|centered|defense|offense|gray|traveler\w*|\w+iz(?:e|es|ed|ing|ation)|theaters?|meters?)\b/gi; // as in check-content.js
const NOT_US = /^(size\w*|prize\w*|seize\w*|capsize\w*|baize)$/i;
const count = s => s.replace(/`/g, '').trim().split(/\s+/).filter(Boolean).length;
const files = fs.statSync(target).isDirectory() ? cardFiles() : [path.basename(target)];
const cards = files.map(parse), all = fs.statSync(target).isDirectory() ? cards : cardFiles().map(parse);
const problems = {};
const err = (c, msg) => (problems[c.f] = problems[c.f] || { errors: [], warnings: [] }).errors.push(msg);
const warn = (c, msg) => (problems[c.f] = problems[c.f] || { errors: [], warnings: [] }).warnings.push(msg);
cards.forEach(c => {
  if (!c.kind || !c.name || c.name.startsWith('<')) err(c, 'the first line should be "# <Kind>: <Name>"');
  if (!c.status) err(c, `status "${c.statusText}" isn't one of ${STATUSES.join(', ')}`);
  if (c.status === 'Declined') return;           // kept for the record with its reason; nothing more to check
  const waiting = WAITING.includes(c.status);
  // Imports say where they came from and what was changed to fit
  if (c.status === 'Draft' && !c.source) err(c, 'a Draft card needs a **Source:** line: where the idea came from (a file in content/import/, a feedback id, a message)');
  if (c.status === 'Draft' && (!c.adapted.trim() || /^\s*<[^>]+>\s*$/.test(c.adapted))) err(c, 'a Draft card needs its "Adapted from" section: what was kept, changed and dropped from the source');
  // Ids and names: free in the game and on other cards, until the card is built
  if (!c.ids.length) err(c, 'no ids: list them on the **Ids** line in `backticks`');
  c.ids.filter(id => !/^[a-z][a-z0-9_]*$/.test(id)).forEach(id => err(c, `id "${id}": ids are lower case letters, digits and _`));
  if (waiting) {
    c.ids.filter(id => gameIds[id]).forEach(id => err(c, `id "${id}" is already used in the game (${gameIds[id]}); ids are permanent, so pick another`));
    c.names.filter(n => gameNames[n.toLowerCase()]).forEach(n => err(c, `name "${n}" is already the ${gameNames[n.toLowerCase()]}. One name, one thing`));
  }
  all.filter(o => o.f !== c.f && o.status !== 'Declined').forEach(o => {
    c.ids.filter(id => o.ids.includes(id)).forEach(id => err(c, `id "${id}" is also on ${o.f}`));
    c.names.filter(n => o.names.some(m => m.toLowerCase() === n.toLowerCase())).forEach(n => err(c, `name "${n}" is also on ${o.f}`));
  });
  // Effects: from the menu, or the card says a mechanic PR comes first (until it is built: then the effect exists)
  const needsNew = /^yes/i.test(c.newEffect);
  if (waiting) c.effects.filter(k => !MENU.has(k)).forEach(k => needsNew ? warn(c, `effect "${k}" is new: it needs a mechanic PR before the data PR`) : err(c, `effect "${k}" isn't on the effect menu (docs/CONTENT.md). Use a menu key, or answer "yes" to "New effect needed?" and describe it`));
  if (!c.effects.length && !needsNew && waiting) warn(c, 'no effects listed on the **Effects used** line');
  // Player text, from the Words section (the System's lines are the `[...]` ones)
  const text = c.words.replace(/<!--[\s\S]*?-->/g, '').split('\n').filter(l => !/^\s*(\||- \*\*\w[\w ]*\*\* \(|For an event)/.test(l) || /`/.test(l)).join('\n');
  const narration = [...c.words.replace(/<!--[\s\S]*?-->/g, '').matchAll(/World narration[^:]*:\*?\*?\s*(.+)/g)].map(m => m[1]);
  [...text.matchAll(/`([^`]+)`/g)].map(m => m[1]).concat(c.rows.flat(), c.names, narration).filter(s => s && !s.startsWith('<')).forEach(s => {
    if (/[—–]/.test(s)) err(c, `no em-dashes or en-dashes in player text: "${s}"`);
    const us = (s.match(US) || []).filter(x => !NOT_US.test(x));
    if (us.length) err(c, `American spelling (${us.join(', ')}) in "${s}"; the game uses British spelling`);
    if ((s.match(/\[/g) || []).length !== (s.match(/\]/g) || []).length) err(c, `unbalanced [brackets] in "${s}"`);
    if (/^\[.*\]$/.test(s) && count(s) > 18) warn(c, `System line is ${count(s)} words, over the limit of 18: "${s}"`);
  });
  narration.forEach(s => { if (/\[/.test(s)) err(c, 'world narration never uses [brackets]: only the System speaks in them'); if (count(s) > 35 && /event/i.test(c.kind)) warn(c, `event body is ${count(s)} words, over the limit of 35`); });
  // Event options: actions, short, every one pickable, one free
  if (c.rows.length) {
    c.rows.forEach(([label = '', hint = '', cond = '', result = '']) => {
      if (count(label) > 5) warn(c, `option "${label}" is ${count(label)} words, over the limit of 5`);
      if (count(hint) > 15) warn(c, `hint for "${label}" is ${count(hint)} words, over the limit of 15`);
      if (/\b(locked|greyed|grayed|disabled|requires)\b/i.test(cond) || /\b(greyed|grayed|disabled)\b/i.test(hint)) err(c, `option "${label}": every choice shown can be picked. A stat check upgrades an option or hides it, never locks it`);
      const pays = /\b(pay|cost|gold)\b/i.test(cond);
      if (!pays && /\b\d+\s*(gold|HP|Hearts?)\b/i.test(label + ' ' + hint)) warn(c, `option "${label}" shows a cost in its words, but its condition isn't a payment. Costs show only when paying is the action; reveal other consequences after the pick`);
      if (result && !/`\[|^\[/.test(result) && !/^none$|^nothing/i.test(result)) warn(c, `what happens after "${label}" is told by the System, in [brackets]`);
    });
    if (!c.rows.some(r => /^(none|-|)$/i.test((r[2] || '').trim()))) err(c, 'every event keeps one option with no condition and no cost (Condition: none)');
  }
  if (waiting && /<[A-Z][^>]*>/.test(c.md.replace(/<!--[\s\S]*?-->/g, ''))) warn(c, 'still has <placeholders> from the template');
});

// ---------- Report, and the review list ----------
cards.forEach(c => { const p = problems[c.f]; if (!p) return; p.warnings.forEach(w => console.log(`warning  ${c.f}: ${w}`)); p.errors.forEach(e => console.log(`ERROR    ${c.f}: ${e}`)); });
const nErr = Object.values(problems).reduce((n, p) => n + p.errors.length, 0), nWarn = Object.values(problems).reduce((n, p) => n + p.warnings.length, 0);
console.log(`cards: ${nErr} error${nErr === 1 ? '' : 's'}, ${nWarn} warning${nWarn === 1 ? '' : 's'} (${cards.length} card${cards.length === 1 ? '' : 's'})`);
if (args.includes('--index')) {
  const cell = s => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const state = c => { const p = problems[c.f]; return !p ? 'ok' : p.errors.length ? `${p.errors.length} to fix` : `${p.warnings.length} note${p.warnings.length === 1 ? '' : 's'}`; };
  const group = (title, note, list) => list.length ? [`## ${title} (${list.length})`, '', note, '', '| Card | Kind | Status | From | Date | Check |', '| --- | --- | --- | --- | --- | --- |',
    ...list.map(c => `| [${cell(c.name)}](${c.f}) | ${cell(c.kind)} | ${cell(c.statusText)} | ${cell(c.source || c.by)} | ${cell(c.date)} | ${state(c)} |`), ''] : [];
  const md = ['# Content cards', '', `Every card and where it stands. Written by \`node tools/card-check.js <cards folder> --index\`; don't edit by hand. "Check" is the card checker's result: fix the errors before Slaw reviews.`, '',
    ...group('Waiting for Slaw', 'Draft cards came from outside the project (imported, see IMPORT.md) and Proposed cards from inside it. Say yes, no, or what to change.', cards.filter(c => ['Draft', 'Proposed'].includes(c.status))),
    ...group('Approved, not built yet', 'Next: the lore pass, then a data PR (README.md, steps 3 to 5).', cards.filter(c => c.status === 'Approved')),
    ...group('Being built or shipped', '', cards.filter(c => ['In a PR', 'On dev', 'Shipped'].includes(c.status))),
    ...group('Declined', 'Kept with the reason, so the same idea is not imported twice.', cards.filter(c => c.status === 'Declined')),
    ...group('Status not recognised', 'Fix the **Status:** line.', cards.filter(c => !c.status))].join('\n');
  fs.writeFileSync(path.join(DIR, 'INDEX.md'), md);
  console.log(`wrote ${path.join(DIR, 'INDEX.md')}`);
}
process.exit(nErr ? 1 : 0);
