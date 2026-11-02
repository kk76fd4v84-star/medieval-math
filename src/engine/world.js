// Parallax layers + procedural placeholder scenery (used until art packs provide backgrounds).
// Draws in SCENE space: 900 tall (KM_LAYOUT.artSpaceH), KM_LAYOUT.viewW wide; caller applies the scale.
window.KM = window.KM || {};
KM.World = (function () {
  function hash(i, s) { let x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }
  const VW = () => KM_LAYOUT.viewW, H = () => KM_LAYOUT.artSpaceH, G = () => KM_DATA.world.groundY;
  function tiles(camX, speed, tileW, fn) {
    const off = camX * speed;
    const first = Math.floor(off / tileW) - 1, last = Math.floor((off + VW()) / tileW) + 1;
    for (let i = first; i <= last; i++) fn(i, i * tileW - off);
  }
  // Painted layers are authored 900 tall; scaled to the scene-space height and tiled horizontally.
  function drawArtLayer(ctx, b, camX, speed) {
    const sc = H() / b.size[1], w = b.size[0] * sc, off = ((camX * speed) % w + w) % w;
    for (let x = -off; x < VW(); x += w) ctx.drawImage(b.img, x, 0, w, H());
  }
  function drawLayer(ctx, L, camX, t) {
    const art = KM.Assets.background(L.art);
    if (art) return drawArtLayer(ctx, art, camX, L.speed);
    const c = L.color, vw = VW(), g = G();
    switch (L.kind) {
      case "sky": {
        const gr = ctx.createLinearGradient(0, 0, 0, g);
        gr.addColorStop(0, "#c7d9e3"); gr.addColorStop(1, "#f1e4c0");
        ctx.fillStyle = gr; ctx.fillRect(0, 0, vw, H());
        ctx.fillStyle = "#f4c85a"; ctx.fillRect(vw - 360, 80, 120, 120); ctx.strokeStyle = "#a5802c"; ctx.lineWidth = 4; ctx.strokeRect(vw - 360, 80, 120, 120);
        for (let i = 0; i < 6; i++) {
          const x = ((i * 497 - t * (10 + i * 4)) % (vw + 400) + vw + 400) % (vw + 400) - 300;
          ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillRect(x, 50 + i * 42, 220 + i * 25, 44);
        }
        break;
      }
      case "mountains": {
        const base = g - 180;
        tiles(camX, L.speed, 600, (i, x) => {
          const h = 220 + hash(i, 1) * 260;
          ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - 120, base); ctx.lineTo(x + 300, base - h); ctx.lineTo(x + 720, base); ctx.fill();
          ctx.fillStyle = "#e9eef4"; ctx.beginPath(); ctx.moveTo(x + 300, base - h); ctx.lineTo(x + 245, base + 55 - h); ctx.lineTo(x + 355, base + 55 - h); ctx.fill();
        });
        break;
      }
      case "castles": {
        const base = g - 130;
        ctx.fillStyle = c; ctx.fillRect(0, base, vw, H() - base);
        tiles(camX, L.speed, 520, (i, x) => {
          const h = 60 + hash(i, 2) * 80;
          ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + 260, base + 15, 330, h, 0, Math.PI, 0); ctx.fill();
          if (hash(i, 3) > 0.72) {
            ctx.fillStyle = "#b9b2a0"; ctx.strokeStyle = "#5d574b"; ctx.lineWidth = 3;
            const cx = x + 170, top = base - 190;
            ctx.fillRect(cx, top + 40, 170, 170); ctx.strokeRect(cx, top + 40, 170, 170);
            ctx.fillRect(cx - 35, top - 20, 50, 230); ctx.strokeRect(cx - 35, top - 20, 50, 230);
            ctx.fillRect(cx + 155, top - 20, 50, 230); ctx.strokeRect(cx + 155, top - 20, 50, 230);
            ctx.fillStyle = "#5d574b"; ctx.font = "20px Georgia"; ctx.textAlign = "center"; ctx.fillText("CASTLE", cx + 85, top + 130);
            ctx.fillStyle = "#b03a2e"; ctx.fillRect(cx - 14, top - 55, 5, 35); ctx.fillRect(cx - 9, top - 55, 26, 14);
          }
        });
        break;
      }
      case "trees": {
        const base = g - 60;
        tiles(camX, L.speed, 300, (i, x) => {
          if (hash(i, 4) < 0.3) return;
          const h = 130 + hash(i, 5) * 130, w = 100 + hash(i, 6) * 70;
          ctx.fillStyle = "#5a4330"; ctx.fillRect(x + 140, base - 100, 26, 100);
          ctx.fillStyle = c; ctx.fillRect(x + 153 - w / 2, base - 90 - h, w, h);
          ctx.strokeStyle = "#2f4a29"; ctx.lineWidth = 3; ctx.strokeRect(x + 153 - w / 2, base - 90 - h, w, h);
        });
        break;
      }
      case "ground":
        ctx.fillStyle = "#7d9a55"; ctx.fillRect(0, g - 75, vw, H() - g + 75);
        ctx.fillStyle = c; ctx.fillRect(0, g - 35, vw, 70);
        ctx.fillStyle = "#8c724a";
        tiles(camX, L.speed, 200, (i, x) => { ctx.fillRect(x + hash(i, 7) * 140, g - 25 + hash(i, 8) * 50, 20, 8); });
        break;
      case "grass":
        ctx.fillStyle = c;
        tiles(camX, L.speed, 240, (i, x) => {
          if (hash(i, 9) < 0.4) return;
          const h = 20 + hash(i, 10) * 30;
          for (let k = 0; k < 4; k++) ctx.fillRect(x + k * 16, H() - h + (k % 2) * 10, 10, h);
        });
        break;
    }
  }
  return { drawLayer, hash };
})();
