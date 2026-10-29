// ===== [World Pending Deletion] — content: world pack: Iron Hold =====
'use strict';
WORLD_TYPES.iron = { name: 'Iron Hold', flavour: 'Mountain forges under siege.', home: 'bastion', gift: 'runesmith', final: 'forge_king', names: [['Dur', 'Gor', 'Bal', 'Kaz', 'Thra', 'Grim'], ['ak', 'heim', 'dur', 'mund', 'hold', 'rak']], champs: ['Brann', 'Helga', 'Tormund', 'Sigrun', 'Durek', 'Ingrid'] };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.iron = {
  roles: ['smith', 'miner', 'gate guard', 'tunnel runner', 'rune carver'],
  promises: ['open the gates', 'keep the forge lit', 'see the sky above the mountain'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Deep Roads', text: 'Tunnels running under the whole mountain range. The far ends were sealed for a reason.' },
    { k: 'place', tier: 'far', name: 'The First Anvil', text: 'Struck by the founder of the Hold. It still rings if you touch it.' },
    { k: 'custom', tier: 'far', name: 'The Long Siege', text: 'The army at the gates has been there for eighty years. Some of them were born there.' },
    { k: 'place', tier: 'far', name: 'The Collapsed Mine', text: 'Three hundred miners were lost. Their hammers can still be heard on quiet nights.' },
    { k: 'place', tier: 'city', name: 'The Great Gate', text: 'Twenty feet of steel. It has not opened in a lifetime.' },
    { k: 'place', tier: 'city', name: 'The Ration Hall', text: 'Where everyone eats together, at long tables, in shifts, under strict rules.' },
    { k: 'custom', tier: 'city', name: 'The Hearth Oath', text: 'Every child swears at twelve to keep a fire burning in the Hold.' },
    { k: 'person', tier: 'city', name: 'Gatewarden Brekka', text: 'Has never left her post. Her family brings her meals.' },
    { k: 'custom', tier: 'city', name: 'The Song of Seams', text: 'Miners sing to find weak rock. Every tunnel has its own verse.' },
    { k: 'custom', tier: 'city', name: 'Stonefall Night', text: 'When the mountain shifts, everyone holds hands in the dark until it stops.' },
    { k: 'place', tier: 'home', name: 'The forge on the third deep', text: "Your family's forge, hot for six generations.", near: 'at the forge on the third deep' },
    { k: 'place', tier: 'home', name: 'The vent-house', text: 'A cramped home by an air shaft. You learned to sleep through the wind.', near: 'in a vent-house by the air shafts' },
    { k: 'person', tier: 'home', name: 'Your mother Hild', text: 'A smith who makes a new blade every time the siege takes someone.', rel: 'mother' },
    { k: 'person', tier: 'home', name: 'Your friend Pell', text: 'A runner who knows every tunnel. Taught you to find your way in the dark.', rel: 'friend' },
  ],
};
FINAL_GREET.forge_king = '{champ}. I had the gates reinforced when I heard you were coming.';
