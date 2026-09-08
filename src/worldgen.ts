import {height,roadX} from './terrain';
import {forestDensity,forestEdge,meadowDensity} from './ecology';
import {dressingZones,insideDressingZone} from './world-dressing';
import type {WorldState,Vec3,PlayerState,ForageState,ItemId} from './state';
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
const mod=(n:number,m:number)=>((n%m)+m)%m;

/**
 * Dense gathering uses the renderer's existing streaming contract rather than
 * creating one live mesh/collider per world node. `wild-resource-*` trees and
 * rocks are rendered as 64m InstancedMesh proxy cells by FrontierRenderer and
 * only promoted to full authored models + Rapier colliders near the survivor.
 * Forage remains small/cheap and is already distance-gated by Nature.
 */
export const RESOURCE_FIELD_CELL=48;
export const DENSE_RESOURCE_PREFIX='wild-resource-dense-v1-';
export const DENSE_FORAGE_PREFIX='nature-dense-v1-';
export const DENSE_GATHERABLE_ITEMS:readonly ItemId[]=['fiber','berries','mushroom','herb','wood','wild_garlic','juniper','sage','truffle','pine_resin','wild_honey'];
const COMMON_FORAGE:readonly ItemId[]=['fiber','berries','mushroom','herb','wood','wild_garlic','juniper','sage','pine_resin'];
const FORAGE_VISUAL:Record<string,NonNullable<ForageState['kind']>>={fiber:'fiber',berries:'berries',mushroom:'mushroom',herb:'herb',wood:'wood',wild_garlic:'herb',juniper:'berries',sage:'herb',truffle:'mushroom',pine_resin:'wood',wild_honey:'wild_honey'};
const pointDistance=(p:Vec3,x:number,z:number)=>Math.hypot(p[0]-x,p[2]-z);

function gatherableForCell(cx:number,cz:number,slot:number,x:number,z:number):ItemId{
 const cell=(cx+7)*10+(cz+3),woods=forestDensity(x,z),edge=forestEdge(x,z),meadow=meadowDensity(x,z);
 if(slot===4&&cell%11===0&&woods>.28)return 'truffle';
 if(slot===4&&cell%13===0&&edge>.2)return 'wild_honey';
 let item=COMMON_FORAGE[mod(cell*3+slot*5,COMMON_FORAGE.length)];
 if(item==='fiber'&&meadow<.42)item='herb';
 if(item==='pine_resin'&&woods<.25)item='wood';
 if(item==='juniper'&&regionAt(x,z)==='The Far March'&&edge<.22)item='berries';
 return item;
}
function forageSuitability(item:ItemId,x:number,z:number){
 const woods=forestDensity(x,z),edge=forestEdge(x,z),meadow=meadowDensity(x,z),region=regionAt(x,z);
 if(item==='fiber')return meadow*(1-woods*.45);
 if(item==='mushroom'||item==='truffle')return .2+woods*.8;
 if(item==='pine_resin')return .15+woods*.85;
 if(item==='wild_honey')return .25+edge*.75;
 if(item==='berries')return .35+edge*.35+meadow*.3;
 if(item==='juniper')return .32+edge*.28+((region==='Briar Heath'||region==='Ironward Heights') ? .35 : .08);
 if(item==='wild_garlic'||item==='sage'||item==='herb')return .3+edge*.3+meadow*.4;
 if(item==='wood')return .3+woods*.7;
 return .6;
}

/**
 * Additive, deterministic raw-resource population for both new and old saves.
 * IDs are cell-addressed and slot-addressed, so harvesting state is never
 * rerolled when the generator runs again. Processed crafting goods intentionally
 * remain crafted; this layer puts their raw inputs into the physical world.
 */
