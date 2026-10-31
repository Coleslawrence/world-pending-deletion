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
//   chain: 'done', or { step, after }   where the event chain goes next (events only)
//   favour: { war: 2 } Favour with gods, announced last
const OUTCOMES = {
  gold: { say: n => `${n} gold` },
  stats: { say: o => Object.entries(o).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', ') },
  heart: { say: n => `+${n} max Heart${n === 1 ? '' : 's'}` },
  rune: { say: n => n === 1 ? 'a rune' : `${n} runes` },
  piece: { say: r => `a free ${r}-rank piece` },
  next: { say: () => 'a mark on your next fight' },
  chain: { say: () => 'the story goes on' },
  favour: { say: o => Object.entries(o).map(([g, n]) => `${n} Favour with ${GODS[g].name.replace(/^The /, 'the ')}`).join(', '), late: true },
};
// The words for a whole set of outcomes, in order: "8 gold, 2 Favour with the God of War"
function outcomeText(T) { return Object.keys(OUTCOMES).filter(k => T[k] != null).map(k => OUTCOMES[k].say(T[k])).join(', '); }
