// (the test refills hearts so a long weak-swing fight never ends the run; that is not what is being tested)
// v11 Spell of Stupidity: start with 1 scroll; Z casts it (road / your turn / mid-sum); the next N sums are the
// "stupid" level (single digits, + and - only); a bubble on cast + on wear-off, an icon countdown (no text);
// cast/wear-off hooks (sfx + VO ids); saved in the versioned save (v4 -> v5 migration keeps progress).
// Run: URL=http://localhost:8799/index.html node tests/spell.test.js
const path = require("path");
let playwright;
try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html";
const SHOTS = path.join(path.resolve(__dirname, ".."), "screenshots");
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on("pageerror", e => errors.push("pageerror: " + e.message)); page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  const checks = []; const ev = f => page.evaluate(f);
  const waitFor = async (f, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(f)) return; await sleep(80); } throw new Error("timeout " + f + " state " + JSON.stringify(await ev(() => ({ m: __km.mode(), p: __km.phase(), hp: __km.S.hp, party: __km.S.party.length, log: __km.speechLog().slice(-4) })))); };
  // walk on to the next battle; other stops are passed quickly (riddle answered, recruit declined, rest left)
  const toNextFight = async () => {
    await ev(() => __km.setSpeed(4));
    for (let i = 0; i < 2000; i++) {
      const q = await ev(() => (__km.S.hp = __km.maxHp(), __km.S.enc && (__km.S.enc.lost = 0), { mode: __km.mode(), phase: __km.phase(), type: __km.S.enc && __km.S.enc.type, ans: __km.S.enc && __km.S.enc.riddle ? __km.S.enc.riddle.answer : 0 }));
      if (q.mode === "encounter" && ["math", "boss"].includes(q.type) && (q.phase === "approach" || q.phase === "choose")) { await ev(() => __km.setSpeed(1)); if (q.phase === "approach") { await page.keyboard.press("Enter"); await sleep(1000); } return; }
      if (q.mode === "encounter") {
        if (q.phase === "riddle") await page.keyboard.press(String(q.ans + 1));
        else if (q.phase === "recruit") await page.keyboard.press("n");
        else if (q.phase === "frank") await page.keyboard.press("2");
        else if (q.phase === "math") { const a = String(await ev(() => __km.answer())); for (const ch of a) await page.keyboard.press(ch); await page.keyboard.press("Enter"); }
        else if (q.phase === "approach" || q.phase === "tavernOut" || q.phase === "rest") await page.keyboard.press("Enter");
        else if (q.phase === "choose") { await page.keyboard.press("2"); }
      }
      await sleep(150);
    }
    throw new Error("no fight reached");
  };
  await page.goto(URL); await ev(() => localStorage.clear()); await page.reload(); await sleep(1000);
  await page.keyboard.press("Enter"); await sleep(600); await page.keyboard.press("Escape"); await sleep(300);
  await page.fill("#nameInput", "Magnus"); await page.keyboard.press("Enter"); await sleep(200);
  for (let i = 0; i < 8 && (await ev(() => __km.mode())) !== "walk"; i++) { await page.keyboard.press("Space"); await sleep(150); }
  await waitFor(() => __km.mode() === "walk");
  const s0 = await ev(() => __km.spell());
  checks.push(["new game starts with " + KM_START() + " scroll", s0.charges === 1 && s0.left === 0]);
  function KM_START() { return 1; }
  // v11b (mockup): holding a scroll shows NOTHING in the status overlay; the spell is the "Stupidity" move in battle
  const hud0 = await ev(() => !document.querySelector("#hud .spell") && !__km.spellBadge());
  await sleep(1500);
  await page.keyboard.press("z"); await sleep(500);
  const c = await ev(() => ({ sp: __km.spell(), said: __km.speaking(), hud: document.querySelectorAll("#hud .spell").length, badge: __km.spellBadge(), log: [].concat(typeof __km.audioLog === "function" ? __km.audioLog() : __km.audioLog).slice(-6), vo: [].concat(typeof __km.voLog === "function" ? __km.voLog() : __km.voLog).slice(-2),
    files: __km.audioFiles ? __km.audioFiles() : KM.Audio.fileLog.slice(-6), saved: JSON.parse(localStorage.getItem("knightMath.save")), bub: __km.bubbles().map(b => b.text) }));
  await page.screenshot({ path: SHOTS + "/17_spell_of_stupidity_cast.png" });
  checks.push(["Z casts it: scroll used, 1 sum left; while active the scroll icon + countdown 1 sits at the top left beside the hearts (" + JSON.stringify(c.badge) + ")", hud0 && c.sp.charges === 0 && c.sp.left === 1 && c.hud === 0 && !!c.badge && c.badge.left === 1 && c.badge.x < 400 && c.badge.y < 40]);
  checks.push(["cast: ONE big hero bubble holding the whole line (" + c.bub.join(" | ") + ")", c.bub.some(t => /soft and warm\. Lovely|less clever\. Hooray|Ooh\. Small sums/.test(t))]);
  checks.push(["cast hooks: sfx 'scroll_use' (v12r Charlie) + VO 'vo_spell_cast'", c.log.includes("scroll_use") && c.files.some(f => /sfx\/scroll_use_[12]\.ogg/.test(f)) && c.vo.includes("vo_spell_cast")]);
  checks.push(["saved in the versioned save (v" + c.saved.version + ", spells " + c.saved.spells + ", left " + c.saved.spellLeft + ")", c.saved.version === 7 && c.saved.spells === 0 && c.saved.spellLeft === 1]);
  // fight: one stupid sum, then normal again
  await toNextFight();
  const probs = []; let wore = false, shot = false, zeroRow = null;
  for (let n = 0; n < 40 && probs.length < 7; n++) {
    const st = await ev(() => (__km.S.hp = __km.maxHp(), __km.S.enc && (__km.S.enc.lost = 0), { mode: __km.mode(), phase: __km.phase(), type: __km.S.enc && __km.S.enc.type }));
    if (st.mode === "walk" || (st.mode === "encounter" && !["math", "boss"].includes(st.type))) { await toNextFight(); continue; }
    if (st.phase === "choose") {
      if (!zeroRow) { await sleep(300); zeroRow = await ev(() => ({ charges: __km.spell().charges, panel: document.getElementById("panel").innerText, spellBtn: document.querySelectorAll('#panel [data-act="castSpell"]').length, hud: document.querySelectorAll("#hud .spell").length }));
        await page.screenshot({ path: SHOTS + "/03b_combat_turn_weak_hard_heal_0_scrolls.png" }); }
      await page.keyboard.press("1"); await sleep(200);
      const p = await ev(() => __km.spell().problem); probs.push(p);
      if (!shot && p.stupid) { await page.screenshot({ path: SHOTS + "/17b_spell_stupid_sum.png" }); shot = true; }
      const a = String(await ev(() => __km.answer())); for (const ch of a) await page.keyboard.press(ch); await page.keyboard.press("Enter"); await sleep(1400);
      if (probs.length === 1) { await sleep(400); wore = await ev(() => __km.speechLog().some(t => /brain is back|wears off/.test(t)) && [].concat(typeof __km.audioLog === "function" ? __km.audioLog() : __km.audioLog).includes("spell_wear_off") && [].concat(typeof __km.voLog === "function" ? __km.voLog() : __km.voLog).includes("vo_spell_wear_off"));
        await page.screenshot({ path: SHOTS + "/17c_spell_wears_off.png" }); }
    } else await sleep(150);
  }
  checks.push(["0 scrolls: spell hidden completely in the choice row (no greyed option) and the status row (" + JSON.stringify(zeroRow) + ")",
    !!zeroRow && zeroRow.charges === 0 && zeroRow.spellBtn === 0 && !/Spell|Stupidity|✶/.test(zeroRow.panel) && zeroRow.hud === 0 && /Weak swing/.test(zeroRow.panel) && /Heal/.test(zeroRow.panel) && !/\b[1-4]\s*(Weak|Hard|Heal)/.test(zeroRow.panel)]);
  const easy = p => { const m = p.text.match(/^(\d+) ([+−]) (\d+)$/); return !!m && +m[1] <= 9 && +m[3] <= 9; };
  checks.push(["only the next sum is the stupid level, single-digit + / − only (" + probs.slice(0, 1).map(p => p.text).join(", ") + ")", probs.length >= 2 && probs.slice(0, 1).every(p => p.stupid && easy(p))]);
  checks.push(["then it wears off: bubble + sfx 'spell_wear_off' + VO 'vo_spell_wear_off'; sum 2 is normal again (" + (probs[1] && probs[1].text) + ")", wore && probs[1] && !probs[1].stupid && probs[1].level !== "stupid"]);
  checks.push(["spell icon still hidden after it wears off (0 scrolls)", await ev(() => !document.querySelector("#hud .spell") && __km.spell().charges === 0 && __km.spell().left === 0)]);
  // no scrolls: Z = a cheeky bubble, nothing else
  await waitFor(() => __km.mode() === "walk" || __km.phase() === "choose", 30000);
  await page.keyboard.press("z"); await sleep(300);
  checks.push(["no scroll left: Z only says so", await ev(() => __km.speechLog().some(t => /No scrolls left/.test(t)) && __km.spell().left === 0)]);
  // mid-sum cast turns the open sum stupid; gold reward halved for a fight won with stupid sums (TEMP_BALANCE)
  const mid = await ev(() => { __km.S.spells = 1; return true; });
  await toNextFight();
  await waitFor(() => __km.phase() === "choose", 20000);
  await page.keyboard.press("2"); await sleep(200);
  const before = await ev(() => __km.spell().problem); await page.keyboard.press("z"); await sleep(250);
  const after = await ev(() => __km.spell().problem);
  checks.push(["Z mid-sum: the open sum becomes stupid (" + before.text + " -> " + after.text + ")", mid && !before.stupid && after.stupid && easy(after)]);
  const g0 = await ev(() => ({ gold: __km.S.gold, base: __km.S.enc.st.gold || 0 }));
  while (await ev(() => __km.mode() === "encounter")) {
    const ph = await ev(() => (__km.S.hp = __km.maxHp(), __km.S.enc && (__km.S.enc.lost = 0), __km.phase()));
    if (ph === "math") { const a = String(await ev(() => __km.answer())); for (const ch of a) await page.keyboard.press(ch); await page.keyboard.press("Enter"); await sleep(300); }
    else if (ph === "choose") { await page.keyboard.press("2"); await sleep(200); } else await sleep(120);
  }
  const g1 = await ev(() => __km.S.gold);
  checks.push(["TEMP_BALANCE: a fight won with stupid sums pays half gold (" + (g1 - g0.gold) + " of " + g0.base + ")", g1 - g0.gold === Math.floor(g0.base * 0.5)]);
  // v4 save (before the spell existed) -> v5: progress kept, 1 scroll given
  await ev(() => { const s = JSON.parse(localStorage.getItem("knightMath.save")); s.version = 4; delete s.spells; delete s.spellLeft; s.gold = 77; if (s.checkpoint) { delete s.checkpoint.spells; delete s.checkpoint.spellLeft; } localStorage.setItem("knightMath.save", JSON.stringify(s)); });
  await page.reload(); await sleep(900); await page.keyboard.press("Enter"); await sleep(400);
  const m = await ev(() => ({ v: JSON.parse(localStorage.getItem("knightMath.save")).version, sp: __km.spell(), gold: __km.S.gold, mode: __km.mode() }));
  checks.push(["v4 save -> v7: progress kept (gold " + m.gold + "), 1 scroll added", m.v === 7 && m.sp.charges === 1 && m.sp.left === 0 && m.gold === 77 && m.mode === "walk"]);
  await browser.close();
  checks.forEach(([n, v]) => console.log((v ? "  ok   " : "  FAIL ") + n));
  if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  const ok = checks.every(c => c[1]) && !errors.length; console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
