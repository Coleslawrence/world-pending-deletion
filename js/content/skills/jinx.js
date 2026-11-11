// ===== [World Pending Deletion] — content: skills: Jinx =====
'use strict';
// Misfortune (misf) stacks on the opponent and never fades; it pays to jinx the opponent's shown move. Omens (omenAtk,
// omenGuard) fire when the opponent's move matches. Curse sits on you: +6% skill damage and +4% damage taken a stack.
sk('evil_eye', 'Evil Eye', ['jinx'], 'E', 1, { dmg: 6, misf: 2 }, [['stare_down', 'Stare Down', { dmg: 6, misf: 3 }], ['glare', 'Glare', { dmg: 9, misf: 1 }], ['withering_look', 'Withering Look', { dmg: 6, misf: 2, weaken: 1 }]]);
sk('ill_omen', 'Ill Omen', ['jinx'], 'E', 1, { omenAtk: 12 }, [['dire_omen', 'Dire Omen', { omenAtk: 18 }], ['twin_omens', 'Twin Omens', { omenAtk: 12, omenGuard: 1 }], ['portent_of_pain', 'Portent of Pain', { omenAtk: 12, mark: 2 }]]);
sk('knock_wood', 'Knock on Wood', ['jinx'], 'E', 1, { block: 6, jinxDisc: 2 }, [['touch_wood', 'Touch Wood', { block: 10, jinxDisc: 2 }], ['ward_off', 'Ward Off', { block: 6, jinxDisc: 2, uncurse: 1 }], ['lucky_charm', 'Lucky Charm', { block: 6, jinxDisc: 2, heal: 4 }]], { quick: true });
sk('pass_curse', 'Pass the Curse', ['jinx'], 'D', 2, { passCurse: 2 }, [['crossed_path', 'Crossed Path', { passCurse: 2, curseDmg: 3 }], ['keep_little', 'Keep a Little', { passCurse: 2, curseKeep: 2 }], ['ill_gift', 'Ill Gift', { passCurse: 2, weaken: 2 }]]);
sk('thirteenth', 'Thirteenth Hour', ['jinx'], 'C', 3, { perMisf: 3, perCurse: 3 }, [['witching_hour', 'Witching Hour', { perMisf: 4, perCurse: 4 }], ['last_hour', 'Last Hour', { perMisf: 3, perCurse: 3, killReset: 1 }], ['midnight_toll', 'Midnight Toll', { perMisf: 3, perCurse: 3, pierce: 1 }]]);
sk('cursed_coin', 'Cursed Coin', ['jinx', 'venom'], 'B', 3, { weaken: 2, misf: 5, coinStun: 1 }, [['bad_penny', 'Bad Penny', { weaken: 2, misf: 5, coinStun: 1, misfT: 2 }], ['heads_win', 'Heads I Win', { weaken: 3, misf: 5, coinStun: 1 }], ['tails_you_lose', 'Tails You Lose', { weaken: 2, misf: 5, coinStun: 1, block: 8 }]]);
sk('calamity', 'Calamity', ['jinx'], 'A', 4, { dmg: 10, calamity: 4 }, [['catastrophe', 'Catastrophe', { dmg: 10, calamity: 5 }], ['aftermath', 'Aftermath', { dmg: 10, calamity: 4, keepHalf: 1 }], ['silver_lining', 'Silver Lining', { dmg: 10, calamity: 4, heal: 10 }]]);
sk('bad_wick', 'Bad Wick', ['jinx', 'pyre'], 'D', 1, { burn: 4, misfPerBurn: 3 }, [['wax_and_ash', 'Wax and Ash', { burn: 4, misfPerBurn: 2 }], ['ember_omen', 'Ember Omen', { burn: 4, misfPerBurn: 3, omenAtk: 8 }], ['snuffed_wick', 'Snuffed Wick', { burn: 4, misfPerBurn: 3, weaken: 1 }]]);
// Mastery pieces (mastery: the Archetype Mastery level that opens them; see mastery.js)
sk('broken_mirror', 'Broken Mirror', ['jinx'], 'D', 2, { misf: 3, block: 7, curseSelf: 1 }, [['seven_years', 'Seven Years', { misf: 5, block: 7, curseSelf: 1 }], ['mirrored_guard', 'Mirrored Guard', { misf: 3, block: 12, curseSelf: 1 }], ['clean_break', 'Clean Break', { misf: 3, block: 7 }]], { mastery: 2 });
sk('crossed_fingers', 'Crossed Fingers', ['jinx'], 'C', 1, { dmg: 5, misf: 2, omenGuard: 1 }, [['fingers_and_toes', 'Fingers and Toes', { dmg: 5, misf: 4, omenGuard: 1 }], ['white_lie', 'White Lie', { dmg: 5, misf: 2, omenGuard: 1, weaken: 1 }], ['hedged_hex', 'Hedged Hex', { dmg: 5, misf: 2, omenGuard: 1, block: 6 }]], { mastery: 6 });
flav({
  bad_wick: "Lit at both ends, and pointed at someone else.",
  wax_and_ash: "The longer it burns, the worse their week gets.",
  ember_omen: "[Omen logged. Fire hazard noted.]",
  evil_eye: "One look, held a moment too long.",
  stare_down: "You do not blink. Neither does their luck.",
  glare: "The look hurts. The luck hurts later.",
  ill_omen: "A crow lands on their shoulder. It knows something.",
  dire_omen: "The crow brought friends.",
  twin_omens: "Two crows. One for each plan.",
  knock_wood: "Twice on the shield, for luck. Yours, not theirs.",
  touch_wood: "Good oak, and you hold on tight.",
  ward_off: "Salt over the shoulder. A little bad luck falls off.",
  pass_curse: "It was never yours to keep.",
  crossed_path: "You hand it over. It bites on the way.",
  keep_little: "A little bad luck keeps you sharp.",
  thirteenth: "The clock strikes a number it does not have.",
  witching_hour: "Midnight came early, and it brought everything.",
  last_hour: "If this is the end, it is theirs.",
  cursed_coin: "Heads, they lose. Tails, they lose slower.",
  bad_penny: "It keeps turning up. So does the misfortune.",
  heads_win: "Nobody has ever seen the other side.",
  calamity: "Everything that could go wrong for them, at once.",
  catastrophe: "Bad luck that has been saving itself up.",
  aftermath: "The worst is over. Some of it stays.",
  withering_look: "One look, and their arm goes heavy.",
  portent_of_pain: "The omen points them out, and everything follows the finger.",
  lucky_charm: "A charm that works, for once, and only for you.",
  ill_gift: "Wrapped nicely. They should not have opened it.",
  midnight_toll: "No wall keeps out the thirteenth bell.",
  tails_you_lose: "Whichever way it lands, you were standing behind it.",
  silver_lining: "Every disaster has one. You take it.",
  snuffed_wick: "The candle goes out, and their strength with it.",
  broken_mirror: "You break it on purpose and hide behind the pieces.",
  seven_years: "The full term. Most of it is theirs.",
  mirrored_guard: "They swing at you and hit their own bad luck.",
  clean_break: "It snapped along the line. None of it landed on you.",
  crossed_fingers: "Behind your back, where the promise can't see them.",
  fingers_and_toes: "Everything you have that crosses, crossed.",
  white_lie: "Small, kind and entirely to their cost.",
  hedged_hex: "A curse with a clause in it, in your favour.",
});
