import {GamePanels} from './game-panels';
import {RECIPES,type Recipe} from './definitions';
import {ITEMS,type ItemId,type PlayerState,type WorldState} from './state';
import {EXPANDED_RECIPE_IDS} from './crafting-expansion';
import {
 CATEGORY_LABELS,RARITY_LABELS,RECIPE_COLLECTIONS,closestStationForRecipe,collectionProgress,masteryRank,prerequisiteRecipe,
 recipeBookStats,recipeCategory,recipeCraftableAt,recipeDiscovered,recipeHint,recipeKnown,recipeMastered,recipeMissingIngredients,
 recipeOwned,recipeRarity,recipeReady,recipeSourcePlan,type RecipeCategory,
} from './recipe-compendium';

const installed=Symbol.for('alderwatch.recipe-book.v2');
const categoryOrder:RecipeCategory[]=['hearth','cookhouse','provisioning','processing','tools','trophy','banquet'];
const PIN_KEY='alderwatch.recipe.pin.v1';

function icon(item:ItemId){const span=document.createElement('span');span.className='aw-item-icon';span.dataset.item=item;span.setAttribute('aria-hidden','true');return span;}
function recipeForHeading(text:string){const clean=text.replace(/\s+/g,' ').trim();return RECIPES.find(r=>r.name===clean);}
function addHeadingIcon(heading:HTMLElement,recipe:Recipe){if(heading.querySelector('.aw-item-icon'))return;heading.prepend(icon(recipe.output));}
function prerequisiteName(recipe:Recipe){return prerequisiteRecipe(recipe)?.name??'the prerequisite recipe';}
function pinnedRecipeId(){try{return localStorage.getItem(PIN_KEY)??'';}catch{return '';}}
function setPinnedRecipe(id:string){try{id?localStorage.setItem(PIN_KEY,id):localStorage.removeItem(PIN_KEY);}catch{}}
function stationLabel(recipe:Recipe){return recipe.station==='campfire'?'campfire':'workbench';}
function nearestMatching(world:WorldState,player:PlayerState,recipe:Recipe){return closestStationForRecipe(world,player,recipe);}

function recipeStatus(world:WorldState,player:PlayerState,recipe:Recipe){
 if(recipeMastered(world,recipe))return '✓ Mastered in this save';
 if(!recipeDiscovered(world,player,recipe))return '??? Find the rare ingredient to reveal this recipe';
 if(!recipeKnown(world,recipe))return `🔒 Master ${prerequisiteName(recipe)} first`;
 const missing=recipeSourcePlan(player,recipe);if(missing.length){const first=missing[0];return `Need ${ITEMS[first.item].name} ×${first.missing} · ${first.source}`;}
 const station=nearestMatching(world,player,recipe);if(!station)return `Ingredients ready · no ${stationLabel(recipe)} exists yet`;
 if(station.distance>3.2)return `Ingredients ready · ${stationLabel(recipe)} ${Math.ceil(station.distance)}m away`;
 return `✓ Craftable now · makes ${recipe.count} × ${ITEMS[recipe.output].name}`;
}

function masteryToast(recipe:Recipe){
 let feed=document.querySelector<HTMLElement>('.recipe-mastery-feed');if(!feed){feed=document.createElement('div');feed.className='recipe-mastery-feed';document.body.append(feed);}
 const line=document.createElement('div');line.className='recipe-mastery-pop';line.innerHTML='<small>RECIPE MASTERED</small><strong></strong><span></span>';line.querySelector('strong')!.textContent=recipe.name;line.querySelector('span')!.textContent=`${ITEMS[recipe.output].name} · bulk/master methods may now unlock`;feed.prepend(line);while(feed.children.length>3)feed.lastElementChild?.remove();setTimeout(()=>line.remove(),6500);
}

