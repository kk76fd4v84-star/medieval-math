// Scruffy Knights & Sums — one continuous side-scrolling world with a camera.
// Screen split (src/config/layout.js): SCENE on top = world + characters + one-line barks only;
// STRIP below = every piece of interactive / text UI. The painted ground line IS the separator.
// v7: Magnus's handoff art (KM_ART7) + GAME_DESIGN.txt rules: turn combat (weak / hard / heal), hunters pursuit,
// hidden monster strength until commit, D20, recruiting by maths (+ D20 contest), Frank's restraint branch,
// layered camp / tavern views, approved drawn deaths, graves with killer emblems.
(function () {
  const D = KM_DATA, SPL = KM_DATA.spell, IT = KM_DATA.items.fireBottle, W = D.world, A = KM.Audio, MU = KM.Music, RS = D.restStops, GR = D.graves, C = D.combat, L = KM_LAYOUT, K = L.k, VW = L.viewW;
  const $ = id => document.getElementById(id);
  const cv = $("game"), ctx = cv.getContext("2d");
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const G = s => KM.Assets.glyphHTML(s);
  // v12e: an option = the open plaque button (label only); the key is a silent shortcut
  // v12e (Magnus): every choice is the battle's open plaque button; no visible key labels (the keys still work)
  const opt = (key, label, act, attrs = "", off = false) => `<button class="opt plaque" data-act="${act}" ${attrs} ${off ? "disabled" : ""}>${BANNER}<span class="nm">${label}</span></button>`;
  const ART7 = !!window.KM_ART7, SCN = () => ART7 && KM.Scenery.available();

  const S = {
    mode: "title", t: 0, speedMul: 1, camX: 0, name: "Nobody", hp: 6, gold: 0, hunters: 0, spells: 0, spellLeft: 0, mead: 0, bottles: 0,
    party: [], stop: 0, stops: [], actors: [], obstacles: [], props: [], trees: [], floats: [], skyEvents: [], timers: [],
    enc: null, dice: [], stats: { correct: 0, wrong: 0, riddles: 0, sacrificed: 0 }, usedRiddles: [],
    checkpoint: null, shake: 0, banner: null, winT: 0, stepT: 0, nextSky: 8, intro: null, dist: 0, fid: 0, runId: "",
    graves: [], respect: null, bestAtStart: 0, furtherDone: false, toast: null, view: null, dying: null, voices: []
  };
  // scheduled steps run on game time (so test speed-ups apply)
  const later = (secs, fn) => S.timers.push({ at: S.t + secs, fn });

  // ---------- party / stats ----------
  // party: hero + up to D.party.maxFollowers followers (GAME_DESIGN: max 4 incl. the player)
  const memberName = m => (m.id === "hero" ? "Sir " + S.name : m.name);
  const knights = () => S.party.filter(m => m.id !== "hero"); // followers
  const partyFull = () => knights().length >= D.party.maxFollowers;
  const strength = () => Math.min(D.party.strengthCap, S.party.reduce((s, m) => s + m.base + m.weapon, 0)); // party POWER
  // v11b heart rule (Magnus): 2 hearts per party member (hero 2, each companion +2). Every 2 hearts lost in ONE battle,
  // a party member dies horribly (companions first; the hero always dies last, only when no companion is left).
  const HPM = () => D.party.heartsPerMember;
  const maxHp = () => HPM() * S.party.length;
  // v12j (Magnus): the front of the party moves forward as it fills up; alone the hero stands soloBack further back
  const frontX = () => W.partyScreenX - (W.soloBack || 0) * (D.party.maxFollowers + 1 - ((S && S.party) ? S.party.length : 1)) / D.party.maxFollowers;
  const slotX = i => frontX() - i * W.slotSpacing;
  const artId = m => (m.id === "hero" ? "hero" : "follower_" + (m.skin || 1));
  const shortName = n => n.replace(/^(Sir|Dame|Brother) /, "");
  const freeSkin = () => { for (let k = 1; k <= D.party.skins; k++) if (!knights().some(m => m.skin === k)) return k; return 1; };
  function newMember(id, sx) { return { id: "hero", kind: "hero", base: D.party.heroBase, weapon: 0, armor: 0, sx: sx == null ? slotX(0) : sx, hopY: 0 }; }
  function followerFrom(p, sx, look) { return { id: "f" + (++S.fid), kind: "follower", name: p.name, base: p.base, skin: look && !knights().some(m => m.skin === look) ? look : freeSkin(), trait: p.trait, sacrifice: p.sacrifice, weapon: 0, armor: 0, sx, hopY: 0 }; }
  const actorName = a => a.name || (a.narrator ? "The Narrator" : (D.enemies[a.id] && D.enemies[a.id].name) || a.id);
  const leagues = () => (S.dist / W.pxPerLeague).toFixed(1);
  const weakDmg = () => C.weakBase + Math.floor(strength() / C.weakPer);
  const hardDmg = () => weakDmg() * C.hardMul + C.hardAdd;

  // ---------- world building (all x in scene px along the road) ----------
  const haltCam = st => st.stopX - W.engageScreenX;
  const NARRATOR_X = 1650; // rock base centre (layout units): his rock clears the knight, his skull sits right of centre
  const isFight = st => ["math", "boss", "mega"].includes(st.type);
  function pickCands(n, taken) {
    const pool = D.recruitPool.filter(p => !taken.has(p.name));
    const out = [];
    while (out.length < n && pool.length) { const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; taken.add(p.name); out.push(p); }
    return out;
  }
  const mkActor = o => Object.assign({ active: true, state: "idle", t: 0, rot: 0, dy: 0, alpha: 1, flash: 0, sp: null, dead: false }, o);
  // v18: each candidate carries a look (st.candSkins, rotating through every skin incl. the coif) and joins AS that look
  const candArt = (j, st = S.enc && S.enc.st) => "follower_" + (st && st.candSkins && st.candSkins[j] || 1 + (j % D.party.skins));
  // ---- v11b multi-enemy fights (TEMP_BALANCE combat.groups): a row of 2-3 foes on the ground line, front one first
  const GRP = () => C.groups || {};
  function rollGroup(st) {
    const g = GRP(), lg = st.stopX / W.pxPerLeague; if (!g.pool || lg < g.fromLeague) return null;
    if (Math.random() >= (lg >= g.lateLeague ? g.lateChance : g.chance)) return null;
    const n = lg >= g.lateLeague && Math.random() < g.chance3 ? 2 : 1; return Array.from({ length: n }, () => pickOne(g.pool));
  }
  // row slots: the front foe stands at homeX, the others behind it to the right, opaque extents (KM_WIDE) + gap apart;
  // the whole row is shifted left so it fits on screen at the halt
  const wideOf = id => (window.KM_WIDE && KM_WIDE[id]) || [-KM.Assets.entitySize(id)[0] / 2, KM.Assets.entitySize(id)[0] / 2];
  function rowSlots(st, ids) { const g = GRP(); let x = 0; const xs = [0];
    for (let k = 1; k < ids.length; k++) { x += wideOf(ids[k - 1])[1] + g.gap - wideOf(ids[k])[0]; xs.push(x); }
    const right = x + wideOf(ids[ids.length - 1])[1], room = VW - 40 - (st.stopX - haltCam(st)) - 0; // layout units right of the front foe's spot
    // never shift the row into the knight: the front foe's drawing stays clear of the hero's (layout units)
    const hw = wideOf("hero"), maxShift = Math.max(0, (st.stopX - haltCam(st)) - (slotX(0) + hw[1] + 30 - wideOf(ids[0])[0]));
    const shift = Math.max(0, Math.min(right - room, maxShift)); const out = xs.map(v => st.stopX - shift + v); out.fits = right - shift <= room; return out; }
  function addGroup(st, i) {
    // the row must fit on screen without touching the knight: swap the widest extra for the narrowest pool monster, else drop one
    const W2 = id => wideOf(id)[1] - wideOf(id)[0], small = GRP().pool.slice().sort((p, q) => W2(p) - W2(q))[0];
    let ids = [st.enemy].concat(st.group), xs = rowSlots(st, ids);
    for (let guard = 0; !xs.fits && ids.length > 1 && guard < 6; guard++) {
      const k = ids.slice(1).reduce((b2, id, j) => W2(id) > W2(ids[b2]) ? j + 1 : b2, 1);
      if (W2(ids[k]) > W2(small)) ids[k] = small; else ids.pop(); xs = rowSlots(st, ids); }
    st.group = ids.slice(1); st.homeX = xs[0];
    ids.slice(1).forEach((id, k) => S.actors.push(mkActor({ stop: i, id, x: xs[k + 1] + 500 + (k + 1) * 420, homeX: xs[k + 1], active: false, state: "waiting", foe: true, distant: true, extra: k + 1 })));
  }
  function buildWorld(fromStop) {
    S.stops = []; let x = 1800;
    KM.Road.build().forEach((e, i) => { x += (e.gap || 1300) * (W.gapScale || 1); S.stops.push(Object.assign({ idx: i, stopX: x }, e)); });
    S.actors = []; S.obstacles = []; S.props = []; S.trees = [];
    const taken = new Set(S.party.filter(m => m.name).map(m => m.name));
    let skinAt = Math.floor(Math.random() * D.party.skins); const looks = n => Array.from({ length: n }, () => 1 + (skinAt++ % D.party.skins));
    // spans of the road that must stay clear: party at each halt, each encounter (incl. walk-in path), intro
    const clear = [[0, NARRATOR_X + 700]];
    S.stops.forEach((st, i) => {
      const h = haltCam(st);
      clear.push([h + slotX(D.party.maxFollowers) - 100, h + W.partyScreenX + 100]);
      if (st.type === "rest") {
        const T = RS.types[st.rest], [rn, rx] = T.recruits, w = T.view === "stall" ? 0 : KM.Assets.entitySize(T.exterior)[0];
        st.cands = pickCands(rn + Math.floor(Math.random() * (rx - rn + 1)), taken); st.candSkins = looks(st.cands.length);
        clear.push([st.stopX - 900, st.stopX + 900]);
        if (i < fromStop) return;
        const view = ART7 && T.view;
        if (view === "tavern" && KM.RestView.scene("tavern-arrival")) return; // v12e (Magnus): only the big arrival scene, no small road tavern first
        if (view === "tavern") { S.actors.push(mkActor({ stop: i, id: "tavern_facade", x: st.stopX, main: true, back: true, facade: true, name: T.name })); return; }
        if (T.view === "stall" && STALL()) { S.actors.push(mkActor({ stop: i, id: "scroll_seller", x: st.stopX, main: true, back: true, keeper: true, stall: true, name: T.keeperName })); return; }
        if (view === "camp") { S.actors.push(mkActor({ stop: i, id: T.exterior, x: st.stopX, main: true, back: true, hidden: true, name: T.name })); return; }
        S.actors.push(mkActor({ stop: i, id: T.exterior, x: st.stopX, main: true, back: true, name: T.name }));
        S.actors.push(mkActor({ stop: i, id: T.keeper, x: st.stopX - w / 2 - 110, keeper: true, back: true, name: T.keeperName }));
        st.cands.forEach((p, j) => S.actors.push(mkActor({ stop: i, id: candArt(j, st), x: st.stopX - 860 + j * 165, candIdx: j, back: true, name: p.name, label: shortName(p.name) })));
        return;
      }
      if (st.type === "recruit") { st.cands = pickCands(1, taken); st.candSkins = looks(st.cands.length); }
      if (st.type === "special") { // Frank on the road, the (distant) turd dragon up on the hill
        clear.push([st.stopX - 300, st.stopX + 700]);
        if (i < fromStop) return;
        S.actors.push(mkActor({ stop: i, id: st.npc, x: st.stopX, main: true, back: true }));
        S.actors.push(mkActor({ stop: i, id: st.enemy, x: st.stopX + 420, foe: true, distant: true, hill: true })); // optional creature: on its hill
        return;
      }
      const aid = st.type === "recruit" ? candArt(0, st) : st.enemy || st.npc;
      const w = KM.Assets.entitySize(aid)[0]; clear.push([st.stopX - w / 2 - 150, st.stopX + w / 2 + (st.walksIn ? 600 : 150)]);
      if (st.type === "math" && !st.group) st.group = rollGroup(st);
      if (i >= fromStop && st.group && st.group.length) addGroup(st, i);
      if (i >= fromStop) S.actors.push(mkActor({ stop: i, id: aid, main: true, x: st.walksIn || st.group ? st.stopX + 500 : st.homeX || st.stopX, homeX: st.homeX, active: !(st.walksIn || st.group), state: st.walksIn || st.group ? "waiting" : "idle",
        foe: isFight(st), distant: isFight(st),   // hidden strength: seen far off (grey, in the mist) until the party commits
        back: ["bridgekeeper", "enchanter", "hermit"].includes(aid), candIdx: st.type === "recruit" ? 0 : undefined, name: st.type === "recruit" ? st.cands[0].name : undefined, label: st.type === "recruit" ? shortName(st.cands[0].name) : undefined }));
    });
    buildGraves();
    // v19: the snake dragon sits on its hill in the scenery (KM_ART19 hill strip swapped into the mid row), placed so it is
    // on screen at swap.screenX when the party halts at Frank's stop (v3 README); it leaves the hill on a commit
    const MS = ART7 && D.scenery.mid, hq = MS && MS.swap && KM_ART7.parallax[MS.swap.strip], fs = hq && S.stops.find(st => st.id === MS.swap.stop);
    S.swaps = fs ? { mid: { at: MS.swap.screenX + haltCam(fs) * MS.speed - (hq.dragon[0] + hq.dragon[2]) / 2 * L.art, on: true } } : null;
    const end = S.stops[S.stops.length - 1].stopX + 4000;
    const free = (x, half) => !clear.some(([a, b]) => x + half > a && x - half < b);
    if (ART7) { // roadside trees from Magnus's tree props (front lane, behind the party)
      const T = D.scenery.trees; let n = 0;
      for (let tx = 600; tx < end; tx += rnd(...T.every)) { const i = n++ % 4, half = KM.Scenery.treeWidth(i) / 2 + T.clearance; if (free(tx, half)) S.trees.push({ x: tx, i }); }
    }
    if (W.boxScenery !== false || !ART7) {
      for (let ox = 1000; ox < end; ox += rnd(...W.obstacleEvery)) {
        const id = pickOne(W.obstacleKinds), half = KM.Assets.entitySize(id)[0] / 2 + 140;
        if (free(ox, half)) S.obstacles.push({ x: ox, id });
      }
      S.obstacles.forEach(o => clear.push([o.x - 140, o.x + 140]));
      for (let px = 400; px < end; px += rnd(...W.propEvery)) {
        const id = pickOne(W.propKinds), half = KM.Assets.entitySize(id, W.propScale)[0] / 2 + W.propClearance;
        if (free(px, half)) S.props.push({ x: px, id });
      }
    }
  }
  // ---------- graves of past deaths (KM.Save profile, survives new games) ----------
  // v7: a death remembers WHICH encounter killed the knight (progress.encounter = KM_DATA.encounters index) and the killer.
  // v12g (Magnus: "the grave should be where you die and nowhere else and sit on the ground layer"): the grave stands ON
  // THE ROAD (ground line, same layer as the party, artScale) at the spot where the knight fell = his camera x at death
  // (that encounter's halt + the saved offset, so it survives a rebuilt road) + GR.ahead (he falls forward). No clamping,
  // no hill lane. g.wx = the grave's road x (camera units); g.cam = where the party halts to pay respects (grave in front).
  const markerOf = d => (d.killer && GR.markers[d.killer]) || "grave";
  function graveX(d) {
    if (d.progress && d.progress.encounter != null) {
      const st = S.stops.find(s => s.src === d.progress.encounter);
      if (st) return haltCam(st) + (d.progress.offset || 0) + GR.ahead;
    }
    return isFinite(d.x) ? d.x + GR.ahead : null;
  }
  const graveCam = d => { const x = graveX(d); return x == null ? null : Math.max(0, x - GR.respectAt); };
  function buildGraves() {
    const ds = KM.Save.deaths().map(d => ({ d, cam: graveCam(d), wx: graveX(d) })).filter(o => o.cam != null).sort((a, b) => a.cam - b.cam);
    S.graves = []; S.respect = null;
    ds.forEach(({ d, cam, wx }) => {
      const g = S.graves[S.graves.length - 1];
      if (g && cam - g.cam < GR.merge) g.deaths.push(d); else S.graves.push({ cam, wx, deaths: [d], done: false });
    });
    S.graves.forEach(g => {
      const d = g.deaths[g.deaths.length - 1];
      g.marker = markerOf(d); g.killer = d.killer || "unknown";
      g.actor = mkActor({ id: g.marker, grave: true, name: g.deaths.length > 1 ? "Gravestones" : "Gravestone", label: g.deaths.length > 1 ? `${g.deaths.length} knights` : `Sir ${d.name}` });
    });
  }
  // grave screen x: a road prop (moves with the road, speed 1) at its death spot
  const graveSX = g => W.partyScreenX + (g.wx - S.camX);
  function epitaph(g) {
    const d = g.deaths[Math.floor(Math.random() * g.deaths.length)];
    const t = pickOne(GR.epitaphs).replace(/\{name\}/g, d.name).replace(/\{d\}/g, (+d.leagues || 0).toFixed(1));
    const by = d.killer && d.killer !== "unknown" ? ` Killed by ${GR.killedBy[d.killer] || d.killer}.` : "";
    const more = g.deaths.length - 1;
    return t + by + (more ? ` (${more} more knight${more > 1 ? "s" : ""} rest${more > 1 ? "" : "s"} here.)` : "");
  }
  function startRespects(g) {
    S.respect = { g, t: 0 };
    partyAct("respects", GR.respectsSecs);
    say(g.actor, epitaph(g));
  }
  function placeCameraAt(stop) { S.camX = stop > 0 ? haltCam(S.stops[stop - 1]) + 40 : 0; }
  function addNarrator() { S.actors.push(mkActor({ id: "narrator", x: NARRATOR_X, narrator: true })); }

  // ---------- saves (run save v4: + hunters, follower skins) ----------
  // v10: the frontGround run seed (choose-strip.js: "store/reuse the run seed") = a hash of the saved runId, also saved
  const seedOf = id => { let h = 2166136261; for (const ch of String(id)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h & 0x7fffffff; };
  const fgSeed = () => (S.fgSeed != null ? S.fgSeed : (S.fgSeed = seedOf(S.runId)));
  const core = () => ({ name: S.name, hp: S.hp, gold: S.gold, stop: S.stop, dist: Math.round(S.dist), fid: S.fid, further: S.furtherDone, hunters: S.hunters, spells: S.spells, spellLeft: S.spellLeft, mead: S.mead ? 1 : 0, bottles: S.bottles, runId: S.runId, fgSeed: fgSeed(),
    party: S.party.map(m => { const { sx, hopY, act, hopping, dying, ...rec } = m; return rec; }), stats: Object.assign({}, S.stats), usedRiddles: S.usedRiddles.slice() });
  function save() { KM.Save.write(Object.assign(core(), { checkpoint: S.checkpoint })); }
  function setCheckpoint() { S.checkpoint = core(); save(); }
  function applyCore(c) {
    S.name = c.name; S.hp = c.hp; S.gold = c.gold; S.stop = c.stop; S.stats = Object.assign({ correct: 0, wrong: 0, riddles: 0, sacrificed: 0 }, c.stats); S.usedRiddles = (c.usedRiddles || []).slice();
    S.dist = c.dist || 0; S.furtherDone = !!c.further; S.hunters = c.hunters || 0; S.spells = c.spells != null ? c.spells : SPL.start; S.spellLeft = c.spellLeft || 0; S.mead = c.mead ? 1 : 0; S.bottles = c.bottles || 0; S.runId = c.runId || "run-" + Date.now(); S.fgSeed = c.fgSeed != null ? c.fgSeed : seedOf(S.runId);
    S.party = c.party.map((m, i) => Object.assign({}, m, { sx: slotX(i), hopY: 0 }));
    S.fid = Math.max(c.fid || 0, ...S.party.map(m => +String(m.id).replace(/\D/g, "") || 0));
    S.view = null; S.dying = null; S.dice = []; S.timers = []; S.toast = null; S.entering = null;
    buildWorld(S.stop); placeCameraAt(S.stop);
  }

  // ---------- strip UI ----------
  // v11 (Magnus: "absolute destruction of unnecessary small texts"): the strip only holds the big carved sum, a few
  // LARGE key options and one icon status row. Every line of dialogue is a speech bubble above its speaker.
  const panel = $("panel");
  function showPanel(html, cls) { panel.className = "panel " + (cls || ""); panel.innerHTML = html; fitSums(); }
  // v11b-4: big sums are never cut. Shrink the font until problem + answer (+ glyph height) fit inside the strip with a margin.
  function fitSums() {
    panel.querySelectorAll(".mathp .sum").forEach(sum => {
      sum.style.fontSize = ""; const base = parseFloat(getComputedStyle(sum).fontSize) || 104;
      const pr = panel.getBoundingClientRect(), k = pr.width / (panel.offsetWidth || pr.width || 1), M = 24 * k;
      for (let fs = base; fs >= 40; fs -= 4) {
        sum.style.fontSize = fs + "px"; let ok = true;
        sum.querySelectorAll(".problem, .answer, .glyph").forEach(el => { const r = el.getBoundingClientRect();
          if (r.left < pr.left + M || r.right > pr.right - M || r.top < pr.top + 4 * k || r.bottom > pr.bottom - 4 * k) ok = false; });
        if (ok) break;
      }
      // v12b: Magnus's engraved glyphs have their native size set inline, so font-size alone cannot shrink them. If the
      // sum still sticks out, scale the whole sum (problem + answer) down uniformly and centre it: no digit is ever cut.
      sum.style.transform = ""; const els = [...sum.querySelectorAll(".problem, .answer, .glyph")]; if (!els.length) return;
      const rs = els.map(el => el.getBoundingClientRect()), U = { l: Math.min(...rs.map(r => r.left)), r: Math.max(...rs.map(r => r.right)), t: Math.min(...rs.map(r => r.top)), b: Math.max(...rs.map(r => r.bottom)) };
      const sc = Math.min(1, (pr.width - 2 * M) / (U.r - U.l), (pr.height - 8 * k) / (U.b - U.t)); if (sc >= 1) return;
      const sr = sum.getBoundingClientRect(), tl = pr.left + (pr.width - (U.r - U.l) * sc) / 2, tt = U.t + (U.b - U.t) * (1 - sc) / 2;
      sum.style.transformOrigin = "0 0";
      sum.style.transform = `translate(${(tl - sr.left - (U.l - sr.left) * sc) / k}px, ${(tt - sr.top - (U.t - sr.top) * sc) / k}px) scale(${sc})`;
    });
  }
  new MutationObserver(() => { if (!fitSums.busy) { fitSums.busy = true; fitSums(); fitSums.busy = false; } }).observe(panel, { childList: true, subtree: true, characterData: true });
  // a large option (same plaque)
  const big = (key, label, act, attrs = "", off = false) => opt(key, label, act, attrs, off);
  // ---- v11b battle move buttons (Magnus's mockup + "more fun buttons"): ink-drawn swallow-tail banners in the parchment
  // style; a red wax seal with the key, a little ink icon, the name. No sub-lines. Stand-in vector art (MISSING_ART #38).
  const INK = 'stroke="#2a1d12" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
  // Spell of Stupidity stand-in icon (until Magnus's sprite; his reference: incoming/magnus_art/reference_scroll_stall.png):
  // a rolled parchment scroll tied with a dirty-orange ribbon and a red wax seal, ink outlines
  const INKW = w => `stroke="#2a1d12" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const SCROLL_SVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M7 13 H33 V29 H7Z" fill="#efe0c0" ${INKW(2.2)}/><ellipse cx="7" cy="21" rx="4" ry="8" fill="#e2cfa6" ${INKW(2.2)}/><ellipse cx="33" cy="21" rx="4" ry="8" fill="#efe0c0" ${INKW(2.2)}/><ellipse cx="33" cy="21" rx="1.6" ry="3.4" fill="none" ${INKW(1.6)}/><path d="M11 17 H29 M11 25 H27" stroke="#2a1d12" stroke-width="1.2" opacity=".45"/><path d="M17 13 H23 V29 H17Z" fill="#d16f19" ${INKW(2)}/><path d="M18 29 L14 37 L17.5 35.5 L19 38 Z M22 29 L26 37 L22.5 35.5 L21 38 Z" fill="#d16f19" ${INKW(1.8)}/><circle cx="20" cy="21" r="4.2" fill="#a8321f" ${INKW(2)}/></svg>`;
  // v11b: Magnus's painted Spell of Stupidity icon (KM_ART11.spellIcon) everywhere the spell shows; SCROLL_SVG = fallback only
  const SPELL_SRC = window.KM_ART11 && KM_ART11.spellIcon ? KM_ART11.root + KM_ART11.spellIcon.img : "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SCROLL_SVG);
  const spellIcon = cls => `<img class="spellicon ${cls || ""}" src="${SPELL_SRC}" alt="">`;
  const scrollImg = new Image(); scrollImg.src = SPELL_SRC;
  const MICON = {
    weak: `<svg viewBox="0 0 40 40"><path d="M8 32 L28 12" ${INK}/><path d="M26 8 l6 6 -3 1 -4 -4z" fill="#efe0c0" ${INK}/><path d="M6 28 l6 6" ${INK}/></svg>`,
    hard: `<svg viewBox="0 0 40 40"><path d="M8 32 L28 12" ${INKW(5)}/><path d="M6 28 l6 6" ${INK}/><path d="M30 4 l1 6 5 -3 -3 5 6 1 -6 2 3 5 -5 -3 -1 6" fill="#d16f19" ${INKW(2)}/></svg>`,
    heal: `<svg viewBox="0 0 40 40"><path d="M20 34 C4 24 4 8 13 8 C17 8 19 11 20 14 C21 11 23 8 27 8 C36 8 36 24 20 34Z" fill="#b3321f" ${INK}/></svg>`,
    get spell() { return spellIcon("btn"); },
    roll: `<svg viewBox="0 0 40 40"><rect x="7" y="7" width="26" height="26" rx="5" fill="#efe0c0" ${INK}/><circle cx="14" cy="14" r="2.6" fill="#2a1d12"/><circle cx="20" cy="20" r="2.6" fill="#2a1d12"/><circle cx="26" cy="26" r="2.6" fill="#2a1d12"/></svg>`,
    mead: `<svg viewBox="0 0 40 40"><path d="M9 11 H27 V33 Q18 36 9 33Z" fill="#c98a2b" ${INK}/><path d="M9 11 Q12 5 18 8 Q24 4 27 11" fill="#efe0c0" ${INK}/><path d="M27 15 Q35 15 35 22 Q35 29 27 29" fill="none" ${INKW(3)}/></svg>`,
    stew: `<svg viewBox="0 0 40 40"><path d="M5 19 H35 Q34 33 20 34 Q6 33 5 19Z" fill="#8a5a2b" ${INK}/><path d="M12 14 q2 -4 0 -8 M20 14 q2 -4 0 -8 M28 14 q2 -4 0 -8" fill="none" ${INKW(2)}/></svg>`,
    fire: `<img class="itemicon" src="${IT.art.dir + IT.art.icon}" alt="">`, // v12k Maggi's fire bottle stamp
    sacrifice: `<svg viewBox="0 0 40 40"><path d="M10 6 H30 V22 C30 30 20 35 20 35 C20 35 10 30 10 22Z" fill="#efe0c0" ${INK}/><path d="M20 10 V30 M13 17 H27" ${INK}/></svg>`
  };
  // v12q: strip buttons wear Maggi's ornamented ink frame (CSS border-image from KM_UI.frame, src/config/ui_frames.js);
  // the old SVG banner is gone. BANNER stays as the one hook in every button template (empty now).
  const BANNER = "";
  if (window.KM_UI && KM_UI.frame) { const F = KM_UI.frame, st = document.documentElement.style, u = f => `url("${F.root + f}")`;
    st.setProperty("--bf-n", u(F.normal)); st.setProperty("--bf-h", u(F.hover)); st.setProperty("--bf-d", u(F.disabled));
    st.setProperty("--bf-sv", F.slice[0]); st.setProperty("--bf-sh", F.slice[1]); st.setProperty("--bf-bv", F.border[0] / F.h); st.setProperty("--bf-bh", F.border[1] / F.h);
    [F.normal, F.hover, F.disabled].forEach(f => { const im = new Image(); im.src = F.root + f; }); } // no flash on the first hover
  // Magnus's riddle frame: ONE uniform scale (RF_S stage px per source px) for the whole frame; a 9-slice keeps both
  // corner halves intact and stretches only the ink-free middle columns to the riddle's width
  const RF = window.KM_ART11 && KM_ART11.riddleFrame, RF_H = 84, RF_S = RF ? RF_H / RF.size[1] : 0;
  if (RF) { const st = document.documentElement.style; st.setProperty("--rf-img", `url("${KM_ART11.root + RF.img}")`);
    st.setProperty("--rf-l", RF.slice[0]); st.setProperty("--rf-r", RF.slice[1]); st.setProperty("--rf-v", Math.ceil(RF.size[1] / 2));
    st.setProperty("--rf-lw", (RF.slice[0] * RF_S).toFixed(1) + "px"); st.setProperty("--rf-rw", (RF.slice[1] * RF_S).toFixed(1) + "px");
    st.setProperty("--rf-vw", (Math.ceil(RF.size[1] / 2) * RF_S).toFixed(2) + "px"); st.setProperty("--rf-h", (RF.size[1] * RF_S).toFixed(1) + "px"); }
  const move = (key, label, act, icon, attrs = "", off = false) => `<button class="opt plaque" data-act="${act}" ${attrs} ${off ? "disabled" : ""}>${BANNER}${MICON[icon] || ""}<span class="nm">${label}</span></button>`;
  // prices (rest stops): Magnus's purse, small, + the number (no coin icon, v11b)
  const coin = n => `<span class="cost">${window.KM_ART11 && KM_ART11.purse ? `<img class="purseimg mini" src="${KM_ART11.root + KM_ART11.purse.img}" alt="">` : `<i class="coin"></i>`}${n}</span>`;
  // v11b money: Magnus's painted purse (KM_ART11.purse) + the number, at the hearts' height
  const purse = n => `<span class="purse" title="gold">${window.KM_ART11 && KM_ART11.purse ? `<img class="purseimg" src="${KM_ART11.root + KM_ART11.purse.img}" alt="">` : `<i class="coin"></i>`}${n}</span>`;
  const heartsIcons = (on, max, cls) => `<span class="hearts ${cls || ""}">${Array.from({ length: max }, (_, i) => `<i class="${i < on ? "on" : ""}">♥</i>`).join("")}</span>`;
  // ---------- v11 speech: big bubbles above the speaker, long text split into short bubbles shown in turn ----------
  const SP = L.speech, speechLog = [], speakers = new Set(), speechOverflow = [];
  // v11b: lines wrap to the painted bubbles' text width (source px x artScale), so the text always fits the art
  if (window.KM_ART11) SP.maxW = Math.floor(Math.min(...Object.values(KM_ART11.bubbles).map(B => B.text[2])) * L.artScale);
  const mctx = document.createElement("canvas").getContext("2d");
  function wrap(text) {
    mctx.font = `${SP.font}px Georgia, serif`;
    const lines = []; let cur = "";
    for (const w of String(text).replace(/\s+/g, " ").trim().split(" ")) { const t = cur ? cur + " " + w : w; if (cur && mctx.measureText(t).width > SP.maxW) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  }
  function chunksOf(text) { // sentence by sentence, each wrapped to <= maxW, max SP.maxLines lines per bubble; short sentences share a bubble
    // v11b: a sentence ends at . ! ? … only when the next word starts a new sentence (capital, quote, *, digit), so
    // "the big... riddle." stays one sentence and no bubble ever starts mid-sentence
    const sents = String(text).replace(/\s+/g, " ").trim().split(/(?<=[.!?…]["”’')]?)\s+(?=["“'(*\d\p{Lu}])/u), out = [];
    for (const snt of sents.map(x => x.trim()).filter(Boolean)) {
      const ls = wrap(snt); if (ls.length > SP.maxLines && !speechOverflow.includes(snt)) speechOverflow.push(snt); // v11b: a sentence must fit ONE bubble (tests)
      for (let i = 0; i < ls.length; i += SP.maxLines) out.push(ls.slice(i, i + SP.maxLines));
    }
    const merged = [];
    for (const c of out) { const prev = merged[merged.length - 1]; if (prev && wrap(prev.concat(c).join(" ")).length <= SP.maxLines) merged[merged.length - 1] = wrap(prev.concat(c).join(" ")); else merged.push(c); }
    return merged;
  }
  const chunkSecs = c => Math.max(SP.minSecs, Math.min(SP.maxSecs, SP.minSecs * 0.4 + c.join(" ").length * SP.perChar));
  // speak(o, text, {hold}) : o = any speaker object (actor, party member, candidate, voice). hold = wait for the player
  function speak(o, text, opts) {
    if (!o || !text) return; const chunks = chunksOf(text);
    o.sp = { chunks, i: 0, t: 0, hold: !!(opts && opts.hold), keep: opts && opts.keep }; speakers.add(o); speechLog.push(String(text));
  }
  const say = (actor, text, keep) => speak(actor, text, keep && { keep });
  const heroSay = (text, keep) => speak(S.party[0], text, keep && { keep });
  const inPhase = ph => () => !!(S.enc && S.enc.phase === ph); // keep-alive predicates for questions
  const speechNow = o => (o && o.sp ? o.sp.chunks[o.sp.i] : null);
  function nextChunk(o) { if (!o || !o.sp) return false; if (o.sp.i < o.sp.chunks.length - 1) { o.sp.i++; o.sp.t = 0; return true; } return false; }
  function tickSpeech(dt) {
    for (const o of speakers) {
      const sp = o.sp; if (!sp) { speakers.delete(o); continue; }
      sp.t += dt; if (sp.hold) continue;
      if (sp.i === sp.chunks.length - 1 && sp.keep && sp.keep()) continue; // a question stays up while its choice is open
      if (sp.t >= chunkSecs(sp.chunks[sp.i])) { sp.i++; sp.t = 0; if (sp.i >= sp.chunks.length) { o.sp = null; speakers.delete(o); } }
    }
  }
  function hush() { for (const o of speakers) o.sp = null; speakers.clear(); }
  // off-art speakers (bartender, Old Wally): a bubble whose tail points at their place in the painted scene
  function voice(id, text, x, y) { let v = S.voices.find(q => q.id === id); if (!v) S.voices.push(v = { id, x, y }); v.x = x; v.y = y; speak(v, text); }
  // opaque standing height above the feet (tools/measure_feet.js KM_TALL), layout units; damage numbers start on the head
  const tallOf = id => (window.KM_TALL && KM_TALL[id]) || KM.Assets.entityHeight(id);
  function float(text, x, y, color) { S.floats.push({ text, x, y, t: 0, color: color || "#fff" }); }
  function hearts(n) { S.hp = Math.max(0, Math.min(maxHp(), S.hp + n)); }
  const screenX = wx => wx - S.camX; // world -> view x (scene px)
  // one icon status row: hearts, gold, hunters track, journey distance (no words)
  let hudCache = "";
  const SKULL = `<svg class="skull" viewBox="0 0 32 32" aria-label="hunters"><path d="M16 3c-7 0-11 4.6-11 10.4 0 3.6 1.7 6 4 7.4V25h3v-2.4h1.6V25h4.8v-2.4H20V25h3v-4.2c2.3-1.4 4-3.8 4-7.4C27 7.6 23 3 16 3z" fill="#efe0c0" stroke="#2a1d12" stroke-width="2.2" stroke-linejoin="round"/><path d="M8.6 13.6c1-2.2 4.4-2.4 5.4-.4.7 1.6-.6 3.6-2.6 3.6-2.2 0-3.4-1.6-2.8-3.2zM23.4 13.6c-1-2.2-4.4-2.4-5.4-.4-.7 1.6.6 3.6 2.6 3.6 2.2 0 3.4-1.6 2.8-3.2zM16 17.2l-1.8 3h3.6z" fill="#2a1d12"/><path d="M11 28.5h10" stroke="#2a1d12" stroke-width="2"/></svg>`;
  const HELM = `<svg class="helm" viewBox="0 0 32 32" aria-label="you"><path d="M6 29V12C6 6.5 10.5 3 16 3s10 3.5 10 9v17z" fill="#efe0c0" stroke="#2a1d12" stroke-width="2.2" stroke-linejoin="round"/><path d="M7 14.5h18" stroke="#2a1d12" stroke-width="3.2"/><path d="M16 18v9M12.5 22.5h7" stroke="#d16f19" stroke-width="2.6"/><path d="M9 20.5h2M9 24h2M21 20.5h2M21 24h2" stroke="#2a1d12" stroke-width="1.6"/></svg>`;
  function renderHUD() {
    const ms = MU.settings(), mute = ms.muted ? `<span class="muted" title="music off (M)">♪</span>` : "";
    let h = mute;
    if (S.mode !== "title" && S.mode !== "intro" && S.mode !== "name") {
      const n = C.hunters.blocks, hc = Math.min(S.hunters, n);
      // v11b hunter meter (Magnus): dirty-orange dots joined by thin ink lines; a skull (the hunters) sits on the dot it
      // has reached and moves one dot per failed sum; a helmet (you) at the end. Stand-in ink icons (MISSING_ART #18).
      const track = `<span class="hunt" data-hunters="${hc}" title="the King's hunters">${Array.from({ length: n }, (_, i) => (i ? "<s></s>" : "") + (i === hc ? SKULL : i < hc ? '<b class="p"></b>' : "<b></b>")).join("")}<s></s>${hc >= n ? SKULL : ""}${HELM}</span>`;
      // Magnus: "either you have a spell or you don't": just the icon while you hold a scroll, nothing at 0 (no key badge, no count)
      // v11b (mockup): purse + number under the party hearts (top left), the meter top centre, distance top right.
      // The spell shows as the "Stupidity" move while you hold a scroll and as the rolled-scroll countdown while active.
      const ph = partyHeartsRect();
      h = `<span class="purse-at" style="top:${(ph ? ph.y + ph.h : 50) + 10}px">${purse(S.gold)}</span>${track}<span class="dist" title="leagues travelled"><i class="mile">⚐</i>${leagues()}</span>${mute}`;
    }
    if (h !== hudCache) { $("hud").innerHTML = h; hudCache = h; }
  }
  function renderWalk() {
    if (S.mode !== "walk") return;
    showPanel(`<div class="center walkp"></div>`, "walk"); // the road: nothing in the strip but the status row
  }
  // ---------- title / intro ----------
  function showTitle() {
    S.mode = "title"; MU.setScene("title"); hush();
    const sv = KM.Save.load();
    S.party = [newMember("hero", slotX(0))]; buildWorld(0); S.camX = 0; addNarrator();
    showPanel(`<div class="center titlep"><h1>Medieval Math</h1>
      <div class="opts">${sv ? big("Enter", "Continue", "continue", 'id="continueBtn"') + big("N", "New game", "newGame", 'id="newGameBtn"') : big("Enter", "New game", "newGame", 'id="newGameBtn"')}</div></div>`, "title");
  }
  function startRunBookkeeping() { const b = KM.Save.best(); S.bestAtStart = b ? b.leagues : 0; S.toast = null; }
  function newGame() {
    KM.Save.clear(); hush();
    S.name = "Nobody"; S.hp = D.party.heartsPerMember; S.gold = 0; S.stop = 0; S.dist = 0; S.fid = 0; S.hunters = 0; S.spells = SPL.start; S.spellLeft = 0; S.mead = 0; S.bottles = IT.start; S.runId = "run-" + Date.now(); S.fgSeed = seedOf(S.runId);
    S.stats = { correct: 0, wrong: 0, riddles: 0, sacrificed: 0 }; S.usedRiddles = [];
    S.party = [newMember("hero", slotX(0))]; buildWorld(0); S.camX = 0; addNarrator(); S.floats = []; S.dice = []; S.enc = null; S.timers = []; S.view = null; S.dying = null; S.entering = null; S.voices = [];
    S.furtherDone = false; startRunBookkeeping();
    S.mode = "intro"; MU.setScene("intro"); S.intro = { lines: D.dialogue.intro.map(A.text), vos: D.dialogue.intro.map(A.voOf), i: 0, after: null };
    renderIntro(); lineVO();
  }
  function continueGame() {
    const sv = KM.Save.load(); if (!sv) return newGame();
    hush(); S.checkpoint = sv.checkpoint; applyCore(sv); startRunBookkeeping(); S.mode = "walk"; MU.setScene("walk"); renderWalk();
  }
  const narrator = () => S.actors.find(a => a.narrator && !a.dead);
  // the intro: the narrator's (Magnus's skeleton on his rock) lines are bubbles; Space shows the next bubble / line, Esc skips
  function renderIntro() {
    if (S.mode === "name") {
      speak(narrator(), A.text(D.dialogue.namePrompt), { hold: true });
      showPanel(`<div class="center dlg"><div class="namerow"><input id="nameInput" maxlength="16" placeholder="your name" autocomplete="off" spellcheck="false">${big("Enter", "OK", "submitName", 'id="nameOk"')}</div></div>`, "dialog");
      setTimeout(() => { const i = $("nameInput"); if (i) i.focus(); }, 30);
      return;
    }
    speak(narrator(), S.intro.lines[S.intro.i] || "", { hold: true });
    showPanel(`<div class="center dlg"><div class="opts">${big("Space", "Next", "nextLine")}${S.intro.after === "go" ? "" : big("Esc", "Skip", "skipIntro", 'id="skipBtn"')}</div></div>`, "dialog");
  }
  function advanceIntro(auto, wholeLine) {
    const it = S.intro; if (!it || S.mode !== "intro") return;
    if (!auto) A.play("ui_click");
    if (!wholeLine && nextChunk(narrator())) return; // more of this line (Space); a finished clip moves on to the next LINE
    it.i++;
    if (it.i >= it.lines.length) {
      if (it.after === "go") return startJourney();
      S.mode = "name"; A.voice(A.voOf(D.dialogue.namePrompt)); return renderIntro();
    }
    renderIntro(); lineVO();
  }
  function skipIntro() { if (S.mode !== "intro" || (S.intro && S.intro.after === "go")) return advanceIntro(); S.mode = "name"; A.voice(A.voOf(D.dialogue.namePrompt)); renderIntro(); }
  function lineVO() { const it = S.intro; if (!it || !it.vos) return; const i = it.i, id = it.vos[i];
    // the bubble waits for the recorded line to finish (then moves on by itself after a breath) or for a keypress;
    // a missing file is silent and the bubble just waits for the key (src/engine/audio.js tries assets/audio/vo/<id>.ogg, then incoming/vo_narrator/)
    // v12c: with a recording, the line's bubble chunks are paced across the clip (by character share, introPace) and the
    // next line comes 0.6 s after the clip ends. Space during a clip still advances (and stops it when the line changes).
    it.clip = null;
    A.voice(id, { onStart: el => { if (S.intro === it && it.i === i) it.clip = { i, el }; },
      onEnd: () => { if (it.clip && it.clip.i === i) it.clip.done = true; later(0.6, () => { if (S.intro === it && it.i === i && S.mode === "intro") advanceIntro(true, true); }); } }); }
  function introPace() {
    const it = S.intro, c = it && it.clip, n = narrator(); if (S.mode !== "intro" || !c || c.i !== it.i || !n || !n.sp) return;
    const sp = n.sp, el = c.el, dur = el.duration; if (!(dur > 0) || !isFinite(dur) || sp.chunks.length < 2) return;
    const frac = c.done ? 1 : el.currentTime / dur, lens = sp.chunks.map(ch => ch.join(" ").length), tot = lens.reduce((a, b) => a + b, 0);
    let cum = 0, want = 0; for (let k = 0; k < lens.length - 1; k++) { cum += lens[k]; if (frac >= cum / tot) want = k + 1; }
    if (want > sp.i) { sp.i = want; sp.t = 0; }
  }
  function submitName() {
    const inp = $("nameInput"); const v = (inp ? inp.value : "").trim().slice(0, 16) || "Nobody";
    S.name = v.replace(/^sir\s+/i, ""); if (inp) inp.blur();
    S.mode = "intro"; S.intro = { lines: [A.text(D.dialogue.afterName).replace(/\{name\}/g, S.name)], vos: [A.voOf(D.dialogue.afterName)], i: 0, after: "go" };
    renderIntro(); lineVO();
  }
  function startJourney() {
    S.intro = null;
    const nar = narrator(); if (nar) { nar.sp = null; nar.quiet = true; } // v12g (Magnus): he stays on his rock; the party walks past him
    setCheckpoint(); S.mode = "walk"; MU.setScene("walk"); renderWalk();
  }

  // ---------- walking ----------
  function updateWalk(dt) {
    if (S.stop >= S.stops.length) { S.camX += W.walkSpeed * dt; S.dist += W.walkSpeed * dt; S.winT += dt; if (S.winT > 2.5) showWin(); return; }
    if (S.respect) { S.respect.t += dt; if (S.respect.t >= GR.respectsSecs) { S.respect.g.done = true; S.respect = null; renderWalk(); } return; }
    const st = S.stops[S.stop], act = S.actors.find(a => a.stop === S.stop && a.main);
    let halt = haltCam(st);
    // graves: halt in front of the next one we have not passed yet (ones behind us, e.g. after a load, are skipped)
    S.graves.forEach(g => { if (!g.done && S.camX > g.cam + 1) g.done = true; });
    const g = S.graves.find(g => !g.done && g.cam <= halt);
    if (g && S.camX >= g.cam) return startRespects(g);
    if (act && !act.active && S.camX >= halt - 900) {
      act.active = true; act.state = "walkin";
      S.actors.filter(a => a.stop === S.stop && a.extra).forEach(a => later(0.45 * a.extra, () => { a.active = true; a.state = "walkin"; })); // one after another
      if (st.type === "boss" || st.type === "mega") { heroSay("Something big blocks the road!"); A.play("boss_intro"); }
    }
    const before = S.camX;
    S.camX = Math.min(S.camX + W.walkSpeed * dt, halt, g ? g.cam : Infinity);
    S.dist += S.camX - before;
    if (!S.furtherDone && S.bestAtStart > 0 && +leagues() > S.bestAtStart) furtherThanEver();
    // footsteps synced to the hero's walk drawing: a "step" on each foot contact (frame 0 and the half-cycle frame,
    // 0 + 4 of the 8-frame v13 walk; 0 + 6 for a 12-frame walk). Fallback without a walk atlas: every 0.35 s.
    if (S.camX > before) { const sid = ((KM_ART.entities.hero || {}).seq || {}).walk, fr = sid && KM.Assets.seqFrame(sid, (S.walkT || 0) * (KM_ART.walkRate ? KM_ART.walkRate("hero") : 1));
      // companions: their own contacts, quieter, thinned to one step every 0.3 s at most (no clatter)
      S.compStepT = (S.compStepT || 0) + dt; S.stepFr = S.stepFr || {};
      S.party.forEach(m => { if (m.id === "hero") return; const id = artId(m), cs = ((KM_ART.entities[id] || {}).seq || {}).walk; if (!cs) return;
        const f = KM.Assets.seqFrame(cs, (S.walkT || 0) * (KM_ART.walkRate ? KM_ART.walkRate(id) : 1)); if (!f) return; const n = f.s.frames.length;
        if (f.i !== S.stepFr[m.id] && (f.i === 0 || f.i === n / 2) && S.compStepT >= 0.3) { A.play("step_companion"); S.compStepT = 0; } S.stepFr[m.id] = f.i; });
      if (fr) { const n = fr.s.frames.length; if (fr.i !== S.stepFrame && (fr.i === 0 || fr.i === n / 2)) A.play("step"); S.stepFrame = fr.i; }
      else { S.stepT += dt; if (S.stepT > 0.35) { S.stepT = 0; A.play("step"); } } }
    if (S.camX >= halt && (!act || act.state !== "walkin")) engage(st, act);
  }
  // once per run: scene toast (GAME_DESIGN) + narrator line in the strip + VO (chat request)
  function furtherThanEver() {
    S.furtherDone = true; S.toast = { text: GR.further.toast, t: 0, dur: GR.further.toastSecs }; // one big scene toast + VO
    A.voice(GR.further.vo);
  }
  const isWalking = () => S.mode === "walk" && !S.respect && (S.stop >= S.stops.length || S.camX < haltCam(S.stops[S.stop]));

  // ---------- action hooks (attack / hurt: painted anim slot, else procedural fallback) ----------
  function act(obj, name, dur, reach, tgt) { if (obj) { obj.act = { name, t: 0, dur: dur || 0.5, reach: reach || 0, att: tgt ? obj : null, tgt }; A.play(name); } }
  function partyAct(name, dur) { if (name === "attack") act(S.party[0], name, dur, lungeReach(S.party[0], S.enc && S.enc.act), S.enc && S.enc.act); else S.party.forEach(m => act(m, name, dur)); }
  // Darkest-Dungeon-style strike (Magnus): snap into the strike pose, lunge across to the target, a short hold on the
  // impact (hit SFX, the target's hurt frame + knockback, a small shake), slide back to the spot. 0.55 s in all.
  // Fractions of the strike: snap 0-.12 (slight wind-up back), lunge .12-.38, impact hold .38-.60, return .60-1.
  const STRIKE = { dur: 0.55, impact: 0.21 }; // impact = .38 x .55 s: when the hit lands
  function lungeReach(att, tgt) { if (!att || !tgt) return 0; // layout units the attacker travels to touch the target
    const isP = att.sx != null, hx = isP ? att.sx : screenX(att.x), tx = isP ? screenX(tgt.x) : tgt.sx;
    const aw = wideOf(isP ? artId(att) : att.id), tw = wideOf(isP ? tgt.id : artId(tgt));
    const half = w => (w[1] - w[0]) / 2; // KM_WIDE = opaque extents, layout units; stop with the drawings just overlapping
    return Math.max(160, Math.min(1100, Math.abs(tx - hx) - 0.3 * (half(aw) + half(tw)))); } // strikes INTO the target's space (Darkest Dungeon)
  function actFx(id, a, dir) {
    if (!a) return null;
    const k = Math.min(1, a.t / a.dur);
    if (KM.Assets.hasAnim(id, a.name) && a.name !== "attack") return { action: a.name, t: a.t, dx: a.name === "hurt" ? -dir * 26 * Math.sin(Math.PI * Math.min(1, k * 1.6)) : 0, dy: 0, hurt: false }; // drawn hurt frame + knockback
    if (a.name === "attack") { if (a.att && k < .38) a.reach = lungeReach(a.att, a.tgt); const R = Math.max(160, a.reach || 0), // re-aimed while closing (the target may be stepping up)
        ez = u => 1 - Math.pow(1 - u, 3), io = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      const x = k < .12 ? -14 * (k / .12) : k < .38 ? -14 + (R + 14) * ez((k - .12) / .26) : k < .6 ? R + Math.sin((k - .38) * 90) * 3 : R * (1 - io((k - .6) / .4));
      return { action: KM.Assets.hasAnim(id, "attack") ? "attack" : "idle", t: a.t, dx: x * dir, dy: 0, hurt: false }; } // feet stay on the ground
    if (a.name === "knock") return { action: "idle", t: a.t, dx: -dir * 26 * Math.sin(Math.PI * Math.min(1, k * 1.6)), dy: 0, hurt: false }; // knockback under a drawn hurt frame
    if (a.name === "respects") { const s = Math.sin(Math.PI * k); return { action: "idle", t: a.t, dx: 0, dy: 10 * s, rot: 0.1 * s, hurt: false }; } // bow
    if (a.name === "hurt") return { action: "idle", t: a.t, dx: Math.sin(a.t * 70) * 12 * (1 - k) - dir * 26 * Math.sin(Math.PI * Math.min(1, k * 1.6)), dy: 0, hurt: a.t < 0.16 }; // shake + knockback + a brief full-opacity red flash
    return { action: a.name, t: a.t, dx: 0, dy: 0, hurt: false };
  }
  // enemy hit / death: drawn sequences when the creature has them (rabbit), else hurt blink / stepped vanish (no puppet falls)
  function enemyHit(a) { const cfg = KM_ART.entities[a.id] || {}; if (cfg.seq && cfg.seq.hurt && KM.Assets.hasAnim(a.id, "hurt")) { a.seqPlay = { id: cfg.seq.hurt, t: 0 }; A.play("hurt"); act(a, "knock", 0.35); } else act(a, "hurt", 0.5); }
  function enemyDeath(a) {
    const cfg = KM_ART.entities[a.id] || {}; a.act = null;
    if (cfg.seq && cfg.seq.death && KM.Assets.hasAnim(a.id, "death")) { a.seqPlay = { id: cfg.seq.death, t: 0, hold: true }; a.state = "corpse"; }
    else { a.state = "vanish"; a.t = 0; }
    A.play("enemy_fall");
  }

  // ---------- encounters ----------
  function encounterMusic(st) {
    if (st.type === "rest") return "rest_" + st.rest;
    if (isFight(st) || st.type === "special") return (D.music.enemyScenes || {})[st.enemy] || (st.type === "math" || st.type === "special" ? "battle" : st.type);
    return st.type; // riddle, recruit
  }
  function engage(st, actr) {
    S.mode = "encounter";
    S.enc = { st, act: actr, type: st.type, phase: null, msg: "", bonus: 0 };
    switch (st.type) {
      case "math": case "boss": case "mega": approach(); break;   // music waits for the commit
      case "special": startFrank(); break;
      case "riddle": MU.setScene("riddle"); startRiddle(); break;
      case "recruit": MU.setScene("recruit"); renderRecruit(); break;
      case "rest": MU.setScene(encounterMusic(st)); startRest(); break;
    }
  }
  // ---- hidden strength: commit or avoid
  function approach() {
    const e = S.enc; e.phase = "approach";
    const can = C.avoidable[e.st.type];
    heroSay(e.st.type === "math" ? "Something lurks in the mist..." : "It blocks the whole road. No way around!", inPhase("approach"));
    showPanel(`<div class="center"><div class="opts big3">${big("Enter", "Fight", "commit")}${can ? big("A", "Avoid", "avoid") : ""}</div></div>`, "info");
  }
  function commit() {
    const e = S.enc; if (!e || (e.phase !== "approach" && e.phase !== "frank")) return;
    const id = e.act.id, E = D.enemies[id] || {}, cs = C.enemies[id] || { hp: 6, atk: 1 };
    e.phase = "busy"; e.hp = e.maxHp = cs.hp; e.atk = cs.atk; e.heals = C.healsPerFight; e.revealed = true;
    // every foe of this stop (a group = several), each with its own hearts; e.act / e.hp mirror the FRONT one
    e.foes = S.actors.filter(a => a.stop === S.stop && a.foe && !a.dead).sort((a, b) => a.x - b.x);
    e.foes.forEach(a => { const c2 = C.enemies[a.id] || { hp: 6, atk: 1 }; a.hp = a.maxHp = c2.hp; a.atk = c2.atk; if (a !== e.act) { a.distant = false; a.closing = { t: 0, dur: 0.7 }; } });
    e.act.hp = e.hp; e.act.maxHp = e.maxHp; e.act.atk = e.atk;
    if (S.mead === 1) { S.mead = 2; e.mead = true; renderHUD(); } // v11b tavern mead: THIS battle's sums are all stupid
    if ((KM_ART.entities[id] || {}).onHill && S.swaps) Object.values(S.swaps).forEach(q => (q.on = false)); // v19: it comes down from its hill
    e.act.distant = false; e.act.closing = { t: 0, dur: 0.7 }; (e.foes || [e.act]).forEach(a => { if (a.state === "walkin" || a.state === "waiting") { a.state = "idle"; a.active = true; a.x = a.homeX != null ? a.homeX : e.st.stopX; } });
    if (e.st.type === "special") e.act.x = e.st.stopX + 260;
    MU.setScene(encounterMusic(e.st));
    if (e.st.type === "mega") A.play("dragon_roar");
    say(e.act, E.taunt);
    later(0.75, () => renderChoice());
  }
  function avoid() {
    const e = S.enc; if (!e || e.phase !== "approach") return;
    e.phase = "busy"; e.act.state = "stay";
    huntersStep(C.hunters.avoidCost);
    if (S.dying) return;
    heroSay("Whatever that was, we'll never know.");
    finishEncounter();
  }
  // ---- turn combat
  function renderChoice() {
    const e = S.enc; if (!e || S.dying) return; e.phase = "choose";
    const mega = e.st.type === "mega", need = needRoll();
    const sac = knights().length ? move("S", "Sacrifice", "sacrifice", "sacrifice") : "";
    const rollOpt = mega ? move("R", need <= 1 ? "Roll any" : need > 20 ? "Roll –" : `Roll ${need}+`, "roll", "roll", "", need > 20) : "";
    // v11b layout (Magnus's mockup): a big centred prompt, then the moves in one row; Heal greys out when unavailable;
    // the Stupidity spell sits after an ink divider and only exists while you hold a scroll (no count, no caption)
    const spellBtn = S.spells > 0 && !S.spellLeft && !meadNow() ? `<i class="vdiv"></i>${move(SPL.key, "Stupidity", "castSpell", "spell")}` : "";
    const fireBtn = S.bottles > 0 ? move(IT.key, IT.name, "pickFire", "fire") : ""; // v12k: only while you carry one
    showPanel(`<div class="center fightp"><div class="prompt">Choose your move.</div>
      <div class="opts big3 turn moves">
        ${move(C.actions.weak.key, "Weak swing", "pickWeak", "weak")}${move(C.actions.hard.key, "Hard swing", "pickHard", "hard")}${move(C.actions.heal.key, "Heal", "pickHeal", "heal", "", e.heals <= 0 || S.hp >= maxHp())}${fireBtn}${rollOpt}${sac}${spellBtn}
      </div></div>`, "fight");
  }
  function pickAction(kind) {
    const e = S.enc; if (!e || e.phase !== "choose") return;
    if (kind === "heal" && (e.heals <= 0 || S.hp >= maxHp())) return;
    const a = C.actions[kind]; let level = kind === "heal" ? pickOne(a.levels) : a.level;
    { const si = S.stops.indexOf(e.st), nth = S.stops.slice(0, si < 0 ? 0 : si).filter(q => q.type === "math").length; // v12h: first fights simpler
      if (e.st && e.st.type === "math" && nth < (C.starterFights || 0) && D.mathLevels["starter_" + level]) level = "starter_" + level; }
    e.action = kind; e.msg = "";
    ask(level, () => turnRight(kind), () => turnWrong(kind), () => renderChoice());
    if (C.answerSecs > 0 && !NOTIMER) e.tmr = { t: 0, q: e.q, secs: C.answerSecs }; // v12c: battle sums only (not riddles, recruits, Frank)
  }
  // ---- v12c answer timer (Magnus: "This bar down here, lets try turning that into a timer for the answers. If you don't
  // answer before it is full, the enemies will strike and not wait. Then it resets. If you answer it will reset for the
  // next math problem. Give the player 20 sec to think."). Runs only while a battle sum waits for input; paused during
  // strikes, deaths, the scene toast, a sacrifice prompt, enemies walking up. Full = exactly a wrong answer.
  const NOTIMER = /[?&]notimer\b/.test(location.search);
  let tmrHold = 0;
  function tickAnswerTimer(dt) {
    const e = S.enc, T = e && e.tmr;
    if (!T || !["math", "spell"].includes(e.phase) || e.q !== T.q || S.mode !== "encounter") { if (e && T && e.q !== T.q) e.tmr = null; tmrHold = Math.max(0, tmrHold - dt); return dividerFill(tmrHold > 0 ? 1 : 0); }
    const foes = e.foes || [e.act];
    const paused = S.dying || S.toast || S.view || e.sub || S.party.some(m => m.act || m.dying) || foes.some(a => a && (a.act || a.state === "walkin"));
    if (!paused) T.t += dt;
    const secs = T.secs || C.answerSecs, left = secs - T.t; // v12k: the fire bottle's word has its own (shorter) time
    if (left > 0 && left <= (C.answerTickLast || 0) && Math.ceil(left) !== T.tick) { T.tick = Math.ceil(left); A.play(C.answerTickSfx || "type_blip"); } // subtle tick, existing SFX hook
    dividerFill(Math.min(1, T.t / secs));
    if (T.t >= secs) { // time's up: the same path as a wrong answer (wrong SFX, hunters +1, corrected sum, every living foe strikes)
      const q = e.q; e.q = null; e.tmr = null; e.phase = "busy"; e.timedOut = (e.timedOut || 0) + 1; tmrHold = 1.2;
      S.stats.wrong++; S.stats.timeouts = (S.stats.timeouts || 0) + 1; A.play(q.sfx || "wrong"); q.onWrong();
    }
  }
  // the warm fill: an orange-tinted copy of Magnus's divider ink, revealed from the centre ornament out to both ends
  let dvFillFrac = -1;
  function dividerFill(f) {
    const c = document.getElementById("dvfill"); if (!c) return; f = Math.max(0, Math.min(1, f)); if (Math.abs(f - dvFillFrac) < 0.0005) return; dvFillFrac = f;
    const DV = KM_ART11.divider, ox = DV.ornament[0] / DV.size[0], h = DVORN / DV.size[0];
    if (f <= 0) { c.style.opacity = "0"; return; }
    const l = (ox - h) * (1 - f), r = (1 - ox - h) * (1 - f);
    c.style.opacity = "1"; c.style.clipPath = `inset(0 ${(r * 100).toFixed(3)}% 0 ${(l * 100).toFixed(3)}%)`;
  }
  const DVORN = 26, DVORANGE = "#c0682a"; // ornament half-width (source px, measured: ink gap at +-24) / the ornament's own orange
  // hit sound: the boss hit in boss / mega fights, else by the monster's material (enemies.js): flesh or armour
  const hitSfx = e => (["boss", "mega"].includes(e.st.type) ? "hit_boss" : (D.enemies[e.act.id] || {}).material === "armour" ? "hit_armour" : "hit_flesh");
  function turnRight(kind) {
    const e = S.enc;
    if (kind === "heal") { e.heals--; const hb = S.hp; hearts(C.healHearts); e.lost = Math.max(0, (e.lost || 0) - (S.hp - hb)); /* healed hearts are not "lost" */ A.play("heal"); float(`+${C.healHearts} ♥`, slotX(0), W.groundY - tallOf("hero") + 70, "#9be28a"); return later(0.6, enemyTurn); }
    const dmg = kind === "hard" ? hardDmg() : weakDmg();
    // sound hooks: the swing at the wind-up, the hit on the impact pose (0.18 s), per attack kind
    partyAct("attack", STRIKE.dur); A.play("swing_" + kind); A.play("hit");
    // the sword hits the 2 front-most living foes (combat.groups.swordHits), each takes the full damage
    const tg = living(e).slice(0, GRP().swordHits || 2);
    later(STRIKE.impact, () => hitFoes(e, tg, dmg));
    later(STRIKE.dur, () => settleHits(e, tg));
  }
  // a party hit lands on the foes tg (sword or fire): hit flash, damage, the damage number over each
  function hitFoes(e, tg, dmg) {
    S.shake = 0.18; A.play(hitSfx(e));
    tg.forEach(a => { enemyHit(a); a.hp = Math.max(0, a.hp - dmg); float(`−${dmg}`, centreX(a), W.groundY - tallOf(a.id) + 70, "#ffe680"); }); syncFront(e);
  }
  // after a party hit: the dead fall (all dead = the fight is won), the rest close up, then the enemies' turn
  function settleHits(e, tg) {
    if (!living(e).length) { e.act = tg[tg.length - 1]; e.hp = 0; tg.slice(0, -1).forEach(a => { if (!a.gone) { a.gone = true; enemyDeath(a); } }); return defeatEnemy(); }
    tg.filter(a => a.hp <= 0 && !a.gone).forEach(a => { a.gone = true; say(a, (D.enemies[a.id] || {}).defeat); enemyDeath(a); });
    stepUp(e); syncFront(e); later(tg.some(a => a.hp <= 0) ? 1.0 : 0.5, enemyTurn);
  }
  const centreX = a => screenX(a.x) + ((window.KM_WIDE && KM_WIDE[a.id]) ? (KM_WIDE[a.id][0] + KM_WIDE[a.id][1]) / 2 : 0); // a foe's body centre on screen

  // ---- v12k fire bottle (Magnus): a move while you carry one. Spell the word before the divider fills: fire on EVERY
  // living foe (one weak-swing hit each). Too slow: it fizzles (used up, no damage) and the foes strike as usual.
  // The word challenge is KM.Spelling (src/modes/spelling.js), the drawings KM.FireFx (src/engine/firefx.js), numbers in
  // KM_DATA.items.fireBottle / KM_DATA.words.
  function pickFire() {
    const e = S.enc; if (!e || e.phase !== "choose" || S.bottles <= 0) return;
    S.bottles--; save(); e.action = "fire"; e.msg = ""; e.phase = "spell";
    e.spell = KM.Spelling.start(KM.Spelling.pickWord(D.words[IT.words]));
    e.q = { onWrong: fireFizzle, sfx: IT.sfx.fizzle }; // the timer's "too slow" path
    if (IT.spellSecs > 0 && !NOTIMER) e.tmr = { t: 0, q: e.q, secs: IT.spellSecs };
    heroSay(pickOne(IT.lines.light)); renderSpell();
  }
  const renderSpell = cls => showPanel(`<div class="center spellp">${KM.Spelling.drawWord(S.enc.spell, cls)}</div>`, "math");
  function spellKey(k) {
    const e = S.enc; if (!e || e.phase !== "spell" || e.sub) return;
    const r = KM.Spelling.key(e.spell, k); if (!r) return;
    A.play(r === "bad" ? IT.sfx.letterBad : IT.sfx.letterOk); renderSpell();
    if (r === "done") { e.q = null; e.tmr = null; e.phase = "busy"; S.stats.correct++; fireThrow(); }
  }
  function fireThrow() {
    const e = S.enc, tg = living(e), dmg = IT.damage === "hard" ? hardDmg() : weakDmg();
    heroSay(pickOne(IT.lines.throw)); A.play(IT.sfx.throw);
    const hitAt = KM.FireFx.start({ from: { x: slotX(0) + 80, y: W.groundY - tallOf("hero") * 0.6 }, targets: tg.map(a => ({ x: centreX(a), y: W.groundY })) });
    later(hitAt, () => hitFoes(e, tg, dmg));
    later(hitAt + 0.6, () => settleHits(e, tg));
  }
  function fireFizzle() {
    renderSpell("fizzled"); heroSay(pickOne(IT.lines.fizzle));
    if (IT.hunters) huntersStep(IT.hunters);
    if (!S.dying) later(0.6, enemyTurn);
  }
  function buyBottle() {
    const e = S.enc; if (!e || !IT.sellAt.includes(e.st.rest)) return;
    if (S.bottles >= IT.max) return keeperSay(IT.lines.full);
    if (S.gold < IT.price) return;
    S.gold -= IT.price; S.bottles++; A.play("buy"); save(); keeperSay(pickOne(IT.lines.buy)); renderHUD(); renderRest();
  }
  const living = e => (e.foes || [e.act]).filter(a => (a.hp == null ? e.hp : a.hp) > 0 && !a.gone).sort((a, b) => a.x - b.x);
  function syncFront(e) { const L1 = living(e); if (!e.foes) return; if (L1.length) { e.act = L1[0]; e.hp = e.act.hp; e.maxHp = e.act.maxHp; e.atk = e.act.atk; } else e.hp = 0; }
  // the survivors close up: the next one steps into the front slot (and so on down the row)
  function stepUp(e) { if (!e.foes || e.foes.length < 2) return; const L1 = living(e); if (!L1.length) return;
    const xs = rowSlots(e.st, L1.map(a => a.id)); L1.forEach((a, k) => { if (Math.abs(a.x - xs[k]) > 1) { a.homeX = xs[k]; a.state = "walkin"; } }); }
  function turnWrong(kind) {
    const e = S.enc;
    say(e.act, `${pickOne(D.dialogue.wrong)} It's ${e.problem.answer}!`);
    showCorrected(e.problem);   // the sum stays the focus: shown again, carved, with the right answer
    huntersStep(1);
    if (!S.dying) later(0.6, enemyTurn);
  }
  const showCorrected = pr => showPanel(`<div class="center mathp"><div class="sum corr"><span class="problem">${G(pr.text + " =")}<span class="answer">${G(String(pr.answer))}</span></span></div></div>`, "math");
  // v11b (Magnus: "the important part is that the question is centered"): the question (e.g. "7 + 5 =") is centred on
  // the screen; the answer hangs off its right edge (absolutely placed), so typing never shifts the question
  // a surviving enemy acts after the player's action (never a duplicate penalty for the wrong answer itself)
  function enemyTurn() {
    const e = S.enc; if (!e || S.dying || e.hp <= 0) return;
    const foes = living(e); // every living foe takes its turn (front first), one after another
    foes.forEach((f, k) => later(0.55 * k, () => { if (!S.enc || S.dying) return; foeStrike(e, f, k === foes.length - 1); }));
  }
  function foeStrike(e, f, last) {
    act(f, "attack", STRIKE.dur, lungeReach(f, S.party[0]), S.party[0]); A.play("swing_enemy");
    let atk = f.atk != null ? f.atk : e.atk; // TEMP_BALANCE: each armour level gives a small chance to turn a hit aside (armour no longer adds hearts)
    if (Math.random() < Math.min(C.armourBlockMax, C.armourBlockPer * S.party.reduce((s, m) => s + m.armor, 0))) atk = 0;
    later(STRIKE.impact, () => { S.shake = 0.25;
      A.play(!atk ? "hit_blocked" : ["boss", "mega"].includes(e.st.type) ? "hit_boss" : "hit_party");
      if (!atk) { partyAct("hurt", 0.2); float("blocked!", slotX(0), W.groundY - tallOf("hero") + 70, "#fff"); return; }
      partyAct("hurt", 0.5); hearts(-atk); e.lost = (e.lost || 0) + atk; float(`−${atk} ♥`, slotX(0), W.groundY - tallOf("hero") + 70, "#ff6b6b");
    });
    if (last) later(0.5, () => afterHits(f.id, () => renderChoice()));
  }
  // every HPM hearts lost in this battle = one member dies (last companion first); no hearts left = everyone, hero last
  function afterHits(killer, then) {
    const e = S.enc; if (!e) return then();
    let deaths = 0; while (e.lost >= HPM()) { e.lost -= HPM(); deaths++; }
    if (S.hp <= 0) deaths = S.party.length;
    if (!deaths) return then();
    e.phase = "busy"; dieInTurn(deaths, killer, then);
  }
  function dieInTurn(n, killer, then) {
    if (!n) return then();
    const comps = S.party.filter(m => m.id !== "hero");
    if (!comps.length) return heroDies(killer);           // the main character always dies last
    memberDies(comps[comps.length - 1], () => dieInTurn(n - 1, killer, then), killer);
  }
  // a companion dies horribly: the approved drawn knight death (stand-in for the missing per-skin deaths, MISSING_ART #7),
  // held, then they leave the roster (power + max hearts recalculated). Hooks: sfx "member_death", VO "vo_member_dies".
  // v19: each member plays ITS OWN drawn death (entity deathSeq: hero knight_death, coif death_coif; the v6/v13 companions
  // have none yet, so the hero's approved death stays their stand-in, MISSING_ART #7). Killed by a creature with a brutal
  // death (KM_ART.brutal: dragon / toad / ogre eat, rabbits tear apart, hunters' arrows) that sequence plays instead.
  function brutalDeath(m, killer) {
    const B = (KM_ART.brutal || {})[killer], ka = S.enc && S.enc.act;
    if (!B || !(KM_ART7 && KM_ART7.sequences[B.seq])) return null;
    if (B.at === "killer") { if (!ka || ka.id !== killer || ka.dead) return null; ka.act = null; ka.seqPlay = { id: B.seq, t: 0 }; m.eaten = true; A.play("bite"); later(KM.Assets.seqDur(B.seq) - 0.4, () => A.play("crunch")); }
    else m.dying.seq = B.seq;
    return KM.Assets.seqDur(B.seq);
  }
  function deathDur(m, killer) { const id = artId(m), seq = (KM_ART.entities[id] || {}).deathSeq || (KM_ART.entities.hero || {}).deathSeq; return brutalDeath(m, killer) || (seq ? KM.Assets.seqDur(seq) : 1); }
  function memberDies(m, done, killer) {
    A.play("member_death"); A.voice("vo_member_dies"); S.stats.lost = (S.stats.lost || 0) + 1;
    m.act = null; m.dying = { t: 0 };
    heroSay(pickOne([`${shortName(m.name)}! Oh no. Right. Onwards.`, `Not ${shortName(m.name)}! He owed me money.`, `${shortName(m.name)} has stopped being alive.`]));
    const dur = deathDur(m, killer);
    later(dur + 0.7, () => {
      const i = S.party.indexOf(m); if (i > 0) S.party.splice(i, 1);
      S.hp = Math.min(S.hp, maxHp()); save(); done();
    });
  }
  function defeatEnemy() {
    const e = S.enc, st = e.st, E = D.enemies[e.act.id] || {};
    e.phase = "busy"; say(e.act, E.defeat); enemyDeath(e.act);
    const g = Math.floor((st.gold || 0) * (1 + (GRP().goldPerExtra || 0) * ((e.foes || []).length - 1 > 0 ? e.foes.length - 1 : 0)) * (e.stupidUsed ? SPL.goldMul : 1)); /* TEMP_BALANCE: stupid sums pay less */ if (g) { S.gold += g; A.play("coin"); float(`+${g} gold`, screenX(e.act.x), W.groundY - tallOf(e.act.id) + 70, "#ffd84a"); }
    // v11b TEMP_BALANCE (heart rule): hearts count per battle, so the survivors patch up after a won fight
    S.hp = maxHp();
    later(0.9, finishEncounter);
  }
  function finishEncounter() { if (S.dying) return; meadEnds(); S.enc = null; S.dice = []; S.voices = []; S.stop++; save(); S.mode = "walk"; MU.setScene("walk"); renderWalk(); }

  // ---- generic maths question (combat actions, recruits, Frank)
  function ask(level, onRight, onWrong, back) {
    const e = S.enc; e.phase = "math"; e.input = "";
    const mead = meadNow(), stupid = mead || S.spellLeft > 0; // v11 Spell of Stupidity: the next N sums drop to the easiest level; v11b mead: all of this battle's sums
    e.problem = KM.MathGen.make(stupid ? SPL.level : level); e.problem.stupid = stupid; e.problem.level = stupid ? SPL.level : level;
    if (stupid) e.stupidUsed = true;
    const after = f => () => { if (e.problem.stupid && !mead) spellTick(); f(); }; // mead sums never use up a scroll
    e.q = { onRight: after(onRight), onWrong: after(onWrong), back, level }; renderMath();
  }
  // ---- v11 Spell of Stupidity: consumable, cast with Z (road / your turn / mid-sum), lasts SPL.problems sums
  function castSpell() {
    if (S.spellLeft > 0) return heroSay(SPL.already);
    if (meadNow()) return heroSay(SPL.meadAlready); // v11b: the mead already makes every sum of this battle stupid; no scroll used
    if (S.spells <= 0) return heroSay(SPL.none);
    S.spells--; S.spellLeft = SPL.problems; A.play(SPL.sfx.cast);
    const l = pickOne(SPL.cast); heroSay(A.text(l)); A.voice(A.voOf(l));
    float("✶", slotX(0), W.groundY - tallOf("hero") + 70, "#c9a4ff");
    const e = S.enc;
    if (e && e.phase === "math" && e.q && !e.input && !e.problem.stupid) { // mid-sum: the current sum turns stupid too
      e.problem = KM.MathGen.make(SPL.level); e.problem.stupid = true; e.problem.level = SPL.level; e.stupidUsed = true; renderMath(); if (e.tmr) e.tmr.t = 0; // v12c: a new sum, a fresh timer
    }
    save(); renderHUD();
  }
  // v11b tavern mead: S.mead 1 = bought, waiting for the next battle; 2 = this battle (every sum stupid); ends with the battle
  const meadNow = () => S.mead === 2 && !!(S.enc && S.enc.mead);
  function meadEnds() { if (S.mead !== 2) return; S.mead = 0; const M = D.restStops.types.tavern.mead; later(0.6, () => heroSay(M.wearOff)); A.play(SPL.sfx.wearOff); renderHUD(); }
  // v11b TEMP_BALANCE fare limits per tavern visit (reststops.js tavern.limits): Infinity where a stop has none
  function fareLeft(k) { const e = S.enc, Lm = restT().limits; if (!e || !Lm || Lm[k] == null) return Infinity; e.used = e.used || {}; return Lm[k] - (e.used["n_" + k] || 0); }
  function fareUse(k) { const e = S.enc; e.used = e.used || {}; e.used["n_" + k] = (e.used["n_" + k] || 0) + 1; }
  function buyMead() {
    const e = S.enc, M = restT().mead; if (!e || !M || S.gold < M.cost) return;
    if (fareLeft("mead") <= 0) return keeperSay(restT().limits.lot);
    if (S.mead) return keeperSay(M.already);
    S.gold -= M.cost; S.mead = 1; fareUse("mead"); A.play("buy"); save(); keeperSay(M.buy); renderHUD(); renderRest();
    if (fareLeft("mead") <= 0) later(1.8, () => keeperSay(restT().limits.lot));
  }
  function spellTick() {
    if (S.spellLeft <= 0) return; S.spellLeft--;
    if (!S.spellLeft) { const l = pickOne(SPL.wearOff); A.play(SPL.sfx.wearOff); later(0.9, () => { heroSay(A.text(l)); A.voice(A.voOf(l)); }); }
    renderHUD();
  }
  function buySpell() {
    const e = S.enc; if (!e || !SPL.sellAt.includes(e.st.rest) || S.gold < SPL.price || S.spells >= SPL.max) return;
    S.gold -= SPL.price; S.spells++; A.play("buy"); save(); keeperSay("One scroll of stupidity. Don't read it near a library."); renderRest();
  }
  const OPS = [["+", "+"], ["−", "−"], ["×", "×"], ["÷", "÷"], ["=", "="]];
  function renderMath() {
    const e = S.enc, used = e.problem.text + " =";
    const pad = L.touchPad ? `<div class="digits">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-key="${n}">${G(String(n))}</button>`).join("")}<button class="key wide" data-key="back">⌫</button><button class="key wide ok" data-key="enter">✓</button></div>
      <div class="ops">${OPS.map(([ch]) => `<span class="op ${used.includes(ch) ? "on" : ""}">${G(ch)}</span>`).join("")}</div>` : "";
    showPanel(`<div class="center mathp ${L.touchPad ? "touch" : ""}">
        <div class="sum"><span class="problem">${G(used)}<span class="answer" id="answer">${G(e.input) || "&nbsp;"}</span></span></div>
        ${pad}
      </div>`, "math"); // v11: only the carved sum (no title, hint or key captions; Esc still goes back)
  }
  function typeKey(k) {
    const e = S.enc; if (!e || e.phase !== "math" || e.sub) return;
    A.play("key_tap");
    if (k === "back") e.input = e.input.slice(0, -1);
    else if (k === "enter") return submitAnswer();
    else if (/^\d$/.test(k) && e.input.length < 6) e.input += k;
    const el = $("answer"); if (el) el.innerHTML = G(e.input) || "&nbsp;";
  }
  function submitAnswer() {
    const e = S.enc; if (!e.input) return;
    const q = e.q; e.q = null; e.phase = "busy";
    if (parseInt(e.input, 10) === e.problem.answer) { S.stats.correct++; A.play("correct"); q.onRight(); }
    else { S.stats.wrong++; A.play("wrong"); q.onWrong(); }
  }
  // every failed problem advances the hunters ONE block; at the end of the track they catch you
  function huntersStep(n) {
    S.hunters = Math.min(C.hunters.blocks, S.hunters + n);
    float(`hunters +${n}`, 260, W.groundY - tallOf("hero") + 70, "#c0503c"); A.play("hunters_step");
    if (S.hunters >= C.hunters.blocks && !S.dying) huntersCatch();
  }
  function huntersCatch() { // PROVISIONAL capture = run over (GAME_DESIGN leaves the hunter rule TBD)
    S.dying = { t: 0, killer: "hunters", pending: true };
    for (let i = 0; i < 3; i++) S.actors.push(mkActor({ id: "hunter", x: S.camX - 300 - i * 170, state: "hunt", hunter: true }));
    say(S.actors[S.actors.length - 1], D.enemies.hunter.taunt);
    later(1.4, () => heroDies("hunters", true));
  }

  // ---- riddles: wrong = hunters +1 and ONE more go (choice struck); wrong again = hunters +1 more, pass with nothing
  function startRiddle() {
    const e = S.enc, pool = D.riddles.map((r, i) => i).filter(i => !S.usedRiddles.includes(i));
    const idx = pool.length ? pickOne(pool) : Math.floor(Math.random() * D.riddles.length);
    S.usedRiddles.push(idx); e.phase = "riddle"; e.riddle = D.riddles[idx];
    // v11b (Magnus): the riddle sits in his frame in the strip; the riddler only gets a short taunt bubble
    { const rt = (D.enemies[e.act.id] || {}).riddleTaunt; say(e.act, Array.isArray(rt) ? pickOne(rt) : rt || "A riddle for you.", inPhase("riddle")); } A.play("riddle"); renderRiddle();
  }
  // v18 (Magnus, riddles-v18): answers in his answer-frame (2 columns), keyed A B C (+ S Sacrifice in the 4th slot);
  // live text, no words in the art. 1-3 still work as silent aliases.
  const RKEYS = ["A", "B", "C", "D"];
  const ansBtn = (key, label, act, attrs, off) => `<button class="opt ansf" data-act="${act}" ${attrs} ${off ? "disabled" : ""}><span>${label}</span></button>`;
  function renderRiddle() {
    const e = S.enc, r = e.riddle, wrong = e.wrong || []; e.phase = "riddle";
    // v11b (Magnus): the riddle where the big numbers usually are, inside his riddle frame; the answers under it as the
    // battle's plaque buttons (seal key + answer, nothing else); a struck answer greys out like Heal
    showPanel(`<div class="center riddlep"><div class="riddleframe${r.q.length > 58 ? " long" : ""}"><div class="rq">${esc(r.q)}</div></div>
      <div class="ansgrid">${r.choices.map((c, i) => ansBtn(RKEYS[i], esc(c), "answer", `data-i="${i}"`, wrong.includes(i))).join("")}${knights().length ? ansBtn("S", "Sacrifice", "sacrifice", "", false) : ""}</div></div>`, "riddle");
  }
  function answerRiddle(i) {
    const e = S.enc; if (!e || e.phase !== "riddle" || e.done || e.sub || (e.wrong || []).includes(i)) return;
    if (i === e.riddle.answer) {
      e.done = true; S.stats.riddles++; A.play("correct");
      if (!e.tries) { S.gold += e.st.gold || 0; A.play("coin"); float(`+${e.st.gold} gold`, screenX(e.act.x), W.groundY - tallOf(e.act.id) + 70, "#ffd84a"); say(e.act, "Right! Off you go then."); }
      else say(e.act, "Hmph. Right on the second go. No gold for you.");
      e.act.state = "stay"; return finishEncounter();
    }
    A.play("wrong"); S.stats.wrong++;
    e.tries = (e.tries || 0) + 1; e.wrong = (e.wrong || []).concat(i);
    huntersStep(1); if (S.dying) return;
    if (e.tries === 1) { say(e.act, "WRONG! One more go.", inPhase("riddle")); return renderRiddle(); }
    e.done = true; say(e.act, `WRONG AGAIN! It was "${e.riddle.choices[e.riddle.answer]}". Now limp off.`);
    e.act.state = "stay"; finishEncounter();
  }

  // ---- recruiting: by maths; a failed sum (hunters +1) offers a D20 contest
  function renderRecruit() {
    const e = S.enc, k = e.st.cands[0]; e.phase = "recruit";
    if (!k) return finishEncounter();
    if (partyFull()) {
      say(e.act, "Full party? Bah. I'll stay in me ditch.", inPhase("recruit"));
      return showPanel(`<div class="center"><div class="opts big3">${big("Enter", "Walk on", "noRecruit")}</div></div>`, "info");
    }
    say(e.act, k.join + " Prove you can count. Then I'm yours.", inPhase("recruit"));
    showPanel(`<div class="center"><div class="opts big3">${big("Enter", "Recruit", "recruitSum")}${big("N", "No", "noRecruit")}</div></div>`, "info");
  }
  // who speaks for candidate j: its actor on the road, else the candidate itself (drawn in the camp / tavern view)
  const candSpeaker = (st, j) => S.actors.find(x => x.stop === S.stop && x.candIdx === j && !x.dead) || st.cands[j];
  // shared recruit flow (roadside ditch, tavern table, camp wanderer, shop sellsword). done(joined, cancelled)
  function recruitFlow(st, j, done) {
    const p = st.cands[j]; if (!p || partyFull()) return;
    ask(C.recruitLevel,
      () => { const m = recruitCand(st, j); if (m) speak(m, p.join); done(true); },
      () => {
        huntersStep(1); if (S.dying) return;
        say(candSpeaker(st, j), `It's ${S.enc.problem.answer}! Can't count? Roll me for it, then.`, inPhase("contestOffer"));
        S.enc.phase = "contestOffer"; S.enc.contest = { st, j, done };
        contestPanel();
      }, () => done(false, true));
  }
  function contest() {
    const e = S.enc, c = e.contest; if (!c || e.phase !== "contestOffer") return;
    let mine = 1 + Math.floor(Math.random() * 20), theirs = 1 + Math.floor(Math.random() * 20);
    if (window.__km && __km.forceContest) [mine, theirs] = __km.forceContest;
    while (mine === theirs) theirs = 1 + Math.floor(Math.random() * 20); // PROVISIONAL: ties are re-rolled before showing
    const nm = shortName(c.st.cands[c.j].name);
    e.phase = "dice"; A.play("dice_roll");
    S.dice = [Object.assign(KM.D20.roll(mine, "you"), { x: 930 }), Object.assign(KM.D20.roll(theirs, nm), { x: 1470 })];
    showPanel(`<div class="center"></div>`, "info"); // the two dice (labelled you / them) roll in the scene
    S.diceDone = () => {
      A.play("dice_land");
      const sp = candSpeaker(c.st, c.j), win = mine > theirs;
      const m = win ? recruitCand(c.st, c.j) : null;
      speak(m || sp, win ? `${mine} beats ${theirs}. Fine, I'll come.` : `${theirs} beats ${mine}. I'm staying put.`);
      later(1.2, () => { S.dice = []; e.contest = null; c.done(win); });
    };
  }
  function recruitCand(st, j) {
    const p = st.cands[j]; if (!p || partyFull()) return false;
    const a = S.actors.find(x => x.stop === S.stop && x.candIdx === j);
    S.party.push(followerFrom(p, a && !S.view ? screenX(a.x) : slotX(S.party.length), st.candSkins && st.candSkins[j]));
    if (a) a.dead = true; st.cands[j] = null; A.play("recruit"); hearts(HPM()); // each member brings 2 hearts
    float(`${shortName(p.name)} joins!`, slotX(S.party.length - 1), W.groundY - tallOf("hero") + 70, "#d8f3ff");
    return S.party[S.party.length - 1];
  }

  // ---- Frank the priest: agree = fight the turd dragon; disagree = restraint maths
  function startFrank() {
    const e = S.enc; e.phase = "frank"; e.frank = e.act; e.act = S.actors.find(a => a.stop === S.stop && a.foe) || e.act;
    say(e.frank, D.enemies.frank.taunt, inPhase("frank")); MU.setScene("riddle");
    showPanel(`<div class="center"><div class="opts big3">${big("1", "Fight it (risky)", "frankAgree")}${big("2", "Talk him down (safe)", "frankNo")}</div></div>`, "info");
  }
  function frankNo() {
    const e = S.enc; if (!e || e.phase !== "frank") return;
    ask("normal",
      () => { heroSay("No, Frank. No turd dragons today."); e.frank.state = "stay"; e.act.state = "stay"; later(0.4, finishEncounter); },
      () => { // PROVISIONAL: Frank runs at it and the party has to follow (forced fight)
        huntersStep(1); if (S.dying) return;
        say(e.frank, "Nonsense! FOR SCIENCE!"); e.phase = "frank"; later(0.8, commit);
      }, () => startFrank());
  }

  // ---- sacrifice (menu captures digit keys while open). Casualties are removed exactly once.
  function renderSacrifice() {
    const e = S.enc; if (!e || !["choose", "riddle"].includes(e.phase)) return;
    e.prevPhase = e.phase; e.sub = "sacrifice";
    heroSay("Who takes one for the team?", () => !!(S.enc && S.enc.sub === "sacrifice"));
    showPanel(`<div class="center"><div class="opts big3">${knights().map((m, i) => `<button class="opt plaque" data-act="doSacrifice" data-id="${m.id}">${BANNER}<span class="nm">${esc(shortName(m.name))}</span></button>`).join("")}${big("Esc", "Cancel", "cancelSacrifice")}</div></div>`, "riddle");
  }
  function cancelSacrifice() { const e = S.enc; e.sub = null; e.prevPhase === "riddle" ? renderRiddle() : renderChoice(); }
  function doSacrifice(id) {
    const e = S.enc, i = S.party.findIndex(m => m.id === id); if (i < 0 || e.sub !== "sacrifice") return; e.sub = null;
    const m = S.party.splice(i, 1)[0]; S.stats.sacrificed++; A.play("sacrifice");
    S.hp = Math.min(S.hp, maxHp());
    const a = mkActor({ id: artId(m), x: S.camX + m.sx, state: "holdoff", name: m.name, label: shortName(m.name) });
    S.actors.push(a); say(a, m.sacrifice || "Farewell!");
    if (e.st.type === "mega") {
      e.bonus += C.d20.sacrificeBonus; a.state = "charge"; a.target = e.act.x - KM.Assets.entitySize(e.act.id)[0] / 2 - 60;
      const B = (KM_ART.brutal || {})[e.act.id], boss = e.act; // v19: the dragon eats the volunteer (its full eating sequence)
      if (B && B.at === "killer" && KM_ART7 && KM_ART7.sequences[B.seq]) a.onArrive = () => { a.dead = true; boss.act = null; boss.seqPlay = { id: B.seq, t: 0 }; A.play("bite"); later(KM.Assets.seqDur(B.seq) - 0.4, () => A.play("crunch")); };
      e.msg = `${m.name} charges the dragon! +${e.bonus} to the D20.`; e.msgUntil = S.t + 3; return renderChoice();
    }
    if (e.prevPhase === "riddle") { say(e.act, `${shortName(m.name)}... you're a newt now. Pass.`); a.state = "newt"; }
    else say(e.act, "Come back here! I'll bite your legs off!");
    e.act.state = "stay";
    finishEncounter();
  }

  // ---- mega boss: D20 (party power + d20 + sacrifice bonuses vs dragon power) or turn combat
  function needRoll() { const e = S.enc; return C.d20.dragonPower - strength() - (e ? e.bonus : 0); }
  function roll() {
    const e = S.enc; if (!e || e.phase !== "choose" || e.st.type !== "mega" || needRoll() > 20) return;
    const r = (window.__km && __km.forceRoll) || 1 + Math.floor(Math.random() * 20); // the result is chosen FIRST, then its sheet plays
    const base = `${strength()}${e.bonus ? " + " + e.bonus : ""}`;
    e.phase = "dice"; A.play("dice_roll");
    S.dice = [Object.assign(KM.D20.roll(r, ""), { x: 1225 })];
    showPanel(`<div class="center"></div>`, "info");
    S.diceDone = () => {
      A.play("dice_land");
      const total = strength() + e.bonus + r, win = total >= C.d20.dragonPower, flav = r === 20 ? "NAT 20! " : r === 1 ? "Critical fail! " : "";
      showPanel(`<div class="center mathp"><div class="sum corr"><span class="problem">${G(`${base} + ${r} = ${total}`)}</span></div></div>`, "math"); // carved: power + roll = total
      if (win) heroSay(`${flav}${total}! The dragon is smitten. Smote. Smited.`); else say(e.act, `${flav}${total}? Not enough. My turn!`);
      if (win) { partyAct("attack", 0.5); later(1.4, () => { S.dice = []; e.hp = 0; defeatEnemy(); }); }
      else later(1.4, () => { S.dice = []; e.msg = `Rolled ${r}: ${total} vs ${C.d20.dragonPower}.`; e.msgUntil = S.t + 3; enemyTurn(); });
    };
  }

  // ---- rest stops: tavern (facade -> layered interior), campsite (layered camp view), shop (boxes)
  // keys: heals H/J, recruits 1-2 (by maths), swords Q W E R and armour A S D F for party members 1-4, Enter walks on
  const WKEYS = ["Q", "W", "E", "R"], AKEYS = ["A", "S", "D", "F"];
  const restT = () => RS.types[S.enc.st.rest];
  // the keeper's voice: the shop keeper stands on the road; the tavern bartender / Old Wally have no art yet (MISSING_ART
  // #20 / #22): their bubbles point at the bar / the fire in the painted scene
  function keeperSay(text) {
    const T = restT(), v = S.view && S.view.id;
    if (v === "tavern-interior" || v === "camp") {
      const m = KM.RestView.mapper(v), sc = KM.RestView.scene(v);
      if (sc.full && v === "tavern-interior") return voice("keeper", text, D.tavernRoom.keeperAt[0], D.tavernRoom.keeperAt[1]); // v12o: behind the bar (layout units)
      const at = v === "camp" ? [sc.canvas[0] * 0.5, sc.canvas[1] * 0.62] : (sc.barStaffAnchor || [1200, 550]);
      return voice("keeper", text, m.x0 + at[0] * m.s, m.y0 + at[1] * m.s);
    }
    const keeper = S.actors.find(a => a.stop === S.stop && a.keeper);
    keeper ? say(keeper, text) : heroSay(text);
  }
  function startRest() {
    const e = S.enc, T = restT(); e.used = {}; A.play("rest_" + e.st.rest); setCheckpoint();
    if (ART7 && T.view === "camp") { S.view = { id: "camp", a: 0, to: 1 }; keeperSay(T.greet); return renderRest(); }
    if (ART7 && T.view === "tavern") { if (KM.RestView.scene("tavern-arrival")) S.view = { id: "tavern-arrival", a: 0, to: 1 }; return renderTavernOut(); } // v11b: Magnus's full-screen exterior
    keeperSay(T.greet); renderRest();
  }
  function renderTavernOut() {
    S.enc.phase = "tavernOut";
    showPanel(`<div class="center"><div class="opts big3 moves${S.view && S.view.id === "tavern-arrival" && S.view.a < 1 ? " arrive" : ""}">${big("I", "Go in", "goInside")}${big("Enter", "Walk on", "leaveRest")}</div></div>`, "info");
  }
  function goInside() {
    const e = S.enc; if (!e || e.phase !== "tavernOut") return;
    e.phase = "busy"; A.play("door"); const fromArrival = S.view && S.view.id === "tavern-arrival";
    if (!fromArrival) S.entering = { t: 0 };
    later(fromArrival ? 0.4 : 0.8, () => { S.entering = null; S.view = { id: "tavern-interior", a: fromArrival ? 1 : 0, to: 1 }; e.tv = { sel: 0, open: null }; keeperSay(restT().greet); renderRest(); });
  }
  function leaveInside() { if (S.view && S.view.id === "tavern-interior") { S.voices = []; if (KM.RestView.scene("tavern-arrival")) S.view = { id: "tavern-arrival", a: 1, to: 1 }; else S.view.to = 0; renderTavernOut(); } }
  const pips = (n, max) => `<span class="pips">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</span>`;
  function renderRest() {
    if (S.view && S.view.id === "tavern-interior" && KM.RestView.scene("tavern-interior").full) return renderTavernInside();
    const e = S.enc, st = e.st, T = restT(), g = T.gear; e.phase = "rest";
    const heals = T.heals.map(h => `<button class="opt plaque" data-act="restHeal" data-k="${h.key}" ${S.gold < h.cost || S.hp >= maxHp() || (h.once && e.used[h.key]) ? "disabled" : ""}>${BANNER}<span class="nm">${esc(h.short || h.label)}</span> <span class="gain">+${h.hearts}<i class="heart">♥</i></span>${h.cost ? coin(h.cost) : ""}</button>`).join("");
    const scroll = SPL.sellAt.includes(st.rest) ? `<button class="opt plaque" data-act="buySpell" ${S.gold < SPL.price || S.spells >= SPL.max ? "disabled" : ""}>${BANNER}${spellIcon("shop")}${coin(SPL.price)}</button>` : "";
    const cands = st.cands.map((p, j) => p ? big(String(j + 1), esc(shortName(p.name).split(/[\s-]/)[0]), "restRecruit", `data-j="${j}"`, partyFull()) : "").join("");
    // gear: one column per party member (name, weapon pips, armour pips); the row labels are the icon + price
    const first = m => (m.id === "hero" ? S.name : shortName(m.name)).split(/[\s-]/)[0];
    const gear = g && (g.maxWeapon || g.maxArmor) ? `<div class="gear" style="grid-template-columns:auto repeat(${S.party.length},auto)"><span></span>${S.party.map(m => `<span class="nm">${esc(first(m))}</span>`).join("")}
      ${g.maxWeapon ? `<span class="gh"><i class="ico">⚔</i>${coin(g.weaponCost)}</span>` + S.party.map((m, i) => `<button class="opt plaque mini" data-act="restBuyW" data-i="${i}" ${m.weapon >= g.maxWeapon || S.gold < g.weaponCost ? "disabled" : ""}>${BANNER}${pips(m.weapon, g.maxWeapon)}</button>`).join("") : ""}
      ${g.maxArmor ? `<span class="gh"><i class="ico">⛨</i>${coin(g.armorCost)}</span>` + S.party.map((m, i) => `<button class="opt plaque mini" data-act="restBuyA" data-i="${i}" ${m.armor >= g.maxArmor || S.gold < g.armorCost ? "disabled" : ""}>${BANNER}${pips(m.armor, g.maxArmor)}</button>`).join("") : ""}</div>` : "";
    const inside = S.view && S.view.id === "tavern-interior", camp = S.view && S.view.id === "camp";
    // v11b: two rows (heal / scroll / recruits, then talk / leave) beside the gear table: fits the shorter strip
    showPanel(`<div class="center restp"><div class="restgrid"><div class="col"><div class="opts big3">${heals}${scroll}${cands}</div>
      <div class="opts big3">${inside ? big("T", "Table", "talkTable") + big("B", "Bar", "talkBar") + big("X", "Leave", "leaveInside") : ""}${big("Enter", camp ? "Break camp" : "Walk on", "leaveRest")}</div></div>${gear}</div></div>`, "rest");
  }
  function restHeal(key) {
    const e = S.enc, T = restT(), h = T.heals.find(x => x.key === key);
    if (h && T.limits && fareLeft("stew") <= 0) return keeperSay(T.limits.lot);
    if (!h || S.gold < h.cost || S.hp >= maxHp() || (h.once && e.used[key])) return;
    S.gold -= h.cost; hearts(h.hearts); e.used[key] = true; if (T.limits) fareUse("stew"); A.play("heal"); save();
    if (T.limits && fareLeft("stew") <= 0) later(1.2, () => keeperSay(T.limits.lot));
    float(`+${h.hearts} ♥`, slotX(0), W.groundY - tallOf("hero") + 70, "#9be28a"); renderRest();
  }
  // v11b tavern recruit talk: hero "Join my party?" -> NPC challenge bubble -> the carved sum (like a battle sum) ->
  // solved: NPC "Fine, I'm in." and joins (+2 hearts, stands up into the party line); failed: refusal + the D20 offer
  function tvJoin(j) {
    const e = S.enc, st = e.st, p = st.cands[j], RT = D.recruitTalk; if (!p || partyFull() || e.phase !== "rest") return;
    const skin = SKIN_OF[candArt(j)], sp = candSpeaker(st, j);
    e.phase = "talk"; showPanel(`<div class="center tavernp"></div>`, "rest");
    heroSay(RT.ask);
    later(1.3, () => { say(sp, pickOne(RT.challenge[skin] || RT.challenge.scarf), inPhase("math"));
      later(0.9, () => { e.phase = "rest"; recruitFlowTalk(st, j); }); });
  }
  function recruitFlowTalk(st, j) {
    const p = st.cands[j], RT = D.recruitTalk, sp = candSpeaker(st, j), back = () => { save(); renderRest(); };
    ask(C.recruitLevel,
      () => { const m = recruitCand(st, j); speak(m || sp, pickOne(RT.yes)); back(); },
      () => { huntersStep(1); if (S.dying) return;
        say(sp, `${pickOne(RT.no)} ${RT.offer}`, inPhase("contestOffer"));
        S.enc.phase = "contestOffer"; S.enc.contest = { st, j, done: back }; contestPanel(); },
      back);
  }
  const contestPanel = () => showPanel(`<div class="center"><div class="opts big3 turn moves">${move("D", "Roll for it", "contest", "roll")}${move("N", "No", "noContest", "")}</div></div>`, "info");
  function restRecruit(j) {
    const e = S.enc, p = e.st.cands[j]; if (!p || partyFull()) return;
    recruitFlow(e.st, j, () => { save(); renderRest(); });
  }
  function restBuy(kind, i) {
    const g = restT().gear, m = S.party[i]; if (!m || !g) return;
    if (kind === "weapon" && m.weapon < g.maxWeapon && S.gold >= g.weaponCost) { S.gold -= g.weaponCost; m.weapon++; }
    else if (kind === "armor" && m.armor < g.maxArmor && S.gold >= g.armorCost) { S.gold -= g.armorCost; m.armor++; }
    else return;
    A.play("buy"); save(); keeperSay(`${m.id === "hero" ? "Sir " + S.name : shortName(m.name)}! Marginally less scruffy.`); renderRest();
  }
  function talkPoint(which) {
    const T = restT();
    if (which === "bar") return keeperSay(T.greet);
    const j = S.enc.st.cands.findIndex(Boolean); j >= 0 ? speak(candSpeaker(S.enc.st, j), S.enc.st.cands[j].join) : heroSay("The table is empty. Someone left half a pie.");
  }
  function leaveRest() { A.play("footstep"); if (S.view) S.view.to = 0; finishEncounter(); }

  // ---------- death / game over / win ----------
  // hero death: the approved drawn knight death plays once (per-frame holds, last frame held), then the strip game-over
  function heroDies(killer) {
    if (S.mode === "dying" || S.mode === "gameover") return;
    const st = S.stops[S.stop];
    S.dying = { t: 0, killer, st };
    const hero = S.party[0]; if (hero) { hero.act = null; hero.dying = { t: 0 }; }
    const dur = hero ? deathDur(hero, killer) : 0; // v19: brutal death by the killer (eaten / torn / arrows) or the approved knight death
    S.mode = "dying"; S.enc = null; S.dice = []; S.diceDone = null; A.play("death"); MU.setScene("gameover");
    showPanel(`<div class="center"></div>`, "info"); // the drawn death says it
    later(Math.max(1.2, dur + 0.9), () => gameOver(killer, st));
  }
  function gameOver(killer, st) {
    S.mode = "gameover"; S.enc = null; A.play("gameover"); MU.setScene("gameover");
    if (S.checkpoint) KM.Save.write(Object.assign({}, S.checkpoint, { checkpoint: S.checkpoint }));
    const isBest = KM.Save.recordBest(+leagues(), S.name);
    killer = killer || "unknown";
    KM.Save.addDeath({ deathId: S.runId + "-" + Date.now(), runId: S.runId, route: "road-v7",
      progress: st && st.src != null ? { encounter: st.src, offset: Math.round(S.camX - haltCam(st)) } : null,
      killer, marker: markerOf({ killer }), name: S.name, x: Math.round(S.camX), leagues: +leagues(), at: Date.now() }); // a grave in later runs
    const line = pickOne(D.dialogue.gameOver); endNarrator(`Killed by ${GR.killedBy[killer] || killer}. ${A.text(line)}`); A.voice(A.voOf(line));
    showPanel(`<div class="center endp"><h1>Game over</h1><div class="endrow">${journeyHTML(isBest)}
      <div class="opts big3">${big("Enter", "Retry", "retry")}${big("N", "New game", "newGame")}</div></div></div>`, "end");
  }
  function showWin() {
    S.mode = "win"; A.play("victory"); MU.setScene("win"); KM.Save.clear();
    const isBest = KM.Save.recordBest(+leagues(), S.name);
    endNarrator(A.text(D.dialogue.victory)); A.voice(A.voOf(D.dialogue.victory));
    showPanel(`<div class="center endp"><h1>Victory!</h1><div class="endrow">${journeyHTML(isBest)}
      <div class="opts big3">${big("Enter", "Play again", "newGame")}</div></div></div>`, "end");
  }
  // one large element: the distance travelled (+ a star when it is a new best)
  const journeyHTML = isBest => `<div class="journeyline"><i class="mile">⚐</i>${leagues()} <span class="unit">leagues</span>${isBest ? ` <span class="best">★ best</span>` : ""}</div>`;
  // the narrator (skeleton on his rock) narrates the end
  function endNarrator(text) {
    let n = narrator(); if (!n) { n = mkActor({ id: "narrator", x: S.camX + NARRATOR_X, narrator: true }); S.actors.push(n); }
    n.x = S.camX + 1320; n.state = "idle"; n.active = true; n.dead = false; const md = S.mode; speak(n, text, { keep: () => S.mode === md });
  }
  function retry() {
    const c = S.checkpoint; if (!c) return newGame();
    hush(); applyCore(c); startRunBookkeeping(); S.hp = maxHp(); S.mode = "walk"; MU.setScene("walk"); S.floats = []; save(); renderWalk();
  }

  // ---------- input ----------
  const actions = {
    newGame: () => newGame(), continue: () => continueGame(), skipIntro: () => skipIntro(), submitName: () => submitName(), nextLine: () => advanceIntro(),
    commit: () => commit(), avoid: () => avoid(),
    pickWeak: () => pickAction("weak"), pickHard: () => pickAction("hard"), pickHeal: () => pickAction("heal"),
    mathBack: () => { const e = S.enc; if (e && e.q && e.q.back) { const b = e.q.back; e.q = null; e.msg = ""; b(); } },
    sacrifice: () => renderSacrifice(), doSacrifice: b => doSacrifice(b.dataset.id), cancelSacrifice: () => cancelSacrifice(),
    answer: b => answerRiddle(+b.dataset.i),
    recruitSum: () => {
      const e = S.enc; if (partyFull()) return actions.noRecruit();
      recruitFlow(e.st, 0, (ok, cancelled) => { if (cancelled) return renderRecruit(); if (!ok) e.act.state = "stay"; finishEncounter(); });
    },
    noRecruit: () => { S.enc.act.state = "stay"; finishEncounter(); },
    contest: () => contest(),
    noContest: () => { const c = S.enc.contest; S.enc.contest = null; c.done(false); },
    roll: () => roll(),
    frankAgree: () => { if (S.enc.phase === "frank") { say(S.enc.frank, "Splendid! For God and science!"); commit(); } }, frankNo: () => frankNo(),
    tvBack: () => tvBack(), tvJoin: b => tvJoin(+b.dataset.j), tvTalk: b => { const j = +b.dataset.j, p = S.enc.st.cands[j]; if (p) speak(candSpeaker(S.enc.st, j), p.join); },
    talkTable: () => talkPoint("table"), talkBar: () => talkPoint("bar"), castSpell: () => castSpell(), buySpell: () => buySpell(), pickFire: () => pickFire(), buyBottle: () => buyBottle(),
    restHeal: b => restHeal(b.dataset.k), buyMead: () => buyMead(), restRecruit: b => restRecruit(+b.dataset.j),
    restBuyW: b => restBuy("weapon", +b.dataset.i), restBuyA: b => restBuy("armor", +b.dataset.i),
    goInside: () => goInside(), leaveInside: () => leaveInside(),
    leaveRest: () => leaveRest(),
    retry: () => retry(),
    toggleMusic: () => { MU.toggleMute(); renderHUD(); }
  };
  // v11b (Magnus): scene hotspots work with the mouse too: pointer cursor + the ink highlight on hover, click = use
  // (exterior doorway = go in; inside: sign = swing it / its plaques, recruit = "Join my party?", door = go outside).
  function hotspotAt(ev) {
    if (!S.view || !S.enc) return null; const r = cv.getBoundingClientRect(), sx = (ev.clientX - r.left) / r.width * VW, sy = (ev.clientY - r.top) / r.height * L.artSpaceH;
    const inR = q => sx >= q.x && sx <= q.x + q.w && sy >= q.y && sy <= q.y + q.h;
    if (S.view.id === "tavern-arrival" && S.enc.phase === "tavernOut" && S.view.a >= 1 && inR(arrivalDoor())) return { id: "arrivalDoor", use: () => goInside() };
    if (S.view.id === "tavern-interior" && S.enc.tv && S.enc.phase === "rest") { const i = tvSpots().findIndex(q => inR(q.r));
      if (i >= 0) return { id: "tv" + i, i, use: () => { S.enc.tv.sel = i; tvOpen(); } }; }
    return null;
  }
  cv.addEventListener("mousemove", ev => { const h = hotspotAt(ev); cv.style.cursor = h ? "pointer" : "";
    const id = h ? h.id : null; if (id === S.hoverSpot) return; S.hoverSpot = id;
    if (h && h.i != null && S.enc.tv.sel !== h.i) { S.enc.tv.sel = h.i; renderTavernInside(); } });
  cv.addEventListener("mouseleave", () => { S.hoverSpot = null; cv.style.cursor = ""; });
  document.addEventListener("click", ev => {
    const b = ev.target.closest("button");
    if (!b) {
      if (S.mode === "intro" && (ev.target.closest("#strip") || ev.target === cv)) advanceIntro();
      if (ev.target === cv) { const h = hotspotAt(ev); if (h) { h.use(); return; } }
      if (ev.target === cv && S.view && S.view.id === "tavern-interior" && exitRect) { // the painted EXIT sign is clickable
        const r = cv.getBoundingClientRect(), sx = (ev.clientX - r.left) / r.width * VW, sy = (ev.clientY - r.top) / r.height * L.artSpaceH;
        if (sx >= exitRect.x && sx <= exitRect.x + exitRect.w && sy >= exitRect.y && sy <= exitRect.y + exitRect.h) leaveInside();
      }
      return;
    }
    if (b.disabled) return;
    if (b.dataset.key) return typeKey(b.dataset.key);
    if (b.dataset.act && actions[b.dataset.act]) { A.play("ui_click"); actions[b.dataset.act](b); }
  });
  // Keyboard is THE input. Every prompt shows its key; clicking the option lines also works.
  document.addEventListener("keydown", ev => {
    const k = ev.key, K1 = k.length === 1 ? k.toUpperCase() : k;
    if (S.mode === "name") { if (k === "Enter") submitName(); return; }
    if (S.mode === "encounter" && S.enc && S.enc.phase === "spell") { // v12k fire bottle word: letters only (M, Z... are letters here); v12m: Backspace does nothing
      if (k === "Backspace") ev.preventDefault(); else if (/^[a-z]$/i.test(k)) spellKey(k.toUpperCase()); return; }
    if (K1 === "M") { MU.toggleMute(); renderHUD(); return; }
    if (k === "[" || k === "]") { MU.setVolume(MU.settings().volume + (k === "]" ? 1 : -1) * D.music.volumeStep); renderHUD(); return; }
    if ([" ", "Enter", "Backspace"].includes(k)) ev.preventDefault();
    if (S.mode === "title") { const sv = KM.Save.load(); if (k === "Enter") return sv ? continueGame() : newGame(); if (K1 === "N") return newGame(); if (K1 === "C" && sv) return continueGame(); return; }
    if (S.mode === "intro") { if (k === " " || k === "Enter") advanceIntro(); if (k === "Escape") skipIntro(); return; }
    if (S.mode === "gameover") { if (k === "Enter") retry(); else if (K1 === "N") newGame(); return; }
    if (S.mode === "win") { if (k === "Enter") newGame(); return; }
    if (K1 === SPL.key && !S.dying) { // Spell of Stupidity: on the road, on your turn, or mid-sum (buy it at a tavern / shop)
      const ph = S.enc && S.enc.phase;
      if (S.mode === "walk" || (S.mode === "encounter" && (ph === "choose" || ph === "math") && !S.enc.sub)) return castSpell();
      if (S.mode === "encounter" && ph === "rest") return buySpell();
    }
    const e = S.enc; if (S.mode !== "encounter" || !e || S.dying) return;
    const press = (a, el) => { A.play("ui_click"); actions[a](el || {}); };
    if (e.sub === "sacrifice") {
      const ks = knights();
      if (/^[1-9]$/.test(k) && ks[+k - 1]) { A.play("ui_click"); doSacrifice(ks[+k - 1].id); }
      else if (k === "Escape") press("cancelSacrifice");
      return;
    }
    const canSac = knights().length > 0;
    switch (e.phase) {
      case "math":
        if (/^\d$/.test(k)) typeKey(k); else if (k === "Backspace") typeKey("back"); else if (k === "Enter") typeKey("enter");
        else if (k === "Escape" && e.q && e.q.back) press("mathBack");
        return;
      case "approach": if (k === "Enter") press("commit"); else if (K1 === "A" && C.avoidable[e.st.type]) press("avoid"); return;
      case "choose":
        if (k === C.actions.weak.key) press("pickWeak"); else if (k === C.actions.hard.key) press("pickHard"); else if (k === C.actions.heal.key) press("pickHeal");
        else if (K1 === "S" && canSac) press("sacrifice"); else if ((K1 === "R" || k === " ") && e.st.type === "mega") roll();
        else if (K1 === IT.key && S.bottles > 0) press("pickFire");
        return;
      case "riddle": { const ri = RKEYS.indexOf(K1); if (ri >= 0 && ri < e.riddle.choices.length) answerRiddle(ri); else if (/^[123]$/.test(k)) answerRiddle(+k - 1); else if (K1 === "S" && canSac) press("sacrifice"); return; }
      case "recruit": if (k === "Enter") press(partyFull() ? "noRecruit" : "recruitSum"); else if (K1 === "N") press("noRecruit"); return;
      case "contestOffer": if (K1 === "D" || k === "Enter") press("contest"); else if (K1 === "N" || k === "Escape") press("noContest"); return;
      case "frank": if (k === "1") press("frankAgree"); else if (k === "2") press("frankNo"); return;
      case "tavernOut": if (K1 === "I") press("goInside"); else if (k === "Enter") press("leaveRest"); return;
      case "rest": {
        if (S.view && S.view.id === "tavern-interior" && e.tv) { // v11b tavern: pick a thing, then its options
          if (e.phase !== "rest") return;
          const cur = tvSpots()[e.tv.sel];
          if (/^[1-9]$/.test(k) && cur && cur.kind === "fare") { const it = fareItems()[+k - 1]; if (it) buyFare(it.id); } // v12q: 1 Mead, 2 Stew, 3 Fire bottle (silent keys)
          else if (/^[1-9]$/.test(k)) { const b = document.querySelector(`#panel button[data-n="${k}"]:not([disabled])`); if (b) { A.play("ui_click"); actions[b.dataset.act](b); }
            else if (document.querySelector(`#panel button[data-n="${k}"][data-lot]`)) keeperSay(restT().limits.lot); }
          else if (k === "ArrowLeft" || K1 === "A") tvMove(-1); else if (k === "ArrowRight" || K1 === "D") tvMove(1);
          else if (k === "Enter") tvOpen(); else if (k === "Escape") tvBack();
          return;
        }
        const T = restT(), wi = WKEYS.indexOf(K1), ai = AKEYS.indexOf(K1), inside = S.view && S.view.id === "tavern-interior";
        if (T.heals.some(h => h.key === K1)) restHeal(K1); else if (T.mead && K1 === T.mead.key) buyMead();
        else if (/^[1-3]$/.test(k)) restRecruit(+k - 1);
        else if (wi >= 0 && T.gear && T.gear.maxWeapon) restBuy("weapon", wi);
        else if (ai >= 0 && T.gear && T.gear.maxArmor) restBuy("armor", ai);
        else if (inside && (K1 === "X" || k === "Escape")) press("leaveInside");
        else if (inside && K1 === "T") talkPoint("table"); else if (inside && K1 === "B") talkPoint("bar");
        else if (k === "Enter") press("leaveRest");
      }
    }
  });

  // ---------- update ----------
  function update(dt) {
    S.t += dt;
    if (isWalking()) S.walkT = (S.walkT || 0) + dt; // v13 walk cycle clock: runs only while the party walks
    if (S.timers.length) { const due = S.timers.filter(x => x.at <= S.t); S.timers = S.timers.filter(x => x.at > S.t); due.forEach(x => x.fn()); }
    tickSpeech(dt); introPace(); tickAnswerTimer(dt); KM.FireFx.update(dt);
    if (S.mode !== "encounter" && KM.FireFx.active()) KM.FireFx.stop(); // v12n: the battle is over / the scene changed: no fire (or crackle) left behind
    if (S.mode === "walk") updateWalk(dt);
    if (S.toast) { S.toast.t += dt; if (S.toast.t > S.toast.dur) S.toast = null; }
    if (S.view) { S.view.a += (S.view.to ? 1 : -1) * dt / 0.5; S.view.a = Math.max(0, Math.min(1, S.view.a)); if (!S.view.to && S.view.a <= 0) S.view = null; }
    if ((!S.view || S.view.a >= 1) && panel.querySelector(".arrive:not(.in)")) panel.querySelector(".arrive:not(.in)").classList.add("in"); // v12e: choices fade in after the scene
    if (S.entering) S.entering.t += dt;
    if (S.dice.length) { S.dice.forEach(d => KM.D20.update(d, dt)); if (S.diceDone && S.dice.every(d => d.done)) { const f = S.diceDone; S.diceDone = null; f(); } }
    S.party.forEach((m, i) => {
      if (m.dying) { m.dying.t += dt; return; }
      m.sx += (slotX(i) - m.sx) * Math.min(1, dt * 3);
      if (m.act) { m.act.t += dt; if (m.act.t >= m.act.dur) m.act = null; }
      const wx = S.camX + m.sx; m.hopY = 0;
      for (const o of S.obstacles) { const d = wx - o.x; if (d > -130 && d < 130) { m.hopY = -Math.sin(Math.PI * (d + 130) / 260) * W.hopHeight; if (!m.hopping) { m.hopping = true; if (i === 0) A.play("hop"); } } }
      if (!m.hopY) m.hopping = false;
    });
    for (const a of S.actors) {
      if (!a.active || a.dead) continue;
      a.t += dt; if (a.flash > 0) a.flash -= dt; if (a.act) { a.act.t += dt; if (a.act.t >= a.act.dur) a.act = null; }
      if (a.seqPlay) { a.seqPlay.t += dt; if (!a.seqPlay.hold && a.seqPlay.t >= KM.Assets.seqDur(a.seqPlay.id)) a.seqPlay = null; }
      if (a.closing) { a.closing.t += dt; if (a.closing.t >= a.closing.dur) a.closing = null; }
      if (a.state === "walkin") { const st = S.stops[a.stop], hx = a.homeX != null ? a.homeX : st.stopX; a.x -= W.enemyWalkSpeed * dt; if (a.x <= hx) { a.x = hx; a.state = "idle"; } }
      // stepped vanish for creatures without approved drawn deaths: hold, then 3 hard alpha steps (no tweened fall)
      if (a.state === "vanish") { a.alpha = a.t < 0.35 ? 1 : a.t < 0.5 ? 0.66 : a.t < 0.65 ? 0.33 : 0; if (a.t >= 0.65) a.dead = true; }
      if (a.state === "flyoff") { a.x += dt * 600; a.dy -= dt * 380; if (a.dy < -1100) a.dead = true; }
      if (a.state === "charge") { a.x += dt * 600; if (a.x >= a.target) { if (a.onArrive) { const f = a.onArrive; a.onArrive = null; a.sp = null; f(); continue; } a.state = "vanish"; a.t = 0; a.sp = null; } }
      if (a.state === "hunt") { a.x += dt * 520; if (screenX(a.x) > W.partyScreenX - 260) a.state = "idle"; }
      if (screenX(a.x) < -900 && a.state !== "waiting" && !a.hunter) a.dead = true;
    }
    S.floats.forEach(f => (f.t += dt)); S.floats = S.floats.filter(f => f.t < 1.8);
    if (S.shake > 0) S.shake -= dt;
    if (W.boxScenery !== false || !ART7) {
      S.nextSky -= dt;
      if (S.nextSky <= 0) { S.nextSky = rnd(...W.skyEventEvery); S.skyEvents.push({ x: VW + 200, y: rnd(200, 390), t: 0 }); }
      S.skyEvents.forEach(s => { s.x -= dt * 240; s.t += dt; }); S.skyEvents = S.skyEvents.filter(s => s.x > -300);
    }
    renderHUD();
  }

  // ---------- draw: scene (scaled scene space) then barks (screen px) ----------
  let bubbleQ = [], occ = [], exitRect = null;
  const toScr = r => ({ x: r.x * K, y: r.y * K, w: r.w * K, h: r.h * K });
  function occupy(owner, id, x, y, scale) { const [w, h] = KM.Assets.entitySize(id, scale); occ.push({ owner, x: x - w / 2, y: y - h, w, h }); return h; }
  const overlapArea = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  // v11b speech bubbles = Magnus's painted bubbles (handoff UI sheet ui-0 "Speech left" / ui-1 "Speech right", KM_ART11),
  // drawn at exactly source px x artScale (never stretched); the text (30 px, <= 2 lines) sits in the measured interior.
  // The tail is on the left (ui-0) or right (ui-1): the side whose tail tip lands closest to the speaker's head is used.
  // Never over another bubble, the dice, the toast, the spell badge or anyone's head (top of every drawn figure).
  const heads = () => occ.map(o => { if (o.head) return Object.assign({ owner: o.owner }, toScr(o.head)); const r = toScr(o); return { owner: o.owner, x: r.x + r.w * 0.15, y: r.y, w: r.w * 0.7, h: Math.min(r.h * 0.3, 150) }; });
  const BUB = () => { const A11 = window.KM_ART11; if (!A11) return null; const s = L.artScale, out = {};
    for (const side of ["left", "right"]) { const B = A11.bubbles[side], im = KM.Assets.loadImg(A11.root + B.img);
      out[side] = { im, w: B.size[0] * s, h: B.size[1] * s, tip: [B.tip[0] * s, B.tip[1] * s], text: B.text.map(v => v * s) }; }
    return out; };
  let bubArt = null;
  function layoutBubbles() {
    bubArt = bubArt || BUB();
    ctx.font = `${SP.font}px Georgia, serif`;
    const avoid = [], placed = [], HD = heads(), SW = L.scene.w, SH = L.scene.h;
    S.dice.forEach(d => avoid.push(toScr(dieRect(d))));
    if (S.toast) avoid.push(toScr({ x: VW / 2 - 800, y: 30, w: 1600, h: 120 }));
    if (spellBadgeRect()) avoid.push(spellBadgeRect());
    if (S.view && S.view.id === "tavern-interior" && S.view.a >= 1) { const sg = signGeom(KM.RestView.mapper("tavern-interior")); if (sg) avoid.push(toScr(sg.r)); } // v12o: keep the TAVERN FARE sign readable
    if (partyHeartsRect()) avoid.push(partyHeartsRect()); avoid.push(...statusRects()); const hardAvoid = foeHeartsRects().map(r => ({ x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 })); // monster hearts: never under a bubble
    const occS = occ.map(o => Object.assign(toScr(o), { owner: o.owner }));
    for (const b of bubbleQ) {
      b.lines = b.lines || [b.text];
      const hx = b.x * K, hy = b.y * K, others = occS.filter(o => o.owner !== b.owner), tx = hx, ty = hy - 6; // tail target: just above the head
      let best = null, bestCost = Infinity;
      const sides = bubArt ? ["left", "right"] : [null];
      for (const side of sides) {
        const A = side && bubArt[side];
        const w = A ? A.w : Math.ceil(Math.max(...b.lines.map(l => ctx.measureText(l).width))) + SP.padX * 2, h = A ? A.h : b.lines.length * SP.lineH + SP.padY * 2;
        const tip = A ? A.tip : [w / 2, h + 16];
        for (const lift of [0, 30, 60, 100, 150, 210, -60, -120, -180, -240]) for (const dx of [0, -60, 60, -130, 130, -220, 220, -320, 320]) {
          const r = { x: Math.max(6, Math.min(SW - 6 - w, tx - tip[0] + dx)), y: ty - tip[1] - lift, w, h, side };
          if (r.y < 6) r.y = 6; if (r.y + r.h > SH - 6) r.y = SH - 6 - r.h;
          const px = r.x + tip[0], py = r.y + tip[1]; // where the tail tip really ends
          let cost = Math.abs(px - tx) * 0.5 + Math.abs(py - ty) * 0.6 + (py > ty + 40 ? 120 : 0);
          for (const o of avoid.concat(placed)) cost += overlapArea(r, o) * 50;
          for (const o of hardAvoid) cost += overlapArea(r, o) * 1e5;
          for (const o of HD) cost += overlapArea(r, o) * 40;
          for (const o of others) cost += overlapArea(r, o) * 2;
          if (cost < bestCost) { bestCost = cost; best = r; }
        }
      }
      placed.push(best); b.rect = best; b.hx = hx; b.hy = hy;
    }
    for (const b of bubbleQ) drawBubble(b);
  }
  function drawBubble(b) {
    const r = b.rect, ink = "#2a1d12", A = r.side && bubArt && bubArt[r.side];
    ctx.save();
    if (A && A.im._ok) {
      ctx.drawImage(A.im, r.x, r.y, A.w, A.h); // Magnus's painted bubble, exact size
      const [tx0, ty0, tw, th] = A.text, n = b.lines.length;
      ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `${SP.font}px Georgia, serif`;
      b.lines.forEach((l, i) => ctx.fillText(l, r.x + tx0 + tw / 2, r.y + ty0 + th / 2 + (i - (n - 1) / 2) * SP.lineH + 1));
      // the cast line wears Magnus's spell icon on the bubble's top corner (away from the tail)
      if (SPL.cast.some(c => c.text === b.text) && scrollImg.naturalWidth) { const ih = 50, iw = ih * scrollImg.naturalWidth / scrollImg.naturalHeight; ctx.drawImage(scrollImg, r.side === "left" ? r.x + A.w - iw * 0.75 : r.x - iw * 0.25, r.y - ih * 0.45, iw, ih); }
      ctx.restore(); return;
    }
    // fallback (bubble art not loaded yet / missing): the v11 drawn bubble
    ctx.lineJoin = "round"; ctx.fillStyle = "#f6ebcf"; ctx.strokeStyle = ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = `${SP.font}px Georgia, serif`;
    const n = b.lines.length; b.lines.forEach((l, i) => ctx.fillText(l, r.x + r.w / 2, r.y + r.h * 0.45 + (i - (n - 1) / 2) * SP.lineH));
    ctx.restore();
  }
  // ---- v11b Spell of Stupidity badge: on screen (scene, top-left) only while a spell runs; a rolled-scroll stand-in (orange ribbon + seal)
  // (MISSING_ART #34) + the number of easy sums left in big type
  // ---- v11b hearts in the scene: the party's at the top left (in pairs = one pair per member), the monster's small
  // above the monster. Ink hearts: red = full, outline = lost (stand-ins, MISSING_ART #33)
  const HS = 34, HG = 6, PG = 14; // party heart size, gap, extra gap between members (stage px)
  const showHearts = () => !["title", "intro", "name"].includes(S.mode);
  const partyHeartsRect = () => { if (!showHearts()) return null; const n = maxHp(), pairs = Math.ceil(n / HPM()); return { x: 18, y: 16, w: n * (HS + HG) + (pairs - 1) * PG, h: HS }; };
  function heartPath(x, y, s) { // top-left x,y, size s
    ctx.beginPath(); ctx.moveTo(x + s / 2, y + s * 0.95);
    ctx.bezierCurveTo(x - s * 0.05, y + s * 0.55, x - s * 0.02, y + s * 0.05, x + s * 0.27, y + s * 0.06);
    ctx.bezierCurveTo(x + s * 0.42, y + s * 0.07, x + s * 0.5, y + s * 0.2, x + s / 2, y + s * 0.27);
    ctx.bezierCurveTo(x + s * 0.5, y + s * 0.2, x + s * 0.58, y + s * 0.07, x + s * 0.73, y + s * 0.06);
    ctx.bezierCurveTo(x + s * 1.02, y + s * 0.05, x + s * 1.05, y + s * 0.55, x + s / 2, y + s * 0.95); ctx.closePath();
  }
  function heart(x, y, s, full, col) { heartPath(x, y, s); ctx.fillStyle = full ? col : "rgba(239,224,192,.85)"; ctx.fill(); ctx.lineWidth = Math.max(2, s / 12); ctx.strokeStyle = "#2a1d12"; ctx.stroke(); }
  function drawHearts() {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineJoin = "round";
    const r = partyHeartsRect();
    if (r) { let x = r.x; for (let i = 0; i < maxHp(); i++) { if (i && i % HPM() === 0) x += PG; heart(x, r.y, HS, i < S.hp, "#b3321f"); x += HS + HG; } }
    // every living foe: its own small hearts above its head
    foeHeartsRects().forEach(fr => { for (let i = 0; i < fr.shown; i++) heart(fr.x + i * (FS + 3), fr.y, FS, i < fr.full, "#7a1f14"); });
    ctx.restore();
  }
  const FS = 20, FROW = 10; // the monster's small hearts (rows of 10) (stage px), centred just above its head
  function foeHeartsRect() { const e = S.enc; return e && e.act ? foeHeartsRects().find(r => r.owner === e.act) || null : null; }
  function foeHeartsRects() {
    const e = S.enc; if (!e || !e.revealed || !e.act || e.hp <= 0 || !["choose", "math", "spell", "busy"].includes(e.phase)) return [];
    return (e.foes && e.foes.length ? living(e) : [e.act]).map(a => { const o = occ.find(q => q.owner === a); if (!o || a.dead) return null;
      const mx = a.maxHp != null ? a.maxHp : e.maxHp, hp = a.hp != null ? a.hp : e.hp;
      // ONE row at most (Magnus: the mega boss's ~24 hearts were clutter): up to FROW hearts, each worth mx / shown HP;
      // filled = hp rounded UP so a foe with any HP left keeps one filled heart
      // centred on the drawing's opaque middle (KM_WIDE) where it is drawn THIS frame, just above its head (KM_TALL)
      const shown = Math.min(FROW, mx), full = Math.ceil(Math.max(0, hp) / mx * shown - 1e-9), w = shown * (FS + 3) - 3, h = FS;
      const wd = wideOf(a.id), cx = ((a.drawX != null ? a.drawX : screenX(a.x)) + (wd[0] + wd[1]) / 2) * K, top = ((a.drawY != null ? a.drawY : W.groundY) - tallOf(a.id)) * K;
      return { owner: a, id: a.id, hp, max: mx, shown, full, cx, headY: top, x: Math.max(8, Math.min(L.scene.w - 8 - w, cx - w / 2)), y: Math.max(8, top - h - 12), w, h, per: shown }; }).filter(Boolean);
  }
  // v11b: the badge also shows (icon only, no count) while a tavern mead is waiting for / lasting through a battle
  const spellBadgeRect = () => { if (!((S.spellLeft > 0 || S.mead) && S.mode !== "title")) return null; const h = partyHeartsRect(); return { x: h ? Math.max(h.x + h.w, 150) + 26 : 18, y: 6, w: 132, h: 84 }; };
  // the DOM status overlays on the scene (purse under the hearts, meter top centre, distance top right) for bubble avoidance
  const statusRects = () => [...document.querySelectorAll("#hud > *")].map(el => { const r = el.getBoundingClientRect(), sr = $("stage").getBoundingClientRect(), z = sr.width / 1600; return { x: (r.left - sr.left) / z, y: (r.top - sr.top) / z, w: r.width / z, h: r.height / z }; }).filter(r => r.w > 0);
  function drawSpellBadge() {
    const r = spellBadgeRect(); if (!r) return; const ink = "#2a1d12";
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = ink;
    const ih = 46, iw = scrollImg.naturalWidth ? ih * scrollImg.naturalWidth / scrollImg.naturalHeight : ih; // ~ the hearts' size
    if (scrollImg.complete && scrollImg.naturalWidth) ctx.drawImage(scrollImg, r.x, r.y + (r.h - ih) / 2, iw, ih);
    ctx.fillStyle = ink; ctx.font = "bold 44px Georgia, serif"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    if (S.spellLeft > 0) ctx.fillText(String(S.spellLeft), r.x + iw + 8, r.y + r.h / 2 + 4);
    ctx.restore();
  }
  const pushSay = (o, x, headY) => { const c = speechNow(o); if (c) bubbleQ.push({ text: c.join(" "), lines: c, x, y: headY, owner: o }); };
  // distant (pre-commit) creatures: grey, on the hill lane behind the front mist, same native size; closing = stepping forward
  const ML = () => D.scenery.midLane;
  function laneOf(a) {
    // Magnus: enemies never float. Ordinary foes stand ON the ground line from the moment they slide in (grey + misty
    // until the commit = hidden strength); only the optional special creature (Frank's dragon) sits on its hill lane.
    if (a.distant && a.hill) return { y: ML().y, filter: "grayscale(1)", alpha: 1 }; // grey, NOT shrunk (v8); v12g: solid (no mist / see-through)
    if (a.distant) return { y: W.groundY, filter: "grayscale(1) contrast(.7) brightness(1.15)", alpha: 0.85 };
    if (a.closing) { const k = Math.min(1, a.closing.t / a.closing.dur), y0 = a.hill ? ML().y : W.groundY; return { y: y0 + (W.groundY - y0) * k, filter: k < 0.5 ? "grayscale(.6)" : "", alpha: 1 }; }
    return null;
  }
  // v11b roadside scroll stall: Magnus's seller BEHIND the counter (his lower body hidden), the stall drawn in front.
  // Sizes from his reference_scroll_stall.png against the knight (KM_ART11.stall.*.scale = stage px per source px)
  const STALL = () => window.KM_ART11 && KM_ART11.stall;
  function stallRect(a) { const G = STALL(), t = G.stall, w = t.size[0] * t.scale / K, h = t.size[1] * t.scale / K, x = screenX(a.x) - w / 2; return { x, y: W.groundY + 6 - h, w, h }; }
  function drawStall(a) {
    const G = STALL(), r = stallRect(a); if (r.x > VW + 50 || r.x + r.w < -50) return;
    const se = G.seller, sw = se.size[0] * se.scale / K, sh = se.size[1] * se.scale / K, sx = r.x + se.at[0] * r.w, sy = r.y + se.at[1] * r.h;
    const si = KM.Assets.loadImg(KM_ART11.root + se.img), ti = KM.Assets.loadImg(KM_ART11.root + G.stall.img);
    if (si._ok) ctx.drawImage(si, sx, sy, sw, sh);
    if (ti._ok) ctx.drawImage(ti, r.x, r.y, r.w, r.h);
    occ.push({ owner: a, x: r.x, y: r.y, w: r.w, h: r.h });
    pushSay(a, sx + sw * 0.62, sy + 10);
  }
  function drawActor(a) {
    if (a.stall) return drawStall(a);
    if (a.hidden || a.facade || a.eaten) return;
    if (a.distant && (KM_ART.entities[a.id] || {}).onHill && S.swaps) return; // v19: while distant it IS the dragon on the hill strip
    const sx = screenX(a.x); if (sx < -700 || sx > VW + 700) return;
    const ln = laneOf(a);
    let y = (ln ? ln.y : W.groundY) + a.dy;
    const moving = a.state === "walkin" || a.state === "charge" || a.state === "hunt";
    const did = a.state === "newt" ? "newt" : a.id; // newt: its own (missing-art) placeholder, never a shrunken knight
    const fx = actFx(a.id, a.act, a.stop == null || a.hunter ? 1 : -1);
    const action = fx ? fx.action : moving ? "walk" : "idle";
    KM.Assets.drawEntity(ctx, did, sx + (fx ? fx.dx : 0), y + (fx ? fx.dy : 0), { t: fx ? fx.t : moving && KM_ART.walkRate ? a.t * KM_ART.walkRate(did) : a.t, action, hurt: fx && fx.hurt, alpha: a.alpha * (ln ? ln.alpha : 1), flash: a.flash > 0, name: a.label,
      filter: ln && ln.filter, seq: a.seqPlay && a.seqPlay.id, seqT: a.seqPlay && a.seqPlay.t });
    // v18: a separate foreground occluder drawn right after its owner (riddle keeper -> rock), never merged with it
    const fr = (KM_ART.entities[did] || {}).front; if (fr) KM.Assets.drawEntity(ctx, fr, sx, y, { alpha: a.alpha * (ln ? ln.alpha : 1), filter: ln && ln.filter });
    a.drawX = sx + (fx ? fx.dx : 0); a.drawY = y + (fx ? fx.dy : 0); // where it really is this frame (hearts follow a lunge)
    const h = occupy(a, did, sx, y), sa = (KM_ART.entities[did] || {}).sayAt; // sayAt: where his head is (source px from the pivot)
    const sm = L.art * ((KM_ART.entities[did] || {}).artMul || 1); // v12b: the narrator's artMul (Magnus: knight-sized)
    if (sa) { const N = window.KM_NARRATOR, sw = (N ? N.skull.w : 180) * sm; occ[occ.length - 1].head = { x: sx + sa[0] * sm - sw * 0.6, y: y + sa[1] * sm, w: sw * 1.2, h: sw * 1.5 }; } // the skull, not the whole rock
    if (a.state !== "vanish") pushSay(a, sa ? sx + sa[0] * sm : sx, sa ? y + sa[1] * sm : y - h);
  }
  function drawGraves() {
    for (const g of S.graves) {
      const sx = graveSX(g); if (sx < -600 || sx > VW + 600) continue;
      const y = W.groundY; // v12g: on the ground line, like the party
      if (g.deaths.length > 1) KM.Assets.drawEntity(ctx, g.marker, sx - 150, y); // more deaths here: a second stone beside it (same size, solid)
      KM.Assets.drawEntity(ctx, g.marker, sx, y, { name: g.actor.label });
      const h = occupy(g.actor, g.marker, sx, y);
      pushSay(g.actor, sx, y - h);
    }
  }
  const DIE = () => (KM_ART7 && KM_ART7.dice ? KM_ART7.dice.cell[0] : 512) * L.art; // 512-px cell x global factor
  const DIEY = 390; // v11b: 300 + LIFT 90
  const dieRect = d => ({ x: d.x - DIE() / 2, y: DIEY - DIE() / 2, w: DIE(), h: DIE() + 60 });
  function drawFacade(a) { // tavern exterior: dark door backing, (doorway slot), facade cut from Magnus's layered exterior
    const sc = ART7 && KM_ART7.scenes["tavern-exterior"]; if (!sc || !sc.facadeCrop) return;
    const im = KM.RestView.img(sc.facadeCrop.img), bk = KM.RestView.img(sc.doorBackingCrop.img); // v10: paper-graded copies
    const [fx, fy, fw, fh] = sc.facadePlacement, s = L.art * (L.buildingMul || 1), sx = screenX(a.x), x0 = sx - fw * s / 2, y0 = W.groundY + 8 - fh * s;
    if (sx < -fw * s || sx > VW + fw * s) return;
    if (bk._ok) ctx.drawImage(bk, x0, y0, fw * s, fh * s);
    if (S.entering) { // v8: at 1:1 the hero is far taller than the painted door, so he walks to it and fades (no shrink)
      const [dx, , dw] = sc.doorRect, k = Math.min(1, S.entering.t / 0.6);
      const doorX = x0 + (dx - fx + dw / 2) * s, hx = W.partyScreenX + (doorX - W.partyScreenX) * k;
      KM.Assets.drawEntity(ctx, "hero", hx, W.groundY, { alpha: 1 - k });
    }
    // v10: the facade's paper-white walls take the parchment like all road scenery (offline ink, KM.Scenery.drawInked)
    const raw = KM.Assets.loadImg(KM_ART7.root + sc.facadeCrop.img), tint = SCN() && D.scenery.tint && D.scenery.tint.enabled;
    if (tint && raw._ok) KM.Scenery.drawInked(ctx, raw, x0, y0, fw * s, fh * s); else if (im._ok) ctx.drawImage(im, x0, y0, fw * s, fh * s);
    occ.push({ owner: a, x: x0, y: y0, w: fw * s, h: fh * s });
  }
  function drawParty(walking) {
    for (let i = S.party.length - 1; i >= 0; i--) {
      const m = S.party[i]; if (S.entering && m.id === "hero" && S.entering.t < 0.75) continue;
      const id = artId(m), rig = KM_ART.entities[id] && KM_ART.entities[id].walk; // v13 walkers: no procedural bob
      const bob = walking && !rig ? -Math.abs(Math.sin(S.t * 9 + i)) * 9 : 0, y = W.groundY + m.hopY + bob;
      if (m.eaten) continue; // v19: inside the creature's composite eating drawing now
      if (m.dying) { // approved drawn death (KM_ART7.sequences.knight_death): frame-by-frame, held on the last drawing
        const seq = m.dying.seq || (KM_ART.entities[id] || {}).deathSeq || (KM_ART.entities.hero || {}).deathSeq; // own death; companions w/o one: the hero's as a stand-in
        KM.Assets.drawEntity(ctx, id, m.sx, W.groundY, seq ? { seq, seqT: m.dying.t } : { alpha: m.dying.t < 0.6 ? 1 : 0.4, name: S.name });
        continue;
      }
      const fx = actFx(id, m.act, 1);
      KM.Assets.drawEntity(ctx, id, m.sx + (fx ? fx.dx : 0), y + (fx ? fx.dy : 0), { t: fx ? fx.t : walking && rig ? (S.walkT || 0) * KM_ART.walkRate(id) : S.t, action: fx ? fx.action : walking ? "walk" : "idle", hurt: fx && fx.hurt, rot: fx && fx.rot, name: m.id === "hero" ? S.name : shortName(m.name) });
      const h = occupy(m, id, m.sx, y);
      pushSay(m, m.sx, y - h);
    }
  }
  // layered rest views (camp / tavern interior). v8: the 1774x887 canvas is drawn at 1:1 x the global factor (KM.RestView).
  // The scenes are painted at ~1/3 of the character cutouts' pixel scale (the pack's depth proof shows a ~216 px knight),
  // so 1:1 characters cannot sit in the seat slots: the party and the recruits stand on OUR ground line in front of the
  // scene (party left, recruits right). Seated poses at the scene's scale are MISSING ART; the bartender slot stays empty.
  function drawView() {
    const v = S.view, sc = KM.RestView.scene(v.id); if (!sc) return;
    const cands = S.enc && S.enc.st && S.enc.st.cands ? S.enc.st.cands.map((p, j) => p && { p, j }).filter(Boolean) : [];
    ctx.save(); ctx.globalAlpha = v.a; ctx.fillStyle = "#efe3c8"; ctx.fillRect(0, 0, VW, L.artSpaceH); ctx.restore();
    if (SCN()) { ctx.save(); ctx.globalAlpha = v.a; KM.Scenery.draw(ctx, S.camX, S.t, { seed: S.fgSeed, swaps: S.swaps }); ctx.restore(); }
    KM.RestView.draw(ctx, v.id, {}, v.a);
    ctx.save(); ctx.globalAlpha = v.a;
    if (v.id === "tavern-interior" && KM.RestView.scene(v.id).full) { drawTavernInside(cands); ctx.restore(); exitRect = null; return; } // v12o: draws its own party, after the sign
    for (let i = S.party.length - 1; i >= 0; i--) { const mm = S.party[i];
      KM.Assets.drawEntity(ctx, artId(mm), slotX(i), W.groundY, { name: mm.id === "hero" ? S.name : shortName(mm.name) });
      if (v.a >= 1) pushSay(mm, slotX(i), W.groundY - occupy(mm, artId(mm), slotX(i), W.groundY)); }
    if (v.id === "tavern-arrival" && S.hoverSpot === "arrivalDoor" && S.enc && S.enc.phase === "tavernOut") { const r = arrivalDoor(); // subtle ink outline on hover
      ctx.save(); ctx.strokeStyle = "rgba(42,29,18,.85)"; ctx.lineWidth = 5 / K; ctx.setLineDash([16 / K, 10 / K]); ctx.beginPath(); ctx.roundRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16, 18); ctx.stroke(); ctx.restore(); }
    if (v.id !== "tavern-arrival") cands.forEach(({ p, j }, k) => { const x = VW - 300 - k * 330; KM.Assets.drawEntity(ctx, candArt(j), x, W.groundY, { flip: true, name: shortName(p.name) });
      if (v.a >= 1) pushSay(p, x, W.groundY - occupy(p, candArt(j), x, W.groundY)); });
    if (v.a >= 1) S.voices.forEach(q => pushSay(q, q.x, q.y));
    ctx.restore();
    exitRect = null; // the painted EXIT sign (2172x724 source) is ~1300 px wide at 1:1: not drawn; [X]/Esc and the strip button exit
  }
  // ---- v11b tavern interior (Magnus: "you only see info on what you click on"): selectable things = the tavern menu
  // (the TAVERN FARE sign), each recruit, the door. Arrows/A/D move a subtle ink highlight + one name bubble; click works too.
  // v12o (Magnus: "There are actual knight sitting sprites and a bar. Improve this scene"): the recruits SIT, whole body
  // and feet on the floor, on Magnus's v8 stools in front of his v8 bar counter (under the mug shelf). Every position,
  // seat and scale is data: KM_DATA.tavernRoom (src/data/tavern.js). Seated sheets keep the v11b head match to the walks
  // (feather 0.52: helm 0.525 / shoulders 0.517; scarf 0.5: head 0.45 / shoulders 0.59, geometric mean within 3 %).
  // A recruit whose look has no seated pose (moustache / stripe / coif) stands at his seat by the bar, facing the party.
  const SKIN_OF = { follower_1: "scarf", follower_2: "feather", follower_3: "moustache", follower_4: "stripe", follower_5: "coif" };
  const TR = () => D.tavernRoom;
  function propRect(name, cx, feetY) { // a room prop (crop of a v8 layer) standing on feetY, centred on cx: source px x artScale x propMul
    const P = TR().props[name], k = L.art * TR().propMul, w = P.crop[2] * k, h = P.crop[3] * k;
    return { P, x: cx - w / 2, y: feetY - h, w, h };
  }
  function drawProp(r) { const im = KM.RestView.img(r.P.img); if (im && im._ok) ctx.drawImage(im, r.P.crop[0], r.P.crop[1], r.P.crop[2], r.P.crop[3], r.x, r.y, r.w, r.h); }
  // where recruit j (of the stop's n) sits or stands: pure geometry, shared by drawing and hit-testing
  function seatGeom(j, n) {
    const R = TR(), xs = R.seats[Math.min(Math.max(n, 1), 3)], x = xs[Math.min(j, xs.length - 1)], feetY = W.groundY - R.seatBack, hw = R.hotspotW;
    const skin = SKIN_OF[candArt(j)], F = R.sitters[skin], SE = F && window.KM_ART11 && KM_ART11.seated && KM_ART11.seated[skin];
    if (!SE) { const top = feetY - KM.Assets.entityHeight(candArt(j)); return { stand: true, x, feetY, top, hot: { x: x - hw / 2, y: top, w: hw, h: feetY - top } }; }
    const k = L.art * F.mul, top = feetY - F.foot * k;
    return { x, feetY, top, img: KM_ART11.root + SE.img, r: { x: x - F.seatX * k, y: top, w: SE.size[0] * k, h: SE.size[1] * k },
      stool: propRect(F.stool, x, feetY), hot: { x: x - F.seatX * k, y: top, w: SE.size[0] * k, h: feetY - top } };
  }
  // the doorway in Magnus's reference_tavern_fullscreen exterior (scene-tavern-arrival.png source px): click = go in
  const ARRIVAL_DOOR = [1670, 520, 270, 380], arrivalDoor = () => tvImgRect(KM.RestView.mapper("tavern-arrival"), ARRIVAL_DOOR);
  const tvImgRect = (m, r) => ({ x: (m.x0 + r[0] * m.s), y: (m.y0 + r[1] * m.s), w: r[2] * m.s, h: r[3] * m.s }); // source px -> layout
  // v12q (Magnus): Maggi's hanging sign IS the tavern menu (KM_DATA.tavernRoom.sign). Mead / Stew / Fire bottle are
  // lines on its board: hover / arrows light a line (orange underline), click / Enter / 1-2-3 buy, an item you can't have
  // is greyed. The board swings about the chains' bar when knocked (a buy); the iron bracket stays on the wall.
  const SG = () => D.tavernRoom.sign;
  function signGeom() {
    const G = SG(); if (!G) return null; const k = G.scale / K, x = G.atStage[0] / K, y = G.atStage[1] / K, w = G.size[0] * k, h = G.size[1] * k;
    return { G, k, nx: x + G.pivot[0] * k, ny: y + G.pivot[1] * k, w, h, r: { x, y, w, h } };
  }
  // the fare on the sign, in order (tavern rest type: mead, stew, + the fire bottle where it is sold); buy = the existing
  // purchase (each one refuses on its own and has the barkeep say why: limits, "That's your lot.", one mead at a time)
  function fareItems() {
    const e = S.enc; if (!e || !e.st || !e.st.rest) return []; const T = restT(), M = T.mead, h = T.heals && T.heals[0], out = [];
    if (M) { const lot = fareLeft("mead") <= 0; out.push({ id: "mead", label: M.short || "Mead", cost: M.cost, lot, off: lot || S.gold < M.cost || !!S.mead, buy: buyMead }); }
    if (h) { const lot = fareLeft("stew") <= 0; out.push({ id: "stew", label: h.short || "Stew", cost: h.cost, lot, off: lot || S.gold < h.cost || S.hp >= maxHp(), buy: () => restHeal(h.key) }); }
    if (IT.sellAt.includes(e.st.rest)) out.push({ id: "fire", label: IT.name, cost: IT.price, lot: false, off: S.gold < IT.price || S.bottles >= IT.max, buy: buyBottle });
    return out;
  }
  const fareIcon = id => KM.Assets.loadImg(id === "fire" ? IT.art.dir + IT.art.icon : SG().root + SG().icons[id]);
  function fareLines(sg, n) { // line i's rect in sign px (the safe rect split evenly) and in layout units (unswung)
    const [sx, sy, sw, sh] = sg.G.safe, lh = sh / Math.max(n, 1);
    return Array.from({ length: n }, (_, i) => ({ src: [sx, sy + i * lh, sw, lh], r: { x: sg.r.x + sx * sg.k, y: sg.r.y + (sy + i * lh) * sg.k, w: sw * sg.k, h: lh * sg.k } }));
  }
  function swingSign(deg) { const e = S.enc; if (e && e.tv) e.tv.swing = { t0: performance.now(), a0: deg }; }
  const signAngle = () => { const sw = S.enc && S.enc.tv && S.enc.tv.swing, W2 = SG().swing; if (!sw) return 0; const t = (performance.now() - sw.t0) / 1000;
    if (t > W2.dur) { S.enc.tv.swing = null; return 0; } return sw.a0 * Math.exp(-t / W2.tau) * Math.cos(2 * Math.PI * t / W2.period) * Math.PI / 180; };
  function drawSign(selId) {
    const sg = signGeom(); if (!sg) return; const G = sg.G, im = KM.Assets.loadImg(G.root + G.img); if (!im._ok) return;
    const k = sg.k, ox = -G.pivot[0] * k, oy = -G.pivot[1] * k, clip = (rects, invert) => { ctx.beginPath();
      if (invert) { ctx.rect(ox, oy, sg.w, sg.h); G.fixed.forEach(f => ctx.rect(ox + f[0] * k, oy + f[1] * k, f[2] * k, f[3] * k)); ctx.clip("evenodd"); return; } // board = all minus the bracket
      else rects.forEach(f => ctx.rect(ox + f[0] * k, oy + f[1] * k, f[2] * k, f[3] * k)); ctx.clip(); };
    ctx.save(); ctx.translate(sg.nx, sg.ny);
    ctx.save(); clip(G.fixed); ctx.drawImage(im, ox, oy, sg.w, sg.h); ctx.restore();                 // the bracket, still
    ctx.rotate(signAngle()); ctx.save(); clip(null, true); ctx.drawImage(im, ox, oy, sg.w, sg.h); ctx.restore(); // the board, swinging
    const items = fareItems(), lines = fareLines(sg, items.length), px = v => v / K; // stage px -> layout
    const ip = px(G.icon), gap = px(G.gap), pp = px(G.purse), purse = window.KM_ART11 && KM_ART11.purse && KM.Assets.loadImg(KM_ART11.root + KM_ART11.purse.img);
    let fs = px(G.font); ctx.font = `${fs}px Georgia, serif`;                                       // shrink to fit the widest line
    const need = Math.max(...items.map(it => ip + gap + ctx.measureText(it.label).width + gap * 2 + pp + ctx.measureText(String(it.cost)).width)), room = G.safe[2] * k;
    if (need > room) fs *= room / need; ctx.font = `${fs}px Georgia, serif`; S.signFontStage = fs * K;
    ctx.textBaseline = "middle";
    items.forEach((it, i) => { const L0 = lines[i].src, x0 = ox + L0[0] * k, x1 = x0 + L0[2] * k, cy = oy + (L0[1] + L0[3] / 2) * k, ink = it.off ? G.off : G.ink;
      ctx.save(); if (it.off) { ctx.globalAlpha = 0.45; ctx.filter = "grayscale(1)"; }
      const ic = fareIcon(it.id); if (ic._ok) { const s2 = Math.min(ip / ic.naturalWidth, ip / ic.naturalHeight), w2 = ic.naturalWidth * s2, h2 = ic.naturalHeight * s2; ctx.drawImage(ic, x0 + (ip - w2) / 2, cy - h2 / 2, w2, h2); }
      const cw = ctx.measureText(String(it.cost)).width;
      if (purse && purse._ok) { const s3 = pp / Math.max(purse.naturalWidth, purse.naturalHeight); ctx.drawImage(purse, x1 - cw - gap / 2 - purse.naturalWidth * s3, cy - purse.naturalHeight * s3 / 2, purse.naturalWidth * s3, purse.naturalHeight * s3); }
      ctx.restore();
      ctx.fillStyle = ink; ctx.textAlign = "left"; ctx.fillText(it.label, x0 + ip + gap, cy + fs * 0.04);
      ctx.textAlign = "right"; ctx.fillText(String(it.cost), x1, cy + fs * 0.04);
      if (selId === it.id) { const lw = ctx.measureText(it.label).width; ctx.fillStyle = G.lit; ctx.fillRect(x0 + ip + gap, cy + fs * 0.55, lw, px(G.underline)); } // lit line
    });
    ctx.restore();
  }
  function tvSpots() {
    const e = S.enc; if (!e || !S.view || S.view.id !== "tavern-interior") return [];
    const m = KM.RestView.mapper("tavern-interior"), sg = signGeom(), items = fareItems(), lines = sg ? fareLines(sg, items.length) : [];
    const out = items.map((it, i) => ({ id: "fare:" + it.id, kind: "fare", item: it.id, name: it.label, r: lines[i].r }));
    const n = (e.st.cands || []).length;
    (e.st.cands || []).forEach((p, j) => { if (p) out.push({ id: "npc" + j, kind: "npc", j, p, name: shortName(p.name), r: seatGeom(j, n).hot }); });
    out.push({ id: "door", kind: "door", name: "The door", r: tvImgRect(m, [3150, 280, 360, 800]) });
    return out;
  }
  function buyFare(id) { const it = fareItems().find(f => f.id === id); if (!it) return; swingSign(SG().swing.deg); A.play("ui_click"); it.buy(); renderTavernInside(); }
  function drawTavernInside(cands) {
    const e = S.enc, tv = e && e.tv, spots = tvSpots(); if (tv && tv.sel >= spots.length) tv.sel = Math.max(0, spots.length - 1);
    const cur = tv && spots[tv.sel]; drawSign(cur && cur.kind === "fare" ? cur.item : null);
    const R = TR(), n = (e.st.cands || []).length;
    drawProp(propRect("counter", R.bar.x, W.groundY - R.bar.back)); // the bar, against the back wall
    for (let i = S.party.length - 1; i >= 0; i--) { const mm = S.party[i];
      KM.Assets.drawEntity(ctx, artId(mm), slotX(i), W.groundY, { name: mm.id === "hero" ? S.name : shortName(mm.name) });
      if (S.view.a >= 1) pushSay(mm, slotX(i), W.groundY - occupy(mm, artId(mm), slotX(i), W.groundY)); }
    cands.forEach(({ p, j }) => { const g = seatGeom(j, n);
      if (g.stand) KM.Assets.drawEntity(ctx, candArt(j), g.x, g.feetY, { flip: true, name: shortName(p.name) }); // facing the party
      else { drawProp(g.stool); const im = KM.Assets.loadImg(g.img); if (im._ok) ctx.drawImage(im, g.r.x, g.r.y, g.r.w, g.r.h); } // on the stool, facing the party
      if (S.view.a >= 1) { occ.push(Object.assign({ owner: p }, g.hot)); pushSay(p, g.x, g.top); }
    });
    if (S.view.a >= 1) S.voices.forEach(q => pushSay(q, q.x, q.y));
    if (tv && spots[tv.sel] && spots[tv.sel].kind !== "fare") { // subtle ink outline on the highlighted recruit / door + its name in one small bubble (fare: lit on the sign)
      const sp = spots[tv.sel], r = sp.r; ctx.save(); ctx.strokeStyle = "rgba(42,29,18,.85)"; ctx.lineWidth = 5 / K; ctx.setLineDash([16 / K, 10 / K]);
      ctx.beginPath(); ctx.roundRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16, 18); ctx.stroke(); ctx.restore();
      if (!(sp.p && speechNow(sp.p))) { tvName.text = sp.name; bubbleQ.push({ text: sp.name, lines: [sp.name], x: r.x + r.w / 2, y: r.y, owner: tvName }); }
    }
  }
  const tvName = { text: "" };
  // v11b (Magnus: clean, but no click-fest): the highlighted thing's options are on the strip straight away, one keypress
  // each: sign -> 1 Mead, 2 Stew (buy again and again); recruit -> 1 Join my party?; door -> 1 Go outside, 2 Walk on.
  // ←/→ (A/D) move the highlight, Enter = the main action, Esc = go outside. No open/close step.
  function renderTavernInside() {
    const e = S.enc, T = restT(); e.phase = "rest"; e.tv = e.tv || { sel: 0, open: null };
    const spots = tvSpots(); if (e.tv.sel >= spots.length) e.tv.sel = spots.length - 1;
    const sp = spots[e.tv.sel]; e.tv.open = sp ? sp.id : null;
    if (!sp) return showPanel(`<div class="center tavernp"><div class="prompt">Look around</div></div>`, "rest");
    const pl = [];
    if (sp.kind === "fare") { // v12q: the fare is on the sign itself; nothing on the strip
    } else if (sp.kind === "npc") pl.push(move("1", esc(D.recruitTalk.ask), "tvJoin", "", `data-n="1" data-j="${sp.j}"`, partyFull()));
    else { pl.push(move("1", "Go outside", "leaveInside", "", `data-n="1"`)); pl.push(move("2", "Walk on", "leaveRest", "", `data-n="2"`)); }
    showPanel(`<div class="center tavernp"><div class="opts big3 turn moves tvmenu">${pl.join("")}</div></div>`, "rest");
  }
  function tvMove(d) { const e = S.enc, n = tvSpots().length; if (!e || !e.tv || !n || e.phase !== "rest") return; e.tv.sel = (e.tv.sel + d + n) % n; A.play("ui_click"); renderTavernInside(); } // a small nudge on highlight
  function tvOpen(i) { const e = S.enc, spots = tvSpots(); if (!e || !e.tv || e.phase !== "rest") return; if (i != null) e.tv.sel = i; const sp = spots[e.tv.sel]; if (!sp) return; A.play("ui_click");
    if (sp.kind === "fare") return buyFare(sp.item); // v12q: click / Enter on a sign line buys it
    else if (sp.kind === "npc" && i == null) tvJoin(sp.j); // Enter on a recruit = "Join my party?"
    else if (sp.kind === "door" && i == null) leaveInside(); else renderTavernInside(); }
  function tvBack() { const e = S.enc; if (!e || !e.tv || e.phase !== "rest") return; leaveInside(); }
  function drawToast() {
    const tt = S.toast, a = Math.min(1, tt.t / 0.3, (tt.dur - tt.t) / 0.5);
    ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.font = "italic 50px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const w = ctx.measureText(tt.text).width + 90, x = VW / 2 - w / 2, y = 44;
    ctx.fillStyle = "rgba(250,244,228,.94)"; ctx.strokeStyle = "#1b1410"; ctx.lineWidth = 4; ctx.fillRect(x, y, w, 90); ctx.strokeRect(x, y, w, 90);
    ctx.fillStyle = "#1b1410"; ctx.fillText(tt.text, VW / 2, y + 47); ctx.restore();
  }
  function draw() {
    bubbleQ = []; occ = [];
    const sh = S.shake > 0 ? [rnd(-10, 10), rnd(-8, 8)] : [0, 0];
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(K, 0, 0, K, sh[0] * K, sh[1] * K);
    const live = S.actors.filter(a => a.active && !a.dead);
    if (S.view && S.view.a >= 1) drawView();
    else {
      if (SCN()) KM.Scenery.draw(ctx, S.camX, S.t, { seed: S.fgSeed, swaps: S.swaps, keepOut: foeHeartsRects().concat(partyHeartsRect() ? [partyHeartsRect()] : [], statusRects()).map(r => ({ x: r.x / K, y: r.y / K, w: r.w / K, h: r.h / K })), midLane: () => { live.filter(a => a.distant && a.hill).forEach(drawActor); } });
      else { KM_ART.layers.forEach(Ly => KM.World.drawLayer(ctx, Ly, S.camX, S.t)); live.filter(a => a.distant && a.hill).forEach(drawActor); }
      S.skyEvents.forEach(s => KM.Assets.drawEntity(ctx, "sky_dragon", s.x, s.y + Math.sin(s.t * 4) * 14, { scale: 0.6 })); // v12g: solid
      if (SCN()) S.trees.forEach(tr => { const x = screenX(tr.x); if (x > -600 && x < VW + 600) KM.Scenery.tree(ctx, tr.i, x); });
      S.props.forEach(p => { const x = screenX(p.x); if (x > -400 && x < VW + 400) KM.Assets.drawEntity(ctx, p.id, x, W.propLaneY, { scale: W.propScale, alpha: W.propAlpha }); });
      S.obstacles.forEach(o => { const x = screenX(o.x); if (x > -400 && x < VW + 400) KM.Assets.drawEntity(ctx, o.id, x, W.groundY + 10); });
      drawGraves(); // v12g: graves are road props on the ground line (behind the party and road actors)
      const behind = a => (a.back || a.narrator) && !(a.distant && a.hill);
      live.filter(a => a.facade).forEach(drawFacade);
      live.filter(behind).forEach(drawActor);
      const lunging = S.party[0] && S.party[0].act && S.party[0].act.name === "attack"; // the striker is drawn on top of his target
      if (!lunging) drawParty(isWalking());
      live.filter(a => !behind(a) && !(a.distant && a.hill) && !(a.act && a.act.name === "attack")).forEach(drawActor);
      if (lunging) drawParty(isWalking());
      live.filter(a => !behind(a) && !(a.distant && a.hill) && a.act && a.act.name === "attack").forEach(drawActor);
      KM.FireFx.draw(ctx); // v12k fire bottle: in front of the foes, under the front ground
      if (SCN()) KM.Scenery.foreground(ctx, S.camX, fgSeed(), W.partyScreenX); // v10 frontGround: over the feet, below effects/UI
      if (!SCN()) KM_ART.foreground.forEach(Ly => KM.World.drawLayer(ctx, Ly, S.camX, S.t));
      if (S.view) drawView();
    }
    S.dice.forEach(d => KM.D20.draw(ctx, d, d.x, DIEY, DIE()));
    if (S.toast) drawToast();
    S.floats.forEach(f => { ctx.globalAlpha = Math.max(0, 1 - f.t / 1.8); ctx.fillStyle = f.color; ctx.strokeStyle = "#000"; ctx.lineWidth = 6; ctx.font = "bold 46px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.strokeText(f.text, f.x, f.y - f.t * 40); ctx.fillText(f.text, f.x, f.y - f.t * 40); ctx.globalAlpha = 1; });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawHearts(); drawSpellBadge();
    layoutBubbles();
  }

  // ---------- layout + stage scaling ----------
  function applyLayout() {
    const sc = L.scene, st = L.strip;
    cv.width = sc.w; cv.height = sc.h;
    Object.assign(cv.style, { left: sc.x + "px", top: sc.y + "px", width: sc.w + "px", height: sc.h + "px" });
    Object.assign($("strip").style, { left: st.x + "px", top: st.y + "px", width: st.w + "px", height: st.h + "px" });
    const r = document.documentElement.style;
    r.setProperty("--divider-h", L.dividerH + "px"); r.setProperty("--strip-h", st.h + "px");
    skinStrip();
  }
  // Strip skin: painted parchment/divider if provided by an art pack, else CSS fallback. A painted strip that already
  // carries the ground line (hasDivider) hides the CSS divider: the ground IS the separator.
  function skinStrip() {
    const bg = KM.Assets.uiSrc("strip_bg"), dv = KM.Assets.uiSrc("divider"), own = !!(bg && KM_ART.ui.strip_bg && KM_ART.ui.strip_bg.hasDivider);
    $("strip").classList.toggle("painted", !!bg); $("strip").style.backgroundImage = bg ? `url("${bg}")` : "";
    if (bg) { const sz = (window.KM_ART7 && KM_ART7.strip_bg.size) || [1774, 290]; // v8: native px x global factor, repeat-x, no stretch
      $("strip").style.backgroundSize = `${sz[0] * L.artScale}px ${sz[1] * L.artScale}px`; $("strip").style.backgroundRepeat = "repeat-x"; }
    // v9: one continuous parchment sheet: the strip continues the scene's mirrored parchment tiles + the divider's ink only
    // v10: painted into a <canvas> behind the strip content (no data URL, so it also works when opened from file://)
    let sc = $("stripSheet");
    if (own && SCN() && !sc) { sc = document.createElement("canvas"); sc.id = "stripSheet"; $("strip").prepend(sc); }
    if (sc && (sc.width !== L.strip.w || sc.height !== L.strip.h)) { sc.width = L.strip.w; sc.height = L.strip.h; }
    const sheet = own && SCN() && KM.Scenery.stripBackground(sc);
    if (sheet) { $("strip").style.backgroundImage = "none"; $("strip").dataset.sheet = "1"; }
    else if (own && ART7 && !(skinStrip.tries > 40)) { skinStrip.tries = (skinStrip.tries || 0) + 1; setTimeout(skinStrip, 250); } // images still loading
    // v11b: Magnus's divider line (KM_ART11.divider) replaces every drawn / CSS / strip_bg divider, in every scene (the strip
    // is shared): 26.5 stage px under the ground line, ornament centred on x 800 (= the centred question), one uniform
    // scale (0.742 stage px per source px) so it spans 98.1 % of the width like reference_composition_divider.png
    const DV = window.KM_ART11 && KM_ART11.divider;
    if (DV && !dv) { // (an art pack that registers its own ui.divider still wins)
      const d = $("divider"), s = DV.scale, y = W.groundY * K + DV.belowGround - L.scene.h;
      d.className = "magnus"; d.style.backgroundImage = "";
      const pos = `left:${(L.stage.w / 2 - DV.ornament[0] * s).toFixed(2)}px;top:${(y - DV.ornament[1] * s).toFixed(2)}px;width:${(DV.size[0] * s).toFixed(2)}px;height:${(DV.size[1] * s).toFixed(2)}px`;
      d.innerHTML = `<img src="${KM_ART11.root + DV.img}" alt="" style="${pos}"><canvas id="dvfill" width="${DV.size[0]}" height="${DV.size[1]}" style="position:absolute;${pos};opacity:0"></canvas>`;
      { const im = d.querySelector("img"), paint = () => { const c = $("dvfill"); if (!c) return; const x = c.getContext("2d"); x.clearRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0);
          x.globalCompositeOperation = "source-in"; x.fillStyle = DVORANGE; x.fillRect(0, 0, c.width, c.height); // v12c answer timer: the same ink, in the ornament's orange
          x.globalCompositeOperation = "source-over"; x.clearRect(DV.ornament[0] - DVORN, 0, DVORN * 2, c.height); dvFillFrac = -1; }; // the ornament itself is never tinted
        im.complete && im.naturalWidth ? paint() : im.addEventListener("load", paint); }
    } else {
      $("divider").classList.toggle("painted", !!dv); $("divider").style.backgroundImage = dv ? `url("${dv}")` : "";
      $("divider").classList.toggle("hidden", own);
    }
  }
  function fit() {
    const st = $("stage"), s = Math.min(innerWidth / L.stage.w, innerHeight / L.stage.h);
    st.style.transform = `scale(${s})`; st.style.left = (innerWidth - L.stage.w * s) / 2 + "px"; st.style.top = (innerHeight - L.stage.h * s) / 2 + "px";
  }
  addEventListener("resize", fit); fit();
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * S.speedMul; last = now;
    update(dt); draw(); requestAnimationFrame(frame);
  }

  window.__km = {
    S, L, strength, maxHp, leagues, lungeDbg: () => [lungeReach(S.party[0], S.enc && S.enc.act), S.party[0].sx, S.enc && screenX(S.enc.act.x), wideOf(artId(S.party[0])), S.enc && wideOf(S.enc.act.id)], partyFull, weakDmg, hardDmg, rerenderMath: () => S.enc && S.enc.phase === "math" && renderMath(), setSpeed: k => (S.speedMul = k), audioLog: A.log, audioCounts: A.counts, forceRoll: 0, forceContest: null, props: () => S.props,
    answer: () => (S.enc && S.enc.phase === "math" && S.enc.problem ? S.enc.problem.answer : null), phase: () => S.enc && S.enc.phase, mode: () => S.mode,
    voLog: A.voLog, music: () => MU.state(), musicLog: MU.log,
    graves: () => S.graves.map(g => ({ cam: g.cam, wx: g.wx, n: g.deaths.length, marker: g.marker, killer: g.killer, done: g.done, sx: graveSX(g) })),
    respect: () => S.respect && { t: S.respect.t, cam: S.respect.g.cam }, further: () => S.furtherDone, toast: () => S.toast && S.toast.text, view: () => S.view && S.view.id, arrivalDoor: () => S.view && S.view.id === "tavern-arrival" ? arrivalDoor() : null, hoverSpot: () => S.hoverSpot,
    hunters: () => S.hunters, enemy: () => (S.enc && S.enc.revealed ? { id: S.enc.act.id, hp: S.enc.hp, maxHp: S.enc.maxHp, atk: S.enc.atk } : null),
    dice: () => S.dice.map(d => ({ result: d.result, done: d.done })), spell: () => ({ charges: S.spells, left: S.spellLeft, problem: S.enc && S.enc.problem ? { text: S.enc.problem.text, stupid: !!S.enc.problem.stupid, level: S.enc.problem.level } : null }),
    chunks: t => chunksOf(t), speechOverflow: () => speechOverflow.slice(),
    bubbles: () => bubbleQ.filter(b => b.rect).map(b => Object.assign({ text: b.text, lines: b.lines.slice(), font: SP.font, art: !!(b.rect.side && bubArt), textW: Math.max(...b.lines.map(l => (ctx.font = `${SP.font}px Georgia, serif`, ctx.measureText(l).width))), maxW: SP.maxW }, b.rect)),
    statusRects: () => statusRects(),
    tavern: () => S.enc && S.enc.tv ? { sel: Math.min(S.enc.tv.sel, tvSpots().length - 1), open: S.enc.tv.open, spots: tvSpots().map(q => ({ id: q.id, kind: q.kind, item: q.item, name: q.name, r: q.r })) } : null,
    heartsUI: () => ({ party: partyHeartsRect() && Object.assign({ hp: S.hp, max: maxHp() }, partyHeartsRect()), foe: foeHeartsRect() && Object.assign({ hp: S.enc.hp, max: S.enc.maxHp }, foeHeartsRect()) }),
    spellBadge: () => spellBadgeRect() && Object.assign({ left: S.spellLeft, mead: S.mead }, spellBadgeRect()), mead: () => ({ state: S.mead, now: meadNow() }), group: () => S.enc && S.enc.foes ? S.enc.foes.map(a => ({ id: a.id, hp: a.hp, maxHp: a.maxHp, gone: !!a.gone, x: a.x, sx: screenX(a.x), state: a.state, ext: wideOf(a.id) })) : null,
    foeHearts: () => foeHeartsRects().map(r => ({ id: r.id, hp: r.hp, max: r.max, shown: r.shown, full: r.full, x: r.x, y: r.y, w: r.w, h: r.h })),
    forceGroup: (ids) => { const i = S.stops.findIndex((s2, k) => k >= S.stop && s2.type === "math"); const st = S.stops[i]; if (!st) return null;
      S.actors = S.actors.filter(a => !(a.stop === i && a.extra)); st.group = ids; addGroup(st, i); const m = S.actors.find(a => a.stop === i && a.main);
      if (m) { m.homeX = st.homeX; if (!m.active) { m.x = st.stopX + 500; m.state = "waiting"; } } return i; },
    foeFeet: () => S.actors.filter(a => a.foe && !a.dead && !a.hidden).map(a => { const ln = laneOf(a), fx = actFx(a.id, a.act, -1); return { id: a.id, state: a.state, hill: !!a.hill, distant: !!a.distant, sx: screenX(a.x), feetY: (ln ? ln.y : W.groundY) + a.dy + (fx ? fx.dy : 0), groundY: W.groundY }; }), fareLeft: k => fareLeft(k), fare: () => fareItems().map(({ id, label, cost, off, lot }) => ({ id, label, cost, off, lot, icon: fareIcon(id)._ok })), signFont: () => S.signFontStage, signAngle: () => signAngle() * 180 / Math.PI, sign: () => { const g = signGeom(); return g && { r: g.r, k: g.k, nail: [g.nx, g.ny] }; },
    heads: () => heads().map(({ x, y, w, h }) => ({ x, y, w, h })), speechLog: () => speechLog.slice(), speaking: () => [...speakers].filter(o => o.sp).map(o => speechNow(o).join(" ")),
    panelText: () => panel.innerText, answerTimer: () => S.enc && S.enc.tmr ? { t: S.enc.tmr.t, secs: S.enc.tmr.secs, frac: Math.min(1, S.enc.tmr.t / S.enc.tmr.secs) } : null,
    bottles: () => S.bottles, spelling: () => S.enc && S.enc.spell ? Object.assign({ phase: S.enc.phase }, S.enc.spell) : null, fireFx: () => KM.FireFx.state(), timedOut: () => S.enc && S.enc.timedOut || 0, dvFill: () => dvFillFrac
  };

  // v19 debug hook, OFF unless the page is opened with ?debug (screenshots / quick checks): jump the road to the first stop
  // matching `want` (a type, enemy, npc or id, e.g. "mega", "frank", "toad") with `looks` = follower skins (1-5) in the party.
  if (/[?&]debug\b/.test(location.search)) window.__km.debugJump = (want, looks = []) => {
    const i = S.stops.findIndex(st => [st.type, st.enemy, st.npc, st.id, st.rest].includes(want)); if (i < 0) return false;
    hush(); S.runId = S.runId || "run-debug"; S.name = S.name === "Nobody" ? "Magnus" : S.name;
    const party = [newMember("hero", slotX(0))].concat(looks.map((k, j) => Object.assign(followerFrom(D.recruitPool[j % D.recruitPool.length], slotX(j + 1), k), { skin: k })));
    applyCore(Object.assign(core(), { stop: i, party, hp: HPM() * party.length, hunters: 0 })); S.mode = "walk"; MU.setScene("walk"); renderWalk(); return S.stops[i];
  };

  (async function boot() {
    KM.Assets.preloadGlyphs(); applyLayout();
    const ms = KM.Save.musicSettings(); MU.settings({ volume: ms.volume == null ? D.music.volume : ms.volume, muted: ms.muted });
    MU.onChange(m => KM.Save.saveMusic(m));
    if (ART7) KM.Scenery.preload(); // v12f: road / title art first (KM.Loader); the rest views stream in after the bar
    await Promise.all([KM.Assets.loadPacks(KM_ART.packs), KM.Audio.init()]);
    skinStrip(); setTimeout(skinStrip, 600);
    showTitle(); requestAnimationFrame(frame);
    if (KM.Loader) { await KM.Loader.ready(); KM.Loader.finish(); skinStrip(); }
    if (ART7) ["camp", "tavern-interior", "tavern-arrival"].forEach(KM.RestView.preload);
    KM.FireFx.preload(); KM.Spelling.preload(); // v12k: after the bar
  })();
})();
