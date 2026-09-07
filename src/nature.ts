import * as T from 'three';
import {Assets} from './assets';
import {Landscape,random} from './landscape';
import {height,roadX} from './terrain';
import type {WorldState,ForageState,Vec3} from './state';
import {animalClips,instantiateAnimal,loadExtendedAnimalLibrary} from './animal-models';
import {animalAlive,bearBite,bearMaul,corpseId,ensureAnimalVitals,predatorBite,wolfBite,wolfMaul} from './wildlife-rules';
import {AUTHORED_ANIMAL_SET,PREDATOR_SPECIES,predatorCanHunt,species,type AnimalKind,type AnimalState,type AuthoredAnimalKind} from './wildlife-species';
import {WILDLIFE_SPAWNS} from './wildlife-spawns';
import {aggroWolfPack,ambientWanderHeading,angleTo,cohesiveFleeHeading,headingVector,herdCenter,predatorTarget,predatorThreat,wildlifeDistance,wolfFlankPoint,wolfInterferer} from './wildlife-ai';
import {aerialPreyAction,beginCarry,ensureAerialState,releaseCarry,stepAerialEnergy} from './wildlife-aerial';
import {createBeehiveVisual} from './beehive-visual';

export type {AnimalKind,AnimalState} from './wildlife-species';
export {ambientWanderHeading,cohesiveFleeHeading,headingVector,herdCenter} from './wildlife-ai';
// Compatibility export for existing focused behavior tests/callers.
export const bearTarget=(bear:AnimalState,animals:Record<string,AnimalState>,radius=24)=>predatorTarget(bear,animals,radius);

interface AnimalVisual {group:T.Group;mixer?:T.AnimationMixer;idle?:T.AnimationAction;walk?:T.AnimationAction;run?:T.AnimationAction;attack?:T.AnimationAction;fly?:T.AnimationAction;active?:T.AnimationAction}
const MODELS={berries:'berry_bush',mushroom:'mushrooms',herb:'herbs',wood:'fallen_branch',fiber:'flax'} as const;
const HIVE_SPAWNS:readonly [string,number,number][]=[['nature-hive-0',-27,11],['nature-hive-1',31,52],['nature-hive-2',-42,92],['nature-hive-3',48,128]];
const dist=wildlifeDistance;

export function seedNature(w:WorldState){
 const rng=random(4872);
 for(let i=0;i<68;i++){
  const z=24-rng()*110,x=roadX(z)+(i%2?1:-1)*(3.3+rng()*12),id='nature-forage-'+i;
  if(w.forage[id]||height(x,z)<-.8||Object.values(w.structures).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<3)||Object.values(w.stations).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<2)||Object.values(w.resources).some(r=>r.phase==='standing'&&Math.hypot(x-r.position[0],z-r.position[2])<1.5))continue;
  w.forage[id]={id,kind:(['berries','mushroom','herb','wood'] as const)[i%4],position:[x,height(x,z),z],harvested:false};
 }
 for(const [id,x,z] of HIVE_SPAWNS)w.forage[id]??={id,kind:'wild_honey',position:[x,height(x,z),z],harvested:false};
 w.animals??={};
 for(const spawn of WILDLIFE_SPAWNS){const y=height(spawn.x,spawn.z);w.animals[spawn.id]??={id:spawn.id,kind:spawn.kind,position:[spawn.x,y,spawn.z],home:[spawn.x,y,spawn.z],yaw:spawn.yaw,phase:spawn.yaw*1.7,packId:spawn.packId};}
 for(const animal of Object.values(w.animals)){ensureAnimalVitals(animal);if(species(animal.kind).aerial)ensureAerialState(animal);}
}
export function forageAvailable(f:ForageState,tick:number){return !f.harvested||(f.readyAt!==undefined&&f.readyAt<=tick);}

