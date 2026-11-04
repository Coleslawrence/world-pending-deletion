// ===== [World Pending Deletion] — content: Fate Crises =====
// Each Fate's trouble grows in rounds 3 and 5 (PULSE.stageAt). Then its crisis comes to every Entrant before the shop,
// Oaken Tower style: you answer the trouble (pay now, the Fate eases) or use it (power now, the Fate worsens).
// The Fate track runs from -2 (sealed) to +2 (lifted); FATES[x].crises in layers.js lists the two events, and
// FATES[x].ends the closing line for each ending. Crisis events never turn up in the Undercity.
// The fiction (lore audit, 2 Nov): the System airs the crisis live, your choice is what you say on air, and it plays out
// on the Hearts you carry, which are real pieces of your world.
// Each crisis keeps one option with no price ("use it"), so there is always something to pick.
// Numbers are first drafts: balance is deferred to the single balance pass.
'use strict';
// A modifier the Fate brought lifts when you answer it: only that one, so a Golden Age elsewhere is never taken away
const liftMod = (run, h, m) => { if (run.world.mod === m) h.apply({ mod: 'none' }); };

// The Long Night: Hearts and the Record
EVENTS.crisis_longnight_1 = { crisis: true, fate: 'longnight', title: 'The Candles Run Low', text: run => `${run.world.name} enters its twelfth year without a sunrise. The Lamp Ward has three nights of oil left.`, opts: [
  { label: 'Buy lamp oil', desc: 'Pay 8 gold. Keep the Lamp Ward lit.', pay: 8, then: { ward: 1, fate: 1 }, go: (run, h) => h.say('[Oil delivered. The Lamp Ward stays lit. Something there is watching over you.]') },
  { label: 'Keep watch on air', desc: 'Stay up with them all night, live.', then: { next: { weaken: 2 }, fate: 1 }, go: (run, h) => h.say('[You kept them company on air until dawn. Dawn did not come. You start your next fight Weakened for 2 turns.]') },
  { label: 'Sell the candles', desc: 'They fetch a good price in the dark.', then: { gold: 12, fate: -1 }, go: (run, h) => h.say('[Sold. +12 gold. Behind you, one window goes dark, then another.]') }] };
EVENTS.crisis_longnight_2 = { crisis: true, fate: 'longnight', title: 'The Dark Holds', text: run => `The last lamp oil in ${run.world.name} has been shared out. People sit together in the dark and listen for news of you.`, opts: [
  { label: 'Light the last lamps', desc: 'Pay 12 gold. Every window you can.', pay: 12, then: { restore: 1, fate: 1 }, go: (run, h) => h.say('[Lamps lit. In the light, people find what they thought was lost.]') },
  { label: 'Pay 1 Heart', desc: 'Burn something of your own world to light it.', payHeart: 1, then: { ward: 2, fate: 1 }, go: (run, h) => h.say('[It burns warm and slow. Your next 2 losses cost no Heart.]') },
  { label: 'Fight in the dark', desc: 'Your opponents cannot see either.', then: { always: { foe: { weaken: 1 } }, notice: 1, fate: -1 }, go: (run, h) => h.say('[The dark is yours now. Every opponent starts Weakened. The System dislikes what it cannot see.]') }] };

// The Grey Plague: Poison
EVENTS.crisis_plague_1 = { crisis: true, fate: 'plague', title: 'The Grey Mark', text: run => `The Grey Plague has reached the capital of ${run.world.name}. The Plague Doctor has a new cure to try, and nobody to pay for it.`, opts: [
  { label: 'Fund the cure', desc: 'Pay 8 gold. The Plague Doctor has a new one.', pay: 8, then: { stats: { VIT: 1 }, fate: 1 }, go: (run, h) => h.say('[The cure half works. That is a first. +1 VIT from the doctor\'s spare tonic.]') },
  { label: 'Hold the sick Heart close', desc: 'You have stood worse than a cough.', then: { next: { poison: 6 }, fate: 1 }, go: (run, h) => h.say('[You held the sick piece of your world close. It held on. You start your next fight with 6 Poison.]') },
  { label: 'Carry it into the arena', desc: 'Let your opponents share it.', then: { always: { foe: { poison: 2 }, next: { poison: 1 } }, fate: -1 }, go: (run, h) => h.say('[Every opponent now starts with 2 Poison. So do you, a little.]') }] };
