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
    logEv(ev); const m = map[ev]; if (!playable(m)) return;
    out(pick(ev, m), m, o && o.gain);
  }
  // .ogg where the browser plays Vorbis, else the .mp3 twin shipped next to it (Safari)
  const OGG = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return true; } })();
  const src = f => "assets/audio/" + (OGG ? f : f.replace(/\.ogg$/, ".mp3"));
  const volOf = (m, g) => Math.min(1, (m.vol == null ? 1 : m.vol) * (g == null ? 1 : g));
  function out(f, m, g, loop) { try { const a = new Audio(src(f)); a.volume = volOf(m, g); a.loop = !!(loop || m.loop); a.play().catch(() => {}); return a; } catch (e) { return null; } }
  // v12n loops (e.g. the fire crackle): one per event. loop(ev) starts it (restarts if already on); stop(ev, secs) fades it
  // out over secs and stops it; stopLoops(secs) stops them all (battle end / scene change). Plain <audio loop> (.ogg seamless).
  const loops = {}; // ev -> { a, fade }
  function loop(ev) {
    logEv(ev); stop(ev, 0); const m = map[ev]; if (!playable(m)) return;
    const a = out(pick(ev, m), m, null, true); if (a) loops[ev] = { a };
  }
  function stop(ev, secs) {
    const L = loops[ev]; if (!L) return; delete loops[ev];
    const a = L.a, v0 = a.volume, t0 = performance.now(), ms = (secs || 0) * 1000;
    if (ms <= 0) { a.pause(); return; }
    const iv = setInterval(() => { const u = (performance.now() - t0) / ms; if (u >= 1) { clearInterval(iv); a.pause(); } else a.volume = v0 * (1 - u); }, 30);
  }
  const stopLoops = secs => Object.keys(loops).forEach(ev => stop(ev, secs));
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopLoops(0); }); // no crackle left running in a hidden tab
  // Voice-over: one clip at a time. id -> audio_map entry (files under assets/audio/, e.g. "vo/vo_intro_01.ogg").
  // Missing entry / empty files = silent (the text is always shown anyway). voLog records every requested id.
  let vo = null, voTok = 0; const voLog = [];
  const VEL = new Audio(); VEL.preload = "auto";
  const SILENT = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  const unlockVO = () => { if (VEL.src && VEL.src !== SILENT && !VEL.paused) return; if (!VEL.src || VEL.ended || VEL.paused) { try { if (!vo) { VEL.src = SILENT; VEL.play().catch(() => {}); } } catch (e) {} } window.removeEventListener("pointerdown", unlockVO, true); window.removeEventListener("keydown", unlockVO, true); };
  window.addEventListener("pointerdown", unlockVO, true); window.addEventListener("keydown", unlockVO, true);
  // v11b: a vo_* id with no listed file is still tried by NAME, so a dropped-in recording plays without editing the map:
  // assets/audio/vo/<id>.ogg (or .mp3), then Charlie's drop folder incoming/vo_narrator/<id>.ogg/.mp3/.wav. A missing file
  // fails silently (Audio "error" -> next candidate -> nothing). o.onEnd(id) fires only when a clip really played to its end.
  const VO_DROP = "incoming/vo_narrator/";
  function voCands(id, m) {
    if (m && m.files && m.files.length) return [src(m.files[0])];
    if (!/^vo_/.test(id)) return [];
    const own = OGG ? [`assets/audio/vo/${id}.ogg`, `assets/audio/vo/${id}.mp3`] : [`assets/audio/vo/${id}.mp3`];
    return own.concat(OGG ? [VO_DROP + id + ".ogg"] : [], [VO_DROP + id + ".mp3", VO_DROP + id + ".wav"]);
  }
  function voice(id, o = {}) {
    if (!id) return null; voLog.push(id); if (voLog.length > 200) voLog.shift();
    if (vo) { try { vo.pause(); } catch (e) {} vo = null; if (window.KM.Music) KM.Music.duckVoice(false); }
    log.push(id); counts[id] = (counts[id] || 0) + 1;
    const m = map[id], cands = voCands(id, m); if (muted || !cands.length) return null;
    const duck = (on, el) => { if (window.KM.Music && (on || vo === el)) KM.Music.duckVoice(on); };  // music dips under the voice
    // v12h: ONE reusable <audio> element for all voice-over, unlocked by the first click/key (Safari only lets an element
    // play from script after it has played once inside a user gesture; a fresh new Audio() per line was silently blocked).
    const tok = ++voTok;
    const tryAt = i => {
      if (tok !== voTok) return;
      if (i >= cands.length) { voFail[id] = true; return; }
      try {
        const el = vo = VEL; el.onplaying = el.onended = el.onerror = el.onpause = null;
        el.src = cands[i]; el.loop = false; el.volume = m && m.vol != null ? m.vol : 1;
        el.onplaying = () => { if (tok !== voTok) return; duck(true, el); voPlayed[id] = cands[i]; if (o.onStart) o.onStart(el, id); }; // v12c: callers can pace text to el.currentTime
        el.onended = () => { if (tok !== voTok) return; duck(false, el); vo = null; if (o.onEnd) o.onEnd(id); };
        el.onpause = () => duck(false, el);
        el.onerror = () => { if (tok !== voTok) return; duck(false, el); tryAt(i + 1); };
        el.play().catch(err => { if (tok !== voTok) return; duck(false, el); if (err && err.name === "NotSupportedError") tryAt(i + 1); else voFail[id] = "blocked:" + (err && err.name); });
      } catch (e) { tryAt(i + 1); }
    };
    tryAt(0); return id;
  }
  const voPlayed = {}, voFail = {}; // id -> file that actually played / ids with no playable file (tests, report)
  // dialogue line helpers: a line is "text" or { text, vo }
  const text = l => (l && typeof l === "object" ? l.text : l || "");
  const voOf = l => (l && typeof l === "object" ? l.vo : null);
  return { init, play, loop, stop, stopLoops, looping: () => Object.keys(loops), voice, text, voOf, log, counts, voLog, voPlayed, voFail, voBusy: () => !!vo, fileLog, map: () => map, setMuted: v => { muted = v; if (v) stopLoops(0); } };
})();
