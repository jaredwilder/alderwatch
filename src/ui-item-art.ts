import {RECIPES} from './definitions';
import {ITEMS,type ItemId} from './state';
import './item-icons.css';

const items=(Object.entries(ITEMS) as [ItemId,(typeof ITEMS)[ItemId]][]).sort((a,b)=>b[1].name.length-a[1].name.length);
const recipeOutput=new Map(RECIPES.map(recipe=>[recipe.name,recipe.output]));
const artSelector='.pack-item,.recipe,.loot-row';

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
  const strong=card.querySelector<HTMLElement>('strong'),item=itemFromText(strong?.textContent);
  if(!item)continue;
  card.classList.add('has-item-art');
  card.prepend(icon(item,'pack-item-icon'));
  if(strong){const nameAt=strong.textContent?.indexOf(ITEMS[item].name)??-1;if(nameAt>=0)strong.textContent=strong.textContent!.slice(nameAt);}
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
  const item=itemFromText(row.querySelector('strong')?.textContent),frame=row.querySelector<HTMLElement>('.loot-icon');
  if(!item||!frame)continue;
  row.classList.add('has-item-art');
  frame.replaceChildren(icon(item,'loot-item-icon'));
 }
}

function enhance(){
 const ui=document.querySelector<HTMLElement>('#ui');
 if(!ui)return;
 enhanceInventory(ui);enhanceCrafting(ui);enhanceStorage(ui);
}

function containsArtSurface(node:Node){
 return node instanceof Element&&(node.matches(artSelector)||Boolean(node.querySelector(artSelector)));
}

function install(){
 const ui=document.querySelector<HTMLElement>('#ui');
 if(!ui)return;
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhance();});};
 new MutationObserver(records=>{if(records.some(record=>Array.from(record.addedNodes).some(containsArtSurface)))schedule();}).observe(ui,{childList:true,subtree:true});
 enhance();
}

// This dependency evaluates before main.ts creates #ui. Queueing installs after main's synchronous bootstrap.
queueMicrotask(install);
