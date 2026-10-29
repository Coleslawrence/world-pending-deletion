// ===== [World Pending Deletion] — content: Undercity events that stand alone =====
'use strict';
EVENTS.merchant = { title: 'Hooded merchant', text: 'A merchant in the tunnels sells forbidden techniques. The price is a little of your life.', opts: [
  { label: 'Buy a technique', desc: 'Whatever he has under the hood.', go: (run, h) => { h.lose(0.1, 'The price is paid in blood.'); h.piece(1); } },
  { check: { stat: 'INT', hard: true }, label: 'Inspect his stock', desc: 'Half of these scrolls are fakes.', go: (run, h) => { h.lose(0.1, 'You picked the real one. The price is still blood.'); h.piece(2); } },
  { check: { luck: true }, label: 'Rummage through the crates', desc: 'He is not watching them.', go: (run, h) => { h.say('[Nobody saw. No price was paid.]'); h.piece(1); } },
  { label: 'Walk away', desc: 'Nothing happens' }] };

EVENTS.crowd = { title: 'The crowd chants', text: 'The crowd is chanting your name. The gods are listening.', opts: [
  { label: 'Show off', desc: 'Give the gods something to watch.', go: (run, h) => { const b = run.hp; run.hp = Math.max(1, run.hp - 8); h.say(`[You overdid it. −${b - run.hp} HP.]`, 'loss'); h.favour(h.pick(Object.keys(GODS)), 2); } },
  { check: { stat: 'STR' }, label: 'Lift the arena gate one-handed', desc: 'Give them a show they can feel.', then: { favour: { war: 2 } } },
  { check: { stat: 'AGI' }, label: 'Run the arena wall', desc: 'Upside down, if possible.', then: { favour: { trick: 2 } } },
  { label: 'Wave and rest', desc: 'Let them chant. You sit down.', go: (run, h) => { const b = run.hp; run.hp = Math.min(h.maxHp(), run.hp + 10); h.say(`[Rested. +${run.hp - b} HP.]`, 'loot'); } }] };

// From the content cards event-the-large-chest.md and event-field-test.md (imported from the inspiration list)
EVENTS.large_chest = { title: 'Large Chest', text: 'A chest the size of a cart sits alone in the tunnel. Nobody has claimed it. Nobody stands near it either.', opts: [
  { label: 'Open it', desc: "It isn't locked. That is suspicious.", go: (run, h) => { if (h.pick([true, false])) { h.say('[Contents verified: one piece of equipment.]'); h.piece(1); } else { h.say('[Contents: teeth. You win the argument.]'); h.lose(0.15, 'It bit first.'); h.say('[It coughs up its last meal.]', 'loot'); h.piece(2); } } },
  { check: { stat: 'STR' }, label: 'Kick it first', desc: 'See if it kicks back.', go: (run, h) => { h.say('[It was a mimic. It is now a box.]'); h.piece(2); } },
  { check: { luck: true }, label: 'Pick the lock anyway', desc: 'Lucky hands know a real lock.', go: (run, h) => { h.say('[Contents verified. The System is surprised too.]'); h.piece(1); } },
  { label: 'Leave it closed', desc: 'Some boxes stay shut.', reveal: '[Large Chest left unopened. The System notes your caution.]' }] };

EVENTS.field_test = { title: 'Field Test', text: 'A clerk in a scorched coat holds out a gauntlet with too many dials. "Experimental. Mandatory. Mostly."', opts: [
  { label: 'Field-test it', desc: 'It has a lot of dials.', go: (run, h) => { h.say('[Experimental equipment issued. Please report all malfunctions.]'); h.piece(2); h.lose(0.08, 'Malfunction logged.'); } },
  { check: { stat: 'INT' }, label: 'Read the safety notes', desc: 'There are eleven pages.', go: (run, h) => { h.say('[You found the off switch. Equipment issued intact.]'); h.piece(2); } },
  { label: 'Hand it back', desc: 'It is still ticking.', reveal: '[Refusal logged. Your file grows thicker.]' }] };
