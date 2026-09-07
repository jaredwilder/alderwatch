import * as T from 'three';

/**
 * Local terrain material.
 *
 * The meadow/soil images are used as *detail*, not as authoritative palette.
 * This is deliberate: a strongly coloured source texel must never be able to
 * turn a whole soilMix region into the orange/red sheet seen in the live build.
 * Ecology still owns where earth appears; this shader owns a bounded March
 * palette for how that earth is presented.
 */
export function groundMaterial(meadow:T.Texture,soil:T.Texture){
 const material=new T.MeshStandardMaterial({map:meadow,vertexColors:true,roughness:1});
 material.onBeforeCompile=s=>{
  s.uniforms.awSoil={value:soil};
  s.vertexShader='attribute float soilMix; varying float vSoilMix; varying vec2 vGroundUv;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSoilMix=soilMix; vGroundUv=position.xz*.32;');
  s.fragmentShader=`uniform sampler2D awSoil; varying float vSoilMix; varying vec2 vGroundUv;
float awHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float awNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(awHash(i),awHash(i+vec2(1,0)),f.x),mix(awHash(i+vec2(0,1)),awHash(i+1.0),f.x),f.y);}
float awLuma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
`+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
   float awPatch=awNoise(vGroundUv*.34);
   float awBroad=awNoise(vGroundUv*.08+7.0);

   // Preserve authored texture grain while intentionally discarding its hue.
   // Palette comes from calibrated March colours below, so an albedo import can
   // never paint hectares of terrain salmon/orange again.
   vec3 awGrassSampleA=texture2D(map,vMapUv).rgb;
   vec3 awGrassSampleB=texture2D(map,vMapUv*.61+vec2(.37,.19)).rgb;
   float awGrassDetail=mix(awLuma(awGrassSampleA),awLuma(awGrassSampleB),.38);
   vec3 awGrassBase=mix(vec3(.38,.50,.27),vec3(.58,.62,.36),awBroad);
   vec3 awGrass=awGrassBase*(.70+awGrassDetail*.58)*( .91+awPatch*.17 );

   vec3 awSoilSampleA=texture2D(awSoil,vGroundUv).rgb;
   vec3 awSoilSampleB=texture2D(awSoil,vGroundUv*.67+vec2(11.3,-4.7)).rgb;
   float awSoilDetail=mix(awLuma(awSoilSampleA),awLuma(awSoilSampleB),.34);
   vec3 awEarthBase=mix(vec3(.31,.25,.17),vec3(.43,.35,.23),awBroad);
   vec3 awEarth=awEarthBase*(.72+awSoilDetail*.52)*( .92+awPatch*.12 );

   // Ecology can expose earth broadly beneath crowns/roads, but presentation is
   // capped so one mask cannot visually swallow the entire playable terrain.
   float awBlend=smoothstep(.34,.92,vSoilMix+(awPatch-.5)*.08)*.74;
   diffuseColor.rgb*=mix(awGrass,awEarth,awBlend);
  `);
 };
 material.customProgramCacheKey=()=> 'alderwatch-ground-splat-v5-bounded-palette';
 return material;
}
