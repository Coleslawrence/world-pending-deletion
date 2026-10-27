# Cloud saves with Firebase

The web version uses Firebase for sign-in, cloud saves and shared champions. Without it, the game still works and saves in each browser.

## One-time setup (Firebase console)

1. **Create a project** at https://console.firebase.google.com named `world-pending-deletion`. Google Analytics can be off.
2. **Register a web app**: on the project overview click **`</>`**, nickname `web`, leave Firebase Hosting unticked. Copy the `firebaseConfig` it shows.
3. **Create the database**: **Build → Firestore Database → Create database**, production mode, location `australia-southeast1` (Sydney).
4. **Turn on sign-in**: **Build → Authentication → Get started → Sign-in method**.
   - Enable **Google**.
   - Enable **GitHub**. Copy the callback URL Firebase shows, then on GitHub go to **Settings → Developer settings → OAuth Apps → New OAuth App**: Homepage URL `https://coleslawrence.github.io/world-pending-deletion`, Authorization callback URL = the Firebase one. Paste the GitHub app's **Client ID** and a new **Client secret** into Firebase.
5. **Authorise the site**: **Authentication → Settings → Authorized domains → Add domain** → `coleslawrence.github.io`.
6. **Publish the access rules**: **Firestore Database → Rules**, replace everything with the contents of [`firestore.rules`](../firestore.rules), then **Publish**.
7. **Connect the game**: paste the `firebaseConfig` object into [`js/firebase-config.js`](../js/firebase-config.js) in place of `null`, and push to `main`.

## What is stored

| Path | Contents | Who can read | Who can write |
|---|---|---|---|
| `data/users/{uid}/progress` | Echoes, Titles, unlocks, Halls and the run in progress | Only that player | Only that player |
| `champions/{uid}` | Up to 12 champions a player chose to share, plus the name they chose in game | Signed-in players | Only that player, if a tester |
| `inbox/{uid}/notes/{id}` | "Laid to rest" and champion-win notes addressed to that player | Only that player | Any other tester, once per note |
| `daily/{date}/scores/{uid}` | One Pending World score per player per game day | Signed-in players | Only that player, if a tester, once |
| `rests/{uid}` | Old "laid to rest" lists from earlier versions | Signed-in players | Only that player, if a tester |
| `testers/{uid}` | One document per approved playtester | Only that player (to check) | Nobody: console only |
| `requests/{uid}` | An access request: the name the player chose in game and when | Only that player | Only that player |
| `runs/{uid}_{time}` | One anonymous summary per finished run, for the stats dashboard: world, class, round, Hearts, picks. No names | Nobody in game: console and exports only | Only that player, if a tester, once |

Shared records are treated as untrusted by the game: unknown pieces are dropped and stats are clamped.

## Playtesters (who can post to shared data)

Anyone can sign in, play and keep their own cloud save. Only approved testers post daily scores, share champions
and leave laid-to-rest notes. Everyone else sees `[Entry pending approval.]`, their scores stay on their device,
and the game files an access request for them.

- **See requests**: **Firestore Database → Data → `requests`**. Each document's ID is the player's UID; `name` is the name they chose in game.
- **Approve**: in **Data**, open the `testers` collection (first time: **Start collection**, ID `testers`). **Add document**, paste the UID as the **Document ID**, add any field (for example `note` = who it is, which only you can see), **Save**. Then delete their `requests` document. They are approved the next time they open the game.
- **Find a UID without a request**: **Authentication → Users**, copy the **User UID** column.
- **Revoke**: delete their document in `testers`. Their new posts stop at once; what they already posted stays until you delete it.

## Playtest stats (the stats dashboard)

Each finished run (spared, erased or abandoned; not the tutorial) leaves one summary in `runs`. It is queued on the
device and posts at the next sync while signed in as a tester, so runs played before the rules are published post later
(the device keeps the last 20). Nothing in it names the player: the document ID starts with their UID only so runs can
be counted per entrant.

To refresh the dashboard: export the `runs` collection as JSON (an array of documents, or an object keyed by document
ID), then `node tools/run-report.js runs.json stats.json` and publish `stats.json` with the dashboard page.
`node tools/run-report.js --sample 90 stats.json` makes bot runs instead, to try the page without real data.

## Free-plan limits (Spark)

Roughly 50,000 reads and 20,000 writes a day and 1 GB of storage. The game saves at most once every 5 seconds while you play, so a session uses a few dozen writes. If a limit is ever hit, cloud saves pause until the next day and the game keeps saving on the device.
