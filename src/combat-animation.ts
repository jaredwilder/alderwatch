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
 if(clip==='attack')return bone==='pelvis'?{pitch:.018,yaw:.40,roll:-.035}:bone==='spine_01'?{pitch:.015,yaw:.19,roll:-.035}:bone==='spine_02'?{pitch:0,yaw:.10,roll:-.02}:bone==='spine_03'?{pitch:0,yaw:.055,roll:-.01}:neck?{pitch:.095,yaw:0,roll:0}:head?{pitch:.045,yaw:0,roll:0}:ZERO;
 // Axe combat is retargeted into a right-side load -> left-side finish. Negative transverse drive makes
 // the pelvis lead that same spatial direction instead of counter-rotating against the reversed arms.
 if(clip==='chop')return bone==='pelvis'?{pitch:.002,yaw:-.86,roll:-.065}:bone==='spine_01'?{pitch:.002,yaw:-.34,roll:-.055}:bone==='spine_02'?{pitch:0,yaw:-.17,roll:-.03}:bone==='spine_03'?{pitch:0,yaw:-.082,roll:-.015}:neck?{pitch:.065,yaw:0,roll:0}:head?{pitch:.025,yaw:0,roll:0}:ZERO;
 if(clip==='mine')return bone==='pelvis'?{pitch:.20,yaw:.065,roll:0}:bone==='spine_01'?{pitch:.16,yaw:.05,roll:0}:bone==='spine_02'?{pitch:.09,yaw:.025,roll:0}:ZERO;
 if(clip==='heavy')return bone==='pelvis'?{pitch:.14,yaw:.15,roll:0}:bone==='spine_01'?{pitch:.11,yaw:.12,roll:0}:bone==='spine_02'?{pitch:.065,yaw:.07,roll:0}:ZERO;
 return ZERO;
}
function smooth01(x:number){x=T.MathUtils.clamp(x,0,1);return x*x*(3-2*x);}
/** Legacy body drive for overhead/mining/heavy actions. */
function driveWeight(t:number,impact:number,duration:number){
 const load=Math.max(.04,impact*.55),follow=impact+(duration-impact)*.42;
 if(t<=load)return-smooth01(t/load);
 if(t<=impact)return-1+smooth01((t-load)/Math.max(.001,impact-load));
 if(t<=follow)return .72*smooth01((t-impact)/Math.max(.001,follow-impact));
 return .72*(1-smooth01((t-follow)/Math.max(.001,duration-follow)));
}
type Segment='pelvis'|'spine1'|'spine2'|'spine3'|'other';
function segmentFor(bone:string):Segment{return bone==='pelvis'?'pelvis':bone==='spine_01'?'spine1':bone==='spine_02'?'spine2':bone==='spine_03'?'spine3':'other';}
/**
 * Side cuts use proximal-to-distal sequencing. The axe deliberately traverses from a deep counter-coil
 * to an open pelvis through contact; this is angular displacement, not a static rotated pose.
 */
