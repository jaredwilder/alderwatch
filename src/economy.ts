import {BUILDS,FOOD,RECIPES,stats,type BuildKind} from './definitions';
import {addItem,quantity,spend,type LocalAuthority,type PlayerState,type ItemId,type StructureState,type Vec3} from './state';
import {height} from './terrain';
import {guardedCache} from './combat-rules';
export type EconomyCommand=
 |{type:'craft';playerId:string;recipeId:string;stationId:string}
 |{type:'eat';playerId:string;item:ItemId}
 |{type:'rest';playerId:string;stationId:string}
 |{type:'place';playerId:string;kind:BuildKind;position:Vec3;yaw:number;supportId?:string}
 |{type:'dismantle';playerId:string;structureId:string}
 |{type:'toggle_door';playerId:string;structureId:string}
 |{type:'transfer';playerId:string;containerId:string;item:ItemId;count:number;direction:'deposit'|'withdraw'}
 |{type:'drop';playerId:string;item:ItemId;count:number}
 |{type:'reorder';playerId:string;itemId:string;destination:number}
 |{type:'open_container';playerId:string;containerId:string};
export const distance=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const result=(ok:boolean,message:string)=>({ok,message});
export function placementError(a:LocalAuthority,p:PlayerState,c:Extract<EconomyCommand,{type:'place'}>):string|null{
 const def=BUILDS[c.kind];if(!def)return 'Unknown building piece';
 if(c.position.length!==3||c.position.some(n=>!Number.isFinite(n))||!Number.isFinite(c.yaw))return 'Invalid placement';
 if(distance(p.position,c.position)>8)return 'Build closer to your survivor';
 if(Math.abs(c.position[0])>70||c.position[2]<-92||c.position[2]>70)return 'Build within the settled March';
 if(height(c.position[0],c.position[2])<-1.1)return 'The ground is under water';
 if(Math.abs(c.yaw/(Math.PI/2)-Math.round(c.yaw/(Math.PI/2)))>.001)return 'Align the frame to a quarter turn';
 const all=Object.values(a.state.structures);const floor=c.supportId?a.state.structures[c.supportId]:undefined;
 if(c.kind==='foundation'){
  if(Math.abs(p.position[0]-c.position[0])<1.7&&Math.abs(p.position[2]-c.position[2])<1.7)return 'Step clear of the foundation before placing it';
  if(Object.values(a.state.stations).some(s=>Math.abs(s.position[0]-c.position[0])<2.2&&Math.abs(s.position[2]-c.position[2])<2.2))return 'Leave the existing station clear';
  if(Math.abs(c.position[0]/3-Math.round(c.position[0]/3))>.001||Math.abs(c.position[2]/3-Math.round(c.position[2]/3))>.001)return 'Snap floors to the foundation grid';
  if(Math.abs(c.position[1]-height(c.position[0],c.position[2]))>.65)return 'The foundation needs solid ground';
  if(all.some(s=>s.kind==='foundation'&&distance(s.position,c.position)<2.9))return 'A floor already occupies that space';
  const heights=[[-1.5,-1.5],[1.5,-1.5],[-1.5,1.5],[1.5,1.5]].map(([x,z])=>height(c.position[0]+x,c.position[2]+z));if(Math.max(...heights)-Math.min(...heights)>.85)return 'Find gentler ground for this foundation';
 }else if(['wall','window','doorway','roof'].includes(c.kind)){
  if(!floor||floor.kind!=='foundation')return 'Snap this piece to a foundation';
  if(floor.ownerId!==p.id)return 'This foundation belongs to another survivor';
  if(c.kind==='roof'){
   if(distance(c.position,floor.position)>.05||Math.abs(c.position[1]-floor.position[1]-3.14)>.05)return 'Snap the roof above the floor';
   if(all.filter(s=>s.supportId===floor.id&&['wall','window','doorway'].includes(s.kind)).length<2)return 'The roof needs at least two supporting walls';
  }else{
   const dx=Math.abs(c.position[0]-floor.position[0]),dz=Math.abs(c.position[2]-floor.position[2]);if(!((Math.abs(dx-1.5)<.01&&dz<.01)||(Math.abs(dz-1.5)<.01&&dx<.01))||Math.abs(c.position[1]-floor.position[1]-.44)>.05)return 'Snap walls to a floor edge';if(dx>1&&Math.abs(Math.cos(c.yaw))>.01||dz>1&&Math.abs(Math.sin(c.yaw))>.01)return 'Align the wall along its floor edge';
  }
  if(all.some(s=>distance(s.position,c.position)<.1&&Math.abs(s.position[1]-c.position[1])<.1))return 'A building piece already occupies that socket';
 }else if(floor){if(floor.ownerId!==p.id)return 'This foundation belongs to another survivor';if(floor.kind!=='foundation'||distance(c.position,floor.position)>2||Math.abs(c.position[1]-floor.position[1]-.47)>.1)return 'Place the station on the floor';}
 else if(Math.abs(c.position[1]-height(c.position[0],c.position[2]))>.1)return 'Place this piece on solid ground';
 if(!['wall','window','doorway','roof'].includes(c.kind)&&Object.values(a.state.resources).some(r=>r.phase==='standing'&&distance(r.position,c.position)<(r.kind==='tree'?2:1.2)))return 'Clear the tree or rock first';
 if(all.some(s=>!['foundation','wall','window','doorway','roof'].includes(s.kind)&&distance(s.position,c.position)<1.1))return 'Leave room around the existing station';
 if(!Object.entries(def.cost).every(([k,v])=>quantity(p,k)>=v))return 'Gather the missing materials';
 return null;
}
export function applyEconomyCommand(a:LocalAuthority,p:PlayerState,c:EconomyCommand){
 const w=a.state;
 if(c.type==='craft'){
  const r=RECIPES.find(r=>r.id===c.recipeId),station=a.state.stations[c.stationId];if(!r||!station||station.kind!==r.station||distance(p.position,station.position)>3.2)return result(false,'Stand beside the correct crafting station');
  if(r.requires&&!a.state.progress.includes(r.requires))return result(false,'Craft the earlier weapon first');
  if(!spend(p,r.cost))return result(false,'Gather the missing materials');addItem(a.state,p,r.output,r.count);if(p.equipped&&!quantity(p,p.equipped))p.equipped=null;p.skills[r.station==='campfire'?'cooking':'crafting']++;const flag='crafted-'+r.id;if(!a.state.progress.includes(flag))a.state.progress.push(flag);return result(true,'Crafted '+r.name);
 }
 if(c.type==='rest'){
  const station=w.stations[c.stationId];if(!station||station.kind!=='campfire'||distance(p.position,station.position)>3.2)return result(false,'Rest beside a campfire.');
  if(Object.values(w.enemies).some(e=>e.health>0&&distance(e.position,p.position)<18))return result(false,'It is not safe to rest with enemies nearby.');
  if(p.combat&&p.combat.until>w.tick)return result(false,'Finish your action before resting.');
  const max=stats(p);if(p.health>=max.health&&p.stamina>=max.stamina)return result(false,'You are already rested.');
  if(!spend(p,{wood:1}))return result(false,'Resting needs one timber for the fire.');
  p.health=max.health;p.stamina=max.stamina;return result(true,'Rested by the fire · health and stamina restored.');
 }
 if(c.type==='eat'){
  if((p.nextMealAt??0)>w.tick)return result(false,'Another bite in '+Math.ceil(((p.nextMealAt??0)-w.tick)/60)+' seconds.');
  if(p.combat&&p.combat.until>w.tick)return result(false,'Finish your action before eating.');
  const food=FOOD[c.item];if(!food||!spend(p,{[c.item]:1}))return result(false,'You have no prepared food to eat');
  p.nextMealAt=w.tick+600;if(food.duration){p.buffs=p.buffs.filter(b=>b.id!==c.item);p.buffs.push({id:c.item,remaining:food.duration});if(p.buffs.length>2)p.buffs.shift();}
  p.health=Math.min(stats(p).health,p.health+food.heal);if(food.duration&&!a.state.progress.includes('food-buff'))a.state.progress.push('food-buff');return result(true,food.duration?'Well fed — stronger for the road':'Recovered 10 health');
 }
 if(c.type==='place'){
  const error=placementError(a,p,c);if(error)return result(false,error);spend(p,BUILDS[c.kind].cost);const id='structure-'+a.state.nextId++;const s:StructureState={id,kind:c.kind,position:[...c.position],yaw:c.yaw,ownerId:p.id,supportId:c.supportId,doorOpen:false};a.state.structures[id]=s;p.skills.building++;
  if(c.kind==='foundation'&&!p.home)p.home=[...c.position];
  if(c.kind==='workbench'||c.kind==='campfire')a.state.stations[id]={id,kind:c.kind,name:BUILDS[c.kind].name,position:[...c.position]};
  if(c.kind==='chest')a.state.containers[id]={id,name:'Home supplies',position:[...c.position],ownerId:p.id,inventory:[],looted:true};
  if(!a.state.progress.includes('built-'+c.kind))a.state.progress.push('built-'+c.kind);return result(true,'Built '+BUILDS[c.kind].name);
 }
 if(c.type==='dismantle'){
  const s=a.state.structures[c.structureId];if(!s||s.ownerId!==p.id||distance(p.position,s.position)>6)return result(false,'That is not your structure within reach');
  if(Object.values(a.state.structures).some(other=>other.supportId===s.id))return result(false,'Remove the supported pieces first');
  if(['wall','window','doorway'].includes(s.kind)&&Object.values(a.state.structures).some(other=>other.kind==='roof'&&other.supportId===s.supportId)&&Object.values(a.state.structures).filter(other=>other.id!==s.id&&other.supportId===s.supportId&&['wall','window','doorway'].includes(other.kind)).length<2)return result(false,'Remove the roof before its supporting walls');
  if(a.state.containers[s.id]?.inventory.length)return result(false,'Empty the chest before dismantling it');
  for(const [item,n] of Object.entries(BUILDS[s.kind].cost))addItem(a.state,p,item as ItemId,Math.max(1,Math.floor(n*.6)));delete a.state.structures[s.id];delete a.state.stations[s.id];delete a.state.containers[s.id];return result(true,'Dismantled — materials partly recovered');
 }
 if(c.type==='toggle_door'){const s=a.state.structures[c.structureId];if(!s||s.kind!=='doorway'||distance(p.position,s.position)>2.5)return result(false,'Move beside the door');s.doorOpen=!s.doorOpen;return result(true,s.doorOpen?'Door opened':'Door closed');}
 if(c.type==='open_container'){const box=a.state.containers[c.containerId];if(!box||distance(p.position,box.position)>3)return result(false,'Move closer to the chest');if(guardedCache(a.state,box.id))return result(false,'The outcast still guards these supplies');box.looted=true;if(!a.state.opened.includes(box.id))a.state.opened.push(box.id);return result(true,box.name);}
 if(c.type==='transfer'){
  const box=a.state.containers[c.containerId];if(!box||distance(p.position,box.position)>3||!Number.isInteger(c.count)||c.count<1||c.count>99)return result(false,'Cannot transfer that stack');
  if(guardedCache(a.state,box.id))return result(false,'Defeat the camp sentry first');
  if(box.ownerId&&box.ownerId!==p.id)return result(false,'This chest belongs to another survivor');if(!['deposit','withdraw'].includes(c.direction))return result(false,'Unknown transfer direction');const source=c.direction==='deposit'?p:box;const target=c.direction==='deposit'?box:p;if(!spend(source as PlayerState,{[c.item]:c.count}))return result(false,'That stack is no longer available');addItem(a.state,target as PlayerState,c.item,c.count);if(p.equipped&&!quantity(p,p.equipped))p.equipped=null;return result(true,c.direction==='deposit'?'Stored in chest':'Taken from chest');
 }
 if(c.type==='drop'){
  if(!Number.isInteger(c.count)||c.count<1||c.count>99||!spend(p,{[c.item]:c.count}))return result(false,'Cannot drop that stack');const id='drop-'+a.state.nextId++;a.state.drops[id]={id,item:c.item,count:c.count,position:[p.position[0]+Math.sin(p.yaw),p.position[1]+.8,p.position[2]+Math.cos(p.yaw)],rotation:[0,p.yaw,Math.PI/2]};if(p.equipped&&!quantity(p,p.equipped))p.equipped=null;return result(true,'Dropped in the world');
 }
 const index=p.inventory.findIndex(s=>s.id===c.itemId);if(index<0||!Number.isInteger(c.destination)||c.destination<0||c.destination>=p.inventory.length)return result(false,'Invalid pack slot');const [item]=p.inventory.splice(index,1);p.inventory.splice(c.destination,0,item);return result(true,'Pack arranged');
}
