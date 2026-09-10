import type {AreaId} from './realm-runtime';
import type {PlayerState} from './state';

declare module './state' {
  interface ResourceState {areaId?:AreaId}
  interface DropState {areaId?:AreaId}
  interface StructureState {areaId?:AreaId}
  interface StationState {areaId?:AreaId}
  interface ContainerState {areaId?:AreaId}
  interface EnemyState {areaId?:AreaId}
  interface ForageState {areaId?:AreaId}
}
declare module './wildlife-species' {
  interface AnimalState {areaId?:AreaId}
}

export const LEGACY_AREA:AreaId='far-march';
export type AreaOwned={areaId?:AreaId};

/** Old v1 world objects predate area addressing and therefore belong to Far March. */
export function areaOf(value:AreaOwned|undefined):AreaId{return value?.areaId??LEGACY_AREA;}
export function playerAreaOf(player:PlayerState):AreaId{return (player as PlayerState&AreaOwned).areaId??LEGACY_AREA;}
export function sameArea(player:PlayerState,value:AreaOwned|undefined):boolean{return !!value&&playerAreaOf(player)===areaOf(value);}
export function inArea<T extends AreaOwned>(values:Iterable<T>,areaId:AreaId):T[]{return Array.from(values).filter(value=>areaOf(value)===areaId);}
export function ownArea<T extends AreaOwned>(value:T,areaId:AreaId):T{value.areaId=areaId;return value;}
