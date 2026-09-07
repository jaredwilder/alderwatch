import {mkdir,readFile,rename,stat,unlink,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const OUT=join(ROOT,'public','assets','medieval');
const REV='9e69e3d8898f8105d06ceac92c95981482810163';
const BASE=`https://raw.githubusercontent.com/jm-sky/seedvale/${REV}/public/models/settlement/megakit`;

// Quaternius Medieval Village MegaKit, Standard/free edition, CC0 1.0.
// The Seedvale mirror contains the original kit converted to optimized, self-contained GLB.
const FILES=[
 'wall_plaster_straight.glb',
 'wall_plaster_door_flat.glb',
 'wall_plaster_window_wide_flat.glb',
 'doorframe_flat_wooddark.glb',
 'door_1_flat.glb',
 'window_wide_flat1.glb',
 'corner_exterior_wood.glb',
 'roof_roundtiles_6x6.glb',
 'chimney.glb',
 'crate.glb',
 'wagon.glb',
 'fence_wood_single.glb',
 // Raid pass: authored clutter / fortification pieces for frontier camps.
 'fence_wood_ext1.glb',
 'fence_wood_ext2.glb',
 'support.glb',
 'stairs_exterior.glb',
 'floor_wooddark.glb',
 'roof_wooden_2x1.glb',
 'wall_arch.glb',
 'vine_1.glb',
 'border_straight.glb',
];

await mkdir(OUT,{recursive:true});
const glbHeader=bytes=>bytes.length>=4&&bytes[0]===0x67&&bytes[1]===0x6c&&bytes[2]===0x54&&bytes[3]===0x46;
async function valid(path){try{const s=await stat(path);if(s.size<1000)return false;const h=await readFile(path,{encoding:null});return glbHeader(h);}catch{return false;}}
for(const file of FILES){
 const target=join(OUT,file);
 if(await valid(target)){console.log(`medieval: ${file} already present`);continue;}
 const response=await fetch(`${BASE}/${file}`,{redirect:'follow'});
 if(!response.ok)throw new Error(`Failed to download ${file}: HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length<1000||!glbHeader(bytes))throw new Error(`Invalid medieval GLB ${file} (${bytes.length} bytes)`);
 const tmp=`${target}.tmp-${process.pid}`;await writeFile(tmp,bytes);
 try{await rename(tmp,target);}catch(error){await unlink(tmp).catch(()=>{});throw error;}
 console.log(`medieval: fetched ${file} (${bytes.length} bytes)`);
}
