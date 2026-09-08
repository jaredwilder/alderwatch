import {height} from './terrain';
import type {EnemyState,ItemId,PlayerState,Vec3,WorldState} from './state';

export interface WorldBossDefinition {id:string;name:string;epithet:string;region:string;position:Vec3;health:number;scale:number;reward:number;gear:Extract<ItemId,'axe'|'sword'|'fine_sword'>}

// These five bosses existed on the abandoned mega branch but were outside the then-live
// 768 m map. Keep their identities, make them reachable now, and move them between realm
// areas later through the realm-address layer rather than hiding them beyond unloaded ground.
export const WORLD_BOSSES:readonly WorldBossDefinition[]=[
 {id:'giant-hroth',name:'HROTH',epithet:'THE BELL-TOWER',region:'Ironward Heights',position:[305,0,225],health:760,scale:2.45,reward:85,gear:'axe'},
 {id:'giant-maela',name:'MAELA',epithet:'STONE-MOTHER',region:'Briar Heath',position:[-302,0,245],health:900,scale:2.65,reward:105,gear:'fine_sword'},
 {id:'giant-gorm',name:'GORM',epithet:'OF NINE CARTS',region:'Ironward Heights',position:[315,0,315],health:1020,scale:2.8,reward:125,gear:'fine_sword'},
 {id:'giant-bramble',name:'OLD BRAMBLE-KNEE',epithet:'WHO REMEMBERS THE FIRST ROAD',region:'Briar Heath',position:[-225,0,315],health:820,scale:2.55,reward:95,gear:'sword'},
 {id:'giant-accounting',name:'THE EXTREMELY LARGE ACCOUNTING ERROR',epithet:'UNRESOLVED SINCE THE OLD KINGDOM',region:'Southwood',position:[68,0,320],health:1180,scale:2.95,reward:150,gear:'fine_sword'},
] as const;

const definitions=new Map(WORLD_BOSSES.map(b=>[b.id,b]));
export type WorldBossEnemy=EnemyState&{awWorldBossId?:string;awWorldBossRewarded?:boolean};
export function worldBossDefinition(id:string){return definitions.get(id);}
export function isWorldBoss(enemy:EnemyState|undefined):enemy is WorldBossEnemy{return !!enemy&&definitions.has(enemy.id);}

export function seedWorldBosses(world:WorldState){
 for(const boss of WORLD_BOSSES){
  const existing=world.enemies[boss.id] as WorldBossEnemy|undefined;
  if(existing){existing.awWorldBossId=boss.id;continue;}
  const [x,,z]=boss.position,y=height(x,z)+.02;
  world.enemies[boss.id]={id:boss.id,name:`${boss.name}, ${boss.epithet}`,role:'captain',position:[x,y,z],home:[x,y,z],yaw:Math.PI,health:boss.health,maxHealth:boss.health,stamina:100,equipped:boss.gear,phase:'patrol',decisionAt:0,rewarded:false,awWorldBossId:boss.id} as WorldBossEnemy;
 }
 if(!world.progress.includes('world-bosses-v1'))world.progress.push('world-bosses-v1');
 return world;
}

export interface WorldBossSighting {id:string;name:string;epithet:string;region:string;position:Vec3;distance:number;health:number;maxHealth:number;scale:number;reward:number}
export function livingWorldBosses(world:WorldState,player:PlayerState):WorldBossSighting[]{
 return WORLD_BOSSES.flatMap(boss=>{
  const enemy=world.enemies[boss.id];if(!enemy||enemy.health<=0)return [];
  return [{id:boss.id,name:boss.name,epithet:boss.epithet,region:boss.region,position:enemy.position,distance:Math.round(Math.hypot(enemy.position[0]-player.position[0],enemy.position[2]-player.position[2])),health:enemy.health,maxHealth:enemy.maxHealth,scale:boss.scale,reward:boss.reward}];
 }).sort((a,b)=>a.distance-b.distance);
}
