import {addItem,ITEMS,loadWorld,saveWorld,type ItemId,type WorldState} from './state';
import {height} from './terrain';
import {AREA_ENTRY,CROWNROAD_VALE,DEEP_IRON_MINE,FAR_MARCH,IRONWARD_BASIN,IRONWARD_CROSSING,currentPlayer,requestAreaTravel} from './realm-save';
import {IRONWARD_CROSSING_GATE} from './far-march-realm-gates';
import './dev-tools.css';

const ENABLE_KEY='alderwatch.devtools';
const query=new URLSearchParams(location.search);
const explicitEnable=query.get('dev')==='1';
if(explicitEnable)localStorage.setItem(ENABLE_KEY,'1');
if(query.get('dev')==='0')localStorage.removeItem(ENABLE_KEY);
const enabled=import.meta.env.DEV||localStorage.getItem(ENABLE_KEY)==='1';

function world():WorldState|null{return loadWorld();}
function persist(w:WorldState){saveWorld(w);}
function reload(){location.reload();}
function areaName(w:WorldState|null){const p=w&&currentPlayer(w);return p?.areaId??FAR_MARCH;}
function stateText(){const w=world(),p=w&&currentPlayer(w);if(!w||!p)return 'No playable save loaded.';return `area: ${p.areaId??FAR_MARCH}\npos: ${p.position[0].toFixed(1)}, ${p.position[1].toFixed(1)}, ${p.position[2].toFixed(1)}\nyaw: ${p.yaw.toFixed(3)}\nhealth/stamina: ${Math.round(p.health)} / ${Math.round(p.stamina)}\ntick: ${Math.round(w.tick)}`;}
function teleport(x:number,z:number,yaw?:number){const w=world(),p=w&&currentPlayer(w);if(!w||!p)throw new Error('No playable save loaded');p.areaId=FAR_MARCH;p.position=[x,height(x,z)+.03,z];if(yaw!==undefined)p.yaw=yaw;persist(w);reload();}
function travel(area:string){const aliases:Record<string,string>={crossing:IRONWARD_CROSSING,ironward:IRONWARD_CROSSING,basin:IRONWARD_BASIN,mine:DEEP_IRON_MINE,vale:CROWNROAD_VALE,march:FAR_MARCH,far:FAR_MARCH};const target=aliases[area]??area;if(!AREA_ENTRY[target])throw new Error(`Unknown area: ${area}`);requestAreaTravel(target as any);reload();}
function heal(){const w=world(),p=w&&currentPlayer(w);if(!w||!p)throw new Error('No playable save loaded');p.health=999;p.stamina=999;persist(w);reload();}
function give(item:string,count=1){if(!(item in ITEMS))throw new Error(`Unknown item: ${item}`);const w=world(),p=w&&currentPlayer(w);if(!w||!p)throw new Error('No playable save loaded');addItem(w,p,item as ItemId,Math.max(1,Math.floor(count)));persist(w);reload();}
function command(raw:string){const [op,...args]=raw.trim().split(/\s+/);if(!op)return 'Commands: status · tp x z · tp ironward · travel crossing|basin|mine|vale|march · heal · give ITEM [N] · reload';if(op==='status')return stateText();if(op==='reload'){reload();return 'reloading';}if(op==='heal'){heal();return 'healed';}if(op==='give'){give(args[0],Number(args[1]??1));return 'given';}if(op==='travel'){travel(args[0]??'crossing');return 'travelling';}if(op==='tp'){if(args[0]==='ironward'){teleport(IRONWARD_CROSSING_GATE.x,IRONWARD_CROSSING_GATE.z);return 'teleporting';}const x=Number(args[0]),z=Number(args[1]);if(!Number.isFinite(x)||!Number.isFinite(z))throw new Error('Usage: tp X Z');teleport(x,z);return 'teleporting';}throw new Error(`Unknown command: ${op}`);}

function install(){
 if(!enabled)return;
 const toggle=document.createElement('button');toggle.className='aw-dev-toggle';toggle.textContent='DEV';toggle.title='Alderwatch developer tools · click or press F2';
 const panel=document.createElement('aside');panel.className='aw-dev-panel'+(explicitEnable?'':' aw-dev-hidden');panel.setAttribute('aria-label','Alderwatch developer tools');
 panel.innerHTML='<header><strong>ALDERWATCH DEV TOOLS</strong><span class="aw-dev-badge">F2 · CLICK DEV</span></header><section><div class="aw-dev-state"></div></section><section><div class="aw-dev-grid"><button data-cmd="tp ironward">TP · Ironward gate</button><button data-cmd="travel crossing">Travel · Crossing</button><button data-cmd="travel basin">Travel · Basin</button><button data-cmd="travel march">Return · Far March</button><button data-cmd="heal">Heal / stamina</button><button data-cmd="reload">Reload area</button></div></section><section><div class="aw-dev-command"><input spellcheck="false" placeholder="status | tp 350 35 | give iron 99"><button>RUN</button></div><div class="aw-dev-log"></div></section>';
 document.body.append(toggle,panel);
 const refresh=()=>{panel.querySelector<HTMLElement>('.aw-dev-state')!.textContent=stateText();};refresh();
 const log=panel.querySelector<HTMLElement>('.aw-dev-log')!,input=panel.querySelector<HTMLInputElement>('input')!;
 const run=(value:string)=>{try{log.textContent=command(value);}catch(error){log.textContent=error instanceof Error?error.message:String(error);log.classList.add('aw-dev-danger');return;}log.classList.remove('aw-dev-danger');refresh();};
 const togglePanel=()=>{panel.classList.toggle('aw-dev-hidden');refresh();if(!panel.classList.contains('aw-dev-hidden'))input.focus();};
 toggle.onclick=togglePanel;
 for(const button of panel.querySelectorAll<HTMLButtonElement>('[data-cmd]'))button.onclick=()=>run(button.dataset.cmd!);
 panel.querySelector<HTMLButtonElement>('.aw-dev-command button')!.onclick=()=>run(input.value);
 input.onkeydown=e=>{if(e.key==='Enter')run(input.value);e.stopPropagation();};
 window.addEventListener('keydown',e=>{
  if((e.code==='F2'||e.code==='Backquote')&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();togglePanel();}
 },true);
 (window as any).AlderwatchDev={command,state:()=>stateText(),teleport,travel,enabled:true,area:()=>areaName(world()),toggle:togglePanel};
 console.info('Alderwatch dev tools enabled. Click DEV or press F2. window.AlderwatchDev.command("status")');
}

if(typeof window!=='undefined')install();
