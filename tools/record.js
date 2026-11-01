// World Record checks: layers (Fates, Peoples, settings), names, class pools, the Pending World cut-off, picking rules, erasing and restoring, extra Hearts, snapshots and the sanitiser.
//   node tools/record.js
const G = require('../js/core.js');
const assert = require('assert');
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const bits = m => { let n = 0; while (m) { n += m & 1; m >>>= 1; } return n; };
let checks = 0; const ok = (c, msg) => { assert(c, msg); checks++; };

// Pools: 14 entries each, enough of every kind, and home entries carry their bio phrase
Object.entries(G.LORE).forEach(([w, L]) => {
  ok(G.WORLD_TYPES[w], `${w} is a world type`);
  ok(L.entries.length === 14, `${w} has 14 entries`);
  const E = L.entries, n = (k, t) => E.filter(e => e.k === k && (!t || e.tier === t)).length;
  ok(n('place') >= 3 && n('person') >= 2 && n('custom') >= 2, `${w} can meet the minimums`);
  ok(n('place', 'home') >= 1 && n('person', 'home') >= 1, `${w} has a home place and person`);
  E.forEach(e => { ok(['place', 'person', 'custom'].includes(e.k) && G.LORE && ['far', 'city', 'home'].includes(e.tier), `${w}: ${e.name} kind and tier`); if (e.tier === 'home' && e.k === 'place') ok(e.near, `${w}: ${e.name} has near`); if (e.tier === 'home' && e.k === 'person') ok(e.rel, `${w}: ${e.name} has rel`); });
});
ok(Object.keys(G.WORLD_TYPES).every(w => G.LORE[w]), 'every world type has a pool');

// Picking
const rng = seeded(7);
for (let t = 0; t < 3000; t++) {
  const w = G.pick(Object.keys(G.LORE), rng), E = G.LORE[w].entries, R = G.buildRecord(w, rng);
  ok(R.ids.length === 10 && new Set(R.ids).size === 10, 'ten different entries');
  const k = x => R.ids.filter(i => E[i].k === x).length;
  ok(k('place') >= 3 && k('person') >= 2 && k('custom') >= 2, 'minimums met');
  ok(R.ids.includes(R.bio.home) && E[R.bio.home].k === 'place' && E[R.bio.home].tier === 'home', 'bio home place is picked');
  ok(R.ids[9] === R.bio.person && E[R.bio.person].k === 'person' && E[R.bio.person].tier === 'home', 'bio person goes last');
  const tiers = R.ids.slice(0, 9).map(i => ({ far: 0, city: 1, home: 2 })[E[i].tier]);
  ok(tiers.every((v, i) => !i || v >= tiers[i - 1]), 'far, then city, then home');
}

