import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAuthority} from '../src/state';
import {seedNature,type AnimalState} from '../src/nature';
import {aerialPreyAction,beginCarry,ensureAerialState,groundPredatorCanReach,releaseCarry,stepAerialEnergy} from '../src/wildlife-aerial';
import {predatorTarget} from '../src/wildlife-ai';
import {MAX_EAGLES,WILDLIFE_SPAWNS} from '../src/wildlife-spawns';
import {WILDLIFE_SPECIES} from '../src/wildlife-species';
import {animalAlive,predatorBite} from '../src/wildlife-rules';

const animal=(id:string,kind:AnimalState['kind'],x=0,z=0):AnimalState=>({id,kind,position:[x,0,z],home:[x,0,z],yaw:0,phase:0});

test('eagle population is explicitly capped and aerial tuning is registry-owned',()=>{
 const authority=new LocalAuthority();seedNature(authority.state);const eagles=Object.values(authority.state.animals!).filter(a=>a.kind==='eagle');
 assert.equal(eagles.length,MAX_EAGLES);assert.equal(WILDLIFE_SPAWNS.filter(a=>a.kind==='eagle').length,MAX_EAGLES);assert.equal(MAX_EAGLES,3);
 assert.deepEqual(WILDLIFE_SPECIES.eagle.aerial?.pickupPrey,['hare','sheep']);assert.deepEqual(WILDLIFE_SPECIES.eagle.aerial?.killPrey,['crow']);
});

test('eagles pick up hare and sheep but kill other birds instead',()=>{
 const eagle=animal('e','eagle'),hare=animal('h','hare'),sheep=animal('s','sheep'),crow=animal('c','crow'),all={e:eagle,h:hare,s:sheep,c:crow};ensureAerialState(eagle);
 assert.equal(aerialPreyAction(eagle,hare),'pickup');assert.equal(aerialPreyAction(eagle,sheep),'pickup');assert.equal(aerialPreyAction(eagle,crow),'kill');
 assert.equal(beginCarry(eagle,sheep,100),true);assert.equal(eagle.carriedPreyId,sheep.id);assert.equal(sheep.carriedById,eagle.id);assert.ok((eagle.carryUntil??0)>100);
 assert.equal(beginCarry(eagle,hare,100),false,'one eagle cannot stack multiple prey');assert.equal(releaseCarry(eagle,all)?.id,sheep.id);assert.equal(sheep.carriedById,undefined);
});

test('carrying burns energy quickly; exhaustion forces landing and vulnerability',()=>{
 const eagle=animal('e','eagle');ensureAerialState(eagle);eagle.energy=5;eagle.carriedPreyId='h';
 const step=stepAerialEnergy(eagle,2);assert.equal(step.landed,true);assert.equal(step.exhaustedDrop,true);assert.equal(eagle.airborne,false);assert.equal(eagle.energy,0);assert.equal(groundPredatorCanReach(eagle),true);
 let tookOff=false;for(let i=0;i<400&&!tookOff;i++)tookOff=stepAerialEnergy(eagle,.5).tookOff;assert.equal(tookOff,true,'resting on foot eventually restores enough energy to take off');
});

test('wolves and bears cannot eat a flying eagle, but can prey on it after it lands',()=>{
 const eagle=animal('e','eagle',2,0),wolf=animal('w','wolf',0,0),bear=animal('b','bear',5,0),all={eagle,wolf,bear};ensureAerialState(eagle);eagle.airborne=true;
 assert.notEqual(predatorTarget(wolf,all)?.id,eagle.id);assert.notEqual(predatorTarget(bear,all)?.id,eagle.id);
 eagle.airborne=false;assert.equal(predatorTarget(wolf,all)?.id,eagle.id);assert.equal(predatorTarget(bear,all)?.id,eagle.id);
});

test('ground predator damage to an exhausted eagle uses the normal death/carcass authority path',()=>{
 const authority=new LocalAuthority();authority.state.animals={};const eagle=animal('e','eagle',1,0),wolf=animal('w','wolf',0,0);authority.state.animals[eagle.id]=eagle;authority.state.animals[wolf.id]=wolf;ensureAerialState(eagle);eagle.airborne=false;eagle.health=6;eagle.maxHealth=48;
 const hit=predatorBite(authority.state,wolf,eagle,12);assert.equal(hit.killed,true);assert.equal(animalAlive(eagle),false);assert.equal(eagle.killedBy,'wolf');assert.ok(authority.state.containers['corpse-e']);
});
