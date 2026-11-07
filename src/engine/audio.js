// Sound hook points only. Events -> assets/audio_map.json. Files go in assets/audio/.
window.KM = window.KM || {};
KM.Audio = (function () {
  // the map ships as a script (src/config/audio_map.js) so file:// works; on http the json is re-read (fresh edits win)
  let map = window.KM_AUDIO_MAP || {};
  const log = [];
  const counts = {};
  const last = {};
  const fileLog = []; // files actually chosen by play() (tests check event -> file resolution)
  let muted = false;
  async function init() {
    if (!/^https?:/.test(location.protocol)) return; // file://: the embedded KM_AUDIO_MAP is used
    try { const r = await fetch("assets/audio_map.json"); if (r.ok) map = await r.json(); } catch (e) {}
  }
  // pick a file for an event: random, never the same file twice in a row (uniform over the other files)
  function pick(ev, m) {
    if (m.rare && Math.random() < m.rare.p) { fileLog.push(m.rare.file); return m.rare.file; } // optional rare variant (e.g. the comic squelch / bonk)
    let i = Math.floor(Math.random() * (m.files.length > 1 && last[ev] != null ? m.files.length - 1 : m.files.length));
    if (m.files.length > 1 && last[ev] != null && i >= last[ev]) i++;
    last[ev] = i; fileLog.push(m.files[i]); if (fileLog.length > 5000) fileLog.shift();
    return m.files[i];
  }
  const logEv = ev => { log.push(ev); if (log.length > 200) log.shift(); counts[ev] = (counts[ev] || 0) + 1; };
  const playable = m => !muted && m && m.files && m.files.length;
  // play(ev) / play(ev, { gain }): gain multiplies the map's volume (e.g. a quieter third yelp)
  function play(ev, o) {
    if (String(ev).startsWith("vo_")) return;
    logEv(ev); const m = map[ev]; if (!playable(m)) return;
    out(pick(ev, m), m, o && o.gain, false, Math.max(.8,Math.min(1.2,o?.rate||1)));
  }
  // .ogg where the browser plays Vorbis, else the .mp3 twin shipped next to it (Safari)
  const OGG = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return true; } })();
  const path = f => "assets/audio/" + (OGG ? f : f.replace(/\.ogg$/, ".mp3"));
  const blobs = {}; // file -> blob: URL fetched with the loading bar (preloadAll), so a play never goes to the network
  const src = f => blobs[f] || path(f);
  const volOf = (m, g) => Math.min(1, (m.vol == null ? 1 : m.vol) * (g == null ? 1 : g));
  // v12s sfx pool (Magnus: "slower and slower the longer you walk"): one new <audio> per play meant ~2-5 new media
  // elements a second while walking (footsteps), each a full media player freed only by GC (Safari keeps them a long
  // time). Now every file keeps at most POOL elements and replays a finished one, so the count stays flat.
  const POOL = 4, pool = {}; // file -> [<audio>]
  function elFor(f) {
    const list = pool[f] || (pool[f] = []);
    const free = list.find(a => !a._held && (a.paused || a.ended)); if (free) return free;
    if (list.length < POOL) { const a = new Audio(src(f)); a.preload = "auto"; list.push(a); return a; }
    const busy = list.filter(a => !a._held); // all playing: restart the one that has played longest (never a running loop)
    return busy.length ? busy.reduce((o, a) => (a.currentTime > o.currentTime ? a : o)) : null;
  }
  function out(f, m, g, loop, rate=1) {
    try { const a = elFor(f); if (!a) return null;
      a.loop = !!(loop || m.loop); a._held = a.loop; a.volume = volOf(m, g); a.playbackRate=rate; a.preservesPitch=rate===1;
      try { a.currentTime = 0; } catch (e) {}
      a.play().catch(e => console.warn("[sfx] Playback failed:", src(f), e.name)); return a;
    } catch (e) { return null; }
  }
  // v12n loops (e.g. the fire crackle): one per event. loop(ev) starts it (restarts if already on); stop(ev, secs) fades it
  // out over secs and stops it; stopLoops(secs) stops them all (battle end / scene change). Plain <audio loop> (.ogg seamless).
  const loops = {}; // ev -> { a, fade }
  function loop(ev) {
    if (String(ev).startsWith("vo_")) return;
    logEv(ev); stop(ev, 0); const m = map[ev]; if (!playable(m)) return;
    const a = out(pick(ev, m), m, null, true); if (a) loops[ev] = { a };
  }
  function stop(ev, secs) {
    const L = loops[ev]; if (!L) return; delete loops[ev];
    const a = L.a, v0 = a.volume, t0 = performance.now(), ms = (secs || 0) * 1000;
    const end = () => { a.pause(); a.loop = false; a._held = false; }; // back in the pool
    if (ms <= 0) return end();
    const iv = setInterval(() => { const u = (performance.now() - t0) / ms; if (u >= 1) { clearInterval(iv); end(); } else a.volume = v0 * (1 - u); }, 30);
  }
  const stopLoops = secs => Object.keys(loops).forEach(ev => stop(ev, secs));
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopLoops(0); }); // no crackle left running in a hidden tab
  // Voice acting removed: retain the dialogue API, never load or play a voice clip.
  const voLog = [], voPlayed = {}, voFail = {};
  const voice = () => null;
  const text = l => (l && typeof l === "object" ? l.text : l || "");
  const voOf = () => null;
  // warm the given sfx ids (their files' <audio> elements buffer now); resolves when each can play, errors or waits maxMs
  function warm(ids, maxMs = 4000) {
    if (typeof Audio === "undefined") return Promise.resolve();
    const files = [...new Set(ids.flatMap(id => (map[id] && map[id].files) || []))];
    return Promise.all(files.map(f => new Promise(res => { const a = elFor(f); if (!a) return res(); if (a.readyState >= 4) return res();
      const t = setTimeout(res, maxMs); const fin = () => { clearTimeout(t); res(); };
      a.addEventListener("canplaythrough", fin, { once: true }); a.addEventListener("error", fin, { once: true }); a.load(); })));
  }
  // every sound effect file fetched once with the loading bar (KM.Loader.fetch) and played from memory afterwards
  function preloadAll() {
    if (!window.KM || !KM.Loader || !KM.Loader.fetch) return Promise.resolve();
    const files = [...new Set(Object.entries(map).filter(([ev]) => !ev.startsWith("vo_")).flatMap(([, m]) => [...((m && m.files) || []), ...(m && m.rare ? [m.rare.file] : [])]))];
    return Promise.all(files.map(f => new Promise(res => KM.Loader.fetch(path(f), url => { if (/^blob:/.test(url)) blobs[f] = url; res(); }))));
  }
  return { init, play, warm, preloadAll, loop, stop, stopLoops, looping: () => Object.keys(loops), voice, text, voOf, log, counts, voLog, voPlayed, voFail, voBusy: () => false, fileLog, map: () => map, poolSize: () => Object.values(pool).reduce((n, l) => n + l.length, 0), setMuted: v => { muted = v; if (v) stopLoops(0); } };
})();
