import type {Vec3} from './state';

export const PLAYER_SNAPSHOT_EVENT='alderwatch:player-snapshot';

export interface PlayerSnapshotDetail {
  areaId:string;
  position:Vec3;
  yaw:number;
}
