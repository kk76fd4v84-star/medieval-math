// D20 player for Magnus's v8 roll atlases (dice/roll-to-N.png: 8x5 cells of 512px, 40 frames x 50ms, settle at 1.6s).
// The RESULT is chosen by game logic first; the matching sheet is played once (non-looping) and its last frame held.
// Sheets are loaded on demand (each is ~8 MB) and dropped afterwards. Fallback: an ink-drawn D20 outline + number.
window.KM = window.KM || {};
KM.D20 = (function () {
  const cfg = () => window.KM_ART7 && KM_ART7.dice;
  const path = (k, n) => KM_ART7.root + cfg()[k].replace("{n}", n);
  function roll(result, label) {
    const d = { result, label: label || "", t: 0, done: false, dur: cfg() ? cfg().frames * cfg().ms / 1000 : 1.6 };
    if (cfg()) { d.sheet = KM.Assets.loadImg(path("roll", result)); d.still = KM.Assets.loadImg(path("still", result)); }
    return d;
  }
  function update(d, dt) { if (!d || d.done) return; d.t += dt; if (d.t >= d.dur) { d.t = d.dur; d.done = true; } }
  const ok = im => im && im._ok && im.naturalWidth > 0;
  // draw centred at (cx, cy) in the current transform, `size` px wide
  function draw(ctx, d, cx, cy, size) {
    const c = cfg();
    if (c) {
      const i = Math.min(c.frames - 1, Math.floor(d.t * 1000 / c.ms));
      const im = d.done && ok(d.still) ? d.still : d.sheet;
      if (ok(im)) {
        const [cw, ch] = c.cell, sx = im === d.still ? 0 : (i % c.cols) * cw, sy = im === d.still ? 0 : Math.floor(i / c.cols) * ch;
        const s = size / cw;
        ctx.drawImage(im, sx, sy, cw, ch, cx - c.pivot[0] * cw * s, cy - c.pivot[1] * ch * s, cw * s, ch * s);
        if (d.label) label(ctx, d.label, cx, cy + size * 0.5);
        return;
      }
    }
    // fallback: an ink icosahedron outline with a tumbling number, settling on the result
    const r = size * 0.42, n = d.done ? d.result : 1 + (Math.floor(d.t * 18) % 20);
    ctx.save(); ctx.translate(cx, cy); if (!d.done) ctx.rotate(Math.sin(d.t * 9) * 0.6 * (1 - d.t / d.dur));
    ctx.fillStyle = "#f3ead3"; ctx.strokeStyle = "#1b1410"; ctx.lineWidth = 5; ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; ctx[k ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1b1410"; ctx.font = `bold ${r * 0.8}px Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(n, 0, 4);
    ctx.restore();
    if (d.label) label(ctx, d.label, cx, cy + size * 0.5);
  }
  function label(ctx, t, x, y) { ctx.fillStyle = "#1b1410"; ctx.font = "italic 34px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(t, x, y); }
  return { roll, update, draw };
})();
