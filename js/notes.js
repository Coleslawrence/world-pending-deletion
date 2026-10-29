// [World Pending Deletion] player-facing update notes, newest first.
// Shown once after an update (meta.notesSeen) and from "What's new" on the title screen.
// Each page must fit one 360×640 screen: a System line and up to 4 short lines.
// Wording comes from release/patch-notes-draft.md in the project files; copy it as is.
const PATCH_NOTES = [
  {
    id: '2026-10-29b', title: "[System Notice: Intake Update]", pages: [
      { h: "Opponents", sys: "[Opponents have been reviewed. Several were found to be coasting.]", items: [
        "[Final Champions now have a second phase. Watch the System when they falter.]",
        "[The scout report warns you when an opponent has a second phase. Not what it is.]",
        "[Seraphine, Calder and Grukk have trained. The Masked Entrant copies less well.]",
        "[The Leviathan Queen and the Forge King no longer take all evening.]"] },
      { h: "Corrections", sys: "[A Hidden Path was found not doing its job. It has been spoken to.]", items: [
        "[Butcher now heals you from Bleed, as its description always claimed.]"] },
      { h: "New arrivals", sys: "[New items have been admitted to the tournament. Most passed inspection.]", items: [
        "[A Large Chest has been sighted in the Undercity. Its contents are unverified.]",
        "[A System clerk is issuing experimental equipment. Testing is mandatory.]",
        "[Miser's Ring: hoarding is now a combat strategy. The System does not approve.]",
        "[New Title: Rank Is Just a Letter. The System disagrees.]"] },
    ],
  },
  {
    id: '2026-10-29', title: "[System Notice: Compliance Update]", pages: [
      { h: "Audit", sys: "[Irregularities at the Awakening have been closed. The System noticed.]", items: [
        "[The System chooses once per world. Asking again gets the same answer.]",
        "[The stat roll is fixed per world. Leaving and returning changes nothing.]",
        "[Your own screen now shows the name others see. Accounts stay private.]"] },
      { h: "Balance", sys: "[The tournament found you comfortable. That has been corrected.]", items: [
        "[Opponents from round 5 on hit harder each round. The final hits hardest.]",
        "[Blight still doubles a Leech's drain. Only the usual amount heals you now.]",
        "[Thousand Needles raises Poison by half, not double. Venom was enjoying itself.]",
        "[The Elite bracket is unchanged. The Undefeated did not ask for help.]"] },
      { h: "Notices", sys: "[System notices have been asked to form a queue. They complied.]", items: [
        "[Messages now wait their turn. Each stays long enough to read.]",
        "[Tap a message to dismiss it. The next one steps forward.]",
        "[Missed one? Log, top right, keeps every message this run.]"] },
      { h: "Complaints", sys: "[A complaints desk has opened. The System reads every one.]", items: [
        "[Report a bug or idea from the Menu, or from the title screen.]",
        "[Reports carry your screen and your run. Never your name.]",
        "[Signed out? The report waits on your device until you sign in.]"] },
    ],
  },
  {
    id: '2026-10-28', title: "[System Notice: Display Update]", pages: [
      { h: "Display", sys: "[Display faults corrected. Small screens are no longer an excuse.]", items: [
        "[Screens that do not fit now scroll. Nothing is cut off, and Fight stays in reach.]",
        "[Long names no longer push the arena off the side of your screen.]",
        "[Phones set to larger text are now accommodated. The System can read too.]",
        "[On a computer, the arena spreads to two columns and grows with the window.]"] },
    ],
  },
  {
    id: '2026-10-27', title: "[System Notice: Procedural Update]", pages: [
      { h: "Corrections", sys: "[Display faults corrected. The System apologises to no one.]", items: [
        "[The System no longer hides its header behind your notch.]",
        "[Fight speed is now on the fight screen. The System will remember your impatience.]",
        "[The game now opens from storage at once. Updates install in the background.]",
        "[Only choices you can take are offered. Consequences are disclosed afterwards.]"] },
      { h: "Attribute dialogue", sys: "[Your build has opinions now. The System has agreed to listen.]", items: [
        "[High stats open new options in events, marked with the stat. They always work.]",
        "[Gods with 4 Favour may speak through you. Results are disclosed afterwards.]",
        "[Luck occasionally finds a way. The System does not explain Luck.]",
        "[Named rivals may now be answered before your first move. Optional.]"] },
      { h: "Procedure", sys: "[The tournament has been streamlined. Delays were not authorised.]", items: [
        "[Districts now come before the shop. The shop's exit is the arena.]",
        "[Tap an opponent to face them. The System assumes you meant it.]",
        "[Lost entries are erased together, one after another. Watch.]",
        "[Victories no longer require a meeting. Your reward is noted on the way.]"] },
      { h: "Awakening and shop", sys: "[Indecision has been monetised.]", items: [
        "[Let the System choose your Gifts. It pays 2 points for your trust.]",
        "[Overrule the System and the points are withdrawn. It keeps records.]",
        "[Stats may be rolled once: 6 points, placed at random. No re-rolls.]",
        "[Copies of what you own can be bought in one tap. The System trusts you there.]"] },
      { h: "Access", sys: "[Entrant records have been tidied. Some doors are now staffed.]", items: [
        "[Other Entrants now see a name you choose. Never your account name.]",
        "[Shared boards are for approved Entrants. Others will be asked to wait.]",
        "[Districts answer to your stats too. VIT, AGI and INT improve three of them.]",
        "[An overfilled bench must be cleared before the arena. The System stores no clutter.]"] },
    ],
  },
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
