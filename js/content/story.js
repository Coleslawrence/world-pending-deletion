// ===== [World Pending Deletion] — content: Story drip =====
'use strict';
// Phase 7, step 4. Pages the System lets slip into the Archive. Milestone pages open at a moment (first world lost,
// first world spared, a Rank promotion, first champion settled). Drip pages open in order: one every STORY_EVERY runs,
// and one each time a new Priority level opens. The next drip page can be bought early for STORY_PRICE Echoes.
// Every page is written to fit all three open answers to the central mystery (lore-bible.md): none of them answers it.
//   title, text: what the Archive shows. by: who wrote it, for the page's header.
//   at: a milestone's moment: 'erased', 'spared', 'rank:<letter>' (promoted to it or past it), 'settled', 'shared' (milestones.js).
//   opens: the milestone's moment, as players read it while the page is sealed.
const STORY_EVERY = 3;
const STORY_PRICE = 15;
const STORY_PAGES = {
  // Milestones
  m_erased: { at: 'erased', opens: 'Lose a world.', by: 'The System', title: 'Notice of Erasure', text: '[Notice of Erasure. A world you entered for has been erased. Its records are filed. Where they are filed is not a matter for Entrants. This notice is a courtesy. Courtesy is not policy.]' },
  m_spared: { at: 'spared', opens: 'Spare a world.', by: 'The System', title: 'Certificate of Clemency', text: '[Certificate of Clemency. The world named on your record is spared from deletion this tournament. This certificate does not cover future tournaments. Spared worlds are entered again in due course. Please keep this certificate somewhere safe. Most Entrants lose theirs.]' },
  m_rank_d: { at: 'rank:D', opens: 'Reach D-rank.', by: 'The System', title: 'Memo: Entrant Upgraded', text: '[Internal. Entrant upgraded to D-rank. Recommend closer observation. Reason for recommendation: withheld. Withheld by: ███.]' },
  m_rank_b: { at: 'rank:B', opens: 'Reach B-rank.', by: 'Found in the locker room', title: 'Scratched into a Bench', text: "Someone has scratched a tally into the bench: four marks and a line through them, over and over, until the wood runs out. Under it, smaller: 'they reset the count when you win.'" },
  m_rank_s: { at: 'rank:S', opens: 'Reach S-rank.', by: 'The Trickster', title: 'Off the Record', text: "Between you and me, nobody up here reads the rules. We just watch. Some of us think we're the ones watching. Funny, that." },
  m_settled: { at: 'settled', opens: 'Settle an Erased champion.', by: 'The System', title: 'Ledger of the Settled', text: '[Champions settled: 1. Worlds restored: 0. These numbers are not related. Please stop asking.]' },
  // Drip pages, in the order they open
  d_handbook1: { by: 'The System', title: 'Entrant Handbook, Page 1', text: '[Welcome to the Grand Tournament. Every world is judged. One champion per world may plead its case. The System thanks you for your cooperation, which has been assumed.]' },
  d_handbook7: { by: 'The System', title: 'Entrant Handbook, Page 7', text: '[Echoes are issued to Entrants after each match. Echoes are fragments. Fragments of what is outside the scope of this handbook.]' },
  d_letter: { by: 'An Entrant', title: 'A Letter, Never Sent', text: "Dear whoever reads this. I counted the Entrants at the opening ceremony, then I counted the worlds on the board. I've done it three tournaments running. I'm sure I'm doing it wrong. Sorry." },
  d_broadcast: { by: 'The System', title: 'Broadcast Transcript, Cut', text: '[Broadcast interrupted. Thirty seconds of footage removed. Reason: the footage showed the arena empty. The arena is never empty.]' },
  d_ruin: { by: 'The Goddess of Ruin', title: 'Overheard in the Stands', text: 'Every world ends. I only ever asked to be in the room when it happens. Nobody ever asked me who built the room.' },
  d_handbook12: { by: 'The System', title: 'Entrant Handbook, Page 12', text: '[Erased champions may be entered again at the System\'s discretion. They remember. The System does not consider this its problem.]' },
  d_maintenance: { by: 'The System', title: 'Maintenance Log', text: '[Routine check. This tournament: number ████. Tournaments before it: ████. Difference between tournaments: none found. Note: no difference is itself a difference.]' },
  d_crow: { by: 'The Crow', title: 'From the Rafters', text: 'I was here before the seats. I was here before the crowd. I remember when the System still said please.' },
  d_form: { by: 'Found in the Archive', title: 'The Back of an Entry Form', text: "Someone has written on the back of a blank entry form: 'The Undefeated has never filled one of these in. Ask who signs for them.'" },
  d_lastpage: { by: 'The System', title: 'Entrant Handbook, Final Page', text: '[There is no final page. If you are reading the final page, please report it.]' },
};
