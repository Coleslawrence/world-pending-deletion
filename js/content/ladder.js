// ===== [World Pending Deletion] — content: the difficulty ladder (Priority, Challenge worlds, Marks of mastery) =====
'use strict';
// Priority: an opt-in difficulty ladder on top of world rank. Level N has the rules of levels 1 to N. Sparing a world at
// your highest open level opens the next. Each level pays 10% more Echoes. Not in Pending World or practice.
// Rule fields (core.js, amendOf): foeHp / foeDmg / finalHp / finalDmg multiply; income, heartCut (negative costs more),
// traitUp, healCut (share of max HP off the heal after a win), rerollUp add; erase: Hearts your world starts down.
const PRIORITY = [
  { name: 'Scrutiny', say: 'Opponents have 8% more HP.', foeHp: 1.08 },
  { name: 'Short File', say: 'Your world starts 1 Heart down.', erase: 1 },
  { name: 'Sharpened', say: 'Opponents deal 8% more damage.', foeDmg: 1.08 },
  { name: 'Withheld', say: 'Income is 1 gold lower every round.', income: -1 },
  { name: 'Seeded Field', say: 'Monsters and rivals carry one more trait.', traitUp: 1 },
  { name: 'Short Rest', say: 'You heal 20% after a win, not 30%.', healCut: 0.1 },
  { name: 'Surcharge', say: 'Shop rerolls cost 1 gold more.', rerollUp: 1 },
  { name: 'No Appeals', say: 'A lost fight costs 1 more Heart.', heartCut: -1 },
  { name: 'Full Attention', say: 'Opponents have 10% more HP and deal 10% more damage.', foeHp: 1.1, foeDmg: 1.1 },
  { name: 'Personal Interest', say: 'The Final Champion has 25% more HP and deals 15% more damage.', finalHp: 1.25, finalDmg: 1.15 },
];
const PRIORITY_ECHO = 0.1;
// Challenge worlds: one fixed twist for the whole run, chosen on the world screen once you have spared a world.
// The first time you spare a world under each, it pays CHALLENGE_ECHOES and a Mark.
//   rule fields as above, plus: gold (starting gold), winGold, archs (how many archetypes the pool keeps)
const CHALLENGES = {
  glass: { name: 'Glass World', say: 'Your world starts with 5 Hearts.', erase: 5, flavour: '[Filed as fragile. Handled accordingly.]' },
  austerity: { name: 'Austerity', say: 'No base income. Every win pays 4 more gold.', income: -5, winGold: 4, flavour: '[The broadcast budget has been reviewed. You are the saving.]' },
  two_schools: { name: 'Two Disciplines', say: 'Only your home archetype and one ally are in the pool.', archs: 2, flavour: '[The other instructors were not renewed.]' },
  crowded: { name: 'Crowded Card', say: 'Monsters and rivals carry 2 more traits. You start with 10 more gold.', traitUp: 2, gold: 10, flavour: '[Everyone on the card has something extra. You have a stipend.]' },
  sudden: { name: 'Sudden Death Rules', say: 'Opponents have 30% less HP and deal 30% more damage. A lost fight costs 1 more Heart.', foeHp: 0.7, foeDmg: 1.3, heartCut: -1, flavour: '[Shorter bouts were requested. Nobody asked by whom.]' },
};
const CHALLENGE_ECHOES = 25;
// Marks of mastery: a mark on each archetype and world type you have spared a world with, graded by the Priority it was
// done at. v is that Priority + 1 (0: no mark). MARK_TIERS: the lowest v for each grade, highest first.
const MARK_TIERS = [{ at: 11, name: 'Black', k: 'black' }, { at: 8, name: 'Platinum', k: 'plat' }, { at: 5, name: 'Gold', k: 'gold' }, { at: 2, name: 'Silver', k: 'silver' }, { at: 1, name: 'Bronze', k: 'bronze' }];
// Past the Undefeated: each Depth is the Undefeated again, DEPTH_SCALE stronger per Depth, with up to DEPTH_TRAITS traits
const DEPTH_SCALE = 0.2, DEPTH_TRAITS = 3;
