import test from 'node:test';
import assert from 'node:assert/strict';
import {detailDensityMultiplier,detailHash,nestedDetailLevel,perceptualDetailTier} from '../src/detail-field-math';

test('detail hash is deterministic and spatially discriminating',()=>{
 const a=detailHash(17,-29,91),b=detailHash(17,-29,91),c=detailHash(18,-29,91);
 assert.equal(a,b);assert.notEqual(a,c);assert.ok(a>=0&&a<1);assert.ok(c>=0&&c<1);
});

test('nested detail ranks are monotone coarse-to-fine',()=>{
 let previous=0;
 for(let i=0;i<=1000;i++){
  const level=nestedDetailLevel(i/1000);
  assert.ok(level>=previous);previous=level;
 }
 assert.equal(nestedDetailLevel(0),0);assert.equal(nestedDetailLevel(.99),3);
});

test('perceptual tiers spend density near the observer',()=>{
 assert.equal(perceptualDetailTier(8,10),'hero');
 assert.equal(perceptualDetailTier(28,10),'near');
 assert.equal(perceptualDetailTier(60,10),'mid');
 assert.equal(perceptualDetailTier(140,10),'far');
 assert.ok(detailDensityMultiplier('hero')>detailDensityMultiplier('near'));
 assert.ok(detailDensityMultiplier('near')>detailDensityMultiplier('mid'));
 assert.ok(detailDensityMultiplier('mid')>detailDensityMultiplier('far'));
});
