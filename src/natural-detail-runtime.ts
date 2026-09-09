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
  const scale=bark?'2.43':'1.79',strength=bark?'.24':'.20';
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   #ifdef USE_MAP
    float awDetailNear=1.0-smoothstep(22.0,105.0,length(vViewPosition));
    vec2 awNaturalUv=mat2(.866,-.5,.5,.866)*(vMapUv*${scale})+vec2(5.37,9.11);
    awNaturalUv+=vec2(sin(awNaturalWorld.y*.39+awNaturalWorld.x*.071),sin(awNaturalWorld.x*.31-awNaturalWorld.z*.067))*.17;
    vec3 awNaturalTexel=texture2D(map,awNaturalUv).rgb;
    float awNaturalLuma=dot(awNaturalTexel,vec3(.2126,.7152,.0722));
    diffuseColor.rgb*=mix(1.0,mix(.76,1.24,awNaturalLuma),awDetailNear*${strength});
   #endif
  `);
 };
 const oldKey=material.customProgramCacheKey?.bind(material),suffix=bark?'bark':'stone';
 material.customProgramCacheKey=()=>`${oldKey?oldKey():material.type}-observer-natural-${suffix}-v1`;
 material.needsUpdate=true;
}

/**
 * Patch the asset load once, before the Far March renderer is imported.  This
 * adds a second decorrelated micro-frequency only to close-readable natural
 * surfaces.  No higher-resolution bitmap is required and the extra sample
 * fades with view distance.
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
