// Upgrade card rules: which cards can be offered, and the summed effects / costs of the cards a run holds.
window.KM = window.KM || {};
KM.Cards = (() => {
  const C = KM_DATA.upgradeCards, byId = id => C.list.find(c => c.id === id);
  const held = S => (S.cards || []).map(byId).filter(Boolean);
  const has = (S, id) => (S.cards || []).includes(id);
  const roles = S => new Set(S.party.filter(KM.PartyAbilities.alive).map(m => KM.PartyAbilities.role(m)));
  function offer(S, rand = Math.random) { // cards the party could use and doesn't hold yet
    const r = roles(S), pool = C.list.filter(c => !has(S, c.id) && (!c.owner || r.has(c.owner)));
    return pool.map(c => [rand(), c]).sort((a, b) => a[0] - b[0]).slice(0, C.offered).map(x => x[1]);
  }
  const sum = (S, key) => held(S).reduce((n, c) => n + (c.effect[key] || 0), 0);
  const levelBonus = (S, role) => held(S).reduce((n, c) => n + ((c.cost.level || {})[role] || 0), 0);
  const missChip = S => held(S).reduce((n, c) => n + (c.cost.missChip || 0), 0);
  return { list: C.list, byId, has, offer, knightTargets: S => sum(S, 'knightTargets'), burn: S => sum(S, 'burn'), wizardDamage: S => sum(S, 'wizardDamage'),
    cleanRefill: S => held(S).some(c => c.effect.cleanRefill), levelBonus, missChip };
})();
