import type {WorldState} from './state';
import {worldBits,worldInt} from './world-address';
import {zeroPopulationHistogram,type CitizenPhase,type PopulationHistogram} from './population-morphism';
import {REALM_POPULATION_SHARDS,ensureRealmPopulation,type RealmPopulationState} from './realm-population';
import {GATEWATCH_SHARD,HOUSEHOLDS_PER_SHARD,REALM_HOUSEHOLDS,SOCIAL_FACTIONS,describeHousehold,householdName,householdRelationOrdinal,wardPopulationHistogram,wardSocialSignature,type SocialFaction} from './realm-society';
import {SOCIAL_CHANNELS,SocialSeparatorTree,applySocialCertificate,wardBoundaryCertificate,zeroSocialSignal,type SocialBoundaryCertificate,type SocialDelta,type SocialSignal} from './social-separator';

export const HISTORY_EVENT_CHANCE=28;
export const RUMOR_TTL_DAYS=12;
export const SOCIAL_YEAR_DAYS=120;
export const HISTORY_RECENT_CANON=16;
export const HISTORY_EVENT_KINDS=['rumor','marriage','birth','migration','succession','grudge'] as const;
export type HistoryEventKind=typeof HISTORY_EVENT_KINDS[number];

export interface HistoricalAtom{id:string;day:number;kind:HistoryEventKind;ward:number;subjects:string[];parents:string[];summary:string}
export interface BornPerson{id:string;bornDay:number;adultAtDay:number;householdOrdinal:number;parentHouseholds:[number,number]}
export interface HouseholdHistoryPatch{householdOrdinal:number;migratedShard?:number;marriageTo?:number;children:string[];grudges:number[]}
export interface FactionLeadership{faction:SocialFaction;householdOrdinal:number;sinceDay:number;atomId:string}
export interface ActiveRumor{id:string;sourceAtomId:string;sourceHousehold:number;sourceWard:number;channel:typeof SOCIAL_CHANNELS[number];signal:SocialSignal;createdDay:number;expiresDay:number}
export interface RealmHistoryState{version:1;lastProcessedDay:number;sequence:number;atoms:Record<string,HistoricalAtom>;households:Record<string,HouseholdHistoryPatch>;bornPeople:Record<string,BornPerson>;leaders:Partial<Record<SocialFaction,FactionLeadership>>;activeRumors:ActiveRumor[];recentCanon:string[]}
export interface ProvenanceCarrier<P=string>{provenance:P;signal:SocialSignal}
export interface ProvenanceTransition<P=string>{provenance:P;signal:SocialSignal;delta:SocialDelta;segmentCount:number}
export interface RoutedRumor{rumor:ActiveRumor;atom:HistoricalAtom;sourceHouseholdName:string;targetWard:number;transition:ProvenanceTransition<string>;rangeNodes:number}

declare module './state'{interface WorldState{realmHistory?:RealmHistoryState}}

export function ensureRealmHistory(world:WorldState):RealmHistoryState{world.realmHistory??={version:1,lastProcessedDay:0,sequence:0,atoms:{},households:{},bornPeople:{},leaders:{},activeRumors:[],recentCanon:[]};return world.realmHistory;}
function patchFor(state:RealmHistoryState,householdOrdinal:number):HouseholdHistoryPatch{const key=String(householdOrdinal);return state.households[key]??={householdOrdinal,children:[],grudges:[]};}
function unlinkMarriage(state:RealmHistoryState,householdOrdinal:number){const patch=patchFor(state,householdOrdinal),prior=patch.marriageTo;if(prior===undefined)return;delete patch.marriageTo;const other=state.households[String(prior)];if(other?.marriageTo===householdOrdinal)delete other.marriageTo;}
function setMarriage(state:RealmHistoryState,first:number,second:number){if(first===second)throw new Error('household cannot marry itself');unlinkMarriage(state,first);unlinkMarriage(state,second);patchFor(state,first).marriageTo=second;patchFor(state,second).marriageTo=first;}
export function effectiveHouseholdShard(state:RealmHistoryState,householdOrdinal:number):number{const base=Math.floor(householdOrdinal/HOUSEHOLDS_PER_SHARD);return state.households[String(householdOrdinal)]?.migratedShard??base;}
export function historicalRank(state:RealmHistoryState):number{return Object.keys(state.households).length+Object.keys(state.bornPeople).length+Object.keys(state.leaders).length+state.activeRumors.length;}
export function historyAccounting(state:RealmHistoryState){return {atoms:Object.keys(state.atoms).length,patchedHouseholds:Object.keys(state.households).length,bornPeople:Object.keys(state.bornPeople).length,leaders:Object.keys(state.leaders).length,activeRumors:state.activeRumors.length,rank:historicalRank(state)};}

