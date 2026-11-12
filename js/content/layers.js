// ===== [World Pending Deletion] — content: world layers =====
'use strict';
// A world is its type (worlds/) plus layers rolled on top. The type decides everything mechanical: home class, World
// Gift, Final Champion. Layers decide what the world is like to live in, and each brings its own writing:
//   FATES    what was already going wrong there before the System came. Picks the world's modifier.
//   PEOPLES  who lives there and how they live.
// Each layer may carry, all optional:
//   name, line        its name and one flavour line for the world card (a Fate's line reads after the type's flavour)
//   entries           World Record entries, the same shape as a LORE pool's ({ k, tier, name, text, near?, rel? })
//   roles, promises   extra bio roles ("You were a {role} of ...") and promises ("You promised ... you would {promise}.")
//   stages            (Fates) World Pulse lines for rounds 3 and 5, as the trouble grows (they follow "Velmora: ")
//   crises            (Fates) the Fate Crisis events for rounds 3 and 5 (events/crises.js): answer the trouble or use it
//   crisisIfUsed      (Fates) the round 5 crisis instead, when the round 3 one was used (its Fate worsened)
//   ends              (Fates) { lifted, sealed }: the closing line when the run ends with the Fate lifted or sealed (they follow "Velmora: ")
//   mods              (Fates) modifier weights, e.g. { bloodmoon: 3, none: 1 }; without it the usual weights apply
//   epithets          (Peoples) what the System may call a champion of this people; the first is earned when the custom first pays out
//   custom            (Peoples) { name, text }: the one rule about the between-round loop this People changes (read in core.js, customOf)
//   visit             (Peoples) { at: round, event }: a People's own event that comes to everyone in that round
//   settings          the settings it suits (['fantasy']); a world type has one setting (WORLD_TYPES[t].setting, fantasy
//                     by default). Without a list it suits every setting. Entries may carry settings too; roles and
//                     promises can't, so keep them true to every setting the layer suits.
// Runs and snapshots store layer ids and entry positions, so ids are permanent and every list only grows at the end.
// Records number a world's entries by where they come from (LAYER_BASE in core.js): the type's own 0 to 99,
// the Fate's from 100, the People's from 200, a Confluence type's from 300.
const FATES = {
  // mods: each Fate brings the modifiers that fit it; across all Fates each modifier is about as common as before layers
  longnight: { name: 'The Long Night', line: 'The sun has not risen in eleven years.', crises: ['crisis_longnight_1', 'crisis_longnight_2'], crisisIfUsed: 'crisis_longnight_2u',
    ends: { lifted: 'the sun rose this morning. Nobody knows what to do with it.', sealed: 'the Lamp Ward is dark. Nobody remembers what a sunrise looked like.' }, mods: { none: 6, restless: 6, siege: 2 },
    stages: ['the Long Night enters its twelfth year. Candles are rationed.', 'the last lamp oil has been shared out. The dark holds.'],
    promises: ['bring back the sun', 'see one more dawn'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Lamp Ward', text: 'The only district kept lit all night. Rent is paid in candles.' },
      { k: 'custom', tier: 'far', name: 'The Last Sunrise', text: 'Painted on every ceiling, so nobody forgets what it looked like.' },
      { k: 'person', tier: 'city', name: 'The Dawn Watcher', text: 'Has faced east every morning for eleven years. Still hopeful.' },
    ] },
  plague: { name: 'The Grey Plague', line: 'A grey sickness spreads, and no cure has worked.', crises: ['crisis_plague_1', 'crisis_plague_2'], crisisIfUsed: 'crisis_plague_2u',
    ends: { lifted: 'the Quarantine Wall is coming down. Nobody has been marked in a week.', sealed: 'every door carries the grey mark now. There is no one left to chalk them.' }, mods: { restless: 6, famine: 3, none: 3, strange: 3 },
    stages: ['the Grey Plague has reached the capital.', 'half the doors now carry the grey mark.'],
    promises: ['find a cure', 'outlive the plague'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Quarantine Wall', text: 'Built in a week. Nobody on either side has crossed it since.' },
      { k: 'custom', tier: 'city', name: 'The Grey Mark', text: 'Chalk on the door of a sick house. Most doors have one now.' },
      { k: 'person', tier: 'far', name: 'The Plague Doctor', text: 'Has tried every cure in the old books. Is writing a new book.' },
    ] },
  hunger: { name: 'The Hungry Years', line: 'The harvests have failed four years running.', crises: ['crisis_hunger_1', 'crisis_hunger_2'], crisisIfUsed: 'crisis_hunger_2u',
    ends: { lifted: 'the first harvest in five years came in. The Ration Bell has been retired.', sealed: 'the Empty Granary is a museum now. Admission is one loaf.' }, mods: { famine: 9, none: 3, market: 2 },
    stages: ['the seed stores are open. They were meant to stay shut.', 'bread is now something people say quietly.'],
    promises: ['fill the granaries again', 'bring home bread'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Empty Granary', text: 'Big enough to feed the world for a year. It echoes now.' },
      { k: 'custom', tier: 'city', name: 'The Ration Bell', text: 'Rings once a day. Everyone knows exactly how long until it rings.' },
      { k: 'person', tier: 'city', name: 'The Seed Keeper', text: 'Guards the last sack of good seed. Has not slept well in years.' },
    ] },
  civilwar: { name: 'Civil War', line: 'Two factions claim the same world, and neither will yield.', crises: ['crisis_civilwar_1', 'crisis_civilwar_2'], crisisIfUsed: 'crisis_civilwar_2u',
    ends: { lifted: 'both sides ate together, and nobody went back to war in the morning.', sealed: 'one side won. The other is not mentioned any more.' }, mods: { bloodmoon: 9, none: 3, siege: 3 },
    stages: ['both sides claim your wins as their own.', 'the ceasefire is holding, barely, while you fight.'],
    promises: ['end the war', 'bring both sides to one table'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Divided Bridge', text: 'Half of it belongs to each side. The middle stone belongs to nobody.' },
      { k: 'custom', tier: 'city', name: 'The Ceasefire Feast', text: 'One night a year, both sides eat together. Then the war resumes.' },
      { k: 'person', tier: 'city', name: 'The Turncoat Captain', text: 'Has switched sides three times. Both sides still want them back.' },
    ] },
  silence: { name: 'The Silence', line: 'The gods stopped answering a year before the sky opened.', crises: ['crisis_silence_1', 'crisis_silence_2'], crisisIfUsed: 'crisis_silence_2u',
    ends: { lifted: 'the gods answered. They said they were sorry. Nobody believed them.', sealed: 'the temples are empty. The gods were never coming back.' }, mods: { none: 4, restless: 4, golden: 4, strange: 4 },
    stages: ['still no answer from the gods. The prayers get louder.', 'the temples have started praying to you instead.'],
    promises: ['make the gods answer', 'learn why the gods went quiet'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Unanswered Temple', text: 'Still full every day. Nobody has heard a reply in years.' },
      { k: 'custom', tier: 'far', name: 'The Listening Hour', text: 'At noon the whole world stops talking, in case the gods do.' },
      { k: 'person', tier: 'city', name: 'The Last Oracle', text: 'Hears nothing now. Charges the same price.' },
    ] },
  lastgen: { name: 'The Last Generation', line: 'No child has been born here in ten years.', crises: ['crisis_lastgen_1', 'crisis_lastgen_2'], crisisIfUsed: 'crisis_lastgen_2u',
    ends: { lifted: 'a child was born this morning. The whole world came to see.', sealed: 'the Naming Stone is full. Nobody will add another name.' }, mods: { none: 5, golden: 3, famine: 4, strange: 2 },
    stages: ['the youngest has stopped asking when the others are coming.', 'they have started naming the empty cradles after you.'],
    promises: ['hear a child laugh again', 'make sure someone comes after us'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Silent Nursery', text: 'Kept clean and ready every day, just in case.' },
      { k: 'custom', tier: 'city', name: 'The Naming Stone', text: 'Lists every child ever born here. The last name is ten years old.' },
      { k: 'person', tier: 'city', name: 'The Youngest', text: 'Ten years old, and the whole world knows their name.' },
    ] },
  sundering: { name: 'The Sundering', line: 'The land is cracking apart, a little more each year.', crises: ['crisis_sundering_1', 'crisis_sundering_2'], crisisIfUsed: 'crisis_sundering_2u',
    ends: { lifted: 'the Great Rift has closed. The two halves are arguing about who saved whom.', sealed: 'there are two worlds now, and neither one will speak to the other.' }, mods: { bloodmoon: 7, none: 5, siege: 3 },
    stages: ['a new crack opened overnight. Nobody fell in this time.', 'the rift splits the world in two. Both halves are watching.'],
    promises: ['hold the world together', 'mend the great crack'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Great Rift', text: 'Opened in a single night. It is wider every morning.' },
      { k: 'custom', tier: 'city', name: 'Crossing Day', text: 'Families on the wrong side of a new crack get one day to jump.' },
      { k: 'person', tier: 'city', name: 'The Rift Surveyor', text: 'Measures the cracks every dawn. Has stopped telling anyone the numbers.' },
    ] },
  goldenage: { name: 'A Golden Age', line: 'Nothing was wrong at all. It was entered anyway.',
    // lineBy: the line for a world type whose own flavour already says something is wrong (fateLine)
    lineBy: { drowned: 'The isles stopped sinking for a whole year. It was entered anyway.', burning: 'The war paused for a harvest festival. It was entered anyway.',
      hollow: 'The dead have rested for a whole season. It was entered anyway.', verdant: 'The forest has not eaten anyone in years. It was entered anyway.',
      sky: 'No city has fallen from the sky in a generation. It was entered anyway.', iron: 'The siege lifted last spring. It was entered anyway.',
      steppes: 'The storm has been almost gentle lately. It was entered anyway.' }, crises: ['crisis_goldenage_1', 'crisis_goldenage_2'], crisisIfUsed: 'crisis_goldenage_2u',
    ends: { lifted: 'still nothing wrong. The System has stopped checking.', sealed: 'the festival square is ash. Something is finally wrong.' }, mods: { golden: 9, none: 3, market: 4 },
    stages: ['the festival has a new song. It is about you.', 'still nothing wrong. The System is checking again.'],
    promises: ['keep things exactly as they are', 'come home in time for the festival'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Festival Square', text: 'Has not been empty for a generation.' },
      { k: 'custom', tier: 'far', name: 'The Long Peace', text: 'No war in living memory. The weapons museum is very popular.' },
      { k: 'person', tier: 'city', name: 'The Retired General', text: 'Never fought a battle. Writes very good poems about it.' },
    ] },
  // World expansion (12 Nov): four more Fates. added: 'x3' keeps them out of Pending World days before ADDED_FROM.x3
  wyrm: { added: 'x3', name: "The Wyrm's Tithe", line: 'A dragon takes one town a year, and the year is nearly up.', crises: ['crisis_wyrm_1', 'crisis_wyrm_2'], crisisIfUsed: 'crisis_wyrm_2u',
    ends: { lifted: 'the wyrm flew north this year and did not come back. The lots are burned.', sealed: 'the wyrm takes two towns a year now. Nobody draws lots. They wait.' }, mods: { bloodmoon: 5, none: 4, siege: 2 },
    stages: ['the wyrm has been seen over the hills. The towns are drawing lots.', 'the lot has fallen. One town is packing.'],
    promises: ['slay the wyrm', 'save the town that drew the lot'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Lot Hall', text: 'Where the towns draw lots each year. The floor is worn smooth where people stand very still.' },
      { k: 'place', tier: 'far', name: 'The Scorched Hill', text: 'Where the wyrm sleeps between tithes. Nothing grows there, and nobody goes to check.' },
      { k: 'person', tier: 'city', name: 'The Wyrm-Watcher', text: 'Has watched the northern sky every night for thirty years. Has a very stiff neck.' },
    ] },
  drought: { added: 'x3', name: 'The Long Drought', line: 'No rain in four summers. The wells are guarded.', crises: ['crisis_drought_1', 'crisis_drought_2'], crisisIfUsed: 'crisis_drought_2u',
    ends: { lifted: 'it rained. Everyone stood outside until they were soaked.', sealed: 'nobody under twelve has heard rain. The old songs about it have stopped making sense.' }, mods: { famine: 6, none: 4, market: 2 },
    stages: ['the river is a road now. People walk down the middle of it.', 'the last well has a queue a day long.'],
    promises: ['bring the rain back', 'fill the last well'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Last Well', text: 'Guarded day and night. The guards drink last, and they are very thin.' },
      { k: 'custom', tier: 'city', name: 'The Rain Dance', text: 'Danced every evening in the square. It has not worked once. Nobody has stopped.' },
      { k: 'person', tier: 'city', name: 'The Water Warden', text: 'Measures out every cup. Has never given herself a full one.' },
    ] },
  cursedcrown: { added: 'x3', name: 'The Cursed Crown', line: 'Whoever wears it goes mad. It has had six owners this year.', crises: ['crisis_cursedcrown_1', 'crisis_cursedcrown_2'], crisisIfUsed: 'crisis_cursedcrown_2u',
    ends: { lifted: 'the crown is at the bottom of the sea. The new king is very boring.', sealed: 'the crown sits on the throne by itself now. It has started giving orders.' }, mods: { strange: 5, none: 5, restless: 2 },
    stages: ['the seventh owner of the crown has started talking to it.', 'nobody will take the crown now. It sits on the throne alone.'],
    promises: ['bury the crown', 'see a sane ruler crowned'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Empty Throne', text: 'Nobody sits on it. The crown does, some days.' },
      { k: 'custom', tier: 'far', name: 'The Seven Coronations', text: 'There have been seven this year. The bunting is never taken down any more.' },
      { k: 'person', tier: 'city', name: "The Crown's Keeper", text: 'Carries the crown on a cushion, with tongs. Has not looked at it in years.' },
    ] },
  vanishing: { added: 'x3', name: 'The Vanishing', line: 'One village a month is simply gone, and nobody remembers its name.', crises: ['crisis_vanishing_1', 'crisis_vanishing_2'], crisisIfUsed: 'crisis_vanishing_2u',
    ends: { lifted: 'nothing has vanished for a season. People still count their streets each morning.', sealed: 'there are more blanks on the map than places now.' }, mods: { restless: 5, none: 5, strange: 2 },
    stages: ['another village is gone. The maps have a blank where it was.', 'the capital has started counting its own streets.'],
    promises: ['find the missing villages', 'keep the map whole'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Blank on the Map', text: 'A space on every map where something used to be. Nobody can say what.' },
      { k: 'custom', tier: 'city', name: 'Counting the Streets', text: 'Every morning, every street is counted out loud. So far, the number holds.' },
      { k: 'person', tier: 'city', name: 'The Last Mapmaker', text: 'Redraws the world every month. Uses more white ink each time.' },
    ] },
};
// A Fate's line for a world type: its lineBy entry for that type, else its line
function fateLine(F, type) { return (F.lineBy && F.lineBy[type]) || F.line; }
const PEOPLES = {
  // roles follow "You were a ...", so each starts with a consonant sound; epithets follow a champion's name
  temple: { name: 'Temple State', line: 'Ruled by priests, who rule by omens.',
    custom: { name: 'Omens', text: 'Every Favour you gain is 1 more, and gods speak up at 3 Favour.' }, visit: { at: 2, event: 'temple_omens' },
    roles: ['temple novice', 'candle bearer'], epithets: ['the Devout', 'the Anointed'],
    entries: [
      { k: 'place', tier: 'city', name: 'The High Altar', text: 'Every law is read aloud here first, then argued about forever.' },
      { k: 'custom', tier: 'city', name: 'The Omen Count', text: 'Each morning the priests count the birds. The number decides the day.' },
      { k: 'person', tier: 'city', name: 'The Hierarch', text: 'Has ruled for forty years. Claims the omens agree.' },
    ] },
  league: { name: 'Merchant League', line: 'The guilds own everything, including the weather reports.',
    custom: { name: 'Guild rates', text: 'Shop rerolls cost 1 less gold, and selling pays 1 more.' }, visit: { at: 4, event: 'league_audit' },
    roles: ['ledger clerk', 'caravan guard'], epithets: ['the Bargainer', 'the Tallied'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Counting House', text: 'Where the guilds meet. Every chair has a price on it.' },
      { k: 'custom', tier: 'city', name: 'The Guild Seal', text: 'Nothing is legal without one. Seals are sold separately.' },
      { k: 'person', tier: 'city', name: 'The Guildmaster', text: 'Owns a share of everything, including you.' },
    ] },
  clans: { name: 'The Clans', clash: ['steppes'], line: 'Twelve clans, one old feud, and a council that never ends.',
    custom: { name: 'The Blood Tally', text: 'Whoever beats you comes back next round, with a bounty on them.' }, visit: { at: 6, event: 'clan_tally' },
    roles: ['clan runner', 'feud keeper'], epithets: ['of the Twelve', 'the Feud-Born'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Moot Stone', text: 'Where the clans swear peace. It has been re-carved many times.' },
      { k: 'custom', tier: 'city', name: 'The Blood Tally', text: 'Every clan counts what the others owe. Nobody has ever paid.' },
      { k: 'person', tier: 'city', name: 'The Eldest of the Clans', text: 'Remembers why the feud started. Refuses to say.' },
    ] },
  archive: { name: 'The Archive', line: 'Scholars run everything, slowly, with footnotes.',
    custom: { name: 'Footnotes', text: 'The Enchanter and rune picks show one more prefix.' }, visit: { at: 2, event: 'archive_account' },
    roles: ['junior scribe', 'copyist'], epithets: ['the Lettered', 'the Annotated'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Great Index', text: 'Lists every book in the world. Six volumes of it are missing.' },
      { k: 'custom', tier: 'city', name: 'Examination Day', text: 'Every adult sits the exams again each year. Failing is public.' },
      { k: 'person', tier: 'city', name: 'The Chief Librarian', text: 'Has read everything. Has opinions about all of it.' },
    ] },
  // clash: world types whose own rulers this People contradicts; such a world opens with a power struggle (events/peoples.js)
  council: { name: 'Free Council', clash: ['iron', 'burning'], line: 'No kings. Every question goes to a vote, eventually.',
    custom: { name: 'The Long Vote', text: 'In round 2 the Council votes on a Tournament Amendment. You get a vote.' }, visit: { at: 2, event: 'council_vote' },
    roles: ['ward speaker', 'ballot counter'], epithets: ['the Elected', 'the Free'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Council Hall', text: 'Built with a seat for everyone. Most of them stay empty.' },
      { k: 'custom', tier: 'city', name: 'The Long Vote', text: 'The vote on the new town clock has run for nine years.' },
      { k: 'person', tier: 'city', name: 'The Speaker', text: 'Chosen by lot. Still trying to give the job back.' },
    ] },
  crown: { name: 'The Old Crown', clash: ['burning', 'iron'], line: 'A dynasty older than the maps, and still in charge.',
    custom: { name: 'Royal bounty', text: 'Gatekeepers pay a free B-rank piece when you beat them.' }, visit: { at: 6, event: 'crown_summons' },
    roles: ['palace page', 'royal taster'], epithets: ['the Loyal', 'the Crown-Sworn'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Throne Room', text: 'The throne is older than the palace built around it.' },
      { k: 'custom', tier: 'far', name: 'The Royal Line', text: 'Ninety-one monarchs, one family. The portraits fill three halls.' },
      { k: 'person', tier: 'city', name: 'The Old Monarch', text: 'Has reigned so long the coins show them at three ages.' },
    ] },
  exiles: { name: 'Exiles', line: 'Descended from refugees of a world already erased.',
    custom: { name: 'Salvage Rights', text: 'Beat an Erased champion or a filed record and get a Heart back.' }, visit: { at: 4, event: 'exiles_words' },
    roles: ['refugee scout', 'name keeper'], epithets: ['the Displaced', 'of No Shore'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Landing', text: 'Where the first refugees arrived. Their boats are kept as a monument.' },
      { k: 'custom', tier: 'far', name: 'The Old Tongue', text: 'The language of a world that no longer exists. Children still learn it.' },
      { k: 'person', tier: 'city', name: 'The Last Witness', text: 'Was born in the old world. Never describes it the same way twice.' },
    ] },
  pilgrims: { name: 'Pilgrims', line: 'A people who never stay anywhere longer than a season.',
    custom: { name: 'The road', text: 'Four districts to pick from each round instead of three.' }, visit: { at: 6, event: 'pilgrims_road' },
    roles: ['road cook', 'pathfinder'], epithets: ['the Wanderer', 'of the Road'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Waystones', text: 'Mark the old pilgrim road. Nobody remembers where it ends.' },
      { k: 'custom', tier: 'city', name: 'The Leaving Feast', text: 'Held whenever the caravans move on. Held a lot.' },
      { k: 'person', tier: 'city', name: 'The Road Elder', text: 'Has walked the whole road twice. Says it was shorter the first time.' },
    ] },
  // World expansion (12 Nov): four more Peoples. added: 'x3' keeps them out of Pending World days before ADDED_FROM.x3
  order: { added: 'x3', name: 'The Sworn Order', line: 'Knights who swore an oath so long ago nobody remembers what it was for.',
    custom: { name: 'Code of Combat', text: 'Beat a hard opponent and heal 15% of your max HP.' }, visit: { at: 4, event: 'order_vigil' },
    roles: ['squire', 'oath-keeper'], epithets: ['the Sworn', 'of the Order'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Chapter House', text: 'Where the knights meet. The oath is carved over the door, too worn to read.' },
      { k: 'custom', tier: 'city', name: 'The Vigil of Arms', text: 'Every new knight kneels all night beside their sword. Most fall asleep. Nobody tells.' },
      { k: 'person', tier: 'city', name: 'The Grand Master', text: 'Knows the oath by heart. Has never said it aloud, in case it is wrong.' },
    ] },
  guilds: { added: 'x3', name: 'Craft Guilds', line: 'Every trade has a guild, and every guild has a grudge.',
    custom: { name: 'Guild marks', text: 'Merging a piece pays 2 gold.' }, visit: { at: 2, event: 'guild_masterpiece' },
    roles: ['journeyman', 'guild runner'], epithets: ['the Journeyman', 'the Guild-Marked'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Street of Guilds', text: 'Every hall is taller than the one beside it. The newest is mostly scaffolding.' },
      { k: 'custom', tier: 'city', name: 'Masterpiece Day', text: 'Apprentices show their best work. The masters judge, and then argue for a year.' },
      { k: 'person', tier: 'city', name: 'The Old Master', text: 'Made the city gates, the bells and the clock. Is still unhappy with the clock.' },
    ] },
  lodges: { added: 'x3', name: "Hunters' Lodges", line: 'Every village has a lodge, and every lodge has a wall of trophies.',
    custom: { name: 'Trophies', text: 'Beating a monster pays 3 more gold.' }, visit: { at: 2, event: 'lodge_hunt' },
    roles: ['tracker', 'skinner'], epithets: ['the Hunter', 'of the Lodge'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Trophy Hall', text: 'Every wall is covered. They have started on the ceiling.' },
      { k: 'custom', tier: 'city', name: 'The First Kill', text: 'A hunter keeps one tooth from their first kill. Some wear it. Some swallowed it.' },
      { k: 'person', tier: 'city', name: 'The Old Tracker', text: 'Can tell what passed, when and how hungry it was. Cannot find her own keys.' },
    ] },
  mages: { added: 'x3', name: 'Hedge Mages', line: 'Every village has someone who knows a little magic, and charges a little for it.',
    custom: { name: 'Hedge sight', text: 'Chance options in events +10%.' }, visit: { at: 6, event: 'hedge_circle' },
    roles: ['herb gatherer', 'charm maker'], epithets: ['the Cunning', 'the Charmed'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Crossroads Stone', text: 'Where the hedge mages meet at midsummer. Travellers take the long way round that week.' },
      { k: 'custom', tier: 'city', name: 'Charm Day', text: 'Everyone buys a new charm and throws the old one in the river. The river is very lucky.' },
      { k: 'person', tier: 'city', name: 'The Cunning Woman', text: 'Cures warts, finds lost things and knows who did it. Charges more for the last one.' },
    ] },
};
// A Confluence is a second world type pressing in on the first. It lends half the name and one record entry,
// never its Gift or Final Champion. chance is the share of worlds that get one.
const CONFLUENCE = { chance: 0.1, take: 1 };
// World Pulse: between rounds the System files one line about your world, about an entry still standing.
// {w} is the world's name and {e} the entry. A Fate's stages replace the pulse in rounds 3 and 5.
const PULSE = {
  stageAt: [3, 5],
  win: {
    place: ['{w}: crowds at {e} cheered your win.', '{w}: they rang every bell near {e}.'],
    person: ['{w}: {e} heard you won. Cautiously pleased.', '{w}: {e} now tells people they know you.'],
    custom: ['{w}: {e} was held early, in your honour.', '{w}: {e} now ends with a toast to you.'],
  },
  loss: {
    place: ['{w}: people are avoiding {e} tonight.', '{w}: the road to {e} feels shorter now.'],
    person: ['{w}: {e} keeps asking what was lost.', '{w}: {e} has stopped asking about you.'],
    custom: ['{w}: nobody can remember how {e} ends.', '{w}: {e} was cancelled. Nobody says why.'],
  },
};
