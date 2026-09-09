import * as T from 'three';
import {Assets} from './assets';
import {Landscape} from './landscape';
import {forestDensity} from './ecology';
import {height} from './terrain';
import {FOREST_CONTACT_CAPACITY,FOREST_CONTACT_SEGMENTS,PerceptualGovernor,forestVisualHash,observerRingQuality,rockPhenotype,treePhenotype,type ObserverRingId} from './forest-singularity';
import {allocatePerceptualBudget} from './perceptual-resource-market';

const INSTALL=Symbol.for('alderwatch.forest-singularity.v1');
const CONTACT=Symbol.for('alderwatch.forest-contact-field.v1');
const GOVERNOR=Symbol.for('alderwatch.perceptual-governor.v1');
const GRASS_FIELD=Symbol.for('alderwatch.observerGrassField.v3');
const LEAF_MARK=Symbol.for('alderwatch.forest-leaf-depth.v1');
const UP=new T.Vector3(0,1,0);
const leafDetailUniforms=new Set<{value:number}>();

function leafDepth(material:T.MeshStandardMaterial){
 if((material as any)[LEAF_MARK]||material.name!=='AW_leaf'||!material.map)return;
 (material as any)[LEAF_MARK]=true;
 material.alphaToCoverage=true;material.side=T.DoubleSide;material.roughness=Math.max(.94,material.roughness);
 const detail={value:1};material.userData.awLeafDetailQuality=detail;leafDetailUniforms.add(detail);
 const previous=material.onBeforeCompile,oldKey=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);shader.uniforms.awLeafDetailQuality=detail;
  shader.vertexShader='varying vec2 awTreeAnchor;varying vec3 awLeafWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('void main() {',`void main() {
   vec4 awLeafLocal=vec4(position,1.0),awAnchorLocal=vec4(0.0,0.0,0.0,1.0);
   #ifdef USE_INSTANCING
    awLeafLocal=instanceMatrix*awLeafLocal;awAnchorLocal=instanceMatrix*awAnchorLocal;
   #endif
   awLeafWorld=(modelMatrix*awLeafLocal).xyz;awTreeAnchor=(modelMatrix*awAnchorLocal).xz;
  `);
  shader.fragmentShader='uniform float awLeafDetailQuality;varying vec2 awTreeAnchor;varying vec3 awLeafWorld;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   #ifdef USE_MAP
    if(awLeafDetailQuality>.62){
     float awTreeIdentity=fract(sin(dot(floor(awTreeAnchor*.115),vec2(12.9898,78.233)))*43758.5453123);
     float awLeafFootprint=max(length(dFdx(vMapUv)),length(dFdy(vMapUv)));
     float awLeafReadable=(1.0-smoothstep(.045,.15,awLeafFootprint))*awLeafDetailQuality;
     float awBack=gl_FrontFacing?0.0:1.0;
     float awCrownFleck=.5+.5*sin(awLeafWorld.y*.71+awLeafWorld.x*.13-awLeafWorld.z*.11+awTreeIdentity*4.7);
     vec3 awCool=vec3(.93,1.025,.90),awWarm=vec3(1.045,.995,.82);
     diffuseColor.rgb*=mix(awCool,awWarm,.18+.52*awTreeIdentity);
     diffuseColor.rgb*=mix(.96,1.055,awCrownFleck*(.28+.42*awLeafReadable));
     diffuseColor.rgb+=vec3(.055,.085,.018)*awBack*awLeafReadable*(.45+.55*awTreeIdentity);
    }
   #endif
  `);
 };
 material.customProgramCacheKey=()=>oldKey()+'-forest-leaf-depth-v1-perceptual-market';material.needsUpdate=true;
}

function installCanopyDepth(assets:Assets){
 const seen=new Set<T.Material>();assets.kit?.scene.traverse(o=>{if(!(o instanceof T.Mesh))return;for(const m of (Array.isArray(o.material)?o.material:[o.material])){if(seen.has(m))continue;seen.add(m);leafDepth(m as T.MeshStandardMaterial);}});
}

