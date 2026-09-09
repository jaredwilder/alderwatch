import {loadWorld} from './state';
import {CROWNROAD_VALE,DEEP_IRON_MINE,FAR_MARCH,IRONWARD_BASIN,IRONWARD_CROSSING,currentPlayer,requestAreaTravel} from './realm-save';
import './realm-route-surfacing.css';

export interface RealmRouteStop{areaId:string;name:string;direction:string;detail:string;kind:'area'|'landmark'}

export const REALM_ROUTE_GRAPH:Record<string,readonly RealmRouteStop[]>={
 [FAR_MARCH]:[
  {areaId:IRONWARD_CROSSING,name:'Ironward Crossing',direction:'EASTERN ROAD',detail:'Beyond the Ironward Heights route pin',kind:'area'},
 ],
 [IRONWARD_CROSSING]:[
  {areaId:FAR_MARCH,name:'The Far March',direction:'SOUTH GATE',detail:'Return along the old road',kind:'area'},
  {areaId:IRONWARD_BASIN,name:'Ironward Basin · Gatewatch',direction:'NORTH GATE',detail:'Continue through the checkpoint into the high basin',kind:'area'},
 ],
 [IRONWARD_BASIN]:[
  {areaId:IRONWARD_CROSSING,name:'Ironward Crossing',direction:'SOUTH EDGE',detail:'Old road back to the Far March',kind:'area'},
  {areaId:DEEP_IRON_MINE,name:'Deep Iron Mine',direction:'NORTH EDGE',detail:'Follow the Ironvein road beyond Gatewatch',kind:'area'},
  {areaId:CROWNROAD_VALE,name:'Crownroad Vale · Greyhaven',direction:'EAST EDGE',detail:"Take the King's Road; Greyhaven lies beyond",kind:'area'},
 ],
 [DEEP_IRON_MINE]:[
  {areaId:IRONWARD_BASIN,name:'Ironward Basin · Gatewatch',direction:'MINE ENTRANCE',detail:'Climb back to daylight',kind:'area'},
 ],
 [CROWNROAD_VALE]:[
  {areaId:IRONWARD_BASIN,name:'Ironward Basin · Gatewatch',direction:'WEST GATE',detail:"Return across Saint Orra's road",kind:'area'},
  {areaId:CROWNROAD_VALE,name:'Greyhaven',direction:"KING'S ROAD · CENTRE",detail:'Major city · market, residents and household services',kind:'landmark'},
  {areaId:CROWNROAD_VALE,name:"King's East Gate",direction:'FAR EAST',detail:'The old Crownroad continues beyond the current vale',kind:'landmark'},
 ],
};

export function realmRoutes(areaId:string):readonly RealmRouteStop[]{return REALM_ROUTE_GRAPH[areaId]??[];}
export function realmRouteAtlasText(){return 'Far March → Ironward Crossing → Ironward Basin / Gatewatch → north: Deep Iron · east: Crownroad Vale / Greyhaven';}

function activeArea(){const world=loadWorld(),player=world&&currentPlayer(world);return player?.areaId??FAR_MARCH;}
function transition(target:RealmRouteStop){
 requestAreaTravel(target.areaId as any);
 const cover=document.createElement('div');cover.className='realm-transition-loader realm-route-transition';cover.innerHTML='<div class="realm-loader-card"><div class="sigil"><span>A</span></div><small>ALDERWATCH ROAD</small><h2></h2><div class="realm-loader-status"></div><div class="realm-loader-track"><i></i></div></div>';cover.querySelector('h2')!.textContent=target.name.toUpperCase();cover.querySelector<HTMLElement>('.realm-loader-status')!.textContent=target.detail;document.body.append(cover);
 requestAnimationFrame(()=>requestAnimationFrame(()=>location.reload()));
}
function row(stop:RealmRouteStop,action=false){const el=document.createElement('div');el.className='realm-route-row '+stop.kind;el.innerHTML='<div><small></small><strong></strong><span></span></div>';el.querySelector('small')!.textContent=stop.direction;el.querySelector('strong')!.textContent=stop.name;el.querySelector('span')!.textContent=stop.detail;if(action){const button=document.createElement('button');button.type='button';button.textContent='CONTINUE →';button.onclick=()=>transition(stop);el.append(button);}return el;}
function mountAreaPanel(areaId:string){if(areaId===FAR_MARCH||document.querySelector('.realm-route-panel'))return;const routes=realmRoutes(areaId),panel=document.createElement('aside');panel.className='realm-route-panel';panel.setAttribute('aria-label','Realm routes');panel.innerHTML='<header><small>REALM ROUTES</small><strong></strong></header><div class="realm-route-list"></div><footer>Physical gates remain live · E at the marked road edge</footer>';panel.querySelector('header strong')!.textContent=areaId===IRONWARD_CROSSING?'THE ROAD CONTINUES':'BEYOND THIS AREA';const list=panel.querySelector<HTMLElement>('.realm-route-list')!;for(const stop of routes){const direct=areaId===IRONWARD_CROSSING&&stop.areaId===IRONWARD_BASIN;list.append(row(stop,direct));}document.body.append(panel);}
function injectWorldAtlas(){const sidebar=document.querySelector<HTMLElement>('.world-map-sidebar');if(!sidebar||sidebar.dataset.realmAtlas==='1')return;sidebar.dataset.realmAtlas='1';const existing=sidebar.querySelector<HTMLElement>('.world-map-routes button span');if(existing)existing.textContent='Ironward Crossing → Gatewatch → Crownroad / Deep Iron';const section=document.createElement('section');section.className='realm-atlas-card';section.innerHTML='<small>BEYOND THE FAR MARCH</small><h3>THE EASTERN REALM ROAD</h3><div class="realm-atlas-chain"><b>FAR MARCH</b><i>→</i><b>IRONWARD CROSSING</b><i>→</i><b>GATEWATCH</b></div><div class="realm-atlas-split"><span>↑ NORTH · <strong>DEEP IRON</strong></span><span>→ EAST · <strong>CROWNROAD · GREYHAVEN</strong></span></div><p>Route to the Eastern Road pin, enter the Crossing, then continue north. Gatewatch is the junction for both major regions.</p>';const routes=sidebar.querySelector('.world-map-routes');routes?.after(section);if(!routes)sidebar.prepend(section);}
function install(){const area=activeArea();mountAreaPanel(area);injectWorldAtlas();const observer=new MutationObserver(()=>injectWorldAtlas());observer.observe(document.body,{childList:true,subtree:true});}

if(typeof document!=='undefined')install();
