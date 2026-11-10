// v12f loading bar (Magnus): parchment, his divider line, the answer timer's orange fill growing from the centre
// ornament out, a small "Loading". Only the title / intro / road art loads first (CRIT); every other image asked for
// while the bar is up waits (src set later) and streams in behind the title. Progress = bytes of the first set
// (sizes from src/config/asset_sizes.js, written by km_site_deploy.sh; unknown files count 60 KB).
// v12r: the first music tracks (KM_DATA.music.preload) join the first set too (fetchFile).
window.KM = window.KM || {};
KM.Loader = (function () {
  // first set: the title / intro UI + hero + narrator; road layers join when the road draw asks for them (want)
  const CRIT = /(\/ink\/(divider|glyph)|\/paper\/(parchment|sky)\.|\/ui\/(cloud|bird|divider|speech-)|strip_bg|hero-walk|narrator|\/numerals\/)/;
  const ORN = 1062.8 / 2128, ORNH = 26 / 2128, ORANGE = "#c0682a";
  let phase = "critical", totW = 0, doneW = 0, shown = 0, lastChange = performance.now();
  const pend = new Set(), deferred = [];
  const base = location.href.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  const rel = s => { try { return decodeURI(new URL(s, base).href.replace(base, "")); } catch (e) { return s; } };
  const size = s => (window.KM_ASSET_SIZES && KM_ASSET_SIZES[rel(s)]) || 60000;
  // ---- the overlay
  const ov = document.createElement("div"); ov.id = "kmLoader";
  let loadingLabel='Loading';try{if(localStorage.getItem('knightMath.language')==='ja')loadingLabel='読み込み中';}catch(_){}
  ov.innerHTML = `<div class="ld-bar"><img alt="" src="assets/v11/ui/divider.png"><canvas width="2128" height="66"></canvas></div><div class="ld-txt">${loadingLabel}</div>`;
  const build = document.querySelector('meta[name="km-build"]')?.content; // which build is loading (index.html), so a stale cache is easy to spot
  if (build) ov.insertAdjacentHTML("beforeend", `<div class="ld-build">build ${build}</div>`);
  document.body.appendChild(ov);
  const dimg = ov.querySelector("img"), cv = ov.querySelector("canvas");
  const paint = () => { const x = cv.getContext("2d"); x.drawImage(dimg, 0, 0, cv.width, cv.height); x.globalCompositeOperation = "source-in"; x.fillStyle = ORANGE; x.fillRect(0, 0, cv.width, cv.height);
    x.globalCompositeOperation = "source-over"; x.clearRect((ORN - ORNH) * cv.width, 0, ORNH * 2 * cv.width, cv.height); };
  dimg.complete && dimg.naturalWidth ? paint() : dimg.addEventListener("load", paint);
  // the drawn bar eases toward the real share at a capped speed (FILL_MS for a full bar): the total grows as files are
  // asked for, so a cached first file can read 100% before the rest are known; the drawn bar never jumps, never shrinks
  const FILL_MS = 900; let real = 0, lastT = performance.now(), anim = 0;
  function draw() { real = phase === "done" ? 1 : totW ? Math.min(1, doneW / totW) : 0; if (!anim) anim = setTimeout(step, 16); }
  function step() {
    const now = performance.now(), dt = Math.min(100, now - lastT); lastT = now; anim = 0;
    shown = Math.max(shown, Math.min(real, shown + dt / FILL_MS)); paintBar();
    if (shown < real) anim = setTimeout(step, 16);
  }
  function paintBar() {
    const l = (ORN - ORNH) * (1 - shown), r = (1 - ORN - ORNH) * (1 - shown);
    cv.style.clipPath = `inset(0 ${(r * 100).toFixed(2)}% 0 ${(l * 100).toFixed(2)}%)`; cv.style.opacity = shown > 0 ? 1 : 0;
  }
  draw();
  function track(im, src) {
    const w = size(src); totW += w; pend.add(im); lastChange = performance.now();
    const fin = () => { if (!pend.delete(im)) return; doneW += w; lastChange = performance.now(); draw(); };
    im.addEventListener("load", fin); im.addEventListener("error", fin); draw();
  }
  // v12r: a non-image file in the first set (music): real bytes as they stream in, then `after(blobUrl)` (e.g. decode)
  // must resolve before the bar can finish. Falls back to the plain URL (Audio element preload) under file:// or if fetch / streams fail.
  function fetchFile(src, after) {
    const w = size(src), tok = {}; totW += w; pend.add(tok); lastChange = performance.now(); let got = 0;
    const add = n => { const d = Math.min(n, w - got); if (d > 0) { got += d; doneW += d; lastChange = performance.now(); draw(); } };
    const end = () => { if (!pend.delete(tok)) return; add(w); lastChange = performance.now(); draw(); };
    (async () => {
      let url = src;
      // file:// (a local double-click): fetch() is refused there, so skip it and let `after` preload the plain URL
      // through the <audio> element (canplaythrough); the bar counts the file when that resolves.
      if (location.protocol !== "file:" && window.fetch) try { const r = await fetch(src); if (!r.ok) throw new Error(r.status);
        if (r.body && r.body.getReader) { const rd = r.body.getReader(), parts = []; for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); add(value.length); }
          url = URL.createObjectURL(new Blob(parts, { type: r.headers.get("content-type") || "audio/mpeg" })); }
        else url = URL.createObjectURL(await r.blob());
      } catch (e) { console.info("[loader] could not prefetch", src, e && e.message); }
      try { if (after) await after(url); } catch (e) {}
      end();
    })();
  }
  // a held-back image that a draw now needs: into the first set, load it now
  function want(im) {
    if (phase === "done") return; const k = deferred.findIndex(d => d[0] === im); if (k < 0) return;
    const [, src] = deferred.splice(k, 1)[0]; track(im, src); im.src = src;
  }
  // ---- gate: called by KM.Assets.loadImg before it sets im.src. true = held back until the first set is in.
  const extra = () => ((window.KM_DATA && KM_DATA.preload && KM_DATA.preload.firstSet) || []);
  function gate(im, src) {
    if (phase === "done") return false;
    const all = window.KM_DATA && KM_DATA.preload && KM_DATA.preload.all; // everything joins the bar, nothing waits for after it
    if (!all && !CRIT.test(src) && !extra().some(k => src.includes(k))) { deferred.push([im, src]); return true; }
    track(im, src); return false;
  }
  // a promise the bar must wait for (image decode, fonts, warmed sounds); counts as one small file
  function hold(promise, src = "") {
    if (phase === "done" || !promise) return promise; const w = src ? size(src) / 4 : 4000, tok = {}; totW += w; pend.add(tok); lastChange = performance.now(); draw();
    const end = () => { if (!pend.delete(tok)) return; doneW += w; lastChange = performance.now(); draw(); };
    Promise.resolve(promise).then(end, end); return promise;
  }
  // resolves once every first-set image is in (and nothing new was asked for for 300 ms), or after maxMs
  function ready(maxMs = 90000) {
    const t0 = performance.now();
    return new Promise(res => { const tick = () => { const now = performance.now();
      if ((totW > 0 && !pend.size && now - lastChange > 500 && shown >= 1) || now - t0 > maxMs) return res(); setTimeout(tick, 100); }; tick(); }); // shown >= 1: the drawn bar has filled
  }
  const sketch = new URLSearchParams(location.search).get('biome') === 'sketchbook';
  const artwork = !sketch && KM.LoadingArt ? KM.LoadingArt(ov, track) : null;
  function finish() {
    if (phase === "done") return; phase = "done"; shown = 1; paintBar();
    deferred.splice(0).forEach(([im, src]) => { im.src = src; });
    setTimeout(() => {
      if (artwork) artwork.dissolve(() => ov.remove());
      else { ov.classList.add("out"); setTimeout(() => ov.remove(), 450); }
    }, 150);
  }
  return { gate, want, hold, fetch: fetchFile, ready, finish, phase: () => phase, progress: () => ({ done: doneW, total: totW, pending: pend.size, deferred: deferred.length, shown }) };
})();
