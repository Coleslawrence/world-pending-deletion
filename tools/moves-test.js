// Weighted moves test: opponents with a Reflex pick moves by chance, weighted by their script; never the same move
// three turns running, never a big move twice running; the move after next is known ahead; rivals and Final Champions
// weight up moves that answer the fight; practice fights and examiners keep their fixed order.
//   node tools/moves-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0, seed = 1;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
const rng = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function fight(id) {
  const meta = G.newMeta(); delete meta.rank; G.bindMeta(meta);
  const w = G.offerWorlds(meta)[0];
  const run = G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 4 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta), arch: ['bastion', 'reaper'] }, meta);
  G.confirmDraft(run, run.draft.slice(0, 3), meta);
  G.chooseOpponent(run, 0, false);
  const spec = G.currentSpec(run); Object.keys(spec).forEach(k => delete spec[k]); Object.assign(spec, { kind: G.ENEMIES[id].final ? 'final' : G.ENEMIES[id].rival ? 'rival' : 'monster', id, traits: [] });
  const f = G.newFight(run); f.rng = rng; f.B.reflex = null; f.B.reflexes = []; f.B.phase = null; f.A.hp = f.A.maxHp = 9999; f.B.hp = f.B.maxHp = 99999;
  return f;
}
// Play the opponent for many turns without the player acting, recording each move it uses
function moves(f, turns) { const out = []; for (let k = 0; k < turns; k++) { const s = f.B.intent, i = f.B.skills.indexOf(s); out.push(i); f.B.stun = 0; G.skipPlayer(f); f.A.stun = 0; G.enemyTurn(f); f.A.hp = f.A.maxHp; } return out; }
const ids = G.MONSTERS.concat(G.RIVALS, Object.keys(G.ENEMIES).filter(k => G.ENEMIES[k].final));
ids.forEach(id => {
  const e = G.ENEMIES[id]; let f = fight(id);
  ok(!f.B.fixed, `${id}: picks by chance`);
  // Fights end by turn 30 (the crowd grows restless), so play 15 fights of 20 turns
  const seq = []; let match = 0, total = 0;
  for (let n = 0; n < 15; n++) {
    f = fight(id); const part = [], peeks = [];
    for (let k = 0; k < 20; k++) { peeks.push(G.intentInfo(Object.assign(f, { foresight: true })).then); part.push(...moves(f, 1)); }
    for (let k = 0; k < part.length - 1; k++) { const s = f.B.skills[part[k + 1]]; total++; if (peeks[k] === (s.def.label || s.def.name)) match++; }
    for (let k = 2; k < part.length; k++) if (part[k] === part[k - 1] && part[k] === part[k - 2]) { ok(false, `${id}: same move three turns running at turn ${k}`); break; }
    seq.push(...part);
  }
  // The shown "then" is the move that comes next
  ok(match >= total * 0.9, `${id}: the shown move after next comes true (${match}/${total})`);
  // Every move in its script gets used, so nothing is lost
  new Set(e.script).forEach(i => ok(seq.includes(i), `${id}: ${e.skills[i].n} is still used`));
  // Not a fixed loop: at least two different moves follow some move
  const after = {}; for (let k = 0; k < seq.length - 1; k++) (after[seq[k]] = after[seq[k]] || new Set()).add(seq[k + 1]);
  ok(Object.values(after).some(s => s.size >= 2) || new Set(e.script).size < 2, `${id}: not a fixed loop`);
});
// A big move never twice running (Pit Brute's Crushing Swing)
{ const f = fight('brute'); f.A.maxHp = 100; const seq = moves(f, 25); let twice = false; for (let k = 1; k < seq.length; k++) if (seq[k] === 1 && seq[k - 1] === 1) twice = true; ok(!twice, 'a big move never twice running'); }
// Tactics: Seraphine cleanses... Kaito's Purifying Seal comes up more when he is poisoned
{
  const count = poisoned => { let n = 0; for (let k = 0; k < 2000; k++) { const f = fight('kaito'); f.B.hist = []; f.B.next = null; f.B.poison = poisoned ? 10 : 0; f.B.skills.forEach(s => s.cd = 0); G.planIntentForTest(f, f.B); if (f.B.intent.def.name === 'Purifying Seal') n++; } return n; };
  // its own seed and 2000 tries, so new content earlier in this file can't tip it (the true ratio is about 2x)
  seed = 1; const a = count(false), b = count(true); ok(b > a * 1.6, `a rival cleanses more when afflicted (${a} -> ${b} of 2000)`);
}
// Practice fights and examiners keep the fixed order
ok(fight('proctor').B.fixed, 'the Rank Trial examiner keeps its fixed order');
console.log(fails ? `moves test: ${fails} failed` : `moves test: all passed (${ids.length} opponents)`);
process.exit(fails ? 1 : 0);
