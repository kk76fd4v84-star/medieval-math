// v9 proof: combat screen at the native 1600x900 stage in a busy biome, for the tint/edge comparison.
// For the capture only, the mid biome cycle starts with BIOME (default "village") so the first fight stands in front of it.
// Usage: (static server on :8799) NODE_PATH=/workspace/pwtest/node_modules node tools/tint_check.js [out.png] [biome]
const path = require("path");
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html";
const OUT = process.argv[2] || path.resolve(__dirname, "../screenshots/tint_combat_1600x900.png"), BIOME = process.argv[3] || "village";
(async () => {
  const b = await playwright.chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; p.on("pageerror", e => errors.push(e.message));
  await p.addInitScript(B => { window.__tintBiome = B; }, BIOME);
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
  await p.evaluate(() => { const m = KM_DATA.scenery.mid; m.biomes = [window.__tintBiome, window.__tintBiome, ...m.biomes]; });
  await p.keyboard.press("Enter"); await p.waitForTimeout(200); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  await p.fill("#nameInput", "Magnus"); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
  await p.keyboard.press("Space"); await p.keyboard.press("Space"); await p.waitForTimeout(300);
  await p.evaluate(() => __km.setSpeed(5));
  await p.waitForFunction(() => __km.S.mode === "encounter", null, { timeout: 30000 });
  await p.evaluate(() => __km.setSpeed(1)); await p.waitForTimeout(400);
  if (process.env.DISTANT) { await p.waitForTimeout(600); await p.screenshot({ path: OUT.replace(/\.png$/, "_distant.png") }); }
  await p.keyboard.press("Enter"); await p.waitForTimeout(1200); await p.keyboard.press("1"); await p.waitForTimeout(900);
  await p.screenshot({ path: OUT });
  console.log(JSON.stringify(await p.evaluate(() => KM.Scenery.tintInfo())));
  if (errors.length) console.log("ERRORS", errors);
  await b.close();
})();
