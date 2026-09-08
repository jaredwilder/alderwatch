import type {WorldState} from './state';
import {worldBits,worldInt} from './world-address';
import {CITIZEN_PHASES,addPopulationDelta,applyPopulationBlock,identityPopulationBlock,populationBlockFor,summarizePopulationInputs,zeroPopulationDelta,zeroPopulationHistogram,type CitizenPhase,type PopulationBlock,type PopulationDelta,type PopulationHistogram,type PopulationInput} from './population-morphism';

export const REALM_LOGICAL_POPULATION=1_048_576; // 2^20 persistent logical identities
export const REALM_POPULATION_SHARDS=256;
export const REALM_SHARD_SIZE=4_096;
export const REALM_ACTIVE_RESIDENT_CAP=96;
export const REALM_POPULATION_DAY_TICKS=3_600;
export const REALM_POPULATION_EPOCH_DAYS=30;

export interface NamedCitizenException{
 id:string;ordinal:number;shard:number;localOrdinal:number;initialPhase:CitizenPhase;phase:CitizenPhase;promotedAtDay:number;reason:string;
}
export interface RealmPopulationState{
 version:1;population:number;shardSize:number;lastProcessedDay:number;
 bulkInitial:PopulationHistogram;bulkCurrent:PopulationHistogram;lineage:Record<CitizenPhase,CitizenPhase>;
 exceptions:Record<string,NamedCitizenException>;totals:PopulationDelta;recent:string[];
}
export interface CitizenDescriptor{id:string;ordinal:number;shard:number;localOrdinal:number;phase:CitizenPhase;named:boolean;identityBits:number}

declare module './state'{interface WorldState{realmPopulation?:RealmPopulationState}}

function phaseOffset(seed:number){return worldInt({realmSeed:seed,areaId:'realm-population',cellX:0,cellZ:0,slot:0,tag:'phase-offset'},CITIZEN_PHASES.length);}
export function initialPopulationHistogram(population:number,seed:number):PopulationHistogram{
 if(!Number.isSafeInteger(population)||population<0)throw new Error('population must be a non-negative safe integer');
 const histogram=zeroPopulationHistogram(),k=CITIZEN_PHASES.length,q=Math.floor(population/k),r=population%k,offset=phaseOffset(seed);
 for(const phase of CITIZEN_PHASES)histogram[phase]=q;for(let i=0;i<r;i++)histogram[CITIZEN_PHASES[(i+offset)%k]]++;
 return histogram;
}
export function initialCitizenPhase(seed:number,ordinal:number):CitizenPhase{
 if(!Number.isSafeInteger(ordinal)||ordinal<0)throw new Error('ordinal must be a non-negative safe integer');return CITIZEN_PHASES[(ordinal+phaseOffset(seed))%CITIZEN_PHASES.length];
}
export function seedRealmPopulationState(seed:number,population=REALM_LOGICAL_POPULATION,shardSize=REALM_SHARD_SIZE):RealmPopulationState{
 if(!Number.isSafeInteger(shardSize)||shardSize<=0)throw new Error('shardSize must be a positive safe integer');
 const bulkInitial=initialPopulationHistogram(population,seed),lineage={} as Record<CitizenPhase,CitizenPhase>;for(const phase of CITIZEN_PHASES)lineage[phase]=phase;
 return {version:1,population,shardSize,lastProcessedDay:0,bulkInitial,bulkCurrent:{...bulkInitial},lineage,exceptions:{},totals:zeroPopulationDelta(),recent:[]};
}
export function ensureRealmPopulation(world:WorldState):RealmPopulationState{
 world.realmPopulation??=seedRealmPopulationState(world.worldSeed??197709);return world.realmPopulation;
}

/** Injective persistent identity: the ordinal is embedded; checksum guards accidental corruption. */
export function citizenId(seed:number,ordinal:number):string{
 const shard=Math.floor(ordinal/REALM_SHARD_SIZE),local=ordinal%REALM_SHARD_SIZE,bits=worldBits({realmSeed:seed,areaId:'realm-population',cellX:shard,cellZ:0,slot:local,tag:'citizen-id'});
 return `aw:${ordinal.toString(36)}:${bits.toString(36)}`;
}
export function citizenOrdinalFromId(id:string):number|undefined{const match=/^aw:([0-9a-z]+):[0-9a-z]+$/.exec(id);if(!match)return undefined;const ordinal=parseInt(match[1],36);return Number.isSafeInteger(ordinal)&&ordinal>=0?ordinal:undefined;}
export const citizenShard=(ordinal:number,shardSize=REALM_SHARD_SIZE)=>Math.floor(ordinal/shardSize);

export function describeCitizen(state:RealmPopulationState,seed:number,ordinal:number):CitizenDescriptor{
 if(!Number.isSafeInteger(ordinal)||ordinal<0||ordinal>=state.population)throw new Error('citizen ordinal outside realm population');
 const id=citizenId(seed,ordinal),named=state.exceptions[id];if(named)return {id,ordinal,shard:named.shard,localOrdinal:named.localOrdinal,phase:named.phase,named:true,identityBits:worldBits({realmSeed:seed,areaId:'realm-population-trait',cellX:named.shard,cellZ:0,slot:named.localOrdinal,tag:'identity'})};
 const initial=initialCitizenPhase(seed,ordinal),shard=citizenShard(ordinal,state.shardSize);return {id,ordinal,shard,localOrdinal:ordinal%state.shardSize,phase:state.lineage[initial],named:false,identityBits:worldBits({realmSeed:seed,areaId:'realm-population-trait',cellX:shard,cellZ:0,slot:ordinal%state.shardSize,tag:'identity'})};
}

