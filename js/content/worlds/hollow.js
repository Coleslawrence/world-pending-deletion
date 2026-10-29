// ===== [World Pending Deletion] — content: world pack: Hollow Kingdom =====
'use strict';
WORLD_TYPES.hollow = { name: 'Hollow Kingdom', flavour: "A land where the dead won't rest.", home: 'venom', gift: 'warden', final: 'bone_saint', names: [['Mor', 'Gra', 'Duns', 'Ves', 'Ul', 'Kar'], ['vale', 'hollow', 'grave', 'mire', 'thorn', 'dun']], champs: ['Ebon', 'Lira', 'Mordecai', 'Wren', 'Silas', 'Ysolde'] };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.hollow = {
  roles: ['lantern warden', 'gravedigger', 'candle-maker', 'bone-setter', 'chapel keeper'],
  promises: ['let the dead rest', 'bring Ada peace', 'keep the lanterns lit'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Unquiet Fields', text: 'Farmland where the old dead still work the soil at night. The harvests are excellent.' },
    { k: 'custom', tier: 'far', name: 'The Last Funeral', text: 'Three hundred years ago, the kingdom buried someone and they stayed buried. Nobody knows how.' },
    { k: 'place', tier: 'far', name: 'The Barrow Kings', text: 'Seven kings in seven hills. They still send tax demands.' },
    { k: 'place', tier: 'far', name: 'The Ossuary Road', text: 'A highway paved with the bones of volunteers. It never needs repair.' },
    { k: 'custom', tier: 'city', name: 'The Lantern Wardens', text: 'Keepers who walk the streets at night, reminding the dead which house is theirs.' },
    { k: 'place', tier: 'city', name: 'The Grave Market', text: 'Where the living buy back things the dead took with them.' },
    { k: 'custom', tier: 'city', name: "Mourners' Week", text: 'A week of feasting where every family sets one extra place, and it gets used.' },
    { k: 'person', tier: 'city', name: 'Mother Rook', text: "The city's oldest gravedigger. Has buried the same man nine times." },
    { k: 'place', tier: 'city', name: 'The Quiet Bell', text: 'A bell with no clapper. When it rings anyway, everyone goes indoors.' },
    { k: 'custom', tier: 'city', name: 'The Salt Line', text: 'A ring of salt around the city, renewed every dawn by children.' },
    { k: 'place', tier: 'home', name: 'The cottage by the yew', text: 'The yew is older than the kingdom, and its roots hold your ancestors.', near: 'in a cottage by the old yew' },
    { k: 'place', tier: 'home', name: 'The chapel of St. Ves', text: 'Small, cold and always full. Not all the congregation breathes.', near: 'in the bell tower of St. Ves' },
    { k: 'person', tier: 'home', name: 'Your grandmother Ada', text: 'Died when you were six. Still tucks you in when you visit.', rel: 'grandmother' },
    { k: 'person', tier: 'home', name: 'Your friend Tobin', text: "A gravedigger's son who dared you into every crypt in the kingdom.", rel: 'friend' },
  ],
};
FINAL_GREET.bone_saint = '{champ}. I have prayed for you. Lie down, and let me finish the prayer.';
