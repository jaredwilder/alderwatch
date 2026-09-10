import type {WorldState} from './state';
import {corpseId} from './wildlife-rules';
import {species,type AnimalKind,type AnimalState} from './wildlife-species';
import {WILDLIFE_SPAWNS,type WildlifeSpawn} from './wildlife-spawns';

export const WILDLIFE_DIRECTOR_PULSE_TICKS=120;
export const WILDLIFE_PLAYER_EXCLUSION_RADIUS=42;
export const WILDLIFE_ENCOUNTER_RING_MIN=58;
export const WILDLIFE_ENCOUNTER_RING_MAX=165;
export const WILDLIFE_MAX_RESPAWNS_PER_PULSE=3;

const TICKS_PER_SECOND=60;
const LOCAL_PRESSURE_RADIUS=125;
const PLAYER_CORPSE_TICKS=60*TICKS_PER_SECOND;
const PREDATOR_CORPSE_TICKS=22*TICKS_PER_SECOND;
const EMPTY_CORPSE_TICKS=10*TICKS_PER_SECOND;

// Gameplay population cadence, not literal animal reproduction time. Stable spawn IDs are habitat
// opportunities; each refill is a new individual. Common prey returns quickly, apex wildlife slowly.
const RESPAWN_SECONDS:Record<AnimalKind,readonly [number,number]>={
 hare:[34,52],rabbit:[30,48],crow:[30,48],
 goat:[52,78],sheep:[50,76],deer:[48,74],fox:[58,86],boar:[58,88],
 stag:[88,132],bison:[100,150],wolf:[125,185],eagle:[130,195],bear:[190,270],
};
const DESIRED_OCCUPANCY:Record<AnimalKind,number>={
 hare:.96,rabbit:.96,crow:.94,goat:.94,sheep:.94,deer:.95,fox:.88,boar:.9,
 stag:.82,bison:.82,wolf:.78,eagle:.72,bear:.68,
};

const spawnById=new Map(WILDLIFE_SPAWNS.map(s=>[s.id,s] as const));
const slotsByKind=new Map<AnimalKind,WildlifeSpawn[]>();
for(const spawn of WILDLIFE_SPAWNS){const list=slotsByKind.get(spawn.kind)??[];list.push(spawn);slotsByKind.set(spawn.kind,list);}
const localSlots=new Map<string,WildlifeSpawn[]>();
for(const spawn of WILDLIFE_SPAWNS)localSlots.set(spawn.id,WILDLIFE_SPAWNS.filter(other=>Math.hypot(other.x-spawn.x,other.z-spawn.z)<=LOCAL_PRESSURE_RADIUS));

export interface WildlifePopulationEnvironment {
 groundY?:(x:number,z:number)=>number;
 blocked?:(x:number,z:number)=>boolean;
}
export interface WildlifePopulationStep {
 clearedCorpses:string[];
 respawned:string[];
 deferredNearPlayer:string[];
}

function hash32(text:string){let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h;}
function unitHash(world:WorldState,animal:AnimalState,salt:string,generation=(animal.spawnGeneration??0)+1){return hash32(`${world.worldSeed??0}:${animal.id}:${generation}:${salt}`)/0xffffffff;}
function alive(animal:AnimalState|undefined){return !!animal&&!animal.dead&&(animal.health??species(animal.kind).maxHealth)>0;}
function distance2d(position:readonly number[],x:number,z:number){return Math.hypot(position[0]-x,position[2]-z);}
function nearestPlayerDistance(world:WorldState,x:number,z:number){let best=Infinity;for(const player of Object.values(world.players))if(player.health>0)best=Math.min(best,distance2d(player.position,x,z));return best;}

export function wildlifeCorpseLifetimeTicks(animal:AnimalState,world:WorldState){
 const container=world.containers[corpseId(animal.id)];
 if(container&&(container.looted||container.inventory.length===0))return EMPTY_CORPSE_TICKS;
 return animal.killedBy==='player'?PLAYER_CORPSE_TICKS:PREDATOR_CORPSE_TICKS;
}

export function wildlifeScarcity(world:WorldState,animal:AnimalState){
 const spawn=spawnById.get(animal.id);if(!spawn)return 0;
 const kindSlots=slotsByKind.get(animal.kind)??[];
 const speciesAlive=kindSlots.reduce((n,slot)=>n+(alive(world.animals?.[slot.id])?1:0),0);
 const speciesRatio=kindSlots.length?speciesAlive/kindSlots.length:1;
 const nearby=localSlots.get(spawn.id)??[];
 const localAlive=nearby.reduce((n,slot)=>n+(alive(world.animals?.[slot.id])?1:0),0);
 const localRatio=nearby.length?localAlive/nearby.length:1;
 return Math.max(0,1-Math.min(1,speciesRatio/DESIRED_OCCUPANCY[animal.kind],localRatio/.9));
}

export function wildlifeRespawnDelayTicks(world:WorldState,animal:AnimalState){
 const [lo,hi]=RESPAWN_SECONDS[animal.kind];
 const base=lo+(hi-lo)*unitHash(world,animal,'respawn');
 const scarcityBias=1-.56*wildlifeScarcity(world,animal);
 const spawn=spawnById.get(animal.id);
 const playerDistance=spawn?nearestPlayerDistance(world,spawn.x,spawn.z):Infinity;
 const inEncounterRing=playerDistance>=WILDLIFE_ENCOUNTER_RING_MIN&&playerDistance<=WILDLIFE_ENCOUNTER_RING_MAX;
 const encounterBias=inEncounterRing?.72:1;
 return Math.max(20*TICKS_PER_SECOND,Math.round(base*encounterBias*scarcityBias*TICKS_PER_SECOND));
}

