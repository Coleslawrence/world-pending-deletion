// ===== [World Pending Deletion] — content: world layers =====
'use strict';
// A world is its type (worlds/) plus layers rolled on top. The type decides everything mechanical: home class, World
// Gift, Final Champion. Layers decide what the world is like to live in, and each brings its own writing:
//   FATES    what was already going wrong there before the System came. Picks the world's modifier.
//   PEOPLES  who lives there and how they live.
// Each layer may carry, all optional:
//   name, line        its name and one flavour line for the world card (a Fate's line reads after the type's flavour)
//   entries           World Record entries, the same shape as a LORE pool's ({ k, tier, name, text, near?, rel? })
//   roles, promises   extra bio roles ("You were a {role} of ...") and promises ("You promised ... you would {promise}.")
//   mods              (Fates) modifier weights, e.g. { bloodmoon: 3, none: 1 }; without it the usual weights apply
//   epithets          (Peoples) what the System may call a champion of this people in broadcasts
//   settings          the settings it suits (['fantasy']); a world type has one setting (WORLD_TYPES[t].setting, fantasy
//                     by default). Without a list it suits every setting. Entries may carry settings too; roles and
//                     promises can't, so keep them true to every setting the layer suits.
// Runs and snapshots store layer ids and entry positions, so ids are permanent and every list only grows at the end.
// Records number a world's entries by where they come from (LAYER_BASE in core.js): the type's own 0 to 99,
// the Fate's from 100, the People's from 200, a Confluence type's from 300.
const FATES = {};
const PEOPLES = {};
// A Confluence is a second world type pressing in on the first. It lends half the name and one record entry,
// never its Gift or Final Champion. chance is the share of worlds that get one (off until the writing for it lands).
const CONFLUENCE = { chance: 0, take: 1 };
