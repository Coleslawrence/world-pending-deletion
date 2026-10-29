// ===== [World Pending Deletion] — content: skills: Zealot =====
'use strict';
sk('penance', 'Penance', ['zealot'], 'E', 1, { dmg: 6, heal: 2 }, [['atonement', 'Atonement', { dmg: 8, heal: 4 }], ['zeal', 'Zeal', { dmg: 5, hits: 2, heal: 2 }]]);
sk('holy_light', 'Holy Light', ['zealot'], 'E', 3, { heal: 10 }, [['radiance', 'Radiance', { heal: 16 }], ['purifying_light', 'Purifying Light', { heal: 9, cleanse: 1 }]]);
sk('shield_of_faith', 'Shield of Faith', ['zealot'], 'E', 3, { block: 6 }, [['aegis', 'Aegis', { block: 12 }], ['blessed_shield', 'Blessed Shield', { block: 6, cleanse: 1 }]], { quick: true });
sk('purify', 'Purify', ['zealot'], 'D', 4, { cleanse: 1, heal: 6 }, [['sanctuary', 'Sanctuary', { cleanse: 1, heal: 10, block: 8 }], ['reversal', 'Reversal', { cleanse: 1, reflect: 1, block: 5 }]]);
sk('second_wind', 'Second Wind', ['zealot'], 'D', 4, { healMissing: 0.25 }, [['last_breath', 'Last Breath', { healMissing: 0.4 }], ['rally', 'Rally', { healMissing: 0.25, empower: 1 }]]);
sk('consecrate', 'Consecrate', ['zealot'], 'C', 4, { regen: 4 }, [['hallowed_ground', 'Hallowed Ground', { regen: 7 }], ['holy_fire', 'Holy Fire', { regen: 4, burn: 4 }]]);
sk('miracle', 'Miracle', ['zealot'], 'A', 6, { healMissing: 0.5, cleanse: 1, block: 10 }, [['resurrection', 'Resurrection', { healMissing: 0.7, cleanse: 1, block: 12 }], ['divine_wrath', 'Divine Wrath', { healMissing: 0.4, dmg: 15 }]]);
