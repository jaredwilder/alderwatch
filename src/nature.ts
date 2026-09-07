import * as T from 'three';
import {Assets} from './assets';
import {Landscape,random} from './landscape';
import {height,roadX} from './terrain';
import type {WorldState,Vec3,ForageState} from './state';
import {animalClips,instantiateAnimal,loadExtendedAnimalLibrary,type ExtendedAnimalKind} from './animal-models';
import {animalAlive,bearBite,bearMaul,ensureAnimalVitals} from './wildlife-rules';

export type AnimalKind='hare'|'crow'|ExtendedAnimalKind;
export interface AnimalState {id:string;kind:AnimalKind;position:Vec3;home:Vec3;yaw:number;phase:number;avoidUntil?:number;health?:number;maxHealth?:number;dead?:boolean;killedBy?:'player'|'bear';diedAt?:number;attackAt?:number;huntTargetId?:string;huntUntil?:number;huntBestDistance?:number;huntCooldownUntil?:number;hitAt?:number;alarmedUntil?:number;lastAttackerId?:string}
interface AnimalVisual {group:T.Group;mixer?:T.AnimationMixer;idle?:T.AnimationAction;walk?:T.AnimationAction;run?:T.AnimationAction;active?:T.AnimationAction}
const MODELS={berries:'berry_bush',mushroom:'mushrooms',herb:'herbs',wood:'fallen_branch',fiber:'flax'};
const EXTENDED=new Set<AnimalKind>(['goat','sheep','deer','bear']);
const PREY=new Set<AnimalKind>(['hare','goat','sheep','deer']);
const PROFILE:Record<AnimalKind,{flee:number;home:number;wander:number;escape:number}>={
 hare:{flee:6,home:8,wander:.6,escape:3.8},crow:{flee:6,home:8,wander:.6,escape:3.8},
 goat:{flee:7.5,home:13,wander:.62,escape:3.6},sheep:{flee:8,home:13,wander:.56,escape:3.5},
 deer:{flee:12,home:22,wander:.82,escape:5.6},bear:{flee:0,home:38,wander:.72,escape:1.8},
};
const dist=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const angleTo=(from:Vec3,to:Vec3)=>Math.atan2(to[0]-from[0],to[2]-from[2]);
const angleAway=(from:Vec3,threat:Vec3)=>Math.atan2(from[0]-threat[0],from[2]-threat[2]);
const stableUnit=(id:string)=>{let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return (h>>>0)/4294967295;};
export function headingVector(yaw:number):[number,number]{return [Math.sin(yaw),Math.cos(yaw)];}
export function ambientWanderHeading(animal:AnimalState){const phase=stableUnit(animal.id)*Math.PI*2,heading=phase+Math.sin(animal.phase*.21+phase)*1.15+Math.sin(animal.phase*.073+phase*1.7)*.65;return T.MathUtils.euclideanModulo(heading+Math.PI,Math.PI*2)-Math.PI;}
export function bearTarget(bear:AnimalState,animals:Record<string,AnimalState>,radius=24){return Object.values(animals).filter(a=>a.id!==bear.id&&PREY.has(a.kind)&&animalAlive(a)&&dist(a.position,bear.position)<radius).sort((a,b)=>dist(a.position,bear.position)-dist(b.position,bear.position)||a.id.localeCompare(b.id))[0];}
export function herdCenter(animal:AnimalState,animals:Record<string,AnimalState>):Vec3|undefined{
 if(!['goat','sheep','deer'].includes(animal.kind))return undefined;
 const mates=Object.values(animals).filter(other=>other.kind===animal.kind&&animalAlive(other)&&dist(other.home,animal.home)<30);
 if(mates.length<2)return undefined;
 const total=mates.reduce((sum,mate)=>[sum[0]+mate.position[0],sum[1]+mate.position[1],sum[2]+mate.position[2]] as Vec3,[0,0,0] as Vec3);
 return [total[0]/mates.length,total[1]/mates.length,total[2]/mates.length];
}
export function cohesiveFleeHeading(animal:AnimalState,threat:Vec3,center?:Vec3){
 const away=angleAway(animal.position,threat);if(!center)return away;
 const [ax,az]=headingVector(away),toCenter=angleTo(animal.position,center),[cx,cz]=headingVector(toCenter);
 return Math.atan2(ax+cx*.28,az+cz*.28);
}

