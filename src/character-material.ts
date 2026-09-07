import * as T from 'three';
/**
 * Preserve the licensed survivor atlas and rig; only grade the Ranger clothing into the
 * quieter wool/leather hierarchy used by Alderwatch. This deliberately avoids touching
 * skeletons, animation clips, sockets or locomotion.
 */
export function weatheredCloth(m:T.MeshStandardMaterial,textures:Record<string,T.Texture>,part:string){
 if(!m.name.includes('Ranger'))return;
 const jerkin=part.includes('Body')&&!part.includes('Belt');
 m.metalness=0;
 m.roughness=jerkin ? .79 : .94;
 m.envMapIntensity=jerkin ? .58 : .34;
 m.onBeforeCompile=shader=>{
  shader.uniforms.awGarment={value:textures[jerkin?'leather':'wool']};
  shader.fragmentShader='uniform sampler2D awGarment;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   // The source ranger is strongly green. Keep seams, grime and authored value structure,
   // but use that chroma dominance only as a mask for Alderwatch's grounded materials.
   float clothMask=smoothstep(1.015,1.19,diffuseColor.g/max(.001,max(diffuseColor.r,diffuseColor.b)));
   float sourceL=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   vec3 garment=texture2D(awGarment,vMapUv*${jerkin?'7.5':'10.5'}).rgb;
   float garmentL=max(.08,dot(garment,vec3(.2126,.7152,.0722)));
   vec3 neutralGarment=garment*(.62+sourceL*1.25)/garmentL*.34;
   vec3 dye=${jerkin?'vec3(.47,.36,.25)':'vec3(.34,.37,.30)'};
   vec3 graded=neutralGarment*dye*2.15;
   // Uneven UV-space wear reads as handled wool/leather from the action camera without
   // introducing painted-on fantasy highlights or changing the original normal detail.
   float wear=.94+.08*sin(vMapUv.x*71.0+vMapUv.y*43.0)*sin(vMapUv.y*31.0);
   graded*=wear;
   diffuseColor.rgb=mix(diffuseColor.rgb,graded,clothMask*.93);
  `);
 };
 m.customProgramCacheKey=()=> 'marcher-grounded-garment-v3-'+jerkin;
}
