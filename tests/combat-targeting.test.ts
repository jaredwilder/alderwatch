import test from 'node:test';
import assert from 'node:assert/strict';
import {attackWarpVelocity,selectSoftTarget,softTargetScore} from '../src/combat-targeting';
import type {Vec3} from '../src/state';

const origin:Vec3=[0,0,0];

test('soft targeting prefers player intent over a marginally closer side target',()=>{
 const front={id:'front',position:[.12,0,1.55] as Vec3},side={id:'side',position:[1.05,0,.55] as Vec3};
 const picked=selectSoftTarget(origin,0,[side,front],2.4,-.05);
 assert.equal(picked?.id,'front');assert.ok(softTargetScore(origin,0,front.position,2.4,-.05)<softTargetScore(origin,0,side.position,2.4,-.05));
});

test('soft targeting rejects targets outside the assist cone or range',()=>{
 const behind={id:'behind',position:[0,0,-1] as Vec3},far={id:'far',position:[0,0,3] as Vec3};
 assert.equal(selectSoftTarget(origin,0,[behind,far],2.4,-.05),undefined);
});

test('melee motion correction exists only in the authored pre-impact window',()=>{
 const target:Vec3=[0,0,2.18],reach=1.95,impact=13/30;
 assert.deepEqual(attackWarpVelocity(origin,0,target,reach,.05,impact),[0,0,0]);
 const warp=attackWarpVelocity(origin,0,target,reach,impact-.12,impact);assert.ok(warp[2]>0&&warp[2]<=1.6,'Expected a small forward correction');
 assert.deepEqual(attackWarpVelocity(origin,0,target,reach,impact,impact),[0,0,0]);
});

test('melee warp never rescues a clearly missed or sideways attack',()=>{
 const reach=1.95,impact=13/30,age=impact-.1;
 assert.deepEqual(attackWarpVelocity(origin,0,[0,0,reach+.5],reach,age,impact),[0,0,0]);
 assert.deepEqual(attackWarpVelocity(origin,0,[2.1,0,.1],reach,age,impact),[0,0,0]);
 assert.deepEqual(attackWarpVelocity(origin,0,[0,0,reach-.1],reach,age,impact),[0,0,0]);
});

test('heavy correction stays slower and equally bounded',()=>{
 const reach=2,impact=25/30,age=impact-.14,target:Vec3=[0,0,2.25];
 const light=attackWarpVelocity(origin,0,target,reach,age,impact,false),heavy=attackWarpVelocity(origin,0,target,reach,age,impact,true);
 assert.ok(heavy[2]>0&&heavy[2]<=1.35);assert.ok(light[2]>=heavy[2]);
});
