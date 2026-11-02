// Builds the files GitHub Pages serves. Used by .github/workflows/pages.yml for both copies of the game:
//   node tools/site-build.js <checkout> <out>                    # the live game, from main
//   node tools/site-build.js <checkout> <out> --preview <base>   # the dev preview, from dev; <base> is a main checkout
// The preview copy gets: a build stamp with the changes not live yet (js/build-info.js), a service worker that
// never caches (so it always shows the newest dev and stays out of the live game's offline cache), a separate
// home-screen name, and a noindex tag so search engines skip it. js/preview.js does the rest when the game runs.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const [src, out, flag, base] = process.argv.slice(2);
if (!src || !out || (flag && (flag !== '--preview' || !base))) {
  console.error('usage: node tools/site-build.js <checkout> <out> [--preview <main checkout>]');
  process.exit(2);
}
const preview = flag === '--preview';

// Everything the game loads. fonts/ only exists from wpd-v13 on, so missing entries are skipped.
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', '.nojekyll', 'css', 'js', 'icons', 'fonts'];
fs.mkdirSync(out, { recursive: true });
for (const f of FILES) {
  const from = path.join(src, f);
  if (fs.existsSync(from)) fs.cpSync(from, path.join(out, f), { recursive: true });
}
if (!preview) { console.log('Built live copy from ' + src); process.exit(0); }

const git = (...a) => execFileSync('git', ['-C', src, ...a], { encoding: 'utf8' }).trim();
const edit = (f, fn) => { const p = path.join(out, f); fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8'))); };

// What is on dev but not live: one line per pull request merged into dev since main.
const mainSha = execFileSync('git', ['-C', base, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
let changes = [];
try {
  try { git('cat-file', '-e', mainSha + '^{commit}'); } catch (e) { git('fetch', '--quiet', path.resolve(base), 'HEAD'); }
  // Releases squash dev into main, so dev's history is never part of main's. Walk dev back to the last time main was
  // merged into it (the sync after each ship): everything after that is not live yet.
  const isAncestor = (a, b) => { try { git('merge-base', '--is-ancestor', a, b); return true; } catch (e) { return false; } };
  const commits = [];
  for (const s of git('log', '--first-parent', '--format=%P%x1f%s%x1f%b%x1e', mainSha + '..HEAD').split('\x1e').map(s => s.trim()).filter(Boolean)) {
    const [parents, subject, body = ''] = s.split('\x1f'), p2 = parents.split(' ')[1];
    if (p2 && isAncestor(p2, mainSha)) break;
    commits.push([subject, body]);
  }
  changes = commits.map(([subject, body]) => {
    const merge = subject.match(/^Merge pull request #(\d+) from \S+/);
    if (merge) return { pr: +merge[1], title: body.split('\n')[0].trim() || subject };
    const squash = subject.match(/^(.*) \(#(\d+)\)$/);
    return squash ? { pr: +squash[2], title: squash[1] } : { pr: null, title: subject };
  }).filter(Boolean).slice(0, 60);
} catch (e) { console.warn('Could not list changes since main: ' + e.message); }

const info = {
  channel: 'dev',
  sha: git('rev-parse', '--short', 'HEAD'),
  built: new Date().toISOString(),
  changes,
};
fs.writeFileSync(path.join(out, 'js/build-info.js'), '// Written by tools/site-build.js for the dev preview only.\nwindow.WPD_BUILD = ' + JSON.stringify(info) + ';\n');

edit('index.html', h => {
  if (!h.includes('<script src="js/preview.js"></script>')) throw new Error('index.html does not load js/preview.js');
  return h
    .replace('<script src="js/preview.js"></script>', '<script src="js/build-info.js"></script>\n<script src="js/preview.js"></script>')
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex, nofollow">')
    .replace(/<meta name="apple-mobile-web-app-title" content="[^"]*">/, '<meta name="apple-mobile-web-app-title" content="WPD Dev">')
    .replace(/<title>[^<]*<\/title>/, '<title>[DEV] [World Pending Deletion]</title>');
});
edit('manifest.webmanifest', m => {
  const j = JSON.parse(m);
  j.name = '[DEV] ' + j.name; j.short_name = 'WPD Dev';
  return JSON.stringify(j, null, 2) + '\n';
});
fs.writeFileSync(path.join(out, 'sw.js'), `// Dev preview service worker: no offline cache, every file comes fresh from the network.
// Its own scope (/dev/) keeps the live game's worker from serving or caching preview files.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }));
});
`);
console.log('Built dev preview ' + info.sha + ' from ' + src + ' with ' + changes.length + ' changes not live yet');