// A run: the record follows the Hearts
function play(seed) {
  const r = seeded(seed), meta = G.newMeta();
  const w = G.offerWorlds(meta, r)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, meta, r);
  return { run, meta };
}
const standing = run => run.record.ids.length - bits(run.record.lost);
{
  const { run } = play(1);
  ok(run.record && run.log.some(l => l.text.startsWith('[Filing world record: ' + run.world.name + '. 10 entries.]')), 'filing line');
  const msgs = [];
  run.hearts -= 3; const gone = G.eraseRecord(run, 3, msgs);
  ok(gone.join() === '0,1,2' && msgs.length === 3 && msgs[0].text.startsWith('[Erasing: '), 'erase three from the edge');
  ok(standing(run) === run.hearts, 'entries match Hearts after a loss');
  const m2 = []; ok(G.sanctum(run, m2) === 2 && m2[0].text === '[Restoring from backup… 2 records recovered. Partial.]', 'sanctum line');
  ok(run.record.lost === 1 && run.record.partial === 6, 'the last two erased come back partial');
  ok(standing(run) === run.hearts, 'entries match Hearts after the Sanctum');
  run.hearts--; G.eraseRecord(run, 1); ok(run.record.lost === 3 && run.record.partial === 4, 'a restored entry is the next to go and loses its partial mark');
  // extra max Heart: unused far entry at the front of the queue
  const first = run.record.ids[2]; run.maxHearts++; run.hearts++; const m3 = [];
  ok(G.amendRecord(run, m3) && m3[0].text === '[Record amended: 1 entry added.]', 'amend line');
  ok(run.record.ids.length === 11 && run.record.ids[3] === first && run.record.lost === 3 && run.record.partial === 8, 'inserted at the front of the queue, masks shifted');
  ok(standing(run) === run.hearts, 'entries match Hearts after an extra Heart');
  const pool = Object.keys(G.recLore(run.record, run.world.type).entries).length; while (G.amendRecord(run));
  ok(run.record.ids.length === Math.min(G.REC_MAX, pool), `once the world's ${pool} entries are all filed, extra Hearts go unrecorded`);
  // snapshot and sanitiser
  const snap = G.snapshot(run), json = JSON.parse(JSON.stringify(snap));
  ok(JSON.stringify(json.rec).length < 260, 'snapshot record is small: ' + JSON.stringify(json.rec).length + ' bytes');
  const clean = G.sanitizeSnap(json, 'someone');
  ok(JSON.stringify(clean.rec) === JSON.stringify(json.rec), 'sanitiser keeps a good record');
  const bad = [x => x.ids[0] = 99, x => x.ids[0] = x.ids[1], x => x.lost = -1, x => x.lost = 1 << 20, x => x.bio.person = 99, x => x.bio.role = 9, x => x.w = 'iron' === json.worldType ? 'sky' : 'iron', x => x.ids = 'nope'];
  bad.forEach((f, i) => { const j = JSON.parse(JSON.stringify(json)); f(j.rec); ok(G.sanitizeSnap(j, 'x').rec === null, 'sanitiser drops malformed record ' + i); });
  const old = JSON.parse(JSON.stringify(json)); delete old.rec; ok(G.sanitizeSnap(old, 'x').rec === null, 'old cards have no record');
}
{
  // old saves get a record that matches their Hearts
  const { run } = play(2); delete run.record; run.hearts = 6; G.ensureRecord(run); ok(standing(run) === 6, 'old save record matches Hearts');
}
{
  // full bot runs: entries standing always equal Hearts left (up to 14), and an erased world keeps nothing
  const B = require('./bot.js');
  const real = Math.random; Math.random = seeded(11);
  let meta = G.newMeta(), erased = 0;
  for (let i = 0; i < 300; i++) {
    const r = B.playRun(meta, false, { noElite: i % 2 === 0 });
    const R = r.run.record; ok(R, 'bot run has a record');
    if (r.result === 'erased') { erased++; ok(bits(R.lost) === R.ids.length, 'erased world keeps no entries'); ok(meta.erased[0].rec && bits(meta.erased[0].rec.lost) === R.ids.length, 'Hall card is all bars'); }
    else ok(R.ids.length - bits(R.lost) === Math.min(r.run.hearts, R.ids.length), `spared world: entries ${R.ids.length - bits(R.lost)} = Hearts ${r.run.hearts}`);
  }
  Math.random = real;
  ok(erased > 0, 'some bot runs were erased');
}
{
  // reading a record: bio voices, bars and the returning champion's fragment
  const R = { ids: [0, 3, 5, 7, 9, 4, 8, 11, 10, 12], lost: 0, partial: 0, bio: { role: 0, home: 10, person: 12, promise: 0 } };
  const txt = parts => parts.map(p => p.gone ? '#' : p.t).join('');
  ok(txt(G.bioParts(R, 'drowned', 'Velmere')) === 'You were a lamplighter of Velmere. You grew up in the shadow of the Drowned Lighthouse. You promised your sister Ilsa you would bring back dry land.', 'run bio');
  ok(txt(G.bioParts(R, 'drowned', 'Velmere', 'Maren')) === 'Maren was a lamplighter of Velmere, raised in the shadow of the Drowned Lighthouse. Maren swore to Ilsa to bring back dry land.', 'Halls bio');
  R.lost = (1 << 9) - 1; ok(txt(G.bioParts(R, 'drowned', 'Velmere')) === 'You were a lamplighter of Velmere. You grew up in the shadow of the #. You promised your sister Ilsa you would bring back dry land.', 'home erased');
  ok(G.recFragment(R, 'drowned') === 'Ilsa', 'fragment: the last entry standing');
  R.lost = (1 << 10) - 1; ok(txt(G.bioParts(R, 'drowned', 'Velmere', 'Maren')) === 'Maren was a lamplighter of #, raised in the shadow of the #. Maren swore to # to bring back dry land.', 'erased world bio');
  ok(G.recFragment(R, 'drowned') === 'Ilsa', 'fragment: the last entry to go');
  R.lost = 0; R.partial = 1; const e = G.recEntries(R, 'drowned')[0]; ok(e.partial && e.line.filter(w => w.gone).length === 2, 'partial entry bars two words');
}
{
  // Layers: a Fate and a People file their own entries in their own number ranges; old records read as before
  const ent = (k, tier, name, x) => Object.assign({ k, tier, name, text: name + ' stands.' }, x || {});
  G.FATES.test_fate = { name: 'Test Fate', line: 'Something is wrong.', mods: { bloodmoon: 1 }, promises: ['end the test'], entries: [ent('place', 'city', 'Fate Hall'), ent('custom', 'far', 'Fate Rite'), ent('person', 'city', 'Fate Keeper')] };
  G.PEOPLES.test_people = { name: 'Test People', line: 'They live here.', roles: ['tester'], entries: [ent('place', 'far', 'People Hall'), ent('custom', 'city', 'People Rite'), ent('place', 'city', 'Far Only', { settings: ['far_future'] })] };
  const r = seeded(21), W = { type: 'drowned', fate: 'test_fate', people: 'test_people' };
  let roles = new Set(), promises = new Set();
  for (let t = 0; t < 2000; t++) {
    const R = G.buildRecord('drowned', r, W), E = G.recLore(R, 'drowned').entries;
    ok(R.f === 'test_fate' && R.p === 'test_people' && !R.c, 'record carries its layers');
    ok(R.ids.length === 10 && new Set(R.ids).size === 10, 'ten different entries with layers');
    ok(R.ids.filter(i => i >= 100 && i < 200).length === 2 && R.ids.filter(i => i >= 200 && i < 300).length === 2, 'two Fate and two People entries');
    ok(!R.ids.includes(202), 'an entry that does not suit the setting is never filed');
    ok(R.ids.every(i => E[i]) && R.bio.home < 100 && R.bio.person < 100, 'every id resolves; home and person are the type\'s');
    const k = x => R.ids.filter(i => E[i].k === x).length; ok(k('place') >= 3 && k('person') >= 2 && k('custom') >= 2, 'minimums met with layers');
    roles.add(R.bio.role); promises.add(R.bio.promise);
    const S = G.sanitizeRec(JSON.parse(JSON.stringify(Object.assign({ w: 'drowned' }, R))), 'drowned');
    ok(S && S.f === 'test_fate' && JSON.stringify(S.ids) === JSON.stringify(R.ids), 'a layered record survives the sanitiser');
  }
  ok(roles.has(200) && promises.has(100), 'People roles and Fate promises reach the bio');
  const R = G.buildRecord('drowned', seeded(3), W);
  ok(G.sanitizeRec(Object.assign({ w: 'drowned' }, R, { f: 'no_such_fate' }), 'drowned') === null, 'an unknown layer fails the record');
  ok(G.sanitizeRec(Object.assign({ w: 'drowned' }, R, { f: undefined }), 'drowned') === null, 'a Fate entry without its Fate fails the record');
  ok(G.sanitizeRec(Object.assign({ w: 'drowned' }, R, { c: 'drowned' }), 'drowned') === null, 'a Confluence of the same type fails');
  const bio = G.bioParts(Object.assign({}, R, { bio: Object.assign({}, R.bio, { role: 200, promise: 100 }) }), 'drowned', 'Velmere').map(p => p.t).join('');
  ok(/You were a tester of Velmere\./.test(bio) && /you would end the test\./.test(bio), 'layer role and promise read in the bio');
  // Old records (no layers) pick exactly as before layers existed
  const a = G.buildRecord('drowned', seeded(9)), b = G.buildRecord('drowned', seeded(9), { type: 'drowned' });
  ok(JSON.stringify(a) === JSON.stringify(b) && !('f' in a), 'no layers, no change');
  // Worlds roll layers, and the Fate picks the modifier
  const wr = seeded(5); let n = 0;
  for (let t = 0; t < 300; t++) { const w = G.offerWorlds(G.newMeta(), wr)[0]; ok(w.v === 2 && w.fate && w.people, 'worlds roll layers'); if (w.fate === 'test_fate') { n++; ok(w.mod === 'bloodmoon', 'the Fate sets the modifier'); } }
  ok(n > 0, 'the test Fate came up');
  G.WORLD_TYPES.drowned.setting = 'far_future';
  let far = 0; for (let t = 0; t < 200; t++) if (G.buildRecord('drowned', wr, W).ids.includes(202)) far++;
  ok(far > 0, 'a world whose setting the entry suits can file it');
  G.FATES.test_fate.settings = ['fantasy'];
  for (let t = 0; t < 300; t++) { const w = G.offerWorlds(G.newMeta(), wr)[0]; ok(!(w.type === 'drowned' && w.fate === 'test_fate'), 'a Fate only comes to worlds whose setting it suits'); }
  delete G.WORLD_TYPES.drowned.setting; delete G.FATES.test_fate; delete G.PEOPLES.test_people;
}
{
  // Names, class pools and Pending World
  const r = seeded(4);
  for (let t = 0; t < 2000; t++) { const w = G.offerWorlds(G.newMeta(), r)[0]; ok(/^[A-Z][a-z]{2,13}$/.test(w.name) && !/(.)\1\1/.test(w.name), `world name ${w.name}`); }
  ok(G.joinName(['Vey', 'ora']) === 'Veyra' && G.joinName(['thal', 'a', 'aven']) === 'Thalaven', 'syllables join cleanly');
  Object.entries(G.WORLD_TYPES).forEach(([k, T]) => {
    const A = G.worldArch({ type: k }, { arch_arcanist: true, arch_storm: true });
    ok(A.length === 4 && new Set(A).size === 4 && A[0] === T.home && A.includes(T.guest), `${k} class pool is home, neighbours and guest`);
    const L = G.worldArch({ type: k }, {}); ok(L.length === 4 && new Set(L).size === 4 && L[0] === T.home && L.slice(1).every(a => G.START_ARCH.includes(a)), `${k} pool swaps locked classes`);
    Object.keys(G.WORLD_TYPES).filter(m => m !== k).forEach(m => { const C = G.worldArch({ type: k, mix: m }, {}); ok(C.length === 4 && new Set(C).size === 4 && C[0] === T.home, `${k} + ${m} Confluence pool`); });
  });
  const meta = G.newMeta(), w = G.offerWorlds(meta, seeded(8))[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, meta, seeded(8));
  ok(JSON.stringify(run.arch) === JSON.stringify(G.worldArch(w, meta.unlocks)), 'a new run uses its world\'s class pool');
  // Before WORLD_GEN.from, Pending World is the world the old generator made
  const old = date => { const rng = G.seedRng(G.dailySeed(date) + ':world'), T0 = Object.keys(G.WORLD_TYPES), type = G.pick(T0, rng), T = G.WORLD_TYPES[type];
    const name = G.pick(T.names[0].slice(0, 6), rng) + G.pick(T.names[1].slice(0, 6), rng); rng(); rng(); return { type, name: name[0].toUpperCase() + name.slice(1), champ: G.pick(T.champs.slice(0, 6), rng) }; };
  const was = G.WORLD_GEN.from; G.WORLD_GEN.from = '2099-01-01';
  ['2026-11-01', '2026-11-02', '2026-12-25'].forEach(d => { const a = G.dailyWorld(d), b = old(d); ok(!a.v && a.type === b.type && a.name === b.name && a.champ === b.champ, `Pending World ${d} unchanged`); });
  G.WORLD_GEN.from = '2026-11-02';
  ok(!G.dailyWorld('2026-11-01').v && G.dailyWorld('2026-11-02').v === 2 && JSON.stringify(G.dailyWorld('2026-11-03')) === JSON.stringify(G.dailyWorld('2026-11-03')), 'from the cut-off, Pending World is layered and the same for everyone');
  G.WORLD_GEN.from = was;
}
{
  // No-repeat memory: offers skip the last 2 types where they can, and never repeat a recent name or Fate + People pair
  const r = seeded(31), meta = G.newMeta(); let typeHits = 0, offers = 0;
  for (let t = 0; t < 400; t++) {
    const W = G.offerWorlds(meta, r); offers++;
    W.forEach(w => { ok(G.staleWorld(meta, w) < 2, `offer ${w.name} repeats a recent name or Fate + People pair`); if (G.staleWorld(meta, w)) typeHits++; });
    ok(W.length === 3 && new Set(W.map(w => w.type)).size === 3, 'three different types on offer');
    G.rememberWorld(meta, W[t % 3]);
  }
  ok(meta.recent.length === G.RECENT_MAX, 'memory keeps the last 10');
  ok(typeHits === 0, `recent types skipped (${typeHits} slipped through)`);
  const m2 = G.newMeta(), w = G.offerWorlds(m2, seeded(2))[0];
  G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, m2, seeded(2));
  ok(m2.recent[0].n === w.name, 'starting a run remembers its world');
  const dw = G.dailyWorld('2026-11-01'); G.newRun(dw, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [G.WORLD_TYPES[dw.type].gift], patron: 'war', seed: G.dailySeed('2026-11-01'), daily: '2026-11-01' }, m2);
  ok(m2.recent.length === 1, 'Pending World is not remembered');
}
{
  // World Pulse: a line from round 2, about an entry still standing; Fate stages in rounds 3 and 5; short enough to read
  const r = seeded(41); let n = 0, longest = '';
  for (let t = 0; t < 600; t++) {
    const meta = G.newMeta(), w = G.offerWorlds(meta, r)[0];
    const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, meta, r);
    ok(G.worldPulse(run, r) === null, 'no pulse before the first fight');
    run.round = 2 + (t % 6); run.history = [{ round: run.round - 1, won: t % 2 === 0, hl: t % 2 ? 1 : 0 }];
    if (t % 4 === 3) run.record.lost = (1 << run.record.ids.length) - 2;
    const p = G.worldPulse(run, r);
    if ((run.round === 3 || run.round === 5) && G.FATES[w.fate]) { ok(p === `[${w.name}: ${G.FATES[w.fate].stages[run.round === 3 ? 0 : 1]}]`, 'Fate stage in rounds 3 and 5'); continue; }
    ok(p && p.startsWith('[' + w.name + ': ') && p.endsWith(']') && !/[{}]/.test(p), 'pulse names the world: ' + p);
    const left = G.recEntries(run.record, w.type).filter(e => !e.lost).map(e => G.loreName(G.recLore(run.record, w.type).entries[e.i]));
    ok(left.some(x => p.includes(x)), 'pulse is about an entry still standing: ' + p);
    if (p.length > longest.length) longest = p; n++;
  }
  ok(n > 300 && longest.length <= 90, `pulses stay short (longest ${longest.length}: ${longest})`);
}

