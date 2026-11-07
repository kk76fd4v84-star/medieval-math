// Calibrated ink/paper and per-garment materials; source linework, alpha and geometry stay intact.
window.KM=window.KM||{};
KM.Palette=(()=>{
  const cache=new WeakMap(),inks=new WeakMap();
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const clamp=n=>Math.max(0,Math.min(1,n));
  const profile=im=>KM_PALETTE.profiles.find(p=>decodeURI(im.src||'').includes(p.match));
  function make(im,inkOnly){
    const p=profile(im);if(!p||!im._ok)return null;
    const mask=p.materialMask?KM.Assets.loadImg(p.materialMask):null;if(mask&&!mask._ok)return null;
    const memo=inkOnly?inks:cache;if(memo.has(im))return memo.get(im);
    const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);
    const d=x.getImageData(0,0,c.width,c.height),a=d.data,W=p.paper;
    const ink=rgb(KM_PALETTE.ink),paper=rgb(KM_PALETTE.paper),accent=rgb(KM_PALETTE[p.accent||'orange']);
    const wl=.299*W[0]+.587*W[1]+.114*W[2];
    let material=null;
    if(mask||p.materials){const mc=document.createElement('canvas');mc.width=c.width;mc.height=c.height;const mx=mc.getContext('2d',{willReadFrequently:true});
      if(mask){mx.drawImage(mask,0,0);material=mx.getImageData(0,0,c.width,c.height).data;}
      else {for(const m of p.materials){mx.fillStyle=m.colour;mx.beginPath();m.polygon.forEach(([x,y],i)=>mx[i?'lineTo':'moveTo'](x,y));mx.closePath();mx.fill();}mx.globalCompositeOperation='destination-out';for(const poly of p.excludeMaterials||[]){mx.beginPath();poly.forEach(([x,y],i)=>mx[i?'lineTo':'moveTo'](x,y));mx.closePath();mx.fill();}material=mx.getImageData(0,0,c.width,c.height).data;}
    }
    for(let i=0;i<a.length;i+=4){
      if(!a[i+3])continue;
      const r=a[i],g=a[i+1],b=a[i+2];
      const light=clamp((.299*r+.587*g+.114*b-25)/(wl-25));
      // Only strongly pigmented accents qualify; parchment, skin and cream cloth never inherit yellow.
      const orange=r>85&&r>g*(p.accentRatio||1.68)&&g>b*1.34;
      const pigment=orange?clamp((r/W[0]-b/W[2])/.45):0;
      const coverage=Math.max(1-light,pigment);
      for(let k=0;k<3;k++){
        const colour=ink[k]*(1-pigment)+accent[k]*pigment;
        const base=p.preserve?a[i+k]:(inkOnly?colour:colour*coverage+paper[k]*(1-coverage));
        const weight=material?(mask?material[i]/255:material[i+3]/255):0;
        const dye=mask?accent[k]:(material?.[i+k]??0);
        a[i+k]=Math.round(base*(1-weight)+(ink[k]*(1-light)+dye*light)*weight)||0;
      }
      if(inkOnly)a[i+3]=Math.round(a[i+3]*coverage);
    }
    x.putImageData(d,0,0);c.naturalWidth=c.width;c.naturalHeight=c.height;c.src=im.src;c._ok=true;
    memo.set(im,c);return c;
  }
  return {preload:()=>KM_PALETTE.profiles.filter(p=>p.materialMask).map(p=>KM.Assets.loadImg(p.materialMask)),profile,sprite:im=>profile(im)?.kind==='sprite'?make(im,false):null,ink:im=>make(im,true)};
})();