function clearIndividualState(animal:AnimalState){
 const profile=species(animal.kind);
 animal.dead=false;animal.killedBy=undefined;animal.diedAt=undefined;animal.corpseClearedAt=undefined;
 animal.health=profile.maxHealth;animal.maxHealth=profile.maxHealth;
 animal.avoidUntil=undefined;animal.attackAt=undefined;animal.attackingUntil=undefined;animal.huntTargetId=undefined;animal.huntUntil=undefined;animal.huntBestDistance=undefined;animal.huntCooldownUntil=undefined;animal.hitAt=undefined;animal.alarmedUntil=undefined;animal.lastAttackerId=undefined;animal.aggroPlayerId=undefined;animal.aggroUntil=undefined;
 animal.energy=profile.aerial?.maxEnergy;animal.airborne=false;animal.carriedPreyId=undefined;animal.carriedById=undefined;animal.carryUntil=undefined;
 // Notoriety/bounty history belongs to the dead individual, not to its reusable habitat slot.
 animal.wildKarma=undefined;animal.notoriety=undefined;animal.misdeeds=undefined;animal.wantedSince=undefined;animal.epithet=undefined;animal.bountyClaimed=undefined;
}

function respawnPoint(world:WorldState,animal:AnimalState,spawn:WildlifeSpawn,env:WildlifePopulationEnvironment){
 const generation=(animal.spawnGeneration??0)+1;
 const maxJitter=Math.min(14,Math.max(5,species(animal.kind).homeRadius*.48));
 for(let attempt=0;attempt<7;attempt++){
  const angle=unitHash(world,animal,`angle-${attempt}`,generation)*Math.PI*2;
  const radius=maxJitter*(.25+.75*unitHash(world,animal,`radius-${attempt}`,generation));
  const x=spawn.x+Math.sin(angle)*radius,z=spawn.z+Math.cos(angle)*radius;
  if(nearestPlayerDistance(world,x,z)<WILDLIFE_PLAYER_EXCLUSION_RADIUS||env.blocked?.(x,z))continue;
  return [x,env.groundY?.(x,z)??0,z] as [number,number,number];
 }
 if(nearestPlayerDistance(world,spawn.x,spawn.z)<WILDLIFE_PLAYER_EXCLUSION_RADIUS||env.blocked?.(spawn.x,spawn.z))return undefined;
 return [spawn.x,env.groundY?.(spawn.x,spawn.z)??0,spawn.z] as [number,number,number];
}

function revive(world:WorldState,animal:AnimalState,spawn:WildlifeSpawn,env:WildlifePopulationEnvironment){
 const point=respawnPoint(world,animal,spawn,env);if(!point)return false;
 delete world.containers[corpseId(animal.id)];
 animal.spawnGeneration=(animal.spawnGeneration??0)+1;
 clearIndividualState(animal);
 animal.position=[...point];animal.home=[...point];animal.yaw=unitHash(world,animal,'yaw',animal.spawnGeneration)*Math.PI*2;animal.phase=animal.yaw*1.7;animal.packId=spawn.packId;
 return true;
}

export function stepWildlifePopulation(world:WorldState,env:WildlifePopulationEnvironment={}):WildlifePopulationStep{
 const result:WildlifePopulationStep={clearedCorpses:[],respawned:[],deferredNearPlayer:[]};
 if(!world.animals)return result;
 const candidates:{animal:AnimalState;spawn:WildlifeSpawn;score:number}[]=[];
 for(const animal of Object.values(world.animals)){
  if(alive(animal))continue;
  const spawn=spawnById.get(animal.id);if(!spawn||animal.diedAt===undefined)continue;
  const corpseAge=world.tick-animal.diedAt;
  if(animal.corpseClearedAt===undefined&&corpseAge>=wildlifeCorpseLifetimeTicks(animal,world)){
   delete world.containers[corpseId(animal.id)];animal.corpseClearedAt=world.tick;result.clearedCorpses.push(animal.id);
  }
  const delay=wildlifeRespawnDelayTicks(world,animal);
  if(animal.corpseClearedAt===undefined||corpseAge<delay)continue;
  if(nearestPlayerDistance(world,spawn.x,spawn.z)<WILDLIFE_PLAYER_EXCLUSION_RADIUS){result.deferredNearPlayer.push(animal.id);continue;}
  const playerDistance=nearestPlayerDistance(world,spawn.x,spawn.z);
  const encounter=playerDistance>=WILDLIFE_ENCOUNTER_RING_MIN&&playerDistance<=WILDLIFE_ENCOUNTER_RING_MAX?1:0;
  const score=corpseAge/Math.max(1,delay)+wildlifeScarcity(world,animal)*2.4+encounter*.8+unitHash(world,animal,'queue')*.05;
  candidates.push({animal,spawn,score});
 }
 candidates.sort((a,b)=>b.score-a.score);
 for(const candidate of candidates.slice(0,WILDLIFE_MAX_RESPAWNS_PER_PULSE))if(revive(world,candidate.animal,candidate.spawn,env))result.respawned.push(candidate.animal.id);
 return result;
}
