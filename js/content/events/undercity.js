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
