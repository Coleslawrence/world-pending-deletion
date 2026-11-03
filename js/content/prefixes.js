// ===== [World Pending Deletion] — content: prefixes (runes) =====
// A prefix is carved into a skill at the Enchanter or picked from a rune. A skill holds up to MAX_MODS of them, and each
// raises its rank by one.
//   name, desc: what the player reads. desc says what changes, in the same words the skill preview uses.
//   w: how often it is offered (weighted draw). Order is append-only: the draw reads this list in order.
//   ok(d): which skills can take it (d is the skill's definition). Leave it out for "any skill but a basic".
//   apply(d): changes a copy of the skill's definition: d.cd, d.quick, d.powerMult and d.fx (the skill's effects).
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
  echoing: { name: 'Echoing', desc: '30% chance to cast twice.', w: 1, ok: d => !d.quick, apply: d => { d.fx.echo = 0.3; } },
  quick: { name: 'Quick', desc: "Doesn't end your turn, 2 turns longer cooldown.", w: 1, ok: d => !d.quick && !d.basic, apply: d => { d.quick = true; d.cd += 2; } },
};
const MAX_MODS = 2;
