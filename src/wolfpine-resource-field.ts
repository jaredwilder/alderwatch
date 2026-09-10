import * as T from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import type {CellCoord} from './area-cell-stream';
import {Assets} from './assets';
import {Gathering,type GatheringLandscape} from './gathering';
import {Soundscape} from './audio';
import {LocalAuthority,ITEMS,type ForageState,type PlayerState,type ResourceState,type StationState} from './state';
import {forageAvailable} from './nature';
import {WOLFPINE_AREA,WOLFPINE_CELL} from './wolfpine-world';

function hash(x:number,z:number,slot:number,seed:number){let h=(seed^Math.imul(x+8192,0x9e3779b1)^Math.imul(z+4096,0x85ebca77)^Math.imul(slot+1,0xc2b2ae3d))>>>0;h=Math.imul(h^(h>>>16),0x7feb352d)>>>0;h=Math.imul(h^(h>>>15),0x846ca68b)>>>0;return (h^(h>>>16))>>>0;}
function unit(x:number,z:number,slot:number,seed:number){return hash(x,z,slot,seed)/0xffffffff;}
function cellKey(c:CellCoord){return `${c.x},${c.z}`;}

export const WOLFPINE_CAMPFIRE='wolfpine-charcoal-campfire';
export const WOLFPINE_WORKBENCH='wolfpine-charcoal-workbench';

/**
 * Wolfpine is content plugged into Alderwatch's existing harvest authority. This class
 * owns only area-specific deterministic placement/presentation; inventory, harvest,
 * skill gain, drops, pickup and crafting remain the same authorities used in Far March.
 */
export class WolfpineResourceField implements GatheringLandscape {
 readonly resources=new Map<string,T.Object3D>();
 readonly colliders=new Map<string,RAPIER.Collider>();
 readonly forageObjects=new Map<string,T.Object3D>();
 readonly cellResources=new Map<string,string[]>();
 readonly gathering:Gathering;
 private seed:number;

 constructor(readonly root:T.Group,readonly assets:Assets,readonly physics:RAPIER.World,readonly authority:LocalAuthority,readonly sound:Soundscape){
  this.seed=authority.state.worldSeed??197709;
  this.ensureStations();
  this.gathering=new Gathering(root,assets,physics,authority,this,sound,WOLFPINE_AREA,()=>0);
 }

 private ensureStations(){
  const stations:StationState[]=[
   {id:WOLFPINE_CAMPFIRE,areaId:WOLFPINE_AREA,name:'Wolfpine charcoal fire',kind:'campfire',position:[0,0,-48]},
   {id:WOLFPINE_WORKBENCH,areaId:WOLFPINE_AREA,name:'Charcoal burners’ workbench',kind:'workbench',position:[-5,0,-44]},
  ];
  for(const station of stations)this.authority.state.stations[station.id]??=station;
 }

 place(name:string,x:number,z:number,yaw=0,scale=1,y=0){const o=this.assets.prop(name);o.position.set(x,y,z);o.rotation.y=yaw;o.scale.setScalar(scale);this.root.add(o);return o;}

 private ensureCell(coord:CellCoord,clear:(x:number,z:number)=>boolean){
  const gx=coord.x*WOLFPINE_CELL,gz=coord.z*WOLFPINE_CELL,ids:string[]=[];
  const candidates=[
   {kind:'tree' as const,slot:0,health:6},
   {kind:'tree' as const,slot:1,health:6},
   {kind:'rock' as const,slot:2,health:4},
  ];
  for(const c of candidates){
   const id=`wolfpine-resource:${coord.x}:${coord.z}:${c.kind}:${c.slot}`;ids.push(id);if(this.authority.state.resources[id])continue;
   let position:[number,number,number]|undefined;
   for(let attempt=0;attempt<7;attempt++){
    const u=unit(coord.x,coord.z,c.slot*17+attempt*2,this.seed),v=unit(coord.x,coord.z,c.slot*17+attempt*2+1,this.seed),x=gx+(u-.5)*38,z=gz+(v-.5)*38;
    if(clear(x,z))continue;position=[x,0,z];break;
   }
   if(!position)continue;
   const r:ResourceState={id,areaId:WOLFPINE_AREA,kind:c.kind,position,variant:hash(coord.x,coord.z,c.slot+91,this.seed)%3,health:c.health,phase:'standing',rotation:unit(coord.x,coord.z,c.slot+47,this.seed)*Math.PI*2,scale:c.kind==='tree'?.82+unit(coord.x,coord.z,c.slot+71,this.seed)*.28:1};
   this.authority.state.resources[id]=r;
  }
  const forageId=`wolfpine-forage:${coord.x}:${coord.z}:flax`;ids.push(forageId);
  if(!this.authority.state.forage[forageId]){
   for(let attempt=0;attempt<7;attempt++){
    const x=gx+(unit(coord.x,coord.z,120+attempt*2,this.seed)-.5)*36,z=gz+(unit(coord.x,coord.z,121+attempt*2,this.seed)-.5)*36;if(clear(x,z))continue;
    const f:ForageState={id:forageId,areaId:WOLFPINE_AREA,kind:'fiber',item:'fiber',position:[x,0,z],harvested:false};this.authority.state.forage[forageId]=f;break;
   }
  }
  return ids;
 }

