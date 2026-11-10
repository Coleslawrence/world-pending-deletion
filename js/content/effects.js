// ===== [World Pending Deletion] — content: the effect registry =====
// Every passive effect the engine reads, in one place, with the words players read for it. Archetype bonuses, gear,
// Hidden Paths, Gifts, Titles, Rank perks, stat milestones, god blessings, enemy passives and the trait pool all declare
// what they do as { key: value } from this list (docs/CONTENT.md, "Building blocks").
//   say(v): the player phrase for that value. Descriptions are written to match it.
//   how: how values from several sources combine: 'add' (the default), 'set' (one source decides), 'mul' (they multiply)
//     or 'min' (the lowest wins).
//   lvl: grows with your level when it comes from gear or an archetype bonus. Gifts and Titles never grow.
//   enemy: 'flat' or 'rate' when enemies can carry it too. Flat amounts scale with the enemy's power; rates don't.
//   theme: the archetype it belongs to, when it belongs to one (an array for a pair).
//   must: a pattern every description using this key has to match, for a rule players couldn't guess from the number.
'use strict';
const EFFECTS = {
  // Damage
  // Experimental (Field Test prototypes in gear.js): mechanics nothing else has yet
  suspend: { how: 'set', say: v => `Your hits are stored and all strike at once every ${v}rd turn, +50%.` },
  swapHp: { how: 'set', say: v => `Once per fight below ${pct(v)} HP, your HP and your opponent's trade places.` },
  echoNext: { how: 'set', say: v => `Every skill plays again next turn at ${pct(v)} power.` },
  countdown: { how: 'set', say: v => `You deal 20% less damage. If a fight reaches turn ${v}, your opponent is deleted.` },
  painLink: { how: 'set', say: () => 'Every hit is split evenly between both fighters.' },
  dmgPct: { say: v => `All your damage +${pct(v)}.`, enemy: 'rate' },
  firstHit: { say: v => v >= 1 ? 'Your first damaging skill each fight deals double.' : `Your first damaging skill each fight deals ${pct(v)} more.` },
  lowHpDmg: { say: v => `Below half HP, deal ${pct(v)} more damage.`, enemy: 'rate' },
  vsBigger: { say: v => `+${pct(v)} damage to opponents with more max HP than you.` },
  vsHard: { say: v => `+${pct(v)} damage to hard opponents.` },
  vsHigherRank: { say: v => `+${pct(v)} damage to opponents of a higher rank than you.` },
  vsDisabled: { say: v => `+${pct(v)} damage to Stunned or Weakened opponents.`, theme: ['reaper', 'storm'] },
  goldDmg: { say: v => `+${pct(v)} damage for every 10 gold you hold when a fight starts, up to +25%.` },
  mighty: { how: 'set', say: v => `Reaper and Stormcaller skills deal ${pct(v)} more.` },
  critBonus: { say: v => `+${pct(v)} critical chance.` },
  critMult: { how: 'set', say: v => `Critical hits deal ×${v} instead of ×1.5.` },
  firstCrit: { how: 'set', say: () => 'Your first hit each fight is critical.' },
  afterQuick: { say: v => `After a Quick skill, your next skill deals ${pct(v)} more.`, theme: 'arcanist' },
  // Defence
  startBlock: { lvl: true, say: v => `Start each fight with ${v} Block.`, enemy: 'flat', theme: 'bastion' },
  startBlockPct: { say: v => `Start each fight with Block equal to ${pct(v)} of your max HP.`, enemy: 'rate', theme: 'bastion' },
  blockKeep: { say: v => `Keep ${pct(v)} of your Block between turns.`, enemy: 'rate', theme: 'bastion' },
  flatDR: { say: v => `Every hit you take deals ${v} less damage.`, enemy: 'flat' },
  lowDR: { how: 'set', say: v => `Below 25% HP, take ${pct(v)} less damage.`, enemy: 'rate' },
  dodge: { say: v => `+${pct(v)} dodge.` },
  firstEvade: { how: 'set', say: () => 'Evade the first attack each fight.' },
  lastWords: { how: 'set', say: v => `Once per fight, dropping below 25% HP gives you Block equal to ${pct(v)} of your max HP.` },
  // Healing
  regen: { lvl: true, say: v => `Heal ${v} at the start of each of your turns.`, enemy: 'flat', theme: 'zealot' },
  healPct: { say: v => `Healing ${v < 0 ? 'is' : '+'}${pct(Math.abs(v))}${v < 0 ? ' weaker' : ''}.`, enemy: 'rate', theme: 'zealot' },
  lifesteal: { say: v => `Heal ${pct(v)} of the damage you deal.`, enemy: 'rate', theme: 'reaper' },
  lowLifesteal: { say: v => `Below half HP, heal ${pct(v)} of the damage you deal.`, theme: 'reaper' },
  hitHeal: { say: v => `Heal ${v} whenever a skill of yours deals damage.`, theme: 'zealot' },
  overhealBlock: { how: 'set', say: () => 'Overhealing becomes Block.', theme: 'zealot' },
  healBlock: { say: v => `Healing also gives Block equal to ${pct(v)} of it.`, theme: ['zealot', 'bastion'] },
  healDmg: { say: v => `Your healing also deals ${pct(v)} of it as damage to the opponent.`, theme: ['reaper', 'zealot'] },
  healPoison: { say: v => `Each skill that heals you also applies ${v} Poison.`, theme: ['venom', 'zealot'] },
  // Burn
  burnPlus: { say: v => `Burn you apply +${v}.`, enemy: 'flat', theme: 'pyre' },
  burnFade: { how: 'min', say: v => v === 0 ? 'Burn on the opponent never fades.' : `Burn on the opponent fades slower (${pct(v)} a turn, not 30%).`, theme: 'pyre' },
  burnHeal: { say: v => `Heal ${pct(v)} of the Burn damage your opponent takes.`, theme: ['pyre', 'zealot'] },
  burnExec: { say: v => `+${pct(v)} damage to Burning opponents below half HP.`, theme: ['pyre', 'reaper'] },
  burnPoison: { say: v => `Whenever you apply Burn, also apply ${v} Poison.`, theme: ['pyre', 'venom'] },
  flareFull: { say: () => 'Toxic Flare ignites all of the Poison, not half.', theme: ['pyre', 'venom'] },
  // Poison
  poisonPlus: { say: v => `Poison you apply +${v}.`, enemy: 'flat', theme: 'venom' },
  poisonMult: { how: 'mul', say: v => `Poison deals ${pct(v - 1)} more damage.`, enemy: 'rate', theme: 'venom' },
  poisonOnHit: { say: v => `Each skill that hits also applies ${v} Poison.`, theme: 'venom' },
  startPoison: { say: v => `Your opponent starts each fight with ${v} Poison.`, theme: 'venom' },
  poisonHeal: { say: v => `Heal ${pct(Math.min(POISON_HEAL_CAP, v))} of Poison damage dealt (max 30% from all sources).`, theme: 'venom', must: /max 30%/ },
  // Bleed
  bleedPlus: { say: v => `Bleed you apply +${v}.`, enemy: 'flat', theme: 'blade' },
  bleedMult: { how: 'set', say: v => v === 2 ? 'Bleed deals double damage.' : `Bleed deals ${pct(v - 1)} more damage.`, enemy: 'rate', theme: 'blade' },
  extraHit: { how: 'set', say: () => 'Multi-hit skills hit once more.', theme: 'blade' },
  healOnBleed: { say: v => `Heal ${v} whenever you apply Bleed.`, theme: ['blade', 'zealot'] },
  bleedHeal: { say: v => `Heal ${pct(v)} of the Bleed damage your opponent takes.`, theme: ['blade', 'reaper'] },
  bleedPoison: { say: v => `Every Bleed you apply also applies ${v} Poison.`, theme: ['blade', 'venom'] },
  hitBurn: { say: v => `Multi-hit skills apply ${v} Burn per hit.`, theme: ['blade', 'pyre'] },
  multiWeaken: { say: v => `Multi-hit skills Weaken the opponent for ${v} turn${v > 1 ? 's' : ''}.`, theme: ['blade', 'storm'] },
  // Any damage over time
  dotPlus: { say: v => `Burn, Poison and Bleed you apply +${v}.`, enemy: 'flat' },
  // Thorns
  thornsAlways: { lvl: true, say: v => `Always have ${v} Thorns, doubled below half HP.`, enemy: 'flat', theme: 'bastion', must: /doubl/ },
  thornMult: { say: v => `Thorns and Riposte deal ${pct(v - 1)} more.`, enemy: 'rate', theme: ['bastion', 'blade'] },
  thornBurn: { say: v => `Thorns also apply ${v} Burn.`, enemy: 'flat', theme: ['bastion', 'pyre'] },
  thornPoison: { say: v => `Thorns also apply ${v} Poison.`, enemy: 'flat', theme: ['bastion', 'venom'] },
  blockThorns: { say: v => `Gaining Block also gives Thorns equal to ${pct(v)} of it.`, theme: 'bastion' },
  blockStrike: { how: 'set', say: v => `Gaining Block also deals ${pct(v)} of it as damage.`, theme: 'bastion' },
  blockDmgPct: { say: v => `Deal ${v}% more damage for every 2 Block you have (up to 40%).`, theme: ['bastion', 'reaper'] },
  blockStun: { say: v => `When your Block absorbs a hit, ${pct(v)} chance to Stun the attacker.`, theme: ['bastion', 'storm'] },
  // Quick skills and cooldowns
  quickCd: { say: v => `Quick skills: ${v} turn shorter cooldown.`, theme: 'arcanist' },
  arcCd: { how: 'set', say: v => `Your other skills: 1 turn shorter cooldown for every ${v} INT (minimum 1).`, theme: 'arcanist' },
  firstFree: { how: 'set', say: () => 'Your first skill each fight has no cooldown.', theme: 'arcanist' },
  quickTwice: { how: 'set', say: () => 'Quick skills cast twice.', theme: 'arcanist' },
  quickFree: { say: v => v > 1 ? `Your first ${v} Quick skills each fight have no cooldown.` : 'Your first Quick skill each fight has no cooldown.', theme: 'arcanist' },
  quickBurn: { say: v => `Quick skills apply ${v} Burn.`, theme: ['arcanist', 'pyre'] },
  quickPoison: { say: v => `Quick skills apply ${v} Poison.`, theme: ['arcanist', 'venom'] },
  quickBlock: { say: v => `Quick skills also give ${v} Block.`, theme: ['arcanist', 'bastion'] },
  quickHeal: { say: v => `Quick skills heal you ${v}.`, theme: ['arcanist', 'zealot'] },
  quickEvade: { say: () => 'Each Quick skill also lets you Evade the next attack.', theme: ['arcanist', 'blade'] },
  quickStun: { say: v => `Damaging Quick skills have a ${pct(v)} chance to Stun.`, theme: ['arcanist', 'storm'] },
  // Execute, Doom and Leech
  vsHalf: { say: v => `Opponents below half HP take ${pct(v)} more damage from you.`, enemy: 'rate', theme: 'reaper' },
  reapPierce: { how: 'set', say: () => 'Your hits ignore the Block of opponents below half HP.', theme: 'reaper' },
  reapBlood: { how: 'set', say: v => `The first time you hit an opponent below half HP, heal ${pct(v)} of your max HP.`, theme: 'reaper' },
  execBonus: { say: v => `+${pct(v)} damage to opponents below 30% HP.`, theme: 'reaper' },
  doomFaster: { how: 'set', say: () => 'Doom lands a turn sooner.', theme: 'reaper' },
  doomLeech: { say: v => `Doom and Leech you apply are ${pct(v)} stronger.`, theme: ['reaper', 'arcanist'] },
  heartOnWin: { how: 'set', say: () => 'Each win restores 1 Heart.', theme: 'reaper' },
  // Stun and Interrupt
  stunDmg: { lvl: true, say: v => `Your Stuns and Interrupts deal ${v} damage.`, theme: 'storm' },
  stormBreak: { how: 'set', say: () => 'Your Stuns and Interrupts add your STR to their damage and shatter Block. Stopping a big attack Empowers you for 2 turns.', theme: 'storm' },
  breakEmpower: { how: 'set', say: v => `Breaking an opponent Empowers you for ${v} turns.`, theme: 'storm' },
  stunWeaken: { how: 'set', say: v => `Your Stuns also Weaken for ${v} turns.`, theme: 'storm' },
  every3Stun: { how: 'set', say: () => 'Every 3rd skill you use Stuns.', theme: 'storm' },
  firstStun: { how: 'set', say: () => 'Your first damaging skill each fight Stuns.', theme: 'storm' },
  stunEmpower: { say: v => `Whenever you Stun or Interrupt, you are Empowered for ${v} turn${v > 1 ? 's' : ''}.`, theme: 'storm' },
  stunBurn: { say: v => `Your Stuns and Interrupts also apply ${v} Burn.`, theme: ['storm', 'pyre'] },
  stunHeal: { say: v => `Your Stuns and Interrupts heal you ${v}.`, theme: ['storm', 'zealot'] },
  weakPoison: { say: v => `Weaken you apply also applies ${v} Poison.`, theme: ['storm', 'venom'] },
  // Dice (Gambler): every die is rolled at the start of your turn and shown on its skill before you pick
  dieMin: { how: 'set', say: v => `Your dice never roll below ${v}.`, theme: 'dicer' },
  rerolls: { say: v => `Start each fight with ${v} reroll${v > 1 ? 's' : ''}. Tap Reroll, then a skill, to reroll its die.`, theme: 'dicer' },
  jackpot: { how: 'set', say: v => `Jackpot: when two of your dice show the same number, both skills are ${pct(v)} stronger.`, theme: 'dicer' },
  rakeReroll: { say: v => `After a Jackpot, gain ${v} reroll${v > 1 ? 's' : ''}.`, theme: 'dicer' },
  firstSix: { how: 'set', say: () => 'Your first die each fight rolls 6.', theme: 'dicer' },
  sixGold: { say: v => `+${v} gold after each win where you rolled a 6.`, theme: 'dicer' },
  // Jinx: Misfortune on the opponent pays to jinx its shown move; Curse on you
  jinxCheap: { say: v => `Jinxing costs ${v} less Misfortune.`, theme: 'jinx' },
  omenPlus: { say: v => `When an Omen fires, it adds ${v} more Misfortune.`, theme: 'jinx' },
  jinxFree: { how: 'set', say: () => 'The first move you jinx each fight costs nothing and gives no Curse.', theme: 'jinx' },
  hitMisf: { say: v => `Hits apply ${v} Misfortune.`, theme: 'jinx' },
  startMisf: { say: v => `Opponents start each fight with ${v} Misfortune.`, theme: 'jinx' },
  curseBlock: { say: v => `Each Curse you take gives you ${v} Block.`, theme: 'jinx' },
  omenWeaken: { how: 'set', say: v => `Omens also Weaken their target for ${v} turns when they fire.`, theme: 'jinx' },
  firstJinx: { how: 'set', say: () => "The opponent's first move each fight goes wrong for them, as if jinxed." },
  startCurse: { say: v => `Start each fight with ${v} Curse.` },
  jinxReroll: { how: 'set', say: () => 'When you jinx a move, reroll all your dice.', theme: ['jinx', 'dicer'] },
  jinxHeal: { say: v => `Jinxing a move heals you ${pct(v)} of your max HP.`, theme: ['jinx', 'zealot'] },
  jinxDoom: { how: 'set', say: () => 'Doom goes off at once when you jinx a move.', theme: ['jinx', 'reaper'] },
  stunMisf: { say: v => `Stunned opponents gain ${v} Misfortune.`, theme: ['jinx', 'storm'] },
  quickMisf: { say: v => `Quick skills apply ${v} Misfortune.`, theme: ['jinx', 'arcanist'] },
  blockMisf: { say: v => `A hit your Block fully stops adds ${v} Misfortune.`, theme: ['jinx', 'bastion'] },
  burnMisf: { say: v => `Burning opponents gain ${v} Misfortune each turn.`, theme: ['jinx', 'pyre'] },
  poisonMisf: { say: v => `Poison deals ${pct(v)} more to opponents with 5 or more Misfortune.`, theme: ['jinx', 'venom'] },
  bleedMisf: { say: v => `Bleed you apply +${v} for every 3 Misfortune.`, theme: ['jinx', 'blade'] },
  quickReroll: { how: 'set', say: () => 'Quick skills reroll your lowest die.', theme: ['dicer', 'arcanist'] },
  sixStun: { how: 'set', say: () => 'A die skill showing 6 also Stuns.', theme: ['dicer', 'storm'] },
  oneMisf: { say: v => `A die that rolls 1 adds ${v} Misfortune to your opponent.`, theme: ['jinx', 'dicer'] },
  misfNoCleanse: { how: 'set', say: v => `Poison on opponents with ${v} or more Misfortune can't be cleansed.`, theme: ['jinx', 'venom'] },
  burnLowDie: { how: 'set', say: () => 'Burn you apply is raised by your lowest die.', theme: ['dicer', 'pyre'] },
  execPip: { say: v => `Execute thresholds rise by ${pct(v)} for each pip on your highest die.`, theme: ['dicer', 'reaper'] },
  jackpotPoison: { say: v => `Jackpots also apply ${v} Poison.`, theme: ['dicer', 'venom'] },
  luckyCut: { how: 'set', say: () => 'A critical hit from a die skill showing 6 hits once more.', theme: ['dicer', 'blade'] },
  ironOdds: { how: 'set', say: () => 'Block from a die skill showing 5 or 6 is doubled.', theme: ['dicer', 'bastion'] },
  savingGrace: { how: 'set', say: () => 'Healing from a die skill showing 6 is doubled.', theme: ['dicer', 'zealot'] },
  chanceBonus: { say: v => `Chance options in events +${v}%.` },
  goldPerWin: { say: v => `+${v} gold after each win.` },
  chanceFloor: { how: 'set', say: v => `Your first chance option each round can't be under ${v}%.` },
  sleeveFix: { how: 'set', say: () => 'Once per fight, a die that rolls 1 becomes a 6.', theme: 'dicer' },
  // Mastery pieces (Phase 5): the effects the pieces earned through Archetype Mastery brought with them
  startBurn: { say: v => `Your opponent starts each fight with ${v} Burn.`, theme: 'pyre' },
  struckPoison: { say: v => `When you are hit, the attacker takes ${v} Poison.`, theme: 'venom' },
  poisonGrow: { say: v => `Poison on your opponent grows by ${v} each turn.`, theme: 'venom' },
  multiBlock: { say: v => `Gain ${v} Block after a multi-hit skill.`, theme: 'blade' },
  twinHit: { how: 'set', say: () => 'Multi-hit skills hit one more time, and each hit deals 1 less.', theme: 'blade' },
  quickDmg: { say: v => `Quick skills that deal damage deal ${v} more.`, theme: 'arcanist' },
  tickDown: { how: 'set', say: () => 'Every 3rd turn, all your cooldowns drop by 1.', theme: 'arcanist' },
  healBreak: { say: v => `Your healing skills also deal ${v} Break.`, theme: 'zealot' },
  relic: { how: 'set', say: v => `Once per fight, dropping below 30% HP heals you ${pct(v)} of your max HP.`, theme: 'zealot' },
  winDmg: { say: v => `+${pct(v)} damage for each fight won this run, up to +12%.`, theme: 'reaper' },
  weakenPlus: { say: v => `Weaken you apply lasts ${v} turn${v > 1 ? 's' : ''} longer.`, theme: 'storm' },
  stunBlock: { say: v => `Gain ${v} Block whenever you Stun or Interrupt.`, theme: 'storm' },
  lowDieUp: { say: v => `Your lowest die each turn shows ${v} more.`, theme: 'dicer' },
  sixBlock: { say: v => `When a turn starts with a 6 among your dice, gain ${v} Block and a reroll.`, theme: 'dicer' },
  nailMisf: { say: v => `Every 3rd damaging skill you use applies ${v} Misfortune.`, theme: 'jinx' },
  curseWard: { say: v => `The first ${v} Curse you would take each fight is ignored.`, theme: 'jinx' },
  // Unfiled designs (designs.js)
  burnBlock: { say: v => `Gain ${v} Block each time Burn on your opponent deals damage.`, theme: ['pyre', 'bastion'] },
  blockWeaken: { how: 'set', say: () => 'When your Block stops a whole hit, the attacker is Weakened for 1 turn.', theme: ['bastion', 'storm'] },
  vsBleed: { say: v => `+${pct(v)} damage to bleeding opponents.`, theme: ['blade', 'reaper'] },
  sixMisf: { say: v => `A die that rolls 6 adds ${v} Misfortune to your opponent.`, theme: ['dicer', 'jinx'] },
  // Reactions
  reactMult: { how: 'mul', say: v => `Reactions are ${pct(v - 1)} stronger.` },
  reactHeal: { how: 'set', say: v => `Toxic Flare and Cauterise heal you ${v}.` },
  // One-off rules
  sluggish: { how: 'set', say: () => 'Start every fight Weakened.' },
  swordSaint: { how: 'set', say: () => 'Your basic Attack becomes S-rank: far stronger, and it ignores Block.' },
  copycat: { how: 'set', say: () => "Once per fight, use the opponent's last move as your own." },
};
// Adds one source's effects to P. lm is the level multiplier, for sources that grow with level (gear, archetype bonuses).
function addEffects(P, p, lm) {
  Object.entries(p || {}).forEach(([k, v]) => {
    const E = EFFECTS[k] || {};
    if (lm && E.lvl) v = Math.round(v * lm);
    if (E.how === 'set') P[k] = v;
    else if (E.how === 'mul') P[k] = (P[k] || 1) * v;
    else if (E.how === 'min') P[k] = P[k] == null ? v : Math.min(P[k], v);
    else P[k] = (P[k] || 0) + v;
  });
  return P;
}
// The player text for a set of effects, one phrase each
function effectText(p) { return Object.entries(p || {}).filter(([k]) => EFFECTS[k] && EFFECTS[k].say).map(([k, v]) => EFFECTS[k].say(v)).join(' '); }
