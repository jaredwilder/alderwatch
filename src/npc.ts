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

// Street identity is world dressing, not an interior side-effect. The first tavern
// pass accidentally built its only readable sign inside lazy interior construction,
// so the pub could exist in code while being literally undiscoverable in Alderbrook.
// This marker is created synchronously with the village every time the realm builds.
export const TIPSY_ALDER_MARKER={x:-12.15,z:-26.35};
function installTipsyAlderStreetMarker(root:T.Group,assets:Assets){
 if(typeof document==='undefined')return;
 const g=new T.Group();g.name='The Tipsy Alder · permanent street marker';g.position.set(TIPSY_ALDER_MARKER.x,height(TIPSY_ALDER_MARKER.x,TIPSY_ALDER_MARKER.z)+.02,TIPSY_ALDER_MARKER.z);root.add(g);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d');if(!c)return;
 c.fillStyle='#21150d';c.fillRect(0,0,1024,512);c.strokeStyle='#c7a45d';c.lineWidth=24;c.strokeRect(24,24,976,464);c.strokeStyle='#6d512d';c.lineWidth=7;c.strokeRect(55,55,914,402);
 c.textAlign='center';c.fillStyle='#ead59a';c.font='700 76px Georgia';c.fillText('THE TIPSY',512,170);c.font='700 112px Georgia';c.fillText('ALDER',512,292);c.fillStyle='#c8ae72';c.font='italic 34px Georgia';c.fillText('ALE · BONES · BAD COUNSEL',512,385);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const wood=new T.MeshStandardMaterial({color:'#4a3424',roughness:.92,metalness:0}),boardMat=new T.MeshStandardMaterial({map:texture,roughness:.82,metalness:.01,emissive:'#241406',emissiveIntensity:.32});
 const post=new T.Mesh(new T.BoxGeometry(.18,3.25,.18),wood);post.position.set(-1.62,1.62,0);post.castShadow=true;g.add(post);
 const arm=new T.Mesh(new T.BoxGeometry(3.35,.16,.16),wood);arm.position.set(0,3.08,0);arm.castShadow=true;g.add(arm);
 const brace=new T.Mesh(new T.BoxGeometry(.13,1.45,.13),wood);brace.position.set(-1.05,2.57,0);brace.rotation.z=-.72;g.add(brace);
 const board=new T.Mesh(new T.BoxGeometry(2.75,1.28,.13),boardMat);board.position.set(.18,2.14,0);board.castShadow=true;g.add(board);
 const iron=new T.MeshStandardMaterial({color:'#282522',roughness:.5,metalness:.64});for(const x of [-.66,1.01]){const chain=new T.Mesh(new T.BoxGeometry(.045,.65,.045),iron);chain.position.set(x,2.78,0);g.add(chain);}
 const lanternSource=assets.medieval.lantern;if(lanternSource){const lantern=lanternSource.clone(true);lantern.position.set(-1.63,2.35,.28);lantern.scale.setScalar(.62);g.add(lantern);}
 const light=new T.PointLight('#ffad61',3.0,7.5,2);light.position.set(-1.6,2.55,.34);g.add(light);
 // Ground clutter makes the frontage read as a tavern even before the sign text resolves.
 for(const [x,z,s] of [[.95,.48,.7],[1.56,.32,.56]] as const){const source=assets.medieval.barrel;if(!source)break;const barrel=source.clone(true);barrel.position.set(x,0,z);barrel.scale.setScalar(s);g.add(barrel);}
}

/** Standing villagers plus Alderbrook's enterable tavern interaction seam. */
export class Village {
 actors=new Map<string,Actor>();tavern:TavernBridge;
 constructor(root:T.Group,assets:Assets){
  installTipsyAlderStreetMarker(root,assets);
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
 nearest(position:Vec3,range=2.4):Villager|undefined{
  const tavern=this.tavern.nearest(position) as TavernEntity|undefined;if(tavern)return tavern;
  // An interior owns its interaction namespace; never fall through to outdoor Alderbrook NPCs.
  if(this.tavern.inside)return undefined;
  return VILLAGERS.map(v=>({v,d:Math.hypot(v.position[0]-position[0],v.position[2]-position[2])})).filter(e=>e.d<range).sort((a,b)=>a.d-b.d)[0]?.v;
 }
 /** Idle animation, slow face-to-player turns, and bounded tavern ambience. */
 update(dt:number,position:Vec3){
  this.tavern.update(dt,position);if(this.tavern.inside)return;
  for(const actor of this.actors.values()){
   actor.mixer.update(dt);
   const dx=position[0]-actor.villager.position[0],dz=position[2]-actor.villager.position[2];
   const desired=Math.hypot(dx,dz)<6?Math.atan2(dx,dz):actor.baseYaw;
   const delta=T.MathUtils.euclideanModulo(desired-actor.root.rotation.y+Math.PI,Math.PI*2)-Math.PI;
   actor.root.rotation.y+=delta*(1-Math.exp(-dt*4));
  }
 }
}
