import type {WorldState} from './state';
import {worldInt} from './world-address';
import {CITIZEN_PHASES,applyPopulationBlock,histogramOrbitCount,populationBlockFor,zeroPopulationHistogram,type CitizenPhase,type PopulationDelta,type PopulationHistogram,type PopulationInput} from './population-morphism';
import {REALM_LOGICAL_POPULATION,REALM_POPULATION_DAY_TICKS,REALM_POPULATION_SHARDS,REALM_SHARD_SIZE,describeCitizen,ensureRealmPopulation,initialCitizenPhase,realmPopulationInput,type RealmPopulationState} from './realm-population';
import {SOCIAL_CHANNELS,SocialSeparatorTree,applySocialCertificate,wardBoundaryCertificate,zeroSocialSignal,type SignalLevel,type SocialSignal} from './social-separator';

export const HOUSEHOLD_SIZE=4;
export const HOUSEHOLDS_PER_SHARD=REALM_SHARD_SIZE/HOUSEHOLD_SIZE;
export const REALM_HOUSEHOLDS=REALM_LOGICAL_POPULATION/HOUSEHOLD_SIZE;
export const HOUSEHOLD_TYPE_COUNT=Number(histogramOrbitCount(HOUSEHOLD_SIZE)); // C(11,7)=330
export const HOUSEHOLD_RELATION_DEGREE=3;
export const REALM_HOUSEHOLD_RELATION_EDGES=REALM_HOUSEHOLDS*HOUSEHOLD_RELATION_DEGREE/2;
export const GATEWATCH_SHARD=72;

export const HOUSEHOLD_RELATIONS=['trade','rival','oath'] as const;
export type HouseholdRelation=typeof HOUSEHOLD_RELATIONS[number];
export const SOCIAL_FACTIONS=['Hearthward League','Iron Compact','Lantern Watch','Free Carters','Stonewrights Guild','Bellkeepers'] as const;
export type SocialFaction=typeof SOCIAL_FACTIONS[number];

const DISTRICTS=['Alderbrook Hundred','Southwood','Briar Heath','Marchwater','Gatewatch','Ironvein','High Basin','Grey Pass','Crownroad West','Crownroad East','Western Briars','Redmere','Salt Coast','Low Harbors','Northreach','Frostmere'] as const;
const NAME_ROOTS=['Ash','Alder','Briar','Black','Bright','Crow','Dun','Elm','Fallow','Flint','Grey','Hart','Hazel','Iron','Lark','Mere','Oak','Pine','Reed','Rook','Rowan','Stone','Thorn','Vale','West','Willow','Wren','Yew','Fox','Haw','Kestrel','Moss'] as const;
const NAME_ENDS=['brook','croft','field','ford','gate','hall','mere','moor','ridge','stead','ward','well','wick','wood','wright','burn','fell','holt','stone','thorn','bridge','marsh','vale','den','barrow','heath','combe','shaw','hurst','dale','fen','lock'] as const;
const RELATION_MASK:Record<HouseholdRelation,number>={trade:1,rival:2,oath:512};

export interface HouseholdDescriptor{
 ordinal:number;shard:number;localOrdinal:number;name:string;ward:string;district:string;faction:SocialFaction;
 members:ReturnType<typeof describeCitizen>[];relations:Record<HouseholdRelation,number>;
}
export interface RealmSocialState{version:1;lastProcessedDay:number;recent:string[]}
export interface GatewatchSocietySnapshot{household:HouseholdDescriptor;signature:SocialSignal;boundary:SocialSignal;recent:string;lore:string}

declare module './state'{interface WorldState{realmSocial?:RealmSocialState}}

export function householdHistogram(phases:readonly CitizenPhase[]):PopulationHistogram{
 if(phases.length!==HOUSEHOLD_SIZE)throw new Error('household quotient expects exactly four members');const out=zeroPopulationHistogram();for(const phase of phases)out[phase]++;return out;
}
export function householdTypeKey(histogram:PopulationHistogram):string{return CITIZEN_PHASES.map(phase=>histogram[phase]).join(',');}
export function householdStep(histogram:PopulationHistogram,input:PopulationInput):{histogram:PopulationHistogram;delta:PopulationDelta}{const step=applyPopulationBlock(histogram,populationBlockFor(input));return {histogram:step.histogram,delta:step.delta};}

