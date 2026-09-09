import * as T from 'three';
import type {Assets} from './assets';
import {noise2} from './ecology';
import {PerceptualGovernor,observerRingQuality} from './forest-singularity';
import {OBSERVER_GRASS_RINGS,clipmapOrigin,enteringClipmapCells,observerHash,type GrassRingSpec,type GridOrigin} from './observer-grass-clipmap';
import {createObserverGrassGeometry} from './visual-detail-overdrive';

const HIDDEN=new T.Matrix4().makeScale(0,0,0);

export type StreamedGrassBiome='crownroad'|'ironward'|'wolfpine';
export interface StreamedGrassSample{y:number;blocked?:boolean;density?:number}
export interface StreamedObserverGrassOptions{
  biome:StreamedGrassBiome;
  sample:(x:number,z:number)=>StreamedGrassSample;
  targetFrameMs?:number;
}

/** Same frontier representation doctrine as Far March, with a lower streamed-area vertex budget. */
export const STREAMED_GRASS_RINGS=OBSERVER_GRASS_RINGS.map((ring,index)=>({
  ...ring,
  blades:[12,5,3,1][index],
  density:ring.density*(index===0?1:index===1?.96:index===2?.90:.82),
})) as readonly GrassRingSpec[];

export function streamedGrassBudget(rings:readonly GrassRingSpec[]=STREAMED_GRASS_RINGS){
 return rings.reduce((a,r)=>({slots:a.slots+r.size*r.size,maxTriangles:a.maxTriangles+r.size*r.size*r.blades*4,drawCalls:a.drawCalls+1}),{slots:0,maxTriangles:0,drawCalls:0});
}

function biomeDensity(biome:StreamedGrassBiome,x:number,z:number){
 const broad=noise2(x*.016+(biome==='wolfpine'?31:7),z*.016+(biome==='ironward'?19:-11));
 const fine=noise2(x*.061-17,z*.061+29);
 if(biome==='wolfpine')return T.MathUtils.clamp(.54+broad*.26+fine*.08,.42,.88);
 if(biome==='ironward')return T.MathUtils.clamp(.66+broad*.22+fine*.08,.52,.94);
 return T.MathUtils.clamp(.76+broad*.18+fine*.08,.62,.98);
}

