// ===== [World Pending Deletion] — content: skills: Bastion =====
'use strict';
sk('iron_guard', 'Iron Guard', ['bastion'], 'E', 1, { block: 9 }, [['fortress', 'Fortress', { block: 15 }], ['spiked_guard', 'Spiked Guard', { block: 9, thorns: 5 }]]);
sk('shield_bash', 'Shield Bash', ['bastion', 'storm'], 'E', 2, { dmg: 6, block: 6 }, [['tower_bash', 'Tower Bash', { dmg: 8, block: 11 }], ['stunning_bash', 'Stunning Bash', { dmg: 6, stun: 1 }, 3]]);
sk('smite', 'Smite', ['bastion', 'zealot'], 'E', 2, { dmg: 6, blockDmg: 0.5 }, [['judgement', 'Judgement', { dmg: 5, blockDmg: 1 }], ['righteous_smite', 'Righteous Smite', { dmg: 9, heal: 5 }]]);
sk('retribution', 'Retribution', ['bastion'], 'D', 3, { block: 6, thorns: 8 }, [['vengeance', 'Vengeance', { block: 6, thorns: 14 }], ['iron_retort', 'Iron Retort', { block: 12, thorns: 8 }]]);
sk('riposte', 'Riposte', ['bastion', 'blade'], 'C', 3, { block: 6, riposte: 1.5 }, [['perfect_riposte', 'Perfect Riposte', { block: 10, riposte: 2.5 }], ['parry_master', 'Parry Master', { block: 6, riposte: 1.5, evade: 1 }]]);
sk('unbreakable', 'Unbreakable', ['bastion'], 'B', 4, { block: 20, cleanse: 1 }, [['immovable', 'Immovable', { block: 30, cleanse: 1 }], ['iron_skin', 'Iron Skin', { block: 18, cleanse: 1, thorns: 6 }]]);
sk('bulwark_slam', 'Bulwark Slam', ['bastion'], 'A', 3, { dmg: 4, blockDmg: 1.2 }, [['titan_slam', 'Titan Slam', { dmg: 6, blockDmg: 1.6 }], ['shield_quake', 'Shield Quake', { dmg: 4, blockDmg: 1.2, stun: 1 }, 4]]);
