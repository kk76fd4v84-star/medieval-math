// Cast bar (switch castBar): which meter icons moved and whether that helps. Data: src/data/cast_bar.js.
// Pure parts (on, changes) are tested; tint() recolours the timer fill picture for the trail.
window.KM = window.KM || {};
KM.CastBar = (() => {
  const D = () => KM_DATA.castBar;
  const on = () => !!(KM.BalanceTry && KM.BalanceTry.on('castBar'));
  // an icon further right = a longer block / crit / normal window = helps the player
  function changes(prev, next) {
    if (!prev || !next) return [];
    return D().icons.filter(id => Number.isFinite(prev[id]) && Number.isFinite(next[id]) && Math.abs(next[id] - prev[id]) >= D().minMove)
      .map(id => ({ id, from: prev[id], to: next[id], good: next[id] > prev[id] }));
  }
  const colour = good => D().colours[good ? 'good' : 'bad'];
  // the orange fill picture recoloured (keeps its ink texture and edges); null until the picture has loaded
  const tints = {}; let fill;
  function tint(c) {
    if (tints[c] !== undefined) return tints[c];
    if (typeof document === 'undefined' || !document.createElement) return null;
    if (!fill) { fill = new Image(); fill.src = 'assets/timing-woodcut/fill.png'; }
    if (!fill.complete || !fill.naturalWidth) return null;
    try {
      const cv = document.createElement('canvas'); cv.width = fill.naturalWidth; cv.height = fill.naturalHeight;
      const x = cv.getContext('2d'); x.drawImage(fill, 0, 0);
      x.globalCompositeOperation = 'color'; x.fillStyle = c; x.fillRect(0, 0, cv.width, cv.height);
      x.globalCompositeOperation = 'destination-in'; x.drawImage(fill, 0, 0);
      return (tints[c] = cv.toDataURL());
    } catch (e) { return (tints[c] = null); }
  }
  return { on, changes, colour, tint };
})();
