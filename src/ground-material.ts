import * as T from 'three';
/**
 * Ground shader for the March. The saved/simulated terrain only needs to author a broad
 * soilMix mask; visual identity is resolved here so meadow, woodland litter, roads,
 * settlement yards and wet ground stop collapsing into one repeating green carpet.
 */
export function groundMaterial(meadow:T.Texture,soil:T.Texture){
 const material=new T.MeshStandardMaterial({map:meadow,vertexColors:true,roughness:.98});
 material.onBeforeCompile=s=>{
  s.uniforms.awSoil={value:soil};
  s.vertexShader='attribute float soilMix; varying float vSoilMix; varying vec2 vGroundWorld;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSoilMix=soilMix; vGroundWorld=position.xz;');
  s.fragmentShader=`uniform sampler2D awSoil; varying float vSoilMix; varying vec2 vGroundWorld;
float awHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float awNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(awHash(i),awHash(i+vec2(1,0)),f.x),mix(awHash(i+vec2(0,1)),awHash(i+1.0),f.x),f.y);}
float awEllipse(vec2 p,vec2 c,vec2 r){vec2 q=(p-c)/r;return 1.0-smoothstep(.72,1.08,length(q));}
`+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
   vec2 world=vGroundWorld;
   vec2 uvA=world*.32;
   vec2 uvB=mat2(.819,.574,-.574,.819)*world*.205+vec2(17.3,-9.7);
   float fine=awNoise(world*.115+3.2),macro=awNoise(world*.025-11.0),micro=awNoise(world*.44+27.0);
   vec3 grassA=texture2D(map,vMapUv).rgb;
   vec3 grassB=texture2D(map,vMapUv*.63+vec2(.37,.19)).rgb;
   vec3 meadowTex=mix(grassA,grassB,.32+.26*macro);
   vec3 dirtA=texture2D(awSoil,uvA).rgb;
   vec3 dirtB=texture2D(awSoil,uvB).rgb;
   vec3 earth=mix(dirtA,dirtB,.36+.22*fine);

   // The main Alderbrook road uses the same deterministic centreline as terrain.ts.
   float mainRoad=abs(world.x-sin(world.y*.045)*4.0);
   float roadMask=(1.0-smoothstep(1.45,3.85,mainRoad))*(1.0-smoothstep(42.0,55.0,world.y));
   // Authored settlement yard: broad trampled space, then individual house yards break it up.
   float village=awEllipse(world,vec2(2.0,-50.0),vec2(28.0,34.0));
   float homeYards=max(max(awEllipse(world,vec2(-9.0,-34.0),vec2(8.0,9.0)),awEllipse(world,vec2(9.0,-46.0),vec2(8.5,10.0))),max(awEllipse(world,vec2(-14.0,-54.0),vec2(8.5,10.0)),awEllipse(world,vec2(14.0,-67.0),vec2(9.0,10.5))));
   float yardMask=max(village*.48,homeYards*.82)*(1.0-roadMask*.55);
   float pondWet=awEllipse(world,vec2(-31.0,-12.0),vec2(15.5,31.5));
   float wetMask=pondWet*smoothstep(.25,.72,vSoilMix)*(1.0-roadMask*.6);

   // soilMix already knows about canopy/root litter. Low-frequency breakup keeps the forest
   // floor organic instead of painting a second giant tiled texture across the scene.
   float forestHint=smoothstep(.36,.78,vSoilMix)*(1.0-roadMask)*(1.0-yardMask*.76)*(1.0-wetMask);
   forestHint*=.70+.30*awNoise(world*.055+8.0);
   float wornMask=clamp(vSoilMix-max(max(forestHint*.72,wetMask*.8),roadMask*.85),0.0,1.0);

   vec3 meadow=meadowTex*mix(vec3(.84,.91,.76),vec3(1.02,.93,.73),macro*.58)*( .88+fine*.20 );
   vec3 forest=earth*mix(vec3(.63,.66,.48),vec3(.78,.72,.50),macro)*(.86+micro*.10);
   vec3 worn=earth*mix(vec3(.94,.80,.58),vec3(.72,.58,.42),fine)*1.03;
   vec3 mud=earth*mix(vec3(.43,.47,.38),vec3(.30,.34,.31),fine)*.84;
   vec3 road=earth*mix(vec3(.69,.64,.53),vec3(.82,.72,.55),macro)*(.91+micro*.07);
   vec3 yard=earth*mix(vec3(.80,.70,.53),vec3(.66,.61,.49),fine)*(.96+macro*.08);

   vec3 ground=meadow;
   ground=mix(ground,forest,forestHint*.86);
   ground=mix(ground,worn,wornMask*.68);
   ground=mix(ground,yard,yardMask*(.72+.18*fine));
   ground=mix(ground,road,roadMask*(.90+.06*micro));
   ground=mix(ground,mud,wetMask*(.78+.12*fine));
   // Vertex colour remains deliberately visible: it carries the authored bright-daylight macro tint.
   diffuseColor.rgb*=ground*(.94+.12*macro);
  `);
 };
 material.customProgramCacheKey=()=> 'alderwatch-ground-splat-v4-surface-identities';
 return material;
}
