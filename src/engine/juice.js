// Juice (switch juice): every key has its own heavy sound the instant it goes down, digits land heavy, Enter punches,
// a wrong Enter is blocked. Data: src/data/juice.js.
// Latency: Web Audio, every file fetched + decoded once at init; a hit is one AudioBufferSourceNode into that sound's
// reused GainNode, started synchronously in the keydown / pointerdown handler (nothing awaited, no <audio>).
window.KM = window.KM || {};
KM.Juice = (() => {
  const D = () => KM_DATA.juice, on = () => !!(KM.BalanceTry && KM.BalanceTry.on('juice'));
  const buf = {}, amp = {}, turn = {}; let ac = null;
  const last = { id: null, t: 0, started: false };   // the latest hit (tests + timing check)
  function hit(id, pitch, rate = 1) {
    last.id = id; last.rate = rate; last.t = performance.now(); last.started = false;
    if (!ac || !buf[id] || KM.Audio?.muted?.()) return;
    const go = () => { const s = ac.createBufferSource(); s.buffer = buf[id]; s.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * (pitch || 0));
      s.connect(amp[id]); s.start(); last.started = true; };
    if (ac.state === 'running') go(); else ac.resume().then(go, () => {}); // the very first key: unlock, then play that key
  }
  const next = c => c.sfx[turn[c.sfx] = ((turn[c.sfx] ?? -1) + 1) % c.sfx.length]; // a list alternates
  // the sound for a key, at once (k = '0'..'9', 'back', 'enter' + right: true / false / null = nothing to submit); true = handled
  function press(k, right) {
    if (!on()) return false; const d = D();
    if (k === 'back') hit(next(d.back), d.back.pitch);
    else if (k === 'enter') { if (right == null) return true; const c = right ? d.enter : d.wrong; hit(next(c), c.pitch); }
    else hit(d.digits[+k], d.digit.pitch);
    return true;
  }
  const letterRate = c => { // A..Z: a fixed pitch each (data: text.rate, text.spread); anything else at 1
    const i = c.charCodeAt(0) - 65, [lo, hi] = D().text.rate; return i >= 0 && i < 26 && c.length === 1 ? lo + (hi - lo) * ((i * D().text.spread) % 26) / 25 : 1;
  };
  // name entry: the key's sound at once (a character -> digits[char code % 10], Backspace, Enter); true = handled
  function text(k) { // always on (Magnus: the name's metal sounds matter for immersion), not only with the juice switch
    const d = D(), t = d.text;
    if (k === 'Backspace') hit(t.back, t.pitch); else if (k === 'Enter') hit(t.enter, t.pitch);
    else if (k.length === 1) { const c = k.toUpperCase(); const L = t.letters || d.digits; hit(L[c.codePointAt(0) % L.length], 0, letterRate(c)); } else return false;
    return true;
  }
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  function key(k, el) { // motion only, after the answer box shows the new digit
    if (!on() || !el || k === 'back') return; const g = el.lastElementChild; if (!g) return;
    g.classList.add('juice-land'); if (D().digit.spark) el.insertAdjacentHTML('beforeend', '<i class="juice-spark" aria-hidden="true"></i>');
  }
  function enter(right, el, S) { // motion for a submitted answer
    if (!on()) return; const c = right ? D().enter : D().wrong;
    if (el) restart(el, right ? 'juice-punch' : 'juice-block'); S.shake = Math.max(S.shake || 0, c.shake || 0);
  }
  function load() { // fetch + decode every sound once; a hit before its buffer is ready is skipped, never waited for
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx || !/^https?:/.test(location.protocol)) return;
    ac = new Ctx(); let ogg = true; try { ogg = !!new Audio().canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) {}
    const resume = () => { if (ac.state === 'running') return; ac.resume(); // first user gesture unlocks the context;
      try { const q = ac.createBufferSource(); q.buffer = ac.createBuffer(1, 1, 22050); q.connect(ac.destination); q.start(); } catch (e) {} }; // Safari: a silent tick inside the gesture
    for (const ev of ['keydown', 'pointerdown', 'touchstart']) window.addEventListener(ev, resume, { capture: true, passive: true });
    resume(); // already unlocked if the page had a gesture; else the first key / tap does it (that key's hit plays once it runs)
    const files = {};
    for (const [id, s] of Object.entries(D().sounds)) {
      const g = amp[id] = ac.createGain(); g.gain.value = s.vol ?? 1; g.connect(ac.destination);
      (files[s.file] ||= fetch(`assets/audio/sfx/${s.file}.${ogg ? 'ogg' : 'mp3'}`).then(r => r.arrayBuffer()).then(a => ac.decodeAudioData(a)))
        .then(b => { buf[id] = b; }, e => console.warn('[juice] sound failed:', s.file, e));
    }
  }
  function init() { // timings + sizes -> CSS variables, sounds decoded (always: name entry uses them without the switch)
    const d = D(), st = document.documentElement.style;
    st.setProperty('--juice-land', d.digit.ms + 'ms'); st.setProperty('--juice-drop', -d.digit.drop + 'px'); st.setProperty('--juice-squash', d.digit.squash);
    st.setProperty('--juice-punch', d.enter.ms + 'ms'); st.setProperty('--juice-punch-squash', d.enter.squash); st.setProperty('--juice-block', d.wrong.ms + 'ms');
    load();
  }
  return { on, press, text, letterRate, key, enter, init, last, ready: () => Object.keys(buf).length, state: () => ac && ac.state };
})();
