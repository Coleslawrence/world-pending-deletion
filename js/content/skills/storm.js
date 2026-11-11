// ===== [World Pending Deletion] — content: skills: Stormcaller =====
'use strict';
sk('static_jab', 'Static Jab', ['storm'], 'E', 1, { dmg: 7, weaken: 1 }, [['shock_jab', 'Shock Jab', { dmg: 10, weaken: 1 }], ['jolt', 'Jolt', { dmg: 7, weaken: 1, stunIfWeak: 1 }, 2], ['charged_jab', 'Charged Jab', { dmg: 7, weaken: 1, brk: 6 }]]);
sk('war_cry', 'War Cry', ['storm', 'reaper'], 'E', 3, { empower: 2, block: 6 }, [['battle_roar', 'Battle Roar', { empower: 3, block: 12 }], ['intimidate', 'Intimidate', { empower: 2, weaken: 2 }], ['rallying_cry', 'Rallying Cry', { empower: 2, block: 6, cleanse: 1 }]]);
sk('thunderclap', 'Thunderclap', ['storm'], 'D', 3, { dmg: 9, stun: 1 }, [['thunderstorm', 'Thunderstorm', { dmg: 7, hits: 3, stun: 1 }], ['static_shock', 'Static Shock', { dmg: 13, stun: 1 }, 2], ['deafening_clap', 'Deafening Clap', { dmg: 9, stun: 1, weaken: 2 }]]);
sk('chain_lightning', 'Chain Lightning', ['storm', 'blade'], 'C', 1, { dmg: 6, hits: 3 }, [['forked_lightning', 'Forked Lightning', { dmg: 6, hits: 4 }], ['ball_lightning', 'Ball Lightning', { dmg: 7, hits: 3, weaken: 1 }], ['breaking_chain', 'Breaking Chain', { dmg: 6, hits: 3, brk: 8 }]]);
sk('overload', 'Overload', ['storm'], 'B', 3, { dmg: 14, stunIfWeak: 1 }, [['supercharge', 'Supercharge', { dmg: 18, stunIfWeak: 1 }], ['short_circuit', 'Short Circuit', { dmg: 12, weaken: 2, stunIfWeak: 1 }], ['power_surge', 'Power Surge', { dmg: 14, stunIfWeak: 1, empower: 1 }]]);
sk('thunder_wrath', "Thunder God's Wrath", ['storm'], 'A', 4, { dmg: 21, stun: 1 }, [['heavens_fury', "Heaven's Fury", { dmg: 30, stun: 1 }], ['eye_of_storm', 'Eye of the Storm', { dmg: 9, hits: 3, stun: 1 }], ['storm_mantle', 'Storm Mantle', { dmg: 15, stun: 1, block: 12 }]]);
// Mastery pieces (mastery: the Archetype Mastery level that opens them; see mastery.js)
sk('gale_step', 'Gale Step', ['storm'], 'D', 1, { dmg: 6, weaken: 2, empower: 1 }, [['gale_force', 'Gale Force', { dmg: 9, weaken: 2, empower: 1 }], ['tailwind', 'Tailwind', { dmg: 6, weaken: 2, empower: 2 }], ['crosswind', 'Crosswind', { dmg: 6, weaken: 3, empower: 1 }]], { mastery: 4 });
sk('squall_line', 'Squall Line', ['storm'], 'C', 2, { dmg: 8, bigStop: 2 }, [['wall_cloud', 'Wall Cloud', { dmg: 12, bigStop: 2 }], ['downburst', 'Downburst', { dmg: 8, bigStop: 3 }], ['shelf_cloud', 'Shelf Cloud', { dmg: 8, bigStop: 2, block: 8 }]], { mastery: 6 });
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
  gale_step: "The wind moves you forward and them back. It has picked a side.",
  gale_force: "Past the point where flags tear.",
  tailwind: "Everything you throw arrives early.",
  crosswind: "Nothing they swing goes where they sent it.",
  squall_line: "A straight edge of weather, and their plan on the wrong side of it.",
  wall_cloud: "Low, dark and turning. It does not need to hurry.",
  downburst: "The sky sits down on them all at once.",
  shelf_cloud: "You wait underneath it. They do not get to.",
});
