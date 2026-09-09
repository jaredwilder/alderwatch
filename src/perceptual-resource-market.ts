const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

export type PerceptualChannelId=
 |'grass.hero'|'grass.near'|'grass.mid'|'grass.far'|'grass.horizon'|'grass.vista'
 |'ecology.fernlet'|'ecology.broadleaf'|'ecology.sedge'|'ecology.dryStalk'|'ecology.shrub'
 |'canopy.crown'|'canopy.mass'|'forest.contact'
 |'surface.ground'|'surface.leaf'|'shadow.minor';

export interface PerceptualChannelSpec{
 id:PerceptualChannelId;
 /** Relative GPU work. Geometry channels are tied to frozen triangle/draw ceilings. */
 work:number;
 /** Marginal visual value before the concave utility curve. */
 salience:number;
 /** Non-negotiable minimum representation under sustained pressure. */
 floor:number;
}
export interface PerceptualMarketResult{
 quality:number;
 budget:number;
 spent:number;
 minimum:number;
 maximum:number;
 allocations:Record<PerceptualChannelId,number>;
}

/** One draw has a non-zero cost even when its triangle count is tiny. */
export function geometryWork(maxTriangles:number,drawCalls=1){return maxTriangles/20_000+drawCalls*.75;}

/**
 * A single graphics market.  The geometry work terms are derived from the exact
 * observer ceilings already frozen by the Court; surface/shadow terms are pixel
 * work proxies because their dominant cost is fragment/shadow processing.
 */
export const PERCEPTUAL_CHANNELS=[
 {id:'grass.hero',work:geometryWork(184_320),salience:25,floor:1},
 {id:'grass.near',work:geometryWork(100_352),salience:13,floor:.72},
 {id:'grass.mid',work:geometryWork(124_416),salience:9,floor:.35},
 {id:'grass.far',work:geometryWork(92_928),salience:6.5,floor:.10},
 {id:'grass.horizon',work:geometryWork(73_728),salience:3.8,floor:0},
 {id:'grass.vista',work:geometryWork(100_352),salience:2.4,floor:0},
 {id:'ecology.fernlet',work:geometryWork(17_640),salience:8,floor:.55},
 {id:'ecology.broadleaf',work:geometryWork(23_232),salience:7.5,floor:.48},
 {id:'ecology.sedge',work:geometryWork(32_448),salience:6,floor:.25},
 {id:'ecology.dryStalk',work:geometryWork(25_088),salience:3.5,floor:0},
 {id:'ecology.shrub',work:geometryWork(43_200),salience:5,floor:.15},
 {id:'canopy.crown',work:geometryWork(165_888),salience:10,floor:.32},
 {id:'canopy.mass',work:geometryWork(49_152),salience:4.5,floor:0},
 {id:'forest.contact',work:geometryWork(1_920),salience:7,floor:.35},
 {id:'surface.ground',work:9,salience:12,floor:.45},
 {id:'surface.leaf',work:4,salience:10,floor:.50},
 {id:'shadow.minor',work:4.5,salience:5,floor:0},
] as const satisfies readonly PerceptualChannelSpec[];

const MINIMUM_WORK=PERCEPTUAL_CHANNELS.reduce((sum,c)=>sum+c.work*c.floor,0);
const MAXIMUM_WORK=PERCEPTUAL_CHANNELS.reduce((sum,c)=>sum+c.work,0);
const KNEE=.16;
let cachedQuality=NaN,cachedResult:PerceptualMarketResult|undefined;

function budgetForQuality(quality:number){
 const q=clamp(quality,.56,1),t=(q-.56)/.44,smooth=t*t*(3-2*t);
 // Keep severe pressure close to the protected floor; release capacity smoothly.
 return MINIMUM_WORK+(MAXIMUM_WORK-MINIMUM_WORK)*Math.pow(smooth,1.08);
}
function allocationAtLambda(lambda:number,spec:PerceptualChannelSpec){
 return clamp(spec.salience/(lambda*spec.work)-KNEE,spec.floor,1);
}

/**
 * Solve a separable concave resource-allocation problem:
 *
 *   maximize  sum_i salience_i * log(KNEE + x_i)
 *   subject to sum_i work_i * x_i <= B
 *              floor_i <= x_i <= 1
 *
 * KKT water filling gives x_i = clamp(s_i/(lambda*c_i)-KNEE).  A fixed
 * bisection count makes the solve deterministic and tiny (17 channels x 44).
 */
export function allocatePerceptualBudget(quality:number):PerceptualMarketResult{
 const q=clamp(quality,.56,1);
 if(cachedResult&&q===cachedQuality)return cachedResult;
 const budget=budgetForQuality(q),allocations={} as Record<PerceptualChannelId,number>;
 if(q>=.999999){
  for(const c of PERCEPTUAL_CHANNELS)allocations[c.id]=1;
  cachedQuality=q;return cachedResult={quality:q,budget:MAXIMUM_WORK,spent:MAXIMUM_WORK,minimum:MINIMUM_WORK,maximum:MAXIMUM_WORK,allocations};
 }
 let lo=1e-6,hi=1e6;
 for(let iteration=0;iteration<44;iteration++){
  const lambda=(lo+hi)/2;
  let spent=0;for(const c of PERCEPTUAL_CHANNELS)spent+=c.work*allocationAtLambda(lambda,c);
  if(spent>budget)lo=lambda;else hi=lambda;
 }
 let spent=0;
 for(const c of PERCEPTUAL_CHANNELS){const x=allocationAtLambda(hi,c);allocations[c.id]=x;spent+=c.work*x;}
 cachedQuality=q;return cachedResult={quality:q,budget,spent,minimum:MINIMUM_WORK,maximum:MAXIMUM_WORK,allocations};
}

export function perceptualChannelQuality(quality:number,id:PerceptualChannelId){return allocatePerceptualBudget(quality).allocations[id];}
export function perceptualWorkBounds(){return{minimum:MINIMUM_WORK,maximum:MAXIMUM_WORK};}
