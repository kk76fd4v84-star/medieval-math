// Small ink emblems share the divider's exact coordinate system with the outcome thresholds.
window.KM=window.KM||{};
KM.TimingBar=(()=>{
  // Exact small illustrations from the swamp concept, not new character artwork.
  const art='assets/timing-woodcut/';
  const pctLoss=n=>String(Math.round(n*100));
  let root,rail,geometry,key,lastPos=null,shift={};
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
    rail.append(root);divider.append(rail);lastPos=null;shift={};
    const cb=CB();if(cb){rail.classList.add('castbar');rail.style.setProperty('--cb-ink-ms',cb.inkFadeMs+'ms');rail.style.setProperty('--cb-shake-n',String(Math.max(1,Math.round(cb.shakeMs/180))));rail.style.setProperty('--cb-shake-px',cb.shakePx+'px');}
  }
  // cast bar (switch): a moved icon shakes, slides, and leaves a green (helps) / red (hurts) trail that then catches up
  const calm=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pc=f=>(f*100)+'%';
  function animate(moved,cb,how){ // how: 'shift' | 'roar' (boss: trail stays while its pressure lasts) | 'restore' (boss gone)
    const roar=how==='roar';if(how==='restore')rail.querySelectorAll('.cb-trail[data-boss]').forEach(t=>t.remove());
    const still=calm(),play=id=>KM.Audio&&KM.Audio.play(id); // silent when no file is mapped
    const slide=`${cb.slideMs}ms ${cb.ease} ${cb.shakeMs}ms`;
    if(roar)play(cb.sfx.roar); // a boss shifted them
    if(!still)play(cb.sfx.shake);
    const way=moved.some(m=>!m.good)?'bad':'good';setTimeout(()=>play(cb.sfx[way]),still?0:cb.shakeMs); // winds down if anything got worse
    for(const m of moved){
      const b=root.querySelector(`[data-outcome="${m.id}"]`);
      rail.querySelector(`.cb-trail[data-id="${m.id}"]:not([data-boss])`)?.remove();
      if(how==='restore'){if(!still){b.style.transition=`left ${slide}`;b.classList.remove('cb-shake');void b.offsetWidth;b.classList.add('cb-shake');setTimeout(()=>{b.style.transition='';},cb.shakeMs+cb.slideMs);}continue;}
      const t=document.createElement('div');t.className='cb-trail';t.dataset.id=m.id;t.dataset.good=String(m.good);if(roar)t.dataset.boss='1';
      t.style.borderImageSource=`url("${KM.CastBar.fill(m.good)}")`; // the timer fill, only the colour swapped
      const lo=Math.min(m.from,m.to),span=Math.abs(m.to-m.from);
      rail.insertBefore(t,root); // over the track and the timer fill, under the icons, not cut by the icon gaps
      if(still){b.style.transition='none';t.style.left=pc(lo);t.style.width=pc(span);
        setTimeout(()=>{t.style.transition=`opacity ${cb.shrinkMs}ms`;t.style.opacity='0';},cb.holdMs);
        setTimeout(()=>t.remove(),cb.holdMs+cb.shrinkMs);continue;}
      b.style.transition=`left ${slide}`;b.classList.remove('cb-shake');void b.offsetWidth;b.classList.add('cb-shake');
      t.style.left=pc(m.from);t.style.width='0%';void t.offsetWidth;
      t.style.transition=`left ${slide},width ${slide}`;t.style.left=pc(lo);t.style.width=pc(span);
      const done=cb.shakeMs+cb.slideMs+cb.holdMs;
      if(roar){setTimeout(()=>{b.style.transition='';},cb.shakeMs+cb.slideMs);continue;} // boss: the trail stays until its pressure is gone
      setTimeout(()=>{t.style.transition=`left ${cb.shrinkMs}ms ${cb.ease},width ${cb.shrinkMs}ms ${cb.ease}`;t.style.left=pc(m.to);t.style.width='0%';},done);
      setTimeout(()=>{t.remove();b.style.transition='';},done+cb.shrinkMs); // then back to snapping; cb-shake stays on (removing it would replay the mount pop)
    }
  }
  function update(w,{roar=false,visible=false,timed=false,jp=false,forgiving=false,deadline=false,hit=null,ink=null,tags=[]}={}){
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
    if(cb&&!roar)rail.querySelectorAll('.cb-trail[data-boss]').forEach(t=>t.remove()); // out of the boss fight: its trail goes
    if(cb&&visible){const prev=lastPos;lastPos=positions; // hidden (tavern, ...): the last shown layout is kept, so the change plays once it is shown
      const how=prev?KM.CastBar.motion(shift,roar,prev,positions):'still';
      if(how!=='still')animate(KM.CastBar.changes(prev,positions),cb,how);}
    root.querySelectorAll('button').forEach(button=>{
      const id=button.dataset.outcome;if(!cb||visible)button.style.left=(positions[id]*100)+'%'; // cast bar hidden: icons wait where they were shown
      button.dataset.threshold=positions[id];button.setAttribute('aria-label',lines[id]);
      button.querySelector('[role="tooltip"]').textContent=lines[id];
    });
    // no gaps: the line and ink run straight through and each painting sits on the line (Magnus, brawl-14)
    const markers=rail.querySelector('.timer-markers');
    if(markers){const svg=KM.Timing.markers(...geometry.markerSize,geometry.cy,w);markers.innerHTML=svg.slice(svg.indexOf('>')+1,svg.lastIndexOf('</svg>'));}
  }
  return {mount,update};
})();
