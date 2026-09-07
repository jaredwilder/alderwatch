import * as T from 'three';
/** Retain the licensed atlas' seams and leather; dye only its green cloth. */
export function weatheredCloth(m:T.MeshStandardMaterial,textures:Record<string,T.Texture>,part:string){
 if(!m.name.includes('Ranger'))return;
 m.roughness=.92;
 const jerkin=part.includes('Body')&&!part.includes('Belt');
 m.onBeforeCompile=shader=>{shader.uniforms.awGarment={value:textures[jerkin?'leather':'wool']};shader.fragmentShader='uniform sampler2D awGarment;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float clothMask=smoothstep(1.03,1.23,diffuseColor.g/max(.001,max(diffuseColor.r,diffuseColor.b)));
 float clothL=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
 vec3 garment=texture2D(awGarment,vMapUv*9.0).rgb;
 vec3 dyed=garment*(.55+clothL*1.55);
 diffuseColor.rgb=mix(diffuseColor.rgb,dyed,clothMask);
 `);};
 m.customProgramCacheKey=()=> 'marcher-approved-garment-v2-'+jerkin;
}
