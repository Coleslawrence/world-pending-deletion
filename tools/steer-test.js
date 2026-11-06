// Steer the next world test: every layer the request sheet lists gives a world with that layer, from a type the player
// can play (home class unlocked), and the world starts a normal run.
//   node tools/steer-test.js     # exits 1 on any failure
'use strict';
const G = require('../js/core.js');
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL ' + msg); } };
const metas = { fresh: G.newMeta(), all: G.newMeta() };
Object.keys(G.UNLOCKS).forEach(k => { metas.all.unlocks[k] = true; });
for (const [label, meta] of Object.entries(metas)) {
  delete meta.rank; G.bindMeta(meta);
  const open = G.unlockedArch(meta), O = G.steerOptions(meta);
  ok(O.type.length && O.fate.length && O.people.length, `${label}: every tab lists something`);
  for (const kind of Object.keys(G.STEER_KINDS)) for (const key of O[kind]) for (let i = 0; i < 5; i++) {
    const w = G.steerWorld(meta, kind, key);
    ok(w && w[kind] === key, `${label}: ${kind} ${key} is honoured`);
    if (!w) continue;
    ok(open.includes(G.WORLD_TYPES[w.type].home), `${label}: ${kind} ${key} gives a playable type (${w.type})`);
    ok(G.MODIFIERS[w.mod], `${label}: ${kind} ${key} has a modifier`);
    if (i) continue;
    try { G.newRun(w, { name: 'Test', stats: { STR: 2, AGI: 2, INT: 2, VIT: 4, LUK: 2 }, gifts: [], patron: Object.keys(G.GODS)[0], offer: G.makeOffer(w, meta) }, meta); }
    catch (e) { ok(false, `${label}: ${kind} ${key} run starts (${e.message})`); }
  }
}
console.log(fails ? `${fails} failures` : 'Steer test passed');
process.exit(fails ? 1 : 0);
