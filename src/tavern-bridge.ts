import type * as T from 'three';
import type {Assets} from './assets';
import {Character} from './character';
import {stats} from './definitions';
import type {Vec3} from './state';
import {AlderbrookTavern,type TavernInteraction} from './alderbrook-tavern';
import {MAX_INTOXICATION as INTOXICATION_CAP} from './tavern-rules';

export interface TavernEntity{id:string;name:string;role:string;position:Vec3;yaw:number;greeting:string;hair:string;cloth:string}
let currentCharacter:Character|undefined;
let activeTavern:AlderbrookTavern|undefined;
let activeBridge:TavernBridge|undefined;
let patchInstalled=false;

// Live visual acceptance showed that a narrow rectangle around two inferred cottage
// door points is the wrong contract. The player approaches the visible sign/frontage,
// not a coordinate spreadsheet. This radius covers the sign, both authored doorway
// variants and the small front yard while remaining tightly local to one building.
const ENTRY={x:-10.4,z:-27.8,radius:6.5};
const DISTRICT_CENTER:[number,number]=[-9.3,-29.4];
const DISCOVERY_RADIUS=180;
const PREWARM_RADIUS=220;
const atTavernEntry=(position:Vec3)=>Math.hypot(position[0]-ENTRY.x,position[2]-ENTRY.z)<=ENTRY.radius;
const nearTavern=(position:Vec3,radius=DISCOVERY_RADIUS)=>Math.hypot(position[0]-DISTRICT_CENTER[0],position[2]-DISTRICT_CENTER[1])<=radius;

const entity=(id:string,name:string,role:string,position:Vec3,greeting=''):TavernEntity=>({id,name,role,position:[...position],yaw:0,greeting,hair:'#4b3527',cloth:'#66503e'});
function relocate(character:Character,position:Vec3,yaw:number){
 character.velocity.set(0,0,0);character.vertical=0;character.locked=0;character.root.position.fromArray(position);character.root.rotation.y=yaw;
 character.body.setTranslation({x:position[0],y:position[1]+.9,z:position[2]},true);character.body.setNextKinematicTranslation({x:position[0],y:position[1]+.9,z:position[2]});
 character.state.position=[...position];character.state.yaw=yaw;
}
function installCharacterPatch(){
 if(patchInstalled)return;patchInstalled=true;
 const post=Character.prototype.postStep,pre=Character.prototype.preStep,customize=Character.prototype.customize;
 // Character construction calls customize before Village/TavernBridge are created.
 // Capture there so entry never depends on waiting for a later physics tick.
 Character.prototype.customize=function(){currentCharacter=this;return customize.call(this);};
 Character.prototype.postStep=function(dt:number){post.call(this,dt);currentCharacter=this;if(activeTavern?.inside){const safe=activeTavern.safeSavePosition();if(safe){this.state.position=[...safe.position];this.state.yaw=safe.yaw;}}};
 Character.prototype.preStep=function(...args:Parameters<Character['preStep']>){
  currentCharacter=this;
  if(activeTavern?.inside){
   this.moveSpeed=activeTavern.movementScale();
   const input=args[1] as Parameters<Character['preStep']>[1]&{pressed?:Set<string>;primary?:boolean;secondary?:boolean;keys?:Set<string>};
   input.pressed?.delete('Attack');input.pressed?.delete('KeyF');input.primary=false;input.secondary=false;input.keys?.delete('Space');
  }else this.moveSpeed=1;
  return pre.apply(this,args);
 };
}
installCharacterPatch();

