// v8 proof: capture the combat screen at the native 1600x900 stage and print each drawn asset's size.
// Usage: (static server on :8799) NODE_PATH=/workspace/pwtest/node_modules node tools/size_check.js
const path = require("path");
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html";
(async () => {
  const b = await playwright.chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; p.on("pageerror", e => errors.push(e.message));
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
  await p.keyboard.press("Enter"); await p.waitForTimeout(200); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  await p.fill("#nameInput", "Magnus"); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
  await p.keyboard.press("Space"); await p.keyboard.press("Space"); await p.waitForTimeout(300);
  await p.evaluate(() => __km.setSpeed(5));
  await p.waitForFunction(() => __km.S.mode === "encounter", null, { timeout: 30000 });
  await p.evaluate(() => __km.setSpeed(1)); await p.waitForTimeout(400);
  await p.keyboard.press("Enter"); await p.waitForTimeout(1200); await p.keyboard.press("1"); await p.waitForTimeout(900);
  await p.screenshot({ path: path.resolve(__dirname, "../screenshots/size_check_combat_1600x900.png") });
  await p.evaluate(() => Object.values(KM_ART.entities).forEach(e => e.img && KM.Assets.loadImg(e.img))); await p.waitForTimeout(1500);
  const rows = await p.evaluate(() => {
    const G = KM_LAYOUT.artScale, k = KM_LAYOUT.k, A = KM_ART7, out = [];
    const row = (name, w, h, dw, dh) => out.push({ name, src: [w, h], drawn: [+(dw).toFixed(1), +(dh).toFixed(1)], fx: +(dw / w).toFixed(4), fy: +(dh / h).toFixed(4) });
    for (const [id, e] of Object.entries(KM_ART.entities)) if (e.img) { const im = KM.Assets.loadImg(e.img); if (im.naturalWidth) row(id + " (" + e.img.split("/").pop() + ")", im.naturalWidth, im.naturalHeight, im.naturalWidth * KM_LAYOUT.art * k, im.naturalHeight * KM_LAYOUT.art * k); }
    for (const [n, s] of Object.entries(A.sequences)) { const c = s.frames[0]; row("sequence " + n + " cell", c.w, c.h, c.w * KM_LAYOUT.art * k, c.h * KM_LAYOUT.art * k); }
    for (const [n, q] of Object.entries(A.parallax)) row("parallax " + n, q.size[0], q.size[1], q.size[0] * KM_LAYOUT.art * k, q.size[1] * KM_LAYOUT.art * k);
    A.trees.forEach((t, i) => row("tree " + i, t.size[0], t.size[1], KM.Scenery.treeWidth(i) * k, t.size[1] * KM_LAYOUT.art * k));
    row("sky", A.sky.size[0], A.sky.size[1], A.sky.size[0] * KM_LAYOUT.art * k, A.sky.size[1] * KM_LAYOUT.art * k);
    row("parchment tile", A.parchment.size[0], A.parchment.size[1], A.parchment.size[0] * KM_LAYOUT.art * k, A.parchment.size[1] * KM_LAYOUT.art * k);
    for (const id of ["camp", "tavern-interior"]) { const m = KM.RestView.mapper(id), c = KM.RestView.scene(id).canvas; row("rest scene " + id + " (all layers)", c[0], c[1], c[0] * m.s * k, c[1] * m.s * k); }
    const fc = A.scenes["tavern-exterior"].facadePlacement; row("tavern facade crop", fc[2], fc[3], fc[2] * KM_LAYOUT.art * k, fc[3] * KM_LAYOUT.art * k);
    row("d20 cell", A.dice.cell[0], A.dice.cell[1], A.dice.cell[0] * KM_LAYOUT.art * k, A.dice.cell[1] * KM_LAYOUT.art * k);
    const sb = getComputedStyle(document.getElementById("strip")).backgroundSize.split(" ").map(parseFloat); row("strip_bg (CSS)", A.strip_bg.size[0], A.strip_bg.size[1], sb[0], sb[1]);
    const g = document.querySelector("#panel img.glyph.native"); if (g) row("glyph " + g.alt + " (DOM)", g.naturalWidth, g.naturalHeight, g.getBoundingClientRect().width, g.getBoundingClientRect().height);
    return { G, k, scene: KM_LAYOUT.scene, out };
  });
  console.log(JSON.stringify(rows, null, 1));
  require("fs").writeFileSync(path.resolve(__dirname, "../screenshots/size_table.json"), JSON.stringify(rows, null, 1));
  if (errors.length) console.log("ERRORS", errors);
  await b.close();
})();
