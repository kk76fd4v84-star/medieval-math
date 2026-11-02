// v12r (Magnus: "This needs to be solved, the buttons are outside of frame"): the battle move row with every kit
// combination up to the full set (Weak / Hard / Heal / Fire bottle / Roll / Sacrifice | Stupidity): every button inside
// the stage with a margin, every label (icon + text) inside its button minus both frame caps, no button over the prompt
// or the divider, two centred rows only when one row cannot fit (KM_UI.moves). Saves screenshots/v12r/battle_full_kit.png.
// Run: URL=http://localhost:8799/index.html node tests/moves.test.js
const path = require("path");
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = (process.env.URL || "http://localhost:8799/index.html") + "?debug", OUT = path.resolve(__dirname, "../screenshots/v12r");
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await playwright.chromium.launch(), page = await b.newPage({ viewport: { width: 1600, height: 900 } }), errors = [], checks = [];
  page.on("pageerror", e => errors.push(e.message)); const ev = (f, a) => page.evaluate(f, a);
  await page.goto(URL); await ev(() => localStorage.clear()); await page.reload(); await sleep(1000);
  await page.keyboard.press("Enter"); await sleep(300); await page.keyboard.press("Escape"); await sleep(200); await page.fill("#nameInput", "Magnus"); await page.keyboard.press("Enter");
  for (let i = 0; i < 8 && (await ev(() => __km.mode())) !== "walk"; i++) { await page.keyboard.press("Space"); await sleep(150); }
  await ev(() => { __km.debugJump("goblin", ["feather", "scarf", "feather"]); __km.setSpeed(4); });
  for (let i = 0; i < 200 && (await ev(() => __km.phase())) !== "choose"; i++) { if ((await ev(() => __km.phase())) === "approach") { await ev(() => __km.setSpeed(1)); await page.keyboard.press("Enter"); } await sleep(150); }
  await ev(() => __km.setSpeed(1));
  const kits = [
    { name: "basic (no kit, alone)", bottles: 0, spells: 0, mega: false, solo: true },
    { name: "spell", bottles: 0, spells: 1, mega: false, solo: true },
    { name: "fire + spell + sacrifice", bottles: 1, spells: 1, mega: false },
    { name: "full kit (fire, roll, sacrifice, spell)", bottles: 2, spells: 2, mega: true, shot: "battle_full_kit.png" }];
  const st0 = await ev(() => ({ type: __km.S.enc.st.type, party: __km.S.party.length }));
  for (const kit of kits) {
    await ev(k => { const S = __km.S; S.bottles = k.bottles; S.spells = k.spells; S.spellLeft = 0; S.enc.st.type = k.mega ? "mega" : "math";
      if (k.solo) { S._party = S._party || S.party.slice(); S.party = S._party.slice(0, 1); } else if (S._party) S.party = S._party.slice(); __km.rerenderChoice(); }, kit);
    await sleep(400); await page.mouse.move(5, 5); await sleep(200);
    const r = await ev(() => {
      const cv = document.getElementById("game").getBoundingClientRect(), k = 1600 / cv.width, R = el => { const q = el.getBoundingClientRect(); return { l: (q.left - cv.left) * k, r: (q.right - cv.left) * k, t: (q.top - cv.top) * k, b: (q.bottom - cv.top) * k }; };
      const btns = [...document.querySelectorAll("#panel .opts.moves button.plaque")], pr = document.querySelector("#panel .prompt"), dv = document.getElementById("divider");
      const out = btns.map(bt => { const cs = getComputedStyle(bt), bh = parseFloat(cs.height), cap = bh * parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bf-bh")), B = R(bt);
        const kids = [...bt.children].filter(c => getComputedStyle(c).display !== "none").map(R), L = { l: Math.min(...kids.map(q => q.l)), r: Math.max(...kids.map(q => q.r)) };
        return { label: bt.textContent.trim(), B, cap, inLabel: L.l >= B.l + cap - 0.5 && L.r <= B.r - cap + 0.5, inStage: B.l >= 16 && B.r <= 1584 && B.b <= 900 }; });
      const P = pr && R(pr), D = dv && R(dv), top = Math.min(...out.map(o => o.B.t));
      return { out, rows: new Set(out.map(o => Math.round(o.B.t / 10))).size, clearPrompt: !P || top >= P.b, clearDivider: !D || top >= D.b, bh: out.map(o => Math.round(o.B.b - o.B.t)) }; });
    if (kit.shot) await page.screenshot({ path: path.join(OUT, kit.shot) });
    checks.push([kit.name + ": " + r.out.length + " buttons in " + r.rows + " row(s) at " + [...new Set(r.bh)].join("/") + " px, all inside the stage, labels clear of the caps, below the prompt and the divider (" + r.out.filter(o => !o.inLabel || !o.inStage).map(o => o.label).join(", ") + ")",
      r.out.every(o => o.inLabel && o.inStage) && r.clearPrompt && r.clearDivider && r.rows <= 2]);
    if (kit.solo && !kit.bottles) checks.push([kit.name + ": one row at the full 84 px frame", r.rows === 1 && r.bh.every(h => h === 84)]);
  }
  await ev(t => { __km.S.enc.st.type = t; }, st0.type);
  await b.close();
  checks.forEach(([n, v]) => console.log((v ? "  ok   " : "  FAIL ") + n));
  if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  const ok = checks.every(c => c[1]) && !errors.length; console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
