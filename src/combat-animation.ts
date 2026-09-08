import * as T from 'three';

const UPPER=/^(spine_|clavicle_|upperarm_|lowerarm_|hand_|index_|middle_|ring_|pinky_|thumb_)/;
export const upperBodyTrack=(name:string)=>UPPER.test(name);
export const meleeBodyTrack=(name:string)=>name.startsWith('pelvis.')||UPPER.test(name);

const rotationGain=(name:string)=>name.startsWith('pelvis.quaternion')?1.55:name.startsWith('spine_01.quaternion')?1.38:name.startsWith('spine_02.quaternion')?1.22:name.startsWith('spine_03.quaternion')?1.10:1;

type Drive={pitch:number;yaw:number;roll:number};
const ZERO:Drive={pitch:0,yaw:0,roll:0};
function driveFor(clip:string,bone:string):Drive{
 if(clip==='attack')return bone==='pelvis'?{pitch:.025,yaw:.20,roll:-.025}:bone==='spine_01'?{pitch:.02,yaw:.15,roll:-.035}:bone==='spine_02'?{pitch:0,yaw:.09,roll:-.02}:ZERO;
 if(clip==='chop')return bone==='pelvis'?{pitch:.04,yaw:.25,roll:.035}:bone==='spine_01'?{pitch:.035,yaw:.19,roll:.045}:bone==='spine_02'?{pitch:.02,yaw:.11,roll:.025}:ZERO;
 if(clip==='mine')return bone==='pelvis'?{pitch:.20,yaw:.065,roll:0}:bone==='spine_01'?{pitch:.16,yaw:.05,roll:0}:bone==='spine_02'?{pitch:.09,yaw:.025,roll:0}:ZERO;
 if(clip==='heavy')return bone==='pelvis'?{pitch:.14,yaw:.15,roll:0}:bone==='spine_01'?{pitch:.11,yaw:.12,roll:0}:bone==='spine_02'?{pitch:.065,yaw:.07,roll:0}:ZERO;
 return ZERO;
}
function smooth01(x:number){x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);}
function driveWeight(t:number,impact:number,duration:number){
 const load=Math.max(.04,impact*.55);if(t<=load)return-smooth01(t/load);if(t<=impact)return-1+2*smooth01((t-load)/Math.max(.001,impact-load));return 1-smooth01((t-impact)/Math.max(.001,duration-impact));
}

function amplifyRotation(track:T.KeyframeTrack){
 const gain=rotationGain(track.name),out=track.clone();if(gain===1||!track.name.endsWith('.quaternion'))return out;
 const v=out.values,base=new T.Quaternion().fromArray(v,0).normalize(),baseInv=base.clone().invert(),q=new T.Quaternion(),delta=new T.Quaternion(),scaled=new T.Quaternion(),axis=new T.Vector3();
 for(let i=0;i<v.length;i+=4){
  q.fromArray(v,i).normalize();if(base.dot(q)<0)q.set(-q.x,-q.y,-q.z,-q.w);
  delta.copy(baseInv).multiply(q).normalize();if(delta.w<0)delta.set(-delta.x,-delta.y,-delta.z,-delta.w);
  const w=T.MathUtils.clamp(delta.w,-1,1),angle=2*Math.acos(w),s=Math.sqrt(Math.max(0,1-w*w));
  if(angle>1e-6&&s>1e-6){axis.set(delta.x/s,delta.y/s,delta.z/s).normalize();scaled.setFromAxisAngle(axis,Math.min(Math.PI*.92,angle*gain));q.copy(base).multiply(scaled).normalize();}
  q.toArray(v,i);
 }
 return out;
}

function addBodyDrive(track:T.KeyframeTrack,clip:string,impact:number,duration:number){
 if(!track.name.endsWith('.quaternion'))return track;const bone=track.name.slice(0,-'.quaternion'.length),drive=driveFor(clip,bone);if(!drive.pitch&&!drive.yaw&&!drive.roll)return track;
 const v=track.values,q=new T.Quaternion(),extra=new T.Quaternion(),euler=new T.Euler();for(let i=0;i<track.times.length;i++){const w=driveWeight(track.times[i],impact,duration);euler.set(drive.pitch*w,drive.yaw*w,drive.roll*w,'YXZ');extra.setFromEuler(euler);q.fromArray(v,i*4).multiply(extra).normalize().toArray(v,i*4);}return track;
}

function retime(track:T.KeyframeTrack,clip:string,sourceImpact:number,targetImpact:number,targetDuration:number,sourceDuration:number){
 const out=amplifyRotation(track),times=out.times;
 const beforeScale=sourceImpact>1e-6?targetImpact/sourceImpact:1,sourceTail=Math.max(1e-6,sourceDuration-sourceImpact),targetTail=Math.max(0,targetDuration-targetImpact);
 for(let i=0;i<times.length;i++){const t=times[i];times[i]=t<=sourceImpact?t*beforeScale:targetImpact+(t-sourceImpact)*(targetTail/sourceTail);}
 return addBodyDrive(out,clip,targetImpact,targetDuration);
}

/** Preserve authored contact while compressing dead recovery and adding the missing kinetic chain. */
export function combatClip(source:T.AnimationClip,name:string,sourceImpact:number,targetImpact:number,targetDuration:number){
 return new T.AnimationClip(name,targetDuration,source.tracks.map(t=>retime(t,name,sourceImpact,targetImpact,targetDuration,source.duration)));
}
