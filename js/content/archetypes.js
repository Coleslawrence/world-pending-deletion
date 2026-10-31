// ===== [World Pending Deletion] — content: archetypes =====
'use strict';
// Bonuses are cumulative: tier 2 adds to tier 1, and so on. b is what players read for each tier, p what it does
// (effects from effects.js; the ones marked lvl there grow with your level).
const ARCH = {
  pyre: { name: 'Pyre', stat: 'INT', theme: 'Burn', path: 'Pyromancer', b: ['Burn on the opponent fades half as fast.', 'Burn you apply +4.', 'Burn on the opponent never fades.'], p: [{ burnFade: 0.15 }, { burnPlus: 4 }, { burnFade: 0 }] },
  venom: { name: 'Venom', stat: 'AGI', theme: 'Poison and drain', path: 'Plaguebringer', b: ['Poison you apply +1.', 'Poison you apply +1 more.', 'Poison deals 50% more damage.'], p: [{ poisonPlus: 1 }, { poisonPlus: 1 }, { poisonMult: 1.5 }] },
  blade: { name: 'Bladedancer', stat: 'AGI', theme: 'Bleed and multi-hit', path: 'Bladesinger', b: ['Multi-hit skills hit once more.', 'Bleed you apply +2.', 'Bleed deals double damage.'], p: [{ extraHit: 1 }, { bleedPlus: 2 }, { bleedMult: 2 }] },
  bastion: { name: 'Bastion', stat: 'VIT', theme: 'Block and Thorns', path: 'Bulwark', b: ['Keep 25% of your Block between turns.', 'Always have 4 Thorns, doubled below half HP.', 'Gaining Block also deals half of it as damage.'], p: [{ blockKeep: 0.25 }, { thornsAlways: 4 }, { blockStrike: 0.5 }] },
  arcanist: { name: 'Arcanist', stat: 'INT', theme: 'Quick skills and cooldowns', path: 'Archmage', b: ['Quick skills: 1 turn shorter cooldown. Your other skills: 1 turn shorter for every 8 INT (minimum 1).', 'Your first skill each fight has no cooldown.', 'Quick skills cast twice.'], p: [{ quickCd: 1, arcCd: 8 }, { firstFree: 1 }, { quickTwice: 1 }] },
  zealot: { name: 'Zealot', stat: 'VIT', theme: 'Healing and Regen', path: 'Saint', b: ['Healing +10%.', 'Heal 2 at the start of each of your turns (grows with level).', 'Overhealing becomes Block.'], p: [{ healPct: 0.1 }, { regen: 2 }, { overhealBlock: 1 }] },
  reaper: { name: 'Reaper', stat: 'STR', theme: 'Execute, Doom and lifesteal', path: 'Deathbringer', b: ['Opponents below half HP take 25% more damage from you, and your hits ignore their Block. The first time you hit an opponent below half HP, heal 15% of your max HP.', 'Heal 20% of the damage you deal.', 'Doom lands a turn sooner, and each win restores 1 Heart.'], p: [{ vsHalf: 0.25, reapPierce: 1, reapBlood: 0.15 }, { lifesteal: 0.2 }, { doomFaster: 1, heartOnWin: 1 }] },
  storm: { name: 'Stormcaller', stat: 'STR', theme: 'Stun and Interrupt', path: 'Stormlord', b: ['Your Stuns and Interrupts deal 12 damage plus your STR and shatter the opponent\'s Block. Stopping a big attack Empowers you for 2 turns.', 'Your Stuns also Weaken for 2 turns.', 'Every 3rd skill you use Stuns.'], p: [{ stunDmg: 12, stormBreak: 1 }, { stunWeaken: 2 }, { every3Stun: 1 }] },
};
const ARCH_KEYS = Object.keys(ARCH);
const START_ARCH = ['pyre', 'venom', 'blade', 'bastion', 'zealot', 'reaper'];
// The class wheel: neighbours are allies, opposites are enemies. A run is dealt its home archetype's allies first.
const WHEEL = ['zealot', 'bastion', 'storm', 'arcanist', 'pyre', 'reaper', 'venom', 'blade'];
