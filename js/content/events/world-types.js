// ===== [World Pending Deletion] — content: Undercity events tied to world types =====
// Two for each world type (world expansion, 12 Nov). Each is tagged world: type, so it only comes up in a world of that
// type (or one joined to it in a Confluence), WORLD_LEAN times as often as an untagged event. Each is something from
// home turning up in the Undercity. added: 'x3' keeps them out of Pending World days before ADDED_FROM.x3.
'use strict';

// Drowned Isles
EVENTS.message_bottle = { world: 'drowned', added: 'x3', title: 'A Bottle Adrift', text: 'A corked bottle floats down the tunnel gutter. The note inside is in a hand from the Isles.', opts: [
  { label: 'Read it', desc: 'It is addressed to you.', then: {}, go: (run, h) => h.heal(0.15, 'It is from someone who still believes in you.') },
  { roll: { stat: 'INT' }, label: 'Follow the tide marks', desc: 'The bottle came from somewhere.', then: { piece: 'C', got: '[The marks lead to a flooded stall nobody has emptied: {item}.]' },
    fail: { then: { next: { weaken: 2 } }, reveal: '[They lead into deep water. You start your next fight Weakened for 2 turns.]' } },
  { label: 'Pay 4 gold', desc: 'For ink and a cork, to write back.', pay: 4, then: { ward: 1 }, reveal: '[You promise to come home. The System files the promise. Your next loss costs no Heart.]' }] };

EVENTS.salvage_diver = { world: 'drowned', added: 'x3', title: 'The Salvage Diver', text: 'A pearl diver from the Isles works the Undercity cisterns, bringing up what other worlds dropped.', opts: [
  { label: 'Pay 4 gold', desc: 'For whatever she brings up next.', pay: 4, then: { piece: 'B', got: '[She surfaces with {item}.]' } },
  { roll: { stat: 'VIT' }, label: 'Dive with her', desc: 'Hold your breath.', then: { gold: 7 }, reveal: '[You stay down longer than she does. She splits the haul. +7 gold.]',
    fail: { then: { next: { weaken: 1 } }, reveal: '[You come up coughing. You start your next fight Weakened.]' } },
  { label: 'Hold her line', desc: 'Someone has to.', then: { notice: -1 }, reveal: '[An hour of rope work. The System loses interest in you.]' }] };

// Burning Empire
EVENTS.deserters_fire = { world: 'burning', added: 'x3', title: "The Deserters' Fire", text: 'Soldiers from the Empire sit round a fire in the tunnels. They have left the legion. They have not told the legion.', opts: [
  { label: 'Share their fire', desc: 'They have rations.', then: {}, go: (run, h) => h.heal(0.2, 'They share their rations and their stories.') },
  { roll: { stat: 'STR' }, label: 'Spar with their captain', desc: 'She offers.', then: { stats: { STR: 2 } }, reveal: '[You win. She shows you the move that should have beaten you. +2 STR.]',
    fail: { then: { next: { burn: 3 } }, reveal: '[You lose, and land in the fire. You start your next fight with 3 Burn.]' } },
  { label: 'Sell their names', desc: 'The legion pays for deserters.', then: { gold: 8, notice: 1 }, reveal: '[The legion pays. The System notices who you sold.]' }] };

EVENTS.ember_forge = { world: 'burning', added: 'x3', title: 'The Field Forge', text: 'An Empire field forge glows in a side tunnel. The smith will temper one piece for an Entrant from home.', opts: [
  { label: 'Pay 5 gold', desc: 'Smith work is not free.', pay: 5, then: { piece: 'C', got: '[The smith tempers {item} in the coals.]' } },
  { roll: { stat: 'INT' }, label: 'Read the anvil marks', desc: 'Old legion script.', then: { rune: 1, gotRune: '[The marks are a rune recipe. You copy it down.]' },
    fail: { then: { next: { burn: 3 } }, reveal: '[You lean too close to the coals. You start your next fight with 3 Burn.]' } },
  { label: 'Work the bellows', desc: 'For an hour.', then: { gold: 3 }, reveal: '[The smith pays in coin and sweat. +3 gold.]' }] };

// Hollow Kingdom
EVENTS.grave_lantern = { world: 'hollow', added: 'x3', title: 'A Grave Lantern', text: 'A lantern from a Hollow Kingdom graveside burns in a tunnel niche. Someone is still tending it.', opts: [
  { label: 'Tend it a while', desc: 'Trim the wick.', then: { notice: -1 }, reveal: '[The dead are patient company. The System loses interest in you.]' },
  { label: 'Tell it your news', desc: 'As they do at home.', then: {}, go: (run, h) => h.heal(0.15, 'You talk until the wick burns low. It helps.') },
  { roll: { stat: 'LUK' }, label: 'Find who keeps it', desc: 'They cannot be far.', then: { piece: 'C', got: '[A very polite ghost. It gives you what it was buried with: {item}.]' },
    fail: { then: { next: { poison: 3 } }, reveal: '[Only grave dust. You start your next fight with 3 Poison.]' } }] };

