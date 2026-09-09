import * as T from 'three';
import type {Assets} from './assets';
import type {CellCoord} from './area-cell-stream';
import type {WorldAddress} from './world-address';
import {worldRandom} from './world-address';

export interface StreamedGroundPalette {
  color:T.ColorRepresentation;
  tileMeters?:number;
  normalScale?:number;
}

export interface StreamedGrassOptions {
  cell:CellCoord;
  cellSize:number;
  areaId:string;
  realmSeed:number;
  density?:number;
  clear?:(worldX:number,worldZ:number)=>boolean;
}

function tile(source:T.Texture,repeat:number){const texture=source.clone();texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.needsUpdate=true;return texture;}

/**
 * Shared per-region ground material for streamed worlds. Uses the already-shipped
 * terrain field normal/roughness set so flat streaming cells gain close-range
 * texture/parallax cues without adding geometry or physics cost.
 */
export function createStreamedGroundMaterial(assets:Assets,palette:StreamedGroundPalette){
 const tileMeters=palette.tileMeters??6,repeat=48/tileMeters;
 const map=tile(assets.textures['field-color']??assets.textures.meadow,repeat);
 const normalMap=tile(assets.textures['field-normal']??assets.textures.meadow,repeat);
 const roughnessMap=tile(assets.textures['field-rough']??assets.textures.meadow,repeat);
 const material=new T.MeshStandardMaterial({map,normalMap,roughnessMap,color:palette.color,roughness:1});
 material.normalScale.setScalar(palette.normalScale??.68);material.name='AW_StreamedLivingGround';
 material.userData.awOwnedTextures=[map,normalMap,roughnessMap];return material;
}

export function disposeStreamedGroundMaterial(material?:T.MeshStandardMaterial){if(!material)return;for(const texture of material.userData.awOwnedTextures??[])texture.dispose();material.dispose();}

/**
 * One instanced draw call per detailed cell, not one object per tuft. The source
 * clump already contains a dense observer-field blade population, so ~30-45
 * instances/cell creates strong optic flow while the active 3x3 budget keeps the
 * total bounded. Warm handoff cells may transiently add one strip and nothing else.
 */
export function createStreamedGrassCell(assets:Assets,options:StreamedGrassOptions){
 const source=assets.prop('grass'),sourceMesh=source instanceof T.Mesh?source:source.getObjectByProperty('isMesh',true) as T.Mesh|undefined;if(!sourceMesh)return;
 const density=T.MathUtils.clamp(options.density??.72,0,1),placements:{x:number;z:number;yaw:number;scale:number}[]=[];
 const lanes=7,spacing=options.cellSize/lanes,origin=-options.cellSize/2+spacing/2;let slot=0;
 for(let iz=0;iz<lanes;iz++)for(let ix=0;ix<lanes;ix++){
  const base:WorldAddress={realmSeed:options.realmSeed,areaId:options.areaId,cellX:options.cell.x,cellZ:options.cell.z,slot,tag:'grass'};
  const keep=worldRandom({...base,tag:'grass-keep'});if(keep>density){slot++;continue;}
  const x=origin+ix*spacing+(worldRandom({...base,tag:'grass-jx'})-.5)*spacing*.72,z=origin+iz*spacing+(worldRandom({...base,tag:'grass-jz'})-.5)*spacing*.72;
  const worldX=options.cell.x*options.cellSize+x,worldZ=options.cell.z*options.cellSize+z;if(options.clear?.(worldX,worldZ)){slot++;continue;}
  placements.push({x,z,yaw:worldRandom({...base,tag:'grass-yaw'})*Math.PI*2,scale:.82+worldRandom({...base,tag:'grass-scale'})*.42});slot++;
 }
 if(!placements.length)return;
 const mesh=new T.InstancedMesh(sourceMesh.geometry,sourceMesh.material,placements.length),dummy=new T.Object3D();
 for(let i=0;i<placements.length;i++){const p=placements[i];dummy.position.set(p.x,.012,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
 mesh.instanceMatrix.needsUpdate=true;mesh.name='streamed-living-grass';mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=true;mesh.computeBoundingSphere();
 mesh.userData.awGrassInstances=placements.length;return mesh;
}