function atomId(seed:number,day:number,sequence:number):string{const bits=worldBits({realmSeed:seed,areaId:'realm-history',cellX:Math.floor(day/256),cellZ:sequence,slot:day&255,tag:'atom'});return `hist:${day.toString(36)}:${sequence.toString(36)}:${bits.toString(36)}`;}
function recordAtom(state:RealmHistoryState,seed:number,day:number,kind:HistoryEventKind,ward:number,subjects:string[],parents:string[],summary:string):HistoricalAtom{const id=atomId(seed,day,state.sequence++),atom={id,day,kind,ward,subjects,parents,summary};state.atoms[id]=atom;state.recentCanon.push(summary);state.recentCanon=state.recentCanon.slice(-HISTORY_RECENT_CANON);return atom;}
function chooseHousehold(seed:number,day:number,tag:string):number{return worldInt({realmSeed:seed,areaId:'realm-history-choice',cellX:Math.floor(day/256),cellZ:0,slot:day&255,tag},REALM_HOUSEHOLDS);}
function chooseGatewatchReachableHousehold(seed:number,day:number,tag:string):number{const shard=worldInt({realmSeed:seed,areaId:'realm-history-choice',cellX:Math.floor(day/256),cellZ:1,slot:day&255,tag:tag+'-ward'},GATEWATCH_SHARD+1),local=worldInt({realmSeed:seed,areaId:'realm-history-choice',cellX:shard,cellZ:2,slot:day&255,tag:tag+'-house'},HOUSEHOLDS_PER_SHARD);return shard*HOUSEHOLDS_PER_SHARD+local;}
function addUnique(list:number[],value:number){if(!list.includes(value))list.push(value);}

const eventChannel:Record<HistoryEventKind,typeof SOCIAL_CHANNELS[number]>={rumor:'kin',marriage:'kin',birth:'kin',migration:'market',succession:'guild',grudge:'watch'};
function rumorSignal(channel:typeof SOCIAL_CHANNELS[number]):SocialSignal{const signal=zeroSocialSignal();signal[channel]=3;return signal;}
function spawnRumor(state:RealmHistoryState,atom:HistoricalAtom,sourceHousehold:number){const channel=eventChannel[atom.kind],sourceWard=effectiveHouseholdShard(state,sourceHousehold);state.activeRumors.push({id:`rumor:${atom.id}`,sourceAtomId:atom.id,sourceHousehold,sourceWard,channel,signal:rumorSignal(channel),createdDay:atom.day,expiresDay:atom.day+RUMOR_TTL_DAYS});}

