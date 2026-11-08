// Meter pressure (switch meterPressure): foes push the timing meter, gear pushes back. Data: src/data/meter_pressure.js.
// Pure maths here; game.js only asks for windows / tags / shop items and plays the optional sounds.
window.KM = window.KM || {};
KM.MeterPressure = (() => {
  const D = () => KM_DATA.meterPressure, R = () => KM_DATA.combat.timing;
  const TYPES = ['quick', 'heavy', 'slippery', 'shroud'];
  const on = () => !!(KM.BalanceTry && KM.BalanceTry.on('meterPressure'));
  const snap = n => Math.round(n * 1e6) / 1e6, clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  // per type, only the strongest living foe counts (a pack never stacks)
  function strongest(foes) {
    const out = { quick: 0, heavy: 0, slippery: 0, shroud: 0 };
    for (const f of foes || []) { const p = D().foes[f.id || f] || {}; for (const k of TYPES) out[k] = Math.max(out[k], p[k] || 0); }
    return out;
  }
  // gear first cancels its pressure (never beyond clean); leftover weapon / armour widens the bands as before
  function windows({ weapon = 0, armour = 0, companions = 0, helm = 0, lantern = 0, foes = [] } = {}) {
    const r = R(), L = D().limits, G = D().gear, p = strongest(foes);
    const use = (levels, step, need) => { const got = Math.min(need, Math.max(0, levels) * step); return [need - got, Math.max(0, levels - got / step)]; };
    const [slip, wLeft] = use(weapon, r.weaponStep, p.slippery);
    const [heavy, aLeft] = use(armour, r.armourStep, p.heavy);
    const count = Math.min(r.companionCap, Math.max(0, Math.floor(companions))), party = count * r.companionStep;
    const [partyBlock, aRest] = use(aLeft, r.armourStep, party);
    const unpressured = { crit: snap(Math.min(r.critCap, r.critBefore + Math.max(0, weapon) * r.weaponStep)),
      block: snap(Math.min(r.blockCap, r.blockThrough + Math.max(0, armour) * r.armourStep)), normal: r.normalThrough };
    const critBase = Math.min(r.critCap, r.critBefore + wLeft * r.weaponStep), blockBase = Math.min(r.blockCap, r.blockThrough + aRest * r.armourStep);
    const crit = snap(Math.max(L.critMin, critBase - party - slip));
    const block = snap(Math.min(crit - L.bandGap, Math.max(L.blockMin, blockBase - partyBlock - heavy)));
    const quick = snap(clamp(p.quick - Math.max(0, helm) * G.helm.step, 0, L.quickMax));
    const ink = snap(clamp(p.shroud - Math.max(0, lantern) * G.lantern.step, 0, L.inkMax));
    return { crit, block, normal: r.normalThrough, unpressured, meter: true,
      partyPressure: { count, crit: snap(Math.min(party, critBase - L.critMin)), block: snap(partyBlock) },
      enemyPressure: { crit: snap(slip), block: snap(heavy) },
      quick, ink: ink ? [block, snap(Math.min(1, block + ink))] : null,
      tags: TYPES.filter(k => (k === 'quick' ? quick : k === 'shroud' ? ink : k === 'heavy' ? heavy : slip) > 0) };
  }
  const seconds = (secs, w) => (w && w.quick ? snap(secs * (1 - w.quick)) : secs);
  // optional painted tag / shop art: used once it has loaded, else the text tag or glyph stays
  const art = {};
  function image(id) {
    if (typeof Image === 'undefined' || !(D().artIds || []).includes(id)) return null; // only files listed in data
    if (!(id in art)) { const im = new Image(); art[id] = null; im.onload = () => (art[id] = im.src); im.src = D().art + id + '.png'; }
    return art[id];
  }
  const tagHTML = id => { const src = image(id), t = D().tags[id]; return src ? `<img class="mp-tag" src="${src}" alt="${t}">` : `<span class="mp-tag">${t}</span>`; };
  // shop: which party items this stop sells (keys: shop<tier>, tavern<n>, <chapter>:shop)
  function sells(st, stops, chapter) {
    if (!on() || !st) return [];
    const nth = st.shopTier || (stops || []).filter(s => s.rest === st.rest).indexOf(st) + 1;
    const keys = [st.rest + nth, chapter + ':' + st.rest];
    return Object.entries(D().sell).filter(([, at]) => at.some(k => keys.includes(k))).map(([id]) => id);
  }
  const level = (S, id) => (S.meterGear && S.meterGear[id]) || 0;
  const cost = (S, id) => { const g = D().gear[id], n = level(S, id); return n < g.max ? g.cost[n] : null; };
  function buy(S, id) { const c = cost(S, id); if (c == null || S.gold < c) return false; S.gold -= c; S.meterGear = { ...(S.meterGear || {}), [id]: level(S, id) + 1 }; return true; }
  // switch on: look for the optional art right away, so it is found (or known missing) while the loading bar is up
  if (on() && typeof Image !== 'undefined') [...TYPES, ...Object.keys(D().gear).filter(k => D().gear[k].cost)].forEach(image);
  return { on, TYPES, strongest, windows, seconds, tagHTML, sells, level, cost, buy, image };
})();
