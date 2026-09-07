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
 private dressing=new T.Group();
 constructor(private land:Landscape){
  this.dressing.name='Authored medieval world dressing';land.scene.add(this.dressing);
  const cells=new Map<string,string[]>();for(const r of Object.values(land.state.resources).filter(r=>r.id.startsWith('wild-resource-'))){const key=Math.floor(r.position[0]/64)+','+Math.floor(r.position[2]/64)+','+r.kind;if(!cells.has(key))cells.set(key,[]);cells.get(key)!.push(r.id);}
  for(const ids of cells.values()){
   const source=land.assets.prop(land.state.resources[ids[0]].kind==='tree'?'oak_distant':'rock_1');source.updateMatrixWorld(true);
   source.traverse(o=>{if(!(o instanceof T.Mesh))return;const mesh=new T.InstancedMesh(o.geometry,o.material,ids.length),matrices:T.Matrix4[]=[];ids.forEach((id,i)=>{const r=land.state.resources[id],s=r.scale??1,mat=new T.Matrix4().compose(new T.Vector3(...r.position),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),r.rotation),new T.Vector3(s,s,s)).multiply(o.matrixWorld);matrices.push(mat);mesh.setMatrixAt(i,r.phase==='standing'?mat:new T.Matrix4().makeScale(0,0,0));});mesh.castShadow=false;mesh.receiveShadow=true;mesh.computeBoundingSphere();land.scene.add(mesh);this.proxies.push({mesh,ids,matrices});});
  }
  for(const site of Object.values(land.state.frontier?.sites??{})){const [x,,z]=site.position;land.place('chest',x,z);land.place('campfire',x+3,z+2);if(site.kind==='camp'){land.place('palisade',x-3,z-4,.15);land.place('palisade',x+3,z-4,-.15);}else {land.place('log',x-3,z,Math.PI/2,.6);if(site.kind==='rest'){land.place('workbench',x-3,z-2);const id=site.id+'-bench';land.state.stations[id]??={id,name:site.name+' workbench',kind:'workbench',position:[x-3,height(x-3,z-2),z-2]};}}this.dressFrontierSite(x,z,site.kind);}
  this.dressAlderbrook();
  this.update(0,true);
 }
 private visual(name:string,x:number,z:number,yaw=0,scale=1,yOffset=0){const o=this.land.assets.prop(name);o.position.set(x,height(x,z)+yOffset,z);o.rotation.y=yaw;o.scale.setScalar(scale);o.name='dressing '+name;o.traverse(c=>{if(c instanceof T.Mesh){c.castShadow=true;c.receiveShadow=true;}});this.dressing.add(o);return o;}
 private visualLocal(name:string,x:number,z:number,yaw:number,lx:number,lz:number,scale=1,extraYaw=0,yOffset=0){const c=Math.cos(yaw),s=Math.sin(yaw),wx=x+lx*c+lz*s,wz=z-lx*s+lz*c;return this.visual(name,wx,wz,yaw+extraYaw,scale,yOffset);}
 private dressFrontierSite(x:number,z:number,kind:string){
  const rng=seeded(Math.imul(Math.round(x*10),73856093)^Math.imul(Math.round(z*10),19349663));
  const approach:[[number,number],...Array<[number,number]>]=[[.15,4.65],[.42,3.72],[.92,2.86],[1.45,2.18]];
  approach.forEach(([dx,dz],i)=>this.visual('paving_0',x+dx+(rng()-.5)*.16,z+dz+(rng()-.5)*.12,(rng()-.5)*.28,.47+i*.035,.018));
  this.visual('satchel',x-.78,z+.45,-.45+rng()*.35,.72,.02);
  this.visual('stump',x+1.35,z+3.02,rng()*Math.PI*2,.38,.005);this.visual('stump',x+4.18,z+1.08,rng()*Math.PI*2,.34,.005);
  this.visual('rock_2',x-4.18,z+.92,rng()*Math.PI*2,.30,-.05);this.visual('rock_2',x+4.62,z-.58,rng()*Math.PI*2,.24,-.06);
  // Quaternius CC0 raid: make every frontier site read as occupied rather than generated primitives.
  this.visual('crate',x+1.15,z-.72,.18+rng()*.22,.72,.01);this.visual('crate',x+1.82,z-.48,-.31+rng()*.18,.54,.02);
  if(kind==='camp'){
   this.visual('palisade',x-4.12,z-2.18,Math.PI/2+.10,.60);this.visual('palisade',x+4.10,z-2.08,Math.PI/2-.12,.60);
   this.visual('palisade',x-5.05,z+.65,.43,.54);this.visual('palisade',x+5.08,z+.78,-.40,.54);
   this.visual('wagon',x+4.62,z+3.35,-.88+rng()*.18,.72,.015);
   this.visual('support',x-2.88,z+.32,.18,.82,.01);this.visual('support',x-3.02,z+2.18,-.14,.82,.01);
   this.visual('roof_wooden_2x1',x-2.94,z+1.28,.04,.78,2.15);
   this.visual('floor_wooddark',x-2.94,z+1.28,.04,.74,.025);
   this.visual('stump',x-1.72,z-1.18,rng()*Math.PI*2,.42,.005);
  }else{
   this.visual('palisade',x-4.05,z-3.18,.12,.54);this.visual('paving_0',x-2.85,z-1.15,-.18,.54,.018);
   if(kind==='rest'){this.visual('satchel',x-2.18,z-2.42,.30,.66,.02);this.visual('wagon',x+3.82,z-1.92,.72,.62,.01);}
   else {this.visual('crate',x-1.42,z-.62,.72,.62,.01);this.visual('fence_wood_single',x+3.15,z-2.55,-.24,.82,.01);}
  }
 }
 private dressAlderbrook(){
  const homes=[[-9,-34,.1],[9,-46,Math.PI],[-14,-54,.4],[14,-67,3.3]] as const;
  homes.forEach(([x,z,yaw],i)=>{
   const wide=typeof this.land.wideCottage==='function'?this.land.wideCottage(x,z,yaw):false,entryX=wide?-1.5:0,side=i%2?1:-1;
   [[entryX,5.18,.66,.04],[entryX+side*.12,6.02,.56,-.09],[entryX-side*.10,6.72,.47,.12]].forEach(([lx,lz,scale,rot])=>this.visualLocal('paving_0',x,z,yaw,lx,lz,scale,rot,.018));
   this.visualLocal('stump',x,z,yaw,entryX+side*(wide?2.55:1.85),4.62,.41,.25+i*.42,.006);
   this.visualLocal('satchel',x,z,yaw,entryX-side*(wide?2.05:1.48),5.02,.68,-.32+side*.16,.02);
   this.visualLocal('rock_2',x,z,yaw,side*(wide?3.85:2.62),2.55,.29,.42+i*.23,-.06);
   this.visualLocal('rock_2',x,z,yaw,side*(wide?4.08:2.82),.92,.22,-.25+i*.17,-.07);
  });
  [[4.12,-25.08,.62,-.18],[5.05,-24.46,.55,.10],[5.95,-25.16,.50,-.08],[5.78,-27.10,.47,.18],[4.42,-27.16,.49,-.14],[6.30,-29.70,.52,.10],[7.20,-30.35,.47,-.08]].forEach(([x,z,s,r])=>this.visual('paving_0',x,z,r,s,.018));
  this.visual('stump',3.82,-26.65,.30,.39,.006);this.visual('stump',6.45,-26.82,-.20,.35,.006);this.visual('satchel',6.18,-30.56,.42,.70,.02);
  [[-20.5,-38.5,.98],[-21.4,-56.8,1.08],[20.6,-50.8,.92],[22.3,-63.2,1.12],[-19.5,-70.8,.88],[19.8,-76.0,1.02]].forEach(([x,z,s],i)=>{this.visual('fern',x,z,i*.73,s);this.visual('rock_2',x+(i%2?.8:-.7),z+(i%3-.8)*.7,i*.51,.24+(i%3)*.035,-.08);});
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
 dispose(){for(const b of this.proxies)b.mesh.dispose();for(const group of this.chunks.values())group.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();});this.dressing.removeFromParent();}
 private cover(cx:number,cz:number){
  const group=new T.Group();group.name=`frontier cover ${cx},${cz}`;this.land.scene.add(group);
  const rng=seeded((this.land.state.frontier?.seed??1)^Math.imul(cx,73856093)^Math.imul(cz,19349663)),grass:T.Matrix4[]=[],ferns:T.Matrix4[]=[],rocks:T.Matrix4[]=[],logs:T.Matrix4[]=[];
  const midX=cx*32+16,midZ=cz*32+16,treeRoots=Object.values(this.land.state.resources).filter(r=>r.id.startsWith('wild-resource-')&&r.kind==='tree'&&r.phase==='standing'&&Math.abs(r.position[0]-midX)<48&&Math.abs(r.position[2]-midZ)<48).map(r=>r.position),sites=Object.values(this.land.state.frontier?.sites??{}).map(s=>s.position),structures=Object.values(this.land.state.structures);
  for(let x=cx*32;x<(cx+1)*32;x+=1.02)for(let z=cz*32;z<(cz+1)*32;z+=1.02){
   const px=x+rng()*.72,pz=z+rng()*.72;let siteDistance=Infinity;for(const site of sites)siteDistance=Math.min(siteDistance,Math.hypot(px-site[0],pz-site[2]));if(!frontierArea(px,pz)||Math.abs(px)<110&&pz<80||trailDistance(px,pz)<2.45||this.land.ambientOccupied(px,pz)||height(px,pz)<-1||siteDistance<2.25||structures.some(s=>Math.hypot(px-s.position[0],pz-s.position[2])<2.4))continue;
   let canopy=0;for(const root of treeRoots){const dx=px-root[0],dz=pz-root[2],d2=dx*dx+dz*dz;if(d2<90)canopy=Math.max(canopy,Math.exp(-d2/23));}
   const region=regionAt(px,pz),woods=Math.max(forestDensity(px,pz),canopy*.92),edge=forestEdge(px,pz),meadow=meadowDensity(px,pz),siteWear=1-T.MathUtils.smoothstep(siteDistance,2.25,5.8),siteEdge=T.MathUtils.smoothstep(siteDistance,3.4,5.0)*(1-T.MathUtils.smoothstep(siteDistance,5.0,7.0));
   const regionGrass=region==='Briar Heath'?.92:region==='Ironward Heights'?.46:.72,grassChance=Math.max(.035,Math.min(.92,regionGrass*(.28+meadow*.76)*(1-woods*.62)+edge*.12)*(1-siteWear*.74));
   const normal=new T.Vector3(height(px-.4,pz)-height(px+.4,pz),.8,height(px,pz-.4)-height(px,pz+.4)).normalize(),rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),normal).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rng()*Math.PI*2));
   if(rng()<grassChance){const s=1.02+rng()*.55,h=(.29+rng()*.23+meadow*.12)*(1-canopy*.42)*(1-siteWear*.24);grass.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz)-.1,pz),rotation,new T.Vector3(s,h,s)));}
   const fernChance=((region==='Southwood'?.018:.004)+edge*.035+canopy*(1-canopy)*.055)*(1-siteWear*.62)+siteEdge*.012;if(rng()<fernChance){const s=.76+rng()*.68;ferns.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz),pz),rotation,new T.Vector3(s,s,s)));}
   const cluster=edge*.55+canopy*.45;if(rng()<.004+cluster*.005+siteEdge*.010){const s=.22+rng()*.42;rocks.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz)-.09,pz),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rng()*Math.PI*2),new T.Vector3(s*1.45,s*.62,s)));}
   if(canopy>.2&&canopy<.78&&rng()<.0015+edge*.0025+siteEdge*.0018){const s=.48+rng()*.32;logs.push(new T.Matrix4().compose(new T.Vector3(px,height(px,pz)+.02,pz),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),rng()*Math.PI*2),new T.Vector3(s,s,s)));}
  }
  const region=regionAt(midX,midZ),grassTint=new T.Color(region==='Briar Heath'?'#ead7aa':region==='Ironward Heights'?'#d2d0bf':'#c9ddb4'),fernTint=new T.Color(region==='Ironward Heights'?'#c8ceb8':'#d1e0b9');
  const add=(name:string,matrices:T.Matrix4[],tint?:T.Color,cast=false)=>{if(!matrices.length)return;const source=this.land.assets.prop(name);source.updateMatrixWorld(true);source.traverse(o=>{if(!(o instanceof T.Mesh))return;const mesh=new T.InstancedMesh(o.geometry,o.material,matrices.length);matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m.clone().multiply(o.matrixWorld));if(tint)mesh.setColorAt(i,tint);});mesh.castShadow=cast;mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);});};
  add('grass',grass,grassTint);add('fern',ferns,fernTint);add('rock_2',rocks,undefined,true);add('log',logs,undefined,true);
  return group;
 }
}
