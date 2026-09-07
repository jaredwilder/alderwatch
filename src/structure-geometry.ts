import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {BuildKind} from './definitions';
import type {StructureState,Vec3} from './state';

export interface ColliderPart {center:Vec3;half:Vec3;roll?:number}
export function structureParts(kind:BuildKind):ColliderPart[]{
 const box=(center:Vec3,half:Vec3,roll=0)=>({center,half,roll});
 switch(kind){
  case 'foundation':return [box([0,.1,0],[1.5,.34,1.5])];
  case 'wall':return [box([0,1.35,0],[1.5,1.35,.11])];
  case 'window':return [box([0,.5,0],[1.5,.5,.11]),box([0,2.33,0],[1.5,.37,.11]),box([-.99,1.48,0],[.45,.48,.11]),box([.99,1.48,0],[.45,.48,.11])];
  case 'doorway':return [box([-.99,1.35,0],[.45,1.35,.11]),box([.99,1.35,0],[.45,1.35,.11]),box([0,2.41,0],[.55,.29,.11])];
  case 'roof':return [-1,1].map(side=>box([side*.95,.67,0],[1.27,.115,1.57],-side*Math.atan(.87)));
  case 'palisade':return [box([0,1,0],[1.45,1,.18])];
  case 'workbench':return [box([0,.44,0],[.9,.44,.45])];
  case 'chest':return [box([0,.33,0],[.55,.33,.35])];
  default:return [];
 }
}
export function makeStructureCollider(physics:RAPIER.World,position:Vec3,yaw:number,part:ColliderPart){
 const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),v=new T.Vector3(...part.center).applyQuaternion(q).add(new T.Vector3(...position));
 if(part.roll)q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),part.roll));
 return physics.createCollider(RAPIER.ColliderDesc.cuboid(...part.half).setTranslation(v.x,v.y,v.z).setRotation(q).setFriction(.8));
}
export function openRoofEnds(roof:StructureState,all:StructureState[]):[boolean,boolean]{
 const axis=new T.Vector3(0,0,1).applyAxisAngle(new T.Vector3(0,1,0),roof.yaw);
 return [-1,1].map(sign=>!all.some(other=>other.id!==roof.id&&other.kind==='roof'&&Math.abs(Math.sin(other.yaw-roof.yaw))<.01&&Math.abs(other.position[1]-roof.position[1])<.08&&Math.hypot(other.position[0]-roof.position[0]-axis.x*sign*3,other.position[2]-roof.position[2]-axis.z*sign*3)<.08)) as [boolean,boolean];
}
