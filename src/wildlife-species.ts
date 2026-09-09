import type {ItemId,Vec3} from './state';

export type AnimalKind='hare'|'crow'|'goat'|'sheep'|'deer'|'bear'|'bison'|'wolf'|'eagle';
export type AuthoredAnimalKind=AnimalKind;
export type PredatorKind='bear'|'wolf'|'eagle';
export type WildlifeKiller='player'|PredatorKind;

export interface AnimalState {
 id:string;
 kind:AnimalKind;
 position:Vec3;
 home:Vec3;
 yaw:number;
 phase:number;
 packId?:string;
 avoidUntil?:number;
 health?:number;
 maxHealth?:number;
 dead?:boolean;
 killedBy?:WildlifeKiller;
 diedAt?:number;
 attackAt?:number;
 attackingUntil?:number;
 huntTargetId?:string;
 huntUntil?:number;
 huntBestDistance?:number;
 huntCooldownUntil?:number;
 hitAt?:number;
 alarmedUntil?:number;
 lastAttackerId?:string;
 aggroPlayerId?:string;
 aggroUntil?:number;
 // Persistent animal morality/notoriety. This is intentionally civilization-biased and funny, not a claim that predation is morally wrong.
 wildKarma?:number;
 notoriety?:number;
 misdeeds?:Record<string,number>;
 wantedSince?:number;
 epithet?:string;
 bountyClaimed?:boolean;
 // Aerial ecology state is persisted because a reload should not magically refill a tired bird.
 energy?:number;
 airborne?:boolean;
 carriedPreyId?:string;
 carriedById?:string;
 carryUntil?:number;
}

export interface AerialProfile {
 maxEnergy:number;
 takeoffEnergy:number;
 cruiseHeight:number;
 huntHeight:number;
 flightDrainPerSecond:number;
 carryDrainPerSecond:number;
 groundRecoverPerSecond:number;
 carrySeconds:number;
 pickupPrey:readonly AnimalKind[];
 killPrey:readonly AnimalKind[];
}

export interface RareLootProfile {item:ItemId;count:number;oneIn:number;}
export interface WildlifeSpecies {
 authored:boolean;
 modelHeight?:number;
 aimHeight:number;
 deathRoll:number;
 maxHealth:number;
 loot:Partial<Record<ItemId,number>>;
 rareLoot?:RareLootProfile;
 herd:boolean;
 grazes:boolean;
 fleeRadius:number;
 homeRadius:number;
 wanderSpeed:number;
 escapeSpeed:number;
 turnRate:number;
 aerial?:AerialProfile;
 predator?:{
  prey:readonly AnimalKind[];
  acquireRadius:number;
  chaseSpeed:number;
  attackReach:number;
  attackCooldown:number;
  preyDamage:number;
  playerAggroRadius:number;
  provokedRadius:number;
  playerDamage:number;
  blockedDamage:number;
  guardStaminaCost:number;
 };
}

