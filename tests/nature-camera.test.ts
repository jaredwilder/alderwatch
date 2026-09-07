import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import fs from 'node:fs';
import {LocalAuthority,makePlayer,quantity,addItem} from '../src/state';
import {seedNature,forageAvailable} from '../src/nature';
import {FollowCamera,ACTION_CAMERA} from '../src/follow-camera';
import {stats} from '../src/definitions';
import {model} from './load-assets';
import {Assets} from '../src/assets';
import {mapOffset,routeHint} from '../src/minimap';

test('minimap up matches camera-relative W and objective arrows rotate correctly',()=>{
 for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){const m=mapOffset(Math.sin(yaw)*10,-Math.cos(yaw)*10,yaw);assert.ok(Math.abs(m.x)<.00001);assert.ok(m.y<0);}
 assert.equal(routeHint([0,0,0],[20,0,0],0).direction,'Right');
 assert.equal(routeHint([0,0,0],[20,0,0],Math.PI/2).direction,'Ahead');
 assert.equal(routeHint([0,0,0],[0,0,20],0).direction,'Behind');
 const far=routeHint([0,0,0],[300,0,-400],0);assert.equal(far.distance,500);assert.ok(far.marker.offscreen);assert.ok(Math.abs(Math.hypot(far.marker.x,far.marker.y)-80)<.001);
 const near=mapOffset(0,0,0);assert.equal(near.offscreen,false);assert.equal(near.x,0);assert.equal(near.y,0);
});

test('canopy cutaway follows projected player and is disabled for cinematic menus',()=>{
 const assets=new Assets(),camera=new T.PerspectiveCamera(42,16/9,.08,650),p=new T.Vector3();
 camera.position.set(0,12,8);camera.lookAt(0,1,0);assets.updateSight(camera,p,new T.Vector2(1280,720),true);
 assert.ok(Math.abs(assets.sight.value.x-640)<.001);assert.ok(Math.abs(assets.sight.value.y-360)<.001);assert.ok(assets.sight.value.w>13);assert.ok(assets.sight.value.z>200);
 assets.updateSight(camera,p,new T.Vector2(1280,720),false);assert.equal(assets.sight.value.z,0);
});

test('nature kit contains separate articulated animals and forage, never another survivor',async()=>{
 const asset=await model('wildlife');for(const name of ['hare','crow','Hare_head','Hare_front_1','Hare_hind_-1','Crow_wing_1','berry_bush','mushrooms','herbs','fallen_branch'])assert.ok(asset.scene.getObjectByName(name),name);
 assert.ok(!asset.scene.getObjectByName('hand_r'));assert.ok(fs.statSync('public/assets/wildlife.glb').size<500000);
 const hare=new T.Box3().setFromObject(asset.scene.getObjectByName('hare')!).getSize(new T.Vector3());assert.ok(hare.y>.5&&hare.y<1.1);
});
test('forage is reach-checked, cannot duplicate, and regrows after saved game-time delay',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;seedNature(a.state);const initial=JSON.stringify(a.state);seedNature(a.state);assert.equal(JSON.stringify(a.state),initial);
 const f=Object.values(a.state.forage).find(f=>f.kind==='mushroom')!;const gather=()=>a.dispatch({type:'forage',playerId:p.id,forageId:f.id});p.position=[100,0,100];assert.equal(gather().ok,false);p.position=[...f.position];assert.ok(gather().ok);assert.equal(quantity(p,'mushroom'),2);assert.equal(gather().ok,false);assert.equal(forageAvailable(f,a.state.tick),false);
 const loaded=JSON.parse(JSON.stringify(a.state));loaded.tick+=60*300;const b=new LocalAuthority(loaded);assert.ok(b.dispatch({type:'forage',playerId:p.id,forageId:f.id}).ok);assert.equal(quantity(b.state.players[p.id],'mushroom'),4);
});
test('gathered mushrooms and herbs cook into real timed stamina food',()=>{
 const a=new LocalAuthority(),p=makePlayer('Warden');a.state.players[p.id]=p;p.position=[...a.state.stations['alderbrook-fire'].position];addItem(a.state,p,'mushroom',2);addItem(a.state,p,'herb',1);addItem(a.state,p,'wood',1);
 assert.ok(a.dispatch({type:'craft',playerId:p.id,recipeId:'woodland_broth',stationId:'alderbrook-fire'}).ok);assert.ok(a.dispatch({type:'eat',playerId:p.id,item:'woodland_broth'}).ok);assert.equal(stats(p).stamina,140);assert.equal(quantity(p,'mushroom'),0);
});
test('default action camera frames a wide elevated play area at every zoom limit',()=>{
 const p=new T.Vector3(3,4,7),c=new FollowCamera(),a=ACTION_CAMERA;
 const view=c.update(p,0,a.pitch,a.distance,1/60,()=>undefined);
 assert.ok(view.position.y-p.y>12,'Camera must look down from above the survivor');
 assert.ok(view.position.distanceTo(view.aim)>13);
 assert.ok(2*a.distance*Math.tan(T.MathUtils.degToRad(a.fov/2))>10,'At least ten metres of vertical coverage');
 for(const distance of [a.minDistance,a.maxDistance]){c.reset();const v=c.update(p,0,a.pitch,distance,1/60,()=>undefined);assert.ok(Math.abs(v.position.distanceTo(v.aim)-distance)<.001);assert.ok(v.position.y>p.y+6);}
 assert.ok(a.minPitch>0&&a.maxPitch<Math.PI/2,'Orbit cannot cross the pole or drop below ground');
});
test('mouse orbit is immediate while follow translation and collision recovery are damped',()=>{
 const c=new FollowCamera(),p=new T.Vector3();c.update(p,0,.2,5,1/60,()=>undefined);const turn=c.update(p,Math.PI/2,.2,5,1/60,()=>undefined);assert.ok(turn.position.x<-4.8);assert.ok(Math.abs(turn.position.z)<.01);
 const up=c.update(p,0,.8,5,1/60,()=>undefined);assert.ok(up.position.y>turn.position.y+2,'Accepted vertical look direction changed');
 c.update(p,0,.2,5,1/60,()=>1.3);assert.ok(c.distance<=1.08);c.update(p,0,.2,5,1/60,()=>undefined);assert.ok(c.distance>1.08&&c.distance<2,'Collision release snapped back');
});
