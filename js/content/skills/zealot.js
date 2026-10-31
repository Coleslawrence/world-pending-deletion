// ===== [World Pending Deletion] — content: skills: Zealot =====
'use strict';
sk('penance', 'Penance', ['zealot'], 'E', 1, { dmg: 6, heal: 2, brk: 6 }, [['atonement', 'Atonement', { dmg: 8, heal: 4, brk: 8 }], ['zeal', 'Zeal', { dmg: 5, hits: 2, heal: 2, brk: 8 }]]);
sk('holy_light', 'Holy Light', ['zealot'], 'E', 3, { heal: 10, brk: 6 }, [['radiance', 'Radiance', { heal: 16, brk: 8 }], ['purifying_light', 'Purifying Light', { heal: 9, cleanse: 1, brk: 6 }]]);
sk('shield_of_faith', 'Shield of Faith', ['zealot'], 'E', 3, { block: 6 }, [['aegis', 'Aegis', { block: 12 }], ['blessed_shield', 'Blessed Shield', { block: 6, cleanse: 1 }]], { quick: true });
sk('purify', 'Purify', ['zealot'], 'D', 4, { cleanse: 1, heal: 6, brk: 4 }, [['sanctuary', 'Sanctuary', { cleanse: 1, heal: 10, block: 8, brk: 6 }], ['reversal', 'Reversal', { cleanse: 1, reflect: 1, block: 5, brk: 6 }]]);
sk('second_wind', 'Second Wind', ['zealot'], 'D', 4, { healMissing: 0.25, brk: 4 }, [['last_breath', 'Last Breath', { healMissing: 0.4, brk: 6 }], ['rally', 'Rally', { healMissing: 0.25, empower: 1, brk: 4 }]]);
sk('consecrate', 'Consecrate', ['zealot'], 'C', 4, { regen: 4, brk: 4 }, [['hallowed_ground', 'Hallowed Ground', { regen: 7, brk: 6 }], ['holy_fire', 'Holy Fire', { regen: 4, burn: 4, brk: 6 }]]);
sk('miracle', 'Miracle', ['zealot'], 'A', 6, { healMissing: 0.5, cleanse: 1, block: 10, brk: 10 }, [['resurrection', 'Resurrection', { healMissing: 0.7, cleanse: 1, block: 12, brk: 10 }], ['divine_wrath', 'Divine Wrath', { healMissing: 0.4, dmg: 15, brk: 14 }]]);
