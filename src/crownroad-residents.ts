import * as T from 'three';
import type {Assets} from './assets';
import {prepareNpcMaterials} from './npcs';
import {PopulationBubble,ensureRealmPopulation,promoteCitizen,type CitizenDescriptor} from './realm-population';
import {HOUSEHOLDS_PER_SHARD,describeHousehold,type SocialFaction} from './realm-society';
import {worldInt} from './world-address';
import {CROWNROAD_CELL,CROWNROAD_POIS,crownroadWardForPosition} from './crownroad-world';
import {applyRealmConsequences,districtTrustForActor,householdTrustForActor} from './realm-consequences';
import {promoteCanonicalEvent} from './provenance-frontier';
import type {PlayerState,Vec3,WorldState} from './state';

export const CROWNROAD_RESIDENT_CAP=18;
const FIRST_NAMES=['Alda','Beorn','Cerys','Dain','Edric','Fenna','Garran','Hesta','Iven','Jora','Kelda','Leof','Maren','Noll','Orla','Perrin','Runa','Sella','Torren','Una','Varric','Willa','Yorren','Zella','Bran','Cora','Edda','Harlan','Mira','Nessa','Orren','Tilda','Wren','Ysra'] as const;
const CLOTH=['#544b3d','#4b5947','#5a493f','#3d5054','#665641','#4b445c','#6a5847','#405148'] as const;
const ROLE:Record<CitizenDescriptor['phase'],string>={farmer:'Farmer',miner:'Miner',guard:'Road Warden',trader:'Trader',artisan:'Artisan',laborer:'Laborer',injured:'Convalescent',displaced:'Wayfarer'};

export interface CrownroadResidentDescriptor{
 citizen:CitizenDescriptor;
 householdOrdinal:number;
 householdName:string;
 faction:SocialFaction;
 name:string;
 role:string;
 ward:number;
 x:number;
 z:number;
 tint:string;
}
export interface CrownroadResidentRuntime{descriptor:CrownroadResidentDescriptor;group:T.Group;mixer?:T.AnimationMixer;idle?:T.AnimationAction;walk?:T.AnimationAction;baseX:number;baseZ:number;phase:number;lastX:number;lastZ:number}

function cellForPosition(x:number,z:number){return {x:Math.floor(x/CROWNROAD_CELL),z:Math.floor(z/CROWNROAD_CELL)};}
function nearestPoi(x:number,z:number){let best:typeof CROWNROAD_POIS[number]|undefined,d=Infinity;for(const poi of CROWNROAD_POIS){const px=poi.cell.x*CROWNROAD_CELL,pz=poi.cell.z*CROWNROAD_CELL,next=Math.hypot(x-px,z-pz);if(next<d){best=poi;d=next;}}return d<78?best:undefined;}
function targetCount(x:number,z:number){const poi=nearestPoi(x,z);if(!poi)return 4;if(poi.kind==='city')return 18;if(poi.kind==='market')return 12;if(poi.kind==='village')return 10;if(poi.kind==='fort')return 8;if(poi.kind==='abbey')return 7;if(poi.kind==='crossing')return 6;return 3;}
export function representativeHouseholdOrdinal(world:WorldState,ward:number,key:string){const local=worldInt({realmSeed:world.worldSeed??197709,areaId:'crownroad-household-contact',cellX:ward,cellZ:0,slot:0,tag:key},HOUSEHOLDS_PER_SHARD);return ward*HOUSEHOLDS_PER_SHARD+local;}
export function crownroadResidentDescriptors(world:WorldState,x:number,z:number,cap=CROWNROAD_RESIDENT_CAP):CrownroadResidentDescriptor[]{
 const population=ensureRealmPopulation(world),seed=world.worldSeed??197709,ward=crownroadWardForPosition(x,z),cell=cellForPosition(x,z),focus=((cell.x+32)<<10)^(cell.z+32),bubble=new PopulationBubble(Math.max(1,Math.min(cap,CROWNROAD_RESIDENT_CAP))),citizens=bubble.update(population,seed,ward,focus).slice(0,targetCount(x,z)),poi=nearestPoi(x,z),anchorX=poi?poi.cell.x*CROWNROAD_CELL:cell.x*CROWNROAD_CELL+CROWNROAD_CELL/2,anchorZ=poi?poi.cell.z*CROWNROAD_CELL:cell.z*CROWNROAD_CELL+CROWNROAD_CELL/2;
 return citizens.map((citizen,i)=>{const householdOrdinal=Math.floor(citizen.ordinal/4),household=describeHousehold(population,seed,householdOrdinal),bits=citizen.identityBits,first=FIRST_NAMES[bits%FIRST_NAMES.length],surname=household.name.replace(/^House /,''),angle=((bits>>>5)%628)/100,radius=5+((bits>>>14)%120)/10+(i%3)*1.7,x0=anchorX+Math.cos(angle)*radius,z0=anchorZ+Math.sin(angle)*radius;return {citizen,householdOrdinal,householdName:household.name,faction:household.faction,name:`${first} ${surname}`,role:ROLE[citizen.phase],ward,x:x0,z:z0,tint:CLOTH[(bits>>>2)%CLOTH.length]};});
}
function label(def:CrownroadResidentDescriptor){if(typeof document==='undefined')return undefined;const canvas=document.createElement('canvas');canvas.width=384;canvas.height=96;const c=canvas.getContext('2d');if(!c)return undefined;c.fillStyle='rgba(10,14,12,.7)';c.fillRect(18,12,348,68);c.strokeStyle='rgba(213,184,113,.55)';c.strokeRect(18.5,12.5,347,67);c.fillStyle='#f2e7c6';c.font='600 22px Georgia';c.textAlign='center';c.fillText(def.name,192,41);c.fillStyle='#cbbd91';c.font='15px Georgia';c.fillText(`${def.role.toUpperCase()} · ${def.householdName.toUpperCase()}`,192,66);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(4,.95,1);sprite.position.set(0,2.35,0);sprite.renderOrder=20;return sprite;}
function look(bits:number){const hair=['#231913','#4b3222','#6a4d32','#8b765d','#171412'][bits%5],skin=['#b77e5d','#c98f69','#d1a17e','#a97052','#d7ad8d'][(bits>>>4)%5];return {hair,skin,hood:((bits>>>9)&3)===0};}
function disposeResidentVisual(group:T.Group){group.traverse(o=>{if(o instanceof T.Mesh){const materials=Array.isArray(o.material)?o.material:[o.material];for(const material of materials)material.dispose();}else if(o instanceof T.Sprite){const material=o.material;if(material.map)material.map.dispose();material.dispose();}});}

