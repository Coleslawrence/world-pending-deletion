// ===== [World Pending Deletion] — content: skills: Bastion =====
'use strict';
sk('iron_guard', 'Iron Guard', ['bastion'], 'E', 1, { block: 9 }, [['fortress', 'Fortress', { block: 15 }], ['spiked_guard', 'Spiked Guard', { block: 9, thorns: 5 }]]);
sk('shield_bash', 'Shield Bash', ['bastion', 'storm'], 'E', 2, { dmg: 6, block: 6 }, [['tower_bash', 'Tower Bash', { dmg: 8, block: 11 }], ['stunning_bash', 'Stunning Bash', { dmg: 6, stun: 1 }, 3]]);
sk('smite', 'Smite', ['bastion', 'zealot'], 'E', 2, { dmg: 6, blockDmg: 0.5 }, [['judgement', 'Judgement', { dmg: 5, blockDmg: 1 }], ['righteous_smite', 'Righteous Smite', { dmg: 9, heal: 5 }]]);
sk('retribution', 'Retribution', ['bastion'], 'D', 3, { block: 6, thorns: 8 }, [['vengeance', 'Vengeance', { block: 6, thorns: 14 }], ['iron_retort', 'Iron Retort', { block: 12, thorns: 8 }]]);
sk('riposte', 'Riposte', ['bastion', 'blade'], 'C', 3, { block: 6, riposte: 1.5 }, [['perfect_riposte', 'Perfect Riposte', { block: 10, riposte: 2.5 }], ['parry_master', 'Parry Master', { block: 6, riposte: 1.5, evade: 1 }]]);
sk('unbreakable', 'Unbreakable', ['bastion'], 'B', 4, { block: 20, cleanse: 1 }, [['immovable', 'Immovable', { block: 30, cleanse: 1 }], ['iron_skin', 'Iron Skin', { block: 18, cleanse: 1, thorns: 6 }]]);
sk('bulwark_slam', 'Bulwark Slam', ['bastion'], 'A', 3, { dmg: 4, blockDmg: 1.2 }, [['titan_slam', 'Titan Slam', { dmg: 6, blockDmg: 1.6 }], ['shield_quake', 'Shield Quake', { dmg: 4, blockDmg: 1.2, stun: 1 }, 4]]);
sk('brace_for_it', 'Brace for It', ['bastion'], 'D', 2, { block: 6, read: 'attack', readFx: { block: 18, thorns: 6 } }, [['riposte_stance', 'Riposte Stance', { block: 6, read: 'attack', readFx: { block: 16, riposte: 1 } }], ['steady_footing', 'Steady Footing', { block: 10, regen: 3, read: 'attack', readFx: { block: 20, regen: 3 } }]]);
flav({
  iron_guard: "Feet planted, shield up. The oldest lesson in the Iron Hold.",
  fortress: "They hit the shield. The shield does not notice.",
  spiked_guard: "A shield studded with nails, for opponents who lean on it.",
  shield_bash: "A shield is a door. Sometimes you open it into their face.",
  tower_bash: "The whole wall moves at once, and so do they.",
  stunning_bash: "A ringing blow. They will hear it for a while.",
  smite: "The harder they hit your shield, the harder it hits them.",
  judgement: "Your shield weighs everything done to it, and returns it.",
  righteous_smite: "Struck with a clear conscience, which turns out to be restorative.",
  retribution: "Every blow they land costs them something.",
  vengeance: "You keep a careful count, and repay it with interest.",
  iron_retort: "Iron answers iron, and iron always has the last word.",
  riposte: "You let them commit. Then you correct them.",
  perfect_riposte: "The best answer to a sword is the moment just after it.",
  parry_master: "You were never quite where their blade arrived.",
  unbreakable: "Curses and blows slide off you alike. The crowd starts to worry for them.",
  immovable: "Mountains have tried to move you. Mountains lost.",
  iron_skin: "Your skin rings like a bell when they strike it.",
  bulwark_slam: "Everything you have stopped, delivered all at once.",
  titan_slam: "The arena floor remembers this one.",
  shield_quake: "The ground jumps. So do they, and they land badly.",
  brace_for_it: "You saw it coming. That is most of the work.",
  riposte_stance: "You let the blow land on the shield, then hand it back.",
  steady_footing: "Feet set, breath slow. The arena can wait.",
});
