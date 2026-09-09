import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ECOLOGY_FIELDS,ECOLOGY_SURFACE_SAMPLE_CELL,ecologyFieldBudget,ecologyFieldOrigin,ecologyFieldQuality,ecologySpeciesWeightsFromState,ecologyState,enteringEcologyCells,roadDisturbance,type EcologyState} from '../src/ecology-singularity';
import {createEcologyPlantGeometry} from '../src/ecology-singularity-runtime';

test('latent ecology is deterministic, bounded, and nontrivial across the March',()=>{
 const seen=new Set<string>();
 for(let x=-120;x<=120;x+=24)for(let z=-120;z<=120;z+=24){
  const a=ecologyState(x,z,roadDisturbance(Math.hypot(x,z))),b=ecologyState(x,z,roadDisturbance(Math.hypot(x,z)));assert.deepEqual(a,b);
  for(const value of Object.values(a))assert.ok(value>=0&&value<=1,`ecology bound failed at ${x},${z}`);
  seen.add([a.moisture,a.shade,a.edge,a.biomass,a.moss].map(v=>v.toFixed(2)).join(':'));
 }
 assert.ok(seen.size>55,`ecology field collapsed to only ${seen.size} sampled states`);
});

test('species niches form a partition of unity and react to ecology rather than random labels',()=>{
 const make=(patch:Partial<EcologyState>):EcologyState=>({moisture:.5,shade:.5,edge:.5,fertility:.5,disturbance:0,biomass:.7,understory:.7,litter:.3,moss:.2,dryness:.3,...patch});
 const wetShade=ecologySpeciesWeightsFromState(make({moisture:.95,shade:.9,edge:.55,dryness:.05})),dryOpen=ecologySpeciesWeightsFromState(make({moisture:.08,shade:.05,edge:.08,dryness:.95})),forestEdge=ecologySpeciesWeightsFromState(make({moisture:.55,shade:.55,edge:.98,understory:.9}));
 for(const weights of [wetShade,dryOpen,forestEdge])assert.ok(Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-1)<1e-12);
 assert.ok(wetShade.fernlet>wetShade.dryStalk,'wet shade must favor fernlets over dry stalks');
 assert.ok(dryOpen.dryStalk>dryOpen.fernlet,'dry open ground must favor dry stalks over fernlets');
 assert.ok(forestEdge.shrub>forestEdge.dryStalk,'forest edge must favor shrub structure');
});

test('ecology observer fields stay fixed-cost while reaching nearly 100m',()=>{
 const budget=ecologyFieldBudget();assert.deepEqual(budget,{slots:13140,maxTriangles:141608,drawCalls:5});assert.ok(budget.maxTriangles<150000);
 for(const field of ECOLOGY_FIELDS)assert.ok(field.fadeOut<=field.cell*field.size/2,`${field.id} fade exceeds inscribed torus edge`);
 assert.ok(ECOLOGY_FIELDS.at(-1)!.fadeOut>=96);assert.equal(ECOLOGY_SURFACE_SAMPLE_CELL,4);
});

test('every ecology field uses O(N) toroidal row/column recycling',()=>{
 for(const field of ECOLOGY_FIELDS){const a=ecologyFieldOrigin(0,0,field),right=ecologyFieldOrigin(field.cell*1.01,0,field),diag=ecologyFieldOrigin(field.cell*1.01,field.cell*1.01,field);assert.equal(enteringEcologyCells(a,right,field.size).length,field.size);assert.equal(enteringEcologyCells(a,diag,field.size).length,field.size*2-1);assert.ok(enteringEcologyCells(a,right,field.size).length<field.size*field.size/30);}
});

test('procedural plant archetypes obey their frozen triangle budgets',()=>{
 for(const field of ECOLOGY_FIELDS){const geometry=createEcologyPlantGeometry(field),triangles=(geometry.index?.count??0)/3;assert.equal(triangles,field.triangles,field.id);assert.ok(geometry.getAttribute('color'));geometry.dispose();}
});

test('perceptual governor preserves close ecological structure before far decoration',()=>{
 const q=.56,fern=ecologyFieldQuality(q,'fernlet'),broad=ecologyFieldQuality(q,'broadleaf'),sedge=ecologyFieldQuality(q,'sedge'),shrub=ecologyFieldQuality(q,'shrub'),dry=ecologyFieldQuality(q,'dryStalk');assert.ok(fern>broad&&broad>sedge&&sedge>shrub&&shrub>dry);for(const id of ECOLOGY_FIELDS.map(f=>f.id))assert.equal(ecologyFieldQuality(1,id),1);
});

test('runtime composes after forest singularity and adds no texture payload',()=>{
 const boot=readFileSync(new URL('../src/bootstrap.ts',import.meta.url),'utf8'),runtime=readFileSync(new URL('../src/ecology-singularity-runtime.ts',import.meta.url),'utf8');
 assert.ok(boot.indexOf("import('./forest-singularity-runtime')")<boot.indexOf("import('./ecology-singularity-runtime')"));
 assert.match(runtime,/awEcologyMix/);assert.match(runtime,/Observer ecology/);assert.match(runtime,/__perceptualBudget/);assert.doesNotMatch(runtime,/TextureLoader/);assert.doesNotMatch(runtime,/loadAsync\(/);
});
