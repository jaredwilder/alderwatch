import type {AreaId} from './realm-runtime';
import type {WorldState} from './state';

export interface AreaObjectSlice {
 resources:WorldState['resources'];
 forage:WorldState['forage'];
 drops:WorldState['drops'];
 structures:WorldState['structures'];
 stations:WorldState['stations'];
 containers:WorldState['containers'];
 enemies:WorldState['enemies'];
}

declare module './state' {
 interface WorldState {
  /** Inactive physical world slices. The active area's slice remains in the legacy top-level fields. */
  areaObjectStore?:Record<AreaId,AreaObjectSlice>;
  activeObjectAreaId?:AreaId;
 }
}

const FAR_MARCH:AreaId='far-march';
const emptySlice=():AreaObjectSlice=>({resources:{},forage:{},drops:{},structures:{},stations:{},containers:{},enemies:{}});
const take=(world:WorldState):AreaObjectSlice=>({resources:world.resources,forage:world.forage,drops:world.drops,structures:world.structures,stations:world.stations,containers:world.containers,enemies:world.enemies});
const install=(world:WorldState,slice:AreaObjectSlice)=>{world.resources=slice.resources;world.forage=slice.forage;world.drops=slice.drops;world.structures=slice.structures;world.stations=slice.stations;world.containers=slice.containers;world.enemies=slice.enemies;};

/**
 * Preserve old saves exactly: before this feature, every top-level physical object was
 * Far March data. We mark that active view without rewriting the objects themselves.
 */
export function ensureAreaObjectStore(world:WorldState,currentArea:AreaId=FAR_MARCH){
 world.areaObjectStore??={};
 world.activeObjectAreaId??=currentArea;
 return world;
}

/**
 * Project one physical area into the long-standing WorldState fields used by Alderwatch
 * gameplay authorities. Inactive areas are parked losslessly. This prevents identical
 * local coordinates in two streamed areas from ever aliasing while keeping one inventory,
 * one LocalAuthority, one skill/progression state, and one realm history.
 */
export function activateAreaObjects(world:WorldState,targetArea:AreaId,currentArea?:AreaId){
 ensureAreaObjectStore(world,currentArea??targetArea);
 const active=world.activeObjectAreaId??currentArea??FAR_MARCH;
 if(active===targetArea){world.activeObjectAreaId=targetArea;return world;}
 world.areaObjectStore![active]=take(world);
 const target=world.areaObjectStore![targetArea]??emptySlice();
 delete world.areaObjectStore![targetArea];
 install(world,target);
 world.activeObjectAreaId=targetArea;
 return world;
}

export function activeAreaObjects(world:WorldState){return world.activeObjectAreaId??FAR_MARCH;}
