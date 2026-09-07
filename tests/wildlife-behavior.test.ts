import test from 'node:test';
import assert from 'node:assert/strict';
import {LocalAuthority} from '../src/state';
import {bearTarget,seedNature,type AnimalState} from '../src/nature';

test('frontier wildlife roster is dense enough to encounter naturally',()=>{
 const authority=new LocalAuthority();seedNature(authority.state);
 const animals=Object.values(authority.state.animals!);
 assert.ok(animals.length>=23);
 assert.ok(animals.filter(a=>a.kind==='deer').length>=6);
 assert.ok(animals.filter(a=>a.kind==='goat').length>=4);
 assert.ok(animals.filter(a=>a.kind==='sheep').length>=4);
 assert.ok(animals.filter(a=>a.kind==='bear').length>=3);
});

test('bear selects nearby prey but ignores distant animals and other bears',()=>{
 const bear:AnimalState={id:'bear',kind:'bear',position:[0,0,0],home:[0,0,0],yaw:0,phase:0};
 const deer:AnimalState={id:'deer',kind:'deer',position:[8,0,0],home:[8,0,0],yaw:0,phase:0};
 const sheep:AnimalState={id:'sheep',kind:'sheep',position:[4,0,0],home:[4,0,0],yaw:0,phase:0};
 const farGoat:AnimalState={id:'goat',kind:'goat',position:[40,0,0],home:[40,0,0],yaw:0,phase:0};
 const otherBear:AnimalState={id:'other-bear',kind:'bear',position:[2,0,0],home:[2,0,0],yaw:0,phase:0};
 assert.equal(bearTarget(bear,{bear,deer,sheep,farGoat,otherBear})?.id,'sheep');
 sheep.position=[30,0,0];deer.position=[31,0,0];
 assert.equal(bearTarget(bear,{bear,deer,sheep,farGoat,otherBear}),undefined);
});
