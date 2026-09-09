import {forestDensity,forestEdge} from './ecology';
import {perceptualChannelQuality} from './perceptual-resource-market';

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
const TAU=Math.PI*2;

/** Stable sub-meter world hash used by natural-object phenotype fields. */
export function forestVisualHash(x:number,z:number,salt=0){
 const xi=Math.round(x*8),zi=Math.round(z*8);
 let h=(Math.imul((xi|0)^(salt|0),0x45d9f3b)^Math.imul((zi|0)+Math.imul(salt|0,0x9e3779b1),0x27d4eb2d))|0;
 h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;
 return(h>>>0)/4294967296;
}

export interface TreePhenotype{
 age:number;
 height:number;
 widthX:number;
 widthZ:number;
 leanX:number;
 leanZ:number;
 yawJitter:number;
 rootFlare:number;
 leafWarmth:number;
}

/**
 * A compact correlated basis for tree individuality. The same authored oak can
 * express age, crown spread, exposure lean and root mass without storing another
 * mesh. Inputs are world coordinates, so identity survives unload/reload.
 */
export function treePhenotype(x:number,z:number):TreePhenotype{
 const woods=forestDensity(x,z),edge=forestEdge(x,z),exposure=clamp(1-woods*.78+edge*.16,0,1);
 const age=.18+.82*forestVisualHash(x,z,101),wide=.88+age*.18+woods*.08,anis=(forestVisualHash(x,z,103)-.5)*.14;
 const height=clamp(.88+age*.21+woods*.07+(forestVisualHash(x,z,107)-.5)*.07,.84,1.19);
 const widthX=clamp(wide*(1+anis),.82,1.22),widthZ=clamp(wide*(1-anis),.82,1.22);
 const leanMax=.018+.052*exposure,leanAngle=forestVisualHash(x,z,109)*TAU,leanMagnitude=leanMax*(.25+.75*forestVisualHash(x,z,113));
 return{
  age,
  height,
  widthX,
  widthZ,
  leanX:Math.sin(leanAngle)*leanMagnitude,
  leanZ:Math.cos(leanAngle)*leanMagnitude,
  yawJitter:(forestVisualHash(x,z,127)-.5)*.28,
  rootFlare:clamp(.86+age*.46+woods*.12,.86,1.42),
  leafWarmth:(forestVisualHash(x,z,131)-.5)*.18,
 };
}

export interface RockPhenotype{x:number;y:number;z:number;tiltX:number;tiltZ:number;yawJitter:number}

/** Volume-near-preserving deterministic rock deformation for silhouette diversity. */
export function rockPhenotype(x:number,z:number):RockPhenotype{
 const sx=.86+.30*forestVisualHash(x,z,211),sz=.86+.30*forestVisualHash(x,z,223),sy=clamp(1/Math.sqrt(sx*sz),.82,1.18);
 return{
  x:sx,y:sy,z:sz,
  tiltX:(forestVisualHash(x,z,227)-.5)*.18,
  tiltZ:(forestVisualHash(x,z,229)-.5)*.18,
  yawJitter:(forestVisualHash(x,z,233)-.5)*.52,
 };
}

export const FOREST_CONTACT_CAPACITY=96;
export const FOREST_CONTACT_SEGMENTS=20;
export function forestContactBudget(){return{capacity:FOREST_CONTACT_CAPACITY,segments:FOREST_CONTACT_SEGMENTS,maxTriangles:FOREST_CONTACT_CAPACITY*FOREST_CONTACT_SEGMENTS,drawCalls:1};}

export type ObserverRingId='hero'|'near'|'mid'|'far'|'horizon'|'vista';

/**
 * Stable frame-budget controller. Over-budget detail sheds quickly; recovery is
 * intentionally much slower so the image does not pump between quality tiers.
 * Its scalar is now the wallet size for the global perceptual resource market.
 */
export class PerceptualGovernor{
 private emaMs:number;
 quality=1;
 constructor(public readonly targetMs=16.67){this.emaMs=targetMs;}
 sample(frameMs:number){
  if(!Number.isFinite(frameMs)||frameMs<5||frameMs>80)return this.quality;
  this.emaMs=this.emaMs*.90+frameMs*.10;
  const high=this.targetMs+1.1,low=this.targetMs-1.3;
  if(this.emaMs>high){
   const severity=clamp((this.emaMs-high)/10,0,1);
   this.quality=Math.max(.56,this.quality-(.008+.035*severity));
  }else if(this.emaMs<low){
   const headroom=clamp((low-this.emaMs)/8,0,1);
   this.quality=Math.min(1,this.quality+.0025+.0045*headroom);
  }
  return this.quality;
 }
 get smoothedFrameMs(){return this.emaMs;}
}

/** Grass competes with every other graphics channel for one shared frame wallet. */
export function observerRingQuality(quality:number,ring:ObserverRingId){return perceptualChannelQuality(quality,`grass.${ring}`);}
