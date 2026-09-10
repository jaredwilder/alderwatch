import * as T from 'three';
import {Assets} from './assets';
import {height} from './terrain';
import {weatheredCloth} from './character-material';
import type {Vec3} from './state';
import {TavernBridge,type TavernEntity} from './tavern-bridge';

// The villagers of Alderbrook. Their ids are the contract with the dialogue
// service — server/personas.mjs holds the matching voice for each one, and
// tests/npc.test.ts fails if the two lists drift apart. Tavern interaction
// entities are kept out of VILLAGERS so that persona contract remains exact.
export interface Villager {id:string;name:string;role:string;position:Vec3;yaw:number;greeting:string;hair:string;cloth:string}
export const VILLAGERS:Villager[]=[
 {id:'smith',name:'Rowan Ash',role:'Blacksmith',position:[10.5,0,-34],yaw:-2.2,hair:'#2b2018',cloth:'#6d5a4a',
  greeting:'Mind the sparks. You after a blade, or just the warm?'},
 {id:'cook',name:'Maerin Vale',role:'Cook',position:[2.2,0,-23.4],yaw:2.5,hair:'#6b4a2f',cloth:'#8a7c5c',
  greeting:'There is broth on, love. Sit a while before the road takes you.'},
 {id:'warden',name:'Hallis Crow',role:'Village warden',position:[.5,0,-29],yaw:.4,hair:'#3a3128',cloth:'#4c5348',
  greeting:'You walked in from the east road. Say your business.'},
];

interface Actor {villager:Villager;root:T.Group;mixer:T.AnimationMixer;baseYaw:number}

/** Standing villagers plus Alderbrook's enterable tavern interaction seam. */
export class Village {
 actors=new Map<string,Actor>();tavern:TavernBridge;
 constructor(root:T.Group,assets:Assets){
  this.tavern=new TavernBridge(root,assets);
  const idle=assets.survivor.animations.find(a=>a.name==='idle');
  if(!idle)throw new Error('Animation release blocker: idle');
  for(const villager of VILLAGERS){
   const group=new T.Group(),model=assets.human();
   villager.position=[villager.position[0],height(villager.position[0],villager.position[2]),villager.position[2]];
   group.position.fromArray(villager.position);group.rotation.y=villager.yaw;group.add(model);root.add(group);
   model.traverse(o=>{
    if(o.name.includes('Hood'))o.visible=false;
    if(o.name.includes('Hair_Simple'))o.visible=true;
    if(!(o instanceof T.Mesh))return;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    const dressed=mats.map(old=>{const m=(old as T.MeshStandardMaterial).clone();weatheredCloth(m,assets.textures,o.name);
     if(m.name.includes('Hair'))m.color.set(villager.hair);
     if(m.name.includes('Ranger'))m.color.set(villager.cloth);
     return m;});
    o.material=Array.isArray(o.material)?dressed:dressed[0];
   });
   const mixer=new T.AnimationMixer(model),action=mixer.clipAction(idle);
   // Stagger the loop so three villagers do not breathe in lockstep.
   action.play().time=Math.random()*idle.duration;
   this.actors.set(villager.id,{villager,root:group,mixer,baseYaw:villager.yaw});
  }
 }
 /** The villager or tavern affordance close enough to use, if any. */
 nearest(position:Vec3,range=2.4):Villager|undefined{const tavern=this.tavern.nearest(position) as TavernEntity|undefined;if(tavern)return tavern;return VILLAGERS.map(v=>({v,d:Math.hypot(v.position[0]-position[0],v.position[2]-position[2])}))
  .filter(e=>e.d<range).sort((a,b)=>a.d-b.d)[0]?.v;}
 /** Idle animation, slow face-to-player turns, and bounded tavern ambience. */
 update(dt:number,position:Vec3){
  this.tavern.update(dt,position);
  for(const actor of this.actors.values()){
   actor.mixer.update(dt);
   const dx=position[0]-actor.villager.position[0],dz=position[2]-actor.villager.position[2];
   const desired=Math.hypot(dx,dz)<6?Math.atan2(dx,dz):actor.baseYaw;
   const delta=T.MathUtils.euclideanModulo(desired-actor.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;
   actor.root.rotation.y+=delta*(1-Math.exp(-dt*4));
  }
 }
}
