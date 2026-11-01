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
//   ends              (Fates) { lifted, sealed }: the closing line when the run ends with the Fate lifted or sealed (they follow "Velmora: ")
//   mods              (Fates) modifier weights, e.g. { bloodmoon: 3, none: 1 }; without it the usual weights apply
//   epithets          (Peoples) what the System may call a champion of this people in broadcasts
//   settings          the settings it suits (['fantasy']); a world type has one setting (WORLD_TYPES[t].setting, fantasy
//                     by default). Without a list it suits every setting. Entries may carry settings too; roles and
//                     promises can't, so keep them true to every setting the layer suits.
// Runs and snapshots store layer ids and entry positions, so ids are permanent and every list only grows at the end.
// Records number a world's entries by where they come from (LAYER_BASE in core.js): the type's own 0 to 99,
// the Fate's from 100, the People's from 200, a Confluence type's from 300.
const FATES = {
  // mods: each Fate brings the modifiers that fit it; across all Fates each modifier is about as common as before layers
  longnight: { name: 'The Long Night', line: 'The sun has not risen in eleven years.', crises: ['crisis_longnight_1', 'crisis_longnight_2'],
    ends: { lifted: 'the sun rose this morning. Nobody knows what to do with it.', sealed: 'the Lamp Ward is dark. Nobody remembers what a sunrise looked like.' }, mods: { none: 6, restless: 6 },
    stages: ['the Long Night enters its twelfth year. Candles are rationed.', 'the last lamp oil has been shared out. The dark holds.'],
    promises: ['bring back the sun', 'see one more dawn'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Lamp Ward', text: 'The only district kept lit all night. Rent is paid in candles.' },
      { k: 'custom', tier: 'far', name: 'The Last Sunrise', text: 'Painted on every ceiling, so nobody forgets what it looked like.' },
      { k: 'person', tier: 'city', name: 'The Dawn Watcher', text: 'Has faced east every morning for eleven years. Still hopeful.' },
    ] },
  plague: { name: 'The Grey Plague', line: 'A grey sickness spreads, and no cure has worked.', crises: ['crisis_plague_1', 'crisis_plague_2'],
    ends: { lifted: 'the Quarantine Wall is coming down. Nobody has been marked in a week.', sealed: 'every door carries the grey mark now. There is no one left to chalk them.' }, mods: { restless: 6, famine: 3, none: 3 },
    stages: ['the Grey Plague has reached the capital.', 'half the doors now carry the grey mark.'],
    promises: ['find a cure', 'outlive the plague'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Quarantine Wall', text: 'Built in a week. Nobody on either side has crossed it since.' },
      { k: 'custom', tier: 'city', name: 'The Grey Mark', text: 'Chalk on the door of a sick house. Most doors have one now.' },
      { k: 'person', tier: 'far', name: 'The Plague Doctor', text: 'Has tried every cure in the old books. Is writing a new book.' },
    ] },
  hunger: { name: 'The Hungry Years', line: 'The harvests have failed four years running.', crises: ['crisis_hunger_1', 'crisis_hunger_2'],
    ends: { lifted: 'the first harvest in five years came in. The Ration Bell has been retired.', sealed: 'the Empty Granary is a museum now. Admission is one loaf.' }, mods: { famine: 9, none: 3 },
    stages: ['the seed stores are open. They were meant to stay shut.', 'bread is now something people say quietly.'],
    promises: ['fill the granaries again', 'bring home bread'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Empty Granary', text: 'Big enough to feed the world for a year. It echoes now.' },
      { k: 'custom', tier: 'city', name: 'The Ration Bell', text: 'Rings once a day. Everyone knows exactly how long until it rings.' },
      { k: 'person', tier: 'city', name: 'The Seed Keeper', text: 'Guards the last sack of good seed. Has not slept well in years.' },
    ] },
  civilwar: { name: 'Civil War', line: 'Two factions claim the same world, and neither will yield.', crises: ['crisis_civilwar_1', 'crisis_civilwar_2'],
    ends: { lifted: 'both sides ate together, and nobody went back to war in the morning.', sealed: 'one side won. The other is not mentioned any more.' }, mods: { bloodmoon: 9, none: 3 },
    stages: ['both sides claim your wins as their own.', 'the ceasefire is holding, barely, while you fight.'],
    promises: ['end the war', 'bring both sides to one table'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Divided Bridge', text: 'Half of it belongs to each side. The middle stone belongs to nobody.' },
      { k: 'custom', tier: 'city', name: 'The Ceasefire Feast', text: 'One night a year, both sides eat together. Then the war resumes.' },
      { k: 'person', tier: 'city', name: 'The Turncoat Captain', text: 'Has switched sides three times. Both sides still want them back.' },
    ] },
  silence: { name: 'The Silence', line: 'The gods stopped answering a year before the sky opened.', crises: ['crisis_silence_1', 'crisis_silence_2'],
    ends: { lifted: 'the gods answered. They said they were sorry. Nobody believed them.', sealed: 'the temples are empty. The gods were never coming back.' }, mods: { none: 4, restless: 4, golden: 4 },
    stages: ['still no answer from the gods. The prayers get louder.', 'the temples have started praying to you instead.'],
    promises: ['make the gods answer', 'learn why the gods went quiet'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Unanswered Temple', text: 'Still full every day. Nobody has heard a reply in years.' },
      { k: 'custom', tier: 'far', name: 'The Listening Hour', text: 'At noon the whole world stops talking, in case the gods do.' },
      { k: 'person', tier: 'city', name: 'The Last Oracle', text: 'Hears nothing now. Charges the same price.' },
    ] },
  lastgen: { name: 'The Last Generation', line: 'No child has been born here in ten years.', crises: ['crisis_lastgen_1', 'crisis_lastgen_2'],
    ends: { lifted: 'a child was born this morning. The whole world came to see.', sealed: 'the Naming Stone is full. Nobody will add another name.' }, mods: { none: 5, golden: 3, famine: 4 },
    stages: ['the youngest has stopped asking when the others are coming.', 'they have started naming the empty cradles after you.'],
    promises: ['hear a child laugh again', 'make sure someone comes after us'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Silent Nursery', text: 'Kept clean and ready every day, just in case.' },
      { k: 'custom', tier: 'city', name: 'The Naming Stone', text: 'Lists every child ever born here. The last name is ten years old.' },
      { k: 'person', tier: 'city', name: 'The Youngest', text: 'Ten years old, and the whole world knows their name.' },
    ] },
  sundering: { name: 'The Sundering', line: 'The land is cracking apart, a little more each year.', crises: ['crisis_sundering_1', 'crisis_sundering_2'],
    ends: { lifted: 'the Great Rift has closed. The two halves are arguing about who saved whom.', sealed: 'there are two worlds now, and neither one will speak to the other.' }, mods: { bloodmoon: 7, none: 5 },
    stages: ['a new crack opened overnight. Nobody fell in this time.', 'the rift splits the world in two. Both halves are watching.'],
    promises: ['hold the world together', 'mend the great crack'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Great Rift', text: 'Opened in a single night. It is wider every morning.' },
      { k: 'custom', tier: 'city', name: 'Crossing Day', text: 'Families on the wrong side of a new crack get one day to jump.' },
      { k: 'person', tier: 'city', name: 'The Rift Surveyor', text: 'Measures the cracks every dawn. Has stopped telling anyone the numbers.' },
    ] },
  goldenage: { name: 'A Golden Age', line: 'Nothing was wrong at all. It was entered anyway.', crises: ['crisis_goldenage_1', 'crisis_goldenage_2'],
    ends: { lifted: 'still nothing wrong. The System has stopped checking.', sealed: 'the festival square is ash. Something is finally wrong.' }, mods: { golden: 9, none: 3 },
    stages: ['the festival has a new song. It is about you.', 'still nothing wrong. The System is checking again.'],
    promises: ['keep things exactly as they are', 'come home in time for the festival'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Festival Square', text: 'Has not been empty for a generation.' },
      { k: 'custom', tier: 'far', name: 'The Long Peace', text: 'No war in living memory. The weapons museum is very popular.' },
      { k: 'person', tier: 'city', name: 'The Retired General', text: 'Never fought a battle. Writes very good poems about it.' },
    ] },
};
const PEOPLES = {
  // roles follow "You were a ...", so each starts with a consonant sound; epithets follow a champion's name
  temple: { name: 'Temple State', line: 'Ruled by priests, who rule by omens.',
    roles: ['temple novice', 'candle bearer'], epithets: ['the Devout', 'the Anointed'],
    entries: [
      { k: 'place', tier: 'city', name: 'The High Altar', text: 'Every law is read aloud here first, then argued about forever.' },
      { k: 'custom', tier: 'city', name: 'The Omen Count', text: 'Each morning the priests count the birds. The number decides the day.' },
      { k: 'person', tier: 'city', name: 'The Hierarch', text: 'Has ruled for forty years. Claims the omens agree.' },
    ] },
  league: { name: 'Merchant League', line: 'The guilds own everything, including the weather reports.',
    roles: ['ledger clerk', 'caravan guard'], epithets: ['the Bargainer', 'the Tallied'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Counting House', text: 'Where the guilds meet. Every chair has a price on it.' },
      { k: 'custom', tier: 'city', name: 'The Guild Seal', text: 'Nothing is legal without one. Seals are sold separately.' },
      { k: 'person', tier: 'city', name: 'The Guildmaster', text: 'Owns a share of everything, including you.' },
    ] },
  clans: { name: 'The Clans', line: 'Twelve clans, one old feud, and a council that never ends.',
    roles: ['clan runner', 'feud keeper'], epithets: ['of the Twelve', 'the Feud-Born'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Moot Stone', text: 'Where the clans swear peace. It has been re-carved many times.' },
      { k: 'custom', tier: 'city', name: 'The Blood Tally', text: 'Every clan counts what the others owe. Nobody has ever paid.' },
      { k: 'person', tier: 'city', name: 'The Eldest of the Clans', text: 'Remembers why the feud started. Refuses to say.' },
    ] },
  archive: { name: 'The Archive', line: 'Scholars run everything, slowly, with footnotes.',
    roles: ['junior scribe', 'copyist'], epithets: ['the Lettered', 'the Annotated'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Great Index', text: 'Lists every book in the world. Six volumes of it are missing.' },
      { k: 'custom', tier: 'city', name: 'Examination Day', text: 'Every adult sits the exams again each year. Failing is public.' },
      { k: 'person', tier: 'city', name: 'The Chief Librarian', text: 'Has read everything. Has opinions about all of it.' },
    ] },
  council: { name: 'Free Council', line: 'No kings. Every question goes to a vote, eventually.',
    roles: ['ward speaker', 'ballot counter'], epithets: ['the Elected', 'the Free'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Council Hall', text: 'Built with a seat for everyone. Most of them stay empty.' },
      { k: 'custom', tier: 'city', name: 'The Long Vote', text: 'The vote on the new town clock has run for nine years.' },
      { k: 'person', tier: 'city', name: 'The Speaker', text: 'Chosen by lot. Still trying to give the job back.' },
    ] },
  crown: { name: 'The Old Crown', line: 'A dynasty older than the maps, and still in charge.',
    roles: ['palace page', 'royal taster'], epithets: ['the Loyal', 'the Crown-Sworn'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Throne Room', text: 'The throne is older than the palace built around it.' },
      { k: 'custom', tier: 'far', name: 'The Royal Line', text: 'Ninety-one monarchs, one family. The portraits fill three halls.' },
      { k: 'person', tier: 'city', name: 'The Old Monarch', text: 'Has reigned so long the coins show them at three ages.' },
    ] },
  exiles: { name: 'Exiles', line: 'Descended from refugees of a world already erased.',
    roles: ['refugee scout', 'name keeper'], epithets: ['the Displaced', 'of No Shore'],
    entries: [
      { k: 'place', tier: 'city', name: 'The Landing', text: 'Where the first refugees arrived. Their boats are kept as a monument.' },
      { k: 'custom', tier: 'far', name: 'The Old Tongue', text: 'The language of a world that no longer exists. Children still learn it.' },
      { k: 'person', tier: 'city', name: 'The Last Witness', text: 'Was born in the old world. Never describes it the same way twice.' },
    ] },
  pilgrims: { name: 'Pilgrims', line: 'A people who never stay anywhere longer than a season.',
    roles: ['road cook', 'pathfinder'], epithets: ['the Wanderer', 'of the Road'],
    entries: [
      { k: 'place', tier: 'far', name: 'The Waystones', text: 'Mark the old pilgrim road. Nobody remembers where it ends.' },
      { k: 'custom', tier: 'city', name: 'The Leaving Feast', text: 'Held whenever the caravans move on. Held a lot.' },
      { k: 'person', tier: 'city', name: 'The Road Elder', text: 'Has walked the whole road twice. Says it was shorter the first time.' },
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
