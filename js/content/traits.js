// ===== [World Pending Deletion] — content: the trait pool =====
// Monsters and rivals roll traits from this pool when they are offered as opponents, so the choice screen shows them.
// TRAIT_COUNT[round - 1] is how many each gets (the final, Elite bracket, erased champions and Rank Trials get none).
// A trait gives enemy passives and/or enemy traits (docs/CONTENT.md, "Enemy traits, passives and phases"); desc is the
// player's reading of it, so keep it to what the trait does.
// glitch: a glitched trait (the opponent's own data has gone wrong). Never in the normal draw: where glitches are on
// (never Pending World except on glitch day), an opponent with traits sometimes has its last one swapped for a
// glitched one (GLITCH_TRAIT in core.js). Their names carry one corrupted letter.
// world: a world type's own trait (one each). Never in the normal draw either: in a world of that type, an opponent
// with traits sometimes has its first one swapped for its world's trait (WORLD_TRAIT in core.js), so opponents feel local.
'use strict';
const TRAIT_POOL = {
  spiked: { name: 'Spiked', desc: 'Hits back, double below half HP.', passives: { thornsAlways: 2 } },
  armoured: { name: 'Armoured', desc: 'Takes 2 less damage from every hit.', passives: { flatDR: 2 } },
  regenerating: { name: 'Regenerating', desc: 'Heals a little every turn.', passives: { regen: 3 } },
  savage: { name: 'Savage', desc: 'Deals 20% more damage.', passives: { dmgPct: 0.2 } },
  frenzied: { name: 'Frenzied', desc: 'Below half HP, deals 40% more damage.', traits: { enrage: 0.5, enrageMult: 1.4 } },
  elusive: { name: 'Elusive', desc: 'Dodges some attacks.', traits: { dodge: 0.12 } },
  smouldering: { name: 'Smouldering', desc: 'Burns you every turn.', traits: { aura: 1.5 } },
  barbed: { name: 'Barbed', desc: 'Makes you Bleed every turn.', traits: { briar: 1 } },
  leeching: { name: 'Leeching', desc: 'Heals from the damage it deals.', passives: { lifesteal: 0.25 } },
  braced: { name: 'Braced', desc: 'Starts the fight with Block.', passives: { startBlockPct: 0.15 } },
  // World traits, one per world type (thin content audit, 6 Nov)
  tidal: { name: 'Tidal', desc: 'Floods every 4th turn: less Block is Weakened.', world: 'drowned', traits: { flood: 4 } },
  cinderskin: { name: 'Cinderskin', desc: 'Hits back, double below half HP. Burns too.', world: 'burning', passives: { thornsAlways: 1, thornBurn: 2 } },
  unquiet: { name: 'Unquiet', desc: 'Rises once more at 15% HP.', world: 'hollow', traits: { revive: 0.15 } },
  wildgrown: { name: 'Wildgrown', desc: 'Dodges some attacks. Heals a little each turn.', world: 'verdant', traits: { dodge: 0.08 }, passives: { regen: 2 } },
  spellbound: { name: 'Spellbound', desc: 'Uses its move twice every 4th turn.', world: 'sky', traits: { twincast: 4 } },
  ironclad: { name: 'Ironclad', desc: 'Its Block never fades, and grows each turn.', world: 'iron', traits: { forge: 2 } },
  galedriven: { name: 'Gale-Driven', desc: 'Below 75% HP, deals 25% more damage.', world: 'steppes', traits: { enrage: 0.75, enrageMult: 1.25 } },
  tellreader: { name: 'Tell-Reader', desc: 'Resists the skill you use most, by 25%.', world: 'marches', traits: { adapt: 0.75 } },
  gleaner: { name: 'Gleaner', desc: 'Hits you 30% harder below half HP.', world: 'vales', passives: { vsHalf: 0.3 } },
  omenread: { name: 'Omen-Read', desc: 'Hard to jinx, hits harder; shows two moves.', world: 'fens', traits: { showNext: 1, jinxTax: 2 }, passives: { dmgPct: 0.15 } },
  // Glitched traits
  replicated: { name: 'Repl̷icated', desc: 'Comes back once at 30% HP.', glitch: true, traits: { revive: 0.3 } },
  desynced: { name: 'Desy̷nced', desc: 'Uses its move twice every 3 turns.', glitch: true, traits: { twincast: 3 } },
  corrupted: { name: 'Corr̷upted', desc: 'Deals 30% more damage and heals from it.', glitch: true, passives: { dmgPct: 0.3, lifesteal: 0.15 } },
  clipping: { name: 'Cl̷ipping', desc: 'Dodges a quarter of attacks.', glitch: true, traits: { dodge: 0.25 } },
};
const TRAIT_COUNT = [0, 0, 1, 1, 1, 1, 1];
