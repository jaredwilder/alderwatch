import type * as T from 'three';
import type {Assets} from './assets';
import {Character} from './character';
import {stats} from './definitions';
import type {Vec3} from './state';
import {AlderbrookTavern,type TavernInteraction} from './alderbrook-tavern';
import {MAX_INTOXICATION as INTOXICATION_CAP} from './tavern-rules';
import {setInstancedInteriorActive} from './performance-closure-runtime';

export interface TavernEntity{id:string;name:string;role:string;position:Vec3;yaw:number;greeting:string;hair:string;cloth:string}
let currentCharacter:Character|undefined;
let activeTavern:AlderbrookTavern|undefined;
let patchInstalled=false;

const entity=(id:string,name:string,role:string,position:Vec3,greeting=''):TavernEntity=>({id,name,role,position,yaw:0,greeting,hair:'#4b3527',cloth:'#66503e'});
function relocate(character:Character,position:Vec3,yaw:number){
 character.velocity.set(0,0,0);character.vertical=0;character.locked=0;character.root.position.fromArray(position);character.root.rotation.y=yaw;
 character.body.setTranslation({x:position[0],y:position[1]+.9,z:position[2]},true);character.body.setNextKinematicTranslation({x:position[0],y:position[1]+.9,z:position[2]});
 character.state.yaw=yaw;
}
function installCharacterPatch(){
 if(patchInstalled)return;patchInstalled=true;
 const post=Character.prototype.postStep,pre=Character.prototype.preStep;
 Character.prototype.postStep=function(dt:number){post.call(this,dt);currentCharacter=this;if(activeTavern?.inside){const safe=activeTavern.safeSavePosition();if(safe){this.state.position=[...safe.position];this.state.yaw=safe.yaw;}}};
 Character.prototype.preStep=function(...args:Parameters<Character['preStep']>){
  if(activeTavern?.inside){
   this.moveSpeed=activeTavern.movementScale();
   const input=args[1] as Parameters<Character['preStep']>[1]&{pressed?:Set<string>;primary?:boolean;secondary?:boolean;keys?:Set<string>};
   input.pressed?.delete('Attack');input.pressed?.delete('KeyF');input.primary=false;input.secondary=false;input.keys?.delete('Space');
  }else this.moveSpeed=1;
  return pre.apply(this,args);
 };
}
installCharacterPatch();

// Critical invariant: interaction range is always measured from the physical character.
// The saved PlayerState intentionally remains at the exterior return point while inside.
function actualPosition(fallback:Vec3){return currentCharacter?currentCharacter.root.position.toArray() as Vec3:fallback;}
function interactionEntity(action:TavernInteraction,tavern:AlderbrookTavern):TavernEntity{
 const pos=actualPosition(tavern.exteriorDoor);
 if(action.kind==='enter')return entity('tavern:enter','The Tipsy Alder','Enter tavern',pos,'Warm light leaks around the old oak door.');
 if(action.kind==='exit')return entity('tavern:exit','Front Door','Leave tavern',pos);
 if(action.kind==='bartender')return entity('tavern:brinna','Brinna Keggs','Proprietor',pos,'Drink first. Confess later.');
 if(action.kind==='bones')return entity('tavern:bones','Alderbones Table','House game',pos);
 if(action.kind==='pipe')return entity('tavern:pipe','House Pipe','Pipe nook',pos);
 return entity(`tavern:patron:${action.id}`,action.id==='pell'?'Pell “Three Mugs” Dorr':action.id==='sella'?'Sella Reed':'Jorren Pike','Regular',pos);
}
function clearOutdoorNoise(){document.querySelector('#toast')?.remove();}

