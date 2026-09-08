import * as T from 'three';
import {GLTFLoader,type GLTF} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import type {Assets} from './assets';
import type {WorldState,Vec3} from './state';
import {height} from './terrain';

export type NpcRole='Trader'|'Fletcher'|'Beekeeper'|'Cook'|'Carpenter'|'Hunter'|'Guard'|'Dairy Visionary'|'Drifter';
export type NpcSkin='Barbarian'|'Knight'|'Mage'|'Rogue';
export interface NpcDefinition {id:string;name:string;role:NpcRole;x:number;z:number;radius:number;phase:number;tint:string;skin?:NpcSkin;lines:readonly string[]}
export interface NpcRuntime {definition:NpcDefinition;group:T.Group;visual:T.Object3D;mixer?:T.AnimationMixer;idle?:T.AnimationAction;walk?:T.AnimationAction;lastX:number;lastZ:number}

export const NPC_ROSTER:readonly NpcDefinition[]=[
 {id:'mara',name:'Mara Pennymarch',role:'Trader',x:-6,z:-28,radius:1.1,phase:.2,tint:'#8b5b3d',skin:'Rogue',lines:['If it fits on the scale, I can probably sell it.','Crow crop is not currency. Stop asking.','The market price of stew is whatever I say it is.']},
 {id:'wulfric',name:'Old Wulfric',role:'Fletcher',x:-11,z:-34,radius:2.1,phase:1.1,tint:'#435b3d',skin:'Rogue',lines:['Feathers straight. Shaft straight. Hunter less so.','A good bow is mostly patience with string attached.']},
 {id:'elske',name:'Elske Honeyhand',role:'Beekeeper',x:2,z:-35,radius:1.8,phase:2.2,tint:'#78663c',skin:'Mage',lines:['The bees know your karma. I refuse to elaborate.','Smoke first. Honey second. Running third.']},
 {id:'pell',name:'Brother Pell',role:'Cook',x:8,z:-39,radius:1.6,phase:3.1,tint:'#6b4539',skin:'Barbarian',lines:['Stew forgives many mistakes. Crow milk is not one of them.','If it stops moving, I can probably season it.']},
 {id:'sigrid',name:'Sigrid Cartwright',role:'Carpenter',x:-13,z:-50,radius:2.4,phase:4.3,tint:'#5a4c35',skin:'Barbarian',lines:['That beam is crooked. I can feel it from here.','A house is just a camp that won an argument.']},
 {id:'tomas',name:'Tomas Crowmilk',role:'Dairy Visionary',x:7,z:-55,radius:1.3,phase:5.2,tint:'#725c48',skin:'Mage',lines:['They laughed at the first cow too. Probably.','One crop. One herb. One dream.','Do not ask where the bucket went.']},
 {id:'ylva',name:'Ylva Ash-Eye',role:'Hunter',x:14,z:-63,radius:2.5,phase:.8,tint:'#3e5140',skin:'Rogue',lines:['Wolves move different when they have chosen something.','If the crows go quiet, look up.']},
 {id:'gate-guard',name:'Rurik Vale',role:'Guard',x:5,z:3,radius:1.4,phase:2.7,tint:'#4f4a45',skin:'Knight',lines:['Road is open. Wilderness is not.','If an eagle drops a sheep on you, that is outside my jurisdiction.']},
 {id:'moss',name:'Moss',role:'Drifter',x:-5,z:-69,radius:3.0,phase:4.9,tint:'#514e3e',skin:'Rogue',lines:['Saw a wolf watch a bison watch me. Left immediately.','I used to have a plan. Then the March got interesting.']},
];

const npcLoader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),skinCache=new Map<NpcSkin,Promise<GLTF>>();
function skinAsset(name:NpcSkin){let request=skinCache.get(name);if(!request){request=npcLoader.loadAsync(`/assets/characters/${name}.glb`);skinCache.set(name,request);}return request;}
function label(def:NpcDefinition){
 if(typeof document==='undefined')return undefined;const canvas=document.createElement('canvas');canvas.width=384;canvas.height=96;const c=canvas.getContext('2d');if(!c)return undefined;c.fillStyle='rgba(10,14,12,.72)';c.fillRect(18,12,348,68);c.strokeStyle='rgba(213,184,113,.62)';c.strokeRect(18.5,12.5,347,67);c.fillStyle='#f2e7c6';c.font='600 24px Georgia';c.textAlign='center';c.fillText(def.name,192,42);c.fillStyle='#cbbd91';c.font='16px Georgia';c.fillText(def.role.toUpperCase(),192,66);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(3.6,.9,1);sprite.position.set(0,2.35,0);sprite.renderOrder=20;return sprite;
}
function tintMaterial(material:T.Material,tint:T.Color){const m=material.clone() as T.MeshStandardMaterial;if('color' in m&&m.color instanceof T.Color){const clothing=/Costume|Wool|Leather|Cloth|Tunic|Shirt|Pants|Cape|Robe/i.test(m.name);if(clothing&&!m.map)m.color.multiply(tint).lerp(new T.Color('#ffffff'),.38);if(!m.map&&m.color.getHex()===0xffffff)m.color.copy(tint).lerp(new T.Color('#d7c8ab'),.55);}if('roughness' in m)m.roughness=Math.max(.72,m.roughness??.8);return m;}
/** Preserve singular-vs-array material shape. Converting a single material into an array makes ungrouped skinned geometry render nothing. */
export function prepareNpcMaterials(root:T.Object3D,color:string){const tint=new T.Color(color);root.traverse(o=>{if(!(o instanceof T.Mesh))return;o.visible=true;o.castShadow=o.receiveShadow=true;o.frustumCulled=false;if(Array.isArray(o.material))o.material=o.material.map(mat=>tintMaterial(mat,tint));else o.material=tintMaterial(o.material,tint);});return root;}
function normalizeNpc(root:T.Object3D){root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3()),scale=1.78/Math.max(size.y,.01);root.scale.multiplyScalar(scale);root.updateMatrixWorld(true);const grounded=new T.Box3().setFromObject(root);root.position.y-=grounded.min.y;root.updateMatrixWorld(true);return root;}
function clips(animations:T.AnimationClip[]){const find=(rx:RegExp)=>animations.find(a=>rx.test(a.name));return {idle:find(/idle|stand/i)??animations[0],walk:find(/walk|run|move/i)??find(/idle|stand/i)??animations[0]};}

