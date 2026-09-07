import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {Landscape} from './landscape';
import {frontierArea,seeded,trailDistance,regionAt} from './worldgen';
import {height} from './terrain';
import {forestDensity,forestEdge,meadowDensity} from './ecology';

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
  const group=new T.Group();group.name=`frontier cover ${cx},${cz}`;this.land.scene.add(group);
  const rng=seeded((this.land.state.frontier?.seed??1)^Math.imul(cx,73856093)^Math.imul(cz,19349663)),grass:T.Matrix4[]=[],ferns:T.Matrix4[]=[],rocks:T.Matrix4[]=[],logs:T.Matrix4[]=[];
  const midX=cx*32+16,midZ=cz*32+16,treeRoots=Object.values(this.land.state.resources).filter(r=>r.id.startsWith('wild-resource-')&&r.kind==='tree'&&r.phase==='standing'&&Math.abs(r.position[0]-midX)<48&&Math.abs(r.position[2]-midZ)<48).map(r=>r.position);
  for(let x=cx*32;x<(cx+1)*32;x+=1.02)for(let z=cz*32;z<(cz+1)*32;z+=1.02){
   const px=x+rng()*.72,pz=z+rng()*.72;if(!frontierArea(px,pz)||Math.abs(px)<110&&pz<80||trailDistance(px,pz)<2.45||this.land.ambientOccupied(px,pz)||height(px,pz)<-1||Object.values(this.land.state.frontier?.sites??{}).some(s=>Math.hypot(px-s.position[0],pz-s.position[2])<4.5)||Object.values(this.land.state.structures).some(s=>Math.hypot(px-s.position[0],pz-s.position[2])<2.4))continue;
   let canopy=0;for(const root of treeRoots){const dx=px-root[0],dz=pz-root[2],d2=dx*dx+dz*dz;if(d2<90)canopy=Math.max(canopy,Math.exp(-d2/23));}
   const region=regionAt(px,pz),woods=Math.max(forestDensity(px,pz),canopy*.92),edge=forestEdge(px,pz),meadow=meadowDensity(px,pz);
   const regionGrass=region==='Briar Heath'?.92:region==='Ironward Heights'?.46:.72,grassChance=Math.max(.08,Math.min(.92,regionGrass*(.28+meadow*.76)*(1-woods*.62)+edge*.12));
   const normal=new T.Vector3(height(px-.4,pz)-height(px+.4,pz),.8,height(px,pz-.4)-height(px,pz+.4)).normalize(),rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),normal).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rng()*Math.PI*2));
   if(rng()<grassChance){const s=1.02+rng()*.55,h=(.29+rng()*.23+meadow*.12)*(1-canopy*.42);grass.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz)-.1,pz),rotation,new T.Vector3(s,h,s)));}
   const fernChance=(region==='Southwood'?.018:.004)+edge*.035+canopy*(1-canopy)*.055;if(rng()<fernChance){const s=.76+rng()*.68;ferns.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz),pz),rotation,new T.Vector3(s,s,s)));}
   const cluster=edge*.55+canopy*.45;if(rng()<.004+cluster*.005){const s=.22+rng()*.42;rocks.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz)-.09,pz),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rng()*Math.PI*2),new T.Vector3(s*1.45,s*.62,s)));}
   if(canopy>.2&&canopy<.78&&rng()<.0015+edge*.0025){const s=.48+rng()*.32;logs.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz)+.02,pz),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rng()*Math.PI*2),new T.Vector3(s,s,s)));}
  }
  const region=regionAt(midX,midZ),grassTint=new T.Color(region==='Briar Heath'?'#ead7aa':region==='Ironward Heights'?'#d2d0bf':'#c9ddb4'),fernTint=new T.Color(region==='Ironward Heights'?'#c8ceb8':'#d1e0b9');
  const add=(name:string,matrices:T.Matrix4[],tint?:T.Color,cast=false)=>{if(!matrices.length)return;const source=this.land.assets.prop(name);source.updateMatrixWorld(true);source.traverse(o=>{if(!(o instanceof T.Mesh))return;const mesh=new T.InstancedMesh(o.geometry,o.material,matrices.length);matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m.clone().multiply(o.matrixWorld));if(tint)mesh.setColorAt(i,tint);});mesh.castShadow=cast;mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);});};
  add('grass',grass,grassTint);add('fern',ferns,fernTint);add('rock_2',rocks,undefined,true);add('log',logs,undefined,true);
  return group;
 }
}
