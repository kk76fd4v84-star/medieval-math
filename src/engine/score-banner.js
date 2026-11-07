// Reasons count into the total, then the local leaderboard. No music or voice hooks.
window.KM=window.KM||{};
KM.ScoreBanner=(()=>{
 let root,state=null,returnFocus=null;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const t=s=>KM.I18n?.t(s)||s;
 function ensure(){if(!root){root=document.createElement('div');root.id='score-banner';document.getElementById('stage').append(root);}returnFocus=document.activeElement;root.hidden=false;}
 function close(){if(!root)return;root.hidden=true;state=null;document.querySelectorAll('[data-final-score]').forEach(el=>{el.innerHTML=KM.Assets.glyphHTML(el.dataset.finalScore.replace('-','−'));});returnFocus?.focus();}
 function show(summary,ledger,options={}){
  ensure();const rows=KM.Score.rows(ledger,summary.earned,summary.survivors,options.mode);
  state={rows,total:summary.total,t:0,complete:false,value:null,options,view:'tally'};
  root.innerHTML=`<section class="reckoning" role="dialog" aria-modal="true" aria-labelledby="reckoning-title"><h1 id="reckoning-title">${t('Your reckoning')}</h1><p class="reckoning-caption">${t('Every answer counts.')}</p><div class="score-reasons">${rows.map(r=>`<div class="score-reason"><span>${esc(t(r.label))}</span><small>${r.count?`${r.count} × ${r.each}`:''}</small><strong>0</strong></div>`).join('')}</div><div class="reckoning-total"><span>${t('Score so far')}</span><div class="score-value">${KM.Assets.glyphHTML('0')}</div></div><button class="opt plaque tally-next">${t('Show total')}</button></section>`;
  bind();paint();
 }
 function bind(){root.querySelector('button').addEventListener('click',ev=>{ev.stopPropagation();advance();});root.querySelector('button').focus();}
 function advance(){if(!state)return;if(state.view==='board')return close();if(state.complete)return showBoard(state.options,true);state.t=1e9;paint();}
 function showBoard(options={},keepFocus=false){
  if(!keepFocus)ensure();const mode=options.mode||options.entry?.mode||'math',all=KM.Leaderboard?.list(mode)||[],entry=options.entry;
  const rank=entry?KM.Leaderboard?.rank(entry.id,mode):null;
  let rows=all.slice(0,10);if(rank>10)rows=rows.concat(all[rank-1]);
  state={view:'board',complete:true,options};
  root.innerHTML=`<section class="reckoning leaderboard" role="dialog" aria-modal="true" aria-labelledby="reckoning-title"><h1 id="reckoning-title">${t('Local leaderboard')}</h1><p class="reckoning-caption">${t(mode==='fellowship'?'The Fellowship':mode==='knight'?'The Knight':'The Village Idiot')} · ${t('Saved on this computer')}${options.preview?' · '+t('Preview — score not saved'):''}</p>${entry?`<div class="leaderboard-result">${esc(entry.name)} · ${t('Final score')} <strong>${entry.score}</strong>${rank?' · #'+rank:''}</div>`:''}${rows.length?`<table><thead><tr><th>#</th><th>${t('Name')}</th><th>${t('Score')}</th><th>${t('Journey')}</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.id===entry?.id?'current-run':''}"><td>${all.indexOf(r)+1}</td><td>${esc(r.name)}${r.victory?' <span title="'+t('Victory!')+'">✧</span>':''}</td><td>${r.score}</td><td>${r.leagues.toFixed(1)}</td></tr>`).join('')}</tbody></table>`:`<p class="leaderboard-empty">${t('Finish a run to set the first score.')}</p>`}<button class="opt plaque tally-next">${t('Continue')}</button></section>`;
  bind();
 }
 function paint(){
  if(!state||state.view!=='tally')return;
  const tally=KM.Score.tally(state.rows,state.t);
  root.querySelectorAll('.score-reason').forEach((el,i)=>{const visible=i<tally.shown;el.classList.toggle('counted',visible);el.classList.toggle('counting',i===tally.active);el.setAttribute('aria-hidden',String(!visible));const n=tally.values[i];el.querySelector('strong').textContent=(n>0?'+':'')+n;});
  if(tally.total!==state.value){state.value=tally.total;root.querySelector('.score-value').innerHTML=KM.Assets.glyphHTML(String(tally.total).replace('-','−'));}
  state.complete=tally.complete;
  root.querySelector('.reckoning-total>span').textContent=t(state.complete?'Final score':'Score so far');
  root.querySelector('button').textContent=t(state.complete?'Leaderboard':'Show total');
  root.querySelector('.score-value').setAttribute('aria-label',`${t('Score')} ${tally.total}`);
 }
 function update(dt){if(state?.view==='tally'&&!state.complete&&!document.getElementById('kmLoader')){state.t+=Math.max(0,dt);paint();}}
 document.addEventListener('keydown',ev=>{
  if(!state)return;
  if(['Enter',' ','Escape'].includes(ev.key)){ev.preventDefault();ev.stopImmediatePropagation();advance();}
  else if(ev.key==='Tab'){ev.preventDefault();ev.stopImmediatePropagation();root.querySelector('button').focus();}
  else ev.stopImmediatePropagation();
 },true);
 return {show,showBoard,update,close};
})();
