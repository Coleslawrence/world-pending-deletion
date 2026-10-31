// [World Pending Deletion] service worker: offline play.
// Bump VERSION whenever the game files change so players get the update.
const VERSION = 'wpd-v9';
const CORE = [
  './', 'index.html', 'css/style.css', 'js/firebase-config.js',
  'js/content/base.js', 'js/content/effects.js', 'js/content/feats.js', 'js/content/outcomes.js', 'js/content/moves.js', 'js/content/archetypes.js', 'js/content/skills.js', 'js/content/skills/pyre.js', 'js/content/skills/venom.js', 'js/content/skills/blade.js', 'js/content/skills/bastion.js', 'js/content/skills/arcanist.js', 'js/content/skills/zealot.js', 'js/content/skills/reaper.js', 'js/content/skills/storm.js', 'js/content/skills/basic.js', 'js/content/gear.js', 'js/content/gods.js', 'js/content/worlds.js', 'js/content/worlds/drowned.js', 'js/content/worlds/burning.js', 'js/content/worlds/hollow.js', 'js/content/worlds/verdant.js', 'js/content/worlds/sky.js', 'js/content/worlds/iron.js', 'js/content/gifts.js', 'js/content/titles.js', 'js/content/quests.js', 'js/content/paths.js', 'js/content/enemies.js', 'js/content/traits.js',
  'js/content/events.js', 'js/content/events/undercity.js', 'js/content/events/official.js', 'js/content/events/poisoner.js', 'js/content/events/letter.js',
  'js/core.js', 'js/notes.js', 'js/ui.js', 'js/cloud-firebase.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg',
];
self.addEventListener('install', e => {
  // reload skips the browser's HTTP cache, so a new VERSION never caches the old files
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'wpd-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Fonts: cache after first use
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('wpd-fonts').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => hit))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Game files: open from the cache at once and refresh it in the background, so launching never waits on the network.
  // A release ships a new VERSION; the browser installs it in the background and the next launch opens it.
  e.respondWith(caches.open(VERSION).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => c.match('index.html'));
  })));
});
