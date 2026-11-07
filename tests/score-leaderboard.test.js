// Pure accounting/persistence checks and real end-of-run integration. No user's browser storage.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),Module=require('module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const storage=new Map,ctx={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};ctx.window=ctx;vm.createContext(ctx);
for(const f of ['score.js','leaderboard.js'])vm.runInContext(fs.readFileSync(root+'/src/engine/'+f,'utf8'),ctx);
const sc=ctx.KM.Score,lb=ctx.KM.Leaderboard,rows=sc.rows({answers:[2,3,2,3],riddles:[1,2],scrolls:2,penalty:4},27,4);
assert.equal(sc.tally(rows,0).total,0);assert.equal(sc.tally(rows,100).total,35);assert(sc.tally(rows,100).complete);
const seen=new Set;for(let t=.35;t<1.5;t+=.05)seen.add(sc.tally(rows,t).total);assert(seen.size>5);
const totals=[];for(let t=0;t<30;t+=.05)totals.push(sc.tally(rows,t).total);assert(totals.some((x,i)=>i>0&&x<totals[i-1]));
for(const e of [{id:'a',name:'Alex',score:12,leagues:1,at:1},{id:'b',name:'Eve',score:16,leagues:2,at:2},{id:'c',name:'May',score:16,leagues:3,at:3}])lb.record(e);
assert.equal(lb.list()[0].id,'c');assert.equal(lb.rank('a'),3);lb.record({id:'a',score:500});assert.equal(lb.list().length,3);assert.equal(lb.list().find(r=>r.id==='a').score,12);
vm.runInContext(fs.readFileSync(root+'/src/engine/leaderboard.js','utf8'),ctx);assert.equal(ctx.KM.Leaderboard.list().length,3);assert.equal(ctx.KM.Leaderboard.record({id:'bad',score:NaN}),null);
let harness=fs.readFileSync(root+'/tests/party-roles.test.js','utf8');harness=harness.slice(0,harness.indexOf('const PA='))
 .replace("location:{search:'?debug&notimer'}","location:{search:''}")
 .replace('submitAnswer};','submitAnswer,showWin,gameOver};');
const checks=`
run('src/engine/leaderboard.js');reset();S.runId='finished-once';S.name='Alex';S.score=18;S.scoreLedger=scope.KM.Score.empty();g.showWin();
assert.equal(scope.KM.Leaderboard.list().length,1);assert.equal(scope.KM.Leaderboard.list()[0].score,20);g.showWin();assert.equal(scope.KM.Leaderboard.list().length,1);
scope.KM.Save.clear();assert.equal(scope.KM.Leaderboard.list().length,1);
reset();S.runId='failed-run';S.hp=0;S.score=-1;g.gameOver('killer_rabbit',S.stops[0]);assert.equal(scope.KM.Leaderboard.list().find(r=>r.id==='failed-run').score,-1);
scope.location.search='?debug&notimer';reset();S.runId='test-must-not-record';g.showWin();assert(!scope.KM.Leaderboard.list().some(r=>r.id==='test-must-not-record'));
console.log('PASS: score increments, deductions, reconciliation, rank/ties, one record per run, persistence, win/death integration and debug exclusion.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
