// v19 (Cobra art audit): EVERY animation / frame set in Magnus's packs is referenced by the game: either drawn (its
// byte-identical copy, or the v8 atlas assembled from its frames, is used by a runtime sequence / walk / dice / sky
// config) or listed in KM_ART.packUnused with the handoff's own reason. Plus the v19 wiring: MEGA BOSS dragon frames,
// brutal deaths (eaten by the boss, the sacrifice eaten, rabbits, hunters' arrows), each member's own death, the dragon
// on its hill at Frank's stop, toad + ogre on the road.
// URL=http://localhost:8799/index.html node tests/packanims.test.js
const fs = require("fs"), path = require("path"), crypto = require("crypto");
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html";
const ROOT = path.resolve(__dirname, ".."), IN = path.join(ROOT, "incoming");
const H = "medieval_math_handoff/MedievalMath-Handoff/output/";
const J = p => JSON.parse(fs.readFileSync(path.join(IN, p)));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---- 1) every animation / frame set the packs define (from their own manifests)
const packAnims = []; // { id, files: [pack-relative png], src: [handoff-relative source frames] }
const add = (id, files, src) => packAnims.push({ id, files, src: src || [] });
const v8 = J(H + "medieval-math-production-v8/atlases/manifest.json");
v8.animations.forEach(a => add("v8 atlas " + a.id, [H + "medieval-math-production-v8/atlases/" + a.image], a.frames.map(f => f.source).filter(Boolean)));
J(H + "medieval-math-production-v8/dice/manifest.json").outcomes.forEach((o, i) => add("v8 D20 roll-to-" + (i + 1), [H + "medieval-math-production-v8/dice/roll-to-" + (i + 1) + ".png"]));
add("v8 rabbit-kill frames", fs.readdirSync(path.join(IN, H + "medieval-math-production-v8/rabbit-kill")).map(f => H + "medieval-math-production-v8/rabbit-kill/" + f));
["dragon", "toad", "ogre", "rabbits", "rabbits-flat-blood"].forEach(n => add("v6 " + n, J(H + "medieval-math-creatures-v6/" + n + "/manifest.json").frames.map(f => H + "medieval-math-creatures-v6/" + n + "/" + f.image)));
["arrow-death", "eaten"].forEach(n => add("v5 " + n, J(H + "medieval-math-death-sprites-v5/" + n + "/animation.json").frames.map(f => H + "medieval-math-death-sprites-v5/" + n + "/" + f.image)));
add("v4 drawn-death", J(H + "medieval-math-combat-v4/drawn-death/animation.json").frames.map(f => H + "medieval-math-combat-v4/drawn-death/" + (f.image || f.file)));
add("v4 knight-combat-clips", [H + "medieval-math-combat-v4/knight-combat-clips.json"]); add("v4 enemy-motion", [H + "medieval-math-combat-v4/enemy-motion.json"]);
J(H + "medieval-math-animation-pack-v2/exports/manifest.json").animations.forEach(a => add("v2 loop " + a.id + "/" + a.clip, [H + "medieval-math-animation-pack-v2/exports/" + a.image]));
J(H + "medieval-math-encounter-pack-v3/exports/die-manifest.json").outcomes && J(H + "medieval-math-encounter-pack-v3/exports/die-manifest.json").outcomes.forEach((o, i) => add("v3 D20 roll " + (i + 1), [H + "medieval-math-encounter-pack-v3/exports/d20-roll-to-" + (i + 1) + ".png"]));
add("v3 dragon on its hill", [H + "medieval-math-encounter-pack-v3/art/dragon-hill-layer.png"]); add("v3 coloured dragon", [H + "medieval-math-encounter-pack-v3/art/dragon-colour-cutout.png"]);
J("pack_v13/medieval-math-walks-v13/manifest.json").forEach(a => add("v13 walk " + a.id, ["pack_v13/medieval-math-walks-v13/" + a.image]));
const v18 = J("magnus_zip_1101/medieval-math-riddles-v18/animation/animations.json");
Object.entries(v18.animations || v18).forEach(([k, a]) => a && a.image && add("v18 coif " + k, ["magnus_zip_1101/medieval-math-riddles-v18/animation/" + a.image]));
add("magnus_art birds (2 x 4 frames)", ["magnus_art/birds_sheet_8.png"]);
packAnims.forEach(a => a.files = a.files.filter(f => fs.existsSync(path.join(IN, f))));

