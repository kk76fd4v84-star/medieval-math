// v10 proof captures (static server on :8799):  NODE_PATH=/workspace/pwtest/node_modules node tools/v10_capture.js
//  - screenshots/v10_walk_frames/*.png : 12 frames over one 1 s walk cycle of the party (hero + scarf, feather, moustache)
//    walking over the frontGround strips (game clock frozen, walk clock stepped), assembled by tools/v10_assemble.py
//  - same with 'stripe' in place of 'scarf' (all five v13 walkers shown)
//  - screenshots/v10_biome_<biome>.png : the road in each mid biome (front strip follows the biome)
const path = require("path"), fs = require("fs");
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html", OUT = path.resolve(__dirname, "../screenshots");
async function start(b, biome) {
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errors = []; p.on("pageerror", e => errors.push(e.message)); p.errors = errors;
  await p.addInitScript(B => { window.__biome = B; }, biome || null);
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(900);
  if (biome) await p.evaluate(() => { const m = KM_DATA.scenery.mid; m.biomes = [window.__biome, window.__biome, window.__biome, ...m.biomes]; });
  await p.keyboard.press("Enter"); await p.waitForTimeout(200); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  await p.fill("#nameInput", "Magnus"); await p.keyboard.press("Enter"); await p.waitForTimeout(200);
  await p.keyboard.press("Space"); await p.keyboard.press("Space"); await p.waitForTimeout(1500);
  return p;
}
async function party(p, skins) {
  await p.evaluate(sk => { const S = __km.S, W = KM_DATA.world;
    S.party.length = 1; sk.forEach((k, i) => S.party.push({ id: "f" + (i + 1), kind: "follower", name: ["Sir Scarf", "Sir Feather", "Sir Moustache", "Sir Stripe"][k - 1], base: 1, skin: k, weapon: 0, armor: 0, sx: W.partyScreenX - (i + 1) * W.slotSpacing, hopY: 0 }));
  }, skins);
}
(async () => {
  const b = await playwright.chromium.launch();
  for (const [tag, skins] of [["", [1, 2, 3]], ["_stripe", [4, 2, 3]]]) {
    const p = await start(b, "fields"); await party(p, skins);
    await p.evaluate(() => { __km.setSpeed(0); window.__cam0 = __km.S.camX; });
    const dir = path.join(OUT, "v10_walk_frames" + tag); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < 24; i++) { // 24 frames = 2 cycles at 12 fps (real time: 1 s per cycle)
      await p.evaluate(i => { const S = __km.S, t = i / 12; S.walkT = t; S.camX = window.__cam0 + KM_DATA.world.walkSpeed * t; }, i);
      await p.waitForTimeout(60);
      await p.screenshot({ path: path.join(dir, String(i).padStart(2, "0") + ".png"), clip: { x: 0, y: 0, width: 1600, height: 640 } });
    }
    console.log("walk frames", tag, await p.evaluate(() => ({ walking: __km.mode(), party: __km.S.party.map(m => KM_ART.entities[m.id === "hero" ? "hero" : "follower_" + m.skin].walk) })), p.errors);
    await p.close();
  }
  for (const biome of ["fields", "village", "near-forest", "barren-rocks", "canyon"]) {
    const p = await start(b, biome); await p.evaluate(() => __km.setSpeed(3)); await p.waitForTimeout(1500); await p.evaluate(() => __km.setSpeed(1)); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, "v10_biome_" + biome + ".png") });
    console.log(biome, await p.evaluate(() => { const L = KM_DATA.world.partyScreenX, s = __km.S; return [0, 1, 2].map(d => { const i = Math.floor((s.camX) / KM.Scenery.fgWidth()) + d; return KM.Scenery.fgBiomeAt(i, s.fgSeed, L); }).join(","); }), p.errors);
    await p.close();
  }
  await b.close();
})();