// Fate track, wards, run-long marks, world lines and crises (the engine for Fate Crises; content may add none yet)
{
  const r = seeded(11), meta = G.newMeta();
  let w; do { w = G.genWorld(r); } while (!w.fate || !w.people);
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, meta, r);
  const msgs = [], F = G.FATES[w.fate];
  ok(G.fateState(run) === 'Holding' && G.fateEnd(run) === null, 'a Fate starts holding');
  G.moveFate(run, 1, msgs); ok(G.fateState(run) === 'Easing' && msgs.pop().text.includes(F.name + ' eases'), 'fate +1 eases');
  G.moveFate(run, 5, msgs); ok(run.fateTrack === G.FATE_TRACK.max && G.fateEnd(run).end === 'lifted', 'the track stops at its top, lifted');
  G.moveFate(run, -9, msgs); ok(run.fateTrack === G.FATE_TRACK.min && G.fateEnd(run).end === 'sealed', 'and at its bottom, sealed');
  // A lifted Fate in a spared world brings one entry back
  run.fateTrack = G.FATE_TRACK.max; run.record.lost = 3; run.hearts = run.maxHearts - 2; const out = [], hb = run.hearts;
  G.closeFate(run, out, true); ok(run.fateEnd === 'lifted' && run.hearts === hb + 1 && bits(run.record.lost) === 1 && bits(run.record.partial) === 1, 'lifted: a Heart back, its entry partial');
  // Outcomes
  const kit = { favour() { } }, ap = T => { const c = { run, h: kit, msgs }; G.applyOutcomes(T, c, false); G.applyOutcomes(T, c, true); };
  run.fateTrack = 0; ap({ fate: -1 }); ok(run.fateTrack === -1, 'outcome fate');
  ap({ ward: 2 }); ok(run.ward === 2, 'outcome ward');
  ap({ mod: 'famine' }); ok(run.world.mod === 'famine', 'outcome mod');
  run.nextFlags = {}; ap({ always: { foe: { poison: 2 }, next: { bleed: 3 } } });
  ok(run.nextFlags.foePoison === 2 && run.nextFlags.bleed === 3, 'always marks the next fight at once');
  run.nextFlags = {}; G.applyAlways(run); ok(run.nextFlags.foePoison === 2 && run.nextFlags.bleed === 3, 'and every fight after');
  ap({ always: { foe: { poison: 1 } } }); run.nextFlags = {}; G.applyAlways(run); ok(run.nextFlags.foePoison === 3, 'run-long marks add up');
  // World lines: shown only in a world that has the layer, with the layer's name as the tag
  G.EVENTS.__test = { title: 'Test', text: 't', fate: w.fate, opts: [{ label: 'A', desc: 'a', check: { fate: w.fate } }, { label: 'B', desc: 'b', check: { people: w.people } }, { label: 'C', desc: 'c' }] };
  ok(G.eventOpts(run, '__test').length === 3 && G.checkTag({ fate: w.fate }) === `[${F.name}]`, 'world lines show in their world');
  const other = Object.keys(G.FATES).find(k => k !== w.fate); G.EVENTS.__test.opts[0].check = { fate: other };
  ok(!G.eventOpts(run, '__test').includes(0), 'and not in another');
  ok(G.worldTagged(run, G.EVENTS.__test) && !G.worldTagged(run, { fate: other }), 'events lean to the world they are tagged for');
  // Crises: due in stage rounds, once, never in practice
  G.EVENTS.__test.crisis = true; const had = F.crises; F.crises = ['__test'];
  run.round = 3; run.seen = []; ok(G.crisisDue(run) === '__test', 'a crisis is due in round 3');
  run.round = 4; ok(G.crisisDue(run) === null, 'not in round 4');
  run.round = 3; run.seen = ['__test']; ok(G.crisisDue(run) === null, 'and only once');
  run.seen = []; run.practice = true; ok(G.crisisDue(run) === null, 'never in practice');
  if (had) F.crises = had; else delete F.crises; delete G.EVENTS.__test;
}

