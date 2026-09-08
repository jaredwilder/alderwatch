import type {Vec3,WorldState} from './state';
import {worldInt} from './world-address';
import {deepMineCertificateFor,deepMineRepresentative,stepDeepMineCertificate,type MineBoundaryInput,type MineBoundaryOutput} from './deep-iron-boundary';
import type {DungeonRoomNode} from './dungeon-graph-stream';

export const DEEP_IRON_DAY_TICKS=3600;
export interface DeepIronRoom {id:string;name:string;position:Vec3;depth:number;cache?:boolean;feature?:'lever'|'lift'|'lower-gate'}
export interface DeepIronPersistentState{
  version:1;
  discovered:string[];
  openedCaches:string[];
  unlockedShortcuts:string[];
  deepestDepth:number;
  lowerWorks:{certificate:number;lastProcessedDay:number;oreDelivered:number;casualties:number;lastOutput:MineBoundaryOutput;recent:string[]};
}

declare module './state'{interface WorldState{deepIron?:DeepIronPersistentState}}

const R=(id:string,name:string,x:number,z:number,depth:number,extra:Partial<DeepIronRoom>={}):DeepIronRoom=>({id,name,position:[x,0.03,z],depth,...extra});
export const DEEP_IRON_ROOMS:readonly DeepIronRoom[]=[
 R('entrance','Ironvein Mouth',0,0,0),R('ore-yard','Ore Yard',0,18,1,{cache:true}),R('first-fork','First Fork',0,36,2),
 R('west-drift','West Drift',-18,36,3),R('powder-store','Powder Store',-36,36,4,{cache:true}),R('collapsed-gallery','Collapsed Gallery',-54,36,5),
 R('east-drift','East Drift',18,36,3),R('pump-room','Pump Room',36,36,4),R('sump','The Sump',54,36,5,{cache:true}),
 R('central-shaft','Central Shaft',0,54,4),R('gallery-a','Hammer Gallery',-18,54,5),R('gallery-b','Lantern Gallery',18,54,5),
 R('old-chapel','Saint Orin Niche',0,72,6,{cache:true}),R('winch','Old Winch',-18,72,6,{feature:'lever'}),R('guard-room','Deep Guardroom',18,72,6),
 R('deep-junction','Deep Junction',0,90,7),R('red-vein','Red Vein',-18,90,8,{cache:true}),R('smelter','Abandoned Smelter',18,90,8),
 R('broken-lift','Broken Lift',-36,90,9,{feature:'lift'}),R('underkeep','Underkeep',36,90,9),R('foreman-cache','Foreman Cache',-18,108,10,{cache:true}),
 R('hidden-cut','Hidden Cut',18,108,10),R('black-stope','Black Stope',0,126,11),R('lower-gate','Lower Works Gate',0,144,12,{feature:'lower-gate'}),
];
export const DEEP_IRON_ROOM_BY_ID=Object.fromEntries(DEEP_IRON_ROOMS.map(room=>[room.id,room])) as Record<string,DeepIronRoom>;
const edges:[string,string][]=[
 ['entrance','ore-yard'],['ore-yard','first-fork'],['first-fork','west-drift'],['west-drift','powder-store'],['powder-store','collapsed-gallery'],
 ['first-fork','east-drift'],['east-drift','pump-room'],['pump-room','sump'],['first-fork','central-shaft'],['central-shaft','gallery-a'],['central-shaft','gallery-b'],
 ['central-shaft','old-chapel'],['gallery-a','winch'],['gallery-b','guard-room'],['old-chapel','winch'],['old-chapel','guard-room'],['old-chapel','deep-junction'],
 ['deep-junction','red-vein'],['deep-junction','smelter'],['red-vein','broken-lift'],['smelter','underkeep'],['deep-junction','foreman-cache'],['deep-junction','hidden-cut'],
 ['foreman-cache','black-stope'],['hidden-cut','black-stope'],['black-stope','lower-gate'],['pump-room','underkeep'],
];
const neighbors:Record<string,string[]>={};for(const room of DEEP_IRON_ROOMS)neighbors[room.id]=[];for(const [a,b] of edges){neighbors[a].push(b);neighbors[b].push(a);}
export const DEEP_IRON_GRAPH=Object.fromEntries(DEEP_IRON_ROOMS.map(room=>[room.id,{id:room.id,neighbors:neighbors[room.id]} satisfies DungeonRoomNode])) as Record<string,DungeonRoomNode>;

