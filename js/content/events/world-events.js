// ===== [World Pending Deletion] — content: Undercity events tied to Fates and Peoples =====
// Ten stand-alone events (thin content audit, 6 Nov). Each is tagged with a Fate and a People (fate:, people:), so it
// turns up WORLD_LEAN times as often in a world with either, and each has a line only that Fate or People can take.
// A Fate's line eases the Fate, at a price.
'use strict';

EVENTS.lamp_seller = { fate: 'longnight', people: 'league', title: 'The Lamp Seller', text: 'A seller has lamps that burn without oil. She swears they came from a world where the sun never set.', opts: [
  { label: 'Pay 5 gold', desc: 'For a lamp that never goes out.', pay: 5, then: { ward: 1 }, reveal: '[The lamp burns all night. Your next loss costs no Heart.]' },
  { roll: { stat: 'LUK' }, label: 'Ask where they came from', desc: 'She might tell the truth.', then: { rune: 1, gotRune: '[She tells the truth, and pays you to keep it quiet: a rune.]' },
    fail: { then: { notice: 1 }, reveal: '[She tells the System you asked. The System takes an interest.]' } },
  { check: { fate: 'longnight' }, label: 'Send one home', desc: 'The Lamp Ward could use it.', then: { fate: 1 }, go: (run, h) => h.lose(0.05, 'You carry it to the gate yourself.') },
  { check: { people: 'league' }, label: 'Show your guild seal', desc: 'Guild price.', then: { piece: 'C', got: '[Guild price is no price. She throws in a spare: {item}.]' } },
  { label: 'Sit by the lamps', desc: 'Just for a while.', then: {}, go: (run, h) => h.heal(0.1, 'You rest in the light.') }] };

EVENTS.quarantine = { fate: 'plague', people: 'archive', title: 'The Quarantine Line', text: 'A chalk line runs across the tunnel. Officials let nobody over without a clean bill of health.', opts: [
  { label: 'Wait in line', desc: 'It moves eventually.', then: { notice: -1 }, reveal: '[Three hours. The System notes your patience.]' },
  { roll: { stat: 'AGI' }, label: 'Slip over the chalk', desc: 'While they argue.', then: { piece: 'C', got: '[Nobody sees you. On the other side, an unwatched crate: {item}.]' },
    fail: { then: { next: { poison: 4 } }, reveal: '[Caught, and dosed with something "preventative". You start your next fight with 4 Poison.]' } },
  { check: { fate: 'plague' }, label: 'Help mark the sick doors', desc: 'Someone has to carry the chalk.', then: { fate: 1, max_hp: -0.05 }, reveal: '[Fewer doors are marked by evening. You do not feel quite right.]' },
  { check: { people: 'archive' }, label: 'Cite the quarantine statute', desc: 'Section, subsection, exemption.', then: { rune: 1, gotRune: '[Exemption granted, with a rune for your trouble.]' } }] };

EVENTS.ration_hall = { fate: 'hunger', people: 'council', title: 'The Ration Hall', text: 'Entrants eat for free here. The queue of locals behind you does not.', opts: [
  { label: 'Eat your fill', desc: 'You have a fight to win.', then: {}, go: (run, h) => h.heal(0.3, 'You eat in front of the queue.') },
  { label: 'Give your ration away', desc: 'To whoever is next.', then: { restore: 1 }, reveal: '[The woman next in line was from your world. A page of it comes back.]' },
  { check: { fate: 'hunger' }, label: 'Carry rations home', desc: 'Your world is hungrier.', then: { fate: 1 }, go: (run, h) => h.lose(0.1, 'You go without.') },
  { check: { people: 'council' }, label: 'Put it to a vote', desc: 'The Council votes on everything.', then: { gold: 6 }, reveal: '[The Council votes you double rations. You sell the second. +6 gold.]' }] };