function sideDriveShape(clip:string,bone:string,impact:number,duration:number){
 const tail=Math.max(.001,duration-impact),segment=segmentFor(bone),axe=clip==='chop';
 if(segment==='pelvis')return axe
  ?{load:Math.max(.025,impact*.24),loadWeight:-1.22,contactWeight:.96,follow:impact+tail*.20,followWeight:1.12}
  :{load:Math.max(.035,impact*.34),loadWeight:-1,contactWeight:.46,follow:impact+tail*.30,followWeight:.82};
 if(segment==='spine1')return axe
  ?{load:Math.max(.03,impact*.40),loadWeight:-.70,contactWeight:.48,follow:impact+tail*.30,followWeight:.82}
  :{load:Math.max(.04,impact*.46),loadWeight:-.72,contactWeight:.28,follow:impact+tail*.36,followWeight:.68};
 if(segment==='spine2')return axe
  ?{load:Math.max(.035,impact*.51),loadWeight:-.40,contactWeight:.25,follow:impact+tail*.38,followWeight:.58}
  :{load:Math.max(.04,impact*.56),loadWeight:-.44,contactWeight:.14,follow:impact+tail*.42,followWeight:.52};
 if(segment==='spine3')return axe
  ?{load:Math.max(.04,impact*.59),loadWeight:-.26,contactWeight:.13,follow:impact+tail*.44,followWeight:.43}
  :{load:Math.max(.04,impact*.62),loadWeight:-.30,contactWeight:.08,follow:impact+tail*.46,followWeight:.40};
 return {load:Math.max(.04,impact*.55),loadWeight:-1,contactWeight:0,follow:impact+tail*.42,followWeight:.72};
}
function sideDriveWeight(t:number,clip:string,bone:string,impact:number,duration:number){
 const s=sideDriveShape(clip,bone,impact,duration);
 if(t<=s.load)return s.loadWeight*smooth01(t/Math.max(.001,s.load));
 if(t<=impact)return s.loadWeight+(s.contactWeight-s.loadWeight)*smooth01((t-s.load)/Math.max(.001,impact-s.load));
 if(t<=s.follow)return s.contactWeight+(s.followWeight-s.contactWeight)*smooth01((t-impact)/Math.max(.001,s.follow-impact));
 return s.followWeight*(1-smooth01((t-s.follow)/Math.max(.001,duration-s.follow)));
}
/** Neck/head dip *into* the hit instead of returning upright at contact. */
function headDriveWeight(t:number,impact:number,duration:number){
 const begin=Math.max(.02,impact*.38),release=impact+(duration-impact)*.58;
 if(t<=begin)return 0;
 if(t<=impact)return smooth01((t-begin)/Math.max(.001,impact-begin));
 return 1-smooth01((t-impact)/Math.max(.001,release-impact));
}

function reverseTrack(track:T.KeyframeTrack,duration:number){
 const out=track.clone(),times=Array.from(track.times),values=Array.from(track.values),n=times.length,size=track.getValueSize();
 for(let i=0;i<n;i++){out.times[i]=duration-times[n-1-i];for(let j=0;j<size;j++)out.values[i*size+j]=values[(n-1-i)*size+j];}
 return out;
}
function amplifyRotation(track:T.KeyframeTrack){
 const gain=rotationGain(track.name),out=track.clone();if(gain===1||!track.name.endsWith('.quaternion'))return out;
 const v=out.values,base=new T.Quaternion().fromArray(v,0).normalize(),baseInv=base.clone().invert(),q=new T.Quaternion(),delta=new T.Quaternion(),scaled=new T.Quaternion(),axis=new T.Vector3();
 for(let i=0;i<v.length;i+=4){q.fromArray(v,i).normalize();if(base.dot(q)<0)q.set(-q.x,-q.y,-q.z,-q.w);delta.copy(baseInv).multiply(q).normalize();if(delta.w<0)delta.set(-delta.x,-delta.y,-delta.z,-delta.w);const w=T.MathUtils.clamp(delta.w,-1,1),angle=2*Math.acos(w),s=Math.sqrt(Math.max(0,1-w*w));if(angle>1e-6&&s>1e-6){axis.set(delta.x/s,delta.y/s,delta.z/s).normalize();scaled.setFromAxisAngle(axis,Math.min(Math.PI*.92,angle*gain));q.copy(base).multiply(scaled).normalize();}q.toArray(v,i);}
 return out;
}

/** Preserve exact gameplay contact while converting imported STEP quaternions to continuous slerp-friendly keys. */
function smoothDiscreteQuaternion(track:T.KeyframeTrack,impact:number){
 if(!track.name.endsWith('.quaternion')||track.getInterpolation()!==T.InterpolateDiscrete)return track;
 const oldTimes=Array.from(track.times),oldValues=track.values,times=[...oldTimes],values:number[]=[];
 let exact=oldTimes.findIndex(t=>Math.abs(t-impact)<1e-5),sampleIndex=0;
 if(exact<0){for(let i=0;i<oldTimes.length;i++){if(oldTimes[i]<=impact)sampleIndex=i;else break;}times.push(impact);times.sort((a,b)=>a-b);}
 for(const t of times){let i=oldTimes.findIndex(k=>Math.abs(k-t)<1e-5);if(i<0)i=sampleIndex;const q=new T.Quaternion().fromArray(oldValues,i*4).normalize();values.push(q.x,q.y,q.z,q.w);}
 return new T.QuaternionKeyframeTrack(track.name,times,values,T.InterpolateLinear);
}

