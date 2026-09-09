import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CANOPY_FULL_TO_PROXY_ANGLE,CANOPY_MASS_CUTOFF_ANGLE,CANOPY_PROXY_TO_MASS_ANGLE,HORIZON_CANOPY_FIELDS,angularDiameter,canopyRepresentation,distanceForAngularDiameter,enteringHorizonCells,horizonCanopyBudget,horizonFieldOrigin} from '../src/horizon-singularity';

const source=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('canopy LOD is governed by projected angular error rather than raw distance',()=>{
 const fullBoundary=distanceForAngularDiameter(7.2,CANOPY_FULL_TO_PROXY_ANGLE),crownBoundary=distanceForAngularDiameter(7.2,CANOPY_PROXY_TO_MASS_ANGLE),massBoundary=distanceForAngularDiameter(7.2,CANOPY_MASS_CUTOFF_ANGLE);
 assert.ok(fullBoundary>130&&fullBoundary<145);
 assert.ok(crownBoundary>320&&crownBoundary<335);
 assert.ok(massBoundary>570&&massBoundary<585);
 assert.equal(canopyRepresentation(100),'full');assert.equal(canopyRepresentation(200),'crown');assert.equal(canopyRepresentation(400),'mass');assert.equal(canopyRepresentation(650),'none');
 for(const d of [25,80,150,300,520])assert.ok(Math.abs(distanceForAngularDiameter(7.2,angularDiameter(7.2,d))-d)<1e-9);
});

test('horizon forest has a fixed observer budget independent of world size',()=>{
 assert.deepEqual(horizonCanopyBudget(),{slots:9280,maxTriangles:215040,drawCalls:2});
 const crown=HORIZON_CANOPY_FIELDS[0],mass=HORIZON_CANOPY_FIELDS[1];
 assert.ok(crown.cell*crown.size/2>360);assert.ok(mass.cell*mass.size/2>580);
 assert.ok(crown.fadeOut<=crown.cell*crown.size/2);assert.ok(mass.fadeOut<=mass.cell*mass.size/2);
});

test('horizon torus updates O(N) newly exposed cells instead of rebuilding N squared',()=>{
 for(const spec of HORIZON_CANOPY_FIELDS){
  const a=horizonFieldOrigin(0,0,spec),right=horizonFieldOrigin(spec.cell*1.01,0,spec),diag=horizonFieldOrigin(spec.cell*1.01,spec.cell*1.01,spec);
  assert.equal(enteringHorizonCells(a,right,spec.size).length,spec.size);
  assert.equal(enteringHorizonCells(a,diag,spec.size).length,spec.size*2-1);
  assert.ok(enteringHorizonCells(a,right,spec.size).length<spec.size*spec.size/40);
 }
});

test('runtime uses compact procedural canopy proxies, stochastic thinning, and no new texture path',()=>{
 const runtime=source('src/horizon-singularity-runtime.ts'),boot=source('src/bootstrap.ts');
 assert.match(runtime,/createHorizonCanopyGeometry/);assert.match(runtime,/awHDistance/);assert.match(runtime,/awHRank/);assert.match(runtime,/treePhenotype/);assert.match(runtime,/ecologyState/);
 assert.doesNotMatch(runtime,/TextureLoader|loadAsync\(/);
 assert.ok(boot.indexOf("import('./ecology-singularity-runtime')")<boot.indexOf("import('./horizon-singularity-runtime')"));
 assert.ok(boot.indexOf("import('./horizon-singularity-runtime')")<boot.indexOf("import('./main')"));
});
