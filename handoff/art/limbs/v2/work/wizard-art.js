(function(){
 const img='assets/wizard-riddles/v22/wizard.png';
 const bounds=[[110,9,405,482],[85,8,406,482],[135,6,404,482],[52,14,492,493],[111,10,422,493],[95,3,397,499]];
 const frames=bounds.map((b,i)=>({x:i%3*512,y:Math.floor(i/3)*512,w:512,h:512,ms:220,pivot:[270,b[3]],top:b[1]}));
 const add=(clip,ids,loop)=>KM_ART7.sequences['dark_wizard_'+clip]={img,pivot:frames[2].pivot,standTop:6,frames:ids.map(i=>frames[i]),loop};
 add('idle',[2],false);add('walk',[0,1],true);add('attack',[3],false);
 KM_ART.entities.dark_wizard={seq:{idle:'dark_wizard_idle',walk:'dark_wizard_walk',attack:'dark_wizard_attack',bless:'dark_wizard_attack'},artMul:1.25,walk:'dark_wizard',noFallbackDeath:true,box:{w:280,h:530},status:'6 authored poses; 2-frame walk, cast, seated and rear'};
 KM_REAR_PARTY.frames.dark_wizard=[[1119,515,302,496]];KM_REAR_PARTY.images.dark_wizard=img;
 for(const path of [img,'assets/wizard-riddles/riddler-left.png','assets/wizard-riddles/riddler-over.png'])KM.Assets.loadImg(path);
})();