function sampleQuaternion(track:T.KeyframeTrack,t:number,out:T.Quaternion){
 const times=track.times,values=track.values,count=times.length;if(!count)return out.identity();
 if(t<=times[0])return out.fromArray(values,0).normalize();if(t>=times[count-1])return out.fromArray(values,(count-1)*4).normalize();
 let lo=0,hi=count-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(times[mid]<=t)lo=mid;else hi=mid;}
 const a=(t-times[lo])/Math.max(1e-6,times[hi]-times[lo]),next=new T.Quaternion().fromArray(values,hi*4).normalize();return out.fromArray(values,lo*4).normalize().slerp(next,a).normalize();
}

function addBodyDrive(track:T.KeyframeTrack,clip:string,impact:number,duration:number){
 if(!track.name.endsWith('.quaternion'))return track;const bone=track.name.slice(0,-'.quaternion'.length),drive=driveFor(clip,bone);if(!drive.pitch&&!drive.yaw&&!drive.roll)return track;
 const side=clip==='attack'||clip==='chop',shape=side?sideDriveShape(clip,bone,impact,duration):undefined,load=shape?.load??Math.max(.04,impact*.55),follow=shape?.follow??impact+(duration-impact)*.42;
 const times=[...Array.from(track.times),0,load,impact,follow,duration].sort((a,b)=>a-b).filter((t,i,a)=>i===0||Math.abs(t-a[i-1])>1e-5);
 const values:number[]=[],q=new T.Quaternion(),extra=new T.Quaternion(),euler=new T.Euler(),head=HEAD_NECK.test(bone);
 for(const t of times){sampleQuaternion(track,t,q);const w=head?headDriveWeight(t,impact,duration):side?sideDriveWeight(t,clip,bone,impact,duration):driveWeight(t,impact,duration);euler.set(drive.pitch*w,drive.yaw*w,drive.roll*w,'YXZ');extra.setFromEuler(euler);q.multiply(extra).normalize();values.push(q.x,q.y,q.z,q.w);}
 return new T.QuaternionKeyframeTrack(track.name,times,values,T.InterpolateLinear);
}

function retime(track:T.KeyframeTrack,clip:string,sourceImpact:number,targetImpact:number,targetDuration:number,sourceDuration:number){
 const reversed=clip==='chop'&&meleeBodyTrack(track.name),effectiveImpact=reversed?sourceDuration-sourceImpact:sourceImpact;
 let out=reversed?reverseTrack(track,sourceDuration):track.clone();out=amplifyRotation(out);const times=out.times,beforeScale=effectiveImpact>1e-6?targetImpact/effectiveImpact:1,sourceTail=Math.max(1e-6,sourceDuration-effectiveImpact),targetTail=Math.max(0,targetDuration-targetImpact);
 for(let i=0;i<times.length;i++){const t=times[i];times[i]=t<=effectiveImpact?t*beforeScale:targetImpact+(t-effectiveImpact)*(targetTail/sourceTail);}
 out=smoothDiscreteQuaternion(out,targetImpact);return addBodyDrive(out,clip,targetImpact,targetDuration);
}

/** Preserve authored timing while adding a readable full-body kinetic chain around gameplay contact. */
export function combatClip(source:T.AnimationClip,name:string,sourceImpact:number,targetImpact:number,targetDuration:number){return new T.AnimationClip(name,targetDuration,source.tracks.map(t=>retime(t,name,sourceImpact,targetImpact,targetDuration,source.duration)));}
