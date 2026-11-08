// Pause menu (switch pauseMenu, ?pausemenu=1): off by default; music on/off lives there; the stage's music button + distance flag hide.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),ctx={};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(read('src/data/balance_try.js'),ctx);assert.equal(ctx.KM_DATA.balanceTry.pauseMenu,false,'off by default');
assert.match(read('src/engine/balance-try.js'),/pauseMenu: flag\('pauseMenu', 'pausemenu'\)/);
const g=read('src/game.js');
assert.match(g,/pm \? `<button class="pause-btn"/,'switch on: a pause button instead of the music button');
assert.match(g,/\$\{pm \? '' : `<span class="dist"/,'switch on: no distance flag');
assert.match(g,/if \(!paused\) update\(dt\)/,'paused = the world stops');
assert.match(g,/pauseMusic: \(\) => \{ MU\.toggleMute\(\)/,'the menu toggles the same saved music setting');
const ja=read('src/i18n/ja.js');for(const s of ['Pause','Paused','Resume','Music: On','Music: Off'])assert(ja.includes(JSON.stringify(s)+':'),'ja: '+s);
console.log('PASS: pause menu: off by default, pause button replaces music button + flag, world stops, music toggle, ja.');
