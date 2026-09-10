import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OBSERVER_GRASS_RINGS} from '../src/observer-grass-clipmap';
import {conservativeObserverVisibilityCeiling,conservativeQualityCeiling,countActiveMatrixSlots,matrixSlotHasArea,observerGrassRank,observerMetric2d,shouldSubmitObserverGrass} from '../src/performance-closure';

const smooth=(a:number,b:number,x:number)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a||1)));return t*t*(3-2*t);};
const shaderVisibility=(distance:number,quality:number,spec:(typeof OBSERVER_GRASS_RINGS)[number])=>{
 const inner=spec.fadeFull<=spec.fadeIn?1:smooth(spec.fadeIn,spec.fadeFull,distance),outer=1-smooth(spec.fadeStart,spec.fadeOut,distance);return Math.max(0,Math.min(1,inner*outer*quality));
};

test('quality compaction ceiling can only overestimate shader quality',()=>{
 for(let q=0;q<=1;q+=.001){const ceiling=conservativeQualityCeiling(q);assert.ok(ceiling+1e-12>=q);assert.ok(ceiling<=1);}
});

test('observer compaction never removes a tuft the current shader could admit during its motion guard',()=>{
 for(const spec of OBSERVER_GRASS_RINGS){
  const margin=Math.max(.2,Math.min(1.25,spec.cell*.32))*1.12;
  for(const quality of [.56,.7,.84,1])for(let distance=0;distance<=spec.fadeOut+20;distance+=2.17){
   const ceiling=conservativeObserverVisibilityCeiling(distance,quality,spec,margin);
   assert.ok(ceiling>=0&&ceiling<=1);
   for(const rank of [.03,.17,.41,.67,.89,.98]){
    if(shouldSubmitObserverGrass(rank,distance,quality,spec,margin))continue;
    for(const delta of [-margin,-margin*.5,0,margin*.5,margin]){
     const d=Math.max(0,distance+delta),visible=shaderVisibility(d,quality,spec);
     assert.ok(rank>visible,`${spec.id}: omitted rank ${rank} must remain above shader visibility ${visible}`);
    }
   }
  }
 }
});

test('grass rank and Lp metric are deterministic and bounded',()=>{
 const spec=OBSERVER_GRASS_RINGS[3];const first=observerGrassRank(81.25,-43.75,spec);assert.equal(first,observerGrassRank(81.25,-43.75,spec));assert.ok(first>=0&&first<1);
 assert.equal(observerMetric2d(0,0,spec.metricPower),0);assert.ok(observerMetric2d(100,100,4)<observerMetric2d(100,100,2));
});

test('zero-scale instance slots are removed without touching visible transforms',()=>{
 const visible=[1,0,0,0,0,1,0,0,0,0,1,0,4,2,-3,1],hidden=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1];
 const payload=new Float32Array([...visible,...hidden,...visible]);
 assert.equal(matrixSlotHasArea(payload,0),true);assert.equal(matrixSlotHasArea(payload,16),false);assert.equal(countActiveMatrixSlots(payload),2);
});

test('performance closure remains no-quality-loss work',()=>{
 const runtime=readFileSync(new URL('../src/performance-closure-runtime.ts',import.meta.url),'utf8'),tavern=readFileSync(new URL('../src/tavern-bridge.ts',import.meta.url),'utf8');
 assert.match(runtime,/mesh\.frustumCulled=true/);assert.match(runtime,/shouldSubmitObserverGrass/);assert.match(runtime,/matrixSlotHasArea/);
 assert.match(runtime,/suspendMethod\(Nature\.prototype,'update'\)/);assert.match(runtime,/setInstancedInteriorActive/);
 assert.doesNotMatch(tavern,/canvas\.style\.filter=tavern\.inside/);assert.match(tavern,/tavern-atmosphere/);assert.match(tavern,/hudQueued/);
});

test('performance closure is explicit and cannot re-enter the startup-critical graph',()=>{
 const bootstrap=readFileSync(new URL('../src/bootstrap.ts',import.meta.url),'utf8'),tavern=readFileSync(new URL('../src/tavern-bridge.ts',import.meta.url),'utf8'),runtime=readFileSync(new URL('../src/performance-closure-runtime.ts',import.meta.url),'utf8'),extensions=readFileSync(new URL('../src/runtime-extensions.ts',import.meta.url),'utf8');
 assert.doesNotMatch(bootstrap,/import\(['"]\.\/performance-closure-runtime['"]\)/,'bootstrap must not eagerly import the performance runtime');
 assert.doesNotMatch(tavern,/from ['"]\.\/performance-closure-runtime['"]/,'tavern bridge must not statically pull the performance runtime back into main');
 assert.match(runtime,/export function installPerformanceClosure\(\)/,'runtime installation must be an explicit API');
 assert.doesNotMatch(runtime,/typeof window[^\n]*installPerformanceClosure\(\)/,'module evaluation must not self-install');
 assert.match(extensions,/document\.querySelector\('#loading'\)/,'post-boot installer must wait for the real loader to disappear');
 assert.match(extensions,/import\('\.\/performance-closure-runtime'\)/,'optional extensions may dynamically import performance closure only after boot');
 assert.match(extensions,/module=>module\.installPerformanceClosure\(\)/);
 assert.match(runtime,/dataset\.awInterior==='tavern'/,'interior suspension must work without a tavern-to-performance static import');
});
