// Math problem generators. Levels/ranges live in src/data/math_levels.js.
window.KM = window.KM || {};
KM.MathGen = (function () {
  const R = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
  const gens = {
    add: g => { const a = R(g.a), b = R(g.b); return { text: `${a} + ${b}`, answer: a + b }; },
    sub: g => { let a = R(g.a), b = R(g.b); if (b > a) [a, b] = [b, a]; return { text: `${a} − ${b}`, answer: a - b }; },
    mul: g => { const a = R(g.a), b = R(g.b); return { text: `${a} × ${b}`, answer: a * b }; },
    div: g => { const d = R(g.divisor), q = R(g.quotient); return { text: `${d * q} ÷ ${d}`, answer: q }; },
    mul_add: g => { const a = R(g.a), b = R(g.b), c = R(g.c); return { text: `${a} × ${b} + ${c}`, answer: a * b + c }; },
    chain: g => { const a = R(g.a), b = R(g.b); const c = Math.min(R(g.c), a + b); return { text: `${a} + ${b} − ${c}`, answer: a + b - c }; },
    paren: g => { const a = R(g.a), b = R(g.b), c = R(g.c); return { text: `(${a} + ${b}) × ${c}`, answer: (a + b) * c }; }
  };
  let lastText = "";
  function make(level) {
    const list = KM_DATA.mathLevels[level] || KM_DATA.mathLevels.normal;
    for (let tries = 0; tries < 10; tries++) {
      const tot = list.reduce((s, g) => s + g.weight, 0);
      let r = Math.random() * tot, g = list[0];
      for (const x of list) { if ((r -= x.weight) < 0) { g = x; break; } }
      const p = gens[g.type](g);
      if (p.text !== lastText && p.answer >= 0) { lastText = p.text; return p; }
    }
    return { text: "13 + 12", answer: 25 };
  }
  return { make, gens };
})();
