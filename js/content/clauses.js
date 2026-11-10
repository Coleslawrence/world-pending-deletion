// ===== [World Pending Deletion] — content: Entry Clauses =====
'use strict';
// The paperwork an Entrant enters the Tournament under, chosen before a world on the world screen. Each Clause gives
// something and takes something, so none is simply better than Standard Entry. Each opens the first time its feat is done
// (core.js checks them: feat), and sparing a world under one earns that Clause's Mark. Pending World and practice runs
// always use Standard Entry.
//   opens: the feat, as players read it. give / take: what it does, as players read it.
//   gold, draftCut, gearPlus, skillTax, level, heartCut, freeWager, wagerLoss, patronFavour, otherFavour, income,
//   districtCut, statPts, noGear: the numbers core.js reads (clauseOf).
const CLAUSES = {
  standard: { name: 'Standard Entry', opens: 'Always open.', give: 'Nothing.', take: 'Nothing.', flavour: '[Form 1. Sign here. And here.]' },
  pauper: { name: "Pauper's Clause", opens: 'End a run holding 30 or more gold.', give: 'Start with 12 extra gold.', take: 'Your opening draft offers 5 skills, not 6.', gold: 12, draftCut: 1, flavour: '[Means test passed. Barely.]' },
  collector: { name: "Collector's Clause", opens: 'Hold gear in all three slots at ★2 or more.', give: 'Your opening gear pick offers one more piece.', take: 'Skills cost 2 more gold in shops.', gearPlus: 1, skillTax: 2, flavour: '[Inventory declared in full. All of it.]' },
  veteran: { name: "Veteran's Clause", opens: 'Spare 5 worlds.', give: 'Start at level 2.', take: 'Start with one fewer Heart.', level: 2, heartCut: 1, flavour: '[Returning Entrant. The System remembers your file.]' },
  gambler: { name: "Gambler's Clause", opens: 'Win 3 wagers in one run.', give: 'Wagers cost nothing to place.', take: 'A lost wager costs 3 gold.', freeWager: 1, wagerLoss: 3, flavour: '[Credit extended. Terms apply.]' },
  patron: { name: "Patron's Clause", opens: 'Reach 8 Favour with one god in a run.', give: 'Start with 4 Favour with your Patron, not 2.', take: 'Favour from other gods is halved.', patronFavour: 2, otherFavour: 0.5, flavour: '[Sponsored. Other gods have been notified.]' },
  hermit: { name: "Hermit's Clause", opens: 'Spare a world without visiting the Infirmary.', give: '+2 income each round.', take: 'One fewer district to choose from.', income: 2, districtCut: 1, flavour: '[Entrant requests no visitors.]' },
  barehands: { name: 'Bare Hands Clause', opens: 'Win a fight with no gear equipped.', give: '2 extra stat points to place at the start.', take: 'No opening gear.', statPts: 2, noGear: 1, flavour: '[Equipment: declined. Liability: yours.]' },
};
