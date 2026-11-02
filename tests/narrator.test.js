// Magnus's narrator: the skeleton on his rock replaces the Little Dragon box. Checks: drawn from his art (no box, no
// dragon_narrator entity), rock base ON the ground line, the ONE artScale (no artMul), intro bubbles aim at his skull,
// intro VO (v12f): Charlie's REAL recordings incoming/vo_narrator/vo_story_01..04 play, their chunks are paced across each clip
// and every line moves on by itself to the name prompt (no keypress); on a 2nd page vo_story_02 is forced missing (all
// formats): silent, the bubble waits for the key, one chunk per press.   URL=http://localhost:8799/index.html node tests/narrator.test.js
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const fs = require("fs"), path = require("path"), URL = process.env.URL || "http://localhost:8799/index.html", sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await playwright.chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] }); const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on("pageerror", e => errors.push(e.message)); const ev = f => page.evaluate(f), checks = [];
  await page.goto(URL); await ev(() => localStorage.clear()); await page.reload(); await page.waitForFunction(() => !document.getElementById("kmLoader"), null, { timeout: 60000 }); await sleep(300);
  const ent = await ev(() => ({ n: KM_ART.entities.narrator, old: !!KM_ART.entities.dragon_narrator, skull: KM_NARRATOR.skull }));
  checks.push(["narrator = Magnus's skeleton-on-rock art; no dragon_narrator entity", ent.n && /narrator_skeleton_rock/.test(ent.n.img) && !ent.old]);
  checks.push([`v12b: artMul ${ent.n && ent.n.artMul} (Magnus: knight-sized); skull ${ent.skull.w} src px -> ${(ent.skull.w * 0.6 * ((ent.n && ent.n.artMul) || 1)).toFixed(0)} stage px`, ent.n && ent.n.artMul === 0.55]);
  await page.keyboard.press("Enter"); await sleep(1400);
  const st = await ev(() => { const a = __km.S.actors.find(q => q.narrator), K = KM_LAYOUT.k, B = __km.bubbles()[0], sa = KM_ART.entities.narrator.sayAt;
    return { drawY: a.drawY, ground: KM_DATA.world.groundY, b: B && { x: B.x, y: B.y, w: B.w, h: B.h, side: B.side }, skull: { x: (a.drawX + sa[0] * KM_LAYOUT.art * KM_ART.entities.narrator.artMul) * K, y: (a.drawY + sa[1] * KM_LAYOUT.art * KM_ART.entities.narrator.artMul) * K } }; });
  checks.push([`rock base on the ground line (pivot y ${st.drawY} = ground ${st.ground}; the pivot is the lowest opaque row)`, st.drawY === st.ground]);
  const tipX = st.b && (st.b.side === "left" ? st.b.x : st.b.x + st.b.w);
  checks.push([`intro bubble points at his skull (bubble ${JSON.stringify(st.b)}, skull top ${JSON.stringify(st.skull)})`, st.b && Math.hypot(tipX - st.skull.x, (st.b.y + st.b.h) - (st.skull.y + 80)) < 220]);
  await page.screenshot({ path: path.resolve(__dirname, "../screenshots/v12b/intro_narrator_test.png") });
  let played = null; for (let i = 0; i < 40 && !played; i++) { played = await ev(() => KM.Audio.voPlayed.vo_story_01 || null); await sleep(100); }
  checks.push(["vo_story_01 plays (assets/audio/vo) (" + played + ")", /(assets\/audio\/vo|incoming\/vo_narrator)\/vo_story_01\.(ogg|mp3)/.test(played || "")]);
  // v12c: multi-chunk lines. With a recording the chunks are paced across the clip, then the next LINE 0.6 s after it ends
  const nChunks = await ev(() => __km.S.intro.lines.map(l => __km.chunks(l).length)), spOf = pg => pg.evaluate(() => { const n = __km.S.actors.find(q => q.narrator && !q.dead); return { m: __km.S.mode, i: __km.S.intro ? __km.S.intro.i : -1, c: n && n.sp ? n.sp.i : -1 }; });
  checks.push(["the new intro lines are multi-chunk (" + JSON.stringify(nChunks) + ")", nChunks[0] >= 2 && nChunks[1] >= 2]);
  // all 4 real recordings, NO keypress: every chunk of every line shows, then the name prompt
  const seen = {}; let q = null; const t0 = Date.now();
  for (let k = 0; k < 700; k++) { q = await spOf(page); if (q.m !== "intro") break; (seen[q.i] = seen[q.i] || new Set()).add(q.c); await sleep(50); }
  const secs = ((Date.now() - t0) / 1000).toFixed(1), played4 = await ev(() => [1, 2, 3, 4].map(n => KM.Audio.voPlayed["vo_story_0" + n] || null));
  checks.push(["all 4 story lines play Charlie's recordings (" + played4.map(s => s && s.split("/").pop()).join(", ") + ")", played4.every(s => /(assets\/audio\/vo|incoming\/vo_narrator)\/vo_story_0\d\.(ogg|mp3)$/.test(s || ""))]);
  checks.push([`no keypress: every chunk of every line shown by itself (${JSON.stringify(Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, [...v]])))} of ${JSON.stringify(nChunks)})`, nChunks.every((n, i) => seen[i] && seen[i].size === n)]);
  checks.push([`then the name prompt follows line 4 by itself (mode ${q.m} after ${secs} s)`, q.m === "name"]);
  // a missing recording (forced: every format of vo_story_02 404s): silent, the bubble waits for the key
  const p2 = await b.newPage({ viewport: { width: 1600, height: 900 } }); p2.on("pageerror", e => errors.push(e.message));
  await p2.route(/vo_story_02\.(ogg|mp3|wav)$/, r => r.fulfill({ status: 404, body: "" }));
  await p2.goto(URL); await p2.waitForFunction(() => !document.getElementById("kmLoader"), null, { timeout: 60000 }); await p2.keyboard.press("Enter");
  let r2 = null; for (let k = 0; k < 300; k++) { r2 = await spOf(p2); if (r2.i === 1) break; await sleep(50); }
  await sleep(2500); const i2 = await p2.evaluate(() => ({ i: __km.S.intro.i, c: __km.S.actors.find(q => q.narrator).sp.i, fail: !!KM.Audio.voFail.vo_story_02 }));
  checks.push(["missing vo_story_02: silent, the bubble waits for the key on its first chunk (" + JSON.stringify(i2) + ")", i2.i === 1 && i2.c === 0 && i2.fail]);
  const steps = []; for (let k = 1; k < nChunks[1]; k++) { await p2.keyboard.press("Space"); await sleep(250); steps.push(await spOf(p2)); }
  checks.push(["no recording: one chunk per keypress (" + JSON.stringify(steps.map(q => [q.i, q.c])) + ")", steps.every((q, k) => q.i === 1 && q.c === k + 1)]);
  await p2.keyboard.press("Space"); await sleep(300);
  checks.push(["a keypress on the last chunk moves on to the next line", (await p2.evaluate(() => __km.S.intro.i)) === 2]);
  checks.push(["no page errors (" + errors.join(" | ") + ")", errors.length === 0]);
  let ok = true; for (const [n, v] of checks) { console.log((v ? "  ok   " : "  FAIL ") + n); ok = ok && !!v; }
  await b.close(); console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})();