EVENTS.bone_setter = { world: 'hollow', added: 'x3', title: 'The Bone-Setter', text: 'A bone-setter from the Hollow Kingdom keeps a stall here. She has set every bone there is, some of them twice.', opts: [
  { label: 'Pay 3 gold', desc: 'To be set straight.', pay: 3, then: {}, go: (run, h) => h.heal(0.35, 'She resets what the tournament put out of place.') },
  { roll: { stat: 'VIT' }, label: 'Try the old cure', desc: 'It hurts, she says.', then: { max_hp: 0.05 }, reveal: '[It hurts in the lasting way. +5% max HP.]',
    fail: { then: { next: { weaken: 2 } }, reveal: '[It hurts in the other way. You start your next fight Weakened for 2 turns.]' } },
  { label: 'Sort her bones', desc: 'They came unlabelled.', then: { gold: 3 }, reveal: '[Two hundred and six, and a spare. +3 gold.]' }] };

// Verdant Wilds
EVENTS.fey_bargain = { world: 'verdant', added: 'x3', title: 'A Fey Bargain', text: 'Someone from the Wilds offers you a bargain. They will say what it gives only after you shake.', opts: [
  { label: 'Shake on it', desc: 'It costs a little of you: 5% max HP.', then: { max_hp: -0.05, stats: { AGI: 2 } }, reveal: '[It gives speed back for what it took. +2 AGI.]' },
  { roll: { stat: 'LUK' }, label: 'Haggle', desc: 'Nobody wins a fey bargain.', then: { piece: 'B', got: '[You win, which never happens. They pay up: {item}.]' },
    fail: { then: { notice: 1 }, reveal: '[You lose the haggle. The System was watching.]' } },
  { label: 'Refuse politely', desc: 'Very politely.', then: { gold: 2 }, reveal: '[They respect a polite refusal. They leave 2 gold, for manners.]' }] };

EVENTS.antler_stall = { world: 'verdant', added: 'x3', title: 'The Charm Stall', text: 'A stall from the Antler Fair sells charms against the forest. Half of them work.', opts: [
  { label: 'Pay 4 gold', desc: 'For a charm, chosen by the seller.', pay: 4, then: { stats: { LUK: 2 } }, reveal: '[It is one of the working ones. +2 LUK.]' },
  { roll: { stat: 'AGI' }, label: 'Pick the working half', desc: 'Quickly, before she notices.', then: { piece: 'C', got: '[You pick well. Under the charms, something better: {item}.]' },
    fail: { then: { next: { bleed: 2 } }, reveal: '[A thorn charm, held the wrong way up. You start your next fight with 2 Bleed.]' } },
  { label: 'Trade a story', desc: 'Of the forest at home.', then: {}, go: (run, h) => h.heal(0.1, 'She trades one back. It is mostly true.') }] };

// Sky Reaches
EVENTS.fallen_satchel = { world: 'sky', added: 'x3', title: 'The Fallen Satchel', text: "A courier's satchel from the Sky Reaches has dropped through a grate. It is still sealed.", opts: [
  { label: 'Deliver it', desc: 'The address is legible.', then: { gold: 3, notice: -1 }, reveal: '[The recipient tips well, and the System approves. +3 gold.]' },
  { roll: { stat: 'INT' }, label: 'Lift the seal neatly', desc: 'And put it back.', then: { rune: 1, gotRune: '[Spell notes. Nobody will miss one rune.]' },
    fail: { then: { notice: 1 }, reveal: '[The seal shrieks. The System notices.]' } },
  { label: 'Sell the satchel', desc: 'Leather fetches a price.', then: { gold: 5 }, reveal: '[+5 gold. Somebody in the Reaches waits for a letter.]' }] };

EVENTS.chain_walker = { world: 'sky', added: 'x3', title: 'The Chain-Walker', text: 'A chain-walker from the Reaches has strung a line across a shaft. She gives lessons.', opts: [
  { label: 'Pay 3 gold', desc: 'For a lesson.', pay: 3, then: { stats: { AGI: 2 } }, reveal: '[You learn to keep your balance where there is nothing to keep it on. +2 AGI.]' },
  { roll: { stat: 'AGI' }, label: 'Cross without a lesson', desc: 'How hard can it be.', then: { piece: 'C', got: '[You make it. On the far side, a crate nobody else could reach: {item}.]' },
    fail: { then: { next: { weaken: 2 } }, reveal: '[You make it, eventually. You start your next fight Weakened for 2 turns.]' } },
  { label: 'Hold the line for her', desc: 'Steady.', then: { gold: 2 }, reveal: '[She pays the line-holder. +2 gold.]' }] };

