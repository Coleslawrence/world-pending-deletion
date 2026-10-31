// ===== [World Pending Deletion] — content: Titles =====
'use strict';
// Earned for feats, kept forever. Equip one per run for a small passive. Some unlock Gifts.
// p: what the passive does, as effects from effects.js. A Title whose passive isn't an effect yet (High Roller) is read in core.js.
const TITLES = {
  first_blood: { name: 'First Blood', cond: 'Win a fight in 2 turns or fewer.', desc: 'Your first damaging skill each fight deals 50% more.', p: { firstHit: 0.5 } },
  untouched: { name: 'Untouched', cond: 'Win a fight without losing any HP.', desc: 'Start each fight with 8 Block.', p: { startBlock: 8 } },
  giant_slayer: { name: 'Giant Slayer', cond: 'Beat an opponent with at least twice your max HP.', desc: '+15% damage to opponents with more max HP than you.', p: { vsBigger: 0.15 } },
  mirror_breaker: { name: 'Mirror Breaker', cond: 'Defeat the Masked Entrant.', desc: '+8% critical chance.', p: { critBonus: 0.08 } },
  bloodthirsty: { name: 'Bloodthirsty', cond: 'Heal 60 HP in a single fight.', desc: 'Heal 5% of the damage you deal.', p: { lifesteal: 0.05 } },
  spellweaver: { name: 'Spellweaver', cond: 'Use 3 Quick skills in a single turn.', desc: 'After a Quick skill, your next skill deals 10% more.', p: { afterQuick: 0.1 } },
  high_roller: { name: 'High Roller', cond: 'Win 3 wagers in one run.', desc: 'Winning a wager pays 3 more gold.' },
  underdog: { name: 'Underdog', cond: 'Beat a hard opponent.', desc: '+10% damage to hard opponents.', p: { vsHard: 0.1 } },
  rank_is_just_a_letter: { name: 'Rank Is Just a Letter', cond: 'Beat an opponent two rank letters above your Entrant Rank.', desc: '+10% damage to opponents of a higher rank than you.', p: { vsHigherRank: 0.1 } },
  comeback: { name: 'Comeback Kid', cond: 'Win a fight with 10% HP or less.', desc: 'Below 25% HP, take 20% less damage.', p: { lowDR: 0.2 } },
  alchemist: { name: 'Alchemist', cond: 'Trigger 3 reactions in a single fight.', desc: 'Reactions are 20% stronger.', p: { reactMult: 1.2 } },
  executioner: { name: 'Executioner', cond: 'Land a single hit of 60 or more.', desc: 'Critical hits deal ×1.75 instead of ×1.5.', p: { critMult: 1.75 } },
  tidebreaker: { name: 'Tidebreaker', cond: 'World first: defeat the Leviathan Queen.', desc: 'Start each fight with 6 Block.', first: true, p: { startBlock: 6 } },
  emberfall: { name: 'Emberfall', cond: 'World first: defeat Emperor Kharros.', desc: 'Burn you apply +1.', first: true, p: { burnPlus: 1 } },
  bonebreaker: { name: 'Bonebreaker', cond: 'World first: defeat the Bone Saint.', desc: 'Poison you apply +1.', first: true, p: { poisonPlus: 1 } },
  thornbane: { name: 'Thornbane', cond: 'World first: defeat the Thorn Mother.', desc: 'Bleed you apply +1.', first: true, p: { bleedPlus: 1 } },
  skyfall: { name: 'Skyfall', cond: 'World first: defeat the Archmage Who Fell Upward.', desc: '+5% critical chance and +5% dodge.', first: true, p: { critBonus: 0.05, dodge: 0.05 } },
  forgebreaker: { name: 'Forgebreaker', cond: 'World first: defeat the Forge King.', desc: 'Always have 2 Thorns, doubled below half HP.', first: true, p: { thornsAlways: 2 } },
  ascendant: { name: 'Ascendant', cond: 'World first: merge a piece to ★3.', desc: '+5% damage.', first: true, p: { dmgPct: 0.05 } },
  pathfinder: { name: 'Pathfinder', cond: 'World first: unlock a Hidden Path.', desc: 'Start each fight with 5 Block and heal 1 each turn.', first: true, p: { startBlock: 5, regen: 1 } },
  unbeaten: { name: 'Unbeaten', cond: 'World first: defeat the Undefeated.', desc: '+10% damage.', first: true, p: { dmgPct: 0.1 } },
};
const FINAL_TITLE = { leviathan: 'tidebreaker', kharros: 'emberfall', bone_saint: 'bonebreaker', thorn_mother: 'thornbane', archmage: 'skyfall', forge_king: 'forgebreaker', undefeated: 'unbeaten' };
