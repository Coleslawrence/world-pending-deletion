// ===== [World Pending Deletion] — content: skills: Stormcaller =====
'use strict';
sk('static_jab', 'Static Jab', ['storm'], 'E', 1, { dmg: 7, weaken: 1 }, [['shock_jab', 'Shock Jab', { dmg: 10, weaken: 1 }], ['jolt', 'Jolt', { dmg: 7, weaken: 1, stunIfWeak: 1 }, 3]]);
sk('war_cry', 'War Cry', ['storm', 'reaper'], 'E', 4, { empower: 2, block: 6 }, [['battle_roar', 'Battle Roar', { empower: 3, block: 12 }], ['intimidate', 'Intimidate', { empower: 2, weaken: 2 }]]);
sk('thunderclap', 'Thunderclap', ['storm'], 'D', 4, { dmg: 9, stun: 1 }, [['thunderstorm', 'Thunderstorm', { dmg: 7, hits: 3, stun: 1 }], ['static_shock', 'Static Shock', { dmg: 13, stun: 1 }, 3]]);
sk('chain_lightning', 'Chain Lightning', ['storm', 'blade'], 'C', 2, { dmg: 6, hits: 3 }, [['forked_lightning', 'Forked Lightning', { dmg: 6, hits: 4 }], ['ball_lightning', 'Ball Lightning', { dmg: 7, hits: 3, weaken: 1 }]]);
sk('overload', 'Overload', ['storm'], 'B', 4, { dmg: 14, stunIfWeak: 1 }, [['supercharge', 'Supercharge', { dmg: 18, stunIfWeak: 1 }], ['short_circuit', 'Short Circuit', { dmg: 12, weaken: 2, stunIfWeak: 1 }]]);
sk('thunder_wrath', "Thunder God's Wrath", ['storm'], 'A', 5, { dmg: 21, stun: 1 }, [['heavens_fury', "Heaven's Fury", { dmg: 30, stun: 1 }], ['eye_of_storm', 'Eye of the Storm', { dmg: 9, hits: 3, stun: 1 }]]);
