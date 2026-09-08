import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from './assets';
import type {Input} from './input';
import type {PlayerState,ItemId,Vec3} from './state';
import {stats} from './definitions';
import {beginAction,combatState,setGuard,attackProfile,WEAPONS,HEAVY_IMPACT,HEAVY_DURATION} from './combat-rules';
import {attackWarpVelocity} from './combat-targeting';
import {combatClip,meleeBodyTrack,upperBodyTrack} from './combat-animation';
import {weatheredCloth} from './character-material';
import {makeBow} from './archery';
type CombatAction='attack'|'heavy'|'dodge';
export class Character {
 root=new T.Group();model:T.Object3D;mixer:T.AnimationMixer;actions=new Map<string,T.AnimationAction>();current='';body:RAPIER.RigidBody;collider:RAPIER.Collider;controller:RAPIER.KinematicCharacterController;
 grip:T.Object3D;tool?:T.Object3D;equipped:ItemId|null=null;velocity=new T.Vector3();vertical=0;locked=0;attackTime=0;attackHit=false;onImpact=()=>{};onAttackStart=()=>{};onStep=()=>{};stride=0;
 moveSpeed=1;private bufferedAction?:{action:CombatAction;expires:number};private attackWarpTarget?:T.Vector3;private warpVelocity=new T.Vector3();
 getTick=()=>0;onActionRequest=(action:CombatAction)=>beginAction(this.state,this.getTick(),action).ok;onWindupAim=(_dt:number)=>{};private poseKey='';private swingLocomotion=false;private strideActions=new Map<string,T.AnimationAction>();private strideAction?:T.AnimationAction;private activeStrideAction?:T.AnimationAction;private strideActive=false;knockback=new T.Vector3();
 constructor(public assets:Assets,public physics:RAPIER.World,public state:PlayerState,scene:T.Scene|T.Group){
  this.model=assets.human();this.root.add(this.model);scene.add(this.root);this.root.position.fromArray(state.position);this.root.rotation.y=state.yaw;
  this.mixer=new T.AnimationMixer(this.model);for(const clip of assets.survivor.animations){const action=this.mixer.clipAction(clip);this.actions.set(clip.name,action);}for(const n of ['idle','walk','run','sprint','dodge','attack','guard','hit','death'])if(!this.actions.has(n))throw new Error('Animation release blocker: '+n);
  const socket=this.model.getObjectByName('Grip_R'),hand=this.model.getObjectByName('hand_r');if(!socket||!hand||socket.parent!==hand)throw new Error('Equipment release blocker: Grip_R must be a child of hand_r');this.grip=socket;
  this.body=physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(state.position[0],state.position[1]+.9,state.position[2]));this.collider=physics.createCollider(RAPIER.ColliderDesc.capsule(.58,.3),this.body);this.controller=physics.createCharacterController(.02);this.controller.enableAutostep(.24,.1,true);this.controller.enableSnapToGround(.4);this.controller.setMaxSlopeClimbAngle(Math.PI*.28);this.controller.setApplyImpulsesToDynamicBodies(true);
  this.customize();this.play('idle');this.mixer.update(.001);this.root.updateMatrixWorld(true);this.equip(state.equipped);
  const walk=assets.survivor.animations.find(a=>a.name==='walk')!,guard=assets.survivor.animations.find(a=>a.name==='guard')!,attack=assets.survivor.animations.find(a=>a.name==='attack')!,heavy=assets.survivor.animations.find(a=>a.name==='heavy')!,chop=assets.survivor.animations.find(a=>a.name==='chop')!;
  const clips:[string,T.AnimationClip,number,number,number][]=[
   ['attack',attack,13/30,WEAPONS.sword!.impact,WEAPONS.sword!.duration],
   ['heavy',heavy,25/30,HEAVY_IMPACT,HEAVY_DURATION],
   ['chop',chop,17/30,WEAPONS.axe!.impact,WEAPONS.axe!.duration],
   ['mine',heavy,25/30,WEAPONS.pickaxe!.impact,WEAPONS.pickaxe!.duration],
  ];
  for(const [name,source,sourceImpact,targetImpact,duration] of clips)this.actions.set(name,this.mixer.clipAction(combatClip(source,name,sourceImpact,targetImpact,duration)));
  const tracks=[...walk.tracks.filter(t=>!upperBodyTrack(t.name)).map(t=>t.clone()),...guard.tracks.filter(t=>upperBodyTrack(t.name)).map(t=>{const track=t.clone();track.scale(walk.duration/guard.duration);return track;})];
  for(const name of ['attack','heavy','chop','mine']){const source=this.actions.get(name)!.getClip();this.actions.set(name+'_moving',this.mixer.clipAction(new T.AnimationClip(name+'_moving',source.duration,source.tracks.filter(t=>meleeBodyTrack(t.name)).map(t=>t.clone()))));}
  // These actions must keep a non-zero BASE weight. Three.js fadeIn multiplies the fade envelope by action.weight;
  // the old setEffectiveWeight(0) initialization made every stride remain mathematically zero forever.
  for(const gait of ['walk','run','sprint']){const source=assets.survivor.animations.find(c=>c.name===gait)!;const action=this.mixer.clipAction(new T.AnimationClip('swing_stride_'+gait,source.duration,source.tracks.filter(t=>!meleeBodyTrack(t.name)).map(t=>t.clone())));action.play();action.weight=1;action.enabled=false;this.strideActions.set(gait,action);}this.strideAction=this.strideActions.get('walk');this.activeStrideAction=this.strideAction;
  this.actions.set('guard_walk',this.mixer.clipAction(new T.AnimationClip('guard_walk',walk.duration,tracks)));
 }
 customize(){this.model.traverse(o=>{if(o.name.includes('Hood'))o.visible=this.state.hood;if(o.name.includes('Hair_Simple'))o.visible=!this.state.hood;if(o instanceof T.Mesh){const mats=Array.isArray(o.material)?o.material:[o.material];const custom=mats.map(old=>{const m=(old as T.MeshStandardMaterial).clone();weatheredCloth(m,this.assets.textures,o.name);if(m.name.includes('Hair'))m.color.set(this.state.hair);if(m.name.includes('Superhero')||m.name.includes('Regular_Male'))m.color.set(this.state.skin);return m;});o.material=Array.isArray(o.material)?custom:custom[0];}});}
 private gripAlignment?:T.Quaternion;
 equip(name:ItemId|null){if(this.tool){this.tool.removeFromParent();this.tool=undefined;}this.equipped=name;if(name&&['axe','pickaxe','sword','fine_sword','hammer','bow'].includes(name)){
  if(!this.gripAlignment){this.root.updateMatrixWorld(true);const rootQ=this.root.getWorldQuaternion(new T.Quaternion());const shaft=new T.Vector3(0,-.98,.20).normalize().applyQuaternion(rootQ);const edge=new T.Vector3(-1,0,0).applyQuaternion(rootQ);const normal=new T.Vector3().crossVectors(edge,shaft).normalize();edge.crossVectors(shaft,normal).normalize();const worldQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(edge,shaft,normal));this.gripAlignment=this.grip.getWorldQuaternion(new T.Quaternion()).invert().multiply(worldQ);}
  const t=name==='bow'?makeBow():this.assets.prop(name==='fine_sword'?'sword':name);if(name==='fine_sword'){t.scale.setScalar(1.08);t.traverse(o=>{if(o instanceof T.Mesh){const tint=(m:T.Material)=>{const n=(m as T.MeshStandardMaterial).clone();n.color.multiplyScalar(1.35);n.roughness=.26;return n;};o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);}});}this.grip.add(t);t.position.set(0,0,0);t.quaternion.copy(this.gripAlignment);
  if(name==='axe')t.rotateY(Math.PI);else if(name==='pickaxe')t.rotateY(Math.PI/2);else if(name==='bow'){t.scale.setScalar(1.08);t.rotateY(Math.PI/2);t.rotateZ(Math.PI/2);}this.tool=t;
 }}
 setAttackWarpTarget(position?:Vec3){if(!position){this.attackWarpTarget=undefined;return;}if(!this.attackWarpTarget)this.attackWarpTarget=new T.Vector3();this.attackWarpTarget.fromArray(position);}
 private locomotion(name:string){return name==='walk'||name==='run'||name==='sprint'||name==='guard_walk';}
 private phase(action:T.AnimationAction){const d=action.getClip().duration;return d>0?T.MathUtils.euclideanModulo(action.time/d,1):0;}
 private setPhase(action:T.AnimationAction,phase:number){action.time=T.MathUtils.euclideanModulo(phase,1)*action.getClip().duration;}
 private prepareStride(name:string,phase?:number){const gait=name==='guard_walk'?'walk':name,next=this.strideActions.get(gait);if(!next)return;if(phase!==undefined&&this.strideAction)this.setPhase(this.strideAction,phase);if(this.activeStrideAction!==next){const previous=this.activeStrideAction,handoff=phase??(previous?this.phase(previous):this.strideAction?this.phase(this.strideAction):0);this.setPhase(next,handoff);if(this.strideActive){previous?.fadeOut(.055);next.enabled=true;next.weight=1;next.fadeIn(.055);}this.activeStrideAction=next;}else if(phase!==undefined)this.setPhase(next,phase);}
 private updateStride(speed:number,active:boolean){const gait=speed>4.7?'sprint':speed>2.35?'run':'walk';this.prepareStride(gait);const action=this.activeStrideAction;if(!action)return;if(active!==this.strideActive){if(active){action.enabled=true;action.weight=1;action.fadeIn(.055);}else action.fadeOut(.08);this.strideActive=active;}else if(active&&!action.enabled){action.enabled=true;action.weight=1;}const nominal=gait==='sprint'?6.4:gait==='run'?3.6:1.5;action.timeScale=T.MathUtils.clamp(speed/nominal,.72,1.35);if(this.strideAction&&this.strideAction!==action){this.setPhase(this.strideAction,this.phase(action));this.strideAction.timeScale=action.timeScale;}}
 play(name:string,once=false,force=false){if(this.current===name&&!force)return;const next=this.actions.get(name);if(!next)throw new Error('Missing clip '+name);const prevName=this.current,prev=this.actions.get(prevName);let phase:number|undefined;if(this.locomotion(name)){if(prev&&this.locomotion(prevName))phase=this.phase(prev);else if(prevName.endsWith('_moving')&&this.strideAction)phase=this.phase(this.strideAction);}next.reset().setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);if(phase!==undefined)this.setPhase(next,phase);next.clampWhenFinished=once;next.enabled=true;next.setEffectiveWeight(1).setEffectiveTimeScale(1).play();if(prev&&prev!==next){const melee=/^(attack|heavy|chop|mine)(?:_moving)?$/.test(name);prev.crossFadeTo(next,melee?.055:.16,false);}this.current=name;}
 syncCombatPose(){const c=combatState(this.state),tick=this.getTick(),key=c.kind+':'+c.started;if(c.kind==='idle'||(c.until<=tick&&c.kind!=='death'))return;const base=c.kind==='attack'?(c.weapon==='axe'?'chop':c.weapon==='pickaxe'?'mine':'attack'):c.kind,melee=c.weapon!=='bow'&&['attack','heavy'].includes(c.kind),clip=melee?base+'_moving':base;if(key!==this.poseKey||this.current!==clip){const changed=key!==this.poseKey;this.poseKey=key;if(changed)this.attackHit=false;if(changed&&melee&&this.locomotion(this.current))this.prepareStride(this.current,this.phase(this.actions.get(this.current)!));this.play(clip,true,true);this.actions.get(clip)!.time=Math.max(0,(tick-c.started)/60);if(changed)this.locked=Math.max(0,(c.until-tick)/60);}else this.locked=Math.max(this.locked,(c.until-tick)/60);if(c.kind==='death'){this.velocity.set(0,0,0);this.collider.setEnabled(false);}}
 startAttack(heavy=false){if(this.state.health<=0)return false;this.onAttackStart();this.state.yaw=this.root.rotation.y;if(!this.onActionRequest(heavy?'heavy':'attack'))return false;this.syncCombatPose();return true;}
 private startDodge(yaw:number,keys:Set<string>){if(this.state.health<=0)return false;const x=Number(keys.has('KeyD'))-Number(keys.has('KeyA')),z=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));if(x||z)this.root.rotation.y=Math.atan2(Math.cos(yaw)*x+Math.sin(yaw)*z,Math.sin(yaw)*x-Math.cos(yaw)*z);this.state.yaw=this.root.rotation.y;if(!this.onActionRequest('dodge'))return false;this.syncCombatPose();return true;}
 private queue(action:CombatAction,tick:number){const ttl=action==='dodge'?24:22;if(action==='dodge'||this.bufferedAction?.action!=='dodge')this.bufferedAction={action,expires:tick+ttl};}
 preStep(dt:number,input:Pick<Input,'keys'|'take'|'secondary'> & Partial<Pick<Input,'primary'>>,yaw:number,enabled:boolean){
  const p=this.state,tick=this.getTick();let target=new T.Vector3();this.locked=Math.max(0,this.locked-dt);if(this.locked<1e-6)this.locked=0;if(enabled&&this.locked===0&&input.take('Digit5')&&p.inventory.some(s=>s.item==='bow')){p.equipped='bow';this.equip('bow');}
  const poseAtStart=combatState(p),inputTravel=enabled&&['KeyW','KeyA','KeyS','KeyD'].some(k=>input.keys.has(k)),carryingSwingMomentum=['attack','heavy'].includes(poseAtStart.kind)&&poseAtStart.until>tick&&this.velocity.length()>.12;
  this.swingLocomotion=!!(inputTravel||carryingSwingMomentum);this.syncCombatPose();if(!enabled||combatState(p).kind==='hit')this.bufferedAction=undefined;if(p.health<=0)return;
  const before=combatState(p);this.attackTime=['attack','heavy'].includes(before.kind)?(tick-before.started)/60:0;
  if(['attack','heavy'].includes(before.kind)&&this.attackTime<(attackProfile(p)?.impact??0)-.12){this.onWindupAim(dt);p.yaw=this.root.rotation.y;}
  if(['attack','heavy'].includes(before.kind)&&tick<=before.until&&!this.attackHit&&this.attackTime>=(attackProfile(p)?.impact??.567)){this.attackHit=true;this.onImpact();}
  if(enabled){
   if(input.take('Attack'))this.queue('attack',tick);if(input.take('KeyF'))this.queue('heavy',tick);if(input.take('Space'))this.queue('dodge',tick);if(this.bufferedAction&&this.bufferedAction.expires<tick)this.bufferedAction=undefined;
   if(this.bufferedAction){const action=this.bufferedAction.action,started=action==='dodge'?this.startDodge(yaw,input.keys):this.locked===0&&this.startAttack(action==='heavy');if(started)this.bufferedAction=undefined;}
   if(!this.bufferedAction&&input.primary&&this.locked===0)this.startAttack(false);
   const x=Number(input.keys.has('KeyD'))-Number(input.keys.has('KeyA')),z=Number(input.keys.has('KeyW'))-Number(input.keys.has('KeyS'));const moving=!!(x||z),sprint=input.keys.has('ShiftLeft')&&p.stamina>1;const speed=(sprint?6.4:input.keys.has('ControlLeft')?1.5:3.6)*stats(p).speed*this.moveSpeed;
   const swinging=['attack','heavy'].includes(combatState(p).kind)&&combatState(p).until>tick;
   if(moving&&(this.locked===0||swinging)){target.set(Math.cos(yaw)*x+Math.sin(yaw)*z,0,Math.sin(yaw)*x-Math.cos(yaw)*z).normalize().multiplyScalar(swinging?(combatState(p).kind==='heavy'?2.7:speed):input.secondary?1.5:speed);const desired=swinging?this.root.rotation.y:input.secondary?Math.atan2(Math.sin(yaw),-Math.cos(yaw)):Math.atan2(target.x,target.z);let delta=T.MathUtils.euclideanModulo(desired-this.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;this.root.rotation.y+=delta*(1-Math.exp(-dt*16));if(sprint&&!input.secondary)p.stamina=Math.max(0,p.stamina-dt*15);}
   if(input.secondary&&this.locked===0&&!moving)this.root.rotation.y=Math.atan2(Math.sin(yaw),-Math.cos(yaw));
   if(this.current==='dodge'&&this.locked>0)target.set(Math.sin(this.root.rotation.y),0,Math.cos(this.root.rotation.y)).multiplyScalar(5.8*Math.sin((.8-this.locked)/.8*Math.PI));
  }
  const active=combatState(p),profile=attackProfile(p);this.warpVelocity.set(0,0,0);
  if(enabled&&this.attackWarpTarget&&profile&&active.weapon!=='bow'&&['attack','heavy'].includes(active.kind)&&active.until>tick){const v=attackWarpVelocity(p.position,this.root.rotation.y,this.attackWarpTarget.toArray() as Vec3,profile.reach,this.attackTime,profile.impact,active.kind==='heavy');this.warpVelocity.fromArray(v);const warpSpeed=this.warpVelocity.length();if(warpSpeed>0){const dir=this.warpVelocity.clone().normalize(),along=target.dot(dir);if(along>=-.15&&along<warpSpeed)target.addScaledVector(dir,warpSpeed-along);if(!this.swingLocomotion){this.swingLocomotion=true;this.syncCombatPose();}}}
  setGuard(p,tick,enabled&&input.secondary&&this.locked===0);
  const liveCombat=combatState(p),activeSwing=liveCombat.weapon!=='bow'&&['attack','heavy'].includes(liveCombat.kind)&&liveCombat.until>tick,strideSpeed=Math.max(target.length(),this.velocity.length(),activeSwing&&!this.swingLocomotion?.9:0);this.updateStride(strideSpeed,activeSwing);
  target.add(this.knockback);this.knockback.multiplyScalar(Math.exp(-dt*9));
  this.velocity.lerp(target,1-Math.exp(-dt*(target.lengthSq()?14:22)));if(this.velocity.length()<.025)this.velocity.set(0,0,0);
  this.vertical=this.controller.computedGrounded()?-1:Math.max(-25,this.vertical-dt*25);this.controller.computeColliderMovement(this.collider,{x:this.velocity.x*dt,y:this.vertical*dt,z:this.velocity.z*dt});const m=this.controller.computedMovement(),b=this.body.translation();this.body.setNextKinematicTranslation({x:b.x+m.x,y:b.y+m.y,z:b.z+m.z});
  if(this.locked===0){const s=this.velocity.length();this.play(combatState(p).blocking?(s>.1?'guard_walk':'guard'):s>4?'sprint':s>2?'run':s>.1?'walk':'idle');const a=this.actions.get(this.current)!;a.timeScale=this.current==='walk'||this.current==='guard_walk'?s/1.5:this.current==='run'?s/3.6:this.current==='sprint'?s/6.4:1;}
  p.stamina=Math.min(stats(p).stamina,p.stamina+dt*(this.velocity.length()<4&&this.locked===0&&!combatState(p).blocking?17:0));this.stride+=this.velocity.length()*dt;if(this.stride>1.45){this.stride=0;this.onStep();}
 }
 postStep(dt:number){const b=this.body.translation();this.root.position.set(b.x,b.y-.9,b.z);this.state.position=this.root.position.toArray();this.state.yaw=this.root.rotation.y;this.mixer.update(dt);}
 preview(dt:number){this.mixer.update(dt);}
}
