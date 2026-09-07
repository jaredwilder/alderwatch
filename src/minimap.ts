import {WORLD_SIZE,trailZ} from './worldgen';
import {height,roadX} from './terrain';
import type {WorldState,PlayerState,Vec3} from './state';

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

export class MiniMap {
 private terrain?:HTMLCanvasElement;private canvas?:HTMLCanvasElement;private label?:HTMLElement;private nextUpdate=0;
 mount(ui:HTMLElement){
  const panel=document.createElement('aside');panel.className='minimap';panel.setAttribute('aria-label','Local navigation');
  this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=400;this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','Camera-up minimap: white arrow is you; gold marker is your objective');
  this.label=document.createElement('div');this.label.className='minimap-route';const legend=document.createElement('small');legend.textContent='Gold: objective · Up: W · J: journal';
  panel.append(this.canvas,this.label,legend);ui.append(panel);this.nextUpdate=0;
 }
 update(w:WorldState,p:PlayerState,yaw:number,objective:Vec3|undefined,now:number){
  if(!this.canvas?.isConnected||now<this.nextUpdate)return;this.nextUpdate=now+.1;
  const ctx=this.canvas.getContext('2d');if(!ctx)return;
  if(!this.terrain){
   this.terrain=document.createElement('canvas');this.terrain.width=this.terrain.height=WORLD_SIZE;const ground=this.terrain.getContext('2d')!;
   for(let z=0;z<WORLD_SIZE;z+=4)for(let x=0;x<WORLD_SIZE;x+=4){const h=height(x-WORLD_SIZE/2,z-WORLD_SIZE/2),shade=Math.max(0,Math.min(18,h*3+5));ground.fillStyle=`rgb(${39+shade},${55+shade},${40+shade})`;ground.fillRect(x,z,4,4);}
   ground.fillStyle='#405e62';ground.beginPath();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,r=1+.07*Math.sin(a*7)+.035*Math.sin(a*13),x=WORLD_SIZE/2-31+Math.cos(a)*10*r,y=WORLD_SIZE/2-12+Math.sin(a)*23*r;i?ground.lineTo(x,y):ground.moveTo(x,y);}ground.fill();
   ground.strokeStyle='#a99973';ground.lineWidth=3.8;ground.beginPath();for(let z=-384;z<=384;z+=4){const x=roadX(z)+384;z===-384?ground.moveTo(x,z+384):ground.lineTo(x,z+384);}ground.stroke();ground.beginPath();for(let x=-335;x<=335;x+=4){x===-335?ground.moveTo(x+384,trailZ(x)+384):ground.lineTo(x+384,trailZ(x)+384);}ground.stroke();
  }
  ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,200,200);ctx.save();ctx.beginPath();ctx.arc(100,100,87,0,Math.PI*2);ctx.clip();ctx.fillStyle='#293d31';ctx.fillRect(0,0,200,200);
  ctx.save();ctx.translate(100,100);ctx.rotate(-yaw);ctx.scale(1.6,1.6);ctx.drawImage(this.terrain,-WORLD_SIZE/2-p.position[0],-WORLD_SIZE/2-p.position[2]);
  for(const r of Object.values(w.resources)){if(r.kind!=='tree'||r.phase!=='standing'||Math.hypot(r.position[0]-p.position[0],r.position[2]-p.position[2])>60)continue;ctx.fillStyle='#203f2b';ctx.beginPath();ctx.arc(r.position[0]-p.position[0],r.position[2]-p.position[2],2.2,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  const point=(position:Vec3,color:string,size=3)=>{const m=mapOffset(position[0]-p.position[0],position[2]-p.position[2],yaw,84);if(m.offscreen)return;ctx.fillStyle=color;ctx.fillRect(100+m.x-size,100+m.y-size,size*2,size*2);};
  for(const s of Object.values(w.frontier?.sites??{}))point(s.position,'#d2b275',3);
  for(const s of Object.values(w.structures))if(s.kind==='foundation')point(s.position,'#a18b66',3);
  for(const s of Object.values(w.stations))if(s.kind==='workbench')point(s.position,'#c4bb99',4);
  for(const e of Object.values(w.enemies))if(e.health>0&&Math.hypot(e.position[0]-p.position[0],e.position[2]-p.position[2])<24)point(e.position,'#e67e69',2.5);
  if(p.home){const m=mapOffset(p.home[0]-p.position[0],p.home[2]-p.position[2],yaw,78);ctx.font='bold 14px Georgia';ctx.fillStyle='#9cd3df';ctx.textAlign='center';ctx.fillText('⌂',100+m.x,105+m.y);}
  if(objective){const hint=routeHint(p.position,objective,yaw),m=hint.marker;ctx.strokeStyle='#e7c47d';ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(100,100);ctx.lineTo(100+m.x,100+m.y);ctx.stroke();ctx.setLineDash([]);ctx.save();ctx.translate(100+m.x,100+m.y);ctx.rotate(m.offscreen?m.angle:Math.PI/4);ctx.fillStyle='#ffd786';ctx.strokeStyle='#34291c';ctx.lineWidth=2;ctx.beginPath();if(m.offscreen){ctx.moveTo(0,-7);ctx.lineTo(6,5);ctx.lineTo(0,2);ctx.lineTo(-6,5);}else ctx.rect(-4,-4,8,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();this.label!.textContent=hint.distance<=3?'◆ Objective nearby · E to interact':`${hint.arrow} ${hint.distance} m · ${hint.direction}`;}
  else this.label!.textContent='No tracked destination · J for quests';
  const facing=mapOffset(Math.sin(p.yaw),Math.cos(p.yaw),yaw);ctx.save();ctx.translate(100,100);ctx.rotate(facing.angle);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(5,6);ctx.lineTo(0,3);ctx.lineTo(-5,6);ctx.closePath();ctx.fillStyle='#fff8df';ctx.strokeStyle='#172a22';ctx.lineWidth=2;ctx.fill();ctx.stroke();ctx.restore();ctx.restore();
  ctx.strokeStyle='#baa26b';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(100,100,88,0,Math.PI*2);ctx.stroke();const north=mapOffset(0,-1,yaw,96,96);ctx.font='bold 11px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff0c9';ctx.fillText('N',100+north.x,100+north.y);
 }
}
