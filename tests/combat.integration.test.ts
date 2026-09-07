import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from '../src/assets';
import {Character} from '../src/character';
import {Combat} from '../src/combat';
import {Soundscape} from '../src/audio';
import {LocalAuthority,makePlayer} from '../src/state';
import {seedEnemies} from '../src/combat-rules';
import {model} from './load-assets';
import {FrontierRenderer} from '../src/frontier-renderer';
import type {Landscape} from '../src/landscape';

test('frontier streaming loads colliders near player, releases them and never resurrects harvested trees',async()=>{
 const f=await fixture(),r={id:'wild-resource-0',kind:'tree' as const,position:[8,0,0] as [number,number,number],variant:0,health:6,phase:'standing' as 'standing'|'fallen',rotation:0,scale:1};f.authority.state.resources[r.id]=r;
 const resources=new Map<string,T.Object3D>(),colliders=new Map<string,RAPIER.Collider>();
 const land={assets:f.assets,state:f.authority.state,physics:f.physics,scene:f.root,resources,colliders,ambientOccupied:()=>false,place:(name:string,x:number,z:number,yaw=0,scale=1,y=0)=>{const o=f.assets.prop(name);o.position.set(x,y,z);o.rotation.y=yaw;o.scale.setScalar(scale);f.root.add(o);return o;}} as unknown as Landscape;
 const renderer=new FrontierRenderer(land);assert.ok(resources.has(r.id));assert.ok(colliders.has(r.id));f.p.position=[80,0,0];renderer.update(1);assert.equal(resources.has(r.id),false);assert.equal(colliders.has(r.id),false);f.p.position=[0,0,0];renderer.update(2);assert.ok(resources.has(r.id));f.p.position=[80,0,0];renderer.update(3);r.phase='fallen';r.health=0;f.p.position=[0,0,0];renderer.update(4);assert.equal(resources.has(r.id),false);assert.equal(colliders.has(r.id),false);renderer.dispose();f.physics.free();
});
async function fixture(){
 await RAPIER.init();const assets=new Assets();[assets.survivor,assets.kit]=await Promise.all([model('survivor'),model('frontier-kit')]);
 const physics=new RAPIER.World({x:0,y:-9.81,z:0}),root=new T.Group(),authority=new LocalAuthority(),p=makePlayer('Warden');
 physics.createCollider(RAPIER.ColliderDesc.cuboid(100,.1,100).setTranslation(0,-.1,0));
 p.position=[0,.02,0];p.yaw=0;p.equipped='sword';authority.state.players[p.id]=p;
 const actor=new Character(assets,physics,p,root);actor.getTick=()=>authority.state.tick;
 const input={keys:new Set<string>(),secondary:false,take:()=>false};
 const step=(combat?:Combat)=>{actor.preStep(1/60,input,Math.PI,true);combat?.preStep(1/60);physics.step();actor.postStep(1/60);combat?.postStep(1/60);root.updateMatrixWorld(true);authority.state.tick++;};
 return {assets,physics,root,authority,p,actor,input,step};
}
test('shipping skeletal sword clips put the blade forward at the actual damage frame',async()=>{
 for(const heavy of [false,true]){
  const f=await fixture();let tip:T.Vector3|undefined;
  f.actor.onImpact=()=>{f.root.updateMatrixWorld(true);tip=f.actor.tool!.localToWorld(new T.Vector3(0,.88,0));};
  f.actor.startAttack(heavy);for(let i=0;i<62;i++)f.step();
  assert.ok(tip,'No contact event');const measured=`${heavy?'heavy':'light'} blade=${JSON.stringify(tip.toArray())}`;assert.ok(tip.z>1.1&&tip.z<1.5,measured);assert.ok(tip.y>.8&&tip.y<1.5,measured);assert.ok(Math.abs(tip.x)<.35,measured);
  assert.equal(f.actor.grip.parent?.name,'hand_r');assert.ok(f.actor.tool!.getWorldPosition(new T.Vector3()).distanceTo(f.actor.grip.getWorldPosition(new T.Vector3()))<1e-6);f.physics.free();
 }
});
test('real AI and Rapier controllers close range, animate, strike, and respect a solid barrier',async()=>{
 const f=await fixture();seedEnemies(f.authority.state);const enemy=f.authority.state.enemies['raider-camp-sentry'];enemy.position=[0,.02,3.5];enemy.home=[0,.02,3.5];
 const combat=new Combat(f.root,f.assets,f.physics,f.authority,f.actor,new Soundscape());
 for(let i=0;i<300;i++)f.step(combat);
 assert.ok(combat.events.some(e=>e.attackerId===enemy.id&&e.outcome==='hit'),'AI never landed its timed attack');assert.ok(f.p.health<100);assert.ok(combat.read()[0].grounded);
 const before=f.p.health,other=combat.raiders.get(enemy.id)!.actor;
 // Place a real physics barrier between the current fighters; the same line-of-sight rule must reject hits.
 const z=(enemy.position[2]+f.p.position[2])/2;f.physics.createCollider(RAPIER.ColliderDesc.cuboid(3,2,.1).setTranslation(0,1,z));f.physics.step();
 assert.equal(f.authority.lineOfSight!(enemy,f.p),false);assert.equal(f.p.health,before);assert.equal(other.grip.parent?.name,'hand_r');f.physics.free();
});
test('guarded movement keeps a raised blade and uses skeletal walking feet',async()=>{
 const f=await fixture();f.input.secondary=true;f.input.keys.add('KeyW');for(let i=0;i<90;i++)f.step();
 assert.equal(f.actor.current,'guard_walk');assert.ok(f.p.position[2]>1.5);const grip=f.actor.grip.getWorldPosition(new T.Vector3()),tip=f.actor.tool!.localToWorld(new T.Vector3(0,.88,0));assert.ok(tip.y>grip.y+.5,'Guard dropped during movement');assert.ok(f.actor.actions.get('guard_walk')!.time>0);f.physics.free();
});

