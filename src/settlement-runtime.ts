import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {CellCoord} from './area-cell-stream';
import type {SettlementPlan,SettlementVec2} from './settlement-compiler';
import type {StreamedAreaSurfaceSet} from './streamed-area-surface';

export interface SettlementCellRenderContext{
 plan:SettlementPlan;
 coord:CellCoord;
 cellSize:number;
 group:T.Group;
 physics:RAPIER.World;
 surfaces:StreamedAreaSurfaceSet;
 resolveAsset:(asset:string)=>T.Object3D|undefined;
 colliders:RAPIER.Collider[];
}

function clipSegment(a:SettlementVec2,b:SettlementVec2,minX:number,maxX:number,minZ:number,maxZ:number):[SettlementVec2,SettlementVec2]|undefined{
 let t0=0,t1=1,dx=b.x-a.x,dz=b.z-a.z;
 const p=[-dx,dx,-dz,dz],q=[a.x-minX,maxX-a.x,a.z-minZ,maxZ-a.z];
 for(let i=0;i<4;i++){
  if(Math.abs(p[i])<1e-9){if(q[i]<0)return;continue;}
  const r=q[i]/p[i];if(p[i]<0){if(r>t1)return;t0=Math.max(t0,r);}else{if(r<t0)return;t1=Math.min(t1,r);}
 }
 return[{x:a.x+dx*t0,z:a.z+dz*t0},{x:a.x+dx*t1,z:a.z+dz*t1}];
}

/** Render one streaming-cell slice of a settlement that was planned globally. */
export function renderSettlementCell(context:SettlementCellRenderContext){
 const {plan,coord,cellSize,group,physics,surfaces,resolveAsset,colliders}=context,cx=coord.x*cellSize,cz=coord.z*cellSize,half=cellSize/2,minX=cx-half,maxX=cx+half,minZ=cz-half,maxZ=cz+half;
 let pathPieces=0,placements=0;
 const unit=surfaces.geometry(1,1);
 for(const path of plan.paths)for(let i=1;i<path.points.length;i++){
  const clipped=clipSegment(path.points[i-1],path.points[i],minX,maxX,minZ,maxZ);if(!clipped)continue;
  const [a,b]=clipped,dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.08)continue;
  const ribbon=new T.Mesh(unit,surfaces.road);ribbon.name=`settlement-path:${plan.charter.id}:${path.id}:${i-1}`;ribbon.rotation.x=-Math.PI/2;ribbon.rotation.z=-Math.atan2(dx,dz);ribbon.position.set((a.x+b.x)/2-cx,.028,(a.z+b.z)/2-cz);ribbon.scale.set(path.width,length,1);ribbon.receiveShadow=true;ribbon.castShadow=false;group.add(ribbon);pathPieces++;
 }
 for(const placement of plan.placements){
  const {x,z}=placement.position;if(x<minX||x>=maxX||z<minZ||z>=maxZ)continue;
  const source=resolveAsset(placement.asset);if(!source)continue;
  const object=source.clone(true);object.name=`settlement:${plan.charter.id}:${placement.id}`;object.position.set(x-cx,0,z-cz);object.rotation.y=placement.yaw;object.scale.setScalar(placement.scale);object.userData.settlementId=plan.charter.id;object.userData.settlementPlacementId=placement.id;object.userData.settlementStory=placement.story;object.userData.settlementZone=placement.zoneId;group.add(object);placements++;
  if(placement.collision){const c=placement.collision,hy=c.hy??2;colliders.push(physics.createCollider(RAPIER.ColliderDesc.cuboid(c.hx,hy,c.hz).setTranslation(x,hy,z)));}
 }
 return{pathPieces,placements};
}
