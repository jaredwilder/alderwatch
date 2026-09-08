import {height} from './terrain';
import {ensureRuntimeWorld} from './runtime-safety';
import {seeded,type FrontierSite} from './worldgen';
import type {AnimalState} from './wildlife-species';
import type {Vec3,WorldState} from './state';

export interface ExpandedRegion {name:string;centre:[number,number];mood:string}
export const EXPANDED_REGIONS:readonly ExpandedRegion[]=[
 {name:'Greymoor',centre:[-410,260],mood:'wet stone, old roads and things watching from the reeds'},
 {name:'Wolfpine',centre:[360,330],mood:'dark fir country where packs own the trails'},
 {name:'Blackfen',centre:[-330,470],mood:'marsh meadow, ruined holdings and excellent bad decisions'},
 {name:'Giant’s Step',centre:[330,500],mood:'high open country marked by impossible footprints'},
 {name:'Stonewake',centre:[0,535],mood:'wind-cut upland and the oldest standing stones in the March'},
] as const;

const OUTER_SITES:readonly {id:string;name:string;kind:'camp'|'cache'|'rest';x:number;z:number;guards:number}[]=[
 {id:'outer-grey-watch',name:'The Greymoor Lantern',kind:'rest',x:-395,z:235,guards:0},
 {id:'outer-grey-ruin',name:'The Drowned Tollhouse',kind:'camp',x:-470,z:345,guards:3},
 {id:'outer-wolf-road',name:'Wolfpine Charcoal Camp',kind:'rest',x:345,z:285,guards:0},
 {id:'outer-wolf-den',name:'The Bent Spear Stockade',kind:'camp',x:455,z:390,guards:4},
 {id:'outer-blackfen',name:'Blackfen Smuggler’s Fire',kind:'camp',x:-320,z:465,guards:3},
 {id:'outer-hermit',name:'The Fen Hermit’s Roof',kind:'cache',x:-455,z:525,guards:0},
 {id:'outer-step',name:'The Giant’s Step Watch',kind:'rest',x:285,z:485,guards:0},
 {id:'outer-bones',name:'Camp Beneath the Big Bones',kind:'cache',x:455,z:535,guards:0},
 {id:'outer-stonewake',name:'Stonewake Pilgrim Fire',kind:'rest',x:0,z:520,guards:0},
 {id:'outer-last-post',name:'The Last Sensible Outpost',kind:'camp',x:120,z:590,guards:4},
];

function farFromCore(x:number,z:number){return Math.abs(x)>300||z>335||z<-105;}
function idCell(x:number,z:number){return `wild-resource-outer-${x+700}-${z+220}`;}
function addSite(w:WorldState,def:(typeof OUTER_SITES)[number]){
 if(!w.frontier)return;const y=height(def.x,def.z),position:Vec3=[def.x,y,def.z];let site=w.frontier.sites[def.id];
 if(!site){site=w.frontier.sites[def.id]={id:def.id,name:def.name,kind:def.kind,position,enemies:Array.from({length:def.guards},(_,i)=>`${def.id}-guard-${i}`)} as FrontierSite;}
 site.enemies.forEach((id,i)=>{if(w.enemies[id])return;const a=(i-(site.enemies.length-1)/2)*.7,x=site.position[0]+Math.sin(a)*3.8,z=site.position[2]-2.8+Math.cos(a),p:Vec3=[x,height(x,z)+.02,z],captain=i===0&&site.enemies.length>=4,hp=captain?170:92+site.enemies.length*8;w.enemies[id]={id,name:captain?'Outer March captain':'Outer March outlaw',role:captain?'captain':i%2?'raider':'scout',position:p,home:[...p],yaw:0,health:hp,maxHealth:hp,stamina:100,equipped:i%3===0?'bow':i%2?'sword':'axe',phase:'patrol',decisionAt:0,rewarded:false};});
 const chest=def.id;w.containers[chest]??={id:chest,name:def.name+' supplies',position:[...position],inventory:[{id:chest+'-iron',item:'iron',count:def.kind==='camp'?18:8,quality:1},{id:chest+'-hide',item:'hide',count:def.kind==='camp'?10:5,quality:1},{id:chest+'-stew',item:'hearty_stew',count:3,quality:1}],looted:false};
 const fire=def.id+'-fire';w.stations[fire]??={id:fire,name:def.name+' fire',kind:'campfire',position:[position[0]+2.8,height(position[0]+2.8,position[2]+1.8),position[2]+1.8]};
}

