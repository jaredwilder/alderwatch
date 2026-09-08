const positions:Record<string,[number,number]>={
 mushroom:[0,0],herb:[1,0],woodland_broth:[2,0],axe:[3,0],pickaxe:[4,0],bow:[5,0],
 hammer:[0,1],sword:[1,1],fine_sword:[2,1],wood:[3,1],stone:[4,1],crow_crop:[5,1],
 iron:[0,2],fiber:[1,2],venison:[2,2],berries:[3,2],grilled_venison:[4,2],crow_milk:[5,2],
 hearty_stew:[0,3],hide:[1,3],health:[2,3],stamina:[3,3],speed:[4,3],wild_honey:[5,3],
 hare_meat:[0,4],crow_meat:[1,4],goat_meat:[2,4],mutton:[3,4],bear_meat:[4,4],bison_meat:[5,4],
 wolf_meat:[0,5],eagle_meat:[1,5],roasted_hare:[2,5],crow_skewer:[3,5],herbed_goat:[4,5],hearth_mutton:[5,5],
 bear_steak:[0,6],bison_roast:[1,6],smoked_wolf:[2,6],eagle_roast:[3,6],
};
const expandedPositions:Record<string,[number,number]>={
 hare_pottage:[0,0],crow_blackpot:[1,0],goat_stew:[2,0],mutton_stew:[3,0],venison_berry_roast:[4,0],bear_pottage:[5,0],
 bison_stew:[0,1],wolf_broth:[1,1],eagle_broth:[2,1],hunter_platter:[3,1],frontier_mixed_grill:[4,1],predator_stew:[5,1],
 hare_saddle:[0,2],crow_breast:[1,2],goat_tenderloin:[2,2],mutton_rack:[3,2],hart_tenderloin:[4,2],bear_rib:[5,2],
 bison_hump:[0,3],wolf_loin:[1,3],eagle_breast:[2,3],moonlit_hare:[3,3],blackwing_roast:[4,3],highland_goat_roast:[5,3],
 golden_mutton_rack:[0,4],kings_hart:[1,4],old_bear_rib:[2,4],great_bison_feast:[3,4],night_wolf_loin:[4,4],eagle_crown_roast:[5,4],
};
const rareIds=new Set(['hare_saddle','crow_breast','goat_tenderloin','mutton_rack','hart_tenderloin','bear_rib','bison_hump','wolf_loin','eagle_breast','moonlit_hare','blackwing_roast','highland_goat_roast','golden_mutton_rack','kings_hart','old_bear_rib','great_bison_feast','night_wolf_loin','eagle_crown_roast']);
const names:Record<string,string>={
 'Woodland mushrooms':'mushroom','Wild herbs':'herb','Woodland broth':'woodland_broth','Iron axe':'axe','Mining pick':'pickaxe','Hunter’s bow':'bow',
 'Builder’s hammer':'hammer','Marcher’s sword':'sword','Tempered sword':'fine_sword','Tempered marcher’s sword':'fine_sword','Oak timber':'wood',
 'Fieldstone':'stone','Iron ore':'iron','Wild flax':'fiber','Raw hare':'hare_meat','Raw crow':'crow_meat','Raw goat':'goat_meat','Raw mutton':'mutton',
 'Raw venison':'venison','Raw bear meat':'bear_meat','Raw bison':'bison_meat','Raw wolf meat':'wolf_meat','Raw eagle':'eagle_meat','Wild berries':'berries',
 'Prized hare saddle':'hare_saddle','Blackwing crow breast':'crow_breast','Highland goat tenderloin':'goat_tenderloin','Prime mutton rack':'mutton_rack','Hart tenderloin':'hart_tenderloin','Old-bear rib':'bear_rib','Bison hump cut':'bison_hump','Night-wolf loin':'wolf_loin','Crown eagle breast':'eagle_breast',
 'Rosemary hare':'roasted_hare','Charred crow skewer':'crow_skewer','Herbed goat chop':'herbed_goat','Hearth-roasted mutton':'hearth_mutton','Grilled venison':'grilled_venison',
 'Blackwood bear steak':'bear_steak','Bison herb roast':'bison_roast','Smoked wolf strips':'smoked_wolf','Highland eagle roast':'eagle_roast','Marcher’s stew':'hearty_stew',
 'Hare & mushroom pottage':'hare_pottage','Blackpot crow':'crow_blackpot','Goatberry stew':'goat_stew','Shepherd’s mutton pot':'mutton_stew','Berry-glazed venison':'venison_berry_roast','Bear & mushroom pottage':'bear_pottage','Bison trail stew':'bison_stew','Blackwood wolf broth':'wolf_broth','Highland eagle broth':'eagle_broth',
 'Hunter’s platter':'hunter_platter','Frontier mixed grill':'frontier_mixed_grill','Blackwood predator stew':'predator_stew',
 'Moonlit hare saddle':'moonlit_hare','Blackwing honey roast':'blackwing_roast','Highland tenderloin roast':'highland_goat_roast','Golden mutton rack':'golden_mutton_rack','King’s hart plate':'kings_hart','Old-bear honey rib':'old_bear_rib','Great bison feast':'great_bison_feast','Night-wolf loin roast':'night_wolf_loin','Eagle-crown roast':'eagle_crown_roast',
 'Cured hide':'hide','Crow crop':'crow_crop','Crow milk':'crow_milk','Wild honey':'wild_honey',
};
const recipeNames:Record<string,string>={
 'Woodland broth':'woodland_broth','Crow milk':'crow_milk','Marcher’s sword':'sword','Tempered marcher’s sword':'fine_sword',
 'Rosemary hare':'roasted_hare','Charred crow skewer':'crow_skewer','Herbed goat chop':'herbed_goat','Hearth-roasted mutton':'hearth_mutton','Grilled venison':'grilled_venison',
 'Blackwood bear steak':'bear_steak','Bison herb roast':'bison_roast','Smoked wolf strips':'smoked_wolf','Highland eagle roast':'eagle_roast','Marcher’s stew':'hearty_stew',
 'Hare & mushroom pottage':'hare_pottage','Blackpot crow':'crow_blackpot','Goatberry stew':'goat_stew','Shepherd’s mutton pot':'mutton_stew','Berry-glazed venison':'venison_berry_roast','Bear & mushroom pottage':'bear_pottage','Bison trail stew':'bison_stew','Blackwood wolf broth':'wolf_broth','Highland eagle broth':'eagle_broth',
 'Hunter’s platter':'hunter_platter','Frontier mixed grill':'frontier_mixed_grill','Blackwood predator stew':'predator_stew',
 'Moonlit hare saddle':'moonlit_hare','Blackwing honey roast':'blackwing_roast','Highland tenderloin roast':'highland_goat_roast','Golden mutton rack':'golden_mutton_rack','King’s hart plate':'kings_hart','Old-bear honey rib':'old_bear_rib','Great bison feast':'great_bison_feast','Night-wolf loin roast':'night_wolf_loin','Eagle-crown roast':'eagle_crown_roast',
};

