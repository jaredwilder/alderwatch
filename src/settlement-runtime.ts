import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {CellCoord} from './area-cell-stream';
import type {SettlementPlan,SettlementVec2,SettlementZoneKind} from './settlement-compiler';
import type {StreamedAreaSurfaceSet} from './streamed-area-surface';
import {makeIrregularPatchGeometry,makeOrganicTrackGeometry} from './organic-track';

export interface SettlementCellRenderContext{
 plan:SettlementPlan;
 coord:CellCoord;
 cellSize:number;
 group:T.Group;
 physics:RAPIER.World;
 surfaces:StreamedAreaSurfaceSet;
 resolveAsset:(asset:string)=>T.Object3D|undefined;
 colliders:RAPIER.Collider[];
 ownedGeometries:T.BufferGeometry[];
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

const PATCH_SCALE:Partial<Record<SettlementZoneKind,[number,number]>>={
 social:[1.02,.82],work:[1.08,.86],yard:[1.12,.82],storage:[.88,.72],shelter:[.72,.58],service:[.9,.62],
};

/** Render one streaming-cell slice of a settlement that was planned globally. */
export function renderSettlementCell(context:SettlementCellRenderContext){
 const {plan,coord,cellSize,group,physics,surfaces,resolveAsset,colliders,ownedGeometries}=context,cx=coord.x*cellSize,cz=coord.z*cellSize,half=cellSize/2,minX=cx-half,maxX=cx+half,minZ=cz-half,maxZ=cz+half;
 let pathPieces=0,placements=0,groundPatches=0;
 // Semantic activity zones get compact, irregular beaten-earth footprints. These
 // are deliberately not cell-sized rectangles: the dirt exists because people use it.
 for(const zone of plan.zones){
  const scale=PATCH_SCALE[zone.kind];if(!scale)continue;const {x,z}=zone.center;if(x<minX||x>=maxX||z<minZ||z>=maxZ)continue;
  const geometry=makeIrregularPatchGeometry(zone.radius*scale[0],zone.radius*scale[1],`${plan.charter.id}:${zone.id}`);ownedGeometries.push(geometry);
  const patch=new T.Mesh(geometry,surfaces.yard);patch.name=`settlement-ground:${plan.charter.id}:${zone.id}`;patch.position.set(x-cx,.019,z-cz);patch.rotation.y=zone.orientation;patch.receiveShadow=true;patch.castShadow=false;patch.renderOrder=-1;group.add(patch);groundPatches++;
 }
 // Paths retain one draw per clipped semantic segment, but their edges and
 // centreline are boundedly irregular rather than scaled PlaneGeometry slabs.
 for(const path of plan.paths)for(let i=1;i<path.points.length;i++){
  const clipped=clipSegment(path.points[i-1],path.points[i],minX,maxX,minZ,maxZ);if(!clipped)continue;
  const [a,b]=clipped,length=Math.hypot(b.x-a.x,b.z-a.z);if(length<.08)continue;
  const geometry=makeOrganicTrackGeometry([{x:a.x-cx,z:a.z-cz},{x:b.x-cx,z:b.z-cz}],path.width,`${plan.charter.id}:${path.id}:${i-1}`,3.5);ownedGeometries.push(geometry);
  const track=new T.Mesh(geometry,surfaces.road);track.name=`settlement-path:${plan.charter.id}:${path.id}:${i-1}`;track.position.y=.03;track.receiveShadow=true;track.castShadow=false;group.add(track);pathPieces++;
 }
 for(const placement of plan.placements){
  const {x,z}=placement.position;if(x<minX||x>=maxX||z<minZ||z>=maxZ)continue;
  const source=resolveAsset(placement.asset);if(!source)continue;
  const object=source.clone(true);object.name=`settlement:${plan.charter.id}:${placement.id}`;object.position.set(x-cx,0,z-cz);object.rotation.y=placement.yaw;object.scale.setScalar(placement.scale);object.userData.settlementId=plan.charter.id;object.userData.settlementPlacementId=placement.id;object.userData.settlementStory=placement.story;object.userData.settlementZone=placement.zoneId;group.add(object);placements++;
  if(placement.collision){const c=placement.collision,hy=c.hy??2;colliders.push(physics.createCollider(RAPIER.ColliderDesc.cuboid(c.hx,hy,c.hz).setTranslation(x,hy,z)));}
 }
 return{pathPieces,placements,groundPatches};
}
