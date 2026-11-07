// Separate local boards. Keep retired Bard entries archived, never relabel or drop them when current modes save.
window.KM=window.KM||{};
KM.Leaderboard=(()=>{
 const KEY='knightMath.leaderboard.v1',LIMIT=50;let memory=[];
 const modeOf=value=>['bard','knight','fellowship'].includes(value)?value:'math';
 const identity=r=>r.mode+':'+r.id;
 function clean(r){
  if(!r||typeof r.id!=='string'||!r.id||!Number.isFinite(r.score))return null;
  return {mode:modeOf(r.mode),id:r.id.slice(0,160),name:String(r.name||'Nobody').slice(0,60),score:Math.trunc(r.score),earned:Number.isFinite(r.earned)?Math.trunc(r.earned):Math.trunc(r.score),survivors:Math.max(0,Math.min(4,Math.trunc(r.survivors)||0)),leagues:Number.isFinite(r.leagues)?Math.max(0,r.leagues):0,victory:!!r.victory,at:Number.isFinite(r.at)?r.at:0};
 }
 const sort=rows=>rows.sort((a,b)=>b.score-a.score||b.leagues-a.leagues||a.at-b.at||a.id.localeCompare(b.id));
 function all(){try{const saved=JSON.parse(localStorage.getItem(KEY));if(Array.isArray(saved?.entries))memory=Array.from(new Map([...saved.entries.map(clean).filter(Boolean),...memory].map(r=>[identity(r),r])).values());}catch(_){}return memory;}
 function list(mode='math'){return sort(all().filter(r=>r.mode===modeOf(mode))).slice(0,LIMIT);}
 function record(row){const r=clean(row);if(!r)return null;const entries=all().slice();if(!entries.some(e=>identity(e)===identity(r)))entries.push(r);memory=['math','bard','knight','fellowship'].flatMap(mode=>sort(entries.filter(e=>e.mode===mode)).slice(0,LIMIT));try{localStorage.setItem(KEY,JSON.stringify({version:1,entries:memory}));}catch(_){}return rank(r.id,r.mode);}
 function rank(id,mode='math'){const n=list(mode).findIndex(e=>e.id===id);return n<0?null:n+1;}
 return {list,record,rank,KEY};
})();
