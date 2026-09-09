import {observerMetric} from './observer-grass-clipmap';

export type CanopyBandId='crown'|'mass';
export interface CanopyBandSpec{
 id:CanopyBandId;
 cell:number;
 size:number;
 triangles:number;
 density:number;
 scale:number;
 seed:number;
 fadeIn:number;
 fadeFull:number;
 fadeStart:number;
 fadeOut:number;
 metricPower:number;
}
export interface HorizonGridOrigin{x:number;z:number}
export interface HorizonGridCell{gx:number;gz:number;slot:number}

export const REFERENCE_CANOPY_HEIGHT=7.2;
export const CANOPY_FULL_TO_PROXY_ANGLE=.052;
export const CANOPY_PROXY_TO_MASS_ANGLE=.022;
export const CANOPY_MASS_CUTOFF_ANGLE=.0125;

/** Exact angular diameter, used as the LOD error variable instead of raw distance. */
export function angularDiameter(size:number,distance:number){return 2*Math.atan(Math.max(0,size)/(2*Math.max(.001,distance)));}
export function distanceForAngularDiameter(size:number,angle:number){return Math.max(0,size)/(2*Math.tan(Math.max(.00001,angle)/2));}
export function canopyRepresentation(distance:number,size=REFERENCE_CANOPY_HEIGHT):'full'|'crown'|'mass'|'none'{
 const a=angularDiameter(size,distance);if(a>=CANOPY_FULL_TO_PROXY_ANGLE)return'full';if(a>=CANOPY_PROXY_TO_MASS_ANGLE)return'crown';if(a>=CANOPY_MASS_CUTOFF_ANGLE)return'mass';return'none';
}

/**
 * Two observer-centred forest representations derived from angular-error bands.
 * Crown proxies carry recognizable tree silhouette; mass proxies carry only the
 * forest-frequency signal once individual branch geometry is beneath perception.
 */
export const HORIZON_CANOPY_FIELDS=[
 {id:'crown',cell:10.2,size:72,triangles:32,density:.82,scale:.96,seed:0x4d72ab,fadeIn:118,fadeFull:145,fadeStart:295,fadeOut:345,metricPower:4},
 {id:'mass',cell:18.2,size:64,triangles:12,density:.88,scale:1.18,seed:0x1bf953,fadeIn:285,fadeFull:330,fadeStart:520,fadeOut:565,metricPower:4},
] as const satisfies readonly CanopyBandSpec[];

export function horizonHash(x:number,z:number,salt=0){
 let h=(Math.imul((x|0)^(salt|0),0x45d9f3b)^Math.imul((z|0)+Math.imul(salt|0,0x9e3779b1),0x27d4eb2d))|0;
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return(h>>>0)/4294967296;
}
const mod=(n:number,m:number)=>((n%m)+m)%m;
export function horizonSlotForCell(gx:number,gz:number,size:number){return mod(gx,size)+mod(gz,size)*size;}
export function horizonFieldOrigin(x:number,z:number,spec:CanopyBandSpec):HorizonGridOrigin{const half=Math.floor(spec.size/2);return{x:Math.floor(x/spec.cell)-half,z:Math.floor(z/spec.cell)-half};}
export function fullHorizonCells(origin:HorizonGridOrigin,size:number){const out:HorizonGridCell[]=[];for(let gz=origin.z;gz<origin.z+size;gz++)for(let gx=origin.x;gx<origin.x+size;gx++)out.push({gx,gz,slot:horizonSlotForCell(gx,gz,size)});return out;}
export function enteringHorizonCells(previous:HorizonGridOrigin|undefined,next:HorizonGridOrigin,size:number){
 if(!previous)return fullHorizonCells(next,size);const dx=next.x-previous.x,dz=next.z-previous.z;if(dx===0&&dz===0)return[];if(Math.abs(dx)>=size||Math.abs(dz)>=size)return fullHorizonCells(next,size);
 const out:HorizonGridCell[]=[],seen=new Set<number>(),push=(gx:number,gz:number)=>{const slot=horizonSlotForCell(gx,gz,size);if(seen.has(slot))return;seen.add(slot);out.push({gx,gz,slot});};
 if(dx>0)for(let gx=previous.x+size;gx<next.x+size;gx++)for(let gz=next.z;gz<next.z+size;gz++)push(gx,gz);else if(dx<0)for(let gx=next.x;gx<previous.x;gx++)for(let gz=next.z;gz<next.z+size;gz++)push(gx,gz);
 if(dz>0)for(let gz=previous.z+size;gz<next.z+size;gz++)for(let gx=next.x;gx<next.x+size;gx++)push(gx,gz);else if(dz<0)for(let gz=next.z;gz<previous.z;gz++)for(let gx=next.x;gx<next.x+size;gx++)push(gx,gz);return out;
}
export function horizonCanopyBudget(fields:readonly CanopyBandSpec[]=HORIZON_CANOPY_FIELDS){return fields.reduce((a,f)=>({slots:a.slots+f.size*f.size,maxTriangles:a.maxTriangles+f.size*f.size*f.triangles,drawCalls:a.drawCalls+1}),{slots:0,maxTriangles:0,drawCalls:0});}
export function canopyMetric(dx:number,dz:number,spec:CanopyBandSpec){return observerMetric(dx,dz,spec.metricPower);}
export function horizonCanopyQuality(quality:number,id:CanopyBandId){const q=Math.max(.56,Math.min(1,quality));return id==='crown'?.42+.58*q:.10+.90*Math.pow(q,2.5);}
