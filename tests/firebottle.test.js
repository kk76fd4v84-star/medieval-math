// v12k fire bottle (Magnus): buy at the tavern (carry 2), use it in a 3-foe fight. The word must be spelled in 7 s:
// right letters turn done (+ a sound), a wrong one shows red (+ a bad sound) and blocks until Backspace. Success = every
// living foe takes one weak-swing hit with the hit flash; too slow = it fizzles (no damage) and the foes strike.
// URL=http://localhost:8799/index.html?debug node tests/firebottle.test.js
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html?debug", sleep = ms => new Promise(r => setTimeout(r, ms));
const SH = require("path").resolve(__dirname, "../screenshots/v12m");
require("fs").mkdirSync(SH, { recursive: true });
(async () => {
  const b = await playwright.chromium.launch(); const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const e404 = []; page.on("response", r => { if (r.status() === 404 && /assets\/(audio\/sfx|items)\//.test(r.url())) e404.push(r.url().replace(/^.*assets/, "assets")); });
  const errors = []; page.on("pageerror", e => errors.push(e.message + " @ " + (e.stack || "").split("\n").slice(1, 3).join(" ")));
  const ev = (f, a) => page.evaluate(f, a), checks = [], shot = n => page.screenshot({ path: SH + "/" + n + ".png" });
  // freeze the letter animations (glow, cooling, shake) while a screenshot is taken, so it shows that exact moment
  const shotNow = async n => { await ev(() => document.getAnimations().forEach(a => a.pause())); await shot(n); await ev(() => document.getAnimations().forEach(a => a.play())); };
  const until = async (f, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(f)) return true; await sleep(50); } return false; };
  await page.goto(URL); await ev(() => localStorage.clear()); await page.reload(); await sleep(800);
  await page.keyboard.press("Enter"); await sleep(300); await page.keyboard.press("Escape"); await sleep(200); await page.fill("#nameInput", "Magnus"); await page.keyboard.press("Enter");
  for (let i = 0; i < 8 && (await ev(() => __km.mode())) !== "walk"; i++) { await page.keyboard.press("Space"); await sleep(150); }
  const IT = await ev(() => KM_DATA.items.fireBottle);

  // ---- the tavern: Go in, the sign's plaques: Mead, Stew, Fire bottle
  await ev(() => { __km.debugJump("tavern"); __km.setSpeed(4); });
  await until(() => __km.phase() === "tavernOut", 30000); await ev(() => __km.setSpeed(1)); await sleep(1500);
  await page.click('#panel button[data-act="goInside"]'); await until(() => __km.phase() === "rest" && __km.view() === "tavern-interior"); await sleep(1200);
  await ev(() => { __km.S.gold = 20; });
  await page.keyboard.press("ArrowRight"); await sleep(150); await page.keyboard.press("ArrowLeft"); await sleep(400); // re-render the sign's plaques with the gold
  // v12q: the fare is lines ON Maggi's hanging sign (canvas); click the Fire bottle line with the mouse
  const fireAt = await ev(() => { const r = __km.tavern().spots.find(q => q.id === "fare:fire").r, cv = document.getElementById("game"), b = cv.getBoundingClientRect(), z = b.width / KM_LAYOUT.viewW; return { x: b.left + (r.x + r.w / 2) * z, y: b.top + (r.y + r.h / 2) * z }; });
  const fireF = () => ev(() => __km.fare().find(f => f.id === "fire"));
  const shop0 = await ev(() => ({ btn: !!__km.fare().find(f => f.id === "fire"), icon: !!(__km.fare().find(f => f.id === "fire") || {}).icon, kbd: document.querySelectorAll("#panel kbd").length, strip: document.querySelectorAll("#panel button.plaque").length, bottles: __km.bottles(), gold: __km.S.gold }));
  await page.mouse.move(fireAt.x, fireAt.y); await sleep(300);
  await shot("01_shop");
  await page.mouse.click(fireAt.x, fireAt.y); await sleep(400);
  await page.mouse.click(fireAt.x, fireAt.y); await sleep(600);
  const shop1 = await ev(() => ({ bottles: __km.bottles(), gold: __km.S.gold, off: __km.fare().find(f => f.id === "fire").off, saved: JSON.parse(localStorage.getItem("knightMath.save")).bottles }));
  await shot("01b_shop_two_bought");
  checks.push([`tavern sign sells the fire bottle (a line on the sign with Maggi's icon; nothing on the strip, no key labels) (${JSON.stringify(shop0)})`, shop0.btn && shop0.icon && shop0.kbd === 0 && shop0.strip === 0 && shop0.bottles === 0]);
  checks.push([`two bought for ${IT.price} each, then greyed out at the max of ${IT.max}; saved (${JSON.stringify(shop1)})`, shop1.bottles === 2 && shop1.gold === shop0.gold - 2 * IT.price && shop1.off && shop1.saved === 2]);

  // ---- a 3-foe fight (goblin + rabbit + goblin)
  await ev(() => { __km.debugJump("goblin"); __km.S.bottles = 2; __km.forceGroup(["killer_rabbit", "goblin"]); __km.setSpeed(3); });
  for (let i = 0; i < 200 && (await ev(() => __km.phase())) !== "choose"; i++) { if ((await ev(() => __km.phase())) === "approach") { await ev(() => __km.setSpeed(1)); await page.keyboard.press("Enter"); } await sleep(150); }
  await sleep(600);
  await ev(() => { window.__godMode = setInterval(() => { __km.S.hp = __km.maxHp(); if (__km.S.enc) __km.S.enc.lost = 0; }, 15); }); // the test must not die
  const moves = await ev(() => ({ fire: !!document.querySelector('#panel button[data-act="pickFire"] img.itemicon'), foes: __km.group().length }));
  checks.push([`"Fire bottle" is a battle move while you carry one (${JSON.stringify(moves)})`, moves.fire && moves.foes === 3]);
  const keepAlive = () => ev(() => { __km.S.hp = __km.maxHp(); if (__km.S.enc) __km.S.enc.lost = 0; });
  const hpOf = () => ev(() => __km.group().map(a => a.hp));

  // 1) too slow: fizzle
  const f0 = await hpOf(); await keepAlive();
  await page.click('#panel button[data-act="pickFire"]'); await sleep(300);
  const sp0 = await ev(() => ({ s: __km.spelling(), tm: __km.answerTimer(), b: __km.bottles() }));
  checks.push([`the word: ${sp0.s && sp0.s.word} (8-12 letters), timer ${sp0.tm && sp0.tm.secs} s, bottle used (${sp0.b} left)`, sp0.s && /^[A-Z]{8,12}$/.test(sp0.s.word) && sp0.tm.secs === IT.spellSecs && sp0.b === 1]);
  const art = await ev(() => [...document.querySelectorAll("#panel .spellword .letter img:not(.hot)")].map(i => [i.alt, i.naturalWidth > 0, i.getBoundingClientRect().width]));
  const wordW = await ev(() => { const r = [...document.querySelectorAll("#panel .spellword .letter img:not(.hot)")].map(i => i.getBoundingClientRect()); return Math.max(...r.map(x => x.right)) - Math.min(...r.map(x => x.left)); });
  checks.push([`Maggi's drawn letters (${art.length} images, all loaded; word ${Math.round(wordW)} px wide, <= 1300)`, art.length === sp0.s.word.length && art.every(a => a[1]) && wordW <= 1301]);
  let struck = false; await until(() => __km.phase() !== "spell", 9000); await sleep(250); await shot("06_fizzle");
  for (let i = 0; i < 40 && !struck; i++) { struck = await ev(() => (__km.S.enc && __km.S.enc.foes || []).some(a => a.act && a.act.name === "attack")); if (!struck) await sleep(50); }
  await keepAlive(); await until(() => __km.phase() === "choose", 8000); await sleep(300);
  const f1 = await hpOf();
  checks.push([`timeout: fizzles, no damage (${JSON.stringify([f0, f1])}), the foes strike (${struck})`, JSON.stringify(f0) === JSON.stringify(f1) && struck && (await ev(() => __km.audioLog.includes(KM_DATA.items.fireBottle.sfx.fizzle)))]);

  // 2) success: type the word. v12m look: all grey -> a right letter glows hot -> cools to black ink
  const look = IT.letters;
  const px = sel => ev(([sel]) => { const im = document.querySelector(sel); if (!im) return null; const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext("2d"); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 250) return "#" + [d[i - 3], d[i - 2], d[i - 1]].map(v => v.toString(16).padStart(2, "0")).join(""); return null; }, [sel]);
  const hotOpacity = i => ev(i => { const h = document.querySelectorAll("#panel .spellword .letter.done img.hot")[i]; return h ? +getComputedStyle(h).opacity : null; }, i);
  await page.click('#panel button[data-act="pickFire"]'); await sleep(400);
  let w = (await ev(() => __km.spelling())).word; const half = Math.floor(w.length / 2);
  await shot("01_all_grey");
  const grey = await ev(() => ({ n: document.querySelectorAll("#panel .spellword .letter").length, done: document.querySelectorAll("#panel .letter.done").length, op: [...document.querySelectorAll("#panel .spellword img")].map(i => +getComputedStyle(i).opacity) }));
  const greyPx = await px("#panel .spellword .letter.todo img");
  checks.push([`all letters start grey ${greyPx} (want ${look.grey}), full opacity (no 35% look) (${grey.n} letters)`, grey.n === w.length && grey.done === 0 && greyPx === look.grey && grey.op.every(o => o === 1)]);
  await page.keyboard.press(w[0].toLowerCase()); await sleep(60);
  await shotNow("02_letter_glowing_orange");
  const hot0 = await hotOpacity(0), hotPx = await px("#panel .spellword .letter.done img.hot"), glowF = await ev(() => getComputedStyle(document.querySelector("#panel .letter.done img.hot")).filter);
  checks.push([`a right letter flashes hot ${hotPx} (want ${look.hot}), opacity ${hot0 && hot0.toFixed(2)}, glow "${glowF.slice(0, 60)}"`, hotPx === look.hot && hot0 > 0.8 && /drop-shadow/.test(glowF)]);
  for (const c of w.slice(1, half).toLowerCase()) await page.keyboard.press(c);
  await sleep(look.coolSecs * 1000 + 250);
  await shot("03_letters_cooled_black");
  const hs = await ev(() => ({ s: __km.spelling(), done: document.querySelectorAll("#panel .letter.done").length, ok: __km.audioCounts.spell_letter_ok }));
  const cold = await hotOpacity(0), coldPx = await px("#panel .spellword .letter.done img:not(.hot)");
  checks.push([`after ${look.coolSecs} s it has cooled to black ${coldPx} (want ${look.cooled}; hot layer opacity ${cold}); ${hs.s.n} done, a sound each (${hs.ok})`, cold < 0.05 && coldPx === look.cooled && hs.s.n === half && hs.done === half && hs.ok >= half]);
  const reRender = await hotOpacity(0); // a later keystroke re-renders the strip: cooled letters must not flash again
  const dmg = await ev(() => __km.weakDmg()), g0 = await hpOf();
  await ev(() => __km.setSpeed(0.3)); // slow motion for the screenshot of the burst
  for (const c of w.slice(half, -1).toLowerCase()) await page.keyboard.press(c);
  const again = await hotOpacity(0);
  checks.push([`re-rendering keeps cooled letters cool (hot layer ${again})`, again !== null && again < 0.05 && reRender < 0.05]);
  // v12n: record each sound with the fire's own clock (t) to check the cues
  await ev(() => { window.__sfxT = []; const A = KM.Audio, rec = e => __sfxT.push([e, __km.fireFx() ? +__km.fireFx().t.toFixed(3) : -1]);
    const p = A.play, l = A.loop, st = A.stop; A.play = (e, o) => { rec(e); return p(e, o); }; A.loop = e => { rec("loop:" + e); return l(e); }; A.stop = (e, x) => { if (A.looping().includes(e)) rec("stop:" + e); return st(e, x); }; });
  await page.keyboard.press(w.slice(-1).toLowerCase());
  await until(() => { const f = __km.fireFx(); if (!f || f.t < f.hitAt + 0.02) return false; window.__flash = __km.S.enc.foes.filter(a => !a.gone && a.act && ["hurt", "knock"].includes(a.act.name)).length; return true; }, 6000);
  await shot("05_fire_hit_v4"); const fxDir = await ev(() => KM_DATA.items.fireBottle.art.dir); const flash = await ev(() => window.__flash); await ev(() => __km.setSpeed(1));
  await sleep(300); const g1 = await hpOf();
  checks.push([`fire art is v4 (${fxDir})`, /fire_bottle\/v4\/$/.test(fxDir)]);
  checks.push([`success: fire on all 3 foes, each -${dmg} (weak swing) with the hit flash (${flash}) (${JSON.stringify([g0, g1])})`, g1.every((h, k) => h === Math.max(0, g0[k] - dmg)) && flash === 3 && (await ev(() => __km.fireFx().targets)) === 3]);
  let crackling = false; for (let i = 0; i < 200 && (await ev(() => !!__km.fireFx())); i++) { crackling = crackling || (await ev(() => KM.Audio.looping().includes("fire_crackle"))); await keepAlive(); await sleep(50); }
  const cue = await ev(() => ({ log: __sfxT, left: KM.Audio.looping(), map: KM.Audio.map() }));
  const at = e => (cue.log.find(x => x[0] === e) || [])[1], cnt = e => cue.log.filter(x => x[0] === e).length;
  const sfxOk = at("fire_throw") <= 0.05 && Math.abs(at("fire_smash") - IT.art.throwSecs) < 0.05 && Math.abs(at("fire_ignite") - at("fire_smash") - 0.21) < 0.05 && cnt("fire_ignite") === 1
    && cnt("goblin_burn") === 0 /* v12q: no yelps */ && at("loop:fire_crackle") > at("fire_ignite") && at("stop:fire_crackle") > at("loop:fire_crackle") && at("fire_fizzle") >= at("stop:fire_crackle") && crackling && cue.left.length === 0 && !cnt("swing_hard");
  checks.push([`fire sounds on cue (t s): ${cue.log.map(x => x[0] + "@" + x[1]).join(", ")}; crackle looped (${crackling}), stopped after (${JSON.stringify(cue.left)})`, sfxOk]);
  checks.push([`fire events use Charlie's files (${["fire_throw", "fire_smash", "fire_ignite", "fire_crackle", "fire_fizzle"].map(e => e + ":" + ((cue.map[e] || {}).files || []).length).join(" ")})`, ["fire_throw", "fire_smash", "fire_ignite", "fire_crackle", "fire_fizzle"].every(e => (cue.map[e].files || []).length === 1)]);
  await keepAlive(); await until(() => __km.phase() === "choose", 10000); await sleep(300); await keepAlive();

  // 3) v12m: a wrong key shakes the current letter (it stays grey, water-hiss sound); no Backspace, the right key just continues
  await ev(() => { __km.S.bottles = 1; if (__km.phase() === "choose") __km.S.enc.phase = "busy"; }); await ev(() => { __km.S.enc.phase = "choose"; }); // re-render the moves with the bottle
  await page.keyboard.press("f"); await sleep(250);
  w = (await ev(() => __km.spelling())).word;
  for (const c of w.slice(0, 2).toLowerCase()) await page.keyboard.press(c);
  const bad0 = await ev(() => __km.audioCounts.spell_letter_bad || 0);
  const wrongCh = "QZXJ".split("").find(c => c !== w[2]); await page.keyboard.press(wrongCh.toLowerCase()); await sleep(Math.round(look.shakeSecs * 400));
  await ev(() => document.getAnimations().forEach(a => a.pause()));
  const wr = await ev(() => { const m = document.querySelector("#panel .spellword .letter.next img.miss"); return { s: __km.spelling(), shake: !!m, tf: m ? getComputedStyle(m).transform : "", alt: m && m.alt, red: document.querySelectorAll("#panel .letter.bad, #panel img[src*='/wrong/']").length, bad: __km.audioCounts.spell_letter_bad }; });
  await shot("04_wrong_key_shake"); await ev(() => document.getAnimations().forEach(a => a.play()));
  const missPx = await px("#panel .spellword .letter.next img");
  checks.push([`wrong key "${wrongCh}": the current letter "${wr.alt}" shakes (${wr.tf}), stays grey ${missPx}, no red (${wr.red}), bad sound (${wr.bad - bad0}), still ${wr.s.n} done`, wr.shake && wr.alt === w[2] && missPx === look.grey && wr.red === 0 && wr.bad - bad0 === 1 && wr.s.n === 2]);
  await page.keyboard.press("Backspace"); await sleep(30);
  const afterBack = await ev(() => __km.spelling().n);
  await page.keyboard.press(w[2].toLowerCase()); await sleep(50);
  const cont = await ev(() => __km.spelling().n);
  checks.push([`Backspace does nothing (${afterBack} done); the right key continues at once (${cont} done)`, afterBack === 2 && cont === 3]);
  for (const c of w.slice(3).toLowerCase()) await page.keyboard.press(c);
  await sleep(200); const fin = await ev(() => __km.spelling());
  checks.push(["then the word finishes and the bottle is thrown", fin.n === w.length && (await ev(() => !!__km.fireFx()))]);
  await keepAlive(); await until(() => __km.mode() === "walk" || __km.phase() === "choose", 10000);
  checks.push([`no bottles left: no Fire bottle move (${await ev(() => __km.bottles())})`, (await ev(() => __km.bottles())) === 0 && !(await ev(() => !!document.querySelector('#panel button[data-act="pickFire"]')))]);
  const snd = await ev(() => { const M = KM.Audio.map(); return { ok: M.spell_letter_ok.files, okVol: M.spell_letter_ok.vol, bad: M.spell_letter_bad.files, badVol: M.spell_letter_bad.vol }; });
  checks.push([`Charlie's letter sounds: ok ${snd.ok.length} variants @${snd.okVol}, miss ${snd.bad.length} hisses @${snd.badVol}`, snd.ok.length === 4 && snd.ok.every(f => /spell_ok_\d/.test(f)) && snd.okVol === 0.65 && snd.bad.length === 2 && snd.bad.every(f => /spell_miss_\d/.test(f)) && snd.badVol === 0.8]);
  // v12n: a fire left burning when the battle ends / the scene changes is stopped, crackle and all
  await until(() => __km.mode() === "walk", 15000);
  const cut = await ev(async () => { KM.FireFx.start({ from: { x: 200, y: 700 }, targets: [{ x: 900, y: 760 }] }); KM.FireFx.update(1.3); const on = KM.Audio.looping().slice(); await new Promise(r => setTimeout(r, 200)); return { on, mode: __km.mode(), after: KM.Audio.looping(), fx: !!__km.fireFx() }; });
  checks.push([`out of battle (${cut.mode}) the fire + crackle stop (looping ${JSON.stringify(cut.on)} -> ${JSON.stringify(cut.after)}, fx ${cut.fx})`, cut.mode === "walk" && cut.on.includes("fire_crackle") && cut.after.length === 0 && !cut.fx]);
  checks.push([`no 404s for sounds or item art (${e404.join(", ")})`, e404.length === 0]);
  checks.push(["no page errors (" + errors.join(" | ") + ")", errors.length === 0]);
  let ok = true; for (const [n, v] of checks) { console.log((v ? "  ok   " : "  FAIL ") + n); ok = ok && !!v; }
  await b.close(); console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})();
