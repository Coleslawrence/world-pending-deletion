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
