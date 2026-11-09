window.KM=window.KM||{};
KM.I18n=(()=>{
 const key='knightMath.language';let lang='en';try{lang=localStorage.getItem(key)==='ja'?'ja':'en';}catch(_){}
 const jp=()=>lang==='ja';
 function set(value){lang=value==='ja'?'ja':'en';try{localStorage.setItem(key,lang);}catch(_){}document.documentElement.lang=lang;return lang;}
 const patterns=[
 [/^(.+) It's (.+)!$/,(a,b)=>`${t(a)} 答えは${b}だ！`],
 [/^(\d+) beats (\d+)\. Fine, I'll come\.$/,(a,b)=>`${a}対${b}でお前の勝ちだ。よし、行こう。`],
 [/^(.+) joins!$/,a=>`${t(a)}が仲間になった！`],
 [/^(.+)\.\.\. you're a newt now\. Pass\.$/,a=>`${t(a)}……お前はイモリだ。通れ。`],
 [/^Here lies Sir (.+)\. Died at (.+) leagues\. Probably doing long division\.$/,(a,b)=>`騎士${a}、ここに眠る。${b}リーグ地点。死因はたぶん筆算。`],
 [/^Sir (.+)\. Carried the one\. Dropped it\. \((.+) leagues\)$/,(a,b)=>`騎士${a}。繰り上がった一を落とした。${b}リーグ。`],
 [/^R\.I\.P\. Sir (.+)\. (.+) leagues\. Forgot to borrow from the tens\.$/,(a,b)=>`騎士${a}、安らかに。${b}リーグ。十の位から借りるのを忘れた。`],
 [/^Here lies Sir (.+)\. Insisted 7 times 8 was 54\.$/,a=>`騎士${a}、ここに眠る。七八は五十四と言い張った。`],
 [/^Sir (.+)\. (.+) leagues\. Thought the riddle was optional\.$/,(a,b)=>`騎士${a}。${b}リーグ。なぞなぞは任意だと思っていた。`],
 [/^R\.I\.P\. Sir (.+)\. Slain by a remainder\.$/,a=>`騎士${a}、安らかに。余りに倒された。`],
 [/^Sir (.+)\. Brave\. Bold\. Off by one\. \((.+) leagues\)$/,(a,b)=>`騎士${a}。勇敢。大胆。一つ数え違い。${b}リーグ。`],
 [/^Here lies Sir (.+)\. Counted on fingers\. Ran out of fingers\.$/,a=>`騎士${a}、ここに眠る。指で数えた。指が足りなかった。`],
 [/^Your journey: (.+) leagues$/,a=>`旅の距離：${a}リーグ`],
 [/^(crit )?([+−-]?[\d.]+) (?:gold|coppers?)$/,(a,b)=>`${a?'会心！ ':''}${b} 銅貨`],

 [/^(.+)\? Really\? \.\.\.Fine\. Off you go, Sir (.+)\. Try not to die\.$/,(a,b)=>`${a}？ 本当に？ ……まあよい。行け、騎士${b}。死ぬでないぞ。`],
 [/^It's (.+)! Can't count\? Roll me for it, then\.$/,a=>`答えは${a}だ！ 数えられんのか。ならサイコロで決めよう。`],
 [/^It was "(.+)"\. Now limp off\.$/,a=>`答えは「${t(a)}」だ。さっさと行け。`],
 [/^Killed by (.+)\.$/,a=>`${t(a)}に倒された。`],
 [/^Ask (.+) to join$/,a=>`${t(a)}を仲間に誘う`],
 [/^Recruit (.+)$/,a=>`${t(a)}を誘う`],
 [/^(.+)! Marginally less scruffy\.$/,a=>`${t(a)}！ 少しはましな身なりになったな。`],
 [/^(.+)! Oh no\. Right\. Onwards\.$/,a=>`${t(a)}！ なんてこった。よし、先へ進もう。`],
 [/^Not (.+)! He owed me money\.$/,a=>`${t(a)}が！ まだ金を返してもらってないのに。`],
 [/^(.+) has stopped being alive\.$/,a=>`${t(a)}が生きるのをやめた。`],
 [/^You are venturing further.*clever thing.*$/i,()=> '今までで一番遠くまで来たぞ。やるじゃないか。'],
 [/^(\+?\d+) · (\d+) survivors?$/,(a,b)=>`${a}点・生存者${b}人`],
 [/^Final score (-?\d+)$/,a=>`合計得点 ${a}`],
 [/^Score (-?\d+)$/,a=>`得点 ${a}`],
 [/^hunters \+(\d+)$/,a=>`追っ手 ＋${a}`],
 [/^Roll (.+)$/,a=>`サイコロ ${a}`],
 [/^(\d+) uses left$/,a=>`残り${a}回`],
 [/^([\d.]+) to each foe$/,a=>`敵全体に${a}ダメージ`]
 ];
 const names={Rustalot:'サビだらけ卿',Mildew:'カビ卿',Soggybottom:'ずぶ濡れ卿','Not-Quite-Appearing':'出そうで出ない卿',Mutterwick:'ぶつぶつ修道士',Shrubbington:'シュラビントン','Clip-Clop':'パカパカ卿',Wobblesworth:'ふらふら卿','Lance-a-Little':'ちび槍卿','Gerald the Mostly Brave':'だいたい勇敢なジェラルド',Pottage:'シチュー卿',Quibble:'屁理屈卿',Hedgewick:'生け垣卿',Snoresalot:'いびき卿',Neeeville:'ニー卿',Thwackwell:'ごつん修道士',Miscount:'数え違い修道士'};
 const fragments=()=>{
  const entries=Object.entries(window.KM_JA||{}).filter(([k])=>k.length>3);
  for(const [name,ja]of Object.entries(names))for(const title of ['', 'Sir ', 'Dame ', 'Brother '])entries.push([title+name,ja]);
  const dict=new Map(entries),escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  // One pass, whole phrases: "Rest" must not turn "Restoration" into mixed script.
  // The leading boundary is a captured character, not a lookbehind (Safari before 16.4 cannot parse lookbehind at all).
  return {dict,re:new RegExp('(^|[^A-Za-z0-9_])(?:'+[...dict.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|')+')(?![A-Za-z0-9_])','g')};
 };
 let parts=null;
 function t(value){
  const text=String(value??'');if(!jp())return text;
  const s=text.trim(),dict=window.KM_JA||{};if(dict[s])return text.replace(s,dict[s]);
  for(const [re,fn]of patterns){if(re.test(s))return s.replace(re,(_, ...args)=>fn(...args.slice(0,-2)));}
  const name=s.replace(/^(Sir|Dame|Brother) /,'');if(names[name])return names[name];
  // Text adjacent to icons, names and dynamic quantities is split into DOM text nodes.
  // Replace only whole English phrases, never asset paths, IDs or input values.
  parts=parts||fragments();return text.replace(parts.re,(m,pre)=>pre+parts.dict.get(m.slice(pre.length)));
 }
 function translate(root){
  if(!jp()||!root||!document.createTreeWalker)return;
  const walker=document.createTreeWalker(root,4);let n;
  while(n=walker.nextNode()){if(n.parentElement?.closest('script,style,textarea,[data-no-translate]'))continue;n.nodeValue=t(n.nodeValue);}
  const els=[...(root.querySelectorAll?.('[title],[aria-label],[placeholder]')||[])];
  for(const el of els){if(el.closest('[data-no-translate]'))continue;for(const a of ['title','aria-label','placeholder']){if(el.hasAttribute(a))el.setAttribute(a,t(el.getAttribute(a)));}}
 }
 function html(s){if(!jp()||!document.createTreeWalker)return s;const temp=document.createElement('template');temp.innerHTML=s;translate(temp.content);return temp.innerHTML;}
 function wrap(text,width,measure){
  const lines=[];let row='';for(const c of String(text)){if(row&&measure(row+c)>width&&!/[、。！？）」]/.test(c)){lines.push(row);row='';}row+=c;}if(row)lines.push(row);return lines;
 }
 const riddles=()=>jp()?KM_JP_CONTENT.riddles:KM_DATA.riddles;
 const words=()=>jp()?Object.keys(KM_JP_CONTENT.words):KM_DATA.words.fire;
 const kana=word=>jp()?String(word).split(' ').map(w=>KM_JP_CONTENT.words[w]||'').join('　'):'';
 document.documentElement.lang=lang;
 return {t,jp,set,translate,html,wrap,riddles,words,kana,language:()=>lang};
})();
