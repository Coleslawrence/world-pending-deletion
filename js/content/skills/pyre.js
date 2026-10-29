// ===== [World Pending Deletion] — content: skills: Pyre =====
'use strict';
sk('firebolt', 'Firebolt', ['pyre'], 'E', 1, { dmg: 7, burn: 4 }, [['fireball', 'Fireball', { dmg: 12, burn: 6 }], ['fire_rain', 'Fire Rain', { dmg: 3, hits: 4, burn: 2, perHit: 1 }]]);
sk('ember_ward', 'Ember Ward', ['pyre', 'bastion'], 'E', 3, { block: 8, burn: 4 }, [['fire_wall', 'Fire Wall', { block: 13, burn: 6 }], ['blazing_aegis', 'Blazing Aegis', { block: 8, burn: 3, thorns: 6 }]]);
sk('flame_wave', 'Flame Wave', ['pyre', 'blade'], 'D', 2, { dmg: 4, hits: 2, burn: 2, perHit: 1 }, [['inferno_wave', 'Inferno Wave', { dmg: 4, hits: 3, burn: 2, perHit: 1 }], ['scorching_cut', 'Scorching Cut', { dmg: 5, hits: 2, burn: 2, bleed: 2, perHit: 1 }]]);
sk('ignite', 'Ignite', ['pyre'], 'D', 3, { detonate: 2 }, [['combust', 'Combust', { detonate: 3 }], ['wildfire', 'Wildfire', { detonate: 2, keep: 1 }]]);
sk('scorch', 'Scorch', ['pyre'], 'C', 2, { dmg: 5, burn: 7 }, [['blaze', 'Blaze', { dmg: 7, burn: 11 }], ['searing_brand', 'Searing Brand', { dmg: 5, burn: 7, weaken: 1 }]]);
sk('inferno', 'Inferno', ['pyre'], 'B', 4, { dmg: 10, burn: 11 }, [['hellfire', 'Hellfire', { dmg: 14, burn: 16 }], ['firestorm', 'Firestorm', { dmg: 5, hits: 3, burn: 4, perHit: 1 }]]);
sk('sacred_flame', 'Sacred Flame', ['zealot', 'pyre'], 'B', 3, { dmg: 9, burn: 4, heal: 8 }, [['purging_flame', 'Purging Flame', { dmg: 12, burn: 6, heal: 10 }], ['sunfire', 'Sunfire', { dmg: 9, burn: 4, heal: 8, cleanse: 1 }]]);
sk('pandemic', 'Pandemic', ['venom', 'pyre'], 'A', 4, { burn: 8, poison: 6 }, [['apocalypse', 'Apocalypse', { burn: 12, poison: 10 }], ['black_death', 'Black Death', { burn: 8, poison: 6, weaken: 2 }]]);
