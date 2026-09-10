import {addItem,ITEMS,loadWorld,saveWorld,type ItemId,type Vec3,type WorldState} from './state';
import {height} from './terrain';
import {AREA_ENTRY,CROWNROAD_VALE,DEEP_IRON_MINE,FAR_MARCH,IRONWARD_BASIN,IRONWARD_CROSSING,WOLFPINE,currentPlayer,requestAreaTravel} from './realm-save';
import {IRONWARD_CROSSING_GATE} from './far-march-realm-gates';
import {corpseId} from './wildlife-rules';
import {DEV_WILDLIFE_PREVIEW_PREFIX,DEV_WILDLIFE_SPECIES,createAuthoredWildlifeSpawn,formatAuthoredWildlifeExport,isAnimalKind,makeWildlifePreview,parseAuthoredWildlifeSpawns,type AuthoredWildlifeSpawn} from './wildlife-spawn-authoring';
import type {AnimalKind} from './wildlife-species';
import './dev-tools.css';

const ENABLE_KEY='alderwatch.devtools';
const DEV_SPAWN_KEY='alderwatch.devtools.spawn';
const DEV_RESUME_KEY='alderwatch.dev.resume';
const WILDLIFE_MARKS_KEY='alderwatch.devtools.wildlife-spawns';
const WILDLIFE_CAPTURE_KEY='alderwatch.devtools.wildlife-capture';
const WILDLIFE_REOPEN_KEY='alderwatch.devtools.wildlife-reopen';
const WILDLIFE_SELECTION_KEY='alderwatch.devtools.wildlife-selection';
const WILDLIFE_FLASH_KEY='alderwatch.devtools.wildlife-flash';
const query=new URLSearchParams(location.search);
const explicitEnable=query.get('dev')==='1';
if(explicitEnable)localStorage.setItem(ENABLE_KEY,'1');
if(query.get('dev')==='0')localStorage.removeItem(ENABLE_KEY);
const enabled=import.meta.env.DEV||localStorage.getItem(ENABLE_KEY)==='1';

interface DevSpawn {area:string;position:Vec3;yaw:number}
interface PendingWildlifeCapture {kind:AnimalKind;packId?:string}
interface WildlifeSelection {kind:AnimalKind;packId:string}
function world():WorldState|null{return loadWorld();}
function persist(w:WorldState){saveWorld(w);}
function reload(){location.reload();}
function areaName(w:WorldState|null){const p=w&&currentPlayer(w);return p?.areaId??FAR_MARCH;}
function stateText(){const w=world(),p=w&&currentPlayer(w);if(!w||!p)return 'No playable save loaded.';return `area: ${p.areaId??FAR_MARCH}\npos: ${p.position[0].toFixed(1)}, ${p.position[1].toFixed(1)}, ${p.position[2].toFixed(1)}\nyaw: ${p.yaw.toFixed(3)}\nhealth/stamina: ${Math.round(p.health)} / ${Math.round(p.stamina)}\ntick: ${Math.round(w.tick)}`;}
function teleport(x:number,z:number,yaw?:number){const w=world(),p=w&&currentPlayer(w);if(!w||!p)throw new Error('No playable save loaded');p.areaId=FAR_MARCH;p.position=[x,height(x,z)+.03,z];if(yaw!==undefined)p.yaw=yaw;persist(w);reload();}
function queueAreaSpawn(area:string,position:Vec3,yaw:number){sessionStorage.setItem(DEV_SPAWN_KEY,JSON.stringify({area,position,yaw} satisfies DevSpawn));requestAreaTravel(area as any);reload();}
function applyPendingDevSpawn(){const raw=sessionStorage.getItem(DEV_SPAWN_KEY);if(!raw)return;sessionStorage.removeItem(DEV_SPAWN_KEY);let spawn:DevSpawn;try{spawn=JSON.parse(raw) as DevSpawn;}catch{return;}if(!AREA_ENTRY[spawn.area]||!Array.isArray(spawn.position)||spawn.position.length!==3)return;const w=world(),p=w&&currentPlayer(w);if(!w||!p||p.areaId!==spawn.area)return;p.position=[...spawn.position] as Vec3;p.yaw=Number.isFinite(spawn.yaw)?spawn.yaw:0;persist(w);}
function travel(area:string){
 const normalized=area.toLowerCase();
 if(normalized==='greyhaven'||normalized==='grey')return queueAreaSpawn(CROWNROAD_VALE,[0,.03,-18],0);
 if(normalized==='wolfpinecamp'||normalized==='charcoal')return queueAreaSpawn(WOLFPINE,[0,.03,-44],0);
 const aliases:Record<string,string>={crossing:IRONWARD_CROSSING,ironward:IRONWARD_CROSSING,basin:IRONWARD_BASIN,mine:DEEP_IRON_MINE,deep:DEEP_IRON_MINE,deepiron:DEEP_IRON_MINE,vale:CROWNROAD_VALE,crownroad:CROWNROAD_VALE,wolf:WOLFPINE,wolfpine:WOLFPINE,march:FAR_MARCH,far:FAR_MARCH};const target=aliases[normalized]??area;if(!AREA_ENTRY[target])throw new Error(`Unknown area: ${area}`);requestAreaTravel(target as any);reload();
}
function heal(){const w=world(),p=w&&currentPlayer(w);if(!w||!p)throw new Error('No playable save loaded');p.health=999;p.stamina=999;persist(w);reload();}
function give(item:string,count=1){if(!(item in ITEMS))throw new Error(`Unknown item: ${item}`);const w=world(),p=w&&currentPlayer(w);if(!w||!p)throw new Error('No playable save loaded');addItem(w,p,item as ItemId,Math.max(1,Math.floor(count)));persist(w);reload();}