function physicalPosition(fallback:Vec3){return currentCharacter?currentCharacter.root.position.toArray() as Vec3:fallback;}
function interactionEntity(action:TavernInteraction,position:Vec3):TavernEntity{
 if(action.kind==='enter')return entity('tavern:enter','The Tipsy Alder','Enter tavern',position,'Warm light leaks around the old oak door.');
 if(action.kind==='exit')return entity('tavern:exit','Front Door','Leave tavern',position);
 if(action.kind==='bartender')return entity('tavern:brinna','Brinna Keggs','Proprietor',position,'Drink first. Confess later.');
 if(action.kind==='bones')return entity('tavern:bones','Alderbones Table','House game',position);
 if(action.kind==='pipe')return entity('tavern:pipe','House Pipe','Pipe nook',position);
 return entity(`tavern:patron:${action.id}`,action.id==='pell'?'Pell “Three Mugs” Dorr':action.id==='sella'?'Sella Reed':'Jorren Pike','Regular',position);
}
function clearOutdoorNoise(){document.querySelector('#toast')?.remove();document.querySelector('.world-boss-entry')?.remove();}
function setTavernPresentationActive(active:boolean){
 if(typeof document==='undefined')return;
 if(active)document.documentElement.dataset.awInterior='tavern';
 else delete document.documentElement.dataset.awInterior;
}
function enterNow(tavern:AlderbrookTavern,character:Character){
 clearOutdoorNoise();const to=tavern.enter();setTavernPresentationActive(true);relocate(character,to.position,to.yaw);return true;
}
function leaveNow(tavern:AlderbrookTavern,character:Character){
 const to=tavern.leave();setTavernPresentationActive(false);relocate(character,to.position,to.yaw);document.querySelector('.tavern-atmosphere')?.remove();return true;
}

export class TavernBridge{
 private tavern?:AlderbrookTavern;private target?:TavernEntity;private hudQueued=false;private atmosphere?:HTMLDivElement;private atmosphereOpacity=-1;private lastPosition:Vec3=[0,0,0];private warmupQueued=false;
 constructor(private root:T.Group,private assets:Assets){activeBridge=this;}
 get inside(){return !!this.tavern?.inside;}
 private construct(position:Vec3){
  if(this.tavern)return this.tavern;
  const character=currentCharacter;if(!character)return undefined;
  this.lastPosition=[...position];
  this.tavern=new AlderbrookTavern(this.root,this.assets,character.physics);activeTavern=this.tavern;return this.tavern;
 }
 private ensure(position:Vec3){
  if(this.tavern)return this.tavern;
  if(!nearTavern(position,PREWARM_RADIUS))return undefined;
  if(atTavernEntry(position)||nearTavern(position,DISCOVERY_RADIUS))return this.construct(position);
  if(!this.warmupQueued&&currentCharacter){
   this.warmupQueued=true;
   const run=()=>{this.warmupQueued=false;if(!this.tavern&&nearTavern(this.lastPosition,PREWARM_RADIUS))this.construct(this.lastPosition);};
   const idle=(globalThis as typeof globalThis&{requestIdleCallback?:(cb:()=>void,options?:{timeout:number})=>number}).requestIdleCallback;
   if(idle)idle(run,{timeout:1200});else setTimeout(run,0);
  }
  return undefined;
 }
 nearest(position:Vec3){
  this.lastPosition=[...position];const tavern=this.ensure(position);if(!tavern)return;
  const live=tavern.inside?physicalPosition(position):position;
  const action:TavernInteraction|undefined=tavern.inside?tavern.interactionAt(live):(atTavernEntry(live)?{kind:'enter'}:undefined);
  this.target=action?interactionEntity(action,live):undefined;return this.target;
 }
 /** Dev acceptance escape hatch: enter the real interior through the same relocation path as E. */
 devEnter(){
  const character=currentCharacter;if(!character)return false;
  const live=character.root.position.toArray() as Vec3;
  this.lastPosition=[...live];const tavern=this.ensure(live)??this.construct(live);if(!tavern)return false;
  return enterNow(tavern,character);
 }
 private queueHudRewrite(){if(this.hudQueued)return;this.hudQueued=true;queueMicrotask(()=>{this.hudQueued=false;this.rewriteHud();});}
 private updateAtmosphere(tavern:AlderbrookTavern){
  const canvas=document.querySelector<HTMLElement>('#world');if(canvas?.style.filter)canvas.style.filter='';
  if(!tavern.inside){this.atmosphere?.remove();this.atmosphere=undefined;this.atmosphereOpacity=-1;return;}
  if(!this.atmosphere){this.atmosphere=document.createElement('div');this.atmosphere.className='tavern-atmosphere';document.body.append(this.atmosphere);}
  const haze=Math.min(1,tavern.smoke/2.5),tipsy=Math.min(1,tavern.intoxication/INTOXICATION_CAP),opacity=Math.min(.16,.018+tipsy*.075+haze*.06);
  if(Math.abs(opacity-this.atmosphereOpacity)>.006){this.atmosphere.style.opacity=opacity.toFixed(3);this.atmosphereOpacity=opacity;}
 }
 update(dt:number,position:Vec3){
  this.lastPosition=[...position];const tavern=this.ensure(position);if(!tavern)return;
  const live=tavern.inside?physicalPosition(position):position;tavern.update(dt,performance.now()/1000,live);this.queueHudRewrite();this.updateAtmosphere(tavern);
 }
 private rewriteHud(){
  const tavern=this.tavern,prompt=document.querySelector<HTMLElement>('#ui .interaction'),location=document.querySelector<HTMLElement>('#ui .location span');if(!tavern||!prompt)return;
  const live=tavern.inside?physicalPosition(this.lastPosition):this.lastPosition;
  const action:TavernInteraction|undefined=tavern.inside?tavern.interactionAt(live):(atTavernEntry(live)?{kind:'enter'}:undefined);
  if(tavern.inside){
   const text=action?.kind==='exit'?'E · Leave The Tipsy Alder':action?.kind==='bartender'?'E · Brinna Keggs · drinks & gossip':action?.kind==='bones'?'E · Play Alderbones':action?.kind==='pipe'?'E · House pipe · one pull':action?.kind==='patron'?`E · Speak to ${interactionEntity(action,live).name}`:'';
   prompt.textContent=text;prompt.hidden=!text;if(location)location.textContent='The Tipsy Alder · Alderbrook';
   const map=document.querySelector<HTMLElement>('.minimap,.mini-map,#minimap');if(map)map.style.visibility='hidden';
  }else{
   if(action?.kind==='enter'){prompt.textContent='E · Enter The Tipsy Alder';prompt.hidden=false;}
   const map=document.querySelector<HTMLElement>('.minimap,.mini-map,#minimap');if(map)map.style.visibility='';
  }
 }
 read(){return{...this.tavern?.read(),entry:{...ENTRY},lastPosition:[...this.lastPosition],entryActive:atTavernEntry(this.lastPosition),warmupQueued:this.warmupQueued,characterBound:!!currentCharacter,discoveryRadius:DISCOVERY_RADIUS,prewarmRadius:PREWARM_RADIUS};}
}

