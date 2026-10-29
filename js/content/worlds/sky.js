// ===== [World Pending Deletion] — content: world pack: Sky Reaches =====
'use strict';
WORLD_TYPES.sky = { name: 'Sky Reaches', flavour: 'Floating cities ruled by mages.', home: 'arcanist', gift: 'prodigy', final: 'archmage', names: [['Aer', 'Cel', 'Zeph', 'Ast', 'Lum', 'Vey'], ['ia', 'ora', 'ion', 'ara', 'elle', 'is']], champs: ['Cassian', 'Lyra', 'Orin', 'Vela', 'Theron', 'Mira'] };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.sky = {
  roles: ['spell-mechanic', 'chain-walker', 'academy student', 'skyship deckhand', 'cartographer'],
  promises: ['keep the city in the sky', 'see the ground one day', 'finish your duel'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Ground', text: 'Nobody has been down there in four hundred years. It is taught as a myth.' },
    { k: 'place', tier: 'far', name: 'The Fallen City', text: 'One of the old floating cities lost its spell. Its wreckage is somewhere below the clouds.' },
    { k: 'custom', tier: 'far', name: 'The First Ascent', text: 'The night the mages lifted the cities into the sky. The reasons were never written down.' },
    { k: 'place', tier: 'far', name: 'The Storm Wall', text: 'A barrier of lightning around the Reaches. It keeps something out. Or in.' },
    { k: 'place', tier: 'city', name: 'The Anchor Chains', text: 'Iron chains that tie the cities together. Children dare each other to walk them.' },
    { k: 'place', tier: 'city', name: 'The Academy Spire', text: 'The highest tower in the Reaches. Every student who graduates moves one floor up.' },
    { k: 'custom', tier: 'city', name: 'The Lift Toll', text: 'Everyone pays a little mana each morning to keep the city in the air.' },
    { k: 'person', tier: 'city', name: 'Chancellor Vey', text: 'Rules the council of mages. Has not touched solid stone in sixty years.' },
    { k: 'custom', tier: 'city', name: 'Windfall Day', text: 'Once a year, the cities drift close enough to step between them.' },
    { k: 'place', tier: 'city', name: 'The Cloud Docks', text: 'Where skyships tie up, rattling in the wind like nervous horses.' },
    { k: 'place', tier: 'home', name: 'The rooftop garden', text: 'Your family grows the only real soil in the district, in pots, very carefully.', near: 'in a rooftop garden above the Cloud Docks' },
    { k: 'place', tier: 'home', name: 'The lower ring', text: 'The poorest part of the city, closest to the edge. You could always see the clouds.', near: 'on the lower ring, near the edge' },
    { k: 'person', tier: 'home', name: 'Your father Oren', text: "A spell-mechanic who keeps the city's oldest engine running with his bare hands.", rel: 'father' },
    { k: 'person', tier: 'home', name: 'Your rival Selis', text: 'Beat you at every exam. You still owe each other a duel.', rel: 'rival' },
  ],
};
FINAL_GREET.archmage = "{champ}. Ah. You're the first thing I've had to look up at in centuries.";
