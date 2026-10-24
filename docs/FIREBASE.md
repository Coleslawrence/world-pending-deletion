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
| `champions/{uid}` | Up to 12 champions a player chose to share, plus their first name | Signed-in players | Only that player |
| `rests/{uid}` | Up to 40 "laid to rest" notes a player left for others | Signed-in players | Only that player |

Shared records are treated as untrusted by the game: unknown pieces are dropped and stats are clamped.

## Free-plan limits (Spark)

Roughly 50,000 reads and 20,000 writes a day and 1 GB of storage. The game saves at most once every 5 seconds while you play, so a session uses a few dozen writes. If a limit is ever hit, cloud saves pause until the next day and the game keeps saving on the device.
