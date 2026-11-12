// ===== [World Pending Deletion] — content: world pack: Drowned Isles =====
'use strict';
WORLD_TYPES.drowned = { name: 'Drowned Isles', flavour: 'Island kingdoms sinking into the sea.', home: 'zealot', guest: 'storm', guest2: 'blade', gift: 'tidecaller', final: 'leviathan', names: [['Vel', 'Mar', 'Thal', 'Ner', 'Cor', 'Ys', 'Lyr', 'Ond', 'Sael', 'Myr'], ['mora', 'mere', 'thys', 'una', 'aven', 'rith', 'wen', 'oth', 'ara', 'esse']], mids: ['a', 'e', 'o'], champs: ['Aldric', 'Maren', 'Isolde', 'Corin', 'Nerys', 'Talwyn', 'Bryn', 'Cael', 'Delyth', 'Eira', 'Kerra', 'Jory', 'Lowen', 'Merin', 'Nia', 'Oswin', 'Perrin', 'Rhoswen', 'Tamsin', 'Ysella', 'Gwenna', 'Hywel', 'Ione', 'Morvah'] };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.drowned = {
  roles: ['lamplighter', 'pearl diver', 'tide priest', 'net mender', 'harbour runner'],
  promises: ['bring back dry land', 'ring the bells again', 'come home before the tide'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Sunken Archive', text: 'Every book the isles ever wrote, now read only by eels.' },
    { k: 'place', tier: 'far', name: 'The First Shore', text: 'Where the first settlers landed. It went under two hundred years ago.' },
    { k: 'place', tier: 'far', name: 'The Coral Library', text: 'Scholars grow their records in coral. A page takes a century.' },
    { k: 'custom', tier: 'far', name: 'The Saltwar', text: 'The last war between the isles. Both sides lost the island they fought over.' },
    { k: 'custom', tier: 'city', name: 'The Bell Vigil', text: 'When an island sinks, its bell is rung until the water reaches it.' },
    { k: 'place', tier: 'city', name: 'The bells of Cor Aven', text: 'Seven bells, rung every dusk to count the islands still above water.' },
    { k: 'custom', tier: 'city', name: 'The Tide Council', text: 'Nine elders who vote each year on which island to abandon next.' },
    { k: 'person', tier: 'city', name: 'Harbourmaster Thel', text: 'Has evacuated eleven islands. Keeps a key to each one.' },
    { k: 'place', tier: 'city', name: 'The Floating Market', text: 'Lashed-together boats that move whenever the coast does.' },
    { k: 'custom', tier: 'city', name: 'Drowning Day', text: 'Once a year, everyone wades into the sea to remember what it took.' },
    { k: 'place', tier: 'home', name: 'The Drowned Lighthouse', text: 'Still lit, though its base has been underwater for a generation.', near: 'in the shadow of the Drowned Lighthouse' },
    { k: 'place', tier: 'home', name: 'The stilt house on Marrow Reef', text: 'Your family has raised it four times.', near: 'in a stilt house on Marrow Reef' },
    { k: 'person', tier: 'home', name: 'Your sister Ilsa', text: 'Mends nets, and swears she can smell land on the wind.', rel: 'sister' },
    { k: 'person', tier: 'home', name: 'Old Corwen', text: 'Taught you to swim before you could walk. Says the sea owes him one.', rel: 'teacher' },
    // World expansion (12 Nov): 6 more each. added: 'x3' keeps them out of Pending World days before ADDED_FROM.x3
    { k: 'place', tier: 'far', name: 'The Sunken Road', text: 'A paved road runs from the shore straight into the sea. Carts still use it at low tide.', added: 'x3' },
    { k: 'custom', tier: 'city', name: 'Reading the Waterline', text: 'Every door has the year carved at the height the sea reached. The newest marks are above the handles.', added: 'x3' },
    { k: 'person', tier: 'city', name: 'Pearl-Mother Ysolde', text: 'Has dived for pearls for fifty years. Says the sea gives one back for every island it takes.', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The boat that is also a house', text: 'It was a house until the street flooded. Your family added a keel.', near: 'in a house that became a boat', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The roof garden', text: 'Your mother grows beans on the roof, because the garden is under the sea.', near: 'under a roof garden above the tide', added: 'x3' },
    { k: 'person', tier: 'home', name: 'Your cousin Maren', text: 'Swims faster than anyone on the island. Plans to swim to the mainland one day.', rel: 'cousin', added: 'x3' },
  ],
};
FINAL_GREET.leviathan = '{champ}. Even the deep has heard of you. It will still take you.';
