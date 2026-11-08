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
  // Magnus 2026-11-08 (brawl-14): every real window change (gear, cards, camp armour, companions) moves ONLY the changed
  // icons: shake 1 s, slide with the trail, trail holds 1 s, then catches up. st = {} kept between visible meter paints.
  // 'still'   = nothing moved (riddle / recruit sums, scenes);
  // 'roar'    = the boss's first shift this fight (same motion + the roar; the layout it found is kept as st.base);
  // 'restore' = back to that layout (the boss's pressure gone);  'shift' = any other change.
  function motion(st, roar, prev, next) {
    if (!changes(prev, next).length) { if (!roar) { st.roared = false; st.base = null; } return 'still'; }
    if (roar && !st.roared) { st.roared = true; st.base = prev; return 'roar'; }
    if (st.base && !changes(next, st.base).length) { st.base = null; return 'restore'; }
    if (!roar) { st.roared = false; st.base = null; }
    return 'shift';
  }
  return { on, changes, fill, motion };
})();