if(typeof document!=='undefined'){
 void import('./fun-systems');
 void import('./loading-experience');
 void import('./ui-stack');
 void import('./backpack-ui');
 const pct=(n:number,max:number)=>max?`${n/max*100}%`:'0%';
 const rules=Object.entries(positions).map(([id,[x,y]])=>`.aw-item-icon[data-item="${id}"],.hotbar [data-item="${id}"]::before{background-position:${pct(x,5)} ${pct(y,6)}}`).join('\n');
 const expandedRules=Object.entries(expandedPositions).map(([id,[x,y]])=>`.aw-item-icon[data-item="${id}"],.hotbar [data-item="${id}"]::before{background-image:url('/assets/ui/rare-food-icons.svg');background-size:600% 500%;background-position:${pct(x,5)} ${pct(y,4)}}`).join('\n');
 const rareRules=[...rareIds].map(id=>`.aw-item-icon[data-item="${id}"]{filter:drop-shadow(0 0 3px #e3bd63) drop-shadow(0 2px 2px #0009)}`).join('\n');
 const style=document.createElement('style');
 style.dataset.alderwatchItemIcons='rare-food-v2';
 style.textContent=`
.aw-item-icon{display:inline-block;width:2.35rem;height:2.35rem;flex:0 0 auto;background-image:url('/assets/ui/item-icons.svg');background-size:600% 700%;background-repeat:no-repeat;filter:drop-shadow(0 2px 2px #0008);vertical-align:middle;image-rendering:auto}
.pack-item strong>.aw-item-icon{width:2.8rem;height:2.8rem;margin-right:.55rem}.pack-item strong{display:flex;align-items:center}
.loot-icon.aw-item-icon{width:2.8rem;height:2.8rem;font-size:0}
.recipe h3>.aw-item-icon{width:2.25rem;height:2.25rem;margin-right:.5rem}.recipe h3{display:flex;align-items:center}
.hotbar button{position:relative;padding-left:3.15rem!important}.hotbar button::before{content:'';position:absolute;left:.42rem;top:50%;transform:translateY(-50%);width:2.35rem;height:2.35rem;background-image:url('/assets/ui/item-icons.svg');background-size:600% 700%;background-repeat:no-repeat;filter:drop-shadow(0 2px 2px #0009);image-rendering:auto}
.hotbar button:nth-child(1)::before{background-position:60% 0}.hotbar button:nth-child(2)::before{background-position:80% 0}.hotbar button:nth-child(3)::before{background-position:20% 16.667%}.hotbar button:nth-child(4)::before{background-position:0 16.667%}.hotbar button:nth-child(5)::before{background-position:100% 0}
.vitals::before{content:''!important;width:2.15rem!important;height:2.15rem!important;left:.55rem!important;border:0!important;box-shadow:none!important;background:url('/assets/ui/status-icons.png') 0 0/400% 200% no-repeat!important;filter:drop-shadow(0 2px 2px #0009)}
.vitals::after{content:'';position:absolute;left:1.15rem;bottom:.36rem;width:1.15rem;height:1.15rem;background:url('/assets/ui/status-icons.png') 33.333% 0/400% 200% no-repeat;filter:drop-shadow(0 1px 2px #0009)}
.buffs::before{content:'';display:inline-block;width:1.45rem;height:1.45rem;margin-right:.35rem;vertical-align:-.32rem;background:url('/assets/ui/status-icons.png') 66.667% 100%/400% 200% no-repeat;filter:drop-shadow(0 1px 1px #0009)}
${rules}
${expandedRules}
${rareRules}`;
 document.head.append(style);

 const icon=(id:string)=>{const span=document.createElement('span');span.className='aw-item-icon';span.dataset.item=id;span.setAttribute('aria-hidden','true');return span;};
 const matchName=(text:string,map=names)=>Object.entries(map).find(([name])=>text.includes(name));
 const decorate=(root:ParentNode=document)=>{
  root.querySelectorAll<HTMLElement>('.pack-item strong:not([data-aw-icon])').forEach(el=>{const hit=matchName(el.textContent||'');if(!hit)return;const [name,id]=hit,count=(el.textContent||'').match(/×\d+/)?.[0]??'';el.textContent=`${name}${count?' '+count:''}`;el.prepend(icon(id));el.dataset.awIcon='1';});
  root.querySelectorAll<HTMLElement>('.loot-row:not([data-aw-icon])').forEach(row=>{const hit=matchName(row.querySelector('strong')?.textContent||'');if(!hit)return;const old=row.querySelector<HTMLElement>('.loot-icon');if(old){old.textContent='';old.classList.add('aw-item-icon');old.dataset.item=hit[1];}row.dataset.awIcon='1';});
  root.querySelectorAll<HTMLElement>('.recipe h3:not([data-aw-icon])').forEach(el=>{const hit=matchName(el.textContent||'',recipeNames);if(!hit)return;el.prepend(icon(hit[1]));el.dataset.awIcon='1';});
 };
 const tagHotbar=()=>document.querySelectorAll<HTMLElement>('.hotbar button').forEach(b=>{const hit=matchName(b.textContent||'');b.dataset.item=hit?.[1]??'';});
 const surface='.pack-item,.loot-row,.recipe,.hotbar';
 const relevant=(node:Node)=>node instanceof Element&&(node.matches(surface)||Boolean(node.querySelector(surface)));
 let queued=false;
 const refresh=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorate();tagHotbar();});};
 const observer=new MutationObserver(records=>{if(records.some(record=>Array.from(record.addedNodes).some(relevant)))refresh();});
 const start=()=>{decorate();tagHotbar();const ui=document.querySelector('#ui');if(ui)observer.observe(ui,{subtree:true,childList:true});else requestAnimationFrame(start);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
