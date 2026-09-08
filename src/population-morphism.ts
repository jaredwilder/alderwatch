export const CITIZEN_PHASES=['farmer','miner','guard','trader','artisan','laborer','injured','displaced'] as const;
export type CitizenPhase=typeof CITIZEN_PHASES[number];
export const POPULATION_INPUTS=['quiet','harvest','mine_push','levy','raid','recovery','festival'] as const;
export type PopulationInput=typeof POPULATION_INPUTS[number];

export interface PopulationDelta {food:number;iron:number;defense:number;trade:number;casualties:number;unrest:number}
export type PopulationHistogram=Record<CitizenPhase,number>;
export interface PopulationTransition {phase:CitizenPhase;delta:PopulationDelta}
export interface PopulationBlock {table:Record<CitizenPhase,PopulationTransition>;eventCount:number}

export const zeroPopulationDelta=():PopulationDelta=>({food:0,iron:0,defense:0,trade:0,casualties:0,unrest:0});
export const zeroPopulationHistogram=():PopulationHistogram=>Object.fromEntries(CITIZEN_PHASES.map(phase=>[phase,0])) as PopulationHistogram;
export function addPopulationDelta(a:PopulationDelta,b:PopulationDelta):PopulationDelta{return {food:a.food+b.food,iron:a.iron+b.iron,defense:a.defense+b.defense,trade:a.trade+b.trade,casualties:a.casualties+b.casualties,unrest:a.unrest+b.unrest};}
export function scalePopulationDelta(a:PopulationDelta,n:number):PopulationDelta{return {food:a.food*n,iron:a.iron*n,defense:a.defense*n,trade:a.trade*n,casualties:a.casualties*n,unrest:a.unrest*n};}

/** One citizen's public transition. It depends only on current phase + shared realm input. */
export function citizenStep(phase:CitizenPhase,input:PopulationInput):PopulationTransition{
 const d=zeroPopulationDelta();
 if(input==='quiet'){
  if(phase==='farmer')d.food=1;if(phase==='miner')d.iron=1;if(phase==='guard')d.defense=1;if(phase==='trader'||phase==='artisan')d.trade=1;
  if(phase==='injured')return {phase:'laborer',delta:d};if(phase==='displaced')return {phase:'laborer',delta:d};return {phase,delta:d};
 }
 if(input==='harvest'){
  if(phase==='farmer'){d.food=3;return {phase,delta:d};}if(phase==='laborer'){d.food=1;return {phase:'farmer',delta:d};}if(phase==='displaced')return {phase:'laborer',delta:d};return {phase,delta:d};
 }
 if(input==='mine_push'){
  if(phase==='miner'){d.iron=3;return {phase,delta:d};}if(phase==='laborer'){d.iron=1;return {phase:'miner',delta:d};}if(phase==='artisan'){d.iron=1;d.trade=1;}return {phase,delta:d};
 }
 if(input==='levy'){
  if(phase==='guard'){d.defense=3;return {phase,delta:d};}if(phase==='laborer'){d.defense=1;return {phase:'guard',delta:d};}if(phase==='farmer'||phase==='miner'){d.defense=1;return {phase:'guard',delta:d};}return {phase,delta:d};
 }
 if(input==='raid'){
  if(phase==='guard'){d.defense=4;return {phase,delta:d};}
  if(phase==='injured'){d.casualties=1;d.unrest=2;return {phase:'displaced',delta:d};}
  if(phase==='displaced'){d.casualties=1;d.unrest=2;return {phase,delta:d};}
  if(phase==='farmer'||phase==='trader'||phase==='artisan'){d.unrest=1;return {phase:'displaced',delta:d};}
  d.unrest=1;return {phase:'injured',delta:d};
 }
 if(input==='recovery'){
  if(phase==='injured')return {phase:'laborer',delta:d};if(phase==='displaced')return {phase:'laborer',delta:d};if(phase==='guard')return {phase:'laborer',delta:d};
  if(phase==='artisan'||phase==='trader')d.trade=1;return {phase,delta:d};
 }
 // festival
 if(phase==='trader'||phase==='artisan'){d.trade=3;d.unrest=-1;}else if(phase==='displaced'||phase==='injured'){d.unrest=-1;}else d.trade=1;
 return {phase,delta:d};
}

