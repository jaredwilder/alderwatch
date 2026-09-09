import {mkdir, readFile, rename, stat, unlink, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=join(ROOT,'public','assets','animals');

const SOURCES=[
 {name:'hare',file:'hare.glb',minBytes:220_000,url:'https://raw.githubusercontent.com/JacksonHe04/iNon/a4b591ccec462e7413b703903f20fecaeee2bce8/public/archive-world/quaternius-animals/Bunny.glb'},
 {name:'crow',file:'crow.glb',minBytes:85_000,url:'https://raw.githubusercontent.com/danajerban/erbandanaj.com/da89c1ea30957fe61b8b113a9b045cc6acbfae95/public/models/Pigeon.glb'},
 {name:'goat',file:'goat.glb',minBytes:100_000,url:'https://raw.githubusercontent.com/SeloSlav/medieval-settlement-threejs/adebb282df90627f3ec63c8e89f076cf1cf14fe9/public/assets/models/livestock/quaternius-goat.glb'},
 {name:'sheep',file:'sheep.glb',minBytes:220_000,expectedBytes:223_324,url:'https://raw.githubusercontent.com/AncheJeez/LearningGodot/baf5a889679d6b735ad5316a4d326e2864a5af5f/Model/LowPoly/Sheep%20by%20Quaternius%20-%20rgJXF570ZK.glb'},
 {name:'deer',file:'deer.glb',minBytes:300_000,url:'https://raw.githubusercontent.com/SeloSlav/medieval-settlement-threejs/adebb282df90627f3ec63c8e89f076cf1cf14fe9/public/assets/models/deer/quaternius-deer.glb'},
 {name:'bear',file:'bear.glb',minBytes:300_000,url:'https://raw.githubusercontent.com/TuanTran0168/myunivokai-personalized-3d-worlds/9112af6c04ea14cd849ca90f82f45c875d3c7f50/apps/myunivokai-personalization/public/assets/nature/models/animal-bear.glb'},
 {name:'bison',file:'bison.glb',minBytes:900_000,url:'https://raw.githubusercontent.com/SeloSlav/medieval-settlement-threejs/adebb282df90627f3ec63c8e89f076cf1cf14fe9/public/assets/models/livestock/quaternius-bull.glb'},
 {name:'wolf',file:'wolf.glb',minBytes:1_500_000,url:'https://raw.githubusercontent.com/StateDev08/War-of-the-Kindom-Mobile/9b5a2827ed8f2b7adf657ddf7e47cb026bab0b39/client/assets/models/quaternius/animals/wolf.glb'},
 {name:'eagle',file:'eagle.glb',minBytes:3_000_000,url:'https://raw.githubusercontent.com/maramilod/LYMonada/677cdce7c62c731bc46fd59edebc40e4e2376dd4/src/assets/3d/eagle.glb'},
];

await mkdir(OUT,{recursive:true});

function glbHeader(bytes){return bytes.length>=4&&bytes[0]===0x67&&bytes[1]===0x6c&&bytes[2]===0x54&&bytes[3]===0x46;}

async function validExisting(path,source){
 try{
  const s=await stat(path);
  if(s.size<source.minBytes||(source.expectedBytes&&s.size!==source.expectedBytes))return false;
  const h=await readFile(path,{encoding:null});return glbHeader(h);
 }catch{return false;}
}

for(const source of SOURCES){
 const target=join(OUT,source.file);
 if(await validExisting(target,source)){
  console.log(`animals: ${source.name} already present`);
  continue;
 }
 const response=await fetch(source.url,{redirect:'follow'});
 if(!response.ok)throw new Error(`Failed to download ${source.name}: HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length<source.minBytes||(source.expectedBytes&&bytes.length!==source.expectedBytes)||!glbHeader(bytes))throw new Error(`Invalid ${source.name} GLB (${bytes.length} bytes)`);
 const tmp=`${target}.tmp-${process.pid}`;
 await writeFile(tmp,bytes);
 try{await rename(tmp,target);}catch(error){await unlink(tmp).catch(()=>{});throw error;}
 console.log(`animals: fetched ${source.name} (${bytes.length} bytes)`);
}
