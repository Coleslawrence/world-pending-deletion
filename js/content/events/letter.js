// ===== [World Pending Deletion] — content: event chain, The Letter =====
'use strict';
CHAINS.letter = { name: 'The Letter', start: 'letter_1', theme: 'reaper' };

EVENTS.letter_1 = { chain: 'letter', title: 'A letter from the Erased', text: 'Under your cot you find a letter from a champion whose world no longer exists. It ends with a crude map.', opts: [
  { label: 'Read it', desc: 'Follow the map.', then: { chain: { step: 'map', after: 1 } }, go: (run, h) => { const k = h.pick(STATS); run.stats[k]++; h.say(`[+1 ${k}]`); } },
  { check: { stat: 'INT' }, label: 'Decipher the margins', desc: 'There is a second letter under the first.', then: { chain: { step: 'map', after: 1 } }, go: (run, h) => { const ks = h.shuffle(STATS).slice(0, 2); ks.forEach(k => run.stats[k]++); h.say(`[+1 ${ks[0]}, +1 ${ks[1]}. The map is yours.]`); } },
  { label: 'Sell it', desc: 'Someone will pay for a dead world\'s secrets.', then: { gold: 5, chain: 'done' }, reveal: '[Sold. +5 gold.]' }] };

EVENTS.letter_map = { chain: 'letter', title: 'The old quarter', text: "The letter's map leads to a rusted grate in the old quarter. A bored sentry leans on it.", opts: [
  { label: 'Bribe the sentry (5 gold)', desc: 'Go through', pay: 5, then: { chain: { step: 'cache', after: 1 } } },
  { label: 'Sneak past', desc: 'Wait for him to look away.', then: { chain: { step: 'cache', after: 1 } }, go: (run, h) => h.lose(0.15, 'He looked back. You got through anyway.') },
  { check: { stat: 'STR' }, label: 'Force the grate', desc: 'Rust is only a suggestion.', then: { chain: { step: 'cache', after: 1 } }, reveal: '[The grate gives. The sentry decides he saw nothing.]' },
  { check: { stat: 'AGI' }, label: 'Slip past the sentry', desc: 'Between one yawn and the next.', then: { chain: { step: 'cache', after: 1 } }, reveal: '[Through, unseen.]' },
  { check: { luck: true }, label: "There's another way in", desc: 'A loose stone, just there.', then: { gold: 5, chain: { step: 'cache', after: 1 } }, reveal: '[Through, and someone dropped a purse on the way. +5 gold.]' },
  { label: 'Give up', desc: 'Turn back. The map is lost.', then: { chain: 'done' } }] };

EVENTS.letter_cache = { chain: 'letter', title: 'The cache', text: "Behind the grate: a box with the Erased champion's last possession, and a note. [I lost. Make sure it meant something.]", opts: [
  { label: 'Take it', desc: 'Whatever it is, it was theirs.', then: { chain: 'done' }, go: (run, h) => {
    if (h.meta) { h.meta.found = h.meta.found || {}; h.meta.found.lastwords = true; }
    if (!h.hasGift('lastwords')) { run.gifts.push('lastwords'); h.say('[Hidden Gift acquired: Last Words.]', 'class'); } else { run.gold += 10; h.say('[+10 gold]', 'loot'); }
  } }] };
