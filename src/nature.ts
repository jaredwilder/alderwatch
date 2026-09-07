import * as T from 'three';
import {Assets} from './assets';
import {Landscape,random} from './landscape';
import {height,roadX} from './terrain';
import type {WorldState,Vec3,ForageState} from './state';
import {animalClips,instantiateAnimal,loadExtendedAnimalLibrary,type ExtendedAnimalKind} from './animal-models';

export type AnimalKind='hare'|'crow'|ExtendedAnimalKind;
export interface AnimalState {id:string;kind:AnimalKind;position:Vec3;home:Vec3;yaw:number;phase:number;avoidUntil?:number}
interface AnimalVisual {group:T.Group;mixer?:T.AnimationMixer;idle?:T.AnimationAction;walk?:T.AnimationAction;run?:T.AnimationAction;active?:T.AnimationAction}
const MODELS={berries:'berry_bush',mushroom:'mushrooms',herb:'herbs',wood:'fallen_branch',fiber:'flax'};
const EXTENDED=new Set<AnimalKind>(['goat','sheep','deer','bear']);
const PROFILE:Record<AnimalKind,{flee:number;home:number;wander:number;escape:number}>={
 hare:{flee:6,home:8,wander:.6,escape:3.8},crow:{flee:6,home:8,wander:.6,escape:3.8},
 goat:{flee:6,home:11,wander:.58,escape:3.1},sheep:{flee:7,home:11,wander:.48,escape:2.8},
 deer:{flee:11,home:22,wander:.72,escape:5.2},bear:{flee:4,home:28,wander:.48,escape:1.8},
};

export function seedNature(w:WorldState){
 const rng=random(4872);
 for(let i=0;i<68;i++){
  const z=24-rng()*110,x=roadX(z)+(i%2?1:-1)*(3.3+rng()*12),id='nature-forage-'+i;
  if(w.forage[id]||height(x,z)<-.8||Object.values(w.structures).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<3)||Object.values(w.stations).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<2)||Object.values(w.resources).some(r=>r.phase==='standing'&&Math.hypot(x-r.position[0],z-r.position[2])<1.5))continue;
  w.forage[id]={id,kind:(['berries','mushroom','herb','wood'] as const)[i%4],position:[x,height(x,z),z],harvested:false};
 }
 w.animals??={};
 const roster:[string,AnimalKind,number,number,number][]=[
  ['wildlife-0','hare',4,14,0],['wildlife-1','hare',-5,-17,1],['wildlife-2','crow',3,3,2],['wildlife-3','crow',-4,-38,3],
  ['pasture-goat-0','goat',15,21,.4],['pasture-goat-1','goat',20,27,1.2],
  ['pasture-sheep-0','sheep',-15,20,2.2],['pasture-sheep-1','sheep',-21,26,3.1],
  ['southwood-deer-0','deer',28,132,1.7],['southwood-deer-1','deer',-34,178,4.2],
  ['ironward-bear','bear',198,72,2.8],['briar-bear','bear',-214,154,5.1],
 ];
 for(const [id,kind,x,z,yaw] of roster){const y=height(x,z);w.animals[id]??={id,kind,position:[x,y,z],home:[x,y,z],yaw,phase:yaw*1.7};}
}
export function forageAvailable(f:ForageState,tick:number){return !f.harvested||(f.readyAt!==undefined&&f.readyAt<=tick);}

