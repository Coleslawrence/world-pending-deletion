// ===== [World Pending Deletion] — content: Undercity events that stand alone =====
// Option positions are permanent (run summaries store picks by place), so a reworked option keeps its place.
'use strict';
EVENTS.merchant = { title: 'Hooded merchant', theme: ['reaper', 'venom'], text: 'A merchant in the tunnels sells forbidden techniques. The price is a little of your life.', opts: [
  { label: 'Buy a technique', desc: 'Pay the way he asks. In blood.', then: { max_hp: -0.1, piece: 'B' } },
  { check: { stat: 'INT', hard: true }, label: 'Copy his best scroll', desc: 'Read it while he counts your coins.', then: { piece: 'B', notice: 1 } },
  { check: { luck: true }, label: 'Rummage through the crates', desc: 'He is not watching them.', go: (run, h) => { h.say('[Nobody saw. No price was paid.]'); h.piece(1); } },
  { label: 'Sell him a technique', desc: 'He buys too. He pays well.', can: run => run.bench.length > 0, go: (run, h) => h.sellLowest(2) },
  { label: 'Pay 1 Heart', desc: 'He wants a piece of your world.', payHeart: 1, then: { piece: 'A' } }] };

EVENTS.crowd = { title: 'The crowd chants', theme: 'system', text: 'The crowd is chanting your name. The gods are listening.', opts: [
  { label: 'Name your opponent', desc: 'Promise them a show. Then deliver.', then: { foe: { trait: 1 }, stakes: { win: { gold: 10, piece: 'B' } } }, reveal: '[Challenge accepted. Your opponent has been told, and has prepared. Win, and the crowd pays.]' },
  { check: { stat: 'STR' }, label: 'Lift the arena gate one-handed', desc: 'Give them a show they can feel.', then: { foe: { weaken: 2 }, notice: 1 }, reveal: '[Your next opponent saw that. They start Weakened for 2 turns.]' },
  { check: { stat: 'AGI' }, label: 'Run the arena wall', desc: 'Upside down, if possible. For one god.', go: (run, h) => { const gods = Object.keys(GODS), mine = GODS[run.patron] ? run.patron : h.pick(gods); h.favour(mine, 3); h.favour(h.pick(gods.filter(g => g !== mine)), -2); } },
  { label: 'Slip out the back', desc: 'Let them chant for someone else.', then: { notice: -1 }, go: (run, h) => h.heal(0.1, 'Rested.') }] };

// From the content cards event-the-large-chest.md and event-field-test.md (imported from the inspiration list)
EVENTS.large_chest = { title: 'Large Chest', theme: 'system', text: 'A chest the size of a cart sits alone in the tunnel. Nobody has claimed it. Nobody stands near it either.', opts: [
  { roll: { stat: 'LUK' }, label: 'Open it', desc: "It isn't locked. That is suspicious.", go: (run, h) => { h.say('[Contents verified: one piece of equipment.]'); h.piece(1); },
    fail: { then: { next: { bleed: 4 } }, go: (run, h) => { h.say('[Contents: teeth. You win the argument. You start your next fight with 4 Bleed.]', 'loss'); h.say('[It coughs up its last meal.]', 'loot'); h.piece(2); } } },
  { check: { stat: 'STR' }, label: 'Kick it first', desc: 'See if it kicks back.', then: { foe: { trait: 1 }, stakes: { win: { piece: 'A' } } }, reveal: '[It was a mimic. It follows you to the arena. Your next opponent has an extra trait; win, and the mimic pays out.]' },
  { check: { luck: true }, label: 'Pick the lock anyway', desc: 'Lucky hands know a real lock.', go: (run, h) => { h.say('[Contents verified. The System is surprised too.]'); h.piece(1); } },
  { label: 'Report it', desc: 'Let the System deal with it.', then: { notice: -1 }, reveal: '[Hazard reported. The System appreciates compliance.]' }] };

EVENTS.field_test = { title: 'Field Test', theme: ['arcanist', 'pyre'], text: 'A clerk in a scorched coat holds out a gauntlet with too many dials. "Experimental. Mandatory. Mostly."', opts: [
  { label: 'Field-test it', desc: 'It has a lot of dials.', then: { rune: 2, notice: 1 }, reveal: '[Experimental equipment issued. Please report all malfunctions.]' },
  { check: { stat: 'INT' }, label: 'Rewire it for your class', desc: 'Make it yours. Ignore the ticking.', then: { piece: 'B', next: { burn: 4 } }, go: (run, h) => h.say('[Rewired. It is still ticking. You start your next fight with 4 Burn.]', 'loss') },
  { label: 'Sign the waiver only', desc: 'Someone else can test it.', then: { gold: 8 }, reveal: '[Test subjects are compensated. +8 gold.]' }] };
