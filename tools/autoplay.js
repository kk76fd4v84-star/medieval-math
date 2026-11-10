// Watch a full Fellowship run play itself in a visible browser window.
// It reads the game state from window.__km (?debug) and plays like a player: real key presses for sums,
// real clicks on the buttons. Taverns, fare, recruits, shops, cards, traps, rivals, the Bell, all chapters.
//
// Setup (once):  npm i -D playwright && npx playwright install chromium
// Run:           python3 -m http.server 8798      (in this folder, in another Terminal tab)
//                node tools/autoplay.js
// Options:       --fast          no thinking pauses
//                --wrong=0.1     share of deliberate wrong answers (default 0.08, never when low on hearts)
//                --minutes=60    stop after this long
//                --url=...       another address (default: localhost:8798 with every Fellowship switch on)
//                --headless      no window (for quick checks)
// Log: tools/autoplay.log (every action, every error). Close the window to end early.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : d; };
const SW = 'curve=1&halfhearts=1&camparmour=1&whoacts=1&cards=1&gradual=1&meterpressure=1&castbar=1&knightstart=1&chestcards=1&toughfoes=1&brawl=1&pausemenu=1&juice=1&recruitcode=1&partylevels=1&cardsv2=1&traps=1';
const URL = arg('url', `http://localhost:8798/index.html?debug&mode=fellowship&${SW}`), FAST = !!arg('fast', false), WRONG = +arg('wrong', 0.08), MINUTES = +arg('minutes', 60);
const LOG = path.join(__dirname, 'autoplay.log'); fs.writeFileSync(LOG, '');
const out = s => { const l = `${new Date().toTimeString().slice(0, 8)} ${s}`; fs.appendFileSync(LOG, l + '\n'); console.log(l); };
const pause = ms => new Promise(r => setTimeout(r, FAST ? Math.min(ms, 300) : ms));

