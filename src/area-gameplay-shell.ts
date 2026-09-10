import type {Camera} from 'three';
import {GamePanels} from './game-panels';
import type {Input} from './input';
import type {Building} from './building';
import {HOTBAR_ITEMS,QUICK_FOOD_ITEMS,displayedHotbarItem} from './live-gameplay';
import {ITEMS,type Command,type ItemId,type LocalAuthority,type PlayerState,type Vec3} from './state';
import {distance} from './economy';
import {areaOf} from './area-ownership';
import './backpack-ui';
import './recipe-book-ui';
import './ui-stack';
import './area-gameplay-shell.css';

export type AreaShellMode='world'|'inventory'|'journal'|'craft'|'storage'|'map'|'build';
export interface AreaMapLandmark {label:string;position:Vec3;kind?:'settlement'|'gate'|'site'|'danger'}
export interface AreaMapBounds {minX:number;maxX:number;minZ:number;maxZ:number}
export interface AreaGameplayShellOptions {
 areaId:string;
 areaName:string;
 ui:HTMLElement;
 authority:LocalAuthority;
 input:Input;
 player:()=>PlayerState;
 bounds:AreaMapBounds;
 landmarks:()=>AreaMapLandmark[];
 renderHud:()=>void;
 save:()=>void;
 equipVisual:(item:ItemId|null)=>void;
 notify:(message:string)=>void;
 building?:Building;
 camera?:Camera;
}

export const GLOBAL_AREA_KEYS=['Tab','KeyM','KeyJ','KeyC','KeyQ','KeyB','Digit1','Digit2','Digit3','Digit4','Digit5','KeyK'] as const;

export function areaMapPoint(position:Vec3,bounds:AreaMapBounds){
 const width=Math.max(.001,bounds.maxX-bounds.minX),height=Math.max(.001,bounds.maxZ-bounds.minZ);
 return {x:Math.max(0,Math.min(100,(position[0]-bounds.minX)/width*100)),y:Math.max(0,Math.min(100,(position[2]-bounds.minZ)/height*100))};
}

export class AreaGameplayShell {
 private mode:AreaShellMode='world';
 private map?:HTMLElement;
 private panels:GamePanels;
 private onKey=(e:KeyboardEvent)=>{
  const target=e.target as HTMLElement|undefined;if(target?.matches('input,textarea,select'))return;
  if(e.code!=='KeyM'||e.repeat||(this.mode!=='world'&&this.mode!=='map'))return;
  e.preventDefault();e.stopImmediatePropagation();if(this.mode==='map')this.close();else this.openMap();
 };
 constructor(private o:AreaGameplayShellOptions){
  this.panels=new GamePanels(o.ui,o.authority,o.player,()=>{if(!o.building)throw new Error(`Building is not mounted in ${o.areaId}`);return o.building;},()=>this.close(),c=>this.command(c));
  window.addEventListener('keydown',this.onKey,true);
 }
 get blocked(){return !['world','build'].includes(this.mode);}

