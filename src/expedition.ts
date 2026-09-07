import {addItem,quantity,type PlayerState,type Vec3,type WorldState} from './state';
import {height} from './terrain';

export interface ExpeditionProgress {accepted:boolean;recovered:string[];completed:boolean}
export interface ExpeditionSite {id:string;name:string;position:Vec3;enemies:string[]}
export const EXPEDITION_STOPS=[
 {id:'road',name:'The Missing Couriers',x:24,z:-49,roles:['scout'],hint:'A lone scout carries the couriers’ route. Guard his quick cuts, then counter.'},
 {id:'stores',name:'The Stolen Stores',x:45,z:-62,roles:['raider','raider'],hint:'Two blades guard the supplies. Draw one away; do not let them surround you.'},
 {id:'captain',name:'The Ash Captain',x:43,z:-89,roles:['captain'],hint:'His raised blade signals a heavy cut. Dodge late, then punish the long recovery.'},
] as const;
export const expeditionProgress=(p:PlayerState):ExpeditionProgress=>p.expedition??{accepted:false,recovered:[],completed:false};
const dist=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

/** Additive migration: never replaces an enemy, emptied chest or player construction. */
export function seedExpedition(w:WorldState){
 w.expeditionSites??={};
 for(const stop of EXPEDITION_STOPS){
  let site=w.expeditionSites[stop.id];
  if(!site){
   const clear=(x:number,z:number)=>height(x,z)>-.7&&
    Object.values(w.structures).every(s=>Math.hypot(x-s.position[0],z-s.position[2])>11)&&
    Object.values(w.resources).every(r=>r.phase!=='standing'||Math.hypot(x-r.position[0],z-r.position[2])>7)&&
    Object.values(w.expeditionSites!).every(s=>Math.hypot(x-s.position[0],z-s.position[2])>20);
   let position:Vec3|undefined;
   for(let r=0;r<=24&&!position;r+=3)for(let i=0;i<(r?16:1);i++){
    const x=stop.x+Math.cos(i*Math.PI/8)*r,z=stop.z+Math.sin(i*Math.PI/8)*r;
    if(x>12&&x<66&&z<-38&&z>-115&&clear(x,z)){position=[x,height(x,z),z];break;}
   }
   // A densely built save can defer this site; do not overwrite the player's home.
   if(!position)continue;
   site=w.expeditionSites[stop.id]={id:stop.id,name:stop.name,position,enemies:stop.roles.map((_,i)=>`expedition-${stop.id}-${i}`)};
  }
  stop.roles.forEach((role,i)=>{
   const id=site.enemies[i];if(w.enemies[id])return;
   const [x,,z]=site.position,px=x+(i?2:-2),pz=z-2,position:Vec3=[px,height(px,pz)+.02,pz],hp=role==='captain'?210:role==='scout'?66:96;
   w.enemies[id]={id,name:role==='captain'?'Edric, the Ash Captain':role==='scout'?'Ash-road scout':'Ash Company blade',position,home:[...position],yaw:0,health:hp,maxHealth:hp,stamina:100,equipped:role==='scout'?'axe':'sword',phase:'patrol',decisionAt:0,rewarded:false,role,encounter:stop.id};
  });
  const id='expedition-cache-'+stop.id;
  w.containers[id]??={id,name:stop.id==='captain'?'The captain’s dispatches':stop.id==='stores'?'Stolen supply strongbox':'Courier satchel chest',position:[...site.position],inventory:[],looted:false};
 }
}
export function expeditionObjective(w:WorldState,p:PlayerState){
 const progress=expeditionProgress(p),village=w.stations['alderbrook-bench'];
 if(!progress.accepted)return {title:'THE ASH ROAD',text:'J · Read and accept The Ash Road',position:village?.position};
 if(progress.completed)return {title:'MARCHWARDEN',text:'The road is safe. Build, explore and make this frontier yours.',position:p.home};
 const stop=EXPEDITION_STOPS.find(s=>!progress.recovered.includes(s.id));
 if(!stop)return {title:'BRING THEM HOME',text:'Return the dispatches to Alderbrook’s workbench',position:village?.position};
 const site=w.expeditionSites?.[stop.id],alive=site?.enemies.filter(id=>w.enemies[id]?.health>0).length??0;
 return {title:stop.name.toUpperCase(),text:!site?'Route obstructed by construction — clear space east of the village':alive?`Defeat ${alive} ${stop.id==='captain'?'captain':alive===1?'guard':'guards'} · J for the route`:'Guards defeated · E at the chest to recover dispatches',position:site?.position};
}
export function bearing(from:Vec3,to:Vec3){const angle=Math.atan2(to[0]-from[0],from[2]-to[2]);return ['N','NE','E','SE','S','SW','W','NW'][(Math.round(angle/(Math.PI/4))+8)%8]+' · '+Math.round(dist(from,to))+' m';}
export function expeditionCommand(w:WorldState,p:PlayerState,action:'accept'|'recover'|'report',siteId?:string){
 const fail=(message:string)=>({ok:false,message});
 if(action==='accept'){
  if(expeditionProgress(p).accepted)return fail('The Ash Road is already in your journal.');
  p.expedition={accepted:true,recovered:[],completed:false};return {ok:true,message:'The Ash Road accepted · J opens your route. Cook a meal before leaving.'};
 }
 const progress=p.expedition;if(!progress?.accepted)return fail('Read the Alderbrook message in your journal first · J');
 if(action==='report'){
  if(progress.completed)return fail('You have already earned the Marchwarden’s reward.');
  if(EXPEDITION_STOPS.some(s=>!progress.recovered.includes(s.id)))return fail('Recover all three dispatches before reporting.');
  const station=w.stations['alderbrook-bench'];if(!station||dist(p.position,station.position)>3.2)return fail('Return to Alderbrook’s workbench to report.');
  if(Object.values(w.enemies).some(e=>e.health>0&&dist(e.position,p.position)<16))return fail('Lose your pursuers before reporting.');
  progress.completed=true;addItem(w,p,'iron',12);addItem(w,p,'hide',6);addItem(w,p,'hearty_stew',3);
  if(!quantity(p,'fine_sword'))addItem(w,p,'fine_sword',1);
  return {ok:true,message:'MARCHWARDEN · +15 maximum health & stamina, +10% melee damage. Tempered blade, provisions and supplies awarded.'};
 }
 const stop=EXPEDITION_STOPS.find(s=>s.id===siteId),site=siteId?w.expeditionSites?.[siteId]:undefined;
 if(!stop||!site||dist(p.position,site.position)>2.5)return fail('Stand beside the dispatch strongbox.');
 if(progress.recovered.includes(site.id))return fail('These dispatches are already secured.');
 const previous=EXPEDITION_STOPS.slice(0,EXPEDITION_STOPS.indexOf(stop));
 if(previous.some(s=>!progress.recovered.includes(s.id)))return fail('Follow the courier trail first. Check your journal.');
 if(site.enemies.some(id=>!w.enemies[id]||w.enemies[id].health>0))return fail('The strongbox is guarded. Defeat its defenders first.');
 progress.recovered.push(site.id);w.containers['expedition-cache-'+site.id].looted=true;
 addItem(w,p,'grilled_venison',2);addItem(w,p,'iron',stop.id==='captain'?8:4);addItem(w,p,'hide',2);
 return {ok:true,message:stop.id==='captain'?'Captain’s dispatches secured. Return to Alderbrook for your reward.':stop.name+' secured · provisions recovered. The next location is marked in your journal.'};
}
