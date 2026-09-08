import * as T from 'three';

const box=new T.Box3(),size=new T.Vector3();
function pathological(size:T.Vector3){
 const horizontal=Math.max(size.x,size.z),short=Math.max(.05,Math.min(size.x,size.z)),aspect=horizontal/short;
 const worldDominating=horizontal>22||size.y>20;
 const longPlate=horizontal>11.5&&aspect>4.5;
 const thinDeck=horizontal>9&&size.y<.45&&short>2.5;
 return worldDominating||longPlate||thinDeck;
}
/**
 * Final defensive gate for authored props. Alderwatch has no legitimate single
 * decorative mesh that should span a street, village, or horizon. Kill malformed
 * source children here rather than allowing another imported GLB to become the map.
 */
export function sanitizeWorldProp(root:T.Object3D){
 root.updateMatrixWorld(true);let trimmed=0;
 root.traverse(o=>{if(!(o instanceof T.Mesh)||!o.visible)return;box.setFromObject(o);box.getSize(size);if(pathological(size)){o.visible=false;o.userData.awPathologicalSlab=true;trimmed++;}});
 if(trimmed)root.userData.awTrimmedPathologicalSlabs=(root.userData.awTrimmedPathologicalSlabs??0)+trimmed;return root;
}
export function hasPathologicalSlab(root:T.Object3D){root.updateMatrixWorld(true);let bad=false;root.traverse(o=>{if(!(o instanceof T.Mesh)||!o.visible)return;box.setFromObject(o);box.getSize(size);if(pathological(size))bad=true;});return bad;}
