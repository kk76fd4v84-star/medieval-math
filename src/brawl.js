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
      Object.assign(a, { ghost: true, recolor: img => paint(img, a.id), label: m.name ? ctx.shortName(m.name) : a.label, combat: { hp: F.hpPerAnswer * (2 + b.step), atk: F.atk } }); });
  }
  function teamHud() { // the facing team's hearts, for the game's own hearts row (mirrored): members, hp left in heart units, armour
    const S = ctx?.S, e = S?.enc, b = e?.st?.brawl, rec = b && ghost(b.ghost); if (!rec) return null;
    const foes = S.actors.filter(a => a.stop === S.stop && a.ghost && !a.hidden); if (!foes.length) return null;
    const members = team(rec), PA = KM.PartyAbilities, max = members.reduce((n, m) => n + PA.life(m), 0);
    const left = foes.reduce((n, a) => n + (a.maxHp ? Math.max(0, a.hp) / a.maxHp : 1), 0) / foes.length;
    return { members, hp: Math.ceil(max * left - 1e-9), armour: members.reduce((n, m) => n + (m.armour || 0), 0), label: sir(rec.name), ...D().hud };
  }

  // ---- the ghost look: black cloth, orange details. One recolour per sprite image and look, cached (never per frame).
  const looks = new Map(); // look (JSON) -> WeakMap(image -> canvas)
  function hsl(r, g, b) {
    const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2, c = mx - mn; if (!c) return [0, 0, l];
    const h = mx === r / 255 ? ((g - b) / 255 / c + 6) % 6 : mx === g / 255 ? (b - r) / 255 / c + 2 : (r - g) / 255 / c + 4;
    return [h * 60, c / (1 - Math.abs(2 * l - 1)), l];
  }
  const inside = (v, [lo, hi]) => v >= lo && v <= hi;
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  function holes(kind, w, h, reach) { // dark pixels with dye on all four sides within reach (an emblem sewn on the dye)
    const near = new Uint8Array(w * h), scan = (n, step, start, len) => { let last = -1e9;
      for (let k = 0; k < len; k++) { const i = start + k * step; if (kind[i] === 2) last = k; else if (kind[i] === 3 && k - last <= reach) near[i]++; } };
    for (let y = 0; y < h; y++) { scan(0, 1, y * w, w); scan(0, -1, y * w + w - 1, w); }
    for (let x = 0; x < w; x++) { scan(0, w, x, h); scan(0, -w, x + (h - 1) * w, h); }
    near.forEach((n, i) => { if (n === 4) kind[i] = 4; });
  }
  function paint(img, art) {
    const P = D().paint, look = P.sprites[art] || P.sprites.default, key = JSON.stringify(look);
    const memo = looks.get(key) || looks.set(key, new WeakMap()).get(key); if (memo.has(img)) return memo.get(img);
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height; if (!w || !h) return null;
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    let d; try { d = g.getImageData(0, 0, w, h); } catch (_) { memo.set(img, null); return null; } // a tainted image (file://) keeps its colours
    const px = d.data, kind = new Uint8Array(w * h), L = new Float32Array(w * h); // kind: 1 cloth, 2 dye, 3 ink, 4 emblem
    for (let i = 0; i < kind.length; i++) { if (!px[i * 4 + 3]) continue; const [hh, ss, ll] = hsl(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]); L[i] = ll;
      kind[i] = ll < P.ink ? 3 : inside(hh, P.dye.h) && inside(ss, P.dye.s) && inside(ll, P.dye.l) ? 2 : inside(hh, P.cloth.h) && inside(ss, P.cloth.s) && inside(ll, P.cloth.l) ? 1 : 0; }
    if (look.holes) holes(kind, w, h, P.holes);
    const to = { cloth: look.cloth, dye: look.dye, ink: 'keep', emblem: look.holes || 'keep' }, names = [null, 'cloth', 'dye', 'ink', 'emblem'];
    const ends = { black: P.black.map(rgb), orange: P.orange.map(rgb) };
    for (let i = 0; i < kind.length; i++) { const tgt = kind[i] && ends[to[names[kind[i]]]]; if (!tgt) continue;
      const t = kind[i] === 4 ? 0.45 + L[i] : Math.min(1, Math.max(0, (L[i] - 0.25) / 0.6));
      for (let k = 0; k < 3; k++) px[i * 4 + k] = Math.round(tgt[0][k] + (tgt[1][k] - tgt[0][k]) * t); }
    g.putImageData(d, 0, 0); Object.assign(c, { naturalWidth: w, naturalHeight: h, src: img.src, _ok: true }); memo.set(img, c); return c;
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
  const init = c => { ctx = c; if (!on()) return; artIds().forEach(id => { KM_DATA.combat.patterns[id] ||= { deadline: true }; }); }; // ghosts strike when their bar fills

  return { on, init, route, dress, meet, team: teamHud, secs, answered, won, runEnd, actions, pool, opponent, replay, skill, seedRecord, members: team };
})();
