// Regression (Magnus: "it takes a while before I see if it is a plus minus or multiply mark, so the timer starts and
// I don't know what to calculate"): the bar loads + decodes every sum glyph, and the answer timer waits for them.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),Module=require('node:module'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
// ---- 1) KM.Assets with a fake Image: preload list + readiness
class FakeImage{constructor(){this.complete=false;this.naturalWidth=0;this.l={};}addEventListener(k,f){(this.l[k]=this.l[k]||[]).push(f);}
  set src(v){this._s=v;FakeImage.all.push(this);} get src(){return this._s?'http://x/'+this._s:'';} decode(){return Promise.resolve();}
  arrive(){this.complete=true;this.naturalWidth=10;this.onload&&this.onload();(this.l.load||[]).forEach(f=>f());}}
FakeImage.all=[];
const ctx={console,URLSearchParams,location:{search:'',href:'http://x/index.html',protocol:'http:'},Image:FakeImage,performance:{now:()=>0},setTimeout,
  document:{createElement:()=>({getContext:()=>null})}};ctx.window=ctx;vm.createContext(ctx);
const tags=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
for(const f of tags.filter(f=>/^src\/(config|data)\//.test(f)))try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});}catch(e){}
vm.runInContext(fs.readFileSync(path.join(root,'src/engine/assets.js'),'utf8'),ctx,{filename:'assets.js'});
const AS=ctx.KM.Assets,G=ctx.KM_ART.glyphs,files=AS.glyphFiles();
for(const k of ['op_plus','op_minus','op_times','op_divide','op_equals',...[0,1,2,3,4,5,6,7,8,9].map(d=>'digit_'+d)]){
  assert(G[k]&&G[k].img,k+' has a glyph');assert(files.includes(G[k].img),k+' preloaded');
  if(ctx.KM_ART10)assert(files.includes(ctx.KM_ART10.glyphInk[G[k].img]),k+' ink copy preloaded');}
for(const ch of Object.keys(ctx.KM_ALPHABET.w))assert(files.includes(ctx.KM_ALPHABET.dir+ch+'.png'),'letter '+ch);
for(const f of ctx.KM_DATA.preload.images)assert(files.includes(f));
assert.equal(AS.sumReady('7 + 2'),false,'nothing loaded yet');
(async()=>{
  const p=AS.preloadGlyphs();FakeImage.all.forEach(im=>im.arrive());await p;await new Promise(r=>setTimeout(r,0));
  assert.equal(AS.sumReady('7 + 2 − 3 × 4 ÷ 2 ='),true,'loaded and decoded');
  // ---- 2) the game: the timer does not run until the sum is ready, then starts one frame after it is drawn
  const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
   .replace("search:'?debug&notimer'","search:'?debug'").replace('submitAnswer};','submitAnswer,tickAnswerTimer,ask};');
  const body=harness+`
let ready=false,renders=0;scope.KM.Assets.sumReady=()=>ready;
reset();at('goblin');flush(1);g.ask('normal',noop,noop,noop);const T=S.enc.tmr;assert(T&&T.wait===true,'timer waits for glyphs');
g.tickAnswerTimer(1);g.tickAnswerTimer(1);assert.equal(T.t,0,'no time passes while glyphs load');
ready=true;g.tickAnswerTimer(1);assert.equal(T.wait,1);assert.equal(T.t,0,'drawn this frame');
g.tickAnswerTimer(1);assert.equal(T.wait,0);assert.equal(T.t,0);g.tickAnswerTimer(.5);assert.equal(T.t,.5,'then it runs');
g.ask('normal',noop,noop,noop);assert.equal(S.enc.tmr.wait,false,'ready glyphs: starts at once');g.tickAnswerTimer(.2);assert.equal(S.enc.tmr.t,.2);
console.log('PASS: every digit / operator / ink copy / letter / meter picture is in the preload list and decoded; the answer timer waits for the sum glyphs and starts the frame after they are drawn.');`;
  const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(body,__filename);
})().catch(e=>{console.error(e);process.exit(1);});
