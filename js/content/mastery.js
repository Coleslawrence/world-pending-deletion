// ===== [World Pending Deletion] — content: Archetype Mastery =====
'use strict';
// Every archetype has a ten-level track. A run pays Mastery XP (MASTERY_PAY), shared between the archetypes of the
// skills and gear the run ended with, by how many pieces of each it held. The levels open at MASTERY_XP (total XP).
// What each level gives is the same for every archetype (MASTERY_LEVELS):
//   piece: the archetype's Mastery piece for that level joins its pool. The pieces are ordinary skills and gear carrying
//          mastery: <level> (skills/*.js, gear.js); the first tag is the archetype whose track opens them.
//   redraft / kit: a wider opening when the archetype is your world's home. More choice, never more power.
//   frame / line / title: cosmetic.
// Pending World uses every Mastery piece for everyone, so the daily board stays level; practice runs use none.
const MASTERY_XP = [8, 20, 36, 56, 100, 135, 175, 220, 270, 330]; // early levels eased in the balance pass (11 Nov)
const MASTERY_PAY = { win: 1, spared: 4, priority: 1, elite: 1 };
const MASTERY_LEVELS = [
  { kind: 'frame', frame: 'bronze', text: 'Bronze crest frame.' },
  { kind: 'piece' },
  { kind: 'line', text: 'The System remarks on you on the title screen.' },
  { kind: 'piece' },
  { kind: 'redraft', text: 'One more redraft of your opening skills in its home worlds.' },
  { kind: 'piece' },
  { kind: 'frame', frame: 'silver', text: 'Silver crest frame.' },
  { kind: 'piece' },
  { kind: 'kit', text: 'The opening gear pick offers 3 pieces, not 2, in its home worlds.' },
  { kind: 'title', frame: 'gold', text: 'Gold crest frame, and the name Master of its Path.' },
];
// Level 3: what the System says about you on the title screen (the archetype you have mastered furthest speaks)
const MASTERY_LINES = {
  pyre: '[Entrant noted: fond of fire. The arena keepers have been issued more buckets.]',
  venom: '[Entrant noted: patient. Opponents are advised not to wait it out.]',
  blade: '[Entrant noted: does not stand still. Seating near the sand has been moved back.]',
  bastion: '[Entrant noted: immovable. The schedule now allows extra time.]',
  arcanist: '[Entrant noted: takes more than one turn per turn. This is under review.]',
  zealot: '[Entrant noted: refuses to stay down. The medical staff have stopped coming out.]',
  reaper: '[Entrant noted: finishes things. Opponents are asked to settle their affairs first.]',
  storm: '[Entrant noted: interrupts. The System was going to say more.]',
  dicer: '[Entrant noted: lucky. The House would like a word.]',
  jinx: '[Entrant noted: unlucky to be near. Adjacent seating is sold at a discount.]',
};
