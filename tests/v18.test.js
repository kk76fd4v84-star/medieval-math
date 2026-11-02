// v18 pack (Magnus, medieval-math-riddles-v18): friendly-coif companion clips + riddle keeper / rock layers.
// URL=http://localhost:8799/index.html node tests/v18.test.js
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html";
(async () => {
  const b = await playwright.chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; p.on("pageerror", e => errors.push(e.message));
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
  await p.keyboard.press("Enter"); await p.waitForTimeout(300); await p.keyboard.press("Escape"); await p.waitForTimeout(200); await p.fill("#nameInput", "Magnus"); await p.keyboard.press("Enter");
  for (let i = 0; i < 8 && (await p.evaluate(() => __km.mode())) !== "walk"; i++) { await p.keyboard.press("Space"); await p.waitForTimeout(150); }
  // preload the atlases, then measure
  await p.evaluate(async () => { for (const id of ["follower_5", "bridgekeeper", "keeper_rock", "hero"]) KM.Assets.drawEntity(document.createElement("canvas").getContext("2d"), id, 0, 0, { action: "walk" });
    const c = document.createElement("canvas").getContext("2d"); ["attack", "hurt"].forEach(a => KM.Assets.drawEntity(c, "follower_5", 0, 0, { action: a }));
    KM.Assets.drawEntity(c, "follower_5", 0, 0, { seq: "death_coif" }); await new Promise(r => setTimeout(r, 1200)); });
  const r = await p.evaluate(() => { const Q = KM_ART7.sequences, E = KM_ART.entities.follower_5;
    const clip = n => { const s = Q[n + "_coif"]; return s && { n: s.frames.length, ms: s.frames.map(f => f.ms), cell: s.cell, pivot: s.pivot, mul: s.mul, loop: s.loop }; };
    return { walk: clip("walk"), idle: clip("idle"), attack: clip("attack"), hurt: clip("hurt"), death: clip("death"), seq: E.seq, deathSeq: E.deathSeq, skins: KM_DATA.party.skins,
      has: ["idle", "walk", "attack", "hurt"].map(a => KM.Assets.hasAnim("follower_5", a)), h: KM.Assets.entityHeight("follower_5"), hh: KM.Assets.entityHeight("hero"),
      kh: KM.Assets.entityHeight("bridgekeeper"), gy: KM_DATA.world.groundY, k: KM_LAYOUT.k,
      looks: [].concat(...__km.S.stops.filter(s => s.candSkins).map(s => s.candSkins)), cands: __km.S.stops.filter(s => s.cands && s.cands.length).every(s => s.candSkins && s.candSkins.length === s.cands.length) }; });
  const checks = [];
  checks.push(["coif walk: 12 x 100 ms, 512 cells, pivot [256,480], loops", r.walk && r.walk.n === 12 && r.walk.ms.every(m => m === 100) && r.walk.cell[0] === 512 && r.walk.pivot.join() === "256,480" && r.walk.loop]);
  checks.push(["coif idle: 8 x 300 ms, 512 cells", r.idle && r.idle.n === 8 && r.idle.ms.every(m => m === 300) && r.idle.cell[0] === 512 && r.idle.loop]);
  checks.push(["coif attack / hurt / death: 768 cells, pivot [384,680], held drawings from animations.json (" + JSON.stringify([r.attack.ms, r.hurt.ms, r.death.ms]) + ")",
    r.attack.cell[0] === 768 && r.attack.ms.join() === "150,180,90,260" && r.hurt.ms.join() === "350" && r.death.ms.join() === "200,350,130,1100" && [r.attack, r.hurt, r.death].every(c => c.pivot.join() === "384,680" && !c.loop)]);
  checks.push(["per-clip calibration recorded (all 1.0: heads already match)", [r.walk, r.idle, r.attack, r.hurt, r.death].every(c => c.mul === 1)]);
  checks.push(["follower_5 = the coif with every clip drawable; 5 companion looks", r.seq.walk === "walk_coif" && r.deathSeq === "death_coif" && r.has.every(Boolean) && r.skins === 5]);
  checks.push(["coif standing height vs the hero (" + (r.h / r.hh).toFixed(3) + "x)", r.h > 0.7 * r.hh && r.h < r.hh]);
  checks.push(["every candidate has a look and the looks rotate through the coif too (" + r.looks.join("") + ")", r.cands && r.looks.length > 0 && r.looks.every(x => x >= 1 && x <= 5) && (r.looks.length < 5 || r.looks.includes(5))]);
  checks.push(["riddle keeper fits above the road (" + (r.kh * r.k).toFixed(0) + " stage px)", r.kh > 0 && r.kh < r.gy * 0.6]);
  checks.push(["no page errors (" + errors.join(" | ") + ")", errors.length === 0]);
  let ok = true; for (const [n, v] of checks) { console.log((v ? "  ok   " : "  FAIL ") + n); ok = ok && !!v; }
  await b.close(); console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})();
