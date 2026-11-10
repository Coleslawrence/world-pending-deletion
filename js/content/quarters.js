// ===== [World Pending Deletion] — content: Entrant Quarters =====
'use strict';
// Phase 8, step 2. A room between runs that fills with your history: each retired rival's trophy (grudges.js), a crown for
// each Final Champion you have beaten, and a shard for each world you have lost. Echoes buy decor for it. Purely cosmetic.
//   name, cost (Echoes), flavour (world voice, or a whole System line).
const DECOR = {
  chair: { name: 'A Chair That Does Not Wobble', cost: 10, flavour: 'Requisitioned. The form took longer than the chair.' },
  dummy: { name: 'Practice Dummy', cost: 10, flavour: 'Stuffed with old entry forms. It has seen worse.' },
  rug: { name: 'Rug from a Spared World', cost: 15, flavour: 'Somebody wove it for a festival that still happens.' },
  lantern: { name: 'Quiet Lantern', cost: 15, flavour: 'Lit in a world where the gods stopped answering. It kept burning anyway.' },
  shelf: { name: 'Shelf of Unread Handbooks', cost: 20, flavour: '[Entrant Handbook, editions 1 to ███. Please read before your next tournament.]' },
  window: { name: 'A Real Window', cost: 20, flavour: 'It looks out on nothing. It is still a window.' },
  screen: { name: 'Broadcast Screen', cost: 25, flavour: '[Now showing: your own matches, on repeat. The System thought you would like that.]' },
  banner: { name: 'Crest Banner', cost: 30, flavour: 'Your sigil, stitched large enough to be seen from the stands.' },
};
