// World bounty test: one world per offer gets a bounty (never a Steered one), and each bounty does what its card says:
// Echoes x2, Rank Points +50%, +2 Gift Points. Seeded (Pending World) and practice runs never pay a bounty.
//   node tools/bounty-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
for (let k = 0; k < 300; k++) {
  const meta = G.newMeta(), W = G.worldBounty(G.offerWorlds(meta));
  ok(W.filter(w => w.bounty).length === 1 && G.BOUNTIES[W.find(w => w.bounty).bounty], 'exactly one world carries a bounty');
}
{ const W = G.worldBounty([{ steered: 'type' }]); ok(!W[0].bounty, 'a Steered world never carries a bounty'); }
function runOn(bounty, seed) {
  const meta = G.newMeta(); G.bindMeta(meta);
  const w = Object.assign(G.offerWorlds(meta)[0], { bounty });
  const run = G.newRun(w, { name: 'T', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), seed }, meta);
  run.wins = 8; run.eliteWins = 0; run.hearts = 6;
  return { meta, run, w };
}
const plain = runOn(null), echo = runOn('echoes'), rank = runOn('rank'), gift = runOn('gift');
echo.run.world.rank = rank.run.world.rank = plain.run.world.rank;
ok(G.echoesFor(echo.run, 'spared') === 2 * G.echoesFor(plain.run, 'spared'), 'Echo bounty doubles Echoes');
ok(G.rpFor(rank.run, 'spared') === Math.round(G.rpFor(plain.run, 'spared') * 1.5) || Math.abs(G.rpFor(rank.run, 'spared') - 1.5 * G.rpFor(plain.run, 'spared')) <= 1, 'Rank bounty pays +50% RP');
ok(G.giftBudget(gift.w) === G.giftBudget(Object.assign({}, gift.w, { bounty: null })) + 2, 'Gift bounty adds 2 Gift Points');
const seeded = runOn('echoes', 'wpd:2026-11-08');
ok(G.echoesFor(seeded.run, 'spared') === G.echoesFor(Object.assign({}, seeded.run, { world: Object.assign({}, seeded.run.world, { bounty: null }) }), 'spared'), 'seeded runs pay no bounty');
console.log(fails ? `${fails} failed` : 'bounty test: all passed');
process.exit(fails ? 1 : 0);
