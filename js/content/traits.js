// ===== [World Pending Deletion] — content: the trait pool =====
// Monsters and rivals roll traits from this pool when they are offered as opponents, so the choice screen shows them.
// TRAIT_COUNT[round - 1] is how many each gets (the final, Elite bracket, erased champions and Rank Trials get none).
// A trait gives enemy passives and/or enemy traits (docs/CONTENT.md, "Enemy traits, passives and phases"); desc is the
// player's reading of it, so keep it to what the trait does.
'use strict';
const TRAIT_POOL = {
  spiked: { name: 'Spiked', desc: 'Hitting it hurts you back.', passives: { thornsAlways: 2 } },
  armoured: { name: 'Armoured', desc: 'Takes 2 less damage from every hit.', passives: { flatDR: 2 } },
  regenerating: { name: 'Regenerating', desc: 'Heals a little every turn.', passives: { regen: 3 } },
  savage: { name: 'Savage', desc: 'Deals 20% more damage.', passives: { dmgPct: 0.2 } },
  frenzied: { name: 'Frenzied', desc: 'Below half HP, deals 40% more damage.', traits: { enrage: 0.5, enrageMult: 1.4 } },
  elusive: { name: 'Elusive', desc: 'Dodges some attacks.', traits: { dodge: 0.12 } },
  smouldering: { name: 'Smouldering', desc: 'Burns you every turn.', traits: { aura: 1.5 } },
  barbed: { name: 'Barbed', desc: 'Makes you Bleed every turn.', traits: { briar: 1 } },
  leeching: { name: 'Leeching', desc: 'Heals from the damage it deals.', passives: { lifesteal: 0.25 } },
  braced: { name: 'Braced', desc: 'Starts the fight with Block.', passives: { startBlockPct: 0.15 } },
};
const TRAIT_COUNT = [0, 0, 1, 1, 1, 1, 1];
