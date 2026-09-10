import type {EnemyState,Vec3,WorldState} from './state';
import {WOLFPINE_AREA} from './wolfpine-world';

const ENCOUNTERS:readonly {id:string;name:string;position:Vec3;yaw:number;health:number;equipped:'sword'|'axe';role?:EnemyState['role']}[]=[
 {id:'wolfpine-bent-spear-scout',name:'Bent Spear outrider',position:[87,0,43],yaw:1.1,health:76,equipped:'axe',role:'scout'},
 {id:'wolfpine-bent-spear-blade',name:'Bent Spear road-cutter',position:[104,0,54],yaw:4.2,health:94,equipped:'sword',role:'raider'},
 {id:'wolfpine-bent-spear-chief',name:'Rulf of the Bent Spear',position:[97,0,63],yaw:3.2,health:142,equipped:'sword',role:'captain'},
] as const;

/** Area content only. Combat timing, targeting, defenses, damage and presentation remain Combat/LocalAuthority. */
export function seedWolfpineEncounters(world:WorldState){
 for(const spec of ENCOUNTERS){
  if(world.enemies[spec.id]){world.enemies[spec.id].areaId??=WOLFPINE_AREA;continue;}
  world.enemies[spec.id]={id:spec.id,areaId:WOLFPINE_AREA,name:spec.name,position:[...spec.position],home:[...spec.position],yaw:spec.yaw,health:spec.health,maxHealth:spec.health,stamina:100,equipped:spec.equipped,phase:'patrol',decisionAt:0,rewarded:false,role:spec.role};
 }
 return world.enemies;
}

export const WOLFPINE_ENCOUNTER_IDS=ENCOUNTERS.map(encounter=>encounter.id);
