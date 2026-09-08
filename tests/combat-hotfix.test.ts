import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
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

test('axe and pickaxe use weapon-specific head orientation instead of the sword basis',async()=>{
 const f=await fixture();
 f.actor.equip('axe');let axis=actorLocalToolAxis(f.actor,new T.Vector3(1,0,0));assert.ok(axis.x>.8,`axe head still faces backward: ${axis.toArray()}`);
 f.actor.equip('pickaxe');axis=actorLocalToolAxis(f.actor,new T.Vector3(1,0,0));assert.ok(axis.z<-.75&&Math.abs(axis.x)<.25,`pick head is still sideways to the overhead swing plane: ${axis.toArray()}`);
 f.physics.free();
});

test('motion-warped stationary attack switches to moving-melee legs while Rapier advances',async()=>{
 const f=await fixture();f.actor.setAttackWarpTarget([0,.02,2.15]);const before=f.p.position[2];assert.equal(f.actor.startAttack(),true);
 let sawMoving=false,sawStride=false,minStride=Infinity,maxStride=-Infinity;
 for(let i=0;i<38;i++){
  f.step();
  if(f.actor.current==='attack_moving'){
   sawMoving=true;const stride=(f.actor as any).activeStrideAction as T.AnimationAction|undefined,sactive=(f.actor as any).strideActive as boolean;
   sawStride ||= !!sactive;if(stride){minStride=Math.min(minStride,stride.time);maxStride=Math.max(maxStride,stride.time);}
  }
 }
 assert.ok(f.p.position[2]-before>.03,`assist never moved the controller: ${f.p.position[2]-before}`);
 assert.ok(sawMoving,'assist moved the body without switching out of the stationary full-body attack');
 assert.ok(sawStride,'assist moved the body while the locomotion leg layer was inactive');
 assert.ok(maxStride-minStride>.03,`assist leg cycle did not advance while translating: ${minStride}..${maxStride}`);
 f.physics.free();
});