function installStyle(){
 if(document.querySelector('style[data-alderwatch-recipe-book="v2"]'))return;
 const style=document.createElement('style');style.dataset.alderwatchRecipeBook='v2';style.textContent=`
.recipe.book-filtered-out,.book-card.book-filtered-out{display:none!important}
.recipe-toolbar{display:flex;gap:.45rem;flex-wrap:wrap;align-items:center;margin:.8rem 0 1rem;padding:.7rem;border:1px solid #8c744b55;background:#17140fbb;border-radius:.45rem}.recipe-toolbar button{font-size:.72rem;padding:.48rem .68rem}.recipe-toolbar .recipe-book-open{margin-right:auto;border-color:#c9a866;color:#f2ddb0}.recipe-toolbar button.active{background:#70572e;color:#fff4d7;border-color:#d9b96f}.recipe-toolbar-state{width:100%;font-size:.66rem;color:#aa9879;margin-top:.15rem}.recipe-toolbar-state strong{color:#ddc07d}.recipe[data-book-rarity="rare"]{border-color:#b78b3e99}.recipe[data-book-rarity="masterwork"]{border-color:#d3ae57;box-shadow:inset 0 0 18px #b2812817}.recipe[data-book-mastered="1"]::after{content:'✓ MASTERED';display:block;font-size:.62rem;letter-spacing:.12em;color:#9fca88;margin-top:.4rem}.recipe[data-book-known="0"]{opacity:.68}.recipe[data-book-known="0"] h3::after{content:' · LOCKED';font-size:.58rem;color:#c99c65;letter-spacing:.08em;margin-left:.35rem}.recipe.recipe-pinned{outline:1px solid #d6b565;box-shadow:inset 0 0 20px #d6b56512}
.recipe-book-panel{position:absolute;inset:3vh 3vw;z-index:50;overflow:auto;padding:1.2rem 1.35rem 2rem;border:1px solid #a88952;background:linear-gradient(155deg,#17130e 0%,#241b11 55%,#100d09 100%);box-shadow:0 22px 80px #000d;color:#eadfc8}.recipe-book-panel .book-close{position:sticky;top:0;float:right;z-index:5}.book-eyebrow{font-size:.68rem;letter-spacing:.18em;color:#bfa26b}.book-head{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(16rem,.6fr);gap:1rem;align-items:end}.book-head h2{font-size:2rem;margin:.25rem 0}.book-rank{color:#d9bd82;font-weight:700}.book-progress{height:.55rem;background:#090806;border:1px solid #725e3c;margin:.55rem 0}.book-progress i{display:block;height:100%;background:linear-gradient(90deg,#7c6437,#d0ae64)}.book-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:.45rem}.book-stat{padding:.55rem;background:#0f0d0a;border:1px solid #79623f55}.book-stat small{display:block;color:#9e8a67;font-size:.58rem;letter-spacing:.1em}.book-stat strong{font-size:1.15rem}
.book-pin{margin:1rem 0;padding:.8rem;border:1px solid #b9975a;background:linear-gradient(90deg,#21190e,#15110d);display:grid;grid-template-columns:minmax(12rem,.8fr) minmax(18rem,1.4fr) auto;gap:.8rem;align-items:start}.book-pin h3{margin:.1rem 0 .25rem;color:#f0d69a}.book-pin small{color:#b7a483}.book-pin-plan{font-size:.7rem;line-height:1.55}.book-pin-plan b{color:#d29a70}.book-pin button{white-space:nowrap}.book-pin.empty{opacity:.75}
.book-collections{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.55rem;margin:1rem 0}.book-collection{padding:.7rem;border:1px solid #6c5a3d;background:#15110d}.book-collection.complete{border-color:#94a968;box-shadow:inset 0 0 16px #6f8e3520}.book-collection strong{display:block}.book-collection small{display:block;color:#ad9d82;margin:.2rem 0 .45rem}.book-collection meter{width:100%}
.book-controls{position:sticky;top:0;z-index:4;padding:.65rem 0;background:#17130ef5;border-bottom:1px solid #6c5738}.book-search{width:min(30rem,100%);padding:.55rem .65rem;margin-bottom:.5rem;background:#0b0a08;border:1px solid #66543b;color:#eee0c4}.book-filters{display:flex;gap:.4rem;flex-wrap:wrap}.book-filters button.active{background:#7c6235;color:white}.book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(19rem,1fr));gap:.65rem;margin-top:.8rem}.book-card{padding:.8rem;border:1px solid #66543b;background:#110f0c;min-height:13rem;display:flex;flex-direction:column}.book-card.rare{border-color:#b58c44}.book-card.masterwork{border-color:#dfbd6d;box-shadow:inset 0 0 24px #d4a54416}.book-card.locked{opacity:.68}.book-card.mastered{background:linear-gradient(145deg,#11100c,#172012)}.book-card.pinned{outline:2px solid #b89450}.book-card h3{display:flex;align-items:center;gap:.45rem;margin:.15rem 0 .25rem}.book-card h3 .aw-item-icon{width:2.25rem;height:2.25rem}.book-meta{display:flex;gap:.35rem;flex-wrap:wrap;font-size:.59rem;letter-spacing:.08em;text-transform:uppercase;color:#c0aa80}.book-meta b{padding:.18rem .3rem;border:1px solid #6b583a}.book-desc{font-size:.78rem;color:#cbbca1;min-height:2.8rem}.book-cost{font-size:.68rem;line-height:1.55;color:#a9987b}.book-cost .enough{color:#a7c584}.book-cost .missing{color:#d58e77}.book-source{font-size:.62rem;color:#a98c69;margin-left:.35rem}.book-status{font-size:.69rem;margin:.55rem 0;color:#d2b779}.book-card.mastered .book-status{color:#9fc184}.book-card[data-craftable="1"]{outline:1px solid #7fa65b88}.book-actions{margin-top:auto;display:flex;gap:.4rem;flex-wrap:wrap}.book-actions button{font-size:.68rem}.book-actions .craft-now{border-color:#8dae65;color:#dff0c9}.book-actions .pin-active{border-color:#d4b367;color:#f2dca8}.inventory-recipe-button{margin:.4rem 0 .35rem!important;border-color:#b3925e!important;color:#efd9ab!important}.inventory-recipe-pin{font-size:.68rem;color:#bea77c;margin:0 0 .85rem}.inventory-recipe-pin strong{color:#ecd28e}.recipe-mastery-feed{position:fixed;right:1rem;top:5rem;z-index:120;display:grid;gap:.45rem}.recipe-mastery-pop{min-width:18rem;padding:.75rem .9rem;background:#15120d;border:1px solid #c3a25f;box-shadow:0 10px 35px #000b}.recipe-mastery-pop small,.recipe-mastery-pop strong,.recipe-mastery-pop span{display:block}.recipe-mastery-pop small{font-size:.57rem;letter-spacing:.14em;color:#c8a968}.recipe-mastery-pop strong{color:#f1dfb8;margin:.15rem 0}.recipe-mastery-pop span{font-size:.66rem;color:#a99a80}
@media(max-width:760px){.recipe-book-panel{inset:1vh 1vw;padding:.8rem}.book-head{grid-template-columns:1fr}.book-stats{grid-template-columns:repeat(2,1fr)}.book-grid{grid-template-columns:1fr}.book-pin{grid-template-columns:1fr}}
`;document.head.append(style);
}

