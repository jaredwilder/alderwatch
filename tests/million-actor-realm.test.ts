import test from 'node:test';
import assert from 'node:assert/strict';
import {CITIZEN_PHASES,POPULATION_INPUTS,addPopulationDelta,applyPopulationBlock,histogramFromMicro,histogramOrbitCount,microPopulationStep,populationBlockFor,populationDeltaKey,populationHistogramKey,summarizePopulationInputs,zeroPopulationDelta,zeroPopulationHistogram,type CitizenPhase} from '../src/population-morphism';
import {PopulationBubble,REALM_ACTIVE_RESIDENT_CAP,REALM_LOGICAL_POPULATION,REALM_POPULATION_SHARDS,REALM_SHARD_SIZE,advanceRealmPopulationToDay,citizenId,citizenOrdinalFromId,currentBulkFromLineage,describeCitizen,initialCitizenPhase,populationAccounting,promoteCitizen,realmPopulationInput,seedRealmPopulationState,setNamedCitizenPhase} from '../src/realm-population';

function microFromCode(code:number,n:number):CitizenPhase[]{const out:CitizenPhase[]=[];for(let i=0;i<n;i++){out.push(CITIZEN_PHASES[code%CITIZEN_PHASES.length]);code=Math.floor(code/CITIZEN_PHASES.length);}return out;}
function combinedHistogram(state:ReturnType<typeof seedRealmPopulationState>){const h={...state.bulkCurrent};for(const citizen of Object.values(state.exceptions))h[citizen.phase]++;return h;}

test('exchangeability Court: histogram is an exact boundary quotient of every ordered five-citizen microstate',()=>{
 const n=5,total=CITIZEN_PHASES.length**n,witness=new Map<string,string>();
 for(let code=0;code<total;code++){
  const micro=microFromCode(code,n),hist=histogramFromMicro(micro);
  for(const input of POPULATION_INPUTS){const full=microPopulationStep(micro,input),cut=applyPopulationBlock(hist,populationBlockFor(input));assert.equal(populationHistogramKey(cut.histogram),populationHistogramKey(histogramFromMicro(full.phases)));assert.equal(populationDeltaKey(cut.delta),populationDeltaKey(full.delta));const orbitKey=input+'|'+populationHistogramKey(hist),result=populationHistogramKey(cut.histogram)+'|'+populationDeltaKey(cut.delta),prior=witness.get(orbitKey);if(prior===undefined)witness.set(orbitKey,result);else assert.equal(result,prior);}
 }
 assert.equal(total,32768);assert.ok(witness.size>0);
});

test('ordered population blocks compose associatively and exactly match sequential micro replay',()=>{
 const a=summarizePopulationInputs(['raid','recovery','harvest']),b=summarizePopulationInputs(['levy','mine_push']),c=summarizePopulationInputs(['festival','raid','quiet']);
 const hist=histogramFromMicro(['farmer','farmer','miner','guard','trader','artisan','laborer','injured','displaced']);
 const left=applyPopulationBlock(applyPopulationBlock(applyPopulationBlock(hist,a).histogram,b).histogram,c).histogram,all=applyPopulationBlock(hist,summarizePopulationInputs(['raid','recovery','harvest','levy','mine_push','festival','raid','quiet'])).histogram;assert.deepEqual(left,all);
 let micro=['farmer','farmer','miner','guard','trader','artisan','laborer','injured','displaced'] as CitizenPhase[];let delta=zeroPopulationDelta();for(const input of ['raid','recovery','harvest','levy','mine_push','festival','raid','quiet'] as const){const step=microPopulationStep(micro,input);micro=step.phases;delta=addPopulationDelta(delta,step.delta);}const cut=applyPopulationBlock(hist,summarizePopulationInputs(['raid','recovery','harvest','levy','mine_push','festival','raid','quiet']));assert.deepEqual(cut.histogram,histogramFromMicro(micro));assert.deepEqual(cut.delta,delta);
});

