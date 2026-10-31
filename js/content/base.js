// ===== [World Pending Deletion] — content: shared vocabulary =====
'use strict';
// Content files hold the game's data. They load before core.js (index.html lists them, and core.js loads them
// in the same order under Node), and may use only each other and this file, never core.js.
const STATS = ['STR', 'AGI', 'INT', 'VIT', 'LUK'];
const STAT_INFO = {
  STR: { name: 'Strength', short: 'Reaper and Stormcaller skills, HP' },
  AGI: { name: 'Agility', short: 'Bladedancer and Venom skills, dodge' },
  INT: { name: 'Intelligence', short: 'Pyre and Arcanist skills' },
  VIT: { name: 'Vitality', short: 'HP, Bastion and Zealot skills' },
  LUK: { name: 'Luck', short: 'Critical hits' },
};
// Every stat has three faces. Power: the archetypes whose skills it powers (STAT_INFO above, +7% a point). Finesse: one
// way it makes you better at fighting. Resistance: one enemy status it shrugs off. Faces are for you, not enemies, and
// core.js reads the numbers here (per point of the stat). A new stat names its three faces the same way.
//   finesse.say  the words; tag(n) the short form for n points; the numbers sit beside it (brk, dodge, crit, cdEvery, heal)
//   resist       the status it resists; every point cuts that status's effect on you by RESIST.per, up to RESIST.max
//                (Burn, Poison and Bleed damage, Weaken's damage cut, or the chance a Stun lands)
const RESIST = { per: 0.04, max: 0.6 };
const STAT_FACES = {
  STR: { finesse: { say: 'Fills the break bar 4% faster a point', tag: n => `Break +${n * 4}%`, brk: 0.04 }, resist: 'weaken' },
  AGI: { finesse: { say: '+1% dodge a point', tag: n => `Dodge +${n}%`, dodge: 0.01 }, resist: 'bleed' },
  INT: { finesse: { say: 'Cooldowns of 4 turns or more are 1 turn shorter for every 6 points (never under 3)', tag: n => n < 6 ? 'Long cooldowns −1 at 6' : `Long cooldowns −${Math.floor(n / 6)}`, cdEvery: 6, cdFrom: 4, cdMin: 3 }, resist: 'burn' },
  VIT: { finesse: { say: 'Healing you receive +2% a point', tag: n => `Healing +${n * 2}%`, heal: 0.02 }, resist: 'poison' },
  LUK: { finesse: { say: '+1.5% critical chance a point', tag: n => `Crit +${+(n * 1.5).toFixed(1)}%`, crit: 0.015 }, resist: 'stun' },
};
const RESIST_NAME = { weaken: 'Weaken', bleed: 'Bleed', burn: 'Burn', poison: 'Poison', stun: 'Stun' };
const RESIST_SAY = { weaken: "Weaken's damage cut on you", bleed: 'Bleed damage you take', burn: 'Burn damage you take', poison: 'Poison damage you take', stun: 'The chance a Stun lands on you' };
function resistOf(stats) { const r = {}; STATS.forEach(k => { r[STAT_FACES[k].resist] = Math.min(RESIST.max, RESIST.per * (stats[k] || 0)); }); return r; }
const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

function pct(v) { return Math.round(v * 100) + '%'; }
// Healing from Poison damage (Grave Warden, Grave Shroud, Plague Doctor) adds up to at most this share
const POISON_HEAL_CAP = 0.3;
