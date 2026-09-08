import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const REV='8ee4cfd789282c59632a9339e61564b7d6c1acfe';
const BASE=`https://raw.githubusercontent.com/euuuuuuan/cairnfall-public/${REV}/assets/vendor/kaykit_adventurers`;
const OUT='public/assets/characters';
const files=[
 ['Barbarian.glb',3613268],['Knight.glb',3659532],['Mage.glb',3589240],['Rogue.glb',3616284],
 ['barbarian_texture.png',15089],['knight_texture.png',14172],['mage_texture.png',16311],['rogue_texture.png',16670],
 ['Barbarian_barbarian_texture.png',15089],['Knight_knight_texture.png',14172],['Mage_mage_texture.png',16311],['Rogue_rogue_texture.png',16670],
];
const valid=(name,b,min)=>b.length>=Math.floor(min*.95)&&(name.endsWith('.glb')?b.subarray(0,4).toString()==='glTF':b.subarray(1,4).toString()==='PNG');
await mkdir(OUT,{recursive:true});
for(const [name,min] of files){
 const path=join(OUT,name);let bytes;try{bytes=await readFile(path);}catch{}
 if(!bytes||!valid(name,bytes,min)){
  const response=await fetch(`${BASE}/${name}`);if(!response.ok)throw new Error(`character asset ${name}: HTTP ${response.status}`);
  bytes=Buffer.from(await response.arrayBuffer());if(!valid(name,bytes,min))throw new Error(`character asset ${name}: invalid or truncated payload (${bytes.length} bytes)`);
  await writeFile(path,bytes);console.log(`characters: fetched ${name} (${bytes.length} bytes)`);
 }
}
