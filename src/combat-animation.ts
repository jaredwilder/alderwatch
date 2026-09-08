import * as T from 'three';

const UPPER=/^(spine_|clavicle_|upperarm_|lowerarm_|hand_|index_|middle_|ring_|pinky_|thumb_)/;
export const upperBodyTrack=(name:string)=>UPPER.test(name);
export const meleeBodyTrack=(name:string)=>name.startsWith('pelvis.')||UPPER.test(name);

const rotationGain=(name:string)=>name.startsWith('pelvis.quaternion')?1.55:name.startsWith('spine_01.quaternion')?1.38:name.startsWith('spine_02.quaternion')?1.22:name.startsWith('spine_03.quaternion')?1.10:1;

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

function retime(track:T.KeyframeTrack,sourceImpact:number,targetImpact:number,targetDuration:number,sourceDuration:number){
 const out=amplifyRotation(track),times=out.times;
 const beforeScale=sourceImpact>1e-6?targetImpact/sourceImpact:1,sourceTail=Math.max(1e-6,sourceDuration-sourceImpact),targetTail=Math.max(0,targetDuration-targetImpact);
 for(let i=0;i<times.length;i++){const t=times[i];times[i]=t<=sourceImpact?t*beforeScale:targetImpact+(t-sourceImpact)*(targetTail/sourceTail);}
 return out;
}

/**
 * Preserve the authored contact pose while compressing dead recovery frames and
 * making the existing pelvis/spine weight transfer readable. For pickaxes we
 * can deliberately use the authored two-handed heavy cut as the source and
 * retime its downward contact to the pick's faster impact window.
 */
export function combatClip(source:T.AnimationClip,name:string,sourceImpact:number,targetImpact:number,targetDuration:number){
 return new T.AnimationClip(name,targetDuration,source.tracks.map(t=>retime(t,sourceImpact,targetImpact,targetDuration,source.duration)));
}
