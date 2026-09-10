import test from 'node:test';
import assert from 'node:assert/strict';
import type {PlayerState,WorldState} from '../src/state';
import {killAnimal,rareLootHit} from '../src/wildlife-rules';
import {species,type AnimalState} from '../src/wildlife-species';
import {WILDLIFE_SPAWNS} from '../src/wildlife-spawns';
import {stepWildlifePopulation,wildlifeRespawnDelayTicks,WILDLIFE_MAX_RESPAWNS_PER_PULSE} from '../src/wildlife-population';

function world():WorldState{return {version:1,worldSeed:771,tick:0,players:{},resources:{},forage:{},drops:{},structures:{},stations:{},containers:{},enemies:{},opened:[],progress:[],nextId:1,animals:{}};}
function playerAt(x:number,z:number):PlayerState{return {id:'player-local',name:'Warden',archetype:'Hunter',position:[x,0,z],yaw:0,health:100,stamina:100,inventory:[],equipped:null,hair:'',skin:'',hood:false,skills:{},buffs:[]};}
function animalFor(id:string):AnimalState{const spawn=WILDLIFE_SPAWNS.find(s=>s.id===id);assert.ok(spawn,`missing test spawn ${id}`);return {id:spawn.id,kind:spawn.kind,position:[spawn.x,0,spawn.z],home:[spawn.x,0,spawn.z],yaw:spawn.yaw,phase:0,packId:spawn.packId,health:species(spawn.kind).maxHealth,maxHealth:species(spawn.kind).maxHealth,dead:false};}
function seedAll(w:WorldState){for(const spawn of WILDLIFE_SPAWNS)w.animals![spawn.id]=animalFor(spawn.id);}

test('player carcass remains lootable, then decays without respawning under the player',()=>{
 const w=world(),animal=animalFor('wildlife-0');w.animals![animal.id]=animal;w.players['player-local']=playerAt(28,40);
 assert.equal(killAnimal(w,animal,'player'),true);assert.ok(w.containers['corpse-wildlife-0']);
 w.tick=59*60;let pulse=stepWildlifePopulation(w);assert.ok(w.containers['corpse-wildlife-0']);assert.equal(pulse.clearedCorpses.length,0);assert.equal(animal.dead,true);
 w.tick=61*60;pulse=stepWildlifePopulation(w);assert.equal(w.containers['corpse-wildlife-0'],undefined);assert.deepEqual(pulse.clearedCorpses,['wildlife-0']);assert.equal(pulse.respawned.length,0);assert.equal(animal.dead,true);
});

test('overdue wildlife respawns only after the player leaves the exclusion bubble',()=>{
 const w=world(),animal=animalFor('wildlife-0');w.animals![animal.id]=animal;w.players['player-local']=playerAt(28,40);killAnimal(w,animal,'player');w.tick=20_000;
 let pulse=stepWildlifePopulation(w);assert.equal(animal.dead,true);assert.ok(pulse.deferredNearPlayer.includes(animal.id));
 w.players['player-local'].position=[300,0,300];pulse=stepWildlifePopulation(w,{groundY:()=>3});
 assert.ok(pulse.respawned.includes(animal.id));assert.equal(animal.dead,false);assert.equal(animal.health,animal.maxHealth);assert.equal(animal.spawnGeneration,1);assert.equal(animal.position[1],3);assert.equal(w.containers['corpse-wildlife-0'],undefined);
 assert.ok(Math.hypot(animal.position[0]-28,animal.position[2]-40)<=14.01);
});

test('scarcity pressure refills a collapsed region faster than a healthy population',()=>{
 const healthy=world(),depleted=world();seedAll(healthy);seedAll(depleted);
 const h=healthy.animals!['wildlife-0'],d=depleted.animals!['wildlife-0'];h.dead=d.dead=true;h.health=d.health=0;h.diedAt=d.diedAt=0;
 for(const a of Object.values(depleted.animals!))if(a.id!==d.id&&Math.hypot(a.home[0]-d.home[0],a.home[2]-d.home[2])<125){a.dead=true;a.health=0;a.diedAt=0;}
 assert.ok(wildlifeRespawnDelayTicks(depleted,d)<wildlifeRespawnDelayTicks(healthy,h));
});

test('director throttles recovery waves instead of popping an entire dead biome at once',()=>{
 const w=world();for(const id of WILDLIFE_SPAWNS.slice(0,8).map(s=>s.id)){const a=animalFor(id);a.dead=true;a.health=0;a.diedAt=0;a.corpseClearedAt=1;w.animals![id]=a;}
 w.tick=100_000;const pulse=stepWildlifePopulation(w);
 assert.equal(pulse.respawned.length,WILDLIFE_MAX_RESPAWNS_PER_PULSE);
});

test('rare carcass rolls vary across generations of a reused habitat slot',()=>{
 const w=world(),a=animalFor('wildlife-0');
 let differs=false;
 for(let oneIn=2;oneIn<=64;oneIn++){a.spawnGeneration=0;const first=rareLootHit(w,a,oneIn);a.spawnGeneration=1;const second=rareLootHit(w,a,oneIn);if(first!==second){differs=true;break;}}
 assert.equal(differs,true);
});
