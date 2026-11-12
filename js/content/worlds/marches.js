// ===== [World Pending Deletion] — content: world pack: Coin Marches =====
'use strict';
WORLD_TYPES.marches = { name: 'Coin Marches', flavour: 'City-states that settle everything with dice, even the crown.', home: 'dicer', guest: 'pyre', gift: 'loadeddice', final: 'dealer', names: [['Lot', 'Ves', 'Cas', 'Dra', 'Pen', 'Ori', 'Mar', 'Tal', 'Bel', 'Sor'], ['ino', 'ara', 'ette', 'ro', 'ance', 'ille', 'enza', 'ora', 'ade', 'ane']], mids: ['a', 'er', 'o'], champs: ['Rennick', 'Sabine', 'Luca', 'Marisol', 'Teo', 'Ines', 'Aurelio', 'Bianca', 'Corvin', 'Delia', 'Emilio', 'Fiora', 'Gianni', 'Livia', 'Matteo', 'Nerina', 'Orsino', 'Pia', 'Rocco', 'Serafina'] };
// ruler: the old power a clashing People contradicts (PEOPLES[x].clash), and what backing it in the power struggle gives
WORLD_TYPES.marches.ruler = { name: 'the Table of Lots', line: 'Every law in the Marches was decided by a roll at one long table.', then: { stats: { LUK: 2 } }, say: '[The Table of Lots rolls in your favour. +2 LUK.]' };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.marches = {
  roles: ['dice-caller', 'debt clerk', 'toll keeper', 'card painter', 'lot runner'],
  promises: ['pay back what the family owes', 'win the house back at the Table', 'never bet the farm again'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Table of Lots', text: 'A table a mile long, under a roof with no walls. Every law in the Marches was rolled for here.' },
    { k: 'custom', tier: 'far', name: 'The Even Throw', text: 'Once a generation the crown is rolled for. The last king won it on a seven and lost it on a two.' },
    { k: 'place', tier: 'far', name: 'The Border Stones', text: 'Each city-state ends where its last die landed. Some borders run through kitchens.' },
    { k: 'custom', tier: 'far', name: 'The Unpaid Debt', text: 'Somebody, long ago, borrowed against the whole Marches. Nobody remembers who. The interest is still being paid.' },
    { k: 'place', tier: 'city', name: 'The Counting House', text: 'Every debt in the city is written here, in ink that is never allowed to dry.' },
    { k: 'place', tier: 'city', name: 'The Dice Market', text: 'Bone, glass, iron, lead. Every die for sale is guaranteed fair, and none of them are.' },
    { k: 'custom', tier: 'city', name: 'Settling Day', text: 'Once a month every quarrel in the city goes to the dice. Lawyers starve in the Marches.' },
    { k: 'person', tier: 'city', name: 'Magistrate Oriane', text: 'Has thrown the dice on four thousand cases. Swears she has never once looked at the result first.' },
    { k: 'custom', tier: 'city', name: "The Loser's Toast", text: 'Whoever loses a big roll buys the winner a drink. Most taverns run on it.' },
    { k: 'place', tier: 'city', name: 'The Lot Bridge', text: 'Two cities rolled for who would build it. Both lost, so both built half. The halves do not quite meet.' },
    { k: 'place', tier: 'home', name: 'The family counting room', text: 'Ledgers to the ceiling, and one lucky coin nailed above the door.', near: 'over a counting room in a border town' },
    { k: 'place', tier: 'home', name: 'The corner card table', text: 'Green felt, worn to the wood where your grandmother always sat.', near: 'beside a card table in a crowded inn' },
    { k: 'person', tier: 'home', name: 'Your father Belmar', text: 'Has never lost a bet he made sober. He has never made one sober.', rel: 'father' },
    { k: 'person', tier: 'home', name: 'Your rival Pen', text: 'You have played her every week for ten years. The tally is even, and both of you cheat.', rel: 'rival' },
    // World expansion (12 Nov): 6 more each. added: 'x3' keeps them out of Pending World days before ADDED_FROM.x3
    { k: 'place', tier: 'far', name: 'The House of Even Odds', text: 'A casino where every game is fair. It has never once made money.', added: 'x3' },
    { k: 'custom', tier: 'city', name: 'Losing Gracefully', text: 'In the Marches the loser buys the drinks. Losing is very popular.', added: 'x3' },
    { k: 'person', tier: 'city', name: 'The Card Widow', text: 'Plays one hand a night against anyone. Has never lost and never kept her winnings.', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The gaming room over the bakery', text: 'The bread smelled better on winning nights. You are sure of it.', near: 'above a bakery with a gaming room', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The lucky step', text: 'Third step from the top. Everyone in your family touches it before a game.', near: 'beside a staircase with a lucky step', added: 'x3' },
    { k: 'person', tier: 'home', name: 'Your grandmother Lotta', text: 'Won her house in a game of knucklebones. Still claims she cheated.', rel: 'grandmother', added: 'x3' },
  ],
};
FINAL_GREET.dealer = '{champ}. Cut the deck. No? Then I will. The House has been expecting someone like you.';
