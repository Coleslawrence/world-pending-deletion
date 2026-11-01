// ===== [World Pending Deletion] — content: event chain, The Official =====
'use strict';
CHAINS.official = { name: 'The Official', start: 'official_1' };

EVENTS.official_1 = { chain: 'official', title: 'A quiet word', text: 'A tournament official offers to "adjust" your next match. He smiles too much.', opts: [
  { label: 'Pay 6 gold', desc: 'He will "adjust" your next match.', pay: 6, then: { next: { bribe: true }, foe: { weaken: 2 }, chain: { step: 'bribed', after: 2 } }, reveal: '[Your next opponent starts with 20% less HP, Weakened for 2 turns.]' },
  { roll: { stat: 'INT', hard: true }, label: 'Quote the rules back at him', desc: 'Section 9, on officials.', then: { next: { bribe: true }, chain: 'done' }, reveal: '[He adjusts your match for free, and forgets your name. Your next opponent starts with 20% less HP.]',
    fail: { then: { notice: 1, chain: 'done' }, reveal: '[He quotes section 10 back at you. It is longer. The System takes an interest in your reading.]' } },
  { check: { favour: 'war' }, label: '"Adjust it, or be adjusted."', desc: 'Say it the way War would.', then: { next: { bribe: true }, chain: 'done', notice: 1, favour: { war: 1 } }, reveal: '[He adjusts it. Your next opponent starts with 20% less HP. Threats to officials are logged.]' },
  { label: 'Refuse', desc: 'Someone up there might respect that.', then: { chain: { step: 'refused', after: 2 }, favour: { war: 2 } } },
  { check: { stat: 'INT' }, label: 'Report him to the System', desc: 'There is a form for this.', then: { notice: -1, chain: 'done' }, reveal: '[Report filed. The official has been reassigned. The System appreciates compliance.]' }] };

EVENTS.official_bribed = { chain: 'official', title: 'Blackmail', text: 'The official is back. He has a ledger with your name in it, and the System would love to read it.', opts: [
  { label: 'Pay him 8 gold', desc: 'He goes away. For now.', pay: 8, then: { chain: 'done' } },
  { check: { stat: 'STR' }, label: 'Remind him how matches end', desc: 'Up close.', then: { chain: 'done' }, reveal: '[He remembers somewhere else to be. The ledger goes with him.]' },
  { check: { stat: 'INT', hard: true }, label: 'Produce his own ledger', desc: 'You kept notes too.', then: { gold: 8, chain: 'done' }, reveal: '[He pays for your silence. +8 gold.]' },
  { label: 'Let him talk', desc: 'Let the System read his ledger.', then: { chain: 'done' }, go: (run, h) => { h.say('[Scandal recorded. Your world pays for it.]', 'loss'); if (run.hearts > 1) { run.hearts--; h.eraseRecord(1); } } }] };

// chain 'tip': the Final Champion's next 2 moves are shown in the final
EVENTS.official_refused = { chain: 'official', title: 'The honest official', text: 'The official you refused finds you after a match. "Nobody turns me down. I respect that." He slips you a folded page: notes on how the Final Champion fights.', opts: [
  { label: 'Take the notes', desc: 'A folded page about the final.', then: { chain: 'tip' }, reveal: "[Final Champion notes acquired. In the final, you'll see their next 2 moves.]" }] };
