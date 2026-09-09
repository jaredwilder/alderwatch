import * as T from 'three';

export interface FarFieldRoad {
  x?:number;
  z?:number;
  width:number;
  length:number;
  yaw?:number;
  color?:T.ColorRepresentation;
  name?:string;
}

export interface StreamedAreaFarFieldOptions {
  width:number;
  depth:number;
  groundTexture:T.Texture;
  roadTexture:T.Texture;
  groundColor:T.ColorRepresentation;
  groundTileMeters?:number;
  roads?:readonly FarFieldRoad[];
}

function tiled(source:T.Texture,repeatX:number,repeatY:number){
  const texture=source.clone();
  texture.wrapS=T.RepeatWrapping;texture.wrapT=T.RepeatWrapping;
  texture.repeat.set(Math.max(1,repeatX),Math.max(1,repeatY));
  texture.needsUpdate=true;
  return texture;
}

/**
 * Tier-2 visual continuity for large streamed areas.
 *
 * Detailed cells remain the authoritative/interactive presentation. This group
 * sits a few centimetres underneath them and provides one cheap continuous land
 * sheet plus a handful of road ribbons where detailed cells are not resident.
 * That turns the edge of the 3x3 cell bubble into a fidelity transition instead
 * of a literal hole / square pop, without adding physics, actors or detail cells.
 */
export function createStreamedAreaFarField(options:StreamedAreaFarFieldOptions){
  if(!(options.width>0&&options.depth>0))throw new Error('far-field dimensions must be positive');
  const root=new T.Group();root.name='streamed-area-far-field';root.userData.awTier=2;
  const tile=options.groundTileMeters??18;
  const groundMap=tiled(options.groundTexture,options.width/tile,options.depth/tile);
  const ground=new T.Mesh(
    new T.PlaneGeometry(options.width,options.depth),
    new T.MeshStandardMaterial({map:groundMap,color:options.groundColor,roughness:1})
  );
  ground.name='far-field-ground';ground.rotation.x=-Math.PI/2;ground.position.y=-.035;ground.receiveShadow=false;ground.castShadow=false;ground.renderOrder=-20;root.add(ground);

  for(const [index,spec] of (options.roads??[]).entries()){
    const roadMap=tiled(options.roadTexture,spec.width/3.5,spec.length/7);
    const road=new T.Mesh(
      new T.PlaneGeometry(spec.width,spec.length),
      new T.MeshStandardMaterial({map:roadMap,color:spec.color??'#a79a7d',roughness:1})
    );
    road.name=spec.name??`far-field-road-${index}`;road.rotation.x=-Math.PI/2;road.rotation.z=spec.yaw??0;
    road.position.set(spec.x??0,-.018,spec.z??0);road.receiveShadow=false;road.castShadow=false;road.renderOrder=-10;root.add(road);
  }
  return root;
}
