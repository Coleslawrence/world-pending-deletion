// Read skills test: a Read skill (fx.read) does its stronger version only when the opponent's shown move is that kind,
// says so, and every Read skill and evolution has words for both cases.
//   node tools/read-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
function fightWith(ids) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 4 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['bastion', 'reaper'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  run.bar = ids.map((id, i) => ({ id, star: 1, mods: [], u: 't' + i })); while (run.bar.length < run.slots) run.bar.push(null);
  G.chooseOpponent(run, 0, false);
  return G.newFight(run);
}
const find = (f, id) => f.A.skills.find(s => (s.baseDef || s.def).id === id);
// Show a move of the wanted kind: a plain attack, a plain defend, or a plain debuff
const MOVES = { attack: { dmg: 6 }, defend: { block: 8 }, debuff: { weaken: 2 } };
const show = (f, kind) => { f.B.stun = 0; f.B.intent = { def: { name: 'Test ' + kind, fx: MOVES[kind], tags: [] }, power: 1, cd: 0 }; };
// Every Read skill: the read lands on its kind only, and the words cover it
const reads = Object.values(G.SKILLS).filter(s => s.fx.read);
ok(reads.filter(s => !s.base).length === 8, `8 Read skills in the shop (found ${reads.filter(s => !s.base).length})`);
reads.forEach(d => {
  const f = fightWith([d.id]), s = find(f, d.id);
  ['attack', 'defend', 'debuff'].forEach(k => { show(f, k); ok(G.readHits(f, f.A, s.def.fx) === (k === d.fx.read), `${d.id}: read lands on ${d.fx.read} only (shown ${k})`); });
  show(f, d.fx.read); ok(/^Read · /.test(G.previewSkill(f, s)), `${d.id}: the button preview says Read when it lands`);
  show(f, d.fx.read === 'attack' ? 'defend' : 'attack'); ok(!/^Read/.test(G.previewSkill(f, s)), `${d.id}: no Read in the preview when it misses`);
  ok(/Read: if the opponent's shown move is/.test(G.describe(d)), `${d.id}: its words describe the read`);
  ok(!/undefined|NaN/.test(G.describe(d)), `${d.id}: its words are whole`);
});
// A big attack counts as an attack
{ const f = fightWith(['brace_for_it']), s = find(f, 'brace_for_it'); show(f, 'attack'); f.B.intent.def.fx = { dmg: 999 }; ok(G.readHits(f, f.A, s.def.fx), 'a big attack counts as an attack'); }
// A Stunned opponent shows no move to read
{ const f = fightWith(['brace_for_it']), s = find(f, 'brace_for_it'); show(f, 'attack'); f.B.stun = 1; ok(!G.readHits(f, f.A, s.def.fx), 'nothing to read on a Stunned opponent'); }
// Brace for It: 6 Block normally, 18 Block and Thorns against an attack
{
  const f = fightWith(['brace_for_it']), A = f.A, i = A.skills.indexOf(find(f, 'brace_for_it'));
  show(f, 'defend'); A.block = 0; G.playerAct(f, i); const miss = f.log.map(l => l.t || l).join(' ');
  const g = fightWith(['brace_for_it']), Ag = g.A; show(g, 'attack'); Ag.block = 0; G.playerAct(g, Ag.skills.indexOf(find(g, 'brace_for_it')));
  ok(Ag.thorns > 0 && !(A.thorns > 0), 'Brace for It: Thorns only on a read');
  ok(g.tally.reads === 1 && !f.tally.reads, 'reads are counted in the fight tally');
  ok(!/Read:/.test(miss), 'no Read line when it misses');
}
// Punish: against a defend it ignores Block
{
  const f = fightWith(['punish']), B = f.B; show(f, 'defend'); B.block = 50; const hp = B.hp;
  G.playerAct(f, f.A.skills.indexOf(find(f, 'punish'))); ok(B.hp < hp, 'Punish ignores Block on a read');
}
// Call the Bluff: double power against an attack
{
  const f = fightWith(['call_the_bluff']), s = find(f, 'call_the_bluff'); show(f, 'defend'); const a = G.previewSkill(f, s); show(f, 'attack'); const b = G.previewSkill(f, s);
  const n = t => +(t.match(/(\d+) dmg/) || [])[1]; ok(n(b) >= n(a) * 2 - 1 && n(b) <= n(a) * 2 + 1, `Call the Bluff doubles on a read (${a} / ${b})`);
}
console.log(fails ? `read skills: ${fails} failures` : 'read skills: all checks passed');
process.exit(fails ? 1 : 0);
