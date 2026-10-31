// ===== [World Pending Deletion] — content: Undercity events =====
// One file per chain in events/, plus events/undercity.js for the ones that stand alone. Ids are permanent, and so are
// option positions: run summaries store the option picked by its place in opts, so add options at the end.
//   EVENTS.id = { title, text, opts, chain?, weight?, theme?, can? }
//   can(run): when the event can turn up in the Undercity at all (a stand-alone event that needs something, like a past defeat)
//   text: a string, or fn(run) when it names something from the run
//   chain: the CHAINS id the event belongs to; weight: odds of turning up in the Undercity (default 1, chain starters 3)
//   theme: the archetype (or two neighbours) a stand-alone event belongs to, when it belongs to one; a chain's events take the chain's
// An option: { label, desc, check?, pay?, can?, then?, go?, reveal? }
//   label is an action the player can take and desc a hint. Every option shown can be picked: one with a check shows
//   only when the player qualifies, one with pay only when they can afford it. Keep one option with neither.
//   check: { stat: 'STR', hard?: true } (6, or 10 if hard), { favour: god } (4 Favour) or { luck: true } (rolled once on LUK)
//   roll: { stat: 'AGI', hard?: true } a chance option: always shown, with the odds on the button ([AGI 58%]). The chance is
//     30% + 7% per point of the stat + 1% per LUK (hard: from 10%), 5% to 95%, rolled when the event appears. Success runs the
//     option's then/go/reveal; failure runs fail: { then?, go?, reveal? }, which must do something (a failed roll still moves the story)
//   An option is a roll or a check, never both. Use sure checks for build moments, rolls for risky acts (sneaking, lying, stealing)
//   pay: gold, a shown cost. The label or desc says it ("Pay 6 gold"): costs show only when paying is the action itself
//   payHeart: Hearts, a shown cost like pay ("Pay 1 Heart"); shown only when it would leave you at least 1 Heart
//   can(run): any other condition; an option that fails it is left out, never shown greyed out
//   then: outcomes from outcomes.js, applied in the order listed there after pay: gold, stats { VIT: 2 }, heart, rune,
//     piece: 'B', next (flags for the next fight, as in the existing events), chain: 'done', another end state like
//     'tip', or { step, after } (the chain's <chain>_<step> event turns up after that many rounds); then go(run, h)
//     runs, then reveal, and last favour { war: 2 }
//   go(run, h): anything else. Content cannot call the rules directly, so h carries what it needs:
//     h.say(text, t) adds a line (t: 'sys' by default, 'loss', 'loot', 'class'); h.favour(god, n); h.lose(share, text)
//     costs a share of max HP and says how much; h.piece(tries) gives a C or B piece (more tries, better odds of B);
//     h.eraseRecord(n); h.maxHp(); h.hasGift(id); h.pick(list); h.shuffle(list); h.meta (null in practice)
//   reveal: a System line (in [brackets], or fn(run)) told after the pick, when nothing else said anything
'use strict';
const EVENTS = {};
// CHAINS.id = { name, start, theme? }: name is shown on later steps ("[Event chain: The Official]"), start is the first event,
// theme the archetype (or two neighbours) the chain belongs to on the wheel, when it belongs to one
const CHAINS = {};
// Tournament Amendments: rules an event can change for the rest of the run (the outcome amend), outside the Elite bracket.
// foeHp / foeDmg multiply every opponent's HP and damage; winGold is paid on each win
const AMENDMENTS = {
  sudden: { name: 'Sudden Death', say: 'Opponents have 30% less HP and deal 30% more damage.', foeHp: 0.7, foeDmg: 1.3 },
  extended: { name: 'Extended Bouts', say: 'Opponents have 20% more HP. Every win pays 4 gold.', foeHp: 1.2, winGold: 4 },
};
