// Chest cards (switch chestCards): which stops guard a chest, and the chest + shine drawing. Data: src/data/chest_cards.js.
window.KM = window.KM || {};
KM.ChestCards = (() => {
  const D = () => KM_DATA.chestCards;
  const on = () => !!(KM.BalanceTry && KM.BalanceTry.on('chestCards'));
  const guarded = st => !!(st && ['math', 'boss', 'mega'].includes(st.type) && D().guards.includes(st.enemy));
  // chest at (x, y) = its bottom centre; open = lid up; glow 0..1 = shine behind it
  function draw(ctx, x, y, { open = false, glow = 0 } = {}) {
    const C = D().chest, S = D().shine, s = C.scale;
    if (glow > 0) { const r = S.radius * (0.6 + 0.4 * glow), g = ctx.createRadialGradient(x, y - C.h * s * .5, 4, x, y - C.h * s * .5, r);
      g.addColorStop(0, `rgba(${S.colour},${0.85 * glow})`); g.addColorStop(1, `rgba(${S.colour},0)`);
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(x - r, y - C.h * s * .5 - r, r * 2, r * 2);
      const cy = y - C.h * s * .6, n = S.rays || 0, t = (performance.now() / 4000) % 1; ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) { const a = (i / n + t / n) * Math.PI * 2, r0 = C.w * s * .45, r1 = r * (i % 2 ? .7 : .95);
        ctx.strokeStyle = `rgba(${S.rayColour || S.colour},${0.75 * glow})`; ctx.lineWidth = i % 2 ? 5 : 9;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(x + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke(); }
      ctx.restore(); }
    const src = open ? C.openImg || C.img : C.img, im = src && KM.Assets.loadImg(src);
    if (im && im._ok) { const w = im.naturalWidth * KM_LAYOUT.artScale * s, h = im.naturalHeight * KM_LAYOUT.artScale * s; ctx.drawImage(im, x - w / 2, y - h, w, h); return; }
    // ink placeholder: box, lid, iron bands, lock
    const w = C.w * s, h = C.h * s, body = h * .62;
    ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = '#292018'; ctx.lineJoin = 'round';
    ctx.fillStyle = '#b7713a'; ctx.fillRect(x - w / 2, y - body, w, body); ctx.strokeRect(x - w / 2, y - body, w, body);
    ctx.beginPath();
    if (open) { ctx.moveTo(x - w / 2, y - body); ctx.lineTo(x - w / 2 + 8, y - body - h * .55); ctx.lineTo(x + w / 2 + 8, y - body - h * .55); ctx.lineTo(x + w / 2, y - body); }
    else { ctx.moveTo(x - w / 2, y - body); ctx.quadraticCurveTo(x, y - h - 10, x + w / 2, y - body); }
    ctx.closePath(); ctx.fillStyle = '#9c5a2a'; ctx.fill(); ctx.stroke();
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - w * .3, y); ctx.lineTo(x - w * .3, y - body); ctx.moveTo(x + w * .3, y); ctx.lineTo(x + w * .3, y - body); ctx.stroke();
    if (!open) { ctx.fillStyle = '#d9b46a'; ctx.lineWidth = 3; ctx.fillRect(x - 10, y - body - 6, 20, 22); ctx.strokeRect(x - 10, y - body - 6, 20, 22); }
    ctx.restore();
  }
  return { on, guarded, draw };
})();
