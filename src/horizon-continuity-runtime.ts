import * as T from 'three';
import {Assets} from './assets';

const INSTALL=Symbol.for('alderwatch.horizon-continuity.v1');

/**
 * Proof 10C: camera pitch is not an occlusion test. Earlier sky-tree mitigation
 * faded every oak_distant material when the player looked upward. Physical
 * terrain support now rejects unsupported horizon geometry, so that global
 * censorship only creates a visible horizon pop. Keep the existing sight
 * cutaway contract while leaving grounded distant trees invariant to pitch.
 */
function install(){
 const g=globalThis as Record<PropertyKey,unknown>;if(g[INSTALL])return;g[INSTALL]=true;
 const proto=Assets.prototype as any;
 proto.updateSight=function(camera:T.Camera,target:T.Vector3,viewport:T.Vector2,active:boolean){
  const point=target.clone().add(new T.Vector3(0,1,0));camera.updateMatrixWorld();
  const depth=-point.clone().applyMatrix4(camera.matrixWorldInverse).z;point.project(camera);
  this.sight.value.set((point.x*.5+.5)*viewport.x,(point.y*.5+.5)*viewport.y,active?viewport.y*.34:0,depth);
 };
}

if(typeof window!=='undefined')install();
