import * as T from 'three';
import {Assets} from './assets';

const MARK=Symbol.for('alderwatch.observerNaturalDetail');

function enhance(material:T.MeshStandardMaterial){
 if((material as any)[MARK]||!material.map)return;
 const bark=material.name==='AW_bark',stone=material.name==='AW_stone';
 if(!bark&&!stone)return;
 (material as any)[MARK]=true;
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);
  shader.vertexShader='varying vec3 awNaturalWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec4 awNaturalLocal=vec4(position,1.0);
   #ifdef USE_INSTANCING
    awNaturalLocal=instanceMatrix*awNaturalLocal;
   #endif
   awNaturalWorld=(modelMatrix*awNaturalLocal).xyz;
  `);
  shader.fragmentShader='varying vec3 awNaturalWorld;\n'+shader.fragmentShader;
  const scale=bark?'3.40':'2.52',strength=bark?'.48':'.40',patina=bark?'vec3(.66,.78,.55)':'vec3(.70,.80,.64)';
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   #ifdef USE_MAP
    float awDetailNear=1.0-smoothstep(16.0,112.0,length(vViewPosition));
    float awUvFootprint=max(length(dFdx(vMapUv)),length(dFdy(vMapUv)))*${scale};
    float awBandCoarse=(1.0-smoothstep(.018,.065,awUvFootprint))*awDetailNear;
    float awBandMicro=(1.0-smoothstep(.010,.042,awUvFootprint*1.67))*awDetailNear;
    float awBandNano=(1.0-smoothstep(.006,.028,awUvFootprint*2.71))*awDetailNear;
    vec2 awWarp=vec2(sin(awNaturalWorld.y*.39+awNaturalWorld.x*.071),sin(awNaturalWorld.x*.31-awNaturalWorld.z*.067))*.17;
    vec2 awUv1=mat2(.866,-.5,.5,.866)*(vMapUv*${scale})+vec2(5.37,9.11)+awWarp;
    vec2 awUv2=mat2(.71,.70,-.70,.71)*(awUv1*1.67)+vec2(11.3,4.7)+awWarp*.41;
    vec2 awUv3=mat2(-.737,-.675,.675,-.737)*(awUv1*2.71)+vec2(3.19,13.7)-awWarp*.29;
    float awL1=.5,awL2=.5,awL3=.5;
    if(awBandCoarse>0.001)awL1=dot(texture2D(map,awUv1).rgb,vec3(.2126,.7152,.0722));
    if(awBandMicro>0.001)awL2=dot(texture2D(map,awUv2).rgb,vec3(.2126,.7152,.0722));
    if(awBandNano>0.001)awL3=dot(texture2D(map,awUv3).rgb,vec3(.2126,.7152,.0722));
    float awNaturalGrain=(awL1-.5)*.50*awBandCoarse+(awL2-.5)*.33*awBandMicro+(awL3-.5)*.17*awBandNano;
    float awWeather=.5+.5*sin(awNaturalWorld.y*.73+sin(awNaturalWorld.x*.19-awNaturalWorld.z*.17)*2.0);
    float awPatina=smoothstep(.72,.96,awWeather)*awBandCoarse;
    diffuseColor.rgb*=1.0+awNaturalGrain*${strength};
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*${patina},awPatina*.10);
    #ifdef USE_NORMALMAP
     if(awBandMicro>0.001){
      vec3 awReliefN=texture2D(normalMap,awUv2).xyz*2.0-1.0;
      float awRelief=clamp((1.0-awReliefN.z)*1.65,0.0,1.0);
      diffuseColor.rgb*=1.0-awRelief*awBandMicro*.085;
     }
    #endif
   #endif
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   #if defined(USE_MAP) && defined(USE_ROUGHNESSMAP)
    if(awBandMicro>0.001){
     float awFineRough=texture2D(roughnessMap,awUv2).g;
     roughnessFactor*=mix(1.0,.86+.26*awFineRough,awBandMicro*.44);
    }
   #endif
  `);
 };
 const oldKey=material.customProgramCacheKey?.bind(material),suffix=bark?'bark':'stone';
 material.customProgramCacheKey=()=>`${oldKey?oldKey():material.type}-observer-natural-${suffix}-v3-bandwidth`;
 material.needsUpdate=true;
}

/**
 * Screen-space bandwidth-limited stochastic surface synthesis for bark and stone.
 * Three decorrelated compact-map octaves are admitted by UV derivatives rather
 * than distance alone: frequencies disappear before their projected wavelength
 * aliases. Near fragments may spend at most five supplemental samples (3 color,
 * 1 normal-relief, 1 roughness); distant fragments coherently skip fine bands.
 */
export function installObserverNaturalDetail(){
 const proto=Assets.prototype as any;if(proto[MARK])return;proto[MARK]=true;
 const load=proto.load;
 proto.load=async function(...args:any[]){
  const result=await load.apply(this,args);
  const seen=new Set<T.Material>();
  this.kit?.scene?.traverse((o:T.Object3D)=>{if(!(o instanceof T.Mesh))return;for(const m of (Array.isArray(o.material)?o.material:[o.material])){if(seen.has(m))continue;seen.add(m);enhance(m as T.MeshStandardMaterial);}});
  return result;
 };
}

installObserverNaturalDetail();