function contactGeometry(){
 const positions:number[]=[0,.006,0],normals:number[]=[0,1,0],indices:number[]=[];
 for(let i=0;i<FOREST_CONTACT_SEGMENTS;i++){
  const a=i/FOREST_CONTACT_SEGMENTS*Math.PI*2,r=.82+.18*forestVisualHash(i,FOREST_CONTACT_SEGMENTS,401);
  positions.push(Math.cos(a)*r,.006,Math.sin(a)*r);normals.push(0,1,0);
 }
 for(let i=0;i<FOREST_CONTACT_SEGMENTS;i++)indices.push(0,1+i,1+(i+1)%FOREST_CONTACT_SEGMENTS);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setIndex(indices);geometry.computeBoundingSphere();return geometry;
}

class GroundContactField{
 mesh:T.InstancedMesh;dummy=new T.Object3D();normal=new T.Vector3();slope=new T.Quaternion();next=0;lastX=Infinity;lastZ=Infinity;quality=1;
 constructor(public landscape:Landscape){
  const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  material.name='Alderwatch forest contact field';
  this.mesh=new T.InstancedMesh(contactGeometry(),material,FOREST_CONTACT_CAPACITY);this.mesh.name='Observer forest contact field';this.mesh.count=0;this.mesh.castShadow=false;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);landscape.scene.add(this.mesh);
 }
 setQuality(quality:number){this.quality=quality;this.mesh.visible=quality>.02;}
 update(force=false){
  if(!this.mesh.visible)return;const player=Object.values(this.landscape.state.players)[0];if(!player)return;const [px,,pz]=player.position,now=performance.now();
  const interval=360/Math.max(.35,this.quality);if(!force&&now<this.next&&Math.hypot(px-this.lastX,pz-this.lastZ)<1.1)return;this.next=now+interval;this.lastX=px;this.lastZ=pz;
  const candidates=(Object.values(this.landscape.state.resources) as any[]).filter(r=>r.phase==='standing'&&(r.kind==='tree'||r.kind==='rock')).map(r=>({r,d2:(r.position[0]-px)**2+(r.position[2]-pz)**2})).filter(v=>v.d2<72*72).sort((a,b)=>a.d2-b.d2).slice(0,FOREST_CONTACT_CAPACITY);
  for(let i=0;i<candidates.length;i++){
   const r=candidates[i].r,[x,,z]=r.position as [number,number,number],s=r.scale??1,isTree=r.kind==='tree',tree=isTree?treePhenotype(x,z):undefined,rock=isTree?undefined:rockPhenotype(x,z),y=height(x,z);
   const radius=isTree?(1.02+(tree!.rootFlare-.86)*.78)*s:(.72+.28*forestVisualHash(x,z,419))*s;
   this.dummy.position.set(x,y+.009,z);this.dummy.rotation.set(0,(r.rotation??0)+forestVisualHash(x,z,421)*Math.PI*2,0);
   this.normal.set(height(x-.55,z)-height(x+.55,z),1.1,height(x,z-.55)-height(x,z+.55)).normalize();this.slope.setFromUnitVectors(UP,this.normal);this.dummy.quaternion.premultiply(this.slope);
   const sx=radius*(isTree?tree!.widthX:rock!.x),sz=radius*(isTree?tree!.widthZ:rock!.z);this.dummy.scale.set(sx,1,sz);this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);
   if(isTree){const woods=forestDensity(x,z),c=new T.Color('#5b593d').lerp(new T.Color('#344a2e'),.34+.46*woods);this.mesh.setColorAt(i,c);}else this.mesh.setColorAt(i,new T.Color('#5d594b'));
  }
  this.mesh.count=candidates.length;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
  (this.landscape as any).__forestContactStats={active:candidates.length,capacity:FOREST_CONTACT_CAPACITY,drawCalls:1,quality:this.quality,updateIntervalMs:interval};
 }
}

