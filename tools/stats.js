const G = require('../js/core.js'); const B = require('./bot.js');
const N = +process.argv[2] || 400; let meta = G.newMeta();
const lossBy = {}, fightsBy = {}, finals = {}, hp = {};
const res = {}, byArch = {}, byGift = {};
for (let i = 0; i < N; i++) {
  if (i % (+process.env.RESET || 40) === 0) meta = G.newMeta();
  const r = B.playRun(meta, false, { noElite: process.argv[3] !== 'elite' });
  res[r.result] = (res[r.result] || 0) + 1;
  r.run.history.forEach(h => { fightsBy[h.round] = (fightsBy[h.round] || 0) + 1; if (!h.won) lossBy[h.round] = (lossBy[h.round] || 0) + 1; });
  const c = G.runCounts(r.run); const top = Object.keys(c).sort((a, b) => c[b] - c[a])[0] || 'none';
  byArch[top] = byArch[top] || [0, 0]; byArch[top][1]++; if (r.result !== 'erased') byArch[top][0]++;
  r.run.gifts.forEach(g => { byGift[g] = byGift[g] || [0, 0]; byGift[g][1]++; if (r.result !== 'erased') byGift[g][0]++; });
  const fin = G.WORLD_TYPES[r.w.type].final; finals[fin] = finals[fin] || [0, 0]; finals[fin][1]++; if (r.result !== 'erased') finals[fin][0]++;
}
console.log(res);
console.log('loss% by round', Object.keys(fightsBy).map(k => `${k}:${Math.round(100 * (lossBy[k] || 0) / fightsBy[k])}%(${fightsBy[k]})`).join(' '));
console.log('spared by final', JSON.stringify(finals));
console.log('by top archetype', Object.entries(byArch).map(([k, v]) => `${k} ${Math.round(100 * v[0] / v[1])}%(${v[1]})`).join(' '));
console.log('by gift', Object.entries(byGift).map(([k, v]) => `${k} ${Math.round(100 * v[0] / v[1])}%(${v[1]})`).join(' '));
