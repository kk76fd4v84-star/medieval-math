// Magnus: "stuff is still not loaded". With KM_DATA.preload.all every image the game can show (the generated list) loads +
// decodes with the bar, the loader holds nothing back for after it, and every sound effect file is fetched with the bar.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(/src\/config\/preload_images\.js/.test(html),'image list loads with the page');
assert(html.indexOf('preload_images.js')<html.indexOf('src/engine/assets.js'),'before the asset loader');
assert(/<meta name="km-build" content="[^"]+">/.test(html),'build label');
// the generated list: real files, no music, the opening's enemies / portraits / scenery / cards are in it
const ctx0={};ctx0.window=ctx0;vm.createContext(ctx0);vm.runInContext(fs.readFileSync(path.join(root,'src/config/preload_images.js'),'utf8'),ctx0);
const list=ctx0.KM_PRELOAD_IMAGES;assert(Array.isArray(list)&&list.length>100,'list of '+list.length);
for(const f of list){assert(fs.existsSync(path.join(root,f.replace(/\?.*$/,''))),'exists: '+f);assert(!/\/music\//.test(f));}
assert.equal(new Set(list).size,list.length,'no duplicates');
// ---- loader + assets with a fake DOM / Image
class FakeImage{constructor(){this.complete=false;this.naturalWidth=0;this.l={};}addEventListener(k,f){(this.l[k]=this.l[k]||[]).push(f);}
  set src(v){this._s=v;FakeImage.all.push(this);} get src(){return this._s?'http://x/'+this._s:'';} decode(){return Promise.resolve();}
  arrive(){this.complete=true;this.naturalWidth=10;this.onload&&this.onload();(this.l.load||[]).forEach(f=>f());}}
FakeImage.all=[];
const el=()=>({style:{},classList:{add(){}},appendChild(){},insertAdjacentHTML(_,h){this.html=(this.html||'')+h;},addEventListener(){},querySelector:()=>({complete:false,naturalWidth:0,addEventListener(){},style:{},getContext:()=>null}),remove(){}});
const body=el();let ov;
const ctx={console,URLSearchParams,location:{search:'',href:'http://x/index.html',protocol:'http:'},Image:FakeImage,performance:{now:()=>Date.now()},setTimeout,localStorage:{getItem:()=>null},
  document:{createElement:()=>(ov=ov||el()),body,querySelector:q=>q.includes('km-build')?{content:'test-1'}:null}};ctx.window=ctx;vm.createContext(ctx);
const tags=[...html.matchAll(/<script src="([^"?]+)/g)].map(m=>m[1]);
for(const f of tags.filter(f=>/^src\/(config|data)\//.test(f)))try{vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});}catch(e){}
assert.equal(ctx.KM_DATA.preload.all,true,'all on');
vm.runInContext(fs.readFileSync(path.join(root,'src/engine/loader.js'),'utf8'),ctx,{filename:'loader.js'});
assert((ov.html||'').includes('build test-1'),'build label on the loading screen: '+ov.html);
vm.runInContext(fs.readFileSync(path.join(root,'src/engine/assets.js'),'utf8'),ctx,{filename:'assets.js'});
const L=ctx.KM.Loader,AS=ctx.KM.Assets;
// an image off the old first set (an enemy sheet) is NOT held back any more: it loads now and the bar waits for it
const enemy=AS.loadImg('assets/v7/sequences/rabbit-hit-and-death.png');assert(enemy._s,'loads during the bar');
assert.equal(L.progress().deferred,0);assert(L.progress().pending>=1,'the bar waits for it');
(async()=>{
  const p=AS.preloadAll();const asked=new Set(FakeImage.all.map(i=>i._s));
  for(const f of list)assert(asked.has(f),'requested with the bar: '+f);
  assert(L.progress().pending>=list.length,'bar waits for every image + its decode');
  FakeImage.all.forEach(im=>im.arrive());await p;await new Promise(r=>setTimeout(r,0));await new Promise(r=>setTimeout(r,0));
  assert.equal(L.progress().pending,0,'all loaded + decoded');
  // switch off: the old behaviour (held back until the bar is done)
  ctx.KM_DATA.preload.all=false;const late=AS.loadImg('assets/v7/sequences/some-late-sheet.png');assert(!late._s,'all=false: held back as before');
  ctx.KM_DATA.preload.all=true;
  // sounds: every mapped sfx file fetched once through the bar, then played from a blob URL
  const fetched=[];
  const actx={console,URLSearchParams,location:{protocol:'http:'},document:{addEventListener(){}},performance:{now:()=>0},setTimeout,clearTimeout,
    Audio:class{constructor(s){this.src=s;}canPlayType(){return 'probably';}addEventListener(){}load(){}},
    KM:{Loader:{fetch:(src,after)=>{fetched.push(src);after('blob:'+src);}}},KM_AUDIO_MAP:{hit_flesh:{files:['sfx/a.ogg','sfx/b.ogg']},step:{files:['sfx/a.ogg'],rare:{file:'sfx/r.ogg'}},vo_x:{files:['vo/v.ogg']}}};
  actx.window=actx;vm.createContext(actx);vm.runInContext(fs.readFileSync(path.join(root,'src/engine/audio.js'),'utf8'),actx,{filename:'audio.js'});
  await actx.KM.Audio.preloadAll();
  assert.deepEqual(fetched.sort(),['assets/audio/sfx/a.ogg','assets/audio/sfx/b.ogg','assets/audio/sfx/r.ogg'],'each sfx file once, no voice, no music');
  await actx.KM.Audio.warm(['hit_flesh'],10);
  console.log('PASS: every listed image loads + decodes with the bar, nothing held back, build label, sfx fetched once with the bar.');
})().catch(e=>{console.error(e);process.exit(1);});
