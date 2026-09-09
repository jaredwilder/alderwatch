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

/**
 * Observer-conditioned terrain synthesis.
 *
 * The source assets stay compact.  Two decorrelated continuous texture domains
 * create a much longer apparent repetition period, while the second normal
 * octave fades out with view distance so expensive detail is spent where it can
 * actually alter pixels.  No extra terrain meshes or JS objects are introduced.
 */
function woodlandGround(textures:Record<string,T.Texture>){
 const material=new T.MeshStandardMaterial({map:textures['field-color'],roughness:1,metalness:0});
 material.name='Alderwatch observer-detail woodland floor';
 material.onBeforeCompile=s=>{
  s.uniforms.awField={value:textures['field-color']};s.uniforms.awLitter={value:textures['litter-color']};
  s.uniforms.awFieldNormal={value:textures['field-normal']};s.uniforms.awLitterNormal={value:textures['litter-normal']};
  s.uniforms.awFieldRough={value:textures['field-rough']};s.uniforms.awLitterRough={value:textures['litter-rough']};
  s.vertexShader='attribute float soilMix;varying float awSoilMix;varying vec3 awGround;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nawSoilMix=soilMix;awGround=position;');
  s.fragmentShader=`uniform sampler2D awField;uniform sampler2D awLitter;uniform sampler2D awFieldNormal;uniform sampler2D awLitterNormal;uniform sampler2D awFieldRough;uniform sampler2D awLitterRough;varying float awSoilMix;varying vec3 awGround;
   vec2 awWarp(vec2 p){
    return vec2(sin(p.y*.173+sin(p.x*.071)*1.9),sin(p.x*.149-sin(p.y*.083)*1.7));
   }
  `+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
   vec2 groundUv=awGround.xz*.32;
   float macro=.5+.5*sin(awGround.x*.047+sin(awGround.z*.037)*1.4)*sin(awGround.z*.054);
   float wear=smoothstep(.28,.86,awSoilMix);
   vec2 warp=awWarp(awGround.xz)*.31;
   vec2 fieldUvA=groundUv+warp,fieldUvB=mat2(.80,-.60,.60,.80)*(groundUv*1.87)+vec2(7.13,3.71);
   vec2 litterUvA=groundUv*.72+warp*.63,litterUvB=mat2(.66,.75,-.75,.66)*(groundUv*1.31)+vec2(2.87,9.41);
   float breakup=.5+.5*sin(awGround.x*.119+sin(awGround.z*.097)*2.3);
   vec3 fieldA=texture2D(awField,fieldUvA).rgb,fieldB=texture2D(awField,fieldUvB).rgb;
   vec3 litterA=texture2D(awLitter,litterUvA).rgb,litterB=texture2D(awLitter,litterUvB).rgb;
   vec3 field=mix(fieldA,fieldB,.18+.18*breakup),litter=mix(litterA,litterB,.15+.20*(1.0-breakup));
   diffuseColor.rgb=mix(field*vec3(.76,.92,.70),litter*vec3(.38,.37,.28),wear*.80)*mix(.84,1.11,macro);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   float awFieldR=mix(texture2D(awFieldRough,fieldUvA).r,texture2D(awFieldRough,fieldUvB).r,.24);
   float awLitterR=mix(texture2D(awLitterRough,litterUvA).r,texture2D(awLitterRough,litterUvB).r,.22);
   roughnessFactor*=mix(.82,1.0,mix(awFieldR,awLitterR,wear));
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 baseDetail=mix(texture2D(awFieldNormal,fieldUvA).xyz,texture2D(awLitterNormal,litterUvA).xyz,wear)*2.0-1.0;
   float awNear=1.0-smoothstep(24.0,92.0,length(vViewPosition));
   vec2 microField=mat2(.91,.41,-.41,.91)*(fieldUvB*1.53),microLitter=mat2(.87,-.49,.49,.87)*(litterUvB*1.61);
   vec3 microDetail=mix(texture2D(awFieldNormal,microField).xyz,texture2D(awLitterNormal,microLitter).xyz,wear)*2.0-1.0;
   vec3 detail=normalize(baseDetail+microDetail*.42*awNear);
   vec3 dx=dFdx(vViewPosition),dy=dFdy(vViewPosition);vec2 tx=dFdx(groundUv),ty=dFdy(groundUv);
   vec3 tangent=normalize(dx*ty.y-dy*tx.y),bitangent=normalize(-dx*ty.x+dy*tx.x);
   normal=normalize(normal+(.245*detail.x*tangent+.245*detail.y*bitangent));
  `);
 };material.customProgramCacheKey=()=> 'aw-observer-detail-ground-v1';return material;
}
