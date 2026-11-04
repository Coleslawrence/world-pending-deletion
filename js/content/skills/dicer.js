// ===== [World Pending Deletion] — content: skills: Gambler =====
'use strict';
// Dice: a skill with die: 1 rolls a die (1 to 6) at the start of your turn, and the roll is printed on its button before
// you pick. Per-pip numbers (dmgPip, blockPip, healPip) are multiplied by the roll. dmgAll counts every die you show.
sk('coin_toss', 'Coin Toss', ['dicer'], 'E', 1, { die: 1, dmg: 4, dmgPip: 2 }, [['double_nothing', 'Double or Nothing', { die: 1, dmg: 4, dmgPip: 2, dbl: 4 }], ['two_headed', 'Two-Headed Coin', { die: 1, dmg: 4, dmgPip: 2, dieMin: 4 }]]);
sk('hedge', 'Hedge Your Bet', ['dicer'], 'E', 2, { die: 1, blockPip: 3 }, [['insurance', 'Insurance', { die: 1, blockPip: 3, healPip: 1 }], ['side_bet', 'Side Bet', { die: 1, blockPip: 2, dmgPip: 2 }]]);
sk('loaded_die', 'Loaded Die', ['dicer', 'arcanist'], 'E', 2, { reroll: 1, focus: 0.2 }, [['sleight_hand', 'Sleight of Hand', { reroll: 1, focus: 0.2, evade: 1 }], ['weighted_die', 'Weighted Die', { setSix: 1, focus: 0.2 }, 3]], { quick: true });
sk('double_down', 'Double Down', ['dicer'], 'D', 3, { die: 1, dmgPip: 6, bust: 6 }, [['all_in', 'All In', { die: 1, dmgPip: 8, bust: 8, bustAt: 2 }], ['safe_bet', 'Safe Bet', { die: 1, dmgPip: 5 }]]);
sk('snake_eyes', 'Snake Eyes', ['dicer'], 'C', 3, { die: 1, dmg: 8, snake: 45 }, [['boxcars', 'Boxcars', { die: 1, dmg: 8, snake: 45, boxcars: 1 }], ['long_odds', 'Long Odds', { die: 1, dmg: 8, snake: 60 }]]);
sk('house_edge', 'House Edge', ['dicer'], 'B', 4, { mark: 3, rollTwice: 3 }, [['stacked_deck', 'Stacked Deck', { mark: 3, rollTwice: 4 }], ['marked_cards', 'Marked Cards', { mark: 3, rollTwice: 3, weaken: 2 }]]);
sk('jackpot', 'Jackpot', ['dicer'], 'A', 5, { dmgAll: 3 }, [['progressive', 'Progressive Jackpot', { dmgAll: 3, progressive: 1 }], ['cash_out', 'Cash Out', { dmgAll: 3, cashOut: 0.5 }]]);
flav({
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
});
