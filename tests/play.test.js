// v7 headless playthrough: intro -> name -> walk (parallax + mist) -> every stop type with the GAME_DESIGN rules:
// hidden strength + commit/avoid, weak/hard/heal turn combat with enemy turns, hunters pursuit, riddles, recruiting by
// maths + D20 contest, Frank's restraint branch, tavern facade -> interior, camp view, shop, mega boss D20 -> victory.
// Also: save migrations v1 -> v4 and v3 -> v4. Fails on ANY page error / console error.
// Run (needs a static server for the art): URL=http://localhost:8799/index.html node tests/play.test.js
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
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console: " + m.text()); });
  const st = () => page.evaluate(() => ({ mode: __km.S.mode, phase: __km.phase(), type: __km.S.enc && __km.S.enc.type, stop: __km.S.stop, hp: __km.S.hp, gold: __km.S.gold, party: __km.S.party.length, str: __km.strength(), hunters: __km.hunters() }));
  const waitFor = async (pred, ms = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(); if (pred(s)) return s; await sleep(80); } throw new Error("timeout waiting; state " + JSON.stringify(await st())); };
  const typeAnswer = async (wrong) => { const a = wrong ? "9999" : String(await page.evaluate(() => __km.answer())); for (const c of a) await page.keyboard.press(c); await page.keyboard.press("Enter"); await sleep(120); };
  const KM_GAP = 650; let KM_RT_CH = {}; const KM_DATA_GY = 983; // world.groundY (layout) // KM.Scenery sky cloudGap[0]
  const shot = name => page.screenshot({ path: SHOTS + "/" + name + ".png" });
  const checks = [];
  const seen = {}; const restKinds = new Set(); let partyMax = 0, riddleNo = 0, fights = 0, avoided = false, contestDone = false, recruitedAtRest = 0;
  // bubbles must not overlap each other; UI only in the strip
  let bubbleViolations = 0, bubbleSamples = 0, uiViolations = 0, padSeen = 0, headHits = 0, smallText = [], maxLines = 0;
  const sampleBubbles = async () => {
    const r = await page.evaluate(() => {
      const L = __km.L, bs = __km.bubbles(); const sr = document.getElementById("stage").getBoundingClientRect(), k = 1600 / sr.width;
      const ov = (a, b) => a.x < b.x + b.w - 1 && a.x + a.w > b.x + 1 && a.y < b.y + b.h - 1 && a.y + a.h > b.y + 1;
      let bad = 0;
      // v11: big type (>= 28 px), <= maxLines short lines, inside the scene, no bubble over another bubble or over anyone's head
      const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
      const hs = __km.heads(); let heads = 0, lines = 0;
      for (let i = 0; i < bs.length; i++) { for (let j = i + 1; j < bs.length; j++) if (ov(bs[i], bs[j])) bad++;
        if (bs[i].y < 0 || bs[i].y + bs[i].h > L.scene.h || bs[i].x < 0 || bs[i].x + bs[i].w > L.scene.w || bs[i].font < 28 || bs[i].lines.length > L.speech.maxLines) bad++;
        lines = Math.max(lines, bs[i].lines.length); for (const h of hs) if (area(bs[i], h) > 600) heads++; }
      let uiInScene = 0; const small = [];
      document.querySelectorAll("#strip *").forEach(el => { const q = el.getBoundingClientRect(); if (!el.closest("#divider") && q.width && q.height && (q.top - sr.top) * k < L.strip.y - 0.5) { uiInScene++; small.push("OVER:" + el.tagName + "." + el.className + "@" + Math.round((q.top - sr.top) * k)); }
        const txt = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join("");
        if (txt && q.width && q.height && parseFloat(getComputedStyle(el).fontSize) < 28) small.push(el.tagName + "." + el.className + ":" + txt.slice(0, 20) + "@" + getComputedStyle(el).fontSize); });
      return { n: bs.length, bad, uiInScene, heads, small, lines };
    });
    headHits += r.heads; smallText.push(...r.small); maxLines = Math.max(maxLines, r.lines);
    padSeen += await page.evaluate(() => document.querySelectorAll("[data-key], .digits, .ops").length);
    bubbleSamples += r.n; bubbleViolations += r.bad; uiViolations += r.uiInScene;
  };
  const mus = () => page.evaluate(() => __km.music());
  let musicBad = 0; const musicSeen = [];
  const wantMusic = (type, enemy, rest) => ({ math: "battle", boss: enemy === "skeleton_knight" ? "wizard" : "battle", mega: "heavy_boss", special: "battle", riddle: "world", recruit: "world",
    rest: { tavern: "world", campsite: "camp", shop: "shop", stall: "world" }[rest] }[type]);

  await page.goto(URL); await page.evaluate(() => localStorage.clear()); await page.reload();
  KM_RT_CH = await page.evaluate(() => KM_DATA.recruitTalk.challenge);
  await sleep(1200);
  await shot("00_title");
  await page.keyboard.press("Enter");
  await sleep(2600);
  await page.keyboard.press("Space"); await sleep(300); await page.keyboard.press("Space"); await sleep(1500);
  await shot("01_intro_dragon"); await sampleBubbles();
  await page.keyboard.press("Escape"); await sleep(400);
  await page.fill("#nameInput", "Magnus"); await page.keyboard.press("Enter"); await sleep(300);
  for (let i = 0; i < 8 && (await st()).mode !== "walk"; i++) { await page.keyboard.press("Space"); await sleep(150); }
  await waitFor(s => s.mode === "walk");
  await sleep(2200);
  await shot("02_walking_parallax"); await sampleBubbles();
  { // v11b sky: Magnus's clouds never overlap (min horizontal gap), stay in the sky band; birds flap 1-2-3-4-3-2
    await page.evaluate(() => KM.Scenery.birdsNow()); const sky = []; for (let i = 0; i < 12; i++) { sky.push(await page.evaluate(() => KM.Scenery.sky())); await sleep(250); }
    let over = 0, minGap = 1e9, n = 0, band = true; const frames = new Set();
    sky.forEach(q => { const c = q.clouds.slice().sort((a, b) => a.x - b.x); n = Math.max(n, c.length);
      c.forEach((a, i) => { if (a.y < 60 || a.y + a.h > 420) band = false; c.slice(i + 1).forEach(b => { if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) over++; }); if (c[i + 1]) minGap = Math.min(minGap, c[i + 1].x - (a.x + a.w)); });
      q.birds.forEach(b => frames.add(b.frame)); });
    checks.push(["sky: painted clouds never overlap (min gap " + Math.round(minGap) + " layout units, <= " + n + " on screen), in the sky band; a bird flock flaps (frames " + [...frames].sort().join(",") + ")", over === 0 && (minGap === 1e9 || minGap >= KM_GAP) && band && n <= 4 && frames.size >= 2]);
  }
  checks.push(["no parchment mist bands between layers (v11b, Magnus)", await page.evaluate(() => !KM_DATA.scenery.rearMist && !KM_DATA.scenery.frontMist)]);
  checks.push(["painted parallax scenery active (tinted strips), strip carries the ground line", await page.evaluate(() => KM.Scenery.available() && (document.getElementById("divider").classList.contains("hidden") || document.getElementById("divider").classList.contains("magnus")))]); // v11b: Magnus's painted divider
  { const m = await mus(); checks.push(["music: world music on the road (" + m.track + ")", m.unlocked && m.cat === "world" && m.playing]); }
  await page.evaluate(() => __km.setSpeed(4));

  while (true) {
    const s = await waitFor(s => s.mode === "encounter" || s.mode === "win" || s.mode === "gameover" || s.mode === "dying", 90000);
    if (s.mode !== "encounter") { console.log("end:", s.mode); break; }
    await page.evaluate(() => __km.setSpeed(1)); await sleep(450); await sampleBubbles();
    const info = await page.evaluate(() => ({ enemy: __km.S.enc.st.enemy, rest: __km.S.enc.st.rest }));
    const key = s.type + (info.rest ? "_" + info.rest : "");
    if (["math", "boss", "mega"].includes(s.type)) {
      // hidden strength: no stats, no battle music until the commit
      const pre = await page.evaluate(() => ({ enemy: __km.enemy(), panel: document.getElementById("panel").textContent, distant: __km.S.enc.act.distant }));
      const m0 = await mus();
      checks.push([`${key}: strength hidden + creature distant before commit, big 'Enter Fight' option, no battle music yet`, !pre.enemy && /Fight/.test(pre.panel) && pre.distant && m0.cat === "world"]);
      if (!seen.approach) { await shot("03_hidden_strength_commit_or_avoid"); seen.approach = true; }
      { // Magnus: ordinary fights are mandatory, no skip / flee / avoid; pressing A does nothing
        const h0 = s.hunters; await page.keyboard.press("a"); await sleep(200);
        const a = await st(); const pn = await page.evaluate(() => document.getElementById("panel").textContent);
        checks.push([`${key}: mandatory fight, no Avoid / Skip / Flee offered and A does nothing`, !/Avoid|Skip|Flee|Run/.test(pn) && a.mode === "encounter" && a.hunters === h0]); avoided = true; }
      await page.keyboard.press("Enter"); await sleep(1000);
      const m1 = await mus(); if (m1.cat !== wantMusic(s.type, info.enemy)) { musicBad++; console.log("music mismatch", key, m1.cat); } musicSeen.push(key + "→" + m1.cat);
      const en = await page.evaluate(() => __km.enemy());
      checks.push([`${key}: commit reveals strength (${JSON.stringify(en)})`, !!en && en.hp > 0 && en.atk > 0]);
      if (s.type === "boss" && !seen.boss) await shot("06_midboss");
      if (s.type === "mega") {
        await shot("08b_mega_boss_choice");
        if ((await st()).party > 1) { const b0 = await page.evaluate(() => __km.S.enc.bonus), p0 = (await st()).party;
          await page.keyboard.press("s"); await sleep(150); await page.keyboard.press("1"); await sleep(400);
          const b1 = await page.evaluate(() => __km.S.enc.bonus), p1 = (await st()).party;
          checks.push(["mega: sacrifice removes exactly one member, +3 to the D20", b1 === b0 + 3 && p1 === p0 - 1]); }
        await page.evaluate(() => (__km.forceRoll = 20));
        const need = await page.evaluate(() => KM_DATA.combat.d20.dragonPower - __km.strength() - __km.S.enc.bonus);
        if (need <= 20) {
          await page.keyboard.press("r"); await sleep(700); await shot("05_d20_rolling");
          const d = await page.evaluate(() => __km.dice()); await sleep(1700); await shot("05b_d20_result");
          checks.push(["D20: result chosen first, roll-to-N sheet plays, holds the result", d.length === 1 && d[0].result === 20 && !d[0].done]);
        }
        while ((await st()).mode === "encounter") { const ph = (await st()).phase; if (ph === "choose") { await page.keyboard.press("2"); await sleep(150); await typeAnswer(); } else await sleep(150); }
        fights++; seen[key] = true; await page.evaluate(() => __km.setSpeed(4)); continue;
      }
      // turn combat
      await page.waitForFunction(() => __km.phase() === "choose");
      if (!seen.choice) { await sleep(300); await shot("03b_combat_turn_weak_hard_heal"); seen.choice = true;
        const pn = await page.evaluate(() => document.getElementById("panel").textContent);
        checks.push(["combat turn (mockup): 'Choose your move.' + 'Weak swing  Hard swing  Heal' (v12e: no key labels), no sub-lines (" + pn.replace(/\s+/g, " ").trim() + ")", /Choose your move\./.test(pn) && /Weak swing\s*Hard swing\s*Heal/.test(pn) && !/(^|\s)[1-9](\s|$)/.test(pn) && !/dmg|damage|enemy|easy sum|light hit|heavy hit|turns/i.test(pn)]);
        const ui = await page.evaluate(() => {
          const mv = [...document.querySelectorAll("#panel button.plaque")], R = el => el.getBoundingClientRect();
          return { n: mv.length, banners: mv.every(b => /button_frame/.test(getComputedStyle(b).borderImageSource) && !b.querySelector("kbd") && !!b.querySelector("svg:not(.plq), img.spellicon")),
            oneRow: new Set(mv.map(b => Math.round(R(b).top))).size === 1, spell: !!document.querySelector('#panel [data-act="castSpell"]:not([disabled])'), spellTxt: (document.querySelector('#panel [data-act="castSpell"]') || {}).textContent,
            hearts: __km.heartsUI(), hudSpell: document.querySelectorAll("#hud .spell").length, hudHearts: document.querySelectorAll("#hud .hearts, #panel .hearts").length,
            purse: (() => { const p = document.querySelector("#hud .purse-at"), sr = R(document.getElementById("stage")), z = sr.width / 1600; return p && { x: (R(p).left - sr.left) / z, y: (R(p).top - sr.top) / z, img: !!p.querySelector("img.purseimg"), h: R(p.querySelector("img")).height / z }; })(),
            meter: (() => { const m = document.querySelector("#hud .hunt"), sr = R(document.getElementById("stage")), z = sr.width / 1600; return { cx: (R(m).left + R(m).width / 2 - sr.left) / z, top: (R(m).top - sr.top) / z, txt: m.textContent.trim(), skull: m.querySelectorAll("svg").length, dots: m.querySelectorAll("b").length }; })(),
            hudText: document.getElementById("hud").innerText.replace(/\s+/g, " ").trim() };
        });
        checks.push(["moves: Maggi's ornamented frame buttons (v12q) in ONE row (icon + name, no key seal: v12e); spell = 'Stupidity' plaque, no count (" + JSON.stringify({ n: ui.n, banners: ui.banners, oneRow: ui.oneRow, spellTxt: ui.spellTxt }) + ")", ui.n >= 4 && ui.banners && ui.oneRow && ui.spell && /^\s*Stupidity\s*$/.test(ui.spellTxt)]);
        const ph = ui.hearts.party, fh = ui.hearts.foe;
        checks.push(["status (mockup): party hearts top left (2 per member, no label/2-2), purse + number right under them, meter top centre with no caption, no spell/hearts in the strip (" + JSON.stringify({ ph, purse: ui.purse, meter: ui.meter, hud: ui.hudText }) + ")",
          !!ph && ph.x < 40 && ph.y < 40 && ph.max === 2 * (await page.evaluate(() => __km.S.party.length)) && !!ui.purse && ui.purse.img && ui.purse.x < 40 && ui.purse.y >= ph.y + ph.h && ui.purse.y < ph.y + ph.h + 30 && Math.abs(ui.purse.h - 38) < 2
          && Math.abs(ui.meter.cx - 800) < 4 && ui.meter.top < 40 && ui.meter.txt === "" && ui.meter.skull === 2 && !/PARTY|Hunters|steps|\d\s*\/\s*\d/i.test(ui.hudText) && ui.hudSpell === 0 && ui.hudHearts === 0]);
        checks.push(["monster's hearts: small, just above the monster in the scene (" + JSON.stringify(fh) + ")", !!fh && fh.hp > 0 && fh.y < 600 && fh.h >= 18]); }
      if (fights === 0) { // a failed weak swing: hunters +1, the action does nothing, then ONE enemy turn (no duplicate penalty)
        const b = await st(), e0 = await page.evaluate(() => __km.enemy());
        await page.keyboard.press("1"); await sleep(250);
        const cen = async () => page.evaluate(() => { const q = document.querySelector("#panel .problem"), sr = document.getElementById("stage").getBoundingClientRect(), z = sr.width / 1600, r = q.getBoundingClientRect(), a = document.getElementById("answer");
          return { cx: (r.left + r.width / 2 - sr.left) / z, line: getComputedStyle(a).borderBottomStyle !== "none" && parseFloat(getComputedStyle(a).borderBottomWidth) > 0, ans: a.innerHTML.replace(/&nbsp;/g, "").trim() ? Math.round(a.getBoundingClientRect().width) : 0, ansLeft: (a.getBoundingClientRect().left - sr.left) / z, qRight: (r.right - sr.left) / z }; });
        const c0 = await cen(); await page.keyboard.press("7"); await sleep(120); const c1 = await cen(); await shot("03c_math_sum"); await page.keyboard.press("Backspace"); await sleep(80);
        checks.push(["the sum: question centred on the screen, typed answer appears to its right without moving it, no placeholder line (" + JSON.stringify([c0, c1]) + ")", Math.abs(c0.cx - 800) < 2 && Math.abs(c1.cx - 800) < 2 && !c0.line && c0.ans === 0 && c1.ans > 10 && c1.ansLeft > c1.qRight]);
        await typeAnswer(true); await sleep(1500);
        const a = await st(), e1 = await page.evaluate(() => __km.enemy());
        checks.push(["wrong answer: action fails, hunters +1, enemy turn costs exactly its attack", a.hunters === b.hunters + 1 && e1.hp === e0.hp && a.hp === b.hp - e0.atk && a.phase === "choose"]);
        await shot("03d_after_enemy_turn");
      }
      let lastHp = null;
      while ((await st()).mode === "encounter") {
        const ph = (await st()).phase;
        if (ph === "choose") { lastHp = (await st()).hp; await page.keyboard.press("2"); await sleep(150); await typeAnswer(); await sleep(200); }
        else await sleep(120);
      }
      const after = await st();
      checks.push([`${key}: a dead enemy does not retaliate (hearts refill after a won fight, v11b)`, after.hp >= lastHp]);
      fights++;
    } else if (s.type === "riddle") {
      riddleNo++;
      if (!seen.riddle) { await sleep(600); await shot("04_riddle"); }
      { // v11b (Magnus): the riddle in his frame in the strip, answers as plaques under it, no riddle bubble, no labelled grey box
        const rv = await page.evaluate(() => { const f = document.querySelector("#panel .riddleframe"), q = __km.S.enc.riddle.q, cv = document.getElementById("game").getBoundingClientRect(), k = 1600 / cv.width; // stage px
          const fr = f && f.getBoundingClientRect(), bi = f && getComputedStyle(f, "::before").borderImageSource;
          return { frame: !!f, img: /riddle-frame/.test(bi || ""), text: f && f.textContent.trim() === q, cx: fr ? ((fr.left + fr.width / 2) - cv.left) * k : 0, bottom: fr ? (fr.bottom - cv.top) * k : 0,
            plaques: document.querySelectorAll("#panel .ansgrid button.ansf").length, nChoices: __km.S.enc.riddle.choices.length,
            sac: [...document.querySelectorAll("#panel .ansgrid button.ansf")].some(b => b.dataset.act === "sacrifice"), knights: __km.S.party.length > 1,
            bubbleQ: __km.bubbles().some(b => b.lines.join(" ").includes(q.slice(0, 20))), small: [...document.querySelectorAll("#panel .ansgrid button *")].filter(e => parseFloat(getComputedStyle(e).fontSize) < 28).length,
            // v18: answer-frame art, 2 columns, A B C keys (+ S), the frame at the pack's 51 px height, no preview-only text
            cols: new Set([...document.querySelectorAll("#panel .ansgrid button.ansf")].map(b => Math.round(b.getBoundingClientRect().left))).size,
            keys: [...document.querySelectorAll("#panel .ansgrid .ak")].map(x => x.textContent).join(""), noKbd: !document.querySelector("#panel kbd"),
            // v12r: Maggi's ornamented frame (same as every strip button), one row, the 64 px size, clear of the divider
            afImg: [...document.querySelectorAll("#panel .ansgrid button.ansf")].every(b => /button_frame(_hover|_disabled)?@2x/.test(getComputedStyle(b).borderImageSource) && getComputedStyle(b, "::before").content === "none"),
            afH: Math.max(...[...document.querySelectorAll("#panel .ansgrid button.ansf")].map(b => b.getBoundingClientRect().height)) * k,
            rows: new Set([...document.querySelectorAll("#panel .ansgrid button.ansf")].map(b => Math.round(b.getBoundingClientRect().top / 20))).size,
            gapDiv: (fr.top - document.getElementById("divider").getBoundingClientRect().bottom) * k,
            preview: /Try again|The keeper asks/.test(document.getElementById("panel").textContent),
            low: Math.max(...[...document.querySelectorAll("#panel .ansgrid button")].map(b => (b.getBoundingClientRect().bottom - cv.top) * k)) }; });
        checks.push(["riddle: question inside Magnus's frame, centred in the strip, answers as plaques (+ Sacrifice), no question bubble (" + JSON.stringify(rv) + ")",
          rv.frame && rv.img && rv.text && Math.abs(rv.cx - 800) < 4 && rv.bottom < 900 && rv.plaques === rv.nChoices + (rv.knights ? 1 : 0) && rv.sac === rv.knights && !rv.bubbleQ && rv.small === 0]);
        checks.push(["v12r riddle answers: Maggi's button frame (normal/hover/disabled, no v18 answer-frame), one row, 64 px, no key letters (v12e), clear of the divider, inside the strip, no 'Try again' / 'The keeper asks'",
          rv.cols === rv.plaques && rv.rows === 1 && rv.keys === "" && rv.noKbd && rv.afImg && Math.abs(rv.afH - 64) < 3 && rv.gapDiv >= 6 && !rv.preview && rv.low <= 900]);
        { const kr = await page.evaluate(() => { const k = KM_ART.entities.bridgekeeper || {}, r = KM_ART.entities[k.front] || {};
            return { keeper: /riddle-keeper/.test(k.img || ""), rock: /rock\.png/.test(r.img || ""), sep: k.front === "keeper_rock" && k.img !== r.img, mul: [k.artMul, r.artMul], act: __km.S.enc.act.id }; });
          if (kr.act === "bridgekeeper") checks.push(["v18 riddle keeper + rock: separate layers (keeper, then the rock in front), one shared reported factor (" + JSON.stringify(kr) + ")", kr.keeper && kr.rock && kr.sep && kr.mul[0] === kr.mul[1] && kr.act === "bridgekeeper"]); }
        if (riddleNo === 2 && rv.knights) await shot("04b_riddle_with_sacrifice");
      }
      const ans = await page.evaluate(() => __km.S.enc.riddle.answer);
      const wrongI = [0, 1, 2].filter(i => i !== ans);
      if (riddleNo === 1) {
        await page.keyboard.press("abc"[wrongI[0]]); await sleep(300);
        const mid = await st(); checks.push(["riddle wrong: hunters +1 (no heart), one more go", mid.hunters === s.hunters + 1 && mid.hp === s.hp && mid.phase === "riddle"]);
        await page.keyboard.press("abc"[wrongI[0]]); await sleep(100);
        checks.push(["struck choice ignored", (await st()).phase === "riddle"]);
        await page.keyboard.press("abc"[ans]); await sleep(200);
        const after = await st(); checks.push(["2nd-go right: pass, no gold", after.mode === "walk" && after.gold === s.gold]);
      } else if (riddleNo === 2 && (await st()).party > 1) {
        await page.keyboard.press("s"); await sleep(150);
        const nK = (await st()).party - 1;
        await page.keyboard.press(String(nK + 1)); await sleep(150);
        const cap = await page.evaluate(() => ({ mode: __km.S.mode, sub: __km.S.enc && __km.S.enc.sub, tries: __km.S.enc && __km.S.enc.tries }));
        checks.push(["sacrifice menu captures digit keys", cap.mode === "encounter" && cap.sub === "sacrifice" && !cap.tries]);
        await page.keyboard.press("Escape"); await sleep(150); await page.keyboard.press(String(ans + 1)); await sleep(200);
      } else {
        await page.keyboard.press(String(wrongI[0] + 1)); await sleep(200);
        await page.keyboard.press(String(wrongI[1] + 1)); await sleep(200);
        const after = await st(); checks.push(["two wrong: hunters +2, pass with nothing", after.hunters === s.hunters + 2 && after.mode !== "encounter" && after.gold === s.gold]);
      }
    } else if (s.type === "recruit") {
      // fail the recruit sum -> hunters +1 -> D20 contest (forced 17 vs 4) -> joins
      const p0 = s.party;
      await page.keyboard.press("Enter"); await sleep(150); await typeAnswer(true); await sleep(250);
      const off = await st();
      await page.evaluate(() => (__km.forceContest = [17, 4]));
      await page.keyboard.press("d"); await sleep(900); await shot("05c_recruit_d20_contest");
      await waitFor(s => s.mode === "walk", 8000);
      const a = await st(); contestDone = off.phase === "contestOffer" && off.hunters === s.hunters + 1 && a.party === p0 + 1;
      checks.push(["recruit: failed sum = hunters +1 + D20 contest offer; winning the contest recruits", contestDone]);
      await page.evaluate(() => (__km.forceContest = null));
    } else if (s.type === "special") {
      await shot("08_frank_special");
      await page.keyboard.press("2"); await sleep(150); await typeAnswer(); await sleep(200);
      const said = (await page.evaluate(() => __km.speechLog())).join("\n");
      await waitFor(s => s.mode === "walk", 5000);
      checks.push(["Frank: disagree -> restraint maths -> bubble 'No, Frank. No turd dragons today.'", /No, Frank\. No turd dragons today\./.test(said)]);
    } else if (s.type === "rest") {
      const kind = info.rest;
      await sleep(400);
      const m = await mus(); if (m.cat !== wantMusic("rest", null, kind)) { musicBad++; console.log("music mismatch rest", kind, m.cat); }
      if (kind === "tavern") {
        if (!seen.rest_tavern) await shot("07_tavern_exterior");
        await page.keyboard.press("i"); await sleep(1500);
        for (let k = 0; k < 8 && !((await page.evaluate(() => __km.tavern())) || {}).spots?.length; k++) { if (k === 4) await page.keyboard.press("i"); await sleep(400); }
        const tvIn = await page.evaluate(() => ({ t: __km.tavern(), view: KM.RestView && __km.view ? __km.view() : null }));
        if (!tvIn.t || !tvIn.t.spots.length) console.log("tavern: not inside after i", JSON.stringify(tvIn));
        if (!seen.rest_tavern) await shot("07b_tavern_interior");
        { await sleep(600); const mi = await mus(); // v12r (Magnus): the sung bard songs play only inside the tavern
          if (mi.cat !== "tavern" || !mi.vocal || mi.place !== "tavern-interior") { musicBad++; console.log("music mismatch tavern interior", JSON.stringify(mi)); } musicSeen.push("tavern-interior→" + mi.cat); }
        { // v11b tavern (Magnus: clean but no click-fest): the highlighted thing's options are on the strip at once, one key each
          const plq = () => page.evaluate(() => [...document.querySelectorAll("#panel button.plaque")].map(b => b.textContent.replace(/\s+/g, " ").trim()));
          const tv0 = await page.evaluate(() => ({ tv: __km.tavern(), panel: __km.panelText(), kbd: document.querySelectorAll("#panel kbd:not(.seal)").length, gear: document.querySelectorAll("#panel .gear").length }));
          const p0l = await plq();
          checks.push(["tavern on entering (v12q): Mead is lit on the wall sign; Mead / Stew / Fire bottle are lines ON the sign, nothing on the strip, no key boxes (" + JSON.stringify([tv0.tv.spots.slice(0, 3).map(q => q.id), p0l, tv0.tv.sel, tv0.kbd, tv0.gear, tv0.tv.spots[tv0.tv.spots.length - 1].kind, tv0.panel]) + ")", !!tv0.tv && tv0.kbd === 0 && tv0.gear === 0 && tv0.tv.sel === 0 && tv0.tv.spots[0].kind === "fare" && tv0.tv.spots[0].item === "mead" && tv0.tv.spots[1].item === "stew" && tv0.tv.spots[tv0.tv.spots.length - 1].kind === "door" && p0l.length === 0 && !/Ale|Scroll|Recruit/.test(tv0.panel)]);
          { const sg = await page.evaluate(() => ({ sign: __km.sign(), fare: __km.tavern().spots.filter(q => q.kind === "fare").map(q => q.r), img: !!(KM_DATA.tavernRoom && KM_DATA.tavernRoom.sign) }));
            checks.push(["tavern: the fare lines sit on Maggi's hanging sign on the wall (v12q) (" + JSON.stringify(sg.sign && sg.sign.r) + ")", sg.img && sg.sign && sg.fare.length === 3 && sg.fare.every(r => r.x >= sg.sign.r.x && r.x + r.w <= sg.sign.r.x + sg.sign.r.w && r.y >= sg.sign.r.y && r.y + r.h <= sg.sign.r.y + sg.sign.r.h) && sg.sign.r.y + sg.sign.r.h < KM_DATA_GY]); }
          if (!seen.rest_tavern) { await shot("07b_tavern_interior"); await shot("07g_tavern_menu_selected"); }
          { // mead / stew bought repeatedly with one key each, no reopening
            await page.evaluate(() => { __km.S.gold += 20; __km.S.hp = Math.max(1, __km.maxHp() - 2); __km.S.mead = 0; });
            await page.keyboard.press("ArrowRight"); await sleep(100); await page.keyboard.press("ArrowLeft"); await sleep(150); // re-render
            const h0 = await page.evaluate(() => __km.S.hp), hx = Math.min(await page.evaluate(() => __km.maxHp()), h0 + 2);
            await page.keyboard.press("2"); await sleep(150); await page.keyboard.press("2"); await sleep(150); await page.keyboard.press("1"); await sleep(150);
            const r = await page.evaluate(() => ({ hp: __km.S.hp, mead: __km.S.mead, sel: __km.tavern().sel }));
            checks.push(["tavern: Stew twice (2 keys, +1 heart each) and Mead (1 key) without reopening anything (" + JSON.stringify([h0, r]) + ")", r.hp === hx && r.mead === 1 && r.sel === 0]);
            await page.evaluate(() => { __km.S.mead = 0; }); }
          const goTo = async kind => { for (let i = 0; i < 6; i++) { const t = await page.evaluate(() => __km.tavern()); if (!t || !t.spots[t.sel]) return false; if (t.spots[t.sel].kind === kind) return true; await page.keyboard.press("ArrowRight"); await sleep(120); } return false; };
          if (await goTo("npc")) { await sleep(300); if (!seen.rest_tavern) { await shot("07e_tavern_npc_highlight"); await shot("07e_tavern_npc_selected"); }
            const o = await page.evaluate(() => ({ panel: __km.panelText() }));
            checks.push(["tavern: highlighting a recruit shows 'Join my party?' at once, one plaque (" + o.panel.replace(/\s+/g, " ") + ")", /Join my party\?/.test(o.panel) && !/Recruit|Talk|Stew|Walk on|power|trait/.test(o.panel)]);
            if (!(await page.evaluate(() => __km.partyFull()))) { const p0 = (await st()).party; await page.keyboard.press("1");
              for (let w = 0; w < 40 && (await page.evaluate(() => __km.phase())) !== "math"; w++) await sleep(100);
              const said = (await page.evaluate(() => __km.speechLog().slice(-4).filter(l => l !== KM_DATA.restStops.types.tavern.limits.lot))).slice(-2); // a late "That's your lot." bark may interleave
              checks.push(["recruit talk: hero asks 'Join my party?', the NPC answers with a challenge, then the sum (" + JSON.stringify(said) + ")", said[0] === "Join my party?" && Object.values(KM_RT_CH).flat().includes(said[1]) && (await page.evaluate(() => __km.phase())) === "math"]);
              await typeAnswer(); await sleep(400); if ((await st()).party > p0) recruitedAtRest++;
              for (let w = 0; w < 30 && (await page.evaluate(() => __km.phase())) !== "rest"; w++) await sleep(100); } }
          const toScr = r => page.evaluate(r => { const cv = document.getElementById("game"), b = cv.getBoundingClientRect(), z = b.width / KM_LAYOUT.viewW; return { x: b.left + (r.x + r.w / 2) * z, y: b.top + (r.y + r.h / 2) * z }; }, r);
          { // mouse (Magnus): hover = pointer + ink highlight + that thing's plaques; click = use. Door inside -> outside; doorway outside -> in
            const d = await page.evaluate(() => __km.tavern().spots.find(q => q.kind === "door").r), c = await toScr(d);
            await page.mouse.move(c.x, c.y); await sleep(250);
            const hv = await page.evaluate(() => ({ cur: document.getElementById("game").style.cursor, open: __km.tavern().open, panel: __km.panelText() }));
            checks.push(["mouse: hovering the tavern door = pointer cursor, highlight, Go outside / Walk on (" + JSON.stringify(hv).replace(/\\n/g, " ") + ")", hv.cur === "pointer" && hv.open === "door" && /Go outside/.test(hv.panel) && /Walk on/.test(hv.panel)]);
            await shot("07h_tavern_door_hover");
            await page.mouse.click(c.x, c.y); await sleep(500);
            const v1 = await page.evaluate(() => ({ view: __km.view(), ph: __km.phase() }));
            checks.push(["mouse: clicking the tavern door inside goes outside (" + JSON.stringify(v1) + ")", v1.view === "tavern-arrival" && v1.ph === "tavernOut"]);
            await sleep(400); const ad = await page.evaluate(() => __km.arrivalDoor()), c2 = await toScr(ad);
            await page.mouse.move(c2.x - 400, c2.y); await sleep(100); await page.mouse.move(c2.x, c2.y); await sleep(250);
            const hv2 = await page.evaluate(() => ({ cur: document.getElementById("game").style.cursor, hover: __km.hoverSpot() }));
            await shot("07i_tavern_arrival_door_hover");
            checks.push(["mouse: hovering the doorway on the tavern exterior = pointer cursor + ink highlight (" + JSON.stringify(hv2) + ")", hv2.cur === "pointer" && hv2.hover === "arrivalDoor"]);
            await page.mouse.click(c2.x, c2.y); await sleep(900);
            checks.push(["mouse: clicking the doorway goes into the tavern (the I key still works too)", (await page.evaluate(() => __km.view())) === "tavern-interior"]);
            await page.mouse.move(5, 5); }
        }
        { const fv = await page.evaluate(() => { const m = KM.RestView.mapper("tavern-interior"), F = KM_ART11.scenes["tavern-interior"]; return { full: !!m.full, x0: m.x0, w: F.size[0] * m.s, floor: m.y0 + F.floorRow * m.s, gy: KM_DATA.world.groundY, VW: KM_LAYOUT.viewW, sx: m.s / F.size[0] * F.size[0], sy: m.s }; });
          checks.push(["tavern interior: Magnus's full-screen room, edge to edge, floor line on the ground line, one uniform scale (" + JSON.stringify(fv) + ")", fv.full && fv.x0 <= 0 && fv.x0 + fv.w >= fv.VW && Math.abs(fv.floor - fv.gy) < 1]); }
        checks.push(["tavern: facade -> layered interior (" + (await page.evaluate(() => __km.view())) + ")", (await page.evaluate(() => __km.view())) === "tavern-interior"]);
      } else { await sleep(500); if (!seen["rest_" + kind]) await shot(kind === "campsite" ? "07c_camp_interior" : kind === "stall" ? "07f_scroll_stall" : "07d_shop"); }
      if (kind === "stall") { const g0 = await st(), c0 = await page.evaluate(() => __km.spell().charges); const art = await page.evaluate(() => ({ price: KM_DATA.spell.price, max: KM_DATA.spell.max, seller: __km.S.actors.some(a => a.stall && a.stop === __km.S.stop), icon: !!document.querySelector('#panel [data-act="buySpell"] img.spellicon') }));
        if (g0.gold >= art.price) { await page.keyboard.press("z"); await sleep(300); }
        const c1 = await page.evaluate(() => __km.spell().charges);
        checks.push(["scroll stall: Magnus's stall + seller on the road, Z buys a scroll (shown with his spell icon) (" + JSON.stringify({ art, c0, c1, gold: g0.gold }) + ")", art.seller && art.icon && (g0.gold < art.price || c0 >= art.max || c1 === c0 + 1)]); }
      if (kind === "campsite") checks.push(["campsite: layered camp scene shown", (await page.evaluate(() => __km.view())) === "camp"]);
      restKinds.add(kind);
      await sampleBubbles();
      const p0 = (await st()).party;
      if (kind !== "tavern") for (const k of ["h", "j"]) { await page.keyboard.press(k); await sleep(80); }
      if (kind !== "tavern" && !(await page.evaluate(() => __km.partyFull())) && (await page.evaluate(() => __km.S.enc.st.cands.some(Boolean)))) {
        const j = await page.evaluate(() => __km.S.enc.st.cands.findIndex(Boolean));
        await page.keyboard.press(String(j + 1)); await sleep(150); await typeAnswer(); await sleep(200);
      }
      const p1 = (await st()).party; if (p1 > p0) recruitedAtRest++;
      partyMax = Math.max(partyMax, p1);
      for (const k of ["q", "w", "e", "r", "a", "q", "w", "e", "r"]) { await page.keyboard.press(k); await sleep(50); }
      if (kind === "tavern") { await page.keyboard.press("Escape"); await sleep(700); checks.push(["tavern: Esc goes back outside", (await st()).phase === "tavernOut"]); }
      await page.keyboard.press("Enter");
    }
    seen[key] = true; seen[s.type] = true;
    await sleep(200);
    if ((await st()).mode === "walk") { const m = await mus(); if (m.cat !== "world") { await sleep(1500); const m2 = await mus(); if (m2.cat !== "world") { musicBad++; console.log("music after encounter not world:", m2.cat); } } }
    await page.evaluate(() => __km.setSpeed(4));
  }
  const fin = await st();
  checks.push(["music per scene; battle music only after the commit (" + [...new Set(musicSeen)].join(", ") + ")", musicBad === 0 && musicSeen.some(x => x.endsWith("wizard")) && musicSeen.some(x => x.endsWith("heavy_boss"))]);
  await sleep(1600);
  await shot("09_victory");
  await sampleBubbles();
  const vict = await page.evaluate(() => ({ text: document.querySelector(".journeyline").textContent, best: KM.Save.best(), lg: +__km.leagues(), said: __km.speaking() }));
  checks.push(["victory: one big distance line + best saved (" + vict.text.trim() + "), narrator speaks in a bubble", /\d+\.\d leagues/.test(vict.text) && vict.best && vict.best.leagues === vict.lg && vict.said.length > 0]);
  checks.push(["rest stops: tavern, campsite and shop visited", ["tavern", "campsite", "shop"].every(k => restKinds.has(k))]);
  checks.push(["recruited by maths at rest stops; party never above 4 incl. the hero (max " + partyMax + ")", recruitedAtRest > 0 && partyMax <= 4]);
  checks.push(["hunters advanced but never caught us (" + fin.hunters + "/12)", fin.hunters > 0 && fin.hunters < 12]);
  checks.push(["keyboard only: no on-screen pad", padSeen === 0]);
  // v9 (Magnus): paper-white scenery takes the parchment; one continuous parchment sheet into the HTML strip; ink-only glyphs
  const tint = await page.evaluate(() => {
    const pb = KM.Scenery.parchmentCanvas(), c = document.createElement("canvas"); c.width = pb.width; c.height = pb.height; const g = c.getContext("2d");
    g.setTransform(KM_LAYOUT.k, 0, 0, KM_LAYOUT.k, 0, 0); const sc = KM_DATA.scenery;
    KM.Scenery.draw(g, 1234, 0, {});
    const a = g.getImageData(0, 0, c.width, c.height).data, b = pb.getContext("2d").getImageData(0, 0, c.width, c.height).data; let lighter = 0;
    for (let i = 0; i < a.length; i += 4) if ((a[i] + a[i + 1] + a[i + 2]) - (b[i] + b[i + 1] + b[i + 2]) > 6) lighter++;
    return { tinted: KM.Scenery.tintInfo().length, lighter, sheet: document.getElementById("strip").dataset.sheet };
  });
  checks.push(["v9 tint: no scenery pixel lighter than the parchment (" + tint.lighter + "), " + tint.tinted + " strips tinted, strip continues the parchment sheet (" + tint.sheet + ")",
    tint.lighter === 0 && tint.tinted >= 3 && tint.sheet === "1"]);
  // v8 (Magnus): every art piece = source px x ONE global factor; no per-entity / per-layer factors
  const sizes = await page.evaluate(() => {
    const G = KM_LAYOUT.artScale, k = KM_LAYOUT.k, out = [];
    for (const [id, c] of Object.entries(KM_ART7.cutouts)) {
      const ent = Object.entries(KM_ART.entities).find(([, e]) => e.img && e.img.endsWith(c.img)); if (!ent) continue;
      out.push([ent[0], KM.Assets.entitySize(ent[0])[1] * k / (c.anchor[1] - (c.top || 0))]);
    }
    const sc = KM_DATA.scenery; const leftovers = JSON.stringify(sc).match(/"scale"/g);
    return { G, factors: out, leftovers: leftovers ? leftovers.length : 0, strip: KM.Scenery.treeWidth(0) * k / KM_ART7.trees[0].size[0] };
  });
  checks.push(["one global art factor " + sizes.G + " for every cutout + trees, no scale keys left in scenery (" + sizes.factors.map(f => f[0] + ":" + f[1].toFixed(3)).join(" ") + ")",
    sizes.factors.length >= 6 && sizes.factors.every(f => Math.abs(f[1] - sizes.G) < 1e-6) && Math.abs(sizes.strip - sizes.G) < 1e-6 && sizes.leftovers === 0]);
  // v10 (Magnus, pack_v13): v13 walk atlases at atlas px x the ONE global factor, README travel speed, frontGround strips
  const v10 = await page.evaluate(async () => {
    const G = KM_LAYOUT.artScale, k = KM_LAYOUT.k, W = KM_ART10.walks, out = {};
    out.sizes = ["hero", "follower_1", "follower_2", "follower_3", "follower_4"].map(id => { const e = KM_ART.entities[id], w = W[e.walk];
      return [id, e.walk, KM.Assets.entitySize(id)[1] * k / (w.pivot[1] - w.standTop)]; });
    out.speed = [KM_DATA.world.walkSpeed * k, W.hero.rootMotionSpeed * G * (KM_DATA.world.walkSpeedMultiplier || 1)];               // stage px/s: road == hero root motion x scale x configured playback rate
    out.rates = ["follower_1", "follower_2", "follower_3", "follower_4"].map(id => KM_ART.walkRate(id) * W[KM_ART.entities[id].walk].rootMotionSpeed * G);
    out.frames = new Set([0, .13, .26, .38, .51, .63, .76, .88].map(t => KM.Assets.seqFrame("walk_hero", t).i)).size;
    out.ms = KM_ART7.sequences.walk_hero.frames.map(f => f.ms).join();
    // seeded tile choice == choose-strip.js, stable; matching joins: identical boundary columns across all 12 strips (image data)
    out.stable = [0, 1, 2, 3, 4, 5].map(i => KM.Scenery.fgChoose("meadow", i, 42)).join() === [0, 1, 2, 3, 4, 5].map(i => KM.Scenery.fgChoose("meadow", i, 42)).join();
    const F = KM_ART10.foreground, srcs = Object.values(F.strips).flat();
    const ims = await Promise.all(srcs.map(s => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = F.root + s; })));
    const col = (im, x) => { const c = document.createElement("canvas"); c.width = 1; c.height = im.naturalHeight; const g = c.getContext("2d"); g.drawImage(im, x, 0, 1, im.naturalHeight, 0, 0, 1, im.naturalHeight); return Array.from(g.getImageData(0, 0, 1, im.naturalHeight).data).join(); };
    const L0 = col(ims[0], 0); out.joins = ims.every(im => col(im, 0) === L0 && col(im, im.naturalWidth - 1) === L0); out.n = ims.length;
    // precomputed (offline) ink == the in-browser v9 computation (max channel / alpha difference)
    const cmp = async (src) => { const im = new Image(); im.src = src + "?fresh"; await im.decode(); const rt = KM.Scenery.runtimeInk(im), pre = new Image(); pre.src = KM_ART10.ink[src].img; await pre.decode();
      const c = document.createElement("canvas"); c.width = rt.width; c.height = rt.height; const g = c.getContext("2d"); g.drawImage(pre, 0, 0); const a = g.getImageData(0, 0, c.width, c.height).data, b = rt.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      // compare what reaches the screen: ink composited over a parchment tone (low-alpha colours are not stored exactly by a canvas)
      let mx = 0; const P = [221, 196, 164]; for (let i = 0; i < a.length; i += 4) for (let q = 0; q < 3; q++) {
        const ca = (a[i + q] * a[i + 3] + P[q] * (255 - a[i + 3])) / 255, cb = (b[i + q] * b[i + 3] + P[q] * (255 - b[i + 3])) / 255; mx = Math.max(mx, Math.abs(ca - cb)); } return Math.round(mx * 10) / 10; };
    out.inkDiff = [await cmp("assets/v7/parallax/02-hills.png"), await cmp("assets/v10/foreground/strips/meadow-1.png")];
    // the frontGround layer is drawn (over the feet) and its paper is the parchment (no lighter pixel than the parchment)
    const pb = KM.Scenery.parchmentCanvas(), c = document.createElement("canvas"); c.width = pb.width; c.height = pb.height; const g = c.getContext("2d");
    g.drawImage(pb, 0, 0); const before = g.getImageData(0, 0, c.width, c.height).data.slice(); g.setTransform(k, 0, 0, k, 0, 0);
    KM.Scenery.foreground(g, 4321, 7, __km.L.world ? 820 : 820); const a = g.getImageData(0, 0, c.width, c.height).data; let changed = 0, lighter = 0;
    for (let i = 0; i < a.length; i += 4) { const d = (a[i] + a[i + 1] + a[i + 2]) - (before[i] + before[i + 1] + before[i + 2]); if (d) changed++; if (d > 6) lighter++; }
    out.fg = { changed, lighter }; return out;
  });
  const KM_G = await page.evaluate(() => KM_LAYOUT.artScale);
  checks.push(["v10 walks: hero + 4 companions on the v13 atlases at atlas px x " + v10.sizes[0][2].toFixed(3) + " (" + v10.sizes.map(x => x[0] + "=" + x[1]).join(" ") + "), 8 keys x 125 ms (" + v10.frames + ")",
    v10.sizes.every(x => Math.abs(x[2] - KM_G) < 1e-9) && v10.frames === 8 && v10.ms === "125,125,125,125,125,125,125,125"]);
  checks.push(["v10 travel speed = rootMotionSpeed x 0.6 x playback rate (road " + v10.speed[0].toFixed(1) + " px/s; companions " + v10.rates.map(r => r.toFixed(1)).join("/") + ")",
    Math.abs(v10.speed[0] - v10.speed[1]) < 1e-6 && v10.rates.every(r => Math.abs(r - v10.speed[0]) < 1e-6)]);
  checks.push(["v10 frontGround: " + v10.n + " strips with matching joins, seeded stable choice, drawn (" + v10.fg.changed + " px) and no pixel lighter than the parchment (" + v10.fg.lighter + ")",
    v10.n === 12 && v10.joins && v10.stable && v10.fg.changed > 10000 && v10.fg.lighter === 0]);
  checks.push(["v10 offline ink == in-browser ink (max diff " + v10.inkDiff.join("/") + " levels)", v10.inkDiff.every(d => d <= 4)]);
  { // v11b: every line said this run was shown as whole sentences (no truncation, no bubble starting mid-sentence)
    const sp = await page.evaluate(() => { const bad = []; for (const t of __km.speechLog()) { const c = __km.chunks(t).map(x => x.join(" ")); if (c.join(" ") !== String(t).replace(/\s+/g, " ").trim() || c.some(x => /^[a-z,;:—–-]/.test(x))) bad.push(t); } return { n: __km.speechLog().length, bad, over: __km.speechOverflow() }; });
    checks.push(["all " + sp.n + " lines said this run fit whole sentences per bubble " + JSON.stringify(sp.over.concat(sp.bad).slice(0, 4)), sp.n > 20 && sp.bad.length === 0 && sp.over.length === 0]);
  }
  checks.push(["speech bubbles: >= 28 px, <= " + 2 + " lines (max seen " + maxLines + "), inside the scene, no overlaps (" + bubbleSamples + " sampled)", bubbleViolations === 0 && bubbleSamples > 10]);
  checks.push(["speech bubbles never cover a character's head (" + headHits + " hits)", headHits === 0]);
  const overs = smallText.filter(t => t.startsWith("OVER:")), smalls = smallText.filter(t => !t.startsWith("OVER:"));
  checks.push(["no small text in the strip (< 28 px): " + ([...new Set(smalls)].slice(0, 6).join(" | ") || "none"), smalls.length === 0]);
  checks.push(["all UI in the bottom strip, none over the scene " + [...new Set(overs)].slice(0, 6).join(" | "), uiViolations === 0]);

  // answer-feedback SFX (Charlie's blacksmith set): 'correct' / 'wrong' resolve to sfx_correct_0N / sfx_wrong_0N, random, no immediate repeat
  const sfx = await page.evaluate(async () => {
    const want = { correct: [1, 2, 3].map(i => `sfx/sfx_correct_0${i}.ogg`), wrong: [1, 2, 3].map(i => `sfx/sfx_wrong_0${i}.ogg`) };
    const usedInPlay = KM.Audio.fileLog.slice();
    const out = {};
    for (const ev of ["correct", "wrong"]) {
      const files = (KM.Audio.map()[ev] || {}).files || [];
      KM.Audio.fileLog.length = 0; for (let i = 0; i < 40; i++) KM.Audio.play(ev); // (the log is capped, so count from empty)
      const picks = KM.Audio.fileLog.slice();
      const served = await Promise.all(files.map(f => fetch("assets/audio/" + f, { method: "HEAD" }).then(r => r.ok)));
      out[ev] = { mapOk: JSON.stringify(files) === JSON.stringify(want[ev]), allServed: served.every(Boolean), onlyThese: picks.every(f => want[ev].includes(f)),
        allUsed: want[ev].every(f => picks.includes(f)), noRepeat: picks.every((f, i) => i === 0 || f !== picks[i - 1]) };
    }
    out.playedDuringRun = usedInPlay.some(f => /sfx_correct_/.test(f)) && usedInPlay.some(f => /sfx_wrong_/.test(f));
    return out;
  });
  console.log("sfx:", JSON.stringify(sfx));
  checks.push(["SFX: 'correct' -> sfx_correct_01..03, 'wrong' -> sfx_wrong_01..03 (served, random, no immediate repeat, used in play)",
    ["correct", "wrong"].every(ev => Object.values(sfx[ev]).every(Boolean)) && sfx.playedDuringRun]);

  // music settings persist in the profile (v4)
  await page.keyboard.press("m"); await sleep(200);
  await page.keyboard.press("m"); await page.keyboard.press("["); await page.keyboard.press("["); await sleep(100);
  const volNow = (await mus()).volume; await page.keyboard.press("m"); await sleep(100);
  await page.reload(); await sleep(800);
  const restored = await page.evaluate(() => ({ s: KM.Music.settings(), prof: JSON.parse(localStorage.getItem("knightMath.profile")) }));
  checks.push(["M / [ ] music settings saved in profile v4", restored.s.muted && Math.abs(restored.s.volume - volNow) < 0.001 && restored.prof.version === 4]);
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem("knightMath.profile")); p.music.muted = false; localStorage.setItem("knightMath.profile", JSON.stringify(p)); });

  // save migrations: v1 -> v4
  await page.evaluate(() => localStorage.setItem("knightMath.save", JSON.stringify({ version: 1, name: "Oldie", hearts: 4, gold: 12, stop: 3, party: ["hero", "sir_rustalot"] })));
  await page.reload(); await sleep(800); await page.keyboard.press("Enter"); await sleep(400);
  const mig = await page.evaluate(() => ({ name: __km.S.name, hp: __km.S.hp, party: __km.S.party.map(m => m.name || m.id), skins: __km.S.party.map(m => m.skin), mode: __km.S.mode, hunters: __km.S.hunters, spells: __km.S.spells, mead: __km.S.mead, ver: JSON.parse(localStorage.getItem("knightMath.save")).version }));
  checks.push(["v1 save migrates to v7 (" + JSON.stringify(mig) + ")", mig.name === "Oldie" && mig.hp === 4 && mig.party[1] === "Sir Rustalot" && mig.skins[1] === 1 && mig.ver === 7 && mig.mead === 0 && mig.hunters === 0 && mig.mode === "walk" && mig.spells === 1]);
  // v3 (game v6) save with 5 followers at old stop 9 (3 battles behind) -> v4: 3 followers kept, resumes at the rest stop after the 3rd battle
  await page.evaluate(() => {
    const f = n => ({ id: "f" + n, kind: "follower", name: "Knight " + n, base: 1, look: n, weapon: 0, armor: 0 });
    localStorage.setItem("knightMath.save", JSON.stringify({ version: 3, name: "Threey", hp: 5, gold: 30, stop: 9, dist: 30000, fid: 5, party: [{ id: "hero", kind: "hero", base: 2, weapon: 1, armor: 0 }, f(1), f(2), f(3), f(4), f(5)],
      stats: {}, usedRiddles: [], checkpoint: { name: "Threey", hp: 6, gold: 10, stop: 9, party: [{ id: "hero", kind: "hero", base: 2, weapon: 0, armor: 0 }], stats: {}, usedRiddles: [] } }));
  });
  await page.reload(); await sleep(800); await page.keyboard.press("Enter"); await sleep(400);
  const mig3 = await page.evaluate(() => { const sv = JSON.parse(localStorage.getItem("knightMath.save")); return { ver: sv.version, stop: __km.S.stop, prev: __km.S.stops[__km.S.stop - 1].type, cur: __km.S.stops[__km.S.stop].type, n: __km.S.party.length, skins: __km.S.party.slice(1).map(m => m.skin), left: sv.leftParty }; });
  console.log("migration v3:", JSON.stringify(mig3));
  checks.push(["v3 save -> v7: party trimmed to 4, skins assigned, stop remapped", mig3.ver === 7 && mig3.n === 4 && mig3.skins.join() === "1,2,3" && mig3.prev === "boss" && mig3.cur === "rest" && mig3.left.join() === "Knight 4,Knight 5"]);

  await browser.close();
  console.log("final:", JSON.stringify(fin));
  checks.forEach(([n, v]) => console.log((v ? "  ok   " : "  FAIL ") + n));
  const ok = checks.every(c => c[1]) && fin.mode === "win" && errors.length === 0;
  if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  console.log(ok ? "PASS" : "FAIL");
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