export function seedNature(w:WorldState){
 const rng=random(4872);
 for(let i=0;i<68;i++){
  const z=24-rng()*110,x=roadX(z)+(i%2?1:-1)*(3.3+rng()*12),id='nature-forage-'+i;
  if(w.forage[id]||height(x,z)<-.8||Object.values(w.structures).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<3)||Object.values(w.stations).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<2)||Object.values(w.resources).some(r=>r.phase==='standing'&&Math.hypot(x-r.position[0],z-r.position[2])<1.5))continue;
  w.forage[id]={id,kind:(['berries','mushroom','herb','wood'] as const)[i%4],position:[x,height(x,z),z],harvested:false};
 }
 w.animals??={};
 const roster:[string,AnimalKind,number,number,number][]=[
  ['wildlife-0','hare',4,14,0],['wildlife-1','hare',-5,-17,1],['wildlife-hare-2','hare',12,46,2.2],['wildlife-hare-3','hare',-18,67,4.1],['wildlife-2','crow',3,3,2],['wildlife-3','crow',-4,-38,3],['wildlife-crow-4','crow',24,82,.8],['wildlife-crow-5','crow',-31,116,5.2],
  ['pasture-goat-0','goat',14,20,.4],['pasture-goat-1','goat',18,24,1.2],['pasture-goat-2','goat',22,29,2.1],['pasture-goat-3','goat',12,34,4.8],['pasture-goat-4','goat',19,37,3.7],
  ['pasture-sheep-0','sheep',-14,19,2.2],['pasture-sheep-1','sheep',-18,23,3.1],['pasture-sheep-2','sheep',-23,28,.7],['pasture-sheep-3','sheep',-13,33,5.4],['pasture-sheep-4','sheep',-21,37,1.8],
  ['southwood-deer-0','deer',24,91,1.7],['southwood-deer-1','deer',31,98,4.2],['southwood-deer-2','deer',38,106,.9],['southwood-deer-3','deer',27,113,3.5],
  ['southwood-deer-4','deer',-31,132,2.7],['southwood-deer-5','deer',-39,140,5.7],['southwood-deer-6','deer',-47,149,1.1],['southwood-deer-7','deer',-35,156,4.6],
  ['ironward-bear','bear',198,72,2.8],['briar-bear','bear',-214,154,5.1],['southwood-bear','bear',76,201,3.6],
 ];
 for(const [id,kind,x,z,yaw] of roster){const y=height(x,z);w.animals[id]??={id,kind,position:[x,y,z],home:[x,y,z],yaw,phase:yaw*1.7};}
 for(const animal of Object.values(w.animals))ensureAnimalVitals(animal);
}
export function forageAvailable(f:ForageState,tick:number){return !f.harvested||(f.readyAt!==undefined&&f.readyAt<=tick);}

