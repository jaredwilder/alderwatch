import test from 'node:test';
import assert from 'node:assert/strict';
import {makePlayer,seedState} from '../src/state';
import {normalizeLegacyWorldShape} from '../src/save-compat';

test('legacy v1 save shape gains additive collections without losing identity or progress',()=>{
 const base=seedState(),player=makePlayer('Warden');
 base.players[player.id]=player;base.resources.oak={id:'oak',kind:'tree',position:[2,0,3],variant:0,health:2,phase:'standing',rotation:.4};
 const legacy:any=JSON.parse(JSON.stringify(base));
 delete legacy.forage;delete legacy.drops;delete legacy.structures;delete legacy.containers;delete legacy.enemies;delete legacy.opened;delete legacy.progress;delete legacy.nextId;
 delete legacy.players[player.id].buffs;delete legacy.players[player.id].skills;
 const normalized=normalizeLegacyWorldShape(legacy);
 assert.equal(normalized.players[player.id].id,player.id);assert.equal(normalized.resources.oak.health,2);
 assert.deepEqual(normalized.forage,{});assert.deepEqual(normalized.drops,{});assert.deepEqual(normalized.structures,{});assert.deepEqual(normalized.containers,{});assert.deepEqual(normalized.enemies,{});
 assert.deepEqual(normalized.opened,[]);assert.deepEqual(normalized.progress,[]);assert.equal(normalized.nextId,1);
 assert.deepEqual(normalized.players[player.id].buffs,[]);assert.deepEqual(normalized.players[player.id].skills,{});
});

test('normalization never overwrites existing harvested and inventory state',()=>{
 const world=seedState(),player=makePlayer('Hunter');world.players[player.id]=player;world.progress=['crafted-sword'];world.opened=['raider-cache'];world.nextId=77;world.forage.flax={id:'flax',position:[0,0,1],harvested:true,readyAt:900};
 const inventory=structuredClone(player.inventory),forage=structuredClone(world.forage),same=normalizeLegacyWorldShape(world);
 assert.deepEqual(same.players[player.id].inventory,inventory);assert.deepEqual(same.forage,forage);assert.deepEqual(same.progress,['crafted-sword']);assert.deepEqual(same.opened,['raider-cache']);assert.equal(same.nextId,77);
});
