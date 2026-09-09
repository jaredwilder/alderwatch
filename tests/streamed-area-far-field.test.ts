import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createStreamedAreaFarField} from '../src/streamed-area-far-field';

test('far field is a render-only continuous ground sheet plus explicit road skeleton',()=>{
 const field=createStreamedAreaFarField({
  width:624,depth:624,groundTexture:new T.Texture(),roadTexture:new T.Texture(),groundColor:'#aeb08a',
  roads:[{width:7,length:624,name:'king-road'},{x:-96,z:-72,width:5,length:192,name:'market-road'}]
 });
 assert.equal(field.name,'streamed-area-far-field');assert.equal(field.userData.awTier,2);assert.equal(field.children.length,3);
 const ground=field.getObjectByName('far-field-ground') as T.Mesh;
 assert.ok(ground);assert.equal(ground.position.y,-.035);assert.equal(ground.castShadow,false);assert.equal(ground.receiveShadow,false);
 const king=field.getObjectByName('king-road') as T.Mesh,market=field.getObjectByName('market-road') as T.Mesh;
 assert.ok(king);assert.ok(market);assert.equal(king.position.y,-.018);assert.equal(market.position.x,-96);assert.equal(market.position.z,-72);
 assert.equal(field.children.some(child=>child.userData?.collider),false,'tier-2 continuity surface must never smuggle in physics');
});

test('far field rejects non-positive world dimensions',()=>{
 assert.throws(()=>createStreamedAreaFarField({width:0,depth:10,groundTexture:new T.Texture(),roadTexture:new T.Texture(),groundColor:'#fff'}),/dimensions must be positive/);
});
