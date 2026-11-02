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
  function play(ev) {
    log.push(ev); if (log.length > 200) log.shift(); counts[ev] = (counts[ev] || 0) + 1;
    const m = map[ev]; if (muted || !m || !m.files || !m.files.length) return;
    // optional rare variant (e.g. the comic squelch / bonk): { rare: { file, p } } replaces the pick with probability p
    if (m.rare && Math.random() < m.rare.p) { fileLog.push(m.rare.file); return out(m.rare.file, m); }
    // random pick, never the same file twice in a row (uniform over the other files)
    let i = Math.floor(Math.random() * (m.files.length > 1 && last[ev] != null ? m.files.length - 1 : m.files.length));
    if (m.files.length > 1 && last[ev] != null && i >= last[ev]) i++;
    last[ev] = i; fileLog.push(m.files[i]); if (fileLog.length > 5000) fileLog.shift();
    out(m.files[i], m);
  }
  // .ogg where the browser plays Vorbis, else the .mp3 twin shipped next to it (Safari)
  const OGG = (() => { try { return !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return true; } })();
  const src = f => "assets/audio/" + (OGG ? f : f.replace(/\.ogg$/, ".mp3"));
  function out(f, m) { try { const a = new Audio(src(f)); a.volume = m.vol == null ? 1 : m.vol; a.loop = !!m.loop; a.play().catch(() => {}); } catch (e) {} }
  // Voice-over: one clip at a time. id -> audio_map entry (files under assets/audio/, e.g. "vo/vo_intro_01.ogg").
  // Missing entry / empty files = silent (the text is always shown anyway). voLog records every requested id.
  let vo = null; const voLog = [];
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
    const tryAt = i => {
      if (i >= cands.length) { voFail[id] = true; return; }
      try {
        const el = vo = new Audio(cands[i]); el.volume = m && m.vol != null ? m.vol : 1;
        el.addEventListener("playing", () => { duck(true, el); voPlayed[id] = cands[i]; if (o.onStart && vo === el) o.onStart(el, id); }); // v12c: callers can pace text to el.currentTime
        el.addEventListener("ended", () => { duck(false, el); if (vo === el) { vo = null; if (o.onEnd) o.onEnd(id); } });
        el.addEventListener("pause", () => duck(false, el));
        el.addEventListener("error", () => { duck(false, el); if (vo === el) tryAt(i + 1); });
        el.play().catch(err => { duck(false, el); if (err && err.name === "NotSupportedError" && vo === el) tryAt(i + 1); });
      } catch (e) { tryAt(i + 1); }
    };
    tryAt(0); return id;
  }
  const voPlayed = {}, voFail = {}; // id -> file that actually played / ids with no playable file (tests, report)
  // dialogue line helpers: a line is "text" or { text, vo }
  const text = l => (l && typeof l === "object" ? l.text : l || "");
  const voOf = l => (l && typeof l === "object" ? l.vo : null);
  return { init, play, voice, text, voOf, log, counts, voLog, voPlayed, voFail, voBusy: () => !!vo, fileLog, map: () => map, setMuted: v => (muted = v) };
})();
