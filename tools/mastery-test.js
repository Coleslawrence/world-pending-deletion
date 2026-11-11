// Mastery test (Phase 5): Mastery XP is paid by every real run and shared by the pieces held; levels open Mastery pieces
// into the pool of later runs; Pending World has every Mastery piece for everyone; practice has none; and the new
// fight rules the Mastery pieces brought do what their words say.
//   node tools/mastery-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js'), bot = require('./bot.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
const rngOf = s => G.seedRng(s);
function newRun(meta, setup, seed) {
  G.bindMeta(meta);
  const rng = rngOf(seed || 'm'), w = G.offerWorlds(meta, rng)[0];
  return G.newRun(w, Object.assign({ name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: 'none' }, setup), meta, rng);
}
// --- content: four pieces per archetype, at levels 2, 4, 6 and 8, every one with a flavour line
G.ARCH_KEYS.forEach(k => {
  const ids = G.masteryPieces(k);
  ok(ids.length === 4, `${k} has ${ids.length} Mastery pieces, not 4`);
  ok(ids.map(id => G.pieceDef(id).mastery).join() === '2,4,6,8', `${k} Mastery pieces sit at levels ${ids.map(id => G.pieceDef(id).mastery)}`);
  ids.forEach(id => ok(G.pieceDef(id).flavour, `${id} has no flavour line`));
  for (let l = 1; l <= G.MASTERY_MAX; l++) ok(G.masteryReward(k, l), `${k} level ${l} has no reward text`);
  ok(G.MASTERY_LINES[k], `${k} has no title-screen line`);
});
ok(G.MASTERY_LEVELS.length === G.MASTERY_XP.length, 'a reward for every level');
// --- levels
ok(G.masteryLevel(0) === 0 && G.masteryLevel(G.MASTERY_XP[0] - 1) === 0 && G.masteryLevel(G.MASTERY_XP[0]) === 1 && G.masteryLevel(330) === 10 && G.masteryLevel(9999) === 10, 'levels follow MASTERY_XP');
ok(G.masteryFrame(0) === null && G.masteryFrame(1) === 'bronze' && G.masteryFrame(7) === 'silver' && G.masteryFrame(10) === 'gold', 'crest frames at 1, 7 and 10');
// --- the pool: closed at first, open from the level, per archetype
{
  const meta = G.newMeta(); meta.unlocks = { arch_arcanist: 1, arch_storm: 1, arch_dicer: 1, arch_jinx: 1 };
  const run = newRun(meta, {});
  ok(JSON.stringify(run.mastery) === '{}', 'a new player starts with no Mastery levels');
  ok(!G.poolIds(run).some(id => G.pieceDef(id).mastery), 'no Mastery piece is in a new player\'s pool');
  const home = run.arch[0];
  meta.mastery = { [home]: G.MASTERY_XP[3] }; // level 4
  const r2 = newRun(meta, {});
  const got = G.poolIds(r2).filter(id => G.pieceDef(id).mastery).sort(), want = G.masteryPieces(r2.arch[0]).filter(id => G.pieceDef(id).mastery <= 4 ).sort();
  ok(r2.arch[0] !== home || got.join() === want.join(), `level 4 opens exactly the level 2 and 4 pieces (${got} vs ${want})`);
  // opening draft never offers a closed piece
  for (let i = 0; i < 40; i++) { const r = newRun(G.newMeta(), {}, 'd' + i); ok(!r.draft.concat(r.gearDraft).some(id => G.pieceDef(id).mastery), 'a closed Mastery piece was offered in the opening draft'); }
}
// --- Pending World: everything, for everyone; practice: nothing
{
  const a = newRun(G.newMeta(), { seed: 'wpd:2026-12-01', daily: '2026-12-01' }), rich = G.newMeta(); G.ARCH_KEYS.forEach(k => rich.mastery[k] = 999);
  const b = newRun(rich, { seed: 'wpd:2026-12-01', daily: '2026-12-01' });
  ok(a.mastery === 'all' && b.mastery === 'all', 'Pending World runs carry every Mastery piece');
  ok(a.draft.join() === b.draft.join() && a.gearDraft.join() === b.gearDraft.join() && a.rerolls === b.rerolls, 'Pending World opens the same whatever your Mastery');
  ok(G.poolIds(a).some(id => G.pieceDef(id).mastery), 'Pending World pool holds Mastery pieces');
  ok(a.gearDraft.length <= 2, 'Pending World gear pick stays at 2');
}
// --- start options: level 5 one more redraft, level 9 a third gear piece, home archetype only
{
  const base = newRun(G.newMeta(), {}, 's1'), home = base.arch[0], meta = G.newMeta();
  meta.mastery = { [home]: G.MASTERY_XP[4] };
  const r5 = newRun(meta, {}, 's1');
  ok(r5.arch[0] === home && r5.rerolls === base.rerolls + 1, 'level 5 gives one more redraft at home');
  ok(r5.gearDraft.length <= 2, 'level 5 still offers 2 gear pieces');
  const m9 = G.newMeta(); m9.mastery = { [home]: G.MASTERY_XP[8] };
  const r9 = newRun(m9, {}, 's1');
  ok(r9.gearDraft.length === 3 && new Set(r9.gearDraft).size === 3, `level 9 offers 3 gear pieces (${r9.gearDraft})`);
  const other = G.ARCH_KEYS.find(k => !base.arch.includes(k)), mo = G.newMeta(); mo.mastery = { [other]: 999 };
  const ro = newRun(mo, {}, 's1');
  ok(ro.rerolls === base.rerolls && ro.gearDraft.length <= 2, 'another archetype\'s Mastery changes nothing at the start');
}
// --- XP: what a run pays and how it is shared
{
  const meta = G.newMeta(), run = newRun(meta, {});
  run.wins = 5; run.eliteWins = 0; run.priority = 0;
  ok(G.masteryXp(run, 'erased') === 5, 'an erased run pays its wins');
  ok(G.masteryXp(run, 'spared') === 9, 'sparing pays 4 more');
  run.priority = 3; run.eliteWins = 2; ok(G.masteryXp(run, 'elite') === 5 + 4 + 3 + 2, 'Priority and Elite wins add');
  run.practice = true; ok(G.masteryXp(run, 'spared') === 0, 'practice pays nothing'); delete run.practice;
  run.priority = 0; run.eliteWins = 0;
  run.bar = [{ id: 'firebolt', star: 1, mods: [] }, { id: 'ember_ward', star: 1, mods: [] }, { id: 'iron_guard', star: 1, mods: [] }, null]; run.gear = { weapon: null, armour: { id: 'chain_mail', star: 1 }, accessory: null };
  const sh = G.masteryShares(run, 9); // pyre 2, bastion 3 (ember_ward is both)
  ok(sh.pyre + sh.bastion === 9 && sh.bastion > sh.pyre, `shares follow the pieces held (${JSON.stringify(sh)})`);
  for (let t = 0; t <= 40; t++) ok(Object.values(G.masteryShares(run, t)).reduce((a, b) => a + b, 0) === t, 'shares always add up to the total');
  run.bar = [null, null, null, null]; run.gear = { weapon: null, armour: null, accessory: null };
  ok(G.masteryShares(run, 7)[run.arch[0]] === 7, 'with no pieces, the home archetype is paid');
  run.bar = [{ id: 'firebolt', star: 1, mods: [] }, null, null, null]; run.wins = 30;
  const res = G.endRun(run, meta, 'spared');
  ok(meta.mastery.pyre === 34 && res.mastery.length === 1 && res.mastery[0].level === 2 && res.mastery[0].from === 0, 'endRun banks the XP and reports the levels');
  ok(res.mastery[0].opened.length === 2 && res.mastery[0].opened[1].piece === G.masteryPiece('pyre', 2), 'the report names the piece that opened');
  const again = G.migrateMeta(JSON.parse(JSON.stringify(meta))); ok(again.mastery.pyre === 34, 'Mastery survives a save and load');
  ok(JSON.stringify(G.migrateMeta({ v: G.VERSION, mastery: { pyre: -5, nonsense: 9, venom: '12' } }).mastery) === '{"venom":12}', 'saved Mastery is cleaned');
}
// --- the System's title-screen line
{ const meta = G.newMeta(); ok(G.masteryLine(meta) === null, 'no line before level 3'); meta.mastery = { storm: 50, pyre: 46 }; ok(G.masteryLine(meta) === G.MASTERY_LINES.storm, 'the furthest archetype speaks'); }

