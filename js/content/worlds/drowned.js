// ===== [World Pending Deletion] — content: world pack: Drowned Isles =====
'use strict';
WORLD_TYPES.drowned = { name: 'Drowned Isles', flavour: 'Island kingdoms sinking into the sea.', home: 'zealot', gift: 'tidecaller', final: 'leviathan', names: [['Vel', 'Mar', 'Thal', 'Ner', 'Cor', 'Ys'], ['mora', 'mere', 'thys', 'una', 'aven', 'rith']], champs: ['Aldric', 'Maren', 'Isolde', 'Corin', 'Nerys', 'Talwyn'] };
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
  ],
};
FINAL_GREET.leviathan = '{champ}. Even the deep has heard of you. It will still take you.';
