// ===== [World Pending Deletion] — content: Undercity events that stand alone =====
// Option positions are permanent (run summaries store picks by place), so a reworked option keeps its place.
'use strict';
EVENTS.merchant = { fate: 'hunger', people: 'league', title: 'Hooded merchant', theme: ['reaper', 'venom'], text: 'A merchant in the tunnels sells forbidden techniques. The price is a little of your life.', opts: [
  { label: 'Buy a technique', desc: 'Pay the way he asks. In blood.', then: { max_hp: -0.1, piece: 'B', got: '[Price taken from your palm. In return, a bundle still warm: {item}.]' } },
  { check: { stat: 'INT', hard: true }, label: 'Copy his best scroll', desc: 'Read it while he counts your coins.', then: { piece: 'B', notice: 1, got: '[Scroll read once while he counted your coins. Once was enough. Copied: {item}.]' } },
  { check: { luck: true }, label: 'Rummage through the crates', desc: 'He is not watching them.', go: (run, h) => { h.say('[Nobody saw. No price was paid.]'); h.piece(1, '[Found under a false bottom in the third crate: {item}.]'); } },
  { label: 'Sell him a technique', desc: 'He buys too. He pays well.', can: run => run.bench.length > 0, go: (run, h) => h.sellLowest(2) },
  { label: 'Pay 1 Heart', desc: 'He wants a piece of your world.', payHeart: 1, then: { piece: 'A', got: '[He wraps the piece of your world with care. In exchange, his finest stock: {item}.]' } },
  { check: { people: 'league' }, label: 'Show him your guild seal', desc: 'Guild members pay guild prices.', then: { piece: 'B', got: '[Guild price for a guild member: nothing at all. Received: {item}.]' } },
  { check: { fate: 'hunger' }, label: 'Trade him bread', desc: 'Bread buys anything this year.', then: { piece: 'B', fate: -1, got: '[Bread exchanged. He wraps your purchase in the bread cloth: {item}.]' }, go: (run, h) => h.say('[The bread was meant for the Ration Bell.]') }] };

EVENTS.crowd = { fate: 'civilwar', people: 'temple', title: 'The crowd chants', theme: 'system', text: 'The crowd is chanting your name. The gods are listening.', opts: [
  { label: 'Name your opponent', desc: 'Promise them a show. Then deliver.', then: { foe: { trait: 1 }, stakes: { win: { gold: 10, piece: 'B', got: '[The crowd pays, as promised. +10 gold. Thrown into the arena: {item}.]' } } }, reveal: '[Challenge accepted. Your opponent has been told, and has prepared. Win, and the crowd pays.]' },
  { check: { stat: 'STR' }, label: 'Lift the arena gate one-handed', desc: 'Give them a show they can feel.', then: { foe: { weaken: 2 }, notice: 1 }, reveal: '[Your next opponent saw that. They start Weakened for 2 turns.]' },
  { check: { stat: 'AGI' }, label: 'Run the arena wall', desc: 'Upside down, if possible. For one god.', go: (run, h) => { const gods = Object.keys(GODS), mine = GODS[run.patron] ? run.patron : h.pick(gods); h.favour(mine, 3); h.favour(h.pick(gods.filter(g => g !== mine)), -2); } },
  { label: 'Slip out the back', desc: 'Let them chant for someone else.', then: { notice: -1 }, go: (run, h) => h.heal(0.1, 'Rested.') },
  { check: { people: 'temple' }, label: 'Bless the crowd', desc: 'The priests taught you the words.', then: { notice: -1 }, go: (run, h) => h.favour(GODS[run.patron] ? run.patron : h.pick(Object.keys(GODS)), 2) },
  { check: { fate: 'civilwar' }, label: 'Fight for both sides', desc: 'Let both halves of the crowd cheer.', then: { foe: { trait: 1 }, fate: 1 }, go: (run, h) => h.say('[Both sides cheer at once, for the first time in years. Your next opponent has an extra trait.]') }] };