function ringMaterial(base:T.Material,spec:GrassRingSpec){
 const material=base.clone(),previous=base.onBeforeCompile,baseKey=base.customProgramCacheKey.bind(base),quality={value:1};
 material.name=`${base.name||'grass'} streamed ${spec.id}`;material.userData.awObserverQuality=quality;
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(base,shader,renderer);shader.uniforms.awObserverQuality=quality;
  shader.vertexShader='varying vec2 awObserverAnchor;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nawObserverAnchor=vec2(0.0);\n#ifdef USE_INSTANCING\n awObserverAnchor=instanceMatrix[3].xz;\n#endif`);
  shader.fragmentShader='uniform float awObserverQuality;varying vec2 awObserverAnchor;\n'+shader.fragmentShader;
  const fadeIn=spec.fadeFull<=spec.fadeIn?'1.0':`smoothstep(${spec.fadeIn.toFixed(2)},${spec.fadeFull.toFixed(2)},awObserverDistance)`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nfloat awObserverDistance=length(vViewPosition);\nfloat awObserverVisibility=${fadeIn}*(1.0-smoothstep(${spec.fadeStart.toFixed(2)},${spec.fadeOut.toFixed(2)},awObserverDistance))*awObserverQuality;\nvec2 awObserverCell=floor(awObserverAnchor*2.713+vec2(${(spec.seed%997).toFixed(1)},${(spec.seed%619).toFixed(1)}));\nfloat awObserverRank=fract(sin(dot(awObserverCell,vec2(12.9898,78.233)))*43758.5453123);\nif(awObserverRank>awObserverVisibility)discard;`);
 };
 material.customProgramCacheKey=()=>`${baseKey()}-streamed-observer-${spec.id}-v1`;material.needsUpdate=true;return material;
}

class StreamedGrassRing{
 mesh:T.InstancedMesh;origin?:GridOrigin;dummy=new T.Object3D();writes=0;
 constructor(private root:T.Object3D,private options:StreamedObserverGrassOptions,public spec:GrassRingSpec,baseMaterial:T.Material){
  const capacity=spec.size*spec.size;this.mesh=new T.InstancedMesh(createObserverGrassGeometry(spec),ringMaterial(baseMaterial,spec),capacity);this.mesh.count=0;this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.name=`Streamed observer grass ${spec.id}`;this.mesh.castShadow=false;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;this.mesh.userData.observerDetail={ring:spec.id,capacity,blades:spec.blades,cell:spec.cell};root.add(this.mesh);
 }
 private write(gx:number,gz:number,slot:number){
  const {spec}=this,jx=(observerHash(gx,gz,spec.seed+11)-.5)*spec.cell*.78,jz=(observerHash(gx,gz,spec.seed+23)-.5)*spec.cell*.78,x=(gx+.5)*spec.cell+jx,z=(gz+.5)*spec.cell+jz,sample=this.options.sample(x,z),base=biomeDensity(this.options.biome,x,z),density=T.MathUtils.clamp(base*(sample.density??1)*spec.density,.08,.998);
  if(sample.blocked||observerHash(gx,gz,spec.seed+73)>density){this.mesh.setMatrixAt(slot,HIDDEN);return;}
  const horizontal=.88+observerHash(gx,gz,spec.seed+101)*.34,vertical=.82+observerHash(gx,gz,spec.seed+131)*.42;
  this.dummy.position.set(x,sample.y-.025,z);this.dummy.rotation.set(0,observerHash(gx,gz,spec.seed+211)*Math.PI*2,0);this.dummy.scale.set(horizontal,vertical,horizontal);this.dummy.updateMatrix();this.mesh.setMatrixAt(slot,this.dummy.matrix);
 }
 update(x:number,z:number,force=false){const next=clipmapOrigin(x,z,this.spec),cells=force?enteringClipmapCells(undefined,next,this.spec.size):enteringClipmapCells(this.origin,next,this.spec.size);if(!cells.length)return 0;for(const c of cells)this.write(c.gx,c.gz,c.slot);this.origin=next;this.mesh.count=this.spec.size*this.spec.size;this.mesh.instanceMatrix.needsUpdate=true;this.writes+=cells.length;return cells.length;}
 setQuality(quality:number){((this.mesh.material as T.Material).userData.awObserverQuality as {value:number}).value=observerRingQuality(quality,this.spec.id as any);}
 dispose(){this.mesh.removeFromParent();this.mesh.geometry.dispose();(this.mesh.material as T.Material).dispose();}
}

export class StreamedObserverGrassField{
 private rings:StreamedGrassRing[];private governor:PerceptualGovernor;private first=true;lastWrites=0;
 constructor(private root:T.Object3D,assets:Assets,private options:StreamedObserverGrassOptions){
  const source=assets.prop('grass');let material:T.Material|undefined;source.traverse(o=>{if(material||!(o instanceof T.Mesh))return;material=Array.isArray(o.material)?o.material[0]:o.material;});if(!material)throw new Error('Streamed observer grass requires Alderwatch living grass material');this.rings=STREAMED_GRASS_RINGS.map(spec=>new StreamedGrassRing(root,options,spec,material!));this.governor=new PerceptualGovernor(options.targetFrameMs??16.67);
 }
 update(x:number,z:number,frameMs:number){const quality=this.governor.sample(frameMs);let writes=0;for(const ring of this.rings){writes+=ring.update(x,z,this.first);ring.setQuality(quality);}this.first=false;this.lastWrites=writes;return {quality,frameMs:this.governor.smoothedFrameMs,writes};}
 dispose(){for(const ring of this.rings)ring.dispose();this.rings=[];}
 get quality(){return this.governor.quality;}
}
