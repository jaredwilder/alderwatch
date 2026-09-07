import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from './assets';
import type {Input} from './input';
import type {PlayerState,ItemId} from './state';
import {stats} from './definitions';
import {beginAction,combatState,setGuard,attackProfile} from './combat-rules';
import {weatheredCloth} from './character-material';
export class Character {
 root=new T.Group();model:T.Object3D;mixer:T.AnimationMixer;actions=new Map<string,T.AnimationAction>();current='';body:RAPIER.RigidBody;collider:RAPIER.Collider;controller:RAPIER.KinematicCharacterController;
 grip:T.Object3D;tool?:T.Object3D;equipped:ItemId|null=null;velocity=new T.Vector3();vertical=0;locked=0;attackTime=0;attackHit=false;onImpact=()=>{};onAttackStart=()=>{};onStep=()=>{};stride=0;
 moveSpeed=1;private bufferedAttack?:{heavy:boolean;expires:number};
 getTick=()=>0;onActionRequest=(action:'attack'|'heavy'|'dodge')=>beginAction(this.state,this.getTick(),action).ok;onWindupAim=(_dt:number)=>{};private poseKey='';private swingLocomotion=false;private strideAction?:T.AnimationAction;knockback=new T.Vector3();
 constructor(public assets:Assets,public physics:RAPIER.World,public state:PlayerState,scene:T.Scene|T.Group){
  this.model=assets.human();this.root.add(this.model);scene.add(this.root);this.root.position.fromArray(state.position);this.root.rotation.y=state.yaw;
  this.mixer=new T.AnimationMixer(this.model);for(const clip of assets.survivor.animations){const action=this.mixer.clipAction(clip);this.actions.set(clip.name,action);}for(const n of ['idle','walk','run','sprint','dodge','attack','guard','hit','death'])if(!this.actions.has(n))throw new Error('Animation release blocker: '+n);
  const socket=this.model.getObjectByName('Grip_R'),hand=this.model.getObjectByName('hand_r');if(!socket||!hand||socket.parent!==hand)throw new Error('Equipment release blocker: Grip_R must be a child of hand_r');this.grip=socket;
  this.body=physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(state.position[0],state.position[1]+.9,state.position[2]));this.collider=physics.createCollider(RAPIER.ColliderDesc.capsule(.58,.3),this.body);this.controller=physics.createCharacterController(.02);this.controller.enableAutostep(.24,.1,true);this.controller.enableSnapToGround(.4);this.controller.setMaxSlopeClimbAngle(Math.PI*.28);this.controller.setApplyImpulsesToDynamicBodies(true);
  this.customize();this.play('idle');this.mixer.update(.001);this.root.updateMatrixWorld(true);this.equip(state.equipped);
  const walk=assets.survivor.animations.find(a=>a.name==='walk')!,guard=assets.survivor.animations.find(a=>a.name==='guard')!;
  const upper=(name:string)=>/^(spine_|clavicle_|upperarm_|lowerarm_|hand_|index_|middle_|ring_|pinky_|thumb_)/.test(name);
  const tracks=[...walk.tracks.filter(t=>!upper(t.name)).map(t=>t.clone()),...guard.tracks.filter(t=>upper(t.name)).map(t=>{const track=t.clone();track.scale(walk.duration/guard.duration);return track;})];
  for(const name of ['attack','heavy','chop','mine']){const source=assets.survivor.animations.find(c=>c.name===name);if(source)this.actions.set(name+'_moving',this.mixer.clipAction(new T.AnimationClip(name+'_moving',source.duration,source.tracks.filter(t=>upper(t.name)).map(t=>t.clone()))));}
  this.strideAction=this.mixer.clipAction(new T.AnimationClip('swing_stride',walk.duration,walk.tracks.filter(t=>!upper(t.name)).map(t=>t.clone())));this.strideAction.play().setEffectiveWeight(0);
  this.actions.set('guard_walk',this.mixer.clipAction(new T.AnimationClip('guard_walk',walk.duration,tracks)));
 }
 customize(){this.model.traverse(o=>{if(o.name.includes('Hood'))o.visible=this.state.hood;if(o.name.includes('Hair_Simple'))o.visible=!this.state.hood;if(o instanceof T.Mesh){const mats=Array.isArray(o.material)?o.material:[o.material];const custom=mats.map(old=>{const m=(old as T.MeshStandardMaterial).clone();weatheredCloth(m,this.assets.textures,o.name);if(m.name.includes('Hair'))m.color.set(this.state.hair);if(m.name.includes('Superhero')||m.name.includes('Regular_Male'))m.color.set(this.state.skin);return m;});o.material=Array.isArray(o.material)?custom:custom[0];}});}
 private gripAlignment?:T.Quaternion;
 equip(name:ItemId|null){if(this.tool){this.tool.removeFromParent();this.tool=undefined;}this.equipped=name;if(name&&['axe','pickaxe','sword','fine_sword','hammer'].includes(name)){
  if(!this.gripAlignment){
   // Calibrate once in the authored idle reference pose. This offset stays rigidly bone-local in every animation.
   this.root.updateMatrixWorld(true);const rootQ=this.root.getWorldQuaternion(new T.Quaternion());const shaft=new T.Vector3(0,-.98,.20).normalize().applyQuaternion(rootQ);const edge=new T.Vector3(-1,0,0).applyQuaternion(rootQ);const normal=new T.Vector3().crossVectors(edge,shaft).normalize();edge.crossVectors(shaft,normal).normalize();const worldQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(edge,shaft,normal));this.gripAlignment=this.grip.getWorldQuaternion(new T.Quaternion()).invert().multiply(worldQ);
  }
  const t=this.assets.prop(name==='fine_sword'?'sword':name);if(name==='fine_sword'){t.scale.setScalar(1.08);t.traverse(o=>{if(o instanceof T.Mesh){const tint=(m:T.Material)=>{const n=(m as T.MeshStandardMaterial).clone();n.color.multiplyScalar(1.35);n.roughness=.26;return n;};o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);}});}this.grip.add(t);t.position.set(0,0,0);t.quaternion.copy(this.gripAlignment);this.tool=t;
 }}
 play(name:string,once=false,force=false){if(this.current===name&&!force)return;const next=this.actions.get(name);if(!next)throw new Error('Missing clip '+name);const prev=this.actions.get(this.current);next.reset().setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);next.clampWhenFinished=once;next.enabled=true;next.setEffectiveWeight(1).setEffectiveTimeScale(1).play();if(prev&&prev!==next)prev.crossFadeTo(next,.16,false);this.current=name;}
 syncCombatPose(){const c=combatState(this.state),tick=this.getTick(),key=c.kind+':'+c.started;if(c.kind==='idle'||(c.until<=tick&&c.kind!=='death'))return;const base=c.kind==='attack'?(c.weapon==='axe'?'chop':c.weapon==='pickaxe'?'mine':'attack'):c.kind,clip=this.swingLocomotion&&['attack','heavy'].includes(c.kind)?base+'_moving':base;if(key!==this.poseKey||this.current!==clip){const changed=key!==this.poseKey;this.poseKey=key;if(changed)this.attackHit=false;this.play(clip,true,true);this.actions.get(clip)!.time=Math.max(0,(tick-c.started)/60);}this.locked=Math.max(this.locked,(c.until-tick)/60);if(c.kind==='death'){this.velocity.set(0,0,0);this.collider.setEnabled(false);}}
 startAttack(heavy=false){if(this.locked>0||this.state.health<=0)return;this.onAttackStart();this.state.yaw=this.root.rotation.y;if(this.onActionRequest(heavy?'heavy':'attack'))this.syncCombatPose();}
 preStep(dt:number,input:Pick<Input,'keys'|'take'|'secondary'> & Partial<Pick<Input,'primary'>>,yaw:number,enabled:boolean){
  const p=this.state,tick=this.getTick();let target=new T.Vector3();this.locked=Math.max(0,this.locked-dt);if(this.locked<1e-6)this.locked=0;this.swingLocomotion=enabled&&['KeyW','KeyA','KeyS','KeyD'].some(k=>input.keys.has(k));this.syncCombatPose();if(!enabled||combatState(p).kind==='hit')this.bufferedAttack=undefined;if(p.health<=0)return;
  const before=combatState(p);this.attackTime=['attack','heavy'].includes(before.kind)?(tick-before.started)/60:0;
  if(['attack','heavy'].includes(before.kind)&&this.attackTime<(attackProfile(p)?.impact??0)-.12){this.onWindupAim(dt);p.yaw=this.root.rotation.y;}
  if(['attack','heavy'].includes(before.kind)&&tick<=before.until&&!this.attackHit&&this.attackTime>=(attackProfile(p)?.impact??.567)){this.attackHit=true;this.onImpact();}
  if(enabled){if(input.take('Attack'))this.bufferedAttack={heavy:false,expires:tick+22};if(input.take('KeyF'))this.bufferedAttack={heavy:true,expires:tick+22};if(this.bufferedAttack&&this.bufferedAttack.expires<tick)this.bufferedAttack=undefined;if(this.locked===0&&(this.bufferedAttack||input.primary)){this.startAttack(this.bufferedAttack?.heavy??false);this.bufferedAttack=undefined;}if(input.take('Space')&&this.locked===0){const x=Number(input.keys.has('KeyD'))-Number(input.keys.has('KeyA')),z=Number(input.keys.has('KeyW'))-Number(input.keys.has('KeyS'));if(x||z)this.root.rotation.y=Math.atan2(Math.cos(yaw)*x+Math.sin(yaw)*z,Math.sin(yaw)*x-Math.cos(yaw)*z);if(this.onActionRequest('dodge'))this.syncCombatPose();}
   const x=Number(input.keys.has('KeyD'))-Number(input.keys.has('KeyA')),z=Number(input.keys.has('KeyW'))-Number(input.keys.has('KeyS'));const moving=!!(x||z),sprint=input.keys.has('ShiftLeft')&&p.stamina>1;const speed=(sprint?6.4:input.keys.has('ControlLeft')?1.5:3.6)*stats(p).speed*this.moveSpeed;
   const swinging=['attack','heavy'].includes(combatState(p).kind)&&combatState(p).until>tick;
   if(moving&&(this.locked===0||swinging)){target.set(Math.cos(yaw)*x+Math.sin(yaw)*z,0,Math.sin(yaw)*x-Math.cos(yaw)*z).normalize().multiplyScalar(swinging?(combatState(p).kind==='heavy'?2.7:Math.min(speed,4.3)):input.secondary?1.5:speed);const desired=swinging?this.root.rotation.y:input.secondary?Math.atan2(Math.sin(yaw),-Math.cos(yaw)):Math.atan2(target.x,target.z);let delta=T.MathUtils.euclideanModulo(desired-this.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;this.root.rotation.y+=delta*(1-Math.exp(-dt*16));if(sprint&&!input.secondary&&!swinging)p.stamina=Math.max(0,p.stamina-dt*15);}
   if(input.secondary&&this.locked===0&&!moving)this.root.rotation.y=Math.atan2(Math.sin(yaw),-Math.cos(yaw));
   if(this.current==='dodge'&&this.locked>0)target.set(Math.sin(this.root.rotation.y),0,Math.cos(this.root.rotation.y)).multiplyScalar(5.8*Math.sin((.8-this.locked)/.8*Math.PI));
  }
  setGuard(p,tick,enabled&&input.secondary&&this.locked===0);
  const walkingSwing=this.swingLocomotion&&['attack','heavy'].includes(combatState(p).kind)&&combatState(p).until>tick;if(this.strideAction){this.strideAction.setEffectiveWeight(walkingSwing?1:0);this.strideAction.timeScale=Math.max(.1,target.length()/1.5);}
  target.add(this.knockback);this.knockback.multiplyScalar(Math.exp(-dt*9));
  this.velocity.lerp(target,1-Math.exp(-dt*(target.lengthSq()?14:22)));if(this.velocity.length()<.025)this.velocity.set(0,0,0);
  this.vertical=this.controller.computedGrounded()?-1:Math.max(-25,this.vertical-dt*25);this.controller.computeColliderMovement(this.collider,{x:this.velocity.x*dt,y:this.vertical*dt,z:this.velocity.z*dt});const m=this.controller.computedMovement(),b=this.body.translation();this.body.setNextKinematicTranslation({x:b.x+m.x,y:b.y+m.y,z:b.z+m.z});
  if(this.locked===0){const s=this.velocity.length();this.play(combatState(p).blocking?(s>.1?'guard_walk':'guard'):s>4?'sprint':s>2?'run':s>.1?'walk':'idle');const a=this.actions.get(this.current)!;a.timeScale=this.current==='walk'||this.current==='guard_walk'?s/1.5:this.current==='run'?s/3.6:this.current==='sprint'?s/6.4:1;}
  p.stamina=Math.min(stats(p).stamina,p.stamina+dt*(this.velocity.length()<4&&this.locked===0&&!combatState(p).blocking?17:0));this.stride+=this.velocity.length()*dt;if(this.stride>1.45){this.stride=0;this.onStep();}
 }
 postStep(dt:number){const b=this.body.translation();this.root.position.set(b.x,b.y-.9,b.z);this.state.position=this.root.position.toArray();this.state.yaw=this.root.rotation.y;this.mixer.update(dt);}
 preview(dt:number){this.mixer.update(dt);}
}
