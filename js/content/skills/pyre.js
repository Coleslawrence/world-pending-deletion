// ===== [World Pending Deletion] — content: skills: Pyre =====
'use strict';
sk('firebolt', 'Firebolt', ['pyre'], 'E', 1, { dmg: 7, burn: 4 }, [['fireball', 'Fireball', { dmg: 12, burn: 6 }], ['fire_rain', 'Fire Rain', { dmg: 3, hits: 4, burn: 2, perHit: 1 }], ['searing_bolt', 'Searing Bolt', { dmg: 7, burn: 4, weaken: 1 }]]);
sk('ember_ward', 'Ember Ward', ['pyre', 'bastion'], 'E', 2, { block: 8, burn: 4 }, [['fire_wall', 'Fire Wall', { block: 13, burn: 6 }], ['blazing_aegis', 'Blazing Aegis', { block: 8, burn: 3, thorns: 6 }], ['cinder_shell', 'Cinder Shell', { block: 8, burn: 4, regen: 2 }]]);
sk('flame_wave', 'Flame Wave', ['pyre', 'blade'], 'D', 1, { dmg: 4, hits: 2, burn: 2, perHit: 1 }, [['inferno_wave', 'Inferno Wave', { dmg: 4, hits: 3, burn: 2, perHit: 1 }], ['scorching_cut', 'Scorching Cut', { dmg: 5, hits: 2, burn: 2, bleed: 2, perHit: 1 }], ['wave_of_ash', 'Wave of Ash', { dmg: 4, hits: 2, burn: 2, perHit: 1, weaken: 1 }]]);
sk('ignite', 'Ignite', ['pyre'], 'D', 2, { detonate: 2 }, [['combust', 'Combust', { detonate: 3 }], ['wildfire', 'Wildfire', { detonate: 2, keep: 1 }], ['flashpoint', 'Flashpoint', { detonate: 2, stun: 1 }, 4]]);
sk('scorch', 'Scorch', ['pyre'], 'C', 1, { dmg: 5, burn: 7 }, [['blaze', 'Blaze', { dmg: 7, burn: 11 }], ['searing_brand', 'Searing Brand', { dmg: 5, burn: 7, weaken: 1 }], ['smoulder', 'Smoulder', { dmg: 5, burn: 7, block: 6 }]]);
sk('inferno', 'Inferno', ['pyre'], 'B', 3, { dmg: 10, burn: 11 }, [['hellfire', 'Hellfire', { dmg: 14, burn: 16 }], ['firestorm', 'Firestorm', { dmg: 5, hits: 3, burn: 4, perHit: 1 }], ['bonfire', 'Bonfire', { dmg: 10, burn: 11, empower: 2 }]]);
sk('sacred_flame', 'Sacred Flame', ['zealot', 'pyre'], 'B', 2, { dmg: 9, burn: 4, heal: 8 }, [['purging_flame', 'Purging Flame', { dmg: 12, burn: 6, heal: 10 }], ['sunfire', 'Sunfire', { dmg: 9, burn: 4, heal: 8, cleanse: 1 }], ['holy_brand', 'Holy Brand', { dmg: 9, burn: 4, heal: 8, mark: 2 }]]);
sk('pandemic', 'Pandemic', ['venom', 'pyre'], 'A', 3, { burn: 8, poison: 6 }, [['apocalypse', 'Apocalypse', { burn: 12, poison: 10 }], ['black_death', 'Black Death', { burn: 8, poison: 6, weaken: 2 }], ['fever_dream', 'Fever Dream', { burn: 8, poison: 6, misf: 3 }]]);
sk('backdraft', 'Backdraft', ['pyre'], 'D', 2, { burn: 4, read: 'attack', readFx: { burn: 8, detonate: 1 } }, [['blowback', 'Blowback', { burn: 4, read: 'attack', readFx: { burn: 8, detonate: 1, keep: 1 } }], ['smoke_screen', 'Smoke Screen', { burn: 4, read: 'attack', readFx: { burn: 8, evade: 1 } }], ['flash_fire', 'Flash Fire', { burn: 4, read: 'attack', readFx: { burn: 8, detonate: 1, block: 16 } }]]);
sk('hex_brand', 'Hex Brand', ['pyre', 'jinx'], 'C', 2, { burn: 6, misf: 3 }, [['cursed_brand', 'Cursed Brand', { burn: 6, misf: 3, mark: 2 }], ['ashen_hex', 'Ashen Hex', { burn: 6, misf: 3, weaken: 1 }], ['warding_brand', 'Warding Brand', { burn: 6, misf: 3, block: 6 }]]);
// Mastery pieces (mastery: the Archetype Mastery level that opens them; see mastery.js)
sk('slow_fuse', 'Slow Fuse', ['pyre'], 'D', 2, { burn: 3, fuse: 3 }, [['short_fuse', 'Short Fuse', { burn: 5, fuse: 5 }], ['powder_trail', 'Powder Trail', { dmg: 5, burn: 3, fuse: 3 }], ['banked_coals', 'Banked Coals', { burn: 3, fuse: 3, block: 6 }]], { mastery: 4 });
sk('flashover', 'Flashover', ['pyre'], 'B', 3, { dmg: 6, flash: 12 }, [['white_heat', 'White Heat', { dmg: 6, flash: 18 }], ['rollover', 'Rollover', { dmg: 6, flash: 12, weaken: 2 }], ['flash_burn', 'Flash Burn', { dmg: 10, flash: 12 }]], { mastery: 6 });
sk('conflagration', 'Conflagration', ['pyre'], 'A', 4, { dmg: 6, hits: 3, burn: 4, perHit: 1 }, [['pyroclasm', 'Pyroclasm', { dmg: 6, hits: 4, burn: 4, perHit: 1 }], ['ashfall', 'Ashfall', { dmg: 6, hits: 3, burn: 4, perHit: 1, weaken: 2 }], ['ring_of_fire', 'Ring of Fire', { dmg: 6, hits: 3, burn: 4, perHit: 1, block: 10 }]], { mastery: 8 });
flav({
  firebolt: "Fire, thrown. The oldest argument in the Burning Empire.",
  fireball: "It gets bigger on the way.",
  fire_rain: "Embers falling like a slow, angry rain.",
  ember_ward: "A shield of hot coals. Anyone who touches it learns.",
  fire_wall: "A curtain of flame between you and the rest of the world.",
  blazing_aegis: "Hit it, and it hits back hotter.",
  flame_wave: "A sweep of fire, low and fast, along the arena floor.",
  inferno_wave: "The wave breaks three times, and every time it burns.",
  scorching_cut: "A blade heated red. It burns and bleeds at once.",
  ignite: "You snap your fingers. Everything already burning remembers why.",
  combust: "The fire inside them finds its way out.",
  wildfire: "It goes off, and somehow keeps burning.",
  scorch: "Fire that sticks. It clings like tar.",
  blaze: "The smoke can be seen from the cheap seats.",
  searing_brand: "Burned into them, along with a little doubt.",
  inferno: "The arena keepers have buckets ready for this one. It never helps.",
  hellfire: "Black flame, and no smoke at all.",
  firestorm: "Three columns of fire, walking.",
  sacred_flame: "Fire that burns them clean and keeps you warm.",
  purging_flame: "The temples say it burns away sin. It is not very selective.",
  sunfire: "A borrowed piece of the sun. Return it when you are done.",
  pandemic: "Fire and fever, spreading together.",
  apocalypse: "The end of a world, in miniature. The System leans closer.",
  black_death: "Smoke that carries the sickness with it.",
  backdraft: "They charge in and the air catches.",
  blowback: "The fire leaves through them and comes straight back in.",
  smoke_screen: "They swing at where the smoke said you were.",
  searing_bolt: "It burns the arm they would have swung with.",
  cinder_shell: "A warm wall. You heal against it.",
  wave_of_ash: "The ash gets in their eyes and stays there.",
  flashpoint: "The whole fire goes at once, and so does their footing.",
  smoulder: "You keep the fire low and stand behind the smoke.",
  bonfire: "You feed the fire, and the fire feeds you back.",
  holy_brand: "A brand that marks them for judgement.",
  fever_dream: "Hot, sick, and suddenly very unlucky.",
  flash_fire: "The flare that catches them also hides you.",
  hex_brand: "A sigil pressed into them, still hot. It is bad luck to be marked twice.",
  cursed_brand: "The brand glows brighter wherever you strike next.",
  ashen_hex: "Ash in the joints. Their swing comes slow and late.",
  warding_brand: "You keep the hot iron between you and them.",
  slow_fuse: "Lit now. It will get to them in its own time.",
  short_fuse: "Less waiting. Considerably less.",
  powder_trail: "A line of black powder, and you at the safe end of it.",
  banked_coals: "Covered over for the night. Still hot in the morning.",
  flashover: "The moment a room stops having a fire in it and becomes one.",
  white_heat: "Past red, past orange. The colour of nothing surviving.",
  rollover: "Flame running across the ceiling, looking for the door.",
  flash_burn: "It is over before the heat arrives.",
  conflagration: "[Fire has exceeded the arena. The arena has been notified.]",
  pyroclasm: "The mountain's opinion, delivered four times.",
  ashfall: "Grey snow. It settles on them and they slow.",
  ring_of_fire: "You stand in the middle. That is the only good place to stand.",
});
