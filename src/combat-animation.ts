import * as T from 'three';

// A committed melee strike owns the entire kinetic chain above the hips, including neck/head.
// Asset pipelines do not guarantee literal `head` / `neck_01` names, so detect those semantic bones
// case-insensitively instead of silently dropping the top of the kinetic chain.
const CORE_UPPER=/^(spine_|clavicle_|upperarm_|lowerarm_|hand_|index_|middle_|ring_|pinky_|thumb_)/;
const HEAD_NECK=/head|neck/i;
export const upperBodyTrack=(name:string)=>CORE_UPPER.test(name)||HEAD_NECK.test(name);
/** Moving melee owns hip rotation and the upper-body strike, while gait keeps pelvis translation/bob and the legs. */
export const meleeBodyTrack=(name:string)=>name==='pelvis.quaternion'||upperBodyTrack(name);

const rotationGain=(name:string)=>name.startsWith('pelvis.quaternion')?1.55:name.startsWith('spine_01.quaternion')?1.38:name.startsWith('spine_02.quaternion')?1.22:name.startsWith('spine_03.quaternion')?1.10:1;
type Drive={pitch:number;yaw:number;roll:number};
const ZERO:Drive={pitch:0,yaw:0,roll:0};
function driveFor(clip:string,bone:string):Drive{
 const b=bone.toLowerCase(),neck=b.includes('neck'),head=b.includes('head');
 // Lateral cuts get a small head/neck tuck into contact. This is deliberately downstream of the arms,
 // so it adds intent/weight without moving the gameplay-authoritative weapon contact pose.
 if(clip==='attack')return bone==='pelvis'?{pitch:.025,yaw:.20,roll:-.025}:bone==='spine_01'?{pitch:.02,yaw:.15,roll:-.035}:bone==='spine_02'?{pitch:0,yaw:.09,roll:-.02}:neck?{pitch:.095,yaw:0,roll:0}:head?{pitch:.045,yaw:0,roll:0}:ZERO;
 // The authored axe cut already has a downward component. Keep its lateral torque and a visible head tuck,
 // but do not stack another strong forward pitch on top of the source pose.
 if(clip==='chop')return bone==='pelvis'?{pitch:.018,yaw:.25,roll:.035}:bone==='spine_01'?{pitch:.012,yaw:.19,roll:.045}:bone==='spine_02'?{pitch:.004,yaw:.11,roll:.025}:neck?{pitch:.08,yaw:0,roll:0}:head?{pitch:.035,yaw:0,roll:0}:ZERO;
 if(clip==='mine')return bone==='pelvis'?{pitch:.20,yaw:.065,roll:0}:bone==='spine_01'?{pitch:.16,yaw:.05,roll:0}:bone==='spine_02'?{pitch:.09,yaw:.025,roll:0}:ZERO;
 if(clip==='heavy')return bone==='pelvis'?{pitch:.14,yaw:.15,roll:0}:bone==='spine_01'?{pitch:.11,yaw:.12,roll:0}:bone==='spine_02'?{pitch:.065,yaw:.07,roll:0}:ZERO;
 return ZERO;
}
function smooth01(x:number){x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);}
/**
 * Load the body against the strike, return to the authored pose exactly at contact,
 * then carry momentum through a smaller follow-through before settling. Keeping
 * weight=0 at impact is important for pelvis/spine: weapon contact is gameplay-authoritative.
 */
function driveWeight(t:number,impact:number,duration:number){
 const load=Math.max(.04,impact*.55),follow=impact+(duration-impact)*.42;
 if(t<=load)return-smooth01(t/load);
 if(t<=impact)return-1+smooth01((t-load)/Math.max(.001,impact-load));
 if(t<=follow)return .72*smooth01((t-impact)/Math.max(.001,follow-impact));
 return .72*(1-smooth01((t-follow)/Math.max(.001,duration-follow)));
}
/** Neck/head dip *into* the hit instead of returning upright at contact. */
function headDriveWeight(t:number,impact:number,duration:number){
 const begin=Math.max(.02,impact*.38),release=impact+(duration-impact)*.58;
 if(t<=begin)return 0;
 if(t<=impact)return smooth01((t-begin)/Math.max(.001,impact-begin));
 return 1-smooth01((t-impact)/Math.max(.001,release-impact));
}

function amplifyRotation(track:T.KeyframeTrack){
 const gain=rotationGain(track.name),out=track.clone();if(gain===1||!track.name.endsWith('.quaternion'))return out;
 const v=out.values,base=new T.Quaternion().fromArray(v,0).normalize(),baseInv=base.clone().invert(),q=new T.Quaternion(),delta=new T.Quaternion(),scaled=new T.Quaternion(),axis=new T.Vector3();
 for(let i=0;i<v.length;i+=4){q.fromArray(v,i).normalize();if(base.dot(q)<0)q.set(-q.x,-q.y,-q.z,-q.w);delta.copy(baseInv).multiply(q).normalize();if(delta.w<0)delta.set(-delta.x,-delta.y,-delta.z,-delta.w);const w=T.MathUtils.clamp(delta.w,-1,1),angle=2*Math.acos(w),s=Math.sqrt(Math.max(0,1-w*w));if(angle>1e-6&&s>1e-6){axis.set(delta.x/s,delta.y/s,delta.z/s).normalize();scaled.setFromAxisAngle(axis,Math.min(Math.PI*.92,angle*gain));q.copy(base).multiply(scaled).normalize();}q.toArray(v,i);}
 return out;
}

