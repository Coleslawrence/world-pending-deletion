// ===== [World Pending Deletion] — content: Fate Crises =====
// Each Fate's trouble grows in rounds 3 and 5 (PULSE.stageAt). Then its crisis comes to every Entrant before the shop,
// Oaken Tower style: you answer the trouble (pay now, the Fate eases) or use it (power now, the Fate worsens).
// The Fate track runs from -2 (sealed) to +2 (lifted); FATES[x].crises in layers.js lists the two events, and
// FATES[x].ends the closing line for each ending. Crisis events never turn up in the Undercity.
// The fiction ("Voice and hands", 5 Nov): the System airs the crisis live from your world, and your world can hear you.
// You never go home, so you act two ways: with your voice on air, or with your hands on the Hearts you carry, which are
// real pieces of your world. Every crisis offers the same three moves, in this order:
//   1. Send help: wire gold home through the System ("Wire N gold home."); results open "[Transfer sent."
//   2. Do it yourself: on air, or with the Heart you carry. It costs you.
//   3. Use it: take from the crisis, on air or out of the Heart. Your world pays.
// Body text says what the broadcast shows, never as if you stand there.
// Each crisis keeps one option with no price ("use it"), so there is always something to pick.
// Numbers are first drafts: balance is deferred to the single balance pass.
'use strict';
// A modifier the Fate brought lifts when you answer it: only that one, so a Golden Age elsewhere is never taken away
const liftMod = (run, h, m) => { if (run.world.mod === m) h.apply({ mod: 'none' }); };

