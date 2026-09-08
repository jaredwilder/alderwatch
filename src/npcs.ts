import * as T from 'three';
import type {Assets} from './assets';
import type {WorldState,Vec3} from './state';
import {height} from './terrain';
import {openNpcConversation,installMarketConversationHook} from './npc-conversation';
import {updateNpcSocial} from './npc-social';

export type NpcRole='Trader'|'Fletcher'|'Beekeeper'|'Cook'|'Carpenter'|'Hunter'|'Guard'|'Dairy Visionary'|'Drifter';
/** Kept as a compatibility type for old tests/saves; cute KayKit bodies are no longer used in the live adult-medieval presentation. */
export type NpcSkin='Barbarian'|'Knight'|'Mage'|'Rogue';
export interface NpcLook {hair:string;skin:string;hood:boolean}
export interface NpcDefinition {id:string;name:string;role:NpcRole;x:number;z:number;radius:number;phase:number;tint:string;skin?:NpcSkin;look:NpcLook;lines:readonly string[]}
export interface NpcRuntime {definition:NpcDefinition;group:T.Group;visual:T.Object3D;mixer?:T.AnimationMixer;idle?:T.AnimationAction;walk?:T.AnimationAction;lastX:number;lastZ:number}

export const NPC_ROSTER:readonly NpcDefinition[]=[
 {id:'mara',name:'Mara Pennymarch',role:'Trader',x:-6,z:-28,radius:1.1,phase:.2,tint:'#70462f',look:{hair:'#241812',skin:'#c89c78',hood:false},lines:['If it fits on the scale, I can probably sell it.','Crow crop is not currency. Stop asking.','The market price of stew is whatever I say it is.']},
 {id:'wulfric',name:'Old Wulfric',role:'Fletcher',x:-11,z:-34,radius:2.1,phase:1.1,tint:'#344a36',look:{hair:'#8f8a7d',skin:'#bc8f70',hood:false},lines:['Feathers straight. Shaft straight. Hunter less so.','A good bow is mostly patience with string attached.']},
 {id:'elske',name:'Elske Honeyhand',role:'Beekeeper',x:2,z:-35,radius:1.8,phase:2.2,tint:'#78642d',look:{hair:'#ad854a',skin:'#d4aa84',hood:true},lines:['The bees know your karma. I refuse to elaborate.','Smoke first. Honey second. Running third.']},
 {id:'pell',name:'Brother Pell',role:'Cook',x:8,z:-39,radius:1.6,phase:3.1,tint:'#633c31',look:{hair:'#342219',skin:'#b98563',hood:false},lines:['Stew forgives many mistakes. Crow milk is not one of them.','If it stops moving, I can probably season it.']},
 {id:'sigrid',name:'Sigrid Cartwright',role:'Carpenter',x:-13,z:-50,radius:2.4,phase:4.3,tint:'#4d4930',look:{hair:'#6e4c2f',skin:'#d0a27b',hood:false},lines:['That beam is crooked. I can feel it from here.','A house is just a camp that won an argument.']},
 {id:'tomas',name:'Tomas Crowmilk',role:'Dairy Visionary',x:7,z:-55,radius:1.3,phase:5.2,tint:'#594063',look:{hair:'#171514',skin:'#c08e6b',hood:true},lines:['They laughed at the first cow too. Probably.','One crop. One herb. One dream.','Do not ask where the bucket went.']},
 {id:'ylva',name:'Ylva Ash-Eye',role:'Hunter',x:14,z:-63,radius:2.5,phase:.8,tint:'#294332',look:{hair:'#2b2018',skin:'#b88161',hood:true},lines:['Wolves move different when they have chosen something.','If the crows go quiet, look up.']},
 {id:'gate-guard',name:'Rurik Vale',role:'Guard',x:5,z:3,radius:1.4,phase:2.7,tint:'#3f4650',look:{hair:'#5a4536',skin:'#c89570',hood:true},lines:['Road is open. Wilderness is not.','If an eagle drops a sheep on you, that is outside my jurisdiction.']},
 {id:'moss',name:'Moss',role:'Drifter',x:-5,z:-69,radius:3.0,phase:4.9,tint:'#414638',look:{hair:'#3c3327',skin:'#aa795d',hood:true},lines:['Saw a wolf watch a bison watch me. Left immediately.','I used to have a plan. Then the March got interesting.']},
];

