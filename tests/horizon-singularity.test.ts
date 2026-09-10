import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CANOPY_FULL_TO_PROXY_ANGLE,CANOPY_MASS_CUTOFF_ANGLE,CANOPY_PROXY_TO_MASS_ANGLE,HORIZON_CANOPY_FIELDS,HORIZON_TERRAIN_EDGE_FADE,HORIZON_TERRAIN_SAFE_MARGIN,SKYWARD_CANOPY_LIMITS,angularDiameter,canopyRepresentation,distanceForAngularDiameter,enteringHorizonCells,horizonCanopyBudget,horizonFieldOrigin,horizonTerrainSupport,skywardCanopyVisibility,terrainBoundaryDistance} from '../src/horizon-singularity';
import {createHorizonCanopyGeometry} from '../src/horizon-singularity-runtime';

const source=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('canopy LOD is governed by projected angular error rather than raw distance',()=>{
 const fullBoundary=distanceForAngularDiameter(7.2,CANOPY_FULL_TO_PROXY_ANGLE),crownBoundary=distanceForAngularDiameter(7.2,CANOPY_PROXY_TO_MASS_ANGLE),massBoundary=distanceForAngularDiameter(7.2,CANOPY_MASS_CUTOFF_ANGLE);
 assert.ok(fullBoundary>130&&fullBoundary<145);
 assert.ok(crownBoundary>320&&crownBoundary<335);
 assert.ok(massBoundary>570&&massBoundary<585);
 assert.equal(canopyRepresentation(100),'full');assert.equal(canopyRepresentation(200),'crown');assert.equal(canopyRepresentation(400),'mass');assert.equal(canopyRepresentation(650),'none');
 for(const d of [25,80,150,300,520])assert.ok(Math.abs(distanceForAngularDiameter(7.2,angularDiameter(7.2,d))-d)<1e-9);
});

test('horizon forest has a fixed observer ceiling independent of world size',()=>{
 assert.deepEqual(horizonCanopyBudget(),{slots:9280,maxTriangles:215040,drawCalls:2});
 const crown=HORIZON_CANOPY_FIELDS[0],mass=HORIZON_CANOPY_FIELDS[1];
 assert.ok(crown.cell*crown.size/2>360);assert.ok(mass.cell*mass.size/2>580);
 assert.ok(crown.fadeOut<=crown.cell*crown.size/2);assert.ok(mass.fadeOut<=mass.cell*mass.size/2);
});

test('physical terrain support kills the exact realm-edge source of floating sky trees',()=>{
 assert.equal(horizonTerrainSupport(0,0),1);
 assert.equal(horizonTerrainSupport(384-HORIZON_TERRAIN_SAFE_MARGIN,0),0);
 const feather=horizonTerrainSupport(384-(HORIZON_TERRAIN_SAFE_MARGIN+HORIZON_TERRAIN_EDGE_FADE)/2,0);assert.ok(feather>0&&feather<1);
 assert.equal(horizonTerrainSupport(430,0),0,'the infinite mathematical height field is not permission to render beyond the finite ground mesh');
 assert.equal(terrainBoundaryDistance(-186,130,-1,0),198,'Briar screenshot view has only 198 m of physical westward terrain support');
});

test('skyward view utility sends distant canopy mass to zero before crown silhouettes',()=>{
 assert.deepEqual(SKYWARD_CANOPY_LIMITS,{crown:{start:.08,end:.34},mass:{start:0,end:.20}});
 assert.equal(skywardCanopyVisibility(-.2,'mass'),1);assert.equal(skywardCanopyVisibility(.20,'mass'),0);
 assert.ok(skywardCanopyVisibility(.14,'crown')>0);assert.equal(skywardCanopyVisibility(.34,'crown'),0);
});

test('mass proxy spends all twelve triangles on root-connected canopy instead of tiny poles',()=>{
 const geometry=createHorizonCanopyGeometry(HORIZON_CANOPY_FIELDS[1]);assert.equal(geometry.index!.count/3,12);
 const p=geometry.getAttribute('position');let lowRadius=0;for(let i=0;i<p.count;i++)if(p.getY(i)<.7)lowRadius=Math.max(lowRadius,Math.hypot(p.getX(i),p.getZ(i)));
 assert.ok(lowRadius>2.5,'far mass must meet the terrain with broad canopy frequency, not a floating-looking trunk');
});

test('horizon torus updates O(N) newly exposed cells instead of rebuilding N squared',()=>{
 for(const spec of HORIZON_CANOPY_FIELDS){
  const a=horizonFieldOrigin(0,0,spec),right=horizonFieldOrigin(spec.cell*1.01,0,spec),diag=horizonFieldOrigin(spec.cell*1.01,spec.cell*1.01,spec);
  assert.equal(enteringHorizonCells(a,right,spec.size).length,spec.size);
  assert.equal(enteringHorizonCells(a,diag,spec.size).length,spec.size*2-1);
  assert.ok(enteringHorizonCells(a,right,spec.size).length<spec.size*spec.size/40);
 }
});

test('runtime compacts only supported proxies and rejects horizon geometry from open sky',()=>{
 const runtime=source('src/horizon-singularity-runtime.ts'),boot=source('src/bootstrap.ts');
 assert.match(runtime,/horizonTerrainSupport/);assert.match(runtime,/this\.mesh\.count=out/);assert.match(runtime,/activeCount/);assert.match(runtime,/drawnTriangles/);
 assert.match(runtime,/awHCameraForwardY/);assert.match(runtime,/awHSkySupport/);assert.match(runtime,/SKYWARD_CANOPY_LIMITS/);
 assert.match(runtime,/createHorizonCanopyGeometry/);assert.match(runtime,/awHDistance/);assert.match(runtime,/awHRank/);assert.match(runtime,/treePhenotype/);assert.match(runtime,/ecologyState/);
 assert.doesNotMatch(runtime,/TextureLoader|loadAsync\(/);
 assert.ok(boot.indexOf("import('./ecology-singularity-runtime')")<boot.indexOf("import('./horizon-singularity-runtime')"));
 assert.ok(boot.indexOf("import('./horizon-singularity-runtime')")<boot.indexOf("import('./main')"));
});
