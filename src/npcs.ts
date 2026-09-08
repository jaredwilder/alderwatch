import * as T from 'three';
import type {Assets} from './assets';
import type {WorldState,Vec3} from './state';
import {height} from './terrain';

export type NpcRole='Trader'|'Fletcher'|'Beekeeper'|'Cook'|'Carpenter'|'Hunter'|'Guard'|'Dairy Visionary'|'Drifter';
export interface NpcDefinition {id:string;name:string;role:NpcRole;x:number;z:number;radius:number;phase:number;tint:string;lines:readonly string[]}
export interface NpcRuntime {definition:NpcDefinition;group:T.Group;mixer?:T.AnimationMixer;idle?:T.AnimationAction;walk?:T.AnimationAction;lastX:number;lastZ:number}

export const NPC_ROSTER:readonly NpcDefinition[]=[
 {id:'mara',name:'Mara Pennymarch',role:'Trader',x:-6,z:-28,radius:1.1,phase:.2,tint:'#8b5b3d',lines:['If it fits on the scale, I can probably sell it.','Crow crop is not currency. Stop asking.','The market price of stew is whatever I say it is.']},
 {id:'wulfric',name:'Old Wulfric',role:'Fletcher',x:-11,z:-34,radius:2.1,phase:1.1,tint:'#435b3d',lines:['Feathers straight. Shaft straight. Hunter less so.','A good bow is mostly patience with string attached.']},
 {id:'elske',name:'Elske Honeyhand',role:'Beekeeper',x:2,z:-35,radius:1.8,phase:2.2,tint:'#78663c',lines:['The bees know your karma. I refuse to elaborate.','Smoke first. Honey second. Running third.']},
 {id:'pell',name:'Brother Pell',role:'Cook',x:8,z:-39,radius:1.6,phase:3.1,tint:'#6b4539',lines:['Stew forgives many mistakes. Crow milk is not one of them.','If it stops moving, I can probably season it.']},
 {id:'sigrid',name:'Sigrid Cartwright',role:'Carpenter',x:-13,z:-50,radius:2.4,phase:4.3,tint:'#5a4c35',lines:['That beam is crooked. I can feel it from here.','A house is just a camp that won an argument.']},
 {id:'tomas',name:'Tomas Crowmilk',role:'Dairy Visionary',x:7,z:-55,radius:1.3,phase:5.2,tint:'#725c48',lines:['They laughed at the first cow too. Probably.','One crop. One herb. One dream.','Do not ask where the bucket went.']},
 {id:'ylva',name:'Ylva Ash-Eye',role:'Hunter',x:14,z:-63,radius:2.5,phase:.8,tint:'#3e5140',lines:['Wolves move different when they have chosen something.','If the crows go quiet, look up.']},
 {id:'gate-guard',name:'Rurik Vale',role:'Guard',x:5,z:3,radius:1.4,phase:2.7,tint:'#4f4a45',lines:['Road is open. Wilderness is not.','If an eagle drops a sheep on you, that is outside my jurisdiction.']},
 {id:'moss',name:'Moss',role:'Drifter',x:-5,z:-69,radius:3.0,phase:4.9,tint:'#514e3e',lines:['Saw a wolf watch a bison watch me. Left immediately.','I used to have a plan. Then the March got interesting.']},
];

