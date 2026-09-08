import {WORLD_SIZE,REGIONS,regionAt,trailZ} from './worldgen';
import {height,roadX} from './terrain';
import type {WorldState,PlayerState,Vec3} from './state';
import {livingWorldBosses} from './world-bosses';

/** Camera-relative coordinates: screen up is the direction travelled with W. */
export function mapOffset(dx:number,dz:number,yaw:number,limit=80,scale=1.6){
 const x=(dx*Math.cos(yaw)+dz*Math.sin(yaw))*scale,y=(-dx*Math.sin(yaw)+dz*Math.cos(yaw))*scale;
 const length=Math.hypot(x,y),factor=length>limit?limit/length:1;
 return {x:x*factor,y:y*factor,offscreen:length>limit,angle:Math.atan2(x,-y)};
}
export function routeHint(from:Vec3,to:Vec3,yaw:number){
 const marker=mapOffset(to[0]-from[0],to[2]-from[2],yaw);
 const octant=(Math.round(marker.angle/(Math.PI/4))+8)%8;
 return {marker,distance:Math.round(Math.hypot(to[0]-from[0],to[2]-from[2])),direction:['Ahead','Ahead-right','Right','Behind-right','Behind','Behind-left','Left','Ahead-left'][octant],arrow:['↑','↗','→','↘','↓','↙','←','↖'][octant]};
}

/** North-up projection for the full 768 m March. */
export function worldMapPoint(position:Vec3){
 const half=WORLD_SIZE/2,x=(position[0]+half)/WORLD_SIZE*100,y=(position[2]+half)/WORLD_SIZE*100;
 return {x,y,inside:x>=0&&x<=100&&y>=0&&y<=100};
}
export function worldMapPosition(xPercent:number,yPercent:number):Vec3{
 const half=WORLD_SIZE/2;return [xPercent/100*WORLD_SIZE-half,0,yPercent/100*WORLD_SIZE-half];
}
/** Canvas arrow is authored pointing up; Alderwatch character forward is +Z (canvas down). */
export function worldMapFacingRotation(yaw:number){return Math.PI-yaw;}

export interface LargeGameSighting {id:string;kind:'bison'|'bear';position:Vec3;distance:number;massive:boolean;region:string}
export function largeGameSightings(w:WorldState,p:PlayerState):LargeGameSighting[]{
 return Object.values(w.animals??{}).filter(a=>(a.kind==='bison'||a.kind==='bear')&&!a.dead&&(a.health??1)>0).map(a=>({id:a.id,kind:a.kind as 'bison'|'bear',position:a.position,distance:Math.round(Math.hypot(a.position[0]-p.position[0],a.position[2]-p.position[2])),massive:a.id==='wild-bison-1',region:regionAt(a.position[0],a.position[2])})).sort((a,b)=>a.distance-b.distance);
}
interface MapTarget {position:Vec3;label:string;kind:'boss'|'wildlife'|'site'|'station'|'home'|'objective'|'route'}

