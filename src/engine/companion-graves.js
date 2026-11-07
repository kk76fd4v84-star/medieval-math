// Small, solid wooden crosses. Depth, spacing and grain are stable across saves/runs.
window.KM=window.KM||{};
KM.CompanionGraves=(()=>{
  const lanes=[{speed:.22,y:825,scale:.68,ink:'#514330'},
    {speed:.3,y:902,scale:.86,ink:'#473928'},
    {speed:.55,y:951,scale:1,ink:'#352a20'}];
  const hash=s=>Array.from(String(s)).reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,7);
  // Keep a clear horizontal gap within each depth. Start a new row before expanding sideways.
  function place(d,existing){
    for(let n=0;;n++){
      const layer=n%lanes.length,q=lanes[layer],column=Math.floor(n/lanes.length);
      const dx=(column?Math.ceil(column/2)*170*(column%2?-1:1):0)+(layer-1)*58;
      const x=d.wx*q.speed+dx;
      if(existing.some(g=>g.layer===layer&&Math.abs(g.wx*q.speed+g.dx-x)<130))continue;
      const h=hash(d.deathId);
      return {layer,dx,dy:(h%17)-8,lean:((h>>>8)%9-4)*.012,variant:h%3};
    }
  }
  function position(d,cam){const q=lanes[d.layer];return {x:KM_DATA.world.partyScreenX+(d.wx-cam)*q.speed+d.dx,y:q.y+d.dy,scale:q.scale,speed:q.speed};}
  const roadScale=1.6;
  const size=(scale=roadScale)=>[90*scale,117*scale];
  function drawMarker(ctx,x,y,{scale=roadScale,lean=0,ink='#352a20',alpha=1}={}){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(lean);
    ctx.globalAlpha*=alpha;ctx.strokeStyle=ink;ctx.lineJoin='round';cross(ctx);ctx.restore();
  }
  function cross(ctx){
    // Worn, uneven plank edges; a few cut lines remain readable at background scale.
    ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(-7,-68);ctx.lineTo(-37,-66);ctx.lineTo(-39,-83);
    ctx.lineTo(-8,-85);ctx.lineTo(-10,-115);ctx.lineTo(9,-117);ctx.lineTo(8,-84);
    ctx.lineTo(38,-86);ctx.lineTo(37,-68);ctx.lineTo(8,-68);ctx.lineTo(11,-1);ctx.closePath();
    ctx.fillStyle='#ddc8a4';ctx.fill();ctx.lineWidth=2.8;ctx.stroke();
    ctx.lineWidth=1.1;ctx.beginPath();
    ctx.moveTo(-4,-109);ctx.lineTo(-2,-88);ctx.moveTo(3,-60);ctx.lineTo(4,-8);
    ctx.moveTo(-32,-78);ctx.lineTo(-12,-79);ctx.moveTo(14,-75);ctx.lineTo(31,-77);
    ctx.moveTo(-4,-57);ctx.lineTo(-3,-31);ctx.moveTo(-3,-76);ctx.lineTo(3,-72);ctx.moveTo(3,-76);ctx.lineTo(-3,-72);ctx.stroke();
    // Broken ground hatching, no rectangular base or soft alpha halo.
    ctx.beginPath();ctx.moveTo(-45,6);ctx.lineTo(-29,3);ctx.lineTo(-19,1);ctx.moveTo(-16,6);ctx.lineTo(23,4);ctx.moveTo(29,5);ctx.lineTo(43,8);
    ctx.moveTo(-23,10);ctx.lineTo(-10,9);ctx.moveTo(8,10);ctx.lineTo(23,11);ctx.stroke();
  }
  function draw(ctx,graves,cam,layer){
    const q=lanes[layer];
    for(const g of graves){if(g.layer!==layer)continue;const p=position(g,cam);if(p.x < -100 || p.x>KM_LAYOUT.viewW+100)continue;
      drawMarker(ctx,p.x,p.y,{scale:p.scale,lean:g.lean||0,ink:q.ink});
    }
  }
  return {place,position,draw,drawMarker,size,lanes};
})();
