import type {PlayerState,WorldState} from './state';
import {advanceRealmHistoryToTick,BidirectionalSocialRouter,ensureRealmHistory,historicalWardCertificates,liftProvenance,type CanonSource,type HistoricalAtom} from './provenance-frontier';
import {districtName} from './realm-society';
import {REALM_POPULATION_SHARDS} from './realm-population';
import {SOCIAL_CHANNELS,zeroSocialSignal,type SocialChannel} from './social-separator';

export const REALM_DISTRICT_SIZE=16;
export const REALM_DISTRICT_COUNT=REALM_POPULATION_SHARDS/REALM_DISTRICT_SIZE;
export const CONSEQUENCE_RECENT_CAP=32;
export const DISTRICT_TRUST_CAP=8;
export const FACTION_ECHO_CAP=6;
export const WARD_PRESSURE_CAP=12;

export interface CausalStandingState{
 faction:Record<string,number>;
 district:Record<string,number>;
 rememberedDeeds:number;
 lastAtomId?:string;
}
export interface ActorEcho{
 actorId:string;
 actorName:string;
 source:CanonSource;
 deeds:number;
 helpful:number;
 hostile:number;
 channel:Record<SocialChannel,number>;
 districtTrust:Record<string,number>;
 factionEcho:Record<string,number>;
 lastAtomId:string;
}
export interface HouseholdActorMemory{trust:number;mentions:number;lastAtomId:string}
export interface HouseholdMemory{householdOrdinal:number;actors:Record<string,HouseholdActorMemory>;lastAtomId:string}
export interface WardPressure{kin:number;market:number;watch:number;guild:number;lastDay:number;lastAtomId:string}
export interface RealmConsequenceState{
 version:1;
 lastAppliedSequence:number;
 appliedCount:number;
 wardPressure:Record<string,WardPressure>;
 actorEcho:Record<string,ActorEcho>;
 householdMemory:Record<string,HouseholdMemory>;
 recent:string[];
}

interface ConsequenceProfile{magnitude:number;tone:-1|0|1;label:string}

declare module './state'{
 interface PlayerState{causalStanding?:CausalStandingState}
 interface WorldState{realmConsequences?:RealmConsequenceState}
}

