import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {makePlayer} from '../src/state';
import {model} from './load-assets';

async function actorFixture(){
 await RAPIER.init();const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);const physics=new RAPIER.World({x:0,y:-9.81,z:0});physics.createCollider(RAPIER.ColliderDesc.cuboid(20,.1,20).setTranslation(0,-.1,0));const root=new T.Group(),p=makePlayer('Warden');p.position=[0,.02,0];p.yaw=0;p.equipped=null;let tick=0;const actor=new Character(assets,physics,p,root);actor.getTick=()=>tick;const input={keys:new Set<string>(),secondary:false,take:()=>false};const step=()=>{actor.preStep(1/60,input,Math.PI,true);physics.step();actor.postStep(1/60);root.updateMatrixWorld(true);tick++;};return {assets,physics,root,p,actor,input,step};
}

test('moving melee keeps authored pelvis/torso while gait owns the legs',async()=>{
 const f=await actorFixture();for(const name of ['attack','chop','mine','heavy']){const tracks=f.actor.actions.get(name+'_moving')!.getClip().tracks.map(t=>t.name);assert.ok(tracks.includes('pelvis.quaternion'),name+' moving clip lost its hips');assert.ok(tracks.includes('spine_01.quaternion'),name+' moving clip lost its torso');assert.ok(!tracks.includes('thigh_l.quaternion'),name+' moving clip stole locomotion legs');assert.ok(!tracks.includes('root.quaternion'),name+' moving clip stole controller/root locomotion');}f.physics.free();
});

test('sword and axe attacks visibly rotate the pelvis instead of arm-flapping',async()=>{
 for(const item of ['sword','axe'] as const){const f=await actorFixture();f.p.equipped=item;f.actor.equip(item);const pelvis=f.actor.model.getObjectByName('pelvis')!,start=pelvis.quaternion.clone();let max=0;f.actor.startAttack();for(let i=0;i<42;i++){f.step();max=Math.max(max,start.angleTo(pelvis.quaternion));}assert.ok(max>.10,`${item} pelvis barely moved: ${max}`);f.physics.free();}
});

test('pickaxe is a committed downward two-handed strike, not the lateral mine chop',async()=>{
 const f=await actorFixture();f.p.equipped='pickaxe';f.actor.equip('pickaxe');f.root.updateMatrixWorld(true);const pelvis=f.actor.model.getObjectByName('pelvis')!,pelvisStart=pelvis.quaternion.clone(),left=f.actor.model.getObjectByName('hand_l')!;let peak=-Infinity,contact:T.Vector3|undefined,contactLeft=Infinity,maxPelvis=0;
 f.actor.onImpact=()=>{f.root.updateMatrixWorld(true);contact=f.actor.tool!.localToWorld(new T.Vector3(-.38,.49,0));contactLeft=left.getWorldPosition(new T.Vector3()).distanceTo(f.actor.grip.getWorldPosition(new T.Vector3()));};f.actor.startAttack();
 for(let i=0;i<42;i++){f.step();const head=f.actor.tool!.localToWorld(new T.Vector3(-.38,.49,0));peak=Math.max(peak,head.y);maxPelvis=Math.max(maxPelvis,pelvisStart.angleTo(pelvis.quaternion));}
 assert.ok(contact,'pick never reached its authored contact');assert.ok(peak-contact.y>.28,`pick did not descend into contact: peak=${peak} contact=${contact.y}`);assert.ok(contactLeft<.8,`off hand never joined the two-handed strike: ${contactLeft}`);assert.ok(maxPelvis>.10,`pick pelvis barely moved: ${maxPelvis}`);f.physics.free();
});
