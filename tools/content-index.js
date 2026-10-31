// Content index: every name in the game, what it belongs to and the release it shipped in, as Markdown for the lore
// bible to link to instead of being hand-edited for each new skill. Run it after a merge into dev or main.
//   node tools/content-index.js                    # prints the index
//   node tools/content-index.js --out FILE         # writes it (the project keeps it at lore/content-index.md)
// "Shipped" is the first release on main (a "Release wpd-vN" commit) whose game has that name, found by loading each
// release's own core.js; "on dev" means merged but not released yet. Needs main's history (git fetch origin main).
'use strict';
const { execFileSync } = require('child_process'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2), out = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const G = require(args[0] === '--names' ? path.resolve(args[1], 'js/core.js') : '../js/core.js');
const C = args[0] === '--names' ? null : vm.runInThisContext('({ ARCH, SKILLS, GEAR, GODS, WORLD_TYPES, MODIFIERS, LORE, GIFTS, GIFT_CATS, TITLES, QUESTS, HIDDEN_PATHS, ENEMIES, MONSTERS, RIVALS, EVENTS, CHAINS, moveRole })');
const git = (...a) => { try { return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };

// Every player-facing name a version of the game has, from its exports (works for releases before js/content/ too)
const names = G => { const o = x => Object.values(G[x] || {}); return [].concat(o('ARCH').flatMap(a => [a.name, a.path]), o('SKILLS').map(s => s.name), o('GEAR').map(g => g.name), o('GODS').map(g => g.name), o('WORLD_TYPES').map(t => t.name), o('MODIFIERS').map(m => m.name), o('LORE').flatMap(L => L.entries.map(e => e.name)), o('ENEMIES').flatMap(e => [e.name].concat(e.skills.map(m => m.n))), o('GIFTS').map(g => g.name), o('TITLES').map(t => t.name), o('QUESTS').map(q => q.text), o('HIDDEN_PATHS').map(h => h.name), o('EVENTS').map(E => E.title), o('REACTIONS').map(r => r.name), o('MILESTONES').map(m => m.name), o('PREFIXES').map(p => p.name)).filter(n => typeof n === 'string'); };
if (args[0] === '--names') { process.stdout.write(JSON.stringify(names(G))); process.exit(0); }

// Releases, oldest first: each one's files are unpacked and loaded in a process of its own, as the game was then
const mainRef = ['origin/main', 'main'].find(r => git('rev-parse', '--verify', '-q', r));
const releases = mainRef ? git('log', '--first-parent', '--format=%H %s', mainRef).trim().split('\n').map(l => { const m = l.match(/^(\w+) Release (wpd-v\d+)/); return m && { sha: m[1], tag: m[2] }; }).filter(Boolean).reverse() : [];
const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'wpd-index-'));
releases.forEach(r => {
  const dir = path.join(tmp, r.tag); fs.mkdirSync(dir);
  execFileSync('sh', ['-c', `git archive ${r.sha} js index.html | tar -x -C "${dir}"`], { cwd: ROOT });
  r.names = new Set(JSON.parse(execFileSync(process.execPath, [__filename, '--names', dir], { encoding: 'utf8', maxBuffer: 1 << 26 })));
});
fs.rmSync(tmp, { recursive: true, force: true });
const shipped = name => { const r = releases.find(r => r.names.has(name)); return r ? r.tag : releases.length ? 'on dev' : '?'; };

const sections = [];
const table = (title, head, rows, note, by) => sections.push([`## ${title} (${rows.length})`, '', note ? note + '\n' : null, '| ' + head.concat('Shipped').join(' | ') + ' |', '|' + ' --- |'.repeat(head.length + 1), ...rows.map(r => '| ' + r.concat(shipped(by ? by(r) : r[0])).map(c => String(c).replace(/\|/g, '\\|')).join(' | ') + ' |')].filter(x => x !== null).join('\n'));
const an = k => C.ARCH[k] ? C.ARCH[k].name : k, list = a => a.map(an).join(', ');
const finalOf = {}; Object.entries(C.WORLD_TYPES).forEach(([w, t]) => finalOf[t.final] = t.name);

table('Archetypes', ['Name', 'Id', 'Stat', 'Path name'], Object.entries(C.ARCH).map(([k, a]) => [a.name, k, a.stat, a.path]));
// The wheel: what each archetype has, so gaps show (a theme with no home world, god or enemies)
const themed = (o, f) => Object.entries(o).filter(([, d]) => [].concat(f(d) == null ? [] : f(d)).length).map(([k, d]) => [k, [].concat(f(d))]);
const WHEEL = vm.runInThisContext('WHEEL');
sections.push(['## The wheel', '', 'Each archetype is a theme; neighbours are allies. What belongs to each, from its tags; a blank is a gap.', '',
  '| Archetype | Line | Home world | Gods | Final Champion | Enemies | Event chains | Skills | Gear |', '|' + ' --- |'.repeat(9),
  ...WHEEL.map(k => { const a = C.ARCH[k]; const has = (o, f) => themed(o, f).filter(([, t]) => t.includes(k)).map(([id]) => id); return `| ${a.name} | ${a.line || ''} | ${Object.entries(C.WORLD_TYPES).filter(([, t]) => t.home === k).map(([, t]) => t.name).join(', ')} | ${Object.values(C.GODS).filter(g => g.arch.includes(k)).map(g => g.short).join(', ')} | ${Object.entries(C.ENEMIES).filter(([, e]) => e.final && [].concat(e.theme || []).includes(k)).map(([, e]) => e.name).join(', ')} | ${has(C.ENEMIES, e => e.final ? null : e.theme).length} | ${has(C.CHAINS, c => c.theme).map(id => C.CHAINS[id].name).join(', ')} | ${Object.values(C.SKILLS).filter(s => !s.base && s.tags.includes(k)).length} | ${Object.values(C.GEAR).filter(g => g.tags.includes(k)).length} |`; }),
  ''].join('\n'));
