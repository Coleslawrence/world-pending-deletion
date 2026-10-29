# Adding content

All of the game's content lives in `js/content/`: archetypes, skills, gear, gods, world packs, enemies, Undercity events and chains, Gifts, Titles, quests and Hidden Paths. Wagers, districts and runes are still in `js/core.js`.

## Where things go

| To add | Edit |
| --- | --- |
| A skill | `js/content/skills/<archetype>.js`: one `sk()` line with its two ★3 evolutions |
| Gear | `js/content/gear.js` |
| An archetype | `js/content/archetypes.js` (the entry, the wheel), its skills file, a colour in `css/style.css`, a Hidden Path for every pair, `STAT_INFO` in `base.js` |
| A world type | A new pack in `js/content/worlds/` (the world, its World Record pool, its Final Champion's greeting), plus its Final Champion in `enemies.js`, its World Gift in `gifts.js` and its world-first Title in `titles.js` and `FINAL_TITLE` |
| A god | `js/content/gods.js` (its archetypes, blessing and rival reply line) and a `chosen_<id>` divine Gift in `gifts.js` |
| An enemy | `js/content/enemies.js`, and `MONSTERS` or `RIVALS`. Boss mechanics are fields from the enemy mechanics list below |
| An Undercity event | `js/content/events/undercity.js` |
| An event chain | A new file in `js/content/events/`: its `CHAINS` entry and one event per step. The format is described at the top of `js/content/events.js` |
| A Gift, Title, quest or Hidden Path | `gifts.js`, `titles.js`, `quests.js`, `paths.js` |

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

## Rules

- **Content uses only content.** Files in `js/content/` may use each other and `base.js`, never anything from `js/core.js`. They load before it.
- **Ids are permanent.** Saves, shared champions and the Halls store them. Rename the display name freely; never change or remove an id.
- **World Record pools only grow at the end.** Runs store pool positions, so never reorder, edit or delete an entry, a role or a promise.
- **Event options keep their places.** Run summaries store the option picked by its position, so add new options at the end and never remove one.
- **Event outcomes are data where they can be.** `pay`, and `then` (gold, stats, next-fight flags, the chain's next step, Favour) cover most options. Anything else goes in `go(run, h)`, which reaches the rules only through the helpers in `h`.
- **Effects come from the menu below.** New content that only uses effects already listed is data. A new effect is a mechanic: it needs code in `js/core.js`, a line in the bot's scoring (`tools/bot.js`, `choosePlayer`) and its own pull request.
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

## The effect menu

Written from the content itself by the checker, so it is always current. "Bot scores it: no" means the balance sims undervalue skills that lean on that effect.

<!-- effects:start (written by node tools/check-content.js --write) -->
### Skill effects (`fx`), used by skills and enemy moves

| Key | Used | Examples (value) | Shown to players as | Bot scores it |
| --- | --- | --- | --- | --- |
| `alwaysCrit` | 1 | Vital Strike (1) | Always a critical hit. | no |
| `bleed` | 12 | Lacerate (5), Thousand Cuts (1), Scorching Cut (2), … | Apply 5 Bleed. | yes |
| `block` | 42 | Ember Ward (8), Iron Guard (9), Shield Bash (6), … | Gain 8 Block. | yes |
| `blockDmg` | 7 | Smite (0.5), Bulwark Slam (1.2), Judgement (1), … | Plus damage equal to 50% of your Block. | yes |
| `burn` | 24 | Firebolt (4), Ember Ward (4), Flame Wave (2), … | Apply 4 Burn. | yes |
| `cleanse` | 14 | Unbreakable (1), Purify (1), Miracle (1), … | Remove your Burn, Poison, Bleed and Weaken. | yes |
| `critBonus` | 1 | Precise Strike (0.5) | +50% critical chance. | no |
| `cruel` | 3 | Assassinate (2), Death Blossom (2), Coup de Grace (2.5) | ×2 damage if the opponent has 2 or more effects. | yes |
| `detonate` | 3 | Ignite (2), Combust (3), Wildfire (2) | Deal 2× the opponent's Burn as damage, then remove it. Ignores Block. | yes |
| `dmg` | 142 | Firebolt (7), Flame Wave (4), Scorch (5), … | Deal 7 damage. | yes |
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
| `heal` | 15 | Sacred Flame (8), Penance (2), Holy Light (10), … | Heal 8. | yes |
| `healMissing` | 6 | Second Wind (0.25), Miracle (0.5), Last Breath (0.4), … | Heal 25% of your missing HP. | yes |
| `hits` | 34 | Flame Wave (2), Quick Slash (2), Fan of Knives (4), … | (works with other keys on the same skill) | yes |
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
| `poison` | 21 | Pandemic (6), Venom Blade (2), Hex (2), … | Apply 6 Poison. | yes |
| `reflect` | 1 | Reversal (1) | (works with other keys on the same skill) | no |
| `regen` | 3 | Consecrate (4), Hallowed Ground (7), Holy Fire (4) | Heal 4 at the start of your next 3 turns. | yes |
| `riposte` | 3 | Riposte (1.5), Perfect Riposte (2.5), Parry Master (1.5) | Until your next turn, damage you block is dealt back ×1.5. | yes |
| `selfDmg` | 2 | Berserk (3), Blood Rage (4) | Costs 3 HP. | no |
| `siphon` | 3 | Siphon (1), Soul Siphon (1), Hex Siphon (1) | Steal the opponent's Block and remove their Power. | yes |
| `stun` | 9 | Thunderclap (1), Thunder God's Wrath (1), Stunning Bash (1), … | Stun: the opponent loses their next turn, and the move they were about to use goes on cooldown. | yes |
| `stunIfWeak` | 4 | Overload (1), Jolt (1), Supercharge (1), … | If the opponent is Weakened, Stun them. | yes |
| `thorns` | 7 | Retribution (8), Blazing Aegis (6), Spiked Guard (5), … | Until your next turn, hit back for 8 when struck. | yes |
| `weaken` | 23 | Hex (2), Frost Lance (2), Static Jab (1), … | Weaken the opponent for 2 turns. | yes |

### Gear passives (`pas` scales with stars, `fix` does not)

| Key | Used | Examples (value) |
| --- | --- | --- |
| `afterQuick` | 1 | apprentice_staff (0.25) |
| `blockKeep` | 1 | tower_shield (0.3) |
| `blockThorns` | 1 | spiked_buckler (0.3) |
| `burnHeal` | 1 | cinder_robe (0.3) |
| `burnPlus` | 1 | ember_gauntlets (2) |
| `burnPoison` | 1 | plague_censer (2) |
| `critBonus` | 1 | duelist_rapier (0.1) |
| `dodge` | 1 | shadow_leathers (0.06) |
| `execBonus` | 1 | executioner_axe (0.4) |
| `firstCrit` | 1 | duelist_rapier (1) |
| `firstEvade` | 1 | shadow_leathers (1) |
| `firstStun` | 1 | thunder_maul (1) |
| `healBlock` | 1 | templar_plate (0.3) |
| `healOnBleed` | 1 | bloodstone_amulet (3) |
| `hitHeal` | 1 | pilgrim_mace (2) |
| `lowLifesteal` | 1 | soul_lantern (0.25) |
| `poisonHeal` | 1 | grave_shroud (0.2) |
| `poisonOnHit` | 1 | serpent_dagger (1) |
| `quickFree` | 1 | hourglass (1) |
| `regen` | 1 | prayer_beads (3) |
| `startBlock` | 1 | chain_mail (8) |
| `startPoison` | 1 | blight_kris (3) |
| `stunDmg` | 2 | thunder_maul (6), storm_ring (10) |
| `stunEmpower` | 1 | conductive_mail (1) |
| `thornsAlways` | 1 | crown_of_thorns (3) |

### Hidden Path effects (`fx`)

| Key | Used | Examples (value) |
| --- | --- | --- |
| `bleedHeal` | 1 | Butcher (0.5) |
| `bleedPoison` | 1 | Viper Dance (2) |
| `blockDmgPct` | 1 | Juggernaut (1) |
| `blockStun` | 1 | Thunder Wall (0.25) |
| `burnExec` | 1 | Funeral Pyre (0.25) |
| `burnHeal` | 1 | Sunpriest (0.3) |
| `doomLeech` | 1 | Soul Weaver (0.4) |
| `flareFull` | 1 | Plague Flame (1) |
| `healBlock` | 1 | Paladin (0.5) |
| `healDmg` | 1 | Last Rites (0.3) |
| `healOnBleed` | 1 | Blood Saint (3) |
| `healPoison` | 1 | Plague Saint (3) |
| `hitBurn` | 1 | Cinderblade (1) |
| `multiWeaken` | 1 | Lightning Blade (1) |
| `poisonHeal` | 1 | Plague Doctor (0.25) |
| `quickBlock` | 1 | Spellshield (5) |
| `quickBurn` | 1 | Spellfire (3) |
| `quickEvade` | 1 | Shadow Dancer (1) |
| `quickHeal` | 1 | Chronomancer (4) |
| `quickPoison` | 1 | Apothecary (2) |
| `quickStun` | 1 | Tempest Mage (0.25) |
| `stunBurn` | 1 | Wildstorm (5) |
| `stunHeal` | 1 | Inquisitor (8) |
| `thornBurn` | 1 | Ember Wall (2) |
| `thornMult` | 1 | Duelist (1.5) |
| `thornPoison` | 1 | Thornbark (2) |
| `vsDisabled` | 1 | Warlord (0.25) |
| `weakPoison` | 1 | Hexblade (3) |

### God blessings (`bless`, at 8 Favour)

| Key | Used | Examples (value) |
| --- | --- | --- |
| `dmgPct` | 1 | The God of War (0.15) |
| `dotPlus` | 1 | The Trickster (2) |
| `lowHpDmg` | 1 | The Goddess of Ruin (0.3) |

### Enemy mechanics (fields on the enemy)

| Key | Used | Examples (value) |
| --- | --- | --- |
| `aura` | 1 | Emperor Kharros the Ashen (0.7) |
| `briar` | 1 | The Thorn Mother (1) |
| `dodge` | 1 | Lyss of the Thorn (0.05) |
| `enrage` | 2 | Grukk the Unbroken (0.5), Emperor Kharros the Ashen (0.5) |
| `enrageMult` | 2 | Grukk the Unbroken (1.25), Emperor Kharros the Ashen (1.25) |
| `flood` | 1 | The Leviathan Queen (true) |
| `forge` | 1 | The Forge King (3) |
| `kaito` | 1 | Kaito Ren (true) |
| `revive` | 1 | The Bone Saint (0.3) |
| `twincast` | 1 | The Archmage Who Fell Upward (3) |
<!-- effects:end -->
