// ===== [World Pending Deletion] — data + rules (no DOM) =====
'use strict';
const VERSION = 5;
const STATS = ['STR', 'AGI', 'INT', 'VIT', 'LUK'];
const STAT_INFO = {
  STR: { name: 'Strength', short: 'Reaper and Stormcaller skills, some HP' },
  AGI: { name: 'Agility', short: 'Bladedancer and Venom skills, dodge' },
  INT: { name: 'Intelligence', short: 'Pyre and Arcanist skills' },
  VIT: { name: 'Vitality', short: 'HP, Bastion and Zealot skills' },
  LUK: { name: 'Luck', short: 'Critical hits' },
};
const RANKS = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];
const PRICE = { E: 1, D: 2, C: 3, B: 4, A: 5 };

// ---------- Archetypes ----------
// Bonuses are cumulative: tier 2 adds to tier 1, and so on.
const ARCH = {
  pyre: { name: 'Pyre', stat: 'INT', theme: 'Burn', path: 'Pyromancer', b: ['Burn on the opponent fades half as fast.', 'Burn you apply +4.', 'Burn on the opponent never fades.'] },
  venom: { name: 'Venom', stat: 'AGI', theme: 'Poison and drain', path: 'Plaguebringer', b: ['Poison you apply +1.', 'Poison you apply +1 more.', 'Poison deals 50% more damage.'] },
  blade: { name: 'Bladedancer', stat: 'AGI', theme: 'Bleed and multi-hit', path: 'Bladesinger', b: ['Multi-hit skills hit once more.', 'Bleed you apply +2.', 'Bleed deals double damage.'] },
  bastion: { name: 'Bastion', stat: 'VIT', theme: 'Block and Thorns', path: 'Bulwark', b: ['Keep 25% of your Block between turns.', 'Always have 4 Thorns.', 'Gaining Block also deals half of it as damage.'] },
  arcanist: { name: 'Arcanist', stat: 'INT', theme: 'Quick skills and cooldowns', path: 'Archmage', b: ['Quick skills: 1 turn shorter cooldown. Your other skills: 1 turn shorter for every 8 INT (minimum 1).', 'Your first skill each fight has no cooldown.', 'Quick skills cast twice.'] },
  zealot: { name: 'Zealot', stat: 'VIT', theme: 'Healing and Regen', path: 'Saint', b: ['Healing +10%.', 'Heal 2 at the start of each of your turns (grows with level).', 'Overhealing becomes Block.'] },
  reaper: { name: 'Reaper', stat: 'STR', theme: 'Execute, Doom and lifesteal', path: 'Deathbringer', b: ['Opponents below half HP take 25% more damage from you, and your hits ignore their Block. The first time you hit an opponent below half HP, heal 15% of your max HP.', 'Heal 20% of the damage you deal.', 'Doom lands a turn sooner, and each win restores 1 Heart.'] },
  storm: { name: 'Stormcaller', stat: 'STR', theme: 'Stun and Interrupt', path: 'Stormlord', b: ['Your Stuns and Interrupts deal 12 damage plus your STR and shatter the opponent\'s Block. Stopping a big attack Empowers you for 2 turns.', 'Your Stuns also Weaken for 2 turns.', 'Every 3rd skill you use Stuns.'] },
};
const ARCH_KEYS = Object.keys(ARCH);
const START_ARCH = ['pyre', 'venom', 'blade', 'bastion', 'zealot', 'reaper'];
// The class wheel: neighbours are allies, opposites are enemies. A run is dealt its home archetype's allies first.
const WHEEL = ['zealot', 'bastion', 'storm', 'arcanist', 'pyre', 'reaper', 'venom', 'blade'];
function alliesOf(k) { const i = WHEEL.indexOf(k); return [WHEEL[(i + 7) % 8], WHEEL[(i + 1) % 8]]; }
function archTier(n) { return n >= 6 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0; }

// ---------- Skills ----------
const SKILLS = {};
const SHOP_SKILLS = [];
function sk(id, name, tags, rank, cd, fx, evos, extra) {
  const d = Object.assign({ id, name, tags, rank, cd, fx, kind: 'skill' }, extra || {});
  SKILLS[id] = d;
  if (!d.noShop) SHOP_SKILLS.push(id);
  if (evos) {
    d.evo = evos.map(e => e[0]);
    evos.forEach(([eid, ename, efx, ecd]) => {
      SKILLS[eid] = Object.assign({}, d, { id: eid, name: ename, fx: efx, cd: ecd != null ? ecd : d.cd, rank: RANKS[Math.min(6, RANKS.indexOf(rank) + 2)], evo: null, base: id, noShop: true });
    });
  }
}
// Pyre
sk('firebolt', 'Firebolt', ['pyre'], 'E', 1, { dmg: 7, burn: 4 }, [['fireball', 'Fireball', { dmg: 12, burn: 6 }], ['fire_rain', 'Fire Rain', { dmg: 3, hits: 4, burn: 2, perHit: 1 }]]);
sk('ember_ward', 'Ember Ward', ['pyre', 'bastion'], 'E', 3, { block: 8, burn: 4 }, [['fire_wall', 'Fire Wall', { block: 13, burn: 6 }], ['blazing_aegis', 'Blazing Aegis', { block: 8, burn: 3, thorns: 6 }]]);
sk('flame_wave', 'Flame Wave', ['pyre', 'blade'], 'D', 2, { dmg: 4, hits: 2, burn: 2, perHit: 1 }, [['inferno_wave', 'Inferno Wave', { dmg: 4, hits: 3, burn: 2, perHit: 1 }], ['scorching_cut', 'Scorching Cut', { dmg: 5, hits: 2, burn: 2, bleed: 2, perHit: 1 }]]);
sk('ignite', 'Ignite', ['pyre'], 'D', 3, { detonate: 2 }, [['combust', 'Combust', { detonate: 3 }], ['wildfire', 'Wildfire', { detonate: 2, keep: 1 }]]);
sk('scorch', 'Scorch', ['pyre'], 'C', 2, { dmg: 5, burn: 7 }, [['blaze', 'Blaze', { dmg: 7, burn: 11 }], ['searing_brand', 'Searing Brand', { dmg: 5, burn: 7, weaken: 1 }]]);
sk('inferno', 'Inferno', ['pyre'], 'B', 4, { dmg: 10, burn: 11 }, [['hellfire', 'Hellfire', { dmg: 14, burn: 16 }], ['firestorm', 'Firestorm', { dmg: 5, hits: 3, burn: 4, perHit: 1 }]]);
sk('sacred_flame', 'Sacred Flame', ['zealot', 'pyre'], 'B', 3, { dmg: 9, burn: 4, heal: 8 }, [['purging_flame', 'Purging Flame', { dmg: 12, burn: 6, heal: 10 }], ['sunfire', 'Sunfire', { dmg: 9, burn: 4, heal: 8, cleanse: 1 }]]);
sk('pandemic', 'Pandemic', ['venom', 'pyre'], 'A', 4, { burn: 8, poison: 6 }, [['apocalypse', 'Apocalypse', { burn: 12, poison: 10 }], ['black_death', 'Black Death', { burn: 8, poison: 6, weaken: 2 }]]);
// Venom
sk('venom_blade', 'Venom Blade', ['venom', 'blade'], 'E', 1, { dmg: 5, poison: 2 }, [['viper_fang', 'Viper Fang', { dmg: 7, poison: 4 }], ['toxic_flurry', 'Toxic Flurry', { dmg: 3, hits: 3, poison: 1, perHit: 1 }]]);
sk('hex', 'Hex', ['venom', 'storm'], 'E', 2, { weaken: 2, poison: 2 }, [['curse_of_frailty', 'Curse of Frailty', { weaken: 3, poison: 4 }], ['wither', 'Wither', { weaken: 2, poison: 2, drainPoison: 1 }]]);
sk('drain_life', 'Drain Life', ['venom', 'reaper'], 'E', 2, { dmg: 8, lifesteal: 0.5 }, [['soul_drain', 'Soul Drain', { dmg: 12, lifesteal: 0.6 }], ['blood_pact', 'Blood Pact', { dmg: 8, lifesteal: 1 }]]);
sk('plague_cloud', 'Plague Cloud', ['venom'], 'D', 3, { poison: 6 }, [['pestilence', 'Pestilence', { poison: 10 }], ['rot', 'Rot', { poison: 6, bleed: 4 }]]);
sk('malice', 'Malice', ['venom'], 'D', 1, { dmg: 4, malice: 3 }, [['spite', 'Spite', { dmg: 4, malice: 5 }], ['torment', 'Torment', { dmg: 6, malice: 3, weaken: 1 }]]);
sk('leech', 'Leech', ['venom', 'reaper'], 'C', 3, { leech: 3 }, [['blood_leech', 'Blood Leech', { leech: 6 }], ['parasite', 'Parasite', { leech: 3, poison: 3 }]]);
sk('toxic_needles', 'Thousand Needles', ['venom'], 'B', 3, { poison: 4, doublePoison: 1 }, [['venom_storm', 'Venom Storm', { poison: 6, doublePoison: 1 }], ['needle_rain', 'Needle Rain', { dmg: 3, hits: 3, poison: 5, doublePoison: 1 }]]);
// Bladedancer
sk('quick_slash', 'Quick Slash', ['blade'], 'E', 1, { dmg: 5, hits: 2 }, [['flurry', 'Flurry of Blades', { dmg: 5, hits: 3 }], ['bleeding_edge', 'Bleeding Edge', { dmg: 4, hits: 2, bleed: 2, perHit: 1 }]]);
sk('lacerate', 'Lacerate', ['blade'], 'E', 2, { dmg: 4, bleed: 5 }, [['gash', 'Gash', { dmg: 4, bleed: 9 }], ['serrated_strike', 'Serrated Strike', { dmg: 9, bleed: 5 }]]);
sk('smoke_bomb', 'Smoke Bomb', ['blade', 'arcanist'], 'E', 4, { evade: 1 }, [['vanish', 'Vanish', { evade: 2 }], ['caltrops', 'Caltrops', { evade: 1, bleed: 4 }]], { quick: true });
sk('fan_of_knives', 'Fan of Knives', ['blade'], 'D', 3, { dmg: 4, hits: 4 }, [['blade_storm', 'Blade Storm', { dmg: 4, hits: 6 }], ['poisoned_knives', 'Poisoned Knives', { dmg: 3, hits: 4, poison: 1, perHit: 1 }]]);
sk('precise_strike', 'Precise Strike', ['blade'], 'D', 2, { dmg: 11, critBonus: 0.5 }, [['vital_strike', 'Vital Strike', { dmg: 12, alwaysCrit: 1 }], ['heartseeker', 'Heartseeker', { dmg: 15, pierce: 1 }]]);
sk('mark_prey', 'Mark Prey', ['blade'], 'C', 3, { mark: 2 }, [['hunters_mark', "Hunter's Mark", { mark: 3 }], ['deadly_mark', 'Deadly Mark', { mark: 2, nextCrit: 1 }]], { quick: true });
sk('assassinate', 'Assassinate', ['blade', 'reaper'], 'B', 3, { dmg: 12, cruel: 2 }, [['death_blossom', 'Death Blossom', { dmg: 8, hits: 2, cruel: 2 }], ['coup_de_grace', 'Coup de Grace', { dmg: 16, cruel: 2.5 }]]);
sk('thousand_cuts', 'Thousand Cuts', ['blade'], 'A', 4, { dmg: 3, hits: 6, bleed: 1, perHit: 1 }, [['dance_of_death', 'Dance of Death', { dmg: 4, hits: 7, bleed: 1, perHit: 1 }], ['crimson_tempest', 'Crimson Tempest', { dmg: 3, hits: 6, bleed: 2, perHit: 1 }]]);
// Bastion
sk('iron_guard', 'Iron Guard', ['bastion'], 'E', 1, { block: 9 }, [['fortress', 'Fortress', { block: 15 }], ['spiked_guard', 'Spiked Guard', { block: 9, thorns: 5 }]]);
sk('shield_bash', 'Shield Bash', ['bastion', 'storm'], 'E', 2, { dmg: 6, block: 6 }, [['tower_bash', 'Tower Bash', { dmg: 8, block: 11 }], ['stunning_bash', 'Stunning Bash', { dmg: 6, stun: 1 }, 3]]);
sk('smite', 'Smite', ['bastion', 'zealot'], 'E', 2, { dmg: 6, blockDmg: 0.5 }, [['judgement', 'Judgement', { dmg: 5, blockDmg: 1 }], ['righteous_smite', 'Righteous Smite', { dmg: 9, heal: 5 }]]);
sk('retribution', 'Retribution', ['bastion'], 'D', 3, { block: 6, thorns: 8 }, [['vengeance', 'Vengeance', { block: 6, thorns: 14 }], ['iron_retort', 'Iron Retort', { block: 12, thorns: 8 }]]);
sk('riposte', 'Riposte', ['bastion', 'blade'], 'C', 3, { block: 6, riposte: 1.5 }, [['perfect_riposte', 'Perfect Riposte', { block: 10, riposte: 2.5 }], ['parry_master', 'Parry Master', { block: 6, riposte: 1.5, evade: 1 }]]);
sk('unbreakable', 'Unbreakable', ['bastion'], 'B', 4, { block: 20, cleanse: 1 }, [['immovable', 'Immovable', { block: 30, cleanse: 1 }], ['iron_skin', 'Iron Skin', { block: 18, cleanse: 1, thorns: 6 }]]);
sk('bulwark_slam', 'Bulwark Slam', ['bastion'], 'A', 3, { dmg: 4, blockDmg: 1.2 }, [['titan_slam', 'Titan Slam', { dmg: 6, blockDmg: 1.6 }], ['shield_quake', 'Shield Quake', { dmg: 4, blockDmg: 1.2, stun: 1 }, 4]]);
// Arcanist
sk('spark', 'Spark', ['arcanist', 'storm'], 'E', 2, { dmg: 6 }, [['arc_spark', 'Arc Spark', { dmg: 10 }], ['static_spark', 'Static Spark', { dmg: 6, weaken: 1 }]], { quick: true });
sk('focus', 'Focus', ['arcanist'], 'E', 3, { focus: 0.6 }, [['deep_focus', 'Deep Focus', { focus: 1 }], ['spellweave', 'Spellweave', { focus: 0.5, haste: 1 }]], { quick: true });
sk('mana_shield', 'Mana Shield', ['arcanist', 'bastion'], 'E', 3, { block: 12 }, [['arcane_ward', 'Arcane Ward', { block: 20 }], ['retort_ward', 'Retort Ward', { block: 10, thorns: 6 }]]);
sk('frost_lance', 'Frost Lance', ['arcanist'], 'E', 2, { dmg: 11, weaken: 2 }, [['glacial_spear', 'Glacial Spear', { dmg: 15, weaken: 2 }], ['deep_freeze', 'Deep Freeze', { dmg: 8, stun: 1 }, 4]]);
sk('arcane_missiles', 'Arcane Missiles', ['arcanist'], 'D', 2, { dmg: 3, hits: 4, pierce: 1 }, [['arcane_barrage', 'Arcane Barrage', { dmg: 3, hits: 6, pierce: 1 }], ['mana_lance', 'Mana Lance', { dmg: 16, pierce: 1 }]]);
sk('counterspell', 'Counterspell', ['arcanist', 'storm'], 'C', 3, { dmg: 7, interrupt: 1 }, [['nullify', 'Nullify', { dmg: 12, interrupt: 1 }], ['spell_theft', 'Spell Theft', { dmg: 7, interrupt: 1, empower: 2 }]]);
sk('siphon', 'Siphon', ['arcanist'], 'C', 3, { siphon: 1 }, [['soul_siphon', 'Soul Siphon', { siphon: 1, heal: 5 }], ['hex_siphon', 'Hex Siphon', { siphon: 1, weaken: 1 }]], { quick: true });
sk('time_warp', 'Time Warp', ['arcanist'], 'B', 6, { haste: 2 }, [['haste', 'Haste', { haste: 3 }], ['chrono_loop', 'Chrono Loop', { haste: 2 }, 4]], { quick: true });
sk('cataclysm', 'Arcane Cataclysm', ['arcanist'], 'A', 4, { dmg: 24, pierce: 1 }, [['singularity', 'Singularity', { dmg: 34, pierce: 1 }], ['starfall', 'Starfall', { dmg: 8, hits: 4, pierce: 1 }]]);
// Zealot
sk('penance', 'Penance', ['zealot'], 'E', 1, { dmg: 6, heal: 2 }, [['atonement', 'Atonement', { dmg: 8, heal: 4 }], ['zeal', 'Zeal', { dmg: 5, hits: 2, heal: 2 }]]);
sk('holy_light', 'Holy Light', ['zealot'], 'E', 3, { heal: 10 }, [['radiance', 'Radiance', { heal: 16 }], ['purifying_light', 'Purifying Light', { heal: 9, cleanse: 1 }]]);
sk('shield_of_faith', 'Shield of Faith', ['zealot'], 'E', 3, { block: 6 }, [['aegis', 'Aegis', { block: 12 }], ['blessed_shield', 'Blessed Shield', { block: 6, cleanse: 1 }]], { quick: true });
sk('purify', 'Purify', ['zealot'], 'D', 4, { cleanse: 1, heal: 6 }, [['sanctuary', 'Sanctuary', { cleanse: 1, heal: 10, block: 8 }], ['reversal', 'Reversal', { cleanse: 1, reflect: 1, block: 5 }]]);
sk('second_wind', 'Second Wind', ['zealot'], 'D', 4, { healMissing: 0.25 }, [['last_breath', 'Last Breath', { healMissing: 0.4 }], ['rally', 'Rally', { healMissing: 0.25, empower: 1 }]]);
sk('consecrate', 'Consecrate', ['zealot'], 'C', 4, { regen: 4 }, [['hallowed_ground', 'Hallowed Ground', { regen: 7 }], ['holy_fire', 'Holy Fire', { regen: 4, burn: 4 }]]);
sk('miracle', 'Miracle', ['zealot'], 'A', 6, { healMissing: 0.5, cleanse: 1, block: 10 }, [['resurrection', 'Resurrection', { healMissing: 0.7, cleanse: 1, block: 12 }], ['divine_wrath', 'Divine Wrath', { healMissing: 0.4, dmg: 15 }]]);
// Reaper
sk('cleave', 'Cleave', ['reaper'], 'E', 1, { dmg: 10 }, [['great_cleave', 'Great Cleave', { dmg: 16 }], ['rending_cleave', 'Rending Cleave', { dmg: 8, bleed: 4 }]]);
sk('berserk', 'Berserk', ['reaper'], 'E', 2, { dmg: 17, selfDmg: 3 }, [['blood_rage', 'Blood Rage', { dmg: 24, selfDmg: 4 }], ['frenzy', 'Frenzy', { dmg: 8, hits: 2, lifesteal: 0.3 }]]);
sk('execute', 'Execute', ['reaper'], 'D', 3, { dmg: 10, execute: 0.3, execMult: 2.5 }, [['decapitate', 'Decapitate', { dmg: 12, execute: 0.3, execMult: 3 }], ['final_verdict', 'Final Verdict', { dmg: 10, execute: 0.5, execMult: 2.5 }]]);
sk('heavy_blow', 'Heavy Blow', ['reaper'], 'D', 3, { dmg: 23 }, [['earthshaker', 'Earthshaker', { dmg: 33 }], ['crushing_blow', 'Crushing Blow', { dmg: 23, weaken: 2 }]]);
sk('momentum', 'Momentum', ['reaper'], 'C', 1, { dmg: 5, momentum: 4 }, [['unstoppable', 'Unstoppable', { dmg: 5, momentum: 7 }], ['avalanche', 'Avalanche', { dmg: 4, hits: 2, momentum: 3 }]]);
sk('doom', 'Doom', ['reaper'], 'B', 5, { doom: 26 }, [['swift_doom', 'Swift Doom', { doom: 22, doomT: 2 }], ['inevitable_doom', 'Inevitable Doom', { doom: 40 }]]);
sk('soul_harvest', 'Soul Harvest', ['reaper'], 'A', 4, { dmg: 14, lifesteal: 0.6, execute: 0.3, execMult: 2 }, [['reaping', 'The Reaping', { dmg: 18, lifesteal: 0.6, execute: 0.3, execMult: 2.5 }], ['soul_feast', 'Soul Feast', { dmg: 14, lifesteal: 1, execute: 0.3, execMult: 2 }]]);
// Stormcaller
sk('static_jab', 'Static Jab', ['storm'], 'E', 1, { dmg: 6, weaken: 1 }, [['shock_jab', 'Shock Jab', { dmg: 9, weaken: 1 }], ['jolt', 'Jolt', { dmg: 6, weaken: 1, stunIfWeak: 1 }, 3]]);
sk('war_cry', 'War Cry', ['storm', 'reaper'], 'E', 4, { empower: 2, block: 5 }, [['battle_roar', 'Battle Roar', { empower: 3, block: 10 }], ['intimidate', 'Intimidate', { empower: 2, weaken: 2 }]]);
sk('thunderclap', 'Thunderclap', ['storm'], 'D', 4, { dmg: 8, stun: 1 }, [['thunderstorm', 'Thunderstorm', { dmg: 6, hits: 3, stun: 1 }], ['static_shock', 'Static Shock', { dmg: 11, stun: 1 }, 3]]);
sk('chain_lightning', 'Chain Lightning', ['storm', 'blade'], 'C', 2, { dmg: 5, hits: 3 }, [['forked_lightning', 'Forked Lightning', { dmg: 5, hits: 4 }], ['ball_lightning', 'Ball Lightning', { dmg: 6, hits: 3, weaken: 1 }]]);
sk('overload', 'Overload', ['storm'], 'B', 4, { dmg: 12, stunIfWeak: 1 }, [['supercharge', 'Supercharge', { dmg: 16, stunIfWeak: 1 }], ['short_circuit', 'Short Circuit', { dmg: 10, weaken: 2, stunIfWeak: 1 }]]);
sk('thunder_wrath', "Thunder God's Wrath", ['storm'], 'A', 5, { dmg: 18, stun: 1 }, [['heavens_fury', "Heaven's Fury", { dmg: 26, stun: 1 }], ['eye_of_storm', 'Eye of the Storm', { dmg: 8, hits: 3, stun: 1 }]]);
// Basic
sk('attack', 'Attack', [], 'F', 0, { dmg: 5 }, null, { noShop: true, basic: true });

// ---------- Gear: stats + one passive, no active skill ----------
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
function pct(v) { return Math.round(v * 100) + '%'; }
// Healing from Poison damage (Grave Warden, Grave Shroud, Plague Doctor) adds up to at most this share
const POISON_HEAL_CAP = 0.3;
const STAR_MULT = [0, 1, 1.5, 1.6];
const GEAR_STAR = [0, 1, 1.5, 2], GEAR_STAR_PCT = [0, 1, 1.4, 1.8];
function gearPas(id, star) { const g = GEAR[id], o = {}; Object.entries(g.pas || {}).forEach(([k, v]) => o[k] = Number.isInteger(v) ? Math.round(v * GEAR_STAR[star]) : Math.round(v * GEAR_STAR_PCT[star] * 100) / 100); return Object.assign(o, g.fix || {}); }
function gearText(id, star) { return GEAR[id].text(gearPas(id, star || 1)); }
function gearStats(id, star) { const o = {}; Object.entries(GEAR[id].stats).forEach(([k, v]) => o[k] = v * (star || 1)); return o; }
function isGear(id) { return !!GEAR[id]; }
function pieceDef(id) { return GEAR[id] || SKILLS[id]; }
function baseId(id) { return (SKILLS[id] && SKILLS[id].base) || id; }

// ---------- Prefixes (skills only) ----------
const isDmg = d => !!(d.fx.dmg || d.fx.detonate || d.fx.malice || d.fx.blockDmg || d.fx.momentum);
const PREFIXES = {
  swift: { name: 'Swift', desc: '1 turn shorter cooldown.', w: 3, ok: d => d.cd >= 2 },
  heavy: { name: 'Heavy', desc: '+40% power, 1 turn longer cooldown.', w: 3, ok: isDmg },
  vampiric: { name: 'Vampiric', desc: 'Heal 25% of the damage dealt.', w: 2, ok: isDmg },
  searing: { name: 'Searing', desc: 'Also apply 3 Burn.', w: 3 },
  toxic: { name: 'Toxic', desc: 'Also apply 3 Poison.', w: 3 },
  serrated: { name: 'Serrated', desc: 'Also apply 3 Bleed.', w: 3 },
  piercing: { name: 'Piercing', desc: 'Ignores Block.', w: 2, ok: d => isDmg(d) && !d.fx.pierce },
  twin: { name: 'Twin', desc: 'One extra hit.', w: 2, ok: isDmg },
  echoing: { name: 'Echoing', desc: '30% chance to cast twice.', w: 1, ok: d => !d.quick },
  quick: { name: 'Quick', desc: "Doesn't end your turn, 2 turns longer cooldown.", w: 1, ok: d => !d.quick && !d.basic },
};
const MAX_MODS = 2;
function prefixOk(id, m, mods) { const d = SKILLS[id]; if (!d || d.basic) return false; if ((mods || []).includes(m)) return false; const P = PREFIXES[m]; return !P.ok || P.ok(d); }
// With run, only prefixes at least one of its skills can take, so every offered rune is pickable
function rollPrefixes(n, rng, forId, run) { const keys = Object.keys(PREFIXES).filter(k => (!forId || prefixOk(forId, k, [])) && (!run || prefixTargets(run, k).length)); if (!keys.length) return []; const out = []; let g = 0; while (out.length < n && g++ < 100) { const k = wpick(keys, keys.map(x => PREFIXES[x].w), rng); if (!out.includes(k)) out.push(k); } return out; }
function moddedDef(id, mods) {
  const base = SKILLS[id];
  const d = Object.assign({}, base, { fx: Object.assign({}, base.fx), mods: (mods || []).slice(), powerMult: 1 });
  d.mods.forEach(m => {
    const fx = d.fx;
    if (m === 'swift') d.cd = Math.max(1, d.cd - 1);
    if (m === 'heavy') { d.powerMult *= 1.4; d.cd += 1; }
    if (m === 'vampiric') fx.lifesteal = (fx.lifesteal || 0) + 0.25;
    if (m === 'searing') fx.xburn = (fx.xburn || 0) + 3;
    if (m === 'toxic') fx.xpoison = (fx.xpoison || 0) + 3;
    if (m === 'serrated') fx.xbleed = (fx.xbleed || 0) + 3;
    if (m === 'piercing') fx.pierce = 1;
    if (m === 'twin') { if (fx.dmg) fx.hits = (fx.hits || 1) + 1; else d.powerMult *= 1.3; }
    if (m === 'echoing') fx.echo = 0.3;
    if (m === 'quick') { d.quick = true; d.cd += 2; }
  });
  return d;
}
function effRank(id, mods) { const d = pieceDef(id); return RANKS[Math.min(6, RANKS.indexOf(d.rank) + (mods ? mods.length : 0))]; }
function modName(id, mods) { return (mods && mods.length ? mods.map(m => PREFIXES[m].name).join(' ') + ' ' : '') + pieceDef(id).name; }

// ---------- Gods ----------
const GODS = {
  war: { name: 'The God of War', short: 'War', arch: ['reaper', 'storm', 'bastion'], blessing: 'All your damage +15%.' },
  trick: { name: 'The Trickster', short: 'Trickster', arch: ['venom', 'blade', 'arcanist'], blessing: 'Burn, Poison and Bleed you apply +2.' },
  ruin: { name: 'The Goddess of Ruin', short: 'Ruin', arch: ['pyre', 'zealot', 'reaper'], blessing: 'Below half HP, deal 30% more damage.' },
};