EVENTS.two_banners = { fate: 'civilwar', people: 'crown', title: 'Two Banners', text: 'Two banners hang over the tunnel mouth. Each side wants you fighting under theirs.', opts: [
  { label: 'Fight under the red', desc: 'They pay on results.', then: { foe: { trait: 1 }, stakes: { win: { gold: 10 } } }, reveal: '[The red side sends word to your next opponent, to make it worth watching. Win, and they pay 10 gold.]' },
  { label: 'Fight under the blue', desc: 'They pay up front.', then: { gold: 4 }, reveal: '[Paid up front. +4 gold.]' },
  { check: { fate: 'civilwar' }, label: 'Fly both banners', desc: 'Let both sides claim you.', then: { fate: 1, notice: 1 }, reveal: '[Both sides cheer. The System notices you doing it.]' },
  { check: { people: 'crown' }, label: "Fly the Crown's colours", desc: 'Above both.', then: { piece: 'B', got: "[The Crown rewards loyalty in the old way: {item}.]" } }] };

EVENTS.silent_bell = { fate: 'silence', people: 'temple', title: 'The Silent Bell', text: 'A temple bell hangs in the tunnel with its clapper removed. Pilgrims ring it anyway.', opts: [
  { label: 'Ring it', desc: 'Someone might be listening.', then: {}, go: (run, h) => { h.say('[No sound. Someone hears it anyway.]'); h.favour(patronOf(run, h), 1); } },
  { roll: { stat: 'STR' }, label: 'Put the clapper back', desc: 'It is lying right there.', then: { piece: 'C', got: '[The bell rings for the first time in years. The pilgrims give you what they brought: {item}.]' },
    fail: { then: { next: { weaken: 2 } }, reveal: '[The bell is heavier than it looks. You start your next fight Weakened for 2 turns.]' } },
  { check: { fate: 'silence' }, label: 'Listen for an answer', desc: 'As long as it takes.', then: { fate: 1 }, go: (run, h) => h.lose(0.05, 'You kneel until your knees give out.') },
  { check: { people: 'temple' }, label: 'Lead the prayer', desc: 'The priests taught you the words.', then: { notice: -1 }, go: (run, h) => h.favour(patronOf(run, h), 2) }] };

EVENTS.toy_stall = { fate: 'lastgen', people: 'exiles', title: 'The Toy Stall', text: 'A stall sells toys. Nobody has bought one in years. The seller dusts them every morning.', opts: [
  { label: 'Pay 3 gold', desc: 'For a wooden horse.', pay: 3, then: { stats: { LUK: 2 } }, reveal: '[You keep it in your pocket. It feels lucky. +2 LUK.]' },
  { label: 'Ask why she stays', desc: 'Nobody else does.', then: {}, go: (run, h) => h.heal(0.15, 'She talks until you have both forgotten the tournament.') },
  { check: { fate: 'lastgen' }, label: 'Take one home', desc: 'For when someone needs it.', then: { fate: 1 }, go: (run, h) => h.lose(0.05, 'You make the trip between rounds.') },
  { check: { people: 'exiles' }, label: 'Recognise the old toys', desc: 'From a world already gone.', then: { piece: 'B', got: '[She has been waiting for someone who knew them. She gives you the last thing from that world: {item}.]' } }] };

EVENTS.rope_bridge = { fate: 'sundering', people: 'clans', title: 'The Rope Bridge', text: 'A rope bridge crosses a crack in the tunnel floor. It was not there yesterday. Neither was the crack.', opts: [
  { roll: { stat: 'AGI' }, label: 'Cross it', desc: 'Quickly.', then: { piece: 'C', got: '[On the far side, something somebody dropped: {item}.]' },
    fail: { then: { next: { bleed: 3 } }, reveal: '[A rope snaps. So does your grip. You start your next fight with 3 Bleed.]' } },
  { label: 'Go the long way', desc: 'Around the crack.', then: { gold: 2 }, reveal: '[It takes hours. You find 2 gold on the way.]' },
  { check: { fate: 'sundering' }, label: 'Lash the crack shut', desc: 'With the bridge ropes.', then: { fate: 1 }, go: (run, h) => h.lose(0.1, 'The rock fights back.') },
  { check: { people: 'clans' }, label: 'Race a clansman across', desc: 'Loser carries the winner back.', then: { stats: { AGI: 1, STR: 1 } }, reveal: '[You win, and still carry him back. +1 AGI, +1 STR.]' }] };

