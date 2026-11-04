// ===== [World Pending Deletion] — content: gear =====
'use strict';
// `pas` values scale with stars; `fix` values don't.
const GEAR = {
  ember_gauntlets: { name: 'Ember Gauntlets', slot: 'weapon', tags: ['pyre'], rank: 'E', stats: { INT: 2 }, pas: { burnPlus: 2 }, text: v => `Burn you apply +${v.burnPlus}.`, flavour: "Leather gloves, always warm, always slightly smoking." },
  serpent_dagger: { name: 'Serpent Dagger', slot: 'weapon', tags: ['venom', 'blade'], rank: 'E', stats: { AGI: 2 }, pas: { poisonOnHit: 1 }, text: v => `Each skill that hits also applies ${v.poisonOnHit} Poison.`, flavour: "The hilt is a coiled snake. The blade sweats green." },
  apprentice_staff: { name: 'Apprentice Staff', slot: 'weapon', tags: ['arcanist'], rank: 'E', stats: { INT: 2 }, pas: { afterQuick: 0.25 }, text: v => `After a Quick skill, your next skill deals ${pct(v.afterQuick)} more.`, flavour: "Notched by a dozen students. The notches still hum." },
  pilgrim_mace: { name: 'Pilgrim Mace', slot: 'weapon', tags: ['zealot'], rank: 'E', stats: { VIT: 1, STR: 1 }, pas: { hitHeal: 2 }, text: v => `Heal ${v.hitHeal} whenever a skill of yours deals damage.`, flavour: "Carried down a long road. Every dent is a prayer answered." },
  duelist_rapier: { name: "Duelist's Rapier", slot: 'weapon', tags: ['blade'], rank: 'D', stats: { AGI: 2 }, pas: { critBonus: 0.1 }, fix: { firstCrit: 1 }, text: v => `+${pct(v.critBonus)} critical chance. Your first hit each fight is critical.`, flavour: "A blade with manners. It always opens with a flourish." },
  executioner_axe: { name: "Executioner's Axe", slot: 'weapon', tags: ['reaper'], rank: 'D', stats: { STR: 2 }, pas: { execBonus: 0.4 }, text: v => `+${pct(v.execBonus)} damage to opponents below 30% HP.`, flavour: "It has only ever been given one kind of work." },
  spiked_buckler: { name: 'Spiked Buckler', slot: 'weapon', tags: ['bastion'], rank: 'D', stats: { VIT: 2 }, pas: { blockThorns: 0.3 }, text: v => `Gaining Block also gives Thorns equal to ${pct(v.blockThorns)} of it.`, flavour: "A small shield for people who dislike being touched." },
  blight_kris: { name: 'Blight Kris', slot: 'weapon', tags: ['venom'], rank: 'E', stats: { AGI: 2 }, pas: { startPoison: 3 }, text: v => `Your opponent starts each fight with ${v.startPoison} Poison.`, flavour: "A wavy blade from the Hollow Kingdom. The rust is not rust." },
  thunder_maul: { name: 'Thunder Maul', slot: 'weapon', tags: ['storm'], rank: 'C', stats: { STR: 2 }, pas: { stunDmg: 6 }, fix: { firstStun: 1 }, text: v => `Your first damaging skill each fight Stuns. Your Stuns deal ${v.stunDmg} damage.`, flavour: "Forged during a storm. It kept some of it." },
  chain_mail: { name: 'Chain Mail', slot: 'armour', tags: ['bastion'], rank: 'E', stats: { VIT: 2 }, pas: { startBlock: 8 }, text: v => `Start each fight with ${v.startBlock} Block.`, flavour: "Ten thousand rings, every one closed by hand." },
  tower_shield: { name: 'Tower Shield', slot: 'armour', tags: ['bastion'], rank: 'D', stats: { VIT: 2 }, pas: { blockKeep: 0.3 }, text: v => `Keep ${pct(v.blockKeep)} of your Block between turns.`, flavour: "You do not carry it so much as stand behind it." },
  shadow_leathers: { name: 'Shadow Leathers', slot: 'armour', tags: ['blade', 'arcanist'], rank: 'D', stats: { AGI: 2 }, pas: { dodge: 0.06 }, fix: { firstEvade: 1 }, text: v => `+${pct(v.dodge)} dodge. Evade the first attack each fight.`, flavour: "Dyed so dark that the eye slides off them." },
  cinder_robe: { name: 'Cinder Robe', slot: 'armour', tags: ['pyre', 'zealot'], rank: 'D', stats: { INT: 1, VIT: 1 }, pas: { burnHeal: 0.3 }, text: v => `Heal ${pct(v.burnHeal)} of the Burn damage your opponent takes.`, flavour: "Woven with ash. It drinks the warmth of any nearby fire." },
  conductive_mail: { name: 'Conductive Mail', slot: 'armour', tags: ['storm', 'bastion'], rank: 'D', stats: { VIT: 2 }, pas: { stunEmpower: 1 }, text: v => `Whenever you Stun or Interrupt, you are Empowered for ${v.stunEmpower} turn${v.stunEmpower > 1 ? 's' : ''}.`, flavour: "Copper links. You can taste the lightning when it lands." },
  templar_plate: { name: 'Templar Plate', slot: 'armour', tags: ['zealot', 'bastion'], rank: 'C', stats: { VIT: 3 }, pas: { healBlock: 0.3 }, text: v => `Healing also gives Block equal to ${pct(v.healBlock)} of it.`, flavour: "Each plate is engraved with a vow nobody remembers making." },
  grave_shroud: { name: 'Grave Shroud', slot: 'armour', tags: ['venom', 'reaper'], rank: 'C', stats: { VIT: 2 }, pas: { poisonHeal: 0.2 }, text: v => `Heal ${pct(Math.min(POISON_HEAL_CAP, v.poisonHeal))} of Poison damage dealt (max 30% from all sources).`, flavour: "Taken from a barrow in the Hollow Kingdom. The owner did not object." },
  prayer_beads: { name: 'Prayer Beads', slot: 'accessory', tags: ['zealot'], rank: 'E', stats: { VIT: 1 }, pas: { regen: 3 }, text: v => `Heal ${v.regen} at the start of each of your turns.`, flavour: "Worn smooth by someone else's fingers first." },
  bloodstone_amulet: { name: 'Bloodstone Amulet', slot: 'accessory', tags: ['blade', 'zealot'], rank: 'C', stats: { VIT: 1 }, pas: { healOnBleed: 3 }, text: v => `Heal ${v.healOnBleed} whenever you apply Bleed.`, flavour: "A red stone that warms whenever blood is spilled near it." },
  crown_of_thorns: { name: 'Crown of Thorns', slot: 'accessory', tags: ['bastion'], rank: 'C', stats: { VIT: 1 }, pas: { thornsAlways: 3 }, text: v => `Always have ${v.thornsAlways} Thorns, doubled below half HP.`, flavour: "Uncomfortable for you. Much worse for anyone who touches you." },
  hourglass: { name: 'Hourglass Pendant', slot: 'accessory', tags: ['arcanist'], rank: 'C', stats: { INT: 1 }, pas: { quickFree: 1 }, text: v => v.quickFree > 1 ? `Your first ${v.quickFree} Quick skills each fight have no cooldown.` : 'Your first Quick skill each fight has no cooldown.', flavour: "The sand falls slower when you need it to." },
  storm_ring: { name: 'Stormcaller Ring', slot: 'accessory', tags: ['storm'], rank: 'C', stats: { STR: 1 }, pas: { stunDmg: 10 }, text: v => `Your Stuns and Interrupts deal ${v.stunDmg} damage.`, flavour: "Blackened iron that crackles before every storm." },
  soul_lantern: { name: 'Soul Lantern', slot: 'accessory', tags: ['reaper'], rank: 'B', stats: { STR: 1, LUK: 1 }, pas: { lowLifesteal: 0.25 }, text: v => `Below half HP, heal ${pct(v.lowLifesteal)} of the damage you deal.`, flavour: "The light inside it was someone, once." },
  plague_censer: { name: 'Plague Censer', slot: 'accessory', tags: ['venom', 'pyre'], rank: 'A', stats: { INT: 2 }, pas: { burnPoison: 2 }, text: v => `Whenever you apply Burn, also apply ${v.burnPoison} Poison.`, flavour: "Swung like a temple censer. The smoke is not incense." },
  misers_ring: { name: "Miser's Ring", slot: 'accessory', tags: ['venom', 'blade', 'arcanist'], rank: 'C', stats: { LUK: 1 }, pas: { goldDmg: 0.05 }, text: v => `+${pct(v.goldDmg)} damage for every 10 gold you hold when a fight starts, up to +25%.`, flavour: "Heavy, cold and always asking how much you have." },
  croupiers_rake: { name: "Croupier's Rake", slot: 'weapon', tags: ['dicer'], rank: 'E', stats: { LUK: 2 }, pas: { rakeReroll: 1 }, text: v => `After a Jackpot, gain ${v.rakeReroll} reroll${v.rakeReroll > 1 ? 's' : ''}.`, flavour: "It sweeps the table clean. It always sweeps toward you." },
  weighted_dice: { name: 'Weighted Dice', slot: 'accessory', tags: ['dicer'], rank: 'E', stats: { LUK: 2 }, pas: {}, fix: { firstSix: 1 }, text: () => 'Your first die each fight rolls 6.', flavour: "A pair of bone dice. One of them is heavier than it looks." },
  gilded_coin: { name: 'Gilded Coin', slot: 'accessory', tags: ['dicer', 'arcanist'], rank: 'D', stats: { LUK: 1, INT: 1 }, pas: { sixGold: 1 }, text: v => `+${v.sixGold} gold after each win where you rolled a 6.`, flavour: "Gold on the outside. Nobody has checked the inside." },
  sharps_sleeve: { name: "Cardsharp's Sleeve", slot: 'armour', tags: ['dicer'], rank: 'C', stats: { LUK: 2, AGI: 1 }, pas: {}, fix: { sleeveFix: 1 }, text: () => 'Once per fight, a die that rolls 1 becomes a 6.', flavour: "Deep pockets, sewn by someone who has done this before." },
  // Glitched gear (glitch: true): only ever offered as a rare glitch in the gear shop, and buying one raises the System's
  // notice. rolling: its passive is another gear piece's, re-rolled after every fight (kept on the piece as roll).
  missingno: { name: 'Missin\u0337gNo.', slot: 'accessory', tags: [], rank: 'B', glitch: true, rolling: true, stats: { LUK: 2 }, pas: {}, text: () => "Works as another gear piece's passive, re-rolled after every fight.", flavour: '[Known issue: item data unreadable. Please do not equip.]' },
};
const GEAR_SLOTS = ['weapon', 'armour', 'accessory'];
// Spliced gear: two real pieces stitched into one glitched piece, id 'x_<a>__<b>'. It has both passives, the slot of the
// first, both pieces' class tags, and a stat line from neither. Made on demand, so saved runs and records register theirs.
function spliceId(a, b) { return 'x_' + a + '__' + b; }
function spliceGear(id) {
  if (GEAR[id]) return GEAR[id];
  const m = /^x_(\w+?)__(\w+)$/.exec(id || ''), A = m && GEAR[m[1]], B = m && GEAR[m[2]];
  if (!A || !B || A.glitch || B.glitch || m[1] === m[2]) return null;
  const words = n => n.replace(/^The /, '').split(' '), a = words(A.name), b = words(B.name);
  const name = (a[0] !== b[b.length - 1] ? a[0] + ' ' + b[b.length - 1] : A.name) + ' [Spliced]';
  const used = Object.keys(A.stats).concat(Object.keys(B.stats)), free = STATS.filter(k => !used.includes(k));
  const total = Math.max(Object.values(A.stats).reduce((x, y) => x + y, 0), Object.values(B.stats).reduce((x, y) => x + y, 0));
  const stats = {}; for (let i = 0; i < total; i++) { const k = free[i % Math.min(2, free.length)]; stats[k] = (stats[k] || 0) + 1; }
  const pas = Object.assign({}, A.pas); Object.entries(B.pas || {}).forEach(([k, v]) => pas[k] = (pas[k] || 0) + v);
  const rank = RANKS[Math.max(RANKS.indexOf(A.rank), RANKS.indexOf(B.rank))];
  GEAR[id] = { name, slot: A.slot, tags: [...new Set(A.tags.concat(B.tags))], rank, glitch: true, splice: [m[1], m[2]], stats, pas, fix: Object.assign({}, A.fix, B.fix),
    text: v => A.text(v) + ' ' + B.text(v), flavour: '[Known issue: this item has two owners. Both passives apply.]' };
  return GEAR[id];
}
