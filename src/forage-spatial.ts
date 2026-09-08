import type {ForageState,Vec3} from './state';

export const FORAGE_CELL_SIZE=32;
export type ForageSpatialIndex=Map<string,string[]>;
const cell=(n:number)=>Math.floor(n/FORAGE_CELL_SIZE);
const key=(x:number,z:number)=>`${x},${z}`;

export function buildForageSpatialIndex(forage:Record<string,ForageState>):ForageSpatialIndex{
 const index:ForageSpatialIndex=new Map();
 for(const f of Object.values(forage)){
  if(!f.id.startsWith('nature-'))continue;
  const k=key(cell(f.position[0]),cell(f.position[2])),ids=index.get(k);if(ids)ids.push(f.id);else index.set(k,[f.id]);
 }
 return index;
}

/** Candidate IDs only. Callers still apply exact radius/harvest/occlusion checks. */
export function forageCandidates(index:ForageSpatialIndex,position:Vec3,radius=65){
 const reach=Math.ceil(radius/FORAGE_CELL_SIZE),cx=cell(position[0]),cz=cell(position[2]),ids:string[]=[];
 for(let x=cx-reach;x<=cx+reach;x++)for(let z=cz-reach;z<=cz+reach;z++)for(const id of index.get(key(x,z))??[])ids.push(id);
 return ids;
}
