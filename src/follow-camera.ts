import * as T from 'three';

/** Elevated action-RPG framing; cinematic menus retain their own lens. */
export const ACTION_CAMERA={pitch:.96,distance:14,fov:42,minPitch:.45,maxPitch:1.3,minDistance:7,maxDistance:24};

/** Follow only translation; mouse orbit stays responsive. Collision release is eased independently. */
export class FollowCamera {
 anchor=new T.Vector3();distance=ACTION_CAMERA.distance;private ready=false;
 reset(){this.ready=false;}
 update(target:T.Vector3,yaw:number,pitch:number,distance:number,dt:number,obstruction:(from:T.Vector3,to:T.Vector3)=>number|undefined){
  if(!this.ready||this.anchor.distanceTo(target)>12){this.anchor.copy(target);this.distance=distance;this.ready=true;}
  this.anchor.x=T.MathUtils.damp(this.anchor.x,target.x,28,dt);this.anchor.z=T.MathUtils.damp(this.anchor.z,target.z,28,dt);this.anchor.y=T.MathUtils.damp(this.anchor.y,target.y,12,dt);
  const aim=this.anchor.clone().add(new T.Vector3(0,1.35,0));
  const direction=new T.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
  const hit=obstruction(aim,aim.clone().addScaledVector(direction,distance));const safe=hit===undefined?distance:Math.max(.55,hit-.22);
  this.distance=safe<this.distance?safe:T.MathUtils.damp(this.distance,safe,6,dt);
  return {aim,position:aim.clone().addScaledVector(direction,this.distance)};
 }
}
