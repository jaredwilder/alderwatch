import * as T from 'three';

/** Layered PBR woodland floor, with the original material retained for lightweight callers. */
export function groundMaterial(meadow:T.Texture,_soil:T.Texture,surfaces?:Record<string,T.Texture>){
 if(surfaces)return woodlandGround(surfaces);
 meadow.colorSpace=T.SRGBColorSpace;
 meadow.wrapS=meadow.wrapT=T.RepeatWrapping;
 meadow.needsUpdate=true;
 return new T.MeshStandardMaterial({
  map:meadow,
  vertexColors:true,
  roughness:1,
  metalness:0,
 });
}

function woodlandGround(textures:Record<string,T.Texture>){
 const material=new T.MeshStandardMaterial({map:textures['field-color'],roughness:1,metalness:0});
 material.name='Alderwatch layered woodland floor';
 material.onBeforeCompile=s=>{
  s.uniforms.awField={value:textures['field-color']};s.uniforms.awLitter={value:textures['litter-color']};
  s.uniforms.awFieldNormal={value:textures['field-normal']};s.uniforms.awLitterNormal={value:textures['litter-normal']};
  s.vertexShader='attribute float soilMix;varying float awSoilMix;varying vec3 awGround;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nawSoilMix=soilMix;awGround=position;');
  s.fragmentShader='uniform sampler2D awField;uniform sampler2D awLitter;uniform sampler2D awFieldNormal;uniform sampler2D awLitterNormal;varying float awSoilMix;varying vec3 awGround;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
   vec2 groundUv=awGround.xz*.32;
   float macro=.5+.5*sin(awGround.x*.047+sin(awGround.z*.037)*1.4)*sin(awGround.z*.054);
   float wear=smoothstep(.28,.86,awSoilMix);
   vec3 field=texture2D(awField,groundUv).rgb;
   vec3 litter=texture2D(awLitter,groundUv*.72).rgb;
   diffuseColor.rgb=mix(field*vec3(.78,.91,.72),litter*vec3(.38,.37,.29),wear*.78)*mix(.86,1.10,macro);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 detail=mix(texture2D(awFieldNormal,groundUv).xyz,texture2D(awLitterNormal,groundUv*.72).xyz,wear)*2.0-1.0;
   vec3 dx=dFdx(vViewPosition),dy=dFdy(vViewPosition);vec2 tx=dFdx(groundUv),ty=dFdy(groundUv);
   vec3 tangent=normalize(dx*ty.y-dy*tx.y),bitangent=normalize(-dx*ty.x+dy*tx.x);
   normal=normalize(normal+(.23*detail.x*tangent+.23*detail.y*bitangent));
  `);
 };material.customProgramCacheKey=()=> 'aw-woodland-floor-v1';return material;
}
