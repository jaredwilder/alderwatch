import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allocatePerceptualBudget,geometryWork,PERCEPTUAL_CHANNELS,perceptualWorkBounds,type PerceptualChannelId} from '../src/perceptual-resource-market';
import {OBSERVER_GRASS_RINGS,grassTrianglesPerCell} from '../src/observer-grass-clipmap';
import {ECOLOGY_FIELDS} from '../src/ecology-singularity';
import {HORIZON_CANOPY_FIELDS} from '../src/horizon-singularity';
import {forestContactBudget} from '../src/forest-singularity';

const source=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const channel=(id:PerceptualChannelId)=>PERCEPTUAL_CHANNELS.find(c=>c.id===id)!;

test('one concave graphics market spends one bounded wallet across every representation',()=>{
 const bounds=perceptualWorkBounds();assert.ok(bounds.minimum>0&&bounds.maximum>bounds.minimum);
 for(const q of [.56,.60,.65,.70,.75,.80,.85,.90,.95,1]){
  const result=allocatePerceptualBudget(q);assert.ok(result.spent<=result.budget+1e-4,`overspent at q=${q}`);assert.ok(Math.abs(result.spent-result.budget)<1e-3,`wallet not filled at q=${q}`);
  for(const c of PERCEPTUAL_CHANNELS){const x=result.allocations[c.id];assert.ok(x>=c.floor-1e-9&&x<=1+1e-9,`${c.id} escaped bounds`);}
 }
});

test('additional frame headroom never makes any graphics channel worse',()=>{
 let previous=allocatePerceptualBudget(.56).allocations;
 for(const q of [.60,.65,.70,.75,.80,.85,.90,.95,1]){const next=allocatePerceptualBudget(q).allocations;for(const c of PERCEPTUAL_CHANNELS)assert.ok(next[c.id]+1e-8>=previous[c.id],`${c.id} regressed as budget rose`);previous=next;}
});

test('severe pressure protects hero readability and zeros the cheapest horizon draws first',()=>{
 const low=allocatePerceptualBudget(.60).allocations;
 assert.equal(low['grass.hero'],1);assert.ok(low['grass.near']>=.72);assert.ok(low['surface.ground']>=.45);assert.ok(low['surface.leaf']>=.50);
 assert.equal(low['grass.horizon'],0);assert.equal(low['grass.vista'],0);assert.ok(low['canopy.mass']<.06);assert.ok(low['shadow.minor']<.01);
 const recovered=allocatePerceptualBudget(.90).allocations;assert.ok(recovered['grass.far']>.95);assert.ok(recovered['surface.ground']>.99);assert.ok(recovered['canopy.crown']>.85);
});

test('market geometry work stays tethered to the frozen observer ceilings',()=>{
 for(const ring of OBSERVER_GRASS_RINGS){const triangles=ring.size*ring.size*grassTrianglesPerCell(ring);assert.ok(Math.abs(channel(`grass.${ring.id}` as PerceptualChannelId).work-geometryWork(triangles))<1e-9);}
 for(const field of ECOLOGY_FIELDS){const triangles=field.size*field.size*field.triangles;assert.ok(Math.abs(channel(`ecology.${field.id}` as PerceptualChannelId).work-geometryWork(triangles))<1e-9);}
 for(const field of HORIZON_CANOPY_FIELDS){const triangles=field.size*field.size*field.triangles;assert.ok(Math.abs(channel(`canopy.${field.id}` as PerceptualChannelId).work-geometryWork(triangles))<1e-9);}
 const contact=forestContactBudget();assert.ok(Math.abs(channel('forest.contact').work-geometryWork(contact.maxTriangles,contact.drawCalls))<1e-9);
});

test('runtime converts allocation into real draw, shader and shadow work rather than telemetry only',()=>{
 const runtime=source('src/forest-singularity-runtime.ts'),ground=source('src/ground-material.ts');
 assert.match(runtime,/allocatePerceptualBudget/);assert.match(runtime,/Observer ecology/);assert.match(runtime,/Observer horizon forest/);assert.match(runtime,/ring\.mesh\.visible/);assert.match(runtime,/shadow\.minor/);assert.match(runtime,/awGroundDetailQuality/);assert.match(runtime,/awLeafDetailQuality/);
 assert.match(ground,/awGroundDetailQuality/);assert.match(ground,/awGroundDetailQuality>\.52/);assert.match(ground,/awGroundDetailQuality>\.82/);assert.match(ground,/microDetail\*\.58/);
});
