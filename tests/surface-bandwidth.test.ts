import test from 'node:test';
import assert from 'node:assert/strict';
import {surfaceBandwidthWeights,supplementalSurfaceSampleBudget} from '../src/surface-bandwidth-math';

test('surface frequency bands die in Nyquist order as projected footprint grows',()=>{
 let previous=surfaceBandwidthWeights(0,3.4);
 assert.deepEqual(previous,{coarse:1,micro:1,nano:1});
 for(let i=1;i<=200;i++){
  const footprint=i/10000,next=surfaceBandwidthWeights(footprint,3.4);
  assert.ok(next.coarse<=previous.coarse+1e-12);
  assert.ok(next.micro<=previous.micro+1e-12);
  assert.ok(next.nano<=previous.nano+1e-12);
  previous=next;
 }
 const mid=surfaceBandwidthWeights(.01,3.4),far=surfaceBandwidthWeights(.05,3.4);
 assert.ok(mid.nano<=mid.micro&&mid.micro<=mid.coarse,'higher octaves must never outlive lower ones');
 assert.ok(far.nano===0&&far.micro===0,'fine octaves should be gone at large pixel footprints');
});

test('supplemental material sampling has a hard maximum',()=>{
 assert.deepEqual(supplementalSurfaceSampleBudget(),{color:3,normal:1,roughness:1,total:5});
});
