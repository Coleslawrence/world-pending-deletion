// World Record checks: picking rules, erasing and restoring, extra Hearts, snapshots and the sanitiser.
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
  for (let i = 0; i < 3; i++) G.amendRecord(run); ok(run.record.ids.length === 14 && !G.amendRecord(run), 'past 14 entries extra Hearts go unrecorded');
  // snapshot and sanitiser
  const snap = G.snapshot(run), json = JSON.parse(JSON.stringify(snap));
  ok(JSON.stringify(json.rec).length < 160, 'snapshot record is small: ' + JSON.stringify(json.rec).length + ' bytes');
  const clean = G.sanitizeSnap(json, 'someone');
  ok(JSON.stringify(clean.rec) === JSON.stringify(json.rec), 'sanitiser keeps a good record');
  const bad = [x => x.ids.push(99), x => x.ids[0] = x.ids[1], x => x.lost = -1, x => x.lost = 1 << 20, x => x.bio.person = 99, x => x.bio.role = 9, x => x.w = 'iron' === json.worldType ? 'sky' : 'iron', x => x.ids = 'nope'];
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
console.log(`record: ${checks} checks passed`);
