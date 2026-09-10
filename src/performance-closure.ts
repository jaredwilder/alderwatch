import type {GrassRingSpec} from './observer-grass-clipmap';

const clamp01=(value:number)=>Math.max(0,Math.min(1,value));
const fract=(value:number)=>value-Math.floor(value);
const smoothstep=(a:number,b:number,x:number)=>{if(b<=a)return x>=b?1:0;const t=clamp01((x-a)/(b-a));return t*t*(3-2*t);};

/**
 * Quantize quality upward, never downward. Runtime compaction may omit an
 * instance only when this conservative ceiling proves that the existing shader
 * would discard it for every possible quality value in the bucket.
 */
export function conservativeQualityCeiling(quality:number,steps=16){
 const q=clamp01(Number.isFinite(quality)?quality:1);
 if(q>=.999)return 1;
 return Math.min(1,Math.ceil(q*Math.max(1,steps))/Math.max(1,steps)+.02);
}

/** Exact Lp observer metric used by the grass shader. */
export function observerMetric2d(dx:number,dz:number,power=2){
 const p=Math.max(2,power);return Math.pow(Math.pow(Math.abs(dx),p)+Math.pow(Math.abs(dz),p),1/p);
}

/**
 * CPU copy of the per-instance low-discrepancy rank used by observer grass.
 * A generous safety margin is applied by shouldSubmitObserverGrass(), so tiny
 * JS/GLSL floating-point differences cannot remove a potentially visible tuft.
 */
export function observerGrassRank(x:number,z:number,spec:GrassRingSpec){
 const cx=Math.floor(x*2.713+(spec.seed%997)),cz=Math.floor(z*2.713+(spec.seed%619));
 return fract(cx*.754877666+cz*.569840296+(spec.seed%997)/997);
}

/**
 * Upper bound on shader visibility while the observer can move by at most
 * motionMargin metres before the next compaction. The product deliberately
 * overestimates visibility: false positives cost performance, false negatives
 * could cost image quality, so the implementation always chooses the former.
 */
export function conservativeObserverVisibilityCeiling(distance:number,quality:number,spec:GrassRingSpec,motionMargin:number){
 const margin=Math.max(0,motionMargin),dMin=Math.max(0,distance-margin),dMax=distance+margin;
 const inner=spec.fadeFull<=spec.fadeIn?1:smoothstep(spec.fadeIn,spec.fadeFull,dMax);
 const outer=1-smoothstep(spec.fadeStart,spec.fadeOut,dMin);
 return clamp01(inner*outer*conservativeQualityCeiling(quality));
}

/**
 * Returns false only for an instance that the existing fragment shader is
 * guaranteed to discard throughout the next compaction interval. The .025 rank
 * guard is intentionally much larger than expected JS/GLSL arithmetic drift.
 */
export function shouldSubmitObserverGrass(rank:number,distance:number,quality:number,spec:GrassRingSpec,motionMargin:number){
 const ceiling=conservativeObserverVisibilityCeiling(distance,quality,spec,motionMargin);
 return rank<=Math.min(1,ceiling+.025);
}

/** A zero-scale matrix can never contribute a rasterized primitive. */
export function matrixSlotHasArea(array:ArrayLike<number>,offset=0){
 let energy=0;for(let column=0;column<3;column++)for(let row=0;row<3;row++){const value=Number(array[offset+column*4+row]??0);energy+=value*value;}
 return energy>1e-12;
}

export function countActiveMatrixSlots(array:ArrayLike<number>,capacity=Math.floor(array.length/16)){
 let active=0;for(let i=0;i<capacity;i++)if(matrixSlotHasArea(array,i*16))active++;return active;
}