export function populationBlockFor(input:PopulationInput):PopulationBlock{
 const table={} as Record<CitizenPhase,PopulationTransition>;for(const phase of CITIZEN_PHASES)table[phase]=citizenStep(phase,input);return {table,eventCount:1};
}
export function identityPopulationBlock():PopulationBlock{
 const table={} as Record<CitizenPhase,PopulationTransition>;for(const phase of CITIZEN_PHASES)table[phase]={phase,delta:zeroPopulationDelta()};return {table,eventCount:0};
}
/** Ordered semidirect composition: a happens first, then b. */
export function composePopulationBlocks(a:PopulationBlock,b:PopulationBlock):PopulationBlock{
 const table={} as Record<CitizenPhase,PopulationTransition>;
 for(const start of CITIZEN_PHASES){const first=a.table[start],second=b.table[first.phase];table[start]={phase:second.phase,delta:addPopulationDelta(first.delta,second.delta)};}
 return {table,eventCount:a.eventCount+b.eventCount};
}
export function summarizePopulationInputs(inputs:readonly PopulationInput[]):PopulationBlock{return inputs.reduce((block,input)=>composePopulationBlocks(block,populationBlockFor(input)),identityPopulationBlock());}

/** Exact quotient action on a whole exchangeable cohort. Runtime work is O(|phases|), not O(population). */
export function applyPopulationBlock(histogram:PopulationHistogram,block:PopulationBlock):{histogram:PopulationHistogram;delta:PopulationDelta;workUnits:number}{
 const next=zeroPopulationHistogram();let delta=zeroPopulationDelta(),workUnits=0;
 for(const phase of CITIZEN_PHASES){const count=histogram[phase];const transition=block.table[phase];next[transition.phase]+=count;delta=addPopulationDelta(delta,scalePopulationDelta(transition.delta,count));workUnits++;}
 return {histogram:next,delta,workUnits};
}

export function histogramFromMicro(phases:readonly CitizenPhase[]):PopulationHistogram{const out=zeroPopulationHistogram();for(const phase of phases)out[phase]++;return out;}
export function microPopulationStep(phases:readonly CitizenPhase[],input:PopulationInput):{phases:CitizenPhase[];delta:PopulationDelta}{
 const next:CitizenPhase[]=[];let delta=zeroPopulationDelta();for(const phase of phases){const step=citizenStep(phase,input);next.push(step.phase);delta=addPopulationDelta(delta,step.delta);}return {phases:next,delta};
}
export function populationHistogramKey(histogram:PopulationHistogram):string{return CITIZEN_PHASES.map(phase=>histogram[phase]).join(',');}
export function populationDeltaKey(delta:PopulationDelta):string{return [delta.food,delta.iron,delta.defense,delta.trade,delta.casualties,delta.unrest].join(',');}
export function histogramPopulation(histogram:PopulationHistogram):number{return CITIZEN_PHASES.reduce((n,phase)=>n+histogram[phase],0);}

/** Stars-and-bars count of permutation orbits of N citizens over K phases. */
export function histogramOrbitCount(population:number,phaseCount=CITIZEN_PHASES.length):bigint{
 if(!Number.isSafeInteger(population)||population<0)throw new Error('population must be a non-negative safe integer');if(!Number.isInteger(phaseCount)||phaseCount<1)throw new Error('phaseCount must be positive');
 let result=1n;for(let i=1;i<phaseCount;i++)result=result*BigInt(population+i)/BigInt(i);return result;
}
