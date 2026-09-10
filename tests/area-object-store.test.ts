import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAuthority,makePlayer,seedState} from '../src/state';
import {activateAreaObjects,activeAreaObjects,ensureAreaObjectStore} from '../src/area-object-store';

test('legacy physical state remains Far March even when an old save is standing in Wolfpine',()=>{
 const world=seedState(),player=makePlayer('Warden');player.areaId='wolfpine';world.players[player.id]=player;
 world.resources.legacyOak={id:'legacy-oak',kind:'tree',position:[3,0,4],variant:0,health:6,phase:'standing',rotation:0};
 world.structures.legacyHome={id:'legacy-home',kind:'foundation',position:[6,0,6],yaw:0,ownerId:player.id};
 ensureAreaObjectStore(world,'wolfpine');
 assert.equal(activeAreaObjects(world),'far-march');
 activateAreaObjects(world,'wolfpine','wolfpine');
 assert.deepEqual(world.resources,{});
 assert.deepEqual(world.structures,{});
 assert.equal(world.areaObjectStore?.['far-march']?.resources.legacyOak.id,'legacy-oak');
 assert.equal(world.areaObjectStore?.['far-march']?.structures.legacyHome.id,'legacy-home');
});

test('area projection round-trips local coordinates without aliasing and keeps one survivor inventory',()=>{
 const world=seedState(),player=makePlayer('Warden');world.players[player.id]=player;const inventory=player.inventory;
 world.resources.marchRock={id:'march-rock',kind:'rock',position:[12,0,12],variant:0,health:4,phase:'standing',rotation:0};
 ensureAreaObjectStore(world);
 activateAreaObjects(world,'wolfpine','far-march');
 world.resources.pine={id:'pine',areaId:'wolfpine',kind:'tree',position:[12,0,12],variant:1,health:6,phase:'standing',rotation:0};
 assert.equal(world.resources.pine.position[0],12);
 activateAreaObjects(world,'far-march','wolfpine');
 assert.equal(world.resources.marchRock.id,'march-rock');
 assert.equal(world.resources.pine,undefined);
 assert.strictEqual(player.inventory,inventory);
 activateAreaObjects(world,'wolfpine','far-march');
 assert.equal(world.resources.pine.id,'pine');
 assert.equal(world.resources.marchRock,undefined);
 assert.strictEqual(player.inventory,inventory);
});

test('the same LocalAuthority harvests the active streamed-area resource',()=>{
 const world=seedState(),player=makePlayer('Warden');world.players[player.id]=player;
 ensureAreaObjectStore(world);activateAreaObjects(world,'wolfpine','far-march');player.areaId='wolfpine';player.position=[4,0,5];
 world.resources.pine={id:'pine',areaId:'wolfpine',kind:'tree',position:[4,0,5],variant:0,health:6,phase:'standing',rotation:0};
 const authority=new LocalAuthority(world),before=world.resources.pine.health,out=authority.dispatch({type:'harvest',playerId:player.id,resourceId:'pine'});
 assert.equal(out.ok,true);assert.equal(world.resources.pine.health,before-1);assert.equal(player.equipped,'axe');
});

test('inactive physical slices survive JSON save semantics without duplicating the active slice',()=>{
 const world=seedState(),player=makePlayer('Warden');world.players[player.id]=player;world.resources.marchRock={id:'march-rock',kind:'rock',position:[0,0,0],variant:0,health:4,phase:'standing',rotation:0};
 ensureAreaObjectStore(world);activateAreaObjects(world,'wolfpine','far-march');world.resources.pine={id:'pine',areaId:'wolfpine',kind:'tree',position:[0,0,0],variant:0,health:6,phase:'standing',rotation:0};
 const copy=JSON.parse(JSON.stringify(world));
 assert.equal(copy.activeObjectAreaId,'wolfpine');assert.equal(copy.resources.pine.id,'pine');assert.equal(copy.areaObjectStore['far-march'].resources.marchRock.id,'march-rock');assert.equal(copy.areaObjectStore.wolfpine,undefined);
});
