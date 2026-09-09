import test from 'node:test';
import assert from 'node:assert/strict';
import {CellWindow} from '../src/area-cell-stream';

test('center-addressed 48m cells switch at half-cell boundaries instead of centre lines',()=>{
 const stream=new CellWindow({cellSize:48,radius:1,create:(coord)=>coord,dispose:()=>{}});
 assert.deepEqual(stream.centerFor(0,0),{x:0,z:0});
 assert.deepEqual(stream.centerFor(23.9,-23.9),{x:0,z:0});
 assert.deepEqual(stream.centerFor(24.1,0),{x:1,z:0});
 assert.deepEqual(stream.centerFor(-24.1,0),{x:-1,z:0});
 assert.deepEqual(stream.centerFor(0,24.1),{x:0,z:1});
 assert.deepEqual(stream.centerFor(0,-24.1),{x:0,z:-1});
});

test('corrected boundary selection preserves the hard active-cell budget',()=>{
 const created:string[]=[],disposed:string[]=[];
 const stream=new CellWindow({cellSize:48,radius:1,create:({x,z})=>{const id=`${x},${z}`;created.push(id);return id;},dispose:h=>disposed.push(h.value)});
 assert.deepEqual(stream.update(0,0),{x:0,z:0});assert.equal(stream.active.size,9);assert.equal(stream.maxActive,9);
 assert.deepEqual(stream.update(23.9,0),{x:0,z:0});assert.equal(stream.active.size,9);assert.equal(disposed.length,0);
 assert.deepEqual(stream.update(24.1,0),{x:1,z:0});assert.equal(stream.active.size,9);assert.equal(disposed.length,3);assert.equal(created.length,12);
});

test('staged handoff builds the incoming strip over ordinary frames and promotes it without boundary-frame creation',()=>{
 const created:string[]=[],disposed:string[]=[];
 const stream=new CellWindow({cellSize:48,radius:1,prefetchBudget:3,prefetchThreshold:.24,prefetchPerUpdate:1,create:({x,z})=>{const id=`${x},${z}`;created.push(id);return id;},dispose:h=>disposed.push(h.value)});
 stream.update(0,0);
 assert.equal(stream.active.size,9);assert.equal(stream.warm.size,0);assert.equal(created.length,9);

 // Eastward motion enters the handoff band ~12m before the actual seam. Only one
 // expensive cell may be constructed per update, while the 3x3 active bubble stays fixed.
 stream.update(12,0);assert.equal(stream.active.size,9);assert.equal(stream.warm.size,1);assert.equal(created.length,10);
 stream.update(14,0);assert.equal(stream.warm.size,2);assert.equal(created.length,11);
 stream.update(16,0);assert.equal(stream.warm.size,3);assert.equal(created.length,12);
 assert.equal(stream.residentSize,12);assert.equal(stream.maxResident,12);assert.equal(stream.maxActive,9);

 const beforeBoundary=created.length;
 assert.deepEqual(stream.update(24.1,0),{x:1,z:0});
 assert.equal(created.length,beforeBoundary,'incoming row must be promoted rather than rebuilt on the seam');
 assert.equal(stream.active.size,9);assert.equal(stream.warm.size,0);assert.equal(stream.residentSize,9);
 assert.equal(disposed.length,3,'only the trailing row is retired on the seam');
});

test('warm reserve is bounded and discarded when travel reverses',()=>{
 const created:string[]=[],disposed:string[]=[];
 const stream=new CellWindow({cellSize:48,radius:1,prefetchBudget:3,prefetchThreshold:.2,create:({x,z})=>{const id=`${x},${z}`;created.push(id);return id;},dispose:h=>disposed.push(h.value)});
 stream.update(0,0);stream.update(11,0);stream.update(13,0);stream.update(15,0);
 assert.equal(stream.warm.size,3);assert.ok(stream.residentSize<=stream.maxResident);
 stream.update(14,0);
 assert.equal(stream.warm.size,0,'reversing away from a warmed seam should release its reserve');
 assert.equal(disposed.length,3);
 stream.dispose();assert.equal(stream.active.size,0);assert.equal(stream.warm.size,0);
});
