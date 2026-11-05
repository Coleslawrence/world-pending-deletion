// Jinx test: costs are shown and paid, a jinxed move goes wrong for its user by its role, Omens fire on a match,
// and Curse is carried and passed on.
//   node tools/jinx-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function fightWith(ids) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 6 }, gifts: [], patron: 'war', offer: G.makeOffer(w, meta), arch: ['jinx'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  run.bar = ids.map((id, i) => ({ id, star: 1, mods: [], u: 't' + i })); while (run.bar.length < run.slots) run.bar.push(null);
  G.chooseOpponent(run, 0, false);
  const f = G.newFight(run); f.B.dodge = 0; f.B.evade = 0; f.A.dodge = 0; return f;
}
const idx = (f, id) => f.A.skills.findIndex(s => s.def.id === id);
for (let k = 0; k < 60; k++) {
  const f = fightWith(['evil_eye', 'ill_omen', 'pass_curse', 'thirteenth']), A = f.A, B = f.B;
  ok(A.isJinx, 'a Jinx skill on the bar shows the Jinx button');
  ok(!G.canJinx(f), 'no jinx without Misfortune');
  B.misfortune = 20;
  const role = G.jinxRole(f, B.intent), cost = G.jinxCost(f);
  ok(cost === G.JINX_COST[role] - (A.P.jinxCheap || 0), `the cost is the role's (${role} ${cost})`);
  ok(G.canJinx(f) && G.jinxMove(f), 'the jinx is taken when Misfortune covers it');
  ok(B.misfortune === 20 - cost, 'the cost is paid');
  ok(A.curse === (A.P.jinxFree ? 0 : 1), 'a jinx gives 1 Curse');
  ok(!G.canJinx(f), 'once per turn');
  const s = B.intent, fx = s.def.fx, hp = B.hp, ablock = A.block, ahp = A.hp;
  // end the player's turn without acting, so the jinxed move fires
  G.skipPlayer(f); if (f.phase === 'enemy') G.enemyTurn(f);
  if (role === 'strike' || role === 'big') ok(B.hp < hp || B.hp <= 0, `a jinxed ${role} hits its user`);
  if (role === 'guard') ok(A.block > 0 || ablock > 0, 'a jinxed guard gives you its Block');
  if (role === 'strike' || role === 'big') ok(A.hp >= ahp - 1 || f.over, 'and not you');
}
// Omens: an attack Omen fires on an attack and adds Misfortune
{
  let fired = 0, tried = 0;
  for (let k = 0; k < 80; k++) {
    const f = fightWith(['ill_omen']), A = f.A, B = f.B, i = idx(f, 'ill_omen');
    G.playerAct(f, i); ok(B.omens.length === 1, 'Ill Omen places an Omen');
    const role = G.jinxRole(f, B.intent), m = B.misfortune || 0;
    if (f.phase === 'enemy') G.enemyTurn(f);
    if (role === 'strike' || role === 'big') { tried++; if (B.omens.length === 0 && B.misfortune >= m + 3) fired++; }
    else ok(B.omens.length === 1, 'an attack Omen waits through a non-attack');
  }
  ok(tried > 0 && fired === tried, `attack Omens fire on attacks (${fired}/${tried})`);
}
// Pass the Curse: Curse moves over as double Misfortune; Curse raises damage both ways
{
  const f = fightWith(['pass_curse']), A = f.A, B = f.B; A.curse = 5; B.misfortune = 0;
  const m1 = G.dmgMult(f, A, B); A.curse = 0; const m0 = G.dmgMult(f, A, B); A.curse = 5;
  ok(Math.abs(m1 / m0 - 1.3) < 1e-9, 'Curse 5 makes your skills deal 30% more');
  G.playerAct(f, idx(f, 'pass_curse'));
  ok(A.curse === 0 && B.misfortune === 10, 'Pass the Curse: 5 Curse becomes 10 Misfortune');
}
console.log(fails ? `jinx: ${fails} failures` : 'jinx: all checks passed');
process.exit(fails ? 1 : 0);
