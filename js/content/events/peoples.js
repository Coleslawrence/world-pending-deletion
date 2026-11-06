// ===== [World Pending Deletion] — content: People visits =====
// A People's own event, sent to everyone in its world in one round (PEOPLES[x].visit = { at, event }). visit: true keeps it
// out of the Undercity. The other People customs need no event: they are rules (customOf in core.js).
'use strict';
// Free Council: the Long Vote. The Council puts a Tournament Amendment to the vote, and your vote counts
EVENTS.council_vote = { visit: true, people: 'council', title: 'The Long Vote', text: run => `The Free Council of ${run.world.name} has voted on the town clock for nine years. Today it votes on your tournament instead.`, opts: [
  { label: 'Vote for Sudden Death', desc: 'Shorter fights. Sharper ones.', then: { amend: 'sudden' }, go: (run, h) => { h.custom(); if (run.customUp) h.apply({ gold: 6 }); } },
  { label: 'Vote for Extended Bouts', desc: 'Longer fights. Better paid.', then: { amend: 'extended' }, go: (run, h) => { h.custom(); if (run.customUp) h.apply({ gold: 6 }); } },
  { label: 'Abstain', desc: 'The vote can run without you.', then: { gold: 5 }, go: (run, h) => h.say('[Abstention recorded. The vote is adjourned for another nine years. +5 gold.]') }] };

// A power struggle: in a world whose People contradicts its type's old ruler (PEOPLES[x].clash, WORLD_TYPES[t].ruler), both sides
// claim you in round 1, on air. Back the People and their custom pays more for the run (customUp); back the ruler and the custom
// is suspended for the run (customOff) for the ruler's bonus. Lore audit C4, 2 Nov.
const clashP = run => PEOPLES[run.world.people], clashR = run => WORLD_TYPES[run.world.type].ruler, the = n => /^The /.test(n) ? n : 'The ' + n;
EVENTS.power_struggle = { visit: true, title: 'Two Claims', text: run => `${the(clashP(run).name)} and ${clashR(run).name} both claim ${run.world.name}. ${clashR(run).line} Each side wants your name, on air, tonight.`, opts: [
  { label: 'Back the People', desc: 'They live how they live. Say so.', go: (run, h) => { run.customUp = true; h.custom(); h.say(`[${the(clashP(run).name)} backed. ${clashP(run).custom.name} pays more for the rest of the run.]`); } },
  { label: 'Back the old ruler', desc: 'Someone has to be in charge.', go: (run, h) => { run.customOff = true; h.apply(clashR(run).then); h.say(clashR(run).say); h.say(`[${clashP(run).custom.name} is suspended for this run.]`); } }] };

// Visits for the other seven Peoples (thin content audit, 6 Nov). Each comes to everyone in its world in one round,
// spread over rounds 2, 4 and 6 so they miss the Fate Crises in 3 and 5. The first option speaks for the People's custom.
EVENTS.temple_omens = { visit: true, people: 'temple', title: 'The Reading of Omens', text: run => `The priests of ${run.world.name} count the birds for you, live on the broadcast. The count is unclear.`, opts: [
  { label: 'Accept the omen', desc: 'Whatever it says.', then: {}, go: (run, h) => { h.custom(); h.favour(patronOf(run, h), 2); } },
  { label: 'Pay 4 gold', desc: 'For a recount. Better birds cost more.', pay: 4, then: { next: { empower: 2 } }, reveal: '[The recount is excellent. You start your next fight Empowered for 2 turns.]' },
  { roll: { stat: 'LUK' }, label: 'Read your own omen', desc: 'You have watched birds before.', then: { stats: { LUK: 2 } }, reveal: '[You read it right. The priests are furious. +2 LUK.]',
    fail: { then: { next: { weaken: 1 } }, reveal: '[You read it wrong, on air. You start your next fight Weakened for 1 turn.]' } }] };
EVENTS.league_audit = { visit: true, people: 'league', title: 'The Guild Audit', text: run => `The Merchant League of ${run.world.name} has sent an auditor to your locker. The guilds want their cut of your winnings.`, opts: [
  { label: 'Join the guild', desc: 'Members pay less.', then: { gold: 4 }, go: (run, h) => { h.custom(); h.say('[Membership granted. Your first dividend: 4 gold.]'); } },
  { label: 'Pay 6 gold', desc: 'Their cut, in full.', pay: 6, then: { piece: 'B', got: '[The guild invests your cut, and pays you back in kind: {item}.]' } },
  { roll: { stat: 'INT' }, label: 'Cook the books', desc: 'Two can audit.', then: { gold: 12 }, reveal: '[The auditor finds an error in the guild\'s favour, and pays you to forget it. +12 gold.]',
    fail: { then: { notice: 1 }, reveal: '[The auditor finds your error. The System gets a copy.]' } }] };