// ---------- Worlds ----------
const WORLD_TYPES = {
  drowned: { name: 'Drowned Isles', flavour: 'Island kingdoms sinking into the sea.', home: 'zealot', gift: 'tidecaller', final: 'leviathan', names: [['Vel', 'Mar', 'Thal', 'Ner', 'Cor', 'Ys'], ['mora', 'mere', 'thys', 'una', 'aven', 'rith']], champs: ['Aldric', 'Maren', 'Isolde', 'Corin', 'Nerys', 'Talwyn'] },
  burning: { name: 'Burning Empire', flavour: 'An empire that never stopped fighting.', home: 'pyre', gift: 'deserter', final: 'kharros', names: [['Khar', 'Vor', 'Ash', 'Ign', 'Sol', 'Pyr'], ['ros', 'kai', 'heim', 'gard', 'onis', 'ath']], champs: ['Varro', 'Kaela', 'Dax', 'Seren', 'Ignis', 'Tor'] },
  hollow: { name: 'Hollow Kingdom', flavour: "A land where the dead won't rest.", home: 'venom', gift: 'warden', final: 'bone_saint', names: [['Mor', 'Gra', 'Duns', 'Ves', 'Ul', 'Kar'], ['vale', 'hollow', 'grave', 'mire', 'thorn', 'dun']], champs: ['Ebon', 'Lira', 'Mordecai', 'Wren', 'Silas', 'Ysolde'] },
  verdant: { name: 'Verdant Wilds', flavour: 'Fey forests that eat travellers.', home: 'blade', gift: 'hedgewitch', final: 'thorn_mother', names: [['Syl', 'Fae', 'Bri', 'Ald', 'Thorn', 'Wy'], ['wood', 'glade', 'mere', 'wyn', 'holt', 'bryn']], champs: ['Rowan', 'Elowen', 'Bramble', 'Faye', 'Linden', 'Oriel'] },
  sky: { name: 'Sky Reaches', flavour: 'Floating cities ruled by mages.', home: 'arcanist', gift: 'prodigy', final: 'archmage', names: [['Aer', 'Cel', 'Zeph', 'Ast', 'Lum', 'Vey'], ['ia', 'ora', 'ion', 'ara', 'elle', 'is']], champs: ['Cassian', 'Lyra', 'Orin', 'Vela', 'Theron', 'Mira'] },
  iron: { name: 'Iron Hold', flavour: 'Mountain forges under siege.', home: 'bastion', gift: 'runesmith', final: 'forge_king', names: [['Dur', 'Gor', 'Bal', 'Kaz', 'Thra', 'Grim'], ['ak', 'heim', 'dur', 'mund', 'hold', 'rak']], champs: ['Brann', 'Helga', 'Tormund', 'Sigrun', 'Durek', 'Ingrid'] },
};
const WORLD_RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
const RANK_W = [20, 25, 25, 15, 10, 5];
const MODIFIERS = {
  none: { name: 'Clear Skies', desc: 'No modifier.' },
  bloodmoon: { name: 'Blood Moon', desc: 'Everyone deals 20% more damage.' },
  famine: { name: 'Famine', desc: 'Healing after fights and at the Infirmary is halved.' },
  golden: { name: 'Golden Age', desc: '+2 gold every round.' },
  restless: { name: 'Restless Dead', desc: 'Erased champions appear more often.' },
};

// ---------- World Record ----------
// Each run files 10 entries about its world, one per Heart, plus a bio for the champion. Losing Hearts erases entries.
// Runs and snapshots store pool indexes, never text, so pool order is fixed once shipped: add new entries at the end, never reorder or delete.
// k: place | person | custom. tier sets deletion order: far, then city, then home. near is the bio phrase for a home place; rel is a person's relation.
const LORE = {
  drowned: {
    roles: ['lamplighter', 'pearl diver', 'tide priest', 'net mender', 'harbour runner'],
    promises: ['bring back dry land', 'ring the bells again', 'come home before the tide'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Sunken Archive', text: 'Every book the isles ever wrote, now read only by eels.' },
      { k: 'place', tier: 'far', name: 'The First Shore', text: 'Where the first settlers landed. It went under two hundred years ago.' },
      { k: 'place', tier: 'far', name: 'The Coral Library', text: 'Scholars grow their records in coral. A page takes a century.' },
      { k: 'custom', tier: 'far', name: 'The Saltwar', text: 'The last war between the isles. Both sides lost the island they fought over.' },
      { k: 'custom', tier: 'city', name: 'The Bell Vigil', text: 'When an island sinks, its bell is rung until the water reaches it.' },
      { k: 'place', tier: 'city', name: 'The bells of Cor Aven', text: 'Seven bells, rung every dusk to count the islands still above water.' },
      { k: 'custom', tier: 'city', name: 'The Tide Council', text: 'Nine elders who vote each year on which island to abandon next.' },
      { k: 'person', tier: 'city', name: 'Harbourmaster Thel', text: 'Has evacuated eleven islands. Keeps a key to each one.' },
      { k: 'place', tier: 'city', name: 'The Floating Market', text: 'Lashed-together boats that move whenever the coast does.' },
      { k: 'custom', tier: 'city', name: 'Drowning Day', text: 'Once a year, everyone wades into the sea to remember what it took.' },
      { k: 'place', tier: 'home', name: 'The Drowned Lighthouse', text: 'Still lit, though its base has been underwater for a generation.', near: 'in the shadow of the Drowned Lighthouse' },
      { k: 'place', tier: 'home', name: 'The stilt house on Marrow Reef', text: 'Your family has raised it four times.', near: 'in a stilt house on Marrow Reef' },
      { k: 'person', tier: 'home', name: 'Your sister Ilsa', text: 'Mends nets, and swears she can smell land on the wind.', rel: 'sister' },
      { k: 'person', tier: 'home', name: 'Old Corwen', text: 'Taught you to swim before you could walk. Says the sea owes him one.', rel: 'teacher' },
    ],
  },
  burning: {
    roles: ['legionnaire', "smith's apprentice", 'standard-bearer', 'field medic', 'courier'],
    promises: ['bring the legion home', 'end the war', 'light the Ember Gate again'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Ashen Frontier', text: 'A border that has moved forty times. Nobody remembers who started it.' },
      { k: 'custom', tier: 'far', name: 'The Thousand-Year Campaign', text: 'The war the empire was founded to win. It is in its thousand and twelfth year.' },
      { k: 'place', tier: 'far', name: 'The Glass Desert', text: 'A battlefield burned so hot the sand turned to glass. Soldiers still find their reflections there.' },
      { k: 'place', tier: 'far', name: 'The Treaty Stone', text: "Carved for a peace that lasted nine days. It is the empire's most visited monument." },
      { k: 'place', tier: 'city', name: 'The Ember Gate', text: "The capital's great gate. It has been rebuilt after every siege, always a little taller." },
      { k: 'place', tier: 'city', name: 'The Legion Rolls', text: "Every soldier's name, burned into iron plates that cover a whole street." },
      { k: 'custom', tier: 'city', name: 'The Night of Cinders', text: 'Once a year the city puts out every fire and sits in the dark, to remember the cold.' },
      { k: 'person', tier: 'city', name: 'Quartermaster Vossa', text: 'Has fed three armies on half rations. Never once lost a ledger.' },
      { k: 'custom', tier: 'city', name: 'The Smoke Choir', text: 'Widows who sing the names of the fallen from the city walls at dusk.' },
      { k: 'custom', tier: 'city', name: "Founders' Feast", text: 'The one day a year when nobody is allowed to draw a blade. Mostly.' },
      { k: 'place', tier: 'home', name: 'The barracks on Kiln Street', text: 'Four generations of your family slept in the same bunk.', near: 'in the barracks on Kiln Street' },
      { k: 'place', tier: 'home', name: 'The forge where you were born', text: 'Your mother refused to stop working, even for that.', near: 'beside the forge where you were born' },
      { k: 'person', tier: 'home', name: 'Your brother Cass', text: 'Lost a hand at the frontier. Writes to you with the other one every week.', rel: 'brother' },
      { k: 'person', tier: 'home', name: 'Sergeant Halla', text: 'Trained you with a wooden sword until you broke it. Then she gave you a real one.', rel: 'sergeant' },
    ],
  },
  hollow: {
    roles: ['lantern warden', 'gravedigger', 'candle-maker', 'bone-setter', 'chapel keeper'],
    promises: ['let the dead rest', 'bring Ada peace', 'keep the lanterns lit'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Unquiet Fields', text: 'Farmland where the old dead still work the soil at night. The harvests are excellent.' },
      { k: 'custom', tier: 'far', name: 'The Last Funeral', text: 'Three hundred years ago, the kingdom buried someone and they stayed buried. Nobody knows how.' },
      { k: 'place', tier: 'far', name: 'The Barrow Kings', text: 'Seven kings in seven hills. They still send tax demands.' },
      { k: 'place', tier: 'far', name: 'The Ossuary Road', text: 'A highway paved with the bones of volunteers. It never needs repair.' },
      { k: 'custom', tier: 'city', name: 'The Lantern Wardens', text: 'Keepers who walk the streets at night, reminding the dead which house is theirs.' },
      { k: 'place', tier: 'city', name: 'The Grave Market', text: 'Where the living buy back things the dead took with them.' },
      { k: 'custom', tier: 'city', name: "Mourners' Week", text: 'A week of feasting where every family sets one extra place, and it gets used.' },
      { k: 'person', tier: 'city', name: 'Mother Rook', text: "The city's oldest gravedigger. Has buried the same man nine times." },
      { k: 'place', tier: 'city', name: 'The Quiet Bell', text: 'A bell with no clapper. When it rings anyway, everyone goes indoors.' },
      { k: 'custom', tier: 'city', name: 'The Salt Line', text: 'A ring of salt around the city, renewed every dawn by children.' },
      { k: 'place', tier: 'home', name: 'The cottage by the yew', text: 'The yew is older than the kingdom, and its roots hold your ancestors.', near: 'in a cottage by the old yew' },
      { k: 'place', tier: 'home', name: 'The chapel of St. Ves', text: 'Small, cold and always full. Not all the congregation breathes.', near: 'in the bell tower of St. Ves' },
      { k: 'person', tier: 'home', name: 'Your grandmother Ada', text: 'Died when you were six. Still tucks you in when you visit.', rel: 'grandmother' },
      { k: 'person', tier: 'home', name: 'Your friend Tobin', text: "A gravedigger's son who dared you into every crypt in the kingdom.", rel: 'friend' },
    ],
  },
  verdant: {
    roles: ['woodcutter', 'lantern-keeper', "hedge witch's apprentice", 'trapper', 'miller'],
    promises: ['keep the lanterns burning', "bring Briar's voice back", 'walk home through the wood'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Hungry Wood', text: 'The deepest forest. Maps of it are always missing the person who drew them.' },
      { k: 'place', tier: 'far', name: 'The Court Under the Hill', text: 'Where the fey hold their feasts. Guests arrive for a night and leave a century later.' },
      { k: 'custom', tier: 'far', name: 'The Treaty of Briars', text: 'The old pact: the forest leaves the villages alone, and the villages never count the trees.' },
      { k: 'place', tier: 'far', name: 'The Moonmere', text: 'A lake that shows you as you will be. Most people stop looking after one visit.' },
      { k: 'custom', tier: 'city', name: 'The Ring of Lanterns', text: "A circle of lights around every village. Step outside it after dark and you are the forest's." },
      { k: 'place', tier: 'city', name: 'The Bargain Stone', text: 'Where deals are struck with the fey. Read every word twice.' },
      { k: 'custom', tier: 'city', name: 'Name Day', text: 'Children are given a true name in secret and a false one for the forest to hear.' },
      { k: 'person', tier: 'city', name: 'Warden Ash', text: "Has walked the Hungry Wood and come back. Twice. Won't say what she gave for it." },
      { k: 'place', tier: 'city', name: 'The Thornwall', text: 'A living hedge around the town, fed every spring with a little blood.' },
      { k: 'custom', tier: 'city', name: 'The Antler Fair', text: 'Once a year, the fey trade openly in the market. Everyone counts their children afterwards.' },
      { k: 'place', tier: 'home', name: 'The house in the great oak', text: 'Your family lives inside a tree that agreed to it. Mostly.', near: 'inside the great oak' },
      { k: 'place', tier: 'home', name: 'The mill at Wyn Ford', text: "Its wheel turns even when the river doesn't.", near: 'by the mill at Wyn Ford' },
      { k: 'person', tier: 'home', name: 'Your sister Briar', text: 'Was taken by the fey for a year and came back speaking only in riddles.', rel: 'sister' },
      { k: 'person', tier: 'home', name: 'Old Hob', text: 'A hedge-wizard who taught you which mushrooms to eat and which to apologise to.', rel: 'teacher' },
    ],
  },
  sky: {
    roles: ['spell-mechanic', 'chain-walker', 'academy student', 'skyship deckhand', 'cartographer'],
    promises: ['keep the city in the sky', 'see the ground one day', 'finish your duel'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Ground', text: 'Nobody has been down there in four hundred years. It is taught as a myth.' },
      { k: 'place', tier: 'far', name: 'The Fallen City', text: 'One of the old floating cities lost its spell. Its wreckage is somewhere below the clouds.' },
      { k: 'custom', tier: 'far', name: 'The First Ascent', text: 'The night the mages lifted the cities into the sky. The reasons were never written down.' },
      { k: 'place', tier: 'far', name: 'The Storm Wall', text: 'A barrier of lightning around the Reaches. It keeps something out. Or in.' },
      { k: 'place', tier: 'city', name: 'The Anchor Chains', text: 'Iron chains that tie the cities together. Children dare each other to walk them.' },
      { k: 'place', tier: 'city', name: 'The Academy Spire', text: 'The highest tower in the Reaches. Every student who graduates moves one floor up.' },
      { k: 'custom', tier: 'city', name: 'The Lift Toll', text: 'Everyone pays a little mana each morning to keep the city in the air.' },
      { k: 'person', tier: 'city', name: 'Chancellor Vey', text: 'Rules the council of mages. Has not touched solid stone in sixty years.' },
      { k: 'custom', tier: 'city', name: 'Windfall Day', text: 'Once a year, the cities drift close enough to step between them.' },
      { k: 'place', tier: 'city', name: 'The Cloud Docks', text: 'Where skyships tie up, rattling in the wind like nervous horses.' },
      { k: 'place', tier: 'home', name: 'The rooftop garden', text: 'Your family grows the only real soil in the district, in pots, very carefully.', near: 'in a rooftop garden above the Cloud Docks' },
      { k: 'place', tier: 'home', name: 'The lower ring', text: 'The poorest part of the city, closest to the edge. You could always see the clouds.', near: 'on the lower ring, near the edge' },
      { k: 'person', tier: 'home', name: 'Your father Oren', text: "A spell-mechanic who keeps the city's oldest engine running with his bare hands.", rel: 'father' },
      { k: 'person', tier: 'home', name: 'Your rival Selis', text: 'Beat you at every exam. You still owe each other a duel.', rel: 'rival' },
    ],
  },
  iron: {
    roles: ['smith', 'miner', 'gate guard', 'tunnel runner', 'rune carver'],
    promises: ['open the gates', 'keep the forge lit', 'see the sky above the mountain'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Deep Roads', text: 'Tunnels running under the whole mountain range. The far ends were sealed for a reason.' },
      { k: 'place', tier: 'far', name: 'The First Anvil', text: 'Struck by the founder of the Hold. It still rings if you touch it.' },
      { k: 'custom', tier: 'far', name: 'The Long Siege', text: 'The army at the gates has been there for eighty years. Some of them were born there.' },
      { k: 'place', tier: 'far', name: 'The Collapsed Mine', text: 'Three hundred miners were lost. Their hammers can still be heard on quiet nights.' },
      { k: 'place', tier: 'city', name: 'The Great Gate', text: 'Twenty feet of steel. It has not opened in a lifetime.' },
      { k: 'place', tier: 'city', name: 'The Ration Hall', text: 'Where everyone eats together, at long tables, in shifts, under strict rules.' },
      { k: 'custom', tier: 'city', name: 'The Hearth Oath', text: 'Every child swears at twelve to keep a fire burning in the Hold.' },
      { k: 'person', tier: 'city', name: 'Gatewarden Brekka', text: 'Has never left her post. Her family brings her meals.' },
      { k: 'custom', tier: 'city', name: 'The Song of Seams', text: 'Miners sing to find weak rock. Every tunnel has its own verse.' },
      { k: 'custom', tier: 'city', name: 'Stonefall Night', text: 'When the mountain shifts, everyone holds hands in the dark until it stops.' },
      { k: 'place', tier: 'home', name: 'The forge on the third deep', text: "Your family's forge, hot for six generations.", near: 'at the forge on the third deep' },
      { k: 'place', tier: 'home', name: 'The vent-house', text: 'A cramped home by an air shaft. You learned to sleep through the wind.', near: 'in a vent-house by the air shafts' },
      { k: 'person', tier: 'home', name: 'Your mother Hild', text: 'A smith who makes a new blade every time the siege takes someone.', rel: 'mother' },
      { k: 'person', tier: 'home', name: 'Your friend Pell', text: 'A runner who knows every tunnel. Taught you to find your way in the dark.', rel: 'friend' },
    ],
  },
};
const REC_SIZE = 10, REC_MAX = 20, TIER_ORDER = { far: 0, city: 1, home: 2 };
const loreName = e => e.name.replace(/^(The|Your) /, m => m.toLowerCase()); // mid-sentence: "the Drowned Lighthouse", "your sister Ilsa"
const loreWho = e => e.name.replace(/^Your \S+ /, ''); // a person in the Halls: "Ilsa"
// Pick 10 entries: at least 3 places, 2 people and 2 customs, always including the bio's home place and person.
// ids is in deletion order (far, city, home, with the bio's person last); lost and partial are bitmasks over ids.
function buildRecord(type, rng) {
  const L = LORE[type], E = L.entries, all = E.map((_, i) => i);
  const of = (k, tier) => all.filter(i => E[i].k === k && E[i].tier === tier);
  const home = pick(of('place', 'home'), rng), person = pick(of('person', 'home'), rng);
  const ids = [home, person], need = { place: 3, person: 2, custom: 2 };
  shuffle(all, rng).forEach(i => { if (!ids.includes(i) && ids.filter(j => E[j].k === E[i].k).length < need[E[i].k]) ids.push(i); });
  shuffle(all, rng).forEach(i => { if (ids.length < REC_SIZE && !ids.includes(i)) ids.push(i); });
  const key = i => i === person ? 9 : TIER_ORDER[E[i].tier];
  const bio = { role: Math.floor(rnd(rng) * L.roles.length), home, person, promise: Math.floor(rnd(rng) * L.promises.length) };
  return { ids: shuffle(ids, rng).sort((a, b) => key(a) - key(b)), lost: 0, partial: 0, bio };
}
// Saves from before the record get one that matches the Hearts they have left
function ensureRecord(run, rng) {
  if (!run || run.record || run.practice || !LORE[run.world.type]) return;
  run.record = buildRecord(run.world.type, rng);
  run.record.lost = (1 << Math.max(0, Math.min(REC_SIZE, run.maxHearts - run.hearts))) - 1;
}
// Erase the next n entries that are still standing. Returns their positions in ids.
function eraseRecord(run, n, msgs) {
  const R = run.record, out = []; if (!R) return out;
  const E = LORE[run.world.type].entries;
  for (let i = 0; i < R.ids.length && out.length < n; i++) if (!(R.lost & 1 << i)) {
    R.lost |= 1 << i; R.partial &= ~(1 << i); out.push(i);
    msgs && msgs.push({ t: 'loss', text: `[Erasing: ${loreName(E[R.ids[i]])}… done.]` });
  }
  return out;
}
// Restored Hearts bring back the most recently erased entries, not cleanly: each comes back partial
function restoreRecord(run, n, msgs) {
  const R = run.record; let k = 0; if (!R) return 0;
  for (let i = R.ids.length - 1; i >= 0 && k < n; i--) if (R.lost & 1 << i) { R.lost &= ~(1 << i); R.partial |= 1 << i; k++; }
  if (k && msgs) msgs.push({ t: 'sys', text: `[Restoring from backup… ${k} record${k > 1 ? 's' : ''} recovered. Partial.]` });
  return k;
}
// An extra max Heart adds an unused entry at the front of the queue, so it is the next to go. Past 14 entries, extra Hearts go unrecorded.
function amendRecord(run, msgs, rng) {
  const R = run.record; if (!R || R.ids.length >= REC_MAX) return false;
  const E = LORE[run.world.type].entries, unused = E.map((_, i) => i).filter(i => !R.ids.includes(i));
  if (!unused.length) return false;
  const low = Math.min(...unused.map(i => TIER_ORDER[E[i].tier]));
  const id = pick(unused.filter(i => TIER_ORDER[E[i].tier] === low), rng);
  let at = 0; while (at < R.ids.length && R.lost & 1 << at) at++;
  const ins = m => (m & ((1 << at) - 1)) | ((m >> at) << (at + 1));
  R.ids.splice(at, 0, id); R.lost = ins(R.lost); R.partial = ins(R.partial);
  msgs && msgs.push({ t: 'sys', text: '[Record amended: 1 entry added.]' });
  return true;
}
// Reading a record. halls: third person for the Halls, which name people without "your".
function recLeft(rec) { let n = 0; rec.ids.forEach((_, p) => { if (!(rec.lost & 1 << p)) n++; }); return n; }
function recWorldGone(rec) { return recLeft(rec) === 0; }
// A partial entry has one or two words of its line barred, picked from the entry index so every device shows the same ones
function partialWords(i, n) { const a = (i * 7 + 3) % n; return n > 6 ? [a, (a + 3) % n] : [a]; }
function recEntries(rec, type, halls) {
  const E = LORE[type].entries;
  return rec.ids.map((i, p) => {
    const e = E[i], lost = !!(rec.lost & 1 << p), partial = !lost && !!(rec.partial & 1 << p);
    const words = e.text.split(' '), bar = partial ? partialWords(i, words.length) : [];
    return { pos: p, i, k: e.k, lost, partial, name: halls && e.k === 'person' ? loreWho(e) : e.name, line: words.map((w, j) => ({ t: w, gone: bar.includes(j) })) };
  });
}
// The bio as text pieces; erased pieces have gone set. champ gives the third-person Halls voice.
function bioParts(rec, type, worldName, champ) {
  const L = LORE[type], E = L.entries, b = rec.bio;
  const gone = i => !!(rec.lost & 1 << rec.ids.indexOf(i));
  const home = E[b.home], who = E[b.person], wgone = recWorldGone(rec);
  const key = home.name.replace(/^The /, '').toLowerCase(), at = home.near.toLowerCase().indexOf(key);
  const cut = at > 0 ? at : home.near.indexOf(' ') + 1; // bar the landmark, keep "in the shadow of"
  const near = [{ t: home.near.slice(0, cut) }, { t: home.near.slice(cut), gone: gone(b.home) }];
  const person = { t: champ ? loreWho(who) : /^Your /.test(who.name) ? loreName(who) : who.name, gone: gone(b.person) };
  const world = { t: worldName, gone: wgone }, role = L.roles[b.role], promise = L.promises[b.promise];
  return champ
    ? [{ t: `${champ} was a ${role} of ` }, world, { t: ', raised ' }, ...near, { t: `. ${champ} swore to ` }, person, { t: ` to ${promise}.` }]
    : [{ t: `You were a ${role} of ` }, world, { t: '. You grew up ' }, ...near, { t: '. You promised ' }, person, { t: ` you would ${promise}.` }];
}
// What a returning Erased champion remembers: the last entry still standing, or else the last one to go
function recFragment(rec, type) {
  const E = LORE[type].entries; let p = -1;
  rec.ids.forEach((_, j) => { if (!(rec.lost & 1 << j)) p = j; });
  if (p < 0) p = rec.ids.length - 1;
  const e = E[rec.ids[p]]; return e.k === 'person' ? loreWho(e) : loreName(e);
}
// Shared records are untrusted: indexes must exist in the pool, masks must fit, and the bio must point into ids
function sanitizeRec(r, type) {
  const L = LORE[type]; if (!L || !r || typeof r !== 'object' || r.w !== type || !Array.isArray(r.ids)) return null;
  const ids = r.ids.slice(0, REC_MAX), n = L.entries.length, b = r.bio || {};
  const idx = (v, len) => Number.isInteger(v) && v >= 0 && v < len;
  const mask = v => Number.isInteger(v) && v >= 0 && v < 1 << ids.length;
  if (!ids.length || !ids.every(i => idx(i, n)) || new Set(ids).size !== ids.length || !mask(r.lost) || !mask(r.partial)) return null;
  if (!idx(b.role, L.roles.length) || !idx(b.promise, L.promises.length) || !ids.includes(b.home) || !ids.includes(b.person)) return null;
  return { w: type, ids, lost: r.lost, partial: r.partial, bio: { role: b.role, home: b.home, person: b.person, promise: b.promise } };
}

