import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {HEAVY_DURATION,HEAVY_IMPACT,WEAPONS} from '../src/combat-rules';
import {makePlayer} from '../src/state';
import {model} from './load-assets';

async function fixture(){
 await RAPIER.init();
 const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);
 const physics=new RAPIER.World({x:0,y:-9.81,z:0});physics.createCollider(RAPIER.ColliderDesc.cuboid(20,.1,20).setTranslation(0,-.1,0));
 const root=new T.Group(),p=makePlayer('Warden');p.position=[0,.02,0];p.yaw=0;p.equipped='sword';let tick=0;
 const actor=new Character(assets,physics,p,root);actor.getTick=()=>tick;
 const input={keys:new Set<string>(),secondary:false,take:()=>false};
 const step=()=>{actor.preStep(1/60,input,Math.PI,true);physics.step();actor.postStep(1/60);root.updateMatrixWorld(true);tick++;};
 return {assets,physics,root,p,actor,input,step};
}
function actorLocalToolAxis(actor:Character,axis:T.Vector3){
 actor.root.updateMatrixWorld(true);const q=actor.tool!.getWorldQuaternion(new T.Quaternion()),rootInv=actor.root.getWorldQuaternion(new T.Quaternion()).invert();return axis.clone().applyQuaternion(q).applyQuaternion(rootInv).normalize();
}
function semanticHead(root:T.Object3D){
 const candidates:T.Bone[]=[];root.traverse(o=>{if(o instanceof T.Bone&&/head/i.test(o.name))candidates.push(o);});
 // Prefer the deepest head-labelled bone so helper/parent nodes cannot hide the visible skull motion.
 candidates.sort((a,b)=>{const depth=(o:T.Object3D)=>{let d=0,p=o.parent;while(p){d++;p=p.parent;}return d;};return depth(b)-depth(a);});
 assert.ok(candidates.length,`shipping rig has no semantic head bone; neck/head bones=${JSON.stringify((()=>{const n:string[]=[];root.traverse(o=>{if(o instanceof T.Bone&&/neck|head/i.test(o.name))n.push(o.name);});return n;})())}`);
 return candidates[0];
}

test('axe and pickaxe use weapon-specific head orientation instead of the sword basis',async()=>{
 const f=await fixture();
 f.actor.equip('axe');let axis=actorLocalToolAxis(f.actor,new T.Vector3(1,0,0));assert.ok(axis.x>.8,`axe head still faces backward: ${axis.toArray()}`);
 f.actor.equip('pickaxe');axis=actorLocalToolAxis(f.actor,new T.Vector3(1,0,0));assert.ok(axis.z<-.75&&Math.abs(axis.x)<.25,`pick head is still sideways to the overhead swing plane: ${axis.toArray()}`);
 f.physics.free();
});

test('motion-warped stationary attack switches to moving-melee legs while Rapier advances',async()=>{
 const f=await fixture();f.actor.setAttackWarpTarget([0,.02,2.15]);const before=f.p.position[2];assert.equal(f.actor.startAttack(),true);
 let sawMoving=false,sawStride=false,minStride=Infinity,maxStride=-Infinity,maxWeight=0;
 for(let i=0;i<30;i++){
  f.step();
  if(f.actor.current==='attack_moving'){
   sawMoving=true;const stride=(f.actor as any).activeStrideAction as T.AnimationAction|undefined,sactive=(f.actor as any).strideActive as boolean;
   sawStride ||= !!sactive;if(stride){minStride=Math.min(minStride,stride.time);maxStride=Math.max(maxStride,stride.time);maxWeight=Math.max(maxWeight,stride.getEffectiveWeight());}
  }
 }
 assert.ok(f.p.position[2]-before>.03,`assist never moved the controller: ${f.p.position[2]-before}`);
 assert.ok(sawMoving,'assist moved the body without switching out of the stationary full-body attack');
 assert.ok(sawStride,'assist moved the body while the locomotion leg layer was inactive');
 assert.ok(maxStride-minStride>.03,`assist leg cycle did not advance while translating: ${minStride}..${maxStride}`);
 assert.ok(maxWeight>.45,`stride clock advanced but its live mixer weight stayed effectively zero: ${maxWeight}`);
 f.physics.free();
});