export class TavernBridge{
 private tavern?:AlderbrookTavern;private target?:TavernEntity;private hudQueued=false;private atmosphere?:HTMLDivElement;private atmosphereOpacity=-1;
 constructor(private root:T.Group,private assets:Assets){}
 get inside(){return !!this.tavern?.inside;}
 private ensure(){if(!this.tavern&&currentCharacter){this.tavern=new AlderbrookTavern(this.root,this.assets,currentCharacter.physics);activeTavern=this.tavern;}return this.tavern;}
 nearest(position:Vec3){const tavern=this.ensure();if(!tavern)return;const action=tavern.interactionAt(actualPosition(position));this.target=action?interactionEntity(action,tavern):undefined;return this.target;}
 private queueHudRewrite(){if(this.hudQueued)return;this.hudQueued=true;queueMicrotask(()=>{this.hudQueued=false;this.rewriteHud();});}
 private updateAtmosphere(tavern:AlderbrookTavern){
  const canvas=document.querySelector<HTMLElement>('#world');if(canvas?.style.filter)canvas.style.filter='';
  if(!tavern.inside){this.atmosphere?.remove();this.atmosphere=undefined;this.atmosphereOpacity=-1;return;}
  if(!this.atmosphere){this.atmosphere=document.createElement('div');this.atmosphere.className='tavern-atmosphere';document.body.append(this.atmosphere);}
  const haze=Math.min(1,tavern.smoke/2.5),tipsy=Math.min(1,tavern.intoxication/INTOXICATION_CAP),opacity=Math.min(.16,.018+tipsy*.075+haze*.06);
  if(Math.abs(opacity-this.atmosphereOpacity)>.006){this.atmosphere.style.opacity=opacity.toFixed(3);this.atmosphereOpacity=opacity;}
 }
 update(dt:number,position:Vec3){const tavern=this.ensure();if(!tavern)return;tavern.update(dt,performance.now()/1000,actualPosition(position));this.queueHudRewrite();this.updateAtmosphere(tavern);}
 private rewriteHud(){
  const tavern=this.tavern,prompt=document.querySelector<HTMLElement>('#ui .interaction'),location=document.querySelector<HTMLElement>('#ui .location span');if(!tavern||!prompt)return;
  const action=tavern.interactionAt(actualPosition(tavern.exteriorDoor));
  if(tavern.inside){
   const text=action?.kind==='exit'?'E · Leave The Tipsy Alder':action?.kind==='bartender'?'E · Brinna Keggs · drinks & gossip':action?.kind==='bones'?'E · Play Alderbones':action?.kind==='pipe'?'E · House pipe · one pull':action?.kind==='patron'?`E · Speak to ${interactionEntity(action,tavern).name}`:'';
   prompt.textContent=text;prompt.hidden=!text;if(location)location.textContent='The Tipsy Alder · Alderbrook';
   const map=document.querySelector<HTMLElement>('.minimap,.mini-map,#minimap');if(map)map.style.visibility='hidden';
  }else{
   if(action?.kind==='enter'){prompt.textContent='E · Enter The Tipsy Alder';prompt.hidden=false;}
   const map=document.querySelector<HTMLElement>('.minimap,.mini-map,#minimap');if(map)map.style.visibility='';
  }
 }
 read(){return this.tavern?.read();}
}

export function handleTavernEntity(ui:HTMLElement,id:string,resume:()=>void){
 const tavern=activeTavern,character=currentCharacter;if(!tavern||!character||!id.startsWith('tavern:'))return false;
 if(id==='tavern:enter'){clearOutdoorNoise();const to=tavern.enter();setInstancedInteriorActive(true);relocate(character,to.position,to.yaw);resume();return true;}
 if(id==='tavern:exit'){const to=tavern.leave();setInstancedInteriorActive(false);relocate(character,to.position,to.yaw);document.querySelector('.tavern-atmosphere')?.remove();resume();return true;}
 if(id==='tavern:brinna'){tavern.openBar(ui,character.state,stats(character.state).stamina,resume);return true;}
 if(id==='tavern:bones'){tavern.openBones(ui,resume);return true;}
 const panel=(title:string,eyebrow:string,copy:string)=>{ui.innerHTML='<section class="menu-card game-panel tavern-panel"><button class="back">← Back to the room</button><div class="eyebrow"></div><h2></h2><div class="tavern-content"><p class="tavern-quote"></p></div></section>';ui.querySelector<HTMLButtonElement>('.back')!.onclick=resume;ui.querySelector('.eyebrow')!.textContent=eyebrow;ui.querySelector('h2')!.textContent=title;ui.querySelector<HTMLElement>('.tavern-quote')!.textContent=copy;};
 if(id==='tavern:pipe'){panel('The House Pipe','THE TIPSY ALDER · PIPE NOOK',tavern.smokePipe());return true;}
 if(id.startsWith('tavern:patron:')){const patron=id.slice('tavern:patron:'.length),name=patron==='pell'?'Pell “Three Mugs” Dorr':patron==='sella'?'Sella Reed':'Jorren Pike';panel(name,'THE TIPSY ALDER · REGULAR',tavern.patronLine(patron));return true;}
 return false;
}