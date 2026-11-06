// ===== [World Pending Deletion] — content: five short event chains =====
// Two steps each (thin content audit, 6 Nov): the first event sets something up, and a chosen path brings the second
// back a round or two later. Each belongs to a class that had no chain of its own.
'use strict';
CHAINS.shieldmaker = { name: 'The Shieldmaker', start: 'shieldmaker_1', theme: 'bastion' };
CHAINS.vigil = { name: 'The Candle Vigil', start: 'vigil_1', theme: 'zealot' };
CHAINS.jar = { name: 'Bottled Lightning', start: 'jar_1', theme: 'storm' };
CHAINS.duel = { name: 'The Practice Duel', start: 'duel_1', theme: 'blade' };
CHAINS.page = { name: 'The Missing Page', start: 'page_1', theme: 'arcanist' };

// The Shieldmaker: borrow a shield now, decide later whether to give it back
EVENTS.shieldmaker_1 = { chain: 'shieldmaker', title: 'A borrowed shield', text: 'An old smith lends shields from a rack in the tunnels. He wants each one back, every dent counted.', opts: [
  { label: 'Borrow a shield', desc: 'Bring it back after the round.', then: { stats: { VIT: 1 }, chain: { step: 'return', after: 1 } }, reveal: '[+1 VIT while you carry it. He will want it back.]' },
  { roll: { stat: 'STR' }, label: 'Test the whole rack', desc: 'Find the one that holds.', then: { stats: { VIT: 2 }, chain: { step: 'return', after: 1 } }, reveal: '[The third shield holds. +2 VIT while you carry it. He will want it back.]',
    fail: { then: { next: { weaken: 2 }, chain: 'done' }, reveal: '[The rack falls on you. You start your next fight Weakened for 2 turns.]' } },
  { check: { stat: 'VIT' }, label: 'Work his forge', desc: 'You can hold the hammer steady.', then: { piece: 'C', chain: 'done', got: '[He pays in kind for an afternoon at the anvil: {item}.]' } },
  { label: 'Leave the rack alone', desc: 'Someone will need them more.', then: { notice: -1, chain: 'done' }, reveal: '[The System notes your restraint.]' }] };
EVENTS.shieldmaker_return = { chain: 'shieldmaker', title: 'Every dent counted', text: 'The smith is waiting with his ledger. He counts every dent in your shield, out loud.', opts: [
  { label: 'Give it back', desc: 'He pays for what the dents taught him.', then: { gold: 6, chain: 'done' }, reveal: '[Each dent is worth a coin to him. +6 gold.]' },
  { label: 'Keep it', desc: 'He can make another.', then: { piece: 'B', notice: 1, chain: 'done', got: '[You keep it. Under the dents it is better than it looked: {item}.]' } },
  { check: { stat: 'VIT', hard: true }, label: 'Show him a fresh dent', desc: 'Take one more hit for his ledger.', then: { stats: { VIT: 1 }, chain: 'done' }, go: (run, h) => h.lose(0.1, 'He hits it with his hammer while you hold it. He has never seen a shield take that. Keep it. +1 VIT.') }] };

// The Candle Vigil: light your world's candle, and keep it burning or spend it
EVENTS.vigil_1 = { chain: 'vigil', title: 'A candle for you', text: 'A pilgrim is lighting a candle for every world still in the tournament. Yours is the only one dark.', opts: [
  { label: 'Light it yourself', desc: 'Someone should.', then: { chain: { step: 'kept', after: 2 } }, reveal: '[The candle is lit. Someone will have to keep it burning.]' },
  { label: 'Pay 4 gold for oil', desc: 'Enough to burn all tournament.', pay: 4, then: { restore: 1, chain: { step: 'kept', after: 2 } }, reveal: '[The flame steadies. A page of your world comes back.]' },
  { check: { favour: 'war' }, label: 'Ask War to watch it', desc: 'War keeps its own candles.', then: { chain: 'done', favour: { war: 1 } }, go: (run, h) => h.heal(0.2, 'War watches the candle. You rest.') },
  { label: 'Sell the candle', desc: 'Candles are scarce down here.', then: { gold: 3, chain: 'done' }, reveal: '[The pilgrim buys it back without a word. +3 gold.]' }] };
EVENTS.vigil_kept = { chain: 'vigil', title: 'Still burning', text: 'The pilgrim finds you again. Your candle is still burning. Barely.', opts: [
  { label: 'Trade the flame', desc: 'Burn it all at once.', then: { stats: { VIT: 2 }, chain: 'done' }, reveal: '[The candle goes out. Something of it stays in you. +2 VIT.]' },
  { label: 'Keep it burning', desc: 'However long it takes.', then: { heart: 1, chain: 'done' }, reveal: '[The flame holds. Your world gains a page. +1 max Heart.]' },
  { check: { stat: 'VIT' }, label: 'Carry it into the arena', desc: 'Shield it with your body.', then: { ward: 1, chain: 'done' }, reveal: '[You carry it into your next fight. Your next loss costs no Heart.]' }] };