export function nearestDeepIronRoom(position:Vec3){let best=DEEP_IRON_ROOMS[0],distance=Infinity;for(const room of DEEP_IRON_ROOMS){const d=Math.hypot(position[0]-room.position[0],position[2]-room.position[2]);if(d<distance){distance=d;best=room;}}return best;}

export function ensureDeepIron(world:WorldState):DeepIronPersistentState{
  if(world.deepIron)return world.deepIron;
  const realmSeed=world.worldSeed??197709,threat=worldInt({realmSeed,areaId:'deep-iron-lower-works',cellX:0,cellZ:0,slot:0,tag:'initial-threat'},2) as 0|1;
  const rubbleMask=worldInt({realmSeed,areaId:'deep-iron-lower-works',cellX:0,cellZ:0,slot:1,tag:'initial-rubble'},256);
  const certificate=deepMineCertificateFor({support:3,ore:3,threat,rubbleMask});
  return world.deepIron={version:1,discovered:[],openedCaches:[],unlockedShortcuts:[],deepestDepth:0,lowerWorks:{certificate,lastProcessedDay:Math.floor(world.tick/DEEP_IRON_DAY_TICKS),oreDelivered:0,casualties:0,lastOutput:{oreExport:0,casualties:0,alarm:'quiet',passage:'open'},recent:[]}};
}

export function lowerWorksInput(day:number,last:MineBoundaryOutput):MineBoundaryInput{
  if(last.alarm==='red'||last.passage==='blocked')return 'seal_and_repair';
  if(day%6===0||last.alarm==='amber')return 'dispatch_guards';
  if(day%4===0)return 'idle_day';
  return 'dispatch_miners';
}

export function advanceDeepIronToTick(world:WorldState,targetTick=world.tick){
  const state=ensureDeepIron(world),targetDay=Math.floor(targetTick/DEEP_IRON_DAY_TICKS);let changed=false;
  for(let day=state.lowerWorks.lastProcessedDay+1;day<=targetDay;day++){
    const input=lowerWorksInput(day,state.lowerWorks.lastOutput),step=stepDeepMineCertificate(state.lowerWorks.certificate,input);state.lowerWorks.certificate=step.certificate;state.lowerWorks.lastOutput=step.output;state.lowerWorks.oreDelivered+=step.output.oreExport;state.lowerWorks.casualties+=step.output.casualties;state.lowerWorks.recent.push(`Day ${day}: ${input.replaceAll('_',' ')} · ${step.output.alarm} · ${step.output.passage}${step.output.oreExport?` · +${step.output.oreExport} ore`:''}`);if(state.lowerWorks.recent.length>8)state.lowerWorks.recent.splice(0,state.lowerWorks.recent.length-8);state.lowerWorks.lastProcessedDay=day;changed=true;
  }
  return changed;
}

export function deepIronCertificateSummary(world:WorldState){const state=ensureDeepIron(world),rep=deepMineRepresentative(state.lowerWorks.certificate);return {certificate:state.lowerWorks.certificate,support:rep.support,ore:rep.ore,threat:rep.threat,rubble:rubbleBits(rep.rubbleMask),...state.lowerWorks.lastOutput,delivered:state.lowerWorks.oreDelivered,casualtiesTotal:state.lowerWorks.casualties};}
const rubbleBits=(mask:number)=>{let n=mask&255,c=0;while(n){c+=n&1;n>>>=1;}return c;};
