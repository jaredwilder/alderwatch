import * as T from 'three';

const softened=new WeakMap<T.BufferGeometry,T.BufferGeometry>();
/** Shade coincident body vertices continuously without welding skin weights or changing topology. */
export function softenedAnimalGeometry(source:T.BufferGeometry){
 const cached=softened.get(source);if(cached)return cached;
 const g=source.clone(),p=g.getAttribute('position');g.computeVertexNormals();const n=g.getAttribute('normal');
 const groups=new Map<string,{sum:T.Vector3;indices:number[]}>();
 for(let i=0;i<p.count;i++){
  const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*10000)).join(',');
  const group=groups.get(key)??{sum:new T.Vector3(),indices:[]};group.sum.add(new T.Vector3(n.getX(i),n.getY(i),n.getZ(i)));group.indices.push(i);groups.set(key,group);
 }
 for(const group of groups.values()){group.sum.normalize();for(const i of group.indices)n.setXYZ(i,group.sum.x,group.sum.y,group.sum.z);}
 softened.set(source,g);return g;
}

/** Fine coat/wool variation keeps existing maps, rig, silhouette and animation contracts. */
export function animalCoat(material:T.MeshStandardMaterial,kind:string){
 material.flatShading=false;
 material.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 awCoat;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nawCoat=position;');
  s.fragmentShader='varying vec3 awCoat;\n'+s.fragmentShader;
  const sheepDetail=kind==='sheep'?`
   float curlA=sin(coat.x*1.13+sin(coat.y*.71+coat.z*.43));
   float curlB=sin(coat.z*1.07+sin(coat.x*.59-coat.y*.67));
   float fleece=abs(curlA*curlB);
   float fleeceAA=1.0-smoothstep(.45,2.0,max(length(dFdx(coat)),length(dFdy(coat))));
  `:'float fleece=0.0; float fleeceAA=0.0;';
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 coat=awCoat*${kind==='sheep'?'46.0':'115.0'};
   float grain=sin(coat.x+sin(coat.z*1.7))*sin(coat.y*1.9+sin(coat.x*.7));
   float mottling=sin(coat.x*.047+sin(coat.z*.065))*sin(coat.y*.075);
   ${sheepDetail}
   float antialias=1.0-smoothstep(.4,1.8,max(length(dFdx(coat)),length(dFdy(coat))));
   diffuseColor.rgb*=.94+grain*.09*antialias+mottling*.12+fleece*.055*fleeceAA;
  `);
 };material.customProgramCacheKey=()=> 'aw-soft-animal-coat-v2-'+kind;
}
