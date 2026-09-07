import {mkdir, readFile, rename, stat, unlink, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=join(ROOT,'public','assets','animals');

const SOURCES=[
 {name:'goat',file:'goat.glb',minBytes:100_000,url:'https://raw.githubusercontent.com/SeloSlav/medieval-settlement-threejs/adebb282df90627f3ec63c8e89f076cf1cf14fe9/public/assets/models/livestock/quaternius-goat.glb'},
 {name:'sheep',file:'sheep.glb',minBytes:100_000,url:'https://raw.githubusercontent.com/SeloSlav/medieval-settlement-threejs/adebb282df90627f3ec63c8e89f076cf1cf14fe9/public/assets/models/livestock/quaternius-sheep.glb'},
 {name:'deer',file:'deer.glb',minBytes:300_000,url:'https://raw.githubusercontent.com/SeloSlav/medieval-settlement-threejs/adebb282df90627f3ec63c8e89f076cf1cf14fe9/public/assets/models/deer/quaternius-deer.glb'},
 {name:'bear',file:'bear.glb',minBytes:300_000,url:'https://raw.githubusercontent.com/TuanTran0168/myunivokai-personalized-3d-worlds/9112af6c04ea14cd849ca90f82f45c875d3c7f50/apps/myunivokai-personalization/public/assets/nature/models/animal-bear.glb'},
];

await mkdir(OUT,{recursive:true});

function glbHeader(bytes){return bytes.length>=4&&bytes[0]===0x67&&bytes[1]===0x6c&&bytes[2]===0x54&&bytes[3]===0x46;}

async function validExisting(path,minBytes){
 try{const s=await stat(path);if(s.size<minBytes)return false;const h=await readFile(path,{encoding:null});return glbHeader(h);}catch{return false;}
}

for(const source of SOURCES){
 const target=join(OUT,source.file);
 if(await validExisting(target,source.minBytes)){
  console.log(`animals: ${source.name} already present`);
  continue;
 }
 const response=await fetch(source.url,{redirect:'follow'});
 if(!response.ok)throw new Error(`Failed to download ${source.name}: HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length<source.minBytes||!glbHeader(bytes))throw new Error(`Invalid ${source.name} GLB (${bytes.length} bytes)`);
 const tmp=`${target}.tmp-${process.pid}`;
 await writeFile(tmp,bytes);
 try{await rename(tmp,target);}catch(error){await unlink(tmp).catch(()=>{});throw error;}
 console.log(`animals: fetched ${source.name} (${bytes.length} bytes)`);
}