// Bottled Lightning: a jar that wants out
EVENTS.jar_1 = { chain: 'jar', title: 'Bottled storm', text: 'A collector in the tunnels sells lightning in jars. One jar is rattling.', opts: [
  { label: 'Pay 5 gold for it', desc: 'The rattling one.', pay: 5, then: { chain: { step: 'cracks', after: 1 } }, reveal: '[The jar is warm. It will want out before long.]' },
  { roll: { stat: 'INT' }, label: 'Read the label', desc: 'In small print.', then: { next: { empower: 2 }, chain: 'done' }, reveal: '[Handling instructions. You use them on yourself. You start your next fight Empowered for 2 turns.]',
    fail: { then: { next: { weaken: 1 }, chain: 'done' }, reveal: '[The small print was a warning. You start your next fight Weakened for 1 turn.]' } },
  { check: { stat: 'STR' }, label: 'Hold one barehanded', desc: 'Lightning respects a grip.', then: { stats: { STR: 2 }, chain: 'done' }, go: (run, h) => h.lose(0.1, 'Your grip holds. +2 STR. The lightning does not respect it much.') },
  { label: 'Ask what they are for', desc: 'He likes to talk.', then: { chain: { step: 'cracks', after: 1 } }, reveal: '[He hands you a jar to hold while he explains. He forgets to take it back.]' }] };
EVENTS.jar_cracks = { chain: 'jar', title: 'The jar cracks', text: 'The jar you carried has started to crack. Something bright is looking out.', opts: [
  { label: 'Open it on your opponent', desc: 'Aim first.', then: { foe: { weaken: 3, hp: -0.1 }, chain: 'done' }, reveal: '[Your next opponent starts with 10% less HP, Weakened for 3 turns.]' },
  { label: 'Drink it', desc: 'It is probably fine.', then: { stats: { STR: 1, AGI: 1 }, chain: 'done' }, go: (run, h) => h.lose(0.1, '+1 STR, +1 AGI. It does not go down easily.') },
  { label: 'Sell it back to him', desc: 'Used jars fetch more.', then: { gold: 10, chain: 'done' }, reveal: '[A storm that has been carried is worth double. +10 gold.]' }] };

// The Practice Duel: a stranger with a wooden sword, and a rematch with steel
EVENTS.duel_1 = { chain: 'duel', title: 'A wooden sword', text: 'An Entrant you have never met offers a practice duel with wooden swords. The winner names a forfeit.', opts: [
  { roll: { stat: 'AGI' }, label: 'Accept the duel', desc: 'Wooden swords. Mostly.', then: { stats: { AGI: 2 }, chain: { step: 'rematch', after: 2 } }, reveal: '[You win. +2 AGI. Your forfeit: they owe you a rematch. They will come to pay it.]',
    fail: { then: { next: { bleed: 3 }, chain: { step: 'rematch', after: 2 } }, reveal: '[You lose. Their forfeit: a cut on your arm. You start your next fight with 3 Bleed. They promise a rematch.]' } },
  { check: { stat: 'AGI' }, label: 'Disarm them first', desc: 'Before they finish bowing.', then: { piece: 'C', chain: 'done', got: '[Their wooden sword was not wooden: {item}.]' } },
  { label: 'Decline politely', desc: 'Save it for the arena.', then: { chain: 'done' }, go: (run, h) => h.heal(0.1, 'You rest instead.') }] };
EVENTS.duel_rematch = { chain: 'duel', title: 'The rematch', text: 'The Entrant from the practice duel is back. With steel this time.', opts: [
  { label: 'Fight with steel', desc: 'They will tell your next opponent how you move.', then: { foe: { trait: 1 }, stakes: { win: { piece: 'B', got: '[They pay the forfeit with their own blade: {item}.]' } }, chain: 'done' }, reveal: '[Your next opponent has been told how you fight. Win anyway, and the forfeit is yours.]' },
  { label: 'Call it even', desc: 'A handshake and a coin.', then: { gold: 5, chain: 'done' }, reveal: '[They seem relieved. +5 gold.]' },
  { check: { stat: 'AGI', hard: true }, label: 'Teach them a move', desc: 'The one that beat them.', then: { notice: -1, chain: 'done', favour: { trick: 2 } }, reveal: '[They will use it against someone else. The Trickster enjoys that.]' }] };

// The Missing Page: a glowing page, and the archivist who wants it back
EVENTS.page_1 = { chain: 'page', title: 'A torn page', text: 'A page torn from a spellbook blows down the tunnel and sticks to your boot. It is still glowing.', opts: [
  { label: 'Keep the page', desc: 'Finders keepers.', then: { rune: 1, chain: { step: 'owner', after: 2 }, gotRune: '[The page folds itself into a rune. Someone will want the rest of their book back.]' } },
  { check: { stat: 'INT' }, label: 'Read it aloud', desc: 'Pronounce it carefully.', then: { next: { empower: 2 }, chain: 'done' }, reveal: '[The words stay with you. You start your next fight Empowered for 2 turns.]' },
  { label: 'Hand it to the System', desc: 'Lost property goes to the desk.', then: { notice: -1, chain: 'done' }, reveal: '[Filed. The System appreciates compliance.]' }] };
EVENTS.page_owner = { chain: 'page', title: "The book's owner", text: 'An archivist finds you. Their book is missing one page, and they know exactly which.', opts: [
  { label: 'Pay 6 gold for it', desc: 'Buy the page fairly.', pay: 6, then: { piece: 'B', chain: 'done', got: '[Paid. They sell you the rest of the book, cheap: {item}.]' } },
  { roll: { stat: 'INT' }, label: 'Argue you found it', desc: 'Finding is a kind of reading.', then: { rune: 1, chain: 'done', gotRune: '[They cannot fault the argument. They give you another page. It folds into a rune.]' },
    fail: { then: { notice: 1, chain: 'done' }, reveal: '[They file a complaint. It is very well written.]' } },
  { label: 'Copy it out for them', desc: 'By hand. It takes all night.', then: { stats: { INT: 1 }, chain: 'done' }, reveal: '[You remember most of it. +1 INT.]' }] };
