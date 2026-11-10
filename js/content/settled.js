// ===== [World Pending Deletion] — content: Settle the Erased =====
'use strict';
// Phase 7, step 3. Your Erased champions come back as opponents. Beat one, and you may settle them: they leave the Hall
// of the Erased for the Hall of the Settled, with one of these closing lines, and never return. Their world stays
// erased (nothing regrows); only their story ends. Lines are the world's voice: no brackets, no numbers.
//   {champ}: the champion's name.  {world}: their erased world.
const SETTLE_LINES = [
  '{champ} lowers their weapon and, for the first time since {world} went, sits down.',
  '{champ} says the name of every street in {world} once, in order, and then stops.',
  '{champ} hands you a key to a door in {world}. There is no door. They seem relieved anyway.',
  '{champ} asks whether anyone remembers {world}. You say yes. It is enough.',
  '{champ} unbuckles their armour piece by piece, as if going home after a long shift.',
  '{champ} laughs once, quietly, at something only {world} would have found funny.',
  '{champ} stops fighting the way a storm stops: all at once, and without saying goodbye.',
  '{champ} turns towards where {world} used to be, and walks that way until the arena lights lose them.',
];
const SETTLED_MAX = 30;
