// ===== [World Pending Deletion] — content: System quests =====
'use strict';
// Each quest asks for a feat from feats.js (or several, all at once). count: true adds up the feat's measure across fights.
// reward: outcomes from outcomes.js, given when the quest completes.
// fate: id / people: id: a world quest, given only in a world with that Fate or People (one of each a run, on top of
// one general quest). A Fate's quest eases the Fate.
const QUESTS = {
  rival_noheal: { text: 'Defeat a rival without healing.', feat: ['rival', 'noheal'], reward: { rune: 1 }, goal: 1 },
  fast3: { text: 'Win 3 fights within 6 turns each.', feat: 'fast', reward: { gold: 8 }, goal: 3 },
  react6: { text: 'Trigger 6 reactions.', feat: 'react', count: true, reward: { piece: 'B' }, goal: 6 },
  hard2: { text: 'Beat 2 hard opponents.', feat: 'hard', reward: { heart: 1 }, goal: 2 },
  merge4: { text: 'Merge pieces 4 times.', feat: 'merge', reward: { gold: 8 }, goal: 4 },
  path5: { text: 'Have the System recognise your path by round 5.', feat: 'path', reward: { rune: 1 }, goal: 1, by: 5 },
  // hidden: revealed only when completed
  h_bankrupt: { text: 'Bankrupt: leave the shop with 0 gold.', feat: 'bankrupt', reward: { gold: 5 }, goal: 1, hidden: true },
  h_stun3: { text: 'Lightning Rod: Stun or Interrupt one opponent 3 times.', feat: 'stuns', reward: { rune: 1 }, goal: 1, hidden: true },
  h_overkill: { text: 'Overkill: finish an opponent with 30 more damage than needed.', feat: 'overkill', reward: { favour: { war: 2 } }, goal: 1, hidden: true },
  h_clutch: { text: 'Clutch: win with 10% HP or less.', feat: 'clutch', reward: { heart: 1 }, goal: 1, hidden: true },
  h_collector: { text: 'Collector: own three ★2 pieces at once.', feat: 'collector', reward: { gold: 6 }, goal: 1, hidden: true },
  // World quests (thin content audit, 6 Nov): one for each Fate and each People
  w_longnight: { fate: 'longnight', text: 'The Long Night: win 2 fights within 5 turns each.', feat: 'fast', n: 5, reward: { fate: 1 }, goal: 2 },
  w_plague: { fate: 'plague', text: 'The Grey Plague: win a fight without losing any HP.', feat: 'untouched', reward: { fate: 1 }, goal: 1 },
  w_hunger: { fate: 'hunger', text: 'The Hungry Years: leave the shop with 0 gold, twice.', feat: 'bankrupt', reward: { fate: 1 }, goal: 2 },
  w_civilwar: { fate: 'civilwar', text: 'Civil War: defeat 3 rivals.', feat: 'rival', reward: { fate: 1 }, goal: 3 },
  w_silence: { fate: 'silence', text: 'The Silence: win 2 fights without healing.', feat: 'noheal', reward: { fate: 1 }, goal: 2 },
  w_lastgen: { fate: 'lastgen', text: 'The Last Generation: win 3 fights with more than half your HP.', feat: 'healthy', reward: { fate: 1 }, goal: 3 },
  w_sundering: { fate: 'sundering', text: 'The Sundering: win a fight within 4 turns.', feat: 'fast', n: 4, reward: { fate: 1 }, goal: 1 },
  w_goldenage: { fate: 'goldenage', text: 'A Golden Age: merge pieces 3 times.', feat: 'merge', reward: { fate: 1 }, goal: 3 },
  w_temple: { people: 'temple', text: 'Temple State: finish an opponent with 20 more damage than needed.', feat: 'overkill', n: 20, reward: { rune: 1, gold: 4 }, goal: 1 },
  w_league: { people: 'league', text: 'Merchant League: own two ★2 pieces at once.', feat: 'collector', n: 2, reward: { gold: 10 }, goal: 1 },
  w_clans: { people: 'clans', text: 'The Clans: beat 2 hard opponents.', feat: 'hard', reward: { heart: 1 }, goal: 2 },
  w_archive: { people: 'archive', text: 'The Archive: have the System recognise your path by round 4.', feat: 'path', n: 4, reward: { rune: 2 }, goal: 1, by: 4 },
  w_council: { people: 'council', text: 'Free Council: Heal 50 HP in a single fight.', feat: 'healed', n: 50, reward: { piece: 'B' }, goal: 1 },
  w_crown: { people: 'crown', text: 'The Old Crown: beat an opponent one rank letter above your Entrant Rank.', feat: 'outranked', n: 1, reward: { piece: 'A' }, goal: 1 },
  w_exiles: { people: 'exiles', text: 'Exiles: land a single hit of 40 or more.', feat: 'bighit', n: 40, reward: { restore: 2 }, goal: 1 },
  w_pilgrims: { people: 'pilgrims', text: 'Pilgrims: trigger 4 reactions.', feat: 'react', count: true, reward: { gold: 6, rune: 1 }, goal: 4 },
};
