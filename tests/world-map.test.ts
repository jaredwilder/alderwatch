import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState,type Vec3} from '../src/state';
import {seedNature} from '../src/nature';
import {largeGameSightings,worldMapPoint} from '../src/minimap';

// Full-world map contract: the March edges and center project exactly and remain inside the atlas.
test('full March projection is north-up and covers the entire 768 metre realm',()=>{
 assert.deepEqual(worldMapPoint([-384,0,-384]),{x:0,y:0,inside:true});
 assert.deepEqual(worldMapPoint([0,0,0]),{x:50,y:50,inside:true});
 assert.deepEqual(worldMapPoint([384,0,384]),{x:100,y:100,inside:true});
 assert.equal(worldMapPoint([385,0,0]).inside,false);
});

// Player-facing contract: M must make the existing big wildlife findable without changing spawn authority.
test('world map surfaces every live bison and bear, including the discoverable Massive bison',()=>{
 const w=seedState(),p=makePlayer('Hunter');p.position=[0,0,0];w.players[p.id]=p;seedNature(w);
 const sightings=largeGameSightings(w,p);
 assert.equal(sightings.length,9);
 assert.equal(sightings.filter(s=>s.kind==='bison').length,6);
 assert.equal(sightings.filter(s=>s.kind==='bear').length,3);
 const massive=sightings.find(s=>s.massive);assert.equal(massive?.id,'wild-bison-1');assert.equal(massive?.kind,'bison');
 assert.ok(sightings.every((s,i)=>i===0||s.distance>=sightings[i-1].distance));
 assert.ok(sightings.every(s=>worldMapPoint(s.position as Vec3).inside));
 const bear=Object.values(w.animals!).find(a=>a.kind==='bear')!;bear.dead=true;bear.health=0;
 assert.equal(largeGameSightings(w,p).some(s=>s.id===bear.id),false);
});
