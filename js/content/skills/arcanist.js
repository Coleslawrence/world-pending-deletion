// ===== [World Pending Deletion] — content: skills: Arcanist =====
'use strict';
sk('spark', 'Spark', ['arcanist', 'storm'], 'E', 2, { dmg: 6 }, [['arc_spark', 'Arc Spark', { dmg: 10 }], ['static_spark', 'Static Spark', { dmg: 6, weaken: 1 }]], { quick: true });
sk('focus', 'Focus', ['arcanist'], 'E', 3, { focus: 0.6 }, [['deep_focus', 'Deep Focus', { focus: 1 }], ['spellweave', 'Spellweave', { focus: 0.5, haste: 1 }]], { quick: true });
sk('mana_shield', 'Mana Shield', ['arcanist', 'bastion'], 'E', 3, { block: 12 }, [['arcane_ward', 'Arcane Ward', { block: 20 }], ['retort_ward', 'Retort Ward', { block: 10, thorns: 6 }]]);
sk('frost_lance', 'Frost Lance', ['arcanist'], 'E', 2, { dmg: 11, weaken: 2 }, [['glacial_spear', 'Glacial Spear', { dmg: 15, weaken: 2 }], ['deep_freeze', 'Deep Freeze', { dmg: 8, stun: 1 }, 4]]);
sk('arcane_missiles', 'Arcane Missiles', ['arcanist'], 'D', 2, { dmg: 3, hits: 4, pierce: 1 }, [['arcane_barrage', 'Arcane Barrage', { dmg: 3, hits: 6, pierce: 1 }], ['mana_lance', 'Mana Lance', { dmg: 16, pierce: 1 }]]);
sk('counterspell', 'Counterspell', ['arcanist', 'storm'], 'C', 3, { dmg: 7, interrupt: 1 }, [['nullify', 'Nullify', { dmg: 12, interrupt: 1 }], ['spell_theft', 'Spell Theft', { dmg: 7, interrupt: 1, empower: 2 }]]);
sk('siphon', 'Siphon', ['arcanist'], 'C', 3, { siphon: 1 }, [['soul_siphon', 'Soul Siphon', { siphon: 1, heal: 5 }], ['hex_siphon', 'Hex Siphon', { siphon: 1, weaken: 1 }]], { quick: true });
sk('time_warp', 'Time Warp', ['arcanist'], 'B', 6, { haste: 2 }, [['haste', 'Haste', { haste: 3 }], ['chrono_loop', 'Chrono Loop', { haste: 2 }, 4]], { quick: true });
sk('cataclysm', 'Arcane Cataclysm', ['arcanist'], 'A', 4, { dmg: 24, pierce: 1 }, [['singularity', 'Singularity', { dmg: 34, pierce: 1 }], ['starfall', 'Starfall', { dmg: 8, hits: 4, pierce: 1 }]]);
flav({
  spark: "The first spell every apprentice learns, and the last one they forget.",
  arc_spark: "The spark jumps the gap before you have finished pointing.",
  static_spark: "It leaves their hair on end and their arms heavy.",
  focus: "You go quiet. The arena slows down around you.",
  deep_focus: "For one breath, you can hear every thought you have.",
  spellweave: "Two spells, one gesture. Your teachers called it showing off.",
  mana_shield: "A pane of pale light, humming like struck glass.",
  arcane_ward: "The glyphs lock together until the light turns solid.",
  retort_ward: "The ward has opinions about being hit, and shares them.",
  frost_lance: "A spear of winter, thrown hard enough to keep its edge.",
  glacial_spear: "It is still cold when the healers pull it out.",
  deep_freeze: "They stop moving. Their breath hangs in the air.",
  arcane_missiles: "Small bolts that curve round shields as if shields were rumours.",
  arcane_barrage: "You stopped counting the bolts. So did they.",
  mana_lance: "Every missile you know, folded into one bright line.",
  counterspell: "A word spoken backwards, at exactly the wrong moment for them.",
  nullify: "Their spell comes apart in their hands like wet paper.",
  spell_theft: "You catch their magic in mid-air and keep it.",
  siphon: "You reach across the arena and take something they were using.",
  soul_siphon: "What you take comes back warm.",
  hex_siphon: "You take their strength and leave a curse as a receipt.",
  time_warp: "The sand in the arena clock runs upward for a moment.",
  haste: "Everyone else moves through honey. You do not.",
  chrono_loop: "You have done this before. You will do it again shortly.",
  cataclysm: "The mages of the Sky Reaches banned this one. Twice.",
  singularity: "A point of nothing, very hungry, very briefly.",
  starfall: "You ask the night sky for help. It answers in pieces.",
});
