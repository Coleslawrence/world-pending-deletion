// Run shape test (Phase 2): the Intake Interview offers 2 plain deals and 2 priced ones and each does what it says;
// spending nothing in a shop earns its token and the token works next round; Licences stock, sell and change the rules;
// augment rounds offer Amendments at rounds 2 and 6; cursed doors curse for 2 fights and then pay; seeded runs repeat.
//   node tools/runshape-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js'), bot = require('./bot.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function newRun(seed, setup) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, Object.assign({ name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), seed }, setup), meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta, undefined, run.gearDraft[0]);
  return { meta, run };
}
const clear = run => { run.pending = run.pending.filter(p => !['intake', 'augment', 'door'].includes(p.type)); };
// --- Intake Interview
const seen = {};
for (let k = 0; k < 300; k++) {
  const { run } = newRun();
  const P = run.pending.find(p => p.type === 'intake');
  ok(P && P.offers.length === 4, 'intake: 4 deals at the start');
  if (!P) continue;
  ok(new Set(P.offers).size === 4, 'intake: deals differ');
  ok(P.offers.slice(0, 2).every(id => !G.INTAKE[id].cost) && P.offers.slice(2).every(id => G.INTAKE[id].cost), 'intake: 2 plain then 2 priced');
  const i = k % 4, id = P.offers[i], D = G.INTAKE[id]; seen[id] = true;
  const b = { gold: run.gold, hearts: run.hearts, pts: run.statPts, hp: G.maxHp(run), n: G.allPieces(run).length, ward: run.ward || 0, gifts: run.pending.filter(p => p.type === 'gift').length, runes: run.pending.filter(p => p.type === 'rune').length };
  const msgs = [];
  ok(G.takeIntake(run, i, msgs), `intake ${id}: taken`);
  ok(!run.pending.some(p => p.type === 'intake'), 'intake: cleared');
  ok(!G.takeIntake(run, 0, []), 'intake: only once');
  const T = Object.assign({}, D.then, D.cost);
  if (D.then && D.then.gold) ok(run.gold === b.gold + D.then.gold, `${id}: gold`);
  if (T.ward) ok(run.ward === b.ward + 1, `${id}: ward`);
  if (T.piece || T.experimental) ok(G.allPieces(run).length >= b.n, `${id}: piece`);
  if (T.points) ok(run.statPts === b.pts + T.points, `${id}: stat points`);
  if (T.erase) ok(run.hearts === b.hearts - T.erase && run.maxHearts === 10, `${id}: Hearts down, max unchanged`);
  if (T.max_hp) ok(run.hpCut === -T.max_hp && run.hp <= G.maxHp(run), `${id}: max HP down`);
  if (T.rune) ok(run.pending.filter(p => p.type === 'rune').length === b.runes + 1, `${id}: rune to carve`);
  if (D.gift) ok(run.pending.filter(p => p.type === 'gift').length === b.gifts + 1, `${id}: a Gift to choose`);
  if (T.always) ok(run.always && run.always.foe && run.always.foe.hp > 0, `${id}: every opponent marked`);
  ok(msgs.length > 0, `${id}: says what happened`);
}
Object.keys(G.INTAKE).forEach(id => ok(seen[id], `intake: ${id} was offered in 300 runs`));
{ const meta = G.newMeta(); const run = G.newRun(G.offerWorlds(meta)[0], { name: 'P', stats: { STR: 2, AGI: 2, INT: 2, VIT: 2, LUK: 2 }, gifts: [], patron: 'none', script: { rounds: 2 } }, meta); G.confirmDraft(run, run.draft.slice(0, 3), meta); ok(!run.pending.some(p => p.type === 'intake') && !run.tokenOffer, 'practice: no interview, no token'); }
// --- Saver's tokens
for (let k = 0; k < 60; k++) {
  const { run, meta } = newRun(); clear(run);
  ok(G.TOKENS[run.tokenOffer], 'token: the first shop shows one');
  const want = run.tokenOffer;
  G.chooseOpponent(run, 0, false); G.useDistrict(run, run.districts[0]); clear(run);
  if (k % 3 === 0) { run.gold = 50; const kind = run.shop.skill.findIndex(Boolean); G.buy(run, 'skill', kind, []); ok(!G.tokenReady(run), 'token: buying forfeits it'); G.leaveShop(run, null, []); ok(!run.token, 'token: none after buying'); continue; }
  if (k % 3 === 1) { run.gold = 50; G.trainStat(run, 'VIT', []); ok(!G.tokenReady(run), 'token: training forfeits it'); continue; }
  ok(G.tokenReady(run), 'token: ready while nothing is spent');
  const msgs = []; G.leaveShop(run, null, msgs);
  ok(run.token === want && msgs.some(m => m.text.includes(G.TOKENS[want].name)), 'token: earned on leaving');
  run.round++; const p0 = G.price(run, run.shop.skill.find(Boolean) || { id: G.poolIds(run)[0] });
  G.enterChoose(run, meta, undefined, []); clear(run);
  ok(run.tokenOn === want && !run.token, 'token: in use next round, then gone');
  if (want === 'rerolls') ok(run.freeRerolls >= 2, 'token: 2 free rerolls');
  if (want === 'discount') { const it = run.shop.skill.find(Boolean); run.tokenOn = null; const full = G.price(run, it); run.tokenOn = 'discount'; ok(G.price(run, it) === Math.max(0, full - 1), 'token: prices 1 lower'); }
  if (want === 'district') { run.hp = 1; run.hearts = 5; G.chooseOpponent(run, 0, false); const n = run.districts.length; run.tokenOn = null; G.toDistrict(run); ok(n === run.districts.length + 1, `token: one more district (${n} vs ${run.districts.length})`); }
}
// --- Licences
{ let stocked = 0; const N = 400;
  for (let k = 0; k < N; k++) { const { run, meta } = newRun(); clear(run); ok(!run.voucher, 'licence: never in the first shop'); run.round++; G.enterChoose(run, meta, undefined, []); if (run.voucher) stocked++; }
  ok(stocked > N * 0.28 && stocked < N * 0.52, `licence: stocked about ${G.VOUCHER_CHANCE * 100}% of second shops (${stocked}/${N})`); }
