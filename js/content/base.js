// ===== [World Pending Deletion] — content: shared vocabulary =====
'use strict';
// Content files hold the game's data. They load before core.js (index.html lists them, and core.js loads them
// in the same order under Node), and may use only each other and this file, never core.js.
const STATS = ['STR', 'AGI', 'INT', 'VIT', 'LUK'];
const STAT_INFO = {
  STR: { name: 'Strength', short: 'Reaper and Stormcaller skills, some HP' },
  AGI: { name: 'Agility', short: 'Bladedancer and Venom skills, dodge' },
  INT: { name: 'Intelligence', short: 'Pyre and Arcanist skills' },
  VIT: { name: 'Vitality', short: 'HP, Bastion and Zealot skills' },
  LUK: { name: 'Luck', short: 'Critical hits' },
};
const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

function pct(v) { return Math.round(v * 100) + '%'; }
// Healing from Poison damage (Grave Warden, Grave Shroud, Plague Doctor) adds up to at most this share
const POISON_HEAL_CAP = 0.3;
