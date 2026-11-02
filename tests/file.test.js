// v10: the game opened straight from disk (file://, no server: Magnus double-clicking index.html). A file:// page cannot
// read canvas pixels back (tainted canvas), so v9 silently drew paper-WHITE scenery + a flat strip there. v10 uses the
// offline-precomputed ink (tools/import_v10.py): checks the scenery is tinted, the strip sheet is painted, no tint
// fallback message and no page errors.  Run: node tests/file.test.js
const path = require("path");
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
(async () => {
  const b = await playwright.chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] }); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [], logs = []; p.on("pageerror", e => errors.push(e.message)); p.on("console", m => { logs.push(m.text()); if (m.type() === "error") errors.push(m.text()); });
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await p.waitForTimeout(1200);
  await p.keyboard.press("Enter"); await p.waitForTimeout(250); await p.keyboard.press("Escape"); await p.waitForTimeout(150);
  await p.keyboard.type("Disk"); await p.keyboard.press("Enter"); await p.waitForTimeout(250); await p.keyboard.press("Space"); await p.keyboard.press("Space");
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => ({ proto: location.protocol, tinted: KM.Scenery.tintInfo().length, sheet: document.getElementById("strip").dataset.sheet, walking: __km.mode() }));
  await p.screenshot({ path: path.resolve(__dirname, "../screenshots/16_file_protocol_v10.png") });
  // voice-over from file:// (Magnus: "no VO plays"): the audio map is embedded (src/config/audio_map.js), so the VO hook
  // resolves to its file and the clip actually starts playing
  const vo = await p.evaluate(async () => { const played = []; const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { const pr = orig.call(this); played.push({ src: this.src, pr }); return pr; };
    KM.Audio.voice("vo_further_than_ever"); const rec = played.find(x => /vo_further_than_ever/.test(x.src)); let ok = false, err = "";
    if (rec) { try { await rec.pr; ok = true; } catch (e) { err = e.message; } }
    HTMLMediaElement.prototype.play = orig; return { mapped: (KM.Audio.map().vo_further_than_ever || {}).files, src: rec && rec.src.replace(/^.*assets/, "assets"), ok, err }; });
  const fallback = logs.filter(l => /tint unavailable|strip background unavailable|tainted/.test(l));
  const checks = [["opened from file://", r.proto === "file:"], ["scenery tinted from the precomputed ink (" + r.tinted + " images)", r.tinted >= 3],
    ["strip continues the parchment sheet (canvas, no data URL)", r.sheet === "1"], ["no untinted fallback (" + fallback.length + ")", fallback.length === 0], ["voice-over plays from file:// (" + JSON.stringify(vo) + ")", vo.ok && /vo_further_than_ever\.ogg$/.test(vo.src || "")], ["no page errors (" + errors.join(" | ") + ")", errors.length === 0]];
  checks.forEach(([n, ok]) => console.log((ok ? "  ok   " : "  FAIL ") + n));
  await b.close(); const ok = checks.every(c => c[1]); console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})();
