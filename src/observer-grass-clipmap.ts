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
}

export interface GridOrigin {x:number;z:number}
export interface ClipCell {gx:number;gz:number;slot:number}

/**
 * Two fixed-capacity observer rings. Apparent world size can grow without changing
 * their resident instance count. The hero ring carries dense, short-range biomass;
 * the near ring carries cheaper silhouette continuity out to roughly 38 m per axis.
 */
export const OBSERVER_GRASS_RINGS=[
 {id:'hero',cell:.72,size:48,blades:20,tuftRadius:.48,minHeight:.34,maxHeight:.72,density:1,seed:0x51f15e},
 {id:'near',cell:1.35,size:56,blades:8,tuftRadius:.82,minHeight:.30,maxHeight:.64,density:.82,seed:0x7a2d91},
] as const satisfies readonly GrassRingSpec[];

export function observerHash(x:number,z:number,salt=0){
 let h=(Math.imul((x|0)^(salt|0),0x45d9f3b)^Math.imul((z|0)+Math.imul(salt|0,0x9e3779b1),0x27d4eb2d))|0;
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;
 return(h>>>0)/4294967296;
}

function mod(n:number,m:number){return((n%m)+m)%m;}

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

/** Four ribbon triangles per blade; no world-area term exists in this budget. */
export function clipmapBudget(rings:readonly GrassRingSpec[]=OBSERVER_GRASS_RINGS){
 return rings.reduce((a,r)=>({
  slots:a.slots+r.size*r.size,
  maxTriangles:a.maxTriangles+r.size*r.size*r.blades*4,
  drawCalls:a.drawCalls+1,
 }),{slots:0,maxTriangles:0,drawCalls:0});
}
