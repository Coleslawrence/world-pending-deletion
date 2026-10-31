// ===== [World Pending Deletion] — content: enemy moves =====
'use strict';
// Every enemy move plays one role, read from its effects by moveRole. A new enemy is built from roles (a strike, a
// guard, a big hit it telegraphs, a setup that applies its theme's status, sustain for the long fights), and each
// tier's numbers for those roles live in MOVE_NUMBERS, so a card can say "tier 3: strike, guard, big hit, setup" and
// the checker can tell whether its numbers sit in the tier. Out of range is a warning, not a failure: the balance gate
// (the sims) has the last word on power.
//   strike:  a plain hit
//   big:     a hit big enough to show as a big move (BIG_HIT per tier, before the round's scaling): the one to Block or Stun
//   guard:   Block, no damage
//   setup:   a status, a buff or a trick with little damage behind it
//   sustain: healing or draining
const MOVE_ROLES = { strike: 'a plain hit', big: 'a big hit, the one to Block or Stun', guard: 'Block and nothing else', setup: 'a status, buff or trick with little damage', sustain: 'healing or draining' };
const BIG_HIT = { 1: 18, 2: 16, 3: 14, 4: 20 };
const SETUP_FX = ['burn', 'poison', 'bleed', 'weaken', 'empower', 'evade', 'mirror', 'cleanse', 'stun', 'doublePoison', 'blockDmg'];
function moveDmg(fx) { return (fx.dmg || 0) * (fx.hits || 1); }
function moveRole(fx, tier) {
  if (fx.heal || fx.lifesteal || fx.regen) return 'sustain';
  if (fx.block && !fx.dmg) return 'guard';
  const d = moveDmg(fx);
  if (d >= (BIG_HIT[tier] || BIG_HIT[4])) return 'big';
  if (d <= 8 && SETUP_FX.some(k => fx[k])) return 'setup';
  return 'strike';
}
// Each tier's numbers: hp, damage of a strike and a big hit (all hits together), Block of a guard, and damage per
// turn over the move script (dpt). Ranges hold today's enemies; tighten them as the roster proves itself.
//   tier 1 arena beasts (rounds 1 to 3), tier 2 rivals and the Proctor (rounds 4 to 7), tier 3 Final Champions, tier 4 the Elite bracket
const MOVE_NUMBERS = {
  1: { hp: [36, 60], strike: [3, 12], big: [18, 26], guard: [5, 10], dpt: [3, 10] },
  2: { hp: [50, 80], strike: [5, 14], big: [16, 22], guard: [6, 14], dpt: [2, 11] },
  3: { hp: [80, 110], strike: [4, 13], big: [14, 24], guard: [10, 14], dpt: [4, 11] },
  4: { hp: [140, 200], strike: [6, 18], big: [20, 28], guard: [14, 18], dpt: [7, 15] },
};
// What a tier needs: every enemy a move that deals damage; a Final Champion or Elite fighter something to answer (a big
// hit), outlast (sustain) or play around (a boss trait: enrage, aura, briar, twincast, flood, revive, forge, a phase)
const MOVE_NEEDS = { 1: ['damage'], 2: ['damage'], 3: ['damage', 'big|sustain|trait'], 4: ['damage', 'big|sustain|trait'] };
