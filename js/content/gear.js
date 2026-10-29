// ===== [World Pending Deletion] — content: gear =====
'use strict';
// `pas` values scale with stars; `fix` values don't.
const GEAR = {
  ember_gauntlets: { name: 'Ember Gauntlets', slot: 'weapon', tags: ['pyre'], rank: 'E', stats: { INT: 2 }, pas: { burnPlus: 2 }, text: v => `Burn you apply +${v.burnPlus}.` },
  serpent_dagger: { name: 'Serpent Dagger', slot: 'weapon', tags: ['venom', 'blade'], rank: 'E', stats: { AGI: 2 }, pas: { poisonOnHit: 1 }, text: v => `Each skill that hits also applies ${v.poisonOnHit} Poison.` },
  apprentice_staff: { name: 'Apprentice Staff', slot: 'weapon', tags: ['arcanist'], rank: 'E', stats: { INT: 2 }, pas: { afterQuick: 0.25 }, text: v => `After a Quick skill, your next skill deals ${pct(v.afterQuick)} more.` },
  pilgrim_mace: { name: 'Pilgrim Mace', slot: 'weapon', tags: ['zealot'], rank: 'E', stats: { VIT: 1, STR: 1 }, pas: { hitHeal: 2 }, text: v => `Heal ${v.hitHeal} whenever a skill of yours deals damage.` },
  duelist_rapier: { name: "Duelist's Rapier", slot: 'weapon', tags: ['blade'], rank: 'D', stats: { AGI: 2 }, pas: { critBonus: 0.1 }, fix: { firstCrit: 1 }, text: v => `+${pct(v.critBonus)} critical chance. Your first hit each fight is critical.` },
  executioner_axe: { name: "Executioner's Axe", slot: 'weapon', tags: ['reaper'], rank: 'D', stats: { STR: 2 }, pas: { execBonus: 0.4 }, text: v => `+${pct(v.execBonus)} damage to opponents below 30% HP.` },
  spiked_buckler: { name: 'Spiked Buckler', slot: 'weapon', tags: ['bastion'], rank: 'D', stats: { VIT: 2 }, pas: { blockThorns: 0.3 }, text: v => `Gaining Block also gives Thorns equal to ${pct(v.blockThorns)} of it.` },
  blight_kris: { name: 'Blight Kris', slot: 'weapon', tags: ['venom'], rank: 'E', stats: { AGI: 2 }, pas: { startPoison: 3 }, text: v => `Your opponent starts each fight with ${v.startPoison} Poison.` },
  thunder_maul: { name: 'Thunder Maul', slot: 'weapon', tags: ['storm'], rank: 'C', stats: { STR: 2 }, pas: { stunDmg: 6 }, fix: { firstStun: 1 }, text: v => `Your first damaging skill each fight Stuns. Your Stuns deal ${v.stunDmg} damage.` },
  chain_mail: { name: 'Chain Mail', slot: 'armour', tags: ['bastion'], rank: 'E', stats: { VIT: 2 }, pas: { startBlock: 8 }, text: v => `Start each fight with ${v.startBlock} Block.` },
  tower_shield: { name: 'Tower Shield', slot: 'armour', tags: ['bastion'], rank: 'D', stats: { VIT: 2 }, pas: { blockKeep: 0.3 }, text: v => `Keep ${pct(v.blockKeep)} of your Block between turns.` },
  shadow_leathers: { name: 'Shadow Leathers', slot: 'armour', tags: ['blade', 'arcanist'], rank: 'D', stats: { AGI: 2 }, pas: { dodge: 0.06 }, fix: { firstEvade: 1 }, text: v => `+${pct(v.dodge)} dodge. Evade the first attack each fight.` },
  cinder_robe: { name: 'Cinder Robe', slot: 'armour', tags: ['pyre', 'zealot'], rank: 'D', stats: { INT: 1, VIT: 1 }, pas: { burnHeal: 0.3 }, text: v => `Heal ${pct(v.burnHeal)} of the Burn damage your opponent takes.` },
  conductive_mail: { name: 'Conductive Mail', slot: 'armour', tags: ['storm', 'bastion'], rank: 'D', stats: { VIT: 2 }, pas: { stunEmpower: 1 }, text: v => `Whenever you Stun or Interrupt, you are Empowered for ${v.stunEmpower} turn${v.stunEmpower > 1 ? 's' : ''}.` },
  templar_plate: { name: 'Templar Plate', slot: 'armour', tags: ['zealot', 'bastion'], rank: 'C', stats: { VIT: 3 }, pas: { healBlock: 0.3 }, text: v => `Healing also gives Block equal to ${pct(v.healBlock)} of it.` },
  grave_shroud: { name: 'Grave Shroud', slot: 'armour', tags: ['venom', 'reaper'], rank: 'C', stats: { VIT: 2 }, pas: { poisonHeal: 0.2 }, text: v => `Heal ${pct(Math.min(POISON_HEAL_CAP, v.poisonHeal))} of Poison damage dealt (max 30% from all sources).` },
  prayer_beads: { name: 'Prayer Beads', slot: 'accessory', tags: ['zealot'], rank: 'E', stats: { VIT: 1 }, pas: { regen: 3 }, text: v => `Heal ${v.regen} at the start of each of your turns.` },
  bloodstone_amulet: { name: 'Bloodstone Amulet', slot: 'accessory', tags: ['blade', 'zealot'], rank: 'C', stats: { VIT: 1 }, pas: { healOnBleed: 3 }, text: v => `Heal ${v.healOnBleed} whenever you apply Bleed.` },
  crown_of_thorns: { name: 'Crown of Thorns', slot: 'accessory', tags: ['bastion'], rank: 'C', stats: { VIT: 1 }, pas: { thornsAlways: 3 }, text: v => `Always have ${v.thornsAlways} Thorns, doubled below half HP.` },
  hourglass: { name: 'Hourglass Pendant', slot: 'accessory', tags: ['arcanist'], rank: 'C', stats: { INT: 1 }, pas: { quickFree: 1 }, text: v => v.quickFree > 1 ? `Your first ${v.quickFree} Quick skills each fight have no cooldown.` : 'Your first Quick skill each fight has no cooldown.' },
  storm_ring: { name: 'Stormcaller Ring', slot: 'accessory', tags: ['storm'], rank: 'C', stats: { STR: 1 }, pas: { stunDmg: 10 }, text: v => `Your Stuns and Interrupts deal ${v.stunDmg} damage.` },
  soul_lantern: { name: 'Soul Lantern', slot: 'accessory', tags: ['reaper'], rank: 'B', stats: { STR: 1, LUK: 1 }, pas: { lowLifesteal: 0.25 }, text: v => `Below half HP, heal ${pct(v.lowLifesteal)} of the damage you deal.` },
  plague_censer: { name: 'Plague Censer', slot: 'accessory', tags: ['venom', 'pyre'], rank: 'A', stats: { INT: 2 }, pas: { burnPoison: 2 }, text: v => `Whenever you apply Burn, also apply ${v.burnPoison} Poison.` },
};
const GEAR_SLOTS = ['weapon', 'armour', 'accessory'];