(async () => {
  const b = await chromium.launch({ headless: !!arg('headless', false), args: ['--window-size=1440,860'] });
  const p = await b.newPage({ viewport: null });
  const seen = new Set(); const issue = (k, m) => { const key = k + m.slice(0, 160); if (seen.has(key)) return; seen.add(key); out(`!! ${k}: ${m}`); };
  p.on('pageerror', e => issue('PAGE ERROR', e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error' || /missing image/.test(m.text())) issue('CONSOLE', m.text()); });
  p.on('response', r => { if (r.status() >= 400) issue('HTTP ' + r.status(), r.url()); });
  let closed = false; p.on('close', () => { closed = true; });
  try { await p.goto(URL); } catch (e) { out(`Could not open ${URL}. Is the server running? (python3 -m http.server 8798)`); await b.close(); return; }
  out('Loading...'); await p.waitForFunction(() => window.__km && __km.mode() === 'title' && document.querySelector('#newGameBtn'), null, { timeout: 180000 }).catch(() => {});

  const st = () => p.evaluate(() => {
    const k = __km, S = k.S, e = S.enc, vis = x => !x.disabled && x.offsetParent;
    const btns = [...document.querySelectorAll('#panel button, [role=dialog] button')].filter(vis).map(x => ({ act: x.dataset.act || '', txt: x.innerText.trim().replace(/\s+/g, ' ').slice(0, 40), i: x.dataset.i, j: x.dataset.j, id: x.dataset.id, kind: x.dataset.kind, item: x.dataset.item, k: x.dataset.k }));
    const foes = e && S.actors ? S.actors.filter(a => a.foe && !a.dead && a.stop === S.stop && !a.hidden).map(a => `${a.id} ${a.hp == null ? '?' : Math.round(a.hp)}/${a.maxHp ?? '?'}`) : [];
    return { mode: k.mode(), phase: k.phase(), view: S.view && S.view.id, stop: S.stop, n: S.stops.length, chapter: S.chapter,
      type: e && e.st ? `${e.st.type}:${e.st.enemy || e.st.rest || e.st.id || ''}` : '', hp: S.hp, max: k.maxHp(), gold: S.gold,
      party: S.party.map(m => `${(m.name || m.id).replace(/^Sir /, '').split(' ')[0]}${m.dead ? '(dead)' : ''}`).join(', '),
      ans: k.answer(), sum: e && e.problem ? e.problem.text : null, riddle: e && e.riddle ? e.riddle.answer : null, riddleQ: e && e.riddle ? e.riddle.q : '',
      btns, input: !!document.querySelector('#nameInput, #panel input'), foes, panel: (document.getElementById('panel').innerText || '').replace(/\s+/g, ' ').slice(0, 140) };
  }).catch(e => ({ err: e.message.split('\n')[0] }));
  const click = async (bt, why) => {
    out(`   > ${bt.txt || bt.act}${why ? '  (' + why + ')' : ''}`);
    const sel = `button[data-act="${bt.act}"]` + ['i', 'j', 'id', 'kind', 'item', 'k'].filter(a => bt[a] != null).map(a => `[data-${a}="${bt[a]}"]`).join('');
    await p.locator(sel).filter({ visible: true }).first().click({ timeout: 3000 }).catch(e => issue('CLICK', `${sel}: ${e.message.split('\n')[0]}`));
    await pause(900);
  };

  const t0 = Date.now(), done = {}; let lastType = '', lastParty = '', last = '', same = 0, answered = 0, cool = 0, replaced = false, stopKey = '';
  const once = k => { const key = stopKey + '|' + k; if (done[key]) return false; return (done[key] = true); };
  const times = k => { const key = stopKey + '|#' + k; return (done[key] = (done[key] || 0) + 1); };
  while (!closed && Date.now() - t0 < MINUTES * 60000) {
    const s = await st(); if (closed) break; if (s.err) { await pause(800); continue; }
    stopKey = `${s.chapter}:${s.stop}`;
    if (s.type && s.type !== lastType) { lastType = s.type; out(`== ${s.chapter} stop ${s.stop + 1}/${s.n}: ${s.type}   hearts ${s.hp}/${s.max}  gold ${s.gold}${s.foes.length ? '  foes ' + s.foes.join(', ') : ''}`); }
    if (s.party !== lastParty) { out(`   party: ${s.party}`); lastParty = s.party; }
    const sig = JSON.stringify([s.mode, s.phase, s.view, s.btns.map(x => x.act + x.txt), s.panel, s.sum]);
    if (sig === last) { if (++same === 60) issue('STUCK?', JSON.stringify({ mode: s.mode, phase: s.phase, type: s.type, buttons: s.btns.map(x => x.act), panel: s.panel })); } else { same = 0; last = sig; }
    if (s.mode === 'gameover' || s.mode === 'win') { out(`## ${s.mode === 'win' ? 'VICTORY' : 'GAME OVER'}  ${s.chapter} stop ${s.stop + 1}/${s.n}  party: ${s.party}  ${s.panel}`); break; }
    const has = a => s.btns.find(x => x.act === a), all = a => s.btns.filter(x => x.act === a);
    try {
      if (s.mode === 'title') { await p.locator('#newGameBtn').click(); out('   > New game'); await pause(1200); continue; }
      if (s.mode === 'name' || (s.input && !s.phase)) { await pause(600); await p.keyboard.type('Sir Bot', { delay: 110 }); await p.keyboard.press('Enter'); out('   > named the hero'); await pause(1200); continue; }
      if (has('closeTutorial')) { await pause(1800); await click(has('closeTutorial'), 'tip'); continue; }
      if (s.phase === 'math' && s.ans != null) {
        const code = /^\d{6}$/.test(String(s.ans)) && !/[+−×÷-]/.test(s.sum || '');
        const wrong = !code && answered > 4 && s.hp > s.max / 2 && cool <= 0 && Math.random() < WRONG;
        await pause(code ? 300 : 700 + Math.random() * 1200);
        const v = wrong ? String(+s.ans + 1) : String(s.ans);
        await p.keyboard.type(v, { delay: code ? 90 : 160 }); await p.keyboard.press('Enter');
        out(`   ${s.sum} = ${v}${wrong ? '   (wrong on purpose)' : ''}`); answered++; cool = wrong ? 4 : cool - 1;
        await pause(1500); continue;
      }
      if (s.phase === 'riddle' && s.riddle != null) { await pause(2200); out(`   riddle: ${s.riddleQ}`); await click({ act: 'answer', i: String(s.riddle), txt: 'answer' }); await pause(1200); continue; }
      if (s.mode === 'chapter') { await pause(2500); const c = has('enterWood') || has('enterChapter') || s.btns[0]; if (c) await click(c, 'next chapter'); await pause(3000); continue; }
      if (!s.btns.length) { await pause(500); continue; }
      // dialogs
      if (has('takeCard')) { const cs = all('takeCard'); await pause(2000); await click(cs[Math.floor(Math.random() * cs.length)], 'upgrade card'); continue; }
      if (has('assignGear')) { const g = all('assignGear'); await click(g[Math.floor(Math.random() * g.length)], 'who gets it'); continue; }
      if (has('tvAskYes')) { await click(has('tvAskYes')); continue; }
      if (has('replaceMember')) { if (!replaced) { replaced = true; await click(all('replaceMember')[0], 'make room for the recruit'); } else if (has('keepParty')) await click(has('keepParty'), 'keep the party'); continue; }
      if (has('awakenBell')) { await pause(1500); await click(has('awakenBell'), 'wake the Bell (hard fight)'); continue; }
      if (has('brawlIgnore') || has('brawlFlee')) { await pause(1500); await click(has('commit'), 'fight the rival');
        await p.waitForFunction(() => !document.querySelector('button[data-act="brawlIgnore"],button[data-act="brawlFlee"]'), null, { timeout: 6000 }).catch(() => {}); continue; }
      if (has('frankAgree')) { await click(has('frankAgree')); continue; }
      if (has('contest')) { await click(has('contest')); continue; }
      if (has('roll')) { await click(has('roll')); continue; }
      if (has('recruitSum')) { await click(has('recruitSum'), 'recruit'); continue; }
      // tavern
      if (has('goInside') && once('inside')) { await click(has('goInside')); await pause(1800); continue; }
      if (s.view === 'tavern-interior') {
        const fare = all('buyFare').find(x => once('fare' + x.item)); if (fare) { await click(fare, `gold ${s.gold}`); continue; }
        if (has('selectTavern') && once('menu')) { await click(has('selectTavern'), 'look at the menu'); continue; }
        if (has('tvAsk') && once('ask')) { await click(all('tvAsk')[0], 'ask to join'); continue; }
        if (has('leaveInside')) { await click(has('leaveInside')); await pause(1500); continue; }
      }
      // camps and shops
      if (s.phase === 'rest') {
        if (has('openCards') && once('cards')) { await click(has('openCards')); continue; }
        if (all('restHeal').length && s.hp < s.max && times('heal') <= 2) { await click(all('restHeal')[0], `hearts ${s.hp}/${s.max}`); continue; }
        if (has('chooseGear') && times('gear') <= 3) { const g = all('chooseGear'); await click(g.find(x => x.kind === 'weapon') || g[0], `gold ${s.gold}`); continue; }
        if (has('buyMeterGear') && times('meter') <= 2) { await click(has('buyMeterGear'), `gold ${s.gold}`); continue; }
        if (has('restRecruit') && once('recruit')) { await click(has('restRecruit'), 'recruit'); continue; }
        if (has('leaveRest')) { await click(has('leaveRest')); continue; }
      }
      if (has('leaveRest')) { await click(has('leaveRest'), 'walk on'); continue; }
      if (has('commit')) { await click(has('commit')); continue; }
      if (has('closeCards')) { await click(has('closeCards')); continue; }
      const other = s.btns.find(x => !/leaderboard|language|toggleMusic|sacrifice|brawlSacrifice|brawlFlee|retry|newGame|openPause|pauseMusic|knightScroll|tvAskNo|cancelGear|keepParty|avoid/.test(x.act));
      if (other) await click(other);
    } catch (e) { if (!closed) issue('BOT', e.message.split('\n')[0]); }
    await pause(500);
  }
  out(`Done after ${((Date.now() - t0) / 60000).toFixed(1)} min, ${answered} sums. Log: ${LOG}`);
  if (!closed && !arg('headless', false)) { out('Close the window when you are done looking.'); await new Promise(r => p.on('close', r)); }
  await b.close().catch(() => {});
})();
