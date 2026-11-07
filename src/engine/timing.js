// Use the displayed divider fraction for both combat and riddle rewards.
window.KM = window.KM || {};
KM.Timing = (() => {
  const rules = () => KM_DATA.combat.timing;
  function fraction(timer, question) {
    if (!timer || timer.q !== question || !(timer.secs > 0)) return null;
    // Keep a hit exactly on a displayed boundary on that boundary despite float division.
    return Math.round(Math.max(0, timer.t / timer.secs)*1e9)/1e9;
  }
  function grade(timer, question) {
    return gradeFraction(fraction(timer, question),timer?.windows);
  }
  const pattern=id=>KM_DATA.combat.patterns?.[id]||{};
  function pressure(foes) {
    return foes.reduce((out,f)=>{const p=pattern(f.id);out.crit=Math.max(out.crit,p.crit||0);out.block=Math.max(out.block,p.block||0);return out;},{crit:0,block:0});
  }
  function windows({weapon=0,armour=0,companions=0,pressure:loss={}}={}) {
    const r=rules(),snap=n=>Math.round(n*1e6)/1e6;
    const base={crit:snap(Math.min(r.critCap,r.critBefore+Math.max(0,weapon)*r.weaponStep)),
      block:snap(Math.min(r.blockCap,r.blockThrough+Math.max(0,armour)*r.armourStep)),normal:r.normalThrough};
    const count=Math.min(r.companionCap,Math.max(0,Math.floor(companions)));
    const partyLoss=count*r.companionStep;
    if(!partyLoss&&!loss.crit&&!loss.block)return base;
    const partyCrit=snap(Math.max(.20,base.crit-partyLoss));
    const partyBlock=snap(Math.min(partyCrit-.05,Math.max(.05,base.block-partyLoss)));
    const crit=snap(Math.max(.20,partyCrit-(loss.crit||0)));
    const block=snap(Math.min(crit-.05,Math.max(.05,partyBlock-(loss.block||0))));
    return {crit,block,normal:base.normal,unpressured:base,
      partyPressure:{count,crit:base.crit-partyCrit,block:base.block-partyBlock},
      enemyPressure:{crit:partyCrit-crit,block:partyBlock-block}};
  }
  function gradeFraction(f,w=windows()) {
    const r=rules();
    if (f === null) return { fraction: null, windows: w, multiplier: 1, crit: false, block: false, points: 1, riddlePoints: 1, coinBonus:false };
    // Blocking and critical damage are distinct rewards, not cumulative.
    const block=f<=w.block,crit=!block&&f<w.crit;
    return {
      fraction: Math.max(0,Math.min(1,f)), windows: w,
      multiplier: crit ? r.critMultiplier : f > w.normal ? r.lateMultiplier : 1,
      crit, block,
      // Equipment moves combat windows, not the existing score thresholds.
      points: f < .25 ? 4 : f < .5 ? 3 : f < .75 ? 2 : 1,
      riddlePoints: f < .5 ? 2 : 1, coinBonus:f < .5
    };
  }
  // Short ink ticks above the fill; leave the existing centre ornament intact.
  function markers(width, height, cy, w=windows()) {
    return `<svg class="timer-markers" viewBox="0 0 ${width} ${height}" aria-hidden="true">${[w.crit,w.block,w.normal].map(f => {
      const x = width * f;
      const d = f === .5 ? `M${x},${cy-28}v10 M${x},${cy+18}v10` : `M${x-1},${cy-19}l1,18 -1,20`;
      return `<path data-threshold="${f}" d="${d}"/>`;
    }).join('')}</svg>`;
  }
  return { fraction, grade, gradeFraction, windows, markers, pattern, pressure };
})();
