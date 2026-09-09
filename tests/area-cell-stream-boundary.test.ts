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
