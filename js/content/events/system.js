// ===== [World Pending Deletion] — content: System events =====
// Events the System runs itself: it glitches, audits, amends its own rules and offers deals it shouldn't. Theme 'system'.
'use strict';
// Favour for your Patron, or for a god picked for you when you are Faithless
const patronOf = (run, h) => GODS[run.patron] ? run.patron : h.pick(Object.keys(GODS));

EVENTS.clerical_error = { title: 'Clerical Error', theme: 'system', text: '[Notice: Entrant record duplicated. One copy will be deleted.] A second you stands in the tunnel, looking equally annoyed.', opts: [
  { label: 'Delete the copy', desc: 'It is probably the copy.', then: { gold: 8 }, reveal: '[Copy deleted. Refund issued for the inconvenience. +8 gold.]' },
  { label: 'Delete the original', desc: 'Let the copy carry on. It seems keen.', then: { respec: true }, go: (run, h) => h.say('[Original deleted. The copy is you now. It stands a little differently.]') },
  { label: 'Keep both', desc: 'Two of you is better. Probably.', then: { summon: { who: 'copy', bounty: { restore: 2 }, say: '[Your copy has entered the bracket. It knows everything you know.]' } }, reveal: '[Duplicate retained. It will be in touch.]' }] };

EVENTS.amendment = { title: 'Tournament Amendment', theme: 'system', text: '[Amendment proposed. Entrants may vote. Votes are binding. Results are final.] The ballot box has no slot.', opts: [
  { label: 'Vote for Sudden Death', desc: 'Shorter fights. Sharper ones.', then: { amend: 'sudden' } },
  { label: 'Vote for Extended Bouts', desc: 'Longer fights. Better paid.', then: { amend: 'extended' } },
  { label: 'Abstain', desc: 'Let someone else decide.', then: { gold: 5 }, go: (run, h) => { h.say('[Abstention noted. The System votes on your behalf. +5 gold.]'); h.apply({ amend: h.pick(Object.keys(AMENDMENTS)) }); } }] };

EVENTS.audit = { title: 'The Audit', theme: 'system', text: 'A clerk with no face opens a ledger with your name on every page. [Routine audit. Please declare all earnings.]', opts: [
  { label: 'Declare everything', desc: 'Honesty is a policy.', then: { notice: -5 }, go: (run, h) => { const d = Math.floor(run.gold / 2); run.gold -= d; h.say(`[Declared. Half your gold is retained for processing. −${d} gold.]`, 'loss'); } },
  { label: 'Declare nothing', desc: 'What earnings?', then: { notice: 2 }, reveal: '[Declaration received: nothing. The clerk writes that down.]' },
  { roll: { stat: 'INT' }, label: 'Cook the books', desc: 'Numbers are only suggestions.', then: { gold: 6, notice: -1, summon: { who: 'calder', bounty: { gold: 15, piece: 'B' }, say: '[Ser Calder has been assigned to review your case. He fights by the book.]' } }, reveal: '[The books balance. For now. +6 gold. The case stays open.]',
    fail: { then: { notice: 2, summon: { who: 'calder', bounty: { gold: 15, piece: 'B' }, say: '[Ser Calder has been assigned to review your case. He fights by the book.]' } }, go: (run, h) => { const d = Math.floor(run.gold / 3); run.gold -= d; h.say(`[Irregularities found. −${d} gold. A reviewer has been assigned.]`, 'loss'); } } }] };

EVENTS.lost_property = { title: 'Lost Property', theme: 'system', text: '[Lost property: one Heart. Owner: a world that no longer exists.] It is warm, and it is still beating.', opts: [
  { label: 'Keep it', desc: 'Finders keepers.', then: { heart: 1, summon: { who: 'erased', bounty: { gold: 10 }, say: '[An Erased champion has entered the bracket. They want something back.]' } }, go: (run, h) => h.say('[Heart retained. Its owner has been notified.]') },
  { label: 'Return it to the Hall', desc: 'The Hall of the Erased keeps such things.', go: (run, h) => {
    if (h.meta) { h.meta.found = h.meta.found || {}; h.meta.found.returned = true; }
    h.say('[Returned. Thank you, Entrant. The Hall will remember this.]'); h.favour(patronOf(run, h), 3);
  } },
  { check: { stat: 'STR' }, label: 'Crush it', desc: 'Whatever is inside is yours now.', then: { stats: { STR: 2 }, notice: 1 }, go: (run, h) => { run.hp = h.maxHp(); h.say('[Crushed. Fully healed. +2 STR. Somewhere, nothing notices.]'); } }] };

