# [World Pending Deletion]

A LitRPG roguelike for phones and desktop browsers. The System has entered your world into a divine tournament: choose your opponents, buy and merge skills and gear, build into archetypes, and fight turn by turn through 8 rounds. Every loss erases part of your world. Lose all your Hearts and it is gone, and its champion will come back to face you in later runs.

**Play:** https://coleslawrence.github.io/world-pending-deletion/

On a phone, open the link and use **Add to Home Screen** to install it as an app. It works offline after the first visit.

## What's in it

- 6 world types, each with its own home archetype, World Gift and Final Champion
- 8 archetypes with 2/4/6 bonuses and 28 Hidden Paths
- Separate Skill and Gear shops: reroll, lock, interest, buying XP, and merging three copies into ★2 and ★3 (skills evolve at ★3)
- Reactions, wagers, districts, event chains, System quests, Titles and world-first broadcasts
- A skippable practice run that teaches the basics

## Project layout

| Path | What it is |
|---|---|
| `index.html` | The page shell |
| `css/style.css` | All styling (one dark theme, phone-first) |
| `js/core.js` | Game data and rules. No DOM, so it also runs in Node for simulations |
| `js/ui.js` | Screens, sheets and input |
| `js/firebase-config.js`, `js/cloud-firebase.js`, `firestore.rules` | Cloud saves and shared champions (Firebase) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installable web app and offline support |
| `tools/bot.js`, `tools/stats.js` | An auto-player and balance statistics |
| `tools/build-single.py` | Bundles everything into one HTML file in `dist/` |
| `.github/workflows/pages.yml` | Publishes the site to GitHub Pages on every push to `main` |

## Running it locally

Any static file server works, for example:

```
python3 -m http.server 8000
```

then open http://localhost:8000. Opening `index.html` directly also works, without offline support.

## Balance testing

```
node tools/stats.js 1000      # 1,000 bot runs: win rate, losses per round, per Final Champion and archetype
node tools/stats.js 1000 --batches 5 --seed 1 --json out.json   # repeatable, 5 batches with min-max spread, saved as JSON
node tools/stats.js 1000 --main reaper --rounds                 # bot builds around one archetype; loss by round per archetype
node tools/stats.js 1000 --world sky --unlock arch_storm        # force a world type; unlock items in every meta ("all" for all)
node tools/bot.js v 1         # one verbose run
```

## Layout testing

```
node tools/layout-check.js                        # every screen at phone, tablet and desktop sizes; exits 1 on a problem
node tools/layout-check.js --size 320x693 --shots out/   # one size, with a screenshot per screen
```

It plays a bot run, restores each stage in a real browser (Playwright with Chromium) and reports anything off the side of the screen, cut off, or overlapping. 320 wide is an iPhone mini or SE with Display Zoom.

## Saves and shared champions

Progress (Echoes, Titles, unlocks, the Halls and the current run) is saved in the browser. Signing in with Google or GitHub adds cloud saves across devices and lets players share champions, who can then appear in each other's tournaments. This uses Firebase; setup steps are in [docs/FIREBASE.md](docs/FIREBASE.md).

## Publishing changes

Edit the files and push to `main`. The workflow deploys within a minute or two. When the game files change, bump `VERSION` in `sw.js` so installed copies pick up the update.
