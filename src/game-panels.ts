import {BUILDS,FOOD,RECIPES,stats,type BuildKind} from './definitions';
import {ITEMS,quantity,type Command,type ItemId,type PlayerState,LocalAuthority} from './state';
import {distance} from './economy';
import {Building} from './building';
import {EXPEDITION_STOPS,bearing,expeditionProgress,expeditionObjective} from './expedition';
import {frontierObjective,REGIONS} from './worldgen';
import {BOUNTIES,bountyObjective} from './bounties';
import {askVillager,type DialogueTurn} from './dialogue';
import type {Villager} from './npc';
export class GamePanels {
 containerId='';
 /** Transcripts persist for the session so stepping away and back resumes the conversation. */
 conversations=new Map<string,DialogueTurn[]>();
 constructor(public ui:HTMLElement,public authority:LocalAuthority,public player:()=>PlayerState,public building:()=>Building,public resume:()=>void,public command:(c:Command)=>{ok:boolean;message:string}){}
 button(label:string,action:()=>void,parent:Element,disabled=false){const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=action;parent.append(b);return b;}
 shell(title:string,subtitle:string){this.ui.innerHTML='<section class="menu-card game-panel"><button class="back">← Return to the March</button><div class="eyebrow"></div><h2></h2><div class="panel-content"></div></section>';this.ui.querySelector<HTMLElement>('.back')!.onclick=this.resume;this.ui.querySelector('.eyebrow')!.textContent=subtitle;this.ui.querySelector('h2')!.textContent=title;return this.ui.querySelector<HTMLElement>('.panel-content')!;}
 inventory(){const p=this.player(),content=this.shell('The wanderer’s pack',p.archetype+' · '+p.inventory.length+' stacks');const grid=document.createElement('div');grid.className='pack-grid';content.append(grid);
  p.inventory.forEach((s,index)=>{const item=ITEMS[s.item],card=document.createElement('article');card.className='pack-item';card.innerHTML='<strong></strong><p></p><div class="item-actions"></div>';card.querySelector('strong')!.textContent=`${item.symbol} ${item.name} ×${s.count}`;card.querySelector('p')!.textContent=item.description;const actions=card.querySelector('div')!;const run=(c:Command)=>{this.command(c);this.inventory();};if(['axe','pickaxe','sword','fine_sword','hammer'].includes(s.item))this.button(p.equipped===s.item?'Equipped':'Equip',()=>run({type:'equip',playerId:p.id,item:s.item}),actions,p.equipped===s.item);if(FOOD[s.item])this.button('Eat',()=>run({type:'eat',playerId:p.id,item:s.item}),actions);this.button('Drop 1',()=>run({type:'drop',playerId:p.id,item:s.item,count:1}),actions);if(index)this.button('Move first',()=>run({type:'reorder',playerId:p.id,itemId:s.id,destination:0}),actions);grid.append(card);});
  const note=document.createElement('p');note.className='muted';const max=stats(p);note.textContent=`Health ${Math.ceil(p.health)} / ${max.health} · Stamina ${Math.ceil(p.stamina)} / ${max.stamina}. Dropped items remain in the world.`;content.append(note);
 }
 journal(){
  const p=this.player(),w=this.authority.state,progress=expeditionProgress(p),objective=frontierObjective(w,p)??bountyObjective(w,p)??expeditionObjective(w,p);
  const content=this.shell('Contracts & the Ash Road','FIELD JOURNAL · ALDERBROOK');content.classList.add('journal-content');
  const board=document.createElement('section');board.className='journal-route';content.append(board);
  for(const bounty of BOUNTIES){const site=w.bountySites?.[bounty.id],done=p.bounties?.completed.includes(bounty.id),active=p.bounties?.active===bounty.id,card=document.createElement('article');card.className='journal-stop'+(done?' complete':'');const title=document.createElement('h3');title.textContent=(done?'✓ ':active?'TRACKED · ':'BOUNTY · ')+bounty.name;const text=document.createElement('p');text.textContent=bounty.hint;const reward=document.createElement('small');reward.textContent=bounty.reward+(site?' · '+bearing(p.position,site.position):' · Camp location blocked');card.append(title,text,reward);if(!done)this.button(active?'Tracked on HUD':'Track bounty',()=>{this.command({type:'bounty',playerId:p.id,action:'accept',bountyId:bounty.id});this.journal();},card,active||!site);board.append(card);}

  if(w.frontier){const atlas=document.createElement('section');atlas.className='journal-stops';const title=document.createElement('h3');title.textContent='THE OPEN FRONTIER · Seed '+w.frontier.seed;const description=document.createElement('p');description.textContent=REGIONS.map(r=>r.name).join(' · ')+' — follow the south road or the east–west trail. Track a site to put it on your minimap.';content.append(title,description,atlas);
  for(const site of Object.values(w.frontier.sites)){const card=document.createElement('article');card.className='journal-stop';const heading=document.createElement('h3');heading.textContent=site.name;const detail=document.createElement('p');const guards=site.enemies.filter(id=>w.enemies[id]?.health>0).length;detail.textContent=bearing(p.position,site.position)+' · '+(guards?guards+' guards':site.kind==='rest'?'Watchfire, workbench & supplies':'Supply cache')+(w.containers[site.id]?.looted?' · Opened':'');card.append(heading,detail);this.button(p.frontierTarget===site.id?'Tracked on minimap':'Track location',()=>{this.command({type:'track_frontier',playerId:p.id,siteId:site.id});this.journal();},card,p.frontierTarget===site.id);atlas.append(card);}if(p.frontierTarget)this.button('Stop tracking frontier location',()=>{this.command({type:'track_frontier',playerId:p.id,siteId:''});this.journal();},content);}
  const intro=document.createElement('p');intro.className='journal-intro';intro.textContent=progress.completed?'Alderbrook’s couriers can travel again. You carry the title of Marchwarden. The supplies you brought back will help raise your home.':'Three couriers vanished along the eastern road. The Ash Company took their supplies and dispatches. Follow their trail, break the captain’s hold, and bring the dispatches back to Alderbrook.';content.append(intro);const nextStep=document.createElement('p');nextStep.className='journal-reward';nextStep.textContent='NEXT · '+objective.text+(objective.position?' · '+bearing(p.position,objective.position):'');content.append(nextStep);
  const map=document.createElement('div');map.className='route-map';map.setAttribute('aria-label','Expedition route map, north up');
  const dots=[{label:'Alderbrook · report',position:w.stations['alderbrook-bench'].position,done:progress.completed},...EXPEDITION_STOPS.flatMap(s=>w.expeditionSites?.[s.id]?[{label:s.name,position:w.expeditionSites[s.id].position,done:progress.recovered.includes(s.id)}]:[])];
  const project=(position:number[])=>({x:8+(position[0]+10)/90*84,y:8+(position[2]+120)/115*84});
  const points=dots.map(d=>project(d.position));
  map.innerHTML='<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="map-river" d="M17 100 Q12 75 15 55 T18 0"/><polyline class="map-route" points="'+points.map(v=>v.x+','+v.y).join(' ')+'"/></svg><span class="map-north">N ↑</span>';
  dots.forEach((dot,i)=>{const pin=document.createElement('span');pin.className='map-pin'+(dot.done?' done':'');pin.style.left=points[i].x+'%';pin.style.top=points[i].y+'%';pin.textContent=(dot.done?'✓ ':i?i+' · ':'⌂ ')+dot.label;map.append(pin);});
  const player=project(p.position);if(player.x>=0&&player.x<=100&&player.y>=0&&player.y<=100){const pin=document.createElement('span');pin.className='map-player';pin.style.left=player.x+'%';pin.style.top=player.y+'%';pin.textContent='◆ You';map.append(pin);}content.append(map);
  const route=document.createElement('div');route.className='journal-stops';content.append(route);
  EXPEDITION_STOPS.forEach((stop,i)=>{const site=w.expeditionSites?.[stop.id],done=progress.recovered.includes(stop.id),alive=site?.enemies.filter(id=>w.enemies[id]?.health>0).length;const card=document.createElement('article');card.className='journal-stop'+(done?' complete':'');const title=document.createElement('h3');title.textContent=(done?'✓ ':`0${i+1} · `)+stop.name;const text=document.createElement('p');text.textContent=stop.hint;const state=document.createElement('small');state.textContent=done?'Dispatch secured':site?bearing(p.position,site.position)+' · '+alive+(alive===1?' defender':' defenders'):'No clear campsite available';card.append(title,text,state);route.append(card);});
  const reward=document.createElement('p');reward.className='journal-reward';reward.textContent='MARCHWARDEN REWARD · +15 maximum health & stamina · +10% melee damage · tempered sword if needed · 12 iron · 6 hide · 3 stews. Dispatches survive death; loose materials do not.';content.append(reward);
  const actions=document.createElement('div');actions.className='journal-actions';content.insertBefore(actions,map);
  if(!progress.accepted)this.button('Accept · Follow the couriers',()=>{this.command({type:'expedition',playerId:p.id,action:'accept'});this.journal();},actions);
  else if(!progress.completed&&progress.recovered.length===EXPEDITION_STOPS.length)this.button('Report to Alderbrook · claim reward',()=>{this.command({type:'expedition',playerId:p.id,action:'report'});this.journal();},actions,Math.hypot(p.position[0]-7,p.position[2]+31)>3.2);
  this.button('Return to the road',this.resume,actions);const note=document.createElement('p');note.className='muted';note.textContent=objective.text+(objective.position?' · '+bearing(p.position,objective.position):'')+' · Q quick food · F heavy sword strike · RMB timed guard / parry · Space dodge';content.append(note);
 }
 dialogue(villager:Villager){
  let history=this.conversations.get(villager.id);
  if(!history){history=[{role:'assistant',content:villager.greeting}];this.conversations.set(villager.id,history);}
  const turns=history;
  const content=this.shell(villager.name,villager.role.toUpperCase()+' · ALDERBROOK');content.classList.add('dialogue-content');
  const log=document.createElement('div');log.className='dialogue-log';log.setAttribute('role','log');log.setAttribute('aria-live','polite');
  const form=document.createElement('form');form.className='dialogue-form';
  const field=document.createElement('input');field.type='text';field.maxLength=400;field.autocomplete='off';field.placeholder='Say something…';field.setAttribute('aria-label','Speak to '+villager.name);
  // The global key handler ignores events aimed at inputs, so Escape needs its own way out.
  field.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();this.resume();}};
  const send=document.createElement('button');send.type='submit';send.textContent='Speak';
  form.append(field,send);content.append(log,form);
  const note=document.createElement('p');note.className='muted';note.textContent='They answer in their own words. Esc or ← returns to the March.';content.append(note);
  // Model text is written with textContent, never innerHTML.
  const render=()=>{log.replaceChildren();for(const turn of turns){const line=document.createElement('p');line.className=turn.role==='user'?'dialogue-player':'dialogue-npc';
   line.textContent=(turn.role==='user'?'You':villager.name)+' · '+turn.content;log.append(line);}log.scrollTop=log.scrollHeight;};
  render();field.focus();
  let pending=false;
  form.onsubmit=async event=>{
   event.preventDefault();
   const said=field.value.trim();if(!said||pending)return;
   field.value='';turns.push({role:'user',content:said});render();
   pending=true;send.disabled=field.disabled=true;
   const waiting=document.createElement('p');waiting.className='dialogue-npc muted';waiting.textContent=villager.name+' considers…';log.append(waiting);log.scrollTop=log.scrollHeight;
   try{turns.push({role:'assistant',content:await askVillager(villager.id,said,turns.slice(0,-1))});}
   catch(error){turns.push({role:'assistant',content:(error as Error).message});}
   pending=false;send.disabled=field.disabled=false;render();field.focus();
  };
 }
 nearestStation(){const p=this.player();return Object.values(this.authority.state.stations).filter(s=>distance(s.position,p.position)<=3.2).sort((a,b)=>distance(a.position,p.position)-distance(b.position,p.position))[0];}
 crafting(stationId?:string){const p=this.player(),station=stationId?this.authority.state.stations[stationId]:this.nearestStation();const content=this.shell(station?.name??'Crafting & cooking',station?'STATION IN REACH':'FIND A CRAFTING STATION');
  if(station?.kind==='campfire')this.button('Rest by the fire · 1 timber',()=>{this.command({type:'rest',playerId:p.id,stationId:station.id});this.crafting(station.id);},content);
  if(station?.id==='alderbrook-bench')this.button('The Ash Road · journal / report',()=>this.journal(),content);
  if(!station){const note=document.createElement('p');note.textContent='Follow the stone road north to Alderbrook. The roadside campfire cooks food; the village workbench makes equipment. You can also build your own with B.';content.append(note);}
  for(const r of RECIPES.filter(r=>!station||station.kind===r.station)){const card=document.createElement('article');card.className='recipe';card.innerHTML='<div><h3></h3><p></p><small></small></div>';card.querySelector('h3')!.textContent=r.name;card.querySelector('p')!.textContent=r.description;card.querySelector('small')!.textContent=Object.entries(r.cost).map(([k,n])=>`${ITEMS[k as ItemId].name} ${quantity(p,k)}/${n}`).join(' · ');const unlocked=!r.requires||this.authority.state.progress.includes(r.requires);const affordable=Object.entries(r.cost).every(([k,n])=>quantity(p,k)>=n);this.button(unlocked?'Craft':'Craft the earlier blade first',()=>{if(!station)return;this.command({type:'craft',playerId:p.id,recipeId:r.id,stationId:station.id});this.crafting(station.id);},card,!station||!unlocked||!affordable);content.append(card);}
 }
 storage(id:string){this.containerId=id;const box=this.authority.state.containers[id];if(!box)return this.resume();const p=this.player(),content=this.shell(box.name,'SUPPLIES');const columns=document.createElement('div');columns.className='storage-columns';content.append(columns);for(const [title,source,direction] of [['Your pack',p,'deposit'],['Chest',box,'withdraw']] as const){const column=document.createElement('div');column.innerHTML='<h3></h3>';column.querySelector('h3')!.textContent=title;for(const s of source.inventory)this.button(`${ITEMS[s.item].name} ×${s.count} ${direction==='deposit'?'→':'←'}`,()=>{this.command({type:'transfer',playerId:p.id,containerId:id,item:s.item,count:s.count,direction});this.storage(id);},column);if(!source.inventory.length){const text=document.createElement('p');text.className='muted';text.textContent='Empty';column.append(text);}columns.append(column);}}
 build(){const b=this.building(),panel=document.createElement('section');panel.className='build-panel';panel.innerHTML='<div class="eyebrow">RAISE A HOME</div><h2>Building</h2><div class="build-options"></div><p class="build-description"></p><p class="build-cost"></p><p class="build-validity" role="status"></p><p class="muted">Point at ground · Click to place<br>R rotate · X dismantle pointed piece<br>WASD move · Mouse look</p>';this.ui.append(panel);for(const [kind,def] of Object.entries(BUILDS))this.button(def.name,()=>{b.select(kind as BuildKind);this.updateBuild();},panel.querySelector('.build-options')!);this.button('B · Leave building',this.resume,panel);this.updateBuild();}
 updateBuild(){const b=this.building(),p=this.player(),def=BUILDS[b.kind],panel=this.ui.querySelector('.build-panel');if(!panel)return;panel.querySelector('.build-description')!.textContent=def.description;panel.querySelector('.build-cost')!.textContent=Object.entries(def.cost).map(([k,n])=>`${ITEMS[k as ItemId].name} ${quantity(p,k)}/${n}`).join(' · ');panel.querySelector('.build-validity')!.textContent=b.error||'Ready to build';for(const button of panel.querySelectorAll('.build-options button'))button.classList.toggle('selected',button.textContent===def.name);}
}
