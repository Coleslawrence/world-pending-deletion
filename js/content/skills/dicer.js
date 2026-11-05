// ===== [World Pending Deletion] — content: skills: Gambler =====
'use strict';
// Dice: a skill with die: 1 rolls a die (1 to 6) at the start of your turn, and the roll is printed on its button before
// you pick. Per-pip numbers (dmgPip, blockPip, healPip) are multiplied by the roll. dmgAll counts every die you show.
sk('coin_toss', 'Coin Toss', ['dicer'], 'E', 1, { die: 1, dmg: 4, dmgPip: 2 }, [['double_nothing', 'Double or Nothing', { die: 1, dmg: 4, dmgPip: 2, dbl: 4 }], ['two_headed', 'Two-Headed Coin', { die: 1, dmg: 4, dmgPip: 2, dieMin: 4 }], ['lucky_coin', 'Lucky Coin', { die: 1, dmg: 4, dmgPip: 2, healPip: 1 }]]);
sk('hedge', 'Hedge Your Bet', ['dicer'], 'E', 2, { die: 1, blockPip: 3 }, [['insurance', 'Insurance', { die: 1, blockPip: 3, healPip: 1 }], ['side_bet', 'Side Bet', { die: 1, blockPip: 2, dmgPip: 2 }], ['hedged_bet', 'Hedged Bet', { die: 1, blockPip: 3, dieMin: 3 }]]);
sk('loaded_die', 'Loaded Die', ['dicer', 'arcanist'], 'E', 2, { reroll: 1, focus: 0.2 }, [['sleight_hand', 'Sleight of Hand', { reroll: 1, focus: 0.2, evade: 1 }], ['weighted_die', 'Weighted Die', { setSix: 1, focus: 0.2 }, 3], ['palmed_die', 'Palmed Die', { reroll: 1, focus: 0.2, nextCrit: 1 }]], { quick: true });
sk('double_down', 'Double Down', ['dicer'], 'D', 3, { die: 1, dmgPip: 6, bust: 6 }, [['all_in', 'All In', { die: 1, dmgPip: 8, bust: 8, bustAt: 2 }], ['safe_bet', 'Safe Bet', { die: 1, dmgPip: 5 }], ['press_your_luck', 'Press Your Luck', { die: 1, dmgPip: 6, bust: 6, lifesteal: 0.3 }]]);
sk('snake_eyes', 'Snake Eyes', ['dicer'], 'C', 3, { die: 1, dmg: 8, snake: 45 }, [['boxcars', 'Boxcars', { die: 1, dmg: 8, snake: 45, boxcars: 1 }], ['long_odds', 'Long Odds', { die: 1, dmg: 8, snake: 60 }], ['snake_bite', 'Snake Bite', { die: 1, dmg: 8, snake: 45, poison: 3 }]]);
sk('house_edge', 'House Edge', ['dicer'], 'B', 4, { mark: 3, rollTwice: 3 }, [['stacked_deck', 'Stacked Deck', { mark: 3, rollTwice: 4 }], ['marked_cards', 'Marked Cards', { mark: 3, rollTwice: 3, weaken: 2 }], ['house_rules', 'House Rules', { mark: 3, rollTwice: 3, block: 10 }]]);
sk('jackpot', 'Jackpot', ['dicer'], 'A', 5, { dmgAll: 3 }, [['progressive', 'Progressive Jackpot', { dmgAll: 3, progressive: 1 }], ['cash_out', 'Cash Out', { dmgAll: 3, cashOut: 0.5 }], ['split_the_pot', 'Split the Pot', { dmgAll: 2, heal: 10 }]]);
sk('thunder_dice', 'Thunder Dice', ['dicer', 'storm'], 'D', 3, { die: 1, dmg: 4, dmgPip: 2, dieStun: 6 }, [['rolling_thunder', 'Rolling Thunder', { die: 1, dmg: 4, dmgPip: 2, dieStun: 5 }], ['storm_front', 'Storm Front', { die: 1, dmg: 4, dmgPip: 2, weaken: 1, dieStun: 6 }], ['thunderhead', 'Thunderhead', { die: 1, dmg: 4, dmgPip: 2, dieStun: 6, brk: 6 }]]);
sk('crooked_odds', 'Crooked Odds', ['dicer', 'jinx'], 'E', 2, { reroll: 1, misf: 2 }, [['sore_loser', 'Sore Loser', { reroll: 1, misf: 2, jinxDisc: 2 }], ['loaded_luck', 'Loaded Luck', { reroll: 1, block: 6 }], ['fixed_game', 'Fixed Game', { reroll: 1, misf: 2, focus: 0.2 }]], { quick: true });
sk('call_the_bluff', 'Call the Bluff', ['dicer'], 'D', 2, { die: 1, dmgPip: 3, read: 'attack', readFx: { readMult: 2 } }, [['raise_the_stakes', 'Raise the Stakes', { die: 1, dmgPip: 3, read: 'attack', readFx: { readMult: 2, weaken: 1 } }], ['fold', 'Fold', { die: 1, blockPip: 3, dmgPip: 2, read: 'attack', readFx: { readMult: 2 } }], ['poker_face', 'Poker Face', { die: 1, dmgPip: 3, read: 'attack', readFx: { readMult: 2, evade: 1 } }]]);
flav({
  thunder_dice: "Two bones carved from a tree the lightning picked twice.",
  rolling_thunder: "The odds are bad. The storm doesn't read them.",
  storm_front: "Not every roll lands the bolt. Every roll brings the weather.",
  crooked_odds: "[Dice re-thrown. Result filed against the opponent.]",
  sore_loser: "Lose the roll, win the argument.",
  loaded_luck: "Bad luck happens to other people. You make sure of it.",
  coin_toss: "Heads, it hurts. Tails, it also hurts.",
  double_nothing: "The coin spins a long time. Everyone watches it but you.",
  two_headed: "It is not cheating if nobody asks to see the other side.",
  hedge: "You never bet everything. Not on the first hand.",
  insurance: "A small premium, paid in advance, in blood.",
  side_bet: "A second wager on the first one going well.",
  loaded_die: "Weighted on one side. Which side is your business.",
  sleight_hand: "Look at the dice. Not at my hands.",
  weighted_die: "A six. It was always going to be a six.",
  double_down: "Twice the stake. The odds did not change.",
  all_in: "Everything on the table. Including you.",
  safe_bet: "Smaller winnings, and you sleep at night.",
  snake_eyes: "The worst roll at the table. Unless you bet on it.",
  boxcars: "Both ends of the dice pay. The House hates this.",
  long_odds: "Nobody bets on a one. That is why it pays.",
  house_edge: "Every table leans a little. Yours leans your way.",
  stacked_deck: "The cards were in order before you sat down.",
  marked_cards: "A pinprick in the corner. They never notice.",
  jackpot: "Every die you have shown, cashed in at once.",
  progressive: "Each win feeds the pot. The pot is very hungry.",
  cash_out: "Walk away while you are ahead. Walk away healed.",
  call_the_bluff: "[Bluff called. The House enjoys this part.]",
  raise_the_stakes: "You push everything in. They blink first.",
  fold: "Knowing when to fold is also a way to win.",
  lucky_coin: "Heads you win, tails you feel better about it.",
  hedged_bet: "You never bet the whole stack on one roll.",
  palmed_die: "The die you rolled was never the one you held.",
  press_your_luck: "Win big and the winnings patch you up.",
  snake_bite: "Even when the snake misses, its venom does not.",
  house_rules: "The House protects its interests. You are one of them.",
  split_the_pot: "Half for them, half for you, and the House takes a cut.",
  thunderhead: "A rumble in the dice cup. Their guard shakes with it.",
  fixed_game: "The odds were never fair. Now they are in your favour.",
  poker_face: "You let them commit, and they hit nothing.",
});