function selectFactionLeader(population:RealmPopulationState,seed:number,day:number,faction:SocialFaction):number{const start=chooseHousehold(seed,day,'leader-'+faction);for(let i=0;i<64;i++){const candidate=(start+i*4099)%REALM_HOUSEHOLDS;if(describeHousehold(population,seed,candidate).faction===faction)return candidate;}return start;}
function processHistoryEvent(world:WorldState,day:number):HistoricalAtom|undefined{
 const state=ensureRealmHistory(world),population=ensureRealmPopulation(world),seed=world.worldSeed??197709,roll=worldInt({realmSeed:seed,areaId:'realm-history-schedule',cellX:Math.floor(day/256),cellZ:0,slot:day&255,tag:'event-roll'},100);if(roll>=HISTORY_EVENT_CHANCE)return undefined;
 const kind=HISTORY_EVENT_KINDS[worldInt({realmSeed:seed,areaId:'realm-history-schedule',cellX:Math.floor(day/256),cellZ:1,slot:day&255,tag:'event-kind'},HISTORY_EVENT_KINDS.length)];
 let atom:HistoricalAtom,sourceHousehold=chooseGatewatchReachableHousehold(seed,day,'source');
 if(kind==='rumor'){
  const ward=effectiveHouseholdShard(state,sourceHousehold),name=householdName(seed,sourceHousehold);atom=recordAtom(state,seed,day,kind,ward,[`house:${sourceHousehold}`],[],`Day ${day} · ${name} put a story into the road network; the clerk marked its source instead of treating it as anonymous noise.`);
 }else if(kind==='marriage'){
  const first=chooseHousehold(seed,day,'marriage-a'),second=householdRelationOrdinal(first,'oath');setMarriage(state,first,second);sourceHousehold=first;const ward=effectiveHouseholdShard(state,first);atom=recordAtom(state,seed,day,kind,ward,[`house:${first}`,`house:${second}`],[],`Day ${day} · ${householdName(seed,first)} and ${householdName(seed,second)} joined their household lines under witnessed oath.`);
 }else if(kind==='birth'){
  const home=chooseHousehold(seed,day,'birth-home'),homePatch=patchFor(state,home),other=homePatch.marriageTo??householdRelationOrdinal(home,'oath'),ward=effectiveHouseholdShard(state,home);sourceHousehold=home;atom=recordAtom(state,seed,day,kind,ward,[`house:${home}`,`house:${other}`],[],`Day ${day} · A child was entered beneath ${householdName(seed,home)} with ${householdName(seed,other)} named in the lineage.`);const id=`born:${atom.id}`;state.bornPeople[id]={id,bornDay:day,adultAtDay:day+16*SOCIAL_YEAR_DAYS,householdOrdinal:home,parentHouseholds:[home,other]};homePatch.children.push(id);atom.subjects.push(id);
 }else if(kind==='migration'){
  const home=chooseHousehold(seed,day,'migration-home'),from=effectiveHouseholdShard(state,home);let to=worldInt({realmSeed:seed,areaId:'realm-history-migration',cellX:Math.floor(day/256),cellZ:from,slot:day&255,tag:'destination'},REALM_POPULATION_SHARDS);if(to===from)to=(to+1)%REALM_POPULATION_SHARDS;patchFor(state,home).migratedShard=to;sourceHousehold=home;atom=recordAtom(state,seed,day,kind,to,[`house:${home}`],[],`Day ${day} · ${householdName(seed,home)} left ward ${from} and was entered into ward ${to}; the household identity remained unchanged.`);
 }else if(kind==='succession'){
  const faction=SOCIAL_FACTIONS[worldInt({realmSeed:seed,areaId:'realm-history-succession',cellX:Math.floor(day/256),cellZ:0,slot:day&255,tag:'faction'},SOCIAL_FACTIONS.length)],prior=state.leaders[faction],leader=selectFactionLeader(population,seed,day,faction),ward=effectiveHouseholdShard(state,leader);sourceHousehold=leader;const parents=prior?[prior.atomId]:[];atom=recordAtom(state,seed,day,kind,ward,[`house:${leader}`],parents,`Day ${day} · ${householdName(seed,leader)} took the ${faction} seal${prior?' after the prior succession':''}.`);state.leaders[faction]={faction,householdOrdinal:leader,sinceDay:day,atomId:atom.id};
 }else{
  const first=chooseHousehold(seed,day,'grudge-a'),second=householdRelationOrdinal(first,'rival');addUnique(patchFor(state,first).grudges,second);addUnique(patchFor(state,second).grudges,first);sourceHousehold=first;const ward=effectiveHouseholdShard(state,first);atom=recordAtom(state,seed,day,kind,ward,[`house:${first}`,`house:${second}`],[],`Day ${day} · ${householdName(seed,first)} entered a witnessed grudge against ${householdName(seed,second)}; it is now an explicit exception to the base rivalry graph.`);
 }
 spawnRumor(state,atom,sourceHousehold);return atom;
}

