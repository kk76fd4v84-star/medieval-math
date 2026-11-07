// v12r (Magnus: "Very often the math timer does not start"): every path into a timed battle sum / fire-bottle word goes
// through startAnswerTimer(); this test enters each path and checks the answer timer exists and ADVANCES on its own:
// first (starter) fight, the next sum after a right answer, after a wrong answer, after a late answer, after Esc back,
// a scroll cast mid-sum (fresh timer), the fire bottle word, a group fight after a foe drops, and a stale hold (an act
// left on a dead foe) that must not freeze it. Run: URL=http://localhost:8799/index.html?debug node tests/timer.test.js
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html?debug", sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await playwright.chromium.launch(); const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  const ev = (f, a) => page.evaluate(f, a), checks = [];
  const until = async (f, ms = 15000, a) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(f, a)) return true; await sleep(50); } return false; };
  await page.goto(URL); await ev(() => localStorage.clear()); await page.reload(); await sleep(800);
  await page.keyboard.press("Enter"); await sleep(300); await page.keyboard.press("Escape"); await sleep(200); await page.fill("#nameInput", "Magnus"); await page.keyboard.press("Enter");
  for (let i = 0; i < 8 && (await ev(() => __km.mode())) !== "walk"; i++) { await page.keyboard.press("Space"); await sleep(150); }
  await ev(() => { window.__g = setInterval(() => { const S = __km.S; S.hp = __km.maxHp(); const e = S.enc; if (e) { e.lost = 0; if (e.revealed && !e.keepAlive) { (e.foes || [e.act]).forEach(a => { if (a.hp != null && !e.letDie) a.hp = Math.max(a.hp, 50); }); if (!e.letDie) e.hp = Math.max(e.hp, 50); } } }, 15); });
  const toChoose = async () => { for (let i = 0; i < 300 && (await ev(() => __km.phase())) !== "choose"; i++) { if ((await ev(() => __km.phase())) === "approach") { await ev(() => __km.setSpeed(1)); await page.keyboard.press("Enter"); } await sleep(100); } return (await ev(() => __km.phase())) === "choose"; };
  // the timer must run: present, and +>= 1.0 s over 1.5 s of real time
  const runs = async (name, ph = "math") => { await until(p => __km.phase() === p, 5000, ph); const a = await ev(() => __km.answerTimer()); await sleep(1500);
    const z = await ev(() => ({ tm: __km.answerTimer(), why: __km.timerWhy(), ph: __km.phase() }));
    checks.push([`${name}: timer runs (${a ? a.t.toFixed(2) : "none"} -> ${z.tm ? z.tm.t.toFixed(2) : "none"} s, hold: ${z.why})`, !!a && !!z.tm && z.tm.t - a.t >= 1.0]); };
  const pick = async act => { await page.click(`#panel button[data-act="${act}"]`); };
  const right = async () => { const n = await ev(() => __km.answer()); await page.keyboard.type(String(n)); await page.keyboard.press("Enter"); await sleep(200); };
  const wrong = async () => { const n = await ev(() => __km.answer()); await page.keyboard.type(String(n + 1)); await page.keyboard.press("Enter"); await sleep(200); };

  // ---- a single foe, the first (starter) fight
  await ev(() => { __km.debugJump("math"); __km.setSpeed(3); });
  if (await toChoose()) {
    await pick("pickWeak"); await runs("starter fight, first sum"); await right();
    await toChoose(); await pick("pickHard"); await runs("next sum after a right answer"); await wrong();
    await toChoose(); await pick("pickWeak"); await runs("next sum after a wrong answer");
    await ev(() => { __km.S.enc.tmr.t = __km.S.enc.tmr.secs - 0.05; }); await sleep(400);await right();
    await toChoose(); await pick("pickWeak"); await runs("next sum after a late answer");
    await page.keyboard.press("Escape"); await toChoose(); await pick("pickHard"); await runs("after Esc back to the moves");
    await ev(() => { __km.S.spells = 1; __km.S.spellLeft = 0; }); await page.keyboard.press("z"); await sleep(200);
    const sp = await ev(() => ({ stupid: __km.spell().problem.stupid, t: __km.answerTimer() && __km.answerTimer().t }));
    checks.push([`scroll cast mid-sum: a fresh timer (${JSON.stringify(sp)})`, sp.stupid && sp.t < 0.5]); await runs("scroll cast mid-sum");
    await ev(() => { const e = __km.S.enc, f = e.foes ? e.foes[0] : e.act; f.act = { name: "attack", t: 0, dur: 0.5 }; f.dead = true; }); // stale act on a "dead" foe
    await runs("a stale act left on a dead foe does not freeze it"); await ev(() => { const e = __km.S.enc, f = e.foes ? e.foes[0] : e.act; f.dead = false; f.act = null; });
    await ev(() => { __km.S.enc.act.act = { name: "stuck", t: 0, dur: 1e9 }; }); await sleep(3300); // a hold that never ends
    await runs("a hold that never ends: runs after answerPauseMax"); await ev(() => { __km.S.enc.act.act = null; });
  } else checks.push(["reached the first fight", false]);

  // ---- a 3-foe fight: the fire bottle word, then a sum after the front foe drops
  await ev(() => { __km.debugJump("goblin"); __km.S.bottles = 1; __km.forceGroup(["killer_rabbit", "goblin"]); __km.setSpeed(3); });
  if (await toChoose()) {
    await pick("pickFire"); await runs("fire bottle word", "spell");
    await ev(() => { __km.S.enc.tmr.t=__km.S.enc.tmr.secs; });const word=await ev(()=>__km.S.enc.spell.word);await page.keyboard.type(word);await until(() => __km.phase() !== "spell", 12000);
    await toChoose(); await ev(() => { const e = __km.S.enc; e.letDie = true; e.foes[0].hp = 1; e.hp = 1; }); await pick("pickHard"); await right();
    await until(() => (__km.group() || []).filter(a => a.hp <= 0 || a.gone).length >= 1, 8000); await ev(() => { __km.S.enc.letDie = false; });
    if (await toChoose()) { await pick("pickWeak"); await runs("group fight, next sum after a foe drops"); }
    else checks.push(["group fight continues after a foe drops", false]);
  } else checks.push(["reached the group fight", false]);
  checks.push([`no page errors (${errors.join(" | ")})`, errors.length === 0]);
  checks.forEach(([n, ok]) => console.log((ok ? "  ok   " : "  FAIL ") + n));
  await b.close(); const ok = checks.every(c => c[1]); console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})();