EVENTS.sponsors = { title: 'Word From Our Sponsors', theme: 'system', text: '[We will return after a word from our sponsors.] Someone hands you a script and a bottle of something blue.', opts: [
  { label: 'Read the advert', desc: 'It is only a few lines.', then: { gold: 12, next: { weaken: 1 } }, reveal: '[Advert aired. +12 gold. You start your next fight Weakened: you are still holding the product.]' },
  { label: 'Endorse your Patron', desc: 'Say their name like you mean it.', go: (run, h) => { const g = patronOf(run, h); h.favour(g, 3); Object.keys(GODS).filter(o => o !== g).forEach(o => h.favour(o, -2)); } },
  { label: 'Refuse on air', desc: 'Say what you really think of the product.', then: { notice: 1, favour: { war: 2 } }, reveal: '[Refusal broadcast. The ratings dip. The System takes it personally.]' },
  { roll: { stat: 'LUK' }, label: 'Drink the product', desc: 'It is very blue.', go: (run, h) => { const k = h.pick(STATS); run.stats[k] += 2; h.say(`[It works. Nobody knows why. +2 ${k}.]`); },
    fail: { then: { next: { poison: 4 } }, reveal: '[It does not work. You start your next fight with 4 Poison. Results not typical.]' } }] };

// Shown only after a defeat; names the round you lost in
EVENTS.rollback = { title: 'Rollback', theme: 'system', can: run => !!(run.lastLoss && run.lastLoss.hearts), text: run => `[Error detected in round ${run.lastLoss.round}. Rolling back.] The tunnel flickers. For a moment you are losing that fight again.`, opts: [
  { label: 'Accept the rollback', desc: 'Undo it. All of it.', go: (run, h) => { const L = run.lastLoss; if (!L) return h.say('[Nothing to roll back. Rolling back anyway.]'); h.apply({ restore: L.hearts, summon: { spec: L.spec, traits: 1, say: '[Your opponent from the rolled-back round is back in the bracket. They remember winning.]' } }); h.say('[Rollback complete. Your opponent from that round has been restored too.]'); run.lastLoss = null; } },
  { label: 'Decline', desc: 'What happened, happened.', go: (run, h) => { run.statPts++; run.lastLoss = null; h.say('[Error retained. Compensation issued: +1 stat point.]', 'level'); } }] };

// Before the final only: the Final Champion is in the next room
const finalName = run => ENEMIES[WORLD_TYPES[run.world.type].final].name;
EVENTS.seating_error = { title: 'Seating Error', theme: 'system', can: run => run.round < 8, text: run => `[Seating error. Entrant and Final Champion assigned the same room.] ${finalName(run)} is eating dinner, and looks up.`, opts: [
  { label: 'Talk to them', desc: 'Ask how they like to fight.', go: (run, h) => { run.finalTip = true; h.say(`[${finalName(run)} talks. In the final, you'll see their next 2 moves.]`); } },
  { roll: { stat: 'AGI' }, label: 'Tamper with their armour', desc: 'While they are busy with dinner.', then: { notice: 2 }, go: (run, h) => { run.finalCut = 0.1; h.say(`[Tampered. ${finalName(run)} starts the final with 10% less HP.]`); },
    fail: { then: { notice: 2 }, go: (run, h) => { run.finalTraits = (run.finalTraits || []).concat(h.shuffle(Object.keys(TRAIT_POOL).filter(k => !(run.finalTraits || []).includes(k))).slice(0, 1)); h.say(`[Caught. ${finalName(run)} will be ready for you: an extra trait in the final.]`, 'loss'); } } },
  { label: 'Spar with them', desc: 'A friendly bout. Probably.', go: (run, h) => { h.lose(0.2, 'They were not being friendly.'); const top = STATS.slice().sort((a, b) => run.stats[b] - run.stats[a]).slice(0, 2); top.forEach(k => run.stats[k]++); h.say(`[You learned something. +1 ${top[0]}, +1 ${top[1]}.]`, 'level'); } }] };

