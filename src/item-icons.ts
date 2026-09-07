const positions:Record<string,[number,number]>={
 mushroom:[0,0],herb:[1,0],woodland_broth:[2,0],axe:[3,0],pickaxe:[4,0],bow:[5,0],
 hammer:[0,1],sword:[1,1],fine_sword:[2,1],wood:[3,1],stone:[4,1],crow_crop:[5,1],
 iron:[0,2],fiber:[1,2],venison:[2,2],berries:[3,2],grilled_venison:[4,2],crow_milk:[5,2],
 hearty_stew:[0,3],hide:[1,3],health:[2,3],stamina:[3,3],speed:[4,3],wild_honey:[5,3],
};
const names:Record<string,string>={
 'Woodland mushrooms':'mushroom','Wild herbs':'herb','Woodland broth':'woodland_broth','Iron axe':'axe','Mining pick':'pickaxe','Hunter’s bow':'bow',
 'Builder’s hammer':'hammer','Marcher’s sword':'sword','Tempered sword':'fine_sword','Tempered marcher’s sword':'fine_sword','Oak timber':'wood',
 'Fieldstone':'stone','Iron ore':'iron','Wild flax':'fiber','Raw venison':'venison','Wild berries':'berries','Grilled venison':'grilled_venison',
 'Marcher’s stew':'hearty_stew','Cured hide':'hide','Crow crop':'crow_crop','Crow milk':'crow_milk','Wild honey':'wild_honey',
};
const recipeNames:Record<string,string>={'Woodland broth':'woodland_broth','Crow milk':'crow_milk','Marcher’s sword':'sword','Tempered marcher’s sword':'fine_sword','Grilled venison':'grilled_venison','Marcher’s stew':'hearty_stew'};

if(typeof document!=='undefined'){
 const pct=(n:number,max:number)=>max?`${n/max*100}%`:'0%';
 const rules=Object.entries(positions).map(([id,[x,y]])=>`.aw-item-icon[data-item="${id}"],.hotbar [data-item="${id}"]::before{background-position:${pct(x,5)} ${pct(y,3)}}`).join('\n');
 const style=document.createElement('style');
 style.dataset.alderwatchItemIcons='1';
 style.textContent=`
.aw-item-icon{display:inline-block;width:2.35rem;height:2.35rem;flex:0 0 auto;background-image:url('/assets/ui/item-icons.svg');background-size:600% 400%;background-repeat:no-repeat;filter:drop-shadow(0 2px 2px #0008);vertical-align:middle}
.pack-item strong>.aw-item-icon{width:2.8rem;height:2.8rem;margin-right:.55rem}.pack-item strong{display:flex;align-items:center}
.loot-icon.aw-item-icon{width:2.8rem;height:2.8rem;font-size:0}
.recipe h3>.aw-item-icon{width:2.25rem;height:2.25rem;margin-right:.5rem}.recipe h3{display:flex;align-items:center}
.hotbar button{position:relative;padding-left:3.15rem!important}.hotbar button::before{content:'';position:absolute;left:.42rem;top:50%;transform:translateY(-50%);width:2.35rem;height:2.35rem;background-image:url('/assets/ui/item-icons.svg');background-size:600% 400%;background-repeat:no-repeat;filter:drop-shadow(0 2px 2px #0009)}
.hotbar button:nth-child(1)::before{background-position:60% 0}.hotbar button:nth-child(2)::before{background-position:80% 0}.hotbar button:nth-child(3)::before{background-position:20% 33.333%}.hotbar button:nth-child(4)::before{background-position:0 33.333%}.hotbar button:nth-child(5)::before{background-position:100% 0}
.buffs::before{content:'';display:inline-block;width:1.45rem;height:1.45rem;margin-right:.35rem;vertical-align:-.32rem;background:url('/assets/ui/item-icons.svg') 80% 100%/600% 400% no-repeat;filter:drop-shadow(0 1px 1px #0009)}
${rules}`;
 document.head.append(style);

 const icon=(id:string)=>{const span=document.createElement('span');span.className='aw-item-icon';span.dataset.item=id;span.setAttribute('aria-hidden','true');return span;};
 const matchName=(text:string,map=names)=>Object.entries(map).find(([name])=>text.includes(name));
 const decorate=(root:ParentNode=document)=>{
  root.querySelectorAll<HTMLElement>('.pack-item strong:not([data-aw-icon])').forEach(el=>{const hit=matchName(el.textContent||'');if(!hit)return;const [name,id]=hit,count=(el.textContent||'').match(/×\d+/)?.[0]??'';el.textContent=`${name}${count?' '+count:''}`;el.prepend(icon(id));el.dataset.awIcon='1';});
  root.querySelectorAll<HTMLElement>('.loot-row:not([data-aw-icon])').forEach(row=>{const hit=matchName(row.querySelector('strong')?.textContent||'');if(!hit)return;const old=row.querySelector<HTMLElement>('.loot-icon');if(old){old.textContent='';old.classList.add('aw-item-icon');old.dataset.item=hit[1];}row.dataset.awIcon='1';});
  root.querySelectorAll<HTMLElement>('.recipe h3:not([data-aw-icon])').forEach(el=>{const hit=matchName(el.textContent||'',recipeNames);if(!hit)return;el.prepend(icon(hit[1]));el.dataset.awIcon='1';});
 };
 const tagHotbar=()=>document.querySelectorAll<HTMLElement>('.hotbar button').forEach(b=>{const hit=matchName(b.textContent||'');b.dataset.item=hit?.[1]??'';});
 const observer=new MutationObserver(records=>{if(records.length&&records.every(r=>(r.target as Element).classList?.contains('buffs')))return;queueMicrotask(()=>{decorate();tagHotbar();});});
 const start=()=>{decorate();tagHotbar();const ui=document.querySelector('#ui');if(ui)observer.observe(ui,{subtree:true,childList:true});else requestAnimationFrame(start);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