interface GovernorRuntime{controller:PerceptualGovernor;last:number;quality:number}
const ECOLOGY_IDS=['fernlet','broadleaf','sedge','dryStalk','shrub'] as const;
const CANOPY_IDS=['crown','mass'] as const;
function gateDraw(scene:T.Scene|T.Group,name:string,quality:number){const object=scene.getObjectByName(name);if(object)object.visible=quality>.025;}
function govern(landscape:any){
 const now=performance.now();let state=landscape[GOVERNOR] as GovernorRuntime|undefined;
 if(!state){state={controller:new PerceptualGovernor(16.67),last:now,quality:1};landscape[GOVERNOR]=state;}
 else{const dt=now-state.last;state.last=now;state.quality=state.controller.sample(dt);}
 const market=allocatePerceptualBudget(state.quality),a=market.allocations,field=landscape[GRASS_FIELD];
 for(const ring of field?.rings??[]){
  const id=ring.spec?.id as ObserverRingId|undefined;if(!id)continue;const quality=observerRingQuality(state.quality,id),material=ring.mesh?.material as T.Material|undefined,uniform=material?.userData?.awObserverQuality;
  if(uniform)uniform.value=quality;if(ring.mesh)ring.mesh.visible=quality>.025;
 }
 for(const id of ECOLOGY_IDS)gateDraw(landscape.scene,`Observer ecology ${id} torus`,a[`ecology.${id}`]);
 for(const id of CANOPY_IDS)gateDraw(landscape.scene,`Observer horizon forest ${id}`,a[`canopy.${id}`]);
 landscape[CONTACT]?.setQuality(a['forest.contact']);
 for(const uniform of leafDetailUniforms)uniform.value=a['surface.leaf'];
 const ground=landscape.scene.getObjectByName('March terrain') as T.Mesh|undefined,groundMaterial=ground&&!Array.isArray(ground.material)?ground.material as T.Material:undefined,groundUniform=groundMaterial?.userData?.awGroundDetailQuality as {value:number}|undefined;if(groundUniform)groundUniform.value=a['surface.ground'];
 const minorShadows=a['shadow.minor']>.44;for(const batch of landscape.foliageBatches??[]){const name=batch.mesh?.name;if(name==='fern patch'||name==='rock_2 patch'||name==='log patch')batch.mesh.castShadow=minorShadows;}
 landscape.__perceptualBudget={quality:state.quality,smoothedFrameMs:state.controller.smoothedFrameMs,targetMs:state.controller.targetMs,market:{budget:market.budget,spent:market.spent,minimum:market.minimum,maximum:market.maximum,allocations:a}};
}

function install(){
 const g=globalThis as Record<PropertyKey,unknown>;if(g[INSTALL])return;g[INSTALL]=true;
 const assets=Assets.prototype as any,oldLoad=assets.load;
 assets.load=async function(...args:any[]){const out=await oldLoad.apply(this,args);installCanopyDepth(this);return out;};
 const proto=Landscape.prototype as any,oldPlace=proto.place,oldBatch=proto.batch,oldTerrain=proto.terrain,oldUpdate=proto.update;
 proto.place=function(...args:any[]){
  const [name,x,z,yaw=0,scale=1]=args,o=oldPlace.apply(this,args) as T.Object3D;
  if(typeof name==='string'&&name.startsWith('oak_')){const p=treePhenotype(x,z);o.scale.set(scale*p.widthX,scale*p.height,scale*p.widthZ);o.rotation.set(p.leanX,yaw+p.yawJitter,p.leanZ);o.userData.forestPhenotype=p;}
  else if(typeof name==='string'&&name.startsWith('rock_')){const p=rockPhenotype(x,z);o.scale.set(scale*p.x,scale*p.y,scale*p.z);o.rotation.set(p.tiltX,yaw+p.yawJitter,p.tiltZ);o.userData.rockPhenotype=p;}
  return o;
 };
 proto.batch=function(...args:any[]){
  const [name,placements]=args as [string,any[]];
  if(name==='oak_distant')args[1]=placements.map(p=>{const q=treePhenotype(p.x,p.z);return{...p,yaw:p.yaw+q.yawJitter,scale:new T.Vector3(p.scale.x*q.widthX,p.scale.y*q.height,p.scale.z*q.widthZ)};});
  else if(name==='rock_2')args[1]=placements.map(p=>{const q=rockPhenotype(p.x,p.z);return{...p,yaw:p.yaw+q.yawJitter,scale:new T.Vector3(p.scale.x*q.x,p.scale.y*q.y,p.scale.z*q.z)};});
  return oldBatch.apply(this,args);
 };
 proto.terrain=function(...args:any[]){const out=oldTerrain.apply(this,args);try{this[CONTACT]=new GroundContactField(this);this[CONTACT].update(true);}catch(error){console.warn('Alderwatch forest contact field failed to initialize',error);}return out;};
 proto.update=function(...args:any[]){const out=oldUpdate.apply(this,args);govern(this);this[CONTACT]?.update();return out;};
}

if(typeof window!=='undefined')install();
