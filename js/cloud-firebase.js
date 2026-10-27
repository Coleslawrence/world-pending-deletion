// Firebase adapter: gives ui.js the same small db/user interface it uses inside Claude,
// so cloud saves, shared champions and laid-to-rest notes work on the web version too.
(function () {
  const cfg = window.FIREBASE_CONFIG;
  if (!cfg) return;
  const V = '10.12.2', base = 'https://www.gstatic.com/firebasejs/' + V + '/';
  const names = {};
  let me = null, api = null;
  const publicName = () => String(C.handle || '').trim().slice(0, 24) || 'Entrant';
  const shortName = u => String((u && (u.displayName || (u.email || '').split('@')[0])) || 'Entrant').trim().split(/\s+/)[0].slice(0, 24) || 'Entrant';
  const mapErr = e => { const c = e && e.code; return { code: c === 'permission-denied' || c === 'invalid-argument' ? 'invalid_argument' : c === 'unavailable' || c === 'deadline-exceeded' ? 'unavailable' : c === 'resource-exhausted' ? 'resource_exhausted' : String(c || 'unavailable'), message: e && e.message }; };
  const wrapDoc = path => ({
    id: path.split('/').pop(), path,
    get: async () => { try { const s = await api.getDoc(api.doc(api.fs, path)); return { id: s.id, exists: s.exists(), data: () => s.data() }; } catch (e) { throw mapErr(e); } },
    set: async d => {
      // Other players read this name, so it is the name the player chose in game, never one from their account
      if (/^(champions|rests|inbox)\//.test(path) && me) d = Object.assign({}, d, { name: publicName() });
      try { await api.setDoc(api.doc(api.fs, path), d); } catch (e) { throw mapErr(e); }
    },
  });
  // Inbox notes are keyed by note, so their sender's name belongs to `by`, not the document id
  const wrapDocs = qs => {
    const docs = qs.docs.map(s => { const d = s.data(); if (d && d.name) names[d.by || s.id] = String(d.name).slice(0, 24); return { id: s.id, exists: true, data: () => d }; });
    return { docs, size: docs.length, empty: !docs.length };
  };
  const makeQuery = (path, q) => {
    const parts = [];
    if (q.where) parts.push(api.where(...q.where));
    if (q.orderBy) parts.push(api.orderBy(...[].concat(q.orderBy)));
    if (q.limit) parts.push(api.limit(q.limit));
    return api.query(api.collection(api.fs, path), ...parts);
  };
  const db = {
    doc: wrapDoc,
    collection: path => ({
      get: async () => { try { return wrapDocs(await api.getDocs(api.collection(api.fs, path))); } catch (e) { throw mapErr(e); } },
      // q: { where: [field, op, value], orderBy: field or [field, 'desc'], limit: n }
      query: async q => {
        try { return wrapDocs(await api.getDocs(makeQuery(path, q))); } catch (e) { throw mapErr(e); }
      },
      // Counts matching documents on the server without reading them: 1 read per 1,000 documents
      count: async q => {
        try { return (await api.getCountFromServer(makeQuery(path, q || {}))).data().count; } catch (e) { throw mapErr(e); }
      },
    }),
  };
  const user = {
    id: async () => (me ? me.uid : null),
    profiles: async ids => { const o = {}; [].concat(ids).forEach(i => o[i] = { id: i, name: names[i] || '' }); return o; },
  };
  const C = window.WPD_CLOUD = {
    provider: 'firebase', db, user, ready: false, error: null,
    get me() { return me; },
    displayName: () => (me ? shortName(me) : ''),
    signIn: async kind => {
      if (!api) throw { code: 'unavailable', message: 'Cloud saves are offline right now.' };
      const p = kind === 'github' ? new api.GithubAuthProvider() : new api.GoogleAuthProvider();
      try { await api.signInWithPopup(api.auth, p); }
      catch (e) {
        if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) return api.signInWithRedirect(api.auth, p);
        if (e && e.code === 'auth/account-exists-with-different-credential') throw { code: 'other-provider', message: 'That email already uses the other sign-in option. Try that one instead.' };
        if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return;
        if (e && e.code === 'auth/unauthorized-domain') throw { code: e.code, message: 'Sign-in is not allowed on this site yet. Add ' + location.hostname + ' to Authorized domains in the Firebase console.' };
        if (e && e.code === 'auth/operation-not-allowed') throw { code: e.code, message: 'That sign-in option is not turned on yet in the Firebase console.' };
        throw e;
      }
    },
    signOut: async () => { if (api) await api.signOut(api.auth); },
  };
  (async () => {
    try {
      const [A, Au, F] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
      const app = A.initializeApp(cfg);
      const auth = Au.getAuth(app);
      const fs = F.getFirestore(app);
      api = { auth, fs, doc: F.doc, getDoc: F.getDoc, setDoc: F.setDoc, collection: F.collection, getDocs: F.getDocs, query: F.query, where: F.where, orderBy: F.orderBy, limit: F.limit, getCountFromServer: F.getCountFromServer, GoogleAuthProvider: Au.GoogleAuthProvider, GithubAuthProvider: Au.GithubAuthProvider, signInWithPopup: Au.signInWithPopup, signInWithRedirect: Au.signInWithRedirect, signOut: Au.signOut };
      Au.getRedirectResult(auth).catch(() => { });
      Au.onAuthStateChanged(auth, u => { me = u; C.ready = true; window.dispatchEvent(new CustomEvent('wpd-auth', { detail: { signedIn: !!u } })); });
    } catch (e) {
      C.error = 'offline'; C.ready = true; window.dispatchEvent(new CustomEvent('wpd-auth', { detail: { signedIn: false } }));
    }
  })();
})();
