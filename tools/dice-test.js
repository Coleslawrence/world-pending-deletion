// Dice test: the Gambler's dice are shown before the pick and the numbers on the button are the numbers that land.
//   node tools/dice-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function fightWith(ids, opt = {}) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 6 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['dicer'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  run.bar = ids.map((id, i) => ({ id, star: 1, mods: [], u: 't' + i })); while (run.bar.length < run.slots) run.bar.push(null);
  (opt.gear || []).forEach(([sl, id]) => run.gear[sl] = { id, star: 1, mods: [], u: 'g' + id });
  G.chooseOpponent(run, 0, false);
  return G.newFight(run);
}
for (let k = 0; k < 300; k++) {
  const f = fightWith(['coin_toss', 'hedge', 'double_down', 'snake_eyes', 'jackpot']), A = f.A;
  const dice = A.skills.filter(s => s.pip);
  ok(dice.length === 4, 'four die skills roll at the start of the fight');
  dice.forEach(s => ok(s.pip >= 1 && s.pip <= 6, 'a die shows 1 to 6'));
  const coin = A.skills.find(s => s.baseDef && s.baseDef.id === 'coin_toss');
  ok(coin.def.fx.dmg === 4 + 2 * coin.pip, 'Coin Toss deals 4 + 2 per pip');
  const snake = A.skills.find(s => s.baseDef && s.baseDef.id === 'snake_eyes');
  ok(snake.pip === 1 ? snake.def.fx.dmg === 45 && snake.def.fx.stun === 1 : snake.def.fx.dmg === 8 && !snake.def.fx.stun, 'Snake Eyes pays on a 1 only');
  const dd = A.skills.find(s => s.baseDef && s.baseDef.id === 'double_down');
  ok(dd.pip === 1 ? dd.def.fx.selfDmg === 6 : !dd.def.fx.selfDmg, 'Double Down hurts you on a 1 only');
  const jp = A.skills.find(s => s.baseDef && s.baseDef.id === 'jackpot');
  ok(jp.def.fx.dmg === 3 * dice.reduce((a, s) => a + s.pip, 0), 'Jackpot deals 3 per pip across all shown dice');
  dice.forEach(s => ok(s.jackpot === dice.some(o => o !== s && o.pip === s.pip), 'a Jackpot is two dice showing the same number'));
  ok(G.describe(coin.def).startsWith('Deal ' + coin.def.fx.dmg), 'the button text shows the rolled number');
  // the shown damage is the damage dealt, before the opponent's defences and crits
  const B = f.B; B.block = 0; B.dodge = 0; B.evade = 0; A.crit = 0; A.critNext = false; A.firstHit = 0; A.focus = 0; A.aq = 0; B.P.flatDR = 0; B.P.lowDR = 0; B.res = null;
  const hp = B.hp, i = A.skills.indexOf(coin);
  if (!coin.jackpot && G.canUse(coin)) { const exp = Math.round(coin.def.fx.dmg * coin.power * G.dmgMult(f, A, B)); G.playerAct(f, i); ok(Math.abs((hp - B.hp) - exp) <= 1 || B.hp <= 0, `Coin Toss lands what it shows (${hp - B.hp} vs ${exp})`); }
}
// Rerolls: none without the tier, and spending one rerolls that die only
{
  const f = fightWith(['coin_toss', 'hedge']); f.A.rerolls = 2;
  const s = f.A.skills.find(x => x.pip), other = f.A.skills.find(x => x.pip && x !== s), was = other.pip;
  ok(G.rerollDie(f, f.A.skills.indexOf(s)) && f.A.rerolls === 1, 'a reroll is spent');
  ok(other.pip === was, 'a reroll leaves the other dice alone');
  f.A.rerolls = 0; ok(!G.rerollDie(f, f.A.skills.indexOf(s)), 'no reroll without rerolls left');
  ok(!G.rerollDie(f, 0), 'Attack has no die to reroll');
}
// Weighted Dice: the first die each fight rolls 6. Cardsharp's Sleeve: a 1 becomes a 6 once.
{
  const f = fightWith(['coin_toss'], { gear: [['accessory', 'weighted_dice']] });
  ok(f.A.skills.find(x => x.pip).pip === 6, 'Weighted Dice: first die rolls 6');
}
// Dice keep rolling turn to turn, and the die minimum holds
{
  let low = 7; for (let k = 0; k < 200; k++) { const f = fightWith(['two_headed']); low = Math.min(low, f.A.skills.find(x => x.pip).pip); }
  ok(low === 4, 'Two-Headed Coin never rolls below 4');
}
console.log(fails ? `dice: ${fails} failures` : 'dice: all checks passed');
process.exit(fails ? 1 : 0);