EVENTS.clan_tally = { visit: true, people: 'clans', title: 'Count the Scars', text: run => `The twelve clans of ${run.world.name} have kept a tally of every fight you have had. Their elders want to see your scars.`, opts: [
  { label: 'Show your scars', desc: 'Every one has a story.', then: { stats: { STR: 1, VIT: 1 } }, go: (run, h) => { h.custom(); h.say('[The elders count them twice. +1 STR, +1 VIT.]'); } },
  { label: 'Ask for a blessing', desc: 'The clan way: by blood.', then: { foe: { trait: 1 }, stakes: { win: { restore: 1 } } }, reveal: '[Blessed, and promised to a hard fight. Win your next one and a page of your world comes back.]' },
  { check: { stat: 'STR' }, label: 'Arm-wrestle the eldest', desc: 'She has never lost.', then: { piece: 'B', got: '[She loses, and gives you her bracer: {item}.]' } }] };
EVENTS.archive_account = { visit: true, people: 'archive', title: 'For the Record', text: run => `The scholars of ${run.world.name} want your account of the tournament for the Archive. Footnotes included.`, opts: [
  { label: 'Dictate your account', desc: 'Leave nothing out.', then: { rune: 1, gotRune: '[Filed, with footnotes. The Archive pays scholars in runes.]' }, go: (run, h) => h.custom() },
  { check: { stat: 'INT' }, label: 'Ask to read the Archive', desc: 'Every account before yours.', then: { stats: { INT: 2 } }, reveal: '[You read all night. +2 INT.]' },
  { label: 'Decline to be recorded', desc: 'Some things stay unwritten.', then: { notice: -1 }, reveal: '[Nothing filed. The System prefers it that way.]' }] };
EVENTS.crown_summons = { visit: true, people: 'crown', title: 'A Royal Summons', text: run => `The Old Crown of ${run.world.name} summons its champion. The monarch wants to knight you, on air, before the final.`, opts: [
  { label: 'Kneel', desc: 'On air, in front of everyone.', then: { heart: 1 }, go: (run, h) => { h.custom(); h.say('[Knighted. Your world writes a new page about it.]'); } },
  { label: 'Refuse the knighthood', desc: 'Politely.', then: { gold: 8 }, reveal: '[The Crown pays you 8 gold to stop embarrassing it.]' },
  { label: 'Pay 10 gold', desc: 'Knights get first pick of the armoury.', pay: 10, then: { piece: 'A', got: '[First pick from the royal armoury: {item}.]' } }] };
EVENTS.exiles_words = { visit: true, people: 'exiles', title: 'The Old Tongue', text: run => `The Exiles of ${run.world.name} remember a world that was erased. They want to teach you its last words before the System hears them.`, opts: [
  { label: 'Learn the words', desc: 'Say them back, quietly.', then: { stats: { INT: 1, LUK: 1 } }, go: (run, h) => { h.custom(); h.say('[You will not forget them. +1 INT, +1 LUK.]'); } },
  { label: 'Carry their message', desc: 'Into the arena, where it can be heard.', then: { ward: 1 }, reveal: '[You carry it into your next fight. Your next loss costs no Heart.]' },
  { label: 'Ask what erased it', desc: 'Somebody should.', then: { notice: 1, rune: 1, gotRune: '[They answer with a rune from that world. The System heard the question.]' } }] };
EVENTS.pilgrims_road = { visit: true, people: 'pilgrims', title: 'The Road Goes On', text: run => `The Pilgrims of ${run.world.name} are moving on, as they always do. They have kept you a place on the road.`, opts: [
  { label: 'Walk with them a while', desc: 'Just to the next town.', then: {}, go: (run, h) => { h.custom(); h.heal(0.3, 'The road is kind to you.'); } },
  { label: 'Take some road money', desc: 'Pilgrims share.', then: { gold: 6 }, reveal: '[+6 gold, pressed into your hand.]' },
  { label: 'Ask them to wait', desc: 'For after the tournament.', then: { stakes: { win: { heart: 1 } } }, reveal: '[Win your next fight and they wait for you: your world gains a page.]' }] };
