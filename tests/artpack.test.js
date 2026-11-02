// Verifies the art-pack loader: a pack json with a cutout, a walk animation and a 2400px panorama
// replaces the boxes. Needs a static server: URL=http://localhost:8799/ node tests/artpack.test.js
const path = require("path");
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = (process.env.URL || "http://localhost:8799/").replace(/index\.html$/, "");
(async () => {
  const b = await playwright.chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; p.on("pageerror", e => errors.push(e.message)); p.on("console", m => m.type() === "error" && errors.push(m.text()));
  // v10: injected after art_v10_apply.js (which gives the hero its v13 walk atlas), so the test pack wins for the hero
  await p.route("**/src/config/art_v10_apply.js", async r => {
    const res = await r.fetch(); let body = await res.text();
    body += `\nKM_ART.packs.push("tests/fixtures/v1/testpack/testpack.json");
KM_ART.entities.hero.art = "testpack:hero"; KM_ART.entities.hero.seq = null; KM_ART.entities.hero.walk = null; KM_ART.entities.hero.anims = { walk: "testpack:walk", attack: "testpack:attack" };
for (const k of Object.keys(KM_ART.glyphs)) KM_ART.glyphs[k] = { art: "testpack:" + k };
KM_ART.ui.strip_bg = { art: "testpack:strip_bg" }; KM_ART.ui.divider = { art: "testpack:divider" };
KM_ART.layers.find(l => l.id === "mountains").art = "testpack:mountains";`;
    r.fulfill({ response: res, body });
  });
  await p.goto(URL + "index.html"); await p.evaluate(() => localStorage.clear()); await p.waitForTimeout(800);
  const reg = await p.evaluate(() => Object.keys(KM.Assets.reg.cut).concat(Object.keys(KM.Assets.reg.anim), Object.keys(KM.Assets.reg.bg)));
  await p.keyboard.press("Enter"); await p.waitForTimeout(200); await p.keyboard.press("Escape"); await p.waitForTimeout(100); await p.keyboard.type("Art"); await p.keyboard.press("Enter");
  await p.keyboard.press("Space"); await p.keyboard.press("Space"); await p.waitForTimeout(1500);
  await p.screenshot({ path: path.resolve(__dirname, "../screenshots/10_artpack_loader_test.png") });
  // v8: no per-entity fitting: art height = source px (anchor y) x the ONE global factor KM_LAYOUT.artScale
  const KM_BOX_H = await p.evaluate(() => KM.Assets.reg.cut["testpack:hero"].anchor[1] * KM_LAYOUT.art);
  const fit = await p.evaluate(() => ({ h: KM.Assets.entitySize("hero")[1], attack: KM.Assets.hasAnim("hero", "attack"), hurt: KM.Assets.hasAnim("hero", "hurt") }));
  await p.evaluate(() => __km.setSpeed(5));
  await p.waitForFunction(() => __km.S.mode === "encounter", null, { timeout: 30000 });
  await p.evaluate(() => __km.setSpeed(1)); await p.waitForTimeout(400);
  await p.keyboard.press("Enter"); await p.waitForTimeout(1100); await p.keyboard.press("1"); await p.waitForTimeout(200); // v7: commit, then weak swing
  await p.keyboard.press(String(await p.evaluate(() => __km.answer()))[0]); await p.waitForTimeout(150);
  const glyphs = await p.evaluate(() => document.querySelectorAll("#panel img.glyph").length);
  const skin = await p.evaluate(() => document.getElementById("strip").classList.contains("painted") && document.getElementById("divider").classList.contains("painted"));
  console.log("strip skin painted:", skin);
  await p.screenshot({ path: path.resolve(__dirname, "../screenshots/11_glyph_slots_test.png") });
  // touchPad flag (future phone build): pad + operator row come back when enabled
  const pad = await p.evaluate(() => { KM_LAYOUT.touchPad = true; __km.rerenderMath();
    const n = document.querySelectorAll("#panel [data-key]").length; KM_LAYOUT.touchPad = false; __km.rerenderMath(); return n; });
  console.log("touchPad keys when enabled:", pad);
  await b.close();
  console.log("fit:", JSON.stringify(fit), "glyph imgs in panel:", glyphs);
  console.log("registered:", reg.join(", "));
  const ok = reg.includes("testpack:hero") && reg.includes("testpack:walk") && reg.includes("testpack:mountains") && !errors.length
    && Math.abs(fit.h - KM_BOX_H) < 0.5 && fit.attack && !fit.hurt && glyphs >= 4 && skin && pad === 12;
  if (errors.length) console.log("ERRORS", errors);
  console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})();
