import type {PlayerState,Vec3,WorldState} from './state';
import type {AreaId} from './realm-runtime';

export interface SavedAreaLocation {position:Vec3;yaw:number}
export interface PersistentAreaRecord {id:AreaId;discoveredAtTick:number;lastVisitedTick:number;visitCount:number}

declare module './state' {
  interface PlayerState {areaId?:AreaId;areaPositions?:Record<AreaId,SavedAreaLocation>}
  interface WorldState {realmAreas?:Record<AreaId,PersistentAreaRecord>}
}

export const FAR_MARCH:AreaId='far-march';
export const IRONWARD_CROSSING:AreaId='ironward-crossing';
export const IRONWARD_BASIN:AreaId='ironward-basin';
export const DEEP_IRON_MINE:AreaId='deep-iron-mine';
export const CROWNROAD_VALE:AreaId='crownroad-vale';

export const AREA_ENTRY:Record<string,SavedAreaLocation>={
  [FAR_MARCH]:{position:[0,0.03,18],yaw:Math.PI},
  [IRONWARD_CROSSING]:{position:[0,0.03,10],yaw:Math.PI},
  [IRONWARD_BASIN]:{position:[0,0.03,-130],yaw:0},
  [DEEP_IRON_MINE]:{position:[0,0.03,4],yaw:0},
  [CROWNROAD_VALE]:{position:[-278,0.03,0],yaw:-Math.PI/2},
};

export function currentPlayer(world:WorldState):PlayerState|undefined{return Object.values(world.players)[0];}
export function migrateRealmSave(world:WorldState):WorldState{world.realmAreas??={};for(const player of Object.values(world.players)){player.areaId??=FAR_MARCH;player.areaPositions??={};}return world;}
export function playerArea(player:PlayerState):AreaId{return player.areaId??FAR_MARCH;}
export function rememberCurrentArea(player:PlayerState):void{const area=playerArea(player);player.areaPositions??={};player.areaPositions[area]={position:[...player.position],yaw:player.yaw};}
export function enterSavedArea(world:WorldState,target:AreaId):PlayerState{
 migrateRealmSave(world);const player=currentPlayer(world);if(!player)throw new Error('Cannot change realm area without a survivor');const outgoing=playerArea(player);rememberCurrentArea(player);const fallback=AREA_ENTRY[target]??AREA_ENTRY[FAR_MARCH],destination=player.areaPositions?.[target]??fallback;player.areaId=target;player.position=[...destination.position];player.yaw=destination.yaw;const prior=world.realmAreas![target];if(prior){prior.lastVisitedTick=world.tick;prior.visitCount+=1;}else world.realmAreas![target]={id:target,discoveredAtTick:world.tick,lastVisitedTick:world.tick,visitCount:1};if(!world.realmAreas![outgoing])world.realmAreas![outgoing]={id:outgoing,discoveredAtTick:world.tick,lastVisitedTick:world.tick,visitCount:1};else world.realmAreas![outgoing].lastVisitedTick=world.tick;return player;
}
export function requestAreaTravel(target:AreaId):void{sessionStorage.setItem('alderwatch.pendingArea',target);}
export function consumePendingArea():AreaId|undefined{const target=sessionStorage.getItem('alderwatch.pendingArea') as AreaId|null;if(target)sessionStorage.removeItem('alderwatch.pendingArea');return target??undefined;}
