// ===== [World Pending Deletion] — content: Unfiled designs =====
'use strict';
// Pieces the System never filed. Each sits between two archetypes and joins the pool of both, once filed. A design is
// found by beating a Gatekeeper (DESIGN_CHANCE, or certainly after DESIGN_DRY runs without one), kept even if the run is
// lost, and filed in the Archive for Echoes (DESIGN_COST by rank). Pending World and practice runs never use them.
// Skills and gear here are ordinary pieces with design: true; core.js keeps them out of runs until they are filed.
const DESIGN_CHANCE = 1 / 3, DESIGN_DRY = 2;
const DESIGN_COST = { E: 15, D: 15, C: 15, B: 25, A: 35 };
sk('miasma', 'Miasma', ['venom', 'storm'], 'D', 2, { poison: 3, weaken: 2 }, [['choking_miasma', 'Choking Miasma', { poison: 5, weaken: 2 }], ['charged_miasma', 'Charged Miasma', { poison: 3, weaken: 2, stunIfWeak: 1 }, 4], ['still_air', 'Still Air', { poison: 3, weaken: 3 }]], { design: true });
sk('feint_and_cut', 'Feint and Cut', ['blade', 'arcanist'], 'D', 3, { dmg: 4, hits: 2 }, [['double_feint', 'Double Feint', { dmg: 4, hits: 3 }], ['bleeding_feint', 'Bleeding Feint', { dmg: 4, hits: 2, bleed: 2, perHit: 1 }], ['vanishing_feint', 'Vanishing Feint', { dmg: 4, hits: 2, evade: 1 }]], { quick: true, design: true });
sk('searing_mercy', 'Searing Mercy', ['zealot', 'pyre'], 'C', 3, { quench: 12 }, [['merciful_flame', 'Merciful Flame', { quench: 18 }], ['last_light', 'Last Light', { quench: 12, block: 6 }], ['purging_mercy', 'Purging Mercy', { quench: 12, cleanse: 1 }]], { design: true });
sk('blood_price', 'Blood Price', ['venom', 'reaper'], 'C', 3, { selfDmg: 5, poison: 6, grim: 1 }, [['dear_price', 'Dear Price', { selfDmg: 5, poison: 9, grim: 1 }], ['paid_in_full', 'Paid in Full', { selfDmg: 5, poison: 6, grim: 1, lifesteal: 0.3, dmg: 6 }], ['debt_collector', 'Debt Collector', { selfDmg: 5, poison: 6, grim: 1, weaken: 1 }]], { design: true });
sk('vow_of_iron', 'Vow of Iron', ['bastion', 'zealot'], 'B', 4, { block: 10, vowHeal: 0.5 }, [['oath_of_iron', 'Oath of Iron', { block: 15, vowHeal: 0.5 }], ['iron_and_light', 'Iron and Light', { block: 10, vowHeal: 0.8 }], ['iron_thorns', 'Iron Thorns', { block: 10, vowHeal: 0.5, thorns: 6 }]], { design: true });
flav({
  miasma: "[Air quality in the arena: under review.]",
  choking_miasma: "Thick enough to lean on. Nobody wants to.",
  charged_miasma: "The fog crackles. Whoever is slowest feels it most.",
  still_air: "No wind at all. It settles and stays.",
  feint_and_cut: "The hand they watched was never the one with the knife.",
  double_feint: "Three lies, one after another, every one of them sharp.",
  bleeding_feint: "A trick, and then a cut where the trick was looking.",
  vanishing_feint: "You cut, and while they answer, you are elsewhere.",
  searing_mercy: "The fire comes off them and into your wounds. Both are grateful.",
  merciful_flame: "A lot of fire, very gently taken back.",
  last_light: "What is left of the blaze hardens around you.",
  purging_mercy: "Their burns and yours, both gone. Only one of you asked.",
  blood_price: "[Payment received in advance. The goods are on their way.]",
  dear_price: "It costs the same. You simply get more for it.",
  paid_in_full: "You pay in blood and take the change in theirs.",
  debt_collector: "It arrives late, and it arrives with friends.",
  vow_of_iron: "Sworn to the wall. The wall keeps its side.",
  oath_of_iron: "Thicker plates, and a longer promise.",
  iron_and_light: "Whatever the iron holds back, the light gives back.",
  iron_thorns: "A vow with spikes on, for the doubters.",
});
Object.assign(GEAR, {
  smelters_apron: { name: "Smelter's Apron", slot: 'armour', tags: ['pyre', 'bastion'], rank: 'D', design: true, stats: { VIT: 2, INT: 1 }, pas: { burnBlock: 2 }, top: { burnPlus: 1 }, text: v => `Gain ${v.burnBlock} Block each time Burn on your opponent deals damage.`, flavour: "Leather a finger thick, scorched in rings. It has seen worse than you." },
  grounding_mail: { name: 'Grounding Mail', slot: 'armour', tags: ['bastion', 'storm'], rank: 'D', design: true, stats: { VIT: 2, STR: 1 }, pas: {}, fix: { blockWeaken: 1 }, top: { stunDmg: 4 }, text: () => 'When your Block stops a whole hit, the attacker is Weakened for 1 turn.', flavour: "Every link touches the ground. The lightning goes somewhere else." },
  bloodletter: { name: 'Bloodletter', slot: 'weapon', tags: ['blade', 'reaper'], rank: 'C', design: true, stats: { AGI: 2, STR: 2 }, pas: { vsBleed: 0.15 }, top: { bleedPlus: 1 }, text: v => `+${pct(v.vsBleed)} damage to bleeding opponents.`, flavour: "A surgeon's lancet, grown up and gone bad." },
  hexed_dice: { name: 'Hexed Dice', slot: 'accessory', tags: ['dicer', 'jinx'], rank: 'C', design: true, stats: { LUK: 3 }, pas: { sixMisf: 2 }, top: { rerolls: 1 }, text: v => `A die that rolls 6 adds ${v.sixMisf} Misfortune to your opponent.`, flavour: "Lucky for you. You are not the one who has to watch them land." },
  stormglass: { name: 'Stormglass', slot: 'accessory', tags: ['arcanist', 'storm'], rank: 'C', design: true, stats: { INT: 2, STR: 1 }, pas: { stunDmg: 6 }, fix: { firstFree: 1 }, top: { quickStun: 0.1 }, text: v => `Your first skill each fight has no cooldown. Your Stuns and Interrupts deal ${v.stunDmg} damage.`, flavour: "Sealed glass with weather inside. It clouds over before a fight." },
});
