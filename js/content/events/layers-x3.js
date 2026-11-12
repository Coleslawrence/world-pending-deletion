// ===== [World Pending Deletion] — content: events for the Fates and Peoples added in the world expansion =====
// Fate Crises (the same three moves as crises.js: send help, do it yourself, use it), People visits (peoples.js) and
// Undercity events tagged with one new Fate and one new People (world-events.js). added: 'x3' keeps them out of
// Pending World days before ADDED_FROM.x3. Numbers are first drafts: balance is deferred to the single balance pass.
'use strict';

// The Wyrm's Tithe: gold against Hearts
EVENTS.crisis_wyrm_1 = { crisis: true, fate: 'wyrm', added: 'x3', title: 'The Lot Is Drawn', text: run => `The broadcast shows the lot drawn in ${run.world.name}. One town is named. The wyrm comes at the new moon.`, opts: [
  { label: 'Pay the tithe', desc: 'Wire 8 gold home. Gold instead of a town, this year.', pay: 8, then: { fate: 1 }, go: (run, h) => h.say('[Transfer sent. The wyrm takes the gold and leaves the town. This year.]') },
  { label: 'Dare it on air', desc: 'Tell it to come for you. Your next opponent gets 1 extra trait.', then: { fate: 1, foe: { trait: 1 } }, go: (run, h) => h.say('[The wyrm heard. It sends a champion of its own to your next fight.]') },
  { label: 'Sell the warning', desc: 'Other towns will pay to know it is not them.', then: { gold: 14, fate: -1 }, go: (run, h) => h.say('[+14 gold, sent from home. The named town packs alone.]') }] };