EVENTS.crisis_plague_2 = { crisis: true, fate: 'plague', title: 'Half the Doors', text: run => `Half the doors in ${run.world.name} carry the grey mark. The quarantine is failing.`, opts: [
  { label: 'Hold the wall', desc: 'Pay 12 gold. Guards, food and chalk. Lots of chalk.', pay: 12, then: { ward: 1, fate: 1 }, go: (run, h) => h.say('[The wall holds. Your next loss costs no Heart.]') },
  { label: 'Give blood for the cure', desc: 'You have survived everything so far.', then: { max_hp: -0.1, restore: 1, fate: 1 }, go: (run, h) => h.say('[Your blood works. The doctor writes your name in the new book.]') },
  { label: 'Spread it further', desc: 'A sick world is an easy world to win in.', then: { always: { foe: { poison: 3 } }, notice: 1, fate: -1 }, go: (run, h) => h.say('[Every opponent now starts with 3 more Poison. The System has opened a file on you.]') }] };

// The Hungry Years: gold against healing
EVENTS.crisis_hunger_1 = { crisis: true, fate: 'hunger', title: 'The Seed Stores', text: run => `The seed stores of ${run.world.name} are open. They were meant to stay shut until the harvests came back.`, opts: [
  { label: 'Feed the city', desc: 'Pay 8 gold. Buy grain from anywhere that has it.', pay: 8, then: { fate: 1 }, go: (run, h) => { liftMod(run, h, 'famine'); h.say('[Grain bought from three worlds away. The Ration Bell rings twice today.]'); } },
  { label: 'Share your rations', desc: 'You eat last, and less.', then: { max_hp: -0.05, fate: 1 }, go: (run, h) => h.say('[Shared. The Ration Bell rings a little later today.]') },
  { label: 'Hoard the grain', desc: 'Grain is worth more than gold this year.', then: { gold: 15, mod: 'famine', fate: -1 }, go: (run, h) => h.say('[+15 gold. The Seed Keeper watches you leave.]') }] };
EVENTS.crisis_hunger_2 = { crisis: true, fate: 'hunger', title: 'Bread Is Spoken Quietly', text: run => `In ${run.world.name}, bread is now something people only talk about quietly. The Empty Granary echoes.`, opts: [
  { label: 'Fill the granary', desc: 'Pay 12 gold. Every coin, turned to bread.', pay: 12, then: { heart: 1, fate: 1 }, go: (run, h) => h.say('[The granary is not empty. It is a small amount of not empty. It goes in the Record.]') },
  { label: 'Plant the last seed', desc: 'It needs one more win to take root.', then: { stakes: { win: { heart: 1 } }, fate: 1 }, go: (run, h) => h.say('[Planted. Win your next fight and it grows.]') },
  { label: 'Sell bread at war prices', desc: 'Someone will pay. Someone always does.', then: { gold: 20, notice: 1, fate: -1 }, go: (run, h) => h.say('[+20 gold. The System notices who profits from a famine.]') }] };

// Civil War: damage and traits
EVENTS.crisis_civilwar_1 = { crisis: true, fate: 'civilwar', title: 'Both Sides Claim You', text: run => `Both sides in ${run.world.name} claim your wins as their own. Each wants you to say so in public.`, opts: [
  { label: 'Host a ceasefire feast', desc: 'Pay 8 gold. One table, two sides, a lot of bread.', pay: 8, then: { fate: 1 }, go: (run, h) => { liftMod(run, h, 'bloodmoon'); h.say('[The feast went well. Nobody was stabbed until dessert.]'); } },
  { label: 'Stand on the Divided Bridge', desc: 'Let both sides send their best at you.', then: { foe: { trait: 1 }, stakes: { win: { piece: 'B' } }, fate: 1 }, go: (run, h) => h.say('[Both sides sent someone. Your next opponent has an extra trait. Win, and both sides pay.]') },
  { label: 'Pick a side', desc: 'Winning is easier with an army.', then: { always: { next: { empower: 1 } }, fate: -1 }, go: (run, h) => h.say('[Your side cheers every fight. You start each one Empowered. The other side remembers.]') }] };
