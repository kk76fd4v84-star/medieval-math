// Multi-enemy fights (Magnus) + Darkest-Dungeon-style strikes. Forces a 3-foe group on the first ordinary fight:
// all on the ground line in a row, none overlapping, each with its own hearts; a sword hits the 2 front-most; the next
// steps up; every living foe strikes; the fight ends when all are dead. Lunge: the attacker crosses to the target and
// comes back within the strike (< 1 s). URL=http://localhost:8799/index.html node tests/group.test.js
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html", sleep = ms => new Promise(r => setTimeout(r, ms));
const SH = require("path").resolve(__dirname, "../screenshots/v11b/group");
require("fs").mkdirSync(SH, { recursive: true });
(async () => {
  const b = await playwright.chromium.launch(); const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on("console", m => { if (/SKYDBG/.test(m.text())) console.log(m.text().slice(0, 1500)); }); page.on("pageerror", e => errors.push(e.message + " @ " + (e.stack || "").split("\n").slice(1, 3).join(" "))); const ev = f => page.evaluate(f), checks = [];
  await page.goto(URL); await ev(() => localStorage.clear()); await page.reload(); await sleep(800);
  await page.keyboard.press("Enter"); await sleep(300); await page.keyboard.press("Escape"); await sleep(200); await page.fill("#nameInput", "Magnus"); await page.keyboard.press("Enter");
  for (let i = 0; i < 8 && (await ev(() => __km.mode())) !== "walk"; i++) { await page.keyboard.press("Space"); await sleep(150); }
  const cfg = await ev(() => KM_DATA.combat.groups);
  checks.push(["TEMP_BALANCE groups: none before " + cfg.fromLeague + " leagues, chance " + cfg.chance + ", from " + cfg.lateLeague + " leagues " + cfg.lateChance + " (3 foes " + cfg.chance3 + "), sword hits " + cfg.swordHits,
    cfg.TEMP_BALANCE && cfg.fromLeague > 0 && cfg.swordHits === 2 && (await ev(() => __km.S.stops.filter(s => s.group && s.stopX / KM_DATA.world.pxPerLeague < KM_DATA.combat.groups.fromLeague).length)) === 0]);
  checks.push(["no groups at boss / mega / special stops", (await ev(() => __km.S.stops.filter(s => s.group && s.type !== "math").length)) === 0]);
  await ev(() => __km.forceGroup(["killer_rabbit", "goblin"]));
  await ev(() => __km.setSpeed(2));
  const off = []; let slide = 0;
  for (let it = 0; it < 900 && (await ev(() => __km.phase())) !== "approach"; it++) {
    const f = await ev(() => __km.foeFeet()); const vis = f.filter(a => !a.hill && a.sx > -200 && a.sx < 2600); if (vis.length >= 2) slide++;
    vis.forEach(a => off.push(+(a.feetY - a.groundY).toFixed(1))); await sleep(60); }
  if (0) console.log("dbg", await ev(() => [__km.mode(), __km.phase(), __km.S.stop, JSON.stringify(__km.group())]));
  await ev(() => __km.setSpeed(1)); await sleep(600); await page.screenshot({ path: SH + "/01_three_foes_arriving.png" });
  for (let i = 0; i < 60 && (await ev(() => __km.phase())) !== "choose"; i++) { if ((await ev(() => __km.phase())) === "approach") await page.keyboard.press("Enter"); await sleep(250); } await sleep(500);
  if (0) console.log("err", errors, await ev(() => __km.phase()));
  const g0 = await ev(() => ({ g: __km.group(), h: __km.foeHearts(), f: __km.foeFeet() }));

  await page.screenshot({ path: SH + "/02_three_foe_fight.png" });
  const VW = await ev(() => KM_LAYOUT.viewW);
  const vis0 = g0.g.filter(a => a.sx + a.ext[0] > 0 && a.sx + a.ext[1] < VW);
  let overlap = 0; const srt = g0.g.slice().sort((a, b) => a.x - b.x); for (let k = 1; k < srt.length; k++) if (srt[k - 1].x + srt[k - 1].ext[1] > srt[k].x + srt[k].ext[0]) overlap++;
  checks.push([`3 foes in a row, all on screen, none overlapping, each with its own hearts (${JSON.stringify(g0.g.map(a => [a.id, Math.round(a.sx)]))}, hearts ${g0.h.length})`, g0.g.length === 3 && vis0.length === 3 && overlap === 0 && g0.h.length === 3]);
  const hz = await ev(() => { const K = KM_LAYOUT.k; return __km.foeHearts().map(h => { const a = __km.S.enc.foes.find(f => f.id === h.id && Math.abs(((f.drawX + (KM_WIDE[f.id][0] + KM_WIDE[f.id][1]) / 2) * K) - (h.x + h.w / 2)) < 6); if (!a) return { id: h.id, off: 999 };
    const head = (a.drawY - KM_TALL[a.id]) * K; return { id: h.id, dx: Math.round((a.drawX + (KM_WIDE[a.id][0] + KM_WIDE[a.id][1]) / 2) * K - (h.x + h.w / 2)), gap: Math.round(head - (h.y + h.h)) }; }); });
  checks.push([`each hearts row centred on its monster and just above its head (${JSON.stringify(hz)})`, hz.length === 3 && hz.every(h => Math.abs(h.dx) <= 4 && h.gap >= 4 && h.gap <= 30)]);
  // birds / clouds / bubbles never on the hearts (sampled for 2 s with birds forced into the sky)
  await ev(() => KM.Scenery.birdsNow()); let skyHit = 0;
  for (let k = 0; k < 20; k++) { skyHit += await ev(() => { const K = KM_LAYOUT.k, H = __km.foeHearts(), sk = KM.Scenery.sky(), bb = __km.bubbles();
    const ov = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const bad = H.filter(h => sk.clouds.concat(sk.birds).some(c => c.a > 0.05 && ov({ x: c.x * K, y: c.y * K, w: c.w * K, h: c.h * K }, h)) || bb.some(b => ov(b, h))); if (bad.length && !window.__skyDbg) { window.__skyDbg = 1; console.log("SKYDBG", JSON.stringify({ H, c: sk.clouds, b: sk.birds, bb: bb.map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, t: b.text })) })); } return bad.length; }); await sleep(100); }
  checks.push([`no cloud, bird or bubble on the hearts (${skyHit} overlaps in 20 samples)`, skyHit === 0]);
  checks.push([`slide-in: ${slide} samples with >= 2 foes on screen; feet on the ground line (max off ${Math.max(0, ...off.map(Math.abs))} px)`, slide > 3 && off.every(d => Math.abs(d) <= 3) && g0.f.every(a => a.hill || Math.abs(a.feetY - a.groundY) <= 3)]);
  // one HARD swing: both front foes lose the damage, the third does not; mid-lunge screenshot both ways
  if (0) console.log("lunge", JSON.stringify(await ev(() => __km.lungeDbg())));
  const hp0 = g0.g.map(a => a.hp); const dmg = await ev(() => __km.hardDmg());
  await page.keyboard.press("2"); await sleep(300); const ans = String(await ev(() => __km.answer())); for (const c of ans) await page.keyboard.press(c);
  const tPress = Date.now(); await page.keyboard.press("Enter"); let hx = null;
  for (let i = 0; i < 80 && !hx; i++) { hx = await ev(() => { const h = __km.S.party[0]; return h.act && h.act.name === "attack" && h.act.t > 0.21 && h.act.t < 0.33 ? { name: h.act.name, reach: h.act.reach, dur: h.act.dur, t: h.act.t } : null; }); if (!hx) await sleep(10); }
  await page.screenshot({ path: SH + "/03_knight_mid_lunge.png" });
  await sleep(500); const g1 = await ev(() => __km.group());
  checks.push(["knight back on his spot after the strike", await ev(() => !__km.S.party[0].act || __km.S.party[0].act.t >= __km.S.party[0].act.dur)]);
  const hit = g1.map((a, k) => hp0[k] - Math.max(0, a.hp));
  checks.push([`a sword hits the 2 front-most foes (damage ${JSON.stringify(hit)}, hard = ${dmg})`, hit[0] === Math.min(dmg, hp0[0]) && hit[1] === Math.min(dmg, hp0[1]) && hit[2] === 0]);
  checks.push([`knight lunge: crosses ${hx && Math.round(hx.reach)} layout units to the front foe and back in ${hx && hx.dur} s`, hx && hx.name === "attack" && hx.reach >= 250 && hx.dur < 1]);
  // enemy lunge (wait for the enemy turn)
  let el = null; for (let i = 0; i < 40 && !el; i++) { el = await ev(() => { const f = (__km.S.enc && __km.S.enc.foes || []).find(a => a.act && a.act.name === "attack" && a.act.t > 0.12 && a.act.t < 0.3); return f ? { id: f.id, reach: f.act.reach } : null; }); if (!el) await sleep(25); }
  if (el) await page.screenshot({ path: SH + "/04_enemy_mid_lunge.png" });
  checks.push([`enemy lunge toward the knight (${JSON.stringify(el)})`, el && el.reach >= 250]);
  // keep fighting with hard swings until the fight is over
  for (let it = 0; it < 400; it++) { const s = await ev(() => ({ m: __km.mode(), ph: __km.phase(), ans: __km.answer() }));
    await ev(() => { __km.S.hp = __km.maxHp(); if (__km.S.enc) __km.S.enc.lost = 0; });
    if (s.m !== "encounter") break;
    if (s.ph === "choose") await page.keyboard.press("2"); else if (s.ph === "math") { for (const c of String(s.ans)) await page.keyboard.press(c); await page.keyboard.press("Enter"); }
    await sleep(120); }
  const end = await ev(() => ({ m: __km.mode(), gone: __km.S.actors.filter(a => a.extra && a.stop === __km.S.stop - 1).every(a => a.gone || a.dead || a.state === "vanish" || a.state === "corpse") }));
  checks.push(["the fight ends when all foes are dead (back on the road)", end.m === "walk" && end.gone]);
  checks.push(["no page errors (" + errors.join(" | ") + ")", errors.length === 0]);
  let ok = true; for (const [n, v] of checks) { console.log((v ? "  ok   " : "  FAIL ") + n); ok = ok && !!v; }
  await b.close(); console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})();
