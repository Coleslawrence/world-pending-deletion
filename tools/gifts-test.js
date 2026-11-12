// Gifts test: the Awakening without Gift Points. The world's Gift is free, 1 Signature Gift is chosen from a small draw
// (3, +1 rank E/D, +1 Gift bounty, +1 Faithless, +2 with a Flaw), at most 1 Flaw, and smaller Gifts are picked 1 of 3
// entering rounds 2 and 4.
//   node tools/gifts-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
const meta = G.newMeta(); G.bindMeta(meta);
const w = Object.assign(G.offerWorlds(meta)[0], { rank: 3, bounty: null });
ok(G.sigCount(w, 'war', 0) === 3, 'a rank B world shows 3 Signature Gifts');
ok(G.sigCount(Object.assign({}, w, { rank: 0 }), 'war', 0) === 4, 'a rank E world shows 4');
ok(G.sigCount(w, 'none', 0) === 4, 'Faithless shows 1 more');
ok(G.sigCount(w, 'war', 1) === 5, 'a Flaw shows 2 more');
ok(G.sigCount(Object.assign({}, w, { rank: 0, bounty: 'gift' }), 'none', 1) === G.SIG_MAX, 'never more than SIG_MAX');
for (let i = 0; i < 50; i++) {
  const o = G.makeOffer(w, meta);
  ok(o.length > 0 && o.length <= G.SIG_MAX && o.every(k => G.isSignature(k) && G.giftUnlocked(k, meta)), 'the draw holds only unlocked Signature Gifts');
  ok(new Set(o).size === o.length, 'no Gift drawn twice');
}
const o = G.makeOffer(w, meta), wg = G.WORLD_TYPES[w.type].gift, flaw = G.flawsAllowed(meta)[0];
ok(G.giftCheck(w, [wg, o[0]], 'war', o).ok, 'world Gift + a shown Signature Gift is valid');
ok(!G.giftCheck(w, [wg, o[0], o[1]], 'war', o).ok, 'two Signature Gifts are not');
ok(!G.giftCheck(w, [wg, o[3]], 'war', o).ok, 'a Signature Gift not on show is not');
ok(G.giftCheck(w, [wg, o[3], flaw], 'war', o).ok, 'a Flaw puts more on show');
ok(!G.giftCheck(w, [wg, 'catalyst'], 'war', o).ok, 'smaller Gifts are not chosen at the Awakening');
const r = G.randomGifts(w, meta, 'war', o);
ok(r[0] === wg && r.length === 2 && o.slice(0, 3).includes(r[1]), "the System picks the world's Gift and a shown Signature Gift");
const run0 = G.newRun(w, { name: 'T', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [wg, o[0]], patron: 'war', offer: o }, meta);
const runF = G.newRun(w, { name: 'T', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [wg, o[0], flaw], patron: 'war', offer: o, sys: true }, meta);
ok(runF.gold - run0.gold === G.FLAW_GOLD + G.SYS_GOLD, 'a Flaw and the System each pay their gold');
// In-run picks
const run = G.newRun(w, { name: 'T', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [wg], patron: 'war', offer: o }, meta);
G.confirmDraft(run, run.draft.slice(0, 3), meta);
for (const round of [2, 3, 4]) {
  run.round = round; run.pending = []; G.enterChoose(run, meta);
  const p = run.pending.find(x => x.type === 'gift' && x.pick);
  ok(!!p === G.GIFT_PICK_ROUNDS.includes(round), `round ${round}: a Gift pick ${G.GIFT_PICK_ROUNDS.includes(round) ? 'is' : 'is not'} offered`);
  if (p) { ok(p.offers.length === 3 && p.offers.every(k => G.SMALL_CATS.includes(G.GIFTS[k].cat) || G.GIFTS[k].cat === 'glitch'), 'a pick offers 3 smaller Gifts'); G.applyGift(run, p.offers[0], []); ok(G.hasGift(run, p.offers[0]), 'the picked Gift is held'); }
  run.pending = []; G.enterChoose(run, meta);
  ok(!run.pending.some(x => x.type === 'gift' && x.pick), `round ${round}: never offered twice`);
}
const old = G.newRun(w, { name: 'T', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [wg], patron: 'war', offer: o }, meta);
delete old.giftPicks; old.round = 2; old.pending = []; G.enterChoose(old, meta);
ok(!old.pending.some(x => x.type === 'gift' && x.pick), 'a run started before picks existed gets none');
console.log(fails ? `${fails} failed` : 'gifts test: all passed');
process.exit(fails ? 1 : 0);