const blankChannels=()=>({kin:0,market:0,watch:0,guild:0} as Record<SocialChannel,number>);
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const round=(n:number)=>Math.round(n*100)/100;
export function atomSequence(atom:HistoricalAtom):number{const match=/^hist:[0-9a-z]+:([0-9a-z]+):/.exec(atom.id);if(!match)return -1;const n=parseInt(match[1],36);return Number.isSafeInteger(n)?n:-1;}
function atomProfile(atom:HistoricalAtom):ConsequenceProfile{
 if(atom.kind==='marriage')return {magnitude:2,tone:1,label:'household oath'};
 if(atom.kind==='birth')return {magnitude:1,tone:1,label:'lineage birth'};
 if(atom.kind==='migration')return {magnitude:3,tone:0,label:'household migration'};
 if(atom.kind==='succession')return {magnitude:4,tone:0,label:'faction succession'};
 if(atom.kind==='grudge')return {magnitude:3,tone:-1,label:'witnessed grudge'};
 if(atom.kind==='rumor')return {magnitude:1,tone:0,label:'road rumor'};
 const s=atom.summary.toLowerCase();
 if(/broke the deal|betray|hate you|crime|threat|insult/.test(s))return {magnitude:2,tone:-1,label:'hostile public deed'};
 if(/claimed .*contract|killed .*outlaw|killed .*captain|killed .*raider|watch report/.test(s))return {magnitude:4,tone:1,label:'watch victory'};
 if(/expedition/.test(s))return {magnitude:4,tone:1,label:'expedition report'};
 if(/raised |built |construction/.test(s))return {magnitude:2.5,tone:1,label:'construction'};
 if(/completed .* at the work|craft|forg|work station/.test(s))return {magnitude:1.5,tone:1,label:'guild craft'};
 if(/black truffle|wild honey|rare/.test(s))return {magnitude:2.5,tone:1,label:'rare find'};
 if(/reached |discovery|discovered/.test(s))return {magnitude:2,tone:1,label:'discovery'};
 if(/opened |recovered supplies|market/.test(s))return {magnitude:2,tone:1,label:'commerce'};
 if(/saved |rescued |helped |defended /.test(s))return {magnitude:4,tone:1,label:'public aid'};
 return {magnitude:1,tone:0,label:'public statement'};
}
function sourceDistrict(ward:number){return Math.max(0,Math.min(REALM_DISTRICT_COUNT-1,Math.floor(ward/REALM_DISTRICT_SIZE)));}
function districtRepresentative(district:number){return district*REALM_DISTRICT_SIZE+Math.floor(REALM_DISTRICT_SIZE/2);}
function factionForChannel(channel:SocialChannel){if(channel==='market')return 'Free Traders';if(channel==='watch')return 'March Wardens';return 'Alderbrook';}
function blankState():RealmConsequenceState{return {version:1,lastAppliedSequence:-1,appliedCount:0,wardPressure:{},actorEcho:{},householdMemory:{},recent:[]};}
export function ensureRealmConsequences(world:WorldState):RealmConsequenceState{const s=world.realmConsequences??blankState();s.wardPressure??={};s.actorEcho??={};s.householdMemory??={};s.recent??=[];if(!Number.isFinite(s.lastAppliedSequence))s.lastAppliedSequence=-1;if(!Number.isFinite(s.appliedCount))s.appliedCount=0;world.realmConsequences=s;return s;}
function decayPressure(p:WardPressure,day:number){const gap=Math.max(0,day-p.lastDay);if(!gap)return;const factor=Math.pow(.82,gap);for(const channel of SOCIAL_CHANNELS)p[channel]=round(p[channel]*factor);p.lastDay=day;}
function pressureFor(state:RealmConsequenceState,atom:HistoricalAtom){const key=String(atom.ward),prior=state.wardPressure[key]??{...blankChannels(),lastDay:atom.day,lastAtomId:atom.id};decayPressure(prior,atom.day);const profile=atomProfile(atom);prior[atom.channel]=round(clamp(prior[atom.channel]+profile.magnitude,0,WARD_PRESSURE_CAP));prior.lastAtomId=atom.id;state.wardPressure[key]=prior;}
function echoFor(state:RealmConsequenceState,atom:HistoricalAtom){if(!atom.actorId||atom.source==='world')return undefined;const prior=state.actorEcho[atom.actorId]??{actorId:atom.actorId,actorName:atom.actorName??atom.actorId,source:atom.source,deeds:0,helpful:0,hostile:0,channel:blankChannels(),districtTrust:{},factionEcho:{},lastAtomId:atom.id};prior.actorName=atom.actorName??prior.actorName;prior.deeds++;const profile=atomProfile(atom);if(profile.tone>0)prior.helpful++;if(profile.tone<0)prior.hostile++;prior.channel[atom.channel]=round(prior.channel[atom.channel]+profile.magnitude);prior.lastAtomId=atom.id;state.actorEcho[atom.actorId]=prior;return prior;}
function householdMemories(state:RealmConsequenceState,atom:HistoricalAtom){if(!atom.actorId||atom.source==='world')return;const profile=atomProfile(atom);for(const subject of atom.subjects){const match=/^house:(\d+)$/.exec(subject);if(!match)continue;const ordinal=Number(match[1]);if(!Number.isSafeInteger(ordinal))continue;const key=String(ordinal),memory=state.householdMemory[key]??{householdOrdinal:ordinal,actors:{},lastAtomId:atom.id},actor=memory.actors[atom.actorId]??{trust:0,mentions:0,lastAtomId:atom.id};actor.trust=round(clamp(actor.trust+profile.tone*profile.magnitude*.35,-8,8));actor.mentions++;actor.lastAtomId=atom.id;memory.actors[atom.actorId]=actor;memory.lastAtomId=atom.id;state.householdMemory[key]=memory;}}
function routeActorEcho(world:WorldState,router:BidirectionalSocialRouter,atom:HistoricalAtom,echo:ActorEcho){const profile=atomProfile(atom),signal=zeroSocialSignal();signal[atom.channel]=3;const source=sourceDistrict(atom.ward);for(let district=0;district<REALM_DISTRICT_COUNT;district++){let delta:number;if(district===source)delta=profile.tone*profile.magnitude*.28;else{const transition=liftProvenance(router.route(atom.ward,districtRepresentative(district)),{provenance:atom.id,signal});if(transition.provenance!==atom.id)throw new Error('causal provenance changed during consequence routing');const strength=Math.max(...SOCIAL_CHANNELS.map(c=>transition.signal[c]))/3;delta=profile.tone*profile.magnitude*strength*.18;}if(!delta)continue;const key=String(district);echo.districtTrust[key]=round(clamp((echo.districtTrust[key]??0)+delta,-DISTRICT_TRUST_CAP,DISTRICT_TRUST_CAP));}
 if(source!==0){const heard=echo.districtTrust['0']??0;if(heard){const faction=factionForChannel(atom.channel),step=profile.tone*Math.min(profile.magnitude*.12,Math.abs(heard)*.08);echo.factionEcho[faction]=round(clamp((echo.factionEcho[faction]??0)+step,-FACTION_ECHO_CAP,FACTION_ECHO_CAP));}}
 const player=world.players[echo.actorId];if(player){player.causalStanding??={faction:{},district:{},rememberedDeeds:0};player.causalStanding.faction={...echo.factionEcho};player.causalStanding.district={...echo.districtTrust};player.causalStanding.rememberedDeeds=echo.deeds;player.causalStanding.lastAtomId=atom.id;}}