// Iron Hold
EVENTS.tunnel_map = { world: 'iron', added: 'x3', title: 'The Tunnel Map', text: 'A miner from Iron Hold sells maps of the tunnels. These tunnels.', opts: [
  { label: 'Pay 3 gold', desc: 'For a map.', pay: 3, then: { notice: -1 }, reveal: '[You take the quiet ways round. The System loses track of you.]' },
  { roll: { stat: 'INT' }, label: 'Read it over her shoulder', desc: 'For free.', then: { piece: 'C', got: '[You spot a cache marked on the map: {item}.]' },
    fail: { then: { notice: 1 }, reveal: '[She notices. So does the System.]' } },
  { label: 'Trade news of home', desc: 'She has been down here a while.', then: {}, go: (run, h) => h.heal(0.15, 'She has not heard a voice from the Hold in years. She makes you tea.') }] };

EVENTS.hearth_oath = { world: 'iron', added: 'x3', title: 'The Hearth Oath', text: 'Soldiers from Iron Hold swear an oath at a shared fire before every siege. They are swearing it now.', opts: [
  { label: 'Swear with them', desc: 'The System files every oath.', then: { stats: { VIT: 2 }, notice: 1 }, reveal: '[The oath is binding. +2 VIT. The System files it.]' },
  { roll: { stat: 'VIT' }, label: 'Keep the fire all night', desc: 'It must not go out.', then: { ward: 1 }, reveal: '[The fire holds. The oath covers you too. Your next loss costs no Heart.]',
    fail: { then: { next: { weaken: 1 } }, reveal: '[You doze. The fire nearly goes out. You start your next fight Weakened.]' } },
  { label: 'Bring them wood', desc: 'From the next tunnel.', then: { gold: 3 }, reveal: '[They pay for wood like it was iron. +3 gold.]' }] };

// Thunder Steppes
EVENTS.herd_rider = { world: 'steppes', added: 'x3', title: 'A Tunnel Horse', text: 'A rider from the Steppes has brought a horse into the Undercity. Nobody knows how.', opts: [
  { label: 'Pay 4 gold', desc: 'For a ride to your next fight.', pay: 4, then: { next: { empower: 1 } }, reveal: '[You arrive at a gallop. You start your next fight Empowered.]' },
  { roll: { stat: 'STR' }, label: 'Break the wild one', desc: 'She has two.', then: { stats: { STR: 2 } }, reveal: '[It throws you nine times. The tenth, it does not. +2 STR.]',
    fail: { then: { next: { weaken: 2 } }, reveal: '[It throws you ten times. You start your next fight Weakened for 2 turns.]' } },
  { label: 'Brush the horse', desc: 'It looks homesick.', then: {}, go: (run, h) => h.heal(0.1, 'So do you, it turns out. It helps.') }] };

EVENTS.thunder_count = { world: 'steppes', added: 'x3', title: 'The Thunder Count', text: 'A storm reader from the Steppes counts between flash and thunder. She swears there is a storm down here too.', opts: [
  { label: 'Count with her', desc: 'One, two, three.', then: { notice: -1 }, reveal: '[You count to three together. The System loses count of you.]' },
  { roll: { stat: 'LUK' }, label: 'Count past three', desc: 'Nobody ever has.', then: { rune: 1, gotRune: '[You count to four. She gives you a rune for it, very quietly.]' },
    fail: { then: { next: { weaken: 1 } }, reveal: '[The thunder comes on two. You start your next fight Weakened.]' } },
  { label: 'Pay 3 gold', desc: 'For a reading of your next opponent.', pay: 3, then: { foe: { weaken: 2 } }, reveal: '[She reads a storm over them. Your next opponent starts Weakened for 2 turns.]' }] };

// Coin Marches
EVENTS.knucklebones = { world: 'marches', added: 'x3', title: 'Knucklebones', text: 'Players from the Coin Marches have a game of knucklebones going. Entrants are welcome. Entrants lose.', opts: [
  { roll: { stat: 'LUK' }, label: 'Play a hand', desc: 'Stakes are whatever you have.', then: { gold: 8 }, reveal: '[You win, and they cheer you for it. +8 gold.]',
    fail: { then: { notice: 1 }, reveal: '[You lose loudly. The System enjoys it.]' } },
  { label: 'Pay 3 gold', desc: 'To watch and learn.', pay: 3, then: { stats: { LUK: 2 } }, reveal: '[You learn how the bones fall. +2 LUK.]' },
  { label: 'Walk on', desc: 'Not today.', then: { gold: 1 }, reveal: '[You find a coin someone dropped on the way out. +1 gold.]' }] };

