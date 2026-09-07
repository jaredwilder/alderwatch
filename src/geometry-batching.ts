import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

type Attribute=T.BufferAttribute|T.InterleavedBufferAttribute;

function attributeKey(attribute:Attribute){
 const gpuType='gpuType' in attribute?attribute.gpuType:undefined;
 return `${attribute.array.constructor.name}:${attribute.itemSize}:${attribute.normalized?1:0}:${gpuType??'default'}`;
}

function geometryKey(geometry:T.BufferGeometry){
 const attributes=Object.keys(geometry.attributes).sort().map(name=>`${name}=${attributeKey(geometry.getAttribute(name) as Attribute)}`).join('|');
 const morphs=Object.keys(geometry.morphAttributes).sort().map(name=>`${name}=[${geometry.morphAttributes[name].map(attribute=>attributeKey(attribute as Attribute)).join(',')}]`).join('|');
 return `${geometry.index?'indexed':'plain'};relative=${geometry.morphTargetsRelative?1:0};${attributes};${morphs}`;
}

/** Canonicalize authored vertex colors without changing their rendered values. */
export function normalizeBatchColors(geometries:T.BufferGeometry[]){
 const colors=geometries.map(geometry=>geometry.getAttribute('color') as Attribute|undefined).filter((attribute):attribute is Attribute=>!!attribute);
 if(!colors.length)return geometries;
 const itemSize=Math.max(3,...colors.map(attribute=>attribute.itemSize));
 for(const geometry of geometries){
  const source=geometry.getAttribute('color') as Attribute|undefined,position=geometry.getAttribute('position');
  if(!position)continue;
  const values=new Float32Array(position.count*itemSize);values.fill(1);
  if(source){
   const count=Math.min(position.count,source.count),components=Math.min(itemSize,source.itemSize);
   for(let i=0;i<count;i++)for(let component=0;component<components;component++)values[i*itemSize+component]=source.getComponent(i,component);
  }
  const color=new T.Float32BufferAttribute(values,itemSize,false);color.name=source?.name??'';color.gpuType=T.FloatType;geometry.setAttribute('color',color);
 }
 return geometries;
}

/** Merge only geometries Three.js considers attribute-compatible after color normalization. */
export function mergeCompatibleGeometries(geometries:T.BufferGeometry[]){
 normalizeBatchColors(geometries);
 const groups=new Map<string,T.BufferGeometry[]>();
 for(const geometry of geometries){const key=geometryKey(geometry);if(!groups.has(key))groups.set(key,[]);groups.get(key)!.push(geometry);}
 const result:T.BufferGeometry[]=[];
 for(const group of groups.values()){
  if(group.length===1){result.push(group[0]);continue;}
  const merged=mergeGeometries(group,false);
  if(!merged){result.push(...group);continue;}
  group.forEach(geometry=>geometry.dispose());result.push(merged);
 }
 return result;
}
