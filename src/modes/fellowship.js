// The Fellowship: one sum, each living member's role attack. No combat selection.
window.KM = window.KM || {};
KM.Fellowship = (() => {
  const rules = { enemyHealth: 2, baseDamage: 3, wizardDamage: 7, fireDamage: 4, weaponDamage: 2, hitSpacing: .11 };
  const role = member => KM.PartyAbilities.role(member);
  const risky = member => ['darkWizard','firestarter'].includes(role(member));
  const damage = member => (role(member)==='darkWizard'?rules.wizardDamage:role(member)==='firestarter'?rules.fireDamage:rules.baseDamage) + rules.weaponDamage * Math.max(0, member.weapon || 0);
  const total = party => party.filter(KM.PartyAbilities.alive).reduce((sum,m) => sum + damage(m), 0);
  const health = hp => Math.ceil(hp * rules.enemyHealth);
  // Reserve in party order: knights cleave two, casters hit all, executioners finish
  // wounded foes. Priests reserve a limited heal before any later priest chooses.
  function plan(party, foes, multiplier = 1, {failed=false,hp=0,maxHp=hp,heals=0,leader=null,leaderMultiplier=1,knightTargets=0,burn=0,wizardDamage=0,v2=null}={}) {
    // v2 (cards v2): {cleave:[shares per knight target], knight, fire: extra damage, axe:{under, bonus}, skip:Set of members}
    const remaining = foes.map(f => f.hp), last = foes.length - 1;
    if (last < 0) return [];
    let wounds=Math.max(0,maxHp-hp), charges=heals;
    let embersTick=burn&&!failed;
    return party.filter(m=>KM.PartyAbilities.alive(m)&&(!failed||risky(m))&&!(v2&&v2.skip&&v2.skip.has(m))).map((member,index) => {
      const r=role(member), available=remaining.map((hp,i)=>hp>0?i:-1).filter(i=>i>=0);
      const live=available.length?available:[last];
      let kind=r==='darkWizard'?'lightning':r==='firestarter'?'fire':r==='priest'?'staff':r==='executioner'?'execute':'sword';
      let heal=0, ids;
      if(r==='priest'&&wounds>0&&charges>0){kind='heal';heal=Math.min(1,wounds);wounds-=heal;charges--;ids=[];}
      else if(risky(member))ids=live;
      else if(r==='knight')ids=live.slice(0,v2?v2.cleave.length:2+knightTargets);
      else if(r==='executioner')ids=[live.find(i=>remaining[i]>0&&remaining[i]<=foes[i].maxHp/2)??live[0]];
      else ids=live.slice(0,1);
      const ticks=[];
      if(embersTick&&r==='firestarter'){embersTick=false;foes.forEach((f,i)=>{if(f.burning&&remaining[i]>0){const amount=Math.min(remaining[i],f.burning);remaining[i]-=amount;ticks.push({target:f,amount,burn:true});}});} // Embers: burning foes take their burn first
      const impacts=ids.map(i=>{
        const execution=r==='executioner'&&remaining[i]>0&&remaining[i]<=foes[i].maxHp/2;
        const extra=r==='darkWizard'?wizardDamage:v2&&r==='knight'?v2.knight:v2&&r==='firestarter'?v2.fire:0;
        const share=v2&&r==='knight'?v2.cleave[ids.indexOf(i)]:1, axe=v2&&r==='executioner'&&v2.axe&&remaining[i]>0&&remaining[i]<foes[i].maxHp*v2.axe.under?1+v2.axe.bonus:1;
        const amount=(damage(member)+extra)*share*axe*(execution?2:1)*(failed?1:multiplier*(member===leader?leaderMultiplier:1));
        remaining[i]=Math.max(0,remaining[i]-amount);
        return {target:foes[i],amount};
      });
      if(burn&&!failed&&r==='firestarter')impacts.forEach(h=>h.target.burning=burn); // Embers card
      impacts.unshift(...ticks);
      return {member,kind,heal,impacts,target:impacts[0]?.target||foes[live[0]],amount:impacts.reduce((n,h)=>n+h.amount,0),backfire:failed?1:0,index,delay:index*rules.hitSpacing};
    });
  }
  // The original ink palette, brief stamped numbers and discrete impact rays.
  // No artwork regeneration, screen-wide flashes or glitter.
  function drawBurst(ctx, f, reduced = false) {
    const u = f.t, life = f.life || 1.25;
    const pop = reduced ? 1 : u < .10 ? .65 + 5.8*u : u < .22 ? 1.23 - (u-.10)*1.92 : 1;
    const rise = reduced ? 0 : 85*u;
    ctx.save();
    ctx.translate(f.x, f.y-rise);
    ctx.scale(pop,pop);
    ctx.globalAlpha = Math.min(1, Math.max(0,(life-u)/.35));
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
    if(u<.18 && !reduced && !f.total) {
      ctx.strokeStyle=f.crit?'#ac5c24':'#6c6050';ctx.lineWidth=3;
      for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*52,Math.sin(a)*43);ctx.lineTo(Math.cos(a)*66,Math.sin(a)*56);ctx.stroke();}
    }
    ctx.font=`bold ${f.total?76:58+f.index*5}px Georgia`;
    ctx.strokeStyle='#24241c';ctx.lineWidth=5;
    ctx.fillStyle=f.crit?'#c57c39':'#ecdcc4';
    ctx.strokeText(f.text,0,0);ctx.fillText(f.text,0,0);
    ctx.font='bold 20px Georgia';ctx.lineWidth=3;ctx.fillStyle='#ecdcc4';
    ctx.strokeText(f.caption,0,48);ctx.fillText(f.caption,0,48);
    ctx.restore();
  }
  return {rules,damage,total,health,plan,risky,drawBurst};
})();