// The Long Night: Hearts and the Record
EVENTS.crisis_longnight_1 = { crisis: true, fate: 'longnight', title: 'The Candles Run Low', text: run => `The broadcast cuts to ${run.world.name}: twelve years without a sunrise. The Lamp Ward has three nights of oil left.`, opts: [
  { label: 'Send lamp oil', desc: 'Wire 8 gold home. Keep the Lamp Ward lit.', pay: 8, then: { ward: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The Lamp Ward stays lit. Something there is watching over you.]') },
  { label: 'Keep watch on air', desc: 'Stay on air with them all night.', then: { next: { weaken: 2 }, fate: 1 }, go: (run, h) => h.say('[You kept them company on air until dawn. Dawn did not come. You start your next fight Weakened for 2 turns.]') },
  { label: 'Sell the candles', desc: 'Tell them to sell. Light fetches a good price.', then: { gold: 12, fate: -1 }, go: (run, h) => h.say('[+12 gold, sent from home. On the broadcast, one window goes dark, then another.]') }] };
EVENTS.crisis_longnight_2 = { crisis: true, fate: 'longnight', title: 'The Dark Holds', text: run => `On the broadcast, ${run.world.name} sits together in the dark. The last oil is shared out. They are listening for news of you.`, opts: [
  { label: 'Light the last lamps', desc: 'Wire 12 gold home. Every window they can.', pay: 12, then: { restore: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. Lamps lit. In the light, people find what they thought was lost.]') },
  { label: 'Burn a Heart for light', desc: 'Pay 1 Heart. Set it alight in your hands.', payHeart: 1, then: { ward: 2, fate: 1 }, go: (run, h) => h.say('[It burns warm and slow. Your next 2 losses cost no Heart.]') },
  { label: 'Bring the dark here', desc: 'Open its Heart in the arena. Nobody can see.', then: { always: { foe: { weaken: 1 } }, notice: 1, fate: -1 }, go: (run, h) => h.say('[The dark is yours now. Every opponent starts Weakened. The System dislikes what it cannot see.]') }] };

// The Grey Plague: Poison
EVENTS.crisis_plague_1 = { crisis: true, fate: 'plague', title: 'The Grey Mark', text: run => `The broadcast shows the capital of ${run.world.name}, grey with plague. The Plague Doctor has a new cure to try, and nobody to pay for it.`, opts: [
  { label: 'Fund the cure', desc: 'Wire 8 gold home. The doctor has a new one.', pay: 8, then: { stats: { VIT: 1 }, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The cure half works. The doctor sends a spare tonic back: +1 VIT.]') },
  { label: 'Hold the sick Heart close', desc: 'Draw the sickness out of it, into you.', then: { next: { poison: 6 }, fate: 1 }, go: (run, h) => h.say('[You held the sick Heart close. It held on. You start your next fight with 6 Poison.]') },
  { label: 'Carry it into the arena', desc: 'Open the sick Heart here. Let your opponents share it.', then: { always: { foe: { poison: 2 }, next: { poison: 1 } }, fate: -1 }, go: (run, h) => h.say('[Every opponent now starts with 2 Poison. So do you, a little.]') }] };
EVENTS.crisis_plague_2 = { crisis: true, fate: 'plague', title: 'Half the Doors', text: run => `On the broadcast, half the doors in ${run.world.name} carry the grey mark. The quarantine is failing.`, opts: [
  { label: 'Hold the wall', desc: 'Wire 12 gold home. Guards, food and a lot of chalk.', pay: 12, then: { ward: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The wall holds. Your next loss costs no Heart.]') },
  { label: 'Give blood for the cure', desc: 'Bleed into the sick Heart. You have survived worse.', then: { max_hp: -0.1, restore: 1, fate: 1 }, go: (run, h) => h.say('[Your blood works. On air, the doctor writes your name in the new book.]') },
  { label: 'Spread it further', desc: 'Shake the sick Heart over the arena. Easy wins.', then: { always: { foe: { poison: 3 } }, notice: 1, fate: -1 }, go: (run, h) => h.say('[Every opponent now starts with 3 more Poison. The System has opened a file on you.]') }] };

// The Hungry Years: gold against healing
EVENTS.crisis_hunger_1 = { crisis: true, fate: 'hunger', title: 'The Seed Stores', text: run => `The broadcast shows the seed stores of ${run.world.name}, open. They were meant to stay shut until the harvests came back.`, opts: [
  { label: 'Feed the city', desc: 'Wire 8 gold home. Grain from anywhere that has it.', pay: 8, then: { fate: 1 }, go: (run, h) => { liftMod(run, h, 'famine'); h.say('[Transfer sent. Grain bought from three worlds away. The Ration Bell rings twice today.]'); } },
  { label: 'Share your rations', desc: 'Eat last and less. Feed the Heart you carry.', then: { max_hp: -0.05, fate: 1 }, go: (run, h) => h.say('[Shared through the Heart. The Ration Bell rings a little later today.]') },
  { label: 'Hoard the grain', desc: 'Tell them to sell it. Grain beats gold this year.', then: { gold: 15, mod: 'famine', fate: -1 }, go: (run, h) => h.say('[+15 gold, sent from home. The Seed Keeper watches the stores empty.]') }] };
EVENTS.crisis_hunger_2 = { crisis: true, fate: 'hunger', title: 'Bread Is Spoken Quietly', text: run => `On air, ${run.world.name} only speaks of bread quietly now. The broadcast lingers on the Empty Granary.`, opts: [
  { label: 'Fill the granary', desc: 'Wire 12 gold home. Every coin, turned to bread.', pay: 12, then: { heart: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The granary is a small amount of not empty. It goes in the Record.]') },
  { label: 'Plant the last seed', desc: 'Press it into the Heart you carry. One more win.', then: { stakes: { win: { heart: 1 } }, fate: 1 }, go: (run, h) => h.say('[Planted in the Heart. Win your next fight and it grows.]') },
  { label: 'Sell bread at war prices', desc: 'Tell them to charge what it is worth.', then: { gold: 20, notice: 1, fate: -1 }, go: (run, h) => h.say('[+20 gold, sent from home. The System notices who profits from a famine.]') }] };

// Civil War: damage and traits
EVENTS.crisis_civilwar_1 = { crisis: true, fate: 'civilwar', title: 'Both Sides Claim You', text: run => `On the broadcast, both sides in ${run.world.name} claim your wins as their own. Each wants you to say so, on air.`, opts: [
  { label: 'Host a ceasefire feast', desc: 'Wire 8 gold home. One table, two sides, a lot of bread.', pay: 8, then: { fate: 1 }, go: (run, h) => { liftMod(run, h, 'bloodmoon'); h.say('[Transfer sent. The feast went well. Nobody was stabbed until dessert.]'); } },
  { label: 'Take on both sides', desc: 'Tell both, on air, to send their best at you.', then: { foe: { trait: 1 }, stakes: { win: { piece: 'B', got: '[Both sides pay, in the only currency they still trust: {item}.]' } }, fate: 1 }, go: (run, h) => h.say('[Both sides sent someone. Your next opponent has an extra trait. Win, and both sides pay.]') },
  { label: 'Pick a side', desc: 'Say their name on air. Winning is easier with an army.', then: { always: { next: { empower: 1 } }, fate: -1 }, go: (run, h) => h.say('[Your side cheers every fight. You start each one Empowered. The other side remembers.]') }] };
EVENTS.crisis_civilwar_2 = { crisis: true, fate: 'civilwar', title: 'The Ceasefire Holds', text: run => `The ceasefire in ${run.world.name} holds, barely, while you fight. On air, both captains wait for your word.`, opts: [
  { label: 'Fund the peace talks', desc: 'Wire 12 gold home. Bring both sides to one table.', pay: 12, then: { notice: -1, fate: 1 }, go: (run, h) => { liftMod(run, h, 'bloodmoon'); h.say('[Transfer sent. Terms agreed. The Divided Bridge has a middle stone again.]'); } },
  { label: 'Fight their champions', desc: 'Offer on air to settle it yourself, the old way.', then: { summon: { who: 'grukk', bounty: { restore: 1 }, say: '[Both sides have hired one champion to settle it: Grukk the Unbroken. He is in your bracket.]' }, fate: 1 }, go: (run, h) => h.say('[Challenge broadcast.]') },
  { label: 'Win the war for them', desc: 'Back one side on air. All the way.', then: { piece: 'A', notice: 1, fate: -1, got: '[The war is over. The winners send their champion a gift from the armoury: {item}.]' }, go: (run, h) => h.say('[Half the world is very grateful. The System has questions.]') }] };

// The Silence: Favour and notice
EVENTS.crisis_silence_1 = { crisis: true, fate: 'silence', title: 'No Answer', text: run => `Still no answer from the gods of ${run.world.name}. The broadcast catches the prayers. Some of them have your name in.`, opts: [
  { label: 'Fill the temple', desc: 'Wire 8 gold home. Candles, incense, a better choir.', pay: 8, then: { fate: 1 }, go: (run, h) => { h.say('[Transfer sent. The temple is full tonight.]'); Object.keys(GODS).forEach(g => h.favour(g, 1)); } },
  { label: 'Keep the Listening Hour', desc: 'Go quiet on air. Listen with them.', then: { fate: 1 }, go: (run, h) => h.favour(patronOf(run, h), 2) },
  { label: 'Take the offerings', desc: 'Tell them to send the offerings to you.', then: { gold: 12, notice: 1, fate: -1 }, go: (run, h) => h.say('[+12 gold, sent from home. The offerings were not for you. The System knows who they were for.]') }] };
EVENTS.crisis_silence_2 = { crisis: true, fate: 'silence', title: 'They Pray to You', text: run => `On the broadcast, the temples of ${run.world.name} have started praying to you instead. They would like an answer.`, opts: [
  { label: 'Ring every bell', desc: 'Wire 12 gold home. Loud enough that the gods must hear.', pay: 12, then: { fate: 1 }, go: (run, h) => { h.say('[Transfer sent. Every bell rings at once.]'); Object.keys(GODS).forEach(g => h.favour(g, 2)); } },
  { label: 'Answer in their place', desc: 'Say on air what a god would say.', then: { notice: 1, fate: 1 }, go: (run, h) => h.favour(patronOf(run, h), 4) },
  { label: 'Let them worship you', desc: 'Accept it on air. Someone should be listening.', then: { stats: { STR: 1, AGI: 1, INT: 1, VIT: 1, LUK: 1 }, notice: 2, fate: -1 }, go: (run, h) => h.say('[+1 to every stat. Worship suits you. The System does not share.]') }] };

// The Last Generation: Hearts against stats
EVENTS.crisis_lastgen_1 = { crisis: true, fate: 'lastgen', title: 'The Youngest Asks', text: run => `On the broadcast, the Youngest of ${run.world.name} has stopped asking when the others are coming. Now they ask about you.`, opts: [
  { label: 'Ready the nursery', desc: 'Wire 8 gold home. Clean cradles, just in case.', pay: 8, then: { ward: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The nursery is ready. Your next loss costs no Heart: someone is counting on you.]') },
  { label: 'Promise the Youngest', desc: 'Promise on air to win the next one.', then: { stakes: { win: { heart: 1 } }, fate: 1 }, go: (run, h) => h.say('[Promised, on air. Win your next fight and the Record gains a name.]') },
  { label: 'Spend the future', desc: 'Draw their tomorrow out of the Heart you carry.', go: (run, h) => { const k = h.pick(STATS); run.stats[k] += 2; h.say(`[+2 ${k}. It was meant for someone else.]`); }, then: { erase: 1, fate: -1 } }] };
EVENTS.crisis_lastgen_2 = { crisis: true, fate: 'lastgen', title: 'Empty Cradles', text: run => `On air, ${run.world.name} names its empty cradles after you. The broadcast shows a lot of them.`, opts: [
  { label: 'Carve the Naming Stone', desc: 'Wire 12 gold home. Make room for new names.', pay: 12, then: { heart: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. Room made. The Record gains an entry.]') },
  { label: 'Sit with the Silent Nursery', desc: 'Hold its Heart all night, on air.', then: { restore: 1, next: { weaken: 2 }, fate: 1 }, go: (run, h) => h.say('[You stayed until morning. You start your next fight Weakened for 2 turns.]') },
  { label: 'Take their tomorrow', desc: 'Draw it out of the Heart. Nobody will use it.', go: (run, h) => { const a = h.shuffle(STATS.slice()); run.stats[a[0]] += 2; run.stats[a[1]] += 1; h.say(`[+2 ${a[0]}, +1 ${a[1]}. Taken.]`); }, then: { erase: 1, fate: -1 } }] };

// The Sundering: pieces against the Record
EVENTS.crisis_sundering_1 = { crisis: true, fate: 'sundering', title: 'A New Crack', text: run => `On the broadcast, a new crack opens across ${run.world.name}. Families on the wrong side have one day to jump. A Heart you carry splits to match.`, opts: [
  { label: 'Send rope money', desc: 'Wire 8 gold home. They build bridges tonight.', pay: 8, then: { ward: 2, fate: 1 }, go: (run, h) => h.say('[Transfer sent. Everyone crossed. Your next 2 losses cost no Heart.]') },
  { label: 'Hold the rift shut', desc: 'Squeeze the cracked Heart closed yourself.', then: { max_hp: -0.05, ward: 1, fate: 1 }, go: (run, h) => h.say('[It closed a little. Your next loss costs no Heart.]') },
  { label: 'Push the crack wider', desc: 'Pry the Heart open. Something valuable is falling out.', then: { piece: 'A', erase: 1, fate: -1, got: '[Something valuable falls out of the crack. Caught: {item}.]' }, go: (run, h) => h.say('[Something else fell in.]') }] };
EVENTS.crisis_sundering_2 = { crisis: true, fate: 'sundering', title: 'Two Halves', text: run => `On the broadcast, the rift splits ${run.world.name} in two. The Heart you carry has split too. Both halves are watching you.`, opts: [
  { label: 'Mend the rift', desc: 'Wire 12 gold home. Stone, mortar, a lot of workers.', pay: 12, then: { restore: 2, fate: 1 }, go: (run, h) => h.say('[Transfer sent. Mended. Some of what fell in has climbed back out.]') },
  { label: 'Carry the halves together', desc: 'Hold both halves of its Heart. Heavy. You are stubborn.', then: { ward: 2, foe: { trait: 1 }, fate: 1 }, go: (run, h) => h.say('[It holds. Your next 2 losses cost no Heart. Your next opponent saw how tired you are, and has an extra trait.]') },
  { label: 'Split it for good', desc: 'Snap the Heart in two. Twice the plunder.', then: { piece: 'A', rune: 1, erase: 1, mod: 'bloodmoon', fate: -1, got: '[Twice the plunder. Kept, from the richer half: {item}.]', gotRune: '[From the other half: a rune, cut from the broken edge of your world.]' }, go: (run, h) => h.say('[Split. Everyone is angrier now.]') }] };

// A Golden Age: notice and gold
EVENTS.crisis_goldenage_1 = { crisis: true, fate: 'goldenage', title: 'The System Checks', text: run => `On the broadcast, nothing is wrong in ${run.world.name}. The System is checking again. A clerk is counting the festival lanterns.`, opts: [
  { label: 'Pay the inspection fee', desc: 'Pay the clerk 8 gold. Smile on air.', pay: 8, then: { notice: -2, fate: 1 }, go: (run, h) => h.say('[Fee received. Inspection passed. Nothing wrong. Again.]') },
  { label: 'Hide the festival', desc: 'Hold its Heart close until the clerk leaves.', then: { notice: -1, fate: 1 }, go: (run, h) => h.lose(0.1, 'You held the festival close until the clerk left. It was warm.') },
  { label: 'Give the System a reason', desc: 'Tell them, on air, to make a mess.', then: { piece: 'B', notice: 1, fate: -1, got: '[In the mess, nobody guards the treasury. Sent to you: {item}.]' }, go: (run, h) => h.say('[Something is wrong now. You made sure of it.]') }] };
EVENTS.crisis_goldenage_2 = { crisis: true, fate: 'goldenage', title: 'A Song About You', text: run => `The festival in ${run.world.name} has a new song. It is about you. The broadcast is playing it, and the System is listening.`, opts: [
  { label: 'Fund the festival', desc: 'Wire 12 gold home. Let them sing it louder.', pay: 12, then: { restore: 1, fate: 1 }, go: (run, h) => { h.say('[Transfer sent. They sing it louder. The System hums along, by accident.]'); if (run.world.mod === 'none') h.apply({ mod: 'golden' }); } },
  { label: 'Cancel the song', desc: 'Ask them on air to stop singing it.', then: { notice: -2, max_hp: -0.05, fate: 1 }, go: (run, h) => h.say('[Cancelled. The square is quiet. The System moves on.]') },
  { label: 'Burn the festival square', desc: 'Hold its Heart to a flame. Give the System its reason.', then: { piece: 'A', notice: 2, fate: -1, got: '[The only thing in the festival square that did not burn: {item}. Taken.]' }, go: (run, h) => h.say('[It burns well. Nothing in this world will be golden again.]') }] };

// Second crises after you used the first (thin content audit, 6 Nov). When the round 3 crisis was used (its Fate
// worsened), round 5 brings FATES[x].crisisIfUsed in place of the usual second crisis: the broadcast shows what using
// it did. The same three moves: make amends with gold, make amends yourself, or use it again.
EVENTS.crisis_longnight_2u = { crisis: true, fate: 'longnight', title: 'Sold to the Dark', text: run => `On the broadcast, ${run.world.name} is dark from end to end. The candles you sold are lighting another world. ${run.world.name} knows who sold them.`, opts: [
  { label: 'Buy the candles back', desc: 'Wire 14 gold home. Every one you sold.', pay: 14, then: { restore: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The candles come home, one window at a time.]') },
  { label: 'Apologise on air', desc: 'Say it while they sit in the dark.', then: { next: { weaken: 3 }, fate: 1 }, go: (run, h) => h.say('[They listen in the dark until you have finished. It costs you a night. You start your next fight Weakened for 3 turns.]') },
  { label: 'Sell the dark too', desc: 'There is a buyer for anything.', then: { gold: 15, notice: 1, fate: -1 }, go: (run, h) => h.say('[+15 gold. The System did not know the dark could be sold. It is interested now.]') }] };
EVENTS.crisis_plague_2u = { crisis: true, fate: 'plague', title: 'The Grey Arena', text: run => `The broadcast splits the screen: ${run.world.name}, grey on every door, and you in the arena, grey at the edges. The plague you carried in is famous here now.`, opts: [
  { label: 'Fund the quarantine', desc: 'Wire 12 gold home. Close the wall again.', pay: 12, then: { ward: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The wall closes. Your next loss costs no Heart.]') },
  { label: 'Bleed it out', desc: 'Give the doctors your blood for the cure.', then: { max_hp: -0.1, fate: 1 }, go: (run, h) => h.say('[They take what they need, and a little more. The cure works.]') },
  { label: 'Become the plague', desc: 'Let it all the way in.', then: { always: { foe: { poison: 3 } }, notice: 1, fate: -1 }, go: (run, h) => h.say('[Every opponent from now on starts poisoned. So does your world.]') }] };
EVENTS.crisis_hunger_2u = { crisis: true, fate: 'hunger', title: 'The Hoard Is Found', text: run => `The broadcast has found your grain hoard in ${run.world.name}. The crowd outside it is very quiet.`, opts: [
  { label: 'Open the hoard', desc: 'Wire 10 gold home for carts. Give it all back.', pay: 10, then: { heart: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The carts roll. Your world gains a page.]') },
  { label: 'Hand it out on air', desc: 'Name every family as they collect.', then: { restore: 1, fate: 1 }, go: (run, h) => h.lose(0.15, 'It takes all night. You do not eat either.') },
  { label: 'Sell the hoard', desc: 'Prices have never been better.', then: { gold: 25, notice: 1, fate: -1 }, go: (run, h) => h.say('[+25 gold. The crowd outside the hoard watches the carts leave.]') }] };
EVENTS.crisis_civilwar_2u = { crisis: true, fate: 'civilwar', title: 'Your Side Is Winning', text: run => `On the broadcast, the side you picked in ${run.world.name} is winning. The other side has put a price on your name.`, opts: [
  { label: 'Pay for a ceasefire', desc: 'Wire 12 gold home to the losing side.', pay: 12, then: { notice: -1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The ceasefire holds, for now. The System loses interest.]') },
  { label: 'Face their champion', desc: 'Let the losing side send someone for you.', then: { summon: { who: 'bram', bounty: { restore: 1 }, say: '[The losing side has hired a champion to answer you: Bram Coldwater. He is in your bracket.]' }, fate: 1 }, go: (run, h) => h.say('[Challenge accepted, on air. Beat him and a page of your world comes back.]') },
  { label: 'Finish the war', desc: 'Tell your side to end it.', then: { piece: 'A', notice: 1, fate: -1, got: '[The war is over. The winners send you the losers\' armoury: {item}.]' } }] };
EVENTS.crisis_silence_2u = { crisis: true, fate: 'silence', title: 'Collection Plate', text: run => `The broadcast shows the temples of ${run.world.name}. The offerings you took are missed. The priests now take collections in your name.`, opts: [
  { label: 'Return the offerings', desc: 'Wire 12 gold home to the temples.', pay: 12, then: { notice: -1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The plates are full again. Nobody says whose name was on them.]') },
  { label: 'Pray with them on air', desc: 'All night, to gods who do not answer.', then: { next: { weaken: 2 }, fate: 1 }, go: (run, h) => h.say('[You pray with them until morning. You start your next fight Weakened for 2 turns.]') },
  { label: 'Take the collection', desc: 'It is in your name.', then: { gold: 18, notice: 1, fate: -1 }, go: (run, h) => h.say('[+18 gold. The temples are emptier. The System is fuller.]') }] };
EVENTS.crisis_lastgen_2u = { crisis: true, fate: 'lastgen', title: 'Borrowed Tomorrow', text: run => `On the broadcast, the Naming Stone in ${run.world.name} has a crack across the last name. The future you spent is starting to show.`, opts: [
  { label: 'Pay for a new stone', desc: 'Wire 12 gold home. Room for new names.', pay: 12, then: { restore: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. A new stone goes up beside the old one. It is blank, and waiting.]') },
  { label: 'Give a Heart back', desc: 'Pay 1 Heart. Press it into the stone.', payHeart: 1, then: { notice: -1, fate: 1 }, go: (run, h) => h.say('[The crack closes. The System looks somewhere else.]') },
  { label: 'Spend the rest', desc: 'There is more tomorrow where that came from.', then: { erase: 1, piece: 'A', fate: -1, got: '[Spent. What it bought: {item}.]' } }] };
EVENTS.crisis_sundering_2u = { crisis: true, fate: 'sundering', title: 'The Crack Widens', text: run => `The broadcast shows ${run.world.name} from above. The crack you pushed is a canyon now, and both halves blame you.`, opts: [
  { label: 'Fund the bridges', desc: 'Wire 14 gold home. Bridges first, blame later.', pay: 14, then: { restore: 2, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The first bridge opens. People cross both ways.]') },
  { label: 'Hold the edges together', desc: 'Grip its Heart and do not let go.', then: { ward: 1, foe: { trait: 1 }, fate: 1 }, go: (run, h) => h.say('[Your hands shake all through your next fight. Your opponent notices. Your next loss costs no Heart.]') },
  { label: 'Mine the canyon', desc: 'The walls are full of something.', then: { piece: 'A', erase: 1, notice: 1, fate: -1, got: '[Dug out of your own world: {item}.]' } }] };
EVENTS.crisis_goldenage_2u = { crisis: true, fate: 'goldenage', title: 'Something Is Wrong Now', text: run => `The broadcast shows ${run.world.name}. The mess you made is the news. The festival is cancelled for the first time in a generation.`, opts: [
  { label: 'Pay for the repairs', desc: 'Wire 12 gold home. Put the square back.', pay: 12, then: { restore: 1, fate: 1 }, go: (run, h) => h.say('[Transfer sent. The square is swept. Next year, maybe.]') },
  { label: 'Take the blame on air', desc: 'All of it. By name.', then: { notice: -2, next: { weaken: 2 }, fate: 1 }, go: (run, h) => h.say('[They boo you for an hour, then forgive you. The System is bored. You start your next fight Weakened for 2 turns.]') },
  { label: 'Keep the System interested', desc: 'Give it another reason.', then: { piece: 'B', rune: 1, notice: 2, fate: -1, got: '[More mess, more treasure. Sent to you: {item}.]', gotRune: '[And a rune, from the rubble.]' } }] };
