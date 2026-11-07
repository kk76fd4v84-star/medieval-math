// Existing woodcut assets, drawn at the game's global art scale.
window.KM = window.KM || {};
KM.LoadingArt = function (overlay, track) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ld-scenery'; canvas.width = 1600; canvas.height = 900;
  canvas.setAttribute('aria-hidden', 'true'); overlay.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const source = document.createElement('canvas'); source.width = 1600; source.height = 900;
  const ink = source.getContext('2d');
  let ended = false, raf = 0;
  const placements = [
    { file: 'parallax-01-castle', x: 148, y: 110, opacity: .48 },
    { file: 'tree-0', x: 20, y: 240, opacity: .8 },
    { file: 'tree-1', x: 1152, y: 255, opacity: .75 }
  ];
  function paint() {
    if (ended) return;
    ink.clearRect(0, 0, 1600, 900);
    const scale = window.KM_LAYOUT ? KM_LAYOUT.art : .6;
    for (const p of placements) if (p.image.naturalWidth) {
      ink.globalAlpha = p.opacity;
      const w = p.image.naturalWidth * scale, h = p.image.naturalHeight * scale;
      const x = p.file === 'tree-0' ? 18 : p.file === 'tree-1' ? 1582-w : (1600-w)/2;
      const y = (p.file.startsWith('tree') ? 635 : 545)-h;
      ink.drawImage(p.image, x, y, w, h);
    }
    ink.globalAlpha = 1; ctx.clearRect(0, 0, 1600, 900); ctx.drawImage(source, 0, 0);
  }
  placements.forEach(p => {
    p.image = new Image(); const url = 'assets/v10/ink/' + p.file + '.png';
    track(p.image, url); p.image.addEventListener('load', paint); p.image.src = url;
  });
  // Input stays behind the overlay until the reveal has finished.
  const block = e => { e.preventDefault(); e.stopImmediatePropagation(); };
  window.addEventListener('keydown', block, true);
  const cleanup = () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', block, true); };
  function dissolve(done) {
    paint(); ended = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    overlay.classList.add('dissolving');
    if (reduced) {
      overlay.classList.add('out');
      setTimeout(() => { cleanup(); done(); }, 200); return;
    }
    // Deterministic erosion field: overlapping soft holes eat the drawing,
    // while thin fragments of the original ink curl upwards and disperse.
    let seed = 71;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const holes = Array.from({ length: 160 }, () => ({ x: rand()*1600, y: 180+rand()*550, start: rand()*.42, radius: 90+rand()*110 }));
    const flecks = Array.from({ length: 170 }, () => ({ x: rand()*1580, y: 190+rand()*490, w: 10+rand()*30, h: 3+rand()*9, drift: (rand()-.5)*120, rise: 50+rand()*130, delay: rand()*.22 }));
    for (const f of flecks) {
      f.sprite = document.createElement('canvas'); f.sprite.width = 64; f.sprite.height = 24;
      const sx = f.sprite.getContext('2d');
      sx.drawImage(source,f.x,f.y,f.w,f.h,0,0,64,24);
      sx.globalCompositeOperation='destination-in';
      sx.translate(32,12); sx.scale(32,12);
      const fade=sx.createRadialGradient(0,0,0,0,0,1);
      fade.addColorStop(0,'#000'); fade.addColorStop(.35,'rgba(0,0,0,.8)'); fade.addColorStop(1,'transparent');
      sx.fillStyle=fade;sx.fillRect(-1,-1,2,2);
    }
    const start = performance.now(), duration = 1450;
    function frame(now) {
      const t = Math.min(1, (now-start)/duration);
      ctx.clearRect(0,0,1600,900); ctx.globalAlpha = Math.max(0, 1-t*t); ctx.drawImage(source,0,0); ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      for (const h of holes) {
        const u = Math.max(0,(t-h.start)/(1-h.start)); if (!u) continue;
        const r = h.radius*u*2.5, g = ctx.createRadialGradient(h.x,h.y,0,h.x,h.y,r);
        g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(.65,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g;ctx.fillRect(h.x-r,h.y-r,r*2,r*2);
      }
      ctx.globalCompositeOperation='source-over';
      for (const f of flecks) {
        const u=Math.max(0,(t-f.delay)/(1-f.delay)); if (!u) continue;
        ctx.globalAlpha=Math.sin(Math.PI*u)*.36;
        ctx.save();ctx.translate(f.x+Math.sin(u*4)*f.drift,f.y-u*f.rise);
        ctx.rotate(Math.sin(u*3+f.delay)*u*.7);
        ctx.drawImage(f.sprite,0,0,f.w*(1+u*2.8),f.h*(1+u*1.8));ctx.restore();
      }
      ctx.globalAlpha=1;
      if (t<1) raf=requestAnimationFrame(frame);
      else { overlay.classList.add('out'); setTimeout(()=>{cleanup();done();},400); }
    }
    raf=requestAnimationFrame(frame);
  }
  return { dissolve };
};
