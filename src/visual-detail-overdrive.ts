import * as T from 'three';
import {Assets} from './assets';
import {Landscape} from './landscape';
import {forestDensity,forestEdge,meadowDensity} from './ecology';
import {height,roadX} from './terrain';
import {trailDistance} from './worldgen';
import {OBSERVER_GRASS_RINGS,clipmapOrigin,enteringClipmapCells,observerHash,type GrassRingSpec,type GridOrigin} from './observer-grass-clipmap';

const FIELD=Symbol.for('alderwatch.observerGrassField.v3');
const UP=new T.Vector3(0,1,0),HIDDEN=new T.Matrix4().makeScale(0,0,0);

function fract(n:number){return n-Math.floor(n);}

/**
 * Compact low-discrepancy grass tuft. R2-style irrational increments avoid the
 * clumping of independent random points, while per-world-cell rotation destroys
 * visible repetition between instances. Geometry is shared by every cell.
 */
export function createObserverGrassGeometry(spec:GrassRingSpec){
 const positions:number[]=[],colors:number[]=[],normals:number[]=[],indices:number[]=[];
 const plastic=1.3247179572447458,a1=1/plastic,a2=1/(plastic*plastic),phase=observerHash(spec.seed,spec.blades,19);
 for(let b=0;b<spec.blades;b++){
  const u=fract(.5+a1*(b+1)+phase),v=fract(.5+a2*(b+1)+phase*.61803398875),a=u*Math.PI*2;
  const r=Math.sqrt(v)*spec.tuftRadius,x=Math.cos(a)*r,z=Math.sin(a)*r,yaw=observerHash(b,spec.seed,31)*Math.PI*2;
  const h=spec.minHeight+(spec.maxHeight-spec.minHeight)*(.28+.72*observerHash(b,spec.seed,47));
  const baseWidth=spec.id==='hero'?.014:spec.id==='near'?.019:spec.id==='mid'?.027:.040;
  const widthJitter=spec.id==='hero'?.014:spec.id==='near'?.017:spec.id==='mid'?.022:.030;
  const w=baseWidth+observerHash(b,spec.seed,53)*widthJitter;
  const bend=.045+observerHash(b,spec.seed,61)*(spec.id==='far'?.22:.15),base=positions.length/3,species=observerHash(b,spec.seed,71);
  const c=new T.Color(species>.965?'#9a9155':species>.70?'#658344':species>.28?'#4b7634':'#2f5b28');
  for(let j=0;j<3;j++){
   const t=j/2,curve=bend*t*t;
   for(const side of [-1,1]){
    positions.push(x+Math.cos(yaw)*w*(1-t)*side+Math.sin(yaw)*curve,h*t,z-Math.sin(yaw)*w*(1-t)*side+Math.cos(yaw)*curve);
    const shade=.46+t*.58;colors.push(c.r*shade,c.g*shade,c.b*shade);normals.push(0,1,0);
   }
  }
  for(let j=0;j<2;j++){const k=base+j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setIndex(indices);geometry.computeBoundingSphere();
 return geometry;
}

/**
 * Each clip band receives a stable stochastic fade. The probability field is
 * keyed from instance translation, not screen pixels, so transitions soften into
 * density rather than producing a moving circular cutoff or temporal shimmer.
 * A scalar quality gate lets the perceptual governor shed far population without
 * changing deterministic population rank or reallocating the torus.
 */
function observerRingMaterial(base:T.Material,spec:GrassRingSpec){
 const material=base.clone(),previous=base.onBeforeCompile,baseKey=base.customProgramCacheKey.bind(base),quality={value:1};
 material.name=`${base.name||'grass'} observer ${spec.id}`;material.userData.awObserverQuality=quality;
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(base,shader,renderer);shader.uniforms.awObserverQuality=quality;
  shader.vertexShader='varying vec2 awObserverAnchor;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   awObserverAnchor=vec2(0.0);
   #ifdef USE_INSTANCING
    awObserverAnchor=instanceMatrix[3].xz;
   #endif
  `);
  shader.fragmentShader='uniform float awObserverQuality;varying vec2 awObserverAnchor;\n'+shader.fragmentShader;
  const fadeIn=spec.fadeFull<=spec.fadeIn?'1.0':`smoothstep(${spec.fadeIn.toFixed(2)},${spec.fadeFull.toFixed(2)},awObserverDistance)`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float awObserverDistance=length(vViewPosition);
   float awObserverVisibility=${fadeIn}*(1.0-smoothstep(${spec.fadeStart.toFixed(2)},${spec.fadeOut.toFixed(2)},awObserverDistance))*awObserverQuality;
   vec2 awObserverCell=floor(awObserverAnchor*2.713+vec2(${(spec.seed%997).toFixed(1)},${(spec.seed%619).toFixed(1)}));
   float awObserverRank=fract(sin(dot(awObserverCell,vec2(12.9898,78.233)))*43758.5453123);
   if(awObserverRank>awObserverVisibility)discard;
  `);
 };
 material.customProgramCacheKey=()=>`${baseKey()}-observer-ring-${spec.id}-v4-quality`;
 material.needsUpdate=true;return material;
}

