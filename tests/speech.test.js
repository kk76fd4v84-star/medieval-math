// v11b speech rule (Magnus): a bubble holds whole short lines. Every sentence the game can say must fit ONE bubble
// (<= KM_LAYOUT.speech.maxLines lines at the painted bubble's text width), so no bubble starts mid-sentence and nothing
// is cut off. Scans every speech string in KM_DATA plus the game's templated lines with long names and numbers.
// Run: URL=http://localhost:8799/index.html node tests/speech.test.js
const path = require("path"), fs = require("fs");
let playwright;
try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const ROOT = path.resolve(__dirname, "..");
const URL = process.env.URL || "http://localhost:8799/index.html";
(async () => {
  const browser = await playwright.chromium.launch(); const page = await browser.newPage(); const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(URL); await page.waitForTimeout(1500);
  // lines built in src/game.js (names / numbers at their longest plausible size)
  const NAME = "Bartholomewswort", SHORT = "Wobblesworth";
  const templated = [
    `${NAME}? Really? ...Fine. Off you go, Sir ${NAME}. Try not to die.`,
    `${SHORT}! Oh no. Right. Onwards.`, `Not ${SHORT}! He owed me money.`, `${SHORT} has stopped being alive.`,
    `${SHORT}... you're a newt now. Pass.`, `Sir ${NAME}! Marginally less scruffy.`, `${SHORT}! Marginally less scruffy.`,
    "It's 1440! Can't count? Roll me for it, then.", "17 beats 12. Fine, I'll come.", "12 beats 17. I'm staying put.",
    "Natural 20! 34! The dragon is smitten. Smote. Smited.", "Natural 20! 34? Not enough. My turn!",
    "Something big blocks the road!", "Something lurks in the mist...", "It blocks the whole road. No way around!",
    "Whatever that was, we'll never know.", "One scroll of stupidity. Don't read it near a library.",
    "Right! Off you go then.", "Hmph. Right on the second go. No gold for you.", "WRONG! One more go.",
    "Full party? Bah. I'll stay in me ditch.", "No, Frank. No turd dragons today.", "Nonsense! FOR SCIENCE!",
    "Who takes one for the team?", "Farewell!", "Come back here! I'll bite your legs off!", "Splendid! For God and science!",
    "The table is empty. Someone left half a pie.", "Stew's hot. Mead's strong.", "Mead or stew, love?"
  ];
  const r = await page.evaluate(({ templated, NAME }) => {
    const D = KM_DATA, out = [], add = (t, src) => { if (t && typeof t === "object") t = t.text; if (typeof t === "string" && t.trim()) out.push([src, t.replace(/\{name\}/g, NAME).replace(/\{d\}/g, "12.3")]); };
    const dg = D.dialogue; dg.intro.forEach(x => add(x, "intro")); add(dg.namePrompt, "namePrompt"); add(dg.afterName, "afterName");
    dg.gameOver.forEach(x => add(x, "gameOver")); add(dg.victory, "victory"); dg.wrong.forEach(w => add(w + " It's 1440!", "wrong")); dg.right.forEach(x => add(x, "right"));
    D.recruitPool.forEach(k => { add(k.join + " Prove you can count. Then I'm yours.", "join " + k.name); add(k.sacrifice, "sacrifice " + k.name); });
    Object.entries(D.enemies).forEach(([id, e]) => { add(e.taunt, id); add(e.defeat, id); (e.riddleTaunt || []).forEach(x => add(x, id)); });
    Object.values(D.restStops.types).forEach(t => { add(t.greet, "greet"); if (t.mead) ["buy", "wearOff", "already"].forEach(k => add(t.mead[k], "mead")); });
    const RT = D.recruitTalk; add(RT.ask, "recruitTalk"); Object.values(RT.challenge).flat().forEach(x => add(x, "challenge")); RT.yes.forEach(x => add(x, "yes")); RT.no.forEach(x => add(x + " " + RT.offer, "no+offer"));
    ["already", "meadAlready", "none"].forEach(k => add(D.spell[k], "spell")); D.spell.cast.forEach(x => add(x, "spell")); D.spell.wearOff.forEach(x => add(x, "spell"));
    D.graves.epitaphs.forEach(x => add(x, "epitaph")); D.graves.respects.forEach(x => add(x, "respects")); add(D.graves.further.text, "further");
    D.riddles.forEach(q => add(`WRONG AGAIN! It was "${q.choices[q.answer]}". Now limp off.`, "riddle wrong again"));
    templated.forEach(t => add(t, "game.js"));
    const bad = [];
    for (const [src, t] of out) {
      const before = __km.speechOverflow().length, chunks = __km.chunks(t), over = __km.speechOverflow().slice(before);
      const joined = chunks.map(c => c.join(" ")).join(" "), norm = t.replace(/\s+/g, " ").trim();
      const mid = chunks.map(c => c.join(" ")).filter(c => /^[a-z,;:—–-]/.test(c));
      if (over.length || mid.length || joined !== norm || chunks.some(c => c.length > KM_LAYOUT.speech.maxLines)) bad.push({ src, t, chunks, over, mid });
    }
    return { n: out.length, bad, overflowAll: __km.speechOverflow() };
  }, { templated, NAME });
  const checks = [["every speech line (" + r.n + ") fits whole sentences per bubble, nothing truncated or mid-sentence" + (r.bad.length ? " " + JSON.stringify(r.bad.slice(0, 5)) : ""), r.n > 100 && r.bad.length === 0 && r.overflowAll.length === 0]];
  await browser.close();
  checks.forEach(([n, v]) => console.log((v ? "  ok   " : "  FAIL ") + n));
  if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  const ok = checks.every(c => c[1]) && errors.length === 0;
  console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
