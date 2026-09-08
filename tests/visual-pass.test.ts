import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import * as T from 'three';
import {meadowBlades,architecturalSurface} from '../src/visual-surfaces';
import {softenedAnimalGeometry} from '../src/animal-surface';
import {humanoidVisualBounds} from '../src/visual-culling';
import {model} from './load-assets';
import {Assets} from '../src/assets';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
test('architectural grain is world-metre scaled, not multiplied by imported source units',()=>{
 const material=new T.MeshStandardMaterial();architecturalSurface(material,{});const shader={vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>',uniforms:{}};
 material.onBeforeCompile(shader as any,undefined as any);assert.match(shader.vertexShader,/modelMatrix\*surfacePosition/);assert.match(shader.vertexShader,/instanceMatrix\*surfacePosition/);
});
test('architectural upgrade preserves authored PBR atlases instead of repainting them as wood',()=>{const map=new T.Texture(),normal=new T.Texture(),material=new T.MeshStandardMaterial({map,normalMap:normal});const shader=material.onBeforeCompile;architecturalSurface(material,{});assert.equal(material.map,map);assert.equal(material.normalMap,normal);assert.equal(material.onBeforeCompile,shader);});
test('assembled longhouse closes both roof ends with fitted authored gables',async()=>{const assets=new Assets();assets.kit=await model('frontier-kit');assets.medieval.roof_roundtiles_6x6=new T.Mesh(new T.BoxGeometry(6.35,2.5,6.35));assets.medieval.window_wide_flat1=new T.Group();const house=assets.authoredLonghouse(),ends=house.getObjectsByProperty('name','Finished longhouse gable');assert.equal(ends.length,2);for(const end of ends){const box=new T.Box3().setFromObject(end);assert.ok(box.max.x-box.min.x<6.36);assert.ok(Math.abs(box.min.y-3.1)<.001);assert.ok(box.max.y<5.61);}});

test('user-generated props ship with UVs, normals and embedded texture under sensible budgets',async()=>{
 for(const [name,triLimit,maxBytes,height] of [['market_stall',33000,1600000,2.7],['barrel',10000,650000,.9]] as const){
  const path=`public/assets/art/${name}.glb`,doc=await io.read(path),root=doc.getRoot();assert.equal(root.listMeshes().length,1);assert.ok(root.listTextures().some(t=>t.getImage()!.length>10000));assert.ok(fs.statSync(path).size<maxBytes);
  let tris=0,min=Infinity,max=-Infinity;for(const p of root.listMeshes()[0].listPrimitives()){for(const a of ['POSITION','NORMAL','TEXCOORD_0'])assert.ok(p.getAttribute(a));const pos=p.getAttribute('POSITION')!;for(let i=0;i<pos.getCount();i++){const y=pos.getElement(i,[])[1];min=Math.min(min,y);max=Math.max(max,y);}tris+=p.getIndices()!.getCount()/3;}
  assert.ok(tris<triLimit);assert.ok(Math.abs(max-min-height)<.03);assert.ok(Math.abs(min)<.03);
 }
});
test('visual mesh transplant preserves all original animation channel bytes and targets',async()=>{
 const doc=await io.read('public/assets/survivor.glb'),hash=createHash('sha256');
 for(const a of doc.getRoot().listAnimations()){hash.update(a.getName());for(const c of a.listChannels()){const s=c.getSampler()!;hash.update(c.getTargetNode()!.getName()+c.getTargetPath()+s.getInterpolation());for(const arr of [s.getInput()!.getArray()!,s.getOutput()!.getArray()!])hash.update(Buffer.from(arr.buffer,arr.byteOffset,arr.byteLength));}}
 assert.equal(hash.digest('hex'),'a5fa618c54e7b6408fbd0339bc29985ef4ae6dd14f2fb5384dc5b56b00f1e57e');
});
test('living meadow uses short bent blades, shared materials and a bounded triangle budget',()=>{
 const mesh=meadowBlades({value:0});mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox!.max.y<.61);assert.ok(mesh.geometry.boundingBox!.max.y>.4);assert.ok(mesh.geometry.index!.count/3<=180);assert.equal(mesh.material.map,null);assert.equal(mesh.clone().geometry,mesh.geometry);assert.equal(mesh.clone().material,mesh.material);
});
test('animal shading does not change topology, positions, skin weights or source geometry',()=>{
 const original=new T.BoxGeometry(),positions=original.attributes.position.array.slice(),weights=new T.Float32BufferAttribute(new Float32Array(original.attributes.position.count*4).fill(.25),4);original.setAttribute('skinWeight',weights);
 const soft=softenedAnimalGeometry(original);assert.notEqual(soft,original);assert.deepEqual(soft.attributes.position.array,positions);assert.deepEqual(soft.attributes.skinWeight.array,weights.array);assert.deepEqual(soft.index!.array,original.index!.array);assert.equal(softenedAnimalGeometry(original),soft);
});
test('humanoid culling uses a generous whole-body animation envelope',()=>{const mesh=new T.SkinnedMesh();humanoidVisualBounds(mesh);assert.equal(mesh.frustumCulled,true);for(const p of [new T.Vector3(0,0,0),new T.Vector3(0,2.2,0),new T.Vector3(2,1,0),new T.Vector3(0,.2,2)])assert.ok(mesh.boundingSphere!.containsPoint(p));});
test('shipping animated body vertices remain inside the culling envelope across all clips',async()=>{
 const asset=await model('survivor'),mixer=new T.AnimationMixer(asset.scene),meshes:T.SkinnedMesh[]=[];
 asset.scene.traverse(o=>{if(o instanceof T.SkinnedMesh){humanoidVisualBounds(o);meshes.push(o);}});
 for(const clip of asset.animations){mixer.stopAllAction();const action=mixer.clipAction(clip);action.reset().play();for(const fraction of [0,.25,.5,.75,.98]){action.time=clip.duration*fraction;mixer.update(0);asset.scene.updateMatrixWorld(true);for(const mesh of meshes){mesh.skeleton.update();const pos=mesh.geometry.attributes.position;for(let i=0;i<pos.count;i+=Math.max(1,Math.floor(pos.count/50))){const v=new T.Vector3().fromBufferAttribute(pos,i);mesh.applyBoneTransform(i,v);assert.ok(mesh.boundingSphere!.containsPoint(v),clip.name+' '+mesh.name+' exceeds culling bounds');}}}}
});
test('new PBR surfaces are vendored, licensed and use explicit normal map channels',()=>{const sources=JSON.parse(fs.readFileSync('public/textures/terrain/sources.json','utf8'));assert.equal(sources.length,12);for(const s of sources){assert.equal(s.license,'CC0-1.0');assert.ok(s.source.startsWith('https://dl.polyhaven.org/'));assert.ok(fs.statSync('public/textures/terrain/'+s.file).size>1000);}});
