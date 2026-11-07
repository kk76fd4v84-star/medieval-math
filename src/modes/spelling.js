// v12k/v12m (Magnus): the spelling challenge (the fire bottle's attack). Pure logic + its strip HTML; no game state.
//   const s = KM.Spelling.start(word)  ->  { word, n, at, missAt }   n = letters done, at[i] = when letter i was typed (ms),
//                                                                     missAt = when the last wrong key hit the current letter
//   KM.Spelling.key(s, k)              ->  "ok" | "done" | "bad" | null   (k = "A".."Z"; anything else is ignored)
//   KM.Spelling.drawWord(s, cls)       ->  HTML for the strip (the ONE place that decides how letters look)
//   KM.Spelling.preload()              ->  load Maggi's letters and tint them (grey / hot / cooled)
// Rules (v12m): a right letter is done; a wrong key only shakes the current letter (it stays grey). No Backspace step.
// Look + timing: KM_DATA.items.fireBottle.letters (colours, cool time, shake).
window.KM = window.KM || {};
KM.Spelling = (function () {
  const LOOK = () => KM_DATA.items.fireBottle.letters;
  const TONES = ["grey", "hot", "cooled"];
  const now = () => performance.now();
  const recent = []; // words seen lately (no repeats close together)

  function pickWord(list) {
    const fresh = list.filter(w => !recent.includes(w)), pool = fresh.length ? fresh : list;
    const w = pool[Math.floor(Math.random() * pool.length)];
    recent.push(w); if (recent.length > Math.floor(list.length / 2)) recent.shift();
    return w;
  }

  function start(word) { return { word: String(word).toUpperCase(), n: 0, at: [], missAt: null }; }

  function key(s, k) {
    if (!s || s.n >= s.word.length) return null;
    k = String(k).toUpperCase(); if (!/^[A-Z]$/.test(k)) return null;
    if (k !== s.word[s.n]) { s.missAt = now(); return "bad"; }
    s.at[s.n++] = now(); s.missAt = null;
    while(s.word[s.n]===' ')s.n++;
    return s.n === s.word.length ? "done" : "ok";
  }

  // ---- tinting: Maggi's ink letter, recoloured with source-atop (one small data URL per letter + tone, made once)
  const tinted = {}; // "A:grey" -> data URL
  function tint(img, colour) {
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-atop"; g.fillStyle = colour; g.fillRect(0, 0, c.width, c.height);
    try { return c.toDataURL("image/png"); } catch (e) { return null; } // file:// can taint the canvas: fall back to the ink PNG
  }
  function preload() {
    const AB = window.KM_ALPHABET; if (!AB) return;
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      const im = KM.Assets.loadImg(AB.dir + ch + ".png");
      const make = () => TONES.forEach(t => { tinted[ch + ":" + t] = tint(im, LOOK()[t]); });
      if (im.complete && im.naturalWidth) make(); else im.addEventListener("load", make, { once: true });
    }
  }
  const src = (AB, ch, tone) => tinted[ch + ":" + tone] || AB.dir + ch + ".png";

  // each letter: done (typed right: hot, cooling to black), next (the one to type: grey, bobs), todo (grey)
  const slot = (s, i) => (i < s.n ? "done" : i === s.n ? "next" : "todo");
  // a running CSS animation keeps its place across re-renders: start it `age` seconds in (negative delay)
  const since = t => (t == null ? 0 : (now() - t) / 1000).toFixed(3);

  // THE one place that decides how the word looks. Maggi's engraved alphabet (window.KM_ALPHABET, src/config/alphabet.js)
  // at source px x artScale, the whole word scaled down to fit maxW. Without it: the sum's carved font, same colours.
  function drawWord(s, cls) {
    const AB = window.KM_ALPHABET, L = LOOK(), n = s.word.length;
    const vars = `--grey:${L.grey};--hot:${L.hot};--cooled:${L.cooled};--glow:${L.glow};--glowpx:${L.glowPx}px;--cool:${L.coolSecs}s;--shake:${L.shakeSecs}s;--shakepx:${L.shakePx}px`;
    const shaking = i => i === s.n && s.missAt != null && (now() - s.missAt) / 1000 < L.shakeSecs;
    const missAttr = i => (shaking(i) ? `class="miss" style="animation-delay:-${since(s.missAt)}s"` : "");
    const coolDelay = i => `style="animation-delay:-${since(s.at[i])}s"`;
    if (!AB) return `<div class="spellword ${cls || ""}" style="${vars}">${[...s.word].map((ch, i) => slot(s, i) === "done"
      ? `<span class="letter done" ${coolDelay(i)}>${ch}</span>` : `<span class="letter ${slot(s, i)}"><b ${missAttr(i)}>${ch}</b></span>`).join("")}</div>`;
    const art = KM_LAYOUT.artScale, total = [...s.word].reduce((w, ch) => w + (AB.w[ch] || 170), 0) * art;
    const k = art * Math.min(1, AB.maxW / total); // stage px per source px
    return `<div class="spellword art ${cls || ""}" style="${vars}">${[...s.word].map((ch, i) => {
      if(ch===' ')return `<span class="wordgap" style="width:${80*k}px" aria-hidden="true"></span>`;
      const st = slot(s, i), size = `width:${((AB.w[ch] || 170) * k).toFixed(1)}px;height:${(AB.h * k).toFixed(1)}px`;
      const inner = st === "done"
        ? `<img src="${src(AB, ch, "cooled")}" alt="${ch}"><img class="hot" src="${src(AB, ch, "hot")}" alt="" ${coolDelay(i)}>`
        : `<img ${missAttr(i)} src="${src(AB, ch, "grey")}" alt="${ch}">`;
      return `<span class="letter ${st}" style="${size}">${inner}</span>`;
    }).join("")}</div>`;
  }

  return { pickWord, start, key, drawWord, preload };
})();
