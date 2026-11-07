// Fixed painted artwork. Placement moves the whole frame; only a horizontal flip is allowed.
window.KM = window.KM || {};
KM.SpeechBubbles = (() => {
  const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  const sideFor=(x,width)=>x<width/2?'left':'right';
  function place({mouth,speakerX,width,height,art,avoid=[],heads=[],count=1}) {
    const side=sideFor(speakerX,width),A=art[side];
    const centre=width/2+(count>1?(side==='left'?-1:1)*(A.w/2+12):0);
    const x=Math.max(6,Math.min(width-A.w-6,centre-A.w/2));
    const start=Math.max(6,Math.min(height-A.h-6,mouth.y-A.h-12));
    // Face / HUD clearance by raising the entire bubble, never pulling its tail.
    for(let y=start;y>=6;y=Math.max(6,y-12)){
      const frame={x,y,w:A.w,h:A.h};
      if(!heads.concat(avoid).some(r=>overlap(frame,r)>0))return {...frame,side,body:{x:x+A.body[0],y:y+A.body[1],w:A.body[2],h:A.body[3]}};
      if(y===6)break;
    }
    return null;
  }
  function drawFrame(ctx,A,r){
    ctx.save();ctx.translate(r.x+(A.flip?A.w:0),r.y);
    if(A.flip)ctx.scale(-1,1);
    ctx.drawImage(A.im,0,0,A.w,A.h);ctx.restore();
  }
  return {sideFor,place,drawFrame};
})();
