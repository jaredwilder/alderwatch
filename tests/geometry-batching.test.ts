import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {mergeCompatibleGeometries,normalizeBatchColors} from '../src/geometry-batching';

function triangle(){
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
 return geometry;
}

test('batch colors normalize the interleaved gpuType mismatch that breaks Three mergeAttributes',()=>{
 const a=triangle(),b=triangle();
 const interleaved=new T.InterleavedBuffer(new Uint8Array([255,64,32,32,255,64,64,32,255]),3);
 a.setAttribute('color',new T.InterleavedBufferAttribute(interleaved,3,0,true));
 const integerColor=new T.BufferAttribute(new Uint8Array([255,64,32,32,255,64,64,32,255]),3,true);integerColor.gpuType=T.IntType;
 b.setAttribute('color',integerColor);
 const errors:string[]=[];const old=console.error;console.error=(...args:unknown[])=>errors.push(args.join(' '));
 try{assert.equal(mergeGeometries([a.clone(),b.clone()],false),null);assert.ok(errors.some(message=>message.includes('gpuType must be consistent')));}
 finally{console.error=old;}
 normalizeBatchColors([a,b]);
 const merged=mergeGeometries([a,b],false);assert.ok(merged);assert.equal(merged!.getAttribute('color').array.constructor,Float32Array);assert.equal(merged!.getAttribute('color').gpuType,T.FloatType);
});

test('missing vertex colors become neutral white so authored colored surfaces still batch',()=>{
 const colored=triangle(),plain=triangle();colored.setAttribute('color',new T.Float32BufferAttribute([.2,.3,.4,.5,.6,.7,.8,.9,1],3));
 normalizeBatchColors([colored,plain]);const color=plain.getAttribute('color');assert.deepEqual(Array.from(color.array),[1,1,1,1,1,1,1,1,1]);assert.ok(mergeGeometries([colored,plain],false));
});

test('genuinely incompatible geometry profiles are partitioned instead of killing the whole batch',()=>{
 const a=triangle(),b=triangle(),c=triangle();a.setAttribute('color',new T.Float32BufferAttribute(new Array(9).fill(1),3));b.setAttribute('color',new T.Float32BufferAttribute(new Array(9).fill(.5),3));c.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,1],2));
 const groups=mergeCompatibleGeometries([a,b,c]);assert.equal(groups.length,2);assert.equal(groups.some(g=>g.getAttribute('position').count===6),true);assert.equal(groups.some(g=>!!g.getAttribute('uv')),true);
});