export function householdName(seed:number,householdOrdinal:number):string{
 if(!Number.isSafeInteger(householdOrdinal)||householdOrdinal<0||householdOrdinal>=REALM_HOUSEHOLDS)throw new Error('household ordinal outside realm');
 const shard=Math.floor(householdOrdinal/HOUSEHOLDS_PER_SHARD),local=householdOrdinal%HOUSEHOLDS_PER_SHARD;
 const a=NAME_ROOTS[worldInt({realmSeed:seed,areaId:'realm-households',cellX:shard,cellZ:0,slot:local,tag:'name-root'},NAME_ROOTS.length)];
 const b=NAME_ENDS[worldInt({realmSeed:seed,areaId:'realm-households',cellX:shard,cellZ:0,slot:local,tag:'name-end'},NAME_ENDS.length)];
 return `House ${a}${b}`;
}
export function wardName(shard:number):string{
 if(!Number.isInteger(shard)||shard<0||shard>=REALM_POPULATION_SHARDS)throw new Error('ward shard outside realm');
 if(shard===GATEWATCH_SHARD)return 'Gatewatch Ward';const district=DISTRICTS[Math.floor(shard/16)],local=shard%16+1;return `${district} Ward ${local}`;
}
export const districtName=(shard:number)=>DISTRICTS[Math.floor(shard/16)];

function staticHouseholdPhases(seed:number,householdOrdinal:number):CitizenPhase[]{const first=householdOrdinal*HOUSEHOLD_SIZE;return Array.from({length:HOUSEHOLD_SIZE},(_,i)=>initialCitizenPhase(seed,first+i));}
function factionForPhases(seed:number,householdOrdinal:number,phases:readonly CitizenPhase[]):SocialFaction{
 const score:Record<SocialFaction,number>={'Hearthward League':0,'Iron Compact':0,'Lantern Watch':0,'Free Carters':0,'Stonewrights Guild':0,'Bellkeepers':0};
 for(const phase of phases){if(phase==='farmer'||phase==='laborer')score['Hearthward League']++;if(phase==='miner')score['Iron Compact']+=2;if(phase==='guard')score['Lantern Watch']+=2;if(phase==='trader')score['Free Carters']+=2;if(phase==='artisan')score['Stonewrights Guild']+=2;if(phase==='injured'||phase==='displaced')score['Bellkeepers']+=2;}
 const best=Math.max(...SOCIAL_FACTIONS.map(f=>score[f])),ties=SOCIAL_FACTIONS.filter(f=>score[f]===best);return ties[worldInt({realmSeed:seed,areaId:'realm-households',cellX:Math.floor(householdOrdinal/HOUSEHOLDS_PER_SHARD),cellZ:0,slot:householdOrdinal%HOUSEHOLDS_PER_SHARD,tag:'faction-tie'},ties.length)];
}
export function householdRelationOrdinal(householdOrdinal:number,relation:HouseholdRelation):number{
 if(!Number.isInteger(householdOrdinal)||householdOrdinal<0||householdOrdinal>=REALM_HOUSEHOLDS)throw new Error('household ordinal outside realm');const shard=Math.floor(householdOrdinal/HOUSEHOLDS_PER_SHARD),local=householdOrdinal%HOUSEHOLDS_PER_SHARD;return shard*HOUSEHOLDS_PER_SHARD+(local^RELATION_MASK[relation]);
}
export function describeHousehold(state:RealmPopulationState,seed:number,householdOrdinal:number):HouseholdDescriptor{
 const first=householdOrdinal*HOUSEHOLD_SIZE;if(first<0||first+HOUSEHOLD_SIZE>state.population)throw new Error('household outside population');const shard=Math.floor(first/state.shardSize),members=Array.from({length:HOUSEHOLD_SIZE},(_,i)=>describeCitizen(state,seed,first+i));
 return {ordinal:householdOrdinal,shard,localOrdinal:householdOrdinal%HOUSEHOLDS_PER_SHARD,name:householdName(seed,householdOrdinal),ward:wardName(shard),district:districtName(shard),faction:factionForPhases(seed,householdOrdinal,staticHouseholdPhases(seed,householdOrdinal)),members,relations:Object.fromEntries(HOUSEHOLD_RELATIONS.map(relation=>[relation,householdRelationOrdinal(householdOrdinal,relation)])) as Record<HouseholdRelation,number>};
}