function label(def:NpcDefinition){
 if(typeof document==='undefined')return undefined;const canvas=document.createElement('canvas');canvas.width=384;canvas.height=96;const c=canvas.getContext('2d');if(!c)return undefined;c.fillStyle='rgba(10,14,12,.72)';c.fillRect(18,12,348,68);c.strokeStyle='rgba(213,184,113,.62)';c.strokeRect(18.5,12.5,347,67);c.fillStyle='#f2e7c6';c.font='600 24px Georgia';c.textAlign='center';c.fillText(def.name,192,42);c.fillStyle='#cbbd91';c.font='16px Georgia';c.fillText(def.role.toUpperCase(),192,66);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(3.6,.9,1);sprite.position.set(0,2.35,0);sprite.renderOrder=20;return sprite;
}
function tintHuman(root:T.Object3D,color:string){const tint=new T.Color(color);root.traverse(o=>{if(!(o instanceof T.Mesh))return;const mats=(Array.isArray(o.material)?o.material:[o.material]);o.material=mats.map(mat=>{const m=mat.clone() as T.MeshStandardMaterial;if(/Costume|Wool|Leather|Cloth/i.test(m.name)){m.color.multiply(tint).lerp(new T.Color('#ffffff'),.55);m.roughness=Math.max(.8,m.roughness??.8);}return m;}) as any;});}
function clipByName(assets:Assets,name:string){return assets.survivor.animations.find(a=>a.name.toLowerCase()===name)||assets.survivor.animations.find(a=>a.name.toLowerCase().includes(name));}

export class NpcPopulation {
 root=new T.Group();runtimes:NpcRuntime[]=[];private lastTime=0;
 constructor(private scene:T.Scene|T.Group,private assets:Assets,private state:WorldState){this.root.name='Alderbrook townsfolk';scene.add(this.root);const idleClip=clipByName(assets,'idle'),walkClip=clipByName(assets,'walk');for(const def of NPC_ROSTER){const human=assets.human();tintHuman(human,def.tint);const group=new T.Group();group.name=`NPC ${def.name} · ${def.role}`;group.add(human);const tag=label(def);if(tag)group.add(tag);group.position.set(def.x,height(def.x,def.z)+.02,def.z);group.scale.setScalar(.96+(def.phase%3)*.015);this.root.add(group);const mixer=new T.AnimationMixer(human),idle=idleClip?mixer.clipAction(idleClip):undefined,walk=walkClip?mixer.clipAction(walkClip):undefined;(walk??idle)?.play();this.runtimes.push({definition:def,group,mixer,idle,walk,lastX:def.x,lastZ:def.z});}}
 update(time:number){const dt=this.lastTime?Math.min(.08,time-this.lastTime):.016;this.lastTime=time;for(const npc of this.runtimes){const d=npc.definition,slow=.11+(d.phase%4)*.012,x=d.x+Math.sin(time*slow+d.phase)*d.radius,z=d.z+Math.sin(time*slow*.73+d.phase*1.7)*d.radius*.62,y=height(x,z)+.02,dx=x-npc.lastX,dz=z-npc.lastZ,speed=Math.hypot(dx,dz)/Math.max(dt,.001);npc.group.position.set(x,y,z);if(speed>.02)npc.group.rotation.y=Math.atan2(dx,dz);npc.mixer?.update(dt);if(npc.walk&&npc.idle){if(speed>.06&&!npc.walk.isRunning()){npc.idle.fadeOut(.2);npc.walk.reset().fadeIn(.2).play();}else if(speed<=.06&&!npc.idle.isRunning()){npc.walk.fadeOut(.2);npc.idle.reset().fadeIn(.2).play();}}npc.lastX=x;npc.lastZ=z;}}
 nearest(position:Vec3,radius=2.8){let best:NpcRuntime|undefined,bestD=radius;for(const npc of this.runtimes){const d=Math.hypot(position[0]-npc.group.position.x,position[2]-npc.group.position.z);if(d<bestD){best=npc;bestD=d;}}return best;}
 line(npc:NpcRuntime,tick:number){const lines=npc.definition.lines;return lines[Math.abs(Math.floor(tick/180+npc.definition.phase*3))%lines.length];}
 dispose(){this.root.removeFromParent();for(const npc of this.runtimes)npc.mixer?.stopAllAction();this.runtimes=[];}
}

let active:NpcPopulation|undefined;
export function setActiveNpcPopulation(population:NpcPopulation|undefined){active=population;}
export function activeNpcPopulation(){return active;}
