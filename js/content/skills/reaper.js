// ===== [World Pending Deletion] — content: skills: Reaper =====
'use strict';
sk('cleave', 'Cleave', ['reaper'], 'E', 1, { dmg: 10 }, [['great_cleave', 'Great Cleave', { dmg: 16 }], ['rending_cleave', 'Rending Cleave', { dmg: 8, bleed: 4 }]]);
sk('berserk', 'Berserk', ['reaper'], 'E', 2, { dmg: 17, selfDmg: 3 }, [['blood_rage', 'Blood Rage', { dmg: 24, selfDmg: 4 }], ['frenzy', 'Frenzy', { dmg: 8, hits: 2, lifesteal: 0.3 }]]);
sk('execute', 'Execute', ['reaper'], 'D', 3, { dmg: 10, execute: 0.3, execMult: 2.5 }, [['decapitate', 'Decapitate', { dmg: 12, execute: 0.3, execMult: 3 }], ['final_verdict', 'Final Verdict', { dmg: 10, execute: 0.5, execMult: 2.5 }]]);
sk('heavy_blow', 'Heavy Blow', ['reaper'], 'D', 3, { dmg: 23 }, [['earthshaker', 'Earthshaker', { dmg: 33 }], ['crushing_blow', 'Crushing Blow', { dmg: 23, weaken: 2 }]]);
sk('momentum', 'Momentum', ['reaper'], 'C', 1, { dmg: 5, momentum: 4 }, [['unstoppable', 'Unstoppable', { dmg: 5, momentum: 7 }], ['avalanche', 'Avalanche', { dmg: 4, hits: 2, momentum: 3 }]]);
sk('doom', 'Doom', ['reaper'], 'B', 5, { doom: 26 }, [['swift_doom', 'Swift Doom', { doom: 22, doomT: 2 }], ['inevitable_doom', 'Inevitable Doom', { doom: 40 }]]);
sk('soul_harvest', 'Soul Harvest', ['reaper'], 'A', 4, { dmg: 14, lifesteal: 0.6, execute: 0.3, execMult: 2 }, [['reaping', 'The Reaping', { dmg: 18, lifesteal: 0.6, execute: 0.3, execMult: 2.5 }], ['soul_feast', 'Soul Feast', { dmg: 14, lifesteal: 1, execute: 0.3, execMult: 2 }]]);
sk('punish', 'Punish', ['reaper'], 'D', 2, { dmg: 8, read: 'defend', readFx: { dmg: 20, pierce: 1 } }, [['no_hiding', 'No Hiding', { dmg: 8, read: 'defend', readFx: { dmg: 16, pierce: 1, weaken: 2 } }], ['exploit', 'Exploit', { dmg: 10, execute: 0.3, execMult: 2, read: 'defend', readFx: { dmg: 18, pierce: 1, execute: 0.3, execMult: 2 } }]]);
flav({
  cleave: "A wide swing. It needs no skill, only commitment.",
  great_cleave: "The blade goes all the way round.",
  rending_cleave: "The blade catches on the way out.",
  berserk: "You stop counting your own wounds. Pain is a later problem.",
  blood_rage: "Your sight goes red at the edges, then everywhere.",
  frenzy: "Two wild swings. You drink what spills.",
  execute: "The wounded have already lost. This tells them.",
  decapitate: "Grim, quick and very popular with the crowd.",
  final_verdict: "Death passes sentence a little earlier than usual.",
  heavy_blow: "All your weight, one swing, no apologies.",
  earthshaker: "The floor cracks. They were standing on it.",
  crushing_blow: "They get up afterwards, but not all the way.",
  momentum: "Each swing feeds the next. Stopping is the hard part.",
  unstoppable: "You stopped trying to stop.",
  avalanche: "It starts small. It never stays small.",
  doom: "You point. Somewhere, a bell starts counting.",
  swift_doom: "The bell counts faster.",
  inevitable_doom: "It takes its time. It has never been late.",
  soul_harvest: "The scythe comes back heavier than it left.",
  reaping: "Harvest time, and the field is full.",
  soul_feast: "Nothing is wasted. Every drop comes back to you.",
  punish: "A raised shield is an admission. You collect on it.",
  no_hiding: "The shield comes down, and so does everything behind it.",
  exploit: "Every guard has a gap. You were born knowing where.",
});
