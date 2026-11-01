// ===== [World Pending Deletion] — content: People visits =====
// A People's own event, sent to everyone in its world in one round (PEOPLES[x].visit = { at, event }). visit: true keeps it
// out of the Undercity. The other People customs need no event: they are rules (customOf in core.js).
'use strict';
// Free Council: the Long Vote. The Council puts a Tournament Amendment to the vote, and your vote counts
EVENTS.council_vote = { visit: true, people: 'council', title: 'The Long Vote', text: run => `The Free Council of ${run.world.name} has voted on the town clock for nine years. Today it votes on your tournament instead.`, opts: [
  { label: 'Vote for Sudden Death', desc: 'Shorter fights. Sharper ones.', then: { amend: 'sudden' }, go: (run, h) => h.custom() },
  { label: 'Vote for Extended Bouts', desc: 'Longer fights. Better paid.', then: { amend: 'extended' }, go: (run, h) => h.custom() },
  { label: 'Abstain', desc: 'The vote can run without you.', then: { gold: 5 }, go: (run, h) => h.say('[Abstention recorded. The vote is adjourned for another nine years. +5 gold.]') }] };
