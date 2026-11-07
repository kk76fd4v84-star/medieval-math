// First playtest curve: predictable stages, seeded variety within a stage. No adaptive penalties.
window.KM = window.KM || {};
KM.Progression = (() => {
  function random(seed) {
    let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
    return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
  }
  function route(seed,version=1){
    const rng=random(seed),pick=a=>a[Math.floor(rng()*a.length)],animals=['rabid_squirrel','rabid_dog','killer_rabbit'];
    for(let i=animals.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[animals[i],animals[j]]=[animals[j],animals[i]];}
    const out=[];let battle=0;
    const put=e=>out.push({src:'rogue:'+out.length,gap:1400,battleNo:battle,...e});
    const fight=(enemy,gold,type='math',group=[],extra={})=>{battle++;put({type,enemy,gold,walksIn:true,group,battleNo:battle,...extra,level:battle<=3?'opening_normal':battle<8?'normal':'hard'});};
    const rest=(kind,tier=0)=>put({type:'rest',rest:kind,shopTier:tier,gap:1300});
    const riddle=()=>put({type:'riddle',npc:'bridgekeeper',gold:4,dmg:1});
    const packs=version>=3, squirrel='rabid_squirrel', otherAnimal=()=>pick(['killer_rabbit','rabid_dog']);
    fight(packs?squirrel:animals[0],4);rest('tavern');riddle();
    if(packs)fight(squirrel,4,'math',[squirrel,squirrel],{id:'squirrel-pack',relay:true});
    else fight(animals[1],4);
    rest('shop',1);fight(packs?otherAnimal():animals[2],5);put({type:'recruit',id:'recruit_frank',companion:'frank',level:'easy',gap:1300});
    fight('rabid_villager',7);rest('campsite');
    if(packs)fight('rabid_villager',7,'math',[otherAnimal()],{relay:true});
    else fight(pick(['rabid_villager','rabid_dog']),7);
    riddle();fight('goblin',9);rest('shop',2);
    if(packs)fight('goblin',9,'math',[pick(animals),pick(['rabid_villager',squirrel])],{relay:true});
    else fight(pick(['goblin','rabid_villager']),9,'math',rng()<.5?[pick(['rabid_squirrel','rabid_dog','killer_rabbit'])]:[]);
    put({type:'special',id:'frank',npc:'frank',enemy:'turd_dragon',level:'normal',gold:8,gap:1500});
    fight('skeleton_knight',20,'boss');rest('tavern');riddle();
    if(version>=2)put({type:'recruit',id:'wizard_road',companion:'darkWizard',onlyUnlocked:true,level:'hard',gap:900});
    fight('toad',12);fight('ogre',14);rest('campsite');fight('black_knight',20,'boss');rest('shop',3);
    fight('dragon',50,'mega');Object.assign(out[out.length-1],{power:22,diceDmg:2,sacrificeBonus:3,gap:1900});
    return out;
  }
  function stage(st,stops=[]){
    const n=st?.battleNo ?? stops.slice(0,Math.max(0,stops.indexOf(st))+1).filter(s=>['math','boss','mega'].includes(s.type)).length;
    return n<=3?0:n<8?1:2;
  }
  function level(requested,st,stops){
    const n=stage(st,stops);if(requested==='stupid'||requested==='execution')return requested;
    requested=requested.replace(/^starter_/,'');
    if(n===0)return {easy:'starter_easy',normal:'opening_normal',hard:'starter_hard'}[requested]||requested;
    if(n===1&&requested==='hard')return 'march_hard';return requested;
  }
  function seconds(p){
    const nums=(p.text.match(/\d+/g)||[]).map(Number),type=p.type||(/×/.test(p.text)?'mul':/÷/.test(p.text)?'div':'add');
    if(nums.length>2)return 24;
    if(type==='mul')return Math.max(...nums)<=5?12:Math.max(...nums)<=10?16:20;
    if(type==='div')return 16;
    const max=Math.max(...nums);return max<10?8:max<20?10:max<40?12:max<70?16:18;
  }
  function shop(base,tier){
    if(!tier)return base;tier=Math.max(1,Math.min(3,Math.floor(tier)));return {...base,gear:{...base.gear,maxWeapon:tier,maxArmor:tier,weaponCost:7+(tier-1)*3,armorCost:5+(tier-1)*2}};
  }
  return {random,route,stage,level,seconds,shop};
})();
