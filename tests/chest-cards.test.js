// Chest cards behind ?chestcards=1 (Magnus): upgrade cards only from the chest a stronger foe guards; shops just sell.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=search=>fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace("search:'?debug&notimer'",`search:'${search}'`)
 .replace("'src/modes/spelling.js'])run(f);","'src/modes/spelling.js','src/engine/balance-try.js','src/engine/upgrade-cards.js','src/engine/chest-cards.js'])run(f);")
 .replace('submitAnswer};','submitAnswer,setChallengeMode,renderRest,takeCard,defeatEnemy};')
 .replace('s.enemy===id','s.enemy===id || s.rest===id || s.type===id');
const body=`
run('src/modes/fellowship.js');
const BT=scope.KM.BalanceTry,CC=scope.KM.ChestCards;
const advance=(sec=3)=>{for(let i=0;i<Math.ceil(sec/.02);i++)flush(.02);};
function fresh(where){reset();g.setChallengeMode('fellowship');S.routeVersion=3;S.runId='chest';S.stats={correct:0,wrong:0,riddles:0};S.score=0;S.scoreLedger=scope.KM.Score.empty();S.spells=0;S.spellLeft=0;S.mead=0;S.floats=[];S.cards=[];
 S.hp=g.maxHp();g.buildWorld(0);at(where);advance(3);return S.enc;}
const out={on:BT.on('chestCards'),cards:BT.on('cards')};
// a guarded fight: win -> chest shines -> pick -> the fight ends
let e=fresh('goblin');out.guarded=CC?CC.guarded(e.st):false;
if(out.on){e.act.hp=0;e.hp=0;g.defeatEnemy();advance(D.chestCards.delayMs/1000+.1);out.phase=e.phase;out.open=!!e.st.chestOpen;out.pickEarly=!!e.cardPick;
 advance(D.chestCards.shine.ms/1000+.1);out.pick=!!e.cardPick&&/takeCard/.test(nodes.get('panel').innerHTML);const id=e.cardOptions[0];g.takeCard(id);out.took=S.cards.includes(id);out.ended=S.enc!==e;
 out.sfx=[...scope.__played||[]];}
// a shop: no upgrade card offer
fresh('shop');S.enc.cardPick=false;g.renderRest();out.shopCards=/openCards|takeCard/.test(nodes.get('panel').innerHTML)||!!S.enc.cardPick;
// no other source: campsite, tavern, riddle offer no upgrade card with the switch
out.others={};for(const w of ['campsite','tavern','riddle']){const q=fresh(w);if(q.phase==='rest'||w!=='riddle')g.renderRest&&q.phase==='rest'&&g.renderRest();out.others[w]=!!(q.cardOptions&&q.cardOptions.length)||/openCards|takeCard/.test(nodes.get('panel').innerHTML);}
// a weak foe guards nothing
e=fresh('rabid_squirrel');out.dog=CC?CC.guarded(e.st):false;
module.exports=out;`;
function exec(src){const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(src,__filename);return m.exports;}
const on=exec(harness('?debug&notimer&chestcards=1')+body),off=exec(harness('?debug&notimer&cards=1')+body);
const ctx={};ctx.window=ctx;require('node:vm').createContext(ctx);require('node:vm').runInContext(fs.readFileSync(path.join(root,'src/data/balance_try.js'),'utf8'),ctx);assert.equal(ctx.KM_DATA.balanceTry.chestCards,false,'off by default');
assert(on.on&&on.cards,'chestcards turns on the cards');assert(on.guarded,'goblin guards a chest');assert(!on.dog,'rabid squirrel guards nothing');
assert.equal(on.phase,'chest');assert(on.open,'chest unlocked');assert(!on.pickEarly,'shine first');assert(on.pick,'then the pick');assert(on.took&&on.ended,'one card, then the fight ends');
assert.equal(on.shopCards,false,'shops: no upgrade cards with the switch');for(const [w,v] of Object.entries(on.others))assert.equal(v,false,w+': no upgrade card with the switch');
assert.equal(off.shopCards,true,'switch off: the shop offers cards as before');assert.equal(off.others.campsite,true,'switch off: campsite still offers (probe works)');
console.log('PASS: chest cards: guarded foes only, shine -> unlock -> pick -> fight ends, shops only sell; off = cards at shops as before.');
