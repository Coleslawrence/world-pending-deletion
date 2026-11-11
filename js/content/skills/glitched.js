// ===== [World Pending Deletion] — content: skills: glitched =====
// Glitched skills (glitch: true) are never in the shop pool. Where glitches are on, a skill offer now and then comes up
// glitched instead (GLITCH_SKILL in core.js), and buying one raises the System's notice.
//   replay: casts the last skill you used this fight again (not itself, not a Quick one), for its selfDmg in HP
//   stack: each cast this fight is that much stronger than the last; the fifth resets the count and Stuns you
//   unstable: [a, b]: a glitched copy of a skill with two evolutions that is a on your odd turns and b on even ones;
//     made on demand (unstableSkill below), id 'u_<skill>'
'use strict';
sk('error_skill', 'Err̷or', ['arcanist'], 'B', 2, { replay: 1, selfDmg: 6 }, null, { noShop: true, glitch: true });
sk('stack_overflow', 'Stack Overfl̷ow', ['reaper'], 'C', 1, { dmg: 6, stack: 0.25 }, null, { noShop: true, glitch: true });
function unstableSkill(id) {
  if (SKILLS[id]) return SKILLS[id];
  const m = /^u_(\w+)$/.exec(id || ''), B = m && SKILLS[m[1]];
  if (!B || B.glitch || B.base || !B.evo || B.evo.length < 2) return null;
  const [a, b] = B.evo;
  SKILLS[id] = Object.assign({}, SKILLS[a], { id, name: 'Unst̷able ' + B.name, rank: B.rank, cd: B.cd, evo: null, base: null, noShop: true, glitch: true, unstable: [a, b],
    flavour: `[Known issue: ${B.name} cannot decide what it evolved into. It alternates.]` });
  return SKILLS[id];
}
flav({
  error_skill: "[Error: last action repeated. The System apologises for any inconvenience.]",
  stack_overflow: "[Warning: recursion depth exceeded. Please stop hitting things.]",
});
