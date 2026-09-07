import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {Building} from '../src/building';
import {LocalAuthority,addItem,quantity} from '../src/state';
import {houseFixture} from '../src/development-fixtures';
import {openRoofEnds} from '../src/structure-geometry';
import {model} from './load-assets';

test('joined roof bays close only their outside gables in either grid orientation',()=>{
 const w=houseFixture(),roofs=Object.values(w.structures).filter(s=>s.kind==='roof');
 assert.deepEqual(openRoofEnds(roofs[0],roofs),[false,true]);assert.deepEqual(openRoofEnds(roofs[1],roofs),[true,false]);
 const turned=roofs.map((r,i)=>({...r,yaw:Math.PI/2,position:[18-i*3,r.position[1],9] as [number,number,number]}));
 assert.deepEqual(openRoofEnds(turned[0],turned),[false,true]);
 assert.equal(quantity(Object.values(w.players)[0],'wood'),59,'Fixture must pay normal construction costs');
});

test('built-piece presentation reuses authored medieval props deterministically',async()=>{
 await RAPIER.init();const assets=new Assets();assets.kit=await model('frontier-kit');const physics=new RAPIER.World({x:0,y:-9.81,z:0}),building=new Building(new T.Group(),assets,physics,new LocalAuthority());
 const doorway=building.model('doorway');assert.deepEqual(doorway.children.filter(o=>o.name.startsWith('Threshold slab')).map(o=>[o.name,...o.position.toArray().map(n=>+n.toFixed(3))]),[['Threshold slab 0',0,-.365,.78],['Threshold slab 1',0,-.215,.4]]);assert.equal(doorway.children.some(o=>o.name.startsWith('Threshold step')),false);
 const bench=building.model('workbench'),chest=building.model('chest'),fire=building.model('campfire');assert.ok(bench.getObjectByName('Workbench satchel'));assert.ok(chest.getObjectByName('Storage satchel'));assert.ok(fire.getObjectByName('Fire seat west'));assert.ok(fire.getObjectByName('Fire seat east'));
 physics.free();
});

test('actual survivor cannot pass a closed door, can open it and enter across both floors',async()=>{
 await RAPIER.init();const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);
 const authority=new LocalAuthority();authority.state=houseFixture();const p=Object.values(authority.state.players)[0],base=p.home![1];
 const physics=new RAPIER.World({x:0,y:-9.81,z:0}),root=new T.Group();physics.createCollider(RAPIER.ColliderDesc.cuboid(100,.1,100).setTranslation(0,base-.1,0));
 const building=new Building(root,assets,physics,authority),actor=new Character(assets,physics,p,root);actor.getTick=()=>authority.state.tick;
 const input={keys:new Set<string>(),secondary:false,take:()=>false};
 const step=(frames:number)=>{for(let i=0;i<frames;i++){building.sync(1/60);actor.preStep(1/60,input,0,true);physics.step();actor.postStep(1/60);authority.state.tick++;}root.updateMatrixWorld(true);};
 const door=Object.values(authority.state.structures).find(s=>s.kind==='doorway')!;
 input.keys.add('KeyW');step(150);assert.ok(p.position[2]>10.75,'Walked through the closed door');assert.ok(p.position[2]<11.2,'Never reached the doorway');
 assert.ok(authority.dispatch({type:'toggle_door',playerId:p.id,structureId:door.id}).ok);input.keys.clear();step(40);
 input.keys.add('KeyW');step(70);
 input.keys.clear();step(25);
 assert.ok(p.position[2]<8&&p.position[2]>6,`Could not enter and cross the floor seam: ${p.position}`);
 assert.ok(Math.abs(p.position[1]-(base+.44))<.07,'Feet do not match the wooden floor');assert.ok(building.sheltered(p));
 const roofGables=[...building.pieces.values()].flatMap(b=>b.gables??[]);assert.equal(roofGables.filter(g=>g.visible).length,2);
 const hit=physics.castRay(new RAPIER.Ray({x:18.9,y:base+8,z:9},{x:0,y:-1,z:0}),10,true,undefined,undefined,actor.collider,actor.body);assert.ok(hit&&hit.timeOfImpact<4.5,'Roof has no solid collision surface');
 const bench=Object.values(authority.state.stations).find(s=>s.id.startsWith('structure-'))!;addItem(authority.state,p,'iron',4);assert.ok(authority.dispatch({type:'craft',playerId:p.id,recipeId:'sword',stationId:bench.id}).ok,'Home bench is not usable');
 const chest=Object.values(authority.state.containers).find(s=>s.id.startsWith('structure-'))!;assert.ok(authority.dispatch({type:'transfer',playerId:p.id,containerId:chest.id,item:'wood',count:4,direction:'deposit'}).ok);
 // Walk clear of the chest at (17.2, 7) before testing the side wall itself.
 input.keys.add('KeyS');step(28);input.keys.clear();step(12);
 input.keys.add('KeyA');step(90);assert.ok(p.position[0]>16.85&&p.position[0]<17.2,'Side wall did not stop the controller: '+p.position);
 const restored=JSON.parse(JSON.stringify(authority.state));assert.equal(restored.structures[door.id].doorOpen,true);assert.equal(restored.containers[chest.id].inventory[0].count,4);
 physics.free();
});

test('dismantling cannot strand a roof on fewer than two walls',()=>{
 const a=new LocalAuthority();a.state=houseFixture();const p=Object.values(a.state.players)[0],front=Object.values(a.state.structures).find(s=>s.kind==='foundation')!;
 p.position=[21,p.home![1],9];const walls=Object.values(a.state.structures).filter(s=>s.supportId===front.id&&['wall','window','doorway'].includes(s.kind));
 assert.ok(a.dispatch({type:'dismantle',playerId:p.id,structureId:walls[0].id}).ok);
 assert.equal(a.dispatch({type:'dismantle',playerId:p.id,structureId:walls[1].id}).ok,false);
});
