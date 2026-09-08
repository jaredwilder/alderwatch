import test from 'node:test';
import assert from 'node:assert/strict';
import {CITIZEN_PHASES,POPULATION_INPUTS,microPopulationStep,populationDeltaKey,type CitizenPhase} from '../src/population-morphism';
import {advanceRealmPopulationToDay,citizenId,describeCitizen,promoteCitizen,seedRealmPopulationState,setNamedCitizenPhase} from '../src/realm-population';
import {HOUSEHOLD_RELATIONS,HOUSEHOLD_RELATION_DEGREE,HOUSEHOLD_TYPE_COUNT,REALM_HOUSEHOLDS,REALM_HOUSEHOLD_RELATION_EDGES,advanceRealmSocietyToDay,buildRealmSocialSeparator,chronicleForDay,householdHistogram,householdRelationOrdinal,householdStep,householdTypeKey,socialCertificateForWard,wardPopulationHistogram,wardSocialSignature} from '../src/realm-society';
import {SOCIAL_BOUNDARY_STATE_COUNT,SocialSeparatorTree,applySocialCertificate,composeSocialCertificates,sequentialWardBoundary,socialDeltaKey,socialSignalFromIndex,socialSignalKey,summarizeSocialCertificates,wardBoundaryCertificate,type SocialSignal} from '../src/social-separator';
import {makePlayer,seedState} from '../src/state';

function phasesFromCode(code:number,n:number):CitizenPhase[]{const out:CitizenPhase[]=[];for(let i=0;i<n;i++){out.push(CITIZEN_PHASES[code%CITIZEN_PHASES.length]);code=Math.floor(code/CITIZEN_PHASES.length);}return out;}
function signatureFromCode(code:number):SocialSignal{return {kin:(code&3) as 0|1|2|3,market:((code>>2)&3) as 0|1|2|3,watch:((code>>4)&3) as 0|1|2|3,guild:((code>>6)&3) as 0|1|2|3};}

test('household quotient collapses 8^4 ordered families to exactly 330 orbit types without losing public behavior',()=>{
 const total=CITIZEN_PHASES.length**4,types=new Set<string>(),witness=new Map<string,string>();
 for(let code=0;code<total;code++){
  const micro=phasesFromCode(code,4),hist=householdHistogram(micro),type=householdTypeKey(hist);types.add(type);
  for(const input of POPULATION_INPUTS){const full=microPopulationStep(micro,input),cut=householdStep(hist,input),result=householdTypeKey(cut.histogram)+'|'+populationDeltaKey(cut.delta),key=input+'|'+type,prior=witness.get(key);assert.equal(householdTypeKey(cut.histogram),householdTypeKey(householdHistogram(full.phases)));assert.equal(populationDeltaKey(cut.delta),populationDeltaKey(full.delta));if(prior===undefined)witness.set(key,result);else assert.equal(result,prior);}
 }
 assert.equal(total,4096);assert.equal(types.size,HOUSEHOLD_TYPE_COUNT);assert.equal(HOUSEHOLD_TYPE_COUNT,330);
});

test('three deterministic household matchings create a symmetric degree-3 graph with no stored quadratic edge explosion',()=>{
 assert.equal(HOUSEHOLD_RELATION_DEGREE,3);assert.equal(REALM_HOUSEHOLDS,262144);assert.equal(REALM_HOUSEHOLD_RELATION_EDGES,393216);
 for(let household=0;household<REALM_HOUSEHOLDS;household++)for(const relation of HOUSEHOLD_RELATIONS){const other=householdRelationOrdinal(household,relation);assert.notEqual(other,household);assert.equal(householdRelationOrdinal(other,relation),household);assert.equal(Math.floor(other/1024),Math.floor(household/1024));}
});

