// Small ink emblems share the divider's exact coordinate system with the outcome thresholds.
window.KM=window.KM||{};
KM.TimingBar=(()=>{
  // Exact small illustrations from the swamp concept, not new character artwork.
  const art='assets/timing-woodcut/';
  const iconWidths={block:40,crit:90,normal:96,weak:64};
  const pctLoss=n=>String(Math.round(n*100));
  let root,rail,geometry,key,lastPos=null;
  const CB=()=>KM.CastBar&&KM.CastBar.on()&&KM_DATA.castBar;
  function mount(divider,g){
    geometry={...g,markerSize:[g.width,16],cy:8};key=null;
    rail=document.createElement('div');rail.className='timing-rail';rail.hidden=true;
    rail.style.cssText=`left:${g.left}px;top:${g.top}px;width:${g.width}px`;
    rail.innerHTML='<div class="timing-ink"><div class="timing-track"></div><div id="dvfill"></div></div><div class="mp-shroud" hidden></div><div class="mp-tags" hidden></div>'+KM.Timing.markers(g.width,16,8);
    root=document.createElement('div');root.className='timing-legend';root.hidden=true;
    root.innerHTML='<i class="pressure-band pressure-crit" aria-hidden="true"></i><i class="pressure-band pressure-block" aria-hidden="true"></i>'+['block','crit','normal','weak'].map(id=>`<button type="button" class="timing-emblem" data-outcome="${id}" aria-describedby="timing-tip-${id}"><img src="${art+id}.png" alt="" draggable="false"><span role="tooltip" id="timing-tip-${id}"></span></button>`).join('');
    root.insertAdjacentHTML('beforeend','<span class="timing-hit" role="img" hidden><svg viewBox="0 0 22 44" aria-hidden="true"><path d="M11 15v28" stroke="#ecdcc4" stroke-width="6"/><path d="M11 15v28" stroke="#292018" stroke-width="2.5"/><path d="M2 2 20 3 18 11 11 18 4 11Z" fill="#ac5c24" stroke="#292018" stroke-width="2.5" stroke-linejoin="round"/><path d="m7 5 7 1" stroke="#ecdcc4" stroke-width="2"/></svg></span>');
    root.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
      b.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();}});
    });
    rail.append(root);divider.append(rail);lastPos=null;
    const cb=CB();if(cb){rail.classList.add('castbar');rail.style.setProperty('--cb-ink-ms',cb.inkFadeMs+'ms');rail.style.setProperty('--cb-shake-n',String(Math.max(1,Math.round(cb.shakeMs/180))));rail.style.setProperty('--cb-shake-px',cb.shakePx+'px');}
  }
  // cast bar (switch): a moved icon shakes, slides, and leaves a green (helps) / red (hurts) trail that then catches up
  const calm=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pc=f=>(f*100)+'%';
  function animate(moved,cb){
    const ink=rail.querySelector('.timing-ink'),still=calm(),play=id=>KM.Audio&&KM.Audio.play(id); // silent when no file is mapped
    const slide=`${cb.slideMs}ms ${cb.ease} ${cb.shakeMs}ms`;
    if(!still){play(cb.sfx.shake);ink.style.transition=`clip-path ${slide}`;}
    for(const good of [true,false])if(moved.some(m=>m.good===good))setTimeout(()=>play(cb.sfx[good?'good':'bad']),still?0:cb.shakeMs);
    // clock ticks over the slide: winding up when the change helps, down when it hurts (KM_DATA.castBar.ticks)
    const good=moved.some(m=>m.good)&&!moved.some(m=>!m.good)?'good':moved.some(m=>!m.good)?'bad':null,rates=(cb.ticks||{})[good]||[];
    rates.forEach((rate,i)=>setTimeout(()=>KM.Audio&&KM.Audio.play(cb.sfx.tick,{rate}),(still?0:cb.shakeMs)+(rates.length>1?i*cb.slideMs/(rates.length-1):0)));
    for(const m of moved){
      const b=root.querySelector(`[data-outcome="${m.id}"]`);
      rail.querySelector(`.cb-trail[data-id="${m.id}"]`)?.remove();
      const t=document.createElement('div');t.className='cb-trail';t.dataset.id=m.id;t.dataset.good=String(m.good);
      const c=KM.CastBar.colour(m.good),img=KM.CastBar.tint(c);
      if(img)t.style.borderImageSource=`url("${img}")`;else{t.style.borderImage='none';t.style.background=c;}
      const lo=Math.min(m.from,m.to),span=Math.abs(m.to-m.from);
      rail.insertBefore(t,root); // over the track and the timer fill, under the icons, not cut by the icon gaps
      if(still){b.style.transition='none';t.style.left=pc(lo);t.style.width=pc(span);
        setTimeout(()=>{t.style.transition=`opacity ${cb.shrinkMs}ms`;t.style.opacity='0';},cb.holdMs);
        setTimeout(()=>t.remove(),cb.holdMs+cb.shrinkMs);continue;}
      b.style.transition=`left ${slide}`;b.classList.remove('cb-shake');void b.offsetWidth;b.classList.add('cb-shake');
      t.style.left=pc(m.from);t.style.width='0%';void t.offsetWidth;
      t.style.transition=`left ${slide},width ${slide}`;t.style.left=pc(lo);t.style.width=pc(span);
      const done=cb.shakeMs+cb.slideMs+cb.holdMs;
      setTimeout(()=>{t.style.transition=`left ${cb.shrinkMs}ms ${cb.ease},width ${cb.shrinkMs}ms ${cb.ease}`;t.style.left=pc(m.to);t.style.width='0%';},done);
      setTimeout(()=>t.remove(),done+cb.shrinkMs); // cb-shake stays on (removing it would replay the mount pop)
    }
  }
  function update(w,{visible=false,timed=false,jp=false,forgiving=false,deadline=false,hit=null,ink=null,tags=[]}={}){
    if(!root)return;
    // meter pressure (switch): ink over the hidden span, plain-text tags for the foes' pressures
    const shroud=rail.querySelector('.mp-shroud'),tagBox=rail.querySelector('.mp-tags'),inkOn=!!(visible&&ink);
    shroud.hidden=!inkOn;if(inkOn){shroud.style.left=(ink[0]*100)+'%';shroud.style.width=((ink[1]-ink[0])*100)+'%';}
    const tagHTML=visible&&tags.length&&KM.MeterPressure?tags.map(KM.MeterPressure.tagHTML).join(''):'';
    tagBox.hidden=!tagHTML;if(tagBox.innerHTML!==tagHTML)tagBox.innerHTML=tagHTML;
    root.hidden=!visible;rail.hidden=!(visible||timed);rail.classList.toggle("combat",visible);rail.parentElement?.classList.toggle("combat",visible);
    const signature=JSON.stringify([w,visible,jp,forgiving,deadline,hit]);if(signature===key)return;key=signature;
    const mark=root.querySelector('.timing-hit');mark.hidden=!Number.isFinite(hit);
    if(!mark.hidden){mark.style.left=(hit*100)+'%';mark.dataset.fraction=String(hit);mark.setAttribute('aria-label',jp?`命中位置 ${Math.round(hit*100)}％`:`Hit position: ${Math.round(hit*100)}%`);}
    for(const id of ['crit','block']){
      const band=root.querySelector('.pressure-'+id),before=w.unpressured?.[id]??w[id];
      band.style.left=(w[id]*100)+'%';band.style.width=((before-w[id])*100)+'%';
      band.dataset.loss=pctLoss(before-w[id]);
    }
    const pct=n=>Math.round(n*100),c=pct(w.crit),b=pct(w.block),n=pct(w.normal);
    const axis=jp?'経過時間':'elapsed time';
    const lines=jp?{
      crit:`会心 — ${axis}${b}％超〜${c}％未満。正解でダメージ2倍。生き残った敵が反撃する。武器で範囲が広がる。`,
      block:`防御 — ${axis}${b}％まで。正解で通常ダメージ、敵ターンを全て防ぐ。銀のハートは消費しない。鎧で範囲が広がる。`,
      normal:`通常攻撃 — ${axis}${c}％〜${n}％。通常ダメージ。生き残った敵が反撃する。`,
      weak:`弱い攻撃 — ${axis}${n}％超。ダメージ半分。生き残った敵が反撃する。満タンでも入力するまで待つ。`
    }:{
      crit:`Critical hit · Above ${b}% and before ${c}% ${axis}. Correct: 2× damage. Surviving enemies counterattack. Weapon upgrades extend this window.`,
      block:`Block · Up to ${b}% ${axis}. Correct: normal damage; block the entire enemy turn without spending silver hearts. Armour extends this window.`,
      normal:`Normal attack · From ${c}% through ${n}% ${axis}. Correct: normal damage. Surviving enemies counterattack.`,
      weak:`Weak attack · Above ${n}% ${axis}, including a full bar. Correct: half damage. Surviving enemies counterattack. The game waits for your input.`
    };
    if(forgiving){
      const safe=jp?'この敵は正解ならいつでも防御できる。':'This enemy is forgiving: any correct answer blocks its attack.';
      lines.block=(jp?'通常ダメージ。':'Normal damage. ')+safe;
      lines.crit=(jp?`会心 — ${b}％超〜${c}％未満。ダメージ2倍。`:`Critical hit · Above ${b}% and before ${c}%. Double damage. `)+safe;
      lines.normal=(jp?'通常ダメージ。':'Normal damage. ')+safe;
      lines.weak=(jp?'ダメージ半分。':'Half damage. ')+safe;
    } else if(deadline) {
      lines.weak=jp?'75％超はダメージ半分。満タン時に敵が一度攻撃する。その後も回答でき、同じ敵は二度反撃しない。':'Above 75%: half damage. At a full bar this enemy strikes once. Your answer stays open; it will not counter twice for this question.';
    }
    for(const id of ['crit','block']){
      lines[id]+=jp?' この印は区間の終点。':' This icon marks the end of the window.';
      const partyLoss=w.partyPressure?.[id]||0,enemyLoss=w.enemyPressure?.[id]??((w.unpressured?.[id]??w[id])-w[id]);
      if(partyLoss>0)lines[id]+=jp?` 仲間${w.partyPressure.count}人で${pct(partyLoss)}ポイント短縮。仲間を失うと次の問題から猶予が戻るが、その仲間の装備効果もなくなる。`:` ${w.partyPressure.count} living companion${w.partyPressure.count===1?'':'s'}: −${pct(partyLoss)} percentage points. Losing a companion restores time from the next question, but their gear bonuses disappear too.`;
      if(enemyLoss>0)lines[id]+=jp?` 敵の威圧で${pct(enemyLoss)}ポイント短縮。`:` Enemy pressure: −${pct(enemyLoss)} percentage points.`;
      if(partyLoss>0||enemyLoss>0)lines[id]+=jp?' 赤い部分は短くなった範囲。':' Red shows the lost window.';
    }
    const positions={crit:w.crit,block:w.block,normal:w.normal,weak:1},cb=CB();
    if(cb){const moved=visible&&lastPos?KM.CastBar.changes(lastPos,positions):[];lastPos=visible?positions:null;if(moved.length)animate(moved,cb);}
    root.querySelectorAll('button').forEach(button=>{
      const id=button.dataset.outcome;button.style.left=(positions[id]*100)+'%';
      button.dataset.threshold=positions[id];button.setAttribute('aria-label',lines[id]);
      button.querySelector('[role="tooltip"]').textContent=lines[id];
    });
    // Real gaps around the paintings, without opaque rectangles over the parchment.
    const gaps=visible?Object.entries(positions).map(([id,f])=>{
      const half=iconWidths[id]/2+7,centre=id==='weak'?geometry.width-iconWidths[id]/2:f*geometry.width;
      return [Math.max(0,centre-half),Math.min(geometry.width,centre+half)];
    }).sort((a,b)=>a[0]-b[0]):[];
    const points=['0px 0px','0px 14px'];
    let end=0;
    for(const [a,b] of gaps){const start=Math.max(end,a);end=Math.max(start,b);points.push(`${start}px 14px`,`${start}px 0px`,`${end}px 0px`,`${end}px 14px`);}
    points.push(`${geometry.width}px 14px`,`${geometry.width}px 0px`);
    rail.querySelector('.timing-ink').style.clipPath=`polygon(${points.join(',')})`;
    const markers=rail.querySelector('.timer-markers');
    if(markers){const svg=KM.Timing.markers(...geometry.markerSize,geometry.cy,w);markers.innerHTML=svg.slice(svg.indexOf('>')+1,svg.lastIndexOf('</svg>'));}
  }
  return {mount,update};
})();