EVENTS.debt_note = { world: 'marches', added: 'x3', title: 'A Debt Note', text: 'A clerk from the Marches holds a note: your world owes a debt. It can be settled with coin, or with a throw.', opts: [
  { roll: { stat: 'LUK' }, label: 'Throw for it', desc: 'Double or nothing.', then: { restore: 1 }, reveal: '[You win the throw. The debt is struck out, and a page of your world comes back.]',
    fail: { then: { notice: 1 }, reveal: '[You lose. The debt stands, and the System hears about it.]' } },
  { label: 'Pay 6 gold', desc: 'Settle it properly.', pay: 6, then: { ward: 1 }, reveal: '[The clerk stamps a pardon on your next loss. It costs no Heart.]' },
  { label: 'Ask for time', desc: 'Clerks love paperwork.', then: { gold: 2 }, reveal: '[The clerk grants an extension and, oddly, a 2 gold advance.]' }] };

// Crooked Fens
EVENTS.black_water = { world: 'fens', added: 'x3', title: 'The Black Bowl', text: 'An omen reader from the Fens sits with a bowl of black water. For a copper she reads it.', opts: [
  { label: 'Pay 2 gold', desc: 'She is cheap. She is never wrong.', pay: 2, then: { foe: { weaken: 1 } }, reveal: '[The omen is bad, for your next opponent. It starts Weakened.]' },
  { roll: { stat: 'LUK' }, label: 'Read it yourself', desc: 'How hard can it be.', then: { stats: { LUK: 2 } }, reveal: '[You read a good ending. Nobody has before. +2 LUK.]',
    fail: { then: { next: { weaken: 2 } }, reveal: '[You read your own ending. You start your next fight Weakened for 2 turns.]' } },
  { label: 'Look away', desc: 'Some things are better not known.', then: { notice: -1 }, reveal: '[Not knowing is its own luck. The System loses interest.]' }] };

EVENTS.ferry_cat = { world: 'fens', added: 'x3', title: "The Ferryman's Cat", text: 'A black cat from the Fens sits in the middle of the tunnel and will not move.', opts: [
  { label: 'Go round it', desc: 'The long way.', then: { gold: 2 }, reveal: '[The long way has its own luck. +2 gold.]' },
  { label: 'Step over it', desc: 'Costs 1 LUK, they say.', then: { stats: { LUK: -1 }, piece: 'C', got: '[Bad luck, as promised. It was sitting on {item}.]' } },
  { roll: { stat: 'AGI' }, label: 'Pick it up', desc: 'Gently.', then: { rune: 1, gotRune: '[It lets you. It was sitting on a rune.]' },
    fail: { then: { next: { bleed: 2 } }, reveal: '[It does not let you. You start your next fight with 2 Bleed.]' } }] };

// Harvest Vales
EVENTS.tithe_cart = { world: 'vales', added: 'x3', title: 'The Tithe Cart', text: 'A tithe cart from the Vales rolls through the tunnels with nobody leading it.', opts: [
  { label: 'Take a sheaf', desc: 'It is owed to somebody.', then: { gold: 4, notice: 1 }, reveal: '[Four gold of grain. The cart has a long memory, and so does the System.]' },
  { label: 'Walk beside it', desc: 'It goes slowly.', then: {}, go: (run, h) => h.heal(0.2, 'You rest as you walk. It feels like harvest home.') },
  { roll: { stat: 'STR' }, label: 'Stop the cart', desc: 'And see who it is for.', then: { piece: 'C', got: "[Under the sheaves, someone's tools: {item}.]" },
    fail: { then: { next: { weaken: 2 } }, reveal: '[The cart does not stop. You start your next fight Weakened for 2 turns.]' } }] };

EVENTS.gleaners = { world: 'vales', added: 'x3', title: 'The Gleaners', text: 'Gleaners from the Vales pick through whatever other Entrants have dropped.', opts: [
  { label: 'Pay 3 gold', desc: 'For the best of the gleanings.', pay: 3, then: { piece: 'C', got: '[They sell you the best of it: {item}.]' } },
  { label: 'Glean with them', desc: 'Bent double, for an hour.', then: { gold: 3 }, reveal: '[Other worlds drop a lot. +3 gold.]' },
  { roll: { stat: 'LUK' }, label: 'Look for the last sheaf', desc: 'There is always one.', then: { restore: 1 }, reveal: '[You find it. A page of home comes back with it.]',
    fail: { then: { notice: 1 }, reveal: '[Only straw. The System saw you looking.]' } }] };
