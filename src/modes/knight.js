// The Knight: identity belongs to the character and slot, not to their current equipment.
// A short, visible queue rather than a second resource system. No DOM or combat callbacks here.
window.KM=window.KM||{};
KM.Knight=(()=>{
  function library(party){
    const pa=KM.PartyAbilities, team=party.filter(pa.alive), out=[];
    function add(id,owners,name,level,damage,extra={}){
      out.push({id,owners:owners.map(m=>m.id),name,level,damage,...extra});
    }
    for(const m of team){
      const w=Math.max(0,m.weapon||0),role=pa.role(m),bonus=pa.bonus(team,role);
      const put=(slot,...args)=>add(m.id+':'+slot,[m],...args);
      switch(role){
        case 'priest':
          put(0,'Pilgrim’s staff','easy',(2+w)*bonus);
          put(1,'Mending blow',pa.priestLevel(team,'heal')||'normal',1+w,{heal:1});break;
        case 'firestarter':
          put(0,'Torch jab','easy',(2+w)*bonus);
          put(1,'Fire bottle','hard',(4+w)*bonus,{all:true,risk:'fire'});break;
        case 'executioner':
          put(0,'Haft strike','execution_easy',(2+w)*bonus);
          put(1,'Execute','execution',(5+w)*bonus,{execute:true});break;
        case 'darkWizard':
          put(0,'Staff knock','easy',2+w);
          put(1,'Dark lightning','hard',(7+w)*bonus,{all:true,risk:'lightning'});break;
        default:{
          const stick=pa.unarmed(m),base=(3+w)*bonus;
          put(0,stick?'Stick jab':'Sword thrust','easy',base);
          put(1,stick?'Overhead stick':'Sword cleave','hard',(5+2*w)*bonus);break;
        }
      }
    }
    // A single shared road card gives even the lone villager a waiting card.
    add('road:brace',[],'Brace & jab','easy',1,{block:team.some(m=>m.armor>0)?2:1});
    function pair(id,a,b,name,damage,extra){
      const left=team.find(m=>pa.role(m)===a);
      const right=team.find(m=>m!==left&&pa.role(m)===b);
      if(left&&right)add('pair:'+id,[left,right],name,'hard',damage+(left.weapon||0)+(right.weapon||0),{combo:true,...extra});
    }
    pair('vigil','knight','priest','Blessed blade',4,{heal:1});
    pair('crosscut','knight','knight','Crosscut',6,{});
    pair('pitch','priest','firestarter','Holy fire',5,{all:true,risk:'fire'});
    pair('storm','darkWizard','executioner','Storm axe',8,{all:true,risk:'lightning'});
    pair('wake','priest','priest','Wake the fallen',2,{revive:true,level:pa.priestLevel(team,'resurrect')});
    return out;
  }
  function create(party,random=Math.random){
    const cards=library(party),ids=cards.map(c=>c.id);
    for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
    // First solo hand teaches the safe/risky choice; larger parties have a shuffled opening.
    if(cards.length===3)ids.splice(0,3,'hero:0','hero:1','road:brace');
    const n=cards.length===3?2:3;
    const easy=id=>cards.some(c=>c.id===id&&['easy','execution_easy'].includes(c.level));
    if(!ids.slice(0,n).some(easy)){const j=ids.findIndex(easy);[ids[n-1],ids[j]]=[ids[j],ids[n-1]];}
    return {hand:ids.splice(0,n),queue:ids,pending:null,turn:1};
  }
  function commit(deck,index){
    if(deck.pending||!Number.isInteger(index)||!deck.hand[index])return false;
    deck.pending=deck.hand[index];deck.hand[index]=null;return true;
  }
  // Redraw only when play returns to the player. Remove casualties and their combos from every pile.
  function deal(deck,party){
    const ids=library(party).map(c=>c.id),valid=new Set(ids),size=ids.length===3?2:3;
    if(deck.pending){deck.queue.push(deck.pending);deck.pending=null;deck.turn++;}
    deck.queue=deck.queue.filter(id=>valid.has(id));
    deck.hand=deck.hand.map(id=>valid.has(id)?id:null);
    for(const id of ids)if(!deck.queue.includes(id)&&!deck.hand.includes(id))deck.queue.push(id);
    // Leave unspent cards in their slots whenever the hand size permits it.
    if(deck.hand.length>size)deck.queue.push(...deck.hand.splice(size).filter(Boolean));
    for(let i=0;i<size;i++)if(!deck.hand[i])deck.hand[i]=deck.queue.shift();
  }
  return {library,create,commit,deal};
})();
