import type {ItemId,PlayerState,WorldState} from './state';
import type {AnimalKind,AnimalState} from './nature';
import {stats} from './definitions';
import {attackProfile,combatState,faces,horizontalDistance,killFighter,type StrikeResult} from './combat-rules';

const VITALS:Record<AnimalKind,number>={hare:18,crow:10,goat:52,sheep:46,deer:62,bear:180};
const LOOT:Record<AnimalKind,Partial<Record<ItemId,number>>>={
 hare:{venison:1},crow:{},goat:{venison:2,hide:1},sheep:{venison:2,hide:2},deer:{venison:4,hide:2},bear:{venison:6,hide:5},
};

export function ensureAnimalVitals(animal:AnimalState){
 animal.maxHealth??=VITALS[animal.kind];
 animal.health??=animal.maxHealth;
 animal.dead??=false;
 return animal;
}
export function animalAlive(animal:AnimalState){return !ensureAnimalVitals(animal).dead&&animal.health!>0;}
export function corpseId(animalId:string){return 'corpse-'+animalId;}

export function killAnimal(world:WorldState,animal:AnimalState,killer:'player'|'bear'){
 ensureAnimalVitals(animal);if(animal.dead)return false;
 animal.health=0;animal.dead=true;animal.killedBy=killer;animal.diedAt=world.tick;
 const id=corpseId(animal.id);
 if(!world.containers[id]){
  const inventory=Object.entries(LOOT[animal.kind]).flatMap(([item,count])=>count?[{id:'item-'+world.nextId++,item:item as ItemId,count,quality:1}]:[]);
  world.containers[id]={id,name:`${animal.kind[0].toUpperCase()+animal.kind.slice(1)} carcass`,position:[...animal.position],inventory,looted:false};
 }
 return true;
}

export function damageAnimal(world:WorldState,animal:AnimalState,damage:number,killer:'player'|'bear',attackerId?:string){
 ensureAnimalVitals(animal);if(!animalAlive(animal))return {killed:false,damage:0};
 const dealt=Math.min(animal.health!,Math.max(1,Math.round(damage)));animal.health=Math.max(0,animal.health!-dealt);
 animal.hitAt=world.tick;animal.alarmedUntil=world.tick+360;if(attackerId)animal.lastAttackerId=attackerId;
 const killed=animal.health<=0?killAnimal(world,animal,killer):false;return {killed,damage:dealt};
}

export function resolveWildlifeStrike(world:WorldState,attacker:PlayerState,target:AnimalState|undefined,lineClear=true):StrikeResult{
 const action=combatState(attacker),weapon=attackProfile(attacker),age=(world.tick-action.started)/60;
 if(attacker.health<=0||!['attack','heavy'].includes(action.kind)||action.consumed||!weapon||age+1e-6<weapon.impact||world.tick>action.until)return {ok:false,message:'No unresolved strike at this time'};
 action.consumed=true;
 const facing=action.weapon==='bow'?.35:-.12;
 if(!target||!animalAlive(target)||!lineClear||horizontalDistance(attacker.position,target.position)>weapon.reach+.35||Math.abs(attacker.position[1]-target.position[1])>(action.weapon==='bow'?3:1.8)||!faces(attacker,target as never,facing))return {ok:true,outcome:'miss',message:lineClear?'Out of reach':'Shot obstructed'};
 const damage=Math.round(weapon.damage*stats(attacker).damage),hit=damageAnimal(world,target,damage,'player',attacker.id);attacker.skills.combat++;
 return {ok:true,outcome:hit.killed?'killed':'hit',damage:hit.damage,targetId:target.id,message:hit.killed?`${target.kind} down — search the carcass`:`${target.kind} · ${target.health}/${target.maxHealth}`};
}

export function bearBite(world:WorldState,bear:AnimalState,prey:AnimalState){
 ensureAnimalVitals(bear);ensureAnimalVitals(prey);if(!animalAlive(bear)||!animalAlive(prey))return {killed:false,damage:0};
 return damageAnimal(world,prey,prey.kind==='hare'?18:prey.kind==='deer'?28:24,'bear',bear.id);
}

export function bearMaul(world:WorldState,bear:AnimalState,target:PlayerState):StrikeResult{
 ensureAnimalVitals(bear);if(!animalAlive(bear)||target.health<=0)return {ok:false,message:'No living target'};
 const c=combatState(target),age=(world.tick-c.started)/60;
 if(c.kind==='dodge'&&age>=.1&&age<=.46)return {ok:true,outcome:'dodged',damage:0,targetId:target.id,message:'You evade the bear'};
 let damage=26,blocked=false;
 if(c.blocking&&faces(target,bear as never,.25)&&target.stamina>=12){blocked=true;target.stamina=Math.max(0,target.stamina-20);damage=6;}
 target.health=Math.max(0,target.health-damage);
 if(target.health<=0)killFighter(world,target);
 else if(!blocked)target.combat={kind:'hit',started:world.tick,until:world.tick+24,consumed:true,blocking:false,weapon:target.equipped};
 return {ok:true,outcome:target.health<=0?'killed':blocked?'blocked':'hit',damage,targetId:target.id,message:target.health<=0?'A bear brought you down':blocked?'You catch the bear strike on your guard':`Bear maul · ${damage} damage`};
}
