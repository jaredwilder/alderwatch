import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState} from '../src/state';
import {AREA_ENTRY,FAR_MARCH,IRONWARD_CROSSING,enterSavedArea,migrateRealmSave,playerArea,rememberCurrentArea} from '../src/realm-save';

test('legacy saves migrate into Far March without moving the player',()=>{
 const world=seedState(),player=makePlayer('Warden');player.position=[31,4,72];player.yaw=.8;world.players[player.id]=player;
 const before=structuredClone(player.position);migrateRealmSave(world);
 assert.equal(playerArea(player),FAR_MARCH);assert.deepEqual(player.position,before);assert.deepEqual(player.areaPositions,{});assert.deepEqual(world.realmAreas,{});
});

test('area transition remembers exact outgoing position and uses deterministic first entry',()=>{
 const world=seedState(),player=makePlayer('Hunter');player.position=[212,7,34];player.yaw=1.25;world.players[player.id]=player;migrateRealmSave(world);
 enterSavedArea(world,IRONWARD_CROSSING);
 assert.equal(player.areaId,IRONWARD_CROSSING);assert.deepEqual(player.areaPositions?.[FAR_MARCH],{position:[212,7,34],yaw:1.25});assert.deepEqual(player.position,AREA_ENTRY[IRONWARD_CROSSING].position);assert.equal(world.realmAreas?.[IRONWARD_CROSSING].visitCount,1);
});

test('round trip restores each area local position instead of teleporting to a global coordinate',()=>{
 const world=seedState(),player=makePlayer('Artisan');player.position=[150,3,80];player.yaw=.4;world.players[player.id]=player;migrateRealmSave(world);
 enterSavedArea(world,IRONWARD_CROSSING);player.position=[9,.03,-4];player.yaw=2.2;rememberCurrentArea(player);
 enterSavedArea(world,FAR_MARCH);assert.deepEqual(player.position,[150,3,80]);assert.equal(player.yaw,.4);
 player.position=[151,3,81];player.yaw=.5;rememberCurrentArea(player);enterSavedArea(world,IRONWARD_CROSSING);assert.deepEqual(player.position,[9,.03,-4]);assert.equal(player.yaw,2.2);assert.equal(world.realmAreas?.[IRONWARD_CROSSING].visitCount,2);
});

test('realm-area metadata remains additive under JSON snapshot round trip',()=>{
 const world=seedState(),player=makePlayer('Reaver');world.players[player.id]=player;migrateRealmSave(world);enterSavedArea(world,IRONWARD_CROSSING);const restored=JSON.parse(JSON.stringify(world));migrateRealmSave(restored);const p=Object.values(restored.players)[0] as typeof player;assert.equal(playerArea(p),IRONWARD_CROSSING);assert.ok(restored.realmAreas[FAR_MARCH]);assert.ok(restored.realmAreas[IRONWARD_CROSSING]);
});
