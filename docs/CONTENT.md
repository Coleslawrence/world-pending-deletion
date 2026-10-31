# Adding content

All of the game's content lives in `js/content/`: the effect registry (`effects.js`), the feat list (`feats.js`), archetypes, skills, gear, gods, world packs, enemies, Undercity events and chains, Gifts, Titles, quests and Hidden Paths. Wagers, districts and runes are still in `js/core.js`.

## Where things go

| To add | Edit |
| --- | --- |
| A skill | `js/content/skills/<archetype>.js`: one `sk()` line with its two ★3 evolutions |
| Gear | `js/content/gear.js` |
| An archetype | `js/content/archetypes.js` (the entry, the wheel), its skills file, a colour in `css/style.css`, a Hidden Path for every pair, `STAT_INFO` in `base.js` |
| A world type | A new pack in `js/content/worlds/` (the world, its World Record pool, its Final Champion's greeting), plus its Final Champion in `enemies.js`, its World Gift in `gifts.js` and its world-first Title in `titles.js` and `FINAL_TITLE` |
| A god | `js/content/gods.js` (its archetypes, blessing and rival reply line) and a `chosen_<id>` divine Gift in `gifts.js` |
| An enemy | `js/content/enemies.js`, and `MONSTERS` or `RIVALS`. Boss mechanics are fields from the enemy mechanics list below |
| A trait monsters and rivals can roll | `js/content/traits.js` |
| An Undercity event | `js/content/events/undercity.js` |
| An event chain | A new file in `js/content/events/`: its `CHAINS` entry and one event per step. The format is described at the top of `js/content/events.js` |
| A Gift, Title, quest or Hidden Path | `gifts.js`, `titles.js`, `quests.js`, `paths.js`. A Gift or Title's fight effect is its `p`, from `effects.js`. A Title is earned for, and a quest asks for, a `feat` from `feats.js` |
| A wager or Trial condition | `WAGER_FEATS` in `js/core.js`: the feats a god will bet on |
| A new feat (a measured deed) | `js/content/feats.js`: when it is measured, its words, and how it is checked against the fight tally |
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
- **World Record pools only grow at the end.** Runs store pool positions, so never reorder, edit or delete an entry, a role or a promise.
- **Event options keep their places.** Run summaries store the option picked by its position, so add new options at the end and never remove one.
- **Event outcomes are data where they can be.** `pay`, and `then` (gold, stats, next-fight flags, the chain's next step, Favour) cover most options. Anything else goes in `go(run, h)`, which reaches the rules only through the helpers in `h`.
- **Effects come from the menu below.** New content that only uses effects already listed is data. A new effect is a mechanic: it needs code in `js/core.js`, a line in the bot's scoring (`tools/bot.js`, `choosePlayer`) and its own pull request.
- **Passive effects live in `js/content/effects.js`.** Archetype bonuses, gear, Hidden Paths, Gifts, Titles, Rank perks, stat milestones, god blessings and enemy passives all say what they do as `{ key: value }` from it. Each entry has the phrase players read, so a description says what the effect says. Where an effect has a rule players couldn't guess from its number (Thorns double below half HP), its `must` makes the checker fail any description that leaves the rule out.
- **Feats live in `js/content/feats.js`.** A deed the player can be asked for (win within 6 turns, trigger 2 reactions, defeat a rival without healing) is declared once as a feat, and wagers, Rank Trial conditions, Titles and quests all ask for it by key, so it is measured the same way everywhere. A feat that an archetype's kit can't meet says so (`unfairFor`), and one that needs a tool says which (`needs`). The checker makes a Title's or quest's words say what counts (`must`).
- **Every choice can be picked.** An event always keeps one option with no condition and no cost. Options the player can't take are left out, never shown greyed out.
- **Choices are actions.** A cost is shown only when paying is the action itself ("Pay 6 gold"). Every other consequence is revealed after the pick, as a System line in [brackets].
- **Player text follows the style guide:** British spelling, no em-dashes, one name for one thing, and the length limits for one phone screen.

## Checks

Every pull request runs these (`.github/workflows/checks.yml`):

| Check | Run it yourself | Fails when |
| --- | --- | --- |
| Content checker | `node tools/check-content.js` | A content file isn't loaded or uses `core.js`; an id is removed; a World Record pool is reordered; a field is unknown or missing; a reference points at nothing; an effect key isn't one the engine reads; an event could show no options, hides a cost, or loses an option; text breaks the style guide; two things share a name |
| Smoke sim | `node tools/stats.js 200 --seed 1`, `node tools/daily.js 2026-11-01`, `node tools/record.js` | The game crashes in play, or Pending World or the World Record checks break |
| Balance gate | `node tools/balance-gate.js BASE_DIR .` | The overall spared rate moves more than 3 points, or any archetype as the bot's main moves more than 6. Label the pull request `balance-change` when moving the numbers is the point: the gate then only reports |

After merging content into dev or main, run `node tools/content-index.js --out <project files>/lore/content-index.md`: it rewrites the lore bible's index of every name, what it belongs to and the release it shipped in.

After adding content, run `node tools/check-content.js --write`. It records the new ids in `tools/content-ids.json` and rewrites the effect lists below. Commit both.

## Archetypes and the wheel

`WHEEL` in `archetypes.js` sets the order of the archetype wheel: an archetype's allies are its neighbours on it. A new archetype goes into the wheel where it should sit, and the wheel grows with it.

## Enemy traits, passives and phases

An enemy is its moves (`skills`, each a name `n` and the same `fx` keys as player skills), the order it uses them (`script`, looping), and any of these. A new boss mixes them; a trait that doesn't exist yet is a mechanic and gets its own pull request first.

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
| `bleed` | 12 | Lacerate (5), Thousand Cuts (1), Scorching Cut (2), … | Apply 5 Bleed. | yes |
| `block` | 43 | Ember Ward (8), Iron Guard (9), Shield Bash (6), … | Gain 8 Block. | yes |
| `blockDmg` | 7 | Smite (0.5), Bulwark Slam (1.2), Judgement (1), … | Plus damage equal to 50% of your Block. | yes |
| `burn` | 25 | Firebolt (4), Ember Ward (4), Flame Wave (2), … | Apply 4 Burn. | yes |
| `cleanse` | 14 | Unbreakable (1), Purify (1), Miracle (1), … | Remove your Burn, Poison, Bleed and Weaken. | yes |
| `critBonus` | 1 | Precise Strike (0.5) | +50% critical chance. | no |
| `cruel` | 3 | Assassinate (2), Death Blossom (2), Coup de Grace (2.5) | ×2 damage if the opponent has 2 or more effects. | yes |
| `detonate` | 3 | Ignite (2), Combust (3), Wildfire (2) | Deal 2× the opponent's Burn as damage, then remove it. Ignores Block. | yes |
| `dmg` | 147 | Firebolt (7), Flame Wave (4), Scorch (5), … | Deal 7 damage. | yes |
| `doom` | 3 | Doom (26), Swift Doom (22), Inevitable Doom (40) | Doom: after 3 of the opponent's turns, they take 26 damage. | yes |
| `doomT` | 1 | Swift Doom (2) | (works with other keys on the same skill) | no |
| `doublePoison` | 4 | Thousand Needles (1), Venom Storm (1), Needle Rain (1), … | (works with other keys on the same skill) | no |
| `drainPoison` | 1 | Wither (1) | Heal equal to the opponent's Poison. | no |
| `empower` | 6 | War Cry (2), Spell Theft (2), Rally (1), … | Deal 30% more damage for 2 turns. | yes |
| `evade` | 5 | Smoke Bomb (1), Vanish (2), Caltrops (1), … | Evade the next attack. | yes |
| `execMult` | 6 | Execute (2.5), Soul Harvest (2), Decapitate (3), … | (works with other keys on the same skill) | yes |
| `execute` | 6 | Execute (0.3), Soul Harvest (0.3), Decapitate (0.3), … | (works with other keys on the same skill) | yes |
| `focus` | 3 | Focus (0.6), Deep Focus (1), Spellweave (0.5) | Your next damaging skill deals 60% more. | yes |
| `haste` | 4 | Time Warp (2), Spellweave (1), Haste (3), … | Your other cooldowns drop by 2. | yes |
| `heal` | 16 | Sacred Flame (8), Penance (2), Holy Light (10), … | Heal 8. | yes |
| `healMissing` | 6 | Second Wind (0.25), Miracle (0.5), Last Breath (0.4), … | Heal 25% of your missing HP. | yes |
| `hits` | 36 | Flame Wave (2), Quick Slash (2), Fan of Knives (4), … | (works with other keys on the same skill) | yes |
| `interrupt` | 3 | Counterspell (1), Nullify (1), Spell Theft (1) | Interrupt: cancel the opponent's next move and put it on cooldown. | yes |
| `keep` | 1 | Wildfire (1) | (works with other keys on the same skill) | no |
| `leech` | 3 | Leech (3), Blood Leech (6), Parasite (3) | Leech: for 4 turns, drain 3 HP from the opponent each turn. | yes |
| `lifesteal` | 9 | Drain Life (0.5), Soul Harvest (0.6), Soul Drain (0.6), … | Heal 50% of the damage dealt. | no |
| `malice` | 3 | Malice (3), Spite (5), Torment (3) | +3 for each effect on the opponent. | yes |
| `mark` | 3 | Mark Prey (2), Hunter's Mark (3), Deadly Mark (2) | Mark the opponent: they take 30% more damage for 2 turns. | yes |
| `mirror` | 1 | The Masked Entrant: Mirror Form (1) | (works with other keys on the same skill) | no |
| `momentum` | 3 | Momentum (4), Unstoppable (7), Avalanche (3) | +4 damage for each turn in a row you've used a damaging skill. | yes |
| `nextCrit` | 1 | Deadly Mark (1) | Your next hit is a critical. | no |
| `perHit` | 12 | Flame Wave (1), Thousand Cuts (1), Fire Rain (1), … | (works with other keys on the same skill) | no |
| `pierce` | 7 | Arcane Missiles (1), Arcane Cataclysm (1), Heartseeker (1), … | Ignores Block. | no |
| `poison` | 22 | Pandemic (6), Venom Blade (2), Hex (2), … | Apply 6 Poison. | yes |
| `reflect` | 1 | Reversal (1) | (works with other keys on the same skill) | no |
| `regen` | 3 | Consecrate (4), Hallowed Ground (7), Holy Fire (4) | Heal 4 at the start of your next 3 turns. | yes |
| `riposte` | 3 | Riposte (1.5), Perfect Riposte (2.5), Parry Master (1.5) | Until your next turn, damage you block is dealt back ×1.5. | yes |
| `selfDmg` | 2 | Berserk (3), Blood Rage (4) | Costs 3 HP. | no |
| `siphon` | 3 | Siphon (1), Soul Siphon (1), Hex Siphon (1) | Steal the opponent's Block and remove their Power. | yes |
| `stun` | 9 | Thunderclap (1), Thunder God's Wrath (1), Stunning Bash (1), … | Stun: the opponent loses their next turn, and the move they were about to use goes on cooldown. | yes |
| `stunIfWeak` | 4 | Overload (1), Jolt (1), Supercharge (1), … | If the opponent is Weakened, Stun them. | yes |
| `thorns` | 7 | Retribution (8), Blazing Aegis (6), Spiked Guard (5), … | Until your next turn, hit back for 8 when struck. | yes |
| `weaken` | 24 | Hex (2), Frost Lance (2), Static Jab (1), … | Weaken the opponent for 2 turns. | yes |

### Passive effects (`p`), from `js/content/effects.js`

Used by archetype bonuses (`p`), gear (`pas` scales with stars, `fix` does not), Hidden Paths (`fx`), Gifts and Titles (`p`), Rank perks and stat milestones (`p`), god blessings (`bless`, at 8 Favour) and enemies (`passives`, only the ones marked for enemies). Combines: how values from several sources add up. Grows: grows with your level when it comes from gear or an archetype bonus.

| Key | Used | Examples (value) | Shown to players as | Combines | Grows | Enemies | Theme |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `afterQuick` | 2 | apprentice_staff (0.25), Spellweaver (0.1) | After a Quick skill, your next skill deals 25% more. | add |  |  | Arcanist |
| `arcCd` | 1 | Arcanist 2 (8) | Your other skills: 1 turn shorter cooldown for every 8 INT (minimum 1). | set |  |  | Arcanist |
| `bleedHeal` | 1 | Butcher (0.5) | Heal 50% of the Bleed damage your opponent takes. | add |  |  | Bladedancer, Reaper |
| `bleedMult` | 1 | Bladedancer 6 (2) | Bleed deals double damage. | set |  | rate | Bladedancer |
| `bleedPlus` | 4 | Bladedancer 4 (2), Elf-touched (1), Thornbane (1), … | Bleed you apply +2. | add |  | flat, scales with power | Bladedancer |
| `bleedPoison` | 1 | Viper Dance (2) | Every Bleed you apply also applies 2 Poison. | add |  |  | Bladedancer, Venom |
| `blockDmgPct` | 1 | Juggernaut (1) | Deal 1% more damage for every 2 Block you have (up to 40%). | add |  |  | Bastion, Reaper |
| `blockKeep` | 2 | Bastion 2 (0.25), tower_shield (0.3) | Keep 25% of your Block between turns. | add |  | rate | Bastion |
| `blockStrike` | 1 | Bastion 6 (0.5) | Gaining Block also deals 50% of it as damage. | set |  |  | Bastion |
| `blockStun` | 1 | Thunder Wall (0.25) | When your Block absorbs a hit, 25% chance to Stun the attacker. | add |  |  | Bastion, Stormcaller |
| `blockThorns` | 1 | spiked_buckler (0.3) | Gaining Block also gives Thorns equal to 30% of it. | add |  |  | Bastion |
| `burnExec` | 1 | Funeral Pyre (0.25) | +25% damage to Burning opponents below half HP. | add |  |  | Pyre, Reaper |
| `burnFade` | 3 | Pyre 2 (0.15), Pyre 6 (0), Hedge Witch (0.2) | Burn on the opponent fades slower (15% a turn, not 30%). | min |  |  | Pyre |
| `burnHeal` | 2 | cinder_robe (0.3), Sunpriest (0.3) | Heal 30% of the Burn damage your opponent takes. | add |  |  | Pyre, Zealot |
| `burnPlus` | 4 | Pyre 4 (4), ember_gauntlets (2), Emberfall (1), … | Burn you apply +4. | add |  | flat, scales with power | Pyre |
| `burnPoison` | 1 | plague_censer (2) | Whenever you apply Burn, also apply 2 Poison. | add |  |  | Pyre, Venom |
| `copycat` | 1 | Copycat (1) | Once per fight, use the opponent's last move as your own. | set |  |  |  |
| `critBonus` | 5 | duelist_rapier (0.1), Lucky Star (0.1), Mirror Breaker (0.08), … | +10% critical chance. | add |  |  |  |
| `critMult` | 1 | Executioner (1.75) | Critical hits deal ×1.75 instead of ×1.5. | set |  |  |  |
| `dmgPct` | 6 | Glass Cannon (0.3), Demon Blood (0.15), Ascendant (0.05), … | All your damage +30%. | add |  | rate |  |
| `dodge` | 4 | shadow_leathers (0.06), Elf-touched (0.1), Skyfall (0.05), … | +6% dodge. | add |  |  |  |
| `doomFaster` | 1 | Reaper 6 (1) | Doom lands a turn sooner. | set |  |  | Reaper |
| `doomLeech` | 1 | Soul Weaver (0.4) | Doom and Leech you apply are 40% stronger. | add |  |  | Reaper, Arcanist |
| `dotPlus` | 1 | The Trickster (2) | Burn, Poison and Bleed you apply +2. | add |  | flat, scales with power |  |
| `every3Stun` | 1 | Stormcaller 6 (1) | Every 3rd skill you use Stuns. | set |  |  | Stormcaller |
| `execBonus` | 1 | executioner_axe (0.4) | +40% damage to opponents below 30% HP. | add |  |  | Reaper |
| `extraHit` | 1 | Bladedancer 2 (1) | Multi-hit skills hit once more. | set |  |  | Bladedancer |
| `firstCrit` | 1 | duelist_rapier (1) | Your first hit each fight is critical. | set |  |  |  |
| `firstEvade` | 2 | shadow_leathers (1), Afterimage (1) | Evade the first attack each fight. | set |  |  |  |
| `firstFree` | 1 | Arcanist 4 (1) | Your first skill each fight has no cooldown. | set |  |  | Arcanist |
| `firstHit` | 3 | First Strike (1), First Blood (0.5), Arcane Mind (0.3) | Your first damaging skill each fight deals double. | add |  |  |  |
| `firstStun` | 1 | thunder_maul (1) | Your first damaging skill each fight Stuns. | set |  |  | Stormcaller |
| `flareFull` | 1 | Plague Flame (1) | Toxic Flare ignites all of the Poison, not half. | add |  |  | Pyre, Venom |
| `flatDR` | 3 | Thick Skin (2), Ser Calder (2), trait Armoured (2) | Every hit you take deals 2 less damage. | add |  | flat, scales with power |  |
| `goldDmg` | 1 | misers_ring (0.05) | +5% damage for every 10 gold you hold when a fight starts, up to +25%. | add |  |  |  |
| `healBlock` | 2 | templar_plate (0.3), Paladin (0.5) | Healing also gives Block equal to 30% of it. | add |  |  | Zealot, Bastion |
| `healDmg` | 1 | Last Rites (0.3) | Your healing also deals 30% of it as damage to the opponent. | add |  |  | Reaper, Zealot |
| `healOnBleed` | 2 | bloodstone_amulet (3), Blood Saint (3) | Heal 3 whenever you apply Bleed. | add |  |  | Bladedancer, Zealot |
| `healPct` | 2 | Zealot 2 (0.1), Demon Blood (-0.2) | Healing +10%. | add |  | rate | Zealot |
| `healPoison` | 1 | Plague Saint (3) | Each skill that heals you also applies 3 Poison. | add |  |  | Venom, Zealot |
| `heartOnWin` | 1 | Reaper 6 (1) | Each win restores 1 Heart. | set |  |  | Reaper |
| `hitBurn` | 1 | Cinderblade (1) | Multi-hit skills apply 1 Burn per hit. | add |  |  | Bladedancer, Pyre |
| `hitHeal` | 1 | pilgrim_mace (2) | Heal 2 whenever a skill of yours deals damage. | add |  |  | Zealot |
| `lastWords` | 1 | Last Words (0.25) | Once per fight, dropping below 25% HP gives you Block equal to 25% of your max HP. | set |  |  |  |
| `lifesteal` | 4 | Reaper 4 (0.2), Vampirism (0.08), Bloodthirsty (0.05), … | Heal 20% of the damage you deal. | add |  | rate | Reaper |
| `lowDR` | 1 | Comeback Kid (0.2) | Below 25% HP, take 20% less damage. | set |  | rate |  |
| `lowHpDmg` | 2 | Berserker's Blood (0.3), The Goddess of Ruin (0.3) | Below half HP, deal 30% more damage. | add |  | rate |  |
| `lowLifesteal` | 1 | soul_lantern (0.25) | Below half HP, heal 25% of the damage you deal. | add |  |  | Reaper |
| `mighty` | 1 | Mighty Frame (0.1) | Reaper and Stormcaller skills deal 10% more. | set |  |  |  |
| `multiWeaken` | 1 | Lightning Blade (1) | Multi-hit skills Weaken the opponent for 1 turn. | add |  |  | Bladedancer, Stormcaller |
| `overhealBlock` | 1 | Zealot 6 (1) | Overhealing becomes Block. | set |  |  | Zealot |
| `poisonHeal` | 3 | grave_shroud (0.2), Plague Doctor (0.25), Grave Warden (0.3) | Heal 20% of Poison damage dealt (max 30% from all sources). | add |  |  | Venom |
| `poisonMult` | 2 | Venom 6 (1.5), Hedge Witch (1.25) | Poison deals 50% more damage. | mul |  | rate | Venom |
| `poisonOnHit` | 1 | serpent_dagger (1) | Each skill that hits also applies 1 Poison. | add |  |  | Venom |
| `poisonPlus` | 4 | Venom 2 (1), Venom 4 (1), Bonebreaker (1), … | Poison you apply +1. | add |  | flat, scales with power | Venom |
| `quickBlock` | 1 | Spellshield (5) | Quick skills also give 5 Block. | add |  |  | Arcanist, Bastion |
| `quickBurn` | 1 | Spellfire (3) | Quick skills apply 3 Burn. | add |  |  | Arcanist, Pyre |
| `quickCd` | 2 | Arcanist 2 (1), Mana Affinity (1) | Quick skills: 1 turn shorter cooldown. | add |  |  | Arcanist |
| `quickEvade` | 1 | Shadow Dancer (1) | Each Quick skill also lets you Evade the next attack. | add |  |  | Arcanist, Bladedancer |
| `quickFree` | 1 | hourglass (1) | Your first Quick skill each fight has no cooldown. | add |  |  | Arcanist |
| `quickHeal` | 1 | Chronomancer (4) | Quick skills heal you 4. | add |  |  | Arcanist, Zealot |
| `quickPoison` | 1 | Apothecary (2) | Quick skills apply 2 Poison. | add |  |  | Arcanist, Venom |
| `quickStun` | 1 | Tempest Mage (0.25) | Damaging Quick skills have a 25% chance to Stun. | add |  |  | Arcanist, Stormcaller |
| `quickTwice` | 1 | Arcanist 6 (1) | Quick skills cast twice. | set |  |  | Arcanist |
| `reactHeal` | 1 | Dragon Blood (5) | Toxic Flare and Cauterise heal you 5. | set |  |  |  |
| `reactMult` | 2 | Catalyst (1.5), Alchemist (1.2) | Reactions are 50% stronger. | mul |  |  |  |
| `reapBlood` | 1 | Reaper 2 (0.15) | The first time you hit an opponent below half HP, heal 15% of your max HP. | set |  |  | Reaper |
| `reapPierce` | 1 | Reaper 2 (1) | Your hits ignore the Block of opponents below half HP. | set |  |  | Reaper |
| `regen` | 6 | Zealot 4 (2), prayer_beads (3), Tidecaller (2), … | Heal 2 at the start of each of your turns. | add | yes | flat, scales with power | Zealot |
| `sluggish` | 1 | Sluggish (1) | Start every fight Weakened. | set |  |  |  |
| `startBlock` | 6 | chain_mail (8), Legion Deserter (15), Untouched (8), … | Start each fight with 8 Block. | add | yes | flat, scales with power | Bastion |
| `startBlockPct` | 2 | Iron Body (0.1), trait Braced (0.15) | Start each fight with Block equal to 10% of your max HP. | add |  | rate | Bastion |
| `startPoison` | 1 | blight_kris (3) | Your opponent starts each fight with 3 Poison. | add |  |  | Venom |
| `stormBreak` | 1 | Stormcaller 2 (1) | Your Stuns and Interrupts add your STR to their damage and shatter Block. Stopping a big attack Empowers you for 2 turns. | set |  |  | Stormcaller |
| `stunBurn` | 1 | Wildstorm (5) | Your Stuns and Interrupts also apply 5 Burn. | add |  |  | Stormcaller, Pyre |
| `stunDmg` | 3 | Stormcaller 2 (12), thunder_maul (6), storm_ring (10) | Your Stuns and Interrupts deal 12 damage. | add | yes |  | Stormcaller |
| `stunEmpower` | 1 | conductive_mail (1) | Whenever you Stun or Interrupt, you are Empowered for 1 turn. | add |  |  | Stormcaller |
| `stunHeal` | 1 | Inquisitor (8) | Your Stuns and Interrupts heal you 8. | add |  |  | Stormcaller, Zealot |
| `stunWeaken` | 1 | Stormcaller 4 (2) | Your Stuns also Weaken for 2 turns. | set |  |  | Stormcaller |
| `swordSaint` | 1 | Sword Saint (1) | Your basic Attack becomes S-rank: far stronger, and it ignores Block. | set |  |  |  |
| `thornBurn` | 1 | Ember Wall (2) | Thorns also apply 2 Burn. | add |  | flat, scales with power | Bastion, Pyre |
| `thornMult` | 1 | Duelist (1.5) | Thorns and Riposte deal 50% more. | add |  | rate | Bastion, Bladedancer |
| `thornPoison` | 1 | Thornbark (2) | Thorns also apply 2 Poison. | add |  | flat, scales with power | Bastion, Venom |
| `thornsAlways` | 4 | Bastion 4 (4), crown_of_thorns (3), Forgebreaker (2), … | Always have 4 Thorns, doubled below half HP. | add | yes | flat, scales with power | Bastion |
| `vsBigger` | 1 | Giant Slayer (0.15) | +15% damage to opponents with more max HP than you. | add |  |  |  |
| `vsDisabled` | 1 | Warlord (0.25) | +25% damage to Stunned or Weakened opponents. | add |  |  | Reaper, Stormcaller |
| `vsHalf` | 1 | Reaper 2 (0.25) | Opponents below half HP take 25% more damage from you. | add |  | rate | Reaper |
| `vsHard` | 1 | Underdog (0.1) | +10% damage to hard opponents. | add |  |  |  |
| `vsHigherRank` | 1 | Rank Is Just a Letter (0.1) | +10% damage to opponents of a higher rank than you. | add |  |  |  |
| `weakPoison` | 1 | Hexblade (3) | Weaken you apply also applies 3 Poison. | add |  |  | Stormcaller, Venom |

### Enemy traits (fields on the enemy, or in its phase's set)

| Key | Used | Examples (value) |
| --- | --- | --- |
| `adapt` | 1 | Kaito Ren (0.6) |
| `aura` | 2 | Emperor Kharros the Ashen (0.7), trait Smouldering (1.5) |
| `briar` | 2 | The Thorn Mother (1), trait Barbed (1) |
| `dodge` | 2 | Lyss of the Thorn (0.05), trait Elusive (0.12) |
| `enrage` | 3 | Grukk the Unbroken (0.5), Emperor Kharros the Ashen (0.5), trait Frenzied (0.5) |
| `enrageMult` | 3 | Grukk the Unbroken (1.5), Emperor Kharros the Ashen (1.25), trait Frenzied (1.4) |
| `flood` | 1 | The Leviathan Queen (3) |
| `forge` | 1 | The Forge King (3) |
| `revive` | 1 | The Bone Saint (0.3) |
| `twincast` | 1 | The Archmage Who Fell Upward (3) |

### Feats (`feat`), from `js/content/feats.js`

What wagers, Rank Trial conditions, Titles and quests can ask for. Measured: when it is checked (win: a won fight; fight: any fight). Usual: the amount asked for unless the Title or quest says another (`n`). Unfair for: archetypes it is never asked of.

| Key | Measured | Shown to players as | Usual | Counts up | Unfair for | Asked by |
| --- | --- | --- | --- | --- | --- | --- |
| `bankrupt` | shop | Leave the shop with 0 gold |  |  |  | quest h_bankrupt |
| `bighit` | fight | Land a single hit of 60 or more | 60 |  |  | Title Executioner |
| `clutch` | win | Win with 10% HP or less |  |  |  | Title Comeback Kid, quest h_clutch |
| `collector` | merge | Own three ★2 pieces at once | 3 |  |  | quest h_collector |
| `fast` | win | Win within 6 turns | 6 |  |  | wager, Title First Blood, quest fast3 |
| `giant` | win | Beat an opponent with at least twice your max HP |  |  |  | Title Giant Slayer |
| `hard` | win | Beat a hard opponent |  |  |  | Title Underdog, quest hard2 |
| `healed` | fight | Heal 60 HP in a single fight | 60 |  |  | Title Bloodthirsty |
| `healthy` | win | Win with more than half your HP |  |  |  | wager |
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
