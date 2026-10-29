// ===== [World Pending Deletion] — content: Titles =====
'use strict';
// Earned for feats, kept forever. Equip one per run for a small passive. Some unlock Gifts.
const TITLES = {
  first_blood: { name: 'First Blood', cond: 'Win a fight in 2 turns or fewer.', desc: 'Your first damaging skill each fight deals 50% more.' },
  untouched: { name: 'Untouched', cond: 'Win a fight without losing any HP.', desc: 'Start each fight with 8 Block.' },
  giant_slayer: { name: 'Giant Slayer', cond: 'Beat an opponent with at least twice your max HP.', desc: '+15% damage to opponents with more max HP than you.' },
  mirror_breaker: { name: 'Mirror Breaker', cond: 'Defeat the Masked Entrant.', desc: '+8% critical chance.' },
  bloodthirsty: { name: 'Bloodthirsty', cond: 'Heal 60 HP in a single fight.', desc: 'Heal 5% of the damage you deal.' },
  spellweaver: { name: 'Spellweaver', cond: 'Use 3 Quick skills in a single turn.', desc: 'After a Quick skill, your next skill deals 10% more.' },
  high_roller: { name: 'High Roller', cond: 'Win 3 wagers in one run.', desc: 'Winning a wager pays 3 more gold.' },
  underdog: { name: 'Underdog', cond: 'Beat a hard opponent.', desc: '+10% damage to hard opponents.' },
  comeback: { name: 'Comeback Kid', cond: 'Win a fight with 10% HP or less.', desc: 'Below 25% HP, take 20% less damage.' },
  alchemist: { name: 'Alchemist', cond: 'Trigger 3 reactions in a single fight.', desc: 'Reactions are 20% stronger.' },
  executioner: { name: 'Executioner', cond: 'Land a single hit of 60 or more.', desc: 'Critical hits deal ×1.75 instead of ×1.5.' },
  tidebreaker: { name: 'Tidebreaker', cond: 'World first: defeat the Leviathan Queen.', desc: 'Start each fight with 6 Block.', first: true },
  emberfall: { name: 'Emberfall', cond: 'World first: defeat Emperor Kharros.', desc: 'Burn you apply +1.', first: true },
  bonebreaker: { name: 'Bonebreaker', cond: 'World first: defeat the Bone Saint.', desc: 'Poison you apply +1.', first: true },
  thornbane: { name: 'Thornbane', cond: 'World first: defeat the Thorn Mother.', desc: 'Bleed you apply +1.', first: true },
  skyfall: { name: 'Skyfall', cond: 'World first: defeat the Archmage Who Fell Upward.', desc: '+5% critical chance and +5% dodge.', first: true },
  forgebreaker: { name: 'Forgebreaker', cond: 'World first: defeat the Forge King.', desc: 'Always have 2 Thorns.', first: true },
  ascendant: { name: 'Ascendant', cond: 'World first: merge a piece to ★3.', desc: '+5% damage.', first: true },
  pathfinder: { name: 'Pathfinder', cond: 'World first: unlock a Hidden Path.', desc: 'Start each fight with 5 Block and heal 1 each turn.', first: true },
  unbeaten: { name: 'Unbeaten', cond: 'World first: defeat the Undefeated.', desc: '+10% damage.', first: true },
};
const FINAL_TITLE = { leviathan: 'tidebreaker', kharros: 'emberfall', bone_saint: 'bonebreaker', thorn_mother: 'thornbane', archmage: 'skyfall', forge_king: 'forgebreaker', undefeated: 'unbeaten' };
