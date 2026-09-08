import type {PlayerState,Vec3} from './state';
import {HERD_SPECIES,predatorCanHunt,species,type AnimalState} from './wildlife-species';
import {groundPredatorCanReach} from './wildlife-aerial';

export const wildlifeDistance=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export const angleTo=(from:Vec3,to:Vec3)=>Math.atan2(to[0]-from[0],to[2]-from[2]);
const angleAway=(from:Vec3,threat:Vec3)=>Math.atan2(from[0]-threat[0],from[2]-threat[2]);
const stableUnit=(id:string)=>{let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return (h>>>0)/4294967295;};
export function headingVector(yaw:number):[number,number]{return [Math.sin(yaw),Math.cos(yaw)];}
export function ambientWanderHeading(animal:AnimalState){const phase=stableUnit(animal.id)*Math.PI*2,heading=phase+Math.sin(animal.phase*.21+phase)*1.15+Math.sin(animal.phase*.073+phase*1.7)*.65;return ((heading+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;}

export function herdCenter(animal:AnimalState,animals:Record<string,AnimalState>):Vec3|undefined{
 if(!HERD_SPECIES.has(animal.kind))return undefined;
 const mates=Object.values(animals).filter(other=>other.kind===animal.kind&&!other.carriedById&&other.health!==0&&!other.dead&&wildlifeDistance(other.home,animal.home)<34);
 if(mates.length<2)return undefined;
 const total=mates.reduce((sum,mate)=>[sum[0]+mate.position[0],sum[1]+mate.position[1],sum[2]+mate.position[2]] as Vec3,[0,0,0] as Vec3);
 return [total[0]/mates.length,total[1]/mates.length,total[2]/mates.length];
}

export function cohesiveFleeHeading(animal:AnimalState,threat:Vec3,center?:Vec3){
 const away=angleAway(animal.position,threat);if(!center)return away;
 const [ax,az]=headingVector(away),toCenter=angleTo(animal.position,center),[cx,cz]=headingVector(toCenter);
 return Math.atan2(ax+cx*.28,az+cz*.28);
}

function reachablePredatorPrey(predator:AnimalState,prey:AnimalState){
 if(prey.carriedById)return false;
 if(predator.kind==='eagle')return true;
 return groundPredatorCanReach(prey);
}
function preyBias(predator:AnimalState,prey:AnimalState){
 // Wolves may take whatever the living world presents, but a nearby bison hunt
 // remains the pack's defining high-value encounter and wins over easy side prey.
 if(predator.kind==='wolf'){if(prey.kind==='bison')return -20;if(prey.kind==='deer')return -3;if(prey.kind==='sheep'||prey.kind==='goat')return -1.5;}
 if(predator.kind==='eagle'){if(prey.kind==='hare')return -3;if(prey.kind==='sheep')return -1.5;}
 if(predator.kind==='bear'){if(prey.kind==='wolf')return -2;if(prey.kind==='deer')return -1;}
 return 0;
}
export function predatorTarget(predator:AnimalState,animals:Record<string,AnimalState>,radius=species(predator.kind).predator?.acquireRadius??0){
 return Object.values(animals).filter(prey=>prey.id!==predator.id&&!prey.dead&&(prey.health??1)>0&&predatorCanHunt(predator.kind,prey.kind)&&reachablePredatorPrey(predator,prey)&&wildlifeDistance(prey.position,predator.position)<radius).sort((a,b)=>(wildlifeDistance(a.position,predator.position)+preyBias(predator,a))-(wildlifeDistance(b.position,predator.position)+preyBias(predator,b))||a.id.localeCompare(b.id))[0];
}

export function predatorThreat(prey:AnimalState,animals:Record<string,AnimalState>,radius=18){
 return Object.values(animals).filter(predator=>predator.id!==prey.id&&!predator.dead&&(predator.health??1)>0&&predatorCanHunt(predator.kind,prey.kind)&&reachablePredatorPrey(predator,prey)&&wildlifeDistance(predator.position,prey.position)<radius).sort((a,b)=>wildlifeDistance(a.position,prey.position)-wildlifeDistance(b.position,prey.position)||a.id.localeCompare(b.id))[0];
}

export function packMembers(wolf:AnimalState,animals:Record<string,AnimalState>){
 if(wolf.kind!=='wolf'||!wolf.packId)return [wolf];
 return Object.values(animals).filter(other=>other.kind==='wolf'&&other.packId===wolf.packId&&!other.dead&&(other.health??1)>0).sort((a,b)=>a.id.localeCompare(b.id));
}

/** A deterministic flank point: pack mates never orbit one another and need no coordinator. */
export function wolfFlankPoint(wolf:AnimalState,quarry:AnimalState,animals:Record<string,AnimalState>):Vec3{
 const pack=packMembers(wolf,animals),slot=Math.max(0,pack.findIndex(member=>member.id===wolf.id));
 if(pack.length<=1||slot===0)return [...quarry.position];
 const dx=wolf.position[0]-quarry.position[0],dz=wolf.position[2]-quarry.position[2],d=Math.max(.001,Math.hypot(dx,dz)),side=slot%2?1:-1,offset=Math.min(3.4,d*.42);
 return [quarry.position[0]+(-dz/d)*offset*side,quarry.position[1],quarry.position[2]+(dx/d)*offset*side];
}

export function livePlayer(players:Record<string,PlayerState>,id:string|undefined){const p=id?players[id]:undefined;return p&&p.health>0?p:undefined;}

/** Wolves escalate an active bison hunt when a player crowds it or wounds quarry/pack. */
export function wolfInterferer(wolf:AnimalState,quarry:AnimalState|undefined,animals:Record<string,AnimalState>,players:Record<string,PlayerState>,tick:number){
 const remembered=(wolf.aggroUntil??0)>tick?livePlayer(players,wolf.aggroPlayerId):undefined;if(remembered)return remembered;
 for(const mate of packMembers(wolf,animals)){const provoker=(mate.alarmedUntil??0)>tick?livePlayer(players,mate.lastAttackerId):undefined;if(provoker)return provoker;}
 if(!quarry||quarry.kind!=='bison')return undefined;
 const quarryAttacker=(quarry.alarmedUntil??0)>tick?livePlayer(players,quarry.lastAttackerId):undefined;if(quarryAttacker)return quarryAttacker;
 return Object.values(players).filter(player=>player.health>0&&Math.min(wildlifeDistance(player.position,wolf.position),wildlifeDistance(player.position,quarry.position))<6.2).sort((a,b)=>wildlifeDistance(a.position,wolf.position)-wildlifeDistance(b.position,wolf.position))[0];
}

export function aggroWolfPack(wolf:AnimalState,animals:Record<string,AnimalState>,playerId:string,tick:number,duration=540){
 for(const mate of packMembers(wolf,animals)){mate.aggroPlayerId=playerId;mate.aggroUntil=tick+duration;mate.huntTargetId=undefined;mate.huntBestDistance=undefined;mate.huntCooldownUntil=mate.aggroUntil;}
}
