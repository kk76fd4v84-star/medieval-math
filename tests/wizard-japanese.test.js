// Silent integration tests: actual handlers, local in-memory saves, no live browser state.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const root=process.env.GAME_ROOT||path.resolve(__dirname,'..');
let harness=fs.readFileSync(path.join(root,'tests/party-roles.test.js'),'utf8');
harness=harness.slice(0,harness.indexOf('const PA='))
 .replace("search:'?debug&notimer'","search:'?debug'")
 .replace('s.enemy===id','s.enemy===id || s.type===id')
 .replace('submitAnswer};','submitAnswer,answerRiddle,riddleWrong,hearts,wizardReward,wizardLightning,tickAnswerTimer,showTitle,newGame};');
const checks=`
const PA=scope.KM.PartyAbilities,DW=scope.KM.DarkWizard;
function fresh(){reset();S.view=null;S.spellLeft=0;S.mead=0;S.score=0;S.riddleSolved=[];S.wizardUnlocked=false;S.scoreLedger=scope.KM.Score.empty();S.fid=0;}
function wizard(){const m=g.followerFrom(D.companions.darkWizard,300);S.party.push(m);S.hp=g.maxHp();return m;}
function battle(){at('goblin');flush(1);if(S.enc.foes.length===1){const f={...S.enc.foes[0],id:'rabid_dog',x:S.enc.foes[0].x+250,hp:30,maxHp:30};S.enc.foes.push(f);S.actors.push(f);}
 S.enc.foes.forEach(f=>{f.maxHp=f.hp=30;f.active=true;f.state='idle';});}
function solve(frac,correct){g.pickAction('lightning');const e=S.enc;e.tmr.t=e.tmr.secs*frac; e.input=String(e.problem.answer+(correct?0:1));g.submitAnswer();return e;}
fresh();battle();g.pickAction('lightning');assert.equal(S.enc.phase,'choose');assert(!nodes.get('panel').innerHTML.includes('pickLightning'));
fresh();const w=wizard();assert.equal(PA.life(w),2);assert.equal(g.maxHp(),4);battle();g.renderChoice();assert(nodes.get('panel').innerHTML.includes('pickLightning'));
assert(S.enc.foes.length>1);const e=solve(.6,true), foes=e.foes.map(f=>({f,hp:f.hp}));assert.equal(e.phase,'busy');assert.equal(S.lightning.targets.length,e.foes.length);flush(.16);for(const {f,hp}of foes)assert.equal(f.hp,hp-7);assert.equal(S.hp,4);
for(const [fraction,damage]of [[.1,3],[.25,2],[.5,1],[.75,.5],[1,.5]]){
 fresh();wizard();battle();const hp=S.hp,e=solve(fraction,false),before=e.foes.map(f=>f.hp);assert.equal(S.lightning.targets.length,e.foes.length+2);flush(.16);assert.equal(S.hp,Math.max(0,hp-2*damage));e.foes.forEach((f,i)=>assert.equal(f.hp,before[i]-damage));assert.equal(S.hunters,1);
}
// Armour absorbs each wearer's lightning, without borrowing a different member's armour.
fresh();const wa=wizard();wa.armor=1;S.party[0].armor=2;battle();solve(.55,false);flush(.16);assert.equal(S.hp,4);assert.equal(wa.armor,0);assert.equal(S.party[0].armor,1);
// Riddler targets the wizard only; heals prevent his second hit from killing him.
fresh();const wr=wizard();at('riddle');assert(wr);assert(S.enc.act.sp);g.riddleWrong(0);assert.equal(S.hp,3);assert.equal(wr.riddleWounds,1);assert.equal(S.enc.phase,'busy');assert.equal(S.enc.act.state,'vanish');assert(!wr.dying);assert(!S.party[0].dying);g.hearts(1);assert.equal(wr.riddleWounds,0);flush(1);assert.equal(S.enc,null);
at('riddle');g.riddleWrong(0);assert(!wr.dying);flush(1);at('riddle');g.riddleWrong(0);assert(wr.dying);assert(!S.party[0].dying);flush(3);assert.equal(S.party.length,1);
// Three distinct encounters, no repeated credit; persistent unlock survives clearing a run.
fresh();memory.delete(scope.KM.Save.PKEY);assert(!DW.record(S,2));assert(!DW.record(S,2));assert(!DW.record(S,10));assert(!DW.unlocked());assert(DW.record(S,17));assert(DW.unlocked());assert(!DW.record(S,17));scope.KM.Save.clear();assert(DW.unlocked());
// Preview reward does not write the profile.
memory.delete(scope.KM.Save.PKEY);fresh();DW.record(S,2,false);DW.record(S,10,false);assert(DW.record(S,17,false));assert(!DW.unlocked());
// The newly unlocked roadside wizard materializes without rebuilding/renumbering the current run.
fresh();S.routeVersion=2;g.buildWorld(0);const riddleStops=S.stops.filter(s=>s.type==='riddle');const road=S.stops.find(s=>s.id==='wizard_road');assert(road&&road.cands.length===0);S.stop=riddleStops[2].idx;S.riddleSolved=riddleStops.map(s=>s.idx);S.wizardUnlocked=true;g.wizardReward();assert.equal(road.cands[0].role,'darkWizard');assert(S.actors.some(a=>a.stop===road.idx&&a.wizardRock));
// Japanese content/choice is separate from save identities and uses kana + romaji.
for(const f of ['src/i18n/ja.js','src/i18n/ja-content.js','src/engine/i18n.js'])run(f);
const I=scope.KM.I18n;I.set('ja');assert.equal(I.t('The Village Idiot'),'村のまぬけ');assert.equal(I.t('Dark lightning'),'闇の雷撃');assert.equal(memory.get('knightMath.language'),'ja');assert.equal(I.riddles().length,12);
for(const r of I.riddles()){assert(/[ぁ-ん]/.test(r.q));assert.equal(new Set(r.choices).size,r.choices.length);assert(r.choices[r.answer]);}
for(const word of I.words()){assert(/^[A-Z]+$/.test(word));assert(/[ぁ-ん]/.test(I.kana(word)));const sp=scope.KM.Spelling.start(word);for(const c of word.toLowerCase())scope.KM.Spelling.key(sp,c);assert.equal(sp.n,word.length);}
// UI grammar, dynamic labels and safe phrase matching (do not translate inside names).
assert.equal(I.t('2 uses left'),'残り2回');assert.equal(I.t('7 to each foe'),'敵全体に7ダメージ');
assert.equal(I.t('Sir Rustalot · Easy'),'サビだらけ卿 · 易');
assert.equal(I.t('Restoration'), 'Restoration');assert.equal(I.t('Scorekeeper'), 'Scorekeeper');
assert.equal(I.t('hearts'), 'ハート');assert.equal(I.t('leagues'),'リーグ');assert.equal(I.t('Journey'),'到達距離');
assert.equal(I.t('Firestarter'),'放火魔');assert.equal(I.t('Armed for this sum'),'この問題に使用中');
assert.match(I.t('R.I.P. Sir Magnus. 5 leagues. Forgot to borrow from the tens.'),/十の位から借りる/);
const answers=['フライパン','ゾウ','びん','星','スポンジ','机','紙','卵','太鼓','傘','川','鉛筆'];
I.riddles().forEach((r,i)=>assert.equal(r.choices[r.answer],answers[i]));
assert(I.riddles()[1].q.includes('れいぞうこ'));assert(!I.riddles()[7].choices.includes('かぼちゃ'));
const romaji={MAHOUTSUKAI:'まほうつかい',HOSHIZORA:'ほしぞら',KAMINARI:'かみなり',TAKARAMONO:'たからもの',TSURUGI:'つるぎ',KUSARIYOROI:'くさりよろい',HIMATSUBUSHI:'ひまつぶし',BOUKENSHA:'ぼうけんしゃ',MONOGATARI:'ものがたり',MURABITO:'むらびと',ISHIBASHI:'いしばし',YAMAMICHI:'やまみち',KURAYAMI:'くらやみ',MITSUBACHI:'みつばち',TABIBITO:'たびびと',SHIROKABE:'しろかべ'};
for(const [word,kana]of Object.entries(romaji))assert.equal(I.kana(word),kana);
assert(I.wrap('これはとても長い日本語の文章です。',70,s=>s.length*10).every(s=>s.length<=8));I.set('en');assert.equal(I.t('The Village Idiot'),'The Village Idiot');assert.equal(I.words()[0],D.words.fire[0]);
console.log('PASS: wizard gating/AoE/timing/backfire/armour, targeted riddler revenge and healing, three distinct riddles/persistent unlock/preview isolation, immediate roadside offer, Japanese riddles and romaji/kana.');
`;
const m=new Module(__filename,module);m.filename=__filename;m.paths=module.paths;m._compile(harness+checks,__filename);
