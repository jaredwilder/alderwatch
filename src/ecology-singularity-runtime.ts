import * as T from 'three';
import {Landscape} from './landscape';
import {height,roadX} from './terrain';
import {trailDistance} from './worldgen';
import {ECOLOGY_FIELDS,ECOLOGY_SURFACE_SAMPLE_CELL,ecologyFieldOrigin,ecologyFieldQuality,ecologyHash,ecologySpeciesWeightsFromState,ecologyState,enteringEcologyCells,roadDisturbance,type EcologyFieldSpec,type EcologyGridOrigin,type EcologyPlantId,type EcologyState} from './ecology-singularity';

const INSTALL=Symbol.for('alderwatch.ecology-singularity.v1');
const FIELD=Symbol.for('alderwatch.ecology-field.v1');
const GROUND_MARK=Symbol.for('alderwatch.ecology-ground.v1');
const HIDDEN=new T.Matrix4().makeScale(0,0,0),UP=new T.Vector3(0,1,0);

type P=[number,number,number];
interface GeometryData{positions:number[];colors:number[];indices:number[]}
const palette={
 stem:new T.Color('#35552b'),fern:new T.Color('#456f38'),fernLight:new T.Color('#5d8547'),broad:new T.Color('#61833f'),broadLight:new T.Color('#78964f'),sedge:new T.Color('#6f8e4b'),sedgeLight:new T.Color('#8ba35d'),dry:new T.Color('#99854c'),dryLight:new T.Color('#b4a164'),shrub:new T.Color('#355f31'),shrubLight:new T.Color('#4d783e')
};
function vertex(d:GeometryData,p:P,c:T.Color){const i=d.positions.length/3;d.positions.push(...p);d.colors.push(c.r,c.g,c.b);return i;}
function tri(d:GeometryData,a:P,b:P,c:P,color:T.Color){const i=vertex(d,a,color);vertex(d,b,color);vertex(d,c,color);d.indices.push(i,i+1,i+2);}
function quad(d:GeometryData,a:P,b:P,c:P,e:P,color:T.Color){const i=vertex(d,a,color);vertex(d,b,color);vertex(d,c,color);vertex(d,e,color);d.indices.push(i,i+1,i+2,i,i+2,i+3);}

