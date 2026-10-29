// ===== [World Pending Deletion] — content: skills: Bladedancer =====
'use strict';
sk('quick_slash', 'Quick Slash', ['blade'], 'E', 1, { dmg: 5, hits: 2 }, [['flurry', 'Flurry of Blades', { dmg: 5, hits: 3 }], ['bleeding_edge', 'Bleeding Edge', { dmg: 4, hits: 2, bleed: 2, perHit: 1 }]]);
sk('lacerate', 'Lacerate', ['blade'], 'E', 2, { dmg: 4, bleed: 5 }, [['gash', 'Gash', { dmg: 4, bleed: 9 }], ['serrated_strike', 'Serrated Strike', { dmg: 9, bleed: 5 }]]);
sk('smoke_bomb', 'Smoke Bomb', ['blade', 'arcanist'], 'E', 4, { evade: 1 }, [['vanish', 'Vanish', { evade: 2 }], ['caltrops', 'Caltrops', { evade: 1, bleed: 4 }]], { quick: true });
sk('fan_of_knives', 'Fan of Knives', ['blade'], 'D', 3, { dmg: 4, hits: 4 }, [['blade_storm', 'Blade Storm', { dmg: 4, hits: 6 }], ['poisoned_knives', 'Poisoned Knives', { dmg: 3, hits: 4, poison: 1, perHit: 1 }]]);
sk('precise_strike', 'Precise Strike', ['blade'], 'D', 2, { dmg: 11, critBonus: 0.5 }, [['vital_strike', 'Vital Strike', { dmg: 12, alwaysCrit: 1 }], ['heartseeker', 'Heartseeker', { dmg: 15, pierce: 1 }]]);
sk('mark_prey', 'Mark Prey', ['blade'], 'C', 3, { mark: 2 }, [['hunters_mark', "Hunter's Mark", { mark: 3 }], ['deadly_mark', 'Deadly Mark', { mark: 2, nextCrit: 1 }]], { quick: true });
sk('assassinate', 'Assassinate', ['blade', 'reaper'], 'B', 3, { dmg: 12, cruel: 2 }, [['death_blossom', 'Death Blossom', { dmg: 8, hits: 2, cruel: 2 }], ['coup_de_grace', 'Coup de Grace', { dmg: 16, cruel: 2.5 }]]);
sk('thousand_cuts', 'Thousand Cuts', ['blade'], 'A', 4, { dmg: 3, hits: 6, bleed: 1, perHit: 1 }, [['dance_of_death', 'Dance of Death', { dmg: 4, hits: 7, bleed: 1, perHit: 1 }], ['crimson_tempest', 'Crimson Tempest', { dmg: 3, hits: 6, bleed: 2, perHit: 1 }]]);