export function advanceRealmHistoryToDay(world:WorldState,targetDay:number):RealmHistoryState{if(!Number.isInteger(targetDay)||targetDay<0)throw new Error('history time must be a non-negative day');const state=ensureRealmHistory(world);if(targetDay<state.lastProcessedDay)throw new Error('history time cannot move backwards');for(let day=state.lastProcessedDay+1;day<=targetDay;day++){state.activeRumors=state.activeRumors.filter(r=>r.expiresDay>day);processHistoryEvent(world,day);if(state.activeRumors.length>RUMOR_TTL_DAYS)throw new Error('causal rumor frontier exceeded proved TTL bound');state.lastProcessedDay=day;}return state;}
export function advanceRealmHistoryToTick(world:WorldState):RealmHistoryState{return advanceRealmHistoryToDay(world,Math.floor(world.tick/3600));}

/** Unique provenance is a product label: the compressed social map transforms only the finite signal. */
export function liftProvenance<P>(certificate:SocialBoundaryCertificate,carrier:ProvenanceCarrier<P>):ProvenanceTransition<P>{const step=applySocialCertificate(certificate,carrier.signal);return {provenance:carrier.provenance,signal:step.signal,delta:step.delta,segmentCount:certificate.segmentCount};}

function applyMigrationToHistograms(out:PopulationHistogram[],population:RealmPopulationState,history:RealmHistoryState,seed:number,patch:HouseholdHistoryPatch){if(patch.migratedShard===undefined)return;const origin=Math.floor(patch.householdOrdinal/HOUSEHOLDS_PER_SHARD),target=patch.migratedShard;if(origin===target)return;const household=describeHousehold(population,seed,patch.householdOrdinal);for(const member of household.members){if(out[origin][member.phase]<=0)throw new Error('historical migration underflow');out[origin][member.phase]--;out[target][member.phase]++;}}
export function historicalWardPopulationHistograms(world:WorldState):PopulationHistogram[]{const population=ensureRealmPopulation(world),history=ensureRealmHistory(world),seed=world.worldSeed??197709,out=Array.from({length:REALM_POPULATION_SHARDS},(_,shard)=>({...wardPopulationHistogram(population,seed,shard)}));for(const patch of Object.values(history.households))applyMigrationToHistograms(out,population,history,seed,patch);for(const person of Object.values(history.bornPeople)){if(person.adultAtDay>history.lastProcessedDay)continue;out[effectiveHouseholdShard(history,person.householdOrdinal)].laborer++;}return out;}
export function historicalWardPopulationHistogram(world:WorldState,shard:number):PopulationHistogram{
 if(!Number.isInteger(shard)||shard<0||shard>=REALM_POPULATION_SHARDS)throw new Error('historical ward outside realm');const population=ensureRealmPopulation(world),history=ensureRealmHistory(world),seed=world.worldSeed??197709,out={...wardPopulationHistogram(population,seed,shard)};
 for(const patch of Object.values(history.households)){if(patch.migratedShard===undefined)continue;const origin=Math.floor(patch.householdOrdinal/HOUSEHOLDS_PER_SHARD),target=patch.migratedShard;if(origin!==shard&&target!==shard)continue;const household=describeHousehold(population,seed,patch.householdOrdinal);for(const member of household.members){if(shard===origin){if(out[member.phase]<=0)throw new Error('historical migration underflow');out[member.phase]--;}if(shard===target)out[member.phase]++;}}
 for(const person of Object.values(history.bornPeople)){if(person.adultAtDay<=history.lastProcessedDay&&effectiveHouseholdShard(history,person.householdOrdinal)===shard)out.laborer++;}return out;
}
export function historicalWardCertificate(world:WorldState,shard:number):SocialBoundaryCertificate{return wardBoundaryCertificate(wardSocialSignature(historicalWardPopulationHistogram(world,shard)));}
export function historicalWardCertificates(world:WorldState):SocialBoundaryCertificate[]{return historicalWardPopulationHistograms(world).map(histogram=>wardBoundaryCertificate(wardSocialSignature(histogram)));}

