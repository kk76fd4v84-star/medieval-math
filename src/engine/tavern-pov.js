// First-person table; visitors are separate transparent cutouts and disappear when recruited.
window.KM=window.KM||{};
KM.TavernPOV=(()=>{
  const root='assets/tavern-pov/', img=n=>KM.Assets.loadImg(root+n);
  const geom=()=>({w:KM_LAYOUT.viewW,h:KM_LAYOUT.artSpaceH});
  function seats(cands){
    const {w,h}=geom(),n=cands.length;
    const xs=n>2?[.27,.49,.71]:n===1?[.46]:[.34,.65];
    // Portraits share the same authored size and elbow baseline (table edge).
    return cands.flatMap((p,j)=>p?[{p,j,r:{x:w*xs[j]-(h*.5*887/792)/2,y:h*.145,w:h*.5*887/792,h:h*.5}}]:[]);
  }
  function spots(cands){const {w,h}=geom();return [
    {id:'fare',kind:'fare',name:'Tavern menu',r:{x:w*.035,y:h*.16,w:w*.16,h:h*.38}},
    ...seats(cands).map(({p,j,r})=>({id:'npc'+j,kind:'npc',j,p,name:p.name,r})),
    {id:'door',kind:'door',name:'Go outside',r:{x:w*.87,y:h*.12,w:w*.12,h:h*.49}}
  ];}
  const coif=(p,j)=>p.role==='firestarter'||p.look==='coif'||j===0;
  // The POV portraits have two generic outfits; choose the matching existing walk on departure.
  const departureArt=(p,j)=>({darkWizard:'dark_wizard',priest:'frank',executioner:'executioner',firestarter:'timmy'}[p.role]||(coif(p,j)?'follower_5':'hero'));
  function portrait(ctx,p,j,r){
    const vis=img('visitors-v2.png'),special=img('specialists-seated.png');
      if(p.role==='darkWizard'){
        const wi=KM.Assets.loadImg('assets/wizard-riddles/v22/wizard.png');
        if(wi._ok){const crop=[623,522,311,290],h=r.h,w=h*crop[2]/crop[3];ctx.drawImage(KM.Palette?.sprite(wi)||wi,...crop,r.x+r.w/2-w/2,r.y,w,h);}
        return;
      }
      if(!vis._ok)return;
      const isSpecial=p.role==='priest'||p.role==='executioner',sheet=isSpecial?special:vis;
      if(!sheet._ok)return;
      const cell=sheet.naturalWidth/2,variant=isSpecial?(p.role==='priest'?0:1):(coif(p,j)?0:1);
      ctx.drawImage(KM.Palette?.sprite(sheet)||sheet,cell*variant,55,cell,sheet.naturalHeight-95,r.x,r.y,r.w,r.h);
  }
  // Elbows start on the table. Rise from the seated drawing, then walk behind the tabletop to the door.
  function departurePose(d,time){
    const t=Math.max(0,time-d.at),u=Math.min(1,t/.45),v=Math.max(0,Math.min(1,(t-.45)/2.4));
    const {w,h}=geom(),r=d.r;
    return {t,done:t>=2.85,rise:u*u*(3-2*u)*h*.09,x:r?r.x+r.w/2+(w*1.06-r.x-r.w/2)*v:0,scale:1-.1*v};
  }
  function drawDeparture(ctx,d,time){
    if(!d.r)return;
    const p=departurePose(d,time);if(p.done)return;
    const {w,h}=geom(),r=d.r;
    ctx.save();ctx.beginPath();ctx.rect(0,0,w,h*.622);ctx.clip();
    const id=departureArt(d.p,d.j),height=(window.KM_TALL&&KM_TALL[id])||KM.Assets.entitySize(id)[1];
    const scale=r.h*1.85/height*p.scale,feet=r.y+r.h*1.85-p.rise;
    const standing=()=>{ctx.save();ctx.translate(p.x,feet);ctx.scale(scale,scale);
      KM.Assets.drawEntity(ctx,id,0,0,{action:p.t<.45?'idle':'walk',t:Math.max(0,p.t-.45)});ctx.restore();};
    // A short held sitting pose, then a held upright pose rising into the walk.
    // The stepped turn suits the existing woodcut animation and keeps the torso whole.
    if(p.t<.12)portrait(ctx,d.p,d.j,r);else standing();
    ctx.restore();
  }
  function draw(ctx,cands,selected,items,hero,departures=[],time=0){
    const cloth=KM.PartyAbilities.villager(hero)&&!hero.armorTrained;
    const {w,h}=geom(),bg=cloth?KM.Assets.loadImg('assets/villager-start/tavern-cloth.png'):img('room.png'),vis=img('visitors-v2.png'),special=img('specialists-seated.png');
    if(bg._ok)KM.Scenery.drawInked(ctx,bg,0,0,w,h);
    for(const d of departures)drawDeparture(ctx,d,time);
    for(const {p,j,r} of seats(cands))portrait(ctx,p,j,r);
    // Wall menu is a simple ink board. Options only appear after selecting it.
    const menu=spots(cands)[0].r;
    ctx.fillStyle='#29231c';ctx.fillRect(menu.x,menu.y,menu.w,menu.h);
    ctx.strokeStyle='#a4794f';ctx.lineWidth=3;ctx.strokeRect(menu.x+5,menu.y+5,menu.w-10,menu.h-10);
    ctx.fillStyle='#f1e2c6';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='36px Georgia';
    ctx.fillText(KM.I18n?.t('Tavern fare')||'Tavern fare',menu.x+menu.w/2,menu.y+menu.h*.22);
    ctx.font='30px Georgia';items.forEach((it,i)=>ctx.fillText(`${KM.I18n?.t(it.label)||it.label}  ${it.cost}`,menu.x+menu.w/2,menu.y+menu.h*(.5+i*.21)));
    const sp=spots(cands)[selected];if(sp){ctx.strokeStyle='#a15c2b';ctx.lineWidth=3;const r=sp.r;ctx.beginPath();ctx.moveTo(r.x,r.y+r.h+6);ctx.lineTo(r.x+r.w,r.y+r.h+6);ctx.stroke();}
  }
  function preload(){return [img('room.png'),KM.Assets.loadImg('assets/villager-start/tavern-cloth.png'),img('visitors-v2.png'),img('specialists-seated.png')];}
  return {draw,seats,spots,preload,departurePose};
})();
