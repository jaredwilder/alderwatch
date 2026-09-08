import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {enforceAuthoredRootContract,STABLE_CLOSEUP_KIT_NAMES} from '../src/gfx-release-gate';
import {ALDERBROOK_PLACEMENTS,SOUTH_GATE_PLACEMENTS} from '../src/world-dressing';

test('known risky nested close-up substitutions are forced back to the stable kit',()=>{
 for(const name of ['village_details','village_roof','village_gable','palisade','camp_shelter'])assert.equal(STABLE_CLOSEUP_KIT_NAMES.has(name),true);
});

test('close-up settlement dressing no longer places modular longhouse roots as standalone buildings',()=>{
 assert.equal([...SOUTH_GATE_PLACEMENTS,...ALDERBROOK_PLACEMENTS].some(([name])=>name==='village_details'),false);
});

test('authored root contract cannot stay world-dominating even when source bounds are absurd',()=>{
 const root=new T.Group();root.add(new T.Mesh(new T.BoxGeometry(40,7,9),new T.MeshBasicMaterial()));enforceAuthoredRootContract('hut_d',root);root.updateMatrixWorld(true);const size=new T.Vector3();new T.Box3().setFromObject(root).getSize(size);assert.ok(Math.max(size.x,size.z)<=13.1);assert.ok(size.y<=10.1);
});
