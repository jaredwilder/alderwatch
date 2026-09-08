import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {hasPathologicalSlab,sanitizeWorldProp} from '../src/world-sanity';
import {NPC_ROSTER} from '../src/npcs';

test('pathological long thin decorative slabs are removed before live placement',()=>{
 const root=new T.Group();const bad=new T.Mesh(new T.BoxGeometry(70,1.2,1.5),new T.MeshBasicMaterial());root.add(bad);assert.equal(hasPathologicalSlab(root),true);sanitizeWorldProp(root);assert.equal(bad.visible,false);assert.equal(hasPathologicalSlab(root),false);assert.equal(root.userData.awTrimmedPathologicalSlabs,1);
});
test('normal medieval buildings survive the visual sanity gate',()=>{
 const root=new T.Group();const house=new T.Mesh(new T.BoxGeometry(12,7,8),new T.MeshBasicMaterial());root.add(house);sanitizeWorldProp(root);assert.equal(house.visible,true);
});
test('Alderbrook has a real varied townsfolk roster including a trader and dairy visionary',()=>{
 assert.ok(NPC_ROSTER.length>=8);assert.equal(new Set(NPC_ROSTER.map(n=>n.id)).size,NPC_ROSTER.length);assert.ok(NPC_ROSTER.some(n=>n.role==='Trader'));assert.ok(NPC_ROSTER.some(n=>n.role==='Dairy Visionary'));
});
