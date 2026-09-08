// CC0 Poly Haven maps, vendored into the game so deployment has no new network dependency.
import fs from 'node:fs/promises';
import sharp from 'sharp';
const out='public/textures/terrain';
await fs.mkdir(out,{recursive:true});
const manifest=[];
for(const [name,id] of [['litter','forest_floor'],['field','aerial_grass_rock'],['rock','rock_face'],['oak','jolcham_oak_bark_01']]){
 const files=await(await fetch(`https://api.polyhaven.com/files/${id}`)).json();
 for(const [suffix,channel] of [['color','Diffuse'],['normal','nor_gl'],['rough','Rough']]){
  const info=files[channel]['1k'].jpg,response=await fetch(info.url);
  if(!response.ok)throw new Error(`${id}: ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  await sharp(bytes).webp({quality:suffix==='normal'?95:88}).toFile(`${out}/${name}-${suffix}.webp`);
  manifest.push({file:`${name}-${suffix}.webp`,asset:id,source:info.url,license:'CC0-1.0',page:`https://polyhaven.com/a/${id}`});
 }
}
await fs.writeFile(`${out}/sources.json`,JSON.stringify(manifest,null,2)+'\n');
console.log('Vendored',manifest.length,'1K PBR surface maps.');