// From the content cards event-the-large-chest.md and event-field-test.md (imported from the inspiration list)
EVENTS.large_chest = { fate: 'sundering', people: 'exiles', title: 'Large Chest', theme: 'system', text: 'A chest the size of a cart sits alone in the tunnel. Nobody has claimed it. Nobody stands near it either.', opts: [
  { roll: { stat: 'LUK' }, label: 'Open it', desc: "It isn't locked. That is suspicious.", go: (run, h) => { h.piece(1, '[Contents verified. On a cushion far too clean for a tunnel: {item}.]'); },
    fail: { then: { next: { bleed: 4 } }, go: (run, h) => { h.say('[Contents: teeth. You win the argument. You start your next fight with 4 Bleed.]', 'loss'); h.piece(2, '[It coughs up its last meal: {item}. Mostly intact.]'); } } },
  { check: { stat: 'STR' }, label: 'Kick it first', desc: 'See if it kicks back.', then: { foe: { trait: 1 }, stakes: { win: { piece: 'A', got: '[The mimic rolls over and spits out what it swallowed: {item}.]' } } }, reveal: '[It was a mimic. It follows you to the arena. Your next opponent has an extra trait; win, and the mimic pays out.]' },
  { check: { luck: true }, label: 'Pick the lock anyway', desc: 'Lucky hands know a real lock.', go: (run, h) => { h.piece(1, '[The lock gives. Contents verified: {item}. The System is surprised too.]'); } },
  { label: 'Report it', desc: 'Let the System deal with it.', then: { notice: -1 }, reveal: '[Hazard reported. The System appreciates compliance.]' },
  { check: { fate: 'sundering' }, label: 'Push it into the rift', desc: 'The rift takes offerings.', then: { gold: 5, fate: 1 }, go: (run, h) => h.say('[The rift swallows it whole. For a moment it stops growing. Something shiny bounces back out. +5 gold.]') },
  { check: { people: 'exiles' }, label: 'Read the old lock', desc: 'It is in the Old Tongue.', go: (run, h) => { h.say('[The lock is from a world that no longer exists. You know the word. It opens politely.]'); h.piece(3, '[Inside, packed in straw from a world already erased: {item}.]'); } }] };

EVENTS.field_test = { fate: 'plague', people: 'archive', title: 'Field Test', theme: ['arcanist', 'pyre'], text: 'A clerk in a scorched coat holds out a gauntlet with too many dials. "Experimental. Mandatory. Mostly."', opts: [
  { label: 'Field-test it', desc: 'It has a lot of dials.', then: { rune: 2, notice: 1, gotRune: '[The gauntlet shakes itself apart. Two dials still glow. Runes recovered.]' }, reveal: '[Field test complete. The gauntlet did not survive. Please report all malfunctions.]' },
  { check: { stat: 'INT' }, label: 'Rewire it for your class', desc: 'Make it yours. Ignore the ticking.', then: { piece: 'B', next: { burn: 4 }, got: '[Rewired for your class. Output reclassified: {item}.]' }, go: (run, h) => h.say('[It is still ticking. You start your next fight with 4 Burn.]', 'loss') },
  { label: 'Sign the waiver only', desc: 'Someone else can test it.', then: { gold: 8 }, reveal: '[Test subjects are compensated. +8 gold.]' },
  { check: { people: 'archive' }, label: 'Read the manual first', desc: 'It has footnotes. You love footnotes.', then: { rune: 1, gotRune: '[Footnote 14: how to remove the power core safely. The core is a rune. Kept.]' }, go: (run, h) => h.say('[Read, cross-referenced and annotated. Nothing ticks.]') },
  { check: { fate: 'plague' }, label: 'Test it on the plague', desc: 'It might burn the sickness out.', then: { max_hp: -0.05, fate: 1 }, go: (run, h) => h.say('[It burns the grey out of one street. And some of you.]') }] };
