// ===== [World Pending Deletion] — content: the Remnant =====
'use strict';
// The player is a Remnant (canon, Slaw 12 Nov; lore/drafts/handler.md): someone whose world was erased, who accepted
// the System's offer instead of being erased with it. Their role is Handler: one Entrant per world. Their world stays on
// file, but its name was erased with it and is never shown.
// The Remnant file starts empty. Over many runs the player recovers memories of their world, in reverse: the last day
// first, the earliest memory last. Each entry offers 3 options; the player picks one and may change it later (Slaw).
// Each memory places an object in the Handler's Quarters. Story only: no memory changes a fight.
//   k: the entry's id (meta.remnant.mem[k] holds the pick). label: shown on the file. ask: the question.
//   opts: fixed options, or from: 'arch' | 'fate' | 'people' | 'type' (3 drawn once per player from that list).
//   Each option (or the from-list's obj function) gives the Quarters object: name, lore.
// Entries open as the player finishes runs: one more at each REMNANT_AT runs (normal runs and Pending World, not practice).
const REMNANT_AT = [1, 2, 4, 6, 9, 12, 16, 20];
const REMNANT_ENTRIES = [
  { k: 'fell', label: 'How it fell', ask: 'How did your world fall?', opts: [
    { t: 'In the final. One blow short.', obj: { name: 'A Final Bracket Sheet', lore: 'Your name, one line from the top. Someone has crossed it out, neatly.' } },
    { t: 'In the qualifiers, before anyone learned my name.', obj: { name: 'A Torn Qualifier Ticket', lore: 'Admit one. Return not expected.' } },
    { t: 'To a Gatekeeper who never looked at me.', obj: { name: "A Gatekeeper's Token", lore: '[Passage is a privilege.] It was not yours.' } },
  ] },
  { k: 'was', label: 'What you were', ask: 'What kind of Entrant were you?', from: 'arch',
    text: k => `A ${ARCH[k].name}. ${ARCH[k].line}`,
    obj: k => ({ name: `Your Old Entrant Tag`, lore: `[Path on file: ${ARCH[k].path}. Entrant status: retired. Remnant status: active.]` }) },
  { k: 'saw', label: 'The last thing you saw', ask: 'What is the last thing you saw?', opts: [
    { t: 'The sky closing.', obj: { name: 'A Piece of Sky', lore: 'Blue on one side. Nothing at all on the other.' } },
    { t: 'My home, on the arena screen.', obj: { name: 'A Cracked Broadcast Still', lore: 'The last frame they showed. Your street is in the corner.' } },
    { t: 'Someone in the stands, waving. I never learned who.', obj: { name: "A Stranger's Ribbon", lore: 'Tied to the arena rail. You took it. Nobody came for it.' } },
  ] },
  { k: 'fate', label: 'What was going wrong', ask: 'What was already going wrong?', from: 'fate',
    text: k => `${FATES[k].name}. ${FATES[k].line}`,
    obj: k => ({ name: 'A Fate Notice', lore: `[Fate on file: ${FATES[k].name}. Status: sealed with the world.]` }) },
  { k: 'people', label: 'Who lived there', ask: 'Who were your people?', from: 'people',
    text: k => `${PEOPLES[k].name}. ${PEOPLES[k].line}`,
    obj: k => ({ name: `A Token of ${PEOPLES[k].name.replace(/^The /, 'the ')}`, lore: 'All that is left of the people you came from. It still smells of home.' }) },
  { k: 'ruled', label: 'Who ruled', ask: 'Who ruled your world?', opts: [
    { t: 'A crown that thought it would last.', obj: { name: 'A Bent Coronet', lore: 'It fitted someone once. It was never meant to fit you.' } },
    { t: 'A council, still voting at the end.', obj: { name: 'An Unfinished Ballot', lore: 'The count stopped at a tie. It is still a tie.' } },
    { t: 'Nobody. We liked it that way.', obj: { name: 'A Blank Proclamation', lore: 'Nobody signed it. That was the point.' } },
  ] },
  { k: 'type', label: 'What kind of world', ask: 'What kind of world was it?', from: 'type',
    text: k => `${WORLD_TYPES[k].name}. ${WORLD_TYPES[k].flavour}`,
    obj: k => ({ name: 'A Handful of Home', lore: `Soil from the ${WORLD_TYPES[k].name}. The name of the place did not survive. The soil did.` }) },
  { k: 'before', label: 'Before the sky opened', ask: 'Who were you, before you were an Entrant?', opts: [
    { t: 'A nobody, with a job and a street.', obj: { name: 'A Front Door Key', lore: 'The door is gone. You kept the key.' } },
    { t: "Somebody's child. Somebody's friend.", obj: { name: 'A Folded Letter', lore: 'Written to you before the sky opened. You know it by heart and read it anyway.' } },
    { t: 'Already a fighter. Never for anything that mattered.', obj: { name: 'A Practice Sword', lore: 'Blunted, notched, loved. It never met a real opponent.' } },
  ] },
];
// Recognition lines (Slaw, 12 Nov): when a run touches the world you remembered. Text only.
//   type/fate/people: a System line before your first fight in a world that shares it. final: your remembered type's Final Champion.
const REMNANT_LINES = {
  type: w => `[Note to Handler: ${w} is the same kind of world as your world of origin. Try not to stare.]`,
  fate: f => `[Note to Handler: this world's Fate is ${f}. Yours was too. You know how it goes.]`,
  people: p => `[Note to Handler: ${p} live here. So did your people. They do not know you. Yet.]`,
  final: '"You are from one of my worlds. I heard it went quiet. I am sorry. Now fight."',
};
// The Handler's Quarters: what each piece of decor says when inspected, and which screen it opens (Slaw, 12 Nov:
// every object has lore and does something; no object changes a run). use: [button label, ui action, data].
const DECOR_USE = {
  chair: { lore: 'You sit. For a moment nothing is being judged. The moment ends.', use: ['Sit', 'sheet', 'remnant'] },
  dummy: { lore: 'Every Handler trains on one. Yours has a face drawn on it. You did not draw it.', use: ['Train', 'practice'] },
  rug: { lore: 'The festival it was woven for is next month, in a world you spared.', use: ['Look at the pattern', 'sheet', 'halls'] },
  lantern: { lore: 'It burns without oil. The System has filed a complaint about it.', use: ['Read by it', 'sheet', 'pages'] },
  shelf: { lore: 'One handbook is open on its own, at a page about you.', use: ['Read the notes', 'sheet', 'notes'] },
  window: { lore: "Today it shows a world everyone is fighting for. Tomorrow, another.", use: ["Look at today's world", 'sheet', 'daily'] },
  screen: { lore: 'The System recorded every match you called. It wants you to watch.', use: ['See your record', 'sheet', 'mastery'] },
  banner: { lore: 'Your sigil. It meant a world once. Now it means you.', use: ['Look at your rank', 'sheet', 'halls'] },
};
