// ===== [World Pending Deletion] — content: skills: Zealot =====
'use strict';
sk('penance', 'Penance', ['zealot'], 'E', 1, { dmg: 6, heal: 2, brk: 6 }, [['atonement', 'Atonement', { dmg: 8, heal: 4, brk: 8 }], ['zeal', 'Zeal', { dmg: 5, hits: 2, heal: 2, brk: 8 }], ['contrition', 'Contrition', { dmg: 6, heal: 2, brk: 6, cleanse: 1 }]]);
sk('holy_light', 'Holy Light', ['zealot'], 'E', 2, { heal: 10, brk: 6 }, [['radiance', 'Radiance', { heal: 16, brk: 8 }], ['purifying_light', 'Purifying Light', { heal: 9, cleanse: 1, brk: 6 }], ['dawnlight', 'Dawnlight', { heal: 6, regen: 3, brk: 6 }]]);
sk('shield_of_faith', 'Shield of Faith', ['zealot'], 'E', 2, { block: 6 }, [['aegis', 'Aegis', { block: 12 }], ['blessed_shield', 'Blessed Shield', { block: 6, cleanse: 1 }], ['shield_of_zeal', 'Shield of Zeal', { block: 6, empower: 1 }]], { quick: true });
sk('purify', 'Purify', ['zealot'], 'D', 3, { cleanse: 1, heal: 6, brk: 4 }, [['sanctuary', 'Sanctuary', { cleanse: 1, heal: 10, block: 8, brk: 6 }], ['reversal', 'Reversal', { cleanse: 1, reflect: 1, block: 5, brk: 6 }], ['absolution', 'Absolution', { cleanse: 1, heal: 6, brk: 4, weaken: 2 }]]);
sk('second_wind', 'Second Wind', ['zealot'], 'D', 3, { healMissing: 0.25, brk: 4 }, [['last_breath', 'Last Breath', { healMissing: 0.4, brk: 6 }], ['rally', 'Rally', { healMissing: 0.25, empower: 1, brk: 4 }], ['grit', 'Grit', { healMissing: 0.25, brk: 4, block: 8 }]]);
sk('consecrate', 'Consecrate', ['zealot'], 'C', 3, { regen: 4, brk: 4 }, [['hallowed_ground', 'Hallowed Ground', { regen: 7, brk: 6 }], ['holy_fire', 'Holy Fire', { regen: 4, burn: 4, brk: 6 }], ['sanctified_ground', 'Sanctified Ground', { regen: 4, brk: 4, thorns: 5 }]]);
sk('miracle', 'Miracle', ['zealot'], 'A', 5, { healMissing: 0.5, cleanse: 1, block: 10, brk: 10 }, [['resurrection', 'Resurrection', { healMissing: 0.7, cleanse: 1, block: 12, brk: 10 }], ['divine_wrath', 'Divine Wrath', { healMissing: 0.4, dmg: 15, brk: 14 }], ['ascension', 'Ascension', { healMissing: 0.4, cleanse: 1, empower: 3, brk: 10 }]]);
sk('vigil', 'Vigil', ['zealot'], 'D', 1, { heal: 6, read: 'debuff', readFx: { heal: 20, cleanse: 1, block: 16 } }, [['night_watch', 'Night Watch', { heal: 6, regen: 2, read: 'debuff', readFx: { heal: 16, cleanse: 1, regen: 8 } }], ['warding_prayer', 'Warding Prayer', { heal: 6, read: 'debuff', readFx: { heal: 12, cleanse: 1, block: 32 } }], ['lantern_watch', 'Lantern Watch', { heal: 6, read: 'debuff', readFx: { heal: 12, cleanse: 1, empower: 1 } }]]);
// Mastery pieces (mastery: the Archetype Mastery level that opens them; see mastery.js)
sk('lay_on_hands', 'Lay on Hands', ['zealot'], 'D', 2, { heal: 8, fullBlock: 6 }, [['healing_hands', 'Healing Hands', { heal: 12, fullBlock: 9 }], ['warding_hands', 'Warding Hands', { heal: 8, fullBlock: 6, block: 5 }], ['cleansing_hands', 'Cleansing Hands', { heal: 8, fullBlock: 6, cleanse: 1 }]], { mastery: 2 });
sk('martyrs_vow', "Martyr's Vow", ['zealot'], 'C', 3, { regen: 5, brk: 6, block: 4 }, [['saints_vow', "Saint's Vow", { regen: 8, brk: 6, block: 4 }], ['stubborn_vow', 'Stubborn Vow', { regen: 5, brk: 6, block: 10 }], ['shattering_vow', 'Shattering Vow', { regen: 5, brk: 12, block: 4 }]], { mastery: 6 });
flav({
  penance: "Every blow a prayer. Every prayer a blow.",
  atonement: "You strike once for every sin of theirs you can name.",
  zeal: "Faith, delivered twice, at speed.",
  holy_light: "Warm light falls on your wounds and closes them.",
  radiance: "The cheap seats shade their eyes.",
  purifying_light: "The light burns the curses out of you.",
  shield_of_faith: "Belief, held up like a shield. It works more often than it should.",
  aegis: "The old prayer for protection, said all the way through.",
  blessed_shield: "Nothing unclean lands on it.",
  purify: "You breathe out, and the poison goes with it.",
  sanctuary: "A circle of quiet. No curse crosses it.",
  reversal: "You send their curses home to them.",
  second_wind: "You were done. Your body disagrees.",
  last_breath: "You have nearly died before. You were bad at it.",
  rally: "Up again, and angrier.",
  consecrate: "You bless the sand under your feet. It mends you slowly.",
  hallowed_ground: "The tide temples of the Drowned Isles pray for ground like this.",
  holy_fire: "Holy ground, with opinions about trespassers.",
  miracle: "The System logs it as an error. The crowd calls it a miracle.",
  resurrection: "You stand up. The healers had already left.",
  divine_wrath: "Mercy, then judgement, in that order.",
  vigil: "You stayed awake for this. The curse arrives to find you ready.",
  night_watch: "Someone has to keep the lamps lit.",
  warding_prayer: "A short prayer, said early, before anyone needed it.",
  contrition: "A blow that cleans the one who gives it.",
  dawnlight: "Not a flash. A slow sunrise.",
  shield_of_zeal: "Faith that protects, and then pushes.",
  absolution: "You are forgiven. They are not.",
  grit: "Teeth set, feet planted, still here.",
  sanctified_ground: "Holy ground that bites anyone who steps on it uninvited.",
  ascension: "You rise, and you keep rising.",
  lantern_watch: "The lamp shows the curse coming, and you answer it.",
  lay_on_hands: "The oldest medicine. It works if you mean it.",
  healing_hands: "Warm, steady and not in any hurry.",
  warding_hands: "Palms out. Whatever comes next can wait.",
  cleansing_hands: "What was in the wound is no longer in the wound.",
  martyrs_vow: "Sworn aloud, so the gods could not pretend they missed it.",
  saints_vow: "The Marches keep a list of people who said this. It is short.",
  stubborn_vow: "You promised to stay standing. Nobody asked you to be reasonable.",
  shattering_vow: "Kept so hard that something of theirs gives way.",
});
