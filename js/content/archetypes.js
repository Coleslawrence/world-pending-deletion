// ===== [World Pending Deletion] — content: archetypes =====
'use strict';
// The archetypes are also the game's themes, placed on a fixed grid: every archetype is one stat (what the System
// measured at the Awakening) and one Discipline (how it fights, as the System files it). Archetypes that share a stat
// or a Discipline are allies; every piece of content carries one archetype or two allies. The grid is 5 stats by 5
// Disciplines and never grows, so a new archetype only fills an empty cell and never changes an old one.
//   stat:  the stat that powers its skills (+7% a point)
//   disc:  its Discipline, a key of DISCIPLINES below
//   line:  its philosophy in one sentence, what it wants and how it gets it; every piece of content for it fits the line
//   owns:  the skill effects (fx keys) it owns. A skill may use what its archetype owns, or what an ally owns.
//          Anything not owned (dmg, block) is open to all. A new effect is given an owner here before content uses it;
//          passive effects say their own theme in effects.js
//   words: imagery words for its lore and names, from the lore bible
// Bonuses are cumulative: tier 2 adds to tier 1, and so on. b is what players read for each tier, p what it does
// (effects from effects.js; the ones marked lvl there grow with your level).
const ARCH = {
  pyre: { name: 'Pyre', stat: 'INT', disc: 'bane', theme: 'Burn', path: 'Pyromancer', line: 'Sets a fire and lets it finish the work.', owns: ['burn', 'detonate', 'fuse', 'flash'], words: ['ember', 'ash', 'flame', 'cinder', 'blaze', 'smoke'], b: ['Burn on the opponent fades half as fast.', 'Burn you apply +6.', 'Burn on the opponent never fades.'], p: [{ burnFade: 0.15 }, { burnPlus: 6 }, { burnFade: 0 }] },
  venom: { name: 'Venom', stat: 'AGI', disc: 'bane', theme: 'Poison and drain', path: 'Plaguebringer', line: 'Patient and certain: every turn makes it worse.', owns: ['poison', 'doublePoison', 'malice', 'leech', 'weaken', 'drainPoison', 'fester', 'grim'], words: ['fang', 'rot', 'drip', 'plague', 'patience', 'thorn'], b: ['Poison you apply +1.', 'Poison you apply +1 more.', 'Poison deals 50% more damage.'], p: [{ poisonPlus: 1 }, { poisonPlus: 1 }, { poisonMult: 1.5 }] },
  blade: { name: 'Bladedancer', stat: 'AGI', disc: 'might', theme: 'Bleed and multi-hit', path: 'Bladesinger', line: 'Never stops moving: a hundred cuts beat one.', owns: ['bleed', 'hits', 'perHit', 'mark', 'critBonus', 'cruel', 'riposte', 'evade', 'alwaysCrit', 'nextCrit', 'deepen'], words: ['edge', 'dance', 'cut', 'flurry', 'quick', 'step'], b: ['Multi-hit skills hit once more.', 'Bleed you apply +2.', 'Bleed deals double damage.'], p: [{ extraHit: 1 }, { bleedPlus: 2 }, { bleedMult: 2 }] },
  bastion: { name: 'Bastion', stat: 'VIT', disc: 'ward', theme: 'Block and Thorns', path: 'Bulwark', line: 'Takes the hit, then gives it back.', owns: ['thorns', 'blockDmg', 'riposte', 'keep', 'reflect', 'thornsFight', 'hold', 'vowHeal'], words: ['wall', 'iron', 'shield', 'anvil', 'stand', 'weight'], b: ['Keep 40% of your Block between turns.', 'Always have 6 Thorns, doubled below half HP.', 'Gaining Block also deals half of it as damage.'], p: [{ blockKeep: 0.4 }, { thornsAlways: 6 }, { blockStrike: 0.5 }] },
  arcanist: { name: 'Arcanist', stat: 'INT', disc: 'sway', theme: 'Quick skills and cooldowns', path: 'Archmage', line: 'Does more in a turn than anyone should.', owns: ['focus', 'pierce', 'siphon', 'haste', 'evade', 'interrupt', 'hits', 'mirror', 'again'], words: ['glyph', 'mind', 'spell', 'time', 'trick', 'sky'], b: ['Quick skills: 1 turn shorter cooldown. Your other skills: 1 turn shorter for every 6 INT (minimum 1).', 'Your first skill each fight has no cooldown.', 'Quick skills cast twice.'], p: [{ quickCd: 1, arcCd: 6 }, { firstFree: 1 }, { quickTwice: 1 }] },
  zealot: { name: 'Zealot', stat: 'VIT', disc: 'mend', theme: 'Healing and Regen', path: 'Saint', line: 'Outlasts everything: what cannot be killed cannot lose.', owns: ['heal', 'healMissing', 'regen', 'cleanse', 'fullBlock', 'quench'], words: ['light', 'prayer', 'vow', 'saint', 'tide', 'undying'], b: ['Healing +10%.', 'Heal 2 at the start of each of your turns (grows with level).', 'Overhealing becomes Block.'], p: [{ healPct: 0.1 }, { regen: 2 }, { overhealBlock: 1 }] },
  reaper: { name: 'Reaper', stat: 'STR', disc: 'might', theme: 'Execute, Doom and lifesteal', path: 'Deathbringer', line: 'Ends fights: the wounded have already lost.', owns: ['execute', 'execMult', 'momentum', 'doom', 'doomT', 'lifesteal', 'selfDmg', 'leech', 'empower', 'reapHeal', 'doomExec'], words: ['scythe', 'grave', 'harvest', 'end', 'hollow', 'bone'], b: ['Opponents below half HP take 35% more damage from you, and your hits ignore their Block. The first time you hit an opponent below half HP, heal 15% of your max HP.', 'Heal 30% of the damage you deal.', 'Doom lands a turn sooner, and each win restores 1 Heart.'], p: [{ vsHalf: 0.35, reapPierce: 1, reapBlood: 0.15 }, { lifesteal: 0.3 }, { doomFaster: 1, heartOnWin: 1 }] },
  storm: { name: 'Stormcaller', stat: 'STR', disc: 'sway', theme: 'Stun and Interrupt', path: 'Stormlord', line: "Breaks the enemy's plan before it lands.", owns: ['stun', 'stunIfWeak', 'interrupt', 'weaken', 'empower', 'bigStop'], words: ['thunder', 'lightning', 'crack', 'break', 'sky', 'gale'], b: ['Your Stuns and Interrupts deal 10 damage plus your STR and shatter the opponent\'s Block. Stopping a big attack Empowers you for 2 turns.', 'Your Stuns also Weaken for 3 turns.', 'Every 3rd skill you use Stuns.'], p: [{ stunDmg: 10, stormBreak: 1 }, { stunWeaken: 3 }, { every3Stun: 1 }] },
  dicer: { name: 'Gambler', stat: 'LUK', disc: 'sway', theme: 'Dice, rerolls and Jackpots', path: 'Cardsharp', line: 'Makes its own luck, then bets all of it.', owns: ['die', 'faces', 'shake', 'dmgPip', 'blockPip', 'healPip', 'dieMin', 'dbl', 'snake', 'boxcars', 'bust', 'bustAt', 'dmgAll', 'cashOut', 'progressive', 'reroll', 'setSix', 'rollTwice', 'mark', 'dieStun', 'ride', 'dmgHigh', 'tapOut'], words: ['dice', 'coin', 'card', 'odds', 'stake', 'jackpot'], b: ['Your dice never roll below 2. Heal 25% of the damage you deal.', 'Start each fight with 2 rerolls. Tap Reroll, then a skill, to reroll its die.', 'Jackpot: when two of your dice show the same number, both skills are 50% stronger.'], p: [{ dieMin: 2, lifesteal: 0.25 }, { rerolls: 2 }, { jackpot: 0.5 }] },
  jinx: { name: 'Jinx', stat: 'LUK', disc: 'bane', theme: 'Omens, jinxed moves and Curse', path: 'Hexbringer', line: 'Everything goes wrong, for them. The rest it carries.', owns: ['misf', 'misfT', 'omenAtk', 'omenGuard', 'jinxDisc', 'uncurse', 'passCurse', 'curseDmg', 'curseKeep', 'perMisf', 'perCurse', 'killReset', 'coinStun', 'calamity', 'keepHalf', 'augury', 'portent', 'misfPerBurn', 'curseSelf'], words: ['crow', 'omen', 'mirror', 'curse', 'ladder', 'thirteen'], b: ['Jinxing costs 1 less Misfortune.', 'When an Omen fires, it adds 2 more Misfortune.', 'The first move you jinx each fight costs nothing and gives no Curse.'], p: [{ jinxCheap: 1 }, { omenPlus: 2 }, { jinxFree: 1 }] },
};
// Path evolution: the first time an archetype reaches 6 pieces in a run, its Path evolves into one of two advanced
// classes. The first keeps tier 3 as written above (b[2], p[2]); the second swaps it for its own b and p. The pick
// lasts the run. World Records and pool builds keep the first.
const ADVANCE = {
  pyre: [{ name: 'Everflame' }, { name: 'Cinder Warden', b: 'Thorns also apply 4 Burn. Heal 20% of the Burn damage your opponent takes.', p: { thornBurn: 4, burnHeal: 0.2 } }],
  venom: [{ name: 'Plague Lord' }, { name: 'Blight Leech', b: 'Heal 30% of Poison damage dealt (max 30% from all sources).', p: { poisonHeal: 0.3 } }],
  blade: [{ name: 'Blood Dancer' }, { name: 'Swordmaster', b: '+15% critical chance. Critical hits deal ×2 instead of ×1.5.', p: { critBonus: 0.15, critMult: 2 } }],
  bastion: [{ name: 'Iron Colossus' }, { name: 'Thornguard', b: 'Thorns and Riposte deal 100% more.', p: { thornMult: 2 } }],
  arcanist: [{ name: 'Timeweaver' }, { name: 'Spellblade', b: 'Quick skills: 1 more turn shorter cooldown. After a Quick skill, your next skill deals 30% more.', p: { quickCd: 1, afterQuick: 0.3 } }],
  zealot: [{ name: 'Living Saint' }, { name: 'Undying', b: 'Heal 15% of the damage you deal. Heal 3 at the start of each of your turns.', p: { lifesteal: 0.15, regen: 3 } }],
  reaper: [{ name: 'Harbinger' }, { name: 'Headsman', b: '+50% damage to opponents below 30% HP. The first time you hit an opponent below half HP, heal 15% of your max HP.', p: { execBonus: 0.5, reapBlood: 0.15 } }],
  storm: [{ name: 'Thunderlord' }, { name: 'Tempest', b: 'Whenever you Stun or Interrupt, you are Empowered for 2 turns. Your Stuns and Interrupts deal 10 more damage.', p: { stunEmpower: 2, stunDmg: 10 } }],
  dicer: [{ name: 'Whale' }, { name: 'Card Counter', b: 'Your dice never roll below 3. Start each fight with 1 more reroll.', p: { dieMin: 3, rerolls: 1 } }],
  jinx: [{ name: 'Hexlord' }, { name: 'Doomsayer', b: 'When an Omen fires, it adds 3 more Misfortune and Weakens its target for 2 turns.', p: { omenPlus: 3, omenWeaken: 2 } }],
};
// The tier 3 words and effects a run has for an archetype: its Path evolution's, once picked
function advOf(adv, k) { const i = adv && adv[k] || 0, o = ADVANCE[k] && ADVANCE[k][i]; return o && o.p ? o : { name: ADVANCE[k] ? ADVANCE[k][0].name : null, b: ARCH[k].b[2], p: ARCH[k].p[2] }; }
const ARCH_KEYS = Object.keys(ARCH);
const START_ARCH = ['pyre', 'venom', 'blade', 'bastion', 'zealot', 'reaper'];
// The Disciplines: the grid's columns. A new Discipline is never added; a new archetype takes a free cell.
const DISCIPLINES = {
  ward: { name: 'Ward', line: 'Stops the hit and gives it back.' },
  mend: { name: 'Mend', line: 'Outlasts: heals, drains, recovers.' },
  bane: { name: 'Bane', line: 'Hurts over time and weakens.' },
  sway: { name: 'Sway', line: 'Controls the turn: first, twice, or not at all.' },
  might: { name: 'Might', line: 'Hits hardest and finishes it.' },
};
// An archetype's allies: those sharing its Discipline first, then those sharing its stat, in ARCH order
function themeAllies(k) {
  const a = ARCH[k]; if (!a) return [];
  return ARCH_KEYS.filter(o => o !== k && ARCH[o].disc === a.disc).concat(ARCH_KEYS.filter(o => o !== k && ARCH[o].disc !== a.disc && ARCH[o].stat === a.stat));
}
// The colour pie: which archetypes own each skill effect, from owns above
const PIE = {}; Object.entries(ARCH).forEach(([k, a]) => (a.owns || []).forEach(fx => (PIE[fx] = PIE[fx] || []).push(k)));
// An archetype and its allies on the grid
function themeNear(k) { return [k].concat(themeAllies(k)); }
// Do the themes (one archetype, or two allies) fit together: a pair has to be allies
function themePairOk(themes) { const t = [].concat(themes); return t.length === 1 || (t.length === 2 && themeNear(t[0]).includes(t[1])); }
// May content with these themes use this skill effect: open to all, or owned by one of them or by an ally
function themeFits(themes, fx) { const owners = PIE[fx]; return !owners || owners.some(o => [].concat(themes).some(t => themeNear(t).includes(o))); }
