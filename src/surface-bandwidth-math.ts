export interface SurfaceBandwidthWeights {
 coarse:number;
 micro:number;
 nano:number;
}

function smoothstep(a:number,b:number,x:number){
 if(b<=a)return x>=b?1:0;
 const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
 return t*t*(3-2*t);
}

/**
 * Screen-space bandwidth gate for supplemental material octaves.
 *
 * uvFootprint is the maximum per-pixel UV derivative magnitude before the
 * material's base-frequency multiplier. Higher-frequency octaves disappear
 * first as the projected texel footprint grows, mirroring a Nyquist-style
 * filtering policy instead of using a hand-wavy distance-only LOD.
 */
export function surfaceBandwidthWeights(uvFootprint:number,baseScale=1):SurfaceBandwidthWeights{
 const f=Math.max(0,uvFootprint)*Math.max(.0001,baseScale);
 return{
  coarse:1-smoothstep(.018,.065,f),
  micro:1-smoothstep(.010,.042,f*1.67),
  nano:1-smoothstep(.006,.028,f*2.71),
 };
}

/** Upper bound added by the natural-detail shader when every octave is readable. */
export function supplementalSurfaceSampleBudget(){
 return{color:3,normal:1,roughness:1,total:5};
}