// People customs: each changes one loop rule, only in its own world; the first payout earns the epithet
{
  const r = seeded(12), mk = people => { let w; do { w = G.genWorld(r); } while (w.people !== people); return G.newRun(w, { name: 'Ana', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [G.WORLD_TYPES[w.type].gift], patron: 'war' }, G.newMeta(), r); };
  const temple = mk('temple'), council = mk('council'), msgs = [];
  G.addFavour(temple, 'war', 2, null, msgs, r); G.addFavour(council, 'war', 2, null, [], r);
  ok(temple.favour.war === council.favour.war + 1, 'Temple State: every Favour gain +1');
  ok(temple.epithet === G.PEOPLES.temple.epithets[0] && temple.champ.startsWith('Ana ' + temple.epithet + ' of '), 'and the first payout earns the epithet: ' + temple.champ);
  ok(!council.epithet && G.checkMet(temple, 'x', { favour: 'war' }) === (temple.favour.war >= 3), 'god lines at 3 Favour in a Temple State');
  temple.freeRerolls = 0; council.freeRerolls = 0; const league = mk('league'); league.freeRerolls = 0;
  ok(G.rerollCost(league) === G.rerollCost(council) - 1, 'Merchant League: rerolls cost 1 less');
  const arc = mk('archive'); ok(G.enchantCount(arc) === G.enchantCount(council) + 1 && G.runeCount(arc) === 4, 'Archive: one more prefix');
  const pil = mk('pilgrims'); pil.hp = 1; ok(G.rollDistricts(pil, r).length === 4 && G.rollDistricts(council, r).length === 3, 'Pilgrims: four districts');
  council.round = 2; ok(G.visitDue(council) === 'council_vote' && G.visitDue(pil) === null, 'Free Council: the vote comes in round 2');
  council.round = 3; ok(G.visitDue(council) === null, 'and only then');
  ok(!G.undercityEvent || ![...Array(200)].some(() => ['council_vote'].concat(Object.keys(G.EVENTS).filter(k => G.EVENTS[k].crisis)).includes(G.undercityEvent(council, r))), 'visits and crises never come from the Undercity');
}
console.log(`record: ${checks} checks passed`);