test('million-actor seed is exact, injectively addressable, balanced and tiny',()=>{
 const seed=90210,state=seedRealmPopulationState(seed);assert.equal(state.population,REALM_LOGICAL_POPULATION);assert.equal(REALM_POPULATION_SHARDS*REALM_SHARD_SIZE,REALM_LOGICAL_POPULATION);for(const phase of CITIZEN_PHASES)assert.equal(state.bulkInitial[phase],131072);
 assert.equal(histogramOrbitCount(REALM_LOGICAL_POPULATION).toString(),'276554324146871386263159553709685604353');
 const probes=[0,1,7,8,4095,4096,524287,1048575];for(const ordinal of probes){const id=citizenId(seed,ordinal);assert.equal(citizenOrdinalFromId(id),ordinal);const citizen=describeCitizen(state,seed,ordinal);assert.equal(citizen.ordinal,ordinal);assert.equal(citizen.shard,Math.floor(ordinal/REALM_SHARD_SIZE));}
 const seen=new Set<string>();let x=0x12345678;for(let i=0;i<10000;i++){x=(Math.imul(x,1664525)+1013904223)>>>0;const ordinal=x%REALM_LOGICAL_POPULATION, id=citizenId(seed,ordinal);assert.equal(citizenOrdinalFromId(id),ordinal);seen.add(id);}assert.ok(seen.size>9900);
 assert.ok(JSON.stringify(state).length<2500,'unmodified million-person certificate should remain kilobytes, not megabytes');
});

test('10,000 days of realm history costs the same certificate work for 1K, 1M and 1B inhabitants',()=>{
 const seed=411,small=seedRealmPopulationState(seed,1024),million=seedRealmPopulationState(seed,REALM_LOGICAL_POPULATION),billion=seedRealmPopulationState(seed,1_000_000_000);const a=advanceRealmPopulationToDay(small,seed,10000),b=advanceRealmPopulationToDay(million,seed,10000),c=advanceRealmPopulationToDay(billion,seed,10000);
 assert.equal(a.epochs,b.epochs);assert.equal(b.epochs,c.epochs);assert.equal(a.workUnits,b.workUnits);assert.equal(b.workUnits,c.workUnits);assert.equal(b.workUnits,b.epochs*CITIZEN_PHASES.length);assert.equal(populationAccounting(million).total,REALM_LOGICAL_POPULATION);assert.equal(populationAccounting(billion).total,1_000_000_000);assert.deepEqual(currentBulkFromLineage(million),million.bulkCurrent);assert.ok(JSON.stringify(million).length<5000);
});

test('sparse named exceptions preserve exact individual divergence without breaking the bulk quotient',()=>{
 const seed=595,n=64,state=seedRealmPopulationState(seed,n),micro=Array.from({length:n},(_,ordinal)=>initialCitizenPhase(seed,ordinal));const promoted=[3,17,44];for(const ordinal of promoted)promoteCitizen(state,seed,ordinal,'Court witness');setNamedCitizenPhase(state,citizenId(seed,17),'guard');micro[17]='guard';let microDelta=zeroPopulationDelta();
 for(let day=1;day<=365;day++){const input=realmPopulationInput(seed,day),step=microPopulationStep(micro,input);micro.splice(0,micro.length,...step.phases);microDelta=addPopulationDelta(microDelta,step.delta);}advanceRealmPopulationToDay(state,seed,365);
 assert.deepEqual(combinedHistogram(state),histogramFromMicro(micro));assert.deepEqual(state.totals,microDelta);assert.deepEqual(currentBulkFromLineage(state),state.bulkCurrent);assert.equal(populationAccounting(state).total,n);assert.equal(Object.keys(state.exceptions).length,3);assert.ok(state.recent.length<=12);
});

test('population bubble remains hard-capped even for billion-scale logical address space and many named residents',()=>{
 const seed=1679615,million=seedRealmPopulationState(seed),billion=seedRealmPopulationState(seed,1_000_000_000),bubble=new PopulationBubble();for(let i=0;i<150;i++)promoteCitizen(million,seed,i,'Gatewatch named resident');
 const crowded=bubble.update(million,seed,0,12345);assert.equal(crowded.length,REALM_ACTIVE_RESIDENT_CAP);assert.equal(bubble.active.size,REALM_ACTIVE_RESIDENT_CAP);assert.ok(bubble.candidateChecks<=REALM_SHARD_SIZE);
 for(const shard of [0,1,17,255,10000,200000]){const residents=bubble.update(billion,seed,shard,shard*97);assert.ok(residents.length<=REALM_ACTIVE_RESIDENT_CAP);assert.ok(bubble.active.size<=REALM_ACTIVE_RESIDENT_CAP);assert.ok(bubble.candidateChecks<=REALM_SHARD_SIZE);}
});

test('every 4096-person shard has an exact balanced initial phase basis without enumerating the realm',()=>{
 const seed=1295;for(const shard of [0,1,63,127,255]){const h=zeroPopulationHistogram(),first=shard*REALM_SHARD_SIZE;for(let local=0;local<REALM_SHARD_SIZE;local++)h[initialCitizenPhase(seed,first+local)]++;for(const phase of CITIZEN_PHASES)assert.equal(h[phase],REALM_SHARD_SIZE/CITIZEN_PHASES.length);}
});
