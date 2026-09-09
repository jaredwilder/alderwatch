import * as T from 'three';
import type {Assets} from './assets';

export interface StreamedAreaSurfacePalette{
  ground:T.ColorRepresentation;
  road:T.ColorRepresentation;
  groundRepeat?:number;
  roadRepeat?:number;
}

function cloneTile(source:T.Texture,repeat:number){const texture=source.clone();texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.anisotropy=Math.max(texture.anisotropy,8);texture.needsUpdate=true;return texture;}

/**
 * Region-lifetime GPU resources for streamed terrain tiles. Cells should only
 * create/remove lightweight Mesh handles; ground/road materials, texture views,
 * and repeated plane geometries survive cell handoffs and are disposed once when
 * the whole area is left.
 */
export class StreamedAreaSurfaceSet{
 readonly ground:T.MeshStandardMaterial;readonly road:T.MeshStandardMaterial;private owned:T.Texture[]=[];private geometries=new Map<string,T.PlaneGeometry>();
 constructor(assets:Assets,palette:StreamedAreaSurfacePalette){
  const repeat=palette.groundRepeat??8,color=cloneTile(assets.textures['field-color']??assets.textures.meadow,repeat),normal=cloneTile(assets.textures['field-normal']??assets.textures.meadow,repeat),rough=cloneTile(assets.textures['field-rough']??assets.textures.meadow,repeat);this.owned.push(color,normal,rough);
  this.ground=new T.MeshStandardMaterial({map:color,normalMap:normal,roughnessMap:rough,color:palette.ground,roughness:1,metalness:0});this.ground.name='AW_StreamedGroundShared';this.ground.normalScale.set(.72,.72);
  const road=cloneTile(assets.textures.soil,palette.roadRepeat??10);this.owned.push(road);this.road=new T.MeshStandardMaterial({map:road,color:palette.road,roughness:1,metalness:0});this.road.name='AW_StreamedRoadShared';
 }
 geometry(width:number,height:number){const key=`${width.toFixed(3)}x${height.toFixed(3)}`;let geometry=this.geometries.get(key);if(!geometry){geometry=new T.PlaneGeometry(width,height);geometry.name=`AW_StreamTile ${key}`;this.geometries.set(key,geometry);}return geometry;}
 get geometryCount(){return this.geometries.size;}
 dispose(){this.ground.dispose();this.road.dispose();for(const texture of this.owned)texture.dispose();for(const geometry of this.geometries.values())geometry.dispose();this.owned=[];this.geometries.clear();}
}
