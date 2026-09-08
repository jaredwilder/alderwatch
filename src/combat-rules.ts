import type {CombatState,EnemyState,ItemId,PlayerState,Vec3,WorldState} from './state';
import {stats} from './definitions';
import {height} from './terrain';
import {combatSkillFor,gainSkill} from './skills';

export interface Fighter {id:string;position:Vec3;yaw:number;health:number;stamina:number;equipped:ItemId|null;combat?:CombatState}
export const WEAPONS:Partial<Record<ItemId,{damage:number;reach:number;impact:number;duration:number;stamina:number}>>={
 sword:{damage:24,reach:1.95,impact:13/30,duration:25/30,stamina:12},
 fine_sword:{damage:34,reach:2.05,impact:13/30,duration:25/30,stamina:12},
 axe:{damage:20,reach:2.2,impact:17/30,duration:31/30,stamina:14},
 pickaxe:{damage:12,reach:2.1,impact:17/30,duration:31/30,stamina:14},
 hammer:{damage:10,reach:1.5,impact:.567,duration:1.22,stamina:12},
 bow:{damage:32,reach:38,impact:.32,duration:.76,stamina:9},
};
export type ImpactSound='light_sword'|'heavy_sword'|'axe'|'pick'|'animal'|'hit'|'block'|'parry';
export type ImpactParticles='flesh'|'metal'|'dust';
export interface ImpactFeedbackProfile {sound:ImpactSound;shake:number;shakeDuration:number;freeze:number;knockback:number;staggerTicks:number;particles:ImpactParticles}
export function impactFeedback(attacker:Fighter,outcome:'hit'|'blocked'|'parried'|'killed',target:'fighter'|'animal'='fighter'):ImpactFeedbackProfile{
 if(outcome==='parried')return {sound:'parry',shake:.048,shakeDuration:.13,freeze:.055,knockback:.5,staggerTicks:66,particles:'metal'};
 if(outcome==='blocked')return {sound:'block',shake:.03,shakeDuration:.10,freeze:.026,knockback:.32,staggerTicks:0,particles:'metal'};
 const c=attacker.combat,item=c?.weapon??attacker.equipped,heavy=c?.kind==='heavy'&&!!item?.includes('sword');
 let profile:ImpactFeedbackProfile;
 if(heavy)profile={sound:'heavy_sword',shake:.072,shakeDuration:.16,freeze:.052,knockback:1.55,staggerTicks:34,particles:'flesh'};
 else if(item?.includes('sword'))profile={sound:'light_sword',shake:.052,shakeDuration:.12,freeze:.034,knockback:1,staggerTicks:24,particles:'flesh'};
 else if(item==='axe')profile={sound:'axe',shake:.062,shakeDuration:.14,freeze:.044,knockback:1.35,staggerTicks:30,particles:'flesh'};
 else if(item==='pickaxe')profile={sound:'pick',shake:.056,shakeDuration:.12,freeze:.038,knockback:1.15,staggerTicks:27,particles:'flesh'};
 else if(item==='bow')profile={sound:'hit',shake:.026,shakeDuration:.08,freeze:.012,knockback:.55,staggerTicks:18,particles:'flesh'};
 else profile={sound:'hit',shake:.045,shakeDuration:.11,freeze:.03,knockback:.9,staggerTicks:24,particles:'dust'};
 if(target==='animal')profile={...profile,sound:'animal',freeze:Math.max(.012,profile.freeze-.006),shake:profile.shake*.9};
 if(outcome==='killed')profile={...profile,shake:profile.shake*1.12,knockback:profile.knockback*1.08};
 return profile;
}
export const horizontalDistance=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export function combatState(f:Fighter):CombatState{return f.combat??={kind:'idle',started:0,until:0,consumed:false,blocking:false,weapon:null};}
export function actionBusy(f:Fighter,tick:number){return f.health<=0||combatState(f).until>tick;}
export function attackProfile(f:Fighter){const c=combatState(f),w=c.weapon?WEAPONS[c.weapon]:undefined;return w&&c.kind==='heavy'?{...w,damage:Math.round(w.damage*1.7),reach:w.reach+.05,impact:25/30,duration:47/30,stamina:26}:w;}
export function beginAction(f:Fighter,tick:number,action:'attack'|'heavy'|'dodge'){
 if(actionBusy(f,tick))return {ok:false,message:'Recover before acting again'};
 const weapon=f.equipped?WEAPONS[f.equipped]:undefined;
 if(action!=='dodge'&&!weapon)return {ok:false,message:'Equip a weapon or tool'};
 if(action==='heavy'&&!f.equipped?.includes('sword'))return {ok:false,message:'Equip a sword for a two-handed heavy strike'};
 const cost=action==='dodge'?22:action==='heavy'?26:weapon!.stamina;
 if(f.stamina<cost)return {ok:false,message:'Not enough stamina'};
 f.stamina-=cost;f.combat={kind:action,started:tick,until:tick+Math.ceil((action==='dodge'?.8:action==='heavy'?47/30:weapon!.duration)*60),consumed:false,blocking:false,weapon:f.equipped};
 return {ok:true,message:action==='dodge'?'Dodge':f.equipped==='bow'?'Loose arrow':'Attack'};
}
export function setGuard(f:Fighter,tick:number,wanted:boolean){const c=combatState(f),blocking=wanted&&!actionBusy(f,tick)&&f.stamina>=1&&!!f.equipped&&f.equipped!=='bow'&&!!WEAPONS[f.equipped];if(blocking&&!c.blocking)c.guardSince=tick;if(!blocking)c.guardSince=undefined;c.blocking=blocking;}
export function faces(a:Fighter,b:Fighter,minimum=.25){const dx=b.position[0]-a.position[0],dz=b.position[2]-a.position[2],d=Math.hypot(dx,dz);return d<.01||(Math.sin(a.yaw)*dx+Math.cos(a.yaw)*dz)/d>=minimum;}
const PERFECT_DODGE_START=.12,PERFECT_DODGE_END=.24,COUNTER_STAGGER_TICKS=48;
function guardPressure(item:ItemId|null,heavy:boolean){if(heavy)return 36;switch(item){case'hammer':return 30;case'axe':return 26;case'pickaxe':return 23;case'bow':return 14;default:return 18;}}
function guardChip(item:ItemId|null,heavy:boolean){if(heavy)return .18;switch(item){case'hammer':return .24;case'axe':return .16;case'pickaxe':return .14;case'bow':return .08;default:return .1;}}
function counterMultiplier(item:ItemId|null){if(item?.includes('sword'))return 1.55;if(item==='hammer')return 1.5;if(item==='axe')return 1.4;if(item==='pickaxe')return 1.35;if(item==='bow')return 1.25;return 1.3;}
export function counterOpening(target:Fighter,tick:number){const c=combatState(target);return c.kind==='hit'&&c.until>tick&&c.until-c.started>=COUNTER_STAGGER_TICKS;}
export type StrikeResult={ok:boolean;message:string;outcome?:'hit'|'blocked'|'parried'|'dodged'|'miss'|'killed';damage?:number;targetId?:string;counter?:boolean;perfectDodge?:boolean;guardBreak?:boolean};
function worldDrop(w:WorldState,item:ItemId,count:number,position:Vec3,index:number){const id='drop-'+w.nextId++,angle=index*2.4;w.drops[id]={id,item,count,position:[position[0]+Math.sin(angle)*.6,position[1]+.65,position[2]+Math.cos(angle)*.6],rotation:[0,angle,Math.PI/2]};}
export function killFighter(w:WorldState,target:Fighter){
 target.health=0;target.combat={kind:'death',started:w.tick,until:w.tick+180,consumed:true,blocking:false,weapon:target.equipped};
 const enemy=w.enemies[target.id];
 if(enemy){enemy.phase='dead';if(!enemy.rewarded){enemy.rewarded=true;(['hide','iron','venison'] as ItemId[]).forEach((item,i)=>worldDrop(w,item,[3,2,1][i],target.position,i));if(!w.progress.includes('bandit-defeated'))w.progress.push('bandit-defeated');}}
 else {const p=w.players[target.id];if(p){let i=0;p.inventory=p.inventory.filter(s=>{if(['wood','stone','iron','fiber','hide'].includes(s.item)){worldDrop(w,s.item,s.count,p.position,i++);return false;}return true;});}}
}
// A swing is resolved exactly once inside its authored contact window, not on pointer-down.
export function resolveStrike(w:WorldState,attacker:Fighter,target:Fighter|undefined,lineClear=true):StrikeResult{
 const a=combatState(attacker),weapon=attackProfile(attacker),age=(w.tick-a.started)/60;
 if(attacker.health<=0||!['attack','heavy'].includes(a.kind)||a.consumed||!weapon||age+1e-6<weapon.impact||w.tick>a.until)return {ok:false,message:'No unresolved strike at this time'};
 a.consumed=true;
 if(!target||target.health<=0||!lineClear||horizontalDistance(attacker.position,target.position)>weapon.reach||Math.abs(attacker.position[1]-target.position[1])>1.5||!faces(attacker,target,a.weapon==='bow'?.35:.25))return {ok:true,outcome:'miss',message:lineClear?'Out of reach':'Strike obstructed'};
 if(a.weapon?.includes('sword')){
  const dx=target.position[0]-attacker.position[0],dz=target.position[2]-attacker.position[2],side=dx*Math.cos(attacker.yaw)-dz*Math.sin(attacker.yaw),forward=dx*Math.sin(attacker.yaw)+dz*Math.cos(attacker.yaw);
  // Authored contact corridor around the blade, expanded by the target capsule.
  // Heavy downward cuts have less lateral sweep than the light diagonal cut.
  if(Math.abs(side+.15)>(a.kind==='heavy'?.40:.85)||forward<.25)return {ok:true,outcome:'miss',message:'The blade passed clear'};
 }
 const defense=combatState(target),dodgeAge=(w.tick-defense.started)/60;
 if(defense.kind==='dodge'&&dodgeAge>=.1&&dodgeAge<=.46){const perfect=dodgeAge>=PERFECT_DODGE_START&&dodgeAge<=PERFECT_DODGE_END;if(perfect)attacker.combat={kind:'hit',started:w.tick,until:w.tick+COUNTER_STAGGER_TICKS,consumed:true,blocking:false,weapon:attacker.equipped};return {ok:true,outcome:'dodged',damage:0,targetId:target.id,perfectDodge:perfect,message:perfect?'Perfect dodge · counter now':'Evaded'};}
 const counter=counterOpening(target,w.tick);
 let damage=Math.round(weapon.damage*(w.players[attacker.id]?stats(w.players[attacker.id]).damage:.72));if(counter)damage=Math.max(damage+1,Math.round(damage*counterMultiplier(a.weapon??attacker.equipped)));
 let blocked=false,guardBreak=false;
 if(defense.blocking&&faces(target,attacker,.45)){
  if(a.kind!=='heavy'&&defense.guardSince!==undefined&&w.tick-defense.guardSince<=12&&target.stamina>=8){target.stamina-=8;const stagger=impactFeedback(attacker,'parried').staggerTicks;attacker.combat={kind:'hit',started:w.tick,until:w.tick+stagger,consumed:true,blocking:false,weapon:attacker.equipped};return {ok:true,outcome:'parried',damage:0,targetId:target.id,message:'Parried · counter now'};}
  const guardCost=guardPressure(a.weapon??attacker.equipped,a.kind==='heavy');blocked=target.stamina>=guardCost;target.stamina=Math.max(0,target.stamina-guardCost);
  if(blocked)damage=Math.max(1,Math.round(damage*guardChip(a.weapon??attacker.equipped,a.kind==='heavy')));else guardBreak=true;
 }
 target.health=Math.max(0,target.health-damage);
 if(target.health<=0)killFighter(w,target);
 else if(guardBreak)target.combat={kind:'hit',started:w.tick,until:w.tick+COUNTER_STAGGER_TICKS,consumed:true,blocking:false,weapon:target.equipped};
 else if(!blocked){const stagger=impactFeedback(attacker,'hit').staggerTicks;target.combat={kind:'hit',started:w.tick,until:w.tick+stagger,consumed:true,blocking:false,weapon:target.equipped};}
 const player=w.players[attacker.id],skill=combatSkillFor(a.weapon??attacker.equipped);if(player&&skill){gainSkill(player,skill);gainSkill(player,'tactics');}
 return {ok:true,outcome:target.health<=0?'killed':blocked?'blocked':'hit',damage,targetId:target.id,counter,guardBreak,message:target.health<=0?'Raider defeated — collect his supplies':guardBreak?'Guard broken · punish now':counter?'Riposte':blocked?'Guard held':'Strike landed'};
}
export function seedEnemies(w:WorldState){
 // Registry entries, including dead enemies, remain authoritative across reloads.
 const id='raider-camp-sentry';if(w.enemies[id])return;
 const position:Vec3=[34,height(34,-20)+.02,-20];
 w.enemies[id]={id,name:'March outcast',position,yaw:-Math.PI/2,home:[...position],health:88,maxHealth:88,stamina:100,equipped:'sword',phase:'patrol',decisionAt:0,rewarded:false};
}
export function guardedCache(w:WorldState,containerId:string){const frontier=w.frontier?.sites[containerId];if(frontier)return frontier.enemies.some(id=>!w.enemies[id]||w.enemies[id].health>0);const bounty=Object.values(w.bountySites??{}).find(s=>'bounty-cache-'+s.id===containerId);if(bounty)return bounty.enemies.some(id=>!w.enemies[id]||w.enemies[id].health>0);const site=Object.values(w.expeditionSites??{}).find(s=>'expedition-cache-'+s.id===containerId);if(site)return site.enemies.some(id=>!w.enemies[id]||w.enemies[id].health>0);return containerId==='raider-cache'&&Object.values(w.enemies).some(e=>e.health>0&&horizontalDistance(e.position,w.containers[containerId].position)<20);}
export function respawn(w:WorldState,p:PlayerState){
 if(p.health>0)return {ok:false,message:'You are still standing'};
 const x=p.home?.[0]??0,z=p.home?p.home[2]+3:18;
 p.position=[x,height(x,z)+.05,z];p.health=stats(p).health;p.stamina=stats(p).stamina;p.combat=undefined;
 return {ok:true,message:'You return to the March. Your dropped supplies remain where you fell.'};
}
