// Pointer and keyboard feed the same commit path. A cancelled drag spends nothing.
window.KM=window.KM||{};
KM.KnightHand=(()=>{
  let drag=null,shown=false;
  function bind({canPlay,hitTarget,play,arm}){
    if(shown)return;shown=true;
    document.addEventListener('pointerdown',ev=>{
      const b=ev.target.closest?.('[data-knight-slot]');
      if(!b||b.disabled||!canPlay()||drag||ev.button!==0||!ev.isPrimary)return;
      drag={b,slot:b.dataset.knightSlot,id:ev.pointerId,x:ev.clientX,y:ev.clientY};
      b.setPointerCapture(ev.pointerId);
    });
    document.addEventListener('pointermove',ev=>{
      const d=drag;if(!d||ev.pointerId!==d.id)return;
      if(!d.ghost&&Math.hypot(ev.clientX-d.x,ev.clientY-d.y)<7)return;
      if(!d.ghost){
        const rect=d.b.getBoundingClientRect(),g=document.createElement('div');
        g.className='knight-held';g.setAttribute('aria-hidden','true');const face=d.b.cloneNode(true);face.removeAttribute('data-act');face.removeAttribute('data-knight-slot');face.removeAttribute('id');face.tabIndex=-1;g.appendChild(face);const hint=document.createElement('small');g.appendChild(hint);d.hint=hint;
        g.style.width=d.b.offsetWidth+'px';g.style.zoom=rect.width/d.b.offsetWidth;d.zoom=rect.width/d.b.offsetWidth;document.body.appendChild(g);d.ghost=g;d.b.classList.add('lifted');
      }
      d.ghost.style.left=(ev.clientX/d.zoom)+'px';d.ghost.style.top=(ev.clientY/d.zoom)+'px';
      if(!canPlay())return;
      const over=d.slot==='scroll'?document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-knight-slot]:not([data-knight-slot="scroll"])'):hitTarget(ev.clientX,ev.clientY,true);
      d.ghost.classList.toggle('aimed',!!over);
      d.hint.textContent=over?'→ '+(d.slot==='scroll'?over.querySelector('strong').textContent:KM.I18n.t(over.name||KM_DATA.enemies[over.id]?.name||over.id)):'';
    });
    function release(ev){
      const d=drag;if(!d||ev.pointerId!==d.id)return;
      drag=null;d.b.classList.remove('lifted');d.ghost?.remove();
      if(ev.type!=='pointerup'||!d.ghost||!canPlay())return;
      // Captured pointer also generates a synthetic click on the original button.
      // Swallow just that click, even when the drop was outside the target.
      const swallow=e=>{if(e.target===d.b||d.b.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();}};
      document.addEventListener('click',swallow,true);setTimeout(()=>document.removeEventListener('click',swallow,true),0);
      if(d.slot==='scroll'){
        const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-knight-slot]');
        if(target&&target!==d.b&&target.dataset.knightSlot!=='scroll'&&!target.disabled&&arm())play(+target.dataset.knightSlot,null);
      }else{const target=hitTarget(ev.clientX,ev.clientY,true);if(target)play(+d.slot,target);}
    }
    document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);
    document.addEventListener('lostpointercapture',release);
  }
  return {bind};
})();
