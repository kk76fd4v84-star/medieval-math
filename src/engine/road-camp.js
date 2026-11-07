// Existing transparent stumps and campfire, anchored to the road throughout the visit.
window.KM=window.KM||{};
KM.RoadCamp=(()=>{
  const layers={back:'scenes/camp-seats.png',front:'scenes/camp-foreground.png'};
  function placement(stop,cam){const s=KM_LAYOUT.art;return {x:stop.stopX-500-cam-887*s,y:KM_DATA.world.groundY-608*s,w:1774*s,h:887*s};}
  function preload(){Object.values(layers).forEach(p=>KM.RestView.img(p));}
  function draw(ctx,stops,cam,part){
    const im=KM.RestView.img(layers[part]);if(!im||!im._ok)return;
    for(const st of stops){if(st.rest!=='campsite')continue;const r=placement(st,cam);if(r.x+r.w<0||r.x>KM_LAYOUT.viewW)continue;
      ctx.drawImage(im,r.x,r.y,r.w,r.h);
    }
  }
  return {draw,preload,placement};
})();
