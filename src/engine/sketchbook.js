// An opt-in road built from Magnus's single pen sheet. All positions are road/layout units.
// All sprites use source pixels × KM_LAYOUT.art, including scenery and repeated props.
// Depth changes travel speed and placement only; preserve the sheet's drawn proportions.
(() => {
  if (new URLSearchParams(location.search).get('biome') !== 'sketchbook') return;
  const root = 'assets/sketchbook/';
  const pictures = new Map();
  const cast = [
    {file:'knight', name:'The Tin Pilgrim'},
    {file:'imp', name:'Hedge Imp', hp:3, taunt:'I was promised a bigger knight.', defeat:'I shall write a complaint.'},
    {file:'hermit', name:'Toll Hermit', hp:5, taunt:'A perfectly ordinary toll. Pay in sums.', defeat:'Very well. Keep the change.'},
    {file:'maw', name:'The Spindle Maw', hp:7, taunt:'One mouth would have been plenty.', defeat:'Both mouths object.'},
  ];
  const route = cast.slice(1).map((c,i)=>({
    src:'sketch:'+c.file, type:'math', enemy:'sketch_'+c.file, battleNo:i+1,
    group:[], walksIn:true, gap:[880,1320,1650][i], gold:0, level:'opening_normal'
  }));
  if(window.KM_JA)Object.assign(KM_JA,{
    'The Sketchbook March':'絵草紙の辺境','The road is clear.':'街道は開かれた。','Here lies the pilgrim.':'巡礼の騎士、ここに眠る。',
    'Enter the march':'辺境へ踏み出す','Try the march again':'もう一度挑む','Back to game':'本編に戻る',
    'Hedge Imp':'茂みの小鬼','Toll Hermit':'通行料取りの隠者','The Spindle Maw':'紡ぎ脚の大あぎと',
    'I was promised a bigger knight.':'もっとでかい騎士だと聞いてたぞ。','I shall write a complaint.':'苦情の手紙を書いてやる。',
    'A perfectly ordinary toll. Pay in sums.':'ただの通行料じゃ。計算で払え。','Very well. Keep the change.':'よかろう。釣りは取っとけ。',
    'One mouth would have been plenty.':'口はひとつで足りたのに。','Both mouths object.':'どっちの口も異議ありだ。'
  });
  async function load() {
    const response = await fetch(root+'sprites.json');
    if (!response.ok) throw Error('Could not load the sketchbook sprite list.');
    const sprites = await response.json();
    await Promise.all(Object.entries(sprites).map(async ([id,meta])=>{
      const image=KM.Assets.loadImg(root+id+'.png');
      KM.Loader?.want(image);
      await image.decode();
      pictures.set(id,{image,...meta});
    }));
    for (const actor of cast) {
      const {width,height,pivot}=pictures.get(actor.file);
      const id='sketch_'+actor.file, factor=KM_LAYOUT.art, pivotX=pivot[0];
      const drawnHeight=(height-6)*factor; // Exclude the exporter's 3px transparent gutter.
      KM_ART.entities[id]={img:root+actor.file+'.png',anchor:pivot,top:3,
        artMul:1,box:{w:width*factor,h:drawnHeight},noFallbackDeath:true};
      KM_TALL[id]=drawnHeight;
      KM_WIDE[id]=[-pivotX*factor,(width-pivotX)*factor];
      if (actor.hp) {
        KM_DATA.enemies[id]={name:actor.name,taunt:actor.taunt,defeat:actor.defeat,material:'flesh',dropsCoins:false};
        KM_DATA.combat.enemies[id]={hp:actor.hp,atk:1};
      }
    }
  }
  function stamp(ctx,id,x,base){
    const s=pictures.get(id);
    if (!s) return;
    const width=s.width*KM_LAYOUT.art,h=s.height*KM_LAYOUT.art;
    if (x+width/2<0 || x-width/2>KM_LAYOUT.viewW) return;
    KM.Scenery.drawInked(ctx,s.image,x-width/2,base-h,width,h);
  }
  // X is a landmark's centre at camera zero. Depth scales the camera movement, never its sign.
  const landmarks=[
    ['castle',1070,740,.085],
    ['cottage',2020,847,.47],['stack-small',2740,855,.47],
    ['fence',830,923,.68],['post',1475,905,.68],
    ['cross-a',3110,910,.68],['cross-b',3290,902,.68],['cross-c',3443,922,.68],
    ['stack-large',4260,894,.54],['sign',5060,934,.68],
    ['fence',5780,913,.68],['stack-small',6175,873,.54],
    ['post',7340,925,.68],['fence',8120,927,.68]
  ];
  const [castle,...props]=landmarks;
  props.sort((a,b)=>a[3]-b[3]);
  function repeat(ctx,cam,speed,period,placements) {
    const travel=cam*speed,first=Math.floor(travel/period)-1,last=Math.ceil((travel+KM_LAYOUT.viewW)/period)+1;
    for(let cell=first;cell<=last;cell++)for(const [id,pos,y] of placements)stamp(ctx,id,cell*period+pos-travel,y);
  }
  function back(ctx,cam){
    ctx.drawImage(KM.Scenery.parchmentCanvas(),0,0,KM_LAYOUT.viewW,KM_LAYOUT.artSpaceH);
    const place=([id,x,y,speed])=>stamp(ctx,id,x-cam*speed,y);
    place(castle);
    repeat(ctx,cam,.22,2800,[['hill',360,805],['hill',1700,781]]);
    props.forEach(place);
  }
  function front(ctx,cam) {
    // The original tufts are short enough to sit in front of the boots.
    repeat(ctx,cam,1,2640,[['rushes',75,986],['daisies',782,984],
      ['clover',1350,986],['rushes',2130,985]]);
    ctx.strokeStyle='#51463a';ctx.lineWidth=1.6;ctx.beginPath();
    ctx.moveTo(0,KM_DATA.world.groundY+2);ctx.lineTo(KM_LAYOUT.viewW,KM_DATA.world.groundY+2);ctx.stroke();
  }
  window.KM.Sketchbook={load,route,back,front};
})();
