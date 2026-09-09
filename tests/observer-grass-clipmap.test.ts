import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {groundMaterial} from '../src/ground-material';
import {OBSERVER_GRASS_RINGS,clipmapBudget,clipmapOrigin,combinedObserverCoverage,enteringClipmapCells,grassTrianglesPerCell,observerHash,observerMetric,observerRingVisibility,slotForCell} from '../src/observer-grass-clipmap';

test('observer grass cost stays fixed while explicit grass reaches the long horizon',()=>{
 const budget=clipmapBudget();
 assert.deepEqual(budget,{slots:40128,maxTriangles:676096,drawCalls:6});
 assert.ok(budget.maxTriangles<700000);
 const vista=OBSERVER_GRASS_RINGS.find(r=>r.id==='vista')!;
 assert.ok(vista.cell*vista.size/2>400,'vista torus must physically cover more than 400m per axis');
 assert.ok(vista.fadeOut>=380,'explicit grass should remain eligible to roughly 380m');
 assert.equal(grassTrianglesPerCell(vista),8,'vista uses one crossed two-ribbon tuft, not dense hero geometry');
});

test('six stochastic bands overlap without another hard savannah seam',()=>{
 for(const spec of OBSERVER_GRASS_RINGS){
  assert.ok(spec.fadeOut<=spec.cell*spec.size/2,`${spec.id} fade must finish before torus edge`);
  assert.ok(observerRingVisibility(spec.fadeStart,spec)>.99,`${spec.id} should be fully visible before its outer fade`);
 }
 for(let distance=0;distance<=350;distance+=.5)assert.ok(combinedObserverCoverage(distance)>=.68,`coverage dip at ${distance}m`);
});

test('Lp horizon metric spends torus corners instead of throwing them away behind a circle',()=>{
 const euclidean=observerMetric(100,100,2),superellipse=observerMetric(100,100,4);
 assert.ok(superellipse<euclidean*.85,'p=4 metric should materially reclaim square-corner capacity');
 const hero=OBSERVER_GRASS_RINGS.find(r=>r.id==='hero')!,vista=OBSERVER_GRASS_RINGS.find(r=>r.id==='vista')!;
 assert.equal(hero.metricPower,2);assert.equal(vista.metricPower,4);
});

test('toroidal clipmap updates only newly exposed rows and columns at every scale',()=>{
 for(const ring of OBSERVER_GRASS_RINGS){
  const a=clipmapOrigin(0,0,ring),right=clipmapOrigin(ring.cell*1.01,0,ring),diag=clipmapOrigin(ring.cell*1.01,ring.cell*1.01,ring);
  assert.equal(enteringClipmapCells(a,right,ring.size).length,ring.size);
  assert.equal(enteringClipmapCells(a,diag,ring.size).length,ring.size*2-1);
  assert.ok(enteringClipmapCells(a,right,ring.size).length<ring.size*ring.size/40);
 }
});

test('world cells recycle toroidal slots without changing deterministic identity',()=>{
 const hero=OBSERVER_GRASS_RINGS[0],a=clipmapOrigin(0,0,hero),gx=a.x,gz=a.z+7;
 assert.equal(slotForCell(gx,gz,hero.size),slotForCell(gx+hero.size,gz,hero.size));
 const first=observerHash(gx,gz,hero.seed+73),again=observerHash(gx,gz,hero.seed+73);
 assert.equal(first,again);assert.ok(first>=0&&first<1);
});

test('terrain shader bridges distant geometry into statistical green biomass with zero new texture objects',()=>{
 const textures:Record<string,T.Texture>={};
 for(const key of ['field-color','litter-color','field-normal','litter-normal','field-rough','litter-rough'])textures[key]=new T.Texture();
 const material=groundMaterial(textures['field-color']!,textures['litter-color']!,textures);
 const shader:any={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <normal_fragment_maps>'};
 material.onBeforeCompile(shader,{} as any);
 assert.match(shader.fragmentShader,/awGroundNear/);assert.match(shader.fragmentShader,/fineUv/);assert.match(shader.fragmentShader,/microDetail\*\.58/);
 assert.match(shader.fragmentShader,/awMeadowBridge/);assert.match(shader.fragmentShader,/awCanopyTint/);
 assert.match(material.customProgramCacheKey(),/observer-detail-ground-v3-horizon-bridge/);
 const awUniforms=Object.keys(shader.uniforms).filter(k=>k.startsWith('aw'));
 assert.equal(awUniforms.length,7,'six texture inputs plus one scalar perceptual-market control');
 assert.equal(awUniforms.filter(k=>shader.uniforms[k]?.value instanceof T.Texture).length,6,'the market must not add another texture object');
 assert.equal(shader.uniforms.awGroundDetailQuality?.value,1);
});