// --- fight rules. A small harness: a player with given skills and passives against a plain dummy.
function fight(skills, P, o) {
  o = o || {};
  const mk = (id, i) => ({ key: 's' + i, def: Object.assign({}, G.SKILLS[id], { fx: Object.assign({}, G.SKILLS[id].fx) }), power: 1, cd: 0, star: 1 });
  const A = G.blankFighter({ side: 'A', name: 'A', isPlayer: true, maxHp: 200, hp: o.hp || 200, P: P || {}, crit: 0, critMult: 1.5, dodge: 0, skills: [{ key: 'attack', def: G.SKILLS.attack, power: 1, cd: 0, star: 1 }].concat(skills.map(mk)) });
  const B = G.blankFighter({ side: 'B', name: 'B', maxHp: 400, hp: o.bhp || 400, P: {}, crit: 0, critMult: 1.5, dodge: 0, skills: [{ key: 'e0', def: { id: 'e0', name: 'Wait', fx: { block: 0.0001 }, tags: [] }, power: 1, cd: 0 }] });
  [A, B].forEach(X => { X.rerolls = 0; X.curse = 0; X.misfortune = 0; X.omens = []; X.curseWard = X.P.curseWard || 0; });
  const f = { rng: rngOf(o.seed || 'f'), turn: 1, A, B, phase: 'player', over: false, events: [], log: [], useCounts: {}, lastPlayerSkill: null, dealt: {}, rx: [], tally: { breaks: 0, burn: 0, maxPoison: 0, bigHit: 0, blocked: 0, turns: 0, healed: 0, reactions: 0, bigStopped: 0, mostUsed: null, hurtBy: {}, taken: 0, stuns: 0, quickTurn: 0, maxQuick: 0, overkill: 0 }, spec: {} };
  return f;
}
const T = G._test;
{ // Slow Fuse: Burn now, and more at the start of the next two turns
  const f = fight(['slow_fuse']); T.useSkill(f, f.A, f.A.skills[1]);
  ok(f.B.burn === 3, 'Slow Fuse applies 3 Burn now'); f.B.burn = 0;
  T.startTurn(f, f.A); ok(f.B.burn === 3, 'Slow Fuse: 3 more next turn'); f.B.burn = 0;
  T.startTurn(f, f.A); ok(f.B.burn === 3, 'Slow Fuse: 3 more the turn after'); f.B.burn = 0;
  T.startTurn(f, f.A); ok(f.B.burn === 0, 'Slow Fuse stops after two turns');
}
{ // Flashover doubles Burn, up to its cap
  let f = fight(['flashover']); f.B.burn = 5; T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.burn === 10, 'Flashover doubles 5 Burn to 10');
  f = fight(['flashover']); f.B.burn = 30; T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.burn === 42, 'Flashover adds at most 12');
}
{ // Fester: damage equal to Poison, Poison stays
  const f = fight(['fester']); f.B.poison = 9; T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.hp === 391 && f.B.poison === 9, 'Fester deals the Poison and leaves it');
}
{ // Open Vein: doubled on a bleeding target
  let f = fight(['open_vein']); T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.bleed === 3, 'Open Vein applies 3 Bleed');
  T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.bleed === 9, 'Open Vein applies 6 to a bleeding target');
}
{ // Shield Wall and Stand Fast
  const f = fight(['shield_wall', 'stand_fast']); T.useSkill(f, f.A, f.A.skills[1]); T.useSkill(f, f.A, f.A.skills[2]);
  ok(f.A.block === 19 && f.A.spikes === 3, 'Shield Wall and Stand Fast give Block, and Thorns that stay');
  T.startTurn(f, f.A); ok(f.A.block === 19, 'Stand Fast: the Block is still there next turn');
  T.startTurn(f, f.A); ok(f.A.block === 0 && f.A.spikes === 3, 'and fades the turn after; the Thorns stay');
  const hp = f.B.hp; T.hit(f, f.B, f.A, 5); ok(f.B.hp === hp - 3, 'the lasting Thorns hit back');
}
{ // Lay on Hands
  let f = fight(['lay_on_hands'], {}, { hp: 150 }); T.useSkill(f, f.A, f.A.skills[1]); ok(f.A.hp === 158 && f.A.block === 0, 'Lay on Hands heals when hurt');
  f = fight(['lay_on_hands']); T.useSkill(f, f.A, f.A.skills[1]); ok(f.A.hp === 200 && f.A.block === 6, 'Lay on Hands gives Block at full HP');
}
{ // Reap and Death Knell
  let f = fight(['reap'], {}, { hp: 100, bhp: 150 }); T.useSkill(f, f.A, f.A.skills[1]); ok(f.A.hp === 108, 'Reap heals against an opponent below half HP');
  f = fight(['reap'], {}, { hp: 100 }); T.useSkill(f, f.A, f.A.skills[1]); ok(f.A.hp === 100, 'Reap does not heal against a healthy opponent');
  f = fight(['death_knell'], {}, { bhp: 100 }); T.useSkill(f, f.A, f.A.skills[1]); T.startTurn(f, f.B); T.startTurn(f, f.B); ok(f.B.hp === 100 - 36, `Death Knell doubles below 30% HP (${f.B.hp})`);
  f = fight(['death_knell']); T.useSkill(f, f.A, f.A.skills[1]); T.startTurn(f, f.B); T.startTurn(f, f.B); ok(f.B.hp === 400 - 18, 'Death Knell deals 18 otherwise');
}
{ // Squall Line: Weaken when there is no big attack to stop
  const f = fight(['squall_line']); T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.weaken === 2, 'Squall Line Weakens for 2 turns');
  const g = fight(['squall_line'], { weakenPlus: 1 }); T.useSkill(g, g.A, g.A.skills[1]); ok(g.B.weaken === 3, 'Lodestone: Weaken lasts 1 turn longer');
}
{ // Second Casting repeats the last skill at 60%
  const f = fight(['cleave', 'second_casting']); f.lastPlayerSkill = f.A.skills[1]; const d = G.SKILLS.cleave.fx.dmg;
  T.useSkill(f, f.A, f.A.skills[2]); ok(400 - f.B.hp === Math.round(d * 0.6), `Second Casting repeats at 60% (${400 - f.B.hp} of ${d})`);
}
{ // Broken Mirror and Salt Pouch
  let f = fight(['broken_mirror']); T.useSkill(f, f.A, f.A.skills[1]); ok(f.A.curse === 1 && f.B.misfortune === 3 && f.A.block === 7, 'Broken Mirror: Misfortune, Block and 1 Curse');
  f = fight(['broken_mirror'], { curseWard: 3 }); for (let i = 0; i < 4; i++) T.useSkill(f, f.A, f.A.skills[1]); ok(f.A.curse === 1, 'Salt Pouch ignores the first 3 Curse');
}
{ // Thirteenth Nail: every third damaging skill
  const f = fight(['cleave'], { nailMisf: 3 }); for (let i = 0; i < 6; i++) T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.misfortune === 6, 'Thirteenth Nail fires on every third damaging skill');
}
{ // gear passives
  let f = fight([], { struckPoison: 1 }); T.hit(f, f.B, f.A, 5); ok(f.B.poison === 1, 'Adder Hide poisons the attacker');
  f = fight([], { poisonGrow: 1 }); f.B.poison = 4; T.startTurn(f, f.B); ok(f.B.poison === 5, "Apothecary's Case: Poison grows each turn");
  f = fight(['fan_of_knives'], { multiBlock: 4 }); T.useSkill(f, f.A, f.A.skills[1]); ok(f.A.block === 4, "Dancer's Wraps: Block after a multi-hit skill");
  f = fight([], { relic: 0.2 }, { hp: 70 }); T.hit(f, f.B, f.A, 20); ok(f.A.hp === 90, 'Reliquary heals 20% once below 30%'); f.A.hp = 50; T.hit(f, f.B, f.A, 5); ok(f.A.hp === 45, 'Reliquary only once');
  f = fight([], { winDmg: 0.02 }); f.A.won = 3; ok(Math.abs(T.dmgMult(f, f.A, f.B) - 1.06) < 1e-9, 'Tally Bone: +2% a win'); f.A.won = 50; ok(Math.abs(T.dmgMult(f, f.A, f.B) - 1.12) < 1e-9, 'Tally Bone stops at +12%');
  f = fight(['lay_on_hands'], { healBreak: 2 }, { hp: 100 }); f.B.breakMax = 100; f.B.brk = 0; T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.brk === 2, 'Flail of Penance: healing skills deal Break');
  const P = { twinHit: 1 }, sk = G.fighterSkills([{ id: 'fan_of_knives', star: 1, mods: [] }], { STR: 0, AGI: 0, INT: 0, VIT: 0, LUK: 0 }, P)[1], base = G.SKILLS.fan_of_knives.fx;
  ok(sk.def.fx.hits === base.hits + 1 && sk.def.fx.dmg === base.dmg - 1, 'Twin Fangs: one more hit, each 1 less');
}
{ // Robe of Hours: every third turn the cooldowns drop
  const f = fight(['cleave'], { tickDown: 1 }); f.A.skills[1].cd = 3; f.turn = 2; T.startTurn(f, f.A); ok(f.A.skills[1].cd === 3, 'Robe of Hours waits for the third turn'); f.turn = 3; T.startTurn(f, f.A); ok(f.A.skills[1].cd === 2, 'Robe of Hours: cooldowns drop on turn 3');
}
{ // Dice: Let It Ride keeps a high roll, plus 1, for its next use, once; Tampered Dice; Table Stakes; House Chip
  const f = fight(['let_it_ride', 'coin_toss']); const s = f.A.skills[1];
  T.rollDice(f, f.A); s.pip = 4; T.resolveDice(f.A);
  ok(s.def.fx.dmg === 12, 'Let It Ride deals 3 per pip'); T.useSkill(f, f.A, s); ok(s.ride === 5, 'a 4 rides as a 5');
  T.rollDice(f, f.A); ok(s.pip === 5, 'the die keeps its number next turn'); T.rollDice(f, f.A); ok(s.pip === 5, 'and until the skill is used');
  T.useSkill(f, f.A, s); ok(!s.ride, 'a die that rode does not ride again');
  s.pip = 2; T.resolveDice(f.A); T.useSkill(f, f.A, s); ok(!s.ride, 'a 2 does not ride');
  const g = fight(['coin_toss'], { lowDieUp: 1 }, { seed: 'low' }); let okLow = true;
  for (let i = 0; i < 30; i++) { T.rollDice(g, g.A); const p = g.A.skills.slice(1).map(x => x.pip); if (Math.min(...p) < 2) okLow = false; } ok(okLow, 'Tampered Dice: a lone die is never a 1');
  const h = fight(['table_stakes', 'coin_toss', 'hedge']); T.rollDice(h, h.A); h.A.skills[1].pip = 2; h.A.skills[2].pip = 6; h.A.skills[3].pip = 3; T.resolveDice(h.A);
  ok(h.A.skills[1].def.fx.dmg === 30, 'Table Stakes deals 5 per pip of the highest die'); T.useSkill(h, h.A, h.A.skills[1]); T.rollDice(h, h.A);
  ok(h.A.skills[2].pip === 1 && h.A.skills[3].pip === 1, 'Table Stakes: the other dice show 1 next turn'); T.rollDice(h, h.A); ok(!h.A.tapOut, 'only for one turn');
  const c = fight(['coin_toss', 'hedge'], { sixBlock: 5 }, { seed: 'chip' }); let okChip = true, sixes = 0;
  for (let i = 0; i < 60; i++) { c.A.block = 0; const r0 = c.A.rerolls; T.startTurn(c, c.A, true); const six = c.A.skills.some(x => x.pip === 6); if (six) sixes++; if (c.A.block !== (six ? 5 : 0) || c.A.rerolls !== r0 + (six ? 1 : 0)) okChip = false; }
  ok(okChip && sixes > 0, 'House Chip: a six among your dice gives Block and a reroll');
}
// --- whole runs still play through with every Mastery piece open
{
  const meta = G.newMeta(); meta.unlocks = { arch_arcanist: 1, arch_storm: 1, arch_dicer: 1, arch_jinx: 1 }; let seen = 0;
  for (let i = 0; i < 24; i++) {
    G.ARCH_KEYS.forEach(k => meta.mastery[k] = 999);
    try { const r = bot.playRun(meta); seen += r.run.bar.concat(Object.values(r.run.gear)).filter(p => p && (G.pieceDef(G.baseId(p.id)) || {}).mastery).length; } catch (e) { ok(false, 'a bot run with Mastery pieces threw: ' + e.stack.split('\n').slice(0, 3).join(' | ')); }
  }
  ok(seen > 0, 'bot runs with full Mastery ended holding Mastery pieces');
}
console.log(fails ? `mastery test: ${fails} failed` : 'mastery test: all passed');
process.exit(fails ? 1 : 0);