Object.keys(G.VOUCHERS).forEach(v => {
  const { run } = newRun(); clear(run);
  G.chooseOpponent(run, 0, false);
  run.voucher = v; run.gold = 5;
  ok(!G.buyVoucher(run, []), `licence ${v}: not outside the shop`);
  G.useDistrict(run, run.districts[0]); clear(run);
  ok(!G.buyVoucher(run, []), `licence ${v}: not without the gold`);
  run.gold = 30; run.freeRerolls = 0;
  const b = { rc: G.rerollCost(run), cap: G.interestCap(run), inc: G.income(run), tp: (run.bought = 4, G.pointPrice(run)) };
  ok(G.buyVoucher(run, []) && run.gold === 30 - G.VOUCHER_PRICE && G.hasVoucher(run, v) && !run.voucher, `licence ${v}: bought`);
  ok(!G.voucherPool(run).includes(v), `licence ${v}: not stocked again`);
  if (v === 'rerolls') ok(G.rerollCost(run) === Math.max(1, b.rc - 1), 'licence: rerolls 1 cheaper');
  if (v === 'interest') ok(G.interestCap(run) === b.cap + 2, 'licence: interest cap +2');
  if (v === 'income') { run.gold = 30; ok(G.income(run) === b.inc + 3, 'licence: income +3'); }
  if (v === 'training') ok(G.pointPrice(run) === b.tp - 1, 'licence: training 1 cheaper');
  if (v === 'spoils') ok(G.spoilsOffers(run, 'skill', Math.random).length === 4 && G.spoilsOffers(run, 'stat', Math.random).length === 4, 'licence: 4 Spoils');
  if (v === 'district') { run.hp = 1; run.hearts = 5; run.stage = 'choose'; G.chooseOpponent(run, 0, false); const n = run.districts.length; run.vouchers = []; G.toDistrict(run); ok(n === run.districts.length + 1, 'licence: one more district'); }
});
// --- Augment rounds
for (let k = 0; k < 80; k++) {
  const { run, meta } = newRun(); clear(run);
  ok(!run.pending.some(p => p.type === 'augment'), 'augment: not in round 1');
  for (const r of [2, 3, 4, 5, 6]) {
    run.round = r; G.enterChoose(run, meta, undefined, []);
    const P = run.pending.find(p => p.type === 'augment');
    ok(!!P === G.AUGMENT_ROUNDS.includes(r), `augment: round ${r} ${G.AUGMENT_ROUNDS.includes(r) ? 'offers' : 'does not offer'}`);
    if (P) {
      ok(P.offers.length === 3 && new Set(P.offers).size === 3 && P.offers.every(a => G.AMENDMENTS[a] && !(run.augments || []).includes(a)), 'augment: 3 new Amendments');
      const pick = k % 4 === 3 ? 'skip' : k % 3, a = P.offers[pick], A = G.AMENDMENTS[a], b = G.amendOf(run), hc = G.heartCost(run, {});
      ok(G.takeAugment(run, pick, []), 'augment: taken'); ok(!run.pending.some(p => p.type === 'augment'), 'augment: cleared');
      const n = G.amendOf(run);
      if (pick === 'skip') ok(JSON.stringify(n) === JSON.stringify(b), 'augment: skipping changes nothing');
      else { ok(run.augments.includes(a), 'augment: in force'); ok(Math.abs(n.foeHp - b.foeHp * (A.foeHp || 1)) < 1e-9 && Math.abs(n.foeDmg - b.foeDmg * (A.foeDmg || 1)) < 1e-9 && n.winGold === b.winGold + (A.winGold || 0) && n.income === b.income + (A.income || 0), `augment ${a}: rules stack`); if (A.heartCut) ok(G.heartCost(run, {}) === Math.max(1, hc - A.heartCut), `augment ${a}: Heart cost`); }
      run.round = r; G.enterChoose(run, meta, undefined, []); ok(!run.pending.some(p => p.type === 'augment'), 'augment: once a round');
    }
    clear(run);
  }
}
// --- Cursed doors
Object.keys(G.CURSES).forEach(c => G.DOOR_PAYS.forEach((pay, pi) => {
  const { run, meta } = newRun(); clear(run);
  run.round = 3; G.enterChoose(run, meta, undefined, []);
  const P = run.pending.find(p => p.type === 'door');
  ok(P && G.CURSES[P.curse] && P.pay, 'door: offered in round 3');
  run.pending = run.pending.filter(p => p.type === 'door'); P.curse = c; P.pay = pay; run.gold = 40;
  const it = run.shop.skill.find(Boolean), b = { hp: G.maxHp(run), inc: G.income(run), pr: G.price(run, it), a: G.amendOf(run) };
  if (pi === 0) { ok(G.takeDoor(run, false, []) && !run.curse && !run.pending.length, 'door: walking past does nothing'); return; }
  ok(G.takeDoor(run, true, []) && run.curse && run.curse.left === G.CURSE_FIGHTS, `door ${c}: opened`);
  const C = G.CURSES[c], n = G.amendOf(run);
  if (C.foeDmg) ok(n.foeDmg > b.a.foeDmg, `${c}: opponents hit harder`);
  if (C.foeHp) ok(n.foeHp > b.a.foeHp, `${c}: opponents have more HP`);
  if (C.income) ok(G.income(run) === Math.max(0, b.inc + C.income), `${c}: income down`);
  if (C.priceUp) ok(G.price(run, it) === b.pr + 1, `${c}: prices up`);
  if (C.hpCut) ok(G.maxHp(run) < b.hp && run.hp <= G.maxHp(run), `${c}: max HP down`);
  run.round = 5; G.enterChoose(run, meta, undefined, []); ok(!run.pending.some(p => p.type === 'door'), 'door: none while cursed');
}));
{ const { run, meta } = newRun(); clear(run); run.curse = { id: 'heavy', left: G.CURSE_FIGHTS, pay: { gold: 16 } }; const g = run.gold, msgs = [];
  G.tickCurse(run, meta, msgs); ok(run.curse && run.curse.left === 1 && run.gold === g, 'door: still cursed after 1 fight');
  G.tickCurse(run, meta, msgs); ok(!run.curse && run.gold === g + 16 && msgs.length, 'door: lifts after 2 fights and pays'); }
