import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from './assets';
import {BUILDS,type BuildKind} from './definitions';
import {distance,placementError,type EconomyCommand} from './economy';
import {LocalAuthority,type PlayerState,type StructureState,type Vec3} from './state';
import {FAR_MARCH_BUILD_TERRAIN,type BuildTerrainProfile} from './build-terrain';
import {structureParts,makeStructureCollider,openRoofEnds} from './structure-geometry';

type Placement=Extract<EconomyCommand,{type:'place'}>;
type Built={object:T.Group;colliders:RAPIER.Collider[];door?:T.Object3D;doorCollider?:RAPIER.Collider;doorAngle?:number;gables?:T.Object3D[]};
export class Building {
 active=false;kind:BuildKind='foundation';yaw=0;ghost?:T.Group;proposal?:Placement;error='Point at nearby ground';
 pieces=new Map<string,Built>();ray=new T.Raycaster();aimed?:string;
 constructor(public world:T.Group,public assets:Assets,public physics:RAPIER.World,public authority:LocalAuthority,public terrain:BuildTerrainProfile=FAR_MARCH_BUILD_TERRAIN){this.sync();}
 model(kind:BuildKind){const group=new T.Group(),dress=(name:string,x:number,y:number,z:number,scale=1,yaw=0)=>{const o=this.assets.prop(name);o.position.set(x,y,z);o.rotation.y=yaw;o.scale.setScalar(scale);group.add(o);return o;};group.add(this.assets.prop(kind));if(kind==='doorway'){const door=this.assets.prop('door');door.name='hinged-door';door.position.set(-.54,0,-.10);group.add(door);for(const [i,y,z,scale,yaw] of [[0,-.365,.78,.62,.04],[1,-.215,.4,.72,-.035]] as const){const step=dress('paving_0',0,y,z,scale,yaw);step.name='Threshold slab '+i;}}if(kind==='roof')for(const side of [-1,1]){const gable=this.assets.prop('gable');gable.name='gable-'+side;gable.position.z=side*1.5;gable.rotation.y=side<0?Math.PI:0;group.add(gable);}if(kind==='workbench'){const satchel=dress('satchel',-.72,.02,.50,.78,-.35);satchel.name='Workbench satchel';}if(kind==='chest'){const satchel=dress('satchel',.76,.02,.12,.72,.45);satchel.name='Storage satchel';}if(kind==='campfire'){const left=dress('stump',-1.15,0,.52,.52,.2),right=dress('stump',1.02,0,-.68,.48,-.25);left.name='Fire seat west';right.name='Fire seat east';}return group;}
 select(kind:BuildKind){this.kind=kind;this.ghost?.removeFromParent();this.ghost=this.model(kind);this.ghost.traverse(o=>{if(o instanceof T.Mesh){o.material=new T.MeshBasicMaterial({color:'#b9d5b5',transparent:true,opacity:.38,depthWrite:false,side:T.DoubleSide});o.castShadow=false;o.receiveShadow=false;}});this.world.add(this.ghost);}
 setActive(active:boolean){this.active=active;if(active)this.select(this.kind);else{this.ghost?.removeFromParent();this.ghost=undefined;this.proposal=undefined;}}
 candidate(p:PlayerState,point:Vec3):Placement{
  const floors=Object.values(this.authority.state.structures).filter(s=>s.kind==='foundation'&&s.ownerId===p.id).sort((a,b)=>distance(a.position,point)-distance(b.position,point));
  const near=floors[0];let supportId:string|undefined;let pos:Vec3=[...point],yaw=this.yaw;
  if(this.kind==='foundation'){
   pos=[Math.round(point[0]/3)*3,0,Math.round(point[2]/3)*3];pos[1]=this.terrain.height(pos[0],pos[2]);
   const neighbor=floors.find(s=>distance(s.position,pos)<3.1&&distance(s.position,pos)>2.9);if(neighbor&&Math.abs(neighbor.position[1]-pos[1])<.65)pos[1]=neighbor.position[1];
  }else if(['wall','window','doorway','roof'].includes(this.kind)&&near&&distance(near.position,point)<4){
   supportId=near.id;pos=[...near.position];
   if(this.kind==='roof')pos[1]+=3.14;
   else{const dx=point[0]-pos[0],dz=point[2]-pos[2];if(Math.abs(dx)>Math.abs(dz)){pos[0]+=Math.sign(dx||1)*1.5;yaw=dx<0?-Math.PI/2:Math.PI/2;}else{pos[2]+=Math.sign(dz||1)*1.5;yaw=dz<0?Math.PI:0;}pos[1]+=.44;}
  }else{pos[0]=Math.round(pos[0]*2)/2;pos[2]=Math.round(pos[2]*2)/2;if(near&&Math.abs(pos[0]-near.position[0])<1.4&&Math.abs(pos[2]-near.position[2])<1.4){supportId=near.id;pos[1]=near.position[1]+.47;}else pos[1]=this.terrain.height(pos[0],pos[2]);}
  return {type:'place',playerId:p.id,kind:this.kind,position:pos,yaw,supportId};
 }
 update(camera:T.Camera,pointer:T.Vector2,p:PlayerState,dt=1/60){
  this.sync(dt);if(!this.active||!this.ghost)return;
  this.ray.setFromCamera(pointer,camera);let point:Vec3|undefined;this.aimed=undefined;const hit=this.ray.intersectObjects([...this.pieces.values()].map(b=>b.object),true)[0];if(hit){let object:T.Object3D|null=hit.object;while(object&&!object.userData.entityId)object=object.parent;this.aimed=object?.userData.entityId;}
  const floors=Object.values(this.authority.state.structures).filter(s=>s.kind==='foundation');
  for(let t=.5;t<32;t+=.12){const v=this.ray.ray.at(t,new T.Vector3());let ground=this.terrain.height(v.x,v.z);for(const f of floors)if(Math.abs(v.x-f.position[0])<1.5&&Math.abs(v.z-f.position[2])<1.5)ground=Math.max(ground,f.position[1]+.47);if(v.y<=ground){point=[v.x,ground,v.z];break;}}
  if(!point){this.ghost.visible=false;this.proposal=undefined;this.error='Point at nearby ground';return;}
  this.proposal=this.candidate(p,point);this.error=placementError(this.authority,p,this.proposal)??'';this.ghost.visible=true;this.ghost.position.fromArray(this.proposal.position);this.ghost.rotation.y=this.proposal.yaw;
  this.ghost.traverse(o=>{if(o instanceof T.Mesh)(o.material as T.MeshBasicMaterial).color.set(this.error?'#d67b68':'#9dd1a9');});
 }
 place(){if(!this.proposal)return {ok:false,message:this.error};const out=this.authority.dispatch(this.proposal);if(out.ok)this.sync();return out;}
 nearest(p:PlayerState,kind?:BuildKind){return Object.values(this.authority.state.structures).filter(s=>(!kind||s.kind===kind)&&distance(p.position,s.position)<(kind==='doorway'?2.5:6)).sort((a,b)=>distance(p.position,a.position)-distance(p.position,b.position))[0];}
 dismantle(p:PlayerState){const s=this.aimed?this.authority.state.structures[this.aimed]:undefined;if(!s)return {ok:false,message:'Point at the piece you want to dismantle'};const out=this.authority.dispatch({type:'dismantle',playerId:p.id,structureId:s.id});this.sync();return out;}
 sheltered(p:PlayerState){return Object.values(this.authority.state.structures).some(s=>s.kind==='roof'&&Math.abs(s.position[0]-p.position[0])<1.5&&Math.abs(s.position[2]-p.position[2])<1.5&&p.position[1]<s.position[1]);}
 collider(s:StructureState,offset:Vec3,half:Vec3,extraYaw=0){const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),s.yaw),v=new T.Vector3(...offset).applyQuaternion(q).add(new T.Vector3(...s.position));q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),extraYaw));return this.physics.createCollider(RAPIER.ColliderDesc.cuboid(...half).setTranslation(v.x,v.y,v.z).setRotation(q).setFriction(.8));}
 sync(dt=1/60){
  for(const [id,b] of this.pieces)if(!this.authority.state.structures[id]){b.object.removeFromParent();for(const c of b.colliders)this.physics.removeCollider(c,true);if(b.doorCollider)this.physics.removeCollider(b.doorCollider,true);this.pieces.delete(id);}
  for(const s of Object.values(this.authority.state.structures)){
   let b=this.pieces.get(s.id);if(!b){const object=this.model(s.kind);object.position.fromArray(s.position);object.rotation.y=s.yaw;object.userData.entityId=s.id;this.world.add(object);b={object,colliders:[...structureParts(s.kind),...(s.kind==='doorway'?Array.from({length:2},(_,i)=>({center:[0,-.365+i*.15,.78-i*.38] as Vec3,half:[.57,.075,.24] as Vec3})):[])].map(part=>makeStructureCollider(this.physics,s.position,s.yaw,part))};
    if(s.kind==='doorway'){b.door=object.getObjectByName('hinged-door');b.doorAngle=s.doorOpen?-Math.PI/2:0;b.doorCollider=this.collider(s,[0,1.05,-.10],[.54,.99,.06]);}
    if(s.kind==='roof')b.gables=[object.getObjectByName('gable--1')!,object.getObjectByName('gable-1')!];
    this.pieces.set(s.id,b);
   }
   if(b.gables){const ends=openRoofEnds(s,Object.values(this.authority.state.structures));b.gables.forEach((g,i)=>g.visible=ends[i]);}
   if(b.door&&b.doorCollider){const target=s.doorOpen?-Math.PI/2:0;b.doorAngle=T.MathUtils.damp(b.doorAngle??target,target,14,dt);b.door.rotation.y=b.doorAngle;const center=new T.Vector3(.54,1.05,0).applyAxisAngle(new T.Vector3(0,1,0),b.doorAngle).add(new T.Vector3(-.54,0,-.10));center.applyAxisAngle(new T.Vector3(0,1,0),s.yaw).add(new T.Vector3(...s.position));b.doorCollider.setTranslation(center);b.doorCollider.setRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),s.yaw+b.doorAngle));}
  }
 }
 get label(){return BUILDS[this.kind].name;}
}
