import {species,type AnimalKind,type AnimalState} from './wildlife-species';
import {WILDLIFE_SPAWNS,type WildlifeSpawn} from './wildlife-spawns';

export const DEV_WILDLIFE_SPECIES:readonly AnimalKind[]=['hare','rabbit','crow','goat','sheep','deer','stag','boar','fox','bear','bison','wolf','eagle'];
export const DEV_WILDLIFE_PREVIEW_PREFIX='dev-wildlife-preview-';

export interface AuthoredWildlifeSpawn extends WildlifeSpawn {
 createdAt:number;
}

function finite(value:unknown){return typeof value==='number'&&Number.isFinite(value);}
function round(value:number,digits:number){const scale=10**digits;return Math.round(value*scale)/scale;}
function quote(value:string){return `'${value.replaceAll('\\','\\\\').replaceAll("'","\\'")}'`;}
function compact(value:number){const rounded=round(value,3);if(Object.is(rounded,-0))return '0';const text=String(rounded);return text.startsWith('0.')?text.slice(1):text.startsWith('-0.')?'-'+text.slice(2):text;}

export function isAnimalKind(value:string):value is AnimalKind{return (DEV_WILDLIFE_SPECIES as readonly string[]).includes(value);}

export function parseAuthoredWildlifeSpawns(raw:string|null):AuthoredWildlifeSpawn[]{
 if(!raw)return [];
 try{
  const parsed=JSON.parse(raw);if(!Array.isArray(parsed))return [];
  return parsed.filter((mark):mark is AuthoredWildlifeSpawn=>!!mark&&typeof mark.id==='string'&&isAnimalKind(mark.kind)&&finite(mark.x)&&finite(mark.z)&&finite(mark.yaw)&&finite(mark.createdAt)&&(!mark.packId||typeof mark.packId==='string'));
 }catch{return [];}
}

export function nextAuthoredWildlifeId(kind:AnimalKind,marks:readonly AuthoredWildlifeSpawn[],shipping:readonly Pick<WildlifeSpawn,'id'>[]=WILDLIFE_SPAWNS){
 const used=new Set([...shipping,...marks].map(spawn=>spawn.id));
 for(let index=0;index<10_000;index++){const id=`placed-${kind}-${String(index).padStart(2,'0')}`;if(!used.has(id))return id;}
 throw new Error(`No free dev spawn IDs remain for ${kind}`);
}

export function createAuthoredWildlifeSpawn(kind:AnimalKind,x:number,z:number,yaw:number,marks:readonly AuthoredWildlifeSpawn[],packId?:string,createdAt=Date.now()):AuthoredWildlifeSpawn{
 if(!finite(x)||!finite(z)||!finite(yaw))throw new Error('Spawn position/yaw must be finite');
 const group=packId?.trim();
 return {id:nextAuthoredWildlifeId(kind,marks),kind,x:round(x,2),z:round(z,2),yaw:round(yaw,3),packId:group||undefined,createdAt};
}

export function formatAuthoredWildlifeSpawn(mark:Pick<AuthoredWildlifeSpawn,'id'|'kind'|'x'|'z'|'yaw'|'packId'>){
 const group=mark.packId?`,${quote(mark.packId)}`:'';
 return ` fresh(${quote(mark.id)},${quote(mark.kind)},${compact(mark.x)},${compact(mark.z)},${compact(mark.yaw)}${group}),`;
}

export function formatAuthoredWildlifeExport(marks:readonly AuthoredWildlifeSpawn[]){
 return ['// Alderwatch DEV wildlife spawn painter — paste into WILDLIFE_SPAWNS.',...marks.map(formatAuthoredWildlifeSpawn)].join('\n');
}

export function previewAnimalId(mark:Pick<AuthoredWildlifeSpawn,'id'>){return DEV_WILDLIFE_PREVIEW_PREFIX+mark.id;}

export function makeWildlifePreview(mark:AuthoredWildlifeSpawn,groundY:number):AnimalState{
 const profile=species(mark.kind),id=previewAnimalId(mark);
 return {id,kind:mark.kind,position:[mark.x,groundY,mark.z],home:[mark.x,groundY,mark.z],yaw:mark.yaw,phase:mark.yaw*1.7,packId:mark.packId,health:profile.maxHealth,maxHealth:profile.maxHealth,dead:false,energy:profile.aerial?.maxEnergy,airborne:false};
}
