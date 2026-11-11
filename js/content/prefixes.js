// ===== [World Pending Deletion] — content: prefixes (runes) =====
// A prefix is carved into a skill at the Enchanter or picked from a rune. A skill holds up to MAX_MODS of them, and each
// raises its rank by one.
//   name, desc: what the player reads. desc says what changes, in the same words the skill preview uses.
//   w: how often it is offered (weighted draw). Order is append-only: the draw reads this list in order.
//   ok(d): which skills can take it (d is the skill's definition). Leave it out for "any skill but a basic".
//   apply(d): changes a copy of the skill's definition: d.cd, d.quick, d.powerMult and d.fx (the skill's effects).
//   glitch: a glitched prefix (the System's own data gone wrong): stronger, but it breaks one rule. Offered only on runes
//     and at the Enchanter, only where glitches are on (never in Pending World except on glitch day), and carving one
//     raises the System's notice. Their names carry one corrupted letter.
//   player: the engine only acts on it for the player (an Entrant record fighting you drops it).
//   hide: a [REDACTED] stand-in for that glitched prefix, not offered; it is disclosed (swapped for the real one) after
//     the skill's first use in a fight.
//   corrupt: only the Enchanter's Corrupt gives it; never offered.
'use strict';
// Riders scale with the skill they sit on (Slaw, 11 Nov): so much per turn of its cooldown, at least 1 turn. A slow,
// heavy skill makes a better home for them than a quick jab, so where a prefix goes is a choice.
const perCd = (d, n) => n * Math.max(1, d.cd);
const isDmg = d => !!(d.fx.dmg || d.fx.detonate || d.fx.malice || d.fx.blockDmg || d.fx.momentum);
const PREFIXES = {
  swift: { name: 'Swift', desc: '1 turn shorter cooldown.', w: 3, ok: d => d.cd >= 2, apply: d => { d.cd = Math.max(1, d.cd - 1); } },
  heavy: { name: 'Heavy', desc: '+40% power, 1 turn longer cooldown.', w: 3, ok: isDmg, apply: d => { d.powerMult *= 1.4; d.cd += 1; } },
  vampiric: { name: 'Vampiric', desc: 'Heal 25% of the damage dealt.', w: 2, ok: isDmg, apply: d => { d.fx.lifesteal = (d.fx.lifesteal || 0) + 0.25; } },
  searing: { name: 'Searing', desc: 'Also apply 3 Burn per turn of cooldown.', w: 3, apply: d => { d.fx.xburn = (d.fx.xburn || 0) + perCd(d, 3); } },
  toxic: { name: 'Toxic', desc: 'Also apply 3 Poison per turn of cooldown.', w: 3, apply: d => { d.fx.xpoison = (d.fx.xpoison || 0) + perCd(d, 3); } },
  serrated: { name: 'Serrated', desc: 'Also apply 3 Bleed per turn of cooldown.', w: 3, apply: d => { d.fx.xbleed = (d.fx.xbleed || 0) + perCd(d, 3); } },
  piercing: { name: 'Piercing', desc: 'Ignores Block.', w: 2, ok: d => isDmg(d) && !d.fx.pierce, apply: d => { d.fx.pierce = 1; } },
  twin: { name: 'Twin', desc: 'One extra hit.', w: 2, ok: isDmg, apply: d => { if (d.fx.dmg) d.fx.hits = (d.fx.hits || 1) + 1; else d.powerMult *= 1.3; } },
  echoing: { name: 'Echoing', desc: '30% chance to cast twice.', w: 1, ok: d => !d.quick, apply: d => { d.fx.echo = Math.max(d.fx.echo || 0, 0.3); } },
  quick: { name: 'Quick', desc: "Doesn't end your turn, 2 turns longer cooldown.", w: 1, ok: d => !d.quick && !d.basic, apply: d => { d.quick = true; d.cd += 2; } },
  // Glitched prefixes
  duplicated: { name: 'Dupl̷icated', desc: 'Always casts twice. Its cooldown is doubled.', w: 0.5, glitch: true, ok: d => !d.quick && d.cd >= 1, apply: d => { d.fx.echo = 1; d.cd *= 2; } },
  unbound: { name: 'Unbo̷und', desc: 'No cooldown. Using it puts one of your other skills on cooldown.', w: 0.5, glitch: true, player: true, ok: d => !d.quick && d.cd >= 2, apply: d => { d.cd = 0; d.fx.unbound = 1; } },
  misfiled: { name: 'Misf̷iled', desc: 'Also counts as its class\'s allies. 20% less power.', w: 0.5, glitch: true, ok: d => !!(d.tags && d.tags.length), apply: d => { d.powerMult *= 0.8; d.misfiled = true; } },
  overflow: { name: 'Overf̷low', desc: 'Damage past 0 HP from its killing blow carries into your next fight.', w: 0.5, glitch: true, player: true, ok: isDmg, apply: d => { d.fx.overflow = 1; } },
  null: { name: 'Nu̷ll', desc: 'Deals no damage. All of it goes into their guard instead.', w: 0.5, glitch: true, player: true, ok: d => !!d.fx.dmg && !d.fx.blockDmg && !d.fx.malice && !d.fx.momentum, apply: d => {
    const fx = d.fx, hits = fx.hits || 1;
    fx.brk = (fx.brk || 0) + Math.round(fx.dmg * hits * 1.5);
    if (fx.perHit) ['burn', 'poison', 'bleed'].forEach(k => { if (fx[k]) fx[k] *= hits; });
    delete fx.dmg; delete fx.hits; delete fx.perHit; delete fx.execute; delete fx.cruel;
  } },
  redacted: { name: '[REDACTED]', desc: 'A glitched prefix. Which one is withheld until its first use.', w: 0.5, glitch: true, apply: () => {} },
  // Only the Enchanter's Corrupt gives this
  overclocked: { name: 'Overcl̷ocked', desc: '+30% power.', w: 0, corrupt: true, apply: d => { d.powerMult *= 1.3; } },
  // Gap prefixes: one for each effect that had none
  guarded: { name: 'Guarded', desc: 'Also gain 6 Block per turn of cooldown.', w: 2, ok: d => !d.fx.block, apply: d => { d.fx.block = perCd(d, 6); } },
  crippling: { name: 'Crippling', desc: 'Weaken the opponent for 1 turn.', w: 2, ok: d => !isDmg(d) && !d.fx.weaken, apply: d => { d.fx.weaken = 1; } },
  marking: { name: 'Marking', desc: 'Mark the opponent for 2 turns.', w: 2, ok: d => !d.fx.mark, apply: d => { d.fx.mark = 2; } },
  shattering: { name: 'Shattering', desc: 'Also Break 6 per turn of cooldown.', w: 2, ok: isDmg, apply: d => { d.fx.brk = (d.fx.brk || 0) + perCd(d, 6); } },
  mending: { name: 'Mending', desc: 'Heal 2 per turn of cooldown at the start of your next 3 turns.', w: 2, ok: d => !d.fx.regen, apply: d => { d.fx.regen = perCd(d, 2); } },
  hexing: { name: 'Hexing', desc: 'Also apply 2 Misfortune per turn of cooldown.', w: 2, apply: d => { d.fx.misf = (d.fx.misf || 0) + perCd(d, 2); } },
  purifying: { name: 'Purifying', desc: 'Remove your Burn, Poison, Bleed and Weaken.', w: 2, ok: d => !d.fx.cleanse, apply: d => { d.fx.cleanse = 1; } },
  evasive: { name: 'Evasive', desc: 'Dodge the next hit.', w: 2, ok: d => !d.fx.evade, apply: d => { d.fx.evade = 1; } },
  // Class prefixes: only skills of that class can take them
  kindled: { name: 'Kindled', desc: '50% more Burn.', w: 2, ok: d => (d.tags || []).includes('pyre') && !!d.fx.burn, apply: d => { d.fx.burn = Math.round(d.fx.burn * 1.5); } },
  virulent: { name: 'Virulent', desc: '50% more Poison.', w: 2, ok: d => (d.tags || []).includes('venom') && !!d.fx.poison, apply: d => { d.fx.poison = Math.round(d.fx.poison * 1.5); } },
  keen: { name: 'Keen', desc: '+15% critical chance.', w: 2, ok: d => (d.tags || []).includes('blade') && !!d.fx.dmg, apply: d => { d.fx.critBonus = (d.fx.critBonus || 0) + 0.15; } },
  stalwart: { name: 'Stalwart', desc: '50% more Block.', w: 2, ok: d => (d.tags || []).includes('bastion') && !!d.fx.block, apply: d => { d.fx.block = Math.round(d.fx.block * 1.5); } },
  blessed: { name: 'Blessed', desc: '50% more healing.', w: 2, ok: d => (d.tags || []).includes('zealot') && !!(d.fx.heal || d.fx.regen), apply: d => { if (d.fx.heal) d.fx.heal = Math.round(d.fx.heal * 1.5); if (d.fx.regen) d.fx.regen = Math.round(d.fx.regen * 1.5); } },
  focused: { name: 'Focused', desc: 'Your next damaging skill deals 25% more.', w: 2, ok: d => (d.tags || []).includes('arcanist') && !d.fx.focus, apply: d => { d.fx.focus = 0.25; } },
  reaping: { name: 'Reaping', desc: '50% more damage to an opponent below 30% HP.', w: 2, ok: d => (d.tags || []).includes('reaper') && !!d.fx.dmg && !d.fx.execute, apply: d => { d.fx.execute = 0.3; d.fx.execMult = 1.5; } },
  jolting: { name: 'Jolting', desc: 'If the opponent is Weakened, Stun them.', w: 2, ok: d => (d.tags || []).includes('storm') && isDmg(d) && !d.fx.stunIfWeak, apply: d => { d.fx.stunIfWeak = 1; } },
  loaded: { name: 'Loaded', desc: 'Its die never rolls below 3.', w: 2, ok: d => (d.tags || []).includes('dicer') && !!d.fx.die && !d.fx.dieMin, apply: d => { d.fx.dieMin = 3; } },
  ominous: { name: 'Ominous', desc: 'Also leave an Omen: 6 damage per turn of cooldown when they next attack.', w: 2, ok: d => (d.tags || []).includes('jinx') && !d.fx.omenAtk, apply: d => { d.fx.omenAtk = perCd(d, 6); } },
  // Trade-off prefixes: stronger, with a cost
  reckless: { name: 'Reckless', desc: '+50% power. Costs 4 HP.', w: 1.5, ok: isDmg, apply: d => { d.powerMult *= 1.5; d.fx.selfDmg = (d.fx.selfDmg || 0) + 4; } },
  hasty: { name: 'Hasty', desc: '2 turns shorter cooldown, 30% less power.', w: 1.5, ok: d => d.cd >= 3, apply: d => { d.cd = Math.max(1, d.cd - 2); d.powerMult *= 0.7; } },
  ponderous: { name: 'Ponderous', desc: '+80% power, 2 turns longer cooldown.', w: 1.5, ok: d => !d.quick, apply: d => { d.powerMult *= 1.8; d.cd += 2; } },
  wild: { name: 'Wild', desc: '50% chance to cast twice, 2 turns longer cooldown.', w: 1.5, ok: d => !d.quick, apply: d => { d.fx.echo = Math.max(d.fx.echo || 0, 0.5); d.cd += 2; } },
  thirsting: { name: 'Thirsting', desc: 'Heal 50% of the damage dealt, 25% less power.', w: 1.5, ok: isDmg, apply: d => { d.fx.lifesteal = (d.fx.lifesteal || 0) + 0.5; d.powerMult *= 0.75; } },
  bloodbound: { name: 'Bloodbound', desc: 'Ignores Block. Costs 6 HP.', w: 1.5, ok: d => isDmg(d) && !d.fx.pierce, apply: d => { d.fx.pierce = 1; d.fx.selfDmg = (d.fx.selfDmg || 0) + 6; } },
  hollow: { name: 'Hollow', desc: "Doesn't end your turn, 40% less power.", w: 1.5, ok: d => !d.quick && !d.basic, apply: d => { d.quick = true; d.powerMult *= 0.6; } },
  weighty: { name: 'Weighty', desc: '1 turn longer cooldown. Also Break 8 per turn of cooldown.', w: 1.5, ok: isDmg, apply: d => { d.cd += 1; d.fx.brk = (d.fx.brk || 0) + perCd(d, 8); } },
};
// The [REDACTED] stand-ins: r_<glitch> works as that glitch and reads as [REDACTED] until it is disclosed
Object.keys(PREFIXES).filter(k => PREFIXES[k].glitch && k !== 'redacted').forEach(k => {
  const P = PREFIXES[k];
  PREFIXES['r_' + k] = Object.assign({}, P, { name: '[REDACTED]', desc: '[Effect withheld. It will be disclosed on first use.]', w: 0, hide: k });
});
const MAX_MODS = 2;
// A corrupted skill holds one more, and takes no more prefixes
const MAX_MODS_CORRUPT = 3;
