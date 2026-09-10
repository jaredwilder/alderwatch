import type {ItemId,PlayerState,WorldState} from './state';
import {PREDATOR_SPECIES,species,type AnimalState,type PredatorKind,type WildlifeKiller} from './wildlife-species';
import {groundPredatorCanReach,releaseCarry} from './wildlife-aerial';
import {animalBountyCrowns,recordAnimalAct} from './wildlife-notoriety';
import {ensureRenown,recordRenownEvent} from './renown';
import {stats} from './definitions';
import {attackProfile,combatState,faces,horizontalDistance,killFighter,type StrikeResult} from './combat-rules';
import {combatSkillFor,gainSkill} from './skills';
import {areaOf} from './area-ownership';

export function ensureAnimalVitals(animal:AnimalState){
 animal.maxHealth??=species(animal.kind).maxHealth;
 animal.health??=animal.maxHealth;
 animal.dead??=false;
 return animal;
}
export function animalAlive(animal:AnimalState){return !ensureAnimalVitals(animal).dead&&animal.health!>0;}
export function corpseId(animalId:string){return 'corpse-'+animalId;}
export function rareLootHit(world:WorldState,animal:AnimalState,oneIn:number){
 let hash=2166136261>>>0;const text=`${world.worldSeed??0}:${animal.kind}:${animal.id}:${animal.spawnGeneration??0}:rare-cut-v2`;
 for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619)>>>0;}
 return oneIn>0&&hash%oneIn===0;
}

function completeTrackedBeastBounty(world:WorldState,animal:AnimalState){
 const player=animal.lastAttackerId?world.players[animal.lastAttackerId]:undefined,progress=player?.bounties;
 if(!player||progress?.active!=='wild-most-wanted'||progress.activeAnimal!==animal.id)return;
 progress.completedAnimals??=[];
 if(!progress.completedAnimals.includes(animal.id)){
  progress.completedAnimals.push(animal.id);
  const r=ensureRenown(player),before=r.gold,reward=animalBountyCrowns(animal);
  recordRenownEvent(player,'complete_bounty',1,world.tick);
  r.gold+=Math.max(0,reward-(r.gold-before));
 }
 progress.active=undefined;progress.activeAnimal=undefined;animal.bountyClaimed=true;
}
export function killAnimal(world:WorldState,animal:AnimalState,killer:WildlifeKiller){
 ensureAnimalVitals(animal);if(animal.dead)return false;
 const animals=world.animals??{};
 if(animal.carriedPreyId)releaseCarry(animal,animals);
 if(animal.carriedById){const carrier=animals[animal.carriedById];if(carrier)releaseCarry(carrier,animals);animal.carriedById=undefined;}
 animal.health=0;animal.dead=true;animal.killedBy=killer;animal.diedAt=world.tick;animal.corpseClearedAt=undefined;animal.airborne=false;
 const id=corpseId(animal.id);
 if(!world.containers[id]){
  const profile=species(animal.kind),inventory=Object.entries(profile.loot).flatMap(([item,count])=>count?[{id:'item-'+world.nextId++,item:item as ItemId,count,quality:1}]:[]),rare=profile.rareLoot;
  if(rare&&rareLootHit(world,animal,rare.oneIn))inventory.push({id:'item-'+world.nextId++,item:rare.item,count:rare.count,quality:2});
  world.containers[id]={id,areaId:areaOf(animal),name:`${animal.kind[0].toUpperCase()+animal.kind.slice(1)} carcass`,position:[...animal.position],inventory,looted:false};
 }
 if(killer==='player')completeTrackedBeastBounty(world,animal);
 return true;
}

export function damageAnimal(world:WorldState,animal:AnimalState,damage:number,killer:WildlifeKiller,attackerId?:string){
 ensureAnimalVitals(animal);if(!animalAlive(animal))return {killed:false,damage:0};
 const dealt=Math.min(animal.health!,Math.max(1,Math.round(damage)));animal.health=Math.max(0,animal.health!-dealt);
 animal.hitAt=world.tick;animal.alarmedUntil=world.tick+360;if(attackerId)animal.lastAttackerId=attackerId;
 const killed=animal.health<=0?killAnimal(world,animal,killer):false;return {killed,damage:dealt};
}

