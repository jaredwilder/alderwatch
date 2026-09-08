import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {prepareNpcMaterials} from '../src/npcs';
import {skinAnimalModel} from '../src/animal-models';
import {animalDisplayName,isWantedAnimal,recordAnimalAct,WANTED_NOTORIETY} from '../src/wildlife-notoriety';
import {WILD_BOUNTY_ID,bountyCommand,refreshWildMostWanted} from '../src/bounties';
import {damageAnimal} from '../src/wildlife-rules';
import {makePlayer,seedState} from '../src/state';
import type {AnimalState} from '../src/wildlife-species';

const animal=(id:string,kind:AnimalState['kind']):AnimalState=>({id,kind,position:[8,0,12],home:[8,0,12],yaw:0,phase:0});

test('NPC material preparation never turns a single material into an invisible material array',()=>{
 const root=new T.Group(),single=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({color:'#ffffff'}));root.add(single);prepareNpcMaterials(root,'#6b4f35');
 assert.equal(Array.isArray(single.material),false);assert.equal(single.visible,true);assert.equal(single.frustumCulled,false);
 const multi=new T.Mesh(new T.BoxGeometry(),[new T.MeshStandardMaterial(),new T.MeshStandardMaterial()]);root.add(multi);prepareNpcMaterials(root,'#435b3d');assert.equal(Array.isArray(multi.material),true);assert.equal((multi.material as T.Material[]).length,2);
});

test('bare authored animal materials receive species color while preserving embedded texture maps',()=>{
 const root=new T.Group(),bareMaterial=new T.MeshStandardMaterial({color:'#ffffff'}),bare=new T.Mesh(new T.BoxGeometry(),bareMaterial),texture=new T.Texture(),mappedMaterial=new T.MeshStandardMaterial({color:'#ffffff',map:texture}),mapped=new T.Mesh(new T.BoxGeometry(),mappedMaterial);mapped.name='wolf chest';root.add(bare,mapped);
 skinAnimalModel(root,'wolf');assert.equal(Array.isArray(bare.material),false);const result=bare.material as T.MeshStandardMaterial;assert.notEqual(result.color.getHex(),0xffffff);assert.equal((mapped.material as T.MeshStandardMaterial).map,texture);
});

test('repeat animal crimes create persistent named wanted beasts instead of generic predators',()=>{
 const wolf=animal('southwood-wolf-repeat-offender','wolf');for(let i=0;i<2;i++)recordAnimalAct(wolf,'livestock_kill',100+i);
 assert.ok((wolf.notoriety??0)>=WANTED_NOTORIETY);assert.equal(isWantedAnimal(wolf),true);assert.ok(wolf.epithet);const first=animalDisplayName(wolf);assert.match(first,/Wolf, the /);wolf.bountyClaimed=true;assert.equal(isWantedAnimal(wolf),false);assert.equal(animalDisplayName(wolf),first,'earned criminal name survives the bounty claim');
});

test('wild kills are less notorious than livestock theft and human attacks',()=>{
 const wild=animal('wolf-wild','wolf'),livestock=animal('wolf-livestock','wolf'),human=animal('wolf-human','wolf');recordAnimalAct(wild,'wild_kill',1);recordAnimalAct(livestock,'livestock_kill',1);recordAnimalAct(human,'attack_person',1);recordAnimalAct(human,'attack_person',2);recordAnimalAct(human,'attack_person',3);
 assert.ok((livestock.notoriety??0)>(wild.notoriety??0));assert.ok((human.notoriety??0)>(wild.notoriety??0));assert.ok((livestock.wildKarma??0)<(wild.wildKarma??0));
});

test('the contract board can track and resolve an infamous animal without replacing human bounties',()=>{
 const world=seedState(),player=makePlayer('Hunter');world.players[player.id]=player;const wolf=animal('wanted-wolf','wolf');wolf.health=1;wolf.maxHealth=74;recordAnimalAct(wolf,'livestock_kill',10);recordAnimalAct(wolf,'livestock_kill',11);world.animals={[wolf.id]:wolf};
 const target=refreshWildMostWanted(world);assert.equal(target?.id,wolf.id);assert.equal(world.bountySites?.[WILD_BOUNTY_ID]?.position[0],wolf.position[0]);
 const accepted=bountyCommand(world,player,'accept',WILD_BOUNTY_ID);assert.equal(accepted.ok,true);assert.equal(player.bounties?.active,WILD_BOUNTY_ID);assert.equal(player.bounties?.activeAnimal,wolf.id);
 const killed=damageAnimal(world,wolf,999,'player',player.id);assert.equal(killed.killed,true);assert.equal(wolf.bountyClaimed,true);assert.equal(player.bounties?.active,undefined);assert.ok(player.bounties?.completedAnimals?.includes(wolf.id));
});
