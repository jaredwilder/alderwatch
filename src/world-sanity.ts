import * as T from 'three';

const box=new T.Box3(),size=new T.Vector3();
/**
 * Final defensive gate for authored props. Uniform normalization cannot repair a
 * malformed source whose root contains a 100:1 slab, because the slab remains a
 * slab after scaling. This gate only trims extreme long/thin children; normal
 * buildings, walls, roofs, carts and fences remain untouched.
 */
export function sanitizeWorldProp(root:T.Object3D){
 root.updateMatrixWorld(true);let trimmed=0;
 root.traverse(o=>{if(!(o instanceof T.Mesh)||!o.visible)return;box.setFromObject(o);box.getSize(size);const horizontal=Math.max(size.x,size.z),short=Math.max(.05,Math.min(size.x,size.z)),aspect=horizontal/short;
  if(horizontal>14&&aspect>8&&size.y<4.5){o.visible=false;o.userData.awPathologicalSlab=true;trimmed++;}
 });
 if(trimmed)root.userData.awTrimmedPathologicalSlabs=trimmed;return root;
}
export function hasPathologicalSlab(root:T.Object3D){root.updateMatrixWorld(true);let bad=false;root.traverse(o=>{if(!(o instanceof T.Mesh)||!o.visible)return;box.setFromObject(o);box.getSize(size);const horizontal=Math.max(size.x,size.z),short=Math.max(.05,Math.min(size.x,size.z));if(horizontal>14&&horizontal/short>8&&size.y<4.5)bad=true;});return bad;}
