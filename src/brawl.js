// Brawl mode (switch brawl, ?brawl=1): ghosts of recorded runs on the road. Data: src/data/brawl.js. Run format: docs/brawl_run_format.md.
// Pure parts (record, pool, opponent, replay, route) need no DOM. The game hands its helpers in once via init(ctx);
// every game hook is a one-line call that does nothing while the switch is off.
window.KM = window.KM || {};
KM.Brawl = (() => {
  const D = () => KM_DATA.brawl;
  let ctx = null, run = null; // game helpers; the run being recorded
  const on = () => !!(KM.BalanceTry && KM.BalanceTry.on('brawl'));

  // ---- storage + small helpers
  const store = () => (typeof localStorage === 'undefined' ? null : localStorage);
  const load = (k, d) => { try { const v = store()?.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } };
  const keep = (k, v) => { try { store()?.setItem(k, JSON.stringify(v)); } catch (_) {} };
  const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  const rng = seed => { let h = 1779033703; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 3432918353);
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; };
  const pick = (list, R = Math.random) => list[Math.floor(R() * list.length)];
  const opOf = text => String(text).match(/^\s*(\d+)\s*([+−×÷])\s*(\d+)/) || [];
  const rank = () => load(D().storage.rank, 0);
  const playerId = () => load(D().storage.player, null) || (keep(D().storage.player, 'p-' + Math.random().toString(36).slice(2, 10)), load(D().storage.player, ''));

  // ---- ghost records: skill, seeds in the same format, the ranked pool, matchmaking, replay
  const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[s.length >> 1] : Infinity; };
  function skill(rec) {
    const a = rec.answers || [], ok = a.filter(x => x.correct);
    return a.length && ok.length ? ok.length / a.length / (median(ok.map(x => x.ms)) / 1000) : 0;
  }
  function seedRecord(s, i) {
    const R = rng('seed:' + s.name), A = D().seedAnswers;
    const answer = op => ({ op, a: 0, b: 0, level: 'normal', ms: Math.round(s.secs * A.opSecs[op] * (1 + s.spread * (R() * 2 - 1)) * 1000), correct: R() < s.accuracy, outcome: null });
    return { v: 1, runId: 'seed-' + i, player: 'seed', name: s.name, build: 'seed', mode: 'fellowship', createdAt: '2026-11-08T00:00:00Z',
      party: s.party.map(role => ({ role })), gear: { weapon: 0, armour: 0, helm: 0, lantern: 0 },
      answers: A.ops.flatMap(op => Array.from({ length: A.each }, () => answer(op))), result: { area: 'village', depth: 0, bossesKilled: 0, died: true } };
  }
  const pool = (runs = load(D().storage.runs, [])) => D().seeds.map(seedRecord).concat(runs.filter(r => r && r.v === 1)).sort((x, y) => skill(x) - skill(y));
  const opponent = (list, at) => list[Math.min(list.length - 1, Math.max(0, at))];
  const ghost = id => pool().find(r => r.runId === id);
  function replay(rec) { // the ghost's answers for an operator, in recorded order, looping
    const seen = {};
    return op => { const own = rec.answers.filter(x => x.op === op), list = own.length ? own : rec.answers; if (!list.length) return null;
      seen[op] = (seen[op] ?? -1) + 1; return list[seen[op] % list.length]; };
  }

  // ---- recording (the run in progress -> localStorage at its end)
  function answered(e, right) {
    if (!on() || !e || !e.problem) return;
    const S = ctx.S, m = opOf(e.problem.text); if (!m.length) return;
    if (!run || run.runId !== S.runId) run = { v: 1, runId: S.runId, player: playerId(), name: S.name, build: document.querySelector('meta[name="km-build"]')?.content || '', mode: S.challengeMode, createdAt: new Date().toISOString(), answers: [], bosses: 0 };
    run.answers.push({ op: m[2], a: +m[1], b: +m[3], level: e.q?.level || null, ms: e.tmr ? Math.round(e.tmr.t * 1000) : null, correct: !!right, outcome: e.answerTiming?.grade || null });
  }
  function runEnd(S, died) {
    if (!on() || !run || run.runId !== S.runId || !run.answers.length) return;
    const party = S.party.map(m => ({ name: m.name, role: KM.PartyAbilities.role(m), art: ctx.artId(m), weapon: m.weapon || 0, armour: m.armor || 0 }));
    const top = k => Math.max(0, ...party.map(p => p[k]));
    const { bosses, ...rec } = run; run = null;
    Object.assign(rec, { party, gear: { weapon: top('weapon'), armour: top('armour'), helm: S.meterGear?.helm || 0, lantern: S.meterGear?.lantern || 0 }, result: { area: S.chapter, depth: S.stop, bossesKilled: bosses, died: !!died } });
    keep(D().storage.runs, load(D().storage.runs, []).concat([rec]).slice(-D().storage.keep));
  }

  // ---- the route: ghost stops between the ordinary ones (same seed = same road)
  function route(road, S) {
    if (!on()) return road;
    const r = D().route, R = rng('brawl:' + S.runId), list = pool(), out = []; let since = 0, n = 0;
    road.forEach((st, i) => { out.push(st); since++;
      if (i + 1 < r.from || since < r.gap || i >= road.length - 1) return;
      const roll = R(), kind = roll < r.ambush ? 'ambush' : roll < r.ambush + r.sighting ? 'sighting' : null;
      if (kind) { out.push(ghostStop(kind, opponent(list, rank() + n), rank() + n++)); since = 0; } });
    return out;
  }
  function team(rec) { // the ghost's party as members (leader first, at most 4): its recorded art, else art by role
    const A = D().art; let k = 0;
    return (rec.party.length ? rec.party : [{ role: 'knight' }]).slice(0, 4).map((p, i) =>
      ({ ...p, art: p.art || (i ? (A[p.role] && p.role !== 'knight' ? A[p.role] : A.knight[k++ % A.knight.length]) : A.leader), name: i ? p.name || '' : sir(rec.name) }));
  }
  function ghostStop(kind, rec, step) { // both kinds: the whole team stands on the road (a sighting asks first, an ambush offers a way out)
    const r = D().route, ids = team(rec).map(m => m.art);
    return { type: 'math', enemy: ids[0], group: ids.slice(1), level: r.level, gold: r.gold, gap: r.gapPx,
      id: 'brawl-' + kind + '-' + step, brawl: { kind, ghost: rec.runId, name: sir(rec.name), step } };
  }
  function dress(actors, stops) { // names + stats on the actors the game built for ghost stops (main actor = leader, extra k = member k)
    if (!on()) return;
    const F = D().foe;
    actors.forEach(a => { const b = stops[a.stop]?.brawl; if (!b || !a.foe) return; const m = team(ghost(b.ghost) || { party: [] })[a.extra || 0] || {};
      Object.assign(a, { ghost: true, sheet: img => sheet(img, a.id), label: m.name ? ctx.shortName(m.name) : a.label, combat: { hp: F.hpPerAnswer * (2 + b.step), atk: F.atk } }); });
  }
  function teamHud() { // the facing team's hearts, for the game's own hearts row (mirrored): members, hp left in heart units, armour
    const S = ctx?.S, e = S?.enc, b = e?.st?.brawl, rec = b && ghost(b.ghost); if (!rec) return null;
    const foes = S.actors.filter(a => a.stop === S.stop && a.ghost && !a.hidden); if (!foes.length) return null;
    const members = team(rec), PA = KM.PartyAbilities, max = members.reduce((n, m) => n + PA.life(m), 0);
    const left = foes.reduce((n, a) => n + (a.maxHp ? Math.max(0, a.hp) / a.maxHp : 1), 0) / foes.length;
    return { members, hp: Math.ceil(max * left - 1e-9), armour: members.reduce((n, m) => n + (m.armour || 0), 0), label: sir(rec.name), ...D().hud };
  }

  // ---- the ghost look: Maggi's sheets (KM_DATA.brawl.sheets) drawn instead of the art's own sheet; no sheet = the original
  const sheetOf = art => { const q = window.KM_ART7?.sequences?.[KM_ART.entities[art]?.seq?.idle]; return q && q.img; };
  function sheet(img, art) {
    const to = D().sheets[art], from = sheetOf(art); if (!to || !from || !decodeURI(img.src || '').endsWith(from)) return null;
    const g = KM.Assets.loadImg(to); return g._ok ? g : null;
  }

  // ---- encounters: sighting (Challenge / Ignore), ambush (Fight / Flee / Sacrifice), the ghost's answer clock
  const T = s => ctx.T(s), lines = () => D().lines;
  const sir = name => fill(D().lines.sir, { name: String(name || '').replace(/^Sir\s+/i, '') }); // the one place a ghost gets its title
  const speaker = () => ctx.S.party[1] || ctx.S.party[0];
  function dialog(title, cards) {
    return `<div class="gear-shade"><div class="gear-dialog action-gear" role="dialog" aria-modal="true"><div class="action-heading tavern-heading tavern-under">${ctx.esc(title)}</div><div class="action-row">${cards.join('')}</div></div></div>`;
  }
  function meet(e) { // sighting: Challenge / Ignore; ambush: Fight / Flee / Sacrifice
    const b = e.st.brawl; if (!b || e.brawlAsked) return false;
    const L = lines(), sight = b.kind === 'sighting', name = { ghost: b.name };
    e.brawlAsked = true; e.phase = 'approach'; ctx.say(speaker(), fill(pick(sight ? L.sighting : L.ambush), name));
    const cards = sight ? [ctx.actionCard({ label: L.challenge, act: 'commit', icon: '⚔' }), ctx.actionCard({ label: L.ignore, act: 'brawlIgnore', icon: '→' })]
      : [ctx.actionCard({ label: L.fight, act: 'commit', icon: '⚔' }), ctx.actionCard({ label: L.flee, act: 'brawlFlee', icon: '→', note: fill('{n} coins', { n: D().flee.cost }) }),
        ...ctx.S.party.slice(1).map((m, i) => ctx.actionCard({ label: fill(L.sacrifice, { name: ctx.shortName(m.name) }), act: 'brawlSacrifice', icon: '✝', attrs: `data-i="${i + 1}"` }))];
    ctx.showPanel(dialog(fill(T(sight ? L.sightingTitle : L.ambushTitle), name), cards), 'rest action-panel');
    return true;
  }
  function secs(e, base) { // the ghost answers this sum at its recorded time: the bar fills when it does (then it strikes)
    const b = e?.st?.brawl; if (!b || !e.revealed || !e.problem) return base;
    const op = opOf(e.problem.text)[2]; if (!op) return base;
    e.ghostNext = e.ghostNext || replay(ghost(b.ghost) || { answers: [] });
    const ans = e.ghostNext(op); if (!ans || !ans.correct) return base; // a wrong ghost answer: it only strikes at the usual full bar
    const R = D().replay; ctx.say(e.act, lines().thinking);
    return Math.min(base, Math.max(R.minSecs, Math.min(R.maxSecs, ans.ms / 1000)));
  }
  function won(st) {
    if (!on()) return;
    if (run && ['boss', 'mega'].includes(st.type)) run.bosses++;
    if (st.brawl) keep(D().storage.rank, rank() + 1); // beat this ghost: the next one is stronger
  }
  function leave(e) { ctx.S.actors.forEach(a => { if (a.stop === ctx.S.stop && a.foe) a.hidden = true; }); ctx.finish(); }
  const asked = () => { const e = ctx.S.enc; return e?.st.brawl && e.phase === 'approach' ? e : null; };
  const actions = {
    brawlIgnore: () => { const e = asked(); if (e) leave(e); },
    brawlFlee: () => { const e = asked(), S = ctx.S; if (!e) return;
      if (Math.random() >= D().flee.chance) { ctx.say(speaker(), lines().fleeFail); return ctx.commit(); }
      const coins = Math.min(S.gold, D().flee.cost); S.gold -= coins; ctx.renderHUD(); ctx.say(speaker(), fill(lines().fleeOk, { coins })); leave(e); },
    brawlSacrifice: btn => { const e = asked(), m = ctx.S.party[+btn.dataset.i]; if (!e || !m || m === ctx.S.party[0]) return;
      ctx.loseCompanion(m); leave(e); }
  };
  const artIds = () => Object.values(D().art).flat();
  const init = c => { ctx = c; if (!on()) return; artIds().forEach(id => { KM_DATA.combat.patterns[id] ||= { deadline: true }; }); // ghosts strike when their bar fills
    Object.values(D().sheets).forEach(src => KM.Assets.loadImg(src)); }; // the ghost sheets load with brawl on only

  return { on, init, route, dress, meet, team: teamHud, sheet, secs, answered, won, runEnd, actions, pool, opponent, replay, skill, seedRecord, members: team };
})();