/**
 * Some imported melee tracks are STEP samplers. Preserve their exact gameplay
 * contact pose as a protected key, then slerp between keys so the visible body
 * no longer snaps frame-to-frame like stop motion.
 */
function smoothDiscreteQuaternion(track:T.KeyframeTrack,impact:number){
 if(!track.name.endsWith('.quaternion')||track.getInterpolation()!==T.InterpolateDiscrete)return track;
 const oldTimes=Array.from(track.times),oldValues=track.values,times=[...oldTimes],values:number[]=[];
 let exact=oldTimes.findIndex(t=>Math.abs(t-impact)<1e-5),sampleIndex=0;
 if(exact<0){for(let i=0;i<oldTimes.length;i++){if(oldTimes[i]<=impact)sampleIndex=i;else break;}times.push(impact);times.sort((a,b)=>a-b);}
 for(const t of times){let i=oldTimes.findIndex(k=>Math.abs(k-t)<1e-5);if(i<0)i=sampleIndex;const q=new T.Quaternion().fromArray(oldValues,i*4).normalize();values.push(q.x,q.y,q.z,q.w);}
 return new T.QuaternionKeyframeTrack(track.name,times,values,T.InterpolateLinear);
}

/** Sample a quaternion key track with normalized slerp so injected body keys stay smooth and type-safe. */
function sampleQuaternion(track:T.KeyframeTrack,t:number,out:T.Quaternion){
 const times=track.times,values=track.values,count=times.length;if(!count)return out.identity();
 if(t<=times[0])return out.fromArray(values,0).normalize();if(t>=times[count-1])return out.fromArray(values,(count-1)*4).normalize();
 let lo=0,hi=count-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(times[mid]<=t)lo=mid;else hi=mid;}
 const a=(t-times[lo])/Math.max(1e-6,times[hi]-times[lo]),next=new T.Quaternion().fromArray(values,hi*4).normalize();return out.fromArray(values,lo*4).normalize().slerp(next,a).normalize();
}

function addBodyDrive(track:T.KeyframeTrack,clip:string,impact:number,duration:number){
 if(!track.name.endsWith('.quaternion'))return track;const bone=track.name.slice(0,-'.quaternion'.length),drive=driveFor(clip,bone);if(!drive.pitch&&!drive.yaw&&!drive.roll)return track;
 const load=Math.max(.04,impact*.55),follow=impact+(duration-impact)*.42;
 const times=[...Array.from(track.times),0,load,impact,follow,duration].sort((a,b)=>a-b).filter((t,i,a)=>i===0||Math.abs(t-a[i-1])>1e-5);
 const values:number[]=[],q=new T.Quaternion(),extra=new T.Quaternion(),euler=new T.Euler(),head=HEAD_NECK.test(bone);
 for(const t of times){sampleQuaternion(track,t,q);const w=head?headDriveWeight(t,impact,duration):driveWeight(t,impact,duration);euler.set(drive.pitch*w,drive.yaw*w,drive.roll*w,'YXZ');extra.setFromEuler(euler);q.multiply(extra).normalize();values.push(q.x,q.y,q.z,q.w);}
 return new T.QuaternionKeyframeTrack(track.name,times,values,T.InterpolateLinear);
}

function retime(track:T.KeyframeTrack,clip:string,sourceImpact:number,targetImpact:number,targetDuration:number,sourceDuration:number){
 let out=amplifyRotation(track);const times=out.times,beforeScale=sourceImpact>1e-6?targetImpact/sourceImpact:1,sourceTail=Math.max(1e-6,sourceDuration-sourceImpact),targetTail=Math.max(0,targetDuration-targetImpact);
 for(let i=0;i<times.length;i++){const t=times[i];times[i]=t<=sourceImpact?t*beforeScale:targetImpact+(t-sourceImpact)*(targetTail/sourceTail);}
 out=smoothDiscreteQuaternion(out,targetImpact);return addBodyDrive(out,clip,targetImpact,targetDuration);
}

/** Preserve authored contact while compressing dead recovery and adding the missing kinetic chain. */
export function combatClip(source:T.AnimationClip,name:string,sourceImpact:number,targetImpact:number,targetDuration:number){return new T.AnimationClip(name,targetDuration,source.tracks.map(t=>retime(t,name,sourceImpact,targetImpact,targetDuration,source.duration)));}