export function forceEnterTipsyAlderForDev(){return activeBridge?.devEnter()??false;}

export function handleTavernEntity(ui:HTMLElement,id:string,resume:()=>void){
 const tavern=activeTavern,character=currentCharacter;if(!tavern||!character||!id.startsWith('tavern:'))return false;
 if(id==='tavern:enter'){enterNow(tavern,character);resume();return true;}
 if(id==='tavern:exit'){leaveNow(tavern,character);resume();return true;}
 if(id==='tavern:brinna'){tavern.openBar(ui,character.state,stats(character.state).stamina,resume);return true;}
 if(id==='tavern:bones'){tavern.openBones(ui,resume);return true;}
 const panel=(title:string,eyebrow:string,copy:string)=>{ui.innerHTML='<section class="menu-card game-panel tavern-panel"><button class="back">← Back to the room</button><div class="eyebrow"></div><h2></h2><div class="tavern-content"><p class="tavern-quote"></p></div></section>';ui.querySelector<HTMLButtonElement>('.back')!.onclick=resume;ui.querySelector('.eyebrow')!.textContent=eyebrow;ui.querySelector('h2')!.textContent=title;ui.querySelector<HTMLElement>('.tavern-quote')!.textContent=copy;};
 if(id==='tavern:pipe'){panel('The House Pipe','THE TIPSY ALDER · PIPE NOOK',tavern.smokePipe());return true;}
 if(id.startsWith('tavern:patron:')){const patron=id.slice('tavern:patron:'.length),name=patron==='pell'?'Pell “Three Mugs” Dorr':patron==='sella'?'Sella Reed':'Jorren Pike';panel(name,'THE TIPSY ALDER · REGULAR',tavern.patronLine(patron));return true;}
 return false;
}