export const WILDLIFE_SPECIES:Record<AnimalKind,WildlifeSpecies>={
 hare:{authored:false,modelHeight:.55,aimHeight:.28,deathRoll:1.18,maxHealth:18,loot:{hare_meat:1},rareLoot:{item:'hare_saddle',count:1,oneIn:10},herd:false,grazes:false,fleeRadius:6,homeRadius:8,wanderSpeed:.6,escapeSpeed:3.8,turnRate:4.8},
 crow:{authored:false,modelHeight:.48,aimHeight:.25,deathRoll:1.18,maxHealth:10,loot:{crow_meat:1,crow_crop:1},rareLoot:{item:'crow_breast',count:1,oneIn:12},herd:false,grazes:false,fleeRadius:6,homeRadius:8,wanderSpeed:.6,escapeSpeed:3.8,turnRate:4.8},
 goat:{authored:true,modelHeight:.9,aimHeight:.62,deathRoll:1.18,maxHealth:52,loot:{goat_meat:2,hide:1},rareLoot:{item:'goat_tenderloin',count:1,oneIn:8},herd:true,grazes:false,fleeRadius:7.5,homeRadius:13,wanderSpeed:.62,escapeSpeed:3.6,turnRate:4.8},
 sheep:{authored:true,modelHeight:.95,aimHeight:.62,deathRoll:1.18,maxHealth:46,loot:{mutton:2,hide:2},rareLoot:{item:'mutton_rack',count:1,oneIn:8},herd:true,grazes:false,fleeRadius:8,homeRadius:13,wanderSpeed:.56,escapeSpeed:3.5,turnRate:4.8},
 deer:{authored:true,modelHeight:1.75,aimHeight:.85,deathRoll:1.18,maxHealth:62,loot:{venison:4,hide:2},rareLoot:{item:'hart_tenderloin',count:1,oneIn:10},herd:true,grazes:true,fleeRadius:12,homeRadius:22,wanderSpeed:.82,escapeSpeed:5.6,turnRate:4.8},
 bear:{authored:true,modelHeight:1.65,aimHeight:1,deathRoll:.72,maxHealth:180,loot:{bear_meat:6,hide:5},rareLoot:{item:'bear_rib',count:1,oneIn:6},herd:false,grazes:false,fleeRadius:0,homeRadius:38,wanderSpeed:.72,escapeSpeed:1.8,turnRate:2.5,predator:{prey:['hare','goat','sheep','deer','bison','wolf','eagle'],acquireRadius:25,chaseSpeed:4.1,attackReach:1.75,attackCooldown:72,preyDamage:24,playerAggroRadius:6.5,provokedRadius:34,playerDamage:26,blockedDamage:6,guardStaminaCost:20}},
 bison:{authored:true,modelHeight:1.9,aimHeight:1.15,deathRoll:1.05,maxHealth:240,loot:{bison_meat:8,hide:6},rareLoot:{item:'bison_hump',count:1,oneIn:7},herd:true,grazes:true,fleeRadius:4.5,homeRadius:30,wanderSpeed:.52,escapeSpeed:4.8,turnRate:3.2},
 wolf:{authored:true,modelHeight:1.05,aimHeight:.58,deathRoll:1.08,maxHealth:74,loot:{wolf_meat:2,hide:1},rareLoot:{item:'wolf_loin',count:1,oneIn:8},herd:true,grazes:false,fleeRadius:0,homeRadius:34,wanderSpeed:.72,escapeSpeed:5.2,turnRate:5.4,predator:{prey:['hare','goat','sheep','deer','bison','eagle'],acquireRadius:42,chaseSpeed:5.35,attackReach:1.55,attackCooldown:96,preyDamage:12,playerAggroRadius:4.5,provokedRadius:38,playerDamage:14,blockedDamage:4,guardStaminaCost:13}},
 eagle:{authored:true,modelHeight:.95,aimHeight:.48,deathRoll:1.16,maxHealth:48,loot:{eagle_meat:1},rareLoot:{item:'eagle_breast',count:1,oneIn:9},herd:false,grazes:false,fleeRadius:0,homeRadius:58,wanderSpeed:1.05,escapeSpeed:2.8,turnRate:3.8,
  aerial:{maxEnergy:80,takeoffEnergy:44,cruiseHeight:7.5,huntHeight:4.8,flightDrainPerSecond:1.05,carryDrainPerSecond:3.2,groundRecoverPerSecond:1.1,carrySeconds:9,pickupPrey:['hare','sheep'],killPrey:['crow']},
  predator:{prey:['hare','sheep','crow'],acquireRadius:52,chaseSpeed:8.4,attackReach:1.75,attackCooldown:105,preyDamage:12,playerAggroRadius:0,provokedRadius:0,playerDamage:0,blockedDamage:0,guardStaminaCost:0}},
};

export const AUTHORED_ANIMAL_KINDS=(Object.keys(WILDLIFE_SPECIES) as AnimalKind[]).filter(kind=>WILDLIFE_SPECIES[kind].authored) as AuthoredAnimalKind[];
export const AUTHORED_ANIMAL_SET=new Set<AnimalKind>(AUTHORED_ANIMAL_KINDS);
export const HERD_SPECIES=new Set<AnimalKind>((Object.keys(WILDLIFE_SPECIES) as AnimalKind[]).filter(kind=>WILDLIFE_SPECIES[kind].herd));
export const PREDATOR_SPECIES=new Set<AnimalKind>((Object.keys(WILDLIFE_SPECIES) as AnimalKind[]).filter(kind=>!!WILDLIFE_SPECIES[kind].predator));

export function species(kind:AnimalKind){return WILDLIFE_SPECIES[kind];}
export function predatorCanHunt(predator:AnimalKind,prey:AnimalKind){return WILDLIFE_SPECIES[predator].predator?.prey.includes(prey)??false;}
export function aerialProfile(kind:AnimalKind){return WILDLIFE_SPECIES[kind].aerial;}
