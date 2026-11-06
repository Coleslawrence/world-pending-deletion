// ===== [World Pending Deletion] — content: level perks =====
'use strict';
// After every battle the System offers a level (+1 level, +1 stat point). The player can skip it for one perk from
// this list, drawn at random and shown before they choose. Each perk is a one-off lump, sized like a day choice in
// Oaken Tower (Healing Touch: +85% max HP and +10 gold): worth about as much as the level it replaces, in another shape.
//   then: outcomes (outcomes.js), applied when the perk is taken
//   main: n      n stat points in your main archetype's stat (worked out when taken)
//   patron: n    n Favour with your patron (worked out when taken)
//   say:         the words shown, when the outcomes' own words are too vague
//   when(run, x): only offered while this is true (x.maxHp: your max HP now), so a perk never shows when it would do nothing
const LEVEL_PERKS = {
  severance: { name: 'Severance Pay', then: { gold: 12 }, flavour: '[Your unused training budget, refunded in cash.]' },
  field_medic: { name: 'Field Medic', then: { heal: 0.85, gold: 6 }, when: (run, x) => run.hp < x.maxHp * 0.7, flavour: '[A medic is assigned to you for one evening. Please do not ask their name.]' },
  requisition: { name: 'Requisition', then: { piece: 'B' }, flavour: '[Form 7-B approved. One item, issued from stores.]' },
  priority: { name: 'Priority Requisition', then: { piece: 'A' }, when: run => run.round >= 4, flavour: '[Form 7-A approved. Someone senior signed it without reading.]' },
  allotment: { name: 'Rune Allotment', then: { rune: 2 }, flavour: '[Two runes released from the archive. Sign here. And here.]' },
  crash_course: { name: 'Crash Course', main: 2, flavour: '[Accelerated training. Side effects are not tracked.]' },
  spare_heart: { name: 'Spare Parts', then: { restore: 2 }, when: run => run.hearts <= run.maxHearts - 2, flavour: '[Recovered fragments of your world, returned to stock.]' },
  overbooked: { name: 'Overbooked', then: { heart: 1 }, when: run => run.round >= 3, flavour: '[Clerical error: your world was filed twice. The System will not correct it.]' },
  waiver: { name: 'Claim Waiver', then: { ward: 1 }, flavour: '[Your next defeat will be processed as a scheduling conflict.]' },
  clerical: { name: 'Misfiled', then: { notice: -2 }, say: "The System's notice on you drops by 2 steps.", when: run => (run.notice || 0) >= 2 && !run.noticeOff, flavour: '[Your file has been moved to the wrong drawer.]' },
  test_subject: { name: 'Test Subject', then: { experimental: 1 }, flavour: '[Volunteer recorded. Your consent was assumed.]' },
  patrons_ear: { name: "Patron's Ear", patron: 3, when: run => GODS[run.patron], flavour: '[Your sponsor has been informed that you waived a level in their honour.]' },
  scouting: { name: 'Scouting Report', then: { foe: { weaken: 3, hp: -0.15 } }, say: 'Your next opponent starts with Weaken 3 and 15% less HP.', flavour: '[Your next opponent has been leaked. The System calls it an accident.]' },
  stipend: { name: 'Stipend', then: { gold: 6, rune: 1 }, flavour: '[A small allowance, and something from the lost and found.]' },
  bounty: { name: 'Open Bounty', then: { stakes: { win: { gold: 18 } } }, say: 'Win your next fight for 18 extra gold.', flavour: '[A price has been put on your next opponent. Collect it.]' },
};
