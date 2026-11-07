// v7 graves: death records with killer + progress, emblem markers on the hill lane, respects stop, once-per-run
// "further than ever" toast + narrator line + VO, approved drawn knight death, hunters capture, profile migrations.
// Run: URL=http://localhost:8799/index.html node tests/graves.test.js
const path = require("path");
let playwright;
try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const ROOT = path.resolve(__dirname, "..");
const URL = process.env.URL || "http://localhost:8799/index.html";
const SHOTS = path.join(ROOT, "screenshots");
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [], checks = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  const st = () => page.evaluate(() => ({ mode: __km.S.mode, phase: __km.phase(), type: __km.S.enc && __km.S.enc.type, enemy: __km.S.enc && __km.S.enc.st.enemy, stop: __km.S.stop, camX: __km.S.camX, hp: __km.S.hp, hunters: __km.hunters() }));
  const typeAnswer = async wrong => { const a = wrong ? "9999" : String(await page.evaluate(() => __km.answer())); for (const c of a) await page.keyboard.press(c); await page.keyboard.press("Enter"); await sleep(120); };
  // resolve any stop quickly (used while walking to a target)
  const autoStep = async s => {
    switch (s.phase) {
      case "approach": await page.keyboard.press("Enter"); break;
      case "choose": await page.keyboard.press("2"); await sleep(120); await typeAnswer(); break;
      case "riddle": { const a = await page.evaluate(() => __km.S.enc.riddle.answer); await page.keyboard.press(String(a + 1)); break; }
      case "recruit": await page.keyboard.press("n"); break;
      case "frank": await page.keyboard.press("2"); await sleep(120); await typeAnswer(); break;
      case "tavernOut": case "rest": await page.keyboard.press("Enter"); break;
      default: break;
    }
    await sleep(150);
  };

  // 1) profile migrations: legacy best -> v4; v3 deaths gain killer "unknown" / marker "grave" / progress null
  await page.goto(URL);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("knightMath.best", JSON.stringify({ leagues: 3.3, name: "Legacy", at: 1 })); });
  await page.reload(); await sleep(700);
  let prof = await page.evaluate(() => JSON.parse(localStorage.getItem("knightMath.profile")));
  checks.push(["legacy best -> profile v4 (best kept, empty deaths)", prof && prof.version === 5 && prof.best.leagues === 3.3 && prof.deaths.length === 0]);
  await page.evaluate(() => localStorage.setItem("knightMath.profile", JSON.stringify({ version: 3, best: { leagues: 2, name: "X", at: 1 }, deaths: [{ name: "Oldtimer", x: 5000, leagues: 1.7, at: 2 }], music: { volume: null, muted: true } })));
  await page.reload(); await sleep(700);
  prof = await page.evaluate(() => JSON.parse(localStorage.getItem("knightMath.profile")));
  const d0 = prof.deaths[0];
  checks.push(["profile v3 -> v4: old deaths get killer 'unknown', marker 'grave', progress null", prof.version === 5 && d0.killer === "unknown" && d0.marker === "grave" && d0.progress === null && d0.name === "Oldtimer" && d0.deathId]);

  // 2) seed v4 deaths: killed by the rabbit (encounters[2]) twice -> one shared grave with the rabbit emblem; best 0.5 leagues
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("knightMath.profile"));
    const ri = KM_DATA.encounters.findIndex(e => e.enemy === "killer_rabbit");
    const mk = (n, k) => ({ deathId: "t" + n, runId: "r" + n, route: "road-v7", progress: { encounter: ri, offset: 0 }, killer: k, marker: "x", name: n, x: 0, leagues: 3.1, at: Date.now() - 1e6 });
    p.deaths = [mk("Gawain", "killer_rabbit"), mk("Bors", "killer_rabbit")]; p.best = { leagues: 0.5, name: "Old", at: 1 };
    localStorage.setItem("knightMath.profile", JSON.stringify(p));
  });
  await page.reload(); await sleep(700);
  const gr = await page.evaluate(() => { const W = KM_DATA.world, rs = __km.S.stops.find(s => s.enemy === "killer_rabbit"); return { g: __km.graves(), halt: rs.stopX - W.engageScreenX }; });
  const KM_GR = await page.evaluate(() => ({ ahead: KM_DATA.graves.ahead, respectAt: KM_DATA.graves.respectAt }));
  checks.push(["graves placed by killer encounter (shared, rabbit emblem) " + JSON.stringify(gr.g), gr.g.length === 1 && gr.g[0].n === 2 && gr.g[0].marker === "grave_rabbit"]);
  // v12g (Magnus): the grave stands ON THE ROAD exactly where the knight fell (that halt + offset + GR.ahead), the party halts GR.respectAt before it
  checks.push(["v12g: grave at the death spot on the road (wx = halt + ahead), respects halt in front of it, not visible at the title " + JSON.stringify({ g: gr.g[0], halt: gr.halt }),
    gr.g[0].wx === gr.halt + KM_GR.ahead && gr.g[0].cam === gr.halt + KM_GR.ahead - KM_GR.respectAt && gr.g[0].sx > 1600 + 300]);

  // 3) new game; intro VO hooks
  await page.keyboard.press("Enter"); await sleep(400);
  await page.keyboard.press("Space"); await sleep(100); await page.keyboard.press("Space"); await sleep(200);
  await page.keyboard.press("Escape"); await sleep(300);
  await page.fill("#nameInput", "Graveguy"); await page.keyboard.press("Enter"); await sleep(200);
  for (let i = 0; i < 8 && (await page.evaluate(() => __km.mode())) !== "walk"; i++) { await page.keyboard.press("Space"); await sleep(150); }
  const vo = await page.evaluate(() => __km.voLog.slice());
  checks.push(["intro VO hooks fire", vo.includes("vo_story_01") && vo.includes("vo_name_prompt") && vo.includes("vo_after_name")]);
  await page.evaluate(() => __km.setSpeed(4));

  let respects = 0, respectOk = false, toastAt = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    const r = await page.evaluate(() => __km.respect());
    if (r) {
      respects++;
      await page.evaluate(() => __km.setSpeed(1));
      const c0 = (await st()).camX; await sleep(600); const KM_DATA_PSX = await page.evaluate(() => KM_DATA.world.partyScreenX);
      const info = await page.evaluate(() => ({ c: __km.S.camX, bubbles: __km.bubbles(), say: __km.speechLog().join(" "), panel: document.getElementById("panel").textContent, acts: __km.S.party.map(m => m.act && m.act.name), g: __km.graves()[0] }));
      await page.screenshot({ path: SHOTS + "/12_grave_with_killer_emblem.png" });
      { // v12r (Magnus: "The grave sits too high, it needs to be ground level"): every marker's lowest opaque pixel (the mound's
        // base, alpha > 40) lands on the characters' feet line W.groundY when drawn the way drawGraves draws it
        const gb = await page.evaluate(async () => { const W = KM_DATA.world, out = {}, ids = [...new Set(Object.values(KM_DATA.graves.markers))];
          const c0 = document.createElement("canvas").getContext("2d"); ids.forEach(id => KM.Assets.drawEntity(c0, id, 0, 0)); await new Promise(r => setTimeout(r, 1500)); // load every marker
          for (const id of new Set(Object.values(KM_DATA.graves.markers))) { if (!KM.Assets.hasArt(id)) continue;
            const cv = document.createElement("canvas"); cv.width = 1600; cv.height = 1400; const c = cv.getContext("2d");
            KM.Assets.drawEntity(c, id, 800, W.groundY); const d = c.getImageData(0, 0, 1600, 1400).data; let low = -1;
            for (let y = 1399; y >= 0 && low < 0; y--) for (let x = 0; x < 1600; x++) if (d[(y * 1600 + x) * 4 + 3] > 40) { low = y; break; }
            out[id] = low - W.groundY; }
          return out; });
        checks.push(["v12r: grave mounds stand on the feet line (alpha bottom - W.groundY, layout units: " + JSON.stringify(gb) + ")",
          Object.keys(gb).length >= 4 && Object.values(gb).every(v => Math.abs(v) <= 3)]); }
      console.log("grave bark:", info.bubbles.map(b => b.text).join(" | "), "| strip:", info.say);
      respectOk = info.c === c0 && info.acts.every(a => a === "respects") && !/respects/.test(info.panel) && /Killed by a rabbit/.test(info.say + info.bubbles.map(b => b.text).join(" ")) && Math.abs(info.g.sx - (KM_DATA_PSX + KM_GR.respectAt)) < 60; // v12g: on the road, just in front of the party
      while (await page.evaluate(() => !!__km.respect())) await sleep(100);
      await page.evaluate(() => __km.setSpeed(4));
      continue;
    }
    if (!toastAt && await page.evaluate(() => __km.further())) {
      toastAt = await page.evaluate(() => ({ lg: +__km.leagues(), toast: __km.toast(), panel: document.getElementById("panel").textContent, n: __km.audioCounts.vo_further_than_ever }));
      await page.evaluate(() => __km.setSpeed(1)); await sleep(350);
      await page.screenshot({ path: SHOTS + "/13_further_than_ever_toast.png" });
      await page.evaluate(() => __km.setSpeed(4));
    }
    const s = await st();
    if (s.mode === "encounter") { if (s.enemy === "killer_rabbit" && s.type === "math") break; await autoStep(s); continue; }
    if (s.mode !== "walk") break;
    await sleep(60);
  }
  checks.push(["party stops at the grave, bows, epitaph names the killer, grave stands on the road in front (" + respects + ")", respects === 1 && respectOk]);
  checks.push(["'further than ever': one big scene toast + VO (no strip text), once, after passing the best (" + JSON.stringify(toastAt) + ")",
    !!toastAt && toastAt.lg > 0.5 && /clever thing/.test(toastAt.toast) && !toastAt.panel.trim() && toastAt.n === 1
    && (await page.evaluate(() => __km.audioCounts.vo_further_than_ever)) === 1]);

  // 4) die to the rabbit: approved drawn knight death plays (frame by frame, last frame held), then game over; death recorded with killer
  await page.evaluate(() => __km.setSpeed(1));
  const before = await page.evaluate(() => KM.Save.deaths().length);
  await page.keyboard.press("Enter"); await page.waitForFunction(() => __km.phase() === "choose");
  await page.evaluate(() => (__km.S.hp = 1));
  await page.keyboard.press("1"); await sleep(150); await typeAnswer(true);
  await page.waitForFunction(() => __km.S.mode === "dying", null, { timeout: 5000 });
  const frames = [];
  for (let i = 0; i < 14; i++) { frames.push(await page.evaluate(() => { const m = __km.S.party[0]; return KM.Assets.seqFrame("knight_death", m.dying.t).i; })); if (i === 5) await page.screenshot({ path: SHOTS + "/14_drawn_knight_death_mid.png" }); await sleep(200); }
  await page.screenshot({ path: SHOTS + "/14b_drawn_knight_death_held.png" });
  checks.push(["hero death uses the approved drawn sequence: frames advance 0..4 in order, last held (" + frames.join("") + ")", frames.every((f, i) => i === 0 || f >= frames[i - 1]) && frames[frames.length - 1] === 4 && new Set(frames).size >= 4]);
  await page.waitForFunction(() => __km.S.mode === "gameover", null, { timeout: 8000 });
  const dead = await page.evaluate(() => ({ list: KM.Save.deaths(), panel: __km.speechLog().slice(-2).join(" "), ri: KM_DATA.encounters.findIndex(e => e.enemy === "killer_rabbit") }));
  const last = dead.list[dead.list.length - 1];
  checks.push(["death recorded once with killer, marker, progress, run id (" + JSON.stringify(last) + ")", dead.list.length === before + 1 && last.name === "Graveguy" && last.killer === "killer_rabbit" && last.marker === "grave_rabbit"
    && last.progress && last.progress.encounter === dead.ri && last.runId && last.deathId && /Killed by a rabbit/.test(dead.panel)]);

  // 5) hunters: at the end of the track a failed problem means capture -> run over, killer "hunters"
  await page.keyboard.press("Enter"); await sleep(500); // retry from checkpoint
  await page.evaluate(() => __km.setSpeed(4));
  while (true) { const s = await st(); if (s.mode === "encounter" && s.phase === "approach") break; if (s.mode === "encounter") await autoStep(s); await sleep(80); }
  await page.evaluate(() => __km.setSpeed(1));
  await page.keyboard.press("Enter"); await page.waitForFunction(() => __km.phase() === "choose");
  await page.evaluate(() => (__km.S.hunters = KM_DATA.combat.hunters.blocks - 1));
  await page.keyboard.press("1"); await sleep(150); await typeAnswer(true);
  await sleep(1300); await page.screenshot({ path: SHOTS + "/15_hunters_catch_up.png" });
  await page.waitForFunction(() => __km.S.mode === "gameover", null, { timeout: 10000 });
  const hk = await page.evaluate(() => KM.Save.deaths().slice(-1)[0]);
  checks.push(["hunters reach the party -> run over, killer 'hunters', grave marker grave_hunters", hk.killer === "hunters" && hk.marker === "grave_hunters"]);

  // 6) deaths survive a new game; all 4 deaths happened at the rabbit, so they share one grave showing the latest killer; cap keeps the furthest
  await page.keyboard.press("n"); await sleep(600);
  const after = await page.evaluate(() => ({ n: KM.Save.deaths().length, g: __km.graves() }));
  checks.push(["deaths survive a new game (graves rebuilt: " + after.g.map(g => g.marker + "x" + g.n).join(",") + ")", after.n === before + 2 && after.g.some(g => g.n === 4 && g.marker === "grave_hunters")]);
  const cap = await page.evaluate(() => { const far = Math.max(...KM.Save.deaths().map(d => d.x)); for (let i = 0; i < 30; i++) KM.Save.addDeath({ name: "Spam" + i, x: 100 + i, leagues: 0, at: Date.now(), killer: "unknown" }); return { n: KM.Save.deaths().length, keep: Math.max(...KM.Save.deaths().map(d => d.x)) === far }; });
  checks.push(["deaths list capped at " + cap.n + ", furthest kept", cap.n === 20 && cap.keep]);

  await browser.close();
  checks.forEach(([n, v]) => console.log((v ? "  ok   " : "  FAIL ") + n));
  if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  const ok = checks.every(c => c[1]) && errors.length === 0;
  console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