function label(def:NpcDefinition){
 if(typeof document==='undefined')return undefined;const canvas=document.createElement('canvas');canvas.width=384;canvas.height=96;const c=canvas.getContext('2d');if(!c)return undefined;c.fillStyle='rgba(10,14,12,.72)';c.fillRect(18,12,348,68);c.strokeStyle='rgba(213,184,113,.62)';c.strokeRect(18.5,12.5,347,67);c.fillStyle='#f2e7c6';c.font='600 24px Georgia';c.textAlign='center';c.fillText(def.name,192,42);c.fillStyle='#cbbd91';c.font='16px Georgia';c.fillText(def.role.toUpperCase(),192,66);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(3.6,.9,1);sprite.position.set(0,2.35,0);sprite.renderOrder=20;return sprite;
}
function tintMaterial(material:T.Material,tint:T.Color,look?:NpcLook){const m=material.clone() as T.MeshStandardMaterial;if('color' in m&&m.color instanceof T.Color){const name=m.name||'';if(/CostumeWool|Cloth|Tunic|Shirt|Pants|Cape|Robe/i.test(name))m.color.copy(tint).lerp(new T.Color('#d8c8a7'),.2);else if(/CostumeLeather|Leather|Boot|Belt|Glove/i.test(name))m.color.copy(tint).multiplyScalar(.62);else if(/Hair/i.test(name)&&look)m.color.set(look.hair);else if(/Superhero|Regular_Male|Skin|Body/i.test(name)&&look)m.color.set(look.skin);else if(!m.map&&m.color.getHex()===0xffffff)m.color.copy(tint).lerp(new T.Color('#d7c8ab'),.55);}if('roughness' in m)m.roughness=Math.max(.78,m.roughness??.8);return m;}
/** Preserve singular-vs-array material shape. Converting a single material into an array makes ungrouped skinned geometry render nothing. */
export function prepareNpcMaterials(root:T.Object3D,color:string,look?:NpcLook){const tint=new T.Color(color);root.traverse(o=>{if(/Hood/i.test(o.name))o.visible=look?.hood??o.visible;if(/Hair_Simple/i.test(o.name)&&look)o.visible=!look.hood;if(!(o instanceof T.Mesh))return;o.visible=o.visible!==false;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;if(Array.isArray(o.material))o.material=o.material.map(mat=>tintMaterial(mat,tint,look));else o.material=tintMaterial(o.material,tint,look);});return root;}

export class NpcPopulation {
 root=new T.Group();runtimes:NpcRuntime[]=[];private lastTime=0;
 constructor(private scene:T.Scene|T.Group,private assets:Assets,public readonly state:WorldState){this.root.name='Alderbrook townsfolk · adult survivor rig';scene.add(this.root);const survivorIdle=this.assets.survivor.animations.find(a=>/idle/i.test(a.name)),survivorWalk=this.assets.survivor.animations.find(a=>/walk/i.test(a.name));for(const def of NPC_ROSTER){const human=prepareNpcMaterials(assets.human(),def.tint,def.look);const group=new T.Group();group.name=`NPC ${def.name} · ${def.role}`;group.add(human);const tag=label(def);if(tag)group.add(tag);group.position.set(def.x,height(def.x,def.z)+.02,def.z);group.scale.setScalar(.94+(def.phase%3)*.018);this.root.add(group);const mixer=new T.AnimationMixer(human),idle=survivorIdle?mixer.clipAction(survivorIdle):undefined,walk=survivorWalk?mixer.clipAction(survivorWalk):undefined;(walk??idle)?.play();this.runtimes.push({definition:def,group,visual:human,mixer,idle,walk,lastX:def.x,lastZ:def.z});}}
 update(time:number){const dt=this.lastTime?Math.min(.08,time-this.lastTime):.016;this.lastTime=time;for(const npc of this.runtimes){const d=npc.definition,slow=.11+(d.phase%4)*.012,x=d.x+Math.sin(time*slow+d.phase)*d.radius,z=d.z+Math.sin(time*slow*.73+d.phase*1.7)*d.radius*.62,y=height(x,z)+.02,dx=x-npc.lastX,dz=z-npc.lastZ,speed=Math.hypot(dx,dz)/Math.max(dt,.001);npc.group.position.set(x,y,z);if(speed>.02)npc.group.rotation.y=Math.atan2(dx,dz);npc.mixer?.update(dt);if(npc.walk&&npc.idle&&npc.walk!==npc.idle){if(speed>.06&&!npc.walk.isRunning()){npc.idle.fadeOut(.2);npc.walk.reset().fadeIn(.2).play();}else if(speed<=.06&&!npc.idle.isRunning()){npc.walk.fadeOut(.2);npc.idle.reset().fadeIn(.2).play();}}npc.lastX=x;npc.lastZ=z;}updateNpcSocial(this.runtimes,this.state,time);}
 nearest(position:Vec3,radius=2.8){let best:NpcRuntime|undefined,bestD=radius;for(const npc of this.runtimes){const d=Math.hypot(position[0]-npc.group.position.x,position[2]-npc.group.position.z);if(d<bestD){best=npc;bestD=d;}}return best;}
 /** Existing E-interaction path calls line(); make that old path open the full conversation panel without duplicating input ownership. */
 line(npc:NpcRuntime,tick:number){openNpcConversation(npc,this);const lines=npc.definition.lines;return lines[Math.abs(Math.floor(tick/180+npc.definition.phase*3))%lines.length];}
 dispose(){this.root.removeFromParent();for(const npc of this.runtimes)npc.mixer?.stopAllAction();this.runtimes=[];}
}

let active:NpcPopulation|undefined;
export function setActiveNpcPopulation(population:NpcPopulation|undefined){active=population;}
export function activeNpcPopulation(){return active;}
installMarketConversationHook(()=>active);