function wildlifeMarks(){return parseAuthoredWildlifeSpawns(localStorage.getItem(WILDLIFE_MARKS_KEY));}
function persistWildlifeMarks(marks:readonly AuthoredWildlifeSpawn[]){localStorage.setItem(WILDLIFE_MARKS_KEY,JSON.stringify(marks));}
function selectedWildlife():WildlifeSelection{
 try{const parsed=JSON.parse(localStorage.getItem(WILDLIFE_SELECTION_KEY)||'null') as Partial<WildlifeSelection>|null;if(parsed&&typeof parsed.kind==='string'&&isAnimalKind(parsed.kind))return {kind:parsed.kind,packId:typeof parsed.packId==='string'?parsed.packId:''};}catch{}
 return {kind:'deer',packId:''};
}
function persistWildlifeSelection(kind:AnimalKind,packId:string){localStorage.setItem(WILDLIFE_SELECTION_KEY,JSON.stringify({kind,packId} satisfies WildlifeSelection));}
function clearWildlifePreviewsFromWorld(w:WorldState){
 if(!w.animals)return;
 for(const id of Object.keys(w.animals))if(id.startsWith(DEV_WILDLIFE_PREVIEW_PREFIX)){delete w.animals[id];delete w.containers[corpseId(id)];}
}
function syncWildlifePreviews(w:WorldState,marks=wildlifeMarks()){
 clearWildlifePreviewsFromWorld(w);w.animals??={};
 for(const mark of marks){const preview=makeWildlifePreview(mark,height(mark.x,mark.z));w.animals[preview.id]=preview;}
}
function ensureFarMarchAuthoring(w:WorldState|null){const p=w&&currentPlayer(w);if(!w||!p)throw new Error('Enter a saved realm before painting wildlife');if((p.areaId??FAR_MARCH)!==FAR_MARCH)throw new Error('Wildlife spawn painting currently authors the Far March. Travel · Far March first.');return {w,p};}
function resumeAfterReload(){sessionStorage.setItem(DEV_RESUME_KEY,'play');sessionStorage.setItem(WILDLIFE_REOPEN_KEY,'1');}
function beginWildlifeCapture(kindRaw:string,packId=''){
 if(!isAnimalKind(kindRaw))throw new Error(`Unknown wildlife species: ${kindRaw}`);
 ensureFarMarchAuthoring(world());persistWildlifeSelection(kindRaw,packId);sessionStorage.setItem(WILDLIFE_CAPTURE_KEY,JSON.stringify({kind:kindRaw,packId:packId.trim()||undefined} satisfies PendingWildlifeCapture));resumeAfterReload();reload();
}
function applyPendingWildlifeCapture(){
 const raw=sessionStorage.getItem(WILDLIFE_CAPTURE_KEY);if(!raw)return;sessionStorage.removeItem(WILDLIFE_CAPTURE_KEY);
 let pending:PendingWildlifeCapture;try{pending=JSON.parse(raw) as PendingWildlifeCapture;}catch{return;}if(!pending||!isAnimalKind(pending.kind))return;
 const {w,p}=ensureFarMarchAuthoring(world()),marks=wildlifeMarks(),mark=createAuthoredWildlifeSpawn(pending.kind,p.position[0],p.position[2],p.yaw,marks,pending.packId);
 marks.push(mark);persistWildlifeMarks(marks);syncWildlifePreviews(w,marks);persist(w);sessionStorage.setItem(WILDLIFE_FLASH_KEY,`Dropped ${mark.kind} · ${mark.x.toFixed(1)}, ${mark.z.toFixed(1)}${mark.packId?` · group ${mark.packId}`:''}`);
}
function wildlifeSummary(){const marks=wildlifeMarks();if(!marks.length)return 'No painted wildlife spawn anchors yet.';return `${marks.length} painted spawn${marks.length===1?'':'s'}\n`+marks.slice(-8).reverse().map(mark=>`${mark.kind.padEnd(6)} ${mark.x.toFixed(1)}, ${mark.z.toFixed(1)} · ${mark.id}${mark.packId?` · ${mark.packId}`:''}`).join('\n');}
function refreshWildlifePreviews(){const {w}=ensureFarMarchAuthoring(world());syncWildlifePreviews(w);persist(w);resumeAfterReload();reload();return 'Refreshing wildlife previews';}
function clearWildlifePreviews(){const {w}=ensureFarMarchAuthoring(world());clearWildlifePreviewsFromWorld(w);persist(w);resumeAfterReload();reload();return 'Clearing wildlife previews';}
function removeWildlifeMark(id:string){const {w}=ensureFarMarchAuthoring(world()),marks=wildlifeMarks(),next=marks.filter(mark=>mark.id!==id);if(next.length===marks.length)throw new Error(`Unknown painted spawn: ${id}`);persistWildlifeMarks(next);syncWildlifePreviews(w,next);persist(w);resumeAfterReload();reload();return `Removed ${id}`;}
function undoWildlifeMark(){const marks=wildlifeMarks(),mark=marks.at(-1);if(!mark)throw new Error('No painted wildlife spawns to undo');return removeWildlifeMark(mark.id);}
function clearWildlifeMarks(){const {w}=ensureFarMarchAuthoring(world());persistWildlifeMarks([]);syncWildlifePreviews(w,[]);persist(w);resumeAfterReload();reload();return 'Cleared all painted wildlife spawns';}
function copyText(text:string){
 if(navigator.clipboard?.writeText){void navigator.clipboard.writeText(text);return true;}
 const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const copied=document.execCommand('copy');area.remove();return copied;
}
function copyWildlifeExport(){const marks=wildlifeMarks();if(!marks.length)throw new Error('Paint at least one wildlife spawn first');const output=formatAuthoredWildlifeExport(marks);if(!copyText(output))throw new Error('Clipboard unavailable — use window.AlderwatchDev.spawn.export()');return `Copied ${marks.length} ready-to-paste WILDLIFE_SPAWNS row${marks.length===1?'':'s'}`;}

