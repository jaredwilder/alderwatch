import * as T from 'three';
import type {Assets} from './assets';

export interface StreamedAreaSurfacePalette{
  ground:T.ColorRepresentation;
  road:T.ColorRepresentation;
  groundRepeat?:number;
  roadRepeat?:number;
}

function cloneTile(source:T.Texture,repeat:number){const texture=source.clone();texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.anisotropy=Math.max(texture.anisotropy,8);texture.needsUpdate=true;return texture;}

export class StreamedAreaSurfaceSet{
 readonly ground:T.MeshStandardMaterial;readonly road:T.MeshStandardMaterial;private owned:T.Texture[]=[];
 constructor(assets:Assets,palette:StreamedAreaSurfacePalette){
  const repeat=palette.groundRepeat??8,color=cloneTile(assets.textures['field-color']??assets.textures.meadow,repeat),normal=cloneTile(assets.textures['field-normal']??assets.textures.meadow,repeat),rough=cloneTile(assets.textures['field-rough']??assets.textures.meadow,repeat);this.owned.push(color,normal,rough);
  this.ground=new T.MeshStandardMaterial({map:color,normalMap:normal,roughnessMap:rough,color:palette.ground,roughness:1,metalness:0});this.ground.name='AW_StreamedGroundShared';this.ground.normalScale.set(.72,.72);
  const road=cloneTile(assets.textures.soil,palette.roadRepeat??10);this.owned.push(road);this.road=new T.MeshStandardMaterial({map:road,color:palette.road,roughness:1,metalness:0});this.road.name='AW_StreamedRoadShared';
 }
 dispose(){this.ground.dispose();this.road.dispose();for(const texture of this.owned)texture.dispose();this.owned=[];}
}