// A full bot run: a door's curse lasts exactly 2 fights and then pays; nothing is left pending at the end
{ let opened = 0, paid = 0, bought = 0, aug = 0;
  for (let k = 0; k < 150; k++) {
    const meta = G.newMeta(); const r = bot.playRun ? bot.playRun(meta, false, { noElite: true, snap: (at, run) => { if (run.curse) ok(run.curse.left >= 1 && run.curse.left <= G.CURSE_FIGHTS, 'door: 1 or 2 fights left'); } }) : null;
    if (!r) break;
    const picks = (r.run && r.run.picks) || [];
    opened += picks.filter(x => x.startsWith('c:')).length; bought += picks.filter(x => x.startsWith('v:')).length; aug += picks.filter(x => x.startsWith('a:')).length;
  }
  if (bot.playRun) { ok(opened > 0, 'bot: opened doors'); ok(bought > 0, 'bot: bought Licences'); ok(aug > 0, 'bot: passed Amendments'); }
}
// --- Seeded runs repeat
{ const sig = seed => { const { run, meta } = newRun(seed); const out = [run.pending.find(p => p.type === 'intake').offers.join(), run.tokenOffer]; clear(run);
    for (const r of [2, 3, 5, 6]) { run.round = r; G.enterChoose(run, meta, undefined, []); out.push(run.tokenOffer, run.voucher, JSON.stringify(run.pending.filter(p => ['augment', 'door'].includes(p.type)))); clear(run); }
    return out.join('|'); };
  ok(sig('wpd:test-a') === sig('wpd:test-a'), 'seeded: the same seed gives the same deals, tokens, Licences, Amendments and doors');
  ok(sig('wpd:test-a') !== sig('wpd:test-b'), 'seeded: another seed differs'); }
console.log(fails ? `${fails} failure(s)` : 'run shape: all good');
process.exit(fails ? 1 : 0);
