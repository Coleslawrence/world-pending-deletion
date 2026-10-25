// [World Pending Deletion] player-facing update notes, newest first.
// Shown once after an update (meta.notesSeen) and from "What's new" on the title screen.
// Each page must fit one 360×640 screen: a System line and up to 4 short bullets.
// Wording comes from /release/patch-notes-draft.md in the project files; copy it as is.
const PATCH_NOTES = [
  {
    id: '2026-10-25', title: 'The Pending Update', pages: [
      { h: 'World Record', sys: '[Your world has been filed for review.]', items: [
        'Each run now keeps a record of 10 places, people and customs from your world.',
        'Losing Hearts erases entries. Your home goes last.',
        'The Sanctum restores lost entries, but only in part. Extra Hearts add new ones.',
        "Tap your Hearts to read your world's record."] },
      { h: 'Pending World', sys: '[One world. Every Entrant. Once a day.]', items: [
        'A new daily run on the title screen. Everyone gets the same world.',
        "Echo unlocks don't apply, so everyone starts on a level field.",
        'Your first attempt is ranked. Tap a leaderboard row to compare records.',
        'A new world arrives every day at 14:30 UTC.'] },
      { h: 'Entrant Rank', sys: '[Entrants will now be ranked. Try to look surprised.]', items: [
        'Every run earns Rank Points. Reach a threshold to face a Proctor in a Rank Trial.',
        'Pass a trial to rank up and pick one of two permanent perks.',
        'Higher ranks unlock tougher worlds. Your rank never drops.',
        'Existing players start with points earned from their Halls.'] },
      { h: 'Classes and opponents', sys: '[Archetype review complete. Some of you were underperforming.]', items: [
        'Stormcaller breaks Block, Arcanist cuts cooldowns, and Reaper finishes weakened foes.',
        'Venom heals less from Poison. Runs start with your class and its two allies.',
        'Every opponent shows a rank letter, and rivals now come in rank order.',
        'Qualifiers ramp up more smoothly, and the Final Champions are more even.'] },
      { h: 'Fixes', sys: '[Minor faults corrected. The System regrets nothing.]', items: [
        "Choices you can't afford now say why. Messages no longer cover the enemy.",
        "The Infirmary can't be picked at full HP.",
        'Event chains keep their rewards hidden until you choose.',
        'New weapons: Spiked Buckler and Blight Kris. Some names changed to avoid clashes.'] },
    ],
  },
];
