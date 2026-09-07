import * as T from 'three';

/**
 * Emergency-stable terrain material.
 *
 * Keep the ground on the authored meadow texture + vertex macro tint only.
 * soilMix stays on the geometry for future work but does not affect rendering here.
 * This intentionally removes all custom shader palette logic from the live path.
 */
export function groundMaterial(meadow:T.Texture,_soil:T.Texture){
 meadow.colorSpace=T.SRGBColorSpace;
 meadow.wrapS=meadow.wrapT=T.RepeatWrapping;
 meadow.needsUpdate=true;
 return new T.MeshStandardMaterial({
  map:meadow,
  vertexColors:true,
  roughness:1,
  metalness:0,
 });
}
