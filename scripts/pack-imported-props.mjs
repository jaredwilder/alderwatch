import fs from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,dedup,textureCompress} from '@gltf-transform/functions';
import sharp from 'sharp';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
await fs.mkdir('public/assets/art',{recursive:true});
for(const name of ['market_stall','barrel']){
 const doc=await io.read(`assets/source/visual-pass/${name}.glb`);
 if(doc.getRoot().listMeshes().length!==1)throw new Error('Unexpected extra mesh in '+name);
 await doc.transform(prune(),dedup(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[2048,2048],quality:90}));
 await io.write(`public/assets/art/${name}.glb`,doc);
 console.log(name,(await fs.stat(`public/assets/art/${name}.glb`)).size);
}
