// Juice (switch juice): every digit lands heavy with a clang, Enter punches, a wrong Enter is blocked. Data: src/data/juice.js.
// Cheap: CSS animations on the elements the game already re-renders, pooled sfx (KM.Audio), nothing waits on it.
window.KM = window.KM || {};
KM.Juice = (() => {
  const D = () => KM_DATA.juice, on = () => !!(KM.BalanceTry && KM.BalanceTry.on('juice'));
  const turn = {}; // sfx list -> next index (a list alternates)
  function sound(c) {
    const i = turn[c.sfx] = ((turn[c.sfx] ?? -1) + 1) % c.sfx.length;
    KM.Audio.play(c.sfx[i], { gain: (c.gain ?? 1) * (D().vol?.[c.sfx[i]] ?? 1), rate: 1 + (Math.random() * 2 - 1) * (c.pitch || 0) });
  }
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  function key(k, el) { // after the answer box shows the new input: k = a digit or 'back'
    if (!on() || !el) return;
    if (k === 'back') return sound(D().back);
    const c = D().digit; sound(c); const g = el.lastElementChild; if (!g) return;
    g.classList.add('juice-land'); if (c.spark) el.insertAdjacentHTML('beforeend', '<i class="juice-spark" aria-hidden="true"></i>');
  }
  function enter(right, el, S) { // a submitted answer
    if (!on()) return; const c = right ? D().enter : D().wrong; sound(c);
    if (el) restart(el, right ? 'juice-punch' : 'juice-block'); S.shake = Math.max(S.shake || 0, c.shake || 0);
  }
  function init() { // timings + sizes -> CSS variables, Charlie's sounds warmed
    if (!on()) return; const d = D(), st = document.documentElement.style;
    st.setProperty('--juice-land', d.digit.ms + 'ms'); st.setProperty('--juice-drop', -d.digit.drop + 'px'); st.setProperty('--juice-squash', d.digit.squash);
    st.setProperty('--juice-punch', d.enter.ms + 'ms'); st.setProperty('--juice-punch-squash', d.enter.squash); st.setProperty('--juice-block', d.wrong.ms + 'ms');
    KM.Audio.warm(Object.values(d).flatMap(c => c.sfx || []));
  }
  return { on, key, enter, init };
})();
