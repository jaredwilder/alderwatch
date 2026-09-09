import type {WorldState} from './state';
import {applyRealmConsequences,REALM_DISTRICT_COUNT,REALM_DISTRICT_SIZE} from './realm-consequences';
import {BidirectionalSocialRouter,historicalWardCertificates,liftProvenance,promoteCanonicalEvent} from './provenance-frontier';
import {zeroSocialSignal} from './social-separator';

export type RealmCrimeKind='assault'|'theft'|'murder';
export type CrimeKnowledgeKind='witnessed'|'rumor';

export interface RealmCrimeIncident{
 id:string;
 externalKey:string;
 kind:RealmCrimeKind;
 perpetratorId:string;
 perpetratorName:string;
 ward:number;
 day:number;
 witnesses:string[];
 severity:number;
 atomId?:string;
 summary:string;
}
export interface CrimeKnowledge{
 incidentId:string;
 district:number;
 kind:CrimeKnowledgeKind;
 strength:number;
 firstKnownDay:number;
 provenance:string;
}
export interface RealmCrimeState{
 version:1;
 sequence:number;
 incidents:Record<string,RealmCrimeIncident>;
 externalKeys:Record<string,string>;
 knowledge:Record<string,Record<string,CrimeKnowledge>>;
}
export interface RealmCrimeInput{
 externalKey:string;
 kind:RealmCrimeKind;
 perpetratorId:string;
 perpetratorName:string;
 ward:number;
 witnesses:string[];
 summary?:string;
}

declare module './state'{interface WorldState{realmCrime?:RealmCrimeState}}

const severity:Record<RealmCrimeKind,number>={theft:1,assault:2,murder:4};
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const districtForWard=(ward:number)=>clamp(Math.floor(ward/REALM_DISTRICT_SIZE),0,REALM_DISTRICT_COUNT-1);
const districtRepresentative=(district:number)=>district*REALM_DISTRICT_SIZE+Math.floor(REALM_DISTRICT_SIZE/2);

export function ensureRealmCrime(world:WorldState):RealmCrimeState{
 const state=world.realmCrime??{version:1 as const,sequence:0,incidents:{},externalKeys:{},knowledge:{}};
 state.incidents??={};state.externalKeys??={};state.knowledge??={};if(!Number.isFinite(state.sequence))state.sequence=0;world.realmCrime=state;return state;
}

export function recordRealmCrime(world:WorldState,input:RealmCrimeInput):RealmCrimeIncident{
 const state=ensureRealmCrime(world),priorId=state.externalKeys[input.externalKey];if(priorId&&state.incidents[priorId])return state.incidents[priorId];
 const day=Math.floor(world.tick/3600),id=`crime:${day.toString(36)}:${(state.sequence++).toString(36)}`,witnesses=[...new Set(input.witnesses.filter(Boolean))],summary=input.summary??`${input.perpetratorName} committed ${input.kind} in ward ${input.ward}.`;
 const incident:RealmCrimeIncident={id,externalKey:input.externalKey,kind:input.kind,perpetratorId:input.perpetratorId,perpetratorName:input.perpetratorName,ward:input.ward,day,witnesses,severity:severity[input.kind],summary};state.incidents[id]=incident;state.externalKeys[input.externalKey]=id;
 if(witnesses.length){
  const atom=promoteCanonicalEvent(world,{source:'player',actorId:input.perpetratorId,actorName:input.perpetratorName,ward:input.ward,channel:'watch',externalKey:`crime-canon:${input.externalKey}`,subjects:[id,...witnesses.map(w=>`witness:${w}`)],summary:`CRIME · ${summary} Witnesses entered the perpetrator as ${input.perpetratorName}.`});incident.atomId=atom.id;
  const district=districtForWard(input.ward);state.knowledge[id]={[String(district)]:{incidentId:id,district,kind:'witnessed',strength:1,firstKnownDay:day,provenance:atom.id}};applyRealmConsequences(world);
 }
 return incident;
}

export function advanceRealmCrimeKnowledge(world:WorldState,targetDay=Math.floor(world.tick/3600)){
 const state=ensureRealmCrime(world),router=new BidirectionalSocialRouter(historicalWardCertificates(world));
 for(const incident of Object.values(state.incidents)){
  if(!incident.atomId)continue;const sourceDistrict=districtForWard(incident.ward),age=Math.max(0,targetDay-incident.day),signal=zeroSocialSignal();signal.watch=3;const known=state.knowledge[incident.id]??={};
  for(let district=0;district<REALM_DISTRICT_COUNT;district++){
   if(district===sourceDistrict)continue;const hops=Math.abs(district-sourceDistrict);if(hops>age)continue;
   const transition=liftProvenance(router.route(incident.ward,districtRepresentative(district)),{provenance:incident.atomId,signal});if(transition.provenance!==incident.atomId)throw new Error('crime provenance changed during social routing');
   const routed=transition.signal.watch/3;if(routed<=0)continue;const strength=Math.round(clamp(routed/(1+hops*.2),.05,.95)*1000)/1000,prior=known[String(district)];
   if(!prior||strength>prior.strength)known[String(district)]={incidentId:incident.id,district,kind:'rumor',strength,firstKnownDay:incident.day+hops,provenance:incident.atomId};
  }
  state.knowledge[incident.id]=known;
 }
 return state;
}

export function crimeKnowledgeAt(world:WorldState,incidentId:string,ward:number):CrimeKnowledge|undefined{return ensureRealmCrime(world).knowledge[incidentId]?.[String(districtForWard(ward))];}

export function wantedLevelAt(world:WorldState,perpetratorId:string,ward:number){
 advanceRealmCrimeKnowledge(world);const district=districtForWard(ward),state=ensureRealmCrime(world);let score=0;
 for(const incident of Object.values(state.incidents)){if(incident.perpetratorId!==perpetratorId)continue;const knowledge=state.knowledge[incident.id]?.[String(district)];if(!knowledge)continue;score+=incident.severity*knowledge.strength*(knowledge.kind==='witnessed'?1:.45);}
 return Math.round(clamp(score,0,5)*100)/100;
}

export function crimeAccounting(world:WorldState){const state=ensureRealmCrime(world);let witnessed=0,rumors=0;for(const districts of Object.values(state.knowledge))for(const knowledge of Object.values(districts))knowledge.kind==='witnessed'?witnessed++:rumors++;return {incidents:Object.keys(state.incidents).length,witnessed,rumors};}
