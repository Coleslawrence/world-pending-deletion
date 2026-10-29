// ===== [World Pending Deletion] — content: worlds =====
'use strict';
// Each world type is a pack in worlds/: its entry here, its World Record pool and its Final Champion's greeting.
// Its Final Champion fights in enemies.js, its World Gift is in gifts.js and its world-first Title in titles.js.
const WORLD_TYPES = {};
// Each run files 10 entries about its world, one per Heart, plus a bio for the champion. Losing Hearts erases entries.
// Runs and snapshots store pool indexes, never text, so pool order is fixed once shipped: add new entries at the end, never reorder or delete.
// k: place | person | custom. tier sets deletion order: far, then city, then home. near is the bio phrase for a home place; rel is a person's relation.
const LORE = {};
// What each Final Champion says to an S-rank Entrant, by Final Champion id
const FINAL_GREET = {};
const MODIFIERS = {
  none: { name: 'Clear Skies', desc: 'No modifier.' },
  bloodmoon: { name: 'Blood Moon', desc: 'Everyone deals 20% more damage.' },
  famine: { name: 'Famine', desc: 'Healing after fights and at the Infirmary is halved.' },
  golden: { name: 'Golden Age', desc: '+2 gold every round.' },
  restless: { name: 'Restless Dead', desc: 'Erased champions appear more often.' },
};
