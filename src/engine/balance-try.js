// Reads KM_DATA.balanceTry switches (data file) with ?curve / ?halfhearts / ?camparmour page overrides.
window.KM = window.KM || {};
KM.BalanceTry = (() => {
  const B = KM_DATA.balanceTry, q = new URLSearchParams(location.search);
  const flag = (key, param) => q.has(param) ? q.get(param) !== '0' : !!B[key];
  const sw = { curve: flag('curve', 'curve'), halfHearts: flag('halfHearts', 'halfhearts'), campArmour: flag('campArmour', 'camparmour'), whoActs: flag('whoActs', 'whoacts'), cards: flag('cards', 'cards'), gradual: flag('gradual', 'gradual'), meterPressure: flag('meterPressure', 'meterpressure'), castBar: flag('castBar', 'castbar'), knightStart: flag('knightStart', 'knightstart'), chestCards: flag('chestCards', 'chestcards'), toughFoes: flag('toughFoes', 'toughfoes'), brawl: flag('brawl', 'brawl') };
  if (sw.chestCards) sw.cards = true;
  if (sw.cards || sw.gradual) sw.whoActs = true;

  const on = name => !!sw[name];
  const unit = () => sw.halfHearts ? 2 : 1; // heart units per drawn heart
  if (sw.halfHearts && KM_DATA.party) KM_DATA.party.heartsPerMember *= 2;
  const fights = st => ['math', 'boss', 'mega'].includes(st && st.type);
  function healthMul(S) { // Fellowship only; the classic x2 when the curve is off
    if (!sw.curve) return null;
    const done = S.stops.slice(0, S.stop).filter(fights).length + (B.battlesBefore[S.chapter] || 0);
    return Math.min(B.health.max, B.health.start + B.health.step * done);
  }
  const tough = id => sw.toughFoes ? (B.tough && B.tough[id]) || 1 : 1; // Fellowship health x this per foe
  const packRelay = e => sw.curve && B.packsTakeTurns && e.foes && e.foes.length > 1;
  function bossAtk(e, base) { // per enemy turn; e.turns counts finished enemy turns
    if (!sw.curve || !['boss', 'mega'].includes(e.st.type)) return base;
    return ((e.turns || 0) + 1) % B.boss.roarEvery === 0 ? B.boss.roarAtk : B.boss.atk;
  }
  const heartsText = n => { const u = unit(), w = n / u; return u === 1 ? String(n) : (w % 1 ? (Math.floor(w) || '') + '½' : String(w)); };
  // whoActs: pick the member whose sum comes next, weighted by role, level and the fight's situation
  function pickLeader(members, ctx, rand = Math.random, bonus = () => 0) {
    const role = m => KM.PartyAbilities.role(m), lvl = m => Math.min(3, 1 + Math.max(0, m.weapon || 0) + bonus(role(m)));
    const sit = [ctx.foes <= 2 && 'small', ctx.foes >= 3 && 'pack', ctx.boss && 'boss', ctx.hurt && 'hurt'].filter(Boolean);
    const weighted = members.filter(m => B.roles[role(m)]).map(m => {
      let w = B.roles[role(m)].weight + B.levelWeight * (lvl(m) - 1);
      for (const k of sit) w *= B.situations[k][role(m)] ?? 1;
      return { m, w };
    });
    if (!weighted.length) return null;
    let r = rand() * weighted.reduce((n, x) => n + x.w, 0), pick = weighted[0];
    for (const x of weighted) { if ((r -= x.w) < 0) { pick = x; break; } }
    const sign = B.roles[role(pick.m)].sign;
    const L = B.ladder[sign], step = Math.floor((ctx.correct || 0) / B.everyCorrect) + lvl(pick.m) - 1; // gradual: slow climb
    const level = sw.gradual ? L[Math.min(L.length - 1, step)] : B.sums[sign][lvl(pick.m) - 1];
    return { member: pick.m, sign, cue: B.roles[role(pick.m)].cue, level, multiplier: B.leaderMultiplier };
  }
  return { on, unit, healthMul, tough, packRelay, bossAtk, heartsText, pickLeader };
})();
