// ===== [World Pending Deletion] — content: skills: Jinx =====
'use strict';
// Misfortune (misf) stacks on the opponent and never fades; it pays to jinx the opponent's shown move. Omens (omenAtk,
// omenGuard) fire when the opponent's move matches. Curse sits on you: +6% skill damage and +4% damage taken a stack.
sk('evil_eye', 'Evil Eye', ['jinx'], 'E', 1, { dmg: 6, misf: 2 }, [['stare_down', 'Stare Down', { dmg: 6, misf: 3 }], ['glare', 'Glare', { dmg: 9, misf: 1 }]]);
sk('ill_omen', 'Ill Omen', ['jinx'], 'E', 2, { omenAtk: 12 }, [['dire_omen', 'Dire Omen', { omenAtk: 18 }], ['twin_omens', 'Twin Omens', { omenAtk: 12, omenGuard: 1 }]]);
sk('knock_wood', 'Knock on Wood', ['jinx'], 'E', 2, { block: 6, jinxDisc: 2 }, [['touch_wood', 'Touch Wood', { block: 10, jinxDisc: 2 }], ['ward_off', 'Ward Off', { block: 6, jinxDisc: 2, uncurse: 1 }]], { quick: true });
sk('pass_curse', 'Pass the Curse', ['jinx'], 'D', 3, { passCurse: 2 }, [['crossed_path', 'Crossed Path', { passCurse: 2, curseDmg: 3 }], ['keep_little', 'Keep a Little', { passCurse: 2, curseKeep: 2 }]]);
sk('thirteenth', 'Thirteenth Hour', ['jinx'], 'C', 4, { perMisf: 3, perCurse: 3 }, [['witching_hour', 'Witching Hour', { perMisf: 4, perCurse: 4 }], ['last_hour', 'Last Hour', { perMisf: 3, perCurse: 3, killReset: 1 }]]);
sk('cursed_coin', 'Cursed Coin', ['jinx', 'venom'], 'B', 4, { weaken: 2, misf: 5, coinStun: 1 }, [['bad_penny', 'Bad Penny', { weaken: 2, misf: 5, coinStun: 1, misfT: 2 }], ['heads_win', 'Heads I Win', { weaken: 3, misf: 5, coinStun: 1 }]]);
sk('calamity', 'Calamity', ['jinx'], 'A', 5, { dmg: 10, calamity: 4 }, [['catastrophe', 'Catastrophe', { dmg: 10, calamity: 5 }], ['aftermath', 'Aftermath', { dmg: 10, calamity: 4, keepHalf: 1 }]]);
sk('bad_wick', 'Bad Wick', ['jinx', 'pyre'], 'D', 2, { burn: 4, misfPerBurn: 3 }, [['wax_and_ash', 'Wax and Ash', { burn: 4, misfPerBurn: 2 }], ['ember_omen', 'Ember Omen', { burn: 4, misfPerBurn: 3, omenAtk: 8 }]]);
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
});
