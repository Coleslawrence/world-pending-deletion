// ===== [World Pending Deletion] — content: skills: Venom =====
'use strict';
sk('venom_blade', 'Venom Blade', ['venom', 'blade'], 'E', 1, { dmg: 5, poison: 2 }, [['viper_fang', 'Viper Fang', { dmg: 7, poison: 4 }], ['toxic_flurry', 'Toxic Flurry', { dmg: 3, hits: 3, poison: 1, perHit: 1 }], ['numbing_blade', 'Numbing Blade', { dmg: 5, poison: 2, weaken: 1 }]]);
sk('hex', 'Hex', ['venom', 'storm'], 'E', 1, { weaken: 2, poison: 2 }, [['curse_of_frailty', 'Curse of Frailty', { weaken: 3, poison: 4 }], ['wither', 'Wither', { weaken: 2, poison: 2, drainPoison: 1 }], ['hex_of_ruin', 'Hex of Ruin', { weaken: 2, poison: 2, mark: 2 }]]);
sk('drain_life', 'Drain Life', ['venom', 'reaper'], 'E', 1, { dmg: 8, lifesteal: 0.5 }, [['soul_drain', 'Soul Drain', { dmg: 12, lifesteal: 0.6 }], ['blood_pact', 'Blood Pact', { dmg: 8, lifesteal: 1 }], ['sapping_drain', 'Sapping Drain', { dmg: 8, lifesteal: 0.5, poison: 3 }]]);
sk('plague_cloud', 'Plague Cloud', ['venom'], 'D', 2, { poison: 6 }, [['pestilence', 'Pestilence', { poison: 10 }], ['rot', 'Rot', { poison: 6, bleed: 4 }], ['choking_cloud', 'Choking Cloud', { poison: 6, weaken: 2 }]]);
sk('malice', 'Malice', ['venom'], 'D', 1, { dmg: 4, malice: 3 }, [['spite', 'Spite', { dmg: 4, malice: 5 }], ['torment', 'Torment', { dmg: 6, malice: 3, weaken: 1 }], ['gloat', 'Gloat', { dmg: 4, malice: 3, heal: 4 }]]);
sk('leech', 'Leech', ['venom', 'reaper'], 'C', 2, { leech: 3 }, [['blood_leech', 'Blood Leech', { leech: 6 }], ['parasite', 'Parasite', { leech: 3, poison: 3 }], ['symbiote', 'Symbiote', { leech: 3, regen: 2 }]]);
sk('toxic_needles', 'Thousand Needles', ['venom'], 'B', 2, { poison: 4, doublePoison: 1 }, [['venom_storm', 'Venom Storm', { poison: 6, doublePoison: 1 }], ['needle_rain', 'Needle Rain', { dmg: 3, hits: 3, poison: 5, doublePoison: 1 }], ['numbing_needles', 'Numbing Needles', { poison: 4, doublePoison: 1, stunIfWeak: 1 }]]);
sk('seep', 'Seep', ['venom'], 'D', 1, { poison: 3, read: 'defend', readFx: { poison: 14 } }, [['stagnant_pool', 'Stagnant Pool', { poison: 3, read: 'defend', readFx: { poison: 12, weaken: 4 } }], ['rising_damp', 'Rising Damp', { poison: 4, read: 'defend', readFx: { poison: 12, doublePoison: 1 } }], ['soak', 'Soak', { poison: 3, read: 'defend', readFx: { poison: 10, siphon: 1 } }]]);
sk('sour_luck', 'Sour Luck', ['venom', 'jinx'], 'C', 2, { dmg: 5, poison: 5, misf: 2 }, [['rotten_luck', 'Rotten Luck', { dmg: 5, poison: 5, misf: 2, misfT: 2 }], ['bitter_draught', 'Bitter Draught', { dmg: 5, poison: 5, misf: 2, lifesteal: 0.3 }], ['blighted_omen', 'Blighted Omen', { dmg: 5, poison: 5, misf: 2, omenAtk: 8 }]]);
// Mastery pieces (mastery: the Archetype Mastery level that opens them; see mastery.js)
sk('slow_drip', 'Slow Drip', ['venom'], 'E', 1, { poison: 2 }, [['steady_drip', 'Steady Drip', { poison: 4 }], ['bitter_drip', 'Bitter Drip', { poison: 2, weaken: 1 }], ['numbing_drip', 'Numbing Drip', { poison: 2, block: 5 }]], { quick: true, mastery: 2 });
sk('fester', 'Fester', ['venom'], 'C', 2, { fester: 1 }, [['suppurate', 'Suppurate', { fester: 1.5 }], ['open_sore', 'Open Sore', { fester: 1, poison: 3 }], ['gangrene', 'Gangrene', { fester: 1, weaken: 2 }]], { mastery: 6 });
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
  numbing_blade: "They feel the cut later. They feel the weakness now.",
  hex_of_ruin: "A curse that points them out to everything else.",
  sapping_drain: "You take some of their life and leave something worse behind.",
  choking_cloud: "Hard to swing a weapon while coughing.",
  gloat: "Their suffering is good for your health.",
  symbiote: "It feeds on them, and it shares.",
  numbing_needles: "A weakened body gives up on standing altogether.",
  soak: "It soaks through the shield and takes it with it.",
  sour_luck: "Their drink turns. So does their day.",
  rotten_luck: "Spoiled from the inside, and getting worse.",
  bitter_draught: "You take a sip of what you gave them. It suits you better.",
  blighted_omen: "The crows saw this coming. So did you.",
  slow_drip: "One drop. You have all the time in the world.",
  steady_drip: "It keeps count so you don't have to.",
  bitter_drip: "They taste it first. Then their arms get heavy.",
  numbing_drip: "A drop for them, and one to take the edge off for you.",
  fester: "The poison was already there. You only remind it.",
  suppurate: "What was under the skin comes up to look around.",
  open_sore: "It will not close. You made sure.",
  gangrene: "The limb decides to stop helping.",
});
