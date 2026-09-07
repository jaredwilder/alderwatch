import {mkdir,readFile,rename,stat,unlink,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=join(ROOT,'public','assets','medieval');
const REV='9e69e3d8898f8105d06ceac92c95981482810163';
const RAW=`https://raw.githubusercontent.com/jm-sky/seedvale/${REV}/public/models/settlement`;
const BASE={megakit:`${RAW}/megakit`,settlement:RAW};

// License-clean authored source raid. MegaKit and Ultimate Fantasy RTS settlement
// assets below are Quaternius CC0 1.0, pinned through Seedvale's audited mirror.
const FILES=[
 ['megakit','wall_plaster_straight.glb'],['megakit','wall_plaster_door_flat.glb'],['megakit','wall_plaster_window_wide_flat.glb'],
 ['megakit','doorframe_flat_wooddark.glb'],['megakit','door_1_flat.glb'],['megakit','window_wide_flat1.glb'],['megakit','corner_exterior_wood.glb'],
 ['megakit','roof_roundtiles_6x6.glb'],['megakit','chimney.glb'],['megakit','crate.glb'],['megakit','wagon.glb'],['megakit','fence_wood_single.glb'],
 ['megakit','fence_wood_ext1.glb'],['megakit','fence_wood_ext2.glb'],['megakit','support.glb'],['megakit','stairs_exterior.glb'],['megakit','floor_wooddark.glb'],
 ['megakit','roof_wooden_2x1.glb'],['megakit','wall_arch.glb'],['megakit','vine_1.glb'],['megakit','border_straight.glb'],
 // Complete authored medieval buildings and lived-in props. These are deliberately
 // whole silhouettes, not another pass of tiny modular dressing.
 ['settlement','hut_a.glb'],['settlement','hut_b.glb'],['settlement','hut_c.glb'],['settlement','hut_d.glb'],['settlement','towerhouse.glb'],
 ['settlement','watchtower.glb'],['settlement','barracks.glb'],['settlement','storage.glb'],['settlement','market.glb'],['settlement','towncenter.glb'],
 ['settlement','windmill.glb'],['settlement','well.glb'],['settlement','wall.glb'],['settlement','farm.glb'],['settlement','crops.glb'],
 ['settlement','barrel.glb'],['settlement','cauldron.glb'],['settlement','hay.glb'],['settlement','wood_pile.glb'],['settlement','lantern.glb'],['settlement','torch.glb'],
 ['settlement','campfire_burning_q.glb'],
];

await mkdir(OUT,{recursive:true});
const glbHeader=bytes=>bytes.length>=4&&bytes[0]===0x67&&bytes[1]===0x6c&&bytes[2]===0x54&&bytes[3]===0x46;
async function valid(path){try{const s=await stat(path);if(s.size<1000)return false;const h=await readFile(path,{encoding:null});return glbHeader(h);}catch{return false;}}
for(const [source,file] of FILES){
 const target=join(OUT,file);
 if(await valid(target)){console.log(`medieval: ${file} already present`);continue;}
 const response=await fetch(`${BASE[source]}/${file}`,{redirect:'follow'});
 if(!response.ok)throw new Error(`Failed to download ${file}: HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length<1000||!glbHeader(bytes))throw new Error(`Invalid medieval GLB ${file} (${bytes.length} bytes)`);
 const tmp=`${target}.tmp-${process.pid}`;await writeFile(tmp,bytes);
 try{await rename(tmp,target);}catch(error){await unlink(tmp).catch(()=>{});throw error;}
 console.log(`medieval: fetched ${file} (${bytes.length} bytes)`);
}
