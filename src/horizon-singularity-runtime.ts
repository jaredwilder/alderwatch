import * as T from 'three';
import {Landscape} from './landscape';
import {forestDensity,forestEdge} from './ecology';
import {treePhenotype} from './forest-singularity';
import {ecologyState,roadDisturbance} from './ecology-singularity';
import {height,roadX} from './terrain';
import {trailDistance} from './worldgen';
import {HORIZON_CANOPY_FIELDS,enteringHorizonCells,horizonCanopyQuality,horizonFieldOrigin,horizonHash,type CanopyBandSpec,type HorizonGridOrigin} from './horizon-singularity';

const INSTALL=Symbol.for('alderwatch.horizon-singularity.v1');
const FIELD=Symbol.for('alderwatch.horizon-canopy-field.v1');
const HIDDEN=new T.Matrix4().makeScale(0,0,0);
type P=[number,number,number];
interface G{positions:number[];colors:number[];indices:number[]}
const bark=new T.Color('#4b4032'),barkLight=new T.Color('#675642'),leaf=new T.Color('#446d39'),leafLight=new T.Color('#5b8045'),leafDark=new T.Color('#315a31');
function vertex(g:G,p:P,c:T.Color){const i=g.positions.length/3;g.positions.push(...p);g.colors.push(c.r,c.g,c.b);return i;}
function tri(g:G,a:P,b:P,c:P,color:T.Color){const i=vertex(g,a,color);vertex(g,b,color);vertex(g,c,color);g.indices.push(i,i+1,i+2);}
function quad(g:G,a:P,b:P,c:P,d:P,color:T.Color){const i=vertex(g,a,color);vertex(g,b,color);vertex(g,c,color);vertex(g,d,color);g.indices.push(i,i+1,i+2,i,i+2,i+3);}
function octa(g:G,cx:number,cy:number,cz:number,rx:number,ry:number,rz:number,color:T.Color){
 const top:[number,number,number]=[cx,cy+ry,cz],bottom:[number,number,number]=[cx,cy-ry,cz],e:P[]=[[cx+rx,cy,cz],[cx,cy,cz+rz],[cx-rx,cy,cz],[cx,cy,cz-rz]];
 for(let i=0;i<4;i++){tri(g,top,e[i],e[(i+1)%4],color);tri(g,bottom,e[(i+1)%4],e[i],color);}
}

