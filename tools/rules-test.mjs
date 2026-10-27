// Firestore rules checks for Pending World scores, shared data and the testers list, run against the local emulator (needs Java).
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
// alice, bob and carol are approved testers; erin is signed in but not approved
await env.withSecurityRulesDisabled(async c => { for (const u of ['alice', 'bob', 'carol']) await setDoc(doc(c.firestore(), 'testers/' + u), { note: 'test' }); });
const erin = env.authenticatedContext('erin').firestore();

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
await check('a display name is accepted', assertSucceeds(setDoc(ref(bob, 'bob', '2026-10-26'), score({ player: 'Kael' }))));
await check('a 25-character display name is refused', assertFails(setDoc(ref(bob, 'bob', '2026-10-27'), score({ player: 'x'.repeat(25) }))));
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
const carol = env.authenticatedContext('carol').firestore();
await check('a score with a rank letter is fine', assertSucceeds(setDoc(ref(carol, 'carol'), score({ rank: 'C' }))));
await check('a long rank is refused', assertFails(setDoc(ref(carol, 'carol', '2026-10-27'), score({ rank: 'SSSS' }))));
const note = (o = {}) => Object.assign({ by: 'bob', champ: 'Linden of Velmere', t: 1 }, o);
await check('a laid-to-rest note with rank is fine', assertSucceeds(setDoc(doc(bob, 'inbox/alice/notes/bob_1'), note({ at: 123, rank: 'B' }))));
await check('a champion-win note is fine', assertSucceeds(setDoc(doc(bob, 'inbox/alice/notes/bob_2'), note({ t: 2, at: 123, won: true }))));
await check('won must be a boolean', assertFails(setDoc(doc(bob, 'inbox/alice/notes/bob_3'), note({ t: 3, won: 'yes' }))));
await check('notes still refuse extra fields', assertFails(setDoc(doc(bob, 'inbox/alice/notes/bob_4'), note({ t: 4, rp: 99 }))));
await check('notes must be signed by the sender', assertFails(setDoc(doc(bob, 'inbox/alice/notes/bob_5'), note({ t: 5, by: 'carol' }))));
await check('only the owner reads the inbox', assertFails(getDoc(doc(bob, 'inbox/alice/notes/bob_1'))));

// The testers list and access requests
await check('a tester reads their own tester document', assertSucceeds(getDoc(doc(alice, 'testers/alice'))));
await check('a player can check that they are not a tester', assertSucceeds(getDoc(doc(erin, 'testers/erin'))));
await check('nobody reads someone else\'s tester document', assertFails(getDoc(doc(erin, 'testers/alice'))));
await check('players cannot approve themselves', assertFails(setDoc(doc(erin, 'testers/erin'), { note: 'me' })));
await check('testers cannot approve others', assertFails(setDoc(doc(alice, 'testers/erin'), { note: 'friend' })));
await check('nobody lists the testers', assertFails(getDocs(collection(alice, 'testers'))));
await check('an unapproved score is refused', assertFails(setDoc(ref(erin, 'erin'), score())));
await check('an unapproved shared champion is refused', assertFails(setDoc(doc(erin, 'champions/erin'), { list: [], name: 'Wren', r: 0.5 })));
await check('a tester shares a champion', assertSucceeds(setDoc(doc(alice, 'champions/alice'), { list: [], name: 'Wren', r: 0.5 })));
await check('an unapproved laid-to-rest note is refused', assertFails(setDoc(doc(erin, 'inbox/alice/notes/erin_1'), note({ by: 'erin' }))));
await check('an unapproved rests list is refused', assertFails(setDoc(doc(erin, 'rests/erin'), { list: [] })));
await check('unapproved players still read shared champions', assertSucceeds(getDoc(doc(erin, 'champions/alice'))));
await check('unapproved players still read the board', assertSucceeds(getDocs(query(collection(erin, `daily/${day}/scores`), orderBy('score', 'desc'), limit(20)))));
await check('unapproved players still keep their own cloud save', assertSucceeds(setDoc(doc(erin, 'data/users/erin/progress'), { meta: {}, run: null, savedAt: 1 })));
await check('a player files an access request', assertSucceeds(setDoc(doc(erin, 'requests/erin'), { name: 'Wren', at: 1 })));
await check('a player renames their request', assertSucceeds(setDoc(doc(erin, 'requests/erin'), { name: 'Kael', at: 2 })));
await check('a player reads their own request', assertSucceeds(getDoc(doc(erin, 'requests/erin'))));
await check('nobody reads someone else\'s request', assertFails(getDoc(doc(alice, 'requests/erin'))));
await check('nobody lists requests', assertFails(getDocs(collection(alice, 'requests'))));
await check('a request for someone else is refused', assertFails(setDoc(doc(alice, 'requests/erin'), { name: 'Wren', at: 1 })));
await check('a request with an email field is refused', assertFails(setDoc(doc(erin, 'requests/erin'), { name: 'Wren', at: 1, email: 'x@y.z' })));
await check('a 25-character request name is refused', assertFails(setDoc(doc(erin, 'requests/erin'), { name: 'x'.repeat(25), at: 1 })));
await check('a signed-out request is refused', assertFails(setDoc(doc(anon, 'requests/erin'), { name: 'Wren', at: 1 })));
await check('a player cannot delete their request', assertFails(deleteDoc(doc(erin, 'requests/erin'))));
await check('other paths stay closed', assertFails(setDoc(doc(alice, 'daily/' + day), { x: 1 })));

console.log(`${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
