import type {CellCoord} from './area-cell-stream';

export const WOLFPINE_AREA='wolfpine';
export const WOLFPINE_CELL=48;
export const WOLFPINE_RADIUS=5;
export const WOLFPINE_GRID_WIDTH=WOLFPINE_RADIUS*2+1;
export const WOLFPINE_ADDRESSABLE_CELLS=WOLFPINE_GRID_WIDTH**2;
export const WOLFPINE_HALF=WOLFPINE_CELL*(WOLFPINE_RADIUS+.5);
export const WOLFPINE_ACTIVE_RADIUS=1;
export const WOLFPINE_ACTIVE_CELL_CAP=(WOLFPINE_ACTIVE_RADIUS*2+1)**2;

export interface WolfpinePoi {id:string;name:string;cell:CellCoord;kind:'gate'|'rest'|'camp'|'trail'}

/**
 * These are the preserved authored sites from the pre-streaming outer-world prototype,
 * remapped relative to Wolfpine's own region origin instead of resurrecting its old
 * monolithic world coordinates.
 *
 * Old relative geometry was approximately:
 *   Charcoal Camp  (-15,-45) -> cell (0,-1)
 *   Bent Spear     (+95,+60) -> cell (2,+1)
 */
export const WOLFPINE_POIS:readonly WolfpinePoi[]=[
 {id:'kings-west-gate',name:"King's West Gate · Crownroad",cell:{x:-5,z:0},kind:'gate'},
 {id:'wolfpine-charcoal-camp',name:'Wolfpine Charcoal Camp',cell:{x:0,z:-1},kind:'rest'},
 {id:'bent-spear-stockade',name:'The Bent Spear Stockade',cell:{x:2,z:1},kind:'camp'},
 {id:'north-ridge-road',name:'North Ridge Road',cell:{x:0,z:5},kind:'trail'},
] as const;

export const WOLFPINE_PRESERVED_WILDLIFE=Object.freeze({bison:2,wolves:3,wolfPackId:'outer-wolfpine-pack'});
export const WOLFPINE_MOOD='dark fir country where packs own the trails';

export function wolfpineCellInBounds(coord:CellCoord){return Math.abs(coord.x)<=WOLFPINE_RADIUS&&Math.abs(coord.z)<=WOLFPINE_RADIUS;}
export function wolfpinePoiAt(coord:CellCoord){return WOLFPINE_POIS.find(p=>p.cell.x===coord.x&&p.cell.z===coord.z);}
export function wolfpineLocationName(x:number,z:number){
 const coord={x:Math.round(x/WOLFPINE_CELL),z:Math.round(z/WOLFPINE_CELL)},poi=wolfpinePoiAt(coord);if(poi)return poi.name;
 if(Math.abs(z)<27)return "King's Pine Road";
 if(Math.abs(x)<28&&z<-26)return 'Charcoal Track';
 if(x>55&&z>20)return 'Bent Spear Woods';
 if(z>145)return 'North Ridge';
 return 'Wolfpine';
}
