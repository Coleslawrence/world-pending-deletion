// ===== [World Pending Deletion] — content: world pack: Iron Hold =====
'use strict';
WORLD_TYPES.iron = { name: 'Iron Hold', flavour: 'Mountain forges under siege.', home: 'bastion', guest: 'pyre', guest2: 'storm', gift: 'runesmith', final: 'forge_king', names: [['Dur', 'Gor', 'Bal', 'Kaz', 'Thra', 'Grim', 'Skar', 'Hel', 'Bron', 'Vik'], ['ak', 'heim', 'dur', 'mund', 'hold', 'rak', 'gard', 'stad', 'borg', 'nar']], mids: ['en', 'a', 'ar'], champs: ['Brann', 'Helga', 'Tormund', 'Sigrun', 'Durek', 'Ingrid', 'Arne', 'Astrid', 'Bjorn', 'Dagny', 'Eirik', 'Frida', 'Gunnar', 'Hakon', 'Gudrun', 'Ivar', 'Jorunn', 'Knut', 'Ragna', 'Solveig', 'Torvald', 'Ulla', 'Vigdis', 'Yrsa'] };
// ruler: the old power a clashing People contradicts (PEOPLES[x].clash), and what backing it in the power struggle gives
WORLD_TYPES.iron.ruler = { name: 'the Mountain Throne', line: 'The throne under the mountain has never been empty.', then: { stats: { VIT: 2 } }, say: '[The Mountain Throne stands. Its walls are yours.]' };
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
    // World expansion (12 Nov): 6 more each. added: 'x3' keeps them out of Pending World days before ADDED_FROM.x3
    { k: 'place', tier: 'far', name: 'The Echoing Hall', text: 'A hall so deep that a shout comes back a day later. Lovers leave messages in it.', added: 'x3' },
    { k: 'custom', tier: 'city', name: 'The Count of Hammers', text: 'At the first bell every smith strikes once, together. The mountain answers.', added: 'x3' },
    { k: 'person', tier: 'city', name: 'Delver Ruska', text: 'Has mapped more tunnels than anyone alive. Refuses to map the last one.', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The house with the lucky beam', text: 'A roof beam from the first forge. Every child touches it before their first shift.', near: 'under the lucky beam in a deep house', added: 'x3' },
    { k: 'place', tier: 'home', name: 'The mushroom cellar', text: 'Your grandfather grew mushrooms there for the whole street. It is still warm.', near: 'above the mushroom cellar on the fourth deep', added: 'x3' },
    { k: 'person', tier: 'home', name: 'Your sister Dagny', text: 'The youngest gate guard ever sworn. Takes the oath very seriously.', rel: 'sister', added: 'x3' },
  ],
};
FINAL_GREET.forge_king = '{champ}. I had the gates reinforced when I heard you were coming.';
