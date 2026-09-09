export type DetailTier='hero'|'near'|'mid'|'far';

/**
 * Deterministic scalar hash for world-space detail decisions.
 * The function is deliberately integer-only before the final normalization so
 * world features rebuild identically instead of swimming with the camera.
 */
export function detailHash(x:number,z:number,seed=0x51f15e){
 let h=(Math.imul(x|0,0x1f123bb5)^Math.imul(z|0,0x5f356495)^seed)|0;
 h=Math.imul(h^(h>>>16),0x45d9f3b);h=Math.imul(h^(h>>>16),0x45d9f3b);h^=h>>>16;
 return(h>>>0)/4294967296;
}

/** Nested sampling contract: every coarser set is literally a subset of the next. */
export function nestedDetailLevel(rank:number){
 if(rank<.18)return 0;
 if(rank<.44)return 1;
 if(rank<.72)return 2;
 return 3;
}

/**
 * Screen-space importance used by the detail-field research path.  It is kept
 * pure so the renderer can later move the same policy to a worker/WebGPU pass.
 */
export function perceptualDetailTier(distance:number,projectedPixels:number):DetailTier{
 const d=Math.max(0,distance),p=Math.max(0,projectedPixels);
 if(d<14||p>180)return'hero';
 if(d<34||p>72)return'near';
 if(d<72||p>20)return'mid';
 return'far';
}

export function detailDensityMultiplier(tier:DetailTier){
 return tier==='hero'?1:tier==='near'?.58:tier==='mid'?.24:.06;
}
