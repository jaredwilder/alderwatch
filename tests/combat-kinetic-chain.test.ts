import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {WEAPONS} from '../src/combat-rules';
import {makePlayer} from '../src/state';
import {model} from './load-assets';

async function fixture(item:'sword'|'axe'){
 await RAPIER.init();
 const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);
 const physics=new RAPIER.World({x:0,y:-9.81,z:0});physics.createCollider(RAPIER.ColliderDesc.cuboid(20,.1,20).setTranslation(0,-.1,0));
 const root=new T.Group(),p=makePlayer('Warden');p.position=[0,.02,0];p.yaw=0;p.equipped=item;let tick=0;
 const actor=new Character(assets,physics,p,root);actor.getTick=()=>tick;actor.equip(item);
 const input={keys:new Set<string>(),secondary:false,take:()=>false};
 const step=()=>{actor.preStep(1/60,input,Math.PI,true);physics.step();actor.postStep(1/60);root.updateMatrixWorld(true);tick++;};
 return {physics,root,p,actor,input,step};
}
function keyAngle(track:T.KeyframeTrack,index:number){return new T.Quaternion().fromArray(track.values,index*4).normalize();}

test('sword and axe side cuts are visibly hip-led both standing and moving',async()=>{
 for(const item of ['sword','axe'] as const)for(const moving of [false,true]){
  const f=await fixture(item),pelvis=f.actor.model.getObjectByName('pelvis');assert.ok(pelvis instanceof T.Bone,'shipping rig missing pelvis bone');
  if(moving){f.input.keys.add('KeyW');for(let i=0;i<10;i++)f.step();}
  const rest=pelvis.quaternion.clone(),beforeZ=f.p.position[2],impact=WEAPONS[item]!.impact;let maxHip=0,contactHip=0,sampledContact=false;
  assert.equal(f.actor.startAttack(),true);
  for(let i=0;i<Math.ceil(WEAPONS[item]!.duration*60)+8;i++){
   f.step();const angle=rest.angleTo(pelvis.quaternion);maxHip=Math.max(maxHip,angle);
   if(!sampledContact&&f.actor.attackTime>=impact-.01){sampledContact=true;contactHip=angle;}
  }
  assert.ok(maxHip>.32,`${item} ${moving?'moving':'standing'} side cut still looks arm-led: pelvis range=${maxHip}`);
  assert.ok(contactHip>.10,`${item} pelvis returned bolt-square at contact instead of rotating through the strike: ${contactHip}`);
  if(moving)assert.ok(f.p.position[2]-beforeZ>.6,`${item} hip turn accidentally rooted moving combat: ${f.p.position[2]-beforeZ}`);
  f.physics.free();
 }
});

test('lateral attack clips sequence pelvis before torso instead of rotating every segment together',async()=>{
 for(const item of ['sword','axe'] as const){
  const f=await fixture(item),name=item==='axe'?'chop':'attack',clip=f.actor.actions.get(name)!.getClip(),impact=WEAPONS[item]!.impact;
  const pelvis=clip.tracks.find(t=>t.name==='pelvis.quaternion'),spine=clip.tracks.find(t=>t.name==='spine_01.quaternion');assert.ok(pelvis&&spine,`${item} missing kinetic-chain tracks`);
  const peakBefore=(track:T.KeyframeTrack)=>{const base=keyAngle(track,0);let best={angle:-1,time:Infinity};for(let i=0;i<track.times.length;i++){if(track.times[i]>=impact)continue;const angle=base.angleTo(keyAngle(track,i));if(angle>best.angle)best={angle,time:track.times[i]};}return best;};
  const hip=peakBefore(pelvis),torso=peakBefore(spine);
  assert.ok(hip.angle>.30,`${item} backswing has insufficient hip coil: ${hip.angle}`);
  assert.ok(hip.time<torso.time,`${item} torso peaks before/equal hips; lost proximal-to-distal sequence: hip=${hip.time} torso=${torso.time}`);
  assert.ok(hip.angle>torso.angle*1.15,`${item} torso still dominates the side cut instead of the pelvis: hip=${hip.angle} torso=${torso.angle}`);
  f.physics.free();
 }
});
