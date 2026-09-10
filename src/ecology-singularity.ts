import {forestDensity,forestEdge,groundMacro,meadowDensity,noise2} from './ecology';
import {height} from './terrain';
import {perceptualChannelQuality} from './perceptual-resource-market';

const clamp01=(v:number)=>Math.max(0,Math.min(1,v));
const smoothstep=(a:number,b:number,x:number)=>{const t=clamp01((x-a)/(b-a||1));return t*t*(3-2*t);};

export interface EcologyState{
 moisture:number;
 shade:number;
 edge:number;
 fertility:number;
 disturbance:number;
 biomass:number;
 understory:number;
 litter:number;
 moss:number;
 dryness:number;
}

export type EcologyPlantId='fernlet'|'broadleaf'|'sedge'|'dryStalk'|'shrub';
export type EcologySpeciesWeights=Record<EcologyPlantId,number>;

/** Road/trail wear expressed as a continuous [0,1] disturbance field. */
export function roadDisturbance(distance:number){return 1-smoothstep(2.6,7.2,Math.max(0,distance));}

/**
 * One compact latent ecology field feeds ground colour, explicit undergrowth and
 * later representation levels. It is deterministic in world space and remains
 * continuous across camera motion. Disturbance is supplied by the caller so the
 * same field can be reused by non-road areas later.
 */
export function ecologyState(x:number,z:number,disturbance=0):EcologyState{
 const shade=forestDensity(x,z),edge=forestEdge(x,z),meadow=meadowDensity(x,z),macro=groundMacro(x,z),h=height(x,z);
 const wetNoise=noise2(x*.021+21.7,z*.021-14.3)*.58+noise2(x*.061-8.2,z*.061+31.4)*.42;
 const lowland=clamp01((2.3-h)/6.5),exposed=1-shade;
 const moisture=clamp01(.10+.44*wetNoise+.21*shade+.18*lowland-.08*clamp01((h-4)/18));
 const dryness=clamp01((1-moisture)*(.55+.45*exposed)+clamp01((h-3)/15)*.16+(macro-.5)*.10);
 const fertility=clamp01(.20+.31*moisture+.22*meadow+.16*edge+.12*(1-dryness)+.08*macro);
 const d=clamp01(disturbance);
 const understory=clamp01((.28+.32*edge+.22*moisture+.17*shade+.10*fertility)*(1-.82*d));
 const biomass=clamp01((.34+.36*meadow*exposed+.20*edge+.14*moisture+.12*understory+.08*shade)*(1-.72*d));
 const litter=clamp01(.08+.72*shade+.16*(1-biomass)+.12*d);
 const moss=clamp01(moisture*(.22+.78*shade)*(.55+.45*edge)*(1-.48*d));
 return{moisture,shade,edge,fertility,disturbance:d,biomass,understory,litter,moss,dryness};
}

/** Partition of unity over plant niches. The weights always sum to one. */
export function ecologySpeciesWeightsFromState(s:EcologyState):EcologySpeciesWeights{
 const open=1-s.shade;
 const raw:EcologySpeciesWeights={
  fernlet:.025+s.moisture*s.shade*(.80+.50*s.edge),
  broadleaf:.035+s.fertility*(.42+.48*s.edge)*(1-.42*s.dryness),
  sedge:.025+s.moisture*(.52+.48*open)*(.78+.22*s.edge),
  dryStalk:.022+s.dryness*open*(.82+.18*(1-s.edge)),
  shrub:.030+s.edge*.92+s.shade*s.understory*.34,
 };
 const total=Object.values(raw).reduce((a,b)=>a+b,0)||1;
 for(const key of Object.keys(raw) as EcologyPlantId[])raw[key]/=total;
 return raw;
}

export function ecologySpeciesWeights(x:number,z:number,disturbance=0){return ecologySpeciesWeightsFromState(ecologyState(x,z,disturbance));}

export interface EcologyFieldSpec{
 id:EcologyPlantId;
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
}

/**
 * Five fixed-capacity observer fields. The farther the representation, the
 * cheaper and coarser its plant archetype becomes. Shrubs no longer fade *in*
 * with distance: visible plants must not be born under camera motion.
 */
