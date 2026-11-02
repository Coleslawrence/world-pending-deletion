// ===== [World Pending Deletion] — content: People visits =====
// A People's own event, sent to everyone in its world in one round (PEOPLES[x].visit = { at, event }). visit: true keeps it
// out of the Undercity. The other People customs need no event: they are rules (customOf in core.js).
'use strict';
// Free Council: the Long Vote. The Council puts a Tournament Amendment to the vote, and your vote counts
EVENTS.council_vote = { visit: true, people: 'council', title: 'The Long Vote', text: run => `The Free Council of ${run.world.name} has voted on the town clock for nine years. Today it votes on your tournament instead.`, opts: [
  { label: 'Vote for Sudden Death', desc: 'Shorter fights. Sharper ones.', then: { amend: 'sudden' }, go: (run, h) => { h.custom(); if (run.customUp) h.apply({ gold: 6 }); } },
  { label: 'Vote for Extended Bouts', desc: 'Longer fights. Better paid.', then: { amend: 'extended' }, go: (run, h) => { h.custom(); if (run.customUp) h.apply({ gold: 6 }); } },
  { label: 'Abstain', desc: 'The vote can run without you.', then: { gold: 5 }, go: (run, h) => h.say('[Abstention recorded. The vote is adjourned for another nine years. +5 gold.]') }] };

// A power struggle: in a world whose People contradicts its type's old ruler (PEOPLES[x].clash, WORLD_TYPES[t].ruler), both sides
// claim you in round 1, on air. Back the People and their custom pays more for the run (customUp); back the ruler and the custom
// is suspended for the run (customOff) for the ruler's bonus. Lore audit C4, 2 Nov.
const clashP = run => PEOPLES[run.world.people], clashR = run => WORLD_TYPES[run.world.type].ruler, the = n => /^The /.test(n) ? n : 'The ' + n;
EVENTS.power_struggle = { visit: true, title: 'Two Claims', text: run => `${the(clashP(run).name)} and ${clashR(run).name} both claim ${run.world.name}. ${clashR(run).line} Each side wants your name, on air, tonight.`, opts: [
  { label: 'Back the People', desc: 'They live how they live. Say so.', go: (run, h) => { run.customUp = true; h.custom(); h.say(`[${the(clashP(run).name)} backed. ${clashP(run).custom.name} pays more for the rest of the run.]`); } },
  { label: 'Back the old ruler', desc: 'Someone has to be in charge.', go: (run, h) => { run.customOff = true; h.apply(clashR(run).then); h.say(clashR(run).say); h.say(`[${clashP(run).custom.name} is suspended for this run.]`); } }] };
