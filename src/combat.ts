import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {Assets} from './assets';
import {Character} from './character';
import {Soundscape} from './audio';
import {seedExpedition} from './expedition';
import {makePlayer,type EnemyState,type LocalAuthority,type PlayerState} from './state';
import {beginAction,combatState,faces,horizontalDistance,resolveStrike,seedEnemies,WEAPONS,attackProfile,impactFeedback,type ImpactParticles,type StrikeResult} from './combat-rules';
import {animalAlive,resolveWildlifeStrike} from './wildlife-rules';

class Intent {
 keys=new Set<string>();secondary=false;pressed=new Set<string>();
 take(key:string){const found=this.pressed.has(key);this.pressed.delete(key);return found;}
 clear(){this.keys.clear();this.pressed.clear();this.secondary=false;}
}
interface Raider {state:EnemyState;actor:Character;input:Intent}
export class Combat {
 raiders=new Map<string,Raider>();shake=0;onNotice=(text:string)=>{};events:({tick:number;attackerId:string}&StrikeResult)[]=[];
 private sparks:{mesh:T.Points;velocity:T.Vector3[];life:number}[]=[];
 private freezes=new Map<Character,number>();private shakePeak=0;private shakeTime=0;private shakeDuration=0;
 constructor(private root:T.Group,private assets:Assets,private physics:RAPIER.World,private authority:LocalAuthority,private player:Character,private sound:Soundscape){
  seedEnemies(authority.state);seedExpedition(authority.state);
  authority.lineOfSight=(a,b)=>{const actor=a.id===player.state.id?player:this.raiders.get(a.id)?.actor,target=b.id===player.state.id?player:this.raiders.get(b.id)?.actor;if(!actor||!target)return false;const from=new T.Vector3(...a.position).add(new T.Vector3(0,1.1,0)),to=new T.Vector3(...b.position).add(new T.Vector3(0,1.1,0)),delta=to.sub(from),length=delta.length();const hit=physics.castRay(new RAPIER.Ray(from,delta.normalize()),length,true,undefined,undefined,actor.collider,actor.body);return !hit||hit.collider.handle===target.collider.handle;};
  for(const enemy of Object.values(authority.state.enemies)){
   const state:PlayerState={...makePlayer('Warden'),...enemy,hood:true,hair:'#27201c',skin:'#bb947b'};
   const actor=new Character(assets,physics,state,root),input=new Intent();actor.getTick=()=>authority.state.tick;actor.moveSpeed=.78;
   actor.onActionRequest=action=>{const out=beginAction(enemy,authority.state.tick,action);this.copyToActor(enemy,actor);if(out.ok&&(action==='attack'||action==='heavy'))this.sound.combat('swing');return out.ok;};
   actor.model.traverse(o=>{if(o instanceof T.Mesh){const mats=Array.isArray(o.material)?o.material:[o.material];for(const mat of mats){const m=mat as T.MeshStandardMaterial;if(m.name.includes('Ranger')){m.color.set(enemy.role==='captain'?'#b6ab89':'#f3ebe6');m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nif(diffuseColor.g>diffuseColor.r*1.12 && diffuseColor.g>diffuseColor.b*1.15){float clothL=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=vec3(.52,.145,.085)*clothL*2.2;}');};m.customProgramCacheKey=()=>"outcast-oxblood-cloth-v1";}}}});
   actor.onImpact=()=>{const target=authority.state.players[enemy.targetId??''];this.feedback(resolveStrike(authority.state,enemy,target,target?authority.lineOfSight!(enemy,target):true),enemy.id);};
   this.raiders.set(enemy.id,{state:enemy,actor,input});this.copyToActor(enemy,actor);actor.syncCombatPose();
   if(enemy.health<=0){actor.play('death',true,true);actor.mixer.update(4);}
  }
 }
 private copyToActor(e:EnemyState,a:Character){a.state.health=e.health;a.state.stamina=e.stamina;a.state.combat=e.combat;}
 private freeze(actor:Character|undefined,seconds:number){if(!actor||seconds<=0)return;this.freezes.set(actor,Math.max(this.freezes.get(actor)??0,seconds));actor.mixer.timeScale=0;}
 private impulse(peak:number,duration:number){this.shakePeak=Math.max(this.shakePeak,peak);this.shakeDuration=Math.max(this.shakeDuration,duration);this.shakeTime=Math.max(this.shakeTime,duration);this.shake=this.shakePeak;}
 nearest(p=this.player.state,range=12){return Object.values(this.authority.state.enemies).filter(e=>e.health>0&&horizontalDistance(e.position,p.position)<range).sort((a,b)=>horizontalDistance(a.position,p.position)-horizontalDistance(b.position,p.position))[0];}
 target(range?:number){const p=this.player.state,weapon=p.equipped?WEAPONS[p.equipped]:undefined;return Object.values(this.authority.state.enemies).filter(e=>e.health>0&&horizontalDistance(e.position,p.position)<(range??(weapon?.reach??2)+.25)&&faces(p,e,0)&&this.authority.lineOfSight?.(p,e)!==false).sort((a,b)=>horizontalDistance(a.position,p.position)-horizontalDistance(b.position,p.position))[0];}
 animalTarget(range?:number){const p=this.player.state,weapon=p.equipped?WEAPONS[p.equipped]:undefined;return Object.values(this.authority.state.animals??{}).filter(a=>a.kind!=='crow'&&animalAlive(a)&&horizontalDistance(a.position,p.position)<(range??(weapon?.reach??2)+.4)&&faces(p,a as never,-.15)).sort((a,b)=>horizontalDistance(a.position,p.position)-horizontalDistance(b.position,p.position))[0];}
 playerStrike(){
  const e=this.target();if(e){const out=this.authority.dispatch({type:'strike',playerId:this.player.state.id,enemyId:e.id}) as StrikeResult;this.feedback(out,this.player.state.id);return out;}
  const animal=this.animalTarget();if(animal){const out=resolveWildlifeStrike(this.authority.state,this.player.state,animal);this.events.push({tick:this.authority.state.tick,attackerId:this.player.state.id,...out});if(out.outcome==='hit'||out.outcome==='killed'){const profile=impactFeedback(this.player.state,out.outcome,'animal');this.sound.combat(profile.sound);this.impulse(profile.shake,profile.shakeDuration);this.freeze(this.player,profile.freeze);const visual=this.root.getObjectByName(animal.id);if(visual)this.burst(visual.position.clone().add(new T.Vector3(0,.7,0)),profile.particles);this.onNotice(out.message);}return out;}
  const out=this.authority.dispatch({type:'strike',playerId:this.player.state.id}) as StrikeResult;this.feedback(out,this.player.state.id);return out;
 }
 feedback(out:StrikeResult,attackerId:string){
  this.events.push({tick:this.authority.state.tick,attackerId,...out});if(this.events.length>30)this.events.shift();
  if(!out.outcome||out.outcome==='miss')return;
  if(out.outcome==='dodged'){this.onNotice('Evaded');return;}
  const attacker=attackerId===this.player.state.id?this.player:this.raiders.get(attackerId)?.actor,attackerState=attackerId===this.player.state.id?this.player.state:this.raiders.get(attackerId)?.state;
  if(out.outcome==='parried'){
   const parried=this.raiders.get(attackerId);if(parried){this.copyToActor(parried.state,parried.actor);parried.actor.syncCombatPose();}else this.player.syncCombatPose();
   if(attackerState){const profile=impactFeedback(attackerState,'parried');this.sound.combat(profile.sound);this.impulse(profile.shake,profile.shakeDuration);this.freeze(attacker,profile.freeze);this.burst((attacker??this.player).root.position.clone().add(new T.Vector3(0,1.05,0)),profile.particles);}
   this.onNotice('PARRIED · counter now');return;
  }
  const target=out.targetId===this.player.state.id?this.player:this.raiders.get(out.targetId!)?.actor;
  if(!target||!attacker||!attackerState)return;
  const e=this.raiders.get(out.targetId!);if(e)this.copyToActor(e.state,target);
  target.syncCombatPose();const profile=impactFeedback(attackerState,out.outcome as 'hit'|'blocked'|'killed');
  target.knockback.copy(target.root.position).sub(attacker.root.position).setY(0).normalize().multiplyScalar(out.targetId===this.player.state.id?profile.knockback*1.25:profile.knockback);
  this.sound.combat(profile.sound);this.impulse(profile.shake,profile.shakeDuration);this.freeze(attacker,profile.freeze);this.freeze(target,out.outcome==='blocked'?profile.freeze*.55:profile.freeze*.8);
  this.burst(target.root.position.clone().add(new T.Vector3(0,1.1,0)),profile.particles);
  if(out.outcome==='killed'){this.onNotice(out.targetId===this.player.state.id?'You have fallen. Your gathered supplies remain here.':'Enemy defeated — collect the supplies and check the strongbox.');}
  else if(out.outcome==='blocked')this.onNotice('Guard held · '+out.damage+' damage');
  else if(attackerId===this.player.state.id)this.onNotice(out.damage+' damage · '+(e?.state.name??'Hit'));
 }
 private burst(position:T.Vector3,kind:ImpactParticles){
  const count=kind==='metal'?8:kind==='flesh'?7:9,coords=new Float32Array(count*3),velocity:T.Vector3[]=[];for(let i=0;i<count;i++)velocity.push(new T.Vector3((Math.random()-.5)*(kind==='metal'?2.8:1.8),Math.random()*(kind==='metal'?1.8:1.1),(Math.random()-.5)*(kind==='metal'?2.8:1.8)));
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(coords,3));
  const color=kind==='metal'?'#f0cf8c':kind==='flesh'?'#6e2721':'#917452',size=kind==='metal'?.04:kind==='flesh'?.055:.075;
  const mesh=new T.Points(geometry,new T.PointsMaterial({color,size,transparent:true,depthWrite:false}));mesh.position.copy(position);this.root.add(mesh);this.sparks.push({mesh,velocity,life:kind==='metal'?.22:.3});
 }
 preStep(dt:number){
  const w=this.authority.state;
  for(const {state:e,actor,input} of this.raiders.values()){
   input.clear();this.copyToActor(e,actor);const c=combatState(e);let destination:T.Vector3|undefined,guard=false;
   const leash=e.encounter?15:23;
   const target=Object.values(w.players).filter(p=>p.health>0&&(!e.bountyId||p.bounties?.active===e.bountyId||e.targetId===p.id)&&(!e.encounter||p.expedition?.accepted&&!p.expedition.completed)&&horizontalDistance(p.position,e.home)<leash).sort((a,b)=>horizontalDistance(a.position,e.position)-horizontalDistance(b.position,e.position))[0];
   const distance=target?horizontalDistance(target.position,e.position):Infinity;
   if(e.health<=0)e.phase='dead';
   else if(c.kind==='hit'&&c.until>w.tick){e.phase='stagger';e.decisionAt=Math.max(e.decisionAt,c.until+38);}
   else if(['attack','heavy'].includes(c.kind)&&c.until>w.tick)e.phase=(w.tick-c.started)/60<(attackProfile(e)?.impact??.4333)?'windup':'recover';
   else if(!target||distance>14||horizontalDistance(e.position,e.home)>leash){
    e.targetId=undefined;e.phase=horizontalDistance(e.position,e.home)>3?'return':'patrol';
    const angle=Math.floor(w.tick/360)*2.1;destination=new T.Vector3(e.home[0]+Math.sin(angle)*2,e.home[1],e.home[2]+Math.cos(angle)*2);input.keys.add('ControlLeft');
   }else if(!e.targetId){e.targetId=target.id;e.phase='alert';e.decisionAt=w.tick+48;this.onNotice(e.role==='captain'?'The Ash Captain draws steel. Dodge his heavy cut, then counter.':e.encounter?'Ash Company spotted you. Keep your escape route clear.':'An outcast bars the camp. Guard with right mouse; dodge with Space.');}
   else if(e.phase==='alert'&&w.tick<e.decisionAt){guard=true;}
   else {
    e.targetId=target.id;
    const desired=Math.atan2(target.position[0]-e.position[0],target.position[2]-e.position[2]);
    const allyAttacking=Object.values(w.enemies).some(other=>other.id!==e.id&&other.health>0&&other.targetId===target.id&&other.combat?.weapon&&other.combat.started>w.tick-100);
    if(distance<1.8&&w.tick>=e.decisionAt&&!allyAttacking){actor.root.rotation.y=desired;e.yaw=desired;const heavy=e.role==='captain'&&Math.floor(w.tick/180)%2===0;actor.startAttack(heavy);e.phase='windup';e.decisionAt=w.tick+(heavy?155:e.role==='scout'?100:118);}
    else if(distance>1.75){e.phase='approach';destination=new T.Vector3(...target.position);}
    else {e.phase='circle';guard=w.tick>=e.decisionAt-24&&w.tick%180<(e.role==='captain'?60:34);const side=Math.floor(w.tick/240)%2?1:-1;if(w.tick>=e.decisionAt-24)destination=new T.Vector3(e.position[0]+Math.cos(desired)*side,e.position[1],e.position[2]-Math.sin(desired)*side);input.keys.add('ControlLeft');}
   }
   let yaw=target?Math.PI-Math.atan2(target.position[0]-e.position[0],target.position[2]-e.position[2]):0;
   if(destination&&destination.distanceTo(actor.root.position)>.25){const delta=destination.sub(actor.root.position);yaw=Math.PI-Math.atan2(delta.x,delta.z);input.keys.add('KeyW');}
   if(guard){input.secondary=true;input.keys.clear();if(target)yaw=Math.PI-Math.atan2(target.position[0]-e.position[0],target.position[2]-e.position[2]);}
   actor.preStep(dt,input,yaw,true);
  }
 }
 postStep(dt:number){
  for(const {state:e,actor} of this.raiders.values()){actor.postStep(dt);e.position=[...actor.state.position];e.yaw=actor.state.yaw;e.stamina=actor.state.stamina;e.combat=actor.state.combat;}
  for(const [actor,left] of this.freezes){const next=left-dt;if(next<=0){actor.mixer.timeScale=1;this.freezes.delete(actor);}else this.freezes.set(actor,next);}
  if(this.shakeTime>0){this.shakeTime=Math.max(0,this.shakeTime-dt);const t=this.shakeDuration?this.shakeTime/this.shakeDuration:0;this.shake=this.shakePeak*t*t;if(this.shakeTime===0){this.shake=0;this.shakePeak=0;this.shakeDuration=0;}}else this.shake=0;
  for(let i=this.sparks.length-1;i>=0;i--){const s=this.sparks[i];s.life-=dt;const attr=s.mesh.geometry.getAttribute('position') as T.BufferAttribute;for(let j=0;j<s.velocity.length;j++){s.velocity[j].y-=dt*4.5;attr.setXYZ(j,attr.getX(j)+s.velocity[j].x*dt,attr.getY(j)+s.velocity[j].y*dt,attr.getZ(j)+s.velocity[j].z*dt);}attr.needsUpdate=true;(s.mesh.material as T.PointsMaterial).opacity=Math.max(0,s.life/.3);if(s.life<=0){s.mesh.removeFromParent();s.mesh.geometry.dispose();(s.mesh.material as T.Material).dispose();this.sparks.splice(i,1);}}
 }
 read(){return Object.values(this.authority.state.enemies).map(e=>{const a=this.raiders.get(e.id)!.actor;return {...structuredClone(e),distance:horizontalDistance(e.position,this.player.state.position),animation:a.current,grounded:a.controller.computedGrounded(),grip:a.grip.getWorldPosition(new T.Vector3()).toArray(),toolOrigin:a.tool?.getWorldPosition(new T.Vector3()).toArray(),facingPlayer:faces(e,this.player.state)};});}
}