export class Nature {
 plants=new Map<string,T.Object3D>();animals=new Map<string,AnimalVisual>();
 constructor(private root:T.Group,private assets:Assets,private w:WorldState,private land:Landscape){
  seedNature(w);
  for(const a of Object.values(w.animals!))if(a.kind==='hare'||a.kind==='crow')this.spawnLegacy(a);
  void this.loadExtendedAnimals();this.update(0);
 }
 private spawnLegacy(a:AnimalState){const model=this.assets.prop(a.kind);model.rotation.y=Math.PI;const group=new T.Group();group.name=a.id;group.add(model);group.position.fromArray(a.position);this.root.add(group);this.animals.set(a.id,{group});}
 private async loadExtendedAnimals(){
  try{
   const library=await loadExtendedAnimalLibrary();
   for(const a of Object.values(this.w.animals!))if(EXTENDED.has(a.kind)&&!this.animals.has(a.id)){
    const kind=a.kind as ExtendedAnimalKind,{root,animations}=instantiateAnimal(kind,library[kind]);const group=new T.Group();group.name=a.id;group.add(root);group.position.fromArray(a.position);this.root.add(group);
    const mixer=animations.length?new T.AnimationMixer(root):undefined,clips=animalClips(animations);
    const idle=mixer&&clips.idle?mixer.clipAction(clips.idle):undefined,walk=mixer&&clips.walk?mixer.clipAction(clips.walk):undefined,run=mixer&&clips.run?mixer.clipAction(clips.run):undefined;
    const visual:AnimalVisual={group,mixer,idle,walk,run};this.animals.set(a.id,visual);this.useAction(visual,idle??walk??run);
   }
  }catch(error){console.warn('Alderwatch extended wildlife could not load; hare/crow wildlife remains available.',error);}
 }
 private useAction(v:AnimalVisual,next?:T.AnimationAction){if(!next||v.active===next)return;next.reset().fadeIn(.18).play();if(v.active&&v.active!==next)v.active.fadeOut(.18);v.active=next;}
 update(dt:number){
  for(const f of Object.values(this.w.forage).filter(f=>f.id.startsWith('nature-forage-'))){
   const visible=Object.values(this.w.players).some(p=>Math.hypot(p.position[0]-f.position[0],p.position[2]-f.position[2])<65)&&forageAvailable(f,this.w.tick)&&!this.land.ambientOccupied(f.position[0],f.position[2])&&!Object.values(this.w.structures).some(s=>Math.hypot(s.position[0]-f.position[0],s.position[2]-f.position[2])<2);
   let model=this.plants.get(f.id);if(visible&&!model){model=this.assets.prop(MODELS[f.kind??'fiber']);model.position.fromArray(f.position);model.rotation.y=Number(f.id.split('-').at(-1))*2.4;model.scale.setScalar(f.kind==='mushroom'?1.45:1.15);this.root.add(model);this.plants.set(f.id,model);}if(model)model.visible=visible;
  }
  for(const a of Object.values(this.w.animals!)){
   const profile=PROFILE[a.kind],p=Object.values(this.w.players).filter(p=>p.health>0).sort((p,q)=>Math.hypot(p.position[0]-a.position[0],p.position[2]-a.position[2])-Math.hypot(q.position[0]-a.position[0],q.position[2]-a.position[2]))[0];
   const near=p?Math.hypot(p.position[0]-a.position[0],p.position[2]-a.position[2]):Infinity,flee=near<profile.flee;
   a.phase+=dt;const homeDistance=Math.hypot(a.home[0]-a.position[0],a.home[2]-a.position[2]);
   let desired=flee&&p?Math.atan2(a.position[0]-p.position[0],a.position[2]-p.position[2]):homeDistance>profile.home?Math.atan2(a.home[0]-a.position[0],a.home[2]-a.position[2]):Math.sin(a.phase*.17)*Math.PI;
   const moving=flee||homeDistance>profile.home||Math.sin(a.phase*.7)>.5,flight=a.kind==='crow'&&moving;
   if((a.avoidUntil??0)>this.w.tick)desired=a.yaw;a.yaw+=T.MathUtils.clamp(T.MathUtils.euclideanModulo(desired-a.yaw+Math.PI,Math.PI*2)-Math.PI,-dt*(a.kind==='bear'?2.2:5),dt*(a.kind==='bear'?2.2:5));
   const speed=moving?(flee?profile.escape:flight?2.2:profile.wander):0,x=a.position[0]+Math.sin(a.yaw)*speed*dt,z=a.position[2]+Math.cos(a.yaw)*speed*dt;
   const clear=height(x,z)>-1&&!this.land.ambientOccupied(x,z)&&Object.values(this.w.resources).every(r=>r.phase!=='standing'||Math.hypot(x-r.position[0],z-r.position[2])>(r.kind==='tree'?1.1:1.2))&&Object.values(this.w.structures).every(s=>Math.hypot(x-s.position[0],z-s.position[2])>2);
   if(clear||(flight&&!this.land.ambientOccupied(x,z)&&Object.values(this.w.structures).every(s=>Math.hypot(x-s.position[0],z-s.position[2])>2))){a.position[0]=x;a.position[2]=z;}else{a.yaw+=Math.PI*.6;a.avoidUntil=this.w.tick+50;}
   const ground=height(a.position[0],a.position[2]),lift=a.kind==='hare'&&moving?Math.max(0,Math.sin(a.phase*(flee?14:8)))*.15:flight?1.7+Math.sin(a.phase*3)*.12:0;
   a.position[1]=T.MathUtils.damp(a.position[1],ground+lift,flight?4:16,dt);
   const visual=this.animals.get(a.id);if(!visual)continue;const model=visual.group;model.position.fromArray(a.position);model.rotation.y=a.yaw;visual.mixer?.update(dt);
   if(EXTENDED.has(a.kind))this.useAction(visual,moving?(flee?visual.run??visual.walk:visual.walk??visual.run):visual.idle??visual.walk);
   else model.traverse(part=>{
    if(part.name.startsWith('Hare_front'))part.rotation.x=moving?Math.sin(a.phase*(flee?14:8))*.55:0;
    if(part.name.startsWith('Hare_hind'))part.rotation.x=moving?-Math.sin(a.phase*(flee?14:8))*.65:0;
    if(part.name==='Hare_head')part.rotation.x=moving?.08:Math.sin(a.phase*1.3)*.13;
    if(part.name.startsWith('Hare_ear'))part.rotation.z=Math.sin(a.phase*2)*.04;
    if(part.name.startsWith('Crow_wing'))part.rotation.z=(part.name.endsWith('-1')?-1:1)*(flight?Math.sin(a.phase*13)*.85:.95);
   });
  }
 }
}
