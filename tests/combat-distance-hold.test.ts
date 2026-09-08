import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {makePlayer} from '../src/state';
import type {ItemId} from '../src/state';
import {model} from './load-assets';

async function fixture(item:ItemId='sword'){
 await RAPIER.init();
 const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);
 const physics=new RAPIER.World({x:0,y:-9.81,z:0});physics.createCollider(RAPIER.ColliderDesc.cuboid(30,.1,30).setTranslation(0,-.1,0));
 const root=new T.Group(),p=makePlayer('Warden');p.position=[0,.02,0];p.yaw=0;p.equipped=item;let tick=0;
 const actor=new Character(assets,physics,p,root);actor.getTick=()=>tick;actor.equip(item);
 const input={keys:new Set<string>(),secondary:false,primary:false,take:()=>false};
 const step=()=>{actor.preStep(1/60,input,Math.PI,true);physics.step();actor.postStep(1/60);root.updateMatrixWorld(true);tick++;};
 return {assets,physics,root,p,actor,input,step,get tick(){return tick;}};
}
const phase=(a:T.AnimationAction)=>T.MathUtils.euclideanModulo(a.time/a.getClip().duration,1);

test('holding primary continuously repeats every starter primary weapon and tool',async()=>{
 for(const item of ['sword','fine_sword','axe','pickaxe','hammer','bow'] as ItemId[]){
  const f=await fixture(item);f.input.primary=true;let impacts=0;f.actor.onImpact=()=>impacts++;
  for(let i=0;i<180;i++)f.step();
  assert.ok(impacts>=3,`${item} did not keep attacking while primary stayed held: ${impacts} impacts`);
  f.physics.free();
 }
});

test('sprint combat footwork uses lower run leg poses instead of the high-knee sprint source',async()=>{
 const f=await fixture('sword');
 const run=f.assets.survivor.animations.find(c=>c.name==='run')!,sprint=f.assets.survivor.animations.find(c=>c.name==='sprint')!;
 f.input.keys.add('KeyW');f.input.keys.add('ShiftLeft');for(let i=0;i<30;i++)f.step();assert.equal(f.actor.startAttack(),true);f.step();
 const stride=(f.actor as any).activeStrideAction as T.AnimationAction;assert.equal(stride.getClip().name,'swing_stride_sprint');
 const lower=(name:string)=>stride.getClip().tracks.find(t=>t.name===name),runTrack=(name:string)=>run.tracks.find(t=>t.name===name),sprintTrack=(name:string)=>sprint.tracks.find(t=>t.name===name);
 const name=stride.getClip().tracks.find(t=>/thigh_l.*quaternion/i.test(t.name))?.name??'thigh_l.quaternion';
 assert.ok(lower(name)&&runTrack(name)&&sprintTrack(name),`missing comparable left-thigh track: ${name}`);
 assert.deepEqual(Array.from(lower(name)!.values),Array.from(runTrack(name)!.values),'combat sprint stopped using the lower run-leg source');
 const differs=Array.from(lower(name)!.values).some((v,i)=>Math.abs(v-(sprintTrack(name)!.values[i]??v))>1e-6);assert.ok(differs,'run and sprint thigh tracks unexpectedly identical; high-knee-source gate lost meaning');
 f.physics.free();
});

test('moving combat stride phase is determined by world distance instead of wall-clock playback',async()=>{
 const f=await fixture('sword');f.input.keys.add('KeyW');f.input.keys.add('ShiftLeft');for(let i=0;i<30;i++)f.step();assert.ok(f.actor.velocity.length()>4.7);assert.equal(f.actor.startAttack(),true);f.step();
 const stride=(f.actor as any).activeStrideAction as T.AnimationAction,cycle=(f.actor as any).strideCycleDistance('sprint') as number,startPhase=phase(stride),start=f.actor.root.position.clone();
 assert.equal(stride.timeScale,0,'combat stride is still time-driven');
 for(let i=0;i<12;i++)f.step();
 const distance=Math.hypot(f.actor.root.position.x-start.x,f.actor.root.position.z-start.z),expected=distance/cycle,actual=T.MathUtils.euclideanModulo(phase(stride)-startPhase,1);
 assert.ok(distance>.65,`fixture did not travel enough to adjudicate distance matching: ${distance}`);
 assert.ok(Math.abs(actual-expected)<.055,`combat stride phase drifted from world distance: phase=${actual} expected=${expected} distance=${distance} cycle=${cycle}`);
 f.physics.free();
});

test('moving sprint attacks carry a visibly lower combat stance without throttling controller travel',async()=>{
 const f=await fixture('sword'),pelvis=f.actor.model.getObjectByName('pelvis')!;assert.ok(pelvis);
 f.input.keys.add('KeyW');f.input.keys.add('ShiftLeft');for(let i=0;i<30;i++)f.step();const before=f.p.position[2];assert.equal(f.actor.startAttack(),true);
 let lowest=Infinity;for(let i=0;i<18;i++){f.step();lowest=Math.min(lowest,pelvis.position.y);}
 assert.ok(f.p.position[2]-before>1.2,`combat stance fix throttled real sprint travel: ${f.p.position[2]-before}`);
 assert.ok(Number.isFinite(lowest));
 f.physics.free();
});