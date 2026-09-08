import test from 'node:test';
import assert from 'node:assert/strict';
import {CITIZEN_PHASES,histogramPopulation,type PopulationHistogram} from '../src/population-morphism';
import {REALM_LOGICAL_POPULATION,ensureRealmPopulation} from '../src/realm-population';
import {GATEWATCH_SHARD,REALM_HOUSEHOLDS} from '../src/realm-society';
import {SOCIAL_BOUNDARY_STATE_COUNT,SocialSeparatorTree,applySocialCertificate,sequentialWardBoundary,socialDeltaKey,socialSignalFromIndex,socialSignalKey,summarizeSocialCertificates,wardBoundaryCertificate,type SocialSignal} from '../src/social-separator';
import {BidirectionalSocialRouter,RUMOR_TTL_DAYS,advanceRealmHistoryToDay,buildHistoricalSocialRouter,causalParents,effectiveHouseholdShard,ensureRealmHistory,historicalWardCertificates,historicalWardPopulationHistogram,historyAccounting,liftProvenance,migrationAffectedWards,repairHistoricalSocialTree,routeRumor,validateHistoryDag,validateStructuralHistory} from '../src/provenance-frontier';
import {makePlayer,seedState} from '../src/state';

function signature(code:number):SocialSignal{return {kin:(code&3) as 0|1|2|3,market:((code>>2)&3) as 0|1|2|3,watch:((code>>4)&3) as 0|1|2|3,guild:((code>>6)&3) as 0|1|2|3};}
function world(seed=411){const w=seedState();w.worldSeed=seed;w.players['player-1']=makePlayer('Historian');ensureRealmPopulation(w);return w;}
function sumHistograms(histograms:PopulationHistogram[]):PopulationHistogram{const out=Object.fromEntries(CITIZEN_PHASES.map(p=>[p,0])) as PopulationHistogram;for(const h of histograms)for(const p of CITIZEN_PHASES)out[p]+=h[p];return out;}

test('ordered separator range queries are exact and logarithmic for forward and reverse routes',()=>{
 const signatures=Array.from({length:256},(_,i)=>signature((Math.imul(i,109)+37)&255)),certs=signatures.map(wardBoundaryCertificate),router=new BidirectionalSocialRouter(certs);let x=0x59590210;
 for(let trial=0;trial<512;trial++){x=(Math.imul(x,1664525)+1013904223)>>>0;const a=x&255;x=(Math.imul(x,1664525)+1013904223)>>>0;const b=x&255,input=socialSignalFromIndex((x>>>8)&255),route=router.route(a,b),ordered=a<=b?signatures.slice(a,b+1):signatures.slice(b,a+1).reverse(),direct=sequentialWardBoundary(ordered,input),cut=applySocialCertificate(route,input);assert.equal(socialSignalKey(cut.signal),socialSignalKey(direct.signal));assert.equal(socialDeltaKey(cut.delta),socialDeltaKey(direct.delta));assert.equal(route.segmentCount,Math.abs(a-b)+1);assert.ok(router.lastRangeNodes<=18,'256-ward range should use logarithmic tree fragments');}
});

test('provenance product lift preserves arbitrary unique labels while compressed social behavior remains exact',()=>{
 const signatures=Array.from({length:31},(_,i)=>signature((i*53+11)&255)),certificate=summarizeSocialCertificates(signatures.map(wardBoundaryCertificate));
 for(let i=0;i<SOCIAL_BOUNDARY_STATE_COUNT;i++){const input=socialSignalFromIndex(i),expected=sequentialWardBoundary(signatures,input);for(const provenance of [`atom:${i}:A`,`atom:${i}:B`,JSON.stringify({source:i,house:i*97})]){const lifted=liftProvenance(certificate,{provenance,signal:input});assert.equal(lifted.provenance,provenance);assert.equal(socialSignalKey(lifted.signal),socialSignalKey(expected.signal));assert.equal(socialDeltaKey(lifted.delta),socialDeltaKey(expected.delta));assert.equal(lifted.segmentCount,31);}}
});

test('ten-thousand-day causal history keeps active frontier bounded by TTL while canon grows only with promoted events',()=>{
 const w=world(1295),history=advanceRealmHistoryToDay(w,10000),accounting=historyAccounting(history);assert.equal(history.lastProcessedDay,10000);assert.ok(history.activeRumors.length<=RUMOR_TTL_DAYS);assert.ok(accounting.atoms>1000&&accounting.atoms<5000);assert.ok(accounting.rank<20000);assert.ok(accounting.rank<REALM_LOGICAL_POPULATION/40);assert.ok(validateHistoryDag(history));assert.ok(validateStructuralHistory(history));assert.ok(history.recentCanon.length<=16);const snapshot=JSON.stringify(history);assert.ok(snapshot.length<2_000_000,'historical archive should scale with promoted history, not million-person rows');const before=snapshot;advanceRealmHistoryToDay(w,10000);assert.equal(JSON.stringify(history),before,'history catch-up must be idempotent');
});