EVENTS.festival = { fate: 'goldenage', people: 'pilgrims', title: 'A Travelling Festival', text: 'A festival has set up in the tunnels. Nobody knows who invited it.', opts: [
  { label: 'Join the dancing', desc: 'Just one dance.', then: {}, go: (run, h) => h.heal(0.2, 'It was several dances.') },
  { check: { stat: 'STR' }, label: 'Win the strongman contest', desc: 'The prize is real gold.', then: { gold: 8 }, reveal: '[You lift the bell, the stand and the strongman. +8 gold.]' },
  { check: { fate: 'goldenage' }, label: "Teach them your world's song", desc: 'The one about the festival square.', then: { fate: 1, notice: 1 }, reveal: '[They sing it all night. The System hears it too.]' },
  { check: { people: 'pilgrims' }, label: 'Travel with them a while', desc: 'Pilgrims know the road.', then: { stats: { LUK: 2 } }, reveal: '[They teach you to read the road. +2 LUK.]' }] };

EVENTS.debt_collector = { fate: 'hunger', people: 'league', title: 'The Debt Collector', text: 'A collector holds a list of debts owed by worlds. Your world is on it.', opts: [
  { label: 'Pay 6 gold', desc: 'Clear your world off the list.', pay: 6, then: { restore: 1, notice: -1 }, reveal: '[Paid in full. A page of your world comes back.]' },
  { label: 'Tear up the list', desc: 'Every world on it.', then: { notice: 1, favour: { trick: 2 } }, reveal: '[Every world on the list owes you now. The System has a copy.]' },
  { roll: { stat: 'INT' }, label: 'Check his arithmetic', desc: 'Debts like these never add up.', then: { gold: 8 }, reveal: '[They do not add up. He pays you to stop counting. +8 gold.]',
    fail: { then: { notice: 1 }, reveal: '[They add up. He reports you for asking.]' } },
  { check: { fate: 'hunger' }, label: 'Pay him in seed', desc: 'The last good seed.', then: { fate: 1 }, go: (run, h) => h.lose(0.05, 'You carry the sack yourself.') },
  { check: { people: 'league' }, label: 'Refinance the debt', desc: 'At guild rates.', then: { gold: 10, notice: 1 }, reveal: '[Refinanced. You come out 10 gold ahead, on paper. The System reads paper.]' }] };

EVENTS.night_watch = { fate: 'longnight', people: 'council', title: 'The Night Watch', text: 'A watchman walks the tunnels without a light, out of habit. He knows where every Entrant sleeps.', opts: [
  { label: 'Walk his round with him', desc: 'He likes company.', then: { foe: { weaken: 2 } }, reveal: '[He shows you where your next opponent sleeps. They start Weakened for 2 turns.]' },
  { roll: { stat: 'AGI' }, label: 'Borrow his keys', desc: 'He will not notice.', then: { piece: 'C', got: '[A locker opens: {item}.]' },
    fail: { then: { notice: 1 }, reveal: '[He notices. So does the System.]' } },
  { check: { fate: 'longnight' }, label: 'Teach him the dawn song', desc: 'Your world sings it to the dark.', then: { fate: 1 }, go: (run, h) => h.lose(0.05, 'You sing all night.') },
  { check: { people: 'council' }, label: 'Vote him a lantern', desc: 'The Council will second it.', then: { gold: 4, notice: -1 }, reveal: '[Motion carried. He pays you 4 gold from the lantern fund.]' }] };