(async () => {
  const b = await playwright.chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; p.on("pageerror", e => errors.push(e.message)); p.on("console", m => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text())); p.on("response", r => r.status() >= 400 && !/favicon/.test(r.url()) && errors.push(r.status() + " " + r.url()));
  await p.goto(URL + "?debug"); await p.evaluate(() => localStorage.clear()); await p.reload(); await sleep(1200);
  // ---- 2) what the game references at runtime (asset paths of every sequence / walk / dice / sky sheet / scenery / cutout)
  const used = await p.evaluate(() => { const out = new Set(), r7 = s => (/^assets\//.test(s) ? s : KM_ART7.root + s);
    Object.values(KM_ART7.sequences).forEach(s => out.add(r7(s.img))); Object.values(KM_ART7.parallax).forEach(s => out.add(r7(s.img)));
    for (let n = 1; n <= 20; n++) out.add(r7(KM_ART7.dice.roll.replace("{n}", n)));
    if (window.KM_ART11) (KM_ART11.birds || []).forEach(B => B.frames.forEach(f => out.add(KM_ART11.root + f)));
    Object.values(KM_ART.entities).forEach(e => e.img && out.add(e.img)); return [...out]; });
  const usedSha = new Map(); used.forEach(u => { const f = path.join(ROOT, u); if (fs.existsSync(f)) usedSha.set(sha(f), u); });
  const usedAtlasSources = new Set(v8.animations.filter(a => usedSha.has(sha(path.join(IN, H + "medieval-math-production-v8/atlases/" + a.image)))).flatMap(a => a.frames.map(f => f.source)));
  const unused = await p.evaluate(() => KM_ART.packUnused || {});
  const birdsUsed = await p.evaluate(() => !!(window.KM_ART11 && KM_ART11.birds && KM_ART11.birds.length === 2 && KM_ART11.birds.every(B => B.frames.length === 4)));
  const report = packAnims.map(a => {
    const hit = a.files.map(f => usedSha.get(sha(path.join(IN, f)))).filter(Boolean);
    const viaAtlas = a.files.length && a.files.every(f => usedAtlasSources.has(f.replace(H, "")));
    const why = Object.entries(unused).find(([k]) => a.files.length && a.files.every(f => (H + k === f) || f.startsWith(H + k + "/") || f === k || f.startsWith(k + "/")));
    const ok = hit.length > 0 || viaAtlas || (a.id.startsWith("magnus_art birds") && birdsUsed) || (a.id === "v8 rabbit-kill frames" && usedAtlasSources.size > 0 && used.some(u => /rabbit-hit-and-death/.test(u)));
    return { id: a.id, n: a.files.length, ok: ok || !!why, how: ok ? (hit[0] || (viaAtlas ? "v8 atlas" : "assembled")) : why ? "UNUSED: " + why[1].slice(0, 60) : "-" };
  });
  const missing = report.filter(r => !r.ok);
  const checks = [];
  checks.push([`every pack animation is referenced (${report.length} sets; ${report.filter(r => !/^UNUSED/.test(r.how)).length} drawn, ${report.filter(r => /^UNUSED/.test(r.how)).length} listed unused with a reason)` + (missing.length ? " MISSING: " + missing.map(m => m.id).join(", ") : ""), missing.length === 0 && report.length > 100]);
  ["dragon-sequence", "toad-sequence", "ogre-sequence", "rabbits-flat-blood-sequence", "knight-arrow-death", "knight-death", "rabbit-hit-and-death"].forEach(id =>
    checks.push(["v8 atlas " + id + " is drawn by the game", report.find(r => r.id === "v8 atlas " + id).how.startsWith("assets/")]));
  // ---- 3) clip data = the manifest's cells and holds, one global scale
  const clips = await p.evaluate(() => { const Q = KM_ART7.sequences, c = n => Q[n] && { n: Q[n].frames.length, ms: Q[n].frames.map(f => f.ms), mul: Q[n].mul || 1, loop: Q[n].loop, cell: Q[n].cell, pivot: Q[n].pivot };
    return { eat: c("dragon_eat"), idle: c("dragon_idle"), toad: c("toad_eat"), ogre: c("ogre_eat"), tear: c("rabbits_tear"), arrow: c("knight_arrow_death"), seqD: KM_ART.entities.dragon.seq, eatD: KM_ART.entities.dragon.eatSeq,
      toadE: KM_ART.entities.toad && KM_ART.entities.toad.seq, ogreE: KM_ART.entities.ogre && KM_ART.entities.ogre.seq, road: KM_DATA.encounters.map(e => e.enemy).filter(Boolean), art: KM_LAYOUT.artScale }; });
  const ms = id => v8.animations.find(a => a.id === id).frames.map(f => f.durationMs).join();
  checks.push(["MEGA BOSS dragon: all 6 drawings of dragon-sequence (" + clips.eat.ms + " ms, no loop), idle = its 6th drawing, same cell + pivot", clips.eat.n === 6 && clips.eat.ms.join() === ms("dragon-sequence") && !clips.eat.loop && clips.idle.n === 1 && clips.seqD.idle === "dragon_idle" && clips.eatD === "dragon_eat" && clips.idle.pivot.join() === clips.eat.pivot.join()]);
  checks.push(["toad / ogre / rabbits / arrows clips = manifest holds", clips.toad.ms.join() === ms("toad-sequence") && clips.ogre.ms.join() === ms("ogre-sequence") && clips.tear.ms.join() === ms("rabbits-flat-blood-sequence") && clips.arrow.ms.join() === ms("knight-arrow-death")]);
  checks.push(["one global scale: artScale 0.6, every v19 clip mul 1 (no per-clip calibration)", clips.art === 0.6 && [clips.eat, clips.idle, clips.toad, clips.ogre, clips.tear, clips.arrow].every(c => c.mul === 1)]);
  checks.push(["toad + ogre on the road with their drawings; MEGA BOSS still last (" + clips.road.join(",") + ")", clips.road.includes("toad") && clips.road.includes("ogre") && clips.road[clips.road.length - 1] === "dragon" && !!clips.toadE && !!clips.ogreE]);
  // ---- 4) behaviour, via the ?debug jump hook
  const st = () => p.evaluate(() => ({ mode: __km.mode(), phase: __km.phase(), party: __km.S.party.length }));
  const until = async (f, t = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < t) { const s = await st(); if (f(s)) return s; await sleep(50); } throw new Error("timeout " + JSON.stringify(await st())); };
  const go = async (want, looks) => { await p.evaluate(([w, l]) => __km.debugJump(w, l), [want, looks]); await p.evaluate(() => __km.setSpeed(8)); await until(s => s.mode === "encounter"); await p.evaluate(() => __km.setSpeed(2)); };
  const wrong = async () => { await until(s => s.phase === "choose" || s.mode !== "encounter"); if ((await st()).mode !== "encounter") return; await p.keyboard.press("1"); await sleep(60); for (const c of "9999") await p.keyboard.press(c); await p.keyboard.press("Enter"); await sleep(250); };
  const watch = async (f, t = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < t) { const v = await p.evaluate(f); if (v) return v; await sleep(30); } return null; };
  // the dragon on its hill at Frank's stop, then it comes down on a commit
  await go("frank", [1]); await sleep(300);
  const hill = await p.evaluate(() => { const S = __km.S, q = KM_ART7.parallax["dragon-hill"], M = KM_DATA.scenery.mid, x = S.swaps.mid.at - S.camX * M.speed + (q.dragon[0] + q.dragon[2]) / 2 * KM_LAYOUT.art; return { on: S.swaps.mid.on, x, vw: KM_LAYOUT.viewW }; });
  checks.push(["background dragon: on its hill in the scenery at Frank's stop, on screen (x " + Math.round(hill.x) + " of " + Math.round(hill.vw) + ")", hill.on && hill.x > 200 && hill.x < hill.vw - 100]);
  await p.keyboard.press("1"); await sleep(1200);
  checks.push(["Frank 'Fight it': the dragon leaves its hill and comes closer in colour (v3 cutout)", await p.evaluate(() => !__km.S.swaps.mid.on && /dragon-colour-cutout/.test(KM_ART.entities.turd_dragon.img) && KM.Assets.hasArt("turd_dragon"))]);
  // own death clip: the coif dies to a goblin with HIS drawn death (no brutal one for goblins)
  await go("goblin", [5]); await p.keyboard.press("Enter"); await wrong(); await wrong();
  const own = await watch(() => { const m = __km.S.party.find(m => m.dying); return m && { seq: m.dying.seq || (KM_ART.entities["follower_" + m.skin] || {}).deathSeq, skin: m.skin }; });
  checks.push(["each member plays its own death clip: the coif -> death_coif (" + JSON.stringify(own) + ")", own && own.seq === "death_coif"]);
  // rabbits tear the last-joined member apart
  await go("killer_rabbit", [2]); await p.keyboard.press("Enter"); await wrong(); await wrong();
  const tear = await watch(() => { const m = __km.S.party.find(m => m.dying); return m && m.dying.seq; });
  checks.push(["killed by the rabbit: rabbits-flat-blood sequence where the member stood (" + tear + ")", tear === "rabbits_tear"]);
  // MEGA BOSS: a member is eaten (victim hidden, dragon plays its six drawings), then the hero, then game over
  await go("mega", [3]); await p.keyboard.press("Enter"); await wrong(); await wrong();
  const eat = await watch(() => { const a = __km.S.enc && __km.S.enc.act, m = __km.S.party.find(m => m.eaten); return a && a.seqPlay && a.seqPlay.id === "dragon_eat" && m && { victim: m.skin, frames: KM_ART7.sequences.dragon_eat.frames.length }; });
  checks.push(["brutal death against the MEGA BOSS: the dragon eats the member (6 drawings, victim hidden) " + JSON.stringify(eat), !!eat && eat.frames === 6]);
  await until(s => s.party === 1 && s.phase === "choose", 15000);
  const back = await p.evaluate(() => { const a = __km.S.enc.act; return !a.seqPlay && KM.Assets.hasArt("dragon"); });
  checks.push(["after eating, the dragon stands as its last drawing again; the victim left the party", back]);
  await wrong(); await wrong();
  const heroEaten = await watch(() => __km.S.party[0].eaten && __km.S.dying && __km.S.dying.killer);
  await until(s => s.mode === "gameover", 15000);
  checks.push(["the hero eaten by the MEGA BOSS, then game over (" + heroEaten + ")", heroEaten === "dragon" && /dragon/.test(await p.evaluate(() => document.getElementById("panel").innerText + JSON.stringify(__km.speechLog().slice(-3))))]);
  // the sacrifice is eaten by the dragon
  await go("mega", [3]); await p.keyboard.press("Enter"); await until(s => s.phase === "choose"); await p.keyboard.press("s"); await sleep(100); await p.keyboard.press("1");
  const sac = await watch(() => __km.S.enc && __km.S.enc.act.seqPlay && __km.S.enc.act.seqPlay.id);
  checks.push(["mega sacrifice: the volunteer charges and the dragon eats him (" + sac + ")", sac === "dragon_eat"]);
  // the King's hunters catch the hero: the arrow death
  await go("goblin", []); await p.evaluate(() => (__km.S.hunters = KM_DATA.combat.hunters.blocks - 1)); await p.keyboard.press("Enter"); await wrong();
  const arrow = await watch(() => __km.S.party[0].dying && __km.S.party[0].dying.seq, 8000);
  checks.push(["caught by the King's hunters: knight-arrow-death (" + arrow + ")", arrow === "knight_arrow_death"]);
  checks.push(["debug hook is off by default (no ?debug)", await (async () => { const q = await b.newPage(); await q.goto(URL); await sleep(500); const v = await q.evaluate(() => typeof __km.debugJump); await q.close(); return v === "undefined"; })()]);
  checks.push(["no page errors (" + errors.join(" | ") + ")", errors.length === 0]);
  let ok = true; for (const [n, v] of checks) { console.log((v ? "  ok   " : "  FAIL ") + n); ok = ok && !!v; }
  if (process.env.TABLE) console.log(report.map(r => `${r.ok ? "ok " : "!! "} ${r.id} (${r.n}) -> ${r.how}`).join("\n"));
  await b.close(); console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
