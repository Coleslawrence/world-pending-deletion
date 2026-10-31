// Firestore rules checks for Pending World scores, shared data and the testers list, run against the local emulator (needs Java).
//   npm i --no-save firebase-tools @firebase/rules-unit-testing firebase
//   npx firebase emulators:exec --only firestore --project demo-wpd "node tools/rules-test.mjs"
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
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
// Playtest stats: a real summary from a bot run, so the rules are checked against what the game actually sends
const runDoc = (() => { const req = createRequire(import.meta.url), G = req('../js/core.js'), B = req('./bot.js'), m = G.newMeta(); const r = B.playRun(m, false, { noElite: true }); return G.runSummary(r.run, m, r.result === 'spared' ? 'spared' : 'erased', 1700000000000, 'wpd-v11'); })();
const runRef = (db, id) => doc(db, 'runs/' + id);
// Posts a summary the way the game does, at runs/{uid}_{at}
const postRun = (db, uid, at, over = {}) => setDoc(runRef(db, uid + '_' + at), Object.assign({}, runDoc, { at }, over));
await check('a tester posts a run summary', assertSucceeds(setDoc(runRef(alice, 'alice_1700000000000'), runDoc)));
await check('an abandoned run with no foe or time is fine', assertSucceeds(postRun(alice, 'alice', 1700000000001, { outcome: 'abandoned', foe: null, mins: null })));
await check('a run with no path, title or rank is fine', assertSucceeds(postRun(alice, 'alice', 1700000000020, { path: null, hidden: null, title: null, rank: null, wrank: null })));
await check('a run summary cannot be overwritten', assertFails(setDoc(runRef(alice, 'alice_1700000000000'), runDoc)));
await check('a run summary cannot be deleted', assertFails(deleteDoc(runRef(alice, 'alice_1700000000000'))));
await check('nobody reads run summaries in game, not even their own', assertFails(getDoc(runRef(alice, 'alice_1700000000000'))));
await check('nobody lists run summaries in game', assertFails(getDocs(collection(alice, 'runs'))));
await check('an unapproved run summary is refused', assertFails(postRun(erin, 'erin', 1700000000000)));
await check('a run summary under someone else\'s id is refused', assertFails(postRun(bob, 'alice', 1700000000002)));
await check('a run summary whose id and time differ is refused', assertFails(setDoc(runRef(alice, 'alice_1700000000021'), runDoc)));
await check('a run summary with a name field is refused', assertFails(postRun(alice, 'alice', 1700000000003, { name: 'Wren' })));
await check('an unknown outcome is refused', assertFails(postRun(alice, 'alice', 1700000000004, { outcome: 'won' })));
await check('a round of 21 is refused', assertFails(postRun(alice, 'alice', 1700000000005, { round: 21 })));
await check('61 picks are refused', assertFails(postRun(alice, 'alice', 1700000000006, { picks: Array(61).fill('d:scout') })));
await check('a 41-character foe is refused', assertFails(postRun(alice, 'alice', 1700000000007, { foe: 'x'.repeat(41) })));
await check('an unknown mode is refused', assertFails(postRun(alice, 'alice', 1700000000008, { mode: 'cheat' })));
await check('an unknown patron is refused', assertFails(postRun(alice, 'alice', 1700000000009, { patron: 'Wren' })));
await check('a level of 10 is refused', assertFails(postRun(alice, 'alice', 1700000000010, { level: 10 })));
await check('fractional turns are refused', assertFails(postRun(alice, 'alice', 1700000000011, { turns: 40.5 })));
await check('hearts as text are refused', assertFails(postRun(alice, 'alice', 1700000000012, { hearts: '3' })));
await check('a 2-day run time is refused', assertFails(postRun(alice, 'alice', 1700000000013, { mins: 2880 })));
await check('a long title is refused', assertFails(postRun(alice, 'alice', 1700000000014, { title: 'x'.repeat(25) })));
await check('a world rank as a number is refused', assertFails(postRun(alice, 'alice', 1700000000015, { wrank: 3 })));
await check('a run from an older build with no version is fine', assertSucceeds(setDoc(runRef(alice, 'alice_1700000000022'), (({ ver, ...d }) => Object.assign(d, { at: 1700000000022 }))(runDoc))));
await check('a run with no known version is fine', assertSucceeds(postRun(alice, 'alice', 1700000000023, { ver: null })));
await check('a 17-character version is refused', assertFails(postRun(alice, 'alice', 1700000000017, { ver: 'x'.repeat(17) })));
await check('a version as a number is refused', assertFails(postRun(alice, 'alice', 1700000000018, { ver: 11 })));
await check('maxHearts of 21 is refused', assertFails(postRun(alice, 'alice', 1700000000016, { maxHearts: 21 })));

