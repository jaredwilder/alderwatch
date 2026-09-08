import type {WorldState} from './state';
import {applyWorldBlock,rebaseSettlement,summarizeEvents,type SettlementMacroState,type WorldEvent} from './world-capsule';
import {worldInt} from './world-address';

export const IRONWARD_CAPSULE_ID='ironward-gatewatch';
export const IRONWARD_DAY_TICKS=3600;
const EPOCH_DAYS=7;

export interface SettlementCapsuleRecord {
  version:1;
  id:string;
  state:SettlementMacroState;
  lastSimulatedDay:number;
  totalEvents:number;
  epochs:number;
  recentEvents:string[];
}

declare module './state' {
  interface WorldState {
    settlementCapsules?:Record<string,SettlementCapsuleRecord>;
  }
}

export const INITIAL_IRONWARD_STATE:SettlementMacroState={
  regime:'calm',population:132,food:420,iron:168,treasury:260,guards:18,danger:10,
};

export function ironwardDay(tick:number){return Math.max(0,Math.floor(tick/IRONWARD_DAY_TICKS));}

export function ironwardEventsForDay(realmSeed:number,day:number):WorldEvent[]{
  const address=(tag:string,slot=day)=>({realmSeed,areaId:'ironward-basin',cellX:0,cellZ:0,slot,tag,epoch:day});
  const events:WorldEvent[]=[{kind:'ordinary_day'}];
  if(day>0&&day%5===0)events.push({kind:'harvest',magnitude:1+worldInt(address('harvest'),2)});
  if(day>0&&day%7===0)events.push({kind:'market_day',magnitude:1+worldInt(address('market'),2)});
  if(day>0&&day%11===0)events.push({kind:'caravan_arrival',magnitude:1+worldInt(address('caravan'),2)});
  const pressure=worldInt(address('pressure'),100);
  if(pressure<11)events.push({kind:'bandit_raid',magnitude:1+worldInt(address('raid-strength'),3)});
  else if(pressure<18)events.push({kind:'guard_reinforcement',magnitude:1+worldInt(address('reinforcement'),2)});
  else if(pressure>95)events.push({kind:'winter_shortage',magnitude:1+worldInt(address('shortage'),2)});
  else if(day>0&&day%4===0)events.push({kind:'recovery_day'});
  return events;
}

export function ensureIronwardCapsule(world:WorldState):SettlementCapsuleRecord{
  world.settlementCapsules??={};
  return world.settlementCapsules[IRONWARD_CAPSULE_ID]??=(
    {version:1,id:IRONWARD_CAPSULE_ID,state:structuredClone(INITIAL_IRONWARD_STATE),lastSimulatedDay:ironwardDay(world.tick),totalEvents:0,epochs:0,recentEvents:[]}
  );
}

export function advanceIronwardToTick(world:WorldState,targetTick=world.tick){
  const record=ensureIronwardCapsule(world),targetDay=ironwardDay(targetTick),seed=world.worldSeed??197709;
  if(targetDay<=record.lastSimulatedDay)return {days:0,eventCount:0,state:structuredClone(record.state),recent:[] as string[]};
  let day=record.lastSimulatedDay+1,eventCount=0;const recent:string[]=[];
  while(day<=targetDay){
    const epochEnd=Math.min(targetDay,day+EPOCH_DAYS-1),events:WorldEvent[]=[];
    for(;day<=epochEnd;day++){
      const daily=ironwardEventsForDay(seed,day);events.push(...daily);
      for(const event of daily)recent.push(`Day ${day}: ${event.kind}${event.magnitude?` ×${event.magnitude}`:''}`);
    }
    const summary=summarizeEvents(events);
    record.state=applyWorldBlock(record.state,summary);
    record.state=rebaseSettlement(record.state).checkpoint;
    record.totalEvents+=summary.eventCount;eventCount+=summary.eventCount;record.epochs++;
  }
  const days=targetDay-record.lastSimulatedDay;record.lastSimulatedDay=targetDay;
  record.recentEvents=[...record.recentEvents,...recent].slice(-8);
  return {days,eventCount,state:structuredClone(record.state),recent:recent.slice(-8)};
}
