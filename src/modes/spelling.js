// v12k (Magnus): the spelling challenge (the fire bottle's attack). Pure logic + its strip HTML; no game state.
//   const s = KM.Spelling.start(word)  ->  { word, n, bad }   n = letters done, bad = the wrong letter typed (or null)
//   KM.Spelling.key(s, k)              ->  "ok" | "done" | "bad" | "back" | null   (k = "A".."Z" or "back")
//   KM.Spelling.drawWord(s)            ->  HTML for the strip (the ONE place that decides how letters look)
//   KM.Spelling.preload()              ->  load Maggi's letter images
// Rules: a right letter turns done; a wrong one shows in red and blocks until Backspace removes it. Done letters stay.
window.KM = window.KM || {};
KM.Spelling = (function () {
  const recent = []; // words seen lately (no repeats close together)

  function pickWord(list) {
    const fresh = list.filter(w => !recent.includes(w)), pool = fresh.length ? fresh : list;
    const w = pool[Math.floor(Math.random() * pool.length)];
    recent.push(w); if (recent.length > Math.floor(list.length / 2)) recent.shift();
    return w;
  }

  function start(word) { return { word: String(word).toUpperCase(), n: 0, bad: null }; }

  function key(s, k) {
    if (!s || s.n >= s.word.length) return null;
    if (k === "back") { if (!s.bad) return null; s.bad = null; return "back"; }
    k = String(k).toUpperCase(); if (!/^[A-Z]$/.test(k)) return null;
    if (s.bad) return "bad";                       // blocked until Backspace
    if (k !== s.word[s.n]) { s.bad = k; return "bad"; }
    s.n++; return s.n === s.word.length ? "done" : "ok";
  }

  // each letter slot: done (typed right), next (the letter to type), todo (still to type), bad (the wrong letter typed)
  const slot = (s, i) => (i < s.n ? "done" : i === s.n ? (s.bad ? "bad" : "next") : "todo");
  const charAt = (s, i) => (i === s.n && s.bad ? s.bad : s.word[i]);
  // THE one place that decides how the word looks. Maggi's engraved alphabet (window.KM_ALPHABET, src/config/alphabet.js):
  // ink letters at source px x artScale (not typed yet at 35%), the correct/ and wrong/ PNGs for the states, the whole word
  // scaled down to fit maxW. Without it: the sum's carved font (style.css .spellword).
  function drawWord(s, cls) {
    const AB = window.KM_ALPHABET, n = s.word.length;
    if (!AB) return `<div class="spellword ${cls || ""}">${[...s.word].map((_, i) => `<span class="letter ${slot(s, i)}">${charAt(s, i)}</span>`).join("")}</div>`;
    const art = KM_LAYOUT.artScale, total = [...Array(n)].reduce((w, _, i) => w + (AB.w[charAt(s, i)] || 170), 0) * art;
    const k = art * Math.min(1, AB.maxW / total); // stage px per source px
    const src = (ch, st) => AB.dir + (st === "done" ? AB.done : st === "bad" ? AB.bad : "") + ch + ".png";
    return `<div class="spellword art ${cls || ""}">${[...Array(n)].map((_, i) => { const ch = charAt(s, i), st = slot(s, i);
      return `<img class="letter ${st}" src="${src(ch, st)}" alt="${ch}" style="width:${((AB.w[ch] || 170) * k).toFixed(1)}px;height:${(AB.h * k).toFixed(1)}px">`; }).join("")}</div>`;
  }
  // load every letter early so the first word never pops in
  function preload() { const AB = window.KM_ALPHABET; if (!AB) return; for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") ["", AB.done, AB.bad].forEach(d => KM.Assets.loadImg(AB.dir + d + ch + ".png")); }

  return { pickWord, start, key, drawWord, preload };
})();
