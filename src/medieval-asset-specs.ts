import * as T from 'three';

export type MedievalFit='height'|'max';
export interface MedievalAssetSpec {fit:MedievalFit;target:number;maxSpan:number;closeUp:boolean}

/**
 * Every externally-authored medieval GLB is normalized before Alderwatch can
 * place it. The Quaternius MegaKit modules are deliberately included here too:
 * screenshots proved that assuming their source scene units matched our world
 * units can turn roofs/fences/floors into map-spanning slabs.
 */
export const MEDIEVAL_ASSET_SPECS:Record<string,MedievalAssetSpec>={
 // MegaKit structural modules. Targets match the metre-ish assembly spacing in Assets.
 wall_plaster_straight:{fit:'height',target:3.0,maxSpan:3.2,closeUp:true},
 wall_plaster_door_flat:{fit:'height',target:3.0,maxSpan:3.2,closeUp:true},
 wall_plaster_window_wide_flat:{fit:'height',target:3.0,maxSpan:3.2,closeUp:true},
 doorframe_flat_wooddark:{fit:'height',target:2.35,maxSpan:2.5,closeUp:true},
 door_1_flat:{fit:'height',target:2.15,maxSpan:2.35,closeUp:true},
 window_wide_flat1:{fit:'max',target:1.65,maxSpan:1.65,closeUp:true},
 corner_exterior_wood:{fit:'height',target:3.05,maxSpan:3.2,closeUp:true},
 roof_roundtiles_6x6:{fit:'max',target:6.35,maxSpan:6.35,closeUp:true},
 chimney:{fit:'height',target:2.0,maxSpan:2.1,closeUp:true},
 crate:{fit:'max',target:.82,maxSpan:.82,closeUp:true},
 wagon:{fit:'max',target:3.5,maxSpan:3.5,closeUp:true},
 fence_wood_single:{fit:'max',target:2.4,maxSpan:2.4,closeUp:true},
 fence_wood_ext1:{fit:'max',target:2.5,maxSpan:2.5,closeUp:true},
 fence_wood_ext2:{fit:'max',target:2.5,maxSpan:2.5,closeUp:true},
 support:{fit:'height',target:2.7,maxSpan:2.8,closeUp:true},
 stairs_exterior:{fit:'max',target:3.2,maxSpan:3.2,closeUp:true},
 floor_wooddark:{fit:'max',target:2.2,maxSpan:2.2,closeUp:true},
 roof_wooden_2x1:{fit:'max',target:2.25,maxSpan:2.25,closeUp:true},
 wall_arch:{fit:'height',target:3.0,maxSpan:3.2,closeUp:true},
 vine_1:{fit:'height',target:2.5,maxSpan:2.7,closeUp:true},
 border_straight:{fit:'max',target:2.25,maxSpan:2.25,closeUp:true},

 // Ultimate Fantasy RTS complete structures and props.
 hut_a:{fit:'height',target:7.2,maxSpan:11,closeUp:false},
 hut_b:{fit:'height',target:7.0,maxSpan:11,closeUp:false},
 hut_c:{fit:'height',target:5.8,maxSpan:9,closeUp:false},
 hut_d:{fit:'height',target:7.4,maxSpan:11,closeUp:true},
 towerhouse:{fit:'height',target:10.5,maxSpan:13,closeUp:false},
 watchtower:{fit:'height',target:9.5,maxSpan:10,closeUp:false},
 barracks:{fit:'height',target:7.5,maxSpan:15,closeUp:false},
 storage:{fit:'height',target:5.2,maxSpan:9,closeUp:true},
 market:{fit:'height',target:4.4,maxSpan:11,closeUp:true},
 towncenter:{fit:'height',target:10.5,maxSpan:18,closeUp:false},
 windmill:{fit:'height',target:13,maxSpan:16,closeUp:false},
 well:{fit:'height',target:2.0,maxSpan:3.2,closeUp:true},
 wall:{fit:'max',target:6.5,maxSpan:6.5,closeUp:false},
 farm:{fit:'max',target:8,maxSpan:8,closeUp:false},
 crops:{fit:'max',target:7,maxSpan:7,closeUp:false},
 barrel:{fit:'height',target:.9,maxSpan:1.2,closeUp:true},
 cauldron:{fit:'height',target:.78,maxSpan:1.1,closeUp:true},
 hay:{fit:'height',target:1.05,maxSpan:1.8,closeUp:true},
 wood_pile:{fit:'height',target:1.15,maxSpan:2.2,closeUp:true},
 lantern:{fit:'height',target:.48,maxSpan:.8,closeUp:true},
 torch:{fit:'height',target:1.75,maxSpan:2.1,closeUp:true},
 campfire_burning_q:{fit:'height',target:.72,maxSpan:1.5,closeUp:true},
};

const box=new T.Box3(),size=new T.Vector3(),center=new T.Vector3();

/** Wrap a source GLB so its child carries normalization and the public root stays identity-scaled. */
export function normalizeMedievalAsset(name:string,source:T.Object3D){
 const spec=MEDIEVAL_ASSET_SPECS[name];if(!spec)return source;
 const root=new T.Group();root.name=`Alderwatch normalized ${name}`;root.add(source);
 source.updateMatrixWorld(true);box.setFromObject(source);box.getSize(size);
 const axis=spec.fit==='height'?size.y:Math.max(size.x,size.y,size.z);
 if(Number.isFinite(axis)&&axis>1e-4){
  source.scale.multiplyScalar(spec.target/axis);source.updateMatrixWorld(true);box.setFromObject(source);box.getSize(size);
  const span=Math.max(size.x,size.z);if(Number.isFinite(span)&&span>spec.maxSpan){source.scale.multiplyScalar(spec.maxSpan/span);source.updateMatrixWorld(true);box.setFromObject(source);}
  box.getCenter(center);source.position.x-=center.x;source.position.z-=center.z;source.position.y-=box.min.y;
 }
 root.userData.awAsset=name;root.userData.awNormalized=true;root.userData.awCloseUp=spec.closeUp;
 return root;
}

/** Last-line safety: no decorative import may become a world-sized plane or beam. */
export function clampDressingBounds(object:T.Object3D,maxSpan=24,maxHeight=18){
 object.updateMatrixWorld(true);box.setFromObject(object);box.getSize(size);
 const span=Math.max(size.x,size.z),factor=Math.min(1,maxSpan/Math.max(span,1e-4),maxHeight/Math.max(size.y,1e-4));
 if(factor<1){object.scale.multiplyScalar(factor);object.updateMatrixWorld(true);object.userData.awBoundsClamped=true;}
 return object;
}
