export type SettlementSiteKind='camp'|'village'|'town'|'fort'|'farm'|'monastery'|'ruin';
export type SettlementZoneKind='arrival'|'work'|'storage'|'shelter'|'social'|'water'|'defense'|'yard'|'service';

export interface SettlementVec2{x:number;z:number}
export interface SettlementAnchor{id:string;position:SettlementVec2;kind:'road'|'water'|'resource'|'landmark'|'gate'}
export interface SettlementCharter{
  id:string;
  kind:SettlementSiteKind;
  purpose:string;
  seed:number;
  footprint:{width:number;depth:number};
  functions:readonly SettlementZoneKind[];
  anchors:readonly SettlementAnchor[];
  plannedness:number;
  compactness:number;
  defense:number;
  wealth:number;
}
export interface SettlementZone{id:string;kind:SettlementZoneKind;center:SettlementVec2;radius:number;facing:number;dependsOn:readonly string[]}
export interface SettlementPath{id:string;from:string;to:string;width:number;points:readonly SettlementVec2[]}
export interface SettlementPlacement{id:string;asset:string;position:SettlementVec2;yaw:number;scale:number;story:string;zoneId:string;collision?:{hx:number;hz:number;hy?:number}}
export interface SettlementPlan{
  charter:SettlementCharter;
  zones:readonly SettlementZone[];
  paths:readonly SettlementPath[];
  placements:readonly SettlementPlacement[];
  score:{access:number;storyCoherence:number;deadSpace:number;total:number};
}

function clamp01(v:number){return Math.max(0,Math.min(1,v));}
function hash32(seed:number,text:string){let h=(seed^0x9e3779b9)>>>0;for(let i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),0x85ebca6b)>>>0;h^=h>>>13;}h=Math.imul(h^h>>>16,0xc2b2ae35)>>>0;return (h^h>>>16)>>>0;}
function unit(seed:number,key:string){return hash32(seed,key)/0xffffffff;}
function dist(a:SettlementVec2,b:SettlementVec2){return Math.hypot(a.x-b.x,a.z-b.z);}
function yawToward(a:SettlementVec2,b:SettlementVec2){return Math.atan2(b.x-a.x,b.z-a.z);}
function lerp(a:number,b:number,t:number){return a+(b-a)*t;}
function vecLerp(a:SettlementVec2,b:SettlementVec2,t:number):SettlementVec2{return{x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t)}}

function validateCharter(charter:SettlementCharter){
 if(!charter.id)throw new Error('settlement charter requires id');
 if(!(charter.footprint.width>8&&charter.footprint.depth>8))throw new Error('settlement footprint too small');
 for(const key of ['plannedness','compactness','defense','wealth'] as const)if(charter[key]<0||charter[key]>1)throw new Error(`${key} must be in [0,1]`);
 const ids=new Set<string>();for(const anchor of charter.anchors){if(ids.has(anchor.id))throw new Error(`duplicate anchor ${anchor.id}`);ids.add(anchor.id);}
}

/** SG-0 deterministic compiler core: cells render slices of a plan; they never plan the settlement. */
export class SettlementCompiler{
 constructor(readonly charter:SettlementCharter){validateCharter(charter);}
 jitter(key:string,amplitude:number){return(unit(this.charter.seed,`${this.charter.id}:${key}`)*2-1)*amplitude;}
 stableChoice<T>(key:string,values:readonly T[]):T{if(!values.length)throw new Error('stableChoice requires values');return values[Math.floor(unit(this.charter.seed,`${this.charter.id}:${key}`)*values.length)%values.length]!;}
 zone(id:string,kind:SettlementZoneKind,center:SettlementVec2,radius:number,facing:number,dependsOn:readonly string[]=[]):SettlementZone{return{id,kind,center:{...center},radius,facing,dependsOn:[...dependsOn]};}
 path(id:string,from:SettlementZone,to:SettlementZone,width:number,bend=0):SettlementPath{const mid=vecLerp(from.center,to.center,.5),dx=to.center.x-from.center.x,dz=to.center.z-from.center.z,len=Math.max(1,Math.hypot(dx,dz)),normal={x:-dz/len,z:dx/len};return{id,from:from.id,to:to.id,width,points:[{...from.center},{x:mid.x+normal.x*bend,z:mid.z+normal.z*bend},{...to.center}]};}
 placement(id:string,asset:string,zone:SettlementZone,position:SettlementVec2,story:string,scale=1,yaw=zone.facing,collision?:SettlementPlacement['collision']):SettlementPlacement{return{id,asset,position:{...position},yaw,scale,story,zoneId:zone.id,collision};}
 score(zones:readonly SettlementZone[],paths:readonly SettlementPath[],placements:readonly SettlementPlacement[]){const connected=new Set<string>();for(const p of paths){connected.add(p.from);connected.add(p.to);}const access=zones.length?zones.filter(z=>connected.has(z.id)||z.kind==='arrival').length/zones.length:0;const storyGroups=new Map<string,number>();for(const p of placements)storyGroups.set(p.story,(storyGroups.get(p.story)??0)+1);const storyCoherence=placements.length?Array.from(storyGroups.values()).filter(n=>n>=2).reduce((a,b)=>a+b,0)/placements.length:0;const area=this.charter.footprint.width*this.charter.footprint.depth,occupied=zones.reduce((sum,z)=>sum+Math.PI*z.radius*z.radius,0),deadSpace=clamp01(1-occupied/Math.max(1,area)*1.8),total=.45*access+.4*storyCoherence+.15*(1-deadSpace);return{access,storyCoherence,deadSpace,total};}
 validate(plan:SettlementPlan){const zoneIds=new Set(plan.zones.map(z=>z.id));for(const z of plan.zones)for(const dep of z.dependsOn)if(!zoneIds.has(dep))throw new Error(`${z.id} depends on missing zone ${dep}`);for(const p of plan.paths)if(!zoneIds.has(p.from)||!zoneIds.has(p.to))throw new Error(`path ${p.id} references missing zone`);for(const p of plan.placements)if(!zoneIds.has(p.zoneId))throw new Error(`placement ${p.id} references missing zone`);const arrival=plan.zones.find(z=>z.kind==='arrival');if(!arrival)throw new Error('settlement requires arrival zone');const reachable=new Set<string>([arrival.id]);for(let pass=0;pass<plan.zones.length;pass++)for(const p of plan.paths)if(reachable.has(p.from))reachable.add(p.to);else if(reachable.has(p.to))reachable.add(p.from);for(const z of plan.zones)if(!reachable.has(z.id))throw new Error(`unreachable semantic zone ${z.id}`);for(const a of plan.placements)for(const b of plan.placements){if(a.id>=b.id)continue;if(dist(a.position,b.position)<.35)throw new Error(`overlapping placements ${a.id} / ${b.id}`);}return plan;}
}

export function placementsWithin(plan:SettlementPlan,minX:number,maxX:number,minZ:number,maxZ:number){return plan.placements.filter(p=>p.position.x>=minX&&p.position.x<maxX&&p.position.z>=minZ&&p.position.z<maxZ);}
export function pathsWithin(plan:SettlementPlan,minX:number,maxX:number,minZ:number,maxZ:number){return plan.paths.filter(path=>path.points.some(p=>p.x>=minX&&p.x<maxX&&p.z>=minZ&&p.z<maxZ));}
export function faceToward(position:SettlementVec2,target:SettlementVec2){return yawToward(position,target);}