test('moving attacks retain animated legs, authored contact and the real hand socket',async()=>{
 for(const item of ['sword','axe','pickaxe'] as const){
  const f=await fixture();f.p.equipped=item;f.actor.equip(item);f.input.keys.add('KeyW');for(let i=0;i<15;i++)f.step();const before=f.p.position[2];let contacts=0;f.actor.onImpact=()=>contacts++;f.actor.startAttack();
  for(let i=0;i<50;i++)f.step();assert.ok(f.p.position[2]-before>1.0,`${item} rooted the character`);assert.equal(contacts,1);assert.ok(f.actor.actions.get((item==='sword'?'attack':item==='axe'?'chop':'mine')+'_moving'));
  assert.equal(f.actor.grip.parent?.name,'hand_r');f.physics.free();
 }
});

test('moving tools retain walking speed and held attacks chain through recovery',async()=>{
 const f=await fixture();f.p.equipped='axe';f.actor.equip('axe');f.input.keys.add('KeyW');const held={...f.input,primary:true};let impacts=0;f.actor.onImpact=()=>impacts++;
 let minimum=Infinity;
 for(let i=0;i<160;i++){f.actor.preStep(1/60,held,Math.PI,true);f.physics.step();f.actor.postStep(1/60);f.authority.state.tick++;if(i>15)minimum=Math.min(minimum,f.actor.velocity.length());}
 assert.ok(minimum>3,'Moving axe still throttled below walking speed: '+minimum);assert.ok(f.p.position[2]>7.5);assert.ok(impacts>=2,'Held attack did not chain');f.physics.free();
});

test('locomotion gait changes and moving attack recovery preserve lower-body cycle phase',async()=>{
 const f=await fixture(),phase=(name:string)=>{const a=f.actor.actions.get(name)!;return ((a.time/a.getClip().duration)%1+1)%1;};
 f.actor.play('run');const run=f.actor.actions.get('run')!;run.time=run.getClip().duration*.63;f.actor.play('sprint');assert.ok(Math.abs(phase('sprint')-.63)<1e-6,'run to sprint restarted the gait cycle');
 f.input.keys.add('KeyW');f.input.keys.add('ShiftLeft');for(let i=0;i<30;i++)f.step();assert.equal(f.actor.current,'sprint');const before=phase('sprint');f.actor.startAttack();f.step();assert.equal(f.actor.current,'attack_moving');
 for(let i=0;i<70&&f.actor.current.endsWith('_moving');i++)f.step();assert.ok(['run','sprint'].includes(f.actor.current),`attack did not resume locomotion: ${f.actor.current}`);const after=phase(f.actor.current);assert.ok(after>.02&&Math.abs(after-before)>.02,'attack recovery restarted locomotion at frame zero');f.physics.free();
});

test('shipping locomotion has no horizontal root translation fighting the controller',async()=>{
 const g=await model('survivor');for(const name of ['walk','run','sprint']){const clip=g.animations.find(c=>c.name===name)!;for(const track of clip.tracks.filter(t=>t.name==='root.position'||t.name==='pelvis.position')){const values=track.values as ArrayLike<number>;for(let i=0;i<values.length;i+=3){assert.ok(Math.abs(values[i]-values[0])<1e-5,`${name} root drifted in X`);assert.ok(Math.abs(values[i+2]-values[2])<1e-5,`${name} root drifted in Z`);}}}
});