function command(raw:string){const [op,...args]=raw.trim().split(/\s+/);if(!op)return 'Commands: status · tp x z · tp ironward · travel crossing|basin|mine|crownroad|greyhaven|wolfpine|march · heal · give ITEM [N] · spawnmark SPECIES [GROUP] · spawns · spawncopy · spawnpreview · spawnundo · spawnclear · reload';if(op==='status')return stateText();if(op==='reload'){reload();return 'reloading';}if(op==='heal'){heal();return 'healed';}if(op==='give'){give(args[0],Number(args[1]??1));return 'given';}if(op==='travel'){travel(args[0]??'crossing');return 'travelling';}if(op==='spawnmark'){beginWildlifeCapture(args[0]??'',args.slice(1).join('-'));return 'capturing';}if(op==='spawns')return wildlifeSummary();if(op==='spawncopy')return copyWildlifeExport();if(op==='spawnpreview')return refreshWildlifePreviews();if(op==='spawnundo')return undoWildlifeMark();if(op==='spawnclear')return clearWildlifeMarks();if(op==='spawnclearpreview')return clearWildlifePreviews();if(op==='tp'){if(args[0]==='ironward'){teleport(IRONWARD_CROSSING_GATE.x,IRONWARD_CROSSING_GATE.z);return 'teleporting';}const x=Number(args[0]),z=Number(args[1]);if(!Number.isFinite(x)||!Number.isFinite(z))throw new Error('Usage: tp X Z');teleport(x,z);return 'teleporting';}throw new Error(`Unknown command: ${op}`);}