export class CrownroadResidentPopulation{
 readonly root=new T.Group();readonly runtimes:CrownroadResidentRuntime[]=[];private key='';private lastTime=0;
 constructor(parent:T.Group,private assets:Assets,public world:WorldState){this.root.name='Crownroad bounded resident bubble';parent.add(this.root);}
 refresh(x:number,z:number){const cell=cellForPosition(x,z),ward=crownroadWardForPosition(x,z),key=`${cell.x},${cell.z}:${ward}`;if(key===this.key)return;this.key=key;this.clear();const idleClip=this.assets.survivor.animations.find(a=>/idle/i.test(a.name)),walkClip=this.assets.survivor.animations.find(a=>/walk/i.test(a.name));for(const def of crownroadResidentDescriptors(this.world,x,z)){const human=prepareNpcMaterials(this.assets.human(),def.tint,look(def.citizen.identityBits)),group=new T.Group();group.name=`Realm resident ${def.citizen.id} · ${def.name}`;group.add(human);const tag=label(def);if(tag)group.add(tag);group.position.set(def.x,.02,def.z);group.scale.setScalar(.92+((def.citizen.identityBits>>>11)%7)*.012);this.root.add(group);const mixer=new T.AnimationMixer(human),idle=idleClip?mixer.clipAction(idleClip):undefined,walk=walkClip?mixer.clipAction(walkClip):undefined;(walk??idle)?.play();this.runtimes.push({descriptor:def,group,mixer,idle,walk,baseX:def.x,baseZ:def.z,phase:(def.citizen.identityBits%628)/100,lastX:def.x,lastZ:def.z});}}
 update(time:number){const dt=this.lastTime?Math.min(.08,time-this.lastTime):.016;this.lastTime=time;for(const r of this.runtimes){const radius=.8+(r.descriptor.citizen.identityBits%18)/10,speed=.12+((r.descriptor.citizen.identityBits>>>7)%8)/100,x=r.baseX+Math.sin(time*speed+r.phase)*radius,z=r.baseZ+Math.sin(time*speed*.73+r.phase*1.7)*radius*.6,dx=x-r.lastX,dz=z-r.lastZ,motion=Math.hypot(dx,dz)/Math.max(dt,.001);r.group.position.set(x,.02,z);if(motion>.02)r.group.rotation.y=Math.atan2(dx,dz);r.mixer?.update(dt);if(r.walk&&r.idle&&r.walk!==r.idle){if(motion>.05&&!r.walk.isRunning()){r.idle.fadeOut(.2);r.walk.reset().fadeIn(.2).play();}else if(motion<=.05&&!r.idle.isRunning()){r.walk.fadeOut(.2);r.idle.reset().fadeIn(.2).play();}}r.lastX=x;r.lastZ=z;}}
 nearest(position:Vec3,radius=2.9){let best:CrownroadResidentRuntime|undefined,d=radius;for(const r of this.runtimes){const next=Math.hypot(position[0]-r.group.position.x,position[2]-r.group.position.z);if(next<d){best=r;d=next;}}return best;}
 meet(runtime:CrownroadResidentRuntime,player:PlayerState){const population=ensureRealmPopulation(this.world),d=runtime.descriptor;promoteCitizen(population,this.world.worldSeed??197709,d.citizen.ordinal,`met-by:${player.id}`);promoteCanonicalEvent(this.world,{source:'player',actorId:player.id,actorName:player.name,ward:d.ward,channel:'kin',externalKey:`meet:${player.id}:${d.citizen.id}`,subjects:[d.citizen.id,`house:${d.householdOrdinal}`],summary:`${player.name} met ${d.name} of ${d.householdName} on the Crownroad. Their household now has an exact memory edge to that encounter.`});applyRealmConsequences(this.world);const district=districtTrustForActor(this.world,player.id,d.ward),house=householdTrustForActor(this.world,d.householdOrdinal,player.id),trust=district+house;if(trust>=4)return `${d.name}: “Your name reached us before you did. ${d.householdName} remembers the stories.”`;if(trust>=1)return `${d.name}: “I have heard your name on the road. ${d.householdName} will hear that you came through.”`;if(trust<=-1)return `${d.name}: “I know the name. That is not the same thing as welcome.”`;return `${d.name}: “A stranger on the Crownroad, then. I am ${d.name}, of ${d.householdName}.”`;}
 private clear(){for(const r of this.runtimes){r.mixer?.stopAllAction();disposeResidentVisual(r.group);}this.runtimes.length=0;this.root.clear();}
 dispose(){this.clear();this.root.removeFromParent();}
}