/** Exact current histogram for one 4,096-person ward without enumerating its residents. */
export function wardPopulationHistogram(state:RealmPopulationState,seed:number,shard:number):PopulationHistogram{
 if(!Number.isInteger(shard)||shard<0||shard>=Math.ceil(state.population/state.shardSize))throw new Error('population ward outside realm');const first=shard*state.shardSize,last=Math.min(state.population,first+state.shardSize),width=last-first,initial=zeroPopulationHistogram(),q=Math.floor(width/CITIZEN_PHASES.length),r=width%CITIZEN_PHASES.length;
 for(const phase of CITIZEN_PHASES)initial[phase]=q;for(let i=0;i<r;i++)initial[initialCitizenPhase(seed,first+i)]++;
 const out=zeroPopulationHistogram();for(const phase of CITIZEN_PHASES)out[state.lineage[phase]]+=initial[phase];
 for(const citizen of Object.values(state.exceptions)){if(citizen.shard!==shard)continue;const anonymousPhase=state.lineage[citizen.initialPhase];if(out[anonymousPhase]<=0)throw new Error('ward population underflow while restoring named household member');out[anonymousPhase]--;out[citizen.phase]++;}
 return out;
}
const ratioLevel=(count:number,total:number):SignalLevel=>{const p=total?count/total:0;if(p<.08)return 0;if(p<.18)return 1;if(p<.32)return 2;return 3;};
export function wardSocialSignature(histogram:PopulationHistogram):SocialSignal{
 const total=CITIZEN_PHASES.reduce((n,phase)=>n+histogram[phase],0);return {
  kin:ratioLevel(histogram.farmer+histogram.laborer,total),
  market:ratioLevel(histogram.trader+histogram.artisan,total),
  watch:ratioLevel(histogram.guard,total),
  guild:ratioLevel(histogram.miner+histogram.artisan,total),
 };
}
export function socialCertificateForWard(state:RealmPopulationState,seed:number,shard:number){return wardBoundaryCertificate(wardSocialSignature(wardPopulationHistogram(state,seed,shard)));}
export function buildRealmSocialSeparator(state:RealmPopulationState,seed:number):SocialSeparatorTree{return new SocialSeparatorTree(Array.from({length:REALM_POPULATION_SHARDS},(_,shard)=>socialCertificateForWard(state,seed,shard)));}