export function promoteCitizen(state:RealmPopulationState,seed:number,ordinal:number,reason='player-observed'):NamedCitizenException{
 const id=citizenId(seed,ordinal),prior=state.exceptions[id];if(prior)return prior;if(ordinal<0||ordinal>=state.population)throw new Error('citizen ordinal outside realm population');
 const initialPhase=initialCitizenPhase(seed,ordinal),phase=state.lineage[initialPhase],shard=citizenShard(ordinal,state.shardSize);if(state.bulkInitial[initialPhase]<=0||state.bulkCurrent[phase]<=0)throw new Error('population certificate underflow while promoting citizen');
 state.bulkInitial[initialPhase]--;state.bulkCurrent[phase]--;const named={id,ordinal,shard,localOrdinal:ordinal%state.shardSize,initialPhase,phase,promotedAtDay:state.lastProcessedDay,reason};state.exceptions[id]=named;return named;
}
export function setNamedCitizenPhase(state:RealmPopulationState,id:string,phase:CitizenPhase):void{const citizen=state.exceptions[id];if(!citizen)throw new Error('citizen must be promoted before individual mutation');citizen.phase=phase;}

export function realmPopulationInput(seed:number,day:number):PopulationInput{
 const roll=worldInt({realmSeed:seed,areaId:'realm-population',cellX:Math.floor(day/256),cellZ:0,slot:day&255,tag:'daily-input'},100);
 if(roll<32)return 'quiet';if(roll<48)return 'harvest';if(roll<63)return 'mine_push';if(roll<73)return 'festival';if(roll<83)return 'levy';if(roll<91)return 'raid';return 'recovery';
}
const inputLabel=(input:PopulationInput)=>({quiet:'ordinary day',harvest:'realm harvest',mine_push:'mining push',festival:'market festival',levy:'marcher levy',raid:'regional raid',recovery:'recovery day'}[input]);

export function applyRealmPopulationBlock(state:RealmPopulationState,block:PopulationBlock):{delta:PopulationDelta;workUnits:number}{
 const bulk=applyPopulationBlock(state.bulkCurrent,block);state.bulkCurrent=bulk.histogram;let delta=bulk.delta,workUnits=bulk.workUnits;
 for(const citizen of Object.values(state.exceptions)){const transition=block.table[citizen.phase];citizen.phase=transition.phase;delta=addPopulationDelta(delta,transition.delta);workUnits++;}
 for(const initial of CITIZEN_PHASES)state.lineage[initial]=block.table[state.lineage[initial]].phase;state.totals=addPopulationDelta(state.totals,delta);return {delta,workUnits};
}

/** Long inactive spans cost O(days*phaseCount + epochs*exceptions), never O(population*days). */
export function advanceRealmPopulationToDay(state:RealmPopulationState,seed:number,targetDay:number):{days:number;epochs:number;workUnits:number}{
 if(!Number.isInteger(targetDay)||targetDay<state.lastProcessedDay)throw new Error('population time cannot move backwards');const start=state.lastProcessedDay;let epochs=0,workUnits=0;
 while(state.lastProcessedDay<targetDay){const end=Math.min(targetDay,state.lastProcessedDay+REALM_POPULATION_EPOCH_DAYS),inputs:PopulationInput[]=[];for(let day=state.lastProcessedDay+1;day<=end;day++)inputs.push(realmPopulationInput(seed,day));const block=summarizePopulationInputs(inputs),applied=applyRealmPopulationBlock(state,block);workUnits+=applied.workUnits;epochs++;for(let i=0;i<inputs.length;i++)state.recent.push(`Day ${state.lastProcessedDay+i+1} · ${inputLabel(inputs[i])}`);state.recent=state.recent.slice(-12);state.lastProcessedDay=end;}
 return {days:targetDay-start,epochs,workUnits};
}
export function advanceRealmPopulationToTick(world:WorldState){const state=ensureRealmPopulation(world),day=Math.floor(world.tick/REALM_POPULATION_DAY_TICKS);return advanceRealmPopulationToDay(state,world.worldSeed??197709,day);}

export class PopulationBubble{
 readonly active=new Map<string,CitizenDescriptor>();candidateChecks=0;
 constructor(readonly cap=REALM_ACTIVE_RESIDENT_CAP){if(!Number.isInteger(cap)||cap<1)throw new Error('population bubble cap must be positive');}
 update(state:RealmPopulationState,seed:number,shard:number,focusKey=0):readonly CitizenDescriptor[]{
  this.active.clear();this.candidateChecks=0;const first=shard*state.shardSize;if(first>=state.population||shard<0)return [];
  const last=Math.min(state.population,first+state.shardSize),named=Object.values(state.exceptions).filter(c=>c.shard===shard).sort((a,b)=>a.ordinal-b.ordinal);
  for(const citizen of named){if(this.active.size>=this.cap)break;const d=describeCitizen(state,seed,citizen.ordinal);this.active.set(d.id,d);}
  const width=last-first,start=((focusKey>>>0)%width),stride=257;for(let i=0;i<width&&this.active.size<this.cap;i++){this.candidateChecks++;const ordinal=first+(start+i*stride)%width,d=describeCitizen(state,seed,ordinal);if(!this.active.has(d.id))this.active.set(d.id,d);}
  return [...this.active.values()];
 }
 get maxActive(){return this.cap;}
}

export function populationAccounting(state:RealmPopulationState):{bulk:number;named:number;total:number}{let bulk=0;for(const phase of CITIZEN_PHASES)bulk+=state.bulkCurrent[phase];const named=Object.keys(state.exceptions).length;return {bulk,named,total:bulk+named};}
export function currentBulkFromLineage(state:RealmPopulationState):PopulationHistogram{const out=zeroPopulationHistogram();for(const initial of CITIZEN_PHASES)out[state.lineage[initial]]+=state.bulkInitial[initial];return out;}