table('Skills', ['Name', 'Id', 'Archetypes', 'Rank', 'Evolves into'], Object.values(C.SKILLS).filter(s => !s.base).map(s => [s.name, s.id, list(s.tags), s.rank, (s.evo || []).map(e => C.SKILLS[e].name).join(', ')]));
table('Skill evolutions (★3)', ['Name', 'Id', 'From'], Object.values(C.SKILLS).filter(s => s.base).map(s => [s.name, s.id, C.SKILLS[s.base].name]));
table('Gear', ['Name', 'Id', 'Slot', 'Archetypes', 'Rank'], Object.entries(C.GEAR).map(([k, g]) => [g.name, k, g.slot, list(g.tags), g.rank]));
table('Gods', ['Name', 'Id', 'Archetypes', 'Blessing'], Object.entries(C.GODS).map(([k, g]) => [g.name, k, list(g.arch), g.blessing]));
table('World types', ['Name', 'Id', 'Home archetype', 'Final Champion', 'World Gift'], Object.entries(C.WORLD_TYPES).map(([k, t]) => [t.name, k, an(t.home), C.ENEMIES[t.final].name, C.GIFTS[t.gift].name]));
table('World modifiers', ['Name', 'Id', 'Effect'], Object.entries(C.MODIFIERS).map(([k, m]) => [m.name, k, m.desc]));
table('World Record entries', ['Name', 'World'], Object.entries(C.LORE).flatMap(([w, L]) => L.entries.map(e => [e.name, C.WORLD_TYPES[w].name])), 'Pools only grow at the end: runs store positions.');
table('Enemies', ['Name', 'Id', 'Kind', 'Style'], Object.entries(C.ENEMIES).map(([k, e]) => [e.name, k, e.final ? `Final Champion of ${finalOf[k] || '?'}` : C.RIVALS.includes(k) ? 'Rival' : C.MONSTERS.includes(k) ? 'Monster' : 'Other', e.style]));
table('Enemy moves', ['Name', 'Role', 'Used by'], Object.values(Object.values(C.ENEMIES).reduce((o, e) => { e.skills.forEach(m => (o[m.n] = o[m.n] || [m.n, C.moveRole(m.fx || {}, e.tier), []])[2].push(e.name)); return o; }, {})).map(([n, r, by]) => [n, r, by.join(', ')]));
table('Gifts', ['Name', 'Id', 'Category'], Object.entries(C.GIFTS).map(([k, g]) => [g.name, k, g.arch ? 'Affinity' : g.cat === 'extra' ? 'Additional' : C.GIFT_CATS[g.cat] || g.cat]));
table('Titles', ['Name', 'Id', 'Earned by'], Object.entries(C.TITLES).map(([k, t]) => [t.name, k, t.cond]));
table('Hidden Paths', ['Name', 'Archetypes'], Object.entries(C.HIDDEN_PATHS).map(([k, h]) => [h.name, k.split('+').map(an).join(' + ')]));
table('Undercity events', ['Title', 'Id', 'Chain'], Object.entries(C.EVENTS).map(([k, E]) => [E.title, k, E.chain ? C.CHAINS[E.chain].name : 'stands alone']));
table('Event chains', ['Name', 'Id', 'First event'], Object.entries(C.CHAINS).map(([k, c]) => [c.name, k, C.EVENTS[c.start].title]), 'Shipped with their first event.', r => r[2]);
table('Quests', ['Text', 'Id', 'Hidden'], Object.entries(C.QUESTS).map(([k, q]) => [q.text, k, q.hidden ? 'yes' : 'no']));
table('Rules names (in js/core.js)', ['Name', 'Kind'], [].concat(Object.values(G.REACTIONS).map(r => [r.name, 'Reaction']), Object.values(G.MILESTONES).map(m => [m.name, 'Stat milestone']), Object.values(G.PREFIXES).map(p => [p.name, 'Rune'])));

const commit = (git('log', '-1', '--format=%h %ad', '--date=short') || '').trim();
const md = ['# Content index', '', `Every name in the game, what it belongs to and the release it shipped in. Written by \`node tools/content-index.js\` from the game files at ${commit || 'the working copy'}; don't edit by hand. Releases known: ${releases.map(r => r.tag).join(', ') || 'none (no main history)'}. The first of those covers everything that was live before it. "on dev" means merged but not released yet.`, '', ...sections.flatMap(s => [s, ''])].join('\n');
if (out) { fs.writeFileSync(out, md); console.log(`wrote ${out}`); } else process.stdout.write(md);
