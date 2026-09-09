import * as T from 'three';

/** Elevated action-RPG framing; cinematic menus retain their own lens. */
export const ACTION_CAMERA={pitch:.96,distance:14,fov:42,minPitch:-1.42,maxPitch:1.42,minOrbitPitch:.18,minDistance:7,maxDistance:24};

/** Keep the physical third-person boom terrain-safe even when the player looks above the horizon. */
export const cameraOrbitPitch=(pitch:number)=>Math.max(pitch,ACTION_CAMERA.minOrbitPitch);

/** Follow only translation; mouse orbit stays responsive. Collision release is eased independently. */
export class FollowCamera {
 anchor=new T.Vector3();distance=ACTION_CAMERA.distance;private ready=false;
 reset(){this.ready=false;}
 update(target:T.Vector3,yaw:number,pitch:number,distance:number,dt:number,obstruction:(from:T.Vector3,to:T.Vector3)=>number|undefined){
  if(!this.ready||this.anchor.distanceTo(target)>12){this.anchor.copy(target);this.distance=distance;this.ready=true;}
  this.anchor.x=T.MathUtils.damp(this.anchor.x,target.x,28,dt);this.anchor.z=T.MathUtils.damp(this.anchor.z,target.z,28,dt);this.anchor.y=T.MathUtils.damp(this.anchor.y,target.y,12,dt);
  const baseAim=this.anchor.clone().add(new T.Vector3(0,1.35,0)),orbitPitch=cameraOrbitPitch(pitch);
  const direction=new T.Vector3(-Math.sin(yaw)*Math.cos(orbitPitch),Math.sin(orbitPitch),Math.cos(yaw)*Math.cos(orbitPitch));
  const hit=obstruction(baseAim,baseAim.clone().addScaledVector(direction,distance));const safe=hit===undefined?distance:Math.max(.55,hit-.22);
  this.distance=safe<this.distance?safe:T.MathUtils.damp(this.distance,safe,6,dt);
  const position=baseAim.clone().addScaledVector(direction,this.distance),aim=baseAim.clone();
  if(pitch<orbitPitch){const horizontal=Math.max(.001,Math.cos(orbitPitch)*this.distance);aim.y=position.y-Math.tan(pitch)*horizontal;}
  return {aim,position};
 }
}
