// ===== [World Pending Deletion] — content: worlds =====
'use strict';
// Each world type is a pack in worlds/: its entry here, its World Record pool and its Final Champion's greeting.
// setting: optional, 'fantasy' unless it says otherwise; layers and their entries only come to worlds whose setting they suit.
// guest: the class that joins the home class and its first two allies on the grid in this world's class pool; never the home or an ally.
// guest2: only when the home class has a single ally: the class that takes the missing ally's place (also never the home or an ally).
// names: syllable starts and ends (the first 6 of each are the original lists, kept for old Pending World days); mids: optional middles.
// champs: champion names offered at the Awakening (the first 6 are the originals).
// Its Final Champion fights in enemies.js, its World Gift is in gifts.js and its world-first Title in titles.js.
const WORLD_TYPES = {};
// Each run files 10 entries about its world, one per Heart, plus a bio for the champion. Losing Hearts erases entries.
// Runs and snapshots store pool indexes, never text, so pool order is fixed once shipped: add new entries at the end, never reorder or delete.
// k: place | person | custom. tier sets deletion order: far, then city, then home. near is the bio phrase for a home place; rel is a person's relation.
const LORE = {};
// What each Final Champion says to an S-rank Entrant, by Final Champion id
const FINAL_GREET = {};
const MODIFIERS = {
  none: { name: 'Standard Rules', desc: 'No modifier.' },
  bloodmoon: { name: 'Blood Moon', desc: 'Everyone deals 20% more damage.' },
  famine: { name: 'Famine', desc: 'Healing after fights and at the Infirmary is halved.' },
  golden: { name: 'Rich Tithes', desc: '+2 gold every round.' },
  restless: { name: 'Restless Dead', desc: 'Erased champions appear more often.' },
  // glitch: never in the normal draw. A world offer is sometimes one, and Pending World runs on one each Glitch Day (core.js)
  corrupted: { name: 'Corrupted Save', desc: 'Glitches turn up twice as often.', glitch: true },
};
