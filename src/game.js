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
  const T = s => KM.I18n?.t(s) ?? String(s);
  const G = s => KM.Assets.glyphHTML(s);
  // v12e: an option = the open plaque button (label only); the key is a silent shortcut
  // v12e (Magnus): every choice is the battle's open plaque button; no visible key labels (the keys still work)
  const opt = (key, label, act, attrs = "", off = false) => `<button class="opt plaque" data-act="${act}" ${attrs} ${off ? "disabled" : ""}>${BANNER}<span class="nm">${label}</span></button>`;
  const sketch = KM.Sketchbook;
  const ART7 = !!window.KM_ART7, SCN = () => !!sketch || (ART7 && KM.Scenery.available());

  const S = {
    chapter: KM.Tomb?.requested()?"tomb":KM.HollowWood?.requested()?"hollowwood":"village", challengeMode: "math", mode: "title", t: 0, speedMul: 1, camX: 0, name: "Nobody", hp: D.party.heartsPerMember, gold: 0, score: 0, scoreLedger: KM.Score.empty(), riddleSolved: [], wizardUnlocked:false, lightning:null, hunters: 0, spells: 0, spellLeft: 0, mead: 0, bottles: 0,
    party: [], pendingDismissal: null, loot: [], stop: 0, stops: [], actors: [], obstacles: [], props: [], trees: [], floats: [], skyEvents: [], timers: [],
    enc: null, dice: [], stats: { correct: 0, wrong: 0, riddles: 0, sacrificed: 0 }, usedRiddles: [], tavernRecruits: {}, restUses: {}, routeVersion: 3,
    checkpoint: null, shake: 0, banner: null, winT: 0, stepT: 0, nextSky: 8, intro: null, dist: 0, fid: 0, runId: "",
    graves: [], companionGraves: [], respect: null, bestAtStart: 0, furtherDone: false, toast: null, view: null, dying: null, voices: []
  };
  // Every transition resolves music against the current chapter, including resumed runs.
  const musicScene = name => MU.setScene(name, S.chapter);
  const inTomb = () => !!KM.Tomb?.active(S);
  const tombTest = () => inTomb() && !!KM.Tomb?.requested(); // the standalone ?preview=tomb test, not the campaign crypt
  function syncChapterFlag(){const st=$("stage");if(!st)return;if(S.chapter==='tomb'){st.dataset.tomb='true';$("sky-title").hidden=true;}else delete st.dataset.tomb;}
  const isKnight = () => S.challengeMode === 'knight';
  const isFellowship = () => S.challengeMode === 'fellowship';
  const modeName = () => isFellowship()?'The Fellowship':isKnight()?'The Knight':'The Village Idiot';
  function setChallengeMode(value){S.challengeMode=['knight','fellowship'].includes(value)?value:'math';KM.Save.selectMode(S.challengeMode);$("stage").dataset.challengeMode=S.challengeMode;}
  // Retired mode links/preferences fall back safely; their old run and score data stay archived.
  try {
    const queryMode=new URLSearchParams(location.search).get('mode');
    const preferredMode=localStorage.getItem('knightMath.mode');
    setChallengeMode(queryMode || preferredMode);
    if(preferredMode && !['math','knight','fellowship'].includes(preferredMode))localStorage.setItem('knightMath.mode',S.challengeMode);
    if(queryMode && !['math','knight','fellowship'].includes(queryMode)){
      const url=new URL(location.href);url.searchParams.set('mode',S.challengeMode);history.replaceState(null,'',url);
    }
  } catch (_) { setChallengeMode('math'); }
  function chooseMode(value){if(S.mode!=='title')return;setChallengeMode(value);try{localStorage.setItem('knightMath.mode',S.challengeMode);}catch(_){}showTitle();}
  // scheduled steps run on game time (so test speed-ups apply)
  const later = (secs, fn) => S.timers.push({ at: S.t + secs, fn });

  // ---------- party / stats ----------
  // party: hero + up to D.party.maxFollowers followers (GAME_DESIGN: max 4 incl. the player)
  const memberName = m => (m.id === "hero" ? (PA.villager(m) && artId(m) !== "hero" ? S.name : (KM.I18n?.jp()?"騎士 ":"Sir ") + S.name) : m.name);
  const knights = () => S.party.filter(m => m.id !== "hero"); // followers
  const partyFull = () => knights().length >= D.party.maxFollowers;
  const strength = () => Math.min(D.party.strengthCap, S.party.reduce((s, m) => s + m.base + m.weapon, 0)); // party POWER
  // Every party member has two red hearts, regardless of role or equipment. Unhealed red damage reaches that member's threshold;
  // companions die before the hero. Silver armour absorbs damage before any red-heart loss.
  const HPM = () => D.party.heartsPerMember;
  const PA = KM.PartyAbilities;
  // balance switches; tests that load without src/engine/balance-try.js get the switches-off behaviour
  const CARDS = KM.Cards && KM.BalanceTry?.on('cards') ? KM.Cards : null; // upgrade cards switch
  const BT = KM.BalanceTry || { on: () => false, unit: () => 1, healthMul: () => null, packRelay: () => false, bossAtk: (e, b) => b, heartsText: String };
  const maxHp = () => PA.maxHp(S.party);
  const roleMembers = role => PA.members(S.party, role);
  const priests = () => roleMembers('priest');
  const firestarter = () => roleMembers('firestarter')[0];
  const executioner = () => roleMembers('executioner')[0];
  const canExecute = () => !!(executioner() && S.enc && S.enc.act && PA.executionReady(living(S.enc)[0]));
  const canResurrect = () => !!(S.enc && priests().length>=2 && S.enc.fallen && S.enc.fallen.length && !S.enc.resurrected && !partyFull());
  // v12j (Magnus): the front of the party moves forward as it fills up; alone the hero stands soloBack further back
  const frontX = () => W.partyScreenX - (W.soloBack || 0) * (D.party.maxFollowers + 1 - ((S && S.party) ? S.party.length : 1)) / D.party.maxFollowers;
  const slotX = i => frontX() - i * Math.min(W.slotSpacing, (frontX() - 280) / Math.max(1, S.party.length - 1));
  const artId = m => (m.id === "hero" ? (sketch ? "sketch_knight" : PA.heroArt(m)) : m.art || "follower_" + (m.skin || 1));
  const frankMember = () => S.party.find(m => m.companionId === "frank" && !m.dying && !m.eaten);
  const canHeal = () => priests().length > 0;
  const depthMoving = () => KM.DragonApproach.moving(S);
  const partyPose = (m, i = S.party.indexOf(m)) => KM.Tomb?.partyPose(S,m) || KM.DragonApproach.partyPose(S, m, i);
  const dragonPose = a => KM.Tomb?.actorPose(S,a) || KM.HollowWood?.pose(S,a) || KM.DragonApproach.actorPose(S, a);
  const PREVIEW = /[?&]debug\b/.test(location.search) && new URLSearchParams(location.search).get("preview");
  const shortName = n => n.replace(/^(Sir|Dame|Brother) /, "");
  const freeSkin = () => { for (let k = 1; k <= D.party.skins; k++) if (!knights().some(m => m.skin === k)) return k; return 1; };
  function newMember(id, sx, villager = false) { return { ...(villager ? {origin:"villager",armorTrained:false} : {}), id: "hero", kind: "hero", base: D.party.heroBase, weapon: 0, armor: 0, sx: sx == null ? slotX(0) : sx, hopY: 0 }; }
  function followerFrom(p, sx, look) { return { id: "f" + (++S.fid), kind: "follower", role: p.role, name: p.name, companionId: p.companionId, art: p.art, base: p.base, skin: look && !knights().some(m => m.skin === look) ? look : freeSkin(), trait: p.trait, sacrifice: p.sacrifice, weapon: 0, armor: 0, sx, hopY: 0 }; }
  const actorName = a => a.name || (a.narrator ? "The Narrator" : (D.enemies[a.id] && D.enemies[a.id].name) || a.id);
  const leagues = () => (S.dist / W.pxPerLeague).toFixed(1);
  const weakDmg = () => PA.weak(S.party);
  const hardDmg = () => PA.hard(S.party);

  // ---------- world building (all x in scene px along the road) ----------
  const haltCam = st => st.stopX - W.engageScreenX;
  const NARRATOR_X = 1650; // rock base centre (layout units): his rock clears the knight, his skull sits right of centre
  const isFight = st => ["math", "boss", "mega"].includes(st.type);
  function pickCands(n, taken, seed) {
    if(S.routeVersion){
      const rng=KM.Progression.random(seed),all=[...Object.values(D.companions).filter(p=>p.companionId!=='frank'&&p.companionId!=='darkWizard'),...D.recruitPool];
      let pool=all.filter(p=>!taken.has(p.name));
      if(pool.length<n)pool=all.filter(p=>!S.party.some(m=>m.name===p.name));
      const out=[];while(out.length<n&&pool.length){const p=pool.splice(Math.floor(rng()*pool.length),1)[0];taken.add(p.name);out.push({...p});}return out;
    }
    const pool = D.recruitPool.filter(p => !taken.has(p.name));
    const out = [];
    // Named specialists are encountered in existing rest-stop seats, without changing saved road indices.
    for (const id of ['timmy','executioner']) { const p=D.companions[id]; if(out.length<n && !taken.has(p.name)){out.push({...p});taken.add(p.name);} }
    while (out.length < n && pool.length) { const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; taken.add(p.name); out.push(p); }
    return out;
  }
  const mkActor = o => Object.assign({ active: true, state: "idle", t: 0, rot: 0, dy: 0, alpha: 1, flash: 0, sp: null, dead: false }, o);
  // v18: each candidate carries a look (st.candSkins, rotating through every skin incl. the coif) and joins AS that look
  const candArt = (j, st = S.enc && S.enc.st) => (st && st.cands && st.cands[j] && st.cands[j].art) || "follower_" + (st && st.candSkins && st.candSkins[j] || 1 + (j % D.party.skins));
  // ---- v11b multi-enemy fights (TEMP_BALANCE combat.groups): a row of 2-3 foes on the ground line, front one first
  const GRP = () => C.groups || {};
  function rollGroup(st) {
    if (S.routeVersion) return null; // New routes author safe groups inside their progression stage.
    const g = GRP(), lg = st.stopX / W.pxPerLeague; if (!g.pool || lg < g.fromLeague) return null;
    if (Math.random() >= (lg >= g.lateLeague ? g.lateChance : g.chance)) return null;
    const n = lg >= g.lateLeague && Math.random() < g.chance3 ? 2 : 1; return Array.from({ length: n }, () => pickOne(g.pool));
  }
  const wideOf = id => (window.KM_WIDE && KM_WIDE[id]) || [-KM.Assets.entitySize(id)[0] / 2, KM.Assets.entitySize(id)[0] / 2];
  function rowSlots(st, ids) {
    // Four enemy positions. Overlap within the enemy row is allowed; crossing the party boundary is not.
    const partyRight=Math.max(W.partyScreenX+wideOf('hero')[1],...S.party.map((m,i)=>W.partyScreenX-i*Math.min(W.slotSpacing,(W.partyScreenX-280)/D.party.maxFollowers)+wideOf(artId(m))[1]));
    const left=partyRight+80+Math.max(...ids.map(id=>-wideOf(id)[0]));
    const right=VW-40-Math.max(...ids.map(id=>wideOf(id)[1]));
    const step=Math.max(0,(right-left)/3);
    return ids.slice(0,4).map((id,i)=>haltCam(st)+left+i*step);
  }
  function addGroup(st, i) {
    const ids=[st.enemy].concat(st.group).slice(0,4),xs=rowSlots(st,ids);
    st.group=ids.slice(1);st.homeX=xs[0];
    ids.slice(1).forEach((id,k)=>S.actors.push(mkActor({stop:i,id,x:xs[k+1]+500+(k+1)*420,homeX:xs[k+1],active:false,state:'waiting',foe:true,distant:true,extra:k+1})));
  }
  function buildWorld(fromStop) {
    S.stops = []; let x = 1800;
    const road = inTomb() ? KM.Tomb.route() : sketch ? sketch.route : S.chapter==="hollowwood" ? KM.HollowWood.route(S.runId) : KM.Road.build(S.routeVersion,S.runId);
    road.forEach((e, i) => { x += (e.gap || 1300) * (W.gapScale || 1); S.stops.push(Object.assign({ idx: i, stopX: x }, e)); });
    S.actors = []; S.obstacles = []; S.props = []; S.trees = [];
    const taken = new Set(S.party.filter(m => m.name).map(m => m.name));
    let skinAt = Math.floor(Math.random() * D.party.skins); const looks = n => Array.from({ length: n }, () => 1 + (skinAt++ % D.party.skins));
    // spans of the road that must stay clear: party at each halt, each encounter (incl. walk-in path), intro
    const clear = [[0, NARRATOR_X + 700]];
    S.stops.forEach((st, i) => {
      const h = haltCam(st);
      clear.push([h + slotX(D.party.maxFollowers) - 100, h + W.partyScreenX + 100]);
      if (st.type === "rest") {
        const T = RS.types[st.rest], [rn, rx] = T.recruits, w = T.view === "stall" || T.art === "stall" ? 0 : KM.Assets.entitySize(T.exterior)[0];
        st.cands = pickCands(rn + Math.floor((S.routeVersion ? KM.Progression.random(S.runId+":"+i)() : Math.random()) * (rx - rn + 1)), taken, S.runId+":"+i); st.candSkins = looks(st.cands.length);
        if(st.rest==='tavern' && KM.DarkWizard?.unlocked() && !taken.has(D.companions.darkWizard.name) && KM.Progression.random(S.runId+':wizard:'+i)()<.6){
          st.cands[0]={...D.companions.darkWizard};taken.add(D.companions.darkWizard.name);if(!st.candSkins.length)st.candSkins=looks(1);
        }
        if(st.rest==='campsite'&&!st.cands.length&&!S.tavernRecruits[st.idx]&&!S.restUses[st.idx]?.recruitLeft){st.cands=[{...D.recruitPool.find(p=>!S.party.some(m=>m.name===p.name))}];st.candSkins=looks(1);}
        if(st.rest==='campsite'&&(S.tavernRecruits[st.idx]||S.restUses[st.idx]?.recruitLeft))st.cands=[];
        for(const j of [...(S.restUses[st.idx]?.departedSeats||[]),...(S.restUses[st.idx]?.recruitedSeats||[])])st.cands[j]=null;
        clear.push([st.stopX - 900, st.stopX + 900]);
        if (i < fromStop) return;
        const view = ART7 && T.view;
        if (view === "tavern") { S.actors.push(mkActor({ stop: i, id: "tavern_facade", x: st.stopX, main: true, back: true, facade: true, name: T.name })); return; }
        if (T.view === "stall" && STALL()) { S.actors.push(mkActor({ stop: i, id: "scroll_seller", x: st.stopX, main: true, back: true, keeper: true, stall: true, name: T.keeperName })); return; }
        // v12r (Magnus: "the art is missing" at the shop): a stop type with art: "stall" uses Magnus's stall + seller drawing
        // (the shop has no painted building / keeper yet, MISSING_ART #23) and keeps its recruit candidates on the road
        if (T.art === "stall" && STALL()) { S.actors.push(mkActor({ stop: i, id: "scroll_seller", x: st.stopX, main: true, back: true, keeper: true, stall: true, name: T.keeperName }));
          st.cands.forEach((p, j) => p && S.actors.push(mkActor({ stop: i, id: candArt(j, st), x: st.stopX - 620 + j * 265, candIdx: j, back: true, name: p.name, label: shortName(p.name) }))); return; }
        if (view === "camp") {
          S.actors.push(mkActor({ stop:i,id:T.exterior,x:st.stopX,main:true,back:true,hidden:true,name:T.name }));
          st.cands.forEach((p,j)=>p && S.actors.push(mkActor({stop:i,id:candArt(j,st),x:st.stopX+j*220,candIdx:j,back:true,name:p.name,label:shortName(p.name)})));
          return;
        }
        S.actors.push(mkActor({ stop: i, id: T.exterior, x: st.stopX, main: true, back: true, name: T.name }));
        S.actors.push(mkActor({ stop: i, id: T.keeper, x: st.stopX - w / 2 - 110, keeper: true, back: true, name: T.keeperName }));
        st.cands.forEach((p, j) => p && S.actors.push(mkActor({ stop: i, id: candArt(j, st), x: st.stopX - 620 + j * 265, candIdx: j, back: true, name: p.name, label: shortName(p.name) })));
        return;
      }
      if (st.type === "recruit") {
        if(st.onlyUnlocked&&!KM.DarkWizard?.unlocked()&&!S.wizardUnlocked){st.cands=[];st.candSkins=[];return;}
        const isWizard=KM.DarkWizard?.unlocked()&&!st.companion&&!taken.has(D.companions.darkWizard.name)&&KM.Progression.random(S.runId+':wizard-road:'+i)()<.5;
        const named = isWizard?D.companions.darkWizard:st.companion && D.companions[st.companion];
        if(isWizard||st.companion==='darkWizard')st.wizardRock=true;
        st.cands = named ? (taken.has(named.name) ? [] : [Object.assign({}, named)]) : pickCands(1, taken, S.runId+":"+i);
        if(S.restUses[i]?.recruitedSeats?.includes(0))st.cands=[];
        if (named) taken.add(named.name);
        st.candSkins = looks(st.cands.length);
        if (!st.cands.length) return;
      }
      if (st.type === "special" || st.type === "optional") { // The dragon is scenery; Frank must already be in the party.
        clear.push([st.stopX - 300, st.stopX + 700]);
        if (i < fromStop) return;
        S.actors.push(mkActor({ stop: i, id: st.enemy, x: st.stopX + 420, main: true, foe: true, distant: true, hill: true })); // optional creature: on its hill
        return;
      }
      const aid = st.type === "recruit" ? candArt(0, st) : st.enemy || st.npc;
      const w = KM.Assets.entitySize(aid)[0]; clear.push([st.stopX - w / 2 - 150, st.stopX + w / 2 + (st.walksIn ? 600 : 150)]);
      if (st.type === "math" && !st.group) st.group = rollGroup(st);
      if (i >= fromStop && st.group && st.group.length) addGroup(st, i);
      if (i >= fromStop) S.actors.push(mkActor({ stop: i, id: aid, main: true, x: st.walksIn || st.group ? st.stopX + 500 : st.homeX || st.stopX, homeX: st.homeX, active: !(st.walksIn || st.group), state: st.walksIn || st.group ? "waiting" : "idle",
        foe: isFight(st), distant: isFight(st),   // strength stays hidden until commitment; artwork stays opaque and in colour
        wizardRock:!!st.wizardRock, riddleVariant:st.type==='riddle'?S.stops.slice(0,i).filter(q=>q.type==='riddle').length%3:null,
        back: ["bridgekeeper", "enchanter", "hermit"].includes(aid), candIdx: st.type === "recruit" ? 0 : undefined, name: st.type === "recruit" ? st.cands[0].name : undefined, label: st.type === "recruit" ? shortName(st.cands[0].name) : undefined }));
    });
    if(inTomb()){S.graves=[];S.companionGraves=[];S.swaps=null;return;}
    if(sketch)return;
    buildGraves();
    // v19: the snake dragon sits on its hill in the scenery (KM_ART19 hill strip swapped into the mid row), placed so it is
    // on screen at swap.screenX when the party halts at Frank's stop (v3 README); it leaves the hill on a commit
    const MS = ART7 && D.scenery.mid, hq = MS && MS.swap && KM_ART7.parallax[MS.swap.strip], fs = hq && S.stops.find(st => st.id === MS.swap.stop);
    S.swaps = fs ? { mid: { at: MS.swap.screenX + haltCam(fs) * MS.speed - (hq.dragon[0] + hq.dragon[2]) / 2 * L.art * (MS.artScale || D.scenery.terrainScale || 1), on: false, landmark: true } } : null;
    const end = S.stops[S.stops.length - 1].stopX + 4000;
    const free = (x, half) => !clear.some(([a, b]) => x + half > a && x - half < b);
    if (ART7 && S.chapter!=="hollowwood") { // roadside trees from Magnus's tree props (front lane, behind the party)
      const T = D.scenery.trees; let n = 0;
      for (let tx = 600; tx < end; tx += rnd(...T.every)) { const i = n++ % 4, half = KM.Scenery.treeWidth(i) / 2 + T.clearance; if (free(tx, half)) S.trees.push({ x: tx, i }); }
    }
    if (W.boxScenery !== false || !ART7) {
      for (let ox = 1000; ox < end; ox += rnd(...W.obstacleEvery)) {
        const id = pickOne(W.obstacleKinds), half = KM.Assets.entitySize(id)[0] / 2 + 140;
        if (free(ox, half)) S.obstacles.push({ x: ox, id });
      }
      if(!arena)S.obstacles.forEach(o => clear.push([o.x - 140, o.x + 140]));
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
    const ds = KM.Save.deaths().filter(d=>(d.chapter||"village")===S.chapter).map(d => ({ d, cam: graveCam(d), wx: graveX(d) })).filter(o => o.cam != null).sort((a, b) => a.cam - b.cam);
    S.graves = []; S.respect = null; buildCompanionGraves();
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
  function buildCompanionGraves(){
    S.companionGraves=KM.Save.companionGraves().filter(d=>(d.chapter||"village")===S.chapter).map(d=>({...d,wx:graveX(d)-GR.ahead})).filter(d=>Number.isFinite(d.wx));
  }
  function buryCompanion(m,killer){
    if(!m || m.id==='hero' || m.graveId)return;
    const st=S.enc?.st||S.stops[S.stop];
    const d={chapter:S.chapter,deathId:`${S.runId||'run'}-${m.id}-${Date.now()}-${S.stats.lost||S.stats.sacrificed||0}`,runId:S.runId,name:m.name,killer:killer||'unknown',x:S.camX,wx:S.camX,
      progress:st&&st.src!=null?{encounter:st.src,offset:S.camX-haltCam(st)}:null,at:Date.now()};
    Object.assign(d,KM.CompanionGraves.place(d,S.companionGraves));m.graveId=d.deathId;
    S.companionGraves.push(d);if(!PREVIEW)KM.Save.addCompanionGrave(d);
  }
  function unburyCompanion(m){
    if(inTomb())KM.Tomb.revive(S,m);
    if(!m.graveId)return;S.companionGraves=S.companionGraves.filter(d=>d.deathId!==m.graveId);
    if(!PREVIEW)KM.Save.removeCompanionGrave(m.graveId);delete m.graveId;
  }
  const drawCompanionGraves=layer=>KM.CompanionGraves.draw(ctx,S.companionGraves,S.camX,layer);
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
  const core = () => ({ chapter:S.chapter, challengeMode:S.challengeMode, name: S.name, hp: S.hp, gold: S.gold, score: S.score, scoreLedger: KM.Score.copy(S.scoreLedger), cards:(S.cards||[]).slice(), riddleSolved:S.riddleSolved.slice(),wizardUnlocked:S.wizardUnlocked, stop: S.stop, dist: Math.round(S.dist), fid: S.fid, further: S.furtherDone, hunters: S.hunters, spells: S.spells, spellLeft: S.spellLeft, mead: S.mead ? 1 : 0, bottles: S.bottles, runId: S.runId, fgSeed: fgSeed(),
    pendingDismissal:S.pendingDismissal?JSON.parse(JSON.stringify(S.pendingDismissal)):null,loot:S.loot.map(q=>({...q})),routeVersion:S.routeVersion,restUses:JSON.parse(JSON.stringify(S.restUses)),rolesVersion: 3, dragonSlain: !!S.dragonSlain, tavernRecruits: {...S.tavernRecruits},
    party: S.party.map(m => { const { sx, hopY, act, hopping, dying, ...rec } = m; return rec; }), stats: Object.assign({}, S.stats), usedRiddles: S.usedRiddles.slice() });
  function save() { if (sketch || PREVIEW) return; KM.Save.write(Object.assign(core(), { checkpoint: S.checkpoint })); }
  function setCheckpoint() { S.checkpoint = core(); save(); }
  function applyCore(c) {
    S.chapter=c.chapter==="tomb"?"tomb":c.chapter==="hollowwood"?"hollowwood":"village";syncChapterFlag();
    setChallengeMode(c.challengeMode || "math");
    S.pendingDismissal=c.pendingDismissal&&c.pendingDismissal.stop===c.stop?JSON.parse(JSON.stringify(c.pendingDismissal)):null;
    S.loot=(c.loot||[]).filter(q=>Number.isFinite(q.x)&&q.amount>0).map(q=>({...q}));
    S.routeVersion=c.routeVersion||0;S.restUses=JSON.parse(JSON.stringify(c.restUses||{}));
    S.riddleSolved=(c.riddleSolved||[]).slice();S.cards=(c.cards||[]).slice();S.wizardUnlocked=!!c.wizardUnlocked;
    S.enc = null; S.deathDepth = null; S.dragonSlain = !!c.dragonSlain; S.tavernRecruits = {...(c.tavernRecruits || {})};
    S.name = c.name; S.hp = c.hp; S.gold = c.gold; S.score = Number.isFinite(c.score) ? Math.trunc(c.score) : 0; S.scoreLedger = KM.Score.copy(c.scoreLedger); S.stop = c.stop; S.stats = Object.assign({ correct: 0, wrong: 0, riddles: 0, sacrificed: 0 }, c.stats); S.usedRiddles = (c.usedRiddles || []).slice();
    S.dist = c.dist || 0; S.furtherDone = !!c.further; S.hunters = c.hunters || 0; S.spells = c.spells != null ? c.spells : SPL.start; S.spellLeft = Math.min(SPL.problems, Math.max(0, c.spellLeft || 0)); S.mead = c.mead ? 1 : 0; S.bottles = c.bottles || 0; S.runId = c.runId || "run-" + Date.now(); S.fgSeed = c.fgSeed != null ? c.fgSeed : seedOf(S.runId);
    S.party = c.party.map((m, i) => Object.assign({}, PA.normalizeGear(m), { role: PA.role(m), name: m.companionId==='frank' ? D.companions.frank.name : m.name, sx: slotX(i), hopY: 0 }));
    const cap=maxHp();
    if(c.rolesVersion===1 || c.rolesVersion===2){
      // Versions 1 and 2 used different caps. Preserve missing red hearts, never kill
      // a living party on load, and keep zero or fractional health as such.
      const oldMax=S.party.reduce((sum,m)=>{
        const cloth=(PA.villager(m)&&!m.armorTrained)||['priest','executioner','darkWizard'].includes(PA.role(m));
        return sum+(cloth?2:3)-(c.rolesVersion===1?1:0);
      },0);
      S.hp=c.hp<=0?0:Math.min(cap,Math.max(Math.min(1,c.hp), cap-Math.max(0,oldMax-c.hp)));
    }else S.hp=Math.max(0,Math.min(cap,c.hp)); // unversioned and v3 use two hearts per member
    S.ink=null;
    S.fid = Math.max(c.fid || 0, ...S.party.map(m => +String(m.id).replace(/\D/g, "") || 0));
    S.view = null; S.dying = null; S.dice = []; S.timers = []; S.toast = null; S.entering = null;
    buildWorld(S.stop); placeCameraAt(S.stop);
  }

  // ---------- strip UI ----------
  // v11 (Magnus: "absolute destruction of unnecessary small texts"): the strip only holds the big carved sum, a few
  // LARGE key options and one icon status row. Every line of dialogue is a speech bubble above its speaker.
  const panel = $("panel");
  function showPanel(html, cls) { const sky=$("sky-title"); if(sky)sky.hidden=cls!=="title"; panel.className = "panel " + (cls || ""); panel.innerHTML = KM.I18n?.html(html) ?? html; fitSums(); fitMoves(); fitRiddleQ(); }
  // v12s: the strip is 184 px, so a riddle that wraps to 2-3 lines steps its font down (KM_UI.riddleQ.minFont) until the
  // question frame + answer row fit inside the strip; every current riddle is one line at the full size.
  function fitRiddleQ() {
    const f = panel.querySelector(".riddleframe.qf"), q = f && f.querySelector(".rq"); if (!q) return;
    const Q = KM_UI.riddleQ, pr = panel.getBoundingClientRect(), last = () => Math.max(...[...panel.querySelectorAll(".riddlep > *")].map(el => el.getBoundingClientRect().bottom));
    for (let fs = Q.font; fs >= (Q.minFont || 26); fs -= 2) { q.style.fontSize = fs + "px"; if (last() <= pr.bottom - 2) break; }
  }
  // v12r (Magnus: "the buttons are outside of frame"): move rows keep every button whole (flex: none, caps padding) and
  // inside the strip: the first height of KM_UI.moves.heights whose single row fits, else two centred rows (split at .brk).
  function fitMoves() {
    panel.querySelectorAll('.opts.moves').forEach(row => {
      const n=row.querySelectorAll('button').length, cols=Math.min(4,n);
      row.classList.add('fit','role-moves'); row.style.setProperty('--move-cols', cols);
      panel.classList.toggle('tworows',n>4);
    });
  }
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
    fist: `<svg viewBox="0 0 40 40"><path d="M10 33V23L6 18Q4 13 8 12L13 16V9Q13 5 17 7Q20 3 23 7Q27 5 29 9Q33 8 34 13V22L29 33Z" fill="#e2cfa6" ${INK}/><path d="M17 8V16M23 8V16M29 10V18M13 18L22 20" fill="none" ${INKW(2)}/></svg>`,
    weak: `<svg viewBox="0 0 40 40"><path d="M8 32 L28 12" ${INK}/><path d="M26 8 l6 6 -3 1 -4 -4z" fill="#efe0c0" ${INK}/><path d="M6 28 l6 6" ${INK}/></svg>`,
    hard: `<svg viewBox="0 0 40 40"><path d="M8 32 L28 12" ${INKW(5)}/><path d="M6 28 l6 6" ${INK}/><path d="M30 4 l1 6 5 -3 -3 5 6 1 -6 2 3 5 -5 -3 -1 6" fill="#d16f19" ${INKW(2)}/></svg>`,
    heal: `<svg viewBox="0 0 40 40"><path d="M20 34 C4 24 4 8 13 8 C17 8 19 11 20 14 C21 11 23 8 27 8 C36 8 36 24 20 34Z" fill="#b3321f" ${INK}/></svg>`,
    get spell() { return spellIcon("btn"); },
    roll: `<svg viewBox="0 0 40 40"><rect x="7" y="7" width="26" height="26" rx="5" fill="#efe0c0" ${INK}/><circle cx="14" cy="14" r="2.6" fill="#2a1d12"/><circle cx="20" cy="20" r="2.6" fill="#2a1d12"/><circle cx="26" cy="26" r="2.6" fill="#2a1d12"/></svg>`,
    mead: `<svg viewBox="0 0 40 40"><path d="M9 11 H27 V33 Q18 36 9 33Z" fill="#c98a2b" ${INK}/><path d="M9 11 Q12 5 18 8 Q24 4 27 11" fill="#efe0c0" ${INK}/><path d="M27 15 Q35 15 35 22 Q35 29 27 29" fill="none" ${INKW(3)}/></svg>`,
    stew: `<svg viewBox="0 0 40 40"><path d="M5 19 H35 Q34 33 20 34 Q6 33 5 19Z" fill="#8a5a2b" ${INK}/><path d="M12 14 q2 -4 0 -8 M20 14 q2 -4 0 -8 M28 14 q2 -4 0 -8" fill="none" ${INKW(2)}/></svg>`,
    fire: `<img class="itemicon" src="${IT.art.dir + IT.art.icon}" alt="">`, // v12k Maggi's fire bottle stamp
    lightning: '<span aria-hidden="true">ϟ</span>',
    sacrifice: `<svg viewBox="0 0 40 40"><path d="M10 6 H30 V22 C30 30 20 35 20 35 C20 35 10 30 10 22Z" fill="#efe0c0" ${INK}/><path d="M20 10 V30 M13 17 H27" ${INK}/></svg>`
  };
  // v12q: strip buttons wear Maggi's ornamented ink frame (CSS border-image from KM_UI.frame, src/config/ui_frames.js);
  // the old SVG banner is gone. BANNER stays as the one hook in every button template (empty now).
  const BANNER = "";
  if (window.KM_UI && KM_UI.frame) { const F = KM_UI.frame, st = document.documentElement.style, u = f => `url("${F.root + f}")`;
    st.setProperty("--bf-n", u(F.normal)); st.setProperty("--bf-h", u(F.hover)); st.setProperty("--bf-d", u(F.disabled));
    st.setProperty("--bf-sv", F.slice[0]); st.setProperty("--bf-sh", F.slice[1]); st.setProperty("--bf-bv", F.border[0] / F.h); st.setProperty("--bf-bh", F.border[1] / F.h); st.setProperty("--bf-lift", F.labelLift || 0);
    [F.normal, F.hover, F.disabled].forEach(f => { const im = new Image(); im.src = F.root + f; }); } // no flash on the first hover
  // Magnus's riddle frame: ONE uniform scale (RF_S stage px per source px) for the whole frame; a 9-slice keeps both
  // corner halves intact and stretches only the ink-free middle columns to the riddle's width
  const RF = window.KM_ART11 && KM_ART11.riddleFrame, RF_H = 84, RF_S = RF ? RF_H / RF.size[1] : 0;
  { const Q = KM_UI.riddleQ, st = document.documentElement.style, k = Q.scale || 1; // v12s riddle question frame
    st.setProperty("--rq-img", `url("${Q.root + Q.img}")`); st.setProperty("--rq-sv", Q.slice[0]); st.setProperty("--rq-sh", Q.slice[1]);
    st.setProperty("--rq-bv", Q.border[0] * k + "px"); st.setProperty("--rq-bh", Q.border[1] * k + "px");
    st.setProperty("--rq-pv", Q.safe[0] * k + "px"); st.setProperty("--rq-ph", Q.safe[1] * k + "px"); st.setProperty("--rq-h", Q.h * k + "px");
    st.setProperty("--rq-minw", Q.minW + "px"); st.setProperty("--rq-maxw", Q.maxW + "px"); st.setProperty("--rq-fs", Q.font + "px"); st.setProperty("--rq-lh", Q.lineH); st.setProperty("--rq-gap", Q.gap + "px"); }
  if (RF) { const st = document.documentElement.style; st.setProperty("--rf-img", `url("${KM_ART11.root + RF.img}")`);
    st.setProperty("--rf-l", RF.slice[0]); st.setProperty("--rf-r", RF.slice[1]); st.setProperty("--rf-v", Math.ceil(RF.size[1] / 2));
    st.setProperty("--rf-lw", (RF.slice[0] * RF_S).toFixed(1) + "px"); st.setProperty("--rf-rw", (RF.slice[1] * RF_S).toFixed(1) + "px");
    st.setProperty("--rf-vw", (Math.ceil(RF.size[1] / 2) * RF_S).toFixed(2) + "px"); st.setProperty("--rf-h", (RF.size[1] * RF_S).toFixed(1) + "px"); }
  const move = (key, label, act, icon, attrs = "", off = false) => `<button class="opt plaque" data-act="${act}" ${attrs} ${off ? "disabled" : ""}>${BANNER}${MICON[icon] || ""}<span class="nm">${label}</span></button>`;
  // Shared square actions reuse the Knight's ink frame; these are persistent choices, not a deck.
  const actionCard = ({label,act,icon='',meta='',detail='',note='',attrs='',off=false,price=null,title=''}) =>
    `<button type="button" class="knight-card action-card" data-act="${act}" ${attrs} ${off?'disabled':''} ${title?`title="${esc(T(title))}"`:''}>${meta?`<small class="action-meta">${esc(T(meta))}</small>`:''}${icon?`<span class="card-symbol" aria-hidden="true">${icon}</span>`:''}<strong>${esc(T(label))}</strong>${price!==null?coin(price):''}${detail?`<span class="action-detail">${detail}</span>`:''}${note?`<small class="action-note">${esc(T(note))}</small>`:''}</button>`;
  const actionRow = (cards,label='') => `<div class="action-deck">${label?`<div class="action-heading">${esc(T(label))}</div>`:''}<div class="action-row">${cards.join('')}</div></div>`;
  const walkCard = (act='leaveRest') => actionCard({label:'Walk on',act,icon:'→',meta:'On the road'});
  const recruitCard = (p,j,act='restRecruit',off=false) => actionCard({label:shortName(p.name),act,icon:MICON.sacrifice,meta:'Companion',detail:T('Recruit'),note:'Solve to recruit',attrs:`data-j="${j}"`,off});
  const swingIcon = bare => bare?'<svg class="stick-stamp" viewBox="128 897 530 264" aria-hidden="true"><image href="assets/villager-start/v22/parts/stick.png" width="1037" height="1517"/></svg>':'<img src="assets/ui/shop/sword-cutout.png" alt="">';
  // prices (rest stops): Magnus's purse, small, + the number (no coin icon, v11b)
  const coin = n => `<span class="cost">${window.KM_ART11 && KM_ART11.purse ? `<img class="purseimg mini" src="${KM_ART11.root + KM_ART11.purse.img}" alt="">` : `<i class="coin"></i>`}${n}</span>`;
  // v11b money: Magnus's painted purse (KM_ART11.purse) + the number, at the hearts' height
  const purse = n => `<span class="purse" title="coppers">${window.KM_ART11 && KM_ART11.purse ? `<img class="purseimg" src="${KM_ART11.root + KM_ART11.purse.img}" alt="">` : `<i class="coin"></i>`}${n}</span>`;
  const heartsIcons = (on, max, cls) => `<span class="hearts ${cls || ""}">${Array.from({ length: max }, (_, i) => `<i class="${i < on ? "on" : ""}">♥</i>`).join("")}</span>`;
  // ---------- v11 speech: big bubbles above the speaker, long text split into short bubbles shown in turn ----------
  const SP = L.speech, speechLog = [], speakers = new Set(), speechOverflow = [];
  // v11b: lines wrap to the painted bubbles' text width (source px x artScale), so the text always fits the art
  if (window.KM_ART11) SP.maxW = Math.floor(Math.min(...Object.values(KM_ART11.bubbles).map(B => B.text[2])) * L.artScale);
  const mctx = document.createElement("canvas").getContext("2d");
  function wrap(text) {
    mctx.font = `${SP.font}px Georgia, serif`;
    if(KM.I18n?.jp())return KM.I18n.wrap(text,SP.maxW-24,s=>mctx.measureText(s).width);
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
    if (!o || !text) return; text=T(text);const chunks = chunksOf(text);
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
  function float(text, x, y, color) {
    text=T(text);
    if(inTomb()){
      const i=S.party.findIndex((m,i)=>Math.abs(x-slotX(i))<2);
      if(i>=0){const p=partyPose(S.party[i],i);x=p.x;y=p.y-210;}
    }
    if (S.enc && S.enc.depth) {
      const i = S.party.findIndex((m, i) => Math.abs(x - slotX(i)) < 2);
      if (i >= 0) { const p = partyPose(S.party[i], i); x = p.x; y = p.y - (W.groundY - y) * p.scale; }
      else if (S.enc.act) { const p = dragonPose(S.enc.act); if (p) y = p.y - (W.groundY - y) * p.scale; }
    }
    S.floats.push({ text, x, y, t: 0, color: color || "#fff" }); }
  function hearts(n) {
    const before=S.hp;S.hp=Math.max(0,Math.min(maxHp(),S.hp+n));let healed=Math.max(0,S.hp-before);
    for(const m of S.party){const recovery=Math.min(healed,m.riddleWounds||0);m.riddleWounds=Math.max(0,(m.riddleWounds||0)-recovery);healed-=recovery;}
  }
  const screenX = wx => wx - S.camX; // world -> view x (scene px)
  // one icon status row: hearts, gold, hunters track, journey distance (no words)
  let hudCache = "";
  const SKULL = `<svg class="skull" viewBox="0 0 32 32" aria-label="hunters"><path d="M16 3c-7 0-11 4.6-11 10.4 0 3.6 1.7 6 4 7.4V25h3v-2.4h1.6V25h4.8v-2.4H20V25h3v-4.2c2.3-1.4 4-3.8 4-7.4C27 7.6 23 3 16 3z" fill="#efe0c0" stroke="#2a1d12" stroke-width="2.2" stroke-linejoin="round"/><path d="M8.6 13.6c1-2.2 4.4-2.4 5.4-.4.7 1.6-.6 3.6-2.6 3.6-2.2 0-3.4-1.6-2.8-3.2zM23.4 13.6c-1-2.2-4.4-2.4-5.4-.4-.7 1.6.6 3.6 2.6 3.6 2.2 0 3.4-1.6 2.8-3.2zM16 17.2l-1.8 3h3.6z" fill="#2a1d12"/><path d="M11 28.5h10" stroke="#2a1d12" stroke-width="2"/></svg>`;
  const HELM = `<svg class="helm" viewBox="0 0 32 32" aria-label="you"><path d="M6 29V12C6 6.5 10.5 3 16 3s10 3.5 10 9v17z" fill="#efe0c0" stroke="#2a1d12" stroke-width="2.2" stroke-linejoin="round"/><path d="M7 14.5h18" stroke="#2a1d12" stroke-width="3.2"/><path d="M16 18v9M12.5 22.5h7" stroke="#d16f19" stroke-width="2.6"/><path d="M9 20.5h2M9 24h2M21 20.5h2M21 24h2" stroke="#2a1d12" stroke-width="1.6"/></svg>`;
  function renderHUD() {
    const ms = MU.settings(), mute = `<button class="music-toggle" data-act="toggleMusic" aria-label="${ms.muted?'Unmute music':'Mute music'}" aria-pressed="${ms.muted}" title="${ms.muted?'Unmute music':'Mute music'} (M)"><span aria-hidden="true">${ms.muted?'♩':'♫'}</span> Music ${ms.muted?'off':'on'}</button>`;
    if(inTomb()){
      const h='<span class="tomb-label">'+T('The Tomb Passage')+' <small>'+Math.min(S.stop+1,S.stops.length)+' / '+S.stops.length+'</small></span>'+mute;
      if(h!==hudCache){$("hud").innerHTML=KM.I18n?.html(h)||h;hudCache=h;}return;
    }
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
    if (h !== hudCache) { $("hud").innerHTML = KM.I18n?.html(h)||h; hudCache = h; }
  }
  function renderWalk() {
    if (S.mode !== "walk") return;
    showPanel(`<div class="center walkp"></div>`, "walk"); // the road: nothing in the strip but the status row
  }
  // ---------- title / intro ----------
  function chooseLanguage(lang){KM.I18n.set(lang);hudCache="";showTitle();renderHUD();}
  function sketchPage(state) {
    hush();
    S.mode=state;
    S.enc=null;
    const title=state==='sketchTitle'?'The Sketchbook March':state==='sketchWin'?'The road is clear.':'Here lies the pilgrim.';
    const prompt=state==='sketchTitle'?'Enter the march':'Try the march again';
    showPanel(`<div class="center"><div style="display:flex;align-items:center;justify-content:center;gap:20px">
      <img src="assets/sketchbook/coif.png" alt="" style="height:90px;width:auto"><h1 style="margin:0">${T(title)}</h1></div>
      <div class="opts big3">${big('Enter',prompt,'sketchStart')}${big('','Back to game','sketchExit')}</div></div>`, 'info');
  }
  function sketchStart() {
    if(!sketch)return;
    S.winT=0;S.camX=0;S.dist=0;S.stop=0;S.dying=null;S.deathDepth=null;S.enc=null;
    S.name='Pilgrim';S.runId='sketchbook';S.party=[newMember('hero',slotX(0))];
    S.hp=maxHp();S.hunters=0;S.gold=0;S.score=0;S.scoreLedger=KM.Score.empty();
    S.stats={correct:0,wrong:0,riddles:0,sacrificed:0};S.floats=[];S.timers=[];S.loot=[];
    S.toast=null;S.shake=0;S.stepT=0;hush();buildWorld(0);
    S.mode='walk';renderWalk();renderHUD();
  }
  function showTitle() {
    S.mode = "title"; S.enc = null; S.deathDepth = null; musicScene("title"); hush();
    const sv = KM.Save.load();
    S.party = [newMember("hero", slotX(0), true)]; S.hp = maxHp(); buildWorld(0); S.camX = 0; addNarrator();
    const heading=`<h1>Medieval Math</h1><div class="mode-choice" role="group" aria-label="Game mode">${opt('', 'The Village Idiot','chooseMode',`data-mode="math" aria-pressed="${S.challengeMode==='math'}"`)}${opt('', 'The Knight','chooseMode',`data-mode="knight" aria-pressed="${isKnight()}"`)}${opt('', 'The Fellowship','chooseMode',`data-mode="fellowship" aria-pressed="${isFellowship()}"`)}</div><div class="mode-description">${isFellowship()?'One sum · the whole party strikes':isKnight()?'Play a card · solve to strike':'Maths · solve to strike'}</div>`;
    if($("sky-title"))$("sky-title").innerHTML=KM.I18n?.html(heading)??heading;
    showPanel(`<div class="center titlep">
      <div class="opts">${sv ? big("Enter", "Continue", "continue", 'id="continueBtn"') + big("N", "New game", "newGame", 'id="newGameBtn"') : big("Enter", "New game", "newGame", 'id="newGameBtn"')}</div><button class="opt plaque scores-link" data-act="leaderboard">Leaderboard</button><div class="language-choice" aria-label="Language / 言語"><button class="opt plaque" data-act="language" data-lang="en" aria-pressed="${!KM.I18n?.jp()}">English</button><button class="opt plaque" data-act="language" data-lang="ja" aria-pressed="${!!KM.I18n?.jp()}">日本語</button></div></div>`, "title");
  }
  function startRunBookkeeping() { const b = KM.Save.best(); S.bestAtStart = b ? b.leagues : 0; S.toast = null; }
  function newGame() {
    if(KM.Tomb?.requested())return startTomb();
    S.chapter=KM.HollowWood?.requested()?"hollowwood":"village";syncChapterFlag();
    hush(); S.deathDepth = null; S.dragonSlain = false;
    S.cards = [];
    S.name = "Nobody"; S.hp = D.party.heartsPerMember; S.gold = 5; S.loot = []; S.score = 0; S.scoreLedger = KM.Score.empty(); S.riddleSolved=[];S.wizardUnlocked=false;S.lightning=null; S.stop = 0; S.dist = 0; S.fid = 0; S.hunters = 0; S.spells = 0; S.spellLeft = 0; S.mead = 0; S.bottles = 0; S.runId = "run-" + Date.now(); S.fgSeed = seedOf(S.runId);
    S.stats = { correct: 0, wrong: 0, riddles: 0, sacrificed: 0 }; S.usedRiddles = []; S.pendingDismissal=null; S.tavernRecruits = {}; S.restUses={}; S.routeVersion=3;
    S.party = [newMember("hero", slotX(0), true)]; S.hp = maxHp(); buildWorld(0); S.camX = 0; addNarrator(); S.floats = []; S.dice = []; S.enc = null; S.timers = []; S.view = null; S.dying = null; S.entering = null; S.voices = [];
    S.furtherDone = false; startRunBookkeeping();
    S.mode = "name"; musicScene("intro"); S.intro = null;
    renderIntro();
  }
  function continueGame() {
    const sv = KM.Save.load(); if (!sv) return newGame();
    hush(); S.checkpoint = sv.checkpoint; applyCore(sv); startRunBookkeeping(); S.mode = "walk"; musicScene("walk"); renderWalk();
  }
  const narrator = () => S.actors.find(a => a.narrator && !a.dead);
  // the intro: the narrator's (Magnus's skeleton on his rock) lines are bubbles; Space shows the next bubble / line, Esc skips
  function renderIntro() {
    if (S.mode === "name") {
      speak(narrator(), A.text(D.dialogue.namePrompt), { hold: true });
      showPanel(`<div class="center dlg"><div class="namerow"><input id="nameInput" aria-label="Your name" maxlength="16" placeholder="your name" autocomplete="off" spellcheck="false">${big("Enter", "Begin", "submitName", 'id="nameOk"')}</div></div>`, "dialog");
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
      S.mode = "name"; renderIntro(); return paceVO(A.voOf(D.dialogue.namePrompt), narrator);
    }
    renderIntro(); lineVO();
  }
  function skipIntro() { if (S.mode !== "intro" || (S.intro && S.intro.after === "go")) return advanceIntro(); S.mode = "name"; renderIntro(); paceVO(A.voOf(D.dialogue.namePrompt), narrator); }
  function lineVO() { const it = S.intro; if (!it || !it.vos) return; const i = it.i, id = it.vos[i];
    // the bubble waits for the recorded line to finish (then moves on by itself after a breath) or for a keypress;
    // a missing file is silent and the bubble just waits for the key (src/engine/audio.js plays only the file assets/audio_map.json lists for the id)
    // v12c: with a recording, the line's bubble chunks are paced across the clip (by character share, introPace) and the
    // next line comes 0.6 s after the clip ends. Space during a clip still advances (and stops it when the line changes).
    it.clip = null;
    A.voice(id, { onStart: el => { if (S.intro === it && it.i === i) it.clip = { i, el }; },
      onEnd: () => { if (it.clip && it.clip.i === i) it.clip.done = true; later(0.6, () => { if (S.intro === it && it.i === i && S.mode === "intro") advanceIntro(true, true); }); } }); }
  // v12r: any other narrator line with a clip (name prompt, game over, victory) paces its bubble across the clip the same way
  const paceVO = (id, who) => A.voice(id, { onStart: el => { const w = who(); S.voPace = { el, who: w, sp: w && w.sp }; }, onEnd: () => { if (S.voPace) S.voPace.done = true; } });
  function introPace() {
    const it = S.intro, c0 = it && it.clip, n0 = narrator(), P = S.voPace;
    const c = S.mode === "intro" ? c0 && c0.i === it.i && c0 : P && P.who && P.who.sp && P.who.sp === P.sp ? P : null, n = S.mode === "intro" ? n0 : P && P.who;
    if (!c || !n || !n.sp) return;
    const sp = n.sp, el = c.el, dur = el.duration; if (!(dur > 0) || !isFinite(dur) || sp.chunks.length < 2) return;
    const frac = c.done ? 1 : el.currentTime / dur, lens = sp.chunks.map(ch => ch.join(" ").length), tot = lens.reduce((a, b) => a + b, 0);
    let cum = 0, want = 0; for (let k = 0; k < lens.length - 1; k++) { cum += lens[k]; if (frac >= cum / tot) want = k + 1; }
    if (want > sp.i) { sp.i = want; sp.t = 0; }
  }
  function submitName() {
    if (S.mode !== "name") return;
    const inp = $("nameInput"); const v = (inp ? inp.value : "").trim().slice(0, 16) || "Nobody";
    S.name = v.replace(/^sir\s+/i, ""); if (inp) inp.blur();
    if (!PREVIEW) KM.Save.clear();
    startJourney();
  }
  function startJourney() {
    S.intro = null;
    const nar = narrator(); if (nar) { nar.sp = null; nar.quiet = true; } // v12g (Magnus): he stays on his rock; the party walks past him
    setCheckpoint(); S.mode = "walk"; musicScene("walk"); renderWalk();
  }

  // ---------- walking ----------
  function updateWalk(dt) {
    if (S.stop >= S.stops.length) { S.camX += W.walkSpeed * dt; S.dist += W.walkSpeed * dt; S.winT += dt; if (S.winT > 2.5) showWin(); return; }
    if (S.respect) { S.respect.t += dt; if (S.respect.t >= GR.respectsSecs) { S.respect.g.done = true; S.respect = null; renderWalk(); } return; }
    const st = S.stops[S.stop], act = S.actors.find(a => a.stop === S.stop && a.main);
    // Without the priest this remains a distant landmark: no prompt, penalty or forced fight.
    if (st.id === "frank" && !frankMember() && S.camX >= haltCam(st)) { finishEncounter(); return; }
    let halt = haltCam(st);
    // graves: halt in front of the next one we have not passed yet (ones behind us, e.g. after a load, are skipped)
    S.graves.forEach(g => { if (!g.done && S.camX > g.cam + 1) g.done = true; });
    const g = GR.stopToRespect ? S.graves.find(g => !g.done && g.cam <= halt) : null; // off: walk straight past crosses
    if (g && S.camX >= g.cam) return startRespects(g);
    if (act && !act.active && S.camX >= halt - 900) {
      act.active = true; act.state = inTomb() ? "idle" : "walkin";
      S.actors.filter(a => a.stop === S.stop && a.extra).forEach(a => {
        if(inTomb()){a.active=true;a.state="idle";} // already standing in the projected world
        else later(0.45 * a.extra, () => { a.active = true; a.state = "walkin"; });
      });
      if (st.type === "boss" || st.type === "mega") { heroSay("Something big blocks the road!"); A.play("boss_intro"); }
    }
    const before = S.camX;
    S.camX = Math.min(S.camX + W.walkSpeed * dt, halt, g ? g.cam : Infinity);
    S.dist += S.camX - before;
    if (!S.furtherDone && S.bestAtStart > 0 && +leagues() > S.bestAtStart) furtherThanEver();
    // One familiar knight step per visible contact. Do not stack a companion on the same beat.
    if (S.camX > before) {
      const heroId=artId(S.party[0]),sid=KM_ART.entities[heroId]?.seq?.walk;
      const fr=sid&&KM.Assets.seqFrame(sid,(S.walkT||0)*(KM_ART.walkRate?.(heroId)||1));
      S.compStepT=(S.compStepT||0)+dt;S.stepFr=S.stepFr||{};
      let heroStep=false;
      if(fr){const n=fr.s.frames.length;heroStep=fr.i!==S.stepFrame&&(fr.i===0||fr.i===n/2);S.stepFrame=fr.i;}
      else {S.stepT+=dt;if(S.stepT>.35){S.stepT=0;heroStep=true;}}
      if(heroStep){A.play(inTomb()?'step_stone':'step');S.compStepT=0;}
      S.party.forEach(m=>{if(m.id==='hero')return;const id=artId(m),cs=KM_ART.entities[id]?.seq?.walk;if(!cs)return;
        const f=KM.Assets.seqFrame(cs,(S.walkT||0)*(KM_ART.walkRate?.(id)||1));if(!f)return;
        if(f.i!==S.stepFr[m.id]&&(f.i===0||f.i===f.s.frames.length/2)&&S.compStepT>=.32){A.play('step_companion');S.compStepT=0;}
        S.stepFr[m.id]=f.i;
      });
    }
    if(S.camX>=halt && S.pendingDismissal?.stop===S.stop)return beginDismissalBattle();
    if (S.camX >= halt && (!act || act.state !== "walkin")) engage(st, act);
  }
  // once per run: scene toast (GAME_DESIGN) + narrator line in the strip + VO (chat request)
  function furtherThanEver() {
    S.furtherDone = true; S.toast = { text: GR.further.toast, t: 0, dur: GR.further.toastSecs }; // one big scene toast + VO
    A.voice(GR.further.vo);
  }
  const isWalking = () => depthMoving() || (S.mode === "walk" && !S.respect && (S.stop >= S.stops.length || S.camX < haltCam(S.stops[S.stop])));

  // ---------- action hooks (attack / hurt: painted anim slot, else procedural fallback) ----------
  function act(obj, name, dur, reach, tgt) { if (obj) { obj.act = { name, t: 0, dur: dur || 0.5, reach: reach || 0, att: tgt ? obj : null, tgt }; A.play(name); } }
  function partyAct(name, dur) { if (name === "attack") act(S.party[0], name, dur, lungeReach(S.party[0], S.enc && S.enc.act), S.enc && S.enc.act); else S.party.forEach(m => act(m, name, dur)); }
  // Darkest-Dungeon-style strike (Magnus): snap into the strike pose, lunge across to the target, a short hold on the
  // impact (hit SFX, the target's hurt frame + knockback, a small shake), slide back to the spot. 0.55 s in all.
  // Fractions of the strike: snap 0-.12 (slight wind-up back), lunge .12-.38, impact hold .38-.60, return .60-1.
  const STRIKE = { dur: 0.55, impact: 0.21 }; // impact = .38 x .55 s: when the hit lands
  function lungeReach(att, tgt) { if (!att || !tgt) return 0; // layout units the attacker travels to touch the target
    const isP = att.sx != null, ap = isP ? partyPose(att) : dragonPose(att), tp = isP ? dragonPose(tgt) : partyPose(tgt);
    const hx = ap ? ap.x : screenX(att.x), tx = tp ? tp.x : screenX(tgt.x);
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
      const ap = a.att && (a.att.sx != null ? partyPose(a.att) : dragonPose(a.att));
      const tp = a.tgt && (a.tgt.sx != null ? partyPose(a.tgt) : dragonPose(a.tgt));
      const rise = S.enc && S.enc.depth && ap && tp ? (tp.y - ap.y) * Math.max(0, Math.min(1, x / R)) : 0;
      return { action: KM.Assets.hasAnim(id, "attack") ? "attack" : "idle", t: a.t, dx: x * dir, dy: rise, hurt: false }; } // feet stay on the ground
    if(a.name==='roar')return {action:'idle',t:a.t,dx:-dir*10*Math.sin(Math.PI*k),dy:0,rot:-dir*.018*Math.sin(Math.PI*k),hurt:false};
    if (a.name === "knock") return { action: "idle", t: a.t, dx: -dir * 26 * Math.sin(Math.PI * Math.min(1, k * 1.6)), dy: 0, hurt: false }; // knockback under a drawn hurt frame
    if (a.name === "respects") { const s = Math.sin(Math.PI * k); return { action: "idle", t: a.t, dx: 0, dy: 10 * s, rot: 0.1 * s, hurt: false }; } // bow
    if (a.name === "hurt") return { action: "idle", t: a.t, dx: Math.sin(a.t * 70) * 12 * (1 - k) - dir * 26 * Math.sin(Math.PI * Math.min(1, k * 1.6)), dy: 0, hurt: a.t < 0.16 }; // shake + knockback + a brief full-opacity red flash
    return { action: a.name, t: a.t, dx: 0, dy: 0, hurt: false };
  }
  // enemy hit / death: drawn sequences when the creature has them (rabbit), else hurt blink / stepped vanish (no puppet falls)
  function enemyHit(a) { const cfg = KM_ART.entities[a.id] || {}; if (cfg.seq && cfg.seq.hurt && KM.Assets.hasAnim(a.id, "hurt")) { a.seqPlay = { id: cfg.seq.hurt, t: 0 }; A.play("hurt"); act(a, "knock", 0.35); } else act(a, "hurt", 0.5); }
  function enemyDeath(a) {
    queueLoot(a);
    const cfg = KM_ART.entities[a.id] || {}; a.act = null;
    if (cfg.seq && cfg.seq.death && KM.Assets.hasAnim(a.id, "death")) { a.seqPlay = { id: cfg.seq.death, t: 0, hold: true }; a.state = "corpse"; }
    else { a.state = "vanish"; a.t = 0; }
    A.play("enemy_fall");
  }

  // ---------- encounters ----------
  function encounterMusic(st) {
    if (st.type === "rest") return "rest_" + st.rest;
    if (isFight(st) || st.type === "special" || st.type === "optional") return (D.music.enemyScenes || {})[st.enemy] || (st.type === "math" || st.type === "special" || st.type === "optional" ? "battle" : st.type);
    return st.type; // riddle, recruit
  }
  function engage(st, actr) {
    S.mode = "encounter";
    S.enc = { st, act: actr, type: st.type, phase: null, msg: "", bonus: 0, lost: Math.max(0,maxHp()-S.hp) };
    switch (st.type) {
      case "math": case "boss": case "mega": approach(); break;   // music waits for the commit
      case "special": startFrank(); break;
      case "optional": optionalBoss(); break;
      case "riddle": musicScene("riddle"); startRiddle(); break;
      case "recruit": musicScene("recruit"); renderRecruit(); break;
      case "rest": musicScene(encounterMusic(st)); startRest(); break;
    }
  }
  function optionalBoss(){
    const e=S.enc;if(!e||e.st.type!=='optional')return;
    e.phase='optional';heroSay('Something is listening beyond the graves.',inPhase('optional'));
    showPanel(actionRow([
      actionCard({label:'Awaken the bell',act:'awakenBell',icon:MICON.hard,meta:'Optional boss',note:'A dangerous detour'}),
      actionCard({label:'Leave it sleeping',act:'leaveBell',icon:'→',meta:'Safe passage'})
    ]),'info action-panel');
  }
  function awakenBell(){
    const e=S.enc;if(e?.phase!=='optional')return;e.phase='busy';e.act.sp=null;S.party.forEach(m=>m.sp=null);
    inkTransition(()=>{if(S.enc!==e)return;e.phase='approach';commit();});
  }
  function leaveBell(){if(S.enc?.phase!=='optional')return;S.enc.act.hidden=true;finishEncounter();}
  // ---- hidden strength: commit or avoid
  function approach() {
    const e = S.enc; e.phase = "approach";
    if(isFellowship())return commit();
    const can = C.avoidable[e.st.type];
    heroSay(e.st.type === "math" ? "Something lurks in the mist..." : "It blocks the whole road. No way around!", inPhase("approach"));
    showPanel(actionRow([actionCard({label:'Fight',act:'commit',icon:MICON.hard}),...(can?[actionCard({label:'Avoid',act:'avoid',icon:'→',note:'Hunters advance'})]:[])]),'info action-panel');
  }
  // Balance switches (src/data/balance_try.js): Fellowship health ramps per battle when the curve switch is on
  function foeHealth(hp){const k=BT.healthMul(S);return k?Math.ceil(hp*k):KM.Fellowship.health(hp);}
  function commit() {
    const e = S.enc; if (!e || (e.phase !== "approach" && e.phase !== "frank")) return;
    if (e.st.id === "frank" && !e.depth) { beginDragonApproach(); return; }
    const id = e.act.id, E = D.enemies[id] || {}, cs = e.act.combat || C.enemies[id] || { hp: 6, atk: 1 };
    e.lost=Math.max(0,maxHp()-S.hp);
    e.phase = "busy"; e.hp = e.maxHp = isFellowship()?foeHealth(cs.hp):cs.hp; e.atk = cs.atk; e.heals = C.healsPerFight; e.fireUses = IT.usesPerBattle; e.fallen=[]; e.resurrected=false; e.revealed = true;
    // every foe of this stop (a group = several), each with its own hearts; e.act / e.hp mirror the FRONT one
    e.foes = S.actors.filter(a => a.stop === S.stop && a.foe && !a.dead).sort((a, b) => a.x - b.x);
    e.foes.forEach(a => { const c2 = a.combat || C.enemies[a.id] || { hp: 6, atk: 1 }; a.hp = a.maxHp = isFellowship()?foeHealth(c2.hp):c2.hp; a.atk = c2.atk; if (a !== e.act) { a.distant = false; a.closing = { t: 0, dur: 0.7 }; } });
    e.act.hp = e.hp; e.act.maxHp = e.maxHp; e.act.atk = e.atk;
    if(BT.packRelay(e))e.st.relay=true; // curve switch: countryside packs take turns
    if(e.st.relay) planPackTurn(e);
    if (S.mead === 1) { S.mead = 2; e.mead = true; renderHUD(); } // v11b tavern mead: THIS battle's sums are all stupid
    if ((KM_ART.entities[id] || {}).onHill && S.swaps) Object.values(S.swaps).forEach(q => (q.on = false)); // v19: it comes down from its hill
    e.act.distant = false; e.act.closing = { t: 0, dur: 0.7 }; (e.foes || [e.act]).forEach(a => { if (a.state === "walkin" || a.state === "waiting") { a.state = "idle"; a.active = true; a.x = a.homeX != null ? a.homeX : e.st.stopX; } });
    if (e.depth) { e.depth.mode = "battle"; e.act.closing = null; }
    else if (e.st.type === "special") e.act.x = e.st.stopX + 260;
    musicScene(encounterMusic(e.st));
    const roaring=living(e).find(f=>KM.Timing.pattern(f.id).roar);
    if(roaring)return bossEntrance(e,roaring);
    say(e.act, e.act.taunt || E.taunt);
    later(0.75, () => {if(S.enc===e)renderChoice();});
  }
  function bossEntrance(e,boss) {
    e.phase='bossEntrance';e.pressureReady=false;
    S.voices=[];S.party.forEach(m=>m.sp=null);boss.sp=null;
    const name=T(D.enemies[boss.id]?.name||boss.id);
    showPanel(`<div class="boss-entrance" role="status"><strong>${esc(name)}</strong><p>${T('A mighty roar...')}</p></div>`,'info');
    paintTimingLegend();
    later(.75,()=>{if(S.enc!==e||S.dying)return;
      A.play('dragon_roar',{gain:.55});S.shake=.36;act(boss,'roar',.65);
      later(.25,()=>{if(S.enc!==e||S.dying)return;
        e.pressureReady=true;paintTimingLegend();
        showPanel(`<div class="boss-entrance pressure-reveal" role="status"><strong>${esc(name)}</strong><p>${T('Its roar pushes your timing windows back.')}<br><small>${T('Red marks the time taken away.')}${KM.Timing.pattern(boss.id).deadline?' '+T('It strikes when the bar fills.'):''}</small></p></div>`,'info');
      });
    });
    later(2.6,()=>{if(S.enc===e&&!S.dying)renderChoice();});
  }
  function avoid() {
    const e = S.enc; if (!e || e.phase !== "approach") return;
    e.phase = "busy"; e.act.state = "stay";
    huntersStep(C.hunters.avoidCost);
    if (S.dying) return;
    heroSay("Whatever that was, we'll never know.");
    finishEncounter();
  }
  // The Knight: the party is the deck. A committed card cannot be withdrawn or rerolled with Escape.
  function knightCards(e){return KM.Knight.library(S.party);}
  function knightCandidates(e,c){return living(e).filter(a=>!c?.execute||PA.executionReady(a));}
  function cardDropTarget(px,py){
    const e=S.enc;if(e?.phase!=='cards')return null;
    const r=cv.getBoundingClientRect(),x=(px-r.left)/r.width*VW,y=(py-r.top)/r.height*L.artSpaceH;
    if(x<0||x>VW||y<0||y>L.artSpaceH)return null;
    const tag=foeHeartsRects().find(({intent:b})=>b && x*K>=b.x && x*K<=b.x+b.w && y*K>=b.y && y*K<=b.y+b.h);
    if(tag)return tag.owner;
    // Pick among the visible figures, using their painted bounds (including the hill dragon).
    const hits=living(e).map(a=>{
      const pose=dragonPose(a),s=pose?.scale||1,cx=pose?.x??a.drawX??screenX(a.x),foot=pose?.y??a.drawY??W.groundY;
      const [lo,hi]=wideOf(a.id);return {a,left:cx+lo*s-28,right:cx+hi*s+28,top:foot-tallOf(a.id)*s-25,bottom:foot+24};
    }).filter(h=>x>=h.left&&x<=h.right&&y>=h.top&&y<=h.bottom);
    hits.sort((a,b)=>Math.abs(x-(a.left+a.right)/2)-Math.abs(x-(b.left+b.right)/2));return hits[0]?.a||null;
  }
  function cardDescription(c){
    return [T(c.damage+' '+(c.all?'to each foe':'damage')),c.block?'+'+c.block+' '+T('block'):null,c.heal?'+'+c.heal+' ♥':null,c.execute?T('half HP or less'):null,c.revive?T('revive if able'):null].filter(Boolean).join(' · ');
  }
  function renderKnight(e){
    const cards=knightCards(e),lookup=id=>cards.find(c=>c.id===id);
    e.phase='cards';e.answerTiming=null;e.cardGuard=0;e.activeCard=null;
    if(!e.deck)e.deck=KM.Knight.create(S.party,KM.Progression.random(S.runId+':cards:'+S.stop));
    const refill=e.deck.pending?e.deck.hand.indexOf(null):-1;
    KM.Knight.deal(e.deck,S.party);
    // A hand full of locked Executes must never leave the road without a legal play.
    if(!e.deck.hand.some(id=>knightCandidates(e,lookup(id)).length)){
      const j=e.deck.queue.findIndex(id=>knightCandidates(e,lookup(id)).length);
      if(j>=0)[e.deck.hand[0],e.deck.queue[j]]=[e.deck.queue[j],e.deck.hand[0]];
    }
    const faces=e.deck.hand.map((id,i)=>{
      const c=lookup(id),m=S.party.find(m=>m.id===c.owners[0]);
      const label=c.combo?T('Combo')+' · '+c.owners.map(id=>shortName(memberName(S.party.find(m=>m.id===id))).split(' ')[0]).join(' + '):m?memberName(m):T('Road trick');
      const difficulty=c.level.startsWith('execution')?T('Multiply'):T(({easy:'Easy',normal:'Medium',hard:'Hard'})[c.level]);
      const icon=c.risk==='fire'?'fire':c.risk==='lightning'?'lightning':c.heal||c.revive?'heal':c.block?'sacrifice':c.level==='easy'?'weak':'hard';
      const emblem=(c.name==='Stick jab'||c.name==='Overhead stick')?'<svg class="stick-stamp" viewBox="128 897 530 264" aria-hidden="true"><image href="assets/villager-start/v22/parts/stick.png" width="1037" height="1517"/></svg>':(c.name==='Sword thrust'||c.name==='Sword cleave')?'<img src="assets/ui/shop/sword-cutout.png" alt="">':MICON[icon]||'';
      return '<button type="button" class="knight-card '+(i===refill?'dealt':'')+'" data-act="knightPlay"  data-knight-slot="'+i+'" '+(!knightCandidates(e,c).length?'disabled':'')+'><small>'+esc(label)+' · '+difficulty+'</small><span class="card-symbol" aria-hidden="true">' +emblem+'</span><strong>'+T(c.name)+'</strong><span>'+cardDescription(c)+'</span>'+(c.risk?'<em>'+T(c.risk==='fire'?'Miss: party burns':'Miss: strikes both sides')+'</em>':'')+'</button>';
    });
    if(S.spells>0||S.spellLeft>0)faces.push('<button type="button" class="knight-card consumable" title="Ease one card’s maths" data-act="knightScroll" data-knight-slot="scroll" '+(S.spellLeft||meadNow()?'disabled':'')+'><small>'+T('Item')+' · '+S.spells+'</small><span class="card-symbol">'+spellIcon('btn')+'</span><strong>'+T('Stupidity scroll')+'</strong><span>'+T(S.spellLeft?'Armed for this sum':'Drag onto an attack')+'</span></button>');
    const next=lookup(e.deck.queue[0]);
    showPanel('<div class="knight-hand"><div class="knight-fan">'+faces.join('')+'</div><aside class="knight-guide"><small>'+T('Next draw')+'</small><strong>'+T(next.name)+'</strong><p>'+T('Drag to a foe, or click to attack the first. One card per turn.')+'</p></aside></div>','cards');
    KM.KnightHand.bind({canPlay:()=>isKnight()&&S.enc?.phase==='cards',hitTarget:cardDropTarget,play:playKnight,arm:armKnightScroll});
  }
  function armKnightScroll(){
    const e=S.enc;if(!isKnight()||e?.phase!=='cards'||!S.spells||S.spellLeft||meadNow())return false;
    castSpell();renderKnight(e);return true;
  }
  function playKnight(slot,target){
    const e=S.enc;if(!isKnight()||e?.phase!=='cards'||S.dying)return;
    const c=knightCards(e).find(c=>c.id===e.deck.hand[slot]);if(!c)return;
    const candidates=knightCandidates(e,c);target=target||candidates[0];
    if(!candidates.includes(target)||!KM.Knight.commit(e.deck,slot))return;
    e.activeCard=c;e.action='card';const caster=S.party.find(m=>m.id===c.owners[0])||S.party[0];
    const right=()=>{
      if(c.heal){const before=S.hp;hearts(c.heal*BT.unit());e.lost=Math.max(0,(e.lost||0)-(S.hp-before));}
      if(c.revive&&canResurrect()){const m=e.fallen.pop();unburyCompanion(m);delete m.dying;delete m.eaten;delete m.act;m.sp=null;m.hopY=0;S.party.push(m);m.sx=slotX(S.party.length-1);e.resurrected=true;hearts(BT.unit());e.lost=(e.lost||0)+PA.life(m)-BT.unit();}
      e.cardGuard=c.block||0;const targets=c.all?living(e):[target],timing=e.answerTiming;
      act(caster,'attack',STRIKE.dur,lungeReach(caster,target),target);A.play(c.level==='easy'?'swing_weak':'swing_hard');
      if(c.risk==='lightning')S.lightning={t:0,targets:targets.map(a=>({x:centreX(a),y:W.groundY-tallOf(a.id)*.5}))};
      if(c.risk==='fire')KM.FireFx.start({from:{x:partyPose(caster).x,y:W.groundY-200},targets:targets.map(a=>({x:centreX(a),y:W.groundY}))});
      later(STRIKE.impact,()=>hitFoes(e,targets,c.damage,timing));later(STRIKE.dur,()=>settleHits(e,targets));
    };
    const wrong=()=>{
      if(c.risk==='lightning')return wizardLightning(true);
      if(c.risk==='fire')return fireFizzle();
      turnWrong('card');
    };
    ask(c.level,right,wrong,null,undefined,'card');
  }

  // Fellowship keeps one maths prompt, but every member retains their role.
  function fellowshipQuestion(e) {
    if(S.enc!==e || S.dying || e.hp<=0)return;
    e.action='fellowship';e.answerTiming=null;e.fellowshipVolley=null;
    let level=KM.Progression.stage(e.st,S.stops)===0?'easy':'normal';
    e.leader=BT.on('whoActs')?BT.pickLeader(S.party.filter(PA.alive),{foes:living(e).length,boss:['boss','mega'].includes(e.st.type),hurt:S.hp<maxHp()/2},Math.random,role=>CARDS?CARDS.levelBonus(S,role):0):null;
    if(e.leader){level=e.leader.level;if(e.leader.cue)A.play(e.leader.cue);const p=partyPose(e.leader.member);float(e.leader.sign,p.x,W.groundY-tallOf(artId(e.leader.member))-40,'#ecdcc4');}
    ask(level,()=>fellowshipVolley(e),()=>fellowshipWrong(e),null,undefined,'fellowship');
  }
  function fellowshipWrong(e) {
    if(CARDS&&CARDS.missChip(S)&&S.party.filter(PA.alive).length>1&&S.hp>1){const ally=S.party.filter(PA.alive)[1],n=Math.min(CARDS.missChip(S),S.hp-1);hearts(-n);e.lost=(e.lost||0)+n;float(`−${BT.heartsText(n)} ♥`,partyPose(ally).x,W.groundY-tallOf(artId(ally))+60,'#b3321f');renderHUD();} // Swing and a Miss
    if(!S.party.some(m=>PA.alive(m)&&KM.Fellowship.risky(m)))return turnWrong('fellowship');
    showCorrected(e.problem);huntersStep(1);
    if(S.dying)return;
    const witness=S.party.find(m=>PA.alive(m)&&!KM.Fellowship.risky(m));
    if(witness)speak(witness,'The OTHER side!');
    fellowshipVolley(e,true);
  }
  function fellowshipVolley(e,failed=false) {
    if(S.enc!==e || S.dying)return;
    e.phase='busy';if(!failed)hush();
    const foes=living(e),timing=e.answerTiming;
    const hits=KM.Fellowship.plan(S.party,foes,timing?.multiplier??1,{failed,hp:S.hp,maxHp:maxHp(),heals:e.heals,leader:e.leader?.member,leaderMultiplier:e.leader?.multiplier||1,knightTargets:CARDS?CARDS.knightTargets(S):0,burn:CARDS?CARDS.burn(S):0,wizardDamage:CARDS?CARDS.wizardDamage(S):0});
    if(!hits.length)return;
    const volley=e.fellowshipVolley={hits:hits.length,landed:0,total:0,backfire:0,failed};
    const targets=[...new Set(hits.flatMap(h=>h.impacts.map(i=>i.target)))];
    const half=(hits.length-1)*85;
    const origin=Math.max(VW*.59+half,Math.min(VW-240-half,(targets.length?targets:foes).reduce((sum,a)=>sum+centreX(a),0)/(targets.length||foes.length)));
    const valid=()=>S.enc===e && !S.dying && e.fellowshipVolley===volley;
    // Let every bottle complete its own flight. Align the other impacts to that
    // same volley, so damage lands with the art instead of before the flames.
    const lead=hits.some(h=>h.kind==='fire')?KM.FireFx.hitDelay():STRIKE.impact;
    const foePoints=h=>h.impacts.map(({target:a})=>({x:centreX(a),y:dragonPose(a)?.y||W.groundY}));
    const partyPoints=()=>S.party.filter(PA.alive).map(m=>({x:partyPose(m).x,y:partyPose(m).y}));
    for(const hit of hits){
      const {member,target,kind,index,delay}=hit;
      const impactAt=lead+delay;
      const begin=()=>{if(!valid()||!PA.alive(member))return;
        const p=partyPose(member);
        if(kind==='fire'){
          act(member,'attack',lead+.15);A.play(IT.sfx.throw);
          KM.FireFx.start({from:{x:p.x+60*p.scale,y:p.y-tallOf(artId(member))*.6*p.scale},targets:foePoints(hit).concat(failed?partyPoints():[]),append:true});
        }else if(kind==='lightning'){
          act(member,'bless',.6);A.play('hit_boss',{gain:.6});
          S.lightning={t:0,targets:hit.impacts.map(({target:a})=>({x:centreX(a),y:(dragonPose(a)?.y||W.groundY)-tallOf(a.id)*.5})).concat(failed?S.party.filter(PA.alive).map(m=>({x:partyPose(m).x,y:partyPose(m).y-tallOf(artId(m))*.5})):[])};
        }else if(kind==='heal')act(member,'bless',.7);
        else {act(member,'attack',STRIKE.dur,Math.min(240,lungeReach(member,target)));A.play(kind==='execute'?'swing_hard':'swing_weak',{gain:.45});}
      };
      const startAt=kind==='fire'?delay:Math.max(0,impactAt-STRIKE.impact);
      if(startAt)later(startAt,begin);else begin();
      later(impactAt,()=>{
        if(!valid()||!PA.alive(member))return;
        if(hit.heal){
          const before=S.hp;hearts(hit.heal*BT.unit());const healed=S.hp-before;e.heals--;e.lost=Math.max(0,(e.lost||0)-healed);A.play('heal');
          const p=partyPose(member);float('+'+healed+' ♥',p.x,p.y-tallOf(artId(member))*.5,'#ac5c24');
        }
        for(const {target:a,amount} of hit.impacts){enemyHit(a);a.hp=Math.max(0,a.hp-amount);}
        syncFront(e);volley.landed++;volley.total+=hit.amount;
        if(hit.impacts.length){
          S.shake=.10+index*.025;A.play(hitSfx(e),{gain:.55+index*.12,rate:.94+index*.07});
          S.floats.push({fellowship:true,text:Number(hit.amount.toFixed(2)),caption:timing?.crit?T('CRIT'):'',index,crit:!!timing?.crit,x:origin+(index-(hits.length-1)/2)*170,y:130+index*7,t:0,life:1.3});
        }
        if(hit.backfire){
          // One shared damage per caster, not one per party member. Armour still
          // absorbs first; only red-heart loss counts toward a companion's death.
          const harm=PA.absorb(S.party,1);hearts(-harm.hearts);e.lost=(e.lost||0)+harm.hearts;volley.backfire++;
          S.party.filter(PA.alive).forEach(m=>act(m,'hurt',.25));A.play(harm.blocked?'hit_blocked':'hit_party');
          float(harm.hearts?'−1 ♥':'blocked!',400+index*160,160+index*18,harm.hearts?'#b3321f':'#bcc0c3');
        }
        renderHUD();save();
      });
    }
    later(lead+hits[hits.length-1].delay+.45,()=>{
      if(!valid())return;
      if(hits.length>1 && volley.total){
        S.floats=S.floats.filter(f=>!f.fellowship);
        const x=Math.max(VW*.65,Math.min(VW-300,targets.reduce((sum,a)=>sum+centreX(a),0)/targets.length));
        S.floats.push({fellowship:true,total:true,text:Number(volley.total.toFixed(2)),caption:T('PARTY DAMAGE'),crit:!!timing?.crit,index:0,x,y:130,t:0,life:1.1});
      }
      const settle=()=>{if(valid()){if(targets.length)settleHits(e,targets);else enemyTurn();}};
      // Resolve self-inflicted casualties even when the same spell killed the last foe.
      if(failed)afterHits(hits.some(h=>h.kind==='lightning')?'lightning':'fire',settle);else settle();
    });
  }

  // ---- turn combat
  function renderChoice() {
    const e=S.enc;if(!e || S.dying)return;e.deadlineStruck=new Set();e.deadlineBusy=false;if(isKnight())return renderKnight(e);if(isFellowship())return fellowshipQuestion(e);e.phase='choose';e.answerTiming=null;
    const bare=PA.unarmed(S.party[0]),easier=S.spellLeft>0||meadNow();
    const difficulty=level=>T(easier?'Easier maths':level);
    const amount=n=>Number(n.toFixed(2));
    const damage=n=>`<b>${amount(n)}</b> ${T('damage')}`;
    const owner=(m,level)=>memberName(m)+' · '+difficulty(level);
    const hint='Normal damage per enemy. First band blocks; second band crits; late answers deal half.';
    const moves=[
      actionCard({label:bare?'Light stick swing':'Weak swing',act:'pickWeak',icon:swingIcon(bare),meta:owner(S.party[0],'Easy'),detail:damage(weakDmg()),title:hint}),
      actionCard({label:bare?'Hard stick swing':'Hard swing',act:'pickHard',icon:swingIcon(bare),meta:owner(S.party[0],'Hard'),detail:damage(hardDmg()),title:hint})
    ];
    if(canHeal())moves.push(actionCard({label:'Heal',act:'pickHeal',icon:MICON.heal,meta:owner(priests()[0],PA.priestLevel(S.party,'heal')?'Easy':'Random maths'),detail:`+${PA.heal(S.party)} ♥`,note:T(e.heals+' uses left'),off:e.heals<=0||S.hp>=maxHp()}));
    if(firestarter())moves.push(actionCard({label:'Fire bottle',act:'pickFire',icon:MICON.fire,meta:memberName(firestarter())+' · '+T('Word typing'),detail:damage(PA.fire(S.party)),note:'Hits every foe',off:e.fireUses<=0,title:hint}));
    if(KM.DarkWizard?.present(S.party).length)moves.push(actionCard({label:'Dark lightning',act:'pickLightning',icon:MICON.lightning,meta:owner(KM.DarkWizard.present(S.party)[0],'Hard'),detail:damage(KM.DarkWizard.damage(S.party)),note:'Miss: hurts everyone',title:'Hits every foe. A wrong answer hits everyone; faster mistakes hurt more.'}));
    if(executioner())moves.push(actionCard({label:'Execute',act:'pickExecute',icon:MICON.hard,meta:owner(executioner(),'Multiply'),detail:damage(PA.execute(S.party,{hp:1,maxHp:2})),note:'half HP or less',off:!canExecute()}));
    if(priests().length>=2)moves.push(actionCard({label:'Resurrect',act:'pickResurrect',icon:MICON.heal,meta:T('Priests')+' · '+difficulty(PA.priestLevel(S.party,'resurrect')==='normal'?'Medium':'Hard'),detail:T('Revive one ally'),note:'Returns with 1 heart',off:!canResurrect()}));
    if(priests().length)moves.push(actionCard({label:'Sacrifice',act:'sacrifice',icon:MICON.sacrifice,meta:'Priest',detail:T(e.st.type==='mega'?'Boost the D20':'Escape this encounter'),note:'Lose one priest'}));
    if(e.st.type==='mega'){const need=needRoll();moves.push(actionCard({label:'Roll for it',act:'roll',icon:MICON.roll,meta:'D20',detail:T(need<=1?'Roll any':need>20?'Roll –':`Roll ${need}+`),note:'Test your luck',off:need>20}));}
    if(S.spells>0||S.spellLeft>0)moves.push(actionCard({label:'Stupidity scroll',act:'castSpell',icon:spellIcon('btn'),meta:T('Item')+' · '+S.spells,detail:T(S.spellLeft?'Armed for this sum':'Easier next sum'),note:'Score −2',off:!!S.spellLeft||meadNow()}));
    showPanel(actionRow(moves),'fight action-panel');
  }

  function pickAction(kind) {
    const e = S.enc; if (!e || e.phase !== "choose") return;
    if (kind === "heal" && (!canHeal() || e.heals <= 0 || S.hp >= maxHp())) return;
    if (kind === 'execute' && !canExecute()) return;
    if(kind==='resurrect' && !canResurrect())return;
    if(kind==='lightning'&&!KM.DarkWizard?.present(S.party).length)return;
    const a = C.actions[kind]; if(!a)return; let level = kind === "heal" ? (PA.priestLevel(S.party,kind)||pickOne(a.levels)) : kind==='resurrect' ? PA.priestLevel(S.party,kind) : a.level;
    { const si = S.stops.indexOf(e.st), nth = S.stops.slice(0, si < 0 ? 0 : si).filter(q => q.type === "math").length; // v12h: first fights simpler
      if (!["heal","resurrect","execute"].includes(kind) && e.st && e.st.type === "math" && nth < (C.starterFights || 0) && D.mathLevels["starter_" + level]) level = "starter_" + level; }
    e.action = kind; e.msg = "";
    ask(level, () => turnRight(kind), () => turnWrong(kind), () => renderChoice(), undefined, kind);
  }
  // Timing measures answer quality. Filling the bar never submits or fails the question.
  function combatWindows(kind=S.enc?.action) {
    const e=S.enc;
    const role={fire:'firestarter',execute:'executioner',lightning:'darkWizard',heal:'priest',resurrect:'priest'}[kind]||'knight';
    const owners=isFellowship()?S.party.filter(PA.alive):isKnight()&&e?.activeCard ? S.party.filter(m=>e.activeCard.owners.includes(m.id)) : PA.members(S.party,role);
    const pressure=e?.revealed&&e.pressureReady!==false?KM.Timing.pressure(living(e)):{};
    return KM.Timing.windows({weapon:Math.max(0,...owners.filter(PA.alive).map(m=>m.weapon||0)),armour:PA.armour(S.party.filter(PA.alive)),
      companions:S.party.filter(m=>m.id!=='hero'&&PA.alive(m)).length,pressure});
  }
  function paintTimingLegend() {
    const e=S.enc,w=e?.tmr?.windows||e?.answerTiming?.windows||combatWindows();
    const foes=e?.revealed?living(e):[];
    KM.TimingBar?.update(w,{visible:S.mode==='encounter'&&!!e?.revealed,timed:S.mode==='encounter'&&!!(e?.tmr||e?.answerTiming),jp:!!KM.I18n?.jp(),forgiving:foes.length>0&&foes.every(f=>KM.Timing.pattern(f.id).forgiving),deadline:foes.some(f=>KM.Timing.pattern(f.id).deadline),hit:e?.answerTiming?.fraction??null});
  }
  const NOTIMER = /[?&]debug\b/.test(location.search) && /[?&]notimer\b/.test(location.search);
  let tmrHold = 0;
  const sumDrawn = () => [...panel.querySelectorAll(".sum img")].every(i => i.complete && i.naturalWidth > 0); // the on-screen glyphs have painted
  function startAnswerTimer(secs) {
    const e = S.enc; if (!e) return null;
    e.tmr = null; e.answerTiming = null; tmrHold = 0; dividerFill(0);
    if (!(secs > 0) || NOTIMER || !e.q) return null;
    // the timer starts only once the sum's glyphs are loaded + decoded and the sum has been drawn (wait: true -> 1 -> 0)
    const wait = !!(e.phase === "math" && e.problem && KM.Assets.sumReady && !(KM.Assets.sumReady(e.problem.text) && sumDrawn()));
    return (e.tmr = { t: 0, q: e.q, secs, held: 0, wait, windows:e.revealed?combatWindows():KM.Timing.windows() });
  }
  function tickAnswerTimer(dt) {
    paintTimingLegend();
    if(document.hidden)return;
    const e = S.enc, T = e && e.tmr;
    if(e?.deadlineBusy)return dividerFill(1);
    if (!T || !["math", "spell", "riddle"].includes(e.phase) || e.q !== T.q || S.mode !== "encounter") { if (e && T && e.q !== T.q) e.tmr = null; tmrHold = Math.max(0, tmrHold - dt); return dividerFill(e?.answerTiming?.fraction??(tmrHold > 0 ? 1 : 0)); }
    if (T.wait) { if (T.wait === true && KM.Assets.sumReady(e.problem.text)) { T.wait = 1; if (e.phase === "math") renderMath(); } else if (T.wait === 1 && sumDrawn()) T.wait = 0; return dividerFill(0); }
    // a hold (strike, toast, a foe stepping up) is short; a stale one (an act on a dead / inactive foe, a stuck walk-in)
    // must never freeze the bar, so after C.answerPauseMax s of continuous hold it runs anyway
    const paused = timerPause(e); T.held = paused ? (T.held || 0) + dt : 0;
    if (!paused || T.held > (C.answerPauseMax || 3)) T.t = Math.min(T.secs,T.t+dt);
    const secs = T.secs || C.answerSecs, left = secs - T.t; // v12k: the fire bottle's word has its own (shorter) time
    if (left > 0 && left <= (C.answerTickLast || 0) && Math.ceil(left) !== T.tick) { T.tick = Math.ceil(left); A.play(C.answerTickSfx || "type_blip"); } // subtle tick, existing SFX hook
    dividerFill(Math.min(1, T.t / secs));
    if(T.t>=secs)deadlineCounter(e,T);
  }
  function deadlineCounter(e,clock) {
    if(S.enc!==e||S.dying||!e.revealed||!e.q||clock.deadlineFired||e.deadlineBusy)return;
    clock.deadlineFired=true;
    const struck=e.deadlineStruck||(e.deadlineStruck=new Set());
    const foes=living(e).filter(f=>KM.Timing.pattern(f.id).deadline&&intentDamage(e,f)>0&&!struck.has(f));
    if(!foes.length)return;
    const phase=e.phase;e.phase='deadline';e.deadlineBusy=true;e.deadlineFrom=phase; // typing keeps working during the strike (typeKey)
    foes.forEach(f=>struck.add(f));
    const resume=()=>{if(S.enc!==e||S.dying)return;e.deadlineBusy=false;e.deadlineFrom=null;
      const enter=e.enterQueued;e.enterQueued=false;
      // A dead card owner cannot cast from the grave. The committed card stays spent.
      if(e.activeCard?.owners.some(id=>!S.party.some(m=>m.id===id&&PA.alive(m)))){
        if(e.problem?.scrollAssisted)spellTick();
        e.q=null;e.tmr=null;return returnToHand(e);
      }
      e.phase=phase;
      if(phase==='math'){const el=$("answer");if(el)el.innerHTML=G(e.input)||"&nbsp;";if(enter)submitAnswer();} // Enter pressed mid-strike
    };
    foes.forEach((f,i)=>later(i*.6,()=>{if(S.enc===e&&!S.dying)foeStrike(e,f,false,{deadline:true});}));
    later((foes.length-1)*.6+.6,()=>{if(S.enc===e&&!S.dying)afterHits(foes[foes.length-1].id,resume);});
  }
  // why the answer timer is holding right now (null = running); also exposed as __km.timerWhy for the tests
  function timerPause(e) {
    const foes = e.foes || [e.act];
    if (S.dying) return "dying"; if (S.toast) return "toast"; if (S.view && S.view.a < 1) return "view transition"; if (e.sub) return "sub";
    const m = S.party.find(m => m.act || m.dying); if (m) return "party:" + (m.dying ? "dying" : m.act.name);
    const a = foes.find(a => a && a.active && !a.dead && !a.gone && (a.act || a.state === "walkin")); if (a) return "foe:" + a.id + ":" + (a.act ? a.act.name : a.state) + (a.dead ? ":dead" : "") + (a.active ? "" : ":inactive") + (a.gone ? ":gone" : "");
    return null;
  }
  // A flat orange ink strip advances on its own thin rail above the decorative divider.
  let dvFillFrac = -1;
  function dividerFill(f) {
    const fill=document.getElementById('dvfill');if(!fill)return;
    f = Math.max(0, Math.min(1, f)); if (Math.abs(f - dvFillFrac) < 0.0005) return; dvFillFrac = f;
    fill.style.width=(f*100)+'%';fill.style.opacity=f>0?'1':'0';
  }
  // hit sound: the boss hit in boss / mega fights, else by the monster's material (enemies.js): flesh or armour
  const hitSfx = e => (["boss", "mega"].includes(e.st.type) ? "hit_boss" : (D.enemies[e.act.id] || {}).material === "armour" ? "hit_armour" : "hit_flesh");
  function turnRight(kind) {
    const e = S.enc;
    if(kind==='lightning')return wizardLightning(false);
    if(kind==='resurrect'){
      if(!canResurrect())return renderChoice();
      const m=e.fallen.pop();unburyCompanion(m);delete m.dying;delete m.eaten;delete m.act;m.sp=null;m.hopY=0;
      S.party.push(m);m.sx=slotX(S.party.length-1);e.resurrected=true;hearts(BT.unit());e.lost=(e.lost||0)+PA.life(m)-BT.unit();A.play('heal');
      act(priests()[0],'bless',.7);speak(priests()[0],'You are not excused yet. Get up.');save();return later(.6,enemyTurn);
    }
    if (kind === "heal") { if (!canHeal()) return renderChoice(); act(priests()[0],"bless",.7); speak(priests()[0], "Hold still. This is probably a blessing."); e.heals--; const hb = S.hp; hearts(PA.heal(S.party)); e.lost = Math.max(0, (e.lost || 0) - (S.hp - hb)); /* healed hearts are not "lost" */ A.play("heal"); float(`+${S.hp-hb} ♥`, slotX(0), W.groundY - tallOf("hero") + 70, "#9be28a"); return later(0.6, enemyTurn); }
    if(kind==='execute' && !canExecute())return renderChoice();
    const dmg = kind==='execute' ? a=>PA.execute(S.party,a) : kind === "hard" ? hardDmg() : weakDmg();
    // sound hooks: the swing at the wind-up, the hit on the impact pose (0.18 s), per attack kind
    if(kind==='execute')act(executioner(),'attack',STRIKE.dur,lungeReach(executioner(),e.act),e.act);else partyAct("attack",STRIKE.dur);
    if(kind==='execute' || !PA.unarmed(S.party[0])) A.play('swing_'+(kind==='execute'?'hard':kind)); A.play('hit');
    // the sword hits the 2 front-most living foes (combat.groups.swordHits), each takes the full damage
    const tg = living(e).slice(0, kind==='execute'?1:(GRP().swordHits || 2)), timing = e.answerTiming;
    later(STRIKE.impact, () => hitFoes(e, tg, dmg, timing));
    later(STRIKE.dur, () => settleHits(e, tg));
  }
  // a party hit lands on the foes tg (sword or fire): hit flash, damage, the damage number over each
  function hitFoes(e, tg, dmg, timing) {
    if (S.enc !== e || S.dying) return;
    S.shake = 0.18; A.play(hitSfx(e));
    tg.forEach(a => {
      const amount = (typeof dmg === 'function' ? dmg(a) : dmg) * (timing?.multiplier ?? 1);
      enemyHit(a); a.hp = Math.max(0, a.hp - amount);
      const p = dragonPose(a), label = `${timing?.crit ? 'crit ' : ''}−${amount}`;
      float(label, centreX(a), (p ? p.y : W.groundY) - tallOf(a.id) * (p ? p.scale : 1) + 70, timing?.crit ? '#ef9139' : '#ffe680');
    });
    syncFront(e);
  }
  // after a party hit: the dead fall (all dead = the fight is won), the rest close up, then the enemies' turn
  function settleHits(e, tg) {
    if (!living(e).length) { e.act = tg[tg.length - 1]; e.hp = 0; tg.slice(0, -1).forEach(a => { if (!a.gone) { a.gone = true; enemyDeath(a); } }); return defeatEnemy(); }
    tg.filter(a => a.hp <= 0 && !a.gone).forEach(a => { a.gone = true; say(a, (D.enemies[a.id] || {}).defeat); enemyDeath(a); });
    stepUp(e); syncFront(e); later(tg.some(a => a.hp <= 0) ? 1.0 : 0.5, enemyTurn);
  }
  const centreX = a => (dragonPose(a) ? dragonPose(a).x : screenX(a.x)) + ((window.KM_WIDE && KM_WIDE[a.id]) ? (KM_WIDE[a.id][0] + KM_WIDE[a.id][1]) / 2 : 0); // a foe's body centre on screen

  // ---- Timmy: type a word to ignite every living foe; the final letter determines timing quality.
  // His role gates the move; no inventory charge. Failure deals no damage, then enemies take their turn.
  // The word challenge is KM.Spelling (src/modes/spelling.js), the drawings KM.FireFx (src/engine/firefx.js), numbers in
  // KM_DATA.items.fireBottle / KM_DATA.words.
  function pickFire() {
    const e = S.enc; if (!e || e.phase !== "choose" || !firestarter() || e.fireUses <= 0) return;
    if(Number.isFinite(e.fireUses))e.fireUses--; e.action = "fire"; e.msg = ""; e.phase = "spell";
    const words=Array.from({length:IT.wordsPerAttack||1},()=>KM.Spelling.pickWord(KM.I18n?.words()||D.words[IT.words]));
    e.spell = KM.Spelling.start(words.join(' '));
    e.q = { onWrong: fireFizzle, sfx: IT.sfx.fizzle };
    startAnswerTimer(IT.spellSecs);
    speak(firestarter(),pickOne(IT.lines.light)); renderSpell();
  }
  const renderSpell = cls => showPanel(`<div class="center spellp">${KM.I18n?.jp()?`<div class="kana-prompt">${KM.I18n.kana(S.enc.spell.word)}<small class="romaji-hint">${T('Type the letters shown (romaji).')}</small></div>`:""}${KM.Spelling.drawWord(S.enc.spell, cls)}</div>`, "math");
  function spellKey(k) {
    const e = S.enc; if (!e || e.phase !== "spell" || e.sub || !e.q) return;
    const r = KM.Spelling.key(e.spell, k); if (!r) return;
    A.play(r === "bad" ? IT.sfx.letterBad : IT.sfx.letterOk); renderSpell();
    if (r === "done") { e.answerTiming = KM.Timing.grade(e.tmr, e.q); e.q = null; e.tmr = null; e.phase = "busy"; S.stats.correct++; awardScore(e.answerTiming, "word"); fireThrow(); }
  }
  function fireThrow() {
    const e = S.enc, tg = living(e), m=firestarter(); if(!m)return renderChoice(); const dmg=PA.fire(S.party), p=partyPose(m), timing=e.answerTiming;
    speak(m,pickOne(IT.lines.throw)); act(m,"attack",.5); A.play(IT.sfx.throw);
    const hitAt = KM.FireFx.start({ from: { x:p.x+60*p.scale,y:p.y-tallOf(artId(m))*.6*p.scale }, targets: tg.map(a => ({ x:centreX(a),y:dragonPose(a)?dragonPose(a).y:W.groundY })) });
    later(hitAt, () => hitFoes(e, tg, dmg, timing));
    later(hitAt + 0.6, () => settleHits(e, tg));
  }
  function fireFizzle() {
    if(isKnight())showCorrected(S.enc.problem);else renderSpell("fizzled"); speak(firestarter(),pickOne(IT.lines.fizzle));
    if(isKnight())huntersStep(1);else if (IT.hunters) huntersStep(IT.hunters);
    if(isKnight()&&!S.dying){
      const e=S.enc;let hurt=0;const members=S.party.filter(PA.alive);
      KM.FireFx.start({from:{x:partyPose(firestarter()).x,y:W.groundY-200},targets:members.map(m=>({x:partyPose(m).x,y:W.groundY}))});
      for(const m of members){const hit=PA.absorb([m],1);hurt+=hit.hearts;act(m,'hurt',.4);float(hit.hearts?'−1 ♥':'blocked!',partyPose(m).x,W.groundY-tallOf(artId(m))+70,'#b3321f');}
      hearts(-hurt);e.lost=(e.lost||0)+hurt;const witness=members.find(m=>m!==firestarter());if(witness)speak(witness,'Timmy! The OTHER side!');renderHUD();save();
      return later(.6,()=>afterHits('fire',enemyTurn));
    }
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
    if(kind==='lightning')return wizardLightning(true);
    say(e.act, `${pickOne(D.dialogue.wrong)} It's ${e.problem.answer}!`);
    showCorrected(e.problem);   // the sum stays the focus: shown again, carved, with the right answer
    huntersStep(1);
    if (!S.dying) later(0.6, enemyTurn);
  }
  function wizardLightning(failed) {
    const e=S.enc,m=KM.DarkWizard.present(S.party)[0];if(!e||!m)return;
    e.phase='busy';const foes=living(e).slice();
    const amount=failed?KM.DarkWizard.backfire(e.failedFraction):KM.DarkWizard.damage(S.party);
    const targets=foes.map(a=>({x:centreX(a),y:(dragonPose(a)?.y||W.groundY)-tallOf(a.id)*.5}));
    if(failed)targets.push(...S.party.filter(PA.alive).map(m=>({x:partyPose(m).x,y:partyPose(m).y-tallOf(artId(m))*.5})));
    S.lightning={t:0,targets};act(m,'bless',.6);A.play('hit_boss');
    if(failed){speak(m,'That was the wrong answer. Everybody duck!');showCorrected(e.problem);huntersStep(1);}
    later(.15,()=>{
      if(S.enc!==e||S.dying)return;
      hitFoes(e,foes,amount,failed?null:e.answerTiming);
      if(failed){let hurt=0;for(const member of S.party.filter(PA.alive)){const hit=PA.absorb([member],amount);hurt+=hit.hearts;act(member,'hurt',.4);float(hit.hearts?'−'+hit.hearts+' ♥':'blocked!',partyPose(member).x,W.groundY-tallOf(artId(member))+70,'#b3321f');}
        hearts(-hurt);e.lost=(e.lost||0)+hurt;renderHUD();save();}
    });
    later(.65,()=>{if(S.enc!==e||S.dying)return;const settle=()=>{if(S.enc===e&&!S.dying)settleHits(e,foes);};if(failed)afterHits('lightning',settle);else settle();});
  }
  const showCorrected = pr => showPanel(`<div class="center mathp"><div class="sum corr"><span class="problem">${G(pr.text + " =")}<span class="answer">${G(String(pr.answer))}</span></span></div></div>`, "math");
  // v11b (Magnus: "the important part is that the question is centered"): the question (e.g. "7 + 5 =") is centred on
  // the screen; the answer hangs off its right edge (absolutely placed), so typing never shifts the question
  // a surviving enemy acts after the player's action (never a duplicate penalty for the wrong answer itself)
  // Choose once before the player's action. Killing the attacker forfeits the bite;
  // nobody fills its place until the enemy turn is over. Slots stay stable after a death.
  function planPackTurn(e) {
    if(!e.packOrder)e.packOrder=e.foes.slice().sort((a,b)=>(a.homeX??a.x)-(b.homeX??b.x));
    const slots=e.packOrder,n=slots.length;
    const start=e.packAttacker ? (slots.indexOf(e.packAttacker)+1)%n : n-1;
    e.packAttacker=null;
    for(let i=0;i<n;i++){const f=slots[(start+i)%n];if(f.hp>0&&!f.gone){e.packAttacker=f;break;}}
  }
  function intentDamage(e,f){return (e.st.relay && e.packAttacker!==f)||f.stunned ? 0 : BT.bossAtk(e,f.atk??e.atk);}
  function intentLabel(e,f){
    if(f.stunned)return T('Stunned');
    const dmg=intentDamage(e,f);if(!dmg)return T('Circling');
    const p=KM.Timing.pattern(f.id);
    const label=p.forgiving?'Correct = block':p.deadline?'Full bar':(p.crit||p.block)?'Pressure':'Attack';
    return T(label)+' · '+dmg;
  }
  function returnToHand(e){
    if(S.enc!==e||S.dying)return;
    e.resolvingEnemyTurn=false;e.turns=(e.turns||0)+1;
    if(e.st.relay)planPackTurn(e);
    renderChoice();
  }
  function enemyTurn() {
    const e = S.enc; if (!e || S.dying || e.hp <= 0) return;
    e.resolvingEnemyTurn=true;
    // A fast correct answer guards the entire immediate response, including untouched foes.
    // It consumes no silver armour and expires before the next hand/action.
    e.timingBlock=!!e.answerTiming?.block;
    const foes = living(e).filter(f => {
      if(e.deadlineStruck?.has(f))return false;
      if (!f.stunned) return intentDamage(e,f)>0;
      delete f.stunned;
      const p=dragonPose(f);
      float('stunned',centreX(f),(p?p.y:W.groundY)-tallOf(f.id)*(p?p.scale:1)+120,'#ef9139');
      return false;
    });
    // Stun consumes exactly this enemy turn. Untouched foes still attack.
    if (!foes.length) return later(.5, () => returnToHand(e));
    foes.forEach((f, k) => later(0.55 * k, () => { if (S.enc !== e || S.dying) return; foeStrike(e, f, k === foes.length - 1); }));
  }
  function foeStrike(e, f, last, {deadline=false}={}) {
    if(S.enc!==e||S.dying||f.hp<=0)return;
    act(f, "attack", STRIKE.dur, lungeReach(f, S.party[0]), S.party[0]); A.play("swing_enemy");
    const atk=intentDamage(e,f);
    later(STRIKE.impact,()=>{
      if(S.enc!==e||S.dying)return;
      const protectedHit=!deadline&&(e.timingBlock||(e.answerTiming&&KM.Timing.pattern(f.id).forgiving));
      S.shake=.25;const guard=protectedHit?atk:Math.min(e.cardGuard||0,atk);
      if(!protectedHit)e.cardGuard=(e.cardGuard||0)-guard;
      const hit=PA.absorb(S.party,atk-guard);hit.blocked+=guard;
      A.play(hit.blocked?'hit_blocked':['boss','mega'].includes(e.st.type)?'hit_boss':'hit_party');
      partyAct('hurt',hit.hearts?.5:.2);
      if(hit.blocked)float('blocked!',slotX(0),W.groundY-tallOf('hero')+70,'#bcc0c3');
      if(hit.blocked&&!PA.armour(S.party))A.play('shield_break');
      if(hit.hearts){A.play(['boss','mega'].includes(e.st.type)?'heart_break':'heart_crack');hearts(-hit.hearts);e.lost=(e.lost||0)+hit.hearts;float(`−${BT.heartsText(hit.hearts)} ♥`,slotX(0),W.groundY-tallOf('hero')+(hit.blocked?130:70),'#b3321f');}
      renderHUD();save();
    });
    if (last) later(0.5, () => afterHits(f.id, () => returnToHand(e)));
  }
  // Only unhealed red-heart damage counts toward a casualty: two red hearts per party member; hero last.
  function afterHits(killer, then) {
    const e = S.enc; if (!e) return then();
    const casualties=PA.casualties(S.party,e.lost||0,S.hp),deaths=casualties.count;e.lost=casualties.lost;
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
    if (PA.villager(m) && artId(m) !== "hero") return null; // Never change the victim into a different outfit.
    const B = (KM_ART.brutal || {})[killer], ka = S.enc && S.enc.act;
    if (!B || !(KM_ART7 && KM_ART7.sequences[B.seq])) return null;
    if (B.at === "killer") { if (!ka || ka.id !== killer || ka.dead) return null; ka.act = null; ka.seqPlay = { id: B.seq, t: 0 }; m.eaten = true; A.play("bite"); later(KM.Assets.seqDur(B.seq) - 0.4, () => A.play("crunch")); }
    else m.dying.seq = B.seq;
    return KM.Assets.seqDur(B.seq);
  }
  function deathDur(m, killer) { if(inTomb())return KM.Tomb.beginFall(S,m); const id = artId(m), cfg = KM_ART.entities[id] || {}, seq = cfg.deathSeq || (!cfg.noFallbackDeath && (KM_ART.entities.hero || {}).deathSeq); return brutalDeath(m, killer) || (seq ? KM.Assets.seqDur(seq) : 1); }
  function memberDies(m, done, killer) {
    if(!m || m.id==="hero" || m.dying)return;
    A.play("member_death"); A.voice("vo_member_dies"); S.stats.lost = (S.stats.lost || 0) + 1;
    m.act = null; m.dying = { t: 0 };
    heroSay(pickOne([`${shortName(m.name)}! Oh no. Right. Onwards.`, `Not ${shortName(m.name)}! He owed me money.`, `${shortName(m.name)} has stopped being alive.`]));
    const dur = deathDur(m, killer);
    later(dur + 0.7, () => {
      const i = S.party.indexOf(m); if (i > 0) { buryCompanion(m,killer);S.party.splice(i, 1); if(S.enc){S.enc.fallen=S.enc.fallen||[];S.enc.fallen.push({...m});} }
      S.hp = Math.min(S.hp, maxHp()); save(); done();
    });
  }
  function defeatEnemy() {
    const e = S.enc, st = e.st, E = D.enemies[e.act.id] || {};
    if(e.won)return;e.won=true;
    if(CARDS&&CARDS.cleanRefill(S)&&!e.lost)S.party.forEach(m=>m.armor=Math.max(m.armor||0,m.armorTop||0)); // Shield Wall
    e.phase = "busy"; say(e.act, e.act.defeat || E.defeat); enemyDeath(e.act);

    // Wounds persist. Recovery comes from priests, food and choosing to camp.
    if (S.enc && S.enc.st.id === "frank") S.dragonSlain = true;
    later(0.9, finishEncounter);
  }
  function queueLoot(a) {
    const e=S.enc;if(!e || e.dismissal || !(e.foes||[e.act]).includes(a) || a.lootQueued)return;
    a.lootQueued=true;
    const eligible=(e.foes||[e.act]).filter(q=>D.enemies[q.id]?.dropsCoins!==false);
    const index=eligible.indexOf(a);if(index<0)return;
    const base=C.economy.purses[e.st.enemy]??Math.floor((e.st.gold||0)*C.economy.fallbackMultiplier);
    const total=Math.floor(base*(1+(GRP().goldPerExtra||0)*Math.max(0,eligible.length-1))*(e.stupidUsed?SPL.goldMul:1));
    const amount=Math.floor(total/eligible.length)+(index<total%eligible.length?1:0);
    if(amount<=0)return;
    const id=`${e.st.idx}:${a.extra||0}`;
    if(!S.loot.some(q=>q.id===id))S.loot.push({id,x:e.depth?e.st.stopX:a.x,amount});
  }
  function collectLoot() {
    const hero=S.party[0];if(S.mode!=='walk'||!hero||S.view?.to||S.dying)return;
    const reached=S.camX+hero.sx,found=S.loot.filter(q=>q.x<=reached);
    if(!found.length)return;
    const amount=found.reduce((n,q)=>n+q.amount,0);
    S.loot=S.loot.filter(q=>q.x>reached);S.gold+=amount;
    A.play('coin');float(`+${amount} ${amount===1?'copper':'coppers'}`,hero.sx,W.groundY-tallOf(artId(hero))*.55,'#cf8c4e');save();
  }
  function drawLoot() {
    const cfg=window.KM_ART11?.purse;if(!cfg)return;
    const im=KM.Assets.loadImg(KM_ART11.root+cfg.img);if(!im._ok)return;
    for(const q of S.loot){const x=screenX(q.x);if(x < -80 || x > VW+80)continue;
      const h=45,w=h*im.naturalWidth/im.naturalHeight;ctx.drawImage(im,x-w/2,W.groundY-h,w,h);
    }
  }
  function finishEncounter() { if (S.dying) return;
    if(S.enc?.dismissal)return finishDismissalBattle();
    if(S.enc && S.enc.depth) { const e=S.enc;if(e.depth.mode==='out')return;
      e.depth.mode='out';e.phase='leaveDragon';showPanel('','info');S.voices=[];S.party.forEach(m=>m.sp=null);
      inkTransition(()=>{delete e.depth;finishEncounter();});return;
    }
    meadEnds(); S.enc = null; S.dice = []; S.voices = []; S.stop++; save(); S.mode = "walk"; musicScene("walk"); renderWalk(); }

  // ---- generic maths question (combat actions, recruits, Frank)
  function ask(level, onRight, onWrong, back, secs, kind="recruit") {
    const e = S.enc; e.phase = "math"; e.input = ""; e.tmr = null; e.enterQueued = false;
    if(isFellowship() && S.spells>0 && !S.spellLeft && !meadNow()){S.spells--;S.spellLeft=SPL.problems;A.play(SPL.sfx.cast);renderHUD();}
    const mead = meadNow(), stupid = mead || S.spellLeft > 0; // Scroll: the next maths problem only. Mead: all sums in this battle.
    const grade=KM.Progression.level(level,e.st,S.stops),stage=KM.Progression.stage(e.st,S.stops);
    e.problem = level==='execution_easy'?KM.MathGen.multiply(false,stupid?[2,3]:[2,4]):level==='execution' ? KM.MathGen.multiply(stupid,stage===0?[2,5]:stage===1?[2,9]:[3,12]) : KM.MathGen.make(stupid ? SPL.level : grade);
    e.problem.stupid = stupid; e.problem.scrollAssisted = stupid && !mead; e.problem.level = stupid ? SPL.level : grade;
    if (stupid) e.stupidUsed = true;
    const after = f => () => { if (e.problem.stupid && !mead) spellTick(); f(); }; // mead sums never use up a scroll
    e.q = { onRight: after(onRight), onWrong: after(onWrong), back: back ? after(back) : null, level }; renderMath();
    startAnswerTimer(secs ?? Math.max(stupid?16:0,KM.Progression.seconds(e.problem)));
  }
  // ---- Scroll: one maths problem, consumed on answer or backing out. A full bar alone does not consume it.
  function castSpell() {
    if(S.enc?.deadlineBusy)return;
    if (S.spellLeft > 0) return heroSay(SPL.already);
    if (meadNow()) return heroSay(SPL.meadAlready); // v11b: the mead already makes every sum of this battle stupid; no scroll used
    if (S.spells <= 0) return heroSay(SPL.none);
    S.spells--; S.spellLeft = SPL.problems; A.play(SPL.sfx.cast);
    const l = pickOne(SPL.cast); heroSay(A.text(l)); A.voice(A.voOf(l));
    float("✶", slotX(0), W.groundY - tallOf("hero") + 70, "#c9a4ff");
    const e = S.enc;
    if (e && e.phase === "math" && e.q && !e.input && !e.problem.stupid) { // mid-sum: the current sum turns stupid too
      e.problem = e.q.level==='execution_easy'?KM.MathGen.multiply(false,[2,3]):e.q.level.startsWith('execution') ? KM.MathGen.multiply(true) : KM.MathGen.make(SPL.level); e.problem.stupid = true; e.problem.scrollAssisted = true; e.problem.level = SPL.level; e.stupidUsed = true; renderMath(); startAnswerTimer(Math.max(16,e.tmr ? e.tmr.secs : KM.Progression.seconds(e.problem))); // v12c: a new sum, a fresh timer
    }
    save(); renderHUD(); if(e?.phase==='choose')renderChoice();
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
    if (S.spellLeft <= 0) return; S.spellLeft = 0; save();
    if (!S.spellLeft) { const l = pickOne(SPL.wearOff); A.play(SPL.sfx.wearOff); later(0.9, () => { heroSay(A.text(l)); A.voice(A.voOf(l)); }); }
    renderHUD();
  }
  // v12r: every way a scroll lands in the pack plays the "into the pack" sound (after `delay` s, e.g. after the coins)
  function gainScroll(delay = 0) { S.spells++; if (delay > 0) later(delay, () => A.play(SPL.sfx.get)); else A.play(SPL.sfx.get); renderHUD(); }
  function buySpell() {
    const e = S.enc; if (!e || !SPL.sellAt.includes(e.st.rest) || S.gold < SPL.price || S.spells >= SPL.max) return;
    S.gold -= SPL.price; A.play(SPL.sfx.buy); gainScroll(SPL.sfx.getDelay); save(); keeperSay("One scroll of stupidity. Don't read it near a library."); renderRest();
  }
  const OPS = [["+", "+"], ["−", "−"], ["×", "×"], ["÷", "÷"], ["=", "="]];
  function renderMath() {
    const e = S.enc, used = e.problem.text + " =";
    const pad = L.touchPad ? `<div class="digits">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-key="${n}">${G(String(n))}</button>`).join("")}<button class="key wide" data-key="back">⌫</button><button class="key wide ok" data-key="enter">✓</button></div>
      <div class="ops">${OPS.map(([ch]) => `<span class="op ${used.includes(ch) ? "on" : ""}">${G(ch)}</span>`).join("")}</div>` : "";
    showPanel(`<div class="center mathp ${L.touchPad ? "touch" : ""}">
        ${isKnight()&&e.activeCard?'<small class="committed-card">'+T(e.activeCard.name)+'</small>':''}
        <div class="sum"><span class="problem">${G(used)}<span class="answer" id="answer">${G(e.input) || "&nbsp;"}</span></span></div>
        ${pad}
      </div>`, "math"); // v11: only the carved sum (no title, hint or key captions; Esc still goes back)
  }
  function typeKey(k) {
    const e = S.enc, striking = e && e.phase === "deadline" && e.deadlineFrom === "math"; // a deadline strike must not eat keystrokes
    if (!e || (e.phase !== "math" && !striking) || e.sub) return;
    A.play("key_tap");
    if (k === "back") e.input = e.input.slice(0, -1);
    else if (k === "enter") { if (striking) { e.enterQueued = true; return; } return submitAnswer(); }
    else if (/^\d$/.test(k) && e.input.length < 6) e.input += k;
    const el = $("answer"); if (el) el.innerHTML = G(e.input) || "&nbsp;";
  }
  function submitAnswer() {
    const e = S.enc; if (!e || e.phase !== 'math' || !e.q || !e.input) return;
    const q = e.q, right = parseInt(e.input, 10) === e.problem.answer;
    e.failedFraction=e.tmr?Math.min(1,e.tmr.t/e.tmr.secs):1;
    e.answerTiming = right ? KM.Timing.grade(e.tmr, q) : null;
    e.q = null; e.tmr = null; e.phase = "busy";
    if (right) { S.stats.correct++; awardScore(e.answerTiming, "math", e.problem.scrollAssisted); A.play("correct"); q.onRight(); }
    else { S.stats.wrong++; A.play("wrong"); q.onWrong(); }
  }
  // Points are awarded only by the guarded correct-answer entry points, once per solution.
  function awardScore(timing, kind, scrollAssisted = false) {
    const points = kind === 'riddle' ? (timing?.riddlePoints ?? 1) : (timing?.points ?? 1);
    S.score += points - (scrollAssisted ? SPL.scorePenalty : 0);
    KM.Score.record(S.scoreLedger, points, kind, scrollAssisted ? SPL.scorePenalty : 0);
    save();
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
    const e = S.enc, riddles=KM.I18n?.riddles()||D.riddles, pool = riddles.map((r, i) => i).filter(i => !S.usedRiddles.includes(i));
    const idx = pool.length ? pickOne(pool) : Math.floor(Math.random() * riddles.length);
    S.usedRiddles.push(idx); e.phase = "riddle"; e.riddle = riddles[idx]; e.q = null;
    // v11b (Magnus): the riddle sits in his frame in the strip; the riddler only gets a short taunt bubble
    { const rt = (D.enemies[e.act.id] || {}).riddleTaunt; say(e.act, Array.isArray(rt) ? pickOne(rt) : rt || "A riddle for you.", inPhase("riddle")); }
    if(KM.DarkWizard?.present(S.party).length)say(e.act,"You! And my EYE!",inPhase("riddle"));
    A.play("riddle"); renderRiddle();
  }
  // v18 (Magnus, riddles-v18): answers in his answer-frame (2 columns), keyed A B C (+ S Sacrifice in the 4th slot);
  // live text, no words in the art. 1-3 still work as silent aliases.
  const RKEYS = ["A", "B", "C", "D"];
  // v12r (Magnus): the answers wear Maggi's ornamented button frame like every other strip button (.plaque: hover,
  // disabled, centred label); laid out in one evenly spaced row under the question (style.css v12r riddle block).
  const ansBtn = (key, label, act, attrs, off) => `<button class="opt plaque ansf" data-act="${act}" ${attrs} ${off ? "disabled" : ""}><span class="nm">${label}</span></button>`;
  function renderRiddle() {
    const e = S.enc, r = e.riddle, wrong = e.wrong || []; e.phase = "riddle";
    if (!e.q) { e.q = { onWrong: () => riddleWrong(null) }; startAnswerTimer(C.timing.riddleSecs); }
    // v11b (Magnus): the riddle where the big numbers usually are, inside his riddle frame; the answers under it as the
    // battle's plaque buttons (seal key + answer, nothing else); a struck answer greys out like Heal
    showPanel(`<div class="center riddlep"><div class="riddleframe qf"><div class="rq">${esc(r.q)}</div></div>
      <div class="ansgrid">${r.choices.map((c, i) => ansBtn(RKEYS[i], esc(c), "answer", `data-i="${i}"`, wrong.includes(i))).join("")}${priests().length ? ansBtn("S", "Sacrifice", "sacrifice", "", false) : ""}</div></div>`, "riddle");
  }
  function answerRiddle(i) {
    const e = S.enc;
    if (!e || e.phase !== "riddle" || !e.q || e.done || e.sub || !Number.isInteger(i) || i < 0 || i >= e.riddle.choices.length || (e.wrong || []).includes(i)) return;
    const timing = KM.Timing.grade(e.tmr, e.q);
    e.q = null; e.tmr = null;
    if (i === e.riddle.answer) {
      return riddleSuccess(timing);
    }
    A.play("wrong"); S.stats.wrong++; riddleWrong(i);
  }
  function riddleSuccess(timing){
    const e=S.enc;
      if(KM.DarkWizard?.record(S,e.st.idx,!PREVIEW)){wizardReward();}
      e.done = true; S.stats.riddles++; awardScore(timing, "riddle"); A.play("correct");
      if (!e.tries) {
        const gold = (e.st.gold || 0) * (timing.coinBonus ? C.timing.riddleGoldMultiplier : 1);
        S.gold += gold; A.play("coin");
        float(`${timing.coinBonus ? 'crit ' : ''}+${gold} ${gold===1?'copper':'coppers'}`, screenX(e.act.x), W.groundY - tallOf(e.act.id) + 70, "#ef9139");
        say(e.act, "Right! Off you go then.");
      } else say(e.act, "Hmph. Right on the second go. No coppers for you.");
      e.act.state = "stay"; return finishEncounter();
  }
  function riddleWrong(i) {
    const e = S.enc; if (!e || e.done) return;
    e.q = null; e.tmr = null; e.sub = null;
    e.tries = (e.tries || 0) + 1;
    if (i !== null) e.wrong = (e.wrong || []).concat(i);
    huntersStep(1); if (S.dying) return;
    if(riddleRevenge(e))return;
    if (e.tries === 1) { say(e.act, i === null ? "Too slow! One more go." : "WRONG! One more go.", inPhase("riddle")); return renderRiddle(); }
    e.done = true; say(e.act, `It was "${e.riddle.choices[e.riddle.answer]}". Now limp off.`);
    e.act.state = "stay"; finishEncounter();
  }

  function wizardReward(){
    const st=S.stops.find(st=>st.idx>S.stop&&st.rest==='tavern'&&!S.tavernRecruits[st.idx]);
    if(st){st.cands[0]={...D.companions.darkWizard};st.candSkins[0]=1;}
    const road=S.stops.find(st=>st.idx>S.stop&&st.id==='wizard_road');
    if(!st&&road&&!S.party.some(m=>m.companionId==='darkWizard')){
      road.cands=[{...D.companions.darkWizard}];road.candSkins=[1];road.wizardRock=true;
      if(!S.actors.some(a=>a.stop===road.idx&&a.main))S.actors.push(mkActor({stop:road.idx,id:'dark_wizard',main:true,x:road.stopX,active:true,wizardRock:true,candIdx:0,name:D.companions.darkWizard.name}));
    }
    S.toast={text:'Dark Wizard unlocked — find him at a tavern.',t:0,dur:4};save();
  }
  function riddleRevenge(e){
    const wizard=KM.DarkWizard?.present(S.party)[0];if(!wizard)return false;
    e.done=true;e.phase='busy';e.act.sp=null;act(wizard,'hurt',.5);A.play('hit_party');
    wizard.riddleWounds=(wizard.riddleWounds||0)+1;hearts(-1);float('−1 ♥',partyPose(wizard).x,W.groundY-tallOf(artId(wizard))+60,'#b3321f');
    const leave=()=>{if(S.hp<=0)return heroDies('bridgekeeper');e.act.state='vanish';e.act.t=0;save();later(.7,()=>{if(S.enc===e)finishEncounter();});};
    if(wizard.riddleWounds>=PA.life(wizard))memberDies(wizard,leave,'bridgekeeper');else leave();return true;
  }
  // ---- recruiting: by maths; a failed sum (hunters +1) offers a D20 contest
  function renderRecruit() {
    const e = S.enc, k = e.st.cands[0]; e.phase = "recruit";
    if (!k) return finishEncounter();
    say(e.act, k.challenge || k.join + " Prove you can count. Then I'm yours.", inPhase("recruit"));
    showPanel(actionRow([recruitCard(k,0,'recruitSum'),walkCard('noRecruit')]),'info action-panel');
  }
  // who speaks for candidate j: its actor on the road, else the candidate itself (drawn in the camp / tavern view)
  const candSpeaker = (st, j) => S.actors.find(x => x.stop === S.stop && x.candIdx === j && !x.dead) || st.cands[j];
  const isTavern = st => st && st.type === 'rest' && RS.types[st.rest]?.view === 'tavern';
  const limitedRecruit = st => isTavern(st) || st?.rest==='campsite';
  const tavernRecruit = st => limitedRecruit(st) && S.tavernRecruits[st.idx];
  const canRecruit = st => !S.pendingDismissal && !tavernRecruit(st) && !(st?.rest==='campsite' && S.restUses[st.idx]?.recruitLeft);
  // shared recruit flow (roadside ditch, tavern table, camp wanderer, shop sellsword). done(joined, cancelled)
  function recruitFlow(st, j, done) {
    const p = st.cands[j]; if (!p || !canRecruit(st)) return;
    ask(C.recruitLevel,
      () => completeRecruit(st,j,done,p.join),
      () => {
        huntersStep(1); if (S.dying) return;
        if (st.rest === 'campsite') { campRecruitLeaves(st, j); done(false); return; }
        if (isTavern(st)) { tavernRecruitLeaves(st,j);done(false);return; }
        if(isFellowship()){say(candSpeaker(st,j),`It's ${S.enc.problem.answer}. Maybe another time.`);campRecruitLeaves(st,j);done(false);return;}
        say(candSpeaker(st, j), `It's ${S.enc.problem.answer}! Can't count? Roll me for it, then.`, inPhase("contestOffer"));
        S.enc.phase = "contestOffer"; S.enc.contest = { st, j, done };
        contestPanel();
      }, () => done(false, true));
  }
  function campRecruitLeaves(st, j) {
    const p = st.cands[j], a = candSpeaker(st, j);
    if (!p) return;
    (S.restUses[st.idx] ||= {}).recruitLeft = true;
    if (a && S.actors.includes(a)) {
      a.departure = { t: 0, member: { art: p.art || a.id, skin: st.candSkins[j] } };
      a.state = "campLeave"; a.active = true; a.sp = null;
    }
    st.cands[j] = null;
    S.enc.contest = null;
    save();
  }
  function tavernRecruitLeaves(st,j) {
    const e=S.enc,p=st.cands[j];if(!p||!e)return;
    const seat=KM.TavernPOV.seats?.(st.cands).find(q=>q.j===j);
    (e.tavernDepartures||=[]).push({p,j,r:seat?.r,id:candArt(j,st),at:S.t});
    p.sp=null;S.party.forEach(m=>m.sp=null);
    const used=S.restUses[st.idx]||={};used.departedSeats||=[];
    if(!used.departedSeats.includes(j))used.departedSeats.push(j);
    st.cands[j]=null;e.contest=null;if(e.tv)e.tv.sel=-1;save();
  }
  // Rear-facing steps recede into the world, then hold as a distant figure until we leave.
  function campDeparturePose(a) {
    const u = Math.min(1, a.departure.t / 4.5), h = u * u * (3 - 2 * u);
    return { x: screenX(a.x) + 180 * h, y: W.groundY - 240 * h, scale: 1 - .84 * h };
  }
  function drawCampDeparture(a) {
    const pose = campDeparturePose(a), clock = a.departure.t < 4.5 ? a.departure.t : 0;
    KM.DragonApproach.drawRear(ctx, { walkT: clock }, a.departure.member, 0, pose, tallOf(a.id));
  }
  function contest() {
    const e = S.enc, c = e.contest; if (!c || e.phase !== "contestOffer" || !c.st.cands[c.j] || !canRecruit(c.st)) return;
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
      S.dice=[];e.contest=null;
      if(win)return completeRecruit(c.st,c.j,c.done,`${mine} beats ${theirs}. Fine, I'll come.`);
      speak(sp,"I'm staying put.");later(1.2,()=>c.done(false));
    };
  }
  function recruitCand(st, j) {
    const p = st.cands[j]; if (!p || partyFull() || !canRecruit(st) || (p.companionId && S.party.some(m => m.companionId === p.companionId))) return false;
    const a = S.actors.find(x => x.stop === S.stop && x.candIdx === j);
    S.party.push(followerFrom(p, a && !S.view ? screenX(a.x) : slotX(S.party.length), st.candSkins && st.candSkins[j]));
    if (limitedRecruit(st)) { S.tavernRecruits[st.idx] = p.name; if (S.enc?.tv) S.enc.tv.sel = -1; }
    const used=S.restUses[st.idx]||={};used.recruitedSeats||=[];if(!used.recruitedSeats.includes(j))used.recruitedSeats.push(j);
    if (a) a.dead = true; st.cands[j] = null; A.play("recruit"); hearts(PA.life(S.party[S.party.length-1])); // each member brings their role's hearts
    float(`${shortName(p.name)} joins!`, slotX(S.party.length - 1), W.groundY - tallOf("hero") + 70, "#d8f3ff");
    return S.party[S.party.length - 1];
  }

  // A full party may recruit, but nobody leaves until the challenge is won and a replacement chosen.
  function completeRecruit(st,j,done,line){
    const e=S.enc,p=st.cands[j];if(!e||!p||!canRecruit(st))return;
    if(!partyFull()){const m=recruitCand(st,j);if(m)speak(m,line);done(!!m);return;}
    if(p.companionId&&S.party.some(m=>m.companionId===p.companionId)){done(false,true);return;}
    e.q=null;e.tmr=null;e.phase='replace';e.replacement={st,j,done,line};hush();
    const cards=S.party.filter(m=>m.id!=='hero').map(m=>actionCard({label:shortName(memberName(m)),act:'replaceMember',attrs:`data-id="${esc(m.id)}"`,icon:roleIcon(PA.role(m)),meta:'Dismiss companion',detail:`${T('Weapon')} +${m.weapon||0} · ${T('Armour')} ${m.armor||0}`}));
    cards.push(actionCard({label:'Keep my party',act:'keepParty',icon:'↩',meta:'Cancel replacement'}));
    showPanel(`<div class="replacement-title"><strong>${esc(T(p.name))} · ${T('Who will make room?')}</strong><small>${T('Their gear leaves with them. One in three dismissals starts a fight.')}</small></div>`+actionRow(cards),'info action-panel replacement-panel');
  }
  function roleIcon(role){return role==='priest'?MICON.heal:role==='darkWizard'?MICON.spell:role==='firestarter'?MICON.fire:MICON.weak;}
  function keepParty(){const e=S.enc,r=e?.replacement;if(e?.phase!=='replace'||!r)return;delete e.replacement;r.done(false,true);}
  function replaceMember(id){
    const e=S.enc,r=e?.replacement,i=S.party.findIndex(m=>m.id===id);
    if(e?.phase!=='replace'||!r||i<=0||!partyFull()||!canRecruit(r.st)||!r.st.cands[r.j])return;
    const old=S.party[i],beforeHp=S.hp,departed=KM.Recruitment.snapshot(old,artId(old));
    e.phase='busy';delete e.replacement;
    S.party.splice(i,1);const m=recruitCand(r.st,r.j);
    if(!m){S.party.splice(i,0,old);S.hp=beforeHp;r.done(false,true);return;}
    // Keep the slot and shared wounds: swapping is not a free heal or a way to duplicate gear.
    S.party.pop();S.party.splice(i,0,m);S.hp=beforeHp;S.party.forEach((q,k)=>q.sx=slotX(k));
    const angry=KM.Recruitment.hostile(S.runId,S.chapter,r.st.idx,departed);
    if(angry){
      S.pendingDismissal={stop:S.stop,member:departed};save();
      hush();heroSay('This has become awkward.');
      showPanel(`<div class="center"><h2>${esc(T(departed.name))}</h2><p>${T('You are replacing ME? Outside. Now.')}</p></div>`,'info');
      later(1.2,()=>{if(S.enc!==e)return;if(S.view)inkTransition(beginDismissalBattle);else beginDismissalBattle();});
    }else{
      const a=mkActor({id:departed.art,name:departed.name,x:S.camX+old.sx,stop:S.stop,departure:{t:0,member:departed},state:'campLeave'});S.actors.push(a);
      speak(m,r.line);save();r.done(true);heroSay('Off you go, then. Mind the squirrels.');
    }
    renderHUD();
  }
  function beginDismissalBattle(){
    const p=S.pendingDismissal,st=S.stops[S.stop];if(!p||p.stop!==S.stop||!st)return;
    hush();S.view=null;S.entering=null;S.dice=[];S.voices=[];S.mode='encounter';
    let a=S.actors.find(a=>a.dismissed&&a.stop===S.stop);
    if(!a){const m=p.member,x=rowSlots(st,[m.art])[0];a=mkActor({id:m.art,name:m.name,label:shortName(m.name),x,homeX:x,stop:S.stop,foe:true,dismissed:true,combat:KM.Recruitment.combat(m),taunt:'You are replacing ME? Outside. Now.',defeat:'Fine. I shall find a better party.'});S.actors.push(a);}
    const battle={...st,id:'dismissal-'+st.idx,type:'math',enemy:a.id,gold:0,group:null};
    S.enc={st:battle,act:a,type:'math',phase:'approach',dismissal:true,msg:'',bonus:0,lost:Math.max(0,maxHp()-S.hp)};
    commit();
  }
  function finishDismissalBattle(){
    const e=S.enc;if(!e?.dismissal)return;
    meadEnds();hush();S.pendingDismissal=null;S.enc=null;S.dice=[];S.voices=[];save();
    const st=S.stops[S.stop];
    if(st?.type==='rest'){const a=S.actors.find(a=>a.stop===S.stop&&a.main);engage(st,a);}
    else finishEncounter();
  }

  // ---- Frank the priest: agree = fight the turd dragon; disagree = restraint maths
  function startFrank() {
    const e = S.enc, frank = frankMember(); if (!e) return;
    if (!frank) { finishEncounter(); return; }
    e.phase = "frank"; e.frank = frank; e.act = S.actors.find(a => a.stop === S.stop && a.foe) || e.act;
    say(e.frank, D.enemies.frank.taunt, inPhase("frank")); musicScene("riddle");
    showPanel(`<div class="center"><div class="opts big3">${big("1", "Fight it (risky)", "frankAgree")}${big("2", "Talk him down (safe)", "frankNo")}</div></div>`, "info");
  }
  function frankNo() {
    const e = S.enc; if (!e || e.phase !== "frank") return;
    ask("normal",
      () => { heroSay("No, Frank. No turd dragons today."); e.act.state = "stay"; later(0.4, finishEncounter); },
      () => { // PROVISIONAL: Frank runs at it and the party has to follow (forced fight)
        huntersStep(1); if (S.dying) return;
        say(e.frank, "Nonsense! FOR SCIENCE!"); e.phase = "frank"; later(0.8, commit);
      }, () => startFrank(), undefined, "restraint");
  }

  // Move along a depth path without advancing road distance or revealing strength early.
  function beginDragonApproach() {
    const e = S.enc; if (!e || e.depth || e.phase !== "frank") return;
    e.phase = "enterDragon"; e.depth = { p: 0, mode: "in", scene:"road" }; e.frank.sp = null;
    showPanel("", "info"); KM.DragonApproach.preload();
  }
  function inkTransition(onCovered){S.ink={mode:'cover',t:0,onCovered};}
  function updateDragonApproach(dt) {
    if(S.ink){const ink=S.ink;ink.t+=dt;
      if(ink.mode==='cover' && ink.t>=.48){ink.t=0;ink.mode='reveal';const cb=ink.onCovered;delete ink.onCovered;cb();}
      else if(ink.mode==='reveal' && ink.t>=.7)S.ink=null;
    }
    const e=S.enc,d=e&&e.depth;if(!d || d.mode!=='in')return;
    const before=d.p;d.p=Math.min(1,d.p+dt/5.8);
    if(Math.floor(before*22)!==Math.floor(d.p*22))A.play('step');
    if(d.p===1){d.mode='cover';inkTransition(()=>{d.scene='arena';d.mode='battle';e.phase='frank';commit();});}
  }

  // ---- sacrifice (menu captures digit keys while open). Casualties are removed exactly once.
  function renderSacrifice() {
    const e = S.enc; if (!e || !["choose", "riddle"].includes(e.phase) || !priests().length) return;
    e.prevPhase = e.phase; e.sub = "sacrifice";
    heroSay("A priest will take one for the team.", () => !!(S.enc && S.enc.sub === "sacrifice"));
    if(e.prevPhase==='choose')return showPanel(actionRow([...priests().map(m=>actionCard({label:shortName(m.name),act:'doSacrifice',icon:MICON.sacrifice,meta:'Sacrifice',note:'This companion dies',attrs:`data-id="${m.id}"`})),actionCard({label:'Cancel',act:'cancelSacrifice',icon:'←'})]),'info action-panel');
    showPanel(`<div class="center"><div class="opts big3">${priests().map((m, i) => `<button class="opt plaque" data-act="doSacrifice" data-id="${m.id}">${BANNER}<span class="nm">${esc(shortName(m.name))}</span></button>`).join("")}${big("Esc", "Cancel", "cancelSacrifice")}</div></div>`, "riddle");
  }
  function cancelSacrifice() { const e = S.enc; e.sub = null; e.prevPhase === "riddle" ? renderRiddle() : renderChoice(); }
  function doSacrifice(id) {
    const e = S.enc, i = S.party.findIndex(m => m.id === id); if (!e || i <= 0 || e.sub !== "sacrifice" || !priests().includes(S.party[i])) return; e.sub = null;
    const m = S.party.splice(i, 1)[0]; S.stats.sacrificed++; buryCompanion(m,e.act?.id); A.play("sacrifice");
    if(inTomb())KM.Tomb.beginFall(S,m);
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
  const restT = () => KM.Progression.shop(RS.types[S.enc.st.rest],S.enc.st.shopTier);
  // the keeper's voice: the shop keeper stands on the road; the tavern bartender / Old Wally have no art yet (MISSING_ART
  // #20 / #22): their bubbles point at the bar / the fire in the painted scene
  function keeperSay(text) {
    const T = restT(), v = S.view && S.view.id;
    if(v === "tavern-interior")return heroSay(text);
    if (v === "camp") {
      const m = KM.RestView.mapper(v), sc = KM.RestView.scene(v);
      if (sc.full && v === "tavern-interior") return voice("keeper", text, D.tavernRoom.keeperAt[0], D.tavernRoom.keeperAt[1]); // v12o: behind the bar (layout units)
      const at = v === "camp" ? [sc.canvas[0] * 0.5, sc.canvas[1] * 0.62] : (sc.barStaffAnchor || [1200, 550]);
      return voice("keeper", text, m.x0 + at[0] * m.s, m.y0 + at[1] * m.s);
    }
    const keeper = S.actors.find(a => a.stop === S.stop && a.keeper);
    keeper ? say(keeper, text) : heroSay(text);
  }
  function startRest() {
    const e = S.enc, T = restT(); e.used = S.restUses[e.st.idx] || (S.restUses[e.st.idx]={}); A.play("rest_" + e.st.rest); setCheckpoint();
    if (ART7 && T.view === "camp") { S.view = null; keeperSay(T.greet); return renderRest(); }
    if (ART7 && T.view === "tavern") { S.view = null; return renderTavernOut(); } // v11b: Magnus's full-screen exterior
    keeperSay(T.greet); renderRest();
  }
  function renderTavernOut() {
    S.enc.phase = "tavernOut";
    showPanel(`<div class="center"><div class="opts big3 moves${S.view && S.view.id === "tavern-arrival" && S.view.a < 1 ? " arrive" : ""}">${big("I", "Go in", "goInside")}${big("Enter", "Walk on", "leaveRest")}</div></div>`, "info");
  }
  let roomChanging = false;
  async function changeRoom(change) {
    if (roomChanging) return;
    roomChanging = true; S.voices = []; S.enc.phase = "busy";
    const veil = document.createElement("div"); veil.className = "room-veil";
    document.getElementById("stage").appendChild(veil);
    const block = ev => { ev.preventDefault(); ev.stopImmediatePropagation(); };
    window.addEventListener("keydown", block, true);
    const ms = matchMedia("(prefers-reduced-motion: reduce)").matches ? 100 : 320;
    try {
      await veil.animate([{opacity:0},{opacity:1}],{duration:ms,fill:"forwards"}).finished;
      change();
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await veil.animate([{opacity:1},{opacity:0}],{duration:ms,fill:"forwards"}).finished;
    } finally { veil.remove(); window.removeEventListener("keydown",block,true); roomChanging=false; }
  }
  function goInside() {
    const e = S.enc; if (!e || e.phase !== "tavernOut" || roomChanging) return;
    A.play("door");
    changeRoom(() => { S.entering = null; S.view = { id:"tavern-interior", a:1, to:1 };
      e.tv = {sel:-1,open:null}; keeperSay(restT().greet); renderRest(); });
  }
  function leaveInside() {
    if (S.view && S.view.id === "tavern-interior" && !roomChanging) {
      A.play("door"); changeRoom(() => { S.view=null; renderTavernOut(); });
    }
  }
  function shopItem(label,icon,price,act,attrs='',off=false,detail=''){
    return actionCard({label,icon,price,act,attrs,off,meta:'For sale',detail});
  }
  function renderRest(){
    if(S.view && S.view.id==='tavern-interior')return renderTavernInside();
    const e=S.enc,st=e.st,stop=restT(),g=stop.gear;e.phase='rest';
    if(CARDS&&isFellowship()&&!e.used.card&&!e.cardOptions){e.cardOptions=CARDS.offer(S).map(c=>c.id);e.cardPick=e.cardOptions.length>0;} // the pick opens on arrival
    if(stop.view==='camp'){
      const cards=[actionCard({label:e.used.H?'Rested':'Make camp',act:'restHeal',icon:MICON.heal,meta:'Rest',detail:T('Full health'),note:'Once per camp',attrs:'data-k="H"',off:!!e.used.H})];
      st.cands.forEach((p,j)=>{if(p)cards.push(recruitCard(p,j,'restRecruit',!canRecruit(st)));});
      if(e.cardPick)return showPanel(cardDialog(e),'rest action-panel');
      cardOffer(e,cards);cards.push(walkCard());return showPanel(actionRow(cards),'rest action-panel');
    }
    const cards=[];
    stop.heals.forEach(h=>cards.push(shopItem(h.short||h.label,MICON.heal,h.cost,'restHeal',`data-k="${h.key}"`,S.gold<h.cost||(!h.full&&S.hp>=maxHp())||(h.once&&e.used[h.key]),h.full?T('Full health'):`+${h.hearts} ♥`)));
    if(SPL.sellAt.includes(st.rest))cards.push(shopItem('Stupidity scroll',spellIcon('shop'),SPL.price,'buySpell','',S.gold<SPL.price||S.spells>=SPL.max,T(isFellowship()?'Automatic next sum · −2 score':'Easier next sum')));
    if(g&&g.maxWeapon)cards.push(shopItem('Sword +1','<img src="assets/ui/shop/sword-cutout.png" alt="">',g.weaponCost,'chooseGear','data-kind="weapon"',S.gold<g.weaponCost||S.party.every(m=>m.weapon>=PA.gearCap("weapon",g.maxWeapon)),T('Upgrade one ally')));
    if(g&&g.maxArmor)cards.push(shopItem('Armour +1','<img src="assets/ui/shop/armour-cutout.png" alt="">',g.armorCost,'chooseGear','data-kind="armor"',S.gold<g.armorCost||S.party.every(m=>m.armor>=PA.gearCap("armor",g.maxArmor)),T('+1 silver heart')));
    st.cands.forEach((p,j)=>{if(p)cards.push(recruitCard(p,j,'restRecruit',!canRecruit(st)));});cardOffer(e,cards);cards.push(walkCard());
    if(e.cardPick)return showPanel(cardDialog(e),'rest action-panel');
    showPanel(e.gearChoice?gearDialog(e.gearChoice):actionRow(cards),'rest action-panel');
    if(e.gearChoice)panel.querySelector('[role="dialog"] button:not([disabled])')?.focus();
  }
  // Upgrade cards (switch): one pick per rest stop, from cards the party can use
  function cardOffer(e,cards){
    if(!CARDS||!isFellowship()||e.used.card)return;
    if(!e.cardOptions)e.cardOptions=CARDS.offer(S).map(c=>c.id);
    if(e.cardOptions.length)cards.push(actionCard({label:'Upgrade card',act:'openCards',icon:'<img src="assets/ui/cards/cleave.png" alt="" style="height:64px">',meta:'Pick one',detail:T('Free')}));
  }
  function cardDialog(e){
    const opts=e.cardOptions.map(id=>CARDS.byId(id)).map(c=>`<button class="upgrade-card" data-act="takeCard" data-id="${c.id}" aria-label="${c.name}" style="background:none;border:0;padding:0 10px;cursor:pointer">${c.img?`<img src="${c.img}" alt="${c.name}" style="height:min(560px,62vh);display:block">`:plainCard(c)}</button>`).join('');
    return `<div role="dialog" aria-label="Pick an upgrade card" style="position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(36,28,18,.45)">${opts}${actionCard({label:'Not now',act:'closeCards',icon:'←',meta:'Back'})}</div>`;
  }
  function plainCard(c){ // a card with no painting yet: parchment, name, effect, cost
    return `<div style="height:min(560px,62vh);aspect-ratio:2/3;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;padding:6% 8%;background:#ecdcc4;border:6px double #292018;color:#292018;font-family:Georgia,serif;text-align:center"><strong style="font-size:30px">${c.name}</strong><span style="font-size:15px">${String(c.owner||'').replace('darkWizard','Dark Wizard').toUpperCase()}</span><span style="font-size:22px;line-height:1.3">${c.text||''}</span><span style="font-size:20px;line-height:1.3;background:#292018;color:#ecdcc4;padding:14px">${c.costText||''}</span></div>`;
  }
  function takeCard(id){const e=S.enc;if(!e||!CARDS||e.used.card||!e.cardOptions?.includes(id))return;S.cards=(S.cards||[]).concat(id);e.used.card=true;e.cardPick=false;A.play('buy_gear');save();renderRest();}
  function gearDialog(kind){
    const g=restT().gear,key=kind==='weapon'?'maxWeapon':'maxArmor',cost=kind==='weapon'?g.weaponCost:g.armorCost;
    const icon=`<img src="assets/ui/shop/${kind==='weapon'?'sword':'armour'}-cutout.png" alt="">`;
    const cards=S.party.map((m,i)=>actionCard({label:shortName(memberName(m)),act:'assignGear',icon,meta:'Give to',price:cost,detail:m[kind]>=PA.gearCap(kind,g[key])?`${m[kind]} / ${PA.gearCap(kind,g[key])}`:isFellowship()&&kind==='weapon'?`${KM.Fellowship.damage(m)} → ${KM.Fellowship.damage({...m,weapon:(m.weapon||0)+1})} ${T('damage')}`:`${m[kind]} → ${m[kind]+1}`,attrs:`data-i="${i}"`,off:m[kind]>=PA.gearCap(kind,g[key])||S.gold<cost,note:m[kind]>=PA.gearCap(kind,g[key])?'Max':''}));
    cards.push(actionCard({label:'Cancel',act:'cancelGear',icon:'←',meta:'Back'}));
    return `<div class="gear-shade"><div class="gear-dialog action-gear" role="dialog" aria-modal="true" aria-labelledby="gear-title"><div id="gear-title">${T(kind==='weapon'?'Who gets the sword?':'Who gets the armour?')}</div><div class="action-row">${cards.join('')}</div></div></div>`;
  }
  function chooseGear(kind){if(!S.enc||S.enc.phase!=='rest'||!['weapon','armor'].includes(kind))return;const g=restT().gear;if(!g||!(kind==='weapon'?g.maxWeapon:g.maxArmor))return;S.enc.gearChoice=kind;renderRest();}
  function cancelGear(){if(S.enc)S.enc.gearChoice=null;renderRest();}
  function assignGear(i){const kind=S.enc&&S.enc.gearChoice;if(kind)restBuy(kind,i);}
  function restHeal(key) {
    const e = S.enc, T = restT(), h = T.heals.find(x => x.key === key);
    if (h && T.limits && fareLeft("stew") <= 0) return keeperSay(T.limits.lot);
    if (!h || S.gold < h.cost || (!h.full && S.hp >= maxHp()) || (h.once && e.used[key])) return;
    const gained=h.full?maxHp()-S.hp:Math.min(h.hearts*BT.unit(),maxHp()-S.hp);
    S.gold -= h.cost; hearts(gained); if(h.full&&BT.on('campArmour'))S.party.forEach(m=>m.armor=Math.max(m.armor||0,m.armorTop||0)); e.used[key] = true; if (T.limits) fareUse("stew"); A.play(h.full?"heart_mend":"heal"); save();
    if (T.limits && fareLeft("stew") <= 0) later(1.2, () => keeperSay(T.limits.lot));
    float(`+${gained} ♥`, slotX(0), W.groundY - tallOf("hero") + 70, "#9be28a"); renderRest();
  }
  // v11b tavern recruit talk: hero "Join my party?" -> NPC challenge bubble -> the carved sum (like a battle sum) ->
  // Solved: joins. Failed/timeout: stands up and leaves this tavern; no dice retry.
  function tvJoin(j) {
    const e = S.enc, st = e.st, p = st.cands[j], RT = D.recruitTalk; if (!p || !canRecruit(st) || e.phase !== "rest") return;
    const skin = SKIN_OF[candArt(j)], sp = candSpeaker(st, j);
    e.phase = "talk"; showPanel(`<div class="center tavernp"></div>`, "rest");
    heroSay(RT.ask);
    later(1.3, () => { if(S.enc!==e)return;S.party[0].sp=null;say(sp, pickOne(RT.challenge[skin] || RT.challenge.scarf), inPhase("math"));
      later(0.9, () => { if(S.enc!==e)return;e.phase = "rest"; recruitFlowTalk(st, j); }); });
  }
  function recruitFlowTalk(st, j) {
    if (!st.cands[j] || !canRecruit(st)) return;
    const p = st.cands[j], RT = D.recruitTalk, sp = candSpeaker(st, j), back = () => { save(); renderRest(); };
    ask(C.recruitLevel,
      () => completeRecruit(st,j,back,pickOne(RT.yes)),
      () => { huntersStep(1); if (S.dying) return;
        tavernRecruitLeaves(st,j);back(); },
      back);
  }
  const contestPanel = () => showPanel(`<div class="center"><div class="opts big3 turn moves">${move("D", "Roll for it", "contest", "roll")}${move("N", "No", "noContest", "")}</div></div>`, "info");
  function restRecruit(j) {
    const e = S.enc, p = e.st.cands[j]; if (!p || !canRecruit(e.st)) return;
    recruitFlow(e.st, j, () => { save(); renderRest(); });
  }
  function restBuy(kind, i) {
    const g = restT().gear, m = S.party[i]; if (!m || !g) return;
    if (kind === "weapon" && m.weapon < PA.gearCap("weapon",g.maxWeapon) && S.gold >= g.weaponCost) { S.gold -= g.weaponCost; m.weapon++; }
    else if (kind === "armor" && m.armor < PA.gearCap("armor",g.maxArmor) && S.gold >= g.armorCost) { S.gold -= g.armorCost; m.armor=Math.min(PA.gearCap("armor",g.maxArmor),m.armor+1);m.armorTop=Math.max(m.armorTop||0,m.armor);
      if(PA.villager(m))m.armorTrained=true; // outfit progression only
    }
    else return;
    S.enc.gearChoice=null; A.play("buy_gear"); save();
    if(isFellowship()&&kind==="weapon")keeperSay(`${shortName(memberName(m))} · ${KM.Fellowship.damage(m)} ${T('damage')}`);
    if(isKnight()&&kind==="weapon"){const c=KM.Knight.library(S.party).find(c=>c.id===m.id+":0");keeperSay(T(c.name)+" · "+c.damage+" "+T("damage"));}
    else keeperSay(`${memberName(m)}! Marginally less scruffy.`); renderRest();
  }
  function talkPoint(which) {
    const T = restT();
    if (which === "bar") return keeperSay(T.greet);
    const j = S.enc.st.cands.findIndex(Boolean); j >= 0 ? speak(candSpeaker(S.enc.st, j), S.enc.st.cands[j].join) : heroSay("The table is empty. Someone left half a pie.");
  }
  function leaveRest() {
    if (roomChanging || S.enc?.gearChoice) return;
    if (S.view && S.view.id === "tavern-interior") return leaveInside();
    A.play("footstep"); if (S.view) S.view.to=0; finishEncounter();
  }

  // ---------- death / game over / win ----------
  // hero death: the approved drawn knight death plays once (per-frame holds, last frame held), then the strip game-over
  function heroDies(killer) {
    if (S.mode === "dying" || S.mode === "gameover") return;
    const st = S.stops[S.stop];
    S.dying = { t: 0, killer, st };
    const hero = S.party[0]; if (hero) { hero.act = null; hero.dying = { t: 0 }; }
    const dur = hero ? deathDur(hero, killer) : 0; // v19: brutal death by the killer (eaten / torn / arrows) or the approved knight death
    S.deathDepth = S.enc && S.enc.depth ? Object.assign({}, S.enc.depth, { mode: "battle" }) : null;
    S.mode = "dying"; S.enc = null; S.dice = []; S.diceDone = null; A.play("death"); musicScene("gameover");
    showPanel(`<div class="center"></div>`, "info"); // the drawn death says it
    later(Math.max(1.2, dur + 0.9), () => gameOver(killer, st));
  }
  function gameOver(killer, st) {
    if(tombTest())return tombEnd(false);
    if(sketch)return sketchPage("sketchLoss");
    S.mode = "gameover"; S.enc = null; A.play("gameover"); musicScene("gameover");
    if(!PREVIEW && S.routeVersion) KM.Save.clear();
    if (!PREVIEW && !S.routeVersion && S.checkpoint) KM.Save.write(Object.assign({}, S.checkpoint, { checkpoint: S.checkpoint }));
    const isBest = !PREVIEW && KM.Save.recordBest(+leagues(), S.name);
    killer = killer || "unknown";
    S.party.filter(m=>m.id!=="hero").forEach(m=>buryCompanion(m,killer)); // hunters / party wipe also leave companion crosses
    if (!PREVIEW) KM.Save.addDeath({ chapter:S.chapter,deathId: S.runId + "-" + Date.now(), runId: S.runId, route: "road-v7",
      progress: st && st.src != null ? { encounter: st.src, offset: Math.round(S.camX - haltCam(st)) } : null,
      killer, marker: markerOf({ killer }), name: S.name, x: Math.round(S.camX), leagues: +leagues(), at: Date.now() }); // a grave in later runs
    const line = pickOne(D.dialogue.gameOver); endNarrator(`Killed by ${GR.killedBy[killer] || killer}. ${A.text(line)}`); paceVO(A.voOf(line), narrator);
    showPanel(`<div class="center endp"><h1>Game over</h1><div class="endrow">${scoreHTML()}${journeyHTML(isBest)}<button class="opt plaque scores-link" data-act="leaderboard">Leaderboard</button>
      <div class="opts big3">${S.routeVersion?big("Enter", "New run", "retry"):big("Enter", "Retry", "retry")+big("N", "New game", "newGame")}</div></div></div>`, "end");
    showRunScore();
  }
  function showWin(finalize=false) {
    if(tombTest())return tombEnd(true);
    const next=!finalize && !sketch && S.routeVersion && PREVIEW!=="score-win" && D.chapters.next[S.chapter];
    if(next)return chapterGate(next);
    if(sketch)return sketchPage("sketchWin");
    S.mode = "win"; A.play("victory"); musicScene("win"); if (!PREVIEW) KM.Save.clear();
    const isBest = !PREVIEW && KM.Save.recordBest(+leagues(), S.name);
    endNarrator(A.text(D.dialogue.victory)); paceVO(A.voOf(D.dialogue.victory), narrator);
    showPanel(`<div class="center endp"><h1>Victory!</h1><div class="endrow">${scoreHTML()}${journeyHTML(isBest)}<button class="opt plaque scores-link" data-act="leaderboard">Leaderboard</button>
      <div class="opts big3">${big("Enter", "Play again", "newGame")}</div></div></div>`, "end");
    showRunScore();
  }
  function startTomb(){
    if(!KM.Tomb?.requested())return;
    hush();KM.FireFx.stop();S.chapter='tomb';S.mode='walk';S.runId='tomb-test-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);S.name='Magnus';S.stop=0;S.camX=0;S.dist=0;S.winT=0;S.fid=0;
    S.enc=null;S.dying=null;S.deathDepth=null;S.ink=null;S.lightning=null;S.view=null;S.intro=null;S.entering=null;S.respect=null;
    S.timers=[];S.floats=[];S.dice=[];S.voices=[];S.loot=[];S.tavernRecruits={};S.restUses={};S.usedRiddles=[];
    S.hunters=0;S.gold=5;S.score=0;S.scoreLedger=KM.Score.empty();S.stats={correct:0,wrong:0,riddles:0,sacrificed:0};
    S.pendingDismissal=null;S.speedMul=1;S.furtherDone=true;S.stepT=0;S.stepFr={};S.stepFrame=null;S.compStepT=0;
    S.spells=0;S.spellLeft=0;S.mead=0;S.routeVersion=3;S.bestAtStart=0;S.toast=null;S.shake=0;S.walkT=0;
    S.party=[newMember('hero',600)];
    for(const id of ['frank','darkWizard','timmy'])S.party.push(followerFrom(D.companions[id],slotX(S.party.length)));
    S.party[0].weapon=1;S.party[0].armor=1;S.party.forEach((m,i)=>m.sx=slotX(i));S.hp=maxHp();S.tombRoster=S.party.slice();S.tombBodies=[];
    buildWorld(0);S.camX=haltCam(S.stops[0])-2000;KM.TombMemorials.reset(S);musicScene("walk");
    $("stage").dataset.tomb='true';$("sky-title").hidden=true;hudCache='';renderWalk();renderHUD();
  }
  function tombEnd(won){
    hush();S.enc=null;S.mode=won?'win':'gameover';S.timers=[];KM.FireFx.stop();musicScene(won?'win':'gameover');
    showPanel('<div class="chapter-gate"><h2>'+T(won?'The passage is clear.':'The tomb keeps its guests.')+'</h2><div class="opts">'+big('Enter','Try the passage again','tombRestart')+'<a class="tomb-return" href="./?mode='+S.challengeMode+'&v=chapter-music-44">'+T('Return to the road')+'</a></div></div>','info');
  }
  // Chapter gates read their words and order from D.chapters (src/data/chapters.js).
  function chapterGate(next=D.chapters.next[S.chapter]||'hollowwood'){
    if(S.mode==='chapter')return;
    const g=D.chapters.gates[next];if(!g)return showWin(true);
    S.mode='chapter';S.nextChapter=next;S.enc=null;hush();musicScene('walk');if(!PREVIEW&&next==='hollowwood')KM.HollowWood.unlock();save();
    showPanel('<div class="chapter-gate"><h2>'+T(g.title)+'</h2><p>'+T(g.line)+'</p><div class="opts">'+big('Enter',g.enter,'enterChapter')+big('','Finish this run','finishRun')+'</div></div>','info');
  }
  function enterChapter(){
    if(S.mode!=='chapter')return;const next=S.nextChapter||'hollowwood';S.mode='chapterLoading';showPanel('','info');
    if(next==='tomb'){KM.Tomb.preload();A.play('crypt_door');}
    inkTransition(()=>{
      hush();S.chapter=next;S.nextChapter=null;S.stop=0;S.camX=0;S.winT=0;S.enc=null;S.view=null;
      S.loot=[];S.restUses={};S.tavernRecruits={};S.timers=[];S.floats=[];S.dice=[];S.respect=null;
      S.party.forEach((m,i)=>{m.act=null;m.sp=null;m.hopY=0;m.sx=slotX(i);});
      syncChapterFlag();
      if(inTomb()){S.tombRoster=S.party.slice();S.tombBodies=[];KM.TombMemorials.reset(S);}
      buildWorld(0);if(inTomb())S.camX=haltCam(S.stops[0])-2000;
      setCheckpoint();S.mode='walk';musicScene('walk');hudCache='';renderWalk();renderHUD();
    });
  }
  const enterWood = enterChapter; // older name kept for tests and saved links
  function showRunScore(){
    const summary=scoreSummary(),entry={mode:S.challengeMode,id:S.runId||('legacy-'+S.name+'-'+S.dist),name:S.name,score:summary.total,earned:summary.earned,survivors:summary.survivors,leagues:+leagues(),victory:S.mode==='win',at:Date.now()};
    const eligible=!PREVIEW&&!/[?&](debug|notimer)(?:[=&]|$)/.test(location.search);
    if(eligible)KM.Leaderboard?.record(entry);
    KM.ScoreBanner?.show(summary,S.scoreLedger,{entry,mode:S.challengeMode,preview:!eligible});
  }
  // A terminal survival bonus, never added to the running score or counted twice on redraw.
  function scoreSummary() {
    const survivors = S.mode === 'win' ? S.party.filter(PA.alive).length : 0;
    const bonus = survivors * 2;
    return { earned: S.score, survivors, bonus, total: S.score + bonus };
  }
  function scoreHTML() {
    const score = scoreSummary();
    return `<div class="final-score" role="group" aria-label="Final score ${score.total}"><div class="score-label">Final score</div><div class="score-value" data-final-score="${score.total}">${G(String(score.total).replace('-', '−'))}</div>${score.bonus ? `<div class="survivor-bonus">+${score.bonus} · ${score.survivors} survivor${score.survivors === 1 ? '' : 's'}</div>` : ''}</div>`;
  }
  // one large element: the distance travelled (+ a star when it is a new best)
  const journeyHTML = isBest => `<div class="journeyline"><i class="mile">⚐</i>${leagues()} <span class="unit">leagues</span>${isBest ? ` <span class="best">★ best</span>` : ""}</div>`;
  // the narrator (skeleton on his rock) narrates the end
  function endNarrator(text) {
    let n = narrator(); if (!n) { n = mkActor({ id: "narrator", x: S.camX + NARRATOR_X, narrator: true }); S.actors.push(n); }
    n.x = S.camX + 1320; n.state = "idle"; n.active = true; n.dead = false; const md = S.mode; speak(n, text, { keep: () => S.mode === md });
  }
  function retry() {
    if(tombTest())return startTomb();
    if(S.routeVersion){const name=S.name;newGame();hush();S.name=name;S.intro=null;S.actors=S.actors.filter(a=>!a.narrator);S.mode='walk';musicScene('walk');setCheckpoint();renderWalk();return;}
    const c = S.checkpoint; if (!c) return newGame();
    hush(); applyCore(c); startRunBookkeeping(); S.hp = maxHp(); S.mode = "walk"; musicScene("walk"); S.floats = []; save(); renderWalk();
  }

  // ---------- input ----------
  const actions = {
    replaceMember:b=>replaceMember(b.dataset.id), keepParty:keepParty,
    tombRestart:startTomb, enterChapter, enterWood, finishRun:()=>{if(S.mode==="chapter")showWin(true);}, awakenBell, leaveBell,
    sketchStart, sketchExit:()=>location.assign('./?mode='+S.challengeMode),
    leaderboard:()=>KM.ScoreBanner?.showBoard({mode:S.challengeMode}),
    knightPlay:b=>playKnight(+b.dataset.knightSlot,null),knightScroll:()=>armKnightScroll(),
    chooseMode:b=>chooseMode(b.dataset.mode),
    language:b=>chooseLanguage(b.dataset.lang),
    newGame: () => newGame(), continue: () => continueGame(), skipIntro: () => skipIntro(), submitName: () => submitName(), nextLine: () => advanceIntro(),
    pickLightning:()=>pickAction("lightning"),
    commit: () => commit(), avoid: () => avoid(),
    pickWeak: () => pickAction("weak"), pickHard: () => pickAction("hard"), pickHeal: () => pickAction("heal"), pickExecute: () => pickAction("execute"), pickResurrect: () => pickAction("resurrect"),
    mathBack: () => { const e = S.enc; if (e && !e.deadlineBusy && e.q && e.q.back) { const b = e.q.back; e.q = null; e.msg = ""; b(); } },
    sacrifice: () => renderSacrifice(), doSacrifice: b => doSacrifice(b.dataset.id), cancelSacrifice: () => cancelSacrifice(),
    answer: b => answerRiddle(+b.dataset.i),
    recruitSum: () => {
      const e = S.enc; if (!e || e.phase!=="recruit") return;
      recruitFlow(e.st, 0, (ok, cancelled) => { if (cancelled) return renderRecruit(); if (!ok) e.act.state = "stay"; finishEncounter(); });
    },
    noRecruit: () => { S.enc.act.state = "stay"; finishEncounter(); },
    contest: () => contest(),
    noContest: () => { const c = S.enc.contest; S.enc.contest = null; c.done(false); },
    roll: () => roll(),
    frankAgree: () => { if (S.enc.phase === "frank") { say(S.enc.frank, "Splendid! For God and science!"); commit(); } }, frankNo: () => frankNo(),
    tvBack: () => tvBack(), tvJoin: b => tvJoin(+b.dataset.j), tvTalk: b => { const j = +b.dataset.j, p = S.enc.st.cands[j]; if (p) speak(candSpeaker(S.enc.st, j), p.join); },
    talkTable: () => talkPoint("table"), talkBar: () => talkPoint("bar"), castSpell: () => castSpell(), buySpell: () => buySpell(), pickFire: () => pickFire(), buyBottle: () => buyBottle(),
    selectTavern:b=>{if(S.enc?.tv){S.enc.tv.sel=+b.dataset.i;renderTavernInside();}},
    buyFare:b=>buyFare(b.dataset.item),
    restHeal: b => restHeal(b.dataset.k), openCards: () => { if (S.enc) { S.enc.cardPick = true; renderRest(); } }, closeCards: () => { if (S.enc) { S.enc.cardPick = false; renderRest(); } }, takeCard: b => takeCard(b.dataset.id), buyMead: () => buyMead(), restRecruit: b => restRecruit(+b.dataset.j),
    chooseGear:b=>chooseGear(b.dataset.kind), assignGear:b=>assignGear(+b.dataset.i), cancelGear:()=>cancelGear(),
    restBuyW: b => restBuy("weapon", +b.dataset.i), restBuyA: b => restBuy("armor", +b.dataset.i),
    goInside: () => goInside(), leaveInside: () => leaveInside(),
    leaveRest: () => leaveRest(),
    retry: () => retry(),
    toggleMusic: () => { MU.toggleMute(); renderHUD(); }
  };
  // v11b (Magnus): scene hotspots work with the mouse too: pointer cursor + the ink highlight on hover, click = use
  // (exterior doorway = go in; inside: sign = swing it / its plaques, recruit = "Join my party?", door = go outside).
  function hotspotAt(ev) {
    if (!S.enc || roomChanging) return null; const r = cv.getBoundingClientRect(), sx = (ev.clientX - r.left) / r.width * VW, sy = (ev.clientY - r.top) / r.height * L.artSpaceH;
    const inR = q => sx >= q.x && sx <= q.x + q.w && sy >= q.y && sy <= q.y + q.h;
    if (!S.view && S.enc.phase === "tavernOut") { const door = roadDoor(); return door && inR(door) ? {id:"arrivalDoor",use:goInside} : null; }
    if (!S.view) return null;
    if (S.view.id === "tavern-arrival" && S.enc.phase === "tavernOut" && S.view.a >= 1 && inR(arrivalDoor())) return { id: "arrivalDoor", use: () => goInside() };
    if (S.view.id === "tavern-interior" && S.enc.tv && S.enc.phase === "rest") { const i = tvSpots().findIndex(q => inR(q.r));
      if (i >= 0) return { id: "tv" + i, i, use: () => { S.enc.tv.sel = i; renderTavernInside(); } }; }
    return null;
  }
  cv.addEventListener("mousemove", ev => { const h = hotspotAt(ev); cv.style.cursor = h ? "pointer" : "";
    const id = h ? h.id : null; if (id === S.hoverSpot) return; S.hoverSpot = id;
     });
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
    if(S.enc?.gearChoice && !["assignGear","cancelGear","toggleMusic"].includes(b.dataset.act))return;
    if (b.dataset.key) return typeKey(b.dataset.key);
    if (b.dataset.act && actions[b.dataset.act]) { A.play("ui_click"); actions[b.dataset.act](b); }
  });
  // Keyboard is THE input. Every prompt shows its key; clicking the option lines also works.
  document.addEventListener("keydown", ev => {
    const k = ev.key, K1 = k.length === 1 ? k.toUpperCase() : k;
    if(S.enc?.gearChoice){
      if(k==='Escape'){ev.preventDefault();cancelGear();}
      else if(/^[1-4]$/.test(k)){ev.preventDefault();assignGear(+k-1);}
      else if(k==='Tab'){const buttons=[...panel.querySelectorAll('[role="dialog"] button:not([disabled])')];const i=buttons.indexOf(document.activeElement);ev.preventDefault();buttons[(i+(ev.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}
      return;
    }
    if (S.mode === "name") { if (k === "Enter" && !ev.isComposing) { ev.preventDefault(); submitName(); } return; }
    if (S.mode === "encounter" && S.enc && S.enc.phase === "spell") { // v12k fire bottle word: letters only (M, Z... are letters here); v12m: Backspace does nothing
      if (k === "Backspace") ev.preventDefault(); else if (/^[a-z]$/i.test(k)) spellKey(k.toUpperCase()); return; }
    if (K1 === "M") { MU.toggleMute(); renderHUD(); return; }
    if (k === "[" || k === "]") { MU.setVolume(MU.settings().volume + (k === "]" ? 1 : -1) * D.music.volumeStep); renderHUD(); return; }
    if ([" ", "Enter", "Backspace"].includes(k)) ev.preventDefault();
    if (sketch && ['sketchTitle','sketchWin','sketchLoss'].includes(S.mode)) {
      if(k==='Enter')sketchStart();return;
    }
    if (S.mode === "title") { const sv = KM.Save.load(); if (k === "Enter") return sv ? continueGame() : newGame(); if (K1 === "N") return newGame(); if (K1 === "C" && sv) return continueGame(); return; }
    if (S.mode === "intro") { if (k === " " || k === "Enter") advanceIntro(); if (k === "Escape") skipIntro(); return; }
    if (S.mode === "gameover") { if (k === "Enter") retry(); else if (K1 === "N") newGame(); return; }
    if (S.mode === "win") { if (k === "Enter") newGame(); return; }
    if (S.mode === "chapter") { if(k === "Enter")enterChapter();return; }
    if (K1 === SPL.key && !S.dying && !isFellowship()) { // Spell of Stupidity: on the road, on your turn, or mid-sum (buy it at a tavern / shop)
      const ph = S.enc && S.enc.phase;
      if (S.mode === "encounter" && ph === "cards") return armKnightScroll();
      if (S.mode === "walk" || (S.mode === "encounter" && (ph === "choose" || ph === "math") && !S.enc.sub)) return castSpell();
      if (S.mode === "encounter" && ph === "rest") return buySpell();
    }
    const e = S.enc; if (S.mode !== "encounter" || !e || S.dying) return;
    const press = (a, el) => { A.play("ui_click"); actions[a](el || {}); };
    if(e.phase==='optional'){if(k==='Enter')awakenBell();else if(k==='Escape')leaveBell();return;}
    if (e.sub === "sacrifice") {
      const ks = priests();
      if (/^[1-9]$/.test(k) && ks[+k - 1]) { A.play("ui_click"); doSacrifice(ks[+k - 1].id); }
      else if (k === "Escape") press("cancelSacrifice");
      return;
    }
    const canSac = priests().length > 0;
    switch (e.phase) {
      case 'replace': if(k==='Escape')keepParty();else if(/^[1-3]$/.test(k)){const m=knights()[+k-1];if(m)replaceMember(m.id);}return;
      case "math": case "deadline":
        if (/^\d$/.test(k)) typeKey(k); else if (k === "Backspace") typeKey("back"); else if (k === "Enter") typeKey("enter");
        else if (k === "Escape" && e.q && e.q.back) press("mathBack");
        return;
      case "approach": if (k === "Enter") press("commit"); else if (K1 === "A" && C.avoidable[e.st.type]) press("avoid"); return;
      case "cards": if(!ev.repeat && /^[123]$/.test(k))playKnight(+k-1,null);return;
      case "choose":
        if (k === C.actions.weak.key) press("pickWeak"); else if (k === C.actions.hard.key) press("pickHard"); else if (k === C.actions.heal.key) press("pickHeal");
        else if(k==='6')press('pickLightning'); else if(k===C.actions.execute.key)press("pickExecute"); else if(k===C.actions.resurrect.key)press("pickResurrect"); else if (K1 === "S" && canSac) press("sacrifice"); else if ((K1 === "R" || k === " ") && e.st.type === "mega") roll();
        else if (K1 === IT.key && firestarter() && S.enc.fireUses > 0) press("pickFire");
        return;
      case "riddle": { const ri = RKEYS.indexOf(K1); if (ri >= 0 && ri < e.riddle.choices.length) answerRiddle(ri); else if (/^[123]$/.test(k)) answerRiddle(+k - 1); else if (K1 === "S" && canSac) press("sacrifice"); return; }
      case "recruit": if (k === "Enter") press("recruitSum"); else if (K1 === "N") press("noRecruit"); return;
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
        if(S.enc.gearChoice){if(k==='Escape')cancelGear();else if(/^[1-4]$/.test(k))assignGear(+k-1);return;}
        const T = restT(), inside = S.view && S.view.id === "tavern-interior";
        if (T.heals.some(h => h.key === K1)) restHeal(K1); else if (T.mead && K1 === T.mead.key) buyMead();
        else if (/^[1-3]$/.test(k)) restRecruit(+k - 1);
        else if (K1 === "Q" && T.gear && T.gear.maxWeapon) chooseGear("weapon");
        else if (K1 === "A" && T.gear && T.gear.maxArmor) chooseGear("armor");
        else if (inside && (K1 === "X" || k === "Escape")) press("leaveInside");
        else if (inside && K1 === "T") talkPoint("table"); else if (inside && K1 === "B") talkPoint("bar");
        else if (k === "Enter") press("leaveRest");
      }
    }
  });

  // ---------- update ----------
  function update(dt) {
    if(S.lightning){S.lightning.t+=dt;if(S.lightning.t>.6)S.lightning=null;}
    S.t += dt;
    KM.ScoreBanner?.update(dt);
    if (isWalking()) S.walkT = (S.walkT || 0) + dt; // v13 walk cycle clock: runs only while the party walks
    if (S.timers.length) { const due = S.timers.filter(x => x.at <= S.t); S.timers = S.timers.filter(x => x.at > S.t); due.forEach(x => x.fn()); }
    tickSpeech(dt); introPace(); tickAnswerTimer(dt); KM.FireFx.update(dt);
    if (S.mode !== "encounter" && KM.FireFx.active()) KM.FireFx.stop(); // v12n: the battle is over / the scene changed: no fire (or crackle) left behind
    if (S.mode === "walk") { const before=S.camX;updateWalk(dt);if(S.camX>before)collectLoot(); }
    updateDragonApproach(dt);
    if (S.toast) { S.toast.t += dt; if (S.toast.t > S.toast.dur) S.toast = null; }
    MU.setPlace(S.view && S.view.to ? S.view.id : null); // v12r: tagged music (vocal tavern songs) only plays in its place (src/data/music.js)
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
      if (a.departure) a.departure.t = Math.min(4.5, a.departure.t + dt);
      a.t += dt; if (a.flash > 0) a.flash -= dt; if (a.act) { a.act.t += dt; if (a.act.t >= a.act.dur) a.act = null; }
      if (a.seqPlay) { a.seqPlay.t += dt; if (!a.seqPlay.hold && a.seqPlay.t >= KM.Assets.seqDur(a.seqPlay.id)) a.seqPlay = null; }
      if (a.closing) { a.closing.t += dt; if (a.closing.t >= a.closing.dur) a.closing = null; }
      if (a.state === "walkin") { const st=S.stops[a.stop],hx=a.homeX!=null?a.homeX:st.stopX,dx=hx-a.x,step=W.enemyWalkSpeed*dt; a.x+=Math.sign(dx)*Math.min(Math.abs(dx),step); if(Math.abs(dx)<=step){a.x=hx;a.state="idle";} }
      // stepped vanish for creatures without approved drawn deaths: hold, then 3 hard alpha steps (no tweened fall)
      if (a.state === "vanish") { a.alpha = a.t < 0.35 ? 1 : a.t < 0.5 ? 0.66 : a.t < 0.65 ? 0.33 : 0; if (a.t >= 0.65) a.dead = true; }
      if (a.state === "flyoff") { a.x += dt * 600; a.dy -= dt * 380; if (a.dy < -1100) a.dead = true; }
      if (a.state === "charge") { a.x += dt * 600; if (a.x >= a.target) { if (a.onArrive) { const f = a.onArrive; a.onArrive = null; a.sp = null; f(); continue; } a.state = "vanish"; a.t = 0; a.sp = null; } }
      if (a.state === "hunt") { a.x += dt * 520; if (screenX(a.x) > W.partyScreenX - 260) a.state = "idle"; }
      if (screenX(a.x) < -900 && a.state !== "waiting" && !a.hunter) a.dead = true;
    }
    S.floats.forEach(f => (f.t += dt)); S.floats = S.floats.filter(f => f.t < (f.life || 1.8));
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
  // Squarer woodcut bubbles extend inward from the speaker; the painted tail follows their mouth.
  const heads = () => occ.map(o => { if (o.head) return Object.assign({ owner: o.owner }, toScr(o.head)); const r = toScr(o); return { owner: o.owner, x: r.x + r.w * 0.15, y: r.y, w: r.w * 0.7, h: Math.min(r.h * 0.3, 150) }; });
  const BUB = () => { const A11 = window.KM_ART11; if (!A11) return null; const s = L.artScale, out = {};
    for (const side of ["left", "right"]) { const B = A11.bubbles[side], im = KM.Assets.loadImg(A11.root + B.img);
      out[side] = { im, w: B.size[0] * s, h: B.size[1] * s, flip: !!B.flip,
        tip: B.tip.map(v=>v*s), root:B.root.map(v=>v*s), body:B.body.map(v=>v*s),
        canonicalRoot:B.canonicalRoot.map(v=>v*s), canonicalTip:B.canonicalTip.map(v=>v*s), text:B.text.map(v=>v*s) }; }
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
    if (partyHeartsRect()) avoid.push(partyHeartsRect()); avoid.push(...statusRects()); const hardAvoid = foeHeartsRects().flatMap(r=>r.intent?[r,r.intent]:[r]).map(r => ({ x: r.x - 8, y: r.y - 8, w: r.w + 16, h: r.h + 16 })); // monster hearts: never under a bubble
    const occS = occ.map(o => Object.assign(toScr(o), { owner: o.owner }));
    for (const b of bubbleQ) {
      b.lines = b.lines || [b.text];
      const hx=b.x*K, hy=b.y*K, own=occS.find(o=>o.owner===b.owner);
      const side=KM.SpeechBubbles.sideFor(hx,SW), direction=side==='left'?1:-1;
      // Explicit face anchors for off-centre heads; otherwise aim just below the brow.
      const mouth=b.mouth ? {x:b.mouth.x*K,y:b.mouth.y*K} : {
        x:hx+direction*(own?own.w*.10:0), y:hy+(own?Math.min(own.h*.17,75):0)
      };
      const ownFace=HD.find(face=>face.owner===b.owner);
      // End just outside the face silhouette, never lay the tail across eyes or lips.
      if(ownFace && mouth.y>=ownFace.y && mouth.y<=ownFace.y+ownFace.h && mouth.x>=ownFace.x-3 && mouth.x<=ownFace.x+ownFace.w+3)
        mouth.x=side==='left' ? ownFace.x+ownFace.w+5 : ownFace.x-5;
      const best=KM.SpeechBubbles.place({mouth,speakerX:hx,width:SW,height:SH,art:bubArt,
        avoid:avoid.concat(placed,hardAvoid),heads:HD,bodies:occS.filter(o=>o.owner!==b.owner),count:bubbleQ.length});
      if(best)placed.push(best.body); b.rect=best; b.hx=hx; b.hy=hy;
    }
    for (const b of bubbleQ) if(b.rect)drawBubble(b);
  }
  function drawBubble(b) {
    const r = b.rect, ink = "#2a1d12", A = r.side && bubArt && bubArt[r.side];
    ctx.save();
    if (A && A.im._ok) {
      KM.SpeechBubbles.drawFrame(ctx, A, r);
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
  const armourOverhang = () => Math.max(0, Math.ceil(PA.armour(S.party) / Math.max(1,maxHp())) - 1) * 7;
  const partyHeartsRect = () => { if (inTomb() || !showHearts()) return null; return { x:18, y:16, w:maxHp()/BT.unit()*(HS+HG)+armourOverhang()+Math.max(0,S.party.length-1)*PG, h:HS }; };
  function heartPath(x, y, s) { // top-left x,y, size s
    ctx.beginPath(); ctx.moveTo(x + s / 2, y + s * 0.95);
    ctx.bezierCurveTo(x - s * 0.05, y + s * 0.55, x - s * 0.02, y + s * 0.05, x + s * 0.27, y + s * 0.06);
    ctx.bezierCurveTo(x + s * 0.42, y + s * 0.07, x + s * 0.5, y + s * 0.2, x + s / 2, y + s * 0.27);
    ctx.bezierCurveTo(x + s * 0.5, y + s * 0.2, x + s * 0.58, y + s * 0.07, x + s * 0.73, y + s * 0.06);
    ctx.bezierCurveTo(x + s * 1.02, y + s * 0.05, x + s * 1.05, y + s * 0.55, x + s / 2, y + s * 0.95); ctx.closePath();
  }
  function heart(x, y, s, full, col) { heartPath(x, y, s); ctx.fillStyle = full ? col : "rgba(239,224,192,.85)"; ctx.fill(); ctx.lineWidth = Math.max(2, s / 12); ctx.strokeStyle = "#2a1d12"; ctx.stroke(); }
  function halfHeart(x,y,s,col){ctx.save();ctx.beginPath();ctx.rect(x-4,y-4,s/2+4,s+8);ctx.clip();heart(x,y,s,true,col);ctx.restore();}
  function drawHearts() {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineJoin = "round";
    const r = partyHeartsRect();
    if(r){let x=r.x,i=0;const slots=[];
      S.party.forEach((m,j)=>{if(j)x+=PG;
        const u=BT.unit();for(let h=0;h<PA.life(m)/u;h++){slots.push(x);const lit=Math.max(0,Math.min(u,S.hp-i*u));i++;heart(x,r.y,HS,lit===u,'#b3321f');if(lit&&lit<u)halfHeart(x,r.y,HS,'#b3321f');x+=HS+HG;}
      });
      // Armour is one shared visual pool: cover hearts from the far left, regardless of who owns the gear.
      if(slots.length)for(let h=PA.armour(S.party)-1;h>=0;h--)
        heart(slots[h%slots.length]+Math.floor(h/slots.length)*7,r.y,HS,true,'#b8b9b4');
    }
    // every living foe: its own small hearts above its head
    foeHeartsRects().forEach(fr => {
      for (let i=0;i<fr.shown;i++)heart(fr.x+i*(FS+3),fr.y,FS,i<fr.full,"#7a1f14");
      const box=fr.intent;if(!box)return;
      ctx.fillStyle='#efe1c7';ctx.strokeStyle=box.attacking?'#884821':'#776958';ctx.lineWidth=1.6;
      ctx.fillRect(box.x,box.y,box.w,box.h);ctx.strokeRect(box.x,box.y,box.w,box.h);
      ctx.font=(box.attacking?'bold ':'')+'21px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle=box.attacking?'#792f12':'#524738';ctx.fillText(box.label,box.x+box.w/2,box.y+box.h/2+1);
    });
    ctx.restore();
  }
  const FS = 20, FROW = 10; // the monster's small hearts (rows of 10) (stage px), centred just above its head
  function foeHeartsRect() { const e = S.enc; return e && e.act ? foeHeartsRects().find(r => r.owner === e.act) || null : null; }
  function foeHeartsRects() {
    const e = S.enc; if (!e || !e.revealed || !e.act || e.hp <= 0 || !["cards","choose","math","spell","busy","deadline"].includes(e.phase)) return [];
    return (e.foes && e.foes.length ? living(e) : [e.act]).map(a => { const o = occ.find(q => q.owner === a); if (!o || a.dead) return null;
      const mx = a.maxHp != null ? a.maxHp : e.maxHp, hp = a.hp != null ? a.hp : e.hp;
      // ONE row at most (Magnus: the mega boss's ~24 hearts were clutter): up to FROW hearts, each worth mx / shown HP;
      // filled = hp rounded UP so a foe with any HP left keeps one filled heart
      // centred on the drawing's opaque middle (KM_WIDE) where it is drawn THIS frame, just above its head (KM_TALL)
      const shown = Math.min(FROW, mx), full = Math.ceil(Math.max(0, hp) / mx * shown - 1e-9), w = shown * (FS + 3) - 3, h = FS;
      const wd = wideOf(a.id), dp = dragonPose(a), ds = dp ? dp.scale : 1, cx = ((a.drawX != null ? a.drawX : screenX(a.x)) + (wd[0] + wd[1]) / 2 * ds) * K, top = ((a.drawY != null ? a.drawY : W.groundY) - tallOf(a.id) * ds) * K;
      const y=Math.max(43,top-h-12),label=intentLabel(e,a),bw=Math.min(230,Math.max(108,label.length*(KM.I18n?.jp()?19:10)+20));
      const intent=e.resolvingEnemyTurn?null:{label,attacking:intentDamage(e,a)>0,x:Math.max(8,Math.min(L.scene.w-8-bw,cx-bw/2)),y:y-32,w:bw,h:27};
      return {owner:a,id:a.id,hp,max:mx,shown,full,cx,headY:top,x:Math.max(8,Math.min(L.scene.w-8-w,cx-w/2)),y,w,h,per:shown,intent}; }).filter(Boolean);
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
  // Mouth/visor anchors measured on the standing atlas cells, relative to each cell pivot.
  // Attachment metadata only: no character artwork or animation changes.
  const speechOffsets = {villager:[170,-470],villager_sword:[170,-470],villager_armour:[230,-444],hero:[230,-444],follower_1:[170,-398],follower_2:[184,-400],
    follower_3:[180,-408],follower_4:[184,-395],frank:[50,-390],timmy:[80,-339],executioner:[55,-345],dark_wizard:[48,-365]};
  const speechFaces={villager:[60,-590,130,155],villager_sword:[60,-590,130,155],villager_armour:[46,-592,175,185],hero:[46,-592,175,185],follower_1:[-24,-530,190,160],
    follower_2:[6,-570,170,205],follower_3:[6,-570,170,205],follower_4:[6,-570,170,205],
    frank:[-71,-464,110,109],timmy:[-26,-437,92,145],executioner:[-61,-449,105,135],dark_wizard:[-5,-415,90,90]};
  function faceOf(id,x,y,flip=false,scale=1) {
    const r=speechFaces[id];if(!r)return null;
    const s=L.art*((KM_ART.entities[id]||{}).artMul||1)*scale;
    return {x:x+(flip?-r[0]-r[2]:r[0])*s,y:y+r[1]*s,w:r[2]*s,h:r[3]*s};
  }
  function mouthOf(id,x,y,flip=false,scale=1) {
    const p=speechOffsets[id];if(!p)return null;
    const s=L.art*((KM_ART.entities[id]||{}).artMul||1)*scale;
    return {x:x+p[0]*s*(flip?-1:1),y:y+p[1]*s};
  }
  const pushSay = (o, x, headY, mouth) => { const c=speechNow(o);if(!c)return;
    const bubble={text:c.join(" "),lines:c,x,y:headY,mouth,owner:o},i=bubbleQ.findIndex(b=>b.owner===o);
    if(i>=0)bubbleQ[i]=bubble;else bubbleQ.push(bubble);
  };
  // Only the hill landmark changes depth; ordinary enemies keep their full-colour, opaque art.
  const ML = () => D.scenery.midLane;
  function laneOf(a) {
    if (a.distant && a.hill) return { y:ML().y, filter:'grayscale(1)', alpha:1 };
    if (a.closing && a.hill) { const k=Math.min(1,a.closing.t/a.closing.dur); return {y:ML().y+(W.groundY-ML().y)*k,filter:'',alpha:1}; }
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
  // Alternate authored peeks, kept behind their opaque rock. The third visit is further away.
  function drawRiddleVariant(a){
    if(a.hidden||a.eaten)return;
    const far=a.riddleVariant===2,st=S.stops[a.stop],im=KM.Assets.loadImg('assets/wizard-riddles/'+(far?'riddler-over.png':'riddler-left.png'));
    if(!im._ok)return;
    const sx=far?W.engageScreenX+(haltCam(st)-S.camX)*.55:screenX(a.x);
    const h=far?350:510,w=h*im.naturalWidth/im.naturalHeight,y=W.groundY-(far?155:0),x=sx-w/2;
    if(x>VW+100||x+w< -100)return;
    ctx.save();ctx.globalAlpha=a.alpha;ctx.drawImage(im,x,y-h,w,h);ctx.restore();
    const mouth={x:x+w*(far?.48:.20),y:y-h+h*(far?.28:.27)};
    occ.push({owner:a,x,y:y-h,w,h,head:{x:mouth.x-50,y:mouth.y-65,w:100,h:90}});
    a.drawX=sx;a.drawY=y;if(a.state!=='vanish')pushSay(a,mouth.x,y-h,mouth);
  }
  function drawActor(a) {
    if (a.departure) return drawCampDeparture(a);
    if(a.id==='bridgekeeper'&&a.riddleVariant>0)return drawRiddleVariant(a);
    if (a.stall) return drawStall(a);
    if (a.hidden || a.facade || a.eaten) return;
    if (a.distant && (KM_ART.entities[a.id] || {}).onHill && S.swaps && !S.swaps.mid.landmark) return; // v19: while distant it IS the dragon on the hill strip
    const dp = dragonPose(a), sx = dp ? dp.x : screenX(a.x); if (sx < -700 || sx > VW + 700) return;
    const ln = dp ? { y: dp.y, filter: dp.filter, alpha: 1 } : laneOf(a);
    let y = (ln ? ln.y : W.groundY) + a.dy;
    const moving = a.state === "walkin" || a.state === "charge" || a.state === "hunt";
    const did = a.state === "newt" ? "newt" : a.id; // newt: its own (missing-art) placeholder, never a shrunken knight
    const fx = actFx(a.id, a.act, a.stop == null || a.hunter ? 1 : -1);
    const action = fx ? fx.action : moving ? "walk" : "idle";
    // v12r (Magnus: "All friendly knights you can get shall face the player"): one rule for every recruitable knight still
    // standing as an NPC on the road (ditch / camp wanderer / shop sellsword / tavern): mirrored to face the party
    // (KM_DATA.party.npcFaceParty). Once he joins he is a party member (not an actor) and faces the walking direction.
    const faceParty = D.party.npcFaceParty && (["frank","timmy","executioner","dark_wizard"].includes(did) || (D.party.recruitArt && did.startsWith(D.party.recruitArt)));
    const dx = fx ? fx.dx : 0, dy = fx ? fx.dy : 0, ds = dp ? dp.scale : 1;
    ctx.save(); ctx.translate(sx + dx, y + dy); ctx.scale(ds, ds);
    KM.Assets.drawEntity(ctx, did, 0, 0, { flip: faceParty, t: fx ? fx.t : moving && KM_ART.walkRate ? a.t * KM_ART.walkRate(did) : a.t, action, hurt: fx && fx.hurt, alpha: a.alpha * (ln ? ln.alpha : 1), flash: a.flash > 0, name: a.label,
      filter: ln && ln.filter, seq: a.seqPlay && a.seqPlay.id, seqT: a.seqPlay && a.seqPlay.t });
    ctx.restore();
    // v18: a separate foreground occluder drawn right after its owner (riddle keeper -> rock), never merged with it
    const fr = a.wizardRock ? "keeper_rock" : (KM_ART.entities[did] || {}).front; if (fr) KM.Assets.drawEntity(ctx, fr, sx, y, { alpha: a.alpha * (ln ? ln.alpha : 1), filter: ln && ln.filter });
    a.drawX = sx + (fx ? fx.dx : 0); a.drawY = y + (fx ? fx.dy : 0); // where it really is this frame (hearts follow a lunge)
    let h = occupy(a, did, sx, y);
    if (dp) { const o = occ[occ.length - 1]; o.w *= ds; o.h *= ds; o.x = sx - o.w / 2; o.y = y - o.h; h = o.h; }
    const sa = (KM_ART.entities[did] || {}).sayAt; // sayAt: where his head is (source px from the pivot)
    const sm = L.art * ((KM_ART.entities[did] || {}).artMul || 1); // v12b: the narrator's artMul (Magnus: knight-sized)
    if (sa) { const N = window.KM_NARRATOR, sw = (N ? N.skull.w : 180) * sm; occ[occ.length - 1].head = { x: sx + sa[0] * sm - sw * 0.6, y: y + sa[1] * sm, w: sw * 1.2, h: sw * 1.5 }; } // the skull, not the whole rock
    const keeperMouth = did === 'bridgekeeper' ? {x:sx+(398-KM_ART18.keeper.anchor[0])*sm,y:y+(350-KM_ART18.keeper.anchor[1])*sm} : null;
    const face=faceOf(did,sx,y,faceParty,ds);if(face)occ[occ.length-1].head=face;
    if(keeperMouth)occ[occ.length-1].head={x:sx+(410-KM_ART18.keeper.anchor[0])*sm,y:y+(210-KM_ART18.keeper.anchor[1])*sm,w:185*sm,h:190*sm};
    if (a.state !== "vanish") pushSay(a, sa ? sx + sa[0] * sm : sx, sa ? y + sa[1] * sm : y - h, keeperMouth || mouthOf(did,sx,y,faceParty,ds));
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
  function roadDoor() {
    const a=S.actors.find(a=>a.facade && a.stop===S.stop && !a.dead);
    const sc=KM_ART7.scenes["tavern-exterior"]; if (!a || !sc) return null;
    const [fx,fy,fw,fh]=sc.facadePlacement, [dx,dy,dw,dh]=sc.doorRect, s=L.art*(L.buildingMul||1);
    return {x:screenX(a.x)-fw*s/2+(dx-fx)*s,y:W.groundY+8-fh*s+(dy-fy)*s,w:dw*s,h:dh*s};
  }
  function drawFacade(a) { // tavern exterior: dark door backing, (doorway slot), facade cut from Magnus's layered exterior
    const sc = ART7 && KM_ART7.scenes["tavern-exterior"]; if (!sc || !sc.facadeCrop) return;
    const im = KM.RestView.img(sc.facadeCrop.img), bk = KM.RestView.img(sc.doorBackingCrop.img); // v10: paper-graded copies
    const [fx, fy, fw, fh] = sc.facadePlacement, s = L.art * (L.buildingMul || 1), sx = screenX(a.x), x0 = sx - fw * s / 2, y0 = W.groundY + 8 - fh * s;
    if (sx < -fw * s || sx > VW + fw * s) return;
    if (bk._ok) ctx.drawImage(bk, x0, y0, fw * s, fh * s);
    if (S.entering) { // v8: at 1:1 the hero is far taller than the painted door, so he walks to it and fades (no shrink)
      const [dx, , dw] = sc.doorRect, k = Math.min(1, S.entering.t / 0.6);
      const doorX = x0 + (dx - fx + dw / 2) * s, hx = W.partyScreenX + (doorX - W.partyScreenX) * k;
      KM.Assets.drawEntity(ctx, artId(S.party[0]), hx, W.groundY, { alpha: 1 - k });
    }
    // v10: the facade's paper-white walls take the parchment like all road scenery (offline ink, KM.Scenery.drawInked)
    const raw = KM.Assets.loadImg(KM_ART7.root + sc.facadeCrop.img), tint = SCN() && D.scenery.tint && D.scenery.tint.enabled;
    if (tint && raw._ok) KM.Scenery.drawInked(ctx, raw, x0, y0, fw * s, fh * s); else if (im._ok) ctx.drawImage(im, x0, y0, fw * s, fh * s);
    occ.push({ owner: a, x: x0, y: y0, w: fw * s, h: fh * s });
  }
  function drawParty(walking) {
    for (let i = S.party.length - 1; i >= 0; i--) {
      const m = S.party[i]; if (m.eaten || (S.entering && m.id === "hero" && S.entering.t < .75)) continue;
      const id = artId(m), rig = KM_ART.entities[id] && KM_ART.entities[id].walk, pose = partyPose(m, i);
      const bob = walking && !rig ? -Math.abs(Math.sin(S.t * 9 + i)) * 6 : 0;
      const y = pose.y + ((m.hopY || 0) + bob) * pose.scale, fx = actFx(id, m.act, 1);
      const [w, h] = KM.Assets.entitySize(id), x = pose.x + (fx ? fx.dx : 0);
      let rear = false;
      if (!m.dying && pose.rear) rear = KM.DragonApproach.drawRear(ctx, S, m, i, pose, h);
      if (!rear) {
        ctx.save(); ctx.translate(x, y + (fx ? fx.dy : 0)); ctx.scale(pose.scale, pose.scale);
        if (m.dying) {
          const cfg=KM_ART.entities[id]||{},seq=m.dying.seq || cfg.deathSeq || (!cfg.noFallbackDeath && (KM_ART.entities.hero || {}).deathSeq);
          KM.Assets.drawEntity(ctx, id, 0, 0, seq ? { seq, seqT: m.dying.t } : {rot:Math.min(1,Math.floor(m.dying.t*5)/3)*Math.PI/2});
        } else KM.Assets.drawEntity(ctx, id, 0, 0, { flip: pose.returning,
          t: fx ? fx.t : walking && rig ? (S.walkT || 0) * KM_ART.walkRate(id) : S.t,
          action: fx ? fx.action : walking ? "walk" : "idle", hurt: fx && fx.hurt, rot: fx && fx.rot,
          name: m.id === "hero" ? S.name : shortName(m.name) });
        ctx.restore();
      }
      occ.push({ owner: m, x: x - w * pose.scale / 2, y: y - h * pose.scale, w: w * pose.scale, h: h * pose.scale });
      const face=faceOf(id,x,y,pose.returning,pose.scale);if(face)occ[occ.length-1].head=face;
      if (!m.dying) pushSay(m, x, y - h * pose.scale, mouthOf(id,x,y,pose.returning,pose.scale));
    }
  }
  // layered rest views (camp / tavern interior). v8: the 1774x887 canvas is drawn at 1:1 x the global factor (KM.RestView).
  // The scenes are painted at ~1/3 of the character cutouts' pixel scale (the pack's depth proof shows a ~216 px knight),
  // so 1:1 characters cannot sit in the seat slots: the party and the recruits stand on OUR ground line in front of the
  // scene (party left, recruits right). Seated poses at the scene's scale are MISSING ART; the bartender slot stays empty.
  function drawView() {
    const v = S.view;
    if(v.id==='tavern-interior'){bubbleQ=[];occ=[];drawTavernPOV();return;}
    const sc = KM.RestView.scene(v.id); if (!sc) return;
    const cands = S.enc && S.enc.st && S.enc.st.cands ? S.enc.st.cands.map((p, j) => p && { p, j }).filter(Boolean) : [];
    ctx.save(); ctx.globalAlpha = v.a; ctx.fillStyle = "#efe3c8"; ctx.fillRect(0, 0, VW, L.artSpaceH); ctx.restore();
    if (SCN() && v.id !== "tavern-interior") { ctx.save(); ctx.globalAlpha = v.a; KM.Scenery.draw(ctx, S.camX, S.t, { chapter:S.chapter, seed: S.fgSeed, swaps: S.swaps }); ctx.restore(); }
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
      ctx.fillStyle = ink; ctx.textAlign = "left"; ctx.fillText(T(it.label), x0 + ip + gap, cy + fs * 0.04);
      ctx.textAlign = "right"; ctx.fillText(String(it.cost), x1, cy + fs * 0.04);
      if (selId === it.id) { const lw = ctx.measureText(it.label).width; ctx.fillStyle = G.lit; ctx.fillRect(x0 + ip + gap, cy + fs * 0.55, lw, px(G.underline)); } // lit line
    });
    ctx.restore();
  }
  function tvSpots() {
    const e = S.enc; if (!e || !S.view || S.view.id !== "tavern-interior") return [];
    if(KM.TavernPOV)return KM.TavernPOV.spots(e.st.cands,fareItems());
    const m = KM.RestView.mapper("tavern-interior"), sg = signGeom(), items = fareItems(), lines = sg ? fareLines(sg, items.length) : [];
    const out = items.map((it, i) => ({ id: "fare:" + it.id, kind: "fare", item: it.id, name: it.label, r: lines[i].r }));
    const n = (e.st.cands || []).length;
    (e.st.cands || []).forEach((p, j) => { if (p) out.push({ id: "npc" + j, kind: "npc", j, p, name: shortName(p.name), r: seatGeom(j, n).hot }); });
    out.push({ id: "door", kind: "door", name: "The door", r: tvImgRect(m, [3150, 280, 360, 800]) });
    return out;
  }
  function buyFare(id) { const it = fareItems().find(f => f.id === id); if (!it) return; swingSign(SG().swing.deg); A.play("ui_click"); it.buy(); renderTavernInside(); }
  function drawTavernPOV(){
    const e=S.enc;if(!e)return;
    KM.TavernPOV.draw(ctx,e.st.cands,e.tv?.sel, fareItems(),S.party[0],e.tavernDepartures||[],S.t);
    const geom=KM.TavernPOV.seats(e.st.cands);
    geom.forEach(({p,r,j})=>{const head={x:r.x+r.w*.23,y:r.y,w:r.w*.52,h:r.h*.48};occ.push({...r,owner:p,head});pushSay(p,r.x+r.w/2,r.y,{x:r.x+r.w/2,y:r.y+r.h*.3});});
    S.party.forEach(m=>pushSay(m,VW*.32,W.groundY*.80));
    S.voices.forEach(q=>pushSay(q,VW*.5,W.groundY*.45));
  }
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
  function renderTavernInside(){
    const e=S.enc;e.phase='rest';e.tv=e.tv||{sel:-1,open:null};const spots=tvSpots();
    if(e.tv.sel>=spots.length)e.tv.sel=-1;const sp=spots[e.tv.sel];e.tv.open=sp?sp.id:null;
    const nav=spots.map((q,i)=>big('',q.kind==='npc'?esc(shortName(q.p.name)):q.kind==='fare'?'Menu':'Go outside',q.kind==='door'?'leaveInside':'selectTavern',`data-i="${i}" aria-pressed="${e.tv.sel===i}"`)).join('');
    const pl=[];
    if(sp?.kind==='fare')fareItems().forEach((it,i)=>pl.push(move(String(i+1),`${it.label} · ${it.cost}`,'buyFare',it.id,`data-item="${it.id}" data-n="${i+1}"`,it.off)));
    if(sp?.kind==='npc')pl.push(move('1',`Ask ${esc(shortName(sp.p.name))} to join`,'tvJoin','',`data-j="${sp.j}" data-n="1"`,!canRecruit(e.st)));
    const chosen=tavernRecruit(e.st);
    const note=chosen ? `${esc(shortName(chosen))} joined you. One recruit per tavern.` : 'Choose one companion from this tavern.';
    showPanel(`<div class="center tavernp"><div class="tavern-nav">${nav}</div><div class="tavern-options">${pl.join('') || `<span class="tavern-note">${note}</span>`}</div>${sp?.kind==='npc'?`<div class="tavern-note">${note}</div>`:''}</div>`,'rest');
  }
  function tvMove(d) { const e = S.enc, n = tvSpots().length; if (!e || !e.tv || !n || e.phase !== "rest") return; e.tv.sel = (e.tv.sel + d + n) % n; A.play("ui_click"); renderTavernInside(); } // a small nudge on highlight
  function tvOpen(i) { const e = S.enc, spots = tvSpots(); if (!e || !e.tv || e.phase !== "rest") return; if (i != null) e.tv.sel = i; const sp = spots[e.tv.sel]; if (!sp) return; A.play("ui_click");
    if (sp.kind === "fare") return renderTavernInside(); // v12q: click / Enter on a sign line buys it
    else if (sp.kind === "npc" && i == null) tvJoin(sp.j); // Enter on a recruit = "Join my party?"
    else if (sp.kind === "door" && i == null) leaveInside(); else renderTavernInside(); }
  function tvBack() { const e = S.enc; if (!e || !e.tv || e.phase !== "rest") return; leaveInside(); }
  function drawToast() {
    const tt = S.toast, a = Math.min(1, tt.t / 0.3, (tt.dur - tt.t) / 0.5);
    ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.font = "italic 50px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const w = ctx.measureText(T(tt.text)).width + 90, x = VW / 2 - w / 2, y = 44;
    ctx.fillStyle = "rgba(250,244,228,.94)"; ctx.strokeStyle = "#1b1410"; ctx.lineWidth = 4; ctx.fillRect(x, y, w, 90); ctx.strokeRect(x, y, w, 90);
    ctx.fillStyle = "#1b1410"; ctx.fillText(T(tt.text), VW / 2, y + 47); ctx.restore();
  }
  function draw() {
    bubbleQ = []; occ = [];
    const sh = S.shake > 0 ? [rnd(-10, 10), rnd(-8, 8)] : [0, 0];
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(K, 0, 0, K, sh[0] * K, sh[1] * K);
    const arena=KM.DragonApproach.arena(S);
    const live = S.actors.filter(a => a.active && !a.dead && (!arena || a.stop===S.stop && a.foe));
    if(inTomb()){
      KM.Tomb.draw(ctx,S,{walking:isWalking(),occupy:(owner,x,y,w,h)=>occ.push({owner,x,y,w,h}),say:pushSay,
        heart:(x,y,s,full,col)=>{ctx.save();ctx.setTransform(1,0,0,1,0,0);heart(x,y,s,full,col);ctx.restore();}});
    } else if(sketch) {
      sketch.back(ctx,S.camX);
      const attacking=S.party.some(m=>m.act?.name==='attack');
      if(!attacking)drawParty(isWalking());
      live.filter(a=>a.foe).sort((a,b)=>b.x-a.x).forEach(drawActor);
      if(attacking)drawParty(isWalking());
      sketch.front(ctx,S.camX);
    } else if (S.view && S.view.a >= 1) drawView();
    else {
      if(arena)KM.Scenery.drawSky(ctx,S.camX,S.t,S.fgSeed);
      else if (SCN()) KM.Scenery.draw(ctx, S.camX, S.t, { chapter:S.chapter, seed: S.fgSeed, swaps: S.swaps, keepOut: foeHeartsRects().flatMap(r=>r.intent?[r,r.intent]:[r]).concat(partyHeartsRect() ? [partyHeartsRect()] : [], statusRects(), S.mode === "title" ? [{x:440,y:66,w:720,h:134}] : []).map(r => ({ x: r.x / K, y: r.y / K, w: r.w / K, h: r.h / K })), graveLane: drawCompanionGraves, midLane: () => { drawCompanionGraves(1);live.filter(a => (a.distant && a.hill && !dragonPose(a)) || a.riddleVariant===2).forEach(drawActor); } });
      else { KM_ART.layers.forEach(Ly => KM.World.drawLayer(ctx, Ly, S.camX, S.t)); live.filter(a => (a.distant && a.hill && !dragonPose(a)) || a.riddleVariant===2).forEach(drawActor); }
      KM.DragonApproach.drawHill(ctx, S);
      live.filter(a => a.distant && a.hill && dragonPose(a) && (a.id!=="turd_dragon" || !S.dragonSlain)).forEach(drawActor);
      if(!arena)S.skyEvents.forEach(s => KM.Assets.drawEntity(ctx, "sky_dragon", s.x, s.y + Math.sin(s.t * 4) * 14, { scale: 0.6 })); // v12g: solid
      if (!arena && SCN()) S.trees.forEach(tr => { const x = screenX(tr.x); if (x > -600 && x < VW + 600) KM.Scenery.tree(ctx, tr.i, x); });
      if(!arena)S.props.forEach(p => { const x = screenX(p.x); if (x > -400 && x < VW + 400) KM.Assets.drawEntity(ctx, p.id, x, W.propLaneY, { scale: W.propScale, alpha: W.propAlpha }); });
      if(!arena)S.obstacles.forEach(o => { const x = screenX(o.x); if (x > -400 && x < VW + 400) KM.Assets.drawEntity(ctx, o.id, x, W.groundY + 10); });
      if(!arena){drawCompanionGraves(2);drawGraves();drawLoot();} // v12g: graves are road props on the ground line (behind the party and road actors)
      const behind = a => a.riddleVariant!==2 && (a.back || a.narrator) && !(a.distant && a.hill);
      if(!arena)KM.RoadCamp.draw(ctx,S.stops,S.camX,"back");
      live.filter(a => a.facade).forEach(drawFacade);
      live.filter(behind).forEach(drawActor);
      const lunging = S.party.some(m=>m.act && m.act.name === "attack"); // the striker is drawn on top of his target
      if (!lunging) drawParty(isWalking());
      live.filter(a => a.riddleVariant!==2 && !behind(a) && !(a.distant && a.hill) && !(a.act && a.act.name === "attack")).sort((a,b)=>b.x-a.x).forEach(drawActor);
      if (lunging) drawParty(isWalking());
      live.filter(a => a.riddleVariant!==2 && !behind(a) && !(a.distant && a.hill) && a.act && a.act.name === "attack").forEach(drawActor);
      if(!arena)KM.RoadCamp.draw(ctx,S.stops,S.camX,"front");
      KM.FireFx.draw(ctx); // v12k fire bottle: in front of the foes, under the front ground
      if (!arena && SCN()) {if(S.chapter==="hollowwood")KM.HollowWood.foreground(ctx,S.camX);else KM.Scenery.foreground(ctx, S.camX, fgSeed(), W.partyScreenX);} // v10 frontGround: over the feet, below effects/UI
      if (!arena && !SCN()) KM_ART.foreground.forEach(Ly => KM.World.drawLayer(ctx, Ly, S.camX, S.t));
      if (S.view) drawView();
    }
    S.dice.forEach(d => KM.D20.draw(ctx, d, d.x, DIEY, DIE()));
    if (S.toast) drawToast();
    KM.DarkWizard?.draw(ctx,S.lightning);
    S.floats.forEach(f => { if(f.fellowship)return KM.Fellowship.drawBurst(ctx,inTomb()?{...f,x:1200+(f.total?0:(f.index-1.5)*170),y:175}:f,window.matchMedia?.("(prefers-reduced-motion: reduce)").matches); ctx.globalAlpha = Math.max(0, 1 - f.t / 1.8); ctx.fillStyle = f.color; ctx.strokeStyle = "#000"; ctx.lineWidth = 6; ctx.font = "bold 46px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.strokeText(f.text, f.x, f.y - f.t * 40); ctx.fillText(f.text, f.x, f.y - f.t * 40); ctx.globalAlpha = 1; });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawHearts(); drawSpellBadge();
    layoutBubbles();
    ctx.setTransform(K,0,0,K,0,0);KM.DragonApproach.drawInk(ctx,S);ctx.setTransform(1,0,0,1,0,0);
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
    // Shared woodcut timer and slim decorative divider, in every mode/biome.
    const DV = window.KM_ART11 && KM_ART11.divider;
    if (DV && !dv) {
      const d=$("divider"),y=W.groundY*K+DV.belowGround-L.scene.h;
      const width=L.stage.w-24,scale=width/1605;
      d.className="magnus";d.style.backgroundImage="";
      d.innerHTML=`<img class="woodcut-divider" src="assets/timing-woodcut/divider.png" alt="" style="left:${L.stage.w/2-808*scale}px;top:${y+16-12*scale}px;width:${width}px;height:${24*scale}px">`;
      KM.TimingBar?.mount(d,{left:12,top:y+16,width:width}); // Magnus 2026-11-08: in combat the divider itself becomes the full-length meter
      paintTimingLegend();dvFillFrac=-1;dividerFill(0);
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

  window.__km = { completeRecruit, replaceMember, keepParty, beginDismissalBattle, finishDismissalBattle,
    startTomb,tombEnd,chapterGate,enterChapter,enterWood,showWin,
    S, L, chooseMode, strength, maxHp, leagues, roleMembers, firestarter, executioner, canHeal, canResurrect, frankMember, partyPose, lungeDbg: () => [lungeReach(S.party[0], S.enc && S.enc.act), S.party[0].sx, S.enc && screenX(S.enc.act.x), wideOf(artId(S.party[0])), S.enc && wideOf(S.enc.act.id)], partyFull, weakDmg, hardDmg, rerenderMath: () => S.enc && S.enc.phase === "math" && renderMath(), rerenderRest: () => S.enc && S.enc.phase === "rest" && renderRest(), rerenderChoice: () => S.enc && S.enc.phase === "choose" && renderChoice(), setSpeed: k => (S.speedMul = k), audioLog: A.log, audioCounts: A.counts, forceRoll: 0, forceContest: null, props: () => S.props,
    answer: () => (S.enc && S.enc.phase === "math" && S.enc.problem ? S.enc.problem.answer : null), phase: () => S.enc && S.enc.phase, mode: () => S.mode,
    voLog: A.voLog, music: () => MU.state(), musicLog: MU.log,
    companionGraves: () => S.companionGraves.map(d=>({...d})), graves: () => S.graves.map(g => ({ cam: g.cam, wx: g.wx, n: g.deaths.length, marker: g.marker, killer: g.killer, done: g.done, sx: graveSX(g) })),
    respect: () => S.respect && { t: S.respect.t, cam: S.respect.g.cam }, further: () => S.furtherDone, toast: () => S.toast && S.toast.text, view: () => S.view && S.view.id, arrivalDoor: () => S.view && S.view.id === "tavern-arrival" ? arrivalDoor() : roadDoor(), hoverSpot: () => S.hoverSpot,
    hunters: () => S.hunters, enemy: () => (S.enc && S.enc.revealed ? { id: S.enc.act.id, hp: S.enc.hp, maxHp: S.enc.maxHp, atk: S.enc.atk } : null),
    dice: () => S.dice.map(d => ({ result: d.result, done: d.done })), spell: () => ({ charges: S.spells, left: S.spellLeft, problem: S.enc && S.enc.problem ? { text: S.enc.problem.text, stupid: !!S.enc.problem.stupid, level: S.enc.problem.level } : null }),
    chunks: t => chunksOf(t), speechOverflow: () => speechOverflow.slice(),
    bubbles: () => bubbleQ.filter(b => b.rect).map(b => Object.assign({ text: b.text, lines: b.lines.slice(), font: SP.font, art: !!(b.rect.side && bubArt), textW: Math.max(...b.lines.map(l => (ctx.font = `${SP.font}px Georgia, serif`, ctx.measureText(l).width))), maxW: SP.maxW }, b.rect)),
    statusRects: () => statusRects(),
    tavern: () => S.enc && S.enc.tv ? { sel: Math.min(S.enc.tv.sel, tvSpots().length - 1), open: S.enc.tv.open, spots: tvSpots().map(q => ({ id: q.id, kind: q.kind, item: q.item, name: q.name, r: q.r })) } : null,
    heartsUI: () => ({ party: partyHeartsRect() && Object.assign({ hp: S.hp, max: maxHp(), armor:PA.armour(S.party) }, partyHeartsRect()), foe: foeHeartsRect() && Object.assign({ hp: S.enc.hp, max: S.enc.maxHp }, foeHeartsRect()) }),
    spellBadge: () => spellBadgeRect() && Object.assign({ left: S.spellLeft, mead: S.mead }, spellBadgeRect()), mead: () => ({ state: S.mead, now: meadNow() }), group: () => S.enc && S.enc.foes ? S.enc.foes.map(a => ({ id: a.id, hp: a.hp, maxHp: a.maxHp, gone: !!a.gone, x: a.x, sx: screenX(a.x), state: a.state, ext: wideOf(a.id) })) : null,
    foeHearts: () => foeHeartsRects().map(r => ({ id: r.id, hp: r.hp, max: r.max, shown: r.shown, full: r.full, intent: r.intent, x: r.x, y: r.y, w: r.w, h: r.h })),
    forceGroup: (ids) => { const i = S.stops.findIndex((s2, k) => k >= S.stop && s2.type === "math"); const st = S.stops[i]; if (!st) return null;
      S.actors = S.actors.filter(a => !(a.stop === i && a.extra)); st.group = ids; addGroup(st, i); const m = S.actors.find(a => a.stop === i && a.main);
      if (m) { m.homeX = st.homeX; if (!m.active) { m.x = st.stopX + 500; m.state = "waiting"; } } return i; },
    foeFeet: () => S.actors.filter(a => a.foe && !a.dead && !a.hidden).map(a => { const ln = laneOf(a), fx = actFx(a.id, a.act, -1); return { id: a.id, state: a.state, hill: !!a.hill, distant: !!a.distant, sx: screenX(a.x), feetY: (ln ? ln.y : W.groundY) + a.dy + (fx ? fx.dy : 0), groundY: W.groundY }; }), fareLeft: k => fareLeft(k), fare: () => fareItems().map(({ id, label, cost, off, lot }) => ({ id, label, cost, off, lot, icon: fareIcon(id)._ok })), signFont: () => S.signFontStage, signAngle: () => signAngle() * 180 / Math.PI, sign: () => { const g = signGeom(); return g && { r: g.r, k: g.k, nail: [g.nx, g.ny] }; },
    heads: () => heads().map(({ x, y, w, h }) => ({ x, y, w, h })), speechLog: () => speechLog.slice(), speaking: () => [...speakers].filter(o => o.sp).map(o => speechNow(o).join(" ")),
    panelText: () => panel.innerText, answerTimer: () => S.enc && S.enc.tmr ? { t: S.enc.tmr.t, secs: S.enc.tmr.secs, frac: Math.min(1, S.enc.tmr.t / S.enc.tmr.secs) } : null,
    bottles: () => S.bottles, spelling: () => S.enc && S.enc.spell ? Object.assign({ phase: S.enc.phase }, S.enc.spell) : null, fireFx: () => KM.FireFx.state(), timedOut: () => S.enc && S.enc.timedOut || 0, timerWhy: () => S.enc ? timerPause(S.enc) : "no-enc", fitRiddleQ: () => fitRiddleQ(), dvFill: () => dvFillFrac
  };

  // v19 debug hook, OFF unless the page is opened with ?debug (screenshots / quick checks): jump the road to the first stop
  // matching `want` (a type, enemy, npc or id, e.g. "mega", "frank", "toad") with `looks` = follower skins (1-5) in the party.
  if (/[?&]debug\b/.test(location.search)) window.__km.debugJump = (want, looks = []) => {
    const i = S.stops.findIndex(st => [st.type, st.enemy, st.npc, st.id, st.rest].includes(want)); if (i < 0) return false;
    hush(); S.runId = S.runId || "run-debug"; S.name = S.name === "Nobody" ? "Magnus" : S.name;
    const party = [newMember("hero", slotX(0))].concat(looks.map((k, j) => Object.assign(followerFrom(D.recruitPool[j % D.recruitPool.length], slotX(j + 1), k), { skin: k })));
    applyCore(Object.assign(core(), { stop: i, party, hp: HPM() * party.length, hunters: 0 })); S.mode = "walk"; musicScene("walk"); renderWalk(); return S.stops[i];
  };

  (async function boot() {
    if(sketch){
      applyLayout();
      KM.Assets.preloadGlyphs();
      MU.settings({muted:true,volume:D.music.volume});
      MU.onChange(()=>renderHUD());
      try {
        await Promise.all([sketch.load(),KM.Audio.init()]);
        S.party=[newMember('hero',slotX(0))];S.name='Pilgrim';S.hp=maxHp();buildWorld(0);
        sketchPage('sketchTitle');renderHUD();requestAnimationFrame(frame);
        await KM.Loader.ready();
      } catch(err) {
        console.error(err);showPanel('<div class="center">The sketchbook could not load. Reload to try again.</div>','info');
      } finally { KM.Loader.finish();skinStrip(); }
      return;
    }
    KM.Assets.preloadGlyphs(); KM.DragonApproach.preload();
    if(KM.Loader&&document.fonts&&document.fonts.ready)KM.Loader.hold(document.fonts.ready); // the bar waits for the fonts too
    KM.Palette.preload().forEach(im=>KM.Loader&&KM.Loader.want(im));
    for(const file of ["v22/villager-walk.png","v22/villager_sword-walk.png","v22/villager_armour-walk.png"]){const starterArt=KM.Assets.loadImg("assets/villager-start/"+file);if(KM.Loader)KM.Loader.want(starterArt);} applyLayout();
    const ms = KM.Save.musicSettings(); MU.settings({ volume: ms.volume == null ? D.music.volume : ms.volume, muted: ms.muted });
    if (D.music.startOn) MU.setMuted(false); // Magnus 2026-11-08: music plays from the start (browsers wait for the first click/key)
    KM.Save.saveMusic(MU.settings()); // remember the start state
    MU.onChange(m => { KM.Save.saveMusic(m); renderHUD(); });
    if (ART7) { const ext=KM_ART7.scenes["tavern-exterior"];
      [ext.facadeCrop.img,ext.doorBackingCrop.img].forEach(p=>{const im=KM.RestView.img(p); if(KM.Loader) KM.Loader.want(im);});
    }
    KM.TavernPOV.preload().forEach(im=>KM.Loader&&KM.Loader.want(im)); KM.RoadCamp.preload();
    KM.HollowWood?.preload().forEach(im=>{if(S.chapter==="hollowwood"&&KM.Loader)KM.Loader.want(im);});
    if(KM.Tomb?.requested())KM.Tomb.preload().forEach(im=>KM.Loader&&KM.Loader.want(im));
    if (ART7) KM.Scenery.preload(); // v12f: road / title art first (KM.Loader); the rest views stream in after the bar
    MU.preload(); // v12r: the title + first road music load with the bar (KM_DATA.music.preload)
    await Promise.all([KM.Assets.loadPacks(KM_ART.packs), KM.Audio.init()]);
    if(KM.Loader&&A.warm)KM.Loader.hold(A.warm((D.preload||{}).sfx||[],(D.preload||{}).sfxWaitMs)); // combat sounds buffer with the bar
    skinStrip(); setTimeout(skinStrip, 600);
    if(KM.Tomb?.requested()){
      await KM.Loader.ready();startTomb();requestAnimationFrame(frame);KM.Loader.finish();skinStrip();return;
    }
    showTitle();
    if (PREVIEW && PREVIEW !== "start") {
      const want = D.enemies[PREVIEW] ? PREVIEW : PREVIEW==='hollowwood'?'campsite':PREVIEW==='opening'?S.stops[0].enemy:PREVIEW==='squirrel-pack'?'squirrel-pack':PREVIEW.startsWith("camp") ? "campsite" : PREVIEW.startsWith("tavern") ? "tavern" : PREVIEW === "shop" ? "shop" : PREVIEW === "ogre" ? "ogre" : PREVIEW === "boss" ? "mega" : ["riddle","riddle-left","riddle-far","wizard-riddle","bubbles"].includes(PREVIEW) ? "riddle" : PREVIEW === "frank" ? "recruit_frank" : ["heal-locked","roles","twins","priests","armour","graveyard","formation","score","score-win","wizard","jp-word","knight-hand","fellowship"].includes(PREVIEW) ? "goblin" : "frank";
      __km.debugJump(want, PREVIEW === "dragon" ? [1, 2] : []);
      if(PREVIEW.startsWith('wizard'))S.party.push(followerFrom(D.companions.darkWizard,slotX(1)));
      if(PREVIEW==='jp-word')S.party.push(followerFrom(D.companions.timmy,slotX(1)));
      if (PREVIEW === "dragon") S.party.push(followerFrom(D.companions.frank, slotX(3)));
      if(PREVIEW==='hollowwood'){for(const id of ['frank','timmy'])S.party.push(followerFrom(D.companions[id],slotX(S.party.length)));S.party[0].weapon=1;S.party[0].armor=1;S.gold=10;}
      if(PREVIEW==='fellowship' && isFellowship()){for(const id of ['frank','timmy','darkWizard'])S.party.push(followerFrom(D.companions[id],slotX(S.party.length)));S.party[0].weapon=1;S.gold=25;}
      if(PREVIEW==='knight-hand' && isKnight()){S.party[0].origin="villager";for(const id of ["frank","timmy"])S.party.push(followerFrom(D.companions[id],slotX(S.party.length)));S.spells=1;}
      if(PREVIEW==='squirrel-pack'){
        S.party[0].origin='villager';
        S.actors.filter(a=>a.stop===S.stop && a.foe).forEach(a=>{a.active=true;a.x=a.homeX;a.state='idle';});
      }
      if(PREVIEW==='armour'){S.party[0].armor=2;}
      if(PREVIEW==='roles'||PREVIEW==='formation'){for(const id of ['frank','timmy','executioner'])S.party.push(followerFrom(D.companions[id],slotX(S.party.length)));S.spells=1;}
      if(PREVIEW==='priests')for(let i=0;i<3;i++)S.party.push(followerFrom({...D.companions.frank,companionId:'priest-'+i,name:i?'Brother '+i:D.companions.frank.name},slotX(S.party.length)));
      if(PREVIEW==='twins')for(let i=0;i<2;i++)S.party.push(followerFrom(D.recruitPool[i],slotX(S.party.length),i+1));
      S.party.forEach((m, i) => { m.sx = slotX(i); }); S.hp = maxHp();
      if (PREVIEW === "heal-locked" || PREVIEW === "campwounded") S.hp = 1;
      if(PREVIEW==='formation'){
        __km.forceGroup(['goblin','killer_rabbit','goblin']);
        S.party[0].armor=1;S.party[1].armor=1;
        S.actors.filter(a=>a.stop===S.stop&&a.foe).forEach(a=>{a.active=true;a.state='idle';a.x=a.homeX;});
      }
      const st = S.stops[S.stop]; S.camX = haltCam(st);
      const a = S.actors.find(a => a.stop === S.stop && a.main);
      if (a) { a.active = true; a.state = "idle"; a.x = a.homeX || st.stopX; if(PREVIEW==='riddle-left')a.riddleVariant=1;if(PREVIEW==='riddle-far')a.riddleVariant=2; }
      if(PREVIEW.endsWith("approach")){S.camX-=1800;S.mode="walk";renderWalk();}else engage(st,a);
      if(['wizard','knight-hand','squirrel-pack'].includes(PREVIEW)){commit();}
      if(PREVIEW==='jp-word'){commit();later(.8,pickFire);}
      if(PREVIEW==='tavern-wizard'){st.cands[0]={...D.companions.darkWizard};goInside();}
      if(PREVIEW==='graveyard'){
        S.companionGraves=[];
        for(let i=0;i<12;i++){const d={chapter:S.chapter,deathId:'preview-'+i,name:'Fallen companion '+i,x:S.camX,wx:S.camX};Object.assign(d,KM.CompanionGraves.place(d,S.companionGraves));S.companionGraves.push(d);}
        S.enc=null;S.mode='review';S.actors.forEach(a=>a.active=false);hush();showPanel('<div class="center">Companion graveyard · 12 deaths in the same area</div>','rest');
      }
      if(PREVIEW==="shop"){S.gold=60;renderRest();}
      if(PREVIEW==='score'||PREVIEW==='score-win'){
        S.score=27;S.scoreLedger={answers:[2,3,2,3],riddles:[1,2],scrolls:2,penalty:4};S.dist=4100;S.enc=null;
        S.actors.filter(a=>a.foe).forEach(a=>a.active=false);
        if(PREVIEW==='score'){S.hp=0;S.party[0].dying={t:10};renderHUD();}
        if(PREVIEW==='score-win')showWin();else gameOver('goblin',st);
      }
      if (PREVIEW === 'bubbles') {
        hush();speak(S.party[0], 'Go on, then.', {hold:true});
        if(a)speak(a, 'A riddle for you.', {hold:true});
      }
    }
    if(PREVIEW === "start")newGame();
    requestAnimationFrame(frame);
    if (KM.Loader) { await KM.Loader.ready(); KM.Loader.finish(); skinStrip(); }
    KM.RoadCamp.preload(); KM.TavernPOV.preload();
    KM.FireFx.preload(); KM.Spelling.preload(); // v12k: after the bar
  })();
})();