function sharpenLoadedSurfaces(assets:Assets){
 for(const key of ['oak-color','oak-normal','oak-rough','rock-color','rock-normal','rock-rough']){
  const texture=assets.textures[key];if(!texture)continue;
  texture.anisotropy=Math.max(texture.anisotropy,16);texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
 }
 const atLeast=(v:number,n:number)=>Math.sign(v||1)*Math.max(Math.abs(v),n);
 assets.kit?.scene.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  for(const m of (Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[]){
   if(m.name==='AW_bark'&&m.normalMap){m.normalScale.set(atLeast(m.normalScale.x,1.04),atLeast(m.normalScale.y,1.04));m.roughness=.91;}
   if(m.name==='AW_stone'&&m.normalMap){m.normalScale.set(atLeast(m.normalScale.x,1.12),atLeast(m.normalScale.y,1.12));m.roughness=.96;}
  }
 });
}

function blockedByBuild(landscape:Landscape,x:number,z:number){
 return Object.values(landscape.state.structures??{}).some((s:any)=>{
  const dx=x-s.position[0],dz=z-s.position[2];
  return s.kind==='foundation'?Math.abs(dx)<2.15&&Math.abs(dz)<2.15:Math.hypot(dx,dz)<1.18;
 });
}

class ToroidalGrassRing{
 mesh:T.InstancedMesh;origin?:GridOrigin;dummy=new T.Object3D();normal=new T.Vector3();slope=new T.Quaternion();writes=0;
 constructor(public landscape:Landscape,public spec:GrassRingSpec,baseMaterial:T.Material){
  const capacity=spec.size*spec.size,material=observerRingMaterial(baseMaterial,spec);
  this.mesh=new T.InstancedMesh(createObserverGrassGeometry(spec),material,capacity);this.mesh.count=0;this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  this.mesh.name=`Observer grass ${spec.id} torus`;this.mesh.castShadow=false;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;
  this.mesh.userData.observerDetail={ring:spec.id,capacity,blades:spec.blades,cell:spec.cell,fade:[spec.fadeIn,spec.fadeFull,spec.fadeStart,spec.fadeOut]};landscape.scene.add(this.mesh);
 }
 private write(gx:number,gz:number,slot:number){
  const {spec,landscape}=this,jx=(observerHash(gx,gz,spec.seed+11)-.5)*spec.cell*.78,jz=(observerHash(gx,gz,spec.seed+23)-.5)*spec.cell*.78;
  const x=(gx+.5)*spec.cell+jx,z=(gz+.5)*spec.cell+jz,y=height(x,z),road=z>45?trailDistance(x,z):Math.abs(x-roadX(z));
  const woods=forestDensity(x,z),edge=forestEdge(x,z),meadow=meadowDensity(x,z);
  const density=T.MathUtils.clamp((.69+meadow*.31+edge*.18-woods*.15)*spec.density,.24,.998);
  const blocked=!Number.isFinite(y)||y<-1.06||road<3.0||landscape.ambientOccupied(x,z)||blockedByBuild(landscape,x,z)||observerHash(gx,gz,spec.seed+73)>density;
  if(blocked){this.mesh.setMatrixAt(slot,HIDDEN);return;}
  const horizontal=.88+observerHash(gx,gz,spec.seed+101)*.34,vertical=.82+observerHash(gx,gz,spec.seed+131)*.40+meadow*.10-woods*.06;
  this.dummy.position.set(x,y-.035,z);this.dummy.rotation.set(0,observerHash(gx,gz,spec.seed+211)*Math.PI*2,0);
  this.normal.set(height(x-.34,z)-height(x+.34,z),.68,height(x,z-.34)-height(x,z+.34)).normalize();this.slope.setFromUnitVectors(UP,this.normal);this.dummy.quaternion.premultiply(this.slope);
  this.dummy.scale.set(horizontal,vertical,horizontal);this.dummy.updateMatrix();this.mesh.setMatrixAt(slot,this.dummy.matrix);
 }
 update(x:number,z:number,force=false){
  const next=clipmapOrigin(x,z,this.spec),cells=force?enteringClipmapCells(undefined,next,this.spec.size):enteringClipmapCells(this.origin,next,this.spec.size);
  if(!cells.length)return 0;
  for(const c of cells)this.write(c.gx,c.gz,c.slot);
  this.origin=next;this.mesh.count=this.spec.size*this.spec.size;this.mesh.instanceMatrix.needsUpdate=true;this.writes+=cells.length;return cells.length;
 }
}

