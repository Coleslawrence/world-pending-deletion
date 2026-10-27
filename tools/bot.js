const G = require('../js/core.js');
const RV = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 };
function choosePlayer(f) {
  const A = f.A, B = f.B, ready = A.skills.map((s, i) => ({ s, i })).filter(x => G.canUse(x.s));
  const intent = G.intentInfo(f);
  const low = A.hp / A.maxHp < 0.4;
  let best = ready[0], bs = -1;
  ready.forEach(({ s, i }) => {
    const fx = s.def.fx, p = s.power;
    let sc = ((fx.dmg || 0) * (fx.hits || 1) + (fx.burn || 0) * 1.6 + (fx.poison || 0) * 2.5 + (fx.bleed || 0) * 1.5 + (fx.detonate ? B.burn * fx.detonate : 0) + (fx.malice ? fx.malice * 2 : 0) + (fx.blockDmg ? A.block * fx.blockDmg : 0)) * p;
    if (fx.execute && B.hp / B.maxHp <= fx.execute) sc *= fx.execMult;
    if (fx.cruel) sc *= 1.3;
    if (fx.block) sc += fx.block * p * ((intent.kind === 'attack' || intent.kind === 'big') ? 1 : 0.25);
    if (fx.heal) sc += low ? fx.heal * p * 1.5 : 0;
    if (fx.healMissing) sc += low ? (A.maxHp - A.hp) * fx.healMissing * 1.2 : 0;
    if ((fx.stun || fx.interrupt || (fx.stunIfWeak && B.weaken)) && intent.kind === 'big') sc += 25;
    if (fx.empower) sc += 8; if (fx.evade && intent.kind === 'big') sc += 15;
    if (fx.weaken && (intent.kind === 'attack' || intent.kind === 'big')) sc += 6;
    if (fx.cleanse) sc += (A.poison + A.burn) * 1.5;
    if (fx.momentum) sc += fx.momentum * (A.streak || 0) * p;
    if (fx.doom || fx.leech) sc += ((fx.doom || 0) * 0.6 + (fx.leech || 0) * 3) * p;
    if (fx.riposte && (intent.kind === 'attack' || intent.kind === 'big')) sc += 10;
    if (fx.thorns) sc += fx.thorns * p * 0.6;
    if (fx.regen) sc += fx.regen * p * 2;
    if (fx.mark || fx.focus || fx.haste || fx.siphon) sc += 12;
    if (s.def.quick) sc += 1000;
    if (sc > bs) { bs = sc; best = { s, i }; }
  });
  return best.i;
}
function fight(run) {
  const f = G.newFight(run);
  let guard = 0;
  while (!f.over && guard++ < 300) {
    if (f.phase === 'player') G.playerAct(f, choosePlayer(f));
    else if (f.phase === 'stunned') G.skipPlayer(f);
    if (!f.over && f.phase === 'enemy') G.enemyTurn(f);
  }
  return f;
}
function targets(run) {
  const c = {};
  G.allPieces(run).forEach(p => G.pieceDef(G.baseId(p.id)).tags.forEach(t => c[t] = (c[t] || 0) + p.star));
  const lead = run.botMain || run.arch[0], bias = run.botMain ? 6 : 0.5;
  const order = run.arch.slice().sort((a, b) => (c[b] || 0) - (c[a] || 0) + (b === lead ? bias : 0) - (a === lead ? bias : 0));
  return order.slice(0, 2);
}
function pieceScore(run, id, star, tg) {
  const d = G.pieceDef(G.baseId(id));
  return RV[d.rank] * 1.2 + (star - 1) * 4 + d.tags.filter(t => tg.includes(t)).length * 2.5 + (G.SKILLS[id] && G.SKILLS[id].base ? 3 : 0);
}
function arrange(run) {
  const tg = targets(run);
  // skills: put best on the bar
  const skills = G.allPieces(run).filter(p => !G.isGear(p.id)).sort((a, b) => pieceScore(run, b.id, b.star, tg) - pieceScore(run, a.id, a.star, tg));
  skills.slice(0, run.slots).forEach((p, i) => { const f = G.findPiece(run, p.u); if (!(f.at === 'bar')) G.movePiece(run, p.u, { bar: run.bar.indexOf(null) >= 0 ? run.bar.indexOf(null) : worstBar(run, tg) }); });
  G.GEAR_SLOTS.forEach(sl => {
    const gs = G.allPieces(run).filter(p => G.isGear(p.id) && G.GEAR[p.id].slot === sl).sort((a, b) => pieceScore(run, b.id, b.star, tg) - pieceScore(run, a.id, a.star, tg));
    if (gs[0] && (!run.gear[sl] || run.gear[sl].u !== gs[0].u)) G.movePiece(run, gs[0].u, { gear: sl });
  });
}
function worstBar(run, tg) { let w = 0, ws = 1e9; run.bar.forEach((p, i) => { const s = p ? pieceScore(run, p.id, p.star, tg) : -1; if (s < ws) { ws = s; w = i; } }); return w; }
function shop(run, meta, opts) {
  const tg = targets(run);
  let guard = 0;
  const reserve = run.round >= 3 && run.round < 7 ? 10 : 0;
  while (guard++ < 30) {
    let bought = false;
    G.ensureShop(run);
    const items = [];
    G.SHOP_KINDS.forEach(k => run.shop[k].forEach((it, i) => { if (it) items.push({ it, k, i }); }));
    if (run.bonusSlot) items.push({ it: run.bonusSlot, k: 'bonus', i: 0 });
    items.sort((a, b) => score(b.it) - score(a.it));
    // an empty gear slot is worth filling even with low-rank gear, which otherwise scores under the buy threshold
    function score(it) { const have = G.allPieces(run).filter(p => p.id === it.id).length, open = G.isGear(it.id) && !run.gear[G.GEAR[it.id].slot] && !run.bench.some(p => G.isGear(p.id) && G.GEAR[p.id].slot === G.GEAR[it.id].slot); return pieceScore(run, it.id, 1, tg) + have * 4 + (open ? 3 : 0); }
    for (const x of items) {
      const sc = score(x.it), pr = G.price(run, x.it);
      if (sc < (opts.picky || 5)) continue;
      if (run.gold - pr < reserve && sc < 12) continue;
      if (run.bench.length >= 8 && !G.wouldMerge(run, x.it.id)) { // sell worst bench piece
        const worst = run.bench.slice().sort((a, b) => pieceScore(run, a.id, a.star, tg) - pieceScore(run, b.id, b.star, tg))[0];
        if (pieceScore(run, worst.id, worst.star, tg) < sc - 2) G.sell(run, worst.u); else continue;
      }
      if (G.buy(run, x.k, x.i, [])) { bought = true; break; }
    }
    if (!bought) {
      if (run.gold >= reserve + 6 && run.level < 9 && run.gold >= 4 && opts.xp && run.gold > 24) { G.buyXp(run, []); continue; }
      if (run.gold >= reserve + 4 && opts.reroll) { G.reroll(run, null, Math.random() < 0.7 ? 'skill' : 'gear'); continue; }
      break;
    }
  }
  arrange(run);
}
function pending(run, meta) {
  while (run.pending.length) {
    const p = run.pending.shift();
    if (p.type === 'rune') { for (const m of p.mods) { const t = G.prefixTargets(run, m).filter(x => x.mods.length < 2 && run.bar.some(b => b && b.u === x.u)); if (t.length) { G.applyPrefix(run, t[0].u, m); break; } } }
    if (p.type === 'event') { const E = G.EVENTS[p.key]; for (let i = 0; i < E.opts.length; i++) if (G.resolveEvent(run, p.key, i, meta, null, [])) break; }
    if (p.type === 'gift') G.applyGift(run, p.offers[0], []);
    if (p.type === 'perk') { run.pending.unshift(p); G.choosePerk(run, meta, p.offers[0]); }
    if (p.type === 'evo') { const f = G.findPiece(run, p.u); if (f) { const evo = G.SKILLS[f.p.id].evo; run.pending.unshift(p); G.evolve(run, p.u, evo[Math.random() < 0.5 ? 0 : 1], meta); } }
  }
}
function stats(run) {
  const tg = targets(run); const k = G.ARCH[tg[0]].stat;
  while (run.statPts > 0) { run.stats[Math.random() < 0.6 ? k : 'VIT']++; run.statPts--; }
}
function playRun(meta, verbose, opts = {}) {
  // opts.world forces a world type; opts.main makes the bot build around one archetype
  let w = G.offerWorlds(meta)[0], tries = 0;
  while (opts.world && w.type !== opts.world && tries++ < 200) w = G.offerWorlds(meta).find(x => x.type === opts.world) || w;
  const home = G.WORLD_TYPES[w.type].home, main = opts.main || home, hs = G.ARCH[main].stat;
  const st = { STR: 2, AGI: 2, INT: 2, VIT: 2, LUK: 2 }; st[hs] += 2; st.VIT += 2;
  const patron = G.pick(['war', 'trick', 'ruin']);
  G.bindMeta(meta);
  const offer = G.makeOffer(w, meta);
  const gifts = opts.gifts || G.randomGifts(w, meta, patron, offer);
  const titles = Object.keys(meta.titles);
  const arch = opts.main && opts.main !== home ? [opts.main].concat(G.shuffle(G.unlockedArch(meta).filter(k => k !== home && k !== opts.main))) : undefined;
  const run = G.newRun(w, { name: 'Bot', stats: st, gifts, patron, offer, arch, title: titles.length ? G.pick(titles) : null }, meta);
  if (opts.main) run.botMain = opts.main;
  const ids = run.draft.slice().sort((a, b) => (G.SKILLS[b].tags.includes(main) ? 1 : 0) - (G.SKILLS[a].tags.includes(main) ? 1 : 0)).slice(0, 3);
  G.confirmDraft(run, ids, meta);
  let guard = 0;
  while (guard++ < 40) {
    pending(run, meta);
    if (run.stage === 'choose') {
      const trial = run.choices[1] && run.choices[1].kind === 'trial';
      const hard = trial || run.choices.length > 1 && run.hp > G.maxHp(run) * 0.75 && run.hearts > 5 && Math.random() < (opts.hardRate != null ? opts.hardRate : 0.35);
      G.chooseOpponent(run, hard ? 1 : 0, run.gold >= 15);
    }
    stats(run);
    shop(run, meta, { reroll: true, xp: true, picky: opts.picky });
    pending(run, meta); arrange(run);
    G.leaveShop(run, null, []);
    const d = run.districts;
    const k = run.hp < G.maxHp(run) * 0.6 && d.includes('infirmary') ? 'infirmary' : d.includes('sanctum') && run.hearts <= run.maxHearts - 2 ? 'sanctum' : d.includes('enchanter') ? 'enchanter' : d.includes('infirmary') ? 'infirmary' : d[0];
    G.useDistrict(run, k);
    pending(run, meta);
    if (k === 'infirmary') G.infirmary(run);
    if (k === 'sanctum') G.sanctum(run);
    if (k === 'enchanter') { const ms = G.rollPrefixes(3, null, null, run); for (const m of ms) { const t = G.prefixTargets(run, m).filter(x => x.mods.length < 2 && run.bar.some(b => b && b.u === x.u)); if (t.length) { G.applyPrefix(run, t[0].u, m); break; } } }
    const spec = G.currentSpec(run);
    const f = fight(run);
    const r = G.resolveFight(run, f, meta);
    if (verbose) console.log(`${run.elite ? 'E' : 'R'}${run.elite ? run.eliteIdx : run.round} ${G.specName(spec).padEnd(34)} ${r.won ? 'WIN ' : 'LOSS'} t${String(f.turn).padStart(2)} hp ${f.A.hp}/${f.A.maxHp} vs ${f.B.hp}/${f.B.maxHp} L${run.level} g${run.gold} ♥${run.hearts} ${run.bar.map(p => p ? G.SKILLS[p.id].name + '★' + p.star : '-').join(', ')} | ${G.GEAR_SLOTS.map(s => run.gear[s] ? G.GEAR[run.gear[s].id].name + '★' + run.gear[s].star : '-').join(', ')}`);
    if (r.rewind) continue;
    if (r.death) { G.endRun(run, meta, 'erased'); return { result: 'erased', round: run.round, w, run }; }
    if (r.spared) { G.endRun(run, meta, 'spared'); if (opts.noElite) return { result: 'spared', w, run }; G.startElite(run, meta); continue; }
    if (r.eliteOver) return { result: r.eliteCleared ? 'elite-clear' : 'spared', w, run };
  }
  return { result: 'stuck', w, run };
}
module.exports = { playRun, choosePlayer };
if (require.main === module) {
  if (process.argv[2] === 'v') { const meta = G.newMeta(); for (let i = 0; i < (+process.argv[3] || 1); i++) console.log(playRun(meta, true).result); }
  else {
    const N = +process.argv[2] || 400, out = {}, byRank = {}, byType = {}; let meta = G.newMeta();
    const rounds = {}; let lv = 0, stars = 0, mergesN = 0;
    for (let i = 0; i < N; i++) {
      if (i % 40 === 0) meta = G.newMeta();
      const r = playRun(meta); out[r.result] = (out[r.result] || 0) + 1;
      if (r.result === 'erased') rounds[r.round] = (rounds[r.round] || 0) + 1;
      const k = r.w.rank; byRank[k] = byRank[k] || [0, 0]; byRank[k][1]++; if (r.result !== 'erased') byRank[k][0]++;
      byType[r.w.type] = byType[r.w.type] || [0, 0]; byType[r.w.type][1]++; if (r.result !== 'erased') byType[r.w.type][0]++;
      lv += r.run.level; G.allPieces(r.run).forEach(p => { stars += p.star; mergesN++; });
    }
    console.log(out); console.log('erased at round', rounds); console.log('win by rank', byRank); console.log('win by type', byType);
    console.log('avg level', (lv / N).toFixed(1), 'avg star', (stars / mergesN).toFixed(2));
  }
}