EVENTS.locker_zero = { title: 'Locker 0', theme: 'system', text: '[Locker 0. Access: denied. Access: granted. Access: denied.] The name plate has been scratched off. It belongs to the Undefeated.', opts: [
  { roll: { stat: 'LUK', hard: true }, label: 'Wait for granted', desc: 'Then open it. Quickly.', then: { piece: 'A', notice: 2 }, go: (run, h) => { run.undefeatedTraits = h.shuffle(Object.keys(TRAIT_POOL)).slice(0, 1); h.say('[Something is missing from Locker 0. The Undefeated has been informed.]', 'loss'); },
    fail: { then: { notice: 2 }, go: (run, h) => h.lose(0.1, 'Access: denied. The door closes on your hand.') } },
  { label: 'Close it', desc: 'Some lockers are not yours.', then: { notice: -5 }, reveal: '[Compliance logged. Your record is very clean today.]' },
  { check: { stat: 'INT', hard: true }, label: 'Read the name inside', desc: 'Someone wrote it on the inside too.', then: { notice: 1 }, go: (run, h) => {
    if (h.meta) { h.meta.found = h.meta.found || {}; h.meta.found.locker0 = true; }
    h.say('[Name inside Locker 0: ████████. Entrant number: ███. Record sealed. Your access has been noted.]', 'class');
  } }] };

EVENTS.double_or_nothing = { title: 'Double or Nothing', theme: 'system', text: '[Wager surplus detected. The gods are bored.] A coin spins on the tunnel floor and does not fall.', opts: [
  { label: 'Double the stakes', desc: 'Your next fight counts twice.', then: { stakes: { win: { heart: 1, gold: 10 }, lose: { erase: 1 } } }, reveal: '[Stakes doubled. Win your next fight: +1 max Heart, +10 gold. Lose it: one more Heart erased.]' },
  { label: 'Halve the stakes', desc: 'Your next fight counts for less.', then: { next: { heartCut: 1, noWinGold: true } }, reveal: '[Stakes halved. Your next defeat costs 1 Heart fewer. Your next win pays no gold.]' },
  { label: 'Let the gods decide', desc: 'The coin is still spinning.', then: { favour: { trick: 1 } }, go: (run, h) => { if (h.pick([true, false])) { h.apply({ stakes: { win: { heart: 1, gold: 10 }, lose: { erase: 1 } } }); h.say('[The coin lands. Stakes doubled.]'); } else { h.apply({ next: { heartCut: 1, noWinGold: true } }); h.say('[The coin lands. Stakes halved.]'); } } }] };

// Names your class, and the stat it is built on
const hotfixOf = run => ARCH[run.arch[0]];
EVENTS.hotfix = { title: 'Hotfix', theme: 'system', text: run => `[Hotfix incoming: ${hotfixOf(run).name} is overperforming. Patch lands after your next fight.]`, opts: [
  { label: 'Accept the patch', desc: 'Thank them for their patience.', go: (run, h) => { const k = hotfixOf(run).stat, low = STATS.filter(s => s !== k).sort((a, b) => run.stats[a] - run.stats[b])[0]; run.stats[k] = Math.max(1, run.stats[k] - 1); run.stats[low] += 2; h.say(`[Patch applied. −1 ${k}, +2 ${low}. Thank you for your patience.]`, 'level'); } },
  { label: 'Exploit it before it lands', desc: 'One last fight at full power.', then: { next: { empower: 3 }, notice: 1 }, go: (run, h) => { const k = hotfixOf(run).stat; run.stats[k] = Math.max(1, run.stats[k] - 1); h.say(`[You start your next fight Empowered for 3 turns. The patch lands anyway: −1 ${k}.]`); } },
  { label: 'Appeal: pay 10 gold', desc: 'There is a form for this.', pay: 10, then: { notice: -1 }, reveal: '[Appeal upheld. Patch cancelled. Your patience is appreciated.]' }] };
