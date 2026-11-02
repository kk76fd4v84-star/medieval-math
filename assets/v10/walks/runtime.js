/* Rigid 2D paper-cutout skeleton. No mesh deformation or changing limb length. */
(function(g,f){if(typeof module==='object')module.exports=f();else g.SideWalk=f()})(globalThis,()=>{
const TAU=Math.PI*2,lerp=(a,b,u)=>a+(b-a)*u;
function foot(r,phase,side=0){const p=(phase%1+1)%1,s=r.stance;let x,y,rotation;if(p<s){x=r.step*(.5-p/s);y=0;rotation=0}else{const u=(p-s)/(1-s),q=u*u*(3-2*u);x=r.step*(q-.5);y=-r.lift*Math.pow(Math.sin(Math.PI*u),1.3);rotation=-.28*Math.sin(Math.PI*u)}return{x:r.hip[0]+x+r.hipSockets[side][0]*.35,y:r.ankleY+y,rotation,planted:p<s};}
function solve(h,f,a,b){const dx=f.x-h[0],dy=f.y-h[1],d=Math.hypot(dx,dy);if(d>a+b+.001)throw Error('Unreachable foot target');const angle=Math.atan2(dy,dx)-Math.acos(Math.max(-1,Math.min(1,(a*a+d*d-b*b)/(2*a*d))));return[h[0]+a*Math.cos(angle),h[1]+a*Math.sin(angle)];}
function pose(r,time){const p=((time/r.duration)%1+1)%1,q=(p*2)%1;const drop=3.5*Math.sin(q*TAU)-1.5*Math.cos(q*TAU);const h=[r.hip[0],r.hip[1]+drop*r.weightScale];const pelvis=.025*Math.sin(p*TAU);const c=Math.cos(pelvis),s=Math.sin(pelvis);const legs=[0,1].map(i=>{const offset=r.hipSockets[i],hip=[h[0]+c*offset[0]-s*offset[1],h[1]+s*offset[0]+c*offset[1]],f=foot(r,p+i*.5,i);return{hip,knee:solve(hip,f,r.thighLength,r.shinLength),ankle:[f.x,f.y],foot:f}});return{hip:h,legs,pelvis,torso:-.035*Math.sin(p*TAU-.15),head:.035*Math.sin(p*TAU-.6),headBob:1.7*r.weightScale*Math.sin(p*TAU*2-.65),frontArm:-r.upper.armSwing*Math.cos(p*TAU),frontFore:.055*Math.sin(p*TAU-.5),backArm:r.upper.armSwing*.8*Math.cos(p*TAU),backFore:-.045*Math.sin(p*TAU-.5),gear:.025*Math.sin(p*TAU-.7)};}
function part(ctx,image,s,t,rotation,scale=1){ctx.save();ctx.translate(t[0],t[1]);ctx.rotate(rotation);ctx.scale(scale,scale);ctx.drawImage(image,-s[0],-s[1]);ctx.restore();}
function segment(ctx,img,origin,end,a,b){const angle=Math.atan2(b[1]-a[1],b[0]-a[0])-Math.atan2(end[1]-origin[1],end[0]-origin[0]);part(ctx,img,origin,a,angle);}
function render(ctx,images,r,time,o={}){const p=pose(r,time);ctx.save();ctx.translate(o.x??384,o.y??680);ctx.scale((o.flip?-1:1)*(o.scale??r.scale),o.scale??r.scale);ctx.translate(-r.hip[0],-r.baseline);
for(let i=0;i<2;i++){const l=p.legs[i];ctx.save();if(i===0)ctx.filter="brightness(0.82)";segment(ctx,images.thigh,r.partHip,r.partKnee,l.hip,l.knee);segment(ctx,images.shin,r.partKnee,r.partAnkle,l.knee,l.ankle);part(ctx,images.boot,r.partAnkle,l.ankle,l.foot.rotation);ctx.restore();}
// All upper attachments inherit torso rotation about the pelvis, then their own hinge.
ctx.save();ctx.translate(...p.hip);ctx.rotate(p.torso);ctx.translate(-r.bindHip[0],-r.bindHip[1]);
const hinge=(origin,angle,draw)=>{ctx.save();ctx.translate(...origin);ctx.rotate(angle);ctx.translate(-origin[0],-origin[1]);draw();ctx.restore()};
const draw=n=>{if(images[n])ctx.drawImage(images[n],0,0)};
if(images.backUpper){draw('backJoint');hinge(r.upper.backShoulder,p.backArm,()=>{draw('backUpper');hinge(r.upper.backElbow,p.backFore,()=>draw('backFore'))})}
draw('body');draw('neckJoint');hinge(r.upper.neck,p.head-p.torso*.55,()=>{ctx.translate(0,p.headBob);draw('head')});
if(images.shield)hinge(r.upper.backShoulder,p.backArm*.38+p.gear,()=>{draw('shieldArm');draw('shield')});
draw('frontJoint');hinge(r.upper.frontShoulder,p.frontArm,()=>{draw('frontUpper');hinge(r.upper.frontElbow,p.frontFore,()=>{draw('frontFore');if(images.sword)hinge(r.upper.wrist,p.gear,()=>draw('sword'))})});
ctx.restore();
if(o.debug){ctx.strokeStyle='#be4927';ctx.fillStyle='#be4927';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...p.legs[0].hip);ctx.lineTo(...p.legs[1].hip);ctx.stroke();for(const l of p.legs){ctx.beginPath();ctx.arc(...l.hip,5,0,TAU);ctx.fill()}}
ctx.restore();return p;}
return{foot,pose,render};});
