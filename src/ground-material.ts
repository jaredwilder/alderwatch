import * as T from 'three';
/** Two original tiled albedos, blended by authored ecology rather than a green plane. */
export function groundMaterial(meadow:T.Texture,soil:T.Texture){
 const material=new T.MeshStandardMaterial({map:meadow,vertexColors:true,roughness:1});
 material.onBeforeCompile=s=>{
  s.uniforms.awSoil={value:soil};
  s.vertexShader='attribute float soilMix; varying float vSoilMix; varying vec2 vGroundUv;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSoilMix=soilMix; vGroundUv=position.xz*.32;');
  s.fragmentShader=`uniform sampler2D awSoil; varying float vSoilMix; varying vec2 vGroundUv;
float awHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float awNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(awHash(i),awHash(i+vec2(1,0)),f.x),mix(awHash(i+vec2(0,1)),awHash(i+1.0),f.x),f.y);}
`+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
   vec3 awEarth=texture2D(awSoil,vGroundUv).rgb;
   float awPatch=awNoise(vGroundUv*.34),awBroad=awNoise(vGroundUv*.08+7.0);
   float awBlend=smoothstep(.18,.88,vSoilMix+(awPatch-.5)*.16);
   vec3 awGrass=mix(texture2D(map,vMapUv).rgb,texture2D(map,vMapUv*.61+vec2(.37,.19)).rgb,.38);
   vec3 awTint=mix(vec3(.87,.95,.78),vec3(1.08,1.02,.86),awBroad);
   diffuseColor.rgb*=mix(awGrass*awTint,awEarth*1.07,awBlend)*(0.82+awPatch*.30);
  `);
 };
 material.customProgramCacheKey=()=> 'alderwatch-ground-splat-v3-restored';
 return material;
}
