// ===== [World Pending Deletion] — content: world pack: Burning Empire =====
'use strict';
WORLD_TYPES.burning = { name: 'Burning Empire', flavour: 'An empire that never stopped fighting.', home: 'pyre', gift: 'deserter', final: 'kharros', names: [['Khar', 'Vor', 'Ash', 'Ign', 'Sol', 'Pyr'], ['ros', 'kai', 'heim', 'gard', 'onis', 'ath']], champs: ['Varro', 'Kaela', 'Dax', 'Seren', 'Ignis', 'Tor'] };
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
  ],
};
FINAL_GREET.kharros = '{champ}. At last, an enemy worth a war. I will not insult you with mercy.';
