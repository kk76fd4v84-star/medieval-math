/* Seeded selection: stable across redraws, saves and revisits. */
(function(root,f){if(typeof module==='object')module.exports=f();else root.ForegroundTiles=f()})(globalThis,()=>{
const biomes=['forest','tundra','rocky','meadow'];
function choose(biome,tileIndex,seed=1){if(!biomes.includes(biome))throw Error('Unknown biome');let n=(Math.imul(tileIndex|0,374761393)^Math.imul(seed|0,668265263)^Math.imul(biomes.indexOf(biome)+1,1274126177))>>>0;n=Math.imul(n^(n>>>13),1274126177)>>>0;n=(n^(n>>>16))>>>0;return 'strips/'+biome+'-'+(n%3+1)+'.png';}
function visible(cameraX,viewWidth,scale=1){if(!(scale>0))throw Error('Scale must be positive');const w=2172*scale,first=Math.floor(cameraX/w);return Array.from({length:Math.ceil(viewWidth/w)+2},(_,i)=>({index:first+i,x:(first+i)*w-cameraX,width:w}));}
return{choose,visible,biomes};});