export class Nature {
 plants=new Map<string,T.Object3D>();animals=new Map<string,AnimalVisual>();onNotice=(text:string)=>{};
 constructor(private root:T.Group,private assets:Assets,private w:WorldState,private land:Landscape){seedNature(w);for(const a of Object.values(w.animals!))if(a.kind==='hare'||a.kind==='crow')this.spawnLegacy(a);void this.loadExtendedAnimals();this.update(0);}
 private spawnLegacy(a:AnimalState){const model=this.assets.prop(a.kind);model.rotation.y=Math.PI;const group=new T.Group();group.name=a.id;group.add(model);group.position.fromArray(a.position);this.root.add(group);this.animals.set(a.id,{group});}
 private async loadExtendedAnimals(){try{const library=await loadExtendedAnimalLibrary();for(const a of Object.values(this.w.animals!))if(EXTENDED.has(a.kind)&&!this.animals.has(a.id)){const kind=a.kind as ExtendedAnimalKind,{root,animations}=instantiateAnimal(kind,library[kind]);const group=new T.Group();group.name=a.id;group.add(root);group.position.fromArray(a.position);this.root.add(group);const mixer=animations.length?new T.AnimationMixer(root):undefined,clips=animalClips(animations);const idle=mixer&&clips.idle?mixer.clipAction(clips.idle):undefined,walk=mixer&&clips.walk?mixer.clipAction(clips.walk):undefined,run=mixer&&clips.run?mixer.clipAction(clips.run):undefined;const visual:AnimalVisual={group,mixer,idle,walk,run};this.animals.set(a.id,visual);this.useAction(visual,idle??walk??run);if(a.dead)this.poseDead(a,visual);}}catch(error){console.warn('Alderwatch extended wildlife could not load; hare/crow wildlife remains available.',error);}}
 private useAction(v:AnimalVisual,next?:T.AnimationAction){if(!next||v.active===next)return;next.reset().fadeIn(.18).play();if(v.active&&v.active!==next)v.active.fadeOut(.18);v.active=next;}
 private poseDead(a:AnimalState,v:AnimalVisual){v.active?.stop();v.mixer?.stopAllAction();v.group.position.fromArray(a.position);v.group.rotation.y=a.yaw;v.group.rotation.z=a.kind==='bear'?.72:1.18;}
 private bearPrey(a:AnimalState,all:Record<string,AnimalState>){
  if(a.huntTargetId){const current=all[a.huntTargetId],d=current&&animalAlive(current)?dist(a.position,current.position):Infinity;
   if(!current||!animalAlive(current)||d>34||this.w.tick>=(a.huntUntil??0)){a.huntTargetId=undefined;a.huntBestDistance=undefined;a.huntCooldownUntil=this.w.tick+180;}
   else if(d<(a.huntBestDistance??Infinity)-.75){a.huntBestDistance=d;a.huntUntil=this.w.tick+360;return current;}else return current;
  }
  if((a.huntCooldownUntil??0)>this.w.tick)return undefined;
  const next=bearTarget(a,all,23);if(next){a.huntTargetId=next.id;a.huntBestDistance=dist(a.position,next.position);a.huntUntil=this.w.tick+420;}return next;
 }
 update(dt:number){
  for(const f of Object.values(this.w.forage).filter(f=>f.id.startsWith('nature-forage-'))){const visible=Object.values(this.w.players).some(p=>Math.hypot(p.position[0]-f.position[0],p.position[2]-f.position[2])<65)&&forageAvailable(f,this.w.tick)&&!this.land.ambientOccupied(f.position[0],f.position[2])&&!Object.values(this.w.structures).some(s=>Math.hypot(s.position[0]-f.position[0],s.position[2]-f.position[2])<2);let model=this.plants.get(f.id);if(visible&&!model){model=this.assets.prop(MODELS[f.kind??'fiber']);model.position.fromArray(f.position);model.rotation.y=Number(f.id.split('-').at(-1))*2.4;model.scale.setScalar(f.kind==='mushroom'?1.45:1.15);this.root.add(model);this.plants.set(f.id,model);}if(model)model.visible=visible;}
  const all=this.w.animals!;
  for(const a of Object.values(all)){
   ensureAnimalVitals(a);const visual=this.animals.get(a.id);if(!animalAlive(a)){if(visual)this.poseDead(a,visual);continue;}
   const profile=PROFILE[a.kind],p=Object.values(this.w.players).filter(p=>p.health>0).sort((p,q)=>Math.hypot(p.position[0]-a.position[0],p.position[2]-a.position[2])-Math.hypot(q.position[0]-a.position[0],q.position[2]-a.position[2]))[0];
   const predator=PREY.has(a.kind)?Object.values(all).filter(b=>b.kind==='bear'&&animalAlive(b)&&dist(b.position,a.position)<17).sort((x,y)=>dist(x.position,a.position)-dist(y.position,a.position))[0]:undefined;
   const near=p?dist(p.position,a.position):Infinity,provoker=a.lastAttackerId?this.w.players[a.lastAttackerId]:undefined,provoked=(a.alarmedUntil??0)>this.w.tick&&!!provoker&&provoker.health>0;
   const hostilePlayer=a.kind==='bear'&&p&&(near<6.5||(provoked&&p.id===a.lastAttackerId&&near<34))?p:undefined;
   const prey=a.kind==='bear'&&!hostilePlayer?this.bearPrey(a,all):undefined,center=herdCenter(a,all);
   const flee=a.kind!=='bear'&&(near<profile.flee||!!predator||provoked),hunting=!!prey||!!hostilePlayer;
   a.phase+=dt;const homeDistance=dist(a.home,a.position),centerDistance=center?dist(center,a.position):0,phase=stableUnit(a.id)*Math.PI*2;
   const threat=predator?.position??(provoked&&provoker?provoker.position:p&&near<profile.flee?p.position:undefined);
   const carcass=a.kind==='bear'&&!hunting&&Math.sin(a.phase*.12+phase)>.92?Object.values(all).filter(other=>other.dead&&PREY.has(other.kind)&&dist(other.position,a.position)<16).sort((x,y)=>dist(x.position,a.position)-dist(y.position,a.position))[0]:undefined;
   const grazing=a.kind==='deer'&&!flee&&!hunting&&homeDistance<profile.home&&centerDistance<10&&Math.sin(a.phase*.18+phase)<.28;
   let desired=threat?cohesiveFleeHeading(a,threat,center):hostilePlayer?angleTo(a.position,hostilePlayer.position):prey?angleTo(a.position,prey.position):carcass?angleTo(a.position,carcass.position):homeDistance>profile.home?angleTo(a.position,a.home):center&&centerDistance>7?angleTo(a.position,center):ambientWanderHeading(a);
   const ambientMove=!grazing&&Math.sin(a.phase*.55+phase)>.12,moving=flee||hunting||!!carcass||homeDistance>profile.home||centerDistance>7||ambientMove,flight=a.kind==='crow'&&moving;
   if((a.avoidUntil??0)>this.w.tick)desired=a.yaw;if(moving)a.yaw+=T.MathUtils.clamp(T.MathUtils.euclideanModulo(desired-a.yaw+Math.PI,Math.PI*2)-Math.PI,-dt*(a.kind==='bear'?2.5:4.8),dt*(a.kind==='bear'?2.5:4.8));
   const speed=hostilePlayer?4.6:prey?4.1:carcass?1.15:moving?(flee?profile.escape:flight?2.2:profile.wander):0,[hx,hz]=headingVector(a.yaw),x=a.position[0]+hx*speed*dt,z=a.position[2]+hz*speed*dt;
   const clear=height(x,z)>-1&&!this.land.ambientOccupied(x,z)&&Object.values(this.w.resources).every(r=>r.phase!=='standing'||Math.hypot(x-r.position[0],z-r.position[2])>(r.kind==='tree'?1.1:1.2))&&Object.values(this.w.structures).every(s=>Math.hypot(x-s.position[0],z-s.position[2])>2);
   if(clear||(flight&&!this.land.ambientOccupied(x,z)&&Object.values(this.w.structures).every(s=>Math.hypot(x-s.position[0],z-s.position[2])>2))){a.position[0]=x;a.position[2]=z;}else{a.yaw+=Math.PI*.6;a.avoidUntil=this.w.tick+50;if(a.kind==='bear'&&hunting){a.huntUntil=Math.min(a.huntUntil??this.w.tick,this.w.tick+90);}}
   if(a.kind==='bear'&&hostilePlayer&&dist(a.position,hostilePlayer.position)<1.8&&this.w.tick>=(a.attackAt??0)){a.attackAt=this.w.tick+84;const out=bearMaul(this.w,a,hostilePlayer);if(out.ok)this.onNotice(out.message);}
   else if(a.kind==='bear'&&prey&&dist(a.position,prey.position)<1.75&&this.w.tick>=(a.attackAt??0)){a.attackAt=this.w.tick+72;bearBite(this.w,a,prey);if(!animalAlive(prey)){a.huntTargetId=undefined;a.huntBestDistance=undefined;a.huntCooldownUntil=this.w.tick+240;}}
   const ground=height(a.position[0],a.position[2]),lift=a.kind==='hare'&&moving?Math.max(0,Math.sin(a.phase*(flee?14:8)))*.15:flight?1.7+Math.sin(a.phase*3)*.12:0;a.position[1]=T.MathUtils.damp(a.position[1],ground+lift,flight?4:16,dt);
   if(!visual)continue;const model=visual.group;model.position.fromArray(a.position);model.rotation.y=a.yaw;visual.mixer?.update(dt);if(EXTENDED.has(a.kind))this.useAction(visual,moving?((flee||hunting)?visual.run??visual.walk:visual.walk??visual.run):visual.idle??visual.walk);else model.traverse(part=>{if(part.name.startsWith('Hare_front'))part.rotation.x=moving?Math.sin(a.phase*(flee?14:8))*.55:0;if(part.name.startsWith('Hare_hind'))part.rotation.x=moving?-Math.sin(a.phase*(flee?14:8))*.65:0;if(part.name==='Hare_head')part.rotation.x=moving?.08:Math.sin(a.phase*1.3)*.13;if(part.name.startsWith('Hare_ear'))part.rotation.z=Math.sin(a.phase*2)*.04;if(part.name.startsWith('Crow_wing'))part.rotation.z=(part.name.endsWith('-1')?-1:1)*(flight?Math.sin(a.phase*13)*.85:.95);});
  }
 }
}