function decorateCrafting(panel:any,stationId?:string){
 const content=panel.ui.querySelector('.panel-content') as HTMLElement|null;if(!content||content.querySelector('.recipe-toolbar'))return;
 const p=panel.player() as PlayerState,w=panel.authority.state as WorldState,activeStation=stationId?w.stations[stationId]:panel.nearestStation?.();
 const cards=[...content.querySelectorAll('.recipe')] as HTMLElement[],pinned=pinnedRecipeId();
 for(const card of cards){
  const h=card.querySelector('h3') as HTMLElement|null;if(!h)continue;const recipe=recipeForHeading(h.textContent??'');if(!recipe)continue;addHeadingIcon(h,recipe);
  const category=recipeCategory(recipe),rarity=recipeRarity(recipe),known=recipeKnown(w,recipe),mastered=recipeMastered(w,recipe),inventoryReady=recipeReady(w,p,recipe),craftable=recipeCraftableAt(w,p,recipe,activeStation?.id);
  card.dataset.recipeId=recipe.id;card.dataset.bookCategory=category;card.dataset.bookRarity=rarity;card.dataset.bookKnown=known?'1':'0';card.dataset.bookMastered=mastered?'1':'0';card.dataset.bookReady=inventoryReady?'1':'0';card.dataset.bookCraftable=craftable?'1':'0';card.classList.toggle('recipe-pinned',recipe.id===pinned);
  if(!known){const button=card.querySelector('button') as HTMLButtonElement|null;if(button)button.textContent=`Master ${prerequisiteName(recipe)} first`;}
 }
 const toolbar=document.createElement('div');toolbar.className='recipe-toolbar';const open=document.createElement('button');open.className='recipe-book-open';open.textContent='📖 Recipe Book';open.onclick=()=>openBook(panel,()=>panel.crafting(stationId));toolbar.append(open);
 const filters:[string,string][]=[['all','All'],['craftable','Craftable here'],['cook','Cooking'],['provisioning','Provisioning'],['processing','Materials'],['tools','Tools'],['trophy','Trophy'],['banquet','Banquets']];let active='all';
 const state=document.createElement('div');state.className='recipe-toolbar-state';const craftableCount=cards.filter(card=>card.dataset.bookCraftable==='1').length;state.innerHTML=activeStation?`At <strong>${activeStation.name}</strong> · ${craftableCount} recipes craftable with what you carry`:`<strong>No crafting station in reach.</strong> The book can still plan ingredients, but crafting requires standing beside a campfire or workbench.`;
 const apply=()=>{for(const card of cards){const cat=card.dataset.bookCategory,show=active==='all'||active==='craftable'&&card.dataset.bookCraftable==='1'||active==='cook'&&(cat==='hearth'||cat==='cookhouse')||active===cat;card.classList.toggle('book-filtered-out',!show);}for(const b of toolbar.querySelectorAll('button[data-filter]'))b.classList.toggle('active',(b as HTMLElement).dataset.filter===active);};
 for(const [id,label] of filters){const b=document.createElement('button');b.dataset.filter=id;b.textContent=id==='craftable'?`${label} · ${craftableCount}`:label;b.onclick=()=>{active=id;apply();};toolbar.append(b);}toolbar.append(state);content.insertBefore(toolbar,content.firstChild);apply();
 const pinnedCard=cards.find(card=>card.dataset.recipeId===pinned);if(pinnedCard)content.insertBefore(pinnedCard,toolbar.nextSibling);
}