// ---------- Gifts ----------
// cat: world | cheat (max 1) | growth | combat | fortune | divine | bloodline | flaw (max 2)
// lock: a Title id that unlocks it, 'echo' (bought with Echoes) or 'chain' (found in an event chain)
const GIFTS = {
  tidecaller: { name: 'Tidecaller', cat: 'world', cost: 1, desc: 'Heal 2 at the start of each of your turns.' },
  deserter: { name: 'Legion Deserter', cat: 'world', cost: 1, desc: 'Start each fight with 15 Block.' },
  warden: { name: 'Grave Warden', cat: 'world', cost: 1, desc: 'Heal 30% of Poison damage dealt (max 30% from all sources).' },
  hedgewitch: { name: 'Hedge Witch', cat: 'world', cost: 1, desc: 'Burn fades slower and Poison deals 25% more.' },
  prodigy: { name: 'Arcane Prodigy', cat: 'world', cost: 1, desc: 'A 5th skill slot, but 10% less max HP.' },
  runesmith: { name: 'Runesmith', cat: 'world', cost: 1, desc: 'Your gear merges at 2 copies instead of 3.' },
  appraisal: { name: 'Absolute Appraisal', cat: 'cheat', cost: 4, desc: "See every opponent's full kit and their next 2 moves." },
  monarch: { name: "Monarch's Domain", cat: 'cheat', cost: 6, desc: 'Every archetype you have counts 1 extra piece.' },
  rewind: { name: 'Return by Death', cat: 'cheat', cost: 6, desc: 'Once per run, a loss rewinds to the start of that fight.' },
  copycat: { name: 'Copycat', cat: 'cheat', cost: 5, desc: "Once per fight, use the opponent's last move as your own.", lock: 'mirror_breaker' },
  swordsaint: { name: 'Sword Saint', cat: 'cheat', cost: 5, desc: 'Your basic Attack becomes S-rank: far stronger, and it ignores Block.', lock: 'giant_slayer' },
  gacha: { name: 'Gacha Luck', cat: 'cheat', cost: 4, desc: 'Your first reroll each round is free, and shop odds are 1 level better.', lock: 'echo' },
  fastlearner: { name: 'Fast Learner', cat: 'growth', cost: 3, desc: '+50% XP.' },
  merger: { name: 'Quick Study', cat: 'growth', cost: 3, desc: 'Your first 3 merges need only 2 copies.' },
  veteran: { name: 'Tournament Veteran', cat: 'growth', cost: 2, desc: 'Start with 6 more gold and an extra draft reroll.' },
  latebloomer: { name: 'Late Bloomer', cat: 'growth', cost: 2, desc: 'Every stat starts 1 lower, but each level gives 3 stat points instead of 2.', lock: 'echo' },
  affinity: { name: 'Skill Affinity', cat: 'growth', cost: 2, desc: "Your world's home archetype pieces cost 1 less (minimum 1).", lock: 'echo' },
  catalyst: { name: 'Catalyst', cat: 'combat', cost: 3, desc: 'Reactions are 50% stronger.' },
  berserker: { name: "Berserker's Blood", cat: 'combat', cost: 2, desc: '+30% damage below half HP.' },
  ironbody: { name: 'Iron Body', cat: 'combat', cost: 2, desc: 'Start each fight with Block equal to 10% of your max HP.' },
  glass: { name: 'Glass Cannon', cat: 'combat', cost: 2, desc: '+30% damage, 20% less max HP.' },
  foresight: { name: 'Foresight', cat: 'combat', cost: 3, desc: "Always see the opponent's next 2 moves." },
  firststrike: { name: 'First Strike', cat: 'combat', cost: 2, desc: 'Your first damaging skill each fight deals double.', lock: 'first_blood' },
  thickskin: { name: 'Thick Skin', cat: 'combat', cost: 2, desc: 'Every hit you take deals 2 less damage.', lock: 'untouched' },
  vampire: { name: 'Vampirism', cat: 'combat', cost: 3, desc: 'Heal 8% of all damage you deal.', lock: 'bloodthirsty' },
  manaaffinity: { name: 'Mana Affinity', cat: 'combat', cost: 2, desc: 'Quick skills have a 1 turn shorter cooldown.', lock: 'spellweaver' },
  lucky: { name: 'Lucky Star', cat: 'fortune', cost: 2, desc: '+10% critical chance and better shop odds.' },
  golden: { name: 'Golden Touch', cat: 'fortune', cost: 3, desc: 'Interest cap rises from 3 to 5.' },
  breath: { name: 'Second Breath', cat: 'fortune', cost: 3, desc: 'Once per run, survive a killing blow with 1 HP.' },
  gambler: { name: 'Gambler', cat: 'fortune', cost: 2, desc: 'Winning a wager pays 15 gold instead of 10.', lock: 'high_roller' },
  haggler: { name: 'Haggler', cat: 'fortune', cost: 2, desc: 'The first piece you buy each round costs 1 less.', lock: 'echo' },
  treasure: { name: 'Treasure Sense', cat: 'fortune', cost: 2, desc: 'Beating a hard opponent also pays 5 gold.', lock: 'underdog' },
  chosen_war: { name: 'Chosen of War', cat: 'divine', cost: 2, desc: 'Start with 4 Favour with the God of War: their gift arrives at once.' },
  chosen_trick: { name: 'Chosen of the Trickster', cat: 'divine', cost: 2, desc: 'Start with 4 Favour with the Trickster: their gift arrives at once.' },
  chosen_ruin: { name: 'Chosen of Ruin', cat: 'divine', cost: 2, desc: 'Start with 4 Favour with the Goddess of Ruin: their gift arrives at once.' },
  ironwill: { name: 'Iron Will', cat: 'bloodline', cost: 3, desc: 'Lose 1 fewer Heart per defeat (minimum 1).' },
  dragon: { name: 'Dragon Blood', cat: 'bloodline', cost: 4, desc: '+15% max HP. Toxic Flare and Cauterise heal you 5.', lock: 'emberfall' },
  elf: { name: 'Elf-touched', cat: 'bloodline', cost: 3, desc: '+10% dodge, and Bleed you apply +1.', lock: 'thornbane' },
  demon: { name: 'Demon Blood', cat: 'bloodline', cost: 3, desc: '+15% damage, but healing is 20% weaker.', lock: 'comeback' },
  lastwords: { name: 'Last Words', cat: 'bloodline', cost: 3, desc: 'Once per fight, dropping below 25% HP gives you Block equal to 25% of your max HP.', lock: 'chain' },
  f_glass: { name: 'Glass Body', cat: 'flaw', cost: -2, desc: '20% less max HP.' },
  f_marked: { name: 'Marked by the System', cat: 'flaw', cost: -2, desc: 'Opponents are 10% stronger.' },
  f_cursed: { name: 'Cursed Luck', cat: 'flaw', cost: -2, desc: 'Shop prices +1.' },
  f_debt: { name: 'Debt to the Trickster', cat: 'flaw', cost: -3, desc: 'Lose 10 gold at the start of rounds 3 and 6.' },
  f_amnesia: { name: 'Amnesia', cat: 'flaw', cost: -1, desc: 'The Tournament Archive is sealed for this run.' },
  f_sluggish: { name: 'Sluggish', cat: 'flaw', cost: -2, desc: 'Start every fight Weakened.' },
  f_unlucky: { name: 'Unlucky', cat: 'flaw', cost: -1, desc: 'Rerolls cost 3 gold.' },
};
// Affinity Gifts are only offered as the Additional Gift: +1 piece to one archetype.
Object.keys(ARCH).forEach(k => { GIFTS['aff_' + k] = { name: `${ARCH[k].name} Affinity`, cat: 'extra', cost: 0, desc: `Your ${ARCH[k].name} bonuses count 1 extra piece.`, arch: k }; });
const GIFT_CATS = { world: 'World', cheat: 'Cheat', growth: 'Growth', combat: 'Combat', fortune: 'Fortune', divine: 'Divine', bloodline: 'Bloodline', flaw: 'Flaw' };
const SIGILS = ['✦', '☾', '♜', '⚔', '❖', '✠'];
const SIGIL_COLS = ['#d6a04f', '#72d0ff', '#e15b52', '#9fd86a', '#c27ce6', '#efe6d8'];
function giftBudget(world) { return 10 + [4, 3, 2, 1, 0, 0][world.rank]; }
function giftUnlocked(k, meta) { const g = GIFTS[k]; if (!g.lock) return true; if (!meta) return false; if (g.lock === 'echo') return !!meta.unlocks['gift_' + k]; if (g.lock === 'chain') return !!(meta.found && meta.found[k]); return !!meta.titles[g.lock]; }
function giftLockText(k) { const g = GIFTS[k]; if (g.lock === 'echo') return 'Unlock with Echoes'; if (g.lock === 'chain') return 'Found at the end of an event chain'; return 'Earn the Title: ' + TITLES[g.lock].name; }
function giftsAllowed(world) { const wg = WORLD_TYPES[world.type].gift; return Object.keys(GIFTS).filter(k => GIFTS[k].cat !== 'extra' && (GIFTS[k].cat !== 'world' || k === wg)); }
// System Offer: 3 random Gifts cost 1 less, one random cheat costs 2 less.
function makeOffer(world, meta, rng) {
  const pool = giftsAllowed(world).filter(k => giftUnlocked(k, meta) && GIFTS[k].cost >= 2 && !['cheat', 'flaw', 'world'].includes(GIFTS[k].cat));
  const cheats = giftsAllowed(world).filter(k => giftUnlocked(k, meta) && GIFTS[k].cat === 'cheat');
  const o = {}; shuffle(pool, rng).slice(0, 3).forEach(k => o[k] = 1); if (cheats.length) o[pick(cheats, rng)] = 2;
  return o;
}
function giftCost(k, offer) { return GIFTS[k].cost - ((offer && offer[k]) || 0); }
function giftCheck(world, sel, patron, offer) {
  const spent = sel.reduce((a, k) => a + giftCost(k, offer), 0);
  const budget = giftBudget(world) + (patron === 'none' ? 2 : 0);
  const cheats = sel.filter(k => GIFTS[k].cat === 'cheat').length, flaws = sel.filter(k => GIFTS[k].cat === 'flaw').length;
  return { spent, budget, left: budget - spent, ok: spent <= budget && cheats <= 1 && flaws <= 2, cheats, flaws };
}
function randomGifts(world, meta, patron, offer, rng) {
  // "Let the System decide": the world's Gift, maybe a cheat, then fill the budget
  let sel = [WORLD_TYPES[world.type].gift];
  const pool = giftsAllowed(world).filter(k => giftUnlocked(k, meta) && !['world', 'flaw'].includes(GIFTS[k].cat));
  for (const k of shuffle(pool, rng)) { const t = sel.concat(k); if (giftCheck(world, t, patron, offer).ok) sel = t; }
  return sel;
}

// ---------- Titles ----------
// Earned for feats, kept forever. Equip one per run for a small passive. Some unlock Gifts.
const TITLES = {
  first_blood: { name: 'First Blood', cond: 'Win a fight in 2 turns or fewer.', desc: 'Your first damaging skill each fight deals 50% more.' },
  untouched: { name: 'Untouched', cond: 'Win a fight without losing any HP.', desc: 'Start each fight with 8 Block.' },
  giant_slayer: { name: 'Giant Slayer', cond: 'Beat an opponent with at least twice your max HP.', desc: '+15% damage to opponents with more max HP than you.' },
  mirror_breaker: { name: 'Mirror Breaker', cond: 'Defeat the Masked Entrant.', desc: '+8% critical chance.' },
  bloodthirsty: { name: 'Bloodthirsty', cond: 'Heal 60 HP in a single fight.', desc: 'Heal 5% of the damage you deal.' },
  spellweaver: { name: 'Spellweaver', cond: 'Use 3 Quick skills in a single turn.', desc: 'After a Quick skill, your next skill deals 10% more.' },
  high_roller: { name: 'High Roller', cond: 'Win 3 wagers in one run.', desc: 'Winning a wager pays 3 more gold.' },
  underdog: { name: 'Underdog', cond: 'Beat a hard opponent.', desc: '+10% damage to hard opponents.' },
  comeback: { name: 'Comeback Kid', cond: 'Win a fight with 10% HP or less.', desc: 'Below 25% HP, take 20% less damage.' },
  alchemist: { name: 'Alchemist', cond: 'Trigger 3 reactions in a single fight.', desc: 'Reactions are 20% stronger.' },
  executioner: { name: 'Executioner', cond: 'Land a single hit of 60 or more.', desc: 'Critical hits deal ×1.75 instead of ×1.5.' },
  tidebreaker: { name: 'Tidebreaker', cond: 'World first: defeat the Leviathan Queen.', desc: 'Start each fight with 6 Block.', first: true },
  emberfall: { name: 'Emberfall', cond: 'World first: defeat Emperor Kharros.', desc: 'Burn you apply +1.', first: true },
  bonebreaker: { name: 'Bonebreaker', cond: 'World first: defeat the Bone Saint.', desc: 'Poison you apply +1.', first: true },
  thornbane: { name: 'Thornbane', cond: 'World first: defeat the Thorn Mother.', desc: 'Bleed you apply +1.', first: true },
  skyfall: { name: 'Skyfall', cond: 'World first: defeat the Archmage Who Fell Upward.', desc: '+5% critical chance and +5% dodge.', first: true },
  forgebreaker: { name: 'Forgebreaker', cond: 'World first: defeat the Forge King.', desc: 'Always have 2 Thorns.', first: true },
  ascendant: { name: 'Ascendant', cond: 'World first: merge a piece to ★3.', desc: '+5% damage.', first: true },
  pathfinder: { name: 'Pathfinder', cond: 'World first: unlock a Hidden Path.', desc: 'Start each fight with 5 Block and heal 1 each turn.', first: true },
  unbeaten: { name: 'Unbeaten', cond: 'World first: defeat the Undefeated.', desc: '+10% damage.', first: true },
};
const FINAL_TITLE = { leviathan: 'tidebreaker', kharros: 'emberfall', bone_saint: 'bonebreaker', thorn_mother: 'thornbane', archmage: 'skyfall', forge_king: 'forgebreaker', undefeated: 'unbeaten' };

// ---------- System quests ----------
const QUESTS = {
  rival_noheal: { text: 'Defeat a rival without healing.', reward: 'rune', goal: 1 },
  fast3: { text: 'Win 3 fights within 6 turns each.', reward: 'gold8', goal: 3 },
  react6: { text: 'Trigger 6 reactions.', reward: 'piece', goal: 6 },
  hard2: { text: 'Beat 2 hard opponents.', reward: 'heart', goal: 2 },
  merge4: { text: 'Merge pieces 4 times.', reward: 'gold8', goal: 4 },
  path5: { text: 'Have the System recognise your path by round 5.', reward: 'rune', goal: 1, by: 5 },
  // hidden: revealed only when completed
  h_bankrupt: { text: 'Bankrupt: leave the shop with 0 gold.', reward: 'gold5', goal: 1, hidden: true },
  h_stun3: { text: 'Lightning Rod: Stun or Interrupt one opponent 3 times.', reward: 'rune', goal: 1, hidden: true },
  h_overkill: { text: 'Overkill: finish an opponent with 30 more damage than needed.', reward: 'favour', goal: 1, hidden: true },
  h_clutch: { text: 'Clutch: win with 10% HP or less.', reward: 'heart', goal: 1, hidden: true },
  h_collector: { text: 'Collector: own three ★2 pieces at once.', reward: 'gold6', goal: 1, hidden: true },
};
const QUEST_REWARD = { rune: 'a rune', gold5: '5 gold', gold6: '6 gold', gold8: '8 gold', piece: 'a free B-rank piece', heart: '+1 max Heart', favour: '2 Favour with the God of War' };

// ---------- Hidden Paths: 4+ pieces in two archetypes at once ----------
const HIDDEN_PATHS = {
  'pyre+venom': { name: 'Plague Flame', desc: 'Toxic Flare ignites all of the Poison, not half.', fx: { flareFull: 1 } },
  'blade+reaper': { name: 'Butcher', desc: 'Heal half of the Bleed damage your opponent takes.', fx: { bleedHeal: 0.5 } },
  'bastion+storm': { name: 'Thunder Wall', desc: 'When your Block absorbs a hit, 25% chance to Stun the attacker.', fx: { blockStun: 0.25 } },
  'arcanist+pyre': { name: 'Spellfire', desc: 'Quick skills apply 3 Burn.', fx: { quickBurn: 3 } },
  'reaper+zealot': { name: 'Last Rites', desc: 'Your healing also deals 30% of it as damage to the opponent.', fx: { healDmg: 0.3 } },
  'blade+pyre': { name: 'Cinderblade', desc: 'Multi-hit skills apply 1 Burn per hit.', fx: { hitBurn: 1 } },
  'blade+venom': { name: 'Viper Dance', desc: 'Every Bleed you apply also applies 2 Poison.', fx: { bleedPoison: 2 } },
  'reaper+venom': { name: 'Plague Doctor', desc: 'Heal 25% of Poison damage dealt (max 30% from all sources).', fx: { poisonHeal: 0.25 } },
  'bastion+zealot': { name: 'Paladin', desc: 'Healing also gives Block equal to half of it.', fx: { healBlock: 0.5 } },
  'arcanist+storm': { name: 'Tempest Mage', desc: 'Damaging Quick skills have a 25% chance to Stun.', fx: { quickStun: 0.25 } },
  'reaper+storm': { name: 'Warlord', desc: '+25% damage to Stunned or Weakened opponents.', fx: { vsDisabled: 0.25 } },
  'arcanist+blade': { name: 'Shadow Dancer', desc: 'Each Quick skill also lets you Evade the next attack.', fx: { quickEvade: 1 } },
  'bastion+pyre': { name: 'Ember Wall', desc: 'Thorns also apply 2 Burn.', fx: { thornBurn: 2 } },
  'pyre+zealot': { name: 'Sunpriest', desc: 'Heal 30% of the Burn damage your opponent takes.', fx: { burnHeal: 0.3 } },
  'storm+venom': { name: 'Hexblade', desc: 'Weaken you apply also applies 3 Poison.', fx: { weakPoison: 3 } },
  'bastion+blade': { name: 'Duelist', desc: 'Thorns and Riposte deal 50% more.', fx: { thornMult: 1.5 } },
  'blade+storm': { name: 'Lightning Blade', desc: 'Multi-hit skills Weaken the opponent for 1 turn.', fx: { multiWeaken: 1 } },
  'blade+zealot': { name: 'Blood Saint', desc: 'Heal 3 whenever you apply Bleed.', fx: { healOnBleed: 3 } },
  'arcanist+bastion': { name: 'Spellshield', desc: 'Quick skills also give 5 Block.', fx: { quickBlock: 5 } },
  'pyre+reaper': { name: 'Funeral Pyre', desc: '+25% damage to Burning opponents below half HP.', fx: { burnExec: 0.25 } },
  'pyre+storm': { name: 'Wildstorm', desc: 'Your Stuns and Interrupts also apply 5 Burn.', fx: { stunBurn: 5 } },
  'bastion+venom': { name: 'Thornbark', desc: 'Thorns also apply 2 Poison.', fx: { thornPoison: 2 } },
  'arcanist+venom': { name: 'Apothecary', desc: 'Quick skills apply 2 Poison.', fx: { quickPoison: 2 } },
  'venom+zealot': { name: 'Plague Saint', desc: 'Each skill that heals you also applies 3 Poison.', fx: { healPoison: 3 } },
  'arcanist+zealot': { name: 'Chronomancer', desc: 'Quick skills heal you 4.', fx: { quickHeal: 4 } },
  'arcanist+reaper': { name: 'Soul Weaver', desc: 'Doom and Leech you apply are 40% stronger.', fx: { doomLeech: 0.4 } },
  'bastion+reaper': { name: 'Juggernaut', desc: 'Deal 1% more damage for every 2 Block you have (up to 40%).', fx: { blockDmgPct: 1 } },
  'storm+zealot': { name: 'Inquisitor', desc: 'Your Stuns and Interrupts heal you 8.', fx: { stunHeal: 8 } },
};
function pathKey(a, b) { return [a, b].sort().join('+'); }
function hiddenPathOf(counts) {
  const ks = Object.keys(counts).filter(k => counts[k] >= 4);
  let best = null;
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const key = pathKey(ks[i], ks[j]); if (HIDDEN_PATHS[key] && (!best || counts[ks[i]] + counts[ks[j]] > best.n)) best = { key, n: counts[ks[i]] + counts[ks[j]] }; }
  return best ? best.key : null;
}

// ---------- Enemies ----------
const ENEMIES = {
  goblin: { name: 'Goblin Pit-Fighter', style: 'Fast, dirty fighter', tier: 1, rank: 'E', hp: 40, skills: [{ n: 'Shiv', fx: { dmg: 6 } }, { n: 'Dirty Trick', fx: { dmg: 3, weaken: 1 } }], script: [0, 0, 1] },
  golem: { name: 'Shield Golem', style: 'Walls up, hits hard', tier: 1, rank: 'E', hp: 52, skills: [{ n: 'Slam', fx: { dmg: 9 } }, { n: 'Stone Wall', fx: { block: 10 } }], script: [1, 0] },
  drake: { name: 'Venom Drake', style: 'Poisons, then waits', tier: 1, rank: 'E', hp: 44, skills: [{ n: 'Bite', fx: { dmg: 5 } }, { n: 'Venom Spit', fx: { poison: 4 } }], script: [1, 0, 0] },
  ghoul: { name: 'Feral Ghoul', style: 'Bleeds you, feeds', tier: 1, rank: 'E', hp: 42, skills: [{ n: 'Claw', fx: { dmg: 3, hits: 2, bleed: 1, perHit: 1 } }, { n: 'Feast', fx: { dmg: 5, lifesteal: 1 } }], script: [0, 0, 1] },
  imp: { name: 'Ember Imp', style: 'Burns and hides', tier: 1, rank: 'E', hp: 38, skills: [{ n: 'Fire Spit', fx: { dmg: 4, burn: 3 } }, { n: 'Cackle', fx: { block: 6 } }], script: [0, 0, 1] },
  brute: { name: 'Pit Brute', style: 'Slow, one huge swing', tier: 1, rank: 'E', hp: 56, skills: [{ n: 'Wind Up', fx: { block: 5 }, label: 'Winding up' }, { n: 'Crushing Swing', fx: { dmg: 18 } }, { n: 'Shove', fx: { dmg: 6 } }], script: [2, 0, 1] },
  seraphine: { name: 'Seraphine Vale', style: 'Holy knight: Block, then Judgement', tier: 2, rank: 'B', rival: true, hp: 80, skills: [{ n: 'Shield of Faith', fx: { block: 14 } }, { n: 'Judgement', fx: { dmg: 16, blockDmg: 1 } }, { n: 'Mend', fx: { heal: 14 } }], script: [0, 1, 0, 1, 2] },
  grukk: { name: 'Grukk the Unbroken', style: 'Berserker: stronger below half HP', tier: 2, rank: 'D', rival: true, hp: 56, enrage: 0.5, enrageMult: 1.25, skills: [{ n: 'Axe Swing', fx: { dmg: 10 } }, { n: 'Roar', fx: { empower: 2 } }, { n: 'Rampage', fx: { dmg: 5, hits: 3 } }], script: [0, 1, 0, 2] },
  lyss: { name: 'Lyss of the Thorn', style: 'Duelist: Poison and dodges', tier: 2, rank: 'B', rival: true, hp: 52, dodge: 0.05, skills: [{ n: 'Needle', fx: { dmg: 4, poison: 1 } }, { n: 'Thousand Needles', fx: { poison: 3, doublePoison: 1 } }, { n: 'Sidestep', fx: { evade: 1 } }], script: [0, 2, 0, 1] },
  masked: { name: 'The Masked Entrant', style: 'Copies your last skill', tier: 2, rival: true, hp: 62, skills: [{ n: 'Strike', fx: { dmg: 8 } }, { n: 'Mirror Form', fx: { mirror: 1 }, label: 'Copying your last skill' }], script: [0, 1] },
  kaito: { name: 'Kaito Ren', style: 'Survivor of three tournaments: cleanses, and resists the skill you use most', tier: 2, rank: 'A', rival: true, hp: 70, kaito: true, skills: [{ n: 'Katana Draw', fx: { dmg: 9 } }, { n: 'Purifying Seal', fx: { cleanse: 1, block: 6 } }, { n: 'Iaido', fx: { dmg: 16 } }], script: [0, 1, 0, 2] },
  calder: { name: 'Ser Calder', style: 'A knight who fights by the book', tier: 2, rank: 'C', rival: true, hp: 76, skills: [{ n: 'Lance', fx: { dmg: 14 } }, { n: 'Shield Wall', fx: { block: 10 } }, { n: 'Disgrace', fx: { dmg: 6, weaken: 2 } }], script: [0, 1, 0, 2] },
  leviathan: { name: 'The Leviathan Queen', style: 'Floods the arena every 3rd turn, Weakening whoever has less Block', tier: 3, rank: 'A', final: true, hp: 165, flood: true, skills: [{ n: 'Tidal Lash', fx: { dmg: 22 } }, { n: 'Coral Armour', fx: { block: 16 } }, { n: 'Crushing Depths', fx: { dmg: 9, weaken: 2 } }], script: [0, 1, 2] },
  kharros: { name: 'Emperor Kharros the Ashen', style: 'Sets you alight every turn, enrages at half HP', tier: 3, rank: 'A', final: true, hp: 112, aura: 0.7, enrage: 0.5, enrageMult: 1.25, skills: [{ n: 'Ashen Blade', fx: { dmg: 10 } }, { n: 'Ashen Pyre', fx: { burn: 3 } }, { n: 'Imperial Guard', fx: { block: 12 } }], script: [0, 1, 2, 0] },
  bone_saint: { name: 'The Bone Saint', style: 'Poisons, drains, and rises once at 30% HP', tier: 3, rank: 'A', final: true, hp: 135, revive: 0.3, skills: [{ n: 'Bone Lance', fx: { dmg: 10 } }, { n: 'Plague Hymn', fx: { poison: 3 } }, { n: 'Marrow Feast', fx: { dmg: 7, lifesteal: 0.5 } }], script: [1, 0, 2, 0] },
  thorn_mother: { name: 'The Thorn Mother', style: 'Briars make you Bleed every turn; she heals', tier: 3, rank: 'A', final: true, hp: 92, briar: 1, skills: [{ n: 'Thorn Lash', fx: { dmg: 5, hits: 2 } }, { n: 'Bloom', fx: { heal: 14 } }, { n: 'Strangling Vine', fx: { dmg: 8, weaken: 1 } }], script: [0, 2, 0, 1] },
  archmage: { name: 'The Archmage Who Fell Upward', style: 'Casts twice every 3rd turn', tier: 3, rank: 'A', final: true, hp: 85, twincast: 3, skills: [{ n: 'Arcane Bolt', fx: { dmg: 11 } }, { n: 'Mirror Ward', fx: { block: 14 } }, { n: 'Starfall', fx: { dmg: 4, hits: 3 } }], script: [0, 2, 1, 0] },
  forge_king: { name: 'The Forge King', style: 'His Block never fades and grows every turn', tier: 3, rank: 'A', final: true, hp: 120, forge: 3, skills: [{ n: 'Molten Hammer', fx: { dmg: 6, blockDmg: 0.4 } }, { n: 'Anvil Guard', fx: { block: 10 } }, { n: 'Quench', fx: { dmg: 13 } }], script: [0, 1, 2, 0] },
  // The Rank Trial examiner. Its rank letter is the grade it tests for, and it fights at that grade's world rank (see trialMul).
  proctor: { name: 'Proctor', style: "The System's examiner. Pass the condition to be promoted", tier: 2, hp: 70, skills: [{ n: 'Marked Strike', fx: { dmg: 9 } }, { n: 'Assessment', fx: { block: 8 } }, { n: 'Pop Quiz', fx: { dmg: 5, weaken: 2 } }, { n: 'Final Exam', fx: { dmg: 7, hits: 2 }, label: 'Preparing the final exam' }], script: [0, 1, 2, 3] },
  legend: { name: 'Varn the Unbowed', style: 'A legend from the System archive', tier: 4, rank: 'A', hp: 150, skills: [{ n: 'Unbowed Strike', fx: { dmg: 13 } }, { n: 'Ancient Guard', fx: { block: 14, cleanse: 1 } }, { n: 'Sundering Blow', fx: { dmg: 9, weaken: 2 } }], script: [0, 1, 2, 0] },
  undefeated: { name: 'The Undefeated', style: 'Has never lost', tier: 4, rank: 'S', hp: 200, skills: [{ n: 'Flawless Strike', fx: { dmg: 14 } }, { n: 'Perfect Guard', fx: { block: 16, cleanse: 1 } }, { n: 'Endless Form', fx: { dmg: 6, hits: 3 } }, { n: 'Verdict', fx: { dmg: 24 } }], script: [0, 1, 2, 0, 3] },
};
const MONSTERS = ['goblin', 'golem', 'drake', 'ghoul', 'imp', 'brute'];
const RIVALS = ['seraphine', 'grukk', 'lyss', 'masked', 'kaito', 'calder'];
const ROUNDS = 8;

const UNLOCKS = {
  arch_arcanist: { name: 'Archetype: Arcanist', desc: 'Quick skills and cooldown tricks join the pool.', cost: 20 },
  arch_storm: { name: 'Archetype: Stormcaller', desc: 'Stuns and Interrupts join the pool.', cost: 20 },
  reroll: { name: 'Extra draft reroll', desc: 'One more reroll at the opening draft.', cost: 15 },
  fourth: { name: 'Fourth world', desc: 'The System offers 4 worlds instead of 3.', cost: 25 },
  purse: { name: 'Heavier purse', desc: 'Start every run with 3 more gold.', cost: 15 },
  gift_gacha: { name: 'Gift: Gacha Luck', desc: 'Cheat skill: a free reroll each round and better shop odds.', cost: 25 },
  gift_latebloomer: { name: 'Gift: Late Bloomer', desc: 'Growth: weaker start, 3 stat points per level.', cost: 15 },
  gift_affinity: { name: 'Gift: Skill Affinity', desc: "Growth: your world's home archetype costs 1 less.", cost: 15 },
  gift_haggler: { name: 'Gift: Haggler', desc: 'Fortune: your first purchase each round costs 1 less.', cost: 15 },
};

