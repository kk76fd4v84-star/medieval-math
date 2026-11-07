// Versioned localStorage saves with forward migrations. Never wipes progress on update.
window.KM = window.KM || {};
KM.Save = (function () {
  const KEY = "knightMath.save";
  let selectedMode="math";
  const runKey=()=>selectedMode==="math"?KEY:KEY+"."+selectedMode;
  function selectMode(mode){selectedMode=["knight","fellowship"].includes(mode)?mode:"math";}
  const VERSION = 7;
  // migrations[n] upgrades a save from version n to n+1. Add new ones, never edit old ones.
  const migrations = {
    1: s => { // v1 stored `hearts` and party as array of ids
      s.hp = s.hearts; delete s.hearts;
      s.party = (s.party || []).map(id => (typeof id === "string" ? { id, weapon: 0, armor: 0 } : id));
      s.checkpoint = s.checkpoint || null;
      s.stats = s.stats || { correct: 0, wrong: 0, riddles: 0, sacrificed: 0 };
      return s;
    },
    2: s => { // v2 -> v3: road gained rest stops; party members became full follower records; journey distance
      const OLD = ["math", "recruit", "riddle", "math", "camp", "boss", "recruit", "riddle", "math", "recruit", "riddle", "math", "camp", "mega"];
      const NAMES = { sir_rustalot: "Sir Rustalot", sir_mildew: "Sir Mildew", dame_soggybottom: "Dame Soggybottom" };
      const up = c => {
        if (!c) return c;
        const battles = OLD.slice(0, c.stop || 0).filter(t => t === "math" || t === "boss").length;
        c.stop = KM.Road.indexAfterBattles(battles);
        c.party = (c.party || []).map((m, i) => {
          if (m.id === "hero") return { id: "hero", kind: "hero", base: KM_DATA.party.heroBase, weapon: m.weapon || 0, armor: m.armor || 0 };
          const p = KM_DATA.recruitPool.find(r => r.name === NAMES[m.id]) || KM_DATA.recruitPool[i % KM_DATA.recruitPool.length];
          return { id: "f" + i, kind: "follower", name: p.name, base: p.base, look: p.look, trait: p.trait, sacrifice: p.sacrifice, weapon: m.weapon || 0, armor: m.armor || 0 };
        });
        c.dist = c.dist || 0;
        return c;
      };
      up(s); if (s.checkpoint) up(s.checkpoint);
      return s;
    },
    3: s => { // v3 -> v4 (game v7): party max 4 incl. the hero; companion skins; hunters; road gained a special stop
      const OLD = KM_DATA.encounters.filter(e => e.type !== "special"); // the v6 road had no special stop
      const R = KM_DATA.restStops;
      const oldRoad = []; let b = 0, rest = 0;
      OLD.forEach((e, i) => { oldRoad.push(e); if ((e.type === "math" || e.type === "boss") && ++b % (R.every || 1) === 0 && i < OLD.length - 1) { oldRoad.push({ type: "rest" }); rest++; } });
      const up = c => {
        if (!c) return c;
        const battles = oldRoad.slice(0, c.stop || 0).filter(t => t.type === "math" || t.type === "boss").length;
        c.stop = KM.Road.indexAfterBattles(battles);
        const hero = (c.party || []).filter(m => m.id === "hero"), fol = (c.party || []).filter(m => m.id !== "hero");
        c.leftParty = fol.slice(KM_DATA.party.maxFollowers).map(m => m.name);  // PROVISIONAL: extra followers go home
        c.party = hero.concat(fol.slice(0, KM_DATA.party.maxFollowers).map((m, i) => Object.assign(m, { skin: i + 1 })));
        c.hunters = c.hunters || 0;
        return c;
      };
      up(s); if (s.checkpoint) up(s.checkpoint);
      return s;
    },
    4: s => { // v4 -> v5 (game v11): Spell of Stupidity scrolls (start amount) + sums left on an active spell
      const up = c => { if (!c) return c; if (c.spells == null) c.spells = (window.KM_DATA && KM_DATA.spell ? KM_DATA.spell.start : 1); c.spellLeft = c.spellLeft || 0; return c; };
      up(s); if (s.checkpoint) up(s.checkpoint);
      return s;
    },
    5: s => { // v5 -> v6 (game v11b): 2 hearts per party member (was 6 + armour). Progress kept; hearts refilled to the new max
      const hpm = (window.KM_DATA && KM_DATA.party && KM_DATA.party.heartsPerMember) || 2;
      const up = c => { if (!c) return c; c.hp = hpm * Math.max(1, (c.party || []).length); return c; };
      up(s); if (s.checkpoint) up(s.checkpoint);
      return s;
    },
    6: s => { // v6 -> v7 (game v11b tavern): mead bought for the next battle (0 none, 1 waiting); Ale is gone
      const up = c => { if (!c) return c; c.mead = c.mead ? 1 : 0; return c; };
      up(s); if (s.checkpoint) up(s.checkpoint);
      return s;
    }
  };
  function migrate(s) {
    if (!s || typeof s !== "object") return null;
    let v = s.version || 1;
    while (v < VERSION) {
      if (!migrations[v]) { console.info("[save] no migration from", v); return null; }
      s = migrations[v](s); v++; s.version = v;
    }
    return s;
  }
  function load() {
    try {
      const raw = localStorage.getItem(runKey()); if (!raw) return null;
      const s = migrate(JSON.parse(raw));
      if (s) localStorage.setItem(runKey(), JSON.stringify(s));
      return s;
    } catch (e) { console.info("[save] unreadable save kept as backup"); try { localStorage.setItem(runKey() + ".bak", localStorage.getItem(runKey())); } catch (_) {} return null; }
  }
  function write(s) { s.version = VERSION; s.savedAt = Date.now(); try { localStorage.setItem(runKey(), JSON.stringify(s)); } catch (e) {} }
  function clear() { try { const raw = localStorage.getItem(runKey()); if (raw) localStorage.setItem(runKey() + ".prev", raw); localStorage.removeItem(runKey()); } catch (e) {} }

  // ---------- profile: survives new games, retries and clears (best journey + graves of past deaths) ----------
  // Own versioned schema + migrations, same rules as the run save.
  const PKEY = "knightMath.profile", PVERSION = 5, OLD_BEST = "knightMath.best";
  const pmigrations = {
    0: p => { // nothing stored yet / pre-profile builds: adopt the old standalone best-distance record
      let b = null; try { b = JSON.parse(localStorage.getItem(OLD_BEST)); } catch (e) {}
      return { best: b || null };
    },
    1: p => { p.deaths = Array.isArray(p.deaths) ? p.deaths : []; return p; }, // v1 -> v2: graves of past deaths
    2: p => { p.music = p.music || { volume: null, muted: false }; return p; },  // v2 -> v3: music volume / mute (null = data default)
    3: p => { // v3 -> v4: death records gain identity + killer + stable progress (GAME_DESIGN "PERSISTENT GRAVES")
      p.deaths = p.deaths.map((d, i) => Object.assign({ deathId: "legacy-" + i + "-" + (d.at || 0), runId: "legacy", route: "road-v6", progress: null, killer: "unknown", marker: "grave" }, d));
      return p;
    },
    4: p => { p.companionGraves = []; return p; }
  };
  function profile() {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(PKEY)); } catch (e) { p = null; }
    if (!p || typeof p !== "object") p = { version: 0 };
    let v = p.version || 0;
    const was = v;
    while (v < PVERSION) { p = pmigrations[v](p); v++; p.version = v; }
    if (was !== v) writeProfile(p);
    return p;
  }
  function writeProfile(p) { p.version = PVERSION; try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
  function unlock(id) { const p=profile();p.unlocks=p.unlocks||{};p.unlocks[id]=true;writeProfile(p); }
  function best() { return profile().best || null; }
  function recordBest(leagues, name) {
    const p = profile(), b = p.best;
    if (!b || leagues > b.leagues) { p.best = { leagues, name, at: Date.now() }; writeProfile(p); return true; }
    return false;
  }
  // death (v4): { deathId, runId, route, progress: { encounter: KM_DATA.encounters index, offset }, killer, marker,
  //               name, x (legacy camera px), leagues, at (ms) }. Only run-ending player deaths are recorded (PROVISIONAL).
  function deaths() { return profile().deaths.slice(); }
  function addDeath(d) {
    const p = profile(), max = (window.KM_DATA && KM_DATA.graves && KM_DATA.graves.max) || 20;
    p.deaths.push(d);
    while (p.deaths.length > max) { // drop the oldest, but never the furthest
      const far = p.deaths.reduce((a, b) => (b.x > a.x ? b : a));
      const i = p.deaths.findIndex(e => e !== far); p.deaths.splice(i, 1);
    }
    writeProfile(p); return p.deaths.length;
  }
  // Companions have their own markers; never consume the player's 20 memorial slots.
  function companionGraves() { return (profile().companionGraves || []).slice(); }
  function addCompanionGrave(d) {
    const p=profile();p.companionGraves=p.companionGraves||[];
    if(!p.companionGraves.some(g=>g.deathId===d.deathId))p.companionGraves.push(d);
    writeProfile(p);
  }
  function removeCompanionGrave(id) {
    const p=profile();p.companionGraves=(p.companionGraves||[]).filter(g=>g.deathId!==id);writeProfile(p);
  }
  function musicSettings() { return profile().music; }
  function saveMusic(m) { const p = profile(); p.music = { volume: m.volume, muted: !!m.muted }; writeProfile(p); }
  return { selectMode, runKey, unlock, companionGraves, addCompanionGrave, removeCompanionGrave, load, write, clear, migrate, best, recordBest, deaths, addDeath, profile, musicSettings, saveMusic, VERSION, KEY, PKEY, PVERSION };
})();
