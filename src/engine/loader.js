// v12f loading bar (Magnus): parchment, his divider line, the answer timer's orange fill growing from the centre
// ornament out, a small "Loading". Only the title / intro / road art loads first (CRIT); every other image asked for
// while the bar is up waits (src set later) and streams in behind the title. Progress = bytes of the first set
// (sizes from src/config/asset_sizes.js, written by km_site_deploy.sh; unknown files count 60 KB).
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
  ov.innerHTML = `<div class="ld-bar"><img alt="" src="assets/v11/ui/divider.png"><canvas width="2128" height="66"></canvas></div><div class="ld-txt">Loading</div>`;
  document.body.appendChild(ov);
  const dimg = ov.querySelector("img"), cv = ov.querySelector("canvas");
  const paint = () => { const x = cv.getContext("2d"); x.drawImage(dimg, 0, 0, cv.width, cv.height); x.globalCompositeOperation = "source-in"; x.fillStyle = ORANGE; x.fillRect(0, 0, cv.width, cv.height);
    x.globalCompositeOperation = "source-over"; x.clearRect((ORN - ORNH) * cv.width, 0, ORNH * 2 * cv.width, cv.height); };
  dimg.complete && dimg.naturalWidth ? paint() : dimg.addEventListener("load", paint);
  function draw() {
    const f = totW ? doneW / totW : 0; shown = Math.max(shown, Math.min(1, f));
    const l = (ORN - ORNH) * (1 - shown), r = (1 - ORN - ORNH) * (1 - shown);
    cv.style.clipPath = `inset(0 ${(r * 100).toFixed(2)}% 0 ${(l * 100).toFixed(2)}%)`; cv.style.opacity = shown > 0 ? 1 : 0;
  }
  draw();
  function track(im, src) {
    const w = size(src); totW += w; pend.add(im); lastChange = performance.now();
    const fin = () => { if (!pend.delete(im)) return; doneW += w; lastChange = performance.now(); draw(); };
    im.addEventListener("load", fin); im.addEventListener("error", fin); draw();
  }
  // a held-back image that a draw now needs: into the first set, load it now
  function want(im) {
    if (phase === "done") return; const k = deferred.findIndex(d => d[0] === im); if (k < 0) return;
    const [, src] = deferred.splice(k, 1)[0]; track(im, src); im.src = src;
  }
  // ---- gate: called by KM.Assets.loadImg before it sets im.src. true = held back until the first set is in.
  function gate(im, src) {
    if (phase === "done") return false;
    if (!CRIT.test(src)) { deferred.push([im, src]); return true; }
    track(im, src); return false;
  }
  // resolves once every first-set image is in (and nothing new was asked for for 300 ms), or after maxMs
  function ready(maxMs = 90000) {
    const t0 = performance.now();
    return new Promise(res => { const tick = () => { const now = performance.now();
      if ((totW > 0 && !pend.size && now - lastChange > 500) || now - t0 > maxMs) return res(); setTimeout(tick, 100); }; tick(); });
  }
  function finish() {
    if (phase === "done") return; phase = "done"; shown = 1; draw();
    deferred.splice(0).forEach(([im, src]) => { im.src = src; });
    setTimeout(() => { ov.classList.add("out"); setTimeout(() => ov.remove(), 450); }, 150);
  }
  return { gate, want, ready, finish, phase: () => phase, progress: () => ({ done: doneW, total: totW, pending: pend.size, deferred: deferred.length, shown }) };
})();
