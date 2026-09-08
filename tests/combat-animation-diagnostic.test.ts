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
function rotationSpan(clip:T.AnimationClip,name:string){const track=clip.tracks.find(t=>t.name===name);assert.ok(track,`${clip.name} missing ${name}`);const v=track.values,base=new T.Quaternion().fromArray(v,0).normalize(),q=new T.Quaternion();let max=0;for(let i=0;i<v.length;i+=4){q.fromArray(v,i).normalize();max=Math.max(max,base.angleTo(q));}return max;}

test('moving melee keeps hip torque but gait owns pelvis travel and legs',async()=>{
 const f=await actorFixture();for(const name of ['attack','chop','mine','heavy']){const tracks=f.actor.actions.get(name+'_moving')!.getClip().tracks.map(t=>t.name);assert.ok(tracks.includes('pelvis.quaternion'),name+' moving clip lost its hip torque');assert.ok(!tracks.includes('pelvis.position'),name+' moving clip stole gait pelvis travel');assert.ok(tracks.includes('spine_01.quaternion'),name+' moving clip lost its torso');assert.ok(!tracks.includes('thigh_l.quaternion'),name+' moving clip stole locomotion legs');assert.ok(!tracks.includes('root.quaternion'),name+' moving clip stole controller/root locomotion');}
 const strideTracks=((f.actor as any).strideActions.get('run') as T.AnimationAction).getClip().tracks.map((t:T.KeyframeTrack)=>t.name);assert.ok(strideTracks.includes('pelvis.position'),'run stride lost pelvis translation/bob and will treadmill under attacks');assert.ok(!strideTracks.includes('pelvis.quaternion'),'run stride is fighting melee hip rotation');f.physics.free();
});

test('melee body tracks interpolate continuously instead of stop-motion stepping',async()=>{
 const f=await actorFixture();for(const name of ['attack','chop','mine','heavy']){const clip=f.actor.actions.get(name)!.getClip();const body=clip.tracks.filter(t=>(t.name==='pelvis.quaternion'||/^(spine_|clavicle_|upperarm_|lowerarm_|hand_)/.test(t.name))&&t.name.endsWith('.quaternion'));assert.ok(body.length>8,name+' lost its skeletal body tracks');for(const track of body)assert.notEqual(track.getInterpolation(),T.InterpolateDiscrete,`${name} ${track.name} is discrete/stop-motion`);}f.physics.free();
});

test('sword and axe attacks visibly rotate the pelvis instead of arm-flapping',async()=>{
 for(const item of ['sword','axe'] as const){const f=await actorFixture();f.p.equipped=item;f.actor.equip(item);const actionName=item==='axe'?'chop':'attack',curve=rotationSpan(f.actor.actions.get(actionName)!.getClip(),'pelvis.quaternion');assert.ok(curve>.10,`${item} synthesized pelvis curve is still dead before playback: ${curve}`);const pelvis=f.actor.model.getObjectByName('pelvis')!,start=pelvis.quaternion.clone();let max=0;f.actor.startAttack();for(let i=0;i<42;i++){f.step();max=Math.max(max,start.angleTo(pelvis.quaternion));}assert.ok(max>.10,`${item} pelvis curve exists but is not reaching the live skeleton: curve=${curve} runtime=${max}`);f.physics.free();}
});

test('pickaxe is a committed downward two-handed strike, not the lateral mine chop',async()=>{
 const f=await actorFixture();f.p.equipped='pickaxe';f.actor.equip('pickaxe');const curve=rotationSpan(f.actor.actions.get('mine')!.getClip(),'pelvis.quaternion');assert.ok(curve>.10,`pick synthesized pelvis curve is dead before playback: ${curve}`);f.root.updateMatrixWorld(true);const pelvis=f.actor.model.getObjectByName('pelvis')!,pelvisStart=pelvis.quaternion.clone(),left=f.actor.model.getObjectByName('hand_l')!;let peak=-Infinity,contact:T.Vector3|undefined,contactLeft=Infinity,maxPelvis=0;
 f.actor.onImpact=()=>{f.root.updateMatrixWorld(true);contact=f.actor.tool!.localToWorld(new T.Vector3(-.38,.49,0));contactLeft=left.getWorldPosition(new T.Vector3()).distanceTo(f.actor.grip.getWorldPosition(new T.Vector3()));};f.actor.startAttack();
 for(let i=0;i<42;i++){f.step();const head=f.actor.tool!.localToWorld(new T.Vector3(-.38,.49,0));peak=Math.max(peak,head.y);maxPelvis=Math.max(maxPelvis,pelvisStart.angleTo(pelvis.quaternion));}
 assert.ok(contact,'pick never reached its authored contact');assert.ok(peak-contact.y>.28,`pick did not descend into contact: peak=${peak} contact=${contact.y}`);assert.ok(contactLeft<.8,`off hand never joined the two-handed strike: ${contactLeft}`);assert.ok(maxPelvis>.10,`pick pelvis curve exists but is not reaching the live skeleton: curve=${curve} runtime=${maxPelvis}`);f.physics.free();
});
