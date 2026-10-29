// ===== [World Pending Deletion] — content: skills =====
'use strict';
// Each archetype's skills are in skills/. sk() adds a skill and its two ★3 evolutions; a skill tagged with two
// archetypes sits in one of their files. Load order is shop order, so add new skills at the end of a file.
const SKILLS = {};
const SHOP_SKILLS = [];
function sk(id, name, tags, rank, cd, fx, evos, extra) {
  const d = Object.assign({ id, name, tags, rank, cd, fx, kind: 'skill' }, extra || {});
  SKILLS[id] = d;
  if (!d.noShop) SHOP_SKILLS.push(id);
  if (evos) {
    d.evo = evos.map(e => e[0]);
    evos.forEach(([eid, ename, efx, ecd]) => {
      SKILLS[eid] = Object.assign({}, d, { id: eid, name: ename, fx: efx, cd: ecd != null ? ecd : d.cd, rank: RANKS[Math.min(6, RANKS.indexOf(rank) + 2)], evo: null, base: id, noShop: true });
    });
  }
}
