import type {CellCoord} from './area-cell-stream';

export const CROWNROAD_AREA='crownroad-vale';
export const CROWNROAD_CELL=48;
export const CROWNROAD_RADIUS=6;
export const CROWNROAD_GRID_WIDTH=CROWNROAD_RADIUS*2+1;
export const CROWNROAD_ADDRESSABLE_CELLS=CROWNROAD_GRID_WIDTH**2;
export const CROWNROAD_HALF=CROWNROAD_CELL*(CROWNROAD_RADIUS+.5);
export const CROWNROAD_ACTIVE_RADIUS=1;
export const CROWNROAD_ACTIVE_CELL_CAP=(CROWNROAD_ACTIVE_RADIUS*2+1)**2;
export const CROWNROAD_WARD_START=96;
export const CROWNROAD_WARD_COUNT=32;

export interface CrownroadPoi{id:string;name:string;cell:CellCoord;kind:'city'|'village'|'fort'|'ruin'|'market'|'abbey'|'crossing'}
export const CROWNROAD_POIS:readonly CrownroadPoi[]=[
 {id:'greymarket',name:'Greyhaven',cell:{x:0,z:0},kind:'city'},
 {id:'saints-bridge',name:"Saint Orra's Bridge",cell:{x:-4,z:0},kind:'crossing'},
 {id:'carters-rest',name:"Carters' Rest",cell:{x:-2,z:-3},kind:'market'},
 {id:'bellmere',name:'Bellmere',cell:{x:3,z:-3},kind:'village'},
 {id:'northwatch',name:'Northwatch',cell:{x:1,z:5},kind:'fort'},
 {id:'blackbarrow',name:'Blackbarrow Ruin',cell:{x:5,z:2},kind:'ruin'},
 {id:'saint-vellum',name:'Abbey of Saint Vellum',cell:{x:-3,z:4},kind:'abbey'},
 {id:'kings-east-gate',name:"King's East Gate",cell:{x:6,z:0},kind:'fort'},
] as const;

export const crownroadCellInBounds=(coord:CellCoord)=>Math.abs(coord.x)<=CROWNROAD_RADIUS&&Math.abs(coord.z)<=CROWNROAD_RADIUS;
export function crownroadCellIndex(coord:CellCoord):number{if(!crownroadCellInBounds(coord))throw new Error('Crownroad cell outside major-region address space');return (coord.z+CROWNROAD_RADIUS)*CROWNROAD_GRID_WIDTH+(coord.x+CROWNROAD_RADIUS);}
export function crownroadWardForCell(coord:CellCoord):number{const i=crownroadCellIndex(coord);return CROWNROAD_WARD_START+(i%CROWNROAD_WARD_COUNT);}
export function crownroadWardForPosition(x:number,z:number):number{const coord={x:Math.max(-CROWNROAD_RADIUS,Math.min(CROWNROAD_RADIUS,Math.floor(x/CROWNROAD_CELL))),z:Math.max(-CROWNROAD_RADIUS,Math.min(CROWNROAD_RADIUS,Math.floor(z/CROWNROAD_CELL)))};return crownroadWardForCell(coord);}
export function crownroadLocationName(x:number,z:number):string{
 const coord={x:Math.round(x/CROWNROAD_CELL),z:Math.round(z/CROWNROAD_CELL)},poi=CROWNROAD_POIS.find(p=>p.cell.x===coord.x&&p.cell.z===coord.z);if(poi)return poi.name;if(Math.abs(z)<30)return "King's Road";if(z<-150)return 'South Grainlands';if(z>150)return 'North Crownfields';if(x>150)return 'Blackbarrow Reach';if(x<-150)return "Saint's Crossing";return 'Crownroad Vale';
}