function decorateInventory(panel:any){
 const content=panel.ui.querySelector('.panel-content') as HTMLElement|null;if(!content||content.querySelector('.inventory-recipe-button'))return;
 const b=document.createElement('button');b.className='inventory-recipe-button';b.textContent='📖 Open Recipe Book';b.onclick=()=>openBook(panel,()=>panel.inventory());content.insertBefore(b,content.firstChild);
 const pinned=RECIPES.find(recipe=>recipe.id===pinnedRecipeId());if(pinned){const p=panel.player() as PlayerState,plan=recipeSourcePlan(p,pinned),line=document.createElement('div');line.className='inventory-recipe-pin';line.innerHTML=`📌 <strong>${pinned.name}</strong> · ${plan.length?plan.map(row=>`${ITEMS[row.item].name} ${row.have}/${row.need}`).join(' · '):'ingredients packed'}`;content.insertBefore(line,b.nextSibling);}
}

function renderPinned(root:HTMLElement,world:WorldState,player:PlayerState,onChange:()=>void){
 const host=root.querySelector('.book-pin') as HTMLElement,pinned=RECIPES.find(recipe=>recipe.id===pinnedRecipeId());host.innerHTML='';
 if(!pinned){host.classList.add('empty');const text=document.createElement('div');text.innerHTML='<h3>📌 No recipe pinned</h3><small>Pin anything in the book to turn it into a persistent shopping list.</small>';host.append(text);return;}
 host.classList.remove('empty');const title=document.createElement('div');title.innerHTML='<small>PINNED RECIPE</small><h3></h3><div></div>';title.querySelector('h3')!.textContent=pinned.name;title.querySelector('div')!.textContent=recipeStatus(world,player,pinned);
 const plan=document.createElement('div');plan.className='book-pin-plan';const source=recipeSourcePlan(player,pinned);if(source.length)for(const row of source){const d=document.createElement('div');d.innerHTML=`<b>${ITEMS[row.item].name} ${row.have}/${row.need}</b> · ${row.source}`;plan.append(d);}else plan.textContent='✓ Every ingredient is in your pack. Get to the correct station and cook/craft it.';
 const clear=document.createElement('button');clear.textContent='Unpin';clear.onclick=()=>{setPinnedRecipe('');onChange();};host.append(title,plan,clear);
}

