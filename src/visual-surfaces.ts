import * as T from 'three';
import {nestedDetailLevel} from './detail-field-math';

/** Retain source material masks but give simple architectural palettes real surfaces. */
export function architecturalSurface(material:T.MeshStandardMaterial,textures:Record<string,T.Texture>){
 material.roughness=.92;material.metalness=0;
 // The modular kit already has authored albedo/normal/roughness atlases. Do not paint over them.
 if(material.map)return;
 const plasterSurface=/wall|plaster/i.test(material.name),stoneSurface=/stone|rock/i.test(material.name),woodSurface=/wood|timber/i.test(material.name);
 material.onBeforeCompile=s=>{
  s.uniforms.awTimber={value:textures.timber};s.uniforms.awPlaster={value:textures.plaster};s.uniforms.awRock={value:textures['rock-color']};
  s.vertexShader='varying vec3 awSurface; varying vec3 awSurfaceNormal;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec4 surfacePosition=vec4(position,1.0);
   #ifdef USE_INSTANCING
    surfacePosition=instanceMatrix*surfacePosition;
   #endif
   awSurface=(modelMatrix*surfacePosition).xyz;awSurfaceNormal=normalize(mat3(modelMatrix)*normal);
  `);
  s.fragmentShader='uniform sampler2D awTimber;uniform sampler2D awPlaster;uniform sampler2D awRock;varying vec3 awSurface;varying vec3 awSurfaceNormal;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 n=abs(normalize(awSurfaceNormal));vec2 uv=n.y>.65?awSurface.xz:(n.x>n.z?awSurface.zy:awSurface.xy);
   vec3 source=diffuseColor.rgb;float lightness=dot(source,vec3(.2126,.7152,.0722));
   float saturation=max(max(source.r,source.g),source.b)-min(min(source.r,source.g),source.b);
   float cream=${plasterSurface?'1.0':woodSurface||stoneSurface?'0.0':'smoothstep(.38,.68,lightness)*(1.0-smoothstep(.12,.32,saturation))'};
   float cold=step(source.r*1.12,source.b);float stone=${stoneSurface?'1.0':plasterSurface||woodSurface?'0.0':'clamp(cold+(1.0-smoothstep(.035,.12,saturation))*(1.0-cream),0.0,1.0)'};
   vec3 wood=texture2D(awTimber,uv*vec2(1.15,.55)).rgb*vec3(.61,.57,.49);
   vec3 plaster=texture2D(awPlaster,uv*.38).rgb*vec3(.82,.79,.70);
   vec3 rock=texture2D(awRock,uv*.68).rgb*vec3(.64,.68,.69);
   diffuseColor.rgb=mix(mix(wood,rock,stone*.85),plaster,cream)*mix(.48,1.15,smoothstep(.02,.7,lightness));
  `);
 };material.customProgramCacheKey=()=> 'aw-architectural-world-surfaces-3-'+plasterSurface+stoneSurface+woodSurface;
}

/**
 * Dense observer-field grass cell.
 *
 * One shared mesh now carries a nested deterministic population of 88 blades.
 * The runtime still instances the same clumps, so draw-call count and JS object
 * count are unchanged; the extra perceived biomass is paid almost entirely in
 * vertex throughput.  The four rank bands are intentionally nested so future
 * clipmap/WebGPU LOD can discard outer bands without grass popping sideways.
 */
export function meadowBlades(time:{value:number}){
 const positions:number[]=[],colors:number[]=[],indices:number[]=[],normals:number[]=[];
 let seed=913;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
 for(let b=0;b<88;b++){
  const rank=random(),tier=nestedDetailLevel(rank),a=random()*Math.PI*2;
  // Later detail bands preferentially occupy the outside of the cell.  If a
  // coarse tier is hidden, the surviving grass still covers the whole patch.
  const radialBias=tier===0?.96:tier===1?1:tier===2?1.04:1.08;
  const r=Math.sqrt(random())*.78*radialBias,x=Math.cos(a)*r,z=Math.sin(a)*r,yaw=random()*6.283;
  const h=(.16+random()*.37)*(tier===3?.82:1),w=.014+random()*.014,bend=.07+random()*.24,base=positions.length/3;
  const species=random(),c=new T.Color(species>.955?'#a49a62':species>.68?'#66783d':species>.25?'#49682e':'#365923');
  for(let j=0;j<3;j++){
   const t=j/2,curve=bend*t*t;
   for(const side of [-1,1]){
    positions.push(x+Math.cos(yaw)*w*(1-t)*side+Math.sin(yaw)*curve,h*t,z-Math.sin(yaw)*w*(1-t)*side+Math.cos(yaw)*curve);
    const shade=.49+t*.64;colors.push(c.r*shade,c.g*shade,c.b*shade);normals.push(0,1,0);
   }
  }
  for(let j=0;j<2;j++){const k=base+j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setIndex(indices);geometry.computeBoundingSphere();
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide});material.name='AW_LivingGrass';
 material.onBeforeCompile=s=>{s.uniforms.awTime=time;s.vertexShader='uniform float awTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vec3 anchor=position;
  #ifdef USE_INSTANCING
   anchor=(instanceMatrix*vec4(position,1.0)).xyz;
  #endif
  float awPhase=anchor.x*.56+anchor.z*.35;
  float awGust=.72+.28*sin(awTime*.19+anchor.x*.031-anchor.z*.027);
  transformed.x+=sin(awTime*1.45+awPhase)*.072*awGust*position.y*position.y;
  transformed.z+=cos(awTime*1.10+anchor.z*.45)*.043*awGust*position.y*position.y;
 `);s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal*=faceDirection;\n#endif');};material.customProgramCacheKey=()=> 'living-meadow-observer-field-v1';
 const mesh=new T.Mesh(geometry,material);mesh.name='grass';mesh.receiveShadow=true;return mesh;
}