class ObserverGrassField{
 rings:ToroidalGrassRing[];structureSignature='';lastWrites=0;
 constructor(public landscape:Landscape){
  const source=landscape.assets.prop('grass');let material:T.Material|undefined;
  source.traverse(o=>{if(material||!(o instanceof T.Mesh))return;material=Array.isArray(o.material)?o.material[0]:o.material;});
  if(!material)throw new Error('Observer grass requires the existing living grass material');
  this.rings=OBSERVER_GRASS_RINGS.map(spec=>new ToroidalGrassRing(landscape,spec,material!));
 }
 update(){
  const player=Object.values(this.landscape.state.players)[0];if(!player)return;
  const signature=Object.keys(this.landscape.state.structures??{}).sort().join('|'),force=signature!==this.structureSignature;
  const [x,,z]=player.position;let writes=0;for(const ring of this.rings)writes+=ring.update(x,z,force);this.structureSignature=signature;this.lastWrites=writes;
  (this.landscape as any).__observerGrassStats={writes,totalWrites:this.rings.reduce((n,r)=>n+r.writes,0),rings:this.rings.map(r=>r.mesh.userData.observerDetail)};
 }
}

function install(){
 const g=globalThis as Record<PropertyKey,unknown>,marker=Symbol.for('alderwatch.visual-detail-overdrive.v3');if(g[marker])return;g[marker]=true;
 const assetsProto=Assets.prototype as any,oldLoad=assetsProto.load;
 if(!assetsProto.__awDetailLoadV3){assetsProto.load=async function(...args:any[]){const out=await oldLoad.apply(this,args);sharpenLoadedSurfaces(this);return out;};assetsProto.__awDetailLoadV3=true;}
 const landscapeProto=Landscape.prototype as any;
 if(!landscapeProto.__awObserverGrassV3){
  const oldPopulate=landscapeProto.populate,oldUpdate=landscapeProto.update;
  landscapeProto.populate=function(...args:any[]){const out=oldPopulate.apply(this,args);try{this[FIELD]=new ObserverGrassField(this);}catch(error){console.error('Alderwatch observer grass field failed to initialize',error);}return out;};
  landscapeProto.update=function(...args:any[]){const out=oldUpdate.apply(this,args);this[FIELD]?.update();return out;};
  landscapeProto.__awObserverGrassV3=true;
 }
}

if(typeof window!=='undefined')install();
