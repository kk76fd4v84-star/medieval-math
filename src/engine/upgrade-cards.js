// Upgrade card rules: which cards can be offered, and the summed effects / costs of the cards a run holds.
// cardsV2 switch: the v2 list (KM_DATA.upgradeCardsV2); picking a held card again raises its level (S.cards keeps one id per pick).
window.KM = window.KM || {};
KM.Cards = (() => {
  const V2 = !!(KM.BalanceTry && KM.BalanceTry.on('cardsV2'));
  const C = V2 ? KM_DATA.upgradeCardsV2 : KM_DATA.upgradeCards, byId = id => C.list.find(c => c.id === id);
  const lv = (S, id) => (S.cards || []).filter(x => x === id).length;
  const held = S => [...new Set(S.cards || [])].map(byId).filter(Boolean);
  const has = (S, id) => lv(S, id) > 0;
  const roles = S => new Set(S.party.filter(KM.PartyAbilities.alive).map(m => KM.PartyAbilities.role(m)));
  const open = (S, c) => V2 ? lv(S, c.id) < (c.max || 1) : !has(S, c.id);
  function offer(S, rand = Math.random) { // cards the party could use and hasn't maxed (v1: doesn't hold yet)
    const r = roles(S), pool = C.list.filter(c => open(S, c) && (!c.owner || r.has(c.owner)));
    return pool.map(c => [rand(), c]).sort((a, b) => a[0] - b[0]).slice(0, C.offered).map(x => x[1]);
  }
  // v2: a card's value at the run's level (arrays per level, plain numbers flat); 0 / null when not held
  const at = (S, id, key) => { const c = byId(id), n = lv(S, id); if (!c || !n || c[key] == null) return 0; const v = c[key]; return Array.isArray(v) ? v[Math.min(n, v.length) - 1] : v; };
  const sum = (S, key) => V2 ? held(S).reduce((n, c) => n + (at(S, c.id, key) || 0), 0) : held(S).reduce((n, c) => n + (c.effect[key] || 0), 0);
  const levelBonus = (S, role) => held(S).reduce((n, c) => n + (((V2 ? c.level : c.cost.level) || {})[role] || 0), 0);
  const missChip = S => held(S).reduce((n, c) => n + ((V2 ? c.missChip : c.cost.missChip) || 0), 0);
  const shrink = S => held(S).reduce((o, c) => ({ crit: o.crit + ((c.shrink || {}).crit || 0), block: o.block + ((c.shrink || {}).block || 0) }), { crit: 0, block: 0 });
  return { v2: V2, data: C, list: C.list, byId, has, lv, at, offer, shrink, knightTargets: S => V2 ? 0 : sum(S, 'knightTargets'), burn: S => V2 ? 0 : sum(S, 'burn'), wizardDamage: S => sum(S, 'wizardDamage'),
    cleanRefill: S => !V2 && held(S).some(c => c.effect.cleanRefill), levelBonus, missChip };
})();