export const ECOLOGY_FIELDS=[
 {id:'fernlet',cell:1.55,size:42,triangles:10,density:2.30,scale:.76,seed:0x62a13f,fadeIn:0,fadeFull:0,fadeStart:22,fadeOut:30},
 {id:'broadleaf',cell:1.85,size:44,triangles:12,density:2.05,scale:.86,seed:0x284bc1,fadeIn:0,fadeFull:0,fadeStart:29,fadeOut:38},
 {id:'sedge',cell:2.25,size:52,triangles:12,density:2.15,scale:1.04,seed:0x7d34a5,fadeIn:4,fadeFull:8,fadeStart:44,fadeOut:55},
 {id:'dryStalk',cell:2.80,size:56,triangles:8,density:1.70,scale:1.18,seed:0x43ea91,fadeIn:10,fadeFull:18,fadeStart:60,fadeOut:74},
 {id:'shrub',cell:3.40,size:60,triangles:12,density:1.38,scale:1.34,seed:0x1a7f6d,fadeIn:0,fadeFull:0,fadeStart:82,fadeOut:100},
] as const satisfies readonly EcologyFieldSpec[];

export interface EcologyGridOrigin{x:number;z:number}
export interface EcologyGridCell{gx:number;gz:number;slot:number}

export function ecologyHash(x:number,z:number,salt=0){
 let h=(Math.imul((x|0)^(salt|0),0x45d9f3b)^Math.imul((z|0)+Math.imul(salt|0,0x9e3779b1),0x27d4eb2d))|0;
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;
 return(h>>>0)/4294967296;
}

const mod=(n:number,m:number)=>((n%m)+m)%m;
export function ecologySlotForCell(gx:number,gz:number,size:number){return mod(gx,size)+mod(gz,size)*size;}
export function ecologyFieldOrigin(observerX:number,observerZ:number,spec:EcologyFieldSpec):EcologyGridOrigin{
 const half=Math.floor(spec.size/2);return{x:Math.floor(observerX/spec.cell)-half,z:Math.floor(observerZ/spec.cell)-half};
}
export function fullEcologyCells(origin:EcologyGridOrigin,size:number){
 const out:EcologyGridCell[]=[];for(let gz=origin.z;gz<origin.z+size;gz++)for(let gx=origin.x;gx<origin.x+size;gx++)out.push({gx,gz,slot:ecologySlotForCell(gx,gz,size)});return out;
}
export function enteringEcologyCells(previous:EcologyGridOrigin|undefined,next:EcologyGridOrigin,size:number){
 if(!previous)return fullEcologyCells(next,size);const dx=next.x-previous.x,dz=next.z-previous.z;if(dx===0&&dz===0)return[];if(Math.abs(dx)>=size||Math.abs(dz)>=size)return fullEcologyCells(next,size);
 const out:EcologyGridCell[]=[],seen=new Set<number>(),push=(gx:number,gz:number)=>{const slot=ecologySlotForCell(gx,gz,size);if(seen.has(slot))return;seen.add(slot);out.push({gx,gz,slot});};
 if(dx>0)for(let gx=previous.x+size;gx<next.x+size;gx++)for(let gz=next.z;gz<next.z+size;gz++)push(gx,gz);
 else if(dx<0)for(let gx=next.x;gx<previous.x;gx++)for(let gz=next.z;gz<next.z+size;gz++)push(gx,gz);
 if(dz>0)for(let gz=previous.z+size;gz<next.z+size;gz++)for(let gx=next.x;gx<next.x+size;gx++)push(gx,gz);
 else if(dz<0)for(let gz=next.z;gz<previous.z;gz++)for(let gx=next.x;gx<next.x+size;gx++)push(gx,gz);
 return out;
}

export function ecologyFieldBudget(fields:readonly EcologyFieldSpec[]=ECOLOGY_FIELDS){
 return fields.reduce((a,f)=>({slots:a.slots+f.size*f.size,maxTriangles:a.maxTriangles+f.size*f.size*f.triangles,drawCalls:a.drawCalls+1}),{slots:0,maxTriangles:0,drawCalls:0});
}

/** Ecological draws now bid against every other graphics representation. */
export function ecologyFieldQuality(quality:number,id:EcologyPlantId){return perceptualChannelQuality(quality,`ecology.${id}`);}

export const ECOLOGY_SURFACE_SAMPLE_CELL=4;