EVENTS.crisis_civilwar_2 = { crisis: true, fate: 'civilwar', title: 'The Ceasefire Holds', text: run => `The ceasefire in ${run.world.name} is holding, barely, while you fight. Both captains are waiting for your word.`, opts: [
  { label: 'Fund the peace talks', desc: 'Pay 12 gold. Bring both sides to one table.', pay: 12, then: { notice: -1, fate: 1 }, go: (run, h) => { liftMod(run, h, 'bloodmoon'); h.say('[Terms agreed. The Divided Bridge has a middle stone again.]'); } },
  { label: 'Fight their champions', desc: 'Settle it the old way, by yourself.', then: { summon: { who: 'grukk', bounty: { restore: 1 }, say: '[Both sides have hired one champion to settle it: Grukk the Unbroken. He is in your bracket.]' }, fate: 1 }, go: (run, h) => h.say('[Challenge sent.]') },
  { label: 'Win the war for them', desc: 'One side. All the way.', then: { piece: 'A', notice: 1, fate: -1 }, go: (run, h) => h.say('[The war is over. Half the world is very grateful. The System has questions.]') }] };

// The Silence: Favour and notice
EVENTS.crisis_silence_1 = { crisis: true, fate: 'silence', title: 'No Answer', text: run => `Still no answer from the gods of ${run.world.name}. The prayers get louder, and some of them have your name in.`, opts: [
  { label: 'Fill the temple', desc: 'Pay 8 gold. Candles, incense, a better choir.', pay: 8, then: { fate: 1 }, go: (run, h) => Object.keys(GODS).forEach(g => h.favour(g, 1)) },
  { label: 'Keep the Listening Hour', desc: 'Stop. Be quiet. Listen with them.', then: { fate: 1 }, go: (run, h) => h.favour(patronOf(run, h), 2) },
  { label: 'Take the offerings', desc: 'Nobody is collecting them.', then: { gold: 12, notice: 1, fate: -1 }, go: (run, h) => h.say('[+12 gold. The offerings were not for you. The System knows who they were for.]') }] };
EVENTS.crisis_silence_2 = { crisis: true, fate: 'silence', title: 'They Pray to You', text: run => `The temples of ${run.world.name} have started praying to you instead. They would like an answer.`, opts: [
  { label: 'Ring every bell', desc: 'Pay 12 gold. Loud enough that the gods must hear.', pay: 12, then: { fate: 1 }, go: (run, h) => Object.keys(GODS).forEach(g => h.favour(g, 2)) },
  { label: 'Answer in their place', desc: 'Say what a god would say.', then: { notice: 1, fate: 1 }, go: (run, h) => h.favour(patronOf(run, h), 4) },
  { label: 'Let them worship you', desc: 'Someone should be listening.', then: { stats: { STR: 1, AGI: 1, INT: 1, VIT: 1, LUK: 1 }, notice: 2, fate: -1 }, go: (run, h) => h.say('[+1 to every stat. Worship suits you. The System does not share.]') }] };

// The Last Generation: Hearts against stats
EVENTS.crisis_lastgen_1 = { crisis: true, fate: 'lastgen', title: 'The Youngest Asks', text: run => `The Youngest of ${run.world.name} has stopped asking when the others are coming. Now they ask about you.`, opts: [
  { label: 'Ready the nursery', desc: 'Pay 8 gold. Clean cradles, just in case.', pay: 8, then: { ward: 1, fate: 1 }, go: (run, h) => h.say('[Ready. Your next loss costs no Heart: someone is counting on you coming home.]') },
  { label: 'Promise the Youngest', desc: 'Promise to win the next one.', then: { stakes: { win: { heart: 1 } }, fate: 1 }, go: (run, h) => h.say('[Promised. Win your next fight and the Record gains a name.]') },
  { label: 'Spend the future', desc: 'Take what the next generation would have had.', go: (run, h) => { const k = h.pick(STATS); run.stats[k] += 2; h.say(`[+2 ${k}. It was meant for someone else.]`); }, then: { erase: 1, fate: -1 } }] };
EVENTS.crisis_lastgen_2 = { crisis: true, fate: 'lastgen', title: 'Empty Cradles', text: run => `${run.world.name} has started naming the empty cradles after you. There are a lot of them.`, opts: [
  { label: 'Carve the Naming Stone', desc: 'Pay 12 gold. Make room for new names.', pay: 12, then: { heart: 1, fate: 1 }, go: (run, h) => h.say('[Room made. The Record gains an entry.]') },
  { label: 'Sit with the Silent Nursery', desc: 'Hold its Heart all night, on air.', then: { restore: 1, next: { weaken: 2 }, fate: 1 }, go: (run, h) => h.say('[You stayed until morning. You start your next fight Weakened for 2 turns.]') },
  { label: 'Take their tomorrow', desc: 'There is nobody to give it to.', go: (run, h) => { const a = h.shuffle(STATS.slice()); run.stats[a[0]] += 2; run.stats[a[1]] += 1; h.say(`[+2 ${a[0]}, +1 ${a[1]}. Taken.]`); }, then: { erase: 1, fate: -1 } }] };

