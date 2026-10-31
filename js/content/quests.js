// ===== [World Pending Deletion] — content: System quests =====
'use strict';
// Each quest asks for a feat from feats.js (or several, all at once). count: true adds up the feat's measure across fights.
const QUESTS = {
  rival_noheal: { text: 'Defeat a rival without healing.', feat: ['rival', 'noheal'], reward: 'rune', goal: 1 },
  fast3: { text: 'Win 3 fights within 6 turns each.', feat: 'fast', reward: 'gold8', goal: 3 },
  react6: { text: 'Trigger 6 reactions.', feat: 'react', count: true, reward: 'piece', goal: 6 },
  hard2: { text: 'Beat 2 hard opponents.', feat: 'hard', reward: 'heart', goal: 2 },
  merge4: { text: 'Merge pieces 4 times.', feat: 'merge', reward: 'gold8', goal: 4 },
  path5: { text: 'Have the System recognise your path by round 5.', feat: 'path', reward: 'rune', goal: 1, by: 5 },
  // hidden: revealed only when completed
  h_bankrupt: { text: 'Bankrupt: leave the shop with 0 gold.', feat: 'bankrupt', reward: 'gold5', goal: 1, hidden: true },
  h_stun3: { text: 'Lightning Rod: Stun or Interrupt one opponent 3 times.', feat: 'stuns', reward: 'rune', goal: 1, hidden: true },
  h_overkill: { text: 'Overkill: finish an opponent with 30 more damage than needed.', feat: 'overkill', reward: 'favour', goal: 1, hidden: true },
  h_clutch: { text: 'Clutch: win with 10% HP or less.', feat: 'clutch', reward: 'heart', goal: 1, hidden: true },
  h_collector: { text: 'Collector: own three ★2 pieces at once.', feat: 'collector', reward: 'gold6', goal: 1, hidden: true },
};
const QUEST_REWARD = { rune: 'a rune', gold5: '5 gold', gold6: '6 gold', gold8: '8 gold', piece: 'a free B-rank piece', heart: '+1 max Heart', favour: '2 Favour with the God of War' };
