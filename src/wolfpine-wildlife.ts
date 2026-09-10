import type {WorldState} from './state';
import {ensureAnimalVitals} from './wildlife-rules';
import {ensureAerialState} from './wildlife-aerial';
import {species,type AnimalState} from './wildlife-species';
import type {WildlifeSpawn} from './wildlife-spawns';
import {WOLFPINE_AREA,WOLFPINE_PRESERVED_WILDLIFE} from './wolfpine-world';

const spawn=(id:string,kind:AnimalState['kind'],x:number,z:number,yaw:number,packId?:string):WildlifeSpawn=>({id,kind,x,z,yaw,packId});

/**
 * Stable habitat slots for the outer pine country. These are logical wildlife identities,
 * not a promise to keep every body expensive: Nature owns animation/AI presentation while
 * the area-object projection parks the entire population when Wolfpine is inactive.
 */
export const WOLFPINE_WILDLIFE_SPAWNS:readonly WildlifeSpawn[]=[
 spawn('wolfpine-rabbit-0','rabbit',-150,-80,.4),spawn('wolfpine-rabbit-1','rabbit',-105,45,2.1),spawn('wolfpine-rabbit-2','rabbit',-40,125,4.8),
 spawn('wolfpine-rabbit-3','rabbit',55,-150,1.3),spawn('wolfpine-rabbit-4','rabbit',140,-100,3.7),spawn('wolfpine-rabbit-5','rabbit',175,25,5.5),
 spawn('wolfpine-crow-0','crow',30,120,.8),spawn('wolfpine-crow-1','crow',-170,30,3.2),spawn('wolfpine-crow-2','crow',180,-150,5.1),
 spawn('wolfpine-deer-0','deer',-92,-155,1.7),spawn('wolfpine-deer-1','deer',-84,-149,4.2),spawn('wolfpine-deer-2','deer',-75,-160,.9),
 spawn('wolfpine-deer-3','deer',-135,150,3.5),spawn('wolfpine-deer-4','deer',-126,156,2.7),spawn('wolfpine-deer-5','deer',-140,162,5.7),
 spawn('wolfpine-stag-0','stag',20,205,2.8),
 spawn('wolfpine-boar-0','boar',60,150,1.2,'wolfpine-boar'),spawn('wolfpine-boar-1','boar',70,156,3.9,'wolfpine-boar'),spawn('wolfpine-boar-2','boar',54,160,5.1,'wolfpine-boar'),
 spawn('wolfpine-fox-0','fox',-55,-185,5.7),spawn('wolfpine-fox-1','fox',105,155,1.8),spawn('wolfpine-fox-2','fox',205,-35,3.1),
 spawn('wolfpine-eagle-0','eagle',-70,205,1.2),spawn('wolfpine-eagle-1','eagle',210,180,4.5),
 spawn('wolfpine-bison-0','bison',184,112,.5,'wolfpine-bison'),spawn('wolfpine-bison-1','bison',197,120,1.5,'wolfpine-bison'),
 spawn('wolfpine-wolf-0','wolf',157,88,4.4,WOLFPINE_PRESERVED_WILDLIFE.wolfPackId),spawn('wolfpine-wolf-1','wolf',165,94,4.1,WOLFPINE_PRESERVED_WILDLIFE.wolfPackId),spawn('wolfpine-wolf-2','wolf',151,99,3.8,WOLFPINE_PRESERVED_WILDLIFE.wolfPackId),
 spawn('wolfpine-bear-0','bear',-175,175,2.8),
] as const;

export function seedWolfpineWildlife(world:WorldState){
 world.animals??={};
 for(const slot of WOLFPINE_WILDLIFE_SPAWNS){
  let animal=world.animals[slot.id];
  if(!animal){animal=world.animals[slot.id]={id:slot.id,areaId:WOLFPINE_AREA,kind:slot.kind,position:[slot.x,0,slot.z],home:[slot.x,0,slot.z],yaw:slot.yaw,phase:slot.yaw*1.7,packId:slot.packId};}
  else animal.areaId??=WOLFPINE_AREA;
  ensureAnimalVitals(animal);if(species(animal.kind).aerial)ensureAerialState(animal);
 }
 return world.animals;
}
