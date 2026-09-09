import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {detailGrassPlacements} from '../src/visual-detail-overdrive';
import {groundMaterial} from '../src/ground-material';
import {roadX} from '../src/terrain';
import {trailDistance} from '../src/worldgen';

test('near-field detail grass is deterministic, bounded and road-safe',()=>{
 const a=detailGrassPlacements(),b=detailGrassPlacements();
 assert.ok(a.length>=2500,`detail pass too sparse: ${a.length}`);
 assert.ok(a.length<=18000,`detail pass exceeded hard cap: ${a.length}`);
 assert.deepEqual(a.slice(0,80).map(p=>[p.x,p.z,p.scale.x,p.scale.y,p.yaw]),b.slice(0,80).map(p=>[p.x,p.z,p.scale.x,p.scale.y,p.yaw]));
 for(const p of a){
  const road=p.z>45?trailDistance(p.x,p.z):Math.abs(p.x-roadX(p.z));
  assert.ok(road>=3.05-1e-9,`detail grass invaded road at ${p.x},${p.z}`);
  assert.ok(p.scale.y>=.34&&p.scale.y<=.68);
 }
});

test('lush pass composes with the observer-detail ground shader already on main',()=>{
 const textures:Record<string,T.Texture>={};
 for(const key of ['field-color','litter-color','field-normal','litter-normal','field-rough','litter-rough'])textures[key]=new T.Texture();
 const material=groundMaterial(textures['field-color']!,textures['litter-color']!,textures);
 const shader:any={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>'};
 material.onBeforeCompile(shader,{} as any);
 assert.match(shader.fragmentShader,/awWarp/);
 assert.match(shader.fragmentShader,/awNear/);
 assert.match(shader.fragmentShader,/awFieldRough/);
 assert.match(material.customProgramCacheKey(),/observer-detail-ground/);
});
