// ===== [World Pending Deletion] — content: gods =====
// arch: archetypes whose B-rank pieces the god gifts at 4 Favour. blessing: the player text for bless, the P effects
// (docs/CONTENT.md) that apply at 8 Favour. reply: a rival reply line shown with 4 Favour, go(f) acts on the fight
// and returns the System line. Each god needs a chosen_<id> divine Gift in gifts.js.
'use strict';
const GODS = {
  war: { name: 'The God of War', short: 'War', arch: ['reaper', 'storm', 'bastion'], blessing: 'All your damage +15%.', bless: { dmgPct: 0.15 },
    reply: { label: '"War is watching."', go: f => { f.A.empower = Math.max(f.A.empower, 2); return '[War agrees. You are Empowered.]'; } } },
  trick: { name: 'The Trickster', short: 'Trickster', arch: ['venom', 'blade', 'arcanist'], blessing: 'Burn, Poison and Bleed you apply +2.', bless: { dotPlus: 2 },
    reply: { label: '"Your laces are undone."', go: f => { f.A.critNext = true; return `[${f.B.name} looks down. Your next hit is a critical.]`; } } },
  ruin: { name: 'The Goddess of Ruin', short: 'Ruin', arch: ['pyre', 'zealot', 'reaper'], blessing: 'Below half HP, deal 30% more damage.', bless: { lowHpDmg: 0.3 },
    reply: { label: '"Your world is next."', go: f => { const b = Math.max(5, Math.round(f.B.maxHp * 0.04)); f.B.burn += b; return `[Ruin hears you. ${f.B.name} burns: ${b} Burn.]`; } } },
};