 mountHud(){
  if(this.mode!=='world'&&this.mode!=='build')return;
  let hotbar=this.o.ui.querySelector<HTMLElement>('.hotbar');
  if(!hotbar){hotbar=document.createElement('div');hotbar.className='hotbar area-hotbar';this.o.ui.append(hotbar);}
  hotbar.innerHTML='';
  HOTBAR_ITEMS.forEach((id,i)=>{const button=document.createElement('button');button.type='button';button.dataset.item=id;button.onclick=()=>this.equip(id);hotbar!.append(button);});
  let actions=this.o.ui.querySelector<HTMLElement>('.area-global-actions');
  if(!actions){actions=document.createElement('nav');actions.className='area-global-actions';actions.setAttribute('aria-label','Global survivor controls');this.o.ui.append(actions);}
  actions.innerHTML='';
  const action=(label:string,run:()=>void)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=run;actions!.append(b);};
  action('TAB · PACK',()=>this.inventory());action('M · MAP',()=>this.openMap());action('J · JOURNAL',()=>this.journal());action('C · RECIPES',()=>this.crafting());if(this.o.building)action('B · BUILD',()=>this.startBuilding());
  const controls=this.o.ui.querySelector<HTMLElement>('.controls');if(controls&&!controls.dataset.globalControls){controls.dataset.globalControls='1';controls.textContent+=' · Tab Pack · M Map · J Journal · C Recipes · Q Food · '+(this.o.building?'B Build · ':'')+'1–5 Gear · K Skills';}
  this.refreshHotbar();
 }

 update(){
  if(this.mode==='build'){
   const building=this.o.building,camera=this.o.camera;if(!building||!camera){this.close();return false;}
   if(this.o.input.take('Escape')||this.o.input.take('KeyB')){this.close();return false;}
   if(this.o.input.take('KeyR'))building.yaw+=Math.PI/2;
   building.update(camera,this.o.input.pointer,this.o.player());
   if(this.o.input.take('Attack')){this.o.input.primary=false;const out=building.place();this.o.notify(out.message);if(out.ok)this.o.save();}
   if(this.o.input.take('KeyX')){const out=building.dismantle(this.o.player());this.o.notify(out.message);if(out.ok)this.o.save();}
   this.panels.updateBuild();this.refreshHotbar();return false;
  }
  if(this.mode!=='world'){
   const close=this.o.input.take('Escape')||this.o.input.take('Tab')||(this.mode==='map'&&this.o.input.take('KeyM'))||(this.mode==='journal'&&this.o.input.take('KeyJ'))||(this.mode==='craft'&&this.o.input.take('KeyC'));
   if(close)this.close();
   this.o.input.clear();
   return true;
  }
  if(this.o.input.take('Tab')){this.inventory();return true;}
  if(this.o.input.take('KeyM')){this.openMap();return true;}
  if(this.o.input.take('KeyJ')){this.journal();return true;}
  if(this.o.input.take('KeyC')){this.crafting();return true;}
  if(this.o.input.take('KeyQ'))this.quickFood();
  for(const [i,id] of HOTBAR_ITEMS.entries())if(this.o.input.take('Digit'+(i+1)))this.equip(id);
  if(this.o.input.take('KeyB')){if(this.o.building&&this.o.camera)this.startBuilding();else this.o.notify(`Building has no terrain adapter in ${this.o.areaName} yet.`);}
  this.refreshHotbar();
  return false;
 }

 /** Shared E-interaction for player-built doors, chests and crafting stations. */
 interactSharedWorld(){
  if(this.blocked)return false;const p=this.o.player(),door=this.o.building?.nearest(p,'doorway');if(door){this.command({type:'toggle_door',playerId:p.id,structureId:door.id});return true;}
  const box=Object.values(this.o.authority.state.containers).find(s=>areaOf(s)===this.o.areaId&&distance(s.position,p.position)<2.5);if(box){const out=this.command({type:'open_container',playerId:p.id,containerId:box.id});if(out.ok)this.storage(box.id);return true;}
  const station=this.nearestStation();if(station){this.crafting();return true;}return false;
 }
 sharedWorldPrompt(){
  const p=this.o.player(),door=this.o.building?.nearest(p,'doorway');if(door)return `E ${(door.doorOpen?'Close':'Open')} oak door`;
  const box=Object.values(this.o.authority.state.containers).find(s=>areaOf(s)===this.o.areaId&&distance(s.position,p.position)<2.5);if(box)return `E Open ${box.name}`;
  const station=this.nearestStation();return station?`E Use ${station.name}`:'';
 }

 private command(c:Command){
  const out=this.o.authority.dispatch(c);
  if(out.ok){if(c.type==='equip')this.o.equipVisual(c.item);this.o.save();}
  this.o.notify(out.message);return out;
 }
 private equip(id:ItemId){let item=id;const p=this.o.player();if(id==='sword'&&p.inventory.some(s=>s.item==='fine_sword'))item='fine_sword';this.command({type:'equip',playerId:p.id,item});this.refreshHotbar();}
 private quickFood(){const p=this.o.player(),item=QUICK_FOOD_ITEMS.find(id=>p.inventory.some(s=>s.item===id&&s.count>0)&&!p.buffs.some(b=>b.id===id&&b.remaining>60))??QUICK_FOOD_ITEMS.find(id=>p.inventory.some(s=>s.item===id&&s.count>0));if(item)this.command({type:'eat',playerId:p.id,item});else this.o.notify('No prepared food in your pack. Open C beside a campfire to cook.');}
 private beginPanel(mode:'inventory'|'journal'|'craft'|'storage',render:()=>void){this.o.building?.setActive(false);this.mode=mode;this.o.input.clear();this.o.input.active=false;render();const back=this.o.ui.querySelector<HTMLButtonElement>('.game-panel .back');if(back)back.textContent=`← Return to ${this.o.areaName}`;}
 private inventory(){this.beginPanel('inventory',()=>this.panels.inventory());}
 private journal(){this.beginPanel('journal',()=>{this.panels.journal();const eyebrow=this.o.ui.querySelector<HTMLElement>('.game-panel .eyebrow');if(eyebrow)eyebrow.textContent=`FIELD JOURNAL · ${this.o.areaName.toUpperCase()}`;});}
 private nearestStation(){const p=this.o.player();return Object.values(this.o.authority.state.stations).filter(s=>areaOf(s)===this.o.areaId&&distance(s.position,p.position)<=3.2).sort((a,b)=>distance(a.position,p.position)-distance(b.position,p.position))[0];}
 private crafting(){const station=this.nearestStation();this.beginPanel('craft',()=>{this.panels.crafting(station?.id);const eyebrow=this.o.ui.querySelector<HTMLElement>('.game-panel .eyebrow');if(eyebrow)eyebrow.textContent=station?`CRAFTING · ${this.o.areaName.toUpperCase()}`:`RECIPE BOOK · ${this.o.areaName.toUpperCase()}`;});}
 private storage(id:string){this.beginPanel('storage',()=>this.panels.storage(id));}
 private startBuilding(){if(!this.o.building||!this.o.camera){this.o.notify(`Building has no terrain adapter in ${this.o.areaName} yet.`);return;}this.mode='build';this.o.input.clear();this.o.input.active=true;this.o.building.setActive(true);this.panels.build();}

 private openMap(){
  this.o.building?.setActive(false);this.mode='map';this.o.input.clear();this.o.input.active=false;
  const overlay=document.createElement('section');overlay.className='world-map-overlay area-map-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label',`Interactive full map of ${this.o.areaName}`);
  overlay.innerHTML='<div class="world-map-frame area-map-card"><header><div><small>ALDERWATCH CARTOGRAPHY · LIVE</small><h2></h2></div><button class="world-map-close" type="button">M / ESC · CLOSE</button></header><div class="world-map-layout"><div class="world-map-canvas-wrap area-map-field"><div class="area-map-grid"></div><span class="world-map-north">N ↑</span><span class="world-map-hover">Live area coordinates · no fast travel</span></div><aside class="world-map-sidebar"><div class="world-map-you"></div><div class="world-map-selection"><small>ACTIVE AREA</small><strong></strong><span>The same survivor, inventory and progression continue across this boundary.</span></div><h3>KNOWN LANDMARKS</h3><div class="area-map-landmark-list"></div><div class="world-map-legend"><span>⌂ Settlement</span><span>◆ Gate</span><span>▲ Danger</span><span>● Site</span></div><p>Areas are streamed world geography, not separate games. Crossing a gate changes the loaded world, not your Alderwatch character or authorities.</p></aside></div></div>';
  overlay.querySelector('h2')!.textContent=this.o.areaName.toUpperCase();overlay.querySelector<HTMLElement>('.world-map-selection strong')!.textContent=this.o.areaName;overlay.querySelector<HTMLButtonElement>('.world-map-close')!.onclick=()=>this.close();
  const field=overlay.querySelector<HTMLElement>('.area-map-field')!,player=this.o.player(),p=areaMapPoint(player.position,this.o.bounds),you=document.createElement('i');you.className='area-map-you';you.style.left=p.x+'%';you.style.top=p.y+'%';you.title='You';field.append(you);overlay.querySelector<HTMLElement>('.world-map-you')!.textContent=`YOU · LIVE · ${this.o.areaName} · X ${Math.round(player.position[0])} · Z ${Math.round(player.position[2])}`;
  const list=overlay.querySelector<HTMLElement>('.area-map-landmark-list')!;
  for(const landmark of this.o.landmarks()){const q=areaMapPoint(landmark.position,this.o.bounds),pin=document.createElement('span');pin.className='area-map-pin '+(landmark.kind??'site');pin.style.left=q.x+'%';pin.style.top=q.y+'%';pin.innerHTML='<b></b><em></em>';pin.querySelector('b')!.textContent=landmark.kind==='gate'?'◆':landmark.kind==='settlement'?'⌂':landmark.kind==='danger'?'▲':'●';pin.querySelector('em')!.textContent=landmark.label;field.append(pin);const row=document.createElement('div');row.className='world-map-sighting';row.innerHTML='<strong></strong><span></span>';row.querySelector('strong')!.textContent=pin.querySelector('b')!.textContent+' '+landmark.label;row.querySelector('span')!.textContent=`X ${Math.round(landmark.position[0])} · Z ${Math.round(landmark.position[2])}`;list.append(row);}
  document.body.append(overlay);this.map=overlay;
 }
 private close(){const wasMap=this.mode==='map';this.o.building?.setActive(false);this.map?.remove();this.map=undefined;this.mode='world';this.o.input.clear();this.o.input.active=true;if(!wasMap){this.o.renderHud();this.mountHud();}}
 private refreshHotbar(){if(this.mode!=='world'&&this.mode!=='build')return;const p=this.o.player(),buttons=Array.from(this.o.ui.querySelectorAll<HTMLButtonElement>('.hotbar button'));buttons.forEach((button,i)=>{const base=HOTBAR_ITEMS[i];if(!base)return;const item=displayedHotbarItem(p,base);button.dataset.item=item;button.textContent=`${i+1}  ${ITEMS[item].name}`;button.classList.toggle('selected',item===p.equipped);});}
}