/** Compact colour-only forest representations: no image asset or extra texture residency. */
export function createHorizonCanopyGeometry(spec:CanopyBandSpec){
 const g:G={positions:[],colors:[],indices:[]};
 if(spec.id==='crown'){
  const r=.17,y=2.9;for(let i=0;i<4;i++){const a=i*Math.PI/2,b=(i+1)*Math.PI/2;quad(g,[Math.cos(a)*r,0,Math.sin(a)*r],[Math.cos(b)*r,0,Math.sin(b)*r],[Math.cos(b)*r,y,Math.sin(b)*r],[Math.cos(a)*r,y,Math.sin(a)*r],i%2?bark:barkLight);}
  octa(g,0,4.45,0,1.72,2.05,1.55,leaf);octa(g,-1.08,5.15,.28,1.38,1.62,1.28,leafDark);octa(g,1.04,5.28,-.22,1.42,1.72,1.34,leafLight);
 }else{
  quad(g,[-.14,0,0],[.14,0,0],[.10,2.7,0],[-.10,2.7,0],bark);quad(g,[0,0,-.14],[0,0,.14],[0,2.7,.10],[0,2.7,-.10],barkLight);
  for(let i=0;i<4;i++){const a=i*Math.PI/4,dx=Math.cos(a),dz=Math.sin(a),px=-dz,pz=dx,w=1.9;quad(g,[px*-w,2.25,pz*-w],[px*w,2.25,pz*w],[px*w*.82,6.65,pz*w*.82],[px*-w*.82,6.65,pz*-w*.82],i%2?leaf:leafDark);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(g.positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(g.colors,3));geometry.setIndex(g.indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();const triangles=g.indices.length/3;if(triangles!==spec.triangles)throw new Error(`${spec.id} horizon geometry budget drift: ${triangles} != ${spec.triangles}`);return geometry;
}

function canopyMaterial(spec:CanopyBandSpec){
 const center={value:new T.Vector2()},quality={value:1},material=new T.MeshStandardMaterial({color:'#ffffff',vertexColors:true,roughness:1,metalness:0,side:T.DoubleSide});
 material.name=`Alderwatch horizon canopy ${spec.id}`;material.userData.awHorizonCenter=center;material.userData.awHorizonQuality=quality;
 material.onBeforeCompile=shader=>{
  shader.uniforms.awHorizonCenter=center;shader.uniforms.awHorizonQuality=quality;
  shader.vertexShader='varying vec2 awHorizonAnchor;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('void main() {',`void main() {
   awHorizonAnchor=vec2(0.0);
   #ifdef USE_INSTANCING
    awHorizonAnchor=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xz;
   #endif
  `);
  const p=spec.metricPower.toFixed(2),ip=(1/spec.metricPower).toFixed(7),phase=((spec.seed%991)/991).toFixed(7);
  shader.fragmentShader='uniform vec2 awHorizonCenter;uniform float awHorizonQuality;varying vec2 awHorizonAnchor;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 awHD=abs(awHorizonAnchor-awHorizonCenter);
   float awHDistance=pow(pow(awHD.x,${p})+pow(awHD.y,${p}),${ip});
   float awHVisible=smoothstep(${spec.fadeIn.toFixed(1)},${spec.fadeFull.toFixed(1)},awHDistance)*(1.0-smoothstep(${spec.fadeStart.toFixed(1)},${spec.fadeOut.toFixed(1)},awHDistance))*awHorizonQuality;
   vec2 awHCell=floor(awHorizonAnchor*.173+vec2(${(spec.seed%733).toFixed(1)},${(spec.seed%457).toFixed(1)}));
   float awHRank=fract(dot(awHCell,vec2(.754877666,.569840296))+${phase});
   if(awHRank>awHVisible)discard;
   float awHVariation=.93+.10*fract(dot(awHCell,vec2(.438579,.287141)));
   diffuseColor.rgb*=awHVariation;
  `);
 };
 material.customProgramCacheKey=()=>`aw-horizon-canopy-${spec.id}-v1`;material.needsUpdate=true;return material;
}

function roadDistance(x:number,z:number){return z>45?trailDistance(x,z):Math.abs(x-roadX(z));}
function blockedByBuild(landscape:Landscape,x:number,z:number){return Object.values(landscape.state.structures??{}).some((s:any)=>Math.hypot(x-s.position[0],z-s.position[2])<(s.kind==='foundation'?5.0:3.0));}

class ToroidalCanopyBand{
 mesh:T.InstancedMesh;origin?:HorizonGridOrigin;dummy=new T.Object3D();color=new T.Color();writes=0;
 constructor(public landscape:Landscape,public spec:CanopyBandSpec){
  this.mesh=new T.InstancedMesh(createHorizonCanopyGeometry(spec),canopyMaterial(spec),spec.size*spec.size);this.mesh.name=`Observer horizon forest ${spec.id}`;this.mesh.count=0;this.mesh.castShadow=false;this.mesh.receiveShadow=false;this.mesh.frustumCulled=false;this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);landscape.scene.add(this.mesh);
 }
 private write(gx:number,gz:number,slot:number){
  const {landscape,spec}=this,jx=(horizonHash(gx,gz,spec.seed+11)-.5)*spec.cell*.82,jz=(horizonHash(gx,gz,spec.seed+23)-.5)*spec.cell*.82,x=(gx+.5)*spec.cell+jx,z=(gz+.5)*spec.cell+jz,y=height(x,z),road=roadDistance(x,z),woods=forestDensity(x,z),edge=forestEdge(x,z),eco=ecologyState(x,z,roadDisturbance(road));
  const chance=Math.min(.965,Math.max(0,(woods*.84+edge*.24+eco.understory*.12-.08)*spec.density)),blocked=!Number.isFinite(y)||y<-2.4||road<8.2||woods<.12||blockedByBuild(landscape,x,z)||horizonHash(gx,gz,spec.seed+71)>chance;
  if(blocked){this.mesh.setMatrixAt(slot,HIDDEN);return;}
  const phenotype=treePhenotype(x,z),random=.78+horizonHash(gx,gz,spec.seed+101)*.48,scale=spec.scale*random;
  this.dummy.position.set(x,y-.15,z);this.dummy.rotation.set(phenotype.leanX*.30,horizonHash(gx,gz,spec.seed+127)*Math.PI*2+phenotype.yawJitter,phenotype.leanZ*.30);this.dummy.scale.set(scale*phenotype.widthX,scale*phenotype.height,scale*phenotype.widthZ);this.dummy.updateMatrix();this.mesh.setMatrixAt(slot,this.dummy.matrix);
  this.color.set('#557743');this.color.offsetHSL((horizonHash(gx,gz,spec.seed+149)-.5)*.024,(eco.moisture-.5)*.08,(eco.fertility-.5)*.06-(woods-.5)*.025);this.mesh.setColorAt(slot,this.color);
 }
 update(x:number,z:number,force=false){
  const material=this.mesh.material as T.Material,center=material.userData.awHorizonCenter as {value:T.Vector2};center.value.set(x,z);
  const next=horizonFieldOrigin(x,z,this.spec),cells=force?enteringHorizonCells(undefined,next,this.spec.size):enteringHorizonCells(this.origin,next,this.spec.size);if(cells.length){for(const c of cells)this.write(c.gx,c.gz,c.slot);this.origin=next;this.mesh.count=this.spec.size*this.spec.size;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;this.writes+=cells.length;}return cells.length;
 }
 setQuality(q:number){((this.mesh.material as T.Material).userData.awHorizonQuality as {value:number}).value=horizonCanopyQuality(q,this.spec.id);}
}

class HorizonCanopyField{
 bands:ToroidalCanopyBand[];structureSignature='';
 constructor(public landscape:Landscape){this.bands=HORIZON_CANOPY_FIELDS.map(spec=>new ToroidalCanopyBand(landscape,spec));}
 update(force=false){
  const player=Object.values(this.landscape.state.players)[0];if(!player)return;const [x,,z]=player.position,signature=Object.keys(this.landscape.state.structures??{}).sort().join('|'),rebuild=force||signature!==this.structureSignature;let writes=0;for(const band of this.bands)writes+=band.update(x,z,rebuild);this.structureSignature=signature;const quality=(this.landscape as any).__perceptualBudget?.quality??1;for(const band of this.bands)band.setQuality(quality);(this.landscape as any).__horizonCanopyStats={writes,quality,bands:this.bands.map(b=>({id:b.spec.id,capacity:b.spec.size*b.spec.size,triangles:b.spec.triangles,totalWrites:b.writes}))};
 }
}

function install(){
 const g=globalThis as Record<PropertyKey,unknown>;if(g[INSTALL])return;g[INSTALL]=true;const proto=Landscape.prototype as any,oldTerrain=proto.terrain,oldUpdate=proto.update;
 proto.terrain=function(...args:any[]){const out=oldTerrain.apply(this,args);try{this[FIELD]=new HorizonCanopyField(this);this[FIELD].update(true);}catch(error){console.warn('Alderwatch horizon canopy failed to initialize',error);}return out;};
 proto.update=function(...args:any[]){const out=oldUpdate.apply(this,args);this[FIELD]?.update();return out;};
}

if(typeof window!=='undefined')install();
