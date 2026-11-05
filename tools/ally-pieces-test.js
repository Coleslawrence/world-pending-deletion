// Ally pieces test: the shared Gambler and Jinx pieces (Thunder Dice, Crooked Odds, Bad Wick, Shuffling Shoe, Bad Water,
// Unlucky Number) do what their text says.
//   node tools/ally-pieces-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function fightWith(ids, opt = {}) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 6 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['dicer', 'jinx'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  run.bar = ids.map((id, i) => ({ id, star: 1, mods: [], u: 't' + i })); while (run.bar.length < run.slots) run.bar.push(null);
  (opt.gear || []).forEach(([sl, id]) => run.gear[sl] = { id, star: 1, mods: [], u: 'g' + id });
  G.chooseOpponent(run, 0, false);
  return G.newFight(run);
}
const find = (f, id) => f.A.skills.find(s => (s.baseDef || s.def).id === id);
// Thunder Dice
for (let k = 0; k < 200; k++) {
  const f = fightWith(['thunder_dice', 'rolling_thunder']), t = find(f, 'thunder_dice'), r = find(f, 'rolling_thunder');
  ok(t.def.fx.dmg === 4 + 2 * t.pip, 'Thunder Dice deals 4 + 2 per pip');
  ok(!!t.def.fx.stun === (t.pip === 6), 'Thunder Dice Stuns on a 6 only');
  ok(!!r.def.fx.stun === (r.pip >= 5), 'Rolling Thunder Stuns on a 5 or 6');
  ok(!('dieStun' in t.def.fx), 'dieStun is worked into plain effects');
}
// Crooked Odds: Misfortune 2 on the opponent
{
  const f = fightWith(['crooked_odds', 'coin_toss']), B = f.B, m = B.misfortune || 0;
  G.playerAct(f, f.A.skills.indexOf(find(f, 'crooked_odds')));
  ok((B.misfortune || 0) === m + 2, 'Crooked Odds adds 2 Misfortune');
}
// Bad Wick: 1 Misfortune per 3 Burn on the opponent after its Burn lands
{
  const f = fightWith(['bad_wick']), B = f.B; B.burn = 8; B.misfortune = 0;
  G.playerAct(f, f.A.skills.indexOf(find(f, 'bad_wick')));
  ok(B.misfortune >= 3, `Bad Wick adds Misfortune per 3 Burn (misf ${B.misfortune})`);
}
// Unlucky Number: a 1 adds 3 Misfortune (rerolled until a 1 shows; the Gambler's tier 1 floor is lifted for the test)
{
  const f = fightWith(['coin_toss'], { gear: [['accessory', 'unlucky_number']] }), A = f.A, c = find(f, 'coin_toss');
  A.P.dieMin = 0; A.rerolls = 400; let seen = 0;
  for (let k = 0; k < 400 && !seen; k++) { const m = f.B.misfortune || 0; G.rerollDie(f, A.skills.indexOf(c)); if (c.pip === 1) { seen++; ok((f.B.misfortune || 0) === m + 3, 'Unlucky Number: a 1 adds 3 Misfortune'); } }
  ok(seen > 0, 'a 1 was rolled at least once');
}
// Bad Water works for whoever carries it: here the opponent has it and you cleanse with Purify
{
  const f = fightWith(['purify']), A = f.A, B = f.B; B.P.misfNoCleanse = 5;
  A.poison = 10; A.misfortune = 6; G.playerAct(f, A.skills.indexOf(find(f, 'purify')));
  ok(A.poison > 0, 'Bad Water: Poison stays at 6 Misfortune');
  const g = fightWith(['purify']); g.B.P.misfNoCleanse = 5; g.A.poison = 10; g.A.misfortune = 2; G.playerAct(g, g.A.skills.indexOf(find(g, 'purify')));
  ok(g.A.poison === 0, 'Bad Water: Poison is cleansed below 5 Misfortune');
}
// Shuffling Shoe: the effect is on the player
{
  const f = fightWith(['coin_toss'], { gear: [['armour', 'shuffling_shoe']] });
  ok(f.A.P.quickReroll === 1, 'Shuffling Shoe gives quickReroll');
}
console.log(fails ? `ally pieces: ${fails} failures` : 'ally pieces: all checks passed');
process.exit(fails ? 1 : 0);
