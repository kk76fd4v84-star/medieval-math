// v19 captures (headless Chrome): background dragon on its hill, the MEGA BOSS dragon, brutal deaths (dragon eats a
// member, the hero eaten by the boss, the sacrifice eaten). Uses the ?debug jump hook (off by default).
// NODE_PATH=/workspace/pwtest/node_modules URL=http://localhost:8799/index.html node tools/capture_v19.js
const path = require("path"), playwright = (() => { try { return require("playwright"); } catch (e) { return require("/workspace/pwtest/node_modules/playwright"); } })();
const URL = (process.env.URL || "http://localhost:8799/index.html") + "?debug";
const OUT = path.resolve(__dirname, "../screenshots/v11b/v19"); require("fs").mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await playwright.chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); const errors = []; p.on("pageerror", e => errors.push(e.message));
  const shot = n => p.screenshot({ path: path.join(OUT, n + ".png") });
  const st = () => p.evaluate(() => ({ mode: __km.mode(), phase: __km.phase(), party: __km.S.party.length, eat: (__km.S.enc && __km.S.enc.act && __km.S.enc.act.seqPlay) ? __km.S.enc.act.seqPlay.id : null }));
  const until = async (f, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f(await st())) return; await sleep(60); } throw new Error("timeout " + JSON.stringify(await st())); };
  await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await sleep(1500);
  // 1) background dragon: walk up to Frank (the snake dragon sits on its hill in the back layer)
  await p.evaluate(() => __km.debugJump("frank", [5, 1])); await p.evaluate(() => __km.setSpeed(6));
  await until(s => s.mode === "encounter"); await p.evaluate(() => __km.setSpeed(1)); await sleep(1200); await shot("01_background_dragon_on_hill_at_frank");
  await p.keyboard.press("1"); await sleep(1600); await shot("02_turd_dragon_close_reveal");
  // 2) MEGA BOSS: commit, idle drawing; then wrong answers until the dragon eats the last-joined member
  await p.evaluate(() => __km.debugJump("mega", [5, 1])); await p.evaluate(() => __km.setSpeed(6));
  await until(s => s.mode === "encounter"); await p.evaluate(() => __km.setSpeed(1)); await sleep(500); await shot("03_mega_boss_distant");
  await p.keyboard.press("Enter"); await until(s => s.phase === "choose"); await sleep(400); await shot("04_mega_boss_dragon");
  const frames = [];
  for (let k = 0; k < 6 && (await st()).party === 3; k++) {
    await until(s => s.phase === "choose" || s.eat); if ((await st()).eat) break;
    await p.keyboard.press("1"); await sleep(150); for (const c of "9999") await p.keyboard.press(c); await p.keyboard.press("Enter");
    const t0 = Date.now(); while (Date.now() - t0 < 2500) { const s = await st(); if (s.eat) break; await sleep(40); }
    if ((await st()).eat) break;
  }
  // the six eating drawings: sample on game time
  for (let i = 0; i < 6; i++) { const f = await p.evaluate(() => { const a = __km.S.enc.act, sp = a.seqPlay; if (!sp) return -1; return KM.Assets.seqFrame(sp.id, sp.t).i; });
    if (f >= 0 && !frames.includes(f)) { frames.push(f); await shot("05_brutal_eaten_by_mega_boss_f" + (f + 1)); } await sleep(90); if (frames.length >= 6) break; }
  const t1 = Date.now(); while (Date.now() - t1 < 3000) { const f = await p.evaluate(() => { const sp = __km.S.enc && __km.S.enc.act.seqPlay; return sp ? KM.Assets.seqFrame(sp.id, sp.t).i : -1; }); if (f >= 0 && !frames.includes(f)) { frames.push(f); await shot("05_brutal_eaten_by_mega_boss_f" + (f + 1)); } if (f < 0) break; await sleep(30); }
  console.log("eating drawings captured:", frames.map(x => x + 1).join(","));
  await sleep(800); await shot("06_after_eaten_party_smaller");
  // 3) sacrifice to the boss: the volunteer charges and is eaten
  await until(s => s.phase === "choose"); await p.keyboard.press("s"); await sleep(150); await p.keyboard.press("1");
  await until(s => !!s.eat, 6000); await sleep(700); await shot("07_sacrifice_eaten_by_mega_boss");
  // 4) brutal death on the road: the killer rabbit tears a companion apart (wrong answers until a member dies)
  await p.evaluate(() => __km.debugJump("killer_rabbit", [5, 1])); await p.evaluate(() => __km.setSpeed(6));
  await until(s => s.mode === "encounter"); await p.evaluate(() => __km.setSpeed(1));
  await until(s => s.phase === "approach" || s.phase === "choose"); if ((await st()).phase === "approach") await p.keyboard.press("Enter");
  let torn = false;
  for (let k = 0; k < 12 && !torn; k++) {
    await until(s => s.phase === "choose" || s.mode !== "encounter", 15000); if ((await st()).mode !== "encounter") break;
    await p.keyboard.press("1"); await sleep(150); for (const c of "9999") await p.keyboard.press(c); await p.keyboard.press("Enter");
    const t0 = Date.now(); while (Date.now() - t0 < 3000) { torn = await p.evaluate(() => __km.S.party.some(m => m.dying && m.dying.seq === "rabbits_tear" && m.dying.t > 0.5)); if (torn) break; await sleep(30); }
  }
  if (torn) await shot("08_brutal_rabbit_tears_member_apart"); console.log("rabbit tear captured:", torn);
  console.log(errors.length ? "ERRORS " + errors.join(" | ") : "no page errors"); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
