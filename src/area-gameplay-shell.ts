import {GamePanels} from './game-panels';
import type {Input} from './input';
import {HOTBAR_ITEMS,QUICK_FOOD_ITEMS,displayedHotbarItem} from './live-gameplay';
import {ITEMS,type Command,type ItemId,type LocalAuthority,type PlayerState,type Vec3} from './state';
import './backpack-ui';
import './recipe-book-ui';
import './ui-stack';
import './area-gameplay-shell.css';

export type AreaShellMode='world'|'inventory'|'journal'|'craft'|'map';
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
}

export const GLOBAL_AREA_KEYS=['Tab','KeyM','KeyJ','KeyC','KeyQ','Digit1','Digit2','Digit3','Digit4','Digit5','KeyK'] as const;

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
  // Generic Input deliberately leaves M to a map owner because Far March MiniMap
  // captures it. Streamed areas need their own capture owner or M never reaches
  // AreaGameplayShell at all.
  if(e.code!=='KeyM'||e.repeat||(this.mode!=='world'&&this.mode!=='map'))return;
  e.preventDefault();e.stopImmediatePropagation();if(this.mode==='map')this.close();else this.openMap();
 };
 constructor(private o:AreaGameplayShellOptions){
  this.panels=new GamePanels(o.ui,o.authority,o.player,()=>{throw new Error(`Building is not area-addressed in ${o.areaId}`);},()=>this.close(),c=>this.command(c));
  window.addEventListener('keydown',this.onKey,true);
 }
 get blocked(){return this.mode!=='world';}

 mountHud(){
  if(this.mode!=='world')return;
  let hotbar=this.o.ui.querySelector<HTMLElement>('.hotbar');
  if(!hotbar){hotbar=document.createElement('div');hotbar.className='hotbar area-hotbar';this.o.ui.append(hotbar);}
  hotbar.innerHTML='';
  HOTBAR_ITEMS.forEach((id,i)=>{const button=document.createElement('button');button.type='button';button.dataset.item=id;button.onclick=()=>this.equip(id);hotbar!.append(button);});
  let actions=this.o.ui.querySelector<HTMLElement>('.area-global-actions');
  if(!actions){actions=document.createElement('nav');actions.className='area-global-actions';actions.setAttribute('aria-label','Global survivor controls');this.o.ui.append(actions);}
  actions.innerHTML='';
  const action=(label:string,run:()=>void)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=run;actions!.append(b);};
  action('TAB · PACK',()=>this.inventory());action('M · MAP',()=>this.openMap());action('J · JOURNAL',()=>this.journal());action('C · RECIPES',()=>this.crafting());
  const controls=this.o.ui.querySelector<HTMLElement>('.controls');if(controls&&!controls.dataset.globalControls){controls.dataset.globalControls='1';controls.textContent+=' · Tab Pack · M Map · J Journal · C Recipes · Q Food · 1–5 Gear · K Skills';}
  this.refreshHotbar();
 }

 update(){
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
  if(this.o.input.take('KeyB'))this.o.notify(`Building is unavailable in ${this.o.areaName} until structures are area-addressed. Your Far March structures are safe.`);
  this.refreshHotbar();
  return false;
 }

 private command(c:Command){
  const out=this.o.authority.dispatch(c);
  if(out.ok){if(c.type==='equip')this.o.equipVisual(c.item);this.o.save();}
  this.o.notify(out.message);return out;
 }
 private equip(id:ItemId){let item=id;const p=this.o.player();if(id==='sword'&&p.inventory.some(s=>s.item==='fine_sword'))item='fine_sword';this.command({type:'equip',playerId:p.id,item});this.refreshHotbar();}
 private quickFood(){const p=this.o.player(),item=QUICK_FOOD_ITEMS.find(id=>p.inventory.some(s=>s.item===id&&s.count>0)&&!p.buffs.some(b=>b.id===id&&b.remaining>60))??QUICK_FOOD_ITEMS.find(id=>p.inventory.some(s=>s.item===id&&s.count>0));if(item)this.command({type:'eat',playerId:p.id,item});else this.o.notify('No prepared food in your pack. Open C to plan a campfire recipe.');}
 private beginPanel(mode:'inventory'|'journal'|'craft',render:()=>void){this.mode=mode;this.o.input.clear();this.o.input.active=false;render();const back=this.o.ui.querySelector<HTMLButtonElement>('.game-panel .back');if(back)back.textContent=`← Return to ${this.o.areaName}`;}
 private inventory(){this.beginPanel('inventory',()=>this.panels.inventory());}
 private journal(){this.beginPanel('journal',()=>{this.panels.journal();const eyebrow=this.o.ui.querySelector<HTMLElement>('.game-panel .eyebrow');if(eyebrow)eyebrow.textContent=`FIELD JOURNAL · ${this.o.areaName.toUpperCase()}`;});}
 private crafting(){this.beginPanel('craft',()=>{this.panels.crafting('__area-planning-only__');const eyebrow=this.o.ui.querySelector<HTMLElement>('.game-panel .eyebrow');if(eyebrow)eyebrow.textContent=`RECIPE BOOK · ${this.o.areaName.toUpperCase()} · PLANNING`;const note=this.o.ui.querySelector<HTMLElement>('.panel-content p');if(note)note.textContent=`Recipe planning is available everywhere. Crafting still requires a real area-addressed campfire or workbench; this prevents ${this.o.areaName} coordinates from mutating Far March stations.`;});}

 private openMap(){
  this.mode='map';this.o.input.clear();this.o.input.active=false;
  const overlay=document.createElement('section');overlay.className='area-map-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label',`${this.o.areaName} map`);
  overlay.innerHTML='<div class="area-map-card"><header><div><small>ALDERWATCH REALM ATLAS</small><h2></h2></div><button type="button">M / ESC · CLOSE</button></header><div class="area-map-field"><div class="area-map-grid"></div></div><footer><span>YOU</span><span>Landmarks are live area coordinates · no fast travel</span></footer></div>';
  overlay.querySelector('h2')!.textContent=this.o.areaName.toUpperCase();overlay.querySelector<HTMLButtonElement>('header button')!.onclick=()=>this.close();
  const field=overlay.querySelector<HTMLElement>('.area-map-field')!,p=areaMapPoint(this.o.player().position,this.o.bounds),you=document.createElement('i');you.className='area-map-you';you.style.left=p.x+'%';you.style.top=p.y+'%';you.title='You';field.append(you);
  for(const landmark of this.o.landmarks()){const q=areaMapPoint(landmark.position,this.o.bounds),pin=document.createElement('span');pin.className='area-map-pin '+(landmark.kind??'site');pin.style.left=q.x+'%';pin.style.top=q.y+'%';pin.innerHTML='<b></b><em></em>';pin.querySelector('b')!.textContent=landmark.kind==='gate'?'◆':landmark.kind==='settlement'?'⌂':landmark.kind==='danger'?'▲':'●';pin.querySelector('em')!.textContent=landmark.label;field.append(pin);}
  document.body.append(overlay);this.map=overlay;
 }
 private close(){const wasMap=this.mode==='map';this.map?.remove();this.map=undefined;this.mode='world';this.o.input.clear();this.o.input.active=true;if(!wasMap){this.o.renderHud();this.mountHud();}}
 private refreshHotbar(){if(this.mode!=='world')return;const p=this.o.player(),buttons=Array.from(this.o.ui.querySelectorAll<HTMLButtonElement>('.hotbar button'));buttons.forEach((button,i)=>{const base=HOTBAR_ITEMS[i];if(!base)return;const item=displayedHotbarItem(p,base);button.dataset.item=item;button.textContent=`${i+1}  ${ITEMS[item].name}`;button.classList.toggle('selected',item===p.equipped);});}
}
