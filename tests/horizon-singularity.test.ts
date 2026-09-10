import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CANOPY_FULL_TO_PROXY_ANGLE,CANOPY_MASS_CUTOFF_ANGLE,CANOPY_PROXY_TO_MASS_ANGLE,HORIZON_CANOPY_FIELDS,HORIZON_RIDGE_WOODLAND_FULL,HORIZON_RIDGE_WOODLAND_START,HORIZON_TERRAIN_EDGE_FADE,HORIZON_TERRAIN_SAFE_MARGIN,angularDiameter,canopyRepresentation,distanceForAngularDiameter,enteringHorizonCells,horizonCanopyBudget,horizonFieldOrigin,horizonRidgeWoodlandBias,horizonTerrainSupport,terrainBoundaryDistance} from '../src/horizon-singularity';
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
 assert.ok(crown.fadeIn>=130,'faceted crown proxy must not invade the authored mid-field');
});

test('physical terrain support kills the exact realm-edge source of floating sky trees',()=>{
 assert.equal(horizonTerrainSupport(0,0),1);
 assert.equal(horizonTerrainSupport(384-HORIZON_TERRAIN_SAFE_MARGIN,0),0);
 const feather=horizonTerrainSupport(384-(HORIZON_TERRAIN_SAFE_MARGIN+HORIZON_TERRAIN_EDGE_FADE)/2,0);assert.ok(feather>0&&feather<1);
 assert.equal(horizonTerrainSupport(430,0),0,'the infinite mathematical height field is not permission to render beyond the finite ground mesh');
 assert.equal(terrainBoundaryDistance(-186,130,-1,0),198,'Briar screenshot view has only 198 m of physical westward terrain support');
});

test('highland rim spends existing canopy budget on silhouette instead of a naked texture wall',()=>{
 assert.equal(HORIZON_RIDGE_WOODLAND_START,270);assert.equal(HORIZON_RIDGE_WOODLAND_FULL,345);
 assert.equal(horizonRidgeWoodlandBias(0,0),0);assert.equal(horizonRidgeWoodlandBias(270,0),0);
 const mid=horizonRidgeWoodlandBias(310,0);assert.ok(mid>.15&&mid<.35);
 assert.ok(horizonRidgeWoodlandBias(345,0)>.4);
});

test('mass proxy stays root-connected and crown budget is redistributed into irregular foliage lobes',()=>{
 const mass=createHorizonCanopyGeometry(HORIZON_CANOPY_FIELDS[1]);assert.equal(mass.index!.count/3,12);
 const p=mass.getAttribute('position');let lowRadius=0;for(let i=0;i<p.count;i++)if(p.getY(i)<.7)lowRadius=Math.max(lowRadius,Math.hypot(p.getX(i),p.getZ(i)));
 assert.ok(lowRadius>2.5,'far mass must meet the terrain with broad canopy frequency, not a floating-looking trunk');
 const crown=createHorizonCanopyGeometry(HORIZON_CANOPY_FIELDS[0]);assert.equal(crown.index!.count/3,32);assert.ok(crown.getAttribute('position').count>70,'crown must spend budget across overlapping irregular lobes');
});

test('horizon torus updates O(N) newly exposed cells instead of rebuilding N squared',()=>{
 for(const spec of HORIZON_CANOPY_FIELDS){
  const a=horizonFieldOrigin(0,0,spec),right=horizonFieldOrigin(spec.cell*1.01,0,spec),diag=horizonFieldOrigin(spec.cell*1.01,spec.cell*1.01,spec);
  assert.equal(enteringHorizonCells(a,right,spec.size).length,spec.size);
  assert.equal(enteringHorizonCells(a,diag,spec.size).length,spec.size*2-1);
  assert.ok(enteringHorizonCells(a,right,spec.size).length<spec.size*spec.size/40);
 }
});

test('runtime compacts supported proxies, slope-grounds them, and fades coverage without camera-pitch censorship',()=>{
 const runtime=source('src/horizon-singularity-runtime.ts'),continuity=source('src/horizon-continuity-runtime.ts'),boot=source('src/bootstrap.ts');
 assert.match(runtime,/horizonTerrainSupport/);assert.match(runtime,/this\.mesh\.count=out/);assert.match(runtime,/activeCount/);assert.match(runtime,/drawnTriangles/);
 assert.match(runtime,/awHorizonWorld/);assert.match(runtime,/awHDither/);assert.match(runtime,/awHCoverage/);assert.match(runtime,/this\.slope\.setFromUnitVectors/);
 assert.doesNotMatch(runtime,/awHCameraForwardY|awHSkySupport|SKYWARD_CANOPY_LIMITS/);
 assert.doesNotMatch(continuity,/getWorldDirection|updateFarTrees|skywardImpostorVisibility/);
 assert.match(continuity,/proto\.updateSight/);
 assert.doesNotMatch(runtime,/TextureLoader|loadAsync\(/);
 assert.ok(boot.indexOf("import('./ecology-singularity-runtime')")<boot.indexOf("import('./horizon-singularity-runtime')"));
 assert.ok(boot.indexOf("import('./horizon-singularity-runtime')")<boot.indexOf("import('./horizon-continuity-runtime')"));
 assert.ok(boot.indexOf("import('./horizon-continuity-runtime')")<boot.indexOf("import('./main')"));
});