 mountCell(coord:CellCoord,clear:(x:number,z:number)=>boolean){
  const key=cellKey(coord),ids=this.ensureCell(coord,clear);this.cellResources.set(key,ids);
  for(const id of ids){
   const r=this.authority.state.resources[id];
   if(r){if(r.phase==='fallen'){this.place('stump',r.position[0],r.position[2],r.rotation,r.scale??1,r.position[1]);continue;}if(r.phase!=='standing'||this.resources.has(id))continue;const o=this.place(r.kind==='tree'?`oak_${r.variant}`:`rock_${r.variant}`,r.position[0],r.position[2],r.rotation,r.scale??1,r.position[1]);o.userData.entityId=id;this.resources.set(id,o);const c=r.kind==='tree'?this.physics.createCollider(RAPIER.ColliderDesc.cylinder(3,.72*(r.scale??1)).setTranslation(r.position[0],r.position[1]+3,r.position[2])):this.physics.createCollider(RAPIER.ColliderDesc.ball(.85).setTranslation(r.position[0],r.position[1]+.55,r.position[2]));this.colliders.set(id,c);continue;}
   const f=this.authority.state.forage[id];if(!f||!forageAvailable(f,this.authority.state.tick)||this.forageObjects.has(id))continue;const o=this.place('flax',f.position[0],f.position[2],0,.9,f.position[1]);o.userData.entityId=id;this.forageObjects.set(id,o);
  }
 }

 unmountCell(coord:CellCoord){
  const key=cellKey(coord),ids=this.cellResources.get(key)??[];for(const id of ids){const object=this.resources.get(id);if(object&&!this.gathering.falling.some(f=>f.id===id)){object.removeFromParent();this.resources.delete(id);const collider=this.colliders.get(id);if(collider)this.physics.removeCollider(collider,true);this.colliders.delete(id);}const forage=this.forageObjects.get(id);if(forage){forage.removeFromParent();this.forageObjects.delete(id);}}this.cellResources.delete(key);
 }

 resourceNear(x:number,z:number,radius=3){for(const r of Object.values(this.authority.state.resources))if(r.areaId===WOLFPINE_AREA&&r.phase==='standing'&&Math.hypot(r.position[0]-x,r.position[2]-z)<radius)return true;return false;}

 nearestResource(player:PlayerState,limit=2.6){let id='',best=limit;for(const r of Object.values(this.authority.state.resources)){if(r.areaId!==WOLFPINE_AREA||r.phase!=='standing')continue;const d=Math.hypot(r.position[0]-player.position[0],r.position[2]-player.position[2]);if(d<best){best=d;id=r.id;}}return id;}
 nearestForage(player:PlayerState,limit=2.2){let best:ForageState|undefined,distance=limit;for(const f of Object.values(this.authority.state.forage)){if(f.areaId!==WOLFPINE_AREA||!forageAvailable(f,this.authority.state.tick))continue;const d=Math.hypot(f.position[0]-player.position[0],f.position[2]-player.position[2]);if(d<distance){distance=d;best=f;}}return best;}

 interact(player:PlayerState){
  const loose=this.gathering.nearest(player);if(loose)return this.gathering.pickup(player);
  const forage=this.nearestForage(player);if(forage){const out=this.authority.dispatch({type:'forage',playerId:player.id,forageId:forage.id});if(out.ok){this.forageObjects.get(forage.id)?.removeFromParent();this.forageObjects.delete(forage.id);}return out;}
  return {ok:false,message:'Nothing to gather within reach'};
 }
 prompt(player:PlayerState){const loose=this.gathering.prompt(player);if(loose)return loose;const forage=this.nearestForage(player);if(forage)return `E  Gather ${ITEMS[forage.item??forage.kind??'fiber'].name}`;const id=this.nearestResource(player),r=id?this.authority.state.resources[id]:undefined;return r?`${r.kind==='tree'?'Mature pine':'Iron-bearing rock'} · ${r.health} hits · Left click ${r.kind==='tree'?'axe':'pickaxe'}`:'';}
 update(dt:number){this.gathering.update(dt);}
}