export function resolveWildlifeStrike(world:WorldState,attacker:PlayerState,target:AnimalState|undefined,lineClear=true):StrikeResult{
 const action=combatState(attacker),weapon=attackProfile(attacker),age=(world.tick-action.started)/60;
 if(attacker.health<=0||!['attack','heavy'].includes(action.kind)||action.consumed||!weapon||age+1e-6<weapon.impact||world.tick>action.until)return {ok:false,message:'No unresolved strike at this time'};
 action.consumed=true;
 const facing=action.weapon==='bow'?.35:-.12,verticalReach=action.weapon==='bow'?(target&&species(target.kind).aerial?12:3):1.8;
 if(!target||!animalAlive(target)||!lineClear||horizontalDistance(attacker.position,target.position)>weapon.reach+.35||Math.abs(attacker.position[1]-target.position[1])>verticalReach||!faces(attacker,target as never,facing))return {ok:true,outcome:'miss',message:lineClear?'Out of reach':'Shot obstructed'};
 const damage=Math.round(weapon.damage*stats(attacker).damage),hit=damageAnimal(world,target,damage,'player',attacker.id),skill=combatSkillFor(action.weapon??attacker.equipped);if(skill){gainSkill(attacker,skill);gainSkill(attacker,'tactics');}
 return {ok:true,outcome:hit.killed?'killed':'hit',damage:hit.damage,targetId:target.id,message:hit.killed?`${target.kind} down — search the carcass`:`${target.kind} · ${target.health}/${target.maxHealth}`};
}

export function predatorBite(world:WorldState,predator:AnimalState,prey:AnimalState,damageOverride?:number){
 ensureAnimalVitals(predator);ensureAnimalVitals(prey);const config=species(predator.kind).predator;
 const reachable=predator.kind==='eagle'||groundPredatorCanReach(prey);
 if(!config||!PREDATOR_SPECIES.has(predator.kind)||!animalAlive(predator)||!animalAlive(prey)||!config.prey.includes(prey.kind)||!reachable)return {killed:false,damage:0};
 const hit=damageAnimal(world,prey,damageOverride??config.preyDamage,predator.kind as PredatorKind,predator.id);
 if(hit.killed)recordAnimalAct(predator,prey.kind==='goat'||prey.kind==='sheep'?'livestock_kill':'wild_kill',world.tick);
 return hit;
}

export function bearBite(world:WorldState,bear:AnimalState,prey:AnimalState){return predatorBite(world,bear,prey,prey.kind==='hare'?18:prey.kind==='deer'?28:24);}
export function wolfBite(world:WorldState,wolf:AnimalState,prey:AnimalState){return predatorBite(world,wolf,prey);}

export function predatorMaul(world:WorldState,predator:AnimalState,target:PlayerState):StrikeResult{
 ensureAnimalVitals(predator);const config=species(predator.kind).predator;
 if(!config||!PREDATOR_SPECIES.has(predator.kind)||!animalAlive(predator)||!animalAlive(prey)||!reachable)return {ok:false,message:'No living target'};
 const c=combatState(target),age=(world.tick-c.started)/60,kind=predator.kind;
 if(c.kind==='dodge'&&age>=.1&&age<=.46)return {ok:true,outcome:'dodged',damage:0,targetId:target.id,message:`You evade the ${kind}`};
 let damage=config.playerDamage,blocked=false;
 if(c.blocking&&faces(target,predator as never,.25)&&target.stamina>=Math.min(12,config.guardStaminaCost)){blocked=true;target.stamina=Math.max(0,target.stamina-config.guardStaminaCost);damage=config.blockedDamage;}
 target.health=Math.max(0,target.health-damage);recordAnimalAct(predator,target.health<=0?'kill_person':'attack_person',world.tick);
 if(target.health<=0)killFighter(world,target);
 else if(!blocked)target.combat={kind:'hit',started:world.tick,until:world.tick+24,consumed:true,blocking:false,weapon:target.equipped};
 const verb=kind==='bear'?'maul':'bite';
 return {ok:true,outcome:target.health<=0?'killed':blocked?'blocked':'hit',damage,targetId:target.id,message:target.health<=0?`A ${kind} brought you down`:blocked?`You catch the ${kind} strike on your guard`:`${kind[0].toUpperCase()+kind.slice(1)} ${verb} · ${damage} damage`};
}

export function bearMaul(world:WorldState,bear:AnimalState,target:PlayerState){return predatorMaul(world,bear,target);}
export function wolfMaul(world:WorldState,wolf:AnimalState,target:PlayerState){return predatorMaul(world,wolf,target);}