EVENTS.crisis_wyrm_2 = { crisis: true, fate: 'wyrm', added: 'x3', title: 'The Wyrm Is Coming', text: run => `On air, the wyrm is a shadow over ${run.world.name}. The Lot Hall is empty. Everyone is on the walls.`, opts: [
  { label: 'Arm the walls', desc: 'Wire 12 gold home for spears and nets.', pay: 12, then: { heart: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The nets hold. The town is still there. It goes in the Record.]') },
  { label: 'Name it on air', desc: 'Win your next fight and it turns back.', then: { fate: 1, stakes: { win: { restore: 1 } } }, go: (run, h) => h.say('[You call the wyrm by name, live. Win your next fight and it turns back.]') },
  { label: 'Point it elsewhere', desc: 'Another town. Not yours.', then: { gold: 20, notice: 1, fate: -1 }, go: (run, h) => h.say('[+20 gold. The System notices which town you named.]') }] };
EVENTS.crisis_wyrm_2u = { crisis: true, fate: 'wyrm', added: 'x3', title: 'The Wyrm Grows Fat', text: run => `The broadcast shows the wyrm over ${run.world.name}, heavier than last year. It has learned the tithe can be bought.`, opts: [
  { label: 'Pay it double', desc: 'Wire 10 gold home.', pay: 10, then: { restore: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The wyrm is fed. The named town comes back to the Record, slightly singed.]') },
  { label: 'Ride with the hunters', desc: 'Through the Heart you carry. It will cost you.', then: { fate: 1 }, go: (run, h) => h.lose(0.15, 'The hunters ride out with your voice in their ears. Some of the fire reaches you.') },
  { label: 'Sell it another town', desc: 'It is buying.', then: { gold: 25, notice: 1, fate: -1 }, go: (run, h) => h.say('[+25 gold. The wyrm is very pleased with you.]') }] };

// The Long Drought: healing against gold
EVENTS.crisis_drought_1 = { crisis: true, fate: 'drought', added: 'x3', title: 'The Wells Are Guarded', text: run => `The broadcast shows the last wells of ${run.world.name}. The queue is a day long, and the guards are thirsty too.`, opts: [
  { label: 'Buy water', desc: 'Wire 8 gold home. Barrels from another world.', pay: 8, then: { fate: 1 }, go: (run, h) => { liftMod(run, h, 'famine'); h.say('[Transfer sent. The barrels arrive. The queue moves faster today.]'); } },
  { label: 'Give up your share', desc: 'Through the Heart you carry. It will cost you.', then: { fate: 1 }, go: (run, h) => h.lose(0.1, 'You go thirsty so someone at home does not.') },
  { label: 'Sell the wells', desc: 'Water is the only thing worth more than gold.', then: { gold: 15, mod: 'famine', fate: -1 }, go: (run, h) => h.say('[+15 gold, sent from home. The guards start charging.]') }] };
EVENTS.crisis_drought_2 = { crisis: true, fate: 'drought', added: 'x3', title: 'The Dry River', text: run => `On air, people in ${run.world.name} walk down the middle of the dry river. The Water Warden is digging.`, opts: [
  { label: 'Dig a new well', desc: 'Wire 12 gold home for diggers.', pay: 12, then: { heart: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. They strike water at forty feet. It goes in the Record.]') },
  { label: 'Dig with them on air', desc: 'Every swing, live. Costs 1 STR for the run.', then: { stats: { STR: -1 }, fate: 1 }, go: (run, h) => h.say('[You dig until your arms give out. The well is dug.]') },
  { label: 'Charge for the river', desc: 'Toll the dry road.', then: { gold: 20, notice: 1, fate: -1 }, go: (run, h) => h.say('[+20 gold. The System notices who tolls a dry river.]') }] };
EVENTS.crisis_drought_2u = { crisis: true, fate: 'drought', added: 'x3', title: 'Water Sold Dear', text: run => `The broadcast follows the water sellers of ${run.world.name}. Your name is on their price lists.`, opts: [
  { label: 'Buy the wells back', desc: 'Wire 10 gold home.', pay: 10, then: { restore: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The wells are free again. A page of your world comes back.]') },
  { label: 'Pour out your share', desc: 'On air. Costs 5% max HP.', then: { max_hp: -0.05, fate: 1 }, go: (run, h) => h.say('[You pour your water into theirs, live. They remember.]') },
  { label: 'Raise the price', desc: 'They will pay it.', then: { gold: 25, notice: 1, fate: -1 }, go: (run, h) => h.say('[+25 gold. They pay it.]') }] };

// The Cursed Crown: stats against notice
EVENTS.crisis_cursedcrown_1 = { crisis: true, fate: 'cursedcrown', added: 'x3', title: 'The Crown Is Offered', text: run => `The broadcast shows the throne room of ${run.world.name}. They are offering the crown to you, on air.`, opts: [
  { label: 'Pay for a guard', desc: 'Wire 8 gold home for one who will not touch it.', pay: 8, then: { fate: 1 }, go: (run, h) => h.say('[Transfer sent. The crown goes in a box. The box goes in a vault.]') },
  { label: 'Refuse it on air', desc: 'With the System listening.', then: { fate: 1, notice: 1 }, go: (run, h) => h.say('[You say no, live. The System likes a refusal on the record.]') },
  { label: 'Wear it through the Heart', desc: 'Just for a while.', then: { stats: { INT: 3 }, fate: -1 }, go: (run, h) => h.say('[It fits. It whispers. +3 INT. The crown keeps a little of you.]') }] };
EVENTS.crisis_cursedcrown_2 = { crisis: true, fate: 'cursedcrown', added: 'x3', title: 'The Seventh Owner', text: run => `On air, the seventh owner of the crown in ${run.world.name} is talking to it. It is answering.`, opts: [
  { label: 'Pay for an abdication', desc: 'Wire 12 gold home. A quiet one.', pay: 12, then: { heart: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The seventh owner retires to the country. It goes in the Record.]') },
  { label: 'Talk them down on air', desc: 'It will take a long time.', then: { fate: 1 }, go: (run, h) => h.lose(0.1, 'You talk all night. The crown argues back.') },
  { label: 'Take its advice', desc: 'It knows things.', then: { points: 3, notice: 1, fate: -1 }, go: (run, h) => h.say('[The crown tells you three things. All of them are useful. The System heard them too.]') }] };
EVENTS.crisis_cursedcrown_2u = { crisis: true, fate: 'cursedcrown', added: 'x3', title: 'The Crown Speaks', text: run => `The broadcast catches the crown of ${run.world.name} speaking on its own. It is using your voice.`, opts: [
  { label: 'Pay to have it sunk', desc: 'Wire 10 gold home for a ship.', pay: 10, then: { restore: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The crown goes over the side. A page of your world comes back.]') },
  { label: 'Shout it down', desc: 'It will curse you for it. Costs 2 LUK for the run.', then: { stats: { LUK: -2 }, fate: 1 }, go: (run, h) => h.say('[You shout louder. It stops. It does not forget.]') },
  { label: 'Listen to it', desc: 'It has more to say.', then: { points: 4, notice: 1, fate: -1 }, go: (run, h) => h.say('[It has a great deal to say. You take notes. So does the System.]') }] };

// The Vanishing: the Record
EVENTS.crisis_vanishing_1 = { crisis: true, fate: 'vanishing', added: 'x3', title: 'A Blank Map', text: run => `The broadcast shows a new map of ${run.world.name}. There is a blank where a village was last month.`, opts: [
  { label: 'Pay for searchers', desc: 'Wire 8 gold home.', pay: 8, then: { fate: 1 }, go: (run, h) => h.say('[Transfer sent. The searchers find a well and a gate. They write the name down this time.]') },
  { label: 'Read the names on air', desc: 'Every one you remember. It takes it out of you.', then: { fate: 1 }, go: (run, h) => h.lose(0.1, 'You read until your voice goes. Someone at home writes them all down.') },
  { label: 'Sell the empty land', desc: 'Nobody is using it.', then: { gold: 14, fate: -1 }, go: (run, h) => h.say('[+14 gold, sent from home. The blank gets a fence.]') }] };
EVENTS.crisis_vanishing_2 = { crisis: true, fate: 'vanishing', added: 'x3', title: 'Counting the Streets', text: run => `On air, the capital of ${run.world.name} counts its streets out loud. The number held this morning. Just.`, opts: [
  { label: 'Wire for lanterns', desc: 'Wire 12 gold home. Light every street.', pay: 12, then: { heart: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. Every street is lit and counted. It goes in the Record.]') },
  { label: 'Write it into the Heart', desc: 'Every street, by name. Costs 5% max HP.', then: { max_hp: -0.05, fate: 1 }, go: (run, h) => h.say('[You write them into the Heart you carry. They stay put.]') },
  { label: 'Sell the outer streets', desc: 'Before they go anyway.', then: { gold: 20, notice: 1, fate: -1 }, go: (run, h) => h.say('[+20 gold. The System notices what you sold.]') }] };
EVENTS.crisis_vanishing_2u = { crisis: true, fate: 'vanishing', added: 'x3', title: 'Two Villages Gone', text: run => `The broadcast shows two new blanks on the map of ${run.world.name}. One is where the land you sold used to be.`, opts: [
  { label: 'Pay for a search', desc: 'Wire 10 gold home.', pay: 10, then: { restore: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. One village is found, half where it was. A page comes back.]') },
  { label: 'Search on air', desc: 'Through the Heart you carry. It will cost you.', then: { fate: 1 }, go: (run, h) => h.lose(0.15, 'You search the blank with everything you have.') },
  { label: 'Sell the maps', desc: 'Old maps are worth more now.', then: { gold: 25, notice: 1, fate: -1 }, go: (run, h) => h.say('[+25 gold. The old maps sell fast. Nobody can check them.]') }] };

// People visits: each comes to everyone in its round (PEOPLES[x].visit). The first option is the people's own way
EVENTS.order_vigil = { visit: true, people: 'order', added: 'x3', title: 'The Vigil of Arms', text: run => `The Sworn Order of ${run.world.name} asks you to keep the vigil before your next fight, as their knights do.`, opts: [
  { label: 'Keep the vigil', desc: 'All night, beside your weapon.', then: { stats: { VIT: 2 } }, go: (run, h) => { h.custom(); h.say('[You stay awake all night. Nearly. +2 VIT.]'); } },
  { label: 'Pay 5 gold', desc: 'For a knight to keep it for you.', pay: 5, then: { ward: 1 }, reveal: '[The knight keeps the vigil, and swears an oath for you. Your next loss costs no Heart.]' },
  { roll: { stat: 'STR' }, label: 'Ask to spar instead', desc: 'With the Grand Master.', then: { stats: { STR: 2 } }, reveal: '[You hold your own. The Grand Master laughs for the first time in years. +2 STR.]',
    fail: { then: { next: { weaken: 2 } }, reveal: '[You do not hold your own. You start your next fight Weakened for 2 turns.]' } }] };
EVENTS.guild_masterpiece = { visit: true, people: 'guilds', added: 'x3', title: 'Masterpiece Day', text: run => `The Craft Guilds of ${run.world.name} want a masterpiece from you. Anything you have made counts.`, opts: [
  { label: 'Show your best piece', desc: 'The masters will judge.', then: { gold: 4 }, go: (run, h) => { h.custom(); h.say('[The masters argue for an hour, then pay you 4 gold to stop showing it to them.]'); } },
  { label: 'Pay 5 gold', desc: 'For a guild-made piece.', pay: 5, then: { piece: 'B', got: '[A journeyman made it. It is better than the master would admit: {item}.]' } },
  { roll: { stat: 'INT' }, label: 'Improve their design', desc: 'In front of them.', then: { rune: 1, gotRune: '[It works. They are furious, and pay you a rune for it.]' },
    fail: { then: { notice: 1 }, reveal: '[It does not work. The System saw it not work.]' } }] };
EVENTS.lodge_hunt = { visit: true, people: 'lodges', added: 'x3', title: 'The Lodge Hunt', text: run => `The Hunters' Lodges of ${run.world.name} invite you on a hunt in the tunnels. Trophies are shared.`, opts: [
  { label: 'Join the hunt', desc: 'Follow the trackers.', then: { gold: 4 }, go: (run, h) => { h.custom(); h.say('[You bring down a tunnel boar. The lodge counts it as yours. +4 gold.]'); } },
  { roll: { stat: 'AGI' }, label: 'Track it alone', desc: 'Without the trackers.', then: { piece: 'C', got: '[You find it first. It was guarding {item}.]' },
    fail: { then: { next: { bleed: 2 } }, reveal: '[It finds you first. You start your next fight with 2 Bleed.]' } },
  { label: 'Skin and salt', desc: 'Someone has to.', then: {}, go: (run, h) => h.heal(0.15, 'The trackers share their supper with whoever does the work.') }] };
EVENTS.hedge_circle = { visit: true, people: 'mages', added: 'x3', title: 'The Hedge Circle', text: run => `The hedge mages of ${run.world.name} have drawn a circle in chalk outside your locker. They offer a charm.`, opts: [
  { label: 'Step into the circle', desc: 'They insist.', then: { stats: { LUK: 2 } }, go: (run, h) => { h.custom(); h.say('[The chalk glows, briefly. You feel luckier. +2 LUK.]'); } },
  { label: 'Pay 3 gold', desc: 'For a healing charm.', pay: 3, then: {}, go: (run, h) => h.heal(0.3, 'It smells of mint and works better than it should.') },
  { roll: { stat: 'INT' }, label: 'Read their circle', desc: 'Every line means something.', then: { rune: 1, gotRune: '[You read it right. They trade you a rune for the secret.]' },
    fail: { then: { notice: 1 }, reveal: '[You read it out loud. It was a summoning circle. The System answers.]' } }] };

// Undercity events: each tagged with one new Fate and one new People (world-events.js), with a line only each can take
EVENTS.wyrm_scale = { fate: 'wyrm', people: 'lodges', added: 'x3', title: 'The Wyrm Scale', text: 'A hunter sells a scale the size of a shield. She swears it came off a wyrm that took her village.', opts: [
  { label: 'Pay 5 gold', desc: 'It would make a fine shield.', pay: 5, then: { stats: { VIT: 2 } }, reveal: '[It does. +2 VIT.]' },
  { roll: { stat: 'STR' }, label: 'Test it', desc: 'Hit it as hard as you can.', then: { gold: 6 }, reveal: '[It holds. So do you. She pays you 6 gold for the proof.]',
    fail: { then: { next: { weaken: 2 } }, reveal: '[It holds. Your arm does not. You start your next fight Weakened for 2 turns.]' } },
  { check: { fate: 'wyrm' }, label: 'Send it home', desc: 'For the walls.', then: { fate: 1 }, go: (run, h) => h.lose(0.05, 'You carry it to the gate yourself.') },
  { check: { people: 'lodges' }, label: 'Show your lodge mark', desc: 'Hunter to hunter.', then: { piece: 'C', got: '[Hunters look after hunters. She throws in {item}.]' } }] };
EVENTS.water_seller = { fate: 'drought', people: 'guilds', added: 'x3', title: 'The Water Seller', text: 'A seller has barrels of clean water. In the Undercity, that is worth more than gold.', opts: [
  { label: 'Pay 3 gold', desc: 'For a full cup.', pay: 3, then: {}, go: (run, h) => h.heal(0.3, 'It is the best thing you have tasted in weeks.') },
  { roll: { stat: 'LUK' }, label: 'Ask where it came from', desc: 'Someone has a well.', then: { rune: 1, gotRune: '[A well, two tunnels down. Someone left a rune in the bucket.]' },
    fail: { then: { notice: 1 }, reveal: '[She tells the System you asked. The System takes an interest.]' } },
  { check: { fate: 'drought' }, label: 'Send a barrel home', desc: 'It will not go far. It will go.', then: { fate: 1 }, go: (run, h) => h.lose(0.05, 'You go thirsty for it.') },
  { check: { people: 'guilds' }, label: 'Mend her barrels', desc: 'Guild work.', then: { gold: 6 }, reveal: '[Guild work, guild rates. +6 gold.]' }] };
EVENTS.crown_jeweller = { fate: 'cursedcrown', people: 'order', added: 'x3', title: 'The Crown Jeweller', text: 'A jeweller sells copies of famous crowns. One of them is warm to the touch.', opts: [
  { label: 'Pay 4 gold', desc: 'For a copy that is cold.', pay: 4, then: { stats: { INT: 2 } }, reveal: '[It is only a copy. It still makes you think straighter. +2 INT.]' },
  { label: 'Touch the warm one', desc: 'Just to see.', then: { stats: { INT: 3 }, notice: 1 }, reveal: '[It whispers something clever. +3 INT. The System heard it too.]' },
  { check: { fate: 'cursedcrown' }, label: 'Buy it and break it', desc: 'Before it finds a head.', then: { fate: 1 }, go: (run, h) => h.lose(0.05, 'It does not break quietly.') },
  { check: { people: 'order' }, label: 'Swear it will stay here', desc: 'On your oath.', then: { ward: 1 }, reveal: '[The oath is filed. Your next loss costs no Heart.]' }] };
EVENTS.missing_poster = { fate: 'vanishing', people: 'mages', added: 'x3', title: 'The Missing Poster', text: 'A poster on the tunnel wall asks if anyone has seen a village. There is a drawing, and no name.', opts: [
  { label: 'Add what you remember', desc: 'From home.', then: { notice: -1 }, reveal: '[You write a name under the drawing. The System looks away.]' },
  { roll: { stat: 'INT' }, label: 'Follow the drawing', desc: 'The village had a bridge.', then: { piece: 'C', got: '[You find the bridge, alone in a side tunnel. Under it: {item}.]' },
    fail: { then: { next: { weaken: 1 } }, reveal: '[You find nothing, for a long time. You start your next fight Weakened.]' } },
  { check: { fate: 'vanishing' }, label: 'Send the poster home', desc: 'Someone might know it.', then: { fate: 1 }, go: (run, h) => h.lose(0.05, 'You pay the courier in sleep.') },
  { check: { people: 'mages' }, label: 'Find it with a charm', desc: 'Hedge magic finds lost things.', then: { restore: 1 }, reveal: '[The charm points home. A page of your world comes back.]' }] };
