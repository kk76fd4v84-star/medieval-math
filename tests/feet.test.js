// Magnus: enemies never float. (1) Every enemy's drawing, at its own pivot, puts its lowest opaque pixel on the ground
// line (within 4 px) in every drawn frame (idle, walk, attack, hurt). (2) In a real run, every foe's foot line is the
// ground line during the slide-in (grey, before the commit) and during the fight.
// URL=http://localhost:8799/index.html node tests/feet.test.js
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html", sleep = ms => new Promise(r => setTimeout(r, ms));
const SHOTS = require("path").resolve(__dirname, "../screenshots/v11b/feet");
(async () => {
  const b = await playwright.chromium.launch(); const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on("pageerror", e => errors.push(e.message)); const ev = f => page.evaluate(f), checks = [];
  await page.goto(URL); await ev(() => localStorage.clear()); await page.reload(); await sleep(800);
  await page.keyboard.press("Enter"); await sleep(300); await page.keyboard.press("Escape"); await sleep(200); await page.fill("#nameInput", "Magnus"); await page.keyboard.press("Enter");
  for (let i = 0; i < 8 && (await ev(() => __km.mode())) !== "walk"; i++) { await page.keyboard.press("Space"); await sleep(150); }
  // (1) pixel check per enemy and drawn action
  const ids = await ev(() => [...new Set(KM_DATA.encounters.filter(e => e.enemy && e.type !== "special").map(e => e.enemy))]);
  await ev(async () => { const c = document.createElement("canvas").getContext("2d"); for (const id of [...new Set(KM_DATA.encounters.map(e => e.enemy).filter(Boolean))]) ["idle", "walk", "attack", "hurt"].forEach(a => KM.Assets.drawEntity(c, id, 0, 0, { action: a })); await new Promise(r => setTimeout(r, 1500)); });
  const px = await page.evaluate(ids => ids.map(id => { const out = [];
    for (const action of ["idle", "walk", "attack", "hurt"]) for (const t of [0, 0.1, 0.25, 0.4, 0.6]) {
      const cv = document.createElement("canvas"); cv.width = 2400; cv.height = 1400; const c = cv.getContext("2d");
      KM.Assets.drawEntity(c, id, 1200, 1000, { action, t }); const d = c.getImageData(0, 0, 2400, 1400).data; let low = -1;
      for (let y = 1399; y >= 0 && low < 0; y--) for (let x = 0; x < 2400; x += 2) if (d[(y * 2400 + x) * 4 + 3] > 40) { low = y; break; }
      out.push(low < 0 ? null : low - 999); }
    const v = out.filter(x => x != null); return { id, art: KM.Assets.hasArt ? KM.Assets.hasArt(id) : null, min: Math.min(...v), max: Math.max(...v) }; }), ids);
  for (const r of px) checks.push([`${r.id}: lowest pixel of every frame on the ground line (offset ${r.min}..${r.max} px)`, Math.abs(r.min) <= 4 && Math.abs(r.max) <= 4]);
  // (2) live run: slide-in + fight
  const off = []; let shotA = false, shotF = false; const fought = new Set();
  const sample = async tag => { const f = await ev(() => __km.foeFeet()); f.filter(a => !a.hill && a.sx > -300 && a.sx < 2700).forEach(a => off.push({ tag, id: a.id, d: +(a.feetY - a.groundY).toFixed(2), state: a.state })); return f; };
  for (let it = 0; it < 4000 && fought.size < 3; it++) {
    await ev(() => { __km.S.hp = __km.maxHp(); if (__km.S.enc) __km.S.enc.lost = 0; });
    const s = await ev(() => ({ m: __km.mode(), ph: __km.phase(), ans: __km.answer(), type: __km.S.enc && __km.S.enc.st.type }));
    if (s.m === "walk") { const f = await sample("walk"); if (!shotA && f.some(a => !a.hill && a.distant && a.sx < 2600)) await ev(() => __km.setSpeed(1));
      if (!shotA && f.some(a => !a.hill && a.distant && a.sx > 800 && a.sx < 2250)) { await ev(() => __km.setSpeed(1)); await sleep(300); await page.screenshot({ path: SHOTS + "/enemy_arriving_on_ground.png" }); shotA = true; } else if (shotA || !f.some(a => !a.hill && a.distant && a.sx < 2600)) await ev(() => __km.setSpeed(2)); }
    if (s.ph === "approach") { await sample("approach"); await page.keyboard.press("Enter"); }
    else if (s.ph === "choose") { await sample("fight"); if (!shotF) { await sleep(400); await page.screenshot({ path: SHOTS + "/enemy_in_fight_on_ground.png" }); shotF = true; } fought.add(await ev(() => __km.S.stop)); await page.keyboard.press("1"); for (let k = 0; k < 6; k++) { await sleep(70); await sample("fight"); } }
    else if (s.ph === "math") { for (const c of String(s.ans)) await page.keyboard.press(c); await page.keyboard.press("Enter"); for (let k = 0; k < 6; k++) { await sleep(60); await sample("fight"); } }
    else if (s.ph === "riddle") await page.keyboard.press("abc"[await ev(() => __km.S.enc.riddle.answer)]);
    else if (s.ph === "frank") await page.keyboard.press("2");
    else if (s.ph === "recruit") await page.keyboard.press("n");
    else if (/Walk on|Break camp/.test(await ev(() => __km.panelText()))) await page.keyboard.press("Enter");
    await sleep(100); }
  const bad = off.filter(o => Math.abs(o.d) > 3);
  checks.push([`live: ${off.length} foe samples (slide-in, approach, fight): feet on the ground line within 3 px (${bad.length} off${bad.length ? ": " + JSON.stringify(bad.slice(0, 4)) : ""})`, off.length > 50 && bad.length === 0 && off.some(o => o.tag === "walk") && off.some(o => o.tag === "fight")]);
  checks.push(["screenshots: enemy arriving + enemy in the fight", shotA && shotF]);
  checks.push(["no page errors (" + errors.join(" | ") + ")", errors.length === 0]);
  let ok = true; for (const [n, v] of checks) { console.log((v ? "  ok   " : "  FAIL ") + n); ok = ok && !!v; }
  await b.close(); console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})();
