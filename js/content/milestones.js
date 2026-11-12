// ===== [World Pending Deletion] — content: Shared milestones =====
'use strict';
// Phase 8, step 3. Every tester's runs add to one shared count (Firestore shared/totals, see firestore.rules): worlds
// spared by everyone together. Each milestone reached opens something small for everyone: a System line on the title
// screen, a piece of decor in Handler's Quarters, or an Archive page.
//   at: worlds spared by all Entrants.  line: the System's line once reached.  decor / page: what else it opens.
const SHARED_MILESTONES = [
  { at: 10, line: '[Ten worlds spared by this group of Entrants. The System has adjusted its expectations. Slightly.]' },
  { at: 25, line: '[Twenty-five worlds spared. A plaque has been issued. Please do not lick the plaque.]', decor: 'plaque' },
  { at: 50, line: '[Fifty worlds spared. The System has opened a file on all of you. Together.]', page: 'p_collective' },
  { at: 100, line: '[One hundred worlds spared. The crowd has started cheering for Entrants. This is being looked into.]' },
  { at: 250, line: '[Two hundred and fifty worlds spared. The Undefeated has asked to see the list.]' },
];
// What the milestones open, added to the lists they belong to
DECOR.plaque = { name: 'Commemorative Plaque', cost: 0, shared: true, flavour: '[Awarded to every Entrant in this group. Twenty-five worlds. Names withheld.]' };
STORY_PAGES.p_collective = { at: 'shared', opens: 'Reach a Shared milestone: 50 worlds spared by everyone.', by: 'The System', title: 'A File on All of You', text: '[Group file opened. Members: several. Worlds spared between them: fifty. Pattern noted. The System does not like patterns it did not make.]' };
