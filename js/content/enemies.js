// ===== [World Pending Deletion] — content: enemies =====
'use strict';
// theme: the archetype (or two allies) an enemy fights like, from the grid in archetypes.js. The System's own
// examiners and legends have none.
const ENEMIES = {
  goblin: { name: 'Goblin Pit-Fighter', style: 'Fast, dirty fighter', tier: 1, theme: ['blade', 'venom'], rank: 'E', hp: 40, skills: [{ n: 'Shiv', fx: { dmg: 8 } }, { n: 'Dirty Trick', fx: { dmg: 3, weaken: 1 } }], script: [0, 0, 1] },
  golem: { name: 'Shield Golem', style: 'Walls up, hits hard', tier: 1, theme: 'bastion', rank: 'E', hp: 52, skills: [{ n: 'Slam', fx: { dmg: 11 } }, { n: 'Stone Wall', fx: { block: 10 } }], script: [1, 0] },
  drake: { name: 'Venom Drake', style: 'Poisons, then waits', tier: 1, theme: 'venom', rank: 'E', hp: 44, skills: [{ n: 'Bite', fx: { dmg: 7 } }, { n: 'Venom Spit', fx: { poison: 4 } }], script: [1, 0, 0] },
  ghoul: { name: 'Feral Ghoul', style: 'Bleeds you, feeds', tier: 1, theme: ['venom', 'blade'], rank: 'E', hp: 42, skills: [{ n: 'Claw', fx: { dmg: 4, hits: 2, bleed: 1, perHit: 1 } }, { n: 'Feast', fx: { dmg: 4, lifesteal: 1 } }], script: [0, 0, 1] },
  imp: { name: 'Ember Imp', style: 'Burns and hides', tier: 1, theme: 'pyre', rank: 'E', hp: 38, skills: [{ n: 'Fire Spit', fx: { dmg: 5, burn: 3 } }, { n: 'Cackle', fx: { block: 6 } }], script: [0, 0, 1] },
  brute: { name: 'Pit Brute', style: 'Slow, one huge swing', tier: 1, theme: ['bastion'], rank: 'E', hp: 56, skills: [{ n: 'Wind Up', fx: { block: 5 }, label: 'Winding up' }, { n: 'Crushing Swing', fx: { dmg: 22 } }, { n: 'Shove', fx: { dmg: 5 } }], script: [2, 0, 1] },
  // Qualifier monsters added 6 Nov (thin content audit): three for each qualifier round, see MONSTER_ROUNDS
  wisp: { name: 'Spark Wisp', style: 'Quick jolts that sap your strength', tier: 1, theme: 'storm', rank: 'E', hp: 36, skills: [{ n: 'Zap', fx: { dmg: 7 } }, { n: 'Static Pop', fx: { dmg: 3, weaken: 1 } }], script: [0, 1] },
  lucky_rat: { name: 'Lucky Rat', style: 'Bites for whatever the die says', tier: 1, theme: 'dicer', rank: 'E', hp: 40, skills: [{ n: 'Gnaw', fx: { die: 1, dmg: 2, dmgPip: 1 } }, { n: 'Hoard', fx: { block: 6 } }], script: [0, 0, 1] },
  hex_toad: { name: 'Hex Toad', style: 'Croaks bad luck at you, then lunges', tier: 1, theme: 'jinx', rank: 'E', hp: 42, skills: [{ n: 'Croak', fx: { dmg: 3, weaken: 1 } }, { n: 'Tongue Lash', fx: { dmg: 9 } }], script: [0, 1, 1] },
  acolyte: { name: 'Pit Acolyte', style: 'Hits, then patches itself up', tier: 1, theme: 'zealot', rank: 'E', hp: 46, skills: [{ n: 'Censer Swing', fx: { dmg: 8 } }, { n: 'Field Prayer', fx: { heal: 7 } }], script: [0, 0, 1] },
  glyph_moth: { name: 'Glyph Moth', style: 'A flurry of little cuts and blinding dust', tier: 1, theme: 'arcanist', rank: 'E', hp: 44, skills: [{ n: 'Flutter', fx: { dmg: 3, hits: 3 } }, { n: 'Glyph Dust', fx: { dmg: 2, weaken: 2 } }], script: [0, 1, 0] },
  briar_cub: { name: 'Briar Cub', style: 'Pounces to make you bleed, then scampers off', tier: 1, theme: 'blade', rank: 'E', hp: 48, skills: [{ n: 'Pounce', fx: { dmg: 5, bleed: 2 } }, { n: 'Scamper', fx: { block: 7 } }], script: [0, 1, 0] },
  grave_hound: { name: 'Grave Hound', style: 'Feeds on every bite, then goes for the throat', tier: 1, theme: 'reaper', rank: 'E', hp: 54, skills: [{ n: 'Bite', fx: { dmg: 7 } }, { n: 'Feed', fx: { dmg: 5, lifesteal: 1 } }, { n: 'Go for the Throat', fx: { dmg: 18 } }], script: [0, 1, 2] },
  thunder_ram: { name: 'Thunder Ram', style: 'Paws the ground, then charges', tier: 1, theme: 'storm', rank: 'E', hp: 58, skills: [{ n: 'Paw the Ground', fx: { block: 8 }, label: 'Lowering its head' }, { n: 'Thunder Charge', fx: { dmg: 21 } }, { n: 'Headbutt', fx: { dmg: 7 } }], script: [2, 0, 1] },
  sunken_knight: { name: 'Sunken Knight', style: 'Shells up, then drags you under', tier: 1, theme: ['zealot', 'bastion'], rank: 'E', hp: 56, skills: [{ n: 'Rusted Blade', fx: { dmg: 10 } }, { n: 'Barnacle Guard', fx: { block: 9 } }, { n: 'Drag Under', fx: { dmg: 5, blockDmg: 0.5 } }], script: [1, 0, 2, 0] },
  seraphine: { name: 'Seraphine Vale', style: 'Holy knight: Block, then Judgement', tier: 2, theme: ['zealot', 'bastion'], rank: 'B', rival: true, hp: 80, passives: { regen: 2 }, skills: [{ n: 'Shield of Faith', fx: { block: 14 } }, { n: 'Judgement', fx: { dmg: 19, blockDmg: 1 } }, { n: 'Mend', fx: { heal: 14 } }], script: [0, 1, 0, 1, 2] },
  grukk: { name: 'Grukk the Unbroken', style: 'Berserker: stronger below half HP', tier: 2, theme: 'reaper', rank: 'D', rival: true, hp: 62, enrage: 0.5, enrageMult: 1.5, skills: [{ n: 'Axe Swing', fx: { dmg: 9 } }, { n: 'Roar', fx: { empower: 2 } }, { n: 'Rampage', fx: { dmg: 6, hits: 3 } }], script: [0, 1, 0, 2] },
  lyss: { name: 'Lyss of the Thorn', style: 'Duelist: Poison and dodges', tier: 2, theme: 'venom', rank: 'B', rival: true, hp: 52, dodge: 0.05, skills: [{ n: 'Needle', fx: { dmg: 5, poison: 1 } }, { n: 'Thousand Needles', fx: { poison: 3, doublePoison: 1 } }, { n: 'Sidestep', fx: { evade: 1 } }], script: [0, 2, 0, 1] },
  masked: { name: 'The Masked Entrant', style: 'Copies your last skill', tier: 2, theme: 'arcanist', rival: true, hp: 56, skills: [{ n: 'Strike', fx: { dmg: 10 } }, { n: 'Mirror Form', fx: { mirror: 1 }, label: 'Copying your last skill' }], script: [0, 1] },
  kaito: { name: 'Kaito Ren', style: 'Survivor of three tournaments: cleanses, and resists the skill you use most', tier: 2, theme: 'zealot', rank: 'A', rival: true, hp: 70, adapt: 0.6, skills: [{ n: 'Katana Draw', fx: { dmg: 8 } }, { n: 'Purifying Seal', fx: { cleanse: 1, block: 6 } }, { n: 'Iaido', fx: { dmg: 20 } }], script: [0, 1, 0, 2] },
  delphine: { name: 'Delphine Coyle', style: 'The Long Shot: bets on her own moves and shows you the roll', tier: 2, theme: 'dicer', rank: 'B', rival: true, hp: 72, skills: [{ n: 'Long Shot', fx: { die: 1, dmg: 2, dmgPip: 3 } }, { n: 'Hedge', fx: { die: 1, blockPip: 3 } }, { n: 'Double or Nothing', fx: { die: 1, dmgPip: 5, bust: 5 } }], script: [0, 1, 0, 2] },
  mott: { name: 'Mott the Unlucky', style: 'Hexes one of your skills each turn, shown, and apologises for it', tier: 2, theme: 'jinx', rank: 'C', rival: true, hp: 70, hexer: 1, skills: [{ n: 'Stumble', fx: { dmg: 10 } }, { n: 'Sorry', fx: { block: 8 } }, { n: 'Bad Timing', fx: { dmg: 6, weaken: 1 } }], script: [0, 1, 0, 2] },
  calder: { name: 'Ser Calder', style: 'A knight who fights by the book', tier: 2, theme: 'bastion', rank: 'C', rival: true, hp: 76, passives: { flatDR: 2 }, skills: [{ n: 'Lance', fx: { dmg: 18 } }, { n: 'Shield Wall', fx: { block: 10 } }, { n: 'Disgrace', fx: { dmg: 5, weaken: 2 } }], script: [0, 1, 0, 2] },
  // Rivals added 6 Nov (thin content audit): Pyre, Bladedancer and Stormcaller styles, a second A-rank, and two duos.
  // A duo is two Entrants on one entry: the first fights, and at its phase line the second tags in (phase.swap)
  ossian: { name: 'Ossian Pyke', style: 'Sets small fires, then lets them spread', tier: 2, theme: 'pyre', rank: 'D', rival: true, hp: 64, skills: [{ n: 'Struck Match', fx: { dmg: 4, burn: 3 } }, { n: 'Kindling', fx: { dmg: 9 } }, { n: 'Firebreak', fx: { block: 8 } }], script: [0, 1, 0, 2] },
  wren: { name: 'Wren Halloway', style: 'Never stands still: slips your hits, then opens a vein', tier: 2, theme: 'blade', rank: 'C', rival: true, hp: 60, dodge: 0.08, skills: [{ n: 'Three Cuts', fx: { dmg: 3, hits: 3 } }, { n: 'Feint', fx: { block: 7 } }, { n: 'Open a Vein', fx: { dmg: 6, bleed: 3 } }], script: [0, 1, 2, 0] },
  bram: { name: 'Bram Coldwater', style: 'Saps your strength, then brings the thunder down', tier: 2, theme: 'storm', rank: 'B', rival: true, hp: 72, skills: [{ n: 'Crackle', fx: { dmg: 9 } }, { n: 'Ground Out', fx: { block: 10 } }, { n: 'Thunderhead', fx: { dmg: 18 } }, { n: 'Static Field', fx: { dmg: 4, weaken: 2 } }], script: [3, 0, 1, 2] },
  sable: { name: 'Mother Sable', style: 'Finishes what others start: hits harder once you are below half HP', tier: 2, theme: ['reaper', 'blade'], rank: 'A', rival: true, hp: 78, passives: { vsHalf: 0.35 }, skills: [{ n: 'Scythe', fx: { dmg: 11 } }, { n: 'Grave Guard', fx: { block: 10 } }, { n: 'Final Harvest', fx: { dmg: 20 } }], script: [0, 1, 0, 2] },
  vey_twins: { name: 'Ash and Rue Vey', style: 'A duo: Ash sets you alight, then Rue tags in with poison', tier: 2, theme: ['pyre', 'venom'], rank: 'C', rival: true, hp: 74, skills: [{ n: 'Spark', fx: { dmg: 5, burn: 3 } }, { n: 'Ash Guard', fx: { block: 8 } }], script: [0, 0, 1],
    phase: { at: 0.5, swap: { name: 'Rue Vey', clear: true }, say: '[Ash Vey tags out. Rue Vey steps in, untouched by anything you put on Ash.]', add: [{ n: 'Needle', fx: { dmg: 4, poison: 3 } }, { n: 'Bitter Draught', fx: { dmg: 11 } }], script: [2, 3, 2] } },
  brook_pair: { name: 'Tarn and Vela Brook', style: 'A duo: Tarn hammers and braces, then Vela tags in to finish', tier: 2, theme: ['storm', 'reaper'], rank: 'B', rival: true, hp: 80, skills: [{ n: 'Storm Hammer', fx: { dmg: 10 } }, { n: 'Brace', fx: { block: 10 } }, { n: 'Rattle', fx: { dmg: 4, weaken: 2 } }], script: [2, 0, 1],
    phase: { at: 0.5, swap: { name: 'Vela Brook', clear: true }, say: '[Tarn Brook tags out. Vela Brook steps in, untouched by anything you put on Tarn.]', add: [{ n: 'Reap', fx: { dmg: 8, lifesteal: 1 } }, { n: 'Cut Down', fx: { dmg: 18 } }], script: [3, 3, 4] } },
  leviathan: { name: 'The Leviathan Queen', style: 'Floods the arena every 3rd turn, Weakening whoever has less Block', tier: 3, theme: 'zealot', rank: 'A', final: true, hp: 105, flood: 3, skills: [{ n: 'Tidal Lash', fx: { dmg: 22 } }, { n: 'Coral Armour', fx: { block: 12 } }, { n: 'Crushing Depths', fx: { dmg: 9, weaken: 2 } }], script: [0, 1, 2] , phase: { at: 0.5, say: '[The Leviathan Queen abandons her coral. The undertow takes over.]', add: [{ n: 'Undertow', fx: { dmg: 6, hits: 2 } }], script: [3, 0, 3, 2] } },
  kharros: { name: 'Emperor Kharros the Ashen', style: 'Sets you alight every turn, enrages at half HP', tier: 3, theme: 'pyre', rank: 'A', final: true, hp: 108, aura: 0.7, enrage: 0.5, enrageMult: 1.25, skills: [{ n: 'Ashen Blade', fx: { dmg: 10 } }, { n: 'Ashen Pyre', fx: { burn: 3 } }, { n: 'Imperial Guard', fx: { block: 12 } }], script: [0, 1, 2, 0] , phase: { at: 0.5, say: '[The Emperor\'s crown catches fire. He begins issuing decrees.]', add: [{ n: 'Imperial Decree', fx: { dmg: 6, weaken: 1 } }], script: [0, 3, 1, 0] } },
  bone_saint: { name: 'The Bone Saint', style: 'Poisons and drains; turns at 40% HP, and rises once when killed', tier: 3, theme: 'venom', rank: 'A', final: true, hp: 104, revive: 0.3, skills: [{ n: 'Bone Lance', fx: { dmg: 10 } }, { n: 'Plague Hymn', fx: { poison: 3 } }, { n: 'Marrow Feast', fx: { dmg: 7, lifesteal: 0.5 } }], script: [1, 0, 2, 0] , phase: { at: 0.4, say: '[The Bone Saint stops praying for you and starts praying against you.]', add: [{ n: 'Final Sermon', fx: { dmg: 4, poison: 3 } }], script: [3, 0, 2] } },
  thorn_mother: { name: 'The Thorn Mother', style: 'Briars make you Bleed every turn; she heals', tier: 3, theme: 'blade', rank: 'A', final: true, hp: 84, briar: 1, skills: [{ n: 'Thorn Lash', fx: { dmg: 5, hits: 2 } }, { n: 'Bloom', fx: { heal: 14 } }, { n: 'Strangling Vine', fx: { dmg: 8, weaken: 1 } }], script: [0, 2, 0, 1] , phase: { at: 0.5, say: '[The Thorn Mother takes root. The forest closes in.]', add: [{ n: 'Overgrowth', fx: { block: 12, heal: 6 } }], script: [0, 3, 2, 0] } },
  archmage: { name: 'The Archmage Who Fell Upward', style: 'Casts twice every 3rd turn', tier: 3, theme: 'arcanist', rank: 'A', final: true, hp: 85, twincast: 3, skills: [{ n: 'Arcane Bolt', fx: { dmg: 11 } }, { n: 'Mirror Ward', fx: { block: 14 } }, { n: 'Starfall', fx: { dmg: 4, hits: 3 } }], script: [0, 2, 1, 0] , phase: { at: 0.5, say: '[The Archmage falls upward again. Gravity has been informed.]', add: [{ n: 'Meteor', fx: { dmg: 10 } }], script: [3, 2, 0] } },
  forge_king: { name: 'The Forge King', style: 'His Block never fades and grows every turn', tier: 3, theme: 'bastion', rank: 'A', final: true, hp: 100, forge: 3, skills: [{ n: 'Molten Hammer', fx: { dmg: 6, blockDmg: 0.4 } }, { n: 'Anvil Guard', fx: { block: 10 } }, { n: 'Quench', fx: { dmg: 15 } }], script: [0, 1, 2, 0] , phase: { at: 0.5, say: '[The Forge King\'s anvil cracks. He stops guarding and starts swinging.]', add: [{ n: 'Slag Burst', fx: { dmg: 4, hits: 3, burn: 1 } }], script: [3, 0, 2, 0] } },
  dealer: { name: 'The Dealer', style: 'Plays the hand it is dealt, then stops playing fair', tier: 3, theme: 'dicer', rank: 'A', final: true, hp: 95, skills: [{ n: 'Cut the Deck', fx: { dmg: 9 } }, { n: 'Stacked Hand', fx: { block: 10, empower: 2 } }, { n: 'All In', fx: { dmg: 22 } }], script: [0, 1, 0, 2], phase: { at: 0.5, say: '[The Dealer stops dealing fair. The cards stay face up. That is the only rule left.]', add: [{ n: 'Marked Hand', fx: { dmg: 8, hits: 2 } }], script: [3, 0, 1, 2] } },
  augur: { name: 'The Hanged Augur', style: 'Reads its own omens: shows two moves ahead, and is hard to jinx', tier: 3, theme: 'jinx', rank: 'A', final: true, hp: 95, showNext: 1, jinxTax: 2, skills: [{ n: 'Ill Tidings', fx: { dmg: 10 } }, { n: 'Augury', fx: { block: 12, augury: 1 } }, { n: 'Last Rites', fx: { dmg: 22 } }], script: [0, 1, 0, 2], phase: { at: 0.5, say: "[The Augur's omens have run out. It has started making new ones.]", add: [{ n: 'Portent', fx: { dmg: 8, portent: 1 } }], script: [3, 0, 1, 2] } },
  herald: { name: 'The Storm Herald', style: 'Gathers a storm, then lets it go', tier: 3, theme: 'storm', rank: 'A', final: true, hp: 95, skills: [{ n: 'Static Lash', fx: { dmg: 8, weaken: 1 } }, { n: 'Gathering Storm', fx: { block: 10, empower: 2 } }, { n: 'Stormfall', fx: { dmg: 22 } }], script: [0, 0, 1, 2], phase: { at: 0.5, say: '[The Storm Herald stops gathering. The storm is already here.]', add: [{ n: 'Downpour', fx: { dmg: 9, empower: 1 } }], script: [3, 0, 1, 2] } },
  // The Rank Trial examiner. Its rank letter is the grade it tests for, and it fights at that grade's world rank (see trialMul).
  proctor: { name: 'Proctor', style: "The System's examiner. Pass the condition to be promoted", tier: 2, hp: 70, skills: [{ n: 'Marked Strike', fx: { dmg: 9 } }, { n: 'Assessment', fx: { block: 8 } }, { n: 'Pop Quiz', fx: { dmg: 5, weaken: 2 } }, { n: 'Final Exam', fx: { dmg: 7, hits: 2 }, label: 'Preparing the final exam' }], script: [0, 1, 2, 3] },
  legend: { name: 'Varn the Unbowed', style: 'A legend from the System archive', tier: 4, rank: 'A', hp: 150, skills: [{ n: 'Unbowed Strike', fx: { dmg: 13 } }, { n: 'Ancient Guard', fx: { block: 14, cleanse: 1 } }, { n: 'Sundering Blow', fx: { dmg: 9, weaken: 2 } }], script: [0, 1, 2, 0] },
  undefeated: { name: 'The Undefeated', style: 'Has never lost', tier: 4, rank: 'S', hp: 200, skills: [{ n: 'Flawless Strike', fx: { dmg: 14 } }, { n: 'Perfect Guard', fx: { block: 16, cleanse: 1 } }, { n: 'Endless Form', fx: { dmg: 6, hits: 3 } }, { n: 'Verdict', fx: { dmg: 24 } }], script: [0, 1, 2, 0, 3] },
};
// Reflexes: each opponent's one if-then rule, shown on its card. on is what you did on your turn (REFLEX_ON); when it
// fires, the opponent's next move is the Reflex's instead of the next in its script: move (a move of its own, written
// like any other) or use (the index of one of its skills). say is the System's line when it fires, so the player sees why.
// It never fires two turns running, and the move is shown as the intent before the player acts (planReflex in core.js).
// Rank Trial examiners, legends, the Undefeated and other players' builds have none.
const REFLEX_ON = {
  block: { chip: 'Block', if: 'If you Block', why: 'you Blocked' },
  flurry: { chip: '2 hits', if: 'If you hit twice in a turn', why: 'you hit twice' },
  status: { chip: 'afflictions', if: 'If you Burn, Poison or Bleed it', why: 'you afflicted it' },
  heal: { chip: 'healing', if: 'If you heal', why: 'you healed' },
  passive: { chip: 'no attack', if: 'If you do not attack', why: 'you held back' },
};
const REFLEXES = {
  goblin: { on: 'block', move: { n: 'Ankle Stab', fx: { dmg: 5, pierce: 1 } }, say: '[The Goblin sees your guard go up. It goes low.]' },
  golem: { on: 'status', move: { n: 'Shed Stone', fx: { cleanse: 1, block: 6 } }, say: '[The Golem sheds a layer of stone, and your handiwork with it.]' },
  drake: { on: 'heal', move: { n: 'Second Spit', fx: { poison: 6 } }, say: '[The Drake watches you mend. It spits again.]' },
  ghoul: { on: 'passive', move: { n: 'Lunge', fx: { dmg: 9, bleed: 1 } }, say: '[You held back. The Ghoul did not.]' },
  imp: { on: 'block', move: { n: 'Scorch', fx: { burn: 5 } }, say: '[The Imp cannot get through your guard. It sets fire to it instead.]' },
  brute: { on: 'flurry', move: { n: 'Backhand', fx: { dmg: 8, weaken: 1 } }, say: '[Too many small hits. The Brute swats you away.]' },
  wisp: { on: 'heal', move: { n: 'Overload', fx: { dmg: 11 } }, say: '[The Wisp is drawn to the mending. It discharges.]' },
  lucky_rat: { on: 'passive', move: { n: 'Snatch', fx: { dmg: 8 } }, say: '[You left an opening. The Rat considers itself lucky.]' },
  hex_toad: { on: 'status', move: { n: 'Spit It Back', fx: { dmg: 4, weaken: 2 } }, say: '[The Toad does not care for the taste. It spits it back.]' },
  acolyte: { on: 'status', move: { n: 'Purging Rite', fx: { cleanse: 1, heal: 5 } }, say: '[The Acolyte knows a rite for that.]' },
  glyph_moth: { on: 'block', move: { n: 'Dust Cloud', fx: { dmg: 2, pierce: 1, weaken: 2 } }, say: '[Your guard is up. The dust goes around it.]' },
  briar_cub: { on: 'flurry', move: { n: 'Curl Up', fx: { block: 10 } }, say: '[The Cub has had enough of that. It curls up.]' },
  grave_hound: { on: 'heal', use: 2, say: '[The Hound smells fresh blood. It goes for the throat early.]' },
  thunder_ram: { on: 'passive', use: 1, say: '[You stood still. The Ram takes that as a target.]' },
  sunken_knight: { on: 'block', use: 2, say: '[The Knight sees you shell up. It knows that trick.]' },
  seraphine: { on: 'status', move: { n: 'Lay on Hands', fx: { cleanse: 1, heal: 8 } }, say: '[Seraphine notices the stain. She prays it off.]' },
  grukk: { on: 'flurry', use: 1, say: '[Grukk felt every one of those. Grukk is delighted.]' },
  lyss: { on: 'block', use: 1, say: '[Lyss notes your guard. Poison does not mind it.]' },
  masked: { on: 'heal', move: { n: 'Mirror Mend', fx: { heal: 12 } }, say: '[The Masked Entrant copies that as well.]' },
  kaito: { on: 'status', use: 1, say: '[Kaito has seen that before. He seals it away.]' },
  delphine: { on: 'passive', use: 2, say: '[You hesitated. Delphine raises.]' },
  mott: { on: 'block', move: { n: 'Trip', fx: { dmg: 6, pierce: 1 } }, say: '[Mott trips and goes under your guard. He is sorry.]' },
  calder: { on: 'passive', use: 0, say: '[You did not attack. Ser Calder considers that an invitation.]' },
  ossian: { on: 'block', move: { n: 'Smoke Out', fx: { burn: 6 } }, say: '[Ossian cannot reach you in there. The smoke can.]' },
  wren: { on: 'flurry', move: { n: 'Slip Away', fx: { evade: 1 } }, say: '[Wren has counted your hits. She will not be there for the next.]' },
  bram: { on: 'heal', use: 2, say: '[Bram stops counting. The thunder comes early.]' },
  sable: { on: 'heal', move: { n: 'Reopen', fx: { dmg: 8, bleed: 3 } }, say: '[Mother Sable watches you mend. She undoes it.]' },
  vey_twins: { on: 'status', move: { n: 'Trade Looks', fx: { cleanse: 1, block: 6 } }, say: '[The Veys trade a look. What you left on them is gone.]' },
  brook_pair: { on: 'flurry', use: 1, say: '[The Brooks have seen fast hands before. They brace.]' },
  leviathan: { on: 'block', move: { n: 'Undertow', fx: { dmg: 8, pierce: 1, weaken: 1 } }, say: '[The Queen sees your wall. The tide goes under it.]' },
  kharros: { on: 'heal', move: { n: 'Imperial Decree', fx: { burn: 6 } }, say: '[The Emperor does not permit recovery. It is decreed.]' },
  bone_saint: { on: 'status', move: { n: 'Absolution', fx: { cleanse: 1, heal: 6 } }, say: '[The Bone Saint absolves itself. It has had practice.]' },
  thorn_mother: { on: 'flurry', move: { n: 'Bramble Wall', fx: { block: 12 } }, say: '[The Thorn Mother pulls the forest in close.]' },
  archmage: { on: 'passive', use: 2, say: '[The Archmage notices nobody is attacking him. He fills the silence.]' },
  forge_king: { on: 'status', move: { n: 'Burn It Off', fx: { cleanse: 1, dmg: 6 } }, say: '[The Forge King puts it to the fire. It does not survive.]' },
  dealer: { on: 'block', move: { n: 'Marked Card', fx: { dmg: 7, pierce: 1 } }, say: '[The Dealer saw that hand coming. It plays around it.]' },
  augur: { on: 'heal', move: { n: 'Foreseen', fx: { dmg: 9, weaken: 1 } }, say: '[The Augur read that you would mend. It had an answer ready.]' },
  herald: { on: 'passive', use: 1, say: '[You gave the Storm Herald time. It used it.]' },
};
const MONSTERS = ['goblin', 'golem', 'drake', 'ghoul', 'imp', 'brute', 'wisp', 'lucky_rat', 'hex_toad', 'acolyte', 'glyph_moth', 'briar_cub', 'grave_hound', 'thunder_ram', 'sunken_knight'];
// The qualifier ladder: each qualifier round draws its two monsters from its own list, so each round has its own feel.
// Round 1 the light ones, round 2 the ones that put a status on you, round 3 the heavy hitters. Every monster in MONSTERS
// is in exactly one round.
const MONSTER_ROUNDS = [
  ['goblin', 'imp', 'wisp', 'lucky_rat', 'hex_toad'],
  ['drake', 'ghoul', 'acolyte', 'glyph_moth', 'briar_cub'],
  ['golem', 'brute', 'grave_hound', 'thunder_ram', 'sunken_knight'],
];
const RIVALS = ['seraphine', 'grukk', 'lyss', 'masked', 'kaito', 'calder', 'delphine', 'mott', 'ossian', 'wren', 'bram', 'sable', 'vey_twins', 'brook_pair'];
// below: you're below them; level; above: you outrank them; grudge: you've beaten them before
// Lines for named opponents (lore audit, 2 Nov; draft lore/drafts/champions-and-rivals-v2.md). All optional:
//   enter   said when they enter (rivals: only when the rank lines don't speak; Final Champions: not at S-rank, the greeting does)
//   beaten  what they say when you win; wins: when they beat you (either may be a whole [System line])
//   rise    after a revive; archive: the Archive line, once you have beaten them
// Finalists (players' builds carrying a Final Champion's power) never speak these. Rivals' archive lines each lean
// towards a different answer to the mystery, on purpose (Slaw, 2 Nov).
const FOE_LINES = {
  leviathan: { enter: 'Your islands are already half under. I am only finishing the job.', beaten: 'Then hold your breath a little longer, little island.', wins: '[The sea closes over {world}.]', archive: 'The Leviathan Queen\'s own islands sank the day she won. She was not consulted.' },
  kharros: { enter: 'I have never accepted a surrender. I will not start with yours.', beaten: 'Ash remembers. So will I.', wins: '[Another province for the Ashen Emperor.]', archive: 'Kharros has judged more Burning worlds than anyone. He has spared fewer than any other Final Champion.' },
  bone_saint: { enter: 'Lie down, child. Everyone lies down eventually.', rise: 'Not yet. They never let me rest either.', beaten: 'Finally. Thank you.', wins: '[The Bone Saint adds {champ} to the congregation.]', archive: 'The Bone Saint has asked to be retired four times. Each request was filed.' },
  thorn_mother: { enter: 'You walked into my woods. Everyone who walks in stays.', beaten: 'Go, then. The forest grows back. It always does.', wins: '[The Wilds have eaten another traveller.]', archive: 'Lyss of the Thorn claims the Thorn Mother as kin. The Thorn Mother has not commented.' },
  archmage: { enter: 'You are very small from up here.', beaten: 'Ah. So that is what the ground feels like.', wins: '[The Archmage does not look down.]', archive: 'The Archmage\'s own world was entered again long ago. He did not notice.' },
  forge_king: { enter: 'The gates stay shut. You will have to break them.', beaten: 'The siege is over, then. Open the gates.', wins: '[The Forge King adds another layer to the wall.]', archive: 'Nobody has checked what is behind the Forge King\'s gates. The Forge King prefers it that way.' },
  herald: { enter: 'Count the seconds between the flash and me.', beaten: 'The storm breaks. Remember what the sky looked like.', wins: '[The storm over {world} never breaks now.]', archive: 'The Clans say the storm is somebody\'s temper. They do not say whose.' },
  seraphine: { enter: 'Shield up. Faith up. Let\'s begin.', archive: 'Seraphine\'s world was erased during her semi-final. Its records were marked "consumed". She won the match.' },
  grukk: { enter: 'Grukk lose a lot. Grukk never stay down.', archive: 'Grukk tried to leave between tournaments once. He says the door was painted on.' },
  lyss: { enter: 'Don\'t worry. It\'s only a little poison.', archive: 'Lyss tampers with other Entrants\' water as a matter of routine. The System considers this within the rules.' },
  masked: { enter: '[Entrant name: ███. World: ███. Rank: matched to yours.]', archive: 'Their mask was found empty after the match.' },
  augur: { enter: 'I read your ending this morning. Shall I spoil it?', beaten: 'I misread it. That has never happened.', wins: '[The Augur was right about {world}. It usually is.]', archive: 'The Augur has never been wrong about an ending. It has never said what it read for the System.' },
  mott: { enter: 'Sorry. In advance. For all of it.', archive: 'Entered by mistake. The System has not corrected the mistake. The System has not explained why.' },
  dealer: { enter: 'Cut. No? Then I will.', beaten: 'Fair hand. I will remember the odds.', wins: '[The House collects {world}. Paid in full.]', archive: 'The Dealer has never sat down at a table it did not own. Somebody owns the Dealer.' },
  delphine: { enter: "Even money says I win. I'll give you better odds than that.", archive: "Delphine has never lost a bet with the System. She says its odds are wrong about one thing. She won't say which." },
  kaito: { enter: 'You use that skill too much. I\'ve seen it before.', archive: 'Kaito\'s world has been spared three times. Each time, the System entered it again. He says it has started repeating itself.' },
  calder: { enter: 'Salute. Then we begin. Properly.', archive: 'Ser Calder has filed four formal complaints about other Entrants\' conduct. All four were read aloud to the crowd.' },
  ossian: { enter: "Don't mind the smoke. Most of it is mine.", archive: 'Ossian burned down his own world\'s records office the week before the System arrived. He says the timing was a coincidence.' },
  wren: { enter: 'Keep up. Nobody does.', archive: 'Wren has not stood still in a tournament yet. The System has her down as "in motion" in every record.' },
  bram: { enter: 'You will hear me coming. It will not help.', archive: 'Bram counts the seconds between lightning and thunder out loud. He has never counted past three.' },
  sable: { enter: 'Go on, then. Get hurt. I will wait.', archive: 'Mother Sable has carried the coffin at every funeral her world held. Her world held a great many.' },
  vey_twins: { enter: '[Two Entrants. One entry. The System counted them once.]', archive: 'The Vey twins were entered as one person. They have never corrected the System. It has never asked.' },
  brook_pair: { enter: 'Tarn first. Then me. Then nothing.', archive: 'Tarn and Vela Brook have shared one entry for three tournaments. The second fee was never paid.' },
  legend: { enter: '[Retrieving legend from the archive. Varn the Unbowed. Status: unbowed.]', beaten: 'Bowed at last. It was a long wait.' },
  undefeated: { wins: '[Record unchanged.]' },
};
const RIVAL_LINES = {
  grukk: { below: 'Little rank. Grukk go easy. Grukk not know how, but try.', level: 'Same letter as Grukk! Good. Fair fight. Grukk still win.', above: 'Big letter. Grukk lose to big letters lots. Grukk not mind.', grudge: 'You beat Grukk before. Grukk remember. Grukk get up again.' },
  calder: { below: "A lower rank. I'll observe the rules all the same.", level: 'An equal. Salute, and we begin properly.', above: 'Outranked. Then it will be an honour to lose correctly.', grudge: "You beat me last time. I've filed a complaint. Shall we?" },
  seraphine: { below: "You're new. Shield up. I won't hold back, but I'll pray for you after.", level: 'A worthy rank. My faith against yours, then.', above: "So high already. Remember who you're fighting for.", grudge: "You beat me once. I've been praying about that." },
  lyss: { below: "A low rank. You won't even notice the poison.", level: "Same grade. Then I'll have to actually try. How dull.", above: 'Ooh, a high rank. Did you drink your water today?', grudge: "You again. I've switched to a stronger poison." },
  mott: { below: "Sorry. You're lower rank, which makes this worse.", level: 'Equals. Sorry about what happens next.', above: "You outrank me. I'm so sorry. It won't help.", grudge: "You beat me last time. I'm sorry. It was probably my fault." },
  delphine: { below: "Lower rank. Long odds. My favourite kind.", level: "Even money. I hate even money.", above: "You outrank me. Twenty to one. I'll take it.", grudge: "You beat me once. I've been betting on the rematch ever since." },
  ossian: { below: 'Lower rank. You will burn quicker.', level: 'Same letter. Same fire, then.', above: 'High rank. Big things burn longest.', grudge: 'You put me out last time. I kept the ashes.' },
  wren: { below: 'Lower rank. Try to keep up anyway.', level: 'Equals. One of us is faster.', above: 'You outrank me. Then catch me.', grudge: 'You caught me once. Not again.' },
  bram: { below: 'Low rank. You will feel the storm before you see it.', level: 'An equal. I will count us both down.', above: 'Higher rank. Then I will wait for your big move.', grudge: 'You beat me last time. I have been counting since.' },
  sable: { below: 'So small. This will be quick.', level: 'Equal rank. Equal grave.', above: 'You outrank me. You will still get tired.', grudge: 'You walked away from me once. People rarely do twice.' },
  vey_twins: { below: 'Low rank. Ash will be enough. Rue will come anyway.', level: 'Equal rank. Two of us, though.', above: 'You outrank us. Both of us.', grudge: 'You beat both of us. We have not stopped arguing about it.' },
  brook_pair: { below: 'Lower rank. Tarn will handle it.', level: 'An even match. Two against one is not even.', above: 'You outrank us. Then you get both of us early.', grudge: 'You beat us last time. Vela has been waiting.' },
  kaito: { below: "Your rank is low. Your habits are lower. I've seen them before.", level: "We're equals. That's never happened in this tournament.", above: "You outrank me. Then you've seen what I've seen. Be careful.", grudge: "You beat me. I've studied that fight. Show me something new." },
};
