import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {groundMaterial} from '../src/ground-material';
import {OBSERVER_GRASS_RINGS,clipmapBudget,clipmapOrigin,enteringClipmapCells,observerHash,slotForCell} from '../src/observer-grass-clipmap';

test('observer grass cost is bounded by the observation bubble, not world area',()=>{
 const budget=clipmapBudget();
 assert.deepEqual(budget,{slots:5440,maxTriangles:284672,drawCalls:2});
 assert.ok(budget.maxTriangles<300000);
});

test('toroidal clipmap updates only newly exposed rows and columns',()=>{
 const hero=OBSERVER_GRASS_RINGS[0],a=clipmapOrigin(0,0,hero);
 const right=clipmapOrigin(hero.cell*1.01,0,hero),diag=clipmapOrigin(hero.cell*1.01,hero.cell*1.01,hero);
 assert.equal(enteringClipmapCells(a,right,hero.size).length,hero.size);
 assert.equal(enteringClipmapCells(a,diag,hero.size).length,hero.size*2-1);
 assert.ok(enteringClipmapCells(a,right,hero.size).length<a.x*0+hero.size*hero.size/40);
});

test('world cells recycle toroidal slots without changing deterministic identity',()=>{
 const hero=OBSERVER_GRASS_RINGS[0],a=clipmapOrigin(0,0,hero),gx=a.x,gz=a.z+7;
 assert.equal(slotForCell(gx,gz,hero.size),slotForCell(gx+hero.size,gz,hero.size));
 const first=observerHash(gx,gz,hero.seed+73),again=observerHash(gx,gz,hero.seed+73);
 assert.equal(first,again);assert.ok(first>=0&&first<1);
});

test('lush terrain shader adds readable near-field frequency without new texture objects',()=>{
 const textures:Record<string,T.Texture>={};
 for(const key of ['field-color','litter-color','field-normal','litter-normal','field-rough','litter-rough'])textures[key]=new T.Texture();
 const material=groundMaterial(textures['field-color']!,textures['litter-color']!,textures);
 const shader:any={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>'};
 material.onBeforeCompile(shader,{} as any);
 assert.match(shader.fragmentShader,/awGroundNear/);assert.match(shader.fragmentShader,/fineUv/);assert.match(shader.fragmentShader,/microDetail\*\.58/);
 assert.match(material.customProgramCacheKey(),/observer-detail-ground-v2-lush/);
 assert.equal(Object.keys(shader.uniforms).filter(k=>k.startsWith('aw')).length,6);
});
