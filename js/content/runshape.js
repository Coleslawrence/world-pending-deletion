// ===== [World Pending Deletion] — content: run shape (Intake Interview, tokens, Licences, augment rounds, cursed doors) =====
'use strict';
// The Intake Interview: before the first round the System offers 4 opening deals, 2 plain and 2 with a price.
// Every deal shown can be taken.
//   then: outcomes (outcomes.js) you get      cost: outcomes you pay, shown on the deal because paying is the choice
//   gift: n    n more Gifts to choose          say: the words shown
const INTAKE = {
  signing: { name: 'Signing Bonus', then: { gold: 8 }, say: 'Take 8 gold.', flavour: '[Standard. Everyone is offered this. Almost everyone takes it.]' },
  waiver: { name: 'Liability Waiver', then: { ward: 1 }, say: 'Your first lost fight costs no Heart.', flavour: '[Your first defeat will be filed as a rehearsal.]' },
  issue: { name: 'Standard Issue', then: { piece: 'C' }, say: 'A free C-rank piece.', flavour: '[One item from stores. Do not ask who had it before.]' },
  briefing: { name: 'Opponent Briefing', then: { foe: { weaken: 3, hp: -0.15 } }, say: 'Your first opponent starts with Weaken 3 and 15% less HP.', flavour: '[The System has no favourites. It does have leaks.]' },
  welcome: { name: 'Welcome Pack', then: { rune: 1 }, say: 'A rune to carve into a skill.', flavour: '[Contains one rune and a leaflet nobody reads.]' },
  second_gift: { name: 'Second Opinion', gift: 1, cost: { erase: 2 }, say: 'Choose one more Gift. Your world starts 2 Hearts down.', flavour: '[A second god signs your file. Your world pays the filing fee.]' },
  prototype: { name: 'Prototype Trial', then: { experimental: 1 }, cost: { max_hp: -0.1 }, say: 'An Experimental item. −10% max HP for the whole run.', flavour: '[Consent form attached. Side effects attached to you.]' },
  advance: { name: 'Advance on Winnings', then: { gold: 20 }, cost: { always: { foe: { hp: 0.1 } } }, say: '20 gold now. Every opponent has 10% more HP.', flavour: '[The System is happy to lend. The arena collects.]' },
  drilled: { name: 'Fast-Tracked', then: { points: 2 }, cost: { erase: 1 }, say: '2 stat points to place. Your world starts 1 Heart down.', flavour: '[Training time was found. It was taken from somewhere.]' },
};
// Saver's tokens: spend no gold in a round's shop (nothing bought, no paid reroll, no training) and you leave with
// the token that shop was showing. It is used up in the next round.
const TOKENS = {
  rerolls: { name: 'Reroll Chit', say: '2 free rerolls in your next shop' },
  discount: { name: 'Loyalty Stamp', say: 'everything in your next shop costs 1 gold less' },
  district: { name: 'Travel Pass', say: 'one more district to choose from next round' },
};
// Licences (vouchers): now and then the shop's desk stocks one. It costs VOUCHER_PRICE gold, lasts the whole run, and
// stays on the desk until bought, so it is something to save for.
//   when(run): only stocked while it would do something
const VOUCHERS = {
  rerolls: { name: 'Reroll Licence', say: 'Shop rerolls cost 1 gold less.', flavour: '[Licensed to change your mind. Within reason.]' },
  interest: { name: 'Savings Charter', say: 'Your interest cap rises by 2 gold.', flavour: '[The System approves of thrift. It is easier to count.]' },
  income: { name: 'Broadcast Stipend', say: '+3 gold income every round.', flavour: '[Your share of the advertising. A rounding error, paid in full.]' },
  district: { name: 'City Pass', say: 'One more district to choose from every round.', flavour: '[Valid in all districts. Not valid as identification.]' },
  spoils: { name: 'Salvage Licence', say: 'Spoils offer 4 choices instead of 3.', flavour: '[You may now look under the other tarpaulin.]' },
  training: { name: 'Training Grant', say: 'Training a stat costs 1 gold less.', flavour: '[Subsidised by a department that no longer exists.]' },
};
// Cursed doors: a door offers a curse for the next CURSE_FIGHTS fights and a payoff when it lifts. Both are shown.
//   foeDmg / foeHp: opponents' damage and HP multiply   income: gold a round   priceUp: gold on every shop price
//   hpCut: share of your max HP
const CURSES = {
  heavy: { name: 'Heavy Hands', say: 'opponents deal 20% more damage', foeDmg: 1.2 },
  thick: { name: 'Thick Skins', say: 'opponents have 25% more HP', foeHp: 1.25 },
  garnished: { name: 'Garnished', say: 'your income is 4 gold lower', income: -4 },
  markup: { name: 'Marked Up', say: 'everything in the shop costs 1 gold more', priceUp: 1 },
  thin: { name: 'Thin Blood', say: 'your max HP is 20% lower', hpCut: 0.2 },
};
// What a door pays when its curse lifts: sets of outcomes, each bigger than a normal reward
const DOOR_PAYS = [{ piece: 'A' }, { heart: 1 }, { gold: 16 }, { experimental: 1 }, { rune: 2 }, { points: 2 }];
