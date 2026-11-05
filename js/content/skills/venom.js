// ===== [World Pending Deletion] — content: skills: Venom =====
'use strict';
sk('venom_blade', 'Venom Blade', ['venom', 'blade'], 'E', 1, { dmg: 5, poison: 2 }, [['viper_fang', 'Viper Fang', { dmg: 7, poison: 4 }], ['toxic_flurry', 'Toxic Flurry', { dmg: 3, hits: 3, poison: 1, perHit: 1 }]]);
sk('hex', 'Hex', ['venom', 'storm'], 'E', 2, { weaken: 2, poison: 2 }, [['curse_of_frailty', 'Curse of Frailty', { weaken: 3, poison: 4 }], ['wither', 'Wither', { weaken: 2, poison: 2, drainPoison: 1 }]]);
sk('drain_life', 'Drain Life', ['venom', 'reaper'], 'E', 2, { dmg: 8, lifesteal: 0.5 }, [['soul_drain', 'Soul Drain', { dmg: 12, lifesteal: 0.6 }], ['blood_pact', 'Blood Pact', { dmg: 8, lifesteal: 1 }]]);
sk('plague_cloud', 'Plague Cloud', ['venom'], 'D', 3, { poison: 6 }, [['pestilence', 'Pestilence', { poison: 10 }], ['rot', 'Rot', { poison: 6, bleed: 4 }]]);
sk('malice', 'Malice', ['venom'], 'D', 1, { dmg: 4, malice: 3 }, [['spite', 'Spite', { dmg: 4, malice: 5 }], ['torment', 'Torment', { dmg: 6, malice: 3, weaken: 1 }]]);
sk('leech', 'Leech', ['venom', 'reaper'], 'C', 3, { leech: 3 }, [['blood_leech', 'Blood Leech', { leech: 6 }], ['parasite', 'Parasite', { leech: 3, poison: 3 }]]);
sk('toxic_needles', 'Thousand Needles', ['venom'], 'B', 3, { poison: 4, doublePoison: 1 }, [['venom_storm', 'Venom Storm', { poison: 6, doublePoison: 1 }], ['needle_rain', 'Needle Rain', { dmg: 3, hits: 3, poison: 5, doublePoison: 1 }]]);
sk('seep', 'Seep', ['venom'], 'D', 2, { poison: 3, read: 'defend', readFx: { poison: 7 } }, [['stagnant_pool', 'Stagnant Pool', { poison: 3, read: 'defend', readFx: { poison: 6, weaken: 2 } }], ['rising_damp', 'Rising Damp', { poison: 4, read: 'defend', readFx: { poison: 6, doublePoison: 1 } }]]);
flav({
  venom_blade: "A thin coat of green on a thin blade.",
  viper_fang: "Bitten, not cut. The difference shows later.",
  toxic_flurry: "Three nicks, three doses.",
  hex: "A muttered word and a pinch of grave dust.",
  curse_of_frailty: "Their bones ache the way old bones ache before rain.",
  wither: "The poison feeds, and you take a share.",
  drain_life: "You take a little of their life. They did not need all of it.",
  soul_drain: "You drink deeper. It tastes of their world.",
  blood_pact: "Every wound you give, you keep.",
  plague_cloud: "A green haze that settles in the lungs and stays.",
  pestilence: "The Hollow Kingdom buried its sick. They did not stay buried.",
  rot: "Flesh softens. Wounds open on their own.",
  malice: "Spite, distilled. It grows the longer they carry it.",
  spite: "Small, petty and very patient.",
  torment: "Each breath hurts a little more than the last.",
  leech: "Something small and hungry, attached where they cannot reach.",
  blood_leech: "It swells. You feel better.",
  parasite: "It feeds, and leaves something behind.",
  toxic_needles: "Nobody counted the needles. It felt like more than a thousand.",
  venom_storm: "The air itself is poison now.",
  needle_rain: "Silver needles, falling like rain. There is no shelter.",
  seep: "It finds the ones who stand still.",
  stagnant_pool: "Still water breeds the worst things.",
  rising_damp: "It climbs the walls of whatever they hide behind.",
});
