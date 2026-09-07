import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Landscape} from './landscape';
import {frontierArea,seeded,trailDistance,regionAt} from './worldgen';
import {height} from './terrain';

/** Distant instanced trees; interactable authored trees and colliders only near the survivor. */
export class FrontierRenderer {
 private proxies:{mesh:T.InstancedMesh;ids:string[];matrices:T.Matrix4[]}[]=[];
 private detailed=new Set<string>();private chunks=new Map<string,T.Group>();private next=0;private structureSignature='';
 constructor(private land:Landscape){
  const cells=new Map<string,string[]>();for(const r of Object.values(land.state.resources).filter(r=>r.id.startsWith('wild-resource-'))){const key=Math.floor(r.position[0]/64)+','+Math.floor(r.position[2]/64)+','+r.kind;if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(r.id);}
  for(const ids of cells.values()){
   const source=land.assets.prop(land.state.resources[ids[0]].kind==='tree'?'oak_distant':'rock_1');source.updateMatrixWorld(true);
   source.traverse(o=>{if(!(o instanceof T.Mesh))return;const mesh=new T.InstancedMesh(o.geometry,o.material,ids.length),matrices:T.Matrix4[]=[];ids.forEach((id,i)=>{const r=land.state.resources[id],s=r.scale??1,mat=new T.Matrix4().compose(new T.Vector3(...r.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),r.rotation),new T.Vector3(s,s,s)).multiply(o.matrixWorld);matrices.push(mat);mesh.setMatrixAt(i,r.phase==='standing'?mat:new T.Matrix4().makeScale(0,0,0));});mesh.castShadow=false;mesh.receiveShadow=true;mesh.computeBoundingSphere();land.scene.add(mesh);this.proxies.push({mesh,ids,matrices});});
  }
  for(const site of Object.values(land.state.frontier?.sites??{})){const [x,,z]=site.position;land.place('chest',x,z);land.place('campfire',x+3,z+2);if(site.kind==='camp'){land.place('palisade',x-3,z-4,.15);land.place('palisade',x+3,z-4,-.15);}else {land.place('log',x-3,z,Math.PI/2,.6);if(site.kind==='rest'){land.place('workbench',x-3,z-2);const id=site.id+'-bench';land.state.stations[id]??={id,name:site.name+' workbench',kind:'workbench',position:[x-3,height(x-3,z-2),z-2]};}}}
  this.update(0,true);
 }
 update(time:number,force=false){
  if(!force&&time<this.next)return;this.next=time+.4;
  const p=Object.values(this.land.state.players)[0];if(!p)return;const zero=new T.Matrix4().makeScale(0,0,0);
  const signature=Object.keys(this.land.state.structures).join(',');if(signature!==this.structureSignature){for(const group of this.chunks.values()){group.removeFromParent();group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});}this.chunks.clear();this.structureSignature=signature;}
  for(const r of Object.values(this.land.state.resources).filter(r=>r.id.startsWith('wild-resource-'))){
   const near=Math.hypot(p.position[0]-r.position[0],p.position[2]-r.position[2])<38;
   if((near&&r.phase==='standing'||r.phase==='falling')&&!this.detailed.has(r.id)){
    const o=this.land.place(r.kind==='tree'?'oak_'+r.variant:'rock_'+r.variant,r.position[0],r.position[2],r.rotation,r.scale??1,r.position[1]);o.userData.entityId=r.id;this.land.resources.set(r.id,o);this.detailed.add(r.id);
    const s=r.scale??1,c=r.kind==='tree'?RAPIER.ColliderDesc.cylinder(3,.78*s).setTranslation(r.position[0],r.position[1]+3,r.position[2]):RAPIER.ColliderDesc.ball(1.05*s).setTranslation(r.position[0],r.position[1]+.55,r.position[2]);this.land.colliders.set(r.id,this.land.physics.createCollider(c));
   }else if(!near&&r.phase!=='falling'&&this.detailed.has(r.id)){this.land.resources.get(r.id)?.removeFromParent();this.land.resources.delete(r.id);const c=this.land.colliders.get(r.id);if(c)this.land.physics.removeCollider(c,true);this.land.colliders.delete(r.id);this.detailed.delete(r.id);}
  }
  for(const batch of this.proxies){batch.ids.forEach((id,i)=>batch.mesh.setMatrixAt(i,this.land.state.resources[id].phase!=='standing'||this.detailed.has(id)?zero:batch.matrices[i]));batch.mesh.instanceMatrix.needsUpdate=true;}
  const cx=Math.floor(p.position[0]/32),cz=Math.floor(p.position[2]/32),wanted=new Set<string>();
  for(let x=cx-1;x<=cx+1;x++)for(let z=cz-1;z<=cz+1;z++){const key=x+','+z;wanted.add(key);if(!this.chunks.has(key))this.chunks.set(key,this.cover(x,z));}
  for(const [key,group] of this.chunks)if(!wanted.has(key)){group.removeFromParent();group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.chunks.delete(key);}
 }
 dispose(){for(const b of this.proxies)b.mesh.dispose();for(const group of this.chunks.values())group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});}
 private cover(cx:number,cz:number){
  const group=new T.Group();this.land.scene.add(group);const rng=seeded((this.land.state.frontier?.seed??1)^Math.imul(cx,73856093)^Math.imul(cz,19349663)),grass:T.Matrix4[]=[],ferns:T.Matrix4[]=[];
  for(let x=cx*32;x<(cx+1)*32;x+=.85)for(let z=cz*32;z<(cz+1)*32;z+=.85){const px=x+rng()*.6,pz=z+rng()*.6;if(!frontierArea(px,pz)||Math.abs(px)<110&&pz<80||trailDistance(px,pz)<2.3||this.land.ambientOccupied(px,pz)||height(px,pz)<-1||Object.values(this.land.state.frontier?.sites??{}).some(s=>Math.hypot(px-s.position[0],pz-s.position[2])<4)||Object.values(this.land.state.structures).some(s=>Math.hypot(px-s.position[0],pz-s.position[2])<2.2))continue;
   const s=1.15+rng()*.5,normal=new T.Vector3(height(px-.4,pz)-height(px+.4,pz),.8,height(px,pz-.4)-height(px,pz+.4)).normalize(),rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),normal).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rng()*Math.PI*2));grass.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz)-.1,pz),rotation,new T.Vector3(s,.4+rng()*.23,s)));if(rng()<(regionAt(px,pz)==='Southwood'?.035:.008))ferns.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz),pz),rotation,new T.Vector3(.9,.9,.9)));
  }
  for(const [name,matrices] of [['grass',grass],['fern',ferns]] as const){if(!matrices.length)continue;const source=this.land.assets.prop(name);source.updateMatrixWorld(true);source.traverse(o=>{if(!(o instanceof T.Mesh))return;const mesh=new T.InstancedMesh(o.geometry,o.material,matrices.length),region=regionAt(cx*32+16,cz*32+16),tint=new T.Color(region==='Briar Heath'?'#f1dba9':region==='Ironward Heights'?'#d9d8c1':'#c3dfb8');matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m.clone().multiply(o.matrixWorld));mesh.setColorAt(i,tint);});mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);});}
  return group;
 }
}
