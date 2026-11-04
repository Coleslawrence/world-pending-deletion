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
const isDmg = d => !!(d.fx.dmg || d.fx.detonate || d.fx.malice || d.fx.blockDmg || d.fx.momentum);
const PREFIXES = {
  swift: { name: 'Swift', desc: '1 turn shorter cooldown.', w: 3, ok: d => d.cd >= 2, apply: d => { d.cd = Math.max(1, d.cd - 1); } },
  heavy: { name: 'Heavy', desc: '+40% power, 1 turn longer cooldown.', w: 3, ok: isDmg, apply: d => { d.powerMult *= 1.4; d.cd += 1; } },
  vampiric: { name: 'Vampiric', desc: 'Heal 25% of the damage dealt.', w: 2, ok: isDmg, apply: d => { d.fx.lifesteal = (d.fx.lifesteal || 0) + 0.25; } },
  searing: { name: 'Searing', desc: 'Also apply 3 Burn.', w: 3, apply: d => { d.fx.xburn = (d.fx.xburn || 0) + 3; } },
  toxic: { name: 'Toxic', desc: 'Also apply 3 Poison.', w: 3, apply: d => { d.fx.xpoison = (d.fx.xpoison || 0) + 3; } },
  serrated: { name: 'Serrated', desc: 'Also apply 3 Bleed.', w: 3, apply: d => { d.fx.xbleed = (d.fx.xbleed || 0) + 3; } },
  piercing: { name: 'Piercing', desc: 'Ignores Block.', w: 2, ok: d => isDmg(d) && !d.fx.pierce, apply: d => { d.fx.pierce = 1; } },
  twin: { name: 'Twin', desc: 'One extra hit.', w: 2, ok: isDmg, apply: d => { if (d.fx.dmg) d.fx.hits = (d.fx.hits || 1) + 1; else d.powerMult *= 1.3; } },
  echoing: { name: 'Echoing', desc: '30% chance to cast twice.', w: 1, ok: d => !d.quick, apply: d => { d.fx.echo = Math.max(d.fx.echo || 0, 0.3); } },
  quick: { name: 'Quick', desc: "Doesn't end your turn, 2 turns longer cooldown.", w: 1, ok: d => !d.quick && !d.basic, apply: d => { d.quick = true; d.cd += 2; } },
  // Glitched prefixes
  duplicated: { name: 'Dupl̷icated', desc: 'Always casts twice. Its cooldown is doubled.', w: 0.5, glitch: true, ok: d => !d.quick && d.cd >= 1, apply: d => { d.fx.echo = 1; d.cd *= 2; } },
  unbound: { name: 'Unbo̷und', desc: 'No cooldown. Using it puts one of your other skills on cooldown.', w: 0.5, glitch: true, player: true, ok: d => !d.quick && d.cd >= 2, apply: d => { d.cd = 0; d.fx.unbound = 1; } },
  misfiled: { name: 'Misf̷iled', desc: 'Also counts as both neighbouring classes on the wheel. 20% less power.', w: 0.5, glitch: true, ok: d => !!(d.tags && d.tags.length), apply: d => { d.powerMult *= 0.8; d.misfiled = true; } },
  overflow: { name: 'Overf̷low', desc: 'Damage past 0 HP from its killing blow carries into your next fight.', w: 0.5, glitch: true, player: true, ok: isDmg, apply: d => { d.fx.overflow = 1; } },
  null: { name: 'Nu̷ll', desc: 'Deals no damage. All of it goes into the break bar instead.', w: 0.5, glitch: true, player: true, ok: d => !!d.fx.dmg && !d.fx.blockDmg && !d.fx.malice && !d.fx.momentum, apply: d => {
    const fx = d.fx, hits = fx.hits || 1;
    fx.brk = (fx.brk || 0) + Math.round(fx.dmg * hits * 1.5);
    if (fx.perHit) ['burn', 'poison', 'bleed'].forEach(k => { if (fx[k]) fx[k] *= hits; });
    delete fx.dmg; delete fx.hits; delete fx.perHit; delete fx.execute; delete fx.cruel;
  } },
  redacted: { name: '[REDACTED]', desc: 'A glitched prefix. Which one is withheld until its first use.', w: 0.5, glitch: true, apply: () => {} },
  // Only the Enchanter's Corrupt gives this
  overclocked: { name: 'Overcl̷ocked', desc: '+30% power.', w: 0, corrupt: true, apply: d => { d.powerMult *= 1.3; } },
};
// The [REDACTED] stand-ins: r_<glitch> works as that glitch and reads as [REDACTED] until it is disclosed
Object.keys(PREFIXES).filter(k => PREFIXES[k].glitch && k !== 'redacted').forEach(k => {
  const P = PREFIXES[k];
  PREFIXES['r_' + k] = Object.assign({}, P, { name: '[REDACTED]', desc: '[Effect withheld. It will be disclosed on first use.]', w: 0, hide: k });
});
const MAX_MODS = 2;
// A corrupted skill holds one more, and takes no more prefixes
const MAX_MODS_CORRUPT = 3;