export class MiniMap {
 private terrain?:HTMLCanvasElement;private canvas?:HTMLCanvasElement;private label?:HTMLElement;private nextUpdate=0;private nextWorldMapUpdate=0;private ui?:HTMLElement;private overlay?:HTMLElement;private lastWorld?:WorldState;private lastPlayer?:PlayerState;private lastObjective?:Vec3;private controlsBound=false;
 private waypoint?:{position:Vec3;label:string};private mapTargets:MapTarget[]=[];
 private ensureTerrain(){
  if(this.terrain)return this.terrain;
  const terrain=document.createElement('canvas');terrain.width=terrain.height=WORLD_SIZE;const ground=terrain.getContext('2d')!;
  for(let z=0;z<WORLD_SIZE;z+=4)for(let x=0;x<WORLD_SIZE;x+=4){const h=height(x-WORLD_SIZE/2,z-WORLD_SIZE/2),shade=Math.max(0,Math.min(18,h*3+5));ground.fillStyle=`rgb(${39+shade},${55+shade},${40+shade})`;ground.fillRect(x,z,4,4);}
  ground.fillStyle='#405e62';ground.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,r=1+.07*Math.sin(a*7)+.035*Math.sin(a*13),x=WORLD_SIZE/2-31+Math.cos(a)*10*r,y=WORLD_SIZE/2-12+Math.sin(a)*23*r;i?ground.lineTo(x,y):ground.moveTo(x,y);}ground.fill();
  ground.strokeStyle='#a99973';ground.lineWidth=3.8;ground.beginPath();for(let z=-384;z<=384;z+=4){const x=roadX(z)+384;z===-384?ground.moveTo(x,z+384):ground.lineTo(x,z+384);}ground.stroke();ground.beginPath();for(let x=-335;x<=335;x+=4){x===-335?ground.moveTo(x+384,trailZ(x)+384):ground.lineTo(x+384,trailZ(x)+384);}ground.stroke();
  this.terrain=terrain;return terrain;
 }
 private onKey=(e:KeyboardEvent)=>{
  const open=!!this.overlay?.isConnected;
  if(open){
   if(e.code==='KeyM'||e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)this.closeWorldMap();return;}
   if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space','Tab','KeyJ','KeyB','KeyC','KeyQ','KeyE','KeyF','Digit1','Digit2','Digit3','Digit4','Digit5'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}
   return;
  }
  if(e.code==='KeyM'&&!e.repeat&&this.canvas?.isConnected&&this.lastWorld&&this.lastPlayer){e.preventDefault();e.stopImmediatePropagation();this.openWorldMap();}
 };
 private bindControls(){if(this.controlsBound)return;this.controlsBound=true;window.addEventListener('keydown',this.onKey,true);}
 mount(ui:HTMLElement){
  this.ui=ui;if(this.overlay&&!this.overlay.isConnected)this.overlay=undefined;this.bindControls();
  const panel=document.createElement('aside');panel.className='minimap';panel.setAttribute('aria-label','Local navigation');
  this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=400;this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','Camera-up minimap: white arrow is you; gold marker is your objective or map pin');
  this.label=document.createElement('div');this.label.className='minimap-route';const legend=document.createElement('small');legend.textContent='M: world map · J: journal · Up: W';
  panel.append(this.canvas,this.label,legend);ui.append(panel);this.nextUpdate=0;
 }
 private suspendHeldInput(){for(const code of ['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space'])window.dispatchEvent(new KeyboardEvent('keyup',{code}));window.dispatchEvent(new MouseEvent('mouseup',{button:0}));window.dispatchEvent(new MouseEvent('mouseup',{button:2}));}
 private cursor(open:boolean){window.dispatchEvent(new CustomEvent('alderwatch:map-cursor',{detail:{open}}));}
 private openWorldMap(){
  if(!this.ui||!this.lastWorld||!this.lastPlayer)return;this.closeWorldMap();
  const overlay=document.createElement('section');overlay.className='world-map-overlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label','Interactive full map of the Far March');
  overlay.innerHTML='<div class="world-map-frame"><header><div><small>ALDERWATCH CARTOGRAPHY · LIVE</small><h2>THE FAR MARCH</h2></div><button class="world-map-close" type="button">M / ESC · CLOSE</button></header><div class="world-map-layout"><div class="world-map-canvas-wrap"><canvas width="768" height="768" aria-label="North-up interactive full world map"></canvas><span class="world-map-north">N ↑</span><span class="world-map-hover">Move cursor over the map · click anywhere to set a route pin</span></div><aside class="world-map-sidebar"><div class="world-map-you"></div><div class="world-map-selection"><small>ROUTE PIN</small><strong>Quest objective</strong><span>Click the map or a sighting to override navigation.</span><button type="button">CLEAR PIN</button></div><h3>WORLD BOSSES</h3><div class="world-map-bosses"></div><h3>LARGE GAME SIGHTINGS</h3><div class="world-map-sightings"></div><h3>KNOWN ROUTES</h3><div class="world-map-routes"><button type="button"><strong>Eastern Road</strong><span>Ironward Crossing · beyond this loaded March</span></button></div><div class="world-map-legend"><span>✹ World boss</span><span>★ Massive bison</span><span>● Bison</span><span>▲ Bear</span><span>◆ Route</span><span>⌂ Home / settlement</span></div><p>This is live world state. Click a boss, animal, landmark, or any point on the atlas to route the local minimap there. No fast travel.</p></aside></div></div>';
  this.ui.append(overlay);this.overlay=overlay;this.nextWorldMapUpdate=0;this.suspendHeldInput();this.cursor(true);
  overlay.querySelector<HTMLButtonElement>('.world-map-close')!.onclick=()=>this.closeWorldMap();
  overlay.querySelector<HTMLButtonElement>('.world-map-selection button')!.onclick=()=>{this.waypoint=undefined;this.renderWorldMap();};
  const eastern:Vec3=[350,height(350,35),35];overlay.querySelector<HTMLButtonElement>('.world-map-routes button')!.onclick=()=>this.setWaypoint(eastern,'Eastern Road · Ironward Crossing');
  const map=overlay.querySelector<HTMLCanvasElement>('canvas')!;
  map.addEventListener('click',e=>this.mapClick(e,map));map.addEventListener('mousemove',e=>this.mapHover(e,map));map.addEventListener('mouseleave',()=>{const label=this.overlay?.querySelector<HTMLElement>('.world-map-hover');if(label)label.textContent='Move cursor over the map · click anywhere to set a route pin';});
  this.renderWorldMap();
 }
 private closeWorldMap(){const open=!!this.overlay?.isConnected;this.overlay?.remove();this.overlay=undefined;if(open)this.cursor(false);}
 private setWaypoint(position:Vec3,label:string){this.waypoint={position:[position[0],height(position[0],position[2]),position[2]],label};this.renderWorldMap();}
 private eventPosition(e:MouseEvent,canvas:HTMLCanvasElement){const r=canvas.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));return worldMapPosition(x*100,y*100);}
 private nearestTarget(position:Vec3,limit=15){let found:MapTarget|undefined,best=limit;for(const target of this.mapTargets){const d=Math.hypot(target.position[0]-position[0],target.position[2]-position[2]);if(d<best){best=d;found=target;}}return found;}
 private mapClick(e:MouseEvent,canvas:HTMLCanvasElement){const position=this.eventPosition(e,canvas),target=this.nearestTarget(position);this.setWaypoint(target?.position??position,target?.label??`Map pin · ${regionAt(position[0],position[2])} · X ${Math.round(position[0])} Z ${Math.round(position[2])}`);}
 private mapHover(e:MouseEvent,canvas:HTMLCanvasElement){const position=this.eventPosition(e,canvas),target=this.nearestTarget(position),label=this.overlay?.querySelector<HTMLElement>('.world-map-hover');if(label)label.textContent=target?`${target.label} · click to route`:`${regionAt(position[0],position[2])} · X ${Math.round(position[0])} · Z ${Math.round(position[2])} · click to pin`;}
 private renderWorldMap(){
  if(!this.overlay||!this.lastWorld||!this.lastPlayer)return;const w=this.lastWorld,p=this.lastPlayer,canvas=this.overlay.querySelector<HTMLCanvasElement>('canvas')!,ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.clearRect(0,0,WORLD_SIZE,WORLD_SIZE);ctx.drawImage(this.ensureTerrain(),0,0);ctx.fillStyle='rgba(13,20,16,.14)';ctx.fillRect(0,0,WORLD_SIZE,WORLD_SIZE);this.mapTargets=[];
  const xy=(v:Vec3)=>({x:v[0]+WORLD_SIZE/2,y:v[2]+WORLD_SIZE/2}),target=(position:Vec3,label:string,kind:MapTarget['kind'])=>this.mapTargets.push({position,label,kind});
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 17px Georgia';for(const r of REGIONS){const q=xy([r.x,0,r.z]);ctx.fillStyle='rgba(239,222,177,.62)';ctx.fillText(r.name.toUpperCase(),q.x,q.y);}
  const dot=(v:Vec3,color:string,size:number)=>{const q=xy(v);ctx.fillStyle=color;ctx.beginPath();ctx.arc(q.x,q.y,size,0,Math.PI*2);ctx.fill();};
  for(const site of Object.values(w.frontier?.sites??{})){dot(site.position,'#d2b275',4);target(site.position,site.name,'site');}
  for(const station of Object.values(w.stations))if(station.kind==='workbench'){dot(station.position,'#efe0b1',5);target(station.position,station.name,'station');}
  if(p.home){const q=xy(p.home);ctx.font='bold 20px Georgia';ctx.fillStyle='#9ed9e5';ctx.fillText('⌂',q.x,q.y);target(p.home,'Your home','home');}
  const navigation=this.waypoint?.position??this.lastObjective;if(navigation){const a=xy(p.position),b=xy(navigation);ctx.strokeStyle=this.waypoint?'#8fdacb':'#f2cb78';ctx.lineWidth=2;ctx.setLineDash([7,7]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.PI/4);ctx.fillStyle=this.waypoint?'#9ce2d4':'#ffd77e';ctx.fillRect(-6,-6,12,12);ctx.restore();target(navigation,this.waypoint?.label??'Tracked quest objective','objective');}
  const sightings=largeGameSightings(w,p);for(const s of sightings){const q=xy(s.position);ctx.save();ctx.translate(q.x,q.y);ctx.fillStyle=s.massive?'#ffe08a':s.kind==='bear'?'#e7a078':'#d9c084';ctx.strokeStyle='#241b14';ctx.lineWidth=2;if(s.massive){ctx.font='bold 24px Georgia';ctx.fillText('★',0,0);}else if(s.kind==='bear'){ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(8,7);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.stroke();}else{ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.restore();target(s.position,s.massive?'Massive bison':s.kind==='bear'?'Bear sighting':'Bison sighting','wildlife');}
  const bosses=livingWorldBosses(w,p);for(const boss of bosses){const q=xy(boss.position);ctx.save();ctx.translate(q.x,q.y);ctx.fillStyle='#f2a85f';ctx.strokeStyle='#351b12';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#351b12';ctx.font='bold 17px Georgia';ctx.fillText('✹',0,1);ctx.restore();target(boss.position,`${boss.name} · ${boss.epithet}`,'boss');}
  const eastern:Vec3=[350,height(350,35),35];dot(eastern,'#8db7cb',6);target(eastern,'Eastern Road · Ironward Crossing','route');
  const player=xy(p.position);ctx.save();ctx.translate(player.x,player.y);ctx.rotate(worldMapFacingRotation(p.yaw));ctx.fillStyle='#fff8df';ctx.strokeStyle='#15241c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(8,9);ctx.lineTo(0,5);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  const facing=((p.yaw*180/Math.PI)%360+360)%360;this.overlay.querySelector<HTMLElement>('.world-map-you')!.textContent=`YOU · LIVE · ${regionAt(p.position[0],p.position[2])} · X ${Math.round(p.position[0])} · Z ${Math.round(p.position[2])} · facing ${Math.round(facing)}°`;
  const selection=this.overlay.querySelector<HTMLElement>('.world-map-selection')!,selectionStrong=selection.querySelector('strong')!,selectionText=selection.querySelector('span')!,clear=selection.querySelector<HTMLButtonElement>('button')!;selectionStrong.textContent=this.waypoint?.label??'Quest objective';selectionText.textContent=this.waypoint?'Pinned by you · local minimap routing is overridden.':this.lastObjective?'Following the currently tracked objective.':'No quest destination is currently tracked.';clear.hidden=!this.waypoint;
  const bossList=this.overlay.querySelector<HTMLElement>('.world-map-bosses')!;bossList.replaceChildren();for(const boss of bosses){const row=document.createElement('button');row.type='button';row.className='world-map-boss';row.innerHTML='<strong></strong><span></span>';row.querySelector('strong')!.textContent=`✹ ${boss.name}`;row.querySelector('span')!.textContent=`${boss.distance} m · ${boss.region} · ${Math.ceil(boss.health)}/${boss.maxHealth} HP`;row.title=boss.epithet;row.onclick=()=>this.setWaypoint(boss.position,`${boss.name} · ${boss.epithet}`);bossList.append(row);}if(!bosses.length)bossList.textContent='All known giants in this March have fallen.';
  const list=this.overlay.querySelector<HTMLElement>('.world-map-sightings')!;list.replaceChildren();for(const s of sightings){const row=document.createElement('button');row.type='button';row.className='world-map-sighting'+(s.massive?' massive':'');row.innerHTML='<strong></strong><span></span>';row.querySelector('strong')!.textContent=s.massive?'★ MASSIVE BISON':s.kind==='bear'?'▲ Bear':'● Bison';row.querySelector('span')!.textContent=`${s.distance} m · ${s.region}`;row.onclick=()=>this.setWaypoint(s.position,s.massive?'Massive bison':s.kind==='bear'?'Bear sighting':'Bison sighting');list.append(row);}if(!sightings.length)list.textContent='No live large-game sightings remain in this March.';
 }
 update(w:WorldState,p:PlayerState,yaw:number,objective:Vec3|undefined,now:number){
  this.lastWorld=w;this.lastPlayer=p;this.lastObjective=objective;if(this.overlay?.isConnected&&now>=this.nextWorldMapUpdate){this.nextWorldMapUpdate=now+.08;this.renderWorldMap();}
  if(!this.canvas?.isConnected||now<this.nextUpdate)return;this.nextUpdate=now+.1;
  const ctx=this.canvas.getContext('2d');if(!ctx)return;const terrain=this.ensureTerrain();
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,200,200);ctx.save();ctx.beginPath();ctx.arc(100,100,87,0,Math.PI*2);ctx.clip();ctx.fillStyle='#293d31';ctx.fillRect(0,0,200,200);
  ctx.save();ctx.translate(100,100);ctx.rotate(-yaw);ctx.scale(1.6,1.6);ctx.drawImage(terrain,-WORLD_SIZE/2-p.position[0],-WORLD_SIZE/2-p.position[2]);
  for(const r of Object.values(w.resources)){if(r.kind!=='tree'||r.phase!=='standing'||Math.hypot(r.position[0]-p.position[0],r.position[2]-p.position[2])>60)continue;ctx.fillStyle='#203f2b';ctx.beginPath();ctx.arc(r.position[0]-p.position[0],r.position[2]-p.position[2],2.2,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  const point=(position:Vec3,color:string,size=3)=>{const m=mapOffset(position[0]-p.position[0],position[2]-p.position[2],yaw,84);if(m.offscreen)return;ctx.fillStyle=color;ctx.fillRect(100+m.x-size,100+m.y-size,size*2,size*2);};
  for(const s of Object.values(w.frontier?.sites??{}))point(s.position,'#d2b275',3);
  for(const s of Object.values(w.structures))if(s.kind==='foundation')point(s.position,'#a18b66',3);
  for(const s of Object.values(w.stations))if(s.kind==='workbench')point(s.position,'#c4bb99',4);
  for(const e of Object.values(w.enemies))if(e.health>0&&Math.hypot(e.position[0]-p.position[0],e.position[2]-p.position[2])<24)point(e.position,'#e67e69',2.5);
  if(p.home){const m=mapOffset(p.home[0]-p.position[0],p.home[2]-p.position[2],yaw,78);ctx.font='bold 14px Georgia';ctx.fillStyle='#9cd3df';ctx.textAlign='center';ctx.fillText('⌂',100+m.x,105+m.y);}
  const navigation=this.waypoint?.position??objective;if(navigation){const hint=routeHint(p.position,navigation,yaw),m=hint.marker;ctx.strokeStyle=this.waypoint?'#8fd7c9':'#e7c47d';ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(100,100);ctx.lineTo(100+m.x,100+m.y);ctx.stroke();ctx.setLineDash([]);ctx.save();ctx.translate(100+m.x,100+m.y);ctx.rotate(m.offscreen?m.angle:Math.PI/4);ctx.fillStyle=this.waypoint?'#9de4d6':'#ffd786';ctx.strokeStyle='#34291c';ctx.lineWidth=2;ctx.beginPath();if(m.offscreen){ctx.moveTo(0,-7);ctx.lineTo(6,5);ctx.lineTo(0,2);ctx.lineTo(-6,5);}else ctx.rect(-4,-4,8,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();this.label!.textContent=hint.distance<=3?(this.waypoint?'◆ Map pin reached':'◆ Objective nearby · E to interact'):`${this.waypoint?'PIN · ':''}${hint.arrow} ${hint.distance} m · ${hint.direction}`;}
  else this.label!.textContent='No tracked destination · M to set a map pin';
  const facing=mapOffset(Math.sin(p.yaw),Math.cos(p.yaw),yaw);ctx.save();ctx.translate(100,100);ctx.rotate(facing.angle);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5,6);ctx.lineTo(0,3);ctx.lineTo(-5,6);ctx.closePath();ctx.fillStyle='#fff8df';ctx.strokeStyle='#172a22';ctx.lineWidth=2;ctx.fill();ctx.stroke();ctx.restore();ctx.restore();
  ctx.strokeStyle='#baa26b';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(100,100,88,0,Math.PI*2);ctx.stroke();const north=mapOffset(0,-1,yaw,96,96);ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff0c9';ctx.fillText('N',100+north.x,100+north.y);
 }
}
