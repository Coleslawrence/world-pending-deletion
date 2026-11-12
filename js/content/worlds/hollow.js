// ===== [World Pending Deletion] — content: world pack: Hollow Kingdom =====
'use strict';
WORLD_TYPES.hollow = { name: 'Hollow Kingdom', flavour: "A land where the dead won't rest.", home: 'venom', guest: 'zealot', gift: 'warden', final: 'bone_saint', names: [['Mor', 'Gra', 'Duns', 'Ves', 'Ul', 'Kar', 'Nec', 'Hal', 'Wyth', 'Bel'], ['vale', 'hollow', 'grave', 'mire', 'thorn', 'dun', 'moor', 'fell', 'barrow', 'mourn']], mids: ['en', 'a', 'e'], champs: ['Ebon', 'Lira', 'Mordecai', 'Wren', 'Silas', 'Ysolde', 'Abel', 'Agnes', 'Ambrose', 'Cedric', 'Edda', 'Hester', 'Ivo', 'Lenore', 'Morwen', 'Nell', 'Osric', 'Prudence', 'Quill', 'Lazarus', 'Sable', 'Thea', 'Vesper', 'Mercy'] };
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
    // World expansion (12 Nov): 6 more each. added: 'x3' keeps them out of Pending World days before ADDED_FROM.x3
    { k: 'place', tier: 'far', name: 'The Bone Orchard', text: 'Apple trees grow from an old battlefield. The apples are very red.', added: 'x3' },
    { k: 'custom', tier: 'city', name: 'Speaking to the Lanterns', text: 'Everyone tells the grave lanterns their news, so the dead are never out of date.', added: 'x3' },
    { k: 'person', tier: 'city', name: 'Undertaker Moss', text: 'Has buried half the town, twice. Is very patient with repeat customers.', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The house with salt on the sills', text: 'Your family lays a fresh line every night. You have never once forgotten.', near: 'in a house with salt on every sill', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The family vault', text: 'The door is locked from the inside. Your family has agreed not to talk about it.', near: 'beside the family vault', added: 'x3' },
    { k: 'person', tier: 'home', name: 'Your uncle Wendel', text: 'Came back from the dead once, briefly. Says the food was better there.', rel: 'uncle', added: 'x3' },
  ],
};
FINAL_GREET.bone_saint = '{champ}. I have prayed for you. Lie down, and let me finish the prayer.';
