// Retired mode data stays archived; active modes never read or overwrite its run slot.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
const harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8').split('const PA=')[0]
 .replace('submitAnswer};','submitAnswer,setChallengeMode};');
const checks=`
run('src/engine/leaderboard.js');
const save=scope.KM.Save,lb=scope.KM.Leaderboard;
const archivedRun=JSON.stringify({version:7,challengeMode:'bard',name:'Archived Bard',score:23});
memory.set('knightMath.save.bard',archivedRun);
const archivedScore={mode:'bard',id:'retired-run',name:'Archived Bard',score:23};
memory.set(lb.KEY,JSON.stringify({version:1,entries:[archivedScore]}));
g.setChallengeMode('bard');assert.equal(S.challengeMode,'math');assert.equal(save.runKey(),'knightMath.save');assert.equal(save.load(),null);
for(const mode of ['math','knight']){
 g.setChallengeMode(mode);save.write({name:mode,challengeMode:mode});lb.record({mode,id:mode+'-run',name:mode,score:4});
 assert.equal(lb.list(mode).length,1);assert.equal(lb.list(mode)[0].name,mode);
}
for(const mode of ['math','knight']){g.setChallengeMode(mode);assert.equal(save.load().name,mode);}
assert.equal(memory.get('knightMath.save.bard'),archivedRun);
const archived=JSON.parse(memory.get(lb.KEY)).entries.find(e=>e.mode==='bard');
assert.equal(archived.id,'retired-run');assert.equal(archived.score,23);
g.setChallengeMode('unsupported');assert.equal(S.challengeMode,'math');
console.log('PASS: retired mode fallback, independent active saves/boards, archived Bard run and score preserved.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
