import * as T from 'three';
/** Whole-body envelope, not a stale per-limb idle bound. Covers bends, dodges and weapon poses. */
export function humanoidVisualBounds(mesh:T.Mesh){
 mesh.frustumCulled=true;
 if(mesh instanceof T.SkinnedMesh)mesh.boundingSphere=new T.Sphere(new T.Vector3(0,1,0),3.5);
}
