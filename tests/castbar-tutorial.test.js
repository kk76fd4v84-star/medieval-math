// Cast bar tutorial (switch castBar): words in data, every icon a real timing-woodcut file, once per save, one button.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..'),ctx={};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'src/data/tutorial.js'),'utf8'),ctx);const t=ctx.KM_DATA.tutorial.castBar;
assert.equal(t.icons.map(r=>r.icon).join(),'block,crit,normal,weak','the four bar icons, left to right');
for(const r of t.icons){assert(fs.existsSync(path.join(root,'assets/timing-woodcut',r.icon+'.png')));assert(r.text.length<=40,'short line: '+r.text);}
assert(t.saveKey&&t.button&&t.title,'save key, one button, title');
const g=fs.readFileSync(path.join(root,'src/game.js'),'utf8');
assert.match(g,/const TUT = KM\.CastBar && KM\.CastBar\.on\(\)/,'only with the cast bar switch');
assert.match(g,/if \(TUT && !TUT\.seen\(\)\) return tutorial/,'shown before the first sum until seen');
const ja=fs.readFileSync(path.join(root,'src/i18n/ja.js'),'utf8');for(const s of [t.title,t.intro,t.button,...t.icons.map(r=>r.text)])assert(ja.includes(JSON.stringify(s)+':'),'ja: '+s);
console.log('PASS: cast bar tutorial: data words, real icons, once per save, behind castbar, ja.');
