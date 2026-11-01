// ===== [World Pending Deletion] — content: event chain, The Letter =====
'use strict';
CHAINS.letter = { name: 'The Letter', start: 'letter_1', theme: 'reaper' };

EVENTS.letter_1 = { chain: 'letter', title: 'A letter from the Erased', text: 'Under your cot you find a letter from a champion whose world no longer exists. It ends with a crude map.', opts: [
  { label: 'Read it', desc: 'Follow the map.', then: { chain: { step: 'map', after: 1 } }, reveal: '[Map acquired. Destination: the old quarter.]' },
  { check: { stat: 'INT' }, label: 'Decipher the margins', desc: 'There is a second letter under the first.', then: { chain: { step: 'map', after: 1 } }, go: (run, h) => { const who = h.pick(RIVALS.filter(r => !run.met.includes(r))) || 'lyss'; run.sabotage = who; h.say(`[The margins name who erased them: ${ENEMIES[who].name}. They will appear among your next rivals, Weakened for 3 turns and with 15% less HP. The map is yours too.]`); } },
  { label: 'Sell it', desc: "Someone will pay for a dead world's secrets.", then: { gold: 12, chain: 'done' }, reveal: '[Sold. +12 gold. The buyer did not read it either.]' }] };

const toCache = { chain: { step: 'cache', after: 1 } };
EVENTS.letter_map = { chain: 'letter', title: 'The old quarter', text: "The letter's map leads to a rusted grate in the old quarter. A bored sentry leans on it.", opts: [
  { label: 'Bribe the sentry (5 gold)', desc: 'Go through', pay: 5, then: Object.assign({ notice: 1 }, toCache), reveal: '[Bribe accepted. Bribe logged.]' },
  { roll: { stat: 'AGI' }, label: 'Sneak past', desc: 'Wait for him to look away.', then: toCache, reveal: '[Through, unseen.]',
    fail: { then: Object.assign({ notice: 1 }, toCache), go: (run, h) => h.lose(0.15, 'He looked back. You got through anyway.') } },
  { check: { stat: 'STR' }, label: 'Force the grate', desc: 'Rust is only a suggestion.', then: Object.assign({ notice: 1 }, toCache), reveal: '[The grate gives, loudly. The sentry decides he saw nothing. The System did.]' },
  { check: { stat: 'AGI' }, label: "Pick the sentry's pocket", desc: 'Between one yawn and the next.', then: Object.assign({ gold: 6, notice: 1 }, toCache), reveal: '[Through, and +6 gold. The sentry will notice later. So will the System.]' },
  { check: { luck: true }, label: "There's another way in", desc: 'A loose stone, just there.', then: Object.assign({ gold: 5 }, toCache), reveal: '[Through, and someone dropped a purse on the way. +5 gold.]' },
  { label: 'Leave the map behind', desc: 'The next Entrant may need it more.', then: { restore: 1, chain: 'done' }, go: (run, h) => h.say('[Your kindness is recorded.]') }] };

EVENTS.letter_cache = { chain: 'letter', title: 'The cache', text: "Behind the grate: a box with the Erased champion's last possession, and a note. [I lost. Make sure it meant something.]", opts: [
  { label: 'Take it', desc: 'Whatever it is, it was theirs.', then: { chain: 'done' }, go: (run, h) => {
    if (h.meta) { h.meta.found = h.meta.found || {}; h.meta.found.lastwords = true; }
    if (!h.hasGift('lastwords')) { run.gifts.push('lastwords'); h.say('[Hidden Gift acquired: Last Words.]', 'class'); } else { run.gold += 10; h.say('[+10 gold]', 'loot'); }
  } },
  { label: 'Bury it with honours', desc: 'Make sure it meant something.', then: { heart: 1, chain: 'done' }, go: (run, h) => h.say('[Buried with honours. Your world grows by one memory.]') },
  { check: { stat: 'INT', hard: true }, label: 'Read the rest', desc: 'The handwriting gets smaller near the end.', then: { rune: 1, chain: 'done' }, go: (run, h) => {
    if (h.meta) { h.meta.found = h.meta.found || {}; h.meta.found.letter_note = true; }
    h.say('[The rest of the note: "Count the Entrants. Then count the worlds. They do not match."]', 'class');
  } }] };
