// ===== [World Pending Deletion] — content: outcomes =====
'use strict';
// An outcome is one thing the game can give or set as a consequence: an event option's `then`, a quest's `reward`
// and a wager's payout are all sets of outcomes, { key: value }, applied by the same code in core.js and worded by
// say(v) here. Outcomes apply in the order listed; one marked late is applied (and announced) after everything else,
// so an event's reveal line comes before its Favour line.
//   gold: n            gain that much gold
//   stats: { VIT: 2 }  stat points, permanent for the run
//   heart: n           max Hearts (and Hearts) +n; the World Record grows with it
//   rune: n            n rune choices to make (three offered each time)
//   piece: 'B'         a free piece of that rank from your archetypes' pool
//   next: { bribe: true }   flags for the next fight (the ones core.js reads)
//   foe: { weaken: 2, poison: 4, burn: 4, hp: -0.1, trait: 1 }   your next opponent starts with these (hp: a share more or less; trait: n extra pool traits)
//   max_hp: -0.1       a share of max HP, gained or lost for the rest of the run (lost at most half)
//   restore: n         Hearts back, up to your max; the World Record entries come back partial
//   erase: n           Hearts lost (never the last one); World Record entries erased as in a defeat
//   stakes: { win: {…}, lose: {…} }   outcomes that happen when your next fight is won or lost
//   respec: true       every stat back to 1, the points returned to place again
//   summon: { who, bounty?, traits? }   someone takes the hard opponent's place next round: who is 'copy' (you, as you are now),
//                      'erased' (an Erased champion) or a rival's id; bounty: outcomes for beating them
//   amend: id          a Tournament Amendment (AMENDMENTS in events.js) for the rest of the run, replacing any other
//   notice: n          the System's notice up or down (0 to its cap); each step makes opponents stronger or weaker. Announced after the reveal
//   chain: 'done', or { step, after }   where the event chain goes next (events only); applied late, so an option's go still sees the chain's state
//   favour: { war: 2 } Favour with gods, announced last
const OUTCOMES = {
  gold: { say: n => `${n} gold` },
  stats: { say: o => Object.entries(o).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', ') },
  heart: { say: n => `+${n} max Heart${n === 1 ? '' : 's'}` },
  rune: { say: n => n === 1 ? 'a rune' : `${n} runes` },
  piece: { say: r => `a free ${r}-rank piece` },
  next: { say: () => 'a mark on your next fight' },
  foe: { say: () => 'a mark on your next opponent' },
  max_hp: { say: v => `${v > 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}% max HP` },
  restore: { say: n => `${n} Heart${n === 1 ? '' : 's'} restored` },
  erase: { say: n => `${n} Heart${n === 1 ? '' : 's'} erased` },
  stakes: { say: () => 'stakes on your next fight' },
  respec: { say: () => 'your stat points to place again' },
  summon: { say: () => 'a visitor in your bracket' },
  amend: { say: v => `the Amendment ${AMENDMENTS[v].name}` },
  notice: { say: n => n > 0 ? "the System's notice" : 'the System looking elsewhere', late: true },
  chain: { say: () => 'the story goes on', late: true },
  favour: { say: o => Object.entries(o).map(([g, n]) => `${n} Favour with ${GODS[g].name.replace(/^The /, 'the ')}`).join(', '), late: true },
};
// The words for a whole set of outcomes, in order: "8 gold, 2 Favour with the God of War"
function outcomeText(T) { return Object.keys(OUTCOMES).filter(k => T[k] != null).map(k => OUTCOMES[k].say(T[k])).join(', '); }