function install(){
 if(!enabled)return;applyPendingDevSpawn();applyPendingWildlifeCapture();
 const reopen=sessionStorage.getItem(WILDLIFE_REOPEN_KEY)==='1';sessionStorage.removeItem(WILDLIFE_REOPEN_KEY);
 const selection=selectedWildlife();
 const toggle=document.createElement('button');toggle.className='aw-dev-toggle';toggle.textContent='DEV';toggle.title='Alderwatch developer tools · click or press F2';
 const panel=document.createElement('aside');panel.className='aw-dev-panel'+((explicitEnable||reopen)?'':' aw-dev-hidden');panel.setAttribute('aria-label','Alderwatch developer tools');
 const speciesOptions=DEV_WILDLIFE_SPECIES.map(kind=>`<option value="${kind}"${kind===selection.kind?' selected':''}>${kind.toUpperCase()}</option>`).join('');
 panel.innerHTML=`<header><strong>ALDERWATCH DEV TOOLS</strong><span class="aw-dev-badge">F2 · CLICK DEV</span></header><section><div class="aw-dev-state"></div></section><section><div class="aw-dev-grid"><button data-cmd="tp ironward">TP · Ironward gate</button><button data-cmd="travel crossing">Travel · Crossing</button><button data-cmd="travel basin">Travel · Basin</button><button data-cmd="travel mine">Travel · Deep Iron</button><button data-cmd="travel crownroad">Travel · Crownroad</button><button data-cmd="travel greyhaven">Jump · Greyhaven</button><button data-cmd="travel wolfpine">Travel · Wolfpine</button><button data-cmd="travel charcoal">Jump · Charcoal Camp</button><button data-cmd="travel march">Return · Far March</button><button data-cmd="heal">Heal / stamina</button><button data-cmd="reload">Reload area</button></div></section><section class="aw-dev-spawn"><div class="aw-dev-section-title"><strong>WILDLIFE SPAWN PAINTER</strong><span class="aw-dev-badge">F6</span></div><div class="aw-dev-spawn-row"><select class="aw-dev-spawn-kind" aria-label="Wildlife species">${speciesOptions}</select><input class="aw-dev-spawn-pack" spellcheck="false" value="${selection.packId.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}" placeholder="group / pack (optional)"><button class="aw-dev-spawn-drop">DROP HERE · F6</button></div><div class="aw-dev-spawn-actions"><button data-spawn-action="copy">COPY TS</button><button data-spawn-action="preview">PREVIEW ALL</button><button data-spawn-action="undo">UNDO LAST</button><button data-spawn-action="clear-preview">HIDE PREVIEWS</button><button data-spawn-action="clear">CLEAR MARKS</button></div><div class="aw-dev-spawn-list"></div><p class="aw-dev-help">Stand where the habitat anchor belongs, face the preferred direction, then DROP HERE. The one reload captures your exact live pose and immediately shows real animal previews. COPY TS emits ready-to-paste <code>fresh(...)</code> rows; it does not alter the shipping spawn table.</p></section><section><div class="aw-dev-command"><input spellcheck="false" placeholder="status | spawnmark deer | spawns | give iron 99"><button>RUN</button></div><div class="aw-dev-log"></div></section>`;
 document.body.append(toggle,panel);
 const log=panel.querySelector<HTMLElement>('.aw-dev-log')!,input=panel.querySelector<HTMLInputElement>('.aw-dev-command input')!,kindSelect=panel.querySelector<HTMLSelectElement>('.aw-dev-spawn-kind')!,packInput=panel.querySelector<HTMLInputElement>('.aw-dev-spawn-pack')!,spawnList=panel.querySelector<HTMLElement>('.aw-dev-spawn-list')!;
 const run=(value:string)=>{try{log.textContent=command(value);}catch(error){log.textContent=error instanceof Error?error.message:String(error);log.classList.add('aw-dev-danger');return;}log.classList.remove('aw-dev-danger');refresh();};
 const renderSpawnList=()=>{const marks=wildlifeMarks();spawnList.innerHTML=marks.length?'': '<span class="aw-dev-muted">No painted anchors yet.</span>';for(const mark of marks.slice(-7).reverse()){const row=document.createElement('div');row.className='aw-dev-spawn-item';const label=document.createElement('span');label.textContent=`${mark.kind} · ${mark.x.toFixed(1)}, ${mark.z.toFixed(1)}${mark.packId?` · ${mark.packId}`:''}`;const remove=document.createElement('button');remove.textContent='×';remove.title=`Remove ${mark.id}`;remove.onclick=()=>run(`spawnremove ${mark.id}`);row.append(label,remove);spawnList.append(row);}};
 const refresh=()=>{panel.querySelector<HTMLElement>('.aw-dev-state')!.textContent=stateText();renderSpawnList();};refresh();
 const selected=()=>({kind:kindSelect.value as AnimalKind,packId:packInput.value.trim()});
 const rememberSelection=()=>{const value=selected();persistWildlifeSelection(value.kind,value.packId);};kindSelect.onchange=rememberSelection;packInput.oninput=rememberSelection;
 const drop=()=>{const value=selected();try{beginWildlifeCapture(value.kind,value.packId);}catch(error){log.textContent=error instanceof Error?error.message:String(error);log.classList.add('aw-dev-danger');}};
 panel.querySelector<HTMLButtonElement>('.aw-dev-spawn-drop')!.onclick=drop;
 for(const button of panel.querySelectorAll<HTMLButtonElement>('[data-spawn-action]'))button.onclick=()=>{const action=button.dataset.spawnAction;if(action==='copy')run('spawncopy');else if(action==='preview')run('spawnpreview');else if(action==='undo')run('spawnundo');else if(action==='clear-preview')run('spawnclearpreview');else if(action==='clear')run('spawnclear');};
 const flash=sessionStorage.getItem(WILDLIFE_FLASH_KEY);if(flash){sessionStorage.removeItem(WILDLIFE_FLASH_KEY);log.textContent=flash;}
 const togglePanel=()=>{panel.classList.toggle('aw-dev-hidden');refresh();if(!panel.classList.contains('aw-dev-hidden'))input.focus();};
 toggle.onclick=togglePanel;
 for(const button of panel.querySelectorAll<HTMLButtonElement>('[data-cmd]'))button.onclick=()=>run(button.dataset.cmd!);
 panel.querySelector<HTMLButtonElement>('.aw-dev-command button')!.onclick=()=>run(input.value);
 input.onkeydown=e=>{if(e.key==='Enter')run(input.value);e.stopPropagation();};packInput.onkeydown=e=>e.stopPropagation();kindSelect.onkeydown=e=>e.stopPropagation();
 window.addEventListener('keydown',e=>{
  if((e.code==='F2'||e.code==='Backquote')&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();togglePanel();return;}
  if(e.code==='F6'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();drop();}
 },true);
 (window as any).AlderwatchDev={command,state:()=>stateText(),teleport,travel,enabled:true,area:()=>areaName(world()),toggle:togglePanel,spawn:{marks:wildlifeMarks,drop:beginWildlifeCapture,export:()=>formatAuthoredWildlifeExport(wildlifeMarks()),preview:refreshWildlifePreviews,clearPreviews:clearWildlifePreviews}};
 console.info('Alderwatch dev tools enabled. Click DEV or press F2. Wildlife painter: choose species, stand on an anchor, press F6.');
}

if(typeof window!=='undefined')install();
