// ===== [World Pending Deletion] — content: world pack: Harvest Vales =====
'use strict';
// The Reaper's home (world expansion, 12 Nov). added: 'x3' keeps it out of Pending World days before ADDED_FROM.x3.
WORLD_TYPES.vales = { added: 'x3', name: 'Harvest Vales', flavour: 'Farmland where every harvest is owed to a scythe.', home: 'reaper', guest: 'venom', gift: 'lastsheaf', final: 'reaping_lord', names: [['Har', 'Bar', 'Mill', 'Sow', 'Fal', 'Glen', 'Hay', 'Thresh', 'Corn', 'Rye'], ['ford', 'field', 'stead', 'ton', 'by', 'worth', 'acre', 'brook', 'dale', 'leigh']], mids: ['e', 'er', 'ing'], champs: ['Alder', 'Bess', 'Colm', 'Dorrit', 'Ewan', 'Flora', 'Gil', 'Hattie', 'Ivo', 'Jem', 'Kit', 'Lettice', 'Mabel', 'Nye', 'Orrin', 'Peg', 'Rook', 'Sim', 'Tamsin', 'Wynn'] };
// ruler: the old power a clashing People contradicts (PEOPLES[x].clash), and what backing it in the power struggle gives
WORLD_TYPES.vales.ruler = { name: 'the Tithe Reeves', line: 'The Reeves count every sheaf. One in ten is owed, and they decide which.', then: { stats: { STR: 2 } }, say: '[The Tithe Reeves count you among the strong. +2 STR.]' };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.vales = {
  roles: ['reaper', 'gleaner', "miller's hand", 'scarecrow mender', 'tithe runner'],
  promises: ['bring the harvest in', 'pay off the tithe', 'see one full barn'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Unmown Field', text: 'One field nobody will cut. The wheat there is taller than a house and still growing.' },
    { k: 'custom', tier: 'far', name: 'The Tenth Sheaf', text: 'One sheaf in ten is left standing for the collector. Nobody has ever seen who takes it.' },
    { k: 'place', tier: 'far', name: 'The Scarecrow Road', text: 'A road lined with scarecrows for forty miles. They face the travellers, not the fields.' },
    { k: 'custom', tier: 'far', name: 'The Long Reckoning', text: 'Every debt in the Vales is written in one book. It has never had a blank page.' },
    { k: 'place', tier: 'city', name: 'The Tithe Barn', text: 'The biggest building in the Vales. It is always full, and nobody in the Vales has ever eaten from it.' },
    { k: 'place', tier: 'city', name: 'The Millrace', text: 'The mill wheel has turned day and night for two hundred years. The miller is afraid to stop it.' },
    { k: 'custom', tier: 'city', name: 'Harvest Home', text: 'The night the last cart comes in, everyone dances. The Reeves count the dancers.' },
    { k: 'person', tier: 'city', name: 'Reeve Callow', text: 'Counts sheaves, debts and children. Has never once been wrong, and never once been thanked.' },
    { k: 'custom', tier: 'city', name: 'The Corn Doll', text: 'The last sheaf is woven into a doll and kept until spring. Throwing one away is the worst luck there is.' },
    { k: 'place', tier: 'city', name: 'The Gleaning Fields', text: 'After the harvest the poor may take what was dropped. The Reeves make sure very little is dropped.' },
    { k: 'place', tier: 'home', name: 'The farmhouse by the mill', text: 'The floors still shake when the wheel turns. You learned to sleep through it.', near: 'in a farmhouse by the mill' },
    { k: 'place', tier: 'home', name: 'The hayloft', text: 'Where you hid every harvest day until you were old enough to swing a scythe.', near: 'under a hayloft at the edge of the fields' },
    { k: 'person', tier: 'home', name: 'Your grandmother Hattie', text: 'Has brought in sixty harvests. Says the scythe gets lighter, and nobody believes her.', rel: 'grandmother' },
    { k: 'person', tier: 'home', name: 'Your friend Rook', text: 'Raced you down every row of every field. Still owes you for the last one.', rel: 'friend' },
  ],
};
FINAL_GREET.reaping_lord = '{champ}. You have grown well. I have come to collect.';
