import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from './assets';
import type {WorldState} from './state';
import {height,roadX} from './terrain';
import {noise2,distantGround,meadowDensity} from './ecology';
import {groundMaterial} from './ground-material';
import {structureParts,makeStructureCollider} from './structure-geometry';
import type {BuildKind} from './definitions';
import {seedBounties} from './bounties';
import {seedExpedition} from './expedition';
import {seedFrontier,WORLD_SIZE,frontierArea,trailDistance} from './worldgen';
import {FrontierRenderer} from './frontier-renderer';
export {height,roadX} from './terrain';
export function random(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export class Landscape {
 resources=new Map<string,T.Object3D>();forage=new Map<string,T.Object3D>(); colliders=new Map<string,RAPIER.Collider>(); water!:T.Mesh; fireLights:T.PointLight[]=[];
 foliageBatches:{mesh:T.InstancedMesh;placements:{x:number;z:number}[];matrices:T.Matrix4[]}[]=[];structureSignature='uninitialized';
 frontier!:FrontierRenderer;
 cottageWidths=new Map<string,boolean>();
 consolidateArchitecture(group:T.Group){
  group.updateMatrixWorld(true);const batches=new Map<T.Material,T.BufferGeometry[]>();let supported=true;
  group.traverse(o=>{if(o instanceof T.Mesh&&Array.isArray(o.material))supported=false;});if(!supported)return;
  group.traverse(o=>{if(o instanceof T.Mesh){const material=o.material as T.Material;if(!batches.has(material))batches.set(material,[]);batches.get(material)!.push(o.geometry.clone().applyMatrix4(o.matrixWorld));}});
  group.clear();for(const [material,geometries] of batches){const merged=mergeGeometries(geometries,false);for(const geometry of merged?[merged]:geometries){const mesh=new T.Mesh(geometry,material);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);}if(merged)for(const geometry of geometries)geometry.dispose();}
 }
 constructor(public scene:T.Scene|T.Group,public assets:Assets,public physics:RAPIER.World,public state:WorldState){this.populate();seedExpedition(state);seedBounties(state);seedFrontier(state);this.expeditionCamps();this.terrain();this.frontier=new FrontierRenderer(this);}
 terrain(){const geo=new T.PlaneGeometry(WORLD_SIZE,WORLD_SIZE,324,324);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;const colors=[],soil=[];const roots=Object.values(this.state.resources).filter(r=>r.kind==='tree'&&!r.id.startsWith('wild-resource-')).map(r=>r.position);
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,height(x,z));const road=z>45||frontierArea(x,z)?trailDistance(x,z):Math.abs(x-roadX(z)),n=noise2(x*.095,z*.095),patch=noise2(x*.035+9,z*.035);const c=new T.Color().setRGB(.84,.85,.73).lerp(new T.Color().setRGB(.94,.87,.73),patch*.4);c.multiplyScalar(.84+n*.2);colors.push(c.r,c.g,c.b);
   const litter=Math.max(0,...roots.map(p=>Math.exp(-((x-p[0])**2+(z-p[2])**2)/13))),edge=Math.max(0,1-(road-1.8)/2);soil.push(Math.min(1,Math.max(litter*.95,edge*.94,Math.max(0,patch-.54)*.9)));
  }
  geo.setAttribute('soilMix',new T.Float32BufferAttribute(soil,1));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const tex=this.assets.textures.meadow.clone();tex.repeat.set(140*WORLD_SIZE/520,140*WORLD_SIZE/520);tex.needsUpdate=true;
  const ground=new T.Mesh(geo,groundMaterial(tex,this.assets.textures.soil));ground.receiveShadow=true;ground.name='March terrain';this.scene.add(ground);
  this.physics.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(pos.array),new Uint32Array(geo.index!.array)));
  // A shallow irregular pond occupies the depression below the western road.
  const shape=new T.Shape();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2;const r=1+.07*Math.sin(a*7)+.035*Math.sin(a*13);const x=-31+Math.cos(a)*10*r,z=-12+Math.sin(a)*23*r;if(!i)shape.moveTo(x,-z);else shape.lineTo(x,-z);}const wg=new T.ShapeGeometry(shape);wg.rotateX(-Math.PI/2);
  this.water=new T.Mesh(wg,new T.MeshPhysicalMaterial({color:'#437b88',metalness:.22,roughness:.22,transparent:true,opacity:.82}));this.water.position.y=-1.3;this.scene.add(this.water);
  const highland=this.assets.prop('highland');highland.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=false;});this.scene.add(highland);
  const woods=[],rr=random(922);for(let i=0;i<2300;i++){const x=(rr()-.5)*680,z=-85-rr()*275;if(noise2(x*.025,z*.025)<.31||Math.abs(x-roadX(z))<9)continue;const y=distantGround(x,z,height)-.8;if(!Number.isFinite(y)||y>92)continue;const s=.75+rr()*.8;woods.push({x,z,y,scale:new T.Vector3(s,s,s),yaw:rr()*6.28});}this.batch('oak_distant',woods);
 }
 place(name:string,x:number,z:number,yaw=0,scale=1,y?:number){const o=this.assets.prop(name);o.position.set(x,y??height(x,z),z);o.rotation.y=yaw;o.scale.setScalar(scale);this.scene.add(o);const shape:Record<string,[number,number,number]>={workbench:[.9,.45,.42],chest:[.55,.3,.36],palisade:[1.4,1.2,.15]};if(shape[name]){const [sx,sy,sz]=shape[name];this.physics.createCollider(RAPIER.ColliderDesc.cuboid(sx*scale,sy*scale,sz*scale).setTranslation(x,o.position.y+sy*scale,z).setRotation(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw)));}return o;}
 batch(name:string,placements:{x:number;z:number;y?:number;scale:T.Vector3;yaw:number}[]){
  const source=this.assets.prop(name);source.updateMatrixWorld(true);const dummy=new T.Object3D(),cover=name==='grass'||name==='fern';
  if(cover)placements=placements.filter(p=>!this.ambientOccupied(p.x,p.z));
  const groups=new Map<string,typeof placements>(),tile=name==='oak_distant'?72:cover?24:10000;
  for(const p of placements){const key=Math.floor(p.x/tile)+','+Math.floor(p.z/tile);if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(p);}
  for(const patch of groups.values())source.traverse(o=>{
   if(!(o instanceof T.Mesh))return;
   const mesh=new T.InstancedMesh(o.geometry,o.material,patch.length),matrices:T.Matrix4[]=[];
   for(let i=0;i<patch.length;i++){const p=patch[i];dummy.position.set(p.x,p.y??height(p.x,p.z),p.z);dummy.rotation.set(0,p.yaw,0);if(name==='grass'){const normal=new T.Vector3(height(p.x-.4,p.z)-height(p.x+.4,p.z),.8,height(p.x,p.z-.4)-height(p.x,p.z+.4)).normalize();dummy.quaternion.premultiply(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),normal));}dummy.scale.copy(p.scale);dummy.updateMatrix();const matrix=dummy.matrix.clone().multiply(o.matrixWorld);mesh.setMatrixAt(i,matrix);if(cover)matrices.push(matrix);}
   if(cover)this.foliageBatches.push({mesh,placements:patch,matrices});
   mesh.name=name+' patch';mesh.castShadow=!['grass','oak_distant'].includes(name);mesh.receiveShadow=name!=='oak_distant';mesh.computeBoundingSphere();this.scene.add(mesh);
  });
 }
 wideCottage(x:number,z:number,yaw:number){const key=x+','+z;if(this.cottageWidths.has(key))return this.cottageWidths.get(key)!;const occupied=(p:number[],margin:number)=>{const dx=p[0]-x,dz=p[2]-z,px=dx*Math.cos(yaw)-dz*Math.sin(yaw),pz=dx*Math.sin(yaw)+dz*Math.cos(yaw);return Math.abs(px)<3.2+margin&&pz>-1.7-margin&&pz<6.5+margin;};const wide=!Object.values(this.state.structures).some(s=>occupied(s.position,1.6))&&!Object.values(this.state.resources).some(r=>r.kind==='tree'&&r.phase==='standing'&&occupied(r.position,.85));this.cottageWidths.set(key,wide);return wide;}
 ambientOccupied(x:number,z:number){if(Object.values(this.state.stations).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<1.9))return true;return [[-9,-34,.1],[9,-46,Math.PI],[-14,-54,.4],[14,-67,3.3]].some(([cx,cz,yaw])=>{const dx=x-cx,dz=z-cz,px=dx*Math.cos(yaw)-dz*Math.sin(yaw),pz=dx*Math.sin(yaw)+dz*Math.cos(yaw),wide=this.wideCottage(cx,cz,yaw);return Math.abs(px)<(wide?3.65:2.2)&&pz>-2.3&&pz<(wide?6.7:5.3);});}
 clearBuiltGround(){const signature=Object.keys(this.state.structures).join(',');if(signature===this.structureSignature)return;this.structureSignature=signature;const built=Object.values(this.state.structures).filter(s=>['foundation','workbench','campfire','chest'].includes(s.kind));const hidden=new T.Matrix4().makeScale(0,0,0);for(const batch of this.foliageBatches){batch.placements.forEach((p,i)=>{const covered=[...Object.values(this.state.expeditionSites??{}),...Object.values(this.state.bountySites??{})].some(s=>Math.hypot(p.x-s.position[0],p.z-s.position[2])<2.2)||built.some(s=>s.kind==='foundation'?Math.abs(p.x-s.position[0])<1.8&&Math.abs(p.z-s.position[2])<1.8:Math.hypot(p.x-s.position[0],p.z-s.position[2])<1.25);batch.mesh.setMatrixAt(i,covered?hidden:batch.matrices[i]);});batch.mesh.instanceMatrix.needsUpdate=true;}}
 cottage(x:number,z:number,yaw:number){
  const group=new T.Group(),base=height(x,z),rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw);
  const part=(name:string,px:number,py:number,pz:number,r=0)=>{const o=this.assets.prop(name);o.position.set(px,py,pz);o.rotation.y=r;group.add(o);const position=new T.Vector3(px,py,pz).applyQuaternion(rotation).add(new T.Vector3(x,base,z)).toArray() as [number,number,number];for(const shape of structureParts(name as BuildKind))makeStructureCollider(this.physics,position,yaw+r,shape);return {o,position};};
  if(this.wideCottage(x,z,yaw)){
   group.name='Village longhouse';
   for(let bay=0;bay<2;bay++){for(const cx of [-1.5,1.5])part('foundation',cx,0,bay*3);part(bay?'window':'wall',-3,.44,bay*3,-Math.PI/2);part('window',3,.44,bay*3,Math.PI/2);}
   part('doorway',-1.5,.44,4.5);part('window',1.5,.44,4.5);for(const cx of [-1.5,1.5])part('window',cx,.44,-1.5,Math.PI);
   part('village_roof',0,3.14,1.5);part('village_gable',0,3.14,4.5);part('village_gable',0,3.14,-1.5,Math.PI);part('village_details',0,0,0);
   const door=part('door',-2.04,.44,4.4,-Math.PI/2);makeStructureCollider(this.physics,door.position,yaw-Math.PI/2,{center:[.54,1.05,0],half:[.54,.99,.06]});
   for(const side of [-1,1])makeStructureCollider(this.physics,[x,base+3.14,z],yaw,{center:[side*1.73,1.22,1.5],half:[2.18,.16,3.4],roll:-side*Math.atan(.82)});
   for(const px of [-2.65,-.35])makeStructureCollider(this.physics,[x,base,z],yaw,{center:[px,1.2,6.12],half:[.075,1.2,.08]});
   for(let i=0;i<3;i++)makeStructureCollider(this.physics,[x,base,z],yaw,{center:[-1.5,.36-i*.12,4.76+i*.38],half:[.825,.07,.23]});
   makeStructureCollider(this.physics,[x,base,z],yaw,{center:[2.35,3.45,-.65],half:[.46,3.45,.46]});
   makeStructureCollider(this.physics,[x,base,z],yaw,{center:[1.65,.72,5.13],half:[1.14,.72,.60]});
   this.consolidateArchitecture(group);group.position.set(x,base,z);group.rotation.y=yaw;this.scene.add(group);return group;
  }
  for(let bay=0;bay<2;bay++){const dz=bay*3;part('foundation',0,0,dz);part('wall',-1.5,.44,dz,-Math.PI/2);part('window',1.5,.44,dz,Math.PI/2);part('roof',0,3.14,dz);}
  part('doorway',0,.44,4.5);part('window',0,.44,-1.5,Math.PI);part('gable',0,3.14,4.5);part('gable',0,3.14,-1.5,Math.PI);
  const door=part('door',-.54,.44,4.4,-Math.PI/2);makeStructureCollider(this.physics,door.position,yaw-Math.PI/2,{center:[.54,1.05,0],half:[.54,.99,.06]});
  group.position.set(x,base,z);group.rotation.y=yaw;this.scene.add(group);return group;
 }
 populate(){const rng=random(829);const trees:[[number,number],...Array<[number,number]>]=[[-6,16],[8,12],[-10,1],[10,-8],[-16,-19],[15,-26]];for(let i=0;i<54;i++){const x=(rng()-.5)*140,z=rng()*155-105;if(Math.abs(x-roadX(z))>7&&!(x<-20&&x>-43&&z<15&&z>-43))trees.push([x,z]);}
  if(!Object.values(this.state.resources).some(r=>r.kind==='tree'))trees.forEach(([x,z],i)=>{if(height(x,z)<-1.1||Object.values(this.state.structures).some(s=>s.kind==='foundation'&&Math.abs(x-s.position[0])<3&&Math.abs(z-s.position[2])<3)||Object.values(this.state.resources).some(r=>r.kind==='tree'&&Math.hypot(x-r.position[0],z-r.position[2])<5.5))return;const id='oak-'+i;this.state.resources[id]={id,kind:'tree',position:[x,height(x,z),z],variant:i%3,health:6,phase:'standing',rotation:random(i+811)()*6.28,scale:i<2?1.12:.75+random(i+1709)()*.4};});
  for(const s of Object.values(this.state.resources).filter(r=>r.kind==='tree'&&!r.id.startsWith('wild-resource-'))){const [sx,sy,sz]=s.position;s.scale??=.95;if(s.phase==='fallen'){this.place('stump',sx,sz,s.rotation,s.scale,sy);continue;}const o=this.place('oak_'+s.variant,sx,sz,s.rotation,s.scale,sy);o.userData.entityId=s.id;this.resources.set(s.id,o);const col=this.physics.createCollider(RAPIER.ColliderDesc.cylinder(3,.78*s.scale).setTranslation(sx,sy+3,sz));this.colliders.set(s.id,col);}
  const stones=[];for(let z=34;z>-76;z-=.48)for(let j=0;j<8;j++){if(rng()<.08)continue;const x=roadX(z)+(j-3.5)*.40+(rng()-.5)*.09,zz=z+rng()*.12;stones.push({x,z:zz,y:height(x,zz)+.012,scale:new T.Vector3(.19+rng()*.065,.32,.18+rng()*.05),yaw:rng()*6.28});}this.batch('paving_0',stones);
  // Jittered coverage cells prevent the conspicuous bald holes of random sprinkling.
  const clumps=[];const grassRng=random(197);for(let gx=-125;gx<125;gx+=.60)for(let gz=-165;gz<100;gz+=.60){const x=gx+(grassRng()-.5)*.43,z=gz+(grassRng()-.5)*.43,road=z>45?trailDistance(x,z):Math.abs(x-roadX(z));if(road<2.1||height(x,z)<-1.1)continue;const edge=T.MathUtils.smoothstep(Math.min(125-Math.abs(x),z+165,100-z),0,35);if(grassRng()>edge)continue;const patch=T.MathUtils.smoothstep(noise2(x*.065+4,z*.065),.28,.72),density=meadowDensity(x,z),s=1.13+grassRng()*.40;clumps.push({x,z,y:height(x,z)-.10,scale:new T.Vector3(s,(.30+patch*.30+density*.06+grassRng()*.08)*(.65+edge*.35),s),yaw:grassRng()*6.28});}this.batch('grass',clumps);
  // Preserve the older generator's random sequence for saved resource IDs.
  for(let i=0;i<5600;i++){const x=(rng()-.5)*125,z=rng()*135-90;if(Math.abs(x-roadX(z))<3.4||height(x,z)<-1.1)continue;rng();rng();rng();rng();}
  const ferns=[];for(let i=0;i<1100;i++){const x=(rng()-.5)*110,z=rng()*115-70;if(Math.abs(x-roadX(z))<3.5||height(x,z)<-1.1||noise2(x*.09,z*.09)<.45)continue;ferns.push({x,z,scale:new T.Vector3(1,1,1).multiplyScalar(.85+rng()*.9),yaw:rng()*6.28});}this.batch('fern',ferns);
  // Woodland floor composition: clustered stone shelves and ferns around the
  // existing resource roots, never random obstacles across the road or homes.
  const det=random(7301),rubble:Parameters<Landscape['batch']>[1]=[];
  for(const tree of Object.values(this.state.resources).filter(r=>r.kind==='tree'&&!r.id.startsWith('wild-resource-')))for(let i=0;i<6;i++){
   const a=det()*Math.PI*2,d=2+det()*3.5,x=tree.position[0]+Math.cos(a)*d,z=tree.position[2]+Math.sin(a)*d;
   if(Math.abs(x-roadX(z))<3.1||this.ambientOccupied(x,z)||height(x,z)<-1.1||Object.values(this.state.structures).some(s=>s.kind==='foundation'&&Math.abs(x-s.position[0])<2&&Math.abs(z-s.position[2])<2))continue;
   const s=.2+det()*.55;rubble.push({x,z,y:height(x,z)-.12,scale:new T.Vector3(s*1.4,s*.62,s),yaw:a});
  }this.batch('rock_2',rubble);
  if(!Object.values(this.state.resources).some(r=>r.kind==='rock')){const ores=random(1287);for(let i=0;i<26;i++){const x=(ores()-.5)*92,z=ores()*100-64;if(Math.abs(x-roadX(z))<5||height(x,z)<-1.1)continue;if(Object.values(this.state.resources).some(r=>Math.hypot(x-r.position[0],z-r.position[2])<3)||Object.values(this.state.structures).some(s=>s.kind==='foundation'&&Math.abs(x-s.position[0])<2.7&&Math.abs(z-s.position[2])<2.7))continue;const id='ore-'+i;this.state.resources[id]={id,kind:'rock',position:[x,height(x,z),z],variant:i%3,health:4,phase:'standing',rotation:ores()*6.28};}}
  for(const s of Object.values(this.state.resources).filter(r=>r.kind==='rock'&&!r.id.startsWith('wild-resource-'))){if(s.phase!=='standing')continue;const [sx,sy,sz]=s.position;const o=this.place('rock_'+s.variant,sx,sz,s.rotation,1,sy);this.resources.set(s.id,o);const c=this.physics.createCollider(RAPIER.ColliderDesc.ball(.85).setTranslation(sx,sy+.55,sz));this.colliders.set(s.id,c);}
  [[-9,-34,.1],[9,-46,Math.PI],[-14,-54,.4],[14,-67,3.3]].forEach(([x,z,r])=>this.cottage(x,z,r));
  this.place('workbench',7,-31,.3);this.place('campfire',5,-26);this.place('chest',9,-31,.2);
  for(const [id,name,x,z] of [['village-supplies','Alderbrook supply chest',9,-31],['raider-cache','Raider provisions',41,-25]] as const){this.state.containers[id]??={id,name,position:[x,height(x,z),z],inventory:id==='raider-cache'?[{id:'cache-hide',item:'hide',count:6,quality:1},{id:'cache-iron',item:'iron',count:6,quality:1},{id:'cache-venison',item:'venison',count:3,quality:1}]:[],looted:false};}
  [[-5,10],[6,5],[-8,-10],[6,-20],[-6,-28],[12,-35],[22,-12],[17,8]].forEach(([x,z],i)=>{const id='flax-'+i;const f=this.state.forage[id]??{id,position:[x,height(x,z),z] as [number,number,number],harvested:false};this.state.forage[id]=f;if(!f.harvested)this.forage.set(id,this.place('flax',f.position[0],f.position[2]));});
  [[5,-26],[37,-22]].forEach(([x,z])=>{const l=new T.PointLight('#ffa657',4,8);l.position.set(x,height(x,z)+.6,z);this.scene.add(l);this.fireLights.push(l);});
  for(let i=0;i<5;i++)this.place('palisade',31+i*2.7,-29,0);this.place('campfire',37,-22);this.place('chest',41,-25);this.place('workbench',40,-23,1.6);
 }
 expeditionCamps(){
  for(const site of [...Object.values(this.state.expeditionSites??{}),...Object.values(this.state.bountySites??{})]){
   const [x,,z]=site.position;this.place('chest',x,z);
   // Recompose the authored kit, leaving a broad south-facing escape route.
   for(const side of [-1,1])this.place('palisade',x+side*3,z-4,side*.18);
   this.place('campfire',x+3,z+2);
   const id='expedition-fire-'+site.id;this.state.stations[id]??={id,name:site.name+' campfire',kind:'campfire',position:[x+3,height(x+3,z+2),z+2]};
   const l=new T.PointLight('#ffa657',4,8);l.position.set(x+3,height(x+3,z+2)+.6,z+2);this.scene.add(l);this.fireLights.push(l);
  }
 }
 update(t:number){this.frontier?.update(t);this.clearBuiltGround();for(const [id,o] of this.forage)if(this.state.forage[id].harvested){o.removeFromParent();this.forage.delete(id);}this.assets.time.value=t;(this.water.material as T.MeshPhysicalMaterial).roughness=.24+Math.sin(t*.4)*.035;this.fireLights.forEach((l,i)=>l.intensity=4+Math.sin(t*11+i)*.4+Math.sin(t*17)*.25);}
}
