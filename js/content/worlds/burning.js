// ===== [World Pending Deletion] — content: world pack: Burning Empire =====
'use strict';
WORLD_TYPES.burning = { name: 'Burning Empire', flavour: 'An empire that never stopped fighting.', home: 'pyre', guest: 'bastion', gift: 'deserter', final: 'kharros', names: [['Khar', 'Vor', 'Ash', 'Ign', 'Sol', 'Pyr', 'Tar', 'Cind', 'Mag', 'Rax'], ['ros', 'kai', 'heim', 'gard', 'onis', 'ath', 'ium', 'or', 'ax', 'ene']], mids: ['a', 'i', 'en'], champs: ['Varro', 'Kaela', 'Dax', 'Seren', 'Ignis', 'Tor', 'Aurel', 'Cato', 'Drusa', 'Fausta', 'Galen', 'Hadria', 'Junia', 'Lucan', 'Marius', 'Nerva', 'Octa', 'Quint', 'Rufa', 'Severa', 'Tullia', 'Valens', 'Zenon', 'Calla'] };
// ruler: the old power a clashing People contradicts (PEOPLES[x].clash), and what backing it in the power struggle gives
WORLD_TYPES.burning.ruler = { name: 'the Imperial Legions', line: 'The legions answer to whoever wears the ash crown.', then: { always: { next: { empower: 1 } } }, say: '[The legions march behind you. You start every fight Empowered.]' };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.burning = {
  roles: ['legionnaire', "smith's apprentice", 'standard-bearer', 'field medic', 'courier'],
  promises: ['bring the legion home', 'end the war', 'light the Ember Gate again'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Ashen Frontier', text: 'A border that has moved forty times. Nobody remembers who started it.' },
    { k: 'custom', tier: 'far', name: 'The Thousand-Year Campaign', text: 'The war the empire was founded to win. It is in its thousand and twelfth year.' },
    { k: 'place', tier: 'far', name: 'The Glass Desert', text: 'A battlefield burned so hot the sand turned to glass. Soldiers still find their reflections there.' },
    { k: 'place', tier: 'far', name: 'The Treaty Stone', text: "Carved for a peace that lasted nine days. It is the empire's most visited monument." },
    { k: 'place', tier: 'city', name: 'The Ember Gate', text: "The capital's great gate. It has been rebuilt after every siege, always a little taller." },
    { k: 'place', tier: 'city', name: 'The Legion Rolls', text: "Every soldier's name, burned into iron plates that cover a whole street." },
    { k: 'custom', tier: 'city', name: 'The Night of Cinders', text: 'Once a year the city puts out every fire and sits in the dark, to remember the cold.' },
    { k: 'person', tier: 'city', name: 'Quartermaster Vossa', text: 'Has fed three armies on half rations. Never once lost a ledger.' },
    { k: 'custom', tier: 'city', name: 'The Smoke Choir', text: 'Widows who sing the names of the fallen from the city walls at dusk.' },
    { k: 'custom', tier: 'city', name: "Founders' Feast", text: 'The one day a year when nobody is allowed to draw a blade. Mostly.' },
    { k: 'place', tier: 'home', name: 'The barracks on Kiln Street', text: 'Four generations of your family slept in the same bunk.', near: 'in the barracks on Kiln Street' },
    { k: 'place', tier: 'home', name: 'The forge where you were born', text: 'Your mother refused to stop working, even for that.', near: 'beside the forge where you were born' },
    { k: 'person', tier: 'home', name: 'Your brother Cass', text: 'Lost a hand at the frontier. Writes to you with the other one every week.', rel: 'brother' },
    { k: 'person', tier: 'home', name: 'Sergeant Halla', text: 'Trained you with a wooden sword until you broke it. Then she gave you a real one.', rel: 'sergeant' },
    // World expansion (12 Nov): 6 more each. added: 'x3' keeps them out of Pending World days before ADDED_FROM.x3
    { k: 'place', tier: 'far', name: 'The Iron Road', text: 'A road built for marching. It is wide enough for twelve abreast and has never once been quiet.', added: 'x3' },
    { k: 'custom', tier: 'city', name: 'The Burning of Letters', text: 'Soldiers burn their letters home after reading, so no enemy can learn their names.', added: 'x3' },
    { k: 'person', tier: 'city', name: 'Tribune Aurel', text: 'Wins every battle he plans and loses every argument at home.', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The bathhouse on Ash Lane', text: 'The only warm water in the district. Your family has run it for three generations.', near: 'behind the bathhouse on Ash Lane', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The roof over the armoury', text: 'You watched every parade from up there. Nobody ever told you to get down.', near: 'above the old armoury', added: 'x3' },
    { k: 'person', tier: 'home', name: 'Your father Galen', text: 'A retired standard-bearer. Still salutes the flag every morning, even in the rain.', rel: 'father', added: 'x3' },
  ],
};
FINAL_GREET.kharros = '{champ}. At last, an enemy worth a war. I will not insult you with mercy.';
