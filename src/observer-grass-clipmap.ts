export interface GrassRingSpec {
 id:string;
 cell:number;
 size:number;
 blades:number;
 tuftRadius:number;
 minHeight:number;
 maxHeight:number;
 density:number;
 seed:number;
 fadeIn:number;
 fadeFull:number;
 fadeStart:number;
 fadeOut:number;
}

export interface GridOrigin {x:number;z:number}
export interface ClipCell {gx:number;gz:number;slot:number}

/**
 * Fixed-capacity observer rings. The new mid/far bands remove the visible
 * savannah boundary without reintroducing world-sized vegetation allocation.
 */
export const OBSERVER_GRASS_RINGS=[
 {id:'hero',cell:.72,size:48,blades:20,tuftRadius:.48,minHeight:.34,maxHeight:.72,density:1,seed:0x51f15e,fadeIn:0,fadeFull:0,fadeStart:11,fadeOut:16.5},
 {id:'near',cell:1.35,size:56,blades:8,tuftRadius:.82,minHeight:.30,maxHeight:.64,density:.88,seed:0x7a2d91,fadeIn:10,fadeFull:16,fadeStart:28,fadeOut:36.5},
 {id:'mid',cell:2.10,size:72,blades:6,tuftRadius:1.12,minHeight:.28,maxHeight:.60,density:.94,seed:0x3b7a11,fadeIn:27,fadeFull:36,fadeStart:61,fadeOut:74},
 {id:'far',cell:3.20,size:88,blades:3,tuftRadius:1.62,minHeight:.24,maxHeight:.54,density:.98,seed:0x19c4d3,fadeIn:59,fadeFull:72,fadeStart:118,fadeOut:138},
] as const satisfies readonly GrassRingSpec[];

export function observerHash(x:number,z:number,salt=0){
 let h=(Math.imul((x|0)^(salt|0),0x45d9f3b)^Math.imul((z|0)+Math.imul(salt|0,0x9e3779b1),0x27d4eb2d))|0;
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;
 return(h>>>0)/4294967296;
}

function mod(n:number,m:number){return((n%m)+m)%m;}
function smoothstep(a:number,b:number,x:number){if(b<=a)return x>=b?1:0;const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}

/** Stable toroidal slot: a world cell returns to the same slot modulo ring extent. */
export function slotForCell(gx:number,gz:number,size:number){return mod(gx,size)+mod(gz,size)*size;}

export function clipmapOrigin(observerX:number,observerZ:number,spec:GrassRingSpec):GridOrigin{
 const cx=Math.floor(observerX/spec.cell),cz=Math.floor(observerZ/spec.cell),half=Math.floor(spec.size/2);
 return{x:cx-half,z:cz-half};
}

export function fullClipmapCells(origin:GridOrigin,size:number){
 const out:ClipCell[]=[];
 for(let gz=origin.z;gz<origin.z+size;gz++)for(let gx=origin.x;gx<origin.x+size;gx++)out.push({gx,gz,slot:slotForCell(gx,gz,size)});
 return out;
}

/**
 * Return only newly exposed cells after a toroidal shift. A one-cell horizontal
 * move writes N matrices instead of N²; a one-cell diagonal move writes 2N-1.
 */
export function enteringClipmapCells(previous:GridOrigin|undefined,next:GridOrigin,size:number){
 if(!previous)return fullClipmapCells(next,size);
 const dx=next.x-previous.x,dz=next.z-previous.z;
 if(dx===0&&dz===0)return[];
 if(Math.abs(dx)>=size||Math.abs(dz)>=size)return fullClipmapCells(next,size);
 const out:ClipCell[]=[],seen=new Set<number>();
 const push=(gx:number,gz:number)=>{const slot=slotForCell(gx,gz,size);if(seen.has(slot))return;seen.add(slot);out.push({gx,gz,slot});};
 if(dx>0)for(let gx=previous.x+size;gx<next.x+size;gx++)for(let gz=next.z;gz<next.z+size;gz++)push(gx,gz);
 else if(dx<0)for(let gx=next.x;gx<previous.x;gx++)for(let gz=next.z;gz<next.z+size;gz++)push(gx,gz);
 if(dz>0)for(let gz=previous.z+size;gz<next.z+size;gz++)for(let gx=next.x;gx<next.x+size;gx++)push(gx,gz);
 else if(dz<0)for(let gz=next.z;gz<previous.z;gz++)for(let gx=next.x;gx<next.x+size;gx++)push(gx,gz);
 return out;
}

/** Stable radial visibility used by the shader and Court to overlap bands without a hard ring. */
export function observerRingVisibility(distance:number,spec:GrassRingSpec){
 const d=Math.max(0,distance),inside=spec.fadeFull<=spec.fadeIn?1:smoothstep(spec.fadeIn,spec.fadeFull,d),outside=1-smoothstep(spec.fadeStart,spec.fadeOut,d);
 return Math.max(0,Math.min(1,inside*outside));
}

export function combinedObserverCoverage(distance:number,rings:readonly GrassRingSpec[]=OBSERVER_GRASS_RINGS){
 return Math.min(1,rings.reduce((sum,spec)=>sum+observerRingVisibility(distance,spec)*spec.density,0));
}

/** Four ribbon triangles per blade; still no world-area term exists in this budget. */
export function clipmapBudget(rings:readonly GrassRingSpec[]=OBSERVER_GRASS_RINGS){
 return rings.reduce((a,r)=>({
  slots:a.slots+r.size*r.size,
  maxTriangles:a.maxTriangles+r.size*r.size*r.blades*4,
  drawCalls:a.drawCalls+1,
 }),{slots:0,maxTriangles:0,drawCalls:0});
}
