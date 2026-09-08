import test from 'node:test';
import assert from 'node:assert/strict';
import {seedState} from '../src/state';
import {buildForageSpatialIndex,buildResourceSpatialIndex,forageCandidates,resourceCandidates,FORAGE_CELL_SIZE} from '../src/forage-spatial';
import {DENSE_FORAGE_PREFIX,DENSE_GATHERABLE_ITEMS,DENSE_RESOURCE_PREFIX,RESOURCE_FIELD_CELL,RESOURCE_FIELD_MAX,RESOURCE_FIELD_MIN,regionAt,seedFrontier} from '../src/worldgen';

function populated(seed=0x5eed1234){const w=seedState();w.worldSeed=seed;seedFrontier(w,seed);return w;}

test('dense raw resources fill the whole playable March without one live object per node',()=>{
 const w=populated(),resources=Object.values(w.resources).filter(r=>r.id.startsWith(DENSE_RESOURCE_PREFIX)),forage=Object.values(w.forage).filter(f=>f.id.startsWith(DENSE_FORAGE_PREFIX)),side=RESOURCE_FIELD_MAX-RESOURCE_FIELD_MIN+1;
 assert.ok(resources.length>=650,`expected hundreds of streamed harvest resources across the full March, got ${resources.length}`);
 assert.ok(resources.length<=side*side*7,'resource field exceeded its hard seven-per-cell logical budget');
 assert.ok(forage.length>=400,`expected hundreds of forage nodes across the full March, got ${forage.length}`);
 assert.ok(forage.length<=side*side*5,'forage field exceeded its hard five-per-cell logical budget');
 assert.ok(resources.some(r=>r.kind==='tree')&&resources.some(r=>r.kind==='rock'),'dense field must contain both lumber and mining nodes');
 const cells=new Set(resources.map(r=>`${Math.floor(r.position[0]/RESOURCE_FIELD_CELL)},${Math.floor(r.position[2]/RESOURCE_FIELD_CELL)}`));
 assert.ok(cells.size>=135,`resource coverage still leaves too much of the March barren: ${cells.size} populated cells`);
 assert.ok(resources.some(r=>r.position[2]<-210),'southern wilderness still has no lumber/mining nodes');
 assert.ok(forage.some(f=>f.position[2]<-210),'southern wilderness still has no forage');
 assert.ok(resources.some(r=>r.position[2]>210)&&forage.some(f=>f.position[2]>210),'northern wilderness should stay populated too');
 assert.ok(resources.some(r=>r.position[0]<-210)&&resources.some(r=>r.position[0]>210),'both western and eastern wilderness need harvest nodes');
 for(const region of ['The Far March','Southwood','Ironward Heights','Briar Heath'])assert.ok(resources.some(r=>regionAt(r.position[0],r.position[2])===region),`${region} has no dense harvest resources`);
});

test('every raw plant economy input exists physically while processed goods stay crafted',()=>{
 const w=populated(0x91a7cafe),nodes=Object.values(w.forage).filter(f=>f.id.startsWith(DENSE_FORAGE_PREFIX)),items=new Set(nodes.map(f=>f.item));
 for(const item of DENSE_GATHERABLE_ITEMS)assert.ok(items.has(item),`${item} never spawned in the dense world layer`);
 const truffles=nodes.filter(f=>f.item==='truffle').length,honey=nodes.filter(f=>f.item==='wild_honey').length,mushrooms=nodes.filter(f=>f.item==='mushroom').length,berries=nodes.filter(f=>f.item==='berries').length;
 assert.ok(truffles>0&&truffles<mushrooms,'truffles should exist but remain rarer than mushrooms');
 assert.ok(honey>0&&honey<berries,'wild honey should exist but remain rarer than berry forage');
});

test('dense seeding is deterministic, additive and never resurrects harvested state',()=>{
 const a=populated(123456789),b=populated(123456789);
 const snapshot=(w:ReturnType<typeof populated>)=>Object.values(w.resources).filter(r=>r.id.startsWith(DENSE_RESOURCE_PREFIX)).map(r=>[r.id,...r.position,r.kind]).sort((x,y)=>String(x[0]).localeCompare(String(y[0])));
 assert.deepEqual(snapshot(a),snapshot(b),'same realm seed must produce the same physical resource field');
 const resource=Object.values(a.resources).find(r=>r.id.startsWith(DENSE_RESOURCE_PREFIX))!,plant=Object.values(a.forage).find(f=>f.id.startsWith(DENSE_FORAGE_PREFIX))!;
 resource.health=0;resource.phase='fallen';plant.harvested=true;plant.readyAt=987654321;
 const resourceCount=Object.keys(a.resources).length,forageCount=Object.keys(a.forage).length;seedFrontier(a,123456789);
 assert.equal(Object.keys(a.resources).length,resourceCount,'reseed duplicated resource IDs');assert.equal(Object.keys(a.forage).length,forageCount,'reseed duplicated forage IDs');
 assert.equal(a.resources[resource.id].phase,'fallen');assert.equal(a.resources[resource.id].health,0);assert.equal(a.forage[plant.id].readyAt,987654321,'reseed reset forage respawn state');
});

test('dense presentation and wildlife obstacle queries stay local instead of scanning the whole economy',()=>{
 const w=populated(0x4f726573),forageIndex=buildForageSpatialIndex(w.forage),resourceIndex=buildResourceSpatialIndex(w.resources),allForage=Object.values(w.forage).filter(f=>f.id.startsWith('nature-')),allResources=Object.values(w.resources),origin:[number,number,number]=[0,0,18];
 const forage=forageCandidates(forageIndex,origin,65),resources=resourceCandidates(resourceIndex,origin,2);
 assert.equal(Math.ceil(65/FORAGE_CELL_SIZE),3,'65m visibility should fit a seven-by-seven spatial-cell query');
 assert.ok(allForage.length>500,`fixture is not dense enough to exercise the spatial query: ${allForage.length}`);
 assert.ok(forage.length<allForage.length/3,`local forage query leaked too much of the logical world: ${forage.length}/${allForage.length}`);
 assert.ok(resources.length<allResources.length/5,`wildlife obstacle query leaked too much of the logical resource world: ${resources.length}/${allResources.length}`);
 const forageIds=new Set(forage),resourceIds=new Set(resources);
 assert.ok(allForage.some(f=>f.position[2]<-210&&!forageIds.has(f.id)),'far southern forage should remain logical-only while the player is near Alderbrook');
 assert.ok(allResources.some(r=>r.position[2]<-210&&!resourceIds.has(r.id)),'far southern hard resources should never enter a local wildlife collision query near Alderbrook');
});
