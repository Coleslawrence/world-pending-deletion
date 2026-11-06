// ===== [World Pending Deletion] — content: gods =====
// arch: archetypes whose B-rank pieces the god gifts at 4 Favour. blessing: the player text for bless, the P effects
// (docs/CONTENT.md) that apply at 8 Favour. reply: a rival reply line shown with 4 Favour, go(f) acts on the fight
// and returns the System line. Each god needs a chosen_<id> divine Gift in gifts.js.
// chat: the god's own lines for the K moment (the Gods' group chat), lower case, as typed. Fights: gate (a Gatekeeper or
// Final opens), brk (you Break the opponent), hurt (a hit for 20%+ of your max HP), low (first time under 20% HP).
// Also undercity (joins an Undercity chat), erased and spared (the end screen). Flavour only: never information you need.
// wager: the feat (feats.js) this god likes to bet on; it offers its own wager about half the time it offers one.
'use strict';
const GODS = {
  war: { name: 'The God of War', short: 'War', arch: ['reaper', 'storm', 'bastion', 'zealot'], wager: 'breaker', blessing: 'All your damage +15%.', bless: { dmgPct: 0.15 },
    reply: { label: '"War is watching."', go: f => { f.A.empower = Math.max(f.A.empower, 2); return '[War agrees. You are Empowered.]'; } },
    chat: { gate: ['finally. someone worth the walk.', 'hit it until it stops.'], brk: ['THAT. do that again.', 'now you are praying properly.'], hurt: ['you felt that. good. return it.', 'blood is fine. keep going.'], low: ['if you fall, fall forwards.', 'i have seen worse odds. i caused them.'],
      undercity: ['trust nobody down here. trust your arm.', 'if it moves, it is armed.'], erased: ['you fell forwards. i will allow it.', 'a good fight. a bad result.'], spared: ['acceptable.', 'the crowd is mine now. keep the world.'] } },
  trick: { name: 'The Trickster', short: 'Trickster', arch: ['venom', 'blade', 'arcanist'], wager: 'untouched', blessing: 'Burn, Poison and Bleed you apply +2.', bless: { dotPlus: 2 },
    reply: { label: '"Your laces are undone."', go: f => { f.A.critNext = true; return `[${f.B.name} looks down. Your next hit is a critical.]`; } },
    chat: { gate: ['40 Echoes says the big one swings first.', 'i read the gatekeeper\'s notes. bring snacks.'], brk: ['oh, it broke. did you read the label?', 'lovely. do the one where it falls over.'], hurt: ['that looked expensive.', 'i told you to duck. i told someone.'], low: ['don\'t die yet. i have money on round 8.', 'this is the funny part, right?'],
      undercity: ['wasn\'t me. probably.', 'i know this one. don\'t say i said hi.'], erased: ['well. that\'s a story.', 'oops. anyway.'], spared: ['called it. mostly.', 'see? nobody checked.'] } },
  ruin: { name: 'The Goddess of Ruin', short: 'Ruin', arch: ['pyre', 'reaper'], wager: 'wounded', blessing: 'Below half HP, deal 30% more damage.', bless: { lowHpDmg: 0.3 },
    reply: { label: '"Your world is next."', go: f => { const b = Math.max(5, Math.round(f.B.maxHp * 0.04)); f.B.burn += b; return `[Ruin hears you. ${f.B.name} burns: ${b} Burn.]`; } },
    chat: { gate: ['your world is next. make it wait.', 'it has ended worlds. end its streak.'], brk: ['there. a crack. widen it.', 'everything breaks. some things first.'], hurt: ['you are coming apart. beautifully.', 'keep bleeding. it suits you.'], low: ['almost nothing left. now it counts.', 'i can see your world from here.'],
      undercity: ['the tunnels remember every world.', 'down here, nobody is deleted. only lost.'], erased: ['another for the pile.', 'one less world to keep track of.'], spared: ['spared. for now.', 'a pity. i had started the eulogy.'] } },
  house: { name: 'The House', short: 'House', arch: ['dicer'], wager: 'overkill', blessing: 'Chance options in events +10%. +1 gold after each win.', bless: { chanceBonus: 10, goldPerWin: 1 },
    reply: { label: '"The House always pays. Eventually."', go: f => { f.A.focus = Math.max(f.A.focus || 0, 0.3); if (f.A.skills.some(s => s.pip)) f.A.rerolls = (f.A.rerolls || 0) + 1; return '[The House extends a line of credit. Your next damaging skill deals 30% more.]'; } },
    chat: { gate: ['odds on the gatekeeper: short. odds on you: interesting.', 'place your bets. i have placed mine.'], brk: ['a fine return on a modest stake.', 'noted. and credited.'], hurt: ['a loss. losses are recoverable.', 'that will cost you. i will keep the receipt.'], low: ['you are now a long shot. i adore long shots.', 'everyone is due. eventually.'],
      undercity: ['every table down here is mine. sit anywhere.', 'the cards deal themselves. i only count.'], erased: ['the house collects. it always does.', 'a bad hand, well played.'], spared: ['the house pays. with interest.', 'paid in full. come back soon.'] } },
  crow: { name: 'The Crow', short: 'Crow', arch: ['jinx'], wager: 'blocked', blessing: "The opponent's first move each fight goes wrong for them, as if jinxed.", bless: { firstJinx: 1 },
    reply: { label: '"I saw this coming."', go: f => { f.B.misfortune = (f.B.misfortune || 0) + 4; return `[The Crow agrees. ${f.B.name} gains 4 Misfortune.]`; } },
    chat: { gate: ['i have seen how this goes. watch.', 'the gatekeeper has an unlucky face.'], brk: ['as foretold.', 'i did mention this would happen.'], hurt: ['that was coming. so is the next one.', 'i warned you. quietly.'], low: ['not yet. i would have said.', 'i have not announced your ending. hold on.'],
      undercity: ['every road down here bends back.', 'a cat crossed your path. it was mine.'], erased: ['i said nothing. i knew.', 'announced. delivered.'], spared: ['i saw this too. i just did not say.', 'a good omen, for once.'] } },
};
