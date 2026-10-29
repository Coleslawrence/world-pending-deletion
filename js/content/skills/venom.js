// ===== [World Pending Deletion] — content: skills: Venom =====
'use strict';
sk('venom_blade', 'Venom Blade', ['venom', 'blade'], 'E', 1, { dmg: 5, poison: 2 }, [['viper_fang', 'Viper Fang', { dmg: 7, poison: 4 }], ['toxic_flurry', 'Toxic Flurry', { dmg: 3, hits: 3, poison: 1, perHit: 1 }]]);
sk('hex', 'Hex', ['venom', 'storm'], 'E', 2, { weaken: 2, poison: 2 }, [['curse_of_frailty', 'Curse of Frailty', { weaken: 3, poison: 4 }], ['wither', 'Wither', { weaken: 2, poison: 2, drainPoison: 1 }]]);
sk('drain_life', 'Drain Life', ['venom', 'reaper'], 'E', 2, { dmg: 8, lifesteal: 0.5 }, [['soul_drain', 'Soul Drain', { dmg: 12, lifesteal: 0.6 }], ['blood_pact', 'Blood Pact', { dmg: 8, lifesteal: 1 }]]);
sk('plague_cloud', 'Plague Cloud', ['venom'], 'D', 3, { poison: 6 }, [['pestilence', 'Pestilence', { poison: 10 }], ['rot', 'Rot', { poison: 6, bleed: 4 }]]);
sk('malice', 'Malice', ['venom'], 'D', 1, { dmg: 4, malice: 3 }, [['spite', 'Spite', { dmg: 4, malice: 5 }], ['torment', 'Torment', { dmg: 6, malice: 3, weaken: 1 }]]);
sk('leech', 'Leech', ['venom', 'reaper'], 'C', 3, { leech: 3 }, [['blood_leech', 'Blood Leech', { leech: 6 }], ['parasite', 'Parasite', { leech: 3, poison: 3 }]]);
sk('toxic_needles', 'Thousand Needles', ['venom'], 'B', 3, { poison: 4, doublePoison: 1 }, [['venom_storm', 'Venom Storm', { poison: 6, doublePoison: 1 }], ['needle_rain', 'Needle Rain', { dmg: 3, hits: 3, poison: 5, doublePoison: 1 }]]);
