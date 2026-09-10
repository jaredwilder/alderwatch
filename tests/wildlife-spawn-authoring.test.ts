import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthoredWildlifeSpawn,formatAuthoredWildlifeExport,formatAuthoredWildlifeSpawn,makeWildlifePreview,nextAuthoredWildlifeId,parseAuthoredWildlifeSpawns,previewAnimalId} from '../src/wildlife-spawn-authoring';

test('spawn painter allocates stable readable IDs without colliding with existing marks',()=>{
 const first=createAuthoredWildlifeSpawn('deer',12.345,-8.765,1.23456,[],undefined,100);
 const second=createAuthoredWildlifeSpawn('deer',13,-9,2,[first],undefined,101);
 assert.equal(first.id,'placed-deer-00');assert.equal(second.id,'placed-deer-01');
 assert.equal(first.x,12.35);assert.equal(first.z,-8.77);assert.equal(first.yaw,1.235);
 assert.equal(nextAuthoredWildlifeId('deer',[first,second],[{id:'placed-deer-02'}]),'placed-deer-03');
});

test('spawn export emits ready-to-paste fresh rows including optional pack/group IDs',()=>{
 const wolf=createAuthoredWildlifeSpawn('wolf',151.5,214.25,4.4,[],'ironward-meadow',100);
 assert.equal(formatAuthoredWildlifeSpawn(wolf)," fresh('placed-wolf-00','wolf',151.5,214.25,4.4,'ironward-meadow'),");
 const output=formatAuthoredWildlifeExport([wolf]);
 assert.match(output,/paste into WILDLIFE_SPAWNS/);assert.match(output,/fresh\('placed-wolf-00','wolf',151\.5,214\.25,4\.4,'ironward-meadow'\)/);
});

test('saved authoring marks reject malformed or unknown wildlife data',()=>{
 assert.deepEqual(parseAuthoredWildlifeSpawns('not json'),[]);
 assert.deepEqual(parseAuthoredWildlifeSpawns(JSON.stringify([{id:'x',kind:'dragon',x:1,z:2,yaw:0,createdAt:1}])),[]);
 const raw=JSON.stringify([{id:'placed-boar-00',kind:'boar',x:1,z:2,yaw:.5,packId:'sounder',createdAt:44}]);
 assert.deepEqual(parseAuthoredWildlifeSpawns(raw),[{id:'placed-boar-00',kind:'boar',x:1,z:2,yaw:.5,packId:'sounder',createdAt:44}]);
});

test('preview animal uses an isolated dev ID and real species vitals at the painted anchor',()=>{
 const mark=createAuthoredWildlifeSpawn('bison',20,30,1.5,[],undefined,123);
 const preview=makeWildlifePreview(mark,7.25);
 assert.equal(preview.id,previewAnimalId(mark));assert.ok(preview.id.startsWith('dev-wildlife-preview-'));
 assert.deepEqual(preview.position,[20,7.25,30]);assert.deepEqual(preview.home,[20,7.25,30]);assert.equal(preview.kind,'bison');assert.equal(preview.dead,false);assert.ok((preview.health??0)>0);
});
