// Firestore rules checks for Pending World scores, run against the local emulator (needs Java).
//   npm i --no-save firebase-tools @firebase/rules-unit-testing firebase
//   npx firebase emulators:exec --only firestore --project demo-wpd "node tools/rules-test.mjs"
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, orderBy, limit, getDocs, getCountFromServer } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-wpd', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
const day = '2026-10-25';
const score = (o = {}) => { const d = Object.assign({ name: 'Wren', sigil: 2, color: 1, wins: 5, hearts: 0, turns: 61, path: 'pyre', rec: { ids: [1, 2, 3], lost: 7, partial: 0, bio: { role: 0, home: 1, person: 3, promise: 0 } }, at: Date.now() }, o); if (!('score' in o)) d.score = 100000 * d.wins + 1000 * d.hearts + 999 - d.turns; return d; };
const alice = env.authenticatedContext('alice').firestore(), bob = env.authenticatedContext('bob').firestore(), anon = env.unauthenticatedContext().firestore();
const ref = (db, uid, date = day) => doc(db, `daily/${date}/scores/${uid}`);
let pass = 0, fail = 0;
const check = async (name, p) => { try { await p; pass++; } catch (e) { fail++; console.log('FAIL', name, e.message); } };

await check('first score is created', assertSucceeds(setDoc(ref(alice, 'alice'), score())));
await check('second create on the same day is refused', assertFails(setDoc(ref(alice, 'alice'), score({ wins: 8, hearts: 5 }))));
await check('update is refused', assertFails(updateDoc(ref(alice, 'alice'), { hearts: 9 })));
await check('delete is refused', assertFails(deleteDoc(ref(alice, 'alice'))));
await check('wins of 13 is refused', assertFails(setDoc(ref(bob, 'bob'), score({ wins: 13 }))));
await check('hearts of 21 is refused', assertFails(setDoc(ref(bob, 'bob'), score({ wins: 8, hearts: 21 }))));
await check('turns of 1000 is refused', assertFails(setDoc(ref(bob, 'bob'), score({ turns: 1000 }))));
await check('a score that does not match its parts is refused', assertFails(setDoc(ref(bob, 'bob'), score({ score: 1200999 }))));
await check('fractional wins are refused', assertFails(setDoc(ref(bob, 'bob'), score({ wins: 5.5, score: 550938 }))));
await check('a 25-character name is refused', assertFails(setDoc(ref(bob, 'bob'), score({ name: 'x'.repeat(25) }))));
await check('an extra field is refused', assertFails(setDoc(ref(bob, 'bob'), score({ admin: true }))));
await check('a 21-entry record is refused', assertFails(setDoc(ref(bob, 'bob'), score({ rec: { ids: Array.from({ length: 21 }, (_, i) => i), lost: 0, partial: 0, bio: {} } }))));
await check('a bad date is refused', assertFails(setDoc(ref(bob, 'bob', 'today'), score())));
await check('writing someone else\'s score is refused', assertFails(setDoc(ref(bob, 'carol'), score())));
await check('signed out writes are refused', assertFails(setDoc(ref(anon, 'dave'), score())));
const bare = score({ path: null }); delete bare.rec;
await check('a score without a record or path is fine', assertSucceeds(setDoc(ref(bob, 'bob'), bare)));
await check('a score posted for another day is separate', assertSucceeds(setDoc(ref(alice, 'alice', '2026-10-26'), score())));
await check('signed-in players read any score', assertSucceeds(getDoc(ref(bob, 'alice'))));
await check('signed out reads are refused', assertFails(getDoc(ref(anon, 'alice'))));
await check('the top-20 query is allowed', assertSucceeds(getDocs(query(collection(bob, `daily/${day}/scores`), orderBy('score', 'desc'), limit(20)))));
await check('count() is allowed', assertSucceeds(getCountFromServer(collection(bob, `daily/${day}/scores`))));
await check('other paths stay closed', assertFails(setDoc(doc(alice, 'daily/' + day), { x: 1 })));

console.log(`${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