export class BidirectionalSocialRouter{
 readonly forward:SocialSeparatorTree;readonly reverse:SocialSeparatorTree;readonly wardCount:number;lastRangeNodes=0;
 constructor(certificates:readonly SocialBoundaryCertificate[]){this.wardCount=certificates.length;this.forward=new SocialSeparatorTree(certificates);this.reverse=new SocialSeparatorTree([...certificates].reverse());}
 route(sourceWard:number,targetWard:number):SocialBoundaryCertificate{if(!Number.isInteger(sourceWard)||!Number.isInteger(targetWard)||sourceWard<0||targetWard<0||sourceWard>=this.wardCount||targetWard>=this.wardCount)throw new Error('rumor route ward outside realm');if(sourceWard<=targetWard){const out=this.forward.range(sourceWard,targetWard+1);this.lastRangeNodes=this.forward.rangeNodes;return out;}const rs=this.wardCount-1-sourceWard,rt=this.wardCount-1-targetWard,out=this.reverse.range(rs,rt+1);this.lastRangeNodes=this.reverse.rangeNodes;return out;}
}
export function buildHistoricalSocialRouter(world:WorldState):BidirectionalSocialRouter{return new BidirectionalSocialRouter(historicalWardCertificates(world));}
export function routeRumor(world:WorldState,rumor:ActiveRumor,targetWard=GATEWATCH_SHARD,router=buildHistoricalSocialRouter(world)):RoutedRumor{const history=ensureRealmHistory(world),atom=history.atoms[rumor.sourceAtomId];if(!atom)throw new Error('rumor provenance atom missing');const certificate=router.route(rumor.sourceWard,targetWard),transition=liftProvenance(certificate,{provenance:rumor.sourceAtomId,signal:rumor.signal});return {rumor,atom,sourceHouseholdName:householdName(world.worldSeed??197709,rumor.sourceHousehold),targetWard,transition,rangeNodes:router.lastRangeNodes};}

export function migrationAffectedWards(householdOrdinal:number,fromShard:number,toShard:number):number[]{const wards=new Set<number>([Math.floor(householdOrdinal/HOUSEHOLDS_PER_SHARD),fromShard,toShard]);return [...wards].filter(w=>w>=0&&w<REALM_POPULATION_SHARDS).sort((a,b)=>a-b);}
export function repairHistoricalSocialTree(tree:SocialSeparatorTree,world:WorldState,wards:readonly number[]):number{let work=0;for(const ward of [...new Set(wards)])work+=tree.update(ward,historicalWardCertificate(world,ward));return work;}

export function latestGatewatchHistoryLore(world:WorldState):string{const history=ensureRealmHistory(world),rumor=history.activeRumors.at(-1);if(!rumor)return history.recentCanon.at(-1)??'No promoted historical thread has reached the Gatewatch clerk yet.';const routed=routeRumor(world,rumor,GATEWATCH_SHARD),signal=routed.transition.signal,atom=routed.atom;return `PROVENANCE ${atom.id} · ${routed.sourceHouseholdName} · ${atom.summary} Gatewatch receives K${signal.kin}/M${signal.market}/W${signal.watch}/G${signal.guild} through ${routed.transition.segmentCount} ward certificates.`;}

export function bornAdultPhase(_person:BornPerson):CitizenPhase{return 'laborer';}
export function zeroHistoricalHistogram():PopulationHistogram{return zeroPopulationHistogram();}
export function causalParents(state:RealmHistoryState,atomId:string):string[]{return state.atoms[atomId]?.parents??[];}
export function validateHistoryDag(state:RealmHistoryState):boolean{for(const atom of Object.values(state.atoms)){for(const parent of atom.parents){const p=state.atoms[parent];if(!p||p.day>atom.day)return false;}}return true;}
export function validateStructuralHistory(state:RealmHistoryState):boolean{for(const patch of Object.values(state.households)){if(patch.marriageTo!==undefined&&state.households[String(patch.marriageTo)]?.marriageTo!==patch.householdOrdinal)return false;for(const grudge of patch.grudges){if(!state.households[String(grudge)]?.grudges.includes(patch.householdOrdinal))return false;}for(const child of patch.children){const person=state.bornPeople[child];if(!person||person.householdOrdinal!==patch.householdOrdinal)return false;}}for(const person of Object.values(state.bornPeople)){if(!state.atoms[person.id.slice('born:'.length)])return false;if(person.parentHouseholds[0]<0||person.parentHouseholds[1]<0)return false;}return true;}