export class NpcPopulation {
 root=new T.Group();runtimes:NpcRuntime[]=[];private lastTime=0;
 constructor(private scene:T.Scene|T.Group,private assets:Assets,private state:WorldState){this.root.name='Alderbrook townsfolk';scene.add(this.root);const survivorIdle=this.assets.survivor.animations.find(a=>/idle/i.test(a.name)),survivorWalk=this.assets.survivor.animations.find(a=>/walk/i.test(a.name));for(const def of NPC_ROSTER){const human=prepareNpcMaterials(assets.human(),def.tint);const group=new T.Group();group.name=`NPC ${def.name} · ${def.role}`;group.add(human);const tag=label(def);if(tag)group.add(tag);group.position.set(def.x,height(def.x,def.z)+.02,def.z);group.scale.setScalar(.96+(def.phase%3)*.015);this.root.add(group);const mixer=new T.AnimationMixer(human),idle=survivorIdle?mixer.clipAction(survivorIdle):undefined,walk=survivorWalk?mixer.clipAction(survivorWalk):undefined;(walk??idle)?.play();const runtime:NpcRuntime={definition:def,group,visual:human,mixer,idle,walk,lastX:def.x,lastZ:def.z};this.runtimes.push(runtime);if(def.skin)void this.upgradeSkin(runtime,def.skin);}}
 private async upgradeSkin(runtime:NpcRuntime,skin:NpcSkin){try{const gltf=await skinAsset(skin);if(!runtime.group.parent)return;const visual=prepareNpcMaterials(normalizeNpc(clone(gltf.scene)),runtime.definition.tint);runtime.mixer?.stopAllAction();runtime.group.remove(runtime.visual);runtime.visual=visual;runtime.group.add(visual);const c=clips(gltf.animations);runtime.mixer=gltf.animations.length?new T.AnimationMixer(visual):undefined;runtime.idle=runtime.mixer&&c.idle?runtime.mixer.clipAction(c.idle):undefined;runtime.walk=runtime.mixer&&c.walk?runtime.mixer.clipAction(c.walk):undefined;(runtime.walk??runtime.idle)?.play();}catch(error){console.warn(`CC0 NPC skin ${skin} failed; keeping visible survivor fallback for ${runtime.definition.name}.`,error);}}
 update(time:number){const dt=this.lastTime?Math.min(.08,time-this.lastTime):.016;this.lastTime=time;for(const npc of this.runtimes){const d=npc.definition,slow=.11+(d.phase%4)*.012,x=d.x+Math.sin(time*slow+d.phase)*d.radius,z=d.z+Math.sin(time*slow*.73+d.phase*1.7)*d.radius*.62,y=height(x,z)+.02,dx=x-npc.lastX,dz=z-npc.lastZ,speed=Math.hypot(dx,dz)/Math.max(dt,.001);npc.group.position.set(x,y,z);if(speed>.02)npc.group.rotation.y=Math.atan2(dx,dz);npc.mixer?.update(dt);if(npc.walk&&npc.idle&&npc.walk!==npc.idle){if(speed>.06&&!npc.walk.isRunning()){npc.idle.fadeOut(.2);npc.walk.reset().fadeIn(.2).play();}else if(speed<=.06&&!npc.idle.isRunning()){npc.walk.fadeOut(.2);npc.idle.reset().fadeIn(.2).play();}}npc.lastX=x;npc.lastZ=z;}}
 nearest(position:Vec3,radius=2.8){let best:NpcRuntime|undefined,bestD=radius;for(const npc of this.runtimes){const d=Math.hypot(position[0]-npc.group.position.x,position[2]-npc.group.position.z);if(d<bestD){best=npc;bestD=d;}}return best;}
 line(npc:NpcRuntime,tick:number){const lines=npc.definition.lines;return lines[Math.abs(Math.floor(tick/180+npc.definition.phase*3))%lines.length];}
 dispose(){this.root.removeFromParent();for(const npc of this.runtimes)npc.mixer?.stopAllAction();this.runtimes=[];}
}

let active:NpcPopulation|undefined;
export function setActiveNpcPopulation(population:NpcPopulation|undefined){active=population;}
export function activeNpcPopulation(){return active;}
