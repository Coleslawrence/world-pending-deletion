// ===== [World Pending Deletion] — content: System events =====
// Events the System runs itself: it glitches, audits, amends its own rules and offers deals it shouldn't. Theme 'system'.
'use strict';
// Favour for your Patron, or for a god picked for you when you are Faithless
const patronOf = (run, h) => GODS[run.patron] ? run.patron : h.pick(Object.keys(GODS));

EVENTS.clerical_error = { title: 'Clerical Error', theme: 'system', text: '[Notice: Entrant record duplicated. One copy will be deleted.] A second you stands in the tunnel, looking equally annoyed.', opts: [
  { label: 'Delete the copy', desc: 'It is probably the copy.', then: { gold: 8 }, reveal: '[Copy deleted. Refund issued for the inconvenience. +8 gold.]' },
  { label: 'Delete the original', desc: 'Let the copy carry on. It seems keen.', then: { respec: true }, go: (run, h) => h.say('[Original deleted. The copy is you now. It stands a little differently.]') },
  { label: 'Keep both', desc: 'Two of you is better. Probably.', then: { summon: { who: 'copy', bounty: { restore: 2 }, say: '[Your copy has entered the bracket. It knows everything you know.]' } }, reveal: '[Duplicate retained. It will be in touch.]' }] };

EVENTS.amendment = { title: 'Tournament Amendment', theme: 'system', text: '[Amendment proposed. Entrants may vote. Votes are binding. Results are final.] The ballot box has no slot.', opts: [
  { label: 'Vote for Sudden Death', desc: 'Shorter fights. Sharper ones.', then: { amend: 'sudden' } },
  { label: 'Vote for Extended Bouts', desc: 'Longer fights. Better paid.', then: { amend: 'extended' } },
  { label: 'Abstain', desc: 'Let someone else decide.', then: { gold: 5 }, go: (run, h) => { h.say('[Abstention noted. The System votes on your behalf. +5 gold.]'); h.apply({ amend: h.pick(Object.keys(AMENDMENTS)) }); } }] };

EVENTS.audit = { title: 'The Audit', theme: 'system', text: 'A clerk with no face opens a ledger with your name on every page. [Routine audit. Please declare all earnings.]', opts: [
  { label: 'Declare everything', desc: 'Honesty is a policy.', then: { notice: -5 }, go: (run, h) => { const d = Math.floor(run.gold / 2); run.gold -= d; h.say(`[Declared. Half your gold is retained for processing. −${d} gold.]`, 'loss'); } },
  { label: 'Declare nothing', desc: 'What earnings?', then: { notice: 2 }, reveal: '[Declaration received: nothing. The clerk writes that down.]' },
  { roll: { stat: 'INT' }, label: 'Cook the books', desc: 'Numbers are only suggestions.', then: { gold: 6, notice: -1, summon: { who: 'calder', bounty: { gold: 15, piece: 'B' }, say: '[Ser Calder has been assigned to review your case. He fights by the book.]' } }, reveal: '[The books balance. For now. +6 gold. The case stays open.]',
    fail: { then: { notice: 2, summon: { who: 'calder', bounty: { gold: 15, piece: 'B' }, say: '[Ser Calder has been assigned to review your case. He fights by the book.]' } }, go: (run, h) => { const d = Math.floor(run.gold / 3); run.gold -= d; h.say(`[Irregularities found. −${d} gold. A reviewer has been assigned.]`, 'loss'); } } }] };

EVENTS.lost_property = { title: 'Lost Property', theme: 'system', text: '[Lost property: one Heart. Owner: a world that no longer exists.] It is warm, and it is still beating.', opts: [
  { label: 'Keep it', desc: 'Finders keepers.', then: { heart: 1, summon: { who: 'erased', bounty: { gold: 10 }, say: '[An Erased champion has entered the bracket. They want something back.]' } }, go: (run, h) => h.say('[Heart retained. Its owner has been notified.]') },
  { label: 'Return it to the Hall', desc: 'The Hall of the Erased keeps such things.', go: (run, h) => {
    if (h.meta) { h.meta.found = h.meta.found || {}; h.meta.found.returned = true; }
    h.say('[Returned. Thank you, Entrant. The Hall will remember this.]'); h.favour(patronOf(run, h), 3);
  } },
  { check: { stat: 'STR' }, label: 'Crush it', desc: 'Whatever is inside is yours now.', then: { stats: { STR: 2 }, notice: 1 }, go: (run, h) => { run.hp = h.maxHp(); h.say('[Crushed. Fully healed. +2 STR. Somewhere, nothing notices.]'); } }] };

EVENTS.sponsors = { title: 'Word From Our Sponsors', theme: 'system', text: '[We will return after a word from our sponsors.] Someone hands you a script and a bottle of something blue.', opts: [
  { label: 'Read the advert', desc: 'It is only a few lines.', then: { gold: 12, next: { weaken: 1 } }, reveal: '[Advert aired. +12 gold. You start your next fight Weakened: you are still holding the product.]' },
  { label: 'Endorse your Patron', desc: 'Say their name like you mean it.', go: (run, h) => { const g = patronOf(run, h); h.favour(g, 3); Object.keys(GODS).filter(o => o !== g).forEach(o => h.favour(o, -2)); } },
  { label: 'Refuse on air', desc: 'Say what you really think of the product.', then: { notice: 1, favour: { war: 2 } }, reveal: '[Refusal broadcast. The ratings dip. The System takes it personally.]' },
  { roll: { stat: 'LUK' }, label: 'Drink the product', desc: 'It is very blue.', go: (run, h) => { const k = h.pick(STATS); run.stats[k] += 2; h.say(`[It works. Nobody knows why. +2 ${k}.]`); },
    fail: { then: { next: { poison: 4 } }, reveal: '[It does not work. You start your next fight with 4 Poison. Results not typical.]' } }] };
