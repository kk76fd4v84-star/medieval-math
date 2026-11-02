// v11b tavern fare (Magnus): "mead lowers intelligence as scroll of stupidity but just for 1 battle and stew heals 1 heart".
// Sign hotspot + pendulum swing, Mead / Stew plaques, stew = +1 heart (capped), mead = every sum of the NEXT battle is a
// stupid sum (no scroll used; a scroll cast in that battle is refused), saved as "waiting" (save v7).
// Run: URL=http://localhost:8799/index.html node tests/mead.test.js
const path = require("path");
let playwright;
try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const ROOT = path.resolve(__dirname, "..");
const URL = process.env.URL || "http://localhost:8799/index.html";
const SHOTS = path.join(ROOT, "screenshots");
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await playwright.chromium.launch(); const page = await browser.newPage({ viewport: { width: 1600, height: 900 } }); const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  const ev = f => page.evaluate(f), checks = [];
  await page.goto(URL); await ev(() => localStorage.clear()); await page.reload(); await sleep(800);
  await page.keyboard.press("Enter"); await sleep(300); await page.keyboard.press("Escape"); await sleep(200); await page.fill("#nameInput", "Magnus"); await page.keyboard.press("Enter");
  for (let i = 0; i < 8 && (await ev(() => __km.mode())) !== "walk"; i++) { await page.keyboard.press("Space"); await sleep(150); }
  const typeAns = async () => { const a = String(await ev(() => __km.answer())); for (const c of a) await page.keyboard.press(c); await page.keyboard.press("Enter"); };
  // drive the road until a condition; fights are won with weak swings
  const drive = async (until, max = 900) => { await ev(() => __km.setSpeed(4));
    for (let i = 0; i < max; i++) { const st = await ev(() => ({ m: __km.mode(), ph: __km.phase(), rest: __km.S.enc && __km.S.enc.st && __km.S.enc.st.rest, view: __km.S.view && __km.S.view.id }));
      if (await until(st)) return st;
      if (st.ph === "approach") { await ev(() => __km.setSpeed(1)); await page.keyboard.press("Enter"); }
      else if (st.ph === "choose") await page.keyboard.press("1");
      else if (st.ph === "math") await typeAns();
      else if (st.ph === "riddle") await page.keyboard.press(String(await ev(() => __km.S.enc.riddle.answer + 1)));
      else if (st.ph === "recruit") await page.keyboard.press("n");
      else if (/Walk on|Break camp/.test(await ev(() => __km.panelText()))) await page.keyboard.press("Enter");
      else if (st.m === "walk") await ev(() => __km.setSpeed(4));
      await sleep(150); }
    throw new Error("drive timeout " + JSON.stringify(await ev(() => ({ m: __km.mode(), ph: __km.phase(), stop: __km.S.stop, type: __km.S.stops[__km.S.stop] && __km.S.stops[__km.S.stop].type, panel: __km.panelText().slice(0, 120) })))); };
  await drive(st => st.m === "encounter" && st.rest === "tavern");
  await ev(() => __km.setSpeed(1)); await sleep(1200);
  const mus = () => ev(() => __km.music()), mOutside = await mus();
  await page.keyboard.press("i"); await sleep(4000);
  { const mIn = await mus(); // v12r (Magnus: "only play the bard music with voices inside the actual tavern")
    checks.push(["music: arrival/exterior keeps the road music (" + mOutside.cat + "), the sung tavern songs play only inside (" + mIn.cat + " " + mIn.track + ")",
      mOutside.cat === "world" && !mOutside.vocal && mIn.cat === "tavern" && mIn.vocal && mIn.place === "tavern-interior"]); }
  const t0 = await ev(() => __km.tavern());
  checks.push(["entering: the highlight starts on the sign's first line (Mead); Mead / Stew / Fire bottle are lines ON the sign, none on the strip (v12q) (" + JSON.stringify(t0 && t0.spots.slice(0, 3).map(q => q.id)) + ")", t0 && t0.sel === 0 && t0.spots[0].kind === "fare" && t0.spots[0].item === "mead" && t0.spots[1].item === "stew" && (await ev(() => document.querySelectorAll("#panel button.plaque").length)) === 0]);
  // the sign swings about its nail when selected and settles
  await ev(() => { __km.S.gold = 0; }); await page.keyboard.press("Enter"); await sleep(120); // v12q: Enter on a line buys it (refused here: no gold) and knocks the board
  let a1 = 0; for (let k = 0; k < 8; k++) { const a = await ev(() => __km.signAngle()); if (Math.abs(a) > Math.abs(a1)) a1 = a; await sleep(25); } // peak of the swing
  await page.screenshot({ path: SHOTS + "/18_tavern_sign_swinging.png" }); await sleep(1500);
  const a2 = await ev(() => __km.signAngle());
  checks.push(["sign swings (" + a1.toFixed(2) + "°) then settles within ~1.5 s (" + a2.toFixed(2) + "°)", Math.abs(a1) > 1 && Math.abs(a1) <= 8.01 && a2 === 0]);
  // stew: exactly +1 heart, capped at max
  await ev(() => { __km.S.gold = 20; __km.S.hp = __km.maxHp() - 1; __km.rerenderRest && __km.rerenderRest(); });
  await page.keyboard.press("ArrowRight"); await sleep(150); await page.keyboard.press("ArrowLeft"); await sleep(300); // back to the sign (its plaques re-render)
  const h0 = await ev(() => ({ hp: __km.S.hp, gold: __km.S.gold }));
  await page.keyboard.press("2"); await sleep(250);
  const h1 = await ev(() => ({ hp: __km.S.hp, gold: __km.S.gold, max: __km.maxHp(), stewOff: __km.fare().find(f => f.id === "stew").off }));
  checks.push(["stew: +1 heart for 2 gold, then greyed out at full hearts (" + JSON.stringify([h0, h1]) + ")", h1.hp === h0.hp + 1 && h1.hp === h1.max && h1.gold === h0.gold - 2 && h1.stewOff]);
  await page.keyboard.press("2"); await sleep(150);
  checks.push(["stew never heals past the max", (await ev(() => __km.S.hp)) === h1.max]);
  // mead: 3 gold, waits for the next battle, one at a time, saved
  const sp0 = await ev(() => ({ spells: __km.S.spells, left: __km.S.spellLeft }));
  await page.keyboard.press("1"); await sleep(250);
  const m1 = await ev(() => ({ mead: __km.mead(), gold: __km.S.gold, badge: __km.spellBadge(), saved: JSON.parse(localStorage.getItem("knightMath.save")) }));
  await page.keyboard.press("1"); await sleep(200);
  checks.push(["mead: 3 gold, waiting for the next battle, icon badge (no count), saved as mead 1 in save v7 (" + JSON.stringify({ m: m1.mead, g: m1.gold, b: !!m1.badge, v: m1.saved.version, sm: m1.saved.mead }) + ")",
    m1.mead.state === 1 && !m1.mead.now && m1.gold === h1.gold - 3 && m1.badge && m1.badge.mead === 1 && m1.saved.version === 7 && m1.saved.mead === 1 && (await ev(() => __km.S.gold)) === m1.gold]);
  await page.screenshot({ path: SHOTS + "/18b_tavern_mead_bought.png" });
  // TEMP_BALANCE per-visit limits (Magnus): 1 mead, 2 stew; at the limit the plaque greys out and the barkeep says "That's your lot."
  { const LM = await ev(() => KM_DATA.restStops.types.tavern.limits);
    checks.push(["limits live in reststops.js tavern.limits (TEMP_BALANCE) and default to 1 mead / 2 stew (" + JSON.stringify(LM) + ")", LM && LM.mead === 1 && LM.stew === 2 && LM.lot === "That's your lot."]);
    await sleep(1900);
    const mOut = await ev(() => ({ left: __km.fareLeft("mead"), grey: (f => f.off && f.lot)(__km.fare().find(f => f.id === "mead")), said: __km.speechLog().slice(-3) }));
    checks.push(["mead limit hit after 1: sign line greyed, barkeep says it (" + JSON.stringify(mOut) + ")", mOut.left === 0 && mOut.grey && mOut.said.includes(LM.lot)]);
    const g0 = await ev(() => __km.S.gold); await ev(() => { __km.S.hp = 1; });
    await page.keyboard.press("ArrowRight"); await sleep(120); await page.keyboard.press("ArrowLeft"); await sleep(200);
    await page.keyboard.press("2"); await sleep(1500);
    const s2 = await ev(() => ({ hp: __km.S.hp, gold: __km.S.gold, left: __km.fareLeft("stew"), grey: (f => f.off && f.lot)(__km.fare().find(f => f.id === "stew")), said: __km.speechLog().slice(-1)[0] }));
    checks.push(["stew #2 heals, then the stew line on the sign greys out with \"That's your lot.\" (" + JSON.stringify(s2) + ")", s2.hp === 2 && s2.gold === g0 - 2 && s2.left === 0 && s2.grey && s2.said === LM.lot]);
    await page.screenshot({ path: SHOTS + "/18c_tavern_thats_your_lot.png" });
    await ev(() => { __km.S.gold = 50; }); await page.keyboard.press("ArrowRight"); await sleep(120); await page.keyboard.press("ArrowLeft"); await sleep(200);
    const n0 = await ev(() => __km.speechLog().length);
    await page.keyboard.press("2"); await sleep(200); await page.keyboard.press("1"); await sleep(200);
    const s3 = await ev(() => ({ hp: __km.S.hp, gold: __km.S.gold, mead: __km.S.mead, said: __km.speechLog().slice(-2) }));
    checks.push(["at the limit: 2 / 1 buy nothing even with gold, the barkeep repeats the line; mead never stacks (" + JSON.stringify(s3) + ")", s3.hp === 2 && s3.gold === 50 && s3.mead === 1 && s3.said.every(x => x === LM.lot)]);
    await page.evaluate(g => { __km.S.gold = g; }, m1.gold); }
  await page.keyboard.press("Escape"); await sleep(1500); // Esc = go outside
  { const mBack = await mus(); checks.push(["music: back outside the vocal songs fade out, road music again (" + mBack.cat + ")", mBack.cat === "world" && !mBack.vocal]); }
  // the next battle: every sum stupid, scroll not used, Z refused
  const fight = await drive(st => st.ph === "choose");
  const f0 = await ev(() => ({ mead: __km.mead(), spells: __km.S.spells, left: __km.S.spellLeft, z: !!document.querySelector('#panel [data-act="castSpell"]') }));
  checks.push(["battle start: the mead takes effect (no Stupidity button in the moves)", f0.mead.state === 2 && f0.mead.now && !f0.z]);
  await page.keyboard.press("z"); await sleep(250);
  checks.push(["Z during a mead battle is refused: no scroll used", (await ev(() => __km.S.spells)) === sp0.spells && (await ev(() => __km.S.spellLeft)) === 0]);
  let sums = 0, allStupid = true, guard = 0;
  while ((await ev(() => __km.mode())) === "encounter" && guard++ < 200) {
    const ph = await ev(() => __km.phase());
    if (ph === "choose") await page.keyboard.press("1");
    else if (ph === "math") { const p = await ev(() => __km.spell().problem); if (p && !p.stupid) allStupid = false; sums++; await typeAns(); }
    await sleep(150);
  }
  const f1 = await ev(() => ({ mead: __km.mead(), spells: __km.S.spells, left: __km.S.spellLeft }));
  checks.push(["all " + sums + " sums of that battle were stupid; scrolls untouched (" + JSON.stringify(f1) + ")", sums >= 2 && allStupid && f1.spells === sp0.spells && f1.left === 0]);
  checks.push(["the mead ends with the battle", f1.mead.state === 0 && !f1.mead.now]);
  await browser.close();
  checks.forEach(([n, v]) => console.log((v ? "  ok   " : "  FAIL ") + n));
  if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  const ok = checks.every(c => c[1]) && errors.length === 0;
  console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
