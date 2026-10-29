// ===== [World Pending Deletion] — content: skills: Reaper =====
'use strict';
sk('cleave', 'Cleave', ['reaper'], 'E', 1, { dmg: 10 }, [['great_cleave', 'Great Cleave', { dmg: 16 }], ['rending_cleave', 'Rending Cleave', { dmg: 8, bleed: 4 }]]);
sk('berserk', 'Berserk', ['reaper'], 'E', 2, { dmg: 17, selfDmg: 3 }, [['blood_rage', 'Blood Rage', { dmg: 24, selfDmg: 4 }], ['frenzy', 'Frenzy', { dmg: 8, hits: 2, lifesteal: 0.3 }]]);
sk('execute', 'Execute', ['reaper'], 'D', 3, { dmg: 10, execute: 0.3, execMult: 2.5 }, [['decapitate', 'Decapitate', { dmg: 12, execute: 0.3, execMult: 3 }], ['final_verdict', 'Final Verdict', { dmg: 10, execute: 0.5, execMult: 2.5 }]]);
sk('heavy_blow', 'Heavy Blow', ['reaper'], 'D', 3, { dmg: 23 }, [['earthshaker', 'Earthshaker', { dmg: 33 }], ['crushing_blow', 'Crushing Blow', { dmg: 23, weaken: 2 }]]);
sk('momentum', 'Momentum', ['reaper'], 'C', 1, { dmg: 5, momentum: 4 }, [['unstoppable', 'Unstoppable', { dmg: 5, momentum: 7 }], ['avalanche', 'Avalanche', { dmg: 4, hits: 2, momentum: 3 }]]);
sk('doom', 'Doom', ['reaper'], 'B', 5, { doom: 26 }, [['swift_doom', 'Swift Doom', { doom: 22, doomT: 2 }], ['inevitable_doom', 'Inevitable Doom', { doom: 40 }]]);
sk('soul_harvest', 'Soul Harvest', ['reaper'], 'A', 4, { dmg: 14, lifesteal: 0.6, execute: 0.3, execMult: 2 }, [['reaping', 'The Reaping', { dmg: 18, lifesteal: 0.6, execute: 0.3, execMult: 2.5 }], ['soul_feast', 'Soul Feast', { dmg: 14, lifesteal: 1, execute: 0.3, execMult: 2 }]]);
