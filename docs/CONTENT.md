# Adding content

All of the game's content lives in `js/content/`: the effect registry (`effects.js`), the feat list (`feats.js`), the outcome list (`outcomes.js`), enemy move roles (`moves.js`), archetypes, skills, rune prefixes (`prefixes.js`), gear, gods, world packs, enemies, Undercity events and chains, Gifts, Titles, quests and Hidden Paths. Wagers and districts are still in `js/core.js`.

## Where things go

| To add | Edit |
| --- | --- |
| A skill | `js/content/skills/<archetype>.js`: one `sk()` line with its two ★3 evolutions |
| Gear | `js/content/gear.js`. Its rank sets its stat points at ★1 (`GEAR_BUDGET`: E 2, D 3, C 4, B 5, A 6; accessories one fewer), and `top` is the one new effect it gains at ★3. The checker holds both, except for glitched and Experimental gear |
| An archetype | `js/content/archetypes.js` (the entry and its grid cell), its skills file, a colour in `css/style.css`, a Hidden Path for every pair, `STAT_INFO` in `base.js` |
| A world type | A new pack in `js/content/worlds/` (the world with its `guest` class and optional `setting`, its World Record pool, its Final Champion's greeting), plus its Final Champion in `enemies.js`, its World Gift in `gifts.js` and its world-first Title in `titles.js` and `FINAL_TITLE` |
| A Fate or a People (world layers) | `js/content/layers.js`: its name, card line, record entries, roles and promises; a Fate's modifier weights, a People's epithets. Ids sit in their own number range in records, so each list holds at most 99 |
| A god | `js/content/gods.js` (its archetypes, blessing and rival reply line) and a `chosen_<id>` divine Gift in `gifts.js` |
| An enemy | `js/content/enemies.js`, and `MONSTERS` or `RIVALS`. Its moves play roles (strike, big hit, guard, setup, sustain) with numbers from its tier in `moves.js`; boss mechanics are fields from the enemy mechanics list below |
| A trait monsters and rivals can roll | `js/content/traits.js` |
| An Undercity event | `js/content/events/undercity.js` |
| An event chain | A new file in `js/content/events/`: its `CHAINS` entry and one event per step. The format is described at the top of `js/content/events.js` |
| A Gift, Title, quest or Hidden Path | `gifts.js`, `titles.js`, `quests.js`, `paths.js`. A Gift or Title's fight effect is its `p`, from `effects.js`. A Title is earned for, and a quest asks for, a `feat` from `feats.js` |
| A wager or Trial condition | `WAGER_FEATS` in `js/core.js`: the feats a god will bet on |
| A new outcome (something given or set as a consequence) | `js/content/outcomes.js` (its words and whether it is announced last), plus the code in `js/core.js` that applies it (`OUTCOME_APPLY`) |
| A new feat (a measured deed) | `js/content/feats.js`: when it is measured, its words, and how it is checked against the fight tally |
| Glitched content | Mark it `glitch: true` where it lives: a prefix in `prefixes.js`, gear in `gear.js`, a skill in `skills/glitched.js`, an event in `events/glitch.js`, a trait in `traits.js`, a world modifier in `worlds.js`. Name it with one corrupted letter. Glitches only turn up where `glitchesOn(run)` (never Pending World except on Glitch Day), and each needs a Known Issues entry in `glitches.js` |
| A new passive effect | `js/content/effects.js` (its phrase, how it combines, whether enemies can carry it), plus the code in `js/core.js` that reads it |

A new file needs a `<script>` tag in `index.html`, before `js/core.js`, and an entry in the `CORE` list in `sw.js`.

## Before you build

New content starts as a content card in the project files (`content/cards/`, from `TEMPLATE.md`): what it is, where it belongs, every line in its voice, and the effects it uses. Nothing is built until Slaw says yes on the card. A new world, god or Final Champion gets its lore bible entry agreed first.

Ideas from outside the project (Slaw's inspiration list, a game or book, a pasted doc, a playtester's suggestion) come in as **Draft** cards, following `content/cards/IMPORT.md`: capture the source, sort it into ideas, adapt each one (the mechanic, never another work's names or text), check, and hand the batch to Slaw.

The card checker reads cards against the game before Slaw sees them:

```
node tools/card-check.js <cards folder>                                   # checks every card; exits 1 on any error
node tools/card-check.js <cards folder> --new event "Name" --source TEXT  # starts a Draft card with a free id
node tools/card-check.js <cards folder> --index                           # also writes INDEX.md, every card by status
```

It fails on an id or name the game or another card already uses, an effect that isn't on the menu below (unless the card says it needs a new one), an event with no free option or with a locked one, and the style guide's spelling, dash and bracket rules. A Draft card also needs its source and an "Adapted from" section.

Card previews show a card in the real game before anything is built: `node tools/card-preview.js <card or cards folder>` adds the card's event, gear, Title or enemy to the game in a browser, opens the screen it appears on at 360×640, saves screenshots in `<cards folder>/previews/` and rewrites the card's Preview section with them. Numbers in a preview are stand-ins until the data PR. An enemy card needs a ```js block of draft data under Mechanics (its `ENEMIES` entry as the data PR would add it); the preview shows its scout report, the fight starting, and its second phase.

This whole process, from an outside source to Draft cards with previews, is called an **intake** (`content/cards/IMPORT.md`).

## Rules

- **Content uses only content.** Files in `js/content/` may use each other and `base.js`, never anything from `js/core.js`. They load before it.
- **Ids are permanent.** Saves, shared champions and the Halls store them. Rename the display name freely; never change or remove an id.
- **World Record pools only grow at the end.** Runs store pool positions, so never reorder, edit or delete an entry, a role or a promise. The same goes for the pools of Fates and Peoples.
- **A world is a type plus layers.** The type decides everything mechanical (home class and `guest`, World Gift, Final Champion); Fates and Peoples only add writing and pick the modifier. Write layers so they fit every world type of their setting; a layer or entry that only suits some settings lists them in `settings`.
- **Event options keep their places.** Run summaries store the option picked by its position, so add new options at the end and never remove one.
- **Outcomes live in `js/content/outcomes.js`.** Whatever an event option gives (`then`), a quest pays (`reward`) or a wager pays is a set of outcomes, `{ gold: 8, favour: { war: 2 } }`, applied and worded by one piece of code. An event option that needs more goes in `go(run, h)`, which reaches the rules only through the helpers in `h`.
- **Effects come from the menu below.** New content that only uses effects already listed is data. A new effect is a mechanic: it needs code in `js/core.js`, a line in the bot's scoring (`tools/bot.js`, `choosePlayer`) and its own pull request.
- **Passive effects live in `js/content/effects.js`.** Archetype bonuses, gear, Hidden Paths, Gifts, Titles, Rank perks, stat milestones, god blessings and enemy passives all say what they do as `{ key: value }` from it. Each entry has the phrase players read, so a description says what the effect says. Where an effect has a rule players couldn't guess from its number (Thorns double below half HP), its `must` makes the checker fail any description that leaves the rule out.
- **Feats live in `js/content/feats.js`.** A deed the player can be asked for (win within 6 turns, trigger 2 reactions, defeat a rival without healing) is declared once as a feat, and wagers, Rank Trial conditions, Titles and quests all ask for it by key, so it is measured the same way everywhere. A feat that an archetype's kit can't meet says so (`unfairFor`), and one that needs a tool says which (`needs`). The checker makes a Title's or quest's words say what counts (`must`).
- **Content sits on the grid.** Every skill, piece of gear, enemy, world, god and event chain is tagged with one archetype or two allies, and uses what they own (see Archetypes and the grid).
- **Every choice can be picked.** An event always keeps one option with no condition and no cost. Options the player can't take are left out, never shown greyed out.
- **Choices are actions.** A cost is shown only when paying is the action itself ("Pay 6 gold"). Every other consequence is revealed after the pick, as a System line in [brackets].
- **Every skill, piece of gear, Gift and Title has a flavour line** (`flavour`; skills and their evolutions get theirs from the `flav({ ... })` block at the end of their archetype's file). It is the world's voice under the rules, or one whole System line in [brackets]: up to 16 words, no numbers, its own line (no two alike). The game shows it in italics under the description.
- **Player text follows the style guide:** British spelling, no em-dashes, one name for one thing, and the length limits for one phone screen.

## Checks

Every pull request runs these (`.github/workflows/checks.yml`):

| Check | Run it yourself | Fails when |
| --- | --- | --- |
| Content checker | `node tools/check-content.js` | A content file isn't loaded or uses `core.js`; an id is removed; a World Record pool is reordered; a field is unknown or missing; a reference points at nothing; an effect key isn't one the engine reads; an event could show no options, hides a cost, or loses an option; text breaks the style guide; two things share a name |
| Entrant pool reserves | `node tools/pool-seed.js --check` | A reserve build in `js/content/pool.js` uses a skill, gear, Gift or Title that no longer exists. Rerun `node tools/pool-seed.js` to rebuild them from bot runs |
| Smoke sim | `node tools/stats.js 200 --seed 1`, `node tools/daily.js 2026-11-01`, `node tools/record.js` | The game crashes in play, or Pending World or the World Record checks break |
| Balance gate | `node tools/balance-gate.js BASE_DIR .` | The overall spared rate moves more than 3 points, or any archetype as the bot's main moves more than 6. Label the pull request `balance-change` when moving the numbers is the point: the gate then only reports |

After merging content into dev or main, run `node tools/content-index.js --out <project files>/lore/content-index.md`: it rewrites the lore bible's index of every name, what it belongs to and the release it shipped in.

After adding content, run `node tools/check-content.js --write`. It records the new ids in `tools/content-ids.json` and rewrites the effect lists below. Commit both.

## Archetypes and the grid

The archetypes are the game's themes, placed on a fixed grid like a colour pie: every archetype is one stat (`stat`) and one Discipline (`disc`, from `DISCIPLINES` in `archetypes.js`: Ward, Mend, Bane, Sway, Might). Archetypes sharing a stat or a Discipline are allies (`themeAllies`), and a run is dealt its home archetype's allies first. The grid is 5 by 5 and never grows: a new archetype takes a free cell (the checker refuses two in one cell), and no existing archetype changes. A world type whose home has only one ally names a `guest2` to fill its class pool.

Each archetype carries its `line` (its philosophy in one sentence; everything made for it fits the line), `owns` (the skill effects it owns) and `words` (imagery for names and lore). The grid table in the menu below is written from them.

**Tags.** A piece of content carries one archetype, or two neighbours (a pair, like a Bastion and Stormcaller boss that blocks and stuns): skills and gear in `tags`, worlds in `home`, gods in `arch`, enemies and event chains in `theme`. Finals carry their world's home. The System's own fighters (the Proctor, legends, the Undefeated) and events about the tournament itself carry none.

**The pie.** A skill or an enemy move may use the effects its archetype owns, or what a neighbour owns; `dmg` and `block` are open to all. The checker warns about a **pie break** (a Pyre skill that Bleeds) rather than failing: a break is fine when it is meant, and `breaks: ['bleed']` on the skill or enemy says so once Slaw has agreed. ★3 evolutions may borrow from anywhere. A new skill effect is given an owner in `owns` before content uses it; passive effects say their own theme in `effects.js`. The content index (`tools/content-index.js`) shows what each archetype has, so a theme with no home world or no enemies shows as a gap.

## Enemy traits, passives and phases

An enemy is its moves (`skills`, each a name `n` and the same `fx` keys as player skills), the order it uses them (`script`, looping), and any of these. Every move plays a role the checker reads from its effects: a **strike**, a **big hit** (the one to Block or Stun; it shows as a big move), a **guard**, a **setup** (its theme's status, with little damage) or **sustain**. `moves.js` holds each tier's numbers for those roles and what a tier needs (a Final Champion has a big hit or sustain). Numbers outside the tier warn, as the power budget, and the balance gate (the sims) decides in the end. A new enemy is a theme from the grid plus roles: a Stormcaller boss is a strike, a guard, a big hit and a Stun setup. A new boss mixes them; a trait that doesn't exist yet is a mechanic and gets its own pull request first.

| Trait | Value | What it does |
| --- | --- | --- |
| `enrage`, `enrageMult` | share of max HP, multiplier (default 1.5) | At or below that HP, deals that much more damage |
| `dodge` | chance | Dodges attacks |
| `adapt` | share, like 0.6 | Takes that share of the damage from the skill you have used most this fight |
| `flood` | every N turns | The arena floods: whoever has less Block is Weakened for 2 turns |
| `aura` | Burn per turn | Sets you alight at the start of each of its turns |
| `briar` | Bleed per turn | Makes you Bleed at the start of each of its turns |
| `twincast` | every N turns | Uses its move twice |
| `forge` | Block per turn | Its Block never fades and grows each turn |
| `revive` | share of max HP | Rises once with that much HP |

Burn, Bleed and Block amounts scale with the enemy's power, like its moves.

**Passives** (`passives: { regen: 3, thornsAlways: 2 }`) use the effects marked for enemies in `effects.js`, listed in the menu below. Flat amounts scale with the enemy's power; rates don't.

**The trait pool** (`js/content/traits.js`) gives monsters and rivals extra traits each run. When opponents are offered, each monster or rival rolls `TRAIT_COUNT[round - 1]` traits from `TRAIT_POOL`, and the choice screen, the fight and the scout report show them with their `desc`, so the player can pick the opponent their build handles. An entry is a `name`, a `desc` (what it does, in a few words) and `passives` and/or `traits` as above. Passives add to the enemy's own; for a trait it already has, the stronger value counts. Finals, the Elite bracket, erased champions and Rank Trials never roll from the pool.

**Phases** turn a boss into a two-part fight:

```js
phase: { at: 0.5, say: '[The Forge King\'s anvil cracks.]', add: [{ n: 'Slag Burst', fx: { dmg: 4, hits: 3, burn: 2 } }], script: [3, 2, 0], set: { forge: 5 } }
```

At or below `at` of max HP, the System says `say`, the moves in `add` join its moves (numbered after its own, so the first added move is `skills.length`), and it switches to `script` from the start, with any traits in `set`. Intent stays honest: the move already shown still happens as shown, and the new traits start after it. The scout report says the enemy has a second phase, not what it is.

## The effect menu

Written from the content itself by the checker, so it is always current. "Bot scores it: no" means the balance sims undervalue skills that lean on that effect.

<!-- effects:start (written by node tools/check-content.js --write) -->
### Skill effects (`fx`), used by skills and enemy moves

| Key | Used | Examples (value) | Shown to players as | Bot scores it |
| --- | --- | --- | --- | --- |
| `alwaysCrit` | 1 | Vital Strike (1) | Always a critical hit. | no |
| `augury` | 1 | The Hanged Augur: Augury (1) | (works with other keys on the same skill) | yes |
| `bleed` | 15 | Lacerate (5), Thousand Cuts (1), Scorching Cut (2), … | Apply 5 Bleed. | yes |
| `block` | 72 | Ember Ward (8), Iron Guard (9), Shield Bash (6), … | Gain 8 Block. | yes |
| `blockDmg` | 9 | Smite (0.5), Bulwark Slam (1.2), Judgement (1), … | Plus damage equal to 50% of your Block. | yes |
| `blockPip` | 6 | Hedge Your Bet (3), Insurance (3), Side Bet (2), … | (works with other keys on the same skill) | yes |
| `boxcars` | 1 | Boxcars (1) | (works with other keys on the same skill) | yes |
| `brk` | 31 | Penance (6), Holy Light (6), Purify (4), … | Break 6: fills the opponent's break bar. | yes |
| `burn` | 41 | Firebolt (4), Ember Ward (4), Flame Wave (2), … | Apply 4 Burn. | yes |
| `bust` | 4 | Double Down (6), All In (8), Press Your Luck (6), … | (works with other keys on the same skill) | yes |
| `bustAt` | 1 | All In (2) | (works with other keys on the same skill) | yes |
| `calamity` | 4 | Calamity (4), Catastrophe (5), Aftermath (4), … | Jinx the shown move for free, then deal 0 + 4 per Misfortune and clear it. You take 3 Curse. | yes |
| `cashOut` | 1 | Cash Out (0.5) | Heal 50% of the damage dealt. | yes |
| `cleanse` | 20 | Unbreakable (1), Purify (1), Miracle (1), … | Remove your Burn, Poison, Bleed and Weaken. | yes |
| `coinStun` | 4 | Cursed Coin (1), Bad Penny (1), Heads I Win (1), … | A move you jinx this turn also Stuns its user next turn. | yes |
| `critBonus` | 3 | Precise Strike (0.5), Exposing Strike (0.5), Homing Missiles (0.25) | +50% critical chance. | no |
| `cruel` | 4 | Assassinate (2), Death Blossom (2), Coup de Grace (2.5), … | ×2 damage if the opponent has 2 or more effects. | yes |
| `curseDmg` | 1 | Crossed Path (3) | (works with other keys on the same skill) | yes |
| `curseKeep` | 1 | Keep a Little (2) | (works with other keys on the same skill) | no |
| `dbl` | 1 | Double or Nothing (4) | (works with other keys on the same skill) | yes |
| `detonate` | 4 | Ignite (2), Combust (3), Wildfire (2), … | Deal 2× the opponent's Burn as damage, then remove it. Ignores Block. | yes |
| `die` | 27 | Coin Toss (1), Hedge Your Bet (1), Double Down (1), … | Rolls a die each turn, shown before you pick. | no |
| `dieMin` | 2 | Two-Headed Coin (4), Hedged Bet (3) | (works with other keys on the same skill) | yes |
| `dieStun` | 4 | Thunder Dice (6), Rolling Thunder (5), Storm Front (6), … | (works with other keys on the same skill) | yes |
| `dmg` | 223 | Firebolt (7), Flame Wave (4), Scorch (5), … | Deal 7 damage. | yes |
| `dmgAll` | 4 | Jackpot (3), Progressive Jackpot (3), Cash Out (3), … | Deal 3 per pip across all your shown dice. | yes |
| `dmgPip` | 19 | Coin Toss (2), Double Down (6), Thunder Dice (2), … | (works with other keys on the same skill) | yes |
| `doom` | 5 | Doom (26), Swift Doom (22), Inevitable Doom (40), … | Doom: after 3 of the opponent's turns, they take 26 damage. | yes |
| `doomT` | 1 | Swift Doom (2) | (works with other keys on the same skill) | no |
| `doublePoison` | 5 | Thousand Needles (1), Venom Storm (1), Needle Rain (1), … | (works with other keys on the same skill) | no |
| `drainPoison` | 1 | Wither (1) | Heal equal to the opponent's Poison. | no |
| `empower` | 15 | War Cry (2), Bonfire (2), Spell Theft (2), … | Deal 30% more damage for 2 turns. | yes |
| `evade` | 8 | Smoke Bomb (1), Vanish (2), Caltrops (1), … | Evade the next attack. | yes |
| `execMult` | 9 | Execute (2.5), Soul Harvest (2), Decapitate (3), … | (works with other keys on the same skill) | yes |
| `execute` | 9 | Execute (0.3), Soul Harvest (0.3), Decapitate (0.3), … | (works with other keys on the same skill) | yes |
| `focus` | 15 | Focus (0.6), Read the Glyph (0.2), Loaded Die (0.2), … | Your next damaging skill deals 60% more. | yes |
| `haste` | 5 | Time Warp (2), Spellweave (1), Haste (3), … | Your other cooldowns drop by 2. | yes |
| `heal` | 29 | Sacred Flame (8), Penance (2), Holy Light (10), … | Heal 8. | yes |
| `healMissing` | 8 | Second Wind (0.25), Miracle (0.5), Last Breath (0.4), … | Heal 25% of your missing HP. | yes |
| `healPip` | 2 | Lucky Coin (1), Insurance (1) | (works with other keys on the same skill) | yes |
| `hits` | 43 | Flame Wave (2), Quick Slash (2), Fan of Knives (4), … | (works with other keys on the same skill) | yes |
| `interrupt` | 4 | Counterspell (1), Nullify (1), Spell Theft (1), … | Interrupt: cancel the opponent's next move and put it on cooldown. | yes |
| `jinxDisc` | 5 | Knock on Wood (2), Sore Loser (2), Touch Wood (2), … | Your next jinx this turn costs 2 less. | yes |
| `keep` | 1 | Wildfire (1) | (works with other keys on the same skill) | no |
| `keepHalf` | 1 | Aftermath (1) | (works with other keys on the same skill) | no |
| `killReset` | 3 | Silent Kill (1), Mercy Kill (1), Last Hour (1) | No cooldown if it kills. | no |
| `leech` | 4 | Leech (3), Blood Leech (6), Parasite (3), … | Leech: for 4 turns, drain 3 HP from the opponent each turn. | yes |
| `lifesteal` | 14 | Drain Life (0.5), Soul Harvest (0.6), Soul Drain (0.6), … | Heal 50% of the damage dealt. | no |
| `malice` | 4 | Malice (3), Spite (5), Torment (3), … | +3 for each effect on the opponent. | yes |
| `mark` | 15 | Mark Prey (2), House Edge (3), Holy Brand (2), … | Mark the opponent: they take 30% more damage for 2 turns. | yes |
| `mirror` | 1 | The Masked Entrant: Mirror Form (1) | (works with other keys on the same skill) | no |
| `misf` | 12 | Crooked Odds (2), Evil Eye (2), Cursed Coin (5), … | Misfortune 2. | yes |
| `misfPerBurn` | 4 | Bad Wick (3), Wax and Ash (2), Ember Omen (3), … | Then Misfortune 1 for every 3 Burn on the opponent. | yes |
| `misfT` | 1 | Bad Penny (2) | Then Misfortune 2 each turn for 3 turns. | yes |
| `momentum` | 4 | Momentum (4), Unstoppable (7), Avalanche (3), … | +4 damage for each turn in a row you've used a damaging skill. | yes |
| `nextCrit` | 3 | Smoke and Mirrors (1), Deadly Mark (1), Palmed Die (1) | Your next hit is a critical. | no |
| `omenAtk` | 5 | Ill Omen (12), Dire Omen (18), Twin Omens (12), … | Omen: if the opponent attacks next, it takes 12 and gains 3 Misfortune. | yes |
| `omenGuard` | 1 | Twin Omens (1) | Omen: if it guards next, it loses half its Block and gains 3 Misfortune. | yes |
| `passCurse` | 4 | Pass the Curse (2), Crossed Path (2), Keep a Little (2), … | Move all your Curse onto the opponent as double the Misfortune. | yes |
| `perCurse` | 4 | Thirteenth Hour (3), Witching Hour (4), Last Hour (3), … | (works with other keys on the same skill) | yes |
| `perHit` | 14 | Flame Wave (1), Thousand Cuts (1), Fire Rain (1), … | (works with other keys on the same skill) | no |
| `perMisf` | 4 | Thirteenth Hour (3), Witching Hour (4), Last Hour (3), … | Deal 3 per Misfortune on the opponent plus 0 per Curse on you. | yes |
| `pierce` | 11 | Arcane Missiles (1), Arcane Cataclysm (1), Heartseeker (1), … | Ignores Block. | no |
| `poison` | 33 | Pandemic (6), Venom Blade (2), Hex (2), … | Apply 6 Poison. | yes |
| `portent` | 1 | The Hanged Augur: Portent (1) | (works with other keys on the same skill) | yes |
| `progressive` | 1 | Progressive Jackpot (1) | (works with other keys on the same skill) | yes |
| `read` | 32 | Backdraft ("attack"), Seep ("defend"), Sidestep ("attack"), … | (works with other keys on the same skill) | yes |
| `readFx` | 32 | Backdraft ({"burn":4,"detonate":1}), Seep ({"poison":7}), Sidestep ({"dmg":4,"evade":1,"mark":2}), … | (works with other keys on the same skill) | yes |
| `reflect` | 1 | Reversal (1) | (works with other keys on the same skill) | no |
| `regen` | 10 | Consecrate (4), Cinder Shell (2), Symbiote (2), … | Heal 4 at the start of your next 3 turns. | yes |
| `replay` | 1 | Err̷or (1) | (works with other keys on the same skill) | yes |
| `reroll` | 7 | Loaded Die (1), Crooked Odds (1), Sleight of Hand (1), … | Reroll your other dice. | yes |
| `riposte` | 4 | Riposte (1.5), Perfect Riposte (2.5), Parry Master (1.5), … | Until your next turn, damage you block is dealt back ×1.5. | yes |
| `rollTwice` | 4 | House Edge (3), Stacked Deck (4), Marked Cards (3), … | For 3 turns, your dice roll twice and keep the higher. | yes |
| `selfDmg` | 4 | Berserk (3), Err̷or (6), Blood Rage (4), … | Costs 3 HP. | yes |
| `setSix` | 1 | Weighted Die (1) | Set your lowest die to 6. | yes |
| `siphon` | 4 | Siphon (1), Soul Siphon (1), Hex Siphon (1), … | Steal the opponent's Block and remove their Power. | yes |
| `snake` | 4 | Snake Eyes (45), Boxcars (45), Long Odds (60), … | (works with other keys on the same skill) | yes |
| `stack` | 1 | Stack Overfl̷ow (0.25) | (works with other keys on the same skill) | no |
| `stun` | 12 | Thunderclap (1), Thunder God's Wrath (1), Flashpoint (1), … | Stun: the opponent loses their next turn, and the move they were about to use goes on cooldown. | yes |
| `stunIfWeak` | 6 | Overload (1), Numbing Needles (1), Jolt (1), … | If the opponent is Weakened, Stun them. | yes |
| `thorns` | 9 | Retribution (8), Blazing Aegis (6), Spiked Guard (5), … | Until your next turn, hit back for 8 when struck. | yes |
| `uncurse` | 1 | Ward Off (1) | Remove 1 Curse. | no |
| `weaken` | 49 | Hex (2), Frost Lance (2), Static Jab (1), … | Weaken the opponent for 2 turns. | yes |

### Passive effects (`p`), from `js/content/effects.js`

Used by archetype bonuses (`p`), gear (`pas` scales with stars, `fix` does not), Hidden Paths (`fx`), Gifts and Titles (`p`), Rank perks and stat milestones (`p`), god blessings (`bless`, at 8 Favour) and enemies (`passives`, only the ones marked for enemies). Combines: how values from several sources add up. Grows: grows with your level when it comes from gear or an archetype bonus.

| Key | Used | Examples (value) | Shown to players as | Combines | Grows | Enemies | Theme |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `afterQuick` | 4 | Spellblade (0.3), apprentice_staff (0.25), shadow_leathers (0.1), … | After a Quick skill, your next skill deals 30% more. | add |  |  | Arcanist |
| `arcCd` | 1 | Arcanist 2 (8) | Your other skills: 1 turn shorter cooldown for every 8 INT (minimum 1). | set |  |  | Arcanist |
| `bleedHeal` | 1 | Butcher (0.5) | Heal 50% of the Bleed damage your opponent takes. | add |  |  | Bladedancer, Reaper |
| `bleedMisf` | 1 | Unlucky Cut (1) | Bleed you apply +1 for every 3 Misfortune. | add |  |  | Jinx, Bladedancer |
| `bleedMult` | 1 | Bladedancer 6 (2) | Bleed deals double damage. | set |  | rate | Bladedancer |
| `bleedPlus` | 7 | Bladedancer 4 (2), duelist_rapier (1), bloodstone_amulet (1), … | Bleed you apply +2. | add |  | flat, scales with power | Bladedancer |
| `bleedPoison` | 2 | serpent_dagger (1), Viper Dance (2) | Every Bleed you apply also applies 1 Poison. | add |  |  | Bladedancer, Venom |
| `blockDmgPct` | 1 | Juggernaut (1) | Deal 1% more damage for every 2 Block you have (up to 40%). | add |  |  | Bastion, Reaper |
| `blockKeep` | 2 | Bastion 2 (0.25), tower_shield (0.3) | Keep 25% of your Block between turns. | add |  | rate | Bastion |
| `blockMisf` | 2 | mirror_shard_mail (1), Bad Landing (2) | A hit your Block fully stops adds 1 Misfortune. | add |  |  | Jinx, Bastion |
| `blockStrike` | 1 | Bastion 6 (0.5) | Gaining Block also deals 50% of it as damage. | set |  |  | Bastion |
| `blockStun` | 1 | Thunder Wall (0.25) | When your Block absorbs a hit, 25% chance to Stun the attacker. | add |  |  | Bastion, Stormcaller |
| `blockThorns` | 2 | spiked_buckler (0.3), crown_of_thorns (0.15) | Gaining Block also gives Thorns equal to 30% of it. | add |  |  | Bastion |
| `breakEmpower` | 1 | Lightning Rod (2) | Breaking an opponent Empowers you for 2 turns. | set |  |  | Stormcaller |
| `burnExec` | 2 | ember_gauntlets (0.2), Funeral Pyre (0.25) | +20% damage to Burning opponents below half HP. | add |  |  | Pyre, Reaper |
| `burnFade` | 2 | Pyre 2 (0.15), Pyre 6 (0) | Burn on the opponent fades slower (15% a turn, not 30%). | min |  |  | Pyre |
| `burnHeal` | 4 | Cinder Warden (0.2), cinder_robe (0.3), bellows (0.15), … | Heal 20% of the Burn damage your opponent takes. | add |  |  | Pyre, Zealot |
| `burnLowDie` | 1 | Wildfire Bet (1) | Burn you apply is raised by your lowest die. | set |  |  | Gambler, Pyre |
| `burnMisf` | 1 | Black Candle (1) | Burning opponents gain 1 Misfortune each turn. | add |  |  | Jinx, Pyre |
| `burnPlus` | 6 | Pyre 4 (4), ember_gauntlets (2), cinder_robe (1), … | Burn you apply +4. | add |  | flat, scales with power | Pyre |
| `burnPoison` | 1 | plague_censer (2) | Whenever you apply Burn, also apply 2 Poison. | add |  |  | Pyre, Venom |
| `chanceBonus` | 2 | Loaded Dice (15), The House (10) | Chance options in events +15%. | add |  |  |  |
| `chanceFloor` | 1 | Born Lucky (50) | Your first chance option each round can't be under 50%. | set |  |  |  |
| `copycat` | 1 | Copycat (1) | Once per fight, use the opponent's last move as your own. | set |  |  |  |
| `countdown` | 1 | countdown_collar (12) | You deal 20% less damage. If a fight reaches turn 12, your opponent is deleted. | set |  |  |  |
| `critBonus` | 6 | Swordmaster (0.15), duelist_rapier (0.1), Lucky Star (0.1), … | +15% critical chance. | add |  |  |  |
| `critMult` | 2 | Swordmaster (2), Executioner (1.75) | Critical hits deal ×2 instead of ×1.5. | set |  |  |  |
| `curseBlock` | 1 | mirror_shard_mail (4) | Each Curse you take gives you 4 Block. | add |  |  | Jinx |
| `dieMin` | 2 | Gambler 2 (2), Card Counter (3) | Your dice never roll below 2. | set |  |  | Gambler |
| `dmgPct` | 7 | Glass Cannon (0.3), Demon Blood (0.15), Ascendant (0.05), … | All your damage +30%. | add |  | rate |  |
| `dodge` | 4 | shadow_leathers (0.06), Elf-touched (0.1), Skyfall (0.05), … | +6% dodge. | add |  |  |  |
| `doomFaster` | 1 | Reaper 6 (1) | Doom lands a turn sooner. | set |  |  | Reaper |
| `doomLeech` | 1 | Soul Weaver (0.4) | Doom and Leech you apply are 40% stronger. | add |  |  | Reaper, Arcanist |
| `dotPlus` | 2 | plague_censer (1), The Trickster (2) | Burn, Poison and Bleed you apply +1. | add |  | flat, scales with power |  |
| `echoNext` | 1 | echo_chamber (0.5) | Every skill plays again next turn at 50% power. | set |  |  |  |
| `every3Stun` | 1 | Stormcaller 6 (1) | Every 3rd skill you use Stuns. | set |  |  | Stormcaller |
| `execBonus` | 4 | Headsman (0.5), executioner_axe (0.4), grave_shroud (0.15), … | +50% damage to opponents below 30% HP. | add |  |  | Reaper |
| `execPip` | 1 | Dead Man's Hand (0.02) | Execute thresholds rise by 2% for each pip on your highest die. | add |  |  | Gambler, Reaper |
| `extraHit` | 1 | Bladedancer 2 (1) | Multi-hit skills hit once more. | set |  |  | Bladedancer |
| `firstCrit` | 1 | duelist_rapier (1) | Your first hit each fight is critical. | set |  |  |  |
| `firstEvade` | 3 | shadow_leathers (1), Near Miss (1), Afterimage (1) | Evade the first attack each fight. | set |  |  |  |
| `firstFree` | 1 | Arcanist 4 (1) | Your first skill each fight has no cooldown. | set |  |  | Arcanist |
| `firstHit` | 3 | First Strike (1), First Blood (0.5), Arcane Mind (0.3) | Your first damaging skill each fight deals double. | add |  |  |  |
| `firstJinx` | 1 | The Crow (1) | The opponent's first move each fight goes wrong for them, as if jinxed. | set |  |  |  |
| `firstSix` | 2 | weighted_dice (1), Lucky Seven (1) | Your first die each fight rolls 6. | set |  |  | Gambler |
| `firstStun` | 1 | thunder_maul (1) | Your first damaging skill each fight Stuns. | set |  |  | Stormcaller |
| `flareFull` | 1 | Plague Flame (1) | Toxic Flare ignites all of the Poison, not half. | add |  |  | Pyre, Venom |
| `flatDR` | 4 | tower_shield (1), Thick Skin (2), Ser Calder (2), … | Every hit you take deals 1 less damage. | add |  | flat, scales with power |  |
| `goldDmg` | 1 | misers_ring (0.05) | +5% damage for every 10 gold you hold when a fight starts, up to +25%. | add |  |  |  |
| `goldPerWin` | 3 | misers_ring (1), gilded_coin (1), The House (1) | +1 gold after each win. | add |  |  |  |
| `healBlock` | 2 | templar_plate (0.3), Paladin (0.5) | Healing also gives Block equal to 30% of it. | add |  |  | Zealot, Bastion |
| `healDmg` | 1 | Last Rites (0.3) | Your healing also deals 30% of it as damage to the opponent. | add |  |  | Reaper, Zealot |
| `healOnBleed` | 3 | bloodstone_amulet (3), Blood Saint (3), Hedge Witch (1) | Heal 3 whenever you apply Bleed. | add |  |  | Bladedancer, Zealot |
| `healPct` | 3 | Zealot 2 (0.1), Demon Blood (-0.2), Fatebreaker (0.1) | Healing +10%. | add |  | rate | Zealot |
| `healPoison` | 1 | Plague Saint (3) | Each skill that heals you also applies 3 Poison. | add |  |  | Venom, Zealot |
| `heartOnWin` | 1 | Reaper 6 (1) | Each win restores 1 Heart. | set |  |  | Reaper |
| `hitBurn` | 2 | bellows (1), Cinderblade (1) | Multi-hit skills apply 1 Burn per hit. | add |  |  | Bladedancer, Pyre |
| `hitHeal` | 2 | pilgrim_mace (2), prayer_beads (1) | Heal 2 whenever a skill of yours deals damage. | add |  |  | Zealot |
| `hitMisf` | 1 | bent_horseshoe (1) | Hits apply 1 Misfortune. | add |  |  | Jinx |
| `ironOdds` | 1 | Iron Odds (1) | Block from a die skill showing 5 or 6 is doubled. | set |  |  | Gambler, Bastion |
| `jackpot` | 1 | Gambler 6 (0.5) | Jackpot: when two of your dice show the same number, both skills are 50% stronger. | set |  |  | Gambler |
| `jackpotPoison` | 1 | Poisoned Chalice (4) | Jackpots also apply 4 Poison. | add |  |  | Gambler, Venom |
| `jinxCheap` | 3 | Jinx 2 (1), unlucky_number (1), losers_greatcoat (1) | Jinxing costs 1 less Misfortune. | add |  |  | Jinx |
| `jinxDoom` | 1 | Bad End (1) | Doom goes off at once when you jinx a move. | set |  |  | Jinx, Reaper |
| `jinxFree` | 1 | Jinx 6 (1) | The first move you jinx each fight costs nothing and gives no Curse. | set |  |  | Jinx |
| `jinxHeal` | 1 | Small Mercies (0.05) | Jinxing a move heals you 5% of your max HP. | add |  |  | Jinx, Zealot |
| `jinxReroll` | 1 | Rigged Game (1) | When you jinx a move, reroll all your dice. | set |  |  | Jinx, Gambler |
| `lastWords` | 2 | templar_plate (0.15), Last Words (0.25) | Once per fight, dropping below 25% HP gives you Block equal to 15% of your max HP. | set |  |  |  |
| `lifesteal` | 6 | Reaper 4 (0.3), Undying (0.15), Vampirism (0.08), … | Heal 30% of the damage you deal. | add |  | rate | Reaper |
| `lowDR` | 3 | soul_lantern (0.15), gravecloth (0.15), Comeback Kid (0.2) | Below 25% HP, take 15% less damage. | set |  | rate |  |
| `lowHpDmg` | 2 | Berserker's Blood (0.3), The Goddess of Ruin (0.3) | Below half HP, deal 30% more damage. | add |  | rate |  |
| `lowLifesteal` | 2 | soul_lantern (0.25), gravecloth (0.1) | Below half HP, heal 25% of the damage you deal. | add |  |  | Reaper |
| `luckyCut` | 1 | Lucky Cut (1) | A critical hit from a die skill showing 6 hits once more. | set |  |  | Gambler, Bladedancer |
| `mighty` | 1 | Mighty Frame (0.1) | Reaper and Stormcaller skills deal 10% more. | set |  |  |  |
| `misfNoCleanse` | 1 | bad_water (5) | Poison on opponents with 5 or more Misfortune can't be cleansed. | set |  |  | Jinx, Venom |
| `multiWeaken` | 1 | Lightning Blade (1) | Multi-hit skills Weaken the opponent for 1 turn. | add |  |  | Bladedancer, Stormcaller |
| `omenPlus` | 3 | Jinx 4 (2), Doomsayer (3), black_cat_collar (1) | When an Omen fires, it adds 2 more Misfortune. | add |  |  | Jinx |
| `omenWeaken` | 2 | Doomsayer (2), crow_feather (2) | Omens also Weaken their target for 2 turns when they fire. | set |  |  | Jinx |
| `oneMisf` | 2 | unlucky_number (3), losers_greatcoat (2) | A die that rolls 1 adds 3 Misfortune to your opponent. | add |  |  | Jinx, Gambler |
| `overhealBlock` | 1 | Zealot 6 (1) | Overhealing becomes Block. | set |  |  | Zealot |
| `painLink` | 1 | pain_link (0.5) | Every hit is split evenly between both fighters. | set |  |  |  |
| `poisonHeal` | 4 | Blight Leech (0.3), grave_shroud (0.2), Plague Doctor (0.25), … | Heal 30% of Poison damage dealt (max 30% from all sources). | add |  |  | Venom |
| `poisonMisf` | 2 | bad_water (0.2), Evil Draught (0.5) | Poison deals 20% more to opponents with 5 or more Misfortune. | add |  |  | Jinx, Venom |
| `poisonMult` | 1 | Venom 6 (1.5) | Poison deals 50% more damage. | mul |  | rate | Venom |
| `poisonOnHit` | 1 | serpent_dagger (1) | Each skill that hits also applies 1 Poison. | add |  |  | Venom |
| `poisonPlus` | 6 | Venom 2 (1), Venom 4 (1), blight_kris (1), … | Poison you apply +1. | add |  | flat, scales with power | Venom |
| `quickBlock` | 3 | apprentice_staff (3), shuffling_shoe (3), Spellshield (5) | Quick skills also give 3 Block. | add |  |  | Arcanist, Bastion |
| `quickBurn` | 1 | Spellfire (3) | Quick skills apply 3 Burn. | add |  |  | Arcanist, Pyre |
| `quickCd` | 3 | Arcanist 2 (1), Spellblade (1), Mana Affinity (1) | Quick skills: 1 turn shorter cooldown. | add |  |  | Arcanist |
| `quickEvade` | 1 | Shadow Dancer (1) | Each Quick skill also lets you Evade the next attack. | add |  |  | Arcanist, Bladedancer |
| `quickFree` | 1 | hourglass (1) | Your first Quick skill each fight has no cooldown. | add |  |  | Arcanist |
| `quickHeal` | 2 | hourglass (3), Chronomancer (4) | Quick skills heal you 3. | add |  |  | Arcanist, Zealot |
| `quickMisf` | 1 | Hex Glyph (1) | Quick skills apply 1 Misfortune. | add |  |  | Jinx, Arcanist |
| `quickPoison` | 1 | Apothecary (2) | Quick skills apply 2 Poison. | add |  |  | Arcanist, Venom |
| `quickReroll` | 2 | shuffling_shoe (1), Card Trick (1) | Quick skills reroll your lowest die. | set |  |  | Gambler, Arcanist |
| `quickStun` | 1 | Tempest Mage (0.25) | Damaging Quick skills have a 25% chance to Stun. | add |  |  | Arcanist, Stormcaller |
| `quickTwice` | 1 | Arcanist 6 (1) | Quick skills cast twice. | set |  |  | Arcanist |
| `rakeReroll` | 1 | croupiers_rake (1) | After a Jackpot, gain 1 reroll. | add |  |  | Gambler |
| `reactHeal` | 1 | Dragon Blood (5) | Toxic Flare and Cauterise heal you 5. | set |  |  |  |
| `reactMult` | 2 | Catalyst (1.5), Alchemist (1.2) | Reactions are 50% stronger. | mul |  |  |  |
| `reapBlood` | 3 | Reaper 2 (0.15), Headsman (0.15), executioner_axe (0.1) | The first time you hit an opponent below half HP, heal 15% of your max HP. | set |  |  | Reaper |
| `reapPierce` | 1 | Reaper 2 (1) | Your hits ignore the Block of opponents below half HP. | set |  |  | Reaper |
| `regen` | 8 | Zealot 4 (2), Undying (3), pilgrim_mace (2), … | Heal 2 at the start of each of your turns. | add | yes | flat, scales with power | Zealot |
| `rerolls` | 6 | Gambler 4 (2), Card Counter (1), croupiers_rake (1), … | Start each fight with 2 rerolls. Tap Reroll, then a skill, to reroll its die. | add |  |  | Gambler |
| `savingGrace` | 1 | Saving Grace (1) | Healing from a die skill showing 6 is doubled. | set |  |  | Gambler, Zealot |
| `sixGold` | 2 | weighted_dice (1), gilded_coin (1) | +1 gold after each win where you rolled a 6. | add |  |  | Gambler |
| `sixStun` | 1 | Thunder Roll (1) | A die skill showing 6 also Stuns. | set |  |  | Gambler, Stormcaller |
| `sleeveFix` | 1 | sharps_sleeve (1) | Once per fight, a die that rolls 1 becomes a 6. | set |  |  | Gambler |
| `sluggish` | 1 | Sluggish (1) | Start every fight Weakened. | set |  |  |  |
| `startBlock` | 7 | spiked_buckler (6), chain_mail (8), Legion Deserter (15), … | Start each fight with 6 Block. | add | yes | flat, scales with power | Bastion |
| `startBlockPct` | 2 | Iron Body (0.1), trait Braced (0.15) | Start each fight with Block equal to 10% of your max HP. | add |  | rate | Bastion |
| `startCurse` | 1 | Ill-Starred (3) | Start each fight with 3 Curse. | add |  |  |  |
| `startMisf` | 4 | bent_horseshoe (2), black_cat_collar (3), Black Cat (2), … | Opponents start each fight with 2 Misfortune. | add |  |  | Jinx |
| `startPoison` | 1 | blight_kris (3) | Your opponent starts each fight with 3 Poison. | add |  |  | Venom |
| `stormBreak` | 1 | Stormcaller 2 (1) | Your Stuns and Interrupts add your STR to their damage and shatter Block. Stopping a big attack Empowers you for 2 turns. | set |  |  | Stormcaller |
| `stunBurn` | 1 | Wildstorm (5) | Your Stuns and Interrupts also apply 5 Burn. | add |  |  | Stormcaller, Pyre |
| `stunDmg` | 6 | Stormcaller 2 (16), Tempest (10), thunder_maul (6), … | Your Stuns and Interrupts deal 16 damage. | add | yes |  | Stormcaller |
| `stunEmpower` | 4 | Tempest (2), conductive_mail (1), storm_ring (1), … | Whenever you Stun or Interrupt, you are Empowered for 2 turns. | add |  |  | Stormcaller |
| `stunHeal` | 1 | Inquisitor (8) | Your Stuns and Interrupts heal you 8. | add |  |  | Stormcaller, Zealot |
| `stunMisf` | 2 | crow_feather (2), Ill Wind (3) | Stunned opponents gain 2 Misfortune. | add |  |  | Jinx, Stormcaller |
| `stunWeaken` | 3 | Stormcaller 4 (3), thunder_maul (1), verdict_hammer (1) | Your Stuns also Weaken for 3 turns. | set |  |  | Stormcaller |
| `suspend` | 1 | delay_engine (3) | Your hits are stored and all strike at once every 3rd turn, +50%. | set |  |  |  |
| `swapHp` | 1 | mirror_cuirass (0.3) | Once per fight below 30% HP, your HP and your opponent's trade places. | set |  |  |  |
| `swordSaint` | 1 | Sword Saint (1) | Your basic Attack becomes S-rank: far stronger, and it ignores Block. | set |  |  |  |
| `thornBurn` | 2 | Cinder Warden (4), Ember Wall (2) | Thorns also apply 4 Burn. | add |  | flat, scales with power | Bastion, Pyre |
| `thornMult` | 2 | Thornguard (2), Duelist (1.5) | Thorns and Riposte deal 100% more. | add |  | rate | Bastion, Bladedancer |
| `thornPoison` | 1 | Thornbark (2) | Thorns also apply 2 Poison. | add |  | flat, scales with power | Bastion, Venom |
| `thornsAlways` | 5 | Bastion 4 (4), chain_mail (2), crown_of_thorns (3), … | Always have 4 Thorns, doubled below half HP. | add | yes | flat, scales with power | Bastion |
| `vsBigger` | 1 | Giant Slayer (0.15) | +15% damage to opponents with more max HP than you. | add |  |  |  |
| `vsDisabled` | 2 | verdict_hammer (0.2), Warlord (0.25) | +20% damage to Stunned or Weakened opponents. | add |  |  | Reaper, Stormcaller |
| `vsHalf` | 1 | Reaper 2 (0.35) | Opponents below half HP take 35% more damage from you. | add |  | rate | Reaper |
| `vsHard` | 1 | Underdog (0.1) | +10% damage to hard opponents. | add |  |  |  |
| `vsHigherRank` | 1 | Rank Is Just a Letter (0.1) | +10% damage to opponents of a higher rank than you. | add |  |  |  |
| `weakPoison` | 1 | Hexblade (3) | Weaken you apply also applies 3 Poison. | add |  |  | Stormcaller, Venom |

### Enemy traits (fields on the enemy, or in its phase's set)

| Key | Used | Examples (value) |
| --- | --- | --- |
| `adapt` | 1 | Kaito Ren (0.6) |
| `aura` | 2 | Emperor Kharros the Ashen (0.7), trait Smouldering (1.5) |
| `briar` | 2 | The Thorn Mother (1), trait Barbed (1) |
| `dodge` | 3 | Lyss of the Thorn (0.05), trait Elusive (0.12), trait Cl̷ipping (0.25) |
| `enrage` | 3 | Grukk the Unbroken (0.5), Emperor Kharros the Ashen (0.5), trait Frenzied (0.5) |
| `enrageMult` | 3 | Grukk the Unbroken (1.5), Emperor Kharros the Ashen (1.25), trait Frenzied (1.4) |
| `flood` | 1 | The Leviathan Queen (3) |
| `forge` | 1 | The Forge King (3) |
| `hexer` | 1 | Mott the Unlucky (1) |
| `jinxTax` | 1 | The Hanged Augur (2) |
| `revive` | 2 | The Bone Saint (0.3), trait Repl̷icated (0.3) |
| `showNext` | 1 | The Hanged Augur (1) |
| `twincast` | 2 | The Archmage Who Fell Upward (3), trait Desy̷nced (3) |

### The grid, from `js/content/archetypes.js`

Each archetype is a theme in one cell of a fixed grid: a stat and a Discipline (Ward: Stops the hit and gives it back. Mend: Outlasts: heals, drains, recovers. Bane: Hurts over time and weakens. Sway: Controls the turn: first, twice, or not at all. Might: Hits hardest and finishes it.). Archetypes sharing a stat or a Discipline are allies; a piece of content carries one archetype, or two allies. Owns: the skill effects it owns, which it and its allies may use (`dmg` and `block` are open to all). Passive effects say their own theme in `effects.js`.

| Archetype | Stat | Discipline | Line | Owns | Allies | Words |
| --- | --- | --- | --- | --- | --- | --- |
| Pyre | INT | Bane | Sets a fire and lets it finish the work. | `burn` `detonate` | Venom, Jinx, Arcanist | ember, ash, flame, cinder, blaze, smoke |
| Venom | AGI | Bane | Patient and certain: every turn makes it worse. | `poison` `doublePoison` `malice` `leech` `weaken` `drainPoison` | Pyre, Jinx, Bladedancer | fang, rot, drip, plague, patience, thorn |
| Bladedancer | AGI | Might | Never stops moving: a hundred cuts beat one. | `bleed` `hits` `perHit` `mark` `critBonus` `cruel` `riposte` `evade` `alwaysCrit` `nextCrit` | Reaper, Venom | edge, dance, cut, flurry, quick, step |
| Bastion | VIT | Ward | Takes the hit, then gives it back. | `thorns` `blockDmg` `riposte` `keep` `reflect` | Zealot | wall, iron, shield, anvil, stand, weight |
| Arcanist | INT | Sway | Does more in a turn than anyone should. | `focus` `pierce` `siphon` `haste` `evade` `interrupt` `hits` `mirror` | Stormcaller, Gambler, Pyre | glyph, mind, spell, time, trick, sky |
| Zealot | VIT | Mend | Outlasts everything: what cannot be killed cannot lose. | `heal` `healMissing` `regen` `cleanse` | Bastion | light, prayer, vow, saint, tide, undying |
| Reaper | STR | Might | Ends fights: the wounded have already lost. | `execute` `execMult` `momentum` `doom` `doomT` `lifesteal` `selfDmg` `leech` `empower` | Bladedancer, Stormcaller | scythe, grave, harvest, end, hollow, bone |
| Stormcaller | STR | Sway | Breaks the enemy's plan before it lands. | `stun` `stunIfWeak` `interrupt` `weaken` `empower` | Arcanist, Gambler, Reaper | thunder, lightning, crack, break, sky, gale |
| Gambler | LUK | Sway | Makes its own luck, then bets all of it. | `die` `dmgPip` `blockPip` `healPip` `dieMin` `dbl` `snake` `boxcars` `bust` `bustAt` `dmgAll` `cashOut` `progressive` `reroll` `setSix` `rollTwice` `mark` `dieStun` | Arcanist, Stormcaller, Jinx | dice, coin, card, odds, stake, jackpot |
| Jinx | LUK | Bane | Everything goes wrong, for them. The rest it carries. | `misf` `misfT` `omenAtk` `omenGuard` `jinxDisc` `uncurse` `passCurse` `curseDmg` `curseKeep` `perMisf` `perCurse` `killReset` `coinStun` `calamity` `keepHalf` `augury` `portent` `misfPerBurn` | Pyre, Venom, Gambler | crow, omen, mirror, curse, ladder, thirteen |

### Enemy move roles and tier numbers, from `js/content/moves.js`

A move's role is read from its effects (`moveRole`). A big hit is one of at least the tier's BIG_HIT damage before the round's scaling. Numbers are ranges the checker warns outside of; the balance gate has the last word.

| Tier | Who | HP | Strike | Big hit (from) | Guard Block | Damage per turn | Needs |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | arena beasts, rounds 1 to 3 | 36 to 60 | 3 to 12 | 18 to 26 (18) | 5 to 10 | 3 to 10 | damage |
| 2 | rivals and the Proctor, rounds 4 to 7 | 50 to 80 | 5 to 14 | 16 to 22 (16) | 6 to 14 | 2 to 11 | damage |
| 3 | Final Champions | 80 to 110 | 4 to 13 | 14 to 24 (14) | 10 to 14 | 4 to 11 | damage, big or sustain|trait |
| 4 | the Elite bracket | 140 to 200 | 6 to 18 | 20 to 28 (20) | 14 to 18 | 7 to 15 | damage, big or sustain|trait |

| Role | Meaning | Used by |
| --- | --- | --- |
| strike | a plain hit | 28 moves |
| big | a big hit, the one to Block or Stun | 13 moves |
| guard | Block and nothing else | 18 moves |
| setup | a status, buff or trick with little damage | 19 moves |
| sustain | healing or draining | 5 moves |

### Outcomes (`then`, `reward`), from `js/content/outcomes.js`

What an event option, a quest or a wager can give. Applied in this order; one marked late is announced after everything else.

| Key | Example | Shown to players as | Late | Used by |
| --- | --- | --- | --- | --- |
| `gold` | 8 | 8 gold |  | 39 (quests, levels, events) |
| `stats` | {"VIT":2} | VIT +2 |  | 7 (events) |
| `heart` | 1 | +1 max Heart |  | 10 (quests, levels, events) |
| `rune` | 1 | a rune |  | 8 (quests, levels, events) |
| `piece` | "B" | a free B-rank piece |  | 23 (quests, levels, events) |
| `experimental` | 1 | an Experimental item |  | 2 (levels, events) |
| `next` | {"bribe":true} | a mark on your next fight |  | 20 (events) |
| `foe` | {"weaken":2} | a mark on your next opponent |  | 13 (levels, events) |
| `heal` | 0.5 | 50% of max HP healed |  | 1 (levels) |
| `max_hp` | -0.1 | −10% max HP |  | 6 (events) |
| `restore` | 1 | 1 Heart restored |  | 9 (levels, events) |
| `erase` | 1 | 1 Heart erased |  | 6 (events) |
| `stakes` | {"win":{"gold":10}} | stakes on your next fight |  | 7 (levels, events) |
| `respec` | true | your stat points to place again |  | 1 (events) |
| `summon` | {"who":"copy"} | a visitor in your bracket |  | 6 (events) |
| `amend` | "sudden" | the Amendment Sudden Death |  | 4 (events) |
| `ward` | 1 | a ward on your next loss |  | 11 (levels, events) |
| `mod` | "none" | the world modifier Standard Rules |  | 2 (events) |
| `always` | {"foe":{"poison":2}} | a mark on every fight from now on |  | 4 (events) |
| `fate` | 1 | your world's Fate eased | yes | 56 (events) |
| `notice` | 1 | the System's notice | yes | 56 (levels, events) |
| `chain` | "done" | the story goes on | yes | 33 (events) |
| `favour` | {"war":2} | 2 Favour with the God of War | yes | 10 (quests, events) |

### Feats (`feat`), from `js/content/feats.js`

What wagers, Rank Trial conditions, Titles and quests can ask for. Measured: when it is checked (win: a won fight; fight: any fight). Usual: the amount asked for unless the Title or quest says another (`n`). Unfair for: archetypes it is never asked of.

| Key | Measured | Shown to players as | Usual | Counts up | Unfair for | Asked by |
| --- | --- | --- | --- | --- | --- | --- |
| `bankrupt` | shop | Leave the shop with 0 gold |  |  |  | quest h_bankrupt |
| `bighit` | fight | Land a single hit of 60 or more | 60 |  |  | Title Executioner |
| `chances` | chance | Win 3 chance rolls in one run | 3 |  |  | Title Lucky Seven |
| `clutch` | win | Win with 10% HP or less |  |  |  | Title Comeback Kid, quest h_clutch |
| `collector` | merge | Own three ★2 pieces at once | 3 |  |  | quest h_collector |
| `fast` | win | Win within 6 turns | 6 |  |  | wager, Title First Blood, quest fast3 |
| `fatelifted` | win | Beat the Final Champion with your world's Fate lifted |  |  |  | Title Fatebreaker |
| `giant` | win | Beat an opponent with at least twice your max HP |  |  |  | Title Giant Slayer |
| `hard` | win | Beat a hard opponent |  |  |  | Title Underdog, quest hard2 |
| `healed` | fight | Heal 60 HP in a single fight | 60 |  |  | Title Bloodthirsty |
| `healthy` | win | Win with more than half your HP |  |  |  | wager |
| `jinxes` | fight | Jinx 3 moves in a single fight | 3 |  |  | Title Black Cat |
| `masked` | win | Defeat the Masked Entrant |  |  |  | Title Mirror Breaker |
| `merge` | merge | Merge pieces |  |  |  | quest merge4 |
| `noheal` | win | Win without healing |  |  | Zealot | wager, quest rival_noheal |
| `outranked` | win | Beat an opponent 2 rank letters above your Entrant Rank | 2 |  |  | Title Rank Is Just a Letter |
| `overkill` | win | Finish an opponent with 30 more damage than needed | 30 |  |  | quest h_overkill |
| `path` | path | Have the System recognise your path by round 5 | 5 |  |  | quest path5 |
| `quick` | fight | Use 3 Quick skills in a single turn | 3 |  |  | Title Spellweaver |
| `react` | fight | Trigger 2 reactions | 2 | yes |  | wager, Title Alchemist, quest react6 |
| `rival` | win | Defeat a rival |  |  |  | quest rival_noheal |
| `stop` | win | Stun or Interrupt the opponent's big move |  |  |  | wager |
| `stuns` | fight | Stun or Interrupt one opponent 3 times | 3 |  |  | quest h_stun3 |
| `untouched` | win | Win without losing any HP |  |  |  | Title Untouched |
| `wagers` | wager | Win 3 wagers in one run | 3 |  |  | Title High Roller |
<!-- effects:end -->
