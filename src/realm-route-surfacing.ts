import {loadWorld,type Vec3,type WorldState} from './state';
import {CROWNROAD_VALE,DEEP_IRON_MINE,FAR_MARCH,IRONWARD_BASIN,IRONWARD_CROSSING,WOLFPINE,currentPlayer,requestAreaTravel} from './realm-save';
import './realm-route-surfacing.css';
import './area-gameplay-shell.css';

export interface RealmRouteStop{areaId:string;name:string;direction:string;detail:string;kind:'area'|'landmark'}
interface AtlasBounds{minX:number;maxX:number;minZ:number;maxZ:number}
interface AtlasLandmark{label:string;position:Vec3;kind:'settlement'|'gate'|'site'|'danger'}

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
  {areaId:WOLFPINE,name:'Wolfpine',direction:"KING'S EAST GATE",detail:'Outer pine country · charcoal camp · Bent Spear Stockade',kind:'area'},
 ],
 [WOLFPINE]:[
  {areaId:CROWNROAD_VALE,name:'Crownroad Vale · Greyhaven',direction:"KING'S WEST GATE",detail:'Return west along the old Crownroad',kind:'area'},
  {areaId:WOLFPINE,name:'Wolfpine Charcoal Camp',direction:'CHARCOAL TRACK',detail:'Shelter and working camp south of the King’s road',kind:'landmark'},
  {areaId:WOLFPINE,name:'The Bent Spear Stockade',direction:'EAST WOODS',detail:'Fortified camp controlling the outer trail',kind:'landmark'},
 ],
};

export function realmRoutes(areaId:string):readonly RealmRouteStop[]{return REALM_ROUTE_GRAPH[areaId]??[];}
export function realmRouteAtlasText(){return 'Far March → Ironward Crossing → Ironward Basin / Gatewatch → north: Deep Iron · east: Crownroad Vale / Greyhaven → King’s East Gate → Wolfpine';}

function activeArea(){const world=loadWorld(),player=world&&currentPlayer(world);return player?.areaId??FAR_MARCH;}
function transition(target:RealmRouteStop){requestAreaTravel(target.areaId as any);const cover=document.createElement('div');cover.className='realm-transition-loader realm-route-transition';cover.innerHTML='<div class="realm-loader-card"><div class="sigil"><span>A</span></div><small>ALDERWATCH ROAD</small><h2></h2><div class="realm-loader-status"></div><div class="realm-loader-track"><i></i></div></div>';cover.querySelector('h2')!.textContent=target.name.toUpperCase();cover.querySelector<HTMLElement>('.realm-loader-status')!.textContent=target.detail;document.body.append(cover);requestAnimationFrame(()=>requestAnimationFrame(()=>location.reload()));}
function row(stop:RealmRouteStop,action=false){const el=document.createElement('div');el.className='realm-route-row '+stop.kind;el.innerHTML='<div><small></small><strong></strong><span></span></div>';el.querySelector('small')!.textContent=stop.direction;el.querySelector('strong')!.textContent=stop.name;el.querySelector('span')!.textContent=stop.detail;if(action){const button=document.createElement('button');button.type='button';button.textContent='CONTINUE →';button.onclick=()=>transition(stop);el.append(button);}return el;}
function mountAreaPanel(areaId:string){if(areaId===FAR_MARCH||document.querySelector('.realm-route-panel'))return;const routes=realmRoutes(areaId),panel=document.createElement('aside');panel.className='realm-route-panel';panel.setAttribute('aria-label','Realm routes');panel.innerHTML='<header><small>REALM ROUTES</small><strong></strong></header><div class="realm-route-list"></div><footer>Physical gates remain live · route buttons are temporary surfacing while road handoffs mature</footer>';panel.querySelector('header strong')!.textContent=areaId===IRONWARD_CROSSING?'THE ROAD CONTINUES':areaId===CROWNROAD_VALE?'THE KING’S ROAD CONTINUES':'BEYOND THIS AREA';const list=panel.querySelector<HTMLElement>('.realm-route-list')!;for(const stop of routes){const direct=(areaId===IRONWARD_CROSSING&&stop.areaId===IRONWARD_BASIN)||(areaId===CROWNROAD_VALE&&stop.areaId===WOLFPINE);list.append(row(stop,direct));}document.body.append(panel);}
function injectWorldAtlas(){const sidebar=document.querySelector<HTMLElement>('.world-map-sidebar');if(!sidebar||sidebar.dataset.realmAtlas==='1')return;sidebar.dataset.realmAtlas='1';const existing=sidebar.querySelector<HTMLElement>('.world-map-routes button span');if(existing)existing.textContent='Ironward Crossing → Gatewatch → Crownroad / Deep Iron → Wolfpine';const section=document.createElement('section');section.className='realm-atlas-card';section.innerHTML='<small>BEYOND THE FAR MARCH</small><h3>THE EASTERN REALM ROAD</h3><div class="realm-atlas-chain"><b>FAR MARCH</b><i>→</i><b>IRONWARD CROSSING</b><i>→</i><b>GATEWATCH</b></div><div class="realm-atlas-split"><span>↑ NORTH · <strong>DEEP IRON</strong></span><span>→ EAST · <strong>CROWNROAD · GREYHAVEN</strong></span><span>→ FAR EAST · <strong>WOLFPINE</strong></span></div><p>Gatewatch splits north to Deep Iron and east to Greyhaven. The King’s East Gate beyond Greyhaven now opens into Wolfpine.</p>';const routes=sidebar.querySelector('.world-map-routes');routes?.after(section);if(!routes)sidebar.prepend(section);}

