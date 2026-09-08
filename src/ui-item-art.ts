import {RECIPES} from './definitions';
import {ITEMS,type ItemId} from './state';
import './item-icons.css';

const items=(Object.entries(ITEMS) as [ItemId,(typeof ITEMS)[ItemId]][]).sort((a,b)=>b[1].name.length-a[1].name.length);
const recipeOutput=new Map(RECIPES.map(recipe=>[recipe.name,recipe.output]));

function itemFromText(text:string|null|undefined){
 if(!text)return undefined;
 return items.find(([,definition])=>text.includes(definition.name))?.[0];
}

function icon(item:ItemId,className:string){
 const art=document.createElement('span');
 art.className=`item-art item-${item} ${className}`;
 art.setAttribute('aria-hidden','true');
 return art;
}

function enhanceInventory(root:ParentNode){
 for(const card of root.querySelectorAll<HTMLElement>('.pack-item:not(.has-item-art)')){
  const item=itemFromText(card.querySelector('strong')?.textContent);
  if(!item)continue;
  card.classList.add('has-item-art');
  card.prepend(icon(item,'pack-item-icon'));
 }
}

function enhanceCrafting(root:ParentNode){
 for(const card of root.querySelectorAll<HTMLElement>('.recipe:not(.has-item-art)')){
  const output=recipeOutput.get(card.querySelector('h3')?.textContent??'');
  if(!output)continue;
  card.classList.add('has-item-art');
  card.prepend(icon(output,'recipe-icon'));
 }
}

function enhanceStorage(root:ParentNode){
 for(const row of root.querySelectorAll<HTMLElement>('.loot-row:not(.has-item-art)')){
  const item=itemFromText(row.querySelector('strong')?.textContent);
  const frame=row.querySelector<HTMLElement>('.loot-icon');
  if(!item||!frame)continue;
  row.classList.add('has-item-art');
  frame.replaceChildren(icon(item,'loot-item-icon'));
 }
}

function enhance(){
 const ui=document.querySelector<HTMLElement>('#ui');
 if(!ui)return;
 enhanceInventory(ui);
 enhanceCrafting(ui);
 enhanceStorage(ui);
}

function install(){
 const ui=document.querySelector<HTMLElement>('#ui');
 if(!ui)return;
 let queued=false;
 const schedule=()=>{
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;enhance();});
 };
 new MutationObserver(schedule).observe(ui,{childList:true,subtree:true});
 enhance();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
