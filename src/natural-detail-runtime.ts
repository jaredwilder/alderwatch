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
  const scale=bark?'3.15':'2.28',strength=bark?'.42':'.34';
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   #ifdef USE_MAP
    float awDetailNear=1.0-smoothstep(18.0,105.0,length(vViewPosition));
    if(awDetailNear>0.001){
     vec2 awNaturalUv=mat2(.866,-.5,.5,.866)*(vMapUv*${scale})+vec2(5.37,9.11);
     awNaturalUv+=vec2(sin(awNaturalWorld.y*.39+awNaturalWorld.x*.071),sin(awNaturalWorld.x*.31-awNaturalWorld.z*.067))*.17;
     vec2 awNaturalUv2=mat2(.71,.70,-.70,.71)*(awNaturalUv*1.67)+vec2(11.3,4.7);
     float awNaturalLuma=dot(texture2D(map,awNaturalUv).rgb,vec3(.2126,.7152,.0722));
     float awNaturalFine=dot(texture2D(map,awNaturalUv2).rgb,vec3(.2126,.7152,.0722));
     float awNaturalGrain=(awNaturalLuma-.5)*.68+(awNaturalFine-.5)*.32;
     float awWeather=.5+.5*sin(awNaturalWorld.y*.73+sin(awNaturalWorld.x*.19-awNaturalWorld.z*.17)*2.0);
     diffuseColor.rgb*=1.0+awNaturalGrain*awDetailNear*${strength};
     diffuseColor.rgb*=mix(1.0,.94+.12*awWeather,awDetailNear*.22);
    }
   #endif
  `);
 };
 const oldKey=material.customProgramCacheKey?.bind(material),suffix=bark?'bark':'stone';
 material.customProgramCacheKey=()=>`${oldKey?oldKey():material.type}-observer-natural-${suffix}-v2`;
 material.needsUpdate=true;
}

/**
 * Observer-conditioned multi-frequency detail for bark and stone. Two compact
 * resamples are evaluated only inside the readable distance band; source texture
 * bytes and GPU texture residency are unchanged.
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