test('windup tracking is not overwritten by camera direction while moving',async()=>{
 const f=await fixture();f.input.keys.add('KeyW');f.actor.onAttackStart=()=>{f.actor.root.rotation.y=.4;};f.actor.onWindupAim=()=>{f.actor.root.rotation.y=.4;};f.actor.startAttack();for(let i=0;i<15;i++)f.step();assert.ok(Math.abs(f.actor.root.rotation.y-.4)<.01);f.physics.free();
});
test('expedition guards space attack turns and the captain uses authored heavy cuts',async()=>{
 const f=await fixture();f.p.expedition={accepted:true,recovered:[],completed:false};
 const combat=new Combat(f.root,f.assets,f.physics,f.authority,f.actor,new Soundscape());
 const pair=[...combat.raiders.values()].filter(r=>r.state.encounter==='stores');
 pair.forEach((r,i)=>{r.state.position=[i?1.1:-1.1,.02,1];r.state.home=[...r.state.position];r.actor.body.setTranslation({x:r.state.position[0],y:.92,z:1},true);r.actor.root.position.fromArray(r.state.position);r.actor.state.position=[...r.state.position];});
 const beats:{id:string;tick:number}[]=[],seen=new Set<string>();
 // This is a defensive test fixture: guard and replenish health so the whole AI cycle is observed.
 f.input.secondary=true;
 for(let i=0;i<720;i++){f.p.health=100;f.step(combat);for(const r of pair){const c=r.state.combat,key=r.state.id+':'+c?.started;if(c?.kind==='attack'&&!seen.has(key)){seen.add(key);beats.push({id:r.state.id,tick:c.started});}}}
 assert.ok(beats.length>=3,'Encounter never attacked');assert.ok(new Set(beats.map(b=>b.id)).size===2,'One guard monopolized attack turns');for(let i=1;i<beats.length;i++)assert.ok(beats[i].tick-beats[i-1].tick>=100,'Overlapping group attack beats');
 pair.forEach(r=>{r.state.health=0;r.state.combat={kind:'death',started:f.authority.state.tick,until:f.authority.state.tick+180,consumed:true,blocking:false,weapon:r.state.equipped};});const captain=[...combat.raiders.values()].find(r=>r.state.role==='captain')!;captain.state.home=[0,.02,1.3];captain.state.position=[0,.02,1.3];captain.actor.body.setTranslation({x:0,y:.92,z:1.3},true);captain.actor.root.position.set(0,.02,1.3);captain.actor.state.position=[0,.02,1.3];let heavy=false;
 for(let i=0;i<900;i++){f.p.health=100;f.step(combat);if(captain.state.combat?.kind==='heavy'&&captain.state.combat.until>f.authority.state.tick){heavy=true;assert.equal(captain.actor.current,'heavy');assert.equal(captain.actor.grip.parent?.name,'hand_r');}}
 assert.ok(heavy,'Captain never performed a heavy cut: '+JSON.stringify({player:f.p.position,captain:captain.state,locked:captain.actor.locked,events:combat.events.slice(-2)}));f.physics.free();
});

test('shipping locomotion has no free-arm quaternion flips',async()=>{
 const g=await model('survivor');
 for(const [name,limit] of [['idle',.8],['walk',2.5],['run',7],['sprint',8]] as const){
  const clip=g.animations.find(c=>c.name===name)!,mixer=new T.AnimationMixer(g.scene),action=mixer.clipAction(clip).play();action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;
  const previous=new Map<string,T.Vector3>();
  for(let i=0;i<=Math.floor(clip.duration*120);i++){
   mixer.setTime(i/120);g.scene.updateMatrixWorld(true);
   for(const bone of ['hand_l','hand_r','lowerarm_l','lowerarm_r']){const p=g.scene.getObjectByName(bone)!.getWorldPosition(new T.Vector3()),prev=previous.get(bone);if(prev)assert.ok(p.distanceTo(prev)*120<limit,`${name}: ${bone} snapped at ${i/120}s`);previous.set(bone,p);}
  }mixer.stopAllAction();mixer.uncacheRoot(g.scene);
 }
});

test('axe chopping keeps the head below an overhead windup and reaches forward on contact',async()=>{
 const f=await fixture();f.p.equipped='axe';f.actor.equip('axe');let highest=0,contact:T.Vector3|undefined;
 f.actor.onImpact=()=>{f.root.updateMatrixWorld(true);contact=f.actor.tool!.localToWorld(new T.Vector3(-.38,.49,0));};
 f.actor.startAttack();for(let i=0;i<76;i++){f.step();highest=Math.max(highest,f.actor.tool!.localToWorld(new T.Vector3(-.38,.49,0)).y-f.p.position[1]);}
 assert.ok(highest<1.72,`Axe raised overhead: ${highest}`);assert.ok(contact&&contact.z>.65&&contact.y>.55&&contact.y<1.5,`Missing trunk-height contact: ${contact?.toArray()}`);f.physics.free();
});
