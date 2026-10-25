// [World Pending Deletion] player-facing update notes, newest first.
// Shown once after an update (meta.notesSeen) and from "What's new" on the title screen.
// Each page must fit one 360×640 screen: a System line and up to 4 short lines.
// Wording comes from release/patch-notes-draft.md in the project files; copy it as is.
const PATCH_NOTES = [
  {
    id: '2026-10-25', title: "[System Notice: Tournament Update]", pages: [
      { h: "World Record", sys: "[Your world has been filed for review.]", items: [
        "[Each run, 10 places, people and customs from your world are now kept on record.]",
        "[Lost Hearts erase entries. Your home is erased last. As a courtesy.]",
        "[The Sanctum restores lost entries, in part. Extra Hearts add new ones.]",
        "[Tap your Hearts to view your world's record while it lasts.]"] },
      { h: "Pending World", sys: "[One world. Every Entrant. Once a day.]", items: [
        "[A daily world is now on offer from the title screen. All Entrants receive the same one.]",
        "[Echo unlocks are suspended there. Fairness has been mandated.]",
        "[Only your first attempt is ranked. Results are posted for all to compare.]",
        "[A new world is selected daily at 14:30 UTC. The previous one is archived.]"] },
      { h: "Entrant Rank", sys: "[Entrants will now be ranked. Try to look surprised.]", items: [
        "[Every run earns Rank Points. Reach a threshold and a Proctor will test you.]",
        "[Pass the Rank Trial to be promoted. Choose 1 of 2 permanent perks.]",
        "[Higher ranks are offered harder worlds. Rank is never revoked.]",
        "[Existing Entrants have been assessed from their Halls. Ranks assigned.]"] },
      { h: "Classes and opponents", sys: "[Archetype review complete. Some of you were underperforming.]", items: [
        "[Stormcaller now breaks Block. Arcanist cuts cooldowns. Reaper finishes the weak.]",
        "[Venom heals less from Poison. Runs now start with your class and its 2 allies.]",
        "[All opponents now display a rank letter. Rivals arrive in rank order.]",
        "[Qualifiers escalate more evenly. Final Champions have been recalibrated.]"] },
      { h: "Corrections", sys: "[Minor faults corrected. The System regrets nothing.]", items: [
        "[Unaffordable choices now state why. Notices no longer obstruct the enemy.]",
        "[The Infirmary is closed to Entrants at full HP. It was a waste of everyone's time.]",
        "[Event chain rewards are now withheld until you choose. Spoilers are discouraged.]",
        "[New weapons issued. Duplicate names corrected. Previous names: ERROR. Record sealed.]"] },
      { h: "Seasons and champions", sys: "[Seasons have begun. Glory now expires weekly.]", items: [
        "[Each week, daily top-10 finishes earn points. Every posted score earns 1.]",
        "[Last week's leader is named Prime Entrant. It will be announced. Once.]",
        "[Filed champions now carry their Entrant's rank. It is shown on their crest.]",
        "[Champions that defeat other Entrants climb in rank. Their owners are notified.]"] },
    ],
  },
];
