// ===== [World Pending Deletion] — content: world pack: Crooked Fens =====
'use strict';
WORLD_TYPES.fens = { name: 'Crooked Fens', flavour: 'Marsh towns where every road bends back.', home: 'jinx', guest: 'reaper', gift: 'nearmiss', final: 'augur', names: [['Fen', 'Gloam', 'Mur', 'Hag', 'Crow', 'Sk', 'Bog', 'Wick', 'Ash', 'Dre'], ['mire', 'wick', 'holm', 'ley', 'gate', 'sorrow', 'bottom', 'end', 'moss', 'fall']], mids: ['e', 'en', 'ow'], champs: ['Agnes', 'Tobin', 'Morwen', 'Fitch', 'Hester', 'Corwin', 'Ada', 'Bram', 'Cissy', 'Dunstan', 'Edda', 'Godric', 'Hob', 'Isolde', 'Jory', 'Maud', 'Ned', 'Osric', 'Prue', 'Wat'] };
// ruler: the old power a clashing People contradicts (PEOPLES[x].clash), and what backing it in the power struggle gives
WORLD_TYPES.fens.ruler = { name: 'the Reed Wardens', line: 'The Wardens decide which roads are safe. They change their minds nightly.', then: { always: { foe: { weaken: 1 } } }, say: '[The Reed Wardens send the bad roads to your opponents. Every opponent starts Weakened.]' };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.fens = {
  roles: ['reed cutter', 'omen reader', 'causeway keeper', 'eel trapper', 'lantern boy'],
  promises: ['find the road that goes straight home', 'lift the family curse', 'outlive the omen'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Drowned Steeple', text: 'Only the top of the church shows above the marsh. Its bell still rings when somebody is about to be unlucky.' },
    { k: 'custom', tier: 'far', name: 'The Crooked Road', text: 'The first road across the Fens was built straight. The marsh bent it back overnight. Nobody has tried since.' },
    { k: 'place', tier: 'far', name: 'The Gallows Oak', text: 'A tree that grew around an old gallows. The crows will not land on it, and neither will anything else.' },
    { k: 'custom', tier: 'far', name: 'The Long Curse', text: 'Every family in the Fens carries a curse. Saying whose is worse is the oldest game in the marsh.' },
    { k: 'place', tier: 'city', name: 'The Causeway Market', text: 'Held on planks over black water. Anything dropped is gone, and the stalls sell a lot of rope.' },
    { k: 'place', tier: 'city', name: 'The Hall of Omens', text: 'Every bad sign ever seen in the Fens is written on its walls. They ran out of wall in the last century.' },
    { k: 'custom', tier: 'city', name: 'Salt Night', text: 'Once a year the whole town throws salt over its shoulder at midnight. The marsh is very salty.' },
    { k: 'person', tier: 'city', name: 'Old Mother Gloam', text: 'Reads omens for a copper. She has never once read a good one, and the queue is always long.' },
    { k: 'custom', tier: 'city', name: 'Thirteen Steps', text: 'No staircase in the Fens has thirteen steps. Builders add a fourteenth, or stop at twelve and climb.' },
    { k: 'place', tier: 'city', name: 'The Lantern Path', text: 'Lanterns on poles mark the safe way through the bog. Someone keeps moving them.' },
    { k: 'place', tier: 'home', name: 'The house on stilts', text: 'It leans a little further every spring. Your family calls it character.', near: 'in a house on stilts above the marsh' },
    { k: 'place', tier: 'home', name: 'The horseshoe door', text: 'Your mother nailed a horseshoe over it the right way up. It fell down the wrong way up.', near: 'behind a door with a fallen horseshoe' },
    { k: 'person', tier: 'home', name: 'Your aunt Hester', text: 'Has broken eleven mirrors and claims to be due a twelfth. Nobody lets her near glass.', rel: 'aunt' },
    { k: 'person', tier: 'home', name: 'Your rival Fitch', text: 'You both claim the worse luck. You have been arguing about it since you could talk.', rel: 'rival' },
    // World expansion (12 Nov): 6 more each. added: 'x3' keeps them out of Pending World days before ADDED_FROM.x3
    { k: 'place', tier: 'far', name: 'The Bog Bell', text: 'A bell rings under the marsh every new moon. Nobody has found where.', added: 'x3' },
    { k: 'custom', tier: 'city', name: 'Spitting on Coins', text: 'Every coin is spat on before spending, to wash off the last owner\'s luck.', added: 'x3' },
    { k: 'person', tier: 'city', name: 'The Ferryman Pike', text: 'Will row anyone anywhere in the Fens. The fare depends on how lucky you look.', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The willow over the well', text: 'Its roots drink from the family well. The water tastes of rain.', near: 'under the willow by the well', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The cracked mirror', text: 'Your father broke it before you were born. Nobody has dared to throw it out.', near: 'behind a cracked mirror nobody will move', added: 'x3' },
    { k: 'person', tier: 'home', name: 'Your little brother Wat', text: 'Was born on the thirteenth. Has been lucky every day since, to spite it.', rel: 'brother', added: 'x3' },
  ],
};
FINAL_GREET.augur = '{champ}. I read your ending this morning. It was very good. For me.';
