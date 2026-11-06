// [World Pending Deletion] player-facing update notes, newest first.
// Shown once after an update (meta.notesSeen) and from "What's new" on the title screen.
// Each page must fit one 360×640 screen: a System line and up to 4 short lines.
// Wording comes from release/patch-notes-draft.md in the project files; copy it as is.
// The newest entry's release must match VERSION in sw.js; the title screen shows it.
const PATCH_NOTES = [
  {
    id: '2026-11-06', release: 'wpd-v15', title: "[System Notice: Requests Update]", pages: [
      { h: "Requests", sys: "[Destinations may now be requested. The System will consider it, for a fee.]", items: [
        "[Pay 5 Echoes at the world choice to request a Fate or a People. It will be offered.]",
        "[Requested worlds are tagged as such. You may ask again. The fee does not change.]",
        "[Pending World does not take requests.]"] },
      { h: "Corrections", sys: "[A filing error has been corrected. The System regrets nothing.]", items: [
        "[An empty new device can no longer overwrite your cloud save. Progress stays put.]"] }
    ] },
  {
    id: '2026-11-05', release: 'wpd-v14', title: "[System Notice: Luck Update]", pages: [
      { h: "House Rules", sys: "[Two new classes have registered under Luck. The System disapproves of both.]", items: [
        "[The Gambler rolls a die each turn. Skills scale with the pip. Rerolls are legal.]",
        "[A six is a jackpot. The House pays it. The House is not pleased about it.]",
        "[Beat Delphine, win three chances, or pay 20 Echoes to unlock the Gambler.]",
        "[New: the Marches, the House, the Dealer. Gifts and Titles for the lucky.]"] },
      { h: "Ill Omens", sys: "[A second Luck class arrived uninvited. It brought a cat.]", items: [
        "[The Jinx spends Misfortune to jinx the move you see coming. Results vary. Badly.]",
        "[Omens wait for a move to punish. Curse makes you hit harder. And them. Choose.]",
        "[Beat Mott, win after three misses, or pay 20 Echoes to unlock the Jinx.]",
        "[New: the Crooked Fens, the Crow, the Hanged Augur. Do not cross the cat.]"] },
      { h: "Paths", sys: "[Commitment has been noticed. It will now be rewarded twice.]", items: [
        "[At 6 pieces of one class, choose what its Path becomes. The choice holds.]",
        "[Classes are now filed by stat and Discipline. Allies share one or the other.]",
        "[Six new ally pieces have arrived for the Gambler and the Jinx.]"] },
      { h: "Kit", sys: "[Your kit has been reviewed. Additions have been approved.]", items: [
        "[After the skill draft, you now pick one piece of opening gear.]",
        "[Gear grants stat points by rank and a new line at ★3. B and A pieces exist.]",
        "[Read skills hit harder when they answer the move your opponent is showing.]",
        "[Every skill now has a third evolution. Indecision has been made harder.]"] },
      { h: "Procedure", sys: "[The Awakening has been reordered. Paperwork first.]", items: [
        "[The Awakening asks for your Patron first. Your Gift Points depend on it.]",
        "[Skills, then gear, then stats. You place points once you know what they power.]"] },
      { h: "Receipts", sys: "[The System now keeps receipts. You are welcome.]", items: [
        "[Every item an event gives now says how you got it. Tap it to inspect.]",
        "[Notices now state their cause. Important ones wait until you dismiss them.]",
        "[Every fight now ends in a summary. Each notification is then presented in turn.]",
        "[Settings > Fast wins restores the old haste, for ordinary wins only.]"] },
      { h: "Field Tests", sys: "[Experimental equipment is now in circulation. Liability is not.]", items: [
        "[Field Test now issues prototypes. Their mechanics are not yet approved.]",
        "[Delay Engine, Mirror Cuirass, Echo Chamber, Countdown Collar, Pain Link.]",
        "[An Unsigned Patch removes one rule. Its publisher is unknown. Install anyway.]"] },
      { h: "Corrections", sys: "[Minor faults have been corrected. The System admits nothing.]", items: [
        "[Short screens no longer hide the Attack button. Long traits stay on their cards.]",
        "[Crises now air with a clearer signal. Wire gold home, act yourself, or take.]"] },
    ],
  },
  {
    id: '2026-11-04', release: 'wpd-v13', title: "[System Notice: Broadcast Update]", pages: [
      { h: "On Air", sys: "[The tournament is now broadcast in full. Every screen. All the time.]", items: [
        "[The interface has been redesigned for viewers. Entrants were not consulted.]",
        "[The previous look remains under Settings, Look, Classic. For archival purposes.]",
        "[Your status now fits in one strip. Tap yourself for details. The System already has.]",
        "[Hints no longer obstruct your choices. They wait their turn.]"] },
      { h: "Pairing", sys: "[There are more worlds than finals. Worlds will now be judged in pairs.]", items: [
        "[Your world is paired with another at the start. Its finalist meets you in round 8.]",
        "[Finalists carry their world's Final Champion. Its power, not its manners.]",
        "[Win, and the other world is erased in this tournament. Outcomes vary.]",
        "[Your own finalist is filed. It will defend your world in other finals.]"] },
      { h: "Unscheduled Content", sys: "[Some content is not behaving as filed. It remains available.]", items: [
        "[Glitched prefixes may appear on runes and at the Enchanter. They break one rule each.]",
        "[The Enchanter now offers Corrupt. Two results are rolled. You keep one. Neither is safe.]",
        "[Some gear has been spliced. Some gear is MissingNo. Neither was ordered.]",
        "[Some skills are unstable. Err̷or and Stack Overfl̷ow should not exist. They do.]"] },
      { h: "Bug Bounty", sys: "[Using glitched content draws the System's notice. Reporting it does not.]", items: [
        "[Glitched events now occur in the Undercity. Please report them. Or don't.]",
        "[Some opponents carry glitched traits. Their records are being reviewed.]",
        "[Every Friday is Glitch Day. Pending World loads from a Corrupted Save.]",
        "[The Archive now keeps a Known Issues log. First reports earn a Bug Bounty.]"] },
      { h: "Broadcast", sys: "[Certain moments are now broadcast. Volume cannot be adjusted.]", items: [
        "[Gatekeepers and Finals now open live. Tap to skip the introductions.]",
        "[Fate Crises are now aired as they happen. Speak clearly.]",
        "[Erased and spared worlds are announced at full volume. As is tradition.]"] },
      { h: "Integrity", sys: "[The interface now takes damage. It was not consulted.]", items: [
        "[Below half health, the screen tears. Heal, and it mends. Mostly.]",
        "[A blow that would tear it is outlined first. Consider that a courtesy.]",
        "[Each world you lose is cut from the title screen. Look at them.]",
        "[Settings > Motion: Reduced keeps the interface intact. Cowardly, but permitted.]"] },
      { h: "Known Issues", sys: "[The System is operating normally. Please disregard the following.]", items: [
        "[Long winning streaks may cause the interface to flicker. This is your fault.]",
        "[The System's own events may display corrections. The corrections are correct.]",
        "[Any option you did not expect was inserted by mistake. You may still pick it.]",
        "[Early rounds now hit harder and later rounds softer. The curve was smoothed.]"] },
      { h: "Politics", sys: "[Divine and civil affairs have been adjusted. Nobody was consulted.]", items: [
        "[Silent worlds are now silent. No wagers. Favour is held until the Fate is lifted.]",
        "[Zealots now answer to War. Ruin did not object. Ruin rarely objects.]",
        "[Some worlds have two governments. Both will ask for your name on air.]",
        "[Champions and rivals now speak. Their statements are entered into the record.]"] },
      { h: "Clarifications", sys: "[Several statements have been corrected. The originals were also correct.]", items: [
        "[Modifiers renamed: Standard Rules and Rich Tithes. The weather was never involved.]",
        "[Crises now air live. What you say on air happens to the Hearts you carry.]",
        "[Erased records are erased in this tournament only. Outcomes vary.]",
        "[Rank letters carry no official meaning. The System will keep assigning them.]"] },
      { h: "Conveniences", sys: "[The System has added comforts. Do not get used to them.]", items: [
        "[Event results now stay on screen until you have read them. All of them.]",
        "[Fights now make noise, and a Break looks like it hurts. It does.]",
        "[Settings now exist: sound, vibration, shake, motion and text size.]",
        "[Keyboards are now recognised. Number keys pick, Enter confirms, Esc retreats.]"] },
      { h: "Legibility", sys: "[Complaints about readability have been processed. Reluctantly.]", items: [
        "[Archetypes now have shapes. Colour was apparently not enough.]",
        "[Long names no longer get cut. The System had hoped you would shorten them.]",
        "[System notices now wait at the bottom of the screen, out of your way.]",
        "[Being Noticed now explains itself. Tap it, if you must know.]"] },
    ],
  },
  {
    id: '2026-11-02', release: 'wpd-v12', title: "[System Notice: Customs Update]", pages: [
      { h: "Fates", sys: "[Your world's trouble is now your problem. It was always your problem.]", items: [
        "[In rounds 3 and 5, your world's Fate demands an answer. Answer it, or use it.]",
        "[Answer twice and the Fate is lifted. Use it twice and it is sealed.]",
        "[Lifted worlds get something back. Sealed worlds are remembered too.]",
        "[New Title: Fatebreaker. The System did not expect to need it.]"] },
      { h: "Peoples", sys: "[Every world has its customs. They now apply to you.]", items: [
        "[Each People changes one rule between rounds. Read the world card.]",
        "[The Clans never forget who beat you. Neither does the bracket.]",
        "[Help your people and they will give you a name. You may keep it.]",
        "[Some Undercity choices now depend on where you are from.]"] },
      { h: "Corrections", sys: "[Minor faults have been corrected. The System admits nothing.]", items: [
        "[Every skill, item, Gift and Title now has a history. Read the italics.]",
        "[The tutorial no longer abandons you for skipping ahead. It sulks instead.]",
        "[Stun a Weakened opponent and they are Broken. Same as a full break bar.]",
        "[Zeros now look like zeros. The System regrets the confusion.]"] },
    ],
  },
  {
    id: '2026-11-01', release: 'wpd-v11', title: "[System Notice: Judgement Update]", pages: [
      { h: "Living worlds", sys: "[Worlds are no longer issued from a template. Each one is now a little different.]", items: [
        "[Every world has a people and a fate. Neither was the System's idea.]",
        "[Each kind of world now fields its own four classes. Some worlds field two kinds.]",
        "[Your world will now send word between rounds. It cannot help it.]",
        "[Worlds you fought for recently will not be offered again so soon.]"] },
      { h: "Judgement by record", sys: "[There are more worlds than time. Worlds will now be judged by record.]", items: [
        "[Each round, the harder opponent is another Entrant's record from that round.]",
        "[Beat a record: take a fragment of its world. Lose: it takes a piece of yours.]",
        "[Records survive three defeats. After that, their world is no longer pending.]",
        "[Your records fight on without you. Even after your world is gone.]"] },
      { h: "Undercity", sys: "[The Undercity has been reorganised. Every choice now costs something real.]", items: [
        "[Some actions now show their odds. The odds are honest. Mostly.]",
        "[A failed attempt is still an attempt. Something happens either way.]",
        "[Events no longer repeat within a run. The tunnels have more to say.]"] },
      { h: "System events", sys: "[The System now runs ten events of its own. Do not ask why.]", items: [
        "[Shady choices draw the System's notice. Compliance draws it away.]",
        "[Records may be duplicated, audited, amended or rolled back. This is normal.]",
        "[Locker 0 is not yours. Please stop opening it.]"] },
      { h: "Records", sys: "[The System now notes which version of reality each run was played in.]", items: [
        "[For accuracy. Not for blame.]"] },
    ],
  },
  {
    id: '2026-10-31', release: 'wpd-v10', title: "[System Notice: Recalibration Update]", pages: [
      { h: "Stats", sys: "[Experience is retired. Gold buys strength now.]", items: [
        "[Stat points are bought with gold, one at a time. Each costs more than the last.]",
        "[Every two points is a level.]",
        "[Fast Learner: stat points cost a third less. Late Bloomer: each level is a free point.]",
        "[Income is now 5 gold, plus 1 for every 4 you hold, up to 5. Thrift is rewarded.]"] },
      { h: "Faces", sys: "[Every stat now has three faces. Power, as before.]", items: [
        "[Finesse: STR breaks guards faster, INT shortens long cooldowns.]",
        "[Finesse: VIT strengthens the healing you receive.]",
        "[Resistance: each stat shrugs off one affliction. Weaken, Bleed, Burn, Poison or Stun.]"] },
      { h: "Guard", sys: "[Every opponent now has a guard. The System recommends removing it.]", items: [
        "[Strike past their Block and the guard cracks. Hit hard and it cracks faster.]",
        "[Break it and they are Broken: a lost turn, and half again the damage taken.]"] },
      { h: "Recalibration", sys: "[Entrants were enjoying themselves. The System has adjusted the arena.]", items: [
        "[The arena has been recalibrated. Each opponent now hits harder than the last.]",
        "[Losses cost more Hearts as the run goes on. The System sees no reason to be gentle.]",
        "[Gatekeepers guard rounds 4 and 7. Defeat one and the System grants a stat point.]",
        "[Each straight win makes opponents stronger. Lose a Heart and the System looks away.]"] },
      { h: "Thunder Steppes", sys: "[A seventh world joins the tournament. The storm there never breaks.]", items: [
        "[The Thunder Steppes are open. Stormcallers will feel at home.]",
        "[Its Final Champion, the Storm Herald, gathers a storm before it strikes.]",
        "[Break it first.]"] },
      { h: "Corrections", sys: "[Several records have been corrected. The System admits nothing.]", items: [
        "[Thorns doubles below half HP. Bastion, Forgebreaker and Spiked now admit it.]",
        "[Hedge Witch now feeds on Bleed: +1 to Bleed you apply, heal 1 each time.]",
        "[Zealots are no longer asked to win without healing. The System saw the problem.]",
        "[Stormcallers and Reapers were found underperforming. Strength now grants more HP.]"] },
    ],
  },
  {
    id: '2026-10-29c', title: "[System Notice: Opposition Update]", pages: [
      { h: "Opposition", sys: "[Entrants were winning comfortably. Comfort has been withdrawn.]", items: [
        "[Opponents now carry traits. Read them before you choose who to fight.]",
        "[Every opponent has one move that hurts. It is announced. Answer it.]",
        "[Qualifiers stay gentle. The bracket does not.]"] },
    ],
  },
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