function openBook(panel:any,back:()=>void){
 const w=panel.authority.state as WorldState,p=panel.player() as PlayerState,stats=recipeBookStats(w,p);panel.ui.innerHTML='';const root=document.createElement('section');root.className='recipe-book-panel';root.innerHTML='<button class="book-close">← Back</button><div class="book-eyebrow">THE ALDERWATCH RECIPE COMPENDIUM</div><div class="book-head"><div><h2>Hearth, Hunt & Handwork</h2><div class="book-rank"></div><div class="book-progress"><i></i></div></div><div class="book-stats"></div></div><div class="book-pin"></div><div class="book-collections"></div><div class="book-controls"><input class="book-search" type="search" placeholder="Search recipe, ingredient, food, tool…"><div class="book-filters"></div></div><div class="book-grid"></div>';
 root.querySelector<HTMLButtonElement>('.book-close')!.onclick=back;root.querySelector<HTMLElement>('.book-rank')!.textContent=`${masteryRank(stats.mastered)} · ${stats.mastered}/${stats.total} recipes mastered · ${stats.percent}% complete`;(root.querySelector('.book-progress i') as HTMLElement).style.width=stats.percent+'%';
 const statWrap=root.querySelector('.book-stats')!;for(const [label,value] of [['MASTERED',stats.mastered],['DISCOVERED',stats.discovered],['INGREDIENTS READY',stats.ready],['MASTERWORK',stats.masterwork]] as const){const s=document.createElement('div');s.className='book-stat';s.innerHTML='<small></small><strong></strong>';s.querySelector('small')!.textContent=label;s.querySelector('strong')!.textContent=String(value);statWrap.append(s);}
 const rerender=()=>openBook(panel,back);renderPinned(root,w,p,rerender);
 const shelves=root.querySelector('.book-collections')!;for(const collection of RECIPE_COLLECTIONS){const progress=collectionProgress(w,collection),card=document.createElement('article');card.className='book-collection'+(progress.complete?' complete':'');card.innerHTML='<strong></strong><small></small><meter min="0"></meter><div></div>';card.querySelector('strong')!.textContent=(progress.complete?'✓ ':'')+collection.name;card.querySelector('small')!.textContent=collection.description;const meter=card.querySelector('meter')!;meter.max=progress.total;meter.value=progress.mastered;card.querySelector('div')!.textContent=`${progress.mastered}/${progress.total}`;shelves.append(card);}
 const filters=root.querySelector('.book-filters')!,grid=root.querySelector('.book-grid')!,search=root.querySelector<HTMLInputElement>('.book-search')!;let active='all';const filterButtons:[string,string][]=[['all','All recipes'],['craftable','Craftable now'],['ready','Ingredients ready'],['mastered','Mastered'],['locked','Locked / undiscovered'],['pinned','Pinned'],...categoryOrder.map(c=>[c,CATEGORY_LABELS[c]] as [string,string])];const cards:HTMLElement[]=[];
 const sorted=[...RECIPES].sort((a,b)=>categoryOrder.indexOf(recipeCategory(a))-categoryOrder.indexOf(recipeCategory(b))||recipeRarity(a).localeCompare(recipeRarity(b))||a.name.localeCompare(b.name));
 for(const recipe of sorted){
  const discovered=recipeDiscovered(w,p,recipe),known=recipeKnown(w,recipe),mastered=recipeMastered(w,recipe),ready=recipeReady(w,p,recipe),category=recipeCategory(recipe),rarity=recipeRarity(recipe),station=nearestMatching(w,p,recipe),craftable=!!station&&recipeCraftableAt(w,p,recipe,station.station.id),pinned=recipe.id===pinnedRecipeId(),card=document.createElement('article');
  card.className=`book-card ${rarity}${known&&discovered?'':' locked'}${mastered?' mastered':''}${pinned?' pinned':''}`;card.dataset.category=category;card.dataset.ready=ready?'1':'0';card.dataset.craftable=craftable?'1':'0';card.dataset.mastered=mastered?'1':'0';card.dataset.known=known&&discovered?'1':'0';card.dataset.pinned=pinned?'1':'0';card.dataset.search=(recipe.name+' '+recipe.description+' '+Object.keys(recipe.cost).map(item=>ITEMS[item as ItemId]?.name??item).join(' ')).toLowerCase();
  const heading=document.createElement('h3');if(discovered)heading.append(icon(recipe.output),document.createTextNode(recipe.name));else heading.textContent='✧ Undiscovered trophy recipe';
  const meta=document.createElement('div');meta.className='book-meta';for(const text of [RARITY_LABELS[rarity],CATEGORY_LABELS[category],recipe.station==='campfire'?'Campfire':'Workbench',EXPANDED_RECIPE_IDS.has(recipe.id)?'Master Method':'Base Recipe']){const b=document.createElement('b');b.textContent=text;meta.append(b);}
  const desc=document.createElement('p');desc.className='book-desc';desc.textContent=discovered?recipe.description:'A rare ingredient exists somewhere in the March. Find it first; the recipe will reveal itself.';
  const cost=document.createElement('div');cost.className='book-cost';if(discovered)for(const [item,count] of Object.entries(recipe.cost)){const have=recipeOwned(p,item),line=document.createElement('div');line.className=have>=count?'enough':'missing';line.textContent=`${ITEMS[item as ItemId].name} · ${have}/${count}`;if(have<count){const source=document.createElement('span');source.className='book-source';source.textContent='— '+recipeSourcePlan(p,recipe).find(row=>row.item===item)?.source;line.append(source);}cost.append(line);}
  const status=document.createElement('div');status.className='book-status';status.textContent=recipeStatus(w,p,recipe);
  const actions=document.createElement('div');actions.className='book-actions';if(discovered){const pin=document.createElement('button');pin.textContent=pinned?'📌 Pinned':'📌 Pin recipe';pin.classList.toggle('pin-active',pinned);pin.onclick=()=>{setPinnedRecipe(pinned?'':recipe.id);rerender();};actions.append(pin);if(craftable&&station){const craft=document.createElement('button');craft.className='craft-now';craft.textContent=`Craft now · ×${recipe.count}`;craft.onclick=()=>{const wasMastered=recipeMastered(w,recipe),out=panel.command({type:'craft',playerId:p.id,recipeId:recipe.id,stationId:station.station.id});if(out?.ok&&!wasMastered)masteryToast(recipe);rerender();};actions.append(craft);}else{const why=document.createElement('button');why.disabled=true;if(!known)why.textContent=`Master ${prerequisiteName(recipe)} first`;else if(recipeMissingIngredients(p,recipe).length)why.textContent=`Missing ${recipeMissingIngredients(p,recipe).length} ingredient type${recipeMissingIngredients(p,recipe).length===1?'':'s'}`;else why.textContent=station?`${stationLabel(recipe)} · ${Math.ceil(station.distance)}m away`:`Build/find a ${stationLabel(recipe)}`;actions.append(why);}}
  card.append(heading,meta,desc,cost,status,actions);cards.push(card);grid.append(card);
 }
 const apply=()=>{const q=search.value.trim().toLowerCase();for(const card of cards){const categoryMatch=active==='all'||active==='craftable'&&card.dataset.craftable==='1'||active==='ready'&&card.dataset.ready==='1'||active==='mastered'&&card.dataset.mastered==='1'||active==='locked'&&card.dataset.known==='0'||active==='pinned'&&card.dataset.pinned==='1'||active===card.dataset.category;const searchMatch=!q||(card.dataset.search??'').includes(q);card.classList.toggle('book-filtered-out',!(categoryMatch&&searchMatch));}for(const b of filters.querySelectorAll('button'))b.classList.toggle('active',(b as HTMLElement).dataset.filter===active);};
 for(const [id,label] of filterButtons){const b=document.createElement('button');b.dataset.filter=id;b.textContent=label;b.onclick=()=>{active=id;apply();};filters.append(b);}search.oninput=apply;apply();panel.ui.append(root);
}

function install(){
 const g=globalThis as any;if(g[installed])return;g[installed]=true;installStyle();const proto=GamePanels.prototype as any,crafting=proto.crafting,inventory=proto.inventory;
 proto.crafting=function(stationId?:string){const out=crafting.call(this,stationId);decorateCrafting(this,stationId);return out;};
 proto.inventory=function(){const out=inventory.call(this);decorateInventory(this);return out;};
}

if(typeof document!=='undefined')install();
