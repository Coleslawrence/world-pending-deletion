// ===== [World Pending Deletion] — content: goals =====
'use strict';
// Goals (Phase 6). One list feeds two things:
//   Weekly System Contracts: the same three for every player each week (Monday to Sunday, daily-seed time). Each pays
//   Echoes the first time it is done that week; doing all three earns a week on the Contract Mark.
//   Run goals: before a world, choose one of three (one of each tier) or none. Met, it pays Echoes and Mastery XP when
//   the run ends, win or lose. Pending World and practice runs take no run goal.
// Every goal is open to every archetype: none asks for a feat that some kit can't do.
//   text:  what players read.  tier: 1 easy, 2 harder, 3 hardest (sets the pay).
//   feat, n: a feat from feats.js, checked when it happens (a fight, a merge, a shop, a path).
//   end:   checked when the run ends instead (core.js reads it: GOAL_ENDS).
//   arch:  'any' builds one goal per starting archetype ("Spare a world as a Pyromancer"), for Contracts only.
//   odds:  what a stake on it pays back, as a multiple, when you meet it as your run goal (set from how often a good
//          player meets it: a sure thing pays little over the stake, a long shot pays up to 3x).
//   board: which Contract slot it can fill: 'fight' (something done in a run) or 'run' (how a run ends).
const GOALS = {
  fast: { text: 'Win a fight within 6 turns', tier: 1, feat: 'fast', n: 6, odds: 1.25, board: 'fight' },
  hard: { text: 'Beat a hard opponent', tier: 1, feat: 'hard', odds: 1.25, board: 'fight' },
  rival: { text: 'Defeat a rival', tier: 1, feat: 'rival', odds: 1.25, board: 'fight' },
  giant: { text: 'Beat an opponent with at least twice your max HP', tier: 1, feat: 'giant', odds: 1.5, board: 'fight' },
  bankrupt: { text: 'Leave a shop with 0 gold', tier: 1, feat: 'bankrupt', odds: 1.25, board: 'fight' },
  path: { text: 'Have the System recognise your path by round 5', tier: 1, feat: 'path', n: 5, odds: 1.25, board: 'fight' },
  healthy: { text: 'Win a fight with more than half your HP', tier: 1, feat: 'healthy', odds: 1.25, board: 'fight' },
  quick: { text: 'Use 3 Quick skills in a single turn', tier: 2, feat: 'quick', n: 3, odds: 2.5, board: 'fight' },
  bighit: { text: 'Land a single hit of 60 or more', tier: 2, feat: 'bighit', n: 60, odds: 1.5, board: 'fight' },
  overkill: { text: 'Finish an opponent with 30 more damage than needed', tier: 2, feat: 'overkill', n: 30, odds: 2, board: 'fight' },
  clutch: { text: 'Win a fight with 10% HP or less', tier: 2, feat: 'clutch', odds: 3, board: 'fight' },
  collector: { text: 'Own three ★2 pieces at once', tier: 2, feat: 'collector', n: 3, odds: 2, board: 'fight' },
  untouched: { text: 'Win a fight without losing any HP', tier: 2, feat: 'untouched', odds: 1.25, board: 'fight' },
  rich: { text: 'End a run holding 30 or more gold', tier: 1, end: 'rich', odds: 2, board: 'run' },
  final: { text: 'Reach the Final', tier: 2, end: 'final', odds: 1.25, board: 'run' },
  level: { text: 'Reach level 6', tier: 2, end: 'level', odds: 1.25, board: 'run' },
  wagers: { text: 'Win 2 wagers in one run', tier: 2, end: 'wagers', odds: 2, board: 'run' },
  spare: { text: 'Spare your world', tier: 3, end: 'spare', odds: 1.25, board: 'run' },
  nohosp: { text: 'Spare a world without visiting the Infirmary', tier: 3, end: 'nohosp', odds: 3, board: 'run' },
  flawless: { text: 'Spare a world without losing a fight', tier: 3, end: 'flawless', odds: 1.5, board: 'run' },
  as: { text: 'Spare a world as a {arch}', tier: 3, end: 'as', arch: 'any', board: 'arch' },
};
// Echoes a Contract pays the first time it is done in its week, by tier
const CONTRACT_ECHOES = { 1: 10, 2: 15, 3: 20 };
// What a met run goal pays when the run ends, by tier: Echoes and Mastery XP (shared like the rest of the run's XP)
// Echoes you can stake on your run goal (it costs them now and pays stake x odds if met; replaces Back yourself)
const GOAL_STAKES = [5, 10, 25];
const GOAL_PAY = { 1: { echoes: 3, xp: 5 }, 2: { echoes: 6, xp: 10 }, 3: { echoes: 10, xp: 15 } };
