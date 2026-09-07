import {height,roadX} from './terrain';
import type {WorldState,Vec3,PlayerState} from './state';
export const WORLD_SIZE=768;
export const REGIONS=[{name:'Southwood',x:0,z:190},{name:'Ironward Heights',x:210,z:35},{name:'Briar Heath',x:-195,z:85}];
export interface FrontierSite {id:string;name:string;kind:'camp'|'cache'|'rest';position:Vec3;enemies:string[]}
export interface Frontier {version:1;seed:number;sites:Record<string,FrontierSite>}
export function seeded(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function regionAt(x:number,z:number){return Math.abs(x)<85&&z<65?'The Far March':x>95?'Ironward Heights':x<-95?'Briar Heath':'Southwood';}
export function frontierArea(x:number,z:number){return Math.abs(x)<335&&z>-95&&z<335&&(Math.abs(x)>95||z>75);}
export function trailZ(x:number){return 65+Math.sin(x*.027)*13;}
export function trailDistance(x:number,z:number){return Math.min(Math.abs(x-roadX(z)),Math.abs(z-trailZ(x)));}
const distance=(a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
/** Versioned additive generation: existing resources, structures and looted sites always win. */
export function seedFrontier(w:WorldState,seed=w.worldSeed??197709){
 if(w.frontier)return;w.worldSeed=seed;
 const rng=seeded(seed),sites:Record<string,FrontierSite>={};
 const occupied=(p:Vec3,r:number)=>Object.values(w.structures).some(s=>distance(s.position,p)<r)||Object.values(w.stations).some(s=>distance(s.position,p)<r)||Object.values(w.resources).some(s=>distance(s.position,p)<r)||Object.values(sites).some(s=>distance(s.position,p)<r);
 for(const [i,base] of [[0,[20,105]],[1,[-40,205]],[2,[145,65]],[3,[260,25]],[4,[-150,75]],[5,[-245,145]]] as const){
  let position:Vec3|undefined;for(let n=0;n<50;n++){const x=base[0]+(rng()-.5)*22,z=base[1]+(rng()-.5)*22,p:Vec3=[x,height(x,z),z];if(p[1]>-.5&&!occupied(p,13)){position=p;break;}}if(!position)continue;
  const id='frontier-'+i,kind=i%3===0?'rest':i%3===1?'cache':'camp',names=['The Southroad Watchfire','The Lost Timber Stockpile','Ironward Toll Camp','The Ridge Prospectors','Briar Supply Hollow','The Heath Reavers'];
  const site=sites[id]={id,name:names[i],kind,position,enemies:kind==='camp'?[id+'-guard-0',id+'-guard-1']:[]};
  site.enemies.forEach((id,j)=>{const x=position![0]+(j?2:-2),z=position![2]-3,p:Vec3=[x,height(x,z)+.02,z];w.enemies[id]??={id,name:j?'Frontier raider':'Frontier lookout',position:p,home:[...p],yaw:0,health:j?96:72,maxHealth:j?96:72,stamina:100,equipped:j?'sword':'axe',phase:'patrol',decisionAt:0,rewarded:false};});
  w.containers[id]??={id,name:site.name+' supplies',position:[...position],inventory:[{id:id+'-iron',item:'iron',count:kind==='camp'?14:6,quality:1},{id:id+'-hide',item:'hide',count:kind==='camp'?8:4,quality:1},{id:id+'-meal',item:'hearty_stew',count:2,quality:1}],looted:false};
  const fire=id+'-fire';w.stations[fire]??={id:fire,name:site.name+' fire',kind:'campfire',position:[position[0]+3,height(position[0]+3,position[2]+2),position[2]+2]};
 }
 // Stable grid cells, jittered and culled into groves / open heath; roads and sites stay clear.
 let index=0;
 for(let x=-330;x<335;x+=13)for(let z=-90;z<335;z+=13){
  const px=x+rng()*9,pz=z+rng()*9;if(!frontierArea(px,pz)||trailDistance(px,pz)<5)continue;
  const region=regionAt(px,pz),density=region==='Southwood'?.85:region==='Briar Heath'?.38:.5;
  if(rng()>density)continue;const p:Vec3=[px,height(px,pz),pz];if(p[1]<-1||occupied(p,7))continue;
  const rock=rng()<(region==='Ironward Heights'?.38:.13),id='wild-resource-'+index++;
  w.resources[id]??={id,kind:rock?'rock':'tree',position:p,variant:Math.floor(rng()*3),health:rock?4:6,phase:'standing',rotation:rng()*Math.PI*2,scale:.82+rng()*.28};
  if(index%4===0){const id='nature-forage-wild-'+index,fx=px+3,fz=pz+2;w.forage[id]??={id,kind:(['mushroom','berries','herb','wood'] as const)[index/4%4],position:[fx,height(fx,fz),fz],harvested:false};}
 }
 w.animals??={};REGIONS.forEach((region,i)=>{for(let j=0;j<2;j++){const id=`frontier-wildlife-${i}-${j}`,x=region.x+8+j*6,z=region.z+4,p:Vec3=[x,height(x,z),z];w.animals![id]??={id,kind:j?'crow':'hare',position:p,home:[...p],yaw:rng()*6.28,phase:rng()*5};}});
 w.frontier={version:1,seed,sites};
}
export function frontierObjective(w:WorldState,p:PlayerState){const site=p.frontierTarget?w.frontier?.sites[p.frontierTarget]:undefined;if(!site)return;const guards=site.enemies.filter(id=>w.enemies[id]?.health>0).length;return {title:site.name.toUpperCase(),text:guards?`Defeat ${guards} guards, then E at the supply chest`:'E at the supply chest · campfire nearby',position:site.position};}
export function trackFrontier(w:WorldState,p:PlayerState,id:string){if(id===''){p.frontierTarget=undefined;return {ok:true,message:'Frontier route cleared'};}if(!w.frontier?.sites[id])return {ok:false,message:'Unknown frontier location'};p.frontierTarget=id;if(p.bounties)p.bounties.active=undefined;return {ok:true,message:w.frontier.sites[id].name+' marked on your minimap'};}