/** Five tiny procedural archetypes replace hundreds of unique undergrowth meshes. */
export function createEcologyPlantGeometry(spec:EcologyFieldSpec){
 const d:GeometryData={positions:[],colors:[],indices:[]};
 if(spec.id==='fernlet'){
  quad(d,[-.014,0,0],[.014,0,0],[.011,.62,0],[-.011,.62,0],palette.stem);
  for(let i=0;i<8;i++){const y=.12+i*.055,side=i%2?1:-1,span=.145-i*.007,z=(i%3-1)*.032;tri(d,[0,y,0],[side*span,y+.025,z+.045],[side*span*.70,y+.082,z-.045],i%3?palette.fern:palette.fernLight);}
 }else if(spec.id==='broadleaf'){
  quad(d,[-.012,0,0],[.012,0,0],[.010,.55,0],[-.010,.55,0],palette.stem);
  const golden=2.399963229728653;
  for(let i=0;i<5;i++){const a=i*golden,y=.18+i*.065,r=.055+i*.008,l=.145-i*.008,w=.065+i*.004,dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx,cx=dx*r,cz=dz*r;
   quad(d,[cx-dx*l+px*w,y-.018,cz-dz*l+pz*w],[cx+dx*l+px*w,y+.035,cz+dz*l+pz*w],[cx+dx*l-px*w,y+.035,cz+dz*l-pz*w],[cx-dx*l-px*w,y-.018,cz-dz*l-pz*w],i%2?palette.broad:palette.broadLight);}
 }else if(spec.id==='sedge'){
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx,r=.025,w=.014,h=.48+.055*(i%3),bend=.10+.025*(i%2);
   quad(d,[dx*r+px*w,0,dz*r+pz*w],[dx*r-px*w,0,dz*r-pz*w],[dx*(r+bend)-px*w*.35,h,dz*(r+bend)-pz*w*.35],[dx*(r+bend)+px*w*.35,h,dz*(r+bend)+pz*w*.35],i%2?palette.sedge:palette.sedgeLight);}
 }else if(spec.id==='dryStalk'){
  for(let i=0;i<3;i++){const x=(i-1)*.075,h=.52+i*.08,w=.010;quad(d,[x-w,0,0],[x+w,0,0],[x+w*.55,h,0],[x-w*.55,h,0],i===1?palette.dryLight:palette.dry);}
  tri(d,[-.015,.66,0],[.015,.66,0],[0,.79,.01],palette.dryLight);tri(d,[0,.68,-.015],[0,.68,.015],[.095,.74,0],palette.dryLight);
 }else{
  // Six deliberately non-radial leaf curtains. The old regular starburst read
  // as a low-poly game token. Golden-angle overlap gives the same 12 triangles
  // a fuller, asymmetric hedgerow silhouette from arbitrary camera headings.
  const golden=2.399963229728653;
  for(let i=0;i<6;i++){
   const a=.31+i*golden,dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx,r=.035+.025*(i%3),reach=.30+.055*((i*5)%4),w=.14+.018*(i%2),h=.43+.055*((i+1)%3),lean=.055*(i%2?1:-1),cx=dx*r,cz=dz*r;
   quad(d,[cx+px*w*.42,.025,cz+pz*w*.42],[cx-px*w*.42,.025,cz-pz*w*.42],[cx+dx*(reach+lean)-px*w,h,cz+dz*(reach+lean)-pz*w],[cx+dx*(reach-lean)+px*w,h*.92,cz+dz*(reach-lean)+pz*w],i%2?palette.shrub:palette.shrubLight);
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(d.positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(d.colors,3));geometry.setIndex(d.indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const triangles=d.indices.length/3;if(triangles!==spec.triangles)throw new Error(`${spec.id} geometry budget drift: ${triangles} != ${spec.triangles}`);return geometry;
}

function plantMaterial(spec:EcologyFieldSpec){
 const quality={value:1},time={value:0},material=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1,metalness:0,side:T.DoubleSide});
 material.name=`Alderwatch ecology ${spec.id}`;material.userData.awEcologyQuality=quality;material.userData.awEcologyTime=time;
 material.onBeforeCompile=shader=>{
  shader.uniforms.awEcologyQuality=quality;shader.uniforms.awEcologyTime=time;
  shader.vertexShader='uniform float awEcologyTime;varying vec2 awPlantAnchor;varying vec3 awPlantWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('void main() {',`void main() {
   awPlantAnchor=vec2(0.0);awPlantWorld=vec3(0.0);
   #ifdef USE_INSTANCING
    awPlantAnchor=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xz;
   #endif
  `);
  const sway=spec.id==='shrub'?'.022':spec.id==='dryStalk'?'.042':'.055';
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float awPlantLift=clamp(position.y*1.75,0.0,1.0);
   float awPlantWind=sin(awEcologyTime*.86+awPlantAnchor.x*.17+awPlantAnchor.y*.13+position.y*2.1)*${sway}*awPlantLift;
   transformed.x+=awPlantWind;transformed.z+=awPlantWind*.57;
   vec4 awPlantLocal=vec4(transformed,1.0);
   #ifdef USE_INSTANCING
    awPlantLocal=instanceMatrix*awPlantLocal;
   #endif
   awPlantWorld=(modelMatrix*awPlantLocal).xyz;
  `);
  shader.fragmentShader='uniform float awEcologyQuality;varying vec2 awPlantAnchor;varying vec3 awPlantWorld;\n'+shader.fragmentShader;
  const fadeIn=spec.fadeFull<=spec.fadeIn?'1.0':`smoothstep(${spec.fadeIn.toFixed(2)},${spec.fadeFull.toFixed(2)},awPlantDistance)`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float awPlantDistance=length(vViewPosition);
   float awPlantVisible=${fadeIn}*(1.0-smoothstep(${spec.fadeStart.toFixed(2)},${spec.fadeOut.toFixed(2)},awPlantDistance))*awEcologyQuality;
   // Coverage changes in a world-locked microfield instead of deleting whole
   // plants by cell rank. Camera motion can no longer make a shrub shrink away
   // and then pop back into existence.
   vec3 awPlantQ=floor(awPlantWorld*9.5+vec3(${(spec.seed%97).toFixed(1)},${(spec.seed%131).toFixed(1)},${(spec.seed%173).toFixed(1)}));
   float awPlantDither=fract(sin(dot(awPlantQ,vec3(12.9898,78.233,37.719)))*43758.5453123);
   float awPlantCoverage=awPlantVisible*awPlantVisible*(3.0-2.0*awPlantVisible);
   if(awPlantDither>awPlantCoverage)discard;
   diffuseColor.rgb+=vec3(.025,.040,.012)*(gl_FrontFacing?0.0:1.0);
  `);
 };
 material.customProgramCacheKey=()=>`aw-ecology-${spec.id}-v2-stable-coverage`;material.needsUpdate=true;return material;
}

function roadDistance(x:number,z:number){return z>45?trailDistance(x,z):Math.abs(x-roadX(z));}
function blockedByBuild(landscape:Landscape,x:number,z:number){return Object.values(landscape.state.structures??{}).some((s:any)=>{const dx=x-s.position[0],dz=z-s.position[2];return s.kind==='foundation'?Math.abs(dx)<2.2&&Math.abs(dz)<2.2:Math.hypot(dx,dz)<1.2;});}
function ecologicalColor(out:T.Color,id:EcologyPlantId,s:EcologyState,jitter:number){
 const base=id==='fernlet'?'#426e39':id==='broadleaf'?'#63843f':id==='sedge'?'#73904a':id==='dryStalk'?'#9b874d':'#365f32';out.set(base);
 if(id==='dryStalk')out.offsetHSL((jitter-.5)*.025,(jitter-.5)*.08,(s.dryness-.5)*.08);
 else out.offsetHSL((jitter-.5)*.018,(s.moisture-.5)*.08,(s.fertility-.5)*.07-(s.shade-.5)*.025);return out;
}

class ToroidalPlantField{
 mesh:T.InstancedMesh;origin?:EcologyGridOrigin;dummy=new T.Object3D();normal=new T.Vector3();slope=new T.Quaternion();color=new T.Color();writes=0;
 constructor(public landscape:Landscape,public spec:EcologyFieldSpec){
  this.mesh=new T.InstancedMesh(createEcologyPlantGeometry(spec),plantMaterial(spec),spec.size*spec.size);this.mesh.name=`Observer ecology ${spec.id} torus`;this.mesh.count=0;this.mesh.castShadow=false;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);landscape.scene.add(this.mesh);
 }
 private write(gx:number,gz:number,slot:number){
  const {spec,landscape}=this,jx=(ecologyHash(gx,gz,spec.seed+11)-.5)*spec.cell*.76,jz=(ecologyHash(gx,gz,spec.seed+23)-.5)*spec.cell*.76,x=(gx+.5)*spec.cell+jx,z=(gz+.5)*spec.cell+jz,y=height(x,z),road=roadDistance(x,z),disturbance=roadDisturbance(road),state=ecologyState(x,z,disturbance),weights=ecologySpeciesWeightsFromState(state);
  const cover=spec.id==='sedge'||spec.id==='dryStalk'?state.biomass:spec.id==='shrub'?state.understory*(.72+.28*state.edge):state.understory;
  const chance=Math.min(.965,weights[spec.id]*cover*spec.density),blocked=!Number.isFinite(y)||y<-1.06||road<2.85||disturbance>.82||landscape.ambientOccupied(x,z)||blockedByBuild(landscape,x,z)||ecologyHash(gx,gz,spec.seed+73)>chance;
  if(blocked){this.mesh.setMatrixAt(slot,HIDDEN);return;}
  const randomScale=.72+ecologyHash(gx,gz,spec.seed+101)*.58,wetScale=.92+state.moisture*.16,dryScale=spec.id==='dryStalk'?.86+state.dryness*.34:1,vertical=spec.scale*randomScale*wetScale*dryScale,horizontal=spec.scale*(.82+ecologyHash(gx,gz,spec.seed+113)*.35);
  this.dummy.position.set(x,y-.018,z);this.dummy.rotation.set(0,ecologyHash(gx,gz,spec.seed+127)*Math.PI*2,0);
  this.normal.set(height(x-.30,z)-height(x+.30,z),.72,height(x,z-.30)-height(x,z+.30)).normalize();this.slope.setFromUnitVectors(UP,this.normal);this.dummy.quaternion.premultiply(this.slope);
  this.dummy.scale.set(horizontal,vertical,horizontal);this.dummy.updateMatrix();this.mesh.setMatrixAt(slot,this.dummy.matrix);this.mesh.setColorAt(slot,ecologicalColor(this.color,spec.id,state,ecologyHash(gx,gz,spec.seed+149)));
 }
 update(x:number,z:number,force=false){
  const next=ecologyFieldOrigin(x,z,this.spec),cells=force?enteringEcologyCells(undefined,next,this.spec.size):enteringEcologyCells(this.origin,next,this.spec.size);if(cells.length){for(const c of cells)this.write(c.gx,c.gz,c.slot);this.origin=next;this.mesh.count=this.spec.size*this.spec.size;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;this.writes+=cells.length;}return cells.length;
 }
 setFrame(quality:number,time:number){const material=this.mesh.material as T.Material;(material.userData.awEcologyQuality as {value:number}).value=ecologyFieldQuality(quality,this.spec.id);(material.userData.awEcologyTime as {value:number}).value=time;}
}

class EcologySingularityField{
 patches:ToroidalPlantField[];structureSignature='';lastWrites=0;
 constructor(public landscape:Landscape){this.patches=ECOLOGY_FIELDS.map(spec=>new ToroidalPlantField(landscape,spec));}
 update(force=false){
  const player=Object.values(this.landscape.state.players)[0];if(!player)return;const [x,,z]=player.position,signature=Object.keys(this.landscape.state.structures??{}).sort().join('|'),rebuild=force||signature!==this.structureSignature;let writes=0;
  for(const patch of this.patches)writes+=patch.update(x,z,rebuild);this.structureSignature=signature;this.lastWrites=writes;const quality=(this.landscape as any).__perceptualBudget?.quality??1,time=performance.now()/1000;for(const patch of this.patches)patch.setFrame(quality,time);
  (this.landscape as any).__ecologyFieldStats={writes,totalWrites:this.patches.reduce((n,p)=>n+p.writes,0),quality,fields:this.patches.map(p=>({id:p.spec.id,capacity:p.spec.size*p.spec.size,triangles:p.spec.triangles}))};
 }
}

/**
 * The terrain samples the same ecology field at a coarse 4m latent resolution;
 * interpolation across terrain vertices reconstructs the visual field.  The
 * source resolution therefore follows ecology scale, not screen-pixel count.
 */
function installEcologyGround(landscape:Landscape){
 const ground=landscape.scene.getObjectByName('March terrain');if(!(ground instanceof T.Mesh)||Array.isArray(ground.material)||(ground.material as any)[GROUND_MARK])return;const geometry=ground.geometry,pos=geometry.getAttribute('position');if(!pos)return;
 const cache=new Map<string,EcologyState>(),mix:number[]=[];
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),qx=Math.round(x/ECOLOGY_SURFACE_SAMPLE_CELL),qz=Math.round(z/ECOLOGY_SURFACE_SAMPLE_CELL),key=`${qx},${qz}`;let state=cache.get(key);if(!state){const wx=qx*ECOLOGY_SURFACE_SAMPLE_CELL,wz=qz*ECOLOGY_SURFACE_SAMPLE_CELL;state=ecologyState(wx,wz,roadDisturbance(roadDistance(wx,wz)));cache.set(key,state);}mix.push(state.biomass,state.litter,state.moss,state.dryness);}
 geometry.setAttribute('awEcologyMix',new T.Float32BufferAttribute(mix,4));const material=ground.material as T.MeshStandardMaterial;(material as any)[GROUND_MARK]=true;const previous=material.onBeforeCompile,oldKey=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);shader.vertexShader='attribute vec4 awEcologyMix;varying vec4 awEcologyMixV;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nawEcologyMixV=awEcologyMix;');shader.fragmentShader='varying vec4 awEcologyMixV;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`vec4 awEco=clamp(awEcologyMixV,0.0,1.0);
   float awEcoDistance=length(vViewPosition),awEcoFar=smoothstep(34.0,128.0,awEcoDistance);
   vec3 awEcoGreen=mix(vec3(.84,.98,.73),vec3(.54,.79,.47),awEco.x),awEcoMoss=vec3(.43,.62,.35),awEcoDry=vec3(.94,.83,.60);
   float awEcoBiomass=awEco.x*(.17+.27*awEcoFar),awEcoMossMix=awEco.z*(.14+.14*awEcoFar),awEcoDryMix=awEco.w*.11*(1.0-awEco.y);
   diffuseColor.rgb*=mix(vec3(1.0),awEcoGreen,awEcoBiomass);
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*awEcoMoss,awEcoMossMix);
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*awEcoDry,awEcoDryMix);
   #include <roughnessmap_fragment>`);
 };
 material.customProgramCacheKey=()=>oldKey()+'-ecology-singularity-v2-stable-plants';material.needsUpdate=true;(landscape as any).__ecologySurfaceStats={vertices:pos.count,latentSamples:cache.size,sampleCell:ECOLOGY_SURFACE_SAMPLE_CELL};
}

function install(){
 const g=globalThis as Record<PropertyKey,unknown>;if(g[INSTALL])return;g[INSTALL]=true;const proto=Landscape.prototype as any,oldTerrain=proto.terrain,oldUpdate=proto.update;
 proto.terrain=function(...args:any[]){const out=oldTerrain.apply(this,args);try{installEcologyGround(this);this[FIELD]=new EcologySingularityField(this);this[FIELD].update(true);}catch(error){console.warn('Alderwatch ecology singularity failed to initialize',error);}return out;};
 proto.update=function(...args:any[]){const out=oldUpdate.apply(this,args);this[FIELD]?.update();return out;};
}

if(typeof window!=='undefined')install();
