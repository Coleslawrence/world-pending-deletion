// ===== [World Pending Deletion] — content: Patron bonds =====
'use strict';
// Phase 7, step 2. Favour you end a run holding with a god adds to a lasting Bond with that god (core.js: meta.bonds).
// Each Bond level opens something: 1 a line, 2 a new kind of wager that god offers, 3 another line, 4 that god's own
// Gift. Pending World and practice never use a Bond (the wager and the Gift stay out of them), but a Pending World run
// still adds its Favour.
//   wager: the feat the god starts betting on at Bond 2 (feats.js).  lines: what the god says at Bond 1 and Bond 3,
//   shown when you begin a run with them as Patron.  gift: the Gift opened at Bond 4 (below).
const BOND_AT = [8, 20, 40, 70]; // Favour kept across runs for Bond 1 to 4
const BONDS = {
  war: { wager: 'bighit', lines: ['I have seen you bleed for me. Keep doing it.', 'You fight like you mean it now. I notice that.'], gift: 'bond_war' },
  trick: { wager: 'quick', lines: ["Oh, it's you again. Good. I'd started a rumour about you.", "We've cheated together so long it's practically a marriage."], gift: 'bond_trick' },
  ruin: { wager: 'clutch', lines: ['You keep almost dying for me. It is very flattering.', 'When your world goes, I will make sure it goes beautifully.'], gift: 'bond_ruin' },
  house: { wager: 'giant', lines: ['Your account is in good standing. For now.', 'The House has raised your credit limit. Do not make it regret that.'], gift: 'bond_house' },
  crow: { wager: 'fast', lines: ['I have watched you from the rafters. You do not waste time.', 'I have started saving you the good scraps.'], gift: 'bond_crow' },
};
Object.assign(GIFTS, {
  bond_war: { name: 'Blood Oath', cat: 'divine', cost: 3, lock: 'bond', bond: 'war', desc: 'All your damage +20%, and breaking an opponent Empowers you for 2 turns.', p: { dmgPct: 0.2, breakEmpower: 2 }, flavour: 'War does not swear oaths. War made an exception.' },
  bond_trick: { name: 'Card Up the Sleeve', cat: 'divine', cost: 3, lock: 'bond', bond: 'trick', desc: 'Burn, Poison and Bleed you apply +2, and evade the first attack each fight.', p: { dotPlus: 2, firstEvade: 1 }, flavour: "The Trickster taught you this one personally. Don't ask what it cost." },
  bond_ruin: { name: 'Last Ember', cat: 'divine', cost: 3, lock: 'bond', bond: 'ruin', desc: 'Below half HP, deal 35% more damage. Burn you apply +2.', p: { lowHpDmg: 0.35, burnPlus: 2 }, flavour: 'Ruin keeps one coal from every fire. This one is yours.' },
  bond_house: { name: 'House Credit', cat: 'divine', cost: 3, lock: 'bond', bond: 'house', desc: '+4 gold after each win, and chance options in events +10%.', p: { goldPerWin: 4, chanceBonus: 10 }, flavour: 'Your name is on a ledger only the House can read.' },
  bond_crow: { name: "Crow's Eye", cat: 'divine', cost: 3, lock: 'bond', bond: 'crow', desc: 'Your first hit each fight is critical, and +12% critical chance.', p: { firstCrit: 1, critBonus: 0.12 }, flavour: 'The Crow sees the soft place first. Now so do you.' },
});
