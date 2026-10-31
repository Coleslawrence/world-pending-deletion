// ===== [World Pending Deletion] — content: archetypes =====
'use strict';
// The eight archetypes are also the game's themes, laid out on a wheel like a colour pie: neighbours are allies,
// everything further round is an enemy, and every piece of content carries one archetype or two neighbours.
//   line:  its philosophy in one sentence, what it wants and how it gets it; every piece of content for it fits the line
//   owns:  the skill effects (fx keys) it owns. A skill may use what its archetype owns, or what a neighbour owns.
//          Anything not owned (dmg, block) is open to all. A new effect is given an owner here before content uses it;
//          passive effects say their own theme in effects.js
//   words: imagery words for its lore and names, from the lore bible
// Bonuses are cumulative: tier 2 adds to tier 1, and so on. b is what players read for each tier, p what it does
// (effects from effects.js; the ones marked lvl there grow with your level).
const ARCH = {
  pyre: { name: 'Pyre', stat: 'INT', theme: 'Burn', path: 'Pyromancer', line: 'Sets a fire and lets it finish the work.', owns: ['burn', 'detonate'], words: ['ember', 'ash', 'flame', 'cinder', 'blaze', 'smoke'], b: ['Burn on the opponent fades half as fast.', 'Burn you apply +4.', 'Burn on the opponent never fades.'], p: [{ burnFade: 0.15 }, { burnPlus: 4 }, { burnFade: 0 }] },
  venom: { name: 'Venom', stat: 'AGI', theme: 'Poison and drain', path: 'Plaguebringer', line: 'Patient and certain: every turn makes it worse.', owns: ['poison', 'doublePoison', 'malice', 'leech', 'weaken', 'drainPoison'], words: ['fang', 'rot', 'drip', 'plague', 'patience', 'thorn'], b: ['Poison you apply +1.', 'Poison you apply +1 more.', 'Poison deals 50% more damage.'], p: [{ poisonPlus: 1 }, { poisonPlus: 1 }, { poisonMult: 1.5 }] },
  blade: { name: 'Bladedancer', stat: 'AGI', theme: 'Bleed and multi-hit', path: 'Bladesinger', line: 'Never stops moving: a hundred cuts beat one.', owns: ['bleed', 'hits', 'perHit', 'mark', 'critBonus', 'cruel', 'riposte', 'evade', 'alwaysCrit', 'nextCrit'], words: ['edge', 'dance', 'cut', 'flurry', 'quick', 'step'], b: ['Multi-hit skills hit once more.', 'Bleed you apply +2.', 'Bleed deals double damage.'], p: [{ extraHit: 1 }, { bleedPlus: 2 }, { bleedMult: 2 }] },
  bastion: { name: 'Bastion', stat: 'VIT', theme: 'Block and Thorns', path: 'Bulwark', line: 'Takes the hit, then gives it back.', owns: ['thorns', 'blockDmg', 'riposte', 'keep', 'reflect'], words: ['wall', 'iron', 'shield', 'anvil', 'stand', 'weight'], b: ['Keep 25% of your Block between turns.', 'Always have 4 Thorns, doubled below half HP.', 'Gaining Block also deals half of it as damage.'], p: [{ blockKeep: 0.25 }, { thornsAlways: 4 }, { blockStrike: 0.5 }] },
  arcanist: { name: 'Arcanist', stat: 'INT', theme: 'Quick skills and cooldowns', path: 'Archmage', line: 'Does more in a turn than anyone should.', owns: ['focus', 'pierce', 'siphon', 'haste', 'evade', 'interrupt', 'hits', 'mirror'], words: ['glyph', 'mind', 'spell', 'time', 'trick', 'sky'], b: ['Quick skills: 1 turn shorter cooldown. Your other skills: 1 turn shorter for every 8 INT (minimum 1).', 'Your first skill each fight has no cooldown.', 'Quick skills cast twice.'], p: [{ quickCd: 1, arcCd: 8 }, { firstFree: 1 }, { quickTwice: 1 }] },
  zealot: { name: 'Zealot', stat: 'VIT', theme: 'Healing and Regen', path: 'Saint', line: 'Outlasts everything: what cannot be killed cannot lose.', owns: ['heal', 'healMissing', 'regen', 'cleanse'], words: ['light', 'prayer', 'vow', 'saint', 'tide', 'undying'], b: ['Healing +10%.', 'Heal 2 at the start of each of your turns (grows with level).', 'Overhealing becomes Block.'], p: [{ healPct: 0.1 }, { regen: 2 }, { overhealBlock: 1 }] },
  reaper: { name: 'Reaper', stat: 'STR', theme: 'Execute, Doom and lifesteal', path: 'Deathbringer', line: 'Ends fights: the wounded have already lost.', owns: ['execute', 'execMult', 'momentum', 'doom', 'doomT', 'lifesteal', 'selfDmg', 'leech', 'empower'], words: ['scythe', 'grave', 'harvest', 'end', 'hollow', 'bone'], b: ['Opponents below half HP take 35% more damage from you, and your hits ignore their Block. The first time you hit an opponent below half HP, heal 15% of your max HP.', 'Heal 30% of the damage you deal.', 'Doom lands a turn sooner, and each win restores 1 Heart.'], p: [{ vsHalf: 0.35, reapPierce: 1, reapBlood: 0.15 }, { lifesteal: 0.3 }, { doomFaster: 1, heartOnWin: 1 }] },
  storm: { name: 'Stormcaller', stat: 'STR', theme: 'Stun and Interrupt', path: 'Stormlord', line: "Breaks the enemy's plan before it lands.", owns: ['stun', 'stunIfWeak', 'interrupt', 'weaken', 'empower'], words: ['thunder', 'lightning', 'crack', 'break', 'sky', 'gale'], b: ['Your Stuns and Interrupts deal 16 damage plus your STR and shatter the opponent\'s Block. Stopping a big attack Empowers you for 2 turns.', 'Your Stuns also Weaken for 3 turns.', 'Every 3rd skill you use Stuns.'], p: [{ stunDmg: 16, stormBreak: 1 }, { stunWeaken: 3 }, { every3Stun: 1 }] },
};
const ARCH_KEYS = Object.keys(ARCH);
const START_ARCH = ['pyre', 'venom', 'blade', 'bastion', 'zealot', 'reaper'];
// The class wheel: neighbours are allies, opposites are enemies. A run is dealt its home archetype's allies first.
// A new archetype is put into the wheel between the two it borrows from, and the wheel simply grows.
const WHEEL = ['zealot', 'bastion', 'storm', 'arcanist', 'pyre', 'reaper', 'venom', 'blade'];
// The colour pie: which archetypes own each skill effect, from owns above
const PIE = {}; Object.entries(ARCH).forEach(([k, a]) => (a.owns || []).forEach(fx => (PIE[fx] = PIE[fx] || []).push(k)));
// An archetype and its two neighbours on the wheel
function themeNear(k) { const i = WHEEL.indexOf(k), n = WHEEL.length; return i < 0 ? [k] : [k, WHEEL[(i + n - 1) % n], WHEEL[(i + 1) % n]]; }
// Do the themes (one archetype, or two neighbours) fit together: a pair has to be neighbours
function themePairOk(themes) { const t = [].concat(themes); return t.length === 1 || (t.length === 2 && themeNear(t[0]).includes(t[1])); }
// May content with these themes use this skill effect: open to all, or owned by one of them or by a neighbour
function themeFits(themes, fx) { const owners = PIE[fx]; return !owners || owners.some(o => [].concat(themes).some(t => themeNear(t).includes(o))); }
