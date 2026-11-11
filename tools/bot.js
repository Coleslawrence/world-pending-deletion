const G = require('../js/core.js');
// Glitched prefixes cost the System's notice, so the bot only takes one when no normal prefix fits
const glitchLast = ms => ms.filter(m => !G.PREFIXES[m].glitch).concat(ms.filter(m => G.PREFIXES[m].glitch));
const RV = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 };
const NAIVE = !!process.env.BOT_NAIVE;
// What a skill would set off: the triggers in REFLEX_ON, read from its effects as noteReflex in core.js does
function wouldTrigger(on, fx, B) {
  const hits = (fx.dmg || fx.dmgPip || fx.blockDmg || fx.malice || fx.detonate || fx.momentum || fx.perMisf || fx.calamity) ? fx.hits || 1 : 0;
  return on === 'block' ? !!(fx.block || fx.blockPip) : on === 'status' ? !!(fx.burn || fx.poison || fx.bleed) : on === 'heal' ? !!(fx.heal || fx.healMissing)
    : on === 'flurry' ? hits >= 2 : on === 'passive' ? hits === 0 : on === 'hurt' ? false : false;
}
// A skill that sets off a Reflex costs what the Reflex move would do to you (or undo for them)
function reflexCost(f, fx, p) {
  const B = f.B, A = f.A; if (!B.reflexes || (B.reflexAt != null && B.turns + 1 - B.reflexAt < 2)) return 0;
  // The Reflex move replaces the move it would have used next, so only the difference counts
  const harm = (s, extra) => { if (!s) return 0; const m = s.def.fx, q = s.power; return ((m.dmg || 0) * (m.hits || 1) * (m.pierce ? 1.3 : 1) + (m.burn || 0) * 1.6 + (m.poison || 0) * 2.5 + (m.bleed || 0) * 1.5 + (m.weaken ? 4 : 0) + ((m.heal || 0) + (m.block || 0) * 0.5) * 0.5) * q + (m.cleanse ? extra : 0); };
  const undo = (B.poison + B.burn + B.bleed) * 1.2 + ((fx.poison || 0) * 2.5 + (fx.burn || 0) * 1.6 + (fx.bleed || 0) * 1.5) * p;
  const normal = harm(B.next != null ? B.skills[B.next] : null, undo);
  let c = 0;
  B.reflexes.forEach(R => {
    const s = R.s || B.skills[R.use]; if (!s || s.cd > 1 || !wouldTrigger(R.on, fx, B)) return;
    c = Math.min(c, normal - harm(s, undo));
  });
  return c * W_REFLEX;
}
const W_REFLEX = +(process.env.BOT_WR || 0.5), W_WIND = +(process.env.BOT_WW || 10);
// Breaking a wind-up: worth a lot when this skill's damage is enough
function windupGain(f, fx, p) {
  const B = f.B, W = B.windup; if (!W) return 0;
  const d = ((fx.dmg || 0) * (fx.hits || 1) + (fx.blockDmg ? f.A.block * fx.blockDmg : 0)) * p * G.dmgMult(f, f.A, B) - (fx.pierce ? 0 : B.block);
  return d >= W.need - W.got ? W_WIND : 0;
}
const READ = +(process.env.BOT_READ != null ? process.env.BOT_READ : 1);
// The damage the opponent's shown move would do to you, before your Block
function incoming(f) {
  const B = f.B, s = B.intent; if (!s || B.stun > 0) return 0;
  const fx = s.def.fx.mirror ? (f.lastPlayerSkill ? f.lastPlayerSkill.def.fx : { dmg: 8 }) : s.def.fx;
  return ((fx.dmg || 0) * s.power + (fx.blockDmg ? B.block * fx.blockDmg : 0)) * (fx.hits || 1) * G.dmgMult(f, B, f.A) * G.gapMul(f, B, s);
}
// Reading the turn the way a player reads it: the opponent's intent, its Block, its guard bar and Broken. G.forecast
// plays the skill and the opponent's answer on a copy of the fight (what the tap-to-preview shows), so the bot sees
// damage after Block, a guard it would break, a wind-up it would stop, damage it would take and a fight it would win
// or lose. The heuristic score above still carries what plays out later (Poison, Burn, buffs, Regen).
// BOT_FC=0 turns this off, to measure what it is worth.
const W_FC = +(process.env.BOT_FC != null ? process.env.BOT_FC : 1), FC_D = +(process.env.FC_D || 0), FC_T = +(process.env.FC_T || 0), FC_WIN = +(process.env.FC_WIN != null ? process.env.FC_WIN : 500);
function readAhead(f, i, fx) {
  if (!W_FC) return 0;
  const o = G.forecast(f, i); if (!o) return 0;
  if (o.win) return FC_WIN; if (o.lose) return -FC_WIN;
  const direct = (fx.dmg || 0) * (fx.hits || 1) * f.A.skills[i].power; // what the heuristic already counted as damage
  let v = (o.dealt - direct) * FC_D - o.taken * FC_T;
  if (o.guard) v += 10 + (f.B.intent && G.intentInfo(f).kind === 'big' ? 12 : 4); // a Broken opponent loses its turn and takes 50% more
  if (o.broke) v += 6;
  return v * W_FC;
}
// BOT_CNT=1: print how many skills are ready on each player turn (how much choice a turn really has).
const CNT = process.env.BOT_CNT ? { h: {}, held: {} } : null;
if (CNT) process.on('exit', () => console.error('ready per turn', JSON.stringify(CNT.h), 'skills held', JSON.stringify(CNT.held)));
function choosePlayer(f) {
  if (CNT) { const r = f.A.skills.filter(s => G.canUse(s)).length; CNT.h[r] = (CNT.h[r] || 0) + 1; CNT.held[f.A.skills.length] = (CNT.held[f.A.skills.length] || 0) + 1; }
  if (process.env.BOT_RANDOM) { const r = f.A.skills.map((s, i) => i).filter(i => G.canUse(f.A.skills[i])); return r[Math.floor(Math.random() * r.length)]; }
  const A = f.A, B = f.B, ready = A.skills.map((s, i) => ({ s, i })).filter(x => G.canUse(x.s));
  const intent = G.intentInfo(f);
  const low = A.hp / A.maxHp < 0.4;
  // What the intent says is coming: the hit after your Block, so Block past it is worth little (READ=0 turns this off)
  const inc = READ ? incoming(f) : 0, attackNext = intent.kind === 'attack' || intent.kind === 'big';
  let best = ready[0], bs = -1;
  ready.forEach(({ s, i }) => {
    // A Read skill (fx.read, fx.readFx) is scored as what it will do this turn: its readFx version when the shown move matches
    const rd = s.def.fx.read && G.readHits(f, A, s.def.fx), fx = rd ? G.readDef(s.def).fx : s.def.fx, p = s.power * (rd && s.def.fx.readFx.readMult || 1);
    let sc = ((fx.dmg || 0) * (fx.hits || 1) + (fx.burn || 0) * 1.6 + (fx.poison || 0) * 2.5 + (fx.bleed || 0) * 1.5 + (fx.detonate ? B.burn * fx.detonate : 0) + (fx.malice ? fx.malice * 2 : 0) + (fx.blockDmg ? A.block * fx.blockDmg : 0) + (fx.brk || 0) * 0.6) * p;
    if (fx.replay) sc = f.lastPlayerSkill ? 15 * p : 0; // Error: worth a strong skill once there's one to repeat
    // Press a nearly broken guard: a hit that breaks it costs the opponent its turn
    if (B.breakMax && ((fx.dmg || 0) * (fx.hits || 1) + (fx.brk || 0)) * p >= B.breakMax - B.brk) sc += 12;
    if (fx.execute && B.hp / B.maxHp <= fx.execute) sc *= fx.execMult;
    if (fx.cruel) sc *= 1.3;
    if (READ) {
      // Their Block soaks direct hits (not pierce); a Broken opponent takes 50% more; a stunned one is not about to hit you
      const direct = (fx.dmg || 0) * (fx.hits || 1) * p;
      if (direct && !fx.pierce) sc -= Math.min(direct, B.block) * 0.8;
      if (B.brokenT > 0) sc += direct * 0.5;
      if (fx.block) { const need = Math.max(0, inc - A.block), b = fx.block * p; sc += attackNext ? Math.min(b, need) + Math.max(0, b - need) * 0.2 : b * (intent.kind === 'stunned' ? 0.05 : 0.2); }
    } else if (fx.block) sc += fx.block * p * ((intent.kind === 'attack' || intent.kind === 'big') ? 1 : 0.25);
    if (fx.heal) sc += low ? fx.heal * p * 1.5 : 0;
    if (fx.healMissing) sc += low ? (A.maxHp - A.hp) * fx.healMissing * 1.2 : 0;
    if ((fx.stun || fx.interrupt || (fx.stunIfWeak && B.weaken)) && intent.kind === 'big') sc += 25;
    if (fx.augury) sc += 4; if (fx.portent) sc += 4;
    if (fx.empower) sc += 8; if (fx.evade && intent.kind === 'big') sc += 15;
    if (fx.weaken && (intent.kind === 'attack' || intent.kind === 'big')) sc += 6;
    if (fx.cleanse) sc += (A.poison + A.burn) * 1.5;
    if (fx.shake) sc += (Math.min(fx.shake, A.poison) * 2.5 + Math.min(fx.shake, A.burn) * 1.6 + Math.min(fx.shake, A.bleed) * 1.5) * (low ? 1.5 : 1);
    if (fx.momentum) sc += fx.momentum * (A.streak || 0) * p;
    if (fx.doom || fx.leech) sc += ((fx.doom || 0) * 0.6 + (fx.leech || 0) * 3) * p;
    if (fx.riposte && (intent.kind === 'attack' || intent.kind === 'big')) sc += 10;
    if (fx.thorns) sc += fx.thorns * p * 0.6;
    // Mastery pieces (Phase 5)
    if (fx.fester) sc += B.poison * fx.fester; if (fx.flash) sc += Math.min(B.burn, fx.flash) * 1.6; if (fx.fuse) sc += fx.fuse * 3.2;
    if (fx.deepen && B.bleed > 0) sc += (fx.bleed || 0) * 1.5; if (fx.thornsFight) sc += fx.thornsFight * 4; if (fx.hold && (intent.kind === 'attack' || intent.kind === 'big')) sc += 3;
    if (fx.fullBlock && A.hp >= A.maxHp && (intent.kind === 'attack' || intent.kind === 'big')) sc += fx.fullBlock * p; if (fx.reapHeal && low && B.hp < B.maxHp / 2) sc += fx.reapHeal * p;
    if (fx.doomExec && B.hp < B.maxHp * 0.45) sc += 6; if (fx.bigStop) sc += intent.kind === 'big' ? 25 : 5; if (fx.again) sc += f.lastPlayerSkill ? 15 * p * fx.again : 0;
    if (fx.quench) sc += Math.min(B.burn, fx.quench) * (low ? 1.5 : 0.5); if (fx.grim && B.hp < B.maxHp / 2) sc += (fx.poison || 0) * 2.5; if (fx.vowHeal) sc += (fx.block || 0) * fx.vowHeal * 0.5;
    if (fx.curseSelf) sc -= 1; if (fx.tapOut) sc -= 3; if (fx.ride || fx.dmgHigh) sc += 0;
    if (fx.regen) sc += fx.regen * p * 2;
    if (fx.mark || fx.focus || fx.haste || fx.siphon) sc += 12;
    // Dice skills arrive resolved for this turn's roll (fx.dmgPip, fx.blockPip, fx.healPip, fx.dbl, fx.snake, fx.boxcars,
    // fx.bust, fx.bustAt, fx.faces (its row for the roll), fx.dmgAll, fx.progressive, fx.cashOut and fx.dieMin become plain dmg, block, heal, stun and
    // selfDmg; s.def.pip is the roll), so the lines above already score them. See resolveDice in core.js.
    if (s.def.pip && fx.selfDmg) sc -= fx.selfDmg;
    if (fx.reroll || fx.setSix) sc += 8 + (fx.setSix ? 6 : 0);
    // Jinx: Misfortune builds toward jinxing big hits; Curse is passed on at 6 or more
    if (fx.perMisf) sc += (fx.perMisf * (B.misfortune || 0) + (fx.perCurse || 0) * (A.curse || 0)) * p;
    if (fx.calamity) sc += fx.calamity * (B.misfortune || 0) * p + (intent.kind === 'big' ? 20 : 0);
    if (fx.misf) sc += fx.misf * 2 + (fx.misfT || 0) * 3;
    // fx.dieStun is worked into fx.stun by resolveDice before the bot looks, so the Stun line above scores it
    if (fx.misfPerBurn) sc += Math.floor(((B.burn || 0) + (fx.burn || 0)) / fx.misfPerBurn) * 2;
    if (fx.omenAtk) sc += B.omens && B.omens.length >= 3 ? 0 : fx.omenAtk * p * 0.7 + (fx.omenGuard ? 4 : 0);
    if (fx.passCurse) sc = (A.curse || 0) >= 6 ? 40 + (fx.curseDmg || 0) * A.curse * p : 0;
    if (fx.coinStun) sc += 4;
    if (fx.jinxDisc && !G.canJinx(f)) sc -= 6;
    if (fx.rollTwice) sc += 10;
    // Reflexes and wind-ups (BOT_NAIVE=1 turns this off, to measure what reading them is worth)
    if (!NAIVE) sc += reflexCost(f, fx, p) + windupGain(f, fx, p);
    if (!NAIVE && !s.def.quick) sc += readAhead(f, i, fx);
    if (s.def.quick) sc += 1000;
    if (sc > bs) { bs = sc; best = { s, i }; }
  });
  return best.i;
}
// The Jinx: jinx a big hit whenever it can, anything else once Misfortune is plentiful
function jinxIfWise(f) {
  if (!G.canJinx(f)) return;
  const role = G.jinxRole(f, f.B.intent), cost = G.jinxCost(f);
  if (role === 'big' || (f.B.misfortune || 0) >= cost + 6) G.jinxMove(f);
}
// The Gambler's rerolls: spend them on a die showing 1 or 2
function rerollLow(f) {
  for (let g = 0; g < 5 && f.A.rerolls > 0; g++) { const i = f.A.skills.findIndex(s => s.pip && s.pip <= 2 && G.canUse(s)); if (i < 0 || !G.rerollDie(f, i)) break; }
}
function fight(run) {
  const f = G.newFight(run);
  const rr = G.rivalReplies(run, f); if (rr.length) G.rivalReply(run, f, rr[0]); // a rival reply when one is shown
  let guard = 0;
  while (!f.over && guard++ < 300) {
    if (f.phase === 'player') { rerollLow(f); jinxIfWise(f); G.playerAct(f, choosePlayer(f)); }
    else if (f.phase === 'stunned') G.skipPlayer(f);
    if (!f.over && f.phase === 'enemy') G.enemyTurn(f);
  }
  return f;
}
// BOT_RAND=stats,prefix,merge,shop,bar: make those build choices at random, to measure what each choice is worth
// (BOT_RANDOM does the same for skills in a fight).
const RAND = new Set((process.env.BOT_RAND || '').split(',').filter(Boolean));
const rpick = a => a[Math.floor(Math.random() * a.length)];
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
  if (RAND.has('bar')) {
    const sk = G.shuffle(G.allPieces(run).filter(p => !G.isGear(p.id)));
    sk.slice(0, run.slots).forEach(p => { const f = G.findPiece(run, p.u); if (f.at !== 'bar') { const e = run.bar.indexOf(null); G.movePiece(run, p.u, { bar: e >= 0 ? e : Math.floor(Math.random() * run.slots) }); } });
    G.GEAR_SLOTS.forEach(sl => { const gs = G.allPieces(run).filter(p => G.isGear(p.id) && G.GEAR[p.id].slot === sl); const g = gs.length && rpick(gs); if (g && (!run.gear[sl] || run.gear[sl].u !== g.u)) G.movePiece(run, g.u, { gear: sl }); });
    return;
  }
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
    function score(it) { if (RAND.has('shop')) return 5 + Math.random() * 10; const have = RAND.has('merge') ? 0 : G.allPieces(run).filter(p => p.id === it.id).length, open = G.isGear(it.id) && !run.gear[G.GEAR[it.id].slot] && !run.bench.some(p => G.isGear(p.id) && G.GEAR[p.id].slot === G.GEAR[it.id].slot); return pieceScore(run, it.id, 1, tg) + have * 4 + (open ? 3 : 0); }
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
      if (opts.xp && run.gold - G.pointPrice(run) >= reserve) { G.trainStat(run, trainPick(run), []); continue; }
      if (run.gold >= reserve + 4 && opts.reroll) { G.reroll(run, null, Math.random() < 0.7 ? 'skill' : 'gear'); continue; }
      break;
    }
  }
  arrange(run);
}
function pending(run, meta) {
  while (run.pending.length) {
    const p = run.pending.shift();
    if (p.type === 'rune' && RAND.has('prefix')) { const m = rpick(p.mods), t = G.prefixTargets(run, m).filter(x => x.mods.length < 2); if (t.length) G.applyPrefix(run, rpick(t).u, m); continue; }
    if (p.type === 'rune') { for (const m of glitchLast(p.mods)) { const t = G.prefixTargets(run, m).filter(x => x.mods.length < 2 && run.bar.some(b => b && b.u === x.u)); if (t.length) { G.applyPrefix(run, t[0].u, m); break; } } }
    if (p.type === 'event') { const E = G.EVENTS[p.key]; const order = G.eventOpts(run, p.key).sort((a, b) => !!E.opts[b].check - !!E.opts[a].check); for (const i of order) if (G.resolveEvent(run, p.key, i, meta, null, [])) break; } // a stat line when one is shown
    if (p.type === 'gift') G.applyGift(run, p.offers[0], []);
    if (p.type === 'spoils') { run.pending.unshift(p); G.takeSpoils(run, 0, []); }
    if (p.type === 'intake') { run.pending.unshift(p); G.takeIntake(run, Math.floor(Math.random() * p.offers.length), []); }
    if (p.type === 'augment') { run.pending.unshift(p); G.takeAugment(run, Math.random() < 0.5 && p.offers.length ? 0 : 'skip', []); }
    if (p.type === 'door') { run.pending.unshift(p); G.takeDoor(run, Math.random() < 0.5 && run.hearts > 4, []); }
    if (p.type === 'levelup') { run.pending.unshift(p); G.takeLevel(run, p.perk && Math.random() < (+process.env.BOT_PERK || 0) ? 'perk' : 'level', []); }
    if (p.type === 'perk') { run.pending.unshift(p); G.choosePerk(run, meta, p.offers[0]); }
    if (p.type === 'adv') { run.pending.unshift(p); G.advance(run, p.arch, Math.random() < 0.5 ? 0 : 1); }
    if (p.type === 'evo') { const f = G.findPiece(run, p.u); if (f) { const evo = G.SKILLS[f.p.id].evo; run.pending.unshift(p); G.evolve(run, p.u, evo[Math.floor(Math.random() * evo.length)], meta); } }
  }
}
// Training: 3 points in the main archetype's stat for every 2 in VIT
function trainPick(run) { if (RAND.has('stats')) return rpick(['STR', 'AGI', 'INT', 'VIT', 'LUK']); const k = G.ARCH[targets(run)[0]].stat; run.trainN = (run.trainN || 0) + 1; return run.trainN % 5 < 3 ? k : 'VIT'; }
function stats(run) {
  const tg = targets(run); const k = G.ARCH[tg[0]].stat;
  while (run.statPts > 0) { run.stats[RAND.has('stats') ? rpick(['STR', 'AGI', 'INT', 'VIT', 'LUK']) : Math.random() < 0.6 ? k : 'VIT']++; run.statPts--; }
}
function playRun(meta, verbose, opts = {}) {
  // opts.world forces a world type; opts.main makes the bot build around one archetype
  let w = G.offerWorlds(meta)[0], tries = 0;
  while (opts.world && w.type !== opts.world && tries++ < 200) w = G.offerWorlds(meta).find(x => x.type === opts.world) || w;
  const home = G.WORLD_TYPES[w.type].home, main = opts.main || home, hs = G.ARCH[main].stat;
  // opts.roll: the Awakening's stat roll; opts.sys: keep the System's Gift picks for its bonus points
  const st = opts.roll ? G.rollStats() : { STR: 2, AGI: 2, INT: 2, VIT: 2, LUK: 2 }; if (!opts.roll) { st[hs] += 2; st.VIT += 2; }
  const patron = G.pick(Object.keys(G.GODS));
  G.bindMeta(meta);
  const offer = G.makeOffer(w, meta);
  const gifts = opts.gifts || G.randomGifts(w, meta, patron, offer, null, opts.sys ? G.SYS_BONUS : 0);
  const titles = Object.keys(meta.titles);
  const arch = opts.main && opts.main !== home ? [opts.main].concat(G.shuffle(G.unlockedArch(meta).filter(k => k !== home && k !== opts.main))) : undefined;
  const run = G.newRun(w, { name: 'Bot', stats: st, gifts, patron, offer, sysBonus: opts.sys ? G.SYS_BONUS : 0, arch, title: titles.length ? G.pick(titles) : null }, meta);
  if (opts.main) run.botMain = opts.main;
  const ids = run.draft.slice().sort((a, b) => (G.SKILLS[b].tags.includes(main) ? 1 : 0) - (G.SKILLS[a].tags.includes(main) ? 1 : 0)).slice(0, 3);
  G.confirmDraft(run, ids, meta);
  let guard = 0;
  while (guard++ < 40) {
    pending(run, meta);
    if (opts.snap) opts.snap('choose', run);
    if (run.stage === 'choose') {
      const trial = run.choices[1] && run.choices[1].kind === 'trial';
      const hard = trial || run.choices.length > 1 && run.hp > G.maxHp(run) * 0.75 && run.hearts > 5 && Math.random() < (opts.hardRate != null ? opts.hardRate : 0.35);
      G.chooseOpponent(run, hard ? 1 : 0, run.gold >= 15);
    }
    stats(run);
    if (opts.snap) opts.snap('district', run);
    const d = run.districts;
    const k = run.hp < G.maxHp(run) * 0.6 && d.includes('infirmary') ? 'infirmary' : d.includes('sanctum') && run.hearts <= run.maxHearts - 2 ? 'sanctum' : d.includes('enchanter') ? 'enchanter' : d.includes('infirmary') ? 'infirmary' : d[0];
    G.useDistrict(run, k);
    pending(run, meta);
    if (k === 'infirmary') G.infirmary(run);
    if (k === 'sanctum') G.sanctum(run);
    if (k === 'enchanter') { const ms = G.rollPrefixes(G.districtUp(run, 'enchanter') ? 4 : 3, null, null, run); for (const m of glitchLast(ms)) { const t = G.prefixTargets(run, m).filter(x => x.mods.length < 2 && run.bar.some(b => b && b.u === x.u)); if (t.length) { G.applyPrefix(run, t[0].u, m); break; } } }
    if (run.voucher && run.gold >= G.VOUCHER_PRICE + 6) G.buyVoucher(run, []);
    shop(run, meta, { reroll: true, xp: true, picky: opts.picky });
    pending(run, meta); arrange(run);
    if (opts.snap) opts.snap('shop', run);
    G.leaveShop(run, null, []);
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
module.exports = { playRun, choosePlayer, rerollLow, jinxIfWise };
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
