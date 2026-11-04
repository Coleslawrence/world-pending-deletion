// Dev preview mode. Does nothing in the live game: only the /dev/ copy built by tools/site-build.js defines
// window.WPD_BUILD (js/build-info.js) before this file loads. In the preview it:
//  - keeps its own saves and settings on this device, apart from the live game's (every localStorage key gets a prefix)
//  - never writes to Firestore (js/cloud-firebase.js checks WPD_PREVIEW): no cloud save, scores, pool, run stats or reports
//  - stays behind a sign-in screen until the account's testers/{uid} document has preview: true (docs/FIREBASE.md)
//  - shows a DEV tab at the top of the screen; tapping it lists the pull requests on dev that are not live yet
// The gate keeps casual visitors out. It is not real security: the repo and its code are public anyway.
(function () {
  const B = window.WPD_BUILD;
  if (!B || B.channel !== 'dev') return;
  window.WPD_PREVIEW = B;

  // Separate saves: prefix every localStorage key, so the preview never reads or overwrites the live game's run
  const PREFIX = 'wpd-dev:', S = Storage.prototype, get = S.getItem, set = S.setItem, del = S.removeItem;
  const isLocal = st => { try { return st === window.localStorage; } catch (e) { return false; } };
  S.getItem = function (k) { return get.call(this, isLocal(this) ? PREFIX + k : k); };
  S.setItem = function (k, v) { return set.call(this, isLocal(this) ? PREFIX + k : k, v); };
  S.removeItem = function (k) { return del.call(this, isLocal(this) ? PREFIX + k : k); };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const css = document.createElement('style');
  css.textContent = `
.pv-stripe { position: fixed; top: 0; left: 0; right: 0; height: 3px; background: #d9a441; z-index: 2147483000; pointer-events: none; }
.pv-tag { position: fixed; top: 0; left: 50%; transform: translateX(-50%); z-index: 2147483001; font: 600 9px/1 var(--f-m, monospace); letter-spacing: .1em;
  color: #120f0d; background: #d9a441; border: 0; border-radius: 0 0 5px 5px; padding: 1px 8px 3px; cursor: pointer; }
.pv-tag::after { content: ''; position: absolute; inset: -6px -10px -12px; } /* a bigger tap area than it looks */
.pv-cover { position: fixed; inset: 0; z-index: 2147483002; background: #120f0d; color: #efe6d8; display: flex; align-items: center; justify-content: center;
  padding: calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px)); font: 16px/1.45 var(--f-b, sans-serif); }
.pv-box { width: 100%; max-width: 420px; max-height: 100%; display: flex; flex-direction: column; gap: 12px; }
.pv-box h1 { margin: 0; font: 400 20px/1.2 var(--f-d, serif); color: #d9a441; }
.pv-box p { margin: 0; }
.pv-sys { font-family: var(--f-m, monospace); font-size: 14px; color: #c9bba5; }
.pv-btn { font: 600 16px/1 var(--f-b, sans-serif); padding: 13px 14px; border-radius: 8px; border: 1px solid #d9a441; background: #d9a441; color: #120f0d; cursor: pointer; }
.pv-btn.pv-quiet { background: transparent; color: #efe6d8; border-color: #5a4a3a; }
.pv-list { overflow-y: auto; margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; font-size: 14px; }
.pv-list li { border-left: 2px solid #5a4a3a; padding-left: 8px; overflow-wrap: anywhere; }
.pv-list b { color: #d9a441; font-weight: 600; }
.pv-meta { font: 12px/1.3 var(--f-m, monospace); color: #9c8e7a; }
`;
  document.head.appendChild(css);
  document.title = '[DEV] ' + document.title.replace(/^\[DEV\] /, '');

  let cover = null;
  const showCover = html => {
    if (!cover) { cover = document.createElement('div'); cover.className = 'pv-cover'; cover.setAttribute('role', 'dialog'); document.body.appendChild(cover); }
    cover.innerHTML = '<div class="pv-box">' + html + '</div>';
    return cover;
  };
  const hideCover = () => { if (cover) { cover.remove(); cover = null; } };
  const built = () => {
    const d = new Date(B.built);
    return 'Dev build ' + esc(B.sha || '?') + (isNaN(d) ? '' : ' · built ' + d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC');
  };

  // The gate
  const STATES = {
    checking: '<h1>Dev preview</h1><p class="pv-sys">[Verifying clearance…]</p>',
    signin: '<h1>Dev preview</h1><p class="pv-sys">[This build has not been released. Entrants with preview clearance may sign in.]</p><button class="pv-btn" data-pv="signin">Sign in with Google</button>',
    denied: '<h1>Dev preview</h1><p class="pv-sys">[Clearance not found for this account. The released game is open to you.]</p><button class="pv-btn" data-pv="live">Play the live game</button><button class="pv-btn pv-quiet" data-pv="signout">Sign out</button>',
    offline: '<h1>Dev preview</h1><p class="pv-sys">[Cannot verify clearance right now. Check your connection.]</p><button class="pv-btn" data-pv="retry">Try again</button>',
  };
  let open = false, gen = 0;
  const show = k => { if (!open) showCover(STATES[k] + '<p class="pv-meta">' + built() + '</p>'); };
  const unlock = () => { open = true; hideCover(); addTag(); };
  const check = () => {
    if (open) return;
    const C = window.WPD_CLOUD;
    if (!C) return show(document.readyState === 'complete' ? 'offline' : 'checking');
    if (!C.ready) return show('checking');
    if (C.error) return show('offline');
    if (!C.me) return show('signin');
    show('checking');
    const g = ++gen;
    C.db.doc('testers/' + C.me.uid).get()
      .then(d => { if (g !== gen) return; const v = d.exists && d.data(); if (v && v.preview === true) unlock(); else show('denied'); })
      .catch(e => { if (g === gen) show(e && e.code === 'unavailable' ? 'offline' : 'denied'); });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-pv]');
    if (!b) return;
    const C = window.WPD_CLOUD, act = b.dataset.pv;
    if (act === 'signin' && C) C.signIn('google').catch(err => showCover(STATES.signin + '<p class="pv-sys">[' + esc((err && err.message) || 'Sign-in failed.') + ']</p>'));
    if (act === 'signout' && C) C.signOut();
    if (act === 'retry') location.reload();
    if (act === 'live') location.href = '../';
    if (act === 'changes') showChanges();
    if (act === 'close') hideCover();
  }, true);
  window.addEventListener('wpd-auth', () => { if (open && window.WPD_CLOUD && !window.WPD_CLOUD.me) location.reload(); else check(); });
  window.addEventListener('load', check);
  show('checking');

  // DEV tag and the list of changes not live yet
  const addTag = () => {
    if (document.querySelector('.pv-tag')) return;
    const s = document.createElement('div'); s.className = 'pv-stripe'; document.body.appendChild(s);
    const t = document.createElement('button'); t.className = 'pv-tag'; t.type = 'button'; t.dataset.pv = 'changes'; t.textContent = 'DEV';
    t.setAttribute('aria-label', 'Dev preview: what is new since the live game');
    document.body.appendChild(t);
  };
  const showChanges = () => {
    const list = (B.changes || []).map(c => '<li>' + (c.pr ? '<b>#' + c.pr + '</b> ' : '') + esc(c.title) + '</li>').join('');
    showCover('<h1>On dev, not live yet</h1><p class="pv-meta">' + built() + '</p>' +
      (list ? '<ul class="pv-list">' + list + '</ul>' : '<p class="pv-sys">[Nothing. Dev matches the live game.]</p>') +
      '<p class="pv-sys">[Saves here are kept apart from the live game. Nothing is sent to the leaderboards, the pool or your cloud save.]</p>' +
      '<button class="pv-btn" data-pv="close">Back to the game</button>');
  };
})();
