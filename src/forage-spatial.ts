import type {ForageState,ResourceState,Vec3} from './state';

export const FORAGE_CELL_SIZE=32;
export type ForageSpatialIndex=Map<string,string[]>;
export type ResourceSpatialIndex=Map<string,string[]>;
const cell=(n:number)=>Math.floor(n/FORAGE_CELL_SIZE);
const key=(x:number,z:number)=>`${x},${z}`;
const add=(index:Map<string,string[]>,id:string,position:Vec3)=>{const k=key(cell(position[0]),cell(position[2])),ids=index.get(k);if(ids)ids.push(id);else index.set(k,[id]);};

export function buildForageSpatialIndex(forage:Record<string,ForageState>):ForageSpatialIndex{
 const index:ForageSpatialIndex=new Map();
 for(const f of Object.values(forage))if(f.id.startsWith('nature-'))add(index,f.id,f.position);
 return index;
}
export function buildResourceSpatialIndex(resources:Record<string,ResourceState>):ResourceSpatialIndex{
 const index:ResourceSpatialIndex=new Map();for(const r of Object.values(resources))add(index,r.id,r.position);return index;
}
function candidates(index:Map<string,string[]>,position:Vec3,radius:number){
 const reach=Math.ceil(radius/FORAGE_CELL_SIZE),cx=cell(position[0]),cz=cell(position[2]),ids:string[]=[];
 for(let x=cx-reach;x<=cx+reach;x++)for(let z=cz-reach;z<=cz+reach;z++)for(const id of index.get(key(x,z))??[])ids.push(id);
 return ids;
}
/** Candidate IDs only. Callers still apply exact radius/harvest/occlusion checks. */
export const forageCandidates=(index:ForageSpatialIndex,position:Vec3,radius=65)=>candidates(index,position,radius);
export const resourceCandidates=(index:ResourceSpatialIndex,position:Vec3,radius=2)=>candidates(index,position,radius);
