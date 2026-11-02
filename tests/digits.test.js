// v12r (Magnus: "0 is often cut and there is a strange space to the other number before it"): every carved digit glyph
// (the ink glyphs the sums show, assets/v10/ink/glyph-digit-N.png via KM.Assets.glyphHTML) is whole (no ink on the slice's
// left/right edge columns, none on the top/bottom rows) and every digit PAIR has the same gap (side bearings even), and
// glyphHTML draws each at its slice size. Slices come from tools/reslice_digits.py.
// Run: URL=http://localhost:8799/index.html node tests/digits.test.js
let playwright; try { playwright = require("playwright"); } catch (e) { playwright = require("/workspace/pwtest/node_modules/playwright"); }
const URL = process.env.URL || "http://localhost:8799/index.html";
(async () => {
  const b = await playwright.chromium.launch(), page = await b.newPage({ viewport: { width: 1600, height: 900 } }), errors = [], checks = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(URL); await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    const out = {};
    for (let d = 0; d < 10; d++) {
      const html = KM.Assets.glyphHTML(String(d)), box = document.createElement("div"); box.innerHTML = html; const img = box.firstChild;
      const im = new Image(); im.src = img.getAttribute("src"); await im.decode();
      const w = im.naturalWidth, h = im.naturalHeight, c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(im, 0, 0);
      const a = g.getImageData(0, 0, w, h).data, A = (x, y) => a[(y * w + x) * 4 + 3];
      let edgeLR = 0, edgeTB = 0; for (let y = 0; y < h; y++) edgeLR = Math.max(edgeLR, A(0, y), A(w - 1, y)); for (let x = 0; x < w; x++) edgeTB = Math.max(edgeTB, A(x, 0), A(x, h - 1));
      const col = x => { for (let y = 0; y < h; y++) if (A(x, y) > 64) return true; return false; };
      let l = 0; while (l < w && !col(l)) l++; let rr = w - 1; while (rr >= 0 && !col(rr)) rr--;
      out[d] = { w, h, edgeLR, edgeTB, left: l, right: w - 1 - rr, cssW: parseFloat(img.style.width), want: +(w * KM_LAYOUT.artScale).toFixed(2) };
    }
    return out; });
  const D = Object.values(r);
  checks.push(["no digit is clipped: no ink on the slice's side edges (max alpha " + Math.max(...D.map(x => x.edgeLR)) + ") nor >80 on its top/bottom rows (" + Math.max(...D.map(x => x.edgeTB)) + ")",
    D.every(x => x.edgeLR <= 20 && x.edgeTB <= 80)]);
  const gaps = []; for (let p = 0; p < 10; p++) for (let q = 0; q < 10; q++) gaps.push(r[p].right + r[q].left);
  checks.push(["every digit pair (100) has an even gap: " + Math.min(...gaps) + "-" + Math.max(...gaps) + " source px (bearings " + JSON.stringify(D.map(x => [x.left, x.right])) + ")",
    Math.max(...gaps) - Math.min(...gaps) <= 4 && Math.min(...gaps) >= 12]);
  checks.push(["glyphs drawn at slice size x artScale (" + D.map(x => x.cssW).join(",") + ")", D.every(x => Math.abs(x.cssW - x.want) < 0.05)]);
  await b.close();
  checks.forEach(([n, v]) => console.log((v ? "  ok   " : "  FAIL ") + n));
  if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
  const ok = checks.every(c => c[1]) && !errors.length; console.log(ok ? "PASS" : "FAIL"); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
