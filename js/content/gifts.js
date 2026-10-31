// ===== [World Pending Deletion] — content: Gifts =====
'use strict';
// cat: world | cheat (max 1) | growth | combat | fortune | divine | bloodline | flaw (max 2)
// lock: a Title id that unlocks it, 'echo' (bought with Echoes) or 'chain' (found in an event chain)
// p: what it does in a fight, as effects from effects.js. Gifts that change the run instead (gold, odds, Hearts, merges)
// have no p yet and are read in core.js.
const GIFTS = {
  tidecaller: { name: 'Tidecaller', cat: 'world', cost: 1, desc: 'Heal 2 at the start of each of your turns.', p: { regen: 2 } },
  deserter: { name: 'Legion Deserter', cat: 'world', cost: 1, desc: 'Start each fight with 15 Block.', p: { startBlock: 15 } },
  warden: { name: 'Grave Warden', cat: 'world', cost: 1, desc: 'Heal 30% of Poison damage dealt (max 30% from all sources).', p: { poisonHeal: 0.3 } },
  hedgewitch: { name: 'Hedge Witch', cat: 'world', cost: 1, desc: 'Bleed you apply +1, and heal 1 whenever you apply Bleed.', p: { bleedPlus: 1, healOnBleed: 1 } },
  prodigy: { name: 'Arcane Prodigy', cat: 'world', cost: 1, desc: 'A 5th skill slot, but 10% less max HP.' },
  runesmith: { name: 'Runesmith', cat: 'world', cost: 1, desc: 'Your gear merges at 2 copies instead of 3.' },
  lightningrod: { name: 'Lightning Rod', cat: 'world', cost: 1, desc: 'Breaking an opponent Empowers you for 2 turns.', p: { breakEmpower: 2 } },
  appraisal: { name: 'Absolute Appraisal', cat: 'cheat', cost: 4, desc: "See every opponent's full kit and their next 2 moves." },
  monarch: { name: "Monarch's Domain", cat: 'cheat', cost: 6, desc: 'Every archetype you have counts 1 extra piece.' },
  rewind: { name: 'Return by Death', cat: 'cheat', cost: 6, desc: 'Once per run, a loss rewinds to the start of that fight.' },
  copycat: { name: 'Copycat', cat: 'cheat', cost: 5, desc: "Once per fight, use the opponent's last move as your own.", lock: 'mirror_breaker', p: { copycat: 1 } },
  swordsaint: { name: 'Sword Saint', cat: 'cheat', cost: 5, desc: 'Your basic Attack becomes S-rank: far stronger, and it ignores Block.', lock: 'giant_slayer', p: { swordSaint: 1 } },
  gacha: { name: 'Gacha Luck', cat: 'cheat', cost: 4, desc: 'Your first reroll each round is free, and shop odds are 1 level better.', lock: 'echo' },
  fastlearner: { name: 'Fast Learner', cat: 'growth', cost: 3, desc: 'Stat points cost a third less.' },
  merger: { name: 'Quick Study', cat: 'growth', cost: 3, desc: 'Your first 3 merges need only 2 copies.' },
  veteran: { name: 'Tournament Veteran', cat: 'growth', cost: 2, desc: 'Start with 6 more gold and an extra draft reroll.' },
  latebloomer: { name: 'Late Bloomer', cat: 'growth', cost: 2, desc: 'Every stat starts 1 lower, but each level you reach gives a free stat point.', lock: 'echo' },
  affinity: { name: 'Skill Affinity', cat: 'growth', cost: 2, desc: "Your world's home archetype pieces cost 1 less (minimum 1).", lock: 'echo' },
  catalyst: { name: 'Catalyst', cat: 'combat', cost: 3, desc: 'Reactions are 50% stronger.', p: { reactMult: 1.5 } },
  berserker: { name: "Berserker's Blood", cat: 'combat', cost: 2, desc: '+30% damage below half HP.', p: { lowHpDmg: 0.3 } },
  ironbody: { name: 'Iron Body', cat: 'combat', cost: 2, desc: 'Start each fight with Block equal to 10% of your max HP.', p: { startBlockPct: 0.1 } },
  glass: { name: 'Glass Cannon', cat: 'combat', cost: 2, desc: '+30% damage, 20% less max HP.', p: { dmgPct: 0.3 } },
  foresight: { name: 'Foresight', cat: 'combat', cost: 3, desc: "Always see the opponent's next 2 moves." },
  firststrike: { name: 'First Strike', cat: 'combat', cost: 2, desc: 'Your first damaging skill each fight deals double.', lock: 'first_blood', p: { firstHit: 1 } },
  thickskin: { name: 'Thick Skin', cat: 'combat', cost: 2, desc: 'Every hit you take deals 2 less damage.', lock: 'untouched', p: { flatDR: 2 } },
  vampire: { name: 'Vampirism', cat: 'combat', cost: 3, desc: 'Heal 8% of all damage you deal.', lock: 'bloodthirsty', p: { lifesteal: 0.08 } },
  manaaffinity: { name: 'Mana Affinity', cat: 'combat', cost: 2, desc: 'Quick skills have a 1 turn shorter cooldown.', lock: 'spellweaver', p: { quickCd: 1 } },
  lucky: { name: 'Lucky Star', cat: 'fortune', cost: 2, desc: '+10% critical chance and better shop odds.', p: { critBonus: 0.1 } },
  golden: { name: 'Golden Touch', cat: 'fortune', cost: 3, desc: 'Interest cap rises from 5 to 8.' },
  breath: { name: 'Second Breath', cat: 'fortune', cost: 3, desc: 'Once per run, survive a killing blow with 1 HP.' },
  gambler: { name: 'Gambler', cat: 'fortune', cost: 2, desc: 'Winning a wager pays 15 gold instead of 10.', lock: 'high_roller' },
  haggler: { name: 'Haggler', cat: 'fortune', cost: 2, desc: 'The first piece you buy each round costs 1 less.', lock: 'echo' },
  treasure: { name: 'Treasure Sense', cat: 'fortune', cost: 2, desc: 'Beating a hard opponent also pays 5 gold.', lock: 'underdog' },
  chosen_war: { name: 'Chosen of War', cat: 'divine', cost: 2, desc: 'Start with 4 Favour with the God of War: their gift arrives at once.' },
  chosen_trick: { name: 'Chosen of the Trickster', cat: 'divine', cost: 2, desc: 'Start with 4 Favour with the Trickster: their gift arrives at once.' },
  chosen_ruin: { name: 'Chosen of Ruin', cat: 'divine', cost: 2, desc: 'Start with 4 Favour with the Goddess of Ruin: their gift arrives at once.' },
  ironwill: { name: 'Iron Will', cat: 'bloodline', cost: 3, desc: 'Lose 1 fewer Heart per defeat (minimum 1).' },
  dragon: { name: 'Dragon Blood', cat: 'bloodline', cost: 4, desc: '+15% max HP. Toxic Flare and Cauterise heal you 5.', lock: 'emberfall', p: { reactHeal: 5 } },
  elf: { name: 'Elf-touched', cat: 'bloodline', cost: 3, desc: '+10% dodge, and Bleed you apply +1.', lock: 'thornbane', p: { dodge: 0.1, bleedPlus: 1 } },
  demon: { name: 'Demon Blood', cat: 'bloodline', cost: 3, desc: '+15% damage, but healing is 20% weaker.', lock: 'comeback', p: { dmgPct: 0.15, healPct: -0.2 } },
  lastwords: { name: 'Last Words', cat: 'bloodline', cost: 3, desc: 'Once per fight, dropping below 25% HP gives you Block equal to 25% of your max HP.', lock: 'chain', p: { lastWords: 0.25 } },
  f_glass: { name: 'Glass Body', cat: 'flaw', cost: -2, desc: '20% less max HP.' },
  f_marked: { name: 'Marked by the System', cat: 'flaw', cost: -2, desc: 'Opponents are 10% stronger.' },
  f_cursed: { name: 'Cursed Luck', cat: 'flaw', cost: -2, desc: 'Shop prices +1.' },
  f_debt: { name: 'Debt to the Trickster', cat: 'flaw', cost: -3, desc: 'Lose 10 gold at the start of rounds 3 and 6.' },
  f_amnesia: { name: 'Amnesia', cat: 'flaw', cost: -1, desc: 'The Tournament Archive is sealed for this run.' },
  f_sluggish: { name: 'Sluggish', cat: 'flaw', cost: -2, desc: 'Start every fight Weakened.', p: { sluggish: 1 } },
  f_unlucky: { name: 'Unlucky', cat: 'flaw', cost: -1, desc: 'Rerolls cost 3 gold.' },
};
// Affinity Gifts are only offered as the Additional Gift: +1 piece to one archetype.
Object.keys(ARCH).forEach(k => { GIFTS['aff_' + k] = { name: `${ARCH[k].name} Affinity`, cat: 'extra', cost: 0, desc: `Your ${ARCH[k].name} bonuses count 1 extra piece.`, arch: k }; });
const GIFT_CATS = { world: 'World', cheat: 'Cheat', growth: 'Growth', combat: 'Combat', fortune: 'Fortune', divine: 'Divine', bloodline: 'Bloodline', flaw: 'Flaw' };
