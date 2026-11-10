// Designs test (Phase 5): Unfiled designs stay out of runs until filed; a Gatekeeper win drops one 1 time in 3, or
// certainly after two dry runs; a find is kept even if the run is lost; filing costs Echoes; Pending World and practice
// never drop or use them; and the designs' fight rules do what their words say.
//   node tools/designs-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js'), bot = require('./bot.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function newRun(meta, setup, seed) {
  G.bindMeta(meta);
  const rng = G.seedRng(seed || 'd'), w = G.offerWorlds(meta, rng)[0];
  return G.newRun(w, Object.assign({ name: 'T', stats: { STR: 3, AGI: 3, INT: 3, VIT: 3, LUK: 3 }, gifts: [], patron: 'none' }, setup), meta, rng);
}
const ids = G.designIds();
ok(ids.length === 10, `10 designs (${ids.length})`);
ids.forEach(id => { const d = G.pieceDef(id); ok(d.tags.length === 2, `${id} carries two archetypes`); ok(!d.mastery, `${id} is not a Mastery piece`); ok(G.designCost(id) === (d.rank === 'B' ? 25 : 15), `${id} costs ${G.designCost(id)}`); });
ok(ids.reduce((a, id) => a + G.designCost(id), 0) === 160, 'all ten cost 160 Echoes');
const all = G.newMeta(); all.unlocks = { arch_arcanist: 1, arch_storm: 1, arch_dicer: 1, arch_jinx: 1 };
// --- closed until filed
{
  const run = newRun(all, {});
  ok(Array.isArray(run.designs) && run.designs.length === 0, 'a new player has no designs filed');
  ok(!G.poolIds(run).some(id => G.pieceDef(id).design), 'no design is in the pool before filing');
  const meta = JSON.parse(JSON.stringify(all)); meta.designs = { found: { miasma: 1 }, filed: { miasma: 1 }, dry: 0 };
  let seen = false; for (let i = 0; i < 40 && !seen; i++) { const r = newRun(meta, {}, 'o' + i); if (r.arch.some(a => G.SKILLS.miasma.tags.includes(a))) { seen = true; ok(G.poolIds(r).includes('miasma'), 'a filed design joins the pool of its archetypes'); ok(!G.poolIds(r).some(id => G.pieceDef(id).design && id !== 'miasma'), 'only filed designs join'); } }
  ok(seen, 'found a run with a Miasma archetype');
}
// --- drops
{
  const meta = JSON.parse(JSON.stringify(all)), run = newRun(meta, {}); let drops = 0;
  for (let i = 0; i < 300; i++) { meta.designs = { found: {}, filed: {}, dry: 0 }; run.designFound = []; const m = []; if (G.dropDesign(run, meta, m, G.seedRng('x' + i))) drops++; }
  ok(drops > 70 && drops < 130, `about 1 in 3 Gatekeeper wins drop a design (${drops} of 300)`);
  meta.designs = { found: {}, filed: {}, dry: 2 }; let sure = 0;
  for (let i = 0; i < 50; i++) { meta.designs.dry = 2; run.designFound = []; if (G.dropDesign(run, meta, [], G.seedRng('y' + i))) sure++; meta.designs.found = {}; }
  ok(sure === 50, 'after two dry runs the next Gatekeeper win always drops one');
  meta.designs = { found: {}, filed: {}, dry: 0 }; ids.forEach(id => meta.designs.found[id] = 1); meta.designs.dry = 2;
  ok(G.dropDesign(run, meta, [], G.seedRng('z')) === null, 'nothing drops once every design is found');
  // dry count
  meta.designs = { found: {}, filed: {}, dry: 0 }; const r1 = newRun(meta, {}); r1.designFound = [];
  G.settleDesigns(r1, meta); ok(meta.designs.dry === 1, 'a run without a find adds to the dry count');
  const r2 = newRun(meta, {}); r2.designFound = []; meta.designs.dry = 5; G.dropDesign(r2, meta, [], G.seedRng('w')); G.settleDesigns(r2, meta); ok(meta.designs.dry === 0, 'a find resets it');
}
// --- a find is kept through a loss, filing costs Echoes
{
  const meta = JSON.parse(JSON.stringify(all)); meta.designs = { found: {}, filed: {}, dry: 2 }; const run = newRun(meta, {});
  const id = G.dropDesign(run, meta, [], G.seedRng('k')); G.endRun(run, meta, 'erased');
  ok(meta.designs.found[id] && !meta.designs.filed[id], 'the find survives an erased run');
  meta.echoes = G.designCost(id) - 1; ok(!G.fileDesign(meta, id), 'filing needs the Echoes');
  meta.echoes = G.designCost(id) + 3; ok(G.fileDesign(meta, id) && meta.echoes === 3 && meta.designs.filed[id], 'filing takes the Echoes');
  ok(!G.fileDesign(meta, id), 'a design files once'); ok(!G.fileDesign(meta, ids.find(x => !meta.designs.found[x])), 'an unfound design cannot be filed');
  const back = G.migrateMeta(JSON.parse(JSON.stringify(meta))); ok(back.designs.filed[id] && back.designs.found[id], 'designs survive a save and load');
  const junk = G.migrateMeta({ v: G.VERSION, designs: { found: { nope: 1 }, filed: { miasma: 1 }, dry: -4 } }).designs;
  ok(!junk.found.nope && junk.found.miasma && junk.filed.miasma && junk.dry === 0, 'saved designs are cleaned (filed implies found)');
}
// --- Pending World and practice
{
  const meta = JSON.parse(JSON.stringify(all)); ids.forEach(id => { meta.designs.found[id] = 1; meta.designs.filed[id] = 1; }); meta.designs.dry = 2;
  const d = newRun(meta, { seed: 'wpd:2026-12-02', daily: '2026-12-02' });
  ok(d.designs.length === 0 && !G.poolIds(d).some(id => G.pieceDef(id).design), 'Pending World never uses designs');
  const m2 = JSON.parse(JSON.stringify(all)); m2.designs = { found: {}, filed: {}, dry: 2 }; const d2 = newRun(m2, { seed: 'wpd:2026-12-02', daily: '2026-12-02' });
  ok(G.dropDesign(d2, m2, [], G.seedRng('p')) === null && m2.designs.dry === 2, 'Pending World never drops one'); G.settleDesigns(d2, m2); ok(m2.designs.dry === 2, 'nor counts as dry');
}
// --- fight rules
function fight(skills, P, o) {
  o = o || {};
  const mk = (id, i) => ({ key: 's' + i, def: Object.assign({}, G.SKILLS[id], { fx: Object.assign({}, G.SKILLS[id].fx) }), power: 1, cd: 0, star: 1 });
  const A = G.blankFighter({ side: 'A', name: 'A', isPlayer: true, maxHp: 200, hp: o.hp || 200, P: P || {}, crit: 0, critMult: 1.5, dodge: 0, skills: [{ key: 'attack', def: G.SKILLS.attack, power: 1, cd: 0, star: 1 }].concat(skills.map(mk)) });
  const B = G.blankFighter({ side: 'B', name: 'B', maxHp: 400, hp: o.bhp || 400, P: {}, crit: 0, critMult: 1.5, dodge: 0, skills: [{ key: 'e0', def: { id: 'e0', name: 'Wait', fx: {}, tags: [] }, power: 1, cd: 0 }] });
  [A, B].forEach(X => { X.rerolls = 0; X.curse = 0; X.misfortune = 0; X.omens = []; });
  return { rng: G.seedRng(o.seed || 'f'), turn: 1, A, B, phase: 'player', over: false, events: [], log: [], useCounts: {}, lastPlayerSkill: null, dealt: {}, rx: [], tally: { breaks: 0, burn: 0, maxPoison: 0, bigHit: 0, blocked: 0, turns: 0, healed: 0, reactions: 0, bigStopped: 0, mostUsed: null, hurtBy: {}, taken: 0, stuns: 0, quickTurn: 0, maxQuick: 0, overkill: 0 }, spec: {} };
}
const T = G._test;
{ let f = fight(['searing_mercy'], {}, { hp: 150 }); f.B.burn = 8; T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.burn === 0 && f.A.hp === 158, 'Searing Mercy turns their Burn into healing');
  f = fight(['searing_mercy'], {}, { hp: 150 }); f.B.burn = 30; T.useSkill(f, f.A, f.A.skills[1]); ok(f.A.hp === 162, 'up to 12'); }
{ let f = fight(['blood_price'], {}, { bhp: 150 }); T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.poison === 12 && f.A.hp === 195, 'Blood Price: 5 HP, 6 Poison doubled below half');
  f = fight(['blood_price']); T.useSkill(f, f.A, f.A.skills[1]); ok(f.B.poison === 6, 'Blood Price: 6 Poison otherwise'); }
{ const f = fight(['vow_of_iron'], {}, { hp: 150 }); T.useSkill(f, f.A, f.A.skills[1]); ok(f.A.block === 10, 'Vow of Iron: 10 Block'); T.startTurn(f, f.A); ok(f.A.hp === 155 && f.A.block === 0, 'heals half the Block still held next turn');
  T.useSkill(f, f.A, f.A.skills[1]); f.A.block = 0; T.startTurn(f, f.A); ok(f.A.hp === 155, 'no Block, no healing'); }
{ let f = fight([], { burnBlock: 2 }); f.B.burn = 6; T.startTurn(f, f.B); ok(f.A.block === 2, "Smelter's Apron: Block when their Burn hurts them");
  f = fight([], { blockWeaken: 1 }); f.A.block = 10; T.hit(f, f.B, f.A, 5); ok(f.B.weaken === 1, 'Grounding Mail: a fully blocked hit Weakens the attacker'); f.B.weaken = 0; T.hit(f, f.B, f.A, 50); ok(f.B.weaken === 0, 'not when the hit gets through');
  f = fight([], { vsBleed: 0.15 }); ok(Math.abs(T.dmgMult(f, f.A, f.B) - 1) < 1e-9, 'Bloodletter does nothing without Bleed'); f.B.bleed = 2; ok(Math.abs(T.dmgMult(f, f.A, f.B) - 1.15) < 1e-9, 'Bloodletter +15% against bleeding');
  f = fight(['coin_toss'], { sixMisf: 2 }, { seed: 'six' }); let sixes = 0; for (let i = 0; i < 40; i++) { T.rollDice(f, f.A); if (f.A.skills[1].pip === 6) sixes++; } ok(sixes > 0 && f.B.misfortune === sixes * 2, `Hexed Dice: 2 Misfortune per six (${sixes} sixes, ${f.B.misfortune})`); }
// --- whole runs play through with every design filed
{
  const meta = JSON.parse(JSON.stringify(all)); let seen = 0;
  for (let i = 0; i < 24; i++) { ids.forEach(id => { meta.designs.found[id] = 1; meta.designs.filed[id] = 1; });
    try { const r = bot.playRun(meta); seen += r.run.bar.concat(Object.values(r.run.gear)).filter(p => p && (G.pieceDef(G.baseId(p.id)) || {}).design).length; } catch (e) { ok(false, 'a bot run with designs threw: ' + e.stack.split('\n').slice(0, 3).join(' | ')); } }
  ok(seen > 0, 'bot runs with every design filed ended holding designs');
}
console.log(fails ? `designs test: ${fails} failed` : 'designs test: all passed');
process.exit(fails ? 1 : 0);
