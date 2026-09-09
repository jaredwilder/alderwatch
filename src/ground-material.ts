import * as T from 'three';

/** Layered PBR woodland floor, with the original material retained for lightweight callers. */
export function groundMaterial(meadow:T.Texture,_soil:T.Texture,surfaces?:Record<string,T.Texture>){
 if(surfaces)return woodlandGround(surfaces);
 meadow.colorSpace=T.SRGBColorSpace;
 meadow.wrapS=meadow.wrapT=T.RepeatWrapping;
 meadow.needsUpdate=true;
 return new T.MeshStandardMaterial({map:meadow,vertexColors:true,roughness:1,metalness:0});
}

/** Compact source textures, expanded into observer-conditioned multiscale detail. */
function woodlandGround(textures:Record<string,T.Texture>){
 const detail={value:1};
 const material=new T.MeshStandardMaterial({map:textures['field-color'],roughness:1,metalness:0});
 material.name='Alderwatch observer-detail woodland floor';material.userData.awGroundDetailQuality=detail;
 material.onBeforeCompile=s=>{
  s.uniforms.awField={value:textures['field-color']};s.uniforms.awLitter={value:textures['litter-color']};
  s.uniforms.awFieldNormal={value:textures['field-normal']};s.uniforms.awLitterNormal={value:textures['litter-normal']};
  s.uniforms.awFieldRough={value:textures['field-rough']};s.uniforms.awLitterRough={value:textures['litter-rough']};s.uniforms.awGroundDetailQuality=detail;
  s.vertexShader='attribute float soilMix;varying float awSoilMix;varying vec3 awGround;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nawSoilMix=soilMix;awGround=position;');
  s.fragmentShader=`uniform sampler2D awField;uniform sampler2D awLitter;uniform sampler2D awFieldNormal;uniform sampler2D awLitterNormal;uniform sampler2D awFieldRough;uniform sampler2D awLitterRough;uniform float awGroundDetailQuality;varying float awSoilMix;varying vec3 awGround;
   vec2 awWarp(vec2 p){return vec2(sin(p.y*.173+sin(p.x*.071)*1.9),sin(p.x*.149-sin(p.y*.083)*1.7));}
  `+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
   vec2 groundUv=awGround.xz*.32;
   float macro=.5+.5*sin(awGround.x*.047+sin(awGround.z*.037)*1.4)*sin(awGround.z*.054);
   float wear=smoothstep(.28,.86,awSoilMix);
   float awViewDistance=length(vViewPosition);
   float awGroundNear=(1.0-smoothstep(18.0,86.0,awViewDistance))*awGroundDetailQuality;
   vec2 warp=awWarp(awGround.xz)*.31;
   vec2 fieldUvA=groundUv+warp,fieldUvB=mat2(.80,-.60,.60,.80)*(groundUv*1.87)+vec2(7.13,3.71);
   vec2 litterUvA=groundUv*.72+warp*.63,litterUvB=mat2(.66,.75,-.75,.66)*(groundUv*1.31)+vec2(2.87,9.41);
   float breakup=.5+.5*sin(awGround.x*.119+sin(awGround.z*.097)*2.3);
   vec3 field=texture2D(awField,fieldUvA).rgb,litter=texture2D(awLitter,litterUvA).rgb;
   if(awGroundDetailQuality>.52){
    vec3 fieldB=texture2D(awField,fieldUvB).rgb,litterB=texture2D(awLitter,litterUvB).rgb;
    field=mix(field,fieldB,.18+.18*breakup);litter=mix(litter,litterB,.15+.20*(1.0-breakup));
   }
   if(awGroundNear>0.001&&awGroundDetailQuality>.78){
    vec2 fineUv=mat2(.57,-.82,.82,.57)*(fieldUvB*2.13)+vec2(4.23,11.71);
    vec3 fineField=texture2D(awField,fineUv).rgb;
    float baseL=dot(field,vec3(.2126,.7152,.0722)),fineL=dot(fineField,vec3(.2126,.7152,.0722));
    field*=1.0+clamp((fineL-baseL)*1.55,-.16,.16)*awGroundNear;
   }
   diffuseColor.rgb=mix(field*vec3(.70,.96,.64),litter*vec3(.37,.36,.27),wear*.80)*mix(.86,1.08,macro);
   diffuseColor.rgb*=mix(vec3(1.0),vec3(.94,1.03,.91),awGroundNear*(1.0-wear)*.18);

   // Horizon bridge remains resident even when microscopic samples lose their bid.
   float awMeadowBridge=smoothstep(32.0,92.0,awViewDistance)*(1.0-smoothstep(.16,.68,wear));
   float awCanopyBreak=.86+.18*breakup+.08*(macro-.5);
   vec3 awCanopyTint=field*mix(vec3(.54,.84,.46),vec3(.66,.96,.54),macro*.45)*awCanopyBreak;
   diffuseColor.rgb=mix(diffuseColor.rgb,awCanopyTint,awMeadowBridge*.58);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   if(awGroundDetailQuality>.52){
    float awFieldR=texture2D(awFieldRough,fieldUvA).r,awLitterR=texture2D(awLitterRough,litterUvA).r;
    if(awGroundDetailQuality>.82){awFieldR=mix(awFieldR,texture2D(awFieldRough,fieldUvB).r,.24);awLitterR=mix(awLitterR,texture2D(awLitterRough,litterUvB).r,.22);}
    roughnessFactor*=mix(.82,1.0,mix(awFieldR,awLitterR,wear));
   }else roughnessFactor*=.94;
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   if(awGroundDetailQuality>.52){
    vec3 baseDetail=mix(texture2D(awFieldNormal,fieldUvA).xyz,texture2D(awLitterNormal,litterUvA).xyz,wear)*2.0-1.0;
    vec3 detail=baseDetail;
    if(awGroundDetailQuality>.82){
     vec2 microField=mat2(.91,.41,-.41,.91)*(fieldUvB*1.53),microLitter=mat2(.87,-.49,.49,.87)*(litterUvB*1.61);
     vec3 microDetail=mix(texture2D(awFieldNormal,microField).xyz,texture2D(awLitterNormal,microLitter).xyz,wear)*2.0-1.0;
     detail=normalize(baseDetail+microDetail*.58*awGroundNear);
    }
    vec3 dx=dFdx(vViewPosition),dy=dFdy(vViewPosition);vec2 tx=dFdx(groundUv),ty=dFdy(groundUv);
    vec3 tangent=normalize(dx*ty.y-dy*tx.y),bitangent=normalize(-dx*ty.x+dy*tx.x);
    normal=normalize(normal+(.29*detail.x*tangent+.29*detail.y*bitangent)*mix(.72,1.0,awGroundDetailQuality));
   }
  `);
 };material.customProgramCacheKey=()=> 'aw-observer-detail-ground-v3-horizon-bridge-perceptual-market-v1';return material;
}
