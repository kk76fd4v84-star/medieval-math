// Builds the ordered list of road stops: data encounters + auto-inserted rest stops after battles.
window.KM = window.KM || {};
KM.Road = (function () {
  const isBattle = st => st.type === "math" || st.type === "boss";
  function legacy() {
    const R = KM_DATA.restStops, out = []; let battles = 0, rest = 0;
    KM_DATA.encounters.forEach((e, i) => {
      out.push(Object.assign({ src: i }, e));
      if (isBattle(e) && ++battles % (R.every || 1) === 0 && i < KM_DATA.encounters.length - 1) {
        const kind = R.rotation[rest++ % R.rotation.length];
        out.push({ type: "rest", rest: kind, gap: KM_DATA.world.restGap || 1300 });
      }
    });
    return out;
  }
  // index of the first stop after the n-th battle (0 = start of the road)
  function indexAfterBattles(n) {
    const list = legacy(); if (n <= 0) return 0; let b = 0;
    for (let i = 0; i < list.length; i++) if (isBattle(list[i]) && ++b === n) return i + 1;
    return list.length - 1;
  }
  function build(version=0, seed="run") { return version ? KM.Progression.route(seed,version) : legacy(); }
  return { build, indexAfterBattles, isBattle };
})();