// ---------- Helpers ----------
function rnd(rng) { return (rng || Math.random)(); }
function pick(arr, rng) { return arr[Math.floor(rnd(rng) * arr.length)]; }
function shuffle(a, rng) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd(rng) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function wpick(items, weights, rng) { let t = 0; weights.forEach(w => t += w); let x = rnd(rng) * t; for (let i = 0; i < items.length; i++) { x -= weights[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// ---------- Seeded runs (Pending World) ----------
// A run with run.seed draws from named streams instead of Math.random, so everyone playing the same seed gets the same world,
// record, draft, shops, opponents and events. Each call gets a fresh generator keyed by purpose, round and how many times that
// purpose has drawn this round, so a shop reroll never shifts the opponents, and a reloaded save carries on where it left off.
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function seedRng(str) { return mulberry32(hashStr(str)); }
function runRng(run, purpose) {
  run.rngN = run.rngN || {};
  const r = curRound(run), k = purpose + ':' + r, n = run.rngN[k] = (run.rngN[k] || 0) + 1;
  return seedRng(run.seed + ':' + purpose + ':' + r + ':' + n);
}
// The rng to use: the one passed in, else the run's stream for this purpose, else Math.random for a normal run
function stream(run, purpose, rng) { return rng || (run && run.seed ? runRng(run, purpose) : undefined); }
// The game day: the date at UTC+9:30 (a fixed offset, no daylight saving), so each day starts at 14:30 UTC
const DAY_OFFSET = 9.5 * 3600 * 1000;
function dailyDate(now) { return new Date((now == null ? Date.now() : now) + DAY_OFFSET).toISOString().slice(0, 10); }
function dailySeed(date) { return 'wpd:' + date; }
function dailyWorld(date) { return genWorld(seedRng(dailySeed(date) + ':world')); }
function dailyRecord(date, type) { return buildRecord(type, seedRng(dailySeed(date) + ':record')); }
// Pending World is a level field: no Echo unlocks (purse, reroll, fourth world, archetypes, Echo Gifts)
function levelMeta(meta) { return Object.assign({}, meta, { unlocks: {} }); }
// Leaderboard score: round reached, then Hearts left, then fewest turns, in one sortable number
function dailyScore(run) {
  const turns = (run.history || []).reduce((a, h) => a + (h.turns || 0), 0);
  const wins = Math.min(12, run.wins || 0), hearts = Math.min(20, Math.max(0, run.hearts)), t = Math.min(999, turns);
  return { wins, hearts, turns: t, score: 100000 * wins + 1000 * hearts + (999 - t) };
}

function newMeta() { return { v: VERSION, echoes: 0, unlocks: {}, archive: { rivals: {}, beat: {}, finals: {}, evos: {}, reactions: {}, paths: {}, hidden: {}, quests: {} }, titles: {}, firsts: {}, found: {}, presets: [], erased: [], champions: [], runs: 0, wins: 0, rank: newRank() }; }
function migrateMeta(m) {
  if (!m) return newMeta();
  if (m.v === VERSION) { const n = Object.assign(newMeta(), m); n.archive = Object.assign(newMeta().archive, m.archive || {}); n.rank = sanitizeRank(m.rank, n); return n; }
  const n = newMeta(); n.echoes = m.echoes || 0; n.runs = m.runs || 0; n.wins = m.wins || 0; return n;
}
function unlockedArch(meta) { return ARCH_KEYS.filter(k => START_ARCH.includes(k) || meta.unlocks['arch_' + k]); }

// ---------- Worlds ----------
// cap: the highest world rank on offer (Entrant Rank gating). Without one, every rank can come up.
function genWorld(rng, cap) {
  const type = pick(Object.keys(WORLD_TYPES), rng), T = WORLD_TYPES[type];
  const name = pick(T.names[0], rng) + pick(T.names[1], rng);
  const rank = cap == null ? wpick([0, 1, 2, 3, 4, 5], RANK_W, rng) : wpick([0, 1, 2, 3, 4, 5].slice(0, cap + 1), RANK_W.slice(0, cap + 1), rng);
  const mod = wpick(Object.keys(MODIFIERS), [30, 15, 15, 15, 15], rng);
  return { type, name: name.charAt(0).toUpperCase() + name.slice(1), rank, mod, champ: pick(T.champs, rng) };
}
function offerWorlds(meta, rng) { const n = meta.unlocks.fourth ? 4 : 3, cap = worldCap(meta), out = [], seen = new Set(); let guard = 0; while (out.length < n && guard++ < 60) { const w = genWorld(rng, cap); if (seen.has(w.type) && guard < 40) continue; seen.add(w.type); out.push(w); } return out; }

// ---------- Run ----------
// setup: { name, sigil, color, stats, gifts:[], patron: 'war'|'trick'|'ruin'|'none' }
function newRun(world, setup, meta, rng) {
  bindMeta(meta);
  const U = setup.seed ? {} : meta.unlocks, rs = rng || (setup.seed ? seedRng(setup.seed + ':setup') : undefined);
  const home = WORLD_TYPES[world.type].home;
  const pool = unlockedArch({ unlocks: U }).filter(k => k !== home), allies = pool.filter(k => alliesOf(home).includes(k));
  const others = setup.arch ? setup.arch.filter(k => k !== home).slice(0, 3) : shuffle(allies, rs).concat(shuffle(pool.filter(k => !allies.includes(k)), rs)).slice(0, 3);
  const chk = giftCheck(world, setup.gifts, setup.patron, setup.offer);
  const G = setup.gifts;
  const run = {
    v: VERSION, world, name: setup.name, sigil: setup.sigil || 0, color: setup.color || 0, champ: setup.name + ' of ' + world.name,
    stats: Object.assign({}, setup.stats), statPts: 0, level: 1, xp: 0,
    gold: Math.max(0, chk.left) * 3 + (U.purse ? 3 : 0) + (G.includes('veteran') ? 6 : 0),
    gifts: setup.gifts.slice(), patron: setup.patron, arch: [home].concat(others),
    favour: { war: 0, trick: 0, ruin: 0 }, gifted: { war: 0, trick: 0, ruin: 0 },
    slots: setup.gifts.includes('prodigy') ? 5 : 4, bar: [], gear: { weapon: null, armour: null, accessory: null }, bench: [], uid: 0,
    shop: null, locks: null, bonusSlot: null, merges: setup.gifts.includes('merger') ? 3 : 0,
    round: 1, losses: 0, elite: false, eliteIdx: 0, wins: 0, eliteWins: 0, hearts: 10, maxHearts: 10,
    pending: [], log: [], hp: 0, ended: false, stage: 'draft', rerolls: 1 + (U.reroll ? 1 : 0) + (G.includes('veteran') ? 1 : 0), draft: [],
    met: [], choices: null, chosen: null, wager: null, wagerOn: false, districts: [], scouted: false, nextFlags: {}, usedRewind: false, usedBreath: false, path: null, history: [],
    title: setup.title && meta.titles[setup.title] ? setup.title : null, hiddenPath: null, milestones: {}, chains: {}, quests: [], wagersWon: 0, freeRerolls: 0, haggle: false,
    entrant: 100 + (meta.runs || 0) * 7 + Math.floor(rnd(rs) * 7), extraGiven: false, earned: [],
  };
  if (setup.seed) Object.assign(run, { seed: setup.seed, daily: setup.daily || null, ranked: !!setup.ranked, rngN: {} });
  if (G.includes('latebloomer')) STATS.forEach(k => run.stats[k] = Math.max(1, run.stats[k] - 1));
  // System quests: two visible, every hidden one quietly active
  const vis = shuffle(Object.keys(QUESTS).filter(k => !QUESTS[k].hidden), rs).slice(0, 2);
  run.quests = vis.concat(Object.keys(QUESTS).filter(k => QUESTS[k].hidden)).map(id => ({ id, prog: 0, done: false, failed: false }));
  run.bar = new Array(run.slots).fill(null);
  if (setup.script) { run.quests = []; run.script = setup.script; run.practice = true; run.practiceRounds = setup.script.rounds || 3; run.gold += setup.script.gold || 0; }
  else { run.record = setup.record ? JSON.parse(JSON.stringify(setup.record)) : buildRecord(world.type, rng); run.log.push({ t: 'sys', text: `[Filing world record: ${world.name}. ${run.record.ids.length} entries.]` }); }
  if (setup.patron && setup.patron !== 'none') run.favour[setup.patron] = 2;
  // Entrant Rank: promotion perks and a waiting Rank Trial. Pending World and practice runs use neither.
  run.perks = [];
  if (!setup.seed && !run.practice && meta.rank) {
    run.perks = meta.rank.perks.filter(k => PERKS[k]);
    if (run.perks.includes('stipend')) run.gold += 1;
    if (run.perks.includes('redraft')) run.rerolls += 1;
    if (run.perks.includes('patron') && run.patron && run.patron !== 'none') run.favour[run.patron] += 1;
    if (meta.rank.trial) run.trial = { to: meta.rank.trial, round: TRIAL_ROUND[meta.rank.trial], done: false };
  }
  run.draft = rollDraft(run, stream(run, 'draft', rng));
  ['war', 'trick', 'ruin'].forEach(g => { if (G.includes('chosen_' + g)) addFavour(run, g, Math.max(0, 4 - run.favour[g]), meta, run.log, stream(run, 'loot', rng)); });
  run.hp = maxHp(run);
  return run;
}
function hasGift(run, k) { return run.gifts && run.gifts.includes(k); }
function effStats(run) {
  const s = Object.assign({}, run.stats);
  GEAR_SLOTS.forEach(sl => { const g = run.gear[sl]; if (g) Object.entries(gearStats(g.id, g.star)).forEach(([k, v]) => s[k] += v); });
  STATS.forEach(k => s[k] = Math.max(0, s[k]));
  return s;
}
function hpMult(gifts) { let m = 1; if (gifts.includes('dragon')) m *= 1.15; if (gifts.includes('prodigy')) m *= 0.9; if (gifts.includes('glass')) m *= 0.8; if (gifts.includes('f_glass')) m *= 0.8; return m; }
function maxHp(run) { const s = effStats(run); return Math.round((40 + s.VIT * 8 + s.STR * 2 + run.level * 4 + (hasPerk(run, 'frame') ? 8 : 0)) * hpMult(run.gifts)); }
const XP_NEED = [0, 2, 4, 6, 10, 14, 20, 26, 32, 999];
function xpNeed(level) { return XP_NEED[Math.min(level, 9)]; }
function gainXp(run, n, msgs) {
  if (hasGift(run, 'fastlearner')) n = Math.round(n * 1.5);
  run.xp += n;
  while (run.level < 9 && run.xp >= xpNeed(run.level)) {
    run.xp -= xpNeed(run.level); const before = maxHp(run); run.level++; const sp = hasGift(run, 'latebloomer') ? 3 : 2; run.statPts += sp; run.hp += maxHp(run) - before;
    msgs && msgs.push({ t: 'level', text: `[Level up! Level ${run.level}. +${sp} stat points. Shop odds improved.]` });
  }
  if (run.level >= 9) run.xp = 0;
}
function buyXp(run, msgs) { if (run.gold < 4 || run.level >= 9) return false; run.gold -= 4; gainXp(run, 4, msgs); return true; }

// ---------- Pool and shop ----------
const ODDS = [[70, 25, 5, 0, 0], [45, 35, 17, 3, 0], [25, 35, 28, 10, 2], [15, 25, 32, 20, 8]];
function oddsFor(run) { const l = run.level + (hasGift(run, 'lucky') ? 1 : 0) + (hasGift(run, 'gacha') ? 1 : 0); return ODDS[l >= 7 ? 3 : l >= 5 ? 2 : l >= 3 ? 1 : 0]; }
function poolIds(run) {
  const maxed = new Set(allPieces(run).filter(p => p.star >= 3).map(p => baseId(p.id)));
  const ids = SHOP_SKILLS.concat(Object.keys(GEAR));
  return ids.filter(id => pieceDef(id).tags.some(t => run.arch.includes(t)) && !maxed.has(id));
}
function rollPiece(run, rng, opts = {}) {
  let pool = poolIds(run);
  if (opts.kind === 'skill') pool = pool.filter(id => !isGear(id));
  if (opts.kind === 'gear') pool = pool.filter(id => isGear(id));
  if (!pool.length) return null;
  const odds = opts.odds || oddsFor(run);
  let r = wpick([0, 1, 2, 3, 4], odds, rng);
  const ranks = ['E', 'D', 'C', 'B', 'A'];
  for (let k = 0; k < 5; k++) {
    const want = ranks[clamp(r - k, 0, 4)];
    const c = pool.filter(id => pieceDef(id).rank === want);
    if (c.length) { const id = wpick(c, c.map(x => isGear(x) ? 0.75 : 1), rng); return { id, mods: !isGear(id) && rnd(rng) < 0.12 ? rollPrefixes(1, rng, id) : [] }; }
  }
  return null;
}
function price(run, item) {
  let v = PRICE[pieceDef(item.id).rank] + (item.mods ? item.mods.length : 0) + (hasGift(run, 'f_cursed') ? 1 : 0);
  if (hasGift(run, 'affinity') && pieceDef(item.id).tags.includes(run.arch[0])) v = Math.max(1, v - 1);
  if (run.haggle) v = Math.max(0, v - 1);
  return v;
}
function sellValue(p) { return (PRICE[pieceDef(baseId(p.id)).rank] || 1) * [0, 1, 3, 9][p.star] + (p.mods ? p.mods.length : 0); }
// Two shops: skills and gear, 5 slots each, each with its own reroll and locks.
const SHOP_KINDS = ['skill', 'gear'];
function ensureShop(run) {
  if (!run.shop || Array.isArray(run.shop)) run.shop = { skill: [null, null, null, null, null], gear: [null, null, null, null, null] };
  if (!run.locks || Array.isArray(run.locks)) run.locks = { skill: [false, false, false, false, false], gear: [false, false, false, false, false] };
}
function refreshShop(run, rng, kind) {
  ensureShop(run);
  const script = run.script && run.script.shops && run.script.shops[(run.visit || 1) - 1];
  (kind ? [kind] : SHOP_KINDS).forEach(k => {
    for (let i = 0; i < 5; i++) if (!run.locks[k][i] || !run.shop[k][i]) {
      const sid = script && !kind && script[k] && script[k][i];
      run.shop[k][i] = sid ? { id: sid, mods: [] } : rollPiece(run, rng, { kind: k }); run.locks[k][i] = false;
    }
  });
}
function rerollCost(run) { return run.freeRerolls > 0 ? 0 : hasGift(run, 'f_unlucky') ? 3 : 2; }
function reroll(run, rng, kind) { const c = rerollCost(run); if (run.gold < c) return false; if (c === 0) run.freeRerolls--; else run.gold -= c; refreshShop(run, stream(run, 'shop', rng), kind || 'skill'); return true; }
function shopItem(run, kind, i) { ensureShop(run); return kind === 'bonus' ? run.bonusSlot : run.shop[kind][i]; }
function ownedCopies(run, id) { return allPieces(run).filter(p => p.id === id && p.star === 1).length; }
function interestCap(run) { return (hasGift(run, 'golden') ? 5 : 3) + (hasPerk(run, 'ledger') ? 1 : 0); }
function income(run) { return 5 + Math.min(interestCap(run), Math.floor(run.gold / 10)) + (run.world.mod === 'golden' ? 2 : 0); }
function allPieces(run) { return run.bar.filter(Boolean).concat(GEAR_SLOTS.map(s => run.gear[s]).filter(Boolean), run.bench); }
function findPiece(run, u) {
  let i = run.bar.findIndex(p => p && p.u === u); if (i >= 0) return { p: run.bar[i], at: 'bar', i };
  for (const s of GEAR_SLOTS) if (run.gear[s] && run.gear[s].u === u) return { p: run.gear[s], at: 'gear', slot: s };
  i = run.bench.findIndex(p => p.u === u); if (i >= 0) return { p: run.bench[i], at: 'bench', i };
  return null;
}
function mergeNeed(run, id) { if (run.merges > 0) return 2; if (isGear(id) && hasGift(run, 'runesmith')) return 2; return 3; }
function wouldMerge(run, id) { const have = allPieces(run).filter(p => p.id === id && p.star === 1).length; return have + 1 >= mergeNeed(run, id); }
function canBuy(run, item) { return item && run.gold >= price(run, item) && (run.bench.length < 8 || wouldMerge(run, item.id) || hasFreeSlot(run, item.id)); }
function hasFreeSlot(run, id) { return isGear(id) ? !run.gear[GEAR[id].slot] : run.bar.includes(null); }
function addPiece(run, id, mods, msgs, star) {
  const p = { u: ++run.uid, id, star: star || 1, mods: (mods || []).slice() };
  if (isGear(id) && !run.gear[GEAR[id].slot]) run.gear[GEAR[id].slot] = p;
  else if (!isGear(id) && run.bar.includes(null)) run.bar[run.bar.indexOf(null)] = p;
  else run.bench.push(p);
  checkMerges(run, msgs);
  checkPath(run, msgs);
  return p;
}
function buy(run, kind, i, msgs) {
  const item = shopItem(run, kind, i);
  if (!canBuy(run, item)) return false;
  run.gold -= price(run, item); run.haggle = false;
  if (kind === 'bonus') run.bonusSlot = null; else { run.shop[kind][i] = null; run.locks[kind][i] = false; }
  addPiece(run, item.id, item.mods, msgs);
  return true;
}
function removePiece(run, u) {
  const f = findPiece(run, u); if (!f) return null;
  if (f.at === 'bar') run.bar[f.i] = null; else if (f.at === 'gear') run.gear[f.slot] = null; else run.bench.splice(f.i, 1);
  return f.p;
}
function sell(run, u) { const p = removePiece(run, u); if (!p) return 0; const v = sellValue(p); run.gold += v; run.hp = Math.max(1, Math.min(run.hp, maxHp(run))); return v; }
function checkMerges(run, msgs) {
  let guard = 0;
  while (guard++ < 10) {
    const groups = {};
    allPieces(run).forEach(p => { if (p.star < 3 && !(SKILLS[p.id] && SKILLS[p.id].base)) { const k = p.id + '|' + p.star; (groups[k] = groups[k] || []).push(p); } });
    const hit = Object.values(groups).find(g => g.length >= mergeNeed(run, g[0].id));
    if (!hit) return;
    const need = mergeNeed(run, hit[0].id);
    const parts = hit.slice().sort((a, b) => rankLoc(run, a) - rankLoc(run, b)).slice(0, need);
    const keep = parts[0];
    const mods = [];
    parts.forEach(p => p.mods.forEach(m => { if (!mods.includes(m) && mods.length < MAX_MODS) mods.push(m); }));
    parts.slice(1).forEach(p => removePiece(run, p.u));
    keep.star++; keep.mods = mods;
    if (run.merges > 0) run.merges--;
    msgs && msgs.push({ t: 'merge', text: `[Merge! ${pieceDef(keep.id).name} is now ★${keep.star}.]` });
    questEvent(run, 'merge', {}, msgs);
    if (keep.star === 3) worldFirst(run, 'star3', `has forged a ★3 piece: ${pieceDef(keep.id).name}.`, 'ascendant', msgs);
    if (keep.star === 3 && SKILLS[keep.id] && SKILLS[keep.id].evo) { run.pending.push({ type: 'evo', u: keep.u }); msgs && msgs.push({ t: 'skill', text: `[${SKILLS[keep.id].name} has reached ★3. Evolution available.]` }); }
  }
}
function rankLoc(run, p) { const f = findPiece(run, p.u); return f.at === 'bar' || f.at === 'gear' ? 0 : 1; }
function evolve(run, u, evoId, meta) {
  const f = findPiece(run, u); if (!f) return false;
  const from = f.p.id; f.p.id = evoId; f.p.mods = f.p.mods.filter(m => prefixOk(evoId, m, []));
  if (meta) meta.archive.evos[from + '>' + evoId] = true;
  run.pending = run.pending.filter(p => !(p.type === 'evo' && p.u === u));
  return true;
}
// Move a piece to a destination: { bar: i } | { gear: slot } | 'bench'
function movePiece(run, u, dest, msgs) {
  const src = findPiece(run, u); if (!src) return false;
  if (src.at === 'gear' && dest !== 'bench') return false;
  const p = src.p, hpFrac = run.hp / maxHp(run);
  if (dest === 'bench') { if (src.at === 'bench') return false; if (run.bench.length >= 8) return false; removePiece(run, u); run.bench.push(p); }
  else if (dest.bar != null) {
    if (isGear(p.id)) return false;
    const occ = run.bar[dest.bar];
    if (src.at === 'bar') { run.bar[src.i] = occ; run.bar[dest.bar] = p; }
    else { removePiece(run, u); run.bar[dest.bar] = p; if (occ) run.bench.splice(src.i, 0, occ); }
  } else if (dest.gear) {
    if (!isGear(p.id) || GEAR[p.id].slot !== dest.gear) return false;
    const occ = run.gear[dest.gear];
    removePiece(run, u); run.gear[dest.gear] = p; if (occ) run.bench.splice(src.at === 'bench' ? src.i : run.bench.length, 0, occ);
  }
  run.hp = Math.max(1, Math.min(maxHp(run), Math.round(maxHp(run) * hpFrac)));
  checkPath(run, msgs);
  return true;
}
function equipBest(run, u) {
  const f = findPiece(run, u); if (!f || f.at !== 'bench') return false;
  if (isGear(f.p.id)) return movePiece(run, u, { gear: GEAR[f.p.id].slot });
  const e = run.bar.indexOf(null); return movePiece(run, u, { bar: e >= 0 ? e : 0 });
}

// ---------- Archetype counts, passives ----------
function archCounts(barPieces, gearPieces, gifts) {
  const seen = new Set(), c = {};
  barPieces.concat(gearPieces).filter(Boolean).forEach(p => { const b = baseId(p.id); if (seen.has(b)) return; seen.add(b); pieceDef(b).tags.forEach(t => c[t] = (c[t] || 0) + 1); });
  if (gifts && gifts.includes('monarch')) Object.keys(c).forEach(k => c[k]++);
  (gifts || []).forEach(g => { if (GIFTS[g] && GIFTS[g].arch && c[GIFTS[g].arch]) c[GIFTS[g].arch]++; });
  return c;
}
function runCounts(run) { return archCounts(run.bar, GEAR_SLOTS.map(s => run.gear[s]), run.gifts); }
let META = null;
function bindMeta(m) { META = m; }
// Other players' champions (set by the page from the shared store). Each snap carries .owner.
const SHARED = { erased: [], spared: [] };
function setShared(erased, spared) { SHARED.erased = erased || []; SHARED.spared = spared || []; }
// Shared records are untrusted: keep only known pieces and clamp everything to what a real run can reach.
function sanitizeSnap(x, owner) {
  if (!x || typeof x !== 'object') return null;
  const str = (v, n) => String(v == null ? '' : v).slice(0, n);
  const num = (v, a, b, d) => { v = Number(v); return Number.isFinite(v) ? clamp(Math.round(v), a, b) : d; };
  const bar = (Array.isArray(x.bar) ? x.bar : []).slice(0, 5).filter(p => p && SKILLS[p.id] && !SKILLS[p.id].basic).map(p => ({ id: p.id, star: num(p.star, 1, 3, 1), mods: (Array.isArray(p.mods) ? p.mods : []).filter(m => PREFIXES[m]).slice(0, 2) }));
  const gear = (Array.isArray(x.gear) ? x.gear : []).slice(0, 3).filter(p => p && GEAR[p.id]).map(p => ({ id: p.id, star: num(p.star, 1, 3, 1) }));
  const stats = {}; STATS.forEach(k => stats[k] = num(x.stats && x.stats[k], 0, 30, 2));
  const gifts = (Array.isArray(x.gifts) ? x.gifts : []).filter(k => GIFTS[k] && GIFTS[k].cat !== 'flaw').slice(0, 10);
  const ms = {}; STATS.forEach(k => { if (x.milestones && x.milestones[k] && stats[k] >= 10) ms[k] = true; });
  const history = (Array.isArray(x.history) ? x.history : []).slice(0, 12).map(h => ({ round: num(h.round, 1, 12, 1), name: str(h.name, 40), won: !!h.won, turns: num(h.turns, 1, 99, 1), hl: num(h.hl, 0, 9, 0), kind: str(h.kind, 10), dealt: num(h.dealt, 0, 99999, 0) }));
  return {
    champ: str(x.champ, 60) || 'Nameless', name: str(x.name, 20), sigil: num(x.sigil, 0, 5, 0), color: num(x.color, 0, 5, 0), worldName: str(x.worldName, 30), worldType: WORLD_TYPES[x.worldType] ? x.worldType : 'drowned',
    path: ARCH[x.path] ? x.path : null, stats, level: num(x.level, 1, 9, 1), maxHp: num(x.maxHp, 20, 700, 80), round: num(x.round, 1, 8, 1), gifts, title: TITLES[x.title] ? x.title : null, milestones: ms,
    bar, gear, history, cause: str(x.cause, 60) || null, hearts: num(x.hearts, 0, 20, 0), maxHearts: num(x.maxHearts, 1, 20, 10), wins: num(x.wins, 0, 20, 0), elite: num(x.elite, 0, 4, 0), entrant: num(x.entrant, 0, 99999, 0),
    hiddenPath: HIDDEN_PATHS[x.hiddenPath] ? x.hiddenPath : null, at: num(x.at, 0, 1e15, 0), owner: owner || null, shared: !!owner,
    rec: sanitizeRec(x.rec, x.worldType),
    rank: rankIdx(x.rank) >= 0 ? x.rank : null, rp: num(x.rp, 0, 1e6, 0), kills: num(x.kills, 0, 9999, 0),
  };
}
function earnTitle(run, id, msgs) {
  if (!META || META.titles[id] || (run && run.practice)) return false;
  META.titles[id] = true;
  msgs && msgs.push({ t: 'class', text: `[Title acquired: ${TITLES[id].name}. ${TITLES[id].desc}]` });
  const g = Object.keys(GIFTS).find(k => GIFTS[k].lock === id);
  if (g) msgs && msgs.push({ t: 'class', text: `[New Gift unlocked in the library: ${GIFTS[g].name}.]` });
  if (run && !run.title) { run.title = id; msgs && msgs.push({ t: 'class', text: `[Title equipped: ${TITLES[id].name}.]` }); }
  return true;
}
function worldFirst(run, key, text, titleId, msgs) {
  if (!META || META.firsts[key] || (run && run.practice)) return false;
  META.firsts[key] = true;
  msgs && msgs.push({ t: 'broadcast', text: `[World First! Entrant ${run ? run.entrant : '?'} ${text}]` });
  if (titleId) earnTitle(run, titleId, msgs);
  return true;
}
function checkPath(run, msgs) {
  const c = runCounts(run);
  const top = Object.keys(c).filter(k => c[k] >= 4).sort((a, b) => c[b] - c[a])[0];
  if (top && run.path !== top) { run.path = top; msgs && msgs.push({ t: 'class', text: `[Path recognised: ${ARCH[top].path}.]` }); questEvent(run, 'path', {}, msgs); }
  if (!top) run.path = null;
  const hp = hiddenPathOf(c);
  if (hp && run.hiddenPath !== hp) {
    run.hiddenPath = hp; const H = HIDDEN_PATHS[hp];
    msgs && msgs.push({ t: 'class', text: `[Hidden Path unlocked: ${H.name}. ${H.desc}]` });
    if (META) META.archive.hidden[hp] = true;
    worldFirst(run, 'hidden', `has walked a Hidden Path: ${H.name}.`, 'pathfinder', msgs);
  }
  if (!hp) run.hiddenPath = null;
  if (run.milestones) checkMilestones(run, msgs);
}
// Stat milestones at 10
const MILESTONES = {
  STR: { name: 'Mighty Frame', desc: 'Reaper and Stormcaller skills deal 10% more.' },
  AGI: { name: 'Afterimage', desc: 'Evade the first attack each fight.' },
  INT: { name: 'Arcane Mind', desc: 'Your first damaging skill each fight deals 30% more.' },
  VIT: { name: 'Iron Constitution', desc: '+1 max Heart.' },
  LUK: { name: "Fortune's Favourite", desc: 'One free reroll every round.' },
};
function checkMilestones(run, msgs) {
  const s = effStats(run);
  STATS.forEach(k => {
    if (s[k] >= 10 && !run.milestones[k]) {
      run.milestones[k] = true;
      msgs && msgs.push({ t: 'level', text: `[Stat milestone: ${k} 10. ${MILESTONES[k].name}: ${MILESTONES[k].desc}]` });
      if (k === 'VIT') { run.maxHearts++; run.hearts++; amendRecord(run, msgs, stream(run, 'record')); }
      if (k === 'LUK') run.freeRerolls++;
    }
  });
}
// P: every passive modifier the combat engine reads.
// x: { title, stats (effective), milestones }
function buildP(barPieces, gearPieces, gifts, favourTiers, lvl, x) {
  const P = {}, add = (k, v) => P[k] = (P[k] || 0) + v, set = (k, v) => P[k] = v;
  x = x || {};
  const c = archCounts(barPieces, gearPieces, gifts), lm = 1 + 0.08 * ((lvl || 1) - 1);
  const t = k => archTier(c[k] || 0);
  if (t('pyre') >= 1) set('burnFade', 0.15); if (t('pyre') >= 2) add('burnPlus', 4); if (t('pyre') >= 3) set('burnFade', 0);
  if (t('venom') >= 1) add('poisonPlus', 1); if (t('venom') >= 2) add('poisonPlus', 1); if (t('venom') >= 3) set('poisonMult', 1.5);
  if (t('blade') >= 1) set('extraHit', 1); if (t('blade') >= 2) add('bleedPlus', 2); if (t('blade') >= 3) set('bleedMult', 2);
  if (t('bastion') >= 1) add('blockKeep', 0.25); if (t('bastion') >= 2) add('thornsAlways', Math.round(4 * lm)); if (t('bastion') >= 3) set('blockStrike', 0.5);
  if (t('arcanist') >= 1) { add('quickCd', 1); set('arcCd', 8); } if (t('arcanist') >= 2) set('firstFree', 1); if (t('arcanist') >= 3) set('quickTwice', 1);
  if (t('zealot') >= 1) add('healPct', 0.1); if (t('zealot') >= 2) add('regen', Math.round(2 * lm)); if (t('zealot') >= 3) set('overhealBlock', 1);
  if (t('reaper') >= 1) { add('vsHalf', 0.25); set('reapPierce', 1); set('reapBlood', 0.15); } if (t('reaper') >= 2) add('lifesteal', 0.2); if (t('reaper') >= 3) { set('doomFaster', 1); set('heartOnWin', 1); }
  if (t('storm') >= 1) { add('stunDmg', Math.round(12 * lm)); set('stormBreak', 1); } if (t('storm') >= 2) set('stunWeaken', 2); if (t('storm') >= 3) set('every3Stun', 1);
  gearPieces.filter(Boolean).forEach(g => Object.entries(gearPas(g.id, g.star)).forEach(([k, v]) => { if (k === 'firstCrit' || k === 'firstStun' || k === 'firstEvade') set(k, 1); else add(k, k === 'stunDmg' || k === 'thornsAlways' || k === 'regen' || k === 'startBlock' ? Math.round(v * lm) : v); }));
  // Hidden Path
  const hp = hiddenPathOf(c);
  if (hp) Object.entries(HIDDEN_PATHS[hp].fx).forEach(([k, v]) => add(k, v));
  const G = gifts || [];
  if (G.includes('tidecaller')) add('regen', 2);
  if (G.includes('deserter')) add('startBlock', 15);
  if (G.includes('warden')) add('poisonHeal', 0.3);
  if (G.includes('hedgewitch')) { P.burnFade = Math.min(P.burnFade != null ? P.burnFade : 0.3, 0.2); P.poisonMult = (P.poisonMult || 1) * 1.25; }
  if (G.includes('catalyst')) P.reactMult = (P.reactMult || 1) * 1.5;
  if (G.includes('berserker')) add('lowHpDmg', 0.3);
  if (G.includes('ironbody')) add('startBlockPct', 0.1);
  if (G.includes('glass')) add('dmgPct', 0.3);
  if (G.includes('lucky')) add('critBonus', 0.1);
  if (G.includes('firststrike')) add('firstHit', 1);
  if (G.includes('thickskin')) add('flatDR', 2);
  if (G.includes('vampire')) add('lifesteal', 0.08);
  if (G.includes('manaaffinity')) add('quickCd', 1);
  if (G.includes('elf')) { add('dodge', 0.1); add('bleedPlus', 1); }
  if (G.includes('demon')) { add('dmgPct', 0.15); add('healPct', -0.2); }
  if (G.includes('dragon')) set('reactHeal', 5);
  if (G.includes('lastwords')) set('lastWords', 0.25);
  if (G.includes('f_sluggish')) set('sluggish', 1);
  if (G.includes('swordsaint')) set('swordSaint', 1);
  if (G.includes('copycat')) set('copycat', 1);
  // Title
  const T = x.title;
  if (T === 'first_blood') add('firstHit', 0.5);
  if (T === 'untouched') add('startBlock', 8);
  if (T === 'giant_slayer') add('vsBigger', 0.15);
  if (T === 'mirror_breaker') add('critBonus', 0.08);
  if (T === 'bloodthirsty') add('lifesteal', 0.05);
  if (T === 'spellweaver') add('afterQuick', 0.1);
  if (T === 'underdog') add('vsHard', 0.1);
  if (T === 'comeback') set('lowDR', 0.2);
  if (T === 'alchemist') P.reactMult = (P.reactMult || 1) * 1.2;
  if (T === 'executioner') set('critMult', 1.75);
  if (T === 'tidebreaker') add('startBlock', 6);
  if (T === 'emberfall') add('burnPlus', 1);
  if (T === 'bonebreaker') add('poisonPlus', 1);
  if (T === 'thornbane') add('bleedPlus', 1);
  if (T === 'skyfall') { add('critBonus', 0.05); add('dodge', 0.05); }
  if (T === 'forgebreaker') add('thornsAlways', 2);
  if (T === 'ascendant') add('dmgPct', 0.05);
  if (T === 'pathfinder') { add('startBlock', 5); add('regen', 1); }
  if (T === 'unbeaten') add('dmgPct', 0.1);
  // Promotion perks, about the size of a Title each
  const K = x.perks || [];
  if (K.includes('kindling')) add('burnPlus', 1);
  if (K.includes('steeped')) add('poisonPlus', 1);
  if (K.includes('whetted')) add('bleedPlus', 1);
  if (K.includes('guard')) add('startBlock', 5);
  if (K.includes('keen')) add('critBonus', 0.04);
  if (K.includes('light')) add('dodge', 0.03);
  // Stat milestones
  const M = x.milestones || {};
  if (M.STR) set('mighty', 0.1);
  if (M.AGI) set('firstEvade', 1);
  if (M.INT) add('firstHit', 0.3);
  const F = favourTiers || {};
  if (F.war >= 2) add('dmgPct', 0.15);
  if (F.trick >= 2) add('dotPlus', 2);
  if (F.ruin >= 2) add('lowHpDmg', 0.3);
  return P;
}
function favourTiers(run) { const o = {}; Object.keys(GODS).forEach(g => o[g] = run.favour[g] >= 8 ? 2 : run.favour[g] >= 4 ? 1 : 0); return o; }
function runP(run) { return buildP(run.bar, GEAR_SLOTS.map(s => run.gear[s]), run.gifts, favourTiers(run), run.level, { title: run.title, milestones: run.milestones, perks: run.perks }); }

// ---------- Opponents: choice of two each round ----------
const TUNE = { hp0: 1.6, hpSlope: 0.45, dmgSlope: 0.32, hard: 1.25, hardHp: 1.3, finalHp: 0.85, finalDmg: 0.95, alpha: 1.1, monsterRamp: 0.08 };
function roundPower(round) { return 1 + TUNE.dmgSlope * (round - 1); }
function roundHp(round) { return TUNE.hp0 * (1 + TUNE.hpSlope * (round - 1)); }
function curRound(run) { return run.elite ? ROUNDS + Math.min(1, run.eliteIdx) : run.round; }
function rankMul(run) { return (0.92 + 0.05 * run.world.rank) * (hasGift(run, 'f_marked') ? 1.1 : 1); }
const HEART_COST = [1, 1, 2, 2, 3, 3, 4, 5];
function heartCost(run, spec) { if (run.elite) return 0; const c = HEART_COST[Math.min(ROUNDS, run.round) - 1] + (spec && spec.hard && spec.kind !== 'trial' ? 1 : 0); return hasGift(run, 'ironwill') ? Math.max(1, c - 1) : c; }
function makeChoices(run, meta, rng) {
  if (run.script && run.script.choices && run.script.choices[run.round - 1]) return run.script.choices[run.round - 1].map(c => Object.assign({}, c));
  if (run.round >= ROUNDS) return [{ kind: 'final', id: WORLD_TYPES[run.world.type].final }];
  const early = run.round <= 3;
  let pool = shuffle((early ? MONSTERS : RIVALS).filter(id => !run.met.includes(id)), rng);
  // Rivals come in rank order: D-rank around round 4 up to A-rank around round 7. The Masked Entrant fits any round.
  if (!early) { const want = RANKS.indexOf('D') + run.round - 4, gap = id => ENEMIES[id].rank ? Math.abs(RANKS.indexOf(ENEMIES[id].rank) - want) : 0.5; pool = pool.map(id => ({ id, k: gap(id) + rnd(rng) * 1.5 })).sort((x, y) => x.k - y.k).map(x => x.id); }
  const easy = { kind: early ? 'monster' : 'rival', id: pool[0] };
  if (!early && run.sabotage && !run.met.includes(run.sabotage)) { easy.id = run.sabotage; easy.sabotaged = true; if (pool[1] === run.sabotage) pool[1] = pool[0]; }
  let hard = { kind: early ? 'monster' : 'rival', id: pool[1] || pool[0], hard: true };
  const chance = run.world.mod === 'restless' ? 0.6 : 0.3;
  // Pending World never draws other champions, so every player faces the same fights
  const erased = run.seed ? [] : meta.erased.concat(SHARED.erased).filter(s => !run.met.includes('snap:' + s.at));
  if (run.round >= 4 && erased.length && rnd(rng) < chance) hard = { kind: 'erased', snap: pick(erased, rng), hard: true };
  if (run.trial && !run.trial.done && run.round === run.trial.round) hard = trialSpec(run, rng);
  return [easy, hard];
}
function specKey(spec) { return spec.snap ? 'snap:' + spec.snap.at : spec.id; }
function specName(spec) {
  if (spec.kind === 'trial') return `${spec.to}-rank Proctor`;
  if (spec.kind === 'erased' || spec.kind === 'champion') return spec.snap.champ;
  const n = ENEMIES[spec.id].name;
  if (spec.hard) return spec.kind === 'monster' ? 'Alpha ' + n : n + ', Veteran';
  return n;
}
// The rank letter an opponent fights at: Alphas are a rank above other monsters, and the Masked Entrant copies yours
function specRank(spec, meta) {
  if (spec.kind === 'trial') return spec.to;
  if (spec.snap) return spec.snap.rank || null;
  const t = ENEMIES[spec.id]; if (!t) return null;
  if (spec.id === 'masked') return meta && meta.rank ? meta.rank.letter : null;
  return spec.hard && spec.kind === 'monster' ? 'D' : t.rank || null;
}
function specStyle(spec) {
  if (spec.kind === 'trial') return "The System's examiner. Pass the condition to be promoted";
  if (spec.kind === 'erased') return `Erased. Fell in round ${spec.snap.round} as a ${spec.snap.path ? ARCH[spec.snap.path].path : 'champion'}`;
  if (spec.kind === 'champion') return `Saved ${spec.snap.worldName} as a ${spec.snap.path ? ARCH[spec.snap.path].path : 'champion'}`;
  return ENEMIES[spec.id].style;
}
function specReward(spec) {
  if (spec.kind === 'trial') return `Promotion to ${spec.to}-rank` + (spec.hard ? ', 3 gold, a rune and a rare shop slot' : ' and 3 gold');
  if (spec.kind === 'final') return 'Spares your world';
  if (spec.kind === 'erased') return '3 gold, a rune, a rare shop slot and one of their pieces';
  if (spec.hard) return '3 gold, a rune and a rare shop slot';
  return '3 gold';
}
function chooseOpponent(run, i, wagerOn) {
  run.chosen = run.choices[i]; run.wagerOn = !!(wagerOn && run.wager && run.gold >= 5);
  if (run.wagerOn) run.gold -= 5;
  run.stage = 'shop';
}
function currentSpec(run) { return run.elite ? run.eliteBracket[run.eliteIdx] : run.chosen; }

// ---------- Wagers ----------
const WAGERS = {
  fast: { text: 'Win within 6 turns', check: f => f.turn <= 6 },
  noheal: { text: 'Win without healing', check: f => f.tally.healed <= 0 },
  react: { text: 'Trigger 2 reactions', check: f => f.tally.reactions >= 2 },
  stop: { text: "Stun or Interrupt the opponent's big move", check: f => f.tally.bigStopped >= 1 },
  healthy: { text: 'Win with more than half your HP', check: f => f.A.hp > f.A.maxHp / 2 },
};
function canStop(run) { const P = runP(run); return P.firstStun || P.every3Stun || run.bar.some(p => p && SKILLS[p.id] && (SKILLS[p.id].fx.stun || SKILLS[p.id].fx.interrupt || SKILLS[p.id].fx.stunIfWeak)); }
function makeWager(run, rng) {
  const god = run.patron !== 'none' && rnd(rng) < 0.6 ? run.patron : pick(Object.keys(GODS), rng);
  const keys = Object.keys(WAGERS).filter(k => k !== 'stop' || canStop(run));
  return { god, key: pick(keys, rng) };
}
function addFavour(run, god, n, meta, msgs, rng) {
  run.favour[god] += n;
  msgs && msgs.push({ t: 'favour', text: `[${GODS[god].name} is pleased. Favour +${n}.]` });
  if (run.favour[god] >= 4 && run.gifted[god] < 1) {
    run.gifted[god] = 1;
    const pool = poolIds(run).filter(id => pieceDef(id).rank === 'B' && pieceDef(id).tags.some(t => GODS[god].arch.includes(t)));
    const id = pick(pool.length ? pool : poolIds(run).filter(x => pieceDef(x).rank === 'B'), rng);
    if (id) { msgs && msgs.push({ t: 'favour', text: `[Gift from ${GODS[god].name}: ${pieceDef(id).name}.]` }); addPiece(run, id, [], msgs); }
  }
  if (run.favour[god] >= 8 && run.gifted[god] < 2) { run.gifted[god] = 2; msgs && msgs.push({ t: 'favour', text: `[Blessing of ${GODS[god].name}: ${GODS[god].blessing}]` }); }
}

// ---------- Between rounds ----------
const DISTRICTS = {
  infirmary: { name: 'Infirmary', desc: 'Restore 50% of your max HP.' },
  sanctum: { name: 'Sanctum', desc: 'Restore 2 Hearts.' },
  undercity: { name: 'Undercity', desc: 'Something is happening in the tunnels.' },
  scout: { name: "Scout's Post", desc: "See your opponent's full kit and their next 2 moves." },
  enchanter: { name: 'Enchanter', desc: 'Carve a prefix into one of your skills.' },
};
function rollDistricts(run, rng) {
  if (run.script && run.script.districts && run.script.districts[run.round - 1]) return run.script.districts[run.round - 1].slice();
  let keys = Object.keys(DISTRICTS).filter(k => !(k === 'sanctum' && run.hearts >= run.maxHearts) && !(k === 'infirmary' && run.hp >= maxHp(run)) && !(k === 'scout' && hasGift(run, 'appraisal')));
  const w = { infirmary: 3, sanctum: 2, undercity: 3, scout: 2, enchanter: 3 };
  const out = []; let g = 0; while (out.length < 3 && g++ < 50) { const k = wpick(keys, keys.map(x => w[x]), rng); if (!out.includes(k)) out.push(k); }
  if (run.hp < maxHp(run) * 0.45 && !out.includes('infirmary')) out[2] = 'infirmary';
  return out;
}
function infirmary(run) { const f = run.world.mod === 'famine' ? 0.25 : 0.5; const m = maxHp(run), b = run.hp; run.hp = Math.min(m, run.hp + Math.round(m * f)); return run.hp - b; }
function sanctum(run, msgs) { const b = run.hearts; run.hearts = Math.min(run.maxHearts, run.hearts + 2); restoreRecord(run, run.hearts - b, msgs); return run.hearts - b; }
// Events. Chains set flags that later events check: they come back on their own a round or two later.
// opts: { label, desc, can(run), go(run, meta, rng, msgs), reveal }
// label is an action the player can take and desc a hint. Costs show only when paying is the action itself (Pay 6 gold);
// any other consequence is revealed after the choice. An option whose can() fails is left out, never shown greyed out
// In chains, desc is a hint and the reward stays hidden: reveal (a string or fn(run)) is shown after choosing
// when go() adds no message of its own. Costs always stay visible in the label or desc.
const EVENTS = {
  merchant: { title: 'Hooded merchant', text: () => 'A merchant in the tunnels sells forbidden techniques. The price is a little of your life.', opts: [
    { label: 'Buy a technique', desc: 'Whatever he has under the hood.', go: (run, meta, rng, msgs) => { lose(run, 0.1, msgs, 'The price is paid in blood.'); const pool = poolIds(run).filter(x => ['C', 'B'].includes(pieceDef(x).rank)); const id = pick(pool, rng); if (id) { msgs.push({ t: 'loot', text: `[Acquired: ${pieceDef(id).name}]` }); addPiece(run, id, [], msgs); } } },
    { label: 'Walk away', desc: 'Nothing happens', go: () => { } }] },
  crowd: { title: 'The crowd chants', text: () => 'The crowd is chanting your name. The gods are listening.', opts: [
    { label: 'Show off', desc: 'Give the gods something to watch.', go: (run, meta, rng, msgs) => { const b = run.hp; run.hp = Math.max(1, run.hp - 8); msgs.push({ t: 'loss', text: `[You overdid it. −${b - run.hp} HP.]` }); addFavour(run, pick(Object.keys(GODS), rng), 2, meta, msgs, rng); } },
    { label: 'Wave and rest', desc: 'Let them chant. You sit down.', go: (run, meta, rng, msgs) => { const b = run.hp; run.hp = Math.min(maxHp(run), run.hp + 10); msgs.push({ t: 'loot', text: `[Rested. +${run.hp - b} HP.]` }); } }] },
  // --- The Official ---
  official_1: { chain: 'official', title: 'A quiet word', text: () => 'A tournament official offers to "adjust" your next match. He smiles too much.', opts: [
    { label: 'Pay 6 gold', desc: 'He will "adjust" your next match.', reveal: '[Your next opponent starts with 20% less HP.]', can: run => run.gold >= 6, go: run => { run.gold -= 6; run.nextFlags.bribe = true; run.chains.official = { step: 'bribed', due: run.round + 2 }; } },
    { label: 'Refuse', desc: 'Someone up there might respect that.', go: (run, meta, rng, msgs) => { addFavour(run, 'war', 2, meta, msgs, rng); run.chains.official = { step: 'refused', due: run.round + 2 }; } }] },
  official_bribed: { chain: 'official', title: 'Blackmail', text: () => 'The official is back. He has a ledger with your name in it, and the System would love to read it.', opts: [
    { label: 'Pay him 8 gold', desc: 'He goes away. For now.', can: run => run.gold >= 8, go: run => { run.gold -= 8; run.chains.official = 'done'; } },
    { label: 'Let him talk', desc: 'Let the System read his ledger.', go: (run, meta, rng, msgs) => { msgs.push({ t: 'loss', text: '[Scandal recorded. Your world pays for it.]' }); if (run.hearts > 1) { run.hearts--; eraseRecord(run, 1, msgs); } run.chains.official = 'done'; } }] },
  official_refused: { chain: 'official', title: 'The honest official', text: () => 'The official you refused finds you after a match. "Nobody turns me down. I respect that." He slips you a folded page: notes on how the Final Champion fights.', opts: [
    { label: 'Take the notes', desc: 'A folded page about the final.', go: (run, meta, rng, msgs) => { run.chains.official = 'tip'; msgs.push({ t: 'sys', text: "[Final Champion notes acquired. In the final, you'll see their next 2 moves.]" }); } }] },
  // --- The Poisoner ---
  poisoner_1: { chain: 'poisoner', title: 'Tampered water', text: () => 'Someone has tampered with your water skin. It smells of herbs and something worse.', opts: [
    { label: 'Drink it anyway', desc: 'It might be worth it.', reveal: '[+2 VIT. You start the next fight with 4 Poison.]', go: run => { run.stats.VIT += 2; run.nextFlags.poison = 4; run.chains.poisoner = 'done'; } },
    { label: 'Investigate', desc: 'Find out who did it.', reveal: '[Inquiries made. A name will surface.]', go: (run, meta, rng) => poisonerFound(run, rng) },
    { label: 'Pour it out', desc: 'Nothing happens', go: run => { run.chains.poisoner = 'done'; } }] },
  poisoner_found: { chain: 'poisoner', title: 'The poisoner', text: run => `A stable boy talks for a coin: it was ${ENEMIES[run.chains.poisoner.who].name}'s people who tampered with your water.`, opts: [
    { label: 'Expose them to the crowd', desc: 'Let the crowd judge them. Someone will enjoy it.', go: (run, meta, rng, msgs) => { addFavour(run, 'trick', 3, meta, msgs, rng); run.chains.poisoner = 'done'; } },
    { label: 'Return the favour', desc: 'A taste of their own medicine.', reveal: run => `[${ENEMIES[run.sabotage].name} will appear among your next rivals, Weakened for 3 turns and with 15% less HP.]`, go: run => { run.sabotage = run.chains.poisoner.who; run.chains.poisoner = 'done'; } }] },
  // --- The Letter ---
  letter_1: { chain: 'letter', title: 'A letter from the Erased', text: () => 'Under your cot you find a letter from a champion whose world no longer exists. It ends with a crude map.', opts: [
    { label: 'Read it', desc: 'Follow the map.', go: (run, meta, rng, msgs) => { const k = pick(STATS, rng); run.stats[k]++; msgs.push({ t: 'sys', text: `[+1 ${k}]` }); run.chains.letter = { step: 'map', due: run.round + 1 }; } },
    { label: 'Sell it', desc: 'Someone will pay for a dead world\'s secrets.', reveal: '[Sold. +5 gold.]', go: run => { run.gold += 5; run.chains.letter = 'done'; } }] },
  letter_map: { chain: 'letter', title: 'The old quarter', text: () => "The letter's map leads to a rusted grate in the old quarter. A bored sentry leans on it.", opts: [
    { label: 'Bribe the sentry (5 gold)', desc: 'Go through', can: run => run.gold >= 5, go: run => { run.gold -= 5; run.chains.letter = { step: 'cache', due: run.round + 1 }; } },
    { label: 'Sneak past', desc: 'Wait for him to look away.', go: (run, meta, rng, msgs) => { lose(run, 0.15, msgs, 'He looked back. You got through anyway.'); run.chains.letter = { step: 'cache', due: run.round + 1 }; } },
    { label: 'Give up', desc: 'Turn back. The map is lost.', go: run => { run.chains.letter = 'done'; } }] },
  letter_cache: { chain: 'letter', title: 'The cache', text: () => "Behind the grate: a box with the Erased champion's last possession, and a note. [I lost. Make sure it meant something.]", opts: [
    { label: 'Take it', desc: 'Whatever it is, it was theirs.', go: (run, meta, rng, msgs) => {
      run.chains.letter = 'done';
      if (meta) { meta.found = meta.found || {}; meta.found.lastwords = true; }
      if (!hasGift(run, 'lastwords')) { run.gifts.push('lastwords'); msgs.push({ t: 'class', text: '[Hidden Gift acquired: Last Words.]' }); } else { run.gold += 10; msgs.push({ t: 'loot', text: '[+10 gold]' }); }
    } }] },
};
// A consequence revealed after the choice: lose a share of max HP and say how much
function lose(run, f, msgs, text) { const b = run.hp; run.hp = Math.max(1, run.hp - Math.round(maxHp(run) * f)); msgs.push({ t: 'loss', text: `[${text} −${b - run.hp} HP.]` }); }
function poisonerFound(run, rng) { const who = pick(RIVALS.filter(r => !run.met.includes(r)), rng) || 'lyss'; run.chains.poisoner = { step: 'found', who, due: run.round + 1 }; }
const CHAIN_STARTERS = { official: 'official_1', poisoner: 'poisoner_1', letter: 'letter_1' };
function undercityEvent(run, rng) {
  const keys = ['merchant', 'crowd'].concat(Object.keys(CHAIN_STARTERS).filter(c => !run.chains[c]).map(c => CHAIN_STARTERS[c]));
  const w = keys.map(k => EVENTS[k].chain ? 3 : 1);
  return wpick(keys, w, rng);
}
function dueChainEvents(run) {
  const out = [];
  Object.entries(run.chains || {}).forEach(([c, st]) => { if (st && typeof st === 'object' && st.due <= run.round) out.push(c + '_' + st.step); });
  return out.filter(k => EVENTS[k]);
}
// The option if the player can take it, else null (left out), so every choice shown is pickable
function eventOpt(run, key, idx) {
  const o = EVENTS[key] && EVENTS[key].opts[idx];
  return o && (!o.can || o.can(run)) ? o : null;
}
function resolveEvent(run, key, idx, meta, rng, msgs) {
  const o = eventOpt(run, key, idx);
  if (!o) return false;
  msgs = msgs || []; const before = msgs.length;
  o.go(run, meta, stream(run, 'event', rng), msgs);
  if (o.reveal && msgs.length === before) msgs.push({ t: 'sys', text: typeof o.reveal === 'function' ? o.reveal(run) : o.reveal });
  return true;
}
function prefixTargets(run, m) { return allPieces(run).filter(p => SKILLS[p.id] && prefixOk(p.id, m, p.mods)).map(p => ({ u: p.u, id: p.id, mods: p.mods })); }
function applyPrefix(run, u, m) {
  const f = findPiece(run, u); if (!f || !prefixOk(f.p.id, m, f.p.mods)) return false;
  if (f.p.mods.length >= MAX_MODS) f.p.mods.shift();
  f.p.mods.push(m); return true;
}

// ---------- Quests ----------
function questEvent(run, kind, d, msgs) {
  (run.quests || []).forEach(q => {
    if (q.done || q.failed) return;
    let inc = 0; const f = d.f;
    if (kind === 'fight' && d.won) {
      if (q.id === 'rival_noheal' && d.spec.kind === 'rival' && f.tally.healed <= 0) inc = 1;
      if (q.id === 'fast3' && f.turn <= 6) inc = 1;
      if (q.id === 'hard2' && d.spec.hard) inc = 1;
      if (q.id === 'h_overkill' && f.tally.overkill >= 30) inc = 1;
      if (q.id === 'h_clutch' && f.A.hp <= f.A.maxHp * 0.1) inc = 1;
    }
    if (kind === 'fight') {
      if (q.id === 'react6') inc = f.tally.reactions;
      if (q.id === 'h_stun3' && f.tally.stuns >= 3) inc = 1;
    }
    if (kind === 'merge') {
      if (q.id === 'merge4') inc = 1;
      if (q.id === 'h_collector' && allPieces(run).filter(p => p.star >= 2).length >= 3) inc = 1;
    }
    if (kind === 'path' && q.id === 'path5' && run.round <= 5) inc = 1;
    if (kind === 'shop' && q.id === 'h_bankrupt' && run.gold === 0) inc = 1;
    if (inc) { q.prog = Math.min(QUESTS[q.id].goal, q.prog + inc); if (q.prog >= QUESTS[q.id].goal) completeQuest(run, q, msgs); }
  });
}
function completeQuest(run, q, msgs) {
  const Q = QUESTS[q.id]; q.done = true;
  if (META) META.archive.quests[q.id] = true;
  msgs && msgs.push({ t: 'class', text: `[${Q.hidden ? 'Hidden quest' : 'Quest'} complete: ${Q.text} Reward: ${QUEST_REWARD[Q.reward]}.]` });
  const r = Q.reward;
  if (r === 'rune') run.pending.push({ type: 'rune', mods: rollPrefixes(3, stream(run, 'loot'), null, run) });
  if (r === 'gold5') run.gold += 5; if (r === 'gold6') run.gold += 6; if (r === 'gold8') run.gold += 8;
  if (r === 'heart') { run.maxHearts++; run.hearts++; amendRecord(run, msgs, stream(run, 'record')); }
  if (r === 'favour') addFavour(run, 'war', 2, META, msgs);
  if (r === 'piece') { const pool = poolIds(run).filter(x => pieceDef(x).rank === 'B'); const id = pick(pool, stream(run, 'loot')); if (id) { msgs && msgs.push({ t: 'loot', text: `[Quest reward: ${pieceDef(id).name}]` }); addPiece(run, id, [], msgs); } }
}
// ---------- Additional Gift (after round 4) ----------
function extraGiftOffers(run, rng) {
  const c = runCounts(run);
  const top = Object.keys(c).filter(k => run.arch.includes(k)).sort((a, b) => c[b] - c[a])[0] || run.arch[0];
  const M = run.seed && META ? levelMeta(META) : META;
  const pool = Object.keys(GIFTS).filter(k => ['growth', 'combat', 'fortune', 'bloodline'].includes(GIFTS[k].cat) && !hasGift(run, k) && giftUnlocked(k, M) && !['latebloomer', 'veteran'].includes(k));
  return ['aff_' + top].concat(shuffle(pool, rng).slice(0, 2));
}
function applyGift(run, k, msgs) {
  if (!GIFTS[k] || hasGift(run, k)) return false;
  run.gifts.push(k);
  if (k === 'merger') run.merges = 3;
  if (k === 'dragon') run.hp = Math.round(run.hp * 1.15);
  msgs && msgs.push({ t: 'class', text: `[Additional Gift granted: ${GIFTS[k].name}.]` });
  checkPath(run, msgs);
  return true;
}

// Stage machine: draft -> (choose -> shop -> district -> fight)*
function rollDraft(run, rng) {
  if (run.script && run.script.draft) return run.script.draft.slice();
  const pool = SHOP_SKILLS.filter(id => SKILLS[id].tags.some(t => run.arch.includes(t)) && ['E', 'D'].includes(SKILLS[id].rank));
  const out = []; let g = 0;
  // at least one from the home archetype
  const home = pool.filter(id => SKILLS[id].tags.includes(run.arch[0]));
  if (home.length) out.push(pick(home, rng));
  while (out.length < 6 && g++ < 200) { const id = pick(pool, rng); if (!out.includes(id)) out.push(id); }
  return shuffle(out, rng);
}
function rerollDraft(run, rng) { if (run.rerolls <= 0) return false; run.rerolls--; run.draft = rollDraft(run, stream(run, 'draft', rng)); return true; }
function confirmDraft(run, ids, meta, rng) {
  ids.forEach(id => addPiece(run, id, []));
  run.draft = [];
  run.shop = null; run.locks = null; refreshShop(run, stream(run, 'shop', rng));
  enterChoose(run, meta, rng);
}
function enterChoose(run, meta, rng, msgs) {
  run.scouted = false; run.wagerOn = false; run.chosen = null;
  run.visit = (run.visit || 0) + 1;
  const inc = income(run); run.gold += inc; run.lastIncome = inc;
  if (run.visit > 1) { gainXp(run, 2, msgs); refreshShop(run, stream(run, 'shop', rng)); }
  run.freeRerolls = (hasGift(run, 'gacha') ? 1 : 0) + (run.milestones.LUK ? 1 : 0);
  run.haggle = hasGift(run, 'haggler');
  if (hasGift(run, 'f_debt') && !run.elite && (run.round === 3 || run.round === 6) && run.debtPaid !== run.round) { run.debtPaid = run.round; const d = Math.min(10, run.gold); run.gold -= d; msgs && msgs.push({ t: 'loss', text: `[The Trickster collects their debt: −${d} gold.]` }); }
  checkMilestones(run, msgs);
  (run.quests || []).forEach(q => { if (!q.done && !q.failed && QUESTS[q.id].by && run.round > QUESTS[q.id].by) { q.failed = true; msgs && msgs.push({ t: 'loss', text: `[Quest failed: ${QUESTS[q.id].text}]` }); } });
  if (!run.elite && run.round >= 5 && !run.extraGiven) { run.extraGiven = true; run.pending.push({ type: 'gift', offers: extraGiftOffers(run, stream(run, 'loot', rng)) }); msgs && msgs.push({ t: 'class', text: '[Milestone reached. Additional Gift granted.]' }); }
  dueChainEvents(run).forEach(k => { if (!run.pending.some(p => p.type === 'event' && p.key === k)) run.pending.push({ type: 'event', key: k }); });
  if (run.elite) { run.wager = null; run.stage = 'shop'; return; }
  run.choices = makeChoices(run, meta, stream(run, 'opps', rng));
  const tr = run.choices.find(c => c.kind === 'trial'); if (tr) msgs && msgs.push({ t: 'class', text: trialLine(tr.to, 0, tr.cond) });
  run.wager = makeWager(run, stream(run, 'opps', rng));
  run.stage = 'choose';
}
function leaveShop(run, rng, msgs) { questEvent(run, 'shop', {}, msgs); run.stage = 'district'; if (!run.districts || !run.districts.length) run.districts = rollDistricts(run, stream(run, 'opps', rng)); }
function useDistrict(run, k, rng) { if (!run.districts.includes(k)) return false; run.districts = []; run.stage = 'ready'; if (k === 'scout') run.scouted = true; if (k === 'undercity') run.pending.push({ type: 'event', key: undercityEvent(run, stream(run, 'event', rng)) }); return true; }

// ---------- Fighters ----------
function skillStat(def) { return def.basic ? null : ARCH[def.tags[0]].stat; }
function skillPower(def, s, star) { const stat = def.basic ? Math.max(s.STR, s.AGI) : s[skillStat(def)]; return (1 + 0.07 * stat) * STAR_MULT[star || 1]; }
function fighterSkills(barPieces, s, P) {
  const out = [];
  const atk = P.swordSaint ? Object.assign({}, SKILLS.attack, { name: "Heaven's Edge", rank: 'S', fx: { dmg: 12, pierce: 1 } }) : SKILLS.attack;
  out.push({ key: 'attack', def: atk, power: skillPower(SKILLS.attack, s, 1), cd: 0, star: 1 });
  barPieces.forEach((p, i) => {
    if (!p || !SKILLS[p.id]) return;
    const def = moddedDef(p.id, p.mods);
    if (P.extraHit && (def.fx.hits || 1) >= 2) def.fx.hits = def.fx.hits + 1;
    if (def.quick && P.quickCd) def.cd = Math.max(1, def.cd - P.quickCd);
    if (!def.quick && P.arcCd && def.cd > 1) def.cd = Math.max(1, def.cd - Math.floor(s.INT / P.arcCd)); // Arcanist: INT shortens cooldowns
    const mighty = P.mighty && ['reaper', 'storm'].includes(def.tags[0]) ? 1 + P.mighty : 1;
    out.push({ key: 's' + i, u: p.u, def, mods: p.mods, star: p.star, power: skillPower(def, s, p.star) * def.powerMult * mighty, cd: 0 });
  });
  if (P.copycat) out.push({ key: 'copycat', def: { id: 'copycat', name: 'Copycat', tags: [], rank: 'S', cd: 99, fx: { copy: 1 }, cheat: true }, power: skillPower(SKILLS.attack, s, 1), cd: 0, star: 1 });
  return out;
}
function blankFighter(o) { return Object.assign({ block: 0, burn: 0, poison: 0, bleed: 0, weaken: 0, empower: 0, stun: 0, evade: 0, thorns: 0, critNext: false, marked: 0, brokenT: 0, P: {}, uses: 0 }, o); }
function buildPlayer(run) {
  const s = effStats(run), P = runP(run), mh = maxHp(run);
  if (P.stormBreak) P.stunDmg += s.STR; // Stormcaller: Stuns and Interrupts scale with STR
  return blankFighter({
    side: 'A', name: run.name || 'You', isPlayer: true, maxHp: mh, hp: Math.min(run.hp, mh), poison: run.nextFlags.poison || 0, P,
    crit: 0.05 + 0.015 * s.LUK + (P.critBonus || 0), critMult: P.critMult || 1.5, dodge: Math.min(0.25, 0.01 * s.AGI + (P.dodge || 0)), skills: fighterSkills(run.bar, s, P),
    breath: hasGift(run, 'breath') && !run.usedBreath, weaken: P.sluggish ? 1 : 0, lastWords: P.lastWords || 0,
  });
}
function enemyPower(run) { return roundPower(curRound(run)) * rankMul(run); }
function enemyHpMul(run) { return roundHp(curRound(run)) * rankMul(run); }
function buildEnemy(run, spec) {
  const alpha = spec.kind === 'monster' ? (spec.hard ? TUNE.alpha : 1) * (1 + TUNE.monsterRamp * (run.round - 1)) : 1;
  const at = spec.kind === 'trial' ? trialMul(run, spec) : 1;
  const p = enemyPower(run) * at * (spec.hard ? TUNE.hard : 1) * alpha, hm = enemyHpMul(run) * at * (spec.hard ? TUNE.hardHp : 1) * alpha;
  if (spec.kind === 'erased' || spec.kind === 'champion') return buildSnapEnemy(spec.snap, p, hm, run);
  const t = ENEMIES[spec.id];
  const fin = t.tier === 3;
  const mhp = Math.round(t.hp * hm * (fin ? TUNE.finalHp : 1));
  let hp = mhp; if (run.nextFlags.bribe) hp = Math.round(hp * 0.8); if (spec.sabotaged) hp = Math.round(hp * 0.85);
  return blankFighter({
    side: 'B', name: specName(spec), id: spec.id, hard: !!spec.hard, maxHp: mhp, hp, crit: 0.04, critMult: 1.5, dodge: t.dodge || 0, script: t.script, scriptIdx: 0, turns: 0,
    skills: t.skills.map((x, i) => ({ key: 'e' + i, def: { id: 'e' + i, name: x.n, fx: x.fx, tags: [], label: x.label }, power: p * (fin ? TUNE.finalDmg : 1), cd: 0 })),
    enrage: t.enrage || 0, enrageMult: t.enrageMult || 1.5, aura: t.aura ? t.aura * p : 0, flood: !!t.flood, revive: t.revive || 0, kaito: !!t.kaito,
    briar: t.briar ? t.briar * p : 0, twincast: t.twincast || 0, forge: t.forge ? Math.round(t.forge * p) : 0, weaken: spec.sabotaged ? 3 : 0,
  });
}
function snapshot(run) {
  const s = effStats(run), R = run.record;
  const snap = {
    champ: run.champ, name: run.name, sigil: run.sigil, color: run.color, worldName: run.world.name, worldType: run.world.type, path: run.path,
    stats: s, level: run.level, maxHp: maxHp(run), round: run.round, gifts: run.gifts.filter(k => GIFTS[k].cat !== 'flaw' && k !== 'copycat'), title: run.title, milestones: run.milestones,
    history: (run.history || []).slice(), cause: run.cause || null, hearts: run.hearts, maxHearts: run.maxHearts, wins: run.wins, elite: run.eliteWins || 0, entrant: run.entrant, hiddenPath: run.hiddenPath,
    bar: run.bar.filter(Boolean).map(p => ({ id: p.id, star: p.star, mods: p.mods.slice() })), gear: GEAR_SLOTS.map(sl => run.gear[sl]).filter(Boolean).map(p => ({ id: p.id, star: p.star })), at: Date.now() + Math.floor(Math.random() * 1000),
  };
  if (R) snap.rec = { w: run.world.type, ids: R.ids.slice(), lost: R.lost, partial: R.partial, bio: Object.assign({}, R.bio) };
  return snap;
}
function buildSnapEnemy(snap, p, hm, run) {
  const scale = Math.max(1, p / roundPower(snap.round || 1));
  const hscale = Math.max(1, hm / roundHp(snap.round || 1));
  const P = buildP(snap.bar, snap.gear, snap.gifts, {}, snap.level, { title: snap.title, milestones: snap.milestones });
  const skills = fighterSkills(snap.bar, snap.stats, P).map(x => { x.def = Object.assign({}, x.def, { quick: false }); x.power *= scale; return x; });
  const mh = Math.round(snap.maxHp * hscale * 1.15);
  return blankFighter({ side: 'B', name: snap.champ, maxHp: mh, hp: mh, crit: 0.05 + 0.015 * snap.stats.LUK + (P.critBonus || 0), critMult: P.critMult || 1.5, dodge: Math.min(0.2, 0.01 * snap.stats.AGI + (P.dodge || 0)), skills, smart: true, P, turns: 0 });
}

// ---------- Combat ----------
function newFight(run, rng) {
  const spec = currentSpec(run);
  const A = buildPlayer(run), B = buildEnemy(run, spec);
  const f = {
    rng: stream(run, 'fight', rng) || Math.random, turn: 1, A, B, phase: 'player', over: false, winner: null, events: [], log: [], useCounts: {}, lastPlayerSkill: null, dealt: {},
    tally: { burn: 0, maxPoison: 0, bigHit: 0, blocked: 0, turns: 0, healed: 0, reactions: 0, bigStopped: 0, mostUsed: null, hurtBy: {}, taken: 0, stuns: 0, quickTurn: 0, maxQuick: 0, overkill: 0 },
    spec, bloodmoon: run.world.mod === 'bloodmoon', startHp: run.hp, rx: [], lastEnemySkill: null,
    foresight: hasGift(run, 'appraisal') || hasGift(run, 'foresight') || run.scouted || (spec.kind === 'final' && run.chains && run.chains.official === 'tip'),
  };
  run.nextFlags = {};
  [A, B].forEach(X => {
    const P = X.P;
    X.block += (P.startBlock || 0) + Math.round((P.startBlockPct || 0) * X.maxHp);
    if (P.firstCrit) X.critNext = true;
    if (P.firstEvade) X.evade += 1;
    if (P.startPoison) (X === A ? B : A).poison += P.startPoison;
    X.quickFree = P.quickFree || 0; X.firstFree = !!P.firstFree; X.firstStun = !!P.firstStun; X.firstHit = P.firstHit || 0;
  });
  planIntent(f, B);
  startTurn(f, A, true);
  return f;
}
function opp(f, X) { return X === f.A ? f.B : f.A; }
function say(f, text, t) { f.log.push({ text, t: t || 'sys' }); if (f.log.length > 40) f.log.shift(); }
function ev(f, e) { f.events.push(e); }
function half(X) { return X.hp < X.maxHp / 2; }

function dmgMult(f, X, Y) {
  const P = X.P;
  let m = 1;
  if (X.weaken > 0) m *= 0.7;
  if (X.empower > 0) m *= 1.3;
  if (f.bloodmoon) m *= 1.2;
  if (X.enrage && X.hp / X.maxHp <= X.enrage) m *= X.enrageMult;
  if (P.dmgPct) m *= 1 + P.dmgPct;
  if (P.lowHpDmg && half(X)) m *= 1 + P.lowHpDmg;
  if (Y) {
    if (P.vsHalf && half(Y)) m *= 1 + P.vsHalf;
    if (P.execBonus && Y.hp / Y.maxHp <= 0.3) m *= 1 + P.execBonus;
    if (Y.marked > 0) m *= 1.3;
    if (Y.brokenT > 0) m *= 1.5;
    if (P.vsBigger && Y.maxHp > X.maxHp) m *= 1 + P.vsBigger;
    if (P.vsHard && Y.hard) m *= 1 + P.vsHard;
    if (P.vsDisabled && (Y.stun > 0 || Y.weaken > 0)) m *= 1 + P.vsDisabled;
    if (P.burnExec && Y.burn > 0 && half(Y)) m *= 1 + P.burnExec;
  }
  if (P.blockDmgPct) m *= 1 + Math.min(0.4, X.block / 200);
  return m;
}
function hit(f, X, Y, raw, o = {}) {
  if (Y.hp <= 0) return 0;
  if (!o.noDodge && Y.evade > 0) { Y.evade--; ev(f, { k: 'miss', side: Y.side, text: 'Evaded' }); return 0; }
  if (!o.noDodge && rnd(f.rng) < Y.dodge) { ev(f, { k: 'miss', side: Y.side, text: 'Dodged' }); return 0; }
  let d = raw, crit = false;
  if (!o.noCrit && (o.alwaysCrit || X.critNext || rnd(f.rng) < X.crit + (o.critBonus || 0))) { crit = true; d *= X.critMult; X.critNext = false; }
  if (o.resist) d *= 0.6;
  if (Y.P.lowDR && Y.hp < Y.maxHp * 0.25) d *= 1 - Y.P.lowDR;
  if (Y.P.flatDR && !o.isThorns) d -= Y.P.flatDR;
  d = Math.max(0, Math.round(d));
  let absorbed = 0;
  if (!o.pierce) { absorbed = Math.min(Y.block, d); Y.block -= absorbed; }
  const rest = d - absorbed;
  Y.hp -= rest;
  if (X.P.reapBlood && !Y.bloodied && Y.hp > 0 && half(Y)) { Y.bloodied = true; heal(f, X, X.maxHp * X.P.reapBlood); say(f, '[Reaper: first blood. You feed on it.]', 'class'); } // Reaper: heal on bringing a foe below half
  if (Y.isPlayer) { f.tally.blocked += absorbed; f.tally.taken += rest; if (o.src) f.tally.hurtBy[o.src] = (f.tally.hurtBy[o.src] || 0) + rest; }
  if (X.isPlayer) { f.tally.bigHit = Math.max(f.tally.bigHit, d); if (o.src) f.dealt[o.src] = (f.dealt[o.src] || 0) + rest; if (Y.hp <= 0) f.tally.overkill = Math.max(f.tally.overkill, -Y.hp); }
  if (Y.lastWords && Y.hp > 0 && Y.hp < Y.maxHp * 0.25 && !Y.lwUsed) { Y.lwUsed = true; const b = Math.round(Y.maxHp * Y.lastWords); Y.block += b; say(f, `[Last Words: +${b} Block.]`, 'class'); }
  if (Y.P.blockStun && absorbed > 0 && !o.isThorns && X.hp > 0 && X.stunT !== f.turn && rnd(f.rng) < Y.P.blockStun) { X.stunT = f.turn; say(f, '[Thunder Wall: Stun!]', 'skill'); stunTarget(f, Y, X); }
  ev(f, { k: 'hit', side: Y.side, amt: rest, blocked: absorbed, crit, tag: o.tag });
  if (!o.isThorns && X.hp > 0) {
    const th = ((Y.thorns || 0) + (Y.P.thornsAlways ? Y.P.thornsAlways * (half(Y) ? 2 : 1) : 0)) * (Y.P.thornMult || 1);
    if (th > 0) { if (Y.P.thornBurn) addStatus(f, Y, X, 'burn', Y.P.thornBurn); if (Y.P.thornPoison) addStatus(f, Y, X, 'poison', Y.P.thornPoison); }
    if (th > 0) { const t = Math.round(th); X.hp -= t; ev(f, { k: 'hit', side: X.side, amt: t, blocked: 0, thorns: true }); if (Y.isPlayer) f.dealt['Thorns'] = (f.dealt['Thorns'] || 0) + t; }
    if (Y.riposte > 0 && absorbed > 0) { const t = Math.round(absorbed * Y.riposte * (Y.P.thornMult || 1)); X.hp -= t; ev(f, { k: 'hit', side: X.side, amt: t, blocked: 0, thorns: true }); if (Y.isPlayer) f.dealt['Riposte'] = (f.dealt['Riposte'] || 0) + t; }
  }
  checkRevive(f, Y); checkRevive(f, X);
  return rest;
}
function checkRevive(f, X) {
  if (X.hp <= 0 && X.revive) { X.hp = Math.round(X.maxHp * X.revive); X.revive = 0; say(f, `[${X.name} rises again.]`, 'loss'); ev(f, { k: 'revive', side: X.side }); }
  if (X.hp <= 0 && X.breath) { X.hp = 1; X.breath = false; f.usedBreath = true; say(f, '[Second Breath! You cling to life with 1 HP.]', 'class'); }
}
function heal(f, X, v) {
  if (v <= 0 || X.hp <= 0) return 0;
  v = Math.round(v * (1 + (X.P.healPct || 0)));
  const b = X.hp; X.hp = Math.min(X.maxHp, X.hp + v); const h = X.hp - b;
  if (h > 0) { ev(f, { k: 'heal', side: X.side, amt: h }); if (X.isPlayer) f.tally.healed += h; }
  if (X.P.overhealBlock && v > h) X.block += v - h;
  if (X.P.healBlock && h > 0) X.block += Math.round(h * X.P.healBlock);
  if (X.P.healDmg && h > 0 && !f.inHealDmg) { const Y = opp(f, X); if (Y.hp > 0) { f.inHealDmg = true; hit(f, X, Y, h * X.P.healDmg, { noCrit: 1, noDodge: 1, pierce: 1, isThorns: true, src: 'Last Rites' }); f.inHealDmg = false; } }
  return h;
}
function gainBlock(f, X, v) {
  v = Math.round(v); if (v <= 0) return;
  X.block += v;
  if (X.P.blockThorns) X.thorns += v * X.P.blockThorns;
  if (X.P.blockStrike) { const Y = opp(f, X); if (Y.hp > 0) hit(f, X, Y, v * X.P.blockStrike, { noCrit: 1, noDodge: 1, isThorns: true, src: 'Bastion' }); }
}
// --- statuses and reactions ---
function addStatus(f, X, Y, kind, v) {
  if (v <= 0 || Y.hp <= 0) return;
  const P = X.P;
  if (kind === 'burn') { v += (P.burnPlus || 0) + (P.dotPlus || 0); Y.burn += v; Y.burnFade = P.burnFade != null ? P.burnFade : 0.3; if (X.isPlayer) f.tally.burn += v; if (P.burnPoison) { Y.poison += P.burnPoison; } }
  if (kind === 'poison') { v += (P.poisonPlus || 0) + (P.dotPlus || 0); Y.poison += v; }
  if (kind === 'bleed') { v += (P.bleedPlus || 0) + (P.dotPlus || 0); Y.bleed += v; if (P.healOnBleed) heal(f, X, P.healOnBleed); if (P.bleedPoison) Y.poison += P.bleedPoison; }
  if (X.isPlayer) f.tally.maxPoison = Math.max(f.tally.maxPoison, Y.poison);
  react(f, X, Y, kind);
}
function reactName(f, X, Y, key, name, text) {
  f.tally.reactions += X.isPlayer ? 1 : 0;
  say(f, `[Reaction: ${name}!${text ? ' ' + text : ''}]`, 'react');
  ev(f, { k: 'reaction', side: Y.side, name });
  f.rx.push(key);
}
function react(f, X, Y, kind) {
  const RM = X.P.reactMult || 1;
  if (kind === 'burn' && Y.poison > 0 && Y.flareT !== f.turn) {
    Y.flareT = f.turn;
    const v = Y.poison * (X.P.flareFull ? 1 : 0.5) * RM;
    reactName(f, X, Y, 'flare', 'Toxic Flare', '');
    if (X.P.reactHeal) heal(f, X, X.P.reactHeal);
    hit(f, X, Y, v, { pierce: 1, noCrit: 1, noDodge: 1, isThorns: true, src: 'Toxic Flare', tag: 'flare' });
  }
  if (Y.burn > 0 && Y.bleed > 0) {
    Y.burn = Math.round(Y.burn * 2 * RM); Y.bleed = 0;
    reactName(f, X, Y, 'cauterise', 'Cauterise', 'Bleed is seared away and Burn doubles.');
    if (X.P.reactHeal) heal(f, X, X.P.reactHeal);
  }
  if (Y.bleed > 0 && Y.marked > 0 && !Y.hemo) { Y.hemo = true; reactName(f, X, Y, 'hemorrhage', 'Haemorrhage', 'Bleed deals double while Marked.'); }
  if (Y.stun > 0 && Y.weaken > 0 && Y.brokenT <= 0) { Y.brokenT = 2; reactName(f, X, Y, 'broken', 'Broken', `${Y.isPlayer ? 'You take' : Y.name + ' takes'} 50% more damage.`); }
  if (Y.poison > 0 && Y.leechT > 0 && !Y.blight) { Y.blight = true; reactName(f, X, Y, 'blight', 'Blight', 'Leech drains double.'); }
  if (Y.doomT > 1 && !Y.doomHastened && effectCount(Y) >= 2) { Y.doomHastened = true; Y.doomT--; reactName(f, X, Y, 'hastened', 'Hastened Doom', 'Doom lands a turn sooner.'); }
}
function applyStatus(f, X, Y, fx, p) {
  if (fx.burn) addStatus(f, X, Y, 'burn', Math.round(fx.burn * p));
  if (fx.poison) { const had = Y.poison > 0; addStatus(f, X, Y, 'poison', Math.round(fx.poison * p)); if (fx.doublePoison && had) Y.poison *= 2; }
  if (fx.bleed) addStatus(f, X, Y, 'bleed', Math.round(fx.bleed * p));
  if (fx.weaken) { Y.weaken = Math.max(Y.weaken, fx.weaken); if (X.P.weakPoison) addStatus(f, X, Y, 'poison', X.P.weakPoison); react(f, X, Y); }
  if (fx.stun) stunTarget(f, X, Y);
}
function stunTarget(f, X, Y) {
  if (Y.hp <= 0) return;
  Y.stun = Math.max(Y.stun, 1);
  interrupt(f, X, Y, true);
  if (X.P.stunWeaken) Y.weaken = Math.max(Y.weaken, X.P.stunWeaken);
  react(f, X, Y);
}
function isBig(f, Y) {
  const s = Y.intent; if (!s) return false; const fx = s.def.fx;
  const T = opp(f, Y);
  return ((fx.dmg || 0) * (fx.hits || 1) * s.power) >= T.maxHp * 0.15;
}
function interrupt(f, X, Y, stunned) {
  if (Y.isPlayer || !Y.intent || Y.interrupted) return;
  const s = Y.intent;
  if (X.isPlayer && isBig(f, Y)) {
    f.tally.bigStopped++;
    if (X.P.stormBreak) { X.empower = Math.max(X.empower, 3); say(f, '[Stormcaller: big attack broken. Empowered for 2 turns.]', 'skill'); }
  }
  s.cd = Math.max(s.cd, 2); Y.interrupted = s.def.name;
  say(f, `[${s.def.name} interrupted! It goes on cooldown.]`, 'skill'); ev(f, { k: 'interrupt', side: Y.side, name: s.def.name });
  if (X.isPlayer) f.tally.stuns++;
  if (X.P.stunDmg) hit(f, X, Y, X.P.stunDmg, { noCrit: 1, noDodge: 1, isThorns: true, src: 'Static' });
  if (X.P.stunEmpower) X.empower = Math.max(X.empower, X.P.stunEmpower + 1);
  if (X.P.stormBreak && Y.block > 0) { say(f, `[Stormcaller: ${Math.round(Y.block)} Block shattered.]`, 'skill'); Y.block = 0; }
  if (X.P.stunBurn) addStatus(f, X, Y, 'burn', X.P.stunBurn);
  if (X.P.stunHeal) heal(f, X, X.P.stunHeal);
  if (!stunned) planIntent(f, Y);
}
function effectCount(Y) { return (Y.burn > 0) + (Y.poison > 0) + (Y.bleed > 0) + (Y.weaken > 0) + (Y.stun > 0) + (Y.marked > 0); }

function useSkill(f, X, s, opt) {
  opt = opt || {};
  const Y = opp(f, X);
  let def = s.def, p = s.power;
  if (def.fx.mirror) {
    const last = f.lastPlayerSkill;
    if (last) { def = Object.assign({}, last.def); say(f, `[${X.name} copies ${last.def.name}.]`, 'loss'); }
    else def = { name: 'Mirror Strike', fx: { dmg: 8 }, tags: [] };
  }
  if (def.fx.copy) {
    const last = f.lastEnemySkill;
    if (last) { def = Object.assign({}, last.def, { name: 'Copycat: ' + last.def.name }); p = last.power; say(f, `[Copycat! You copy ${last.def.name}.]`, 'class'); }
    else def = { name: 'Copycat', fx: { dmg: 10 }, tags: [] };
  }
  const fx = def.fx;
  if (!opt.echo) ev(f, { k: 'use', side: X.side, name: def.name });
  if (X.bleed > 0 && !opt.echo) {
    const bm = (Y.P.bleedMult || 1) * (X.marked > 0 ? 2 : 1);
    const bd = Math.round(X.bleed * bm); X.hp -= bd; X.bleed--; ev(f, { k: 'dot', side: X.side, amt: bd, kind: 'bleed' });
    if (!X.isPlayer) f.dealt['Bleed'] = (f.dealt['Bleed'] || 0) + bd; else f.tally.hurtBy['Bleed'] = (f.tally.hurtBy['Bleed'] || 0) + bd;
    if (X.hp <= 0) { checkRevive(f, X); if (X.hp <= 0) return; }
  }
  if (fx.selfDmg) { X.hp = Math.max(1, X.hp - Math.round(fx.selfDmg)); ev(f, { k: 'dot', side: X.side, amt: fx.selfDmg, kind: 'self' }); }
  let m = dmgMult(f, X, Y);
  const resist = Y.kaito && X.isPlayer && f.tally.mostUsed === s.key;
  const damaging = !!(fx.dmg || fx.blockDmg || fx.malice || fx.detonate || fx.momentum);
  if (damaging && X.focus) { m *= 1 + X.focus; X.focus = 0; }
  if (damaging && !def.quick && X.aq) { m *= 1 + X.aq; X.aq = 0; }
  if (damaging && X.firstHit && !opt.echo) { m *= 1 + X.firstHit; X.firstHit = 0; }
  const src = def.name;
  let dealt = 0;
  if (fx.dmg || fx.blockDmg || fx.malice) {
    let base = (fx.dmg || 0) * p;
    if (fx.blockDmg) base += X.block * fx.blockDmg;
    if (fx.malice) base += fx.malice * p * effectCount(Y);
    if (fx.momentum) base += fx.momentum * p * (X.streak || 0);
    if (fx.cruel && effectCount(Y) >= 2) base *= fx.cruel;
    if (fx.execute && Y.hp / Y.maxHp <= fx.execute) base *= fx.execMult;
    const hits = fx.hits || 1;
    for (let i = 0; i < hits && Y.hp > 0; i++) {
      dealt += hit(f, X, Y, base * m, { pierce: fx.pierce || (X.P.reapPierce && half(Y)), critBonus: fx.critBonus, alwaysCrit: fx.alwaysCrit, resist, src });
      if (fx.perHit) applyStatus(f, X, Y, fx, p);
      if (hits >= 2 && X.P.hitBurn) addStatus(f, X, Y, 'burn', X.P.hitBurn);
    }
    if (hits >= 2 && X.P.multiWeaken && Y.hp > 0) { Y.weaken = Math.max(Y.weaken, 1); react(f, X, Y); }
  }
  if (!fx.perHit) applyStatus(f, X, Y, fx, p);
  if (fx.detonate) { const v = Math.max(4, Y.burn * fx.detonate) * (1 + (p - 1) * 0.5) * m; if (!fx.keep) Y.burn = 0; dealt += hit(f, X, Y, v, { pierce: 1, noDodge: true, src }); }
  if (damaging && X.P.poisonOnHit && dealt > 0) addStatus(f, X, Y, 'poison', X.P.poisonOnHit);
  if (fx.block) gainBlock(f, X, fx.block * p);
  if (fx.heal) heal(f, X, fx.heal * p);
  if (fx.healMissing) heal(f, X, (X.maxHp - X.hp) * fx.healMissing);
  if ((fx.heal || fx.healMissing || fx.lifesteal || fx.regen) && X.P.healPoison && !opt.echo) addStatus(f, X, Y, 'poison', X.P.healPoison);
  if (fx.drainPoison) heal(f, X, Y.poison);
  if (fx.empower) X.empower = Math.max(X.empower, fx.empower + 1);
  if (fx.evade) X.evade += fx.evade;
  if (fx.nextCrit) X.critNext = true;
  if (fx.thorns) X.thorns = Math.max(X.thorns, fx.thorns * p);
  if (fx.cleanse) { if (fx.reflect) { Y.burn += X.burn; Y.poison += X.poison; Y.bleed += X.bleed; } if (X.burn + X.poison + X.bleed + X.weaken > 0) say(f, `[${X.isPlayer ? 'You are' : X.name + ' is'} cleansed.]`); X.burn = 0; X.poison = 0; X.bleed = 0; X.weaken = 0; }
  const ls = (fx.lifesteal || 0) + (damaging ? (X.P.lifesteal || 0) + (half(X) ? X.P.lowLifesteal || 0 : 0) : 0);
  if (ls && dealt > 0) heal(f, X, dealt * ls);
  if (damaging && dealt > 0 && X.P.hitHeal) heal(f, X, X.P.hitHeal);
  if (fx.xburn) addStatus(f, X, Y, 'burn', Math.round(fx.xburn * p));
  if (fx.xpoison) addStatus(f, X, Y, 'poison', Math.round(fx.xpoison * p));
  if (fx.xbleed) addStatus(f, X, Y, 'bleed', Math.round(fx.xbleed * p));
  if (fx.mark) { Y.marked = Math.max(Y.marked || 0, fx.mark); react(f, X, Y); }
  if (fx.focus) X.focus = fx.focus;
  if (fx.haste) X.skills.forEach(o => { if (o !== s) o.cd = Math.max(0, o.cd - fx.haste); });
  if (fx.interrupt) interrupt(f, X, Y, false);
  if (fx.stunIfWeak && Y.weaken > 0 && Y.hp > 0) stunTarget(f, X, Y);
  if (fx.riposte) X.riposte = fx.riposte;
  if (fx.regen) { X.regen = fx.regen * p; X.regenT = 3; }
  if (fx.doom) { Y.doom = Math.round(fx.doom * p * (1 + (X.P.doomLeech || 0))); Y.doomT = Math.max(1, (fx.doomT || 3) - (X.P.doomFaster ? 1 : 0)); Y.doomHastened = false; react(f, X, Y); }
  if (fx.leech) { Y.leech = Math.round(fx.leech * p * (1 + (X.P.doomLeech || 0))); Y.leechT = 4; Y.blight = false; react(f, X, Y); }
  if (fx.siphon) { const b = Y.block; X.block += b; Y.block = 0; Y.empower = 0; if (b) say(f, `[${X.isPlayer ? 'You steal' : X.name + ' steals'} ${Math.round(b)} Block.]`); }
  if (opt.echo) return;
  // passives that trigger on use
  if (damaging && X.firstStun && Y.hp > 0) { X.firstStun = false; say(f, '[Thunder Maul: Stun!]', 'skill'); stunTarget(f, X, Y); }
  if (!def.basic) { X.uses++; if (X.P.every3Stun && X.uses % 3 === 0 && Y.hp > 0) { say(f, '[Stormlord: every third skill Stuns!]', 'skill'); stunTarget(f, X, Y); } }
  if (!def.quick) X.streak = damaging ? (X.streak || 0) + 1 : 0;
  if (def.quick) {
    const P = X.P;
    if (P.afterQuick) X.aq = P.afterQuick;
    if (P.quickBurn) addStatus(f, X, Y, 'burn', P.quickBurn);
    if (P.quickPoison) addStatus(f, X, Y, 'poison', P.quickPoison);
    if (P.quickBlock) X.block += P.quickBlock;
    if (P.quickHeal) heal(f, X, P.quickHeal);
    if (P.quickEvade) X.evade = Math.max(X.evade, 1);
    if (P.quickStun && damaging && Y.hp > 0 && rnd(f.rng) < P.quickStun) { say(f, '[Tempest Mage: Stun!]', 'skill'); stunTarget(f, X, Y); }
  }
  if (fx.echo && Y.hp > 0 && rnd(f.rng) < fx.echo) { say(f, `[Echo! ${def.name} casts again.]`, 'skill'); useSkill(f, X, s, { echo: true }); }
  if (def.quick && X.P.quickTwice && Y.hp > 0) useSkill(f, X, s, { echo: true });
}

function startTurn(f, X, first) {
  // returns false if X can't act (stunned/dead)
  const P = X.P, Y = opp(f, X);
  if (!first) {
    if (X.forge) X.block = X.block; else X.block = P.blockKeep ? Math.round(X.block * Math.min(0.6, P.blockKeep)) : 0;
  }
  if (X.forge) X.block += X.forge;
  X.thorns = 0; X.riposte = 0;
  if (X.regenT > 0) { heal(f, X, X.regen); X.regenT--; }
  if (P.regen) heal(f, X, P.regen);
  if (X.leechT > 0) { const v = Math.min(X.leech * (X.poison > 0 && X.blight ? 2 : 1), Math.max(0, X.hp)); X.hp -= v; ev(f, { k: 'dot', side: X.side, amt: v, kind: 'poison' }); heal(f, Y, v); X.leechT--; if (Y.isPlayer) f.dealt['Leech'] = (f.dealt['Leech'] || 0) + v; }
  if (X.doomT > 0) { X.doomT--; if (X.doomT === 0) { X.hp -= X.doom; ev(f, { k: 'dot', side: X.side, amt: X.doom, kind: 'doom' }); say(f, `[Doom falls on ${X.isPlayer ? 'you' : X.name}: ${X.doom} damage.]`, 'skill'); if (Y.isPlayer) f.dealt['Doom'] = (f.dealt['Doom'] || 0) + X.doom; X.doom = 0; } }
  if (!X.isPlayer && X.aura) addStatus(f, X, Y, 'burn', Math.round(X.aura));
  if (!X.isPlayer && X.briar) addStatus(f, X, Y, 'bleed', Math.round(X.briar));
  const turns = X.isPlayer ? f.turn : (X.turns || 0);
  if (turns > 24) { const sd = Math.round(X.maxHp * 0.04 * (turns - 24)); X.hp -= sd; ev(f, { k: 'dot', side: X.side, amt: sd, kind: 'sudden' }); if (X.isPlayer && turns === 25) say(f, '[The crowd grows restless. Both fighters are worn down each turn.]', 'loss'); }
  if (X.burn > 0) {
    const v = X.burn; X.hp -= v; ev(f, { k: 'dot', side: X.side, amt: v, kind: 'burn' });
    if (Y.isPlayer) f.dealt['Burn'] = (f.dealt['Burn'] || 0) + v; else f.tally.hurtBy['Burn'] = (f.tally.hurtBy['Burn'] || 0) + v;
    if (Y.P.burnHeal) heal(f, Y, v * Y.P.burnHeal);
    const fade = X.burnFade != null ? X.burnFade : 0.3; X.burn = Math.max(0, X.burn - Math.ceil(X.burn * fade));
  }
  if (X.poison > 0) {
    const v = Math.round(X.poison * (Y.P.poisonMult || 1));
    X.hp -= v; ev(f, { k: 'dot', side: X.side, amt: v, kind: 'poison' });
    if (Y.isPlayer) f.dealt['Poison'] = (f.dealt['Poison'] || 0) + v; else f.tally.hurtBy['Poison'] = (f.tally.hurtBy['Poison'] || 0) + v;
    if (Y.P.poisonHeal) heal(f, Y, v * Math.min(POISON_HEAL_CAP, Y.P.poisonHeal));
  }
  checkRevive(f, X);
  if (X.hp <= 0) return false;
  if (X.stun > 0) { X.stun = 0; say(f, `[${X.isPlayer ? 'You are' : X.name + ' is'} stunned and lose${X.isPlayer ? '' : 's'} the turn.]`, X.isPlayer ? 'loss' : 'skill'); ev(f, { k: 'stunned', side: X.side }); return false; }
  return true;
}
function endTurn(f, X, usedKey) {
  if (X.weaken > 0) X.weaken--;
  if (X.marked > 0) { X.marked--; if (!X.marked) X.hemo = false; }
  if (X.empower > 0) X.empower--;
  if (X.brokenT > 0) X.brokenT--;
  X.skills.forEach(s => { if (s.key !== usedKey && s.cd > 0) s.cd--; });
}
function checkOver(f) {
  if (f.over) return true;
  if (f.A.hp <= 0 || f.B.hp <= 0) { f.over = true; f.winner = f.A.hp > 0 ? 'A' : f.B.hp > 0 ? 'B' : (f.A.hp >= f.B.hp ? 'A' : 'B'); f.phase = 'over'; return true; }
  return false;
}
function canUse(s) { return s.cd <= 0; }
function playerAct(f, idx) {
  if (f.phase !== 'player' || f.over) return false;
  const A = f.A, s = A.skills[idx]; if (!s || !canUse(s)) return false;
  f.events = [];
  useSkill(f, A, s);
  s.cd = s.def.cd || 0;
  if (s.def.quick) s.cd += 1; // quick skills tick at the end of this same turn
  if (s.def.quick && A.quickFree > 0) { A.quickFree--; s.cd = 1; say(f, `[Hourglass: ${s.def.name} has no cooldown.]`, 'skill'); }
  else if (A.firstFree && !s.def.basic && !s.def.cheat) { A.firstFree = false; s.cd = s.def.quick ? 1 : 0; say(f, `[Archmage: ${s.def.name} has no cooldown.]`, 'skill'); }
  f.useCounts[s.key] = (f.useCounts[s.key] || 0) + 1;
  if (s.key !== 'attack' && s.key !== 'copycat' && !s.def.quick) f.lastPlayerSkill = s;
  if (s.def.quick) { f.tally.quickTurn++; f.tally.maxQuick = Math.max(f.tally.maxQuick, f.tally.quickTurn); } else f.tally.quickTurn = 0;
  const mu = Object.entries(f.useCounts).sort((a, b) => b[1] - a[1])[0]; f.tally.mostUsed = mu ? mu[0] : null;
  if (s.def.quick) { checkOver(f); return true; }
  endTurn(f, A, s.key);
  f.tally.turns = f.turn;
  if (!checkOver(f)) f.phase = 'enemy';
  return true;
}
function skipPlayer(f) { f.events = []; endTurn(f, f.A, null); if (!checkOver(f)) f.phase = 'enemy'; }
function scoreSkill(s, low) { const fx = s.def.fx; return ((fx.dmg || 0) * (fx.hits || 1) + (fx.burn || 0) + (fx.poison || 0) * 1.5 + (fx.bleed || 0) + (fx.detonate ? 10 : 0) + (fx.doom ? fx.doom * 0.5 : 0) + (fx.blockDmg ? 6 : 0)) * s.power + (low ? ((fx.heal || 0) + (fx.healMissing ? 25 : 0) + (fx.block || 0) * 0.8) * s.power * 2 : (fx.block || 0) * 0.5 * s.power) + (fx.stun ? 8 : 0) + (fx.interrupt ? 6 : 0); }
function planIntent(f, B) {
  if (B.smart) {
    const ready = B.skills.filter(s => s.cd <= 0);
    let best = ready[0];
    const lowHp = B.hp / B.maxHp < 0.35;
    ready.forEach(s => { if (scoreSkill(s, lowHp) > scoreSkill(best, lowHp)) best = s; });
    B.intent = best; B.interrupted = null; return;
  }
  const n = B.script.length;
  for (let k = 0; k < n; k++) { const s = B.skills[B.script[(B.scriptIdx + k) % n]]; if (s.cd <= 0) { B.scriptIdx += k; B.intent = s; B.interrupted = null; return; } }
  B.intent = B.skills[B.script[B.scriptIdx % n]]; B.interrupted = null;
}
function peekNext(f) {
  // the move after the current intent (best guess for scripted foes)
  const B = f.B; if (B.smart || !B.script) return null;
  const n = B.script.length; return B.skills[B.script[(B.scriptIdx + 1) % n]];
}
function enemyTurn(f) {
  if (f.over) return;
  f.events = [];
  const B = f.B; B.turns = (B.turns || 0) + 1;
  const can = startTurn(f, B);
  if (checkOver(f)) return;
  if (can) {
    if (B.flood && B.turns % 3 === 0) { const T = f.A.block < B.block ? f.A : f.A.block > B.block ? B : f.A; T.weaken = Math.max(T.weaken, 2); say(f, `[The arena floods. ${T === f.A ? 'You are' : B.name + ' is'} Weakened.]`, T === f.A ? 'loss' : 'skill'); ev(f, { k: 'flood' }); react(f, B, T); }
    const s = B.intent || B.skills[0];
    useSkill(f, B, s);
    if (!s.def.fx.mirror) f.lastEnemySkill = { def: s.def, power: s.power };
    if (B.twincast && B.turns % B.twincast === 0 && f.A.hp > 0) { say(f, `[${B.name} casts twice!]`, 'loss'); useSkill(f, B, s, { echo: true }); }
    s.cd = s.def.cd || 0;
    if (!B.smart) B.scriptIdx++;
    endTurn(f, B, s.key);
  } else endTurn(f, B, null);
  if (checkOver(f)) return;
  planIntent(f, B);
  f.turn++;
  f.phase = 'player';
  f.events.push({ k: 'mark' });
  const ok = startTurn(f, f.A);
  if (checkOver(f)) return;
  if (!ok) { f.phase = 'stunned'; }
}
function intentText(f, s, B) {
  let def = s.def;
  if (def.fx.mirror) { const last = f.lastPlayerSkill; if (last) def = last.def; else def = { fx: { dmg: 8 } }; }
  const fx = def.fx, p = s.power, m = dmgMult(f, B, f.A);
  const parts = []; let kind = 'other';
  if (fx.dmg || fx.blockDmg) { const v = Math.round(((fx.dmg || 0) * p + (fx.blockDmg ? B.block * fx.blockDmg : 0)) * m); parts.push(fx.hits ? `${v}×${fx.hits}` : `${v}`); kind = 'attack'; }
  if (fx.block) { parts.push(`Block ${Math.round(fx.block * p)}`); if (kind === 'other') kind = 'defend'; }
  if (fx.heal) { parts.push(`Heal ${Math.round(fx.heal * p)}`); if (kind === 'other') kind = 'defend'; }
  if (fx.burn) { parts.push(`Burn ${Math.round(fx.burn * p)}`); if (kind === 'other') kind = 'debuff'; }
  if (fx.poison) { parts.push(`Poison ${Math.round(fx.poison * p)}${fx.doublePoison ? ' (doubles)' : ''}`); if (kind === 'other') kind = 'debuff'; }
  if (fx.bleed) parts.push('Bleed');
  if (fx.weaken) { parts.push('Weaken'); if (kind === 'other') kind = 'debuff'; }
  if (fx.stun) parts.push('Stun');
  if (fx.empower) { parts.push('Power up'); if (kind === 'other') kind = 'buff'; }
  if (fx.evade) { parts.push('Evade'); if (kind === 'other') kind = 'buff'; }
  if (fx.cleanse) { parts.push('Cleanse'); if (kind === 'other') kind = 'defend'; }
  if (fx.lifesteal) parts.push('Drain');
  if (fx.doom) { parts.push('Doom'); if (kind === 'other') kind = 'debuff'; }
  if (fx.leech) parts.push('Leech');
  const big = kind === 'attack' && ((fx.dmg || 0) * p * m * (fx.hits || 1)) >= f.A.maxHp * 0.2;
  return { kind: big ? 'big' : kind, name: s.def.fx.mirror ? 'Mirror Form' : s.def.name, label: s.def.label, text: parts.join(' · ') || s.def.name };
}
function intentInfo(f) {
  const B = f.B, s = B.intent; if (!s) return { kind: 'unknown', text: '?' };
  if (B.stun > 0) return { kind: 'stunned', name: 'Stunned', text: B.interrupted ? B.interrupted + ' interrupted' : 'loses next turn' };
  const r = intentText(f, s, B);
  if (B.twincast && (B.turns + 1) % B.twincast === 0) r.text += ' · twice';
  if (f.foresight) { const n = peekNext(f); if (n) r.then = n.def.label || n.def.name; }
  return r;
}
function previewSkill(f, s) {
  const X = f ? f.A : null, def = s.def, fx = def.fx, p = s.power, m = X ? dmgMult(f, X, f.B) : 1;
  const parts = [];
  if (fx.dmg || fx.blockDmg || fx.malice) { let v = (fx.dmg || 0) * p; if (fx.blockDmg && X) v += X.block * fx.blockDmg; if (fx.malice && f) v += fx.malice * p * effectCount(f.B); v = Math.round(v * m * (X && X.focus ? 1 + X.focus : 1) * (X && X.aq && !def.quick ? 1 + X.aq : 1)); parts.push(fx.hits ? `${v}×${fx.hits}` : `${v} dmg`); }
  if (fx.detonate) parts.push(`Burn ×${fx.detonate}`);
  if (fx.block) parts.push(`Block ${Math.round(fx.block * p)}`);
  if (fx.heal) parts.push(`Heal ${Math.round(fx.heal * p)}`);
  if (fx.healMissing) parts.push(`Heal ${Math.round(fx.healMissing * 100)}% missing`);
  if (fx.burn) parts.push(`Burn ${Math.round(fx.burn * p)}`);
  if (fx.poison) parts.push(`Poison ${Math.round(fx.poison * p)}`);
  if (fx.bleed) parts.push(`Bleed ${Math.round(fx.bleed * p)}`);
  if (fx.weaken) parts.push(`Weaken ${fx.weaken}`);
  if (fx.stun) parts.push('Stun');
  if (fx.stunIfWeak) parts.push('Stun if Weak');
  if (fx.empower) parts.push(`Power ${fx.empower}t`);
  if (fx.evade) parts.push(`Evade ${fx.evade}`);
  if (fx.thorns) parts.push(`Thorns ${Math.round(fx.thorns * p)}`);
  if (fx.cleanse) parts.push('Cleanse');
  if (fx.lifesteal) parts.push(`Drain ${Math.round(fx.lifesteal * 100)}%`);
  if (fx.execute) parts.push(`×${fx.execMult} under ${fx.execute * 100}%`);
  if (fx.momentum) parts.push(`+${Math.round(fx.momentum * p)}/streak`);
  if (fx.cruel) parts.push(`×${fx.cruel} vs 2+ effects`);
  if (fx.riposte) parts.push(`Riposte ×${fx.riposte}`);
  if (fx.mark) parts.push(`Mark ${fx.mark}t`);
  if (fx.focus) parts.push(`Next +${fx.focus * 100}%`);
  if (fx.haste) parts.push(`Cooldowns −${fx.haste}`);
  if (fx.interrupt) parts.push('Interrupt');
  if (fx.regen) parts.push(`Regen ${Math.round(fx.regen * p)}×3`);
  if (fx.doom) parts.push(`Doom ${Math.round(fx.doom * p)}`);
  if (fx.leech) parts.push(`Leech ${Math.round(fx.leech * p)}×4`);
  if (fx.siphon) parts.push('Steal Block');
  if (fx.xburn) parts.push(`+Burn ${Math.round(fx.xburn * p)}`);
  if (fx.xpoison) parts.push(`+Poison ${Math.round(fx.xpoison * p)}`);
  if (fx.xbleed) parts.push(`+Bleed ${Math.round(fx.xbleed * p)}`);
  if (fx.echo) parts.push('30% echo');
  return parts.join(' · ');
}
function describe(def, p = 1) {
  const fx = def.fx, r = [], n = v => Math.round(v * p);
  if (fx.dmg) r.push(fx.hits ? `Hit ${fx.hits} times for ${n(fx.dmg)}.` : `Deal ${n(fx.dmg)} damage.`);
  if (fx.blockDmg) r.push(`Plus damage equal to ${fx.blockDmg === 1 ? 'your' : Math.round(fx.blockDmg * 100) + '% of your'} Block.`);
  if (fx.malice) r.push(`+${n(fx.malice)} for each effect on the opponent.`);
  if (fx.pierce) r.push('Ignores Block.');
  if (fx.critBonus) r.push(`+${fx.critBonus * 100}% critical chance.`);
  if (fx.alwaysCrit) r.push('Always a critical hit.');
  if (fx.execute) r.push(`×${fx.execMult} damage if the opponent is below ${fx.execute * 100}% HP.`);
  if (fx.detonate) r.push(`Deal ${fx.detonate}× the opponent's Burn as damage${fx.keep ? '' : ', then remove it'}. Ignores Block.`);
  const per = fx.perHit ? ' with each hit' : '';
  if (fx.burn) r.push(`Apply ${n(fx.burn)} Burn${per}.`);
  if (fx.poison) r.push(`Apply ${n(fx.poison)} Poison${per}${fx.doublePoison ? ', then double their Poison if they already had some' : ''}.`);
  if (fx.bleed) r.push(`Apply ${n(fx.bleed)} Bleed${per}.`);
  if (fx.weaken) r.push(`Weaken the opponent for ${fx.weaken} turn${fx.weaken > 1 ? 's' : ''}.`);
  if (fx.stun) r.push('Stun: the opponent loses their next turn, and the move they were about to use goes on cooldown.');
  if (fx.stunIfWeak) r.push('If the opponent is Weakened, Stun them.');
  if (fx.block) r.push(`Gain ${n(fx.block)} Block.`);
  if (fx.heal) r.push(`Heal ${n(fx.heal)}.`);
  if (fx.healMissing) r.push(`Heal ${fx.healMissing * 100}% of your missing HP.`);
  if (fx.drainPoison) r.push("Heal equal to the opponent's Poison.");
  if (fx.empower) r.push(`Deal 30% more damage for ${fx.empower} turn${fx.empower > 1 ? 's' : ''}.`);
  if (fx.evade) r.push(`Evade the next ${fx.evade > 1 ? fx.evade + ' attacks' : 'attack'}.`);
  if (fx.nextCrit) r.push('Your next hit is a critical.');
  if (fx.thorns) r.push(`Until your next turn, hit back for ${n(fx.thorns)} when struck.`);
  if (fx.cleanse) r.push(fx.reflect ? 'Send your Burn, Poison and Bleed to the opponent.' : 'Remove your Burn, Poison, Bleed and Weaken.');
  if (fx.lifesteal) r.push(`Heal ${fx.lifesteal * 100}% of the damage dealt.`);
  if (fx.momentum) r.push(`+${n(fx.momentum)} damage for each turn in a row you've used a damaging skill.`);
  if (fx.cruel) r.push(`×${fx.cruel} damage if the opponent has 2 or more effects.`);
  if (fx.riposte) r.push(`Until your next turn, damage you block is dealt back ×${fx.riposte}.`);
  if (fx.mark) r.push(`Mark the opponent: they take 30% more damage for ${fx.mark} turns.`);
  if (fx.focus) r.push(`Your next damaging skill deals ${fx.focus * 100}% more.`);
  if (fx.haste) r.push(`Your other cooldowns drop by ${fx.haste}.`);
  if (fx.interrupt) r.push("Interrupt: cancel the opponent's next move and put it on cooldown.");
  if (fx.regen) r.push(`Heal ${n(fx.regen)} at the start of your next 3 turns.`);
  if (fx.doom) r.push(`Doom: after ${fx.doomT || 3} of the opponent's turns, they take ${n(fx.doom)} damage.`);
  if (fx.leech) r.push(`Leech: for 4 turns, drain ${n(fx.leech)} HP from the opponent each turn.`);
  if (fx.siphon) r.push("Steal the opponent's Block and remove their Power.");
  if (fx.xburn) r.push(`Also apply ${n(fx.xburn)} Burn.`);
  if (fx.xpoison) r.push(`Also apply ${n(fx.xpoison)} Poison.`);
  if (fx.xbleed) r.push(`Also apply ${n(fx.xbleed)} Bleed.`);
  if (fx.echo) r.push(`${fx.echo * 100}% chance to cast twice.`);
  if (fx.selfDmg) r.push(`Costs ${fx.selfDmg} HP.`);
  if (def.quick) r.push("Quick: doesn't end your turn.");
  return r.join(' ');
}
const REACTIONS = {
  flare: { name: 'Toxic Flare', pair: 'Burn + Poison', text: 'Applying Burn to a Poisoned target ignites the Poison for half its value as damage. Once per turn.' },
  cauterise: { name: 'Cauterise', pair: 'Burn + Bleed', text: 'Bleed is seared away and Burn doubles.' },
  hemorrhage: { name: 'Haemorrhage', pair: 'Bleed + Mark', text: 'Bleed deals double while Marked.' },
  broken: { name: 'Broken', pair: 'Stun + Weaken', text: 'The target takes 50% more damage until the end of their next turn.' },
  blight: { name: 'Blight', pair: 'Poison + Leech', text: 'Leech drains double.' },
  hastened: { name: 'Hastened Doom', pair: 'Doom + 2 other effects', text: 'Doom lands a turn sooner.' },
};

// ---------- After a fight ----------
function resolveFight(run, f, meta, rng) {
  const msgs = [], won = f.winner === 'A', spec = f.spec, lr = stream(run, 'loot', rng);
  bindMeta(meta);
  run.hp = Math.max(0, f.A.hp);
  if (f.usedBreath) run.usedBreath = true;
  f.rx.forEach(k => meta.archive.reactions[k] = true);
  if (spec.kind === 'rival') meta.archive.rivals[spec.id] = true;
  if (spec.kind === 'rival' && won) meta.archive.beat[spec.id] = true;
  if (spec.kind === 'final') meta.archive.finals[spec.id] = true;
  if (run.path) meta.archive.paths[run.path] = true;
  const res = { won, gold: 0, xp: 0, msgs, tally: f.tally, dealt: f.dealt, turns: f.turn, enemy: f.B.name, death: false, spared: false, eliteOver: false, wager: null, rewind: false };
  if (!won && !run.elite && hasGift(run, 'rewind') && !run.usedRewind) {
    run.usedRewind = true; run.hp = f.startHp; res.rewind = true;
    msgs.push({ t: 'class', text: '[Return by Death. The world rewinds to the start of the fight.]' });
    return res;
  }
  // Wager
  if (run.wagerOn && run.wager) {
    const W = WAGERS[run.wager.key], ok = won && W.check(f);
    res.wager = { ok, text: W.text, god: run.wager.god };
    if (ok) {
      const pay = (hasGift(run, 'gambler') ? 15 : 10) + (run.title === 'high_roller' ? 3 : 0);
      run.gold += pay; run.wagersWon = (run.wagersWon || 0) + 1;
      msgs.push({ t: 'favour', text: `[Wager won: ${W.text}. +${pay} gold.]` }); addFavour(run, run.wager.god, 2, meta, msgs, lr);
      if (run.wagersWon >= 3) earnTitle(run, 'high_roller', msgs);
    }
    else msgs.push({ t: 'loss', text: `[Wager lost: ${W.text}.]` });
    run.wagerOn = false;
  }
  run.met.push(specKey(spec));
  const hist = { round: curRound(run), name: f.B.name, won, turns: f.turn, hard: !!spec.hard, kind: spec.kind, hl: 0, dealt: Object.values(f.dealt).reduce((a, b) => a + b, 0) };
  run.history.push(hist);
  // Titles and world firsts
  const T = f.tally, A = f.A;
  if (won) {
    if (f.turn <= 2) earnTitle(run, 'first_blood', msgs);
    if (T.taken === 0) earnTitle(run, 'untouched', msgs);
    if (f.B.maxHp >= A.maxHp * 2) earnTitle(run, 'giant_slayer', msgs);
    if (spec.id === 'masked') earnTitle(run, 'mirror_breaker', msgs);
    if (spec.hard) earnTitle(run, 'underdog', msgs);
    if (A.hp <= A.maxHp * 0.1) earnTitle(run, 'comeback', msgs);
    if (FINAL_TITLE[spec.id]) worldFirst(run, 'final_' + spec.id, `has defeated ${ENEMIES[spec.id].name} in ${f.turn} turn${f.turn === 1 ? '' : 's'}.`, FINAL_TITLE[spec.id], msgs);
  }
  if (T.healed >= 60) earnTitle(run, 'bloodthirsty', msgs);
  if (T.maxQuick >= 3) earnTitle(run, 'spellweaver', msgs);
  if (T.reactions >= 3) earnTitle(run, 'alchemist', msgs);
  if (T.bigHit >= 60) earnTitle(run, 'executioner', msgs);
  questEvent(run, 'fight', { f, won, spec }, msgs);
  if (spec.kind === 'trial') res.trial = settleTrial(run, f, won, meta, msgs, lr);
  if (won) {
    run.wins++;
    res.gold = 2 + (spec.kind === 'final' ? 0 : 3) + (spec.hard && hasGift(run, 'treasure') ? 5 : 0); run.gold += res.gold;
    const healF = run.world.mod === 'famine' ? 0.15 : 0.3;
    run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * healF) + (hasPerk(run, 'dressing') ? 6 : 0));
    if (runP(run).heartOnWin && run.hearts < run.maxHearts && !run.elite) { run.hearts++; restoreRecord(run, 1); msgs.push({ t: 'loot', text: '[Reaper: the kill restores 1 Heart.]' }); }
    if (spec.hard || spec.kind === 'final' || run.elite) run.pending.push({ type: 'rune', mods: rollPrefixes(3, lr, null, run) });
    if (spec.hard) { run.bonusSlot = rollPiece(run, lr, { odds: [0, 0, 0, 70, 30] }); msgs.push({ t: 'loot', text: '[A rare piece will wait in your next shop.]' }); }
    if ((spec.kind === 'erased' || spec.kind === 'champion') && spec.snap.bar.length) { const p = pick(spec.snap.bar.concat(spec.snap.gear), lr); const id = baseId(p.id); if (pieceDef(id) && !pieceDef(id).basic) { msgs.push({ t: 'loot', text: `[Reclaimed from ${spec.snap.champ}: ${pieceDef(id).name}]` }); addPiece(run, id, p.mods || [], msgs); } }
    if (run.elite) {
      run.eliteWins++;
      if (run.eliteIdx >= run.eliteBracket.length - 1) { res.eliteOver = true; res.eliteCleared = true; }
      else run.eliteIdx++;
    } else if (spec.kind === 'final') res.spared = true;
    else run.round++;
  } else {
    if (run.elite) res.eliteOver = true;
    else {
      const cost = heartCost(run, spec);
      run.losses++; run.hearts -= cost; res.heartsLost = cost; hist.hl = cost;
      if (run.hearts <= 0) {
        run.hearts = 0; res.death = true; run.cause = f.B.name;
        // At 0 Hearts every entry left goes, then the world's name
        res.erased = eraseRecord(run, REC_MAX, msgs);
        if (run.record) msgs.push({ t: 'loss', text: `[World: ${'█'.repeat(run.world.name.length)}. Status: erased.]` });
      } else {
        run.hp = Math.max(run.hp, Math.round(maxHp(run) * 0.5));
        msgs.push({ t: 'loss', text: `[Defeat. A piece of ${run.world.name} is erased. −${cost} Heart${cost > 1 ? 's' : ''}, ${run.hearts} left.]` });
        res.erased = eraseRecord(run, cost, msgs);
        if (spec.kind === 'final') msgs.push({ t: 'loss', text: '[The Final Champion waits. You must win to spare your world.]' });
        else run.round++;
      }
    }
  }
  if (won && spec.snap && spec.snap.owner) res.rested = { owner: spec.snap.owner, champ: spec.snap.champ, at: spec.snap.at, rank: spec.snap.rank || null };
  // A shared champion that beats you earns its owner's champion RP (see champWin)
  if (!won && spec.snap && spec.snap.owner) res.fell = { owner: spec.snap.owner, champ: spec.snap.champ, at: spec.snap.at };
  if (run.practice && !res.death && (run.round > (run.practiceRounds || 3))) { res.practiceDone = true; return res; }
  if (!res.death && !res.spared && !res.eliteOver) enterChoose(run, meta, rng, msgs);
  return res;
}
function startElite(run, meta, rng) {
  run.elite = true; run.eliteIdx = 0;
  const champs = run.seed ? [] : meta.champions.concat(SHARED.spared).filter(c => c.at !== run._snapAt);
  const first = champs.length ? { kind: 'champion', snap: pick(champs, rng) } : { kind: 'legend', id: 'legend' };
  run.eliteBracket = [first, { kind: 'legend', id: 'undefeated' }];
  // From A-rank the bracket gets a middle fight: another spared champion, or Varn when there isn't one
  if (!run.seed && meta.rank && rankIdx(meta.rank.letter) >= rankIdx('A')) {
    const rest = champs.filter(c => !first.snap || c.at !== first.snap.at);
    const mid = rest.length ? { kind: 'champion', snap: pick(rest, rng) } : first.kind === 'legend' ? null : { kind: 'legend', id: 'legend' };
    if (mid) run.eliteBracket.splice(1, 0, mid);
  }
  run.hp = Math.min(maxHp(run), run.hp + Math.round(maxHp(run) * 0.3));
  enterChoose(run, meta, rng);
}
function echoesFor(run, outcome) {
  let e = 3 * run.wins;
  if (outcome === 'spared' || outcome === 'elite') e += 10 + (5 - run.world.rank) * 3;
  e += 8 * run.eliteWins;
  return e;
}
function endRun(run, meta, outcome) {
  if (outcome === 'erased') { run.hearts = 0; eraseRecord(run, REC_MAX); } // an abandoned world goes all at once
  const snap = snapshot(run);
  if (meta.rank && !run.practice) Object.assign(snap, { rank: meta.rank.letter, rp: 0, kills: 0 });
  if (outcome === 'erased') { meta.erased.unshift(snap); meta.erased = meta.erased.slice(0, 20); }
  else { meta.champions.unshift(snap); meta.champions = meta.champions.slice(0, 10); meta.wins++; }
  meta.runs++;
  const e = echoesFor(run, outcome); meta.echoes += e;
  const rk = awardRank(run, meta, outcome); run.rpEarned = rk.rp; run.trialOpened = rk.trial;
  run.ended = true;
  return { echoes: e, snap, rp: rk.rp, trial: rk.trial };
}

// ---------- Entrant Rank ----------
// A permanent grade from F to S, with SS and SSS hidden above. RP opens a Rank Trial; only passing it promotes. Rank never goes down.
const RANK_LADDER = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
const RANK_RP = { E: 80, D: 300, C: 700, B: 1400, A: 2600, S: 4500, SS: 7000, SSS: 10000 }; // SS and SSS are placeholders
const TRIAL_ROUND = { E: 3, D: 3, C: 4, B: 4, A: 5, S: 6, SS: 6, SSS: 6 };
const TRIAL_CONDS = ['fast', 'react', 'stop', 'healthy']; // never "without healing": Zealot and Leech builds can't meet it
const PERKS = {
  stipend: { name: "Sponsor's Stipend", desc: '+1 starting gold.', flavour: 'A god has started sending pocket money.' },
  kindling: { name: 'Kindling', desc: 'Burn you apply +1.', flavour: "You've learned how fires like to start." },
  steeped: { name: 'Steeped Blades', desc: 'Poison you apply +1.', flavour: 'Your edges never quite dry.' },
  whetted: { name: 'Whetted Edge', desc: 'Bleed you apply +1.', flavour: 'Sharper than it needs to be.' },
  guard: { name: 'Drilled Guard', desc: 'Start each fight with 5 Block.', flavour: 'Your shield is up before the bell.' },
  frame: { name: 'Seasoned Frame', desc: '+8 max HP.', flavour: 'Scar tissue counts.' },
  keen: { name: 'Keen Eye', desc: '+4% critical chance.', flavour: 'You see the gap a moment sooner.' },
  light: { name: 'Light Feet', desc: '+3% dodge.', flavour: 'Harder to pin down than you used to be.' },
  dressing: { name: 'Field Dressing', desc: 'Heal 6 more after each won fight.', flavour: 'You patch yourself up between bouts.' },
  redraft: { name: 'Second Draft', desc: 'One extra opening draft reroll.', flavour: 'The System lets you look twice.' },
  patron: { name: "Patron's Ear", desc: 'Start with +1 Favour with your Patron.', flavour: 'Your god remembers your name.' },
  ledger: { name: 'Ledger Sense', desc: 'Interest cap +1.', flavour: 'You count your gold the way the Official does.' },
};
const TRIAL_TEXT = {
  E: ['[Promotion match: prove you are not an accident.{c}]', '[Promoted to E-rank. The System is mildly surprised.]', '[Trial failed. F-rank retained. Try again next world.]'],
  D: ['[Promotion match: defeat a D-rank Proctor.{c}]', '[Promoted to D-rank. Your file has been upgraded to paper.]', '[Trial failed. The Proctor will wait.]'],
  C: ['[Promotion match: defeat a C-rank Proctor.{c}]', '[Promoted to C-rank. Rivals have been informed.]', '[Trial failed. D-rank retained.]'],
  B: ['[Promotion match: defeat a B-rank Proctor.{c} The gods are watching.]', '[Promoted to B-rank. The gods have adjusted their odds.]', '[Trial failed. The gods have collected their bets.]'],
  A: ['[Promotion match: defeat an A-rank Proctor.{c} Few pass.]', '[Promoted to A-rank. Final Champions have been notified.]', '[Trial failed. Few pass. You remain few-adjacent.]'],
  S: ['[Final promotion match: defeat an S-rank Proctor.{c} There is no rank above S.]', '[Promoted to S-rank. There is no rank above S.]', '[Trial failed. A-rank retained. S-rank remains theoretical.]'],
  SS: ['[Promotion match: ███-rank Proctor. Rank not found.{c}]', '[Promoted to SS-rank. Record updated. Record should not exist.]', '[Trial failed. Record not created.]'],
  SSS: ["[Promotion match. The Proctor has no rank. The Proctor has never lost.{c}]", '[Promoted to SSS-rank. The System has run out of letters.]', "[Trial failed. The Proctor's record remains unbroken.]"],
};
const COND_TEXT = { fast: 'Win within 6 turns.', react: 'Trigger 2 reactions.', stop: "Stun or Interrupt the Proctor's big move.", healthy: 'Win with more than half your HP.' };
function newRank() { return { letter: 'F', rp: 0, trial: null, history: [], perks: [] }; }
function rankIdx(l) { return RANK_LADDER.indexOf(l); }
function nextRank(l) { return RANK_LADDER[rankIdx(l) + 1] || null; }
function hasPerk(run, k) { return !!(run.perks && run.perks.includes(k)); }
// World offers go up to one rank above yours: F and E see E and D worlds, C opens B worlds, A opens S worlds
// A meta without a rank (the balance tools) is not gated.
function worldCap(meta) { const r = meta && meta.rank; return r ? Math.min(5, Math.max(1, rankIdx(r.letter))) : null; }
// Saves from before Entrant Rank start at F with RP from their Halls, so a returning player's first trials come quickly
function sanitizeRank(r, m) {
  const out = newRank();
  if (r && typeof r === 'object') {
    if (rankIdx(r.letter) >= 0) out.letter = r.letter;
    out.rp = Math.max(0, Math.floor(+r.rp || 0));
    out.trial = r.trial && rankIdx(r.trial) === rankIdx(out.letter) + 1 ? r.trial : null;
    out.history = Array.isArray(r.history) ? r.history.filter(h => h && rankIdx(h.to) > 0).slice(-12) : [];
    out.perks = Array.isArray(r.perks) ? r.perks.filter(k => PERKS[k]).filter((k, i, a) => a.indexOf(k) === i) : [];
    return out;
  }
  const pay = (x, spared) => 10 * (x.wins || 0) + Math.max(0, x.hearts || 0) + (spared ? 20 : 0);
  out.rp = (m.erased || []).reduce((a, x) => a + pay(x, false), 0) + (m.champions || []).reduce((a, x) => a + pay(x, true), 0);
  if (out.rp >= RANK_RP.E) out.trial = 'E';
  return out;
}
// RP for a finished run: 10 a win, 1 a Heart left, 20 for a spared world, times the world's rank (E ×1 up to S ×2)
function rpFor(run, outcome) {
  const spared = outcome !== 'erased';
  return Math.round((10 * (run.wins || 0) + Math.max(0, run.hearts) + (spared ? 20 : 0)) * (1 + 0.2 * run.world.rank));
}
function awardRank(run, meta, outcome) {
  if (run.practice || !meta.rank) return { rp: 0, trial: null };
  const R = meta.rank, rp = rpFor(run, outcome); R.rp += rp;
  const left = run.pending.find(p => p.type === 'perk'); if (left) choosePerk(run, meta, left.offers[0]); // a run that ends before the choice keeps the first perk
  if (run.promoted) R.history.push({ to: run.promoted, world: run.world.name, outcome, lost: run.record ? run.record.ids.length - recLeft(run.record) : 0, at: Date.now() });
  R.history = R.history.slice(-12);
  return { rp, trial: openTrial(R) };
}
function openTrial(R) { const nx = nextRank(R.letter); if (R.trial || !nx || R.rp < RANK_RP[nx]) return null; R.trial = nx; return nx; }
// Elite wins come after the spared world is filed, so they pay their RP when the run closes
function eliteRank(run, meta) {
  if (run.practice || !meta.rank || !run.eliteWins) return { rp: 0, trial: null };
  const rp = Math.round(10 * run.eliteWins * (1 + 0.2 * run.world.rank)); meta.rank.rp += rp;
  run.rpEarned = (run.rpEarned || 0) + rp; run.trialOpened = run.trialOpened || openTrial(meta.rank);
  return { rp, trial: run.trialOpened };
}
function trialSpec(run, rng) {
  const to = run.trial.to, early = rankIdx(to) <= rankIdx('D');
  const conds = TRIAL_CONDS.filter(k => k !== 'stop' || canStop(run));
  return { kind: 'trial', id: 'proctor', to, hard: !early, cond: early ? null : pick(conds, rng) };
}
// The Proctor fights at the world rank of the grade it examines: E-rank at E worlds up to S-rank (and beyond) at S
function trialMul(run, spec) { const w = Math.min(5, rankIdx(spec.to) - 1); return (0.92 + 0.05 * w) / (0.92 + 0.05 * run.world.rank); }
function trialLine(to, i, cond) { return TRIAL_TEXT[to][i].replace('{c}', cond ? ' ' + COND_TEXT[cond] : ''); }
function perkOffers(meta, rng) { return shuffle(Object.keys(PERKS).filter(k => !meta.rank.perks.includes(k)), rng).slice(0, 2); }
// A lost fight costs the round's normal Hearts as usual. A won fight that misses the condition costs nothing. Either way the trial waits for the next run.
function settleTrial(run, f, won, meta, msgs, rng) {
  const spec = f.spec, ok = won && (!spec.cond || WAGERS[spec.cond].check(f));
  run.trial.done = true;
  if (!ok) { msgs.push({ t: 'loss', text: trialLine(spec.to, 2) }); return { ok, to: spec.to }; }
  const R = meta.rank; R.letter = spec.to; R.trial = null; run.promoted = spec.to;
  msgs.push({ t: 'class', text: trialLine(spec.to, 1) });
  const offers = perkOffers(meta, rng);
  if (offers.length) run.pending.push({ type: 'perk', offers, to: spec.to });
  return { ok, to: spec.to };
}
// Lines from the lore thread (entrant-rank.md). {champ} is the champion's name.
const RANK_ADDRESS = {
  F: ['[F-rank Entrant. Your world has been noted.]', '[F-rank. Expectations have been set accordingly.]'],
  E: ['[E-rank Entrant. You are now slightly harder to forget.]', '[E-rank. The System has learned your number.]'],
  D: ['[D-rank Entrant. The crowd has started betting on you. Small amounts.]', '[D-rank. Your file has been moved to a thicker folder.]'],
  C: ['[C-rank Entrant. Rivals have begun to read your record.]', '[C-rank. Competent. The System does not say this often.]'],
  B: ['[B-rank Entrant. The gods have stopped laughing during your fights.]', '[B-rank. Your worlds are judged with some reluctance.]'],
  A: ['[A-rank Entrant. Final Champions have been informed.]', '[A-rank. The System is watching more closely. For your benefit.]'],
  S: ['[S-rank Entrant {champ}. The tournament knows your name.]', '[S-rank. There is no higher rank. Records indicate otherwise.]'],
  SS: ['[SS-rank. This rank was not supposed to be reachable.]', '[SS-rank Entrant. Several records have been unsealed for you.]'],
  SSS: ['[SSS-rank. The Undefeated has been notified.]', '[SSS-rank Entrant {champ}. The System has no further grades. It is making one up.]'],
};
// below: you're below them; level; above: you outrank them; grudge: you've beaten them before
const RIVAL_LINES = {
  grukk: { below: 'Little rank. Grukk go easy. Grukk not know how, but try.', level: 'Same letter as Grukk! Good. Fair fight. Grukk still win.', above: 'Big letter. Grukk lose to big letters lots. Grukk not mind.', grudge: 'You beat Grukk before. Grukk remember. Grukk get up again.' },
  calder: { below: "A lower rank. I'll observe the rules all the same.", level: 'An equal. Salute, and we begin properly.', above: 'Outranked. Then it will be an honour to lose correctly.', grudge: "You beat me last time. I've filed a complaint. Shall we?" },
  seraphine: { below: "You're new. Shield up. I won't hold back, but I'll pray for you after.", level: 'A worthy rank. My faith against yours, then.', above: "So high already. Remember who you're fighting for.", grudge: "You beat me once. I've been praying about that." },
  lyss: { below: "A low rank. You won't even notice the poison.", level: "Same grade. Then I'll have to actually try. How dull.", above: 'Ooh, a high rank. Did you drink your water today?', grudge: "You again. I've switched to a stronger poison." },
  kaito: { below: "Your rank is low. Your habits are lower. I've seen them before.", level: "We're equals. That's never happened in this tournament.", above: "You outrank me. Then you've seen what I've seen. Be careful.", grudge: "You beat me. I've studied that fight. Show me something new." },
};
const FINAL_GREET = {
  leviathan: '{champ}. Even the deep has heard of you. It will still take you.',
  kharros: '{champ}. At last, an enemy worth a war. I will not insult you with mercy.',
  bone_saint: '{champ}. I have prayed for you. Lie down, and let me finish the prayer.',
  thorn_mother: '{champ}. The forest has been saving a place for you.',
  archmage: "{champ}. Ah. You're the first thing I've had to look up at in centuries.",
  forge_king: '{champ}. I had the gates reinforced when I heard you were coming.',
};
function rankAddress(meta, champ, n) { const L = RANK_ADDRESS[meta.rank.letter]; return L[(n || 0) % L.length].replace('{champ}', champ || 'Entrant'); }
// The fight intro, rank against rank. Returns the lines to show after "[X enters the arena.]"; the System's own lines are bracketed.
function rankIntro(run, meta, spec, foeName) {
  if (!meta.rank || run.practice) return [];
  const me = meta.rank.letter, champ = run.name, out = [];
  if (spec.id === 'undefeated') return rankIdx(me) >= rankIdx('SS') ? [{ t: 'loss', text: `[Entrant record for the Undefeated: ERROR. Entrant record for ${champ}: ERROR.]`, replaces: 'sealed' }] : [];
  const foe = specRank(spec, meta);
  if (foe) {
    const gap = rankIdx(me) - rankIdx(foe);
    const tail = gap <= -2 ? 'Mismatch logged. The System accepts no complaints.' : gap >= 2 ? 'Mismatch logged. Please try not to embarrass them.' : gap < 0 ? 'The odds have been adjusted against you.' : gap > 0 ? 'The crowd expects a short fight.' : 'An even match, on paper.';
    out.push({ t: 'sys', text: `[${me}-rank Entrant vs ${foe}-rank ${spec.kind === 'trial' ? 'Proctor' : foeName}. ${tail}]` });
    const R = spec.kind === 'rival' && RIVAL_LINES[spec.id];
    if (R) out.push({ t: 'foe', text: `"${meta.archive.beat[spec.id] ? R.grudge : gap < 0 ? R.below : gap > 0 ? R.above : R.level}"` });
    if (spec.id === 'masked') out.push(meta.archive.beat.masked ? { t: 'loss', text: '[The Masked Entrant has copied your record. Including the loss.]' } : { t: 'sys', text: `[Entrant rank: ${me}. Entrant rank: ${me}.]` });
  }
  if (spec.kind === 'final' && rankIdx(me) >= rankIdx('S') && FINAL_GREET[spec.id]) out.push({ t: 'foe', text: `"${FINAL_GREET[spec.id].replace('{champ}', champ)}"` });
  if (spec.kind === 'trial') out.unshift({ t: 'class', text: trialLine(spec.to, 0, spec.cond) });
  return out;
}
// The Halls' rank history, one line per promotion
function historyLine(h) {
  if (h.daily) return `[Promoted to ${h.to}-rank in the Pending World.]`;
  if (h.outcome === 'erased') return `[Promoted to ${h.to}-rank. ${h.world} was erased on the way.]`;
  return h.lost ? `[Promoted to ${h.to}-rank. ${h.world} was spared, missing ${h.lost} entr${h.lost === 1 ? 'y' : 'ies'}.]` : `[Promoted to ${h.to}-rank. ${h.world} was spared without a scratch.]`;
}
// Champion rank: a filed champion keeps its Entrant's rank, earns 10 RP for each win in another Entrant's tournament,
// and climbs a letter every 30 RP, up to S. Returns the System's line for the owner, or null.
const CHAMP_STEP = 30;
function champWin(snap, spared) {
  snap.kills = (snap.kills || 0) + 1; snap.rp = (snap.rp || 0) + 10;
  let up = false;
  while (snap.rp >= CHAMP_STEP && rankIdx(snap.rank || 'F') < rankIdx('S')) { snap.rp -= CHAMP_STEP; snap.rank = nextRank(snap.rank || 'F'); up = true; }
  const who = snap.champ, n = snap.kills;
  if (spared) return up ? `[Your champion ${who}, now ${snap.rank}-rank, has defended the elite bracket ${n} time${n === 1 ? '' : 's'}.]` : null;
  if (up) return `[Your erased champion ${who}, now ${snap.rank}-rank, has erased ${n} world${n === 1 ? '' : 's'}.]`;
  return n === 1 ? `[Your erased champion ${who} has erased a world in another Entrant's tournament.]` : null;
}
// Pending World seasons: one week, Monday to Monday on the game-day clock. Each daily top-10 place pays points,
// and every posted score pays 1. The week's top Entrant is the Prime Entrant until the next season closes.
const SEASON_PTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SEASON_TITLE = 'Prime Entrant';
function weekOf(date) { const d = Date.parse(date + 'T00:00:00Z'), back = (new Date(d).getUTCDay() + 6) % 7; return new Date(d - back * 864e5).toISOString().slice(0, 10); }
function weekDates(start) { const d = Date.parse(start + 'T00:00:00Z'); return Array.from({ length: 7 }, (_, i) => new Date(d + i * 864e5).toISOString().slice(0, 10)); }
// days: one list per game day, each sorted best first (the day's top 20). Later days set the name, sigil and rank shown.
function seasonTable(days) {
  const by = {};
  days.forEach(rows => (rows || []).forEach((r, i) => {
    const e = by[r.uid] = by[r.uid] || { uid: r.uid, pts: 0, days: 0, best: 0 };
    e.pts += (SEASON_PTS[i] || 0) + 1; e.days++; e.best = Math.max(e.best, r.score || 0);
    Object.assign(e, { name: r.name, sigil: r.sigil, color: r.color, rank: r.rank || null });
  }));
  return Object.values(by).sort((a, b) => b.pts - a.pts || b.best - a.best || (a.uid < b.uid ? -1 : 1));
}
function choosePerk(run, meta, k, msgs) {
  const i = run.pending.findIndex(p => p.type === 'perk'); if (i < 0) return false;
  const p = run.pending[i]; if (!p.offers.includes(k) || meta.rank.perks.includes(k)) return false;
  run.pending.splice(i, 1); meta.rank.perks.push(k);
  msgs && msgs.push({ t: 'class', text: `[Class advancement: ${PERKS[k].name}. Active from your next world.]` });
  return true;
}

if (typeof module !== 'undefined') module.exports = {
  VERSION, STATS, STAT_INFO, RANKS, PRICE, ARCH, ARCH_KEYS, START_ARCH, archTier, SKILLS, SHOP_SKILLS, GEAR, GEAR_SLOTS, STAR_MULT, gearPas, gearText, gearStats, isGear, pieceDef, baseId,
  PREFIXES, MAX_MODS, prefixOk, rollPrefixes, moddedDef, effRank, modName, GODS, WORLD_TYPES, WORLD_RANKS, MODIFIERS, GIFTS, GIFT_CATS, SIGILS, SIGIL_COLS, giftBudget, giftsAllowed, giftCheck,
  ENEMIES, MONSTERS, RIVALS, ROUNDS, UNLOCKS, TUNE, HEART_COST, REACTIONS, WAGERS, DISTRICTS, EVENTS,
  RANK_LADDER, RANK_RP, TRIAL_ROUND, TRIAL_CONDS, PERKS, TRIAL_TEXT, COND_TEXT, newRank, rankIdx, nextRank, hasPerk, worldCap, sanitizeRank, rpFor, awardRank, openTrial, eliteRank, RANK_ADDRESS, RIVAL_LINES, FINAL_GREET, rankAddress, rankIntro, historyLine, CHAMP_STEP, champWin, SEASON_PTS, SEASON_TITLE, weekOf, weekDates, seasonTable, trialSpec, trialMul, trialLine, perkOffers, settleTrial, choosePerk,
  mulberry32, hashStr, seedRng, runRng, stream, dailyDate, dailySeed, dailyWorld, dailyRecord, levelMeta, dailyScore,
  LORE, REC_SIZE, REC_MAX, loreName, loreWho, buildRecord, ensureRecord, eraseRecord, restoreRecord, amendRecord, sanitizeRec, recLeft, recWorldGone, partialWords, recEntries, bioParts, recFragment,
  pick, shuffle, newMeta, migrateMeta, unlockedArch, offerWorlds, newRun, hasGift, effStats, maxHp, xpNeed, gainXp, buyXp, oddsFor, poolIds, rollPiece, price, sellValue, refreshShop, reroll, income, interestCap, SHOP_KINDS, ensureShop, shopItem, ownedCopies,
  allPieces, findPiece, canBuy, buy, sell, addPiece, movePiece, equipBest, evolve, checkMerges, mergeNeed, wouldMerge, archCounts, runCounts, buildP, runP, favourTiers,
  makeChoices, specName, specRank, specStyle, specReward, specKey, chooseOpponent, currentSpec, heartCost, makeWager, addFavour, rollDistricts, infirmary, sanctum, eventOpt, resolveEvent, prefixTargets, applyPrefix,
  rollDraft, rerollDraft, confirmDraft, SHARED, setShared, sanitizeSnap, enterChoose, leaveShop, useDistrict, curRound,
  TITLES, FINAL_TITLE, QUESTS, QUEST_REWARD, HIDDEN_PATHS, MILESTONES, CHAIN_STARTERS, giftUnlocked, giftLockText, makeOffer, giftCost, randomGifts, bindMeta, earnTitle, worldFirst, questEvent, extraGiftOffers, applyGift, checkMilestones, hiddenPathOf, undercityEvent, dueChainEvents, rerollCost, checkPath,
  buildPlayer, buildEnemy, snapshot, newFight, playerAct, skipPlayer, enemyTurn, intentInfo, previewSkill, describe, canUse, resolveFight, startElite, endRun, echoesFor, skillPower,
};
