// Signature Gift test (12 Nov): every Gift plays whole runs without errors, and the new rule-breakers do what they say.
//   node tools/signature-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js'), B = require('./bot.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const live = Object.keys(G.GIFTS).filter(k => !['world', 'extra', 'retired'].includes(G.GIFTS[k].cat));
// 1. Whole runs with each Gift: no errors, no stuck runs
live.forEach(k => {
  for (let i = 0; i < 6; i++) {
    Math.random = seeded(1000 + i);
    const meta = G.newMeta(); Object.keys(G.UNLOCKS).forEach(u => meta.unlocks[u] = true);
    let r; try { r = B.playRun(meta, false, { noElite: true, gifts: [G.WORLD_TYPES[G.offerWorlds(meta)[0].type].gift, k].filter((x, j, a) => a.indexOf(x) === j) }); }
    catch (e) { ok(false, `${k}: run threw ${e.message}`); break; }
    ok(r.result !== 'stuck', `${k}: run finished`);
  }
});
// 2. Fight-level checks
function fightWith(gifts, opts = {}) {
  Math.random = seeded(opts.seed || 7);
  const meta = G.newMeta(); G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'T', stats: { STR: 4, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [G.WORLD_TYPES[w.type].gift].concat(gifts), patron: 'war', offer: G.makeOffer(w, meta) }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  run.pending = run.pending.filter(p => p.type === 'rule');
  if (opts.precedent) { G.takeRule(run, 0, []); opts.second = run.pending.find(p => p.type === 'rule' && p.kind === 'precedent'); }
  run.pending = [];
  if (run.stage === 'choose') G.chooseOpponent(run, 0, false);
  if (opts.round) run.round = opts.round;
  return { run, meta, f: G.newFight(run) };
}
{ const { f } = fightWith(['adminrights']); const sw = f.A.skills.find(s => s.key === 'swap'); ok(sw && sw.def.quick, 'Running Order adds a Quick Swap'); ok(f.foresight, 'Running Order shows the next 2 moves'); ok(sw.def.cd === 3, 'Swap comes back every 3 turns');
  const before = f.B.intent, nx = G.peekNext(f); if (nx && nx !== before) { G.playerAct(f, f.A.skills.indexOf(sw)); ok(f.B.intent === nx, 'Swap brings the next move forward'); ok(f.phase === 'player', 'Swap is Quick'); } }
{ const { f } = fightWith(['trashtalk']); const t = f.A.skills.find(s => s.key === 'bait'); G.playerAct(f, f.A.skills.indexOf(t)); ok(f.B.intent && f.B.intent.def.id === 'baited', 'Trash Talk turns the shown move into a guard'); ok(t.def.cd === 3, 'Trash Talk comes back every 3 turns'); }
{ const { f } = fightWith(['powerarmour']); ok(f.A.armour > 0 && f.A.armour === Math.round(0.4 * f.A.maxHp), 'Blast Plate starts at 40% of max HP');
  const bh = f.B.hp; G.hit(f, f.B, f.A, f.A.armour + 5, { noDodge: 1, noCrit: 1 }); ok(f.A.armour === 0 && f.B.hp < bh, 'broken armour blasts the attacker'); }
{ const { f } = fightWith(['hometown']); f.A.block = 0; const hp = f.A.hp; G.hit(f, f.B, f.A, Math.round(f.A.maxHp * 0.3), { noDodge: 1, noCrit: 1 }); ok(f.A.hp === hp, 'Hometown Crowd takes the first big hit');
  G.hit(f, f.B, f.A, Math.round(f.A.maxHp * 0.3), { noDodge: 1, noCrit: 1 }); ok(f.A.hp === hp, 'and the second');
  G.hit(f, f.B, f.A, Math.round(f.A.maxHp * 0.3), { noDodge: 1, noCrit: 1 }); ok(f.A.hp < hp, 'only twice per fight'); }
{ const { f } = fightWith(['bodydouble']); f.A.block = 0; G.hit(f, f.B, f.A, f.A.hp + 50, { noDodge: 1, noCrit: 1, pierce: 1 }); ok(f.A.hp === Math.round(f.A.maxHp * 0.5) && f.usedDouble, 'Second Self steps in at 50% HP'); }
{ const { f } = fightWith(['insidejob']); ok(f.B.rigged, 'Rigged Bout rigs a move'); }
{ const { f } = fightWith(['growthspurt']); const m = f.A.maxHp; f.turn = 2; G.startTurn(f, f.A); ok(f.A.maxHp === m + 6 && f.A.grown === 1, 'Growth Spurt grows each turn'); }
{ const { f } = fightWith(['silvertongue']); f.B.hp = Math.round(f.B.maxHp * 0.55); f.B.brk = f.B.breakMax - 1; G.addBreak(f, f.A, f.B, 50); ok(f.B.hp === 0 && f.terms, 'Silver Tongue: a Broken opponent below 60% yields'); }
{ const { run } = fightWith(['precedent'], { precedent: true }); ok([].concat(run.precedent).length === 1 && G.PRECEDENTS[run.precedent[0]], 'Standing Precedent files a rule after the draft'); }
{ const { run } = fightWith(['chatdecides']); run.pending = []; run.round = 2; G.enterChoose(run, G.newMeta()); const p = run.pending.find(x => x.type === 'rule'); ok(p && p.offers.length === 3, 'Poll the Crowd offers 3 house rules each round'); G.takeRule(run, 0, []); ok(G.HOUSE_RULES[run.chatRule], 'the chosen rule is set for the next fight'); }
{ const { f } = fightWith(['lightfingers'], { round: 6, seed: 3 }); let t = 0; while (!f.stolen && t++ < 30 && !f.over) { G.playerAct(f, 0); if (!f.over) G.enemyTurn(f); } ok(f.stolen || f.over, 'Light Fingers steals once a big hit is shown (or the fight ended first)'); }
{ const { f } = fightWith(['glass']); f.A.block = 0; G.gainBlock(f, f.A, 20); ok(f.A.block === 0, 'Glass Cannon: no Block'); }
{ const opts = { precedent: true }; const { run } = fightWith(['precedent'], opts); ok(opts.second && opts.second.offers.length === 2, 'a second Precedent is offered from the other two'); }
{ const { run } = fightWith([]); const c0 = G.runCounts(run), r2 = Object.assign({}, run, { gifts: run.gifts.concat('monarch') }), c2 = G.runCounts(r2); ok(Object.keys(c0).every(k => c2[k] === c0[k] + 2), "Monarch's Domain counts 2 extra pieces"); }
// Sponsorship Offer replaces the Chosen Gifts
ok(G.EVENTS.sponsorship && G.GIFTS.chosen_war.cat === 'retired', 'the Chosen Gifts are now the Sponsorship Offer event');
console.log(fails ? `${fails} failed` : 'signature gifts: all passed');
process.exit(fails ? 1 : 0);
