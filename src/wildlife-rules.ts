import type {ItemId,PlayerState,WorldState} from './state';
import type {AnimalKind,AnimalState} from './nature';
import {attackProfile,combatState,faces,horizontalDistance,type StrikeResult} from './combat-rules';

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

export function damageAnimal(world:WorldState,animal:AnimalState,damage:number,killer:'player'|'bear'){
 ensureAnimalVitals(animal);if(!animalAlive(animal))return {killed:false,damage:0};
 const dealt=Math.min(animal.health!,Math.max(1,Math.round(damage)));animal.health=Math.max(0,animal.health!-dealt);
 const killed=animal.health<=0?killAnimal(world,animal,killer):false;return {killed,damage:dealt};
}

export function resolveWildlifeStrike(world:WorldState,attacker:PlayerState,target:AnimalState|undefined):StrikeResult{
 const action=combatState(attacker),weapon=attackProfile(attacker),age=(world.tick-action.started)/60;
 if(attacker.health<=0||!['attack','heavy'].includes(action.kind)||action.consumed||!weapon||age+1e-6<weapon.impact||world.tick>action.until)return {ok:false,message:'No unresolved strike at this time'};
 action.consumed=true;
 if(!target||!animalAlive(target)||horizontalDistance(attacker.position,target.position)>weapon.reach+.35||Math.abs(attacker.position[1]-target.position[1])>1.8||!faces(attacker,target as never,0))return {ok:true,outcome:'miss',message:'Out of reach'};
 const damage=Math.round(weapon.damage*(action.kind==='heavy'?1.7:1));const hit=damageAnimal(world,target,damage,'player');attacker.skills.combat++;
 return {ok:true,outcome:hit.killed?'killed':'hit',damage:hit.damage,targetId:target.id,message:hit.killed?`${target.kind} down — search the carcass`:`${target.kind} · ${target.health}/${target.maxHealth}`};
}

export function bearBite(world:WorldState,bear:AnimalState,prey:AnimalState){
 ensureAnimalVitals(bear);ensureAnimalVitals(prey);if(!animalAlive(bear)||!animalAlive(prey))return {killed:false,damage:0};
 return damageAnimal(world,prey,prey.kind==='hare'?18:prey.kind==='deer'?28:24,'bear');
}