// Bug reports: a real report from the game's own builder, with and without a run attached
const G2 = createRequire(import.meta.url)('../js/core.js');
const env2 = { build: '2026-10-28/s5', screen: 'shop/shop', w: 320, h: 693, app: true, ua: 'Mozilla/5.0 (iPhone)' };
const fbRun = (() => { const req = createRequire(import.meta.url), B = req('./bot.js'), m = G2.newMeta(); return B.playRun(m, false, { noElite: true }).run; })();
const fbDoc = (o = {}, withRun = true) => Object.assign(G2.feedbackDoc('bug', 'The shop froze after I sold a skill.', env2, withRun ? fbRun : null, 1700000000000), o);
const fbRef = (db, id) => doc(db, 'feedback/' + id);
const postFb = (db, uid, at, o = {}, withRun) => setDoc(fbRef(db, uid + '_' + at), fbDoc(Object.assign({ at }, o), withRun));
await check('a tester files a report with a run attached', assertSucceeds(setDoc(fbRef(alice, 'alice_1700000000000'), fbDoc())));
await check('a report without a run is fine', assertSucceeds(postFb(alice, 'alice', 1700000000001, {}, false)));
await check('an unapproved player can file a report', assertSucceeds(postFb(erin, 'erin', 1700000000002)));
await check('a signed-out report is refused', assertFails(setDoc(fbRef(anon, 'dave_1700000000003'), fbDoc({ at: 1700000000003 }))));
await check('a report cannot be overwritten', assertFails(setDoc(fbRef(alice, 'alice_1700000000000'), fbDoc())));
await check('a report cannot be deleted', assertFails(deleteDoc(fbRef(alice, 'alice_1700000000000'))));
await check('nobody reads reports in game, not even their own', assertFails(getDoc(fbRef(alice, 'alice_1700000000000'))));
await check('nobody lists reports in game', assertFails(getDocs(collection(alice, 'feedback'))));
await check('a report under someone else\'s id is refused', assertFails(postFb(bob, 'alice', 1700000000004)));
await check('a report whose id and time differ is refused', assertFails(setDoc(fbRef(alice, 'alice_1700000000005'), fbDoc())));
await check('a report with a name field is refused', assertFails(postFb(alice, 'alice', 1700000000006, { name: 'Wren' })));
await check('an unknown report type is refused', assertFails(postFb(alice, 'alice', 1700000000007, { type: 'rant' })));
await check('an empty report is refused', assertFails(postFb(alice, 'alice', 1700000000008, { text: '' })));
await check('a 1001-character report is refused', assertFails(postFb(alice, 'alice', 1700000000009, { text: 'x'.repeat(1001) })));
await check('a 1000-character report is fine', assertSucceeds(postFb(alice, 'alice', 1700000000010, { text: 'x'.repeat(1000) })));
await check('11 log lines are refused', assertFails(postFb(alice, 'alice', 1700000000011, { run: Object.assign({}, fbDoc().run, { log: Array(11).fill('[x]') }) })));
await check('an extra run field is refused', assertFails(postFb(alice, 'alice', 1700000000012, { run: Object.assign({}, fbDoc().run, { name: 'Wren' }) })));
await check('a 201-character device line is refused', assertFails(postFb(alice, 'alice', 1700000000013, { ua: 'x'.repeat(201) })));

await check('other paths stay closed', assertFails(setDoc(doc(alice, 'daily/' + day), { x: 1 })));

console.log(`${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
