import * as T from 'three';
import {GLTFLoader, type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
export class Assets {
 kit!:GLTF; survivor!:GLTF; nature!:GLTF; textures:Record<string,T.Texture>={}; time={value:0};
 sight={value:new T.Vector4(0,0,0,0)};
 updateSight(camera:T.Camera,target:T.Vector3,viewport:T.Vector2,active:boolean){
  const point=target.clone().add(new T.Vector3(0,1,0));camera.updateMatrixWorld();
  const depth=-point.clone().applyMatrix4(camera.matrixWorldInverse).z;point.project(camera);
  this.sight.value.set((point.x*.5+.5)*viewport.x,(point.y*.5+.5)*viewport.y,active?viewport.y*.34:0,depth);
 }
 async load(progress:(message:string)=>void){
  const loader=new GLTFLoader(),tl=new T.TextureLoader();
  progress('Opening the old road…');
  await Promise.all([loader.loadAsync('/assets/frontier-kit.glb').then(g=>this.kit=g),loader.loadAsync('/assets/wildlife.glb').then(g=>{this.nature=g;g.scene.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=o.receiveShadow=true;}});}),loader.loadAsync('/assets/survivor.glb').then(g=>this.survivor=g),...['bark','meadow','leaves','timber','stone','grass','soil','thatch','fern','wool','leather','plaster'].map(async n=>{const t=await tl.loadAsync(`/textures/${n}.webp`);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;this.textures[n]=t;})]);
  const cache=new Map<T.Material,T.Material>();
  // glTF has already converted authored UVs to a top-left texture origin.
  this.textures.grass.flipY=false;this.textures.grass.needsUpdate=true;this.textures.leaves.flipY=false;this.textures.leaves.needsUpdate=true;
  this.textures.fern.flipY=false;this.textures.fern.needsUpdate=true;
  this.kit.scene.traverse(o=>{if(!(o instanceof T.Mesh))return;o.castShadow=o.receiveShadow=true;
   const setup=(old:T.Material)=>{if(cache.has(old))return cache.get(old)!;const m=old.clone() as T.MeshStandardMaterial;m.color.setRGB(1,1,1);m.roughness=.88;m.metalness=0;m.vertexColors=true;
    if(m.name==='AW_bark'){m.map=this.textures.bark;m.bumpMap=m.map;m.bumpScale=.065;m.color.setRGB(1.65,1.7,1.8);}
    if(m.name==='AW_leaf'){m.map=this.textures.leaves;m.alphaTest=.46;m.alphaToCoverage=true;m.side=T.DoubleSide;m.roughness=.95;m.color.setRGB(1.18,1.2,1.05);this.wind(m,.025);}
    if(m.name==='AW_foliage'){m.side=T.DoubleSide;this.wind(m,.09);}
    if(m.name==='AW_fernleaf'){m.map=this.textures.fern;m.alphaTest=.5;m.alphaToCoverage=true;m.side=T.DoubleSide;m.roughness=1;this.wind(m,.045);}
    if(m.name==='AW_grass'){m.map=this.textures.grass;m.alphaTest=.48;m.alphaToCoverage=true;m.side=T.DoubleSide;m.roughness=1;m.color.setRGB(.78,.94,.72);this.wind(m,.045);const sway=m.onBeforeCompile;m.onBeforeCompile=(s,r)=>{sway.call(m,s,r);s.vertexShader='varying vec3 awMeadowPosition; varying float awBladeHeight;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvec4 awLocal=vec4(position,1.0);\n#ifdef USE_INSTANCING\nawLocal=instanceMatrix*awLocal;\n#endif\nawMeadowPosition=(modelMatrix*awLocal).xyz;awBladeHeight=position.y;`);s.fragmentShader='varying vec3 awMeadowPosition; varying float awBladeHeight;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nfloat awField=.5+.5*sin(awMeadowPosition.x*.17+sin(awMeadowPosition.z*.13)*2.0)*sin(awMeadowPosition.z*.19);diffuseColor.rgb*=mix(vec3(.66,.78,.67),vec3(1.02,.98,.83),awField)*mix(.68,1.0,smoothstep(0.0,.42,awBladeHeight));`);};m.customProgramCacheKey=()=> 'layered-meadow-wind-v2';}
    if(m.name==='AW_stone'){m.map=this.textures.stone;m.bumpMap=m.map;m.bumpScale=.09;m.color.setRGB(.76,.81,.85);m.roughness=1;}
    if(m.name==='AW_highland'){m.fog=true;m.roughness=1;m.color.setRGB(1,1,1);m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;','vec3 outgoingLight = diffuseColor.rgb;');};m.customProgramCacheKey=()=> 'baked-highland-light-v2';}
    if(m.name==='AW_wood'){m.map=this.textures.timber;m.bumpMap=m.map;m.bumpScale=.018;m.color.setRGB(1.9,1.9,1.9);m.roughness=.93;}
    if(m.name==='AW_frame'){m.map=this.textures.timber;m.bumpMap=m.map;m.bumpScale=.025;m.color.setRGB(1.75,1.8,1.9);m.roughness=.93;}
    if(m.name==='AW_plaster'){m.map=this.textures.plaster;m.bumpMap=m.map;m.bumpScale=.018;m.roughness=1;m.color.setRGB(.98,.98,.95);m.onBeforeCompile=s=>{s.vertexShader='varying vec3 awPlasterPos;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nawPlasterPos=position;');s.fragmentShader='varying vec3 awPlasterPos;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nfloat awStain=(1.0-smoothstep(.1,.9,awPlasterPos.y))*.22;float awWear=sin(awPlasterPos.x*18.0+sin(awPlasterPos.y*21.0))*sin(awPlasterPos.y*24.0)*.026;diffuseColor.rgb*=1.0-awStain+awWear;`);};m.customProgramCacheKey=()=> 'weathered-lime-plaster-v1';}
    if(m.name==='AW_endgrain'){m.vertexColors=false;m.color.set('#b69560');m.roughness=1;}
    if(m.name==='AW_thatch'){m.map=this.textures.thatch;m.bumpMap=m.map;m.bumpScale=.035;m.color.setRGB(1.65,1.7,1.85);m.roughness=1;}
    if(m.name==='AW_iron'||m.name==='AW_edge'){m.metalness=.78;m.roughness=.42;if(m.name==='AW_iron')m.color.setRGB(.24,.27,.28);}
    if(m.name==='AW_flaxflower'){m.side=T.DoubleSide;m.roughness=1;}
    if(m.name==='AW_ember'){m.emissive.set('#ef4c08');m.emissiveIntensity=1.8;}
if(m.name==='AW_grass'){const meadow=m.onBeforeCompile;m.onBeforeCompile=(s,r)=>{meadow.call(m,s,r);s.vertexShader=s.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal=normalize(vec3(objectNormal.x*.12,1.0,objectNormal.z*.12));');s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal*=faceDirection;\n#endif');};const key=m.customProgramCacheKey();m.customProgramCacheKey=()=>key+'-canopy-normal-v2';}
    if(m.name==='AW_leaf'||m.name==='AW_bark')this.sightCutaway(m);
    cache.set(old,m);return m;};o.material=Array.isArray(o.material)?o.material.map(setup):setup(o.material);
  });
  this.survivor.scene.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;for(const m of (Array.isArray(o.material)?o.material:[o.material]) as T.MeshStandardMaterial[]){if(m.name==='AW_CostumeWool'||m.name==='AW_CostumeLeather'){m.map=this.textures[m.name==='AW_CostumeWool'?'wool':'leather'];m.color.setRGB(1,1,1);m.bumpMap=m.map;m.bumpScale=.002;m.roughness=.94;m.side=T.DoubleSide;}}}});
 }
 wind(m:T.MeshStandardMaterial,strength:number){m.onBeforeCompile=s=>{s.uniforms.awTime=this.time;s.vertexShader='uniform float awTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nfloat awH=max(position.y,0.0); transformed.x += sin(awTime*1.7+position.x*.8+position.z*.6)*${strength}*awH; transformed.z += cos(awTime*1.4+position.z*.7)*${strength*.5}*awH;`);};m.customProgramCacheKey=()=>`aw-wind-${strength}`;}
 sightCutaway(m:T.MeshStandardMaterial){
  const prior=m.onBeforeCompile,key=m.customProgramCacheKey();
  m.onBeforeCompile=(s,r)=>{prior.call(m,s,r);s.uniforms.awSight=this.sight;s.fragmentShader='uniform vec4 awSight;\n'+s.fragmentShader;
   // Only foreground occluders: retain trees behind the player and their shadows.
   s.fragmentShader=s.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
    if(awSight.z>0.0 && vViewPosition.z<awSight.w-1.0){
     float radius=length(gl_FragCoord.xy-awSight.xy)/awSight.z;
     float keep=smoothstep(.78,1.0,radius);
     ${m.name==='AW_leaf'?'keep*=smoothstep(1.5,3.5,length(vViewPosition));':''}
     float stipple=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
     if(keep<.001 || keep<stipple)discard;
    }`);
  };m.customProgramCacheKey=()=>key+'-sight-cutaway-v1';
 }
 prop(name:string){const o=this.kit.scene.getObjectByName(name)??this.nature?.scene.getObjectByName(name);if(!o)throw new Error('Missing authored asset: '+name);return o.clone(true);}
 human(){return clone(this.survivor.scene);}
}