// The Sundering: pieces against the Record
EVENTS.crisis_sundering_1 = { crisis: true, fate: 'sundering', title: 'A New Crack', text: run => `A new crack opened across ${run.world.name} overnight. Families on the wrong side have one day to jump.`, opts: [
  { label: 'Build rope bridges', desc: 'Pay 8 gold. Get everyone across.', pay: 8, then: { ward: 2, fate: 1 }, go: (run, h) => h.say('[Everyone crossed. Your next 2 losses cost no Heart.]') },
  { label: 'Hold the rift shut', desc: 'Squeeze the cracked Heart with your hands.', then: { max_hp: -0.05, ward: 1, fate: 1 }, go: (run, h) => h.say('[It closed a little. Your next loss costs no Heart.]') },
  { label: 'Push the crack wider', desc: 'Something valuable is falling out.', then: { piece: 'A', erase: 1, fate: -1 }, go: (run, h) => h.say('[You caught it. Something else fell in.]') }] };
EVENTS.crisis_sundering_2 = { crisis: true, fate: 'sundering', title: 'Two Halves', text: run => `The rift splits ${run.world.name} in two. Both halves are watching you.`, opts: [
  { label: 'Mend the rift', desc: 'Pay 12 gold. Stone, mortar, a lot of workers.', pay: 12, then: { restore: 2, fate: 1 }, go: (run, h) => h.say('[Mended. Some of what fell in has climbed back out.]') },
  { label: 'Carry the halves together', desc: 'Both halves of its Heart. Very heavy. You are very stubborn.', then: { ward: 2, foe: { trait: 1 }, fate: 1 }, go: (run, h) => h.say('[It holds. Your next 2 losses cost no Heart. Your next opponent saw how tired you are, and has an extra trait.]') },
  { label: 'Split it for good', desc: 'Two worlds. Twice the plunder.', then: { piece: 'A', rune: 1, erase: 1, mod: 'bloodmoon', fate: -1 }, go: (run, h) => h.say('[Split. Everyone is angrier now.]') }] };

// A Golden Age: notice and gold
EVENTS.crisis_goldenage_1 = { crisis: true, fate: 'goldenage', title: 'The System Checks', text: run => `Nothing is wrong in ${run.world.name}. The System is checking again. A clerk is counting the festival lanterns.`, opts: [
  { label: 'Pay the inspection fee', desc: 'Pay 8 gold. Pay it and smile.', pay: 8, then: { notice: -2, fate: 1 }, go: (run, h) => h.say('[Inspection passed. Nothing wrong. Again.]') },
  { label: 'Change nothing', desc: 'Keep everything exactly as it is.', then: { notice: -1, fate: 1 }, go: (run, h) => h.lose(0.1, 'You hid the festival in your own pockets.') },
  { label: 'Give the System a reason', desc: 'Make a mess it will have to look at.', then: { piece: 'B', notice: 1, fate: -1 }, go: (run, h) => h.say('[Something is wrong now. You made sure of it.]') }] };
EVENTS.crisis_goldenage_2 = { crisis: true, fate: 'goldenage', title: 'A Song About You', text: run => `The festival in ${run.world.name} has a new song. It is about you. The System is listening to it.`, opts: [
  { label: 'Fund the festival', desc: 'Pay 12 gold. Let them sing it louder.', pay: 12, then: { restore: 1, fate: 1 }, go: (run, h) => { h.say('[They sing it louder. The System hums along, by accident.]'); if (run.world.mod === 'none') h.apply({ mod: 'golden' }); } },
  { label: 'Cancel the song', desc: 'Nobody needs to hear it.', then: { notice: -2, max_hp: -0.05, fate: 1 }, go: (run, h) => h.say('[Cancelled. The square is quiet. The System moves on.]') },
  { label: 'Burn the festival square', desc: 'Hold its Heart to a flame. Give the System its reason.', then: { piece: 'A', notice: 2, fate: -1 }, go: (run, h) => h.say('[It burns well. Nothing in this world will be golden again.]') }] };
