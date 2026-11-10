// [World Pending Deletion] sound, vibration and player settings.
// Every sound is synthesised with Web Audio, so there are no audio files to load or license.
// Settings live on this device only (localStorage 'wpd-settings').
'use strict';
const SETTINGS_KEY = 'wpd-settings';
const SETTINGS_DEFAULT = { vol: 2, vib: true, shake: true, motion: 'system', text: 'normal', look: 'broadcast', fastWins: false, preview: true }; // vol: 0 off, 1 low, 2 medium, 3 high
const VOL_LEVELS = [0, 0.25, 0.55, 1];
function loadSettings() {
  let s = null; try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY)); } catch (e) { }
  return Object.assign({}, SETTINGS_DEFAULT, s && typeof s === 'object' ? s : {});
}
let SET = loadSettings();
function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SET)); } catch (e) { } applySettings(); }
const OS_REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function reducedMotion() { return SET.motion === 'reduce' || (SET.motion === 'system' && OS_REDUCED); }
// Settings that change the page itself: reduced motion, text size and the look (theme) are attributes on <html> that style.css reads
function applySettings() {
  const r = document.documentElement;
  if (reducedMotion()) r.setAttribute('data-motion', 'reduce'); else r.removeAttribute('data-motion');
  if (SET.text && SET.text !== 'normal') r.setAttribute('data-text', SET.text); else r.removeAttribute('data-text');
  if (SET.look === 'classic') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', 'broadcast');
}
applySettings();

// ---------- Sound ----------
let AC = null, MASTER = null, NOISE = null;
function audio() {
  if (!VOL_LEVELS[SET.vol]) return null;
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    try { AC = new C(); MASTER = AC.createGain(); MASTER.connect(AC.destination); } catch (e) { AC = null; return null; }
    NOISE = AC.createBuffer(1, AC.sampleRate * 0.6, AC.sampleRate);
    const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (AC.state === 'suspended') AC.resume().catch(() => {});
  MASTER.gain.value = 0.5 * VOL_LEVELS[SET.vol];
  return AC;
}
// iOS only lets audio start inside a tap: unlock on the first one
['pointerdown', 'keydown'].forEach(t => document.addEventListener(t, () => { if (AC && AC.state === 'suspended') AC.resume().catch(() => {}); }, { capture: true, passive: true }));
function tone(f0, f1, dur, type, vol, delay) {
  const a = AC, t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, freq, vol, delay, sweepTo) {
  const a = AC, t = a.currentTime + (delay || 0), s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
  s.buffer = NOISE; fl.type = 'lowpass'; fl.frequency.setValueAtTime(freq, t); if (sweepTo) fl.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(MASTER); s.start(t); s.stop(t + dur + 0.02);
}
const SOUNDS = {
  tap: () => tone(880, 760, 0.04, 'sine', 0.05),
  hit: () => { noise(0.09, 1100, 0.35); tone(120, 70, 0.1, 'sine', 0.35); },
  crit: () => { noise(0.12, 2200, 0.4); tone(140, 60, 0.14, 'sine', 0.4); tone(1500, 1900, 0.08, 'square', 0.06, 0.02); },
  block: () => tone(320, 260, 0.07, 'triangle', 0.18),
  heal: () => tone(480, 820, 0.16, 'sine', 0.12),
  react: () => { tone(660, 660, 0.09, 'triangle', 0.14); tone(990, 990, 0.12, 'triangle', 0.12, 0.07); },
  break: () => { noise(0.35, 3000, 0.5, 0, 300); tone(90, 40, 0.4, 'sine', 0.5); tone(1800, 2600, 0.18, 'triangle', 0.07, 0.05); },
  buy: () => { tone(1250, 1250, 0.05, 'sine', 0.12); tone(1650, 1650, 0.09, 'sine', 0.12, 0.06); },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.18, 'triangle', 0.14, i * 0.09)),
  loss: () => { tone(330, 220, 0.35, 'sawtooth', 0.06); tone(165, 110, 0.45, 'sine', 0.2, 0.05); },
  heart: () => { tone(95, 55, 0.3, 'sine', 0.5); noise(0.18, 400, 0.25); },
  erase: () => { noise(0.9, 4000, 0.3, 0, 120); tone(440, 55, 0.9, 'sawtooth', 0.05); },
};
const HAPTICS = { tap: 6, hit: 12, crit: [0, 22], break: [0, 40, 40, 60], heart: [0, 80, 60, 80], loss: [0, 120], erase: [0, 60, 50, 60, 50, 200], win: [0, 15, 40, 15] };
function sfx(name) {
  if (SET.vib && HAPTICS[name] && navigator.vibrate) { try { navigator.vibrate(HAPTICS[name]); } catch (e) { } }
  if (!SOUNDS[name] || !audio()) return;
  try { SOUNDS[name](); } catch (e) { }
}