test('historical events actually exercise marriage, birth, migration, succession, grudges and causal parent links',()=>{
 const w=world(595),history=advanceRealmHistoryToDay(w,5000),kinds=new Set(Object.values(history.atoms).map(a=>a.kind));for(const kind of ['rumor','marriage','birth','migration','succession','grudge'])assert.ok(kinds.has(kind as any),`missing historical kind ${kind}`);assert.ok(Object.keys(history.bornPeople).length>0);assert.ok(Object.values(history.households).some(p=>p.marriageTo!==undefined));assert.ok(Object.values(history.households).some(p=>p.migratedShard!==undefined));assert.ok(Object.values(history.households).some(p=>p.grudges.length>0));assert.ok(Object.keys(history.leaders).length>0);assert.ok(Object.values(history.atoms).some(a=>a.kind==='succession'&&causalParents(history,a.id).length>0),'repeated faction succession should create causal ancestry');assert.ok(validateHistoryDag(history));assert.ok(validateStructuralHistory(history));
});

test('migration and matured sparse births alter ward demography exactly without changing base citizen identity',()=>{
 const w=world(1679615),population=ensureRealmPopulation(w),history=advanceRealmHistoryToDay(w,5000),histograms=Array.from({length:256},(_,shard)=>historicalWardPopulationHistogram(w,shard)),total=sumHistograms(histograms),mature=Object.values(history.bornPeople).filter(p=>p.adultAtDay<=history.lastProcessedDay).length;assert.equal(CITIZEN_PHASES.reduce((n,p)=>n+total[p],0),REALM_LOGICAL_POPULATION+mature);assert.equal(population.population,REALM_LOGICAL_POPULATION,'sparse descendants must not rewrite the immutable million-person base address space');for(const patch of Object.values(history.households).slice(0,100)){const shard=effectiveHouseholdShard(history,patch.householdOrdinal);assert.ok(shard>=0&&shard<256);}assert.ok(histogramPopulation(total)>REALM_LOGICAL_POPULATION);
});

test('a sparse migration perturbation repairs only logarithmic separator ancestors and equals full rebuild',()=>{
 const w=world(902),history=advanceRealmHistoryToDay(w,1500),migration=Object.values(history.households).find(p=>p.migratedShard!==undefined);assert.ok(migration,'Court needs a migration witness');const tree=new SocialSeparatorTree(historicalWardCertificates(w)),old=migration!.migratedShard!,next=(old+37)%256,origin=Math.floor(migration!.householdOrdinal/(REALM_HOUSEHOLDS/256));migration!.migratedShard=next;const wards=migrationAffectedWards(migration!.householdOrdinal,old,next),work=repairHistoricalSocialTree(tree,w,wards),rebuilt=new SocialSeparatorTree(historicalWardCertificates(w));assert.deepEqual(tree.root,rebuilt.root);assert.ok(wards.includes(origin)&&wards.includes(old)&&wards.includes(next));assert.ok(work<=wards.length*Math.log2(256));
});

test('active rumors retain exact source provenance while routing to Gatewatch through logarithmic certificates',()=>{
 const w=world(411);let history=ensureRealmHistory(w),day=0;while(history.activeRumors.length===0&&day<200){day++;history=advanceRealmHistoryToDay(w,day);}assert.ok(history.activeRumors.length>0);const rumor=history.activeRumors.at(-1)!,router=buildHistoricalSocialRouter(w),routed=routeRumor(w,rumor,GATEWATCH_SHARD,router),certs=historicalWardCertificates(w),ordered=rumor.sourceWard<=GATEWATCH_SHARD?certs.slice(rumor.sourceWard,GATEWATCH_SHARD+1):certs.slice(GATEWATCH_SHARD,rumor.sourceWard+1).reverse(),direct=applySocialCertificate(summarizeSocialCertificates(ordered),rumor.signal);assert.equal(routed.transition.provenance,rumor.sourceAtomId);assert.equal(socialSignalKey(routed.transition.signal),socialSignalKey(direct.signal));assert.equal(socialDeltaKey(routed.transition.delta),socialDeltaKey(direct.delta));assert.ok(routed.rangeNodes<=18);assert.equal(routed.transition.segmentCount,Math.abs(rumor.sourceWard-GATEWATCH_SHARD)+1);
});
