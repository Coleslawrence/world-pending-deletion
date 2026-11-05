// ===== [World Pending Deletion] — content: skills: Stormcaller =====
'use strict';
sk('static_jab', 'Static Jab', ['storm'], 'E', 1, { dmg: 7, weaken: 1 }, [['shock_jab', 'Shock Jab', { dmg: 10, weaken: 1 }], ['jolt', 'Jolt', { dmg: 7, weaken: 1, stunIfWeak: 1 }, 3], ['charged_jab', 'Charged Jab', { dmg: 7, weaken: 1, brk: 6 }]]);
sk('war_cry', 'War Cry', ['storm', 'reaper'], 'E', 4, { empower: 2, block: 6 }, [['battle_roar', 'Battle Roar', { empower: 3, block: 12 }], ['intimidate', 'Intimidate', { empower: 2, weaken: 2 }], ['rallying_cry', 'Rallying Cry', { empower: 2, block: 6, cleanse: 1 }]]);
sk('thunderclap', 'Thunderclap', ['storm'], 'D', 4, { dmg: 9, stun: 1 }, [['thunderstorm', 'Thunderstorm', { dmg: 7, hits: 3, stun: 1 }], ['static_shock', 'Static Shock', { dmg: 13, stun: 1 }, 3], ['deafening_clap', 'Deafening Clap', { dmg: 9, stun: 1, weaken: 2 }]]);
sk('chain_lightning', 'Chain Lightning', ['storm', 'blade'], 'C', 2, { dmg: 6, hits: 3 }, [['forked_lightning', 'Forked Lightning', { dmg: 6, hits: 4 }], ['ball_lightning', 'Ball Lightning', { dmg: 7, hits: 3, weaken: 1 }], ['breaking_chain', 'Breaking Chain', { dmg: 6, hits: 3, brk: 8 }]]);
sk('overload', 'Overload', ['storm'], 'B', 4, { dmg: 14, stunIfWeak: 1 }, [['supercharge', 'Supercharge', { dmg: 18, stunIfWeak: 1 }], ['short_circuit', 'Short Circuit', { dmg: 12, weaken: 2, stunIfWeak: 1 }], ['power_surge', 'Power Surge', { dmg: 14, stunIfWeak: 1, empower: 1 }]]);
sk('thunder_wrath', "Thunder God's Wrath", ['storm'], 'A', 5, { dmg: 21, stun: 1 }, [['heavens_fury', "Heaven's Fury", { dmg: 30, stun: 1 }], ['eye_of_storm', 'Eye of the Storm', { dmg: 9, hits: 3, stun: 1 }], ['storm_mantle', 'Storm Mantle', { dmg: 15, stun: 1, block: 12 }]]);
flav({
  static_jab: "A quick jab with a crackle at the end of it.",
  shock_jab: "Their teeth buzz.",
  jolt: "A spark into tired muscles. They lock up.",
  war_cry: "The steppe clans shout before the thunder does.",
  battle_roar: "The stands go quiet. Your blood does not.",
  intimidate: "You shout. Their sword arm hesitates.",
  thunderclap: "You clap once, and the air breaks.",
  thunderstorm: "Three strikes, and it is not even raining.",
  static_shock: "The air smells of rain and burnt hair.",
  chain_lightning: "Lightning that refuses to strike just once.",
  forked_lightning: "The bolt splits, and both halves find them.",
  ball_lightning: "It drifts. It hums. Then it stops humming.",
  overload: "Too much storm in too small a space.",
  supercharge: "Your armour sparks. The healers keep their distance.",
  short_circuit: "Their body forgets which way its muscles go.",
  thunder_wrath: "The storm over the steppes has been waiting for permission.",
  heavens_fury: "The sky takes your side, personally.",
  eye_of_storm: "Calm at the centre. Ruin everywhere else.",
  charged_jab: "A small shock, aimed at the joints of their stance.",
  rallying_cry: "You shout away everything clinging to you.",
  deafening_clap: "They get up afterwards. They do not hear well for a while.",
  breaking_chain: "Each link of the chain finds another crack.",
  power_surge: "The overflow comes back into your own arms.",
  storm_mantle: "You wear the storm for a moment. It fits.",
});
