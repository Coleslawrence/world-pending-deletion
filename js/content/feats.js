// ===== [World Pending Deletion] — content: feats =====
'use strict';
// A feat is one measured thing the player can do, declared once here. Wagers, Rank Trial conditions, Titles and
// quests all ask for feats by key, so the same deed is measured the same way everywhere and worded the same way.
//   at:        when it is measured: 'win' (a won fight), 'fight' (any fight), 'merge', 'path', 'shop' or 'wager'
//   say(n):    the words players read for needing n of it (wagers and Trials print this; Titles and quests write
//              their own line, which the checker makes agree with it through must)
//   hit(c, n): did it happen? c holds the run, the fight f, its tally T, you A, the opponent B, won, the spec and pieces()
//   measure(c): how many of it happened, for quests that count up across fights
//   n:         the usual amount asked for; a Title, quest or wager may ask for another
//   must(n):   words a Title or quest that asks for it has to use, so the player can tell what counts
//   unfairFor: archetypes it is never asked of, because their kit can't meet it
//   needs:     a tool the run must have before it is asked ('stop': a Stun or Interrupt)
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
const num = n => `(${n}|${NUM_WORDS[n] || n})`;
const FEATS = {
  fast: { at: 'win', say: n => `Win within ${n} turns`, hit: (c, n) => c.f.turn <= n, n: 6, must: n => new RegExp(`\\b${n} turns`) },
  noheal: { at: 'win', say: () => 'Win without healing', hit: c => c.T.healed <= 0, must: () => /without healing/, unfairFor: ['zealot'] },
  react: { at: 'fight', say: n => `Trigger ${n} reactions`, hit: (c, n) => c.T.reactions >= n, measure: c => c.T.reactions, n: 2, must: n => new RegExp(`\\b${n} reactions`) },
  stop: { at: 'win', say: () => "Stun or Interrupt the opponent's big move", hit: c => c.T.bigStopped >= 1, must: () => /Stun or Interrupt/, needs: 'stop' },
  healthy: { at: 'win', say: () => 'Win with more than half your HP', hit: c => c.A.hp > c.A.maxHp / 2, must: () => /half/ },
  untouched: { at: 'win', say: () => 'Win without losing any HP', hit: c => c.T.taken === 0, must: () => /without losing/ },
  giant: { at: 'win', say: () => 'Beat an opponent with at least twice your max HP', hit: c => c.B.maxHp >= c.A.maxHp * 2, must: () => /twice/ },
  masked: { at: 'win', say: () => 'Defeat the Masked Entrant', hit: c => c.spec.id === 'masked', must: () => /Masked Entrant/ },
  hard: { at: 'win', say: () => 'Beat a hard opponent', hit: c => !!c.spec.hard, must: () => /hard opponent/ },
  rival: { at: 'win', say: () => 'Defeat a rival', hit: c => c.spec.kind === 'rival', must: () => /rival/ },
  outranked: { at: 'win', say: n => `Beat an opponent ${n} rank letters above your Entrant Rank`, hit: (c, n) => c.B.rankUp >= n, n: 2, must: n => new RegExp(`\\b${num(n)} rank letters?`) },
  clutch: { at: 'win', say: () => 'Win with 10% HP or less', hit: c => c.A.hp <= c.A.maxHp * 0.1, must: () => /10% HP/ },
  overkill: { at: 'win', say: n => `Finish an opponent with ${n} more damage than needed`, hit: (c, n) => c.T.overkill >= n, n: 30, must: n => new RegExp(`\\b${n} more damage`) },
  healed: { at: 'fight', say: n => `Heal ${n} HP in a single fight`, hit: (c, n) => c.T.healed >= n, n: 60, must: n => new RegExp(`Heal ${n} HP`) },
  quick: { at: 'fight', say: n => `Use ${n} Quick skills in a single turn`, hit: (c, n) => c.T.maxQuick >= n, n: 3, must: n => new RegExp(`\\b${n} Quick skills`) },
  bighit: { at: 'fight', say: n => `Land a single hit of ${n} or more`, hit: (c, n) => c.T.bigHit >= n, n: 60, must: n => new RegExp(`\\b${n} or more`) },
  stuns: { at: 'fight', say: n => `Stun or Interrupt one opponent ${n} times`, hit: (c, n) => c.T.stuns >= n, n: 3, must: n => new RegExp(`\\b${n} times`) },
  merge: { at: 'merge', say: () => 'Merge pieces', hit: () => true, must: () => /[Mm]erge/ },
  collector: { at: 'merge', say: n => `Own ${NUM_WORDS[n] || n} ★2 pieces at once`, hit: (c, n) => c.pieces().filter(p => p.star >= 2).length >= n, n: 3, must: n => new RegExp(`\\b${num(n)} ★2 pieces`) },
  path: { at: 'path', say: n => `Have the System recognise your path by round ${n}`, hit: (c, n) => c.run.round <= n, n: 5, must: n => new RegExp(`round ${n}`) },
  bankrupt: { at: 'shop', say: () => 'Leave the shop with 0 gold', hit: c => c.run.gold === 0, must: () => /0 gold/ },
  wagers: { at: 'wager', say: n => `Win ${n} wagers in one run`, hit: (c, n) => c.run.wagersWon >= n, n: 3, must: n => new RegExp(`\\b${n} wagers`) },
};
const FEAT_ATS = ['win', 'fight', 'merge', 'path', 'shop', 'wager'];