function addOuterResources(w:WorldState){const seed=(w.worldSeed??197709)^0x51a9e3,rng=seeded(seed);for(let gx=-600;gx<=600;gx+=18)for(let gz=-160;gz<=600;gz+=18){if(!farFromCore(gx,gz))continue;const x=gx+(rng()-.5)*12,z=gz+(rng()-.5)*12;if(Math.abs(x)>620||z>620||z<-175)continue;const id=idCell(gx,gz);if(w.resources[id])continue;const nearSite=Object.values(w.frontier?.sites??{}).some(s=>Math.hypot(x-s.position[0],z-s.position[2])<10);if(nearSite)continue;const y=height(x,z);if(!Number.isFinite(y)||y>75)continue;const open=Math.sin(x*.019)+Math.cos(z*.023)+Math.sin((x-z)*.009),rock=rng()<(Math.abs(x)>430?.28:.13);if(!rock&&open<-1.0)continue;w.resources[id]={id,kind:rock?'rock':'tree',position:[x,y,z],variant:Math.floor(rng()*3),health:rock?4:6,phase:'standing',rotation:rng()*Math.PI*2,scale:.78+rng()*.38};if(rng()<.19){const fid='nature-forage-'+id,fx=x+2.8,fz=z+2.1;w.forage[fid]??={id:fid,kind:(['berries','mushroom','herb','wood'] as const)[Math.floor(rng()*4)],position:[fx,height(fx,fz),fz],harvested:false};}}
}

const WILDLIFE:readonly {id:string;kind:AnimalState['kind'];x:number;z:number;packId?:string}[]=[
 {id:'outer-deer-grey-1',kind:'deer',x:-420,z:285},{id:'outer-deer-grey-2',kind:'deer',x:-414,z:290},{id:'outer-bear-grey',kind:'bear',x:-510,z:405},
 {id:'outer-wolfpine-bison-1',kind:'bison',x:385,z:345},{id:'outer-wolfpine-bison-2',kind:'bison',x:394,z:350},{id:'outer-wolfpine-wolf-1',kind:'wolf',x:360,z:365,packId:'outer-wolfpine-pack'},{id:'outer-wolfpine-wolf-2',kind:'wolf',x:365,z:369,packId:'outer-wolfpine-pack'},{id:'outer-wolfpine-wolf-3',kind:'wolf',x:369,z:363,packId:'outer-wolfpine-pack'},
 {id:'outer-blackfen-deer',kind:'deer',x:-350,z:500},{id:'outer-blackfen-bear',kind:'bear',x:-390,z:550},{id:'outer-step-bison-1',kind:'bison',x:330,z:520},{id:'outer-step-bison-2',kind:'bison',x:342,z:524},
 {id:'outer-stonewake-eagle',kind:'eagle',x:35,z:560},{id:'outer-stonewake-hare',kind:'hare',x:22,z:552},{id:'outer-stonewake-crow',kind:'crow',x:-18,z:548},
];
function addOuterWildlife(w:WorldState){w.animals??={};for(const def of WILDLIFE){if(w.animals[def.id])continue;const p:Vec3=[def.x,height(def.x,def.z),def.z];w.animals[def.id]={id:def.id,kind:def.kind,position:p,home:[...p],yaw:0,phase:0,packId:def.packId};}}

/** Additive for old saves and deterministic for new saves. Never removes player work. */
export function expandFrontierWorld(world:WorldState){const w=ensureRuntimeWorld(world);if(!w.frontier)return w;for(const site of OUTER_SITES)addSite(w,site);addOuterResources(w);addOuterWildlife(w);if(!w.progress.includes('world-expansion-v1'))w.progress.push('world-expansion-v1');return w;}