test('standing and walking melee visibly animate the live thigh instead of straight-leg skating',async()=>{
 for(const moving of [false,true]){
  const f=await fixture(),thigh=f.actor.model.getObjectByName('thigh_l')!,start=thigh.quaternion.clone(),before=f.p.position[2];if(moving){f.input.keys.add('KeyW');for(let i=0;i<8;i++)f.step();}
  assert.equal(f.actor.startAttack(),true);let maxLeg=0,maxWeight=0;
  for(let i=0;i<28;i++){f.step();maxLeg=Math.max(maxLeg,start.angleTo(thigh.quaternion));const stride=(f.actor as any).activeStrideAction as T.AnimationAction|undefined;if(stride)maxWeight=Math.max(maxWeight,stride.getEffectiveWeight());}
  assert.ok(maxWeight>.45,`${moving?'walking':'standing'} swing never gave the leg layer real mixer weight: ${maxWeight}`);
  assert.ok(maxLeg>.055,`${moving?'walking':'standing'} swing left the thigh visually frozen: ${maxLeg}`);
  if(moving)assert.ok(f.p.position[2]-before>.35,`walking swing animated legs but stopped physical travel: ${f.p.position[2]-before}`);
  f.physics.free();
 }
});

test('running attacks use distance-matched lower combat strides instead of high-knee sprint playback',async()=>{
 const f=await fixture();f.input.keys.add('KeyW');f.input.keys.add('ShiftLeft');for(let i=0;i<30;i++)f.step();
 assert.ok(f.actor.velocity.length()>4.7,'fixture never reached sprint speed');assert.equal(f.actor.startAttack(),true);
 let weight=0,sawSprintStride=false,manual=false;
 for(let i=0;i<18;i++){f.step();const stride=(f.actor as any).activeStrideAction as T.AnimationAction|undefined;if(stride?.getClip().name==='swing_stride_sprint'){sawSprintStride=true;weight=Math.max(weight,stride.getEffectiveWeight());manual ||= stride.timeScale===0;}}
 assert.ok(sawSprintStride,'running swing never selected sprint combat footwork');
 assert.ok(weight>.7&&weight<.9,`running combat stride is either too faint to plant or overpowering: ${weight}`);
 assert.ok(manual,'running combat stride is still time-driven instead of distance-matched');
 f.physics.free();
});

test('lateral sword and axe cuts carry the real head down into contact',async()=>{
 for(const item of ['sword','axe'] as const){
  const f=await fixture();f.p.equipped=item;f.actor.equip(item);const head=semanticHead(f.actor.model);f.root.updateMatrixWorld(true);const start=head.getWorldPosition(new T.Vector3()).y;let contactY=Infinity;
  f.actor.onImpact=()=>{f.root.updateMatrixWorld(true);contactY=head.getWorldPosition(new T.Vector3()).y;};assert.equal(f.actor.startAttack(),true);
  for(let i=0;i<30&&contactY===Infinity;i++)f.step();
  assert.ok(Number.isFinite(contactY),`${item} never reached contact`);assert.ok(contactY<start-.008,`${item} kept ${head.name} bolt upright through the side cut: start=${start} contact=${contactY}`);f.physics.free();
 }
});

test('every starter melee family gets standing combat footwork',async()=>{
 for(const item of ['sword','axe','pickaxe','hammer'] as const){
  const f=await fixture();f.p.equipped=item;f.actor.equip(item);const thigh=f.actor.model.getObjectByName('thigh_l')!,start=thigh.quaternion.clone();assert.equal(f.actor.startAttack(),true);let maxLeg=0;
  for(let i=0;i<24;i++){f.step();maxLeg=Math.max(maxLeg,start.angleTo(thigh.quaternion));}
  assert.ok(maxLeg>.04,`${item} still uses straight legs during a standing swing: ${maxLeg}`);f.physics.free();
 }
});

test('melee got another small speed pass while bow cadence remains unchanged',()=>{
 assert.ok(WEAPONS.sword!.impact<11/30&&WEAPONS.sword!.duration<21/30);
 assert.ok(WEAPONS.axe!.impact<14/30&&WEAPONS.axe!.duration<25/30);
 assert.ok(WEAPONS.pickaxe!.impact<14/30&&WEAPONS.pickaxe!.duration<25/30);
 assert.ok(WEAPONS.hammer!.impact<.47&&WEAPONS.hammer!.duration<.96);
 assert.ok(HEAVY_IMPACT<20/30&&HEAVY_DURATION<38/30);
 assert.equal(WEAPONS.bow!.impact,.32);assert.equal(WEAPONS.bow!.duration,.76);
});