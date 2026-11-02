// Music system: per-scene categories (src/data/music.js), crossfades, shuffle without immediate repeats,
// tracks roll on to the next when they end, world music resumes where it left off, ducking under voice-over.
// Browsers block autoplay: nothing plays until the first keypress/click (unlock).
window.KM = window.KM || {};
KM.Music = (function () {
  const M = () => KM_DATA.music;
  const ch = {};                 // category -> { el, bag, last, src, fade }
  const log = [];                // [{ scene, cat }] and [{ cat, track }] for tests/debug
  let scene = null, cur = null, sceneDuck = 1, voiceDuck = 1, unlocked = false, lastTrack = null;
  let volume = M().volume, muted = false, onChange = () => {};

  const catDef = c => M().categories[c] || {};
  const tracks = c => { const C = catDef(c); return C.tracks || (C.use ? catDef(C.use).tracks || [] : []); };
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function channel(c) {
    if (ch[c]) return ch[c];
    const el = new Audio(); el.preload = "none";
    const h = ch[c] = { el, bag: [], last: null, src: null, fade: 0 };
    el.addEventListener("ended", () => { if (cur === c) startTrack(c); else h.src = null; }); // roll on to the next track
    el.addEventListener("error", () => { if (h.src) console.info("[music] could not load", h.src); });
    return h;
  }
  function nextTrack(c) {
    const h = ch[c], list = tracks(c); if (!list.length) return null;
    if (!h.bag.length) h.bag = shuffle(list.slice());
    // no immediate repeat: not the track this category just played, nor the one we just heard anywhere
    for (let n = 0; n < h.bag.length && h.bag.length > 1 && (h.bag[0] === h.last || h.bag[0] === lastTrack); n++) h.bag.push(h.bag.shift());
    return h.bag.shift();
  }
  function startTrack(c) {
    const h = channel(c), t = nextTrack(c); if (!t) return;
    h.last = lastTrack = h.src = t; h.el.src = M().root + t; h.el.preload = "auto";
    log.push({ cat: c, track: t }); if (log.length > 300) log.shift();
    play(h);
  }
  function play(h) { if (!unlocked || muted || !h.src) return; const p = h.el.play(); if (p && p.catch) p.catch(() => {}); }

  // scene: a key of KM_DATA.music.scenes (title, walk, battle, boss, mega, riddle, recruit, rest_<kind>, gameover, win)
  function setScene(name) {
    const sc = M().scenes[name] || { cat: null };
    scene = name; sceneDuck = sc.duck == null ? 1 : sc.duck;
    const c = sc.cat || null;
    log.push({ scene: name, cat: c });
    if (c === cur) return;
    cur = c;
    if (!c) return;
    const h = channel(c);
    if (!h.src || !catDef(c).resume) startTrack(c); else play(h); // resume = continue from the paused position
  }

  // fades (independent of game speed)
  let lastT = performance.now();
  setInterval(() => {
    const now = performance.now(), dt = Math.min(0.25, (now - lastT) / 1000); lastT = now;
    const step = dt / Math.max(0.05, M().crossfade);
    for (const c in ch) {
      const h = ch[c], on = c === cur && !muted;
      h.fade = Math.max(0, Math.min(1, h.fade + (on ? (h.el.paused ? 0 : step) : -step))); // fade in only once actually playing
      const v = volume * (catDef(c).vol == null ? 1 : catDef(c).vol) * h.fade * (c === cur ? sceneDuck : 1) * voiceDuck;
      h.el.volume = Math.max(0, Math.min(1, v));
      if (h.fade <= 0 && !h.el.paused) h.el.pause();       // keeps currentTime, so world music can resume
      if (on && h.el.paused && unlocked && h.src) play(h);
    }
  }, 50);

  function unlock() { if (unlocked) return; unlocked = true; if (cur) play(channel(cur)); }
  ["keydown", "pointerdown", "touchstart"].forEach(ev => addEventListener(ev, unlock, { capture: true }));

  function settings(s) { if (s) { if (s.volume != null) volume = s.volume; muted = !!s.muted; } return { volume, muted }; }
  function setVolume(v) { volume = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100; if (volume > 0 && muted) muted = false; onChange(settings()); }
  function toggleMute() { muted = !muted; if (muted) for (const c in ch) ch[c].el.pause(); onChange(settings()); }
  function duckVoice(on) { voiceDuck = on ? M().duckVoice : 1; }
  function state() {
    const h = cur && ch[cur];
    return { scene, cat: cur, track: h ? h.src : null, playing: !!(h && !h.el.paused), time: h ? h.el.currentTime : 0,
      vol: h ? h.el.volume : 0, sceneDuck, voiceDuck, unlocked, muted, volume };
  }
  return { setScene, unlock, settings, setVolume, toggleMute, duckVoice, state, log, channels: ch, onChange: f => (onChange = f) };
})();
