// Combat / walk SFX (incoming/sfx_combat -> assets/audio/sfx), opened from file:// like Magnus does.
// Steps on foot contacts (no immediate repeat, -7 dB), swing per attack (04 = Hard swing), flesh / armour hits by
// material (comic 04 ~1 in 8), the boss hit in boss fights.  Run: node tests/sfx.test.js
const path = require("path");
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await playwright.chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] }); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; p.on("pageerror", e => errors.push(e.message)); const ev = f => p.evaluate(f), checks = [];
  await p.goto("file://" + path.resolve(__dirname, "../index.html")); await sleep(1000);
  // record every media play() (src + whether it really started)
  await ev(() => { window.__plays = []; const o = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { const r = o.call(this); const rec = { src: this.src.replace(/^.*assets\/audio\//, ""), vol: this.volume, ok: null }; __plays.push(rec); r.then(() => rec.ok = true, () => rec.ok = false); return r; }; });
  await p.keyboard.press("Enter"); await sleep(300); await p.keyboard.press("Escape"); await sleep(200); await p.keyboard.type("Sfx"); await p.keyboard.press("Enter");
  for (let i = 0; i < 8 && (await ev(() => __km.mode())) !== "walk"; i++) { await p.keyboard.press("Space"); await sleep(150); }
  await sleep(3000);
  const w = await ev(() => __plays.filter(x => /sfx_step_/.test(x.src)));
  const rep = w.filter((x, i) => i && x.src === w[i - 1].src && x.vol === w[i - 1].vol).length;
  checks.push([`walking: ${w.length} steps from the 6 step files at -7 dB, no immediate repeat, playing from file:// (${[...new Set(w.map(x => x.src))].join(",")})`, w.length >= 4 && w.every(x => /sfx_step_0[1-6]\.ogg$/.test(x.src)) && w.some(x => Math.abs(x.vol - 0.447) < 0.01) && rep === 0 && w.some(x => x.ok)]);
  // first fight (goblin, flesh): one weak and one hard swing
  for (let it = 0; it < 600 && (await ev(() => __km.phase())) !== "choose"; it++) { const ph = await ev(() => __km.phase()); if (ph === "approach") await p.keyboard.press("Enter"); await sleep(100); }
  const n0 = await ev(() => __plays.length), enemy = await ev(() => __km.S.enc.act.id);
  for (const key of ["1", "2"]) { if ((await ev(() => __km.phase())) !== "choose") break; await p.keyboard.press(key); await sleep(300);
    const a = String(await ev(() => __km.answer())); for (const c of a) await p.keyboard.press(c); await p.keyboard.press("Enter"); await sleep(1600); }
  const f = await p.evaluate(n0 => __plays.slice(n0).map(x => x.src), n0);
  checks.push([`fight vs ${enemy}: weak swing 01-03, hard swing 04, flesh hits (${f.join(" ")})`, f.some(s => /sfx_swing_0[1-3]/.test(s)) && f.includes("sfx/sfx_swing_04.ogg") && f.filter(s => /sfx_hit_flesh_0[1-4]/.test(s)).length >= 1 && f.every((s, i) => !/sfx_correct/.test(s) || !f[i + 2] || /sfx_hit_flesh/.test(f[i + 2]))]); // the PARTY's hits (right answer -> swing -> hit) are flesh; the goblin's hits on the knight are armour
  // mapping + rarity (stubbed play: decide only)
  const r = await ev(() => { const cnt = { hit_flesh: 0, hit_armour: 0 }, o = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { if (/_04\./.test(this.src)) cnt[/flesh/.test(this.src) ? "hit_flesh" : "hit_armour"]++; return Promise.resolve(); };
      for (let i = 0; i < 1600; i++) { KM.Audio.play("hit_flesh"); KM.Audio.play("hit_armour"); } HTMLMediaElement.prototype.play = o;
      const M = KM.Audio.map(); return { flesh04: cnt.hit_flesh / 1600, armour04: cnt.hit_armour / 1600, mat: { bk: KM_DATA.enemies.black_knight.material, sk: KM_DATA.enemies.skeleton_knight.material, gob: KM_DATA.enemies.goblin.material }, boss: M.hit_boss.files, hard: M.swing_hard.files }; });
  checks.push([`comic 04 hits are rare (flesh ${(r.flesh04 * 100).toFixed(1)} %, armour ${(r.armour04 * 100).toFixed(1)} %, target ~12.5 %)`, r.flesh04 > 0.08 && r.flesh04 < 0.18 && r.armour04 > 0.08 && r.armour04 < 0.18]);
  checks.push(["materials: black knight + skeleton = armour, goblin = flesh; boss hit = sfx_hit_boss_01; Hard swing = sfx_swing_04 (" + JSON.stringify(r) + ")", r.mat.bk === "armour" && r.mat.sk === "armour" && r.mat.gob === "flesh" && r.boss[0] === "sfx/sfx_hit_boss_01.ogg" && r.hard[0] === "sfx/sfx_swing_04.ogg"]);
  checks.push(["no page errors (" + errors.join(" | ") + ")", errors.length === 0]);
  let ok = true; for (const [n, v] of checks) { console.log((v ? "  ok   " : "  FAIL ") + n); ok = ok && !!v; }
  await b.close(); console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})();