export function dailySocialBoundary(seed:number,day:number):SocialSignal{
 const out=zeroSocialSignal();for(let i=0;i<SOCIAL_CHANNELS.length;i++){const channel=SOCIAL_CHANNELS[i];out[channel]=worldInt({realmSeed:seed,areaId:'realm-social-boundary',cellX:Math.floor(day/256),cellZ:i,slot:day&255,tag:channel},4) as SignalLevel;}return out;
}
function chronicleHouseholdOrdinal(seed:number,day:number,shard=GATEWATCH_SHARD):number{return shard*HOUSEHOLDS_PER_SHARD+worldInt({realmSeed:seed,areaId:'realm-chronicle',cellX:shard,cellZ:Math.floor(day/256),slot:day&255,tag:'household'},HOUSEHOLDS_PER_SHARD);}
function staticHouseholdFaction(seed:number,householdOrdinal:number){return factionForPhases(seed,householdOrdinal,staticHouseholdPhases(seed,householdOrdinal));}
export function chronicleForDay(seed:number,day:number,shard=GATEWATCH_SHARD):string{
 const householdOrdinal=chronicleHouseholdOrdinal(seed,day,shard),name=householdName(seed,householdOrdinal),trade=householdName(seed,householdRelationOrdinal(householdOrdinal,'trade')),rival=householdName(seed,householdRelationOrdinal(householdOrdinal,'rival')),oath=householdName(seed,householdRelationOrdinal(householdOrdinal,'oath')),faction=staticHouseholdFaction(seed,householdOrdinal),event=realmPopulationInput(seed,day),ward=wardName(shard);
 if(event==='harvest')return `Day ${day} · ${name} of the ${faction} exchanged harvest tallies with ${trade} in ${ward}.`;
 if(event==='mine_push')return `Day ${day} · ${name} sent guild hands toward Deep Iron; the work contract passed to ${trade}.`;
 if(event==='festival')return `Day ${day} · ${name} and ${trade} raised adjoining market awnings while old rivals ${rival} kept the peace.`;
 if(event==='levy')return `Day ${day} · ${name} answered the marcher levy; its oath-house ${oath} carried the watch list onward.`;
 if(event==='raid')return `Day ${day} · A warning ran from ${name} to ${oath}; even ${rival} barred the same lane before nightfall.`;
 if(event==='recovery')return `Day ${day} · ${name} reopened its shutters and settled an old account with ${trade} after the hard days.`;
 return `Day ${day} · Kin-news from ${name} crossed ${ward}; ${trade} answered before dusk.`;
}

export function ensureRealmSocial(world:WorldState):RealmSocialState{world.realmSocial??={version:1,lastProcessedDay:0,recent:[]};return world.realmSocial;}
export function advanceRealmSocietyToDay(world:WorldState,targetDay:number):RealmSocialState{
 if(!Number.isInteger(targetDay)||targetDay<0)throw new Error('social time must be a non-negative day');const social=ensureRealmSocial(world),seed=world.worldSeed??197709;if(targetDay<social.lastProcessedDay)throw new Error('social time cannot move backwards');if(targetDay===social.lastProcessedDay)return social;
 const gap=targetDay-social.lastProcessedDay;if(gap>12){social.recent=[];for(let day=Math.max(1,targetDay-11);day<=targetDay;day++)social.recent.push(chronicleForDay(seed,day));}else{for(let day=social.lastProcessedDay+1;day<=targetDay;day++)social.recent.push(chronicleForDay(seed,day));social.recent=social.recent.slice(-12);}social.lastProcessedDay=targetDay;return social;
}
export function advanceRealmSocietyToTick(world:WorldState):RealmSocialState{return advanceRealmSocietyToDay(world,Math.floor(world.tick/REALM_POPULATION_DAY_TICKS));}

export function householdLore(household:HouseholdDescriptor,seed:number):string{
 const counts=zeroPopulationHistogram();for(const member of household.members)counts[member.phase]++;const dominant=CITIZEN_PHASES.reduce((best,phase)=>counts[phase]>counts[best]?phase:best,CITIZEN_PHASES[0]);const trade=householdName(seed,household.relations.trade),rival=householdName(seed,household.relations.rival);
 return `${household.name} · ${household.faction} · ${counts[dominant]} of four currently read as ${dominant}. Trade tie: ${trade}. Old rivalry: ${rival}.`;
}
export function gatewatchSocietySnapshot(world:WorldState):GatewatchSocietySnapshot{
 const state=ensureRealmPopulation(world),social=ensureRealmSocial(world),seed=world.worldSeed??197709,day=Math.floor(world.tick/REALM_POPULATION_DAY_TICKS),householdOrdinal=chronicleHouseholdOrdinal(seed,Math.max(1,day),GATEWATCH_SHARD),household=describeHousehold(state,seed,householdOrdinal),signature=wardSocialSignature(wardPopulationHistogram(state,seed,GATEWATCH_SHARD)),step=applySocialCertificate(wardBoundaryCertificate(signature),dailySocialBoundary(seed,Math.max(1,day)));
 return {household,signature,boundary:step.signal,recent:social.recent.at(-1)??'Gatewatch has not yet written today’s chronicle.',lore:householdLore(household,seed)};
}