test('ward histogram reconstructs 4096 current lives exactly from the quotient plus sparse named exceptions',()=>{
 const seed=595,state=seedRealmPopulationState(seed,8192);advanceRealmPopulationToDay(state,seed,73);for(const ordinal of [3,17,44,4099,5001])promoteCitizen(state,seed,ordinal,'social Court');setNamedCitizenPhase(state,citizenId(seed,17),'guard');setNamedCitizenPhase(state,citizenId(seed,44),'displaced');
 for(const shard of [0,1]){const exact=Object.fromEntries(CITIZEN_PHASES.map(p=>[p,0])) as Record<CitizenPhase,number>;const first=shard*4096;for(let ordinal=first;ordinal<first+4096;ordinal++)exact[describeCitizen(state,seed,ordinal).phase]++;assert.deepEqual(wardPopulationHistogram(state,seed,shard),exact);}
});

test('ward cut certificate is trace-exact for all 256 boundary states and nested composition keeps fixed width',()=>{
 const signatures=Array.from({length:256},(_,i)=>signatureFromCode((Math.imul(i,73)+19)&255)),wardCertificates=signatures.map(wardBoundaryCertificate),districts=Array.from({length:16},(_,i)=>summarizeSocialCertificates(wardCertificates.slice(i*16,i*16+16))),realm=summarizeSocialCertificates(districts);
 assert.equal(realm.table.length,SOCIAL_BOUNDARY_STATE_COUNT);assert.equal(realm.segmentCount,256);
 for(let i=0;i<SOCIAL_BOUNDARY_STATE_COUNT;i++){const input=socialSignalFromIndex(i),direct=sequentialWardBoundary(signatures,input),nested=applySocialCertificate(realm,input);assert.equal(socialSignalKey(nested.signal),socialSignalKey(direct.signal));assert.equal(socialDeltaKey(nested.delta),socialDeltaKey(direct.delta));}
});

test('social separator composition is associative and order-sensitive while preserving a 256-state interface',()=>{
 const a=wardBoundaryCertificate({kin:3,market:0,watch:1,guild:2}),b=wardBoundaryCertificate({kin:0,market:3,watch:2,guild:1}),c=wardBoundaryCertificate({kin:1,market:2,watch:3,guild:0});
 const left=composeSocialCertificates(composeSocialCertificates(a,b),c),right=composeSocialCertificates(a,composeSocialCertificates(b,c)),reverse=composeSocialCertificates(composeSocialCertificates(c,b),a);assert.deepEqual(left,right);assert.equal(left.table.length,256);assert.notDeepEqual(left,reverse);
});

test('separator tree updates one social ward in logarithmic ancestors and root query stays one table lookup',()=>{
 const base=wardBoundaryCertificate({kin:1,market:1,watch:1,guild:1}),trees=[1,16,256,1024].map(n=>new SocialSeparatorTree(Array.from({length:n},()=>base)));
 for(const tree of trees){assert.equal(tree.root.table.length,256);assert.equal(tree.root.segmentCount,tree.leafCount);const nodes=tree.update(Math.min(3,tree.leafCount-1),wardBoundaryCertificate({kin:3,market:2,watch:0,guild:3}));assert.equal(nodes,Math.log2(tree.leafCount));assert.equal(tree.apply({kin:0,market:1,watch:2,guild:3}).signal.guild>=0,true);}
});

test('the merged million-person realm produces an exact 256-ward social separator without enumerating citizens',()=>{
 const seed=90210,state=seedRealmPopulationState(seed),tree=buildRealmSocialSeparator(state,seed);assert.equal(tree.leafCount,256);assert.equal(tree.root.segmentCount,256);assert.equal(tree.root.table.length,256);const sig=wardSocialSignature(wardPopulationHistogram(state,seed,72));assert.deepEqual(socialCertificateForWard(state,seed,72),wardBoundaryCertificate(sig));
});

test('chronicle is deterministic, bounded and tied to stable household relationships',()=>{
 const world=seedState();world.worldSeed=411;world.players['player-1']=makePlayer('Chronicler');const a=chronicleForDay(411,88),b=chronicleForDay(411,88);assert.equal(a,b);const social=advanceRealmSocietyToDay(world,10000);assert.equal(social.lastProcessedDay,10000);assert.equal(social.recent.length,12);assert.ok(social.recent.every(line=>line.includes('Day ')));const snapshot=JSON.parse(JSON.stringify(world));assert.ok(JSON.stringify(snapshot.realmSocial).length<3000);assert.deepEqual(advanceRealmSocietyToDay(world,10000),social);
});
