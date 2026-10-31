// ===== [World Pending Deletion] — content: world pack: Thunder Steppes =====
'use strict';
WORLD_TYPES.steppes = { name: 'Thunder Steppes', flavour: 'Endless grasslands under a storm that never breaks.', home: 'storm', gift: 'lightningrod', final: 'herald', names: [['Bra', 'Kes', 'Vol', 'Rhu', 'Ost', 'Zan'], ['mak', 'ven', 'dra', 'gal', 'ruk', 'esh']], champs: ['Taran', 'Odra', 'Vesna', 'Halvard', 'Iskra', 'Doran'] };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.steppes = {
  roles: ['rod-keeper', 'herd rider', 'storm reader', 'tent-weaver', 'clan runner'],
  promises: ['ride to the Eye', 'keep the herd together', 'win back the last race'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Eye', text: 'Riders say there is a still place at the centre of the storm. Nobody who went looking came back to say.' },
    { k: 'custom', tier: 'far', name: 'The First Rider', text: 'The first clan followed the storm instead of fleeing it. Every clan claims to be descended from her.' },
    { k: 'custom', tier: 'far', name: 'The Quiet Year', text: 'Once, the thunder stopped for a whole year. The clans still argue about what it cost.' },
    { k: 'place', tier: 'far', name: 'The Glass Flats', text: 'Where the lightning struck for a century, the sand turned to glass. It sings when the wind crosses it.' },
    { k: 'place', tier: 'city', name: 'The Rod Field', text: 'Ten thousand iron rods driven into the plain. The storm strikes them, and not the tents.' },
    { k: 'place', tier: 'city', name: 'The Herd Roads', text: 'Paths worn by herds older than the clans. Nobody builds across them.' },
    { k: 'custom', tier: 'city', name: 'The Thunder Count', text: 'Children count between the flash and the thunder. The first word every child learns is a number.' },
    { k: 'person', tier: 'city', name: 'Warden Kesh', text: 'Keeps the Rod Field standing. Has been struck four times and refuses to discuss it.' },
    { k: 'custom', tier: 'city', name: 'The Tent Moot', text: 'The clans meet once a season under one canvas. Disputes are settled before the next thunderclap.' },
    { k: 'place', tier: 'city', name: 'The Long Grass', text: 'Grass taller than a rider. Whole clans have vanished into it for a season and come back.' },
    { k: 'place', tier: 'home', name: 'The family tent', text: 'Patched so many times that no two panels match. It has never once leaked.', near: 'in a patched tent on the open plain' },
    { k: 'place', tier: 'home', name: 'The windbreak wall', text: "A low stone wall your grandfather built, the only stone for a day's ride.", near: 'behind a windbreak wall on the steppe' },
    { k: 'person', tier: 'home', name: 'Your mother Ilse', text: "Reads the storm better than anyone in the clan, and won't say how.", rel: 'mother' },
    { k: 'person', tier: 'home', name: 'Your rival Brun', text: 'Raced you to the Rod Field every morning for ten years. You are still one race ahead.', rel: 'rival' },
  ],
};
FINAL_GREET.herald = '{champ}. Stand still. Lightning finds the tallest thing first.';
