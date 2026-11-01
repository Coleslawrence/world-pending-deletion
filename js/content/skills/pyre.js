// ===== [World Pending Deletion] — content: skills: Pyre =====
'use strict';
sk('firebolt', 'Firebolt', ['pyre'], 'E', 1, { dmg: 7, burn: 4 }, [['fireball', 'Fireball', { dmg: 12, burn: 6 }], ['fire_rain', 'Fire Rain', { dmg: 3, hits: 4, burn: 2, perHit: 1 }]]);
sk('ember_ward', 'Ember Ward', ['pyre', 'bastion'], 'E', 3, { block: 8, burn: 4 }, [['fire_wall', 'Fire Wall', { block: 13, burn: 6 }], ['blazing_aegis', 'Blazing Aegis', { block: 8, burn: 3, thorns: 6 }]]);
sk('flame_wave', 'Flame Wave', ['pyre', 'blade'], 'D', 2, { dmg: 4, hits: 2, burn: 2, perHit: 1 }, [['inferno_wave', 'Inferno Wave', { dmg: 4, hits: 3, burn: 2, perHit: 1 }], ['scorching_cut', 'Scorching Cut', { dmg: 5, hits: 2, burn: 2, bleed: 2, perHit: 1 }]]);
sk('ignite', 'Ignite', ['pyre'], 'D', 3, { detonate: 2 }, [['combust', 'Combust', { detonate: 3 }], ['wildfire', 'Wildfire', { detonate: 2, keep: 1 }]]);
sk('scorch', 'Scorch', ['pyre'], 'C', 2, { dmg: 5, burn: 7 }, [['blaze', 'Blaze', { dmg: 7, burn: 11 }], ['searing_brand', 'Searing Brand', { dmg: 5, burn: 7, weaken: 1 }]]);
sk('inferno', 'Inferno', ['pyre'], 'B', 4, { dmg: 10, burn: 11 }, [['hellfire', 'Hellfire', { dmg: 14, burn: 16 }], ['firestorm', 'Firestorm', { dmg: 5, hits: 3, burn: 4, perHit: 1 }]]);
sk('sacred_flame', 'Sacred Flame', ['zealot', 'pyre'], 'B', 3, { dmg: 9, burn: 4, heal: 8 }, [['purging_flame', 'Purging Flame', { dmg: 12, burn: 6, heal: 10 }], ['sunfire', 'Sunfire', { dmg: 9, burn: 4, heal: 8, cleanse: 1 }]]);
sk('pandemic', 'Pandemic', ['venom', 'pyre'], 'A', 4, { burn: 8, poison: 6 }, [['apocalypse', 'Apocalypse', { burn: 12, poison: 10 }], ['black_death', 'Black Death', { burn: 8, poison: 6, weaken: 2 }]]);
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
});
