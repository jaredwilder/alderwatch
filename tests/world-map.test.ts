import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState,type Vec3} from '../src/state';
import {seedNature} from '../src/nature';
import {largeGameSightings,worldMapFacingRotation,worldMapPoint,worldMapPosition} from '../src/minimap';
import {livingWorldBosses,seedWorldBosses,WORLD_BOSSES} from '../src/world-bosses';

// Full-world map contract: the March edges and center project exactly and remain inside the atlas.
test('full March projection is north-up and covers the entire 768 metre realm',()=>{
 assert.deepEqual(worldMapPoint([-384,0,-384]),{x:0,y:0,inside:true});
 assert.deepEqual(worldMapPoint([0,0,0]),{x:50,y:50,inside:true});
 assert.deepEqual(worldMapPoint([384,0,384]),{x:100,y:100,inside:true});
 assert.equal(worldMapPoint([385,0,0]).inside,false);
 assert.deepEqual(worldMapPosition(0,0),[-384,0,-384]);
 assert.deepEqual(worldMapPosition(50,50),[0,0,0]);
 assert.deepEqual(worldMapPosition(100,100),[384,0,384]);
});

test('full map player arrow obeys Alderwatch +Z forward instead of pointing backwards',()=>{
 assert.equal(worldMapFacingRotation(0),Math.PI); // +Z is south/down on a north-up canvas.
 assert.equal(worldMapFacingRotation(Math.PI),0); // -Z is north/up.
 assert.equal(worldMapFacingRotation(Math.PI/2),Math.PI/2); // +X is east/right.
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

test('all five stranded giants are now real persistent reachable Far March bosses',()=>{
 const w=seedState(),p=makePlayer('Hunter');p.position=[0,0,0];w.players[p.id]=p;seedWorldBosses(w);
 assert.equal(WORLD_BOSSES.length,5);assert.equal(livingWorldBosses(w,p).length,5);
 for(const boss of WORLD_BOSSES){const e=w.enemies[boss.id];assert.ok(e);assert.equal(e.maxHealth,boss.health);assert.ok(worldMapPoint(e.position).inside,`${boss.name} must be reachable on the live March`);}
 const hroth=w.enemies['giant-hroth'];hroth.health=321;hroth.position=[250,hroth.position[1],200];seedWorldBosses(w);assert.equal(hroth.health,321);assert.equal(hroth.position[0],250);
 hroth.health=0;assert.equal(livingWorldBosses(w,p).some(b=>b.id==='giant-hroth'),false);
});