export class Nature {
 plants=new Map<string,T.Object3D>();animals=new Map<string,AnimalVisual>();onNotice=(text:string)=>{};
 constructor(private root:T.Group,private assets:Assets,private w:WorldState,private land:Landscape){seedNature(w);for(const a of Object.values(w.animals!))if(a.kind==='hare'||a.kind==='crow')this.spawnLegacy(a);void this.loadAuthoredAnimals();this.update(0);}
 private spawnLegacy(a:AnimalState){const model=this.assets.prop(a.kind);model.rotation.y=Math.PI;const group=new T.Group();group.name=a.id;group.add(model);group.position.fromArray(a.position);this.root.add(group);this.animals.set(a.id,{group});}
 private async loadAuthoredAnimals(){
  try{
   const library=await loadExtendedAnimalLibrary();
   for(const a of Object.values(this.w.animals!))if(AUTHORED_ANIMAL_SET.has(a.kind)&&!this.animals.has(a.id)){
    const kind=a.kind as AuthoredAnimalKind,{root,animations}=instantiateAnimal(kind,library[kind]);const group=new T.Group();group.name=a.id;group.add(root);group.position.fromArray(a.position);this.root.add(group);
    const mixer=animations.length?new T.AnimationMixer(root):undefined,clips=animalClips(animations);const idle=mixer&&clips.idle?mixer.clipAction(clips.idle):undefined,walk=mixer&&clips.walk?mixer.clipAction(clips.walk):undefined,run=mixer&&clips.run?mixer.clipAction(clips.run):undefined,attack=mixer&&clips.attack?mixer.clipAction(clips.attack):undefined,fly=mixer&&clips.fly?mixer.clipAction(clips.fly):undefined;
    const visual:AnimalVisual={group,mixer,idle,walk,run,attack,fly};this.animals.set(a.id,visual);this.useAction(visual,a.kind==='eagle'?fly??idle??walk??run:idle??walk??run);if(a.dead)this.poseDead(a,visual);
   }
  }catch(error){console.warn('Alderwatch authored wildlife could not load; legacy hare/crow wildlife remains available.',error);}
 }
 private useAction(v:AnimalVisual,next?:T.AnimationAction){if(!next||v.active===next)return;next.reset().fadeIn(.18).play();if(v.active&&v.active!==next)v.active.fadeOut(.18);v.active=next;}
 private poseDead(a:AnimalState,v:AnimalVisual){v.active?.stop();v.mixer?.stopAllAction();v.group.position.fromArray(a.position);v.group.rotation.y=a.yaw;v.group.rotation.z=species(a.kind).deathRoll;}
 private settleDeadAerial(a:AnimalState){if(!species(a.kind).aerial)return;const y=height(a.position[0],a.position[2]);a.position[1]=y;const corpse=this.w.containers[corpseId(a.id)];if(corpse)corpse.position=[...a.position];}
 private predatorPrey(a:AnimalState,all:Record<string,AnimalState>){
  const config=species(a.kind).predator;if(!config||a.carriedPreyId)return undefined;
  if(species(a.kind).aerial&&a.airborne!==true)return undefined;
  if(a.huntTargetId){const current=all[a.huntTargetId],d=current&&animalAlive(current)?dist(a.position,current.position):Infinity;
   if(!current||!animalAlive(current)||current.carriedById||!predatorCanHunt(a.kind,current.kind)||d>config.acquireRadius+12||this.w.tick>=(a.huntUntil??0)){a.huntTargetId=undefined;a.huntBestDistance=undefined;a.huntCooldownUntil=this.w.tick+180;}
   else if(d<(a.huntBestDistance??Infinity)-.75){a.huntBestDistance=d;a.huntUntil=this.w.tick+360;return current;}else return current;
  }
  if((a.huntCooldownUntil??0)>this.w.tick)return undefined;
  // Player-proximity gates stop the food web resolving every encounter while nobody is there to see it.
  const wakeRadius=a.kind==='wolf'?85:a.kind==='eagle'?105:Infinity;
  if(Number.isFinite(wakeRadius)&&!Object.values(this.w.players).some(player=>player.health>0&&dist(player.position,a.position)<wakeRadius))return undefined;
  const next=predatorTarget(a,all,config.acquireRadius);if(next){a.huntTargetId=next.id;a.huntBestDistance=dist(a.position,next.position);a.huntUntil=this.w.tick+(a.kind==='eagle'?360:540);}return next;
 }
 private releaseExhaustedCarry(a:AnimalState,all:Record<string,AnimalState>){const prey=releaseCarry(a,all);if(!prey)return;const y=height(a.position[0],a.position[2]);prey.position=[a.position[0],y,a.position[2]];prey.avoidUntil=this.w.tick+50;this.onNotice(`A tired eagle drops the ${prey.kind}`);}
 private finishEagleCarry(a:AnimalState,all:Record<string,AnimalState>){const prey=releaseCarry(a,all);if(!prey||!animalAlive(prey))return;prey.position=[a.position[0],height(a.position[0],a.position[2]),a.position[2]];predatorBite(this.w,a,prey,prey.health??999);a.huntCooldownUntil=this.w.tick+240;}
 update(dt:number){
  for(const f of Object.values(this.w.forage).filter(f=>f.id.startsWith('nature-'))){
   const visible=Object.values(this.w.players).some(p=>Math.hypot(p.position[0]-f.position[0],p.position[2]-f.position[2])<65)&&forageAvailable(f,this.w.tick)&&!this.land.ambientOccupied(f.position[0],f.position[2])&&!Object.values(this.w.structures).some(s=>Math.hypot(s.position[0]-f.position[0],s.position[2]-f.position[2])<2);let model=this.plants.get(f.id);
   if(visible&&!model){if(f.kind==='wild_honey')model=createBeehiveVisual(this.assets);else model=this.assets.prop(MODELS[f.kind??'fiber']);model.position.fromArray(f.position);model.rotation.y=Number(f.id.split('-').at(-1))*.91;model.scale.setScalar(f.kind==='mushroom'?1.45:f.kind==='wild_honey'?1.15:1.15);this.root.add(model);this.plants.set(f.id,model);}if(model)model.visible=visible;
  }
  const all=this.w.animals!;
  for(const a of Object.values(all)){
   ensureAnimalVitals(a);const visual=this.animals.get(a.id),profile=species(a.kind),aerial=profile.aerial;if(aerial)ensureAerialState(a);
   if(!animalAlive(a)){this.settleDeadAerial(a);if(visual)this.poseDead(a,visual);continue;}
   if(a.carriedById){const carrier=all[a.carriedById];if(carrier&&animalAlive(carrier)&&carrier.carriedPreyId===a.id&&carrier.airborne){a.position=[carrier.position[0],carrier.position[1]-.72,carrier.position[2]];if(visual){visual.group.position.fromArray(a.position);this.useAction(visual,visual.idle??visual.walk);}continue;}a.carriedById=undefined;}
   if(aerial){const step=stepAerialEnergy(a,dt);if(step.exhaustedDrop)this.releaseExhaustedCarry(a,all);if(a.carriedPreyId&&(a.carryUntil??Infinity)<=this.w.tick)this.finishEagleCarry(a,all);}
   const predatorConfig=profile.predator,isPredator=PREDATOR_SPECIES.has(a.kind),p=Object.values(this.w.players).filter(player=>player.health>0).sort((one,two)=>dist(one.position,a.position)-dist(two.position,a.position))[0];
   const near=p?dist(p.position,a.position):Infinity,predator=!isPredator?predatorThreat(a,all,a.kind==='bison'?24:17):undefined,provoker=a.lastAttackerId?this.w.players[a.lastAttackerId]:undefined,provoked=(a.alarmedUntil??0)>this.w.tick&&!!provoker&&provoker.health>0;
   const canHunt=!aerial||(a.airborne===true&&(a.energy??0)>12);let prey=isPredator&&canHunt?this.predatorPrey(a,all):undefined;
   if(a.kind==='wolf'&&prey){const interferer=wolfInterferer(a,prey,all,this.w.players,this.w.tick);if(interferer&&(a.aggroUntil??0)<=this.w.tick)aggroWolfPack(a,all,interferer.id,this.w.tick);}
   const rememberedWolf=a.kind==='wolf'&&(a.aggroUntil??0)>this.w.tick&&a.aggroPlayerId?this.w.players[a.aggroPlayerId]:undefined;
   const hostilePlayer=a.kind==='bear'&&p&&(near<(predatorConfig?.playerAggroRadius??0)||(provoked&&p.id===a.lastAttackerId&&near<(predatorConfig?.provokedRadius??0)))?p:a.kind==='wolf'?(rememberedWolf?.health!>0?rememberedWolf:provoked&&provoker?provoker:!prey&&p&&near<(predatorConfig?.playerAggroRadius??0)?p:undefined):undefined;
   if(hostilePlayer)prey=undefined;
   const center=herdCenter(a,all),flee=!isPredator&&(near<profile.fleeRadius||!!predator||provoked),hunting=!!prey||!!hostilePlayer,carrying=!!a.carriedPreyId;
   a.phase+=dt;const homeDistance=dist(a.home,a.position),centerDistance=center?dist(center,a.position):0,phase=(a.id.length*1.618)%6.283;
   const threat=predator?.position??(provoked&&provoker?provoker.position:p&&near<profile.fleeRadius?p.position:undefined);
   const carcass=a.kind==='bear'&&!hunting&&Math.sin(a.phase*.12+phase)>.92?Object.values(all).filter(other=>other.dead&&predatorCanHunt(a.kind,other.kind)&&dist(other.position,a.position)<16).sort((x,y)=>dist(x.position,a.position)-dist(y.position,a.position))[0]:undefined;
   const grazing=profile.grazes&&!flee&&!hunting&&homeDistance<profile.homeRadius&&centerDistance<10&&Math.sin(a.phase*.18+phase)<.28;
   const preyPoint=prey?(a.kind==='wolf'?wolfFlankPoint(a,prey,all):prey.position):undefined;
   let desired=threat?cohesiveFleeHeading(a,threat,center):hostilePlayer?angleTo(a.position,hostilePlayer.position):preyPoint?angleTo(a.position,preyPoint):carrying?angleTo(a.position,a.home):carcass?angleTo(a.position,carcass.position):homeDistance>profile.homeRadius?angleTo(a.position,a.home):center&&centerDistance>7?angleTo(a.position,center):ambientWanderHeading(a);
   const airborne=!!aerial&&a.airborne===true,ambientMove=!grazing&&Math.sin(a.phase*.55+phase)>.12,moving=flee||hunting||carrying||airborne||!!carcass||homeDistance>profile.homeRadius||centerDistance>7||ambientMove,flight=(a.kind==='crow'&&moving)||airborne;
   if((a.avoidUntil??0)>this.w.tick)desired=a.yaw;if(moving)a.yaw+=T.MathUtils.clamp(T.MathUtils.euclideanModulo(desired-a.yaw+Math.PI,Math.PI*2)-Math.PI,-dt*profile.turnRate,dt*profile.turnRate);
   const speed=hostilePlayer?(a.kind==='bear'?4.6:predatorConfig?.chaseSpeed??profile.escapeSpeed):prey?predatorConfig?.chaseSpeed??profile.escapeSpeed:carrying?Math.min(6.2,predatorConfig?.chaseSpeed??6.2):carcass?1.15:moving?(flee?profile.escapeSpeed:airborne?4.4:a.kind==='crow'?2.2:profile.wanderSpeed):0,[hx,hz]=headingVector(a.yaw),x=a.position[0]+hx*speed*dt,z=a.position[2]+hz*speed*dt;
   const clear=height(x,z)>-1&&!this.land.ambientOccupied(x,z)&&Object.values(this.w.resources).every(r=>r.phase!=='standing'||Math.hypot(x-r.position[0],z-r.position[2])>(r.kind==='tree'?1.1:1.2))&&Object.values(this.w.structures).every(s=>Math.hypot(x-s.position[0],z-s.position[2])>2);
   if(clear||(flight&&!Object.values(this.w.structures).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<2))){a.position[0]=x;a.position[2]=z;}else{a.yaw+=Math.PI*.6;a.avoidUntil=this.w.tick+50;if(isPredator&&hunting)a.huntUntil=Math.min(a.huntUntil??this.w.tick,this.w.tick+90);}
   if(predatorConfig&&hostilePlayer&&dist(a.position,hostilePlayer.position)<predatorConfig.attackReach+.05&&this.w.tick>=(a.attackAt??0)){a.attackAt=this.w.tick+predatorConfig.attackCooldown+(a.kind==='bear'?12:0);a.attackingUntil=this.w.tick+30;const out=a.kind==='bear'?bearMaul(this.w,a,hostilePlayer):wolfMaul(this.w,a,hostilePlayer);if(out.ok)this.onNotice(out.message);}
   else if(predatorConfig&&prey&&dist(a.position,prey.position)<predatorConfig.attackReach&&this.w.tick>=(a.attackAt??0)){
    a.attackAt=this.w.tick+predatorConfig.attackCooldown;a.attackingUntil=this.w.tick+30;
    if(a.kind==='bear')bearBite(this.w,a,prey);else if(a.kind==='wolf')wolfBite(this.w,a,prey);else if(a.kind==='eagle'){
     const action=aerialPreyAction(a,prey);if(action==='pickup'){if(beginCarry(a,prey,this.w.tick))this.onNotice(`An eagle snatches a ${prey.kind}`);}else if(action){predatorBite(this.w,a,prey,action==='kill'?(prey.health??999):undefined);if(action==='kill')this.onNotice(`An eagle takes a ${prey.kind}`);}
    }
    if(!animalAlive(prey)){a.huntTargetId=undefined;a.huntBestDistance=undefined;a.huntCooldownUntil=this.w.tick+240;}
   }
   const ground=height(a.position[0],a.position[2]);let targetY=ground;
   if(airborne&&aerial)targetY=ground+(hunting?aerial.huntHeight:aerial.cruiseHeight)+(carrying?.7:0)+Math.sin(a.phase*1.7)*.18;else if(a.kind==='crow'&&moving)targetY=ground+1.7+Math.sin(a.phase*3)*.12;else if(a.kind==='hare'&&moving)targetY=ground+Math.max(0,Math.sin(a.phase*(flee?14:8)))*.15;
   a.position[1]=T.MathUtils.damp(a.position[1],targetY,flight?4:16,dt);
   if(!visual)continue;const model=visual.group;model.position.fromArray(a.position);model.rotation.y=a.yaw;visual.mixer?.update(dt);
   if(AUTHORED_ANIMAL_SET.has(a.kind)){const attacking=(a.attackingUntil??0)>this.w.tick;this.useAction(visual,attacking?visual.attack??(airborne?visual.fly:visual.run)??visual.walk:airborne?visual.fly??visual.run??visual.walk:moving?((flee||hunting)?visual.run??visual.walk:visual.walk??visual.run):visual.idle??visual.walk);}
   else model.traverse(part=>{if(part.name.startsWith('Hare_front'))part.rotation.x=moving?Math.sin(a.phase*(flee?14:8))*.55:0;if(part.name.startsWith('Hare_hind'))part.rotation.x=moving?-Math.sin(a.phase*(flee?14:8))*.65:0;if(part.name==='Hare_head')part.rotation.x=moving?.08:Math.sin(a.phase*1.3)*.13;if(part.name.startsWith('Hare_ear'))part.rotation.z=Math.sin(a.phase*2)*.04;if(part.name.startsWith('Crow_wing'))part.rotation.z=(part.name.endsWith('-1')?-1:1)*(flight?Math.sin(a.phase*13)*.85:.95);});
  }
 }
}
