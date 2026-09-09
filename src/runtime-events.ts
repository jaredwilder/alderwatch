import type {Vec3} from './state';

export const PLAYER_SNAPSHOT_EVENT='alderwatch:player-snapshot';
export const ROUTE_ARRIVAL_EVENT='alderwatch:route-arrival';

export interface PlayerSnapshotDetail {
  areaId:string;
  position:Vec3;
  yaw:number;
}

export interface RouteArrivalDetail {
  label:string;
  position:Vec3;
  target:Vec3;
}