export function seedDenseResources(w:WorldState,seed=w.worldSeed??197709){
 const zones=dressingZones(w),resources=Object.values(w.resources).map(r=>r.position),forage=Object.values(w.forage).map(f=>f.position),structures=Object.values(w.structures),stations=Object.values(w.stations);
 const resourceClear=(x:number,z:number,spacing:number)=>trailDistance(x,z)>4.2&&!insideDressingZone(x,z,zones,1.5)&&!structures.some(s=>pointDistance(s.position,x,z)<3.2)&&!stations.some(s=>pointDistance(s.position,x,z)<2.8)&&!resources.some(p=>pointDistance(p,x,z)<spacing);
 const forageClear=(x:number,z:number)=>trailDistance(x,z)>2.7&&!insideDressingZone(x,z,zones,.65)&&!structures.some(s=>pointDistance(s.position,x,z)<2.3)&&!stations.some(s=>pointDistance(s.position,x,z)<1.8)&&!resources.some(p=>pointDistance(p,x,z)<1.65)&&!forage.some(p=>pointDistance(p,x,z)<2.35);
 for(let cx=-7;cx<=6;cx++)for(let cz=-3;cz<=6;cz++){
  for(let slot=0;slot<7;slot++){
   const id=`${DENSE_RESOURCE_PREFIX}${cx}-${cz}-${slot}`;if(w.resources[id])continue;
   const rng=seeded(seed^Math.imul(cx+37,73856093)^Math.imul(cz+41,19349663)^Math.imul(slot+11,83492791));
   for(let attempt=0;attempt<8;attempt++){
    const x=cx*RESOURCE_FIELD_CELL+4+rng()*(RESOURCE_FIELD_CELL-8),z=cz*RESOURCE_FIELD_CELL+4+rng()*(RESOURCE_FIELD_CELL-8),y=height(x,z);if(y<-.85||!resourceClear(x,z,3.7))continue;
    const woods=forestDensity(x,z),region=regionAt(x,z),rockBias=(region==='Ironward Heights'?.48:region==='Briar Heath'?.28:region==='The Far March'?.18:.16)+(1-woods)*.12;
    let kind:'tree'|'rock'=rng()<rockBias?'rock':'tree';if(kind==='tree'&&woods<.13&&rng()<.7)kind='rock';if(kind==='rock'&&woods>.72&&region!=='Ironward Heights'&&rng()<.48)kind='tree';
    const scale=kind==='tree'?.76+rng()*.34+woods*.08:.72+rng()*.34;w.resources[id]={id,kind,position:[x,y,z],variant:Math.floor(rng()*3),health:kind==='tree'?6:4,phase:'standing',rotation:rng()*Math.PI*2,scale};resources.push(w.resources[id].position);break;
   }
  }
  for(let slot=0;slot<5;slot++){
   const id=`${DENSE_FORAGE_PREFIX}${cx}-${cz}-${slot}`;if(w.forage[id])continue;
   const rng=seeded((seed^0x51f15e)^Math.imul(cx+53,73856093)^Math.imul(cz+59,19349663)^Math.imul(slot+17,83492791));
   for(let attempt=0;attempt<10;attempt++){
    const x=cx*RESOURCE_FIELD_CELL+3+rng()*(RESOURCE_FIELD_CELL-6),z=cz*RESOURCE_FIELD_CELL+3+rng()*(RESOURCE_FIELD_CELL-6),y=height(x,z);if(y<-.8||!forageClear(x,z))continue;
    const item=gatherableForCell(cx,cz,slot,x,z),fit=forageSuitability(item,x,z);if(rng()>.35+fit*.65)continue;
    w.forage[id]={id,kind:FORAGE_VISUAL[item],item,position:[x,y,z],harvested:false};forage.push(w.forage[id].position);break;
   }
  }
 }
}

/** Versioned additive generation: existing resources, structures and looted sites always win. */
export function seedFrontier(w:WorldState,seed=w.worldSeed??197709){
 w.worldSeed??=seed;
 if(w.frontier){seedDenseResources(w,w.worldSeed);return;}
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
 w.frontier={version:1,seed,sites};seedDenseResources(w,seed);
}
export function frontierObjective(w:WorldState,p:PlayerState){const site=p.frontierTarget?w.frontier?.sites[p.frontierTarget]:undefined;if(!site)return;const guards=site.enemies.filter(id=>w.enemies[id]?.health>0).length;return {title:site.name.toUpperCase(),text:guards?`Defeat ${guards} guards, then E at the supply chest`:'E at the supply chest · campfire nearby',position:site.position};}
export function trackFrontier(w:WorldState,p:PlayerState,id:string){if(id===''){p.frontierTarget=undefined;return {ok:true,message:'Frontier route cleared'};}if(!w.frontier?.sites[id])return {ok:false,message:'Unknown frontier location'};p.frontierTarget=id;if(p.bounties)p.bounties.active=undefined;return {ok:true,message:w.frontier.sites[id].name+' marked on your minimap'};}
