import * as T from 'three';
import {Assets} from './assets';
import {classifyMaterialSurface,MATERIAL_SINGULARITY_VERSION,type MaterialSurface} from './material-singularity';

const MARK=Symbol.for('alderwatch.material-singularity.v1');

function params(surface:MaterialSurface){
 switch(surface){
  case 'bark': return {detail:.18,macro:.16,tint:'vec3(.78,.88,.70)',base:'.18',up:'.08'};
  case 'stone':return {detail:.16,macro:.15,tint:'vec3(.78,.86,.72)',base:'.10',up:'.22'};
  case 'timber':return {detail:.31,macro:.13,tint:'vec3(.86,.80,.68)',base:'.16',up:'.06'};
  case 'plaster':return {detail:.24,macro:.12,tint:'vec3(.84,.82,.73)',base:'.23',up:'.04'};
  case 'thatch':return {detail:.29,macro:.14,tint:'vec3(.90,.82,.58)',base:'.08',up:'.17'};
  default:return {detail:0,macro:0,tint:'vec3(1.0)',base:'0.0',up:'0.0'};
 }
}

function enhance(material:T.MeshStandardMaterial,label:string){
 if((material as any)[MARK])return;
 const surface=classifyMaterialSurface(`${material.name} ${label}`);if(surface==='other')return;
 (material as any)[MARK]=true;material.userData.awMaterialSingularity={surface,version:MATERIAL_SINGULARITY_VERSION};
 const p=params(surface),previous=material.onBeforeCompile,oldKey=material.customProgramCacheKey?.bind(material);
 const roughMin=(surface==='stone'||surface==='plaster') ? 0.94 : 0.90;
 material.roughness=Math.max(roughMin,material.roughness??.8);material.metalness=0;
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);
  shader.vertexShader='varying vec3 awMatWorld;varying vec3 awMatLocal;varying vec3 awMatWorldNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec4 awMatP=vec4(position,1.0);
   #ifdef USE_INSTANCING
    awMatP=instanceMatrix*awMatP;
   #endif
   awMatWorld=(modelMatrix*awMatP).xyz;awMatLocal=position;awMatWorldNormal=normalize(mat3(modelMatrix)*normal);
  `);
  shader.fragmentShader=`varying vec3 awMatWorld;varying vec3 awMatLocal;varying vec3 awMatWorldNormal;
   float awMatHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
   float awMatNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(awMatHash(i),awMatHash(i+vec2(1,0)),f.x),mix(awMatHash(i+vec2(0,1)),awMatHash(i+vec2(1,1)),f.x),f.y);}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   {
    vec3 awWN=normalize(awMatWorldNormal);float awUp=max(0.0,awWN.y);
    float awPixel=max(length(dFdx(awMatWorld)),length(dFdy(awMatWorld)));
    float awMacroBand=1.0-smoothstep(.16,.62,awPixel),awMesoBand=1.0-smoothstep(.055,.24,awPixel),awMicroBand=1.0-smoothstep(.018,.095,awPixel);
    float awMacro=awMatNoise(awMatWorld.xz*.075)+.52*awMatNoise(awMatWorld.xz*.19+vec2(11.7,-4.2));awMacro/=1.52;
    float awLarge=awMatNoise(awMatWorld.xz*.028+vec2(3.1,8.7));
    float awBase=1.0-smoothstep(.18,1.45,max(0.0,awMatLocal.y));
    float awWeather=clamp(${p.base}*awBase+${p.up}*awUp+${p.macro}*(awMacro-.42),0.0,.48)*awMacroBand;
    diffuseColor.rgb*=mix(.90,1.10,awLarge)*mix(.93,1.07,awMacro);
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*${p.tint},awWeather);
    #ifdef USE_MAP
     if(awMesoBand>.001){
      vec2 awUvA=mat2(.819,-.574,.574,.819)*(vMapUv*1.61)+vec2(7.31,2.17);
      float awA=dot(texture2D(map,awUvA).rgb,vec3(.2126,.7152,.0722));
      float awGrain=clamp((awA-.50)*${p.detail},-.12,.12)*awMesoBand;
      diffuseColor.rgb*=1.0+awGrain;
      if(awMicroBand>.001&&${surface==='bark'||surface==='stone'?'false':'true'}){
       vec2 awUvB=mat2(.643,.766,-.766,.643)*(vMapUv*2.73)+vec2(3.91,13.37);
       float awB=dot(texture2D(map,awUvB).rgb,vec3(.2126,.7152,.0722));
       diffuseColor.rgb*=1.0+clamp((awB-.5)*${(p.detail*.58).toFixed(3)},-.075,.075)*awMicroBand;
      }
     }
    #endif
    ${surface==='plaster'?`float awRain=.5+.5*sin(awMatWorld.x*2.3+awMatWorld.z*.61+awMatNoise(awMatWorld.xz*.21)*3.0);diffuseColor.rgb*=1.0-awRain*awBase*.055*awMacroBand;`:''}
    ${surface==='thatch'?`float awFiber=.5+.5*sin(awMatWorld.y*19.0+awMatWorld.x*2.1-awMatWorld.z*1.7);diffuseColor.rgb*=mix(.965,1.045,awFiber*awMicroBand);`:''}
    ${surface==='stone'?`float awLichen=smoothstep(.62,.88,awMacro)*smoothstep(.18,.72,awUp)*awMacroBand;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.82,.94,.74),awLichen*.13);`:''}
   }
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   {float awRPixel=max(length(dFdx(awMatWorld)),length(dFdy(awMatWorld)));float awR=1.0-smoothstep(.04,.22,awRPixel);roughnessFactor=clamp(roughnessFactor*mix(.92,1.06,awMatNoise(awMatWorld.xz*.31)*awR),.58,1.0);}
  `);
 };
 material.customProgramCacheKey=()=>`${oldKey?oldKey():material.type}-${MATERIAL_SINGULARITY_VERSION}-${surface}`;material.needsUpdate=true;
}

function visit(root:T.Object3D,label:string,seen:Set<T.Material>){
 root.traverse(o=>{if(!(o instanceof T.Mesh))return;for(const m of (Array.isArray(o.material)?o.material:[o.material])){if(seen.has(m))continue;seen.add(m);enhance(m as T.MeshStandardMaterial,`${label} ${o.name}`);}});
}

export function installMaterialSingularity(){
 const proto=Assets.prototype as any;if(proto[MARK])return;proto[MARK]=true;
 const load=proto.load;proto.load=async function(...args:any[]){
  const result=await load.apply(this,args),seen=new Set<T.Material>();
  if(this.kit?.scene)visit(this.kit.scene,'frontier kit',seen);
  for(const [name,root] of Object.entries(this.medieval??{}) as [string,T.Object3D][])visit(root,name,seen);
  return result;
 };
}

installMaterialSingularity();
