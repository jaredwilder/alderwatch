import fs from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {dedup, prune, resample, textureCompress} from '@gltf-transform/functions';
import sharp from 'sharp';

const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
await fs.mkdir('public/textures',{recursive:true});
for(const name of ['bark','meadow','leaves','timber','stone','grass','soil','thatch','fern']){
 const source=name==='grass'?'art/direction-v2/grass-atlas.png':name==='meadow'?'art/direction-v2/meadow-albedo.png':'art/textures/'+name+'.png';
 await sharp(source).resize(1024,1024).webp({quality:88,alphaQuality:100}).toFile('public/textures/'+name+'.webp');
}
for(const name of ['wool','leather','plaster'])await sharp('art/direction-v2/'+name+'-albedo.png').resize(1024,1024).webp({quality:90}).toFile('public/textures/'+name+'.webp');
for(const [name,source,sceneName] of [['survivor','assets/source/survivor.raw.glb','Alderwatch Characters'],['frontier-kit','assets/source/frontier-kit.raw.glb','Alderwatch Kit'],['wildlife','assets/source/wildlife.raw.glb','Alderwatch Kit']]){
 const doc=await io.read(source),root=doc.getRoot();
 const scene=root.listScenes().find(s=>s.getName()===sceneName);
 if(!scene)throw new Error('Missing authored scene '+sceneName);
 root.setDefaultScene(scene);
 for(const s of root.listScenes())if(s!==scene)s.dispose();
 for(const n of root.listNodes()){
  const extras=n.getExtras(); n.setExtras(Object.fromEntries(Object.entries(extras).filter(([k])=>['asset_family','equipment_slot','verified_hand_bone'].includes(k))));
 }
 for(const s of root.listScenes())s.setExtras({});
 // Blender's frame-one NLA exports begin at 1/fps. Normalize each clip to zero
 // so authored contact metadata and runtime animation time refer to the same pose.
 for(const animation of root.listAnimations()){
  const samplers=animation.listSamplers(),start=Math.min(...samplers.map(s=>s.getInput().getMin([])[0]));
  if(start>0){const shifted=new Map();for(const sampler of samplers){const old=sampler.getInput();if(!shifted.has(old))shifted.set(old,old.clone().setArray(Float32Array.from(old.getArray(),t=>Math.max(0,t-start))));sampler.setInput(shifted.get(old));}}
 }
 // Imported modeling masks are not surface albedo; retain only environment vertex color.
 if(name==='survivor'){
  // Keep runtime surface identities through dedup even when Blender exports the
  // same default shader for viewport-only material colors.
  const costume={AW_CostumeWool:[.32,.24,.15,1],AW_CostumeLeather:[.40,.29,.19,1],AW_Stubble:[.075,.049,.031,1]};
  for(const m of root.listMaterials()){m.setExtras({surface:m.getName()});if(costume[m.getName()])m.setBaseColorFactor(costume[m.getName()]).setRoughnessFactor(.92);}
  for(const m of root.listMeshes())for(const p of m.listPrimitives())for(const a of ['COLOR_0','COLOR_1','TEXCOORD_1','TEXCOORD_2','TEXCOORD_3'])p.setAttribute(a,null);
 }
 if(name==='frontier-kit'||name==='wildlife'){
  for(const m of root.listMaterials())m.setExtras({surface:m.getName()});
  for(const m of root.listMeshes())for(const p of m.listPrimitives()){
   const authoredColor=p.getAttribute('COLOR_1');if(authoredColor)p.setAttribute('COLOR_0',authoredColor);p.setAttribute('COLOR_1',null);
  }
 }
 await doc.transform(prune({keepLeaves:true,keepAttributes:true}),dedup(),resample(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:86}));
 await io.write('public/assets/'+name+'.glb',doc);
 console.log(name, (await fs.stat('public/assets/'+name+'.glb')).size, 'bytes',root.listAnimations().map(a=>a.getName()));
}
