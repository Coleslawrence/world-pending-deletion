// Spoils test: every opponent but the Final Champion names its Spoils, offers are takeable (3 distinct pieces, no Heart at
// full Hearts, no heal at full HP), taking each kind does what it says, leaving them pays gold, and seeded runs repeat.
//   node tools/spoils-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function newRun(seed, world) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = world || G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), seed }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta, undefined, run.gearDraft[0]);
  return { meta, run };
}
for (let k = 0; k < 100; k++) {
  const { run } = newRun();
  ok(run.choices && run.choices.length === 2, 'two opponents in round 1');
  run.choices.forEach(c => ok(G.SPOILS[c.spoils], `opponent carries Spoils (${c.spoils})`));
  run.choices.filter(c => c.hard).forEach(c => ok(['gear', 'skill'].includes(c.spoils), 'hard opponents carry pieces'));
  ok(/Spoils: /.test(G.specReward(run.choices[0])), 'the card names the Spoils');
  for (const kind of Object.keys(G.SPOILS)) {
    run.hp = G.maxHp(run); run.hearts = run.maxHearts;
    const offers = G.spoilsOffers(run, kind, Math.random);
    ok(offers.length >= 2 && offers.length <= 3, `${kind}: 2 or 3 offers`);
    if (kind === 'skill' || kind === 'gear') { ok(new Set(offers.map(o => o.id)).size === offers.length, `${kind}: offers differ`); offers.forEach(o => ok(G.isGear(o.id) === (kind === 'gear'), `${kind}: ${o.id} is the right kind`)); }
    if (kind === 'supplies') ok(!offers.some(o => o.k === 'heart' || o.k === 'heal'), 'supplies: no Heart or heal when full');
    const before = { gold: run.gold, n: G.allPieces(run).length, stats: Object.assign({}, run.stats), rr: run.freeRerolls || 0 };
    run.pending.push({ type: 'spoils', kind, offers });
    const o = offers[k % offers.length];
    ok(G.takeSpoils(run, k % offers.length, []), `${kind}: taken`);
    ok(!run.pending.some(p => p.type === 'spoils'), `${kind}: pending cleared`);
    if (o.k === 'piece') ok(G.allPieces(run).length >= before.n, 'piece added (or merged)');
    if (o.k === 'stat') ok(run.stats[o.stat] === before.stats[o.stat] + 1, 'stat +1');
    if (o.k === 'gold') ok(run.gold === before.gold + o.n, 'gold paid');
    if (o.k === 'rerolls') ok(run.freeRerolls === before.rr + o.n, 'rerolls added');
  }
  run.hearts = run.maxHearts - 1; run.hp = 1;
  const sup = G.spoilsOffers(run, 'supplies', Math.random);
  ok(sup.length === 3 && sup.some(o => o.k === 'heart') && sup.some(o => o.k === 'heal'), 'supplies: Heart and heal offered when hurt');
  run.pending.push({ type: 'spoils', kind: 'supplies', offers: sup });
  const hi = sup.findIndex(o => o.k === 'heart'); G.takeSpoils(run, hi, []); ok(run.hearts === run.maxHearts, 'Heart restored');
  const g = run.gold; run.pending.push({ type: 'spoils', kind: 'gear', offers: G.spoilsOffers(run, 'gear', Math.random) });
  G.takeSpoils(run, 'skip', []); ok(run.gold === g + G.SPOILS_SKIP, 'leaving the Spoils pays gold');
}
// Seeded runs: the same seed draws the same Spoils
{
  const a = newRun('spoils-seed').run, b = newRun('spoils-seed', a.world).run;
  ok(JSON.stringify(a.choices.map(c => c.spoils)) === JSON.stringify(b.choices.map(c => c.spoils)), 'seeded runs draw the same Spoils');
}
console.log(fails ? `${fails} failed` : 'spoils test: all passed');
process.exit(fails ? 1 : 0);