export function applyRealmConsequences(world:WorldState):RealmConsequenceState{
 advanceRealmHistoryToTick(world);const history=ensureRealmHistory(world),state=ensureRealmConsequences(world),atoms=Object.values(history.atoms).map(atom=>({atom,sequence:atomSequence(atom)})).filter(x=>x.sequence>state.lastAppliedSequence).sort((a,b)=>a.sequence-b.sequence);if(!atoms.length)return state;let router:BidirectionalSocialRouter|undefined;for(const {atom,sequence} of atoms){pressureFor(state,atom);const echo=echoFor(state,atom);householdMemories(state,atom);if(echo){router??=new BidirectionalSocialRouter(historicalWardCertificates(world));routeActorEcho(world,router,atom,echo);}state.appliedCount++;state.lastAppliedSequence=Math.max(state.lastAppliedSequence,sequence);const profile=atomProfile(atom);state.recent.push(`${atom.actorName??'The realm'} · ${profile.label} · ${districtName(atom.ward)} · ${atom.summary}`);state.recent=state.recent.slice(-CONSEQUENCE_RECENT_CAP);}return state;
}
export function wardPressureAt(world:WorldState,ward:number,day=Math.floor(world.tick/3600)){const state=ensureRealmConsequences(world),stored=state.wardPressure[String(ward)];if(!stored)return {...blankChannels()};const copy={...stored};decayPressure(copy,day);return {kin:copy.kin,market:copy.market,watch:copy.watch,guild:copy.guild};}
export function districtTrustForActor(world:WorldState,actorId:string,ward:number){const state=ensureRealmConsequences(world),echo=state.actorEcho[actorId];return echo?.districtTrust[String(sourceDistrict(ward))]??0;}
export function householdTrustForActor(world:WorldState,householdOrdinal:number,actorId:string){return ensureRealmConsequences(world).householdMemory[String(householdOrdinal)]?.actors[actorId]?.trust??0;}
export function consequenceAccounting(world:WorldState){const s=ensureRealmConsequences(world);return {applied:s.appliedCount,actors:Object.keys(s.actorEcho).length,touchedHouseholds:Object.keys(s.householdMemory).length,pressuredWards:Object.keys(s.wardPressure).length,lastSequence:s.lastAppliedSequence};}
