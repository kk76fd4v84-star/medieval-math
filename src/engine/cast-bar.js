// Cast bar (switch castBar): which meter icons moved and whether that helps. Data: src/data/cast_bar.js.
// Pure parts (on, changes, motion) are tested.
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
  const fill = good => D().fills[good ? 'good' : 'bad'];
  // Magnus: the icons may only slide in a boss shift. st = {} kept between meter updates; prev / next = icon positions.
  // 'roar'    = the boss's first shift this fight (from the layout it found, remembered as st.base);
  // 'restore' = the icons going back to that remembered layout (the boss's pressure gone: it died, or the fight ended);
  // 'snap'    = anything else (companions, gear, scenes, a load, mid-fight changes): they jump, no sound, no trail.
  function motion(st, roar, prev, next) {
    const moved = changes(prev, next).length > 0;
    if (roar && moved && !st.roared) { st.roared = true; st.base = prev; return 'roar'; }
    if (moved && st.base && !changes(next, st.base).length) { st.base = null; return 'restore'; }
    if (!roar) { st.roared = false; st.base = null; }
    return 'snap';
  }
  return { on, changes, fill, motion };
})();
