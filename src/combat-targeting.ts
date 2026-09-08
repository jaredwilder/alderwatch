import type {Vec3} from './state';

export interface TargetLike {id:string;position:Vec3}

const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function horizontalMetrics(origin:Vec3,yaw:number,target:Vec3){
 const dx=target[0]-origin[0],dz=target[2]-origin[2],distance=Math.hypot(dx,dz);if(distance<1e-5)return {distance:0,dot:1,angle:0};
 const dot=clamp((Math.sin(yaw)*dx+Math.cos(yaw)*dz)/distance,-1,1);return {distance,dot,angle:Math.acos(dot)};
}
export function softTargetScore(origin:Vec3,yaw:number,target:Vec3,maxRange:number,minimumDot:number){
 const m=horizontalMetrics(origin,yaw,target);if(m.distance>maxRange||m.dot<minimumDot)return Infinity;
 // Angle matters more than a tiny distance advantage. This keeps attacks on what the player is actually aiming at.
 return m.distance/Math.max(.1,maxRange)*.7+m.angle/Math.PI*2.3;
}
export function selectSoftTarget<T extends TargetLike>(origin:Vec3,yaw:number,candidates:T[],maxRange:number,minimumDot:number){
 return candidates.map(target=>({target,score:softTargetScore(origin,yaw,target.position,maxRange,minimumDot)})).filter(x=>Number.isFinite(x.score)).sort((a,b)=>a.score-b.score||a.target.id.localeCompare(b.target.id))[0]?.target;
}
export function attackWarpVelocity(origin:Vec3,yaw:number,target:Vec3,reach:number,age:number,impact:number,heavy=false):Vec3{
 const window=heavy?.30:.24,start=Math.max(0,impact-window),end=Math.max(start,impact-.035);if(age<start||age>end)return [0,0,0];
 const m=horizontalMetrics(origin,yaw,target),maxExtra=.34;if(m.distance<=reach-.02||m.distance>reach+maxExtra||m.dot<.68)return [0,0,0];
 const dx=target[0]-origin[0],dz=target[2]-origin[2],gap=m.distance-(reach-.02),remaining=Math.max(.05,impact-age),speed=Math.min(heavy?1.35:1.6,gap/remaining*.92);return [dx/m.distance*speed,0,dz/m.distance*speed];
}
