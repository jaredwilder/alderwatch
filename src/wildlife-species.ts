import type {ItemId} from './state';

export type AnimalKind='hare'|'crow'|'goat'|'sheep'|'deer'|'bear'|'bison'|'wolf';
export type AuthoredAnimalKind=Exclude<AnimalKind,'hare'|'crow'>;
export type PredatorKind='bear'|'wolf';

export interface WildlifeSpecies {
 authored:boolean;
 modelHeight?:number;
 maxHealth:number;
 loot:Partial<Record<ItemId,number>>;
 herd:boolean;
 grazes:boolean;
 fleeRadius:number;
 homeRadius:number;
 wanderSpeed:number;
 escapeSpeed:number;
 turnRate:number;
 predator?:{
  prey:readonly AnimalKind[];
  acquireRadius:number;
  chaseSpeed:number;
  attackReach:number;
  attackCooldown:number;
  playerAggroRadius:number;
  provokedRadius:number;
 };
}

export const WILDLIFE_SPECIES:Record<AnimalKind,WildlifeSpecies>={
 hare:{authored:false,maxHealth:18,loot:{venison:1},herd:false,grazes:false,fleeRadius:6,homeRadius:8,wanderSpeed:.6,escapeSpeed:3.8,turnRate:4.8},
 crow:{authored:false,maxHealth:10,loot:{crow_crop:1},herd:false,grazes:false,fleeRadius:6,homeRadius:8,wanderSpeed:.6,escapeSpeed:3.8,turnRate:4.8},
 goat:{authored:true,modelHeight:.9,maxHealth:52,loot:{venison:2,hide:1},herd:true,grazes:false,fleeRadius:7.5,homeRadius:13,wanderSpeed:.62,escapeSpeed:3.6,turnRate:4.8},
 sheep:{authored:true,modelHeight:.95,maxHealth:46,loot:{venison:2,hide:2},herd:true,grazes:false,fleeRadius:8,homeRadius:13,wanderSpeed:.56,escapeSpeed:3.5,turnRate:4.8},
 deer:{authored:true,modelHeight:1.75,maxHealth:62,loot:{venison:4,hide:2},herd:true,grazes:true,fleeRadius:12,homeRadius:22,wanderSpeed:.82,escapeSpeed:5.6,turnRate:4.8},
 bear:{authored:true,modelHeight:1.65,maxHealth:180,loot:{venison:6,hide:5},herd:false,grazes:false,fleeRadius:0,homeRadius:38,wanderSpeed:.72,escapeSpeed:1.8,turnRate:2.5,predator:{prey:['hare','goat','sheep','deer'],acquireRadius:23,chaseSpeed:4.1,attackReach:1.75,attackCooldown:72,playerAggroRadius:6.5,provokedRadius:34}},
 bison:{authored:true,modelHeight:1.9,maxHealth:240,loot:{venison:8,hide:6},herd:true,grazes:true,fleeRadius:4.5,homeRadius:30,wanderSpeed:.52,escapeSpeed:4.8,turnRate:3.2},
 wolf:{authored:true,modelHeight:1.05,maxHealth:74,loot:{venison:2,hide:1},herd:true,grazes:false,fleeRadius:0,homeRadius:34,wanderSpeed:.72,escapeSpeed:5.2,turnRate:5.4,predator:{prey:['bison'],acquireRadius:42,chaseSpeed:5.35,attackReach:1.55,attackCooldown:96,playerAggroRadius:4.5,provokedRadius:38}},
};

export const AUTHORED_ANIMAL_KINDS=(Object.keys(WILDLIFE_SPECIES) as AnimalKind[]).filter(kind=>WILDLIFE_SPECIES[kind].authored) as AuthoredAnimalKind[];
export const AUTHORED_ANIMAL_SET=new Set<AnimalKind>(AUTHORED_ANIMAL_KINDS);
export const HERD_SPECIES=new Set<AnimalKind>((Object.keys(WILDLIFE_SPECIES) as AnimalKind[]).filter(kind=>WILDLIFE_SPECIES[kind].herd));
export const PREDATOR_SPECIES=new Set<AnimalKind>((Object.keys(WILDLIFE_SPECIES) as AnimalKind[]).filter(kind=>!!WILDLIFE_SPECIES[kind].predator));

export function species(kind:AnimalKind){return WILDLIFE_SPECIES[kind];}
export function predatorCanHunt(predator:AnimalKind,prey:AnimalKind){return WILDLIFE_SPECIES[predator].predator?.prey.includes(prey)??false;}
