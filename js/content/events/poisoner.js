// ===== [World Pending Deletion] — content: event chain, The Poisoner =====
// run.sabotage: a rival who turns up among your next rivals, Weakened for 3 turns and with 15% less HP
'use strict';
CHAINS.poisoner = { name: 'The Poisoner', start: 'poisoner_1', theme: 'venom' };
const unmetRival = (run, h, not) => h.pick(RIVALS.filter(r => r !== not && !run.met.includes(r)));

EVENTS.poisoner_1 = { chain: 'poisoner', title: 'Tampered water', text: 'Someone has tampered with your water skin. It smells of herbs and something worse.', opts: [
  { label: 'Drink it anyway', desc: 'It might be worth it.', then: { stats: { VIT: 2 }, next: { poison: 4 }, chain: 'done' }, reveal: '[+2 VIT. You start the next fight with 4 Poison.]' },
  { label: 'Investigate', desc: 'Find out who did it.', go: (run, h) => { run.chains.poisoner = { step: 'found', who: unmetRival(run, h) || 'lyss', due: run.round + 1 }; }, reveal: '[Inquiries made. A name will surface.]' },
  { check: { stat: 'VIT' }, label: 'Drink it. Learn the taste', desc: 'Your stomach has survived the tournament food.', then: { stats: { VIT: 2 }, next: { poison: 2 } }, go: (run, h) => { run.chains.poisoner = { step: 'found', who: unmetRival(run, h) || 'lyss', due: run.round + 1 }; }, reveal: '[+2 VIT. You start the next fight with 2 Poison. The taste has a name in it. It will surface.]' },
  { roll: { stat: 'INT' }, label: 'Identify the herb', desc: 'You know this smell. Probably.', then: { next: { foePoison: 6 }, chain: 'done' }, reveal: '[Nightroot. You coat your blade with it. Your next opponent starts with 6 Poison.]',
    fail: { then: { next: { poison: 4 }, chain: 'done' }, reveal: '[Wrong herb. You find out by tasting it. You start the next fight with 4 Poison.]' } },
  { check: { favour: 'ruin' }, label: 'Curse whoever did it', desc: 'Ruin knows their name already.', then: { chain: 'done', favour: { ruin: 1 } }, go: (run, h) => { const who = unmetRival(run, h) || 'lyss'; run.sabotage = who; h.say(`[${ENEMIES[who].name} will appear among your next rivals, Weakened for 3 turns and with 15% less HP.]`); } },
  { label: 'Take it to the Infirmary', desc: 'Let a healer deal with it.', then: { chain: 'done' }, go: (run, h) => h.heal(0.15, 'The healer keeps the water skin.') }] };

EVENTS.poisoner_found = { chain: 'poisoner', title: 'The poisoner', text: run => `A stable boy talks for a coin: it was ${ENEMIES[run.chains.poisoner.who].name}'s people who tampered with your water.`, opts: [
  { label: 'Expose them to the crowd', desc: 'Let the crowd judge them. Someone will enjoy it.', then: { chain: 'done', favour: { trick: 3 } } },
  { check: { stat: 'AGI', hard: true }, label: 'Swap their water', desc: 'And check their tent while you are there.', then: { gold: 5, chain: 'done' }, go: run => { run.sabotage = run.chains.poisoner.who; }, reveal: run => `[${ENEMIES[run.sabotage].name} will appear among your next rivals, Weakened for 3 turns and with 15% less HP. +5 gold from their tent.]` },
  { check: { favour: 'trick' }, label: 'Frame another entrant', desc: 'The Trickster has a candidate.', then: { chain: 'done', favour: { trick: 3 } }, go: (run, h) => { const who = run.chains.poisoner.who, other = unmetRival(run, h, who) || who; run.sabotage = other; h.say(`[${ENEMIES[other].name} takes the blame. They will appear among your next rivals, Weakened for 3 turns and with 15% less HP.]`); } },
  { label: 'Return the favour', desc: 'A taste of their own medicine.', then: { chain: 'done' }, go: run => { run.sabotage = run.chains.poisoner.who; }, reveal: run => `[${ENEMIES[run.sabotage].name} will appear among your next rivals, Weakened for 3 turns and with 15% less HP.]` }] };
