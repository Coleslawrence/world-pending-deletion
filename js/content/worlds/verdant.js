// ===== [World Pending Deletion] — content: world pack: Verdant Wilds =====
'use strict';
WORLD_TYPES.verdant = { name: 'Verdant Wilds', flavour: 'Fey forests that eat travellers.', home: 'blade', gift: 'hedgewitch', final: 'thorn_mother', names: [['Syl', 'Fae', 'Bri', 'Ald', 'Thorn', 'Wy'], ['wood', 'glade', 'mere', 'wyn', 'holt', 'bryn']], champs: ['Rowan', 'Elowen', 'Bramble', 'Faye', 'Linden', 'Oriel'] };
// World Record pool. Pool order is fixed once shipped: add new entries at the end, never reorder or delete.
LORE.verdant = {
  roles: ['woodcutter', 'lantern-keeper', "hedge witch's apprentice", 'trapper', 'miller'],
  promises: ['keep the lanterns burning', "bring Briar's voice back", 'walk home through the wood'],
  entries: [
    { k: 'place', tier: 'far', name: 'The Hungry Wood', text: 'The deepest forest. Maps of it are always missing the person who drew them.' },
    { k: 'place', tier: 'far', name: 'The Court Under the Hill', text: 'Where the fey hold their feasts. Guests arrive for a night and leave a century later.' },
    { k: 'custom', tier: 'far', name: 'The Treaty of Briars', text: 'The old pact: the forest leaves the villages alone, and the villages never count the trees.' },
    { k: 'place', tier: 'far', name: 'The Moonmere', text: 'A lake that shows you as you will be. Most people stop looking after one visit.' },
    { k: 'custom', tier: 'city', name: 'The Ring of Lanterns', text: "A circle of lights around every village. Step outside it after dark and you are the forest's." },
    { k: 'place', tier: 'city', name: 'The Bargain Stone', text: 'Where deals are struck with the fey. Read every word twice.' },
    { k: 'custom', tier: 'city', name: 'Name Day', text: 'Children are given a true name in secret and a false one for the forest to hear.' },
    { k: 'person', tier: 'city', name: 'Warden Ash', text: "Has walked the Hungry Wood and come back. Twice. Won't say what she gave for it." },
    { k: 'place', tier: 'city', name: 'The Thornwall', text: 'A living hedge around the town, fed every spring with a little blood.' },
    { k: 'custom', tier: 'city', name: 'The Antler Fair', text: 'Once a year, the fey trade openly in the market. Everyone counts their children afterwards.' },
    { k: 'place', tier: 'home', name: 'The house in the great oak', text: 'Your family lives inside a tree that agreed to it. Mostly.', near: 'inside the great oak' },
    { k: 'place', tier: 'home', name: 'The mill at Wyn Ford', text: "Its wheel turns even when the river doesn't.", near: 'by the mill at Wyn Ford' },
    { k: 'person', tier: 'home', name: 'Your sister Briar', text: 'Was taken by the fey for a year and came back speaking only in riddles.', rel: 'sister' },
    { k: 'person', tier: 'home', name: 'Old Hob', text: 'A hedge-wizard who taught you which mushrooms to eat and which to apologise to.', rel: 'teacher' },
  ],
};
FINAL_GREET.thorn_mother = '{champ}. The forest has been saving a place for you.';