let fallbackAtlas:HTMLElement|undefined,atlasOpening=false;
const atlasBlockedKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space','Tab','KeyJ','KeyB','KeyC','KeyQ','KeyE','KeyF','Digit1','Digit2','Digit3','Digit4','Digit5']);
function cursor(open:boolean){window.dispatchEvent(new CustomEvent('alderwatch:map-cursor',{detail:{open}}));}
function mapPoint(position:Vec3,bounds:AtlasBounds){const w=Math.max(.001,bounds.maxX-bounds.minX),h=Math.max(.001,bounds.maxZ-bounds.minZ);return{x:Math.max(0,Math.min(100,(position[0]-bounds.minX)/w*100)),y:Math.max(0,Math.min(100,(position[2]-bounds.minZ)/h*100))};}
function closeFallbackAtlas(){const open=!!fallbackAtlas?.isConnected;fallbackAtlas?.remove();fallbackAtlas=undefined;if(open)cursor(false);}
async function atlasData(areaId:string,world:WorldState):Promise<{name:string;bounds:AtlasBounds;landmarks:AtlasLandmark[];footer:string}|undefined>{
 if(areaId===CROWNROAD_VALE){const {CROWNROAD_CELL,CROWNROAD_HALF,CROWNROAD_POIS}=await import('./crownroad-world');const kind=(value:string):AtlasLandmark['kind']=>value==='city'||value==='village'?'settlement':value==='fort'||value==='crossing'?'gate':value==='ruin'?'danger':'site';return{name:'Crownroad Vale · Greyhaven',bounds:{minX:-CROWNROAD_HALF,maxX:CROWNROAD_HALF,minZ:-CROWNROAD_HALF,maxZ:CROWNROAD_HALF},landmarks:CROWNROAD_POIS.map(p=>({label:p.name,position:[p.cell.x*CROWNROAD_CELL,0,p.cell.z*CROWNROAD_CELL],kind:kind(p.kind)})),footer:"Greyhaven is at the centre of the King's Road · west returns to Gatewatch · east continues to Wolfpine"};}
 if(areaId===DEEP_IRON_MINE){const {DEEP_IRON_ROOMS,ensureDeepIron,nearestDeepIronRoom}=await import('./deep-iron-dungeon'),state=ensureDeepIron(world),player=currentPlayer(world),here=player&&nearestDeepIronRoom(player.position),known=new Set([...state.discovered,'entrance',...(here?[here.id]:[])]);return{name:'Deep Iron Mine',bounds:{minX:-52,maxX:52,minZ:-8,maxZ:106},landmarks:DEEP_IRON_ROOMS.filter(r=>known.has(r.id)).map(r=>({label:r.name,position:r.position,kind:r.feature==='lower-gate'?'danger':r.id==='entrance'?'gate':'site'})),footer:'Only discovered workings are charted · the mine entrance returns to Gatewatch'};}
}
async function openFallbackAtlas(areaId:string){if(atlasOpening||fallbackAtlas?.isConnected)return;atlasOpening=true;try{const world=loadWorld(),player=world&&currentPlayer(world),data=world&&await atlasData(areaId,world);if(!world||!player||!data)return;const overlay=document.createElement('section');overlay.className='area-map-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label',`${data.name} map`);overlay.innerHTML='<div class="area-map-card"><header><div><small>ALDERWATCH REALM ATLAS</small><h2></h2></div><button type="button">M / ESC · CLOSE</button></header><div class="area-map-field"><div class="area-map-grid"></div></div><footer><span>YOU</span><span></span></footer></div>';overlay.querySelector('h2')!.textContent=data.name.toUpperCase();overlay.querySelector<HTMLElement>('footer span:last-child')!.textContent=data.footer;overlay.querySelector<HTMLButtonElement>('header button')!.onclick=closeFallbackAtlas;const field=overlay.querySelector<HTMLElement>('.area-map-field')!,p=mapPoint(player.position,data.bounds),you=document.createElement('i');you.className='area-map-you';you.style.left=p.x+'%';you.style.top=p.y+'%';you.title='You';field.append(you);for(const landmark of data.landmarks){const q=mapPoint(landmark.position,data.bounds),pin=document.createElement('span');pin.className='area-map-pin '+landmark.kind;pin.style.left=q.x+'%';pin.style.top=q.y+'%';pin.innerHTML='<b></b><em></em>';pin.querySelector('b')!.textContent=landmark.kind==='gate'?'◆':landmark.kind==='settlement'?'⌂':landmark.kind==='danger'?'▲':'●';pin.querySelector('em')!.textContent=landmark.label;field.append(pin);}document.body.append(overlay);fallbackAtlas=overlay;cursor(true);}finally{atlasOpening=false;}}
function installFallbackAtlas(areaId:string){if(areaId!==DEEP_IRON_MINE&&areaId!==CROWNROAD_VALE)return;window.addEventListener('keydown',e=>{const target=e.target as HTMLElement|undefined;if(target?.matches('input,textarea,select'))return;const open=!!fallbackAtlas?.isConnected;if(open){if((e.code==='KeyM'||e.code==='Escape')&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();closeFallbackAtlas();return;}if(atlasBlockedKeys.has(e.code)){e.preventDefault();e.stopImmediatePropagation();}return;}if(e.code==='KeyM'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();void openFallbackAtlas(areaId);}},true);}
function install(){const area=activeArea();mountAreaPanel(area);installFallbackAtlas(area);injectWorldAtlas();const observer=new MutationObserver(()=>injectWorldAtlas());observer.observe(document.body,{childList:true,subtree:true});}

if(typeof document!=='undefined')install();
