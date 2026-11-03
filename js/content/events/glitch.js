// ===== [World Pending Deletion] — content: glitch events =====
// Events where the tournament's own data has gone wrong. glitch: true keeps an event to runs where glitches are on (never
// Pending World except on glitch day). Theme 'system': the System runs them, so they get its look. An option marked
// glitch: true shows as an inserted option: still a normal, pickable choice.
'use strict';
// Does the run hold anything glitched: a glitched piece, or a glitched prefix on a skill
const glitchesHeld = run => run.bar.concat(Object.values(run.gear), run.bench).filter(Boolean)
  .filter(p => (GEAR[p.id] || SKILLS[p.id] || {}).glitch || (p.mods || []).some(m => PREFIXES[m] && PREFIXES[m].glitch)).length + (run.phantom ? 1 : 0);

EVENTS.item_duplication = { glitch: true, weight: 0.6, title: 'Item Duplication', theme: 'system', text: '[Warning: inventory desync. One item is about to exist twice.] A copy of your gear flickers on the floor beside you.',
  can: run => Object.values(run.gear).some(Boolean) && !run.phantom, opts: [
  { label: 'Pick up the copy', desc: 'It looks real enough.', glitch: true, then: { notice: 2 }, go: (run, h) => h.phantom(3) },
  { label: 'Report the bug', desc: 'The System rewards honesty.', then: { gold: 6, notice: -2 }, reveal: '[Bug report received. Thank you, Entrant. +6 gold.]' },
  { label: 'Stamp on it', desc: 'Problem solved.', then: { gold: 3 }, reveal: '[Duplicate destroyed. Scrap value: 3 gold.]' }] };

EVENTS.option_not_found = { glitch: true, weight: 0.6, title: 'Option Not Found', theme: 'system', text: '[This event failed to load. Please select an option anyway.]', opts: [
  { label: 'Take the gold', desc: 'The only thing that loaded.', then: { gold: 8 }, reveal: '[Asset loaded: 8 gold.]' },
  { label: 'Rest in the static', desc: 'It hums. It is almost restful.', go: (run, h) => h.heal(0.3, 'The static settles.') },
  { label: 'Read the error log', desc: 'Someone should.', then: { stats: { INT: 1 } }, reveal: '[You learn more than you wanted to. +1 INT.]' },
  { label: '[option not found]', desc: '[description not found]', glitch: true, then: { notice: 1 }, go: (run, h) => h.anyOption() }] };

EVENTS.deja_vu = { glitch: true, weight: 0.6, title: 'Déjà Vu', theme: 'system', text: '[Notice: this event has already happened.] You have stood in this tunnel before. You are sure of it.',
  can: run => (run.seen || []).some(k => EVENTS[k] && !EVENTS[k].chain && !EVENTS[k].crisis && !EVENTS[k].visit && !EVENTS[k].glitch), opts: [
  { label: 'Live it again', desc: 'Choose differently this time.', glitch: true, then: { notice: 1 }, go: (run, h) => h.replay() },
  { label: 'Shake it off', desc: 'It is only a feeling.', then: { stats: { LUK: 1 } }, reveal: '[Memory discarded. +1 LUK.]' },
  { label: 'Remember forward', desc: 'Something that has not happened yet.', then: { foe: { weaken: 2 }, notice: 1 }, reveal: "[You remember your next opponent's first mistake. They start Weakened.]" }] };

EVENTS.out_of_bounds = { glitch: true, weight: 0.6, title: 'Out of Bounds', theme: 'system', text: 'A section of the arena wall renders a moment late. Behind it, there is no arena at all.', opts: [
  { label: 'Clip through', desc: 'Come out the other side.', glitch: true, then: { foe: { hp: -0.95 }, notice: 3 }, reveal: '[Collision error. Your next opponent loads with almost no HP.]' },
  { label: 'Hide in the gap', desc: 'Nobody can hit what is not there.', then: { ward: 1, notice: 1 }, reveal: '[Entrant position: undefined. Your next loss will not count.]' },
  { label: 'Report it', desc: 'Somebody will fall in.', then: { gold: 4, notice: -2 }, reveal: '[Wall patched. Thank you for your report. +4 gold.]' }] };

EVENTS.patch_window = { glitch: true, weight: 1.2, title: 'Patch Window', theme: 'system', text: '[Scheduled maintenance. Entrants holding unpatched content may submit it now.] A clerk holds out a tray.',
  can: run => glitchesHeld(run) > 0, opts: [
  { label: 'Submit a glitch', desc: 'Hand one over.', go: (run, h) => { h.patch(); h.say('[Compliance bonus: +10 gold.]', 'loot'); h.apply({ gold: 10, notice: -2 }); } },
  { label: 'Keep everything', desc: 'What glitches?', then: { notice: 1 }, reveal: '[Non-compliance logged.]' },
  { roll: { stat: 'INT' }, label: 'Patch it yourself', desc: 'How hard can it be?', then: { notice: -3 }, reveal: '[Self-patch accepted. Your glitches stay. Your record is clean.]',
    fail: { then: { notice: 2 }, reveal: '[Self-patch rejected. A report has been filed.]' } }] };
